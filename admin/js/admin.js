/* Admin JS - VNG Projects */
'use strict';

const ADMIN_EMAIL = 'rasamallaganesh71@gmail.com';
const PLOTS_TOTAL = 280;

let Leads = JSON.parse(localStorage.getItem('vng_leads') || '[]');
let PlotStatus = JSON.parse(localStorage.getItem('vng_plot_status') || '{}');
let Photos = JSON.parse(localStorage.getItem('vng_photos') || '[]');
let SiteImages = JSON.parse(localStorage.getItem('vng_site_images') || '[]');
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
let LeadFilter = 'all'; // all, hot, warm, cold, converted, lost

function init() {
  for (let i = 1; i <= PLOTS_TOTAL; i++) {
    if (!(i in PlotStatus)) PlotStatus[i] = { status: 'available', buyer: '', phone: '' };
  }
  savePlots();
  render();
}

function saveLeads() { localStorage.setItem('vng_leads', JSON.stringify(Leads)); }
function savePlots() { localStorage.setItem('vng_plot_status', JSON.stringify(PlotStatus)); }
function savePhotos() { localStorage.setItem('vng_photos', JSON.stringify(Photos)); }
function saveSiteImages() { localStorage.setItem('vng_site_images', JSON.stringify(SiteImages)); }
function saveSettings() { localStorage.setItem('vng_settings', JSON.stringify(Settings)); }

function checkLogin() { return localStorage.getItem('vng_admin_logged_in') === 'true'; }

function doLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  if (email === ADMIN_EMAIL.toLowerCase()) {
    localStorage.setItem('vng_admin_logged_in', 'true');
    document.getElementById('login-error').style.display = 'none';
    CurrentTab = 'dashboard';
    render();
  } else {
    const err = document.getElementById('login-error');
    err.textContent = 'Wrong email. Try: ' + ADMIN_EMAIL;
    err.style.display = 'block';
  }
}

function doLogout() {
  localStorage.removeItem('vng_admin_logged_in');
  CurrentTab = 'dashboard';
  LeadFilter = 'all';
  render();
}

function getStats() {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);
  const leadsWeek = Leads.filter(l => new Date(l.time) >= weekAgo).length;
  const leadsMonth = Leads.filter(l => new Date(l.time) >= monthAgo).length;
  const hotLeads = Leads.filter(l => l.tag === 'hot').length;
  const pendingFollowups = Leads.filter(l => l.followUp && new Date(l.followUp) <= now && l.status !== 'converted' && l.status !== 'lost').length;
  const bookedMonth = Object.values(PlotStatus).filter(p => (p.status === 'booked' || p.status === 'sold') && p.bookedDate && new Date(p.bookedDate) >= monthAgo).length;
  const soldTotal = Object.values(PlotStatus).filter(p => p.status === 'sold').length;
  const remaining = PLOTS_TOTAL - Object.values(PlotStatus).filter(p => p.status !== 'available').length;
  const converted = Leads.filter(l => l.status === 'converted').length;
  return { leadsWeek, leadsMonth, hotLeads, pendingFollowups, bookedMonth, soldTotal, remaining, converted };
}

function esc(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return d.toLocaleDateString();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN');
}

function tagBadge(tag) {
  const badges = { hot: '🔥 Hot', warm: '☀️ Warm', cold: '❄️ Cold' };
  return badges[tag] || '';
}

function statusBadge(status) {
  const badges = { converted: '✅ Converted', lost: '❌ Lost', active: '📞 Active' };
  return badges[status] || '';
}

function getFilteredLeads() {
  if (LeadFilter === 'all') return Leads;
  if (LeadFilter === 'hot' || LeadFilter === 'warm' || LeadFilter === 'cold') {
    return Leads.filter(l => l.tag === LeadFilter);
  }
  return Leads.filter(l => l.status === LeadFilter);
}

