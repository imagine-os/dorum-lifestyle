/* ==========================================================================
   Llave OS · shared language state (ES / EN)
   Plain script, no modules. Load right after assets/data.js on every page.
   Exposes ONE global: window.I18N

     I18N.lang                    'es' | 'en' (persisted in localStorage['llave-lang'])
     I18N.set(lang)               switch language, persist, apply(), notify listeners
     I18N.t(key, fallback)        lookup in I18N.dict.site (sales-site copy, ES) or [es,en] pairs
     I18N.apply(root)             translate [data-i18n*] elements; on pages with
                                  <html data-i18n-ui> also run the ES→EN text-node pass (I18N.dict.ui)
     I18N.onChange(fn)            fn(lang) after every switch
     I18N.toggleHtml(opts)        markup for the ES | EN pill (.lang-toggle); clicks are delegated
     I18N.tr(text)                translate one ES chrome string to EN (used by the text pass)
     I18N.pick(es, en)            return the string for the current language
     I18N.navLabel(id)            nav label for the app module ids (ES/EN)

   Sources of truth:
     · Sales site (index.html) is authored in EN; I18N.dict.site holds the ES copy per data-i18n key.
     · Tenant app (/app) is authored in ES; I18N.dict.ui is an ES→EN phrase dictionary applied
       to rendered text nodes, plus *En fields in data.js for data-level records.
     · Dorum site keeps its own [es,en] table (dorum/site.js) and sources the language from here.
   ========================================================================== */
(function () {
  'use strict';
  var KEY = 'llave-lang';
  var I = { dict: {} };

  /* ------------------------------------------------------------ language */
  function detect() {
    var saved = null;
    try { saved = localStorage.getItem(KEY) || localStorage.getItem('dorum-lang'); } catch (e) {}
    if (saved === 'es' || saved === 'en') return saved;
    var nl = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nl.indexOf('es') === 0 ? 'es' : 'en';
  }
  I.lang = detect();
  var listeners = [];
  I.onChange = function (fn) { if (typeof fn === 'function') listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; };
  I.pick = function (es, en) { return I.lang === 'en' ? (en != null ? en : es) : (es != null ? es : en); };
  I.set = function (lang) {
    lang = lang === 'en' ? 'en' : 'es';
    var changed = lang !== I.lang;
    I.lang = lang;
    try { localStorage.setItem(KEY, lang); localStorage.setItem('dorum-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;
    I.apply(document);
    if (changed) {
      listeners.slice().forEach(function (fn) { try { fn(lang); } catch (err) { console.error('I18N.onChange', err); } });
      try { document.dispatchEvent(new CustomEvent('llave:lang', { detail: lang })); } catch (e) {}
    }
  };
  I.toggle = function () { I.set(I.lang === 'en' ? 'es' : 'en'); };

  /* -------------------------------------------------------------- toggle */
  I.toggleHtml = function (opts) {
    opts = opts || {};
    var cls = 'lang-toggle' + (opts.size ? ' lang-toggle-' + opts.size : '') + (opts.dark ? ' lang-toggle-dark' : '') + (opts.cls ? ' ' + opts.cls : '');
    function b(l) { return '<button type="button" data-lang-set="' + l + '" aria-pressed="' + (I.lang === l) + '" lang="' + l + '" title="' + (l === 'es' ? 'Español' : 'English') + '">' + l.toUpperCase() + '</button>'; }
    return '<div class="' + cls + '" role="group" aria-label="Idioma / Language" translate="no">' + b('es') + b('en') + '</div>';
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang-set]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    I.set(b.getAttribute('data-lang-set'));
  }, true);
  function syncToggles(root) {
    (root || document).querySelectorAll('[data-lang-set]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === I.lang)); });
    (root || document).querySelectorAll('[data-lang-toggle]').forEach(function (slot) {
      if (!slot.querySelector('.lang-toggle')) slot.innerHTML = I.toggleHtml({ size: slot.getAttribute('data-lang-toggle') || '' });
    });
  }

  /* -------------------------------------------------------------- lookup */
  // dict.site[key] is the ES copy (string, may contain inline HTML) or an [es, en] pair.
  I.t = function (key, fallback) {
    var v = I.dict.site && I.dict.site[key];
    if (v == null) return fallback != null ? fallback : key;
    if (Object.prototype.toString.call(v) === '[object Array]') return I.lang === 'en' ? v[1] : v[0];
    return I.lang === 'es' ? v : (fallback != null ? fallback : key);
  };
  I.navLabel = function (id) { var v = I.dict.nav && I.dict.nav[id]; return v ? (I.lang === 'en' ? v[1] : v[0]) : id; };

  /* ------------------------------------------------- data-i18n elements */
  // Elements carry their source-language copy in the HTML. On first pass we remember it
  // (data-i18n-src) so toggling back restores it without a reload.
  function applyKeyed(root) {
    var site = I.dict.site || {};
    function each(sel, get, setv) {
      root.querySelectorAll(sel).forEach(function (el) {
        var key = el.getAttribute(sel.slice(1, -1));
        if (!(key in site)) return; // not ours (e.g. Dorum site keys) → leave alone
        var attr = sel.slice(1, -1) + '-src';
        if (!el.hasAttribute(attr)) el.setAttribute(attr, get(el));
        var v = site[key], out;
        if (Object.prototype.toString.call(v) === '[object Array]') out = I.lang === 'en' ? v[1] : v[0];
        else out = I.lang === 'es' ? v : el.getAttribute(attr);
        if (get(el) !== out) setv(el, out);
      });
    }
    each('[data-i18n]', function (el) { return el.innerHTML; }, function (el, v) { el.innerHTML = v; });
    each('[data-i18n-ph]', function (el) { return el.getAttribute('placeholder') || ''; }, function (el, v) { el.setAttribute('placeholder', v); });
    each('[data-i18n-label]', function (el) { return el.getAttribute('aria-label') || ''; }, function (el, v) { el.setAttribute('aria-label', v); });
    each('[data-i18n-title]', function (el) { return el.getAttribute('title') || ''; }, function (el, v) { el.setAttribute('title', v); });
    if ((root === document || root === document.documentElement) && site['meta.title']) {
      if (!document.documentElement.hasAttribute('data-i18n-title-src')) document.documentElement.setAttribute('data-i18n-title-src', document.title);
      document.title = I.lang === 'es' ? site['meta.title'] : document.documentElement.getAttribute('data-i18n-title-src');
    }
  }

  /* --------------------------------------------- ES → EN text-node pass */
  var lower = null, memo = {};
  function buildLower() {
    lower = {};
    var ui = I.dict.ui || {};
    Object.keys(ui).forEach(function (k) { var lk = k.toLowerCase(); if (!(lk in lower)) lower[lk] = ui[k]; });
  }
  function matchCase(src, out) {
    if (!out) return out;
    var f = src.charAt(0);
    if (f === f.toUpperCase() && f !== f.toLowerCase()) return out.charAt(0).toUpperCase() + out.slice(1);
    if (f === f.toLowerCase() && f !== f.toUpperCase() && out.charAt(0) === out.charAt(0).toUpperCase()) {
      // keep proper nouns capitalised (dict keys starting upper-case stay as written)
      return out;
    }
    return out;
  }
  function direct(s) {
    var ui = I.dict.ui || {};
    if (ui[s] != null) return ui[s];
    if (!lower) buildLower();
    var l = lower[s.toLowerCase()];
    if (l != null) {
      var f = s.charAt(0);
      // source starts lower-case (e.g. "pagos pendientes" after a count) → keep the output lower-case too
      if (f === f.toLowerCase() && f !== f.toUpperCase() && !/^(Llave|Dorum|WhatsApp|Meta|Google|Instagram|DIAN|IPC|CPL|COP|US|AI|Finca Raíz|Wasi|Metrocuadrado|Bancolombia|PILA|Guatap|Medell|El |La |Los |Las )/.test(l)) return l.charAt(0).toLowerCase() + l.slice(1);
      return matchCase(s, l);
    }
    return null;
  }
  var SEPS = [' · ', ' — ', ' / ', ' → ', ' ↔ '];
  // Rules run on a trimmed string; each returns a translation or null.
  var RULES = [
    // trailing punctuation / ellipsis
    [/^(.+?)([.:…!?]+)$/, function (m) { var t = tr(m[1], 1); return t == null ? null : t + m[2]; }],
    // leading bullet / arrow / interrogation marks
    [/^([←→•·—–]\s*)(.+)$/, function (m) { var t = tr(m[2], 1); return t == null ? null : m[1] + t; }],
    [/^¿(.+)\?$/, function (m) { var t = tr(m[1], 1); return t == null ? null : t + '?'; }],
    [/^¡(.+)!$/, function (m) { var t = tr(m[1], 1); return t == null ? null : t + '!'; }],
    // "16 por aprobar", "3 eventos hoy", "7 inmuebles", "US$4 M en pipeline"
    [/^([+\-−]?\s?(?:US\$|COP\s*|\$)?[\d][\d.,]*(?:\s?(?:mil M|M|%|m²|ha|d|h|pax))?)\s+(.+)$/, function (m) { var t = tr(m[2], 1); return t == null ? null : m[1] + ' ' + t; }],
    // "Día 5", "Semana 3", "v2 · ..." — phrase + number
    [/^(.+?)\s+([\d][\d.,:/]*(?:\s?(?:%|M|m²|d|h))?)$/, function (m) { var t = tr(m[1], 1); return t == null ? null : t + ' ' + m[2]; }],
    // parentheses suffix "Remodelación (opcional)"
    [/^(.+?)\s+\((.+)\)$/, function (m) { var a = tr(m[1], 1), b = tr(m[2], 1); return a == null && b == null ? null : (a == null ? m[1] : a) + ' (' + (b == null ? m[2] : b) + ')'; }],
    // "hace 3 d" / "en 14 d" / "En 2 d"
    [/^hace (\d+) ?d$/i, function (m) { return m[1] + ' d ago'; }],
    [/^en (\d+) ?d$/i, function (m) { return matchCase(m[0], 'in ' + m[1] + ' d'); }],
    [/^(\d+) ?d$/, function (m) { return m[1] + ' d'; }],
    // spanish dates that did not flow through fmtDate: "16 de sept", "16 de sept de 2026", "sáb 19 sep 10:00"
    [/^(\d{1,2}) de ([a-záéíóú]+)\.?(?: de (\d{4}))?$/i, function (m) { var mo = MONTHS[m[2].toLowerCase().replace('.', '')]; if (!mo) return null; return m[1] + ' ' + mo + (m[3] ? ' ' + m[3] : ''); }],
    [/^([a-záéíóú]+),? (\d{1,2}) de ([a-záéíóú]+)(?: de (\d{4}))?$/i, function (m) { var wd = DAYS[m[1].toLowerCase()], mo = MONTHS[m[3].toLowerCase()]; if (!wd || !mo) return null; return wd + ', ' + m[2] + ' ' + mo + (m[4] ? ' ' + m[4] : ''); }],
    [/^([a-záéíóú]{3}) (\d{1,2}) ([a-záéíóú]{3})( \d{1,2}:\d{2})?$/i, function (m) { var wd = DAYS[m[1].toLowerCase()], mo = MONTHS[m[3].toLowerCase()]; if (!wd || !mo) return null; return wd.slice(0, 3) + ' ' + m[2] + ' ' + mo + (m[4] || ''); }],
    [/^([a-záéíóú]+) (?:de )?(\d{4})$/i, function (m) { var mo = MONTHS[m[1].toLowerCase()]; return mo ? MONTHS_LONG[mo] + ' ' + m[2] : null; }],
    // prefixes whose remainder is free text (names, listing titles…)
    [/^(Respuesta a|Subir|Ver|Aprobar|Pedir|Para|Hola|Completó:|Pagado el|Pagada el|Pagado|Pagada|pagado|Actualizado|Enviada el|Enviado el|Firmado electrónicamente el|Tu primer canon vence el|Tu conversación con|Responde la oferta de|Primer canon el|Empieza en|prospecto|asesor|asesora|próxima|próximo|Próxima:|Próximo check-in:|Inicio|Fin|Escritura|Fecha|Vence|vence|hasta|Hasta|antes del|Orden en curso:|Tu asesor:|Plantilla:|Tarea ·|Contrato ·|Mensaje ·|revisado por|referido|Tour|Visita|Recorrido ·|Captación ·|Comisión|Propietario|Propietaria|Oferta|Contraofertar|Pagar|Nuevo|Nueva|Cotización|Día|Semana|Entrega|Salida|Entrada|Contraoferta|Cierre|Firma|Publicado en|Publicado|Publicada|Recibido|Recibida|Retiraste tu oferta por|Escríbele a|Escribe a|Responde la oferta de|Respondió a|Liquidación|Liquidaciones|Ingresos|Comisiones|Leads|Vistas|Vistas por semana ·|Próxima visita:|Próximos|Próximas|Pendiente ·|Pendientes|Validado|Vencido|Rango|Todos|Todas|Mis|Mi|Tu|Tus|Nuevos|Nuevas|Aceptar|Rechazar|Revisar|Editar|Descartar|Enviar|Guardar|Crear|Abrir|Registrar|Programar|Agendar|Ordenar|Publicar|Retirar|Liberar|Cotizar|Solicitar|Reportar|Confirmar|Cancelar|Cambiar|Quitar|Marcar|Descargar|Exportar|Generar|Usar|Aplicar|Validar|Sugerir|Preparar|Traducir|Redactar|Proponer|Comparar|Explorar|Escuchar|Pausar|Activar|Mantener|Mejorar|Renovar|Firmar|Bloquear|Reservar|Volver a|Ir a|Hablar con|Preguntar a|Pídeselo a|Avísame|Notificar a|Asignar a|Recordar a|Recordatorio|Seguimiento|Sesión|Reel|Campaña|Pauta|Redacción|Fotografía|Fotos|Creativos|Comps|Cotizaciones|Órdenes|Orden|Ticket|Tickets|Inventario|Contrato|Documentos|Documento|Extracto|Recibo|Pago|Pagos|Depósito|Arras|Canon|Fee|Honorario|Salario|Nómina|Retención|IVA)\s+(.+)$/, function (m) {
      var head = tr(m[1], 1); if (head == null) return null;
      var rest = tr(m[2], 1);
      return head + ' ' + (rest == null ? m[2] : rest);
    }],
    // suffix patterns
    [/^(.+?)\s+(por aprobar|por revisar|por vencer|por cobrar|por validar|por firmar|por subir|por liberar|por aceptar|pendiente|pendientes|hoy|mañana|ayer|listos?|realizad[oa]s?|agendad[oa]s?|firmad[oa]s?|aprobad[oa]s?|recibid[oa]s?|validad[oa]s?|vencid[oa]s?|activ[oa]s?|nuev[oa]s?|del mes|de la semana|de hoy|esta semana|este mes|en curso|en revisión|en escrow|en pipeline|al cierre|al listar|al mes|por mes|por noche|por persona|por grupo|por semana|por inmueble|por negocio|por zona|por etapa|incluido|opcional|confirmad[oa]|proyectad[oa]s?|estimad[oa]s?|sugerid[oa]s?|redactad[oa]s?|cambiar|\+ IVA|mensual|anual)$/i, function (m) {
      var a = tr(m[1], 1), b = tr(m[2], 1); if (a == null && b == null) return null;
      return (a == null ? m[1] : a) + ' ' + (b == null ? m[2] : b);
    }],
    // trailing separator "Venta ·" / quotes «…»
    [/^(.+?)\s*·$/, function (m) { var t = tr(m[1], 1); return t == null ? null : t + ' ·'; }],
    [/^«(.+)»$/, function (m) { var t = tr(m[1], 1); return t == null ? null : '«' + t + '»'; }],
    // "en 8 semanas", "en 5 campañas", "con Mateo", "de captación"
    [/^en (\d+) (.+)$/, function (m) { var t = tr(m[2], 1); return 'in ' + m[1] + ' ' + (t == null ? m[2] : t); }],
    [/^con ([A-ZÁÉÍÓÚ][\wáéíóúñ]*(?: [A-ZÁÉÍÓÚ][\wáéíóúñ]*)*)$/, function (m) { return 'with ' + m[1]; }],
    [/^(\$[\d.,]+ (?:mil M|M)) de (\$[\d.,]+ (?:mil M|M))$/, function (m) { return m[1] + ' of ' + m[2]; }],
    [/^(\$[\d.,]+) liquidados en (\d+) meses$/, function (m) { return m[1] + ' paid out over ' + m[2] + ' months'; }],
    [/^([\d.,]+ %) bajo tu precio de (.+)$/, function (m) { return m[1] + ' below your price of ' + m[2]; }],
    [/^Hola ([^,.]+), así va la venta de$/, function (m) { return 'Hi ' + m[1] + ', this is how the sale of'; }],
    [/^Hola ([^,.]+), así va$/, function (m) { return 'Hi ' + m[1] + ', this is how'; }],
    [/^Hola ([^,.]+), bienvenid[oa](?:\/a)? a$/, function (m) { return 'Hi ' + m[1] + ', welcome to'; }],
    [/^Hola ([^,.]+)\. Tu presupuesto registrado:$/, function (m) { return 'Hi ' + m[1] + '. Your registered budget:'; }],
    [/^(\d+) visitas? realizadas? y (\d+) agendadas? en$/, function (m) { return m[1] + ' visit' + (m[1] === '1' ? '' : 's') + ' done and ' + m[2] + ' scheduled at'; }],
    [/^Borrador de Llave listo para (.+)$/, function (m) { var t = tr(m[1], 1); return 'Llave draft ready for ' + (t == null ? m[1] : t); }],
    [/^Pedir recorrido de (.+)$/, function (m) { var t = tr(m[1], 1); return 'Request a tour of ' + (t == null ? m[1] : t); }],
    [/^Aprueba la cotización del? (.+)$/, function (m) { var t = tr(m[1], 1); return 'Approve the quote for ' + (t == null ? m[1] : t); }],
    [/^Tu oferta de (.+) está en manos del propietario$/, function (m) { return 'Your offer of ' + m[1] + ' is with the owner'; }],
    [/^Liquidaciones mensuales de tus (\d+) propiedades$/, function (m) { return 'Monthly payouts for your ' + m[1] + ' properties'; }],
    // "Respondió a Luisa por Correo" → channel suffix
    [/^(.+?) por (Correo|WhatsApp|Instagram|Portal|teléfono|correo)$/, function (m) { var a = tr(m[1], 1); var ch = { Correo: 'by email', correo: 'by email', WhatsApp: 'via WhatsApp', Instagram: 'via Instagram', Portal: 'via portal', 'teléfono': 'by phone' }[m[2]]; return (a == null ? m[1] : a) + ' ' + ch; }],
    // AI digest narrative fragments (core.js ai-digest widget, split by <b>)
    [/^por (\$[\d.,]+ (?:mil M|M))\. La contraoferta de$/, function (m) { return 'worth ' + m[1] + '. The counter-offer for'; }],
    [/^el (certificado de tradición y libertad|paz y salvo de administración|.+?) de (.+?) está vencido y la notaría exige uno de menos de 30 días\.$/, function (m) { var d = tr(m[1], 1), t = tr(m[2], 1); return 'the ' + (d == null ? m[1] : d) + ' for ' + (t == null ? m[2] : t) + ' has expired and the notary requires one under 30 days old.'; }],
    [/^con (\d+) liberaciones? pendientes? de la contadora\. (Agenda despejada para hoy\. )?(Dejé|Hoy tienes)$/, function (m) { return 'with ' + m[1] + ' release' + (m[1] === '1' ? '' : 's') + ' pending from the accountant. ' + (m[2] ? 'Clear calendar today. ' : '') + (m[3] === 'Dejé' ? 'I left' : 'Today you have'); }],
    [/^con (\d+) liberaciones? pendientes? de la contadora$/, function (m) { return 'with ' + m[1] + ' release' + (m[1] === '1' ? '' : 's') + ' pending from the accountant'; }],
    [/^— el primero: (.+?)\. Dejé$/, function (m) { var t = tr(m[1], 1); return '— first up: ' + (t == null ? m[1] : t) + '. I left'; }],
    // "Casa de lago con muelle privado · v1" handled by separators; "$1.310.000.000" numbers pass through
    [/^[\d$€.,%\s+\-–—:/US]+$/, function (m) { return m[0]; }]
  ];
  var MONTHS = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec',
    enero: 'Jan', febrero: 'Feb', marzo: 'Mar', abril: 'Apr', mayo: 'May', junio: 'Jun', julio: 'Jul', agosto: 'Aug', septiembre: 'Sep', octubre: 'Oct', noviembre: 'Nov', diciembre: 'Dec' };
  var MONTHS_LONG = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
  var DAYS = { lun: 'Mon', mar: 'Tue', mié: 'Wed', mie: 'Wed', jue: 'Thu', vie: 'Fri', sáb: 'Sat', sab: 'Sat', dom: 'Sun',
    lunes: 'Monday', martes: 'Tuesday', miércoles: 'Wednesday', miercoles: 'Wednesday', jueves: 'Thursday', viernes: 'Friday', sábado: 'Saturday', sabado: 'Saturday', domingo: 'Sunday' };

  function tr(s, depth) {
    depth = depth || 0;
    if (s == null) return null;
    var str = String(s);
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(str);
    var core = m[2];
    if (!core) return null;
    if (depth === 0 && memo.hasOwnProperty(core)) { var mm = memo[core]; return mm == null ? null : m[1] + mm + m[3]; }
    var out = trCore(core, depth);
    if (depth === 0) memo[core] = out;
    return out == null ? null : m[1] + out + m[3];
  }
  function trCore(core, depth) {
    if (depth > 6) return null;
    if (!/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/.test(core)) return null; // numbers / symbols only
    var d = direct(core);
    if (d != null) return d;
    // multi-segment dictionary keys (e.g. listing titles with " · ") are replaced before splitting
    var pre = false;
    if (longKeys === null) buildLongKeys();
    for (var k = 0; k < longKeys.length; k++) {
      if (core.indexOf(longKeys[k]) >= 0) { core = core.split(longKeys[k]).join(I.dict.ui[longKeys[k]]); pre = true; }
    }
    if (pre) { var d2 = direct(core); if (d2 != null) return d2; }
    // sentences: translate one by one
    if (/\.\s+[A-ZÁÉÍÓÚ¿¡]/.test(core)) {
      var sents = core.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚ¿¡])/), anyS = false;
      var outS = sents.map(function (p) { var t = tr(p, depth + 1); if (t != null) anyS = true; return t == null ? p : t; });
      if (anyS) return outS.join(' ');
    }
    // split by separators and translate each part (mixed content keeps names untouched)
    for (var i = 0; i < SEPS.length; i++) {
      if (core.indexOf(SEPS[i]) >= 0) {
        var parts = core.split(SEPS[i]), any = false;
        var outp = parts.map(function (p) { var t = tr(p, depth + 1); if (t != null) any = true; return t == null ? p : t; });
        if (any || pre) return outp.join(SEPS[i]);
        return null;
      }
    }
    for (var r = 0; r < RULES.length; r++) {
      var mm = RULES[r][0].exec(core);
      if (mm) { var res = RULES[r][1](mm); if (res != null) return res; }
    }
    return pre ? core : null;
  }
  var longKeys = null;
  function buildLongKeys() {
    longKeys = Object.keys(I.dict.ui || {}).filter(function (k) { return /( · | — | \/ )/.test(k) && k.length > 8; }).sort(function (a, b) { return b.length - a.length; });
  }
  I.tr = function (s) { if (I.lang !== 'en') return s; var t = tr(s); return t == null ? s : t; };

  var orig = (typeof WeakMap === 'function') ? new WeakMap() : null;
  var selfTouched = (typeof WeakMap === 'function') ? new WeakMap() : null; // node -> pending self-mutation count
  function touch(n) { if (selfTouched) selfTouched.set(n, (selfTouched.get(n) || 0) + 1); }
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|CODE|PRE|KBD|IFRAME|NOSCRIPT|SVG|MATH)$/;
  function textPass(root) {
    if (!orig) return;
    var en = I.lang === 'en';
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode; if (!p || p.nodeType !== 1) return NodeFilter.FILTER_REJECT;
        if (SKIP.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('[translate="no"],[data-i18n],.notranslate')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }, false);
    var n, nodes = [];
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (en) {
        var src = orig.has(node) ? orig.get(node) : node.nodeValue;
        if (!orig.has(node)) orig.set(node, src);
        if (!/\S/.test(src)) return;
        var t = tr(src);
        if (t != null && t !== node.nodeValue) { touch(node); node.nodeValue = t; }
      } else if (orig.has(node)) {
        var o = orig.get(node); if (o !== node.nodeValue) { touch(node); node.nodeValue = o; }
      }
    });
    // attributes that read as text
    ['placeholder', 'aria-label', 'title'].forEach(function (attr) {
      root.querySelectorAll('[' + attr + ']').forEach(function (el) {
        if (el.closest('[translate="no"]')) return;
        var k = 'i18nSrc' + attr.replace(/-/g, '');
        var src = el.dataset[k] != null ? el.dataset[k] : el.getAttribute(attr);
        if (en) {
          if (el.dataset[k] == null) el.dataset[k] = src;
          var t = tr(src); if (t != null && t !== el.getAttribute(attr)) el.setAttribute(attr, t);
        } else if (el.dataset[k] != null && el.getAttribute(attr) !== el.dataset[k]) el.setAttribute(attr, el.dataset[k]);
      });
    });
  }

  /* ---------------------------------------------------------------- apply */
  var applying = false;
  I.apply = function (root, opts) {
    root = root || document;
    var el = root.nodeType === 9 ? root.documentElement : root;
    if (!el || !el.querySelectorAll) return;
    applying = true;
    try {
      syncToggles(el);
      applyKeyed(el);
      var ui = document.documentElement.hasAttribute('data-i18n-ui') || (opts && opts.ui);
      if (ui && I.dict.ui) textPass(el);
    } finally { applying = false; }
  };

  // Catch-all for pages that render into the DOM after load (the tenant app): translate whatever
  // gets inserted (page, drawers, modals, palette, toasts) as a microtask, before paint.
  var pending = false, queue = [];
  function schedule(target) {
    if (queue.indexOf(target) < 0) queue.push(target);
    if (pending) return; pending = true;
    Promise.resolve().then(function () {
      pending = false; var q = queue; queue = [];
      if (I.lang !== 'en') return;
      q.forEach(function (t) { if (t && t.isConnected) I.apply(t); });
    });
  }
  function observe() {
    if (!document.documentElement.hasAttribute('data-i18n-ui') || !window.MutationObserver) return;
    var mo = new MutationObserver(function (muts) {
      if (applying) return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; if (a.nodeType === 1) schedule(a); else if (a.nodeType === 3 && a.parentNode) schedule(a.parentNode); }
        } else if (m.type === 'characterData' && m.target.parentNode) {
          if (selfTouched && selfTouched.get(m.target)) { var c = selfTouched.get(m.target) - 1; if (c > 0) selfTouched.set(m.target, c); else selfTouched.delete(m.target); continue; }
          if (orig) orig.delete(m.target); schedule(m.target.parentNode);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ----------------------------------------------------------------- boot */
  // Data-level records carry *En fields (assets/data.js). Seed the ES→EN phrase table with them so the
  // text pass also covers listing titles, task titles, contract types, stages and Lifestyle services
  // wherever a module prints the Spanish source string directly.
  I.seedFromData = function () {
    var D = window.DORUM; if (!D) return;
    var ui = I.dict.ui = I.dict.ui || {};
    function put(es, en) { if (es && en && es !== en && ui[es] == null) ui[es] = en; }
    (D.listings || []).forEach(function (l) { put(l.title, l.titleEn); put(l.description, l.descEn); });
    (D.tasks || []).forEach(function (t) { put(t.title, t.titleEn); });
    (D.contracts || []).forEach(function (k) { put(k.type, k.typeEn); });
    (D.pipelineStages || []).forEach(function (p) { put(p.label, p.labelEn); });
    (D.lifestyle || []).forEach(function (x) { put(x.nameEs, x.name); put(x.desc, x.descEn); });
    (D.voiceIntents || []).forEach(function (v) { put(v.say, v.sayEn); put(v.does, v.doesEn); if (v.say) put(v.say.replace(/^Llave,\s*/i, ''), (v.sayEn || '').replace(/^Llave,\s*/i, '')); });
    (D.roles || []).forEach(function (r) { put(r.labelEs, r.label); });
    (D.tenant && D.tenant.divisions || []).forEach(function () {});
    put(D.tenant && D.tenant.taglineEs, D.tenant && D.tenant.tagline);
    put(D.tenant && D.tenant.positioningEs, D.tenant && D.tenant.positioning);
    lower = null; longKeys = null; memo = {};
  };
  function boot() {
    document.documentElement.lang = I.lang;
    I.seedFromData();
    I.apply(document);
    observe();
  }
  document.documentElement.lang = I.lang;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.I18N = I;
})();

