/* Vercel serverless: GET /api/posters, POST /api/posters, DELETE /api/posters/:idx */
const { read, write } = require('../lib/storage');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return res.json(read('posters', []));
  }
  if (req.method === 'POST') {
    const posters = read('posters', []);
    posters.unshift(req.body);
    write('posters', posters);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const idx = parseInt(req.url.split('/').pop(), 10);
    const posters = read('posters', []);
    posters.splice(idx, 1);
    write('posters', posters);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};