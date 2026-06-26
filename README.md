# Ventas & GP Coins · Vodafone Captación

Dashboard para agentes de captación (Televenta Outbound) que registra ventas,
calcula GP Coins y hace seguimiento de los incentivos de Vodafone.
**Período cubierto: 1 de junio al 31 de julio de 2026.**

## Características

- **Dashboard**: KPIs (ventas, GP Coins directos, instalaciones activas, clientes
  nuevos), gráfica de puntos/GP por incentivo y resumen de clasificación.
- **Ventas**: alta/edición manual + importación y exportación por **Excel**
  (con plantilla descargable). Campos de cliente: nombre, apellido, fecha de
  venta y fecha de instalación, además de todos los contadores de llaves.
- **GP Coins**: desglose por incentivo, puntos de fibra por convergencia y
  tabla de premios de ranking.
- **Llaves**: progreso en tiempo real de cada requisito por incentivo.
- **Incentivos**: los 6 incentivos (Cliente Nuevo, Xiaomi, Samsung, Honor,
  Motorola, JBL) con mecánica (ranking / directo / mixta+sorteo) y premios.
- **Tarifas**: tabla *Exclusivo 30% · Origen Contrato* (14 columnas de OTT),
  *Promo Flash 1 OTT* y *Mis tarifas* (manual + Excel).
- **Catálogo**: terminales por marca con código SAP, puntos/GP por mes,
  unidades limitadas (stock por familia o por modelo) y marcadores Estrella/Destacado.
- **Selector de mes** (Junio / Julio): recalcula puntos, GP Coins y stock.

Los datos se guardan en el navegador (localStorage); no requiere servidor.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview
```

## Stack

React + Vite · Tailwind CSS · Recharts · SheetJS (xlsx) · Lucide icons.
