# Ventas & GP Coins · Vodafone + Lowi

Dashboard para agentes de captación (Televenta Outbound) que registra ventas,
calcula GP Coins, sigue los incentivos de Vodafone y, de forma independiente,
hace seguimiento de las ventas de **Lowi**.
**Período de incentivos cubierto: 1 de junio al 31 de julio de 2026.**

## Características

### Vodafone (GP Coins)
- **Dashboard**: KPIs (ventas, GP Coins directos, instalaciones activas, clientes
  nuevos), gráfica de puntos/GP por incentivo, resumen de clasificación y
  proyección/ritmo del mes.
- **Ventas**: alta/edición manual + importación y exportación por **Excel**
  (con plantilla descargable y deduplicación contra lo ya guardado). Datos de
  cliente: nombre, apellido, DNI/NIE, teléfono, email, dirección, nº de pedido,
  fechas y todos los contadores de llaves. Buscador por cliente.
- **GP Coins / Llaves / Incentivos**: desglose por incentivo, progreso de llaves
  y premios de ranking (Cliente Nuevo, Xiaomi, Samsung, Honor, Motorola, JBL).
- **Tarifas** y **Catálogo** de terminales con stock por familia/modelo.

### Lowi (seguimiento, sin GP Coins)
- Mundo independiente accesible desde el **conmutador Vodafone / Lowi**.
- **Dashboard Lowi**: KPIs por estado, facturación activa, tasas de
  activación/baja y motivos de baja.
- **Ventas Lowi**: alta/edición, cambio rápido de estado, filtro por mes,
  buscador e import/export/plantilla Excel.
- Estados: pendiente, activa, dada de baja, cancelada.

### Plataforma
- **Login con Google** (Firebase Auth) y **sincronización en la nube**
  (Cloud Firestore) en tiempo real entre dispositivos.
- **Datos privados por usuario**: cada agente solo ve los suyos.
- **Panel de Supervisor** (solo administradores): ranking del equipo, KPIs de
  Vodafone y Lowi, y drill-down por agente.
- **Modo claro/oscuro** persistido en la nube.
- **Copia de seguridad** export/import en JSON (en el menú lateral).
- **PWA**: instalable y con respuesta offline básica.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview
npm test         # tests del motor de cálculo (Vitest)
npm run lint     # análisis estático de JavaScript/JSX
npm run check    # lint + tests + build, igual que CI
```

## Firebase

- Autenticación: proveedor Google habilitado y dominios autorizados configurados.
- Firestore: reglas en [`firestore.rules`](./firestore.rules). El correo admin se
  define tanto ahí como en `src/lib/admin.js`.
- El acceso al documento de cada usuario está encapsulado en
  `src/repositories/userDataRepository.js`; el esquema almacenado sigue siendo
  compatible con los datos existentes.

## Campañas

La campaña comercial se declara de forma versionada en `src/data/campanas.js`.
Cada mes relaciona un identificador persistido con su valor ISO `YYYY-MM`; esto
mantiene compatibles las ventas antiguas de junio/julio y evita asignar fechas
de campañas futuras al mes de junio. Para añadir una campaña, crea su entrada
en `CAMPANAS`, actualiza `CAMPANA_ACTIVA_ID` y aporta sus tablas comerciales.

## Stack

React + Vite · Tailwind CSS · Recharts · SheetJS (xlsx) · Firebase
(Auth + Firestore) · Lucide icons.