function leadRow(l) {
  const phoneDigits = (l.phone || '').replace(/\D/g, '');
  return '<div class="lead-item">' +
    '<div class="lead-info">' +
    '<h4>' + esc(l.name || 'Unknown') +
    (l.tag ? ' <span class="tag-tag tag-' + l.tag + '">' + tagBadge(l.tag) + '</span>' : '') +
    (l.status ? ' <span class="tag-tag tag-status">' + statusBadge(l.status) + '</span>' : '') +
    '</h4>' +
    '<div class="meta">' + esc(l.phone || '-') + ' | ' + esc(l.plotSize || 'No size') + ' | ' + fmtTime(l.time) + '</div>' +
    (l.followUp ? '<div class="meta" style="color:#C9A961">📅 Follow-up: ' + formatDate(l.followUp) + '</div>' : '') +
    (l.notes ? '<div class="meta" style="font-style:italic">📝 ' + esc(l.notes) + '</div>' : '') +
    '</div>' +
    '<div class="lead-actions">' +
    '<button class="btn btn-sm" onclick="openLeadEdit(' + l.id + ')">✏️ Edit</button>' +
    (phoneDigits ? '<a class="btn btn-sm btn-secondary" href="https://wa.me/91' + phoneDigits + '?text=' + encodeURIComponent('Hello ' + (l.name || '') + ', regarding your enquiry') + '" target="_blank">WhatsApp</a>' : '') +
    (phoneDigits ? '<a class="btn btn-sm btn-secondary" href="tel:+91' + phoneDigits + '">Call</a>' : '') +
    '<button class="btn btn-danger btn-sm" onclick="deleteLead(' + l.id + ')">&times;</button>' +
    '</div>' +
    '</div>';
}

function deleteLead(id) {
  if (confirm('Delete this lead?')) {
    Leads = Leads.filter(l => l.id !== id);
    saveLeads();
    render();
  }
}

function deleteAllLeads() {
  if (confirm('Delete ALL leads? This cannot be undone!')) {
    Leads = [];
    saveLeads();
    render();
  }
}

