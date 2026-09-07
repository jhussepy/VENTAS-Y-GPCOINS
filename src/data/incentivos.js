import { periodoDesdeCampana } from './campanas.js';

// ============================================================================
//  DATOS MAESTROS - INCENTIVO VODAFONE CLIENTE NUEVO / CAPTACIÓN
//  Período: 1 de junio al 31 de julio de 2026 (ambos incluidos)
//  Plataforma: Televenta Outbound - Captación
//  Fuente: bases legales + tablas de puntos suministradas por el agente
// ============================================================================

export const PERIODO = periodoDesdeCampana();

// Contenidos de TV disponibles en paquetes 4P (Fibra + Fijo + Móvil + TV)
export const TV_CONTENIDOS = [
  'Básico',
  'Netflix con anuncios',
  'Netflix Estándar',
  'Netflix Premium',
  'HBO Max',
  'Disney con anuncios',
  'Disney Estándar',
  'Prime',
  'DAZN Fútbol',
  'DAZN Pro',
];

// ---------------------------------------------------------------------------
//  TARIFAS DE FIBRA (puntos por convergencia) — Incentivo Cliente Nuevo
// ---------------------------------------------------------------------------
export const PUNTOS_CONVERGENCIA = [
  { tipo: '4P', velocidad: 'Fibra 1 GB',   junio: 1000, julio: 1000 },
  { tipo: '4P', velocidad: 'Fibra 600 MB', junio: 600,  julio: 600 },
  { tipo: '4P', velocidad: 'Fibra 300 MB', junio: 400,  julio: 400 },
  { tipo: '3P', velocidad: 'Fibra 1 GB',   junio: 300,  julio: 300 },
  { tipo: '3P', velocidad: 'Fibra 600 MB', junio: 200,  julio: 200 },
  { tipo: '3P', velocidad: 'Fibra 300 MB', junio: 100,  julio: 100 },
];

// ---------------------------------------------------------------------------
//  CATÁLOGO DE TERMINALES Y DISPOSITIVOS POR MARCA
//  pts_*  -> puntos de ranking (Xiaomi, Motorola, Cliente Nuevo)
//  gp_*   -> GP Coins directos al monedero (Samsung, Honor, JBL, Motorola directos)
//  uds_*  -> unidades limitadas
//  familia-> agrupación de stock compartido (Samsung)
// ---------------------------------------------------------------------------

