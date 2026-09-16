# Llave OS demo · Build conventions

Read this before building any page. Everything here exists so five people can build five folders and the result looks like one product.

## 0. Ground rules

- **Plain static files.** No build step, no server, no modules, no fetch of local JSON (breaks on `file://`). Every page must open by double-clicking it and must work on `https://imagine-os.github.io/dorum-lifestyle/`.
- **Relative paths only.** From the root: `assets/tokens.css`. From one folder down (`app/`, `dorum/`, `mockups/`, `docs/`): `../assets/tokens.css`. Never start a path with `/`.
- **Shared foundation, never forked.** Import `assets/tokens.css` and `assets/data.js`. Page-specific CSS goes in a `<style>` block or a sibling `.css` in your folder and only **adds** classes; it never redefines a token or a base class. If you need a new base component, propose it — do not paste a private copy.
- **Data comes from `window.DORUM`.** Do not hard-code a listing, a name or a price in HTML when it exists in `data.js`. The owner's name is `DORUM.OWNER_NAME` — never type it.
- **Copy is real.** Spanish first for the Dorum tenant surfaces (`/app`, `/dorum`), English first for the Llave sales site (`/index.html`). No lorem ipsum, no "Feature 1".
- **Both themes.** Test with `<html data-theme="dark">` and light. Only use colors through tokens.
- **Phone width works.** 400px wide, 16px gutter, no horizontal scroll (tables get `.table-wrap`).
- **Accessibility floor.** Real `<button>`s, `alt` on images, focus states are inherited from tokens — do not remove outlines. Icons are inline SVG (Lucide-style, 24×24, `stroke="currentColor" stroke-width="1.75"`), never icon fonts, never emoji as UI icons (emoji are fine inside data like `lifestyle[].icon`).

## 1. File & URL structure

```
/index.html                 Llave OS sales site (EN). Hero, problem, modules, roles, device mockups, pricing, CTA.
/app/index.html             Dorum tenant app. Single page, hash routes  #/role/<roleId>/<module>[/<id>]
/app/app.js  /app/app.css   App-only code (optional split; keep it plain script).
/dorum/index.html           Dorum Lifestyle public brokerage site (ES/EN toggle). Gallery of listings, lifestyle, about.
/dorum/listing.html?id=lst-003   Individual listing page (reads ?id=, falls back to first featured).
/mockups/*.html             Standalone screens loaded inside .device frames by the sales site
                            (e.g. mockups/broker-phone.html, mockups/owner-desktop.html, mockups/voice-watch.html).
/docs/                      PLAN.md + CONVENTIONS.md rendered or copied here; docs/index.html links them.
/assets/tokens.css          Design system (do not edit without telling the architect).
/assets/data.js             Demo data + helpers (edit only to fix facts; keep the shape).
/assets/img/                Static images if any (prefer picsum seeds from data.js).
```

Route ids for `/app`: roles come from `DORUM.roles[].id` (`owner`, `broker`, `sales_admin`, `rental_admin`, `accountant`, `lawyer`, `photographer`, `advertiser`, `writer`, `construction`, `lender`, `seller`, `buyer`, `landlord`, `renter`). Modules come from `DORUM.roles[].navItems`. Unknown route → `#/role/owner/home`. Use `DORUM.parseRoute()` and `DORUM.routeTo(role, module, id)`.

Mockup pages are **self-contained** (own `<head>` with fonts + tokens) so they render inside an `<iframe>`; they set `body { overflow: hidden }` and design to the frame's logical viewport (`--vw × --vh`, see §4).

## 2. Head boilerplate (copy exactly, adjust `../`)

```html
<!doctype html>
<html lang="es"> <!-- "en" on /index.html -->
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Llave OS · Dorum</title>
<meta name="description" content="…one sentence…">
<meta name="color-scheme" content="light dark">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230F3D2E'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia,serif' font-size='18' fill='%23F3EDE0'%3EL%3C/text%3E%3C/svg%3E">
</head>
<body>
…
<script src="../assets/data.js"></script>
<script>/* page code, plain script, uses window.DORUM */</script>
</body>
</html>
```

