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
  sanbruno: { name: 'Capitán San Bruno', img: 'sanbruno', sprite: 'sanbruno', bg: '#f0d8d8', color: '#7a1a22' },
  osorio: { name: 'Mariano Osorio', img: 'osorio', sprite: 'osorio', bg: '#fbe0e0', color: '#c8202a' },
  marco: { name: 'Marcó del Pont', img: 'marco', sprite: 'marco', bg: '#f4e0f0', color: '#a0508a' },
  espiritu: { name: 'Espíritu Realista', img: 'espiritu', sprite: 'espiritu', bg: '#3a1020', color: '#7a1a2a' },
  sargento: { name: 'Sargento de Talavera', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' },
  pregonero: { name: 'Pregonero', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' },
  sanmartin: { name: 'José de San Martín', sprite: 'sanmartin', bg: '#dfe6ff', color: '#22306a' },
  arriero: { name: 'Arriero', sprite: 'huaso', bg: '#fbe8d8', color: '#7a4a28' }, herrero: { name: 'Herrero', sprite: 'vecino', bg: '#e8e8f0', color: '#3a3a4a' },
  vecino: { name: 'Vecino', sprite: 'vecino', bg: '#f0e8dc' }, vecino2: { name: 'Vecino', sprite: 'vecino2', bg: '#e8eef4' }, vecina: { name: 'Vecina', sprite: 'vecina', bg: '#e6eef8' }, vecina2: { name: 'Señora', sprite: 'vecina2', bg: '#ece8ec' },
  huaso: { name: 'Huaso', sprite: 'huaso', bg: '#fbe8d8' }, vendedora: { name: 'Vendedora', sprite: 'vendedora', bg: '#fbe8d8', color: '#a8603a' }, vendedor: { name: 'Vendedor', sprite: 'huaso', bg: '#fbe8d8', color: '#a8603a' },
  nino: { name: 'Niño', sprite: 'nino', bg: '#f8f0d8' }, nina: { name: 'Niña', sprite: 'nina', bg: '#e8f8d8' }, fraile: { name: 'Fraile', sprite: 'fraile', bg: '#f0e4d4' },
  guardia: { name: 'Guardia', sprite: 'guardia', bg: '#dfe6ff', color: '#2a4a9a' }, realista: { name: 'Soldado realista', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' },
  sargento: { name: 'Sargento realista', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' }, patriota: { name: 'Soldado patriota', sprite: 'patriota', bg: '#dfe6ff', color: '#2a4a9a' },
  sgt_talavera: { name: 'Sargento de Talavera', sprite: 'realista', bg: '#fbe0e0', color: '#c8202a' }, corona: { name: '¿¿¿???', mystery: true, bg: '#2a1030', color: '#8a3ab0' },
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
  invitacion: { name: 'Esquela de invitación', icon: 'letter', desc: 'Una esquela de convite de don Mateo para el Cabildo abierto del 18 de septiembre, en el Real Consulado.' },
  libro_salas: { name: 'Libro de Manuel de Salas', icon: 'book', col: '#8a2a30', desc: 'Un libro que Nemo desordenó. Hay que devolverlo.' },
  tela_azul: { name: 'Tela azul', icon: 'cloth', col: '#2a5ab8', desc: 'Azul como el cielo.' },
  tela_blanca: { name: 'Tela blanca', icon: 'cloth', col: '#f4f4f4', desc: 'Blanca como las nubes (o la nieve de la cordillera).' },
  tela_amarilla: { name: 'Tela amarilla', icon: 'cloth', col: '#f4c430', desc: 'Amarilla como el sol.' },
  carta: { name: 'Carta secreta', icon: 'letter', desc: 'Una carta de doña Águeda para doña Luisa. ¡Que no la vean los soldados!' },
  capa: { name: 'Capa de espía', icon: 'cape', desc: 'Regla número uno de un espía: un buen disfraz.' },
  bandera: { name: 'Bandera de Freire', icon: 'flag', desc: 'La bandera de la estrella solitaria, creada en 1817.' },
  collar: { name: 'Collar de Nemo', icon: 'collar', desc: 'Con la más alta tecnología. Lo hicieron MG y su mamá.' },
  herraduras: { name: 'Herraduras', icon: 'collar', col: '#8a8a98', desc: 'Recién hechas por el herrero del campamento de Mendoza.' },
  pelota: { name: 'Pelota de Nemo', icon: 'candy', col: '#e84a4a', desc: 'La pelota favorita de Nemo.' }
};
// Notas de la bitácora del tío (aparecen según avanza la historia)
const TIO_NOTES = [
  { cond: 'tiene_libro', text: 'Cada fundador que conozcas firmará su página. Dicen que cuando el libro está completo, pasan cosas mágicas.' },
  { cond: 'llego_1810', text: 'La casa de don Mateo está cerca de la Plaza de Armas. Hoy hay una reunión urgente, un Cabildo abierto, en el Real Consulado.' },
  { cond: 'medalla_salas', text: 'Javiera Carrera vivía cerca de la Alameda. Busca una casa con jardín grande y telas de colores. Año: 1814.' },
  { cond: 'medalla_jmcarrera', text: 'Manuel Rodríguez, el espía más astuto de Chile. Buscar durante la Reconquista española, 1814-1817.' },
  { cond: 'llego_1816', text: 'Si buscas a alguien que no quiere ser encontrado, busca primero a quienes lo ayudan.' },
  { cond: 'medalla_luisa', text: 'Al sur de Santiago está la hacienda de doña Paula. Sal de la ciudad por el camino del sur.' },
  { cond: 'medalla_rodriguez', text: 'Chillán, 1817: allí nació Bernardo. Una dama valiente habla en la plaza.' },
  { cond: 'medalla_cornelia', text: 'Maipú, 5 de abril de 1818. El ejército patriota acampa en el llano.' },
  { cond: 'medalla_freire', text: 'Si buscas a quien gobierna el país, sigue el sonido del piano. Santiago, 1823.' },
  { cond: 'medalla_ohiggins', text: 'Valparaíso, 1832. Un hombre de pocas palabras ordena la casa de la República.' },
  { cond: 'doce_medallas', text: 'Cerro Huelén, el Mirador del Tiempo. Te espero en la cumbre.' }
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
      { q: 'En 1810, ¿cómo se anotaba en los registros a quien nacía aquí?', a: ['Español, natural de esta tierra', 'Chileno', 'Argentino', 'Peruano'], ok: 'Desde un decreto de 1818 se escribió «chileno».' }
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
      { q: '¿Qué pasó en Rancagua en 1814?', a: ['Los patriotas fueron derrotados', 'Se creó la bandera', 'Se fundó Valparaíso', 'Llegó el primer tren'], ok: 'Fue un desastre… pero no se rindieron.' },
      { q: '¿Cómo volvió el Ejército de los Andes a Chile?', a: ['Cruzando la cordillera nevada', 'En barcos por el Estrecho', 'Por el desierto de Atacama', 'Nadando'], ok: '¡Con mucho frío y mucho valor!' },
      { q: '¿Quién se disfrazaba para engañar a los soldados realistas?', a: ['Manuel Rodríguez', 'Don Mateo', 'Diego Portales', 'Nemo'], ok: '¡De fraile, de vendedor y hasta de abuelita!' },
      { q: '¿Cuándo se creó la bandera de la estrella solitaria?', a: ['En 1817', 'En 1810', 'En 1990', 'Nunca'], ok: 'El 18 de octubre de 1817.' }
    ] },
  olvido: { name: 'El Olvido', sprite: 'olvido', hp: 8, boss: true, music: 'final', sky: '#2a2048', sky2: '#4a3a78', ground: '#3a3060',
    intro: '¡Las páginas del libro se borran! ¡EL OLVIDO aparece!', taunt: 'Ji, ji… Si nadie los recuerda, tus fundadores se borrarán del libro para siempre. ¿Te acuerdas de ellos?', lose: '¡Nooo! Mientras una niña los recuerde… ¡no puedo borrarlos!',
    questions: [
      { q: '¿Quién presidió la Primera Junta de Gobierno en 1810?', a: ['Mateo de Toro y Zambrano', 'Diego Portales', 'Ramón Freire', 'Manuel Rodríguez'], ok: 'Era el Conde de la Conquista y tenía más de 80 años.' },
      { q: '¿Quién soñaba con escuelas y dirigió la Biblioteca Nacional?', a: ['Manuel de Salas', 'José Miguel Carrera', 'Bernardo O\'Higgins', 'Ramón Freire'], ok: 'Decía que la libertad necesita educación.' },
      { q: '¿Quién bordó la primera bandera de Chile?', a: ['Javiera Carrera', 'Paula Jaraquemada', 'Luisa Recabarren', 'Águeda Monasterio'], ok: 'Azul, blanco y amarillo, en 1812.' },
      { q: '¿Quién trajo la noticia de Rancagua y nunca se rindió?', a: ['José Miguel Carrera', 'Manuel de Salas', 'Diego Portales', 'Mateo de Toro'], ok: 'Después de Rancagua cruzó la cordillera hacia Mendoza.' },
      { q: '¿Quién escribía con su pluma noticias para los patriotas?', a: ['Águeda Monasterio', 'Javiera Carrera', 'María Cornelia Olivares', 'Paula Jaraquemada'], ok: 'Escribía de noche a los patriotas de Mendoza.' },
      { q: '¿Quién llegó desde La Serena y recibía patriotas en su salón?', a: ['Luisa Recabarren', 'Águeda Monasterio', 'Javiera Carrera', 'Paula Jaraquemada'], ok: 'Por no entregar unas cartas, la encerraron en un convento.' },
      { q: '¿Quién defendió sus caballos y escondía patriotas en su hacienda?', a: ['Paula Jaraquemada', 'Luisa Recabarren', 'María Cornelia Olivares', 'Javiera Carrera'], ok: 'Su hacienda estaba en Paine.' },
      { q: '¿Quién era el espía de los mil disfraces?', a: ['Manuel Rodríguez', 'Ramón Freire', 'Bernardo O\'Higgins', 'Manuel de Salas'], ok: 'Se disfrazaba de fraile, de huaso y de vendedor.' },
      { q: '¿Quién alzó la voz en la plaza de Chillán?', a: ['María Cornelia Olivares', 'Águeda Monasterio', 'Paula Jaraquemada', 'Luisa Recabarren'], ok: 'La castigaron en la plaza y no agachó la cabeza.' },
      { q: '¿Quién, con su gran bigote, luchó en Maipú?', a: ['Ramón Freire', 'Mateo de Toro', 'Diego Portales', 'Manuel de Salas'], ok: 'Años después también fue Director Supremo.' },
      { q: '¿Quién dejó el mando de Chile en 1823 por amor a su patria?', a: ['Bernardo O\'Higgins', 'José Miguel Carrera', 'Ramón Freire', 'Diego Portales'], ok: 'Fue el 28 de enero de 1823, en el Real Consulado.' },
      { q: '¿Quién ordenó la «casa» de la República como ministro?', a: ['Diego Portales', 'Manuel Rodríguez', 'Bernardo O\'Higgins', 'Mateo de Toro'], ok: 'Quería reglas claras y cuentas claras.' }
    ],
    onHit(hp) { const msgs = ['¡Una página vuelve a brillar!', '¡Los colores vuelven al libro!', '¡Las firmas reaparecen!', '¡El Olvido se debilita!']; return { text: msgs[hp % msgs.length] }; } }
};
// Poderes de las medallas (combates 2.0). Cada uno se usa una vez por duelo.
const POWERS = [
  { id: 'junta', medal: 'mateo', name: 'Junta', fx: 'dmg', col: '#e8c050', desc: 'Los vecinos te apoyan en coro: baja 1 de DUDA al rival.', say: '¡Cuatrocientos vecinos aplauden tu idea! La DUDA del rival baja.' },
  { id: 'saber', medal: 'salas', name: 'Saber', fx: 'fifty', col: '#a0d0ff', desc: 'Don Manuel te presta un libro: la pregunta queda con 2 respuestas.', say: 'Un libro de don Manuel se abre solo… ¡quedan solo dos respuestas!' },
  { id: 'bandera', medal: 'javiera', name: 'Bandera', fx: 'double', col: '#4a7ad8', desc: 'La bandera de doña Javiera flamea: el próximo acierto vale doble.', say: '¡La bandera azul, blanca y amarilla flamea! El próximo acierto vale doble.' },
  { id: 'levantarse', medal: 'jmcarrera', name: 'Levantarse', fx: 'heal', col: '#f08040', desc: 'Los valientes se levantan: recuperas todo el ánimo.', say: '«Los valientes se levantan una vez más de las que se caen». ¡Ánimo al máximo!' },
  { id: 'pluma', medal: 'agueda', name: 'Pluma', fx: 'fifty', col: '#c8a0ff', desc: 'Una carta secreta trae la respuesta: quedan 2 opciones.', say: 'Una carta secreta de doña Águeda trae una pista: ¡quedan dos respuestas!' },
  { id: 'melodia', medal: 'luisa', name: 'Melodía', fx: 'calm', col: '#ff9ac8', desc: 'La guitarra de doña Luisa calma al rival: pierde su próximo turno.', say: 'Suena la guitarra de doña Luisa… El rival se calma y perderá su turno.' },
  { id: 'refugio', medal: 'paula', name: 'Refugio', fx: 'shield', col: '#8cdcff', desc: '«Yo sola mando aquí»: un escudo bloquea los próximos 2 ataques.', say: '«¡Yo sola mando aquí!» Un escudo te protege de los próximos dos ataques.' },
  { id: 'disfraz', medal: 'rodriguez', name: 'Disfraz', fx: 'dodge', col: '#c8a060', desc: 'Un disfraz de Manuel Rodríguez: esquivas el próximo ataque.', say: 'MG se pone un disfraz de abuelita… ¡Esquivará el próximo ataque!' },
  { id: 'voz', medal: 'cornelia', name: 'Voz', fx: 'dmg', col: '#ff6a6a', desc: 'Hablas fuerte y claro, como doña Cornelia: baja 1 de DUDA.', say: '¡MG habla fuerte y claro, como doña Cornelia! La DUDA del rival baja.' },
  { id: 'carga', medal: 'freire', name: 'Carga', fx: 'double', col: '#d84a4a', desc: '¡Adelante como en Maipú!: el próximo acierto vale doble.', say: '¡Adelante, como en Maipú! El próximo acierto vale doble.' },
  { id: 'generosidad', medal: 'ohiggins', name: 'Generosidad', fx: 'healshield', col: '#ffe060', desc: 'Pensar en los demás da fuerza: ánimo al máximo y un escudo.', say: 'Pensar en los demás da fuerza: ánimo al máximo y un escudo.' },
  { id: 'orden', medal: 'portales', name: 'Orden', fx: 'calm', col: '#a0a0c8', desc: 'Ordenas tus ideas con calma: el rival pierde su próximo turno.', say: 'MG ordena sus ideas, una por una… El rival se queda sin argumentos por un turno.' }
];

// Preguntas por época (fuente: Memoria Chilena; ver fuentes/memoria_chilena.md)
const Q_1814 = [
  { q: '¿Quién defendió Rancagua en octubre de 1814?', a: ['Bernardo O\'Higgins', 'Diego Portales', 'Mateo de Toro', 'Napoleón'], ok: 'Resistió cerca de 33 horas.' },
  { q: '¿Qué les cortaron los realistas a los sitiados de Rancagua?', a: ['La acequia que daba agua', 'Los árboles de la plaza', 'El camino a Santiago', 'Las campanas de la iglesia'], ok: 'Sin agua, la defensa se hizo muy difícil.' },
  { q: '¿Qué colores tenía la bandera de la Patria Vieja?', a: ['Azul, blanco y amarillo', 'Rojo y verde', 'Negro y morado', 'Solo blanco'], ok: 'Según la tradición, la idea fue de doña Javiera.' },
  { q: '¿Cuál fue el primer periódico de Chile?', a: ['La Aurora de Chile', 'El Mercurio', 'La Gaceta del Rey', 'El Diario del Mapocho'], ok: 'Su primer número salió el 13 de febrero de 1812.' },
  { q: '¿Adónde se fueron los patriotas después de Rancagua?', a: ['A Mendoza, cruzando la cordillera', 'A la Isla de Pascua', 'A España', 'A Brasil'], ok: 'Desde allí prepararían el regreso.' }
];
const Q_1816 = [
  { q: '¿Quién gobierna Chile en 1816, en nombre del Rey?', a: ['Marcó del Pont', 'Bernardo O\'Higgins', 'Diego Portales', 'Mateo de Toro'], ok: 'Fue gobernador desde diciembre de 1815.' },
  { q: '¿Qué necesitaba un vecino para alejarse más de seis leguas de Santiago?', a: ['Un pasaporte', 'Un caballo blanco', 'Una invitación', 'Nada'], ok: 'Lo exigía un bando de noviembre de 1814.' },
  { q: '¿Cómo se llama el regimiento realista que vigila Santiago?', a: ['Talavera', 'Granaderos', 'Los Andes', 'Los Pehuenches'], ok: 'Los Talaveras llegaron desde España.' },
  { q: '¿Adónde desterraron a Manuel de Salas y a otros patriotas?', a: ['A la isla Juan Fernández', 'A Chiloé', 'A Mendoza', 'A Lima'], ok: 'Vivieron en cuevas del cerro.' },
  { q: '¿Qué ofrecía el bando de Marcó del Pont contra Manuel Rodríguez?', a: ['Una recompensa por atraparlo', 'Un premio de canto', 'Un caballo', 'Una medalla para él'], ok: 'Y prohibía darle alojamiento.' },
  { q: '¿Qué hacía doña Águeda Monasterio de noche?', a: ['Escribía cartas a los patriotas de Mendoza', 'Hacía empanadas', 'Cuidaba ovejas', 'Bailaba en el palacio'], ok: 'Mandaba noticias a los emigrados.' },
  { q: '¿Qué mandaba el toque de queda?', a: ['Volver a casa temprano en la noche', 'Tocar la campana', 'Comer a las doce', 'Cantar el himno'], ok: 'Las calles quedaban vacías y vigiladas.' }
];
// Preguntas del Cruce de los Andes (todo se enseña en Mendoza y en la cordillera antes del duelo)
const Q_ANDES = [
  { q: '¿Quién era el general del Ejército de los Andes?', a: ['José de San Martín', 'Mariano Osorio', 'Diego Portales', 'Mateo de Toro'], ok: 'Lo preparó en Mendoza.' },
  { q: '¿Cuántas mulas salieron de Mendoza?', a: ['Casi diez mil', 'Unas cien', 'Unas veinte', 'Un millón'], ok: 'Salieron 9.821 y llegaron 4.330.' },
  { q: '¿En cuántas columnas cruzó el ejército la cordillera?', a: ['En seis', 'En una sola', 'En cien', 'En ninguna'], ok: 'Por distintos pasos entre Copiapó y Talca.' },
  { q: '¿Qué sintió O\'Higgins en el paso del Espinacito?', a: ['Un frío intensísimo', 'Mucho calor', 'Olor a flores', 'Ganas de bañarse'], ok: 'Les dio comida y abrigo a sus soldados.' },
  { q: '¿Qué sonaba día y noche en el campamento de Mendoza?', a: ['Los yunques de los herreros', 'Las campanas de la catedral', 'Los barcos del puerto', 'Los violines del teatro'], ok: 'Se hacían herraduras, armas y mucho más.' },
  { q: '¿Cuántos soldados tenía el Ejército de los Andes?', a: ['Unos 4.000', 'Unos 40', 'Unos 400', 'Un millón'], ok: 'Con arrieros y ayudantes eran más de 5.000 personas.' }
];
const Q_1817 = [
  { q: '¿Dónde triunfó el Ejército de los Andes el 12 de febrero de 1817?', a: ['En Chacabuco', 'En Rancagua', 'En Maipú', 'En Valparaíso'], ok: 'Dos días después entró a Santiago.' },
  { q: '¿Cuántas mulas salieron de Mendoza para cruzar los Andes?', a: ['Casi diez mil', 'Unas cien', 'Ninguna', 'Un millón'], ok: 'Salieron 9.821 y llegaron 4.330.' },
  { q: '¿Quién cruzó los Andes junto a O\'Higgins?', a: ['José de San Martín', 'Diego Portales', 'Marcó del Pont', 'Mateo de Toro'], ok: 'Juntos dirigieron el Ejército de los Andes.' },
  { q: '¿Quién fue nombrado Director Supremo el 16 de febrero de 1817?', a: ['Bernardo O\'Higgins', 'Marcó del Pont', 'Mariano Osorio', 'Mateo de Toro'], ok: 'Lo eligió un cabildo abierto, después de Chacabuco.' },
  { q: '¿En qué ciudad nació Bernardo O\'Higgins?', a: ['Chillán', 'Valparaíso', 'Lima', 'Madrid'], ok: 'Nació el 20 de agosto de 1778.' },
  { q: '¿Quién hablaba de libertad en la plaza de Chillán?', a: ['María Cornelia Olivares', 'El capitán San Bruno', 'Marcó del Pont', 'Diego Portales'], ok: 'La llamaron «la tribuna» de Chillán.' }
];
const Q_1818 = [
  { q: '¿Cuándo fue la batalla de Maipú?', a: ['El 5 de abril de 1818', 'El 18 de septiembre de 1810', 'El 1 de octubre de 1814', 'El 28 de enero de 1823'], ok: 'Aseguró la Independencia de Chile.' },
  { q: '¿Dónde se firmó el Acta de la Independencia?', a: ['En Concepción', 'En Madrid', 'En Lima', 'En Mendoza'], ok: 'Lleva fecha del 1 de enero de 1818.' },
  { q: '¿Dónde juró O\'Higgins la Independencia el 12 de febrero de 1818?', a: ['En Talca', 'En Juan Fernández', 'En Chiloé', 'En Mendoza'], ok: 'En Santiago se lanzaron medallas al pueblo.' },
  { q: '¿Qué sorpresa sufrieron los patriotas antes de Maipú?', a: ['Cancha Rayada, de madrugada', 'Una nevazón', 'Un terremoto', 'Una fiesta'], ok: 'Fue el 19 de marzo de 1818.' },
  { q: '¿Quién recibió en su hacienda al ejército después de Cancha Rayada?', a: ['Paula Jaraquemada', 'Marcó del Pont', 'El capitán San Bruno', 'Mariano Osorio'], ok: 'Les dio comida, caballos y atención.' },
  { q: 'Según el Acta, Chile queda para siempre separado…', a: ['de la monarquía de España', 'de la cordillera', 'del mar', 'de sus tradiciones'], ok: 'Desde entonces, Chile se gobierna a sí mismo.' }
];
const Q_MONTE = [
  { q: '¿Dónde se reunió el Cabildo abierto del 18 de septiembre de 1810?', a: ['En la sala del Real Consulado', 'En un barco', 'En Mendoza', 'En Chillán'], ok: 'Asistieron entre 400 y 450 vecinos.' },
  { q: '¿Dónde dejó Bernardo O\'Higgins el mando en 1823?', a: ['En el Real Consulado', 'En Mendoza', 'En un barco', 'En Talca'], ok: 'Dijo: «¡Aquí está mi pecho!».' },
  { q: '¿Qué decretó O\'Higgins el 3 de junio de 1818?', a: ['Que en los registros se escribiera «chileno»', 'Que volviera el rey', 'Que se cerraran las escuelas', 'Que se prohibiera el pan'], ok: 'También para los pueblos indígenas, sin diferencias.' },
  { q: '¿Qué institución ayudó a crear Manuel de Salas?', a: ['La Biblioteca Nacional', 'Un circo', 'Un zoológico', 'Un banco'], ok: 'Fue su primer director.' },
  { q: '¿En qué puerto fue gobernador Diego Portales?', a: ['Valparaíso', 'Arica', 'Puerto Montt', 'Chillán'], ok: 'Quería un país con orden y trabajo.' },
  { q: '¿Qué enseña el lema de los Carrera?', a: ['Los valientes se levantan una vez más de las que se caen', 'Nunca hay que intentarlo', 'Mejor rendirse rápido', 'Solo ganan los fuertes'], ok: 'Caerse no importa: lo importante es levantarse.' },
  { q: '¿Por qué hay que recordar la historia de Chile?', a: ['Para cuidar lo que otros construyeron', 'Para no hacer tareas', 'No hay que recordarla', 'Para olvidarla mejor'], ok: '¡La memoria es la que mantiene vivas nuestras virtudes!' }
];

// Rivales nuevos (se suman a OPPONENTS). attacks:true usa los ataques realistas; every: ataca cada N turnos.
// Para versiones futuras: nuevas épocas y fundadores se suman a FOUNDERS, DESTS y CHAPTERS;
// la misión abierta es detener los planes del Espíritu Realista (flag 'espiritu_escapo').
const MONTE_SKY = { sky: '#3a2a5a', sky2: '#8a6a9a', ground: '#6a5a6a' };
Object.assign(OPPONENTS, {
  interrogatorio: { name: 'Soldado de Talavera', sprite: 'realista', hp: 2, attacks: true, every: 2, sky: '#8a7a9a', sky2: '#c8b8c8', ground: '#a89878',
    intro: '¡Un Soldado de Talavera te interroga!', taunt: '¡Alto ahí! ¿Una niña sola en la calle, con estos tiempos? A ver… responde.', lose: 'Mmm… sabes demasiado para ser un peligro. ¡Circule, circule!', winText: '¡MG salió del interrogatorio! Los soldados la dejarán tranquila un ratito.',
    questions: Q_1816 },
  explorador: { name: 'Explorador de los Talaveras', sprite: 'realista', hp: 3, attacks: true, every: 2, sky: '#d8a878', sky2: '#f0d8b0', ground: '#b8a070',
    intro: '¡Un Explorador de los Talaveras corta el paso!', taunt: '¿Ayudando a los Carrera a escapar? ¡Nadie cruza este camino sin responderme!', lose: '¡Bah! Ya se me escaparon todos… ¡y esta niña sabe más historia que mi sargento!',
    questions: Q_1814 },
  sargento: { name: 'Sargento de Talavera', sprite: 'realista', hp: 3, attacks: true, sky: '#7a6a8a', sky2: '#b8a8c0', ground: '#988868',
    intro: '¡El Sargento de Talavera quiere un duelo!', taunt: '¿Tertulias secretas? ¿Cartas a Mendoza? ¡En esta calle nadie conspira!', lose: '¡Grr! No encontré ninguna carta… ¡Pero el capitán San Bruno se va a enterar!',
    questions: Q_1816 },
  sanbruno: { name: 'Capitán San Bruno', sprite: 'sanbruno', art: 'v_sanbruno', hp: 5, attacks: true, boss: true, villain: true, music: 'batalla', sky: '#5a4a6a', sky2: '#a898b0', ground: '#887858',
    intro: '¡El capitán San Bruno bloquea el portón sur!', taunt: 'Soy Vicente San Bruno, capitán del regimiento Talavera. Desde aquí no sale nadie sin mi permiso… ¡y menos una espía!',
    lose: '¡Imposible! Una niña con más respuestas que todo mi Tribunal de Vigilancia… ¡Esto no ha terminado!', winText: '¡MG venció al capitán San Bruno! El portón sur queda libre.',
    questions: Q_1816 },
  sanbruno2: { name: 'Capitán San Bruno', sprite: 'sanbruno', art: 'v_sanbruno', hp: 4, attacks: true, boss: true, villain: true, sky: '#1c2440', sky2: '#3a4a6a', ground: '#3a4a30',
    intro: '¡El capitán San Bruno descubrió a la «abuelita»!', taunt: 'Esa abuelita tiene la voz de la niña del portón… ¡Quítate el chal y responde!',
    lose: '¡Otra vez esa niña! ¡Rodríguez se me escapó por el río!', winText: '¡MG venció otra vez al capitán San Bruno!',
    questions: Q_1816 },
  soldado1817: { name: 'Soldado del Rey', sprite: 'realista', hp: 3, attacks: true, every: 2, sky: '#c8d8f0', sky2: '#eaf0f8', ground: '#b8c890',
    intro: '¡Un Soldado del Rey vigila la plaza de Chillán!', taunt: '¡Aquí nadie habla de libertad! Las noticias de Chacabuco son puras mentiras.', lose: '¿Chacabuco… de verdad? Entonces… mejor me voy antes de que lleguen los patriotas.',
    questions: Q_1817 },
  chacabuco: { name: 'Tropas del Rey', sprite: 'realista', hp: 4, attacks: true, every: 2, dodge: true, sky: '#a8c8f0', sky2: '#e8f0fa', ground: '#c8b890',
    intro: '¡Las tropas del Rey cierran el camino en Chacabuco!', taunt: '¡Nadie cruza esa cordillera con un ejército entero! … ¿O sí?', lose: '¡Retirada! ¡El Ejército de los Andes está aquí!', winText: '¡Los patriotas triunfan en Chacabuco!',
    questions: Q_ANDES },
  osorio: { name: 'Mariano Osorio', sprite: 'osorio', art: 'v_osorio', hp: 5, attacks: true, boss: true, villain: true, sky: '#c8a080', sky2: '#f0d8c0', ground: '#b8a860',
    intro: '¡El general Mariano Osorio quiere el último duelo de Maipú!', taunt: 'Gané en Rancagua y en Cancha Rayada. ¡Hoy recuperaré Chile para el Rey!',
    lose: 'Mis soldados retroceden… ¡Maipú está perdido! Chile ya no volverá a ser del Rey.', winText: '¡MG venció a Mariano Osorio! ¡La Independencia está a salvo!',
    questions: Q_1818 },
  marco: { name: 'Marcó del Pont', sprite: 'marco', art: 'v_marco', hp: 3, attacks: [{ n: 'Encajes', t: 'Agita sus encajes y te marea con su perfume. ¡Achís!' }, { n: '¡Orden del Rey!', t: '«¡Por orden del Rey, silencio!» Su grito retumba.' }], villain: true, sky: '#d8c0e0', sky2: '#f4e8f4', ground: '#c0a8a0',
    intro: '¡El gobernador Marcó del Pont exige un duelo!', taunt: 'Soy Francisco Casimiro Marcó del Pont, gobernador del Reino. ¡Cuidado con mis encajes!',
    lose: '¡Mis encajes! ¡Mi peluca! Me voy… pero con elegancia.', questions: Q_1816 },
  espiritu: { name: 'Espíritu Realista', sprite: 'espiritu', art: 'v_espiritu', artH: 112, hp: 6, attacks: [{ n: 'Tinta del olvido', t: 'Una gota de tinta gris borra una línea del libro…' }, { n: 'Corona de sombras', t: 'La corona brilla y todo se ve más oscuro. ¡Qué frío!' }, { n: '¡Cambiar la historia!', t: '«¿Y si Chile nunca hubiera sido libre?» Su voz da escalofríos.' }], boss: true, villain: true, music: 'final', sky: '#1a0a1a', sky2: '#4a1a3a', ground: '#2a1a2a',
    intro: '¡El ESPÍRITU REALISTA aparece!', taunt: 'Cada vez que alguien olvida un pedacito de historia, yo me hago más fuerte. ¿Cuánto recuerdas tú, niña?',
    lose: '¡No! ¡Mientras una niña recuerde, la historia de Chile no se puede cambiar!', winText: '¡MG venció al Espíritu Realista!', questions: Q_MONTE },
  rey1: Object.assign({}, MONTE_SKY, { name: 'Sargento de Talavera', sprite: 'realista', hp: 3, attacks: true, intro: '¡Primer guardián de los Cuatro del Rey!', lose: '¡Uf! Esta niña recuerda todo.', questions: Q_1814.concat(Q_1816) }),
  rey2: Object.assign({}, MONTE_SKY, { name: 'Marcó del Pont', sprite: 'marco', art: 'v_marco', hp: 3, attacks: [{ n: 'Encajes', t: 'Agita sus encajes y te marea con su perfume. ¡Achís!' }, { n: '¡Orden del Rey!', t: '«¡Por orden del Rey, silencio!» Su grito retumba.' }], villain: true, intro: '¡Segundo guardián: el gobernador Marcó del Pont!', lose: '¡Mis encajes se arrugaron! ¡Qué desastre!', questions: Q_1816.concat(Q_1817) }),
  rey3: Object.assign({}, MONTE_SKY, { name: 'Mariano Osorio', sprite: 'osorio', art: 'v_osorio', hp: 4, attacks: true, villain: true, intro: '¡Tercer guardián: el general Mariano Osorio!', lose: 'Ni en Maipú ni aquí… ¡Esta niña es imparable!', questions: Q_1818 }),
  rey4: Object.assign({}, MONTE_SKY, { name: 'Capitán San Bruno', sprite: 'sanbruno', art: 'v_sanbruno', hp: 4, attacks: true, boss: true, villain: true, intro: '¡Último guardián: el capitán San Bruno!', lose: '¡Cuatro de cuatro! ¡Mi jefe no te va a perdonar!', questions: Q_MONTE })
});
OPPONENTS.olvido.hp = 5; OPPONENTS.olvido.attacks = [{ n: 'Borrón', t: 'Una mancha de tinta tapa una página del libro…' }, { n: 'Niebla', t: 'Una niebla gris te hace dudar de lo que sabías.' }]; OPPONENTS.olvido.every = 2;
// figuras de combate (Higgsfield, estilo de Rafael)
OPPONENTS.dudoso.art = 'v_dudoso'; OPPONENTS.temeroso.art = 'v_temeroso'; OPPONENTS.repaso.art = 'v_repaso'; OPPONENTS.olvido.art = 'v_olvido';
['interrogatorio', 'explorador', 'sargento', 'soldado1817', 'chacabuco', 'rey1'].forEach(k => { OPPONENTS[k].art = 'v_talavera'; });
OPPONENTS.olvido.bg = 'espiritu'; OPPONENTS.espiritu.bg = 'espiritu';
OPPONENTS.olvido.intro = '¡Una sombra encapuchada se interpone! ¡EL OLVIDO aparece!';
OPPONENTS.olvido.lose = '¡Nooo! Mientras una niña los recuerde… ¡no puedo borrarlos! Pero mi jefe… mi jefe sí puede…';
// El Olvido aparece cuatro veces: 1810 (en la nave), la cordillera, 1823 (en la nave) y la cumbre del Cerro Huelén
const Q_OLV1 = [
  { q: '¿Por qué el rey de España no podía gobernar en 1810?', a: ['Estaba preso de los franceses de Napoleón', 'Se fue de vacaciones a la playa', 'Se perdió en alta mar', 'No sabía leer'], ok: 'Napoleón había invadido España y tenía preso al rey.' },
  { q: '¿Dónde se reunió el Cabildo abierto del 18 de septiembre de 1810?', a: ['En el Real Consulado', 'En un barco', 'En la cordillera', 'En una cueva'], ok: 'En la esquina de Bandera y Compañía, a pasos de la Plaza de Armas.' },
  { q: '¿Cómo invitaron a los vecinos al Cabildo abierto?', a: ['Con una esquela: una invitación escrita', 'Con fuegos artificiales', 'Por teléfono', 'Con palomas mensajeras'], ok: 'Más de 400 vecinos recibieron su esquela.' },
  { q: '¿Quién presidió la Primera Junta de Gobierno?', a: ['Mateo de Toro y Zambrano', 'Diego Portales', 'Manuel Rodríguez', 'Ramón Freire'], ok: 'Don Mateo tenía más de 80 años.' },
  { q: '¿Qué soñaba don Manuel de Salas para Chile?', a: ['Escuelas y educación para todos', 'Un castillo de oro', 'Un rey nuevo', 'Más soldados'], ok: 'Decía que la libertad necesita educación.' }
];
const OLV_BASE = { name: 'El Olvido', sprite: 'olvido', art: 'v_olvido', villain: true, attacks: OPPONENTS.olvido.attacks, every: 2, sky: '#4a3a68', sky2: '#8a7aa8', ground: '#5a5070' };
Object.assign(OPPONENTS, {
  olvido1: Object.assign({}, OLV_BASE, { hp: 3, intro: '¡Una sombra gris sale de la nave! ¡EL OLVIDO aparece!', taunt: 'Ji, ji… Don Mateo, don Manuel… ¡qué nombres tan fáciles de olvidar! ¿Tú te acuerdas de ellos?',
    lose: '¡Ay! ¡Esta niña sí se acuerda! … Mi amo no va a estar nada contento…', winText: '¡MG espantó a El Olvido!', questions: Q_OLV1 }),
  olvido2: Object.assign({}, OLV_BASE, { hp: 4, dodge: true, intro: '¡La niebla de las cumbres se ríe! ¡EL OLVIDO otra vez!', taunt: 'Con este frío, los soldados olvidarán para qué cruzan la cordillera… ¡y tú también!',
    lose: '¡Grr! Ni la nieve te borra la memoria… Pero mi amo tiene algo que tú quieres, niña. Ji, ji…', winText: '¡MG venció a El Olvido en la cordillera!', questions: Q_ANDES }),
  olvido3: Object.assign({}, OLV_BASE, { hp: 4, dodge: true, intro: '¡La plaza se pone gris como una foto vieja! ¡EL OLVIDO vuelve!', taunt: 'Bernardo dejó el mando… En unos años, ¿quién se acordará de él? ¡Yo me encargo de que nadie!',
    lose: '¡Tres veces! ¡Tres veces me ganaste! Sube al Mirador del Tiempo, si te atreves… Mi amo te espera.', winText: '¡MG venció a El Olvido por tercera vez!', questions: Q_1817.concat(Q_1818) })
});
OPPONENTS.olvido.taunt = '¡Nos volvemos a ver, niña! Aquí, en la cumbre, soy más fuerte que nunca. ¿Todavía te acuerdas de tus fundadores?';
// el Sargento de Talavera es un rival que vuelve: Alameda 1814, calle 1816, túnel, Chacabuco, Chillán y el Cerro Huelén
OPPONENTS.sargento.taunt = '¡Te reconozco! ¡Eres la niña que se me escapó en la Alameda! ¿Tertulias secretas? ¿Cartas a Mendoza? ¡En esta calle nadie conspira!';
Object.assign(OPPONENTS.chacabuco, { name: 'Sargento de Talavera', intro: '¡El Sargento de Talavera y las tropas del Rey cierran el camino!', taunt: '¡¿Tú?! ¡¿Cruzaste la cordillera?! ¡Nadie cruza esas montañas con un ejército entero! … ¿O sí?',
  lose: '¡Retirada! ¡El Ejército de los Andes está aquí! … ¡Y esta niña aparece en todas partes!' });
Object.assign(OPPONENTS.soldado1817, { name: 'Sargento de Talavera', intro: '¡El Sargento de Talavera vigila la plaza de Chillán!', taunt: '¡Me ganaste en Chacabuco, pero aquí en el sur todavía manda el Rey! Las noticias de Chacabuco son puras mentiras.',
  lose: '¿Chacabuco… de verdad? Entonces… mejor me voy antes de que lleguen los patriotas. ¡Pero nos volveremos a ver, niña!' });
const CREDITS = [
  { t: 'MG y los Fundadores', s: 20, b: 1, c: '#ffe680' }, { t: 'El juego', s: 12 }, { t: '' }, { img: 'logo' }, { t: '' }, { t: '' }, { t: '' }, { t: '' },
  { t: 'Basado en la serie y los libros', s: 10, c: '#b8c8f0' }, { t: '«Pequeños Patriotas»', s: 14, b: 1 }, { t: '' },
  { t: 'Historia y poemas', s: 10, c: '#b8c8f0' }, { t: 'Miguel Ángel Fernández', s: 13, b: 1 }, { t: '' },
  { t: 'Ilustraciones de los personajes', s: 10, c: '#b8c8f0' }, { t: 'Rafael Fernández', s: 13, b: 1 }, { t: '' },
  { t: 'Los fundadores', s: 10, c: '#b8c8f0' }, ...FOUNDERS.map(f => ({ t: f.name, s: 11 })), { t: '' },
  { t: 'Datos históricos', s: 10, c: '#b8c8f0' }, { t: 'Memoria Chilena', s: 13, b: 1 }, { t: 'Biblioteca Nacional de Chile', s: 10 }, { t: 'memoriachilena.gob.cl', s: 10, c: '#ffe680' }, { t: '' },
  { t: 'Algunas escenas son tradición o imaginación', s: 9, c: '#b8c8f0' }, { t: '(el piano de Bernardo, el abrazo de Maipú', s: 9, c: '#b8c8f0' }, { t: 'y las aventuras de MG y Nemo).', s: 9, c: '#b8c8f0' }, { t: '' },
  { t: 'Y el mejor detective de cuatro patas', s: 10, c: '#b8c8f0' }, { t: 'Nemo', s: 14, b: 1 }, { t: '' }, { t: '' },
  { t: '«La libertad es como una plantita', s: 11, c: '#ffe680' }, { t: 'que hay que regar todos los días.»', s: 11, c: '#ffe680' }, { t: '' }, { t: '¡Viva Chile!', s: 16, b: 1 }, { t: '' }, { t: '' }, { t: 'El Espíritu Realista escapó…', s: 11, c: '#b8c8f0' }, { t: 'MG volverá', s: 16, b: 1, c: '#ffe680' }, { t: 'Pequeños Patriotas 2', s: 12 }, { t: '' }, { t: 'FIN', s: 18, b: 1, c: '#ffe680' }
];