export const CATALOGO = {
  xiaomi: {
    marca: 'Xiaomi',
    mecanica: 'ranking',
    stockPor: 'sin-limite',
    productos: [
      { sap: '316512', modelo: 'Xiaomi 17T Black 12GB 256GB',              pts_junio: 3000, pts_julio: 2500, est_junio: true,  est_julio: true, precio: 648, stock: 426 },
      { sap: '316511', modelo: 'Xiaomi 17T Pro Deep Blue 12GB 512GB',      pts_junio: 2500, pts_julio: 2000, est_junio: true,  est_julio: true },
      { sap: '316376', modelo: 'Xiaomi Redmi Note 15 Pro 5G 256GB Black',  pts_junio: 2000, pts_julio: 2000, est_junio: true,  est_julio: true },
      { sap: '316416', modelo: 'Xiaomi Redmi Note 15 Pro+ 5G 256GB Black', pts_junio: 1800, pts_julio: 1800, est_junio: false, est_julio: false },
      { sap: '316375', modelo: 'Xiaomi Redmi Note 15 5G 256GB Black',      pts_junio: 1500, pts_julio: 2000, est_junio: false, est_julio: false },
      { sap: '316114', modelo: 'Xiaomi Redmi 15C 5G 4-256GB Mid. Black',   pts_junio: 1000, pts_julio: 1000, est_junio: true,  est_julio: true },
      { sap: '316273', modelo: 'Xiaomi 17 5G 512GB Black',                 pts_junio: 1000, pts_julio: 300,  est_junio: false, est_julio: false },
      { sap: '316274', modelo: 'Xiaomi 17 Ultra 5G 512GB Black',           pts_junio: 1000, pts_julio: 200,  est_junio: false, est_julio: false },
      { sap: '301339', modelo: 'Xiaomi Smart TV 55 A PRO QLED 2026',       pts_junio: 600,  pts_julio: 1500, est_junio: false, est_julio: false },
      { sap: '301348', modelo: 'Xiaomi Electric Scooter Elite ES',         pts_junio: 400,  pts_julio: 400,  est_junio: false, est_julio: false },
      { sap: '301113', modelo: 'Xiaomi Smart Air Fryer 6.5L White EU',     pts_junio: 300,  pts_julio: 300,  est_junio: false, est_julio: false },
      { sap: '301432', modelo: 'Xiaomi Robot Vacuum S40',                  pts_junio: 300,  pts_julio: 300,  est_junio: false, est_julio: false },
      { sap: '301499', modelo: 'Xiaomi TV 32 A PRO QLED 2026 Dolby DTS-X', pts_junio: 300,  pts_julio: 300,  est_junio: false, est_julio: false },
      { sap: '301258', modelo: 'Xiaomi Vacuum Cleaner G20 EU',             pts_junio: 200,  pts_julio: 200,  est_junio: false, est_julio: false },
      { sap: '301340', modelo: 'Xiaomi Smart TV 65A PRO QLED 2026',        pts_junio: 200,  pts_julio: 400,  est_junio: false, est_julio: false },
      { sap: '301342', modelo: 'Xiaomi Smart TV 75A PRO QLED 2026',        pts_junio: 200,  pts_julio: 200,  est_junio: false, est_julio: false },
      { sap: '301401', modelo: 'Xiaomi Smart TV 43 A PRO QLED 2026',       pts_junio: 150,  pts_julio: 150,  est_junio: false, est_julio: false },
      { sap: '301285', modelo: 'Xiaomi Redmi Watch 5 Black',               pts_junio: 100,  pts_julio: 100,  est_junio: false, est_julio: false },
      { sap: '301491', modelo: 'Xiaomi Redmi Buds 8 Pro Black',            pts_junio: 100,  pts_julio: 100,  est_junio: false, est_julio: false },
      { sap: '301562', modelo: 'Xiaomi Dual Zone Air Fryer 10l',           pts_junio: 100,  pts_julio: 100,  est_junio: false, est_julio: false },
    ],
  },

  samsung: {
    marca: 'Samsung',
    mecanica: 'directo',
    stockPor: 'familia',
    productos: [
      { sap: '316286', modelo: 'Samsung Galaxy S26 5G 512GB Black',        familia: 'S26',       gp_junio: 25, uds_junio: 30,   gp_julio: 25, uds_julio: 30,  est_junio: false, est_julio: false },
      { sap: '316394', modelo: 'Samsung Galaxy S26 5G 256GB Black',        familia: 'S26',       gp_junio: 25, uds_junio: 30,   gp_julio: 25, uds_julio: 30,  est_junio: false, est_julio: false },
      { sap: '316395', modelo: 'Samsung Galaxy S26 5G 256GB White',        familia: 'S26',       gp_junio: 25, uds_junio: 30,   gp_julio: 25, uds_julio: 30,  est_junio: false, est_julio: false },
      { sap: '316396', modelo: 'Samsung Galaxy S26 Plus 5G 512GB Black',   familia: 'S26+',      gp_junio: 28, uds_junio: 20,   gp_julio: 28, uds_julio: 20,  est_junio: false, est_julio: false },
      { sap: '316414', modelo: 'Samsung Galaxy S26 Ultra 5G 512GB Black',  familia: 'S26 Ultra', gp_junio: 35, uds_junio: 100,  gp_julio: 35, uds_julio: 100, est_junio: true,  est_julio: true },
      { sap: '316415', modelo: 'Samsung Galaxy S26 Ultra 5G 512GB Violet', familia: 'S26 Ultra', gp_junio: 35, uds_junio: 100,  gp_julio: 35, uds_julio: 100, est_junio: true,  est_julio: true },
      { sap: '316513', modelo: 'Samsung Galaxy S26 Ultra 5G 256GB Black',  familia: 'S26 Ultra 256', gp_junio: 28, uds_junio: 50, gp_julio: 28, uds_julio: 50, est_junio: true,  est_julio: true },
      { sap: '315792', modelo: 'Samsung Galaxy A56 5G 256GB Black',        familia: 'A56/A57',   gp_junio: 8,  uds_junio: 500,  gp_julio: 8,  uds_julio: 500, est_junio: false, est_julio: false },
      { sap: '316432', modelo: 'Samsung Galaxy A57 5G 256GB Dark Blue',    familia: 'A56/A57',   gp_junio: 8,  uds_junio: 500,  gp_julio: 8,  uds_julio: 500, est_junio: false, est_julio: false },
      { sap: '316112', modelo: 'Samsung Galaxy A17 5G 128GB Black',        familia: 'A17',       gp_junio: 4,  uds_junio: 1000, gp_julio: 4,  uds_julio: 500, est_junio: false, est_julio: false },
      { sap: '316113', modelo: 'Samsung Galaxy A17 5G 256GB Black',        familia: 'A17',       gp_junio: 4,  uds_junio: 1000, gp_julio: 4,  uds_julio: 500, est_junio: false, est_julio: false },
    ],
  },

  honor: {
    marca: 'Honor',
    mecanica: 'directo',
    stockPor: 'modelo',
    productos: [
      { sap: '316351', modelo: 'HONOR Magic 8 Lite 5G 512GB Mid. Black', gp_junio: 14, uds_junio: 300, gp_julio: 14, uds_julio: 300, est_junio: true, est_julio: true },
    ],
  },

  motorola: {
    marca: 'Motorola',
    mecanica: 'mixta', // ranking + directo + sorteo
    stockPor: 'modelo',
    productos: [
      { sap: '316480', modelo: 'Motorola Razr Fold 512GB Black',              pts_junio: 600, pts_julio: 600, est_junio: false, est_julio: false },
      { sap: '316418', modelo: 'Motorola Edge 70 Fusion 5G 256GB Siloute',    pts_junio: 400, pts_julio: 400, est_junio: true,  est_julio: true,  gp_junio: 3, uds_junio: 250, gp_julio: 3, uds_julio: 250 },
      { sap: '316440', modelo: 'Motorola G67 5G 256GB Artic Seal',            pts_junio: 400, pts_julio: 400, est_junio: true,  est_julio: true,  gp_junio: 3, uds_junio: 250, gp_julio: 3, uds_julio: 250 },
      { sap: '316246', modelo: 'Motorola Edge 70 5G 12+512GB Grey',           pts_junio: 350, pts_julio: 350, est_junio: false, est_julio: false },
      { sap: '301702', modelo: 'Motorola Sound Flow Black Speaker',           pts_junio: 200, pts_julio: 200, est_junio: false, est_julio: false },
      { sap: '316123', modelo: 'Motorola G35 5G 256GB Midnight Black',        pts_junio: 200, pts_julio: 200, est_junio: false, est_julio: false },
      { sap: '316404', modelo: 'Motorola G35 5G 128Gb Green',                 pts_junio: 200, pts_julio: 200, est_junio: false, est_julio: false },
      { sap: '301703', modelo: 'Motorola Watch Special Edition 2 straps',     pts_junio: 150, pts_julio: 150, est_junio: false, est_julio: false },
    ],
  },

  jbl: {
    marca: 'JBL',
    mecanica: 'directo',
    stockPor: 'modelo',
    productos: [
      { sap: '301103', modelo: 'JBL Soundbar 2.0 All in One MK2',          gp_junio: 8, uds_junio: 2000, gp_julio: 8, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301458', modelo: 'JBL Buds Live Beam 3 Black',               gp_junio: 6, uds_junio: 2000, gp_julio: 6, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301460', modelo: 'JBL Buds Tour One M3 Black',               gp_junio: 6, uds_junio: 2000, gp_julio: 6, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301185', modelo: 'JBL Headphone Tune 770 Black',             gp_junio: 4, uds_junio: 2000, gp_julio: 4, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301454', modelo: 'JBL Buds Soundgear Clips Ghost Black',     gp_junio: 4, uds_junio: 2000, gp_julio: 4, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301497', modelo: 'JBL Buds Tune Beam 2 Black',               gp_junio: 4, uds_junio: 2000, gp_julio: 4, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301184', modelo: 'JBL Clip 5 Speaker',                       gp_junio: 3, uds_junio: 2000, gp_julio: 3, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301453', modelo: 'JBL Buds Sense Lite Black',                gp_junio: 3, uds_junio: 2000, gp_julio: 3, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301455', modelo: 'JBL Altavoz Grip Black',                   gp_junio: 3, uds_junio: 2000, gp_julio: 3, uds_julio: 2000, est_junio: false, est_julio: false },
      { sap: '301459', modelo: 'JBL Buds Live Flex Black',                 gp_junio: 2, uds_junio: 500,  gp_julio: 2, uds_julio: 500,  est_junio: true,  est_julio: true },
    ],
  },
};

