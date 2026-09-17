/* ==========================================================================
   Llave OS · Dorum tenant app — core shell
   Defines window.LLAVE (plugin API), the hash router, shell rendering,
   role picker, voice assistant, approvals inbox, command palette,
   drawer/modal, and display modes (desktop | phone | tv | watch).
   Plain script. Modules register via LLAVE.register / LLAVE.registerWidget.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.DORUM;
  if (!D) { console.error('LLAVE: DORUM data not loaded'); return; }

  /* ------------------------------------------------------------------ utils */
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function firstName(n) { return (n || '').split(' ')[0]; }
  function capFirst(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function todayISO() { return D.generatedAt || new Date().toISOString().slice(0, 10); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function relDay(iso) {
    var n = daysBetween(todayISO(), iso);
    if (n === 0) return 'Hoy'; if (n === 1) return 'Mañana'; if (n === -1) return 'Ayer';
    if (n < 0) return 'hace ' + (-n) + ' d'; return D.fmtDate(iso, 'short');
  }
  function sum(arr, f) { return arr.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); }
  function uniq(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }

  /* ------------------------------------------------------------------ icons */
  var ICONS = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    building: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    kanban: '<path d="M6 5v11"/><path d="M12 5v6"/><path d="M18 5v14"/>',
    'file-text': '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8M16 13H8M16 17H8"/>',
    files: '<path d="M20 7h-3a2 2 0 0 1-2-2V2"/><path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2Z"/><path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    'upload-cloud': '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'bar-chart': '<path d="M12 20v-10M18 20V4M6 20v-4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'message-circle': '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    'check-circle': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    'pen-tool': '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    hammer: '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
    landmark: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="m12 2 8 5H4l8-5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-15.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    'more-horizontal': '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    'clipboard-list': '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    'external-link': '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    tv: '<rect width="20" height="15" x="2" y="7" rx="2"/><path d="m17 2-5 5-5-5"/>',
    watch: '<circle cx="12" cy="12" r="6"/><path d="M12 10v2l1 1"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05M7.88 16.36l.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    'dollar-sign': '<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
    play: '<path d="m6 3 14 9-14 9V3z"/>',
    pause: '<rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    languages: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    'arrow-left': '<path d="m12 19-7-7 7-7M19 12H5"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>'
  };
  function icon(name, cls) {
    var body = ICONS[name] || ICONS.circle;
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  /* ------------------------------------------------------------ nav labels */
  var NAV_LABEL = { home: 'Inicio', listings: 'Inmuebles', 'crm-get': 'Captación', 'crm-sell': 'Ventas & arriendos', calendar: 'Agenda', projects: 'Proyectos', contracts: 'Contratos', paperwork: 'Documentos', media: 'Fotos & video', publishing: 'Publicación', ads: 'Pauta', money: 'Dinero', 'my-money': 'Mis pagos', payroll: 'Nómina', rentals: 'Arriendos', lifestyle: 'Lifestyle', reports: 'Reportes', website: 'Sitio web', settings: 'Configuración', orders: 'Órdenes', referrals: 'Referidos', 'my-listing': 'Mi inmueble', visits: 'Visitas', offers: 'Ofertas', documents: 'Documentos', messages: 'Mensajes', search: 'Buscar', shortlist: 'Favoritos', tours: 'Recorridos', 'my-property': 'Mi propiedad', statements: 'Extractos', maintenance: 'Mantenimiento', 'my-home': 'Mi hogar', payments: 'Pagos', roles: 'Roles' };
  var NAV_ICON = { home: 'home', listings: 'building', 'crm-get': 'handshake', 'crm-sell': 'users', calendar: 'calendar', projects: 'kanban', contracts: 'file-text', paperwork: 'files', media: 'image', publishing: 'upload-cloud', ads: 'megaphone', money: 'wallet', 'my-money': 'banknote', payroll: 'briefcase', rentals: 'key', lifestyle: 'sparkles', reports: 'bar-chart', website: 'globe', settings: 'settings', orders: 'clipboard-list', referrals: 'handshake', 'my-listing': 'building', visits: 'calendar', offers: 'file-text', documents: 'files', messages: 'message-circle', search: 'search', shortlist: 'heart', tours: 'map-pin', 'my-property': 'building', statements: 'receipt', maintenance: 'wrench', 'my-home': 'home', payments: 'banknote' };

  /* ------------------------------------------------------------- language */
  // Shared toggle lives in ../assets/i18n.js (window.I18N). ES is the app's source language; EN comes
  // from *En fields in data.js, these helpers, and the I18N.dict.ui text pass on rendered nodes.
  function isEn() { return !!(window.I18N && window.I18N.lang === 'en'); }
  function tx(es, en) { return isEn() ? en : es; }
  var NAV_LABEL_EN = { home: 'Home', listings: 'Listings', 'crm-get': 'Acquisition', 'crm-sell': 'Sales & rentals', calendar: 'Calendar', projects: 'Projects', contracts: 'Contracts', paperwork: 'Paperwork', media: 'Photos & video', publishing: 'Publishing', ads: 'Ads', money: 'Money', 'my-money': 'My payouts', payroll: 'Payroll', rentals: 'Rentals', lifestyle: 'Lifestyle', reports: 'Reports', website: 'Website', settings: 'Settings', orders: 'Orders', referrals: 'Referrals', 'my-listing': 'My listing', visits: 'Visits', offers: 'Offers', documents: 'Documents', messages: 'Messages', search: 'Search', shortlist: 'Shortlist', tours: 'Tours', 'my-property': 'My property', statements: 'Statements', maintenance: 'Maintenance', 'my-home': 'My home', payments: 'Payments', roles: 'Roles' };
  function navLabel(id) { return (isEn() ? NAV_LABEL_EN[id] : NAV_LABEL[id]) || id; }
  function roleLabel(r) { return r ? (isEn() ? (r.label || r.labelEs) : (r.labelEs || r.label)) : ''; }
  // Module defs carry title (EN) + titleEs (ES); some core modules use the ES word for both.
  function modTitle(def, id) {
    if (isEn()) return NAV_LABEL_EN[id] || (def && def.title) || id;
    return (def && (def.titleEs || def.title)) || NAV_LABEL[id] || id;
  }
  function langToggle(opts) { return window.I18N ? window.I18N.toggleHtml(opts) : ''; }

  var ROLE_DESC_EN = {
    owner: 'The whole business on one screen: pipeline, money in escrow, team, ads and the decisions Llave left ready for your approval.',
    broker: 'Your day from the car: agenda, hot leads, follow-ups drafted by Llave and your projected commissions.',
    sales_admin: 'The operations board: sales pipeline, vendor orders, paperwork and the portal publishing queue.',
    rental_admin: 'Rental portfolio, maintenance, inventories and the Lifestyle vacation-rental calendar.',
    accountant: 'Escrow, pending releases, payout batches, payroll and DIAN e-invoicing with traceable approvals.',
    lawyer: 'Contracts to review, open redlines, title checks and pending signatures with the clause library.',
    photographer: 'Photo, video and drone orders; shoot calendar and direct upload into the listing.',
    advertiser: 'Live campaigns, creative requests, CPL trend and per-job payouts.',
    writer: 'Bilingual write-up queue, comps requested and AI drafts to polish.',
    construction: 'Quotes requested, active builds and scheduled site visits.',
    lender: 'New referrals, pre-approvals in progress and upcoming closings.',
    seller: 'How the sale of your property is going: visits, feedback, offers and missing documents.',
    buyer: 'Your shortlist, the next tour, your offer status and the mortgage.',
    landlord: 'Rent status, monthly statement, occupancy and maintenance of your property.',
    renter: 'Your home: this month\'s rent, receipts, maintenance and Lifestyle services one tap away.'
  };
  var ROLE_DESC = {
    owner: 'Todo el negocio en una pantalla: pipeline, dinero en escrow, equipo, pauta y las decisiones que Llave dejó listas para tu aprobación.',
    broker: 'Tu día desde el carro: agenda, leads calientes, seguimientos redactados por Llave y tus comisiones proyectadas.',
    sales_admin: 'El tablero de operaciones: pipeline de ventas, órdenes a proveedores, documentos y la cola de publicación en portales.',
    rental_admin: 'Cartera de arriendos, mantenimiento, inventarios y el calendario de rentas vacacionales Lifestyle.',
    accountant: 'Escrow, liberaciones pendientes, lotes de pago, nómina y facturación DIAN con aprobaciones trazables.',
    lawyer: 'Contratos por revisar, redlines abiertos, estudio de títulos y firmas pendientes con la biblioteca de cláusulas.',
    photographer: 'Órdenes de foto, video y dron; calendario de sesiones y subida directa al inmueble.',
    advertiser: 'Campañas en vivo, solicitudes de creativos, tendencia de CPL y pagos por servicio.',
    writer: 'Cola de redacción bilingüe, comps solicitados y borradores AI para pulir.',
    construction: 'Cotizaciones pedidas, obras activas y visitas técnicas programadas.',
    lender: 'Referidos nuevos, pre-aprobaciones en curso y cierres próximos.',
    seller: 'Cómo va la venta de tu inmueble: visitas, retroalimentación, ofertas y documentos que faltan.',
    buyer: 'Tus favoritos, el próximo recorrido, el estado de tu oferta y el crédito.',
    landlord: 'Estado del arriendo, extracto mensual, ocupación y mantenimiento de tu propiedad.',
    renter: 'Tu hogar: canon del mes, recibos, mantenimiento y servicios Lifestyle a un toque.'
  };
  var GROUP_LABEL_ES = { staff: 'Equipo Dorum', vendor: 'Aliados y proveedores', customer: 'Clientes' };
  var GROUP_LABEL_EN = { staff: 'Dorum team', vendor: 'Partners & vendors', customer: 'Clients' };
  var GROUP_SUB_ES = { staff: 'Operan la agencia todos los días', vendor: 'Reciben órdenes y cobran por servicio', customer: 'Ven solo lo suyo, en su idioma' };
  var GROUP_SUB_EN = { staff: 'Run the agency every day', vendor: 'Receive orders and get paid per job', customer: 'See only their own, in their language' };
  function groupLabel(g) { return isEn() ? GROUP_LABEL_EN[g] : GROUP_LABEL_ES[g]; }
  function groupSub(g) { return isEn() ? GROUP_SUB_EN[g] : GROUP_SUB_ES[g]; }
  function roleDesc(id) { return (isEn() ? ROLE_DESC_EN[id] : ROLE_DESC[id]) || ''; }

  /* ----------------------------------------------- augment in-memory data */
  // Unified inbox threads (not in data.js). Kept here so the approvals inbox can count them.
  if (!D.messages) {
    D.messages = [
      { id: 'm-001', channel: 'whatsapp', contactId: 'c-001', name: 'Emily Chen', listingId: 'lst-003', owner: 'u-brk-1', at: '2026-09-16T08:42:00', unread: true, lang: 'en',
        thread: [
          { from: 'them', text: 'Hi Mateo! Still thinking about the lake house. Would the owner consider including the boat and the guest-house furniture?', at: '2026-09-16T08:42:00' }
        ],
        aiDraft: { status: 'pendiente', text: 'Hi Emily! Great question. The furniture in the guest house is already part of the counteroffer we are preparing (COP 3.780 M, 45-day closing). The boat is not included, but the owner is open to a separate agreement. Shall I add it to Saturday’s tour agenda?', meta: 'Basado en la contraoferta k-002 y el tour del 19 sep' } },
      { id: 'm-002', channel: 'portal', contactId: null, name: 'Consulta Finca Raíz', listingId: 'lst-001', owner: 'u-brk-1', at: '2026-09-16T07:15:00', unread: true, lang: 'es',
        thread: [
          { from: 'them', text: 'Buenos días, ¿el lote tiene licencia de construcción vigente y hasta cuántos m² permite construir? Soy inversionista de Medellín.', at: '2026-09-16T07:15:00' }
        ],
        aiDraft: { status: 'pendiente', text: 'Buenos días. Sí: el lote de Tierra Prometida tiene licencia de construcción aprobada por Planeación de Guatapé, vigente hasta marzo de 2027, con índice de ocupación del 30 % (aprox. 840 m² construibles). ¿Le agendo una visita este fin de semana con Mateo?', meta: 'Datos tomados de doc-014 y la ficha del inmueble' } },
      { id: 'm-003', channel: 'instagram', contactId: 'c-004', name: 'Andrew Miller', listingId: 'lst-014', owner: 'u-brk-3', at: '2026-09-16T06:50:00', unread: true, lang: 'en',
        thread: [
          { from: 'them', text: 'Saw the Tulum villa on your reel. Is it still available and what are the HOA fees like?', at: '2026-09-16T06:50:00' }
        ],
        aiDraft: { status: 'pendiente', text: 'Hi Andrew, thanks for reaching out! The Aldea Zamá villa is available (US$890,000). HOA is about US$320/month and the property already runs as an active vacation rental. Happy to send the full deck and occupancy history — what email works best?', meta: 'Traducido y adaptado al comprador internacional' } },
      { id: 'm-004', channel: 'email', contactId: 'c-008', name: 'Luisa Fernanda Ospina', listingId: null, owner: 'u-brk-2', at: '2026-09-15T17:20:00', unread: false, lang: 'es',
        thread: [
          { from: 'me', text: 'Luisa, adjunto la propuesta de captación para el apartamento de Castropol. Comisión del 3 % + IVA, exclusividad 6 meses.', at: '2026-09-15T16:05:00' },
          { from: 'them', text: 'Gracias Valentina. ¿Podríamos hablar de 2,5 %? Es lo que me ofrece otra agencia.', at: '2026-09-15T17:20:00' }
        ],
        aiDraft: { status: 'pendiente', text: 'Luisa, entiendo la comparación. Con Dorum el 3 % incluye fotografía profesional con dron, redacción bilingüe, pauta en Meta y publicación en tres portales, más el acompañamiento legal. Propongo mantener el 3 % y sumar un reporte quincenal de visitas y leads. ¿Le parece si lo revisamos el jueves?', meta: 'Argumentos tomados del acuerdo de corretaje estándar · revisar la comisión antes de enviar' } },
      { id: 'm-005', channel: 'whatsapp', contactId: 'c-005', name: 'Natalia Pérez', listingId: 'lst-005', owner: 'u-radmin', at: '2026-09-15T12:10:00', unread: false, lang: 'es',
        thread: [
          { from: 'them', text: 'Hola Daniela, confirmo la visita del miércoles a las 3. ¿La casa acepta perros grandes?', at: '2026-09-15T11:48:00' },
          { from: 'me', text: '¡Confirmado, Natalia! Sí, la parcelación tiene zona de mascotas y la casa acepta perros. Nos vemos el miércoles en la portería de Guayacanes.', at: '2026-09-15T12:10:00' }
        ], aiDraft: null },
      { id: 'm-006', channel: 'whatsapp', contactId: 'c-006', name: 'Daniel Weber', listingId: 'lst-010', owner: 'u-brk-2', at: '2026-09-14T09:30:00', unread: false, lang: 'en',
        thread: [
          { from: 'them', text: 'Signed! When is the move-in inventory?', at: '2026-09-14T09:12:00' },
          { from: 'me', text: 'Welcome to Laureles, Daniel! Inventory walk-through is on Sept 25 at 10:00. Keys are handed over on Oct 1.', at: '2026-09-14T09:30:00' }
        ], aiDraft: null },
      { id: 'm-007', channel: 'whatsapp', contactId: 'c-012', name: 'Sara Londoño', listingId: null, owner: 'u-brk-1', at: '2026-09-16T09:05:00', unread: true, lang: 'es',
        thread: [
          { from: 'them', text: 'Vi el anuncio de ustedes. Tengo un lote de 1.500 m² en la vía Guatapé–El Peñol y quiero saber cuánto podría valer.', at: '2026-09-16T09:05:00' }
        ],
        aiDraft: { status: 'pendiente', text: 'Hola Sara, ¡gracias por escribirnos! Lotes con vista en esa vía se han vendido este año entre $480.000 y $620.000 por m². Para darte un rango serio necesitamos ver el frente, la pendiente y los servicios. ¿Te sirve una visita el jueves 18 en la mañana con Mateo?', meta: 'Comps del Oriente antioqueño · lead nuevo desde Meta Ads' } },
      { id: 'm-008', channel: 'portal', contactId: null, name: 'Consulta Metrocuadrado', listingId: 'lst-008', owner: 'u-brk-2', at: '2026-09-15T20:40:00', unread: false, lang: 'es',
        thread: [
          { from: 'them', text: '¿El apartamento de Provenza admite renta corporativa? Somos una empresa de tecnología.', at: '2026-09-15T20:40:00' },
          { from: 'me', text: 'Sí, el reglamento permite arriendo corporativo. Con gusto coordinamos una visita esta semana.', at: '2026-09-15T21:02:00' }
        ], aiDraft: null }
    ];
  }

  /* ------------------------------------------------------- derived helpers */
  // Every AI-drafted thing awaiting a human: tasks, contracts, messages.
  function allApprovals() {
    var out = [];
    D.tasks.forEach(function (t) {
      if (!t.aiDrafted || t.approved || t.discarded || t.status === 'listo') return;
      var l = t.listingId ? D.listing(t.listingId) : null;
      out.push({ kind: 'task', id: t.id, title: t.title, body: t.note || ('Borrador de Llave listo para ' + (l ? l.title : 'la agencia') + '.'), who: t.assignee, listingId: t.listingId, due: t.due, obj: t, icon: 'kanban', kindLabel: 'Tarea · ' + (t.kind || '') });
    });
    D.contracts.forEach(function (k) {
      if (!k.aiDrafted || k.lawyerApproved || k.discarded) return;
      out.push({ kind: 'contract', id: k.id, title: k.type + (k.listingId && D.listing(k.listingId) ? ' · ' + D.listing(k.listingId).title : ''), body: k.note || ('Versión ' + k.version + ' · ' + k.clauses + ' cláusulas · ' + k.redlines + ' redlines'), who: 'u-lawyer', listingId: k.listingId, due: k.updated, obj: k, icon: 'file-text', kindLabel: 'Contrato · v' + k.version });
    });
    D.messages.forEach(function (m) {
      if (!m.aiDraft || m.aiDraft.status !== 'pendiente') return;
      out.push({ kind: 'message', id: m.id, title: 'Respuesta a ' + m.name, body: m.aiDraft.text, who: m.owner, listingId: m.listingId, due: m.at.slice(0, 10), obj: m, icon: 'message-circle', kindLabel: 'Mensaje · ' + channelLabel(m.channel) });
    });
    return out;
  }
  function approvalsFor(ctx) {
    var all = allApprovals();
    if (!ctx || !ctx.role) return all;
    if (ctx.roleId === 'owner' || ctx.roleId === 'sales_admin') return all;
    if (ctx.roleId === 'lawyer') return all.filter(function (a) { return a.kind === 'contract' || a.who === 'u-lawyer'; });
    if (ctx.role.group === 'customer') return [];
    return all.filter(function (a) { return a.who === ctx.user.id; });
  }
  function channelLabel(c) { return ({ whatsapp: 'WhatsApp', email: 'Correo', instagram: 'Instagram', portal: 'Portal' })[c] || c; }

  // Calendar events derived from tasks, contacts' next actions, deal timelines.
  var MONTHS = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
  function parseNextAction(s) {
    if (!s) return null;
    var m = /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(?:\s+(\d{1,2}):(\d{2}))?/i.exec(s);
    if (!m) return null;
    var y = todayISO().slice(0, 4);
    var mm = String(MONTHS[m[2].toLowerCase()] + 1).padStart(2, '0');
    return { date: y + '-' + mm + '-' + String(m[1]).padStart(2, '0'), time: m[3] ? (m[3].padStart(2, '0') + ':' + m[4]) : null };
  }
  function events(ctx) {
    var ev = [];
    D.contacts.forEach(function (c) {
      var p = parseNextAction(c.nextAction);
      if (!p) return;
      var kind = c.pipeline === 'get' ? 'visit' : 'tour';
      ev.push({ id: 'ev-' + c.id, date: p.date, time: p.time, kind: kind, title: c.nextAction.replace(/\s*·.*$/, ''), who: c.owner, contactId: c.id, listingId: c.interest && c.interest[0], meta: c.name + (c.city ? ' · ' + c.city : ''), whatsapp: c.whatsapp, ai: false });
    });
    D.tasks.forEach(function (t) {
      if (!t.due || t.status === 'listo' || t.discarded) return;
      var kind = t.kind === 'photography' ? 'shoot' : 'task';
      var l = t.listingId ? D.listing(t.listingId) : null;
      ev.push({ id: 'ev-' + t.id, date: t.due, time: kind === 'shoot' ? '09:00' : null, kind: kind, title: t.title, who: t.assignee, taskId: t.id, listingId: t.listingId, meta: (l ? l.city + ' · ' : '') + D.userName(t.assignee), ai: !!t.aiDrafted });
    });
    D.deals.forEach(function (d) {
      (d.timeline || []).forEach(function (s) {
        if (!s.at || s.done) return;
        ev.push({ id: 'ev-' + d.id + '-' + s.at, date: s.at, time: null, kind: 'deal', title: s.label.replace(/\s*\(.*\)$/, ''), who: d.parties.listingBroker, dealId: d.id, listingId: d.listingId, meta: d.title, ai: !!s.ai });
      });
    });
    if (ctx && ctx.role && ctx.roleId !== 'owner' && ctx.roleId !== 'sales_admin' && ctx.roleId !== 'rental_admin') {
      var uid = ctx.user.id;
      ev = ev.filter(function (e) {
        if (e.who === uid) return true;
        if (ctx.role.group === 'customer') { var c = e.contactId && D.byId(D.contacts, e.contactId); return c && c.userId === uid; }
        return false;
      });
    }
    ev.sort(function (a, b) { return (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')); });
    return ev;
  }

  /* ----------------------------------------------------------- chart utils */
  var chart = {
    bars: function (values, o) {
      o = o || {}; var h = o.height || 120, labels = o.labels || [];
      var n = values.length; if (!n) return '';
      var max = Math.max.apply(null, values.concat([1]));
      var w = 100, gap = 1.2, bw = (w - gap * (n - 1)) / n;
      var labelH = labels.length ? 16 : 0;
      var out = '<svg viewBox="0 0 ' + w + ' ' + (h + labelH) + '" preserveAspectRatio="none" style="height:' + (h + labelH) + 'px" aria-hidden="true">';
      values.forEach(function (v, i) {
        var bh = Math.max(1.5, (v / max) * (h - 4)), x = i * (bw + gap);
        out += '<rect x="' + x.toFixed(2) + '" y="' + (h - bh).toFixed(2) + '" width="' + bw.toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="1" fill="currentColor" opacity="' + (o.highlight === i ? 1 : 0.75) + '"/>';
      });
      out += '</svg>';
      if (labels.length) {
        out += '<div style="display:grid;grid-template-columns:repeat(' + n + ',minmax(0,1fr));gap:2px;font-size:10px;color:var(--text-3);text-align:center;margin-top:4px">' + labels.map(function (l) { return '<span class="truncate">' + esc(l) + '</span>'; }).join('') + '</div>';
      }
      return out;
    },
    sparkline: function (values, o) {
      o = o || {}; var n = values.length; if (n < 2) return '';
      var w = 100, h = 32, min = Math.min.apply(null, values), max = Math.max.apply(null, values); if (max === min) max = min + 1;
      var pts = values.map(function (v, i) { return [(i / (n - 1)) * w, h - 2 - ((v - min) / (max - min)) * (h - 4)]; });
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2); }).join(' ');
      var area = line + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
      var last = pts[n - 1];
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + area + '" fill="currentColor" opacity="0.12"/><path d="' + line + '" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + last[0].toFixed(2) + '" cy="' + last[1].toFixed(2) + '" r="2.4" fill="currentColor" vector-effect="non-scaling-stroke"/></svg>';
    },
    donut: function (parts, o) {
      o = o || {}; var total = sum(parts, function (p) { return p.value; }) || 1;
      var r = 15.9155, c = 2 * Math.PI * r, off = 0, out = '<svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="5"/>';
      var palette = ['var(--brand)', 'var(--brand-3)', 'var(--accent)', 'var(--warn)', 'var(--info)', 'var(--ai)', 'var(--text-3)'];
      parts.forEach(function (p, i) {
        var len = (p.value / total) * c;
        out += '<circle cx="21" cy="21" r="' + r + '" fill="none" stroke="' + (p.color || palette[i % palette.length]) + '" stroke-width="5" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off + c / 4).toFixed(2) + '" stroke-linecap="butt"/>';
        off += len;
      });
      if (o.center) out += '<text x="21" y="21" text-anchor="middle" dominant-baseline="central" font-size="8" font-weight="600" fill="var(--text)" font-family="var(--font-ui)">' + esc(o.center) + '</text>';
      return out + '</svg>';
    }
  };

  /* ---------------------------------------------------------------- LLAVE */
  var state = { roleId: 'owner', module: 'home', id: null, mode: 'desktop', view: 'app', overlays: [] };
  var L = window.LLAVE = {
    modules: {}, widgets: {}, actions: {},
    // Several modules may claim the same id (e.g. a staff inbox and a customer portal both called
    // "messages"). A def may declare `groups: ['staff','vendor']`; at render time the def whose
    // groups include the viewer's role group wins, else the last def registered without groups.
    register: function (id, def) {
      var prev = L.modules[id];
      if (prev && prev !== def) {
        var cands = (prev._candidates || [prev]).concat([def]);
        var comp = {
          _candidates: cands, title: def.title || prev.title, titleEs: def.titleEs || prev.titleEs, icon: def.icon || prev.icon,
          pick: function (c) {
            var g = c && c.role && c.role.group;
            var m = cands.filter(function (d) { return d.groups && d.groups.indexOf(g) >= 0; });
            if (m.length) return m[m.length - 1];
            var open = cands.filter(function (d) { return !d.groups; });
            return open.length ? open[open.length - 1] : cands[cands.length - 1];
          },
          render: function (c) { return comp.pick(c).render(c); },
          mount: function (node, c) { var d = comp.pick(c); if (d.mount) d.mount(node, c); }
        };
        L.modules[id] = comp; return comp;
      }
      L.modules[id] = def; return def;
    },
    registerWidget: function (id, def) { L.widgets[id] = def; return def; },
    action: function (name, fn) { L.actions[name] = fn; },
    navigate: function (roleId, moduleId, id) { location.hash = D.routeTo(roleId || state.roleId, moduleId || 'home', id); },
    rerender: function () { render(); },
    openDrawer: openDrawer, closeDrawer: closeDrawer, openModal: openModal, closeModal: closeModal,
    toast: function (t, b, v) { D.toast(t, b, v); },
    esc: esc, icon: icon, chart: chart,
    ctx: function () { return ctx(); },
    // Extras (beyond the base contract) — shared helpers for modules
    util: { approvals: approvalsFor, allApprovals: allApprovals, events: events, navLabel: navLabel, navLabelEs: function (id) { return NAV_LABEL[id] || id; }, tx: tx, isEn: isEn, roleLabel: roleLabel, navIcon: function (id) { return NAV_ICON[id] || 'layout-grid'; }, relDay: relDay, addDays: addDays, today: todayISO, firstName: firstName, capFirst: capFirst, channelLabel: channelLabel, placeholder: placeholder, listingMini: listingMini },
    openVoice: openVoice, openSearch: openPalette, openApprovals: openApprovals,
    state: state
  };

  function ctx() {
    var role = D.role(state.roleId) || D.role('owner');
    var users = D.usersByRole(role.id);
    var user = role.id === 'owner' ? (users.filter(function (u) { return u.name === D.OWNER_NAME; })[0] || users[0]) : users[0];
    return { roleId: role.id, role: role, user: user, module: state.module, id: state.id, mode: state.mode, D: D };
  }

  /* -------------------------------------------------------- overlays: base */
  function pushOverlay(node, kind) { document.body.appendChild(node); state.overlays.push({ node: node, kind: kind }); }
  function popOverlay(kind) {
    for (var i = state.overlays.length - 1; i >= 0; i--) {
      if (!kind || state.overlays[i].kind === kind) { state.overlays[i].node.remove(); state.overlays.splice(i, 1); return true; }
    }
    return false;
  }
  function openDrawer(html, o) {
    o = o || {}; closeDrawer();
    var back = el('<div class="drawer-backdrop" data-action="close-drawer"></div>');
    var dr = el('<aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(o.title || 'Panel') + '"><div class="drawer-header"><h3>' + esc(o.title || '') + '</h3><button class="btn btn-ghost btn-icon" data-action="close-drawer" aria-label="Cerrar">' + icon('x') + '</button></div><div class="drawer-body">' + html + '</div></aside>');
    pushOverlay(back, 'drawer'); pushOverlay(dr, 'drawer');
    if (o.mount) o.mount(dr);
    return dr;
  }
  function closeDrawer() { while (popOverlay('drawer')) {} }
  function openModal(html, o) {
    o = o || {}; closeModal();
    var back = el('<div class="modal-backdrop"><div class="modal' + (o.wide ? ' modal-lg' : '') + '" role="dialog" aria-modal="true"><div class="modal-header"><h3>' + esc(o.title || '') + '</h3><button class="btn btn-ghost btn-icon" data-action="close-modal" aria-label="Cerrar">' + icon('x') + '</button></div><div class="modal-body">' + html + '</div></div></div>');
    back.addEventListener('click', function (e) { if (e.target === back) closeModal(); });
    pushOverlay(back, 'modal');
    if (o.mount) o.mount(back);
    return back;
  }
  function closeModal() { while (popOverlay('modal')) {} }
  function closeSheet() { while (popOverlay('sheet')) {} }
  function closeTop() {
    if (!state.overlays.length) { var sb = $('#sidebar'); if (sb && sb.classList.contains('is-open')) { sb.classList.remove('is-open'); $('.sidebar-backdrop') && $('.sidebar-backdrop').remove(); return true; } return false; }
    var top = state.overlays[state.overlays.length - 1].kind;
    if (top === 'voice') { closeVoice(); return true; }
    while (popOverlay(top)) {}
    return true;
  }

  /* --------------------------------------------------- placeholder / mini */
  function placeholder(id, small) {
    var label = (isEn() ? NAV_LABEL_EN[id] : NAV_LABEL[id]) || (L.widgets[id] && L.widgets[id].title) || id.replace(/-/g, ' ');
    var ico = NAV_ICON[id] || 'layers';
    return '<div class="wip"><div class="wip-icon">' + icon(ico) + '</div><h3>' + esc(label) + '</h3><p>Módulo en construcción. Otro equipo lo está armando sobre este mismo sistema; aparecerá aquí cuando lo registren.</p>' + (small ? '' : '<div class="row"><a class="btn btn-secondary btn-sm" href="' + D.routeTo(state.roleId, 'home') + '">' + icon('home') + tx(' Ir a Inicio', ' Go to Home') + '</a><button class="btn btn-ghost btn-sm" data-action="open-voice">' + icon('mic') + tx(' Pedírselo a Llave', ' Ask Llave') + '</button></div>') + '</div>';
  }
  function listingMini(l, opts) {
    if (!l) return '';
    opts = opts || {};
    return '<div class="listing-mini' + (opts.clickable !== false ? ' is-clickable' : '') + '" data-action="open-listing" data-id="' + l.id + '" style="cursor:pointer"><img class="thumb" src="' + esc(l.cover) + '" alt="' + esc(l.title) + '" loading="lazy"><div class="flex-1"><div class="t truncate">' + esc(l.title) + '</div><div class="l">' + esc(l.barrio) + ' · ' + esc(l.city) + '</div></div><div class="listing-price">' + esc(D.fmtMoney(l.price, l.currency, { compact: true })) + '</div></div>';
  }

  /* ------------------------------------------------------------ home module */
  L.register('home', {
    title: 'Inicio', icon: icon('home'),
    render: function (c) {
      var hour = new Date().getHours();
      var greet = hour < 12 ? tx('Buenos días', 'Good morning') : hour < 19 ? tx('Buenas tardes', 'Good afternoon') : tx('Buenas noches', 'Good evening');
      var apps = approvalsFor(c).length;
      var evs = events(c).filter(function (e) { return e.date === todayISO(); }).length;
      var sub = D.fmtDate(todayISO(), 'long');
      sub = sub.charAt(0).toUpperCase() + sub.slice(1);
      var meta = [];
      if (evs) meta.push(evs + (evs === 1 ? tx(' evento hoy', ' event today') : tx(' eventos hoy', ' events today')));
      if (apps) meta.push('<button class="pending-pill" data-action="open-approvals">' + icon('sparkles', 'ico-sm') + apps + tx(' por aprobar', ' to approve') + '</button>');
      var html = '<div class="home-hello"><div><h1>' + greet + ', <em>' + esc(firstName(c.user.name)) + '</em>.</h1><div class="sub">' + esc(sub) + ' · ' + esc(roleLabel(c.role)) + (meta.length ? ' · ' + meta.join(' · ') : '') + '</div></div><div class="page-actions"><button class="btn btn-secondary btn-sm" data-action="open-search">' + icon('search') + tx(' Buscar ', ' Search ') + '<span class="kbd-hint">⌘K</span></button><button class="btn btn-primary btn-sm" data-action="open-voice">' + icon('mic') + tx(' Hablar con Llave', ' Talk to Llave') + '</button></div></div>';
      html += '<div class="home-grid">';
      (c.role.homeWidgets || []).forEach(function (wid) {
        var w = L.widgets[wid];
        var size = w ? (w.size || 'md') : 'md';
        var title = w ? (isEn() ? (w.titleEn || w.title) : (w.titleEs || w.title)) : ((isEn() ? NAV_LABEL_EN[wid] : NAV_LABEL[wid]) || wid.replace(/-/g, ' '));
        var body;
        try { body = w ? w.render(c) : placeholder(wid, true); } catch (err) { console.error('widget ' + wid, err); body = '<div class="callout callout-warn">' + icon('alert-triangle') + ' Este widget no pudo renderizarse.</div>'; }
        html += '<section class="card widget-card w-' + size + '" data-widget="' + esc(wid) + '"><div class="card-header"><span class="card-title">' + esc(title) + '</span>' + (w && w.link ? '<a class="card-link" href="' + D.routeTo(c.roleId, w.link) + '">' + tx('Ver todo ', 'View all ') + icon('chevron-right') + '</a>' : '') + '</div><div class="widget-body">' + body + '</div></section>';
      });
      html += '</div>';
      return html;
    },
    mount: function (root, c) {
      $$('[data-widget]', root).forEach(function (node) {
        var w = L.widgets[node.dataset.widget];
        if (w && w.mount) { try { w.mount(node.querySelector('.widget-body'), c); } catch (err) { console.error('widget mount ' + node.dataset.widget, err); } }
      });
    }
  });

  /* --------------------------------------------------------------- shell */
  function tenantSwitcher() {
    return '<div class="tenant-switch"><span class="kicker">Agencia</span>' +
      '<button class="tenant-chip is-active" data-action="switch-tenant" data-tenant="dorum"><span class="mark">D</span>' + esc(D.tenant.name) + ' · ' + esc(D.tenant.hq.city) + '</button>' +
      '<button class="tenant-chip is-ghost" data-action="switch-tenant" data-tenant="andina"><span class="mark">C</span>Casa Andina Realty · Bogotá <span class="pill">demo</span></button>' +
      '<button class="tenant-chip is-ghost" data-action="switch-tenant" data-tenant="costa"><span class="mark">P</span>Costa Prime · Cartagena <span class="pill">demo</span></button></div>';
  }
  function renderPicker() {
    var groups = ['staff', 'vendor', 'customer'];
    var html = '<div class="picker"><header class="picker-head"><div class="picker-brand"><div class="logo">L</div><div><strong>Llave OS</strong><small>' + esc(D.tenant.name) + ' · ' + esc(D.tenant.plan) + '</small></div></div>' + tenantSwitcher() + '<div class="row">' + langToggle() + '<button class="btn btn-ghost btn-icon" data-action="toggle-theme" aria-label="' + tx('Cambiar tema', 'Toggle theme') + '">' + icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon') + '</button></div></header>';
    html += '<section class="picker-hero"><p class="eyebrow">Demo · ' + esc(D.tenant.group) + ' · ' + esc(D.tenant.hq.city) + ', ' + esc(D.tenant.hq.country) + '</p><h1>' + tx('¿Quién eres <em>hoy</em>?', 'Who are you <em>today</em>?') + '</h1><p class="lead">' + tx('Un solo sistema, quince experiencias. Llave muestra a cada persona exactamente lo suyo: la propietaria ve toda la agencia, el asesor ve su día, el comprador ve su próximo recorrido. La IA redacta; una persona aprueba.', 'One system, fifteen experiences. Llave shows each person exactly what is theirs: the owner sees the whole agency, the broker sees her day, the buyer sees his next tour. AI drafts; a person approves.') + '</p></section>';
    html += '<div class="picker-groups">';
    groups.forEach(function (g) {
      var roles = D.roles.filter(function (r) { return r.group === g; });
      html += '<section class="picker-group"><h2>' + esc(groupLabel(g)) + ' <span>' + esc(groupSub(g)) + '</span></h2><div class="role-grid">';
      roles.forEach(function (r) {
        var users = D.usersByRole(r.id);
        var u = r.id === 'owner' ? users.filter(function (x) { return x.name === D.OWNER_NAME; })[0] || users[0] : users[0];
        var avCls = g === 'vendor' ? ' avatar-sand' : g === 'customer' ? ' avatar-accent' : '';
        html += '<a class="role-card' + (r.id === 'owner' ? ' is-owner' : '') + '" href="' + D.routeTo(r.id, 'home') + '"><span class="role-go">' + icon('arrow-right') + '</span><div class="role-top"><span class="avatar' + avCls + '">' + esc(u ? u.initials : '?') + '</span><div><div class="role-name">' + esc(roleLabel(r)) + '</div><div class="role-user">' + esc(u ? u.name : '') + (u && u.title ? ' · ' + esc(u.title) : '') + '</div></div></div><p class="role-desc">' + esc(roleDesc(r.id)) + '</p><div class="role-tags">' + r.navItems.slice(1, 5).map(function (n) { return '<span class="pill">' + esc(navLabel(n)) + '</span>'; }).join('') + (r.navItems.length > 5 ? '<span class="pill">+' + (r.navItems.length - 5) + '</span>' : '') + '</div></a>';
      });
      html += '</div></section>';
    });
    html += '</div><footer class="picker-foot"><span>' + esc(D.tenant.legalName) + tx(' · Datos de demostración; nombres ficticios salvo la propietaria.', ' · Demo data; fictional names except the owner.') + '</span><div class="row"><a href="index.html?mode=tv#/role/owner/home" target="_blank" rel="noopener">' + icon('tv', 'ico-sm') + tx(' Modo TV', ' TV mode') + '</a><a href="index.html?mode=watch#/role/broker/home" target="_blank" rel="noopener">' + icon('watch', 'ico-sm') + tx(' Modo reloj', ' Watch mode') + '</a><a href="../dorum/index.html">' + tx('Sitio público Dorum', 'Dorum public site') + '</a><a href="../index.html">Llave OS</a></div></footer></div>';
    return html;
  }

  function shellHTML() {
    return '<div class="app app-root" id="appShell"><aside class="sidebar" id="sidebar"><div class="sidebar-brand"><div class="logo">L</div><div><strong>Llave</strong><small id="tenantName">' + esc(D.tenant.name) + '</small></div></div><div class="sidebar-section" id="navSection">Realtor OS</div><nav id="nav" class="stack stack-sm" aria-label="Módulos"></nav><div class="sidebar-footer"><nav id="navFoot" class="stack stack-sm"></nav><a class="sidebar-user" href="#/roles" id="sidebarUser" title="Cambiar de rol"></a></div></aside>' +
      '<div class="main"><header class="topbar"><button class="btn btn-ghost btn-icon" id="menuBtn" aria-label="Menú" data-action="toggle-sidebar">' + icon('menu') + '</button><div class="topbar-crumbs"><span><a href="#/roles">' + esc(D.tenant.name) + '</a></span><span class="crumb-sep">/</span><b id="crumb">Inicio</b></div><div class="topbar-spacer"></div>' +
      '<label class="input-group search" data-action="open-search">' + icon('search') + '<input class="input" id="globalSearch" placeholder="Buscar inmueble, contacto, negocio…" readonly aria-label="Buscar"><kbd>⌘K</kbd></label>' +
      '<button class="btn btn-ghost btn-icon" id="searchBtn" data-action="open-search" aria-label="Buscar" style="display:none">' + icon('search') + '</button>' +
      '<div class="role-switch"><span class="avatar avatar-sm" id="meAvatar">—</span><select class="select input-sm" id="roleSelect" aria-label="Cambiar rol (demo)"></select></div>' +
      '<button class="btn btn-ghost btn-icon" id="bellBtn" data-action="open-approvals" aria-label="Aprobaciones pendientes">' + icon('bell') + '<span class="badge-dot" id="bellCount" hidden>0</span></button>' +
      langToggle({ size: 'sm', cls: 'topbar-lang' }) + '<button class="btn btn-ghost btn-icon" id="themeBtn" data-action="toggle-theme" aria-label="Tema">' + icon('moon') + '</button></header><main class="page" id="page"></main></div></div>' +
      '<nav class="tabbar" id="tabbar" aria-label="Navegación"></nav>' +
      '<button class="voice-orb voice-orb-fab" id="voiceFab" data-action="open-voice" aria-label="Hablar con Llave">' + icon('mic') + '</button>';
  }

  // Accept either an inline <svg> string or a Lucide-style icon name from module defs.
  function moduleIcon(def, id) {
    var ic = def && def.icon;
    if (typeof ic === 'string' && ic.trim().charAt(0) === '<') return ic;
    if (typeof ic === 'string' && ICONS[ic.trim()]) return icon(ic.trim());
    return icon(NAV_ICON[id] || 'layout-grid');
  }
  function renderShellChrome(c) {
    var nav = $('#nav'), foot = $('#navFoot');
    var items = c.role.navItems.slice();
    var footIds = ['settings'];
    var main = items.filter(function (i) { return footIds.indexOf(i) < 0; });
    var footer = items.filter(function (i) { return footIds.indexOf(i) >= 0; });
    if (c.roleId !== 'owner' && footer.indexOf('settings') < 0) footer.push('settings');
    function link(id) {
      var def = L.modules[id]; var label = modTitle(def, id);
      var count = id === 'messages' ? D.messages.filter(function (m) { return m.unread && (c.roleId === 'owner' || m.owner === c.user.id); }).length : 0;
      return '<a class="nav-item' + (c.module === id ? ' is-active' : '') + '" href="' + D.routeTo(c.roleId, id) + '">' + moduleIcon(def, id) + '<span>' + esc(label) + '</span>' + (count ? '<span class="count">' + count + '</span>' : '') + '</a>';
    }
    nav.innerHTML = main.map(link).join('');
    foot.innerHTML = footer.map(link).join('');
    $('#navSection').textContent = c.role.group === 'staff' ? 'Realtor OS' : c.role.group === 'vendor' ? tx('Portal de aliados', 'Partner portal') : tx('Portal de clientes', 'Client portal');
    $('#sidebarUser').innerHTML = '<span class="avatar avatar-sm">' + esc(c.user.initials) + '</span><div class="flex-1"><b class="truncate">' + esc(c.user.name) + '</b><small>' + esc(roleLabel(c.role)) + tx(' · cambiar', ' · switch') + '</small></div>' + icon('chevron-right');
    // role select
    var sel = $('#roleSelect');
    var lang = isEn() ? 'en' : 'es';
    if (!sel.options.length || sel.dataset.lang !== lang) {
      sel.innerHTML = ''; sel.dataset.lang = lang;
      ['staff', 'vendor', 'customer'].forEach(function (g) {
        var og = document.createElement('optgroup'); og.label = groupLabel(g);
        D.roles.filter(function (r) { return r.group === g; }).forEach(function (r) { var o = document.createElement('option'); o.value = r.id; o.textContent = roleLabel(r); og.appendChild(o); });
        sel.appendChild(og);
      });
      if (!sel.dataset.bound) { sel.dataset.bound = '1'; sel.addEventListener('change', function () { L.navigate(sel.value, 'home'); }); }
    }
    sel.value = c.roleId;
    $('#meAvatar').textContent = c.user.initials;
    var def = L.modules[c.module];
    $('#crumb').textContent = modTitle(def, c.module);
    document.title = 'Llave OS · ' + D.tenant.name + ' · ' + $('#crumb').textContent;
    updateBell(c);
    // tabbar (phone)
    var first = main.slice(0, 4);
    $('#tabbar').innerHTML = first.map(function (id) { return '<a href="' + D.routeTo(c.roleId, id) + '" class="' + (c.module === id ? 'is-active' : '') + '">' + icon(NAV_ICON[id] || 'layout-grid') + '<span>' + esc(navLabel(id)) + '</span></a>'; }).join('') + '<button data-action="open-more" aria-label="' + tx('Más', 'More') + '">' + icon('more-horizontal') + '<span>' + tx('Más', 'More') + '</span></button>';
    $('#themeBtn').innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
  }
  function updateBell(c) {
    var n = approvalsFor(c || ctx()).length, b = $('#bellCount');
    if (!b) return; b.textContent = n; b.hidden = !n;
  }

  /* --------------------------------------------------------------- render */
  var lastView = null;
  function render() {
    var r = D.parseRoute();
    var raw = r.raw.replace(/\/$/, '');
    var isPicker = raw === '' || raw === 'roles';
    if (state.mode === 'tv') return renderTV();
    if (state.mode === 'watch') return renderWatch();
    var root = $('#root');
    if (isPicker) {
      if (lastView !== 'picker') { root.innerHTML = renderPicker(); lastView = 'picker'; document.title = 'Llave OS · ' + D.tenant.name + ' · ' + tx('¿Quién eres hoy?', 'Who are you today?'); window.scrollTo(0, 0); }
      else root.innerHTML = renderPicker();
      return;
    }
    if (!D.role(r.role)) { location.hash = D.routeTo('owner', 'home'); return; }
    state.roleId = r.role; state.module = r.module; state.id = r.id;
    if (lastView !== 'app') { root.innerHTML = shellHTML(); lastView = 'app'; }
    var c = ctx();
    if (c.role.navItems.indexOf(c.module) < 0 && c.module !== 'settings' && !L.modules[c.module]) { location.hash = D.routeTo(c.roleId, 'home'); return; }
    renderShellChrome(c);
    var page = $('#page');
    var def = L.modules[c.module];
    var html;
    try { html = def ? def.render(c) : '<div class="page-header"><div><h1>' + esc(navLabel(c.module)) + '</h1></div></div>' + placeholder(c.module); }
    catch (err) { console.error('module ' + c.module, err); html = '<div class="callout callout-warn">' + icon('alert-triangle') + ' El módulo no pudo renderizarse: ' + esc(err.message) + '</div>'; }
    page.innerHTML = html;
    if (def && def.mount) { try { def.mount(page, c); } catch (err) { console.error('mount ' + c.module, err); } }
    $('#sidebar').classList.remove('is-open'); var sb = $('.sidebar-backdrop'); if (sb) sb.remove();
    closeSheet();
    if (window.I18N) window.I18N.apply(root);
    if (!state._keepScroll) window.scrollTo(0, 0);
    state._keepScroll = false;
  }
  L.rerender = function () { state._keepScroll = true; var y = window.scrollY; render(); window.scrollTo(0, y); };

  /* --------------------------------------------------------- approvals UI */
  function approvalCard(a, c) {
    var l = a.listingId ? D.listing(a.listingId) : null;
    return '<div class="ai-suggest" data-approval="' + a.id + '"><div class="approval-head"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave</div><span class="approval-kind">' + icon(a.icon) + esc(a.kindLabel) + '</span></div><div class="approval-title">' + esc(a.title) + '</div><div class="ai-suggest-body">' + esc(a.body) + '</div><div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="approve" data-kind="' + a.kind + '" data-id="' + a.id + '">' + icon('check') + ' Aprobar' + (a.kind === 'message' ? ' y enviar' : '') + '</button><button class="btn btn-secondary btn-sm" data-action="edit-draft" data-kind="' + a.kind + '" data-id="' + a.id + '">' + icon('edit') + ' Editar</button><button class="btn btn-ghost btn-sm" data-action="discard" data-kind="' + a.kind + '" data-id="' + a.id + '">Descartar</button></div><div class="ai-suggest-meta">' + esc(D.userName(a.who)) + (l ? ' · ' + esc(l.title) : '') + (a.due ? ' · ' + esc(relDay(a.due)) : '') + '</div></div>';
  }
  function approvalsHTML(c) {
    var list = approvalsFor(c);
    if (!list.length) return '<div class="empty">' + icon('check-circle') + '<b>Todo aprobado</b><span>Llave no tiene borradores esperando tu revisión.</span></div>';
    var byKind = { message: 'Mensajes', task: 'Tareas y borradores', contract: 'Contratos' };
    var html = '<p class="small muted">' + list.length + ' borradores de Llave esperan una decisión humana. Nada sale a un cliente, portal o notaría sin tu aprobación.</p>';
    ['message', 'task', 'contract'].forEach(function (k) {
      var items = list.filter(function (a) { return a.kind === k; }); if (!items.length) return;
      html += '<div class="section-title">' + esc(byKind[k]) + ' <span class="pill">' + items.length + '</span></div>' + items.map(function (a) { return approvalCard(a, c); }).join('');
    });
    return html;
  }
  function openApprovals() { var c = ctx(); openDrawer(approvalsHTML(c), { title: 'Bandeja de aprobaciones' }); }
  function refreshApprovalsDrawer() { var dr = $('.drawer'); if (dr && $('.drawer-header h3', dr).textContent === 'Bandeja de aprobaciones') $('.drawer-body', dr).innerHTML = approvalsHTML(ctx()); }
  function findApproval(kind, id) { return allApprovals().filter(function (a) { return a.kind === kind && a.id === id; })[0]; }
  function afterMutation() { updateBell(); refreshApprovalsDrawer(); if (lastView === 'app') L.rerender(); }
  L.action('approve', function (d) {
    var a = findApproval(d.kind, d.id); if (!a) return;
    if (a.kind === 'task') { a.obj.status = 'listo'; a.obj.approved = true; D.toast('Aprobado', a.title, 'success'); }
    if (a.kind === 'contract') { a.obj.lawyerApproved = true; a.obj.status = a.obj.status === 'borrador' ? 'enviado' : a.obj.status; a.obj.signers.forEach(function (s) { if (s.status === 'pendiente') s.status = 'enviado'; }); D.toast('Contrato aprobado', a.obj.type + ' · enviado a firma electrónica', 'success'); }
    if (a.kind === 'message') { a.obj.aiDraft.status = 'enviado'; a.obj.thread.push({ from: 'me', text: a.obj.aiDraft.text, at: new Date().toISOString(), ai: true }); a.obj.unread = false; D.toast('Mensaje enviado', 'Respuesta a ' + a.obj.name + ' por ' + channelLabel(a.obj.channel), 'success'); }
    afterMutation();
  });
  L.action('discard', function (d) {
    var a = findApproval(d.kind, d.id); if (!a) return;
    if (a.kind === 'task') { a.obj.discarded = true; a.obj.status = 'pendiente'; a.obj.aiDrafted = false; }
    if (a.kind === 'contract') { a.obj.discarded = true; }
    if (a.kind === 'message') { a.obj.aiDraft.status = 'descartado'; }
    D.toast('Borrador descartado', 'Llave aprenderá de esta decisión.', 'ai');
    afterMutation();
  });
  L.action('edit-draft', function (d) {
    var a = findApproval(d.kind, d.id); if (!a) return;
    var text = a.kind === 'message' ? a.obj.aiDraft.text : (a.obj.note || a.body);
    openModal('<div class="field"><span class="label">' + esc(a.title) + '</span><textarea class="textarea" id="editDraft" rows="6">' + esc(text) + '</textarea><span class="hint">Edita el borrador de Llave. Al guardar queda aprobado con tu firma.</span></div><div class="modal-footer"><button class="btn btn-ghost" data-action="close-modal">Cancelar</button><button class="btn btn-primary" data-action="save-draft" data-kind="' + a.kind + '" data-id="' + a.id + '">' + icon('check') + ' Guardar y aprobar</button></div>', { title: 'Editar borrador' });
  });
  L.action('save-draft', function (d) {
    var a = findApproval(d.kind, d.id); var ta = $('#editDraft'); if (!a || !ta) return;
    if (a.kind === 'message') a.obj.aiDraft.text = ta.value; else a.obj.note = ta.value;
    closeModal();
    L.actions.approve(d);
  });
  L.action('open-approvals', function () { openApprovals(); });

  /* ------------------------------------------------------ generic actions */
  L.action('close-drawer', function () { closeDrawer(); });
  L.action('close-modal', function () { closeModal(); });
  L.action('close-sheet', function () { closeSheet(); });
  L.action('toggle-theme', function () {
    var dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    D.setTheme(dark ? 'light' : 'dark');
    var b = $('#themeBtn'); if (b) b.innerHTML = icon(dark ? 'moon' : 'sun');
    $$('[data-action="toggle-theme"]').forEach(function (x) { if (x !== b) x.innerHTML = icon(dark ? 'moon' : 'sun'); });
  });
  L.action('toggle-sidebar', function () {
    var sb = $('#sidebar'); if (!sb) return;
    var open = sb.classList.toggle('is-open');
    var back = $('.sidebar-backdrop');
    if (open && !back) { back = el('<div class="sidebar-backdrop" data-action="toggle-sidebar"></div>'); document.body.appendChild(back); }
    if (!open && back) back.remove();
  });
  L.action('navigate', function (d) { L.navigate(d.role || state.roleId, d.module || 'home', d.id || null); });
  L.action('switch-tenant', function (d) {
    if (d.tenant === 'dorum') { D.toast('Dorum Lifestyle', 'Ya estás en esta agencia.', 'success'); return; }
    var name = d.tenant === 'andina' ? 'Casa Andina Realty' : 'Costa Prime';
    D.toast('Multi-tenant · demo', name + ' es un tenant de muestra. Cada agencia tiene sus datos, marca, roles y aprobaciones aisladas en Llave.', 'ai');
  });
  L.action('open-more', function () {
    var c = ctx();
    var items = c.role.navItems.slice(4); if (items.indexOf('settings') < 0) items.push('settings');
    var back = el('<div class="sheet-backdrop" data-action="close-sheet"></div>');
    var sheet = el('<div class="sheet" role="dialog" aria-label="Más módulos"><div class="sheet-grid">' + items.map(function (id) { return '<a href="' + D.routeTo(c.roleId, id) + '" class="' + (c.module === id ? 'is-active' : '') + '"><span class="ico-box">' + icon(NAV_ICON[id] || 'layout-grid') + '</span>' + esc(navLabel(id)) + '</a>'; }).join('') + '<a href="#/roles"><span class="ico-box">' + icon('users') + '</span>' + tx('Cambiar rol', 'Switch role') + '</a></div></div>');
    pushOverlay(back, 'sheet'); pushOverlay(sheet, 'sheet');
  });
  L.action('open-listing', function (d) {
    var l = D.listing(d.id); if (!l) return;
    var broker = D.user(l.listedBy);
    var syn = ['fincaRaiz', 'wasi', 'metrocuadrado', 'instagram'];
    var synLabel = { fincaRaiz: 'Finca Raíz', wasi: 'Wasi', metrocuadrado: 'Metrocuadrado', instagram: 'Instagram' };
    openDrawer('<div class="detail-hero"><img src="' + esc(l.cover) + '" alt="' + esc(l.title) + '"><span class="badge badge-status" data-status="' + esc(l.status) + '">' + esc(D.statusLabel(l.status)) + '</span></div>' +
      '<div><div class="listing-price">' + esc(D.fmtPrice(l)) + (l.currency === 'USD' ? ' <span class="pill pill-info">Internacional</span>' : '') + '</div><h3 style="margin-top:4px">' + esc(l.title) + '</h3><div class="listing-loc">' + esc(l.barrio) + ' · ' + esc(l.city) + (l.country ? ', ' + esc(l.country) : '') + '</div></div>' +
      '<div class="listing-specs"><span>' + esc(D.fmtM2(l.area)) + '</span>' + (l.habitaciones ? '<span>' + l.habitaciones + ' hab</span>' : '') + (l.banos ? '<span>' + l.banos + ' baños</span>' : '') + (l.parqueaderos ? '<span>' + l.parqueaderos + ' parq</span>' : '') + '</div>' +
      '<dl class="kv"><dt>Tipo</dt><dd>' + esc(D.typeLabel(l.type)) + ' · ' + esc(l.operacion) + '</dd><dt>Estrato</dt><dd>' + (l.estrato || '—') + '</dd><dt>Administración</dt><dd>' + (l.administracion ? esc(D.fmtCOP(l.administracion)) + ' / mes' : '—') + '</dd><dt>Precio por m²</dt><dd>' + esc(D.fmtMoney(D.pricePerM2(l), l.currency)) + '</dd><dt>Asesor</dt><dd>' + esc(broker ? broker.name : '—') + '</dd><dt>Mercado</dt><dd>' + l.daysOnMarket + ' días · ' + l.views.toLocaleString('es-CO') + ' vistas · ' + l.leads + ' leads</dd><dt>Portales</dt><dd><div class="row" style="gap:6px">' + syn.map(function (k) { return '<span class="status-chip"><i class="' + (l.syndication[k] ? '' : 'is-off') + '"></i>' + synLabel[k] + '</span>'; }).join('') + '</div></dd></dl>' +
      '<p class="small" style="color:var(--text-2)">' + esc(l.description) + '</p>' +
      '<div class="row" style="gap:6px">' + l.amenities.map(function (a) { return '<span class="pill">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '<div class="row"><a class="btn btn-primary btn-sm" href="' + D.routeTo(state.roleId, 'listings', l.id) + '" data-action="close-drawer-nav">' + icon('building') + ' Abrir en Inmuebles</a><a class="btn btn-secondary btn-sm" href="../dorum/listing.html?id=' + l.id + '" target="_blank" rel="noopener">' + icon('external-link') + ' Ver en sitio público</a></div>', { title: 'Inmueble' });
  });
  L.action('close-drawer-nav', function (d, node) { closeDrawer(); location.hash = node.getAttribute('href'); });
  L.action('open-contact', function (d) {
    var c = D.byId(D.contacts, d.id); if (!c) return;
    var interest = (c.interest || []).map(function (id) { return listingMini(D.listing(id)); }).join('');
    openDrawer('<div class="row"><span class="avatar avatar-lg">' + esc(c.name.split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('')) + '</span><div><h3>' + esc(c.name) + '</h3><div class="small muted">' + esc(c.kind) + ' · ' + esc(c.source) + ' · ' + esc(c.city || '') + '</div></div></div>' +
      '<dl class="kv"><dt>Etapa</dt><dd><span class="pill pill-brand">' + esc(c.stage) + '</span></dd><dt>Presupuesto</dt><dd>' + esc(D.fmtMoney(c.budget, c.currency)) + '</dd><dt>Asesor</dt><dd>' + esc(D.userName(c.owner)) + '</dd><dt>Último contacto</dt><dd>' + esc(D.fmtDate(c.lastTouch)) + '</dd><dt>Score</dt><dd><div class="progress" style="width:120px;display:inline-block;vertical-align:middle"><span style="--value:' + c.score + '%"></span></div> ' + c.score + '</dd>' + (c.propertyHint ? '<dt>Inmueble</dt><dd>' + esc(c.propertyHint) + '</dd>' : '') + '</dl>' +
      '<div class="callout">' + icon('clock') + '<div><b>Siguiente acción</b><br>' + esc(c.nextAction) + '</div></div>' + (interest ? '<div class="section-title">Interesado en</div><div class="stack stack-sm">' + interest + '</div>' : '') +
      '<div class="row">' + (c.whatsapp ? '<button class="btn btn-primary btn-sm" data-action="draft-whatsapp" data-id="' + c.id + '">' + icon('message-circle') + ' Redactar WhatsApp con Llave</button>' : '') + '<button class="btn btn-secondary btn-sm" data-action="open-voice" data-intent="log_call">' + icon('mic') + ' Registrar llamada</button></div>', { title: 'Contacto' });
  });
  L.action('draft-whatsapp', function (d) {
    var c = D.byId(D.contacts, d.id); if (!c) return;
    D.toast('Llave redactó un borrador', 'Mensaje para ' + c.name + ' en la bandeja de aprobaciones.', 'ai');
  });
  L.action('open-task', function (d) {
    var t = D.byId(D.tasks, d.id); if (!t) return;
    var l = t.listingId ? D.listing(t.listingId) : null;
    openDrawer('<h3>' + esc(t.title) + '</h3><div class="row"><span class="badge badge-status" data-status="' + esc(t.status) + '">' + esc(t.status) + '</span>' + (t.aiDrafted ? '<span class="badge badge-ai">AI · revisar</span>' : '') + '</div><dl class="kv"><dt>Responsable</dt><dd>' + esc(D.userName(t.assignee)) + '</dd><dt>Vence</dt><dd>' + esc(D.fmtDate(t.due)) + ' (' + esc(relDay(t.due)) + ')</dd><dt>Tipo</dt><dd>' + esc(t.kind || '—') + '</dd>' + (t.order ? '<dt>Orden</dt><dd>' + esc(t.order.pkg) + ' · ' + esc(D.fmtCOP(t.order.amount)) + '</dd>' : '') + '</dl>' + (t.note ? '<div class="callout">' + icon('sparkles') + '<div>' + esc(t.note) + '</div></div>' : '') + (l ? '<div class="section-title">Inmueble</div>' + listingMini(l) : '') + (t.aiDrafted && !t.approved && t.status !== 'listo' ? '<div class="row"><button class="btn btn-primary btn-sm" data-action="approve" data-kind="task" data-id="' + t.id + '">' + icon('check') + ' Aprobar</button><button class="btn btn-ghost btn-sm" data-action="discard" data-kind="task" data-id="' + t.id + '">Descartar</button></div>' : ''), { title: 'Tarea' });
  });
  L.action('open-search', function () { openPalette(); });
  L.action('open-voice', function (d) { openVoice(d && d.intent); });
  L.action('demo-toast', function (d) { D.toast(d.title || 'Listo', d.body || '', d.variant || 'success'); });

  /* ------------------------------------------------------ command palette */
  var pal = { items: [], active: 0 };
  function buildPaletteIndex(c) {
    var items = [];
    var navIds = c.role.navItems.slice();
    if (c.role.group !== 'customer' && navIds.indexOf('messages') < 0 && L.modules.messages) navIds.push('messages');
    navIds.forEach(function (id) { items.push({ group: 'Ir a', label: NAV_LABEL[id] || id, sub: 'Módulo', icon: NAV_ICON[id] || 'layout-grid', run: function () { L.navigate(c.roleId, id); } }); });
    items.push({ group: 'Ir a', label: 'Cambiar de rol', sub: '¿Quién eres hoy?', icon: 'users', run: function () { location.hash = '#/roles'; } });
    items.push({ group: 'Ir a', label: 'Bandeja de aprobaciones', sub: approvalsFor(c).length + ' pendientes', icon: 'bell', run: function () { openApprovals(); } });
    D.listings.forEach(function (l) { items.push({ group: 'Inmuebles', label: l.title, sub: l.city + ' · ' + D.fmtMoney(l.price, l.currency, { compact: true }), icon: 'building', keys: l.barrio + ' ' + l.type + ' ' + l.city + ' ' + l.id, run: function () { L.actions['open-listing']({ id: l.id }); } }); });
    D.contacts.forEach(function (k) { items.push({ group: 'Contactos', label: k.name, sub: k.kind + ' · ' + k.stage, icon: 'user', keys: k.city + ' ' + k.source + ' ' + (k.propertyHint || ''), run: function () { L.actions['open-contact']({ id: k.id }); } }); });
    D.deals.forEach(function (d) { items.push({ group: 'Negocios', label: d.title, sub: d.status, icon: 'handshake', keys: d.id, run: function () { L.navigate(c.roleId, c.role.navItems.indexOf('crm-sell') >= 0 ? 'crm-sell' : 'home', d.id); } }); });
    D.tasks.forEach(function (t) { items.push({ group: 'Tareas', label: t.title, sub: D.userName(t.assignee) + ' · ' + relDay(t.due), icon: 'kanban', keys: t.kind + ' ' + t.status, run: function () { L.actions['open-task']({ id: t.id }); } }); });
    D.voiceIntents.forEach(function (v) { items.push({ group: 'Pedir a Llave', label: v.say, sub: v.intent, icon: 'mic', keys: v.does, run: function () { openVoice(v.intent); } }); });
    return items;
  }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function filterPalette(q) {
    var nq = norm(q).trim();
    var all = pal.index;
    if (!nq) return all.filter(function (i) { return i.group === 'Ir a'; }).slice(0, 8).concat(all.filter(function (i) { return i.group === 'Pedir a Llave'; }).slice(0, 3));
    var terms = nq.split(/\s+/);
    return all.map(function (i) {
      var hay = norm(i.label + ' ' + (i.sub || '') + ' ' + (i.keys || '') + ' ' + i.group);
      var score = 0; terms.forEach(function (t) { if (norm(i.label).indexOf(t) === 0) score += 3; else if (norm(i.label).indexOf(t) >= 0) score += 2; else if (hay.indexOf(t) >= 0) score += 1; else score -= 5; });
      return { i: i, s: score };
    }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 14).map(function (x) { return x.i; });
  }
  function renderPaletteList() {
    var list = $('#cmdkList'); if (!list) return;
    if (!pal.items.length) { list.innerHTML = '<div class="empty">' + icon('search') + '<span>Sin resultados. Prueba con un barrio, un nombre o "agenda".</span></div>'; return; }
    var html = '', lastG = null;
    pal.items.forEach(function (it, i) {
      if (it.group !== lastG) { html += '<div class="cmdk-group">' + esc(it.group) + '</div>'; lastG = it.group; }
      html += '<div class="cmdk-item' + (i === pal.active ? ' is-active' : '') + '" data-idx="' + i + '">' + icon(it.icon) + '<span class="truncate">' + esc(it.label) + '</span><span class="cmdk-sub">' + esc(it.sub || '') + '</span></div>';
    });
    list.innerHTML = html;
    var act = $('.cmdk-item.is-active', list); if (act) act.scrollIntoView({ block: 'nearest' });
  }
  function openPalette() {
    if ($('.cmdk-backdrop')) return;
    var c = ctx(); pal.index = buildPaletteIndex(c); pal.items = filterPalette(''); pal.active = 0;
    var back = el('<div class="cmdk-backdrop"><div class="cmdk" role="dialog" aria-label="Buscar"><div class="cmdk-input">' + icon('search') + '<input id="cmdkInput" placeholder="Busca inmuebles, contactos, negocios, tareas… o pídele algo a Llave" autocomplete="off" aria-label="Buscar"><kbd>esc</kbd></div><div class="cmdk-list" id="cmdkList"></div><div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>↵</kbd> abrir</span><span><kbd>esc</kbd> cerrar</span></div></div></div>');
    back.addEventListener('click', function (e) { if (e.target === back) closePalette(); var it = e.target.closest('.cmdk-item'); if (it) { runPalette(+it.dataset.idx); } });
    pushOverlay(back, 'palette');
    renderPaletteList();
    var inp = $('#cmdkInput');
    inp.addEventListener('input', function () { pal.items = filterPalette(inp.value); pal.active = 0; renderPaletteList(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); pal.active = Math.min(pal.items.length - 1, pal.active + 1); renderPaletteList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pal.active = Math.max(0, pal.active - 1); renderPaletteList(); }
      else if (e.key === 'Enter') { e.preventDefault(); runPalette(pal.active); }
    });
    setTimeout(function () { inp.focus(); }, 20);
  }
  function closePalette() { while (popOverlay('palette')) {} }
  function runPalette(i) { var it = pal.items[i]; if (!it) return; closePalette(); it.run(); }

  /* -------------------------------------------------------- voice assistant */
  var voice = { open: false, timer: null, rec: null, intent: null, phase: 'idle' };
  function intentsFor(roleId) {
    var mine = D.voiceIntents.filter(function (v) { return v.role === roleId; });
    var others = D.voiceIntents.filter(function (v) { return v.role !== roleId; });
    return mine.concat(others);
  }
  function matchIntent(text) {
    var nt = norm(text); var words = nt.split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3; });
    var best = null, bs = 0;
    D.voiceIntents.forEach(function (v) {
      var hay = norm(v.say + ' ' + v.does + ' ' + v.intent);
      var s = 0; words.forEach(function (w) { if (hay.indexOf(w) >= 0) s++; });
      if (s > bs) { bs = s; best = v; }
    });
    return bs >= 2 ? best : null;
  }
  function openVoice(intentId) {
    if (voice.open) { closeVoice(); }
    var c = ctx();
    var list = intentsFor(c.roleId);
    var v = intentId ? D.voiceIntents.filter(function (x) { return x.intent === intentId; })[0] : list[0];
    var ov = el('<div class="voice-overlay" role="dialog" aria-modal="true" aria-label="Asistente de voz Llave"><button class="btn btn-ghost btn-icon voice-close" data-action="close-voice" aria-label="Cerrar">' + icon('x') + '</button><div class="voice-stage"><button class="voice-orb voice-orb-xl is-listening" id="voiceOrb" data-action="voice-toggle" aria-label="Escuchando">' + icon('mic') + '</button><div class="voice-status is-live" id="voiceStatus">Escuchando…</div><p class="voice-transcript is-empty" id="voiceText"><span class="voice-caret"></span></p><div id="voiceCard" style="width:100%"></div><div class="voice-chips" id="voiceChips"></div><p class="voice-hint">Di «Llave…» o toca un ejemplo · <kbd>espacio</kbd> pausa · <kbd>esc</kbd> cierra' + (window.SpeechRecognition || window.webkitSpeechRecognition ? ' · micrófono real disponible' : '') + '</p></div></div>');
    pushOverlay(ov, 'voice'); voice.open = true;
    renderVoiceChips(list, v);
    startRealRecognition();
    simulateUtterance(v);
  }
  function renderVoiceChips(list, current) {
    var ch = $('#voiceChips'); if (!ch) return;
    ch.innerHTML = list.filter(function (x) { return x !== current; }).slice(0, 5).map(function (x) { return '<button class="chip" data-action="voice-say" data-intent="' + esc(x.intent) + '">' + icon('mic', 'ico-sm') + '<span>' + esc(D.tx(x, 'say').replace(/^Llave,\s*/i, '').slice(0, 58)) + (D.tx(x, 'say').length > 62 ? '…' : '') + '</span></button>'; }).join('');
  }
  function simulateUtterance(v) {
    clearTimeout(voice.timer); voice.intent = v; voice.phase = 'listening';
    var txt = $('#voiceText'), orb = $('#voiceOrb'), st = $('#voiceStatus'), card = $('#voiceCard');
    if (!txt) return;
    card.innerHTML = ''; txt.classList.remove('is-empty'); orb.classList.add('is-listening'); st.textContent = 'Escuchando…'; st.classList.add('is-live');
    var i = 0, s = v.say;
    txt.innerHTML = '<span class="voice-caret"></span>';
    function step() {
      i = Math.min(s.length, i + (Math.random() < 0.3 ? 3 : 2));
      txt.innerHTML = esc(s.slice(0, i)) + '<span class="voice-caret"></span>';
      if (i < s.length) voice.timer = setTimeout(step, 28 + Math.random() * 40);
      else { txt.textContent = s; voice.timer = setTimeout(function () { showIntent(v); }, 420); }
    }
    voice.timer = setTimeout(step, 350);
  }
  function showIntent(v, spoken) {
    voice.phase = v.confirm ? 'confirm' : 'done';
    var orb = $('#voiceOrb'), st = $('#voiceStatus'), card = $('#voiceCard'); if (!card) return;
    orb.classList.remove('is-listening'); st.textContent = v.confirm ? 'Necesita tu confirmación' : 'Entendido'; st.classList.remove('is-live');
    var label = { schedule_visit: 'Agendar visita', log_call: 'Registrar llamada', listing_status: 'Estado del inmueble', price_update: 'Cambiar precio', send_followup: 'Enviar seguimientos', order_service: 'Ordenar servicio', publish_listing: 'Publicar inmueble', read_pipeline: 'Resumen del día', capture_tour_feedback: 'Feedback de recorrido', document_status: 'Estado de documentos', approve_ai_draft: 'Aprobar borrador AI', rent_status: 'Estado de cartera', payout_status: 'Comisiones pendientes', maintenance_ticket: 'Ticket de mantenimiento' }[v.intent] || v.intent;
    card.innerHTML = '<div class="voice-card"><div class="vc-row"><span>Entendí</span><div class="vc-intent">' + esc(label) + ' <code>' + esc(v.intent) + '</code>' + (spoken ? '<span class="pill pill-success">voz real</span>' : '') + '</div></div><div class="vc-row"><span>Llave hará</span><div>' + esc(v.does) + '</div></div>' +
      (v.confirm ? '<div class="vc-row"><span>Control</span><div class="row" style="gap:6px"><span class="badge badge-warn">Requiere confirmación humana</span><span class="small muted">Acción financiera, pública o irreversible.</span></div></div><div class="vc-actions"><button class="btn btn-primary" data-action="voice-confirm">' + icon('check') + ' Confirmar</button><button class="btn btn-secondary" data-action="voice-cancel">Cancelar</button><button class="btn btn-ghost" data-action="voice-say" data-intent="' + esc(v.intent) + '">' + icon('refresh-cw') + ' Repetir</button></div>'
        : '<div class="vc-actions"><span class="vc-done">' + icon('check-circle') + ' Hecho · registrado en el expediente</span><span class="flex-1"></span><button class="btn btn-ghost btn-sm" data-action="voice-undo">' + icon('undo') + ' Deshacer</button></div>') + '</div>';
  }
  L.action('voice-say', function (d) { var v = D.voiceIntents.filter(function (x) { return x.intent === d.intent; })[0]; if (!v) return; renderVoiceChips(intentsFor(state.roleId), v); simulateUtterance(v); });
  L.action('voice-confirm', function () {
    var v = voice.intent; var card = $('#voiceCard'); if (!card || !v) return;
    voice.phase = 'done';
    card.innerHTML = '<div class="voice-card"><div class="vc-row"><span>Confirmado</span><div class="vc-intent">' + esc(v.does) + '</div></div><div class="vc-actions"><span class="vc-done">' + icon('check-circle') + ' Ejecutado con tu confirmación · queda en el registro de auditoría</span><span class="flex-1"></span><button class="btn btn-ghost btn-sm" data-action="close-voice">Cerrar</button></div></div>';
    $('#voiceStatus').textContent = 'Listo';
    D.toast('Llave ejecutó la orden', v.does.split('.')[0] + '.', 'success');
  });
  L.action('voice-cancel', function () { var card = $('#voiceCard'); if (card) card.innerHTML = '<div class="voice-card"><div class="vc-row"><span>Cancelado</span><div>No se hizo ningún cambio. Puedes dictar otra orden.</div></div></div>'; $('#voiceStatus').textContent = 'Cancelado'; });
  L.action('voice-undo', function () { D.toast('Deshecho', 'Llave revirtió la acción.', 'ai'); closeVoice(); });
  L.action('voice-toggle', function () {
    var orb = $('#voiceOrb'), st = $('#voiceStatus'); if (!orb) return;
    if (orb.classList.contains('is-listening')) { orb.classList.remove('is-listening'); st.textContent = 'En pausa'; st.classList.remove('is-live'); clearTimeout(voice.timer); }
    else { var txt = $('#voiceText'); txt.innerHTML = '<span class="voice-caret"></span>'; $('#voiceCard').innerHTML = ''; orb.classList.add('is-listening'); st.textContent = 'Escuchando…'; st.classList.add('is-live'); if (!voice.rec) simulateUtterance(voice.intent || intentsFor(state.roleId)[0]); }
  });
  L.action('close-voice', function () { closeVoice(); });
  function closeVoice() { clearTimeout(voice.timer); stopRealRecognition(); while (popOverlay('voice')) {} voice.open = false; }
  function startRealRecognition() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    try {
      var rec = new SR(); rec.lang = 'es-CO'; rec.interimResults = true; rec.continuous = false;
      rec.onresult = function (e) {
        var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
        clearTimeout(voice.timer);
        var txt = $('#voiceText'); if (txt) { txt.classList.remove('is-empty'); txt.innerHTML = esc(t) + '<span class="voice-caret"></span>'; }
        if (e.results[e.results.length - 1].isFinal) {
          var v = matchIntent(t);
          if (v) { voice.intent = v; showIntent(v, true); }
          else { var card = $('#voiceCard'); if (card) card.innerHTML = '<div class="voice-card"><div class="vc-row"><span>Hmm</span><div>No reconocí esa orden en la demo. Prueba una de las sugerencias.</div></div></div>'; }
        }
      };
      rec.onerror = function () { voice.rec = null; };
      rec.onend = function () { voice.rec = null; };
      rec.start(); voice.rec = rec;
    } catch (e) { voice.rec = null; }
  }
  function stopRealRecognition() { if (voice.rec) { try { voice.rec.abort(); } catch (e) {} voice.rec = null; } }

  /* ------------------------------------------------------------- TV mode */
  var tv = { idx: 0, timer: null, cycle: 0, clock: null };
  function tvPanels(c) {
    var brokers = D.usersByRole('broker');
    var lb = brokers.map(function (b) {
      var deals = D.dealsFor(b.id).filter(function (d) { return d.kind === 'venta'; });
      var proj = 0; deals.forEach(function (d) { D.computeSplit(d).rows.forEach(function (r) { if (r.participant === b.id && (r.kind === 'commission' || r.kind === 'referral')) proj += r.amount; }); });
      var ls = D.listingsBy(b.id);
      return { u: b, listings: ls.length, active: ls.filter(function (l) { return l.status === 'activo' || l.status === 'bajo oferta'; }).length, deals: deals.length, leads: sum(ls, function (l) { return l.leads; }), proj: proj };
    }).sort(function (a, b) { return b.proj - a.proj; });
    var maxProj = Math.max.apply(null, lb.map(function (x) { return x.proj; }).concat([1]));
    var p1 = '<div class="tv-h"><h2>Equipo <em>Dorum</em></h2><span class="sub">Comisiones proyectadas · negocios en curso · leads</span></div><div class="tv-card" style="flex:1"><table class="tv-table"><thead><tr><th></th><th>Asesor</th><th class="num">Inmuebles</th><th class="num">Leads</th><th class="num">Negocios</th><th style="width:26%">Comisión proyectada</th><th class="num"></th></tr></thead><tbody>' + lb.map(function (x, i) {
      return '<tr><td class="rank">' + (i + 1) + '</td><td><div class="who"><span class="avatar">' + esc(x.u.initials) + '</span><div>' + esc(x.u.name) + '<small>' + esc(x.u.title) + '</small></div></div></td><td class="num">' + x.active + ' <span style="color:var(--tv-muted);font-size:16px">/ ' + x.listings + '</span></td><td class="num">' + x.leads + '</td><td class="num">' + x.deals + '</td><td><div class="tv-bar-track"><span style="--w:' + Math.round(x.proj / maxProj * 100) + '%"></span></div></td><td class="num">' + esc(D.fmtCOP(x.proj, { compact: true })) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
      '<div class="tv-grid-3" style="flex:0 0 auto"><div class="tv-card"><span class="label">Leads · 30 días</span><div class="big sm">' + D.kpis.leads30d + '</div><span class="delta">' + D.contacts.filter(function (x) { return x.lastTouch === todayISO(); }).length + ' nuevos hoy</span></div><div class="tv-card"><span class="label">Recorridos esta semana</span><div class="big sm">' + D.kpis.toursThisWeek + '</div><span class="delta">' + D.contacts.filter(function (x) { return x.stage === 'tour' || x.stage === 'visita'; }).length + ' contactos en etapa de visita</span></div><div class="tv-card"><span class="label">Borradores de Llave aprobados</span><div class="big sm">' + (D.tasks.filter(function (t) { return t.aiDrafted && t.status === 'listo'; }).length + D.contracts.filter(function (k) { return k.aiDrafted && k.lawyerApproved; }).length) + '</div><span class="delta">' + allApprovals().length + ' esperan una decisión humana</span></div></div>';
    var live = D.campaigns.filter(function (k) { return k.status === 'activa'; });
    var p2 = '<div class="tv-h"><h2>Pauta <em>en vivo</em></h2><span class="sub">' + live.length + ' campañas activas · ' + esc(D.fmtCOP(sum(live, function (k) { return k.spend; }), { compact: true })) + ' invertidos · ' + sum(live, function (k) { return k.leads; }) + ' leads</span></div><div class="tv-grid-3">' + live.map(function (k) {
      var l = k.listingId ? D.listing(k.listingId) : null;
      return '<div class="tv-card"><span class="label">' + esc(k.platform) + '</span><div style="font-size:26px;font-weight:600;line-height:1.2">' + esc(k.name) + '</div><div class="big sm">' + esc(D.fmtCOP(k.cpl)) + ' <span style="font-size:18px;color:var(--tv-muted);font-family:var(--font-ui)">CPL</span></div><div class="tv-bar-track"><span style="--w:' + Math.round(k.spend / k.budget * 100) + '%"></span></div><div style="display:flex;justify-content:space-between;font-size:18px;color:var(--tv-muted)"><span>' + esc(D.fmtCOP(k.spend, { compact: true })) + ' de ' + esc(D.fmtCOP(k.budget, { compact: true })) + '</span><span>' + k.leads + ' leads · ' + k.clicks.toLocaleString('es-CO') + ' clics</span></div>' + (l ? '<div style="font-size:17px;color:var(--tv-muted)">' + esc(l.title) + '</div>' : '') + (k.aiCreative ? '<span class="pill" style="align-self:flex-start;background:var(--ai);color:#fff;font-size:14px">Creativos por Llave</span>' : '') + '</div>';
    }).join('') + '</div>';
    var feat = D.listings.filter(function (l) { return l.featured; });
    var off = (tv.cycle * 3) % feat.length;
    var pick = [0, 1, 2].map(function (i) { return feat[(off + i) % feat.length]; });
    var p3 = '<div class="tv-h"><h2>Curated <em>by nature</em></h2><span class="sub">' + D.listings.filter(function (l) { return l.status === 'activo'; }).length + ' inmuebles activos · ' + esc(D.fmtCOP(sum(D.listings.filter(function (l) { return l.operacion === 'venta' && l.currency === 'COP'; }), function (l) { return l.price; }), { compact: true })) + ' en portafolio</span></div><div class="tv-listings">' + pick.map(function (l) {
      return '<div class="tv-listing"><img src="' + esc(l.cover.replace('/800/600', '/1200/900')) + '" alt="' + esc(l.title) + '"><span class="badge badge-status" data-status="' + esc(l.status) + '">' + esc(D.statusLabel(l.status)) + '</span><div class="over"><div class="price">' + esc(D.fmtPrice(l)) + '</div><div class="title">' + esc(l.title) + '</div><div class="loc">' + esc(l.barrio) + ' · ' + esc(l.city) + '</div><div class="specs"><span>' + esc(D.fmtM2(l.area)) + '</span>' + (l.habitaciones ? '<span>' + l.habitaciones + ' hab</span>' : '') + (l.banos ? '<span>' + l.banos + ' baños</span>' : '') + '<span>' + l.leads + ' leads</span></div></div></div>';
    }).join('') + '</div>';
    var stages = D.pipelineStages.map(function (s) { return { label: s.label, value: D.listings.filter(function (l) { return l.stage === s.id; }).length }; }).filter(function (x) { return x.value; });
    var k = D.kpis;
    var p4 = '<div class="tv-h"><h2>Dinero y <em>pipeline</em></h2><span class="sub">Escrow segregado · comisiones · cartera</span></div><div class="tv-grid-4"><div class="tv-card"><span class="label">Valor del pipeline</span><div class="big">' + esc(D.fmtCOP(k.pipelineValueCOP, { compact: true })) + '</div><span class="delta">' + k.listingsUnderOffer + ' bajo oferta · ' + k.listingsActive + ' activos</span></div><div class="tv-card"><span class="label">Comisiones proyectadas · mes</span><div class="big">' + esc(D.fmtCOP(k.commissionProjectedMonthCOP, { compact: true })) + '</div><span class="delta">' + k.toursThisWeek + ' recorridos esta semana</span></div><div class="tv-card"><span class="label">En escrow</span><div class="big">' + esc(D.fmtCOP(D.escrowSummary.held, { compact: true })) + '</div><span class="delta">+' + esc(D.fmtCOP(D.escrowSummary.projected30d, { compact: true })) + ' proyectados 30 d · ' + D.escrowSummary.pendingReleases + ' liberaciones</span></div><div class="tv-card"><span class="label">Recaudo de arriendos</span><div class="big">' + k.rentCollectedPct + '<span style="font-size:40px">%</span></div><span class="delta">' + k.leads30d + ' leads en 30 días · ' + k.avgDaysOnMarket + ' días promedio</span></div></div><div class="tv-grid-2"><div class="tv-card"><span class="label">Inmuebles por etapa</span><div class="donut-wrap">' + chart.donut(stages, { center: D.listings.length }) + '<div class="legend">' + stages.map(function (s, i) { var pal = ['var(--brand)', 'var(--brand-3)', 'var(--accent)', 'var(--warn)', 'var(--info)', 'var(--ai)', 'var(--text-3)']; return '<span><i style="--c:' + pal[i % pal.length] + '"></i>' + esc(s.label) + '<b>' + s.value + '</b></span>'; }).join('') + '</div></div></div><div class="tv-card"><span class="label">Leads por semana · 8 semanas</span><div class="spark">' + chart.sparkline([18, 22, 19, 27, 31, 26, 34, 38]) + '</div><span class="delta">Fuentes: Instagram ' + D.byId(D.integrations, 'instagram').leads30d + ' · Finca Raíz ' + D.byId(D.integrations, 'fincaRaiz').leads30d + ' · Metrocuadrado ' + D.byId(D.integrations, 'metrocuadrado').leads30d + ' · Wasi ' + D.byId(D.integrations, 'wasi').leads30d + '</span></div></div>';
    var evs = events({ roleId: 'owner', role: D.role('owner'), user: D.user('u-owner') }).filter(function (e) { return e.date >= todayISO(); }).slice(0, 6);
    var p5 = '<div class="tv-h"><h2><em>Hoy</em> en Dorum</h2><span class="sub">' + esc(D.fmtDate(todayISO(), 'long')) + ' · ' + allApprovals().length + ' borradores de Llave esperan aprobación</span></div><div class="tv-card tv-agenda">' + evs.map(function (e) {
      return '<div class="row-ev"><time>' + (e.time || relDay(e.date)) + '</time><div><div>' + esc(e.title) + '</div><div class="m">' + esc(e.meta) + (e.time ? ' · ' + esc(relDay(e.date)) : '') + '</div></div><span class="pill' + (e.ai ? ' is-ai' : '') + '">' + (e.ai ? 'Borrador AI' : { tour: 'Recorrido', visit: 'Captación', shoot: 'Sesión foto', deal: 'Negocio', task: 'Tarea' }[e.kind]) + '</span></div>';
    }).join('') + '</div>';
    return [p1, p2, p3, p4, p5];
  }
  function renderTV() {
    document.documentElement.classList.add('mode-tv');
    var root = $('#root'); var c = ctx();
    var panels = tvPanels(c);
    root.innerHTML = '<div class="tv"><header class="tv-bar"><div class="logo">D</div><div class="brand"><strong>' + esc(D.tenant.name) + '</strong><small>' + esc(D.tenant.instagramLine) + ' · Llave OS</small></div><div class="spacer"></div><div class="tv-dots" id="tvDots">' + panels.map(function (_, i) { return '<i class="' + (i === tv.idx ? 'is-active' : '') + '"></i>'; }).join('') + '</div><div class="spacer"></div><div style="text-align:right"><div class="tv-clock" id="tvClock">--:--</div><div class="tv-date">' + esc(capFirst(D.fmtDate(todayISO(), 'long'))) + '</div></div>' + langToggle({ size: 'sm', dark: true, cls: 'tv-lang' }) + '</header><div class="tv-stage">' + panels.map(function (p, i) { return '<section class="tv-panel' + (i === tv.idx ? ' is-active' : '') + '">' + p + '</section>'; }).join('') + '</div><footer class="tv-foot"><span>' + esc(tx(D.tenant.taglineEs, D.tenant.tagline)) + '</span><span class="tv-cta"><span class="voice-orb"></span> «Llave, ¿cómo va el apartamento de Envigado?»</span><span>' + esc(D.tenant.offices.map(function (o) { return o.city; }).join(' · ')) + '</span></footer></div>';
    function tick() { var d = new Date(); var e = $('#tvClock'); if (e) e.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    tick(); clearInterval(tv.clock); tv.clock = setInterval(tick, 10000);
    clearInterval(tv.timer);
    tv.timer = setInterval(function () { tvStep(1); }, 8000);
  }
  function tvStep(dir) {
    var panels = $$('.tv-panel'); if (!panels.length) return;
    tv.idx = (tv.idx + dir + panels.length) % panels.length;
    if (tv.idx === 0) { tv.cycle++; renderTV(); return; }
    panels.forEach(function (p, i) { p.classList.toggle('is-active', i === tv.idx); });
    $$('#tvDots i').forEach(function (d, i) { d.classList.toggle('is-active', i === tv.idx); });
  }

  /* ---------------------------------------------------------- watch mode */
  var watch = { phase: 'idle', timer: null };
  function watchGlance(c) {
    var apps = approvalsFor(c).length;
    var evs = events(c).filter(function (e) { return e.date >= todayISO(); });
    var next = evs[0];
    if (c.roleId === 'renter') { var d4 = D.deals.filter(function (d) { return d.parties.renter === c.user.id; })[0]; return { k: 'Canon de octubre', v: d4 ? D.fmtCOP(d4.monthlyRent) : '—', m: 'Vence 5 oct · pagar desde el reloj', cls: '' }; }
    if (c.roleId === 'landlord') { return { k: 'Liquidación de agosto', v: D.fmtCOP(13440000, { compact: true }), m: 'Se abona el 30 sep', cls: 'is-ok' }; }
    if (c.roleId === 'buyer') { return next ? { k: 'Próximo recorrido', v: next.title, m: relDay(next.date) + (next.time ? ' · ' + next.time : ''), cls: '', sm: true } : { k: 'Recorridos', v: 'Sin agenda', m: 'Pide uno a Llave', cls: '' }; }
    if (apps && (c.roleId === 'owner' || c.roleId === 'lawyer' || c.roleId === 'accountant')) return { k: 'Por aprobar', v: apps + ' borradores', m: 'Toca el orb: «Llave, léeme el primero»', cls: 'is-ai' };
    if (next) return { k: next.kind === 'tour' || next.kind === 'visit' ? 'Próxima visita' : 'Siguiente', v: next.title, m: relDay(next.date) + (next.time ? ' · ' + next.time : '') + (next.meta ? ' · ' + next.meta : ''), cls: '', sm: true };
    return { k: 'Hoy', v: 'Agenda libre', m: 'Sin eventos próximos', cls: 'is-ok' };
  }
  function renderWatch() {
    document.documentElement.classList.add('mode-watch');
    var c = ctx(); var g = watchGlance(c);
    var cmds = intentsFor(c.roleId).slice(0, 3);
    var d = new Date(); var time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    $('#root').innerHTML = '<div class="watch"><div class="watch-top"><span>' + esc(firstName(c.user.name)) + '</span>' + langToggle({ size: 'xs', cls: 'watch-lang' }) + '<b>' + time + '</b></div><div class="watch-orb-row"><button class="voice-orb" id="wOrb" data-action="watch-listen" aria-label="Hablar con Llave">' + icon('mic') + '</button></div><div class="watch-line" id="wLine">Toca y habla con Llave</div><div class="watch-card ' + g.cls + '" id="wCard"><span class="k">' + esc(g.k) + '</span><span class="v' + (g.sm ? ' sm' : '') + '">' + esc(g.v) + '</span><span class="m">' + esc(g.m) + '</span></div><div class="watch-cmds" id="wCmds">' + cmds.map(function (v) { return '<button data-action="watch-say" data-intent="' + esc(v.intent) + '">' + icon('mic') + '<span>' + esc(D.tx(v, 'say').replace(/^Llave,\s*/i, '')) + '</span></button>'; }).join('') + '</div></div>';
  }
  function watchSay(v) {
    clearTimeout(watch.timer);
    var orb = $('#wOrb'), line = $('#wLine'), card = $('#wCard'), cmds = $('#wCmds'); if (!orb) return;
    orb.classList.add('is-listening'); line.classList.add('is-live'); line.textContent = '';
    var s = D.tx(v, 'say').replace(/^Llave,\s*/i, ''), i = 0;
    function step() { i = Math.min(s.length, i + 3); line.textContent = s.slice(0, i); if (i < s.length) watch.timer = setTimeout(step, 30); else watch.timer = setTimeout(done, 400); }
    function done() {
      orb.classList.remove('is-listening'); line.classList.remove('is-live'); line.textContent = v.confirm ? 'Necesita confirmación' : 'Entendido';
      card.className = 'watch-card is-ai'; var vd = D.tx(v, 'does'); card.innerHTML = '<span class="k">' + tx('Llave hará', 'Llave will') + '</span><span class="v sm">' + esc(vd.length > 110 ? vd.slice(0, 108) + '…' : vd) + '</span>';
      cmds.innerHTML = v.confirm ? '<div class="watch-actions" style="flex:1 0 100%"><button class="is-primary" data-action="watch-confirm">Confirmar</button><button data-action="watch-reset">Cancelar</button></div>' : '<div class="watch-actions" style="flex:1 0 100%"><button class="is-primary" data-action="watch-reset">Listo</button></div>';
    }
    watch.timer = setTimeout(step, 200);
  }
  L.action('watch-say', function (d) { var v = D.voiceIntents.filter(function (x) { return x.intent === d.intent; })[0]; if (v) watchSay(v); });
  L.action('watch-listen', function () { watchSay(intentsFor(state.roleId)[0]); });
  L.action('watch-confirm', function () { var card = $('#wCard'); if (card) { card.className = 'watch-card is-ok'; card.innerHTML = '<span class="k">Confirmado</span><span class="v">Hecho ✓</span><span class="m">Queda en el registro</span>'; } $('#wLine').textContent = 'Listo'; $('#wCmds').innerHTML = '<div class="watch-actions" style="flex:1 0 100%"><button data-action="watch-reset">Volver</button></div>'; });
  L.action('watch-reset', function () { renderWatch(); });

  /* ------------------------------------------------------------- global */
  document.addEventListener('click', function (e) {
    var node = e.target.closest('[data-action]'); if (!node) return;
    if (e.target.closest('a[href]') && !node.matches('a')) { /* let inner links work */ }
    var fn = L.actions[node.dataset.action];
    if (!fn) return;
    if (node.tagName === 'A' && node.getAttribute('href') && node.getAttribute('href') !== '#') { /* keep href navigation unless handler prevents */ }
    else e.preventDefault();
    try { fn(node.dataset, node, ctx(), e); } catch (err) { console.error('action ' + node.dataset.action, err); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if ($('.cmdk-backdrop')) closePalette(); else openPalette(); return; }
    if (e.key === 'Escape') { if ($('.cmdk-backdrop')) { closePalette(); return; } if (closeTop()) e.preventDefault(); return; }
    if (voice.open && e.key === ' ' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); L.actions['voice-toggle'](); return; }
    if (state.mode === 'tv' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { tvStep(e.key === 'ArrowRight' ? 1 : -1); clearInterval(tv.timer); tv.timer = setInterval(function () { tvStep(1); }, 8000); }
  });
  window.addEventListener('hashchange', render);

  /* ---------------------------------------------------------------- boot */
  function boot() {
    var mode = new URLSearchParams(location.search).get('mode');
    if (['tv', 'watch', 'phone'].indexOf(mode) >= 0) state.mode = mode;
    if (state.mode === 'phone') document.documentElement.classList.add('is-phone');
    if (state.mode === 'tv' || state.mode === 'watch') {
      var r = D.parseRoute(); if (!D.role(r.role) || !r.raw || r.raw === 'roles') { location.hash = D.routeTo(state.mode === 'tv' ? 'owner' : 'broker', 'home'); }
      r = D.parseRoute(); state.roleId = r.role; state.module = 'home';
    }
    if (!$('#root')) { var rt = document.createElement('div'); rt.id = 'root'; document.body.prepend(rt); }
    render();
  }
  if (window.I18N) window.I18N.onChange(function () { closeDrawer(); closeModal(); closeSheet(); if ($('.cmdk-backdrop')) closePalette(); L.rerender(); });
  L.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { if (!L._booted) { L._booted = true; boot(); } });
  else { L._booted = true; boot(); }
})();