function exportCSV() {
  const filtered = getFilteredLeads();
  if (!filtered.length) { alert('No leads to export'); return; }
  const headers = ['Name', 'Phone', 'Plot Size', 'Tag', 'Status', 'Follow-up', 'Notes', 'Date'];
  const rows = filtered.map(l => [
    l.name || '', l.phone || '', l.plotSize || '', l.tag || '', l.status || '',
    l.followUp || '', l.notes || '', fmtTime(l.time)
  ]);
  let csv = headers.join(',') + '\n';
  rows.forEach(r => { csv += r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',') + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function openLeadEdit(id) {
  const l = Leads.find(lead => lead.id === id);
  if (!l) return;
  const modal = document.getElementById('lead-edit-modal');
  modal.innerHTML =
    '<div class="card">' +
    '<h3>Edit Lead</h3>' +
    '<div class="form-group"><label>Name</label><input type="text" id="le-name" value="' + esc(l.name) + '"></div>' +
    '<div class="form-group"><label>Phone</label><input type="text" id="le-phone" value="' + esc(l.phone) + '"></div>' +
    '<div class="form-group"><label>Plot Size</label><input type="text" id="le-plotSize" value="' + esc(l.plotSize) + '"></div>' +
    '<div class="form-group"><label>Tag</label><select id="le-tag">' +
    '<option value="">No tag</option>' +
    '<option value="hot" ' + (l.tag === 'hot' ? 'selected' : '') + '>🔥 Hot</option>' +
    '<option value="warm" ' + (l.tag === 'warm' ? 'selected' : '') + '>☀️ Warm</option>' +
    '<option value="cold" ' + (l.tag === 'cold' ? 'selected' : '') + '>❄️ Cold</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Status</label><select id="le-status">' +
    '<option value="">Active</option>' +
    '<option value="converted" ' + (l.status === 'converted' ? 'selected' : '') + '>✅ Converted</option>' +
    '<option value="lost" ' + (l.status === 'lost' ? 'selected' : '') + '>❌ Lost</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Follow-up Date</label><input type="date" id="le-followUp" value="' + (l.followUp || '') + '"></div>' +
    '<div class="form-group"><label>Call Notes</label><textarea id="le-notes" rows="3">' + esc(l.notes || '') + '</textarea></div>' +
    '<div style="display:flex;gap:0.5rem">' +
    '<button class="btn" onclick="saveLeadEdit(' + id + ')">Save</button>' +
    '<button class="btn btn-secondary" onclick="closeLeadModal()">Cancel</button>' +
    '</div>' +
    '</div>';
  modal.classList.add('show');
  window._editingLeadId = id;
}

function saveLeadEdit(id) {
  const l = Leads.find(lead => lead.id === id);
  if (!l) return;
  l.name = (document.getElementById('le-name') || {}).value || l.name;
  l.phone = (document.getElementById('le-phone') || {}).value || l.phone;
  l.plotSize = (document.getElementById('le-plotSize') || {}).value || l.plotSize;
  l.tag = (document.getElementById('le-tag') || {}).value || '';
  l.status = (document.getElementById('le-status') || {}).value || '';
  l.followUp = (document.getElementById('le-followUp') || {}).value || '';
  l.notes = (document.getElementById('le-notes') || {}).value || '';
  saveLeads();
  closeLeadModal();
  render();
}

function closeLeadModal() {
  document.getElementById('lead-edit-modal').classList.remove('show');
}

function editPlot(num) {
  const p = PlotStatus[num] || { status: 'available', buyer: '', phone: '' };
  SelectedPlot = num;
  const modal = document.getElementById('plot-edit-modal');
  modal.innerHTML =
    '<div class="card">' +
    '<h3>Plot ' + num + '</h3>' +
    '<div class="form-group"><label>Status</label><select id="pe-status">' +
    '<option value="available" ' + (p.status === 'available' ? 'selected' : '') + '>Available</option>' +
    '<option value="booked" ' + (p.status === 'booked' ? 'selected' : '') + '>Booked</option>' +
    '<option value="advance" ' + (p.status === 'advance' ? 'selected' : '') + '>Advance Paid</option>' +
    '<option value="sold" ' + (p.status === 'sold' ? 'selected' : '') + '>Sold</option>' +
    '</select></div>' +
    '<div class="form-group"><label>Buyer Name</label><input type="text" id="pe-buyer" value="' + esc(p.buyer) + '"></div>' +
    '<div class="form-group"><label>Buyer Phone</label><input type="text" id="pe-phone" value="' + esc(p.phone) + '"></div>' +
    '<div style="display:flex;gap:0.5rem">' +
    '<button class="btn" onclick="savePlot()">Save</button>' +
    '<button class="btn btn-secondary" onclick="closePlotModal()">Cancel</button>' +
    '</div>' +
    '</div>';
  modal.classList.add('show');
}

function savePlot() {
  if (SelectedPlot === null) return;
  const status = document.getElementById('pe-status').value;
  PlotStatus[SelectedPlot] = {
    status: status,
    buyer: document.getElementById('pe-buyer').value.trim(),
    phone: document.getElementById('pe-phone').value.trim(),
    bookedDate: ['booked', 'advance', 'sold'].includes(status) ? new Date().toISOString() : null
  };
  savePlots();
  closePlotModal();
  render();
}

function closePlotModal() {
  document.getElementById('plot-edit-modal').classList.remove('show');
  SelectedPlot = null;
}

function handlePhotoUpload(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      Photos.push({
        src: ev.target.result,
        caption: file.name.replace(/\.[^.]+$/, ''),
        date: new Date().toISOString()
      });
      savePhotos();
      render();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function removePhoto(i) {
  Photos.splice(i, 1);
  savePhotos();
  render();
}

function updatePhotoCaption(i, caption) {
  if (Photos[i]) { Photos[i].caption = caption; savePhotos(); }
}

function saveSettingsForm(e) {
  e.preventDefault();
  Settings = {
    whatsapp: (document.getElementById('s-whatsapp') || {}).value ? document.getElementById('s-whatsapp').value.trim() : Settings.whatsapp,
    phoneDisplay: (document.getElementById('s-phoneDisplay') || {}).value ? document.getElementById('s-phoneDisplay').value.trim() : Settings.phoneDisplay,
    phone: (document.getElementById('s-phone') || {}).value ? document.getElementById('s-phone').value.trim() : Settings.phone,
    secondaryPhone: (document.getElementById('s-secondaryPhone') || {}).value ? document.getElementById('s-secondaryPhone').value.trim() : Settings.secondaryPhone,
    secondaryPhoneDisplay: (document.getElementById('s-secondaryPhoneDisplay') || {}).value ? document.getElementById('s-secondaryPhoneDisplay').value.trim() : Settings.secondaryPhoneDisplay,
    email: (document.getElementById('s-email') || {}).value ? document.getElementById('s-email').value.trim() : Settings.email,
    address: (document.getElementById('s-address') || {}).value ? document.getElementById('s-address').value.trim() : Settings.address
  };
  saveSettings();
  const flash = document.getElementById('settings-flash');
  if (flash) { flash.style.display = 'block'; setTimeout(function () { flash.style.display = 'none'; }, 3000); }
}

function switchTab(name) {
  CurrentTab = name;
  render();
}

function setLeadFilter(filter) {
  LeadFilter = filter;
  render();
}

function render() {
  if (!checkLogin()) {
    document.getElementById('admin-app').innerHTML =
      '<div class="login-page">' +
      '<div class="login-card">' +
      '<h2>VNG Projects Admin</h2>' +
      '<p class="sub">Future Highway @ Alair</p>' +
      '<form id="login-form">' +
      '<input type="email" id="login-email" placeholder="Enter admin email" required>' +
      '<div id="login-error" class="error" style="display:none;color:#dc3545;font-size:0.85rem;margin-bottom:1rem"></div>' +
      '<button type="submit" class="btn" style="width:100%">Login</button>' +
      '</form>' +
      '</div>' +
      '</div>';
    document.getElementById('login-form').addEventListener('submit', doLogin);
    return;
  }

  const stats = getStats();
  const app = document.getElementById('admin-app');
  const nav = '<div class="admin-nav">' +
    '<a href="#" onclick="switchTab(\'dashboard\');return false">Dashboard</a>' +
    '<a href="#" onclick="switchTab(\'leads\');return false">Leads</a>' +
    '<a href="#" onclick="switchTab(\'plots\');return false">Plots</a>' +
'<a href="#" onclick="switchTab(\'photos\');return false">Photos</a>' +
'<a href="#" onclick="switchTab(\'liveimages\');return false">Live Images</a>' +
'<a href="#" onclick="switchTab(\'settings\');return false">Settings</a>' +
    '<span class="spacer"></span>' +
    '<a class="admin-back" href="/index.html" target="_blank" style="color:#C9A961;text-decoration:none;font-weight:600">View Site</a>' +
    ' | ' +
    '<a class="logout" href="#" onclick="doLogout();return false" style="color:#999;text-decoration:none;font-size:0.85rem">Logout</a>' +
    '</div>';

  if (CurrentTab === 'dashboard') {
    app.innerHTML = nav +
      '<div class="admin-content">' +
      '<div class="flash success">Logged in as ' + esc(Settings.email) + '</div>' +
      '<h1 class="section-title">Dashboard</h1>' +
      '<div class="stat-grid">' +
      '<div class="stat-card"><h3>Total Leads This Month</h3><div class="stat-num">' + stats.leadsMonth + '</div></div>' +
      '<div class="stat-card"><h3>🔥 Hot Leads</h3><div class="stat-num">' + stats.hotLeads + '</div></div>' +
      '<div class="stat-card"><h3>📞 Pending Follow-ups</h3><div class="stat-num">' + stats.pendingFollowups + '</div></div>' +
      '<div class="stat-card"><h3>Plots Booked This Month</h3><div class="stat-num">' + stats.bookedMonth + '</div></div>' +
      '<div class="stat-card"><h3>Plots Sold Total</h3><div class="stat-num">' + stats.soldTotal + '</div></div>' +
      '<div class="stat-card"><h3>Plots Remaining</h3><div class="stat-num">' + stats.remaining + '</div></div>' +
      '<div class="stat-card"><h3>✅ Converted</h3><div class="stat-num">' + stats.converted + '</div></div>' +
      '<div class="stat-card"><h3>Leads This Week</h3><div class="stat-num">' + stats.leadsWeek + '</div></div>' +
      '</div>' +
      '<h2 class="section-title">Recent Leads</h2>' +
      '<div class="lead-list">' +
      (Leads.length ? Leads.slice(0, 5).map(leadRow).join('') : '<div class="empty-state">No leads yet</div>') +
      '</div>' +
      '</div>';
  }
  else if (CurrentTab === 'leads') {
    const filtered = getFilteredLeads();
    const filters = '<div class="lead-filters">' +
      '<button class="filter-btn ' + (LeadFilter === 'all' ? 'active' : '') + '" onclick="setLeadFilter(\'all\')">All (' + Leads.length + ')</button>' +
      '<button class="filter-btn ' + (LeadFilter === 'hot' ? 'active' : '') + '" onclick="setLeadFilter(\'hot\')">🔥 Hot</button>' +
      '<button class="filter-btn ' + (LeadFilter === 'warm' ? 'active' : '') + '" onclick="setLeadFilter(\'warm\')">☀️ Warm</button>' +
      '<button class="filter-btn ' + (LeadFilter === 'cold' ? 'active' : '') + '" onclick="setLeadFilter(\'cold\')">❄️ Cold</button>' +
      '<button class="filter-btn ' + (LeadFilter === 'converted' ? 'active' : '') + '" onclick="setLeadFilter(\'converted\')">✅ Converted</button>' +
      '<button class="filter-btn ' + (LeadFilter === 'lost' ? 'active' : '') + '" onclick="setLeadFilter(\'lost\')">❌ Lost</button>' +
      '<span class="spacer"></span>' +
      '<button class="btn btn-sm" onclick="exportCSV()">⬇️ Export CSV</button>' +
      '<button class="btn btn-danger btn-sm" onclick="deleteAllLeads()">🗑️ Delete All</button>' +
      '</div>';
    app.innerHTML = nav +
      '<div class="admin-content">' +
      '<h1 class="section-title">Lead Inbox (' + filtered.length + ')</h1>' +
      filters +
      '<div class="lead-list">' +
      (filtered.length ? filtered.map(leadRow).join('') : '<div class="empty-state">No leads match this filter</div>') +
      '</div>' +
      '</div>';
  }
  else if (CurrentTab === 'plots') {
    let cells = '';
    for (let i = 1; i <= PLOTS_TOTAL; i++) {
      const p = PlotStatus[i] || { status: 'available', buyer: '', phone: '' };
      cells += '<div class="plot-cell ' + p.status + '" onclick="editPlot(' + i + ')" title="Plot ' + i + ': ' + p.status + (p.buyer ? ' - ' + p.buyer : '') + '">' + i + '</div>';
    }
    app.innerHTML = nav +
      '<div class="admin-content">' +
      '<h1 class="section-title">Plot Status Board</h1>' +
      '<div class="plot-legend">' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#4CAF50"></div>Available</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#FF9800"></div>Booked</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#2196F3"></div>Advance</div>' +
      '<div class="legend-item"><div class="legend-swatch" style="background:#F44336"></div>Sold</div>' +
      '</div>' +
      '<div class="plot-grid">' + cells + '</div>' +
      '<div style="margin-top:1rem;text-align:center">' +
      '<button class="btn" onclick="window.print()">🖨️ Print Plot Board</button>' +
      '</div>' +
      '</div>';
  }
  else if (CurrentTab === 'photos' || CurrentTab === 'siteimages' || CurrentTab === 'liveimages') {
    const photoTab = '<div class="tab-nav">' +
      '<button class="tab-btn ' + (CurrentTab === 'photos' ? 'active' : '') + '" onclick="switchTab(\'photos\')">📸 Admin Photos</button>' +
      '<button class="tab-btn ' + (CurrentTab === 'siteimages' ? 'active' : '') + '" onclick="switchTab(\'siteimages\')">🖼️ Site Images</button>' +
      '<button class="tab-btn ' + (CurrentTab === 'liveimages' ? 'active' : '') + '" onclick="switchTab(\'liveimages\')">📄 Live Site Images</button>' +
      '</div>';

    if (CurrentTab === 'photos') {
      app.innerHTML = nav + photoTab +
        '<div class="admin-content">' +
        '<h1 class="section-title">Admin Photo Gallery (' + Photos.length + ')</h1>' +
        '<div class="upload-zone" id="upload-zone" onclick="document.getElementById(\'photo-input\').click()">' +
        '<p><strong>Tap to select photos</strong> from your camera roll</p>' +
        '<p style="font-size:0.8rem;color:#999">Select multiple images at once</p>' +
        '</div>' +
        '<input type="file" id="photo-input" accept="image/*" multiple style="display:none" onchange="handlePhotoUpload(event)">' +
        '<div class="thumbnail-grid">' +
        (Photos.length ? Photos.map(function (p, i) {
          return '<div class="thumbnail-item">' +
            '<img src="' + esc(p.src) + '" alt="' + esc(p.caption) + '" onerror="this.style.opacity=0.3">' +
            '<div class="caption-area">' +
            '<input type="text" value="' + esc(p.caption) + '" onchange="updatePhotoCaption(' + i + ', this.value)" placeholder="Add caption" style="width:100%;font-size:0.8rem;padding:0.3rem;border:1px solid #ccc;border-radius:4px">' +
            '</div>' +
            '<button class="remove" onclick="removePhoto(' + i + ')">&times;</button>' +
            '</div>';
        }).join('') : '<div class="empty-state">No photos uploaded yet</div>') +
        '</div>' +
        '</div>';
      setupDropZone();
    } else if (CurrentTab === 'siteimages') {
      app.innerHTML = nav + photoTab +
        '<div class="admin-content">' +
        '<h1 class="section-title">Site Images (' + SiteImages.length + ')</h1>' +
        '<div class="upload-zone" id="site-upload-zone" onclick="document.getElementById(\'site-image-input\').click()">' +
        '<p><strong>Tap to upload site images</strong></p>' +
        '<p style="font-size:0.8rem;color:#999">These appear on the main website</p>' +
        '</div>' +
        '<input type="file" id="site-image-input" accept="image/*" multiple style="display:none" onchange="handleSiteImageUpload(event)">' +
        '<div class="thumbnail-grid">' +
        (SiteImages.length ? SiteImages.map(function (p, i) {
          return '<div class="thumbnail-item">' +
            '<img src="' + esc(p.src) + '" alt="' + esc(p.caption) + '" onerror="this.style.opacity=0.3">' +
            '<div class="caption-area">' +
            '<input type="text" value="' + esc(p.caption) + '" onchange="updateSiteCaption(' + i + ', this.value)" placeholder="Caption" style="width:100%;font-size:0.8rem;padding:0.3rem;border:1px solid #ccc;border-radius:4px">' +
            '</div>' +
            '<button class="remove" onclick="removeSiteImage(' + i + ')">&times;</button>' +
            '</div>';
        }).join('') : '<div class="empty-state">No site images yet</div>') +
        '</div>' +
        '</div>';
      setupSiteDropZone();
    } else {
      const imgs = getSiteImages();
      app.innerHTML = nav + photoTab +
        '<div class="admin-content">' +
        '<h1 class="section-title">Live Site Images (' + imgs.length + ')</h1>' +
        '<p style="margin-bottom:1.5rem;color:#666;font-size:0.9rem">' +
        'These are the pictures <strong>currently referenced</strong> on the published main site. ' +
        'They are read live from the page HTML — refresh this view after editing a page to see the change.</p>' +
        '<div class="thumbnail-grid">' +
        (imgs.length ? imgs.map(function (p, i) {
          return '<div class="thumbnail-item">' +
            '<img src="' + esc(p.src) + '" alt="' + esc(p.caption) + '" onerror="this.style.opacity=0.3">' +
            '<div class="caption-area">' +
            '<span style="font-size:0.75rem;color:#999;display:block;margin-bottom:0.2rem">' + esc(p.page) + '</span>' +
            '<span style="font-size:0.8rem">' + esc(p.caption) + '</span>' +
            '</div>' +
            '</div>';
        }).join('') : '<div class="empty-state">No images found on the live site</div>') +
        '</div>' +
        '<div style="margin-top:1.5rem;text-align:center">' +
        '<button class="btn btn-sm" onclick="loadSitePages(function(){ render(); })">🔄 Refresh from live site</button>' +
        '</div>' +
        '</div>';
      loadSitePages();
    }
  }
  else if (CurrentTab === 'settings') {
    app.innerHTML = nav +
      '<div class="admin-content">' +
      '<h1 class="section-title">Settings</h1>' +
      '<form class="settings-form" id="settings-form" onsubmit="saveSettingsForm(event)">' +
      '<div class="form-group"><label>WhatsApp Number (digits + country code)</label><input type="text" id="s-whatsapp" value="' + esc(Settings.whatsapp) + '"></div>' +
      '<div class="form-group"><label>Phone Display Text</label><input type="text" id="s-phoneDisplay" value="' + esc(Settings.phoneDisplay) + '"></div>' +
      '<div class="form-group"><label>Phone (tel: link)</label><input type="text" id="s-phone" value="' + esc(Settings.phone) + '"></div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label>Secondary Phone Display</label><input type="text" id="s-secondaryPhoneDisplay" value="' + esc(Settings.secondaryPhoneDisplay) + '"></div>' +
      '<div class="form-group"><label>Secondary Phone (tel:)</label><input type="text" id="s-secondaryPhone" value="' + esc(Settings.secondaryPhone) + '"></div>' +
      '</div>' +
      '<div class="form-group"><label>Email</label><input type="email" id="s-email" value="' + esc(Settings.email) + '"></div>' +
      '<div class="form-group"><label>Company Address</label><textarea id="s-address" rows="2">' + esc(Settings.address) + '</textarea></div>' +
      '<button type="submit" class="btn">Save Settings</button>' +
      '<div id="settings-flash" class="flash success" style="display:none;margin-top:1rem">Settings saved!</div>' +
      '</form>' +
      '<div style="margin-top:2rem">' +
      '<h2 class="section-title">Danger Zone</h2>' +
      '<div class="settings-form">' +
      '<p style="margin-bottom:1rem;color:#999">Clear all stored data from this browser. Cannot be undone.</p>' +
      '<button class="btn btn-danger" onclick="clearAllData()">🗑️ Clear All Data</button>' +
      '</div>' +
      '</div>' +
      '</div>';
  }
}

function clearAllData() {
  if (confirm('Delete ALL leads, plots, photos, and settings? This cannot be undone!')) {
    Leads = [];
    PlotStatus = {};
    Photos = [];
    SiteImages = [];
    Settings = JSON.parse(localStorage.getItem('vng_settings') || '{}');
    saveLeads();
    savePlots();
    savePhotos();
    saveSiteImages();
    saveSettings();
    init();
    alert('All data cleared.');
  }
}

function handleSiteImageUpload(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      SiteImages.push({
        src: ev.target.result,
        caption: file.name.replace(/\.[^.]+$/, ''),
        date: new Date().toISOString()
      });
      saveSiteImages();
      render();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function removeSiteImage(i) {
  SiteImages.splice(i, 1);
  saveSiteImages();
  render();
}

function updateSiteCaption(i, caption) {
  if (SiteImages[i]) { SiteImages[i].caption = caption; saveSiteImages(); }
}

function setupDropZone() {
  const zone = document.getElementById('upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(function (f) { return f.type.startsWith('image/'); });
    if (files.length) {
      files.forEach(function (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          Photos.push({ src: ev.target.result, caption: file.name.replace(/\.[^.]+$/, ''), date: new Date().toISOString() });
          savePhotos();
          render();
        };
        reader.readAsDataURL(file);
      });
    }
  });
}

function setupSiteDropZone() {
  const zone = document.getElementById('site-upload-zone');
  if (!zone) return;
  zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    zone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(function (f) { return f.type.startsWith('image/'); });
    if (files.length) {
      files.forEach(function (file) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          SiteImages.push({ src: ev.target.result, caption: file.name.replace(/\.[^.]+$/, ''), date: new Date().toISOString() });
          saveSiteImages();
          render();
        };
        reader.readAsDataURL(file);
      });
    }
  });
}

