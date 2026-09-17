/* ==========================================================================
   Llave OS · docs site helpers. Plain script; depends on window.DORUM.
   Exposes window.DOCS: chrome(), md(), toc(), processMap(), tenantModel(), roleMatrix()
   ========================================================================== */
(function () {
  'use strict';
  var D = window.DORUM, X = {};
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); };
  X.esc = esc;

  /* ---------------------------------------------------------------- chrome */
  X.chrome = function (active) {
    var links = [['index.html', 'Overview'], ['plan.html', 'Product plan'], ['conventions.html', 'Conventions'], ['../app/index.html#/role/owner/home', 'App'], ['../dorum/index.html', 'Dorum site'], ['../index.html', 'Sales site']];
    var h = document.getElementById('siteHeader');
    if (h) {
      h.className = 'container site-header docs-header';
      h.innerHTML = '<a class="site-logo" href="index.html"><span class="mark">L</span> Llave OS <span class="muted" style="font-family:var(--font-ui);font-size:var(--fs-sm);font-weight:500">/ docs</span></a>' +
        '<nav class="site-nav" id="siteNav">' + links.map(function (l) { return '<a href="' + l[0] + '"' + (l[1] === active ? ' class="is-active"' : '') + '>' + l[1] + '</a>'; }).join('') +
        (window.I18N ? window.I18N.toggleHtml() : '') +
        '<button type="button" class="btn btn-ghost btn-icon" aria-label="Toggle theme" onclick="DORUM.setTheme(document.documentElement.dataset.theme===\'dark\'?\'light\':\'dark\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg></button></nav>' +
        '<button type="button" class="btn btn-ghost btn-icon" id="navBtn" aria-label="Menu" onclick="document.getElementById(\'siteNav\').classList.toggle(\'is-open\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" width="18" height="18" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>';
    }
    // Docs are English-only: say so under the header whenever the shared toggle is set to Spanish.
    function langNote() {
      var n = document.getElementById('docsLangNote');
      if (!n && h) { n = document.createElement('p'); n.id = 'docsLangNote'; n.className = 'container xs muted'; n.style.cssText = 'padding-top:var(--s-2);padding-bottom:0'; h.insertAdjacentElement('afterend', n); }
      if (n) n.textContent = (window.I18N && window.I18N.lang === 'es') ? 'La documentación interna está solo en inglés · Docs are English-only.' : 'Docs are English-only · La documentación está solo en inglés.';
    }
    langNote();
    if (window.I18N) window.I18N.onChange(langNote);
    var f = document.getElementById('siteFooter');
    if (f) {
      f.className = 'site-footer';
      f.innerHTML = '<div class="container row row-between"><span>Llave OS · internal product docs · demo data generated ' + esc(D.generatedAt) + '</span><span class="row" style="gap:var(--s-4)"><a href="PLAN.md">PLAN.md</a><a href="CONVENTIONS.md">CONVENTIONS.md</a><a href="../assets/data.js">data.js</a></span></div>';
    }
  };

  /* -------------------------------------------------------------- markdown */
  // Small hand-written converter: headings, hr, fenced code, tables, nested lists, blockquotes, paragraphs,
  // inline code / bold / italic / links. Good enough for PLAN.md and CONVENTIONS.md.
  function slug(s) { return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*_]/g, '').replace(/[^a-z0-9áéíóúñü\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 64); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2">$2</a>');
    return s;
  }
  X.md = function (src) {
    var lines = src.replace(/\r/g, '').split('\n'), out = [], i = 0, ids = {}, headings = [];
    function uid(t) { var s = slug(t) || 'h', n = 1, id = s; while (ids[id]) id = s + '-' + (++n); ids[id] = 1; return id; }
    function para(buf) { if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>'); }
    var buf = [];
    while (i < lines.length) {
      var ln = lines[i];
      if (/^```/.test(ln)) { para(buf); buf = []; var lang = ln.slice(3).trim(), code = []; i++; while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]); i++; out.push('<pre class="md-code"' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '><code>' + esc(code.join('\n')) + '</code></pre>'); continue; }
      var hm = /^(#{1,6})\s+(.*)$/.exec(ln);
      if (hm) { para(buf); buf = []; var lvl = hm[1].length, txt = hm[2].trim(), id = uid(txt); headings.push({ level: lvl, text: txt.replace(/[`*]/g, ''), id: id }); out.push('<h' + lvl + ' id="' + id + '">' + inline(txt) + '<a class="md-anchor" href="#' + id + '" aria-label="Link">#</a></h' + lvl + '>'); i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(ln)) { para(buf); buf = []; out.push('<hr>'); i++; continue; }
      if (/^\s*\|/.test(ln) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        para(buf); buf = [];
        var cells = function (r) { r = r.trim().replace(/^\|/, '').replace(/\|$/, ''); return r.split(/(?<!\\)\|/).map(function (c) { return c.trim(); }); };
        var head = cells(ln), aligns = cells(lines[i + 1]).map(function (a) { return /^:-+:$/.test(a) ? 'center' : /-+:$/.test(a) ? 'right' : 'left'; });
        i += 2; var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
        out.push('<div class="table-wrap"><table class="table"><thead><tr>' + head.map(function (c, k) { return '<th style="text-align:' + aligns[k] + '">' + inline(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr>' + r.map(function (c, k) { return '<td style="text-align:' + (aligns[k] || 'left') + '">' + inline(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
        continue;
      }
      if (/^\s*>/.test(ln)) { para(buf); buf = []; var q = []; while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, '')); out.push('<blockquote>' + inline(q.join(' ')) + '</blockquote>'); continue; }
      var lm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(ln);
      if (lm) {
        para(buf); buf = [];
        // collect list block
        var items = [];
        while (i < lines.length) {
          var m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (m) { items.push({ ind: m[1].length, ord: /\d/.test(m[2]), text: m[3] }); i++; }
          else if (/^\s{2,}\S/.test(lines[i]) && items.length && !/^\s*\|/.test(lines[i])) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; }
          else break;
        }
        var html = '', stack = [];
        items.forEach(function (it) {
          var depth = Math.floor(it.ind / 2);
          while (stack.length > depth + 1) { html += '</li></' + stack.pop() + '>'; }
          if (stack.length === depth + 1) { html += '</li><li>' + inline(it.text); }
          else { while (stack.length < depth + 1) { var tag = it.ord ? 'ol' : 'ul'; stack.push(tag); html += '<' + tag + '><li>'; } html += inline(it.text); }
        });
        while (stack.length) html += '</li></' + stack.pop() + '>';
        out.push(html);
        continue;
      }
      if (!ln.trim()) { para(buf); buf = []; i++; continue; }
      buf.push(ln.trim()); i++;
    }
    para(buf);
    return { html: out.join('\n'), headings: headings };
  };
  X.readEmbedded = function (id) {
    var el = document.getElementById(id); if (!el) return '';
    return el.textContent.replace(/<\\\/script/g, '</script').replace(/^\n/, '');
  };
  X.toc = function (headings, el) {
    var hs = headings.filter(function (h) { return h.level === 2 || h.level === 3; });
    el.innerHTML = '<p class="eyebrow">On this page</p><ol class="toc-list">' + hs.map(function (h) { return '<li class="lvl-' + h.level + '"><a href="#' + h.id + '">' + esc(h.text) + '</a></li>'; }).join('') + '</ol>';
    var links = el.querySelectorAll('a');
    if (!('IntersectionObserver' in window)) return;
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { current = e.target.id; links.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + current); }); } });
    }, { rootMargin: '-10% 0px -80% 0px' });
    hs.forEach(function (h) { var t = document.getElementById(h.id); if (t) io.observe(t); });
  };

  /* -------------------------------------------------------- SVG utilities */
  function mark(kind) {
    // kind: 'ai' | 'human' | 'ai-human'
    if (kind === 'ai') return { txt: 'AI', fill: 'var(--ai-soft)', ink: 'var(--ai)', w: 24 };
    if (kind === 'human') return { txt: 'Human', fill: 'var(--brand-soft)', ink: 'var(--brand)', w: 44 };
    return { txt: 'AI → ✓', fill: 'var(--ai-soft)', ink: 'var(--ai)', w: 44 };
  }
  function pill(x, y, kind) {
    var m = mark(kind);
    return '<g><rect x="' + (x - m.w) + '" y="' + (y - 8) + '" width="' + m.w + '" height="16" rx="8" fill="' + m.fill + '"/><text x="' + (x - m.w / 2) + '" y="' + (y + 3.5) + '" text-anchor="middle" font-size="9.5" font-weight="600" fill="' + m.ink + '">' + m.txt + '</text></g>';
  }
  function box(x, y, w, h, lines, kind, opts) {
    opts = opts || {};
    var s = '<g class="pm-node' + (opts.cls ? ' ' + opts.cls : '') + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + (opts.fill || 'var(--surface)') + '" stroke="' + (opts.stroke || 'var(--border-strong)') + '" stroke-width="1.2"' + (opts.dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
    var ty = y + (h / 2) - ((lines.length - 1) * 7) + 4 + (kind ? 4 : 0);
    lines.forEach(function (l, k) { s += '<text x="' + (x + 10) + '" y="' + (ty + k * 14) + '" font-size="11.5" fill="var(--text)"' + (k === 0 ? ' font-weight="600"' : ' opacity="0.8"') + '>' + esc(l) + '</text>'; });
    if (kind) s += pill(x + w - 6, y + 2, kind);
    return s + '</g>';
  }
  function arrow(x1, y1, x2, y2, label, opts) {
    opts = opts || {};
    var d;
    if (Math.abs(y1 - y2) < 1) d = 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
    else if (Math.abs(x1 - x2) < 1) d = 'M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2;
    else { var mx = x1 + Math.max(16, (x2 - x1) / 2); d = 'M' + x1 + ' ' + y1 + ' H' + mx + ' V' + y2 + ' H' + x2; }
    var s = '<path d="' + d + '" fill="none" stroke="' + (opts.color || 'currentColor') + '" stroke-width="1.3" opacity="' + (opts.dashed ? 0.6 : 0.75) + '"' + (opts.dashed ? ' stroke-dasharray="4 4"' : '') + ' marker-end="url(#pm-arrow)"/>';
    if (label) {
      var lx, ly, anchor = 'middle';
      if (Math.abs(y1 - y2) < 1) { lx = (x1 + x2) / 2; ly = y1 + 36; }                 // horizontal: below the two boxes' bottom edge
      else if (Math.abs(x1 - x2) < 1) { lx = x1 + 6; ly = (y1 + y2) / 2 + 3; anchor = 'start'; } // vertical: beside the line
      else { lx = x2 - 6; ly = y2 - 8; anchor = 'end'; }                                  // orthogonal: just before the target box
      var tw = label.length * 5.4 + 6, rx = anchor === 'middle' ? lx - tw / 2 : anchor === 'start' ? lx - 3 : lx - tw + 3;
      s += '<rect x="' + rx + '" y="' + (ly - 9) + '" width="' + tw + '" height="12" rx="3" fill="var(--surface)" opacity="0.85"/>';
      s += '<text x="' + lx + '" y="' + ly + '" text-anchor="' + anchor + '" font-size="9.5" fill="var(--text-3)" font-style="italic">' + esc(label) + '</text>';
    }
    return s;
  }

  /* ------------------------------------------------------------ process map */
  X.processMap = function (el) {
    var LANES = [
      ['Marketing & Website', 'Advertiser · CMS'], ['Broker / Realtor', 'Realtor OS'], ['Admins', 'Sales · Rental'], ['Vendors', 'Photo · Writer · Ads · Build'],
      ['Lawyer & Accountant', 'Legal · Money'], ['Lender', 'optional'], ['Sellers & Landlords', 'customer'], ['Buyers & Renters', 'customer']
    ];
    var PHASES = [['P1 · Get listings', 0, 4], ['P2 · Production & launch', 4, 7], ['P3 · Sell / rent', 7, 10], ['P4 · Close  |  P5 · Rental ops', 10, 13]];
    var LX = 170, CW = 150, NW = 132, NH = 50, LH = 92, TOP = 64;
    var cx = function (c) { return LX + c * CW; }, cy = function (l) { return TOP + l * LH + (LH - NH) / 2; };
    var N = {};
    function node(id, lane, col, lines, kind, opts) { N[id] = { x: cx(col), y: cy(lane), lane: lane, col: col }; return box(cx(col), cy(lane), NW, NH, lines, kind, opts); }
    var g = '';
    // nodes
    g += node('ads', 0, 0, ['Advertising', 'Meta · Google · IG'], 'ai');
    g += node('web', 0, 1, ['Website (CMS)', 'lead forms → CRM'], 'ai');
    g += node('crmget', 1, 2, ['Get-Listings CRM', 'follow-ups drafted'], 'ai-human');
    g += node('visit', 1, 3, ['Visita de captación', 'comps & price'], 'human');
    g += node('agree', 4, 3, ['Listing agreement', 'venta / arriendo'], 'ai-human');
    g += node('sellerlead', 6, 1, ['Seller / landlord', 'lead in'], 'human');
    g += node('sellersign', 6, 3, ['Signs agreement', 'e-sign'], 'human');
    g += node('orders', 2, 4, ['Production orders', 'auto-spawned project'], 'ai');
    g += node('photos', 3, 4, ['Photo package', 'photos · video · drone'], 'human');
    g += node('write', 3, 5, ['Write-up · comps', 'ES/EN drafted'], 'ai-human');
    g += node('creative', 3, 6, ['Creatives · ads'], 'ai-human');
    g += node('remodel', 3, 2, ['Remodel quote', 'optional'], 'human', { dashed: true });
    g += node('site', 0, 5, ['Listing site', '+ syndication payload'], 'ai');
    g += node('publish', 2, 6, ['Publish', 'Finca Raíz · Wasi · M²'], 'human');
    g += node('campaign', 0, 6, ['Campaign', 'budget cap'], 'ai-human');
    g += node('crmsell', 1, 7, ['Sell/Rent CRM', 'matching · qualifying'], 'ai-human');
    g += node('gather', 7, 7, ['Buyers / renters', 'portal · ad · site'], 'human');
    g += node('tours', 1, 8, ['Tours · open house', 'voice feedback'], 'human');
    g += node('btours', 7, 8, ['Tour & compare'], 'human');
    g += node('lender', 5, 10, ['Pre-approval', 'buyer opt-in'], 'human', { dashed: true });
    g += node('offer', 1, 9, ['Offer · counter', 'redlines tracked'], 'ai-human');
    g += node('bagree', 7, 9, ['Offer / application'], 'human');
    g += node('promesa', 4, 10, ['Promesa · contract', 'lawyer gate'], 'ai-human');
    g += node('paper', 2, 10, ['Paperwork checklist', 'OCR validation'], 'ai-human');
    g += node('steps', 2, 11, ['Steps of sale', 'avalúo → escritura'], 'human');
    g += node('escrow', 4, 11, ['Escrow · split', 'payout batch'], 'ai-human');
    g += node('rental', 2, 12, ['Rental agreement', '+ inventory'], 'ai-human');
    g += node('monthly', 4, 12, ['Monthly rent', 'owner statement'], 'ai-human');
    g += node('keys', 7, 12, ['Keys / move-in'], 'human');
    g += node('sellerpaid', 6, 11, ['Paid at escritura', 'or monthly statement'], 'human');
    // edges
    function E(a, b, label, opts) { var A = N[a], B = N[b]; if (A.lane === B.lane) return arrow(A.x + NW, A.y + NH / 2, B.x, B.y + NH / 2, label, opts); if (A.col === B.col) { var down = B.lane > A.lane; return arrow(A.x + NW / 2, down ? A.y + NH : A.y, B.x + NW / 2, down ? B.y : B.y + NH, label, opts); } return arrow(A.x + NW, A.y + NH / 2, B.x, B.y + NH / 2, label, opts); }
    var e = '';
    e += E('ads', 'web', 'brand leads'); e += E('web', 'crmget', 'lead + source'); e += E('sellerlead', 'crmget'); e += E('crmget', 'visit'); e += E('visit', 'agree', 'terms');
    e += E('agree', 'sellersign', 'e-sign'); e += E('agree', 'orders', 'signed → project');
    e += E('orders', 'photos'); e += E('photos', 'write', 'media inbox'); e += E('write', 'creative'); e += E('remodel', 'orders', '', { dashed: true });
    e += E('write', 'site', 'copy + 20 photos'); e += E('site', 'campaign'); e += E('site', 'publish', 'validated payload'); e += E('publish', 'crmsell', 'portal leads');
    e += E('campaign', 'gather', 'ads'); e += E('gather', 'crmsell', 'inquiries'); e += E('crmsell', 'tours'); e += E('tours', 'btours'); e += E('tours', 'lender', 'needs credit', { dashed: true }); e += E('lender', 'promesa', 'credit letter', { dashed: true });
    e += E('tours', 'offer'); e += E('btours', 'bagree'); e += E('bagree', 'offer', 'submits');
    e += E('offer', 'paper', 'accepted'); e += E('offer', 'promesa'); e += E('paper', 'steps'); e += E('promesa', 'escrow', 'arras'); e += E('steps', 'escrow', 'escritura'); e += E('escrow', 'sellerpaid'); e += E('steps', 'keys', 'entrega');
    e += E('steps', 'rental', 'arriendo path', { dashed: true }); e += E('rental', 'monthly', 'canon · IPC');
    // lanes + phases
    var W = cx(13) + 20, H = TOP + LANES.length * LH + 16;
    var lanes = LANES.map(function (l, k) { var y = TOP + k * LH; return '<rect x="0" y="' + y + '" width="' + W + '" height="' + LH + '" fill="' + (k % 2 ? 'var(--surface-2)' : 'transparent') + '" opacity="0.6"/><text x="16" y="' + (y + LH / 2 - 3) + '" font-size="12" font-weight="600" fill="var(--text)">' + esc(l[0]) + '</text><text x="16" y="' + (y + LH / 2 + 12) + '" font-size="10" fill="var(--text-3)">' + esc(l[1]) + '</text>'; }).join('');
    var phases = PHASES.map(function (p, k) { var x1 = cx(p[1]) - 9, x2 = cx(p[2]) - 9; return '<rect x="' + x1 + '" y="14" width="' + (x2 - x1 - 4) + '" height="30" rx="6" fill="' + (k % 2 ? 'var(--brand-soft)' : 'var(--accent-soft)') + '"/><text x="' + ((x1 + x2) / 2) + '" y="34" text-anchor="middle" font-size="12" font-weight="600" fill="var(--text)">' + esc(p[0]) + '</text><line x1="' + (x2 - 2) + '" y1="' + TOP + '" x2="' + (x2 - 2) + '" y2="' + H + '" stroke="var(--border)" stroke-dasharray="3 5"/>'; }).join('');
    var legend = '<g transform="translate(16 ' + (H - 6) + ')">' + pill(24, 0, 'ai') + '<text x="30" y="4" font-size="10.5" fill="var(--text-2)">automated step</text>' + pill(190, 0, 'ai-human') + '<text x="196" y="4" font-size="10.5" fill="var(--text-2)">AI drafts, a person approves</text>' + pill(400, 0, 'human') + '<text x="406" y="4" font-size="10.5" fill="var(--text-2)">human check / action</text><line x1="560" y1="0" x2="600" y2="0" stroke="currentColor" stroke-dasharray="4 4"/><text x="606" y="4" font-size="10.5" fill="var(--text-2)">optional path</text></g>';
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + (H + 18) + '" role="img" aria-label="End-to-end Llave pipeline: advertising and website feed the Get-Listings CRM; a signed listing agreement spawns production orders to vendors; the listing site, syndication and campaign feed the Sell/Rent CRM; tours and offers lead to paperwork, promesa and escrow for sales, or rental agreement and monthly statements for rentals." style="min-width:1500px" font-family="Inter, system-ui, sans-serif">' +
      '<defs><marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" opacity="0.8"/></marker></defs>' +
      lanes + phases + '<g style="color:var(--text-2)">' + e + '</g>' + g + legend + '</svg>';
  };

  /* ----------------------------------------------------------- tenant model */
  X.tenantModel = function (el) {
    var t = D.tenant, groups = ['staff', 'vendor', 'customer'];
    var byGroup = {}; groups.forEach(function (gp) { byGroup[gp] = D.roles.filter(function (r) { return r.group === gp; }); });
    var users = {}; groups.forEach(function (gp) { users[gp] = D.users.filter(function (u) { return u.roleGroup === gp; }).length; });
    var W = 920, s = '';
    // level 0 platform
    s += box(W / 2 - 110, 10, 220, 48, ['Platform · Llave OS', 'tenants · legal packs · billing'], null, { fill: 'var(--brand)', stroke: 'var(--brand)' }).replace(/fill="var\(--text\)"/g, 'fill="var(--brand-ink)"');
    // level 1 tenant
    s += box(W / 2 - 150, 92, 300, 52, [t.name + ' (' + t.group + ')', 'brand · domain · legal templates · commission defaults · plan'], null, { fill: 'var(--brand-soft)', stroke: 'var(--brand-2)' });
    s += arrow(W / 2, 58, W / 2, 92);
    // level 2 offices
    var ow = 190, ogap = 28, ox0 = (W - (t.offices.length * ow + (t.offices.length - 1) * ogap)) / 2;
    t.offices.forEach(function (o, k) { var x = ox0 + k * (ow + ogap); s += box(x, 180, ow, 46, [o.name, o.city + ' · ' + o.barrio], null); s += '<path d="M' + (W / 2) + ' 144 V162 H' + (x + ow / 2) + ' V180" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75" marker-end="url(#pm-arrow)"/>'; });
    // level 3 roles by group
    var gw = 280, ggap = 30, gx0 = (W - (3 * gw + 2 * ggap)) / 2, LBL = { staff: 'Staff roles', vendor: 'Vendor roles', customer: 'Customer roles' };
    groups.forEach(function (gp, k) {
      var x = gx0 + k * (gw + ggap), y = 272, rs = byGroup[gp];
      var h = 40 + rs.length * 16 + 8;
      s += '<rect x="' + x + '" y="' + y + '" width="' + gw + '" height="' + h + '" rx="10" fill="var(--surface-2)" stroke="var(--border)"/>';
      s += '<text x="' + (x + 12) + '" y="' + (y + 20) + '" font-size="12" font-weight="600" fill="var(--text)">' + LBL[gp] + ' <tspan fill="var(--text-3)" font-weight="500">· ' + rs.length + '</tspan></text>';
      s += '<text x="' + (x + 12) + '" y="' + (y + 34) + '" font-size="9.5" fill="var(--text-3)">role = permission set + nav + home widgets (DORUM.roles)</text>';
      rs.forEach(function (r, j) { s += '<text x="' + (x + 12) + '" y="' + (y + 52 + j * 16) + '" font-size="11" fill="var(--text-2)"><tspan font-family="ui-monospace, SFMono-Regular, Menlo, monospace" fill="var(--brand)">' + r.id + '</tspan>  ' + esc(r.labelEs) + ' · ' + r.navItems.length + ' modules</text>'; });
      var uy = y + h + 26;
      s += box(x, uy, gw, 40, [users[gp] + ' users in demo data', gp === 'customer' ? 'scoped to their own deals only' : gp === 'vendor' ? 'see their orders and payouts only' : 'one primary role each'], null);
      s += arrow(x + gw / 2, y + h, x + gw / 2, uy);
      // connect offices row to role groups
      s += '<path d="M' + (W / 2) + ' 226 V250 H' + (x + gw / 2) + ' V272" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.75" marker-end="url(#pm-arrow)"/>';
    });
    var H = 272 + (40 + byGroup.staff.length * 16 + 8) + 26 + 40 + 20;
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tenant model: the Llave platform hosts tenants such as Dorum Lifestyle; a tenant has offices; users hold one role each, grouped as staff, vendor or customer; each role defines permissions, navigation and home widgets." style="min-width:720px" font-family="Inter, system-ui, sans-serif"><defs><marker id="pm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" opacity="0.8"/></marker></defs><g style="color:var(--text-2)">' + s + '</g></svg>';
  };

  /* ------------------------------------------------------------ role matrix */
  X.MODULE_LABELS = { home: 'Inicio', listings: 'Inmuebles', 'crm-get': 'Captación', 'crm-sell': 'Ventas & arriendos', calendar: 'Agenda', projects: 'Proyectos', contracts: 'Contratos', paperwork: 'Documentos', media: 'Fotos & video', publishing: 'Publicación', ads: 'Pauta', money: 'Dinero', 'my-money': 'Mis pagos', payroll: 'Nómina', rentals: 'Arriendos', lifestyle: 'Lifestyle', reports: 'Reportes', website: 'Sitio web', settings: 'Configuración', orders: 'Órdenes', referrals: 'Referidos', 'my-listing': 'Mi inmueble', visits: 'Visitas', offers: 'Ofertas', documents: 'Documentos', messages: 'Mensajes', search: 'Buscar', shortlist: 'Favoritos', tours: 'Recorridos', 'my-property': 'Mi propiedad', statements: 'Extractos', maintenance: 'Mantenimiento', 'my-home': 'Mi hogar', payments: 'Pagos' };
  X.roleMatrix = function (el) {
    var mods = []; D.roles.forEach(function (r) { r.navItems.forEach(function (m) { if (mods.indexOf(m) < 0) mods.push(m); }); });
    var groupOf = { staff: 'Staff', vendor: 'Vendor', customer: 'Customer' };
    var head = '<tr><th class="sticky-col">Module (nav id)</th>' + D.roles.map(function (r) { return '<th class="rm-role rm-' + r.group + '" title="' + esc(r.label) + '"><span>' + r.id + '</span></th>'; }).join('') + '</tr>';
    var ghead = '<tr class="rm-groups"><th class="sticky-col"></th>' + ['staff', 'vendor', 'customer'].map(function (gp) { var n = D.roles.filter(function (r) { return r.group === gp; }).length; return '<th colspan="' + n + '" class="rm-' + gp + '">' + groupOf[gp] + ' · ' + n + '</th>'; }).join('') + '</tr>';
    var body = mods.map(function (m) {
      return '<tr><td class="sticky-col"><b>' + esc(X.MODULE_LABELS[m] || m) + '</b> <code>' + m + '</code></td>' + D.roles.map(function (r) { var on = r.navItems.indexOf(m) >= 0; return '<td class="rm-cell' + (on ? ' is-on rm-' + r.group : '') + '">' + (on ? '<span class="dot"></span>' : '') + '</td>'; }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<table class="table table-compact rm">' + '<thead>' + ghead + head + '</thead><tbody>' + body + '</tbody></table>';
    return { modules: mods.length, roles: D.roles.length };
  };

  window.DOCS = X;
})();
