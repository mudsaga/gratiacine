// TMDb proxy to search movie and return main data incl. director
// Expects TMDB_API_KEY in env. Deploy as /api/tmdb-proxy

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const key = process.env.TMDB_API_KEY;
  if(!key) return res.status(500).json({ error: 'TMDB_API_KEY not configured in env' });

  const title = req.query.title || req.body && req.body.title;
  const year = req.query.year || req.body && req.body.year;
  const imdbId = req.query.imdb_id || req.body && req.body.imdb_id;

  try {
    let movie = null;
    if(imdbId) {
      const resp = await fetch(`https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?api_key=${key}&external_source=imdb_id`);
      const data = await resp.json();
      if(data.movie_results && data.movie_results.length) movie = data.movie_results[0];
    }

    if(!movie && title) {
      const q = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(title)}${year ? '&year='+encodeURIComponent(year) : ''}`;
      const resp = await fetch(q);
      const data = await resp.json();
      if(data.results && data.results.length) movie = data.results[0];
    }

    if(!movie) return res.status(404).json({ error: 'movie not found' });

    // fetch credits to find director
    const movieId = movie.id;
    const detailsResp = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${key}&append_to_response=credits`);
    const details = await detailsResp.json();

    const director = (details.credits && details.credits.crew) ? details.credits.crew.find(c => c.job === 'Director') : null;

    res.json({ movie: details, director: director || null });
  } catch(err) {
    res.status(500).json({ error: 'exception', detail: err.message });
  }
};
