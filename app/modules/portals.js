/* ==========================================================================
   Llave OS · Dorum tenant app · CUSTOMER PORTALS
   Modules + widgets for the four customer roles: seller, buyer, landlord, renter.
   Plugs into the app shell API (app/app.js): LLAVE.register / registerWidget / action.
   Plain script, no build step. Styles are additive and injected once.

   DATA LINKAGE (how a demo customer is tied to records in assets/data.js)
   - seller   → listings where `ownerId === user.id` (u-sel-1 → lst-004, lst-008; u-sel-2 → lst-001).
                Fallback: deals where parties.seller === user.id; then the first `activo` venta listing.
                Primary listing = the most advanced one (bajo oferta > most leads).
   - buyer    → contact in pipeline 'sell' with `userId === user.id` (interest[] = shortlist seed),
                deals where parties.buyer === user.id (offers, lender, documents owed by 'buyer').
   - landlord → arriendo listings where `ownerId === user.id` + their deals (canon, mgmtPct, tenant) +
                DORUM.payouts whose counterparty is the landlord.
   - renter   → deal kind 'arriendo' where parties.renter === user.id (u-ren-2 → d-004 / lst-010 / k-004).
                u-ren-1 (Sofía Ramírez) has no explicit link in data.js, so we deterministically attach the
                first arriendo deal that has a renter party (d-004, Apto Laureles) and present it as hers.
   Things the dataset does not model (visits, messages, maintenance tickets, tours, monthly statements,
   receipts) are seeded deterministically here from the linked records and kept in module memory so
   demo actions (pay, approve, upload, send) persist across re-renders.
   ========================================================================== */
