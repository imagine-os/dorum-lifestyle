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
  // Language: EN is the source; ES copy comes from I18N.dict.site (assets/i18n.js). T(key, en) → current language.
  var isEs = function () { return !!(window.I18N && window.I18N.lang === 'es'); };
  var T = function (key, en) { return window.I18N ? window.I18N.t(key, en) : en; };
  var lp = function (en, es) { return isEs() && es != null ? es : en; };
  var AI = function () { return '<span class="mark-ai">' + icon('sparkle', 10) + ' ' + T('s.pipe.mark.ai', 'AI') + '</span>'; };
  var HU = function () { return '<span class="mark-human">' + icon('check', 10) + ' ' + T('s.pipe.mark.hu', 'Human check') + '</span>'; };

  /* ------------------------------------------------------------ pipeline */
  // Steps condensed from PLAN.md §5 (P1–P5). ai: what Llave does on its own; human: who approves what.
  var PIPE = [
    { id: 'ads', phase: 'P1 · Get listings', phaseEs: 'P1 · Captar inmuebles', name: 'Advertising', nameEs: 'Pauta', module: 'Advertising · CRM', moduleEs: 'Pauta · CRM',
      ai: ['Brand campaigns run on Meta, Google and Instagram', 'Leads land in CRM tagged with source and spend', 'Phone normalised, WhatsApp opt-in, property guessed from the address'],
      aiEs: ['Campañas de marca corriendo en Meta, Google e Instagram', 'Los leads caen al CRM etiquetados con fuente e inversión', 'Teléfono normalizado, opt-in de WhatsApp, inmueble inferido desde la dirección'],
      human: ['Advertiser approves creative variants and the budget cap'], humanEs: ['La pautadora aprueba las variantes de creativos y el tope de presupuesto'] },
    { id: 'site', phase: 'P1 · Get listings', phaseEs: 'P1 · Captar inmuebles', name: 'Website', nameEs: 'Sitio web', module: 'Website CMS', moduleEs: 'CMS del sitio',
      ai: ['Bilingual brand site and neighbourhood pages generated from the tenant profile', 'Lead forms and WhatsApp buttons wired straight into the CRM', 'SEO per zona: Guatapé, El Poblado, Llanogrande'],
      aiEs: ['Sitio de marca bilingüe y páginas por zona generadas desde el perfil del tenant', 'Formularios y botones de WhatsApp conectados directo al CRM', 'SEO por zona: Guatapé, El Poblado, Llanogrande'],
      human: ['Owner or sales admin approves page copy before it goes live'], humanEs: ['La dueña o la admin de ventas aprueba los textos antes de publicarlos'] },
    { id: 'crm-get', phase: 'P1 · Get listings', phaseEs: 'P1 · Captar inmuebles', name: 'Get-listings CRM', nameEs: 'CRM de captación', module: 'CRM · sellers & landlords', moduleEs: 'CRM · vendedores y arrendadores',
      ai: ['First-touch message drafted in the seller\'s tone', 'Calls transcribed and summarised into the lead', 'Comps and a suggested price prepared from portal data'],
      aiEs: ['Primer mensaje redactado en el tono del vendedor', 'Llamadas transcritas y resumidas en el lead', 'Comps y precio sugerido preparados con datos de portales'],
      human: ['Broker confirms the visita de captación', 'Broker approves the price before it is quoted'], humanEs: ['El asesor confirma la visita de captación', 'El asesor aprueba el precio antes de cotizarlo'] },
    { id: 'agreement', phase: 'P1 · Get listings', phaseEs: 'P1 · Captar inmuebles', name: 'Listing agreement', nameEs: 'Acuerdo de corretaje', module: 'Contracts', moduleEs: 'Contratos',
      ai: ['Acuerdo de corretaje (venta or arriendo) generated from the deal terms', 'Redlines tracked between versions, sent for e-signature', 'Signed → listing created in "en preparación", marketing project spawned'],
      aiEs: ['Acuerdo de corretaje (venta o arriendo) generado desde los términos del negocio', 'Redlines rastreados entre versiones, enviado a firma electrónica', 'Firmado → inmueble creado «en preparación», proyecto de mercadeo creado'],
      human: ['Owner signs for the agency', 'Lawyer approves if any clause was edited'], humanEs: ['La dueña firma por la agencia', 'El abogado aprueba si se editó alguna cláusula'] },
    { id: 'production', phase: 'P2 · Market listing', phaseEs: 'P2 · Mercadear', name: 'Production', nameEs: 'Producción', module: 'Projects · Media · Vendors', moduleEs: 'Proyectos · Fotos · Proveedores',
      ai: ['Orders created: photo + drone, write-up, comps, creatives, ad buying', 'Images tagged by room and quality, ordered for portals, watermarked; best 20 picked', 'Write-up in ES + EN and neighbourhood research drafted'],
      aiEs: ['Órdenes creadas: foto + dron, redacción, comps, creativos, compra de pauta', 'Fotos etiquetadas por espacio y calidad, ordenadas para portales, con marca de agua; se eligen las mejores 20', 'Redacción en ES + EN e investigación del barrio en borrador'],
      human: ['Vendors accept and deliver into the media inbox', 'Writer or broker approves the write-up and the photo selection'], humanEs: ['Los proveedores aceptan y entregan en la bandeja de fotos', 'El redactor o el asesor aprueba la redacción y la selección de fotos'] },
    { id: 'publish', phase: 'P2 · Market listing', phaseEs: 'P2 · Mercadear', name: 'Listing site & campaign', nameEs: 'Ficha y campaña', module: 'Publishing · Advertising', moduleEs: 'Publicación · Pauta',
      ai: ['Individual listing page generated; payload validated per portal', 'Campaign launched with budget cap and creative variants', 'Status → activo; views and leads sync back'],
      aiEs: ['Landing del inmueble generada; payload validado por portal', 'Campaña lanzada con tope de presupuesto y variantes de creativos', 'Estado → activo; vistas y leads se sincronizan de vuelta'],
      human: ['Broker or admin pushes to Finca Raíz, Wasi, Metrocuadrado', 'Instagram only if the listing is flagged for it'], humanEs: ['El asesor o la admin publica en Finca Raíz, Wasi, Metrocuadrado', 'Instagram solo si el inmueble está marcado para eso'] },
    { id: 'crm-sell', phase: 'P3 · Sell / rent', phaseEs: 'P3 · Vender / arrendar', name: 'Sell / Rent CRM', nameEs: 'CRM de venta / arriendo', module: 'CRM · buyers & renters', moduleEs: 'CRM · compradores y arrendatarios',
      ai: ['Portal and ad leads matched to listings by budget, zona and estrato', 'Qualifying questions sent via WhatsApp', 'Tour feedback captured by voice and summarised to the seller'],
      aiEs: ['Leads de portales y pauta cruzados con inmuebles por presupuesto, zona y estrato', 'Preguntas de calificación enviadas por WhatsApp', 'Feedback del recorrido capturado por voz y resumido al vendedor'],
      human: ['Broker schedules tours and open houses', 'Broker approves every outgoing reply'], humanEs: ['El asesor agenda recorridos y open houses', 'El asesor aprueba cada respuesta que sale'] },
    { id: 'lending', phase: 'P3 · Sell / rent', phaseEs: 'P3 · Vender / arrendar', name: 'Lending', nameEs: 'Crédito', module: 'Lender role · optional', moduleEs: 'Rol de crédito · opcional',
      ai: ['Buyer\'s budget and documents packaged for the lender', 'Pre-approval and mortgage milestones tracked on the deal'],
      aiEs: ['Presupuesto y documentos del comprador empaquetados para el banco', 'Pre-aprobación e hitos del crédito rastreados en el negocio'],
      human: ['Buyer opts in before any hand-off', 'Lender confirms the pre-approval'], humanEs: ['El comprador autoriza antes de cualquier entrega de datos', 'La asesora de crédito confirma la pre-aprobación'] },
    { id: 'offer', phase: 'P3 · Sell / rent', phaseEs: 'P3 · Vender / arrendar', name: 'Offer & counter-offer', nameEs: 'Oferta y contraoferta', module: 'Contracts · CRM', moduleEs: 'Contratos · CRM',
      ai: ['Offer received → status bajo oferta', 'Counter-offer drafted from comps and previous offers, with a visible diff'],
      aiEs: ['Oferta recibida → estado «bajo oferta»', 'Contraoferta redactada desde comps y ofertas anteriores, con diff visible'],
      human: ['Broker approves and sends the counter-offer', 'Seller accepts or declines from their home screen'], humanEs: ['El asesor aprueba y envía la contraoferta', 'El vendedor acepta o rechaza desde su pantalla de inicio'] },
    { id: 'paperwork', phase: 'P4 · Close', phaseEs: 'P4 · Cerrar', name: 'Paperwork', nameEs: 'Documentos', module: 'Paperwork · Contracts', moduleEs: 'Documentos · Contratos',
      ai: ['Promesa de compraventa generated from the agreed terms', 'Checklist opened for buyer and seller: cédula, tradición y libertad, paz y salvo, avalúo, predial', 'OCR checks names and expiry; reminders go to whoever owes a document'],
      aiEs: ['Promesa de compraventa generada desde los términos acordados', 'Checklist abierto para comprador y vendedor: cédula, tradición y libertad, paz y salvo, avalúo, predial', 'El OCR valida nombres y vigencias; los recordatorios van a quien debe el documento'],
      human: ['Lawyer approves the promesa', 'Each party uploads and signs'], humanEs: ['El abogado aprueba la promesa', 'Cada parte sube y firma'] },
    { id: 'close', phase: 'P4 · Close', phaseEs: 'P4 · Cerrar', name: 'Steps of the sale', nameEs: 'Pasos del cierre', module: 'Escrow · Payouts', moduleEs: 'Escrow · Pagos',
      ai: ['Arras received into escrow; ledger updated', 'At escritura the split engine computes every payout', 'Listing → vendido, portals unpublished, review request sent'],
      aiEs: ['Arras recibidas en escrow; libro actualizado', 'En la escritura el motor de reparto calcula cada pago', 'Inmueble → vendido, portales despublicados, solicitud de reseña enviada'],
      human: ['Accountant confirms escrow receipt and releases the batch', 'Owner co-approves releases over COP 50.000.000', 'Each step ticked: inspección, avalúo, crédito, notaría, registro, llaves'],
      humanEs: ['La contadora confirma el ingreso a escrow y libera el lote', 'La dueña co-aprueba liberaciones mayores a COP 50.000.000', 'Cada paso marcado: inspección, avalúo, crédito, notaría, registro, llaves'] },
    { id: 'rental', phase: 'P5 · Rental ops', phaseEs: 'P5 · Arriendos', name: 'Rental agreement & inventory', nameEs: 'Contrato de arriendo e inventario', module: 'Rental Ops · Contracts', moduleEs: 'Arriendos · Contratos',
      ai: ['Contrato de arrendamiento + inventario generated; afianzadora or codeudor attached', 'Monthly rent invoiced and collected; late fees by rule; IPC notices', 'Landlord statement and payout each month, admin fee retained'],
      aiEs: ['Contrato de arrendamiento + inventario generados; afianzadora o codeudor adjuntos', 'Canon facturado y recaudado cada mes; mora por regla; avisos de IPC', 'Extracto y liquidación al propietario cada mes, con el fee de administración retenido'],
      human: ['Lawyer approves the contract', 'Both parties sign the move-in inventory with photos', 'Rental admin dispatches maintenance vendors'], humanEs: ['El abogado aprueba el contrato', 'Ambas partes firman el inventario de entrada con fotos', 'La admin de arriendos despacha a los técnicos de mantenimiento'] }
  ];

  var pipeStep = 0;
  function renderPipeline() {
    var map = $('#pipeline-map'), detail = $('#pipeline-detail');
    if (!map || !detail) return;
    var html = '';
    PIPE.forEach(function (s, i) {
      html += '<div class="pipe-step">' +
        '<button class="pipe-chip" role="tab" id="pipe-tab-' + s.id + '" data-step="' + i + '" aria-selected="' + (i === pipeStep) + '" aria-controls="pipeline-detail">' +
          '<span class="pipe-phase">' + esc(lp(s.phase, s.phaseEs)) + '</span>' +
          '<span class="name">' + esc(lp(s.name, s.nameEs)) + '</span>' +
          '<span class="marks">' + AI() + (s.human.length ? HU() : '') + '</span>' +
        '</button>' +
        (i < PIPE.length - 1 ? '<svg class="pipe-connector" viewBox="0 0 34 14" aria-hidden="true"><path d="M1 7h26" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/><path d="M24 2l6 5-6 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '') +
      '</div>';
    });
    map.innerHTML = html;
    function show(i) {
      var s = PIPE[i]; pipeStep = i;
      map.querySelectorAll('.pipe-chip').forEach(function (b) { b.setAttribute('aria-selected', String(+b.dataset.step === i)); });
      detail.innerHTML =
        '<div class="pipe-what"><p class="eyebrow">' + esc(lp(s.phase, s.phaseEs)) + ' · ' + T('s.pipe.step', 'step') + ' ' + (i + 1) + ' ' + T('s.pipe.of', 'of') + ' ' + PIPE.length + '</p><h3>' + esc(lp(s.name, s.nameEs)) + '</h3><p class="pipe-module">' + T('s.pipe.module', 'Module:') + ' <b>' + esc(lp(s.module, s.moduleEs)) + '</b></p></div>' +
        '<div class="is-ai"><h4>' + AI() + ' ' + T('s.pipe.does', 'Llave does') + '</h4><ul>' + lp(s.ai, s.aiEs).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="is-human"><h4>' + HU() + ' ' + T('s.pipe.approves', 'A person approves') + '</h4><ul>' + lp(s.human, s.humanEs).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    if (map._bound) { show(pipeStep); return; }
    map._bound = true;
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
    show(pipeStep);
  }

  /* --------------------------------------------------------------- roles */
  var ROLE_TABS = [
    { id: 'owner', label: 'Owner', labelEs: 'Dueña', title: 'Sees the whole business, approves money and law.', titleEs: 'Ve todo el negocio, aprueba dinero y lo legal.', bullets: ['Pipeline value, escrow held, commissions projected and rent collected on one screen', 'Approval queue: AI drafts, contract edits, payout batches over the threshold', 'Team activity, campaign spend vs. leads, an AI digest of the week'],
      bulletsEs: ['Valor del pipeline, dinero en escrow, comisiones proyectadas y cánones recaudados en una pantalla', 'Cola de aprobación: borradores de IA, cambios en contratos, lotes de pago por encima del umbral', 'Actividad del equipo, inversión en pauta vs. leads, un resumen de IA de la semana'] },
    { id: 'broker', label: 'Broker · Realtor OS', labelEs: 'Asesor · Realtor OS', title: 'Wins listings, sells and rents them, mostly from the car.', titleEs: 'Capta inmuebles, los vende y los arrienda, casi siempre desde el carro.', bullets: ['Today\'s agenda, hot leads and AI follow-ups waiting for one-tap approval', 'My listings, my two pipelines, my commissions in escrow and projected', 'Voice quick actions: agenda visita, registra llamada, resumen de mi día'],
      bulletsEs: ['Agenda de hoy, leads calientes y seguimientos de IA esperando aprobación con un toque', 'Mis inmuebles, mis dos pipelines, mis comisiones en escrow y proyectadas', 'Acciones rápidas por voz: agenda visita, registra llamada, resumen de mi día'] },
    { id: 'sales_admin', label: 'Sales admin', labelEs: 'Admin de ventas', title: 'Coordinates the sale pipeline, vendors and paperwork.', titleEs: 'Coordina el pipeline de venta, los proveedores y los documentos.', bullets: ['Project board per listing with photo, write-up, comps and ad orders', 'Publishing queue with per-portal validation before the push', 'Paperwork status across every open deal, reminders already drafted'],
      bulletsEs: ['Tablero de proyecto por inmueble con órdenes de foto, redacción, comps y pauta', 'Cola de publicación con validación por portal antes de enviar', 'Estado de documentos en todos los negocios abiertos, recordatorios ya redactados'] },
    { id: 'rental_admin', label: 'Rental admin', labelEs: 'Admin de arriendos', title: 'Runs contracts, inventories and monthly collections.', titleEs: 'Maneja contratos, inventarios y el recaudo mensual.', bullets: ['Rent collection and arrears with a one-tap reminder', 'Maintenance tickets triaged by AI, vendor proposed, both parties notified', 'Leases expiring, IPC increases due, inventories pending signature'],
      bulletsEs: ['Recaudo y cartera con recordatorio de un toque', 'Tickets de mantenimiento clasificados por IA, técnico propuesto, ambas partes avisadas', 'Contratos por vencer, incrementos de IPC pendientes, inventarios por firmar'] },
    { id: 'accountant', label: 'Accountant', labelEs: 'Contadora', title: 'Escrow, payouts, payroll and DIAN.', titleEs: 'Escrow, pagos, nómina y DIAN.', bullets: ['Escrow balance by account, pending releases with the approval they need', 'Payout batches computed by the split engine, ready to send to the bank', 'Monthly payroll, commission statements per broker, DIAN e-invoicing status'],
      bulletsEs: ['Saldo de escrow por cuenta, liberaciones pendientes con la aprobación que necesitan', 'Lotes de pago calculados por el motor de reparto, listos para el banco', 'Nómina mensual, extractos de comisión por asesor, estado de facturación electrónica DIAN'] },
    { id: 'lawyer', label: 'Lawyer', labelEs: 'Abogado', title: 'Contracts, redlines and title review.', titleEs: 'Contratos, redlines y estudio de títulos.', bullets: ['Contracts awaiting review, AI-drafted clauses shown as diffs', 'Open redlines between parties with version history', 'Title checks (tradición y libertad) and signatures pending'],
      bulletsEs: ['Contratos por revisar, cláusulas redactadas por IA mostradas como diffs', 'Redlines abiertos entre las partes con historial de versiones', 'Estudio de títulos (tradición y libertad) y firmas pendientes'] },
    { id: 'vendors', label: 'Vendors', labelEs: 'Proveedores', roles: ['photographer', 'writer', 'advertiser', 'construction', 'lender'], title: 'Photographer, writer, advertiser, construction, lender — orders only.', titleEs: 'Fotógrafo, redactor, pautadora, constructor, crédito: solo sus órdenes.', bullets: ['Open orders with the listing, package and due date; accept from the phone', 'Upload inbox that lands directly in the listing\'s media library', 'My payouts: what is approved, in escrow and paid'],
      bulletsEs: ['Órdenes abiertas con inmueble, paquete y fecha; se aceptan desde el celular', 'Bandeja de subida que cae directo en la biblioteca de fotos del inmueble', 'Mis pagos: qué está aprobado, en escrow y pagado'] },
    { id: 'customers', label: 'Customers', labelEs: 'Clientes', roles: ['seller', 'buyer', 'landlord', 'renter'], title: 'Seller, buyer, landlord, renter — their deal, nothing else.', titleEs: 'Vendedor, comprador, arrendador, arrendatario: su negocio y nada más.', bullets: ['Seller: listing progress, visit feedback, offers to accept, documents to upload', 'Buyer: shortlist, next tour, offer status, lender pre-approval', 'Landlord and renter: rent status, receipts, maintenance, the lifestyle menu'],
      bulletsEs: ['Vendedor: avance del inmueble, feedback de visitas, ofertas por aceptar, documentos por subir', 'Comprador: favoritos, próximo recorrido, estado de la oferta, pre-aprobación del crédito', 'Arrendador y arrendatario: estado del canon, recibos, mantenimiento, el menú Lifestyle'] }
  ];
  var NAV_ES = { home: 'Inicio', listings: 'Inmuebles', 'crm-get': 'Captación', 'crm-sell': 'Ventas & arriendos', calendar: 'Agenda', projects: 'Proyectos', contracts: 'Contratos', paperwork: 'Documentos', media: 'Fotos & video', publishing: 'Publicación', ads: 'Pauta', money: 'Dinero', 'my-money': 'Mis pagos', payroll: 'Nómina', rentals: 'Arriendos', lifestyle: 'Lifestyle', reports: 'Reportes', website: 'Sitio web', settings: 'Configuración', orders: 'Órdenes', referrals: 'Referidos', 'my-listing': 'Mi inmueble', visits: 'Visitas', offers: 'Ofertas', documents: 'Documentos', messages: 'Mensajes', search: 'Buscar', shortlist: 'Favoritos', tours: 'Recorridos', 'my-property': 'Mi propiedad', statements: 'Extractos', maintenance: 'Mantenimiento', 'my-home': 'Mi hogar', payments: 'Pagos' };

  var rolesCurrent = { tab: ROLE_TABS[0], role: 'owner' };
  function renderRoles() {
    var tabs = $('#roles-tabs'), text = $('#roles-text'), frame = $('#roles-frame'), cap = $('#roles-caption'), open = $('#roles-open'), panel = $('#roles-panel');
    if (!tabs || !text) return;
    tabs.innerHTML = ROLE_TABS.map(function (t, i) { return '<button class="chip' + (t === rolesCurrent.tab ? ' is-active' : '') + '" role="tab" aria-selected="' + (t === rolesCurrent.tab) + '" data-tab="' + t.id + '">' + esc(lp(t.label, t.labelEs)) + '</button>'; }).join('');
    var current = rolesCurrent;
    function role(id) { return (D.role && D.role(id)) || { id: id, label: id, labelEs: '', navItems: [] }; }
    // In EN the role's Spanish name is shown as a sub-label (the app is ES-first); in ES we show the EN name.
    function rName(r) { return lp(r.label, r.labelEs || r.label); }
    function rAlt(r) { return lp(r.labelEs, r.label); }
    function show(tab, roleId) {
      current = rolesCurrent = { tab: tab, role: roleId };
      var r = role(roleId);
      tabs.querySelectorAll('.chip').forEach(function (c) { var on = c.dataset.tab === tab.id; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', String(on)); });
      var sub = tab.roles ? '<div class="roles-sub">' + tab.roles.map(function (id) { var rr = role(id); return '<button class="chip' + (id === roleId ? ' is-active' : '') + '" data-role="' + id + '">' + esc(rName(rr)) + '</button>'; }).join('') + '</div>' : '';
      text.innerHTML =
        '<p class="eyebrow">' + esc(lp(tab.label, tab.labelEs)) + (tab.roles ? ' · ' + esc(rName(r)) : '') + '</p>' +
        '<h3>' + esc(lp(tab.title, tab.titleEs)) + (rAlt(r) ? '<span class="es">' + esc(rAlt(r)) + '</span>' : '') + '</h3>' +
        sub +
        '<ul class="roles-bullets">' + lp(tab.bullets, tab.bulletsEs).map(function (b) { return '<li>' + icon('check-circle', 20) + '<span>' + esc(b) + '</span></li>'; }).join('') + '</ul>' +
        '<div><p class="eyebrow" style="margin-bottom:var(--s-2)">' + T('s.roles.navfor', 'Navigation for') + ' ' + esc(rName(r)) + '</p><div class="roles-nav">' + (r.navItems || []).map(function (n) { return '<span>' + esc(NAV_ES[n] || n) + '</span>'; }).join('') + '</div></div>';
      var route = 'app/index.html?mode=phone#/role/' + roleId + '/home';
      if (frame && frame.getAttribute('src') !== route) frame.setAttribute('src', route);
      if (cap) cap.textContent = rName(r) + ' · ' + T('s.roles.phone', 'phone');
      if (open) open.setAttribute('href', 'app/index.html#/role/' + roleId + '/home');
    }
    if (tabs._bound) { show(current.tab, current.role); return; }
    tabs._bound = true;
    tabs.addEventListener('click', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      var t = ROLE_TABS.filter(function (x) { return x.id === c.dataset.tab; })[0];
      show(t, t.roles ? t.roles[0] : t.id);
    });
    text.addEventListener('click', function (e) {
      var c = e.target.closest('[data-role]'); if (!c) return;
      show(current.tab, c.dataset.role);
    });
    show(current.tab, current.role);
  }

  /* --------------------------------------------------------------- money */
  function renderSplit() {
    var card = $('#split-card'); if (!card || !D.deals || !D.computeSplit) return;
    var deal = D.deals[0]; var res = D.computeSplit(deal);
    var listing = D.listing ? D.listing(deal.listingId) : null;
    var price = deal.agreedPrice || deal.offerPrice || deal.askingPrice;
    var colors = { commission: 'var(--brand)', referral: 'var(--accent)', fee: 'var(--brand-3)', salary: 'var(--ai)' };
    var stageLabel = { 'at-close': T('s.split.atclose', 'at close'), 'at-listing': T('s.split.atlisting', 'at listing'), monthly: T('s.split.monthly', 'monthly') };
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
      if (w > 60) bars += '<text x="' + (x + 10).toFixed(1) + '" y="27" font-size="13" font-weight="600" font-family="Inter, sans-serif" fill="var(--brand-ink)">' + esc(r.pct != null ? r.pct + ' %' : T('s.split.fee', 'fee')) + '</text>';
      x += w + gap;
    });
    var svg = '<svg class="split-bar" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + T('s.split.aria', 'Payout split for') + ' ' + esc(deal.title) + '">' + bars + '</svg>';
    card.innerHTML =
      '<div class="split-head"><div><p class="eyebrow">' + T('s.split.live', 'Live from the demo ledger') + ' · ' + esc(deal.id) + '</p><h3 style="font-size:var(--fs-lg);font-weight:600;margin-top:var(--s-1)">' + esc(listing ? (D.tx ? D.tx(listing, 'title') : listing.title) : deal.title) + '</h3><p class="small muted">' + T('s.split.offer', 'Offer') + ' ' + esc(D.fmtCOP(price)) + ' · ' + T('s.split.commission', 'commission') + ' ' + esc(deal.commissionPct) + ' % · ' + esc(listing && listing.barrio ? listing.barrio + ', ' : '') + esc(listing && listing.city ? listing.city : 'Guatapé') + '</p></div>' +
      '<div class="stat" style="text-align:right"><span class="stat-label">' + T('s.split.gross', 'Gross commission') + '</span><span class="stat-value display money">' + esc(D.fmtCOP(res.gross, { compact: true })) + '</span></div></div>' +
      svg +
      '<div class="split-rows">' +
        rows.map(function (r) { return '<div class="split-row"><i style="--k:' + r.color + '"></i><div class="who"><span>' + esc(r.name) + '</span><small>' + esc(r.note || r.kind) + '</small></div><span class="stage">' + esc(stageLabel[r.stage] || r.stage) + '</span><span class="amt money">' + esc(D.fmtCOP(r.amount)) + '</span></div>'; }).join('') +
        '<div class="split-row is-total"><i style="--k:transparent"></i><div class="who"><span>' + T('s.split.total', 'Total distributed') + '</span><small>' + rows.filter(function (r) { return r.stage === 'at-listing'; }).length + ' ' + T('s.split.rulesListing', 'rules at listing') + ' · ' + rows.filter(function (r) { return r.stage === 'at-close'; }).length + ' ' + T('s.split.rulesClose', 'rules at close') + '</small></div><span class="stage">' + T('s.split.batch', 'escrow → batch') + '</span><span class="amt money">' + esc(D.fmtCOP(total)) + '</span></div>' +
      '</div>' +
      '<p class="xs muted">' + T('s.split.computed', 'Computed by') + ' <code>DORUM.computeSplit</code> ' + T('s.split.from', 'from the deal\'s split rules. Escrow expected:') + ' ' + esc(D.fmtCOP(deal.escrow && deal.escrow.expected)) + ' (' + esc(deal.escrow && deal.escrow.note) + ').</p>';
  }

  /* --------------------------------------------------------------- voice */
  function renderVoice() {
    var chat = $('#voice-chat'), strip = $('#voice-intents'); if (!chat || !D.voiceIntents) return;
    var pick = ['schedule_visit', 'log_call', 'price_update', 'send_followup', 'approve_ai_draft', 'rent_status'];
    var items = pick.map(function (id) { return D.voiceIntents.filter(function (v) { return v.intent === id; })[0]; }).filter(Boolean);
    chat.innerHTML = items.map(function (v) {
      var r = D.role ? D.role(v.role) : null;
      var say = isEs() ? v.say : (v.sayEn || v.say), does = isEs() ? v.does : (v.doesEn || v.does);
      return '<div class="voice-turn is-user"><div class="bubble say">“' + esc(say) + '”</div><span class="voice-role">' + esc(r ? lp(r.label, r.labelEs) : v.role) + ' · ' + T('s.voice.note', 'voice note') + '</span></div>' +
        '<div class="voice-turn"><div class="bubble does"><div class="who"><i></i> Llave</div>' + esc(does) + (v.confirm ? '<br><span class="confirm">' + icon('lock', 11) + ' ' + T('s.voice.waits', 'Waits for “confirmar”') + '</span>' : '') + '</div></div>';
    }).join('');
    if (strip) strip.innerHTML = '<span style="font-family:var(--font-ui);font-weight:600">' + T('s.voice.all', 'All intents') + '</span>' + D.voiceIntents.map(function (v) { return '<span>' + esc(v.intent) + '</span>'; }).join('');
    var orb = $('#voice-orb');
    if (orb && !orb._bound) { orb._bound = true; orb.addEventListener('click', function () { orb.classList.toggle('is-listening'); orb.setAttribute('aria-pressed', orb.classList.contains('is-listening')); }); }
  }

  /* ----------------------------------------------------------- lifestyle */
  function renderLifestyle() {
    var grid = $('#lifestyle-grid'); if (!grid || !D.lifestyle) return;
    grid.innerHTML = D.lifestyle.map(function (s) {
      var pill = s.status === 'pilot' ? '<span class="pill pill-success">' + T('s.ls.pilot', 'Pilot') + '</span>' : '<span class="pill pill-accent">' + T('s.ls.soon', 'Coming soon') + '</span>';
      return '<article class="ls-card"><span class="ls-icon" aria-hidden="true">' + esc(s.icon) + '</span><b>' + esc(lp(s.name, s.nameEs)) + '</b><p>' + esc(lp(s.descEn || s.desc, s.desc)) + '</p>' + pill + '</article>';
    }).join('');
  }

  /* -------------------------------------------------------------- tenant */
  function renderTenant() {
    var t = D.tenant; if (!t) return;
    var n = $('#tenant-name'), m = $('#tenant-meta'), p = $('#tenant-pos'), s = $('#tenant-stats');
    if (n) n.textContent = t.name;
    if (m) m.textContent = (t.offices || []).map(function (o) { return o.city; }).join(' · ');
    if (p) p.textContent = lp(t.positioning, t.positioningEs);
    if (s) s.innerHTML =
      '<div><b>' + (D.listings ? D.listings.length : '—') + '</b><span>' + T('s.ten.stat.listings', 'listings') + '</span></div>' +
      '<div><b>' + (D.users ? D.users.filter(function (u) { return u.roleGroup === 'staff'; }).length : '—') + '</b><span>' + T('s.ten.staff', 'staff') + '</span></div>' +
      '<div><b>' + ((t.offices || []).length) + '</b><span>' + T('s.ten.stat.offices', 'offices') + '</span></div>';
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
  function renderAll() { renderPipeline(); renderRoles(); renderSplit(); renderVoice(); renderLifestyle(); renderTenant(); }
  function boot() {
    renderAll(); chrome();
    if (window.I18N) window.I18N.onChange(function () { renderAll(); if (D.fitDevices) D.fitDevices(); });
    if (D.fitDevices) D.fitDevices();
    // Re-fit once fonts settle and after layout-changing renders.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (D.fitDevices) D.fitDevices(); });
    window.addEventListener('load', function () { if (D.fitDevices) D.fitDevices(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