Theme is applied by `data.js` on load if the viewer saved one (`DORUM.setTheme('dark'|'light'|'system')`). Put a theme toggle in every topbar/site header (see snippets).

## 3. Tokens & type — what to use when

| Need | Use |
|---|---|
| Page ground / cards / inset | `--bg` / `--surface` / `--surface-2` (hover rows `--surface-3`) |
| Text | `--text` body, `--text-2` secondary, `--text-3` labels & meta |
| Brand actions, nav, links | `--brand` (deep green), `--brand-2` hover, `--brand-soft` tints |
| Accent (sparingly: CTA on sales site, "current" markers, italic in display headings) | `--accent` terracotta |
| Status | `--success` `--warn` `--danger` `--info` + `-soft` fills. Never use `--accent` for status. |
| AI provenance (drafted by AI) | `--ai` / `--ai-soft`, `.badge-ai`, `.ai-suggest`, `.kanban-card.is-ai`, `.timeline-item.is-ai` |
| Display headings (hero, page titles, prices) | `.display`, `.display-hero`, `.listing-price` — Fraunces |
| UI text | default Inter via `body` |
| Numbers in columns | `.num` / `.money` (tabular) |
| Uppercase labels | `.eyebrow`, `.stat-label`, `.sidebar-section` |

Type scale: `--fs-xs … --fs-4xl`, `--fs-hero`. Spacing `--s-1 … --s-20` (4pt). Radii `--r-xs … --r-2xl`, `--r-pill`. Shadows `--sh-1/2/3`. Do not invent new px values for these.

Status badges are data-driven: `<span class="badge badge-status" data-status="bajo oferta">Bajo oferta</span>` picks its color from `[data-status]` rules in tokens.css (accepted values: `borrador`, `en preparación`, `activo`, `bajo oferta`, `vendido`, `arrendado`, `pendiente`, `pagado`, `firmado`, `vencido`, `rechazado`, `atrasado`). Use `DORUM.statusLabel()` for the text.

## 4. Components (class reference)

- Buttons: `.btn` + `.btn-primary | .btn-secondary | .btn-ghost | .btn-accent | .btn-danger`, sizes `.btn-sm .btn-lg .btn-icon .btn-block`.
- Surfaces: `.card` (+`.card-flat .card-raised .card-pad-0 .card-brand .card-sand`), `.card-header`, `.card-title`, `.callout(-info|-warn|-success)`.
- Data: `.stat > .stat-label + .stat-value + .stat-delta(.up|.down)`, `.table-wrap > table.table`, `.badge/.pill(-brand|-accent|-success|-warn|-danger|-info|-ai|-solid)`, `.chip(.is-active)`, `.avatar(-sm|-lg|-xl|-accent|-sand)`, `.avatar-stack`, `.progress > span[style="--value:60%"]`, `.steps > span(.is-done|.is-current)`, `.synd > i(.on)`.
- Forms: `.field > .label + .input|.select|.textarea + .hint`, `.input-group`, `.search`, `.toggle > input + .toggle-track`.
- Navigation: `.tabs > .tab(.is-active)`, `.tabs-pill`, app shell `.app > .sidebar + .main > .topbar + .page`.
- Boards: `.kanban > .kanban-col > .kanban-head + .kanban-card(.is-ai)`, `.timeline > .timeline-item(.is-done|.is-current|.is-ai)`.
- Feedback: `DORUM.toast(title, body, 'success'|'danger'|'ai')`, `.modal-backdrop > .modal(.modal-lg) > .modal-header + … + .modal-footer`.
- AI: `.ai-suggest > .ai-suggest-head(.spark) + .ai-suggest-body(.diff-add/.diff-del) + .ai-suggest-actions + .ai-suggest-meta`.
- Voice: `.voice-orb(-sm|-lg|-xl)(.is-listening)`, `.voice-orb-fab`, `.voice-transcript`.
- Marketing: `.site-header .site-logo .site-nav .site-footer`, `.hero .hero-band .band-sand .band-dark`, `.marquee`, `.listing-card > .listing-media + .listing-body(.listing-price .listing-title .listing-loc .listing-specs)`.
- Layout: `.container(.container-narrow) .section .stack .row .row-between .grid .grid-2/3/4 .grid-auto .grid-auto-lg .span-2 .flex-1`.

