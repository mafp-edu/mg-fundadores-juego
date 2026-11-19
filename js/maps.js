// =====================================================================
//  MAPAS (cada uno es una función para poder variar según la historia)
// =====================================================================
'use strict';
function G0(w, h, ch = '.') { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function R(g, x, y, w, h, ch) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (g[yy] && xx >= 0 && xx < g[0].length) g[yy][xx] = ch; }
function SET(g, pts, ch) { pts.forEach(([x, y]) => { if (g[y]) g[y][x] = ch; }); }
function rowsOf(g) { return g.map(r => r.join('')); }
function room(w, h, o = {}) {
  const g = G0(w, h, o.floor || 'w'); R(g, 0, 0, w, 1, 'T'); R(g, 0, 1, w, o.wallRows || 2, o.wall || '#');
  for (let y = 0; y < h; y++) { g[y][0] = 'T'; g[y][w - 1] = 'T'; } R(g, 0, h - 1, w, 1, 'T'); (o.exit || []).forEach(x => g[h - 1][x] = 'm'); return g;
}
const MAPS = {};

// ------------------------------------------------------------ CASA DE MG (hoy)
MAPS.casa_pieza = () => {
  const g = room(12, 9, { wall: 'Q', exit: [5, 6] });
  return {
    name: 'Pieza de MG', era: 'hoy', music: 'casa', rows: rowsOf(g), tint: G.flags.flashback ? 'sepia' : null,
    props: [['bed', 1, 3], ['wardrobe', 2, 3], ['desk', 8, 3], ['plant', 10, 3], ['toybox', 4, 7], ['window', 4, 1, { deco: 1 }], ['window', 7, 1, { deco: 1 }], ['poster', 10, 1, { deco: 1 }], ['flagwall', 2, 1, { deco: 1 }], ['rug', 4, 4, { deco: 1 }]],
    npcs: [{ id: 'nemo', sprite: 'nemo', x: 6, y: 5, wander: 1, cond: () => !G.flags.nemo_sigue && !G.flags.accidente || G.flags.fin, talk: () => NEMO_CASA() }],
    warps: [{ x: 5, y: 8, to: 'casa_living', tx: 2, ty: 3, dir: 'down' }, { x: 6, y: 8, to: 'casa_living', tx: 2, ty: 3, dir: 'down' }],
    objs: [{ x: 2, y: 3, run: () => ROPERO() }, { x: 8, y: 3, w: 2, text: 'Mi escritorio. Hay un dibujo de Nemo con una capa de superhéroe.' }, { x: 2, y: 1, text: 'La bandera de Chile. ¡La de la estrella solitaria!' }]
  };
};
MAPS.casa_living = () => {
  const g = room(16, 10, { wall: '#' }); g[2][2] = 'D'; g[1][2] = 'D'; R(g, 11, 3, 4, 6, 't'); SET(g, [[14, 7], [14, 8]], 'H');
  return {
    name: 'Living', era: 'hoy', music: 'casa', rows: rowsOf(g), legend: { D: ['doorin', 0] }, tint: G.flags.flashback ? 'sepia' : null,
    props: [['bookshelf2', 4, 3], ['plant', 1, 3], ['fireplace', 7, 3], ['table', 6, 6], ['chair', 5, 6], ['chair', 9, 6], ['bench', 2, 7], ['fridge', 13, 3], ['stove', 12, 3], ['counter', 11, 6], ['window', 10, 1, { deco: 1 }], ['painting', 6, 1, { deco: 1 }], ['clock', 9, 1, { deco: 1 }]],
    npcs: [
      { id: 'papa', sprite: 'papa', x: 4, y: 6, dir: 'right', cond: '!flashback&!accidente|fin', talk: () => PAPA_TALK() },
      { id: 'max', sprite: 'max', x: 8, y: 8, wander: 2, cond: '!flashback&!accidente|fin', talk: () => MAX_TALK() },
      { id: 'tio_fin', sprite: 'tio', x: 10, y: 5, dir: 'down', cond: 'fin', talk: () => TIO_FIN() }
    ],
    warps: [{ x: 2, y: 2, to: 'casa_pieza', tx: 5, ty: 7, dir: 'up' }, { x: 14, y: 8, to: 'casa_lab', tx: 11, ty: 8, dir: 'left' }, { x: 14, y: 7, to: 'casa_lab', tx: 11, ty: 8, dir: 'left' }],
    objs: [{ x: 13, y: 3, run: () => COCINA() }, { x: 12, y: 3, run: () => COCINA() }, { x: 11, y: 6, w: 2, run: () => COCINA() }]
  };
};
MAPS.casa_lab = () => {
  const g = room(14, 10, { wall: 'B', floor: 'l' }); SET(g, [[12, 8]], 'H');
  return {
    name: 'Laboratorio de mamá', era: 'hoy', music: 'casa', rows: rowsOf(g),
    props: [['labmachine', 1, 3], ['labmachine', 9, 3], ['timemachine', 6, 3], ['crate', 1, 7], ['barrel', 2, 7], ['clock', 6, 1, { deco: 1 }], ['poster', 4, 1, { deco: 1 }]],
    npcs: [{ id: 'mama', sprite: 'mama', x: 5, y: 5, dir: 'up', cond: '!viaje1|fin', talk: () => MAMA_TALK() }],
    warps: [{ x: 12, y: 8, to: 'casa_living', tx: 13, ty: 8, dir: 'left' }],
    triggers: [{ id: 'accidente', x: 5, y: 4, w: 4, h: 3, cond: 'nemo_sigue&lab_visto&!accidente', run: () => ACCIDENTE() }],
    onEnter: () => LAB_ENTER()
  };
};

