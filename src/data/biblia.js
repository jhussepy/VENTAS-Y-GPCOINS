// ============================================================================
//  Contenido devocional: versículos y planes de lectura.
//  Texto: Reina-Valera 1909 (dominio público) — se puede empaquetar sin
//  problemas de derechos de autor y funciona sin conexión (PWA).
// ============================================================================

// Versículos para el "Versículo del día" (rota de forma determinista por fecha).
// `pid` = ID de pasaje de API.Bible (para pedir el texto en la versión elegida,
// p. ej. NTV). `texto` = respaldo Reina-Valera 1909 (offline).
export const VERSICULOS = [
  { cita: 'Juan 3:16', pid: 'JHN.3.16', texto: 'Porque de tal manera amó Dios al mundo, que ha dado á su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.' },
  { cita: 'Salmos 23:1', pid: 'PSA.23.1', texto: 'Jehová es mi pastor; nada me faltará.' },
  { cita: 'Filipenses 4:13', pid: 'PHP.4.13', texto: 'Todo lo puedo en Cristo que me fortalece.' },
  { cita: 'Proverbios 3:5', pid: 'PRO.3.5', texto: 'Fíate de Jehová de todo tu corazón, y no estribes en tu prudencia.' },
  { cita: 'Isaías 41:10', pid: 'ISA.41.10', texto: 'No temas, que yo soy contigo; no desmayes, que yo soy tu Dios que te esfuerzo: siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.' },
  { cita: 'Josué 1:9', pid: 'JOS.1.9', texto: 'Mira que te mando que te esfuerces y seas valiente: no temas ni desmayes, porque Jehová tu Dios será contigo en donde quiera que fueres.' },
  { cita: 'Salmos 46:1', pid: 'PSA.46.1', texto: 'Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.' },
  { cita: 'Mateo 6:33', pid: 'MAT.6.33', texto: 'Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas.' },
  { cita: 'Romanos 8:28', pid: 'ROM.8.28', texto: 'Y sabemos que á los que á Dios aman, todas las cosas les ayudan á bien, es á saber, á los que conforme al propósito son llamados.' },
  { cita: 'Salmos 37:5', pid: 'PSA.37.5', texto: 'Encomienda á Jehová tu camino, y espera en él; y él hará.' },
  { cita: 'Jeremías 29:11', pid: 'JER.29.11', texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.' },
  { cita: 'Salmos 118:24', pid: 'PSA.118.24', texto: 'Este es el día que hizo Jehová; nos gozaremos y alegraremos en él.' },
  { cita: 'Mateo 11:28', pid: 'MAT.11.28', texto: 'Venid á mí todos los que estáis trabajados y cargados, que yo os haré descansar.' },
  { cita: 'Salmos 27:1', pid: 'PSA.27.1', texto: 'Jehová es mi luz y mi salvación; ¿de quién temeré? Jehová es la fortaleza de mi vida; ¿de quién he de atemorizarme?' },
  { cita: 'Isaías 40:31', pid: 'ISA.40.31', texto: 'Mas los que esperan á Jehová tendrán nuevas fuerzas; levantarán las alas como águilas, correrán, y no se cansarán, caminarán, y no se fatigarán.' },
  { cita: 'Salmos 121:1-2', pid: 'PSA.121.1-PSA.121.2', texto: 'Alzaré mis ojos á los montes, de donde vendrá mi socorro. Mi socorro viene de Jehová, que hizo los cielos y la tierra.' },
  { cita: 'Deuteronomio 31:6', pid: 'DEU.31.6', texto: 'Esforzaos y cobrad ánimo; no temáis, ni tengáis miedo de ellos: que Jehová tu Dios es el que va contigo: no te dejará ni te desamparará.' },
  { cita: 'Salmos 34:8', pid: 'PSA.34.8', texto: 'Gustad, y ved que es bueno Jehová: dichoso el hombre que confiará en él.' },
  { cita: 'Proverbios 16:3', pid: 'PRO.16.3', texto: 'Encomienda á Jehová tus obras, y tus pensamientos serán afirmados.' },
  { cita: 'Nehemías 8:10', pid: 'NEH.8.10', texto: 'No os entristezcáis, porque el gozo de Jehová es vuestra fortaleza.' },
  { cita: '2 Timoteo 1:7', pid: '2TI.1.7', texto: 'Porque no nos ha dado Dios el espíritu de temor, sino el de fortaleza, y de amor, y de templanza.' },
  { cita: 'Salmos 55:22', pid: 'PSA.55.22', texto: 'Echa sobre Jehová tu carga, y él te sustentará; no dejará para siempre caído al justo.' },
  { cita: 'Isaías 26:3', pid: 'ISA.26.3', texto: 'Tú guardarás en completa paz á aquel cuyo pensamiento en ti persevera; porque en ti se ha confiado.' },
  { cita: 'Filipenses 4:19', pid: 'PHP.4.19', texto: 'Mi Dios, pues, suplirá todo lo que os falta conforme á sus riquezas en gloria en Cristo Jesús.' },
  { cita: 'Proverbios 3:6', pid: 'PRO.3.6', texto: 'Reconócelo en todos tus caminos, y él enderezará tus veredas.' },
  { cita: 'Salmos 91:1', pid: 'PSA.91.1', texto: 'El que habita al abrigo del Altísimo, morará bajo la sombra del Omnipotente.' },
  { cita: 'Salmos 91:2', pid: 'PSA.91.2', texto: 'Diré yo á Jehová: Esperanza mía, y castillo mío; mi Dios, en él confiaré.' },
  { cita: 'Filipenses 4:6', pid: 'PHP.4.6', texto: 'Por nada estéis afanosos; sino sean notorias vuestras peticiones delante de Dios en toda oración y ruego, con hacimiento de gracias.' },
  { cita: 'Filipenses 4:7', pid: 'PHP.4.7', texto: 'Y la paz de Dios, que sobrepuja todo entendimiento, guardará vuestros corazones y vuestros entendimientos en Cristo Jesús.' },
  { cita: 'Juan 14:6', pid: 'JHN.14.6', texto: 'Jesús le dice: Yo soy el camino, y la verdad, y la vida: nadie viene al Padre, sino por mí.' },
  { cita: 'Juan 14:27', pid: 'JHN.14.27', texto: 'La paz os dejo, mi paz os doy: no como el mundo la da, yo os la doy. No se turbe vuestro corazón, ni tenga miedo.' },
  { cita: '1 Pedro 5:7', pid: '1PE.5.7', texto: 'Echando toda vuestra solicitud en él, porque él tiene cuidado de vosotros.' },
  { cita: 'Mateo 5:16', pid: 'MAT.5.16', texto: 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras, y glorifiquen á vuestro Padre que está en los cielos.' },
  { cita: 'Salmos 119:105', pid: 'PSA.119.105', texto: 'Lámpara es á mis pies tu palabra, y lumbrera á mi camino.' },
  { cita: 'Romanos 12:2', pid: 'ROM.12.2', texto: 'Y no os conforméis á este siglo; mas reformaos por la renovación de vuestro entendimiento, para que experimentéis cuál sea la buena voluntad de Dios, agradable y perfecta.' },
  { cita: 'Romanos 8:31', pid: 'ROM.8.31', texto: '¿Qué pues diremos á esto? Si Dios por nosotros, ¿quién contra nosotros?' },
  { cita: 'Salmos 46:10', pid: 'PSA.46.10', texto: 'Estad quietos, y conoced que yo soy Dios.' },
  { cita: 'Gálatas 2:20', pid: 'GAL.2.20', texto: 'Con Cristo estoy juntamente crucificado, y vivo, no ya yo, mas vive Cristo en mí.' },
  { cita: 'Efesios 2:8', pid: 'EPH.2.8', texto: 'Porque por gracia sois salvos por la fe; y esto no de vosotros, pues es don de Dios.' },
  { cita: 'Colosenses 3:23', pid: 'COL.3.23', texto: 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor, y no para los hombres.' },
  { cita: 'Proverbios 18:10', pid: 'PRO.18.10', texto: 'Torre fuerte es el nombre de Jehová: á él correrá el justo, y será levantado.' },
  { cita: 'Salmos 145:18', pid: 'PSA.145.18', texto: 'Cercano está Jehová á todos los que le invocan, á todos los que le invocan de veras.' },
  { cita: 'Isaías 43:2', pid: 'ISA.43.2', texto: 'Cuando pasares por las aguas, yo seré contigo; y por los ríos, no te anegarán.' },
  { cita: 'Salmos 28:7', pid: 'PSA.28.7', texto: 'Jehová es mi fortaleza y mi escudo: en él esperó mi corazón, y fuí ayudado.' },
  { cita: 'Mateo 28:20', pid: 'MAT.28.20', texto: 'Y he aquí, yo estoy con vosotros todos los días, hasta el fin del mundo.' },
  { cita: 'Juan 8:12', pid: 'JHN.8.12', texto: 'Yo soy la luz del mundo: el que me sigue, no andará en tinieblas, mas tendrá la lumbre de la vida.' },
  { cita: 'Salmos 16:8', pid: 'PSA.16.8', texto: 'A Jehová he puesto siempre delante de mí: porque está á mi diestra, no seré conmovido.' },
  { cita: 'Proverbios 4:23', pid: 'PRO.4.23', texto: 'Sobre toda cosa guardada guarda tu corazón; porque de él mana la vida.' },
  { cita: 'Romanos 15:13', pid: 'ROM.15.13', texto: 'Y el Dios de esperanza os llene de todo gozo y paz creyendo, para que abundéis en esperanza por la virtud del Espíritu Santo.' },
  { cita: '1 Corintios 10:13', pid: '1CO.10.13', texto: 'No os ha tomado tentación, sino humana: mas fiel es Dios, que no os dejará ser tentados más de lo que podéis llevar.' },
  { cita: 'Salmos 103:2', pid: 'PSA.103.2', texto: 'Bendice, alma mía, á Jehová, y no olvides ninguno de sus beneficios.' },
  { cita: 'Santiago 1:5', pid: 'JAS.1.5', texto: 'Y si alguno de vosotros tiene falta de sabiduría, demándela á Dios, el cual da á todos abundantemente, y no zahiere; y le será dada.' },
  { cita: 'Mateo 7:7', pid: 'MAT.7.7', texto: 'Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá.' },
  { cita: 'Salmos 62:1', pid: 'PSA.62.1', texto: 'En Dios solamente está callada mi alma: de él viene mi salud.' },
  { cita: 'Isaías 41:13', pid: 'ISA.41.13', texto: 'Porque yo Jehová soy tu Dios, que te sostengo de tu mano derecha, y te digo: No temas, yo te ayudé.' },
  { cita: 'Salmos 32:8', pid: 'PSA.32.8', texto: 'Te haré entender, y te enseñaré el camino en que debes andar: sobre ti fijaré mis ojos.' },
  { cita: 'Proverbios 16:9', pid: 'PRO.16.9', texto: 'El corazón del hombre piensa su camino: mas Jehová endereza sus pasos.' },
  { cita: 'Juan 15:5', pid: 'JHN.15.5', texto: 'Yo soy la vid, vosotros los pámpanos: el que está en mí, y yo en él, éste lleva mucho fruto; porque sin mí nada podéis hacer.' },
  { cita: 'Salmos 51:10', pid: 'PSA.51.10', texto: 'Crea en mí, oh Dios, un corazón limpio; y renueva un espíritu recto dentro de mí.' },
  { cita: 'Lamentaciones 3:22-23', pid: 'LAM.3.22-LAM.3.23', texto: 'Es por la misericordia de Jehová que no somos consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana: grande es tu fidelidad.' },
  { cita: 'Miqueas 6:8', pid: 'MIC.6.8', texto: 'Oh hombre, él te ha declarado qué sea lo bueno: solamente hacer juicio, y amar misericordia, y humillarte para andar con tu Dios.' },
  { cita: 'Salmos 34:17', pid: 'PSA.34.17', texto: 'Claman los justos, y Jehová oye, y los libra de todas sus angustias.' },
  { cita: 'Hebreos 11:1', pid: 'HEB.11.1', texto: 'Es, pues, la fe la sustancia de las cosas que se esperan, la demostración de las cosas que no se ven.' },
  { cita: 'Hebreos 13:8', pid: 'HEB.13.8', texto: 'Jesucristo es el mismo ayer, y hoy, y por los siglos.' },
  { cita: 'Salmos 37:4', pid: 'PSA.37.4', texto: 'Pon asimismo tu delicia en Jehová, y él te dará las peticiones de tu corazón.' },
  { cita: 'Isaías 40:29', pid: 'ISA.40.29', texto: 'El da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.' },
  { cita: 'Salmos 147:3', pid: 'PSA.147.3', texto: 'El sana á los quebrantados de corazón, y liga sus heridas.' },
  { cita: 'Juan 16:33', pid: 'JHN.16.33', texto: 'Estas cosas os he hablado, para que en mí tengáis paz. En el mundo tendréis aflicción: mas confiad, yo he vencido al mundo.' },
  { cita: 'Romanos 5:8', pid: 'ROM.5.8', texto: 'Mas Dios encarece su caridad para con nosotros, porque siendo aún pecadores, Cristo murió por nosotros.' },
  { cita: '2 Corintios 5:17', pid: '2CO.5.17', texto: 'De modo que si alguno está en Cristo, nueva criatura es: las cosas viejas pasaron; he aquí todas son hechas nuevas.' },
  { cita: '2 Corintios 12:9', pid: '2CO.12.9', texto: 'Y me ha dicho: Bástate mi gracia; porque mi potencia en la flaqueza se perfecciona.' },
  { cita: 'Gálatas 6:9', pid: 'GAL.6.9', texto: 'No nos cansemos, pues, de hacer bien; que á su tiempo segaremos, si no hubiéremos desmayado.' },
  { cita: 'Efesios 3:20', pid: 'EPH.3.20', texto: 'Y á Aquel que es poderoso para hacer todas las cosas mucho más abundantemente de lo que pedimos ó entendemos, según la potencia que obra en nosotros.' },
  { cita: 'Filipenses 1:6', pid: 'PHP.1.6', texto: 'Estando confiado de esto, que el que comenzó en vosotros la buena obra, la perfeccionará hasta el día de Jesucristo.' },
  { cita: 'Colosenses 3:15', pid: 'COL.3.15', texto: 'Y la paz de Dios gobierne en vuestros corazones, á la cual asimismo sois llamados en un cuerpo; y sed agradecidos.' },
  { cita: '1 Tesalonicenses 5:16-18', pid: '1TH.5.16-1TH.5.18', texto: 'Estad siempre gozosos. Orad sin cesar. Dad gracias en todo; porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.' },
  { cita: 'Santiago 1:2-3', pid: 'JAS.1.2-JAS.1.3', texto: 'Hermanos míos, tened por sumo gozo cuando cayereis en diversas tentaciones; sabiendo que la prueba de vuestra fe obra paciencia.' },
  { cita: '1 Pedro 5:10', pid: '1PE.5.10', texto: 'Mas el Dios de toda gracia, que nos ha llamado á su gloria eterna por Jesucristo, él os perfeccione, confirme, corrobore y establezca.' },
  { cita: '1 Juan 4:19', pid: '1JN.4.19', texto: 'Nosotros le amamos á él, porque él nos amó primero.' },
  { cita: 'Apocalipsis 21:4', pid: 'REV.21.4', texto: 'Y limpiará Dios toda lágrima de los ojos de ellos; y la muerte no será más; y no habrá más llanto, ni clamor, ni dolor.' },
  { cita: 'Salmos 30:5', pid: 'PSA.30.5', texto: 'Porque un momento será su furor; mas en su voluntad está la vida: por la tarde durará el lloro, y á la mañana vendrá la alegría.' },
  { cita: 'Salmos 56:3', pid: 'PSA.56.3', texto: 'En el día que temo, yo en ti confío.' },
  { cita: 'Salmos 138:8', pid: 'PSA.138.8', texto: 'Jehová cumplirá por mí: tu misericordia, oh Jehová, es para siempre; no dejarás la obra de tus manos.' },
  { cita: 'Proverbios 22:6', pid: 'PRO.22.6', texto: 'Instruye al niño en su carrera: aun cuando fuere viejo no se apartará de ella.' },
  { cita: 'Isaías 55:8', pid: 'ISA.55.8', texto: 'Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dijo Jehová.' },
  { cita: 'Jeremías 33:3', pid: 'JER.33.3', texto: 'Clama á mí, y te responderé, y te enseñaré cosas grandes y dificultosas que tú no sabes.' },
  { cita: 'Mateo 6:34', pid: 'MAT.6.34', texto: 'Así que, no os congojéis por el día de mañana; que el día de mañana traerá su fatiga: basta al día su afán.' },
  { cita: 'Lucas 1:37', pid: 'LUK.1.37', texto: 'Porque ninguna cosa es imposible para Dios.' },
  { cita: 'Hechos 20:35', pid: 'ACT.20.35', texto: 'Acordaos de las palabras del Señor Jesús, que dijo: Más bienaventurada cosa es dar que recibir.' },
  { cita: 'Salmos 100:4', pid: 'PSA.100.4', texto: 'Entrad por sus puertas con reconocimiento, por sus atrios con alabanza: alabadle, bendecid su nombre.' },
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