// ---------------------------------------------------------------------------
//  INCENTIVOS: llaves (requisitos) y premios de ranking
// ---------------------------------------------------------------------------
export const INCENTIVOS = {
  clienteNuevo: {
    id: 'clienteNuevo',
    nombre: 'Cliente Nuevo',
    descripcion: 'Suma puntos con cada cliente nuevo (3P o 4P) para llevarte los premios de los mejores del ranking.',
    mecanica: 'ranking',
    catalogo: null,
    llaves: [
      { id: 'clientes34', label: 'Mínimo clientes nuevos 3P y 4P', detalle: '6 ventas y activaciones como mínimo de clientes nuevos 3P y 4P.', objetivo: 6, tipo: 'cantidad' },
      { id: 'portas',     label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'til65',      label: 'Mínimo de ventas líneas TIL65', detalle: '4 ventas como mínimo de líneas TIL65 (en activaciones de clientes nuevos 3P o 4P).', objetivo: 4, tipo: 'cantidad' },
      { id: 'secureNet',  label: 'Mínimo de Activaciones Secure Net', detalle: '6 activaciones como mínimo de Secure Net.', objetivo: 6, tipo: 'cantidad' },
    ],
    premiados: 25,
    premios: [
      { rango: '1º - 5º',   desde: 1,  hasta: 5,  agentes: 5,  gpcoins: 100 },
      { rango: '6º - 15º',  desde: 6,  hasta: 15, agentes: 10, gpcoins: 90 },
      { rango: '16º - 25º', desde: 16, hasta: 25, agentes: 10, gpcoins: 75 },
    ],
  },

  xiaomi: {
    id: 'xiaomi',
    nombre: 'Xiaomi',
    descripcion: 'Ponte en cabeza del ranking con los nuevos Xiaomi 17T, 17T Pro y el resto de dispositivos seleccionados.',
    mecanica: 'ranking',
    catalogo: 'xiaomi',
    llaves: [
      { id: 'clientes',  label: 'Mínimo de clientes nuevos', detalle: '4 venta y activación como mínimo de clientes nuevos.', objetivo: 4, tipo: 'cantidad' },
      { id: 'portas',    label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'disp',      label: 'Mínimo de dispositivos', detalle: '6 venta como mínimo de los dispositivos descritos en bases legales.', objetivo: 6, tipo: 'cantidad' },
      { id: 'secureNet', label: 'Mínimo de Activaciones Secure Net', detalle: '8 activaciones como mínimo de Secure Net.', objetivo: 8, tipo: 'cantidad' },
      { id: 'fibra',     label: 'Ventas y activaciones de Vodafone Fibra', detalle: '8 ventas y activaciones como mínimo de Fibra (neba o fibra).', objetivo: 8, tipo: 'cantidad' },
    ],
    premiados: 30,
    premios: [
      { rango: '1º - 5º',   desde: 1,  hasta: 5,  agentes: 5,  gpcoins: 110 },
      { rango: '6º - 15º',  desde: 6,  hasta: 15, agentes: 10, gpcoins: 100 },
      { rango: '16º - 30º', desde: 16, hasta: 30, agentes: 15, gpcoins: 80 },
    ],
  },

  samsung: {
    id: 'samsung',
    nombre: 'Samsung',
    descripcion: 'Los Samsung Galaxy S26 llegan con GP Coins que van directos a tu monedero por cada venta y activación.',
    mecanica: 'directo',
    catalogo: 'samsung',
    notaStock: 'Ventas limitadas para cada familia según bases legales.',
    llaves: [
      { id: 'clientes',  label: 'Mínimo cliente nuevo', detalle: '4 clientes nuevo como mínimo.', objetivo: 4, tipo: 'cantidad' },
      { id: 'portas',    label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'disp',      label: 'Mínimo de dispositivos', detalle: '6 venta como mínimo de los dispositivos descritos en bases legales.', objetivo: 6, tipo: 'cantidad' },
      { id: 'fibra',     label: 'Ventas y activaciones de Vodafone Fibra', detalle: '8 ventas y activaciones como mínimo de Fibra (neba o fibra).', objetivo: 8, tipo: 'cantidad' },
      { id: 'secureNet', label: 'Mínimo de Activaciones Secure Net', detalle: '8 activaciones como mínimo de Secure Net.', objetivo: 8, tipo: 'cantidad' },
    ],
    premiados: null,
    premios: [],
  },

  honor: {
    id: 'honor',
    nombre: 'Honor',
    descripcion: 'Es todo un Honor… Con el Magic 8 Lite los GP Coins van directamente a tu monedero.',
    mecanica: 'directo',
    catalogo: 'honor',
    notaStock: 'Ventas limitadas por modelo según bases legales.',
    llaves: [
      { id: 'clientes',  label: 'Mínimo cliente nuevo', detalle: '4 clientes nuevos como mínimo.', objetivo: 4, tipo: 'cantidad' },
      { id: 'portas',    label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'disp',      label: 'Mínimo de dispositivos', detalle: '6 venta como mínimo de los dispositivos descritos en bases legales.', objetivo: 6, tipo: 'cantidad' },
      { id: 'secureNet', label: 'Mínimo de Activaciones Secure Net', detalle: '8 activaciones como mínimo de Secure Net.', objetivo: 8, tipo: 'cantidad' },
      { id: 'fibra',     label: 'Ventas y activaciones de Vodafone Fibra', detalle: '8 ventas y activaciones como mínimo de Fibra (neba o fibra).', objetivo: 8, tipo: 'cantidad' },
    ],
    premiados: null,
    premios: [],
  },

  motorola: {
    id: 'motorola',
    nombre: 'Motorola',
    descripcion: 'Gana como quieras: premios directos con los terminales seleccionados, premios por ranking y sorteos. Los dispositivos Estrella dan más ventajas.',
    mecanica: 'mixta',
    catalogo: 'motorola',
    notaStock: 'Ranking + premio directo en destacados + sorteo (bases sorteo aparte).',
    llaves: [
      { id: 'clientes',  label: 'Mínimo de clientes nuevos', detalle: '4 venta y activación como mínimo de clientes nuevos.', objetivo: 4, tipo: 'cantidad' },
      { id: 'portas',    label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'disp',      label: 'Mínimo de dispositivos', detalle: '6 venta como mínimo de los dispositivos descritos en bases legales.', objetivo: 6, tipo: 'cantidad' },
      { id: 'secureNet', label: 'Mínimo de Activaciones Secure Net', detalle: '8 activaciones como mínimo de Secure Net.', objetivo: 8, tipo: 'cantidad' },
      { id: 'fibra',     label: 'Ventas y activaciones de Vodafone Fibra', detalle: '8 ventas y activaciones como mínimo de Fibra (neba o fibra).', objetivo: 8, tipo: 'cantidad' },
    ],
    premiados: 18,
    premios: [
      { rango: '1º - 3º',  desde: 1, hasta: 3,  agentes: 3,  gpcoins: 105 },
      { rango: '4º - 8º',  desde: 4, hasta: 8,  agentes: 5,  gpcoins: 90 },
      { rango: '9º - 18º', desde: 9, hasta: 18, agentes: 10, gpcoins: 75 },
    ],
  },

  jbl: {
    id: 'jbl',
    nombre: 'JBL',
    descripcion: '¡No bajes el ritmo! La lista de dispositivos crece y tienes premios directos con sus ventas y activaciones.',
    mecanica: 'directo',
    catalogo: 'jbl',
    notaStock: 'GP Coins por cada venta y activación de dispositivos JBL referenciados (limitado por modelo).',
    llaves: [
      { id: 'clientes',  label: 'Mínimo de clientes nuevos', detalle: '4 venta y activación como mínimo de clientes nuevos.', objetivo: 4, tipo: 'cantidad' },
      { id: 'portas',    label: 'Mínimo de Portas voz móvil (Individual)', detalle: 'como mínimo de portas de voz', objetivo: 75, tipo: 'porcentaje' },
      { id: 'disp',      label: 'Mínimo de dispositivos', detalle: '6 venta como mínimo de los dispositivos descritos en bases legales.', objetivo: 6, tipo: 'cantidad' },
      { id: 'secureNet', label: 'Mínimo de Activaciones Secure Net', detalle: '8 activaciones como mínimo de Secure Net.', objetivo: 8, tipo: 'cantidad' },
      { id: 'fibra',     label: 'Ventas y activaciones de Vodafone Fibra', detalle: '8 ventas y activaciones como mínimo de Fibra (neba o fibra).', objetivo: 8, tipo: 'cantidad' },
    ],
    premiados: null,
    premios: [],
  },
};

export const ORDEN_INCENTIVOS = ['clienteNuevo', 'xiaomi', 'samsung', 'honor', 'motorola', 'jbl'];

// Helpers de acceso por mes ---------------------------------------------------
export const ptsDe = (prod, mes) => prod[`pts_${mes}`] ?? 0;
export const gpDe = (prod, mes) => prod[`gp_${mes}`] ?? 0;
export const udsDe = (prod, mes) => prod[`uds_${mes}`] ?? 0;
export const estDe = (prod, mes) => prod[`est_${mes}`] ?? false;
export const convPts = (row, mes) => row[mes] ?? 0;
