/* gallery-render.js — renders the Gallery + Posters sections on the main site.
   Reads from the shared GalleryPosters store (written by the admin panel).
   Drop this script tag on any page that has a [data-gallery] and/or [data-posters]
   container. No backend required.
   ====================================================================== */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
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

  function renderGallery(container) {
    if (!container) return;
    const items = (global.GalleryPosters && global.GalleryPosters.getGallery()) || [];
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No gallery images yet. Ask the admin to add some.</div>';
      return;
    }
    container.innerHTML = items.map(galleryCard).join('');
  }

  function renderPosters(container) {
    if (!container) return;
    const items = (global.GalleryPosters && global.GalleryPosters.getPosters()) || [];
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">No posters yet. Ask the admin to add one.</div>';
      return;
    }
    container.innerHTML = items.map(posterCard).join('');
  }

  function boot() {
    document.addEventListener('DOMContentLoaded', function () {
      renderGallery(document.querySelector('[data-gallery]'));
      renderPosters(document.querySelector('[data-posters]'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.GalleryRender = { renderGallery: renderGallery, renderPosters: renderPosters };
})(window);