// ------------------------------------------------------------ PLAZA DE ARMAS (1810 · 1816 · 1823)
function plaza(era) {
  const g = G0(36, 28, ':');
  R(g, 0, 0, 36, 2, '.'); R(g, 9, 10, 18, 11, '_'); R(g, 9, 9, 18, 1, '=');
  [[10, 11], [22, 11], [10, 17], [22, 17]].forEach(([x, y]) => { R(g, x, y, 4, 3, '.'); g[y][x] = '*'; g[y + 2][x + 3] = '*'; });
  R(g, 27, 21, 9, 7, '.'); SET(g, [[29, 22], [33, 23], [30, 26], [35, 27]], '*');
  const roofs = era === '1816' ? ['#9a5a4a', '#7a4234', '#b8705a', '#5a2e22'] : undefined;
  const P = [
    ['cabildo', 10, 2, { w: 16, h: 7, door: [7, 8], to: era === '1823' ? 'cabildo1823' : 'cabildo', tx: 11, ty: 14, toCond: era === '1810' ? 'cabildo_abierto' : era === '1823' ? 'visita_cabildo23' : 'nunca', locked: era === '1816' ? 'Hay soldados en la puerta del Cabildo. Mejor no acercarme.' : era === '1823' ? 'Hoy el Cabildo está repleto. Primero quiero encontrar a Nemo.' : 'Hoy solo pueden entrar los vecinos invitados.' }],
    ['church', 1, 10, { w: 7, h: 8, door: [3], locked: 'La Catedral está cerrada. ¡Todavía la están terminando de construir!' }],
    ['house', 28, 9, { w: 7, h: 5, door: [3], roof: roofs, to: era === '1816' ? 'casa_luisa' : era === '1823' ? 'casa_ohiggins' : null, tx: era === '1823' ? 7 : 5, ty: era === '1823' ? 8 : 7, locked: era === '1810' ? 'Toc, toc… Nadie abre. Deben estar todos en la plaza.' : null }],
    ['house', 28, 15, { w: 7, h: 5, door: [3], wall: '#f8e8c8', roof: roofs, locked: 'La puerta está cerrada con llave.' }],
    ['house', 1, 21, { w: 6, h: 5, door: [2], wall: '#eedcd0', roof: roofs, to: era === '1816' ? 'casa_agueda' : null, tx: 5, ty: 7, locked: 'Una señora se asoma por la ventana: «¡Buenas tardes, mijita!».' }],
    ['house', 9, 22, { w: 7, h: 5, door: [3], roof: roofs, locked: 'Huele a pan amasado… pero la puerta está cerrada.' }],
    ['house', 18, 22, { w: 7, h: 5, door: [3], wall: '#f8e8c8', roof: roofs, sign: { x: 1 }, locked: era === '1823' ? 'Es una escuela nueva. Se escucha a los niños leyendo en voz alta.' : 'Es una pulpería. Está cerrada a esta hora.' }],
    ['fountain', 17, 15], ['tree', 11, 12], ['tree', 23, 12], ['tree', 11, 18], ['tree', 23, 18],
    ['lamp', 9, 10], ['lamp', 26, 10], ['lamp', 9, 20], ['lamp', 26, 20], ['bench', 15, 12], ['bench', 20, 12], ['bench', 15, 19], ['bench', 20, 19],
    ['stall', 5, 19], ['cart', 27, 7], ['timemachine', 31, 24], ['tree', 28, 22], ['tree', 34, 22], ['tree', 34, 26], ['bush', 28, 26],
    ['alamo', 2, 1], ['alamo', 5, 1], ['alamo', 8, 1], ['alamo', 28, 1], ['alamo', 31, 1], ['alamo', 34, 1],
    ['barrel', 8, 27], ['crate', 16, 27], ['well', 2, 19]
  ];
  if (era === '1810') P.push(['flag_es', 9, 8]);
  if (era === '1816') P.push(['flag_es', 9, 8], ['flag_es', 26, 8]);
  if (era === '1823') P.push(['flag_cl', 9, 8], ['flag_cl', 26, 8], ['flag_cl', 17, 21]);
  return { g, P };
}
MAPS.stgo1810 = () => {
  const { g, P } = plaza('1810');
  const tint = G.flags.jinete_pendiente ? 'atardecer' : null;
  return {
    name: 'Plaza de Armas, 1810', era: '1810', music: () => G.flags.jinete_pendiente ? 'triste' : 'colonia', rows: rowsOf(g), props: P, tint,
    npcs: [
      { id: 'mateo', sprite: 'mateo', speaker: 'mateo', x: 15, y: 9, dir: 'down', cond: '!cabildo_abierto', talk: () => MATEO_PLAZA() },
      { id: 'guardia', sprite: 'guardia', speaker: 'guardia', x: 19, y: 9, dir: 'down', cond: '!cabildo_abierto', talk: 'Buenos días, niña. Hoy hay Cabildo abierto: solo entran los vecinos que recibieron invitación.' },
      { id: 'vendedora', sprite: 'vendedora', speaker: 'vendedora', x: 7, y: 19, dir: 'down', talk: () => VENDEDORA_1810() },
      { id: 'vecino_a', sprite: 'vecino', speaker: 'vecino', x: 18, y: 14, dir: 'down', talk: () => INVITADO(1) },
      { id: 'vecino_b', sprite: 'vecina2', speaker: 'vecina2', x: 8, y: 16, dir: 'right', talk: () => INVITADO(2) },
      { id: 'vecino_c', sprite: 'huaso', speaker: 'huaso', x: 29, y: 7, dir: 'left', talk: () => INVITADO(3) },
      { id: 'caballo', horse: 'horse', x: 30, y: 6, dir: 'left', talk: 'El caballo resopla: «¡Brrr!». En 1810 no hay autos: ¡hay caballos y carretas!' },
      { id: 'nino1', sprite: 'nino', speaker: 'nino', x: 14, y: 21, wander: 2, talk: '¿Sabías que en las noches un sereno recorre las calles cantando la hora? ¡Y si llueve, grita «¡y lloviendo!»!' },
      { id: 'nina1', sprite: 'nina', speaker: 'nina', x: 22, y: 15, wander: 2, talk: 'Mi mamá dice que hoy los señores importantes van a decidir algo muy grande en el Cabildo.' },
      { id: 'fraile1', sprite: 'fraile', speaker: 'fraile', x: 25, y: 14, dir: 'left', talk: 'La paz sea contigo, hija. Dicen que el rey de España está prisionero. ¡Tiempos difíciles!' },
      { id: 'vecina1', sprite: 'vecina', speaker: 'vecina', x: 4, y: 20, wander: 1, talk: 'El agua la traen los aguateros en burro, ¡y la guardamos en tinajas!' },
      { id: 'jinete', horse: 'jinete', x: 26, y: 22, dir: 'left', cond: 'jinete_pendiente', talk: () => JINETE() }
    ],
    objs: [{ x: 17, y: 15, w: 3, h: 2, text: 'La pileta de la plaza. Aquí la gente viene a buscar agua y a conversar.' }],
    triggers: [{ id: 'jinete', x: 24, y: 21, w: 4, h: 6, cond: 'jinete_pendiente&!jinete_visto', run: () => JINETE() }],
    onEnter: () => STGO1810_ENTER()
  };
};
MAPS.stgo1816 = () => {
  const { g, P } = plaza('1816');
  const ver = (e) => GUARDIA_VE(e);
  return {
    name: 'Plaza de Armas, 1816', era: '1816', music: 'reconquista', rows: rowsOf(g), props: P, tint: 'reconquista',
    npcs: [
      { id: 'g1', sprite: 'realista', speaker: 'realista', x: 17, y: 21, dir: 'left', guard: { route: 'LLLLLLLL.RRRRRRRR.', range: 4, onSee: ver }, talk: '¡Circule, circule!' },
      { id: 'g2', sprite: 'realista', speaker: 'realista', x: 9, y: 15, dir: 'up', guard: { route: 'UUUU.DDDDDD.UU', range: 4, onSee: ver }, talk: '¡Circule!' },
      { id: 'g3', sprite: 'realista', speaker: 'realista', x: 27, y: 12, dir: 'down', guard: { route: 'DDDDDD.UUUUUU.', range: 4, onSee: ver }, talk: '¡Circule!' },
      { id: 'g4', sprite: 'realista', speaker: 'realista', x: 20, y: 9, dir: 'left', guard: { route: 'l..d..r..d..', range: 5, onSee: ver }, talk: '¡Circule!' },
      { id: 'g5', sprite: 'realista', speaker: 'realista', x: 7, y: 26, dir: 'left', guard: { route: 'l....r....', range: 4, onSee: ver }, talk: '¡Circule!' },
      { id: 'susurro', sprite: 'vecina', speaker: 'vecina', x: 33, y: 21, dir: 'left', talk: () => SUSURRO_1816() },
      { id: 'viejo16', sprite: 'vecino2', speaker: 'vecino2', x: 29, y: 25, dir: 'up', talk: 'Shhh… Desde Rancagua, los soldados del rey vigilan cada esquina. Caminamos rápido y hablamos bajito.' }
    ],
    warps: [{ x: 25, y: 27, to: 'hacienda', tx: 1, ty: 12, dir: 'right', cond: 'camino_sur', lockedText: 'Ese camino sale de la ciudad, hacia el sur. Todavía no sé a dónde ir.' }, { x: 26, y: 27, to: 'hacienda', tx: 1, ty: 12, dir: 'right', cond: 'camino_sur', lockedText: 'Ese camino sale de la ciudad, hacia el sur. Todavía no sé a dónde ir.' }],
    onEnter: () => STGO1816_ENTER()
  };
};
MAPS.stgo1823 = () => {
  const { g, P } = plaza('1823');
  return {
    name: 'Plaza de Armas, 1823', era: '1823', music: 'alameda', rows: rowsOf(g), props: P, tint: G.flags.medalla_ohiggins ? 'atardecer' : null,
    npcs: [
      { id: 'alfajores', sprite: 'vendedora', speaker: 'vendedora', x: 7, y: 19, dir: 'down', talk: () => ALFAJORES() },
      { id: 'escolar1', sprite: 'nino', speaker: 'nino', x: 19, y: 21, dir: 'down', talk: '¡Voy a la escuela! Ya sé leer: «Chi-le»… ¡Chile!' },
      { id: 'escolar2', sprite: 'nina', speaker: 'nina', x: 13, y: 15, wander: 2, talk: 'Mi profe dice que el Director Supremo quiere escuelas en todo el país.' },
      { id: 'vec23', sprite: 'vecino', speaker: 'vecino', x: 25, y: 16, dir: 'left', talk: '¿Viste la bandera nueva? Blanca, azul y roja, con una estrella solitaria. ¡Me encanta!' },
      { id: 'vec23b', sprite: 'vecina2', speaker: 'vecina2', x: 12, y: 9, dir: 'down', talk: () => say('vecina2', G.flags.medalla_ohiggins ? 'Don Bernardo dejó el mando… ¡Qué hombre más valiente! No se aferró al poder.' : 'Dicen que hoy habrá un Cabildo muy importante. La gente está nerviosa.') },
      { id: 'huaso23', sprite: 'huaso', speaker: 'huaso', x: 29, y: 7, dir: 'left', talk: '¡Buenas, patroncita! Ahora sí que somos chilenos, ¿ah? ¡Viva Chile!' },
      { id: 'caballo23', horse: 'horseCafe', x: 30, y: 6, dir: 'left', talk: 'Un caballo café muy tranquilo.' }
    ],
    onEnter: () => STGO1823_ENTER()
  };
};
// ------------------------------------------------------------ CABILDO (interior)
function cabildoBase() {
  const g = room(24, 16, { exit: [11, 12] });
  R(g, 11, 3, 2, 12, 'r'); R(g, 7, 4, 10, 4, 'r');
  return g;
}
MAPS.cabildo = () => ({
  name: 'Cabildo de Santiago', era: '1810', music: 'colonia', rows: rowsOf(cabildoBase()),
  props: [['mapwall', 2, 1, { deco: 1 }], ['longtable', 9, 5], ['chair', 9, 4], ['chair', 11, 4], ['chair', 13, 4], ['chair', 9, 6, { flip: 1 }], ['chair', 13, 6], ['candela', 7, 3], ['candela', 16, 3],
    ['painting', 9, 1, { deco: 1 }], ['painting', 13, 1, { deco: 1 }], ['bookshelf', 18, 3], ['bookshelf', 19, 3], ['bookshelf', 20, 3], ['bookshelf', 21, 3], ['bookshelf', 22, 3], ['bookshelf', 18, 8], ['bookshelf', 22, 8], ['deskold', 19, 11],
    ['plant', 1, 13], ['plant', 22, 13], ['candela', 1, 8], ['flag_es', 5, 3, { deco: 1 }]],
  npcs: [
    { id: 'mateo', sprite: 'mateo', speaker: 'mateo', x: 4, y: 4, dir: 'down', cond: '!medalla_mateo', talk: () => MATEO_CABILDO() },
    { id: 'dudoso', sprite: 'vecino2', speaker: 'vecino2', x: 14, y: 9, dir: 'left', cond: '!duelo_dudoso', talk: () => DUDOSO() },
    { id: 'salas', sprite: 'salas', speaker: 'salas', x: 20, y: 6, dir: 'down', cond: 'medalla_mateo&!medalla_salas', talk: () => SALAS() },
    { id: 'nemo', sprite: 'nemo', x: 21, y: 6, dir: 'down', glow: true, cond: 'medalla_mateo&!nemo_salas' },
    { id: 'junta1', sprite: 'vecino', speaker: 'vecino', x: 8, y: 7, dir: 'up', talk: 'Algunos quieren seguir obedeciendo al rey. Otros quieren gobernarnos solos. ¡Qué discusión!' },
    { id: 'junta2', sprite: 'vecino2', speaker: 'vecino2', x: 16, y: 7, dir: 'up', talk: 'Formaremos una Junta de Gobierno mientras el rey esté prisionero.' },
    { id: 'junta3', sprite: 'fraile', speaker: 'fraile', x: 6, y: 10, dir: 'right', talk: 'Hoy es 18 de septiembre de 1810. Recuerda esta fecha, pequeña.' }
  ],
  warps: [{ x: 11, y: 15, to: 'stgo1810', tx: 17, ty: 9, dir: 'down' }, { x: 12, y: 15, to: 'stgo1810', tx: 18, ty: 9, dir: 'down' }],
  objs: [{ x: 2, y: 1, w: 3, run: () => MAPA_ESPANA() }, { x: 19, y: 11, w: 2, text: 'Un escritorio con tintero y pluma. Aquí se escriben las actas del Cabildo.' }, ...LIBROS_SALAS()],
  onEnter: () => CABILDO_ENTER()
});
MAPS.cabildo1823 = () => ({
  name: 'Cabildo, 1823', era: '1823', music: 'piano', rows: rowsOf(cabildoBase()),
  props: [['mapwall', 2, 1, { deco: 1 }], ['longtable', 9, 5], ['candela', 7, 3], ['candela', 16, 3], ['painting', 9, 1, { deco: 1 }], ['painting', 13, 1, { deco: 1 }], ['bookshelf', 18, 3], ['bookshelf', 19, 3], ['bookshelf', 20, 3], ['flag_cl', 5, 3, { deco: 1 }], ['plant', 1, 13], ['plant', 22, 13]],
  npcs: [
    { id: 'ohiggins', sprite: 'ohiggins', speaker: 'ohiggins', x: 11, y: 8, dir: 'down', cond: '!medalla_ohiggins' },
    { id: 'p1', sprite: 'vecino', x: 8, y: 9, dir: 'right' }, { id: 'p2', sprite: 'vecino2', x: 14, y: 9, dir: 'left' }, { id: 'p3', sprite: 'patriota', x: 7, y: 7, dir: 'right' }, { id: 'p4', sprite: 'fraile', x: 16, y: 8, dir: 'left' }, { id: 'p5', sprite: 'vecina', x: 9, y: 11, dir: 'up' }, { id: 'p6', sprite: 'huaso', x: 14, y: 11, dir: 'up' }, { id: 'p7', sprite: 'patriota', x: 17, y: 10, dir: 'left' }
  ],
  warps: [{ x: 11, y: 15, to: 'stgo1823', tx: 17, ty: 9, dir: 'down' }, { x: 12, y: 15, to: 'stgo1823', tx: 18, ty: 9, dir: 'down' }],
  onEnter: () => CABILDO23_ENTER()
});