/* ==========================================================================
   Dictionaries
   ========================================================================== */
(function () {
  'use strict';
  var I = window.I18N;

  /* ------------------------------------------------------- nav ids (app) */
  I.dict.nav = {
    home: ['Inicio', 'Home'], listings: ['Inmuebles', 'Listings'], 'crm-get': ['Captación', 'Acquisition'], 'crm-sell': ['Ventas & arriendos', 'Sales & rentals'],
    calendar: ['Agenda', 'Calendar'], projects: ['Proyectos', 'Projects'], contracts: ['Contratos', 'Contracts'], paperwork: ['Documentos', 'Paperwork'],
    media: ['Fotos & video', 'Photos & video'], publishing: ['Publicación', 'Publishing'], ads: ['Pauta', 'Ads'], money: ['Dinero', 'Money'], 'my-money': ['Mis pagos', 'My payouts'],
    payroll: ['Nómina', 'Payroll'], rentals: ['Arriendos', 'Rentals'], lifestyle: ['Lifestyle', 'Lifestyle'], reports: ['Reportes', 'Reports'], website: ['Sitio web', 'Website'],
    settings: ['Configuración', 'Settings'], orders: ['Órdenes', 'Orders'], referrals: ['Referidos', 'Referrals'], 'my-listing': ['Mi inmueble', 'My listing'], visits: ['Visitas', 'Visits'],
    offers: ['Ofertas', 'Offers'], documents: ['Documentos', 'Documents'], messages: ['Mensajes', 'Messages'], search: ['Buscar', 'Search'], shortlist: ['Favoritos', 'Shortlist'],
    tours: ['Recorridos', 'Tours'], 'my-property': ['Mi propiedad', 'My property'], statements: ['Extractos', 'Statements'], maintenance: ['Mantenimiento', 'Maintenance'],
    'my-home': ['Mi hogar', 'My home'], payments: ['Pagos', 'Payments'], roles: ['Roles', 'Roles']
  };

  /* -------------------------------------------- app chrome · ES → EN */
  // Exact phrases first; the text pass also tries case-insensitive, " · " segments, numbers+phrase,
  // trailing punctuation and a set of prefix/suffix rules (see I18N.tr).
  I.dict.ui = {
    // shell & picker
    'Inicio': 'Home', 'Inmuebles': 'Listings', 'Captación': 'Acquisition', 'Ventas & arriendos': 'Sales & rentals', 'Agenda': 'Calendar', 'Proyectos': 'Projects',
    'Contratos': 'Contracts', 'Documentos': 'Documents', 'Fotos & video': 'Photos & video', 'Publicación': 'Publishing', 'Pauta': 'Ads', 'Dinero': 'Money', 'Mis pagos': 'My payouts',
    'Nómina': 'Payroll', 'Arriendos': 'Rentals', 'Reportes': 'Reports', 'Sitio web': 'Website', 'Configuración': 'Settings', 'Órdenes': 'Orders', 'Referidos': 'Referrals',
    'Mi inmueble': 'My listing', 'Visitas': 'Visits', 'Ofertas': 'Offers', 'Mensajes': 'Messages', 'Buscar': 'Search', 'Favoritos': 'Shortlist', 'Recorridos': 'Tours',
    'Mi propiedad': 'My property', 'Extractos': 'Statements', 'Mantenimiento': 'Maintenance', 'Mi hogar': 'My home', 'Pagos': 'Payments', 'Roles': 'Roles', 'Más': 'More',
    'Realtor OS': 'Realtor OS', 'Portal de aliados': 'Partner portal', 'Portal de clientes': 'Client portal', 'Menú': 'Menu', 'Tema': 'Theme', 'Cambiar tema': 'Toggle theme',
    'Cambiar rol (demo)': 'Switch role (demo)', 'Cambiar rol': 'Switch role', 'Cambiar de rol': 'Switch role', 'cambiar': 'switch', 'Aprobaciones pendientes': 'Pending approvals',
    'Buscar inmueble, contacto, negocio…': 'Search listings, contacts, deals…', 'Hablar con Llave': 'Talk to Llave', 'Navegación': 'Navigation', 'Módulos': 'Modules',
    'Agencia': 'Agency', 'demo': 'demo', 'Demo': 'Demo', 'Equipo Dorum': 'Dorum team', 'Aliados y proveedores': 'Partners & vendors', 'Clientes': 'Clients',
    'Operan la agencia todos los días': 'Run the agency every day', 'Reciben órdenes y cobran por servicio': 'Receive orders and get paid per job', 'Ven solo lo suyo, en su idioma': 'See only their own, in their language',
    'Propietaria de agencia': 'Company owner', 'Asesor inmobiliario': 'Broker / Realtor', 'Administradora de ventas': 'Sales administrator', 'Administradora de arriendos': 'Rental administrator',
    'Contadora': 'Accountant', 'Abogada': 'Lawyer', 'Abogado': 'Lawyer', 'Fotógrafo': 'Photographer', 'Pauta digital': 'Advertiser', 'Redactor e investigador': 'Writer & researcher',
    'Construcción y remodelación': 'Construction & remodeling', 'Crédito hipotecario': 'Lender', 'Vendedor': 'Seller', 'Comprador': 'Buyer', 'Compradora': 'Buyer', 'Arrendador': 'Landlord', 'Arrendatario': 'Renter',
    'Propietario': 'Owner', 'Propietaria': 'Owner', 'Asesor': 'Broker', 'Asesora': 'Broker', 'asesor': 'broker', 'Abogado inmobiliario': 'Real-estate lawyer', 'Founder & CEO': 'Founder & CEO',
    'Modo TV': 'TV mode', 'Modo reloj': 'Watch mode', 'Sitio público Dorum': 'Dorum public site', 'Llave OS': 'Llave OS',
    'Datos de demostración; nombres ficticios salvo la propietaria.': 'Demo data; fictional names except the owner.',
    // greetings / home
    'Buenos días': 'Good morning', 'Buenas tardes': 'Good afternoon', 'Buenas noches': 'Good evening', 'Buenos días,': 'Good morning,',
    'evento hoy': 'event today', 'eventos hoy': 'events today', 'por aprobar': 'to approve', 'Por aprobar': 'To approve', 'por revisar': 'to review', 'Por revisar': 'To review',
    'Ver todo': 'View all', 'Ver todas': 'View all', 'Ver todos': 'View all', 'Ver': 'View', 'Ver detalle': 'View detail', 'Detalle': 'Detail', 'Detalle →': 'Detail →',
    'Hoy': 'Today', 'Mañana': 'Tomorrow', 'Ayer': 'Yesterday', 'hoy': 'today', 'mañana': 'tomorrow', 'ayer': 'yesterday', 'Hoy y mañana': 'Today & tomorrow', 'Esta semana': 'This week', 'esta semana': 'this week',
    'Semana': 'Week', 'Mes': 'Month', 'mes': 'month', 'Día': 'Day', 'Días': 'Days', 'mes en curso': 'current month', 'Septiembre': 'September', 'Agosto': 'August', 'Octubre': 'October',
    'Septiembre 2026': 'September 2026', 'Septiembre de 2026': 'September 2026', 'Agosto 2026': 'August 2026', 'Agosto de 2026': 'August 2026',
    // widgets (titles)
    'Ingresos y comisiones': 'Revenue & commissions', 'Pipeline': 'Pipeline', 'Inmuebles en el mapa': 'Listings on the map', 'Actividad del equipo': 'Team activity',
    'Resumen de Llave': 'Llave digest', 'Pídeselo a Llave': 'Ask Llave', 'Tareas por vencer': 'Tasks due', 'Escrow': 'Escrow', 'Mis comisiones': 'My commissions',
    'Recaudo del mes': 'Collected this month', 'Cartera vencida': 'Arrears', 'Contratos por vencer': 'Leases expiring', 'Inventarios': 'Inventories', 'Renta vacacional': 'Vacation rental',
    'Lotes de pago': 'Payout batches', 'Liberaciones pendientes': 'Pending releases', 'DIAN': 'DIAN', 'Movimientos recientes': 'Recent movements', 'Revisión legal': 'Legal review',
    'Redlines abiertos': 'Open redlines', 'Estudio de títulos': 'Title checks', 'Firmas pendientes': 'Signatures pending', 'Biblioteca de cláusulas': 'Clause library',
    'Nuevos referidos': 'New referrals', 'Pre-aprobaciones': 'Pre-approvals', 'Cierres próximos': 'Upcoming closings', 'Mi pipeline': 'My pipeline', 'Mis inmuebles': 'My listings',
    'Leads calientes': 'Hot leads', 'Seguimientos AI por aprobar': 'AI follow-ups to approve', 'Pipeline de inmuebles': 'Listings pipeline', 'Órdenes a proveedores': 'Vendor orders',
    'Cola de publicación': 'Publishing queue', 'Pauta del mes': 'Ads this month', 'Campañas activas': 'Live campaigns', 'Solicitudes de creativos': 'Creative requests', 'Tendencia CPL': 'CPL trend',
    'Redacciones en cola': 'Write-ups in queue', 'Comps solicitados': 'Comps requested', 'Borradores AI por revisar': 'AI drafts to review', 'Órdenes abiertas': 'Open orders',
    'Agenda de sesiones': 'Shoot calendar', 'Subir entregables': 'Upload deliverables', 'Cotizaciones solicitadas': 'Quotes requested', 'Obras y remodelaciones': 'Builds & remodels',
    'Visitas de obra': 'Site visits', 'Alcance': 'Reach', 'Alcance de la campaña': 'Campaign reach', 'Estado de tu oferta': 'Your offer status', 'Próximo recorrido': 'Next tour',
    'Tu lista': 'Your shortlist', 'Tu arriendo': 'Your rent', 'Tu contrato': 'Your lease', 'Tu liquidación': 'Your payout', 'Tu liquidación por mes': 'Your payout by month', 'Tu precio': 'Your price',
    'Tu siguiente paso': 'Your next step', 'Tus solicitudes': 'Your requests', 'Tus otros inmuebles': 'Your other properties', 'Tu equipo Dorum': 'Your Dorum team', 'Tu oferta': 'Your offer',
    'Mi oferta': 'My offer', 'Mis ofertas': 'My offers', 'Mis reportes': 'My reports', 'Servicios': 'Services', 'Recibos': 'Receipts', 'Ocupación': 'Occupancy', 'Crédito': 'Mortgage',
    'Cartera': 'Collections', 'Recaudo de arriendos': 'Rent collection', 'Arriendos del mes': 'Rents this month', 'Comisiones del mes': 'Commissions this month',
    'Comisiones proyectadas · mes': 'Projected commissions · month', 'Comisión proyectada': 'Projected commission', 'Comisión': 'Commission', 'Comisiones': 'Commissions',
    'Valor del pipeline': 'Pipeline value', 'Valor en pipeline': 'Pipeline value', 'Negocios': 'Deals', 'Negocio': 'Deal', 'Leads': 'Leads', 'Vistas': 'Views', 'Interesados': 'Interested',
    // statuses
    'Borrador': 'Draft', 'borrador': 'draft', 'En preparación': 'In preparation', 'en preparación': 'in preparation', 'Activo': 'Active', 'activo': 'active', 'Activos': 'Active', 'activa': 'live', 'Activa': 'Live',
    'Bajo oferta': 'Under offer', 'bajo oferta': 'under offer', 'Vendido': 'Sold', 'vendido': 'sold', 'Arrendado': 'Rented', 'arrendado': 'rented', 'Pendiente': 'Pending', 'pendiente': 'pending', 'Pendientes': 'Pending',
    'Pagado': 'Paid', 'pagado': 'paid', 'Pagada': 'Paid', 'Firmado': 'Signed', 'firmado': 'signed', 'Firmada': 'Signed', 'Vencido': 'Expired', 'vencido': 'expired', 'Vencidos': 'Expired', 'Vencida': 'Expired',
    'Rechazado': 'Rejected', 'rechazado': 'rejected', 'Rechazada': 'Rejected', 'Atrasado': 'Late', 'atrasado': 'late', 'En curso': 'In progress', 'en curso': 'in progress', 'Revisión': 'Review', 'revisión': 'review',
    'En revisión': 'In review', 'en revisión': 'in review', 'Listo': 'Done', 'listo': 'done', 'Listos': 'Ready', 'listos': 'ready', 'Lista': 'Ready', 'Listas': 'Ready', 'Bloqueado': 'Blocked', 'bloqueado': 'blocked',
    'Recibido': 'Received', 'recibido': 'received', 'Recibida': 'Received', 'Recibidos': 'Received', 'Validado': 'Validated', 'validado': 'validated', 'Validados': 'Validated', 'Aprobado': 'Approved', 'aprobado': 'approved',
    'Aprobada': 'Approved', 'aprobada': 'approved', 'Aprobados': 'Approved', 'Aprobadas': 'Approved', 'Enviado': 'Sent', 'enviado': 'sent', 'Enviada': 'Sent', 'Enviado a firma': 'Sent for signature',
    'En negociación': 'In negotiation', 'Retenido': 'Held', 'retenido': 'held', 'Publicado': 'Published', 'publicado': 'published', 'Publicados': 'Published', 'Publicada': 'Published', 'Pausada': 'Paused', 'pausada': 'paused',
    'Confirmado': 'Confirmed', 'Confirmada': 'Confirmed', 'Confirmar': 'Confirm', 'Resuelto': 'Resolved', 'Resueltas': 'Resolved', 'Nuevo': 'New', 'Nueva': 'New', 'Nuevas': 'New', 'Nuevos': 'New', 'nuevo': 'new',
    'Contactado': 'Contacted', 'Calificado': 'Qualified', 'Tour': 'Tour', 'Oferta': 'Offer', 'Contrato': 'Contract', 'Visita': 'Visit', 'Propuesta': 'Proposal', 'Propuestas': 'Proposals',
    'Cierre': 'Closing', 'Cierres': 'Closings', 'Abiertas': 'Open', 'Abiertos': 'Open', 'Todas': 'All', 'Todos': 'All', 'Todo': 'All', 'Pre-aprobado': 'Pre-approved', 'Pre-aprobados': 'Pre-approved',
    'Vigente': 'Current', 'Vigentes': 'Current', 'Vacante': 'Vacant', 'Desactualizado': 'Out of date', 'Asignado': 'Assigned', 'Programado': 'Scheduled', 'Realizados': 'Completed', 'Realizadas': 'Completed',
    'Alta': 'High', 'Alto': 'High', 'Media': 'Medium', 'Medio': 'Medium', 'Baja': 'Low', 'Bajo': 'Low', 'Alta · hoy': 'High · today', 'Baja · puede esperar': 'Low · can wait', 'Urgencia': 'Urgency',
    'OK': 'OK', 'No aplica': 'N/A', 'opcional': 'optional', 'Opcional': 'Optional', 'incluido': 'included', 'Incluye': 'Includes', 'Solo lectura': 'Read only',
    // actions / buttons
    'Aprobar': 'Approve', 'Aprobar y enviar': 'Approve & send', 'Aprobar borrador': 'Approve draft', 'Aprobar y asignar': 'Approve & assign', 'Aprobar y notificar': 'Approve & notify',
    'Aprobar redacción': 'Approve write-up', 'Aprobar cotización': 'Approve quote', 'Aprobar fotos': 'Approve photos', 'Aprobar textos': 'Approve copy', 'Aprobar todo lo pendiente': 'Approve everything pending',
    'Ver y aprobar': 'View & approve', 'Editar': 'Edit', 'Descartar': 'Discard', 'Enviar': 'Send', 'Guardar': 'Save', 'Guardar cambios': 'Save changes', 'Cancelar': 'Cancel', 'Cerrar': 'Close', 'cerrar': 'close',
    'Abrir': 'Open', 'abrir': 'open', 'Aceptar': 'Accept', 'Aceptar oferta': 'Accept offer', 'Rechazar': 'Decline', 'Revisar': 'Review', 'Responder': 'Reply', 'Solicitar': 'Request', 'Pedir': 'Request',
    'Pedir cambios': 'Request changes', 'Pedir otra': 'Request another', 'Pedirla': 'Request it', 'Pedir a Llave': 'Ask Llave', 'Preguntar a Llave': 'Ask Llave', 'Pedir recorrido': 'Request a tour', 'Pedir pre-aprobación': 'Request pre-approval',
    'Agendar': 'Schedule', 'Agendar por voz': 'Schedule by voice', 'Agregar': 'Add', 'Agregar al calendario': 'Add to calendar', 'Quitar': 'Remove', 'Retirar': 'Withdraw', 'Liberar': 'Release',
    'Pagar': 'Pay', 'Pagar ahora': 'Pay now', 'Registrar pago': 'Record payment', 'Cotizar': 'Get a quote', 'Comparar': 'Compare', 'Explorar': 'Explore', 'Escribir': 'Write', 'Escribir al asesor': 'Message the broker',
    'Descargar': 'Download', 'Descargar PDF': 'Download PDF', 'Descargar todos': 'Download all', 'Exportar CSV': 'Export CSV', 'Exportar libro': 'Export ledger', 'Subir': 'Upload', 'Subir sesión': 'Upload shoot',
    'Subir un documento': 'Upload a document', 'Subir y entregar': 'Upload & deliver', 'Toca para subir un documento': 'Tap to upload a document', 'o haz clic para subir': 'or click to upload',
    'Arrastra el PDF o la foto aquí': 'Drop the PDF or photo here', 'Arrastra fotos, video o PDF aquí': 'Drop photos, video or PDF here', 'Adjuntar foto': 'Attach photo',
    'Publicar cambios': 'Publish changes', 'Publicar': 'Publish', 'Publicar solo donde haga falta': 'Publish only where needed', 'Pausar': 'Pause', 'Activar': 'Activate', 'Aplicar': 'Apply', 'Aplicar a un negocio': 'Apply to a deal',
    'Validar': 'Validate', 'Proponer': 'Propose', 'Reportar': 'Report', 'Reportar daño': 'Report an issue', 'Reportar un daño': 'Report an issue', 'Tengo un daño que reportar': 'I have an issue to report',
    'Marcar como leído': 'Mark as read', 'Omitir': 'Skip', 'Otra versión': 'Another version', 'Usar plantilla': 'Use template', 'Usar punto medio': 'Use midpoint', 'Generar desde plantilla': 'Generate from template',
    'Mantener anterior': 'Keep previous', 'No renovar': 'Do not renew', 'Renovar': 'Renew', 'Mejorar mi oferta': 'Improve my offer', 'Contraofertar': 'Counter-offer', 'Configurar oferta': 'Set up offer',
    'Ejecutar nómina': 'Run payroll', 'Nueva campaña': 'New campaign', 'Nueva cláusula': 'New clause', 'Nuevo inmueble': 'New listing', 'Nuevo lead': 'New lead', 'Nuevo ticket': 'New ticket',
    'Ordenar paquete': 'Order package', 'Ordenar paquete con plantilla': 'Order package from template', 'Crear checklist': 'Create checklist', 'Seleccionar mejores 20': 'Select best 20',
    'Escuchar resumen': 'Listen to digest', 'Volver a ver': 'Watch again', 'Volver': 'Back', 'Ir a Inicio': 'Go to Home', 'Ir a': 'Go to', 'Siguiente': 'Next', 'Decidir': 'Decide', 'Avísame': 'Notify me',
    'Envíame el extracto': 'Send me the statement', 'Hablar con mi asesor': 'Talk to my broker', 'Hablar con Dorum por WhatsApp': 'Chat with Dorum on WhatsApp', 'Quiero ver otro inmueble similar': 'Show me a similar property',
    'Ver negocio': 'View deal', 'Ver reparto': 'View split', 'Ver pipeline': 'View pipeline', 'Ver bandeja': 'View inbox', 'Ver archivo': 'View file', 'Ver comparables': 'View comps', 'Ver contrato firmado': 'View signed contract',
    'Ver oferta': 'View offer', 'Ver recordatorio': 'View reminder', 'Ver sitio público': 'View public site', 'Revisar 16 borradores': 'Review 16 drafts', 'Retirar de': 'Remove from', 'Editar %': 'Edit %',
    'Confirmado ✓': 'Confirmed ✓', 'Hecho ✓': 'Done ✓', 'Listo ✓': 'Done ✓', 'Copiar enlace': 'Copy link', 'Compartir': 'Share',
    // approvals / AI
    'Bandeja de aprobaciones': 'Approvals inbox', 'Borrador de Llave': 'Llave draft', 'Borradores de Llave': 'Llave drafts', 'Borradores de Llave por aprobar': 'Llave drafts to approve', 'Borradores de Llave aprobados': 'Llave drafts approved',
    'Borrador AI': 'AI draft', 'Borradores AI': 'AI drafts', 'borradores': 'drafts', 'borrador': 'draft', 'Borradores AI por aprobar': 'AI drafts to approve', 'Borrador AI esperando tu aprobación': 'AI draft waiting for your approval',
    'AI · revisar': 'AI · review', 'AI · aprobado': 'AI · approved', 'AI · triage': 'AI · triage', 'AI redacta · tú apruebas': 'AI drafts · you approve', 'Triage de Llave': 'Llave triage',
    'Todo aprobado': 'All approved', 'Llave no tiene borradores esperando tu revisión': 'Llave has no drafts waiting for your review',
    'borradores de Llave esperan una decisión humana. Nada sale a un cliente, portal o notaría sin tu aprobación': 'Llave drafts await a human decision. Nothing goes to a client, portal or notary without your approval',
    'Tareas y borradores': 'Tasks & drafts', 'Tareas': 'Tasks', 'Tarea': 'Task', 'Mensaje': 'Message', 'Correo': 'Email', 'Portal': 'Portal', 'Respuesta a': 'Reply to', 'Respuesta sugerida por Llave': 'Reply suggested by Llave',
    'Sugerido por Llave': 'Suggested by Llave', 'Llave sugiere': 'Llave suggests', 'Llave observa': 'Llave notes', 'Llave resume': 'Llave sums up', 'Llave revisó': 'Llave checked', 'Lo que dice Llave': 'What Llave says',
    'Lectura de Llave': 'Llave read', 'Lectura de mercado': 'Market read', 'Redactado con Llave': 'Drafted with Llave', 'revisado por': 'reviewed by', 'Generado por Llave': 'Generated by Llave',
    'Contraoferta sugerida por Llave': 'Counter-offer suggested by Llave', 'Cotización sugerida por Llave': 'Quote suggested by Llave', 'Creativos por Llave': 'Creatives by Llave', 'Recordatorios redactados por Llave': 'Reminders drafted by Llave',
    'Recordatorio AI listo': 'AI reminder ready', 'Recordatorio por WhatsApp · borrador': 'WhatsApp reminder · draft', 'Verificación Llave': 'Llave check', 'Política de IA': 'AI policy', 'Nada se publica sin tu aprobación': 'Nothing is published without your approval',
    'Para tu aprobación': 'For your approval', 'Revisión pendiente': 'Review pending', 'Copies AI por aprobar': 'AI copy to approve', 'Copies': 'Copy', 'Textos ES/EN': 'Copy ES/EN', 'Redactar con Llave': 'Draft with Llave',
    'Concierge de Llave': 'Llave concierge', 'Llave solo redacta con estas': 'Llave only drafts with these', 'Llave hará': 'Llave will', 'Entendido': 'Got it', 'Necesita confirmación': 'Needs confirmation', 'Escuchando…': 'Listening…', 'Escuchando': 'Listening',
    'Toca y habla con Llave': 'Tap and talk to Llave', 'Toca y habla, o prueba:': 'Tap and talk, or try:', 'Queda en el registro': 'Logged on the record', 'Asistente de voz Llave': 'Llave voice assistant',
    'Di «Llave…» o toca un ejemplo': 'Say “Llave…” or tap an example', 'micrófono real disponible': 'real microphone available', 'espacio': 'space', 'navegar': 'navigate', 'Sin resultados. Prueba con un barrio, un nombre o "agenda"': 'No results. Try a neighbourhood, a name or "calendar"',
    'Busca inmuebles, contactos, negocios, tareas… o pídele algo a Llave': 'Search listings, contacts, deals, tasks… or ask Llave', 'Acciones': 'Actions', 'Contactos': 'Contacts', 'Personas': 'People', 'Módulo': 'Module',
    // tables / labels
    'Inmueble': 'Listing', 'inmueble': 'listing', 'inmuebles': 'listings', 'Precio': 'Price', 'Precio / m²': 'Price / m²', 'Precio validado': 'Price validated', 'Etapa': 'Stage', 'Etapa de pago': 'Payment stage', 'Estado': 'Status',
    'Estado e inventario': 'Status & inventory', 'Fecha': 'Date', 'Fecha de pago': 'Payment date', 'Monto': 'Amount', 'Concepto': 'Concept', 'Cuenta': 'Account', 'Persona': 'Person', 'Proveedor': 'Vendor', 'Proveedores': 'Vendors',
    'Tipo': 'Type', 'Plazo': 'Term', 'Duración': 'Duration', 'Vigencia': 'Validity', 'Vencimientos': 'Expiries', 'Vence': 'Due', 'vence': 'due', 'Total': 'Total', 'Total del lote': 'Batch total', 'Bruto a repartir': 'Gross to split',
    'Reparto': 'Split', 'Honorario': 'Fee', 'Fee': 'Fee', 'Salario': 'Salary', 'Salarios': 'Salaries', 'Salario base': 'Base salary', 'Canon': 'Rent', 'canon': 'rent', 'Canon mensual': 'Monthly rent', 'canon mensual': 'monthly rent',
    'Canon cobrado': 'Rent collected', 'Depósito': 'Deposit', 'Depósito en garantía': 'Security deposit', 'Depósito en escrow': 'Deposit in escrow', 'Garantía': 'Guarantee', 'Arras': 'Earnest money', 'IVA': 'VAT', 'IVA 19 %': 'VAT 19 %',
    'Administración': 'HOA fee', 'Sin administración': 'No HOA fee', 'Administración + IVA': 'Management + VAT', 'Administración de arriendo': 'Rental management', 'Administración de arriendos': 'Rental management', 'Administración Dorum': 'Dorum management',
    'Estrato': 'Estrato', 'Área': 'Area', 'Alcobas': 'Bedrooms', 'Alcobas · baños': 'Bedrooms · baths', 'hab': 'bd', 'baño': 'bath', 'baños': 'baths', 'parq': 'parking', 'Parqueaderos': 'Parking', 'Lote': 'Lot', 'lote': 'lot',
    'Casa': 'House', 'Casas': 'Houses', 'Apartamento': 'Apartment', 'Apartamentos': 'Apartments', 'Finca': 'Finca', 'Fincas': 'Fincas', 'Lotes': 'Lots', 'Oficina': 'Office', 'Oficinas': 'Offices', 'Penthouse': 'Penthouse',
    'venta': 'sale', 'Venta': 'Sale', 'arriendo': 'rent', 'Arriendo': 'Rent', 'vacacional': 'vacation', 'Vacacional': 'Vacation', 'noche': 'night', '/ noche': '/ night', '/ mes': '/ month', '/mes': '/mo', '/noche': '/night',
    '/ mes + IVA': '/ month + VAT', 'Venta y arriendo': 'Sale & rent', 'Venta urbana': 'Urban sale', 'Venta rural / fincas': 'Rural sale / fincas', 'Internacional': 'International', 'Nacional': 'Domestic',
    'Días en mercado': 'Days on market', 'Días publicado': 'Days listed', 'Asesor que colocó el inmueble': 'Listing broker', 'Todos los asesores': 'All brokers', 'Todos los inmuebles': 'All listings', 'Todos los estados': 'All statuses',
    'Todos los tipos': 'All types', 'Todas las zonas': 'All areas', 'Todo el equipo': 'Whole team', 'Solo con pendientes': 'Only with pending items', 'Cualquiera': 'Any', 'Otro': 'Other', 'Ordenados por coincidencia contigo': 'Sorted by match with you',
    'Tabla': 'Table', 'Tablero': 'Board', 'Tarjetas': 'Cards', 'Mapa': 'Map', 'Galería': 'Gallery', 'Lista': 'List', 'Calendario': 'Calendar', 'Línea de tiempo': 'Timeline', 'Cronograma': 'Schedule', 'Resumen': 'Summary', 'Ficha': 'Listing sheet',
    'Vista previa': 'Preview', 'Imágenes': 'Images', 'Videos y reels': 'Videos & reels', 'Marca de agua': 'Watermark', 'Seleccionadas': 'Selected', 'Entregadas': 'Delivered', 'Entregadas · en revisión': 'Delivered · in review', 'portada': 'cover',
    'Inmuebles activos': 'Active listings', 'Inmuebles en producción': 'Listings in production', 'Inmuebles por etapa': 'Listings by stage', 'Inmuebles por zona': 'Listings by area', 'Inmuebles destacados · automático': 'Featured listings · automatic',
    'Rendimiento por inmueble': 'Performance by listing', 'Embudo comercial': 'Sales funnel', 'Ingresos mensuales · 2026': 'Monthly revenue · 2026', 'Vendidos / arrendados 2026': 'Sold / rented 2026', 'Promedio mensual': 'Monthly average',
    'Proyectado': 'Projected', 'Proyectado 30 d': 'Projected 30 d', 'Proyectado al cierre': 'Projected at closing', 'Recaudado': 'Collected', 'Por cobrar': 'Receivable', 'Pendiente por cobrar': 'Pending collection', 'Cobrado este mes': 'Collected this month',
    'Sin pago este mes': 'No payment this month', 'Mora': 'Arrears', 'Por liberar': 'To release', 'Por confirmar': 'To confirm', 'Por presentar': 'To file', 'Por negocio': 'By deal', 'Al cierre': 'At closing', 'Al listar': 'At listing',
    'En custodia': 'In custody', 'En custodia (escrow)': 'In custody (escrow)', 'En escrow': 'In escrow', 'Escrow (custodia)': 'Escrow (custody)', 'Escrow segregado · comisiones · cartera': 'Segregated escrow · commissions · collections',
    'Libro mayor': 'Ledger', 'Ingreso': 'Income', 'Ingresos': 'Income', 'Egresos': 'Outgoings', 'Egreso': 'Outgoing', 'Retención en la fuente': 'Withholding tax', 'retención en la fuente': 'withholding tax', 'Nota tributaria': 'Tax note',
    'Facturación electrónica': 'E-invoicing', 'Facturas emitidas 30 d': 'Invoices issued 30 d', 'Seguridad social (PILA)': 'Social security (PILA)', 'Aprobación y pago': 'Approval & payment', 'Pago de contado': 'Cash payment',
    'Fees de referido': 'Referral fees', 'Fees de referido por negocio': 'Referral fees by deal', 'Detalle por negocio': 'Detail by deal', 'Comisiones por defecto': 'Default commissions', 'Exclusividad de corretaje': 'Listing exclusivity',
    'Incremento anual': 'Annual increase', 'IPC · al renovar': 'CPI · at renewal', 'Periodo de gracia': 'Grace period', 'Obligaciones': 'Obligations', 'Uso propietario': 'Owner use', 'Bloqueo · mantenimiento': 'Blocked · maintenance',
    'ocupados': 'occupied', 'libre': 'free', 'ocupación': 'occupancy', 'Noches reservadas': 'Nights booked', 'Ingreso bruto': 'Gross income', 'Liquidación al propietario': 'Owner payout', 'Liquidación del mes': 'This month\'s payout',
    'Liquidación': 'Payout', 'Liquidaciones': 'Payouts', 'renta mensual est.': 'est. monthly rent', 'Inversión': 'Spend', 'Inversión 30 d': 'Spend 30 d', 'Inversión del mes': 'Spend this month', 'Presupuesto': 'Budget', 'Plataforma': 'Platform',
    'Campaña': 'Campaign', 'Campañas': 'Campaigns', 'Marca': 'Brand', 'Creativos': 'Creatives', 'Audiencias guardadas': 'Saved audiences', 'CPL promedio': 'Average CPL', 'CPL combinado · campañas activas': 'Blended CPL · live campaigns', 'Costo por lead · pauta': 'Cost per lead · ads',
    'COP por lead · 8 semanas': 'COP per lead · 8 weeks', 'Leads por semana · 8 semanas': 'Leads per week · 8 weeks', 'Vistas por semana · últimas 8': 'Views per week · last 8', 'personas alcanzadas': 'people reached', 'Conv.': 'Conv.', 'ROAS': 'ROAS', 'CTA': 'CTA',
    'Registro de publicaciones': 'Publishing log', 'Centro de publicación': 'Publishing hub', 'Portales + Instagram': 'Portals + Instagram', 'sin publicar': 'unpublished', 'sin aprobar': 'unapproved', 'oculto en portal': 'hidden on portal',
    'portales pendientes de sincronizar': 'portals pending sync', 'última sync': 'last sync', 'Vía integración pendiente': 'Via integration (pending)', 'Landing por inmueble': 'Landing page per listing', 'Páginas': 'Pages', 'Hero': 'Hero', 'Tagline': 'Tagline',
    'Llamado a la acción': 'Call to action', 'Posicionamiento': 'Positioning', 'Testimonios': 'Testimonials', 'Nosotros': 'About', 'Contacto': 'Contact', 'Formulario': 'Form', 'FAQ': 'FAQ', 'Sitio Dorum': 'Dorum site', 'Sitemap y datos estructurados': 'Sitemap & structured data',
    'Plantillas': 'Templates', 'Plantillas de lanzamiento': 'Launch templates', 'Plantilla: Lanzamiento venta': 'Template: Sale launch', 'Plantilla: Arriendo': 'Template: Rental', 'Plantilla: Finca / lote': 'Template: Finca / lot', 'Comps & datos': 'Comps & data',
    'Comparables y precio': 'Comps & price', 'Redacción': 'Write-up', 'Fotografía': 'Photography', 'Fotos y video': 'Photos & video', 'Fotos': 'Photos', 'Premium': 'Premium', 'Sesiones': 'Shoots', 'Sesión': 'Shoot', 'Sesión foto': 'Photo shoot',
    'Remodelación': 'Remodeling', 'Remodelación (opcional)': 'Remodeling (optional)', 'Construcción desde cero': 'Construction from scratch', 'Aseo y mantenimiento': 'Housekeeping', 'Mercado, chef y delivery': 'Food delivery & chef',
    'Experiencias': 'Activities', 'Transporte': 'Transportation', 'Concierge': 'Concierge', 'Próximamente': 'Coming soon', 'Piloto': 'Pilot', 'piloto': 'pilot', 'Piloto en Guatapé': 'Pilot in Guatapé', 'Solicitudes piloto': 'Pilot requests',
    'Servicios para tu hogar, a un toque': 'Services for your home, one tap away', 'Lifestyle · servicios': 'Lifestyle · services', 'Clientes que pidieron aviso': 'Clients who asked to be notified',
    // documents / contracts
    'Documento': 'Document', 'Debe entregar': 'Owed by', 'Te falta 1 documento': 'You are missing 1 document', 'Te faltan 2 documentos': 'You are missing 2 documents', 'Te faltan 3 documentos': 'You are missing 3 documents',
    'Recibidos · por validar': 'Received · to validate', 'Firmantes por firmar': 'Signers pending', 'Cláusulas aprobadas': 'Approved clauses', 'Cláusulas en disputa': 'Disputed clauses', 'Aprobados por abogado': 'Lawyer-approved',
    'Acuerdos firmados': 'Signed agreements', 'Acuerdo firmado': 'Agreement signed', 'Acuerdo de corretaje firmado': 'Listing agreement signed', 'Acuerdo de corretaje': 'Listing agreement', 'Acuerdo de corretaje · venta': 'Listing agreement · sale',
    'Acuerdo de corretaje · arriendo': 'Listing agreement · rental', 'Acuerdo de corretaje · arriendo (Lifestyle)': 'Listing agreement · rental (Lifestyle)', 'Promesa de compraventa': 'Purchase agreement (promesa)', 'Contraoferta': 'Counter-offer',
    'Contrato de arrendamiento': 'Lease agreement', 'Contrato de arrendamiento · vivienda': 'Lease agreement · residential', 'Inventario de entrada': 'Move-in inventory', 'Inventario de vivienda': 'Home inventory', 'Inventario': 'Inventory',
    'Escritura pública': 'Public deed', 'Escritura pública anterior': 'Previous deed', 'Escritura': 'Deed', 'Escrituras programadas': 'Deeds scheduled', 'Certificado de tradición y libertad': 'Title certificate (tradición y libertad)',
    'Paz y salvo de administración': 'HOA clearance (paz y salvo)', 'Impuesto predial 2026 pagado': 'Property tax 2026 paid', 'Cédula de ciudadanía': 'National ID', 'Cédula de ciudadanía · comprador': 'National ID · buyer', 'Cédula de ciudadanía · vendedor': 'National ID · seller',
    'Cédula de ciudadanía · propietario': 'National ID · owner', 'Cédula / pasaporte · arrendatario': 'ID / passport · renter', 'Cédula o pasaporte · arrendatario': 'ID or passport · renter', 'Cédula o pasaporte · comprador': 'ID or passport · buyer',
    'Pasaporte · compradora': 'Passport · buyer', 'Declaración de origen de fondos': 'Source-of-funds declaration', 'Declaración de origen de fondos (compradora)': 'Source-of-funds declaration (buyer)', 'Origen lícito de fondos': 'Lawful source of funds',
    'Carta de pre-aprobación crédito Bancolombia': 'Bancolombia pre-approval letter', 'Carta de pre-aprobación de crédito (opcional)': 'Mortgage pre-approval letter (optional)', 'Avalúo comercial': 'Commercial appraisal', 'Avalúo bancario': 'Bank appraisal',
    'Póliza de arrendamiento · afianzadora': 'Rental bond · guarantor company', 'Codeudor o póliza de afianzadora': 'Co-signer or guarantor bond', 'RUT · propietaria': 'Tax ID (RUT) · owner', 'Licencia de construcción · Planeación Guatapé': 'Building permit · Guatapé Planning',
    'Certificado laboral o de ingresos': 'Employment or income certificate', 'Certificado laboral y extractos': 'Employment certificate & bank statements', 'Extractos bancarios · últimos 3 meses': 'Bank statements · last 3 months',
    'Certificación bancaria para pagos': 'Bank certificate for payments', 'Certificados y escrituras': 'Certificates & deeds', 'Contratos de arriendo': 'Lease agreements', 'Todos los contratos de arriendo': 'All lease agreements',
    'Requisito bancario para pagos altos': 'Bank requirement for large payments', 'Respaldan tu capacidad de pago en un arriendo': 'Back your ability to pay rent', 'Certifica que no debes cuotas de administración': 'Certifies you owe no HOA fees',
    'PDF o foto · Llave lo lee y valida en segundos': 'PDF or photo · Llave reads and validates it in seconds', 'Lo que necesitamos de ti para vender': 'What we need from you to sell', 'Documentos de tus propiedades en administración': 'Documents for your managed properties',
    'Mobiliario incluido (anexo inventario)': 'Furniture included (inventory annex)', 'Redlines': 'Redlines', 'redlines': 'redlines', 'cláusulas': 'clauses', 'Cláusulas': 'Clauses', 'Firmantes': 'Signers', 'Firma': 'Signature',
    // CRM / calendar / events
    'Recorrido': 'Tour', 'Visita de captación': 'Acquisition visit', 'Captación · Hernán Vélez · Rionegro': 'Acquisition · Hernán Vélez · Rionegro', 'Open house': 'Open house', 'Sesión foto/video': 'Photo/video shoot',
    'Próxima visita': 'Next visit', 'Próxima': 'Next', 'Próximo': 'Next', 'Próximos': 'Upcoming', 'Próximas': 'Upcoming', 'Próximos 10 días': 'Next 10 days', 'Próximos 120 días': 'Next 120 days', 'Próximos pagos': 'Upcoming payments', 'Próximo paso': 'Next step',
    'Sin eventos en los próximos 10 días': 'No events in the next 10 days', 'Sin eventos próximos': 'No upcoming events', 'Agenda libre': 'Free calendar', 'Sin agenda': 'Nothing scheduled', 'Sin órdenes': 'No orders', 'Aún no tienes solicitudes': 'No requests yet',
    'Aún no participas en el reparto de ningún negocio': 'You are not part of any deal split yet', 'Así van tus negociaciones': 'How your negotiations are going', 'Hiciste una oferta': 'You made an offer', 'Esperando respuesta del propietario': 'Waiting for the owner\'s reply',
    'Esperando aprobación del propietario': 'Waiting for the owner\'s approval', 'Esperando tu respuesta': 'Waiting for your reply', 'Interés alto': 'High interest', 'Interés medio': 'Medium interest', 'Interés bajo': 'Low interest', 'Inmueble de interés': 'Property of interest',
    'Fuente': 'Source', 'Referido': 'Referral', 'referido': 'referred', 'Referidos activos': 'Active referrals', 'Compradores referidos': 'Referred buyers', 'Web': 'Web', 'WhatsApp conectado': 'WhatsApp connected',
    'Tu conversación con': 'Your conversation with', 'Escríbele a': 'Write to', 'Escribe a': 'Write to', 'Lo que dicen los visitantes': 'What visitors say', 'Visitas realizadas': 'Visits done', 'Visitas esta semana': 'Visits this week', 'Recorridos esta semana': 'Tours this week',
    'realizadas': 'done', 'agendadas': 'scheduled', 'Puedes agendar varios el mismo día; Mateo arma la ruta': 'You can book several the same day; Mateo plans the route', 'Compara y pide un recorrido': 'Compare and request a tour',
    'describe lo que buscas con tus palabras': 'describe what you are looking for in your own words', 'Ofertas y contraofertas': 'Offers & counter-offers', 'Oferta recibida': 'Offer received', 'Tu asesor': 'Your broker', 'Tu asesor:': 'Your broker:',
    'Tu administradora Dorum': 'Your Dorum administrator', 'responde en ~15 min': 'replies in ~15 min', 'Semana del': 'Week of',
    // rentals / maintenance
    'Tickets abiertos': 'Open tickets', 'Novedades abiertas': 'Open issues', 'Técnico asignado': 'Technician assigned', 'Ayuda al técnico a llegar preparado': 'Help the technician arrive prepared', 'Repórtalo aquí; Llave asigna técnico': 'Report it here; Llave assigns a technician',
    'Cuéntanos qué pasa': 'Tell us what is happening', '¿Qué pasó?': 'What happened?', 'Ej: el calentador no da agua caliente desde ayer': 'E.g. the water heater has had no hot water since yesterday', 'Daño en casa': 'Issue at home',
    'Plomería': 'Plumbing', 'Eléctrico': 'Electrical', 'Humedad': 'Damp', 'Cerrajería': 'Locksmith', 'Electrodomésticos': 'Appliances', 'Pintura general': 'General painting', 'Pisos laminados': 'Laminate floors', 'Ventanas y cortinas': 'Windows & curtains',
    'Balcón y barandas': 'Balcony & railings', 'Cocina integral': 'Fitted kitchen', 'Calentador de paso': 'Tankless water heater', 'Edificio y administración': 'Building & HOA', 'Portería del edificio': 'Building reception', 'Horario portería': 'Reception hours',
    'Contactos de emergencia': 'Emergency contacts', 'Emergencias': 'Emergencies', 'Mascotas': 'Pets', 'Dirección': 'Address', 'Cómo llegar': 'Directions', 'Buen estado': 'Good condition', 'Mantenimiento aprobado': 'Maintenance approved',
    'Entrega de llaves e inventario:': 'Key handover & inventory:', 'Tu canon, tus recibos, sin filas': 'Your rent, your receipts, no queues', 'Tu hogar, con todo resuelto': 'Your home, everything handled', 'Tu primer canon vence el': 'Your first rent is due on',
    'Primer canon el 1 de oct': 'First rent on 1 Oct', 'Según contrato · te avisamos antes': 'Per contract · we notify you first', 'Bienvenidas': 'Welcome', 'Canon de septiembre recibido': 'September rent received', 'Canon de octubre': 'October rent', 'Liquidación de agosto': 'August payout',
    'Vence 5 oct · pagar desde el reloj': 'Due 5 Oct · pay from the watch', 'Se abona el 30 sep': 'Paid on 30 Sep',
    // misc chrome
    'Equipo': 'Team', 'Perfil': 'Profile', 'Perfil de la agencia': 'Agency profile', 'Nombre comercial': 'Trade name', 'Razón social': 'Legal name', 'Idiomas': 'Languages', 'Integraciones': 'Integrations', 'Plan y facturación': 'Plan & billing',
    'Roles y permisos': 'Roles & permissions', 'Almacenamiento': 'Storage', 'Marca': 'Brand', 'Mercados y divisiones': 'Markets & divisions', 'Datos de ejemplo': 'Sample data', 'ejemplo': 'sample', 'en vivo': 'live', 'Ojo:': 'Heads-up:',
    'Módulo en construcción. Otro equipo lo está armando sobre este mismo sistema; aparecerá aquí cuando lo registren': 'Module under construction. Another team is building it on this same system; it will appear here once registered',
    'Este widget no pudo renderizarse': 'This widget could not render', 'El módulo no pudo renderizarse:': 'The module could not render:', 'Multi-tenant · demo': 'Multi-tenant · demo', 'Ya estás en esta agencia': 'You are already in this agency',
    'Casa Andina Realty · Bogotá': 'Casa Andina Realty · Bogotá', 'Costa Prime · Cartagena': 'Costa Prime · Cartagena', 'Ver todos': 'View all', 'Detalle por inmueble': 'Detail by listing',
    'Uniendo la naturaleza con la vida moderna': 'Uniting nature with modern life', 'Curated by nature': 'Curated by nature',
    'Embalse': 'Reservoir', 'Embalse de Guatapé': 'Guatapé reservoir', 'Guatapé y Embalse': 'Guatapé & Reservoir', 'Oriente Antioqueño': 'Oriente Antioqueño', 'México': 'Mexico', 'Dubái': 'Dubai', 'Berlín': 'Berlin',
    // vocabulary that shows up inside composed strings
    'con Llave': 'with Llave', 'en Dorum': 'at Dorum', 'entrega': 'delivery', 'entrega en': 'delivery in', 'en inglés': 'in English', 'firmado': 'signed', 'enviada': 'sent', 'enviada al comprador': 'sent to the buyer', 'enviado a firma electrónica': 'sent for e-signature',
    'registrado en el CRM': 'logged in the CRM', 'registrada en el expediente': 'filed on the record', 'registrado en la actividad': 'logged in the activity', 'revisa antes de enviar': 'review before sending', 'actualizado': 'updated',
    'invitación enviada por WhatsApp': 'invitation sent via WhatsApp', 'agenda bloqueada e invitación enviada': 'calendar blocked and invitation sent', 'listo para pautar': 'ready to run ads', 'etiquetados por AI': 'AI-tagged',
    'comisión': 'commission', 'moneda base': 'base currency', 'margen': 'margin', 'mediana': 'median', 'referido −': 'referral −', 'estrato': 'estrato', 'contrato': 'contract', 'cuenta': 'account', 'docs comprador': 'buyer docs',
    'esperando aprobación de Dorum': 'awaiting Dorum approval', 'genera otrosí desde la plantilla al aprobar': 'generates an addendum from the template on approval', 'IPC + 1 punto pactado': 'CPI + 1 point agreed', 'IPC año anterior': 'previous-year CPI',
    'Llave redactó el agradecimiento para aprobar': 'Llave drafted the thank-you note for approval', 'Llave regenerará con tus notas': 'Llave will regenerate with your notes', 'proyecto de producción creado con plantilla': 'production project created from template',
    'redactado por Llave, aprobado por': 'drafted by Llave, approved by', 'últimos 30 días': 'last 30 days', 'clic en un punto para ver el mapeo de campos': 'click a dot to see the field mapping', 'push solo si hay cambio →': 'push only on change →',
    'inventario · precios · fotos · textos': 'inventory · prices · photos · copy', 'para portales / redactor': 'for portals / writer', 'por subir': 'to upload', 'por persona': 'per person', 'por grupo': 'per group', 'por noche': 'per night',
    'Hasta': 'Up to', 'hasta': 'until', 'a partir de las notas de voz de tu asesor': 'from your broker\'s voice notes', 'Tu expediente de arrendamiento en': 'Your rental file at', 'Tus inmuebles, Mateo.': 'Your listings, Mateo.',
    'Hola': 'Hi', 'Perfecto, gracias. ¿Cuándo es el inventario?': 'Perfect, thanks. When is the inventory?', 'Hola Daniela, el calentador no está dando agua caliente.': 'Hi Daniela, the water heater is not giving hot water.',
    'Aprueba la cotización': 'Approve the quote', 'Aprueba una cotización': 'Approve a quote', 'Cotización por aprobar': 'Quote to approve', 'Cotización': 'Quote', 'Cotizaciones': 'Quotes', 'Orden recibida': 'Order received', 'Orden en curso:': 'Order in progress:',
    'Nuevas · por aceptar': 'New · to accept', 'Recibido; en revisión por el equipo Dorum': 'Received; under review by the Dorum team', 'Recibido · en revisión': 'Received · in review', 'Entrega en Llave': 'Deliver in Llave',
    'Fotos (paquete básico, día 1–2)': 'Photos (basic package, day 1–2)', 'Fotos + video + dron (día 1–4)': 'Photos + video + drone (day 1–4)', 'Dron + fotos de lote y linderos (día 1–3)': 'Drone + lot & boundary photos (day 1–3)',
    'Redacción corta ES (día 2–3)': 'Short write-up ES (day 2–3)', 'Redacción bilingüe ES/EN (día 4–6)': 'Bilingual write-up ES/EN (day 4–6)', 'Redacción “patrimonial” ES/EN (día 5–7)': '“Heritage” write-up ES/EN (day 5–7)',
    'Comps & precio sugerido (día 2–3)': 'Comps & suggested price (day 2–3)', 'Comps rurales + uso de suelo (día 2–5)': 'Rural comps + land use (day 2–5)', 'Creativos para Instagram y portales (día 6–8)': 'Creatives for Instagram & portals (day 6–8)',
    'Reel Instagram (día 7–9)': 'Instagram reel (day 7–9)', 'Publicar Finca Raíz + Wasi + Sitio (día 4)': 'Publish Finca Raíz + Wasi + Site (day 4)', 'Validar payload y publicar en 3 portales (día 9)': 'Validate payload and publish on 3 portals (day 9)',
    'Publicar + pauta inversionistas (día 10+)': 'Publish + investor ads (day 10+)', 'Pauta Meta 14 días (día 10+)': 'Meta ads 14 days (day 10+)', 'Cotización remodelación / glamping (opcional)': 'Remodel / glamping quote (optional)',
    'Cómo va la preparación': 'How preparation is going', 'Cómo funciona': 'How it works', 'Descripción actualizada (ES + EN)': 'Description updated (ES + EN)', 'Instagram · Reel publicado': 'Instagram · Reel published',
    'Finca Raíz · Pendiente': 'Finca Raíz · Pending', 'Wasi · Pendiente': 'Wasi · Pending', 'Metrocuadrado · Pendiente': 'Metrocuadrado · Pending', 'Wasi · Ficha creada': 'Wasi · Listing created', 'Metrocuadrado · Publicado': 'Metrocuadrado · Published',
    'Finca Raíz · Publicado (lanzamiento)': 'Finca Raíz · Published (launch)', 'Finca Raíz · Precio y 8 fotos sincronizados': 'Finca Raíz · Price and 8 photos synced', 'Finca Raíz · Estado → Bajo oferta': 'Finca Raíz · Status → Under offer',
    'Metrocuadrado · Desactualizado': 'Metrocuadrado · Out of date', 'Lotes anteriores': 'Previous batches', 'Proveedores locales Guatapé & Oriente': 'Local vendors Guatapé & Oriente', 'Proveedores · honorarios del mes (cuenta operativa)': 'Vendors · fees this month (operating account)',
    'Aprobadas en el libro · sep': 'Approved in the ledger · Sep', 'Comisiones sep': 'Commissions Sep', 'Pagado en 2026': 'Paid in 2026', 'Pagado 2026': 'Paid 2026', 'Pagado este mes': 'Paid this month', 'Media · esta semana': 'Media · this week',
    'Estimación · tasa de demo': 'Estimate · demo rate', 'Rango de 4 comparables · tu precio marcado en verde': 'Range of 4 comps · your price marked in green', 'Valoración gratuita con comparables reales en 48 horas': 'Free valuation with real comps in 48 hours',
    '¿Vendes o arriendas en Antioquia?': 'Selling or renting out in Antioquia?', 'Comprador internacional (EN)': 'International buyer (EN)', 'Comprador vía Finca Raíz': 'Buyer via Finca Raíz', 'Inversionista · Finca Raíz': 'Investor · Finca Raíz',
    'Inversionistas Bogotá': 'Bogotá investors', 'Expats & diáspora': 'Expats & diaspora', 'Medellín 30–55 · alto poder adquisitivo': 'Medellín 30–55 · high purchasing power', 'Pareja desde Bogotá': 'Couple from Bogotá',
    'Pareja desde Bogotá con Valentina. Ya está confirmada.': 'Couple from Bogotá with Valentina. Already confirmed.', 'Compradora internacional · 2025': 'International buyer · 2025', 'Familia inversionista': 'Investor family',
    'Se reutilizan al crear una campaña desde un inmueble': 'Reused when creating a campaign from a listing', 'Tarea · Guatapé · Mateo Restrepo': 'Task · Guatapé · Mateo Restrepo', 'Hito del negocio': 'Deal milestone',
    'Sugerir precio de lista (comps El Poblado alto)': 'Suggest list price (upper El Poblado comps)', 'Comps & datos de mercado · Guarne / Oriente': 'Comps & market data · Guarne / Oriente', 'Redacción ES/EN · Finca cafetera': 'Write-up ES/EN · Coffee finca',
    'Sesión de fotos, video y dron · Finca cafetera': 'Photo, video & drone shoot · Coffee finca', 'Gráficos y video para pauta': 'Graphics & video for ads', 'Cotización restauración beneficiadero → glamping': 'Quote: mill restoration → glamping',
    'Validar payload Finca Raíz / Wasi / Metrocuadrado': 'Validate Finca Raíz / Wasi / Metrocuadrado payload', 'Reel Instagram · Finca Los Sauces': 'Instagram reel · Finca Los Sauces', 'Abrir campaña Meta · COP 1.200.000 / 14 días': 'Open Meta campaign · COP 1.200.000 / 14 days',
    'Redactar contraoferta a Emily Chen (COP 3.780 M)': 'Draft counter-offer to Emily Chen (COP 3.780 M)', 'Preparar promesa de compraventa · Esmeraldal': 'Prepare purchase agreement · Esmeraldal', 'Inventario de entrada · Laureles': 'Move-in inventory · Laureles',
    'Visita de captación y firma acuerdo · Penthouse Los Balsos': 'Acquisition visit & agreement signing · Penthouse Los Balsos', 'Traducir ficha y responder lead Austin (EN)': 'Translate listing & reply to Austin lead (EN)',
    'Programar limpieza y chef · reserva 20–22 sep': 'Schedule cleaning & chef · booking 20–22 Sep', 'Recibir paz y salvo administración · Bocagrande': 'Receive HOA clearance · Bocagrande', 'Liquidación mensual propietarios Lifestyle · septiembre': 'Monthly Lifestyle owner payouts · September',
    'Revisar 3 redlines del comprador en acuerdo de reserva': 'Review 3 buyer redlines on reservation agreement', 'Tour Casa de lago': 'Tour Lake house', 'Tour presencial · Emily Chen': 'In-person tour · Emily Chen', 'Visita casa Guayacanes': 'Visit Guayacanes house',
    'Responder contraoferta (AI borrador listo)': 'Reply to counter-offer (AI draft ready)', 'Enviar comparativo Llanogrande vs El Retiro': 'Send Llanogrande vs El Retiro comparison', 'Primer contacto (AI borrador en inglés)': 'First contact (AI draft in English)',
    'Firmó contrato · inventario pendiente': 'Contract signed · inventory pending', 'Llamada de seguimiento · propuesta Lifestyle 10 %': 'Follow-up call · Lifestyle proposal 10 %', 'Primer contacto por WhatsApp (AI borrador)': 'First contact via WhatsApp (AI draft)',
    'Enviar acuerdo de corretaje (AI generado, revisar comisión)': 'Send listing agreement (AI-generated, check commission)', 'Publicado en Finca Raíz, Wasi, Instagram': 'Published on Finca Raíz, Wasi, Instagram', 'Publicado en 3 portales': 'Published on 3 portals',
    'Oferta recibida COP 3.650 M': 'Offer received COP 3.650 M', 'Contraoferta (AI borrador · aprobar)': 'Counter-offer (AI draft · approve)', 'Escritura en Notaría 15 · entrega de llaves': 'Deed at Notary 15 · key handover', 'Captación y acuerdo firmado': 'Acquisition & agreement signed',
    'Pre-aprobación Bancolombia · COP 600 M': 'Bancolombia pre-approval · COP 600 M', 'Oferta COP 815 M recibida': 'Offer COP 815 M received', 'Contrato de arrendamiento firmado (e-sign)': 'Lease agreement signed (e-sign)', 'Inventario de entrada con fotos': 'Move-in inventory with photos',
    'Inicio del contrato · primer canon': 'Lease start · first rent', 'Casa de lago · oferta Emily Chen': 'Lake house · Emily Chen offer', 'Apto Esmeraldal · oferta Camilo Echeverri': 'Esmeraldal apt · Camilo Echeverri offer', 'Apto Provenza · en visitas': 'Provenza apt · in visits',
    'Apto Laureles · Daniel Weber': 'Laureles apt · Daniel Weber', 'Casa El Roble · renta vacacional (Lifestyle)': 'Casa El Roble · vacation rental (Lifestyle)', 'Oficina Milla de Oro · arrendada a Kuna Tech': 'Milla de Oro office · rented to Kuna Tech',
    'Reservas septiembre · Casa El Roble (7 noches)': 'September bookings · Casa El Roble (7 nights)', 'Depósito en garantía · Apto Laureles': 'Security deposit · Laureles apt', 'Fee fotografía + dron · Casa de lago': 'Photo + drone fee · Lake house',
    'Fee redacción y comps · Casa de lago': 'Write-up & comps fee · Lake house', 'Anticipo marketing 10 % · Provenza': 'Marketing advance 10 % · Provenza', 'Liquidación propietario agosto · Casa El Roble (80 %)': 'August owner payout · Casa El Roble (80 %)',
    'Fee administración Lifestyle 20 % · agosto': 'Lifestyle management fee 20 % · August', 'Nómina agosto · 4 empleados': 'August payroll · 4 employees', 'Fee de colocación · Oficina Milla de Oro (1 canon)': 'Placement fee · Milla de Oro office (1 month\'s rent)',
    'Comisión 60 % · Valentina Cardona': 'Commission 60 % · Valentina Cardona', 'Pauta Meta septiembre · 3 campañas': 'Meta ads September · 3 campaigns', 'Arras 10 % · Apto Esmeraldal (proyectado)': 'Earnest money 10 % · Esmeraldal apt (projected)',
    'Huéspedes': 'Guests', 'huéspedes': 'guests', 'Equipo Dorum': 'Dorum team', 'Listing + selling broker': 'Listing + selling broker', 'Agencia Dorum': 'Dorum agency', 'Revisión legal y promesa': 'Legal review & promesa',
    'Paquete foto + dron + video': 'Photo + drone + video package', 'Redacción bilingüe + comps': 'Bilingual write-up + comps', 'Redacción bilingüe & comps': 'Bilingual write-up & comps', 'Anticipo de marketing': 'Marketing advance',
    'Agencia (incluye selling broker si aplica)': 'Agency (includes selling broker if applicable)', '50 % del primer canon (fee de colocación)': '50 % of first month\'s rent (placement fee)', 'Agencia · 50 % del primer canon': 'Agency · 50 % of first month\'s rent',
    'Administración de arriendo 10 % + IVA': 'Rental management 10 % + VAT', 'Administración integral Lifestyle & Experiences 20 %': 'Full Lifestyle & Experiences management 20 %', 'Liquidación mensual al propietario': 'Monthly owner payout',
    '60 % del primer canon': '60 % of first month\'s rent', 'Administración comercial 8 %': 'Commercial management 8 %', 'Administración Dorum 8 %': 'Dorum management 8 %', 'Referido desde Cartagena': 'Referred from Cartagena', 'Arras 10 % al firmar promesa': 'Earnest money 10 % on signing the promesa',
    'Arras 10 %': 'Earnest money 10 %', 'Depósito 2 cánones': 'Deposit 2 months\' rent', 'Reservas cobradas por adelantado (sept)': 'Bookings collected up front (Sep)', 'Depósito en garantía': 'Security deposit',
    'Estudio Luz Verde · foto, video y dron': 'Estudio Luz Verde · photo, video & drone', 'Pauta Meta & Google': 'Meta & Google ads', 'Henao Construcciones Sostenibles': 'Henao Construcciones Sostenibles', 'Asesora hipotecaria · Bancolombia': 'Mortgage advisor · Bancolombia',
    'Asesor · Guatapé & Oriente': 'Broker · Guatapé & Oriente', 'Asesora · Medellín': 'Broker · Medellín', 'Asesor · Cartagena & Internacional': 'Broker · Cartagena & International', 'Administradora de arriendos · Lifestyle & Experiences': 'Rental administrator · Lifestyle & Experiences',
    'Consulta Finca Raíz': 'Finca Raíz enquiry', 'Consulta Metrocuadrado': 'Metrocuadrado enquiry', 'Familia Restrepo Gómez': 'Restrepo Gómez family', 'Inversiones Peñol S.A.S.': 'Inversiones Peñol S.A.S.',
    'Sesión de fotos': 'Photo shoot', 'Premium: 40 fotos + video 90 s + dron': 'Premium: 40 photos + 90 s video + drone', 'Bloqueado por t-001 (fotos)': 'Blocked by t-001 (photos)', 'AI seleccionó 9 clips; falta aprobar música': 'AI picked 9 clips; music still to approve',
    'Borrador AI listo (320 palabras). Revisar tono "patrimonial"': 'AI draft ready (320 words). Check the "heritage" tone', '6 comparables en 12 km. Precio sugerido COP 2.050–2.200 M': '6 comps within 12 km. Suggested price COP 2.050–2.200 M',
    'AI propone 3.780 M con cierre en 45 días. Aprobar o editar': 'AI proposes 3.780 M with a 45-day closing. Approve or edit', 'Rango AI: COP 2.950–3.250 M · 8,9 M/m²': 'AI range: COP 2.950–3.250 M · 8,9 M/m²',
    'AI propone COP 3.780 M · entrega 45 días · muebles incluidos': 'AI proposes COP 3.780 M · 45-day handover · furniture included', 'Comprador pide arras 5 % en vez de 10 %; fecha escritura 30 nov': 'Buyer asks for 5 % earnest money instead of 10 %; deed date 30 Nov',
    'Se genera desde las fotos del recorrido del 25 sep': 'Generated from the photos of the 25 Sep walkthrough', 'Sin gravámenes. Matrícula 001-1234567. Emitido hace 12 días': 'No liens. Folio 001-1234567. Issued 12 days ago',
    'Falta sello de pago del 2.º trimestre': 'Missing payment stamp for Q2', 'Nombre coincide con promesa': 'Name matches the promesa', 'Nombre y número coinciden con el contrato': 'Name and number match the contract', 'COP 600.000.000 · vence 2026-12-14': 'COP 600.000.000 · expires 2026-12-14',
    'Emitido hace 47 días; notaría exige < 30': 'Issued 47 days ago; notary requires < 30', 'Actividad económica 6810 OK': 'Economic activity 6810 OK', 'Vigente hasta 2027-03': 'Valid until 2027-03',
    'Luxe by The Charlee · compradores internacionales': 'Luxe by The Charlee · international buyers', 'Lotes con vista al embalse · inversionistas Medellín': 'Reservoir-view lots · Medellín investors', 'Búsqueda Google · "finca Llanogrande venta"': 'Google Search · "finca Llanogrande venta"',
    'Villa Tulum · US buyers': 'Villa Tulum · US buyers', 'Meta · Instagram': 'Meta · Instagram', 'Meta · Facebook + Instagram': 'Meta · Facebook + Instagram', 'Meta · Instagram Reels': 'Meta · Instagram Reels', 'Google Ads · Search': 'Google Ads · Search',
    'Comps del Oriente antioqueño · lead nuevo desde Meta Ads': 'Oriente antioqueño comps · new lead from Meta Ads', 'Basado en la contraoferta k-002 y el tour del 19 sep': 'Based on counter-offer k-002 and the 19 Sep tour',
    'Datos tomados de doc-014 y la ficha del inmueble': 'Data from doc-014 and the listing record', 'Traducido y adaptado al comprador internacional': 'Translated and adapted for the international buyer',
    'Argumentos tomados del acuerdo de corretaje estándar · revisar la comisión antes de enviar': 'Arguments from the standard listing agreement · check the commission before sending',
    // watch / tv
    'Toca el orb: «Llave, léeme el primero»': 'Tap the orb: “Llave, read me the first one”', 'Canon de octubre': 'October rent', 'Pipeline, escrow y agenda de hoy': 'Pipeline, escrow and today\'s agenda',
    'Wallboard': 'Wallboard', 'Tablero de la agencia': 'Agency board', 'Pipeline de la agencia': 'Agency pipeline', 'Agenda de hoy': 'Today\'s agenda', 'Escrow y liberaciones': 'Escrow & releases', 'Pauta y leads': 'Ads & leads',
    // weekdays / months (short)
    // AI digest & inbox fragments
    '. Hay': '. There are', 'negocios bajo oferta': 'deals under offer', 'está redactada y espera tu aprobación; llegaron': 'is drafted and awaiting your approval;', 'leads nuevos': 'new leads',
    'hoy, ya con primer contacto sugerido.': 'arrived today, already with a suggested first contact.', 'En escrow hay': 'Escrow holds', 'eventos': 'events', 'listos para que decidas': 'ready for you to decide',
    'borradores de Llave esperan una decisión humana': 'Llave drafts await a human decision', 'más en la bandeja': 'more in the inbox', 'liberación': 'release', 'liberaciones': 'releases', 'liberación pendiente': 'release pending', 'liberaciones pendientes': 'releases pending',
    'Marcado como leído': 'Marked as read', 'Mañana a las 6:30 llega el siguiente': 'The next one arrives tomorrow at 6:30', 'Hoy tienes': 'Today you have', 'el primero:': 'first up:', 'Dejé': 'I left', 'Agenda despejada para hoy': 'Clear calendar today',
    'lun': 'Mon', 'mar': 'Tue', 'mié': 'Wed', 'jue': 'Thu', 'vie': 'Fri', 'sáb': 'Sat', 'dom': 'Sun', 'ene': 'Jan', 'feb': 'Feb', 'abr': 'Apr', 'may': 'May', 'jun': 'Jun', 'jul': 'Jul', 'ago': 'Aug', 'sep': 'Sep', 'sept': 'Sep', 'oct': 'Oct', 'nov': 'Nov', 'dic': 'Dec',
    'abr. · may. · jun. · jul. · ago. · sept.': 'Apr · May · Jun · Jul · Aug · Sep', 'vs. agosto': 'vs. August', 'vs. septiembre': 'vs. September', 'vs. mes anterior': 'vs. previous month', 'agosto': 'August', 'septiembre': 'September', 'octubre': 'October', 'noviembre': 'November', 'diciembre': 'December', 'ene–sep 2026': 'Jan–Sep 2026', 'en millones COP': 'in COP millions', 'y': 'and', 'de': 'of', 'por': 'per', 'con': 'with', 'sin': 'without', 'o': 'or'
  };
})();

