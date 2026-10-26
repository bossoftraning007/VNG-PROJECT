/* Vercel serverless: GET /api/plots, PUT /api/plots/:num */
const { read, write } = require('../lib/storage');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return res.json(read('plots', {}));
  }
  if (req.method === 'PUT') {
    const num = req.url.split('/').pop();
    const plots = read('plots', {});
    plots[num] = req.body || plots[num] || { status: 'available', buyer: '', phone: '' };
    write('plots', plots);
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};