// ------------------------------------------------------------ LA ALAMEDA, 1814
MAPS.alameda1814 = () => {
  const g = G0(40, 24, '.');
  R(g, 0, 10, 40, 4, ':'); R(g, 0, 15, 40, 1, '~'); SET(g, [[8, 15], [30, 15]], 'b');
  R(g, 14, 7, 15, 1, ':'); R(g, 14, 8, 1, 2, ':');
  SET(g, [[7, 2], [8, 2], [11, 6], [12, 6], [18, 2], [19, 3], [21, 5], [7, 8], [16, 5]], '*');
  R(g, 33, 18, 7, 6, ','); R(g, 1, 22, 30, 2, ',');
  const P = [['house', 24, 1, { w: 10, h: 6, door: [4], to: 'casacarrera', tx: 6, ty: 7, chimney: 1, wall: '#f8f0e0' }],
    ['naranjo', 7, 6], ['naranjo', 20, 3], ['naranjo', 22, 6], ['tree', 34, 18], ['tree', 38, 21], ['bush', 37, 18],
    ['house', 2, 17, { w: 6, h: 5, door: [2], locked: 'Se escucha a alguien practicando en una guitarra.' }], ['house', 12, 18, { w: 7, h: 5, door: [3], wall: '#f4e4cc', locked: 'La puerta está cerrada.' }], ['house', 22, 17, { w: 6, h: 5, door: [3], locked: 'Un letrero dice: «Sastrería». Está cerrada.' }],
    ['stall', 18, 16], ['cart', 2, 12], ['timemachine', 34, 20], ['flag_pv', 23, 8], ['flag_pv', 34, 8]];
  P.push(G.flags.telas_listas ? ['telas', 9, 3] : ['telas_vacio', 9, 3]);
  for (let x = 6; x <= 23; x++) if (x !== 14) P.push(['fence', x, 9]);
  for (let y = 1; y <= 8; y++) P.push(['fencev', 5, y]);
  for (let x = 0; x < 40; x += 2) if (x !== 8 && x !== 30) P.push(['alamo', x, 14]);
  for (let x = 0; x < 5; x += 2) P.push(['alamo', x, 9]);
  for (let x = 35; x < 40; x += 2) P.push(['alamo', x, 9]);
  const nemoOk = !G.flags.nemo_javiera;
  return {
    name: 'La Alameda, 1814', era: '1814', music: () => G.flags.rancagua && !G.flags.medalla_jmcarrera ? 'triste' : 'alameda', rows: rowsOf(g), props: P, tint: G.flags.rancagua ? 'atardecer' : null,
    npcs: [
      { id: 'javiera', sprite: 'javiera', speaker: 'javiera', x: 12, y: 4, dir: 'down', talk: () => JAVIERA() },
      { id: 'nemo', sprite: 'nemo', x: 13, y: 4, dir: 'left', glow: true, cond: () => nemoOk },
      { id: 'nino_puente', sprite: 'nino', speaker: 'nino', x: 30, y: 16, dir: 'up', talk: () => TELA_BLANCA() },
      { id: 'vend14', sprite: 'vendedora', speaker: 'vendedora', x: 20, y: 16, dir: 'down', talk: () => TELA_AMARILLA() },
      { id: 'nina14', sprite: 'nina', speaker: 'nina', x: 36, y: 12, wander: 2, talk: () => say('nina', G.flags.tela_azul ? '¡Qué bueno que encontraste la tela! El viento sopla fuerte en la Alameda.' : '¡Vi una tela azul volando hacia el oriente! Se enredó en un álamo, creo.') },
      { id: 'vec14', sprite: 'vecino', speaker: 'vecino', x: 10, y: 12, wander: 3, talk: 'En 1811 se reunió el primer Congreso Nacional. ¡Ahora escribimos nuestras propias leyes!' },
      { id: 'vec14b', sprite: 'vecina', speaker: 'vecina', x: 26, y: 11, wander: 2, talk: 'La Alameda se llama así por los álamos. ¡Mira qué altos son!' },
      { id: 'huaso14', sprite: 'huaso', speaker: 'huaso', x: 4, y: 12, dir: 'right', talk: 'Vengo del campo con mi carreta. ¿Sabías que doña Javiera cabalga mejor que nadie?' },
      { id: 'jmcarrera', sprite: 'jmcarrera', speaker: 'jmcarrera', x: 15, y: 6, dir: 'down', cond: 'rancagua&!medalla_jmcarrera', talk: () => JMC() },
      { id: 's1', sprite: 'patriota', speaker: 'patriota', x: 8, y: 7, dir: 'right', cond: 'rancagua&!medalla_jmcarrera', talk: () => SOLDADO(1) },
      { id: 's2', sprite: 'patriota', speaker: 'patriota', x: 18, y: 5, dir: 'down', cond: 'rancagua&!medalla_jmcarrera', talk: () => SOLDADO(2) },
      { id: 's3', sprite: 'patriota', speaker: 'patriota', x: 21, y: 8, dir: 'left', cond: 'rancagua&!medalla_jmcarrera', talk: () => SOLDADO(3) },
      { id: 'caballo14', horse: 'horseBlack', x: 15, y: 11, dir: 'right', cond: 'rancagua', talk: 'El caballo de José Miguel está cansado y cubierto de polvo.' }
    ],
    objs: [{ x: 34, y: 14, sparkle: true, cond: 'buscar_telas&!tela_azul', run: () => TELA_AZUL() }, { x: 23, y: 8, text: 'La bandera de la Patria Vieja: azul, blanca y amarilla.' }],
    triggers: [{ id: 'jardin', x: 6, y: 1, w: 18, h: 8, cond: '!nemo_javiera', run: () => JARDIN_ENTRAR() }],
    onEnter: () => ALAMEDA_ENTER()
  };
};
MAPS.casacarrera = () => {
  const g = room(14, 9, { exit: [6, 7] });
  return {
    name: 'Casa de los Carrera', era: '1814', music: 'alameda', rows: rowsOf(g),
    props: [['bookshelf2', 1, 3], ['deskold', 9, 3], ['tablecloth', 5, 4], ['chair', 4, 4], ['painting', 4, 1, { deco: 1 }], ['painting', 8, 1, { deco: 1 }], ['plant', 12, 3], ['candela', 12, 6], ['fireplace', 2, 6]],
    npcs: [{ id: 'empleada', sprite: 'vendedora', speaker: 'vendedora', x: 11, y: 6, dir: 'left', talk: 'Doña Javiera está en el jardín. ¡Siempre trabajando por la patria!' }],
    warps: [{ x: 6, y: 8, to: 'alameda1814', tx: 28, ty: 7, dir: 'down' }, { x: 7, y: 8, to: 'alameda1814', tx: 28, ty: 7, dir: 'down' }],
    objs: [{ x: 9, y: 3, w: 2, text: 'Una carta sobre el escritorio. Habla de Talca y de un combate en Yerbas Buenas. No es educado leer cartas ajenas…' }, { x: 5, y: 4, w: 2, text: 'Una mesa con dulces de miel. ¡Huelen delicioso!' }, { x: 1, y: 3, w: 2, text: 'Libros apilados: viajes, leyes, mapas del mundo. José Miguel recorrió el mundo en barco.' }]
  };
};
// ------------------------------------------------------------ RECONQUISTA: casas de tertulia
MAPS.casa_agueda = () => ({
  name: 'Casa de doña Águeda', era: '1816', music: 'reconquista', rows: rowsOf(room(12, 9, { exit: [5, 6], floor: 't' })),
  props: [['deskold', 1, 3], ['bookshelf', 10, 3], ['chair', 4, 5], ['chair', 7, 5], ['rug', 4, 4, { deco: 1 }], ['candela', 3, 3], ['painting', 6, 1, { deco: 1 }], ['windowold', 3, 1, { deco: 1 }], ['windowold', 8, 1, { deco: 1 }]],
  npcs: [{ id: 'agueda', sprite: 'agueda', speaker: 'agueda', x: 2, y: 4, dir: 'right', talk: () => AGUEDA() },
    { id: 'tert1', sprite: 'vecino', speaker: 'vecino', x: 5, y: 6, dir: 'up', talk: 'Aquí, en la tertulia de doña Águeda, conversamos de libros… y de libertad. ¡Pero muy bajito!' },
    { id: 'tert2', sprite: 'vecina', speaker: 'vecina', x: 8, y: 4, dir: 'left', talk: 'Las noticias de los patriotas en Mendoza llegan escondidas en cartas. ¡Doña Águeda escribe las mejores!' }],
  warps: [{ x: 5, y: 8, to: 'stgo1816', tx: 3, ty: 26, dir: 'down' }, { x: 6, y: 8, to: 'stgo1816', tx: 3, ty: 26, dir: 'down' }]
});
MAPS.casa_luisa = () => ({
  name: 'Casa de doña Luisa', era: '1816', music: 'reconquista', rows: rowsOf(room(12, 9, { exit: [5, 6], wall: 'Q', floor: 't' })),
  props: [['chair', 2, 4], ['tablecloth', 5, 4], ['bookshelf', 10, 3], ['plant', 1, 3], ['candela', 9, 6], ['painting', 5, 1, { deco: 1 }], ['windowold', 8, 1, { deco: 1 }]],
  npcs: [{ id: 'luisa', sprite: 'luisa', speaker: 'luisa', x: 3, y: 4, dir: 'right', cond: '!medalla_luisa', talk: () => LUISA() },
    { id: 'luisa_sin', sprite: 'luisa_sin', speaker: 'luisa', x: 3, y: 4, dir: 'right', cond: 'medalla_luisa', talk: 'Corre con la respuesta donde doña Águeda. ¡Y cuidado con los soldados!' },
    { id: 'tert3', sprite: 'vecino2', speaker: 'vecino2', x: 8, y: 5, dir: 'left', talk: 'Doña Luisa llegó desde La Serena. ¡Su casa es la mejor anfitriona de los patriotas!' }],
  warps: [{ x: 5, y: 8, to: 'stgo1816', tx: 31, ty: 14, dir: 'down' }, { x: 6, y: 8, to: 'stgo1816', tx: 31, ty: 14, dir: 'down' }]
});
// ------------------------------------------------------------ HACIENDA DE DOÑA PAULA
MAPS.hacienda = () => {
  const g = G0(36, 24, '.');
  R(g, 0, 0, 36, 2, 'R'); R(g, 0, 11, 26, 2, ':'); R(g, 16, 8, 1, 3, ':'); R(g, 26, 8, 8, 7, ':');
  R(g, 2, 15, 13, 7, 'f'); R(g, 19, 17, 13, 5, 'z');
  SET(g, [[5, 3], [6, 4], [24, 13], [3, 9], [33, 4]], '*');
  const P = [['house', 10, 3, { w: 12, h: 5, door: [6], to: 'comedor', tx: 5, ty: 7, chimney: 1, wall: '#f4ead4' }],
    ['house', 25, 3, { w: 9, h: 5, door: [4], wall: '#d8b888', windows: false, doorCol: '#5a3a20', locked: G.flags.medalla_paula ? 'Los caballos están adentro, tranquilos y a salvo.' : 'El establo de los caballos de doña Paula.' }],
    ['puzzlemark', 28, 9, { deco: 1 }], ['puzzlemark', 29, 9, { deco: 1 }], ['puzzlemark', 30, 9, { deco: 1 }],
    ['tree', 3, 5], ['tree', 7, 8], ['tree', 23, 9], ['alamo', 0, 14], ['alamo', 16, 15], ['alamo', 34, 15], ['bush', 1, 9], ['well', 4, 12],
    ['haypile', 33, 12], ['barrel', 24, 6], ['cart', 6, 10]];
  if (!G.flags.medalla_paula) P.push(['hay', 28, 12, { push: 1, id: 'f1' }], ['hay', 31, 10, { push: 1, id: 'f2' }], ['hay', 29, 13, { push: 1, id: 'f3' }]);
  else P.push(['hay', 28, 9], ['hay', 29, 9], ['hay', 30, 9]);
  for (let x = 1; x < 15; x++) P.push(['fence', x, 14]);
  return {
    name: 'Hacienda de doña Paula', era: '1816', music: 'hacienda', rows: rowsOf(g), props: P,
    npcs: [{ id: 'paula', sprite: 'paula', speaker: 'paula', x: 17, y: 9, dir: 'down', talk: () => PAULA() },
      { id: 'hen1', prop: 'hen', x: 9, y: 9, wander: 2, talk: '¡Cocorocó! Las gallinas de doña Paula picotean el suelo.' }, { id: 'hen2', prop: 'hen', x: 21, y: 10, wander: 2, talk: '¡Cloc, cloc!' }, { id: 'hen3', prop: 'hen', x: 12, y: 13, wander: 2, talk: '¡Cloc!' },
      { id: 'inquilino', sprite: 'huaso', speaker: 'huaso', x: 9, y: 16, dir: 'down', talk: 'Los trabajadores de doña Paula llevamos mensajes escondidos entre los sacos de trigo. ¡Shhh!' },
      { id: 'caballoP', horse: 'horseCafe', x: 33, y: 9, dir: 'left', talk: 'Una yegua café con manchas blancas. Se parece a Nemo… ¡Dicen que se llama Centella!' }],
    warps: [{ x: 0, y: 11, to: 'stgo1816', tx: 25, ty: 26, dir: 'up' }, { x: 0, y: 12, to: 'stgo1816', tx: 25, ty: 26, dir: 'up' }],
    onPush: () => FARDOS_CHECK(),
    onEnter: () => HACIENDA_ENTER()
  };
};
MAPS.comedor = () => ({
  name: 'Comedor de la hacienda', era: '1816', music: () => G.flags.rodriguez_encontrado && !G.flags.trampilla ? 'batalla' : 'hacienda', rows: rowsOf(room(12, 9, { exit: [5, 6], floor: 't' })),
  props: [['tablecloth', 4, 4], ['chair', 3, 4], ['chair', 6, 4], ['olla', 9, 3, { cond: '!trampilla' }], ['olla', 10, 3, { cond: 'trampilla' }], ['bookshelf', 1, 3], ['candela', 10, 6], ['windowold', 4, 1, { deco: 1 }], ['painting', 7, 1, { deco: 1 }],
    ['trapdoor', 9, 5, { cond: 'trampilla', deco: 1 }]],
  npcs: [{ id: 'hc1', prop: 'hen', x: 3, y: 6, talk: '¡Cloc! La gallina mira fijo la mesa…', cond: '!rodriguez_encontrado' }, { id: 'hc2', prop: 'hen', x: 7, y: 6, talk: '¡Cloc, cloc! Picotea cerca del mantel.', cond: '!rodriguez_encontrado' }, { id: 'hc3', prop: 'hen', x: 6, y: 3, talk: '¡Cocorocó!', cond: '!rodriguez_encontrado' },
    { id: 'rodriguez', sprite: 'rodriguez', speaker: 'rodriguez', x: 8, y: 6, dir: 'left', cond: 'rodriguez_encontrado&!trampilla', talk: () => RODRIGUEZ_COMEDOR() }],
  warps: [{ x: 5, y: 8, to: 'hacienda', tx: 16, ty: 8, dir: 'down', cond: '!rodriguez_encontrado|trampilla', lockedText: '¡Los soldados vienen por ahí! ¡No puedo salir por la puerta!' }, { x: 6, y: 8, to: 'hacienda', tx: 16, ty: 8, dir: 'down', cond: '!rodriguez_encontrado|trampilla', lockedText: '¡Los soldados vienen por ahí! ¡No puedo salir por la puerta!' }, { x: 9, y: 5, to: 'tunel', tx: 1, ty: 1, dir: 'down', cond: 'trampilla' }],
  objs: [{ x: 4, y: 4, w: 2, cond: '!rodriguez_encontrado', run: () => MANTEL() }, { x: 9, y: 3, cond: 'rodriguez_encontrado&!trampilla', run: () => OLLA() }]
});
// ------------------------------------------------------------ TÚNEL SECRETO (oscuro)
MAPS.tunel = () => {
  const L = [
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'ScScccccccScccccccScccSS',
    'ScScSSSSScSSSSScScScScSS',
    'ScccScccScccccScScccScSS',
    'SSSSScScSSSSScScSSSSScSS',
    'ScccScScccScccScccScccSS',
    'ScSSScSSScScSSSSSSScSSSS',
    'ScccScccScScccccccScccSS',
    'SSScSSScScSSSSSSScSSScSS',
    'ScccccScScccccccScccccSS',
    'ScSSSSScSSScSSSSSSSSScSS',
    'ScccccScccScccccScccccSS',
    'ScSSScSSScSSSSScScSSSSSS',
    'ScccScccccccccSccccccHSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSSSSSS'];
  return {
    name: 'Túnel secreto', era: '1816', music: 'cueva', rows: L, dark: true, bg: '#08060f',
    props: [['torch', 1, 1, { deco: 1 }], ['torch', 11, 3, { deco: 1 }], ['torch', 17, 1, { deco: 1 }], ['torch', 5, 9, { deco: 1 }], ['torch', 21, 9, { deco: 1 }], ['torch', 13, 11, { deco: 1 }], ['ladder', 21, 13, { deco: 1 }]],
    npcs: [{ id: 'b1', bat: true, x: 9, y: 7, wander: 2, ghost: true, talk: 'Un murciélago dormido. «Son nuestros compañeros espías», dijo Manuel Rodríguez.' }, { id: 'b2', bat: true, x: 18, y: 11, wander: 2, ghost: true, talk: '¡Iiiih! Un murciélago.' }, { id: 'b3', bat: true, x: 3, y: 13, wander: 1, ghost: true, talk: 'Zzz… un murciélago colgando.' }],
    warps: [{ x: 21, y: 13, to: 'campo', tx: 2, ty: 17, dir: 'right' }],
    onEnter: () => TUNEL_ENTER()
  };
};
// ------------------------------------------------------------ CAMPO DE NOCHE (maizal y cascada)
MAPS.campo = () => {
  const g = G0(32, 20, ',');
  R(g, 0, 0, 32, 2, 'R'); R(g, 26, 0, 6, 4, 'R'); R(g, 27, 1, 2, 3, 'x'); R(g, 24, 4, 8, 1, '~');
  R(g, 3, 3, 20, 12, 'z'); R(g, 6, 6, 3, 2, ','); R(g, 14, 9, 3, 3, ','); R(g, 18, 4, 2, 2, ',');
  R(g, 0, 16, 26, 2, ':'); R(g, 23, 5, 2, 12, ':'); R(g, 25, 5, 4, 1, ':');
  const ver = (e) => SOLDADO_CAMPO_VE(e);
  return {
    name: 'Campos de noche', era: '1816', music: 'reconquista', rows: rowsOf(g), tint: 'noche',
    props: [['hay', 1, 15], ['tree', 1, 4], ['tree', 30, 8], ['tree', 30, 14], ['bush', 29, 11], ['alamo', 24, 18], ['cart', 10, 18]],
    npcs: [{ id: 'r1', sprite: 'realista', speaker: 'realista', x: 4, y: 2, dir: 'down', guard: { route: 'RRRRRRRRRRRRRRRR.LLLLLLLLLLLLLLLL.', range: 6, onSee: ver } },
      { id: 'r2', sprite: 'realista', speaker: 'realista', x: 21, y: 10, dir: 'left', guard: { route: 'l...d...r...u...', range: 5, onSee: ver } },
      { id: 'r3', sprite: 'realista', speaker: 'realista', x: 12, y: 15, dir: 'up', guard: { route: 'RRRRRR.d..LLLLLL.d..', range: 6, onSee: ver } },
      { id: 'rodriguez', sprite: 'rodriguez', speaker: 'rodriguez', x: 26, y: 6, dir: 'left', cond: '!teatro_ok', talk: () => TEATRO() }],
    triggers: [{ id: 'teatro', x: 23, y: 5, w: 3, h: 3, cond: '!teatro_ok', run: () => TEATRO() }],
    objs: [{ x: 27, y: 4, w: 2, run: () => CASCADA() }],
    onEnter: () => CAMPO_ENTER()
  };
};
MAPS.cueva = () => {
  const g = room(16, 11, { floor: 'c', wall: 'S', exit: [7, 8] });
  return {
    name: 'Cueva detrás de la cascada', era: '1816', music: 'cueva', rows: rowsOf(g), legend: { m: ['waterfall', 1] },
    props: [['mapwall', 2, 1, { deco: 1 }], ['mapwall', 9, 1, { deco: 1 }], ['torch', 6, 1, { deco: 1 }], ['torch', 13, 1, { deco: 1 }], ['campfire', 7, 5], ['wardrobe', 14, 3], ['wardrobe', 13, 3], ['table', 2, 6], ['barrel', 1, 3], ['crate', 1, 8], ['olla', 9, 5], ['timemachine', 11, 7, { cond: 'nave_cueva' }]],
    npcs: [{ id: 'rodriguez', sprite: 'rodriguez', speaker: 'rodriguez', x: 5, y: 4, dir: 'down', talk: () => RODRIGUEZ_CUEVA() },
      { id: 'nemo', sprite: 'nemo', x: 9, y: 6, dir: 'down', glow: true, cond: '!nemo_cueva' }],
    objs: [{ x: 13, y: 3, w: 2, text: 'Disfraces colgados: de fraile, de vendedor, de abuelita… ¡y uno de vaca!' }, { x: 2, y: 6, w: 2, text: 'Frascos con polvos misteriosos para hacer humo. Pimienta y tiza, decía la receta.' }, { x: 2, y: 1, w: 3, text: 'Mapas de Chile llenos de rutas secretas.' }],
    onEnter: () => CUEVA_ENTER()
  };
};
// ------------------------------------------------------------ CHILLÁN, 1817
MAPS.chillan = () => {
  const g = G0(30, 20, ':');
  R(g, 8, 5, 14, 9, '_'); R(g, 0, 0, 30, 2, '.'); R(g, 23, 14, 7, 6, '.'); SET(g, [[25, 16], [27, 18]], '*');
  return {
    name: 'Plaza de Chillán, 1817', era: '1817', music: 'reconquista', rows: rowsOf(g), tint: 'amanecer',
    props: [['church', 1, 2, { w: 6, h: 7, door: [3], locked: 'La iglesia de Chillán. Está cerrada.' }], ['house', 9, 0, { w: 6, h: 4, door: [3], locked: 'Cerrado.' }], ['house', 16, 0, { w: 7, h: 4, door: [3], wall: '#f0e0c8', locked: 'Cerrado.' }],
      ['house', 24, 3, { w: 6, h: 5, door: [2], locked: 'Cerrado.' }], ['house', 1, 14, { w: 6, h: 5, door: [3], wall: '#f4e4cc', locked: 'Cerrado.' }], ['house', 9, 15, { w: 7, h: 4, door: [3], locked: 'Cerrado.' }],
      ['bench', 14, 9, { deco: 1 }], ['tree', 9, 7], ['tree', 20, 7], ['tree', 9, 12], ['tree', 20, 12], ['lamp', 8, 5], ['lamp', 21, 5], ['timemachine', 26, 16], ['tree', 28, 14], ['well', 17, 15], ['flag_es', 22, 9]],
    npcs: [{ id: 'cornelia', sprite: 'cornelia', speaker: 'cornelia', x: 14, y: 9, dir: 'down', talk: () => CORNELIA() },
      { id: 'soldadoC', sprite: 'realista', speaker: 'realista', x: 19, y: 10, dir: 'left', talk: '¡Señora, váyase a su casa! … ¡Ay, no me hace caso!' },
      { id: 'conv1', sprite: 'vecina', speaker: 'vecina', x: 4, y: 11, dir: 'right', cond: '!conv1', talk: () => CONVENCER(1) },
      { id: 'conv2', sprite: 'nino', speaker: 'nino', x: 25, y: 11, dir: 'left', cond: '!conv2', talk: () => CONVENCER(2) },
      { id: 'conv3', sprite: 'vecino', speaker: 'vecino', x: 26, y: 9, dir: 'down', cond: '!conv3', talk: () => CONVENCER(3) },
      { id: 'oy1', sprite: 'vecina', x: 12, y: 11, dir: 'up', cond: 'conv1' }, { id: 'oy2', sprite: 'nino', x: 16, y: 11, dir: 'up', cond: 'conv2' }, { id: 'oy3', sprite: 'vecino', x: 14, y: 12, dir: 'up', cond: 'conv3' }],
    onEnter: () => CHILLAN_ENTER()
  };
};
// ------------------------------------------------------------ MAIPÚ, 1818
MAPS.maipu = () => {
  const g = G0(34, 22, '.');
  R(g, 0, 0, 34, 1, 'R'); R(g, 2, 9, 30, 1, ':'); R(g, 19, 2, 2, 18, ':'); R(g, 0, 16, 18, 2, ':');
  SET(g, [[3, 3], [28, 4], [8, 18], [30, 19], [12, 14]], '*'); R(g, 24, 13, 8, 6, '"');
  const P = [['tent', 5, 4], ['tent', 9, 4], ['tent', 13, 4], ['tent', 23, 4], ['tent', 27, 4], ['tent', 6, 12], ['tent', 12, 12],
    ['campfire', 8, 6], ['campfire', 25, 6], ['campfire', 10, 14], ['cannon', 15, 2], ['cannon', 29, 2], ['flag_cl', 21, 2], ['flag_cl', 17, 8], ['timemachine', 2, 19], ['tree', 31, 10], ['tree', 1, 6], ['bush', 32, 16], ['haypile', 3, 13], ['crate', 16, 12], ['barrel', 17, 12]];
  if (!G.flags.duelo_repaso) P.push(['barrel', 20, 8, { id: 'barrera' }]);
  for (let x = 2; x < 32; x++) if (x !== 19 && x !== 20 && x !== 17) P.push(['fence', x, 8]);
  return {
    name: 'Llano de Maipú, 1818', era: '1818', music: 'independencia', rows: rowsOf(g), props: P,
    npcs: [{ id: 'sargento', sprite: 'patriota', speaker: 'patriota', x: 19, y: 8, dir: 'down', cond: '!duelo_repaso', talk: () => REPASO() },
      { id: 'freire', sprite: 'freire', speaker: 'freire', x: 22, y: 6, dir: 'down', talk: () => FREIRE() },
      { id: 'cabo1', sprite: 'patriota', speaker: 'patriota', x: 8, y: 10, wander: 2, talk: 'Cruzamos la cordillera con el Ejército de los Andes. ¡Hacía tanto frío que se congelaban hasta las palabras!' },
      { id: 'cabo2', sprite: 'patriota', speaker: 'patriota', x: 14, y: 15, dir: 'left', talk: 'Hace unos días, en Cancha Rayada, nos sorprendieron de noche. Pero doña Paula Jaraquemada nos ayudó y el ejército se reorganizó.' },
      { id: 'cabo3', sprite: 'patriota', speaker: 'patriota', x: 28, y: 11, dir: 'down', talk: 'El 12 de febrero se proclamó la Independencia de Chile. ¡Ahora hay que defenderla!' },
      { id: 'cocinero', sprite: 'huaso', speaker: 'huaso', x: 9, y: 6, dir: 'left', talk: 'Charquicán para la tropa. ¡Con esto se gana cualquier batalla!' },
      { id: 'ohiggins', sprite: 'ohiggins', speaker: 'ohiggins', x: 25, y: 9, dir: 'right', cond: 'abrazo_hecho&!medalla_freire2', talk: () => OHIGGINS_MAIPU() },
      { id: 'sanmartin', sprite: 'sanmartin', speaker: 'sanmartin', x: 26, y: 9, dir: 'left', cond: 'abrazo_hecho', talk: 'Soy José de San Martín. Junto a Bernardo y a todos estos valientes, la libertad de Chile está a salvo.' }],
    objs: [{ x: 6, y: 18, sparkle: true, cond: 'buscar_bandera&!bandera_ok', run: () => BANDERA_FREIRE() }],
    onEnter: () => MAIPU_ENTER()
  };
};
// ------------------------------------------------------------ CASA DE O'HIGGINS, 1823
MAPS.casa_ohiggins = () => ({
  name: 'Casa de Bernardo O\'Higgins', era: '1823', music: 'piano', rows: rowsOf(room(16, 10, { exit: [7, 8] })),
  props: [['piano', 6, 3], ['saddle', 2, 3], ['cofre', 11, 3], ['crate', 13, 3], ['paintingw', 8, 1, { deco: 1 }], ['deskold', 12, 6], ['bookshelf2', 1, 6], ['flagwall', 4, 1, { deco: 1 }], ['candela', 14, 6], ['rug', 5, 5, { deco: 1 }]],
  npcs: [{ id: 'ohiggins', sprite: 'ohiggins', speaker: 'ohiggins', x: 6, y: 4, dir: 'up', talk: () => OHIGGINS_CASA() },
    { id: 'nemo', sprite: 'nemo', x: 8, y: 4, dir: 'up', glow: true, cond: '!nemo_piano' },
    { id: 'isabel', sprite: 'isabel', speaker: 'isabel', x: 9, y: 8, dir: 'left', talk: 'Mi hijo Bernardo toca el piano cuando tiene que pensar en cosas importantes.' }],
  warps: [{ x: 7, y: 9, to: 'stgo1823', tx: 31, ty: 14, dir: 'down' }, { x: 8, y: 9, to: 'stgo1823', tx: 31, ty: 14, dir: 'down' }],
  objs: [{ x: 2, y: 3, run: () => MUSEO('silla') }, { x: 11, y: 3, run: () => MUSEO('pluma') }, { x: 13, y: 3, run: () => MUSEO('tabla') }, { x: 12, y: 6, w: 2, run: () => MUSEO('constitucion') }, { x: 8, y: 1, w: 2, run: () => MUSEO('cuadro') }],
  onEnter: () => CASA_OH_ENTER()
});
// ------------------------------------------------------------ VALPARAÍSO, 1832
MAPS.valpo = () => {
  const g = G0(34, 22, '.');
  R(g, 0, 0, 34, 6, '%'); R(g, 9, 3, 4, 3, 'p'); R(g, 22, 2, 3, 4, 'p'); R(g, 0, 6, 34, 3, '='); R(g, 0, 6, 34, 1, 's');
  R(g, 0, 14, 34, 2, ':'); R(g, 16, 16, 2, 6, ':');
  const cols = ['#f0c040', '#5a9ae0', '#e86a5a', '#6ac080', '#f4a0b8', '#b88ae0'];
  const P = [['ship', 26, 1], ['ship', 1, 2], ['boat', 14, 4], ['timemachine', 10, 3]];
  [[1, 9, 6], [8, 9, 5], [21, 9, 6], [28, 9, 6], [2, 16, 5], [8, 17, 6], [20, 17, 6], [27, 16, 6]].forEach(([x, y, w], i) => P.push(['house', x, y, { w, h: 5, door: [2], wall: cols[i % cols.length], roof: ['#a8584a', '#86402e', '#c87a68', '#5a2a1e'], locked: ['Una bodega de mercaderías del puerto.', 'Un almacén de cuerdas y velas para barcos.', 'La casa de un pescador. Huele a mariscos.', 'Cerrado.'][i % 4] }]));
  P.push(['house', 14, 9, { w: 6, h: 5, door: [3], to: 'oficina', tx: 5, ty: 7, wall: '#e8d8b8', sign: { x: 1 } }], ['barrel', 6, 7], ['crate', 7, 7], ['crate', 19, 7], ['barrel', 30, 7], ['lamp', 13, 7], ['lamp', 21, 7], ['flag_cl', 12, 2]);
  return {
    name: 'Puerto de Valparaíso, 1832', era: '1832', music: 'puerto', rows: rowsOf(g), props: P,
    npcs: [{ id: 'marino1', sprite: 'marino', speaker: 'marino', x: 23, y: 4, dir: 'down', talk: 'Aquí llegan barcos de todo el mundo. ¡Valparaíso es el puerto más importante del Pacífico!' },
      { id: 'marino2', sprite: 'marino', speaker: 'marino', x: 5, y: 8, wander: 3, talk: '¿Buscas a don Diego Portales? Su oficina es esa del letrero, al centro del puerto.' },
      { id: 'pesc', sprite: 'huaso', speaker: 'huaso', x: 12, y: 5, dir: 'up', talk: 'La escuadra de Lord Cochrane zarpó de este puerto hace años, para liberar el Perú.' },
      { id: 'nina32', sprite: 'nina', speaker: 'nina', x: 26, y: 15, wander: 2, talk: 'Mi casa está en el cerro. ¡Las casas de Valparaíso son de todos colores!' },
      { id: 'vec32', sprite: 'vecina', speaker: 'vecina', x: 10, y: 15, wander: 2, talk: 'Don Diego es un hombre de pocas palabras, pero dicen que ordena todo lo que toca.' }],
    onEnter: () => VALPO_ENTER()
  };
};
MAPS.oficina = () => ({
  name: 'Oficina de don Diego', era: '1832', music: 'puerto', rows: rowsOf(room(12, 9, { exit: [5, 6], wall: '#' })),
  props: [['deskold', 5, 3], ['bookshelf', 1, 3], ['bookshelf', 2, 3], ['bookshelf', 10, 3], ['chair', 8, 5], ['cofre', 9, 6], ['window', 8, 1, { deco: 1 }], ['painting', 3, 1, { deco: 1 }], ['candela', 1, 6]],
  npcs: [{ id: 'portales', sprite: 'portales', speaker: 'portales', x: 6, y: 4, dir: 'down', talk: () => PORTALES() },
    { id: 'nemo', sprite: 'nemo', x: 3, y: 6, dir: 'down', glow: true, cond: '!nemo_final', talk: () => NEMO_FINAL() }],
  warps: [{ x: 5, y: 8, to: 'valpo', tx: 17, ty: 14, dir: 'down' }, { x: 6, y: 8, to: 'valpo', tx: 17, ty: 14, dir: 'down' }],
  objs: [{ x: 4, y: 5, sparkle: true, cond: '!medalla_portales', text: 'Papeles desordenados por todo el piso. ¡Nemo!' }, { x: 8, y: 6, sparkle: true, cond: '!medalla_portales', text: 'Más papeles… con fechas y nombres de la historia.' }]
});
// ------------------------------------------------------------ Destinos de la nave
const DESTS = [
  { label: 'Hoy · Casa de MG', year: 'HOY', map: 'casa_lab', x: 6, y: 5, dir: 'down', cond: 'doce_medallas', before: () => FINAL_ANTES() },
  { label: 'Santiago, 1810 · El Cabildo', year: '1810', map: 'stgo1810', x: 31, y: 25, cond: 'viaje1' },
  { label: 'La Alameda, 1814 · Casa Carrera', year: '1814', map: 'alameda1814', x: 34, y: 21, cond: 'dest1814' },
  { label: 'Santiago, 1816 · La Reconquista', year: '1816', map: 'stgo1816', x: 31, y: 25, cond: 'dest1816' },
  { label: 'Chillán, 1817 · La plaza', year: '1817', map: 'chillan', x: 26, y: 17, cond: 'dest1817' },
  { label: 'Maipú, 1818 · El campamento', year: '1818', map: 'maipu', x: 3, y: 20, cond: 'dest1818' },
  { label: 'Santiago, 1823 · El piano', year: '1823', map: 'stgo1823', x: 31, y: 25, cond: 'dest1823' },
  { label: 'Valparaíso, 1832 · El puerto', year: '1832', map: 'valpo', x: 11, y: 6, cond: 'dest1832' }
];
