const FALLBACK_GALLERY = [
  { id: 'g-fb-1', src: 'images/project-1-alair.jpg', caption: 'Test', date: '2025-01-01', type: 'image' }
];

function esc(s) { return String(s || '').replace(/[&<>]/g, c => ({'&':'&','<':'<','>':'>'}[c])); }
function galleryCard(item) {
  return '<figure data-id="' + esc(item.id) + '"><img src="' + esc(item.src) + '" alt="' + esc(item.caption) + '"><figcaption>' + esc(item.caption) + '</figcaption></figure>';
}

const result = FALLBACK_GALLERY.map(galleryCard).join('');
console.log('Result:', result);