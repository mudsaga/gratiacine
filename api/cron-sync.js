// Cron-style serverless endpoint to synchronize configured Letterboxd usernames
// It will fetch feeds, detect new entries, insert into Firestore historyMovies, and call TMDb proxy to enrich director data.

const fetch = require('node-fetch');
const xml2js = require('xml2js');

const TMDB_PROXY_BASE = process.env.TMDB_PROXY_URL || null; // optional

let admin = null;
let firestore = null;

function initFirebaseAdmin() {
  if(admin) return;
  try {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if(!saJson) throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
    const sa = JSON.parse(saJson);
    admin = require('firebase-admin');
    admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: sa.project_id + '.appspot.com' });
    firestore = admin.firestore();
  } catch (e) {
    console.error('Failed to init firebase admin:', e.message);
    admin = null;
    firestore = null;
  }
}

async function fetchLetterboxdEntries(username) {
  const feedUrl = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
  const r = await fetch(feedUrl, { headers: { 'User-Agent': 'GratiaBot/1.0 (+https://github.com/mudsaga/gratiacine)' } });
  if(!r.ok) throw new Error('failed to fetch feed: ' + r.status);
  const xml = await r.text();
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if(err) return reject(err);
      const items = result.rss && result.rss.channel && result.rss.channel.item ? result.rss.channel.item : [];
      const list = Array.isArray(items) ? items : (items ? [items] : []);
      const entries = list.map(it => ({ title: it.title || '', link: it.link || '', pubDate: it.pubDate || '', description: it.description || '' }));
      resolve(entries);
    });
  });
}

async function callTmdbProxy(title, year) {
  try {
    if(TMDB_PROXY_BASE) {
      const url = `${TMDB_PROXY_BASE.replace(/\/+$/, '')}/api/tmdb-proxy?title=${encodeURIComponent(title)}${year ? '&year='+encodeURIComponent(year): ''}`;
      const r = await fetch(url);
      if(!r.ok) return null;
      return await r.json();
    } else if(process.env.TMDB_API_KEY) {
      // call external TMDb directly
      const key = process.env.TMDB_API_KEY;
      const q = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(title)}${year ? '&year='+encodeURIComponent(year) : ''}`;
      const resp = await fetch(q);
      const data = await resp.json();
      if(data.results && data.results.length) {
        const movie = data.results[0];
        const detailsResp = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${key}&append_to_response=credits`);
        const details = await detailsResp.json();
        const director = (details.credits && details.credits.crew) ? details.credits.crew.find(c => c.job === 'Director') : null;
        return { movie: details, director: director || null };
      }
      return null;
    }
  } catch(e) {
    console.error('tmdb proxy call failed', e.message);
    return null;
  }
}

module.exports = async (req, res) => {
  // protect with a simple secret (set SYNC_SECRET env)
  const secret = process.env.SYNC_SECRET;
  if(secret && req.query.secret !== secret) return res.status(401).json({ error: 'unauthorized' });

  // list of usernames from env or defaulted to the group you provided
  const usernamesEnv = process.env.LETTERBOXD_USERNAMES || 'emillysena,erllendur,rebecavitoria,mylenateodoro,kamiewho,nayaxs,brunovontorres,mudsaga';
  const usernames = usernamesEnv.split(',').map(s => s.trim()).filter(Boolean);

  try {
    initFirebaseAdmin();
    if(!firestore) return res.status(500).json({ error: 'firebase admin not initialized' });

    const results = [];
    for(const username of usernames) {
      try {
        const entries = await fetchLetterboxdEntries(username);
        const userDocRef = firestore.collection('users_by_letterboxd').doc(username);
        const known = (await userDocRef.get()).data() || { seenIds: [] };
        const seenIds = new Set(known.seenIds || []);

        for(const e of entries) {
          const id = Buffer.from((e.link || e.title + '|' + e.pubDate)).toString('base64');
          if(seenIds.has(id)) continue; // already recorded

          // new entry -> add to historyMovies
          const historyDoc = {
            title: e.title,
            source: 'letterboxd',
            username: username,
            link: e.link,
            pubDate: e.pubDate,
            description: e.description,
            createdAt: new Date().toISOString()
          };

          const docRef = await firestore.collection('historyMovies').add(historyDoc);

          // try to enrich with TMDb
          const yearMatch = (e.title || '').match(/\((\d{4})\)$/);
          let titleOnly = e.title;
          let year = null;
          if(yearMatch) {
            year = yearMatch[1];
            titleOnly = e.title.replace(/\s*\(\d{4}\)$/, '').trim();
          }

          const enrich = await callTmdbProxy(titleOnly, year);
          if(enrich && enrich.movie) {
            const movie = enrich.movie;
            const director = enrich.director ? { name: enrich.director.name, id: enrich.director.id, tmdb: enrich.director } : null;
            // update history doc
            await docRef.set({ tmdb: movie, imdb_id: movie.imdb_id || null, director: director }, { merge: true });

            // update directors collection
            if(director) {
              const dirName = director.name;
              const dirRef = firestore.collection('directors').doc(dirName);
              const snapshot = await dirRef.get();
              if(snapshot.exists) {
                await dirRef.update({ count: admin.firestore.FieldValue.increment(1), updatedAt: new Date().toISOString() });
              } else {
                await dirRef.set({ name: dirName, count: 1, tmdb: director, createdAt: new Date().toISOString() });
              }
            }
          }

          seenIds.add(id);
        }

        // persist seenIds
        await userDocRef.set({ seenIds: Array.from(seenIds), updatedAt: new Date().toISOString() }, { merge: true });

        results.push({ username, new: entries.length });
      } catch(err) {
        console.error('sync for', username, 'failed', err.message);
        results.push({ username, error: err.message });
      }
    }

    res.json({ ok: true, results });
  } catch(err) {
    console.error('cron-sync error', err);
    res.status(500).json({ error: err.message });
  }
};
