/* Lead saver — prefers the VNG backend; falls back to localStorage. */
function addLead(lead) {
  lead.id = lead.id || Date.now() + Math.random();
  lead.time = lead.time || new Date().toISOString();
  lead.tag = lead.tag || '';
  lead.status = lead.status || '';
  lead.notes = lead.notes || '';
  lead.followUp = lead.followUp || '';

  /* Save server-side when possible, always mirror locally for offline use */
  if (window.VNG_API) {
    window.VNG_API.post('leads', lead);
  }

  const leads = JSON.parse(localStorage.getItem('vng_leads') || '[]');
  leads.unshift(lead);
  localStorage.setItem('vng_leads', JSON.stringify(leads));

  /* WhatsApp notify */
  const settings = JSON.parse(localStorage.getItem('vng_settings') || '{}');
  const wa = settings.whatsapp || '919505903371';
  const msg = 'New lead: ' + (lead.name||'') + ', ' + (lead.phone||'') + ', wants ' + (lead.plotSize||'unknown') + ', submitted just now';
  console.log('Notify WhatsApp:', 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg));
}