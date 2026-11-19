// =====================================================================
//  DATOS: hablantes, fundadores (poemas del libro de MAF), objetos, duelos
// =====================================================================
'use strict';
const SPEAKERS = {
  mg: { name: 'MG', img: 'mg', bg: '#ffd8e4', color: '#d85a8a' },
  nemo: { name: 'Nemo', img: 'nemo', bg: '#d8f4ff', color: '#3a9ab0' },
  tio: { name: 'Tío', sprite: 'tio', bg: '#d8d0e8', color: '#5a4a7a' },
  mama: { name: 'Mamá', sprite: 'mama', bg: '#e0ecff', color: '#4a7ab0' },
  papa: { name: 'Papá', sprite: 'papa', bg: '#e0f4e0', color: '#4a8a4a' },
  max: { name: 'Max', sprite: 'max', bg: '#fff0c0', color: '#d8902a' },
  mateo: { name: 'Don Mateo', img: 'mateo', bg: '#dfe6ff', color: '#2a3566' },
  salas: { name: 'Manuel de Salas', img: 'salas', bg: '#f4e6d0', color: '#8c6a48' },
  javiera: { name: 'Doña Javiera', img: 'javiera', bg: '#ffe2d8', color: '#c85a3c' },
  jmcarrera: { name: 'José Miguel Carrera', img: 'jmcarrera', bg: '#dff0e0', color: '#2f6a3d' },
  agueda: { name: 'Doña Águeda', img: 'agueda', bg: '#ece0f8', color: '#7a4aa0' },
  luisa: { name: 'Doña Luisa', img: 'luisa', bg: '#ffe0ea', color: '#d06078' },
  paula: { name: 'Doña Paula', img: 'paula', bg: '#e0f4e0', color: '#2f803d' },
  rodriguez: { name: 'Manuel Rodríguez', img: 'rodriguez', bg: '#e0e0ec', color: '#26242c' },
  cornelia: { name: 'María Cornelia', img: 'cornelia', bg: '#fff0f0', color: '#c03a3a' },
  freire: { name: 'Ramón Freire', img: 'freire', bg: '#dfe6ff', color: '#1e2a52' },
  ohiggins: { name: 'Bernardo O\'Higgins', img: 'ohiggins', bg: '#ffe6dc', color: '#c8553a' },
  portales: { name: 'Diego Portales', img: 'portales', bg: '#e8e8ee', color: '#22222a' },
  jinete: { name: 'Jinete misterioso', mystery: true, bg: '#3a3a5a', color: '#2a4a9a' },
  isabel: { name: 'Doña Isabel', sprite: 'isabel', bg: '#ece6f4', color: '#5a4a6a' },
  sanmartin: { name: 'José de San Martín', sprite: 'sanmartin', bg: '#dfe6ff', color: '#22306a' },
  vecino: { name: 'Vecino', sprite: 'vecino', bg: '#f0e8dc' }, vecino2: { name: 'Vecino', sprite: 'vecino2', bg: '#e8eef4' }, vecina: { name: 'Vecina', sprite: 'vecina', bg: '#e6eef8' }, vecina2: { name: 'Señora', sprite: 'vecina2', bg: '#ece8ec' },
  huaso: { name: 'Huaso', sprite: 'huaso', bg: '#fbe8d8' }, vendedora: { name: 'Vendedora', sprite: 'vendedora', bg: '#fbe8d8', color: '#a8603a' }, vendedor: { name: 'Vendedor', sprite: 'huaso', bg: '#fbe8d8', color: '#a8603a' },
  nino: { name: 'Niño', sprite: 'nino', bg: '#f8f0d8' }, nina: { name: 'Niña', sprite: 'nina', bg: '#e8f8d8' }, fraile: { name: 'Fraile', sprite: 'fraile', bg: '#f0e4d4' },
  guardia: { name: 'Guardia', sprite: 'guardia', bg: '#dfe6ff', color: '#2a4a9a' }, realista: { name: 'Soldado realista', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' },
  sargento: { name: 'Sargento realista', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' }, patriota: { name: 'Soldado patriota', sprite: 'patriota', bg: '#dfe6ff', color: '#2a4a9a' },
  marino: { name: 'Marinero', sprite: 'marino', bg: '#e0f0ff', color: '#2a4a9a' }, olvido: { name: 'El Olvido', sprite: 'olvido', bg: '#2a2040', color: '#5a3a8a' }
};
// Los 12 fundadores del libro «Pequeños Patriotas: Nuestros fundadores» (poemas de Miguel Ángel Fernández)
const FOUNDERS = [
  { id: 'mateo', name: 'Mateo de Toro y Zambrano', short: 'Don Mateo', years: '1727 – 1811', medal: 'Medalla de la Primera Junta',
    poem: ['Este pequeño y elegante fundador una simpática peluca ocupó.', 'Siempre preocupado de la gente, instruyó una reunión urgente.', 'Y así, en el gran salón, a todos nuestros queridos líderes juntó.', 'Todavía celebramos ese primer paso en la creación de la nueva nación.', '¡Allí está sentado! Este pequeño fundador da instrucciones de lado a lado.'],
    fact: 'Presidió la Primera Junta de Gobierno el 18 de septiembre de 1810. ¡Tenía 83 años!', lesson: 'A veces hay que ser valiente y dar el primer paso.' },
  { id: 'salas', name: 'Manuel de Salas', short: 'Manuel de Salas', years: '1754 – 1841', medal: 'Medalla del Saber',
    poem: ['Este pequeño y educado fundador con mucha pasión trabajó.', 'Con su pluma y sabiduría en el diario más importante de la época colaboró.', 'La libertad fue eternamente su mayor pasión, y de puño y letra la aplicó.', 'Siempre un paso más adelante, ¡este destacado educador a todos emocionó!', '¡De la Biblioteca fue primer Director! Este pequeño fundador siempre nos educó.'],
    fact: 'Fue el primer Director de la Biblioteca Nacional desde 1818. La Biblioteca se creó el 19 de agosto de 1813.', lesson: 'La libertad sin educación es como tener llaves sin saber leer las direcciones.' },
  { id: 'javiera', name: 'Javiera Carrera', short: 'Javiera Carrera', years: '1781 – 1862', medal: 'Medalla de la Primera Bandera',
    poem: ['Esta pequeña y apasionada fundadora nuestra primera bandera nos dio.', 'Azul, blanco y amarillo fueron los colores que ella eligió.', 'De gran belleza y ambición, fue el estandarte de la nueva nación.', 'Nadie la supera cabalgando a caballo, en El Monte fue su pasión.', '¡De frente a nuestra gente! Esta pequeña fundadora amor nos entregó.'],
    fact: 'Bordó con coraje y pasión la primera bandera de Chile en el año 1812.', lesson: 'La patria es como el hogar más grande: la tierra y su gente.' },
  { id: 'jmcarrera', name: 'José Miguel Carrera', short: 'José Miguel', years: '1785 – 1821', medal: 'Medalla del Valor',
    poem: ['Este pequeño e intrépido fundador una vida llena de aventuras eligió.', 'Recorrió el mundo en barco y muchos amigos él encontró.', 'Volvió a su patria querida, a todos igualdad nos entregó.', 'Desde allí dirigió a nuestro ejército, pero en Rancagua se tumbó.', '¡Ahí sobre el caballo! Este pequeño fundador jamás se rindió.'],
    fact: 'Se transformó en el General en Jefe del Ejército de Chile en 1813.', lesson: 'Los valientes se levantan una vez más de las que se caen.' },
  { id: 'agueda', name: 'Águeda Monasterio', short: 'Águeda', years: 'Santiago · tiempos de la Reconquista', medal: 'Medalla de la Pluma',
    poem: ['Esta pequeña y tenaz fundadora nos reunió en grandes tertulias.', 'En las tardes, en las noches, a todos sentó alrededor.', 'Su exquisita pluma entregó noticias por montón.', 'Una verdadera heroína que con su actuar dio libertad a la nación.', '¡Ahí valiente y fuerte! Esta pequeña fundadora tenazmente nos apoyó.'],
    fact: 'Reunió a patriotas en su hogar y ayudó a la independencia.', lesson: 'Las palabras también pueden defender la libertad.' },
  { id: 'luisa', name: 'Luisa Recabarren', short: 'Luisa', years: 'De La Serena · tiempos de la Reconquista', medal: 'Medalla de la Tertulia',
    poem: ['Esta pequeña y hábil fundadora a tiempos complejos se enfrentó.', 'Con enorme tesón ocupó sus habilidades en favor de su pasión.', 'Desde La Serena en todo Chile su valentía se sintió.', 'En la gran anfitriona de la nueva nación se convirtió.', '¡Nadie mejor que ella! Esta pequeña fundadora nuestra libertad nos regaló.'],
    fact: 'Sabios consejos entregó a los patriotas en el salón de su casa.', lesson: 'Abrir tu casa y escuchar también es una forma de ayudar.' },
  { id: 'paula', name: 'Paula Jaraquemada', short: 'Paula', years: '1768 – 1851', medal: 'Medalla del Refugio',
    poem: ['Esta pequeña y caritativa fundadora el afecto popular se ganó.', 'Recibiendo a todo quien lo necesitase en la hacienda del rincón.', 'Pronto todos la aclamaban, pues por las calles a la gente apoyó.', 'Nadie nunca se atrevió a enfrentarla, su inteligencia siempre triunfó.', '¡Mírenla tan tenaz! Esta pequeña fundadora es ejemplo vivo de la nación.'],
    fact: 'Salvó con valentía y coraje al ejército patriota en 1818.', lesson: 'La libertad también la ganan los que cuidan a los demás.' },
  { id: 'rodriguez', name: 'Manuel Rodríguez', short: 'M. Rodríguez', years: '1785 – 1818', medal: 'Medalla del Ingenio',
    poem: ['Este pequeño y audaz fundador de elegante negro se vistió.', 'Cabalgando por los campos, el país visitó y recorrió.', 'Nadie quiso más a su tierra que este hombre de gran corazón.', 'Entre sus amigos y seguidores, siempre causó gran pasión.', '¡Escondido bajo la higuera! Este pequeño fundador fue un campeón.'],
    fact: 'Se disfrazó de fraile para luchar por la libertad durante la Reconquista Española.', lesson: 'El valor no está en no tener miedo, sino en mirarlo a los ojos y seguir.' },
  { id: 'cornelia', name: 'María Cornelia Olivares', short: 'Cornelia', years: 'De Chillán · tiempos de la Independencia', medal: 'Medalla de la Voz',
    poem: ['Esta pequeña fundadora fue la mejor hija de nuestro barrio.', 'Desde Chillán nos entregó el espíritu que siempre se necesitó.', 'Pues cuando quisieron dejarla en casa, ella decidió pasar horas en la plaza.', 'Y gracias a su valerosa acción, en Chile nadie jamás sucumbió.', '¡Allí sobre esa banca! Esta pequeña fundadora nuestra alma alentó.'],
    fact: 'Se paró en el centro de la plaza de Chillán a defender la libertad de Chile.', lesson: 'Alzar la voz por lo justo da ánimo a todo un pueblo.' },
  { id: 'freire', name: 'Ramón Freire', short: 'Ramón Freire', years: '1787 – 1851', medal: 'Medalla de Maipú',
    poem: ['Este pequeño y bigotón fundador toda su vida dedicó a la nación.', 'De norte a sur y en cualquier lado, siempre tuvo la bandera a su costado.', 'Gran amante de las tradiciones, jamás dejó su bigote caer.', 'El respeto siempre ganó pues gran valentía demostró.', '¡Mírenlo ahí sobre la lancha! Este pequeño fundador nuestra patria defendió.'],
    fact: 'Fue un actor relevante en el gran triunfo de Maipú de 1818.', lesson: 'Trabajando juntos hasta el final se logran los grandes sueños.' },
  { id: 'ohiggins', name: 'Bernardo O\'Higgins', short: 'O\'Higgins', years: '1778 – 1842', medal: 'Medalla del Libertador',
    poem: ['Este pequeño y colorín fundador en nuestro gran líder se convirtió.', 'Siempre abrazando su querida bandera en el viejo Maipú triunfó.', 'Y así la alegría de la gente por todo el país pronto se sintió.', 'De la educación y del futuro desde entonces se preocupó.', '¡Gran amante de nuestra tierra! Este pequeño fundador «Viva Chile» exclamó.'],
    fact: 'Nació en Chillán y fue Director Supremo de Chile entre 1817 y 1823.', lesson: 'A veces amar significa saber dar un paso al costado.' },
  { id: 'portales', name: 'Diego Portales', short: 'D. Portales', years: '1793 – 1837', medal: 'Medalla de la República',
    poem: ['Este pequeño y hábil fundador a nuestro país organizó.', 'Siempre firme y elocuente, su tradición se respetó.', 'Hombre de pocas palabras, buscó sin cesar el bien para nuestra gente.', 'Si era cosa de mirar ese peinado tan sugerente.', '¡Mírenlo leyendo! Este pequeño fundador parece siempre risueño.'],
    fact: 'Ayudó a consolidar la República de Chile como ministro y pensador.', lesson: 'Una casa ordenada, con reglas claras, dura mucho tiempo.' }
];
const ERA_NAMES = { hoy: 'Hoy, en casa', '1810': 'Santiago, 1810', '1814': 'La Alameda, 1814', '1816': 'La Reconquista, 1816', '1817': 'Chillán, 1817', '1818': 'Maipú, 1818', '1823': 'Santiago, 1823', '1832': 'Valparaíso, 1832' };
const ITEMS = {
  libro: { name: 'Libro «Nuestros fundadores»', icon: 'bigbook', desc: 'El regalo del tío. Tiene un dibujo y un poema de cada fundador. ¡Ábrelo con M o el botón LIBRO!' },
  bitacora: { name: 'Bitácora del tío', icon: 'logbook', desc: 'Mapas antiguos y notas secretas con la letra desordenada del tío.' },
  agua: { name: 'Botella de agua', icon: 'bottle', desc: 'Agua fresca. Por si da sed en el pasado.', food: true },
  manzana: { name: 'Manzana', icon: 'apple', desc: 'Una manzana roja y crujiente. ¡Ñami!', food: true },
  dulce: { name: 'Dulce colonial', icon: 'candy', col: '#f05a6a', desc: 'Un dulce de la Colonia. Recupera el ánimo en un Duelo de Ideas.', food: true },
  miel: { name: 'Dulce de miel', icon: 'candy', col: '#e8a030', desc: 'Regalo de doña Javiera. Dulce y calentito.', food: true },
  alfajor: { name: 'Alfajor de miel', icon: 'candy', col: '#d8a060', desc: '«Los más ricos de todo Santiago». Uno es para Nemo.', food: true },
  chocolate: { name: 'Chocolate «pólvora del destino»', icon: 'choco', desc: 'Chocolate caliente en taza de greda. Receta secreta de espía.', food: true },
  invitacion: { name: 'Invitación al Cabildo', icon: 'letter', desc: 'Una esquela de don Mateo para la gran reunión del 18 de septiembre.' },
  libro_salas: { name: 'Libro de Manuel de Salas', icon: 'book', col: '#8a2a30', desc: 'Un libro que Nemo desordenó. Hay que devolverlo.' },
  tela_azul: { name: 'Tela azul', icon: 'cloth', col: '#2a5ab8', desc: 'Azul como el cielo.' },
  tela_blanca: { name: 'Tela blanca', icon: 'cloth', col: '#f4f4f4', desc: 'Blanca como las nubes (o la nieve de la cordillera).' },
  tela_amarilla: { name: 'Tela amarilla', icon: 'cloth', col: '#f4c430', desc: 'Amarilla como el sol.' },
  carta: { name: 'Carta secreta', icon: 'letter', desc: 'Una carta de doña Águeda para doña Luisa. ¡Que no la vean los soldados!' },
  capa: { name: 'Capa de espía', icon: 'cape', desc: 'Regla número uno de un espía: un buen disfraz.' },
  bandera: { name: 'Bandera de Freire', icon: 'flag', desc: 'La bandera de la estrella solitaria, creada en 1817.' },
  collar: { name: 'Collar de Nemo', icon: 'collar', desc: 'Con la más alta tecnología. Lo hicieron MG y su mamá.' },
  pelota: { name: 'Pelota de Nemo', icon: 'candy', col: '#e84a4a', desc: 'La pelota favorita de Nemo.' }
};
// Notas de la bitácora del tío (aparecen según avanza la historia)
const TIO_NOTES = [
  { cond: 'tiene_libro', text: 'Cada fundador que conozcas firmará su página. Dicen que cuando el libro está completo, pasan cosas mágicas.' },
  { cond: 'llego_1810', text: 'La casa de don Mateo está cerca de la Plaza de Armas. Hoy hay una reunión urgente en el Cabildo.' },
  { cond: 'medalla_salas', text: 'Javiera Carrera vivía cerca de la Alameda. Busca una casa con jardín grande y telas de colores. Año: 1814.' },
  { cond: 'medalla_jmcarrera', text: 'Manuel Rodríguez, el espía más astuto de Chile. Buscar durante la Reconquista española, 1814-1817.' },
  { cond: 'llego_1816', text: 'Si buscas a alguien que no quiere ser encontrado, busca primero a quienes lo ayudan.' },
  { cond: 'medalla_luisa', text: 'Al sur de Santiago está la hacienda de doña Paula. Sal de la ciudad por el camino del sur.' },
  { cond: 'medalla_rodriguez', text: 'Chillán, 1817: allí nació Bernardo. Una dama valiente habla en la plaza.' },
  { cond: 'medalla_cornelia', text: 'Maipú, 5 de abril de 1818. El ejército patriota acampa en el llano.' },
  { cond: 'medalla_freire', text: 'Si buscas a quien gobierna el país, sigue el sonido del piano. Santiago, 1823.' },
  { cond: 'medalla_ohiggins', text: 'Valparaíso, 1832. Un hombre de pocas palabras ordena la casa de la República.' },
  { cond: 'doce_medallas', text: '¡El libro está completo! La nave ya puede llevarlos de vuelta a casa.' }
];
// Duelos de Ideas
const OPPONENTS = {
  dudoso: { name: 'Vecino Dudoso', sprite: 'vecino2', hp: 3, sky: '#e8d8b8', sky2: '#f8ecd8', ground: '#c8a878',
    intro: '¡El Vecino Dudoso quiere un Duelo de Ideas!', taunt: '¿Gobernarnos nosotros mismos? ¡Eso es una locura, niñita! Demuéstrame que entendiste.', lose: 'Mmm… tienes razón. ¡Iré a la reunión a escuchar con atención!',
    questions: [
      { q: '¿Quién está prisionero y no puede dar órdenes desde España?', a: ['El rey de España', 'El Papa', 'El virrey del Perú', 'Un pirata'], ok: 'El rey fue capturado por los franceses de Napoleón.' },
      { q: '¿Por qué es difícil seguir esperando órdenes desde España?', a: ['Está lejísimos y las cartas tardan meses', 'Porque no hay papel', 'Porque el rey no sabe escribir', 'Porque llueve mucho'], ok: 'Las noticias cruzaban el océano en barco.' },
      { q: '¿En qué se parece aprender a gobernarse a aprender a nadar?', a: ['Da miedo, pero se aprende practicando', 'Hay que usar flotadores siempre', 'Solo pueden los peces', 'Es imposible'], ok: 'Al principio nos equivocamos, pero con esfuerzo se aprende.' },
      { q: '¿Quién llamó a los vecinos a la reunión urgente?', a: ['Don Mateo de Toro y Zambrano', 'Diego Portales', 'Napoleón', 'El panadero'], ok: 'Don Mateo convocó al Cabildo abierto.' },
      { q: 'En 1810, ¿cómo se consideraban los que vivían aquí?', a: ['Españoles de estas tierras', 'Chilenos', 'Argentinos', 'Marcianos'], ok: '«Chilenos» llegaría años después.' }
    ] },
  temeroso: { name: 'Don Temeroso', sprite: 'vecino', hp: 3, sky: '#c8d8f0', sky2: '#eaf0f8', ground: '#b8c890',
    intro: '¡Don Temeroso quiere un Duelo de Ideas!', taunt: 'Los soldados nos van a retar si escuchamos a doña Cornelia… ¿Para qué arriesgarse?', lose: '¡Tienes razón, pequeña! Iré a la plaza a escucharla.',
    questions: [
      { q: '¿Qué es la patria, según doña Javiera?', a: ['El hogar más grande: la tierra y su gente', 'Solo un edificio de gobierno', 'Un dulce muy caro', 'Un barco'], ok: 'Montañas, valles, ríos… ¡y nuestra gente!' },
      { q: '¿Qué le enseñó su papá a José Miguel Carrera?', a: ['Los valientes se levantan una vez más de las que se caen', 'Nunca hay que salir de casa', 'Los valientes nunca se caen', 'Mejor rendirse rápido'], ok: 'Caerse no importa: lo importante es levantarse.' },
      { q: '¿Qué hacían doña Águeda y doña Luisa en sus casas?', a: ['Reunían patriotas y pasaban noticias', 'Vendían empanadas', 'Escondían caballos del rey', 'Jugaban a la pelota'], ok: '¡Las tertulias también ayudaron a la libertad!' },
      { q: '¿Dónde se preparaba el ejército para volver a Chile?', a: ['Al otro lado de la cordillera', 'En la Luna', 'En España', 'En una isla'], ok: 'En Mendoza, junto a José de San Martín.' },
      { q: '¿Cómo se llama la valentía de seguir aunque tengas miedo?', a: ['Valor', 'Flojera', 'Hambre', 'Sueño'], ok: 'El valor no es no tener miedo, sino seguir adelante.' }
    ] },
  repaso: { name: 'Sargento Repaso', sprite: 'patriota', hp: 4, sky: '#a8d0ff', sky2: '#e8f4ff', ground: '#c8d878',
    intro: '¡El Sargento Repaso quiere un Duelo de Ideas!', taunt: '¡Alto! Nadie ve al general sin saberse la historia. ¡A ver, recluta MG!', lose: '¡Aprobada con honores, recluta! Pase usted.',
    questions: [
      { q: '¿En qué año se formó la Primera Junta de Gobierno?', a: ['1810', '1492', '1910', '2010'], ok: 'El 18 de septiembre de 1810.' },
      { q: '¿Qué colores tenía la primera bandera de doña Javiera?', a: ['Azul, blanco y amarillo', 'Rojo y negro', 'Verde y blanco', 'Morado y naranjo'], ok: '¡Cielo, nubes y sol!' },
      { q: '¿Qué pasó en Rancagua en 1814?', a: ['Los patriotas fueron derrotados', 'Se creó la bandera', 'Se fundó Valparaíso', 'Nevó chocolate'], ok: 'Fue un desastre… pero no se rindieron.' },
      { q: '¿Cómo volvió el Ejército de los Andes a Chile?', a: ['Cruzando la cordillera nevada', 'En avión', 'En tren', 'Nadando'], ok: '¡Con mucho frío y mucho valor!' },
      { q: '¿Quién se disfrazaba para engañar a los soldados realistas?', a: ['Manuel Rodríguez', 'Don Mateo', 'Diego Portales', 'Nemo'], ok: '¡De fraile, de vendedor y hasta de abuelita!' },
      { q: '¿Cuándo se creó la bandera de la estrella solitaria?', a: ['En 1817', 'En 1810', 'En 1990', 'Nunca'], ok: 'El 18 de octubre de 1817.' }
    ] },
  olvido: { name: 'El Olvido', sprite: 'olvido', hp: 8, boss: true, music: 'final', sky: '#2a2048', sky2: '#4a3a78', ground: '#3a3060',
    intro: '¡Las páginas del libro se borran! ¡EL OLVIDO aparece!', taunt: 'Ji, ji… Si nadie los recuerda, tus fundadores se borrarán del libro para siempre. ¿Te acuerdas de ellos?', lose: '¡Nooo! Mientras una niña los recuerde… ¡no puedo borrarlos!',
    questions: [
      { q: '¿Quién presidió la Primera Junta de Gobierno en 1810?', a: ['Mateo de Toro y Zambrano', 'Diego Portales', 'Ramón Freire', 'Manuel Rodríguez'] },
      { q: '¿Quién soñaba con escuelas y dirigió la Biblioteca Nacional?', a: ['Manuel de Salas', 'José Miguel Carrera', 'Bernardo O\'Higgins', 'Ramón Freire'] },
      { q: '¿Quién bordó la primera bandera de Chile?', a: ['Javiera Carrera', 'Paula Jaraquemada', 'Luisa Recabarren', 'Águeda Monasterio'] },
      { q: '¿Quién trajo la noticia de Rancagua y nunca se rindió?', a: ['José Miguel Carrera', 'Manuel de Salas', 'Diego Portales', 'Mateo de Toro'] },
      { q: '¿Quién escribía con su pluma noticias para los patriotas?', a: ['Águeda Monasterio', 'Javiera Carrera', 'María Cornelia Olivares', 'Paula Jaraquemada'] },
      { q: '¿Quién llegó desde La Serena y recibía patriotas en su salón?', a: ['Luisa Recabarren', 'Águeda Monasterio', 'Javiera Carrera', 'Paula Jaraquemada'] },
      { q: '¿Quién defendió sus caballos y escondía patriotas en su hacienda?', a: ['Paula Jaraquemada', 'Luisa Recabarren', 'María Cornelia Olivares', 'Javiera Carrera'] },
      { q: '¿Quién era el espía de los mil disfraces?', a: ['Manuel Rodríguez', 'Ramón Freire', 'Bernardo O\'Higgins', 'Manuel de Salas'] },
      { q: '¿Quién alzó la voz en la plaza de Chillán?', a: ['María Cornelia Olivares', 'Águeda Monasterio', 'Paula Jaraquemada', 'Luisa Recabarren'] },
      { q: '¿Quién, con su gran bigote, luchó en Maipú?', a: ['Ramón Freire', 'Mateo de Toro', 'Diego Portales', 'Manuel de Salas'] },
      { q: '¿Quién dejó el mando de Chile en 1823 por amor a su patria?', a: ['Bernardo O\'Higgins', 'José Miguel Carrera', 'Ramón Freire', 'Diego Portales'] },
      { q: '¿Quién ordenó la «casa» de la República como ministro?', a: ['Diego Portales', 'Manuel Rodríguez', 'Bernardo O\'Higgins', 'Mateo de Toro'] }
    ],
    onHit(hp) { const msgs = ['¡Una página vuelve a brillar!', '¡Los colores vuelven al libro!', '¡Las firmas reaparecen!', '¡El Olvido se debilita!']; return { text: msgs[hp % msgs.length] }; } }
};
const CREDITS = [
  { t: 'MG y los Fundadores', s: 20, b: 1, c: '#ffe680' }, { t: 'El juego', s: 12 }, { t: '' }, { img: 'logo' }, { t: '' }, { t: '' }, { t: '' }, { t: '' },
  { t: 'Basado en la serie y los libros', s: 10, c: '#b8c8f0' }, { t: '«Pequeños Patriotas»', s: 14, b: 1 }, { t: '' },
  { t: 'Historia y poemas', s: 10, c: '#b8c8f0' }, { t: 'Miguel Ángel Fernández', s: 13, b: 1 }, { t: '' },
  { t: 'Ilustraciones de los personajes', s: 10, c: '#b8c8f0' }, { t: 'Rafael Fernández', s: 13, b: 1 }, { t: '' },
  { t: 'Los fundadores', s: 10, c: '#b8c8f0' }, ...FOUNDERS.map(f => ({ t: f.name, s: 11 })), { t: '' },
  { t: 'Y el mejor detective de cuatro patas', s: 10, c: '#b8c8f0' }, { t: 'Nemo', s: 14, b: 1 }, { t: '' }, { t: '' },
  { t: '«La libertad es como una plantita', s: 11, c: '#ffe680' }, { t: 'que hay que regar todos los días.»', s: 11, c: '#ffe680' }, { t: '' }, { t: '¡Viva Chile!', s: 16, b: 1 }, { t: '' }, { t: '' }, { t: 'FIN', s: 18, b: 1, c: '#ffe680' }
];