### Device frames

```html
<div class="device device-phone">
  <div class="device-screen"><iframe src="mockups/broker-phone.html" title="Broker · phone" loading="lazy"></iframe></div>
</div>
<p class="device-caption">Realtor OS · iPhone</p>
<script>DORUM.fitDevices();</script>  <!-- once, after data.js; re-fits on resize -->
```

Frames: `.device-desktop` (1440×900), `.device-laptop` (1440×900), `.device-tablet` (1024×768) / `.device-tablet-portrait` (820×1180), `.device-phone` (390×844), `.device-tv` (1920×1080), `.device-watch` (198×242, add `<span class="crown"></span>` inside `.device`). Override the logical viewport with `style="--vw:1280;--vh:800"` if a mockup needs it. Inner content can be an `<iframe>` or an inline `<div class="screen">`. Group several with `.device-stage`.

## 5. Shared markup snippets

### 5a. App shell (`/app`, also reused by desktop mockups)

```html
<div class="app">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="logo">L</div>
      <div><strong>Llave</strong><small id="tenantName">Dorum Lifestyle</small></div>
    </div>
    <div class="sidebar-section">Realtor OS</div>
    <nav id="nav" class="stack stack-sm"><!-- <a class="nav-item is-active" href="#/role/broker/home"><svg…/>Inicio</a> --></nav>
    <div class="sidebar-footer">
      <a class="nav-item" href="#/role/broker/settings">Configuración</a>
    </div>
  </aside>
  <div class="main">
    <header class="topbar">
      <button class="btn btn-ghost btn-icon" id="menuBtn" aria-label="Menú" onclick="sidebar.classList.toggle('is-open')">☰</button>
      <div class="topbar-crumbs"><span>Dorum Lifestyle</span><span>/</span><b id="crumb">Inicio</b></div>
      <div class="topbar-spacer"></div>
      <label class="input-group search"><svg…/><input class="input" id="globalSearch" placeholder="Buscar inmueble, contacto, negocio…"></label>
      <div class="role-switch"><span class="avatar avatar-sm" id="meAvatar">MR</span><select class="select input-sm" id="roleSelect" aria-label="Cambiar rol (demo)"></select></div>
      <button class="btn btn-ghost btn-icon" id="themeBtn" aria-label="Tema" onclick="DORUM.setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')">◐</button>
    </header>
    <main class="page" id="page"></main>
  </div>
</div>
<button class="voice-orb voice-orb-fab" id="voiceFab" aria-label="Hablar con Llave"><svg…mic…/></button>
```

The role switcher is a **demo affordance**: populate it from `DORUM.roles`, and on change navigate to `DORUM.routeTo(role, 'home')`. Build the sidebar nav from `DORUM.role(roleId).navItems`, and the home view from `homeWidgets`. Label map for nav ids (ES): home → Inicio, listings → Inmuebles, crm-get → Captación, crm-sell → Ventas & arriendos, calendar → Agenda, projects → Proyectos, contracts → Contratos, paperwork → Documentos, media → Fotos & video, publishing → Publicación, ads → Pauta, money → Dinero, my-money → Mis pagos, payroll → Nómina, rentals → Arriendos, lifestyle → Lifestyle, reports → Reportes, website → Sitio web, settings → Configuración, orders → Órdenes, referrals → Referidos, my-listing → Mi inmueble, visits → Visitas, offers → Ofertas, documents → Documentos, messages → Mensajes, search → Buscar, shortlist → Favoritos, tours → Recorridos, my-property → Mi propiedad, statements → Extractos, maintenance → Mantenimiento, my-home → Mi hogar, payments → Pagos.