/* ------------------------------------------------ sales site (index.html) · ES copy */
(function () {
  'use strict';
  var I = window.I18N;
  // Keys match data-i18n attributes in index.html (EN lives in the HTML). Arrays are [es, en] pairs for site.js.
  I.dict.site = {
    "s.nav.pipeline": "Pipeline",
    "s.nav.modules": "Módulos",
    "s.nav.roles": "Roles",
    "s.nav.voice": "Voz",
    "s.nav.screens": "Pantallas",
    "s.nav.pricing": "Precios",
    "s.nav.demo": "Abrir la demo",
    "s.hero.eyebrow": "El sistema operativo para inmobiliarias",
    "s.hero.title": "Toda la agencia desde una sola <em>llave.</em>",
    "s.hero.lead": "Llave reemplaza ChatGPT, Dropbox, Go High Level, Wasi y el back office de Finca Raíz con un solo sistema. La IA hace los pasos: la redacción, el seguimiento, el borrador del contrato, el reparto de comisiones. Tu equipo los aprueba con un toque.",
    "s.hero.cta1": "Abrir la demo de Dorum",
    "s.hero.cta2": "Vélo en todas las pantallas",
    "s.hero.trust": "Construido primero con Dorum Lifestyle · Guatapé y Medellín",
    "s.rep.label": "Reemplaza",
    "s.rep.keeps": "<b style=\"color:var(--text-2);font-weight:600\">Conserva</b> <span class=\"pill pill-brand\">Finca Raíz</span><span class=\"pill pill-brand\">Metrocuadrado</span><span class=\"pill pill-brand\">Wasi</span><span class=\"pill pill-brand\">Instagram</span> como destinos de publicación: se envían desde la ficha del inmueble, solo cuando tú lo dices.",
    "s.prob.eyebrow": "Por qué se traban las inmobiliarias",
    "s.prob.title": "Una agencia boutique funciona con cinco herramientas y un grupo de WhatsApp.",
    "s.prob.lead": "El equipo de Dorum redactaba fichas en ChatGPT, guardaba el video de dron en Dropbox, pautaba en Go High Level, publicaba desde Wasi y cuadraba comisiones en una hoja de cálculo. Cada negocio era una búsqueda del tesoro.",
    "s.prob.1.t": "Cada paso vive en una herramienta distinta",
    "s.prob.1.p": "La orden de fotos está en WhatsApp, la redacción en ChatGPT, el contrato en el correo, el pago en la app del banco. Nadie ve en qué punto va realmente el negocio.",
    "s.prob.1.tools": "<span>WhatsApp</span><span>ChatGPT</span><span>Dropbox</span><span>Gmail</span><span>Bancolombia</span>",
    "s.prob.2.t": "Nada tiene plantilla",
    "s.prob.2.p": "Cada inmueble arranca de cero: carpeta nueva, prompt nuevo, checklist de memoria. El acuerdo de corretaje se vuelve a tipear, el paz y salvo se olvida, el post de Instagram sale con el precio del mes pasado.",
    "s.prob.2.tools": "<span>Sin plantilla de proyecto</span><span>Sin biblioteca de cláusulas</span><span>Sin checklist</span>",
    "s.prob.3.t": "La dueña no ve el negocio completo",
    "s.prob.3.p": "Valor del pipeline, dinero en escrow, comisiones por pagar, cánones recaudados: repartidos en cinco logins y en la cabeza de tres personas. El cierre de mes es una reconstrucción, no un reporte.",
    "s.prob.3.tools": "<span>Hoja de cálculo</span><span>Memoria</span><span>Pánico de fin de mes</span>",
    "s.pipe.eyebrow": "Un solo pipeline, con plantilla de punta a punta",
    "s.pipe.title": "Desde el primer anuncio hasta las <em>llaves</em>, cada paso ya sabe qué viene después.",
    "s.pipe.lead": "Firmar el acuerdo de corretaje crea el proyecto de mercadeo. Publicar abre el pipeline de venta. Una oferta aceptada abre el checklist de documentos y el libro de escrow. Toca un paso para ver qué hace Llave sola y dónde firma una persona.",
    "s.pipe.legend.ai": "Llave lo hace automáticamente",
    "s.pipe.legend.hu": "una persona con nombre aprueba",
    "s.mod.eyebrow": "Módulos",
    "s.mod.title": "Quince módulos. Un solo registro por inmueble, persona, negocio y peso.",
    "s.mod.lead": "Todos los módulos leen y escriben los mismos objetos: un cambio de precio en el inmueble llega a los portales, a la campaña, a la pantalla del vendedor y a la proyección de comisiones sin que nadie lo copie.",
    "s.mod.cms.t": "CMS y sitios de inmuebles",
    "s.mod.cms.p": "Editor del sitio de marca, bilingüe ES/EN. Cada ficha de propiedad se vuelve su propia landing con formularios conectados al CRM.",
    "s.mod.cms.r": "Reemplaza <s>sitio Wasi</s>, <s>Wix</s>",
    "s.mod.crm.t": "CRM · captar y vender",
    "s.mod.crm.p": "Dos pipelines: vendedores y arrendadores por captar, compradores y arrendatarios por convertir. Hilos de WhatsApp, resúmenes de llamadas, seguimientos de IA esperando aprobación.",
    "s.mod.crm.r": "Reemplaza <s>Go High Level</s>, <s>CRM de Wasi</s>",
    "s.mod.proj.t": "Proyectos con plantilla",
    "s.mod.proj.p": "Por cada inmueble nace un proyecto con el paquete de mercadeo: fotos, redacción, comps, gráficos, pauta. Proveedores asignados, fechas definidas.",
    "s.mod.proj.r": "Reemplaza <s>Trello</s>, <s>grupos de WhatsApp</s>",
    "s.mod.contracts.t": "Negociación de contratos",
    "s.mod.contracts.p": "Acuerdo de corretaje, promesa de compraventa, contrato de arrendamiento. Redlines rastreados, firma electrónica, aprobación del abogado.",
    "s.mod.contracts.r": "Reemplaza <s>Word + correo</s>",
    "s.mod.paper.t": "Documentos",
    "s.mod.paper.p": "Checklists por tipo de negocio: cédula, certificado de tradición y libertad, paz y salvo, avalúo, predial. El OCR valida nombres y vigencias y le recuerda a quien debe entregar.",
    "s.mod.paper.r": "Reemplaza <s>Dropbox</s>, <s>papel</s>",
    "s.mod.media.t": "Gestión de imágenes",
    "s.mod.media.p": "Biblioteca por inmueble, etiquetado con IA por espacio y calidad, orden automático para portales, marca de agua, bandeja de entrega para foto, video y dron.",
    "s.mod.media.r": "Reemplaza <s>Dropbox</s>, <s>Google Fotos</s>",
    "s.mod.pub.t": "Publicación y sindicación",
    "s.mod.pub.p": "Un solo envío a Finca Raíz, Wasi y Metrocuadrado con validación por portal. Instagram solo si está marcado. Las vistas y los leads vuelven al sistema.",
    "s.mod.pub.r": "Conserva los portales como <b>destinos</b>",
    "s.mod.ads.t": "Pauta digital",
    "s.mod.ads.p": "Campañas en Meta y Google por inmueble o de marca, creativos generados desde las fotos del inmueble, control de presupuesto, CPL y leads directo al CRM.",
    "s.mod.ads.r": "Reemplaza <s>Go High Level</s>",
    "s.mod.money.t": "Escrow · pagos · nómina",
    "s.mod.money.p": "Libro por negocio, motor de reparto con reglas variables, retenciones en escrow con umbrales de aprobación, lotes bancarios, conexión DIAN, nómina mensual.",
    "s.mod.money.r": "Reemplaza <s>la hoja de cálculo</s>",
    "s.mod.rent.t": "Arriendos y Lifestyle",
    "s.mod.rent.p": "Recaudo mensual, incrementos por IPC, tickets de mantenimiento, inventario de entrada con fotos, extractos al propietario. Rentas vacacionales liquidadas cada mes.",
    "s.mod.rent.r": "Reemplaza <s>Wasi</s>, <s>Excel</s>",
    "s.mod.reports.t": "Reportes",
    "s.mod.reports.p": "Velocidad del pipeline, días en mercado, atribución por fuente, inversión vs. leads, proyección de comisiones, cartera de arriendos: en vivo, no reconstruidos.",
    "s.mod.reports.r": "Reemplaza <s>el cierre de mes</s>",
    "s.mod.voice.t": "Voz",
    "s.mod.voice.p": "Palabra clave «Llave». En la app, en el reloj, en notas de voz de WhatsApp. Cada intención devuelve una tarjeta; dinero y lo legal exigen un «confirmar» hablado.",
    "s.mod.voice.r": "Reemplaza <s>escribir desde el carro</s>",
    "s.roles.eyebrow": "Cada rol tiene su propio OS",
    "s.roles.title": "Un vendedor, un fotógrafo y una contadora abren el mismo enlace y ven tres productos distintos.",
    "s.roles.lead": "Los roles son datos, no código: permisos, navegación y widgets de inicio. Renombra «Broker» como «Asesor», agrega un líder de mercadeo, limita a un proveedor a sus órdenes.",
    "s.roles.open": "Abrir en vivo",
    "s.money.eyebrow": "Escrow, pagos, nómina",
    "s.money.title": "Dinero que <em>se reparte solo.</em>",
    "s.money.lead": "Cada negocio lleva reglas de reparto ordenadas. Cuando entra la plata (arras en la promesa, saldo en la escritura, canon el cinco) el libro las aplica y la contadora libera un solo lote.",
    "s.money.k1.b": "Pago directo",
    "s.money.k1.s": "Un participante, un monto. El paquete de COP 1.850.000 del fotógrafo, pagado del presupuesto de mercadeo al listar.",
    "s.money.k2.b": "Comisión compartida",
    "s.money.k2.s": "Varias reglas que suman el 100 % del bruto de la agencia: asesor captador, asesor vendedor, agencia, abogado. Se pagan desde escrow al cierre.",
    "s.money.k3.b": "Fee de referido",
    "s.money.k3.s": "Un % o un monto fijo para quien refirió, descontado antes de aplicar las reglas de comisión.",
    "s.money.k4.b": "Repartos por etapas",
    "s.money.k4.s": "La misma persona dos veces: 10 % al listar como anticipo de mercadeo, 30 % al cierre. El fee de administración de arriendos y los salarios corren cada mes.",
    "s.money.note": "Los fondos de clientes viven en un libro de escrow separado. Las liberaciones necesitan a la contadora; por encima de COP 50.000.000 también a la dueña.",
    "s.voice.eyebrow": "Capa de voz",
    "s.voice.title": "Dilo. Llave lo hace. <em>Tú apruebas.</em>",
    "s.voice.lead": "Palabra clave «Llave». Funciona en la app, en el reloj y como nota de voz de WhatsApp desde el carro entre Guatapé y El Poblado. Todo lo que toque dinero, contratos o un portal espera un «confirmar» hablado.",
    "s.voice.watchcap": "Reloj · primero la voz",
    "s.dev.eyebrow": "En todas las pantallas",
    "s.dev.title": "La pared de la dueña, el escritorio de la administradora, el bolsillo del asesor.",
    "s.dev.lead": "Los mismos datos, cinco superficies. Estos marcos son la demo en vivo, no capturas: haz scroll dentro de ellos.",
    "s.dev.c1": "Dueña · escritorio · todo, aprobaciones primero",
    "s.dev.c2": "Admin de ventas · tablet · tablero de proyecto por inmueble",
    "s.dev.c3": "Asesor · celular · Realtor OS",
    "s.dev.c4": "Pantalla de oficina · TV · pipeline, escrow, recorridos de hoy",
    "s.dev.c5": "Reloj · próxima visita, di «Llave»",
    "s.dev.gallery": "Ver la galería completa de dispositivos",
    "s.ten.eyebrow": "Multi-tenant",
    "s.ten.title": "Una plataforma, <em>muchas agencias.</em>",
    "s.ten.lead": "Cada agencia tiene su marca, dominio, paquete legal, roles e integraciones sobre una infraestructura compartida. Dorum Lifestyle es el tenant uno; los dos cupos siguientes están abiertos.",
    "s.ten.live": "En vivo · tenant demo",
    "s.ten.2.t": "Tu agencia en Bogotá",
    "s.ten.2.p": "Apartamentos urbanos, estrato 5–6, arriendos corporativos. Los mismos módulos, tu biblioteca de cláusulas, tus comisiones por defecto.",
    "s.ten.3.t": "Tu agencia en la costa",
    "s.ten.3.p": "Rentas vacacionales y compradores internacionales. Inmuebles en USD, tarifas por noche, liquidaciones mensuales al propietario, concierge incluido.",
    "s.ten.seat": "Cupo abierto",
    "s.ten.stat.listings": "inmuebles",
    "s.ten.stat.people": "personas",
    "s.ten.stat.offices": "oficinas",
    "s.ten.f1": "<b>Marca blanca</b>Tu logo, colores y dominio en el sitio de la inmobiliaria, las fichas, los correos y la app.",
    "s.ten.f2": "<b>Roles por tenant</b>Renombra roles, crea nuevos, cambia lo que ve cada uno: configuración, nunca un despliegue.",
    "s.ten.f3": "<b>Datos aislados</b>Documentos, libros y conversaciones separados por tenant, con opción de residencia de datos.",
    "s.ten.f4": "<b>Integraciones por tenant</b>Tu perfil de Finca Raíz, tu línea de WhatsApp Business, tus cuentas escrow en Bancolombia, tu DIAN.",
    "s.road.eyebrow": "Próximamente",
    "s.road.title": "De vender la casa a operar la <em>vida</em> que pasa adentro.",
    "s.road.lead": "La división Lifestyle &amp; Experiences de Dorum ya convierte compras en activos productivos. El roadmap de Llave sigue el mismo arco: primero arriendos, luego los servicios que un huésped o arrendatario pide desde su pantalla de inicio, después la remodelación y la construcción desde cero de Dorum Projects.",
    "s.road.0.w": "Fase 0 · ahora",
    "s.road.0.t": "Demo",
    "s.road.0.p": "Sitio de ventas, app del tenant con inicios por rol, sitio de la inmobiliaria Dorum, mockups por dispositivo.",
    "s.road.0.o": "Vender la visión a Dorum y a los próximos tenants",
    "s.road.1.w": "Fase 1 · 0–3 meses",
    "s.road.1.t": "Núcleo",
    "s.road.1.p": "Acceso + roles, Inmuebles, Fotos, los dos pipelines de CRM, Proyectos, CMS del sitio, envío a Finca Raíz + Wasi.",
    "s.road.1.o": "Dorum deja Wasi y Dropbox",
    "s.road.2.w": "Fase 2 · 3–6 meses",
    "s.road.2.t": "Dinero y legal",
    "s.road.2.p": "Contratos + firma electrónica, Documentos con validación de IA, Escrow y motor de reparto, Pagos, Nómina.",
    "s.road.2.o": "Dorum cierra negocios de punta a punta en Llave",
    "s.road.3.w": "Fase 3 · 6–9 meses",
    "s.road.3.t": "Crecimiento",
    "s.road.3.p": "Pauta, automatización de WhatsApp, capa de voz, Arriendos, Reportes.",
    "s.road.3.o": "Dorum deja Go High Level y ChatGPT",
    "s.road.4.w": "Fase 4 · 9–12 meses",
    "s.road.4.t": "Plataforma",
    "s.road.4.p": "Onboarding multi-tenant, temas por tenant, paquetes legales por país, marketplace de proveedores, servicios Lifestyle.",
    "s.road.4.o": "Entran la segunda y la tercera agencia",
    "s.road.5.w": "Fase 5 · 12 meses+",
    "s.road.5.t": "Construir",
    "s.road.5.p": "Gestión de proyectos de remodelación y construcción desde cero, red de entidades de crédito.",
    "s.road.5.o": "Integración vertical de Dorum Group",
    "s.price.eyebrow": "Precios",
    "s.price.title": "Se cobra por agencia, no por portal.",
    "s.price.lead": "Se factura en USD, con referencia en COP. Proveedores y clientes siempre son gratis: un fotógrafo o un comprador nunca cuenta como puesto.",
    "s.price.1.t": "Asesor",
    "s.price.1.pill": "Asesor independiente",
    "s.price.unit": "/ mes",
    "s.price.1.f1": "Realtor OS: inmuebles, los dos pipelines de CRM, agenda",
    "s.price.1.f2": "Publicación en Finca Raíz, Wasi, Metrocuadrado",
    "s.price.1.f3": "Redacciones, seguimientos y comps con IA y aprobación",
    "s.price.1.f4": "Voz en celular y reloj",
    "s.price.1.f5": "Hasta 25 inmuebles activos",
    "s.price.1.cta": "Probar el Realtor OS",
    "s.price.2.t": "Agencia",
    "s.price.2.pill": "La mayoría de agencias",
    "s.price.2.cop": "≈ COP 1.600.000 / mes · 10 puestos de equipo incluidos, US$29 por puesto adicional",
    "s.price.2.f1": "Todo lo de Asesor para todo el equipo",
    "s.price.2.f2": "Sitio de marca + CMS en tu dominio, bilingüe",
    "s.price.2.f3": "Proyectos con plantilla, roles de proveedor, bandeja de fotos",
    "s.price.2.f4": "Contratos, firma electrónica, documentos con validación de IA",
    "s.price.2.f5": "Escrow, motor de reparto, pagos, nómina, conexión DIAN",
    "s.price.2.f6": "Arriendos, pauta, reportes, automatización de WhatsApp",
    "s.price.2.cta": "Empieza con tu agencia",
    "s.price.3.t": "Enterprise",
    "s.price.3.pill": "Marca blanca",
    "s.price.3.from": "desde US$",
    "s.price.3.cop": "≈ COP 7.800.000 / mes · multi-oficina, multi-país",
    "s.price.3.f1": "Tu marca en todo, incluida la app",
    "s.price.3.f2": "Paquetes legales por país (Colombia, México, Emiratos)",
    "s.price.3.f3": "Roles a medida, umbrales de aprobación, exportes de auditoría",
    "s.price.3.f4": "Residencia de datos, SSO, integraciones de escrow dedicadas",
    "s.price.3.f5": "Marketplace de servicios Lifestyle cuando salga",
    "s.price.3.cta": "Leer el plan de producto",
    "s.price.foot": "Precios de demo. Estas cifras son provisionales para el pitch y se definirán con los primeros tenants; las referencias en COP usan aprox. 4.100 COP por USD y no incluyen IVA. Las tarifas de portales (Finca Raíz, Metrocuadrado) y la pauta se pagan directamente a esas plataformas.",
    "s.cta.eyebrow": "Cuando quieras, arrancamos",
    "s.cta.title": "Dale a cada persona de la agencia la misma <em>llave.</em>",
    "s.cta.lead": "Abre la demo de Dorum como la dueña, cámbiate a un asesor y luego a un vendedor. Después imagínala con tu logo.",
    "s.cta.2": "Ver el sitio de la inmobiliaria Dorum",
    "s.foot.tag": "El sistema operativo para inmobiliarias. Construido primero para Dorum Lifestyle, Medellín.",
    "s.foot.product": "Producto",
    "s.foot.app": "App del tenant",
    "s.foot.mockups": "Mockups",
    "s.foot.site": "Sitio de la inmobiliaria",
    "s.foot.about": "Nosotros",
    "s.foot.docs": "Docs",
    "s.foot.plan": "Plan de producto",
    "s.foot.conv": "Convenciones",
    "s.foot.legal": "Datos de demo. Nombres ficticios salvo la dueña. © 2026 Llave",
    "s.pill.demo": "Abrir demo",
  "s.rep.m1": "Hojas de cálculo", "s.rep.m2": "Caos de WhatsApp", "s.rep.m3": "Carpetas de Canva", "s.rep.m4": "Checklists en papel",
    "s.aria.theme": "Cambiar tema",
    "s.aria.menu": "Menú",
    "meta.title": "Llave OS · El sistema operativo para inmobiliarias",
    "s.pipe.mark.ai": "IA",
    "s.pipe.mark.hu": "Revisión humana",
    "s.pipe.step": [
      "paso",
      "step"
    ],
    "s.pipe.of": [
      "de",
      "of"
    ],
    "s.pipe.module": [
      "Módulo:",
      "Module:"
    ],
    "s.pipe.does": [
      "Llave hace",
      "Llave does"
    ],
    "s.pipe.approves": [
      "Una persona aprueba",
      "A person approves"
    ],
    "s.roles.navfor": [
      "Navegación para",
      "Navigation for"
    ],
    "s.roles.phone": [
      "celular",
      "phone"
    ],
    "s.split.live": [
      "En vivo desde el libro de la demo",
      "Live from the demo ledger"
    ],
    "s.split.offer": [
      "Oferta",
      "Offer"
    ],
    "s.split.commission": [
      "comisión",
      "commission"
    ],
    "s.split.gross": [
      "Comisión bruta",
      "Gross commission"
    ],
    "s.split.total": [
      "Total distribuido",
      "Total distributed"
    ],
    "s.split.rulesListing": [
      "reglas al listar",
      "rules at listing"
    ],
    "s.split.rulesClose": [
      "reglas al cierre",
      "rules at close"
    ],
    "s.split.batch": [
      "escrow → lote",
      "escrow → batch"
    ],
    "s.split.computed": [
      "Calculado por",
      "Computed by"
    ],
    "s.split.from": [
      "a partir de las reglas de reparto del negocio. Escrow esperado:",
      "from the deal's split rules. Escrow expected:"
    ],
    "s.split.atclose": [
      "al cierre",
      "at close"
    ],
    "s.split.atlisting": [
      "al listar",
      "at listing"
    ],
    "s.split.monthly": [
      "mensual",
      "monthly"
    ],
    "s.split.fee": [
      "fee",
      "fee"
    ],
    "s.split.aria": [
      "Reparto de pagos para",
      "Payout split for"
    ],
    "s.voice.note": [
      "nota de voz",
      "voice note"
    ],
    "s.voice.waits": [
      "Espera un «confirmar»",
      "Waits for “confirmar”"
    ],
    "s.voice.all": [
      "Todas las intenciones",
      "All intents"
    ],
    "s.ls.pilot": [
      "Piloto",
      "Pilot"
    ],
    "s.ls.soon": [
      "Próximamente",
      "Coming soon"
    ],
    "s.ten.staff": [
      "equipo",
      "staff"
    ]
  };
})();

