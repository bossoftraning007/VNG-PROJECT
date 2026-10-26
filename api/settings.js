/* Vercel serverless: GET /api/settings, PUT /api/settings */
const { read, write } = require('../lib/storage');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return res.json(read('settings', {}));
  }
  if (req.method === 'PUT') {
    write('settings', req.body);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};