### 5b. Public site header/footer (`/index.html` and `/dorum/*`)

```html
<header class="container site-header">
  <a class="site-logo" href="index.html"><span class="mark">L</span> Llave OS</a>
  <!-- Dorum: <a class="site-logo" href="index.html"><span class="mark" style="background:var(--accent)">D</span> Dorum Lifestyle</a> -->
  <nav class="site-nav" id="siteNav">
    <a href="#modules">Modules</a><a href="#roles">Roles</a><a href="#voice">Voice</a><a href="#pricing">Pricing</a>
    <a class="btn btn-primary btn-sm" href="app/index.html#/role/owner/home">Open the demo</a>
    <button class="btn btn-ghost btn-icon" aria-label="Theme" onclick="DORUM.setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')">◐</button>
  </nav>
  <button class="btn btn-ghost btn-icon" aria-label="Menu" onclick="siteNav.classList.toggle('is-open')" style="display:none" id="navBtn">☰</button>
</header>

<footer class="site-footer">
  <div class="container grid grid-4">
    <div><a class="site-logo" href="index.html"><span class="mark">L</span> Llave OS</a><p class="small" style="margin-top:var(--s-3)">The operating system for real-estate agencies. Built first for Dorum Lifestyle, Medellín.</p></div>
    <div><h4>Product</h4><a href="index.html#modules">Modules</a><a href="index.html#roles">Roles</a><a href="app/index.html">Tenant app</a><a href="mockups/">Mockups</a></div>
    <div><h4>Dorum</h4><a href="dorum/index.html">Brokerage site</a><a href="dorum/index.html#lifestyle">Lifestyle</a><a href="dorum/index.html#nosotros">About</a></div>
    <div><h4>Docs</h4><a href="docs/">Product plan</a><a href="docs/#conventions">Conventions</a><span class="xs" style="display:block;margin-top:var(--s-3)">Demo data. Placeholder names except the owner. © 2026 Llave</span></div>
  </div>
</footer>
```

Show `#navBtn` under 720px with a tiny media query in your page CSS (`@media (max-width:720px){#navBtn{display:inline-flex!important}}`).

### 5c. Listing card (public + app)

```html
<a class="listing-card" href="listing.html?id=lst-003">
  <div class="listing-media">
    <img src="…cover…" alt="Casa de lago con muelle privado, Guatapé" loading="lazy">
    <span class="badge badge-status" data-status="bajo oferta">Bajo oferta</span>
  </div>
  <div class="listing-body">
    <div class="listing-price">$3.900.000.000 <small>venta</small></div>
    <div class="listing-title">Casa de lago con muelle privado</div>
    <div class="listing-loc">Vereda La Piedra · Guatapé</div>
    <div class="listing-specs"><span>420 m²</span><span>4 hab</span><span>5 baños</span><span>4 parq</span></div>
  </div>
</a>
```

Render with `DORUM.fmtPrice(l)`, `DORUM.fmtM2(l.area)`. Show `estrato` and `administración` on the listing page ("Estrato 6 · Administración $1.180.000/mes"). For `currency: 'USD'` listings show `US$` and an "Internacional" pill.

### 5d. AI draft → human approve

```html
<div class="ai-suggest">
  <div class="ai-suggest-head"><span class="spark"></span> Borrador de Llave · contraoferta</div>
  <div class="ai-suggest-body">Proponemos <span class="diff-del">$3.650.000.000</span> <span class="diff-add">$3.780.000.000</span>, entrega en 45 días y mobiliario incluido.</div>
  <div class="ai-suggest-actions"><button class="btn btn-primary btn-sm">Aprobar y enviar</button><button class="btn btn-secondary btn-sm">Editar</button><button class="btn btn-ghost btn-sm">Descartar</button></div>
  <div class="ai-suggest-meta">Basado en 6 comparables y 2 ofertas previas · revisa antes de enviar</div>
</div>
```

