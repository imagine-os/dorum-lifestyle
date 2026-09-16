/* ==========================================================================
   Llave OS · Dorum tenant app · SALES-SIDE MODULES
   listings · crm-get · crm-sell · projects · orders · media · publishing · ads
   + home widgets. Plain script; plugs into window.LLAVE (app/app.js).
   Reads/mutates window.DORUM in memory. AI drafts → a person approves.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.LLAVE || !window.DORUM) return;
  var L = window.LLAVE, D = window.DORUM;

  /* ------------------------------------------------------------ utilities */
  var esc = typeof L.esc === 'function' ? L.esc : function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  };
  var icon = typeof L.icon === 'function' ? function (n) { return L.icon(n) || ''; } : function () { return ''; };
  var toast = function (t, b, v) { if (typeof L.toast === 'function') L.toast(t, b, v); else if (D.toast) D.toast(t, b, v); };
  var rerender = function () { if (typeof L.rerender === 'function') L.rerender(); };
  var route = function (ctx, mod, id) { return D.routeTo((ctx && ctx.roleId) || 'owner', mod, id); };
  var CUR = { roleId: 'owner', user: D.user('u-owner') }; // last ctx seen by a render

  function ctxUser(ctx) {
    ctx = ctx || CUR;
    if (ctx.user) return ctx.user;
    var us = D.usersByRole(ctx.roleId || 'owner');
    return us[0] || D.user('u-owner');
  }
  function isStaffAll(roleId) { return ['owner', 'sales_admin', 'rental_admin', 'accountant', 'lawyer'].indexOf(roleId) >= 0; }
  function isVendor(roleId) { return ['photographer', 'advertiser', 'writer', 'construction', 'lender'].indexOf(roleId) >= 0; }
  function seed(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
  function pick(arr, s) { return arr[s % arr.length]; }
  function today() { return new Date('2026-09-16T12:00:00'); }
  function dayDiff(iso) { if (!iso) return null; var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return Math.round((d - today()) / 86400000); }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function dueLabel(iso) {
    var n = dayDiff(iso); if (n == null) return '—';
    if (n < 0) return 'Venció hace ' + (-n) + ' d';
    if (n === 0) return 'Hoy'; if (n === 1) return 'Mañana';
    return 'En ' + n + ' d';
  }
  function dueClass(iso) { var n = dayDiff(iso); return n == null ? '' : n < 0 ? 'is-late' : n <= 2 ? 'is-soon' : ''; }
  function initials(name) { return String(name || '?').split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase(); }
  function avatar(idOrName, size) {
    var u = D.user(idOrName); var ini = u ? u.initials : initials(idOrName); var name = u ? u.name : idOrName;
    return '<span class="avatar ' + (size || 'avatar-sm') + '" title="' + esc(name) + '">' + esc(ini) + '</span>';
  }
  function badgeStatus(s) { return '<span class="badge badge-status" data-status="' + esc(s) + '">' + esc(D.statusLabel(s)) + '</span>'; }
  function badgeAI(txt) { return '<span class="badge badge-ai">' + esc(txt || 'AI · revisar') + '</span>'; }
  function taskStatusBadge(s) {
    var map = { 'pendiente': 'badge-status', 'en curso': 'badge-info', 'revisión': 'badge-ai', 'listo': 'badge-success', 'bloqueado': 'badge-danger' };
    var lbl = { 'pendiente': 'Pendiente', 'en curso': 'En curso', 'revisión': 'En revisión', 'listo': 'Listo', 'bloqueado': 'Bloqueado' };
    return '<span class="badge ' + (map[s] || '') + '" data-status="' + esc(s) + '">' + esc(lbl[s] || s) + '</span>';
  }
  function money(n, cur, compact) { return D.fmtMoney(n, cur || 'COP', compact ? { compact: true } : undefined); }
  function pct(n) { return D.fmtPct(n); }
  function listingLoc(l) { return (l.barrio || '') + (l.city ? ' · ' + l.city : ''); }
  function priceLine(l) {
    var s = D.fmtPrice(l);
    var small = l.operacion === 'arriendo' ? (l.priceUnit === 'noche' ? 'vacacional' : 'arriendo') : 'venta';
    return '<div class="listing-price">' + esc(s) + ' <small>' + small + '</small></div>';
  }
  function specs(l) {
    var out = [];
    if (l.area) out.push(D.fmtM2(l.area));
    if (l.habitaciones) out.push(l.habitaciones + ' hab');
    if (l.banos) out.push(l.banos + ' baños');
    if (l.parqueaderos) out.push(l.parqueaderos + ' parq');
    if (l.type === 'lote' && l.areaLote) out.push('lote ' + D.fmtM2(l.areaLote));
    return '<div class="listing-specs">' + out.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>';
  }
  function emptyState(txt, cta) {
    return '<div class="sl-empty">' + icon('search') + '<p>' + esc(txt) + '</p>' + (cta || '') + '</div>';
  }
  function select(name, opts, val, extra) {
    return '<select class="select input-sm" data-change="' + esc(name) + '" ' + (extra || '') + '>' + opts.map(function (o) {
      var v = typeof o === 'string' ? o : o.v, t = typeof o === 'string' ? o : o.t;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('') + '</select>';
  }
  function pillTabs(items, active, action, extraAttr) {
    return '<div class="tabs tabs-pill" role="tablist">' + items.map(function (it) {
      return '<button class="tab' + (it.v === active ? ' is-active' : '') + '" role="tab" aria-selected="' + (it.v === active) + '" data-action="' + action + '" data-value="' + esc(it.v) + '" ' + (extraAttr || '') + '>' + esc(it.t) + '</button>';
    }).join('') + '</div>';
  }
  function sectionHead(title, sub, right) {
    return '<div class="page-header"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="muted small">' + sub + '</p>' : '') + '</div>' + (right ? '<div class="row">' + right + '</div>' : '') + '</div>';
  }
  function linkTo(ctx, mod, id, txt, cls) { return '<a class="' + (cls || 'sl-link') + '" href="' + route(ctx, mod, id) + '">' + txt + '</a>'; }

  /* ------------------------------------------------------- inline charts */
  // Single-hue, thin marks, recessive grid, text in text tokens (dataviz skill).
  var C = {};
  C.spark = function (vals, opts) {
    opts = opts || {}; var w = opts.w || 120, h = opts.h || 32, pad = 3;
    if (!vals || vals.length < 2) return '';
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals); if (mx === mn) mx = mn + 1;
    var pts = vals.map(function (v, i) { return [pad + i * (w - 2 * pad) / (vals.length - 1), h - pad - (v - mn) / (mx - mn) * (h - 2 * pad)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pad + ' ' + (h - pad) + ' Z';
    var last = pts[pts.length - 1];
    return '<svg class="sl-spark" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" aria-hidden="true"><path d="' + area + '" fill="var(--brand-soft)" opacity=".7"/><path d="' + d + '" fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="var(--brand-2)" stroke="var(--surface)" stroke-width="2"/></svg>';
  };
  C.bars = function (vals, opts) {
    opts = opts || {}; var labels = opts.labels || [], h = opts.height || 120, w = opts.width || 320;
    var n = vals.length; if (!n) return '';
    var mx = Math.max.apply(null, vals.concat([1])); var padL = 4, padB = labels.length ? 18 : 4, gap = 6;
    var bw = Math.max(6, (w - padL * 2 - gap * (n - 1)) / n);
    var out = '<svg class="sl-bars" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="img" aria-label="' + esc(opts.label || 'Gráfico de barras') + '">';
    // recessive grid: 3 lines
    for (var g = 1; g <= 3; g++) { var gy = (h - padB) - (h - padB - 8) * g / 3; out += '<line x1="0" x2="' + w + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="var(--border)" stroke-dasharray="2 4"/>'; }
    vals.forEach(function (v, i) {
      var bh = Math.max(2, (v / mx) * (h - padB - 8)); var x = padL + i * (bw + gap); var y = (h - padB) - bh;
      var hl = opts.highlight === i;
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3" fill="' + (hl ? 'var(--accent)' : 'var(--brand-2)') + '"><title>' + esc((labels[i] || '') + ': ' + (opts.fmt ? opts.fmt(v) : v)) + '</title></rect>';
      if (labels[i] != null) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 4) + '" text-anchor="middle" font-size="10" fill="var(--text-3)">' + esc(labels[i]) + '</text>';
    });
    return out + '</svg>';
  };
  C.line = function (vals, opts) {
    opts = opts || {}; var labels = opts.labels || [], h = opts.height || 160, w = opts.width || 480;
    if (!vals || vals.length < 2) return '';
    var padL = 44, padR = 12, padT = 10, padB = 22;
    var mn = opts.min != null ? opts.min : Math.min.apply(null, vals) * 0.9, mx = Math.max.apply(null, vals) * 1.05; if (mx === mn) mx = mn + 1;
    var X = function (i) { return padL + i * (w - padL - padR) / (vals.length - 1); };
    var Y = function (v) { return padT + (1 - (v - mn) / (mx - mn)) * (h - padT - padB); };
    var out = '<svg class="sl-line" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" role="img" aria-label="' + esc(opts.label || 'Tendencia') + '">';
    for (var g = 0; g <= 3; g++) {
      var v = mn + (mx - mn) * g / 3, gy = Y(v);
      out += '<line x1="' + padL + '" x2="' + (w - padR) + '" y1="' + gy.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="var(--border)" stroke-dasharray="2 4"/>';
      out += '<text x="' + (padL - 6) + '" y="' + (gy + 3).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--text-3)">' + esc(opts.fmt ? opts.fmt(v) : Math.round(v)) + '</text>';
    }
    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' ');
    out += '<path d="' + d + ' L' + X(vals.length - 1).toFixed(1) + ' ' + (h - padB) + ' L' + padL + ' ' + (h - padB) + ' Z" fill="var(--brand-soft)" opacity=".6"/>';
    out += '<path d="' + d + '" fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    vals.forEach(function (v, i) {
      var isLast = i === vals.length - 1;
      out += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (isLast ? 4 : 3) + '" fill="' + (isLast ? 'var(--accent)' : 'var(--brand-2)') + '" stroke="var(--surface)" stroke-width="2"><title>' + esc((labels[i] || '') + ': ' + (opts.fmt ? opts.fmt(v) : v)) + '</title></circle>';
      if (labels[i] != null && (i % Math.ceil(vals.length / 8) === 0 || isLast)) out += '<text x="' + X(i).toFixed(1) + '" y="' + (h - 6) + '" text-anchor="middle" font-size="10" fill="var(--text-3)">' + esc(labels[i]) + '</text>';
      if (isLast) out += '<text x="' + (X(i) - 8).toFixed(1) + '" y="' + (Y(v) - 9).toFixed(1) + '" text-anchor="end" font-size="11" font-weight="600" fill="var(--text)">' + esc(opts.fmt ? opts.fmt(v) : v) + '</text>';
    });
    return out + '</svg>';
  };
  C.donut = function (parts, opts) {
    opts = opts || {}; var size = opts.size || 96, r = size / 2 - 8, cx = size / 2, cy = size / 2;
    var total = parts.reduce(function (a, p) { return a + p.value; }, 0) || 1;
    var out = '<svg class="sl-donut" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + esc(opts.label || 'Distribución') + '">';
    var circ = 2 * Math.PI * r, off = 0;
    parts.forEach(function (p) {
      var len = circ * p.value / total;
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + p.color + '" stroke-width="12" stroke-dasharray="' + Math.max(0, len - 2).toFixed(2) + ' ' + (circ - Math.max(0, len - 2)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"><title>' + esc(p.label + ': ' + p.value) + '</title></circle>';
      off += len;
    });
    if (opts.center != null) out += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="16" font-weight="600" fill="var(--text)">' + esc(opts.center) + '</text>';
    return out + '</svg>';
  };

  /* ------------------------------------------------------ injected styles */
  // Additive only. Prefixed sl- to avoid collisions with tokens.css / app.css.
  if (!document.getElementById('sl-styles')) {
    var st = document.createElement('style'); st.id = 'sl-styles';
    st.textContent = [
      '.sl-stack{display:flex;flex-direction:column;gap:var(--s-5)}',
      '.sl-link{color:var(--brand);font-weight:600;text-decoration:none}.sl-link:hover{text-decoration:underline}',
      '.sl-chips{display:flex;gap:var(--s-2);flex-wrap:wrap}',
      '.sl-statchip{display:inline-flex;align-items:center;gap:var(--s-2);padding:.45rem .8rem;border-radius:var(--r-pill);background:var(--surface);border:1px solid var(--border);font-size:var(--fs-sm);color:var(--text-2)}',
      '.sl-statchip b{font-variant-numeric:tabular-nums;color:var(--text);font-size:var(--fs-base)}',
      '.sl-statchip .dot{width:8px;height:8px}',
      '.sl-toolbar{display:flex;gap:var(--s-3);align-items:center;flex-wrap:wrap}.sl-toolbar .select{width:auto;min-width:0}',
      '.sl-toolbar .spacer{flex:1}',
      '.sl-listings{display:grid;gap:var(--s-4);grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))}',
      '.listing-card .sl-foot{display:flex;justify-content:space-between;align-items:center;gap:var(--s-2);margin-top:auto;padding-top:var(--s-2);border-top:1px dashed var(--border);font-size:var(--fs-xs);color:var(--text-3)}',
      '.listing-media .pill-int{position:absolute;top:var(--s-3);right:var(--s-3);left:auto}',
      '.sl-empty{display:flex;flex-direction:column;align-items:center;gap:var(--s-3);padding:var(--s-10) var(--s-4);color:var(--text-3);text-align:center;border:1px dashed var(--border);border-radius:var(--r-lg)}.sl-empty svg{width:28px;height:28px}',
      '.sl-map{position:relative;aspect-ratio:16/9;max-height:520px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden}',
      '.sl-map svg{width:100%;height:100%;display:block}',
      '.sl-map .pin{cursor:pointer}.sl-map .pin:hover circle{r:9}',
      '.sl-map-legend{position:absolute;left:var(--s-3);bottom:var(--s-3);display:flex;gap:var(--s-3);flex-wrap:wrap;font-size:var(--fs-xs);color:var(--text-2);background:var(--surface);padding:.35rem .6rem;border-radius:var(--r-md);border:1px solid var(--border)}',
      '.sl-gallery{display:flex;gap:var(--s-2);overflow-x:auto;padding-bottom:var(--s-2);scroll-snap-type:x mandatory}.sl-gallery img{height:160px;width:auto;aspect-ratio:3/2;object-fit:cover;border-radius:var(--r-md);scroll-snap-align:start;flex:none;background:var(--bg-deep)}',
      '.sl-gallery img:first-child{height:160px}',
      '.sl-detail{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--s-6);align-items:start}',
      '@media(max-width:1000px){.sl-detail{grid-template-columns:minmax(0,1fr)}}',
      '.sl-detail > *{min-width:0}.sl-gallery{min-width:0;max-width:100%}',
      '.sl-kv{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:var(--s-3)}.sl-kv div{display:flex;flex-direction:column;gap:2px}.sl-kv small{font-size:var(--fs-xs);color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;font-weight:600}.sl-kv b{font-weight:600;font-variant-numeric:tabular-nums}',
      '.sl-synd-row{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3);padding:.5rem 0;border-bottom:1px solid var(--border)}.sl-synd-row:last-child{border-bottom:0}',
      '.sl-amen{display:flex;flex-wrap:wrap;gap:var(--s-2)}.sl-amen span{font-size:var(--fs-xs);padding:.3rem .6rem;border-radius:var(--r-pill);background:var(--surface-2);color:var(--text-2)}',
      '.sl-comps td.num{white-space:nowrap}',
      '.sl-is-late{color:var(--danger)}.is-late .sl-due,.sl-due.is-late{color:var(--danger);font-weight:600}.sl-due.is-soon{color:var(--warn);font-weight:600}',
      '.kanban-card .sl-cardfoot{display:flex;align-items:center;justify-content:space-between;gap:var(--s-2);font-size:var(--fs-xs);color:var(--text-3);flex-wrap:nowrap}.kanban-card .sl-cardfoot > *{white-space:nowrap;flex:none}.kanban-card .sl-cardfoot > .mid{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.sl-due{white-space:nowrap}',
      '.kanban-card .sl-hint{font-size:var(--fs-xs);color:var(--text-2)}',
      '.kanban-card .sl-next{font-size:var(--fs-xs);color:var(--text-2);display:flex;gap:6px;align-items:flex-start}.kanban-card .sl-next svg{width:14px;height:14px;flex:none;margin-top:1px;color:var(--text-3)}',
      '.kanban-card.is-dragging{opacity:.45}.kanban-col.is-over{outline:2px dashed var(--brand-2);outline-offset:-4px;background:var(--brand-soft)}',
      '.kanban-col .kanban-value{font-size:var(--fs-xs);color:var(--text-3);padding:0 var(--s-2);margin-top:calc(-1 * var(--s-2))}',
      '.sl-score{display:inline-flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums;font-size:var(--fs-xs);font-weight:600}.sl-score i{width:36px;height:4px;border-radius:2px;background:var(--surface-3);position:relative;overflow:hidden}.sl-score i::after{content:"";position:absolute;inset:0;width:var(--v,0%);background:var(--brand-2);border-radius:2px}',
      '.sl-src{display:inline-flex;align-items:center;gap:4px;font-size:var(--fs-xs);color:var(--text-3)}.sl-src svg{width:13px;height:13px}',
      '.sl-drawer-head{display:flex;gap:var(--s-3);align-items:center}.sl-drawer-head h3{font-size:var(--fs-lg);font-weight:600;line-height:1.2}',
      '.sl-section{display:flex;flex-direction:column;gap:var(--s-3)}.sl-section > h4{font-size:var(--fs-sm);font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;display:flex;justify-content:space-between;align-items:center}',
      '.sl-match{display:flex;gap:var(--s-3);align-items:center;padding:var(--s-2) 0;border-bottom:1px solid var(--border)}.sl-match:last-child{border-bottom:0}.sl-match img{width:64px;height:48px;object-fit:cover;border-radius:var(--r-sm);flex:none;background:var(--bg-deep)}.sl-match .t{font-size:var(--fs-sm);font-weight:600}.sl-match .m{font-size:var(--fs-xs);color:var(--text-3)}.sl-match .p{margin-left:auto;text-align:right;font-variant-numeric:tabular-nums;font-size:var(--fs-sm);font-weight:600;white-space:nowrap}.sl-match .p small{display:block;font-weight:500;color:var(--text-3);font-size:var(--fs-xs)}',
      '.sl-sched{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--s-2)}.sl-sched button{padding:.5rem .3rem;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);font-size:var(--fs-xs);color:var(--text-2);display:flex;flex-direction:column;gap:2px;align-items:center;cursor:pointer}.sl-sched button b{font-size:var(--fs-sm);color:var(--text)}.sl-sched button:hover,.sl-sched button.is-active{border-color:var(--brand-2);background:var(--brand-soft)}',
      '.sl-offer{display:grid;grid-template-columns:1fr 1fr;gap:var(--s-3)}.sl-offer .stat-value{font-size:var(--fs-xl)}',
      '.sl-banner{display:flex;gap:var(--s-3);align-items:center;flex-wrap:wrap;padding:var(--s-3) var(--s-4);border-radius:var(--r-lg);background:var(--brand);color:var(--brand-ink)}.sl-banner svg{width:20px;height:20px}.sl-banner .btn{margin-left:auto}',
      '.sl-board .kanban-col{min-height:160px}',
      '.sl-order{display:flex;flex-direction:column;gap:var(--s-2)}.sl-order .t{font-size:var(--fs-sm);font-weight:600;line-height:1.3}.sl-order .l{font-size:var(--fs-xs);color:var(--text-3)}.sl-order .sl-cardfoot{display:flex;justify-content:space-between;align-items:center;gap:var(--s-2);font-size:var(--fs-xs);color:var(--text-3)}.sl-order .sl-cardfoot > *{white-space:nowrap}',
      '.sl-templates{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:var(--s-4)}.sl-template{display:flex;flex-direction:column;gap:var(--s-3)}.sl-template ol{margin:0;padding-left:1.2rem;font-size:var(--fs-sm);color:var(--text-2);display:flex;flex-direction:column;gap:4px}.sl-template .btn{align-self:flex-start}',
      '.sl-gantt{display:grid;grid-template-columns:220px 1fr;gap:0;font-size:var(--fs-xs);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;background:var(--surface)}',
      '.sl-gantt .gh{background:var(--surface-2);padding:.5rem .75rem;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--border)}',
      '.sl-gantt .gl{padding:.55rem .75rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:var(--s-2);min-width:0}.sl-gantt .gl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-gantt .gl.grp{background:var(--surface-2);font-weight:600;color:var(--text)}',
      '.sl-gantt .gr{position:relative;border-bottom:1px solid var(--border);min-height:34px;background-image:linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:calc(100%/4) 100%}.sl-gantt .gr.grp{background:var(--surface-2)}',
      '.sl-gantt .bar{position:absolute;top:8px;height:18px;border-radius:9px;background:var(--brand-2);color:var(--brand-ink);font-size:10px;line-height:18px;padding:0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:18px}.sl-gantt .bar.is-ai{background:var(--ai)}.sl-gantt .bar.is-done{background:var(--success)}.sl-gantt .bar.is-blocked{background:var(--danger)}.sl-gantt .bar.is-pending{background:var(--surface-3);color:var(--text-2);border:1px solid var(--border-strong)}',
      '.sl-gantt .todayline{position:absolute;top:0;bottom:0;width:2px;background:var(--accent);opacity:.7}',
      '.sl-gantt-wrap{overflow-x:auto}.sl-gantt-wrap .sl-gantt{min-width:640px}',
      '.sl-gantt .gweeks{display:grid;grid-template-columns:repeat(4,1fr);background:var(--surface-2);border-bottom:1px solid var(--border)}.sl-gantt .gweeks span{padding:.5rem .5rem;color:var(--text-3);font-weight:600;border-left:1px solid var(--border)}',
      '.sl-drop{border:2px dashed var(--border-strong);border-radius:var(--r-lg);padding:var(--s-8) var(--s-4);text-align:center;color:var(--text-2);display:flex;flex-direction:column;align-items:center;gap:var(--s-2);background:var(--surface-2);cursor:pointer}.sl-drop svg{width:28px;height:28px;color:var(--brand-2)}.sl-drop.is-over{border-color:var(--brand-2);background:var(--brand-soft)}',
      '.sl-payout{display:flex;flex-direction:column;gap:6px;font-size:var(--fs-sm)}.sl-payout div{display:flex;justify-content:space-between;gap:var(--s-3)}.sl-payout .tot{border-top:1px solid var(--border);padding-top:6px;font-weight:600}',
      '.sl-masonry{columns:4 220px;column-gap:var(--s-3)}.sl-photo{break-inside:avoid;margin-bottom:var(--s-3);position:relative;border-radius:var(--r-md);overflow:hidden;background:var(--bg-deep);border:1px solid var(--border);cursor:grab}',
      '.sl-photo img{width:100%;display:block;aspect-ratio:var(--ar,3/2);object-fit:cover}.sl-photo .tags{position:absolute;left:8px;bottom:8px;right:8px;display:flex;gap:4px;flex-wrap:wrap}.sl-photo .tags span{font-size:10px;padding:2px 7px;border-radius:var(--r-pill);background:rgb(23 31 26 / .7);color:#F3EDE0;backdrop-filter:blur(4px)}.sl-photo .tags span.ai{background:var(--ai);color:#fff}',
      '.sl-photo .top{position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;align-items:center;gap:4px}.sl-photo .q{font-size:10px;font-weight:600;padding:2px 7px;border-radius:var(--r-pill);background:rgb(255 252 245 / .9);color:var(--text)}',
      '.sl-photo .sel{width:22px;height:22px;border-radius:50%;border:2px solid #fff;background:rgb(23 31 26 / .35);display:grid;place-items:center;color:#fff;cursor:pointer}.sl-photo .sel svg{width:14px;height:14px}.sl-photo.is-selected{outline:3px solid var(--brand-2);outline-offset:-3px}.sl-photo.is-selected .sel{background:var(--brand-2);border-color:var(--brand-2)}',
      '.sl-photo .wm{position:absolute;inset:0;display:none;place-items:center;pointer-events:none;font-family:var(--font-display);font-size:1.6rem;letter-spacing:.3em;color:rgb(255 252 245 / .55);text-transform:uppercase;transform:rotate(-18deg)}.sl-wm .sl-photo .wm{display:grid}',
      '.sl-photo.is-dragging{opacity:.4}.sl-photo.is-over{outline:2px dashed var(--brand-2);outline-offset:-2px}',
      '.sl-photo .lst{position:absolute;left:8px;top:36px;font-size:10px;color:#F3EDE0;text-shadow:0 1px 2px rgb(0 0 0 / .6)}',
      '.sl-storage{display:flex;flex-direction:column;gap:var(--s-2)}.sl-storage .row-between{font-size:var(--fs-sm)}',
      '.sl-matrix{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--fs-sm)}.sl-matrix th,.sl-matrix td{padding:.6rem .75rem;border-bottom:1px solid var(--border);text-align:left;vertical-align:middle}.sl-matrix th{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);background:var(--surface-2);white-space:nowrap}.sl-matrix td.c{text-align:center}.sl-matrix th.c{text-align:center}',
      '.sl-pdot{width:30px;height:30px;border-radius:50%;display:inline-grid;place-items:center;border:0;cursor:pointer;background:transparent}.sl-pdot i{width:12px;height:12px;border-radius:50%;display:block;background:var(--border-strong)}.sl-pdot:hover{background:var(--surface-3)}',
      '.sl-pdot[data-pstate="publicado"] i{background:var(--success)}.sl-pdot[data-pstate="pendiente"] i{background:var(--warn);box-shadow:0 0 0 3px var(--warn-soft)}.sl-pdot[data-pstate="desactualizado"] i{background:var(--danger)}.sl-pdot[data-pstate="no aplica"] i{background:transparent;border:1.5px dashed var(--border-strong)}',
      '.sl-legend{display:flex;gap:var(--s-4);flex-wrap:wrap;font-size:var(--fs-xs);color:var(--text-2)}.sl-legend span{display:inline-flex;align-items:center;gap:6px}.sl-legend i{width:10px;height:10px;border-radius:50%;display:inline-block}',
      '.sl-map-fields{width:100%;font-size:var(--fs-sm);border-collapse:collapse}.sl-map-fields td{padding:.4rem 0;border-bottom:1px solid var(--border);vertical-align:top}.sl-map-fields td:first-child{color:var(--text-3);width:40%}.sl-map-fields code{font-family:var(--font-mono);font-size:var(--fs-xs);background:var(--surface-2);padding:1px 5px;border-radius:4px}',
      '.sl-truth{display:grid;grid-template-columns:1fr auto 1fr;gap:var(--s-3);align-items:center}.sl-truth .node{padding:var(--s-3);border-radius:var(--r-md);border:1px solid var(--border);background:var(--surface);font-size:var(--fs-sm);text-align:center}.sl-truth .node.src{background:var(--brand);color:var(--brand-ink);border-color:var(--brand);font-weight:600}.sl-truth .arrow{color:var(--text-3);font-size:var(--fs-xs);text-align:center}.sl-truth .targets{display:flex;flex-direction:column;gap:6px}',
      '@media(max-width:600px){.sl-truth{grid-template-columns:1fr}.sl-truth .arrow{transform:rotate(90deg)}}',
      '.sl-variant{display:flex;flex-direction:column;gap:var(--s-2);padding:var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface)}.sl-variant.is-approved{border-color:var(--success)}.sl-variant .h{font-weight:600;font-size:var(--fs-sm)}.sl-variant .b{font-size:var(--fs-sm);color:var(--text-2)}.sl-variant .f{display:flex;justify-content:space-between;align-items:center;gap:var(--s-2);flex-wrap:wrap}',
      '.sl-range{width:100%;accent-color:var(--brand-2)}',
      '.sl-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--s-4)}',
      '.sl-w{display:flex;flex-direction:column;gap:var(--s-3);height:100%}.sl-w .sl-wlist{display:flex;flex-direction:column;gap:var(--s-2)}.sl-w .sl-wrow{display:flex;align-items:center;gap:var(--s-3);font-size:var(--fs-sm);padding:.35rem 0;border-bottom:1px solid var(--border)}.sl-w .sl-wrow:last-child{border-bottom:0}.sl-w .sl-wrow .t{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-w .sl-wrow .t a,.sl-w .sl-wrow .t button{display:block;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-w .sl-wrow .m{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-w .sl-wrow .m{font-size:var(--fs-xs);color:var(--text-3)}.sl-w .sl-wrow .r{margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums}.sl-w .sl-wfoot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:var(--fs-xs);color:var(--text-3)}',
      '.sl-w .sl-big{font-family:var(--font-display);font-size:var(--fs-2xl);font-weight:500;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}',
      '.sl-w .sl-bars-inline{display:flex;flex-direction:column;gap:6px}.sl-w .sl-bars-inline div{display:grid;grid-template-columns:110px 1fr 32px;align-items:center;gap:var(--s-2);font-size:var(--fs-xs)}.sl-w .sl-bars-inline .progress{height:8px}',
      '.sl-week{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.sl-week div{text-align:center;padding:.35rem 0;border-radius:var(--r-sm);background:var(--surface-2);font-size:var(--fs-xs);color:var(--text-3);display:flex;flex-direction:column;gap:2px}.sl-week div b{color:var(--text);font-size:var(--fs-sm)}.sl-week div.has{background:var(--brand-soft);color:var(--brand)}.sl-week div.has b{color:var(--brand)}.sl-week div.today{outline:2px solid var(--accent)}',
      '.sl-mini-kv{display:flex;gap:var(--s-4);flex-wrap:wrap}.sl-mini-kv div{display:flex;flex-direction:column}.sl-mini-kv small{font-size:var(--fs-xs);color:var(--text-3)}.sl-mini-kv b{font-variant-numeric:tabular-nums}',
      '.sl-form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:var(--s-3)}.sl-form-grid .span-2{grid-column:span 2}@media(max-width:600px){.sl-form-grid{grid-template-columns:1fr}.sl-form-grid .span-2{grid-column:auto}}',
      '.sl-check{display:flex;gap:var(--s-3);align-items:flex-start;padding:var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface)}.sl-check input{margin-top:3px;accent-color:var(--brand-2)}.sl-check .b{font-weight:600;font-size:var(--fs-sm)}.sl-check .m{font-size:var(--fs-xs);color:var(--text-3)}.sl-check .p{margin-left:auto;font-variant-numeric:tabular-nums;font-size:var(--fs-sm);white-space:nowrap}',
      '.sl-activity .timeline-item{padding-bottom:var(--s-4)}',
      '.sl-ro{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-xs);color:var(--text-3)}.sl-ro svg{width:14px;height:14px}',
      '.sl-table-actions{display:flex;gap:var(--s-1);justify-content:flex-end}',
      '.sl-progress-lbl{display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text-3);margin-bottom:4px}',
      '.sl-vendor-row{display:grid;grid-template-columns:auto 1fr auto;gap:var(--s-3);align-items:center}',
      '.sl-inline-list{display:flex;flex-direction:column;gap:var(--s-2)}',
      '.sl-mini-table td{font-size:var(--fs-sm)}',
      '.sl-ai-note{display:flex;gap:var(--s-2);align-items:flex-start;font-size:var(--fs-xs);color:var(--ai)}.sl-ai-note .spark{width:10px;height:10px;border-radius:2px;background:var(--ai);transform:rotate(45deg);flex:none;margin-top:3px}'
    ].join('\n');
    document.head.appendChild(st);
  }

  /* ---------------------------------------------- derived in-memory state */
  // Everything the modules invent lives under DORUM._sales so it survives rerenders
  // and other modules (contracts, money) can read it.
  var X = D._sales || (D._sales = {});
  var PORTALS = [
    { id: 'fincaRaiz', name: 'Finca Raíz', kind: 'portal' },
    { id: 'wasi', name: 'Wasi', kind: 'portal' },
    { id: 'metrocuadrado', name: 'Metrocuadrado', kind: 'portal' },
    { id: 'instagram', name: 'Instagram', kind: 'social' },
    { id: 'sitio', name: 'Sitio Dorum', kind: 'own' }
  ];
  var PORTAL_LABEL = { publicado: 'Publicado', pendiente: 'Pendiente', desactualizado: 'Desactualizado', 'no aplica': 'No aplica' };
  var TASK_KINDS = [
    { id: 'photography', label: 'Fotografía', icon: 'camera', vendorRole: 'photographer', price: 1850000, days: 4 },
    { id: 'writing', label: 'Redacción', icon: 'pen-tool', vendorRole: 'writer', price: 650000, days: 3 },
    { id: 'research', label: 'Comps & datos', icon: 'bar-chart', vendorRole: 'writer', price: 400000, days: 2 },
    { id: 'creative', label: 'Creativos', icon: 'image', vendorRole: 'advertiser', price: 900000, days: 3 },
    { id: 'ads', label: 'Pauta', icon: 'megaphone', vendorRole: 'advertiser', price: 1200000, days: 14 },
    { id: 'construction', label: 'Remodelación (opcional)', icon: 'hammer', vendorRole: 'construction', price: 0, days: 10, optional: true }
  ];
  var KIND = {}; TASK_KINDS.forEach(function (k) { KIND[k.id] = k; });
  var VENDOR_KINDS_BY_ROLE = { photographer: ['photography'], writer: ['writing', 'research'], advertiser: ['creative', 'ads'], construction: ['construction'] };
  var GET_STAGES = [
    { id: 'nuevo', label: 'Nuevo' }, { id: 'contactado', label: 'Contactado' }, { id: 'visita', label: 'Visita de captación' }, { id: 'propuesta', label: 'Propuesta' }, { id: 'firmado', label: 'Acuerdo firmado' }];
  var SELL_STAGES = [
    { id: 'nuevo', label: 'Nuevo' }, { id: 'calificado', label: 'Calificado' }, { id: 'tour', label: 'Tour' }, { id: 'oferta', label: 'Oferta' }, { id: 'contrato', label: 'Contrato' }];
  var TEMPLATES = [
    { id: 'tpl-venta', name: 'Plantilla: Lanzamiento venta', desc: 'Casa o apartamento en venta. 12 días de preparación hasta “activo”.', kinds: ['photography', 'writing', 'research', 'creative', 'ads'], steps: ['Fotos + video + dron (día 1–4)', 'Comps & precio sugerido (día 2–3)', 'Redacción bilingüe ES/EN (día 4–6)', 'Creativos para Instagram y portales (día 6–8)', 'Validar payload y publicar en 3 portales (día 9)', 'Pauta Meta 14 días (día 10+)'] },
    { id: 'tpl-arriendo', name: 'Plantilla: Arriendo', desc: 'Vivienda o comercial. Sin pauta paga: portales + Sitio Dorum.', kinds: ['photography', 'writing'], steps: ['Fotos (paquete básico, día 1–2)', 'Redacción corta ES (día 2–3)', 'Publicar Finca Raíz + Wasi + Sitio (día 4)', 'Póliza / afianzadora lista para el primer candidato'] },
    { id: 'tpl-finca', name: 'Plantilla: Finca / lote', desc: 'Activos rurales: dron obligatorio, ficha técnica y estudio de títulos temprano.', kinds: ['photography', 'research', 'writing', 'creative', 'ads', 'construction'], steps: ['Dron + fotos de lote y linderos (día 1–3)', 'Comps rurales + uso de suelo (día 2–5)', 'Redacción “patrimonial” ES/EN (día 5–7)', 'Reel Instagram (día 7–9)', 'Cotización remodelación / glamping (opcional)', 'Publicar + pauta inversionistas (día 10+)'] }
  ];

  if (!X.ready) {
    X.ready = true;
    // Portal state per listing × portal
    X.portal = {};
    D.listings.forEach(function (l) {
      var live = ['activo', 'bajo oferta', 'arrendado'].indexOf(l.status) >= 0;
      var s = seed(l.id);
      X.portal[l.id] = {};
      PORTALS.forEach(function (p) {
        var st;
        if (p.id === 'sitio') st = live ? 'publicado' : 'pendiente';
        else if (p.id === 'instagram') st = l.syndication.instagram ? 'publicado' : 'no aplica';
        else if (l.syndication[p.id]) st = (l.daysOnMarket > 50 && ((s >> (p.id.length)) % 3 === 0)) ? 'desactualizado' : 'publicado';
        else st = live ? 'pendiente' : (l.status === 'en preparación' || l.status === 'borrador') ? 'pendiente' : 'no aplica';
        if (l.type === 'lote' && p.id === 'instagram' && !l.syndication.instagram) st = 'no aplica';
        if (l.international && p.kind === 'portal') st = 'no aplica';
        X.portal[l.id][p.id] = st;
      });
    });
    // lst-003 removed metrocuadrado on purpose (bajo oferta) → keep pendiente for demo click
    X.publishLog = [
      { at: '2026-09-16T10:02:00-05:00', listingId: 'lst-002', portal: 'instagram', action: 'Reel publicado', by: 'u-adv', ai: true },
      { at: '2026-09-16T09:40:00-05:00', listingId: 'lst-007', portal: 'fincaRaiz', action: 'Precio y 8 fotos sincronizados', by: 'u-sadmin', ai: true },
      { at: '2026-09-16T09:40:00-05:00', listingId: 'lst-007', portal: 'wasi', action: 'Ficha creada', by: 'u-sadmin', ai: true },
      { at: '2026-09-15T16:20:00-05:00', listingId: 'lst-013', portal: 'metrocuadrado', action: 'Publicado', by: 'u-sadmin', ai: false },
      { at: '2026-09-14T11:05:00-05:00', listingId: 'lst-003', portal: 'fincaRaiz', action: 'Estado → Bajo oferta', by: 'u-brk-1', ai: false },
      { at: '2026-09-12T08:30:00-05:00', listingId: 'lst-004', portal: 'fincaRaiz', action: 'Publicado (lanzamiento)', by: 'u-sadmin', ai: true }
    ];
    // Contact activity (calls, WhatsApp, email) — deterministic from lastTouch
    X.activity = {};
    D.contacts.forEach(function (c) {
      var s = seed(c.id), base = c.lastTouch || '2026-09-10';
      var chan = ['WhatsApp', 'Llamada', 'Correo'];
      var items = [
        { at: base, kind: pick(chan, s), title: pick(['Respondió con disponibilidad para visita', 'Pidió más fotos y el valor de la administración', 'Confirmó presupuesto y zona de interés', 'Preguntó por tiempos de entrega y documentos'], s >> 2), by: c.owner },
        { at: addDays(base, -3 - (s % 4)), kind: pick(chan, s >> 3), title: pick(['Primer contacto · presentación Dorum', 'Envío de ficha y video', 'Llamada de calificación (8 min)', 'Compartió comparativo de la zona'], s >> 4), by: c.owner },
        { at: addDays(base, -9 - (s % 6)), kind: 'Origen', title: 'Lead creado desde ' + c.source, by: null, ai: true }
      ];
      X.activity[c.id] = items;
    });
    // AI creative variants per campaign
    X.variants = {};
    D.campaigns.forEach(function (cmp) {
      var l = cmp.listingId ? D.listing(cmp.listingId) : null;
      var name = l ? l.title : 'Dorum Lifestyle';
      X.variants[cmp.id] = [
        { id: cmp.id + '-v1', hook: 'Beneficio', head: l ? 'Despierta frente al agua' : 'Curated by nature', body: (l ? 'Vive ' + name + ' con administración Dorum: renta cuando no la usas.' : 'Hogares inmersos en la naturaleza, curados por Dorum Lifestyle.'), status: cmp.aiCreative ? 'aprobada' : 'pendiente', ai: true },
        { id: cmp.id + '-v2', hook: 'Prueba social', head: l ? 'Ocupación verificable' : '96 familias ya viven así', body: (l ? name + ' · historial de renta y visita privada con tu asesor.' : 'Descubre por qué Guatapé es el nuevo Oriente.'), status: 'pendiente', ai: true },
        { id: cmp.id + '-v3', hook: 'Urgencia suave', head: 'Últimas visitas de septiembre', body: 'Agenda tu recorrido' + (l ? ' en ' + (l.city || '') : '') + ' antes del 30 de septiembre.', status: 'pendiente', ai: true }
      ];
    });
    X.audiences = [
      { id: 'aud-med', name: 'Medellín 30–55 · alto poder adquisitivo', size: '~410 mil', note: 'ES · El Poblado, Envigado, Llanogrande · intereses: inversión, bienestar' },
      { id: 'aud-expat', name: 'Expats & diáspora', size: '~180 mil', note: 'EN · Miami, Toronto, Madrid · intereses: lake house, Colombia, wellness travel' },
      { id: 'aud-bog', name: 'Inversionistas Bogotá', size: '~260 mil', note: 'ES · 35–60 · Chicó, Rosales, Cedritos · intereses: renta turística, segunda vivienda' }
    ];
    X.mediaSel = {};      // imageFile → true
    X.mediaOrder = {};    // listingId → [file,...]
    X.watermark = false;
    X.uploads = [];       // fake uploads
    X.quotes = { 't-005': { amount: 48000000, days: 45, note: 'Restauración beneficiadero · glamping 3 unidades · materiales locales' } };
    X.approvals = {};     // taskId → userId
    X.visits = [];        // scheduled visits
    X.openHouse = false;
    X.budgetCap = 6000000;
    X.creativeApproved = {};
  }
  X.state = X.state || {
    listings: { view: 'grid', all: false, f: { op: '', type: '', zona: '', estado: '', agente: '' } },
    crmGet: { view: 'kanban', all: false },
    crmSell: { view: 'kanban', all: false },
    projects: { view: 'board', listing: '' },
    media: { listing: '', tag: '' },
    ads: { tab: 'campañas' },
    publishing: { onlyPending: false }
  };
  var S = X.state;

  /* -------------------------------------------------- visibility by role */
  function visibleListings(ctx) {
    var u = ctxUser(ctx), r = ctx.roleId;
    if (r === 'broker') return S.listings.all ? D.listings.slice() : D.listingsBy(u.id);
    if (isVendor(r)) {
      var ids = {};
      D.tasks.forEach(function (t) { if (t.assignee === u.id && t.listingId) ids[t.listingId] = 1; });
      if (r === 'advertiser') D.campaigns.forEach(function (c) { if (c.listingId) ids[c.listingId] = 1; });
      D.deals.forEach(function (d) { if (d.split.some(function (s) { return s.participant === u.id; }) && d.listingId) ids[d.listingId] = 1; });
      return D.listings.filter(function (l) { return ids[l.id]; });
    }
    return D.listings.slice();
  }
  function visibleContacts(ctx, pipeline) {
    var u = ctxUser(ctx), r = ctx.roleId, st = pipeline === 'get' ? S.crmGet : S.crmSell;
    var all = D.contacts.filter(function (c) { return c.pipeline === pipeline; });
    if ((r === 'broker' || r === 'rental_admin') && !st.all) return all.filter(function (c) { return c.owner === u.id; });
    return all;
  }
  function readOnly(ctx) { return ctx.roleId === 'lawyer' || ctx.roleId === 'accountant'; }

  /* -------------------------------------------------------- comps (AI) */
  function compsFor(l) {
    var pool = D.listings.filter(function (o) { return o.id !== l.id && o.operacion === l.operacion && o.area && o.price && o.currency === l.currency && ((o.type === 'lote') === (l.type === 'lote')); });
    var same = pool.filter(function (o) { return o.city === l.city; });
    var sameType = pool.filter(function (o) { return o.type === l.type && same.indexOf(o) < 0; });
    var chosen = same.concat(sameType, pool.filter(function (o) { return same.indexOf(o) < 0 && sameType.indexOf(o) < 0; })).slice(0, 3);
    var s = seed(l.id);
    var factors = [0.94, 1.03, 0.98, 1.06, 0.91];
    return chosen.map(function (o, i) {
      var f = factors[(s + i) % factors.length];
      var ppm = Math.round((l.price / l.area) * f);
      var area = Math.round(l.area * (0.85 + ((s >> i) % 30) / 100));
      return { ref: o, title: pick(['Venta cerrada', 'Publicado', 'Venta cerrada', 'Bajo oferta'], s + i), loc: listingLoc(o), area: area, ppm: ppm, price: ppm * area, when: pick(['hace 2 meses', 'hace 6 semanas', 'vigente', 'hace 4 meses'], s >> i), dist: (1.2 + ((s >> (i + 2)) % 90) / 10).toFixed(1) + ' km' };
    });
  }
  function suggestedPrice(l) {
    var comps = compsFor(l); if (!comps.length || !l.area) return null;
    var ppms = comps.map(function (c) { return c.ppm; }).sort(function (a, b) { return a - b; });
    var med = ppms[Math.floor(ppms.length / 2)];
    var lo = Math.round(med * 0.97 * l.area / 1e6) * 1e6, hi = Math.round(med * 1.04 * l.area / 1e6) * 1e6;
    if (l.currency === 'USD') { lo = Math.round(med * 0.97 * l.area / 1000) * 1000; hi = Math.round(med * 1.04 * l.area / 1000) * 1000; }
    return { lo: lo, hi: hi, med: med, comps: comps, delta: Math.round(((lo + hi) / 2 - l.price) / l.price * 1000) / 10 };
  }

  /* ================================================================== */
  /*  MODULE 1 · listings                                                */
  /* ================================================================== */
  function listingCard(l, ctx) {
    var portals = PORTALS.filter(function (p) { return p.id !== 'sitio'; });
    var synd = '<span class="synd" title="Portales">' + portals.map(function (p) { return '<i class="' + (X.portal[l.id][p.id] === 'publicado' ? 'on' : '') + '" title="' + esc(p.name + ': ' + PORTAL_LABEL[X.portal[l.id][p.id]]) + '"></i>'; }).join('') + '</span>';
    var pendingAI = D.tasks.filter(function (t) { return t.listingId === l.id && t.aiDrafted && t.status === 'revisión'; }).length;
    return '<a class="listing-card" href="' + route(ctx, 'listings', l.id) + '">' +
      '<div class="listing-media"><img src="' + esc(l.cover) + '" alt="' + esc(l.title + ', ' + l.city) + '" loading="lazy">' + badgeStatus(l.status) +
      (l.international ? '<span class="pill pill-accent pill-int">Internacional</span>' : '') + '</div>' +
      '<div class="listing-body">' + priceLine(l) +
      '<div class="listing-title">' + esc(l.title) + '</div><div class="listing-loc">' + esc(listingLoc(l)) + '</div>' + specs(l) +
      '<div class="sl-foot"><span class="row" style="gap:6px">' + avatar(l.listedBy) + '<span>' + esc(D.userName(l.listedBy).split(' ')[0]) + '</span></span>' +
      '<span class="row" style="gap:8px">' + (pendingAI ? badgeAI(pendingAI + ' AI') : '') + synd + '<span>' + (l.daysOnMarket ? l.daysOnMarket + ' d · ' + l.leads + ' leads' : 'sin publicar') + '</span></span></div>' +
      '</div></a>';
  }
  function listingsTable(list, ctx) {
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Inmueble</th><th>Operación</th><th>Estado</th><th class="num">Precio</th><th class="num">$/m²</th><th>Asesor</th><th>Portales</th><th class="num">Días</th><th class="num">Leads</th></tr></thead><tbody>' +
      list.map(function (l) {
        return '<tr><td><a class="sl-link" href="' + route(ctx, 'listings', l.id) + '">' + esc(l.title) + '</a><div class="xs muted">' + esc(listingLoc(l)) + '</div></td>' +
          '<td>' + esc(l.operacion === 'venta' ? 'Venta' : 'Arriendo') + '</td><td>' + badgeStatus(l.status) + '</td>' +
          '<td class="num money">' + esc(D.fmtPrice(l)) + '</td><td class="num">' + esc(D.pricePerM2(l) ? money(D.pricePerM2(l), l.currency) : '—') + '</td>' +
          '<td><span class="row" style="gap:6px;flex-wrap:nowrap">' + avatar(l.listedBy) + esc(D.userName(l.listedBy)) + '</span></td>' +
          '<td><span class="synd">' + PORTALS.filter(function (p) { return p.id !== 'sitio'; }).map(function (p) { return '<i class="' + (X.portal[l.id][p.id] === 'publicado' ? 'on' : '') + '"></i>'; }).join('') + '</span></td>' +
          '<td class="num">' + l.daysOnMarket + '</td><td class="num">' + l.leads + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  // Stylized map: Antioquia-ish silhouette with dots placed by city (deterministic jitter)
  var CITY_XY = { 'Guatapé': [640, 250], 'El Peñol': [610, 225], 'Medellín': [420, 300], 'Envigado': [440, 340], 'Rionegro': [520, 320], 'El Retiro': [500, 370], 'Guarne': [500, 260], 'Cartagena': [300, 60], 'Tulum': [90, 80] };
  function listingsMap(list, ctx) {
    var pins = list.map(function (l, i) {
      var xy = CITY_XY[l.city] || [380, 380]; var s = seed(l.id);
      var x = xy[0] + ((s % 41) - 20), y = xy[1] + (((s >> 3) % 41) - 20);
      var col = { 'activo': 'var(--success)', 'bajo oferta': 'var(--warn)', 'en preparación': 'var(--info)', 'borrador': 'var(--text-3)', 'arrendado': 'var(--brand)', 'vendido': 'var(--brand)' }[l.status] || 'var(--text-3)';
      return '<a class="pin" href="' + route(ctx, 'listings', l.id) + '"><circle cx="' + x + '" cy="' + y + '" r="7" fill="' + col + '" stroke="var(--surface)" stroke-width="2"><title>' + esc(l.title + ' · ' + D.fmtPrice(l)) + '</title></circle></a>';
    }).join('');
    var labels = Object.keys(CITY_XY).filter(function (c) { return list.some(function (l) { return l.city === c; }); }).map(function (c) { var xy = CITY_XY[c]; return '<text x="' + (xy[0] + 14) + '" y="' + (xy[1] - 12) + '" font-size="12" fill="var(--text-2)" font-weight="600">' + esc(c) + '</text>'; }).join('');
    return '<div class="sl-map"><svg viewBox="0 0 800 450" role="img" aria-label="Mapa estilizado de inmuebles">' +
      '<defs><pattern id="slgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--border)" stroke-width=".6"/></pattern></defs>' +
      '<rect width="800" height="450" fill="url(#slgrid)"/>' +
      // water: embalse + sea
      '<path d="M600 210c30-20 70-10 90 10s10 50-10 70-60 30-90 10-20-70 10-90z" fill="var(--info-soft)" stroke="var(--info)" stroke-width="1" opacity=".8"/>' +
      '<path d="M0 0h420c-30 40-90 60-140 90S200 130 120 120 40 90 0 60z" fill="var(--info-soft)" opacity=".6"/>' +
      // valley of Aburrá + Oriente plateau (soft land shapes)
      '<path d="M380 250c40-30 90-30 120 0s40 90 10 130-90 40-120 10-50-110-10-140z" fill="var(--brand-soft)" opacity=".55"/>' +
      '<path d="M460 220c60-40 130-30 170 10s40 80 0 110-100 40-150 10-70-90-20-130z" fill="var(--bg-deep)" opacity=".8"/>' +
      '<text x="660" y="330" font-size="11" fill="var(--info)" font-style="italic">Embalse Guatapé–El Peñol</text>' +
      '<text x="60" y="30" font-size="11" fill="var(--info)" font-style="italic">Mar Caribe</text>' +
      labels + pins + '</svg>' +
      '<div class="sl-map-legend"><span><i class="dot" style="color:var(--success)"></i> Activo</span><span><i class="dot" style="color:var(--warn)"></i> Bajo oferta</span><span><i class="dot" style="color:var(--info)"></i> En preparación</span><span><i class="dot" style="color:var(--brand)"></i> Arrendado</span></div></div>';
  }
  function applyFilters(list) {
    var f = S.listings.f;
    return list.filter(function (l) {
      if (f.op && l.operacion !== f.op) return false;
      if (f.type && l.type !== f.type) return false;
      if (f.zona && l.city !== f.zona) return false;
      if (f.estado && l.status !== f.estado) return false;
      if (f.agente && l.listedBy !== f.agente) return false;
      return true;
    });
  }
  function renderListingsIndex(ctx) {
    var u = ctxUser(ctx), base = visibleListings(ctx), list = applyFilters(base);
    var yr = function (l) { return (l.status === 'vendido' || l.status === 'arrendado'); };
    var stats = [
      { k: 'Activos', n: base.filter(function (l) { return l.status === 'activo'; }).length, c: 'var(--success)' },
      { k: 'En preparación', n: base.filter(function (l) { return l.status === 'en preparación' || l.status === 'borrador'; }).length, c: 'var(--info)' },
      { k: 'Bajo oferta', n: base.filter(function (l) { return l.status === 'bajo oferta'; }).length, c: 'var(--warn)' },
      { k: 'Vendidos / arrendados 2026', n: base.filter(yr).length, c: 'var(--brand)' }
    ];
    var cities = []; base.forEach(function (l) { if (cities.indexOf(l.city) < 0) cities.push(l.city); });
    var types = []; base.forEach(function (l) { if (types.indexOf(l.type) < 0) types.push(l.type); });
    var agents = []; base.forEach(function (l) { if (agents.indexOf(l.listedBy) < 0) agents.push(l.listedBy); });
    var f = S.listings.f;
    var canCreate = ['owner', 'broker', 'sales_admin', 'rental_admin'].indexOf(ctx.roleId) >= 0;
    var right = '';
    if (ctx.roleId === 'broker') right += '<label class="toggle"><input type="checkbox" data-change="sl.listings.all" ' + (S.listings.all ? 'checked' : '') + '><span class="toggle-track"></span> Todos los inmuebles</label>';
    if (readOnly(ctx)) right += '<span class="sl-ro">' + icon('shield') + ' Solo lectura</span>';
    if (canCreate) right += '<button class="btn btn-primary" data-action="sl.listings.new">' + icon('plus') + ' Nuevo inmueble</button>';
    var sub = ctx.roleId === 'broker' && !S.listings.all ? 'Tus inmuebles, ' + esc(u.name.split(' ')[0]) + '. ' : isVendor(ctx.roleId) ? 'Inmuebles donde tienes órdenes o pauta. ' : '';
    sub += base.length + ' inmuebles · ' + esc(D.tenant.name);
    var html = '<div class="sl-stack">' + sectionHead('Inmuebles', sub, right) +
      '<div class="sl-chips">' + stats.map(function (s) { return '<span class="sl-statchip"><i class="dot" style="color:' + s.c + '"></i>' + esc(s.k) + ' <b>' + s.n + '</b></span>'; }).join('') + '</div>' +
      '<div class="sl-toolbar">' +
      select('sl.listings.f', [{ v: '', t: 'Venta y arriendo' }, { v: 'venta', t: 'Venta' }, { v: 'arriendo', t: 'Arriendo' }], f.op, 'data-key="op" aria-label="Operación"') +
      select('sl.listings.f', [{ v: '', t: 'Todos los tipos' }].concat(types.map(function (t) { return { v: t, t: D.typeLabel(t) }; })), f.type, 'data-key="type" aria-label="Tipo"') +
      select('sl.listings.f', [{ v: '', t: 'Todas las zonas' }].concat(cities.map(function (c) { return { v: c, t: c }; })), f.zona, 'data-key="zona" aria-label="Zona"') +
      select('sl.listings.f', [{ v: '', t: 'Todos los estados' }, 'borrador', 'en preparación', 'activo', 'bajo oferta', 'arrendado', 'vendido'].map(function (s) { return typeof s === 'string' ? { v: s, t: D.statusLabel(s) } : s; }), f.estado, 'data-key="estado" aria-label="Estado"') +
      (agents.length > 1 ? select('sl.listings.f', [{ v: '', t: 'Todos los asesores' }].concat(agents.map(function (a) { return { v: a, t: D.userName(a) }; })), f.agente, 'data-key="agente" aria-label="Asesor"') : '') +
      (f.op || f.type || f.zona || f.estado || f.agente ? '<button class="btn btn-ghost btn-sm" data-action="sl.listings.clear">' + icon('x') + ' Limpiar</button>' : '') +
      '<span class="spacer"></span>' +
      pillTabs([{ v: 'grid', t: 'Tarjetas' }, { v: 'table', t: 'Tabla' }, { v: 'map', t: 'Mapa' }], S.listings.view, 'sl.listings.view') +
      '</div>';
    if (!list.length) html += emptyState('Ningún inmueble coincide con los filtros.', '<button class="btn btn-secondary btn-sm" data-action="sl.listings.clear">Limpiar filtros</button>');
    else if (S.listings.view === 'table') html += listingsTable(list, ctx);
    else if (S.listings.view === 'map') html += listingsMap(list, ctx) + '<p class="xs muted">' + list.length + ' inmuebles en el mapa · clic en un punto para abrir la ficha.</p>';
    else html += '<div class="sl-listings">' + list.map(function (l) { return listingCard(l, ctx); }).join('') + '</div>';
    return html + '</div>';
  }

  function productionTimeline(l) {
    var order = ['photography', 'writing', 'research', 'creative', 'ads'];
    var ts = D.tasks.filter(function (t) { return t.listingId === l.id; });
    var live = ['activo', 'bajo oferta', 'arrendado', 'vendido'].indexOf(l.status) >= 0;
    var items = order.map(function (k) {
      var t = ts.filter(function (x) { return x.kind === k; })[0];
      var st = t ? t.status : (live ? 'listo' : 'pendiente');
      return { label: KIND[k].label, t: t, st: st };
    });
    items.push({ label: 'Publicado · activo', st: live ? 'listo' : 'pendiente', t: ts.filter(function (x) { return x.kind === 'publishing'; })[0] });
    var firstOpen = -1; items.forEach(function (it, i) { if (firstOpen < 0 && it.st !== 'listo') firstOpen = i; });
    return '<ul class="timeline">' + items.map(function (it, i) {
      var cls = it.st === 'listo' ? 'is-done' : (i === firstOpen ? 'is-current' : ''); if (it.t && it.t.aiDrafted && it.st !== 'listo') cls += ' is-ai';
      var body = it.t ? esc(D.userName(it.t.assignee)) + ' · ' + esc(dueLabel(it.t.due)) + (it.t.note ? ' · ' + esc(it.t.note) : '') : (it.st === 'listo' ? 'Completado' : 'Sin ordenar');
      return '<li class="timeline-item ' + cls + '"><div class="timeline-title">' + esc(it.label) + ' ' + (it.t ? taskStatusBadge(it.st) : '') + (it.t && it.t.aiDrafted ? ' ' + badgeAI() : '') + '</div><div class="timeline-body">' + body + '</div></li>';
    }).join('') + '</ul>';
  }
  function syndMatrix(l, ctx) {
    var ro = readOnly(ctx) || isVendor(ctx.roleId);
    var missing = PORTALS.filter(function (p) { var s = X.portal[l.id][p.id]; return s === 'pendiente' || s === 'desactualizado'; });
    return '<div>' + PORTALS.map(function (p) {
      var s = X.portal[l.id][p.id];
      return '<div class="sl-synd-row"><span class="row" style="gap:8px"><button class="sl-pdot" data-pstate="' + esc(s) + '" data-action="sl.pub.cell" data-listing="' + l.id + '" data-portal="' + p.id + '" aria-label="' + esc(p.name + ' · ' + PORTAL_LABEL[s]) + '"><i></i></button><b>' + esc(p.name) + '</b><span class="xs muted">' + esc(PORTAL_LABEL[s]) + '</span></span>' +
        (ro ? '' : '<label class="toggle"><input type="checkbox" data-change="sl.pub.toggle" data-listing="' + l.id + '" data-portal="' + p.id + '" ' + (s === 'publicado' ? 'checked' : '') + (s === 'no aplica' && p.id !== 'instagram' && !l.international ? '' : '') + '><span class="toggle-track"></span></label>') + '</div>';
    }).join('') +
      '<div class="callout callout-info" style="margin-top:var(--s-3)">' + icon('globe') + '<div><b>Llave es la fuente de verdad.</b> Los portales reciben cambios solo cuando hace falta. ' + (missing.length ? '<button class="btn btn-primary btn-sm" style="margin-top:6px" data-action="sl.pub.only" data-listing="' + l.id + '">Publicar solo donde haga falta (' + missing.length + ')</button>' : '<span class="xs">Todo al día.</span>') + '</div></div></div>';
  }
  function renderListingDetail(l, ctx) {
    var u = ctxUser(ctx);
    var broker = D.user(l.listedBy);
    var ppm = D.pricePerM2(l);
    var sug = suggestedPrice(l);
    var docs = D.documents.filter(function (d) { return d.listingId === l.id; });
    var deals = D.deals.filter(function (d) { return d.listingId === l.id; });
    var offers = deals.filter(function (d) { return d.offerPrice; });
    var ro = readOnly(ctx) || isVendor(ctx.roleId);
    var imgs = (X.mediaOrder[l.id] ? X.mediaOrder[l.id].map(function (f) { return l.images.filter(function (i) { return i.file === f; })[0]; }).filter(Boolean) : l.images);
    var head = '<div class="page-header"><div><a class="sl-link xs" href="' + route(ctx, 'listings') + '">← Inmuebles</a><h1 style="margin-top:4px">' + esc(l.title) + '</h1><p class="muted small">' + esc(listingLoc(l)) + ' · ' + esc(D.typeLabel(l.type)) + ' · ' + (l.ano ? 'construida en ' + l.ano : 'sin construir') + '</p></div>' +
      '<div class="row">' + badgeStatus(l.status) + (l.international ? '<span class="pill pill-accent">Internacional</span>' : '') +
      (ro ? '<span class="sl-ro">' + icon('shield') + ' Solo lectura</span>' : '<button class="btn btn-secondary btn-sm" data-action="sl.listings.edit" data-id="' + l.id + '">' + icon('edit') + ' Editar</button>') +
      linkTo(ctx, 'projects', l.id, icon('kanban') + ' Proyecto', 'btn btn-secondary btn-sm') + '</div></div>';
    var gallery = '<div class="sl-gallery">' + imgs.map(function (im, i) { return '<img src="' + esc(im.url) + '" alt="' + esc(l.title + ' · ' + im.aiTags) + '" loading="' + (i < 3 ? 'eager' : 'lazy') + '">'; }).join('') + '</div>';
    var adminTxt = l.administracion ? money(l.administracion) + '/mes' : (l.type === 'finca' || l.type === 'lote' || l.type === 'casa' ? 'No aplica' : '—');
    var kv = '<div class="sl-kv">' +
      '<div><small>Área construida</small><b>' + esc(D.fmtM2(l.area)) + '</b></div>' + (l.areaLote ? '<div><small>Lote</small><b>' + esc(D.fmtM2(l.areaLote)) + '</b></div>' : '') +
      '<div><small>Alcobas</small><b>' + (l.habitaciones || '—') + '</b></div><div><small>Baños</small><b>' + (l.banos || '—') + '</b></div><div><small>Parqueaderos</small><b>' + (l.parqueaderos || '—') + '</b></div>' +
      '<div><small>Estrato</small><b>' + (l.estrato ? l.estrato : '—') + '</b></div><div><small>Administración</small><b>' + esc(adminTxt) + '</b></div>' +
      '<div><small>$/m²</small><b>' + esc(ppm ? money(ppm, l.currency) : '—') + '</b></div><div><small>Días publicado</small><b>' + l.daysOnMarket + '</b></div><div><small>Vistas · leads</small><b>' + l.views.toLocaleString('es-CO') + ' · ' + l.leads + '</b></div></div>';
    var aiCopy = '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · mejorar redacción</div><div class="ai-suggest-body">' +
      esc(l.description.split('. ')[0]) + '. <span class="diff-add">' + esc(pick(['Amanece con el embalse en la ventana y termina el día en el muelle: una casa para vivir, o un activo productivo bajo administración Dorum Lifestyle.', 'A minutos del aeropuerto JMC y del Oriente que más se valoriza en Antioquia; ficha bilingüe lista para compradores internacionales.', 'Diseño que respira: luz natural, materiales locales y una propuesta de bienestar coherente con el sello Dorum.'], seed(l.id))) + '</span></div>' +
      (ro ? '<div class="ai-suggest-meta">Pendiente de aprobación del asesor.</div>' : '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="sl.ai.approveCopy" data-id="' + l.id + '">Aprobar redacción</button><button class="btn btn-secondary btn-sm" data-action="sl.ai.editCopy" data-id="' + l.id + '">Editar</button><button class="btn btn-ghost btn-sm" data-action="sl.ai.discard" data-what="redacción">Descartar</button></div>') +
      '<div class="ai-suggest-meta">Tono Dorum (naturaleza · bienestar · activo productivo) · SEO para Finca Raíz y Google · revisa antes de publicar</div></div>';
    var desc = '<div class="card sl-section"><h4>Descripción</h4><p class="prose" style="font-size:var(--fs-base)">' + esc(l.description) + '</p><div class="sl-amen">' + l.amenities.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') + '</div>' + aiCopy + '</div>';
    var priceCard = '<div class="card sl-section">' + priceLine(l) + '<div class="xs muted">' + (ppm ? esc(money(ppm, l.currency)) + ' por m² · ' : '') + (l.estrato ? 'Estrato ' + l.estrato + ' · ' : '') + 'Administración ' + esc(adminTxt) + '</div>' +
      (sug ? '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> AI · precio sugerido</div><div class="ai-suggest-body"><b>' + esc(money(sug.lo, l.currency, true)) + ' – ' + esc(money(sug.hi, l.currency, true)) + '</b> · mediana ' + esc(money(sug.med, l.currency)) + '/m² · ' + (sug.delta > 0 ? '<span class="diff-add">+' : '<span class="diff-del">') + esc(String(sug.delta).replace('.', ',')) + ' %</span> frente al precio actual</div>' +
        (ro ? '' : '<div class="ai-suggest-actions"><button class="btn btn-secondary btn-sm" data-action="sl.ai.applyPrice" data-id="' + l.id + '" data-price="' + Math.round((sug.lo + sug.hi) / 2) + '">Usar punto medio</button><button class="btn btn-ghost btn-sm" data-action="sl.ai.discard" data-what="precio">Mantener precio</button></div>') +
        '<div class="ai-suggest-meta">Basado en ' + sug.comps.length + ' comparables en ' + esc(l.city) + ' · ' + esc(l.operacion) + '</div></div>' : '') + '</div>';
    var brokerCard = broker ? '<div class="card"><div class="row" style="gap:var(--s-3)">' + avatar(broker.id, 'avatar-lg') + '<div class="flex-1"><b>' + esc(broker.name) + '</b><div class="xs muted">' + esc(broker.title || 'Asesor') + '</div><div class="xs muted">' + esc(broker.phone) + '</div></div><a class="btn btn-ghost btn-icon" href="tel:' + esc(broker.phone.replace(/\s/g, '')) + '" aria-label="Llamar">' + icon('phone') + '</a><a class="btn btn-ghost btn-icon" href="mailto:' + esc(broker.email || '') + '" aria-label="Correo">' + icon('mail') + '</a></div>' +
      (l.ownerId ? '<div class="xs muted" style="margin-top:var(--s-3)">Propietario: <b>' + esc(D.userName(l.ownerId)) + '</b></div>' : '') + '</div>' : '';
    var compsTbl = sug ? '<div class="card sl-section"><h4>Comparables <span class="badge badge-ai">AI</span></h4><div class="table-wrap" style="border:0"><table class="table table-compact sl-comps"><thead><tr><th>Comparable</th><th class="num">Área</th><th class="num">$/m²</th><th class="num">Precio</th><th>Dist.</th></tr></thead><tbody>' +
      sug.comps.map(function (c) { return '<tr><td><b>' + esc(D.typeLabel(c.ref.type)) + ' · ' + esc(c.loc) + '</b><div class="xs muted">' + esc(c.title) + ' · ' + esc(c.when) + '</div></td><td class="num">' + esc(D.fmtM2(c.area)) + '</td><td class="num">' + esc(money(c.ppm, l.currency)) + '</td><td class="num money">' + esc(money(c.price, l.currency, true)) + '</td><td>' + esc(c.dist) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' : '';
    var docsCard = '<div class="card sl-section"><h4>Documentos ' + linkTo(ctx, 'paperwork', l.id, 'Ver todos →', 'sl-link xs') + '</h4>' +
      (docs.length ? '<div class="sl-inline-list">' + docs.slice(0, 5).map(function (d) { return '<div class="row-between row"><span class="small">' + esc(d.name) + '<span class="xs muted"> · ' + esc(d.owedBy === 'seller' ? 'vendedor' : d.owedBy === 'buyer' ? 'comprador' : d.owedBy === 'landlord' ? 'arrendador' : d.owedBy === 'renter' ? 'arrendatario' : 'agencia') + '</span></span><span class="badge badge-status" data-status="' + esc(d.status === 'validado' || d.status === 'recibido' ? 'pagado' : d.status) + '">' + esc(d.status) + '</span></div>'; }).join('') + '</div>' +
        '<div class="xs muted">' + docs.filter(function (d) { return d.status === 'validado'; }).length + ' de ' + docs.length + ' validados' + (docs.some(function (d) { return d.status === 'vencido'; }) ? ' · <span class="sl-is-late">1 vencido</span>' : '') + '</div>' : '<p class="small muted">Sin checklist aún. Se genera al firmar el acuerdo de corretaje.</p>') + '</div>';
    var offersCard = '<div class="card sl-section"><h4>Ofertas ' + linkTo(ctx, 'crm-sell', null, 'Ir al pipeline →', 'sl-link xs') + '</h4>' +
      (offers.length ? offers.map(function (d) { var b = d.parties.buyer ? D.userName(d.parties.buyer) : 'Comprador'; return '<div class="sl-offer"><div class="stat"><span class="stat-label">Precio de lista</span><span class="stat-value">' + esc(money(d.askingPrice, d.currency, true)) + '</span></div><div class="stat"><span class="stat-label">Oferta · ' + esc(b) + '</span><span class="stat-value">' + esc(money(d.offerPrice, d.currency, true)) + '</span><span class="stat-delta down">' + esc(pct(Math.round((d.offerPrice - d.askingPrice) / d.askingPrice * 1000) / 10)) + '</span></div></div>'; }).join('') : '<p class="small muted">Sin ofertas. ' + l.leads + ' leads interesados.</p>') + '</div>';
    var left = '<div class="sl-stack">' + gallery + '<div class="card sl-section"><h4>Ficha técnica</h4>' + kv + '</div>' + desc + '<div class="card sl-section"><h4>Proyecto de producción ' + linkTo(ctx, 'projects', l.id, 'Abrir tablero →', 'sl-link xs') + '</h4>' + productionTimeline(l) + '</div>' + compsTbl + '</div>';
    var right = '<div class="sl-stack">' + priceCard + brokerCard + '<div class="card sl-section"><h4>Publicación ' + linkTo(ctx, 'publishing', null, 'Centro →', 'sl-link xs') + '</h4>' + syndMatrix(l, ctx) + '</div>' + docsCard + offersCard + '</div>';
    return '<div class="sl-stack">' + head + '<div class="sl-detail">' + left + right + '</div></div>';
  }
  function newListingModal(ctx, existing) {
    var l = existing || {};
    var opt = function (arr, v) { return arr.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); };
    var brokers = D.usersByRole('broker');
    return '<form class="sl-form-grid" id="slNewListing" data-submit="sl.listings.save" data-id="' + esc(l.id || '') + '">' +
      '<label class="field span-2"><span class="label">Título del anuncio</span><input class="input" name="title" required placeholder="Casa de lago con muelle privado" value="' + esc(l.title || '') + '"></label>' +
      '<label class="field"><span class="label">Operación</span><select class="select" name="operacion">' + opt([['venta', 'Venta'], ['arriendo', 'Arriendo']], l.operacion || 'venta') + '</select></label>' +
      '<label class="field"><span class="label">Tipo</span><select class="select" name="type">' + opt([['casa', 'Casa'], ['apartamento', 'Apartamento'], ['finca', 'Finca'], ['lote', 'Lote'], ['penthouse', 'Penthouse'], ['oficina', 'Oficina'], ['local', 'Local comercial']], l.type || 'casa') + '</select></label>' +
      '<label class="field"><span class="label">Precio (COP)</span><input class="input" name="price" type="number" min="0" step="1000000" required value="' + esc(l.price || '') + '" placeholder="1450000000"></label>' +
      '<label class="field"><span class="label">Administración / mes</span><input class="input" name="administracion" type="number" min="0" step="10000" value="' + esc(l.administracion || '') + '" placeholder="0"></label>' +
      '<label class="field"><span class="label">Ciudad / municipio</span><input class="input" name="city" required value="' + esc(l.city || '') + '" placeholder="Guatapé"></label>' +
      '<label class="field"><span class="label">Barrio / vereda</span><input class="input" name="barrio" value="' + esc(l.barrio || '') + '" placeholder="Tierra Prometida"></label>' +
      '<label class="field"><span class="label">Área construida (m²)</span><input class="input" name="area" type="number" min="0" value="' + esc(l.area || '') + '"></label>' +
      '<label class="field"><span class="label">Área lote (m²)</span><input class="input" name="areaLote" type="number" min="0" value="' + esc(l.areaLote || '') + '"></label>' +
      '<label class="field"><span class="label">Alcobas</span><input class="input" name="habitaciones" type="number" min="0" value="' + esc(l.habitaciones || '') + '"></label>' +
      '<label class="field"><span class="label">Baños</span><input class="input" name="banos" type="number" min="0" value="' + esc(l.banos || '') + '"></label>' +
      '<label class="field"><span class="label">Parqueaderos</span><input class="input" name="parqueaderos" type="number" min="0" value="' + esc(l.parqueaderos || '') + '"></label>' +
      '<label class="field"><span class="label">Estrato</span><select class="select" name="estrato">' + opt([['', '— (rural / no aplica)'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']], l.estrato ? String(l.estrato) : '') + '</select></label>' +
      '<label class="field"><span class="label">Año de construcción</span><input class="input" name="ano" type="number" min="1900" max="2030" value="' + esc(l.ano || '') + '"></label>' +
      '<label class="field"><span class="label">Asesor</span><select class="select" name="listedBy">' + opt(brokers.map(function (b) { return [b.id, b.name]; }), l.listedBy || ctxUser(ctx).id) + '</select></label>' +
      '<label class="field span-2"><span class="label">Descripción</span><textarea class="textarea" name="description" placeholder="Llave redacta un borrador bilingüe a partir de la ficha y las fotos; tú apruebas.">' + esc(l.description || '') + '</textarea><span class="hint">Si lo dejas vacío, Llave propone una redacción para aprobar.</span></label>' +
      '<div class="span-2 sl-check"><input type="checkbox" name="tpl" id="slTpl" checked><div><div class="b">Crear proyecto de producción con plantilla</div><div class="m">Fotos → redacción → comps → creativos → publicar. Se ordena a los proveedores habituales.</div></div></div>' +
      '<div class="span-2 modal-footer" style="padding-top:0"><button type="button" class="btn btn-ghost" data-action="sl.modal.close">Cancelar</button><button type="submit" class="btn btn-primary">' + (existing ? 'Guardar cambios' : 'Guardar como borrador') + '</button></div></form>';
  }
  L.register('listings', {
    title: 'Listings', titleEs: 'Inmuebles', icon: 'building',
    render: function (ctx) {
      CUR = ctx;
      if (ctx.id) { var l = D.listing(ctx.id); if (l) return renderListingDetail(l, ctx); return '<div class="sl-stack">' + sectionHead('Inmueble no encontrado', 'Revisa el enlace o vuelve a la lista.') + emptyState('No existe el inmueble ' + ctx.id + '.', linkTo(ctx, 'listings', null, 'Volver a Inmuebles', 'btn btn-secondary btn-sm')) + '</div>'; }
      return renderListingsIndex(ctx);
    },
    mount: function (el, ctx) { bindCommon(el, ctx); }
  });

  /* ================================================================== */
  /*  MODULE 2 & 3 · crm-get (captación) · crm-sell (ventas & arriendos) */
  /* ================================================================== */
  var SOURCE_ICON = { 'Instagram': 'camera', 'Finca Raíz': 'home', 'Referido': 'handshake', 'Website': 'globe', 'WhatsApp': 'message-circle', 'Meta Ads': 'megaphone' };
  function srcTag(c) { return '<span class="sl-src">' + icon(SOURCE_ICON[c.source] || 'globe') + esc(c.source) + '</span>'; }
  function kindLabel(k) { return ({ buyer: 'Comprador', renter: 'Arrendatario', seller: 'Vendedor', landlord: 'Arrendador' })[k] || k; }
  function contactIsAI(c) { return /AI/i.test(c.nextAction || '') || D.tasks.some(function (t) { return t.aiDrafted && t.status !== 'listo' && (c.userId && D.deals.some(function (d) { return d.listingId === t.listingId && (d.parties.buyer === c.userId || d.parties.renter === c.userId); })); }); }
  function contactValue(c) {
    if (c.pipeline === 'sell') return c.currency === 'USD' ? c.budget * 4100 : c.budget;
    var ls = (c.interest || []).map(D.listing).filter(Boolean);
    if (ls.length) return ls.reduce(function (a, l) { return a + (l.currency === 'USD' ? l.price * 4100 : l.price); }, 0);
    var hint = c.propertyHint || ''; return /lote/i.test(hint) ? 1200000000 : /finca/i.test(hint) ? 2500000000 : /cabañas/i.test(hint) ? 900000000 : 1500000000;
  }
  function contactCard(c, ctx) {
    var l = (c.interest || []).map(D.listing).filter(Boolean)[0];
    var hint = c.propertyHint || (l ? l.title : '');
    var ai = contactIsAI(c);
    return '<div class="kanban-card' + (ai ? ' is-ai' : '') + '" draggable="true" data-dnd="contact" data-id="' + c.id + '" data-action="sl.crm.open" data-cid="' + c.id + '" role="button" tabindex="0">' +
      '<div class="row-between row" style="flex-wrap:nowrap;gap:6px"><span class="title">' + esc(c.name) + '</span><span class="sl-score" title="Score AI ' + c.score + '"><i style="--v:' + c.score + '%"></i>' + c.score + '</span></div>' +
      (hint ? '<div class="sl-hint">' + icon(c.pipeline === 'get' ? 'key' : 'home') + ' ' + esc(hint) + (c.pipeline === 'sell' && c.budget ? ' · hasta ' + esc(money(c.budget, c.currency, true)) : '') + '</div>' : '') +
      (c.nextAction && c.nextAction !== '—' ? '<div class="sl-next">' + icon(ai ? 'sparkles' : 'clock') + '<span>' + esc(c.nextAction) + (ai ? ' ' + badgeAI() : '') + '</span></div>' : '') +
      '<div class="sl-cardfoot">' + srcTag(c) + '<span class="mid">' + esc(kindLabel(c.kind)) + ' · ' + esc(c.city) + '</span><span class="row" style="gap:4px;flex-wrap:nowrap">' + avatar(c.owner) + esc(D.fmtDate(c.lastTouch, 'short')) + '</span></div></div>';
  }
  function kanban(stages, contacts, ctx, pipeline) {
    return '<div class="kanban sl-board">' + stages.map(function (s) {
      var cs = contacts.filter(function (c) { return c.stage === s.id; });
      var val = cs.reduce(function (a, c) { return a + contactValue(c); }, 0);
      return '<div class="kanban-col" data-dropzone="stage" data-stage="' + s.id + '" data-pipeline="' + pipeline + '"><div class="kanban-head"><span>' + esc(s.label) + '</span><span class="count">' + cs.length + '</span></div>' +
        (cs.length ? '<div class="kanban-value">' + esc(money(val, 'COP', true)) + '</div>' : '') +
        cs.map(function (c) { return contactCard(c, ctx); }).join('') + '</div>';
    }).join('') + '</div>';
  }
  function crmTable(stages, contacts, ctx) {
    var lbl = {}; stages.forEach(function (s) { lbl[s.id] = s.label; });
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Contacto</th><th>Tipo</th><th>Etapa</th><th>Fuente</th><th>Interés</th><th class="num">Score</th><th>Último contacto</th><th>Siguiente paso</th><th>Asesor</th></tr></thead><tbody>' +
      contacts.map(function (c) {
        var l = (c.interest || []).map(D.listing).filter(Boolean)[0];
        return '<tr><td><button class="sl-link" style="background:none;border:0;cursor:pointer;font:inherit;text-align:left" data-action="sl.crm.open" data-cid="' + c.id + '">' + esc(c.name) + '</button><div class="xs muted">' + esc(c.city) + '</div></td><td>' + esc(kindLabel(c.kind)) + '</td><td><span class="badge badge-brand">' + esc(lbl[c.stage] || c.stage) + '</span></td><td>' + srcTag(c) + '</td><td class="small">' + esc(c.propertyHint || (l ? l.title : '—')) + '</td><td class="num">' + c.score + '</td><td>' + esc(D.fmtDate(c.lastTouch)) + '</td><td class="small">' + esc(c.nextAction || '—') + (contactIsAI(c) ? ' ' + badgeAI() : '') + '</td><td>' + avatar(c.owner) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function crmHeader(ctx, pipeline, title, sub, contacts, extraRight) {
    var st = pipeline === 'get' ? S.crmGet : S.crmSell;
    var aiCount = contacts.filter(contactIsAI).length;
    var stats = pipeline === 'get' ? [
      { k: 'Leads', n: contacts.length, c: 'var(--text-3)' },
      { k: 'Visitas esta semana', n: contacts.filter(function (c) { return c.stage === 'visita'; }).length, c: 'var(--info)' },
      { k: 'Propuestas', n: contacts.filter(function (c) { return c.stage === 'propuesta'; }).length, c: 'var(--warn)' },
      { k: 'Acuerdos firmados', n: contacts.filter(function (c) { return c.stage === 'firmado'; }).length, c: 'var(--brand)' }
    ] : [
      { k: 'Leads', n: contacts.length, c: 'var(--text-3)' },
      { k: 'Tours', n: contacts.filter(function (c) { return c.stage === 'tour'; }).length, c: 'var(--info)' },
      { k: 'Ofertas', n: contacts.filter(function (c) { return c.stage === 'oferta'; }).length, c: 'var(--warn)' },
      { k: 'Valor del pipeline', n: money(contacts.reduce(function (a, c) { return a + contactValue(c); }, 0), 'COP', true), c: 'var(--brand)' }
    ];
    var right = '';
    if (ctx.roleId === 'broker' || ctx.roleId === 'rental_admin') right += '<label class="toggle"><input type="checkbox" data-change="sl.crm.all" data-pipeline="' + pipeline + '" ' + (st.all ? 'checked' : '') + '><span class="toggle-track"></span> Todo el equipo</label>';
    right += (extraRight || '') + '<button class="btn btn-primary" data-action="sl.crm.new" data-pipeline="' + pipeline + '">' + icon('plus') + ' Nuevo lead</button>';
    return sectionHead(title, sub, right) +
      '<div class="sl-chips">' + stats.map(function (s) { return '<span class="sl-statchip"><i class="dot" style="color:' + s.c + '"></i>' + esc(s.k) + ' <b>' + esc(s.n) + '</b></span>'; }).join('') + (aiCount ? '<span class="sl-statchip" style="border-color:var(--ai)"><i class="dot" style="color:var(--ai)"></i>Seguimientos AI por aprobar <b>' + aiCount + '</b></span>' : '') + '</div>' +
      '<div class="sl-toolbar"><span class="xs muted">Arrastra una tarjeta para cambiar de etapa · clic para abrir el perfil</span><span class="spacer"></span>' + pillTabs([{ v: 'kanban', t: 'Tablero' }, { v: 'table', t: 'Lista' }], st.view, 'sl.crm.view', 'data-pipeline="' + pipeline + '"') + '</div>';
  }
  L.register('crm-get', {
    title: 'Acquisition', titleEs: 'Captación', icon: 'key',
    render: function (ctx) {
      CUR = ctx; var cs = visibleContacts(ctx, 'get');
      var html = '<div class="sl-stack">' + crmHeader(ctx, 'get', 'Captación', 'Vendedores y arrendadores que quieren trabajar con ' + esc(D.tenant.name) + '. Del primer contacto al acuerdo de corretaje firmado.', cs);
      html += cs.length ? (S.crmGet.view === 'table' ? crmTable(GET_STAGES, cs, ctx) : kanban(GET_STAGES, cs, ctx, 'get')) : emptyState('Sin leads de captación en esta vista.');
      return html + '</div>';
    },
    mount: function (el, ctx) { bindCommon(el, ctx); bindDnD(el, ctx); }
  });
  L.register('crm-sell', {
    title: 'Sales & rentals', titleEs: 'Ventas & arriendos', icon: 'handshake',
    render: function (ctx) {
      CUR = ctx; var cs = visibleContacts(ctx, 'sell');
      var oh = '<label class="toggle" title="Modo open house"><input type="checkbox" data-change="sl.crm.openhouse" ' + (X.openHouse ? 'checked' : '') + '><span class="toggle-track"></span> Open house</label>';
      var html = '<div class="sl-stack">' + crmHeader(ctx, 'sell', 'Ventas & arriendos', 'Compradores y arrendatarios. Llave cruza presupuesto, zona y tipo con el inventario y redacta el seguimiento; tú apruebas.', cs, oh);
      if (X.openHouse) {
        html += '<div class="sl-banner">' + icon('home') + '<div><b>Modo open house activo.</b> <span class="small">Registra visitantes en dos toques; Llave los califica y agenda el seguimiento.</span></div>' +
          '<form class="row" data-submit="sl.crm.quickvisitor" style="margin-left:auto;gap:6px"><input class="input input-sm" name="name" placeholder="Nombre del visitante" required style="width:180px"><select class="select input-sm" name="listing" style="width:auto">' + visibleListings(ctx).filter(function (l) { return l.status === 'activo'; }).map(function (l) { return '<option value="' + l.id + '">' + esc(l.title) + '</option>'; }).join('') + '</select><button class="btn btn-accent btn-sm" type="submit">Registrar</button></form></div>';
      }
      html += cs.length ? (S.crmSell.view === 'table' ? crmTable(SELL_STAGES, cs, ctx) : kanban(SELL_STAGES, cs, ctx, 'sell')) : emptyState('Sin leads en esta vista.');
      return html + '</div>';
    },
    mount: function (el, ctx) { bindCommon(el, ctx); bindDnD(el, ctx); }
  });

  /* ------------------------------------------------ contact drawer */
  function matchesFor(c) {
    var wantOp = (c.kind === 'renter') ? 'arriendo' : 'venta';
    var interest = (c.interest || []).map(D.listing).filter(Boolean);
    var cities = interest.map(function (l) { return l.city; }); var types = interest.map(function (l) { return l.type; });
    var budget = c.budget || 0;
    return D.listings.filter(function (l) { return l.operacion === wantOp && ['activo', 'bajo oferta'].indexOf(l.status) >= 0 && (!c.currency || c.currency === l.currency) && (c.currency || l.currency === 'COP'); }).map(function (l) {
      var sc = 0;
      if (budget) { if (l.price <= budget) sc += 40; else sc += Math.max(0, 40 - Math.round((l.price - budget) / budget * 100)); }
      if (cities.indexOf(l.city) >= 0) sc += 25; else if (cities.length && interest.some(function (i) { return i.region === l.region; })) sc += 12;
      if (types.indexOf(l.type) >= 0) sc += 20;
      if ((c.interest || []).indexOf(l.id) >= 0) sc += 15;
      if (c.lang === 'en' && (l.international || l.division === 'lifestyle')) sc += 5;
      return { l: l, score: Math.min(100, sc) };
    }).filter(function (m) { return m.score >= 30; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
  }
  function firstTouchDraft(c) {
    var first = c.name.split(' ')[0];
    var l = (c.interest || []).map(D.listing).filter(Boolean)[0];
    if (c.lang === 'en') return 'Hi ' + first + ', this is ' + D.userName(c.owner).split(' ')[0] + ' from Dorum Lifestyle. Thanks for your interest in ' + (l ? l.title : 'our reservoir-view homes') + '. I can send you the full brochure and a video walkthrough — would Saturday work for a private tour?';
    if (c.pipeline === 'get') return 'Hola ' + first + ', soy ' + D.userName(c.owner).split(' ')[0] + ' de Dorum Lifestyle. Vimos tu interés en vender ' + (c.propertyHint ? 'tu ' + c.propertyHint.toLowerCase() : 'tu inmueble') + '. Tenemos compradores activos en la zona y podemos proponerte un precio con comparables reales. ¿Te viene bien una visita de captación esta semana?';
    return 'Hola ' + first + ', soy ' + D.userName(c.owner).split(' ')[0] + ' de Dorum Lifestyle. Gracias por tu interés en ' + (l ? l.title : 'nuestros inmuebles') + '. Te comparto la ficha completa y el video. ¿Te gustaría agendar una visita el fin de semana?';
  }
  function scheduler(c, kind) {
    var days = ['jue 18', 'vie 19', 'sáb 20', 'lun 22'];
    var hours = ['09:00', '11:00', '15:00'];
    var s = seed(c.id);
    var sel = X.visits.filter(function (v) { return v.contactId === c.id; })[0];
    return '<div class="sl-section"><h4>' + esc(kind === 'tour' ? 'Agendar tour' : 'Agendar visita de captación') + (sel ? '<span class="badge badge-success">Agendada · ' + esc(sel.slot) + '</span>' : '') + '</h4><div class="sl-sched">' + days.map(function (d, i) {
      var h = hours[(s + i) % 3]; var slot = d + ' · ' + h;
      return '<button type="button" data-action="sl.crm.schedule" data-cid="' + c.id + '" data-slot="' + esc(slot) + '" data-kind="' + kind + '" class="' + (sel && sel.slot === slot ? 'is-active' : '') + '"><b>' + esc(d) + '</b><span>' + h + '</span></button>';
    }).join('') + '</div><div class="xs muted">Llave bloquea la agenda del asesor, invita por WhatsApp' + (c.lang === 'en' ? ' en inglés' : '') + ' y avisa al propietario.</div></div>';
  }
  function activityTimeline(c) {
    var items = X.activity[c.id] || [];
    var ic = { 'WhatsApp': 'message-circle', 'Llamada': 'phone', 'Correo': 'mail', 'Origen': 'sparkles', 'Visita': 'calendar', 'Contrato': 'file-text', 'Referido': 'handshake' };
    return '<ul class="timeline sl-activity">' + items.map(function (a, i) {
      return '<li class="timeline-item ' + (i === 0 ? 'is-current' : 'is-done') + (a.ai ? ' is-ai' : '') + '"><div class="timeline-time">' + esc(D.fmtDate(a.at)) + ' · ' + esc(a.kind) + (a.by ? ' · ' + esc(D.userName(a.by).split(' ')[0]) : '') + '</div><div class="timeline-title" style="display:flex;gap:6px;align-items:center">' + icon(ic[a.kind] || 'clock') + ' ' + esc(a.title) + (a.ai ? ' ' + badgeAI('AI') : '') + '</div></li>';
    }).join('') + '</ul>';
  }
  function contactDrawer(c, ctx) {
    var ro = readOnly(ctx);
    var stages = c.pipeline === 'get' ? GET_STAGES : SELL_STAGES;
    var head = '<div class="sl-drawer-head">' + avatar(c.userId || c.name, 'avatar-lg') + '<div class="flex-1"><h3>' + esc(c.name) + '</h3><div class="xs muted">' + esc(kindLabel(c.kind)) + ' · ' + esc(c.city) + ' · ' + (c.lang === 'en' ? 'inglés' : 'español') + (c.whatsapp ? ' · WhatsApp' : '') + '</div></div><span class="sl-score" title="Score AI"><i style="--v:' + c.score + '%"></i>' + c.score + '</span></div>' +
      '<div class="sl-toolbar" style="gap:6px"><button class="btn btn-secondary btn-sm">' + icon('phone') + ' Llamar</button><button class="btn btn-secondary btn-sm">' + icon('message-circle') + ' WhatsApp</button><button class="btn btn-secondary btn-sm">' + icon('mail') + ' Correo</button><span class="spacer"></span>' +
      '<select class="select input-sm" style="width:auto" data-change="sl.crm.stage" data-cid="' + c.id + '" aria-label="Etapa">' + stages.map(function (s) { return '<option value="' + s.id + '"' + (s.id === c.stage ? ' selected' : '') + '>' + esc(s.label) + '</option>'; }).join('') + '</select></div>';
    var info = '<div class="sl-mini-kv"><div><small>Fuente</small><b>' + esc(c.source) + '</b></div><div><small>Asesor</small><b>' + esc(D.userName(c.owner)) + '</b></div><div><small>Último contacto</small><b>' + esc(D.fmtDate(c.lastTouch)) + '</b></div>' + (c.budget ? '<div><small>Presupuesto</small><b>' + esc(money(c.budget, c.currency, true)) + '</b></div>' : '') + (c.propertyHint ? '<div><small>Inmueble</small><b>' + esc(c.propertyHint) + '</b></div>' : '') + '</div>';
    var ai = contactIsAI(c) || c.stage === 'nuevo';
    var draftKey = 'draft:' + c.id; var approved = X.approvals[draftKey];
    var aiBlock = ai ? '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · ' + (c.stage === 'nuevo' ? 'primer contacto' : 'seguimiento') + (c.lang === 'en' ? ' (EN)' : '') + '</div><div class="ai-suggest-body" id="slDraft-' + c.id + '" ' + (approved ? '' : 'contenteditable="false"') + '>' + esc(X['draftText:' + c.id] || firstTouchDraft(c)) + '</div>' +
      (approved ? '<div class="ai-suggest-meta">Aprobado y enviado por ' + esc(D.userName(approved)) + ' · registrado en la actividad</div>' :
        (ro ? '<div class="ai-suggest-meta">Pendiente de aprobación del asesor.</div>' : '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="sl.crm.approveDraft" data-cid="' + c.id + '">Aprobar y enviar</button><button class="btn btn-secondary btn-sm" data-action="sl.crm.editDraft" data-cid="' + c.id + '">Editar</button><button class="btn btn-ghost btn-sm" data-action="sl.crm.discardDraft" data-cid="' + c.id + '">Descartar</button></div><div class="ai-suggest-meta">Basado en la fuente, el idioma y ' + (c.interest && c.interest.length ? c.interest.length + ' inmueble(s) de interés' : 'la zona') + ' · revisa antes de enviar</div>')) + '</div>' : '';
    var body = '';
    if (c.pipeline === 'get') {
      var k = D.contracts.filter(function (k) { return (k.type || '').indexOf('corretaje') >= 0 && ((c.userId && k.signers.some(function (s) { return s.userId === c.userId; })) || (X.contractsFor && X.contractsFor[c.id] === k.id)); })[0];
      body += scheduler(c, 'visita');
      body += '<div class="sl-section"><h4>Acuerdo de corretaje</h4>' + (k ? '<div class="row-between row"><span class="small">' + esc(k.type) + ' · v' + k.version + ' · ' + k.clauses + ' cláusulas' + (k.aiDrafted ? ' ' + badgeAI('AI · redactado') : '') + '</span>' + badgeStatus(k.status) + '</div><div class="xs muted">' + (k.exclusive ? 'Exclusivo · ' : '') + (k.termMonths ? k.termMonths + ' meses · ' : '') + 'Comisión ' + (/venta/.test(k.type) ? D.tenant.commissionDefaults.saleUrbanPct + ' % + IVA' : D.tenant.commissionDefaults.rentalMgmtPct + ' % mensual') + ' · ' + linkTo(ctx, 'contracts', k.id, 'Ver contrato →') + '</div>' :
        (ro ? '<p class="small muted">Sin acuerdo aún.</p>' : '<p class="small muted">Llave redacta el acuerdo con la comisión por defecto (' + (c.kind === 'landlord' ? 'administración ' + D.tenant.commissionDefaults.rentalMgmtPct + ' %' : 'venta ' + D.tenant.commissionDefaults.saleUrbanPct + ' % urbano / ' + D.tenant.commissionDefaults.saleRuralPct + ' % rural') + ' + IVA) y lo envía a revisión legal.</p><button class="btn btn-primary btn-sm" data-action="sl.crm.contract" data-cid="' + c.id + '">' + icon('file-text') + ' Crear acuerdo de corretaje</button>')) + '</div>';
    } else {
      var ms = matchesFor(c);
      body += '<div class="sl-section"><h4>Inmuebles que encajan <span class="badge badge-ai">AI match</span></h4>' + (ms.length ? ms.map(function (m) {
        return '<div class="sl-match"><img src="' + esc(m.l.cover) + '" alt=""><div style="min-width:0"><div class="t">' + esc(m.l.title) + '</div><div class="m">' + esc(listingLoc(m.l)) + ' · ' + esc(D.fmtM2(m.l.area)) + (m.l.estrato ? ' · estrato ' + m.l.estrato : '') + '</div><div class="sl-score" style="margin-top:4px"><i style="--v:' + m.score + '%"></i>' + m.score + ' % match</div></div><div class="p">' + esc(D.fmtPrice(m.l)) + '<small>' + linkTo(ctx, 'listings', m.l.id, 'Ver ficha') + '</small></div></div>';
      }).join('') : '<p class="small muted">Sin coincidencias con el inventario activo.</p>') + '</div>';
      body += scheduler(c, 'tour');
      var deals = D.deals.filter(function (d) { return c.userId && (d.parties.buyer === c.userId || d.parties.renter === c.userId) && d.offerPrice; });
      body += '<div class="sl-section"><h4>Ofertas</h4>' + (deals.length ? deals.map(function (d) {
        var l = D.listing(d.listingId); var k = D.contracts.filter(function (k) { return k.dealId === d.id && k.type === 'Contraoferta'; })[0]; var t = D.tasks.filter(function (t) { return t.listingId === d.listingId && t.kind === 'negotiation'; })[0];
        var counter = Math.round((d.askingPrice + d.offerPrice) / 2 / 1e7) * 1e7 + 6.5e7 * (d.askingPrice > 2e9 ? 1 : 0);
        if (d.id === 'd-001') counter = 3780000000;
        var done = t && t.status === 'listo';
        return '<div class="sl-offer"><div class="stat"><span class="stat-label">Precio de lista</span><span class="stat-value">' + esc(money(d.askingPrice, d.currency, true)) + '</span><span class="xs muted">' + esc(l ? l.title : '') + '</span></div><div class="stat"><span class="stat-label">Oferta recibida</span><span class="stat-value">' + esc(money(d.offerPrice, d.currency, true)) + '</span><span class="stat-delta down">' + esc(pct(Math.round((d.offerPrice - d.askingPrice) / d.askingPrice * 1000) / 10)) + ' vs lista</span></div></div>' +
          '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · contraoferta</div><div class="ai-suggest-body">Proponemos <span class="diff-del">' + esc(money(d.offerPrice, d.currency)) + '</span> <span class="diff-add">' + esc(money(counter, d.currency)) + '</span>, ' + (d.id === 'd-001' ? 'entrega en 45 días y mobiliario incluido.' : 'arras del 10 % y escritura en 60 días.') + '</div>' +
          (done ? '<div class="ai-suggest-meta">Aprobada por ' + esc(D.userName(X.approvals[t.id] || c.owner)) + ' · enviada al comprador' + (k ? ' · contrato ' + k.id + ' en estado ' + esc(k.status) : '') + '</div>' :
            (ro ? '<div class="ai-suggest-meta">Pendiente de aprobación del asesor.</div>' : '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="sl.crm.approveCounter" data-cid="' + c.id + '" data-deal="' + d.id + '" data-task="' + (t ? t.id : '') + '" data-contract="' + (k ? k.id : '') + '">Aprobar y enviar</button><button class="btn btn-secondary btn-sm" data-action="sl.crm.editDraft" data-cid="' + c.id + '">Editar</button><button class="btn btn-ghost btn-sm" data-action="sl.ai.discard" data-what="contraoferta">Descartar</button></div><div class="ai-suggest-meta">Basado en ' + compsFor(l || D.listings[0]).length + ' comparables y ' + (d.timeline || []).filter(function (x) { return /oferta/i.test(x.label); }).length + ' ofertas previas · revisa antes de enviar</div>')) + '</div>';
      }).join('') : '<p class="small muted">Sin ofertas registradas.' + (c.stage === 'tour' ? ' Tras el tour, Llave propone el guion de cierre.' : '') + '</p>') + '</div>';
      var lenderTask = D.tasks.filter(function (t) { return t.kind === 'referral' && t.contactId === c.id; })[0];
      body += '<div class="sl-section"><h4>Crédito hipotecario</h4><div class="row-between row"><span class="small">' + (lenderTask ? 'Referido a <b>' + esc(D.userName('u-lender')) + '</b> · ' + esc(D.user('u-lender').title) + ' ' + taskStatusBadge(lenderTask.status) : 'Referir a ' + esc(D.userName('u-lender')) + ' (' + esc(D.user('u-lender').title) + '). Crea una tarea para el aliado y registra el referido.') + '</span>' + (lenderTask || ro || c.kind === 'renter' ? '' : '<button class="btn btn-secondary btn-sm" data-action="sl.crm.lender" data-cid="' + c.id + '">' + icon('landmark') + ' Referir al banco</button>') + '</div></div>';
    }
    body += '<div class="sl-section"><h4>Actividad</h4>' + activityTimeline(c) + '</div>';
    return '<div class="sl-stack" data-drawer-contact="' + c.id + '">' + head + info + aiBlock + body + '</div>';
  }
  function openContact(cid, ctx) {
    var c = D.byId(D.contacts, cid); if (!c) return;
    L.openDrawer(contactDrawer(c, ctx || CUR), { title: c.pipeline === 'get' ? 'Lead de captación' : 'Lead de ' + (c.kind === 'renter' ? 'arriendo' : 'compra') });
    // bind change handlers inside drawer (shell delegates clicks; change events are ours)
    setTimeout(function () { var dr = document.querySelector('[data-drawer-contact="' + cid + '"]'); if (dr) bindCommon(dr, ctx || CUR); }, 0);
  }
  function pushActivity(cid, kind, title, by, ai) { (X.activity[cid] = X.activity[cid] || []).unshift({ at: '2026-09-16', kind: kind, title: title, by: by, ai: !!ai }); }

  /* ================================================================== */
  /*  MODULE 4 · projects (producción por inmueble)                      */
  /* ================================================================== */
  function projectListings(ctx) {
    var vis = visibleListings(ctx);
    return vis.filter(function (l) { return D.tasks.some(function (t) { return t.listingId === l.id && KIND[t.kind]; }) || ['en preparación', 'borrador'].indexOf(l.status) >= 0; });
  }
  function orderCard(t, ctx, opts) {
    opts = opts || {};
    var l = D.listing(t.listingId); var k = KIND[t.kind] || { label: t.kind, icon: 'briefcase' };
    var amount = t.order && t.order.amount != null ? t.order.amount : (X.quotes[t.id] ? X.quotes[t.id].amount : (k.price || 0));
    return '<div class="kanban-card sl-order' + (t.aiDrafted ? ' is-ai' : '') + '" data-action="sl.task.open" data-tid="' + t.id + '" role="button" tabindex="0" style="cursor:pointer">' +
      '<div class="row-between row" style="flex-wrap:nowrap;gap:6px"><span class="t">' + esc(t.title) + '</span>' + (t.aiDrafted ? badgeAI() : '') + '</div>' +
      (l && !opts.hideListing ? '<div class="l">' + icon('building') + ' ' + esc(l.title) + '</div>' : '') +
      (t.note ? '<div class="l">' + esc(t.note) + '</div>' : '') +
      '<div class="sl-cardfoot">' + taskStatusBadge(t.status) + '<span class="sl-due ' + dueClass(t.due) + '">' + icon('clock') + ' ' + esc(dueLabel(t.due)) + '</span><span class="row" style="gap:4px;flex-wrap:nowrap">' + (amount ? '<span class="money">' + esc(money(amount, 'COP', true)) + '</span>' : (t.kind === 'construction' ? '<span>cotizar</span>' : '')) + avatar(t.assignee) + '</span></div></div>';
  }
  function projectsBoard(tasks, ctx) {
    return '<div class="kanban sl-board">' + TASK_KINDS.map(function (k) {
      var ts = tasks.filter(function (t) { return t.kind === k.id; });
      return '<div class="kanban-col" data-dropzone="kind" data-kind="' + k.id + '"><div class="kanban-head"><span class="row" style="gap:6px">' + icon(k.icon) + esc(k.label) + '</span><span class="count">' + ts.length + '</span></div>' +
        (ts.length ? ts.map(function (t) { return orderCard(t, ctx, { hideListing: !!S.projects.listing }); }).join('') : '<div class="xs muted" style="padding:var(--s-2)">' + (k.optional ? 'Opcional · sin órdenes' : 'Sin órdenes') + '</div>') + '</div>';
    }).join('') + '</div>';
  }
  function gantt(tasks, ctx) {
    var start = '2026-09-08', days = 28; // 4 weeks
    var pos = function (iso) { var d = dayDiff(iso); var t0 = dayDiff(start); return Math.max(0, Math.min(100, ((d - t0) / days) * 100)); };
    var groups = {}; tasks.forEach(function (t) { (groups[t.listingId] = groups[t.listingId] || []).push(t); });
    var weeks = ['8–14 sep', '15–21 sep', '22–28 sep', '29 sep–5 oct'];
    var rows = '';
    Object.keys(groups).forEach(function (lid) {
      var l = D.listing(lid); var ts = groups[lid].slice().sort(function (a, b) { return a.due < b.due ? -1 : 1; });
      var done = ts.filter(function (t) { return t.status === 'listo'; }).length;
      rows += '<div class="gl grp"><span>' + esc(l ? l.title : 'General') + '</span><span class="xs muted" style="flex:none">' + done + '/' + ts.length + '</span></div><div class="gr grp"></div>';
      ts.forEach(function (t) {
        var k = KIND[t.kind] || { days: 3, label: t.kind };
        var from = addDays(t.due, -(k.days || 3)); var x0 = pos(from), x1 = Math.max(pos(t.due), x0 + 4);
        var cls = t.status === 'listo' ? 'is-done' : t.status === 'bloqueado' ? 'is-blocked' : t.status === 'pendiente' ? 'is-pending' : t.aiDrafted ? 'is-ai' : '';
        rows += '<div class="gl">' + avatar(t.assignee) + '<span title="' + esc(t.title) + '">' + esc(k.label) + ' · ' + esc(D.userName(t.assignee).split(' ')[0]) + '</span></div>' +
          '<div class="gr"><span class="todayline" style="left:' + pos('2026-09-16').toFixed(1) + '%"></span><button class="bar ' + cls + '" style="left:' + x0.toFixed(1) + '%;width:' + (x1 - x0).toFixed(1) + '%" data-action="sl.task.open" data-tid="' + t.id + '" title="' + esc(t.title + ' · ' + D.fmtDate(from, 'short') + ' → ' + D.fmtDate(t.due, 'short')) + '">' + esc(D.fmtDate(t.due, 'short')) + '</button></div>';
      });
    });
    return '<div class="sl-gantt-wrap"><div class="sl-gantt"><div class="gh">Inmueble / entregable</div><div class="gweeks">' + weeks.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' + rows + '</div></div><div class="sl-legend" style="margin-top:var(--s-2)"><span><i style="background:var(--success)"></i> Listo</span><span><i style="background:var(--brand-2)"></i> En curso</span><span><i style="background:var(--ai)"></i> Borrador AI en revisión</span><span><i style="background:var(--surface-3);border:1px solid var(--border-strong)"></i> Pendiente</span><span><i style="background:var(--danger)"></i> Bloqueado</span><span><i style="background:var(--accent);border-radius:1px;width:2px"></i> Hoy</span></div>';
  }
  function templatesBlock(ctx) {
    return '<div class="sl-section"><h4>Plantillas de lanzamiento <span class="xs muted" style="text-transform:none;letter-spacing:0;font-weight:500">Cada paso queda ordenado, asignado y con fecha. Reutilízalas en cada captación.</span></h4><div class="sl-templates">' + TEMPLATES.map(function (t) {
      return '<div class="card sl-template"><div><b>' + esc(t.name) + '</b><div class="xs muted">' + esc(t.desc) + '</div></div><ol>' + t.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><div class="row" style="gap:6px">' + t.kinds.map(function (k) { return '<span class="pill pill-brand" style="font-size:10px">' + esc(KIND[k].label.replace(' (opcional)', '')) + '</span>'; }).join('') + '</div><button class="btn btn-secondary btn-sm" data-action="sl.projects.order" data-tpl="' + t.id + '">' + icon('plus') + ' Usar plantilla</button></div>';
    }).join('') + '</div></div>';
  }
  function orderModal(ctx, tplId, listingId) {
    var tpl = TEMPLATES.filter(function (t) { return t.id === tplId; })[0] || TEMPLATES[0];
    var ls = visibleListings(ctx);
    var vendors = function (role) { return D.usersByRole(role); };
    return '<form class="sl-stack" data-submit="sl.projects.createOrders" data-tpl="' + tpl.id + '" style="gap:var(--s-4)">' +
      '<label class="field"><span class="label">Inmueble</span><select class="select" name="listing">' + ls.map(function (l) { return '<option value="' + l.id + '"' + (l.id === listingId ? ' selected' : '') + '>' + esc(l.title) + ' · ' + esc(D.statusLabel(l.status)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="row" style="gap:6px"><span class="label">Plantilla</span>' + TEMPLATES.map(function (t) { return '<button type="button" class="chip' + (t.id === tpl.id ? ' is-active' : '') + '" data-action="sl.projects.order" data-tpl="' + t.id + '" data-listing="' + esc(listingId || '') + '">' + esc(t.name.replace('Plantilla: ', '')) + '</button>'; }).join('') + '</div>' +
      '<div class="sl-inline-list">' + TASK_KINDS.map(function (k) {
        var on = tpl.kinds.indexOf(k.id) >= 0; var vs = vendors(k.vendorRole);
        return '<label class="sl-check"><input type="checkbox" name="kind" value="' + k.id + '"' + (on ? ' checked' : '') + '><div class="flex-1"><div class="b row" style="gap:6px">' + icon(k.icon) + esc(k.label) + '</div><div class="m">Proveedor: <select class="select input-sm" name="assignee-' + k.id + '" style="width:auto;display:inline-block;margin-top:4px">' + vs.map(function (v) { return '<option value="' + v.id + '">' + esc(v.name) + ' · ' + esc(v.title) + '</option>'; }).join('') + '</select> · entrega en ' + k.days + ' días</div></div><span class="p">' + (k.price ? esc(money(k.price)) : 'Cotización') + '</span></label>';
      }).join('') + '</div>' +
      '<label class="field"><span class="label">Fecha de inicio</span><input class="input" type="date" name="start" value="2026-09-17"></label>' +
      '<div class="callout"><div>' + icon('sparkles') + '</div><div class="small">Llave envía cada orden al proveedor, agenda la sesión y deja los entregables AI (redacción, comps) en tu cola de aprobación. Total estimado: <b>' + esc(money(tpl.kinds.reduce(function (a, k) { return a + (KIND[k].price || 0); }, 0))) + '</b> + IVA.</div></div>' +
      '<div class="modal-footer" style="padding-top:0"><button type="button" class="btn btn-ghost" data-action="sl.modal.close">Cancelar</button><button type="submit" class="btn btn-primary">' + icon('send') + ' Ordenar paquete</button></div></form>';
  }
  function taskDrawer(t, ctx) {
    var l = D.listing(t.listingId); var k = KIND[t.kind] || { label: t.kind };
    var u = ctxUser(ctx); var mine = t.assignee === u.id; var canApprove = !isVendor(ctx.roleId) && !readOnly(ctx);
    var amount = t.order && t.order.amount != null ? t.order.amount : (X.quotes[t.id] ? X.quotes[t.id].amount : (k.price || 0));
    var html = '<div class="sl-stack" data-drawer-task="' + t.id + '"><div class="sl-drawer-head">' + avatar(t.assignee, 'avatar-lg') + '<div class="flex-1"><h3>' + esc(t.title) + '</h3><div class="xs muted">' + esc(k.label) + ' · ' + esc(D.userName(t.assignee)) + (l ? ' · ' + esc(l.title) : '') + '</div></div></div>' +
      '<div class="sl-mini-kv"><div><small>Estado</small>' + taskStatusBadge(t.status) + '</div><div><small>Entrega</small><b class="sl-due ' + dueClass(t.due) + '">' + esc(D.fmtDate(t.due)) + ' · ' + esc(dueLabel(t.due)) + '</b></div>' + (amount ? '<div><small>Honorarios</small><b>' + esc(money(amount)) + '</b></div>' : '') + (t.order && t.order.pkg ? '<div><small>Paquete</small><b>' + esc(t.order.pkg) + '</b></div>' : '') + '</div>';
    if (t.aiDrafted) {
      var approved = t.status === 'listo' && X.approvals[t.id];
      html += '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Entregable redactado por Llave</div><div class="ai-suggest-body">' + esc(t.note || 'Borrador listo para revisión humana.') + '</div>' +
        (approved ? '<div class="ai-suggest-meta">Aprobado por ' + esc(D.userName(approved)) + '</div>' : (canApprove || mine ? '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="sl.task.approve" data-tid="' + t.id + '">Aprobar</button><button class="btn btn-secondary btn-sm" data-action="sl.task.edit" data-tid="' + t.id + '">Editar</button><button class="btn btn-ghost btn-sm" data-action="sl.task.reject" data-tid="' + t.id + '">Pedir cambios</button></div>' : '') + '<div class="ai-suggest-meta">Llave redacta; una persona aprueba antes de que salga al portal o al cliente.</div>') + '</div>';
    }
    if (t.status === 'bloqueado') html += '<div class="callout callout-warn">' + icon('alert-triangle') + '<div>' + esc(t.note || 'Bloqueado por una dependencia.') + '</div></div>';
    if (mine && isVendor(ctx.roleId)) {
      if (t.status === 'pendiente') html += '<div class="row"><button class="btn btn-primary" data-action="sl.order.accept" data-tid="' + t.id + '">' + icon('check') + ' Aceptar orden</button><button class="btn btn-ghost" data-action="sl.order.decline" data-tid="' + t.id + '">Rechazar</button></div>';
      if (t.status === 'en curso') html += uploadZone(t) + '<div class="row"><button class="btn btn-primary" data-action="sl.order.deliver" data-tid="' + t.id + '">' + icon('upload-cloud') + ' Marcar entregado</button></div>';
    }
    if (l) html += '<div class="sl-section"><h4>Inmueble</h4><div class="sl-match"><img src="' + esc(l.cover) + '" alt=""><div><div class="t">' + esc(l.title) + '</div><div class="m">' + esc(listingLoc(l)) + ' · ' + esc(D.fmtM2(l.area)) + '</div></div><div class="p">' + esc(D.fmtPrice(l)) + '<small>' + linkTo(ctx, 'listings', l.id, 'Ver ficha') + '</small></div></div></div>';
    return html + '</div>';
  }
  L.register('projects', {
    title: 'Projects', titleEs: 'Proyectos', icon: 'kanban',
    render: function (ctx) {
      CUR = ctx;
      if (ctx.id && D.listing(ctx.id)) S.projects.listing = ctx.id;
      var ls = projectListings(ctx); var u = ctxUser(ctx);
      var tasks = D.tasks.filter(function (t) { return KIND[t.kind] && (ctx.roleId !== 'construction' || t.assignee === u.id || t.kind === 'construction'); });
      if (isVendor(ctx.roleId)) tasks = tasks.filter(function (t) { return ls.some(function (l) { return l.id === t.listingId; }); });
      else tasks = tasks.filter(function (t) { return visibleListings(ctx).some(function (l) { return l.id === t.listingId; }); });
      if (S.projects.listing && !ls.some(function (l) { return l.id === S.projects.listing; })) S.projects.listing = '';
      var shown = S.projects.listing ? tasks.filter(function (t) { return t.listingId === S.projects.listing; }) : tasks;
      var open = shown.filter(function (t) { return t.status !== 'listo'; }).length, ai = shown.filter(function (t) { return t.aiDrafted && t.status === 'revisión'; }).length, late = shown.filter(function (t) { return dayDiff(t.due) < 0 && t.status !== 'listo'; }).length;
      var right = (readOnly(ctx) || isVendor(ctx.roleId) ? '' : '<button class="btn btn-primary" data-action="sl.projects.order" data-listing="' + esc(S.projects.listing) + '">' + icon('plus') + ' Ordenar paquete</button>');
      var html = '<div class="sl-stack">' + sectionHead('Proyectos', 'Producción por inmueble: fotos, redacción, comps, creativos y pauta. Cada entregable es una orden a un proveedor con fecha y honorarios.', right) +
        '<div class="sl-chips"><span class="sl-statchip"><i class="dot" style="color:var(--text-3)"></i>Inmuebles en producción <b>' + ls.filter(function (l) { return D.tasks.some(function (t) { return t.listingId === l.id && t.status !== 'listo' && KIND[t.kind]; }); }).length + '</b></span><span class="sl-statchip"><i class="dot" style="color:var(--info)"></i>Órdenes abiertas <b>' + open + '</b></span><span class="sl-statchip" style="border-color:var(--ai)"><i class="dot" style="color:var(--ai)"></i>Borradores AI por aprobar <b>' + ai + '</b></span>' + (late ? '<span class="sl-statchip" style="border-color:var(--danger)"><i class="dot" style="color:var(--danger)"></i>Atrasadas <b>' + late + '</b></span>' : '') + '</div>' +
        '<div class="sl-toolbar">' + select('sl.projects.listing', [{ v: '', t: 'Todos los inmuebles' }].concat(ls.map(function (l) { return { v: l.id, t: l.title }; })), S.projects.listing, 'aria-label="Inmueble"') + '<span class="spacer"></span>' + pillTabs([{ v: 'board', t: 'Tablero' }, { v: 'gantt', t: 'Cronograma' }], S.projects.view, 'sl.projects.view') + '</div>';
      if (S.projects.listing) { var L1 = D.listing(S.projects.listing); html += '<div class="card" style="padding:var(--s-3) var(--s-4)"><div class="sl-vendor-row"><img src="' + esc(L1.cover) + '" alt="" style="width:72px;height:54px;object-fit:cover;border-radius:var(--r-sm)"><div><b>' + esc(L1.title) + '</b> ' + badgeStatus(L1.status) + '<div class="xs muted">' + esc(listingLoc(L1)) + ' · ' + esc(D.fmtPrice(L1)) + ' · asesor ' + esc(D.userName(L1.listedBy)) + '</div></div>' + linkTo(ctx, 'listings', L1.id, 'Ver ficha →', 'sl-link small') + '</div></div>'; }
      html += shown.length ? (S.projects.view === 'gantt' ? gantt(shown, ctx) : projectsBoard(shown, ctx)) : emptyState('Este inmueble no tiene órdenes todavía.', readOnly(ctx) || isVendor(ctx.roleId) ? '' : '<button class="btn btn-secondary btn-sm" data-action="sl.projects.order" data-listing="' + esc(S.projects.listing) + '">Ordenar paquete con plantilla</button>');
      if (!isVendor(ctx.roleId)) html += templatesBlock(ctx);
      return html + '</div>';
    },
    mount: function (el, ctx) { bindCommon(el, ctx); }
  });

  /* ================================================================== */
  /*  MODULE 5 · orders (vista proveedor)                                 */
  /* ================================================================== */
  function myOrders(ctx) {
    var u = ctxUser(ctx); var kinds = VENDOR_KINDS_BY_ROLE[ctx.roleId];
    return D.tasks.filter(function (t) { return t.assignee === u.id && (!kinds || kinds.indexOf(t.kind) >= 0 || t.kind === 'referral'); });
  }
  function orderAmount(t) { var k = KIND[t.kind] || {}; return t.order && t.order.amount != null ? t.order.amount : X.quotes[t.id] ? X.quotes[t.id].amount : (k.price || 0); }
  function uploadZone(t) {
    var ups = X.uploads.filter(function (u) { return u.taskId === t.id; });
    return '<div class="sl-drop" data-dropzone="upload" data-tid="' + t.id + '" data-action="sl.order.upload" role="button" tabindex="0">' + icon('upload-cloud') + '<b>Arrastra fotos, video o PDF aquí</b><span class="xs">o haz clic para simular una subida · se guardan en el inmueble, no en Dropbox</span>' + (ups.length ? '<div class="sl-chips" style="justify-content:center;margin-top:6px">' + ups.map(function (u) { return '<span class="pill pill-success">' + icon('check') + ' ' + esc(u.name) + '</span>'; }).join('') + '</div>' : '') + '</div>';
  }
  function payoutPreview(ctx) {
    var u = ctxUser(ctx); var orders = myOrders(ctx);
    var rows = orders.filter(function (t) { return orderAmount(t); }).map(function (t) { return { name: t.title, amount: orderAmount(t), st: t.status === 'listo' ? 'pagado' : t.status === 'revisión' ? 'por aprobar' : 'al entregar' }; });
    var paid = D.payouts.filter(function (p) { return p.counterparty === u.id && p.status === 'pagado'; }).reduce(function (a, p) { return a + p.amount; }, 0);
    var pend = rows.filter(function (r) { return r.st !== 'pagado'; }).reduce(function (a, r) { return a + r.amount; }, 0);
    return '<div class="card sl-section"><h4>Mis pagos ' + linkTo(ctx, 'my-money', null, 'Detalle →', 'sl-link xs') + '</h4><div class="sl-payout">' + rows.map(function (r) { return '<div><span class="small">' + esc(r.name) + ' <span class="xs muted">· ' + esc(r.st) + '</span></span><span class="money">' + esc(money(r.amount)) + '</span></div>'; }).join('') + '<div class="tot"><span>Pendiente por cobrar</span><span class="money">' + esc(money(pend)) + '</span></div><div><span class="xs muted">Pagado en 2026</span><span class="xs muted money">' + esc(money(paid)) + '</span></div></div><div class="xs muted">Retención en la fuente y IVA según tu RUT. Pago a 8 días de la aprobación del entregable.</div></div>';
  }
  L.register('orders', {
    title: 'Orders', titleEs: 'Órdenes', icon: 'briefcase',
    render: function (ctx) {
      CUR = ctx; var u = ctxUser(ctx); var orders = myOrders(ctx);
      var groups = [['Nuevas · por aceptar', 'pendiente'], ['En curso', 'en curso'], ['Entregadas · en revisión', 'revisión'], ['Bloqueadas', 'bloqueado'], ['Listas', 'listo']];
      var roleTxt = { photographer: 'Sesiones de foto, video y dron', writer: 'Redacción bilingüe y comps', advertiser: 'Creativos y campañas', construction: 'Cotizaciones y obras' }[ctx.roleId] || 'Tus órdenes';
      var html = '<div class="sl-stack">' + sectionHead('Órdenes', roleTxt + ' para ' + esc(D.tenant.name) + '. Acepta, entrega y cobra desde aquí.', '<span class="sl-statchip">' + avatar(u.id) + esc(u.title || u.name) + '</span>') +
        '<div class="sl-chips">' + groups.slice(0, 3).map(function (g) { return '<span class="sl-statchip">' + esc(g[0].split(' ·')[0]) + ' <b>' + orders.filter(function (t) { return t.status === g[1]; }).length + '</b></span>'; }).join('') + '<span class="sl-statchip"><i class="dot" style="color:var(--brand)"></i>Por cobrar <b>' + esc(money(orders.filter(function (t) { return t.status !== 'listo'; }).reduce(function (a, t) { return a + orderAmount(t); }, 0), 'COP', true)) + '</b></span></div>' +
        '<div class="sl-detail" style="grid-template-columns:minmax(0,1fr) 320px"><div class="sl-stack">';
      groups.forEach(function (g) {
        var ts = orders.filter(function (t) { return t.status === g[1]; }); if (!ts.length) return;
        html += '<div class="sl-section"><h4>' + esc(g[0]) + ' <span class="muted">' + ts.length + '</span></h4><div class="grid grid-auto" style="gap:var(--s-3)">' + ts.map(function (t) {
          var l = D.listing(t.listingId);
          var actions = '';
          if (t.status === 'pendiente') actions = '<button class="btn btn-primary btn-sm" data-action="sl.order.accept" data-tid="' + t.id + '">' + icon('check') + ' Aceptar</button><button class="btn btn-ghost btn-sm" data-action="sl.order.decline" data-tid="' + t.id + '">Rechazar</button>';
          else if (t.status === 'en curso') actions = '<button class="btn btn-primary btn-sm" data-action="sl.task.open" data-tid="' + t.id + '">' + icon('upload-cloud') + ' Subir y entregar</button>';
          else if (t.status === 'revisión') actions = '<span class="xs muted">' + (t.aiDrafted ? 'Borrador AI esperando tu aprobación' : 'Esperando aprobación de Dorum') + '</span>' + (t.aiDrafted ? '<button class="btn btn-secondary btn-sm" data-action="sl.task.approve" data-tid="' + t.id + '">Aprobar borrador</button>' : '');
          else if (t.status === 'bloqueado') actions = '<span class="xs sl-is-late">' + esc(t.note || 'Bloqueada') + '</span>';
          if (t.kind === 'construction' && !X.quotes[t.id] && t.status !== 'listo') actions += '<button class="btn btn-secondary btn-sm" data-action="sl.order.quote" data-tid="' + t.id + '">' + icon('wrench') + ' Enviar cotización</button>';
          return '<div class="card sl-order" style="padding:var(--s-4)"><div class="row-between row" style="flex-wrap:nowrap"><span class="t">' + esc(t.title) + '</span>' + (t.aiDrafted ? badgeAI() : '') + '</div>' + (l ? '<div class="l">' + icon('map-pin') + ' ' + esc(l.title) + ' · ' + esc(l.city) + '</div>' : '') + (t.order && t.order.pkg ? '<div class="l">' + esc(t.order.pkg) + '</div>' : '') + (t.note && !t.aiDrafted ? '<div class="l">' + esc(t.note) + '</div>' : '') +
            '<div class="sl-cardfoot"><span class="sl-due ' + dueClass(t.due) + '">' + icon('clock') + ' ' + esc(D.fmtDate(t.due)) + ' · ' + esc(dueLabel(t.due)) + '</span><span class="money">' + (orderAmount(t) ? esc(money(orderAmount(t))) : 'por cotizar') + '</span></div><div class="row" style="gap:6px">' + actions + '</div></div>';
        }).join('') + '</div></div>';
      });
      if (!orders.length) html += emptyState('No tienes órdenes abiertas. Dorum te avisará por WhatsApp cuando llegue una.');
      html += '</div><div class="sl-stack">' + payoutPreview(ctx) + '<div class="card sl-section"><h4>Cómo funciona</h4><ul class="timeline"><li class="timeline-item is-done"><div class="timeline-title">Orden recibida</div><div class="timeline-body">Dorum ordena desde una plantilla; tú aceptas o propones fecha.</div></li><li class="timeline-item is-current"><div class="timeline-title">Entrega en Llave</div><div class="timeline-body">Sube aquí: las fotos quedan en el inmueble con etiquetas AI; el texto pasa a aprobación.</div></li><li class="timeline-item"><div class="timeline-title">Aprobación y pago</div><div class="timeline-body">Una persona aprueba; el pago sale del split del negocio a 8 días.</div></li></ul></div></div></div></div>';
      return html;
    },
    mount: function (el, ctx) { bindCommon(el, ctx); bindDnD(el, ctx); }
  });

  /* ================================================================== */
  /*  MODULE 6 · media (fotos & video)                                    */
  /* ================================================================== */
  function mediaListings(ctx) {
    var u = ctxUser(ctx);
    if (ctx.roleId === 'photographer') return D.listings.filter(function (l) { return D.tasks.some(function (t) { return t.listingId === l.id && t.kind === 'photography' && t.assignee === u.id; }) || D.deals.some(function (d) { return d.listingId === l.id && d.split.some(function (s) { return s.participant === u.id; }); }); });
    return visibleListings(ctx);
  }
  function orderedImages(l) {
    var ord = X.mediaOrder[l.id]; if (!ord) return l.images.slice();
    var byFile = {}; l.images.forEach(function (i) { byFile[i.file] = i; });
    var out = ord.map(function (f) { return byFile[f]; }).filter(Boolean);
    l.images.forEach(function (i) { if (out.indexOf(i) < 0) out.push(i); });
    return out;
  }
  L.register('media', {
    title: 'Media', titleEs: 'Fotos & video', icon: 'image',
    render: function (ctx) {
      CUR = ctx; var ls = mediaListings(ctx);
      if (S.media.listing && !ls.some(function (l) { return l.id === S.media.listing; })) S.media.listing = '';
      var all = []; ls.forEach(function (l) { orderedImages(l).forEach(function (im, i) { all.push({ l: l, im: im, i: i }); }); });
      var tags = []; all.forEach(function (x) { if (tags.indexOf(x.im.aiTags) < 0) tags.push(x.im.aiTags); });
      var shown = all.filter(function (x) { return (!S.media.listing || x.l.id === S.media.listing) && (!S.media.tag || x.im.aiTags === S.media.tag); });
      var selCount = Object.keys(X.mediaSel).filter(function (k) { return X.mediaSel[k]; }).length;
      var gb = (all.length * 4.6 + X.uploads.length * 5.1) / 1024; var vids = ls.filter(function (l) { return l.images.length >= 8; }).length;
      var ro = readOnly(ctx);
      var right = '<label class="toggle"><input type="checkbox" data-change="sl.media.wm" ' + (X.watermark ? 'checked' : '') + '><span class="toggle-track"></span> Marca de agua</label>' +
        (ro ? '' : '<button class="btn btn-secondary" data-action="sl.media.best">' + icon('sparkles') + ' Seleccionar mejores 20</button>' + (selCount ? '<button class="btn btn-primary" data-action="sl.media.sendWriter">' + icon('send') + ' Enviar ' + selCount + ' al redactor</button>' : ''));
      if (ctx.roleId === 'photographer') right = '<button class="btn btn-primary" data-action="sl.order.upload" data-tid="' + (myOrders(ctx).filter(function (t) { return t.status === 'en curso'; })[0] || { id: '' }).id + '">' + icon('upload-cloud') + ' Subir sesión</button>' + right;
      var html = '<div class="sl-stack">' + sectionHead('Fotos & video', (ctx.roleId === 'photographer' ? 'Tus sesiones para ' + esc(D.tenant.name) + '. ' : '') + 'Cada imagen vive en su inmueble con etiquetas AI, calidad estimada y orden de publicación. Reemplaza Dropbox.', right) +
        '<div class="grid grid-4" style="gap:var(--s-3)"><div class="card stat"><span class="stat-label">Imágenes</span><span class="stat-value">' + all.length + '</span><span class="xs muted">' + ls.length + ' inmuebles</span></div><div class="card stat"><span class="stat-label">Seleccionadas</span><span class="stat-value">' + selCount + '</span><span class="xs muted">para portales / redactor</span></div><div class="card stat"><span class="stat-label">Almacenamiento</span><span class="stat-value">' + gb.toFixed(1).replace('.', ',') + ' GB</span><div class="progress" style="margin-top:4px"><span style="--value:' + Math.min(100, Math.round(gb / 50 * 100)) + '%"></span></div><span class="xs muted">de 50 GB del plan · antes Dropbox</span></div><div class="card stat"><span class="stat-label">Videos y reels</span><span class="stat-value">' + vids + '</span><span class="xs muted">' + D.tasks.filter(function (t) { return t.kind === 'creative' && t.status !== 'listo'; }).length + ' en producción</span></div></div>' +
        '<div class="sl-toolbar">' + select('sl.media.listing', [{ v: '', t: 'Todos los inmuebles' }].concat(ls.map(function (l) { return { v: l.id, t: l.title }; })), S.media.listing, 'aria-label="Inmueble"') +
        '<div class="sl-chips"><button class="chip' + (!S.media.tag ? ' is-active' : '') + '" data-action="sl.media.tag" data-tag="">Todas</button>' + tags.map(function (t) { return '<button class="chip' + (S.media.tag === t ? ' is-active' : '') + '" data-action="sl.media.tag" data-tag="' + esc(t) + '">' + icon('sparkles') + ' ' + esc(t) + '</button>'; }).join('') + '</div></div>' +
        (S.media.listing ? '<p class="xs muted">Arrastra para reordenar: la primera imagen es la portada en portales y en el Sitio Dorum.</p>' : '') +
        (shown.length ? '<div class="sl-masonry' + (X.watermark ? ' sl-wm' : '') + '">' + shown.map(function (x) {
          var sel = !!X.mediaSel[x.im.file]; var ar = ['3/2', '4/3', '3/4', '1/1', '16/10'][seed(x.im.file) % 5];
          return '<figure class="sl-photo' + (sel ? ' is-selected' : '') + '" style="--ar:' + ar + '" draggable="' + (S.media.listing ? 'true' : 'false') + '" data-dnd="photo" data-file="' + esc(x.im.file) + '" data-listing="' + x.l.id + '"><img src="' + esc(x.im.url) + '" alt="' + esc(x.l.title + ' · ' + x.im.aiTags) + '" loading="lazy"><div class="top"><span class="q" title="Calidad estimada por AI">' + Math.round(x.im.quality * 100) + '</span>' + (ro ? '' : '<button class="sel" data-action="sl.media.select" data-file="' + esc(x.im.file) + '" aria-label="Seleccionar">' + (sel ? icon('check') : '') + '</button>') + '</div>' + (!S.media.listing ? '<span class="lst">' + esc(x.l.title) + '</span>' : '') + '<div class="tags"><span class="ai">' + esc(x.im.aiTags) + '</span>' + (x.i === 0 ? '<span>portada</span>' : '') + (x.im.approved ? '' : '<span>sin aprobar</span>') + '</div><div class="wm">Dorum</div></figure>';
        }).join('') + '</div>' : emptyState('Sin imágenes para este filtro.')) + '</div>';
      return html;
    },
    mount: function (el, ctx) { bindCommon(el, ctx); bindDnD(el, ctx); }
  });

  /* ================================================================== */
  /*  MODULE 7 · publishing (centro de sindicación)                       */
  /* ================================================================== */
  function portalFields(l, p) {
    var rows = [];
    var add = function (a, b, c) { rows.push([a, b, c]); };
    if (p.id === 'fincaRaiz') { add('title', 'Título (máx. 70)', l.title.slice(0, 70)); add('tipo_inmueble', 'Tipo', D.typeLabel(l.type)); add('precio_venta / canon', 'Precio', D.fmtPrice(l)); add('estrato', 'Estrato', l.estrato || '— (rural)'); add('valor_administracion', 'Administración', l.administracion ? money(l.administracion) : '0'); add('area_construida / area_lote', 'Área', D.fmtM2(l.area) + (l.areaLote ? ' / ' + D.fmtM2(l.areaLote) : '')); add('fotos[]', 'Fotos', orderedImages(l).filter(function (i) { return i.approved; }).length + ' aprobadas (máx. 30)'); }
    else if (p.id === 'wasi') { add('id_property_type', 'Tipo', D.typeLabel(l.type)); add('for_sale / for_rent', 'Operación', l.operacion); add('sale_price / rent_price', 'Precio', D.fmtPrice(l)); add('stratum', 'Estrato', l.estrato || 'null'); add('bedrooms / bathrooms / garages', 'Alcobas · baños · parq', [l.habitaciones, l.banos, l.parqueaderos].join(' · ')); add('zone_label', 'Zona', listingLoc(l)); add('galleries[]', 'Galería', orderedImages(l).length + ' imágenes'); }
    else if (p.id === 'metrocuadrado') { add('tipoInmueble', 'Tipo', D.typeLabel(l.type)); add('tipoNegocio', 'Negocio', l.operacion === 'venta' ? 'Venta' : 'Arriendo'); add('valorVenta / valorArriendo', 'Precio', D.fmtPrice(l)); add('estrato', 'Estrato', l.estrato || 'No aplica'); add('areaConstruida', 'Área construida', D.fmtM2(l.area)); add('descripcion', 'Descripción (máx. 2.000)', l.description.slice(0, 80) + '…'); }
    else if (p.id === 'instagram') { add('caption', 'Caption', (l.title + ' · ' + listingLoc(l) + ' · #curatedbynature #dorumlifestyle').slice(0, 120)); add('media[]', 'Carrusel', Math.min(10, orderedImages(l).length) + ' imágenes · 4:5'); add('cta', 'CTA', 'Escríbenos por WhatsApp'); add('location', 'Ubicación', l.city); }
    else { add('slug', 'URL', 'dorum/listing.html?id=' + l.id); add('lang', 'Idiomas', 'es · en'); add('hero', 'Portada', orderedImages(l)[0] ? orderedImages(l)[0].file : '—'); add('lifestyle_badge', 'Sello', l.division === 'lifestyle' ? 'Lifestyle & Experiences' : 'Dorum Real Estate'); }
    return '<table class="sl-map-fields">' + rows.map(function (r) { return '<tr><td><code>' + esc(r[0]) + '</code><div class="xs">' + esc(r[1]) + '</div></td><td>' + esc(r[2]) + '</td></tr>'; }).join('') + '</table>';
  }
  function pubCellDrawer(lid, pid, ctx) {
    var l = D.listing(lid), p = PORTALS.filter(function (x) { return x.id === pid; })[0]; if (!l || !p) return;
    var st = X.portal[lid][pid]; var ro = readOnly(ctx) || isVendor(ctx.roleId);
    var log = X.publishLog.filter(function (e) { return e.listingId === lid && e.portal === pid; });
    var html = '<div class="sl-stack" data-drawer-pub="1"><div class="sl-drawer-head"><button class="sl-pdot" data-pstate="' + esc(st) + '" style="cursor:default"><i></i></button><div class="flex-1"><h3>' + esc(p.name) + '</h3><div class="xs muted">' + esc(l.title) + ' · ' + esc(PORTAL_LABEL[st]) + '</div></div>' + badgeStatus(l.status) + '</div>' +
      (st === 'desactualizado' ? '<div class="callout callout-warn">' + icon('alert-triangle') + '<div>El portal tiene una versión anterior (precio o fotos). Llave detectó la diferencia al sincronizar.</div></div>' : '') +
      (st === 'no aplica' ? '<div class="callout">' + icon('shield') + '<div class="small">' + (l.international ? 'Inmueble internacional: los portales colombianos no aplican.' : 'Instagram solo se usa cuando el inmueble lo tiene activado en su ficha.') + '</div></div>' : '') +
      '<div class="sl-section"><h4>Mapeo de campos · vista previa</h4>' + portalFields(l, p) + '<div class="sl-ai-note"><span class="spark"></span> Llave valida límites de caracteres, fotos mínimas y campos obligatorios de ' + esc(p.name) + ' antes de enviar.</div></div>' +
      (ro || st === 'no aplica' ? '' : '<div class="row">' + (st !== 'publicado' ? '<button class="btn btn-primary" data-action="sl.pub.publish" data-listing="' + lid + '" data-portal="' + pid + '">' + icon('send') + ' Publicar ahora en ' + esc(p.name) + '</button>' : '<button class="btn btn-secondary" data-action="sl.pub.unpublish" data-listing="' + lid + '" data-portal="' + pid + '">Retirar de ' + esc(p.name) + '</button>') + '</div>') +
      '<div class="sl-section"><h4>Historial</h4>' + (log.length ? '<ul class="timeline">' + log.map(function (e, i) { return '<li class="timeline-item ' + (i === 0 ? 'is-current' : 'is-done') + (e.ai ? ' is-ai' : '') + '"><div class="timeline-time">' + esc(D.fmtDate(e.at)) + ' ' + esc(D.fmtDate(e.at, 'time')) + '</div><div class="timeline-title">' + esc(e.action) + (e.ai ? ' ' + badgeAI('AI') : '') + '</div><div class="timeline-body">' + esc(D.userName(e.by)) + '</div></li>'; }).join('') + '</ul>' : '<p class="small muted">Sin publicaciones previas en este portal.</p>') + '</div></div>';
    L.openDrawer(html, { title: 'Publicación · ' + p.name });
  }
  L.register('publishing', {
    title: 'Publishing', titleEs: 'Publicación', icon: 'globe',
    render: function (ctx) {
      CUR = ctx; var ro = readOnly(ctx) || isVendor(ctx.roleId);
      var ls = visibleListings(ctx).filter(function (l) { return l.status !== 'vendido'; });
      var counts = { publicado: 0, pendiente: 0, desactualizado: 0, 'no aplica': 0 };
      ls.forEach(function (l) { PORTALS.forEach(function (p) { counts[X.portal[l.id][p.id]]++; }); });
      var need = counts.pendiente + counts.desactualizado;
      var rows = S.publishing.onlyPending ? ls.filter(function (l) { return PORTALS.some(function (p) { var s = X.portal[l.id][p.id]; return s === 'pendiente' || s === 'desactualizado'; }); }) : ls;
      var right = '<label class="toggle"><input type="checkbox" data-change="sl.pub.onlyPending" ' + (S.publishing.onlyPending ? 'checked' : '') + '><span class="toggle-track"></span> Solo con pendientes</label>' + (ro ? '' : '<button class="btn btn-primary" data-action="sl.pub.only" ' + (need ? '' : 'disabled') + '>' + icon('send') + ' Publicar solo donde haga falta' + (need ? ' (' + need + ')' : '') + '</button>');
      var html = '<div class="sl-stack">' + sectionHead('Publicación', 'Llave es la fuente de verdad del inventario. Finca Raíz, Wasi, Metrocuadrado e Instagram reciben cambios solo cuando hace falta; el Sitio Dorum siempre está al día.', right) +
        '<div class="grid grid-3" style="gap:var(--s-4);align-items:stretch"><div class="card sl-truth span-2"><div class="node src">' + icon('key') + '<div>Llave OS</div><div class="xs" style="opacity:.8;font-weight:500">inventario · precios · fotos · textos</div></div><div class="arrow">push solo si hay cambio →<br>' + (X.publishLog[0] ? 'última sync ' + esc(D.fmtDate(X.publishLog[0].at, 'time')) : '') + '</div><div class="targets">' + PORTALS.map(function (p) { var c = ls.filter(function (l) { return X.portal[l.id][p.id] === 'publicado'; }).length; var ig = D.byId(D.integrations, p.id); return '<div class="node row-between row" style="text-align:left"><span>' + esc(p.name) + '</span><span class="xs muted">' + c + ' activos' + (ig && ig.leads30d ? ' · ' + ig.leads30d + ' leads/30 d' : '') + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="card row" style="gap:var(--s-4);align-items:center">' + C.donut([{ label: 'Publicado', value: counts.publicado, color: 'var(--success)' }, { label: 'Pendiente', value: counts.pendiente, color: 'var(--warn)' }, { label: 'Desactualizado', value: counts.desactualizado, color: 'var(--danger)' }, { label: 'No aplica', value: counts['no aplica'], color: 'var(--border)' }], { center: need, label: 'Estado de publicaciones' }) + '<div class="sl-legend" style="flex-direction:column;gap:6px"><span><i style="background:var(--success)"></i> Publicado <b>' + counts.publicado + '</b></span><span><i style="background:var(--warn)"></i> Pendiente <b>' + counts.pendiente + '</b></span><span><i style="background:var(--danger)"></i> Desactualizado <b>' + counts.desactualizado + '</b></span><span><i style="background:var(--border)"></i> No aplica <b>' + counts['no aplica'] + '</b></span></div></div></div>' +
        '<div class="table-wrap"><table class="sl-matrix"><thead><tr><th>Inmueble</th><th>Estado</th>' + PORTALS.map(function (p) { return '<th class="c">' + esc(p.name) + '</th>'; }).join('') + '<th class="num">Leads 30 d</th></tr></thead><tbody>' +
        rows.map(function (l) {
          return '<tr><td><a class="sl-link" href="' + route(ctx, 'listings', l.id) + '">' + esc(l.title) + '</a><div class="xs muted">' + esc(listingLoc(l)) + ' · ' + esc(D.fmtPrice(l)) + '</div></td><td>' + badgeStatus(l.status) + '</td>' +
            PORTALS.map(function (p) { var s = X.portal[l.id][p.id]; return '<td class="c"><button class="sl-pdot" data-pstate="' + esc(s) + '" data-action="sl.pub.cell" data-listing="' + l.id + '" data-portal="' + p.id + '" aria-label="' + esc(p.name + ': ' + PORTAL_LABEL[s]) + '" title="' + esc(PORTAL_LABEL[s]) + '"><i></i></button></td>'; }).join('') +
            '<td class="num">' + Math.round(l.leads * 0.6) + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="sl-legend"><span><i style="background:var(--success)"></i> Publicado</span><span><i style="background:var(--warn);box-shadow:0 0 0 3px var(--warn-soft)"></i> Pendiente</span><span><i style="background:var(--danger)"></i> Desactualizado</span><span><i style="border:1.5px dashed var(--border-strong)"></i> No aplica</span><span class="muted">· clic en un punto para ver el mapeo de campos</span></div>' +
        '<div class="card sl-section"><h4>Registro de publicaciones</h4><ul class="timeline">' + X.publishLog.slice(0, 8).map(function (e, i) { var l = D.listing(e.listingId), p = PORTALS.filter(function (x) { return x.id === e.portal; })[0]; return '<li class="timeline-item ' + (i === 0 ? 'is-current' : 'is-done') + (e.ai ? ' is-ai' : '') + '"><div class="timeline-time">' + esc(D.fmtDate(e.at)) + ' · ' + esc(D.fmtDate(e.at, 'time')) + '</div><div class="timeline-title">' + esc(p ? p.name : e.portal) + ' · ' + esc(e.action) + (e.ai ? ' ' + badgeAI('AI') : '') + '</div><div class="timeline-body">' + esc(l ? l.title : '') + ' · ' + esc(D.userName(e.by)) + '</div></li>'; }).join('') + '</ul></div></div>';
      return html;
    },
    mount: function (el, ctx) { bindCommon(el, ctx); }
  });

  /* ================================================================== */
  /*  MODULE 8 · ads (pauta)                                              */
  /* ================================================================== */
  function cplSeries(cmp) {
    var base = cmp.cpl || 70000, s = seed(cmp.id); var out = [];
    for (var i = 0; i < 8; i++) { var f = 1.28 - i * 0.045 + (((s >> i) % 11) - 5) / 100; out.push(Math.round(base * f / 500) * 500); }
    return out;
  }
  function blendedCpl(cmps) {
    var series = cmps.filter(function (c) { return c.cpl; }).map(cplSeries); if (!series.length) return [];
    return series[0].map(function (_, i) { return Math.round(series.reduce(function (a, s) { return a + s[i]; }, 0) / series.length / 500) * 500; });
  }
  var WEEKS = ['28 jul', '4 ago', '11 ago', '18 ago', '25 ago', '1 sep', '8 sep', '15 sep'];
  function campaignDrawer(cmp, ctx) {
    var l = cmp.listingId ? D.listing(cmp.listingId) : null; var ro = readOnly(ctx);
    var vs = X.variants[cmp.id] || []; var roas = cmp.spend ? ((cmp.leads * 0.01 * (l ? (l.currency === 'USD' ? l.price * 4100 : l.price) * 0.03 : 30000000)) / cmp.spend) : 0;
    var html = '<div class="sl-stack" data-drawer-cmp="' + cmp.id + '"><div class="sl-drawer-head"><div class="flex-1"><h3>' + esc(cmp.name) + '</h3><div class="xs muted">' + esc(cmp.platform) + ' · ' + esc(D.fmtDate(cmp.start, 'short')) + ' → ' + esc(D.fmtDate(cmp.end, 'short')) + (l ? ' · ' + esc(l.title) : '') + '</div></div><span class="badge badge-status" data-status="' + (cmp.status === 'activa' ? 'activo' : cmp.status === 'pausada' ? 'pendiente' : 'borrador') + '">' + esc(cmp.status) + '</span></div>' +
      '<div class="sl-kpis"><div class="stat"><span class="stat-label">Inversión</span><span class="stat-value" style="font-size:var(--fs-lg)">' + esc(money(cmp.spend, 'COP', true)) + '</span><span class="xs muted">de ' + esc(money(cmp.budget, 'COP', true)) + '</span></div><div class="stat"><span class="stat-label">Leads</span><span class="stat-value" style="font-size:var(--fs-lg)">' + cmp.leads + '</span></div><div class="stat"><span class="stat-label">CPL</span><span class="stat-value" style="font-size:var(--fs-lg)">' + esc(cmp.cpl ? money(cmp.cpl) : '—') + '</span></div><div class="stat"><span class="stat-label">ROAS est.</span><span class="stat-value" style="font-size:var(--fs-lg)">' + (roas ? roas.toFixed(1).replace('.', ',') + '×' : '—') + '</span></div></div>' +
      '<div class="progress"><span style="--value:' + Math.round(cmp.spend / cmp.budget * 100) + '%"></span></div>' +
      (cmp.cpl ? '<div class="sl-section"><h4>CPL semanal</h4>' + C.line(cplSeries(cmp), { labels: WEEKS, height: 140, fmt: function (v) { return money(v, 'COP', true); }, label: 'CPL semanal de ' + cmp.name }) + '</div>' : '') +
      '<div class="sl-section"><h4>Tope de presupuesto <span class="muted" id="slCapVal-' + cmp.id + '">' + esc(money(X['cap:' + cmp.id] || cmp.budget)) + '</span></h4><input class="sl-range" type="range" min="300000" max="6000000" step="100000" value="' + (X['cap:' + cmp.id] || cmp.budget) + '" data-change="sl.ads.cap" data-cmp="' + cmp.id + '" aria-label="Tope de presupuesto"' + (ro ? ' disabled' : '') + '><div class="xs muted">Llave pausa la campaña al llegar al tope y te avisa por WhatsApp.</div></div>' +
      '<div class="sl-section"><h4>Audiencias</h4><div class="sl-chips">' + X.audiences.map(function (a) { var on = (X['aud:' + cmp.id] || (cmp.audience.indexOf('EN') === 0 ? 'aud-expat' : cmp.audience.indexOf('Bogotá') >= 0 ? 'aud-bog' : 'aud-med')) === a.id; return '<button class="chip' + (on ? ' is-active' : '') + '" data-action="sl.ads.audience" data-cmp="' + cmp.id + '" data-aud="' + a.id + '" title="' + esc(a.note) + '">' + esc(a.name) + ' <span class="xs" style="opacity:.7">' + esc(a.size) + '</span></button>'; }).join('') + '</div><div class="xs muted">Actual: ' + esc(cmp.audience) + '</div></div>' +
      '<div class="sl-section"><h4>Variantes de copy <span class="badge badge-ai">AI · ' + vs.filter(function (v) { return v.status === 'pendiente'; }).length + ' por aprobar</span></h4>' + vs.map(function (v) {
        return '<div class="sl-variant' + (v.status === 'aprobada' ? ' is-approved' : '') + '"><div class="f"><span class="pill pill-ai">' + esc(v.hook) + '</span>' + (v.status === 'aprobada' ? '<span class="badge badge-success">Aprobada</span>' : badgeAI()) + '</div><div class="h">' + esc(v.head) + '</div><div class="b">' + esc(v.body) + '</div>' + (v.status === 'pendiente' && !ro ? '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="sl.ads.approveVariant" data-cmp="' + cmp.id + '" data-vid="' + v.id + '">Aprobar</button><button class="btn btn-ghost btn-sm" data-action="sl.ads.discardVariant" data-cmp="' + cmp.id + '" data-vid="' + v.id + '">Descartar</button></div>' : '') + '</div>';
      }).join('') + '</div></div>';
    L.openDrawer(html, { title: 'Campaña' });
    setTimeout(function () { var dr = document.querySelector('[data-drawer-cmp="' + cmp.id + '"]'); if (dr) bindCommon(dr, ctx); }, 0);
  }
  function creativeRequests(ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return (t.kind === 'creative' || t.kind === 'ads') && t.assignee === u.id && t.status !== 'listo'; });
    return '<div class="sl-section"><h4>Solicitudes de creativos <span class="muted">' + ts.length + '</span></h4>' + (ts.length ? '<div class="grid grid-auto" style="gap:var(--s-3)">' + ts.map(function (t) { return orderCard(t, ctx); }).join('') + '</div>' : '<p class="small muted">Sin solicitudes pendientes.</p>') + '</div>';
  }
  L.register('ads', {
    title: 'Ads', titleEs: 'Pauta', icon: 'megaphone',
    render: function (ctx) {
      CUR = ctx; var cmps = D.campaigns; var ro = readOnly(ctx);
      var act = cmps.filter(function (c) { return c.status === 'activa'; });
      var spend = cmps.reduce(function (a, c) { return a + c.spend; }, 0), leads = cmps.reduce(function (a, c) { return a + c.leads; }, 0), budget = cmps.reduce(function (a, c) { return a + c.budget; }, 0);
      var cpl = leads ? Math.round(spend / leads) : 0; var trend = blendedCpl(act);
      var pendingV = 0; cmps.forEach(function (c) { (X.variants[c.id] || []).forEach(function (v) { if (v.status === 'pendiente') pendingV++; }); });
      var right = (ro ? '' : '<button class="btn btn-primary" data-action="sl.ads.new">' + icon('plus') + ' Nueva campaña</button>');
      var html = '<div class="sl-stack">' + sectionHead('Pauta', 'Meta y Google desde el mismo lugar que el inventario: cada lead cae en el CRM con su campaña, y Llave propone copies que tú apruebas.', right);
      if (ctx.roleId === 'advertiser') html += creativeRequests(ctx);
      html += '<div class="grid grid-4" style="gap:var(--s-3)"><div class="card stat"><span class="stat-label">Inversión del mes</span><span class="stat-value">' + esc(money(spend, 'COP', true)) + '</span><span class="xs muted">de ' + esc(money(budget, 'COP', true)) + ' presupuestados</span></div><div class="card stat"><span class="stat-label">Leads</span><span class="stat-value">' + leads + '</span><span class="stat-delta up">+18 % vs agosto</span></div><div class="card stat"><span class="stat-label">CPL promedio</span><span class="stat-value">' + esc(money(cpl, 'COP', true)) + '</span><span class="stat-delta up">' + (trend.length ? '−' + Math.round((trend[0] - trend[trend.length - 1]) / trend[0] * 100) + ' % en 8 semanas' : '') + '</span></div><div class="card stat"><span class="stat-label">Copies AI por aprobar</span><span class="stat-value" style="color:var(--ai)">' + pendingV + '</span><span class="xs muted">en ' + cmps.length + ' campañas</span></div></div>' +
        '<div class="grid grid-3" style="gap:var(--s-4)"><div class="card span-2 sl-section"><h4>CPL combinado · campañas activas <span class="muted">COP por lead · 8 semanas</span></h4>' + C.line(trend, { labels: WEEKS, height: 180, fmt: function (v) { return money(v, 'COP', true); }, label: 'CPL combinado semanal' }) + '</div>' +
        '<div class="card sl-section"><h4>Audiencias guardadas</h4>' + X.audiences.map(function (a) { return '<div style="padding:6px 0;border-bottom:1px solid var(--border)"><b class="small">' + esc(a.name) + '</b><div class="xs muted">' + esc(a.size) + ' · ' + esc(a.note) + '</div></div>'; }).join('') + '<div class="xs muted">Se reutilizan al crear una campaña desde un inmueble.</div></div></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Campaña</th><th>Plataforma</th><th>Estado</th><th class="num">Inversión</th><th class="num">Leads</th><th class="num">CPL</th><th class="num">ROAS</th><th>Copies</th><th></th></tr></thead><tbody>' +
        cmps.map(function (c) {
          var l = c.listingId ? D.listing(c.listingId) : null; var vs = X.variants[c.id] || []; var pend = vs.filter(function (v) { return v.status === 'pendiente'; }).length;
          var roas = c.spend ? ((c.leads * 0.01 * (l ? (l.currency === 'USD' ? l.price * 4100 : l.price) * 0.03 : 30000000)) / c.spend) : 0;
          return '<tr><td><button class="sl-link" style="background:none;border:0;cursor:pointer;font:inherit;text-align:left" data-action="sl.ads.open" data-cmp="' + c.id + '">' + esc(c.name) + '</button><div class="xs muted">' + (l ? esc(l.title) : 'Marca') + ' · ' + esc(D.fmtDate(c.start, 'short')) + ' → ' + esc(D.fmtDate(c.end, 'short')) + '</div></td><td class="small">' + esc(c.platform) + '</td><td><span class="badge badge-status" data-status="' + (c.status === 'activa' ? 'activo' : c.status === 'pausada' ? 'pendiente' : 'borrador') + '">' + esc(c.status) + '</span></td><td class="num"><div class="money">' + esc(money(c.spend, 'COP', true)) + '</div><div class="progress" style="width:72px;margin-left:auto"><span style="--value:' + Math.round(c.spend / c.budget * 100) + '%"></span></div></td><td class="num">' + c.leads + '</td><td class="num">' + esc(c.cpl ? money(c.cpl, 'COP', true) : '—') + '</td><td class="num">' + (roas ? roas.toFixed(1).replace('.', ',') + '×' : '—') + '</td><td>' + (pend ? badgeAI(pend + ' por aprobar') : '<span class="badge badge-success">' + vs.length + ' aprobadas</span>') + '</td><td><div class="sl-table-actions">' + (ro ? '' : (c.status === 'activa' ? '<button class="btn btn-ghost btn-sm" data-action="sl.ads.pause" data-cmp="' + c.id + '">Pausar</button>' : '<button class="btn btn-ghost btn-sm" data-action="sl.ads.resume" data-cmp="' + c.id + '">Activar</button>')) + '<button class="btn btn-secondary btn-sm" data-action="sl.ads.open" data-cmp="' + c.id + '">Abrir</button></div></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      return html;
    },
    mount: function (el, ctx) { bindCommon(el, ctx); }
  });

  /* ================================================================== */
  /*  WIDGETS (home)                                                      */
  /* ================================================================== */
  var SHELL_LINKS = !!L.widgets; // real shell renders its own “Ver todo” link in the widget header
  function wfoot(ctx, mod, txt, right) { return '<div class="sl-wfoot">' + (SHELL_LINKS ? '<span class="muted">' + esc(txt || '') + '</span>' : '<a class="sl-link" href="' + route(ctx, mod) + '">' + esc(txt || 'Abrir') + ' →</a>') + (right ? '<span>' + right + '</span>' : '') + '</div>'; }
  function wrow(t, m, r, ai) { return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t">' + t + (ai ? ' ' + badgeAI('AI') : '') + '</div>' + (m ? '<div class="m">' + m + '</div>' : '') + '</div>' + (r ? '<div class="r">' + r + '</div>' : '') + '</div>'; }
  function taskRowsWithApprove(ts, ctx, limit) {
    return '<div class="sl-wlist">' + ts.slice(0, limit || 4).map(function (t) {
      var l = D.listing(t.listingId);
      return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + '</div><div class="m">' + (l ? esc(l.title) + ' · ' : '') + '<span class="sl-due ' + dueClass(t.due) + '">' + esc(dueLabel(t.due)) + '</span></div></div><div class="r row" style="gap:4px">' + (t.aiDrafted && t.status !== 'listo' ? '<button class="btn btn-primary btn-sm" data-action="sl.task.approve" data-tid="' + t.id + '">Aprobar</button>' : taskStatusBadge(t.status)) + '<button class="btn btn-ghost btn-sm btn-icon" data-action="sl.task.open" data-tid="' + t.id + '" aria-label="Abrir">' + icon('chevron-right') + '</button></div></div>';
    }).join('') + '</div>';
  }
  function W(id, title, size, link, fn) { L.registerWidget(id, { title: title, size: size, link: link, render: function (ctx) { CUR = ctx; return '<div class="sl-w">' + fn(ctx) + '</div>'; }, mount: function (el, ctx) { bindCommon(el, ctx); } }); }

  W('my-pipeline', 'Mi pipeline', 'md', 'crm-sell', function (ctx) {
    var u = ctxUser(ctx); var cs = D.contacts.filter(function (c) { return c.owner === u.id; });
    var val = cs.filter(function (c) { return c.pipeline === 'sell'; }).reduce(function (a, c) { return a + contactValue(c); }, 0);
    var stages = SELL_STAGES.map(function (s) { return cs.filter(function (c) { return c.pipeline === 'sell' && c.stage === s.id; }).length; });
    return '<div class="sl-big">' + esc(money(val, 'COP', true)) + '</div><div class="xs muted">' + cs.length + ' leads · ' + cs.filter(function (c) { return c.pipeline === 'get'; }).length + ' de captación</div>' + C.bars(stages, { labels: SELL_STAGES.map(function (s) { return s.label; }), height: 90, label: 'Leads por etapa' }) + wfoot(ctx, 'crm-sell', 'Ventas & arriendos', esc(cs.filter(contactIsAI).length) + ' seguimientos AI');
  });
  W('my-listings', 'Mis inmuebles', 'md', 'listings', function (ctx) {
    var u = ctxUser(ctx); var ls = D.listingsBy(u.id);
    return '<div class="sl-wlist">' + ls.slice(0, 5).map(function (l) { return '<div class="sl-wrow"><img src="' + esc(l.cover) + '" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:6px;flex:none"><div style="min-width:0;flex:1"><div class="t"><a class="sl-link" href="' + route(ctx, 'listings', l.id) + '">' + esc(l.title) + '</a></div><div class="m">' + esc(D.fmtPrice(l)) + ' · ' + l.leads + ' leads · ' + l.daysOnMarket + ' d</div></div><div class="r">' + badgeStatus(l.status) + '</div></div>'; }).join('') + '</div>' + wfoot(ctx, 'listings', ls.length + ' inmuebles');
  });
  W('hot-leads', 'Leads calientes', 'md', 'crm-sell', function (ctx) {
    var u = ctxUser(ctx); var cs = D.contacts.filter(function (c) { return (isStaffAll(ctx.roleId) || c.owner === u.id) && c.stage !== 'contrato' && c.stage !== 'firmado'; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4);
    return '<div class="sl-wlist">' + cs.map(function (c) { return '<div class="sl-wrow"><span class="sl-score"><i style="--v:' + c.score + '%"></i>' + c.score + '</span><div style="min-width:0;flex:1"><div class="t"><button class="sl-link" style="background:none;border:0;padding:0;font:inherit;cursor:pointer" data-action="sl.crm.open" data-cid="' + c.id + '">' + esc(c.name) + '</button></div><div class="m">' + esc(c.nextAction || '') + '</div></div>' + (contactIsAI(c) ? '<div class="r">' + badgeAI('AI') + '</div>' : '') + '</div>'; }).join('') + '</div>' + wfoot(ctx, 'crm-sell', 'Pipeline');
  });
  W('ai-followups', 'Seguimientos AI por aprobar', 'md', 'crm-sell', function (ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return t.aiDrafted && t.status === 'revisión' && (isStaffAll(ctx.roleId) || t.assignee === u.id); });
    var cs = D.contacts.filter(function (c) { return (isStaffAll(ctx.roleId) || c.owner === u.id) && /AI/.test(c.nextAction || '') && !X.approvals['draft:' + c.id]; });
    return '<div class="sl-wlist">' + cs.slice(0, 2).map(function (c) { return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t">' + esc(c.name) + ' ' + badgeAI('AI') + '</div><div class="m">' + esc(c.nextAction) + '</div></div><div class="r row" style="gap:4px"><button class="btn btn-primary btn-sm" data-action="sl.crm.approveDraft" data-cid="' + c.id + '">Aprobar</button><button class="btn btn-ghost btn-sm btn-icon" data-action="sl.crm.open" data-cid="' + c.id + '" aria-label="Abrir">' + icon('chevron-right') + '</button></div></div>'; }).join('') + '</div>' + taskRowsWithApprove(ts, ctx, 3) + (!ts.length && !cs.length ? '<p class="small muted">Todo aprobado. Llave te avisará cuando haya un nuevo borrador.</p>' : '') + wfoot(ctx, 'crm-sell', 'Ver pipeline', (ts.length + cs.length) + ' pendientes');
  });
  W('pipeline-board', 'Pipeline de inmuebles', 'lg', 'crm-sell', function (ctx) {
    var st = D.pipelineStages; var counts = st.map(function (s) { return D.listings.filter(function (l) { return l.stage === s.id; }).length; }); var mx = Math.max.apply(null, counts.concat([1]));
    return '<div class="sl-bars-inline">' + st.map(function (s, i) { return '<div><span>' + esc(s.label) + '</span><div class="progress"><span style="--value:' + Math.round(counts[i] / mx * 100) + '%"></span></div><b class="num">' + counts[i] + '</b></div>'; }).join('') + '</div>' + wfoot(ctx, 'crm-sell', 'Ventas & arriendos', D.listings.length + ' inmuebles · ' + esc(money(D.kpis.pipelineValueCOP, 'COP', true)) + ' en pipeline');
  });
  W('vendor-orders', 'Órdenes a proveedores', 'md', 'projects', function (ctx) {
    var ts = D.tasks.filter(function (t) { return KIND[t.kind] && t.status !== 'listo'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    return '<div class="sl-wlist">' + ts.slice(0, 5).map(function (t) { return '<div class="sl-wrow">' + avatar(t.assignee) + '<div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + (t.aiDrafted ? ' ' + badgeAI('AI') : '') + '</div><div class="m">' + esc(KIND[t.kind].label) + ' · <span class="sl-due ' + dueClass(t.due) + '">' + esc(dueLabel(t.due)) + '</span></div></div><div class="r">' + taskStatusBadge(t.status) + '</div></div>'; }).join('') + '</div>' + wfoot(ctx, 'projects', 'Proyectos', ts.length + ' abiertas');
  });
  W('publishing-queue', 'Cola de publicación', 'md', 'publishing', function (ctx) {
    var items = []; D.listings.forEach(function (l) { PORTALS.forEach(function (p) { var s = X.portal[l.id][p.id]; if (s === 'pendiente' || s === 'desactualizado') items.push({ l: l, p: p, s: s }); }); });
    return '<div class="sl-wlist">' + items.slice(0, 5).map(function (it) { return '<div class="sl-wrow"><button class="sl-pdot" data-pstate="' + it.s + '" data-action="sl.pub.cell" data-listing="' + it.l.id + '" data-portal="' + it.p.id + '" aria-label="' + esc(it.p.name) + '"><i></i></button><div style="min-width:0;flex:1"><div class="t">' + esc(it.l.title) + '</div><div class="m">' + esc(it.p.name) + ' · ' + esc(PORTAL_LABEL[it.s]) + '</div></div></div>'; }).join('') + '</div>' + (items.length ? '<button class="btn btn-primary btn-sm" data-action="sl.pub.only">' + icon('send') + ' Publicar solo donde haga falta (' + items.length + ')</button>' : '<p class="small muted">Todos los portales al día.</p>') + wfoot(ctx, 'publishing', 'Centro de publicación');
  });
  W('campaign-summary', 'Pauta del mes', 'md', 'ads', function (ctx) {
    var cs = D.campaigns; var spend = cs.reduce(function (a, c) { return a + c.spend; }, 0), leads = cs.reduce(function (a, c) { return a + c.leads; }, 0);
    return '<div class="row" style="align-items:flex-end;gap:var(--s-4)"><div><div class="sl-big">' + esc(money(spend, 'COP', true)) + '</div><div class="xs muted">' + leads + ' leads · CPL ' + esc(money(Math.round(spend / leads), 'COP', true)) + '</div></div>' + C.spark(blendedCpl(cs.filter(function (c) { return c.status === 'activa'; })), { w: 140, h: 40 }) + '</div><div class="sl-wlist">' + cs.filter(function (c) { return c.status === 'activa'; }).slice(0, 3).map(function (c) { return wrow(esc(c.name), esc(c.platform), c.leads + ' leads'); }).join('') + '</div>' + wfoot(ctx, 'ads', 'Pauta', 'CPL −' + Math.round(11) + ' % en 8 sem.');
  });
  W('campaigns-live', 'Campañas activas', 'md', 'ads', function (ctx) {
    var cs = D.campaigns.filter(function (c) { return c.status === 'activa'; });
    return '<div class="sl-wlist">' + cs.map(function (c) { return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t"><button class="sl-link" style="background:none;border:0;padding:0;font:inherit;cursor:pointer;text-align:left" data-action="sl.ads.open" data-cmp="' + c.id + '">' + esc(c.name) + '</button></div><div class="sl-progress-lbl"><span>' + esc(money(c.spend, 'COP', true)) + ' de ' + esc(money(c.budget, 'COP', true)) + '</span><span>' + c.leads + ' leads · CPL ' + esc(money(c.cpl, 'COP', true)) + '</span></div><div class="progress"><span style="--value:' + Math.round(c.spend / c.budget * 100) + '%"></span></div></div></div>'; }).join('') + '</div>' + wfoot(ctx, 'ads', 'Pauta', cs.length + ' activas · ' + D.campaigns.filter(function (c) { return c.status === 'borrador'; }).length + ' borrador');
  });
  W('creative-requests', 'Solicitudes de creativos', 'md', 'ads', function (ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return (t.kind === 'creative' || t.kind === 'ads') && t.assignee === u.id && t.status !== 'listo'; });
    return taskRowsWithApprove(ts, ctx, 4) + wfoot(ctx, 'ads', 'Ver todas', ts.length + ' abiertas');
  });
  W('cpl-trend', 'Tendencia CPL', 'md', 'ads', function (ctx) {
    var tr = blendedCpl(D.campaigns.filter(function (c) { return c.status === 'activa'; }));
    return C.line(tr, { labels: WEEKS, height: 130, fmt: function (v) { return money(v, 'COP', true); }, label: 'CPL combinado semanal' }) + wfoot(ctx, 'ads', 'Pauta', 'COP por lead · 8 semanas');
  });
  W('writeups-queue', 'Redacciones en cola', 'md', 'orders', function (ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return t.kind === 'writing' && t.assignee === u.id && t.status !== 'listo'; });
    return taskRowsWithApprove(ts, ctx, 4) + (ts.length ? '' : '<p class="small muted">Sin redacciones pendientes.</p>') + wfoot(ctx, 'orders', 'Órdenes', ts.length + ' en cola');
  });
  W('comps-requests', 'Comps solicitados', 'md', 'orders', function (ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return t.kind === 'research' && t.assignee === u.id; });
    return taskRowsWithApprove(ts, ctx, 4) + wfoot(ctx, 'orders', 'Órdenes', ts.filter(function (t) { return t.status !== 'listo'; }).length + ' abiertos');
  });
  W('ai-drafts-review', 'Borradores AI por revisar', 'md', 'orders', function (ctx) {
    var u = ctxUser(ctx); var ts = D.tasks.filter(function (t) { return t.aiDrafted && t.status === 'revisión' && (t.assignee === u.id || isStaffAll(ctx.roleId)); });
    return taskRowsWithApprove(ts, ctx, 4) + (ts.length ? '' : '<p class="small muted">Nada por revisar.</p>') + wfoot(ctx, 'orders', 'Órdenes', ts.length + ' borradores');
  });
  W('orders-open', 'Órdenes abiertas', 'md', 'orders', function (ctx) {
    var ts = myOrders(ctx).filter(function (t) { return t.status !== 'listo'; });
    return '<div class="sl-wlist">' + ts.slice(0, 4).map(function (t) { var l = D.listing(t.listingId); return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + '</div><div class="m">' + (l ? esc(l.city) + ' · ' : '') + '<span class="sl-due ' + dueClass(t.due) + '">' + esc(dueLabel(t.due)) + '</span> · ' + esc(money(orderAmount(t), 'COP', true)) + '</div></div><div class="r">' + (t.status === 'pendiente' ? '<button class="btn btn-primary btn-sm" data-action="sl.order.accept" data-tid="' + t.id + '">Aceptar</button>' : taskStatusBadge(t.status)) + '</div></div>'; }).join('') + '</div>' + wfoot(ctx, 'orders', 'Órdenes', esc(money(ts.reduce(function (a, t) { return a + orderAmount(t); }, 0), 'COP', true)) + ' por cobrar');
  });
  W('shoot-calendar', 'Agenda de sesiones', 'md', 'orders', function (ctx) {
    var ts = myOrders(ctx); var days = ['lun 14', 'mar 15', 'mié 16', 'jue 17', 'vie 18', 'sáb 19', 'dom 20']; var iso = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'];
    return '<div class="sl-week">' + days.map(function (d, i) { var has = ts.filter(function (t) { return t.due === iso[i]; }); return '<div class="' + (has.length ? 'has ' : '') + (iso[i] === '2026-09-16' ? 'today' : '') + '"><span>' + esc(d.split(' ')[0]) + '</span><b>' + d.split(' ')[1] + '</b>' + (has.length ? '<span>' + has.length + '</span>' : '<span>&nbsp;</span>') + '</div>'; }).join('') + '</div><div class="sl-wlist">' + ts.filter(function (t) { return t.status !== 'listo'; }).sort(function (a, b) { return a.due < b.due ? -1 : 1; }).slice(0, 3).map(function (t) { var l = D.listing(t.listingId); return wrow(esc(t.title), (l ? esc(l.city) + ' · ' : '') + esc(D.fmtDate(t.due, 'long')), t.order ? esc(t.order.pkg.split(':')[0]) : ''); }).join('') + '</div>' + wfoot(ctx, 'orders', 'Órdenes');
  });
  W('upload-inbox', 'Subir entregables', 'md', 'media', function (ctx) {
    var t = myOrders(ctx).filter(function (t) { return t.status === 'en curso'; })[0];
    return (t ? '<div class="xs muted">Orden en curso: <b>' + esc(t.title) + '</b></div>' + uploadZone(t) : '<p class="small muted">Acepta una orden para habilitar la subida.</p>') + wfoot(ctx, 'media', 'Fotos & video', X.uploads.length + ' archivos subidos');
  });
  W('quotes-requested', 'Cotizaciones solicitadas', 'md', 'orders', function (ctx) {
    var ts = D.tasks.filter(function (t) { return t.kind === 'construction'; });
    return '<div class="sl-wlist">' + ts.map(function (t) { var l = D.listing(t.listingId); var q = X.quotes[t.id]; return '<div class="sl-wrow"><div style="min-width:0;flex:1"><div class="t">' + esc(t.title) + '</div><div class="m">' + (l ? esc(l.title) + ' · ' : '') + esc(dueLabel(t.due)) + '</div></div><div class="r">' + (q ? '<b class="money">' + esc(money(q.amount, 'COP', true)) + '</b>' : '<button class="btn btn-primary btn-sm" data-action="sl.order.quote" data-tid="' + t.id + '">Cotizar</button>') + '</div></div>'; }).join('') + '</div>' + wfoot(ctx, 'orders', 'Órdenes', ts.length + ' solicitudes');
  });
  W('projects-active', 'Obras y remodelaciones', 'md', 'projects', function (ctx) {
    var ls = D.listings.filter(function (l) { return l.division === 'projects' || D.tasks.some(function (t) { return t.listingId === l.id && t.kind === 'construction'; }); });
    return '<div class="sl-wlist">' + ls.map(function (l) { var s = seed(l.id) % 60 + 20; return '<div class="sl-wrow"><img src="' + esc(l.cover) + '" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:6px;flex:none"><div style="min-width:0;flex:1"><div class="t">' + esc(l.title) + '</div><div class="sl-progress-lbl"><span>' + esc(l.city) + '</span><span>' + s + ' %</span></div><div class="progress"><span style="--value:' + s + '%"></span></div></div></div>'; }).join('') + '</div>' + wfoot(ctx, 'projects', 'Proyectos', ls.length + ' activos');
  });
  W('site-visits', 'Visitas de obra', 'md', 'projects', function (ctx) {
    var ts = D.tasks.filter(function (t) { return t.kind === 'construction'; }).concat(D.listings.filter(function (l) { return l.division === 'projects'; }).map(function (l) { return { title: 'Visita de seguimiento · ' + l.title, listingId: l.id, due: '2026-09-18', status: 'en curso' }; }));
    return '<div class="sl-wlist">' + ts.map(function (t) { var l = D.listing(t.listingId); return wrow(esc(t.title), (l ? esc(l.city) + ' · ' : '') + esc(D.fmtDate(t.due, 'long')), '<span class="sl-due ' + dueClass(t.due) + '">' + esc(dueLabel(t.due)) + '</span>'); }).join('') + '</div>' + wfoot(ctx, 'projects', 'Proyectos');
  });

  /* ================================================================== */
  /*  ACTIONS                                                             */
  /* ================================================================== */
  var ACT = {};
  function act(name, fn) { ACT[name] = fn; if (typeof L.action === 'function') L.action(name, fn); }
  function nextId(coll, prefix) { var n = coll.length + 1, id; do { id = prefix + String(n).padStart(3, '0'); n++; } while (D.byId(coll, id)); return id; }
  function closeModal() { if (L.closeModal) L.closeModal(); }
  function closeDrawer() { if (L.closeDrawer) L.closeDrawer(); }
  function openModal(html, opts) { if (L.openModal) L.openModal(html, opts); }
  function reopenContact(cid) { if (document.querySelector('[data-drawer-contact="' + cid + '"]')) openContact(cid, CUR); }
  function reopenTask(tid) { if (document.querySelector('[data-drawer-task="' + tid + '"]')) { var t = D.byId(D.tasks, tid); L.openDrawer(taskDrawer(t, CUR), { title: 'Orden' }); } }
  function log(lid, pid, action, ai) { X.publishLog.unshift({ at: '2026-09-16T' + new Date().toTimeString().slice(0, 8) + '-05:00', listingId: lid, portal: pid, action: action, by: ctxUser(CUR).id, ai: !!ai }); }

  // listings
  act('sl.listings.view', function (d) { S.listings.view = d.value; rerender(); });
  act('sl.listings.f', function (d, el) { S.listings.f[d.key] = el.value; rerender(); });
  act('sl.listings.clear', function () { S.listings.f = { op: '', type: '', zona: '', estado: '', agente: '' }; rerender(); });
  act('sl.listings.all', function (d, el) { S.listings.all = !!el.checked; rerender(); });
  act('sl.listings.new', function () { openModal(newListingModal(CUR), { title: 'Nuevo inmueble', wide: true }); });
  act('sl.listings.edit', function (d) { var l = D.listing(d.id); if (l) openModal(newListingModal(CUR, l), { title: 'Editar inmueble', wide: true }); });
  act('sl.listings.save', function (d, form) {
    var f = new FormData(form); var g = function (k) { return f.get(k); }; var n = function (k) { var v = parseFloat(g(k)); return isNaN(v) ? 0 : v; };
    var l = d.id ? D.listing(d.id) : null; var isNew = !l;
    if (isNew) { var id = nextId(D.listings, 'lst-'); l = { id: id, slug: id, currency: 'COP', region: 'Antioquia', status: 'borrador', stage: 'captacion', daysOnMarket: 0, views: 0, leads: 0, division: 'real-estate', amenities: [], featured: false, syndication: { fincaRaiz: false, wasi: false, metrocuadrado: false, instagram: false }, cover: 'https://picsum.photos/seed/' + id + '/800/600', images: [1, 2, 3].map(function (i) { return { file: id + '-0' + i + '.jpg', url: 'https://picsum.photos/seed/' + id + i + '/1200/800', aiTags: ['exterior', 'sala', 'cocina'][i - 1], quality: 0.8, approved: false }; }) }; }
    l.title = g('title'); l.operacion = g('operacion'); l.type = g('type'); l.price = n('price'); l.administracion = n('administracion'); l.city = g('city'); l.barrio = g('barrio'); l.area = n('area') || null; l.areaLote = n('areaLote') || null; l.habitaciones = n('habitaciones'); l.banos = n('banos'); l.parqueaderos = n('parqueaderos'); l.estrato = g('estrato') ? parseInt(g('estrato'), 10) : null; l.ano = n('ano') || null; l.listedBy = g('listedBy');
    l.description = g('description') || ('Borrador AI: ' + D.typeLabel(l.type) + ' en ' + l.city + (l.barrio ? ', ' + l.barrio : '') + '. ' + (l.area ? D.fmtM2(l.area) + ' construidos. ' : '') + 'Llave completará la redacción con las fotos y los comps del proyecto.');
    if (isNew) {
      D.listings.push(l); X.portal[l.id] = {}; PORTALS.forEach(function (p) { X.portal[l.id][p.id] = p.id === 'instagram' ? 'no aplica' : 'pendiente'; });
      if (g('tpl')) createOrdersFromTemplate(l.id, l.operacion === 'arriendo' ? 'tpl-arriendo' : (l.type === 'finca' || l.type === 'lote') ? 'tpl-finca' : 'tpl-venta', '2026-09-17', {});
      closeModal(); toast('Inmueble creado', l.title + ' guardado como borrador' + (g('tpl') ? ' · proyecto de producción creado con plantilla' : ''), 'success');
      if (L.navigate) L.navigate(CUR.roleId, 'listings', l.id); else rerender();
    } else { closeModal(); toast('Cambios guardados', l.title, 'success'); rerender(); }
  });
  act('sl.modal.close', function () { closeModal(); });
  act('sl.ai.approveCopy', function (d) { var l = D.listing(d.id); if (!l) return; var extra = pick(['Amanece con el embalse en la ventana y termina el día en el muelle: una casa para vivir, o un activo productivo bajo administración Dorum Lifestyle.', 'A minutos del aeropuerto JMC y del Oriente que más se valoriza en Antioquia; ficha bilingüe lista para compradores internacionales.', 'Diseño que respira: luz natural, materiales locales y una propuesta de bienestar coherente con el sello Dorum.'], seed(l.id)); if (l.description.indexOf(extra) < 0) l.description += ' ' + extra; X.approvals['copy:' + l.id] = ctxUser(CUR).id; PORTALS.forEach(function (p) { if (X.portal[l.id][p.id] === 'publicado' && p.id !== 'sitio') X.portal[l.id][p.id] = 'desactualizado'; }); toast('Redacción aprobada', 'Texto actualizado en Llave · portales marcados para sincronizar', 'success'); rerender(); });
  act('sl.ai.editCopy', function (d, el) { var body = el.closest('.ai-suggest').querySelector('.ai-suggest-body'); body.contentEditable = 'true'; body.focus(); toast('Edita el texto', 'Cuando termines, pulsa “Aprobar redacción”.', 'ai'); });
  act('sl.ai.discard', function (d, el) { var box = el.closest('.ai-suggest'); if (box) box.remove(); toast('Borrador descartado', 'Llave no volverá a sugerir esta ' + (d.what || 'propuesta') + ' hoy.'); });
  act('sl.ai.applyPrice', function (d) { var l = D.listing(d.id); if (!l) return; var old = l.price; l.price = parseInt(d.price, 10); PORTALS.forEach(function (p) { if (X.portal[l.id][p.id] === 'publicado' && p.id !== 'sitio') X.portal[l.id][p.id] = 'desactualizado'; }); log(l.id, 'sitio', 'Precio ' + money(old, l.currency, true) + ' → ' + money(l.price, l.currency, true), true); toast('Precio actualizado', money(old, l.currency) + ' → ' + money(l.price, l.currency) + ' · portales pendientes de sincronizar', 'success'); rerender(); });

  // publishing
  act('sl.pub.cell', function (d) { pubCellDrawer(d.listing, d.portal, CUR); });
  act('sl.pub.toggle', function (d, el) { var s = X.portal[d.listing]; if (!s) return; var p = PORTALS.filter(function (x) { return x.id === d.portal; })[0]; if (el.checked) { s[d.portal] = 'publicado'; log(d.listing, d.portal, 'Publicado', true); toast('Publicado en ' + p.name, D.listing(d.listing).title, 'success'); } else { s[d.portal] = 'pendiente'; log(d.listing, d.portal, 'Retirado', false); toast('Retirado de ' + p.name, D.listing(d.listing).title); } rerender(); });
  act('sl.pub.publish', function (d) { X.portal[d.listing][d.portal] = 'publicado'; log(d.listing, d.portal, 'Publicado', true); closeDrawer(); toast('Publicado', D.listing(d.listing).title + ' → ' + PORTALS.filter(function (x) { return x.id === d.portal; })[0].name, 'success'); rerender(); });
  act('sl.pub.unpublish', function (d) { X.portal[d.listing][d.portal] = 'pendiente'; log(d.listing, d.portal, 'Retirado', false); closeDrawer(); toast('Retirado del portal', D.listing(d.listing).title); rerender(); });
  act('sl.pub.only', function (d) {
    var n = 0, ls = d.listing ? [D.listing(d.listing)] : visibleListings(CUR);
    ls.forEach(function (l) { PORTALS.forEach(function (p) { var s = X.portal[l.id][p.id]; if (s === 'pendiente' || s === 'desactualizado') { X.portal[l.id][p.id] = 'publicado'; log(l.id, p.id, s === 'desactualizado' ? 'Sincronizado (precio/fotos)' : 'Publicado', true); n++; } }); });
    closeDrawer(); toast(n ? 'Publicado en ' + n + ' destino' + (n > 1 ? 's' : '') : 'Nada pendiente', n ? 'Solo se enviaron los cambios que faltaban. Llave sigue siendo la fuente de verdad.' : 'Todos los portales ya estaban al día.', 'success'); rerender();
  });
  act('sl.pub.onlyPending', function (d, el) { S.publishing.onlyPending = !!el.checked; rerender(); });

  // crm
  act('sl.crm.open', function (d) { openContact(d.cid, CUR); });
  act('sl.crm.view', function (d) { (d.pipeline === 'get' ? S.crmGet : S.crmSell).view = d.value; rerender(); });
  act('sl.crm.all', function (d, el) { (d.pipeline === 'get' ? S.crmGet : S.crmSell).all = !!el.checked; rerender(); });
  act('sl.crm.openhouse', function (d, el) { X.openHouse = !!el.checked; toast(X.openHouse ? 'Open house activo' : 'Open house cerrado', X.openHouse ? 'Registra visitantes; Llave califica y agenda el seguimiento.' : 'Los visitantes registrados ya están en el pipeline.'); rerender(); });
  act('sl.crm.stage', function (d, el) { var c = D.byId(D.contacts, d.cid); if (!c) return; c.stage = el.value; var st = (c.pipeline === 'get' ? GET_STAGES : SELL_STAGES).filter(function (s) { return s.id === c.stage; })[0]; toast('Etapa actualizada', c.name + ' → ' + (st ? st.label : c.stage), 'success'); rerender(); });
  act('sl.crm.move', function (d) { var c = D.byId(D.contacts, d.cid); if (!c || c.stage === d.stage) return; c.stage = d.stage; var st = (c.pipeline === 'get' ? GET_STAGES : SELL_STAGES).filter(function (s) { return s.id === c.stage; })[0]; pushActivity(c.id, 'Origen', 'Movido a ' + (st ? st.label : d.stage), ctxUser(CUR).id); toast('Etapa actualizada', c.name + ' → ' + (st ? st.label : d.stage), 'success'); rerender(); });
  act('sl.crm.schedule', function (d) { var c = D.byId(D.contacts, d.cid); if (!c) return; X.visits = X.visits.filter(function (v) { return v.contactId !== c.id; }); X.visits.push({ contactId: c.id, slot: d.slot, kind: d.kind }); c.nextAction = (d.kind === 'tour' ? 'Tour' : 'Visita de captación') + ' · ' + d.slot; if (c.pipeline === 'get' && ['nuevo', 'contactado'].indexOf(c.stage) >= 0) c.stage = 'visita'; if (c.pipeline === 'sell' && ['nuevo', 'calificado'].indexOf(c.stage) >= 0) c.stage = 'tour'; pushActivity(c.id, 'Visita', c.nextAction + ' · invitación enviada por WhatsApp', ctxUser(CUR).id, true); toast('Visita agendada', c.name + ' · ' + d.slot + ' · agenda bloqueada e invitación enviada', 'success'); reopenContact(c.id); rerender(); });
  act('sl.crm.approveDraft', function (d) { var c = D.byId(D.contacts, d.cid); if (!c) return; var u = ctxUser(CUR); var body = document.getElementById('slDraft-' + c.id); var text = body ? body.textContent : firstTouchDraft(c); X['draftText:' + c.id] = text; X.approvals['draft:' + c.id] = u.id; pushActivity(c.id, 'WhatsApp', 'Enviado: “' + text.slice(0, 70) + '…”', u.id, true); c.lastTouch = '2026-09-16'; if (c.stage === 'nuevo') c.stage = 'contactado'; c.nextAction = 'Esperar respuesta · Llave insiste en 48 h'; toast('Mensaje aprobado y enviado', c.name + ' · ' + (c.lang === 'en' ? 'inglés' : 'español') + ' · registrado en el CRM', 'success'); reopenContact(c.id); rerender(); });
  act('sl.crm.editDraft', function (d, el) { var box = el.closest('.ai-suggest'); var body = box && box.querySelector('.ai-suggest-body'); if (body) { body.contentEditable = 'true'; body.focus(); } toast('Edita el borrador', 'Pulsa “Aprobar y enviar” cuando esté listo.', 'ai'); });
  act('sl.crm.discardDraft', function (d, el) { var c = D.byId(D.contacts, d.cid); var box = el.closest('.ai-suggest'); if (box) box.remove(); if (c) { c.nextAction = 'Contacto manual'; } toast('Borrador descartado', 'Llave aprenderá de tu versión cuando la envíes.'); rerender(); });
  act('sl.crm.contract', function (d) { var c = D.byId(D.contacts, d.cid); if (!c) return; var id = nextId(D.contracts, 'k-'); var isRent = c.kind === 'landlord'; D.contracts.push({ id: id, type: 'Acuerdo de corretaje · ' + (isRent ? 'arriendo' : 'venta'), dealId: null, listingId: (c.interest || [])[0] || null, contactId: c.id, version: 1, redlines: 0, status: 'borrador', aiDrafted: true, lawyerApproved: false, signers: [{ name: c.name, status: 'pendiente' }, { userId: 'u-owner', status: 'pendiente' }], updated: '2026-09-16', clauses: isRent ? 16 : 14, exclusive: true, termMonths: isRent ? 24 : 6, note: 'Comisión ' + (isRent ? D.tenant.commissionDefaults.rentalMgmtPct + ' % mensual' : D.tenant.commissionDefaults.saleUrbanPct + ' % + IVA') + ' · ' + (c.propertyHint || 'inmueble por definir') }); (X.contractsFor = X.contractsFor || {})[c.id] = id; if (['nuevo', 'contactado', 'visita'].indexOf(c.stage) >= 0) c.stage = 'propuesta'; c.nextAction = 'Acuerdo de corretaje enviado a revisión legal'; pushActivity(c.id, 'Contrato', 'Acuerdo de corretaje ' + id + ' redactado por Llave · a revisión de ' + D.userName('u-lawyer'), ctxUser(CUR).id, true); toast('Acuerdo de corretaje creado', id + ' · borrador AI enviado a ' + D.userName('u-lawyer') + ' para revisión', 'ai'); reopenContact(c.id); rerender(); });
  act('sl.crm.approveCounter', function (d) { var u = ctxUser(CUR); var t = d.task ? D.byId(D.tasks, d.task) : null; var k = d.contract ? D.byId(D.contracts, d.contract) : null; var deal = D.byId(D.deals, d.deal); if (t) { t.status = 'listo'; X.approvals[t.id] = u.id; } if (k) { k.status = 'enviado'; k.signers.forEach(function (s) { if (s.status === 'pendiente') s.status = 'enviado'; }); } if (deal) deal.timeline.forEach(function (x) { if (x.current) { x.done = true; x.label = x.label.replace(' (AI borrador · aprobar)', ' · enviada'); } }); pushActivity(d.cid, 'Correo', 'Contraoferta enviada' + (k ? ' · ' + k.id : ''), u.id, true); toast('Contraoferta aprobada y enviada', 'Firmada electrónicamente por ' + u.name + ' · registrada en el expediente', 'success'); reopenContact(d.cid); rerender(); });
  act('sl.crm.lender', function (d) { var c = D.byId(D.contacts, d.cid); if (!c) return; var id = nextId(D.tasks, 't-'); D.tasks.push({ id: id, listingId: (c.interest || [])[0] || null, contactId: c.id, title: 'Referido crédito hipotecario · ' + c.name, assignee: 'u-lender', due: '2026-09-19', status: 'pendiente', aiDrafted: true, kind: 'referral', note: 'Pre-aprobación estimada ' + money(Math.round((c.budget || 0) * 0.7), c.currency, true) + ' · Llave preparó el expediente (cédula, ingresos, inmueble).' }); pushActivity(c.id, 'Referido', 'Referido a ' + D.userName('u-lender') + ' (' + D.user('u-lender').title + ')', ctxUser(CUR).id, true); toast('Referido al banco', D.userName('u-lender') + ' recibió la tarea con el expediente del comprador', 'success'); reopenContact(c.id); rerender(); });
  act('sl.crm.new', function (d) { var get = d.pipeline === 'get'; openModal('<form class="sl-form-grid" data-submit="sl.crm.create" data-pipeline="' + d.pipeline + '"><label class="field span-2"><span class="label">Nombre</span><input class="input" name="name" required placeholder="Nombre y apellido"></label><label class="field"><span class="label">Tipo</span><select class="select" name="kind">' + (get ? '<option value="seller">Vendedor</option><option value="landlord">Arrendador</option>' : '<option value="buyer">Comprador</option><option value="renter">Arrendatario</option>') + '</select></label><label class="field"><span class="label">Fuente</span><select class="select" name="source"><option>WhatsApp</option><option>Instagram</option><option>Finca Raíz</option><option>Referido</option><option>Website</option><option>Meta Ads</option></select></label>' + (get ? '<label class="field span-2"><span class="label">Inmueble que quiere vender / arrendar</span><input class="input" name="hint" placeholder="Apartamento 120 m² en Laureles"></label>' : '<label class="field"><span class="label">Presupuesto (COP)</span><input class="input" name="budget" type="number" step="10000000" placeholder="1200000000"></label><label class="field"><span class="label">Inmueble de interés</span><select class="select" name="interest"><option value="">—</option>' + D.listings.filter(function (l) { return l.status === 'activo'; }).map(function (l) { return '<option value="' + l.id + '">' + esc(l.title) + '</option>'; }).join('') + '</select></label>') + '<label class="field"><span class="label">Ciudad</span><input class="input" name="city" value="Medellín"></label><label class="field"><span class="label">Idioma</span><select class="select" name="lang"><option value="es">Español</option><option value="en">Inglés</option></select></label><div class="span-2 sl-check"><input type="checkbox" name="ai" checked><div><div class="b">Llave redacta el primer contacto</div><div class="m">Queda en tu cola de aprobación; nada se envía sin ti.</div></div></div><div class="span-2 modal-footer" style="padding-top:0"><button type="button" class="btn btn-ghost" data-action="sl.modal.close">Cancelar</button><button type="submit" class="btn btn-primary">Crear lead</button></div></form>', { title: get ? 'Nuevo lead de captación' : 'Nuevo lead' }); });
  act('sl.crm.create', function (d, form) { var f = new FormData(form); var u = ctxUser(CUR); var id = nextId(D.contacts, 'c-'); var c = { id: id, name: f.get('name'), kind: f.get('kind'), pipeline: d.pipeline, stage: 'nuevo', source: f.get('source'), interest: f.get('interest') ? [f.get('interest')] : [], propertyHint: f.get('hint') || undefined, budget: parseFloat(f.get('budget')) || undefined, city: f.get('city') || 'Medellín', owner: u.role === 'broker' || u.role === 'rental_admin' ? u.id : 'u-brk-1', lastTouch: '2026-09-16', nextAction: f.get('ai') ? 'Primer contacto (AI borrador)' : 'Llamar', score: 50 + (seed(id) % 25), lang: f.get('lang'), whatsapp: true }; D.contacts.push(c); X.activity[c.id] = [{ at: '2026-09-16', kind: 'Origen', title: 'Lead creado desde ' + c.source, by: u.id }]; closeModal(); toast('Lead creado', c.name + (f.get('ai') ? ' · borrador de primer contacto listo para aprobar' : ''), f.get('ai') ? 'ai' : 'success'); rerender(); });
  act('sl.crm.quickvisitor', function (d, form) { var f = new FormData(form); var u = ctxUser(CUR); var id = nextId(D.contacts, 'c-'); var l = D.listing(f.get('listing')); var c = { id: id, name: f.get('name'), kind: 'buyer', pipeline: 'sell', stage: 'nuevo', source: 'Website', interest: l ? [l.id] : [], budget: l ? Math.round(l.price * 1.05) : undefined, city: l ? l.city : 'Medellín', owner: u.role === 'broker' ? u.id : (l ? l.listedBy : 'u-brk-1'), lastTouch: '2026-09-16', nextAction: 'Primer contacto (AI borrador) · agradecer visita open house', score: 55, lang: 'es', whatsapp: true }; D.contacts.push(c); X.activity[c.id] = [{ at: '2026-09-16', kind: 'Visita', title: 'Visitó open house · ' + (l ? l.title : ''), by: u.id }]; form.reset(); toast('Visitante registrado', c.name + ' · Llave redactó el agradecimiento para aprobar', 'ai'); rerender(); });

  // tasks / orders
  act('sl.task.open', function (d) { var t = D.byId(D.tasks, d.tid); if (t) L.openDrawer(taskDrawer(t, CUR), { title: 'Orden' }); });
  act('sl.task.approve', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; var u = ctxUser(CUR); t.status = 'listo'; X.approvals[t.id] = u.id; t.approvedBy = u.id; D.tasks.forEach(function (o) { if (o.status === 'bloqueado' && o.note && o.note.indexOf(t.id) >= 0) { o.status = 'pendiente'; o.note = 'Desbloqueado: ' + t.title.split(' · ')[0] + ' listo.'; } }); toast('Aprobado', t.title + ' · por ' + u.name, 'success'); reopenTask(t.id); rerender(); });
  act('sl.task.edit', function (d, el) { var box = el.closest('.ai-suggest'); var body = box && box.querySelector('.ai-suggest-body'); if (body) { body.contentEditable = 'true'; body.focus(); } toast('Edita el entregable', 'Pulsa “Aprobar” al terminar.', 'ai'); });
  act('sl.task.reject', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; t.status = 'en curso'; t.note = 'Cambios solicitados por ' + ctxUser(CUR).name.split(' ')[0] + ' · Llave regenerará con tus notas.'; toast('Cambios solicitados', t.title); closeDrawer(); rerender(); });
  act('sl.order.accept', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; t.status = 'en curso'; t.acceptedAt = '2026-09-16'; toast('Orden aceptada', t.title + ' · entrega ' + D.fmtDate(t.due), 'success'); reopenTask(t.id); rerender(); });
  act('sl.order.decline', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; t.note = 'Rechazada por el proveedor · Dorum reasignará.'; toast('Orden rechazada', 'Avisamos a ' + D.userName('u-sadmin') + ' para reasignar.', 'danger'); closeDrawer(); rerender(); });
  act('sl.order.upload', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) { toast('Sin orden en curso', 'Acepta una orden para subir entregables.'); return; } var l = D.listing(t.listingId); var n = X.uploads.filter(function (u) { return u.taskId === t.id; }).length; var names = t.kind === 'photography' ? ['DJI_0' + (412 + n) + '.jpg', 'IMG_' + (7731 + n) + '.jpg', 'IMG_' + (7732 + n) + '.jpg'] : t.kind === 'writing' || t.kind === 'research' ? ['ficha-' + (l ? l.slug : 'inmueble') + '-v' + (n + 1) + '.docx'] : t.kind === 'construction' ? ['cotizacion-' + (n + 1) + '.pdf'] : ['reel-v' + (n + 1) + '.mp4']; names.forEach(function (nm) { X.uploads.push({ taskId: t.id, name: nm, at: '2026-09-16' }); }); if (l && t.kind === 'photography') names.forEach(function (nm, i) { l.images.push({ file: nm, url: 'https://picsum.photos/seed/' + l.slug + 'up' + (n + i) + '/1200/800', aiTags: ['vista al embalse', 'exterior', 'terraza'][i % 3], quality: 0.86 + i / 100, approved: false }); }); toast('Subida completa', names.length + ' archivo(s) guardados en ' + (l ? l.title : 'el inmueble') + ' · etiquetados por AI', 'ai'); reopenTask(t.id); rerender(); });
  act('sl.order.deliver', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; var n = X.uploads.filter(function (u) { return u.taskId === t.id; }).length; t.status = 'revisión'; t.note = (n || 'Entregables') + (n ? ' archivos entregados' : ' marcados como listos') + ' · esperando aprobación de Dorum.'; toast('Entregado', t.title + ' pasó a revisión · pago a 8 días de la aprobación', 'success'); closeDrawer(); rerender(); });
  act('sl.order.quote', function (d) { var t = D.byId(D.tasks, d.tid); if (!t) return; openModal('<form class="sl-stack" data-submit="sl.order.saveQuote" data-tid="' + t.id + '" style="gap:var(--s-3)"><p class="small muted">' + esc(t.title) + '</p><label class="field"><span class="label">Valor (COP, sin IVA)</span><input class="input" name="amount" type="number" step="500000" required value="48000000"></label><label class="field"><span class="label">Plazo (días)</span><input class="input" name="days" type="number" required value="45"></label><label class="field"><span class="label">Alcance</span><textarea class="textarea" name="note">Restauración del beneficiadero como glamping (3 unidades), materiales locales, criterio patrimonial.</textarea></label><div class="modal-footer" style="padding-top:0"><button type="button" class="btn btn-ghost" data-action="sl.modal.close">Cancelar</button><button type="submit" class="btn btn-primary">Enviar cotización</button></div></form>', { title: 'Cotización' }); });
  act('sl.order.saveQuote', function (d, form) { var f = new FormData(form); var t = D.byId(D.tasks, d.tid); if (!t) return; X.quotes[t.id] = { amount: parseFloat(f.get('amount')) || 0, days: parseInt(f.get('days'), 10) || 0, note: f.get('note') }; t.status = 'revisión'; t.note = 'Cotización ' + money(X.quotes[t.id].amount) + ' · ' + X.quotes[t.id].days + ' días · esperando aprobación.'; closeModal(); toast('Cotización enviada', money(X.quotes[t.id].amount) + ' · ' + D.userName('u-owner') + ' la revisará', 'success'); rerender(); });

  // projects
  act('sl.projects.view', function (d) { S.projects.view = d.value; rerender(); });
  act('sl.projects.listing', function (d, el) { S.projects.listing = el.value; rerender(); });
  act('sl.projects.order', function (d) { openModal(orderModal(CUR, d.tpl, d.listing || S.projects.listing), { title: 'Ordenar paquete de producción', wide: true }); });
  function createOrdersFromTemplate(listingId, tplId, start, assignees) {
    var tpl = TEMPLATES.filter(function (t) { return t.id === tplId; })[0] || TEMPLATES[0]; var l = D.listing(listingId); var made = [];
    var offset = 0;
    tpl.kinds.forEach(function (k) {
      var K = KIND[k]; var vs = D.usersByRole(K.vendorRole); var who = assignees[k] || (vs[0] && vs[0].id);
      if (D.tasks.some(function (t) { return t.listingId === listingId && t.kind === k && t.status !== 'listo'; })) return;
      var id = nextId(D.tasks, 't-'); offset += k === 'photography' ? 0 : 1;
      var aiK = k === 'writing' || k === 'research' || k === 'ads';
      D.tasks.push({ id: id, listingId: listingId, title: K.label.replace(' (opcional)', '') + ' · ' + (l ? l.title.split(' · ')[0] : ''), assignee: who, due: addDays(start, K.days + offset), status: 'pendiente', aiDrafted: aiK, kind: k, optional: !!K.optional, order: K.price ? { amount: K.price, pkg: tpl.name.replace('Plantilla: ', '') } : undefined, note: aiK ? 'Llave preparará el borrador cuando lleguen las fotos.' : undefined });
      made.push(id);
    });
    if (l && l.status === 'borrador') { l.status = 'en preparación'; l.stage = 'preparacion'; }
    return made;
  }
  act('sl.projects.createOrders', function (d, form) { var f = new FormData(form); var lid = f.get('listing'); var kinds = f.getAll('kind'); var assignees = {}; kinds.forEach(function (k) { assignees[k] = f.get('assignee-' + k); }); var tpl = TEMPLATES.filter(function (t) { return t.id === d.tpl; })[0]; var custom = { id: 'custom', name: tpl ? tpl.name : 'Paquete', kinds: kinds }; TEMPLATES.push(custom); var made = createOrdersFromTemplate(lid, 'custom', f.get('start') || '2026-09-17', assignees); TEMPLATES.pop(); closeModal(); S.projects.listing = lid; toast(made.length ? made.length + ' órdenes creadas' : 'Sin órdenes nuevas', made.length ? 'Proveedores notificados por WhatsApp · entregables AI irán a tu cola de aprobación' : 'Ya existían órdenes abiertas de esos tipos.', made.length ? 'success' : undefined); if (L.navigate && CUR.module !== 'projects') L.navigate(CUR.roleId, 'projects', lid); else rerender(); });

  // media
  act('sl.media.wm', function (d, el) { X.watermark = !!el.checked; document.querySelectorAll('.sl-masonry').forEach(function (m) { m.classList.toggle('sl-wm', X.watermark); }); toast(X.watermark ? 'Marca de agua activa' : 'Marca de agua desactivada', 'Se aplica al exportar a portales y redes; los originales no cambian.'); });
  act('sl.media.listing', function (d, el) { S.media.listing = el.value; rerender(); });
  act('sl.media.tag', function (d) { S.media.tag = d.tag || ''; rerender(); });
  act('sl.media.select', function (d) { X.mediaSel[d.file] = !X.mediaSel[d.file]; rerender(); });
  act('sl.media.best', function () { var ls = mediaListings(CUR); var all = []; ls.forEach(function (l) { if (!S.media.listing || l.id === S.media.listing) l.images.forEach(function (im) { all.push(im); }); }); all.sort(function (a, b) { return b.quality - a.quality; }); X.mediaSel = {}; all.slice(0, 20).forEach(function (im) { X.mediaSel[im.file] = true; }); toast('Selección AI lista', Math.min(20, all.length) + ' imágenes elegidas por nitidez, luz y variedad de espacios · revisa y ajusta', 'ai'); rerender(); });
  act('sl.media.sendWriter', function () { var ls = mediaListings(CUR); var groups = {}; ls.forEach(function (l) { l.images.forEach(function (im) { if (X.mediaSel[im.file]) (groups[l.id] = groups[l.id] || []).push(im); }); }); var n = 0; Object.keys(groups).forEach(function (lid) { var l = D.listing(lid); var t = D.tasks.filter(function (t) { return t.listingId === lid && t.kind === 'writing' && t.status !== 'listo'; })[0]; if (t) { t.note = groups[lid].length + ' fotos seleccionadas adjuntas · ' + (t.note || ''); } else { D.tasks.push({ id: nextId(D.tasks, 't-'), listingId: lid, title: 'Redacción ES/EN · ' + l.title.split(' · ')[0], assignee: 'u-writer', due: '2026-09-20', status: 'pendiente', aiDrafted: true, kind: 'writing', note: groups[lid].length + ' fotos seleccionadas adjuntas · Llave prepara el borrador.' }); } n++; }); X.mediaSel = {}; toast('Enviado al redactor', n + ' inmueble(s) · ' + D.userName('u-writer') + ' recibió las fotos con etiquetas AI', 'success'); rerender(); });
  act('sl.media.reorder', function (d) { var l = D.listing(d.listing); if (!l) return; var ord = orderedImages(l).map(function (i) { return i.file; }); var from = ord.indexOf(d.from), to = ord.indexOf(d.to); if (from < 0 || to < 0) return; ord.splice(to, 0, ord.splice(from, 1)[0]); X.mediaOrder[l.id] = ord; PORTALS.forEach(function (p) { if (X.portal[l.id][p.id] === 'publicado' && p.id !== 'sitio') X.portal[l.id][p.id] = 'desactualizado'; }); toast('Orden actualizado', 'Portada: ' + ord[0] + ' · portales pendientes de sincronizar'); rerender(); });

  // ads
  act('sl.ads.open', function (d) { var c = D.byId(D.campaigns, d.cmp); if (c) campaignDrawer(c, CUR); });
  act('sl.ads.pause', function (d) { var c = D.byId(D.campaigns, d.cmp); if (!c) return; c.status = 'pausada'; toast('Campaña pausada', c.name); rerender(); });
  act('sl.ads.resume', function (d) { var c = D.byId(D.campaigns, d.cmp); if (!c) return; var pend = (X.variants[c.id] || []).filter(function (v) { return v.status === 'pendiente'; }).length; if (!(X.variants[c.id] || []).some(function (v) { return v.status === 'aprobada'; })) { toast('Falta aprobar un copy', 'Aprueba al menos una variante AI antes de activar la campaña.', 'danger'); campaignDrawer(c, CUR); return; } c.status = 'activa'; toast('Campaña activa', c.name + (pend ? ' · ' + pend + ' copies AI siguen por aprobar' : ''), 'success'); rerender(); });
  act('sl.ads.cap', function (d, el) { X['cap:' + d.cmp] = parseInt(el.value, 10); var lbl = document.getElementById('slCapVal-' + d.cmp); if (lbl) lbl.textContent = money(X['cap:' + d.cmp]); if (el.__slDone) return; });
  act('sl.ads.audience', function (d) { X['aud:' + d.cmp] = d.aud; var c = D.byId(D.campaigns, d.cmp); var a = X.audiences.filter(function (x) { return x.id === d.aud; })[0]; if (c && a) { c.audience = a.note; } toast('Audiencia actualizada', a ? a.name : '', 'success'); if (c) campaignDrawer(c, CUR); });
  act('sl.ads.approveVariant', function (d) { var vs = X.variants[d.cmp] || []; var v = vs.filter(function (x) { return x.id === d.vid; })[0]; if (!v) return; v.status = 'aprobada'; v.approvedBy = ctxUser(CUR).id; var c = D.byId(D.campaigns, d.cmp); toast('Copy aprobado', v.head + ' · listo para pautar', 'success'); if (c) campaignDrawer(c, CUR); rerender(); });
  act('sl.ads.discardVariant', function (d) { var vs = X.variants[d.cmp] || []; X.variants[d.cmp] = vs.filter(function (x) { return x.id !== d.vid; }); var c = D.byId(D.campaigns, d.cmp); toast('Variante descartada', 'Llave generará otra con un ángulo distinto.'); if (c) campaignDrawer(c, CUR); rerender(); });
  act('sl.ads.new', function () { openModal('<form class="sl-form-grid" data-submit="sl.ads.create"><label class="field span-2"><span class="label">Nombre</span><input class="input" name="name" required placeholder="Casa El Retiro · compradores Medellín"></label><label class="field"><span class="label">Inmueble</span><select class="select" name="listing"><option value="">Marca Dorum</option>' + D.listings.filter(function (l) { return l.status === 'activo'; }).map(function (l) { return '<option value="' + l.id + '">' + esc(l.title) + '</option>'; }).join('') + '</select></label><label class="field"><span class="label">Plataforma</span><select class="select" name="platform"><option>Meta · Instagram</option><option>Meta · Facebook + Instagram</option><option>Google Ads · Search</option></select></label><label class="field"><span class="label">Presupuesto (COP)</span><input class="input" name="budget" type="number" step="100000" value="1200000"></label><label class="field"><span class="label">Audiencia</span><select class="select" name="aud">' + X.audiences.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('') + '</select></label><div class="span-2 callout"><div>' + icon('sparkles') + '</div><div class="small">Llave genera 3 variantes de copy y el creativo a partir de las fotos aprobadas. La campaña queda en borrador hasta que apruebes una variante.</div></div><div class="span-2 modal-footer" style="padding-top:0"><button type="button" class="btn btn-ghost" data-action="sl.modal.close">Cancelar</button><button type="submit" class="btn btn-primary">Crear campaña</button></div></form>', { title: 'Nueva campaña' }); });
  act('sl.ads.create', function (d, form) { var f = new FormData(form); var id = nextId(D.campaigns, 'cmp-'); var a = X.audiences.filter(function (x) { return x.id === f.get('aud'); })[0]; var c = { id: id, name: f.get('name'), platform: f.get('platform'), listingId: f.get('listing') || null, status: 'borrador', budget: parseFloat(f.get('budget')) || 1000000, spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: null, start: '2026-09-22', end: '2026-10-22', audience: a ? a.note : '', owner: 'u-adv', aiCreative: true }; D.campaigns.push(c); var l = c.listingId ? D.listing(c.listingId) : null; X.variants[id] = [{ id: id + '-v1', hook: 'Beneficio', head: l ? 'Vive ' + l.city + ' sin renunciar a nada' : 'Curated by nature', body: l ? l.description.split('. ')[0] + '.' : 'Hogares inmersos en la naturaleza.', status: 'pendiente', ai: true }, { id: id + '-v2', hook: 'Prueba social', head: 'Los que ya llegaron no se van', body: 'Conoce el inventario Dorum con visita privada.', status: 'pendiente', ai: true }, { id: id + '-v3', hook: 'Urgencia suave', head: 'Agenda antes del 30 de septiembre', body: 'Últimos recorridos del mes con tu asesor.', status: 'pendiente', ai: true }]; closeModal(); toast('Campaña creada en borrador', c.name + ' · 3 copies AI por aprobar', 'ai'); rerender(); campaignDrawer(c, CUR); });

  /* ------------------------------------------- delegated DOM behaviour */
  // change / submit / drag-and-drop are delegated once at document level so content
  // inserted later by the shell (drawers, modals) works without re-binding.
  function bindCommon(el) { /* keyboard: Enter on role=button cards */
    if (!el || el.__slKeys) return; el.__slKeys = true;
    el.addEventListener('keydown', function (e) { if (e.key !== 'Enter') return; var b = e.target.closest && e.target.closest('[role="button"][data-action]'); if (b && b.tagName !== 'BUTTON' && b.tagName !== 'A') { e.preventDefault(); b.click(); } });
  }
  function bindDnD() { /* delegated below */ }
  if (!X.delegated) {
    X.delegated = true;
    function run(name, d, el) { var fn = ACT[name]; if (fn) fn(d, el, CUR); }
    document.addEventListener('change', function (e) { var el = e.target.closest && e.target.closest('[data-change]'); if (!el) return; run(el.dataset.change, el.dataset, el); });
    document.addEventListener('input', function (e) { var el = e.target; if (el && el.matches && el.matches('input[type="range"][data-change]')) run(el.dataset.change, el.dataset, el); });
    document.addEventListener('submit', function (e) { var f = e.target.closest && e.target.closest('form[data-submit]'); if (!f) return; e.preventDefault(); run(f.dataset.submit, f.dataset, f); });
    var drag = null;
    document.addEventListener('dragstart', function (e) { var c = e.target.closest && e.target.closest('[data-dnd]'); if (!c) return; drag = { kind: c.dataset.dnd, id: c.dataset.id, file: c.dataset.file, listing: c.dataset.listing }; c.classList.add('is-dragging'); try { e.dataTransfer.setData('text/plain', c.dataset.id || c.dataset.file || ''); e.dataTransfer.effectAllowed = 'move'; } catch (err) { } });
    document.addEventListener('dragend', function (e) { var c = e.target.closest && e.target.closest('[data-dnd]'); if (c) c.classList.remove('is-dragging'); document.querySelectorAll('.is-over').forEach(function (z) { z.classList.remove('is-over'); }); drag = null; });
    document.addEventListener('dragover', function (e) { var z = e.target.closest && e.target.closest('[data-dropzone],[data-dnd="photo"]'); if (!z) return; if (z.dataset.dropzone === 'upload' || drag) { e.preventDefault(); z.classList.add('is-over'); } });
    document.addEventListener('dragleave', function (e) { var z = e.target.closest && e.target.closest('[data-dropzone],[data-dnd="photo"]'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('is-over'); });
    document.addEventListener('drop', function (e) {
      var z = e.target.closest && e.target.closest('[data-dropzone],[data-dnd="photo"]'); if (!z) return; e.preventDefault(); z.classList.remove('is-over');
      if (z.dataset.dropzone === 'upload') { run('sl.order.upload', { tid: z.dataset.tid }, z); return; }
      if (!drag) return;
      if (z.dataset.dropzone === 'stage' && drag.kind === 'contact') run('sl.crm.move', { cid: drag.id, stage: z.dataset.stage }, z);
      else if (z.dataset.dnd === 'photo' && drag.kind === 'photo' && z.dataset.listing === drag.listing && z.dataset.file !== drag.file) run('sl.media.reorder', { listing: drag.listing, from: drag.file, to: z.dataset.file }, z);
      else if (z.dataset.dropzone === 'kind' && drag.kind === 'contact') { /* projects board: no-op */ }
      drag = null;
    });
    bindCommon(document.body);
  }

  L.salesModules = { ids: ['listings', 'crm-get', 'crm-sell', 'projects', 'orders', 'media', 'publishing', 'ads'], actions: Object.keys(ACT), portals: PORTALS, templates: TEMPLATES };
})();
