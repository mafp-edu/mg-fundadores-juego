// =====================================================================
//  PISTAS, TARJETAS DE CAPÍTULO E INTRO (capa de «publicación»)
// =====================================================================
'use strict';
const F_ = (f) => !!G.flags[f];
const N_ = (f) => G.flags[f] || 0;
const firstEnt = (ids, doneFlag) => { for (let i = 0; i < ids.length; i++) if (!F_(doneFlag(i))) return { ent: ids[i] }; return null; };
// Reglas: [condición, mapa, objetivo, texto de pista]. La primera que calza con el mapa actual gana.
const HINTS = [
  // ---- casa
  [() => !F_('juego_nemo'), 'casa_pieza', { ent: 'nemo' }, 'Acércate a Nemo y presiona A para jugar con él.'],
  [() => F_('juego_nemo') && !F_('lab_visto'), 'casa_pieza', [5, 8], 'Sal de tu pieza por la alfombra de abajo.'],
  [() => F_('juego_nemo') && !F_('lab_visto'), 'casa_living', [14, 7], 'La escalera al laboratorio está a la derecha del living.'],
  [() => F_('lab_visto') && !F_('nemo_sigue') && !F_('accidente'), 'casa_lab', [12, 8], 'Vuelve a tu pieza a buscar a Nemo (escalera).'],
  [() => F_('lab_visto') && !F_('nemo_sigue') && !F_('accidente'), 'casa_living', [2, 2], 'Tu pieza es la puerta de arriba a la izquierda.'],
  [() => F_('lab_visto') && !F_('nemo_sigue') && !F_('accidente'), 'casa_pieza', { ent: 'nemo' }, 'Habla con Nemo para que te siga.'],
  [() => F_('nemo_sigue') && !F_('accidente'), 'casa_pieza', [5, 8], 'Lleva a Nemo al laboratorio.'],
  [() => F_('nemo_sigue') && !F_('accidente'), 'casa_living', [14, 7], 'Baja por la escalera con Nemo.'],
  [() => F_('nemo_sigue') && !F_('accidente'), 'casa_lab', [6, 5], 'Acércate a la nave con Nemo.'],
  [() => F_('accidente') && !F_('vestido'), 'casa_lab', [12, 8], 'Sube a tu pieza a buscar el vestido café.'],
  [() => F_('accidente') && !F_('vestido'), 'casa_living', [2, 2], 'Tu pieza: la puerta de arriba a la izquierda.'],
  [() => F_('accidente') && !F_('vestido'), 'casa_pieza', [2, 3], 'Revisa el ropero, junto a tu cama.'],
  [() => F_('accidente') && !F_('mochila'), 'casa_pieza', [5, 8], 'Ahora ve a la cocina del living.'],
  [() => F_('accidente') && !F_('mochila'), 'casa_living', [13, 3], 'Revisa el refrigerador de la cocina.'],
  [() => F_('accidente') && !F_('viaje1'), 'casa_pieza', [5, 8], 'Vuelve al laboratorio para el viaje.'],
  [() => F_('accidente') && !F_('viaje1'), 'casa_living', [14, 7], 'Baja al laboratorio.'],
  // ---- 1810
  [() => !F_('mateo_conocido'), 'stgo1810', { ent: 'mateo' }, 'Don Mateo está frente al Real Consulado, al norte de la plaza.'],
  [() => F_('mateo_conocido') && N_('inv') < 3, 'stgo1810', () => firstEnt(['vecino_a', 'vecino_b', 'vecino_c'], i => 'inv' + (i + 1)), 'Busca a los vecinos: junto a la pileta, cerca de la Catedral y junto a la carreta.'],
  [() => N_('inv') >= 3 && !F_('cabildo_abierto'), 'stgo1810', { ent: 'mateo' }, 'Vuelve donde don Mateo.'],
  [() => F_('cabildo_abierto') && !F_('medalla_salas') && !F_('jinete_pendiente'), 'stgo1810', [17, 8], 'Entra al Real Consulado por los arcos del centro.'],
  [() => !F_('mapa_visto'), 'cabildo', { ent: 'mateo' }, 'Don Mateo te espera junto al gran mapa.'],
  [() => !F_('duelo_dudoso'), 'cabildo', { ent: 'dudoso' }, 'Conversa con el Vecino Dudoso. Si no sabes, recuerda lo que dijo don Mateo.'],
  [() => !F_('medalla_mateo'), 'cabildo', { ent: 'mateo' }, 'Vuelve donde don Mateo.'],
  [() => !F_('nemo_salas'), 'cabildo', { ent: 'salas' }, 'Nemo está junto a Manuel de Salas, cerca de los estantes.'],
  [() => F_('buscar_libros') && N_('libros') < 3, 'cabildo', () => { const P = [[17, 4], [22, 11], [15, 13]]; for (let i = 0; i < 3; i++) if (!F_('libro' + (i + 1))) return P[i]; return null; }, 'Busca los destellos en el suelo del salón.'],
  [() => !F_('medalla_salas'), 'cabildo', { ent: 'salas' }, 'Devuélvele los libros a Manuel de Salas.'],
  [() => F_('dest1814') && !F_('llego_1814'), 'cabildo', [11, 15], 'Sal del Real Consulado.'],
  [() => F_('dest1814') && !F_('llego_1814'), 'stgo1810', [31, 24], 'La nave está en el parque del sureste. Presiona A frente a ella.'],
  // ---- 1814
  [() => !F_('nemo_javiera'), 'alameda1814', [14, 8], 'El jardín con telas de colores está al norte. Entra por el portón.'],
  [() => !F_('javiera_hablo'), 'alameda1814', { ent: 'javiera' }, 'Habla con doña Javiera.'],
  [() => F_('buscar_telas') && !F_('telas_listas') && !F_('tela_azul'), 'alameda1814', [34, 14], 'Una niña vio volar la tela azul hacia el oriente, a un álamo.'],
  [() => F_('buscar_telas') && !F_('telas_listas') && !F_('tela_blanca'), 'alameda1814', { ent: 'nino_puente' }, 'Un niño junto al puente del oriente sacó algo de la acequia.'],
  [() => F_('buscar_telas') && !F_('telas_listas') && !F_('tela_amarilla'), 'alameda1814', { ent: 'vend14' }, 'La vendedora del puesto de dulces tiene algo amarillo.'],
  [() => F_('buscar_telas') && !F_('telas_listas'), 'alameda1814', { ent: 'javiera' }, 'Lleva las telas a doña Javiera.'],
  [() => F_('rancagua') && N_('soldados') < 3, 'alameda1814', () => firstEnt(['s1', 's2', 's3'], i => 'soldado' + (i + 1)), 'Hay soldados cansados en el jardín.'],
  [() => F_('rancagua') && !F_('medalla_jmcarrera'), 'alameda1814', { ent: 'jmcarrera' }, 'Habla con José Miguel Carrera.'],
  [() => F_('dest1816') && !F_('llego_1816'), 'alameda1814', [34, 20], 'La nave está al sureste de la Alameda.'],
  [() => F_('dest1816') && !F_('llego_1816'), 'casacarrera', [6, 8], 'Sal de la casa.'],
  // ---- 1816
  [() => !F_('agueda_hablo'), 'stgo1816', [3, 25], 'La casa de doña Águeda está al suroeste. ¡Que no te vean los soldados (mira su franja roja)!'],
  [() => F_('carta') && !F_('carta_entregada'), 'casa_agueda', [5, 8], 'Lleva la carta a doña Luisa.'],
  [() => F_('carta') && !F_('carta_entregada'), 'stgo1816', [31, 13], 'La casa de doña Luisa está al noreste. Pasa cuando los soldados miren a otro lado.'],
  [() => F_('carta') && !F_('carta_entregada'), 'casa_luisa', { ent: 'luisa' }, 'Entrégale la carta a doña Luisa.'],
  [() => F_('respuesta') && !F_('medalla_agueda'), 'casa_luisa', [5, 8], 'Vuelve donde doña Águeda.'],
  [() => F_('respuesta') && !F_('medalla_agueda'), 'stgo1816', [3, 25], 'Vuelve a la casa del suroeste con la respuesta.'],
  [() => F_('respuesta') && !F_('medalla_agueda'), 'casa_agueda', { ent: 'agueda' }, 'Habla con doña Águeda.'],
  [() => F_('camino_sur') && !F_('llego_hacienda'), 'casa_agueda', [5, 8], 'Sal hacia el camino del sur.'],
  [() => F_('camino_sur') && !F_('duelo_sanbruno'), 'stgo1816', { ent: 'sanbruno' }, 'El capitán San Bruno vigila el portón sur, junto a la nave. Habla con él para enfrentarlo.'],
  [() => F_('camino_sur') && !F_('llego_hacienda'), 'stgo1816', [25, 27], 'El camino del sur está abajo, junto a la nave.'],
  [() => !F_('paula_hablo'), 'hacienda', { ent: 'paula' }, 'Doña Paula está frente a su casa.'],
  [() => !F_('medalla_paula'), 'hacienda', [29, 9], 'Empuja cada fardo caminando contra él. Ponlos sobre las tres marcas amarillas. Si se traban, doña Paula los ordena de nuevo.'],
  [() => !F_('rodriguez_encontrado'), 'hacienda', [16, 7], 'Entra a la casa de doña Paula.'],
  [() => !F_('rodriguez_encontrado'), 'comedor', [4, 4], '¿Qué miran tanto las gallinas? Revisa la mesa.'],
  [() => !F_('trampilla'), 'comedor', [9, 3], 'Mueve la olla grande.'],
  [() => F_('trampilla') && !F_('campo_visto'), 'comedor', [9, 5], 'Baja por la puerta secreta del suelo.'],
  [() => F_('trampilla') && !F_('campo_visto'), 'tunel', [21, 13], 'La escalera de salida está al fondo, abajo a la derecha. Las antorchas iluminan el camino.'],
  [() => !F_('teatro_ok'), 'campo', [24, 6], 'Escóndete en el maizal (ahí no te ven) y llega arriba a la derecha.'],
  [() => !F_('cascada_abierta'), 'campo', [27, 4], 'Ponte frente a la cascada y presiona A.'],
  [() => !F_('medalla_rodriguez'), 'cueva', { ent: 'rodriguez' }, 'Conversa con Manuel Rodríguez.'],
  [() => F_('destAndes') && !F_('llego_mendoza'), 'cueva', [11, 7], 'Tu nave está al fondo de la cueva.'],
  // ---- 1817 · el cruce de los Andes
  [() => !F_('sanmartin_hablo'), 'mendoza', { ent: 'sanmartin' }, 'El general San Martín está al centro del campamento.'],
  [() => !F_('arriero_hablo'), 'mendoza', { ent: 'arriero' }, 'El arriero está junto a las mulas.'],
  [() => !F_('mula3') && !hasItem('herraduras') && !F_('herraduras_dadas'), 'mendoza', { ent: 'herrero' }, 'El herrero, junto a los yunques, tiene las herraduras.'],
  [() => nMulas() < 3, 'mendoza', () => { const k = [1, 2, 3].find(k => !F_('mula' + k)); return [[11, 11], [15, 11], [19, 11]][k - 1]; }, 'Habla con cada mula para cargarla.'],
  [() => !F_('mulas_ok'), 'mendoza', { ent: 'arriero' }, 'Avísale al arriero que las mulas están listas.'],
  [() => F_('andes_cruzando') && !F_('llego_cordillera'), 'mendoza', [0, 9], 'La senda a la cordillera sale por el oeste (a la izquierda).'],
  [() => !F_('senda_ok'), 'cordillera', [8, 7], 'Empuja cada bloque por la senda hasta quedar bajo un hueco con marca amarilla, y después hacia arriba. Si se trabaron, habla con el arriero.'],
  [() => !F_('chacabuco_ok'), 'cordillera', [0, 8], 'Baja hacia el valle por el oeste.'],
  [() => F_('dest1817') && !F_('llego_chillan'), 'cordillera', [2, 11], 'Tu nave está en el descanso de abajo a la izquierda.'],
  // ---- 1817 y 1818
  [() => !F_('cornelia_hablo'), 'chillan', { ent: 'cornelia' }, 'La señora sobre la banca, al centro de la plaza.'],
  [() => !F_('medalla_cornelia') && [1, 2, 3].some(k => !F_('conv' + k)), 'chillan', () => firstEnt(['conv1', 'conv2', 'conv3'], i => 'conv' + (i + 1)), 'Convence a los vecinos. Piensa en lo que te enseñaron los fundadores.'],
  [() => !F_('medalla_cornelia'), 'chillan', { ent: 'cornelia' }, 'Vuelve donde doña Cornelia.'],
  [() => F_('dest1818') && !F_('llego_maipu'), 'chillan', [26, 16], 'La nave está al sureste de la plaza.'],
  [() => !F_('duelo_repaso'), 'maipu', { ent: 'sargento' }, 'El sargento cuida el paso del centro.'],
  [() => !F_('freire_hablo'), 'maipu', { ent: 'freire' }, 'Ramón Freire está junto a las carpas del norte.'],
  [() => F_('buscar_bandera') && !F_('bandera_ok'), 'maipu', [6, 18], 'Sigue las estrellitas de Nemo hacia el suroeste.'],
  [() => !F_('medalla_freire'), 'maipu', { ent: 'freire' }, 'Devuélvele la bandera a Freire.'],
  [() => !F_('medalla_freire2'), 'maipu', { ent: 'ohiggins' }, 'Habla con Bernardo O\'Higgins.'],
  [() => F_('dest1823') && !F_('llego_1823'), 'maipu', [2, 19], 'La nave está abajo a la izquierda.'],
  // ---- 1823 y 1832
  [() => !F_('medalla_ohiggins'), 'stgo1823', [31, 13], 'El piano suena en la casa del noreste de la plaza.'],
  [() => !F_('piano_ok'), 'casa_ohiggins', { ent: 'ohiggins' }, 'Habla con Bernardo, junto al piano.'],
  [() => !F_('visita_cabildo23') && ['silla', 'pluma', 'tabla', 'constitucion', 'cuadro'].filter(k => F_('museo_' + k)).length < 3, 'casa_ohiggins', () => { const P = { silla: [2, 3], pluma: [11, 3], tabla: [13, 3], constitucion: [12, 6], cuadro: [8, 1] }; for (const k in P) if (!F_('museo_' + k)) return P[k]; return null; }, 'Mira los recuerdos del salón: la silla, la pluma, la tabla, el cuadro y la Constitución.'],
  [() => !F_('visita_cabildo23'), 'casa_ohiggins', { ent: 'ohiggins' }, 'Vuelve a hablar con Bernardo.'],
  [() => F_('dest1832') && !F_('llego_valpo'), 'stgo1823', [31, 24], 'La nave está en el parque del sureste.'],
  [() => !F_('medalla_portales'), 'valpo', [17, 13], 'La oficina de don Diego es la del letrero, al centro del puerto.'],
  [() => !F_('medalla_portales'), 'oficina', { ent: 'portales' }, 'Habla con don Diego Portales.'],
  [() => F_('doce_medallas') && !F_('llego_monte'), 'oficina', [5, 8], 'Sal de la oficina.'],
  [() => F_('doce_medallas') && !F_('llego_monte'), 'valpo', [10, 3], 'La nave está en el muelle. Viaja al Cerro Huelén.'],
  // ---- el Mirador del Tiempo
  [() => !F_('obs1'), 'monte', { ent: 'centinela' }, 'Habla con el centinela del primer paso y elige el poder que te ayude a pasar sin que te reconozca.'],
  [() => !F_('rey1'), 'monte', { ent: 'rey1' }, 'El primero de los Cuatro del Rey te espera en el paso.'],
  [() => !F_('obs2'), 'monte', [11, 27], 'Revisa el portón del segundo paso. ¿Qué poder tiene que ver con música?'],
  [() => !F_('rey2'), 'monte', { ent: 'rey2' }, 'El segundo guardián te espera detrás del portón.'],
  [() => !F_('obs3'), 'monte', [11, 18], 'Revisa el derrumbe del tercer paso. Solo no se puede: ¿qué poder reúne a mucha gente?'],
  [() => !F_('rey3'), 'monte', { ent: 'rey3' }, 'El tercer guardián te espera detrás del derrumbe.'],
  [() => !F_('obs4'), 'monte', { ent: 'niebla' }, 'Habla con la niebla del cuarto paso. ¿Qué poder ilumina como un libro?'],
  [() => !F_('rey4'), 'monte', { ent: 'rey4' }, 'El último guardián te espera en el paso.'],
  [() => !F_('monte_final'), 'monte', [11, 6], 'Sube a la cumbre.']
];
function currentHint() {
  if (!G.map) return null;
  for (const [c, map, tgt, text] of HINTS) {
    if (map !== G.mapId) continue; let ok = false; try { ok = c(); } catch (e) { }
    if (!ok) continue;
    let t = typeof tgt === 'function' ? tgt() : tgt; if (!t) continue;
    if (t.ent) { const e = G.ents.find(q => q.id === t.ent && !q.hidden); if (!e) continue; return { x: e.x, y: e.y, text, ent: true }; }
    return { x: t[0], y: t[1], text };
  }
  return null;
}
// Flecha dorada sobre el objetivo, o en el borde si está fuera de pantalla
function drawHintArrow(c, cx, cy) {
  if (G.busy || UI.modal() || G.scene !== 'world' || G.flags.fin) return;
  const h = currentHint(); G.hintNow = h; if (!h) return;
  const p = G.player; if (Math.abs(p.x - h.x) + Math.abs(p.y - h.y) <= 1) return;
  const tx = h.x * 16 + 8 - cx, ty = h.y * 16 - cy - (h.ent ? 14 : 2);
  const b = Math.sin(G.t * 5) * 2;
  const tri = (x, y, ang, s = 1) => { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#2a1e2e'; c.beginPath(); c.moveTo(0, 6 * s); c.lineTo(-6 * s, -3 * s); c.lineTo(6 * s, -3 * s); c.fill(); c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(0, 4.5 * s); c.lineTo(-4.5 * s, -2 * s); c.lineTo(4.5 * s, -2 * s); c.fill(); c.fillStyle = '#fff6b0'; c.fillRect(-2 * s, -2 * s, 2 * s, 2 * s); c.restore(); };
  if (tx > 6 && tx < W - 6 && ty > 10 && ty < H - 4) tri(Math.round(tx), Math.round(ty + b), 0);
  else {
    const px = p.px + 8 - cx, py = p.py + 4 - cy; const ang = Math.atan2(ty - py, tx - px);
    const r = Math.min(W, H) / 2 - 16; const ex = clamp(W / 2 + Math.cos(ang) * (W / 2 - 14), 12, W - 12), ey = clamp(H / 2 + Math.sin(ang) * (H / 2 - 14), 12, H - 12);
    tri(Math.round(ex + Math.cos(ang) * b), Math.round(ey + Math.sin(ang) * b), ang - Math.PI / 2, 1.2);
  }
}
// Ayuda si te trabas: pasado un rato sin avanzar, toast con pista y rastro de estrellas
function hintTick(dt) {
  if (G.scene !== 'world' || G.busy || UI.modal() || G.flags.fin) return;
  if (G._lastObj !== G.objective) { G._lastObj = G.objective; G.objT = G.playTime; }
  if (G.playTime - (G.objT || 0) > (G.hintDelay || 60)) {
    G.objT = G.playTime; G.hintDelay = 45;
    const h = currentHint(); if (!h) return;
    toast('Pista de Nemo: ' + h.text, 6);
    const path = bfsPath(G.player.x, G.player.y, h.x, h.y);
    if (path) { setTrail(path.slice(1, -1)); setTimeout(() => setTrail([]), 9000); }
  }
}
function bfsPath(sx, sy, tx, ty) {
  const key = (x, y) => x + ',' + y; const prev = { [key(sx, sy)]: null }; const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (Math.abs(x - tx) + Math.abs(y - ty) <= 1) { const out = []; let k = key(x, y); let cur = [x, y]; while (cur) { out.unshift(cur); const pk = prev[key(cur[0], cur[1])]; cur = pk; } out.push([tx, ty]); return out; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (k in prev) continue; if (!G.map.solid[ny] || G.map.solid[ny][nx] === undefined || G.map.solid[ny][nx]) continue; prev[k] = [x, y]; q.push([nx, ny]); }
  }
  return null;
}
function showHintNow() { const h = currentHint(); if (!h) { toast('Bitácora: ' + (G.objective || '¡Explora!'), 5); return; } toast('Pista de Nemo: ' + h.text, 6); const path = bfsPath(G.player.x, G.player.y, h.x, h.y); if (path) { setTrail(path.slice(1, -1)); setTimeout(() => setTrail([]), 9000); } }