Everywhere a task/contract/message has `aiDrafted: true`, mark it: `.badge-ai` "AI · revisar", `.kanban-card.is-ai`, `.timeline-item.is-ai`. The demo's thesis is *AI drafts, a person approves* — make that visible.

## 6. Data cookbook (`window.DORUM`)

```js
DORUM.OWNER_NAME                       // single source for the owner's name
DORUM.tenant                           // name, tagline, divisions, offices, markets, brand, commissionDefaults
DORUM.roles / DORUM.role('broker')     // {id,label,labelEs,group,homeWidgets[],navItems[]}
DORUM.users / DORUM.user(id) / DORUM.usersByRole('broker') / DORUM.userName(id)
DORUM.listings / DORUM.listing(id) / DORUM.listingsBy(brokerId)   // 15 listings, l.featured for hero picks
DORUM.pipelineStages                   // ordered stages for kanban headers
DORUM.contacts                         // leads; pipeline 'get' (sellers/landlords) or 'sell' (buyers/renters)
DORUM.deals / DORUM.dealsFor(userId) / DORUM.computeSplit(deal)  // -> {gross, referral, rows:[{name,kind,stage,amount}]}
DORUM.tasks / DORUM.tasksFor(userId)   // t.aiDrafted, t.status: pendiente|en curso|revisión|listo|bloqueado
DORUM.contracts                        // version, redlines, signers[].status, aiDrafted, lawyerApproved
DORUM.documents                        // paperwork checklist; owedBy seller|buyer|landlord|renter|agency; aiCheck text
DORUM.payouts / DORUM.escrowSummary    // ledger rows; account escrow|operating|payroll
DORUM.campaigns                        // spend, leads, cpl (COP)
DORUM.lifestyle                        // coming-soon services with icon + desc
DORUM.voiceIntents                     // {intent, say, does, role, confirm}
DORUM.integrations / DORUM.kpis
DORUM.fmtCOP(n, {compact}) / fmtMoney(n,'USD') / fmtPrice(listing) / fmtDate(iso,'short'|'long'|'time') / fmtM2 / fmtPct / pricePerM2(l)
DORUM.statusLabel(s) / typeLabel(t) / sourceIcon(src)
DORUM.parseRoute() / routeTo(role, module, id) / setTheme(mode) / toast(title, body, variant) / fitDevices()
```

Money is an integer in COP unless the object carries `currency: 'USD'`. Dates are ISO strings. Ids are stable: `u-*`, `lst-*`, `c-*`, `d-*`, `t-*`, `k-*`, `doc-*`, `p-*`, `cmp-*`.

## 7. Colombian details to get right

- Format COP with dots: `$850.000.000`; compact `$850 M`, `$3,9 mil M`. Rent as `$4.500.000 / mes`; vacation as `/ noche`.
- Always show **estrato** (1–6) and **administración** for apartments/gated units; fincas and lotes may have `estrato: null` (show "—" or omit).
- Vocabulary: alcobas/habitaciones, baños, parqueaderos, área construida, lote, canon, depósito, codeudor / afianzadora, acuerdo de corretaje, promesa de compraventa, arras, escritura, notaría, certificado de tradición y libertad, paz y salvo, predial, avalúo.
- Portals: Finca Raíz, Wasi, Metrocuadrado. Instagram only when the listing's `syndication.instagram` is true.
- Tone: warm, direct, boutique. Dorum speaks about nature, well-being and "activos productivos"; Llave speaks about one system replacing five tools.

## 8. Definition of done (per page)

1. Opens from `file://` and from a static server with no console errors.
2. Uses only tokens/classes from `tokens.css` plus additive page CSS.
3. Reads all content from `DORUM`; the owner's name appears only via `DORUM.OWNER_NAME`.
4. Works at 400px and 1440px, light and dark.
5. Every AI-generated item is visibly marked and has an approve action.
6. No lorem, no placeholder images other than the picsum seeds in data.
