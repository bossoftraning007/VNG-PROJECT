/* Admin JS - VNG Projects */
const ADMIN_EMAIL = 'rasamallaganesh71@gmail.com';
const PLOTS_TOTAL = 280;
let Leads = JSON.parse(localStorage.getItem('vng_leads') || '[]');
let PlotStatus = JSON.parse(localStorage.getItem('vng_plot_status') || '{}');
let Settings = JSON.parse(localStorage.getItem('vng_settings') || JSON.stringify({
  whatsapp: '919505903371',
  phoneDisplay: '+91 95059 03371',
  phone: '+919505903371',
  secondaryPhone: '+919849754071',
  secondaryPhoneDisplay: '+91 98497 54071',
  email: 'rasamallaganesh71@gmail.com',
  address: '4-9-870, Lecturers Colony, Hayath Nagar, Hyderabad, Rangareddy, Telangana 501505'
}));
let CurrentTab = 'dashboard';
let SelectedPlot = null;

function initPlots() {
  for (let i = 1; i <= PLOTS_TOTAL; i++) {
    if (!(i in PlotStatus)) PlotStatus[i] = { status: 'available', buyer: '', phone: '' };
  }
  savePlotStatus();
}
function saveLeads() { localStorage.setItem('vng_leads', JSON.stringify(Leads)); }
function savePlotStatus() { localStorage.setItem('vng_plot_status', JSON.stringify(PlotStatus)); }
function saveSettings() { localStorage.setItem('vng_settings', JSON.stringify(Settings)); }

function checkLogin() { return localStorage.getItem('vng_admin_logged_in') === 'true'; }
function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    localStorage.setItem('vng_admin_logged_in', 'true');
    document.getElementById('login-error').textContent = '';
    render();
  } else {
    document.getElementById('login-error').textContent = 'Wrong email.';
  }
}
function doLogout() { localStorage.removeItem('vng_admin_logged_in'); render(); }

function getStats() {
  const now = new Date();
  const weekAgo = new Date(now - 7*86400000);
  const monthAgo = new Date(now - 30*86400000);
  const leadsThisWeek = Leads.filter(l => new Date(l.time) >= weekAgo).length;
  const bookedThisMonth = Object.values(PlotStatus).filter(p => (p.status==='booked'||p.status==='sold') && p.bookedDate && new Date(p.bookedDate) >= monthAgo).length;
  const soldTotal = Object.values(PlotStatus).filter(p => p.status==='sold').length;
  const remaining = PLOTS_TOTAL - Object.values(PlotStatus).filter(p => p.status!=='available').length;
  return { leadsThisWeek, bookedThisMonth, soldTotal, remaining };
}

function switchTab(name) {
  CurrentTab = name;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab===name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id==='tab-'+name));
}

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s) { return escapeHtml(s); }
function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso); const now = new Date();
  const diff = Math.floor((now-d)/1000);
  if (diff < 60) return diff+'s ago';
  if (diff < 3600) return Math.floor(diff/60)+'m ago';
  if (diff < 86400) return Math.floor(diff/3600)+'h ago';
  return d.toLocaleDateString();
}

function leadRow(l) {
  return `<div class="lead-item">
    <div class="lead-info"><h4>${escapeHtml(l.name||'Unknown')}</h4>
    <div class="meta">${l.phone||'-'} | ${l.plotSize||'No size'} | ${formatTime(l.time)}</div>
    ${l.message?`<div class="meta">${escapeHtml(l.message)}</div>`:''}
    </div>
    <div class="lead-actions">
      <a class="btn btn-sm" href="https://wa.me/91${(l.phone||'').replace(/\D/g,'')}?text=${encodeURIComponent('Hello '+(l.name||'')+', regarding your enquiry')}" target="_blank">WhatsApp</a>
      ${l.phone?`<a class="btn btn-secondary btn-sm" href="tel:+91${l.phone.replace(/\D/g,'')}">Call</a>`:''}
      <button class="btn btn-danger btn-sm" onclick="deleteLead(${l.id})">&times;</button>
    </div></div>`;
}
function deleteLead(id) { Leads = Leads.filter(l => l.id!==id); saveLeads(); render(); }