// ------------------------------------------------------------ tarjetas de capítulo
const CHAPTERS = [
  { n: 'Capítulo 1', t: 'Todo comenzó con un accidente', p: 'Casa de MG · hoy', f: [] },
  { n: 'Capítulo 2', t: 'El primer paso', p: 'Santiago · 18 de septiembre de 1810', f: ['mateo', 'salas'] },
  { n: 'Capítulo 3', t: 'La primera bandera', p: 'La Alameda · 1814', f: ['javiera', 'jmcarrera'] },
  { n: 'Capítulo 4', t: 'Los espías de la Reconquista', p: 'Santiago · 1816', f: ['agueda', 'luisa', 'paula', 'rodriguez'] },
  { n: 'Capítulo 5', t: 'El Cruce de los Andes', p: 'Mendoza y la cordillera · 1817', f: [] },
  { n: 'Capítulo 6', t: 'Una voz en la plaza', p: 'Chillán · 1817', f: ['cornelia'] },
  { n: 'Capítulo 7', t: 'El abrazo de Maipú', p: 'Llano de Maipú · 5 de abril de 1818', f: ['freire'] },
  { n: 'Capítulo 8', t: 'El piano y la decisión de Bernardo', p: 'Santiago · 1823', f: ['ohiggins'] },
  { n: 'Capítulo 9', t: 'La casa en orden', p: 'Valparaíso · 1832', f: ['portales'] },
  { n: 'Capítulo 10', t: 'El Mirador del Tiempo', p: 'Cerro Huelén · fuera del tiempo', f: [] },
  { n: 'Epílogo', t: 'De vuelta antes de la cena', p: 'Casa de MG · hoy', f: [] }
];
async function chapterCard(i) {
  const C = CHAPTERS[i]; if (!C) return;
  AUD.sfx('page');
  await UI.push({ t: 0,
    update(dt) { this.t += dt; if ((this.t > 1.2 && pressedAny('a', 'b')) || this.t > 4.2) this.resolve(); },
    draw(c) {
      const k = Math.min(1, this.t / 0.35), out = this.t > 3.8 ? Math.max(0, 1 - (this.t - 3.8) / 0.4) : 1; const a = k * out;
      c.globalAlpha = a; c.fillStyle = 'rgba(14,18,48,0.92)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = '#e8c050'; c.lineWidth = 1.5; c.strokeRect(14, 14, W - 28, H - 28); c.strokeRect(18, 18, W - 36, H - 36);
      c.textAlign = 'center';
      c.fillStyle = '#e8c050'; c.font = FONT(11, 1); c.fillText(C.n.toUpperCase(), W / 2, 64);
      const y0 = 96 + (1 - easeOutBack(Math.min(1, this.t / 0.6))) * 18;
      c.fillStyle = '#fff4d8'; let fs = 22; c.font = FONT(fs, 1); while (c.measureText(C.t).width > W - 60 && fs > 12) { fs -= 1; c.font = FONT(fs, 1); } c.fillText(C.t, W / 2, y0);
      c.fillStyle = '#b8c8f0'; c.font = FONT(11); c.fillText(C.p, W / 2, y0 + 22);
      const n = C.f.length; C.f.forEach((id, j) => { const s = 40, x = W / 2 - (n * (s + 10) - 10) / 2 + j * (s + 10), y = 150; const im = IMG['m_' + id]; const tj = Math.min(1, Math.max(0, (this.t - 0.5 - j * 0.15) / 0.3)); if (im) { c.save(); c.globalAlpha = a * tj; if (!G.met[id]) c.filter = 'brightness(0.15)'; c.drawImage(im, x, y, s, s); c.restore(); } });
      if (n) { c.fillStyle = '#8a9ad0'; c.font = FONT(9); c.fillText(n === 1 ? 'Fundador por conocer' : 'Fundadores por conocer', W / 2, 206); }
      c.textAlign = 'left'; c.globalAlpha = 1;
    }
  });
}
function chapterOnce(i) { if (G.flags['cap_' + i]) return Promise.resolve(); setFlag('cap_' + i); return chapterCard(i); }

// ------------------------------------------------------------ intro animada (enganche)
async function introCinematic() {
  G.scene = 'travel'; TRAVEL.t = 0; TRAVEL.label = ''; TRAVEL.dest = ''; TRAVEL.intro = true; AUD.play('tiempo');
  G.fade = 0;
  const lines = ['Un libro mágico…', 'un perro detective…', 'doce fundadores…', '¡y un viaje por la historia de Chile!'];
  for (const l of lines) { TRAVEL.dest = l; TRAVEL.t = 0; await sleep(1700); }
  TRAVEL.dest = ''; TRAVEL.intro = false; AUD.sfx('bark'); await sleep(300);
  await flash('#ffffff', 700);
  G.scene = 'world'; G.fade = 1;
}