(function () {
  'use strict';
  if (!window.LLAVE) return;
  var L = window.LLAVE;
  var D = window.DORUM;
  if (!D) return;

  var TODAY = new Date('2026-09-16T12:00:00');

  /* ------------------------------------------------------------------ utils */
  function esc(s) { if (L.esc) return L.esc(s == null ? '' : String(s)); return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function ico(name, cls) { var s = ''; try { s = (L.icon && L.icon(name)) || ''; } catch (e) { s = ''; } if (cls && s) s = s.replace('<svg', '<svg class="' + cls + '"'); return s; }
  function cop(n, o) { return D.fmtCOP(n, o); }
  function money(n, cur) { return D.fmtMoney(n, cur || 'COP'); }
  function fdate(iso, style) { return D.fmtDate(iso, style); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(base, n) { var d = new Date(base.getTime()); d.setDate(d.getDate() + n); return d; }
  function daysBetween(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
  function firstName(u) { return u && u.name ? u.name.split(' ')[0] : ''; }
  function pct(n) { return D.fmtPct(n); }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return Math.abs(h); }
  function join(arr) { return arr.join(''); }
  function route(role, mod, id) { return D.routeTo(role, mod, id); }
  function badge(status) { return '<span class="badge badge-status" data-status="' + esc(status) + '">' + esc(D.statusLabel(status)) + '</span>'; }
  function aiTag(text) { return '<span class="pt-ai-tag">' + esc(text || 'Redactado por Llave') + '</span>'; }
  function toast(t, b, v) { if (L.toast) L.toast(t, b, v); else D.toast(t, b, v); }
  function rerender() { if (L.rerender) L.rerender(); }
  function monthName(m) { return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][m]; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function initials(name) { return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }

  /* small inline SVG charts (own implementation so we don't depend on chart signatures) */
  function sparkline(values, w, h) {
    w = w || 240; h = h || 56;
    var max = Math.max.apply(null, values) || 1, min = Math.min.apply(null, values);
    var span = (max - min) || 1, n = values.length, pts = [];
    for (var i = 0; i < n; i++) { pts.push([(i / (n - 1)) * (w - 8) + 4, h - 6 - ((values[i] - min) / span) * (h - 14)]); }
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[n - 1][0].toFixed(1) + ' ' + (h - 2) + ' L' + pts[0][0].toFixed(1) + ' ' + (h - 2) + ' Z';
    var last = pts[n - 1];
    return '<svg class="pt-spark" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + area + '" fill="var(--brand-2)" opacity="0.14"></path>' +
      '<path d="' + line + '" fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>' +
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5" fill="var(--accent)"></circle></svg>';
  }
  function bars(items, h) {
    // items: [{label, value, muted}]
    h = h || 96;
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    return '<div class="pt-bars" style="height:' + h + 'px">' + join(items.map(function (it) {
      var v = Math.max(4, Math.round((it.value / max) * (h - 26)));
      return '<div class="pt-bar' + (it.muted ? ' is-muted' : '') + (it.hot ? ' is-hot' : '') + '"><span style="height:' + v + 'px" title="' + esc(it.value) + '"></span><small>' + esc(it.label) + '</small></div>';
    })) + '</div>';
  }
  function series(seed, n, base, spread) { var out = []; for (var i = 0; i < n; i++) { out.push(Math.round(base * (0.55 + ((hash(seed + i) % 100) / 100) * 0.9) + i * spread)); } return out; }

  /* ---------------------------------------------------------------- styles */
  var CSS = '\
.pt{max-width:1040px;width:100%;margin-inline:auto;display:flex;flex-direction:column;gap:var(--s-6);font-size:var(--fs-md)}\
.pt .small{font-size:var(--fs-sm)} .pt .xs{font-size:var(--fs-xs)}\
.pt-head{display:flex;flex-direction:column;gap:var(--s-1)}\
.pt-head h1{font-family:var(--font-display);font-weight:500;font-size:var(--fs-3xl);letter-spacing:-.02em;line-height:1.05}\
.pt-head h1 em{font-style:italic;color:var(--accent)}\
.pt-hello{color:var(--text-2)}\
.pt-next{position:relative;overflow:hidden;background:linear-gradient(135deg,#0F3D2E,#1E7A57);color:#FFFCF5;border-radius:var(--r-2xl);padding:var(--s-6);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--s-5);align-items:center;box-shadow:var(--sh-2)}\
.pt-next::after{content:"";position:absolute;right:-70px;top:-70px;width:240px;height:240px;border-radius:50%;background:rgb(255 255 255/.08);pointer-events:none}\
.pt-next .eyebrow{color:rgb(255 252 245/.72)}\
.pt-next h2{font-family:var(--font-display);font-weight:500;font-size:var(--fs-2xl);line-height:1.12;margin-top:var(--s-2);letter-spacing:-.015em}\
.pt-next p{color:rgb(255 252 245/.82);margin-top:var(--s-2);max-width:58ch;font-size:var(--fs-base)}\
.pt-next .pt-actions{position:relative;z-index:1}\
.btn-light{background:#FFFCF5;color:var(--brand);border-color:transparent;box-shadow:var(--sh-1)}\
.btn-light:hover{background:#F3EDE0}\
.btn-glass{background:rgb(255 255 255/.14);color:#FFFCF5;border-color:rgb(255 255 255/.25)}\
.btn-glass:hover{background:rgb(255 255 255/.24)}\
.pt-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-5);align-items:start}\
.pt-grid>.span-2{grid-column:span 2}\
.pt-sec{display:flex;align-items:center;justify-content:space-between;gap:var(--s-3);margin-bottom:var(--s-4)}\
.pt-sec h3{font-size:var(--fs-lg);font-weight:600;letter-spacing:-.01em}\
.pt-sec .pt-ai-tag{flex:none}\
.pt-kv{display:grid;grid-template-columns:minmax(96px,max-content) minmax(0,1fr);gap:var(--s-2) var(--s-4);margin:0;font-size:var(--fs-base)}\
.pt-kv dt{color:var(--text-3)} .pt-kv dd{margin:0;font-weight:600;text-align:right;font-variant-numeric:tabular-nums;min-width:0;overflow-wrap:anywhere}\
.pt-big{font-family:var(--font-display);font-size:var(--fs-3xl);font-weight:500;letter-spacing:-.02em;line-height:1;font-variant-numeric:tabular-nums}\
.pt-big small{font-family:var(--font-ui);font-size:var(--fs-sm);color:var(--text-3);font-weight:500;letter-spacing:0}\
.pt-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:var(--s-3)}\
.pt-tile{padding:var(--s-4);border-radius:var(--r-lg);background:var(--surface-2)}\
.pt-tile .stat-value{font-size:var(--fs-xl)}\
.pt-lrow{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:var(--s-4);align-items:center;padding:var(--s-3);border:1px solid var(--border);border-radius:var(--r-lg);background:var(--surface)}\
.pt-lrow img{width:96px;height:72px;object-fit:cover;border-radius:var(--r-md);background:var(--bg-deep)}\
.pt-lrow .t{font-weight:600;font-size:var(--fs-base);line-height:1.3} .pt-lrow .m{font-size:var(--fs-sm);color:var(--text-3)}\
.pt-lrow .p{font-family:var(--font-display);font-size:var(--fs-lg);font-weight:500;font-variant-numeric:tabular-nums;white-space:nowrap}\
.pt-lrow .pt-actions{justify-content:flex-end}\
.pt-lrow-r{display:flex;flex-direction:column;align-items:flex-end;gap:var(--s-2);min-width:0}\
.pt-hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:var(--r-xl);background:var(--bg-deep)}\
.pt-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--s-2);counter-reset:s}\
.pt-step{position:relative;padding-top:var(--s-4);font-size:var(--fs-sm);color:var(--text-3)}\
.pt-step::before{content:"";position:absolute;left:0;right:0;top:0;height:6px;border-radius:3px;background:var(--surface-3)}\
.pt-step.is-done::before{background:var(--brand-2)} .pt-step.is-current::before{background:var(--accent)}\
.pt-step.is-done,.pt-step.is-current{color:var(--text)} .pt-step b{display:block;font-weight:600;font-size:var(--fs-sm)} .pt-step small{display:block;font-size:var(--fs-xs);color:var(--text-3)}\
.pt-msgs{display:flex;flex-direction:column;gap:var(--s-2);max-height:56vh;min-height:220px;overflow:auto;padding:var(--s-2) var(--s-1);scroll-behavior:smooth}\
.pt-msg{max-width:80%;padding:var(--s-3) var(--s-4);border-radius:var(--r-xl);background:var(--surface-2);font-size:var(--fs-base);line-height:1.45}\
.pt-msg.is-me{align-self:flex-end;background:var(--brand-soft);border-bottom-right-radius:var(--r-sm)}\
.pt-msg.is-them{align-self:flex-start;border-bottom-left-radius:var(--r-sm)}\
.pt-msg.is-ai{box-shadow:inset 3px 0 0 var(--ai)}\
.pt-msg .meta{display:flex;gap:var(--s-2);align-items:center;flex-wrap:wrap;font-size:var(--fs-xs);color:var(--text-3);margin-top:var(--s-1)}\
.pt-msg.is-pending{opacity:.75;border:1px dashed var(--ai)}\
.pt-day{align-self:center;font-size:var(--fs-xs);color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;padding:var(--s-2) 0}\
.pt-composer{display:flex;gap:var(--s-2);align-items:flex-end;padding-top:var(--s-3);border-top:1px solid var(--border)}\
.pt-composer .textarea{min-height:46px;max-height:140px;flex:1;border-radius:var(--r-xl)}\
.pt-quick{display:flex;gap:var(--s-2);flex-wrap:wrap;padding-top:var(--s-3)}\
.pt-upload{display:block;width:100%;border:2px dashed var(--border-strong);border-radius:var(--r-lg);padding:var(--s-5);text-align:center;color:var(--text-2);background:var(--surface-2);cursor:pointer;font-size:var(--fs-sm);transition:border-color var(--dur) var(--ease),background var(--dur) var(--ease)}\
.pt-upload:hover{border-color:var(--brand-2)} .pt-upload svg{width:28px;height:28px;margin:0 auto var(--s-2);color:var(--brand-2)}\
.pt-upload.is-done{border-style:solid;border-color:var(--success);background:var(--success-soft);color:var(--success)} .pt-upload.is-done svg{color:var(--success)}\
.pt-doc{display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) 0;border-bottom:1px solid var(--border);flex-wrap:wrap} .pt-doc:last-child{border-bottom:0} .pt-doc>.flex-1{flex:1 1 160px}\
.pt .btn svg,.pt-widget .btn svg{width:1.1em;height:1.1em;flex:none}\
.pt-doc .pt-ico{width:40px;height:40px;border-radius:var(--r-md);display:grid;place-items:center;background:var(--surface-2);color:var(--text-2);flex:none} .pt-doc .pt-ico svg{width:20px;height:20px}\
.pt-doc[data-status="validado"] .pt-ico{background:var(--success-soft);color:var(--success)}\
.pt-doc[data-status="recibido"] .pt-ico{background:var(--info-soft);color:var(--info)}\
.pt-doc[data-status="pendiente"] .pt-ico{background:var(--warn-soft);color:var(--warn)}\
.pt-doc[data-status="vencido"] .pt-ico,.pt-doc[data-status="rechazado"] .pt-ico{background:var(--danger-soft);color:var(--danger)}\
.pt-doc .t{font-weight:600;font-size:var(--fs-base);line-height:1.3} .pt-doc .m{font-size:var(--fs-sm);color:var(--text-3)}\
.pt-doc .m.ai{color:var(--ai)}\
.pt-doc .act{margin-left:auto;flex:none}\
.pt-map{aspect-ratio:16/8;border-radius:var(--r-lg);overflow:hidden;background:var(--bg-deep);position:relative}\
.pt-map>svg{width:100%;height:100%;display:block}\
.pt-map .lbl{display:inline-flex;align-items:center;gap:.35em} .pt-map .lbl svg{width:14px;height:14px;flex:none}\
.pt-map .lbl{position:absolute;left:var(--s-3);bottom:var(--s-3);background:var(--surface);padding:var(--s-1) var(--s-3);border-radius:var(--r-pill);font-size:var(--fs-xs);font-weight:600;box-shadow:var(--sh-1)}\
.pt-pm-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-2)}\
.pt-pm{border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--s-3) var(--s-2);display:flex;flex-direction:column;align-items:center;gap:var(--s-2);font-weight:600;font-size:var(--fs-sm);background:var(--surface);color:var(--text-2)}\
.pt-pm.is-active{border-color:var(--brand-2);background:var(--brand-soft);color:var(--text);box-shadow:0 0 0 2px var(--brand-soft)}\
.pt-pm .logo{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:var(--fs-xs);color:#fff;letter-spacing:.02em}\
.pt-compare th img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--r-md);margin-bottom:var(--s-2)}\
.pt-compare th{text-transform:none;letter-spacing:0;font-size:var(--fs-sm);color:var(--text);min-width:150px;vertical-align:top}\
.pt-compare td:first-child,.pt-compare th:first-child{color:var(--text-3);font-weight:500;min-width:110px;position:sticky;left:0;background:var(--surface)}\
.pt-compare td.best{color:var(--success);font-weight:600}\
.pt-widget{display:flex;flex-direction:column;gap:var(--s-3);font-size:var(--fs-sm)}\
.pt-widget .pt-big{font-size:var(--fs-2xl)}\
.pt-widget .pt-lrow{grid-template-columns:64px minmax(0,1fr) auto;gap:var(--s-3)} .pt-widget .pt-lrow img{width:64px;height:48px} .pt-widget .pt-lrow .p{font-size:var(--fs-base)}\
.pt-widget .pt-doc{padding:var(--s-2) 0} .pt-widget .pt-doc .pt-ico{width:32px;height:32px} .pt-widget .pt-doc .t{font-size:var(--fs-sm)}\
.pt-widget-foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:var(--s-2)}\
.pt-ai-tag{display:inline-flex;align-items:center;gap:.4em;font-size:var(--fs-xs);color:var(--ai);font-weight:600;letter-spacing:.02em}\
.pt-ai-tag::before{content:"";width:8px;height:8px;background:var(--ai);transform:rotate(45deg);border-radius:2px;flex:none}\
.pt-actions{display:flex;gap:var(--s-2);flex-wrap:wrap;align-items:center}\
.pt-empty{padding:var(--s-8) var(--s-4);text-align:center;color:var(--text-3);font-size:var(--fs-base)}\
.pt-visit{display:grid;grid-template-columns:56px minmax(0,1fr);gap:var(--s-3);align-items:start;padding:var(--s-3) 0;border-bottom:1px solid var(--border)} .pt-visit:last-child{border-bottom:0}\
.pt-date{width:56px;text-align:center;border-radius:var(--r-md);background:var(--surface-2);padding:var(--s-2) 0;line-height:1.1}\
.pt-date b{display:block;font-size:var(--fs-xl);font-family:var(--font-display);font-weight:500} .pt-date span{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)}\
.pt-date.is-past{opacity:.7}\
.pt-visit .t{font-weight:600;font-size:var(--fs-base)} .pt-visit .m{font-size:var(--fs-sm);color:var(--text-3)}\
.pt-quote{font-size:var(--fs-base);color:var(--text-2);font-style:italic;padding:var(--s-2) var(--s-3);border-left:2px solid var(--border-strong);margin-top:var(--s-2)}\
.pt-chips{display:flex;gap:var(--s-2);flex-wrap:wrap}\
.pt-filters{display:flex;flex-direction:column;gap:var(--s-3)}\
.pt-filters .row-lbl{font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:600;min-width:72px}\
.pt-concierge{display:flex;gap:var(--s-2);align-items:stretch}\
.pt-concierge .input{flex:1;padding:.8rem 1rem;font-size:var(--fs-base);border-radius:var(--r-lg)}\
.pt-match{display:inline-flex;align-items:center;gap:.35em;font-size:var(--fs-xs);font-weight:600;color:var(--brand-2)}\
.pt-heart.is-on{color:var(--accent)} .pt-heart.is-on svg{fill:var(--accent)}\
.pt-bars{display:flex;align-items:flex-end;gap:6px} .pt-bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:0}\
.pt-bar span{display:block;width:100%;max-width:38px;border-radius:6px 6px 2px 2px;background:var(--brand-2)} .pt-bar.is-muted span{background:var(--surface-3)} .pt-bar.is-hot span{background:var(--accent)}\
.pt-bar small{font-size:var(--fs-xs);color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}\
.pt-ls-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--s-2)}\
.pt-ls{padding:var(--s-3) var(--s-2);border-radius:var(--r-lg);background:var(--surface-2);text-align:center;font-size:var(--fs-xs);font-weight:600;color:var(--text-2)}\
.pt-ls .em{font-size:1.5rem;line-height:1;margin-bottom:var(--s-2)}\
.pt-contact{display:flex;align-items:center;gap:var(--s-3);padding:var(--s-3) 0;border-bottom:1px solid var(--border)} .pt-contact:last-child{border-bottom:0}\
.pt-contact .t{font-weight:600} .pt-contact .m{font-size:var(--fs-sm);color:var(--text-3)} .pt-contact .act{margin-left:auto;display:flex;gap:var(--s-1)}\
.pt-stmt{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--s-1) var(--s-4);font-size:var(--fs-base);margin:0}\
.pt-stmt dt{color:var(--text-2)} .pt-stmt dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}\
.pt-stmt .neg{color:var(--danger)} .pt-stmt .tot dt,.pt-stmt .tot dd{font-weight:700;padding-top:var(--s-2);border-top:1px solid var(--border);font-size:var(--fs-md)}\
.pt-ticket{display:flex;gap:var(--s-3);align-items:flex-start;padding:var(--s-3) 0;border-bottom:1px solid var(--border)} .pt-ticket:last-child{border-bottom:0}\
.pt-ticket .pt-ico{width:40px;height:40px;border-radius:var(--r-md);display:grid;place-items:center;background:var(--surface-2);color:var(--text-2);flex:none} .pt-ticket .pt-ico svg{width:20px;height:20px}\
.pt-ticket .t{font-weight:600;font-size:var(--fs-base)} .pt-ticket .m{font-size:var(--fs-sm);color:var(--text-3)}\
.pt-ticket[data-urg="alta"] .pt-ico{background:var(--danger-soft);color:var(--danger)} .pt-ticket[data-urg="media"] .pt-ico{background:var(--warn-soft);color:var(--warn)}\
.pt-ticket[data-tstatus="resuelto"] .pt-ico{background:var(--success-soft);color:var(--success)}\
.pt-lease-bar{display:flex;justify-content:space-between;font-size:var(--fs-xs);color:var(--text-3);margin-top:var(--s-1)}\
.pt-inv{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:var(--s-2)}\
.pt-inv div{padding:var(--s-2) var(--s-3);border-radius:var(--r-md);background:var(--surface-2);font-size:var(--fs-sm)} .pt-inv small{display:block;color:var(--text-3);font-size:var(--fs-xs)}\
.pt-price-range{position:relative;height:10px;border-radius:5px;background:linear-gradient(90deg,var(--warn-soft),var(--success-soft),var(--warn-soft));margin:var(--s-5) 0 var(--s-2)}\
.pt-price-range i{position:absolute;top:-6px;width:22px;height:22px;border-radius:50%;background:var(--brand);border:3px solid var(--surface);box-shadow:var(--sh-2);transform:translateX(-50%)}\
.pt-price-range small{position:absolute;top:14px;font-size:var(--fs-xs);color:var(--text-3);transform:translateX(-50%);white-space:nowrap}\
.pt-modal-total{display:flex;justify-content:space-between;align-items:baseline;padding:var(--s-4);border-radius:var(--r-lg);background:var(--surface-2)}\
.pt-offer{padding:var(--s-4);border:1px solid var(--border);border-radius:var(--r-lg);display:flex;flex-direction:column;gap:var(--s-3)}\
.pt-offer .who{display:flex;align-items:center;gap:var(--s-3)}\
.pt-offer .amt{display:flex;align-items:baseline;gap:var(--s-3);flex-wrap:wrap}\
@media (max-width:900px){.pt-grid{grid-template-columns:1fr}.pt-grid>.span-2{grid-column:auto}.pt-next{grid-template-columns:1fr;padding:var(--s-5)}.pt-head h1{font-size:var(--fs-2xl)}}\
@media (max-width:600px){.pt-steps{grid-template-columns:1fr;gap:var(--s-3)}.pt-step{padding-top:0;padding-left:var(--s-5)}.pt-step::before{left:0;top:4px;right:auto;width:10px;height:10px;border-radius:50%}.pt-lrow{grid-template-columns:72px minmax(0,1fr)}.pt-lrow img{width:72px;height:56px}.pt-lrow>.pt-actions,.pt-lrow>.p,.pt-lrow>.pt-lrow-r{grid-column:1/-1;justify-content:flex-start}.pt-lrow-r{flex-direction:row;align-items:center;justify-content:space-between!important;flex-wrap:wrap}.pt-msg{max-width:90%}.pt-pm-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pt-big{font-size:var(--fs-2xl)}.pt-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}.pt-ls-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.pt-concierge{flex-direction:column}}\
';
  if (!document.getElementById('portals-css')) { var st = document.createElement('style'); st.id = 'portals-css'; st.textContent = CSS; document.head.appendChild(st); }

  /* ------------------------------------------------------------ demo state */
  // Everything the dataset does not model lives here, seeded lazily and deterministically.
  var S = { seeded: {}, offers: [], visits: {}, threads: {}, tickets: [], tours: {}, shortlist: {}, docs: {}, payments: {}, approvals: {}, search: { q: '', type: 'todos', zona: 'todas', max: 0, hab: 0, note: '' }, pay: { method: 'pse' }, ticketForm: { urg: 'media', photo: false }, selProp: {}, lender: {} };
  function once(key, fn) { if (!S.seeded[key]) { S.seeded[key] = true; fn(); } }

  /* --------------------------------------------------------- customer link */
  function actingUser(ctx) {
    if (ctx.user && ctx.user.id) return ctx.user;
    return D.usersByRole(ctx.roleId)[0] || { id: 'anon', name: 'Cliente', initials: 'CL' };
  }
  function rankListing(a, b) {
    var r = { 'bajo oferta': 3, 'activo': 2, 'en preparación': 1 };
    return ((r[b.status] || 0) - (r[a.status] || 0)) || ((b.leads || 0) - (a.leads || 0));
  }
  function seller(ctx) {
    var u = actingUser(ctx);
    var ls = D.listings.filter(function (l) { return l.ownerId === u.id && l.operacion === 'venta'; });
    if (!ls.length) ls = D.deals.filter(function (d) { return d.parties && d.parties.seller === u.id; }).map(function (d) { return D.listing(d.listingId); }).filter(Boolean);
    if (!ls.length) ls = D.listings.filter(function (l) { return l.operacion === 'venta' && l.status === 'activo'; }).slice(0, 1);
    ls = ls.slice().sort(rankListing);
    var primary = ls[0];
    var deals = D.deals.filter(function (d) { return ls.some(function (l) { return l.id === d.listingId; }); });
    return { user: u, listings: ls, listing: primary, deals: deals, broker: D.user(primary.listedBy) || D.usersByRole('broker')[0], campaigns: D.campaigns.filter(function (c) { return ls.some(function (l) { return l.id === c.listingId; }); }) };
  }
  function buyer(ctx) {
    var u = actingUser(ctx);
    var contact = D.contacts.filter(function (c) { return c.pipeline === 'sell' && c.userId === u.id; })[0] || D.contacts.filter(function (c) { return c.kind === 'buyer'; })[0];
    var deals = D.deals.filter(function (d) { return d.kind === 'venta' && d.parties && d.parties.buyer === u.id; });
    var broker = D.user(contact && contact.owner) || D.usersByRole('broker')[0];
    var lender = null; deals.forEach(function (d) { if (d.parties.lender) lender = D.user(d.parties.lender); });
    return { user: u, contact: contact, deals: deals, broker: broker, lender: lender, budget: contact ? contact.budget : null, currency: contact && contact.currency || 'COP' };
  }
  function landlord(ctx) {
    var u = actingUser(ctx);
    var ls = D.listings.filter(function (l) { return l.ownerId === u.id && l.operacion === 'arriendo'; });
    if (!ls.length) ls = D.deals.filter(function (d) { return d.kind === 'arriendo' && d.parties && d.parties.landlord === u.id; }).map(function (d) { return D.listing(d.listingId); }).filter(Boolean);
    if (!ls.length) ls = D.listings.filter(function (l) { return l.operacion === 'arriendo' && l.status === 'arrendado'; }).slice(0, 1);
    var props = ls.map(function (l) {
      var deal = D.deals.filter(function (d) { return d.kind === 'arriendo' && d.listingId === l.id; })[0] || null;
      var tenant = null;
      if (deal) { tenant = deal.parties.renter ? D.userName(deal.parties.renter) : ((deal.title || '').split('arrendada a ')[1] || null); }
      return { listing: l, deal: deal, tenant: tenant, rented: l.status === 'arrendado' && !!deal };
    });
    var sel = S.selProp[u.id]; var cur = props.filter(function (p) { return p.listing.id === sel; })[0] || props.filter(function (p) { return p.rented && p.deal.monthlyRent; })[0] || props[0];
    var admin = D.user('u-radmin') || D.usersByRole('rental_admin')[0];
    return { user: u, props: props, prop: cur, admin: admin, payouts: D.payouts.filter(function (p) { return p.counterparty === u.id; }) };
  }
  function renter(ctx) {
    var u = actingUser(ctx);
    var deal = D.deals.filter(function (d) { return d.kind === 'arriendo' && d.parties && d.parties.renter === u.id; })[0];
    // No explicit link in data.js (e.g. u-ren-1 Sofía Ramírez): attach the first arriendo deal that has a renter party (d-004 · Apto Laureles).
    if (!deal) deal = D.deals.filter(function (d) { return d.kind === 'arriendo' && d.parties && d.parties.renter; })[0];
    var listing = D.listing(deal.listingId);
    var contract = D.contracts.filter(function (k) { return k.dealId === deal.id && /arrendamiento/i.test(k.type); })[0];
    var inventory = D.contracts.filter(function (k) { return k.dealId === deal.id && /inventario/i.test(k.type); })[0];
    var admin = D.user(deal.parties.rentalAdmin) || D.user('u-radmin');
    var broker = D.user(deal.parties.listingBroker || listing.listedBy);
    var landlordU = D.user(deal.parties.landlord);
    return { user: u, deal: deal, listing: listing, contract: contract, inventory: inventory, admin: admin, broker: broker, landlord: landlordU, total: (deal.monthlyRent || 0) + (deal.administracion || 0) };
  }

  /* ---------------------------------------------------------------- seeds */
  function offersFor(listingIds) {
    once('offers', function () {
      D.deals.forEach(function (d) {
        if (d.kind !== 'venta' || !d.offerPrice) return;
        var counter = Math.round(d.offerPrice + (d.askingPrice - d.offerPrice) * 0.52);
        counter = Math.round(counter / 1e7) * 1e7;
        S.offers.push({ id: 'of-' + d.id, dealId: d.id, listingId: d.listingId, buyerId: d.parties.buyer, buyerName: D.userName(d.parties.buyer), amount: d.offerPrice, asking: d.askingPrice, at: '2026-09-15', status: d.status === 'bajo oferta' ? 'pendiente' : 'pendiente',
          terms: d.id === 'd-001' ? 'Pago de contado · entrega en 60 días · pide mobiliario incluido' : 'Crédito Bancolombia pre-aprobado (COP 600 M) · arras 5 % · escritura 30 nov',
          counter: { amount: counter, terms: d.id === 'd-001' ? 'Entrega en 45 días · mobiliario incluido' : 'Arras 10 % · escritura 30 nov', basis: d.id === 'd-001' ? '6 comparables en el embalse y 2 ofertas previas' : '5 comparables en Envigado y la pre-aprobación del comprador' } });
      });
      // Seller listings that are active with many leads but no modelled offer get one seeded portal lead (demo).
      D.listings.forEach(function (l) {
        if (l.operacion !== 'venta' || !l.ownerId || l.status !== 'activo' || (l.leads || 0) < 20) return;
        if (S.offers.some(function (o) { return o.listingId === l.id; })) return;
        var amt = Math.round(l.price * 0.94 / 1e7) * 1e7, counter = Math.round(l.price * 0.97 / 1e7) * 1e7;
        S.offers.push({ id: 'of-' + l.id, dealId: null, listingId: l.id, buyerId: null, buyerName: 'Comprador vía Finca Raíz', amount: amt, asking: l.price, at: '2026-09-14', status: 'pendiente', terms: 'Pago 70 % contado + 30 % crédito · entrega en 90 días', counter: { amount: counter, terms: 'Entrega en 60 días · parqueadero adicional incluido', basis: '4 comparables en ' + l.barrio.split(' · ')[0] + ' y ' + l.leads + ' interesados en ' + l.daysOnMarket + ' días' } });
      });
    });
    return S.offers.filter(function (o) { return listingIds.indexOf(o.listingId) >= 0; });
  }
  var VISITOR_NAMES = ['Familia Restrepo Gómez', 'Ana María Londoño', 'Pareja desde Bogotá', 'Inversionista · Finca Raíz', 'Juan Pablo y Sara', 'Comprador internacional (EN)'];
  var FEEDBACK = [
    { q: 'Nos encantó la luz de la tarde y la terraza; la cocina nos pareció pequeña para la familia.', ai: 'Interés alto. Objeción: tamaño de cocina. Sugerimos mostrar el plano con la ampliación posible.', s: 'alto' },
    { q: 'Muy bien ubicado. Nos preocupa el valor de la administración.', ai: 'Interés medio. Objeción: administración. Argumento: incluye gimnasio, piscina y portería 24 h.', s: 'medio' },
    { q: 'Buscamos algo más cerca del colegio de los niños.', ai: 'Interés bajo por ubicación; no depende del inmueble. No requiere acción.', s: 'bajo' },
    { q: 'La vista es espectacular. Quieren volver con el arquitecto la próxima semana.', ai: 'Interés alto. Siguiente paso probable: segunda visita técnica. Preparar planos y certificado de tradición.', s: 'alto' }
  ];
  function visitsFor(listing) {
    once('visits-' + listing.id, function () {
      var list = [], h = hash(listing.id);
      var interested = D.contacts.filter(function (c) { return (c.kind === 'buyer' || c.kind === 'renter') && (c.interest || []).indexOf(listing.id) >= 0; });
      var names = interested.map(function (c) { return c.name; }).concat(VISITOR_NAMES.slice(h % 3));
      for (var i = 0; i < 6; i++) {
        var past = i >= 2, off = past ? -(3 + i * 4) : (2 + i * 3);
        var fb = FEEDBACK[(h + i) % FEEDBACK.length];
        list.push({ id: 'v-' + listing.id + '-' + i, listingId: listing.id, at: iso(addDays(TODAY, off)), time: ['10:00', '15:30', '11:00', '16:00'][(h + i) % 4], who: names[i % names.length], broker: listing.listedBy, past: past, confirmed: i !== 1, feedback: past ? fb.q : null, ai: past ? fb.ai : null, sentiment: past ? fb.s : null });
      }
      S.visits[listing.id] = list.sort(function (a, b) { return a.at < b.at ? -1 : 1; });
    });
    return S.visits[listing.id];
  }
  function ticketsAll() {
    once('tickets', function () {
      S.tickets = [
        { id: 'tk-001', listingId: 'lst-010', title: 'Calentador sin agua caliente', category: 'Plomería', urgency: 'alta', status: 'cotizado', createdAt: '2026-09-14', by: 'renter', triage: 'Llave clasificó el reporte como plomería · prioridad alta. Técnico sugerido: Plomería Express (4,9 ★, 12 trabajos con Dorum).', quote: { vendor: 'Plomería Express', amount: 380000, eta: 'jue 18 sep · 9:00–11:00', ai: true, note: 'Cambio de resistencia y termostato. Incluye visita y garantía de 6 meses.' } },
        { id: 'tk-002', listingId: 'lst-010', title: 'Filtración leve en balcón', category: 'Humedad', urgency: 'media', status: 'resuelto', createdAt: '2026-08-28', resolvedAt: '2026-09-03', by: 'admin', triage: 'Impermeabilización puntual. Coordinado con la administración del edificio.', quote: { vendor: 'Sellados del Valle', amount: 260000, eta: '2 sep', ai: true, approved: true } },
        { id: 'tk-003', listingId: 'lst-015', title: 'Aire acondicionado con ruido en sala de juntas', category: 'Eléctrico', urgency: 'media', status: 'en curso', createdAt: '2026-09-11', by: 'renter', triage: 'Mantenimiento preventivo de la unidad exterior. Proveedor certificado.', quote: { vendor: 'Clima Andino', amount: 540000, eta: 'mié 17 sep', ai: true, approved: true } },
        { id: 'tk-004', listingId: 'lst-005', title: 'Poda de jardín y revisión de riego', category: 'Jardín', urgency: 'baja', status: 'programado', createdAt: '2026-09-10', by: 'admin', triage: 'Incluido en el canon (mantenimiento de jardín). Sin costo para el propietario.', quote: { vendor: 'Jardines Guayacanes', amount: 0, eta: 'sáb 20 sep', ai: true, approved: true } },
        { id: 'tk-005', listingId: 'lst-012', title: 'Reparación de kayak y cambio de remos', category: 'Equipamiento', urgency: 'baja', status: 'resuelto', createdAt: '2026-08-20', resolvedAt: '2026-08-24', by: 'admin', triage: 'Reposición de equipo de la experiencia. Cargado a la liquidación de agosto.', quote: { vendor: 'Náutica Guatapé', amount: 320000, ai: false, approved: true } }
      ];
    });
    return S.tickets;
  }
  function ticketsFor(listingIds) { return ticketsAll().filter(function (t) { return listingIds.indexOf(t.listingId) >= 0; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }); }

  function toursFor(b) {
    var key = b.user.id;
    once('tours-' + key, function () {
      var list = [];
      var interest = (b.contact && b.contact.interest) || [];
      interest.forEach(function (lid, i) {
        var l = D.listing(lid); if (!l) return;
        var deal = b.deals.filter(function (d) { return d.listingId === lid; })[0];
        var past = deal ? true : i > 0; // a listing with an offer was already visited
        var off = past ? -(4 + i * 3) : 3;
        list.push({ id: 'tr-' + key + '-' + lid, listingId: lid, at: iso(addDays(TODAY, off)), time: past ? '11:00' : '10:00', broker: l.listedBy, past: past, status: past ? 'realizado' : 'confirmado', mode: l.international ? 'video' : 'presencial' });
      });
      S.tours[key] = list;
    });
    return S.tours[key].slice().sort(function (a, c) { return a.at < c.at ? -1 : 1; });
  }
  function shortlistFor(b) {
    var key = b.user.id;
    once('short-' + key, function () { S.shortlist[key] = ((b.contact && b.contact.interest) || []).slice(); });
    return S.shortlist[key];
  }

  var DOC_DEFAULTS = {
    seller: ['Certificado de tradición y libertad', 'Paz y salvo de administración', 'Impuesto predial 2026 pagado', 'Cédula de ciudadanía · vendedor', 'Escritura pública anterior'],
    buyer: ['Cédula o pasaporte · comprador', 'Declaración de origen de fondos', 'Carta de pre-aprobación de crédito (opcional)'],
    landlord: ['RUT · propietario', 'Certificado de tradición y libertad', 'Cédula de ciudadanía · propietario', 'Certificación bancaria para pagos'],
    renter: ['Cédula o pasaporte · arrendatario', 'Certificado laboral o de ingresos', 'Extractos bancarios · últimos 3 meses', 'Codeudor o póliza de afianzadora']
  };
  function docsFor(roleId, listingIds, dealIds) {
    var key = roleId + ':' + listingIds.join(',');
    once('docs-' + key, function () {
      var mine = D.documents.filter(function (d) { return d.owedBy === roleId && (listingIds.indexOf(d.listingId) >= 0 || (d.dealId && dealIds.indexOf(d.dealId) >= 0)); });
      var list = mine.slice();
      (DOC_DEFAULTS[roleId] || []).forEach(function (name, i) {
        var base = name.split(' ·')[0].toLowerCase().slice(0, 14);
        if (list.some(function (d) { return d.name.toLowerCase().indexOf(base) === 0; })) return;
        var optional = /opcional/.test(name);
        var st = ['validado', 'pendiente', 'pendiente', 'recibido', 'pendiente'][(hash(key + i)) % 5];
        if (i === 0 && !mine.length) st = 'validado';
        list.push({ id: 'sd-' + roleId + '-' + i, name: name, owedBy: roleId, status: optional ? 'pendiente' : st, optional: optional, due: st === 'pendiente' ? iso(addDays(TODAY, 6 + i * 3)) : null, aiCheck: st === 'validado' ? 'Nombre y número coinciden con el contrato.' : (st === 'recibido' ? 'Recibido; en revisión por el equipo Dorum.' : null), seeded: true });
      });
      S.docs[key] = list;
    });
    return S.docs[key];
  }

  function paymentsFor(r) {
    var key = r.deal.id;
    once('pay-' + key, function () {
      var list = [];
      D.payouts.forEach(function (p) { if (p.dealId === r.deal.id && p.counterparty === r.deal.parties.renter && p.status === 'pagado') list.push({ id: p.id, concept: 'Depósito en garantía', amount: p.amount, at: p.date, status: 'pagado', method: 'PSE · Bancolombia', ref: 'LLV-' + (hash(p.id) % 900000 + 100000) }); });
      if (!list.length) list.push({ id: 'rc-dep', concept: 'Depósito en garantía', amount: r.deal.deposit || r.deal.monthlyRent, at: '2026-09-09', status: 'pagado', method: 'PSE · Bancolombia', ref: 'LLV-' + (hash(key) % 900000 + 100000) });
      // First canon: due on the lease start date (or the 5th of the current month if the lease already started).
      var start = r.deal.startDate || iso(TODAY);
      var due = start > iso(TODAY) ? start : iso(TODAY).slice(0, 8) + '05';
      var d = new Date(due + 'T12:00:00');
      list.push({ id: 'rc-next', concept: 'Canon ' + monthName(d.getMonth()) + ' ' + d.getFullYear(), amount: r.total, at: due, status: 'pendiente', breakdown: [['Canon de arrendamiento', r.deal.monthlyRent], ['Administración', r.deal.administracion || 0]] });
      S.payments[key] = list;
    });
    return S.payments[key];
  }

  function approvalsFor(sel) {
    var key = sel.listing.id;
    once('appr-' + key, function () {
      var l = sel.listing;
      var pend = l.images.filter(function (im) { return !im.approved; }).length || 1;
      S.approvals[key] = [
        { id: 'ap-fotos-' + key, kind: 'fotos', title: pend + (pend === 1 ? ' foto nueva' : ' fotos nuevas') + ' seleccionadas por Llave', body: 'Llave ordenó las mejores ' + Math.min(20, l.images.length) + ' imágenes para los portales y marcó ' + pend + ' del dron para tu aprobación.', ai: true, imgs: l.images.slice(-3).map(function (im) { return im.url; }) },
        { id: 'ap-textos-' + key, kind: 'textos', title: 'Descripción actualizada (ES + EN)', body: l.description, ai: true, meta: 'Redactada por Llave a partir de las fotos y los comparables · revisada por ' + firstName(sel.broker) }
      ];
    });
    return S.approvals[key];
  }

  function threadFor(roleId, me, them, listing) {
    var key = roleId + ':' + me.id;
    once('thread-' + key, function () {
      var t = firstName(them), n = firstName(me), L1 = listing ? listing.title : 'tu inmueble';
      var seeds = {
        seller: [
          { who: 'them', at: '2026-09-12T09:10', text: 'Hola ' + n + ', ¡buenas noticias! Ya tenemos ' + (listing.leads || 0) + ' interesados y ' + visitsFor(listing).filter(function (v) { return v.past; }).length + ' visitas realizadas en ' + L1 + '.', ai: true },
          { who: 'me', at: '2026-09-12T09:42', text: '¡Qué bien! ¿Cómo les pareció el precio?' },
          { who: 'them', at: '2026-09-12T10:05', text: 'Dos familias lo ven bien; una lo siente alto por la administración. Estamos dentro del rango de los comparables, así que sugiero mantenerlo por ahora.', ai: false },
          { who: 'them', at: '2026-09-15T18:20', text: 'Te dejé en la app 2 cosas para aprobar: las fotos nuevas del dron y la descripción en inglés. Con eso republicamos mañana.', ai: true }
        ],
        buyer: [
          { who: 'them', at: '2026-09-12T14:00', text: (me.langs && me.langs[0] === 'en' ? 'Hi ' + n + '! Thanks for touring with us. ' : 'Hola ' + n + ', gracias por el recorrido. ') + 'Te confirmo el siguiente paso en la app.', ai: false },
          { who: 'me', at: '2026-09-15T08:30', text: 'Enviamos la oferta ayer. ¿Cuándo tendremos respuesta del propietario?' },
          { who: 'them', at: '2026-09-15T09:02', text: 'El propietario responde antes del miércoles. Mientras tanto, te dejé la lista de documentos para la promesa; solo falta la declaración de origen de fondos.', ai: true }
        ],
        landlord: [
          { who: 'them', at: '2026-09-09T10:00', text: 'Hola ' + n + ', el contrato de ' + L1 + ' quedó firmado por todas las partes, incluida la afianzadora. El depósito ya está en la cuenta escrow de Dorum.', ai: true },
          { who: 'me', at: '2026-09-09T12:15', text: 'Perfecto, gracias. ¿Cuándo es el inventario?' },
          { who: 'them', at: '2026-09-09T12:30', text: 'El 25 de septiembre a las 10:00. Llave genera el inventario desde las fotos y ustedes lo firman desde el celular.', ai: false },
          { who: 'them', at: '2026-09-14T16:40', text: 'Tienes una cotización de mantenimiento pendiente de aprobar (calentador · $380.000). La dejé en tu sección de Mantenimiento.', ai: true }
        ],
        renter: [
          { who: 'them', at: '2026-09-09T10:05', text: (me.langs && me.langs[0] === 'en' ? 'Welcome ' + n + '! ' : '¡Bienvenido/a ' + n + '! ') + 'Tu contrato de ' + L1 + ' está firmado. Recibirás las llaves el 25 de septiembre después del inventario.', ai: true },
          { who: 'me', at: '2026-09-14T19:20', text: 'Hola Daniela, el calentador no está dando agua caliente.' },
          { who: 'them', at: '2026-09-14T19:24', text: 'Ya abrí el ticket y propuse a Plomería Express para el jueves de 9 a 11. Apenas la propietaria apruebe la cotización te confirmo.', ai: true }
        ]
      };
      S.threads[key] = { them: them, msgs: (seeds[roleId] || []).map(function (m, i) { m.id = key + '-' + i; return m; }) };
    });
    return S.threads[key];
  }

  function statementsFor(p) {
    var deal = p.deal, l = p.listing; if (!deal) return [];
    var out = [], y = 2026, m = 8; // September 2026 (0-based month)
    var tickets = ticketsFor([l.id]);
    for (var i = 0; i < 6; i++) {
      var mm = m - i, yy = y; if (mm < 0) { mm += 12; yy -= 1; }
      var monthIso = yy + '-' + String(mm + 1).padStart(2, '0');
      if (deal.startDate && monthIso < deal.startDate.slice(0, 7)) break;
      if (deal.rentalType === 'vacacional' && i > 4) break;
      var gross, nights = null, occ = null;
      if (deal.nightlyRate) { nights = 5 + (hash(l.id + monthIso) % 6); occ = Math.round(nights / 30 * 100 * 3.2); if (occ > 92) occ = 92; gross = nights * deal.nightlyRate; }
      else gross = deal.monthlyRent;
      var fee = Math.round(gross * (deal.mgmtPct || 10) / 100), iva = Math.round(fee * (deal.ivaPct || 19) / 100);
      var maint = tickets.filter(function (t) { return t.quote && t.quote.approved && t.quote.amount && (t.resolvedAt || t.createdAt).slice(0, 7) === monthIso && t.quote.amount > 0; }).reduce(function (s, t) { return s + t.quote.amount; }, 0);
      var payout = gross - fee - iva - maint;
      var status = i === 0 ? (deal.nightlyRate ? 'pendiente' : 'pagado') : 'pagado';
      if (deal.nightlyRate && i === 1) status = 'pendiente';
      out.push({ id: 'st-' + l.id + '-' + monthIso, month: monthIso, label: cap(monthName(mm)) + ' ' + yy, gross: gross, fee: fee, iva: iva, maint: maint, payout: payout, status: status, nights: nights, occ: occ, paidAt: status === 'pagado' ? yy + '-' + String(mm + 1).padStart(2, '0') + '-' + (i === 0 ? '05' : '30') : null });
    }
    return out;
  }

  /* -------------------------------------------------------------- UI atoms */
  function page(head, body) { return '<div class="pt">' + head + body + '</div>'; }
  function head(title, hello) { return '<header class="pt-head"><h1>' + title + '</h1>' + (hello ? '<p class="pt-hello">' + hello + '</p>' : '') + '</header>'; }
  function nextStep(o) {
    // o: {eyebrow, title, body, actions: [{label, action, args, primary}]}
    return '<section class="pt-next"><div><div class="eyebrow">' + esc(o.eyebrow || 'Tu siguiente paso') + '</div><h2>' + o.title + '</h2>' + (o.body ? '<p>' + o.body + '</p>' : '') + '</div>' +
      (o.actions && o.actions.length ? '<div class="pt-actions">' + join(o.actions.map(function (a) { return btn(a); })) + '</div>' : '') + '</section>';
  }
  function btn(a) {
    var cls = 'btn ' + (a.cls || (a.primary ? 'btn-primary' : 'btn-secondary')) + (a.size ? ' ' + a.size : '');
    var attrs = '';
    if (a.href) return '<a class="' + cls + '" href="' + esc(a.href) + '">' + (a.icon ? ico(a.icon) : '') + esc(a.label) + '</a>';
    if (a.action) attrs += ' data-action="' + esc(a.action) + '"';
    Object.keys(a.args || {}).forEach(function (k) { attrs += ' data-' + k + '="' + esc(a.args[k]) + '"'; });
    return '<button type="button" class="' + cls + '"' + attrs + '>' + (a.icon ? ico(a.icon) : '') + esc(a.label) + '</button>';
  }
  function card(title, body, opts) {
    opts = opts || {};
    return '<section class="card' + (opts.cls ? ' ' + opts.cls : '') + '">' + (title ? '<div class="pt-sec"><h3>' + title + '</h3>' + (opts.aside || '') + '</div>' : '') + body + '</section>';
  }
  function listingRow(l, opts) {
    opts = opts || {};
    var specs = [l.area ? D.fmtM2(l.area) : null, l.habitaciones ? l.habitaciones + ' hab' : null, l.estrato ? 'Estrato ' + l.estrato : null].filter(Boolean).join(' · ');
    return '<div class="pt-lrow">' +
      '<img src="' + esc(l.cover) + '" alt="' + esc(l.title) + '" loading="lazy">' +
      '<div><div class="t">' + esc(l.title) + '</div><div class="m">' + esc(l.barrio + ' · ' + l.city) + (specs ? ' · ' + esc(specs) : '') + '</div>' + (opts.sub || '') + '</div>' +
      '<div class="pt-lrow-r">' + (opts.right != null ? opts.right : '<div class="p">' + esc(D.fmtPrice(l)) + '</div>') + '</div></div>';
  }
  function docList(docs, roleId, compact) {
    if (!docs.length) return '<div class="pt-empty">No tienes documentos pendientes. ¡Todo al día!</div>';
    return join(docs.map(function (d) {
      var st = d.status, lbl = { validado: 'Validado', recibido: 'Recibido · en revisión', pendiente: (d.due ? 'Pendiente · antes del ' + fdate(d.due, 'short') : 'Pendiente'), vencido: 'Vencido · vuelve a subirlo', rechazado: 'Rechazado' }[st] || st;
      var icon = { validado: 'check', recibido: 'clock', pendiente: 'upload-cloud', vencido: 'alert-triangle', rechazado: 'x' }[st] || 'file-text';
      var act = (st === 'pendiente' || st === 'vencido' || st === 'rechazado') ? btn({ label: 'Subir', icon: compact ? null : 'upload-cloud', action: 'portal-doc-upload', args: { doc: d.id, role: roleId }, primary: st === 'vencido', size: 'btn-sm' }) : btn({ label: compact ? 'Ver' : 'Ver archivo', icon: 'eye', cls: 'btn-ghost', action: 'portal-doc-view', args: { doc: d.id, role: roleId }, size: 'btn-sm' });
      return '<div class="pt-doc" data-status="' + esc(st) + '"><div class="pt-ico">' + ico(icon) + '</div><div class="flex-1"><div class="t">' + esc(d.name) + (d.optional ? ' <span class="pill xs">opcional</span>' : '') + '</div><div class="m">' + esc(lbl) + '</div>' + (d.aiCheck && !compact ? '<div class="m ai">' + aiTag('Llave revisó') + ' ' + esc(d.aiCheck) + '</div>' : '') + '</div><div class="act">' + act + '</div></div>';
    }));
  }
  function uploadZone(roleId, docId, done) {
    return '<button type="button" class="pt-upload' + (done ? ' is-done' : '') + '" data-action="portal-doc-upload" data-role="' + esc(roleId) + '"' + (docId ? ' data-doc="' + esc(docId) + '"' : '') + '>' + ico(done ? 'check' : 'upload-cloud') + '<b>' + (done ? 'Archivo recibido' : 'Toca para subir un documento') + '</b><br><span class="xs">PDF o foto · Llave lo lee y valida en segundos</span></button>';
  }
  function messagesView(roleId, thread, me) {
    var them = thread.them, lastDay = '';
    var body = join(thread.msgs.map(function (m) {
      var day = m.at.slice(0, 10), out = '';
      if (day !== lastDay) { lastDay = day; out += '<div class="pt-day">' + esc(fdate(day, day === iso(TODAY) ? undefined : 'short')) + '</div>'; }
      var mine = m.who === 'me';
      out += '<div class="pt-msg ' + (mine ? 'is-me' : 'is-them') + (m.ai ? ' is-ai' : '') + (m.pending ? ' is-pending' : '') + '">' + esc(m.text) +
        '<div class="meta"><span>' + esc(fdate(m.at, 'time')) + '</span>' + (mine ? '<span>' + ico('check') + '</span>' : '<span>' + esc(firstName(them)) + '</span>') + (m.ai ? aiTag(m.pending ? 'Borrador de Llave · esperando aprobación de ' + firstName(them) : 'Redactado con Llave · revisado por ' + firstName(them)) : '') + '</div></div>';
      return out;
    }));
    var quick = { seller: ['¿Cuándo es la próxima visita?', '¿Podemos ajustar el precio?', 'Aprobado, publiquen'], buyer: ['¿Hay respuesta a mi oferta?', 'Quiero ver otro inmueble similar', '¿Qué documentos me faltan?'], landlord: ['¿Ya pagaron este mes?', 'Aprueba la cotización', 'Envíame el extracto'], renter: ['¿Cuándo me entregan las llaves?', 'Tengo un daño que reportar', '¿Puedo pagar con Nequi?'] }[roleId] || [];
    return card(null,
      '<div class="row" style="margin-bottom:var(--s-3)"><span class="avatar">' + esc(them.initials || initials(them.name)) + '</span><div><div style="font-weight:600">' + esc(them.name) + '</div><div class="small muted">' + esc(them.title || 'Dorum Lifestyle') + ' · responde en ~15 min</div></div><span class="pill pill-success" style="margin-left:auto">WhatsApp conectado</span></div>' +
      '<div class="pt-msgs" id="pt-msgs">' + body + '</div>' +
      '<div class="pt-quick">' + join(quick.map(function (q) { return '<button type="button" class="chip" data-action="portal-msg-quick" data-text="' + esc(q) + '">' + esc(q) + '</button>'; })) + '</div>' +
      '<div class="pt-composer" data-form="msg"><textarea class="textarea" id="pt-msg-input" data-field="text" rows="1" placeholder="Escríbele a ' + esc(firstName(them)) + '…" aria-label="Mensaje"></textarea>' + btn({ label: 'Enviar', icon: 'send', primary: true, action: 'portal-msg-send', args: { role: roleId } }) + '</div>' +
      '<p class="xs muted" style="margin-top:var(--s-2)">Las respuestas marcadas con el rombo las redacta Llave y las revisa ' + esc(firstName(them)) + ' antes de enviarlas.</p>');
  }
  function mapPin(l) {
    var h = hash(l.id), cx = 38 + (h % 30), cy = 40 + ((h >> 3) % 25);
    return '<div class="pt-map"><svg viewBox="0 0 160 80" role="img" aria-label="Mapa de ' + esc(l.barrio) + '">' +
      '<rect width="160" height="80" fill="var(--bg-deep)"></rect>' +
      '<path d="M0 ' + (20 + h % 10) + ' Q 60 ' + (10 + h % 15) + ' 160 ' + (30 + h % 12) + '" fill="none" stroke="var(--surface)" stroke-width="6"></path>' +
      '<path d="M' + (30 + h % 20) + ' 0 Q ' + (50 + h % 30) + ' 45 ' + (40 + h % 15) + ' 80" fill="none" stroke="var(--surface)" stroke-width="4"></path>' +
      '<path d="M0 ' + (55 + h % 10) + ' L160 ' + (48 + h % 20) + '" fill="none" stroke="var(--surface)" stroke-width="3"></path>' +
      (l.city === 'Guatapé' || l.city === 'Cartagena' ? '<ellipse cx="' + (110 + h % 20) + '" cy="' + (60 + h % 10) + '" rx="60" ry="22" fill="var(--info-soft)"></ellipse>' : '<circle cx="' + (120 + h % 20) + '" cy="' + (18 + h % 10) + '" r="16" fill="var(--brand-soft)"></circle>') +
      '<circle cx="' + cx + '" cy="' + cy + '" r="10" fill="var(--accent)" opacity="0.18"></circle>' +
      '<path d="M' + cx + ' ' + (cy - 12) + ' c-5 0 -8 4 -8 8 c0 6 8 14 8 14 s8 -8 8 -14 c0 -4 -3 -8 -8 -8z" fill="var(--accent)"></path><circle cx="' + cx + '" cy="' + (cy - 4) + '" r="3" fill="#fff"></circle>' +
      '</svg><span class="lbl">' + ico('map-pin') + ' ' + esc(l.barrio + ' · ' + l.city) + '</span></div>';
  }
  function aiSuggest(o) {
    return '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> ' + esc(o.head || 'Borrador de Llave') + '</div><div class="ai-suggest-body">' + o.body + '</div>' +
      (o.actions ? '<div class="ai-suggest-actions">' + join(o.actions.map(btn)) + '</div>' : '') + (o.meta ? '<div class="ai-suggest-meta">' + esc(o.meta) + '</div>' : '') + '</div>';
  }
  function dateBox(isoDate, past) { var d = new Date(isoDate + 'T12:00:00'); return '<div class="pt-date' + (past ? ' is-past' : '') + '"><b>' + d.getDate() + '</b><span>' + esc(d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')) + '</span></div>'; }
  function sentimentPill(s) { return s === 'alto' ? '<span class="pill pill-success">Interés alto</span>' : s === 'medio' ? '<span class="pill pill-warn">Interés medio</span>' : '<span class="pill">Interés bajo</span>'; }
  function ticketRow(t, roleId) {
    var icon = { 'Plomería': 'wrench', 'Eléctrico': 'alert-triangle', 'Humedad': 'home', 'Jardín': 'sun', 'Equipamiento': 'hammer', 'Cerrajería': 'key', 'Electrodomésticos': 'wrench' }[t.category] || 'wrench';
    var stLbl = { nuevo: 'Recibido', cotizado: roleId === 'landlord' ? 'Cotización por aprobar' : 'Cotizado · esperando aprobación del propietario', aprobado: 'Aprobado · agendando técnico', 'en curso': 'Técnico asignado', programado: 'Programado', resuelto: 'Resuelto' }[t.status] || t.status;
    var sub = t.quote && t.quote.eta && t.status !== 'resuelto' ? ' · ' + t.quote.vendor + ' · ' + t.quote.eta : (t.resolvedAt ? ' · ' + fdate(t.resolvedAt, 'short') : '');
    return '<div class="pt-ticket" data-urg="' + esc(t.urgency) + '" data-tstatus="' + esc(t.status) + '"><div class="pt-ico">' + ico(icon) + '</div><div class="flex-1"><div class="t">' + esc(t.title) + '</div><div class="m">' + esc(t.category) + ' · urgencia ' + esc(t.urgency) + ' · ' + esc(fdate(t.createdAt, 'short')) + '</div><div class="m">' + esc(stLbl + sub) + '</div>' +
      (t.triage ? '<div class="m" style="color:var(--ai);margin-top:var(--s-1)">' + aiTag('Triage de Llave') + ' ' + esc(t.triage) + '</div>' : '') +
      (roleId === 'landlord' && t.status === 'cotizado' && t.quote ? '<div style="margin-top:var(--s-3)">' + aiSuggest({ head: 'Cotización sugerida por Llave', body: '<b>' + esc(t.quote.vendor) + '</b> · <span class="money">' + esc(cop(t.quote.amount)) + '</span> · ' + esc(t.quote.eta) + (t.quote.note ? '<br><span class="small muted">' + esc(t.quote.note) + '</span>' : ''), actions: [{ label: 'Aprobar cotización', primary: true, size: 'btn-sm', action: 'portal-quote-approve', args: { ticket: t.id } }, { label: 'Pedir otra', size: 'btn-sm', action: 'portal-quote-other', args: { ticket: t.id } }, { label: 'Rechazar', cls: 'btn-ghost', size: 'btn-sm', action: 'portal-quote-reject', args: { ticket: t.id } }], meta: 'Se descuenta de tu liquidación mensual · el arrendatario recibe la fecha de visita apenas apruebes' }) + '</div>' : '') +
      '</div></div>';
  }

  /* ================================================================ SELLER */
  function productionSteps(l) {
    var tasks = D.tasks.filter(function (t) { return t.listingId === l.id; });
    var live = l.status === 'activo' || l.status === 'bajo oferta';
    function tstate(kind, fallbackDone) { var t = tasks.filter(function (x) { return x.kind === kind; })[0]; if (!t) return fallbackDone ? 'done' : 'todo'; return t.status === 'listo' ? 'done' : (t.status === 'revisión' || t.status === 'en curso') ? 'current' : 'todo'; }
    var steps = [
      { k: 'Fotos y video', s: l.images.length >= 5 && (live || tstate('photography', false) === 'done') ? 'done' : (l.images.length ? 'current' : 'todo'), d: l.images.length + ' imágenes' },
      { k: 'Textos ES/EN', s: live ? 'done' : tstate('writing', false), d: live ? 'Publicados' : 'Borrador de Llave' },
      { k: 'Comparables y precio', s: live ? 'done' : tstate('research', false), d: live ? 'Precio validado' : 'En análisis' },
      { k: 'Pauta digital', s: (D.campaigns.some(function (c) { return c.listingId === l.id && c.status !== 'borrador'; }) || (live && l.views > 1000)) ? 'done' : (live ? 'current' : tstate('ads', false)), d: '' },
      { k: 'Activo en portales', s: live ? 'done' : 'todo', d: live ? l.daysOnMarket + ' días publicado' : 'Pendiente' }
    ];
    var camp = D.campaigns.filter(function (c) { return c.listingId === l.id; })[0];
    steps[3].d = camp ? (camp.status === 'activa' ? 'Campaña activa' : 'Campaña ' + camp.status) : (live ? 'Portales + Instagram' : 'Pendiente');
    var firstTodo = -1; steps.forEach(function (s, i) { if (firstTodo < 0 && s.s !== 'done') firstTodo = i; });
    if (firstTodo >= 0 && steps[firstTodo].s === 'todo') steps[firstTodo].s = 'current';
    return steps;
  }
  function stepsHtml(steps) { return '<div class="pt-steps">' + join(steps.map(function (s) { return '<div class="pt-step is-' + s.s + '"><b>' + esc(s.k) + '</b><small>' + esc(s.s === 'done' ? (s.d || 'Listo') : s.s === 'current' ? (s.d || 'En curso') : 'Pendiente') + '</small></div>'; })) + '</div>'; }
  function priceInsight(l) {
    var ppm = D.pricePerM2(l), lo = Math.round(l.price * 0.94), hi = Math.round(l.price * 1.03);
    var pos = 62; // % position in the comps band
    var comps = D.listings.filter(function (x) { return x.id !== l.id && x.operacion === 'venta' && x.currency === l.currency && (x.type === l.type || x.city === l.city); }).slice(0, 4);
    var verdict = l.daysOnMarket > 60 && (l.leads || 0) < 15 ? 'El precio está en la parte alta del rango y el interés va lento; vale la pena conversar un ajuste del 3 %.' : 'Tu precio está dentro del rango de los comparables y el interés es ' + ((l.leads || 0) >= 20 ? 'mayor' : 'similar') + ' al promedio de la zona (41 días). Recomendamos mantenerlo.';
    return '<div class="pt-big">' + esc(money(l.price, l.currency)) + ' <small>' + esc(ppm ? cop(ppm) + ' / m²' : '') + '</small></div>' +
      '<div class="pt-price-range"><small style="left:6%">' + esc(cop(lo, { compact: true })) + '</small><i style="left:' + pos + '%"></i><small style="left:94%">' + esc(cop(hi, { compact: true })) + '</small></div>' +
      '<p class="small muted" style="margin-top:var(--s-6)">Rango de ' + comps.length + ' comparables · tu precio marcado en verde</p>' +
      '<div style="margin-top:var(--s-3)">' + aiTag('Lectura de Llave') + '<p style="margin-top:var(--s-1)">' + esc(verdict) + '</p></div>' +
      '<div class="pt-actions" style="margin-top:var(--s-4)">' + btn({ label: 'Ver comparables', icon: 'bar-chart', action: 'portal-comps', args: { listing: l.id } }) + btn({ label: 'Hablar con mi asesor', icon: 'message-circle', cls: 'btn-ghost', href: route('seller', 'messages') }) + '</div>';
  }
  function sellerNext(sel) {
    var l = sel.listing, offers = offersFor(sel.listings.map(function (x) { return x.id; })).filter(function (o) { return o.status === 'pendiente'; });
    var appr = approvalsFor(sel);
    if (offers.length) return nextStep({ title: 'Tienes una oferta de ' + esc(money(offers[0].amount, l.currency)) + ' por ' + esc(l.title), body: 'Llave ya preparó una contraoferta sugerida. Revísala y decide en un toque.', actions: [{ label: 'Ver oferta', cls: 'btn-light', href: route('seller', 'offers') }] });
    if (appr.length) return nextStep({ title: 'Aprueba ' + (appr.length === 1 ? 'un cambio' : appr.length + ' cambios') + ' en la ficha de tu inmueble', body: appr.map(function (a) { return a.title; }).join(' · ') + '. Con tu aprobación se republican en Finca Raíz, Wasi y Metrocuadrado.', actions: [{ label: 'Revisar y aprobar', cls: 'btn-light', href: route('seller', 'my-listing') }] });
    var up = visitsFor(l).filter(function (v) { return !v.past; })[0];
    if (up) return nextStep({ title: 'Próxima visita el ' + esc(fdate(up.at, 'long').replace(/ de 2026/, '')) + ' a las ' + esc(up.time), body: esc(up.who) + ' recorrerá ' + esc(l.title) + ' con ' + esc(firstName(sel.broker)) + '. Deja el inmueble ventilado y con las luces encendidas.', actions: [{ label: 'Ver visitas', cls: 'btn-light', href: route('seller', 'visits') }] });
    return nextStep({ title: 'Todo en orden con ' + esc(l.title), body: 'Seguimos mostrando tu inmueble. Te avisamos con cada visita y oferta.' });
  }
  var M = {}; // module renderers keyed by role:module

  M['seller:my-listing'] = function (ctx) {
    var sel = seller(ctx), l = sel.listing, appr = approvalsFor(sel), visits = visitsFor(l);
    var others = sel.listings.slice(1);
    var views = series(l.id, 8, Math.max(60, Math.round((l.views || 200) / 8)), 8);
    return page(head('Mi inmueble', 'Hola ' + esc(firstName(sel.user)) + ', así va la venta de <b>' + esc(l.title) + '</b>.'),
      sellerNext(sel) +
      '<div class="pt-grid">' +
      card(null, '<img class="pt-hero-img" src="' + esc(l.cover) + '" alt="' + esc(l.title) + '"><div class="row row-between" style="margin-top:var(--s-4)"><div><div style="font-weight:600;font-size:var(--fs-lg)">' + esc(l.title) + '</div><div class="muted small">' + esc(l.barrio + ' · ' + l.city) + ' · ' + esc(D.typeLabel(l.type)) + '</div></div>' + badge(l.status) + '</div>' +
        '<div class="pt-tiles" style="margin-top:var(--s-4)"><div class="pt-tile stat"><span class="stat-label">Vistas</span><span class="stat-value">' + esc((l.views || 0).toLocaleString('es-CO')) + '</span></div><div class="pt-tile stat"><span class="stat-label">Interesados</span><span class="stat-value">' + esc(l.leads || 0) + '</span></div><div class="pt-tile stat"><span class="stat-label">Visitas</span><span class="stat-value">' + visits.filter(function (v) { return v.past; }).length + '</span><span class="stat-delta up">+' + visits.filter(function (v) { return !v.past; }).length + ' agendadas</span></div><div class="pt-tile stat"><span class="stat-label">Días</span><span class="stat-value">' + esc(l.daysOnMarket) + '</span></div></div>', { cls: 'span-2' }) +
      card('Cómo va la preparación', stepsHtml(productionSteps(l)) + '<p class="small muted" style="margin-top:var(--s-4)">Tu asesor: <b>' + esc(sel.broker.name) + '</b> · ' + esc(sel.broker.title || '') + '</p>', { cls: 'span-2' }) +
      card('Tu precio', priceInsight(l)) +
      card('Alcance de la campaña', sparkline(views, 300, 64) + '<div class="row row-between small muted" style="margin-top:var(--s-2)"><span>Vistas por semana · últimas 8</span><b style="color:var(--text)">' + esc((l.views || 0).toLocaleString('es-CO')) + ' en total</b></div>' +
        '<div class="pt-kv" style="margin-top:var(--s-4)"><dt>Portales</dt><dd>' + [l.syndication.fincaRaiz && 'Finca Raíz', l.syndication.wasi && 'Wasi', l.syndication.metrocuadrado && 'Metrocuadrado', l.syndication.instagram && 'Instagram'].filter(Boolean).join(' · ') + '</dd>' +
        join(sel.campaigns.filter(function (c) { return c.listingId === l.id; }).map(function (c) { return '<dt>' + esc(c.platform) + '</dt><dd>' + esc((c.impressions || 0).toLocaleString('es-CO')) + ' personas · ' + esc(c.leads) + ' leads</dd>'; })) + '</div>' +
        (sel.campaigns.filter(function (c) { return c.listingId === l.id; }).length ? '' : '<p class="small muted" style="margin-top:var(--s-3)">Tu inmueble se promueve desde los portales y la campaña de marca Dorum.</p>')) +
      card('Para tu aprobación', appr.length ? join(appr.map(function (a) {
        return aiSuggest({ head: 'Borrador de Llave · ' + a.kind, body: '<b>' + esc(a.title) + '</b><br>' + (a.imgs ? '<div class="row" style="margin:var(--s-2) 0">' + join(a.imgs.map(function (u) { return '<img src="' + esc(u) + '" alt="Foto propuesta" style="width:88px;height:64px;object-fit:cover;border-radius:var(--r-md)" loading="lazy">'; })) + '</div>' : '') + '<span class="small">' + esc(a.body) + '</span>', actions: [{ label: 'Aprobar ' + a.kind, primary: true, size: 'btn-sm', action: 'portal-approve-item', args: { item: a.id, listing: l.id } }, { label: 'Pedir cambios', size: 'btn-sm', action: 'portal-request-change', args: { item: a.id, listing: l.id } }], meta: a.meta || 'Nada se publica sin tu aprobación' });
      })) : '<div class="pt-empty">' + ico('check') + '<br>No tienes nada pendiente por aprobar.</div>', { cls: 'span-2', aside: appr.length ? '<span class="pill pill-ai">' + appr.length + ' por revisar</span>' : '' }) +
      (others.length ? card('Tus otros inmuebles', join(others.map(function (o) { return listingRow(o, { right: '<div>' + badge(o.status) + '</div>' }); })), { cls: 'span-2' }) : '') +
      '</div>');
  };

  M['seller:visits'] = function (ctx) {
    var sel = seller(ctx), l = sel.listing, vs = visitsFor(l);
    var up = vs.filter(function (v) { return !v.past; }), past = vs.filter(function (v) { return v.past; }).reverse();
    var hi = past.filter(function (v) { return v.sentiment === 'alto'; }).length;
    return page(head('Visitas', esc(past.length) + ' visitas realizadas y ' + esc(up.length) + ' agendadas en <b>' + esc(l.title) + '</b>.'),
      nextStep({ title: up.length ? 'Próxima visita: ' + esc(fdate(up[0].at, 'long').replace(/ de 2026/, '')) + ', ' + esc(up[0].time) : 'Sin visitas agendadas', body: up.length ? esc(up[0].who) + ' con ' + esc(firstName(sel.broker)) + (up[0].confirmed ? '. Ya está confirmada.' : '. Confirma que el inmueble estará disponible.') : 'Tu asesor está coordinando nuevas visitas con los interesados.', actions: up.length && !up[0].confirmed ? [{ label: 'Confirmar disponibilidad', cls: 'btn-light', action: 'portal-visit-confirm', args: { visit: up[0].id, listing: l.id } }] : [] }) +
      '<div class="pt-grid">' +
      card('Próximas', up.length ? join(up.map(function (v) { return '<div class="pt-visit">' + dateBox(v.at) + '<div><div class="t">' + esc(v.who) + '</div><div class="m">' + esc(v.time) + ' · con ' + esc(D.userName(v.broker)) + '</div><div class="row" style="margin-top:var(--s-2)">' + (v.confirmed ? '<span class="pill pill-success">Confirmada</span>' : '<span class="pill pill-warn">Por confirmar</span>' + btn({ label: 'Confirmar', size: 'btn-sm', action: 'portal-visit-confirm', args: { visit: v.id, listing: l.id } })) + '</div></div></div>'; })) : '<div class="pt-empty">Sin visitas próximas</div>') +
      card('Lo que dicen los visitantes', '<div class="row" style="margin-bottom:var(--s-3)">' + aiTag('Resumen de Llave') + '<span class="small muted">a partir de las notas de voz de tu asesor</span></div><p>' + esc(hi + ' de ' + past.length + ' visitantes mostraron interés alto. La objeción más repetida es el valor de la administración; el punto más celebrado, la luz y la vista.') + '</p>' + bars([{ label: 'Alto', value: hi, hot: true }, { label: 'Medio', value: past.filter(function (v) { return v.sentiment === 'medio'; }).length }, { label: 'Bajo', value: past.filter(function (v) { return v.sentiment === 'bajo'; }).length, muted: true }], 90)) +
      card('Visitas realizadas', join(past.map(function (v) { return '<div class="pt-visit">' + dateBox(v.at, true) + '<div><div class="row row-between"><div class="t">' + esc(v.who) + '</div>' + sentimentPill(v.sentiment) + '</div><div class="m">' + esc(v.time) + ' · con ' + esc(D.userName(v.broker)) + '</div><div class="pt-quote">“' + esc(v.feedback) + '”</div><div class="small" style="color:var(--ai);margin-top:var(--s-2)">' + aiTag('Llave resume') + ' ' + esc(v.ai) + '</div></div></div>'; })), { cls: 'span-2' }) +
      '</div>');
  };

  function offerCard(o, roleId) {
    var l = D.listing(o.listingId), diff = o.asking ? Math.round((o.amount / o.asking - 1) * 1000) / 10 : 0;
    var stPill = { pendiente: '<span class="pill pill-warn">Esperando tu respuesta</span>', aceptada: '<span class="pill pill-success">Aceptada</span>', rechazada: '<span class="pill pill-danger">Rechazada</span>', contraofertada: '<span class="pill pill-brand">Contraoferta enviada</span>' }[o.status];
    var html = '<div class="pt-offer"><div class="row row-between"><div class="who"><span class="avatar avatar-accent">' + esc(initials(o.buyerName)) + '</span><div><div style="font-weight:600">' + esc(o.buyerName) + '</div><div class="small muted">' + esc(fdate(o.at, 'short')) + ' · ' + esc(l.title) + '</div></div></div>' + stPill + '</div>' +
      '<div class="amt"><span class="pt-big">' + esc(money(o.amount, l.currency)) + '</span><span class="small muted">' + esc(diff < 0 ? Math.abs(diff).toLocaleString('es-CO') + ' % bajo tu precio de ' + money(o.asking, l.currency) : 'al precio de lista') + '</span></div>' +
      '<p class="small">' + esc(o.terms) + '</p>';
    if (o.status === 'pendiente') {
      html += aiSuggest({ head: 'Contraoferta sugerida por Llave', body: 'Proponer <span class="diff-del">' + esc(money(o.amount, l.currency)) + '</span> <span class="diff-add">' + esc(money(o.counter.amount, l.currency)) + '</span> · ' + esc(o.counter.terms) + '.', actions: [{ label: 'Aceptar oferta', primary: true, size: 'btn-sm', action: 'portal-offer-accept', args: { offer: o.id } }, { label: 'Contraofertar ' + cop(o.counter.amount, { compact: true }), size: 'btn-sm', action: 'portal-offer-counter', args: { offer: o.id } }, { label: 'Rechazar', cls: 'btn-ghost', size: 'btn-sm', action: 'portal-offer-reject', args: { offer: o.id } }], meta: 'Basado en ' + o.counter.basis + ' · tu asesor la envía cuando tú decidas' });
    } else if (o.status === 'contraofertada') { html += '<div class="callout callout-info">Contraoferta de ' + esc(money(o.counter.amount, l.currency)) + ' enviada. Te avisamos apenas responda el comprador.</div>'; }
    else if (o.status === 'aceptada') { html += '<div class="callout callout-success">¡Felicitaciones! El abogado de Dorum ya prepara la promesa de compraventa. Revisa tus documentos pendientes.</div>'; }
    return html + '</div>';
  }
  M['seller:offers'] = function (ctx) {
    var sel = seller(ctx), offers = offersFor(sel.listings.map(function (x) { return x.id; }));
    var pend = offers.filter(function (o) { return o.status === 'pendiente'; });
    return page(head('Ofertas', offers.length ? esc(offers.length) + (offers.length === 1 ? ' oferta recibida' : ' ofertas recibidas') + ' por tus inmuebles.' : 'Aún no has recibido ofertas.'),
      (pend.length ? nextStep({ title: 'Responde la oferta de ' + esc(pend[0].buyerName), body: 'Puedes aceptar, contraofertar con la sugerencia de Llave o rechazar. Nada se envía sin tu decisión.' }) : nextStep({ title: offers.length ? 'Sin ofertas pendientes de respuesta' : 'Seguimos mostrando tu inmueble', body: 'Te avisamos por WhatsApp y aquí apenas llegue una oferta nueva.' })) +
      (offers.length ? '<div class="stack">' + join(offers.map(function (o) { return offerCard(o, 'seller'); })) + '</div>' : card(null, '<div class="pt-empty">Con ' + esc(sel.listing.leads || 0) + ' interesados y las visitas agendadas, lo normal en tu zona es recibir la primera oferta entre las semanas 6 y 9.</div>')));
  };

  function documentsPage(roleId, docs, intro, extra) {
    var pend = docs.filter(function (d) { return d.status === 'pendiente' || d.status === 'vencido'; }), pct = Math.round((docs.length - pend.length) / (docs.length || 1) * 100);
    return page(head('Documentos', intro),
      nextStep({ title: pend.length ? 'Te ' + (pend.length === 1 ? 'falta 1 documento' : 'faltan ' + pend.length + ' documentos') : 'Tus documentos están completos', body: pend.length ? 'Súbelos desde el celular: una foto basta. Llave los lee, valida nombres y vigencias, y avisa al equipo.' : 'Todo validado. Te avisamos si la notaría pide algo más.', actions: pend.length ? [{ label: 'Subir ' + (pend[0].name.split(' ·')[0]), cls: 'btn-light', action: 'portal-doc-upload', args: { doc: pend[0].id, role: roleId } }] : [] }) +
      '<div class="pt-grid">' +
      card('Tu lista', '<div class="progress progress-lg" style="margin-bottom:var(--s-4)"><span style="--value:' + pct + '%"></span></div><p class="small muted" style="margin-bottom:var(--s-2)">' + pct + ' % completo</p>' + docList(docs, roleId, false), { cls: 'span-2' }) +
      card('Subir un documento', uploadZone(roleId, pend.length ? pend[0].id : null, false) + '<p class="xs muted" style="margin-top:var(--s-3)">Formatos: PDF, JPG, HEIC · máx. 20 MB · cifrado y visible solo para tu expediente.</p>') +
      card('¿Para qué sirve cada uno?', '<div class="stack stack-sm small"><div><b>Certificado de tradición y libertad</b><br><span class="muted">Prueba quién es dueño y si hay deudas; la notaría lo exige con menos de 30 días.</span></div><div><b>Paz y salvo de administración</b><br><span class="muted">Certifica que no debes cuotas de administración.</span></div><div><b>Declaración de origen de fondos</b><br><span class="muted">Requisito bancario para pagos altos.</span></div><div><b>Certificado laboral y extractos</b><br><span class="muted">Respaldan tu capacidad de pago en un arriendo.</span></div></div>') +
      (extra || '') + '</div>');
  }
  M['seller:documents'] = function (ctx) { var sel = seller(ctx); var docs = docsFor('seller', sel.listings.map(function (l) { return l.id; }), sel.deals.map(function (d) { return d.id; })); return documentsPage('seller', docs, 'Lo que necesitamos de ti para vender <b>' + esc(sel.listing.title) + '</b> sin contratiempos.'); };
  M['seller:messages'] = function (ctx) { var sel = seller(ctx); return page(head('Mensajes', 'Tu conversación con ' + esc(sel.broker.name) + ' sobre ' + esc(sel.listing.title) + '.'), messagesView('seller', threadFor('seller', sel.user, sel.broker, sel.listing), sel.user)); };

  /* ================================================================= BUYER */
  var ZONAS = { todas: 'Todas', guatape: 'Guatapé y Embalse', medellin: 'Medellín', oriente: 'Oriente Antioqueño', cartagena: 'Cartagena', internacional: 'Internacional' };
  function zonaOf(l) { if (l.international) return 'internacional'; if (l.city === 'Guatapé' || l.city === 'El Peñol') return 'guatape'; if (l.city === 'Cartagena') return 'cartagena'; if (['Medellín', 'Envigado', 'Sabaneta', 'Itagüí'].indexOf(l.city) >= 0) return 'medellin'; return 'oriente'; }
  function matchScore(l, b) {
    var s = 55, h = hash(l.id + b.user.id) % 12;
    if (b.contact && (b.contact.interest || []).indexOf(l.id) >= 0) s += 30;
    if (b.budget && l.currency === b.currency) { if (l.price <= b.budget) s += 10; else if (l.price <= b.budget * 1.1) s += 3; else s -= 20; }
    if (b.user.langs && b.user.langs[0] === 'en' && (l.syndication.instagram)) s += 3;
    return Math.max(35, Math.min(98, s + h));
  }
  function searchResults(b) {
    var f = S.search;
    return D.listings.filter(function (l) {
      if (l.operacion !== 'venta' || (l.status !== 'activo' && l.status !== 'bajo oferta')) return false;
      if (f.type !== 'todos' && l.type !== f.type) return false;
      if (f.zona !== 'todas' && zonaOf(l) !== f.zona) return false;
      if (f.max && l.currency === 'COP' && l.price > f.max) return false;
      if (f.hab && (l.habitaciones || 0) < f.hab) return false;
      return true;
    }).map(function (l) { return { l: l, score: matchScore(l, b) }; }).sort(function (a, c) { return c.score - a.score; });
  }
  function chip(label, action, args, active) { var a = ''; Object.keys(args).forEach(function (k) { a += ' data-' + k + '="' + esc(args[k]) + '"'; }); return '<button type="button" class="chip' + (active ? ' is-active' : '') + '" data-action="' + action + '"' + a + ' aria-pressed="' + (active ? 'true' : 'false') + '">' + esc(label) + '</button>'; }
  M['buyer:search'] = function (ctx) {
    var b = buyer(ctx), f = S.search, res = searchResults(b), short = shortlistFor(b);
    var types = [['todos', 'Todo'], ['casa', 'Casas'], ['apartamento', 'Apartamentos'], ['finca', 'Fincas'], ['lote', 'Lotes'], ['penthouse', 'Penthouse']];
    var budgets = [[0, 'Cualquiera'], [1500000000, 'Hasta $1.500 M'], [2500000000, 'Hasta $2.500 M'], [4000000000, 'Hasta $4.000 M']];
    var top = res[0];
    return page(head('Buscar', 'Hola ' + esc(firstName(b.user)) + '. ' + (b.budget ? 'Tu presupuesto registrado: <b>' + esc(money(b.budget, b.currency)) + '</b>.' : '')),
      card(null, '<div class="row" style="margin-bottom:var(--s-3)">' + aiTag('Concierge de Llave') + '<span class="small muted">describe lo que buscas con tus palabras</span></div>' +
        '<div class="pt-concierge" data-form="concierge"><input class="input" id="pt-concierge-input" data-field="q" value="' + esc(f.q) + '" placeholder="Cuéntame qué buscas: “una casa frente al embalse, 4 alcobas, hasta 4 mil millones”">' + btn({ label: 'Buscar', icon: 'sparkles', primary: true, action: 'portal-concierge' }) + '</div>' +
        (f.note ? '<div class="callout" style="margin-top:var(--s-3);border-color:var(--ai);background:var(--ai-soft);color:var(--text)">' + ico('sparkles') + '<div class="flex-1 small">' + esc(f.note) + '</div>' + btn({ label: 'Limpiar', cls: 'btn-ghost', size: 'btn-sm', action: 'portal-filters-clear' }) + '</div>' : '') +
        '<div class="pt-filters" style="margin-top:var(--s-4)">' +
        '<div class="row"><span class="row-lbl">Tipo</span><div class="pt-chips">' + join(types.map(function (t) { return chip(t[1], 'portal-filter', { key: 'type', value: t[0] }, f.type === t[0]); })) + '</div></div>' +
        '<div class="row"><span class="row-lbl">Zona</span><div class="pt-chips">' + join(Object.keys(ZONAS).map(function (z) { return chip(ZONAS[z], 'portal-filter', { key: 'zona', value: z }, f.zona === z); })) + '</div></div>' +
        '<div class="row"><span class="row-lbl">Precio</span><div class="pt-chips">' + join(budgets.map(function (bd) { return chip(bd[1], 'portal-filter', { key: 'max', value: bd[0] }, f.max === bd[0]); })) + '</div></div>' +
        '<div class="row"><span class="row-lbl">Alcobas</span><div class="pt-chips">' + join([[0, 'Todas'], [2, '2+'], [3, '3+'], [4, '4+']].map(function (hb) { return chip(hb[1], 'portal-filter', { key: 'hab', value: hb[0] }, f.hab === hb[0]); })) + '</div></div></div>') +
      '<div class="row row-between"><h3 style="font-size:var(--fs-lg)">' + esc(res.length) + (res.length === 1 ? ' inmueble' : ' inmuebles') + '</h3><span class="small muted">Ordenados por coincidencia contigo</span></div>' +
      (res.length ? '<div class="stack">' + join(res.map(function (r, i) {
        var l = r.l, on = short.indexOf(l.id) >= 0;
        var sub = '<div class="row" style="margin-top:var(--s-2)"><span class="pt-match">' + ico('sparkles') + ' ' + r.score + ' % coincidencia</span>' + (l.international ? '<span class="pill pill-info">Internacional</span>' : '') + (l.status === 'bajo oferta' ? badge(l.status) : '') + (i === 0 && top ? '<span class="pill pill-ai">Sugerido por Llave</span>' : '') + '</div>' + (i === 0 ? '<p class="small muted" style="margin-top:var(--s-1)">' + esc(l.amenities.slice(0, 2).join(' · ')) + (b.budget && l.currency === b.currency && l.price <= b.budget ? ' · dentro de tu presupuesto' : '') + '</p>' : '');
        var right = '<div class="p">' + esc(D.fmtPrice(l)) + '</div><div class="pt-actions">' + '<button type="button" class="btn btn-ghost btn-icon pt-heart' + (on ? ' is-on' : '') + '" data-action="portal-shortlist-toggle" data-listing="' + l.id + '" aria-label="' + (on ? 'Quitar de favoritos' : 'Guardar en favoritos') + '">' + ico('heart') + '</button>' + btn({ label: 'Pedir recorrido', size: 'btn-sm', action: 'portal-tour-request', args: { listing: l.id } }) + '</div>';
        return listingRow(l, { sub: sub, right: right });
      })) + '</div>' : card(null, '<div class="pt-empty">Nada coincide con esos filtros. Prueba ampliar la zona o el presupuesto, o cuéntale a Llave qué buscas.</div>')));
  };

  M['buyer:shortlist'] = function (ctx) {
    var b = buyer(ctx), ids = shortlistFor(b), ls = ids.map(D.listing).filter(Boolean);
    if (!ls.length) return page(head('Favoritos', 'Aún no has guardado inmuebles.'), card(null, '<div class="pt-empty">Toca el corazón en cualquier inmueble para compararlo aquí.<br><br>' + btn({ label: 'Ir a buscar', primary: true, href: route('buyer', 'search') }) + '</div>'));
    var rows = [
      ['Precio', function (l) { return money(l.price, l.currency); }, function (l) { return l.currency === 'COP' ? l.price : Infinity; }, 'min'],
      ['Área', function (l) { return D.fmtM2(l.area); }, function (l) { return l.area; }, 'max'],
      ['Precio / m²', function (l) { return l.currency === 'COP' ? cop(D.pricePerM2(l)) : money(D.pricePerM2(l), l.currency); }, function (l) { return l.currency === 'COP' ? D.pricePerM2(l) : Infinity; }, 'min'],
      ['Estrato', function (l) { return l.estrato || '—'; }, null],
      ['Administración', function (l) { return l.administracion ? cop(l.administracion) + ' / mes' : 'Sin administración'; }, function (l) { return l.administracion || 0; }, 'min'],
      ['Alcobas · baños', function (l) { return (l.habitaciones || 0) + ' · ' + (l.banos || 0); }, null],
      ['Zona', function (l) { return l.barrio + ', ' + l.city; }, null],
      ['Estado', function (l) { return D.statusLabel(l.status); }, null]
    ];
    var cheapest = ls.slice().sort(function (a, c) { return (a.currency === 'COP' ? D.pricePerM2(a) : 9e9) - (c.currency === 'COP' ? D.pricePerM2(c) : 9e9); })[0];
    var biggest = ls.slice().sort(function (a, c) { return c.area - a.area; })[0];
    return page(head('Favoritos', esc(ls.length) + ' inmuebles guardados para comparar.'),
      nextStep({ title: 'Compara y pide un recorrido', body: 'Puedes agendar varios el mismo día; ' + esc(firstName(b.broker)) + ' arma la ruta.', actions: [{ label: 'Pedir recorrido de ' + firstName({ name: ls[0].title }), cls: 'btn-light', action: 'portal-tour-request', args: { listing: ls[0].id } }] }) +
      card('Comparar', '<div class="table-wrap"><table class="table pt-compare"><thead><tr><th></th>' + join(ls.map(function (l) { return '<th><img src="' + esc(l.cover) + '" alt="' + esc(l.title) + '" loading="lazy">' + esc(l.title) + '<div class="row" style="margin-top:var(--s-2)"><button type="button" class="btn btn-ghost btn-sm pt-heart is-on" data-action="portal-shortlist-toggle" data-listing="' + l.id + '">' + ico('heart') + 'Quitar</button></div></th>'; })) + '</tr></thead><tbody>' +
        join(rows.map(function (r) {
          var best = null; if (r[2]) { var vals = ls.map(r[2]); var target = r[3] === 'min' ? Math.min.apply(null, vals) : Math.max.apply(null, vals); best = vals.indexOf(target); }
          return '<tr><td>' + esc(r[0]) + '</td>' + join(ls.map(function (l, i) { return '<td class="num' + (best === i && ls.length > 1 ? ' best' : '') + '">' + esc(r[1](l)) + '</td>'; })) + '</tr>';
        })) + '<tr><td>Recorrido</td>' + join(ls.map(function (l) { return '<td>' + btn({ label: 'Agendar', size: 'btn-sm', action: 'portal-tour-request', args: { listing: l.id } }) + '</td>'; })) + '</tr></tbody></table></div>' +
        (ls.length > 1 ? '<div style="margin-top:var(--s-4)">' + aiTag('Llave observa') + '<p style="margin-top:var(--s-1)">' + esc(cheapest.title) + ' tiene el menor precio por m²' + (biggest.id !== cheapest.id ? ', mientras que ' + biggest.title + ' ofrece más área' : '') + '. ' + (ls.some(function (l) { return l.administracion > 1500000; }) ? 'Ten en cuenta la administración mensual al comparar: en el Charlee incluye spa, piscina y renta turística administrada.' : 'Ambas opciones están en tu rango; el siguiente paso es verlas en persona.') + '</p></div>' : ''), { cls: 'span-2' }));
  };

  M['buyer:tours'] = function (ctx) {
    var b = buyer(ctx), tours = toursFor(b), up = tours.filter(function (t) { return !t.past; }), past = tours.filter(function (t) { return t.past; }).reverse();
    var nxt = up[0], nl = nxt && D.listing(nxt.listingId);
    return page(head('Recorridos', up.length ? esc(up.length) + (up.length === 1 ? ' recorrido programado' : ' recorridos programados') + '.' : 'No tienes recorridos programados.'),
      (nxt ? nextStep({ title: esc(fdate(nxt.at, 'long').replace(/ de 2026/, '')) + ' a las ' + esc(nxt.time) + ' · ' + esc(nl.title), body: (nxt.mode === 'video' ? 'Videollamada' : 'Presencial') + ' con ' + esc(D.userName(nxt.broker)) + '. ' + (nxt.status === 'solicitado' ? 'Tu asesor confirmará la hora en breve.' : 'Punto de encuentro: portería de ' + esc(nl.barrio) + '.'), actions: [{ label: 'Agregar al calendario', cls: 'btn-light', icon: 'calendar', action: 'portal-tour-calendar', args: { tour: nxt.id } }, { label: 'Escribir al asesor', cls: 'btn-glass', href: route('buyer', 'messages') }] }) : nextStep({ title: 'Agenda tu primer recorrido', body: 'Desde Favoritos o Buscar, toca “Pedir recorrido”.', actions: [{ label: 'Ver favoritos', cls: 'btn-light', href: route('buyer', 'shortlist') }] })) +
      '<div class="pt-grid">' +
      (nl ? card('Cómo llegar', mapPin(nl) + '<div class="pt-kv" style="margin-top:var(--s-4)"><dt>Dirección</dt><dd>' + esc(nl.barrio + ', ' + nl.city) + '</dd><dt>Asesor</dt><dd>' + esc(D.userName(nxt.broker)) + '</dd><dt>Duración</dt><dd>~60 min</dd></div>') : '') +
      card('Próximos', up.length ? join(up.map(function (t) { var l = D.listing(t.listingId); return '<div class="pt-visit">' + dateBox(t.at) + '<div><div class="t">' + esc(l.title) + '</div><div class="m">' + esc(t.time) + ' · ' + esc(t.mode === 'video' ? 'videollamada' : l.barrio + ', ' + l.city) + '</div><div class="row" style="margin-top:var(--s-2)">' + (t.status === 'solicitado' ? '<span class="pill pill-warn">Por confirmar</span>' : '<span class="pill pill-success">Confirmado</span>') + btn({ label: 'Calendario', size: 'btn-sm', cls: 'btn-ghost', icon: 'calendar', action: 'portal-tour-calendar', args: { tour: t.id } }) + '</div></div></div>'; })) : '<div class="pt-empty">Sin recorridos próximos</div>') +
      card('Realizados', past.length ? join(past.map(function (t) { var l = D.listing(t.listingId); var hasOffer = b.deals.some(function (d) { return d.listingId === l.id; }); return '<div class="pt-visit">' + dateBox(t.at, true) + '<div><div class="t">' + esc(l.title) + '</div><div class="m">' + esc(t.time) + ' · con ' + esc(D.userName(t.broker)) + '</div><div class="row" style="margin-top:var(--s-2)">' + (hasOffer ? '<span class="pill pill-brand">Hiciste una oferta</span>' : btn({ label: 'Hacer una oferta', size: 'btn-sm', action: 'portal-nav', args: { role: 'buyer', module: 'messages' } })) + btn({ label: 'Volver a ver', size: 'btn-sm', cls: 'btn-ghost', action: 'portal-tour-request', args: { listing: l.id } }) + '</div></div></div>'; })) : '<div class="pt-empty">Aún no has recorrido inmuebles</div>', { cls: nl ? 'span-2' : '' }) +
      '</div>');
  };

  M['buyer:offers'] = function (ctx) {
    var b = buyer(ctx);
    if (!b.deals.length) return page(head('Ofertas', 'Todavía no has hecho ofertas.'), nextStep({ title: 'Cuando encuentres el indicado, oferta desde aquí', body: 'Tu asesor redacta la oferta contigo y Llave la formaliza en minutos.', actions: [{ label: 'Ver favoritos', cls: 'btn-light', href: route('buyer', 'shortlist') }] }));
    return page(head('Mis ofertas', 'Así van tus negociaciones.'),
      join(b.deals.map(function (d) {
        var l = D.listing(d.listingId), diff = Math.round((1 - d.offerPrice / d.askingPrice) * 1000) / 10;
        var k = D.contracts.filter(function (x) { return x.dealId === d.id && x.status !== 'firmado'; })[0];
        var accepted = d.agreedPrice != null, withdrawn = d._withdrawn;
        var tl = (d.timeline || []).map(function (t) { return '<li class="timeline-item' + (t.done ? ' is-done' : '') + (t.current ? ' is-current' : '') + (t.ai && !t.done ? ' is-ai' : '') + '"><div class="timeline-time">' + esc(t.at ? fdate(t.at, 'short') : 'Próximamente') + '</div><div class="timeline-title">' + esc(t.label.replace(/\s*\(AI[^)]*\)/, '')) + (t.ai ? ' ' + aiTag('con Llave') : '') + '</div></li>'; }).join('');
        return nextStep({ eyebrow: 'Estado de tu oferta', title: withdrawn ? 'Retiraste tu oferta por ' + esc(l.title) : accepted ? '¡Oferta aceptada por ' + esc(l.title) + '!' : 'Tu oferta de ' + esc(money(d.offerPrice, d.currency)) + ' está en manos del propietario', body: withdrawn ? 'Puedes hacer una nueva cuando quieras.' : accepted ? 'El abogado de Dorum prepara la promesa de compraventa. Revisa tus documentos.' : 'Precio de lista ' + esc(money(d.askingPrice, d.currency)) + ' (' + esc(diff.toLocaleString('es-CO')) + ' % menos). ' + (k ? 'El propietario está revisando una respuesta con su asesor.' : 'Respuesta estimada: antes del miércoles.'), actions: !withdrawn && !accepted ? [{ label: 'Mejorar mi oferta', cls: 'btn-light', action: 'portal-offer-raise', args: { deal: d.id } }, { label: 'Retirar', cls: 'btn-glass', action: 'portal-offer-withdraw', args: { deal: d.id } }] : [] }) +
          '<div class="pt-grid">' +
          card('Línea de tiempo', '<ul class="timeline">' + tl + '</ul>') +
          card('Lo que dice Llave', aiTag('Lectura de mercado') + '<p style="margin-top:var(--s-2)">' + esc(diff > 5 ? 'Tu oferta está ' + diff.toLocaleString('es-CO') + ' % bajo el precio de lista. En ' + l.city + ' las ofertas aceptadas este año cerraron en promedio 3,8 % por debajo, así que es probable una contraoferta cercana a ' + cop(Math.round(d.askingPrice * 0.965 / 1e7) * 1e7, { compact: true }) + '.' : 'Tu oferta está muy cerca del precio de lista; las probabilidades de aceptación son altas.') + '</p>' + (d.parties.lender ? '<div class="callout callout-success" style="margin-top:var(--s-3)">' + ico('check') + '<span>Tu crédito pre-aprobado fortalece la oferta ante el vendedor.</span></div>' : '<div class="callout callout-info" style="margin-top:var(--s-3)">' + ico('landmark') + '<span>Una pre-aprobación de crédito acelera la respuesta del vendedor.</span>' + btn({ label: 'Pedirla', size: 'btn-sm', action: 'portal-lender-request', args: { deal: d.id } }) + '</div>') + '<p class="xs muted" style="margin-top:var(--s-3)">Orientación general, no asesoría financiera. Tu asesor ' + esc(firstName(b.broker)) + ' la revisa contigo.</p>') +
          card(null, listingRow(l, { right: '<div>' + badge(l.status) + '</div>' }), { cls: 'span-2' }) +
          '</div>';
      })));
  };

  function lenderCard(b, widget) {
    var deal = b.deals[0], req = S.lender[b.user.id];
    var pre = D.documents.filter(function (d) { return d.name.toLowerCase().indexOf('pre-aprobación') >= 0 && deal && d.dealId === deal.id; })[0];
    var body;
    if (b.lender && pre) body = '<div class="row"><span class="avatar">' + esc(b.lender.initials) + '</span><div><div style="font-weight:600">' + esc(b.lender.name) + '</div><div class="small muted">' + esc(b.lender.title) + '</div></div></div><div class="callout callout-success" style="margin-top:var(--s-3)">' + ico('check') + '<span>Pre-aprobado · ' + esc(pre.aiCheck || '') + '</span></div>' + (widget ? '' : '<div class="pt-kv" style="margin-top:var(--s-4)"><dt>Siguiente paso</dt><dd>Avalúo bancario tras la promesa</dd><dt>Tasa estimada</dt><dd>UVR + 6,4 %</dd></div>');
    else if (req) body = '<div class="callout callout-info">' + ico('clock') + '<span>Solicitud enviada a ' + esc(D.userName('u-lender')) + ' (Bancolombia). Te contacta hoy por WhatsApp.</span></div>';
    else body = '<p class="small">¿Necesitas crédito hipotecario? Te presentamos a nuestra asesora aliada; sin compromiso.</p><div class="pt-actions" style="margin-top:var(--s-3)">' + btn({ label: 'Pedir pre-aprobación', primary: true, size: widget ? 'btn-sm' : '', action: 'portal-lender-request', args: { deal: deal ? deal.id : '' } }) + '</div>';
    return body;
  }
  M['buyer:documents'] = function (ctx) { var b = buyer(ctx); var docs = docsFor('buyer', b.deals.map(function (d) { return d.listingId; }), b.deals.map(function (d) { return d.id; })); return documentsPage('buyer', docs, 'Lo que necesitamos para la promesa de compraventa' + (b.deals.length ? ' de <b>' + esc(D.listing(b.deals[0].listingId).title) + '</b>' : '') + '.', card('Crédito hipotecario', lenderCard(b, false))); };
  M['buyer:messages'] = function (ctx) { var b = buyer(ctx); return page(head('Mensajes', 'Tu conversación con ' + esc(b.broker.name) + '.'), messagesView('buyer', threadFor('buyer', b.user, b.broker, b.deals.length ? D.listing(b.deals[0].listingId) : null), b.user)); };

  /* ============================================================== LANDLORD */
  function propSwitcher(p) { if (p.props.length < 2) return ''; return '<div class="pt-chips">' + join(p.props.map(function (x) { return chip(x.listing.title.split(' · ')[0], 'portal-select-prop', { listing: x.listing.id }, p.prop.listing.id === x.listing.id); })) + '</div>'; }
  function leaseProgress(deal) {
    if (!deal || !deal.startDate) return '';
    var total = daysBetween(deal.startDate, deal.endDate), gone = Math.max(0, Math.min(total, daysBetween(deal.startDate, iso(TODAY)))), pc = Math.round(gone / total * 100);
    return '<div class="progress progress-lg"><span style="--value:' + pc + '%"></span></div><div class="pt-lease-bar"><span>Inicio ' + esc(fdate(deal.startDate, 'short')) + '</span><span>' + (gone <= 0 ? 'Empieza en ' + (-daysBetween(deal.startDate, iso(TODAY))) + ' días' : pc + ' % del contrato') + '</span><span>Fin ' + esc(fdate(deal.endDate, 'short')) + '</span></div>';
  }
  var INVENTORY = [['Cocina integral', 'Buen estado'], ['Calentador de paso', 'Revisión pendiente'], ['Pisos laminados', 'Buen estado'], ['Balcón y barandas', 'Buen estado'], ['Ventanas y cortinas', 'Buen estado'], ['Pintura general', 'Retoque en alcoba 2']];
  M['landlord:my-property'] = function (ctx) {
    var p = landlord(ctx), cur = p.prop, l = cur.listing, d = cur.deal;
    var statements = statementsFor(cur), last = statements[0];
    var pendingQuote = ticketsFor([l.id]).filter(function (t) { return t.status === 'cotizado'; })[0];
    var inv = D.contracts.filter(function (k) { return d && k.dealId === d.id && /inventario/i.test(k.type); })[0];
    var next = pendingQuote ? nextStep({ title: 'Aprueba la cotización del ' + esc(pendingQuote.title.toLowerCase()), body: esc(pendingQuote.quote.vendor) + ' · ' + esc(cop(pendingQuote.quote.amount)) + '. El arrendatario espera la fecha de visita.', actions: [{ label: 'Ver y aprobar', cls: 'btn-light', href: route('landlord', 'maintenance') }] })
      : inv && inv.status === 'pendiente' ? nextStep({ title: 'Inventario de entrada el 25 de septiembre', body: 'Llave lo genera desde las fotos del recorrido; ustedes lo firman desde el celular.', actions: [{ label: 'Ver documentos', cls: 'btn-light', href: route('landlord', 'documents') }] })
      : nextStep({ title: 'Tu propiedad está al día', body: last ? 'Última liquidación: ' + esc(cop(last.payout)) + ' (' + esc(last.label) + ').' : 'Te avisamos con cada pago y novedad.' });
    return page(head('Mi propiedad', 'Hola ' + esc(firstName(p.user)) + ', así va <b>' + esc(l.title) + '</b>.'),
      propSwitcher(p) + next +
      '<div class="pt-grid">' +
      card(null, '<img class="pt-hero-img" src="' + esc(l.cover) + '" alt="' + esc(l.title) + '"><div class="row row-between" style="margin-top:var(--s-4)"><div><div style="font-weight:600;font-size:var(--fs-lg)">' + esc(l.title) + '</div><div class="muted small">' + esc(l.barrio + ' · ' + l.city) + ' · ' + esc(D.fmtM2(l.area)) + (l.estrato ? ' · Estrato ' + l.estrato : '') + '</div></div>' + badge(cur.rented ? 'arrendado' : l.status) + '</div>') +
      card('Contrato', d ? '<dl class="pt-kv"><dt>Arrendatario</dt><dd>' + esc(cur.tenant || 'Por definir') + '</dd>' + (d.monthlyRent ? '<dt>Canon</dt><dd>' + esc(cop(d.monthlyRent)) + ' / mes</dd>' : '<dt>Tarifa</dt><dd>' + esc(cop(d.nightlyRate)) + ' / noche</dd>') + (d.administracion ? '<dt>Administración</dt><dd>' + esc(cop(d.administracion)) + '</dd>' : '') + (d.deposit || (d.escrow && d.escrow.held) ? '<dt>Depósito en escrow</dt><dd>' + esc(cop(d.deposit || d.escrow.held)) + '</dd>' : '') + '<dt>Administración Dorum</dt><dd>' + esc(d.mgmtPct) + ' % + IVA</dd>' + (d.termMonths ? '<dt>Plazo</dt><dd>' + esc(d.termMonths) + ' meses</dd>' : '<dt>Modalidad</dt><dd>Renta vacacional · ocupación ' + esc(d.occupancyPct) + ' %</dd>') + '</dl><div style="margin-top:var(--s-4)">' + leaseProgress(d) + '</div>' : '<div class="pt-empty">Aún sin contrato. Tu inmueble está publicado y en visitas.</div>') +
      card('Estado e inventario', (inv ? '<div class="row" style="margin-bottom:var(--s-3)"><span class="pill ' + (inv.status === 'firmado' ? 'pill-success' : 'pill-warn') + '">' + esc(inv.type) + ' · ' + esc(inv.status) + '</span>' + (inv.note ? '<span class="small muted">' + esc(inv.note) + '</span>' : '') + '</div>' : '') + '<div class="pt-inv">' + join(INVENTORY.slice(0, l.type === 'oficina' ? 4 : 6).map(function (it) { return '<div>' + esc(it[0]) + '<small>' + esc(it[1]) + '</small></div>'; })) + '</div>', { cls: 'span-2', aside: '<span class="small muted">' + esc(l.type === 'oficina' ? 'Inventario comercial' : 'Inventario de vivienda') + '</span>' }) +
      (last ? card('Última liquidación', '<div class="pt-big">' + esc(cop(last.payout)) + ' <small>' + esc(last.label) + '</small></div><p class="small muted" style="margin-top:var(--s-2)">' + (last.status === 'pagado' ? 'Pagado a tu cuenta el ' + esc(fdate(last.paidAt, 'short')) : 'Se paga el 30 · pendiente de aprobación contable') + '</p><div class="pt-actions" style="margin-top:var(--s-3)">' + btn({ label: 'Ver extractos', href: route('landlord', 'statements'), size: 'btn-sm' }) + '</div>') : '') +
      card('Tu equipo Dorum', '<div class="pt-contact"><span class="avatar">' + esc(p.admin.initials) + '</span><div><div class="t">' + esc(p.admin.name) + '</div><div class="m">Administración de arriendos</div></div><div class="act">' + btn({ label: 'Escribir', size: 'btn-sm', icon: 'message-circle', href: route('landlord', 'messages') }) + '</div></div>' + (l.listedBy ? '<div class="pt-contact"><span class="avatar avatar-sand">' + esc(D.user(l.listedBy).initials) + '</span><div><div class="t">' + esc(D.userName(l.listedBy)) + '</div><div class="m">Asesor que colocó el inmueble</div></div></div>' : '')) +
      '</div>');
  };

  function statementCard(st, p, open) {
    var d = p.deal;
    return '<div class="pt-offer"><div class="row row-between"><div><div style="font-weight:600;font-size:var(--fs-lg)">' + esc(st.label) + '</div><div class="small muted">' + esc(p.listing.title) + (st.nights ? ' · ' + st.nights + ' noches · ocupación ' + st.occ + ' %' : '') + '</div></div>' + badge(st.status) + '</div>' +
      '<dl class="pt-stmt"><dt>' + (st.nights ? 'Ingresos por reservas' : 'Canon cobrado') + '</dt><dd class="money">' + esc(cop(st.gross)) + '</dd><dt>Administración Dorum ' + esc(d.mgmtPct) + ' %</dt><dd class="money neg">− ' + esc(cop(st.fee)) + '</dd><dt>IVA sobre la administración</dt><dd class="money neg">− ' + esc(cop(st.iva)) + '</dd>' + (st.maint ? '<dt>Mantenimiento aprobado</dt><dd class="money neg">− ' + esc(cop(st.maint)) + '</dd>' : '') + '<div class="tot" style="display:contents"><dt>Tu liquidación</dt><dd class="money">' + esc(cop(st.payout)) + '</dd></div></dl>' +
      '<div class="pt-actions">' + btn({ label: 'Descargar PDF', icon: 'download', size: 'btn-sm', action: 'portal-statement-download', args: { stmt: st.id, label: st.label } }) + (st.status === 'pendiente' ? '<span class="small muted">Se paga a tu cuenta el 30 tras aprobación contable</span>' : '<span class="small muted">Pagado el ' + esc(fdate(st.paidAt, 'short')) + ' · Bancolombia ****4421</span>') + '</div></div>';
  }
  M['landlord:statements'] = function (ctx) {
    var p = landlord(ctx), all = [], pendingProps = [];
    p.props.forEach(function (x) { var st = statementsFor(x); if (st.length) st.forEach(function (s) { all.push({ s: s, p: x }); }); else if (x.deal && x.deal.startDate) pendingProps.push(x); });
    all.sort(function (a, b) { return a.s.month < b.s.month ? 1 : -1; });
    var ytd = all.reduce(function (s, x) { return s + x.s.payout; }, 0);
    var first = pendingProps[0];
    var byMonth = {}; all.forEach(function (x) { byMonth[x.s.month] = (byMonth[x.s.month] || 0) + x.s.payout; });
    var months = Object.keys(byMonth).sort();
    return page(head('Extractos', 'Liquidaciones mensuales de ' + (p.props.length === 1 ? '<b>' + esc(p.props[0].listing.title) + '</b>' : 'tus ' + p.props.length + ' propiedades') + '.'),
      (all.length ? nextStep({ eyebrow: 'Resumen', title: esc(cop(ytd)) + ' liquidados en ' + months.length + (months.length === 1 ? ' mes' : ' meses'), body: 'Cada extracto detalla ingreso, administración Dorum, IVA y el mantenimiento que tú aprobaste.' + (first ? ' El primer extracto de ' + esc(first.listing.title) + ' llega el ' + esc(fdate(first.deal.startDate.slice(0, 8) + '30', 'short')) + '.' : ''), actions: [{ label: 'Descargar todos', cls: 'btn-light', icon: 'download', action: 'portal-statement-download', args: { stmt: 'all', label: 'todos los extractos' } }] }) : nextStep({ title: 'Tu primer extracto llegará el ' + esc(fdate(first ? first.deal.startDate.slice(0, 8) + '30' : iso(TODAY), 'long').replace(/ de 2026/, '')), body: (first ? 'El contrato inicia el ' + esc(fdate(first.deal.startDate, 'long')) + '. ' : '') + 'Mientras tanto el depósito está protegido en la cuenta escrow de Dorum.' })) +
      (months.length > 1 ? card('Tu liquidación por mes', bars(months.map(function (m) { var d = new Date(m + '-15T12:00:00'); return { label: cap(monthName(d.getMonth()).slice(0, 3)), value: byMonth[m], hot: m === months[months.length - 1] }; }), 110)) : '') +
      '<div class="stack">' + join(all.map(function (x) { return statementCard(x.s, x.p); })) + '</div>');
  };

  M['landlord:maintenance'] = function (ctx) {
    var p = landlord(ctx), ids = p.props.map(function (x) { return x.listing.id; }), ts = ticketsFor(ids);
    var pend = ts.filter(function (t) { return t.status === 'cotizado'; }), open = ts.filter(function (t) { return t.status !== 'resuelto'; }), done = ts.filter(function (t) { return t.status === 'resuelto'; });
    return page(head('Mantenimiento', esc(open.length) + ' novedades abiertas en tus propiedades.'),
      (pend.length ? nextStep({ title: 'Aprueba ' + (pend.length === 1 ? 'una cotización' : pend.length + ' cotizaciones'), body: 'Llave ya comparó proveedores y propuso el mejor. Tú decides; el costo se descuenta de tu liquidación.' }) : nextStep({ title: 'Nada pendiente de tu parte', body: 'Dorum coordina técnicos y te informa cada avance.' })) +
      '<div class="pt-grid">' +
      card('Abiertas', open.length ? join(open.map(function (t) { return ticketRow(t, 'landlord'); })) : '<div class="pt-empty">Sin novedades abiertas</div>', { cls: 'span-2' }) +
      card('Resueltas', done.length ? join(done.map(function (t) { return ticketRow(t, 'landlord'); })) : '<div class="pt-empty">—</div>', { cls: 'span-2' }) +
      '</div>');
  };
  M['landlord:documents'] = function (ctx) { var p = landlord(ctx); var docs = docsFor('landlord', p.props.map(function (x) { return x.listing.id; }), p.props.filter(function (x) { return x.deal; }).map(function (x) { return x.deal.id; })); return documentsPage('landlord', docs, 'Documentos de tus propiedades en administración.'); };
  M['landlord:messages'] = function (ctx) { var p = landlord(ctx); return page(head('Mensajes', 'Tu conversación con ' + esc(p.admin.name) + '.'), messagesView('landlord', threadFor('landlord', p.user, p.admin, p.prop.listing), p.user)); };

  /* ================================================================ RENTER */
  function nextPayment(r) { return paymentsFor(r).filter(function (x) { return x.status === 'pendiente'; })[0]; }
  M['renter:my-home'] = function (ctx) {
    var r = renter(ctx), l = r.listing, d = r.deal, np = nextPayment(r), tk = ticketsFor([l.id]).filter(function (t) { return t.status !== 'resuelto'; });
    var keys = (d.timeline || []).filter(function (t) { return /inventario/i.test(t.label) && !t.done; })[0];
    var next = np ? nextStep({ title: (np.at > iso(TODAY) ? 'Tu primer canon vence el ' : 'Tu canon vence el ') + esc(fdate(np.at, 'long').replace(/ de 2026/, '')), body: esc(cop(np.amount)) + ' (canon + administración). Paga con PSE, Nequi o Bancolombia en un minuto; el recibo queda aquí.', actions: [{ label: 'Pagar ' + cop(np.amount), cls: 'btn-light', action: 'portal-pay-open' }] }) : nextStep({ title: 'Estás al día', body: 'Tu próximo canon se genera el 1.º del mes.' });
    return page(head('Mi hogar', 'Hola ' + esc(firstName(r.user)) + ', bienvenido/a a <b>' + esc(l.title) + '</b>.'),
      next +
      '<div class="pt-grid">' +
      card(null, '<img class="pt-hero-img" src="' + esc(l.cover) + '" alt="' + esc(l.title) + '"><div style="margin-top:var(--s-4)"><div style="font-weight:600;font-size:var(--fs-lg)">' + esc(l.title) + '</div><div class="muted small">' + esc(l.barrio + ' · ' + l.city) + ' · ' + esc(D.fmtM2(l.area)) + ' · ' + esc(l.habitaciones) + ' alcobas · ' + esc(l.banos) + ' baños' + (l.parqueaderos ? ' · ' + l.parqueaderos + ' parq' : '') + '</div></div>' + (keys ? '<div class="callout callout-info" style="margin-top:var(--s-4)">' + ico('key') + '<span>Entrega de llaves e inventario: <b>' + esc(fdate(keys.at, 'long').replace(/ de 2026/, '')) + '</b>, 10:00. Llave arma el inventario con las fotos del recorrido.</span></div>' : '')) +
      card('Tu contrato', '<dl class="pt-kv"><dt>Canon mensual</dt><dd>' + esc(cop(d.monthlyRent)) + '</dd><dt>Administración</dt><dd>' + esc(cop(d.administracion || 0)) + '</dd><dt>Depósito</dt><dd>' + esc(cop(d.deposit || 0)) + ' · en escrow</dd><dt>Vigencia</dt><dd>' + esc(fdate(d.startDate, 'short')) + ' → ' + esc(fdate(d.endDate)) + '</dd><dt>Plazo</dt><dd>' + esc(d.termMonths) + ' meses</dd><dt>Garantía</dt><dd>' + esc((r.contract && r.contract.signers.filter(function (s) { return s.name; })[0] || {}).name || 'Afianzadora') + '</dd></dl><div style="margin-top:var(--s-4)">' + leaseProgress(d) + '</div><div class="pt-actions" style="margin-top:var(--s-4)">' + btn({ label: 'Ver contrato firmado', icon: 'file-text', size: 'btn-sm', action: 'portal-doc-view', args: { doc: r.contract ? r.contract.id : '', role: 'renter' } }) + '</div>') +
      card('Edificio y administración', '<dl class="pt-kv"><dt>Administración</dt><dd>' + esc(cop(l.administracion)) + ' / mes · incluida en tu pago</dd><dt>Estrato</dt><dd>' + esc(l.estrato || '—') + '</dd><dt>Incluye</dt><dd style="text-align:right;font-weight:500">' + esc(l.amenities.slice(0, 3).join(' · ')) + '</dd><dt>Mascotas</dt><dd>' + (l.amenities.some(function (a) { return /pet/i.test(a); }) ? 'Bienvenidas' : 'Consultar') + '</dd><dt>Horario portería</dt><dd>24 horas</dd></dl>') +
      card('Contactos de emergencia', '<div class="pt-contact"><span class="avatar">' + esc(r.admin.initials) + '</span><div><div class="t">' + esc(r.admin.name) + '</div><div class="m">Tu administradora Dorum · ' + esc(r.admin.phone) + '</div></div><div class="act">' + btn({ label: '', icon: 'message-circle', cls: 'btn-ghost btn-icon', href: route('renter', 'messages') }) + '</div></div>' +
        '<div class="pt-contact"><span class="avatar avatar-sand">' + ico('shield') + '</span><div><div class="t">Portería del edificio</div><div class="m">24 h · interfono 001</div></div></div>' +
        '<div class="pt-contact"><span class="avatar avatar-accent">' + ico('alert-triangle') + '</span><div><div class="t">Emergencias</div><div class="m">123 · Bomberos 119 · EPM daños 444 4115</div></div></div>' +
        '<div class="pt-contact"><span class="avatar">' + ico('wrench') + '</span><div><div class="t">Daño en casa</div><div class="m">Repórtalo aquí; Llave asigna técnico</div></div><div class="act">' + btn({ label: 'Reportar', size: 'btn-sm', href: route('renter', 'maintenance') }) + '</div></div>') +
      (tk.length ? card('Novedades abiertas', join(tk.map(function (t) { return ticketRow(t, 'renter'); })), { cls: 'span-2' }) : '') +
      '</div>');
  };

  function payModal(r) {
    var np = nextPayment(r); if (!np) return '';
    var m = S.pay.method, methods = [['pse', 'PSE', '#1E7A57'], ['nequi', 'Nequi', '#5B4B9E'], ['bancolombia', 'Bancolombia', '#B7800F']];
    return '<div class="stack" data-form="pay"><div class="pt-modal-total"><div><div class="eyebrow">Total a pagar</div><div class="small muted">' + esc(np.concept) + ' · vence ' + esc(fdate(np.at, 'short')) + '</div></div><div class="pt-big">' + esc(cop(np.amount)) + '</div></div>' +
      '<dl class="pt-stmt">' + join((np.breakdown || []).map(function (b) { return '<dt>' + esc(b[0]) + '</dt><dd class="money">' + esc(cop(b[1])) + '</dd>'; })) + '</dl>' +
      '<div><div class="label" style="margin-bottom:var(--s-2)">Medio de pago</div><div class="pt-pm-grid">' + join(methods.map(function (x) { return '<button type="button" class="pt-pm' + (m === x[0] ? ' is-active' : '') + '" data-action="portal-pay-method" data-method="' + x[0] + '" aria-pressed="' + (m === x[0]) + '"><span class="logo" style="background:' + x[2] + '">' + esc(x[1].slice(0, 3).toUpperCase()) + '</span>' + esc(x[1]) + '</button>'; })) + '</div></div>' +
      '<p class="xs muted">Pago seguro procesado por la pasarela de Dorum · el dinero llega a la cuenta escrow y se liquida al propietario.</p>' +
      '<div class="modal-footer" style="padding-top:0">' + btn({ label: 'Cancelar', cls: 'btn-ghost', action: 'portal-close-modal' }) + btn({ label: 'Pagar ' + cop(np.amount), primary: true, size: 'btn-lg', action: 'portal-pay-confirm', args: { payment: np.id, deal: r.deal.id } }) + '</div></div>';
  }
  M['renter:payments'] = function (ctx) {
    var r = renter(ctx), pays = paymentsFor(r), np = nextPayment(r), receipts = pays.filter(function (x) { return x.status === 'pagado'; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    return page(head('Pagos', 'Tu canon, tus recibos, sin filas.'),
      (np ? nextStep({ title: esc(cop(np.amount)) + ' · vence el ' + esc(fdate(np.at, 'long').replace(/ de 2026/, '')), body: esc(np.concept) + '. Incluye canon y administración; te enviamos el recibo al WhatsApp.', actions: [{ label: 'Pagar ahora', cls: 'btn-light', action: 'portal-pay-open' }] }) : nextStep({ eyebrow: 'Estás al día', title: 'No tienes pagos pendientes', body: 'Tu próximo canon se genera automáticamente el 1.º del mes y te avisamos 5 días antes.' })) +
      '<div class="pt-grid">' +
      card('Cómo funciona', '<dl class="pt-kv"><dt>Fecha de pago</dt><dd>Día 1 de cada mes</dd><dt>Periodo de gracia</dt><dd>5 días</dd><dt>Mora</dt><dd>Según contrato · te avisamos antes</dd><dt>Incremento anual</dt><dd>IPC · al renovar</dd></dl><p class="small muted" style="margin-top:var(--s-3)">¿Quieres pago automático? Actívalo con ' + esc(firstName(r.admin)) + ' desde Mensajes.</p>') +
      card('Recibos', receipts.length ? join(receipts.map(function (x) { return '<div class="pt-doc" data-status="validado"><div class="pt-ico">' + ico('check') + '</div><div class="flex-1"><div class="t">' + esc(x.concept) + '</div><div class="m">' + esc(fdate(x.at)) + ' · ' + esc(x.method || '') + ' · ref. ' + esc(x.ref || '') + '</div></div><div class="act"><b class="money" style="margin-right:var(--s-2)">' + esc(cop(x.amount)) + '</b>' + btn({ label: '', icon: 'download', cls: 'btn-ghost btn-icon', action: 'portal-receipt-download', args: { receipt: x.id } }) + '</div></div>'; })) : '<div class="pt-empty">Aún no tienes recibos</div>') +
      '</div>');
  };

  var CATS = ['Plomería', 'Eléctrico', 'Electrodomésticos', 'Cerrajería', 'Humedad', 'Otro'];
  M['renter:maintenance'] = function (ctx) {
    var r = renter(ctx), ts = ticketsFor([r.listing.id]), f = S.ticketForm, open = ts.filter(function (t) { return t.status !== 'resuelto'; });
    return page(head('Mantenimiento', open.length ? esc(open.length) + (open.length === 1 ? ' novedad abierta' : ' novedades abiertas') + ' en tu hogar.' : 'Todo funciona. Si algo falla, cuéntanos aquí.'),
      (open.length ? nextStep({ title: esc(open[0].title), body: esc({ cotizado: 'Cotización lista; esperando aprobación del propietario. Te confirmamos la visita apenas apruebe.', aprobado: 'Aprobado. Estamos agendando al técnico.', 'en curso': 'Técnico asignado: ' + (open[0].quote ? open[0].quote.vendor + ' · ' + open[0].quote.eta : ''), nuevo: 'Recibido. Llave ya lo clasificó y propuso un técnico.', programado: 'Programado para ' + (open[0].quote ? open[0].quote.eta : 'pronto') }[open[0].status] || '') }) : nextStep({ title: 'Reporta cualquier daño en un minuto', body: 'Elige la categoría, cuéntanos qué pasa y adjunta una foto. Llave clasifica y propone técnico al instante.' })) +
      '<div class="pt-grid">' +
      card('Reportar un daño', '<div class="stack" data-form="ticket"><div class="field"><label class="label" for="pt-tk-cat">¿Qué tipo de daño?</label><select class="select" id="pt-tk-cat" data-field="category">' + join(CATS.map(function (c) { return '<option' + (f.category === c ? ' selected' : '') + '>' + esc(c) + '</option>'; })) + '</select></div>' +
        '<div class="field"><label class="label" for="pt-tk-desc">Cuéntanos qué pasa</label><textarea class="textarea" id="pt-tk-desc" data-field="desc" placeholder="Ej: el calentador no da agua caliente desde ayer">' + esc(f.desc || '') + '</textarea></div>' +
        '<div class="field"><span class="label">Urgencia</span><div class="pt-chips">' + join([['baja', 'Baja · puede esperar'], ['media', 'Media · esta semana'], ['alta', 'Alta · hoy']].map(function (u) { return chip(u[1], 'portal-ticket-urgency', { urg: u[0] }, f.urg === u[0]); })) + '</div></div>' +
        '<button type="button" class="pt-upload' + (f.photo ? ' is-done' : '') + '" data-action="portal-ticket-photo">' + ico(f.photo ? 'check' : 'camera') + '<b>' + (f.photo ? 'Foto adjunta · IMG_2041.jpg' : 'Adjuntar foto') + '</b><br><span class="xs">Ayuda al técnico a llegar preparado</span></button>' +
        btn({ label: 'Enviar reporte', icon: 'send', primary: true, size: 'btn-lg btn-block', action: 'portal-ticket-submit' }) + '</div>') +
      card('Mis reportes', ts.length ? join(ts.map(function (t) { return ticketRow(t, 'renter'); })) : '<div class="pt-empty">Sin reportes</div>') +
      '</div>');
  };
  M['renter:documents'] = function (ctx) { var r = renter(ctx); var docs = docsFor('renter', [r.listing.id], [r.deal.id]); var extra = r.contract ? card('Tu contrato', '<div class="pt-doc" data-status="validado"><div class="pt-ico">' + ico('pen-tool') + '</div><div class="flex-1"><div class="t">' + esc(r.contract.type) + '</div><div class="m">Firmado electrónicamente el ' + esc(fdate(r.contract.updated)) + ' · ' + esc(r.contract.clauses) + ' cláusulas' + (r.contract.aiDrafted ? ' · ' : '') + '</div>' + (r.contract.aiDrafted ? '<div class="m ai">' + aiTag('Redactado con Llave') + ' revisado por ' + esc(D.userName('u-lawyer')) + '</div>' : '') + '</div><div class="act">' + btn({ label: 'Ver', icon: 'eye', cls: 'btn-ghost', size: 'btn-sm', action: 'portal-doc-view', args: { doc: r.contract.id, role: 'renter' } }) + '</div></div>' + (r.inventory ? '<div class="pt-doc" data-status="' + (r.inventory.status === 'firmado' ? 'validado' : 'pendiente') + '"><div class="pt-ico">' + ico('camera') + '</div><div class="flex-1"><div class="t">' + esc(r.inventory.type) + '</div><div class="m">' + esc(r.inventory.note || r.inventory.status) + '</div></div></div>' : '')) : ''; return documentsPage('renter', docs, 'Tu expediente de arrendamiento en <b>' + esc(r.listing.title) + '</b>.', extra); };
  M['renter:messages'] = function (ctx) { var r = renter(ctx); return page(head('Mensajes', 'Tu conversación con ' + esc(r.admin.name) + '.'), messagesView('renter', threadFor('renter', r.user, r.admin, r.listing), r.user)); };

  /* ========================================================== REGISTRATION */
  var MODULES = {
    'my-listing': { title: 'My listing', titleEs: 'Mi inmueble', icon: 'home' },
    'visits': { title: 'Visits', titleEs: 'Visitas', icon: 'calendar' },
    'offers': { title: 'Offers', titleEs: 'Ofertas', icon: 'handshake' },
    'documents': { title: 'Documents', titleEs: 'Documentos', icon: 'files' },
    'messages': { title: 'Messages', titleEs: 'Mensajes', icon: 'message-circle' },
    'search': { title: 'Search', titleEs: 'Buscar', icon: 'search' },
    'shortlist': { title: 'Shortlist', titleEs: 'Favoritos', icon: 'heart' },
    'tours': { title: 'Tours', titleEs: 'Recorridos', icon: 'map-pin' },
    'my-property': { title: 'My property', titleEs: 'Mi propiedad', icon: 'building' },
    'statements': { title: 'Statements', titleEs: 'Extractos', icon: 'banknote' },
    'maintenance': { title: 'Maintenance', titleEs: 'Mantenimiento', icon: 'wrench' },
    'my-home': { title: 'My home', titleEs: 'Mi hogar', icon: 'key' },
    'payments': { title: 'Payments', titleEs: 'Pagos', icon: 'wallet' }
  };
  function renderModule(id, ctx) {
    var fn = M[ctx.roleId + ':' + id];
    if (!fn) { // a staff role landing on a customer module id → show a gentle notice
      var owners = Object.keys(M).filter(function (k) { return k.split(':')[1] === id; }).map(function (k) { return D.role(k.split(':')[0]).labelEs; });
      return '<div class="pt"><div class="card"><div class="pt-empty">Este módulo pertenece al portal de ' + esc(owners.join(' / ')) + '. Cambia de rol para verlo.</div></div></div>';
    }
    try { return fn(ctx); } catch (e) { console.error('[portals]', id, e); return '<div class="pt"><div class="callout callout-warn">No pudimos cargar este módulo: ' + esc(e.message) + '</div></div>'; }
  }
  function mountModule(el, ctx) {
    var box = el.querySelector('#pt-msgs'); if (box) box.scrollTop = box.scrollHeight;
    var ta = el.querySelector('#pt-msg-input');
    if (ta && !ta._ptBound) { ta._ptBound = true; ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(ctx.roleId, ta.value, ctx); } }); }
    var ci = el.querySelector('#pt-concierge-input');
    if (ci && !ci._ptBound) { ci._ptBound = true; ci.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); concierge(ci.value); } }); }
  }
  Object.keys(MODULES).forEach(function (id) {
    var m = MODULES[id];
    L.register(id, { title: m.title, titleEs: m.titleEs, icon: ico(m.icon) || m.icon, iconName: m.icon, groups: ['customer'], render: function (ctx) { return renderModule(id, ctx); }, mount: mountModule });
  });

  /* =============================================================== WIDGETS */
  function w(body, footHtml) { return '<div class="pt-widget">' + body + (footHtml ? '<div class="pt-widget-foot">' + footHtml + '</div>' : '') + '</div>'; }
  function linkBtn(role, mod, label) { return '<a class="btn btn-ghost btn-sm" href="' + route(role, mod) + '">' + esc(label || 'Ver todo') + ico('chevron-right') + '</a>'; }
  var W = {
    'my-listing-progress': { title: 'Mi inmueble', size: 'lg', link: 'my-listing', render: function (ctx) { var sel = seller(ctx), l = sel.listing, steps = productionSteps(l), done = steps.filter(function (s) { return s.s === 'done'; }).length; return w(listingRow(l, { right: '<div>' + badge(l.status) + '</div>' }) + stepsHtml(steps), '<span class="muted">' + done + ' de ' + steps.length + ' etapas listas · ' + esc(l.daysOnMarket) + ' días publicado</span>' + linkBtn('seller', 'my-listing', 'Ver detalle')); } },
    'visits-feedback': { title: 'Visitas', size: 'md', link: 'visits', render: function (ctx) { var sel = seller(ctx), vs = visitsFor(sel.listing), up = vs.filter(function (v) { return !v.past; }), past = vs.filter(function (v) { return v.past; }); var last = past[past.length - 1]; return w('<div class="pt-big">' + past.length + ' <small>realizadas · ' + up.length + ' agendadas</small></div>' + (last ? '<div class="pt-quote">“' + esc(last.feedback) + '”</div><div class="small" style="color:var(--ai)">' + aiTag('Llave resume') + ' ' + esc(last.ai) + '</div>' : ''), (up[0] ? '<span class="muted">Próxima: ' + esc(fdate(up[0].at, 'short')) + ' · ' + esc(up[0].time) + '</span>' : '<span></span>') + linkBtn('seller', 'visits')); } },
    'offers': { title: 'Ofertas', size: 'md', link: 'offers', render: function (ctx) {
      if (ctx.roleId === 'buyer') { var b = buyer(ctx), d = b.deals[0]; if (!d) return w('<div class="pt-empty">Sin ofertas aún</div>', linkBtn('buyer', 'shortlist', 'Ver favoritos')); var l = D.listing(d.listingId); return w('<div class="pt-big">' + esc(money(d.offerPrice, d.currency)) + '</div><div class="small">' + esc(l.title) + '</div><span class="pill pill-warn">Esperando respuesta del propietario</span>', '<span class="muted">Enviada el ' + esc(fdate('2026-09-15', 'short')) + '</span>' + linkBtn('buyer', 'offers')); }
      var sel = seller(ctx), os = offersFor(sel.listings.map(function (x) { return x.id; })), o = os.filter(function (x) { return x.status === 'pendiente'; })[0] || os[0];
      if (!o) return w('<div class="pt-empty">Aún sin ofertas. ' + esc(sel.listing.leads || 0) + ' interesados siguen tu inmueble.</div>', linkBtn('seller', 'offers'));
      var l2 = D.listing(o.listingId);
      return w('<div class="row row-between"><div class="pt-big">' + esc(money(o.amount, l2.currency)) + '</div>' + (o.status === 'pendiente' ? '<span class="pill pill-warn">Responder</span>' : '<span class="pill pill-brand">' + esc(o.status) + '</span>') + '</div><div class="small">' + esc(o.buyerName) + ' · ' + esc(l2.title) + '</div>' + (o.status === 'pendiente' ? '<div class="small" style="color:var(--ai)">' + aiTag('Llave sugiere') + ' contraofertar ' + esc(money(o.counter.amount, l2.currency)) + '</div>' : ''), '<span></span>' + linkBtn('seller', 'offers', 'Decidir')); } },
    'documents-todo': { title: 'Documentos', size: 'sm', render: function (ctx) {
      var r = ctx.roleId, docs = [];
      if (r === 'seller') { var s = seller(ctx); docs = docsFor('seller', s.listings.map(function (l) { return l.id; }), s.deals.map(function (d) { return d.id; })); }
      else if (r === 'buyer') { var b = buyer(ctx); docs = docsFor('buyer', b.deals.map(function (d) { return d.listingId; }), b.deals.map(function (d) { return d.id; })); }
      else if (r === 'landlord') { var p = landlord(ctx); docs = docsFor('landlord', p.props.map(function (x) { return x.listing.id; }), p.props.filter(function (x) { return x.deal; }).map(function (x) { return x.deal.id; })); }
      else { var rn = renter(ctx); docs = docsFor('renter', [rn.listing.id], [rn.deal.id]); }
      var pend = docs.filter(function (d) { return d.status === 'pendiente' || d.status === 'vencido'; });
      return w('<div class="pt-big">' + pend.length + ' <small>por subir · ' + (docs.length - pend.length) + ' listos</small></div>' + docList(pend.slice(0, 2), r, true), '<span></span>' + linkBtn(r, 'documents')); } },
    'campaign-reach': { title: 'Alcance', size: 'md', link: 'my-listing', render: function (ctx) { var sel = seller(ctx), l = sel.listing, c = sel.campaigns.filter(function (x) { return x.listingId === l.id; })[0]; var reach = (c ? c.impressions : 0) + (l.views || 0); return w('<div class="pt-big">' + esc(reach.toLocaleString('es-CO')) + ' <small>personas alcanzadas</small></div>' + sparkline(series(l.id, 8, Math.max(60, Math.round((l.views || 200) / 8)), 8), 300, 48) + '<div class="row small muted"><span>' + esc(l.leads || 0) + ' interesados</span><span>·</span><span>' + [l.syndication.fincaRaiz && 'Finca Raíz', l.syndication.wasi && 'Wasi', l.syndication.metrocuadrado && 'Metrocuadrado', l.syndication.instagram && 'Instagram'].filter(Boolean).length + ' portales</span>' + (c ? '<span>·</span><span>campaña ' + esc(c.status) + '</span>' : '') + '</div>'); } },
    'shortlist': { title: 'Favoritos', size: 'lg', link: 'shortlist', render: function (ctx) { var b = buyer(ctx), ls = shortlistFor(b).map(D.listing).filter(Boolean); return w(ls.length ? '<div class="stack stack-sm">' + join(ls.slice(0, 3).map(function (l) { return listingRow(l, { right: '<div class="p">' + esc(D.fmtPrice(l)) + '</div>' }); })) + '</div>' : '<div class="pt-empty">Guarda inmuebles con el corazón</div>', '<span class="muted">' + ls.length + ' guardados</span>' + linkBtn('buyer', 'shortlist', 'Comparar')); } },
    'next-tour': { title: 'Próximo recorrido', size: 'md', link: 'tours', render: function (ctx) { var b = buyer(ctx), t = toursFor(b).filter(function (x) { return !x.past; })[0]; if (!t) return w('<div class="pt-empty">Sin recorridos programados</div>', linkBtn('buyer', 'search', 'Buscar')); var l = D.listing(t.listingId); return w('<div class="row">' + dateBox(t.at) + '<div><div style="font-weight:600">' + esc(l.title) + '</div><div class="small muted">' + esc(t.time) + ' · ' + esc(t.mode === 'video' ? 'videollamada' : l.barrio) + ' · con ' + esc(firstName(D.user(t.broker))) + '</div></div></div>' + mapPin(l), btn({ label: 'Agregar al calendario', icon: 'calendar', size: 'btn-sm', action: 'portal-tour-calendar', args: { tour: t.id } }) + linkBtn('buyer', 'tours')); } },
    'offer-status': { title: 'Mi oferta', size: 'md', link: 'offers', render: function (ctx) { return W.offers.render(ctx); } },
    'lender-status': { title: 'Crédito hipotecario', size: 'sm', link: 'documents', render: function (ctx) { return w(lenderCard(buyer(ctx), true)); } },
    'rent-status': { title: 'Arriendos del mes', size: 'md', link: 'my-property', render: function (ctx) { var p = landlord(ctx); return w(join(p.props.map(function (x) { var l = x.listing, d = x.deal, st, lbl; if (!x.rented || !d) { st = 'pendiente'; lbl = 'Vacante · en visitas'; } else if (d.startDate && d.startDate > iso(TODAY)) { st = 'pendiente'; lbl = 'Primer canon el ' + fdate(d.startDate, 'short'); } else { st = 'pagado'; lbl = 'Canon de septiembre recibido'; } return '<div class="pt-doc" data-status="' + (st === 'pagado' ? 'validado' : 'pendiente') + '"><div class="pt-ico">' + ico(st === 'pagado' ? 'check' : 'clock') + '</div><div class="flex-1"><div class="t">' + esc(l.title) + '</div><div class="m">' + esc(lbl) + '</div></div><div class="act"><b class="money">' + esc(d && d.monthlyRent ? cop(d.monthlyRent) : d && d.nightlyRate ? cop(d.nightlyRate) + '/noche' : '—') + '</b></div></div>'; })), '<span></span>' + linkBtn('landlord', 'my-property')); } },
    'monthly-statement': { title: 'Liquidación del mes', size: 'md', link: 'statements', render: function (ctx) { var p = landlord(ctx), st = null, sp = null; p.props.forEach(function (x) { var s0 = statementsFor(x)[0]; if (!st && s0) { st = s0; sp = x; } }); if (!st) return w('<div class="pt-empty">Tu primer extracto llega tras el primer canon (' + esc(fdate(p.prop.deal && p.prop.deal.startDate, 'short')) + ')</div>', linkBtn('landlord', 'statements')); return w('<div class="pt-big">' + esc(cop(st.payout)) + ' <small>' + esc(st.label) + '</small></div><div class="small muted">' + esc(sp.listing.title) + '</div><dl class="pt-stmt small"><dt>Ingreso</dt><dd class="money">' + esc(cop(st.gross)) + '</dd><dt>Administración + IVA</dt><dd class="money neg">− ' + esc(cop(st.fee + st.iva)) + '</dd>' + (st.maint ? '<dt>Mantenimiento</dt><dd class="money neg">− ' + esc(cop(st.maint)) + '</dd>' : '') + '</dl>', badge(st.status) + btn({ label: 'Descargar', icon: 'download', size: 'btn-sm', cls: 'btn-ghost', action: 'portal-statement-download', args: { stmt: st.id, label: st.label } })); } },
    'occupancy': { title: 'Ocupación', size: 'sm', link: 'my-property', render: function (ctx) { var p = landlord(ctx), occ = p.props.filter(function (x) { return x.rented; }).length; return w('<div class="pt-big">' + occ + ' / ' + p.props.length + ' <small>ocupados</small></div>' + join(p.props.map(function (x) { var d = x.deal; return '<div class="row row-between small"><span class="truncate">' + esc(x.listing.title.split(' · ')[0]) + '</span>' + (x.rented && d && d.endDate ? '<span class="muted">hasta ' + esc(fdate(d.endDate, 'short')) + ' ' + d.endDate.slice(0, 4) + '</span>' : x.rented ? '<span class="muted">ocupación ' + esc(d.occupancyPct) + ' %</span>' : '<span class="pill pill-warn">vacante</span>') + '</div>'; }))); } },
    'maintenance': { title: 'Mantenimiento', size: 'md', link: 'maintenance', render: function (ctx) {
      var ids, role = ctx.roleId; if (role === 'landlord') ids = landlord(ctx).props.map(function (x) { return x.listing.id; }); else ids = [renter(ctx).listing.id];
      var ts = ticketsFor(ids).filter(function (t) { return t.status !== 'resuelto'; });
      var pend = ts.filter(function (t) { return t.status === 'cotizado'; });
      return w(ts.length ? join(ts.slice(0, 2).map(function (t) { return '<div class="pt-ticket" data-urg="' + esc(t.urgency) + '" data-tstatus="' + esc(t.status) + '"><div class="pt-ico">' + ico('wrench') + '</div><div class="flex-1"><div class="t">' + esc(t.title) + '</div><div class="m">' + esc(role === 'landlord' && t.status === 'cotizado' ? 'Cotización por aprobar · ' + cop(t.quote.amount) : { cotizado: 'Esperando aprobación del propietario', 'en curso': 'Técnico asignado', programado: 'Programado', aprobado: 'Agendando técnico', nuevo: 'Recibido' }[t.status] || t.status) + '</div></div></div>'; })) : '<div class="pt-empty">Todo funciona</div>', (role === 'landlord' && pend.length ? '<span class="pill pill-warn">' + pend.length + ' por aprobar</span>' : '<span></span>') + linkBtn(role, 'maintenance', role === 'renter' ? 'Reportar daño' : 'Ver todo')); } },
    'rent-due': { title: 'Tu arriendo', size: 'md', link: 'payments', render: function (ctx) { var r = renter(ctx), np = nextPayment(r); if (!np) return w('<div class="pt-big">Al día</div><p class="small muted">Próximo canon el 1.º del mes</p>', linkBtn('renter', 'payments', 'Ver recibos')); return w('<div class="pt-big">' + esc(cop(np.amount)) + '</div><p class="small">' + esc(np.concept) + ' · vence el <b>' + esc(fdate(np.at, 'long').replace(/ de 2026/, '')) + '</b></p>', btn({ label: 'Pagar', primary: true, action: 'portal-pay-open' }) + linkBtn('renter', 'payments', 'Detalle')); } },
    'receipts': { title: 'Recibos', size: 'sm', link: 'payments', render: function (ctx) { var r = renter(ctx), rc = paymentsFor(r).filter(function (x) { return x.status === 'pagado'; }).sort(function (a, b) { return a.at < b.at ? 1 : -1; }); return w(rc.length ? join(rc.slice(0, 3).map(function (x) { return '<div class="row row-between small"><span>' + esc(x.concept) + '<br><span class="muted xs">' + esc(fdate(x.at, 'short')) + '</span></span><b class="money">' + esc(cop(x.amount)) + '</b></div>'; })) : '<div class="pt-empty">Sin recibos</div>', '<span></span>' + linkBtn('renter', 'payments')); } },
    'lifestyle-services': { title: 'Dorum Lifestyle', size: 'md', link: 'lifestyle', render: function (ctx) { var items = D.lifestyle.slice(0, 3); return w('<p class="small">Servicios para tu hogar, a un toque.</p><div class="pt-ls-grid">' + join(items.map(function (s) { return '<div class="pt-ls"><div class="em">' + s.icon + '</div>' + esc(s.nameEs) + (s.status === 'pilot' ? '<br><span class="pill pill-success xs" style="margin-top:4px">piloto</span>' : '') + '</div>'; })) + '</div>', '<span class="muted xs">' + (D.lifestyle.length - 3) + ' servicios más pronto</span>' + linkBtn('renter', 'lifestyle', 'Explorar')); } },
    'lease-summary': { title: 'Tu contrato', size: 'sm', link: 'my-home', render: function (ctx) { var r = renter(ctx), d = r.deal; return w('<dl class="pt-kv small"><dt>Canon</dt><dd>' + esc(cop(d.monthlyRent)) + '</dd><dt>Administración</dt><dd>' + esc(cop(d.administracion || 0)) + '</dd><dt>Hasta</dt><dd>' + esc(fdate(d.endDate)) + '</dd></dl>' + leaseProgress(d), '<span></span>' + linkBtn('renter', 'my-home', 'Mi hogar')); } }
  };
  Object.keys(W).forEach(function (id) {
    var def = W[id];
    L.registerWidget(id, { title: def.title, size: def.size, link: def.link, render: function (ctx) { try { return def.render(ctx); } catch (e) { console.error('[portals widget]', id, e); return '<div class="pt-empty">—</div>'; } }, mount: function () {} });
  });

  /* =============================================================== ACTIONS */
  function field(el, name) { var f = el && el.closest('[data-form]'); var i = f && f.querySelector('[data-field="' + name + '"]'); return i ? i.value : ''; }
  function findOffer(id) { return S.offers.filter(function (o) { return o.id === id; })[0]; }
  function findTicket(id) { return ticketsAll().filter(function (t) { return t.id === id; })[0]; }
  function findDoc(id) { var all = []; Object.keys(S.docs).forEach(function (k) { all = all.concat(S.docs[k]); }); return all.filter(function (d) { return d.id === id; })[0] || D.byId(D.documents, id) || D.byId(D.contracts, id); }
  function sendMessage(roleId, text, ctx) {
    text = (text || '').trim(); if (!text) return;
    var key = Object.keys(S.threads).filter(function (k) { return k.indexOf(roleId + ':') === 0; })[0]; var th = S.threads[key]; if (!th) return;
    var now = new Date(); var at = iso(TODAY) + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    th.msgs.push({ id: key + '-' + th.msgs.length, who: 'me', at: at, text: text });
    rerender();
    var replies = { seller: 'Gracias, ' + firstName(D.user(key.split(':')[1])) + '. Lo reviso y te confirmo hoy mismo.', buyer: 'Recibido. Consulto con el propietario y te escribo en cuanto tenga respuesta.', landlord: 'Perfecto, quedo pendiente. Te confirmo por aquí apenas tenga novedad.', renter: 'Gracias por avisar. Ya lo estoy gestionando; te confirmo la hora hoy mismo.' };
    setTimeout(function () {
      th.msgs.push({ id: key + '-' + th.msgs.length, who: 'them', at: at, text: replies[roleId] || 'Recibido, gracias.', ai: true, pending: true });
      rerender(); toast('Llave preparó una respuesta', firstName(th.them) + ' la revisará antes de enviarla.', 'ai');
      setTimeout(function () { var m = th.msgs[th.msgs.length - 1]; if (m && m.pending) { m.pending = false; rerender(); } }, 3200);
    }, 900);
  }
  function concierge(q) {
    var f = S.search, t = (q || '').toLowerCase(), got = [];
    f.q = q || '';
    if (/embalse|guatap|lago|peñol|charlee|muelle/.test(t)) { f.zona = 'guatape'; got.push('zona Guatapé y Embalse'); }
    else if (/medell|poblado|laureles|envigado|provenza/.test(t)) { f.zona = 'medellin'; got.push('zona Medellín'); }
    else if (/llanogrande|rionegro|retiro|oriente|guarne|fizebad/.test(t)) { f.zona = 'oriente'; got.push('Oriente Antioqueño'); }
    else if (/cartagena|mar\b|playa|caribe/.test(t)) { f.zona = 'cartagena'; got.push('Cartagena'); }
    else if (/tulum|m[ée]xico|dub[aá]i|internacional|abroad/.test(t)) { f.zona = 'internacional'; got.push('portafolio internacional'); }
    if (/finca/.test(t)) { f.type = 'finca'; got.push('fincas'); } else if (/penthouse|dúplex|duplex/.test(t)) { f.type = 'penthouse'; got.push('penthouse'); } else if (/apartamento|apto|apartment/.test(t)) { f.type = 'apartamento'; got.push('apartamentos'); } else if (/lote|terreno|land/.test(t)) { f.type = 'lote'; got.push('lotes'); } else if (/casa|house|villa/.test(t)) { f.type = 'casa'; got.push('casas'); }
    var m = t.match(/(\d[\d.,]*)\s*(mil\s*millones|millones|m\b|mm)/); if (m) { var n = parseFloat(m[1].replace(/\./g, '').replace(',', '.')); var v = /^mil\s*millones/.test(m[2]) ? n * 1e9 : n * 1e6; if (v > 1e8) { f.max = v; got.push('hasta ' + cop(v, { compact: true })); } }
    var hb = t.match(/(\d)\s*(alcobas|habitaciones|hab|cuartos|bedrooms|recámaras)/); if (hb) { f.hab = parseInt(hb[1], 10); got.push(hb[1] + '+ alcobas'); }
    f.note = got.length ? 'Entendí: ' + got.join(' · ') + '. Ajusté los filtros; los resultados están ordenados por coincidencia contigo.' : (q ? 'No encontré filtros claros en “' + q + '”. Prueba mencionar zona, tipo, alcobas o presupuesto.' : '');
    rerender(); if (got.length) toast('Llave ajustó tu búsqueda', got.join(' · '), 'ai');
  }
  var A = {
    'portal-nav': function (d) { L.navigate(d.role, d.module, d.id || undefined); },
    'portal-close-modal': function () { L.closeModal(); },
    'portal-approve-item': function (d) { var list = S.approvals[d.listing] || []; var i = list.findIndex(function (a) { return a.id === d.item; }); var it = list[i]; if (i >= 0) list.splice(i, 1); var l = D.listing(d.listing); if (l) l.images.forEach(function (im) { im.approved = true; }); rerender(); toast(it ? cap(it.kind) + ' aprobados' : 'Aprobado', 'Se republican en Finca Raíz, Wasi y Metrocuadrado en los próximos minutos.', 'success'); },
    'portal-request-change': function (d) { var list = S.approvals[d.listing] || []; var it = list.filter(function (a) { return a.id === d.item; })[0]; L.openModal('<div class="stack" data-form="chg"><p>Cuéntale a tu asesor qué cambiar en <b>' + esc(it ? it.title : 'este borrador') + '</b>. Llave prepara una nueva versión.</p><textarea class="textarea" data-field="text" id="pt-chg" placeholder="Ej: cambia la foto 2 por una de la terraza al atardecer"></textarea><div class="modal-footer">' + btn({ label: 'Cancelar', cls: 'btn-ghost', action: 'portal-close-modal' }) + btn({ label: 'Enviar cambios', primary: true, action: 'portal-request-change-send', args: { item: d.item, listing: d.listing } }) + '</div></div>', { title: 'Pedir cambios' }); },
    'portal-request-change-send': function (d, el) { var t = field(el, 'text'); var list = S.approvals[d.listing] || []; var it = list.filter(function (a) { return a.id === d.item; })[0]; if (it) { it.title = it.title + ' · v2 en preparación'; it.meta = 'Tus cambios: “' + (t || 'sin comentarios') + '”. Llave prepara la nueva versión.'; } L.closeModal(); rerender(); toast('Cambios enviados', 'Tu asesor y Llave preparan la versión 2.', 'ai'); },
    'portal-offer-accept': function (d) { var o = findOffer(d.offer); if (!o) return; o.status = 'aceptada'; var l = D.listing(o.listingId); if (l) l.status = 'bajo oferta'; var deal = o.dealId && D.byId(D.deals, o.dealId); if (deal) { deal.agreedPrice = o.amount; deal.stage = 'cierre'; } rerender(); toast('Oferta aceptada', 'Avisamos al comprador. El abogado prepara la promesa de compraventa.', 'success'); },
    'portal-offer-counter': function (d) { var o = findOffer(d.offer); if (!o) return; o.status = 'contraofertada'; var k = o.dealId && D.contracts.filter(function (x) { return x.dealId === o.dealId && x.type === 'Contraoferta'; })[0]; if (k) k.status = 'enviado'; rerender(); toast('Contraoferta enviada', money(o.counter.amount) + ' · ' + o.counter.terms, 'success'); },
    'portal-offer-reject': function (d) { var o = findOffer(d.offer); if (!o) return; o.status = 'rechazada'; rerender(); toast('Oferta rechazada', 'Tu asesor informa al comprador con cortesía. Seguimos mostrando el inmueble.'); },
    'portal-offer-raise': function (d) { var deal = D.byId(D.deals, d.deal); if (!deal) return; var sug = Math.round(deal.askingPrice * 0.965 / 1e7) * 1e7; L.openModal('<div class="stack" data-form="raise"><p>Tu oferta actual: <b>' + esc(money(deal.offerPrice, deal.currency)) + '</b>. Precio de lista: ' + esc(money(deal.askingPrice, deal.currency)) + '.</p>' + aiSuggest({ head: 'Sugerencia de Llave', body: 'Una mejora a <b>' + esc(money(sug, deal.currency)) + '</b> (3,5 % bajo lista) tiene alta probabilidad de aceptación según los cierres recientes de la zona.', meta: 'Orientación general; decide con tu asesor.' }) + '<div class="field"><label class="label" for="pt-raise">Nueva oferta (COP)</label><input class="input" id="pt-raise" data-field="amount" type="number" value="' + sug + '" step="10000000"></div><div class="modal-footer">' + btn({ label: 'Cancelar', cls: 'btn-ghost', action: 'portal-close-modal' }) + btn({ label: 'Enviar nueva oferta', primary: true, action: 'portal-offer-raise-send', args: { deal: deal.id } }) + '</div></div>', { title: 'Mejorar mi oferta' }); },
    'portal-offer-raise-send': function (d, el) { var deal = D.byId(D.deals, d.deal); var v = parseInt(field(el, 'amount'), 10); if (deal && v > 0) { deal.offerPrice = v; (deal.timeline || []).forEach(function (t) { t.current = false; }); (deal.timeline = deal.timeline || []).push({ at: iso(TODAY), label: 'Oferta mejorada a ' + cop(v, { compact: true }), done: true, current: true }); } L.closeModal(); rerender(); toast('Oferta enviada', 'Tu asesor la formaliza y la presenta al propietario hoy.', 'success'); },
    'portal-offer-withdraw': function (d) { var deal = D.byId(D.deals, d.deal); if (deal) { deal._withdrawn = true; } rerender(); toast('Oferta retirada', 'Puedes hacer una nueva cuando quieras.'); },
    'portal-doc-upload': function (d) { var doc = d.doc && findDoc(d.doc); if (doc) { doc.status = 'recibido'; doc.file = doc.file || (doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) + '.pdf'); doc.aiCheck = 'Llave leyó el archivo: nombre y número coinciden · vigencia OK. El equipo Dorum lo valida hoy.'; } rerender(); toast(doc ? 'Documento recibido' : 'Archivo recibido', doc ? doc.name + ' · Llave lo leyó y lo pasó a validación.' : 'Llave lo clasificará y lo ubicará en tu lista.', 'ai'); },
    'portal-doc-view': function (d) { var doc = findDoc(d.doc); if (!doc) { toast('Archivo', 'Vista previa no disponible en la demo.'); return; } var isK = !!doc.signers; L.openDrawer('<div class="stack"><div class="pt-doc" data-status="' + (isK ? 'validado' : doc.status) + '" style="border:0"><div class="pt-ico">' + ico(isK ? 'pen-tool' : 'file-text') + '</div><div><div class="t">' + esc(doc.name || doc.type) + '</div><div class="m">' + esc(isK ? 'v' + doc.version + ' · ' + doc.clauses + ' cláusulas' : (doc.file || 'Pendiente de archivo')) + '</div></div></div>' + (isK ? '<dl class="pt-kv">' + join(doc.signers.map(function (s) { return '<dt>' + esc(s.userId ? D.userName(s.userId) : s.name) + '</dt><dd>' + badge(s.status) + '</dd>'; })) + '</dl>' : (doc.aiCheck ? '<div class="callout" style="background:var(--ai-soft);border-color:transparent">' + aiTag('Llave revisó') + '<span>' + esc(doc.aiCheck) + '</span></div>' : '')) + '<div class="pt-upload" style="aspect-ratio:3/4;display:grid;place-items:center;cursor:default"><span class="muted small">Vista previa del documento</span></div><div class="pt-actions">' + btn({ label: 'Descargar', icon: 'download', action: 'portal-receipt-download', args: { receipt: doc.id } }) + '</div></div>', { title: isK ? 'Contrato' : 'Documento' }); },
    'portal-msg-send': function (d, el, ctx) { var ta = document.getElementById('pt-msg-input'); sendMessage(d.role || (ctx && ctx.roleId), ta ? ta.value : field(el, 'text'), ctx); },
    'portal-msg-quick': function (d) { var ta = document.getElementById('pt-msg-input'); if (ta) { ta.value = d.text; ta.focus(); } },
    'portal-filter': function (d) { var v = d.value; if (d.key === 'max' || d.key === 'hab') v = parseInt(v, 10) || 0; S.search[d.key] = v; S.search.note = ''; rerender(); },
    'portal-filters-clear': function () { S.search = { q: '', type: 'todos', zona: 'todas', max: 0, hab: 0, note: '' }; rerender(); },
    'portal-concierge': function (d, el) { var i = document.getElementById('pt-concierge-input'); concierge(i ? i.value : field(el, 'q')); },
    'portal-shortlist-toggle': function (d, el, ctx) { var b = buyer(ctx || { roleId: 'buyer' }); var list = shortlistFor(b); var i = list.indexOf(d.listing); var l = D.listing(d.listing); if (i >= 0) { list.splice(i, 1); toast('Quitado de favoritos', l ? l.title : ''); } else { list.push(d.listing); toast('Guardado en favoritos', l ? l.title : '', 'success'); } rerender(); },
    'portal-tour-request': function (d, el, ctx) { var b = buyer(ctx || { roleId: 'buyer' }); var tours = toursFor(b); var l = D.listing(d.listing); if (!l) return; if (tours.some(function (t) { return t.listingId === l.id && !t.past; })) { toast('Ya tienes un recorrido programado', l.title); return; } var at = iso(addDays(TODAY, 4 + (hash(l.id) % 3))); S.tours[b.user.id].push({ id: 'tr-' + b.user.id + '-' + l.id + '-' + Date.now(), listingId: l.id, at: at, time: ['10:00', '15:00', '11:30'][hash(l.id) % 3], broker: l.listedBy, past: false, status: 'solicitado', mode: l.international ? 'video' : 'presencial' }); rerender(); toast('Recorrido solicitado', l.title + ' · ' + fdate(at, 'long') + '. ' + firstName(D.user(l.listedBy)) + ' confirma la hora.', 'success'); },
    'portal-tour-calendar': function (d) { toast('Agregado a tu calendario', 'Invitación enviada a tu correo y a Google Calendar.', 'success'); },
    'portal-lender-request': function (d, el, ctx) { var b = buyer(ctx || { roleId: 'buyer' }); S.lender[b.user.id] = true; rerender(); toast('Solicitud enviada', D.userName('u-lender') + ' (Bancolombia) te contacta hoy por WhatsApp.', 'success'); },
    'portal-statement-download': function (d) { toast('Extracto descargado', (d.label || 'Extracto') + ' · PDF con detalle y soporte contable.', 'success'); },
    'portal-receipt-download': function () { toast('Descarga lista', 'Te lo enviamos también por WhatsApp y correo.', 'success'); },
    'portal-quote-approve': function (d) { var t = findTicket(d.ticket); if (!t) return; t.status = 'aprobado'; t.quote.approved = true; setTimeout(function () { t.status = 'en curso'; rerender(); }, 1500); rerender(); toast('Cotización aprobada', t.quote.vendor + ' · ' + cop(t.quote.amount) + '. El arrendatario recibe la fecha de visita.', 'success'); },
    'portal-quote-other': function (d) { var t = findTicket(d.ticket); if (!t) return; t.quote = { vendor: 'Técnicos Laureles', amount: Math.round(t.quote.amount * 0.92 / 1e4) * 1e4, eta: 'vie 19 sep · 14:00–16:00', ai: true, note: 'Segunda opción de Llave: 4,7 ★, precio 8 % menor, un día más tarde.' }; rerender(); toast('Nueva cotización lista', t.quote.vendor + ' · ' + cop(t.quote.amount), 'ai'); },
    'portal-quote-reject': function (d) { var t = findTicket(d.ticket); if (!t) return; t.status = 'nuevo'; t.quote = null; t.triage = 'Cotización rechazada por el propietario. Daniela busca una alternativa.'; rerender(); toast('Cotización rechazada', 'La administradora te propondrá otra opción.'); },
    'portal-pay-open': function (d, el, ctx) { var r = renter(ctx || { roleId: 'renter' }); var html = payModal(r); if (!html) { toast('Estás al día', 'No tienes pagos pendientes.'); return; } L.openModal(html, { title: 'Pagar arriendo' }); },
    'portal-pay-method': function (d, el, ctx) { S.pay.method = d.method; var r = renter(ctx || { roleId: 'renter' }); var m = el.closest('.modal') || el.closest('[data-form="pay"]').parentNode; var f = el.closest('[data-form="pay"]'); if (f) { var tmp = document.createElement('div'); tmp.innerHTML = payModal(r); f.replaceWith(tmp.firstChild); } },
    'portal-pay-confirm': function (d, el, ctx) { var r = renter(ctx || { roleId: 'renter' }); var pays = paymentsFor(r); var p = pays.filter(function (x) { return x.id === d.payment; })[0]; if (p) { p.status = 'pagado'; p.method = { pse: 'PSE', nequi: 'Nequi', bancolombia: 'Bancolombia' }[S.pay.method] || 'PSE'; p.ref = 'LLV-' + (hash(p.id + Date.now()) % 900000 + 100000); p.at = iso(TODAY); D.payouts.push({ id: 'p-' + Date.now(), date: iso(TODAY), account: 'escrow', dealId: r.deal.id, kind: 'ingreso', concept: p.concept + ' · ' + r.listing.title, amount: p.amount, counterparty: r.user.id, status: 'pagado' }); } L.closeModal(); rerender(); toast('Pago exitoso', p ? cop(p.amount) + ' · ' + p.method + ' · ref. ' + p.ref + '. Recibo enviado a tu WhatsApp.' : 'Recibo enviado a tu WhatsApp.', 'success'); },
    'portal-ticket-urgency': function (d) { S.ticketForm.urg = d.urg; rerender(); },
    'portal-ticket-photo': function () { S.ticketForm.photo = !S.ticketForm.photo; var desc = document.getElementById('pt-tk-desc'); if (desc) S.ticketForm.desc = desc.value; var cat = document.getElementById('pt-tk-cat'); if (cat) S.ticketForm.category = cat.value; rerender(); },
    'portal-ticket-submit': function (d, el, ctx) {
      var r = renter(ctx || { roleId: 'renter' }); var cat = field(el, 'category') || 'Otro', desc = (field(el, 'desc') || '').trim(), urg = S.ticketForm.urg;
      if (!desc) { toast('Cuéntanos qué pasa', 'Escribe una descripción corta del daño.', 'danger'); return; }
      var vendors = { 'Plomería': 'Plomería Express', 'Eléctrico': 'ElectroAndes', 'Electrodomésticos': 'Servitec Hogar', 'Cerrajería': 'Cerrajería 24h Laureles', 'Humedad': 'Sellados del Valle', 'Otro': 'Mantenimiento Dorum' };
      var eta = urg === 'alta' ? 'mañana 8:00–10:00' : urg === 'media' ? 'en 2–3 días' : 'la próxima semana';
      var t = { id: 'tk-' + Date.now(), listingId: r.listing.id, title: desc.length > 48 ? desc.slice(0, 46) + '…' : cap(desc), category: cat, urgency: urg, status: 'cotizado', createdAt: iso(TODAY), by: 'renter', photo: S.ticketForm.photo, triage: 'Llave clasificó el reporte como ' + cat.toLowerCase() + ' · prioridad ' + urg + '. Técnico sugerido: ' + vendors[cat] + ', visita ' + eta + '. ' + firstName(r.admin) + ' confirma y el propietario aprueba la cotización.', quote: { vendor: vendors[cat], amount: urg === 'alta' ? 380000 : urg === 'media' ? 260000 : 180000, eta: 'visita ' + eta, ai: true, note: 'Cotización estimada por Llave según trabajos similares; se ajusta tras el diagnóstico.' } };
      ticketsAll().unshift(t); S.ticketForm = { urg: 'media', photo: false }; rerender(); toast('Reporte enviado', t.triage, 'ai');
    },
    'portal-select-prop': function (d, el, ctx) { var u = actingUser(ctx || { roleId: 'landlord' }); S.selProp[u.id] = d.listing; rerender(); },
    'portal-comps': function (d) { var l = D.listing(d.listing); if (!l) return; var comps = D.listings.filter(function (x) { return x.id !== l.id && x.operacion === 'venta' && x.currency === l.currency && (x.type === l.type || x.city === l.city); }).slice(0, 5); L.openDrawer('<div class="stack"><p class="small">' + aiTag('Comparables seleccionados por Llave') + '<br>Inmuebles similares publicados o vendidos recientemente. Tu inmueble aparece resaltado.</p><div class="table-wrap"><table class="table table-compact"><thead><tr><th>Inmueble</th><th class="num">Precio</th><th class="num">$/m²</th><th class="num">Días</th></tr></thead><tbody>' + join([l].concat(comps).map(function (x, i) { return '<tr' + (i === 0 ? ' style="background:var(--brand-soft);font-weight:600"' : '') + '><td>' + esc(x.title) + '<br><span class="xs muted">' + esc(x.barrio + ' · ' + x.city) + ' · ' + esc(D.fmtM2(x.area)) + '</span></td><td class="num">' + esc(money(x.price, x.currency)) + '</td><td class="num">' + esc(D.pricePerM2(x) ? money(D.pricePerM2(x), x.currency) : '—') + '</td><td class="num">' + esc(x.daysOnMarket) + '</td></tr>'; })) + '</tbody></table></div><p class="xs muted">Fuente: portales conectados (Finca Raíz, Metrocuadrado) y cierres de Dorum. Orientación, no avalúo.</p></div>', { title: 'Comparables · ' + l.title }); },
    'portal-visit-confirm': function (d) { var vs = S.visits[d.listing] || []; var v = vs.filter(function (x) { return x.id === d.visit; })[0]; if (v) v.confirmed = true; rerender(); toast('Visita confirmada', v ? v.who + ' · ' + fdate(v.at, 'long') + ' ' + v.time : '', 'success'); }
  };
  Object.keys(A).forEach(function (name) { L.action(name, A[name]); });

  // Exposed for the harness / debugging only.
  window.LLAVE_PORTALS = { state: S, modules: Object.keys(MODULES), widgets: Object.keys(W), actions: Object.keys(A), resolve: { seller: seller, buyer: buyer, landlord: landlord, renter: renter } };
})();
