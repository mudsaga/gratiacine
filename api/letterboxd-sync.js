// Serverless function to fetch and parse Letterboxd RSS feed for a user
// Extended: optionally writes to Firestore if FIREBASE_SERVICE_ACCOUNT is provided and write=true

const fetch = require('node-fetch');
const xml2js = require('xml2js');

let admin = null;
let firestore = null;

function initFirebaseAdmin() {
  if(admin) return;
  try {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if(!saJson) return;
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

module.exports = async (req, res) => {
  const username = req.query.username;
  if(!username) return res.status(400).json({ error: 'username query param required' });

  const feedUrl = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
  try {
    const r = await fetch(feedUrl, { headers: { 'User-Agent': 'GratiaBot/1.0 (+https://github.com/mudsaga/gratiacine)' } });
    if(!r.ok) return res.status(502).json({ error: 'failed to fetch feed', status: r.status });
    const xml = await r.text();
    xml2js.parseString(xml, { explicitArray: false }, async (err, result) => {
      if(err) return res.status(500).json({ error: 'xml parse error', detail: err.message });
      const items = result.rss && result.rss.channel && result.rss.channel.item ? result.rss.channel.item : [];
      const list = Array.isArray(items) ? items : (items ? [items] : []);
      const entries = list.map(it => ({
        title: it.title || '',
        link: it.link || '',
        pubDate: it.pubDate || '',
        description: it.description || ''
      }));

      // Optionally write to Firestore if admin is configured and write=true
      const write = (req.query.write === 'true');
      if(write && process.env.FIREBASE_SERVICE_ACCOUNT) {
        initFirebaseAdmin();
        if(firestore) {
          const batch = firestore.batch();
          const collection = firestore.collection('letterboxd_feeds').doc(username).collection('entries');
          for(const e of entries) {
            // Use a deterministic id (hash of link or title+pubDate)
            const id = Buffer.from((e.link || e.title + '|' + e.pubDate)).toString('base64');
            const docRef = collection.doc(id);
            batch.set(docRef, { ...e, syncedAt: new Date().toISOString() }, { merge: true });
          }
          await batch.commit();
        }
      }

      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      res.json({ username, count: entries.length, entries });
    });
  } catch(err) {
    res.status(500).json({ error: 'exception', detail: err.message });
  }
};
