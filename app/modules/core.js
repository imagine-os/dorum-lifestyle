/* ==========================================================================
   Llave OS · core modules & widgets
   Modules: settings, website, reports, calendar, messages
   Widgets: kpi-revenue, kpi-pipeline, approvals-queue, listings-map,
            team-activity, ai-digest, today-agenda, voice-quick, tasks-due
   Registers against window.LLAVE (see app.js).
   ========================================================================== */
(function () {
  'use strict';
  var L = window.LLAVE, D = window.DORUM;
  if (!L || !D) return;
  var esc = L.esc, icon = L.icon, U = L.util;
  var st = { settingsTab: 'perfil', sitePage: 'inicio', calView: 'month', thread: null, msgFilter: 'all', showConvo: false };
  function sum(arr, f) { return arr.reduce(function (a, x) { return a + (f ? f(x) : x); }, 0); }
  function header(title, sub, actions) {
    return '<div class="page-header"><div><h1>' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>' + (actions ? '<div class="page-actions">' + actions + '</div>' : '') + '</div>';
  }
  function badgeAI() { return '<span class="badge badge-ai">AI · revisar</span>'; }

  /* ======================================================================
     SETTINGS
     ====================================================================== */
  var PERM_MODULES = [
    ['Inicio', 'FEEEEEEEEEEVVVV'], ['Sitio web (CMS)', 'FNEENNNEENNNNNN'], ['Inmuebles', 'FEFFVVVVVVVVVVV'], ['Fotos & video', 'FEFFNNEVVENVVVV'],
    ['Publicación', 'FEFFNNNENNNVNVN'], ['Captación (CRM)', 'FEFFNNNNNNNNNNN'], ['Ventas & arriendos (CRM)', 'FEFFNNNNNNVNNNN'], ['Agenda', 'FEFFVVENNEEEEEE'],
    ['Proyectos & tareas', 'FEFFEEEEEEEVVVV'], ['Contratos', 'FEEEVFNNNNVVVVV'], ['Documentos', 'FEFFVFNNNNEEEEE'], ['Pauta', 'FVEEVNNFNNNVNVN'],
    ['Escrow & pagos', 'FVVVFVVVVVVVVVV'], ['Nómina', 'FVNNFNNNNNNNNNN'], ['Arriendos', 'FVNFEVNNNENNNVE'], ['Lifestyle', 'FVEENNNNNENVVVV'],
    ['Reportes', 'FEEEFNNENNNNNNN'], ['Configuración', 'FNNNNNNNNNNNNNN'], ['Asistente de voz', 'FFFFFFEEEEEEEEE']
  ];
  var POLICY = [
    { title: 'Etiquetar y ordenar fotos', desc: 'Detecta habitación, calidad y vista; propone la portada.', auto: true },
    { title: 'Redactar fichas y traducciones ES/EN', desc: 'Borradores de descripción, reels y respuestas a portales.', auto: true },
    { title: 'Buscar comparables y sugerir precio', desc: 'Rango de precio con 6+ comps; nunca cambia el precio publicado.', auto: true },
    { title: 'Programar recordatorios internos', desc: 'Agenda, inventarios y vencimientos de documentos para el equipo.', auto: true },
    { title: 'Enviar mensajes a clientes', desc: 'WhatsApp, correo e Instagram: siempre quedan en la bandeja de aprobación.', auto: false },
    { title: 'Cambiar precios y publicar en portales', desc: 'Finca Raíz, Wasi, Metrocuadrado e Instagram requieren «confirmar».', auto: false },
    { title: 'Enviar contratos a firma', desc: 'Toda promesa, acuerdo o contrato pasa por la abogada.', auto: false },
    { title: 'Liberar dinero del escrow', desc: 'Aprueba la contadora; la propietaria cuando supera ' + D.fmtCOP(D.escrowSummary.approvalThreshold, { compact: true }) + '.', auto: false }
  ];
  var INTEG_COLORS = { fincaRaiz: '#1E7A57', wasi: '#2A6E9E', metrocuadrado: '#B7800F', instagram: '#C2542B', whatsapp: '#25D366', metaAds: '#1877F2', googleAds: '#4285F4', esign: '#5B4B9E', bancolombia: '#F5B400', dian: '#46524B', gcal: '#4285F4' };
  var INTEG_AVAILABLE = [
    { id: 'airbnb', name: 'Airbnb & Booking', kind: 'vacation', desc: 'Sincroniza reservas Lifestyle' },
    { id: 'siigo', name: 'Siigo contabilidad', kind: 'accounting', desc: 'Asientos automáticos' },
    { id: 'ga', name: 'Google Analytics', kind: 'analytics', desc: 'Tráfico del sitio Dorum' },
    { id: 'notaria', name: 'Notarías & VUR', kind: 'legal', desc: 'Certificados de tradición' }
  ];
  var KIND_ES = { portal: 'Portal inmobiliario', social: 'Redes sociales', messaging: 'Mensajería', ads: 'Pauta', legal: 'Legal', bank: 'Banco', tax: 'Impuestos', calendar: 'Calendario', vacation: 'Renta vacacional', accounting: 'Contabilidad', analytics: 'Analítica' };

  function settingsTab(id, c) {
    var t = D.tenant;
    if (id === 'perfil') {
      return '<div class="card"><div class="card-header"><span class="card-title">Perfil de la agencia</span><span class="pill pill-brand">' + esc(t.plan) + '</span></div><div class="grid grid-2"><label class="field"><span class="label">Nombre comercial</span><input class="input" id="setName" value="' + esc(t.name) + '"></label><label class="field"><span class="label">Razón social</span><input class="input" id="setLegal" value="' + esc(t.legalName) + '"></label><label class="field" style="grid-column:1/-1"><span class="label">Tagline</span><input class="input" id="setTag" value="' + esc(t.taglineEs) + '"><span class="hint">EN: ' + esc(t.tagline) + ' · Instagram: ' + esc(t.instagramLine) + '</span></label><label class="field" style="grid-column:1/-1"><span class="label">Posicionamiento</span><textarea class="textarea" id="setPos">' + esc(t.positioningEs) + '</textarea></label></div></div>' +
        '<div class="split-2"><div class="card"><div class="card-header"><span class="card-title">Oficinas</span><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Nueva oficina" data-body="Disponible en el plan Agency Pro.">' + icon('plus') + ' Agregar</button></div><div class="list">' + t.offices.map(function (o) { return '<div class="list-item"><span class="avatar avatar-sm avatar-sand">' + icon('map-pin', 'ico-sm') + '</span><div class="body"><div class="title">' + esc(o.name) + '</div><div class="meta">' + esc(o.barrio) + ' · ' + esc(o.city) + '</div></div></div>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Mercados y divisiones</span></div><div class="row" style="gap:6px;margin-bottom:var(--s-4)">' + t.markets.map(function (m) { return '<span class="chip is-active">' + esc(m) + '</span>'; }).join('') + '</div><div class="list">' + t.divisions.map(function (d) { return '<div class="list-item"><div class="body"><div class="title">' + esc(d.name) + '</div><div class="meta">' + esc(d.desc) + '</div></div></div>'; }).join('') + '</div></div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Comisiones por defecto</span></div><dl class="kv"><dt>Venta urbana</dt><dd>' + t.commissionDefaults.saleUrbanPct + ' % + IVA</dd><dt>Venta rural / fincas</dt><dd>' + t.commissionDefaults.saleRuralPct + ' % + IVA</dd><dt>Administración de arriendo</dt><dd>' + t.commissionDefaults.rentalMgmtPct + ' % mensual + IVA</dd><dt>IVA</dt><dd>' + t.commissionDefaults.ivaPct + ' %</dd><dt>Idiomas</dt><dd>' + t.languages.join(', ').toUpperCase() + ' · moneda base ' + t.currency + '</dd></dl></div>' +
        '<div class="row" style="justify-content:flex-end"><button class="btn btn-primary" data-action="demo-toast" data-title="Perfil guardado" data-body="Los cambios se reflejan en el sitio público y en los portales.">' + icon('check') + ' Guardar cambios</button></div>';
    }
    if (id === 'marca') {
      var b = t.brand;
      var sw = [['Selva', b.primary, 'Marca · botones, sidebar'], ['Esmeralda', b.secondary, 'Hover y enlaces'], ['Arena', b.sand, 'Fondo de página'], ['Barro', b.accent, 'Acento · CTA'], ['Tinta', b.ink, 'Texto']];
      return '<div class="card"><div class="card-header"><span class="card-title">Paleta</span><span class="small muted">Tokens compartidos con el sitio público y los portales</span></div><div class="swatches">' + sw.map(function (s) { return '<div class="swatch"><i style="background:' + s[1] + '"></i><b>' + s[0] + '</b><code>' + s[1] + '</code><span>' + s[2] + '</span></div>'; }).join('') + '</div></div>' +
        '<div class="split-2"><div class="card"><div class="card-header"><span class="card-title">Logo y marca</span></div><div class="logo-tiles"><div class="logo-tile" style="background:' + b.primary + ';color:' + b.sand + '">D</div><div class="logo-tile" style="background:' + b.sand + ';color:' + b.primary + '">D</div><div class="logo-tile" style="background:' + b.accent + ';color:#fff">D</div></div><p class="small muted" style="margin-top:var(--s-3)">Se usa en firmas de correo, fichas PDF, marca de agua de fotos y el pie del sitio. Instagram: ' + esc(t.social.instagram) + ' · ' + esc(t.social.instagramLifestyle) + '</p></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Tipografía</span></div><div class="type-sample"><span class="display">Curated by nature</span><span>Fraunces para títulos y precios · Inter para interfaz</span><span class="money display" style="font-size:var(--fs-xl)">$3.900.000.000</span></div></div></div>' +
        '<div class="row" style="justify-content:flex-end"><button class="btn btn-secondary" data-action="demo-toast" data-title="Marca exportada" data-body="Kit de marca (PDF + tokens CSS) enviado a tu correo.">' + icon('download') + ' Exportar kit</button></div>';
    }
    if (id === 'roles') {
      var roles = D.roles;
      return '<div class="card card-pad-0"><div class="card-header" style="padding:var(--s-4) var(--s-5) 0"><span class="card-title">Roles y permisos</span><div class="row" style="gap:var(--s-3);font-size:var(--fs-xs);color:var(--text-3)"><span><span class="perm perm-F" style="display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--brand);color:var(--brand-ink);font-weight:700;font-size:9px">F</span> total</span><span><span style="display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--brand-soft);color:var(--brand);font-weight:700;font-size:9px">E</span> edita lo propio</span><span><span style="display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;background:var(--surface-3);color:var(--text-2);font-weight:700;font-size:9px">V</span> solo lectura</span></div></div><div class="matrix-wrap" style="border:0;border-radius:0;margin-top:var(--s-3)"><table class="matrix"><thead><tr><th class="rowhead">Módulo</th>' + roles.map(function (r) { return '<th title="' + esc(r.labelEs) + '">' + esc(r.labelEs.split(' ')[0].replace('Administradora', 'Admin.')) + (r.id === 'sales_admin' ? ' ventas' : r.id === 'rental_admin' ? ' arriendos' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' + PERM_MODULES.map(function (m) { return '<tr><td class="rowhead">' + esc(m[0]) + '</td>' + m[1].split('').map(function (p) { return '<td>' + (p === 'N' ? '<span class="perm perm-N">—</span>' : '<span class="perm perm-' + p + '">' + p + '</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="small muted" style="padding:var(--s-3) var(--s-5) var(--s-4)">Los permisos son de solo lectura en la demo. Cada aprobación queda en el registro de auditoría con nombre, hora y versión del borrador.</p></div>';
    }
    if (id === 'integraciones') {
      var con = D.integrations;
      return '<div class="card"><div class="card-header"><span class="card-title">Conectadas</span><span class="status-chip"><i></i>' + con.filter(function (i) { return i.status === 'conectado'; }).length + ' activas · última sincronización ' + esc(D.fmtDate(con[0].lastSync, 'time')) + '</span></div><div class="integ-grid">' + con.map(function (i) {
        var meta = [];
        if (i.listings != null) meta.push(i.listings + ' inmuebles publicados');
        if (i.leads30d != null) meta.push(i.leads30d + ' leads · 30 d');
        if (i.posts30d != null) meta.push(i.posts30d + ' publicaciones · 30 d');
        if (i.threads != null) meta.push(i.threads + ' conversaciones');
        if (i.spend30d != null) meta.push(D.fmtCOP(i.spend30d, { compact: true }) + ' invertidos · 30 d');
        if (i.envelopes30d != null) meta.push(i.envelopes30d + ' sobres firmados · 30 d');
        if (i.balance != null) meta.push('Saldo escrow ' + D.fmtCOP(i.balance, { compact: true }));
        if (i.lastSync) meta.push('Sync ' + D.fmtDate(i.lastSync, 'time'));
        var ok = i.status === 'conectado';
        return '<div class="integ"><div class="integ-top"><span class="integ-logo" style="background:' + (INTEG_COLORS[i.id] || 'var(--text-3)') + '">' + esc(i.name.slice(0, 2).toUpperCase()) + '</span><div><div class="integ-name">' + esc(i.name) + '</div><div class="integ-kind">' + esc(KIND_ES[i.kind] || i.kind) + '</div></div></div><div class="integ-meta">' + (meta.length ? meta.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join('') : '<span>Sin actividad reciente</span>') + '</div><div class="row row-between"><span class="badge badge-status" data-status="' + (ok ? 'activo' : 'pendiente') + '">' + (ok ? 'Conectado' : 'Pendiente') + '</span>' + (ok ? '<button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Sincronizando" data-body="' + esc(i.name) + ' se actualizará en unos segundos.">' + icon('refresh-cw') + '</button>' : '<button class="btn btn-primary btn-sm" data-action="demo-toast" data-title="Conectar ' + esc(i.name) + '" data-body="Te llevamos al proveedor para autorizar el acceso.">Conectar</button>') + '</div></div>';
      }).join('') + '</div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Disponibles</span></div><div class="integ-grid">' + INTEG_AVAILABLE.map(function (i) { return '<div class="integ is-available"><div class="integ-top"><span class="integ-logo" style="background:var(--text-3)">' + esc(i.name.slice(0, 2).toUpperCase()) + '</span><div><div class="integ-name">' + esc(i.name) + '</div><div class="integ-kind">' + esc(KIND_ES[i.kind] || i.kind) + '</div></div></div><div class="integ-meta"><span>' + esc(i.desc) + '</span></div><div class="row row-between"><span class="badge">Disponible</span><button class="btn btn-secondary btn-sm" data-action="demo-toast" data-title="Solicitud enviada" data-body="Activamos ' + esc(i.name) + ' en tu cuenta en menos de 24 h.">Activar</button></div></div>'; }).join('') + '</div></div>';
    }
    if (id === 'ia') {
      return '<div class="card"><div class="card-header"><span class="card-title">Qué puede hacer Llave sin aprobación</span><span class="badge badge-ai">Política de IA</span></div><p class="small muted" style="margin-bottom:var(--s-3)">Principio de la casa: la IA hace el paso, una persona firma el paso. Lo legal, lo financiero y lo público nunca salen sin un aprobador con nombre.</p><div class="policy-list">' + POLICY.map(function (p, i) { return '<div class="policy-item"><div><div class="title">' + esc(p.title) + '</div><div class="desc">' + esc(p.desc) + '</div></div><label class="toggle"><input type="checkbox" id="pol' + i + '" ' + (p.auto ? 'checked' : '') + ' data-locked="' + (!p.auto) + '"><span class="toggle-track"></span><span class="small">' + (p.auto ? 'Automático' : 'Requiere aprobación') + '</span></label></div>'; }).join('') + '</div></div>' +
        '<div class="split-2"><div class="card"><div class="card-header"><span class="card-title">Aprobadores</span></div><dl class="kv"><dt>Mensajes a clientes</dt><dd>Asesor responsable del lead</dd><dt>Precios y publicación</dt><dd>' + esc(D.userName('u-sadmin')) + ' · ' + esc(D.OWNER_NAME) + '</dd><dt>Contratos</dt><dd>' + esc(D.userName('u-lawyer')) + '</dd><dt>Escrow y pagos</dt><dd>' + esc(D.userName('u-acct')) + ' · > ' + esc(D.fmtCOP(D.escrowSummary.approvalThreshold, { compact: true })) + ' ' + esc(D.OWNER_NAME) + '</dd></dl></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Trazabilidad</span></div><p class="small" style="color:var(--text-2)">Cada borrador guarda modelo, fuentes (registros de Llave) y versión. Las aprobaciones se firman con el usuario y la hora. Hoy hay <b>' + U.allApprovals().length + '</b> borradores esperando decisión.</p><div class="row" style="margin-top:var(--s-3)"><button class="btn btn-secondary btn-sm" data-action="open-approvals">' + icon('bell') + ' Abrir bandeja</button><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Registro exportado" data-body="Auditoría de los últimos 90 días en CSV.">' + icon('download') + ' Exportar auditoría</button></div></div></div>';
    }
    if (id === 'plan') {
      var seats = D.users.filter(function (u) { return u.roleGroup === 'staff'; }).length;
      return '<div class="card card-brand plan-card"><div><span class="eyebrow" style="color:rgb(255 252 245 / 0.65)">Plan actual</span><h2 class="display" style="margin-top:4px">' + esc(t.plan) + '</h2><p class="muted" style="margin-top:var(--s-2);max-width:48ch">' + seats + ' asientos de equipo, aliados y clientes ilimitados, voz, escrow y sitio web incluidos. Facturación mensual en COP.</p></div><div style="text-align:right"><div class="plan-price">' + esc(D.fmtCOP(1890000)) + ' <small>/ mes + IVA</small></div><div class="small muted">Próxima factura · 1 oct 2026</div></div></div>' +
        '<div class="split-2"><div class="card"><div class="card-header"><span class="card-title">Incluye</span></div><div class="plan-features">' + ['Sitio web y landings por inmueble', 'Publicación en 3 portales + Instagram', 'CRM captación y ventas', 'Contratos con firma electrónica', 'Escrow, pagos y nómina', 'Asistente de voz Llave', 'WhatsApp Business', 'Reportes y wallboard TV'].map(function (f) { return '<span>' + icon('check') + esc(f) + '</span>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Uso este mes</span></div><div class="stack stack-sm"><div><div class="row row-between small"><span>Asientos de equipo</span><b>' + seats + ' / 8</b></div><div class="progress"><span style="--value:' + Math.round(seats / 8 * 100) + '%"></span></div></div><div><div class="row row-between small"><span>Borradores de IA</span><b>412 / 1.000</b></div><div class="progress"><span style="--value:41%"></span></div></div><div><div class="row row-between small"><span>Minutos de voz</span><b>186 / 600</b></div><div class="progress"><span style="--value:31%"></span></div></div><div><div class="row row-between small"><span>Sobres de firma</span><b>' + D.byId(D.integrations, 'esign').envelopes30d + ' / 25</b></div><div class="progress"><span style="--value:24%"></span></div></div></div><div class="row" style="margin-top:var(--s-4)"><button class="btn btn-secondary btn-sm" data-action="demo-toast" data-title="Facturas" data-body="Historial disponible en PDF y XML DIAN.">' + icon('receipt') + ' Ver facturas</button><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Hablemos" data-body="Un asesor de Llave te contacta hoy para el plan Enterprise.">Cambiar de plan</button></div></div></div>';
    }
    return '';
  }
  var SETTINGS_TABS = [['perfil', 'Perfil', 'building'], ['marca', 'Marca', 'palette'], ['roles', 'Roles y permisos', 'shield'], ['integraciones', 'Integraciones', 'layers'], ['ia', 'Política de IA', 'sparkles'], ['plan', 'Plan y facturación', 'receipt']];
  L.register('settings', {
    title: 'Configuración', titleEs: 'Configuración', icon: icon('settings'),
    render: function (c) {
      var owner = c.roleId === 'owner';
      return header('Configuración', owner ? 'Identidad, permisos, integraciones y la política de IA de ' + esc(D.tenant.name) + '.' : 'Vista de solo lectura. Solo la propietaria edita la configuración del tenant.', owner ? '' : '<span class="badge">' + icon('lock', 'ico-sm') + ' Solo lectura</span>') +
        '<div class="settings-layout"><nav class="settings-nav" aria-label="Secciones">' + SETTINGS_TABS.map(function (t) { return '<button class="' + (st.settingsTab === t[0] ? 'is-active' : '') + '" data-action="settings-tab" data-tab="' + t[0] + '">' + icon(t[2]) + esc(t[1]) + '</button>'; }).join('') + '</nav><div class="stack">' + settingsTab(st.settingsTab, c) + '</div></div>';
    },
    mount: function (root) {
      root.querySelectorAll('.policy-item input').forEach(function (inp) {
        inp.addEventListener('change', function () {
          if (inp.dataset.locked === 'true') { inp.checked = false; D.toast('Paso protegido', 'Esta acción siempre requiere una persona. Se puede cambiar solo en el plan Enterprise con aprobación legal.', 'danger'); }
          else D.toast('Política actualizada', inp.checked ? 'Llave lo hará automáticamente y dejará registro.' : 'Ahora requiere aprobación humana.', 'ai');
        });
      });
    }
  });
  L.action('settings-tab', function (d) { st.settingsTab = d.tab; L.rerender(); });

  /* ======================================================================
     WEBSITE (CMS)
     ====================================================================== */
  var SITE_PAGES = [
    { id: 'inicio', label: 'Inicio', icon: 'home', status: 'publicado', updated: '2026-09-13', path: '../dorum/index.html' },
    { id: 'inmuebles', label: 'Inmuebles', icon: 'building', status: 'publicado', updated: '2026-09-16', path: '../dorum/index.html#inmuebles' },
    { id: 'lifestyle', label: 'Lifestyle & Experiences', icon: 'sparkles', status: 'borrador', updated: '2026-09-15', path: '../dorum/index.html#lifestyle' },
    { id: 'nosotros', label: 'Nosotros', icon: 'users', status: 'publicado', updated: '2026-08-30', path: '../dorum/index.html#nosotros' },
    { id: 'contacto', label: 'Contacto', icon: 'mail', status: 'publicado', updated: '2026-08-30', path: '../dorum/index.html#contacto' },
    { id: 'landing', label: 'Landing por inmueble', icon: 'layers', status: 'publicado', updated: '2026-09-16', path: '../dorum/listing.html?id=lst-003', children: true }
  ];
  function cmsBlocks(page) {
    var t = D.tenant, feat = D.listings.filter(function (l) { return l.featured; });
    var head = function (kind, label) { return '<div class="block-head">' + icon(kind) + esc(label) + '<span class="spacer"></span><button class="btn btn-ghost btn-icon" data-action="demo-toast" data-title="Bloque" data-body="Arrastra para reordenar; edita en línea." aria-label="Mover">' + icon('more-horizontal') + '</button></div>'; };
    var hero, gallery, testis, cta, ai;
    if (page.id === 'lifestyle') {
      hero = '<div class="block">' + head('image', 'Hero') + '<div class="block-hero"><h2>Tu casa de descanso, <em>un activo productivo</em></h2><p>Administramos reservas, limpieza, experiencias y la liquidación mensual. Tú recibes el extracto; nosotros hacemos el resto.</p></div></div>';
      ai = { title: 'hero · Lifestyle', del: 'Tu casa de descanso, un activo productivo', add: 'Compra con el corazón, renta con cabeza: tu casa en el embalse, administrada por Dorum', meta: 'Basado en la ocupación real del programa (71 %) y el tono de @dorumlifestyle' };
      gallery = '<div class="block">' + head('layout-grid', 'Servicios (7)') + '<div class="block-body"><div class="block-testis">' + D.lifestyle.slice(0, 3).map(function (s) { return '<div class="testi"><b>' + esc(s.nameEs) + '</b> <span class="pill pill-warn">' + (s.status === 'pilot' ? 'piloto' : 'próximamente') + '</span><small>' + esc(s.desc) + '</small></div>'; }).join('') + '</div></div></div>';
    } else if (page.id === 'landing') {
      var l = feat[2] || feat[0];
      hero = '<div class="block">' + head('image', 'Hero · desde la ficha del inmueble') + '<div class="block-hero" style="background:linear-gradient(rgb(15 61 46 / 0.55), rgb(15 61 46 / 0.85)),url(' + esc(l.cover) + ') center/cover"><h2>' + esc(l.title) + '</h2><p>' + esc(D.fmtPrice(l)) + ' · ' + esc(l.barrio) + ', ' + esc(l.city) + ' · ' + esc(D.fmtM2(l.area)) + '</p></div></div>';
      ai = { title: 'descripción · ' + l.title, del: l.description.slice(0, 80) + '…', add: 'Despertar con el embalse en la ventana y cerrar el día en el muelle: 420 m² de madera y piedra, casa de huéspedes independiente y un historial de renta que ya paga la casa.', meta: 'Optimizado para búsqueda «casa de lago Guatapé» · 2 idiomas' };
      gallery = '<div class="block">' + head('image', 'Galería · ' + l.images.length + ' fotos etiquetadas por Llave') + '<div class="block-body"><div class="block-gallery">' + l.images.slice(0, 4).map(function (im) { return '<img src="' + esc(im.url.replace('/1200/800', '/400/300')) + '" alt="' + esc(im.aiTags) + '" loading="lazy">'; }).join('') + '</div></div></div>';
    } else {
      hero = '<div class="block">' + head('image', 'Hero') + '<div class="block-hero"><h2>Curated <em>by nature</em></h2><p>' + esc(t.positioningEs) + '</p></div></div>';
      ai = { title: 'hero · Inicio', del: 'Curated by nature', add: 'Hogares que respiran: casas, fincas y lotes frente al embalse, con el sello Dorum', meta: 'Sugerencia de Llave: prueba el titular en español para la audiencia local; el original queda para EN' };
      gallery = '<div class="block">' + head('building', 'Inmuebles destacados · automático') + '<div class="block-body"><div class="block-gallery">' + feat.slice(0, 4).map(function (f) { return '<img src="' + esc(f.cover.replace('/800/600', '/400/300')) + '" alt="' + esc(f.title) + '" loading="lazy">'; }).join('') + '</div><p class="small muted" style="margin-top:var(--s-2)">Se llena solo con los inmuebles marcados como destacados. ' + feat.length + ' activos.</p></div></div>';
    }
    testis = '<div class="block">' + head('message-circle', 'Testimonios') + '<div class="block-body"><div class="block-testis"><div class="testi"><q>Compramos la casa del lago desde Toronto sin conocer Guatapé. El equipo nos llevó de la mano y hoy la casa se paga sola.</q><small>Compradora internacional · 2025</small></div><div class="testi"><q>Mi finca en Llanogrande se vendió en 40 días con fotos que parecían de revista.</q><small>Vendedor · Oriente antioqueño</small></div><div class="testi"><q>Recibo mi extracto cada mes en WhatsApp. Cero dolores de cabeza.</q><small>Propietario programa Lifestyle</small></div></div></div></div>';
    cta = '<div class="block">' + head('send', 'Llamado a la acción') + '<div class="block-body"><div class="block-cta"><div><b>¿Vendes o arriendas en Antioquia?</b><div class="small muted">Valoración gratuita con comparables reales en 48 horas.</div></div><button class="btn btn-accent">Hablar con Dorum por WhatsApp</button></div></div></div>';
    var aiBlock = '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Redactar con Llave · ' + esc(ai.title) + '</div><div class="ai-suggest-body"><span class="diff-del">' + esc(ai.del) + '</span> <span class="diff-add">' + esc(ai.add) + '</span></div><div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="demo-toast" data-title="Texto aplicado" data-body="El bloque quedó actualizado en borrador. Publica cuando estés lista." data-variant="success">' + icon('check') + ' Aplicar</button><button class="btn btn-secondary btn-sm" data-action="demo-toast" data-title="Nueva variante" data-body="Llave propone otra versión en 3 segundos." data-variant="ai">' + icon('refresh-cw') + ' Otra versión</button><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Descartado" data-body="Se mantiene el texto actual." data-variant="ai">Descartar</button></div><div class="ai-suggest-meta">' + esc(ai.meta) + '</div></div>';
    return hero + aiBlock + gallery + testis + cta + '<div class="add-block">' + ['Hero', 'Galería', 'Testimonios', 'CTA', 'Inmuebles', 'Mapa', 'FAQ', 'Formulario'].map(function (b) { return '<button class="chip" data-action="demo-toast" data-title="Bloque ' + esc(b) + '" data-body="Agregado al final de la página.">' + icon('plus', 'ico-sm') + esc(b) + '</button>'; }).join('') + '</div>';
  }
  L.register('website', {
    title: 'Sitio web', titleEs: 'Sitio web', icon: icon('globe'),
    render: function (c) {
      var page = D.byId(SITE_PAGES, st.sitePage) || SITE_PAGES[0];
      var pub = SITE_PAGES.filter(function (p) { return p.status === 'publicado'; }).length;
      return header('Sitio web', 'CMS del sitio público de ' + esc(D.tenant.name) + ' · ' + pub + ' de ' + SITE_PAGES.length + ' páginas publicadas · ES / EN', '<a class="btn btn-secondary btn-sm" href="../dorum/index.html" target="_blank" rel="noopener">' + icon('external-link') + ' Ver sitio público</a><button class="btn btn-primary btn-sm" data-action="demo-toast" data-title="Publicado" data-body="Cambios en vivo en dorumgroup.com y en las landings por inmueble." data-variant="success">' + icon('upload-cloud') + ' Publicar cambios</button>') +
        '<div class="cms-layout"><div class="card card-pad-0" style="padding:var(--s-3)"><div class="eyebrow" style="padding:var(--s-2) var(--s-3)">Páginas</div><div class="site-tree">' + SITE_PAGES.map(function (p) { return '<button class="' + (p.id === st.sitePage ? 'is-active' : '') + '" data-action="website-page" data-page="' + p.id + '">' + icon(p.icon) + esc(p.label) + '<span class="pub ' + (p.status === 'borrador' ? 'is-draft' : '') + '" title="' + p.status + '"></span></button>' + (p.children ? D.listings.filter(function (l) { return l.status === 'activo' || l.status === 'bajo oferta'; }).slice(0, 3).map(function (l) { return '<button class="is-child" data-action="website-page" data-page="landing">' + icon('chevron-right') + '<span class="truncate">' + esc(l.title) + '</span></button>'; }).join('') + '<button class="is-child" data-action="website-page" data-page="landing">' + icon('more-horizontal') + '+ ' + (D.listings.length - 3) + ' inmuebles</button>' : ''); }).join('') + '</div><hr><div class="stack stack-sm" style="padding:0 var(--s-3) var(--s-2);font-size:var(--fs-xs);color:var(--text-3)"><span class="status-chip"><i></i>dorumgroup.com · SSL activo</span><span class="status-chip"><i></i>Sitemap y datos estructurados</span><span class="status-chip"><i class="is-warn"></i>1 página en borrador</span></div></div>' +
        '<div class="stack"><div class="row row-between"><div><span class="section-title">' + icon(page.icon) + esc(page.label) + '</span><div class="kicker">' + (page.status === 'publicado' ? 'Publicado' : 'Borrador') + ' · actualizado ' + esc(D.fmtDate(page.updated)) + ' · <a href="' + esc(page.path) + '" target="_blank" rel="noopener">abrir en el sitio</a></div></div><div class="row"><span class="badge badge-status" data-status="' + (page.status === 'publicado' ? 'activo' : 'borrador') + '">' + (page.status === 'publicado' ? 'Publicado' : 'Borrador') + '</span><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Vista previa" data-body="Abriendo la versión en borrador…">' + icon('eye') + ' Vista previa</button></div></div><div class="cms-canvas">' + cmsBlocks(page) + '</div></div></div>';
    }
  });
  L.action('website-page', function (d) { st.sitePage = d.page; L.rerender(); });

  /* ======================================================================
     REPORTS
     ====================================================================== */
  function zoneCounts() {
    var m = {}; D.listings.forEach(function (l) { var z = l.city; m[z] = (m[z] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { label: k, value: m[k] }; }).sort(function (a, b) { return b.value - a.value; });
  }
  L.register('reports', {
    title: 'Reportes', titleEs: 'Reportes', icon: icon('bar-chart'),
    render: function (c) {
      var k = D.kpis, zones = zoneCounts();
      var leads = k.leads30d, tours = D.contacts.filter(function (x) { return x.stage === 'tour' || x.stage === 'visita'; }).length + k.toursThisWeek * 3, offers = D.deals.filter(function (d) { return d.status === 'bajo oferta'; }).length + D.contacts.filter(function (x) { return x.stage === 'oferta' || x.stage === 'propuesta'; }).length, closes = D.deals.filter(function (d) { return d.stage === 'arrendado' || d.stage === 'vendido'; }).length;
      var funnel = [['Leads', leads], ['Visitas', tours], ['Ofertas', offers], ['Cierres', closes]];
      var cpl = D.campaigns.filter(function (x) { return x.cpl; }).sort(function (a, b) { return a.start.localeCompare(b.start); });
      var cplSeries = [78400, 74900, 71200].concat(cpl.map(function (x) { return x.cpl; }));
      var avgCpl = Math.round(sum(cpl, function (x) { return x.spend; }) / sum(cpl, function (x) { return x.leads; }));
      var rows = D.listings.filter(function (l) { return l.daysOnMarket > 0; }).sort(function (a, b) { return b.leads - a.leads; });
      var stat = function (label, value, delta, up) { return '<div class="card stat"><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span>' + (delta ? '<span class="stat-delta ' + (up ? 'up' : 'down') + '">' + delta + '</span>' : '') + '</div>'; };
      return header('Reportes', 'Rendimiento comercial de ' + esc(D.tenant.name) + ' · últimos 30 días · actualizado ' + esc(D.fmtDate(U.today(), 'short')), '<button class="btn btn-secondary btn-sm" data-action="export-csv">' + icon('download') + ' Exportar CSV</button><button class="btn btn-ghost btn-sm" data-action="open-voice" data-intent="listing_status">' + icon('mic') + ' Preguntar a Llave</button>') +
        '<div class="kpi-strip">' + stat('Inmuebles activos', k.listingsActive, k.listingsUnderOffer + ' bajo oferta', true) + stat('Valor del pipeline', esc(D.fmtCOP(k.pipelineValueCOP, { compact: true })), '+12 % vs. agosto', true) + stat('Leads · 30 d', k.leads30d, '+18 % vs. agosto', true) + stat('Días en mercado', k.avgDaysOnMarket, '−6 días', true) + stat('Comisión proyectada', esc(D.fmtCOP(k.commissionProjectedMonthCOP, { compact: true })), 'mes en curso', true) + '</div>' +
        '<div class="report-grid"><div class="card"><div class="card-header"><span class="card-title">Inmuebles por zona</span><span class="small muted">' + D.listings.length + ' en total</span></div><div class="chart-bars">' + L.chart.bars(zones.map(function (z) { return z.value; }), { labels: zones.map(function (z) { return z.label; }), height: 140, highlight: 0 }) + '</div></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Embudo comercial</span><span class="small muted">30 días</span></div><div class="funnel">' + funnel.map(function (f, i) { var pct = Math.max(6, Math.round(f[1] / funnel[0][1] * 100)); var conv = i ? Math.round(f[1] / funnel[i - 1][1] * 100) + ' %' : ''; return '<div class="funnel-row' + (i === funnel.length - 1 ? ' is-conv' : '') + '"><span>' + f[0] + '</span><div class="bar"><span style="--w:' + pct + '%">' + f[1] + '</span></div><span class="num">' + conv + '</span></div>'; }).join('') + '</div><p class="small muted" style="margin-top:var(--s-3)">Conversión lead → cierre ' + (closes / leads * 100).toFixed(1).replace('.', ',') + ' %. El cuello de botella está en visitas → ofertas.</p></div>' +
        '<div class="card"><div class="card-header"><span class="card-title">Costo por lead · pauta</span><span class="pill pill-success">' + icon('trending-up', 'ico-sm') + ' bajando</span></div><div class="stat-pair"><div class="stat"><span class="stat-label">CPL promedio</span><span class="stat-value money">' + esc(D.fmtCOP(avgCpl)) + '</span></div><div class="stat" style="text-align:right"><span class="stat-label">Inversión 30 d</span><span class="stat-value money" style="font-size:var(--fs-lg)">' + esc(D.fmtCOP(sum(cpl, function (x) { return x.spend; }), { compact: true })) + '</span></div></div><div class="spark" style="height:64px">' + L.chart.sparkline(cplSeries) + '</div><div class="legend">' + cpl.slice(-3).map(function (x) { return '<span><i style="--c:var(--brand-2)"></i><span class="truncate">' + esc(x.name) + '</span><b>' + esc(D.fmtCOP(x.cpl)) + '</b></span>'; }).join('') + '</div></div></div>' +
        '<div class="card card-pad-0"><div class="card-header" style="padding:var(--s-4) var(--s-5) 0"><span class="card-title">Rendimiento por inmueble</span><span class="small muted">' + rows.length + ' publicados · ordenados por leads</span></div><div class="table-wrap" style="border:0;border-radius:0;margin-top:var(--s-3)"><table class="table table-compact" id="reportTable"><thead><tr><th>Inmueble</th><th>Zona</th><th>Estado</th><th class="num">Precio</th><th class="num">Días</th><th class="num">Vistas</th><th class="num">Leads</th><th class="num">Conv.</th><th>Portales</th></tr></thead><tbody>' + rows.map(function (l) { return '<tr><td><a href="#" data-action="open-listing" data-id="' + l.id + '" style="font-weight:600;color:inherit">' + esc(l.title) + '</a></td><td>' + esc(l.city) + '</td><td><span class="badge badge-status" data-status="' + esc(l.status) + '">' + esc(D.statusLabel(l.status)) + '</span></td><td class="num money">' + esc(D.fmtMoney(l.price, l.currency, { compact: true })) + '</td><td class="num">' + l.daysOnMarket + '</td><td class="num">' + l.views.toLocaleString('es-CO') + '</td><td class="num">' + l.leads + '</td><td class="num">' + (l.views ? (l.leads / l.views * 100).toFixed(1).replace('.', ',') + ' %' : '—') + '</td><td><span class="synd"><i class="' + (l.syndication.fincaRaiz ? 'on' : '') + '" title="Finca Raíz"></i><i class="' + (l.syndication.wasi ? 'on' : '') + '" title="Wasi"></i><i class="' + (l.syndication.metrocuadrado ? 'on' : '') + '" title="Metrocuadrado"></i><i class="' + (l.syndication.instagram ? 'on' : '') + '" title="Instagram"></i></span></td></tr>'; }).join('') + '</tbody></table></div></div>';
    }
  });
  L.action('export-csv', function () {
    var rows = [['Inmueble', 'Zona', 'Estado', 'Precio', 'Moneda', 'Dias', 'Vistas', 'Leads']].concat(D.listings.map(function (l) { return [l.title, l.city, l.status, l.price, l.currency, l.daysOnMarket, l.views, l.leads]; }));
    var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\n');
    try {
      var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dorum-reporte-inmuebles.csv'; document.body.appendChild(a); a.click(); a.remove();
      D.toast('CSV exportado', rows.length - 1 + ' inmuebles · separador ;', 'success');
    } catch (e) { D.toast('Exportación', 'Tu navegador bloqueó la descarga; copia la tabla.', 'danger'); }
  });

  /* ======================================================================
     CALENDAR
     ====================================================================== */
  var KIND_LABEL = { tour: 'Recorrido', visit: 'Captación', shoot: 'Sesión foto/video', deal: 'Hito del negocio', task: 'Tarea' };
  function monthGrid(c, evs) {
    var today = U.today(); var y = +today.slice(0, 4), m = +today.slice(5, 7) - 1;
    var first = new Date(y, m, 1); var startDow = (first.getDay() + 6) % 7; var days = new Date(y, m + 1, 0).getDate();
    var cells = '';
    var byDate = {}; evs.forEach(function (e) { (byDate[e.date] = byDate[e.date] || []).push(e); });
    for (var i = 0; i < startDow; i++) { var pd = new Date(y, m, -startDow + i + 1); cells += '<div class="cal-cell is-other"><span class="d">' + pd.getDate() + '</span></div>'; }
    for (var d = 1; d <= days; d++) {
      var iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var list = byDate[iso] || [];
      cells += '<div class="cal-cell' + (iso === today ? ' is-today' : '') + '"><span class="d">' + d + '</span>' + list.slice(0, 3).map(function (e) { return '<span class="cal-ev k-' + e.kind + (e.ai ? ' is-ai' : '') + '" data-action="cal-open" data-id="' + esc(e.id) + '" title="' + esc(e.title) + '">' + (e.time ? e.time + ' ' : '') + esc(e.title) + '</span>'; }).join('') + (list.length > 3 ? '<span class="cal-more">+' + (list.length - 3) + ' más</span>' : '') + (list.length ? '<span class="cal-dots">' + list.slice(0, 4).map(function (e) { return '<i class="k-' + e.kind + '"></i>'; }).join('') + '</span>' : '') + '</div>';
    }
    var rem = (7 - (startDow + days) % 7) % 7; for (var r = 1; r <= rem; r++) cells += '<div class="cal-cell is-other"><span class="d">' + r + '</span></div>';
    return '<div class="cal-grid">' + ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('') + cells + '</div>';
  }
  function weekGrid(c, evs) {
    var today = U.today(); var dt = new Date(today + 'T12:00:00'); var dow = (dt.getDay() + 6) % 7; var mon = U.addDays(today, -dow);
    var cells = '';
    for (var i = 0; i < 7; i++) {
      var iso = U.addDays(mon, i); var list = evs.filter(function (e) { return e.date === iso; });
      cells += '<div class="cal-cell' + (iso === today ? ' is-today' : '') + '"><span class="d" style="width:auto;padding:0 6px;border-radius:11px">' + esc(D.fmtDate(iso, 'short')) + '</span>' + (list.length ? list.map(function (e) { return '<span class="cal-ev k-' + e.kind + (e.ai ? ' is-ai' : '') + '" data-action="cal-open" data-id="' + esc(e.id) + '"><time>' + (e.time || 'Todo el día') + '</time>' + esc(e.title) + '</span>'; }).join('') : '<span class="cal-more">Libre</span>') + '</div>';
    }
    return '<div class="cal-grid cal-week">' + ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('') + cells + '</div>';
  }
  function agenda(c, evs, days) {
    var today = U.today(); var out = '', any = false;
    for (var i = 0; i < days; i++) {
      var iso = U.addDays(today, i); var list = evs.filter(function (e) { return e.date === iso; }); if (!list.length) continue; any = true;
      var dt = new Date(iso + 'T12:00:00');
      out += '<div class="agenda-day' + (i === 0 ? ' is-today' : '') + '"><div class="day"><b>' + dt.getDate() + '</b><span>' + esc(dt.toLocaleDateString('es-CO', { weekday: 'short' })) + '</span></div><div>' + list.map(function (e) {
        var isTour = e.kind === 'tour' || e.kind === 'visit'; var contact = e.contactId && D.byId(D.contacts, e.contactId);
        return '<div class="agenda-ev"><time>' + (e.time || '—') + '</time><div class="body"><div class="title">' + esc(e.title) + (e.ai ? ' ' + badgeAI() : '') + '</div><div class="meta">' + esc(KIND_LABEL[e.kind]) + ' · ' + esc(e.meta) + '</div>' + (isTour && contact && contact.whatsapp && !e._sent ? '<div class="ai-suggest"><div class="ai-suggest-head"><span class="spark"></span> Recordatorio por WhatsApp · borrador</div><div class="ai-suggest-body">' + esc(contact.lang === 'en' ? 'Hi ' + U.firstName(contact.name) + '! Quick reminder of our visit ' + U.relDay(e.date).toLowerCase() + (e.time ? ' at ' + e.time : '') + '. I’ll be waiting at the entrance. See you soon!' : 'Hola ' + U.firstName(contact.name) + ', te recuerdo nuestra visita ' + U.relDay(e.date).toLowerCase() + (e.time ? ' a las ' + e.time : '') + '. Te espero en la portería. ¡Nos vemos!') + '</div><div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="cal-remind" data-id="' + esc(e.id) + '">' + icon('send') + ' Aprobar y enviar</button><button class="btn btn-ghost btn-sm" data-action="cal-remind" data-id="' + esc(e.id) + '" data-skip="1">Omitir</button></div></div>' : (e._sent ? '<span class="pill pill-success" style="margin-top:6px">' + icon('check', 'ico-sm') + ' Recordatorio enviado</span>' : '')) + '</div><button class="btn btn-ghost btn-icon" data-action="cal-open" data-id="' + esc(e.id) + '" aria-label="Abrir">' + icon('chevron-right') + '</button></div>';
      }).join('') + '</div></div>';
    }
    return any ? out : '<div class="empty">' + icon('calendar') + '<span>Sin eventos en los próximos ' + days + ' días.</span></div>';
  }
  var sentReminders = {};
  L.register('calendar', {
    title: 'Agenda', titleEs: 'Agenda', icon: icon('calendar'),
    render: function (c) {
      var evs = U.events(c).map(function (e) { e._sent = !!sentReminders[e.id]; return e; });
      var today = U.today(); var dt = new Date(today + 'T12:00:00');
      var title = st.calView === 'month' ? U.capFirst(dt.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })) : 'Semana del ' + D.fmtDate(U.addDays(today, -((dt.getDay() + 6) % 7)), 'short');
      var upcoming = evs.filter(function (e) { return e.date >= today; });
      return header('Agenda', upcoming.length + ' eventos próximos · visitas, recorridos, sesiones y vencimientos, sincronizados con Google Calendar', '<button class="btn btn-secondary btn-sm" data-action="open-voice" data-intent="schedule_visit">' + icon('mic') + ' Agendar por voz</button><button class="btn btn-primary btn-sm" data-action="demo-toast" data-title="Nuevo evento" data-body="Dile a Llave: «agenda visita mañana a las diez…»">' + icon('plus') + ' Nuevo</button>') +
        '<div class="cal-toolbar"><span class="cal-title">' + esc(title) + '</span><div class="row" style="gap:var(--s-2);font-size:var(--fs-xs);color:var(--text-3)"><span class="cal-ev k-tour" style="cursor:default">Recorridos</span><span class="cal-ev k-shoot" style="cursor:default">Sesiones</span><span class="cal-ev k-deal" style="cursor:default">Negocios</span><span class="cal-ev" style="cursor:default">Tareas</span></div><div class="tabs tabs-pill"><button class="tab ' + (st.calView === 'month' ? 'is-active' : '') + '" data-action="cal-view" data-view="month">Mes</button><button class="tab ' + (st.calView === 'week' ? 'is-active' : '') + '" data-action="cal-view" data-view="week">Semana</button></div></div>' +
        (st.calView === 'month' ? monthGrid(c, evs) : weekGrid(c, evs)) +
        '<div class="card"><div class="card-header"><span class="card-title">Próximos 10 días</span><span class="badge badge-ai">Recordatorios redactados por Llave</span></div>' + agenda(c, evs, 10) + '</div>';
    }
  });
  L.action('cal-view', function (d) { st.calView = d.view; L.rerender(); });
  L.action('cal-remind', function (d) { sentReminders[d.id] = true; if (d.skip) D.toast('Omitido', 'No se envió recordatorio.', 'ai'); else D.toast('Recordatorio enviado', 'WhatsApp entregado y registrado en el contacto.', 'success'); L.rerender(); });
  L.action('cal-open', function (d, node, c) {
    var e = U.events(c).filter(function (x) { return x.id === d.id; })[0]; if (!e) return;
    if (e.taskId) return L.actions['open-task']({ id: e.taskId });
    if (e.contactId) return L.actions['open-contact']({ id: e.contactId });
    if (e.listingId) return L.actions['open-listing']({ id: e.listingId });
  });

  /* ======================================================================
     MESSAGES
     ====================================================================== */
  var CH_CLS = { whatsapp: 'ch-wa', instagram: 'ch-ig', email: 'ch-mail', portal: 'ch-portal' };
  var CH_ABBR = { whatsapp: 'W', instagram: 'IG', email: '@', portal: 'P' };
  function initials(n) { return n.split(' ').filter(Boolean).map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase(); }
  function threadsFor(c) {
    var all = D.messages.slice().sort(function (a, b) { return b.at.localeCompare(a.at); });
    if (c.roleId === 'owner' || c.roleId === 'sales_admin') return all;
    if (c.role.group === 'customer') return all.filter(function (m) { var k = m.contactId && D.byId(D.contacts, m.contactId); return k && k.userId === c.user.id; });
    return all.filter(function (m) { return m.owner === c.user.id; });
  }
  function fmtTime(iso) { var d = new Date(iso); var day = iso.slice(0, 10); return day === U.today() ? D.fmtDate(iso, 'time') : D.fmtDate(day, 'short'); }
  L.register('messages', {
    title: 'Mensajes', titleEs: 'Mensajes', icon: icon('message-circle'), groups: ['staff', 'vendor'],
    render: function (c) {
      var all = threadsFor(c);
      var list = st.msgFilter === 'all' ? all : all.filter(function (m) { return m.channel === st.msgFilter; });
      var cur = D.byId(D.messages, st.thread) || list[0] || all[0];
      var unread = all.filter(function (m) { return m.unread; }).length, drafts = all.filter(function (m) { return m.aiDraft && m.aiDraft.status === 'pendiente'; }).length;
      var filters = [['all', 'Todos'], ['whatsapp', 'WhatsApp'], ['email', 'Correo'], ['instagram', 'Instagram'], ['portal', 'Portales']];
      var listHtml = list.length ? list.map(function (m) {
        var last = m.thread[m.thread.length - 1]; var l = m.listingId && D.listing(m.listingId);
        return '<button class="thread' + (cur && cur.id === m.id ? ' is-active' : '') + '" data-action="msg-open" data-id="' + m.id + '"><span class="avatar">' + esc(initials(m.name)) + '<span class="ch ' + CH_CLS[m.channel] + '">' + CH_ABBR[m.channel] + '</span></span><div style="min-width:0"><div class="t-name"><span class="truncate">' + esc(m.name) + '</span>' + (m.aiDraft && m.aiDraft.status === 'pendiente' ? '<span class="badge badge-ai" style="font-size:10px">AI</span>' : '') + '</div><div class="t-snip">' + (l ? '<b>' + esc(l.title.split(' · ')[0]) + '</b> · ' : '') + esc(last.text) + '</div></div><div><div class="t-time">' + esc(fmtTime(m.at)) + '</div>' + (m.unread ? '<div class="t-unread"></div>' : '') + '</div></button>';
      }).join('') : '<div class="empty">' + icon('inbox') + '<span>Sin conversaciones en este canal.</span></div>';
      var convo = '';
      if (cur) {
        var contact = cur.contactId && D.byId(D.contacts, cur.contactId); var l = cur.listingId && D.listing(cur.listingId);
        convo = '<div class="convo-head"><button class="btn btn-ghost btn-icon convo-back" data-action="msg-back" aria-label="Volver">' + icon('arrow-left') + '</button><span class="avatar">' + esc(initials(cur.name)) + '</span><div class="flex-1" style="min-width:0"><div class="name">' + esc(cur.name) + ' <span class="pill" style="font-size:10px">' + esc(U.channelLabel(cur.channel)) + '</span>' + (cur.lang === 'en' ? ' <span class="pill pill-info" style="font-size:10px">EN</span>' : '') + '</div><div class="sub truncate">' + (contact ? esc(contact.kind) + ' · ' + esc(contact.stage) + ' · ' : '') + (l ? esc(l.title) : 'Sin inmueble asociado') + ' · asesor ' + esc(D.userName(cur.owner)) + '</div></div>' + (contact ? '<button class="btn btn-ghost btn-sm" data-action="open-contact" data-id="' + contact.id + '">' + icon('user') + ' Ficha</button>' : '') + (l ? '<button class="btn btn-ghost btn-sm" data-action="open-listing" data-id="' + l.id + '">' + icon('building') + '</button>' : '') + '</div>' +
          '<div class="convo-body">' + cur.thread.map(function (msg) { return '<div class="msg' + (msg.from === 'me' ? ' is-me' : '') + '">' + esc(msg.text) + '<time>' + esc(fmtTime(msg.at)) + (msg.ai ? ' · redactado por Llave, aprobado por ' + esc(U.firstName(D.userName(cur.owner))) : '') + '</time></div>'; }).join('') +
          (cur.aiDraft && cur.aiDraft.status === 'pendiente' ? '<div class="ai-suggest msg-ai"><div class="ai-suggest-head"><span class="spark"></span> Respuesta sugerida por Llave' + (cur.lang === 'en' ? ' · en inglés' : '') + '</div><div class="ai-suggest-body">' + esc(cur.aiDraft.text) + '</div><div class="ai-suggest-actions"><button class="btn btn-primary btn-sm" data-action="approve" data-kind="message" data-id="' + cur.id + '">' + icon('send') + ' Aprobar y enviar</button><button class="btn btn-secondary btn-sm" data-action="edit-draft" data-kind="message" data-id="' + cur.id + '">' + icon('edit') + ' Editar</button><button class="btn btn-ghost btn-sm" data-action="discard" data-kind="message" data-id="' + cur.id + '">Descartar</button></div><div class="ai-suggest-meta">' + esc(cur.aiDraft.meta || '') + '</div></div>' : '') +
          (cur.aiDraft && cur.aiDraft.status === 'descartado' ? '<div class="small muted" style="align-self:flex-end">Borrador de Llave descartado · <button class="btn btn-ghost btn-sm" data-action="msg-redraft" data-id="' + cur.id + '">' + icon('sparkles', 'ico-sm') + ' Pedir otro</button></div>' : '') + '</div>' +
          '<div class="convo-foot"><button class="btn btn-ghost btn-icon" data-action="msg-redraft" data-id="' + cur.id + '" aria-label="Redactar con Llave" title="Redactar con Llave">' + icon('sparkles') + '</button><input class="input" id="msgInput" placeholder="Escribe a ' + esc(U.firstName(cur.name)) + '…"><button class="btn btn-primary btn-icon" data-action="msg-send" data-id="' + cur.id + '" aria-label="Enviar">' + icon('send') + '</button></div>';
      } else convo = '<div class="empty" style="flex:1">' + icon('inbox') + '<span>Elige una conversación.</span></div>';
      return header('Mensajes', 'Bandeja unificada: WhatsApp, correo, Instagram y portales · ' + unread + ' sin leer · ' + drafts + ' respuestas de Llave por aprobar', '<button class="btn btn-secondary btn-sm" data-action="open-approvals">' + icon('bell') + ' Aprobar todo lo pendiente</button>') +
        '<div class="inbox' + (st.showConvo ? ' show-convo' : '') + '"><div class="inbox-list"><div class="inbox-filters">' + filters.map(function (f) { return '<button class="chip' + (st.msgFilter === f[0] ? ' is-active' : '') + '" data-action="msg-filter" data-f="' + f[0] + '">' + esc(f[1]) + '</button>'; }).join('') + '</div><div style="overflow-y:auto;max-height:640px">' + listHtml + '</div></div><div class="convo">' + convo + '</div></div>';
    },
    mount: function (root) {
      var body = root.querySelector('.convo-body'); if (body) body.scrollTop = body.scrollHeight;
      var inp = root.querySelector('#msgInput'); if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var b = root.querySelector('[data-action="msg-send"]'); if (b) b.click(); } });
    }
  });
  L.action('msg-open', function (d) { st.thread = d.id; st.showConvo = true; var m = D.byId(D.messages, d.id); if (m) m.unread = false; L.rerender(); });
  L.action('msg-back', function () { st.showConvo = false; L.rerender(); });
  L.action('msg-filter', function (d) { st.msgFilter = d.f; L.rerender(); });
  L.action('msg-send', function (d) {
    var m = D.byId(D.messages, d.id); var inp = document.getElementById('msgInput'); if (!m || !inp || !inp.value.trim()) return;
    m.thread.push({ from: 'me', text: inp.value.trim(), at: new Date().toISOString() }); m.at = new Date().toISOString();
    D.toast('Enviado', 'Mensaje a ' + m.name + ' por ' + U.channelLabel(m.channel), 'success'); L.rerender();
  });
  L.action('msg-redraft', function (d) {
    var m = D.byId(D.messages, d.id); if (!m) return;
    var last = m.thread[m.thread.length - 1];
    m.aiDraft = { status: 'pendiente', text: (m.lang === 'en' ? 'Thanks for your message! ' : '¡Gracias por escribir! ') + (m.lang === 'en' ? 'I’m checking this with the team and will get back to you today with the details' : 'Estoy confirmando el detalle con el equipo y te respondo hoy mismo') + (m.listingId && D.listing(m.listingId) ? (m.lang === 'en' ? ' about ' : ' sobre ') + D.listing(m.listingId).title : '') + '.', meta: 'Redactado a partir de: «' + last.text.slice(0, 60) + '…»' };
    D.toast('Llave redactó una respuesta', 'Revísala antes de enviar.', 'ai'); L.rerender();
  });

  /* ======================================================================
     WIDGETS
     ====================================================================== */
  function monthOf(iso) { return iso.slice(0, 7); }
  L.registerWidget('kpi-revenue', {
    title: 'Ingresos y comisiones', size: 'md', link: 'money',
    render: function (c) {
      var k = D.kpis;
      var months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
      var series = [118, 96, 142, 131, 164, k.commissionProjectedMonthCOP / 1e6];
      var collected = sum(D.payouts.filter(function (p) { return p.kind === 'ingreso' && p.status === 'pagado' && monthOf(p.date) === monthOf(U.today()); }), function (p) { return p.amount; });
      var pending = D.payouts.filter(function (p) { return p.status === 'pendiente' && !p.projected; });
      return '<div class="stat-pair"><div class="stat"><span class="stat-label">Comisión proyectada · ' + esc(new Date(U.today() + 'T12:00:00').toLocaleDateString('es-CO', { month: 'long' })) + '</span><span class="stat-value display money">' + esc(D.fmtCOP(k.commissionProjectedMonthCOP, { compact: true })) + '</span><span class="stat-delta up">+' + Math.round((series[5] / series[4] - 1) * 100) + ' % vs. agosto</span></div><div class="stat" style="text-align:right"><span class="stat-label">Cobrado este mes</span><span class="stat-value money" style="font-size:var(--fs-lg)">' + esc(D.fmtCOP(collected, { compact: true })) + '</span><span class="stat-delta">' + pending.length + ' pagos pendientes</span></div></div><div class="spark">' + L.chart.sparkline(series) + '</div><div class="row row-between kicker"><span>' + months.map(function (m) { return new Date(m + '-15T12:00:00').toLocaleDateString('es-CO', { month: 'short' }); }).join(' · ') + '</span><span>en millones COP</span></div>';
    }
  });
  L.registerWidget('kpi-pipeline', {
    title: 'Pipeline', size: 'md', link: 'crm-sell',
    render: function (c) {
      var k = D.kpis;
      var stages = D.pipelineStages.map(function (s) { return { label: s.label, value: D.listings.filter(function (l) { return l.stage === s.id; }).length }; }).filter(function (x) { return x.value; });
      var pal = ['var(--brand)', 'var(--brand-3)', 'var(--accent)', 'var(--warn)', 'var(--info)', 'var(--ai)', 'var(--text-3)'];
      return '<div class="stat-pair"><div class="stat"><span class="stat-label">Valor en pipeline</span><span class="stat-value display money">' + esc(D.fmtCOP(k.pipelineValueCOP, { compact: true })) + '</span><span class="stat-delta up">' + k.listingsUnderOffer + ' bajo oferta · ' + k.toursThisWeek + ' recorridos esta semana</span></div></div><div class="donut-wrap">' + L.chart.donut(stages, { center: D.listings.length }) + '<div class="legend">' + stages.map(function (s, i) { return '<span><i style="--c:' + pal[i % pal.length] + '"></i>' + esc(s.label) + '<b>' + s.value + '</b></span>'; }).join('') + '</div></div>';
    }
  });
  L.registerWidget('approvals-queue', {
    title: 'Por aprobar', size: 'xl',
    render: function (c) {
      var list = U.approvals(c);
      if (!list.length) return '<div class="empty">' + icon('check-circle') + '<b>Todo aprobado</b><span>Llave no tiene borradores esperándote.</span></div>';
      return '<div class="row row-between"><span class="small" style="color:var(--text-2)"><b>' + list.length + '</b> borradores de Llave esperan una decisión humana.</span><button class="btn btn-ghost btn-sm" data-action="open-approvals">Ver bandeja ' + icon('chevron-right') + '</button></div><div class="list cols-2">' + list.slice(0, 6).map(function (a) { var l = a.listingId && D.listing(a.listingId); return '<div class="list-item is-ai"><div class="body"><div class="title truncate">' + esc(a.title) + '</div><div class="meta"><span>' + esc(a.kindLabel) + '</span><span>·</span><span>' + esc(D.userName(a.who)) + '</span>' + (l ? '<span>·</span><span class="truncate">' + esc(l.city) + '</span>' : '') + '</div></div><div class="actions"><button class="btn btn-primary btn-sm" data-action="approve" data-kind="' + a.kind + '" data-id="' + a.id + '">' + icon('check') + ' Aprobar</button><button class="btn btn-ghost btn-sm" data-action="edit-draft" data-kind="' + a.kind + '" data-id="' + a.id + '" aria-label="Editar">' + icon('edit') + '</button><button class="btn btn-ghost btn-sm" data-action="discard" data-kind="' + a.kind + '" data-id="' + a.id + '" aria-label="Descartar">' + icon('x') + '</button></div></div>'; }).join('') + '</div>' + (list.length > 6 ? '<div class="kicker">+' + (list.length - 6) + ' más en la bandeja</div>' : '');
    }
  });
  // Stylized schematic map of Antioquia (no external tiles). Coordinates are illustrative.
  // [x, y, label side: r|l|b]
  var MAP_POS = { 'Medellín': [186, 180, 'l'], 'Envigado': [198, 202, 'l'], 'Rionegro': [242, 192, 'r'], 'El Retiro': [222, 220, 'b'], 'Guarne': [228, 158, 'r'], 'Guatapé': [276, 170, 'r'] };
  L.registerWidget('listings-map', {
    title: 'Inmuebles en el mapa', size: 'md', link: 'listings',
    render: function (c) {
      var by = {}; D.listings.forEach(function (l) { (by[l.city] = by[l.city] || []).push(l); });
      var far = Object.keys(by).filter(function (k) { return !MAP_POS[k]; });
      var pins = Object.keys(MAP_POS).filter(function (k) { return by[k]; }).map(function (k) {
        var p = MAP_POS[k], ls = by[k], rent = ls.every(function (l) { return l.operacion === 'arriendo'; }); var r = 6 + Math.min(6, ls.length * 1.2);
        var lx = p[2] === 'l' ? p[0] - r - 4 : p[2] === 'b' ? p[0] : p[0] + r + 4, ly = p[2] === 'b' ? p[1] + r + 10 : p[1] + 3.5, anchor = p[2] === 'l' ? 'end' : p[2] === 'b' ? 'middle' : 'start';
        return '<g class="map-pin" data-action="map-zone" data-zone="' + esc(k) + '" style="cursor:pointer"><title>' + esc(k) + ' · ' + ls.length + ' inmuebles · ' + esc(D.fmtCOP(sum(ls.filter(function (l) { return l.currency === 'COP' && l.operacion === 'venta'; }), function (l) { return l.price; }), { compact: true })) + '</title><circle class="map-halo" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r + 4) + '"/><circle class="map-dot' + (rent ? ' is-rent' : '') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '"/><text class="map-count" x="' + p[0] + '" y="' + (p[1] + 3.2) + '">' + ls.length + '</text><text class="map-label' + (k === 'Medellín' || k === 'Guatapé' ? ' is-big' : '') + '" text-anchor="' + anchor + '" x="' + lx + '" y="' + ly + '">' + esc(k) + '</text></g>';
      }).join('');
      var svg = '<svg viewBox="40 15 300 285" role="img" aria-label="Mapa esquemático de Antioquia con inmuebles por zona"><defs><pattern id="mapHatch" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 6 0" stroke="var(--brand-2)" stroke-width="0.4" opacity="0.35"/></pattern></defs>' +
        '<path class="map-land" d="M70 40 L110 25 L150 55 L190 60 L230 40 L290 45 L320 80 L330 140 L320 200 L290 250 L250 290 L200 275 L150 250 L100 225 L70 180 L55 120 L65 70 Z"/>' +
        '<path d="M70 40 L110 25 L150 55 L190 60 L230 40 L290 45 L320 80 L330 140 L320 200 L290 250 L250 290 L200 275 L150 250 L100 225 L70 180 L55 120 L65 70 Z" fill="url(#mapHatch)" stroke="none"/>' +
        '<path class="map-water" d="M280 182 c8 -6 18 -4 22 2 c5 6 -2 12 6 16 c8 4 6 12 -2 14 c-8 2 -12 -6 -20 -4 c-8 2 -14 -4 -12 -12 c1 -6 3 -12 6 -16 z"/>' +
        '<path class="map-road" d="M186 180 C 210 172, 245 160, 276 170"/><path class="map-road" d="M186 180 C 205 192, 225 198, 242 192"/><path class="map-road" d="M186 180 L 160 100 L 110 60"/><path class="map-road" d="M242 192 C 240 220, 245 250, 250 290"/>' +
        '<text class="map-region" x="100" y="130">Antioquia</text><text class="map-label" x="284" y="222" style="fill:var(--info)">Embalse</text><text class="map-label" x="95" y="38">Urabá</text><text class="map-label" x="280" y="100">Bajo Cauca</text><text class="map-label" x="150" y="270">Suroeste</text>' + pins + '</svg>';
      return '<div class="map-wrap">' + svg + '</div><div class="row row-between"><div class="map-legend"><span><i style="background:var(--accent)"></i>Venta</span><span><i style="background:var(--brand-2)"></i>Arriendo</span><span><i style="background:var(--info)"></i>Embalse de Guatapé</span></div><div class="map-far">' + far.map(function (k) { return '<button class="chip" data-action="map-zone" data-zone="' + esc(k) + '">' + icon('map-pin', 'ico-sm') + esc(k) + (by[k][0].country ? ', ' + esc(by[k][0].country) : '') + ' <b>' + by[k].length + '</b></button>'; }).join('') + '</div></div>';
    }
  });
  L.action('map-zone', function (d) {
    var ls = D.listings.filter(function (l) { return l.city === d.zone; }); if (!ls.length) return;
    L.openDrawer('<p class="small muted">' + ls.length + ' inmuebles · ' + esc(D.fmtCOP(sum(ls.filter(function (l) { return l.currency === 'COP' && l.operacion === 'venta'; }), function (l) { return l.price; }), { compact: true })) + ' en venta · ' + sum(ls, function (l) { return l.leads; }) + ' leads</p><div class="stack stack-sm">' + ls.map(function (l) { return U.listingMini(l); }).join('') + '</div>', { title: d.zone });
  });
  L.registerWidget('team-activity', {
    title: 'Actividad del equipo', size: 'md',
    render: function (c) {
      var feed = [];
      D.deals.forEach(function (d) { (d.timeline || []).forEach(function (s) { if (s.done && s.at) feed.push({ at: s.at, who: d.parties.listingBroker, what: s.label, ai: s.ai }); }); });
      D.payouts.forEach(function (p) { if (p.status === 'pagado' && p.date <= U.today()) feed.push({ at: p.date, who: 'u-acct', what: (p.kind === 'ingreso' ? 'Registró ingreso · ' : 'Pagó · ') + p.concept + ' · ' + D.fmtCOP(p.amount, { compact: true }) }); });
      D.tasks.forEach(function (t) { if (t.status === 'listo') feed.push({ at: t.due, who: t.assignee, what: 'Completó: ' + t.title, ai: t.aiDrafted }); });
      D.messages.forEach(function (m) { m.thread.forEach(function (x) { if (x.from === 'me') feed.push({ at: x.at.slice(0, 10), who: m.owner, what: 'Respondió a ' + m.name + ' por ' + U.channelLabel(m.channel), ai: x.ai }); }); });
      feed.sort(function (a, b) { return b.at.localeCompare(a.at); });
      return '<div class="feed">' + feed.slice(0, 6).map(function (f) { var u = D.user(f.who); return '<div class="feed-item"><span class="avatar avatar-sm">' + esc(u ? u.initials : '?') + '</span><div><span class="who">' + esc(u ? U.firstName(u.name) : '—') + '</span> <span class="what">' + esc(f.what) + '</span>' + (f.ai ? ' <span class="badge badge-ai" style="font-size:10px">con Llave</span>' : '') + '</div><time>' + esc(U.relDay(f.at)) + '</time></div>'; }).join('') + '</div>';
    }
  });
  L.registerWidget('ai-digest', {
    title: 'Resumen de Llave', size: 'xl',
    render: function (c) {
      var k = D.kpis, apps = U.approvals(c), evs = U.events(c).filter(function (e) { return e.date === U.today(); });
      var offers = D.deals.filter(function (d) { return d.status === 'bajo oferta'; });
      var newLeads = D.contacts.filter(function (x) { return x.lastTouch === U.today(); }).length;
      var expiring = D.documents.filter(function (d) { return d.status === 'vencido'; });
      var p = 'Buenos días, <b>' + esc(U.firstName(c.user.name)) + '</b>. Hay <b>' + k.listingsActive + ' inmuebles activos</b> y <b>' + offers.length + ' negocios bajo oferta</b> por ' + esc(D.fmtCOP(sum(offers, function (d) { return d.offerPrice || 0; }), { compact: true })) + '. ' +
        (offers[0] ? 'La contraoferta de <b>' + esc(D.listing(offers[0].listingId).title) + '</b> está redactada y espera tu aprobación; ' : '') +
        'llegaron <b>' + newLeads + ' leads nuevos</b> hoy, ' + (newLeads ? 'ya con primer contacto sugerido. ' : '') +
        (expiring.length ? '<mark>Ojo:</mark> el ' + esc(expiring[0].name.toLowerCase()) + ' de ' + esc(D.listing(expiring[0].listingId).title) + ' está vencido y la notaría exige uno de menos de 30 días. ' : '') +
        'En escrow hay <b>' + esc(D.fmtCOP(D.escrowSummary.held, { compact: true })) + '</b> con ' + D.escrowSummary.pendingReleases + ' liberaciones pendientes de la contadora. ' +
        (evs.length ? 'Hoy tienes <b>' + evs.length + ' eventos</b>' + (evs[0] ? ' — el primero: ' + esc(evs[0].title) : '') + '. ' : 'Agenda despejada para hoy. ') +
        'Dejé <b>' + apps.length + ' borradores</b> listos para que decidas.';
      return '<div class="digest"><p>' + p + '</p><div class="digest-side"><span class="badge badge-ai" style="align-self:flex-start">Generado por Llave · ' + esc(D.fmtDate(U.today(), 'short')) + ' 6:30</span><button class="btn btn-primary btn-sm" data-action="open-approvals">' + icon('check') + ' Revisar ' + apps.length + ' borradores</button><button class="btn btn-secondary btn-sm" data-action="open-voice" data-intent="read_pipeline">' + icon('volume') + ' Escuchar resumen</button><button class="btn btn-ghost btn-sm" data-action="demo-toast" data-title="Marcado como leído" data-body="Mañana a las 6:30 llega el siguiente." data-variant="ai">Marcar como leído</button></div></div>';
    }
  });
  L.registerWidget('today-agenda', {
    title: 'Hoy y mañana', size: 'md', link: 'calendar',
    render: function (c) {
      var evs = U.events(c).filter(function (e) { return e.date >= U.today() && e.date <= U.addDays(U.today(), 2); });
      if (!evs.length) return '<div class="empty">' + icon('calendar') + '<span>Nada agendado para hoy ni mañana.</span></div>';
      return '<div class="list">' + evs.slice(0, 5).map(function (e) { return '<div class="list-item is-clickable' + (e.ai ? ' is-ai' : '') + '" data-action="cal-open" data-id="' + esc(e.id) + '"><span class="pill ' + (e.kind === 'tour' || e.kind === 'visit' ? 'pill-accent' : e.kind === 'shoot' ? 'pill-info' : 'pill-brand') + '" style="min-width:62px;justify-content:center">' + (e.time || U.relDay(e.date)) + '</span><div class="body"><div class="title truncate">' + esc(e.title) + '</div><div class="meta">' + esc(KIND_LABEL[e.kind]) + ' · ' + esc(U.relDay(e.date)) + ' · ' + esc(e.meta) + '</div></div>' + icon('chevron-right') + '</div>'; }).join('') + '</div>';
    }
  });
  L.registerWidget('voice-quick', {
    title: 'Pídeselo a Llave', size: 'sm',
    render: function (c) {
      var mine = D.voiceIntents.filter(function (v) { return v.role === c.roleId; }); if (mine.length < 3) mine = mine.concat(D.voiceIntents.filter(function (v) { return v.role !== c.roleId; })).slice(0, 3);
      return '<div class="voice-quick"><button class="voice-orb voice-orb-lg" data-action="open-voice" aria-label="Hablar con Llave">' + icon('mic') + '</button><span class="kicker">Toca y habla, o prueba:</span><div class="chips">' + mine.slice(0, 3).map(function (v) { return '<button class="chip" data-action="open-voice" data-intent="' + esc(v.intent) + '">' + icon('mic', 'ico-sm') + '<span>' + esc(v.say.replace(/^Llave,\s*/i, '')) + '</span></button>'; }).join('') + '</div></div>';
    }
  });
  L.registerWidget('tasks-due', {
    title: 'Tareas por vencer', size: 'md', link: 'projects',
    render: function (c) {
      var mine = (c.roleId === 'owner' || c.roleId === 'sales_admin') ? D.tasks : D.tasksFor(c.user.id);
      var list = mine.filter(function (t) { return t.status !== 'listo' && !t.discarded && t.due <= U.addDays(U.today(), 7); }).sort(function (a, b) { return a.due.localeCompare(b.due); });
      if (!list.length) return '<div class="empty">' + icon('check-circle') + '<span>Nada vence en los próximos 7 días.</span></div>';
      return '<div class="list">' + list.slice(0, 6).map(function (t) { var late = t.due < U.today(); return '<div class="list-item is-clickable' + (t.aiDrafted ? ' is-ai' : '') + '" data-action="open-task" data-id="' + t.id + '"><div class="body"><div class="title truncate">' + esc(t.title) + '</div><div class="meta"><span class="badge badge-status" data-status="' + esc(t.status === 'bloqueado' ? 'rechazado' : t.status === 'revisión' ? 'pendiente' : t.status === 'en curso' ? 'en preparación' : t.status) + '" style="font-size:10px">' + esc(t.status) + '</span><span>' + esc(D.userName(t.assignee)) + '</span>' + (t.aiDrafted ? badgeAI().replace('badge-ai"', 'badge-ai" style="font-size:10px"') : '') + '</div></div><span class="pill ' + (late ? 'pill-danger' : t.due === U.today() ? 'pill-accent' : '') + '">' + esc(U.relDay(t.due)) + '</span></div>'; }).join('') + '</div>';
    }
  });
})();