function editPlot(num) {
  const p = PlotStatus[num] || { status:'available', buyer:'', phone:'' };
  SelectedPlot = num;
  document.getElementById('plot-edit-modal').innerHTML = `
    <div class="card"><h3>Plot ${num}</h3>
    <div class="form-group"><label>Status</label><select id="pe-status">
      <option value="available" ${p.status==='available'?'selected':''}>Available</option>
      <option value="booked" ${p.status==='booked'?'selected':''}>Booked</option>
      <option value="advance" ${p.status==='advance'?'selected':''}>Advance Paid</option>
      <option value="sold" ${p.status==='sold'?'selected':''}>Sold</option>
    </select></div>
    <div class="form-group"><label>Buyer Name</label><input type="text" id="pe-buyer" value="${escapeAttr(p.buyer)}"></div>
    <div class="form-group"><label>Buyer Phone</label><input type="text" id="pe-phone" value="${escapeAttr(p.phone)}"></div>
    <div style="display:flex;gap:0.5rem"><button class="btn" onclick="savePlot()">Save</button>
    <button class="btn btn-secondary" onclick="closePlotModal()">Cancel</button></div></div>`;
  document.getElementById('plot-edit-modal').classList.add('show');
}
function savePlot() {
  if (SelectedPlot===null) return;
  PlotStatus[SelectedPlot] = {
    status: document.getElementById('pe-status').value,
    buyer: document.getElementById('pe-buyer').value.trim(),
    phone: document.getElementById('pe-phone').value.trim(),
    bookedDate: ['booked','advance','sold'].includes(document.getElementById('pe-status').value) ? new Date().toISOString() : null
  };
  savePlotStatus(); closePlotModal(); render();
}
function closePlotModal() { document.getElementById('plot-edit-modal').classList.remove('show'); SelectedPlot=null; }

function handlePhotoUpload(e) {
  const files = Array.from(e.target.files);
  const gallery = JSON.parse(localStorage.getItem('vng_photos')||'[]');
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => { gallery.push(ev.target.result); localStorage.setItem('vng_photos', JSON.stringify(gallery)); render(); };
    reader.readAsDataURL(file);
  });
}
function removePhoto(i) {
  const gallery = JSON.parse(localStorage.getItem('vng_photos')||'[]');
  gallery.splice(i,1); localStorage.setItem('vng_photos', JSON.stringify(gallery)); render();
}

