/* api.js — shared client for the VNG Projects backend.
   Tries the server first; falls back to localStorage when offline or when
   running from `file://`. Drop this script tag BEFORE lead-saver.js and
   gallery-posters.js on every page that needs persistence.
   ====================================================================== */
(function (global) {
  'use strict';

  const BACKEND = (location.protocol === 'http:' || location.protocol === 'https:')
    ? location.origin + '/api'
    : null;

  const STORE = {
    leads: 'vng_leads',
    plots: 'vng_plot_status',
    photos: 'vng_photos',
    posters: 'vng_gallery_posters',
    settings: 'vng_settings'
  };

  function ls(k, def) {
    try { return JSON.parse(localStorage.getItem(k)) || def; }
    catch { return def; }
  }
  function ss(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  async function get(key, def) {
    if (BACKEND) {
      try {
        const r = await fetch(BACKEND + '/' + key, { credentials: 'same-origin' });
        if (r.ok) return await r.json();
      } catch (e) { /* fall back */ }
    }
    return ls(STORE[key], def);
  }

  async function put(key, value) {
    if (BACKEND) {
      try {
        const r = await fetch(BACKEND + '/' + key, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value)
        });
        if (r.ok) return;
      } catch (e) { /* fall back */ }
    }
    ss(STORE[key], value);
  }

  async function post(key, body) {
    if (BACKEND) {
      try {
        const r = await fetch(BACKEND + '/' + key, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (r.ok) return await r.json();
      } catch (e) { /* fall back */ }
    }
    const arr = ls(STORE[key], []);
    arr.unshift(body);
    ss(STORE[key], arr);
    return { id: body.id };
  }

  async function del(key, id) {
    if (BACKEND) {
      try {
        const r = await fetch(BACKEND + '/' + key + '/' + encodeURIComponent(id), { method: 'DELETE' });
        if (r.ok) return;
      } catch (e) { /* fall back */ }
    }
    const arr = ls(STORE[key], []).filter(x => String(x.id) !== String(id));
    ss(STORE[key], arr);
  }

  async function remove(key) {
    if (BACKEND) {
      try {
        const r = await fetch(BACKEND + '/' + key, { method: 'DELETE' });
        if (r.ok) return;
      } catch (e) { /* fall back */ }
    }
    ss(STORE[key], key === 'plots' ? {} : []);
  }

  global.VNG_API = { get, put, post, del, remove, STORE };
})(window);