/* Scan the live main-site pages for every <img> they reference, so the
   admin can see exactly which pictures are currently published. */
function getSiteImages() {
  const pages = ['/index.html', '/projects/future-highway-alair/index.html'];
  const seen = new Map();
  const imgRe = /<img[^>]+src="([^"]+)"/g;
  const capRe = /<img[^>]+alt="([^"]*)"/g;
  const figRe = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g;

  pages.forEach(function (page) {
    const html = SitePageCache[page];
    if (!html) return;
    let m;
    while ((m = imgRe.exec(html))) {
      const src = m[1];
      if (src.startsWith('data:') || src.startsWith('http')) continue;
      if (!/\.(jpe?g|png|gif|webp|svg)$/i.test(src)) continue;
      if (seen.has(src)) continue;
      /* grab the nearest figcaption text as the caption */
      let caption = '';
      const after = html.slice(m.index);
      const fm = figRe.exec(after);
      if (fm) caption = fm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      seen.set(src, { src: src, caption: caption || src, page: page });
    }
  });
  return Array.from(seen.values());
}

/* Cache the main-site HTML so we don't refetch on every render */
let SitePageCache = {};
function loadSitePages(cb) {
  const pages = ['/index.html', '/projects/future-highway-alair/index.html'];
  let done = 0;
  pages.forEach(function (page) {
    fetch(page)
      .then(function (r) { return r.text(); })
      .then(function (t) { SitePageCache[page] = t; })
      .catch(function () { SitePageCache[page] = ''; })
      .finally(function () {
        done++;
        if (done === pages.length && cb) cb();
      });
  });
}

function addLead(lead) {
  lead.id = Date.now() + Math.random();
  lead.time = new Date().toISOString();
  lead.tag = lead.tag || '';
  lead.status = lead.status || '';
  lead.notes = lead.notes || '';
  lead.followUp = lead.followUp || '';
  Leads.unshift(lead);
  saveLeads();
}

if (!document.getElementById('plot-edit-modal')) {
  const modal = document.createElement('div');
  modal.id = 'plot-edit-modal';
  modal.className = 'plot-edit-modal';
  document.body.appendChild(modal);
}

if (!document.getElementById('lead-edit-modal')) {
  const modal = document.createElement('div');
  modal.id = 'lead-edit-modal';
  modal.className = 'plot-edit-modal';
  document.body.appendChild(modal);
}

init();