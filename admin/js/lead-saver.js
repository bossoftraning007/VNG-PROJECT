/* Lead saver - lightweight, safe for public pages */
function addLead(lead) {
  lead.id = Date.now() + Math.random();
  lead.time = new Date().toISOString();
  const leads = JSON.parse(localStorage.getItem('vng_leads') || '[]');
  leads.unshift(lead);
  localStorage.setItem('vng_leads', JSON.stringify(leads));
  // WhatsApp notify
  const settings = JSON.parse(localStorage.getItem('vng_settings') || '{}');
  const wa = settings.whatsapp || '919505903371';
  const msg = 'New lead: ' + (lead.name||'') + ', ' + (lead.phone||'') + ', wants ' + (lead.plotSize||'unknown') + ', submitted just now';
  console.log('Notify WhatsApp:', 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg));
}