/* ------------------------------------------------ app chrome · second pass (harvested strings) */
(function () {
  'use strict';
  var ui = window.I18N.dict.ui, more = {
    'habitación principal': 'main bedroom', 'vista al embalse': 'reservoir view', 'sala': 'living room', 'cocina': 'kitchen', 'exterior': 'exterior', 'terraza': 'terrace', 'zonas verdes': 'green areas', 'recepción': 'reception', 'sala de juntas': 'meeting room', 'piscina': 'pool', 'fachada': 'façade',
    'En lote': 'In batch', 'En estudio': 'Under review', 'moneda base COP': 'base currency COP', 'Zona': 'Area', 'antes del': 'before', 'antes de': 'before', 'Empieza en': 'Starts in', 'días': 'days', 'de 50 GB del plan · antes Dropbox': 'of the plan\'s 50 GB · formerly Dropbox',
    'en producción': 'in production', 'en total': 'in total', 'ordenados por leads': 'sorted by leads', 'pagos aprobados o en cola': 'payments approved or queued', 'Sobre comisiones y honorarios Dorum practica': 'On commissions and fees Dorum applies', 'Activo en portales': 'Live on portals',
    '¿Para qué sirve cada uno?': 'What is each one for?', 'semanas': 'weeks', 'sem.': 'wks', 'campañas': 'campaigns', 'cartas': 'letters', 'en cola': 'queued', 'en pipeline': 'in pipeline', 'en portafolio': 'in portfolio', 'en piloto': 'in pilot', 'en cartas': 'in letters',
    'Vivienda o comercial. Sin pauta paga: portales + Sitio Dorum.': 'Residential or commercial. No paid ads: portals + Dorum site.', 'Vivienda': 'Residential', 'Comercial': 'Commercial', 'Póliza / afianzadora lista para el primer candidato': 'Bond / guarantor ready for the first candidate',
    'por vencer': 'expiring', 'canon atrasado': 'late rent', 'cánones atrasados': 'late rents', 'nuevos con triage de Llave': 'new with Llave triage', 'días de mora': 'days overdue', 'd de mora': 'd overdue', 'de mora': 'overdue', 'En visitas': 'In visits', 'prospecto': 'prospect',
    'la agencia': 'the agency', 'de captación': 'from acquisition', 'negocios abiertos': 'open deals', 'negocio abierto': 'open deal', 'pagos registrados en Llave': 'payments recorded in Llave', 'histórico': 'all time', 'renta puntual (en venta)': 'occasional rental (for sale)', 'programa piloto': 'pilot programme',
    'Próximo check-in:': 'Next check-in:', 'Para': 'For', 'sobre enviado': 'envelope sent', 'sobres enviados': 'envelopes sent', 'Dorum ordena desde una plantilla; tú aceptas o propones fecha.': 'Dorum orders from a template; you accept or propose a date.',
    'Una persona aprueba; el pago sale del split del negocio a 8 días.': 'A person approves; payment comes out of the deal split within 8 days.', 'Visita de seguimiento': 'Follow-up visit', 'de seguimiento': 'follow-up', 'Enviada el': 'Sent on', 'Enviado el': 'Sent on', 'Pagado el': 'Paid on', 'Pagada el': 'Paid on', 'Pagada': 'Paid',
    'Primer canon el': 'First rent on', 'vence el': 'due on', 'servicios más pronto': 'more services soon', 'Cola de revisión legal': 'Legal review queue', 'próxima': 'next', 'próximo': 'next', '≈ 30 % sobre salarios': '≈ 30 % on salaries', 'se paga por PILA': 'paid through PILA', 'Aliados:': 'Partners:', 'lanzamiento': 'launch',
    'página en borrador': 'page in draft', 'páginas en borrador': 'pages in draft', 'abrir en el sitio': 'open on the site', 'Se llena solo con los inmuebles marcados como destacados.': 'Fills itself with the listings flagged as featured.', 'Recibo mi extracto cada mes en WhatsApp. Cero dolores de cabeza.': 'I get my statement on WhatsApp every month. Zero headaches.',
    'Tu conversación con': 'Your conversation with', 'oferta recibida por tus inmuebles': 'offer received on your listings', 'ofertas recibidas por tus inmuebles': 'offers received on your listings', 'Responde la oferta de': 'Respond to the offer from', 'Pago 70 % contado + 30 % crédito · entrega en 90 días': 'Payment 70 % cash + 30 % mortgage · handover in 90 days',
    'Entrega en 60 días': 'Handover in 60 days', 'parqueadero adicional incluido': 'extra parking included', 'sin contratiempos': 'without a hitch', '¡Qué bien! ¿Cómo les pareció el precio?': 'Great! What did they think of the price?', '¿Cuándo es la próxima visita?': 'When is the next visit?', '¿Podemos ajustar el precio?': 'Can we adjust the price?',
    '¿Hay respuesta a mi oferta?': 'Any reply to my offer?', '¿Qué documentos me faltan?': 'Which documents am I missing?', '¿Ya pagaron este mes?': 'Have they paid this month?', '¿Cuándo me entregan las llaves?': 'When do I get the keys?', '¿Puedo pagar con Nequi?': 'Can I pay with Nequi?', '¿Qué tipo de daño?': 'What kind of issue?',
    'inmuebles guardados para comparar': 'listings saved to compare', 'inmueble guardado para comparar': 'listing saved to compare', 'recorrido programado': 'tour scheduled', 'recorridos programados': 'tours scheduled', 'Una pre-aprobación de crédito acelera la respuesta del vendedor.': 'A mortgage pre-approval speeds up the seller\'s reply.',
    'Lo que necesitamos para la promesa de compraventa de': 'What we need for the purchase agreement of', 'Retoque en alcoba 2': 'Touch-up in bedroom 2', 'novedades abiertas en tus propiedades': 'open issues across your properties', 'novedad abierta en tu hogar': 'open issue at your home', 'novedades abiertas en tu hogar': 'open issues at your home',
    'Mantenimiento preventivo de la unidad exterior. Proveedor certificado.': 'Preventive maintenance of the outdoor unit. Certified vendor.', 'Tu primer canon vence el': 'Your first rent is due on', ', 10:00. Llave arma el inventario con las fotos del recorrido.': ', 10:00. Llave builds the inventory from the walkthrough photos.',
    'incluida en tu pago': 'included in your payment', 'Zona de ropas': 'Laundry area', 'Balcón con vista al parque': 'Balcony with park view', 'Bomberos 119': 'Fire brigade 119', 'EPM daños 444 4115': 'EPM faults 444 4115', 'Día 1 de cada mes': 'Day 1 of every month', 'de cada mes': 'of every month',
    '¿Quieres pago automático? Actívalo con Daniela desde Mensajes.': 'Want automatic payment? Turn it on with Daniela from Messages.', 'Enviar reporte': 'Send report', 'Firmado electrónicamente el': 'E-signed on', 'contactos en etapa de visita': 'contacts at the visit stage', 'esperan una decisión humana': 'await a human decision',
    'Dinero y': 'Money &', 'leads en 30 días': 'leads in 30 days', 'días promedio': 'days average', 'Sin inmueble asociado': 'No listing linked', 'foto, video y dron': 'photo, video & drone', 'Primer contacto': 'First contact', 'crédito no aplica para inmueble en México': 'mortgage not applicable for a property in Mexico',
    'docs comprador': 'buyer docs', 'foto nueva seleccionadas por Llave': 'new photo selected by Llave', 'fotos nuevas seleccionadas por Llave': 'new photos selected by Llave', 'textos': 'copy', 'Owner Penthouse Los Balsos': 'Penthouse Los Balsos owner', 'Propietario Penthouse Los Balsos': 'Penthouse Los Balsos owner',
    'Propietario Casa de lago': 'Lake house owner', 'Propietario Esmeraldal': 'Esmeraldal owner', 'Propietario programa Lifestyle': 'Lifestyle programme owner', 'Pago': 'Payment', 'carta vigente': 'letter valid', 'negocio con regla de referido': 'deal with a referral rule', 'negocios con regla de referido': 'deals with a referral rule',
    'Marcar como leído': 'Mark as read', 'Vistas por semana': 'Views per week', 'últimas 8': 'last 8', 'Publicado ·': 'Published ·', 'Renta vacacional': 'Vacation rental', 'Visita de captación': 'Acquisition visit', 'reservas': 'bookings', 'limpieza': 'cleaning', 'extracto': 'statement', 'Nequi': 'Nequi',
    'Buscar inmueble, contacto, negocio…': 'Search listings, contacts, deals…', 'Escribe a Sara…': 'Write to Sara…', 'Escríbele a Mateo…': 'Write to Mateo…', 'Escríbele a Daniela…': 'Write to Daniela…', 'Escríbele a Valentina…': 'Write to Valentina…'
  };
  Object.keys(more).forEach(function (k) { if (ui[k] == null) ui[k] = more[k]; });
})();
