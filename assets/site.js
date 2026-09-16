/* ==========================================================================
   Llave OS · sales site behaviour (index.html)
   Plain script. Reads window.DORUM. No build step.
   ========================================================================== */
(function () {
  'use strict';
  var D = window.DORUM || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var icon = function (id, size) { size = size || 12; return '<svg width="' + size + '" height="' + size + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
  var AI = '<span class="mark-ai">' + icon('sparkle', 10) + ' AI</span>';
  var HU = '<span class="mark-human">' + icon('check', 10) + ' Human check</span>';

  /* ------------------------------------------------------------ pipeline */
  // Steps condensed from PLAN.md §5 (P1–P5). ai: what Llave does on its own; human: who approves what.
  var PIPE = [
    { id: 'ads', phase: 'P1 · Get listings', name: 'Advertising', module: 'Advertising · CRM',
      ai: ['Brand campaigns run on Meta, Google and Instagram', 'Leads land in CRM tagged with source and spend', 'Phone normalised, WhatsApp opt-in, property guessed from the address'],
      human: ['Advertiser approves creative variants and the budget cap'] },
    { id: 'site', phase: 'P1 · Get listings', name: 'Website', module: 'Website CMS',
      ai: ['Bilingual brand site and neighbourhood pages generated from the tenant profile', 'Lead forms and WhatsApp buttons wired straight into the CRM', 'SEO per zona: Guatapé, El Poblado, Llanogrande'],
      human: ['Owner or sales admin approves page copy before it goes live'] },
    { id: 'crm-get', phase: 'P1 · Get listings', name: 'Get-listings CRM', module: 'CRM · sellers & landlords',
      ai: ['First-touch message drafted in the seller\'s tone', 'Calls transcribed and summarised into the lead', 'Comps and a suggested price prepared from portal data'],
      human: ['Broker confirms the visita de captación', 'Broker approves the price before it is quoted'] },
    { id: 'agreement', phase: 'P1 · Get listings', name: 'Listing agreement', module: 'Contracts',
      ai: ['Acuerdo de corretaje (venta or arriendo) generated from the deal terms', 'Redlines tracked between versions, sent for e-signature', 'Signed → listing created in "en preparación", marketing project spawned'],
      human: ['Owner signs for the agency', 'Lawyer approves if any clause was edited'] },
    { id: 'production', phase: 'P2 · Market listing', name: 'Production', module: 'Projects · Media · Vendors',
      ai: ['Orders created: photo + drone, write-up, comps, creatives, ad buying', 'Images tagged by room and quality, ordered for portals, watermarked; best 20 picked', 'Write-up in ES + EN and neighbourhood research drafted'],
      human: ['Vendors accept and deliver into the media inbox', 'Writer or broker approves the write-up and the photo selection'] },
    { id: 'publish', phase: 'P2 · Market listing', name: 'Listing site & campaign', module: 'Publishing · Advertising',
      ai: ['Individual listing page generated; payload validated per portal', 'Campaign launched with budget cap and creative variants', 'Status → activo; views and leads sync back'],
      human: ['Broker or admin pushes to Finca Raíz, Wasi, Metrocuadrado', 'Instagram only if the listing is flagged for it'] },
    { id: 'crm-sell', phase: 'P3 · Sell / rent', name: 'Sell / Rent CRM', module: 'CRM · buyers & renters',
      ai: ['Portal and ad leads matched to listings by budget, zona and estrato', 'Qualifying questions sent via WhatsApp', 'Tour feedback captured by voice and summarised to the seller'],
      human: ['Broker schedules tours and open houses', 'Broker approves every outgoing reply'] },
    { id: 'lending', phase: 'P3 · Sell / rent', name: 'Lending', module: 'Lender role · optional',
      ai: ['Buyer\'s budget and documents packaged for the lender', 'Pre-approval and mortgage milestones tracked on the deal'],
      human: ['Buyer opts in before any hand-off', 'Lender confirms the pre-approval'] },
    { id: 'offer', phase: 'P3 · Sell / rent', name: 'Offer & counter-offer', module: 'Contracts · CRM',
      ai: ['Offer received → status bajo oferta', 'Counter-offer drafted from comps and previous offers, with a visible diff'],
      human: ['Broker approves and sends the counter-offer', 'Seller accepts or declines from their home screen'] },
    { id: 'paperwork', phase: 'P4 · Close', name: 'Paperwork', module: 'Paperwork · Contracts',
      ai: ['Promesa de compraventa generated from the agreed terms', 'Checklist opened for buyer and seller: cédula, tradición y libertad, paz y salvo, avalúo, predial', 'OCR checks names and expiry; reminders go to whoever owes a document'],
      human: ['Lawyer approves the promesa', 'Each party uploads and signs'] },
    { id: 'close', phase: 'P4 · Close', name: 'Steps of the sale', module: 'Escrow · Payouts',
      ai: ['Arras received into escrow; ledger updated', 'At escritura the split engine computes every payout', 'Listing → vendido, portals unpublished, review request sent'],
      human: ['Accountant confirms escrow receipt and releases the batch', 'Owner co-approves releases over COP 50.000.000', 'Each step ticked: inspección, avalúo, crédito, notaría, registro, llaves'] },
    { id: 'rental', phase: 'P5 · Rental ops', name: 'Rental agreement & inventory', module: 'Rental Ops · Contracts',
      ai: ['Contrato de arrendamiento + inventario generated; afianzadora or codeudor attached', 'Monthly rent invoiced and collected; late fees by rule; IPC notices', 'Landlord statement and payout each month, admin fee retained'],
      human: ['Lawyer approves the contract', 'Both parties sign the move-in inventory with photos', 'Rental admin dispatches maintenance vendors'] }
  ];

  function renderPipeline() {
    var map = $('#pipeline-map'), detail = $('#pipeline-detail');
    if (!map || !detail) return;
    var html = '';
    PIPE.forEach(function (s, i) {
      html += '<div class="pipe-step">' +
        '<button class="pipe-chip" role="tab" id="pipe-tab-' + s.id + '" data-step="' + i + '" aria-selected="' + (i === 0) + '" aria-controls="pipeline-detail">' +
          '<span class="pipe-phase">' + esc(s.phase) + '</span>' +
          '<span class="name">' + esc(s.name) + '</span>' +
          '<span class="marks">' + AI + (s.human.length ? HU : '') + '</span>' +
        '</button>' +
        (i < PIPE.length - 1 ? '<svg class="pipe-connector" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 7h26" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/><path d="M24 2l6 5-6 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
      '</div>';
    });
    map.innerHTML = html;
    function show(i) {
      var s = PIPE[i];
      map.querySelectorAll('.pipe-chip').forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.step === i)); });
      detail.innerHTML =
        '<div class="pipe-what"><p class="eyebrow">' + esc(s.phase) + ' · step ' + (i + 1) + ' of ' + PIPE.length + '</p><h3>' + esc(s.name) + '</h3><p class="pipe-module">Module: <b>' + esc(s.module) + '</b></p></div>' +
        '<div class="is-ai"><h4>' + AI + ' Llave does</h4><ul>' + s.ai.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="is-human"><h4>' + HU + ' A person approves</h4><ul>' + s.human.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    map.addEventListener('click', function (e) {
      var b = e.target.closest('.pipe-chip'); if (!b) return;
      show(+b.dataset.step);
      if (window.matchMedia('(min-width: 721px)').matches) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });
    map.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var cur = map.querySelector('.pipe-chip[aria-selected="true"]'); var i = +cur.dataset.step;
      i = (i + (e.key === 'ArrowRight' ? 1 : -1) + PIPE.length) % PIPE.length;
      var nb = map.querySelector('[data-step="' + i + '"]'); nb.focus(); show(i); e.preventDefault();
    });
    show(0);
  }

  /* --------------------------------------------------------------- roles */
  var ROLE_TABS = [
    { id: 'owner', label: 'Owner', title: 'Sees the whole business, approves money and law.', bullets: ['Pipeline value, escrow held, commissions projected and rent collected on one screen', 'Approval queue: AI drafts, contract edits, payout batches over the threshold', 'Team activity, campaign spend vs. leads, an AI digest of the week'] },
    { id: 'broker', label: 'Broker · Realtor OS', title: 'Wins listings, sells and rents them, mostly from the car.', bullets: ['Today\'s agenda, hot leads and AI follow-ups waiting for one-tap approval', 'My listings, my two pipelines, my commissions in escrow and projected', 'Voice quick actions: agenda visita, registra llamada, resumen de mi día'] },
    { id: 'sales_admin', label: 'Sales admin', title: 'Coordinates the sale pipeline, vendors and paperwork.', bullets: ['Project board per listing with photo, write-up, comps and ad orders', 'Publishing queue with per-portal validation before the push', 'Paperwork status across every open deal, reminders already drafted'] },
    { id: 'rental_admin', label: 'Rental admin', title: 'Runs contracts, inventories and monthly collections.', bullets: ['Rent collection and arrears with a one-tap reminder', 'Maintenance tickets triaged by AI, vendor proposed, both parties notified', 'Leases expiring, IPC increases due, inventories pending signature'] },
    { id: 'accountant', label: 'Accountant', title: 'Escrow, payouts, payroll and DIAN.', bullets: ['Escrow balance by account, pending releases with the approval they need', 'Payout batches computed by the split engine, ready to send to the bank', 'Monthly payroll, commission statements per broker, DIAN e-invoicing status'] },
    { id: 'lawyer', label: 'Lawyer', title: 'Contracts, redlines and title review.', bullets: ['Contracts awaiting review, AI-drafted clauses shown as diffs', 'Open redlines between parties with version history', 'Title checks (tradición y libertad) and signatures pending'] },
    { id: 'vendors', label: 'Vendors', roles: ['photographer', 'writer', 'advertiser', 'construction', 'lender'], title: 'Photographer, writer, advertiser, construction, lender — orders only.', bullets: ['Open orders with the listing, package and due date; accept from the phone', 'Upload inbox that lands directly in the listing\'s media library', 'My payouts: what is approved, in escrow and paid'] },
    { id: 'customers', label: 'Customers', roles: ['seller', 'buyer', 'landlord', 'renter'], title: 'Seller, buyer, landlord, renter — their deal, nothing else.', bullets: ['Seller: listing progress, visit feedback, offers to accept, documents to upload', 'Buyer: shortlist, next tour, offer status, lender pre-approval', 'Landlord and renter: rent status, receipts, maintenance, the lifestyle menu'] }
  ];
  var NAV_ES = { home: 'Inicio', listings: 'Inmuebles', 'crm-get': 'Captación', 'crm-sell': 'Ventas & arriendos', calendar: 'Agenda', projects: 'Proyectos', contracts: 'Contratos', paperwork: 'Documentos', media: 'Fotos & video', publishing: 'Publicación', ads: 'Pauta', money: 'Dinero', 'my-money': 'Mis pagos', payroll: 'Nómina', rentals: 'Arriendos', lifestyle: 'Lifestyle', reports: 'Reportes', website: 'Sitio web', settings: 'Configuración', orders: 'Órdenes', referrals: 'Referidos', 'my-listing': 'Mi inmueble', visits: 'Visitas', offers: 'Ofertas', documents: 'Documentos', messages: 'Mensajes', search: 'Buscar', shortlist: 'Favoritos', tours: 'Recorridos', 'my-property': 'Mi propiedad', statements: 'Extractos', maintenance: 'Mantenimiento', 'my-home': 'Mi hogar', payments: 'Pagos' };

  function renderRoles() {
    var tabs = $('#roles-tabs'), text = $('#roles-text'), frame = $('#roles-frame'), cap = $('#roles-caption'), open = $('#roles-open'), panel = $('#roles-panel');
    if (!tabs || !text) return;
    tabs.innerHTML = ROLE_TABS.map(function (t, i) { return '<button class="chip' + (i === 0 ? ' is-active' : '') + '" role="tab" aria-selected="' + (i === 0) + '" data-tab="' + t.id + '">' + esc(t.label) + '</button>'; }).join('');
    var current = { tab: ROLE_TABS[0], role: 'owner' };
    function role(id) { return (D.role && D.role(id)) || { id: id, label: id, labelEs: '', navItems: [] }; }
    function show(tab, roleId) {
      current = { tab: tab, role: roleId };
      var r = role(roleId);
      tabs.querySelectorAll('.chip').forEach(function (c) { var on = c.dataset.tab === tab.id; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', String(on)); });
      var sub = tab.roles ? '<div class="roles-sub">' + tab.roles.map(function (id) { var rr = role(id); return '<button class="chip' + (id === roleId ? ' is-active' : '') + '" data-role="' + id + '">' + esc(rr.label) + '</button>'; }).join('') + '</div>' : '';
      text.innerHTML =
        '<p class="eyebrow">' + esc(tab.label) + (tab.roles ? ' · ' + esc(r.label) : '') + '</p>' +
        '<h3>' + esc(tab.title) + (r.labelEs ? '<span class="es">' + esc(r.labelEs) + '</span>' : '') + '</h3>' +
        sub +
        '<ul class="roles-bullets">' + tab.bullets.map(function (b) { return '<li>' + icon('check-circle', 20) + '<span>' + esc(b) + '</span></li>'; }).join('') + '</ul>' +
        '<div><p class="eyebrow" style="margin-bottom:var(--s-2)">Navigation for ' + esc(r.label) + '</p><div class="roles-nav">' + (r.navItems || []).map(function (n) { return '<span>' + esc(NAV_ES[n] || n) + '</span>'; }).join('') + '</div></div>';
      var route = 'app/index.html?mode=phone#/role/' + roleId + '/home';
      if (frame && frame.getAttribute('src') !== route) frame.setAttribute('src', route);
      if (cap) cap.textContent = r.label + ' · phone';
      if (open) open.setAttribute('href', 'app/index.html#/role/' + roleId + '/home');
    }
    tabs.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      var t = ROLE_TABS.filter(function (x) { return x.id === c.dataset.tab; })[0];
      show(t, t.roles ? t.roles[0] : t.id);
    });
    text.addEventListener('click', function (e) {
      var c = e.target.closest('[data-role]'); if (!c) return;
      show(current.tab, c.dataset.role);
    });
    show(ROLE_TABS[0], 'owner');
  }

  /* --------------------------------------------------------------- money */
  function renderSplit() {
    var card = $('#split-card'); if (!card || !D.deals || !D.computeSplit) return;
    var deal = D.deals[0]; var res = D.computeSplit(deal);
    var listing = D.listing ? D.listing(deal.listingId) : null;
    var price = deal.agreedPrice || deal.offerPrice || deal.askingPrice;
    var colors = { commission: 'var(--brand)', referral: 'var(--accent)', fee: 'var(--brand-3)', salary: 'var(--ai)' };
    var stageLabel = { 'at-close': 'at close', 'at-listing': 'at listing', monthly: 'monthly' };
    var rows = res.rows.slice();
    // Distinct tints for commission participants so the bar reads as parts.
    var commTints = ['var(--brand)', 'var(--brand-2)', 'color-mix(in srgb, var(--brand-2) 60%, var(--brand-soft))'];
    var ci = 0;
    rows.forEach(function (r) { r.color = r.kind === 'commission' ? commTints[ci++ % commTints.length] : colors[r.kind] || 'var(--text-3)'; });
    var total = rows.reduce(function (a, r) { return a + r.amount; }, 0);
    // stacked bar: 600 wide, gaps 3px
    var W = 600, H = 44, gap = 3, x = 0, bars = '';
    rows.forEach(function (r) {
      var w = Math.max(6, (r.amount / total) * (W - gap * (rows.length - 1)));
      bars += '<rect x="' + x.toFixed(1) + '" y="0" width="' + w.toFixed(1) + '" height="' + H + '" rx="6" fill="' + r.color + '"/>';
      if (w > 60) bars += '<text x="' + (x + 10).toFixed(1) + '" y="27" font-size="13" font-weight="600" font-family="Inter, sans-serif" fill="var(--brand-ink)">' + esc(r.pct != null ? r.pct + ' %' : 'fee') + '</text>';
      x += w + gap;
    });
    var svg = '<svg class="split-bar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Payout split for ' + esc(deal.title) + '">' + bars + '</svg>';
    card.innerHTML =
      '<div class="split-head"><div><p class="eyebrow">Live from the demo ledger · ' + esc(deal.id) + '</p><h3 style="font-size:var(--fs-lg);font-weight:600;margin-top:var(--s-1)">' + esc(listing ? listing.title : deal.title) + '</h3><p class="small muted">Offer ' + esc(D.fmtCOP(price)) + ' · commission ' + esc(deal.commissionPct) + ' % · ' + esc(listing && listing.barrio ? listing.barrio + ', ' : '') + esc(listing && listing.city ? listing.city : 'Guatapé') + '</p></div>' +
      '<div class="stat" style="text-align:right"><span class="stat-label">Gross commission</span><span class="stat-value display money">' + esc(D.fmtCOP(res.gross, { compact: true })) + '</span></div></div>' +
      svg +
      '<div class="split-rows">' +
        rows.map(function (r) { return '<div class="split-row"><i style="--k:' + r.color + '"></i><div class="who"><span>' + esc(r.name) + '</span><small>' + esc(r.note || r.kind) + '</small></div><span class="stage">' + esc(stageLabel[r.stage] || r.stage) + '</span><span class="amt money">' + esc(D.fmtCOP(r.amount)) + '</span></div>'; }).join('') +
        '<div class="split-row is-total"><i style="--k:transparent"></i><div class="who"><span>Total distributed</span><small>' + rows.filter(function (r) { return r.stage === 'at-listing'; }).length + ' rules at listing · ' + rows.filter(function (r) { return r.stage === 'at-close'; }).length + ' rules at close</small></div><span class="stage">escrow → batch</span><span class="amt money">' + esc(D.fmtCOP(total)) + '</span></div>' +
      '</div>' +
      '<p class="xs muted">Computed by <code>DORUM.computeSplit</code> from the deal\'s split rules. Escrow expected: ' + esc(D.fmtCOP(deal.escrow && deal.escrow.expected)) + ' (' + esc(deal.escrow && deal.escrow.note) + ').</p>';
  }

  /* --------------------------------------------------------------- voice */
  function renderVoice() {
    var chat = $('#voice-chat'), strip = $('#voice-intents'); if (!chat || !D.voiceIntents) return;
    var pick = ['schedule_visit', 'log_call', 'price_update', 'send_followup', 'approve_ai_draft', 'rent_status'];
    var items = pick.map(function (id) { return D.voiceIntents.filter(function (v) { return v.intent === id; })[0]; }).filter(Boolean);
    chat.innerHTML = items.map(function (v) {
      var r = D.role ? D.role(v.role) : null;
      return '<div class="voice-turn is-user"><div class="bubble say">“' + esc(v.say) + '”</div><span class="voice-role">' + esc(r ? r.label : v.role) + ' · voice note</span></div>' +
        '<div class="voice-turn"><div class="bubble does"><div class="who"><i></i> Llave</div>' + esc(v.does) + (v.confirm ? '<br><span class="confirm">' + icon('lock', 11) + ' Waits for “confirmar”</span>' : '') + '</div></div>';
    }).join('');
    if (strip) strip.innerHTML = '<span style="font-family:var(--font-ui);font-weight:600">All intents</span>' + D.voiceIntents.map(function (v) { return '<span>' + esc(v.intent) + '</span>'; }).join('');
    var orb = $('#voice-orb');
    if (orb) orb.addEventListener('click', function () { orb.classList.toggle('is-listening'); orb.setAttribute('aria-pressed', orb.classList.contains('is-listening')); });
  }

  /* ----------------------------------------------------------- lifestyle */
  function renderLifestyle() {
    var grid = $('#lifestyle-grid'); if (!grid || !D.lifestyle) return;
    grid.innerHTML = D.lifestyle.map(function (s) {
      var pill = s.status === 'pilot' ? '<span class="pill pill-success">Pilot</span>' : '<span class="pill pill-accent">Coming soon</span>';
      return '<article class="ls-card"><span class="ls-icon" aria-hidden="true">' + esc(s.icon) + '</span><b>' + esc(s.name) + '</b><p>' + esc(s.desc) + '</p>' + pill + '</article>';
    }).join('');
  }

  /* -------------------------------------------------------------- tenant */
  function renderTenant() {
    var t = D.tenant; if (!t) return;
    var n = $('#tenant-name'), m = $('#tenant-meta'), p = $('#tenant-pos'), s = $('#tenant-stats');
    if (n) n.textContent = t.name;
    if (m) m.textContent = (t.offices || []).map(function (o) { return o.city; }).join(' · ');
    if (p) p.textContent = t.positioning;
    if (s) s.innerHTML =
      '<div><b>' + (D.listings ? D.listings.length : '—') + '</b><span>listings</span></div>' +
      '<div><b>' + (D.users ? D.users.filter(function (u) { return u.roleGroup === 'staff'; }).length : '—') + '</b><span>staff</span></div>' +
      '<div><b>' + ((t.offices || []).length) + '</b><span>offices</span></div>';
  }

  /* ------------------------------------------------------------- chrome */
  function chrome() {
    var header = $('#siteHeader'), nav = $('#siteNav'), pill = $('#demoPill');
    var onScroll = function () {
      var y = window.scrollY || 0;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (pill) pill.classList.toggle('is-visible', y > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) { nav.classList.remove('is-open'); var b = $('#navBtn'); if (b) b.setAttribute('aria-expanded', 'false'); } });

    // Reveal on scroll (respects reduced motion via CSS; here we only add the class)
    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      els.forEach(function (el) { io.observe(el); });
      // anything already in view at load
      setTimeout(function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('is-in'); }); }, 60);
    } else {
      els.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------------------------------------------------------------- boot */
  function boot() {
    renderPipeline(); renderRoles(); renderSplit(); renderVoice(); renderLifestyle(); renderTenant(); chrome();
    if (D.fitDevices) D.fitDevices();
    // Re-fit once fonts settle and after layout-changing renders.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (D.fitDevices) D.fitDevices(); });
    window.addEventListener('load', function () { if (D.fitDevices) D.fitDevices(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
