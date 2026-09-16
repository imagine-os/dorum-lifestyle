/* ==========================================================================
   Llave OS · Demo data for tenant "Dorum Lifestyle" (Dorum Group)
   Plain script, no modules — works from file:// and GitHub Pages.
   Exposes ONE global: window.DORUM

   Sources for the brand facts: dorumgroup.com search snippets, Finca Raíz
   agency profile "DORUM LIFESTYLE" (id 176796358), @dorum_group Instagram bio.
   Every person below EXCEPT the owner is an INVENTED placeholder name.
   Money is stored as integers (COP unless `currency` says otherwise).
   ========================================================================== */
(function () {
  'use strict';

  // Owner of Dorum Group. Spelling UNVERIFIED (could not reach dorumgroup.com from the
  // build sandbox; plausible Spanish spellings: "Navajas" / "Navas"). Correct it HERE only.
  var OWNER_NAME = 'Rosie Navahas';

  var D = {};
  D.OWNER_NAME = OWNER_NAME;
  D.generatedAt = '2026-09-16';

  /* ------------------------------------------------------------------ tenant */
  D.tenant = {
    id: 'dorum',
    name: 'Dorum Lifestyle',
    group: 'Dorum Group',
    legalName: 'Dorum Group S.A.S.',
    tagline: 'Uniting nature with modern life',
    taglineEs: 'Uniendo la naturaleza con la vida moderna',
    instagramLine: 'Curated by nature',
    positioning: 'Boutique agency for homes immersed in nature and well-being. Curated luxury homes, fincas and reservoir-view lots in Antioquia, plus rental management that turns purchases into productive assets.',
    positioningEs: 'Agencia boutique enfocada en hogares inmersos en la naturaleza y el bienestar. Casas de lujo, fincas y lotes con vista al embalse en Antioquia, más administración de rentas que convierte compras en activos productivos.',
    hq: { city: 'Medellín', region: 'Antioquia', country: 'Colombia', base: 'Guatapé' },
    offices: [
      { id: 'off-med', name: 'Medellín HQ', city: 'Medellín', barrio: 'El Poblado' },
      { id: 'off-gua', name: 'Guatapé · Embalse', city: 'Guatapé', barrio: 'Tierra Prometida' },
      { id: 'off-ori', name: 'Oriente · Llanogrande', city: 'Rionegro', barrio: 'Llanogrande' },
      { id: 'off-ctg', name: 'Cartagena', city: 'Cartagena', barrio: 'Bocagrande' }
    ],
    markets: ['Guatapé & Embalse', 'Medellín', 'Oriente Antioqueño', 'Cartagena', 'México', 'Dubái'],
    divisions: [
      { id: 'real-estate', name: 'Dorum Real Estate', desc: 'Exceptional properties curated by nature with the Dorum seal: luxury homes, fincas of high scenic value, reservoir-view lots and development opportunities.' },
      { id: 'lifestyle', name: 'Dorum Lifestyle & Experiences', desc: 'Tourism experiences and rental management — converting purchases into productive assets.' },
      { id: 'projects', name: 'Dorum Projects', desc: 'Design and construction of sustainable homes blending nature, sustainability and technology.' },
      { id: 'foundation', name: 'Dorum Foundation', desc: 'Community and conservation programmes around the Embalse.' },
      { id: 'boutique', name: 'Dorum Boutique', desc: 'Curated objects for nature-immersed living.' }
    ],
    languages: ['es', 'en'],
    currency: 'COP',
    social: { instagram: '@dorum_group', instagramLifestyle: '@dorumlifestyle', whatsappLabel: 'Ventas Dorum Group' },
    portals: { fincaRaiz: 'fincaraiz.com.co/inmobiliarias/dorum-lifestyle/176796358', wasi: 'wasi.co', metrocuadrado: 'metrocuadrado.com' },
    brand: { primary: '#0F3D2E', secondary: '#1E7A57', sand: '#F3EDE0', accent: '#C2542B', ink: '#171F1A' },
    commissionDefaults: { saleUrbanPct: 3, saleRuralPct: 4, rentalMgmtPct: 10, ivaPct: 19 },
    plan: 'Llave OS · Agency Pro'
  };

  /* ------------------------------------------------------------------- roles */
  // homeWidgets / navItems are ids the app resolves to components. Keep labels bilingual.
  D.roles = [
    { id: 'owner', label: 'Company Owner', labelEs: 'Propietaria de agencia', group: 'staff',
      homeWidgets: ['kpi-revenue', 'kpi-pipeline', 'approvals-queue', 'escrow-balance', 'listings-map', 'team-activity', 'campaign-summary', 'ai-digest'],
      navItems: ['home', 'listings', 'crm-get', 'crm-sell', 'projects', 'contracts', 'paperwork', 'media', 'publishing', 'ads', 'money', 'payroll', 'rentals', 'lifestyle', 'reports', 'website', 'messages', 'settings'] },
    { id: 'broker', label: 'Broker / Realtor', labelEs: 'Asesor inmobiliario', group: 'staff',
      homeWidgets: ['today-agenda', 'my-pipeline', 'my-listings', 'hot-leads', 'ai-followups', 'my-commissions', 'voice-quick'],
      navItems: ['home', 'listings', 'crm-get', 'crm-sell', 'calendar', 'projects', 'contracts', 'paperwork', 'media', 'my-money'] },
    { id: 'sales_admin', label: 'Sales Administrator', labelEs: 'Administradora de ventas', group: 'staff',
      homeWidgets: ['pipeline-board', 'vendor-orders', 'paperwork-status', 'publishing-queue', 'approvals-queue', 'tasks-due'],
      navItems: ['home', 'listings', 'crm-sell', 'projects', 'contracts', 'paperwork', 'media', 'publishing', 'ads', 'website', 'reports'] },
    { id: 'rental_admin', label: 'Rental Administrator', labelEs: 'Administradora de arriendos', group: 'staff',
      homeWidgets: ['rent-collection', 'arrears', 'maintenance-tickets', 'leases-expiring', 'inventories-pending', 'vacation-calendar'],
      navItems: ['home', 'rentals', 'listings', 'crm-get', 'crm-sell', 'contracts', 'paperwork', 'lifestyle', 'reports'] },
    { id: 'accountant', label: 'Accountant', labelEs: 'Contadora', group: 'staff',
      homeWidgets: ['escrow-balance', 'payout-batches', 'pending-releases', 'payroll-month', 'dian-status', 'ledger-recent'],
      navItems: ['home', 'money', 'payroll', 'rentals', 'contracts', 'reports'] },
    { id: 'lawyer', label: 'Lawyer', labelEs: 'Abogada', group: 'staff',
      homeWidgets: ['contracts-review', 'redlines-open', 'title-checks', 'signatures-pending', 'clause-library'],
      navItems: ['home', 'contracts', 'paperwork', 'listings', 'reports'] },
    { id: 'photographer', label: 'Photographer', labelEs: 'Fotógrafo', group: 'vendor',
      homeWidgets: ['orders-open', 'shoot-calendar', 'upload-inbox', 'my-payouts'],
      navItems: ['home', 'orders', 'media', 'calendar', 'my-money'] },
    { id: 'advertiser', label: 'Advertiser', labelEs: 'Pauta digital', group: 'vendor',
      homeWidgets: ['campaigns-live', 'creative-requests', 'cpl-trend', 'my-payouts'],
      navItems: ['home', 'ads', 'media', 'listings', 'my-money'] },
    { id: 'writer', label: 'Writer & Researcher', labelEs: 'Redactor e investigador', group: 'vendor',
      homeWidgets: ['writeups-queue', 'comps-requests', 'ai-drafts-review', 'my-payouts'],
      navItems: ['home', 'orders', 'listings', 'my-money'] },
    { id: 'construction', label: 'Construction & Remodeling', labelEs: 'Construcción y remodelación', group: 'vendor',
      homeWidgets: ['quotes-requested', 'projects-active', 'site-visits', 'my-payouts'],
      navItems: ['home', 'orders', 'projects', 'calendar', 'my-money'] },
    { id: 'lender', label: 'Lender', labelEs: 'Crédito hipotecario', group: 'vendor',
      homeWidgets: ['referrals-new', 'preapprovals', 'closings-upcoming'],
      navItems: ['home', 'referrals', 'paperwork', 'calendar'] },
    { id: 'seller', label: 'Seller', labelEs: 'Vendedor', group: 'customer',
      homeWidgets: ['my-listing-progress', 'visits-feedback', 'offers', 'documents-todo', 'campaign-reach'],
      navItems: ['home', 'my-listing', 'visits', 'offers', 'documents', 'messages'] },
    { id: 'buyer', label: 'Buyer', labelEs: 'Comprador', group: 'customer',
      homeWidgets: ['shortlist', 'next-tour', 'offer-status', 'documents-todo', 'lender-status'],
      navItems: ['home', 'search', 'shortlist', 'tours', 'offers', 'documents', 'messages'] },
    { id: 'landlord', label: 'Landlord', labelEs: 'Arrendador', group: 'customer',
      homeWidgets: ['rent-status', 'monthly-statement', 'occupancy', 'maintenance', 'documents-todo'],
      navItems: ['home', 'my-property', 'statements', 'maintenance', 'documents', 'messages'] },
    { id: 'renter', label: 'Renter', labelEs: 'Arrendatario', group: 'customer',
      homeWidgets: ['rent-due', 'receipts', 'maintenance', 'lifestyle-services', 'lease-summary'],
      navItems: ['home', 'my-home', 'payments', 'maintenance', 'lifestyle', 'documents', 'messages'] }
  ];

  /* ------------------------------------------------------------------- users */
  // Placeholder names (invented) except OWNER_NAME.
  D.users = [
    { id: 'u-owner', name: OWNER_NAME, role: 'owner', roleGroup: 'staff', initials: 'RN', title: 'Founder & CEO', phone: '+57 310 000 0001', city: 'Medellín', office: 'off-med', email: 'rosie@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-brk-1', name: 'Mateo Restrepo', role: 'broker', roleGroup: 'staff', initials: 'MR', title: 'Asesor · Guatapé & Oriente', phone: '+57 311 000 0002', city: 'Guatapé', office: 'off-gua', email: 'mateo@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-brk-2', name: 'Valentina Cardona', role: 'broker', roleGroup: 'staff', initials: 'VC', title: 'Asesora · Medellín', phone: '+57 312 000 0003', city: 'Medellín', office: 'off-med', email: 'valentina@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-brk-3', name: 'Sebastián Ochoa', role: 'broker', roleGroup: 'staff', initials: 'SO', title: 'Asesor · Cartagena & Internacional', phone: '+57 313 000 0004', city: 'Cartagena', office: 'off-ctg', email: 'sebastian@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-sadmin', name: 'Laura Gaviria', role: 'sales_admin', roleGroup: 'staff', initials: 'LG', title: 'Administradora de ventas', phone: '+57 314 000 0005', city: 'Medellín', office: 'off-med', email: 'laura@dorumgroup.com', langs: ['es'] },
    { id: 'u-radmin', name: 'Daniela Montoya', role: 'rental_admin', roleGroup: 'staff', initials: 'DM', title: 'Administradora de arriendos · Lifestyle & Experiences', phone: '+57 315 000 0006', city: 'Guatapé', office: 'off-gua', email: 'daniela@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-acct', name: 'Carolina Zuluaga', role: 'accountant', roleGroup: 'staff', initials: 'CZ', title: 'Contadora', phone: '+57 316 000 0007', city: 'Medellín', office: 'off-med', email: 'contabilidad@dorumgroup.com', langs: ['es'] },
    { id: 'u-lawyer', name: 'Andrés Felipe Mejía', role: 'lawyer', roleGroup: 'staff', initials: 'AM', title: 'Abogado inmobiliario', phone: '+57 317 000 0008', city: 'Medellín', office: 'off-med', email: 'legal@dorumgroup.com', langs: ['es', 'en'] },
    { id: 'u-photo', name: 'Julián Arango', role: 'photographer', roleGroup: 'vendor', initials: 'JA', title: 'Estudio Luz Verde · foto, video y dron', phone: '+57 318 000 0009', city: 'Rionegro', langs: ['es'] },
    { id: 'u-adv', name: 'Manuela Betancur', role: 'advertiser', roleGroup: 'vendor', initials: 'MB', title: 'Pauta Meta & Google', phone: '+57 319 000 0010', city: 'Medellín', langs: ['es', 'en'] },
    { id: 'u-writer', name: 'Tomás Villegas', role: 'writer', roleGroup: 'vendor', initials: 'TV', title: 'Redacción bilingüe & comps', phone: '+57 320 000 0011', city: 'Envigado', langs: ['es', 'en'] },
    { id: 'u-constr', name: 'Ricardo Henao', role: 'construction', roleGroup: 'vendor', initials: 'RH', title: 'Henao Construcciones Sostenibles', phone: '+57 321 000 0012', city: 'El Retiro', langs: ['es'] },
    { id: 'u-lender', name: 'Paula Ríos', role: 'lender', roleGroup: 'vendor', initials: 'PR', title: 'Asesora hipotecaria · Bancolombia', phone: '+57 322 000 0013', city: 'Medellín', langs: ['es', 'en'] },
    { id: 'u-sel-1', name: 'Gloria Patricia Uribe', role: 'seller', roleGroup: 'customer', initials: 'GU', phone: '+57 300 000 0101', city: 'Medellín', langs: ['es'] },
    { id: 'u-sel-2', name: 'Jorge Iván Salazar', role: 'seller', roleGroup: 'customer', initials: 'JS', phone: '+57 300 000 0102', city: 'Guatapé', langs: ['es'] },
    { id: 'u-buy-1', name: 'Emily Chen', role: 'buyer', roleGroup: 'customer', initials: 'EC', phone: '+1 416 000 0103', city: 'Toronto', langs: ['en'] },
    { id: 'u-buy-2', name: 'Camilo Echeverri', role: 'buyer', roleGroup: 'customer', initials: 'CE', phone: '+57 300 000 0104', city: 'Bogotá', langs: ['es'] },
    { id: 'u-lan-1', name: 'Marta Lucía Botero', role: 'landlord', roleGroup: 'customer', initials: 'MB', phone: '+57 300 000 0105', city: 'Medellín', langs: ['es'] },
    { id: 'u-lan-2', name: 'Felipe Correa', role: 'landlord', roleGroup: 'customer', initials: 'FC', phone: '+34 600 000 106', city: 'Madrid', langs: ['es', 'en'] },
    { id: 'u-ren-1', name: 'Sofía Ramírez', role: 'renter', roleGroup: 'customer', initials: 'SR', phone: '+57 300 000 0107', city: 'Medellín', langs: ['es'] },
    { id: 'u-ren-2', name: 'Daniel Weber', role: 'renter', roleGroup: 'customer', initials: 'DW', phone: '+49 170 000 0108', city: 'Berlín', langs: ['en'] }
  ];

  /* ---------------------------------------------------------------- listings */
  // stage ∈ pipeline stages: captacion | preparacion | publicado | visitas | oferta | cierre | arrendado | vendido
  function img(slug, n) {
    var arr = [];
    for (var i = 1; i <= n; i++) {
      arr.push({ file: slug + '-' + String(i).padStart(2, '0') + '.jpg', url: 'https://picsum.photos/seed/' + slug + i + '/1200/800',
        aiTags: ['exterior', 'sala', 'cocina', 'habitación principal', 'vista al embalse', 'terraza', 'baño', 'zonas verdes'][(i - 1) % 8] , quality: 0.72 + ((i * 7) % 25) / 100, approved: i <= n - 1 });
    }
    return arr;
  }
  D.listings = [
    { id: 'lst-001', slug: 'lote-embalse-tierra-prometida', title: 'Lote con vista al embalse · Tierra Prometida', type: 'lote', operacion: 'venta', price: 1450000000, currency: 'COP',
      city: 'Guatapé', barrio: 'Tierra Prometida', region: 'Antioquia', area: 2800, areaLote: 2800, habitaciones: 0, banos: 0, parqueaderos: 0, estrato: null, administracion: 380000, ano: null,
      amenities: ['Vista 180° al embalse', 'Dentro del Parque Natural Paraíso Antioqueño', 'Servicios en frente', 'Acceso a muelle comunitario', 'Licencia de construcción aprobada'],
      description: 'Terreno de 2.800 m² con frente al embalse de Guatapé, pendiente suave y orientación oriente. Ideal para casa de descanso o proyecto de renta turística bajo administración Dorum Lifestyle.',
      listedBy: 'u-brk-1', ownerId: 'u-sel-2', status: 'activo', stage: 'visitas', daysOnMarket: 34, views: 2140, leads: 18, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: true }, cover: 'https://picsum.photos/seed/embalse1/800/600', images: img('lote-embalse', 8), featured: true },
    { id: 'lst-002', slug: 'apto-luxe-charlee-guatape', title: 'Apartamento 183 m² · Luxe by The Charlee', type: 'apartamento', operacion: 'venta', price: 1980000000, currency: 'COP',
      city: 'Guatapé', barrio: 'Tierra Prometida', region: 'Antioquia', area: 183, habitaciones: 2, banos: 2, parqueaderos: 2, estrato: null, administracion: 1650000, ano: 2025,
      amenities: ['Piscina infinita sobre el embalse', 'Spa & wellness', 'Restaurante The Charlee', 'Muelle privado', 'Renta turística administrada', 'Domótica'],
      description: 'Unidad de dos alcobas con balcón corrido y vista frontal al embalse, dentro del desarrollo Luxe by The Charlee. Entrega amoblada, lista para programa de renta turística Dorum Lifestyle & Experiences.',
      listedBy: 'u-brk-1', ownerId: null, status: 'activo', stage: 'visitas', daysOnMarket: 61, views: 5320, leads: 41, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: true }, cover: 'https://picsum.photos/seed/charlee2/800/600', images: img('luxe-charlee', 10), featured: true },
    { id: 'lst-003', slug: 'casa-de-lago-guatape', title: 'Casa de lago con muelle privado', type: 'casa', operacion: 'venta', price: 3900000000, currency: 'COP',
      city: 'Guatapé', barrio: 'Vereda La Piedra', region: 'Antioquia', area: 420, areaLote: 4200, habitaciones: 4, banos: 5, parqueaderos: 4, estrato: null, administracion: 0, ano: 2019,
      amenities: ['Muelle privado con deck', 'Jacuzzi exterior', 'Cocina abierta en madera local', 'Paneles solares', 'Casa de huéspedes', 'Vista a La Piedra del Peñol'],
      description: 'Casa de descanso de 420 m² sobre lote de 4.200 m² con frente de agua. Arquitectura en madera y piedra, cuatro alcobas con baño, casa de huéspedes independiente. Historial de renta turística verificable.',
      listedBy: 'u-brk-1', ownerId: null, status: 'bajo oferta', stage: 'oferta', daysOnMarket: 88, views: 7810, leads: 52, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: false, instagram: true }, cover: 'https://picsum.photos/seed/lago3/800/600', images: img('casa-lago', 12), featured: true },
    { id: 'lst-004', slug: 'finca-llanogrande-los-sauces', title: 'Finca Los Sauces · Llanogrande', type: 'finca', operacion: 'venta', price: 3450000000, currency: 'COP',
      city: 'Rionegro', barrio: 'Llanogrande', region: 'Antioquia', area: 480, areaLote: 8500, habitaciones: 4, banos: 4, parqueaderos: 6, estrato: 6, administracion: 0, ano: 2012,
      amenities: ['Lote de 8.500 m² con jardín maduro', 'Piscina climatizada', 'Casa de mayordomo', 'A 12 min del aeropuerto JMC', 'Kiosco con BBQ', 'Caballeriza'],
      description: 'Finca de recreo en el corazón de Llanogrande: casa principal de 480 m² en un solo nivel, cuatro alcobas, piscina climatizada y jardín de 8.500 m² con guayacanes y sietecueros.',
      listedBy: 'u-brk-1', ownerId: 'u-sel-1', status: 'activo', stage: 'publicado', daysOnMarket: 12, views: 1560, leads: 9, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: false }, cover: 'https://picsum.photos/seed/sauces4/800/600', images: img('finca-sauces', 9), featured: false },
    { id: 'lst-005', slug: 'casa-campestre-llanogrande-arriendo', title: 'Casa campestre amoblada · Llanogrande', type: 'casa', operacion: 'arriendo', price: 14000000, currency: 'COP', rentalType: 'vivienda',
      city: 'Rionegro', barrio: 'Llanogrande · Parcelación Guayacanes', region: 'Antioquia', area: 360, areaLote: 2600, habitaciones: 4, banos: 4, parqueaderos: 3, estrato: 6, administracion: 950000, ano: 2016,
      amenities: ['Totalmente amoblada', 'Parcelación con portería 24h', 'Chimenea', 'Estudio', 'Zona de mascotas', 'Fibra óptica'],
      description: 'Casa campestre amoblada en parcelación cerrada, ideal para familias reubicadas o estadías ejecutivas. Canon incluye mantenimiento de jardín.',
      listedBy: 'u-brk-1', ownerId: 'u-lan-2', status: 'activo', stage: 'visitas', daysOnMarket: 19, views: 980, leads: 7, division: 'lifestyle',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: false, instagram: false }, cover: 'https://picsum.photos/seed/guayacan5/800/600', images: img('casa-guayacanes', 7), featured: false },
    { id: 'lst-006', slug: 'finca-cafetera-guarne', title: 'Finca cafetera con casa restaurada', type: 'finca', operacion: 'venta', price: 2100000000, currency: 'COP',
      city: 'Guarne', barrio: 'Vereda San Ignacio', region: 'Antioquia', area: 310, areaLote: 32000, habitaciones: 5, banos: 3, parqueaderos: 4, estrato: null, administracion: 0, ano: 1948,
      amenities: ['3,2 ha con café y bosque nativo', 'Casa de bahareque restaurada', 'Nacimiento de agua propio', 'Beneficiadero', 'Apta para glamping', 'A 35 min de Medellín'],
      description: 'Finca tradicional antioqueña restaurada con criterio patrimonial. Tres hectáreas con café en producción, bosque nativo y nacimiento de agua. Potencial para proyecto de experiencias Dorum.',
      listedBy: 'u-brk-1', ownerId: null, status: 'en preparación', stage: 'preparacion', daysOnMarket: 0, views: 0, leads: 0, division: 'real-estate',
      syndication: { fincaRaiz: false, wasi: false, metrocuadrado: false, instagram: false }, cover: 'https://picsum.photos/seed/cafetal6/800/600', images: img('finca-cafetera', 4), featured: false },
    { id: 'lst-007', slug: 'casa-el-retiro-fizebad', title: 'Casa moderna en El Retiro · sector Fizebad', type: 'casa', operacion: 'venta', price: 2650000000, currency: 'COP',
      city: 'El Retiro', barrio: 'Fizebad', region: 'Antioquia', area: 390, areaLote: 3100, habitaciones: 4, banos: 5, parqueaderos: 4, estrato: 6, administracion: 720000, ano: 2021,
      amenities: ['Diseño Dorum Projects', 'Certificación sostenible', 'Recolección de aguas lluvias', 'Techo verde', 'Vista a la represa La Fe', 'Home office'],
      description: 'Casa de arquitectura contemporánea firmada por Dorum Projects: concreto a la vista, madera y vidrio, con estrategias pasivas de climatización y vista a la represa La Fe.',
      listedBy: 'u-brk-2', ownerId: null, status: 'activo', stage: 'publicado', daysOnMarket: 7, views: 640, leads: 4, division: 'projects',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: true }, cover: 'https://picsum.photos/seed/retiro7/800/600', images: img('casa-retiro', 8), featured: true },
    { id: 'lst-008', slug: 'apto-provenza-el-poblado', title: 'Apartamento en Provenza con terraza', type: 'apartamento', operacion: 'venta', price: 1350000000, currency: 'COP',
      city: 'Medellín', barrio: 'El Poblado · Provenza', region: 'Antioquia', area: 165, habitaciones: 3, banos: 3, parqueaderos: 2, estrato: 6, administracion: 1180000, ano: 2017,
      amenities: ['Terraza de 28 m²', 'Piso 12 con vista a las montañas', 'Gimnasio y piscina', 'Cuarto útil', 'Portería 24h', 'A dos cuadras del Parque Lleras'],
      description: 'Tres alcobas y terraza en el sector más caminable de El Poblado. Edificio de 2017 con amenidades completas. Ideal para vivienda o renta corporativa.',
      listedBy: 'u-brk-2', ownerId: 'u-sel-1', status: 'activo', stage: 'visitas', daysOnMarket: 45, views: 3410, leads: 27, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: false }, cover: 'https://picsum.photos/seed/provenza8/800/600', images: img('apto-provenza', 10), featured: false },
    { id: 'lst-009', slug: 'penthouse-los-balsos', title: 'Penthouse dúplex · Los Balsos', type: 'penthouse', operacion: 'venta', price: 3100000000, currency: 'COP',
      city: 'Medellín', barrio: 'El Poblado · Los Balsos', region: 'Antioquia', area: 340, habitaciones: 4, banos: 5, parqueaderos: 4, estrato: 6, administracion: 2400000, ano: 2020,
      amenities: ['Dúplex con jacuzzi en cubierta', 'Vista a todo el valle', 'Ascensor privado', 'Bodega de vinos', 'Cocina italiana', 'Sistema de sonido integrado'],
      description: 'Penthouse dúplex de 340 m² con terraza-cubierta privada y jacuzzi. Cuatro alcobas con vestier, ascensor directo al apartamento.',
      listedBy: 'u-brk-2', ownerId: null, status: 'borrador', stage: 'captacion', daysOnMarket: 0, views: 0, leads: 0, division: 'real-estate',
      syndication: { fincaRaiz: false, wasi: false, metrocuadrado: false, instagram: false }, cover: 'https://picsum.photos/seed/balsos9/800/600', images: img('penthouse-balsos', 3), featured: false },
    { id: 'lst-010', slug: 'apto-laureles-arriendo', title: 'Apartamento luminoso en Laureles', type: 'apartamento', operacion: 'arriendo', price: 4500000, currency: 'COP', rentalType: 'vivienda',
      city: 'Medellín', barrio: 'Laureles · Primer Parque', region: 'Antioquia', area: 98, habitaciones: 2, banos: 2, parqueaderos: 1, estrato: 5, administracion: 520000, ano: 2014,
      amenities: ['Balcón con vista al parque', 'Cocina integral', 'Zona de ropas', 'Edificio con gimnasio', 'A 5 min del Estadio', 'Pet friendly'],
      description: 'Dos alcobas con balcón sobre el Primer Parque de Laureles. Edificio tranquilo, excelente iluminación natural, disponible desde el 1 de octubre.',
      listedBy: 'u-brk-2', ownerId: 'u-lan-1', status: 'arrendado', stage: 'arrendado', daysOnMarket: 16, views: 2210, leads: 33, division: 'lifestyle',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: false }, cover: 'https://picsum.photos/seed/laureles10/800/600', images: img('apto-laureles', 8), featured: false },
    { id: 'lst-011', slug: 'apto-envigado-esmeraldal', title: 'Apartamento familiar · Loma del Esmeraldal', type: 'apartamento', operacion: 'venta', price: 850000000, currency: 'COP',
      city: 'Envigado', barrio: 'Loma del Esmeraldal', region: 'Antioquia', area: 126, habitaciones: 3, banos: 3, parqueaderos: 2, estrato: 5, administracion: 690000, ano: 2019,
      amenities: ['Unidad cerrada con piscina', 'Salón social', 'Parque infantil', 'Vista a la reserva', 'Cuarto útil', 'Cerca a la Vía Las Palmas'],
      description: 'Tres alcobas en unidad cerrada con zonas verdes y vista a la reserva El Romeral. Envigado tuvo la mayor valorización del Valle de Aburrá en 2025.',
      listedBy: 'u-brk-2', ownerId: null, status: 'activo', stage: 'oferta', daysOnMarket: 52, views: 2870, leads: 21, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: false }, cover: 'https://picsum.photos/seed/envigado11/800/600', images: img('apto-envigado', 7), featured: false },
    { id: 'lst-012', slug: 'casa-descanso-guatape-vacacional', title: 'Casa de descanso frente al embalse · renta vacacional', type: 'casa', operacion: 'arriendo', price: 2400000, currency: 'COP', rentalType: 'vacacional', priceUnit: 'noche',
      city: 'Guatapé', barrio: 'Vereda El Roble', region: 'Antioquia', area: 260, areaLote: 1900, habitaciones: 3, banos: 3, parqueaderos: 3, estrato: null, administracion: 0, ano: 2022,
      amenities: ['Hasta 8 huéspedes', 'Kayaks y paddle incluidos', 'Jacuzzi con vista', 'Chef bajo pedido (Lifestyle)', 'Check-in sin contacto', 'Ocupación 2025: 71%'],
      description: 'Propiedad del programa Dorum Lifestyle & Experiences. Casa de tres alcobas frente al agua, administrada integralmente: reservas, limpieza, experiencias y liquidación mensual al propietario.',
      listedBy: 'u-brk-1', ownerId: 'u-lan-2', status: 'activo', stage: 'arrendado', daysOnMarket: 210, views: 12400, leads: 96, division: 'lifestyle',
      syndication: { fincaRaiz: false, wasi: false, metrocuadrado: false, instagram: true }, cover: 'https://picsum.photos/seed/roble12/800/600', images: img('casa-roble', 9), featured: true },
    { id: 'lst-013', slug: 'apto-bocagrande-cartagena', title: 'Apartamento frente al mar · Bocagrande', type: 'apartamento', operacion: 'venta', price: 1650000000, currency: 'COP',
      city: 'Cartagena', barrio: 'Bocagrande', region: 'Bolívar', area: 142, habitaciones: 3, banos: 3, parqueaderos: 1, estrato: 6, administracion: 1350000, ano: 2015,
      amenities: ['Vista frontal al mar Caribe', 'Piscina en piso 20', 'Amoblado', 'Renta turística permitida', 'A 10 min del Centro Histórico', 'Generador eléctrico'],
      description: 'Tres alcobas con vista frontal al mar en Bocagrande. Edificio con reglamento que permite renta turística; historial de ocupación disponible.',
      listedBy: 'u-brk-3', ownerId: null, status: 'activo', stage: 'publicado', daysOnMarket: 23, views: 1890, leads: 12, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: true }, cover: 'https://picsum.photos/seed/bocagrande13/800/600', images: img('apto-bocagrande', 8), featured: false },
    { id: 'lst-014', slug: 'villa-tulum-aldea-zama', title: 'Villa en la selva · Aldea Zamá, Tulum', type: 'casa', operacion: 'venta', price: 890000, currency: 'USD', international: true,
      city: 'Tulum', barrio: 'Aldea Zamá', region: 'Quintana Roo', country: 'México', area: 310, areaLote: 800, habitaciones: 4, banos: 4, parqueaderos: 2, estrato: null, administracion: 0, ano: 2023,
      amenities: ['Piscina privada', 'Rooftop con vista a la selva', 'Cenote a 5 min', 'Renta vacacional activa', 'Diseño bioclimático', 'Fideicomiso listo'],
      description: 'Villa de cuatro recámaras en Aldea Zamá con alberca privada y rooftop. Parte del portafolio internacional Dorum (Colombia · México · Dubái). Precio en USD.',
      listedBy: 'u-brk-3', ownerId: null, status: 'activo', stage: 'publicado', daysOnMarket: 40, views: 2230, leads: 15, division: 'real-estate',
      syndication: { fincaRaiz: false, wasi: false, metrocuadrado: false, instagram: true }, cover: 'https://picsum.photos/seed/tulum14/800/600', images: img('villa-tulum', 9), featured: true },
    { id: 'lst-015', slug: 'oficina-milla-de-oro', title: 'Oficina en la Milla de Oro', type: 'oficina', operacion: 'arriendo', price: 9800000, currency: 'COP', rentalType: 'comercial',
      city: 'Medellín', barrio: 'El Poblado · Milla de Oro', region: 'Antioquia', area: 140, habitaciones: 0, banos: 2, parqueaderos: 3, estrato: null, administracion: 1900000, ano: 2018,
      amenities: ['Piso 9 con vista', 'Aire acondicionado central', 'Sala de juntas dotada', 'Recepción compartida', 'Bicicletero', 'Certificación LEED'],
      description: 'Oficina abierta de 140 m² en edificio corporativo de la Milla de Oro. Entregada con cableado estructurado y sala de juntas.',
      listedBy: 'u-brk-2', ownerId: 'u-lan-1', status: 'arrendado', stage: 'arrendado', daysOnMarket: 38, views: 760, leads: 6, division: 'real-estate',
      syndication: { fincaRaiz: true, wasi: true, metrocuadrado: true, instagram: false }, cover: 'https://picsum.photos/seed/oficina15/800/600', images: img('oficina-milla', 5), featured: false }
  ];

  D.pipelineStages = [
    { id: 'captacion', label: 'Captación', pipeline: 'get' },
    { id: 'preparacion', label: 'En preparación', pipeline: 'market' },
    { id: 'publicado', label: 'Publicado', pipeline: 'market' },
    { id: 'visitas', label: 'Visitas', pipeline: 'sell' },
    { id: 'oferta', label: 'Bajo oferta', pipeline: 'sell' },
    { id: 'cierre', label: 'Cierre', pipeline: 'close' },
    { id: 'vendido', label: 'Vendido', pipeline: 'close' },
    { id: 'arrendado', label: 'Arrendado', pipeline: 'rental' }
  ];

  /* ---------------------------------------------------------- contacts/leads */
  // stage (get pipeline): nuevo | contactado | visita | propuesta | firmado ; (sell): nuevo | calificado | tour | oferta | contrato
  D.contacts = [
    { id: 'c-001', name: 'Emily Chen', userId: 'u-buy-1', kind: 'buyer', pipeline: 'sell', stage: 'tour', source: 'Instagram', interest: ['lst-002', 'lst-003'], budget: 4000000000, city: 'Toronto', owner: 'u-brk-1', lastTouch: '2026-09-15', nextAction: 'Tour Casa de lago · sáb 19 sep 10:00', score: 92, lang: 'en', whatsapp: true },
    { id: 'c-002', name: 'Camilo Echeverri', userId: 'u-buy-2', kind: 'buyer', pipeline: 'sell', stage: 'oferta', source: 'Finca Raíz', interest: ['lst-011'], budget: 900000000, city: 'Bogotá', owner: 'u-brk-2', lastTouch: '2026-09-16', nextAction: 'Responder contraoferta (AI borrador listo)', score: 88, lang: 'es', whatsapp: true },
    { id: 'c-003', name: 'Familia Restrepo Gómez', kind: 'buyer', pipeline: 'sell', stage: 'calificado', source: 'Website', interest: ['lst-004', 'lst-007'], budget: 3500000000, city: 'Medellín', owner: 'u-brk-1', lastTouch: '2026-09-14', nextAction: 'Enviar comparativo Llanogrande vs El Retiro', score: 74, lang: 'es', whatsapp: true },
    { id: 'c-004', name: 'Andrew Miller', kind: 'buyer', pipeline: 'sell', stage: 'nuevo', source: 'Instagram', interest: ['lst-014'], budget: 950000, currency: 'USD', city: 'Austin', owner: 'u-brk-3', lastTouch: '2026-09-16', nextAction: 'Primer contacto (AI borrador en inglés)', score: 61, lang: 'en', whatsapp: false },
    { id: 'c-005', name: 'Natalia Pérez', kind: 'renter', pipeline: 'sell', stage: 'tour', source: 'Finca Raíz', interest: ['lst-005'], budget: 15000000, city: 'Medellín', owner: 'u-radmin', lastTouch: '2026-09-15', nextAction: 'Visita casa Guayacanes · mié 17 sep 15:00', score: 79, lang: 'es', whatsapp: true },
    { id: 'c-006', name: 'Daniel Weber', userId: 'u-ren-2', kind: 'renter', pipeline: 'sell', stage: 'contrato', source: 'WhatsApp', interest: ['lst-010'], budget: 5000000, city: 'Berlín', owner: 'u-brk-2', lastTouch: '2026-09-10', nextAction: 'Firmó contrato · inventario pendiente', score: 95, lang: 'en', whatsapp: true },
    { id: 'c-007', name: 'Hernán Vélez', kind: 'seller', pipeline: 'get', stage: 'visita', source: 'Referido', interest: [], propertyHint: 'Finca 5 ha en San Antonio de Pereira', city: 'Rionegro', owner: 'u-brk-1', lastTouch: '2026-09-13', nextAction: 'Visita de captación · jue 18 sep 09:00', score: 70, lang: 'es', whatsapp: true },
    { id: 'c-008', name: 'Luisa Fernanda Ospina', kind: 'seller', pipeline: 'get', stage: 'propuesta', source: 'Website', interest: [], propertyHint: 'Apartamento 210 m² en Castropol', city: 'Medellín', owner: 'u-brk-2', lastTouch: '2026-09-15', nextAction: 'Enviar acuerdo de corretaje (AI generado, revisar comisión)', score: 83, lang: 'es', whatsapp: true },
    { id: 'c-009', name: 'Gloria Patricia Uribe', userId: 'u-sel-1', kind: 'seller', pipeline: 'get', stage: 'firmado', source: 'Referido', interest: ['lst-004', 'lst-008'], city: 'Medellín', owner: 'u-brk-1', lastTouch: '2026-09-12', nextAction: '—', score: 100, lang: 'es', whatsapp: true },
    { id: 'c-010', name: 'Inversiones Peñol S.A.S.', kind: 'landlord', pipeline: 'get', stage: 'contactado', source: 'Instagram', interest: [], propertyHint: '3 cabañas en El Peñol para renta vacacional', city: 'El Peñol', owner: 'u-radmin', lastTouch: '2026-09-11', nextAction: 'Llamada de seguimiento · propuesta Lifestyle 10 %', score: 66, lang: 'es', whatsapp: true },
    { id: 'c-011', name: 'Felipe Correa', userId: 'u-lan-2', kind: 'landlord', pipeline: 'get', stage: 'firmado', source: 'Referido', interest: ['lst-005', 'lst-012'], city: 'Madrid', owner: 'u-radmin', lastTouch: '2026-09-01', nextAction: '—', score: 100, lang: 'es', whatsapp: true },
    { id: 'c-012', name: 'Sara Londoño', kind: 'seller', pipeline: 'get', stage: 'nuevo', source: 'Meta Ads', interest: [], propertyHint: 'Lote 1.500 m² vía Guatapé–El Peñol', city: 'Guatapé', owner: 'u-brk-1', lastTouch: '2026-09-16', nextAction: 'Primer contacto por WhatsApp (AI borrador)', score: 58, lang: 'es', whatsapp: true }
  ];

  /* ------------------------------------------------------------------- deals */
  // split[] kinds: commission (pct of gross commission) | referral (pct or amount) | fee (amount) | salary (amount)
  // stage: at-listing | at-close | monthly
  D.deals = [
    { id: 'd-001', kind: 'venta', listingId: 'lst-003', status: 'bajo oferta', stage: 'oferta', title: 'Casa de lago · oferta Emily Chen',
      parties: { seller: null, buyer: 'u-buy-1', listingBroker: 'u-brk-1', sellingBroker: 'u-brk-1', lawyer: 'u-lawyer', lender: null },
      askingPrice: 3900000000, offerPrice: 3650000000, agreedPrice: null, commissionPct: 4, ivaPct: 19, currency: 'COP',
      split: [
        { participant: 'u-brk-1', kind: 'commission', pct: 45, stage: 'at-close', note: 'Listing + selling broker' },
        { participant: 'u-owner', kind: 'commission', pct: 45, stage: 'at-close', note: 'Agencia Dorum' },
        { participant: 'u-lawyer', kind: 'commission', pct: 10, stage: 'at-close', note: 'Revisión legal y promesa' },
        { participant: 'u-photo', kind: 'fee', amount: 1850000, stage: 'at-listing', note: 'Paquete foto + dron + video' },
        { participant: 'u-writer', kind: 'fee', amount: 650000, stage: 'at-listing', note: 'Redacción bilingüe + comps' }
      ],
      escrow: { held: 0, expected: 365000000, note: 'Arras 10 % al firmar promesa' },
      timeline: [
        { at: '2026-06-20', label: 'Acuerdo de corretaje firmado', done: true },
        { at: '2026-07-02', label: 'Publicado en Finca Raíz, Wasi, Instagram', done: true, ai: true },
        { at: '2026-09-12', label: 'Tour presencial · Emily Chen', done: true },
        { at: '2026-09-15', label: 'Oferta recibida COP 3.650 M', done: true },
        { at: '2026-09-17', label: 'Contraoferta (AI borrador · aprobar)', done: false, ai: true, current: true },
        { at: null, label: 'Promesa de compraventa', done: false },
        { at: null, label: 'Escritura en Notaría 15 · entrega de llaves', done: false }
      ] },
    { id: 'd-002', kind: 'venta', listingId: 'lst-011', status: 'bajo oferta', stage: 'oferta', title: 'Apto Esmeraldal · oferta Camilo Echeverri',
      parties: { seller: null, buyer: 'u-buy-2', listingBroker: 'u-brk-2', sellingBroker: 'u-brk-2', lawyer: 'u-lawyer', lender: 'u-lender' },
      askingPrice: 850000000, offerPrice: 815000000, agreedPrice: null, commissionPct: 3, ivaPct: 19, currency: 'COP',
      split: [
        { participant: 'u-brk-2', kind: 'commission', pct: 40, stage: 'at-close' },
        { participant: 'u-owner', kind: 'commission', pct: 50, stage: 'at-close', note: 'Agencia Dorum' },
        { participant: 'u-brk-3', kind: 'referral', pct: 10, stage: 'at-close', note: 'Referido desde Cartagena' }
      ],
      escrow: { held: 0, expected: 81500000, note: 'Arras 10 %' },
      timeline: [
        { at: '2026-07-26', label: 'Captación y acuerdo firmado', done: true },
        { at: '2026-08-05', label: 'Publicado en 3 portales', done: true, ai: true },
        { at: '2026-09-14', label: 'Pre-aprobación Bancolombia · COP 600 M', done: true },
        { at: '2026-09-16', label: 'Oferta COP 815 M recibida', done: true, current: true },
        { at: null, label: 'Promesa de compraventa', done: false }
      ] },
    { id: 'd-003', kind: 'venta', listingId: 'lst-008', status: 'activo', stage: 'visitas', title: 'Apto Provenza · en visitas',
      parties: { seller: 'u-sel-1', buyer: null, listingBroker: 'u-brk-2', sellingBroker: null, lawyer: 'u-lawyer', lender: null },
      askingPrice: 1350000000, offerPrice: null, agreedPrice: null, commissionPct: 3, ivaPct: 19, currency: 'COP',
      split: [
        { participant: 'u-brk-2', kind: 'commission', pct: 10, stage: 'at-listing', note: 'Anticipo de marketing' },
        { participant: 'u-brk-2', kind: 'commission', pct: 30, stage: 'at-close' },
        { participant: 'u-owner', kind: 'commission', pct: 60, stage: 'at-close', note: 'Agencia (incluye selling broker si aplica)' },
        { participant: 'u-photo', kind: 'fee', amount: 950000, stage: 'at-listing' }
      ],
      escrow: { held: 0, expected: 0 }, timeline: [] },
    { id: 'd-004', kind: 'arriendo', listingId: 'lst-010', status: 'arrendado', stage: 'arrendado', title: 'Apto Laureles · Daniel Weber',
      parties: { landlord: 'u-lan-1', renter: 'u-ren-2', listingBroker: 'u-brk-2', rentalAdmin: 'u-radmin', lawyer: 'u-lawyer' },
      monthlyRent: 4500000, administracion: 520000, deposit: 4500000, termMonths: 12, startDate: '2026-10-01', endDate: '2027-09-30', mgmtPct: 10, ivaPct: 19, currency: 'COP',
      split: [
        { participant: 'u-brk-2', kind: 'commission', pct: 50, stage: 'at-close', note: '50 % del primer canon (fee de colocación)' },
        { participant: 'u-owner', kind: 'commission', pct: 50, stage: 'at-close', note: 'Agencia · 50 % del primer canon' },
        { participant: 'u-owner', kind: 'fee', pct: 10, stage: 'monthly', note: 'Administración de arriendo 10 % + IVA' },
        { participant: 'u-lan-1', kind: 'fee', pct: 90, stage: 'monthly', note: 'Liquidación al propietario' }
      ],
      escrow: { held: 4500000, expected: 4500000, note: 'Depósito en garantía' },
      timeline: [
        { at: '2026-09-08', label: 'Contrato de arrendamiento firmado (e-sign)', done: true },
        { at: '2026-09-25', label: 'Inventario de entrada con fotos', done: false, current: true },
        { at: '2026-10-01', label: 'Inicio del contrato · primer canon', done: false }
      ] },
    { id: 'd-005', kind: 'arriendo', listingId: 'lst-012', status: 'arrendado', stage: 'arrendado', title: 'Casa El Roble · renta vacacional (Lifestyle)',
      parties: { landlord: 'u-lan-2', renter: null, rentalAdmin: 'u-radmin', listingBroker: 'u-brk-1' },
      nightlyRate: 2400000, occupancyPct: 71, mgmtPct: 20, ivaPct: 19, currency: 'COP', rentalType: 'vacacional',
      split: [
        { participant: 'u-owner', kind: 'fee', pct: 20, stage: 'monthly', note: 'Administración integral Lifestyle & Experiences 20 %' },
        { participant: 'u-lan-2', kind: 'fee', pct: 80, stage: 'monthly', note: 'Liquidación mensual al propietario' }
      ],
      escrow: { held: 18200000, expected: 0, note: 'Reservas cobradas por adelantado (sept)' }, timeline: [] },
    { id: 'd-006', kind: 'arriendo', listingId: 'lst-015', status: 'arrendado', stage: 'arrendado', title: 'Oficina Milla de Oro · arrendada a Kuna Tech',
      parties: { landlord: 'u-lan-1', renter: null, listingBroker: 'u-brk-2', rentalAdmin: 'u-radmin' },
      monthlyRent: 9800000, administracion: 1900000, termMonths: 36, startDate: '2026-08-01', endDate: '2029-07-31', mgmtPct: 8, ivaPct: 19, currency: 'COP',
      split: [
        { participant: 'u-brk-2', kind: 'commission', pct: 60, stage: 'at-close', note: '60 % del primer canon' },
        { participant: 'u-owner', kind: 'commission', pct: 40, stage: 'at-close' },
        { participant: 'u-owner', kind: 'fee', pct: 8, stage: 'monthly', note: 'Administración comercial 8 %' },
        { participant: 'u-lan-1', kind: 'fee', pct: 92, stage: 'monthly' }
      ],
      escrow: { held: 19600000, expected: 19600000, note: 'Depósito 2 cánones' }, timeline: [] }
  ];

  /* ------------------------------------------------------------------- tasks */
  // status: pendiente | en curso | revisión | listo | bloqueado
  D.tasks = [
    { id: 't-001', listingId: 'lst-006', title: 'Sesión de fotos, video y dron · Finca cafetera', assignee: 'u-photo', due: '2026-09-19', status: 'en curso', aiDrafted: false, kind: 'photography', order: { amount: 1850000, pkg: 'Premium: 40 fotos + video 90 s + dron' } },
    { id: 't-002', listingId: 'lst-006', title: 'Redacción ES/EN · Finca cafetera', assignee: 'u-writer', due: '2026-09-22', status: 'revisión', aiDrafted: true, kind: 'writing', note: 'Borrador AI listo (320 palabras). Revisar tono "patrimonial".' },
    { id: 't-003', listingId: 'lst-006', title: 'Comps & datos de mercado · Guarne / Oriente', assignee: 'u-writer', due: '2026-09-20', status: 'listo', aiDrafted: true, kind: 'research', note: '6 comparables en 12 km. Precio sugerido COP 2.050–2.200 M.' },
    { id: 't-004', listingId: 'lst-006', title: 'Gráficos y video para pauta', assignee: 'u-adv', due: '2026-09-24', status: 'pendiente', aiDrafted: false, kind: 'creative' },
    { id: 't-005', listingId: 'lst-006', title: 'Cotización restauración beneficiadero → glamping', assignee: 'u-constr', due: '2026-09-30', status: 'pendiente', aiDrafted: false, kind: 'construction', optional: true },
    { id: 't-006', listingId: 'lst-006', title: 'Validar payload Finca Raíz / Wasi / Metrocuadrado', assignee: 'u-sadmin', due: '2026-09-25', status: 'bloqueado', aiDrafted: true, kind: 'publishing', note: 'Bloqueado por t-001 (fotos).' },
    { id: 't-007', listingId: 'lst-004', title: 'Reel Instagram · Finca Los Sauces', assignee: 'u-adv', due: '2026-09-18', status: 'revisión', aiDrafted: true, kind: 'creative', note: 'AI seleccionó 9 clips; falta aprobar música.' },
    { id: 't-008', listingId: 'lst-004', title: 'Abrir campaña Meta · COP 1.200.000 / 14 días', assignee: 'u-adv', due: '2026-09-19', status: 'pendiente', aiDrafted: true, kind: 'ads' },
    { id: 't-009', listingId: 'lst-003', title: 'Redactar contraoferta a Emily Chen (COP 3.780 M)', assignee: 'u-brk-1', due: '2026-09-17', status: 'revisión', aiDrafted: true, kind: 'negotiation', note: 'AI propone 3.780 M con cierre en 45 días. Aprobar o editar.' },
    { id: 't-010', listingId: 'lst-011', title: 'Preparar promesa de compraventa · Esmeraldal', assignee: 'u-lawyer', due: '2026-09-23', status: 'pendiente', aiDrafted: true, kind: 'contract' },
    { id: 't-011', listingId: 'lst-010', title: 'Inventario de entrada · Laureles', assignee: 'u-radmin', due: '2026-09-25', status: 'pendiente', aiDrafted: false, kind: 'rental' },
    { id: 't-012', listingId: 'lst-009', title: 'Visita de captación y firma acuerdo · Penthouse Los Balsos', assignee: 'u-brk-2', due: '2026-09-18', status: 'en curso', aiDrafted: false, kind: 'capture' },
    { id: 't-013', listingId: 'lst-009', title: 'Sugerir precio de lista (comps El Poblado alto)', assignee: 'u-brk-2', due: '2026-09-18', status: 'listo', aiDrafted: true, kind: 'research', note: 'Rango AI: COP 2.950–3.250 M · 8,9 M/m².' },
    { id: 't-014', listingId: 'lst-002', title: 'Traducir ficha y responder lead Austin (EN)', assignee: 'u-brk-3', due: '2026-09-17', status: 'revisión', aiDrafted: true, kind: 'followup' },
    { id: 't-015', listingId: 'lst-012', title: 'Programar limpieza y chef · reserva 20–22 sep', assignee: 'u-radmin', due: '2026-09-19', status: 'en curso', aiDrafted: true, kind: 'lifestyle' },
    { id: 't-016', listingId: 'lst-013', title: 'Recibir paz y salvo administración · Bocagrande', assignee: 'u-sadmin', due: '2026-09-26', status: 'pendiente', aiDrafted: false, kind: 'paperwork' },
    { id: 't-017', listingId: null, title: 'Liquidación mensual propietarios Lifestyle · septiembre', assignee: 'u-acct', due: '2026-10-03', status: 'pendiente', aiDrafted: true, kind: 'money' },
    { id: 't-018', listingId: 'lst-007', title: 'Revisar 3 redlines del comprador en acuerdo de reserva', assignee: 'u-lawyer', due: '2026-09-20', status: 'en curso', aiDrafted: false, kind: 'contract' }
  ];

  /* --------------------------------------------------------------- contracts */
  // signStatus per signer: pendiente | enviado | firmado
  D.contracts = [
    { id: 'k-001', type: 'Acuerdo de corretaje · venta', dealId: 'd-001', listingId: 'lst-003', version: 3, redlines: 0, status: 'firmado', aiDrafted: true, lawyerApproved: true,
      signers: [{ userId: 'u-owner', status: 'firmado', at: '2026-06-20' }, { name: 'Propietario Casa de lago', status: 'firmado', at: '2026-06-20' }], updated: '2026-06-20', clauses: 14, exclusive: true, termMonths: 6 },
    { id: 'k-002', type: 'Contraoferta', dealId: 'd-001', listingId: 'lst-003', version: 1, redlines: 2, status: 'borrador', aiDrafted: true, lawyerApproved: false,
      signers: [{ userId: 'u-buy-1', status: 'pendiente' }], updated: '2026-09-16', clauses: 6, note: 'AI propone COP 3.780 M · entrega 45 días · muebles incluidos' },
    { id: 'k-003', type: 'Promesa de compraventa', dealId: 'd-002', listingId: 'lst-011', version: 2, redlines: 4, status: 'en negociación', aiDrafted: true, lawyerApproved: false,
      signers: [{ userId: 'u-buy-2', status: 'pendiente' }, { name: 'Propietario Esmeraldal', status: 'pendiente' }], updated: '2026-09-16', clauses: 18, note: 'Comprador pide arras 5 % en vez de 10 %; fecha escritura 30 nov.' },
    { id: 'k-004', type: 'Contrato de arrendamiento · vivienda', dealId: 'd-004', listingId: 'lst-010', version: 2, redlines: 1, status: 'firmado', aiDrafted: true, lawyerApproved: true,
      signers: [{ userId: 'u-lan-1', status: 'firmado', at: '2026-09-08' }, { userId: 'u-ren-2', status: 'firmado', at: '2026-09-08' }, { name: 'Afianzadora El Libertador', status: 'firmado', at: '2026-09-09' }], updated: '2026-09-09', clauses: 22, termMonths: 12 },
    { id: 'k-005', type: 'Inventario de entrada', dealId: 'd-004', listingId: 'lst-010', version: 1, redlines: 0, status: 'pendiente', aiDrafted: false, lawyerApproved: false,
      signers: [{ userId: 'u-lan-1', status: 'pendiente' }, { userId: 'u-ren-2', status: 'pendiente' }], updated: '2026-09-16', clauses: 0, note: 'Se genera desde las fotos del recorrido del 25 sep.' },
    { id: 'k-006', type: 'Acuerdo de corretaje · arriendo (Lifestyle)', dealId: 'd-005', listingId: 'lst-012', version: 1, redlines: 0, status: 'firmado', aiDrafted: true, lawyerApproved: true,
      signers: [{ userId: 'u-lan-2', status: 'firmado', at: '2026-02-14' }, { userId: 'u-owner', status: 'firmado', at: '2026-02-14' }], updated: '2026-02-14', clauses: 16, termMonths: 24 },
    { id: 'k-007', type: 'Acuerdo de corretaje · venta', dealId: null, listingId: 'lst-009', version: 1, redlines: 0, status: 'enviado', aiDrafted: true, lawyerApproved: true,
      signers: [{ name: 'Propietario Penthouse Los Balsos', status: 'enviado' }, { userId: 'u-owner', status: 'pendiente' }], updated: '2026-09-16', clauses: 14, exclusive: true, termMonths: 6 }
  ];

  /* --------------------------------------------------------------- documents */
  // status: pendiente | recibido | validado | vencido | rechazado
  D.documents = [
    { id: 'doc-001', dealId: 'd-002', listingId: 'lst-011', name: 'Certificado de tradición y libertad', owedBy: 'seller', status: 'validado', aiCheck: 'Sin gravámenes. Matrícula 001-1234567. Emitido hace 12 días.', due: '2026-09-20', file: 'ctl-esmeraldal.pdf' },
    { id: 'doc-002', dealId: 'd-002', listingId: 'lst-011', name: 'Paz y salvo de administración', owedBy: 'seller', status: 'pendiente', due: '2026-09-22' },
    { id: 'doc-003', dealId: 'd-002', listingId: 'lst-011', name: 'Impuesto predial 2026 pagado', owedBy: 'seller', status: 'recibido', aiCheck: 'Falta sello de pago del 2.º trimestre.', due: '2026-09-22', file: 'predial-2026.pdf' },
    { id: 'doc-004', dealId: 'd-002', listingId: 'lst-011', name: 'Cédula de ciudadanía · comprador', owedBy: 'buyer', status: 'validado', aiCheck: 'Nombre coincide con promesa.', file: 'cc-camilo.pdf' },
    { id: 'doc-005', dealId: 'd-002', listingId: 'lst-011', name: 'Carta de pre-aprobación crédito Bancolombia', owedBy: 'buyer', status: 'validado', aiCheck: 'COP 600.000.000 · vence 2026-12-14.', file: 'preaprobacion.pdf' },
    { id: 'doc-006', dealId: 'd-002', listingId: 'lst-011', name: 'Avalúo comercial', owedBy: 'agency', status: 'pendiente', due: '2026-10-05' },
    { id: 'doc-007', dealId: 'd-001', listingId: 'lst-003', name: 'Certificado de tradición y libertad', owedBy: 'seller', status: 'vencido', aiCheck: 'Emitido hace 47 días; notaría exige < 30.', due: '2026-09-25' },
    { id: 'doc-008', dealId: 'd-001', listingId: 'lst-003', name: 'Pasaporte · compradora', owedBy: 'buyer', status: 'validado', file: 'passport-chen.pdf' },
    { id: 'doc-009', dealId: 'd-001', listingId: 'lst-003', name: 'Declaración de origen de fondos', owedBy: 'buyer', status: 'pendiente', due: '2026-09-30' },
    { id: 'doc-010', dealId: 'd-004', listingId: 'lst-010', name: 'Cédula / pasaporte · arrendatario', owedBy: 'renter', status: 'validado', file: 'pass-weber.pdf' },
    { id: 'doc-011', dealId: 'd-004', listingId: 'lst-010', name: 'Póliza de arrendamiento · afianzadora', owedBy: 'agency', status: 'validado', file: 'poliza-libertador.pdf' },
    { id: 'doc-012', dealId: 'd-004', listingId: 'lst-010', name: 'RUT · propietaria', owedBy: 'landlord', status: 'recibido', aiCheck: 'Actividad económica 6810 OK.' },
    { id: 'doc-013', dealId: null, listingId: 'lst-009', name: 'Escritura pública anterior', owedBy: 'seller', status: 'pendiente', due: '2026-09-30' },
    { id: 'doc-014', dealId: null, listingId: 'lst-001', name: 'Licencia de construcción · Planeación Guatapé', owedBy: 'seller', status: 'validado', aiCheck: 'Vigente hasta 2027-03.' }
  ];

  /* ------------------------------------------------------------- payouts/escrow */
  // account: escrow | operating | payroll ; status: pendiente | aprobado | pagado | retenido
  D.payouts = [
    { id: 'p-001', date: '2026-09-02', account: 'escrow', dealId: 'd-005', kind: 'ingreso', concept: 'Reservas septiembre · Casa El Roble (7 noches)', amount: 18200000, counterparty: 'Huéspedes', status: 'pagado' },
    { id: 'p-002', date: '2026-09-09', account: 'escrow', dealId: 'd-004', kind: 'ingreso', concept: 'Depósito en garantía · Apto Laureles', amount: 4500000, counterparty: 'u-ren-2', status: 'pagado' },
    { id: 'p-003', date: '2026-09-05', account: 'operating', dealId: 'd-001', kind: 'egreso', concept: 'Fee fotografía + dron · Casa de lago', amount: 1850000, counterparty: 'u-photo', status: 'pagado', splitKind: 'fee' },
    { id: 'p-004', date: '2026-09-05', account: 'operating', dealId: 'd-001', kind: 'egreso', concept: 'Fee redacción y comps · Casa de lago', amount: 650000, counterparty: 'u-writer', status: 'pagado', splitKind: 'fee' },
    { id: 'p-005', date: '2026-09-15', account: 'operating', dealId: 'd-003', kind: 'egreso', concept: 'Anticipo marketing 10 % · Provenza', amount: 4050000, counterparty: 'u-brk-2', status: 'aprobado', splitKind: 'commission' },
    { id: 'p-006', date: '2026-09-30', account: 'escrow', dealId: 'd-005', kind: 'egreso', concept: 'Liquidación propietario agosto · Casa El Roble (80 %)', amount: 13440000, counterparty: 'u-lan-2', status: 'pendiente', splitKind: 'fee', needsApproval: 'u-acct' },
    { id: 'p-007', date: '2026-09-30', account: 'operating', dealId: 'd-005', kind: 'ingreso', concept: 'Fee administración Lifestyle 20 % · agosto', amount: 3360000, counterparty: 'Dorum', status: 'pendiente', splitKind: 'fee' },
    { id: 'p-008', date: '2026-08-31', account: 'payroll', dealId: null, kind: 'egreso', concept: 'Nómina agosto · 4 empleados', amount: 21400000, counterparty: 'Equipo Dorum', status: 'pagado', splitKind: 'salary' },
    { id: 'p-009', date: '2026-08-15', account: 'operating', dealId: 'd-006', kind: 'ingreso', concept: 'Fee de colocación · Oficina Milla de Oro (1 canon)', amount: 9800000, counterparty: 'u-lan-1', status: 'pagado', splitKind: 'commission' },
    { id: 'p-010', date: '2026-08-16', account: 'operating', dealId: 'd-006', kind: 'egreso', concept: 'Comisión 60 % · Valentina Cardona', amount: 5880000, counterparty: 'u-brk-2', status: 'pagado', splitKind: 'commission' },
    { id: 'p-011', date: '2026-09-16', account: 'operating', dealId: null, kind: 'egreso', concept: 'Pauta Meta septiembre · 3 campañas', amount: 3400000, counterparty: 'Meta Platforms', status: 'pagado' },
    { id: 'p-012', date: '2026-11-30', account: 'escrow', dealId: 'd-002', kind: 'ingreso', concept: 'Arras 10 % · Apto Esmeraldal (proyectado)', amount: 81500000, counterparty: 'u-buy-2', status: 'pendiente', projected: true }
  ];
  D.escrowSummary = { held: 42300000, projected30d: 81500000, pendingReleases: 2, approvalThreshold: 50000000 };

  /* --------------------------------------------------------------- campaigns */
  D.campaigns = [
    { id: 'cmp-001', name: 'Luxe by The Charlee · compradores internacionales', platform: 'Meta · Instagram', listingId: 'lst-002', status: 'activa', budget: 2400000, spend: 1680000, impressions: 184000, clicks: 3120, leads: 27, cpl: 62222, start: '2026-08-20', end: '2026-09-30', audience: 'EN · 35–60 · Miami, Toronto, Madrid · intereses: lake house, wellness travel', owner: 'u-adv', aiCreative: true },
    { id: 'cmp-002', name: 'Lotes con vista al embalse · inversionistas Medellín', platform: 'Meta · Facebook + Instagram', listingId: 'lst-001', status: 'activa', budget: 1200000, spend: 940000, impressions: 96000, clicks: 1870, leads: 14, cpl: 67143, start: '2026-09-01', end: '2026-09-28', audience: 'ES · 30–55 · Medellín, Rionegro · intereses: inversión inmobiliaria, Guatapé', owner: 'u-adv', aiCreative: true },
    { id: 'cmp-003', name: 'Marca Dorum · "Curated by nature"', platform: 'Meta · Instagram Reels', listingId: null, status: 'activa', budget: 900000, spend: 780000, impressions: 210000, clicks: 2400, leads: 9, cpl: 86667, start: '2026-09-01', end: '2026-09-30', audience: 'ES/EN · 28–55 · Colombia + diáspora', owner: 'u-adv', aiCreative: false },
    { id: 'cmp-004', name: 'Búsqueda Google · "finca Llanogrande venta"', platform: 'Google Ads · Search', listingId: 'lst-004', status: 'pausada', budget: 800000, spend: 310000, impressions: 12000, clicks: 640, leads: 5, cpl: 62000, start: '2026-09-05', end: '2026-09-19', audience: 'Palabras clave: finca llanogrande, casa campestre rionegro, finca oriente antioqueño', owner: 'u-adv', aiCreative: true },
    { id: 'cmp-005', name: 'Villa Tulum · US buyers', platform: 'Meta · Instagram', listingId: 'lst-014', status: 'borrador', budget: 1500000, spend: 0, impressions: 0, clicks: 0, leads: 0, cpl: null, start: '2026-09-22', end: '2026-10-22', audience: 'EN · 35–65 · Austin, LA, NYC · intereses: Tulum, second home', owner: 'u-adv', aiCreative: true }
  ];

  /* --------------------------------------------------------------- lifestyle */
  D.lifestyle = [
    { id: 'ls-house', name: 'Housekeeping', nameEs: 'Aseo y mantenimiento', status: 'coming-soon', icon: '🧹', desc: 'Limpieza programada, lavandería y mantenimiento preventivo para casas de descanso y rentas.' },
    { id: 'ls-food', name: 'Food delivery & chef', nameEs: 'Mercado, chef y delivery', status: 'coming-soon', icon: '🍽️', desc: 'Nevera llena al llegar, chef privado a la orilla del embalse, cenas de bienvenida.' },
    { id: 'ls-act', name: 'Activities', nameEs: 'Experiencias', status: 'pilot', icon: '🚤', desc: 'Kayak al amanecer, La Piedra al atardecer, caminatas de bosque, yoga en muelle.' },
    { id: 'ls-trans', name: 'Transportation', nameEs: 'Transporte', status: 'coming-soon', icon: '🚐', desc: 'Traslados aeropuerto JMC ↔ Guatapé, lancha privada, conductor por día.' },
    { id: 'ls-conc', name: 'Concierge', nameEs: 'Concierge', status: 'coming-soon', icon: '🔑', desc: 'Un WhatsApp para todo: reservas, recomendaciones, emergencias, llaves.' },
    { id: 'ls-remodel', name: 'Remodeling', nameEs: 'Remodelación', status: 'coming-soon', icon: '🪵', desc: 'Dorum Projects renueva cocinas, terrazas y muelles con materiales locales y criterio sostenible.' },
    { id: 'ls-build', name: 'Construction from scratch', nameEs: 'Construcción desde cero', status: 'coming-soon', icon: '🏗️', desc: 'Del lote con vista al embalse a la casa terminada: diseño bioclimático, licencias y obra.' }
  ];

  /* ------------------------------------------------------------ voice intents */
  D.voiceIntents = [
    { intent: 'schedule_visit', say: 'Llave, agenda visita mañana a las diez en la casa de lago con Emily Chen.', does: 'Crea el evento, invita a la compradora por WhatsApp en inglés, bloquea la agenda de Mateo y avisa al propietario.', role: 'broker', confirm: false },
    { intent: 'log_call', say: 'Llave, acabo de hablar con Hernán Vélez; quiere vender la finca en diciembre, precio alrededor de dos mil quinientos millones.', does: 'Registra la llamada en el CRM, extrae fecha objetivo y precio, mueve el lead a "visita" y propone la visita de captación.', role: 'broker', confirm: false },
    { intent: 'listing_status', say: 'Llave, ¿cómo va el apartamento de Envigado?', does: 'Lee: 52 días publicado, 21 leads, oferta de COP 815 M pendiente, promesa en preparación.', role: 'owner', confirm: false },
    { intent: 'price_update', say: 'Llave, baja el precio del lote de Tierra Prometida a mil trescientos noventa millones.', does: 'Prepara el cambio en Finca Raíz, Wasi y Metrocuadrado y pide "confirmar" antes de publicar.', role: 'broker', confirm: true },
    { intent: 'send_followup', say: 'Llave, manda seguimiento a los leads del Charlee que no respondieron esta semana.', does: 'Redacta 11 mensajes personalizados (ES/EN) y los deja en la cola de aprobación.', role: 'broker', confirm: true },
    { intent: 'order_service', say: 'Llave, pide fotos y dron para la finca cafetera para el viernes.', does: 'Crea la orden a Estudio Luz Verde, propone paquete Premium y fecha; el fotógrafo acepta desde su app.', role: 'sales_admin', confirm: false },
    { intent: 'publish_listing', say: 'Llave, publica la casa de El Retiro en los tres portales pero no en Instagram.', does: 'Valida campos por portal, publica en Finca Raíz, Wasi y Metrocuadrado; deja Instagram sin marcar.', role: 'sales_admin', confirm: true },
    { intent: 'read_pipeline', say: 'Llave, resumen de mi día.', does: 'Lee agenda, leads calientes, borradores AI por aprobar y comisiones proyectadas del mes.', role: 'broker', confirm: false },
    { intent: 'capture_tour_feedback', say: 'Llave, feedback del tour: le encantó la vista pero la cocina le parece pequeña; le preocupa la administración.', does: 'Transcribe, resume y envía nota al vendedor; sugiere argumentos para la objeción de administración.', role: 'broker', confirm: false },
    { intent: 'document_status', say: 'Llave, ¿qué documentos faltan para la promesa de Esmeraldal?', does: 'Lista: paz y salvo administración (vendedor), avalúo comercial (agencia). Ofrece enviar recordatorio.', role: 'lawyer', confirm: false },
    { intent: 'approve_ai_draft', say: 'Llave, aprueba la contraoferta de la casa de lago y envíala.', does: 'Firma electrónica del borrador AI, envío a la compradora, registro en el expediente del negocio.', role: 'broker', confirm: true },
    { intent: 'rent_status', say: 'Llave, ¿quién no ha pagado el arriendo este mes?', does: 'Lee la cartera: 1 canon atrasado 3 días; ofrece enviar recordatorio amable.', role: 'rental_admin', confirm: false },
    { intent: 'payout_status', say: 'Llave, ¿cuánto tengo pendiente de comisión?', does: 'Lee comisiones aprobadas, en escrow y proyectadas para el mes.', role: 'broker', confirm: false },
    { intent: 'maintenance_ticket', say: 'Llave, se dañó el calentador de la casa de Laureles.', does: 'Abre ticket, propone técnico, notifica a la propietaria y al arrendatario con ventana de visita.', role: 'renter', confirm: false }
  ];

  /* ----------------------------------------------------------- integrations */
  D.integrations = [
    { id: 'fincaRaiz', name: 'Finca Raíz', kind: 'portal', status: 'conectado', lastSync: '2026-09-16T09:40:00-05:00', listings: 12, leads30d: 61 },
    { id: 'wasi', name: 'Wasi', kind: 'portal', status: 'conectado', lastSync: '2026-09-16T09:40:00-05:00', listings: 12, leads30d: 8 },
    { id: 'metrocuadrado', name: 'Metrocuadrado', kind: 'portal', status: 'conectado', lastSync: '2026-09-16T08:10:00-05:00', listings: 10, leads30d: 14 },
    { id: 'instagram', name: 'Instagram / Facebook', kind: 'social', status: 'conectado', lastSync: '2026-09-16T10:02:00-05:00', posts30d: 9, leads30d: 38 },
    { id: 'whatsapp', name: 'WhatsApp Business', kind: 'messaging', status: 'conectado', threads: 214 },
    { id: 'metaAds', name: 'Meta Ads', kind: 'ads', status: 'conectado', spend30d: 3400000 },
    { id: 'googleAds', name: 'Google Ads', kind: 'ads', status: 'conectado', spend30d: 310000 },
    { id: 'esign', name: 'Firma electrónica', kind: 'legal', status: 'conectado', envelopes30d: 6 },
    { id: 'bancolombia', name: 'Bancolombia · cuentas escrow', kind: 'bank', status: 'conectado', balance: 42300000 },
    { id: 'dian', name: 'DIAN · facturación electrónica', kind: 'tax', status: 'pendiente' },
    { id: 'gcal', name: 'Google Calendar', kind: 'calendar', status: 'conectado' }
  ];

  /* ------------------------------------------------------------------ KPIs */
  D.kpis = {
    listingsActive: 10, listingsUnderOffer: 2, pipelineValueCOP: 22300000000, leads30d: 121, toursThisWeek: 9,
    aiDraftsAwaiting: 7, commissionProjectedMonthCOP: 189000000, escrowHeldCOP: 42300000, rentCollectedPct: 94, avgDaysOnMarket: 41
  };

  /* --------------------------------------------------------------- helpers */
  D.fmtCOP = function (n, opts) {
    if (n == null || isNaN(n)) return '—';
    opts = opts || {};
    if (opts.compact) {
      if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toLocaleString('es-CO', { maximumFractionDigits: 2 }).replace(/,$/, '') + ' mil M';
      if (Math.abs(n) >= 1e6) return '$' + Math.round(n / 1e6).toLocaleString('es-CO') + ' M';
    }
    return '$' + Math.round(n).toLocaleString('es-CO');
  };
  D.fmtMoney = function (n, currency, opts) {
    currency = currency || 'COP';
    if (currency === 'COP') return D.fmtCOP(n, opts);
    if (n == null || isNaN(n)) return '—';
    return currency === 'USD' ? 'US$' + Math.round(n).toLocaleString('en-US') : n.toLocaleString('es-CO') + ' ' + currency;
  };
  D.fmtPrice = function (l) {
    var s = D.fmtMoney(l.price, l.currency);
    if (l.operacion === 'arriendo') s += l.priceUnit === 'noche' ? ' / noche' : ' / mes';
    return s;
  };
  D.fmtDate = function (iso, style) {
    if (!iso) return '—';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    if (isNaN(d)) return iso;
    if (style === 'short') return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    if (style === 'long') return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (style === 'time') return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  D.fmtM2 = function (n) { return n == null ? '—' : n.toLocaleString('es-CO') + ' m²'; };
  D.fmtPct = function (n) { return n == null ? '—' : n.toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' %'; };
  D.pricePerM2 = function (l) { return l.area ? Math.round(l.price / l.area) : null; };

  D.byId = function (coll, id) { for (var i = 0; i < coll.length; i++) if (coll[i].id === id) return coll[i]; return null; };
  D.user = function (id) { return D.byId(D.users, id); };
  D.listing = function (id) { return D.byId(D.listings, id); };
  D.role = function (id) { return D.byId(D.roles, id); };
  D.userName = function (id) { var u = D.user(id); return u ? u.name : (id || '—'); };
  D.usersByRole = function (roleId) { return D.users.filter(function (u) { return u.role === roleId; }); };
  D.listingsBy = function (brokerId) { return D.listings.filter(function (l) { return l.listedBy === brokerId; }); };
  D.tasksFor = function (userId) { return D.tasks.filter(function (t) { return t.assignee === userId; }); };
  D.dealsFor = function (userId) {
    return D.deals.filter(function (d) { var p = d.parties || {}; return Object.keys(p).some(function (k) { return p[k] === userId; }) || d.split.some(function (s) { return s.participant === userId; }); });
  };
  D.statusLabel = function (s) { return ({ 'borrador': 'Borrador', 'en preparación': 'En preparación', 'activo': 'Activo', 'bajo oferta': 'Bajo oferta', 'arrendado': 'Arrendado', 'vendido': 'Vendido' })[s] || s; };
  D.typeLabel = function (t) { return ({ apartamento: 'Apartamento', casa: 'Casa', finca: 'Finca', lote: 'Lote', penthouse: 'Penthouse', oficina: 'Oficina', local: 'Local comercial' })[t] || t; };
  D.sourceIcon = function (src) { return ({ 'Instagram': '📸', 'Finca Raíz': '🏠', 'Referido': '🤝', 'Website': '🌐', 'WhatsApp': '💬', 'Meta Ads': '📣' })[src] || '•'; };

  // Compute the payout table for a deal: returns [{participant, name, kind, stage, amount}]
  D.computeSplit = function (deal) {
    var out = [];
    var gross = 0;
    if (deal.kind === 'venta') {
      var price = deal.agreedPrice || deal.offerPrice || deal.askingPrice || 0;
      gross = Math.round(price * (deal.commissionPct || 3) / 100);
    } else if (deal.nightlyRate) {
      gross = Math.round(deal.nightlyRate * 30 * (deal.occupancyPct || 0) / 100); // monthly gross rent
    } else {
      gross = deal.monthlyRent || 0;
    }
    var referral = 0;
    deal.split.forEach(function (s) { if (s.kind === 'referral') referral += s.pct ? gross * s.pct / 100 : (s.amount || 0); });
    deal.split.forEach(function (s) {
      var amt = s.amount != null ? s.amount : 0;
      if (s.pct != null && s.amount == null) {
        var base = (s.kind === 'commission') ? gross - referral : gross;
        amt = Math.round(base * s.pct / 100);
      }
      out.push({ participant: s.participant, name: D.userName(s.participant), kind: s.kind, stage: s.stage, pct: s.pct, amount: amt, note: s.note || '' });
    });
    return { gross: gross, referral: referral, rows: out };
  };

  // Device frames: scale iframe/.screen inside .device-screen to its rendered width.
  D.fitDevices = function (root) {
    root = root || document;
    var frames = root.querySelectorAll('.device');
    if (!frames.length) return;
    function fit(dev) {
      var screen = dev.querySelector('.device-screen'); if (!screen) return;
      var vw = parseFloat(getComputedStyle(dev).getPropertyValue('--vw')) || 1440;
      var w = screen.clientWidth; if (!w) return;
      dev.classList.add('is-fitted');
      dev.style.setProperty('--scale', (w / vw).toFixed(4));
    }
    frames.forEach(fit);
    if (window.ResizeObserver && !D._devRO) {
      D._devRO = new ResizeObserver(function (entries) { entries.forEach(function (e) { fit(e.target.closest('.device')); }); });
    }
    if (D._devRO) frames.forEach(function (f) { var s = f.querySelector('.device-screen'); if (s) D._devRO.observe(s); });
  };

  // Theme toggle helper: cycles system → light → dark, persists per viewer.
  D.setTheme = function (mode) {
    try { if (mode === 'system') { delete document.documentElement.dataset.theme; localStorage.removeItem('llave-theme'); } else { document.documentElement.dataset.theme = mode; localStorage.setItem('llave-theme', mode); } } catch (e) { document.documentElement.dataset.theme = mode === 'system' ? '' : mode; }
  };
  try { var saved = localStorage.getItem('llave-theme'); if (saved) document.documentElement.dataset.theme = saved; } catch (e) {}

  // Simple hash-route parser for /app: #/role/<roleId>/<module>[/<id>]
  D.parseRoute = function (hash) {
    var h = (hash || location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    return { role: parts[1] || 'owner', module: parts[2] || 'home', id: parts[3] || null, raw: h };
  };
  D.routeTo = function (roleId, moduleId, id) { return '#/role/' + roleId + '/' + (moduleId || 'home') + (id ? '/' + id : ''); };

  // Toast helper (uses .toast-stack / .toast from tokens.css)
  D.toast = function (title, body, variant) {
    var stack = document.querySelector('.toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.appendChild(stack); }
    var t = document.createElement('div'); t.className = 'toast' + (variant ? ' toast-' + variant : '');
    t.innerHTML = '<div><b></b><span></span></div>';
    t.querySelector('b').textContent = title; t.querySelector('span').textContent = body || '';
    stack.appendChild(t); setTimeout(function () { t.remove(); }, 4200);
  };

  window.DORUM = D;
})();
