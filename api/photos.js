/* Vercel serverless: GET /api/photos, POST /api/photos, DELETE /api/photos/:idx */
const { read, write, del } = require('../lib/storage');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return res.json(read('photos', []));
  }
  if (req.method === 'POST') {
    const photos = read('photos', []);
    photos.unshift(req.body);
    write('photos', photos);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const idx = parseInt(req.url.split('/').pop(), 10);
    const photos = read('photos', []);
    photos.splice(idx, 1);
    write('photos', photos);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};