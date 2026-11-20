// =====================================================================
//  BARRIOS: amplían los mapas exteriores hacia el sur y el este (más aventura, más cosas que revisar).
//  Todo lo nuevo queda abajo y a la derecha del mapa original, así las coordenadas de la historia no cambian.
//  Datos curiosos: solo los verificados en fuentes/memoria_chilena.md.
// =====================================================================
'use strict';
const DATOS_EPOCA = {
  '1810': ['Las casas eran de adobe, con techos de tejas rojas y patios interiores.', 'En las pulperías se vendía de todo: velas, yerba mate, charqui y dulces.', 'De noche, los serenos recorrían las calles cantando la hora.',
    'Para cruzar el río Mapocho estaba el puente de Cal y Canto.', 'Manuel de Salas dirigió la reparación de los tajamares, los muros que protegían a Santiago de las crecidas del Mapocho.', 'Al Cabildo abierto del 18 de septiembre de 1810 solo se entraba con una «esquela de convite».'],
  '1814': ['La Aurora de Chile, el primer periódico, salió el 13 de febrero de 1812.', 'En 1812 la escarapela tricolor se volvió obligatoria.', 'Las señoras llevaban los colores patrios en el vestido, y a los niños les ponían cintas tricolores.',
    'En 1811 se reunió el primer Congreso Nacional.', 'La Biblioteca Nacional se creó en agosto de 1813.'],
  '1816': ['Para alejarse más de seis leguas de Santiago se necesitaba pasaporte.', 'Los soldados del regimiento Talavera vigilaban las calles.', 'Marcó del Pont gobernaba Chile en nombre del Rey desde diciembre de 1815.',
    'Muchos patriotas estaban desterrados en la isla Juan Fernández.', 'Las cartas secretas viajaban escondidas hasta Mendoza, al otro lado de la cordillera.'],
  '1817': ['Bernardo O\'Higgins nació en Chillán en 1778.', 'Salieron de Mendoza 9.821 mulas y 1.600 caballos para cruzar los Andes.', 'El 12 de febrero de 1817 el Ejército de los Andes triunfó en Chacabuco.', 'Desde fines de 1815, Mendoza se volvió un gran cuartel militar.'],
  '1818': ['El Acta de la Independencia se firmó en Concepción, con fecha 1 de enero de 1818.', 'En Cancha Rayada, el 19 de marzo de 1818, los realistas sorprendieron de madrugada al ejército patriota.', 'Doña Paula Jaraquemada recibió al ejército en su hacienda de Paine.', 'La batalla de Maipú fue el 5 de abril de 1818.'],
  '1823': ['Bernardo O\'Higgins dejó el mando el 28 de enero de 1823, en el Real Consulado.', 'La Biblioteca Nacional abrió al público el 19 de agosto de 1823.', 'Desde 1818, en los registros se escribía «chileno», también para los pueblos indígenas.'],
  '1832': ['Diego Portales fue nombrado ministro en 1830.', 'En 1832 Portales fue gobernador de Valparaíso.', 'El diario El Vigía se imprimió en Valparaíso en 1828.']
};
const VACIO = ['Solo hay paja y polvo. ¡Achís!', 'Está vacío… salvo por una araña que la saluda.', 'Hay trapos viejos y una cuchara de palo.', 'Nada por aquí… ¡nada por allá!', 'Huele a cebolla. Mejor cerrarlo.'];
const HUELLA = ['Hay pelitos blancos y cafés pegados… ¡Nemo pasó por aquí!', 'Alguien mordisqueó esta cuerda. Las marcas son de perrito…'];
function rngOf(seed) { let s = (seed * 2654435761) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// o: { sur, este, era, seed, estilo: 'ciudad'|'campo'|'campamento'|'puerto', rio, guardias, suelo, calle }
function ampliar(def, o) {
  const rows = def.rows.map(r => r.split(''));
  const h0 = rows.length, w0 = rows[0].length, W2 = w0 + (o.este || 0), H2 = h0 + (o.sur || 0);
  const base = o.suelo || (o.estilo === 'campo' ? '.' : ':'), calle = o.calle || ':';
  rows.forEach(r => { while (r.length < W2) r.push(base); }); while (rows.length < H2) rows.push(Array(W2).fill(base));
  const rnd = rngOf(o.seed || 7), pick = a => a[Math.floor(rnd() * a.length)];
  const P = def.props = (def.props || []).slice(), N = def.npcs = (def.npcs || []).slice(), OB = def.objs = (def.objs || []).slice();
  const taken = new Set(); const occ = (x, y, w = 1, h = 1) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) taken.add(xx + ',' + yy); };
  const free = (x, y, w = 1, h = 1) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { if (taken.has(xx + ',' + yy) || !rows[yy] || rows[yy][xx] === undefined) return false; } return true; };
  // conexión con el mapa viejo: abre el borde (sur y este) donde haya tierra o pasto
  if (o.sur) { for (let x = 0; x < w0; x++) if ('R#S~%T '.includes(rows[h0 - 1][x]) && x % 9 >= 3 && x % 9 <= 5) rows[h0 - 1][x] = calle; R(rows, 0, h0, W2, 2, calle); }
  if (o.este) { for (let y = 0; y < h0; y++) if ('R#S~%T '.includes(rows[y][w0 - 1]) && y % 9 >= 3 && y % 9 <= 5) rows[y][w0 - 1] = calle; R(rows, w0, 0, 2, H2, calle); }
  for (let x = 0; x < W2; x++) { occ(x, h0); occ(x, h0 + 1); } for (let y = 0; y < H2; y++) { occ(w0, y); occ(w0 + 1, y); }
  const datos = (DATOS_EPOCA[o.era] || []).slice(); let nDato = 0, nCont = 0;
  const contenedor = (type, x, y, fw = 1) => {
    if (!free(x, y, fw, 1)) return; occ(x, y, fw, 1); P.push([type, x, y]);
    const r = rnd(); const id = o.id + '_c' + (nCont++);
    const loot = r < 0.34 ? { item: 'manzana' } : r < 0.6 && datos.length ? { dato: datos.splice(Math.floor(rnd() * datos.length), 1)[0] } : r < 0.68 ? { txt: pick(HUELLA) } : { txt: pick(VACIO) };
    OB.push({ x, y, w: fw, sparkle: true, cond: '!cont_' + id, run: () => BUSCAR(id, type, loot) });
    OB.push({ x, y, w: fw, cond: 'cont_' + id, run: () => BUSCAR(id, type, loot) });
  };
  const zona = (x0, y0, w, h) => {   // llena un rectángulo con lotes
    let x = x0;
    while (x < x0 + w - 3) {
      const kind = o.estilo === 'campamento' ? pick(['carpa', 'carpa', 'fogata', 'pertrechos']) : o.estilo === 'campo' ? pick(['huerto', 'corral', 'arboleda', 'casita']) : o.estilo === 'puerto' ? pick(['bodega', 'bodega', 'muelle', 'plazuela']) : pick(['casa', 'casa', 'jardin', 'plazuela', 'huerto']);
      const lw = Math.min(x0 + w - x, kind === 'casa' || kind === 'bodega' || kind === 'casita' ? 7 : 6); if (lw < 4) break;
      const lh = Math.min(h, 6);
      if ((kind === 'casa' || kind === 'bodega' || kind === 'casita') && free(x, y0, lw - 1, 5)) {
        const hw = lw - 1, hh = kind === 'casita' ? 4 : 5;
        P.push(['house', x, y0, { w: hw, h: hh, door: [Math.floor(hw / 2)], wall: pick(['#f4ead4', '#f8e8c8', '#eedcd0', '#f0e0c8']), locked: pick(['Toc, toc… Nadie abre.', 'Se escucha a alguien cocinando adentro.', 'Una señora se asoma: «¡Buenas, mijita!».', kind === 'bodega' ? 'Es una bodega del puerto. Huele a café y a sal.' : 'La puerta está cerrada con llave.']) }]);
        occ(x, y0, hw, hh); contenedor(pick(['barrel', 'crate']), x + hw, y0 + hh - 1); if (rnd() < 0.5) contenedor(pick(['barrel', 'crate']), x - 1 >= x0 ? x - 1 : x + hw, y0 + hh - 2);
      } else if (kind === 'huerto') {
        R(rows, x, y0 + 1, lw - 2, Math.min(3, lh - 2), 'z'); occ(x, y0 + 1, lw - 2, 3); contenedor('haypile', x, y0 + 4, 2); contenedor('barrel', x + lw - 2, y0 + 1);
      } else if (kind === 'corral') {
        for (let k = 0; k < lw - 1; k++) if (free(x + k, y0)) { P.push(['fence', x + k, y0]); occ(x + k, y0); }
        N.push({ id: o.id + '_cab' + x, horse: pick(['horse', 'horseCafe', 'horseBlack']), x: x + 2, y: y0 + 2, dir: pick(['left', 'right']), wander: 1, talk: 'El caballo resopla y mueve la cola.' }); occ(x + 2, y0 + 2);
        contenedor('haypile', x, y0 + 3, 2);
      } else if (kind === 'arboleda' || kind === 'jardin') {
        for (let k = 0; k < 3; k++) { const tx = x + Math.floor(rnd() * (lw - 1)), ty = y0 + Math.floor(rnd() * (lh - 1)); if (free(tx, ty)) { P.push([pick(o.era === '1817' ? ['pino', 'tree'] : ['tree', 'naranjo', 'bush', 'alamo']), tx, ty]); occ(tx, ty); } }
        SET(rows, [[x + 1, y0 + lh - 2], [x + 3, y0 + 1]], '*'); contenedor(pick(['crate', 'olla']), x + lw - 2, y0 + lh - 2);
      } else if (kind === 'plazuela') {
        if (free(x + 1, y0 + 1, 2, 1)) { P.push(['well', x + 1, y0 + 1]); occ(x + 1, y0 + 1, 2, 1); } if (free(x + 3, y0 + 3)) { P.push(['lamp', x + 3, y0 + 3]); occ(x + 3, y0 + 3); }
        if (free(x, y0 + 4, 2, 1)) { P.push(['bench', x, y0 + 4]); occ(x, y0 + 4, 2, 1); } contenedor('olla', x + 4, y0 + 1);
      } else if (kind === 'carpa') {
        if (free(x, y0 + 1, 2, 1)) { P.push(['tent', x, y0 + 1]); occ(x, y0 + 1, 2, 1); } contenedor(pick(['crate', 'barrel']), x + 3, y0 + 1); if (free(x + 1, y0 + 4)) { P.push(['campfire', x + 1, y0 + 4]); occ(x + 1, y0 + 4); }
      } else if (kind === 'fogata') {
        if (free(x + 2, y0 + 2)) { P.push(['campfire', x + 2, y0 + 2]); occ(x + 2, y0 + 2); } contenedor('olla', x + 4, y0 + 2); contenedor('barrel', x, y0 + 4);
      } else if (kind === 'pertrechos') {
        contenedor('crate', x, y0 + 1); contenedor('crate', x + 1, y0 + 1); contenedor('barrel', x + 3, y0 + 1); if (free(x + 1, y0 + 3, 2, 1)) { P.push(['cannon', x + 1, y0 + 3]); occ(x + 1, y0 + 3, 2, 1); }
      } else if (kind === 'muelle') {
        contenedor('barrel', x, y0 + 1); contenedor('barrel', x + 1, y0 + 1); contenedor('crate', x + 3, y0 + 2); if (free(x + 1, y0 + 4, 3, 1)) { P.push(['boat', x + 1, y0 + 4]); occ(x + 1, y0 + 4, 3, 1); }
      }
      x += lw;
    }
  };
  if (o.sur) {
    const yA = h0 + 2, hA = (o.sur - 2) - (o.rio ? 4 : 0);
    zona(0, yA, w0, Math.min(6, hA)); if (hA >= 11) { R(rows, 0, yA + 6, w0, 1, calle); for (let x = 0; x < w0; x++) occ(x, yA + 6); zona(0, yA + 7, w0, hA - 7); }
    if (o.rio) { const yr = H2 - 3; R(rows, 0, yr, W2, 2, '~'); const bx = Math.floor(W2 / 2); R(rows, bx, yr, 2, 2, 'b'); R(rows, 0, H2 - 1, W2, 1, '.'); for (let x = 0; x < W2; x++) { occ(x, yr); occ(x, yr + 1); } }
  }
  if (o.este) {
    const xA = w0 + 2, wA = o.este - 2;
    for (let y = 1; y < h0 - 6; y += 7) zona(xA, y, wA, 6);
  }
  // vecinos que conversan (y, en la Reconquista, guardias que patrullan las calles nuevas)
  const quien = o.estilo === 'campamento' ? ['patriota', 'patriota', 'huaso'] : o.estilo === 'campo' ? ['huaso', 'vecina', 'nino'] : ['vecino', 'vecina', 'vecina2', 'nino', 'nina', 'fraile', 'huaso'];
  const charla = (DATOS_EPOCA[o.era] || ['¡Qué lindo día!']).slice();
  const zonas = []; if (o.sur) zonas.push([2, h0 + 1, w0 - 4, 1]); if (o.este) zonas.push([w0, 2, 1, h0 - 4]);
  for (let k = 0; k < (o.vecinos ?? 3) && zonas.length; k++) {
    const [zx, zy, zw, zh] = zonas[k % zonas.length]; const x = zx + Math.floor(rnd() * zw), y = zy + Math.floor(rnd() * zh); const sp = pick(quien);
    N.push({ id: o.id + '_v' + k, sprite: sp, speaker: sp, x, y, wander: 2, talk: charla.length ? charla.splice(Math.floor(rnd() * charla.length), 1)[0] : '¡Buenas, niña!' });
  }
  if (o.guardias && o.sur) {
    N.push({ id: o.id + '_g1', sprite: 'realista', speaker: 'realista', x: 4, y: h0, dir: 'right', guard: { route: 'R'.repeat(Math.min(24, w0 - 6)) + '.' + 'L'.repeat(Math.min(24, w0 - 6)) + '.', range: 5, onSee: e => interrogatorio(e) } });
    if (o.este) N.push({ id: o.id + '_g2', sprite: 'realista', speaker: 'realista', x: w0, y: 3, dir: 'down', guard: { route: 'D'.repeat(Math.min(16, h0 - 6)) + '.' + 'U'.repeat(Math.min(16, h0 - 6)) + '.', range: 5, onSee: e => interrogatorio(e) } });
  }
  def.rows = rows.map(r => r.join(''));
  return def;
}
// revisar un barril, cajón, fardo u olla
async function BUSCAR(id, type, loot) {
  const nombre = { barrel: 'el barril', crate: 'el cajón', haypile: 'la parva de paja', olla: 'la olla' }[type] || 'eso';
  if (G.flags['cont_' + id]) { await say(N, `Ya revisaste ${nombre}.`); return; }
  setFlag('cont_' + id); AUD.sfx('select');
  if (loot.item) { await say(N, `MG revisa ${nombre}… ¡una manzana roja y crujiente!`); await giveItem(loot.item); await say(N, 'En un Duelo de Ideas, comer algo te devuelve el ánimo.'); return; }
  if (loot.dato) { await say(N, `Dentro de ${nombre} hay un papel doblado. Es una nota de la bitácora del tío:`); await say(N, '«' + loot.dato + '»'); G.flags.datos = (G.flags.datos || 0) + 1; toast(`Datos curiosos encontrados: ${G.flags.datos}`, 3); return; }
  await say(N, loot.txt);
}