function render() {
  if (!checkLogin()) {
    document.getElementById('admin-app').innerHTML = `<div class="login-page"><div class="login-card">
      <h2>VNG Projects Admin</h2><p class="sub">Future Highway @ Alair</p>
      <form id="login-form"><input type="email" id="login-email" placeholder="Enter admin email" required>
      <div id="login-error" class="error"></div><button type="submit" class="btn" style="width:100%">Login</button></form></div></div>`;
    document.getElementById('login-form').addEventListener('submit', doLogin);
    return;
  }
  const stats = getStats();
  const app = document.getElementById('admin-app');

  if (CurrentTab === 'dashboard') {
    app.innerHTML = `<div class="admin-nav">
      <a href="#" onclick="switchTab('dashboard');return false">Dashboard</a>
      <a href="#" onclick="switchTab('leads');return false">Leads</a>
      <a href="#" onclick="switchTab('plots');return false">Plots</a>
      <a href="#" onclick="switchTab('upload');return false">Photos</a>
      <a href="#" onclick="switchTab('settings');return false">Settings</a>
      <span class="spacer"></span><a class="logout" href="#" onclick="doLogout();return false">Logout</a></div>
      <div class="admin-content"><div class="flash success">Logged in</div>
      <h1 class="section-title">Dashboard</h1><div class="stat-grid">
      <div class="stat-card"><h3>Leads This Week</h3><div class="stat-num">${stats.leadsThisWeek}</div></div>
      <div class="stat-card"><h3>Plots Booked This Month</h3><div class="stat-num">${stats.bookedThisMonth}</div></div>
      <div class="stat-card"><h3>Plots Sold Total</h3><div class="stat-num">${stats.soldTotal}</div></div>
      <div class="stat-card"><h3>Plots Remaining</h3><div class="stat-num">${stats.remaining}</div></div></div>
      <h2 class="section-title">Recent Leads</h2><div class="lead-list">${Leads.slice(0,5).map(l=>leadRow(l)).join('')||'<div class="empty-state">No leads yet</div>'}</div></div>`;
  }
  else if (CurrentTab === 'leads') {
    app.innerHTML = `<div class="admin-nav">
      <a href="#" onclick="switchTab('dashboard');return false">Dashboard</a>
      <a href="#" class="active" onclick="switchTab('leads');return false">Leads</a>
      <a href="#" onclick="switchTab('plots');return false">Plots</a>
      <a href="#" onclick="switchTab('upload');return false">Photos</a>
      <a href="#" onclick="switchTab('settings');return false">Settings</a>
      <span class="spacer"></span><a class="logout" href="#" onclick="doLogout();return false">Logout</a></div>
      <div class="admin-content"><h1 class="section-title">Lead Inbox (${Leads.length})</h1>
      <div class="lead-list">${Leads.map(l=>leadRow(l)).join('')||'<div class="empty-state">No leads yet</div>'}</div></div>`;
  }
  else if (CurrentTab === 'plots') {
    let cells = '';
    for (let i=1; i<=PLOTS_TOTAL; i++) {
      const p = PlotStatus[i]||{status:'available',buyer:'',phone:''};
      cells += `<div class="plot-cell ${p.status}" onclick="editPlot(${i})" title="Plot ${i}: ${p.status}">${i}</div>`;
    }
    app.innerHTML = `<div class="admin-nav">
      <a href="#" onclick="switchTab('dashboard');return false">Dashboard</a>
      <a href="#" onclick="switchTab('leads');return false">Leads</a>
      <a href="#" class="active" onclick="switchTab('plots');return false">Plots</a>
      <a href="#" onclick="switchTab('upload');return false">Photos</a>
      <a href="#" onclick="switchTab('settings');return false">Settings</a>
      <span class="spacer"></span><a class="logout" href="#" onclick="doLogout();return false">Logout</a></div>
      <div class="admin-content"><h1 class="section-title">Plot Status Board</h1>
      <div class="plot-legend"><div class="legend-item"><div class="legend-swatch" style="background:#4CAF50"></div>Available</div>
      <div class="legend-item"><div class="legend-swatch" style="background:#FF9800"></div>Booked</div>
      <div class="legend-item"><div class="legend-swatch" style="background:#2196F3"></div>Advance</div>
      <div class="legend-item"><div class="legend-swatch" style="background:#F44336"></div>Sold</div></div>
      <div class="plot-grid">${cells}</div></div>`;
  }
  else if (CurrentTab === 'upload') {
    const gallery = JSON.parse(localStorage.getItem('vng_photos')||'[]');
    app.innerHTML = `<div class="admin-nav">
      <a href="#" onclick="switchTab('dashboard');return false">Dashboard</a>
      <a href="#" onclick="switchTab('leads');return false">Leads</a>
      <a href="#" onclick="switchTab('plots');return false">Plots</a>
      <a href="#" class="active" onclick="switchTab('upload');return false">Photos</a>
      <a href="#" onclick="switchTab('settings');return false">Settings</a>
      <span class="spacer"></span><a class="logout" href="#" onclick="doLogout();return false">Logout</a></div>
      <div class="admin-content"><h1 class="section-title">Upload Photos</h1>
      <div class="upload-zone" id="upload-zone" onclick="document.getElementById('photo-input').click()">
      <p><strong>Tap to select photos</strong> from camera roll</p></div>
      <input type="file" id="photo-input" accept="image/*" multiple style="display:none" onchange="handlePhotoUpload(event)">
      <div class="thumbnail-grid">${gallery.map((src,i)=>`<div class="thumbnail-item"><img src="${src}" alt="photo"><button class="remove" onclick="removePhoto(${i})">&times;</button></div>`).join('')||'<div class="empty-state">No photos</div>'}</div></div>`;
    setupDropZone();
  }
  else if (CurrentTab === 'settings') {
    app.innerHTML = `<div class="admin-nav">
      <a href="#" onclick="switchTab('dashboard');return false">Dashboard</a>
      <a href="#" onclick="switchTab('leads');return false">Leads</a>
      <a href="#" onclick="switchTab('plots');return false">Plots</a>
      <a href="#" onclick="switchTab('upload');return false">Photos</a>
      <a href="#" class="active" onclick="switchTab('settings');return false">Settings</a>
      <span class="spacer"></span><a class="logout" href="#" onclick="doLogout();return false">Logout</a></div>
      <div class="admin-content"><h1 class="section-title">Settings</h1>
      <form class="settings-form" id="settings-form">
      <div class="form-group"><label>WhatsApp (digits+countrycode)</label><input type="text" id="s-whatsapp" value="${escapeAttr(Settings.whatsapp)}"></div>
      <div class="form-group"><label>Phone Display</label><input type="text" id="s-phoneDisplay" value="${escapeAttr(Settings.phoneDisplay)}"></div>
      <div class="form-group"><label>Phone (tel:)</label><input type="text" id="s-phone" value="${escapeAttr(Settings.phone)}"></div>
      <div class="form-row"><div class="form-group"><label>Secondary Phone Display</label><input type="text" id="s-secondaryPhoneDisplay" value="${escapeAttr(Settings.secondaryPhoneDisplay)}"></div>
      <div class="form-group"><label>Secondary Phone (tel:)</label><input type="text" id="s-secondaryPhone" value="${escapeAttr(Settings.secondaryPhone)}"></div></div>
      <div class="form-group"><label>Email</label><input type="email" id="s-email" value="${escapeAttr(Settings.email)}"></div>
      <div class="form-group"><label>Address</label><textarea id="s-address" rows="2">${escapeAttr(Settings.address)}</textarea></div>
      <button type="submit" class="btn">Save</button><div id="settings-flash" class="flash success" style="display:none">Saved!</div></form></div>`;
    document.getElementById('settings-form').addEventListener('submit', saveSettings);
  }
}

