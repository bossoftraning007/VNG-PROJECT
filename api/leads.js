/* Vercel serverless: GET /api/leads, POST /api/leads, DELETE /api/leads/:id, DELETE /api/leads */
const { read, write, del, removeAll } = require('../lib/storage');

module.exports = (req, res) => {
  if (req.method === 'GET') {
    return res.json(read('leads', []));
  }
  if (req.method === 'POST') {
    const leads = read('leads', []);
    const lead = req.body || {};
    lead.id = lead.id || Date.now() + Math.random();
    lead.time = lead.time || new Date().toISOString();
    lead.tag = lead.tag || '';
    lead.status = lead.status || '';
    lead.notes = lead.notes || '';
    lead.followUp = lead.followUp || '';
    leads.unshift(lead);
    write('leads', leads);
    return res.json({ ok: true, id: lead.id });
  }
  if (req.method === 'DELETE') {
    const id = req.url.split('/').pop();
    if (id && id !== 'leads') {
      del('leads', id);
      return res.json({ ok: true });
    }
    removeAll('leads');
    return res.json({ ok: true });
  }
  res.status(405).json({ error: 'Method not allowed' });
};