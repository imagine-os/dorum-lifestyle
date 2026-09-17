# Llave OS · Dorum Lifestyle demo

**Llave OS** is an operating system for real-estate agencies: one system that replaces the five tools a brokerage usually juggles (CRM, listings/portals, contracts and paperwork, money/escrow/payroll, marketing). AI drafts, a person approves. This repository is a fully static demo of the product with **Dorum Lifestyle** (a boutique brokerage in Medellín, Colombia) as the example tenant.

Live URL (once GitHub Pages is enabled): https://imagine-os.github.io/dorum-lifestyle/

## URL map

| Path | What it is |
|---|---|
| `/` (`index.html`) | Llave OS sales site (ES/EN toggle): hero, problem, modules, roles, device mockups, pricing, CTA. |
| `/app/` | Dorum tenant app (ES/EN toggle). Single page with hash routes: `#/` role picker, `#/role/<roleId>/<module>[/<id>]`. Display modes via query string before the hash: `?mode=tv`, `?mode=watch`, `?mode=phone` (e.g. `app/index.html?mode=tv#/role/owner/home`). |
| `/dorum/` | Dorum Lifestyle public brokerage site (ES/EN toggle): listings gallery, lifestyle, about. `dorum/listing.html?id=lst-003` is an individual listing page; `dorum/lifestyle.html` the lifestyle services page. |
| `/mockups/` | Standalone screens used inside device frames by the sales site. |
| `/docs/` | Product plan and build conventions, rendered as HTML (`docs/plan.html`, `docs/conventions.html`) with the Markdown sources alongside. |
| `/404.html` | Not-found page (served by GitHub Pages). |

Roles in the app: `owner`, `broker`, `sales_admin`, `rental_admin`, `accountant`, `lawyer`, `photographer`, `advertiser`, `writer`, `construction`, `lender`, `seller`, `buyer`, `landlord`, `renter`. Modules per role come from `DORUM.roles[].navItems` in `assets/data.js`.

## Language toggle

Every header (sales site, tenant app, Dorum site, TV/watch modes, docs) has an **ES/EN** toggle backed by `assets/i18n.js`. The default follows the browser language; the choice is persisted in `localStorage['llave-lang']` and shared across all pages of the site. Data fields in `assets/data.js` carry bilingual values where the UI shows them.

## Run locally

No build step, no dependencies. Any static file server works:

```sh
python3 -m http.server 8080
# then open http://localhost:8080/
```

Pages also open directly from `file://` (double-click `index.html`).

## Folder structure

```
index.html            Sales site
404.html              Not-found page
assets/
  tokens.css          Design system (colors, type, spacing, components) — light and dark
  data.js             Demo data + helpers exposed as window.DORUM
  site.css / site.js  Sales-site styles and behaviour
app/
  index.html          Tenant app shell (loads data.js → app.js → modules/core.js → sales.js → ops.js → portals.js)
  app.js / app.css    Router, shell, overlays (voice, command palette, approvals), role picker
  modules/            Feature modules registered via LLAVE.register / LLAVE.registerWidget
dorum/                Public brokerage site (index, listing, lifestyle)
mockups/              Device-frame screens
docs/                 PLAN.md, CONVENTIONS.md and their HTML renderings
.github/workflows/    Publishes the site root to the gh-pages branch on every push to main
```

## About the data

Everything is **demo data**. Listings, contacts, deals, payouts and messages are invented; people have **placeholder names**. The owner's name is a single constant (`DORUM.OWNER_NAME`) and its **spelling is unverified**. Listing photos are hotlinked Unsplash images chosen to match each listing type (lakefront, finca, modern house, apartment, office); if an image fails to load, a brand-gradient fallback takes its place (`img.img-fallback` in `assets/tokens.css`, wired in `assets/data.js`).

## GitHub Pages

The workflow in `.github/workflows/pages.yml` runs on every push to `main` and force-pushes the site root (minus `.github`) to the `gh-pages` branch. To serve it, a repository admin enables Pages once:

**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `gh-pages` / `(root)`.**

The site will then be live at https://imagine-os.github.io/dorum-lifestyle/. The `.nojekyll` file disables Jekyll processing so folders and files are served as-is.
