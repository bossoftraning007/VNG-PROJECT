const fs=require('fs');
let g=fs.readFileSync('assets/js/gallery-render.js','utf8');
// Replace the corrupted version with the original good version
g=`/* gallery-render.js — renders the Gallery + Posters sections on the main site.
   Reads from the shared GalleryPosters store (written by the admin panel).
   Drop this script tag on any page that has a [data-gallery] and/or [data-posters]
   container. No backend required.
   ====================================================================== */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&', '<': '<', '>': '>', '"': '"', "'": "'" }[c];
    });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function galleryCard(item, index) {
    return '<figure class="media reveal gallery__card" data-id="' + esc(item.id) + '">' +
      '<img src="' + esc(item.src) + '" alt="' + esc(item.caption) + '" loading="lazy" onerror="this.style.opacity=0.3">' +
      '<figcaption class="media__tag">' + esc(item.caption) +
      (item.date ? ' <span style="opacity:.6">' + fmtDate(item.date) + '</span>' : '') +
      '</figcaption>' +
      '</figure>';
  }

  function posterCard(item, index) {
    return '<article class="poster reveal" data-id="' + esc(item.id) + '">' +
      '<div class="poster__media">' +
      '<img src="' + esc(item.src) + '" alt="' + esc(item.title) + '" loading="lazy" onerror="this.style.opacity=0.3">' +
      '</div>' +
      '<div class="poster__body">' +
      '<span class="eyebrow eyebrow--inv">Poster ' + (index + 1) + '</span>' +
      '<h3 class="poster__title">' + esc(item.title) + '</h3>' +
      (item.subtitle ? '<p class="poster__subtitle">' + esc(item.subtitle) + '</p>' : '') +
      (item.body ? '<p class="poster__note mt-sm">' + esc(item.body) + '</p>' : '') +
      '<a class="btn btn--gold" href="' + esc(item.ctaLink || '#') + '">' + esc(item.cta || 'Learn More') + '</a>' +
      '</div>' +
      '</article>';
  }

  const FALLBACK_GALLERY = [
    { id: 'g-fb-1', src: 'images/project-1-alair.jpg', caption: 'Future Highway @ Alair — Entrance arch & gate', date: '2025-01-01', type: 'image' },
    { id: 'g-fb-2', src: 'images/layout-map.png', caption: 'Sanctioned DTCP layout map — 280 plots', date: '2025-01-01', type: 'image' },
    { id: 'g-fb-3', src: 'images/investment.jpg', caption: 'Investment case study — dual returns', date: '2025-01-01', type: 'image' },
    { id: 'g-fb-4', src: 'images/brand-hero.jpg', caption: 'Planted, serviced, permitted — site overview', date: '2025-01-01', type: 'image' },
    { id: 'g-fb-5', src: 'images/about-team.jpg', caption: 'VNG Projects team on site review', date: '2025-01-01', type: 'image' }
  ];
  const FALLBACK_POSTERS = [
    { id: 'p-fb-1', src: 'images/project-1-alair.jpg', title: 'Future Highway @ Alair', subtitle: 'DTCP Approved · RERA Registered · NH-163', body: 'Premium residential plots of 135–500 sq. yards at Sharajipet village, Alair Mandal, Yadadri-Bhongir. Base price ₹12,000 per sq. yard, negotiable. 280 plots with Srigandham sandalwood plantation, swimming pool and underground drainage.', cta: 'View Project', ctaLink: 'projects/future-highway-alair/', date: '2025-01-01', type: 'image' },
    { id: 'p-fb-2', src: 'images/brand-hero.jpg', title: '25+ Years. One Standard.', subtitle: 'DTCP approved · RERA registered · Serviced land', body: 'Every VNG Projects development follows the same rule — buy on a corridor that is being built out, on land that is already permitted and already serviced.', cta: 'Explore Projects', ctaLink: 'index.html#projects', date: '2025-01-01', type: 'image' }
  ];

  function renderGallery(container) {
    if (!container) return;
    const items = (global.GalleryPosters && global.GalleryPosters.getGallery && global.GalleryPosters.getGallery()) || FALLBACK_GALLERY;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No gallery images yet. Ask the admin to add some.</div>';
      return;
    }
    container.innerHTML = items.map(galleryCard).join('');
  }

  function renderPosters(container) {
    if (!container) return;
    const items = (global.GalleryPosters && global.GalleryPosters.getPosters && global.GalleryPosters.getPosters()) || FALLBACK_POSTERS;
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No posters yet. Ask the admin to add one.</div>';
      return;
    }
    container.innerHTML = items.map(posterCard).join('');
  }

  function boot() {
    const galleryContainer = document.querySelector('[data-gallery]');
    const postersContainer = document.querySelector('[data-posters]');
    if (galleryContainer) renderGallery(galleryContainer);
    if (postersContainer) renderPosters(postersContainer);
  }

  async function refreshFromBackend() {
    if (!window.VNG_API) return;
    try {
      const posters = await window.VNG_API.get('posters', []);
      if (posters && posters.length) {
        if (window.GalleryPosters) {
          try { localStorage.setItem('vng_gallery_posters', JSON.stringify({ gallery: [], posters })); } catch (e) {}
        }
        renderPosters(document.querySelector('[data-posters]'));
      }
      const photos = await window.VNG_API.get('photos', []);
      if (photos && photos.length && window.GalleryPosters) {
        try { localStorage.setItem('vng_gallery_posters', JSON.stringify({ gallery: photos, posters: [] })); } catch (e) {}
        renderGallery(document.querySelector('[data-gallery]'));
      }
    } catch (e) {}
  }

  function run() { boot(); refreshFromBackend(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
  try{run();}catch(e){} setTimeout(run,0);

  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };
})(window);`;
fs.writeFileSync('assets/js/gallery-render.js',g);
console.log('restored', g.length);
