// Serverless function to fetch and parse Letterboxd RSS feed for a user
// Deploy as /api/letterboxd-sync (Vercel/Netlify)

const fetch = require('node-fetch');
const xml2js = require('xml2js');

module.exports = async (req, res) => {
  const username = req.query.username;
  if(!username) return res.status(400).json({ error: 'username query param required' });

  const feedUrl = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
  try {
    const r = await fetch(feedUrl, { headers: { 'User-Agent': 'GratiaBot/1.0 (+https://github.com/mudsaga/gratiacine)' } });
    if(!r.ok) return res.status(502).json({ error: 'failed to fetch feed', status: r.status });
    const xml = await r.text();
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if(err) return res.status(500).json({ error: 'xml parse error', detail: err.message });
      const items = result.rss && result.rss.channel && result.rss.channel.item ? result.rss.channel.item : [];
      // normalize to array
      const list = Array.isArray(items) ? items : [items];
      const entries = list.map(it => ({
        title: it.title || '',
        link: it.link || '',
        pubDate: it.pubDate || '',
        description: it.description || ''
      }));
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      res.json({ username, count: entries.length, entries });
    });
  } catch(err) {
    res.status(500).json({ error: 'exception', detail: err.message });
  }
};
