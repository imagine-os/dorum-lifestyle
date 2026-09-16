/* ==========================================================================
   Llave OS · Dorum tenant app · app/modules/ops.js
   Legal, money and rental-ops modules + their home widgets.
   Plugs into the app shell API (window.LLAVE) defined in app/app.js.
   Modules: contracts · paperwork · money · my-money · payroll · rentals · lifestyle · referrals
   Plain script, no build step. Mutates window.DORUM in memory for demo actions.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.LLAVE) return;
  var L = window.LLAVE;
  var D = window.DORUM;
  if (!D) return;

  var TODAY = D.generatedAt || '2026-09-16';

  /* ------------------------------------------------------------------ styles */
  var CSS = [
    ':root{--ops-c1:#1E7A57;--ops-c2:#5B4B9E;--ops-c3:#C2542B;--ops-c4:#2A6E9E;--ops-c5:#B7800F;--ops-c6:#A8447A;}',
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--ops-c1:#2FA37A;--ops-c2:#8B78CC;--ops-c3:#C9603A;--ops-c4:#4F94C8;--ops-c5:#B58A2E;--ops-c6:#B85E8C;}}',
    ':root[data-theme="dark"]{--ops-c1:#2FA37A;--ops-c2:#8B78CC;--ops-c3:#C9603A;--ops-c4:#4F94C8;--ops-c5:#B58A2E;--ops-c6:#B85E8C;}',
    '.ops-page{display:flex;flex-direction:column;gap:var(--s-6);}',
    '.ops-page .page-header p{color:var(--text-2);margin-top:var(--s-1);max-width:60ch;}',
    '.ops-back{display:inline-flex;align-items:center;gap:var(--s-1);font-size:var(--fs-sm);color:var(--text-3);margin-bottom:var(--s-2);}',
    '.ops-back:hover{color:var(--text);}',
    '.ops-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s-4);}',
    '.ops-kpis .card{padding:var(--s-4) var(--s-5);}',
    '@media (max-width:900px){.ops-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}}',
    '.ops-detail{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--s-6);align-items:start;}',
    '@media (max-width:1000px){.ops-detail{grid-template-columns:minmax(0,1fr);}}',
    '.ops-aside{display:flex;flex-direction:column;gap:var(--s-4);position:sticky;top:calc(var(--topbar-h) + var(--s-4));}',
    '@media (max-width:1000px){.ops-aside{position:static;}}',
    '.ops-group{display:flex;flex-direction:column;gap:var(--s-3);}',
    '.ops-group-head{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);padding-bottom:var(--s-2);border-bottom:1px solid var(--border);}',
    '.ops-group-head h3{font-size:var(--fs-base);font-weight:600;}',
    '.ops-rows{display:flex;flex-direction:column;}',
    '.ops-row{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) auto;gap:var(--s-4);align-items:center;padding:var(--s-3) 0;border-bottom:1px solid var(--border);}',
    '.ops-row:last-child{border-bottom:0;}',
    '.ops-row .t{font-weight:600;font-size:var(--fs-sm);line-height:1.3;}',
    '.ops-row .m{font-size:var(--fs-xs);color:var(--text-3);margin-top:2px;display:flex;flex-wrap:wrap;gap:var(--s-2);align-items:center;}',
    '@media (max-width:700px){.ops-row{grid-template-columns:minmax(0,1fr);gap:var(--s-2);}}',
    '.ops-signers{display:flex;flex-wrap:wrap;gap:var(--s-2);}',
    '.ops-signer{display:inline-flex;align-items:center;gap:var(--s-2);font-size:var(--fs-xs);color:var(--text-2);background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-pill);padding:2px 8px 2px 2px;}',
    '.ops-signer .dot{width:8px;height:8px;border-radius:50%;background:var(--text-3);flex:none;}',
    '.ops-signer.is-firmado .dot{background:var(--success);} .ops-signer.is-enviado .dot{background:var(--info);} .ops-signer.is-pendiente .dot{background:var(--warn);}',
    '.ops-signer .avatar{--size:22px;font-size:9px;}',
    '.ops-check-ok{display:inline-flex;align-items:center;gap:4px;color:var(--success);font-size:var(--fs-xs);font-weight:600;}',
    '.ops-check-ok svg,.ops-check-wait svg{width:14px;height:14px;}',
    '.ops-check-wait{display:inline-flex;align-items:center;gap:4px;color:var(--warn);font-size:var(--fs-xs);font-weight:600;}',
    /* redlines */
    '.ops-clause{border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);overflow:hidden;}',
    '.ops-clause + .ops-clause{margin-top:var(--s-3);}',
    '.ops-clause-head{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);padding:var(--s-3) var(--s-4);background:var(--surface-2);border-bottom:1px solid var(--border);flex-wrap:wrap;}',
    '.ops-clause-head h4{font-size:var(--fs-sm);font-weight:600;display:flex;align-items:center;gap:var(--s-2);}',
    '.ops-clause-head .n{font-family:var(--font-display);color:var(--text-3);font-weight:500;}',
    '.ops-clause.is-ai{border-color:color-mix(in srgb,var(--ai) 40%,var(--border));}',
    '.ops-redline{display:grid;grid-template-columns:1fr 1fr;}',
    '.ops-redline > div{padding:var(--s-4);font-size:var(--fs-sm);line-height:1.6;color:var(--text-2);}',
    '.ops-redline > div + div{border-left:1px solid var(--border);color:var(--text);}',
    '.ops-redline .eyebrow{display:block;margin-bottom:var(--s-2);}',
    '@media (max-width:700px){.ops-redline{grid-template-columns:1fr;} .ops-redline > div + div{border-left:0;border-top:1px solid var(--border);}}',
    '.ops-diff .diff-add{background:var(--success-soft);color:var(--success);border-radius:3px;padding:0 3px;text-decoration:none;}',
    '.ops-diff .diff-del{background:var(--danger-soft);color:var(--danger);border-radius:3px;padding:0 3px;text-decoration:line-through;}',
    '.ops-clause-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);padding:var(--s-3) var(--s-4);border-top:1px solid var(--border);flex-wrap:wrap;}',
    '.ops-thread{padding:var(--s-3) var(--s-4);border-top:1px solid var(--border);display:flex;flex-direction:column;gap:var(--s-3);background:var(--surface);}',
    '.ops-comment{display:flex;gap:var(--s-3);font-size:var(--fs-sm);}',
    '.ops-comment .avatar{--size:26px;font-size:10px;flex:none;}',
    '.ops-comment b{font-weight:600;} .ops-comment .when{color:var(--text-3);font-size:var(--fs-xs);margin-left:var(--s-2);}',
    '.ops-comment p{color:var(--text-2);margin-top:2px;}',
    '.ops-comment.is-ai .avatar{background:var(--ai-soft);color:var(--ai);}',
    '.ops-comment-form{display:flex;gap:var(--s-2);align-items:flex-start;}',
    '.ops-comment-form .input{flex:1;}',
    '.ops-lib{display:flex;flex-direction:column;gap:var(--s-2);}',
    '.ops-lib-item{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);padding:var(--s-2) var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface-2);font-size:var(--fs-sm);}',
    '.ops-lib-item .t{font-weight:600;font-size:var(--fs-sm);} .ops-lib-item .m{font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-tpl{display:grid;gap:var(--s-2);}',
    '.ops-tpl label{display:flex;gap:var(--s-3);align-items:flex-start;padding:var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);cursor:pointer;background:var(--surface);}',
    '.ops-tpl label:has(input:checked){border-color:var(--brand-2);background:var(--brand-soft);}',
    '.ops-tpl input{margin-top:3px;accent-color:var(--brand-2);}',
    '.ops-tpl .t{font-weight:600;font-size:var(--fs-sm);} .ops-tpl .m{font-size:var(--fs-xs);color:var(--text-3);}',
    /* paperwork */
    '.ops-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--s-2);padding:var(--s-5);border:1.5px dashed var(--border-strong);border-radius:var(--r-lg);color:var(--text-3);font-size:var(--fs-sm);text-align:center;cursor:pointer;background:var(--surface-2);transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease);}',
    '.ops-drop:hover{border-color:var(--brand-2);background:var(--brand-soft);color:var(--brand);}',
    '.ops-drop svg{width:24px;height:24px;}',
    '.ops-aicheck{display:inline-flex;align-items:flex-start;gap:6px;font-size:var(--fs-xs);color:var(--text-2);background:var(--ai-soft);border-radius:var(--r-sm);padding:3px 8px;max-width:34ch;line-height:1.4;}',
    '.ops-aicheck::before{content:"";width:8px;height:8px;border-radius:2px;background:var(--ai);transform:rotate(45deg);flex:none;margin-top:5px;}',
    '.ops-progress-line{display:flex;align-items:center;gap:var(--s-3);font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-progress-line .progress{flex:1;}',
    /* split visualizer */
    '.ops-split{display:flex;flex-direction:column;gap:var(--s-4);}',
    '.ops-split-bar{display:flex;gap:2px;height:32px;border-radius:var(--r-md);overflow:hidden;background:var(--surface-3);}',
    '.ops-split-seg{background:var(--c);min-width:3px;position:relative;transition:flex-basis 300ms var(--ease);}',
    '.ops-split-seg[data-stage="at-listing"]{background-image:repeating-linear-gradient(135deg,transparent 0 6px,rgb(255 255 255/0.22) 6px 8px);}',
    '.ops-split-seg[data-stage="monthly"]{background-image:repeating-linear-gradient(45deg,transparent 0 6px,rgb(255 255 255/0.22) 6px 8px);}',
    '.ops-split-seg span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:var(--fs-xs);font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;padding:0 4px;}',
    '.ops-split-seg.is-narrow span{display:none;}',
    '.ops-split-bar.is-mini{height:10px;border-radius:var(--r-pill);}',
    '.ops-legend{display:flex;flex-direction:column;}',
    '.ops-legend-row{display:grid;grid-template-columns:14px minmax(0,1.5fr) auto auto minmax(80px,auto);gap:var(--s-3);align-items:center;padding:var(--s-2) 0;border-bottom:1px solid var(--border);font-size:var(--fs-sm);}',
    '.ops-legend-row:last-child{border-bottom:0;}',
    '.ops-legend-row .name{font-weight:600;} .ops-legend-row .note{font-size:var(--fs-xs);color:var(--text-3);display:block;font-weight:400;}',
    '.ops-legend-row .amt{text-align:right;font-variant-numeric:tabular-nums;font-weight:600;}',
    '@media (max-width:700px){.ops-legend-row{grid-template-columns:14px minmax(0,1fr) auto;} .ops-legend-row .pill:nth-of-type(2){display:none;}}',
    '.ops-swatch{width:12px;height:12px;border-radius:3px;background:var(--c);display:inline-block;flex:none;}',
    '.ops-rule{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:var(--s-3);align-items:center;padding:var(--s-2) 0;border-bottom:1px solid var(--border);font-size:var(--fs-sm);}',
    '.ops-rule:last-child{border-bottom:0;}',
    '.ops-rule .input{text-align:right;padding:0.35rem 0.5rem;font-size:var(--fs-sm);}',
    '.ops-rule-name{display:flex;align-items:center;gap:var(--s-2);min-width:0;}',
    '.ops-rule-name .m{font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-stage-key{display:flex;gap:var(--s-4);flex-wrap:wrap;font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-stage-key i{display:inline-block;width:18px;height:10px;border-radius:2px;background:var(--text-3);vertical-align:middle;margin-right:4px;opacity:0.7;}',
    '.ops-stage-key i.listing{background-image:repeating-linear-gradient(135deg,transparent 0 4px,rgb(255 255 255/0.5) 4px 6px);}',
    '.ops-stage-key i.monthly{background-image:repeating-linear-gradient(45deg,transparent 0 4px,rgb(255 255 255/0.5) 4px 6px);}',
    /* ledger / tables */
    '.ops-in{color:var(--success);} .ops-out{color:var(--text);}',
    '.ops-chips{display:flex;gap:var(--s-2);flex-wrap:wrap;}',
    '.ops-checklist{display:flex;flex-direction:column;gap:var(--s-2);}',
    '.ops-checklist label{display:flex;gap:var(--s-3);align-items:flex-start;padding:var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);font-size:var(--fs-sm);cursor:pointer;background:var(--surface-2);}',
    '.ops-checklist label:has(input:checked){border-color:var(--success);background:var(--success-soft);}',
    '.ops-checklist input{margin-top:3px;accent-color:var(--brand-2);}',
    '.ops-checklist .m{display:block;font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-spark{display:block;width:100%;height:auto;}',
    '.ops-hero-num{font-size:var(--fs-3xl);font-weight:600;letter-spacing:-0.02em;line-height:1;}',
    '@media (max-width:600px){.ops-hero-num{font-size:var(--fs-2xl);}}',
    /* rentals */
    '.ops-kanban .kanban-card .title{display:flex;justify-content:space-between;gap:var(--s-2);align-items:flex-start;}',
    '.ops-cal-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface);}',
    '.ops-cal{display:grid;grid-template-columns:180px repeat(var(--days,30),minmax(26px,1fr));min-width:900px;font-size:var(--fs-xs);}',
    '.ops-cal > div{border-bottom:1px solid var(--border);border-right:1px solid var(--border);min-height:34px;display:flex;align-items:center;}',
    '.ops-cal .hd{background:var(--surface-2);justify-content:center;color:var(--text-3);font-weight:600;min-height:38px;flex-direction:column;line-height:1.1;}',
    '.ops-cal .hd small{font-weight:500;text-transform:uppercase;font-size:9px;letter-spacing:0.05em;}',
    '.ops-cal .hd.is-weekend{color:var(--text-2);}',
    '.ops-cal .unit{padding:0 var(--s-3);font-weight:600;font-size:var(--fs-sm);background:var(--surface);position:sticky;left:0;z-index:1;flex-direction:column;align-items:flex-start;justify-content:center;gap:1px;}',
    '.ops-cal .unit small{font-weight:500;color:var(--text-3);font-size:var(--fs-xs);}',
    '.ops-cal .cell{justify-content:center;position:relative;}',
    '.ops-cal .cell.is-today{box-shadow:inset 0 0 0 2px var(--accent);}',
    '.ops-cal .cell.is-booked{background:var(--brand-soft);}',
    '.ops-cal .cell.is-booked.is-start{border-left:3px solid var(--brand-2);}',
    '.ops-cal .cell.is-booked b{position:absolute;left:6px;top:50%;transform:translateY(-50%);white-space:nowrap;color:var(--brand);font-weight:600;z-index:2;font-size:11px;}',
    '.ops-cal .cell.is-block{background:repeating-linear-gradient(135deg,var(--surface-3) 0 4px,var(--surface) 4px 8px);}',
    '.ops-cal .cell.is-owner{background:var(--accent-soft);}',
    '.ops-cal-legend{display:flex;gap:var(--s-4);flex-wrap:wrap;font-size:var(--fs-xs);color:var(--text-3);align-items:center;}',
    '.ops-cal-legend i{display:inline-block;width:14px;height:10px;border-radius:2px;vertical-align:middle;margin-right:4px;}',
    '.ops-statement{display:flex;flex-direction:column;gap:var(--s-1);font-size:var(--fs-sm);}',
    '.ops-statement div{display:flex;justify-content:space-between;gap:var(--s-3);padding:var(--s-1) 0;}',
    '.ops-statement .total{border-top:1px solid var(--border-strong);margin-top:var(--s-1);padding-top:var(--s-2);font-weight:600;font-size:var(--fs-base);}',
    '.ops-statement .neg{color:var(--text-2);}',
    '.ops-inv-items{display:flex;flex-direction:column;gap:var(--s-2);}',
    '.ops-inv-item{display:flex;align-items:center;gap:var(--s-3);padding:var(--s-2) var(--s-3);border:1px solid var(--border);border-radius:var(--r-md);font-size:var(--fs-sm);background:var(--surface);}',
    '.ops-inv-item.is-done{background:var(--success-soft);border-color:transparent;}',
    '.ops-inv-item .cam{margin-left:auto;display:inline-flex;align-items:center;gap:4px;color:var(--text-3);font-size:var(--fs-xs);}',
    '.ops-inv-item .cam svg{width:14px;height:14px;}',
    /* lifestyle */
    '.ops-svc{display:flex;flex-direction:column;gap:var(--s-3);height:100%;}',
    '.ops-svc-icon{width:48px;height:48px;border-radius:var(--r-lg);background:var(--bg-deep);display:grid;place-items:center;font-size:24px;}',
    '.ops-svc h3{font-size:var(--fs-md);font-weight:600;} .ops-svc h3 small{display:block;font-size:var(--fs-xs);color:var(--text-3);font-weight:500;margin-top:2px;}',
    '.ops-svc p{font-size:var(--fs-sm);color:var(--text-2);flex:1;}',
    '.ops-svc-foot{display:flex;justify-content:space-between;align-items:center;gap:var(--s-2);flex-wrap:wrap;}',
    '.ops-hero-card{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:var(--s-6);align-items:center;}',
    '@media (max-width:800px){.ops-hero-card{grid-template-columns:minmax(0,1fr);}}',
    '.ops-hero-card h2{font-family:var(--font-display);font-size:var(--fs-2xl);font-weight:500;letter-spacing:-0.02em;line-height:1.1;text-wrap:balance;}',
    /* widgets */
    '.ops-w{display:flex;flex-direction:column;gap:var(--s-3);height:100%;}',
    '.ops-w-top{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--s-3);}',
    '.ops-mini{display:flex;flex-direction:column;}',
    '.ops-mini-row{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);padding:var(--s-2) 0;border-bottom:1px solid var(--border);font-size:var(--fs-sm);}',
    '.ops-mini-row:last-child{border-bottom:0;}',
    '.ops-mini-row .t{font-weight:500;min-width:0;overflow-wrap:anywhere;} .ops-mini-row .m{font-size:var(--fs-xs);color:var(--text-3);display:block;font-weight:400;}',
    '.ops-mini-row .v{font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap;}',
    '.ops-w-foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:var(--s-2);font-size:var(--fs-xs);color:var(--text-3);}',
    '.ops-w-foot a{color:var(--brand);font-weight:600;display:inline-flex;align-items:center;gap:2px;}',
    '.ops-w-foot a svg{width:14px;height:14px;}',
    '.ops-ex{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-3);border:1px dashed var(--border-strong);border-radius:var(--r-xs);padding:1px 5px;vertical-align:middle;}',
    '.ops-drawer-form{display:flex;flex-direction:column;gap:var(--s-4);}',
    '.ops-muted-list{font-size:var(--fs-sm);color:var(--text-2);display:flex;flex-direction:column;gap:var(--s-1);}',
    '.ops-muted-list li{list-style:none;display:flex;gap:var(--s-2);align-items:flex-start;}',
    '.ops-muted-list li::before{content:"·";color:var(--text-3);}',
    '.ops-tabs-row{display:flex;justify-content:space-between;align-items:center;gap:var(--s-3);flex-wrap:wrap;}',
    '.ops-table-actions{display:flex;gap:var(--s-1);justify-content:flex-end;flex-wrap:wrap;}',
    '.table td .badge{white-space:nowrap;} .ops-page .table td.num > b{white-space:nowrap;}',
    /* tokens.css collapses .grid-N to 1fr (min auto) under 600px; keep tracks shrinkable so nowrap content never widens the page */
    '@media (max-width:600px){.ops-page .grid-2,.ops-page .grid-3,.ops-page .grid-4{grid-template-columns:minmax(0,1fr);} .ops-page .card{min-width:0;} .ops-kpis .stat-value{font-size:var(--fs-xl);}}',
    '.ops-w{min-width:0;} .ops-mini-row{min-width:0;}',
    '.ops-page .table td:first-child{min-width:190px;}'
  ].join('\n');
  if (!document.getElementById('ops-styles')) {
    var st = document.createElement('style'); st.id = 'ops-styles'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* ----------------------------------------------------------------- helpers */
  function esc(s) {
    if (s == null) return '';
    if (L.esc) return L.esc(String(s));
    return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }
  function ic(name) { try { return (L.icon && L.icon(name)) || ''; } catch (e) { return ''; } }
  function money(n) { return D.fmtCOP(n); }
  function moneyC(n) { return D.fmtCOP(n, { compact: true }); }
  function pct(n) { return D.fmtPct(n); }
  function fdate(iso, style) { return D.fmtDate(iso, style || 'short'); }
  function toast(t, b, v) { if (L.toast) L.toast(t, b, v); else if (D.toast) D.toast(t, b, v); }
  function rerender() { if (L.rerender) L.rerender(); }
  function route(ctx, mod, id) { return D.routeTo(ctx.roleId || 'owner', mod, id); }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); }
  function daysUntil(iso) { return iso ? daysBetween(TODAY, iso) : null; }
  function monthOf(iso) { return (iso || '').slice(0, 7); }
  function sum(arr, fn) { return arr.reduce(function (a, x) { return a + (fn ? fn(x) : x); }, 0); }
  function uniq(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }
  function initials(name) { return (name || '?').split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
  function nextId(prefix, coll) { var n = coll.length + 1; var id; do { id = prefix + '-' + String(n).padStart(3, '0'); n++; } while (D.byId(coll, id)); return id; }

  var STATUS_LABEL = {
    'pendiente': 'Pendiente', 'recibido': 'Recibido', 'validado': 'Validado', 'vencido': 'Vencido', 'rechazado': 'Rechazado',
    'pagado': 'Pagado', 'aprobado': 'Aprobado', 'retenido': 'Retenido', 'firmado': 'Firmado', 'enviado': 'Enviado a firma',
    'borrador': 'Borrador', 'en negociación': 'En negociación', 'atrasado': 'Atrasado', 'vacante': 'Vacante',
    'nuevo': 'Nuevo', 'asignado': 'Asignado', 'en curso': 'En curso', 'cerrado': 'Cerrado', 'pagada': 'Pagada', 'aprobada': 'Aprobada',
    'pre-aprobado': 'Pre-aprobado', 'en estudio': 'En estudio', 'contado': 'Pago de contado', 'desembolsado': 'Desembolsado'
  };
  // Map non-token statuses onto the data-status palette in tokens.css
  var STATUS_ALIAS = { 'recibido': 'en preparación', 'validado': 'activo', 'aprobado': 'activo', 'aprobada': 'activo', 'pagada': 'pagado', 'retenido': 'vencido',
    'enviado': 'en preparación', 'en negociación': 'bajo oferta', 'vacante': 'borrador', 'nuevo': 'pendiente', 'asignado': 'en preparación', 'en curso': 'bajo oferta',
    'cerrado': 'firmado', 'pre-aprobado': 'activo', 'en estudio': 'pendiente', 'contado': 'firmado', 'desembolsado': 'firmado' };
  function badge(status, label) {
    var s = String(status || '');
    return '<span class="badge badge-status" data-status="' + esc(STATUS_ALIAS[s] || s) + '">' + esc(label || STATUS_LABEL[s] || D.statusLabel(s)) + '</span>';
  }
  function pill(text, variant) { return '<span class="pill' + (variant ? ' pill-' + variant : '') + '">' + esc(text) + '</span>'; }
  function aiBadge(text) { return '<span class="badge badge-ai">' + esc(text || 'AI · revisar') + '</span>'; }
  function ex() { return '<span class="ops-ex" title="Valor de ejemplo para la demo">ejemplo</span>'; }
  function avatar(userIdOrName, cls) {
    var u = D.user(userIdOrName);
    var ini = u ? u.initials : initials(userIdOrName);
    var name = u ? u.name : userIdOrName;
    return '<span class="avatar ' + (cls || 'avatar-sm') + '" title="' + esc(name) + '">' + esc(ini) + '</span>';
  }
  function nameOf(idOrName) { var u = D.user(idOrName); return u ? u.name : (idOrName || '—'); }
  function actingUser(ctx) {
    if (ctx && ctx.user) return ctx.user;
    var list = D.usersByRole((ctx && ctx.roleId) || 'owner');
    return list[0] || D.users[0];
  }
  function isRole(ctx) { var r = (ctx && ctx.roleId) || ''; for (var i = 1; i < arguments.length; i++) if (arguments[i] === r) return true; return false; }
  function canApproveMoney(ctx) { return isRole(ctx, 'accountant', 'owner'); }
  function canApproveLegal(ctx) { return isRole(ctx, 'lawyer', 'owner'); }
  function isStaff(ctx) { var r = D.role(ctx.roleId); return r ? r.group === 'staff' : false; }
  function deal(id) { return D.byId(D.deals, id); }
  function listing(id) { return D.listing(id); }
  function dealListing(d) { return d ? listing(d.listingId) : null; }
  function dealShort(d) { var l = dealListing(d); return l ? l.title : (d ? d.title : '—'); }
  function partyLabel(k) { return ({ seller: 'Vendedor', buyer: 'Comprador', landlord: 'Arrendador', renter: 'Arrendatario', agency: 'Agencia', lender: 'Banco', lawyer: 'Abogado' })[k] || k; }
  function partyOf(d, key) {
    if (!d) return null;
    var p = d.parties || {};
    if (key === 'agency') return 'u-owner';
    var id = p[key];
    if (!id && key === 'seller') { var l = dealListing(d); id = l && l.ownerId; }
    if (!id && key === 'landlord') { var l2 = dealListing(d); id = l2 && l2.ownerId; }
    return id || null;
  }
  function partyName(d, key) {
    var id = partyOf(d, key);
    if (id) return nameOf(id);
    if (key === 'seller') { var l = dealListing(d); return 'Propietario · ' + (l ? l.title : ''); }
    return partyLabel(key);
  }
  function kindLabel(k) { return ({ commission: 'Comisión', referral: 'Referido', fee: 'Honorario', salary: 'Salario' })[k] || k; }
  function stageLabel(s) { return ({ 'at-listing': 'Al listar', 'at-close': 'Al cierre', 'monthly': 'Mensual' })[s] || s; }
  function kindVariant(k) { return ({ commission: 'brand', referral: 'accent', fee: 'info', salary: 'warn' })[k] || ''; }
  function userInDeal(d, uid) {
    var p = d.parties || {};
    return Object.keys(p).some(function (k) { return p[k] === uid; }) || d.split.some(function (s) { return s.participant === uid; }) || (dealListing(d) && dealListing(d).listedBy === uid);
  }
  function visibleDeals(ctx) {
    var u = actingUser(ctx);
    if (isRole(ctx, 'broker', 'photographer', 'writer', 'advertiser', 'construction', 'lender')) return D.deals.filter(function (d) { return userInDeal(d, u.id); });
    if (isRole(ctx, 'rental_admin')) return D.deals.filter(function (d) { return d.kind === 'arriendo'; });
    return D.deals.slice();
  }

  function pageHeader(title, sub, actions, back) {
    return (back ? '<a class="ops-back" href="' + esc(back.href) + '">' + ic('chevron-right') + ' ' + esc(back.label) + '</a>' : '') +
      '<div class="page-header"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
      (actions ? '<div class="row">' + actions + '</div>' : '') + '</div>';
  }
  function statCard(label, value, delta, cls) {
    return '<div class="card"><div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value ' + (cls || '') + '">' + value + '</span>' + (delta ? '<span class="stat-delta">' + delta + '</span>' : '') + '</div></div>';
  }
  function card(title, body, right, cls) {
    return '<section class="card ' + (cls || '') + '">' + (title ? '<div class="card-header"><h2 class="card-title">' + title + '</h2>' + (right || '') + '</div>' : '') + body + '</section>';
  }
  function tabs(ctx, moduleId, list, active) {
    return '<div class="tabs">' + list.map(function (t) {
      return '<button class="tab' + (t.id === active ? ' is-active' : '') + '" data-action="ops.tab" data-module="' + moduleId + '" data-tab="' + t.id + '">' + esc(t.label) + (t.count != null ? ' <span class="muted">' + t.count + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function empty(text) { return '<div class="callout"><span>' + text + '</span></div>'; }
  function progressLine(done, total) {
    var v = total ? Math.round(done / total * 100) : 0;
    return '<div class="ops-progress-line"><div class="progress"><span style="--value:' + v + '%"></span></div><span class="num">' + done + '/' + total + ' · ' + v + ' %</span></div>';
  }
  // The shell renders a "Ver todo" link in the widget header (def.link); the foot only carries meta text.
  function widgetFoot(ctx, mod, id, label, meta) {
    return meta ? '<div class="ops-w-foot"><span>' + meta + '</span></div>' : '';
  }

  /* ---------------------------------------------------------------- charts */
  // Sparkline: 2px line, ~10% area wash, emphasized endpoint (dataviz spec).
  function sparkSVG(values, opts) {
    opts = opts || {};
    var w = opts.w || 240, h = opts.h || 56, pad = 6;
    if (!values.length) return '';
    var max = Math.max.apply(null, values.concat([1])), min = Math.min.apply(null, values.concat([0]));
    var rng = max - min || 1;
    var pts = values.map(function (v, i) {
      var x = pad + i * (w - pad * 2) / Math.max(1, values.length - 1);
      var y = h - pad - (v - min) / rng * (h - pad * 2);
      return [x, y];
    });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = path + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + pts[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
    var last = pts[pts.length - 1];
    var color = opts.color || 'var(--brand-2)';
    return '<svg class="ops-spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(opts.label || 'Tendencia') + '">' +
      '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + (h - pad) + '" y2="' + (h - pad) + '" stroke="var(--border)" stroke-width="1"/>' +
      '<path d="' + area + '" fill="' + color + '" opacity="0.10"/>' +
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="4.5" fill="var(--surface)"/>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3" fill="' + color + '"/>' +
      '</svg>';
  }
  // Column chart: <=24px thick, rounded cap, surface gap, labels via title tooltips, endpoint label only.
  function barsSVG(values, opts) {
    opts = opts || {};
    var labels = opts.labels || [];
    var w = opts.w || 320, h = opts.h || 110, padB = 18, padT = 14;
    var max = Math.max.apply(null, values.concat([1]));
    var slot = w / values.length, bw = Math.min(16, slot * 0.5);
    var out = '<svg class="ops-spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(opts.label || 'Barras') + '">';
    out += '<line x1="0" x2="' + w + '" y1="' + (h - padB) + '" y2="' + (h - padB) + '" stroke="var(--border)" stroke-width="1"/>';
    values.forEach(function (v, i) {
      var bh = Math.max(2, (v / max) * (h - padB - padT));
      var x = i * slot + (slot - bw) / 2, y = h - padB - bh;
      var hl = opts.highlight != null ? i === opts.highlight : i === values.length - 1;
      out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" ry="4" fill="' + (hl ? 'var(--brand-2)' : 'var(--brand-soft)') + '"><title>' + esc((labels[i] || '') + ' · ' + money(v)) + '</title></rect>';
      out += '<rect x="' + x.toFixed(1) + '" y="' + (h - padB - Math.min(4, bh)).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.min(4, bh).toFixed(1) + '" fill="' + (hl ? 'var(--brand-2)' : 'var(--brand-soft)') + '"/>';
      if (labels[i]) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 5) + '" text-anchor="middle" font-size="10" fill="var(--text-3)">' + esc(labels[i]) + '</text>';
      if (hl) out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="600" fill="var(--text-2)">' + esc(moneyC(v)) + '</text>';
    });
    return out + '</svg>';
  }

  // Split visualizer — one color per participant (fixed order of first appearance), 2px surface gaps, stage as texture.
  var SPLIT_COLORS = ['var(--ops-c1)', 'var(--ops-c2)', 'var(--ops-c3)', 'var(--ops-c4)', 'var(--ops-c5)', 'var(--ops-c6)'];
  function participantColors(rows) {
    var map = {}, i = 0;
    rows.forEach(function (r) { if (!(r.participant in map)) { map[r.participant] = SPLIT_COLORS[Math.min(i, SPLIT_COLORS.length - 1)]; i++; } });
    return map;
  }
  function splitBar(rows, gross, mini) {
    var colors = participantColors(rows);
    var total = sum(rows, function (r) { return r.amount; }) || 1;
    var html = '<div class="ops-split-bar' + (mini ? ' is-mini' : '') + '" role="img" aria-label="Reparto del negocio">';
    rows.forEach(function (r) {
      if (r.amount <= 0) return;
      var share = r.amount / total * 100;
      html += '<div class="ops-split-seg' + (share < 9 ? ' is-narrow' : '') + '" data-stage="' + esc(r.stage) + '" style="--c:' + colors[r.participant] + ';flex:0 0 calc(' + share.toFixed(2) + '% - 2px)" title="' + esc(r.name + ' · ' + kindLabel(r.kind) + ' · ' + money(r.amount)) + '">' + (mini ? '' : '<span>' + esc(r.pct != null ? r.pct + ' %' : moneyC(r.amount)) + '</span>') + '</div>';
    });
    return html + '</div>';
  }
  function splitLegend(rows) {
    var colors = participantColors(rows);
    return '<div class="ops-legend">' + rows.map(function (r) {
      return '<div class="ops-legend-row"><i class="ops-swatch" style="--c:' + colors[r.participant] + '"></i><div class="name">' + esc(r.name) + (r.note ? '<span class="note">' + esc(r.note) + '</span>' : '') + '</div>' +
        pill(kindLabel(r.kind), kindVariant(r.kind)) + pill(stageLabel(r.stage)) + '<div class="amt">' + (r.pct != null ? '<span class="muted small">' + r.pct + ' % · </span>' : '') + esc(money(r.amount)) + '</div></div>';
    }).join('') + '</div>';
  }
  function stageKey() {
    return '<div class="ops-stage-key"><span><i></i>Al cierre</span><span><i class="listing"></i>Al listar</span><span><i class="monthly"></i>Mensual</span></div>';
  }

  /* ------------------------------------------------------------ demo state */
  // Operational data that data.js does not carry. Kept in memory; every action mutates here.
  var S = window.LLAVE_OPS_STATE || (window.LLAVE_OPS_STATE = {
    tab: {},
    ledgerAccount: 'all',
    calMonth: '2026-09',
    redlines: {},
    comments: {
      'k-003': {
        arras: [
          { who: 'u-buy-2', at: '2026-09-15', text: 'Prefiero arras del 5 % mientras sale el desembolso del crédito. El banco ya pre-aprobó.' },
          { who: 'ai', at: '2026-09-16', text: 'Propuesta intermedia: arras 7 % con plazo de escritura al 30 de noviembre. Mantiene la cobertura del vendedor y responde al comprador.' }
        ],
        entrega: [{ who: 'u-lawyer', at: '2026-09-16', text: 'Entrega debe quedar sujeta al registro en la ORIP, no a la firma. Ajustar redacción.' }]
      },
      'k-002': { precio: [{ who: 'ai', at: '2026-09-16', text: 'Basado en 6 comparables (Guatapé frente de agua) y 2 ofertas previas: 3.780 M queda 3 % bajo el precio de lista y 3,6 % sobre la oferta.' }] }
    },
    clauseLibrary: [
      { id: 'cl-01', title: 'Arras confirmatorias 10 %', tags: ['promesa'], text: 'A título de arras confirmatorias, el PROMITENTE COMPRADOR entrega el diez por ciento (10 %) del precio, imputable al mismo.', approvedBy: 'u-lawyer', updated: '2026-05-10' },
      { id: 'cl-02', title: 'Entrega sujeta a registro', tags: ['promesa'], text: 'La entrega material del inmueble se realizará dentro de los cinco (5) días hábiles siguientes a la inscripción de la escritura en la Oficina de Registro de Instrumentos Públicos.', approvedBy: 'u-lawyer', updated: '2026-06-02' },
      { id: 'cl-03', title: 'Cláusula penal 10 %', tags: ['promesa', 'arriendo'], text: 'El incumplimiento de cualquiera de las partes dará lugar al pago de una suma equivalente al diez por ciento (10 %) del precio a título de pena, sin perjuicio del cumplimiento.', approvedBy: 'u-lawyer', updated: '2026-03-18' },
      { id: 'cl-04', title: 'Incremento anual IPC (Ley 820)', tags: ['arriendo'], text: 'El canon se incrementará cada doce (12) meses en una proporción que no podrá ser superior al cien por ciento (100 %) del incremento del IPC del año calendario anterior.', approvedBy: 'u-lawyer', updated: '2026-01-15' },
      { id: 'cl-05', title: 'Depósito en garantía', tags: ['arriendo'], text: 'El ARRENDATARIO entrega en depósito una suma equivalente a un (1) canon, que será restituida al finalizar el contrato una vez recibido el inmueble a satisfacción según inventario.', approvedBy: 'u-lawyer', updated: '2026-02-20' },
      { id: 'cl-06', title: 'Exclusividad de corretaje', tags: ['corretaje'], text: 'El PROPIETARIO otorga a DORUM la exclusividad para la promoción y venta del inmueble durante la vigencia del presente acuerdo.', approvedBy: 'u-lawyer', updated: '2026-04-08' },
      { id: 'cl-07', title: 'Mobiliario incluido (anexo inventario)', tags: ['promesa', 'arriendo'], text: 'Se incluyen en el negocio los bienes muebles relacionados en el Anexo 1, que las partes declaran conocer y aceptar en su estado actual.', approvedBy: 'u-lawyer', updated: '2026-07-01' },
      { id: 'cl-08', title: 'Origen lícito de fondos', tags: ['promesa'], text: 'El PROMITENTE COMPRADOR declara que los recursos con los que paga provienen de actividades lícitas y autoriza la verificación correspondiente.', approvedBy: 'u-lawyer', updated: '2026-08-12' }
    ],
    contractLog: {},
    docReminders: {},
    releaseChecks: {},
    rentRoll: [
      { id: 'r-01', listingId: 'lst-010', unit: 'Apto Laureles · Primer Parque', tenant: 'Daniel Weber', tenantId: 'u-ren-2', landlordId: 'u-lan-1', canon: 4500000, dueDay: 1, status: 'pendiente', note: 'Primer canon el 1 oct · contrato firmado', dealId: 'd-004' },
      { id: 'r-02', listingId: 'lst-015', unit: 'Oficina Milla de Oro · piso 9', tenant: 'Kuna Tech S.A.S.', landlordId: 'u-lan-1', canon: 9800000, dueDay: 5, status: 'pagado', paidAt: '2026-09-04', dealId: 'd-006' },
      { id: 'r-03', listingId: null, unit: 'Apto Castropol 1203', tenant: 'Juliana Mesa', landlordId: 'u-lan-1', canon: 3800000, dueDay: 13, status: 'atrasado', daysLate: 3, leaseEnd: '2026-11-30' },
      { id: 'r-04', listingId: 'lst-005', unit: 'Casa campestre Guayacanes', tenant: null, landlordId: 'u-lan-2', canon: 14000000, dueDay: 1, status: 'vacante', note: 'En visitas · prospecto Natalia Pérez (mié 17 sep)' },
      { id: 'r-05', listingId: null, unit: 'Apto Ciudad del Río 804', tenant: 'Andrés Toro', landlordId: 'u-lan-2', canon: 2900000, dueDay: 5, status: 'pagado', paidAt: '2026-09-05', leaseEnd: '2026-12-15' },
      { id: 'r-06', listingId: null, unit: 'Local Provenza · Cra 35', tenant: 'Café Origen S.A.S.', landlordId: 'u-lan-1', canon: 6200000, dueDay: 20, status: 'pendiente', leaseEnd: '2027-01-31' }
    ],
    tickets: [
      { id: 'tk-01', unit: 'Apto Laureles · Primer Parque', listingId: 'lst-010', title: 'Calentador de paso no enciende', reportedBy: 'Daniel Weber', priority: 'alta', status: 'nuevo', created: '2026-09-16',
        ai: { vendor: 'Gasodomésticos Antioquia', eta: 'Visita en 24 h', cost: 180000, reason: 'Patrón "no encendido + olor a gas leve" → técnico gas certificado, no electricista.' } },
      { id: 'tk-02', unit: 'Casa El Roble · Guatapé', listingId: 'lst-012', title: 'Filtración en techo de la terraza', reportedBy: 'Inspección Lifestyle', priority: 'media', status: 'asignado', vendor: 'u-constr', created: '2026-09-12', cost: 650000 },
      { id: 'tk-03', unit: 'Casa El Roble · Guatapé', listingId: 'lst-012', title: 'Mantenimiento bomba de piscina', reportedBy: 'Housekeeping', priority: 'baja', status: 'en curso', vendor: 'Aquapool Guatapé', created: '2026-09-10', cost: 320000 },
      { id: 'tk-04', unit: 'Oficina Milla de Oro · piso 9', listingId: 'lst-015', title: 'Cambio de cerradura puerta principal', reportedBy: 'Kuna Tech', priority: 'media', status: 'cerrado', vendor: 'Cerrajería Poblado', created: '2026-08-28', closed: '2026-08-30', cost: 220000 },
      { id: 'tk-05', unit: 'Casa campestre Guayacanes', listingId: 'lst-005', title: 'Poda y jardín antes de visitas', reportedBy: 'Daniela Montoya', priority: 'baja', status: 'nuevo', created: '2026-09-15',
        ai: { vendor: 'Jardines Llanogrande', eta: 'Mar 16 sep · 7:00', cost: 260000, reason: 'Visita agendada el 17 sep; el canon incluye jardín → cargo al propietario.' } }
    ],
    leases: [
      { id: 'ls-01', unit: 'Apto Castropol 1203', tenant: 'Juliana Mesa', landlordId: 'u-lan-1', canon: 3800000, end: '2026-11-30', ipcPct: 5.2, kind: 'vivienda' },
      { id: 'ls-02', unit: 'Apto Ciudad del Río 804', tenant: 'Andrés Toro', landlordId: 'u-lan-2', canon: 2900000, end: '2026-12-15', ipcPct: 5.2, kind: 'vivienda' },
      { id: 'ls-03', unit: 'Local Provenza · Cra 35', tenant: 'Café Origen S.A.S.', landlordId: 'u-lan-1', canon: 6200000, end: '2027-01-31', ipcPct: 6.2, kind: 'comercial' },
      { id: 'ls-04', unit: 'Apto Laureles · Primer Parque', tenant: 'Daniel Weber', landlordId: 'u-lan-1', canon: 4500000, end: '2027-09-30', ipcPct: 5.2, kind: 'vivienda', dealId: 'd-004' },
      { id: 'ls-05', unit: 'Oficina Milla de Oro · piso 9', tenant: 'Kuna Tech S.A.S.', landlordId: 'u-lan-1', canon: 9800000, end: '2029-07-31', ipcPct: 6.2, kind: 'comercial', dealId: 'd-006' }
    ],
    inventories: [
      { id: 'inv-01', unit: 'Apto Laureles · Primer Parque', listingId: 'lst-010', kind: 'entrada', date: '2026-09-25', parties: ['u-lan-1', 'u-ren-2'], contractId: 'k-005', status: 'pendiente',
        items: [{ n: 'Sala y comedor', done: false, photos: 0 }, { n: 'Cocina integral y electrodomésticos', done: false, photos: 0 }, { n: 'Alcoba principal', done: false, photos: 0 }, { n: 'Alcoba 2', done: false, photos: 0 }, { n: 'Baños (2)', done: false, photos: 0 }, { n: 'Balcón y ventanería', done: false, photos: 0 }, { n: 'Medidores (agua, gas, energía)', done: false, photos: 0 }, { n: 'Llaves y controles (parqueadero)', done: false, photos: 0 }] },
      { id: 'inv-02', unit: 'Casa campestre Guayacanes', listingId: 'lst-005', kind: 'salida', date: '2026-08-31', parties: ['u-lan-2'], status: 'en curso',
        items: [{ n: 'Sala, comedor y chimenea', done: true, photos: 6 }, { n: 'Cocina y despensa', done: true, photos: 4 }, { n: 'Alcobas (4)', done: true, photos: 9 }, { n: 'Baños (4)', done: true, photos: 5 }, { n: 'Estudio', done: true, photos: 2 }, { n: 'Mobiliario (anexo 1)', done: true, photos: 14 }, { n: 'Jardín y zona de mascotas', done: false, photos: 0 }, { n: 'Medidores', done: false, photos: 0 }] }
    ],
    vacationUnits: [
      { id: 'vu-01', listingId: 'lst-012', name: 'Casa El Roble', sub: 'Guatapé · 8 huéspedes', nightly: 2400000, ownerId: 'u-lan-2' },
      { id: 'vu-02', listingId: 'lst-002', name: 'Apto Luxe by The Charlee 502', sub: 'Guatapé · programa piloto', nightly: 1350000, ownerId: null },
      { id: 'vu-03', listingId: 'lst-003', name: 'Casa de lago · muelle', sub: 'Guatapé · renta puntual (en venta)', nightly: 3200000, ownerId: null }
    ],
    bookings: [
      { unit: 'vu-01', from: '2026-09-04', to: '2026-09-07', guest: 'Fam. Arango', channel: 'Directo' },
      { unit: 'vu-01', from: '2026-09-11', to: '2026-09-14', guest: 'K. Müller', channel: 'Instagram' },
      { unit: 'vu-01', from: '2026-09-20', to: '2026-09-22', guest: 'Fam. Arbeláez', channel: 'Directo', extras: 'Chef + limpieza' },
      { unit: 'vu-01', from: '2026-09-26', to: '2026-09-30', guest: 'S. Whitaker', channel: 'Website' },
      { unit: 'vu-01', from: '2026-10-09', to: '2026-10-13', guest: 'Puente · Fam. Ríos', channel: 'Directo' },
      { unit: 'vu-01', from: '2026-10-16', to: '2026-10-18', guest: 'L. Castaño', channel: 'Website' },
      { unit: 'vu-02', from: '2026-09-05', to: '2026-09-08', guest: 'J. Park', channel: 'Website' },
      { unit: 'vu-02', from: '2026-09-18', to: '2026-09-20', guest: 'Fam. Ospina', channel: 'Directo' },
      { unit: 'vu-02', from: '2026-09-23', to: '2026-09-25', guest: 'Bloqueo · mantenimiento', block: true },
      { unit: 'vu-02', from: '2026-10-02', to: '2026-10-05', guest: 'M. Rossi', channel: 'Instagram' },
      { unit: 'vu-03', from: '2026-09-12', to: '2026-09-13', guest: 'Uso propietario', owner: true },
      { unit: 'vu-03', from: '2026-09-27', to: '2026-09-29', guest: 'Retiro yoga · 6 pax', channel: 'Experiencias' }
    ],
    statementsSent: {},
    payroll: {
      month: '2026-09', status: 'borrador',
      staff: [
        { userId: 'u-sadmin', type: 'salary', base: 6200000 },
        { userId: 'u-radmin', type: 'salary', base: 5800000 },
        { userId: 'u-acct', type: 'salary', base: 5400000 },
        { userId: 'u-lawyer', type: 'salary', base: 4000000 },
        { userId: 'u-brk-1', type: 'commission', base: 0 },
        { userId: 'u-brk-2', type: 'commission', base: 0 },
        { userId: 'u-brk-3', type: 'commission', base: 0 }
      ]
    },
    earningsHistory: {
      'u-brk-1': [9800000, 0, 14200000, 6500000, 0, 21300000, 0, 12400000, 0],
      'u-brk-2': [4200000, 7900000, 0, 11800000, 5300000, 0, 9100000, 5880000, 4050000],
      'u-brk-3': [0, 6100000, 0, 0, 8400000, 0, 3900000, 0, 0],
      'u-photo': [1200000, 1850000, 950000, 2400000, 1850000, 1300000, 2100000, 950000, 1850000],
      'u-writer': [650000, 650000, 0, 1300000, 650000, 650000, 0, 650000, 650000],
      'u-adv': [1800000, 1800000, 2200000, 1800000, 2400000, 1800000, 2600000, 1800000, 1800000],
      'u-constr': [0, 0, 8500000, 0, 0, 12000000, 0, 0, 0],
      'u-lender': [0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    referrals: [
      { id: 'rf-01', contactId: 'c-002', bank: 'Bancolombia', status: 'pre-aprobado', amount: 600000000, expires: '2026-12-14', dealId: 'd-002', closing: '2026-11-30', next: 'Avalúo bancario · 2 oct', referredAt: '2026-09-02' },
      { id: 'rf-02', contactId: 'c-003', bank: 'Bancolombia', status: 'en estudio', amount: 1800000000, expires: null, dealId: null, closing: null, next: 'Recibir extractos y certificado laboral', referredAt: '2026-09-14' },
      { id: 'rf-03', contactId: 'c-001', bank: null, status: 'contado', amount: 0, expires: null, dealId: 'd-001', closing: null, next: 'Declaración de origen de fondos (compradora)', referredAt: '2026-09-12' },
      { id: 'rf-04', contactId: 'c-004', bank: 'Bancolombia', status: 'nuevo', amount: 0, expires: null, dealId: null, closing: null, next: 'Primer contacto (EN) · crédito no aplica para inmueble en México', referredAt: '2026-09-16' }
    ],
    lifestyleConfig: {
      'ls-house': { partners: ['Limpieza Verde Guatapé', 'Lavandería El Embalse'], margin: 15, launch: '2027-01', visible: true },
      'ls-food': { partners: ['Chef Camila Ruiz', 'Mercado La Piedra'], margin: 12, launch: '2027-02', visible: true },
      'ls-act': { partners: ['Kayak Guatapé', 'Yoga en el muelle · Ana T.'], margin: 20, launch: 'piloto', visible: true },
      'ls-trans': { partners: ['Transportes Oriente', 'Lanchas El Peñol'], margin: 10, launch: '2027-03', visible: true },
      'ls-conc': { partners: ['Equipo Dorum Lifestyle'], margin: 0, launch: '2027-01', visible: true },
      'ls-remodel': { partners: ['Henao Construcciones Sostenibles'], margin: 8, launch: '2027-06', visible: false },
      'ls-build': { partners: ['Dorum Projects'], margin: 6, launch: '2028', visible: false }
    },
    lifestyleRequests: [{ id: 'lr-01', serviceId: 'ls-act', who: 'u-ren-2', when: '2026-09-27 · 6:30', note: 'Kayak al amanecer · 2 personas', status: 'confirmado' }],
    notified: {},
    dian: { status: 'pendiente', nextFiling: '2026-10-14', concept: 'Retención en la fuente · septiembre', invoices30d: 6, note: 'Conexión con facturación electrónica DIAN pendiente de habilitar.' }
  });

  // Redline clauses per contract (generated once, then mutated by actions).
  function clausesFor(k) {
    if (S.redlines[k.id]) return S.redlines[k.id];
    var d = deal(k.dealId), l = listing(k.listingId);
    var t = k.type.toLowerCase();
    var list;
    if (t.indexOf('promesa') >= 0) {
      list = [
        { key: 'precio', title: 'Precio', prev: 'El precio de venta es la suma de <b>$850.000.000</b>, pagaderos según la forma de pago pactada.', next: 'El precio de venta es la suma de <span class="diff-del">$850.000.000</span> <span class="diff-add">$815.000.000</span>, pagaderos según la forma de pago pactada.', by: 'Comprador', status: 'pendiente' },
        { key: 'arras', title: 'Arras', prev: 'A título de arras confirmatorias el PROMITENTE COMPRADOR entrega el <b>10 %</b> del precio a la firma de la presente promesa.', next: 'A título de arras confirmatorias el PROMITENTE COMPRADOR entrega el <span class="diff-del">10 %</span> <span class="diff-add">7 %</span> del precio a la firma de la presente promesa<span class="diff-add">, y un 3 % adicional al desembolso del crédito hipotecario</span>.', by: 'Llave (contrapropuesta al 5 % del comprador)', ai: true, status: 'pendiente' },
        { key: 'escritura', title: 'Fecha de escritura', prev: 'La escritura pública se otorgará el <b>15 de noviembre de 2026</b> en la Notaría 15 de Medellín.', next: 'La escritura pública se otorgará el <span class="diff-del">15 de noviembre de 2026</span> <span class="diff-add">30 de noviembre de 2026</span> en la Notaría 15 de Medellín.', by: 'Comprador', status: 'pendiente' },
        { key: 'entrega', title: 'Entrega', prev: 'La entrega material se hará el día de la firma de la escritura.', next: 'La entrega material se hará <span class="diff-del">el día de la firma de la escritura</span> <span class="diff-add">dentro de los cinco (5) días hábiles siguientes al registro de la escritura en la ORIP</span>.', by: 'Abogado', status: 'aceptado' },
        { key: 'mobiliario', title: 'Mobiliario', prev: 'El inmueble se entrega sin bienes muebles.', next: 'El inmueble se entrega <span class="diff-del">sin bienes muebles</span> <span class="diff-add">con los bienes muebles del Anexo 1 (cocina, closets, cortinas)</span>.', by: 'Llave', ai: true, status: 'pendiente' },
        { key: 'penal', title: 'Cláusula penal', prev: 'El incumplimiento dará lugar a una pena del <b>10 %</b> del precio.', next: 'El incumplimiento dará lugar a una pena del <b>10 %</b> del precio. <span class="diff-add">La pena no excluye la ejecución de la obligación principal.</span>', by: 'Abogado', status: 'aceptado' }
      ];
    } else if (t.indexOf('contraoferta') >= 0) {
      list = [
        { key: 'precio', title: 'Precio', prev: 'Oferta recibida: <b>$3.650.000.000</b>.', next: 'Contraoferta: <span class="diff-del">$3.650.000.000</span> <span class="diff-add">$3.780.000.000</span>.', by: 'Llave', ai: true, status: 'pendiente' },
        { key: 'entrega', title: 'Entrega', prev: 'Entrega a <b>60 días</b> de la firma de la promesa.', next: 'Entrega a <span class="diff-del">60 días</span> <span class="diff-add">45 días</span> de la firma de la promesa.', by: 'Llave', ai: true, status: 'pendiente' },
        { key: 'mobiliario', title: 'Mobiliario', prev: 'No incluye mobiliario.', next: '<span class="diff-del">No incluye mobiliario.</span> <span class="diff-add">Incluye mobiliario, lancha y equipamiento del muelle (Anexo 1).</span>', by: 'Llave', ai: true, status: 'pendiente' },
        { key: 'arras', title: 'Arras', prev: 'Arras del <b>10 %</b> a la firma de la promesa.', next: 'Arras del <b>10 %</b> a la firma de la promesa <span class="diff-add">en cuenta escrow administrada por Dorum</span>.', by: 'Abogado', status: 'aceptado' }
      ];
    } else if (t.indexOf('arrendamiento') >= 0) {
      var canon = d && d.monthlyRent ? money(d.monthlyRent) : '$4.500.000';
      list = [
        { key: 'canon', title: 'Canon', prev: 'El canon mensual es de <b>' + canon + '</b>, pagadero dentro de los cinco (5) primeros días de cada mes.', next: 'El canon mensual es de <b>' + canon + '</b>, pagadero dentro de los <span class="diff-del">cinco (5)</span> <span class="diff-add">tres (3)</span> primeros días de cada mes <span class="diff-add">mediante PSE o transferencia a la cuenta recaudadora de Dorum</span>.', by: 'Llave', ai: true, status: 'aceptado' },
        { key: 'deposito', title: 'Depósito', prev: 'El ARRENDATARIO constituye póliza de arrendamiento con afianzadora.', next: 'El ARRENDATARIO constituye póliza de arrendamiento con afianzadora <span class="diff-add">(Afianzadora El Libertador) y entrega depósito de un (1) canon en cuenta escrow</span>.', by: 'Arrendador', status: 'aceptado' },
        { key: 'ipc', title: 'Incremento anual', prev: 'El canon se incrementará anualmente según acuerdo entre las partes.', next: 'El canon se incrementará <span class="diff-del">anualmente según acuerdo entre las partes</span> <span class="diff-add">cada doce (12) meses en un porcentaje no superior al 100 % del IPC del año anterior (Ley 820 de 2003)</span>.', by: 'Abogado', status: 'aceptado' },
        { key: 'entrega', title: 'Entrega e inventario', prev: 'El inmueble se entrega en buen estado.', next: 'El inmueble se entrega en buen estado <span class="diff-add">conforme al inventario fotográfico firmado por ambas partes (Anexo 1)</span>.', by: 'Llave', ai: true, status: 'aceptado' },
        { key: 'penal', title: 'Cláusula penal', prev: 'Pena por incumplimiento equivalente a <b>dos (2) cánones</b>.', next: 'Pena por incumplimiento equivalente a <span class="diff-del">dos (2) cánones</span> <span class="diff-add">un (1) canon</span>.', by: 'Arrendatario', status: 'aceptado' }
      ];
    } else if (t.indexOf('inventario') >= 0) {
      list = [
        { key: 'estado', title: 'Estado general', prev: 'Se genera desde las fotos del recorrido.', next: '<span class="diff-add">Pendiente: recorrido del 25 sep con arrendadora y arrendatario.</span>', by: 'Sistema', status: 'aceptado' },
        { key: 'mobiliario', title: 'Mobiliario y equipos', prev: '—', next: '<span class="diff-add">Se listarán electrodomésticos, medidores y llaves con foto y serial.</span>', by: 'Sistema', status: 'aceptado' }
      ];
    } else { // corretaje
      var pctc = d && d.commissionPct ? d.commissionPct : (l && (l.type === 'finca' || l.type === 'lote' || l.city === 'Guatapé') ? 4 : 3);
      list = [
        { key: 'comision', title: 'Comisión', prev: 'DORUM percibirá una comisión del <b>3 % + IVA</b> sobre el precio de venta.', next: 'DORUM percibirá una comisión del <span class="diff-del">3 % + IVA</span> <span class="diff-add">' + pctc + ' % + IVA</span> sobre el precio de venta<span class="diff-add"> (tarifa rural / frente de agua)</span>.', by: 'Llave', ai: true, status: k.lawyerApproved ? 'aceptado' : 'pendiente' },
        { key: 'exclusividad', title: 'Exclusividad', prev: 'El PROPIETARIO podrá promocionar el inmueble por otros medios.', next: '<span class="diff-del">El PROPIETARIO podrá promocionar el inmueble por otros medios.</span> <span class="diff-add">El PROPIETARIO otorga a DORUM exclusividad durante la vigencia del acuerdo.</span>', by: 'Llave', ai: true, status: k.lawyerApproved ? 'aceptado' : 'pendiente' },
        { key: 'vigencia', title: 'Vigencia', prev: 'Vigencia de <b>3 meses</b> prorrogables.', next: 'Vigencia de <span class="diff-del">3 meses</span> <span class="diff-add">' + (k.termMonths || 6) + ' meses</span> prorrogables automáticamente por periodos iguales.', by: 'Propietario', status: 'aceptado' },
        { key: 'marketing', title: 'Gastos de marketing', prev: 'Los gastos de fotografía y pauta corren por cuenta del PROPIETARIO.', next: 'Los gastos de fotografía y pauta corren por cuenta <span class="diff-del">del PROPIETARIO</span> <span class="diff-add">de DORUM, recuperables al cierre según el reparto del negocio</span>.', by: 'Llave', ai: true, status: 'aceptado' },
        { key: 'penal', title: 'Cláusula penal', prev: 'Si el PROPIETARIO vende por su cuenta durante la exclusividad, pagará la comisión completa.', next: 'Si el PROPIETARIO vende por su cuenta durante la exclusividad, pagará <span class="diff-del">la comisión completa</span> <span class="diff-add">el 50 % de la comisión pactada</span>.', by: 'Propietario', status: 'pendiente' }
      ];
    }
    // A signed or sent envelope has no open redlines: every clause is settled.
    if (k.status === 'firmado' || k.status === 'enviado') list.forEach(function (c) { if (c.status === 'pendiente') c.status = 'aceptado'; });
    S.redlines[k.id] = list;
    return list;
  }
  function contractLog(k) {
    if (S.contractLog[k.id]) return S.contractLog[k.id];
    var d = deal(k.dealId);
    var log = [];
    log.push({ at: k.updated, title: 'Llave generó el borrador v1 desde la plantilla "' + k.type + '"', ai: true, done: true });
    if (k.redlines) log.push({ at: k.updated, title: 'Contraparte propuso ' + k.redlines + ' cambio' + (k.redlines > 1 ? 's' : '') + (k.note ? ' · ' + k.note : ''), done: true });
    if (k.aiDrafted && k.redlines) log.push({ at: k.updated, title: 'Llave propuso contraoferta sobre los redlines', body: 'Cada cláusula muestra la versión anterior y la propuesta; nada sale sin aprobación.', ai: true, done: true });
    if (k.lawyerApproved) log.push({ at: k.updated, title: nameOf('u-lawyer') + ' aprobó el texto (revisión legal)', done: true });
    else log.push({ at: null, title: 'Pendiente aprobación de ' + nameOf('u-lawyer'), current: true });
    var sent = k.signers.some(function (s) { return s.status === 'enviado' || s.status === 'firmado'; });
    if (sent) log.push({ at: k.updated, title: 'Enviado a firma electrónica', done: true });
    k.signers.forEach(function (s) { if (s.status === 'firmado') log.push({ at: s.at, title: 'Firmó ' + (s.userId ? nameOf(s.userId) : s.name), done: true }); });
    if (k.status === 'firmado' && d && d.kind === 'venta') log.push({ at: null, title: 'Escritura en notaría · liberación de reparto', done: false });
    S.contractLog[k.id] = log;
    return log;
  }
  function addLog(k, entry) { contractLog(k).push(entry); }

  /* ================================================================ CONTRACTS */
  var CONTRACT_GROUPS = [
    { id: 'corretaje-venta', label: 'Acuerdo de corretaje · venta', test: function (t) { return /corretaje/.test(t) && /venta/.test(t); } },
    { id: 'corretaje-arriendo', label: 'Acuerdo de corretaje · arriendo', test: function (t) { return /corretaje/.test(t) && /arriendo/.test(t); } },
    { id: 'oferta', label: 'Ofertas y contraofertas', test: function (t) { return /oferta/.test(t); } },
    { id: 'promesa', label: 'Promesa de compraventa', test: function (t) { return /promesa/.test(t); } },
    { id: 'arrendamiento', label: 'Contrato de arrendamiento', test: function (t) { return /arrendamiento/.test(t); } },
    { id: 'inventario', label: 'Inventario', test: function (t) { return /inventario/.test(t); } },
    { id: 'escritura', label: 'Escritura pública', test: function (t) { return /escritura/.test(t); } }
  ];
  function groupOf(k) { var t = k.type.toLowerCase(); for (var i = 0; i < CONTRACT_GROUPS.length; i++) if (CONTRACT_GROUPS[i].test(t)) return CONTRACT_GROUPS[i]; return CONTRACT_GROUPS[0]; }
  function visibleContracts(ctx) {
    var u = actingUser(ctx);
    if (isRole(ctx, 'broker')) return D.contracts.filter(function (k) { var d = deal(k.dealId), l = listing(k.listingId); return (d && userInDeal(d, u.id)) || (l && l.listedBy === u.id); });
    if (isRole(ctx, 'rental_admin')) return D.contracts.filter(function (k) { var d = deal(k.dealId); return (d && d.kind === 'arriendo') || /arriendo|arrendamiento|inventario/i.test(k.type); });
    if (isRole(ctx, 'lender')) return D.contracts.filter(function (k) { var d = deal(k.dealId); return d && d.parties && d.parties.lender === u.id; });
    return D.contracts.slice();
  }
  function signerHtml(s) {
    var name = s.userId ? nameOf(s.userId) : s.name;
    return '<span class="ops-signer is-' + esc(s.status) + '">' + avatar(s.userId || name) + '<span>' + esc(name) + '</span><i class="dot" title="' + esc(STATUS_LABEL[s.status] || s.status) + '"></i></span>';
  }
  function contractRow(ctx, k) {
    var l = listing(k.listingId), d = deal(k.dealId);
    var open = clausesFor(k).filter(function (c) { return c.status === 'pendiente'; }).length;
    return '<div class="ops-row">' +
      '<div><a class="t" href="' + esc(route(ctx, 'contracts', k.id)) + '">' + esc(l ? l.title : (d ? d.title : k.type)) + '</a>' +
      '<div class="m"><span>v' + k.version + '</span><span>·</span><span>' + k.clauses + ' cláusulas</span>' + (k.termMonths ? '<span>·</span><span>' + k.termMonths + ' meses</span>' : '') + '<span>·</span><span>Actualizado ' + fdate(k.updated) + '</span>' +
      (k.aiDrafted ? aiBadge(k.lawyerApproved ? 'AI · aprobado' : 'AI · revisar') : '') +
      (open ? pill(open + ' redline' + (open > 1 ? 's' : '') + ' abierto' + (open > 1 ? 's' : ''), 'warn') : '') + '</div></div>' +
      '<div class="ops-signers">' + k.signers.map(signerHtml).join('') + '</div>' +
      '<div class="row" style="justify-content:flex-end">' + badge(k.status) +
      (k.lawyerApproved ? '<span class="ops-check-ok">' + ic('check') + ' Abogado</span>' : '<span class="ops-check-wait">' + ic('clock') + ' Revisión legal</span>') +
      '<a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'contracts', k.id)) + '">Abrir</a></div>' +
      '</div>';
  }
  function renderContractsList(ctx) {
    var ks = visibleContracts(ctx);
    var negotiating = ks.filter(function (k) { return k.status === 'en negociación' || k.status === 'borrador'; }).length;
    var open = sum(ks, function (k) { return clausesFor(k).filter(function (c) { return c.status === 'pendiente'; }).length; });
    var pendSign = sum(ks, function (k) { return k.signers.filter(function (s) { return s.status !== 'firmado'; }).length; });
    var review = ks.filter(function (k) { return k.aiDrafted && !k.lawyerApproved; });
    var html = '<div class="ops-page">';
    html += pageHeader('Contratos', isRole(ctx, 'lawyer') ? 'Llave redacta desde tus plantillas y cláusulas aprobadas; tú decides qué sale a firma.' : 'Negociación, redlines y firma electrónica. Cada borrador de Llave pasa por revisión legal antes de enviarse.',
      '<button class="btn btn-secondary" data-action="ops.template-modal">' + ic('file-text') + ' Generar desde plantilla</button>' + (isRole(ctx, 'lawyer', 'owner') ? '<button class="btn btn-primary" data-action="ops.clause-new">' + ic('plus') + ' Nueva cláusula</button>' : ''));
    html += '<div class="ops-kpis">' + statCard('En negociación', negotiating) + statCard('Redlines abiertos', open) + statCard('Firmas pendientes', pendSign) + statCard('Aprobados por abogado', ks.filter(function (k) { return k.lawyerApproved; }).length + '<span class="muted small"> / ' + ks.length + '</span>') + '</div>';
    if (review.length && canApproveLegal(ctx)) {
      html += '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Cola de revisión legal · ' + review.length + ' borrador' + (review.length > 1 ? 'es' : '') + ' de Llave</div>' +
        '<div class="ai-suggest-body">' + review.map(function (k) { var l = listing(k.listingId); return '<div class="row row-between" style="padding:4px 0"><span><b>' + esc(k.type) + '</b> · ' + esc(l ? l.title : '') + (k.note ? ' <span class="muted">— ' + esc(k.note) + '</span>' : '') + '</span><span class="row"><a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'contracts', k.id)) + '">Revisar</a><button class="btn btn-primary btn-sm" data-action="ops.contract-approve" data-id="' + k.id + '">Aprobar</button></span></div>'; }).join('') + '</div>' +
        '<div class="ai-suggest-meta">Aprobar marca el texto como revisado por ' + esc(nameOf('u-lawyer')) + ' y habilita el envío a firma. Nada se firma sin este paso.</div></div>';
    }
    CONTRACT_GROUPS.forEach(function (g) {
      var items = ks.filter(function (k) { return groupOf(k).id === g.id; });
      if (!items.length && g.id !== 'escritura') return;
      html += '<section class="card"><div class="ops-group"><div class="ops-group-head"><h3>' + esc(g.label) + '</h3><span class="muted small">' + items.length + '</span></div>';
      if (!items.length) html += '<p class="small muted">Sin escrituras en curso. La próxima: Promesa Esmeraldal → Notaría 15 de Medellín, 30 nov 2026. La minuta se genera desde la promesa firmada.</p>';
      else html += '<div class="ops-rows">' + items.map(function (k) { return contractRow(ctx, k); }).join('') + '</div>';
      html += '</div></section>';
    });
    return html + '</div>';
  }
  function clauseHtml(ctx, k, c, idx) {
    var thread = (S.comments[k.id] && S.comments[k.id][c.key]) || [];
    var canDecide = canApproveLegal(ctx) || isRole(ctx, 'broker', 'sales_admin', 'rental_admin');
    return '<article class="ops-clause' + (c.ai ? ' is-ai' : '') + '" id="clause-' + esc(c.key) + '">' +
      '<div class="ops-clause-head"><h4><span class="n">' + (idx + 1) + '.</span> ' + esc(c.title) + (c.ai ? aiBadge('AI · propuesta') : '') + '</h4>' +
      '<div class="row"><span class="small muted">Propuesto por ' + esc(c.by) + '</span>' + badge(c.status === 'aceptado' ? 'firmado' : c.status === 'rechazado' ? 'rechazado' : 'pendiente', c.status === 'aceptado' ? 'Aceptado' : c.status === 'rechazado' ? 'Rechazado' : 'Pendiente') + '</div></div>' +
      '<div class="ops-redline ops-diff"><div><span class="eyebrow">Versión anterior · v' + Math.max(1, k.version - 1) + '</span>' + c.prev + '</div><div><span class="eyebrow">Propuesta · v' + k.version + '</span>' + c.next + '</div></div>' +
      '<div class="ops-clause-foot"><span class="small muted">' + (thread.length ? thread.length + ' comentario' + (thread.length > 1 ? 's' : '') : 'Sin comentarios') + '</span>' +
      (c.status === 'pendiente' && canDecide ? '<div class="row"><button class="btn btn-primary btn-sm" data-action="ops.redline-accept" data-id="' + k.id + '" data-key="' + esc(c.key) + '">' + ic('check') + ' Aceptar propuesta</button><button class="btn btn-secondary btn-sm" data-action="ops.redline-reject" data-id="' + k.id + '" data-key="' + esc(c.key) + '">Mantener anterior</button></div>' : '') + '</div>' +
      '<div class="ops-thread">' + thread.map(function (m) {
        var isAi = m.who === 'ai';
        return '<div class="ops-comment' + (isAi ? ' is-ai' : '') + '">' + (isAi ? '<span class="avatar avatar-sm">AI</span>' : avatar(m.who)) + '<div><b>' + esc(isAi ? 'Llave' : nameOf(m.who)) + '</b><span class="when">' + fdate(m.at) + '</span>' + (isAi ? ' ' + aiBadge('AI') : '') + '<p>' + esc(m.text) + '</p></div></div>';
      }).join('') +
      '<div class="ops-comment-form"><input class="input input-sm" id="cmt-' + esc(k.id) + '-' + esc(c.key) + '" placeholder="Comentar esta cláusula…" aria-label="Comentario"><button class="btn btn-secondary btn-sm" data-action="ops.comment-add" data-id="' + k.id + '" data-key="' + esc(c.key) + '">' + ic('send') + ' Enviar</button></div></div>' +
      '</article>';
  }
  function renderContractDetail(ctx, k) {
    var l = listing(k.listingId), d = deal(k.dealId);
    var clauses = clausesFor(k);
    var open = clauses.filter(function (c) { return c.status === 'pendiente'; }).length;
    var allSigned = k.signers.every(function (s) { return s.status === 'firmado'; });
    var anyPending = k.signers.some(function (s) { return s.status === 'pendiente'; });
    var actions = '';
    if (!k.lawyerApproved && canApproveLegal(ctx)) actions += '<button class="btn btn-primary" data-action="ops.contract-approve" data-id="' + k.id + '">' + ic('shield') + ' Aprobar texto (revisión legal)</button>';
    if (k.lawyerApproved && anyPending && isStaff(ctx)) actions += '<button class="btn btn-primary" data-action="ops.contract-send" data-id="' + k.id + '">' + ic('send') + ' Enviar a firma</button>';
    actions += '<button class="btn btn-secondary" data-action="ops.contract-pdf" data-id="' + k.id + '">' + ic('download') + ' PDF</button>';
    var html = '<div class="ops-page">';
    html += pageHeader(esc(k.type) + ' <span class="muted" style="font-weight:400">v' + k.version + '</span>',
      esc(l ? l.title + ' · ' + l.barrio + ', ' + l.city : '') + (d ? ' · <a href="' + esc(route(ctx, 'money', d.id)) + '">' + esc(d.title) + '</a>' : ''),
      actions, { href: route(ctx, 'contracts'), label: 'Contratos' });
    html += '<div class="row">' + badge(k.status) + (k.aiDrafted ? aiBadge(k.lawyerApproved ? 'Redactado por Llave · aprobado por abogado' : 'Redactado por Llave · pendiente de abogado') : pill('Redacción manual')) +
      (k.lawyerApproved ? '<span class="ops-check-ok">' + ic('check') + ' Revisión legal · ' + esc(nameOf('u-lawyer')) + '</span>' : '<span class="ops-check-wait">' + ic('clock') + ' Sin revisión legal</span>') +
      pill(k.clauses + ' cláusulas') + (open ? pill(open + ' redlines abiertos', 'warn') : pill('Sin redlines abiertos', 'success')) + '</div>';
    if (!k.lawyerApproved && k.aiDrafted) html += '<div class="callout callout-warn">' + ic('alert-triangle') + '<span><b>Borrador de Llave.</b> ' + (k.note ? esc(k.note) + ' · ' : '') + 'Acepta o rechaza cada propuesta; el texto solo puede enviarse a firma después de la aprobación de ' + esc(nameOf('u-lawyer')) + '.</span></div>';
    html += '<div class="ops-detail"><div class="stack">';
    html += '<section><div class="ops-group-head" style="margin-bottom:var(--s-3)"><h3>Redlines · versión anterior vs. propuesta</h3><span class="small muted">' + clauses.length + ' cláusulas con cambios</span></div>' + clauses.map(function (c, i) { return clauseHtml(ctx, k, c, i); }).join('') + '</section>';
    html += card('Historial de negociación', '<ul class="timeline">' + contractLog(k).map(function (e) {
      return '<li class="timeline-item' + (e.done ? ' is-done' : '') + (e.current ? ' is-current' : '') + (e.ai ? ' is-ai' : '') + '"><div class="timeline-time">' + (e.at ? fdate(e.at, 'default') : 'Próximo') + '</div><div class="timeline-title">' + esc(e.title) + (e.ai ? ' ' + aiBadge('AI') : '') + '</div>' + (e.body ? '<div class="timeline-body">' + esc(e.body) + '</div>' : '') + '</li>';
    }).join('') + '</ul>');
    html += '</div><aside class="ops-aside">';
    // e-sign panel
    html += card('Firma electrónica', '<div class="stack stack-sm">' + k.signers.map(function (s) {
      var name = s.userId ? nameOf(s.userId) : s.name;
      return '<div class="row row-between"><span class="row">' + avatar(s.userId || name) + '<span><b class="small">' + esc(name) + '</b><span class="xs muted" style="display:block">' + (s.at ? 'Firmó ' + fdate(s.at) : STATUS_LABEL[s.status]) + '</span></span></span>' +
        (s.status === 'firmado' ? '<span class="ops-check-ok">' + ic('check') + ' Firmado</span>' : s.status === 'enviado' ? '<button class="btn btn-ghost btn-sm" data-action="ops.contract-sign" data-id="' + k.id + '" data-signer="' + esc(s.userId || s.name) + '" title="Simular firma (demo)">Recordar</button>' : badge('pendiente')) + '</div>';
    }).join('') + '</div>' +
      (allSigned ? '<div class="callout callout-success" style="margin-top:var(--s-3)">' + ic('check') + '<span>Todas las partes firmaron. Sobre archivado con sello de tiempo.</span></div>' :
        '<div class="row" style="margin-top:var(--s-4)">' + (k.lawyerApproved ? '<button class="btn btn-primary btn-sm btn-block" data-action="ops.contract-send" data-id="' + k.id + '">' + ic('send') + ' ' + (anyPending ? 'Enviar a firma' : 'Reenviar recordatorio') + '</button>' : '<button class="btn btn-secondary btn-sm btn-block" disabled title="Requiere aprobación legal">' + ic('send') + ' Enviar a firma</button>') + '</div>' +
        (!k.lawyerApproved ? '<p class="xs muted" style="margin-top:var(--s-2)">Se habilita cuando ' + esc(nameOf('u-lawyer')) + ' aprueba el texto.</p>' : '')));
    // clause library
    var tag = /promesa|oferta/i.test(k.type) ? 'promesa' : /arrend|inventario/i.test(k.type) ? 'arriendo' : 'corretaje';
    var lib = S.clauseLibrary.filter(function (c) { return c.tags.indexOf(tag) >= 0; });
    html += card('Biblioteca de cláusulas', '<p class="xs muted" style="margin-bottom:var(--s-3)">Textos pre-aprobados por ' + esc(nameOf('u-lawyer')) + '. Llave solo redacta con estas piezas; insertar una no requiere nueva revisión.</p><div class="ops-lib">' + lib.map(function (c) {
      return '<div class="ops-lib-item"><div><div class="t">' + esc(c.title) + '</div><div class="m">Aprobada ' + fdate(c.updated) + ' · ' + c.tags.join(', ') + '</div></div>' + (isStaff(ctx) ? '<button class="btn btn-ghost btn-sm" data-action="ops.clause-insert" data-id="' + k.id + '" data-clause="' + c.id + '" title="' + esc(c.text) + '">' + ic('plus') + '</button>' : '') + '</div>';
    }).join('') + '</div>' + (isRole(ctx, 'lawyer', 'owner') ? '<button class="btn btn-secondary btn-sm btn-block" style="margin-top:var(--s-3)" data-action="ops.clause-new">' + ic('plus') + ' Nueva cláusula</button>' : ''), '<span class="pill">' + lib.length + '</span>');
    html += card('Ficha', '<div class="ops-statement"><div><span class="muted">Tipo</span><b>' + esc(k.type) + '</b></div><div><span class="muted">Versión</span><b>v' + k.version + '</b></div><div><span class="muted">Cláusulas</span><b>' + k.clauses + '</b></div>' + (k.termMonths ? '<div><span class="muted">Vigencia</span><b>' + k.termMonths + ' meses</b></div>' : '') + (k.exclusive != null ? '<div><span class="muted">Exclusividad</span><b>' + (k.exclusive ? 'Sí' : 'No') + '</b></div>' : '') + (d && d.kind === 'venta' ? '<div><span class="muted">Precio</span><b>' + money(d.agreedPrice || d.offerPrice || d.askingPrice) + '</b></div>' : '') + (d && d.monthlyRent ? '<div><span class="muted">Canon</span><b>' + money(d.monthlyRent) + ' / mes</b></div>' : '') + '</div>');
    html += '</aside></div></div>';
    return html;
  }
  L.register('contracts', {
    title: 'Contracts', titleEs: 'Contratos', icon: ic('file-text'),
    render: function (ctx) {
      if (ctx.id) { var k = D.byId(D.contracts, ctx.id); if (k) return renderContractDetail(ctx, k); }
      return renderContractsList(ctx);
    }
  });

  var TEMPLATES = [
    { id: 't-corr-venta', title: 'Acuerdo de corretaje · venta', m: 'Exclusividad, comisión 3–4 % + IVA, vigencia 6 meses, gastos de marketing', type: 'Acuerdo de corretaje · venta', clauses: 14, tag: 'corretaje' },
    { id: 't-corr-arr', title: 'Acuerdo de corretaje · arriendo', m: 'Fee de colocación 1 canon, administración 8–10 % + IVA', type: 'Acuerdo de corretaje · arriendo', clauses: 16, tag: 'corretaje' },
    { id: 't-promesa', title: 'Promesa de compraventa', m: 'Arras 10 %, notaría, entrega sujeta a registro, origen de fondos', type: 'Promesa de compraventa', clauses: 18, tag: 'promesa' },
    { id: 't-arr', title: 'Contrato de arrendamiento · vivienda', m: 'Ley 820: canon, depósito/afianzadora, IPC, cláusula penal 1 canon', type: 'Contrato de arrendamiento · vivienda', clauses: 22, tag: 'arriendo' },
    { id: 't-arr-com', title: 'Contrato de arrendamiento · comercial', m: 'Código de Comercio, término 3 años, IPC + puntos, garantías', type: 'Contrato de arrendamiento · comercial', clauses: 24, tag: 'arriendo' },
    { id: 't-inv', title: 'Inventario de entrada / salida', m: 'Se genera desde las fotos del recorrido con Llave', type: 'Inventario de entrada', clauses: 0, tag: 'arriendo' },
    { id: 't-esc', title: 'Minuta de escritura pública', m: 'Se genera desde la promesa firmada para la notaría', type: 'Minuta de escritura pública', clauses: 12, tag: 'promesa' }
  ];
  function templateModal(ctx) {
    var deals = visibleDeals(ctx);
    return '<div class="stack">' +
      '<div class="ops-tpl">' + TEMPLATES.map(function (t, i) { return '<label><input type="radio" name="ops-tpl" value="' + t.id + '"' + (i === 0 ? ' checked' : '') + '><span><div class="t">' + esc(t.title) + '</div><div class="m">' + esc(t.m) + ' · ' + (t.clauses || '—') + ' cláusulas</div></span></label>'; }).join('') + '</div>' +
      '<div class="field"><label class="label" for="ops-tpl-deal">Negocio</label><select class="select" id="ops-tpl-deal">' + deals.map(function (d) { return '<option value="' + d.id + '">' + esc(d.title) + '</option>'; }).join('') + '</select><span class="hint">Llave toma precio, partes, fechas y reparto del negocio para llenar la plantilla.</span></div>' +
      '<div class="callout">' + ic('sparkles') + '<span>El resultado nace como <b>borrador de Llave</b> y queda en la cola de revisión de ' + esc(nameOf('u-lawyer')) + '. Solo se puede enviar a firma tras su aprobación.</span></div>' +
      '<div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" data-action="ops.template-create">' + ic('sparkles') + ' Generar borrador</button></div></div>';
  }

  /* ================================================================ PAPERWORK */
  var DOC_TEMPLATES = [
    { id: 'chk-venta-apto', title: 'Checklist venta apartamento', kind: 'venta', items: [['Certificado de tradición y libertad (< 30 días)', 'seller'], ['Paz y salvo de administración', 'seller'], ['Impuesto predial pagado', 'seller'], ['Escritura pública anterior', 'seller'], ['Cédula de ciudadanía · vendedor', 'seller'], ['Cédula de ciudadanía · comprador', 'buyer'], ['Carta de pre-aprobación de crédito', 'buyer'], ['Declaración de origen de fondos', 'buyer'], ['Avalúo comercial', 'agency'], ['RUT', 'seller']] },
    { id: 'chk-arriendo', title: 'Checklist arriendo', kind: 'arriendo', items: [['Cédula / pasaporte · arrendatario', 'renter'], ['Extractos bancarios (3 meses)', 'renter'], ['Certificado laboral o RUT', 'renter'], ['Codeudor o póliza de afianzadora', 'renter'], ['Certificado de tradición y libertad', 'landlord'], ['RUT · propietario', 'landlord'], ['Paz y salvo de administración', 'landlord'], ['Inventario fotográfico firmado', 'agency']] },
    { id: 'chk-finca', title: 'Checklist finca / lote rural', kind: 'venta', items: [['Certificado de tradición y libertad', 'seller'], ['Escritura pública anterior', 'seller'], ['Plano topográfico y linderos', 'seller'], ['Certificado de uso del suelo (Planeación)', 'seller'], ['Impuesto predial pagado', 'seller'], ['Concesión de aguas / servidumbres', 'seller'], ['Paz y salvo de valorización', 'seller'], ['Declaración de origen de fondos', 'buyer'], ['Avalúo comercial rural', 'agency']] }
  ];
  function docsVisible(ctx) {
    var u = actingUser(ctx);
    var docs = D.documents.slice();
    if (isRole(ctx, 'broker')) docs = docs.filter(function (x) { var d = deal(x.dealId), l = listing(x.listingId); return (d && userInDeal(d, u.id)) || (l && l.listedBy === u.id); });
    if (isRole(ctx, 'lender')) docs = docs.filter(function (x) { var d = deal(x.dealId); return d && d.parties.lender === u.id && x.owedBy === 'buyer'; });
    if (isRole(ctx, 'rental_admin')) docs = docs.filter(function (x) { var d = deal(x.dealId), l = listing(x.listingId); return (d && d.kind === 'arriendo') || (l && l.operacion === 'arriendo'); });
    return docs;
  }
  function docGroups(docs) {
    var groups = {};
    docs.forEach(function (x) {
      var key = x.dealId || ('lst:' + x.listingId);
      if (!groups[key]) {
        var d = deal(x.dealId), l = listing(x.listingId);
        groups[key] = { key: key, dealId: x.dealId, deal: d, listing: l, title: d ? d.title : 'Captación · ' + (l ? l.title : ''), docs: [] };
      }
      groups[key].docs.push(x);
    });
    return Object.keys(groups).map(function (k) { return groups[k]; });
  }
  function docActions(ctx, x) {
    var out = '';
    var staff = isStaff(ctx) || isRole(ctx, 'lender');
    if (x.status === 'pendiente' || x.status === 'vencido') {
      out += '<button class="btn btn-ghost btn-sm" data-action="ops.doc-upload" data-id="' + x.id + '" title="Subir archivo (demo)">' + ic('upload-cloud') + '</button>';
      if (staff) out += '<button class="btn btn-secondary btn-sm" data-action="ops.doc-remind" data-id="' + x.id + '">' + ic('message-circle') + ' WhatsApp</button>';
    } else if (x.status === 'recibido' && staff) {
      out += '<button class="btn btn-primary btn-sm" data-action="ops.doc-validate" data-id="' + x.id + '">' + ic('check') + ' Validar</button>';
    } else if (x.status === 'validado') {
      out += '<span class="ops-check-ok">' + ic('check') + ' OK</span>';
    }
    return out;
  }
  function renderPaperwork(ctx) {
    var docs = docsVisible(ctx);
    var tab = S.tab.paperwork || 'deals';
    var counts = { validado: 0, recibido: 0, pendiente: 0, vencido: 0 };
    docs.forEach(function (x) { counts[x.status] = (counts[x.status] || 0) + 1; });
    var html = '<div class="ops-page">';
    html += pageHeader('Documentos', 'Checklist por negocio. Llave lee cada archivo (OCR), verifica nombres y vigencias y redacta el recordatorio; una persona valida.',
      isStaff(ctx) ? '<button class="btn btn-secondary" data-action="ops.tab" data-module="paperwork" data-tab="templates">' + ic('files') + ' Plantillas</button>' : '');
    html += '<div class="ops-kpis">' + statCard('Validados', counts.validado) + statCard('Recibidos · por validar', counts.recibido) + statCard('Pendientes', counts.pendiente) + statCard('Vencidos', '<span style="color:var(--' + (counts.vencido ? 'danger' : 'text') + ')">' + counts.vencido + '</span>') + '</div>';
    html += tabs(ctx, 'paperwork', [{ id: 'deals', label: 'Por negocio', count: docGroups(docs).length }, { id: 'templates', label: 'Plantillas', count: DOC_TEMPLATES.length }], tab);
    if (tab === 'templates') {
      html += '<div class="grid grid-3">' + DOC_TEMPLATES.map(function (t) {
        return '<section class="card"><div class="card-header"><h2 class="card-title">' + esc(t.title) + '</h2>' + pill(t.items.length + ' docs') + '</div><ul class="ops-muted-list">' + t.items.map(function (it) { return '<li>' + esc(it[0]) + ' <span class="muted">· ' + esc(partyLabel(it[1])) + '</span></li>'; }).join('') + '</ul>' +
          (isStaff(ctx) ? '<button class="btn btn-secondary btn-sm btn-block" style="margin-top:var(--s-4)" data-action="ops.doc-template" data-id="' + t.id + '">Aplicar a un negocio</button>' : '') + '</section>';
      }).join('') + '</div>';
      return html + '</div>';
    }
    var groups = docGroups(docs);
    if (!groups.length) html += empty('No hay documentos asignados a tus negocios.');
    groups.forEach(function (g) {
      var done = g.docs.filter(function (x) { return x.status === 'validado'; }).length;
      var overdue = g.docs.filter(function (x) { return x.status === 'vencido'; }).length;
      html += '<section class="card card-pad-0"><div style="padding:var(--s-4) var(--s-5)"><div class="card-header" style="margin-bottom:var(--s-2)"><div><h2 class="card-title">' + esc(g.title) + '</h2><span class="small muted">' + esc(g.listing ? g.listing.barrio + ', ' + g.listing.city : '') + (g.deal ? ' · ' + esc(g.deal.kind === 'venta' ? 'Venta' : 'Arriendo') + ' · ' + badge(g.deal.status) : '') + '</span></div>' +
        '<div class="row">' + (overdue ? pill(overdue + ' vencido' + (overdue > 1 ? 's' : ''), 'danger') : '') + (g.deal ? '<a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'money', g.deal.id)) + '">Ver negocio</a>' : '') + '</div></div>' + progressLine(done, g.docs.length) + '</div>' +
        '<div class="table-wrap" style="border:0;border-radius:0;border-top:1px solid var(--border)"><table class="table"><thead><tr><th>Documento</th><th>Debe entregar</th><th>Vence</th><th>Estado</th><th>Verificación Llave</th><th></th></tr></thead><tbody>' +
        g.docs.map(function (x) {
          var du = daysUntil(x.due);
          return '<tr><td><b>' + esc(x.name) + '</b>' + (x.file ? '<span class="xs muted" style="display:block">' + esc(x.file) + '</span>' : '') + (S.docReminders[x.id] ? '<span class="xs muted" style="display:block">Recordatorio enviado ' + fdate(S.docReminders[x.id]) + '</span>' : '') + '</td>' +
            '<td><span class="row" style="gap:6px">' + (partyOf(g.deal, x.owedBy) ? avatar(partyOf(g.deal, x.owedBy)) : '') + '<span><b class="small">' + esc(partyLabel(x.owedBy)) + '</b><span class="xs muted" style="display:block">' + esc(partyName(g.deal, x.owedBy)) + '</span></span></span></td>' +
            '<td class="small' + (du != null && du < 0 && x.status !== 'validado' ? '" style="color:var(--danger)' : '') + '">' + (x.due ? fdate(x.due) + (du != null && x.status !== 'validado' ? '<span class="xs muted" style="display:block">' + (du < 0 ? 'hace ' + (-du) + ' d' : 'en ' + du + ' d') + '</span>' : '') : '—') + '</td>' +
            '<td>' + badge(x.status) + '</td>' +
            '<td>' + (x.aiCheck ? '<span class="ops-aicheck">' + esc(x.aiCheck) + '</span>' : '<span class="xs muted">—</span>') + '</td>' +
            '<td><div class="ops-table-actions">' + docActions(ctx, x) + '</div></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div style="padding:var(--s-4) var(--s-5)"><div class="ops-drop" data-action="ops.doc-drop" data-key="' + esc(g.key) + '" role="button" tabindex="0">' + ic('upload-cloud') + '<span><b>Arrastra el PDF o la foto aquí</b> o haz clic para subir</span><span class="xs">Llave lo clasifica, extrae nombre, matrícula y vigencia, y lo deja en "recibido" para validar.</span></div></div></section>';
    });
    return html + '</div>';
  }
  L.register('paperwork', { title: 'Paperwork', titleEs: 'Documentos', icon: ic('files'), render: renderPaperwork });

  function reminderDrawer(x) {
    var d = deal(x.dealId), l = listing(x.listingId);
    var who = partyName(d, x.owedBy);
    var first = who.split(' ')[0];
    var msg = 'Hola ' + first + ', soy Llave, la asistente de Dorum Lifestyle. Para avanzar con ' + (d ? (d.kind === 'venta' ? 'la promesa de ' : 'el contrato de ') : 'el proceso de ') + (l ? l.title : 'tu inmueble') + ' nos falta: *' + x.name + '*' + (x.due ? ' (lo necesitamos antes del ' + fdate(x.due, 'default') + ')' : '') + '. Puedes enviarlo por este chat o subirlo aquí: dorum.llave.app/d/' + x.id + '. ¡Gracias!';
    return '<div class="ops-drawer-form"><div class="row"><b>' + esc(x.name) + '</b>' + badge(x.status) + '</div>' +
      '<p class="small muted">Para: ' + esc(who) + ' · ' + esc(partyLabel(x.owedBy)) + (partyOf(d, x.owedBy) && D.user(partyOf(d, x.owedBy)) ? ' · ' + esc(D.user(partyOf(d, x.owedBy)).phone) : '') + '</p>' +
      '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · recordatorio por WhatsApp</div>' +
      '<div class="ai-suggest-body"><textarea class="textarea" id="ops-remind-text" rows="6" style="width:100%">' + esc(msg) + '</textarea></div>' +
      '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="ops.doc-remind-send" data-id="' + x.id + '">' + ic('send') + ' Aprobar y enviar</button><button class="btn btn-ghost btn-sm" data-action="ops.close-drawer">Descartar</button></div>' +
      '<div class="ai-suggest-meta">Tono según el idioma del contacto · incluye enlace de carga seguro · se registra en el expediente</div></div></div>';
  }
  function docTemplateModal(t) {
    var deals = D.deals.filter(function (d) { return d.kind === t.kind; });
    return '<div class="stack"><p class="small muted">' + esc(t.title) + ' · ' + t.items.length + ' documentos. Se crean solo los que falten en el negocio.</p>' +
      '<div class="field"><label class="label" for="ops-doc-deal">Negocio</label><select class="select" id="ops-doc-deal">' + deals.map(function (d) { return '<option value="' + d.id + '">' + esc(d.title) + '</option>'; }).join('') + '</select></div>' +
      '<div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" data-action="ops.doc-template-apply" data-id="' + t.id + '">Crear checklist</button></div></div>';
  }

  /* ==================================================================== MONEY */
  function pendingReleases() { return D.payouts.filter(function (p) { return p.status === 'pendiente' && p.kind === 'egreso' && !p.projected; }); }
  function paidThisMonth() { return D.payouts.filter(function (p) { return p.status === 'pagado' && p.kind === 'egreso' && monthOf(p.date) === monthOf(TODAY); }); }
  function payoutsForDeal(id) { return D.payouts.filter(function (p) { return p.dealId === id; }); }
  function accountLabel(a) { return ({ escrow: 'Escrow (custodia)', operating: 'Operativa', payroll: 'Nómina' })[a] || a; }
  function dealStageLabel(d) { var s = D.byId(D.pipelineStages, d.stage); return s ? s.label : d.stage; }
  function dealGross(d) { return D.computeSplit(d).gross; }
  function dealsFilterFor(ctx) { return visibleDeals(ctx); }
  function releaseButton(ctx, p) {
    if (p.status === 'pagado') return '<span class="ops-check-ok">' + ic('check') + ' Pagado</span>';
    if (p.projected) return '<span class="xs muted">Proyectado</span>';
    if (p.kind === 'ingreso') return p.status === 'pendiente' ? '<span class="xs muted">Por recibir</span>' : '';
    if (canApproveMoney(ctx)) return '<button class="btn btn-primary btn-sm" data-action="ops.release-open" data-id="' + p.id + '">' + ic('banknote') + ' Liberar</button>';
    return '<span class="xs muted">Requiere contadora</span>';
  }
  function renderMoneyList(ctx) {
    var tab = S.tab.money || 'deals';
    var deals = dealsFilterFor(ctx);
    var pend = pendingReleases();
    var es = D.escrowSummary;
    var lastPayroll = D.payouts.filter(function (p) { return p.account === 'payroll' && p.status === 'pagado'; }).sort(function (a, b) { return b.date < a.date ? -1 : 1; })[0];
    var html = '<div class="ops-page">';
    html += pageHeader('Dinero', 'Custodia (escrow), liberaciones y reparto de cada negocio. Llave calcula; ' + esc(nameOf('u-acct')) + ' libera.',
      '<button class="btn btn-secondary" data-action="ops.ledger-export">' + ic('download') + ' Exportar libro</button>');
    html += '<div class="ops-kpis">' +
      statCard('En custodia (escrow)', moneyC(es.held), 'Bancolombia · ' + D.deals.filter(function (d) { return d.escrow && d.escrow.held > 0; }).length + ' negocios') +
      statCard('Por liberar', moneyC(sum(pend, function (p) { return p.amount; })), pend.length + ' liberación' + (pend.length !== 1 ? 'es' : '') + ' pendiente' + (pend.length !== 1 ? 's' : '')) +
      statCard('Pagado este mes', moneyC(sum(paidThisMonth(), function (p) { return p.amount; })), paidThisMonth().length + ' pagos · ' + fdate(TODAY, 'default').replace(/\d+ /, '')) +
      statCard('Nómina', moneyC(lastPayroll ? lastPayroll.amount : 0), (lastPayroll ? 'Pagada ' + fdate(lastPayroll.date) : '—') + ' · próxima 30 sep') + '</div>';
    if (pend.length && tab === 'deals') {
      html += card('Liberaciones pendientes', '<div class="ops-rows">' + pend.map(function (p) {
        var d = deal(p.dealId);
        var overT = p.amount > es.approvalThreshold;
        return '<div class="ops-row"><div><div class="t">' + esc(p.concept) + '</div><div class="m"><span>' + esc(accountLabel(p.account)) + '</span><span>·</span><span>Para ' + esc(nameOf(p.counterparty)) + '</span><span>·</span><span>Fecha ' + fdate(p.date) + '</span>' + (overT ? pill('> umbral · requiere ' + D.OWNER_NAME.split(' ')[0], 'warn') : '') + '</div></div>' +
          '<div class="money" style="font-weight:600">' + money(p.amount) + (d ? '<span class="xs muted" style="display:block;font-weight:400">' + esc(d.title) + '</span>' : '') + '</div><div class="row" style="justify-content:flex-end">' + releaseButton(ctx, p) + '</div></div>';
      }).join('') + '</div>', pill(pend.length + '', 'warn'));
    }
    html += tabs(ctx, 'money', [{ id: 'deals', label: 'Negocios', count: deals.length }, { id: 'ledger', label: 'Libro mayor', count: D.payouts.length }], tab);
    if (tab === 'ledger') return html + renderLedger(ctx) + '</div>';
    html += '<div class="table-wrap"><table class="table"><thead><tr><th>Negocio</th><th>Tipo</th><th>Etapa</th><th class="num">Bruto a repartir</th><th style="min-width:180px">Reparto</th><th class="num">En custodia</th><th></th></tr></thead><tbody>' +
      deals.map(function (d) {
        var sp = D.computeSplit(d);
        return '<tr><td><a href="' + esc(route(ctx, 'money', d.id)) + '"><b>' + esc(d.title) + '</b></a><span class="xs muted" style="display:block">' + esc(dealShort(d)) + '</span></td>' +
          '<td>' + pill(d.kind === 'venta' ? 'Venta' : (d.rentalType === 'vacacional' ? 'Renta vacacional' : 'Arriendo'), d.kind === 'venta' ? 'brand' : 'info') + '</td>' +
          '<td>' + badge(d.status, dealStageLabel(d)) + '</td>' +
          '<td class="num"><b>' + money(sp.gross) + '</b><span class="xs muted" style="display:block">' + (d.kind === 'venta' ? 'comisión ' + d.commissionPct + ' %' : (d.nightlyRate ? 'renta mensual est.' : 'canon mensual')) + '</span></td>' +
          '<td>' + splitBar(sp.rows, sp.gross, true) + '<span class="xs muted">' + sp.rows.length + ' reglas · ' + uniq(sp.rows.map(function (r) { return r.participant; })).length + ' participantes</span></td>' +
          '<td class="num">' + (d.escrow && d.escrow.held ? '<b>' + money(d.escrow.held) + '</b>' : '<span class="muted">—</span>') + (d.escrow && d.escrow.expected && d.escrow.expected !== d.escrow.held ? '<span class="xs muted" style="display:block">esperado ' + moneyC(d.escrow.expected) + '</span>' : '') + '</td>' +
          '<td><a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'money', d.id)) + '">Ver reparto</a></td></tr>';
      }).join('') + '</tbody></table></div>';
    return html + '</div>';
  }
  function renderLedger(ctx) {
    var acc = S.ledgerAccount;
    var rows = D.payouts.filter(function (p) { return acc === 'all' || p.account === acc; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var ins = sum(rows.filter(function (p) { return p.kind === 'ingreso' && p.status === 'pagado'; }), function (p) { return p.amount; });
    var outs = sum(rows.filter(function (p) { return p.kind === 'egreso' && p.status === 'pagado'; }), function (p) { return p.amount; });
    var html = '<div class="ops-tabs-row"><div class="ops-chips">' + [['all', 'Todas las cuentas'], ['escrow', 'Escrow'], ['operating', 'Operativa'], ['payroll', 'Nómina']].map(function (a) { return '<button class="chip' + (acc === a[0] ? ' is-active' : '') + '" data-action="ops.ledger-filter" data-account="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div>' +
      '<span class="small muted num">Ingresos ' + moneyC(ins) + ' · Egresos ' + moneyC(outs) + ' · ' + rows.length + ' movimientos</span></div>';
    html += '<div class="table-wrap"><table class="table"><thead><tr><th>Fecha</th><th>Cuenta</th><th>Concepto</th><th>Contraparte</th><th class="num">Monto</th><th>Estado</th><th></th></tr></thead><tbody>' + rows.map(function (p) {
      var d = deal(p.dealId);
      return '<tr' + (p.projected ? ' style="opacity:0.7"' : '') + '><td class="small num">' + fdate(p.date, 'default') + '</td><td>' + pill(accountLabel(p.account).split(' ')[0], p.account === 'escrow' ? 'brand' : p.account === 'payroll' ? 'warn' : '') + '</td>' +
        '<td><b class="small">' + esc(p.concept) + '</b>' + (d ? '<a class="xs muted" style="display:block" href="' + esc(route(ctx, 'money', d.id)) + '">' + esc(d.title) + '</a>' : '') + '</td>' +
        '<td class="small">' + esc(nameOf(p.counterparty)) + '</td>' +
        '<td class="num ' + (p.kind === 'ingreso' ? 'ops-in' : 'ops-out') + '"><b>' + (p.kind === 'ingreso' ? '+' : '−') + money(p.amount) + '</b>' + (p.splitKind ? '<span class="xs muted" style="display:block">' + esc(kindLabel(p.splitKind)) + '</span>' : '') + '</td>' +
        '<td>' + badge(p.status) + (p.projected ? ' ' + pill('proyectado') : '') + '</td><td><div class="ops-table-actions">' + (p.kind === 'egreso' ? releaseButton(ctx, p) : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>';
    return html;
  }
  var SPLIT_TEMPLATES = {
    'co-listing': { label: 'Plantilla · 50/50 co-listing', apply: function (d) {
      var brokers = uniq([d.parties.listingBroker, d.parties.sellingBroker].filter(Boolean));
      if (brokers.length < 2) brokers = uniq(brokers.concat(D.usersByRole('broker').map(function (u) { return u.id; }))).slice(0, 2);
      return [{ participant: brokers[0], kind: 'commission', pct: 40, stage: 'at-close', note: 'Listing broker' }, { participant: brokers[1], kind: 'commission', pct: 40, stage: 'at-close', note: 'Selling broker' }, { participant: 'u-owner', kind: 'commission', pct: 20, stage: 'at-close', note: 'Agencia Dorum' }];
    } },
    'referido': { label: 'Plantilla · referido 20 %', apply: function (d) {
      var b = d.parties.listingBroker || 'u-brk-1';
      var ref = b === 'u-brk-3' ? 'u-brk-1' : 'u-brk-3';
      return [{ participant: ref, kind: 'referral', pct: 20, stage: 'at-close', note: 'Fee de referido (se descuenta antes del reparto)' }, { participant: b, kind: 'commission', pct: 50, stage: 'at-close' }, { participant: 'u-owner', kind: 'commission', pct: 50, stage: 'at-close', note: 'Agencia Dorum' }];
    } },
    'directo': { label: 'Plantilla · pago directo', apply: function (d) {
      var b = d.parties.listingBroker || 'u-brk-1';
      return [{ participant: b, kind: 'commission', pct: 100, stage: 'at-close', note: 'Pago directo · un participante' }];
    } }
  };
  function splitWarning(d) {
    var c = sum(d.split.filter(function (s) { return s.kind === 'commission' && s.pct != null; }), function (s) { return s.pct; });
    if (d.kind !== 'venta' && !d.split.some(function (s) { return s.kind === 'commission'; })) return '';
    if (Math.abs(c - 100) < 0.01) return '<div class="callout callout-success">' + ic('check') + '<span>Las reglas de comisión suman 100 %.</span></div>';
    return '<div class="callout callout-warn">' + ic('alert-triangle') + '<span>Las reglas de comisión suman <b>' + c + ' %</b>; deben sumar 100 % para poder liberar.</span></div>';
  }
  function splitViz(d) {
    var sp = D.computeSplit(d);
    var byP = {};
    sp.rows.forEach(function (r) { if (!byP[r.participant]) byP[r.participant] = { participant: r.participant, name: r.name, amount: 0, kind: r.kind, stage: r.stage, pct: null }; byP[r.participant].amount += r.amount; });
    var agg = Object.keys(byP).map(function (k) { return byP[k]; });
    agg.forEach(function (a) { a.pct = sp.gross ? Math.round(a.amount / sp.gross * 100) : null; });
    return '<div class="ops-split">' + splitBar(sp.rows, sp.gross, false) + stageKey() + splitLegend(sp.rows) +
      '<div class="row row-between small"><span class="muted">Bruto ' + money(sp.gross) + (sp.referral ? ' · referido −' + money(sp.referral) : '') + '</span><b class="num">Total repartido ' + money(sum(sp.rows, function (r) { return r.amount; })) + '</b></div></div>';
  }
  function renderDealMoney(ctx, d) {
    var l = dealListing(d), sp = D.computeSplit(d);
    var rows = payoutsForDeal(d.id).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var inEscrow = sum(rows.filter(function (p) { return p.account === 'escrow' && p.status === 'pagado'; }), function (p) { return (p.kind === 'ingreso' ? 1 : -1) * p.amount; });
    var canEdit = isRole(ctx, 'accountant', 'owner');
    var html = '<div class="ops-page">';
    html += pageHeader(esc(d.title), esc(l ? l.title + ' · ' + l.barrio + ', ' + l.city : '') + ' · ' + badge(d.status, dealStageLabel(d)),
      (canEdit ? '<button class="btn btn-secondary" data-action="ops.split-save" data-id="' + d.id + '">' + ic('check') + ' Guardar reglas</button>' : ''), { href: route(ctx, 'money'), label: 'Dinero' });
    html += '<div class="ops-kpis">' +
      statCard(d.kind === 'venta' ? 'Comisión bruta' : 'Renta mensual bruta', moneyC(sp.gross), d.kind === 'venta' ? 'Sobre ' + moneyC(d.agreedPrice || d.offerPrice || d.askingPrice) + ' · ' + d.commissionPct + ' % + IVA ' + d.ivaPct + ' %' : (d.nightlyRate ? moneyC(d.nightlyRate) + '/noche · ocupación ' + d.occupancyPct + ' %' : 'Canon ' + money(d.monthlyRent))) +
      statCard('Referidos', moneyC(sp.referral), sp.referral ? 'Se descuenta antes de repartir' : 'Sin fee de referido') +
      statCard('En custodia', moneyC(Math.max(0, inEscrow || (d.escrow && d.escrow.held) || 0)), d.escrow && d.escrow.note ? esc(d.escrow.note) : '—') +
      statCard('Esperado en escrow', moneyC(d.escrow ? d.escrow.expected : 0), d.kind === 'venta' ? 'Arras al firmar promesa' : 'Depósito / reservas') + '</div>';
    html += '<div class="ops-detail"><div class="stack">';
    html += card('Reparto del negocio', '<div data-ops-splitviz>' + splitViz(d) + '</div>', pill(sp.rows.length + ' reglas'));
    html += card('Libro del negocio', rows.length ? '<div class="table-wrap"><table class="table table-compact"><thead><tr><th>Fecha</th><th>Concepto</th><th>Cuenta</th><th class="num">Monto</th><th>Estado</th><th></th></tr></thead><tbody>' + rows.map(function (p) {
      return '<tr><td class="small num">' + fdate(p.date, 'default') + '</td><td><b class="small">' + esc(p.concept) + '</b><span class="xs muted" style="display:block">' + esc(nameOf(p.counterparty)) + '</span></td><td>' + pill(accountLabel(p.account).split(' ')[0], p.account === 'escrow' ? 'brand' : '') + '</td><td class="num ' + (p.kind === 'ingreso' ? 'ops-in' : '') + '"><b>' + (p.kind === 'ingreso' ? '+' : '−') + money(p.amount) + '</b></td><td>' + badge(p.status) + (p.projected ? ' ' + pill('proyectado') : '') + '</td><td><div class="ops-table-actions">' + (p.kind === 'egreso' ? releaseButton(ctx, p) : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>' : empty('Sin movimientos todavía. El primer ingreso a escrow serán las arras al firmar la promesa.'));
    if (d.timeline && d.timeline.length) html += card('Hitos del negocio', '<ul class="timeline">' + d.timeline.map(function (t) { return '<li class="timeline-item' + (t.done ? ' is-done' : '') + (t.current ? ' is-current' : '') + (t.ai ? ' is-ai' : '') + '"><div class="timeline-time">' + (t.at ? fdate(t.at, 'default') : 'Próximo') + '</div><div class="timeline-title">' + esc(t.label) + (t.ai ? ' ' + aiBadge('AI') : '') + '</div></li>'; }).join('') + '</ul>');
    html += '</div><aside class="ops-aside">';
    html += card('Reglas de reparto', '<div id="ops-rules" data-deal="' + d.id + '">' + d.split.map(function (s, i) {
      return '<div class="ops-rule"><div class="ops-rule-name"><i class="ops-swatch" style="--c:' + participantColors(sp.rows)[s.participant] + '"></i><div><b class="small">' + esc(nameOf(s.participant)) + '</b><div class="m">' + esc(kindLabel(s.kind)) + ' · ' + esc(stageLabel(s.stage)) + '</div></div></div>' +
        (s.pct != null ? '<label class="input-group" style="padding:0 0.5rem"><input class="input ops-pct-input" type="number" min="0" max="100" step="1" value="' + s.pct + '" data-index="' + i + '" aria-label="Porcentaje ' + esc(nameOf(s.participant)) + '"' + (canEdit ? '' : ' disabled') + '><span class="xs muted">%</span></label>' : '<span class="small num" style="text-align:right">' + money(s.amount) + '</span>') + '</div>';
    }).join('') + '</div><div data-ops-splitwarn style="margin-top:var(--s-3)">' + splitWarning(d) + '</div>' +
      (canEdit ? '<div class="stack stack-sm" style="margin-top:var(--s-4)">' + Object.keys(SPLIT_TEMPLATES).map(function (k) { return '<button class="btn btn-secondary btn-sm btn-block" data-action="ops.split-template" data-id="' + d.id + '" data-template="' + k + '">' + esc(SPLIT_TEMPLATES[k].label) + '</button>'; }).join('') + '</div><p class="xs muted" style="margin-top:var(--s-3)">Escrow: liberar requiere aprobación de ' + esc(nameOf('u-acct')) + '; montos > ' + moneyC(D.escrowSummary.approvalThreshold) + ' también de ' + esc(D.OWNER_NAME) + '.</p>' : '<p class="xs muted" style="margin-top:var(--s-3)">Solo contabilidad y la propietaria editan las reglas.</p>'));
    html += card('Partes', '<div class="stack stack-sm">' + Object.keys(d.parties).filter(function (k) { return d.parties[k]; }).map(function (k) { return '<div class="row row-between"><span class="row">' + avatar(d.parties[k]) + '<span><b class="small">' + esc(nameOf(d.parties[k])) + '</b><span class="xs muted" style="display:block">' + esc(({ seller: 'Vendedor', buyer: 'Comprador', listingBroker: 'Broker captador', sellingBroker: 'Broker vendedor', lawyer: 'Abogado', lender: 'Crédito', landlord: 'Arrendador', renter: 'Arrendatario', rentalAdmin: 'Admin. arriendos' })[k] || k) + '</span></span></span></div>'; }).join('') + '</div>');
    html += '</aside></div></div>';
    return html;
  }
  L.register('money', {
    title: 'Money', titleEs: 'Dinero', icon: ic('wallet'),
    render: function (ctx) {
      if (ctx.id) { var d = deal(ctx.id); if (d) return renderDealMoney(ctx, d); }
      return renderMoneyList(ctx);
    },
    mount: function (el, ctx) {
      var rules = el.querySelector('#ops-rules');
      if (!rules) return;
      rules.addEventListener('input', function (e) {
        var inp = e.target.closest('.ops-pct-input'); if (!inp) return;
        var d = deal(rules.dataset.deal); if (!d) return;
        var i = +inp.dataset.index; var v = Math.max(0, Math.min(100, +inp.value || 0));
        d.split[i].pct = v;
        var viz = el.querySelector('[data-ops-splitviz]'); if (viz) viz.innerHTML = splitViz(d);
        var warn = el.querySelector('[data-ops-splitwarn]'); if (warn) warn.innerHTML = splitWarning(d);
      });
    }
  });
  function releaseModal(p) {
    var d = deal(p.dealId);
    var docs = d ? D.documents.filter(function (x) { return x.dealId === d.id; }) : [];
    var docsOk = docs.length > 0 && docs.every(function (x) { return x.status === 'validado'; });
    var k = d ? D.contracts.filter(function (c) { return c.dealId === d.id && c.status === 'firmado'; })[0] : null;
    var overT = p.amount > D.escrowSummary.approvalThreshold;
    var checks = [
      { id: 'c1', label: d && d.kind === 'venta' ? 'Escritura firmada en notaría' : 'Contrato firmado por todas las partes', m: k ? k.type + ' · firmado ' + fdate(k.updated) : 'Sin contrato firmado en el expediente', ok: !!k },
      { id: 'c2', label: 'Documentos del negocio validados', m: docs.length ? docs.filter(function (x) { return x.status === 'validado'; }).length + ' de ' + docs.length + ' validados' : 'Sin checklist de documentos (arriendo vacacional)', ok: docsOk || !docs.length },
      { id: 'c3', label: 'Monto y beneficiario verificados', m: money(p.amount) + ' → ' + nameOf(p.counterparty) + ' · cuenta ' + accountLabel(p.account), ok: false },
      { id: 'c4', label: overT ? 'Aprobación de ' + D.OWNER_NAME + ' (monto > ' + moneyC(D.escrowSummary.approvalThreshold) + ')' : 'Dentro del umbral de la contadora', m: overT ? 'Se solicitará firma adicional' : 'Umbral ' + moneyC(D.escrowSummary.approvalThreshold), ok: !overT }
    ];
    S.releaseChecks[p.id] = {};
    return '<div class="stack"><div class="row row-between"><div><b>' + esc(p.concept) + '</b><span class="small muted" style="display:block">' + (d ? esc(d.title) + ' · ' : '') + esc(accountLabel(p.account)) + '</span></div><span class="ops-hero-num" style="font-size:var(--fs-xl)">' + money(p.amount) + '</span></div>' +
      '<div class="ops-checklist">' + checks.map(function (c) { return '<label><input type="checkbox" data-ops-change="ops.release-check" data-id="' + p.id + '" data-check="' + c.id + '"' + (c.ok ? ' checked' : '') + '><span>' + esc(c.label) + '<span class="m">' + esc(c.m) + '</span></span></label>'; }).join('') + '</div>' +
      '<div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" id="ops-release-confirm" data-action="ops.release-confirm" data-id="' + p.id + '"' + (checks.every(function (c) { return c.ok; }) ? '' : ' disabled') + '>' + ic('banknote') + ' Liberar ' + moneyC(p.amount) + '</button></div></div>';
  }

  /* ================================================================= MY MONEY */
  function userRowsFromDeals(uid) {
    var out = [];
    D.deals.forEach(function (d) {
      var sp = D.computeSplit(d);
      sp.rows.forEach(function (r) {
        if (r.participant !== uid) return;
        var paid = D.payouts.filter(function (p) { return p.dealId === d.id && p.counterparty === uid && p.kind === 'egreso'; });
        var status = paid.some(function (p) { return p.status === 'pagado'; }) ? 'pagado' : paid.some(function (p) { return p.status === 'aprobado'; }) ? 'aprobado' : (d.status === 'vendido' || d.status === 'arrendado' ? 'pendiente' : 'proyectado');
        out.push({ deal: d, row: r, status: status, payout: paid[0] || null });
      });
    });
    return out;
  }
  function renderMyMoney(ctx) {
    var u = actingUser(ctx);
    var year = TODAY.slice(0, 4);
    var paid = D.payouts.filter(function (p) { return p.counterparty === u.id && p.kind === 'egreso' && p.status === 'pagado' && p.date.slice(0, 4) === year; });
    var upcoming = D.payouts.filter(function (p) { return p.counterparty === u.id && p.kind === 'egreso' && p.status !== 'pagado'; });
    var rows = userRowsFromDeals(u.id);
    var projected = rows.filter(function (r) { return r.status === 'proyectado'; });
    var hist = (S.earningsHistory[u.id] || [0, 0, 0, 0, 0, 0, 0, 0, 0]).slice();
    var months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep'];
    var paidYear = sum(hist);
    var isVendor = D.role(ctx.roleId) && D.role(ctx.roleId).group === 'vendor';
    var html = '<div class="ops-page">';
    html += pageHeader('Mis pagos', 'Hola ' + esc(u.name.split(' ')[0]) + '. ' + (isVendor ? 'Honorarios por orden, pagados desde la cuenta operativa al recibir la entrega.' : 'Comisiones por negocio, pagadas desde escrow al cierre. Lo proyectado depende de que el negocio cierre.'));
    html += '<div class="ops-kpis">' +
      statCard('Por cobrar', moneyC(sum(upcoming, function (p) { return p.amount; })), upcoming.length + ' pago' + (upcoming.length !== 1 ? 's' : '') + ' aprobado' + (upcoming.length !== 1 ? 's' : '') + ' o en cola') +
      statCard('Pagado en ' + year, moneyC(paidYear), paid.length + ' pagos registrados en Llave · histórico ' + ex()) +
      statCard('Proyectado al cierre', moneyC(sum(projected, function (r) { return r.row.amount; })), projected.length + ' negocio' + (projected.length !== 1 ? 's' : '') + ' abierto' + (projected.length !== 1 ? 's' : '')) +
      statCard('Promedio mensual', moneyC(Math.round(paidYear / 9)), 'ene–sep ' + year) + '</div>';
    html += '<div class="grid grid-2">';
    html += card('Ingresos mensuales · ' + year, barsSVG(hist, { labels: months, label: 'Ingresos mensuales', h: 140 }) + '<p class="xs muted" style="margin-top:var(--s-2)">Pagos recibidos por mes (COP). Barra resaltada: mes actual. Serie histórica de ejemplo para la demo.</p>');
    html += card('Próximos pagos', upcoming.length ? '<div class="ops-mini">' + upcoming.map(function (p) { var d = deal(p.dealId); return '<div class="ops-mini-row"><span class="t">' + esc(p.concept) + '<span class="m">' + (d ? esc(d.title) + ' · ' : '') + fdate(p.date, 'default') + '</span></span><span class="row"><span class="v">' + money(p.amount) + '</span>' + badge(p.status) + '</span></div>'; }).join('') + '</div>' : empty('No tienes pagos en cola. Los proyectados aparecen aquí cuando el negocio cierra.'),
      pill(upcoming.length + ''));
    html += '</div>';
    html += card('Detalle por negocio', rows.length ? '<div class="table-wrap"><table class="table"><thead><tr><th>Negocio</th><th>Concepto</th><th>Etapa de pago</th><th class="num">Monto</th><th>Estado</th></tr></thead><tbody>' + rows.map(function (r) {
      return '<tr><td><b class="small">' + esc(r.deal.title) + '</b><span class="xs muted" style="display:block">' + esc(dealShort(r.deal)) + '</span></td><td>' + pill(kindLabel(r.row.kind), kindVariant(r.row.kind)) + (r.row.note ? '<span class="xs muted" style="display:block">' + esc(r.row.note) + '</span>' : '') + '</td><td class="small">' + esc(stageLabel(r.row.stage)) + (r.row.pct != null ? ' · ' + r.row.pct + ' %' : '') + '</td><td class="num"><b>' + money(r.row.amount) + '</b></td><td>' + (r.status === 'proyectado' ? pill('Proyectado', 'info') : badge(r.status)) + '</td></tr>';
    }).join('') + '</tbody></table></div>' : empty('Aún no participas en el reparto de ningún negocio.'));
    html += '<div class="callout">' + ic('landmark') + '<span><b>Nota tributaria ' + ex() + '</b> · Sobre comisiones y honorarios Dorum practica <b>retención en la fuente</b> (tarifa según tu régimen, p. ej. 10–11 %). Si eres responsable de IVA, factura con <b>IVA 19 %</b>; la factura electrónica se reporta a la DIAN. Estos porcentajes son ilustrativos: confírmalos con ' + esc(nameOf('u-acct')) + '.</span></div>';
    return html + '</div>';
  }
  L.register('my-money', { title: 'My payouts', titleEs: 'Mis pagos', icon: ic('banknote'), render: renderMyMoney });

  /* ================================================================== PAYROLL */
  function payrollLines(ctx) {
    var m = S.payroll.month;
    return S.payroll.staff.map(function (s) {
      var u = D.user(s.userId);
      var comm = sum(D.payouts.filter(function (p) { return p.counterparty === s.userId && p.kind === 'egreso' && p.splitKind === 'commission' && monthOf(p.date) === m && p.status !== 'pendiente'; }), function (p) { return p.amount; });
      return { user: u, type: s.type, base: s.base, commission: comm, total: s.base + comm };
    });
  }
  function vendorLines() {
    var m = S.payroll.month;
    var by = {};
    D.payouts.filter(function (p) { return p.kind === 'egreso' && p.splitKind === 'fee' && monthOf(p.date) === m && D.user(p.counterparty) && D.user(p.counterparty).roleGroup === 'vendor'; }).forEach(function (p) { by[p.counterparty] = (by[p.counterparty] || 0) + p.amount; });
    return Object.keys(by).map(function (k) { return { user: D.user(k), type: 'vendor', base: 0, commission: 0, total: by[k] }; });
  }
  function renderPayroll(ctx) {
    var lines = payrollLines(ctx);
    if (isRole(ctx, 'broker')) { var uid = actingUser(ctx).id; lines = lines.filter(function (x) { return x.user && x.user.id === uid; }); }
    var vendors = isRole(ctx, 'broker') ? [] : vendorLines();
    var salaries = sum(lines.filter(function (x) { return x.type === 'salary'; }), function (x) { return x.base; });
    var comms = sum(lines, function (x) { return x.commission; });
    var pila = Math.round(salaries * 0.30);
    var total = salaries + comms;
    var st = S.payroll.status;
    var html = '<div class="ops-page">';
    html += pageHeader('Nómina', 'Septiembre 2026 · salarios + estados de comisión en un solo lote. Llave arma el lote; ' + esc(nameOf('u-acct')) + ' lo ejecuta.',
      (canApproveMoney(ctx) ? (st === 'pagada' ? '<span class="ops-check-ok">' + ic('check') + ' Nómina de septiembre pagada</span>' : '<button class="btn btn-primary" data-action="ops.payroll-open">' + ic('banknote') + ' Ejecutar nómina</button>') : ''));
    html += '<div class="ops-kpis">' + statCard('Total del lote', moneyC(total), badge(st)) + statCard('Salarios', moneyC(salaries), lines.filter(function (x) { return x.type === 'salary'; }).length + ' empleados') + statCard('Comisiones del mes', moneyC(comms), 'Aprobadas en el libro · sep') + statCard('Seguridad social (PILA) ' + ex(), moneyC(pila), '≈ 30 % sobre salarios · se paga por PILA') + '</div>';
    html += card('Equipo', '<div class="table-wrap"><table class="table"><thead><tr><th>Persona</th><th>Tipo</th><th class="num">Salario base</th><th class="num">Comisiones sep</th><th class="num">Total</th><th>Estado</th></tr></thead><tbody>' + lines.map(function (x) {
      return '<tr><td><span class="row">' + avatar(x.user.id) + '<span><b class="small">' + esc(x.user.name) + '</b><span class="xs muted" style="display:block">' + esc(x.user.title || '') + '</span></span></span></td><td>' + pill(x.type === 'salary' ? 'Salario' : 'Comisión', x.type === 'salary' ? 'warn' : 'brand') + '</td><td class="num">' + (x.base ? money(x.base) : '<span class="muted">—</span>') + '</td><td class="num">' + (x.commission ? money(x.commission) : '<span class="muted">—</span>') + '</td><td class="num"><b>' + money(x.total) + '</b></td><td>' + badge(st === 'pagada' ? 'pagado' : x.total ? 'pendiente' : 'borrador', st === 'pagada' ? 'Pagado' : x.total ? 'En lote' : 'Sin pago este mes') + '</td></tr>';
    }).join('') + (vendors.length ? '<tr><td colspan="6" class="eyebrow" style="background:var(--surface-2)">Proveedores · honorarios del mes (cuenta operativa)</td></tr>' + vendors.map(function (x) {
      return '<tr><td><span class="row">' + avatar(x.user.id) + '<span><b class="small">' + esc(x.user.name) + '</b><span class="xs muted" style="display:block">' + esc(x.user.title || '') + '</span></span></span></td><td>' + pill('Proveedor', 'info') + '</td><td class="num"><span class="muted">—</span></td><td class="num"><span class="muted">—</span></td><td class="num"><b>' + money(x.total) + '</b></td><td>' + badge('pagado') + '</td></tr>';
    }).join('') : '') + '</tbody></table></div>');
    html += '<div class="grid grid-2">';
    html += card('Lotes anteriores', '<div class="ops-mini">' + D.payouts.filter(function (p) { return p.account === 'payroll'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (p) { return '<div class="ops-mini-row"><span class="t">' + esc(p.concept) + '<span class="m">' + fdate(p.date, 'default') + '</span></span><span class="row"><span class="v">' + money(p.amount) + '</span>' + badge(p.status) + '</span></div>'; }).join('') + '</div>');
    html += card('Obligaciones ' + ex(), '<div class="ops-statement"><div><span>PILA · aportes septiembre</span><b>' + money(pila) + '</b></div><div><span>Retención en la fuente · comisiones</span><b>' + money(Math.round(comms * 0.10)) + '</b></div><div><span>DIAN · ' + esc(S.dian.concept) + '</span><span>' + badge(S.dian.status) + ' · vence ' + fdate(S.dian.nextFiling) + '</span></div></div><p class="xs muted" style="margin-top:var(--s-3)">Valores ilustrativos. La integración DIAN de facturación electrónica está pendiente de habilitar en Configuración.</p>');
    html += '</div></div>';
    return html;
  }
  L.register('payroll', { title: 'Payroll', titleEs: 'Nómina', icon: ic('briefcase'), render: renderPayroll });
  function payrollModal() {
    var lines = payrollLines({ roleId: 'accountant' });
    var total = sum(lines, function (x) { return x.total; });
    return '<div class="stack"><div class="row row-between"><div><b>Nómina septiembre 2026</b><span class="small muted" style="display:block">' + lines.filter(function (x) { return x.total; }).length + ' personas · cuenta nómina Bancolombia</span></div><span class="ops-hero-num" style="font-size:var(--fs-xl)">' + money(total) + '</span></div>' +
      '<div class="ops-checklist">' +
      '<label><input type="checkbox" checked data-ops-change="ops.payroll-check"><span>Saldo suficiente en cuenta nómina<span class="m">Saldo disponible ' + moneyC(total + 8000000) + ' ' + ex() + '</span></span></label>' +
      '<label><input type="checkbox" checked data-ops-change="ops.payroll-check"><span>Comisiones del mes aprobadas en el libro<span class="m">Solo entran pagos con estado aprobado</span></span></label>' +
      '<label><input type="checkbox" data-ops-change="ops.payroll-check"><span>Novedades revisadas (incapacidades, vacaciones)<span class="m">Sin novedades reportadas este mes</span></span></label>' +
      '</div><div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" id="ops-payroll-confirm" data-action="ops.payroll-confirm" disabled>' + ic('banknote') + ' Ejecutar lote</button></div></div>';
  }

  /* ================================================================== RENTALS */
  var TICKET_COLS = ['nuevo', 'asignado', 'en curso', 'cerrado'];
  function rentStats() {
    var roll = S.rentRoll.filter(function (r) { return r.status !== 'vacante'; });
    var due = sum(roll, function (r) { return r.canon; });
    var paid = sum(roll.filter(function (r) { return r.status === 'pagado'; }), function (r) { return r.canon; });
    var late = roll.filter(function (r) { return r.status === 'atrasado'; });
    return { due: due, paid: paid, pct: due ? Math.round(paid / due * 100) : 0, late: late, lateAmount: sum(late, function (r) { return r.canon; }), pending: roll.filter(function (r) { return r.status === 'pendiente'; }) };
  }
  function leasesExpiring(days) { return S.leases.filter(function (x) { var d = daysUntil(x.end); return d != null && d >= 0 && d <= days; }).sort(function (a, b) { return a.end < b.end ? -1 : 1; }); }
  function ipcNew(x) { return Math.round(x.canon * (1 + x.ipcPct / 100) / 100) * 100; }
  function monthDays(ym) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7); return new Date(y, m, 0).getDate(); }
  function monthLabel(ym) { var d = new Date(ym + '-15T12:00:00'); var s = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); }
  function shiftMonth(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; var d = new Date(y, m, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function bookingsIn(unitId, ym) { return S.bookings.filter(function (b) { return b.unit === unitId && monthOf(b.from) <= ym && monthOf(b.to) >= ym; }); }
  function occupancy(unitId, ym) {
    var n = monthDays(ym), booked = 0;
    for (var d = 1; d <= n; d++) { var iso = ym + '-' + String(d).padStart(2, '0'); if (bookingsIn(unitId, ym).some(function (b) { return !b.block && !b.owner && iso >= b.from && iso < b.to; })) booked++; }
    return Math.round(booked / n * 100);
  }
  function vacationGrid(ym, units) {
    var n = monthDays(ym);
    var html = '<div class="ops-cal-wrap"><div class="ops-cal" style="--days:' + n + '"><div class="hd" style="align-items:flex-start;padding-left:var(--s-3)">' + esc(monthLabel(ym)) + '</div>';
    for (var d = 1; d <= n; d++) { var iso = ym + '-' + String(d).padStart(2, '0'); var dt = new Date(iso + 'T12:00:00'); var wd = dt.getDay(); html += '<div class="hd' + (wd === 0 || wd === 6 ? ' is-weekend' : '') + '"><small>' + ['D', 'L', 'M', 'X', 'J', 'V', 'S'][wd] + '</small>' + d + '</div>'; }
    units.forEach(function (u) {
      html += '<div class="unit">' + esc(u.name) + '<small>' + esc(u.sub) + ' · ocupación ' + occupancy(u.id, ym) + ' %</small></div>';
      var bs = bookingsIn(u.id, ym);
      for (var d2 = 1; d2 <= n; d2++) {
        var iso2 = ym + '-' + String(d2).padStart(2, '0');
        var b = null; bs.forEach(function (x) { if (iso2 >= x.from && iso2 < x.to) b = x; });
        var cls = 'cell' + (iso2 === TODAY ? ' is-today' : '');
        var inner = '';
        if (b) { cls += b.block ? ' is-block' : b.owner ? ' is-owner' : ' is-booked'; if (iso2 === b.from || d2 === 1) { cls += ' is-start'; inner = '<b>' + esc(b.guest) + '</b>'; } }
        html += '<div class="' + cls + '" title="' + esc(fdate(iso2) + (b ? ' · ' + b.guest + (b.channel ? ' · ' + b.channel : '') : ' · libre')) + '">' + inner + '</div>';
      }
    });
    return html + '</div></div>';
  }
  function ownerStatement(d) {
    var l = dealListing(d);
    var landlord = d.parties.landlord;
    var lines = [];
    var gross, fee, maint, period = 'Agosto 2026';
    var tickets = S.tickets.filter(function (t) { return t.listingId === d.listingId && t.status === 'cerrado' && t.cost; });
    maint = sum(tickets, function (t) { return t.cost; });
    if (d.nightlyRate) { var p = D.payouts.filter(function (x) { return x.dealId === d.id && x.concept.indexOf('Liquidación') === 0; })[0]; gross = p ? Math.round(p.amount / (1 - d.mgmtPct / 100)) : 0; fee = Math.round(gross * d.mgmtPct / 100); }
    else if (d.startDate && d.startDate > TODAY) { gross = 0; fee = 0; period = 'Primer extracto: octubre 2026'; }
    else { gross = d.monthlyRent; fee = Math.round(gross * d.mgmtPct / 100); }
    var net = gross - fee - maint;
    lines.push('<div><span>Renta bruta ' + (d.nightlyRate ? '(reservas liquidadas)' : '(canon)') + '</span><b class="num">' + money(gross) + '</b></div>');
    lines.push('<div class="neg"><span>− Administración ' + d.mgmtPct + ' % + IVA</span><span class="num">−' + money(fee) + '</span></div>');
    lines.push('<div class="neg"><span>− Mantenimiento' + (tickets.length ? ' (' + tickets.map(function (t) { return t.title; }).join(', ') + ')' : '') + '</span><span class="num">−' + money(maint) + '</span></div>');
    lines.push('<div class="total"><span>Liquidación al propietario</span><span class="num">' + money(Math.max(0, net)) + '</span></div>');
    return { landlord: landlord, listing: l, period: period, html: '<div class="ops-statement">' + lines.join('') + '</div>', net: net, gross: gross };
  }
  function renderRentals(ctx) {
    var tab = S.tab.rentals || 'cartera';
    var rs = rentStats();
    var open = S.tickets.filter(function (t) { return t.status !== 'cerrado'; });
    var exp = leasesExpiring(120);
    var full = isRole(ctx, 'rental_admin', 'owner', 'accountant');
    var html = '<div class="ops-page">';
    html += pageHeader('Arriendos', 'Dorum Lifestyle & Experiences · recaudo, mantenimiento, inventarios y renta vacacional. Cada propietario recibe un extracto mensual.',
      full ? '<button class="btn btn-secondary" data-action="ops.ticket-new">' + ic('wrench') + ' Nuevo ticket</button>' : '');
    html += '<div class="ops-kpis">' + statCard('Recaudo del mes', rs.pct + ' %', moneyC(rs.paid) + ' de ' + moneyC(rs.due) + ' · ' + rs.pending.length + ' por vencer') +
      statCard('Cartera vencida', '<span style="color:var(--' + (rs.late.length ? 'danger' : 'text') + ')">' + moneyC(rs.lateAmount) + '</span>', rs.late.length + ' canon' + (rs.late.length !== 1 ? 'es' : '') + ' atrasado' + (rs.late.length !== 1 ? 's' : '')) +
      statCard('Tickets abiertos', open.length, open.filter(function (t) { return t.status === 'nuevo'; }).length + ' nuevos con triage de Llave') +
      statCard('Contratos por vencer', exp.length, 'Próximos 120 días · IPC sugerido') + '</div>';
    html += tabs(ctx, 'rentals', [{ id: 'cartera', label: 'Cartera' }, { id: 'mantenimiento', label: 'Mantenimiento', count: open.length }, { id: 'contratos', label: 'Vencimientos', count: exp.length }, { id: 'inventarios', label: 'Inventarios', count: S.inventories.filter(function (i) { return i.status !== 'firmado'; }).length }, { id: 'vacacional', label: 'Renta vacacional' }, { id: 'extractos', label: 'Extractos' }], tab);
    if (tab === 'cartera') {
      if (rs.late.length) html += '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Cartera · ' + rs.late.length + ' canon atrasado</div><div class="ai-suggest-body">' + rs.late.map(function (r) { return '<div class="row row-between" style="padding:4px 0"><span><b>' + esc(r.unit) + '</b> · ' + esc(r.tenant) + ' · ' + money(r.canon) + ' · <span style="color:var(--danger)">' + r.daysLate + ' días de mora</span></span><span class="row"><button class="btn btn-primary btn-sm" data-action="ops.rent-remind" data-id="' + r.id + '">' + ic('message-circle') + ' Ver recordatorio</button><button class="btn btn-secondary btn-sm" data-action="ops.rent-paid" data-id="' + r.id + '">Registrar pago</button></span></div>'; }).join('') + '</div><div class="ai-suggest-meta">Llave redactó un recordatorio amable (sin interés de mora los primeros 5 días, según contrato). Apruébalo antes de enviarlo.</div></div>';
      html += '<div class="table-wrap"><table class="table"><thead><tr><th>Inmueble</th><th>Arrendatario</th><th>Propietario</th><th class="num">Canon</th><th>Vence</th><th>Estado</th><th></th></tr></thead><tbody>' + S.rentRoll.map(function (r) {
        return '<tr><td><b class="small">' + esc(r.unit) + '</b>' + (r.note ? '<span class="xs muted" style="display:block">' + esc(r.note) + '</span>' : '') + '</td><td class="small">' + (r.tenant ? esc(r.tenant) : '<span class="muted">—</span>') + '</td><td class="small">' + esc(nameOf(r.landlordId)) + '</td><td class="num"><b>' + money(r.canon) + '</b></td><td class="small">Día ' + r.dueDay + (r.paidAt ? '<span class="xs muted" style="display:block">pagado ' + fdate(r.paidAt) + '</span>' : r.daysLate ? '<span class="xs" style="display:block;color:var(--danger)">' + r.daysLate + ' d de mora</span>' : '') + '</td><td>' + badge(r.status) + '</td>' +
          '<td><div class="ops-table-actions">' + (r.status === 'atrasado' && full ? '<button class="btn btn-secondary btn-sm" data-action="ops.rent-remind" data-id="' + r.id + '">' + ic('message-circle') + '</button><button class="btn btn-primary btn-sm" data-action="ops.rent-paid" data-id="' + r.id + '">Pago</button>' : r.status === 'pendiente' && full ? '<button class="btn btn-ghost btn-sm" data-action="ops.rent-paid" data-id="' + r.id + '">Registrar pago</button>' : '') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
    } else if (tab === 'mantenimiento') {
      html += '<div class="kanban ops-kanban">' + TICKET_COLS.map(function (col) {
        var items = S.tickets.filter(function (t) { return t.status === col; });
        return '<div class="kanban-col"><div class="kanban-head"><span>' + esc(STATUS_LABEL[col]) + '</span><span class="count">' + items.length + '</span></div>' + items.map(function (t) {
          var next = TICKET_COLS[TICKET_COLS.indexOf(t.status) + 1];
          return '<div class="kanban-card' + (t.ai && t.status === 'nuevo' ? ' is-ai' : '') + '"><div class="title"><span>' + esc(t.title) + '</span>' + pill(t.priority, t.priority === 'alta' ? 'danger' : t.priority === 'media' ? 'warn' : '') + '</div><div class="meta"><span>' + esc(t.unit) + '</span><span>' + fdate(t.created) + '</span></div>' +
            (t.vendor ? '<div class="small">' + ic('wrench') + ' ' + esc(nameOf(t.vendor)) + (t.cost ? ' · ' + money(t.cost) : '') + '</div>' : '') +
            (t.ai && t.status === 'nuevo' ? '<div class="ai-suggest" style="padding:var(--s-3) var(--s-3) var(--s-3) var(--s-4)"><div class="ai-suggest-head"><span class="spark"></span> Triage de Llave</div><div class="ai-suggest-body"><b>' + esc(t.ai.vendor) + '</b> · ' + esc(t.ai.eta) + ' · ~' + money(t.ai.cost) + '<br><span class="muted">' + esc(t.ai.reason) + '</span></div>' + (full ? '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="ops.ticket-assign" data-id="' + t.id + '">Aprobar y asignar</button><button class="btn btn-ghost btn-sm" data-action="ops.ticket-move" data-id="' + t.id + '" data-to="asignado">Asignar otro</button></div>' : '') + '</div>' : '') +
            (full && next && !(t.ai && t.status === 'nuevo') ? '<div class="row" style="justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-action="ops.ticket-move" data-id="' + t.id + '" data-to="' + next + '">' + (next === 'cerrado' ? 'Cerrar' : 'Pasar a ' + STATUS_LABEL[next].toLowerCase()) + ' ' + ic('chevron-right') + '</button></div>' : '') +
            (t.closed ? '<div class="meta"><span>Cerrado ' + fdate(t.closed) + '</span><span>' + esc(t.reportedBy) + '</span></div>' : '') + '</div>';
        }).join('') + '</div>';
      }).join('') + '</div>';
    } else if (tab === 'contratos') {
      html += '<div class="grid grid-2">' + (exp.length ? exp.map(function (x) {
        var nuevo = ipcNew(x);
        return '<section class="card"><div class="card-header"><div><h2 class="card-title">' + esc(x.unit) + '</h2><span class="small muted">' + esc(x.tenant) + ' · ' + esc(x.kind) + ' · vence ' + fdate(x.end, 'default') + ' (' + daysUntil(x.end) + ' d)</span></div>' + (x.renewal ? badge(x.renewal === 'aprobado' ? 'firmado' : 'pendiente', x.renewal === 'aprobado' ? 'Renovación aprobada' : 'Renovación en edición') : pill('Por vencer', 'warn')) + '</div>' +
          (x.renewal === 'aprobado' ? '<div class="callout callout-success">' + ic('check') + '<span>Notificación de renovación enviada · nuevo canon ' + money(nuevo) + ' desde ' + fdate(x.end) + '.</span></div>' :
            '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Llave sugiere · renovar con incremento IPC</div><div class="ai-suggest-body">Canon <span class="diff-del">' + money(x.canon) + '</span> <span class="diff-add">' + money(nuevo) + '</span> (+' + x.ipcPct.toLocaleString('es-CO') + ' %' + (x.kind === 'comercial' ? ' · IPC + 1 punto pactado' : ' · IPC año anterior ' + ex()) + '). ' + (x.kind === 'vivienda' ? 'Ley 820: el incremento anual no puede superar el 100 % del IPC del año calendario anterior.' : 'Contrato comercial: incremento pactado en la cláusula de reajuste.') + ' Aviso al arrendatario con 30 días de anticipación.</div>' +
              (full ? '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="ops.ipc-approve" data-id="' + x.id + '">Aprobar y notificar</button><button class="btn btn-secondary btn-sm" data-action="ops.ipc-edit" data-id="' + x.id + '">Editar %</button><button class="btn btn-ghost btn-sm" data-action="ops.ipc-dismiss" data-id="' + x.id + '">No renovar</button></div>' : '') + '<div class="ai-suggest-meta">Propietario: ' + esc(nameOf(x.landlordId)) + ' · genera otrosí desde la plantilla al aprobar</div></div>') + '</section>';
      }).join('') : empty('No hay contratos por vencer en los próximos 120 días.')) + '</div>';
      html += card('Todos los contratos de arriendo', '<div class="table-wrap"><table class="table table-compact"><thead><tr><th>Inmueble</th><th>Arrendatario</th><th>Tipo</th><th class="num">Canon</th><th>Vence</th><th class="num">IPC sugerido</th></tr></thead><tbody>' + S.leases.map(function (x) { return '<tr><td class="small"><b>' + esc(x.unit) + '</b></td><td class="small">' + esc(x.tenant) + '</td><td>' + pill(x.kind) + '</td><td class="num">' + money(x.canon) + '</td><td class="small">' + fdate(x.end, 'default') + '</td><td class="num small">+' + x.ipcPct.toLocaleString('es-CO') + ' % → ' + money(ipcNew(x)) + '</td></tr>'; }).join('') + '</tbody></table></div>');
    } else if (tab === 'inventarios') {
      html += '<div class="grid grid-2">' + S.inventories.map(function (inv) {
        var done = inv.items.filter(function (i) { return i.done; }).length, photos = sum(inv.items, function (i) { return i.photos; });
        return '<section class="card"><div class="card-header"><div><h2 class="card-title">' + esc(inv.unit) + '</h2><span class="small muted">Inventario de ' + inv.kind + ' · ' + fdate(inv.date, 'default') + ' · ' + inv.parties.map(nameOf).join(' y ') + '</span></div>' + badge(inv.status === 'firmado' ? 'firmado' : inv.status === 'en curso' ? 'bajo oferta' : 'pendiente', inv.status === 'firmado' ? 'Firmado' : inv.status === 'en curso' ? 'En curso' : 'Pendiente') + '</div>' + progressLine(done, inv.items.length) +
          '<p class="small muted" style="margin:var(--s-3) 0">' + photos + ' fotos · Llave arma el documento con foto, estado y observación por espacio; ambas partes firman en el celular.</p>' +
          '<div class="row"><button class="btn btn-primary btn-sm" data-action="ops.inventory-open" data-id="' + inv.id + '">' + ic('camera') + ' Abrir checklist</button>' + (inv.status !== 'firmado' && done === inv.items.length && full ? '<button class="btn btn-secondary btn-sm" data-action="ops.inventory-sign" data-id="' + inv.id + '">' + ic('pen-tool') + ' Enviar a firma</button>' : '') + '</div></section>';
      }).join('') + '</div>';
    } else if (tab === 'vacacional') {
      var ym = S.calMonth;
      html += '<div class="ops-tabs-row"><div class="row"><button class="btn btn-ghost btn-icon" data-action="ops.cal-month" data-dir="-1" aria-label="Mes anterior">‹</button><b>' + esc(monthLabel(ym)) + '</b><button class="btn btn-ghost btn-icon" data-action="ops.cal-month" data-dir="1" aria-label="Mes siguiente">›</button></div>' +
        '<div class="ops-cal-legend"><span><i style="background:var(--brand-soft);border-left:3px solid var(--brand-2)"></i>Reserva</span><span><i style="background:var(--accent-soft)"></i>Uso propietario</span><span><i style="background:repeating-linear-gradient(135deg,var(--surface-3) 0 3px,var(--surface) 3px 6px)"></i>Bloqueo</span><span><i style="box-shadow:inset 0 0 0 2px var(--accent)"></i>Hoy</span></div></div>';
      html += vacationGrid(ym, S.vacationUnits);
      var next = S.bookings.filter(function (b) { return !b.block && !b.owner && b.from >= TODAY; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; }).slice(0, 5);
      html += '<div class="grid grid-2">' + card('Próximos check-ins', '<div class="ops-mini">' + next.map(function (b) { var u = D.byId(S.vacationUnits, b.unit); var nights = daysBetween(b.from, b.to); return '<div class="ops-mini-row"><span class="t">' + esc(b.guest) + '<span class="m">' + esc(u.name) + ' · ' + fdate(b.from) + ' → ' + fdate(b.to) + ' · ' + nights + ' noche' + (nights > 1 ? 's' : '') + (b.extras ? ' · ' + esc(b.extras) : '') + '</span></span><span class="v">' + money(nights * u.nightly) + '</span></div>'; }).join('') + '</div>') +
        card('Programa Lifestyle & Experiences', '<div class="ops-statement">' + S.vacationUnits.map(function (u) { return '<div><span>' + esc(u.name) + ' <span class="muted">· ' + moneyC(u.nightly) + '/noche</span></span><b class="num">' + occupancy(u.id, ym) + ' % ocupación</b></div>'; }).join('') + '</div><p class="xs muted" style="margin-top:var(--s-3)">Reservas cobradas por adelantado a escrow · liquidación mensual al propietario menos administración integral 20 % · limpieza y experiencias se trasladan al huésped.</p>') + '</div>';
    } else if (tab === 'extractos') {
      var mdeals = D.deals.filter(function (d) { return d.kind === 'arriendo' && d.parties.landlord; });
      html += '<div class="grid grid-2">' + mdeals.map(function (d) {
        var s = ownerStatement(d);
        var sent = S.statementsSent[d.id];
        return '<section class="card"><div class="card-header"><div><h2 class="card-title">' + esc(nameOf(s.landlord)) + '</h2><span class="small muted">' + esc(s.listing ? s.listing.title : d.title) + ' · ' + esc(s.period) + '</span></div>' + (sent ? '<span class="ops-check-ok">' + ic('check') + ' Enviado ' + fdate(sent) + '</span>' : pill('Borrador de Llave', 'ai')) + '</div>' + s.html +
          (s.gross ? '<div class="row" style="margin-top:var(--s-4);justify-content:flex-end"><button class="btn btn-ghost btn-sm" data-action="ops.statement-pdf" data-id="' + d.id + '">' + ic('download') + ' PDF</button>' + (full ? '<button class="btn btn-primary btn-sm" data-action="ops.statement-send" data-id="' + d.id + '"' + (sent ? ' disabled' : '') + '>' + ic('send') + ' ' + (sent ? 'Extracto enviado' : 'Enviar extracto') + '</button>' : '') + '</div>' : '<p class="xs muted" style="margin-top:var(--s-3)">El contrato inicia el ' + fdate(d.startDate, 'default') + '; el primer extracto sale el 3 de noviembre.</p>') + '</section>';
      }).join('') + '</div>';
    }
    return html + '</div>';
  }
  L.register('rentals', { title: 'Rental ops', titleEs: 'Arriendos', icon: ic('key'), render: renderRentals });

  function rentReminderDrawer(r) {
    var first = (r.tenant || '').split(' ')[0];
    var msg = 'Hola ' + first + ', te escribe Llave de Dorum Lifestyle. Notamos que el canon de ' + r.unit + ' (' + money(r.canon) + ') venció el ' + r.dueDay + ' de septiembre. Puedes pagarlo por PSE aquí: dorum.llave.app/pago/' + r.id + '. Si ya lo hiciste, ignora este mensaje. ¡Gracias por tu puntualidad!';
    return '<div class="ops-drawer-form"><div class="row"><b>' + esc(r.unit) + '</b>' + badge('atrasado') + '</div><p class="small muted">Para: ' + esc(r.tenant) + ' · ' + r.daysLate + ' días de mora · sin interés los primeros 5 días según contrato</p>' +
      '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · recordatorio amable</div><div class="ai-suggest-body"><textarea class="textarea" rows="6" style="width:100%">' + esc(msg) + '</textarea></div>' +
      '<div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="ops.rent-remind-send" data-id="' + r.id + '">' + ic('send') + ' Aprobar y enviar por WhatsApp</button><button class="btn btn-ghost btn-sm" data-action="ops.close-drawer">Descartar</button></div><div class="ai-suggest-meta">Al día 6 Llave propondrá un segundo aviso con el interés de mora pactado (1,5 % mensual ' + ex() + ').</div></div></div>';
  }
  function inventoryDrawer(inv) {
    var done = inv.items.filter(function (i) { return i.done; }).length;
    return '<div class="ops-drawer-form"><div class="row row-between"><div><b>' + esc(inv.unit) + '</b><span class="small muted" style="display:block">Inventario de ' + inv.kind + ' · ' + fdate(inv.date, 'default') + '</span></div>' + badge(inv.status === 'firmado' ? 'firmado' : 'pendiente', inv.status === 'firmado' ? 'Firmado' : done + '/' + inv.items.length) + '</div>' + progressLine(done, inv.items.length) +
      '<div class="ops-inv-items">' + inv.items.map(function (it, i) { return '<label class="ops-inv-item' + (it.done ? ' is-done' : '') + '"><input type="checkbox"' + (it.done ? ' checked' : '') + ' data-ops-change="ops.inventory-check" data-id="' + inv.id + '" data-index="' + i + '" style="accent-color:var(--brand-2)"><span>' + esc(it.n) + '</span><span class="cam">' + ic('camera') + ' ' + it.photos + '</span></label>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn btn-secondary btn-sm" data-action="ops.inventory-all" data-id="' + inv.id + '">' + ic('check') + ' Marcar todo con fotos</button>' + (inv.status !== 'firmado' ? '<button class="btn btn-primary btn-sm" data-action="ops.inventory-sign" data-id="' + inv.id + '"' + (done === inv.items.length ? '' : ' disabled') + '>' + ic('pen-tool') + ' Enviar a firma</button>' : '') + '</div>' +
      '<p class="xs muted">Llave genera el PDF con cada foto, su estado y observaciones; ' + inv.parties.map(nameOf).join(' y ') + ' firman desde el celular.</p></div>';
  }
  function ticketModal() {
    return '<div class="stack"><div class="field"><label class="label" for="ops-tk-unit">Inmueble</label><select class="select" id="ops-tk-unit">' + S.rentRoll.map(function (r) { return '<option value="' + esc(r.unit) + '" data-listing="' + esc(r.listingId || '') + '">' + esc(r.unit) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="label" for="ops-tk-title">¿Qué pasó?</label><input class="input" id="ops-tk-title" placeholder="Ej. Gotera en el baño principal"></div>' +
      '<div class="field"><label class="label" for="ops-tk-prio">Prioridad</label><select class="select" id="ops-tk-prio"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select></div>' +
      '<div class="callout">' + ic('sparkles') + '<span>Llave clasifica el daño, sugiere proveedor, ventana de visita y costo estimado. Tú apruebas antes de despachar.</span></div>' +
      '<div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" data-action="ops.ticket-create">Crear ticket</button></div></div>';
  }

  /* ================================================================ LIFESTYLE */
  function renderLifestyle(ctx) {
    var staff = isStaff(ctx);
    var u = actingUser(ctx);
    var html = '<div class="ops-page">';
    if (staff) {
      html += pageHeader('Lifestyle · servicios', 'Marketplace de servicios para huéspedes, arrendatarios y propietarios. Configura aliados y margen antes del lanzamiento.', '');
      html += '<div class="ops-kpis">' + statCard('Servicios', D.lifestyle.length, '1 en piloto · 6 próximamente') + statCard('Aliados', uniq([].concat.apply([], Object.keys(S.lifestyleConfig).map(function (k) { return S.lifestyleConfig[k].partners; }))).length, 'Proveedores locales Guatapé & Oriente') + statCard('Interesados', Object.keys(S.notified).length + 18, 'Clientes que pidieron aviso ' + ex()) + statCard('Solicitudes piloto', S.lifestyleRequests.length, 'Experiencias · septiembre') + '</div>';
    } else {
      html += '<section class="card card-sand ops-hero-card"><div><span class="eyebrow">Dorum Lifestyle & Experiences</span><h2 style="margin-top:var(--s-2)">Tu hogar, con todo resuelto.</h2><p class="small" style="margin-top:var(--s-3);color:var(--text-2)">Aseo, chef, kayak al amanecer, traslados al aeropuerto y un concierge por WhatsApp. Pide lo que ya está en piloto y te avisamos cuando abramos lo demás.</p></div>' +
        '<div class="card"><div class="ops-mini">' + (S.lifestyleRequests.filter(function (r) { return r.who === u.id; }).map(function (r) { var s = D.byId(D.lifestyle, r.serviceId); return '<div class="ops-mini-row"><span class="t">' + esc(s.icon + ' ' + s.nameEs) + '<span class="m">' + esc(r.when) + ' · ' + esc(r.note) + '</span></span>' + badge(r.status === 'confirmado' ? 'firmado' : 'pendiente', r.status === 'confirmado' ? 'Confirmado' : 'Solicitado') + '</div>'; }).join('') || '<p class="small muted">Aún no tienes solicitudes.</p>') + '</div><p class="xs muted" style="margin-top:var(--s-2)">Tus solicitudes</p></div></section>';
    }
    html += '<div class="grid grid-3">' + D.lifestyle.map(function (s) {
      var cfg = S.lifestyleConfig[s.id] || { partners: [], margin: 0 };
      var pilot = s.status === 'pilot';
      var btn;
      if (staff) btn = '<button class="btn btn-secondary btn-sm" data-action="ops.lifestyle-config" data-id="' + s.id + '">' + ic('settings') + ' Configurar oferta</button>';
      else if (pilot) btn = '<button class="btn btn-primary btn-sm" data-action="ops.lifestyle-request" data-id="' + s.id + '">Solicitar</button>';
      else btn = S.notified[s.id] ? '<span class="ops-check-ok">' + ic('check') + ' Te avisaremos</span>' : '<button class="btn btn-secondary btn-sm" data-action="ops.lifestyle-notify" data-id="' + s.id + '">' + ic('bell') + ' Avísame</button>';
      return '<section class="card ops-svc"><div class="row row-between"><div class="ops-svc-icon" aria-hidden="true">' + s.icon + '</div>' + (pilot ? pill('Piloto en Guatapé', 'success') : pill('Próximamente', 'warn')) + '</div><h3>' + esc(s.nameEs) + '<small>' + esc(s.name) + '</small></h3><p>' + esc(s.desc) + '</p>' +
        (staff ? '<div class="xs muted">Aliados: ' + esc(cfg.partners.join(', ') || '—') + ' · margen ' + cfg.margin + ' % · lanzamiento ' + esc(cfg.launch || '—') + (cfg.visible ? '' : ' · oculto en portal') + '</div>' : '') +
        '<div class="ops-svc-foot">' + btn + '</div></section>';
    }).join('') + '</div>';
    return html + '</div>';
  }
  L.register('lifestyle', { title: 'Lifestyle services', titleEs: 'Lifestyle', icon: ic('sun'), render: renderLifestyle });
  function lifestyleConfigDrawer(s) {
    var cfg = S.lifestyleConfig[s.id];
    return '<div class="ops-drawer-form"><div class="row"><span class="ops-svc-icon">' + s.icon + '</span><div><b>' + esc(s.nameEs) + '</b><span class="small muted" style="display:block">' + esc(s.desc) + '</span></div></div>' +
      '<div class="field"><label class="label" for="ops-ls-partners">Aliados (uno por línea)</label><textarea class="textarea" id="ops-ls-partners" rows="3">' + esc(cfg.partners.join('\n')) + '</textarea></div>' +
      '<div class="grid grid-2"><div class="field"><label class="label" for="ops-ls-margin">Margen Dorum</label><label class="input-group"><input class="input" id="ops-ls-margin" type="number" min="0" max="60" value="' + cfg.margin + '"><span class="muted">%</span></label></div><div class="field"><label class="label" for="ops-ls-launch">Lanzamiento</label><input class="input" id="ops-ls-launch" value="' + esc(cfg.launch) + '"></div></div>' +
      '<label class="toggle"><input type="checkbox" id="ops-ls-visible"' + (cfg.visible ? ' checked' : '') + '><span class="toggle-track"></span> Mostrar en portal y app de arrendatarios</label>' +
      '<div class="row"><button class="btn btn-primary" data-action="ops.lifestyle-save" data-id="' + s.id + '">Guardar</button><button class="btn btn-ghost" data-action="ops.close-drawer">Cancelar</button></div></div>';
  }
  function lifestyleRequestDrawer(s, ctx) {
    var u = actingUser(ctx);
    var home = D.listings.filter(function (l) { return l.operacion === 'arriendo' && D.deals.some(function (d) { return d.listingId === l.id && d.parties.renter === u.id; }); })[0] || D.listing('lst-010');
    return '<div class="ops-drawer-form"><div class="row"><span class="ops-svc-icon">' + s.icon + '</span><div><b>' + esc(s.nameEs) + '</b><span class="small muted" style="display:block">' + esc(s.desc) + '</span></div></div>' +
      '<div class="field"><label class="label" for="ops-lr-where">Dónde</label><input class="input" id="ops-lr-where" value="' + esc(home.title + ' · ' + home.city) + '"></div>' +
      '<div class="grid grid-2"><div class="field"><label class="label" for="ops-lr-date">Fecha</label><input class="input" id="ops-lr-date" type="date" value="2026-09-27"></div><div class="field"><label class="label" for="ops-lr-time">Hora</label><input class="input" id="ops-lr-time" type="time" value="06:30"></div></div>' +
      '<div class="field"><label class="label" for="ops-lr-note">Detalles</label><textarea class="textarea" id="ops-lr-note" rows="3" placeholder="Personas, preferencias, alergias…">Kayak al amanecer · 2 personas</textarea></div>' +
      '<div class="callout">' + ic('message-circle') + '<span>El concierge Dorum te confirma por WhatsApp en menos de 2 horas. El cobro va a tu cuenta de arrendatario.</span></div>' +
      '<div class="row"><button class="btn btn-primary" data-action="ops.lifestyle-submit" data-id="' + s.id + '">' + ic('send') + ' Enviar solicitud</button><button class="btn btn-ghost" data-action="ops.close-drawer">Cancelar</button></div></div>';
  }

  /* ================================================================ REFERRALS */
  function refContact(r) { return D.byId(D.contacts, r.contactId); }
  function referralRows() { var out = []; D.deals.forEach(function (d) { D.computeSplit(d).rows.forEach(function (r) { if (r.kind === 'referral') out.push({ deal: d, row: r }); }); }); return out; }
  function renderReferrals(ctx) {
    var u = actingUser(ctx);
    var refs = S.referrals.slice();
    var closings = D.deals.filter(function (d) { return d.parties.lender === u.id || S.referrals.some(function (r) { return r.dealId === d.id && r.closing; }); });
    var fees = referralRows();
    var html = '<div class="ops-page">';
    html += pageHeader('Referidos', 'Compradores que Dorum te refiere desde la etapa de calificación. Actualiza el estado del crédito y Llave avisa al asesor.', '');
    html += '<div class="ops-kpis">' + statCard('Referidos activos', refs.filter(function (r) { return r.status !== 'contado'; }).length, refs.filter(function (r) { return r.status === 'nuevo'; }).length + ' nuevo' + (refs.filter(function (r) { return r.status === 'nuevo'; }).length !== 1 ? 's' : '') + ' esta semana') + statCard('Pre-aprobados', moneyC(sum(refs.filter(function (r) { return r.status === 'pre-aprobado'; }), function (r) { return r.amount; })), refs.filter(function (r) { return r.status === 'pre-aprobado'; }).length + ' carta' + (refs.filter(function (r) { return r.status === 'pre-aprobado'; }).length !== 1 ? 's' : '') + ' vigente') + statCard('Cierres próximos', closings.length, closings.map(function (d) { var r = S.referrals.filter(function (x) { return x.dealId === d.id; })[0]; return r && r.closing ? 'Escritura ' + fdate(r.closing) : ''; }).filter(Boolean).join(' · ') || '—') + statCard('Fees de referido', moneyC(sum(fees, function (f) { return f.row.amount; })), fees.length + ' negocio' + (fees.length !== 1 ? 's' : '') + ' con regla de referido') + '</div>';
    html += card('Compradores referidos', '<div class="table-wrap"><table class="table"><thead><tr><th>Comprador</th><th>Inmueble de interés</th><th class="num">Presupuesto</th><th>Crédito</th><th class="num">Pre-aprobado</th><th>Próximo paso</th><th></th></tr></thead><tbody>' + refs.map(function (r) {
      var c = refContact(r); var ints = (c.interest || []).map(function (id) { var l = listing(id); return l ? l.title : id; });
      return '<tr><td><span class="row">' + avatar(c.userId || c.name) + '<span><b class="small">' + esc(c.name) + '</b><span class="xs muted" style="display:block">' + esc(c.city) + ' · ' + esc(c.lang.toUpperCase()) + ' · referido ' + fdate(r.referredAt) + ' por ' + esc(nameOf(c.owner)) + '</span></span></span></td>' +
        '<td class="small">' + (ints.length ? esc(ints.join(' · ')) : '<span class="muted">—</span>') + '</td><td class="num">' + D.fmtMoney(c.budget, c.currency) + '</td><td>' + badge(r.status) + (r.bank ? '<span class="xs muted" style="display:block">' + esc(r.bank) + '</span>' : '') + '</td><td class="num">' + (r.amount ? '<b>' + money(r.amount) + '</b>' + (r.expires ? '<span class="xs muted" style="display:block">vence ' + fdate(r.expires) + '</span>' : '') : '<span class="muted">—</span>') + '</td><td class="small">' + esc(r.next) + '</td>' +
        '<td><div class="ops-table-actions">' + (r.status !== 'contado' ? '<button class="btn btn-secondary btn-sm" data-action="ops.preapproval-open" data-id="' + r.id + '">' + ic('edit') + ' Estado</button>' : '') + '</div></td></tr>';
    }).join('') + '</tbody></table></div>');
    html += '<div class="grid grid-2">';
    html += card('Cierres próximos', closings.length ? '<div class="ops-mini">' + closings.map(function (d) { var r = S.referrals.filter(function (x) { return x.dealId === d.id; })[0]; var docs = D.documents.filter(function (x) { return x.dealId === d.id && x.owedBy === 'buyer'; }); return '<div class="ops-mini-row"><span class="t">' + esc(d.title) + '<span class="m">' + (r && r.closing ? 'Escritura ' + fdate(r.closing, 'default') + ' · Notaría 15' : 'Fecha por definir') + ' · docs comprador ' + docs.filter(function (x) { return x.status === 'validado'; }).length + '/' + docs.length + '</span></span><span class="row"><span class="v">' + moneyC(d.agreedPrice || d.offerPrice || d.askingPrice) + '</span>' + badge(d.status) + '</span></div>'; }).join('') + '</div>' : empty('Sin cierres programados.'));
    html += card('Fees de referido por negocio', fees.length ? '<div class="ops-mini">' + fees.map(function (f) { return '<div class="ops-mini-row"><span class="t">' + esc(f.deal.title) + '<span class="m">' + esc(f.row.name) + ' · ' + (f.row.pct != null ? f.row.pct + ' % · ' : '') + esc(stageLabel(f.row.stage)) + (f.row.note ? ' · ' + esc(f.row.note) : '') + '</span></span><span class="row"><span class="v">' + money(f.row.amount) + '</span>' + pill(f.deal.status === 'vendido' ? 'Por pagar' : 'Al cierre', 'accent') + '</span></div>'; }).join('') + '</div><p class="xs muted" style="margin-top:var(--s-3)">El fee de referido se descuenta de la comisión bruta antes del reparto y se paga desde escrow al firmar la escritura.</p>' : empty('Ningún negocio tiene regla de referido.'));
    html += '</div></div>';
    return html;
  }
  L.register('referrals', { title: 'Referrals', titleEs: 'Referidos', icon: ic('handshake'), render: renderReferrals });
  function preapprovalModal(r) {
    var c = refContact(r);
    return '<div class="stack"><p class="small muted">' + esc(c.name) + ' · ' + esc(r.bank || 'Banco por definir') + '</p>' +
      '<div class="field"><label class="label" for="ops-pa-status">Estado del crédito</label><select class="select" id="ops-pa-status">' + ['nuevo', 'en estudio', 'pre-aprobado', 'aprobado', 'desembolsado', 'rechazado'].map(function (s) { return '<option value="' + s + '"' + (s === r.status ? ' selected' : '') + '>' + esc(STATUS_LABEL[s] || s) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid grid-2"><div class="field"><label class="label" for="ops-pa-amount">Monto (COP)</label><input class="input" id="ops-pa-amount" type="number" value="' + (r.amount || '') + '"></div><div class="field"><label class="label" for="ops-pa-exp">Vence</label><input class="input" id="ops-pa-exp" type="date" value="' + (r.expires || '') + '"></div></div>' +
      '<div class="field"><label class="label" for="ops-pa-next">Próximo paso</label><input class="input" id="ops-pa-next" value="' + esc(r.next) + '"></div>' +
      '<div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" data-action="ops.preapproval-save" data-id="' + r.id + '">Guardar y avisar al asesor</button></div></div>';
  }

  /* ================================================================== WIDGETS */
  function W(id, title, size, link, render) { L.registerWidget(id, { title: title, size: size, link: link, render: render }); }
  function miniRows(items) { return '<div class="ops-mini">' + items.join('') + '</div>'; }
  function miniRow(t, m, v, extra) { return '<div class="ops-mini-row"><span class="t">' + t + (m ? '<span class="m">' + m + '</span>' : '') + '</span><span class="row" style="gap:6px;flex-wrap:nowrap">' + (v != null ? '<span class="v">' + v + '</span>' : '') + (extra || '') + '</span></div>'; }
  function wTop(label, value, sub) { return '<div class="ops-w-top"><div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span></div>' + (sub ? '<span class="small muted" style="text-align:right">' + sub + '</span>' : '') + '</div>'; }

  W('escrow-balance', 'Escrow', 'md', 'money', function (ctx) {
    var es = D.escrowSummary, pend = pendingReleases();
    var held = D.deals.filter(function (d) { return d.escrow && d.escrow.held > 0; });
    return '<div class="ops-w">' + wTop('En custodia', moneyC(es.held), 'Proyectado 30 d<br><b>' + moneyC(es.projected30d) + '</b>') + miniRows(held.map(function (d) { return miniRow(esc(dealShort(d)), esc(d.escrow.note || ''), money(d.escrow.held)); })) + widgetFoot(ctx, 'money', null, 'Ver dinero', pend.length + ' liberación' + (pend.length !== 1 ? 'es' : '') + ' pendiente' + (pend.length !== 1 ? 's' : '')) + '</div>';
  });
  W('my-commissions', 'Mis comisiones', 'md', 'my-money', function (ctx) {
    var u = actingUser(ctx);
    var upcoming = D.payouts.filter(function (p) { return p.counterparty === u.id && p.kind === 'egreso' && p.status !== 'pagado'; });
    var proj = userRowsFromDeals(u.id).filter(function (r) { return r.status === 'proyectado'; });
    var hist = S.earningsHistory[u.id] || [];
    return '<div class="ops-w">' + wTop('Por cobrar', moneyC(sum(upcoming, function (p) { return p.amount; })), 'Proyectado al cierre<br><b>' + moneyC(sum(proj, function (r) { return r.row.amount; })) + '</b>') + sparkSVG(hist, { h: 48, label: 'Ingresos 2026' }) + '<span class="xs muted">Ingresos ene–sep 2026 · pagado ' + moneyC(sum(hist)) + '</span>' + widgetFoot(ctx, 'my-money', null, 'Mis pagos', proj.length + ' negocios abiertos') + '</div>';
  });
  W('paperwork-status', 'Documentos', 'md', 'paperwork', function (ctx) {
    var groups = docGroups(docsVisible(ctx));
    return '<div class="ops-w">' + miniRows(groups.slice(0, 4).map(function (g) { var done = g.docs.filter(function (x) { return x.status === 'validado'; }).length, bad = g.docs.filter(function (x) { return x.status === 'vencido'; }).length; return '<div class="ops-mini-row" style="display:block"><div class="row row-between" style="margin-bottom:4px"><span class="t">' + esc(g.title) + '</span>' + (bad ? pill(bad + ' vencido', 'danger') : '<span class="xs muted">' + done + '/' + g.docs.length + '</span>') + '</div>' + progressLine(done, g.docs.length) + '</div>'; })) + widgetFoot(ctx, 'paperwork', null, 'Ver documentos', D.documents.filter(function (x) { return x.status === 'pendiente'; }).length + ' pendientes') + '</div>';
  });
  W('rent-collection', 'Recaudo del mes', 'md', 'rentals', function (ctx) {
    var rs = rentStats();
    return '<div class="ops-w">' + wTop('Recaudado', rs.pct + ' %', moneyC(rs.paid) + ' de ' + moneyC(rs.due)) + '<div class="progress progress-lg"><span style="--value:' + rs.pct + '%"></span></div><div class="row" style="justify-content:space-between;font-size:var(--fs-xs)"><span>' + badge('pagado') + ' ' + S.rentRoll.filter(function (r) { return r.status === 'pagado'; }).length + '</span><span>' + badge('pendiente') + ' ' + rs.pending.length + '</span><span>' + badge('atrasado') + ' ' + rs.late.length + '</span></div>' + widgetFoot(ctx, 'rentals', null, 'Cartera', 'Septiembre 2026') + '</div>';
  });
  W('arrears', 'Cartera vencida', 'sm', 'rentals', function (ctx) {
    var rs = rentStats();
    return '<div class="ops-w">' + wTop('Atrasado', '<span style="color:var(--' + (rs.late.length ? 'danger' : 'text') + ')">' + moneyC(rs.lateAmount) + '</span>') + miniRows(rs.late.map(function (r) { return miniRow(esc(r.tenant), esc(r.unit) + ' · ' + r.daysLate + ' d', null, '<button class="btn btn-secondary btn-sm" data-action="ops.rent-remind" data-id="' + r.id + '">' + ic('message-circle') + '</button>'); })) + widgetFoot(ctx, 'rentals', null, 'Cartera', 'Recordatorio AI listo') + '</div>';
  });
  W('maintenance-tickets', 'Mantenimiento', 'md', 'rentals', function (ctx) {
    var open = S.tickets.filter(function (t) { return t.status !== 'cerrado'; });
    return '<div class="ops-w">' + wTop('Tickets abiertos', open.length, TICKET_COLS.slice(0, 3).map(function (c) { return STATUS_LABEL[c] + ' ' + S.tickets.filter(function (t) { return t.status === c; }).length; }).join(' · ')) + miniRows(open.slice(0, 3).map(function (t) { return miniRow(esc(t.title), esc(t.unit) + (t.ai && t.status === 'nuevo' ? ' · ' + aiBadge('AI · triage') : ''), null, badge(t.status)); })) + widgetFoot(ctx, 'rentals', null, 'Tablero') + '</div>';
  });
  W('leases-expiring', 'Contratos por vencer', 'md', 'rentals', function (ctx) {
    var exp = leasesExpiring(120);
    return '<div class="ops-w">' + wTop('Próximos 120 días', exp.length) + miniRows(exp.map(function (x) { return miniRow(esc(x.unit), esc(x.tenant) + ' · vence ' + fdate(x.end), money(ipcNew(x)), x.renewal === 'aprobado' ? badge('firmado', 'Renovado') : aiBadge('IPC +' + x.ipcPct.toLocaleString('es-CO') + ' %')); })) + widgetFoot(ctx, 'rentals', null, 'Vencimientos') + '</div>';
  });
  W('inventories-pending', 'Inventarios', 'sm', 'rentals', function (ctx) {
    var inv = S.inventories.filter(function (i) { return i.status !== 'firmado'; });
    return '<div class="ops-w">' + wTop('Pendientes', inv.length) + miniRows(inv.map(function (i) { var done = i.items.filter(function (x) { return x.done; }).length; return miniRow(esc(i.unit), (i.kind === 'entrada' ? 'Entrada' : 'Salida') + ' · ' + fdate(i.date), done + '/' + i.items.length, '<button class="btn btn-ghost btn-sm" data-action="ops.inventory-open" data-id="' + i.id + '">' + ic('camera') + '</button>'); })) + widgetFoot(ctx, 'rentals', null, 'Inventarios') + '</div>';
  });
  W('vacation-calendar', 'Renta vacacional', 'lg', 'rentals', function (ctx) {
    var ym = monthOf(TODAY);
    var next = S.bookings.filter(function (b) { return !b.block && !b.owner && b.from >= TODAY; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; })[0];
    return '<div class="ops-w">' + vacationGrid(ym, S.vacationUnits) + widgetFoot(ctx, 'rentals', null, 'Calendario', next ? 'Próximo check-in: ' + esc(next.guest) + ' · ' + fdate(next.from) : '') + '</div>';
  });
  W('payout-batches', 'Lotes de pago', 'md', 'money', function (ctx) {
    var byMonth = {};
    D.payouts.filter(function (p) { return p.kind === 'egreso' && p.status === 'pagado'; }).forEach(function (p) { var m = monthOf(p.date); byMonth[m] = byMonth[m] || { n: 0, amt: 0 }; byMonth[m].n++; byMonth[m].amt += p.amount; });
    var months = Object.keys(byMonth).sort().reverse().slice(0, 3);
    return '<div class="ops-w">' + wTop('Pagado este mes', moneyC(sum(paidThisMonth(), function (p) { return p.amount; })), paidThisMonth().length + ' pagos') + miniRows(months.map(function (m) { return miniRow(esc(monthLabel(m)), byMonth[m].n + ' pagos', money(byMonth[m].amt), badge('pagado')); })) + widgetFoot(ctx, 'money', null, 'Libro mayor') + '</div>';
  });
  W('pending-releases', 'Liberaciones pendientes', 'md', 'money', function (ctx) {
    var pend = pendingReleases();
    return '<div class="ops-w">' + wTop('Por liberar', moneyC(sum(pend, function (p) { return p.amount; })), pend.length + ' pendiente' + (pend.length !== 1 ? 's' : '')) + miniRows(pend.map(function (p) { return miniRow(esc(p.concept), 'Para ' + esc(nameOf(p.counterparty)) + ' · ' + fdate(p.date), money(p.amount), canApproveMoney(ctx) ? '<button class="btn btn-primary btn-sm" data-action="ops.release-open" data-id="' + p.id + '">Liberar</button>' : ''); })) + widgetFoot(ctx, 'money', null, 'Ver dinero') + '</div>';
  });
  W('payroll-month', 'Nómina', 'sm', 'payroll', function (ctx) {
    var lines = payrollLines(ctx); var total = sum(lines, function (x) { return x.total; });
    return '<div class="ops-w">' + wTop('Septiembre', moneyC(total), badge(S.payroll.status)) + '<span class="small muted">' + lines.filter(function (x) { return x.total; }).length + ' personas · corte 30 sep</span>' + (canApproveMoney(ctx) && S.payroll.status !== 'pagada' ? '<button class="btn btn-secondary btn-sm" data-action="ops.payroll-open">' + ic('banknote') + ' Ejecutar nómina</button>' : '') + widgetFoot(ctx, 'payroll', null, 'Nómina') + '</div>';
  });
  W('dian-status', 'DIAN', 'sm', 'payroll', function (ctx) {
    return '<div class="ops-w">' + wTop('Facturación electrónica ' + ex(), badge(S.dian.status)) + miniRows([miniRow(esc(S.dian.concept), 'Vence ' + fdate(S.dian.nextFiling, 'default'), null, pill('Por presentar', 'warn')), miniRow('Facturas emitidas 30 d', 'Vía integración pendiente', S.dian.invoices30d + '')]) + widgetFoot(ctx, 'payroll', null, 'Obligaciones', 'Datos de ejemplo') + '</div>';
  });
  W('ledger-recent', 'Movimientos recientes', 'lg', 'money', function (ctx) {
    var rows = D.payouts.filter(function (p) { return !p.projected; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 6);
    return '<div class="ops-w">' + miniRows(rows.map(function (p) { return miniRow(esc(p.concept), fdate(p.date) + ' · ' + esc(accountLabel(p.account)) + ' · ' + esc(nameOf(p.counterparty)), '<span class="' + (p.kind === 'ingreso' ? 'ops-in' : '') + '">' + (p.kind === 'ingreso' ? '+' : '−') + money(p.amount) + '</span>', badge(p.status)); })) + widgetFoot(ctx, 'money', null, 'Libro mayor', D.payouts.length + ' movimientos') + '</div>';
  });
  W('contracts-review', 'Revisión legal', 'md', 'contracts', function (ctx) {
    var review = D.contracts.filter(function (k) { return k.aiDrafted && !k.lawyerApproved; });
    return '<div class="ops-w">' + wTop('Borradores de Llave por aprobar', review.length) + miniRows(review.map(function (k) { var l = listing(k.listingId); return miniRow(esc(k.type), esc(l ? l.title : '') + ' · v' + k.version, null, '<a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'contracts', k.id)) + '">Revisar</a>' + (canApproveLegal(ctx) ? '<button class="btn btn-primary btn-sm" data-action="ops.contract-approve" data-id="' + k.id + '">Aprobar</button>' : '')); })) + widgetFoot(ctx, 'contracts', null, 'Contratos', 'AI redacta · tú apruebas') + '</div>';
  });
  W('redlines-open', 'Redlines abiertos', 'sm', 'contracts', function (ctx) {
    var items = D.contracts.map(function (k) { return { k: k, n: clausesFor(k).filter(function (c) { return c.status === 'pendiente'; }).length }; }).filter(function (x) { return x.n; });
    return '<div class="ops-w">' + wTop('Cláusulas en disputa', sum(items, function (x) { return x.n; })) + miniRows(items.map(function (x) { var l = listing(x.k.listingId); return miniRow(esc(x.k.type), esc(l ? l.title : ''), x.n + '', '<a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'contracts', x.k.id)) + '">' + ic('chevron-right') + '</a>'); })) + widgetFoot(ctx, 'contracts', null, 'Contratos') + '</div>';
  });
  W('title-checks', 'Estudio de títulos', 'md', 'paperwork', function (ctx) {
    var docs = D.documents.filter(function (x) { return /tradición|escritura|licencia/i.test(x.name); });
    return '<div class="ops-w">' + wTop('Certificados y escrituras', docs.length, docs.filter(function (x) { return x.status === 'vencido'; }).length + ' vencido' + (docs.filter(function (x) { return x.status === 'vencido'; }).length !== 1 ? 's' : '')) + miniRows(docs.map(function (x) { var l = listing(x.listingId); return miniRow(esc(x.name), esc(l ? l.title : '') + (x.aiCheck ? ' · <span class="ops-aicheck" style="padding:0 6px">' + esc(x.aiCheck) + '</span>' : ''), null, badge(x.status)); })) + widgetFoot(ctx, 'paperwork', null, 'Documentos') + '</div>';
  });
  W('signatures-pending', 'Firmas pendientes', 'md', 'contracts', function (ctx) {
    var items = [];
    D.contracts.forEach(function (k) { k.signers.forEach(function (s) { if (s.status !== 'firmado') items.push({ k: k, s: s }); }); });
    return '<div class="ops-w">' + wTop('Firmantes por firmar', items.length, D.contracts.filter(function (k) { return k.status === 'enviado'; }).length + ' sobre' + (D.contracts.filter(function (k) { return k.status === 'enviado'; }).length !== 1 ? 's' : '') + ' enviado') + miniRows(items.slice(0, 5).map(function (x) { var name = x.s.userId ? nameOf(x.s.userId) : x.s.name; return miniRow(esc(name), esc(x.k.type), null, badge(x.s.status) + '<a class="btn btn-ghost btn-sm" href="' + esc(route(ctx, 'contracts', x.k.id)) + '">' + ic('chevron-right') + '</a>'); })) + widgetFoot(ctx, 'contracts', null, 'Contratos') + '</div>';
  });
  W('clause-library', 'Biblioteca de cláusulas', 'sm', 'contracts', function (ctx) {
    return '<div class="ops-w">' + wTop('Cláusulas aprobadas', S.clauseLibrary.length, 'Llave solo redacta con estas') + miniRows(S.clauseLibrary.slice(-3).reverse().map(function (c) { return miniRow(esc(c.title), c.tags.join(', ') + ' · ' + fdate(c.updated), null, pill('aprobada', 'success')); })) + (isRole(ctx, 'lawyer', 'owner') ? '<button class="btn btn-secondary btn-sm" data-action="ops.clause-new">' + ic('plus') + ' Nueva cláusula</button>' : '') + widgetFoot(ctx, 'contracts', null, 'Contratos') + '</div>';
  });
  W('my-payouts', 'Mis pagos', 'md', 'my-money', function (ctx) {
    var u = actingUser(ctx);
    var mine = D.payouts.filter(function (p) { return p.counterparty === u.id && p.kind === 'egreso'; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var pend = mine.filter(function (p) { return p.status !== 'pagado'; });
    return '<div class="ops-w">' + wTop('Por cobrar', moneyC(sum(pend, function (p) { return p.amount; })), 'Pagado 2026<br><b>' + moneyC(sum(S.earningsHistory[u.id] || [])) + '</b>') + miniRows(mine.slice(0, 3).map(function (p) { return miniRow(esc(p.concept), fdate(p.date, 'default'), money(p.amount), badge(p.status)); })) + (mine.length ? '' : '<p class="small muted">Sin pagos registrados este mes. Tus órdenes aceptadas aparecen aquí al entregar.</p>') + widgetFoot(ctx, 'my-money', null, 'Mis pagos') + '</div>';
  });
  W('referrals-new', 'Nuevos referidos', 'sm', 'referrals', function (ctx) {
    var news = S.referrals.filter(function (r) { return r.status === 'nuevo' || r.status === 'en estudio'; });
    return '<div class="ops-w">' + wTop('Esta semana', news.length) + miniRows(news.map(function (r) { var c = refContact(r); return miniRow(esc(c.name), esc(c.city) + ' · ' + D.fmtMoney(c.budget, c.currency), null, badge(r.status)); })) + widgetFoot(ctx, 'referrals', null, 'Referidos') + '</div>';
  });
  W('preapprovals', 'Pre-aprobaciones', 'md', 'referrals', function (ctx) {
    var pa = S.referrals.filter(function (r) { return r.amount && r.status !== 'contado'; });
    return '<div class="ops-w">' + wTop('Vigentes', pa.filter(function (r) { return r.status === 'pre-aprobado'; }).length, moneyC(sum(pa, function (r) { return r.amount; })) + ' en cartas') + miniRows(pa.map(function (r) { var c = refContact(r); return miniRow(esc(c.name), esc(r.bank || '') + (r.expires ? ' · vence ' + fdate(r.expires) : '') + ' · ' + esc(r.next), money(r.amount), badge(r.status)); })) + widgetFoot(ctx, 'referrals', null, 'Referidos') + '</div>';
  });
  W('closings-upcoming', 'Cierres próximos', 'sm', 'referrals', function (ctx) {
    var cl = S.referrals.filter(function (r) { return r.closing; });
    return '<div class="ops-w">' + wTop('Escrituras programadas', cl.length) + miniRows(cl.map(function (r) { var d = deal(r.dealId); return miniRow(esc(d ? d.title : ''), 'Escritura ' + fdate(r.closing, 'default') + ' · ' + daysUntil(r.closing) + ' d', moneyC(d ? (d.agreedPrice || d.offerPrice) : 0)); })) + widgetFoot(ctx, 'referrals', null, 'Referidos') + '</div>';
  });

  /* ================================================================== ACTIONS */
  var ACTIONS = {};
  function A(name, fn) { ACTIONS[name] = fn; L.action(name, fn); }
  function modalCloseBtn() { return ''; }
  function openModal(html, title, wide) { if (L.openModal) L.openModal(html, { title: title, wide: !!wide }); }
  function openDrawer(html, title) { if (L.openDrawer) L.openDrawer(html, { title: title }); }
  function closeModal() { if (L.closeModal) L.closeModal(); }
  function closeDrawer() { if (L.closeDrawer) L.closeDrawer(); }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  // Change-event delegation for inputs (the shell's click delegate calls preventDefault on non-anchors, which would block checkbox toggles).
  if (!window.LLAVE_OPS_CHANGE_BOUND) {
    window.LLAVE_OPS_CHANGE_BOUND = true;
    document.addEventListener('change', function (e) {
      var node = e.target.closest('[data-ops-change]'); if (!node) return;
      var fn = ACTIONS[node.dataset.opsChange];
      if (!fn) return;
      var r = D.parseRoute();
      try { fn(node.dataset, node, { roleId: r.role, module: r.module, id: r.id, D: D }, e); } catch (err) { console.error('ops change ' + node.dataset.opsChange, err); }
    });
  }
  A('ops.tab', function (ds) { S.tab[ds.module] = ds.tab; rerender(); });
  A('ops.close-modal', function () { closeModal(); });
  A('ops.close-drawer', function () { closeDrawer(); });

  // contracts
  A('ops.contract-approve', function (ds, el, ctx) {
    var k = D.byId(D.contracts, ds.id); if (!k) return;
    if (!canApproveLegal(ctx)) { toast('Solo el abogado aprueba', 'La revisión legal es un paso humano obligatorio.', 'danger'); return; }
    k.lawyerApproved = true;
    clausesFor(k).forEach(function (c) { if (c.status === 'pendiente' && c.ai) c.status = 'aceptado'; });
    if (k.status === 'borrador') k.status = 'en negociación';
    addLog(k, { at: TODAY, title: nameOf('u-lawyer') + ' aprobó el texto (revisión legal)', done: true });
    var t = D.tasks.filter(function (x) { return x.kind === 'contract' && x.listingId === k.listingId; })[0]; if (t) t.status = 'listo';
    rerender(); toast('Texto aprobado', k.type + ' · listo para enviar a firma.', 'success');
  });
  A('ops.contract-send', function (ds) {
    var k = D.byId(D.contracts, ds.id); if (!k) return;
    if (!k.lawyerApproved) { toast('Falta revisión legal', 'El abogado debe aprobar antes de enviar a firma.', 'danger'); return; }
    var n = 0; k.signers.forEach(function (s) { if (s.status === 'pendiente') { s.status = 'enviado'; n++; } });
    if (k.status !== 'firmado') k.status = 'enviado';
    addLog(k, { at: TODAY, title: n ? 'Enviado a firma electrónica (' + n + ' firmante' + (n > 1 ? 's' : '') + ')' : 'Recordatorio de firma enviado', done: true });
    rerender(); toast(n ? 'Enviado a firma' : 'Recordatorio enviado', n ? n + ' sobre' + (n > 1 ? 's' : '') + ' por WhatsApp y correo con enlace de firma.' : 'Los firmantes pendientes recibieron un recordatorio.', 'success');
  });
  A('ops.contract-sign', function (ds) {
    var k = D.byId(D.contracts, ds.id); if (!k) return;
    var s = k.signers.filter(function (x) { return (x.userId || x.name) === ds.signer; })[0]; if (!s) return;
    s.status = 'firmado'; s.at = TODAY;
    addLog(k, { at: TODAY, title: 'Firmó ' + (s.userId ? nameOf(s.userId) : s.name), done: true });
    if (k.signers.every(function (x) { return x.status === 'firmado'; })) { k.status = 'firmado'; k.redlines = 0; }
    rerender(); toast('Firma registrada', (s.userId ? nameOf(s.userId) : s.name) + ' firmó (simulación de recordatorio · demo).', 'success');
  });
  A('ops.contract-pdf', function (ds) { var k = D.byId(D.contracts, ds.id); toast('PDF generado', (k ? k.type + ' v' + k.version : 'Contrato') + ' · descarga simulada en la demo.', 'success'); });
  A('ops.redline-accept', function (ds) {
    var k = D.byId(D.contracts, ds.id); if (!k) return;
    var c = clausesFor(k).filter(function (x) { return x.key === ds.key; })[0]; if (!c) return;
    c.status = 'aceptado'; k.redlines = Math.max(0, k.redlines - 1);
    addLog(k, { at: TODAY, title: 'Aceptada propuesta en "' + c.title + '"' + (c.ai ? ' (redactada por Llave)' : ''), done: true });
    rerender(); toast('Propuesta aceptada', c.title + ' · el texto de la derecha pasa a la v' + (k.version) + '.', 'success');
  });
  A('ops.redline-reject', function (ds) {
    var k = D.byId(D.contracts, ds.id); if (!k) return;
    var c = clausesFor(k).filter(function (x) { return x.key === ds.key; })[0]; if (!c) return;
    c.status = 'rechazado'; k.redlines = Math.max(0, k.redlines - 1);
    addLog(k, { at: TODAY, title: 'Se mantiene la versión anterior en "' + c.title + '"', done: true });
    rerender(); toast('Se mantiene la versión anterior', c.title + ' · se notifica a la contraparte.', 'success');
  });
  A('ops.comment-add', function (ds, el, ctx) {
    var input = document.getElementById('cmt-' + ds.id + '-' + ds.key); var text = input && input.value.trim(); if (!text) { toast('Escribe un comentario', 'El campo está vacío.', 'danger'); return; }
    S.comments[ds.id] = S.comments[ds.id] || {}; S.comments[ds.id][ds.key] = S.comments[ds.id][ds.key] || [];
    S.comments[ds.id][ds.key].push({ who: actingUser(ctx).id, at: TODAY, text: text });
    rerender(); toast('Comentario publicado', 'Visible para las partes del contrato.', 'success');
  });
  A('ops.clause-insert', function (ds) {
    var k = D.byId(D.contracts, ds.id), c = D.byId(S.clauseLibrary, ds.clause); if (!k || !c) return;
    var list = clausesFor(k);
    if (list.some(function (x) { return x.key === c.id; })) { toast('Ya está en el contrato', c.title, 'danger'); return; }
    list.push({ key: c.id, title: c.title, prev: '<i class="muted">Cláusula no incluida en la versión anterior.</i>', next: '<span class="diff-add">' + esc(c.text) + '</span>', by: 'Biblioteca (aprobada por ' + nameOf(c.approvedBy) + ')', status: 'aceptado' });
    k.clauses++; addLog(k, { at: TODAY, title: 'Insertada cláusula "' + c.title + '" desde la biblioteca', done: true });
    rerender(); toast('Cláusula insertada', c.title + ' · texto pre-aprobado, no requiere nueva revisión.', 'success');
  });
  A('ops.clause-new', function () {
    openModal('<div class="stack"><div class="field"><label class="label" for="ops-cl-title">Título</label><input class="input" id="ops-cl-title" placeholder="Ej. Reserva de dominio"></div><div class="field"><label class="label" for="ops-cl-tags">Aplica a</label><select class="select" id="ops-cl-tags"><option value="promesa">Promesa / oferta</option><option value="arriendo">Arrendamiento / inventario</option><option value="corretaje">Corretaje</option></select></div><div class="field"><label class="label" for="ops-cl-text">Texto</label><textarea class="textarea" id="ops-cl-text" rows="5" placeholder="Redacción final en español jurídico…"></textarea><span class="hint">Al guardar queda marcada como aprobada por ' + esc(nameOf('u-lawyer')) + ' y Llave puede usarla en nuevos borradores.</span></div><div class="modal-footer"><button class="btn btn-ghost" data-action="ops.close-modal">Cancelar</button><button class="btn btn-primary" data-action="ops.clause-save">Guardar en biblioteca</button></div></div>', 'Nueva cláusula');
  });
  A('ops.clause-save', function () {
    var title = val('ops-cl-title').trim(), text = val('ops-cl-text').trim(); if (!title || !text) { toast('Faltan datos', 'Título y texto son obligatorios.', 'danger'); return; }
    S.clauseLibrary.push({ id: 'cl-' + String(S.clauseLibrary.length + 1).padStart(2, '0'), title: title, tags: [val('ops-cl-tags')], text: text, approvedBy: 'u-lawyer', updated: TODAY });
    closeModal(); rerender(); toast('Cláusula guardada', title + ' · ya disponible para Llave.', 'success');
  });
  A('ops.template-modal', function (ds, el, ctx) { openModal(templateModal(ctx), 'Generar desde plantilla'); });
  A('ops.template-create', function (ds, el, ctx) {
    var sel = document.querySelector('input[name="ops-tpl"]:checked'); var t = D.byId(TEMPLATES, sel ? sel.value : TEMPLATES[0].id);
    var d = deal(val('ops-tpl-deal')) || D.deals[0];
    var signers = [];
    ['seller', 'buyer', 'landlord', 'renter'].forEach(function (k) { if (d.parties[k]) signers.push({ userId: d.parties[k], status: 'pendiente' }); });
    if (!signers.length) signers.push({ name: partyName(d, d.kind === 'venta' ? 'seller' : 'landlord'), status: 'pendiente' });
    if (/corretaje/i.test(t.type)) signers.push({ userId: 'u-owner', status: 'pendiente' });
    var k = { id: nextId('k', D.contracts), type: t.type, dealId: d.id, listingId: d.listingId, version: 1, redlines: 0, status: 'borrador', aiDrafted: true, lawyerApproved: false, signers: signers, updated: TODAY, clauses: t.clauses, note: 'Generado por Llave desde plantilla · pendiente de revisión legal', termMonths: /corretaje/i.test(t.type) ? 6 : (d.termMonths || null) };
    D.contracts.push(k);
    closeModal();
    toast('Borrador generado', t.title + ' · ' + d.title + '. En cola de revisión de ' + nameOf('u-lawyer') + '.', 'ai');
    if (L.navigate) L.navigate(ctx.roleId, 'contracts', k.id); else { location.hash = route(ctx, 'contracts', k.id); }
  });

  // paperwork
  A('ops.doc-upload', function (ds) {
    var x = D.byId(D.documents, ds.id); if (!x) return;
    x.status = 'recibido'; x.file = x.file || (x.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '.pdf');
    x.aiCheck = x.aiCheck && x.status === 'vencido' ? x.aiCheck : 'OCR: documento legible · nombre coincide con las partes · vigente' + (x.due ? ' hasta ' + fdate(x.due, 'default') : '') + '.';
    rerender(); toast('Documento recibido', x.name + ' · Llave lo leyó; falta validar.', 'ai');
  });
  A('ops.doc-drop', function (ds) {
    var docs = D.documents.filter(function (x) { return (x.dealId || ('lst:' + x.listingId)) === ds.key && (x.status === 'pendiente' || x.status === 'vencido'); });
    if (!docs.length) { toast('Checklist completo', 'No hay documentos pendientes en este negocio.', 'success'); return; }
    var x = docs[0]; x.status = 'recibido'; x.file = x.file || 'subida-' + x.id + '.pdf'; x.aiCheck = 'OCR: clasificado como "' + x.name + '" · nombre coincide · legible.';
    rerender(); toast('Archivo clasificado', 'Llave lo asignó a "' + x.name + '". Valida para cerrar el punto.', 'ai');
  });
  A('ops.doc-validate', function (ds, el, ctx) {
    var x = D.byId(D.documents, ds.id); if (!x) return;
    x.status = 'validado'; rerender(); toast('Documento validado', x.name + ' · validado por ' + actingUser(ctx).name + '.', 'success');
  });
  A('ops.doc-remind', function (ds) { var x = D.byId(D.documents, ds.id); if (x) openDrawer(reminderDrawer(x), 'Solicitar por WhatsApp'); });
  A('ops.doc-remind-send', function (ds) { var x = D.byId(D.documents, ds.id); if (!x) return; S.docReminders[x.id] = TODAY; closeDrawer(); rerender(); toast('Recordatorio enviado', 'WhatsApp a ' + partyName(deal(x.dealId), x.owedBy) + ' · registrado en el expediente.', 'success'); });
  A('ops.doc-template', function (ds) { var t = D.byId(DOC_TEMPLATES, ds.id); if (t) openModal(docTemplateModal(t), t.title); });
  A('ops.doc-template-apply', function (ds) {
    var t = D.byId(DOC_TEMPLATES, ds.id), d = deal(val('ops-doc-deal')); if (!t || !d) return;
    var n = 0;
    t.items.forEach(function (it) {
      var base = it[0].replace(/\s*\(.*\)$/, '').toLowerCase().slice(0, 18);
      if (D.documents.some(function (x) { return x.dealId === d.id && x.name.toLowerCase().indexOf(base) === 0; })) return;
      D.documents.push({ id: nextId('doc', D.documents), dealId: d.id, listingId: d.listingId, name: it[0], owedBy: it[1], status: 'pendiente', due: '2026-10-15' }); n++;
    });
    closeModal(); S.tab.paperwork = 'deals'; rerender(); toast('Checklist creado', n + ' documento' + (n !== 1 ? 's' : '') + ' añadido' + (n !== 1 ? 's' : '') + ' a ' + d.title + '.', 'success');
  });

  // money
  A('ops.ledger-filter', function (ds) { S.ledgerAccount = ds.account; S.tab.money = 'ledger'; rerender(); });
  A('ops.ledger-export', function () { toast('Exportación lista', 'libro-mayor-2026-09.csv · ' + D.payouts.length + ' movimientos (descarga simulada).', 'success'); });
  A('ops.split-template', function (ds) {
    var d = deal(ds.id), t = SPLIT_TEMPLATES[ds.template]; if (!d || !t) return;
    var keep = d.split.filter(function (s) { return s.kind === 'fee' || s.kind === 'salary'; });
    d.split = t.apply(d).concat(keep);
    rerender(); toast('Plantilla aplicada', t.label.replace('Plantilla · ', '') + ' · revisa los porcentajes y guarda.', 'success');
  });
  A('ops.split-save', function (ds) {
    var d = deal(ds.id); if (!d) return;
    var c = sum(d.split.filter(function (s) { return s.kind === 'commission' && s.pct != null; }), function (s) { return s.pct; });
    if (d.split.some(function (s) { return s.kind === 'commission'; }) && Math.abs(c - 100) > 0.01) { toast('No se puede guardar', 'Las comisiones suman ' + c + ' %; deben sumar 100 %.', 'danger'); return; }
    toast('Reglas guardadas', d.title + ' · ' + d.split.length + ' reglas · se aplicarán al liberar.', 'success');
  });
  A('ops.release-open', function (ds, el, ctx) {
    var p = D.byId(D.payouts, ds.id); if (!p) return;
    if (!canApproveMoney(ctx)) { toast('Requiere contadora', 'Solo ' + nameOf('u-acct') + ' o ' + D.OWNER_NAME + ' liberan pagos.', 'danger'); return; }
    openModal(releaseModal(p), 'Liberar pago · confirmación');
  });
  A('ops.release-check', function (ds, el) {
    var boxes = document.querySelectorAll('input[data-ops-change="ops.release-check"][data-id="' + ds.id + '"]');
    var all = Array.prototype.every.call(boxes, function (b) { return b.checked; });
    var btn = document.getElementById('ops-release-confirm'); if (btn) btn.disabled = !all;
  });
  A('ops.release-confirm', function (ds, el, ctx) {
    var p = D.byId(D.payouts, ds.id); if (!p) return;
    p.status = 'pagado'; p.releasedBy = actingUser(ctx).id; p.releasedAt = TODAY;
    if (p.account === 'escrow') D.escrowSummary.held = Math.max(0, D.escrowSummary.held - p.amount);
    D.escrowSummary.pendingReleases = pendingReleases().length;
    // matching fee income (e.g. management fee) settles at the same time
    D.payouts.forEach(function (q) { if (q.dealId === p.dealId && q.kind === 'ingreso' && q.status === 'pendiente' && !q.projected && monthOf(q.date) === monthOf(p.date)) q.status = 'pagado'; });
    var t = D.tasks.filter(function (x) { return x.kind === 'money' && x.status === 'pendiente'; })[0]; if (t && p.dealId === 'd-005') t.status = 'listo';
    closeModal(); rerender(); toast('Pago liberado', money(p.amount) + ' → ' + nameOf(p.counterparty) + ' · lote Bancolombia enviado.', 'success');
  });

  // payroll
  A('ops.payroll-open', function (ds, el, ctx) { if (!canApproveMoney(ctx)) { toast('Requiere contadora', 'Solo contabilidad ejecuta la nómina.', 'danger'); return; } openModal(payrollModal(), 'Ejecutar nómina · septiembre'); });
  A('ops.payroll-check', function () { var boxes = document.querySelectorAll('input[data-ops-change="ops.payroll-check"]'); var all = Array.prototype.every.call(boxes, function (b) { return b.checked; }); var btn = document.getElementById('ops-payroll-confirm'); if (btn) btn.disabled = !all; });
  A('ops.payroll-confirm', function () {
    var lines = payrollLines({ roleId: 'accountant' }); var total = sum(lines, function (x) { return x.total; });
    S.payroll.status = 'pagada';
    D.payouts.push({ id: nextId('p', D.payouts), date: '2026-09-30', account: 'payroll', dealId: null, kind: 'egreso', concept: 'Nómina septiembre · ' + lines.filter(function (x) { return x.total; }).length + ' personas', amount: total, counterparty: 'Equipo Dorum', status: 'pagado', splitKind: 'salary' });
    closeModal(); rerender(); toast('Nómina ejecutada', money(total) + ' · lote enviado a Bancolombia · PILA programada.', 'success');
  });

  // rentals
  A('ops.rent-remind', function (ds) { var r = D.byId(S.rentRoll, ds.id); if (r) openDrawer(rentReminderDrawer(r), 'Recordatorio de pago'); });
  A('ops.rent-remind-send', function (ds) { var r = D.byId(S.rentRoll, ds.id); if (!r) return; r.reminded = TODAY; closeDrawer(); toast('Recordatorio enviado', 'WhatsApp a ' + r.tenant + ' · registrado en la cartera.', 'success'); });
  A('ops.rent-paid', function (ds) { var r = D.byId(S.rentRoll, ds.id); if (!r) return; r.status = 'pagado'; r.paidAt = TODAY; r.daysLate = 0; rerender(); toast('Pago registrado', r.unit + ' · ' + money(r.canon) + ' · recibo enviado al arrendatario y al propietario.', 'success'); });
  A('ops.ticket-assign', function (ds) { var t = D.byId(S.tickets, ds.id); if (!t || !t.ai) return; t.status = 'asignado'; t.vendor = t.ai.vendor; t.cost = t.ai.cost; rerender(); toast('Proveedor asignado', t.ai.vendor + ' · ' + t.ai.eta + ' · se avisó al arrendatario y al propietario.', 'success'); });
  A('ops.ticket-move', function (ds) { var t = D.byId(S.tickets, ds.id); if (!t) return; t.status = ds.to; if (ds.to === 'cerrado') t.closed = TODAY; if (ds.to === 'asignado' && !t.vendor) t.vendor = 'Por definir'; rerender(); toast('Ticket actualizado', t.title + ' → ' + STATUS_LABEL[ds.to] + '.', 'success'); });
  A('ops.ticket-new', function () { openModal(ticketModal(), 'Nuevo ticket de mantenimiento'); });
  A('ops.ticket-create', function () {
    var title = val('ops-tk-title').trim(); if (!title) { toast('Describe el problema', 'El título es obligatorio.', 'danger'); return; }
    var sel = document.getElementById('ops-tk-unit'); var opt = sel && sel.options[sel.selectedIndex];
    S.tickets.unshift({ id: 'tk-' + String(S.tickets.length + 1).padStart(2, '0'), unit: val('ops-tk-unit'), listingId: opt ? opt.dataset.listing || null : null, title: title, reportedBy: 'Administración', priority: val('ops-tk-prio'), status: 'nuevo', created: TODAY, ai: { vendor: /agua|gotera|filtr|tuber/i.test(title) ? 'Plomería Express Medellín' : /luz|eléctr|toma|breaker/i.test(title) ? 'Electricistas del Valle' : 'Mantenimiento General Dorum', eta: 'Visita en 48 h', cost: 150000, reason: 'Clasificación por palabras clave del reporte · costo estimado según histórico de la unidad.' } });
    closeModal(); S.tab.rentals = 'mantenimiento'; rerender(); toast('Ticket creado', 'Llave propuso proveedor y ventana de visita. Aprueba el triage en el tablero.', 'ai');
  });
  A('ops.ipc-approve', function (ds) { var x = D.byId(S.leases, ds.id); if (!x) return; x.renewal = 'aprobado'; rerender(); toast('Renovación aprobada', x.unit + ' · nuevo canon ' + money(ipcNew(x)) + ' · aviso enviado a ' + x.tenant + '.', 'success'); });
  A('ops.ipc-edit', function (ds) { var x = D.byId(S.leases, ds.id); if (!x) return; var v = window.prompt ? window.prompt('Incremento % para ' + x.unit, x.ipcPct) : null; if (v != null && !isNaN(parseFloat(v))) { x.ipcPct = parseFloat(v); rerender(); toast('Incremento actualizado', x.unit + ' · +' + x.ipcPct + ' % → ' + money(ipcNew(x)), 'success'); } });
  A('ops.ipc-dismiss', function (ds) { var x = D.byId(S.leases, ds.id); if (!x) return; x.renewal = 'no'; S.leases = S.leases.filter(function (l) { return l.id !== x.id; }); rerender(); toast('Sin renovación', x.unit + ' · se programa inventario de salida para ' + fdate(x.end, 'default') + '.', 'success'); });
  A('ops.inventory-open', function (ds) { var inv = D.byId(S.inventories, ds.id); if (inv) openDrawer(inventoryDrawer(inv), 'Inventario · ' + inv.unit); });
  A('ops.inventory-check', function (ds, el) { var inv = D.byId(S.inventories, ds.id); if (!inv) return; var it = inv.items[+ds.index]; it.done = el.checked; if (it.done && !it.photos) it.photos = 3; if (inv.status === 'pendiente') inv.status = 'en curso'; openDrawer(inventoryDrawer(inv), 'Inventario · ' + inv.unit); });
  A('ops.inventory-all', function (ds) { var inv = D.byId(S.inventories, ds.id); if (!inv) return; inv.items.forEach(function (it) { if (!it.done) { it.done = true; it.photos = it.photos || 3; } }); inv.status = 'en curso'; openDrawer(inventoryDrawer(inv), 'Inventario · ' + inv.unit); toast('Checklist completo', inv.items.length + ' espacios con fotos (demo).', 'success'); });
  A('ops.inventory-sign', function (ds) {
    var inv = D.byId(S.inventories, ds.id); if (!inv) return;
    inv.status = 'firmado';
    var k = inv.contractId && D.byId(D.contracts, inv.contractId); if (k) { k.status = 'enviado'; k.signers.forEach(function (s) { if (s.status === 'pendiente') s.status = 'enviado'; }); k.clauses = inv.items.length; k.updated = TODAY; }
    closeDrawer(); rerender(); toast('Inventario enviado a firma', inv.parties.map(nameOf).join(' y ') + ' reciben el PDF con ' + sum(inv.items, function (i) { return i.photos; }) + ' fotos.', 'success');
  });
  A('ops.cal-month', function (ds) { S.calMonth = shiftMonth(S.calMonth, +ds.dir); S.tab.rentals = 'vacacional'; rerender(); });
  A('ops.statement-send', function (ds) { var d = deal(ds.id); if (!d) return; S.statementsSent[d.id] = TODAY; rerender(); toast('Extracto enviado', nameOf(d.parties.landlord) + ' · PDF + resumen por WhatsApp y correo.', 'success'); });
  A('ops.statement-pdf', function (ds) { var d = deal(ds.id); toast('PDF generado', 'Extracto ' + (d ? nameOf(d.parties.landlord) : '') + ' · agosto 2026 (descarga simulada).', 'success'); });

  // lifestyle
  A('ops.lifestyle-notify', function (ds) { var s = D.byId(D.lifestyle, ds.id); if (!s) return; S.notified[s.id] = TODAY; rerender(); toast('Te avisaremos', s.nameEs + ' · te escribimos por WhatsApp cuando abra en tu zona.', 'success'); });
  A('ops.lifestyle-request', function (ds, el, ctx) { var s = D.byId(D.lifestyle, ds.id); if (s) openDrawer(lifestyleRequestDrawer(s, ctx), 'Solicitar · ' + s.nameEs); });
  A('ops.lifestyle-submit', function (ds, el, ctx) {
    var s = D.byId(D.lifestyle, ds.id); if (!s) return;
    S.lifestyleRequests.push({ id: 'lr-' + String(S.lifestyleRequests.length + 1).padStart(2, '0'), serviceId: s.id, who: actingUser(ctx).id, when: fdate(val('ops-lr-date') || TODAY) + ' · ' + (val('ops-lr-time') || ''), note: val('ops-lr-note') || s.nameEs, status: 'solicitado' });
    closeDrawer(); rerender(); toast('Solicitud enviada', 'El concierge Dorum te confirma por WhatsApp en menos de 2 horas.', 'success');
  });
  A('ops.lifestyle-config', function (ds) { var s = D.byId(D.lifestyle, ds.id); if (s) openDrawer(lifestyleConfigDrawer(s), 'Configurar oferta'); });
  A('ops.lifestyle-save', function (ds) {
    var cfg = S.lifestyleConfig[ds.id]; if (!cfg) return;
    cfg.partners = val('ops-ls-partners').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); cfg.margin = +val('ops-ls-margin') || 0; cfg.launch = val('ops-ls-launch'); var v = document.getElementById('ops-ls-visible'); cfg.visible = v ? v.checked : cfg.visible;
    closeDrawer(); rerender(); toast('Oferta guardada', cfg.partners.length + ' aliados · margen ' + cfg.margin + ' %.', 'success');
  });

  // referrals
  A('ops.preapproval-open', function (ds) { var r = D.byId(S.referrals, ds.id); if (r) openModal(preapprovalModal(r), 'Actualizar estado del crédito'); });
  A('ops.preapproval-save', function (ds) {
    var r = D.byId(S.referrals, ds.id); if (!r) return;
    r.status = val('ops-pa-status'); r.amount = +val('ops-pa-amount') || 0; r.expires = val('ops-pa-exp') || null; r.next = val('ops-pa-next');
    var c = refContact(r);
    closeModal(); rerender(); toast('Estado actualizado', c.name + ' · ' + (STATUS_LABEL[r.status] || r.status) + (r.amount ? ' · ' + moneyC(r.amount) : '') + ' · se avisó a ' + nameOf(c.owner) + '.', 'success');
  });
})();