function saveSettings(e) {
  e.preventDefault();
  Settings = {
    whatsapp: document.getElementById('s-whatsapp').value.trim(),
    phoneDisplay: document.getElementById('s-phoneDisplay').value.trim(),
    phone: document.getElementById('s-phone').value.trim(),
    secondaryPhone: document.getElementById('s-secondaryPhone').value.trim(),
    secondaryPhoneDisplay: document.getElementById('s-secondaryPhoneDisplay').value.trim(),
    email: document.getElementById('s-email').value.trim(),
    address: document.getElementById('s-address').value.trim()
  };
  saveSettings();
  const flash = document.getElementById('settings-flash');
  flash.style.display = 'block';
  setTimeout(()=>flash.style.display='none', 3000);
}

function setupDropZone() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
    if (files.length) {
      const input = document.getElementById('photo-input');
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;
      handlePhotoUpload({target:input});
    }
  });
}

function addLead(lead) {
  lead.id = Date.now() + Math.random();
  lead.time = new Date().toISOString();
  Leads.unshift(lead);
  saveLeads();
}

if (!document.getElementById('plot-edit-modal')) {
  const modal = document.createElement('div');
  modal.id = 'plot-edit-modal'; modal.className = 'plot-edit-modal';
  document.body.appendChild(modal);
}

initPlots();
render();