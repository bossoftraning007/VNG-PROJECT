/* gallery-posters.js — shared data store for the Gallery + Posters system.
   Admin panel writes here; the main site reads here.
   Data lives in localStorage so no backend is required.
   ====================================================================== */

(function (global) {
  "use strict";

  const STORE_KEY = "vng_gallery_posters";

  /* Default seed content so the site is never empty on first load */
  const DEFAULTS = {
    gallery: [
      {
        id: "g-seed-1",
        src: "images/project-1-alair.jpg",
        caption: "Future Highway @ Alair — Entrance arch & gate",
        date: "2025-01-01",
        type: "image"
      },
      {
        id: "g-seed-2",
        src: "images/layout-map.png",
        caption: "Sanctioned DTCP layout map — 280 plots",
        date: "2025-01-01",
        type: "image"
      },
      {
        id: "g-seed-3",
        src: "images/investment.jpg",
        caption: "Investment case study — dual returns",
        date: "2025-01-01",
        type: "image"
      },
      {
        id: "g-seed-4",
        src: "images/brand-hero.jpg",
        caption: "Planted, serviced, permitted — site overview",
        date: "2025-01-01",
        type: "image"
      },
      {
        id: "g-seed-5",
        src: "images/about-team.jpg",
        caption: "VNG Projects team on site review",
        date: "2025-01-01",
        type: "image"
      }
    ],
    posters: [
      {
        id: "p-seed-1",
        src: "images/project-1-alair.jpg",
        title: "Future Highway @ Alair",
        subtitle: "DTCP Approved · RERA Registered · NH-163",
        body: "Premium residential plots of 135–500 sq. yards at Sharajipet village, Alair Mandal, Yadadri-Bhongir. Base price ₹12,000 per sq. yard, negotiable. 280 plots with Srigandham sandalwood plantation, swimming pool and underground drainage.",
        cta: "View Project",
        ctaLink: "projects/future-highway-alair/",
        date: "2025-01-01",
        type: "image"
      },
      {
        id: "p-seed-2",
        src: "images/brand-hero.jpg",
        title: "25+ Years. One Standard.",
        subtitle: "DTCP approved · RERA registered · Serviced land",
        body: "Every VNG Projects development follows the same rule — buy on a corridor that is being built out, on land that is already permitted and already serviced.",
        cta: "Explore Projects",
        ctaLink: "index.html#projects",
        date: "2025-01-01",
        type: "image"
      }
    ]
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function save(data) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getAll() {
    return load();
  }

  function getGallery() {
    return load().gallery;
  }

  function getPosters() {
    return load().posters;
  }

  function addGalleryItem(item) {
    const data = load();
    item.id = item.id || ("g-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
    item.date = item.date || new Date().toISOString().slice(0, 10);
    item.type = item.type || "image";
    data.gallery.unshift(item);
    save(data);
    return item;
  }

  function removeGalleryItem(id) {
    const data = load();
    data.gallery = data.gallery.filter(function (x) { return x.id !== id; });
    save(data);
  }

  function addPoster(item) {
    const data = load();
    item.id = item.id || ("p-" + Date.now() + "-" + Math.floor(Math.random() * 1000));
    item.date = item.date || new Date().toISOString().slice(0,10);
    item.type = item.type || "image";
    data.posters.unshift(item);
    save(data);
    return item;
  }

  function removePoster(id) {
    const data = load();
    data.posters = data.posters.filter(function (x) { return x.id !== id; });
    save(data);
  }

  function updateGalleryItem(id, patch) {
    const data = load();
    const item = data.gallery.find(function (x) { return x.id === id; });
    if (item) Object.assign(item, patch);
    save(data);
    return item;
  }

  function updatePoster(id, patch) {
    const data = load();
    const item = data.posters.find(function (x) { return x.id === id; });
    if (item) Object.assign(item, patch);
    save(data);
    return item;
  }

  function reset() {
    localStorage.removeItem(STORE_KEY);
  }

  global.GalleryPosters = {
    getAll: getAll,
    getGallery: getGallery,
    getPosters: getPosters,
    addGalleryItem: addGalleryItem,
    removeGalleryItem: removeGalleryItem,
    addPoster: addPoster,
    removePoster: removePoster,
    updateGalleryItem: updateGalleryItem,
    updatePoster: updatePoster,
    reset: reset
  };
})(window);