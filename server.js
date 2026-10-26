/* VNG Projects — backend server (Node.js + Express)
   Persists leads, plot status, photos, posters and settings server-side so
   data survives browser clears, incognito sessions and cross-device access.
   Run:  node server.js   (default port 3000)
   ====================================================================== */
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
// Use /tmp on Vercel (writable), ./data locally
const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? path.join(os.tmpdir(), 'vng-data') : path.join(__dirname, 'data');

const DB = {
  leads: path.join(DATA_DIR, 'leads.json'),
  plots: path.join(DATA_DIR, 'plots.json'),
  photos: path.join(DATA_DIR, 'photos.json'),
  posters: path.join(DATA_DIR, 'posters.json'),
  settings: path.join(DATA_DIR, 'settings.json')
};

function read(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return def; }
}
function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function seed() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB.leads)) write(DB.leads, []);
  if (!fs.existsSync(DB.plots)) {
    const p = {};
    for (let i = 1; i <= 280; i++) p[i] = { status: 'available', buyer: '', phone: '' };
    write(DB.plots, p);
  }
  if (!fs.existsSync(DB.photos)) write(DB.photos, []);
  if (!fs.existsSync(DB.posters)) write(DB.posters, [
    { id: 'p-seed-1', src: 'images/project-1-alair.jpg', title: 'Future Highway @ Alair',
      subtitle: 'DTCP Approved · RERA Registered · NH-163',
      body: 'Premium residential plots of 135–500 sq. yards at Sharajipet village, Alair Mandal, Yadadri-Bhongir. Base price ₹12,000 per sq. yard, negotiable. 280 plots with Srigandham sandalwood plantation, swimming pool and underground drainage.',
      cta: 'View Project', ctaLink: 'projects/future-highway-alair/', date: '2025-01-01', type: 'image' }
  ]);
  if (!fs.existsSync(DB.settings)) write(DB.settings, {
    whatsapp: '919505903371', phoneDisplay: '+91 95059 03371',
    phone: '+919505903371', secondaryPhone: '+919849754071',
    secondaryPhoneDisplay: '+91 98497 54071', email: 'rasamallaganesh13@gmail.com',
    address: '4-9-870, Lecturers Colony, Hayath Nagar, Hyderabad, Rangareddy, Telangana 501505'
  });
}
seed();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname), { index: false }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/projects', express.static(path.join(__dirname, 'projects')));

/* ---------- API ---------- */
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/leads', (req, res) => res.json(read(DB.leads, [])));
app.post('/api/leads', (req, res) => {
  const leads = read(DB.leads, []);
  const lead = req.body || {};
  lead.id = lead.id || Date.now() + Math.random();
  lead.time = lead.time || new Date().toISOString();
  lead.tag = lead.tag || '';
  lead.status = lead.status || '';
  lead.notes = lead.notes || '';
  lead.followUp = lead.followUp || '';
  leads.unshift(lead);
  write(DB.leads, leads);
  res.json({ ok: true, id: lead.id });
});
app.delete('/api/leads/:id', (req, res) => {
  let leads = read(DB.leads, []);
  leads = leads.filter(l => String(l.id) !== String(req.params.id));
  write(DB.leads, leads);
  res.json({ ok: true });
});
app.delete('/api/leads', (req, res) => {
  write(DB.leads, []);
  res.json({ ok: true });
});

app.get('/api/plots', (req, res) => res.json(read(DB.plots, {})));
app.put('/api/plots/:num', (req, res) => {
  const plots = read(DB.plots, {});
  const num = String(req.params.num);
  plots[num] = req.body || plots[num] || { status: 'available', buyer: '', phone: '' };
  write(DB.plots, plots);
  res.json({ ok: true });
});

app.get('/api/photos', (req, res) => res.json(read(DB.photos, [])));
app.post('/api/photos', (req, res) => {
  const photos = read(DB.photos, []);
  photos.unshift(req.body);
  write(DB.photos, photos);
  res.json({ ok: true });
});
app.delete('/api/photos/:idx', (req, res) => {
  const photos = read(DB.photos, []);
  photos.splice(parseInt(req.params.idx, 10), 1);
  write(DB.photos, photos);
  res.json({ ok: true });
});

app.get('/api/posters', (req, res) => res.json(read(DB.posters, [])));
app.post('/api/posters', (req, res) => {
  const posters = read(DB.posters, []);
  posters.unshift(req.body);
  write(DB.posters, posters);
  res.json({ ok: true });
});
app.delete('/api/posters/:idx', (req, res) => {
  const posters = read(DB.posters, []);
  posters.splice(parseInt(req.params.idx, 10), 1);
  write(DB.posters, posters);
  res.json({ ok: true });
});

app.get('/api/settings', (req, res) => res.json(read(DB.settings, {})));
app.put('/api/settings', (req, res) => {
  write(DB.settings, req.body);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`VNG Projects backend running on http://localhost:${PORT}`);
});

/* Clean-URL routes so /admin and /projects/future-highway-alair work
   without .html extensions (matches the old Vercel rewrites). */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'index.html')));
app.get('/admin/', (req, res) => res.redirect('/admin'));
app.get('/projects/future-highway-alair', (req, res) => res.sendFile(path.join(__dirname, 'projects', 'future-highway-alair', 'index.html')));
app.get('/projects/future-highway-alair/', (req, res) => res.redirect('/projects/future-highway-alair'));