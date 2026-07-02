// ============================================================================
//  Contenido devocional: versículos y planes de lectura.
//  Texto: Reina-Valera 1909 (dominio público) — se puede empaquetar sin
//  problemas de derechos de autor y funciona sin conexión (PWA).
// ============================================================================

// Versículos para el "Versículo del día" (rota de forma determinista por fecha)
export const VERSICULOS = [
  { cita: 'Juan 3:16', texto: 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
  { cita: 'Salmos 23:1', texto: 'Jehová es mi pastor; nada me faltará.' },
  { cita: 'Filipenses 4:13', texto: 'Todo lo puedo en Cristo que me fortalece.' },
  { cita: 'Proverbios 3:5', texto: 'Fíate de Jehová de todo tu corazón, y no estribes en tu prudencia.' },
  { cita: 'Isaías 41:10', texto: 'No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.' },
  { cita: 'Josué 1:9', texto: 'Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en donde quiera que fueres.' },
  { cita: 'Salmos 46:1', texto: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.' },
  { cita: 'Mateo 6:33', texto: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.' },
  { cita: 'Romanos 8:28', texto: 'Y sabemos que á los que á Dios aman, todas las cosas les ayudan á bien, es á saber, á los que conforme al propósito son llamados.' },
  { cita: 'Salmos 37:5', texto: 'Encomienda á Jehová tu camino, y espera en él; y él hará.' },
  { cita: 'Jeremías 29:11', texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.' },
  { cita: 'Salmos 118:24', texto: 'Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.' },
  { cita: 'Mateo 11:28', texto: 'Venid á mí todos los que estáis trabajados y cargados, que yo os haré descansar.' },
  { cita: 'Salmos 27:1', texto: 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?' },
  { cita: 'Isaías 40:31', texto: 'Mas los que esperan á Jehová tendrán nuevas fuerzas; levantarán las alas como águilas, correrán, y no se cansarán, caminarán, y no se fatigarán.' },
  { cita: 'Salmos 121:1-2', texto: 'Alzaré mis ojos á los montes, de donde vendrá mi socorro. Mi socorro viene de Jehová, que hizo los cielos y la tierra.' },
  { cita: 'Deuteronomio 31:6', texto: 'Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos: que Jehová tu Dios es el que va contigo: no te dejará ni te desamparará.' },
  { cita: 'Salmos 34:8', texto: 'Gustad, y ved que es bueno Jehová: dichoso el hombre que confiará en él.' },
  { cita: 'Proverbios 16:3', texto: 'Encomienda á Jehová tus obras, y tus pensamientos serán afirmados.' },
  { cita: 'Nehemías 8:10', texto: 'No os entristezcáis, porque el gozo de Jehová es vuestra fortaleza.' },
  { cita: '2 Timoteo 1:7', texto: 'Porque no nos ha dado Dios el espíritu de temor, sino el de fortaleza, y de amor, y de templanza.' },
  { cita: 'Salmos 55:22', texto: 'Echa sobre Jehová tu carga, y él te sustentará; no dejará para siempre caído al justo.' },
  { cita: 'Isaías 26:3', texto: 'Tú guardarás en completa paz á aquel cuyo pensamiento en ti persevera; porque en ti se ha confiado.' },
  { cita: 'Filipenses 4:19', texto: 'Mi Dios, pues, suplirá todo lo que os falta conforme á sus riquezas en gloria en Cristo Jesús.' },
];

// Nombre de la versión bíblica empaquetada (dominio público)
export const VERSION_BIBLICA = 'Reina-Valera 1909';

// Versículo lema de la app: trabajar como para el Señor (ideal para ventas)
export const LEMA = {
  cita: 'Colosenses 3:23',
  texto: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor, y no para los hombres.',
};

// Bendiciones cortas para el saludo del Dashboard (rotan por día)
export const BENDICIONES = [
  'El gozo de Jehová es tu fortaleza.',
  'Todo lo puedes en Cristo que te fortalece.',
  'Encomienda a Jehová tu camino y él hará.',
  'Esfuérzate y sé valiente; Dios está contigo.',
  'Este es el día que hizo Jehová; gózate en él.',
  'Jehová es tu pastor; nada te faltará.',
  'Fíate de Jehová de todo tu corazón.',
];

// Día del año (1-366) para elegir el versículo de forma estable a lo largo del día
const diaDelAnio = (d) => {
  const inicio = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - inicio) / 86400000);
};

// Devuelve el versículo del día (mismo para todo el día, distinto cada día)
export const versiculoDelDia = (fecha = new Date()) =>
  VERSICULOS[diaDelAnio(fecha) % VERSICULOS.length];

// Bendición corta del día (para el saludo)
export const bendicionDelDia = (fecha = new Date()) =>
  BENDICIONES[diaDelAnio(fecha) % BENDICIONES.length];

// Planes de lectura incluidos. Cada plan tiene días con su cita y texto.
export const PLANES = [
  {
    id: 'promesas',
    titulo: 'Promesas de Dios',
    desc: 'Siete promesas para descansar en su fidelidad.',
    color: 'from-amber-600 to-orange-600',
    dias: [
      { cita: 'Jeremías 29:11', texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.' },
      { cita: 'Isaías 41:10', texto: 'No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré.' },
      { cita: 'Romanos 8:28', texto: 'Y sabemos que á los que á Dios aman, todas las cosas les ayudan á bien.' },
      { cita: 'Filipenses 4:19', texto: 'Mi Dios, pues, suplirá todo lo que os falta conforme á sus riquezas en gloria en Cristo Jesús.' },
      { cita: 'Salmos 37:5', texto: 'Encomienda á Jehová tu camino, y espera en él; y él hará.' },
      { cita: 'Mateo 6:33', texto: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.' },
      { cita: 'Josué 1:9', texto: 'Esfuérzate y sé valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en donde quiera que fueres.' },
    ],
  },
  {
    id: 'confianza',
    titulo: 'Salmos de confianza',
    desc: 'Cinco salmos para afianzar tu fe cada día.',
    color: 'from-sky-600 to-blue-600',
    dias: [
      { cita: 'Salmos 23:1-3', texto: 'Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará yacer: junto á aguas de reposo me pastoreará. Confortará mi alma.' },
      { cita: 'Salmos 27:1', texto: 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?' },
      { cita: 'Salmos 46:1', texto: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.' },
      { cita: 'Salmos 91:1-2', texto: 'El que habita al abrigo del Altísimo, morará bajo la sombra del Omnipotente. Diré yo á Jehová: Esperanza mía, y castillo mío; mi Dios, en él confiaré.' },
      { cita: 'Salmos 121:1-2', texto: 'Alzaré mis ojos á los montes, de donde vendrá mi socorro. Mi socorro viene de Jehová, que hizo los cielos y la tierra.' },
    ],
  },
  {
    id: 'paz',
    titulo: 'Paz en la ansiedad',
    desc: 'Cinco pasajes para calmar el corazón inquieto.',
    color: 'from-emerald-600 to-teal-600',
    dias: [
      { cita: 'Filipenses 4:6-7', texto: 'Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego, con hacimiento de gracias. Y la paz de Dios, que sobrepuja todo entendimiento, guardará vuestros corazones y vuestros entendimientos en Cristo Jesús.' },
      { cita: 'Mateo 11:28', texto: 'Venid á mí todos los que estáis trabajados y cargados, que yo os haré descansar.' },
      { cita: 'Isaías 26:3', texto: 'Tú guardarás en completa paz á aquel cuyo pensamiento en ti persevera; porque en ti se ha confiado.' },
      { cita: '1 Pedro 5:7', texto: 'Echando toda vuestra solicitud en él, porque él tiene cuidado de vosotros.' },
      { cita: 'Juan 14:27', texto: 'La paz os dejo, mi paz os doy: no como el mundo la da, yo os la doy. No se turbe vuestro corazón, ni tenga miedo.' },
    ],
  },
];

export const planPorId = (id) => PLANES.find((p) => p.id === id);
