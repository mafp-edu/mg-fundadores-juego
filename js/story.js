// =====================================================================
//  HISTORIA: escenas y misiones (basadas en los guiones y el libro 2025)
// =====================================================================
'use strict';
const N = null; // narrador
async function medal(id) { await giveMedal(id); setFlag('medalla_' + id); if (G.medals.length >= 12) setFlag('doce_medallas'); saveGame(); }
function meet(id) { if (!G.met[id]) { G.met[id] = true; const F = FOUNDERS.find(f => f.id === id); if (F) toast(`¡Despertó una página del libro: ${F.name}!`); } }
function removeProp(id) { const p = G.props.find(p => p.opts.id === id); if (!p) return; for (let y = p.y; y < p.y + p.fh; y++) for (let x = p.x; x < p.x + p.fw; x++) G.map.solid[y][x] = G.map.tiles[y][x].solid; G.props = G.props.filter(q => q !== p); }
function addProp(type, x, y, opts = {}) { const art = getPropArt(type, opts); const base = Array.isArray(art) ? art[0] : art; const pr = { type, x, y, fw: base.fw, fh: base.fh, art, opts }; G.props.push(pr); if (!opts.deco) for (let yy = y; yy < y + pr.fh; yy++) for (let xx = x; xx < x + pr.fw; xx++) G.map.solid[yy][xx] = true; return pr; }
function nemoJoin(id = 'nemo') {
  const e = G.ents.find(x => x.id === id); const x = e ? e.x : G.player.x, y = e ? e.y : G.player.y;
  despawn(id); setFlag('nemo_sigue'); G.follower = makeEnt({ id: 'nemo', x, y, dir: 'down', sprite: 'nemo', speed: 4.2, ghost: true, solid: false, glow: false }); if (G.player) G.player.crumbs = [];
}
async function nemoVanish() {
  const f = G.follower || G.ents.find(e => e.id === 'nemo'); if (!f) return;
  f.glow = true; AUD.sfx('bark'); await emote(f, '!', 700);
  for (let i = 0; i < 3; i++) { f.hidden = true; await sleep(120); f.hidden = false; await sleep(120); }
  sparkleAt(f.x, f.y, 30); await flash('#ffffff', 900);
  setTrail([[f.x, f.y], [f.x + 1, f.y], [f.x, f.y + 1]]);
  G.follower = null; despawn('nemo'); setFlag('nemo_sigue', false);
}
async function showImage(key) { await UI.push({ t: 0, update(dt) { this.t += dt; if (this.t > 0.5 && pressedAny('a', 'b')) { AUD.sfx('page'); this.resolve(); } }, draw(c) { c.fillStyle = 'rgba(10,8,20,0.8)'; c.fillRect(0, 0, W, H); const im = IMG[key]; if (im) { const s = Math.min(W - 40, H - 20) * Math.min(1, this.t * 4); c.drawImage(im, W / 2 - s / 2, H / 2 - s / 2, s, s); } } }); }
async function bookPage(id) { const i = FOUNDERS.findIndex(f => f.id === id); BOOK.page = i; BOOK.cutscene = true; AUD.sfx('page'); G.scene = 'book'; await new Promise(r => { const chk = () => { if (G.scene !== 'book') r(); else requestAnimationFrame(chk); }; chk(); }); BOOK.cutscene = false; }
async function letter(title, text, sign) {
  await UI.push({ t: 0, update(dt) { this.t += dt; if (this.t > 0.8 && pressedAny('a', 'b')) { AUD.sfx('page'); this.resolve(); } },
    draw(c) { c.fillStyle = 'rgba(10,8,20,0.75)'; c.fillRect(0, 0, W, H); box(c, 40, 10, W - 80, H - 20, 'parch'); c.fillStyle = COL.red; c.font = FONT(14, 1); c.textAlign = 'center'; c.fillText(title, W / 2, 34); c.textAlign = 'left'; c.font = FONT(12); const L = wrapRich(c, text.replace(/ \| /g, String.fromCharCode(10)), W - 120); drawRichLines(c, L, 60, 56, 15, Math.floor(this.t * 60), '#3a2414', COL.red); if (sign) { c.font = FONT(13, 1); c.fillStyle = '#5a3a20'; c.textAlign = 'right'; c.fillText(sign, W - 60, H - 26); c.textAlign = 'left'; } } });
}
async function narrate(text) { await say(N, text, { style: 'dark' }); }

// ------------------------------------------------------------ NEMO (cuando te sigue)
const NEMO_TALK = async () => {
  AUD.sfx('bark'); face('nemo', OPP[G.player.dir]); await emote('nemo', '♥', 600);
  const lines = ['¡Guau, guau! Nemo mueve la cola como un ventilador.', 'Nemo olfatea el aire… ¡Guau! Parece que quiere decir: «' + (G.objective || '¡vamos!').replace(/\.$/, '') + '».', 'Nemo te mira con sus ojos grandes. Su collar brilla suavecito.'];
  await say('nemo', lines[Math.floor(Math.random() * lines.length)]);
  if (typeof showHintNow === 'function') showHintNow();
};

// =================================================================== PRÓLOGO · CASA
const PROLOGO = async () => {
  G.fade = 1; G.fadeColor = '#000';
  await narrate('A veces, las aventuras más increíbles comienzan con un simple accidente…');
  enterMap('casa_pieza', 6, 6, 'down');
  await fadeIn(700);
  await chapterOnce(0);
  await sleep(300);
  await say('mg', '¡Hola! Mi nombre es *María Gracia*, pero todos me dicen *MG*. ¡Se pronuncia «eme-je»!');
  await say('mg', 'Tengo ocho años y voy a contarles cómo mi perro Nemo y yo vivimos una aventura que jamás olvidaremos.');
  await say(N, 'Camina con las *flechas* (o la cruceta). Habla y revisa cosas con *A* (Z, Espacio o Enter).');
  setObjective('Jugar con Nemo en mi pieza.');
};
const NEMO_CASA = async () => {
  if (G.flags.fin) { AUD.sfx('bark'); await say('nemo', '¡Guau! Nemo está feliz de estar en casa. Su collar ya no brilla.'); return; }
  if (!G.flags.juego_nemo) {
    face('nemo', 'mg');
    await say('mg', 'Este es Nemo, ¡el mejor detective de cuatro patas del mundo! Puede encontrar cualquier cosa perdida. Miren esto…');
    await say('mg', 'Nemo, ¡date vuelta y no mires!'); face('nemo', 'up'); AUD.sfx('bark');
    const i = await ask('¿Dónde escondo la pelota?', ['En la caja de juguetes', 'Debajo de la cama', 'Detrás de la planta']);
    const spots = [[4, 6, 'down'], [2, 4, 'left'], [10, 4, 'up']];
    await say(N, 'MG esconde la pelota con mucho cuidado…'); await sleep(300);
    face('nemo', 'down'); await emote('nemo', '?', 600); AUD.sfx('bark');
    await say(N, 'Snif, snif, snif… ¡Nemo olfatea!');
    const [tx, ty] = spots[i]; const n = findEnt('nemo'); n.ghost = true; n.wander = 0; const path = [];
    let x = n.x, y = n.y; while (x !== tx) { path.push(x < tx ? 'R' : 'L'); x += x < tx ? 1 : -1; } while (y !== ty) { path.push(y < ty ? 'D' : 'U'); y += y < ty ? 1 : -1; }
    await walk('nemo', path.join(''), 6); face('nemo', spots[i][2]); await emote('nemo', '!', 600); sparkleAt(tx, ty, 14);
    await say(N, '¡Nemo encontró la pelota en segundos!');
    await say('mg', '¿Ven? ¡Es asombroso!');
    await say('mg', 'Lo que nunca imaginé… es que algún día yo tendría que convertirme en detective para encontrarlo *a él*.');
    setFlag('juego_nemo'); await giveItem('pelota', 1, true);
    await sleep(300); await FLASHBACK();
    return;
  }
  if (G.flags.lab_visto && !G.flags.nemo_sigue) {
    await say('mg', '¡Nemo, ven conmigo! Vamos a probar tu collar nuevo en el laboratorio de mamá.');
    AUD.sfx('bark'); nemoJoin(); await say(N, 'Nemo te sigue moviendo la cola.'); setObjective('Llevar a Nemo al laboratorio (sótano, por el living).');
    return;
  }
  AUD.sfx('bark'); await say('nemo', '¡Guau! Nemo quiere jugar otra vez.');
};
const FLASHBACK = async () => {
  await say('mg', 'Todo comenzó cuando mi tío, que es profesor en la Universidad, me regaló algo muy especial para mi cumpleaños…');
  setFlag('flashback'); AUD.sfx('warp');
  await fadeOut('#fff', 500);
  enterMap('casa_living', 6, 4, 'down'); G.tint = 'sepia';
  spawn({ id: 'tio', sprite: 'tio', x: 2, y: 3, dir: 'down', speaker: 'tio' });
  await fadeIn(600);
  await narrate('Un año atrás…');
  await walk('tio', 'DDRRR'); face('tio', 'mg'); face('mg', 'tio');
  await say('tio', 'Feliz cumpleaños número siete, MG. Este regalo es muy especial. No se lo daría a cualquier niña.');
  await say(N, 'MG abre el papel brillante… ¡Es un libro de colores! «Pequeños Patriotas: Nuestros fundadores».');
  await say('mg', '¿Un libro de historia? Pero… ¿por qué se ven como niños?');
  await say('tio', 'Porque a veces necesitamos ver la historia con ojos de niño para entenderla mejor. ¿Quién sabe? Quizás algún día los conozcas en persona.');
  await say('tio', 'Y esta es mi *bitácora*: mapas antiguos y notas secretas. Te servirá si alguna vez te pierdes.');
  await giveItem('libro'); await giveItem('bitacora', 1, true); setFlag('tiene_libro');
  await say('tio', 'Un secreto: cada fundador que conozcas puede firmar su página. Dicen que cuando el libro tiene las *doce firmas*… pasan cosas mágicas.');
  await say(N, 'Puedes abrir el libro cuando quieras con *M*, *Tab* o el botón *LIBRO*. Ahí verás a los fundadores, tus medallas y la bitácora.');
  await say('mg', '(En ese momento no sabía lo importante que sería ese libro en mi aventura…)');
  await fadeOut('#fff', 500); setFlag('flashback', false);
  enterMap('casa_pieza', 6, 6, 'down'); await fadeIn(500);
  await say('mg', 'Mi mamá es una genio de los inventos. ¡Pasó meses construyendo una *nave del tiempo* en el sótano! Voy a verla.');
  setObjective('Ir al laboratorio de mamá (baja por la escalera del living).');
};
const ROPERO = async () => {
  if (G.flags.accidente && G.outfit !== 'mg') {
    await say('mg', 'Lo primero es encontrar la ropa adecuada para no llamar la atención en 1810.');
    await say('mg', 'Mi vestido café, que normalmente me parece aburrido, ¡será perfecto para la época!');
    await fadeOut('#000', 200); G.outfit = 'mg'; G.player.sprite = 'mg'; setFlag('vestido'); AUD.sfx('select'); await fadeIn(200);
    await say(N, '¡MG se puso su vestido café!');
    setObjective(G.flags.mochila ? 'Volver al laboratorio para viajar a 1810.' : 'Preparar la mochila en la cocina (living).');
    return;
  }
  await say('mg', 'Mi ropero. Aquí está mi vestido café… y mis zapatillas amarillas favoritas.');
};
const COCINA = async () => {
  if (G.flags.accidente && !G.flags.mochila) {
    await say('mg', 'Para el viaje: agua y una manzana, por si me da hambre.');
    await giveItem('agua'); await giveItem('manzana'); setFlag('mochila');
    setObjective(G.flags.vestido ? 'Volver al laboratorio para viajar a 1810.' : 'Ponerme el vestido café (ropero de mi pieza).');
    return;
  }
  await say(N, 'La cocina. Huele a queque recién horneado… ¡el mejor de los domingos!');
};
const PAPA_TALK = async () => { await say('papa', G.flags.fin ? '¡Qué aventura, MG! Pero la próxima vez… vuelve antes de la cena.' : '¿Vas al laboratorio? Tu mamá está terminando la nave. ¡Ten cuidado con los botones!'); };
const MAX_TALK = async () => { AUD.sfx('select'); await say('max', G.flags.fin ? '¡Nemo! ¡Nemo! ¡Nemooo!' : '¡Pelota! ¡Pelota! ¡Brrrum!'); await say('mg', G.flags.fin ? 'Max no suelta a Nemo desde que volvimos.' : 'Mi hermano Max tiene tres años. Es como un torbellino humano: ¡nunca para!'); };
const MAMA_TALK = async () => {
  if (G.flags.fin) { await say('mama', 'La nave quedó un poco chamuscada… ¡pero valió la pena! Puedes volver a visitar a tus amigos cuando quieras.'); return; }
  if (G.flags.accidente) { await say('mama', G.flags.vestido && G.flags.mochila ? 'Todo listo. Súbete a la nave cuando quieras, MG.' : 'Prepárate bien: ropa de la época y algo para comer. ¡Te esperamos aquí!'); return; }
  await say('mama', 'Ya casi está lista, MG. Solo falta probar el collar de Nemo.');
};
const LAB_ENTER = async () => {
  if (!G.flags.lab_visto && G.flags.tiene_libro) {
    await say('mg', '¡El laboratorio! Les juro que algunas partes de la nave parecen sacadas de nuestra lavadora… ¡pero eso la hace más especial!');
    face('mama', 'mg');
    await say('mama', '¡MG! Mira: botones de todos los colores. Rojos como tomates, azules como el mar y amarillos como el sol del desierto.');
    await say('mg', 'Y dos asientos acolchados: uno para mí y otro para Nemo. ¡Ya terminamos su collar especial!');
    await say('mama', 'Entonces trae a Nemo. Probaremos que el collar se conecte con la nave.');
    setFlag('lab_visto'); setObjective('Traer a Nemo desde mi pieza hasta el laboratorio.');
    return;
  }
  if (G.flags.accidente && G.flags.vestido && G.flags.mochila && !G.flags.viaje1) { await PARTIDA(); }
};
const ACCIDENTE = async () => {
  setFlag('accidente');
  await say('mg', 'Este collar con la más alta tecnología permitirá que Nemo pueda viajar conmigo al pasado sin problemas. ¡Lo fabricamos mamá y yo juntas!');
  await giveItem('collar', 1, true);
  await say(N, 'Se escuchan pasos rápidos y risas que bajan por la escalera…');
  spawn({ id: 'max', sprite: 'max', x: 12, y: 8, dir: 'left', speaker: 'max' });
  await emote('mg', '!', 600);
  await say('mg', '¡Oh, no! Ahí viene Max.');
  const f = G.follower; G.follower = null; spawn({ id: 'nemo', sprite: 'nemo', x: f.x, y: f.y, dir: f.dir, ghost: true });
  await walk('max', 'LLLLU', 9);
  await say('mg', '¡MAX, CUIDADO!');
  AUD.sfx('hit'); await shake(300);
  const n = findEnt('nemo'); n.x = 7; n.y = 4; n.px = 7 * 16; n.py = 4 * 16; n.dir = 'up';
  await say(N, '¡ZUÁCATE! Max tropieza y empuja a Nemo… ¡que aterriza justo sobre el panel de control!');
  await say(N, 'Las luces del collar empiezan a parpadear, igual que las luces de la nave. Todo brilla cada vez más…');
  face('nemo', 'down'); await emote('nemo', '!', 600);
  await say('mg', '¡Oh, no, no, NO!');
  await nemoVanish();
  await say('mg', '¡NEMOOO! ¿DÓNDE ESTÁS?');
  spawn({ id: 'papa', sprite: 'papa', x: 12, y: 8, dir: 'left', speaker: 'papa' });
  await walk('papa', 'LLLU', 7);
  face('papa', 'up'); await sleep(500);
  await say('papa', 'La máquina se activó… Según estas coordenadas… ¡No puede ser!');
  await say('mg', '¿Qué pasa, papá? ¿Dónde está Nemo?');
  await say('papa', '¡Nemo viajó al *Santiago de 1810*! ¡Está cerca de la casa de don *Mateo de Toro y Zambrano*!');
  await say('mg', '¿Don Mateo? ¿Quién es ese? Lo he escuchado antes… ¡Esperen! ¡El libro del tío!');
  await showImage('pagina_mateo');
  await say('mg', '«Este pequeño y elegante fundador una simpática peluca ocupó. Siempre preocupado de la gente, instruyó una reunión urgente.»');
  await say('mg', '¿Y por qué Nemo aparece en esta página?');
  meet('mateo');
  await say('mg', '¡Tengo que ir por Nemo! Debe estar asustado en un lugar tan extraño y con gente que no conoce.');
  const i = await ask('Pero… nunca he viajado en el tiempo.', ['¿Y si me pierdo?', '¡Voy a encontrarlo!']);
  if (i === 0) await say('papa', 'Tienes el libro y la bitácora de tu tío. Y eres la niña más valiente que conozco.');
  await say('papa', 'Ya programé las coordenadas. Pero antes, prepárate: ropa de la época y algo para comer.');
  setFlag('accidente_visto');
  setObjective('Ponerme el vestido café (ropero de mi pieza) y preparar la mochila (cocina).');
};
const PARTIDA = async () => {
  spawn({ id: 'papa', sprite: 'papa', x: 9, y: 6, dir: 'left', speaker: 'papa' }); spawn({ id: 'max', sprite: 'max', x: 3, y: 6, dir: 'right', speaker: 'max' });
  face('mama', 'mg');
  await say('mama', 'Ten mucho cuidado, MG. Y recuerda ser educada con don Mateo. En esa época los niños eran muy respetuosos con los adultos.');
  await say('papa', 'Te llevará a unos metros de la Plaza de Armas. Pero recuerda: *tienes que volver antes de la cena*.');
  await walk('max', 'R'); face('max', 'mg');
  await say('max', 'Lo siento, MG…');
  await say('mg', 'No te preocupes, Max. Voy a traer de vuelta a Nemo.');
  await say('papa', 'Cinco… cuatro… tres…'); await say('mama', '¡Cuídate mucho!'); await say('max', '¡Dos… uno!');
  await say('mg', 'Nemo, allá voy. Si alguien tiene a mi perro en algún lugar de la historia… ¡lo voy a encontrar!');
  setFlag('viaje1'); setObjective('Encontrar a Nemo en el Santiago de 1810.', true);
  await timeTravel(DESTS[1]);
};

// =================================================================== CAPÍTULO 1 · SANTIAGO 1810
const STGO1810_ENTER = async () => {
  if (G.flags.jinete_pendiente && !G.flags.jinete_visto) { await JINETE_ESCENA(); return; }
  if (!G.flags.llego_1810) {
    setFlag('llego_1810'); await chapterOnce(1);
    await say('mg', 'Es como si hubieran pintado la ciudad de nuevo, pero con colores más… ¿antiguos?');
    await say('mg', 'Calles de tierra, casas bajas con techos de tejas rojas, ¡y caballos en lugar de autos!');
    await say('mg', 'Según el mapa de mi tío, debo buscar a don Mateo cerca de un edificio llamado *Real Consulado*. Está a pasos de la Plaza de Armas, en la esquina de las calles Bandera y Compañía.');
    await say('vendedora', '¡Dulces! ¡Dulces frescos!');
    await say('mg', 'Mmm… ¡no! *Primero Nemo, después dulces.*');
    setObjective('Buscar a don Mateo frente al Real Consulado (al norte de la plaza).');
    await sleep(400); toast('Consejo: mantén B (o Shift) para correr. La flecha dorada te guía.', 5);
  }
};
const MATEO_PLAZA = async () => {
  if (!G.flags.mateo_conocido) {
    setFlag('mateo_conocido');
    await say('mg', '(¡Es él! Una peluca blanca y esponjosa… ¡igual que en el libro!)');
    await say('mateo', '¿Te has perdido, pequeña?');
    await say(N, 'MG hace una reverencia, como le enseñó su mamá.');
    await say('mg', 'Buenos días, señor. Me llamo María Gracia. Estoy buscando a mi perro Nemo. Tiene un collar brillante y muy especial.');
    await say('mateo', 'Un perrito con collar brillante… Sí, me pareció verlo correteando por los pasillos del Real Consulado. Los guardias intentaron atraparlo, pero es bastante escurridizo.');
    await say('mg', '¡Es Nemo! ¿Puedo entrar a buscarlo, por favor?');
    await say('mateo', 'Claro… pero hoy es un día muy especial. Convoqué a una *reunión urgente*: un Cabildo abierto con los vecinos de Santiago.');
    await say('mateo', 'Me faltan tres invitaciones por entregar, y mis piernas ya no son las de antes. ¡Tengo 83 años! ¿Me ayudarías?');
    meet('mateo');
    await giveItem('invitacion', 3);
    setObjective('Entregar 3 invitaciones a los vecinos de la plaza (0/3).');
    return;
  }
  const n = G.flags.inv || 0;
  if (n < 3) { await say('mateo', `Llevas ${n} de 3 invitaciones. Busca a los vecinos: uno junto a la pileta, una señora cerca de la Catedral y un huaso junto a la carreta.`); return; }
  await say('mateo', '¡Excelente, María Gracia! Eres muy amable. Ahora sí: ¡que comience el Cabildo abierto! Ven, te mostraré el lugar mientras buscamos a tu perrito.');
  setFlag('cabildo_abierto');
  await walk('mateo', 'RR'); face('mateo', 'up'); await sleep(200); despawn('mateo'); despawn('guardia'); AUD.sfx('door');
  setObjective('Entrar al Real Consulado.');
};
const INVITADO = async (k) => {
  const done = G.flags['inv' + k];
  const L = {
    1: ['¿Una invitación de don Mateo? ¡Qué honor! Allí estaré.', 'Mientras el rey esté prisionero, alguien tiene que cuidar el Reino de Chile, ¿no crees?', 'Gracias, niña. Nos vemos en el Consulado.'],
    2: ['¡Ay, mijita, gracias! Mi esposo no se lo va a perder.', 'Dicen que hoy, 18 de septiembre, es un día que recordaremos por siempre.', 'Que Dios te bendiga, pequeña.'],
    3: ['¡Buena, patroncita! ¿Al Cabildo? ¡Me pongo mi mejor manta!', 'Vengo del campo. Allá también queremos que nos escuchen.', '¡Allá nos vemos!']
  }[k];
  const who = { 1: 'vecino', 2: 'vecina2', 3: 'huaso' }[k];
  if (!G.flags.mateo_conocido || !hasItem('invitacion') && !done) { await say(who, k === 3 ? '¿Viste el Real Consulado? ¡Hoy hay mucho movimiento!' : 'Buenos días, niña. ¡Qué alboroto hay hoy en la plaza!'); return; }
  if (done) { await say(who, L[2]); return; }
  takeItem('invitacion'); setFlag('inv' + k); G.flags.inv = (G.flags.inv || 0) + 1; AUD.sfx('correct');
  await say(N, 'MG entrega una invitación.'); await say(who, L[0]); await say(who, L[1]);
  setObjective(G.flags.inv >= 3 ? 'Volver donde don Mateo, frente al Real Consulado.' : `Entregar 3 invitaciones a los vecinos de la plaza (${G.flags.inv}/3).`);
};
const VENDEDORA_1810 = async () => {
  if (!G.flags.dulce1810 && G.flags.cabildo_abierto) { await say('vendedora', '¡Qué niña más educada! Toma, mijita, un dulce de regalo. Para el camino.'); await giveItem('dulce'); setFlag('dulce1810'); return; }
  await say('vendedora', G.flags.cabildo_abierto ? '¡Dulces! ¡Dulces frescos!' : '¡Dulces frescos! Vuelve cuando termines tus mandados, mijita.');
};
const CABILDO_ENTER = async () => {
  if (!G.flags.cabildo_dentro) {
    setFlag('cabildo_dentro');
    await say('mg', 'Es como un palacio… candelabros, cuadros de reyes y estantes llenos de libros.');
    face('mateo', 'mg');
    await say('mateo', 'Este es el Real Consulado. Hoy caben aquí más de cuatrocientos vecinos. Ven, junto al gran mapa: te quiero mostrar algo.');
    setObjective('Hablar con don Mateo junto al gran mapa.');
  }
};
const MATEO_CABILDO = async () => {
  if (!G.flags.mapa_visto) {
    await say('mateo', 'Se nota por tu forma de hablar y de mirar todo… Eres diferente, ¿verdad?');
    await say('mg', 'Vengo de… muy lejos, señor.');
    await say('mateo', 'No te preocupes. Los tiempos están cambiando. ¿Sabes? Hoy estamos decidiendo si el Reino de Chile debe *gobernarse a sí mismo*.');
    await say('mg', '¿Gobernarse a sí mismo? ¿Quién lo gobierna ahora?');
    await MAPA_ESPANA(true);
    return;
  }
  if (!G.flags.duelo_dudoso) { await say('mateo', 'Ese vecino de allá tiene muchas dudas. ¿Por qué no conversas con él? A veces una niña explica mejor que un viejo como yo.'); return; }
  await say('mateo', 'Gracias a ti, más vecinos entienden lo que está en juego. ¡Llegó la hora!');
  await say(N, 'Los vecinos se acercan a la gran mesa. Don Mateo toma la palabra…');
  await say('mateo', 'Mientras nuestro rey esté prisionero, formaremos una *Junta de Gobierno* para cuidar de esta tierra. ¡Es nuestro primer paso!');
  await say(N, '¡Aplausos en el gran salón! Es el 18 de septiembre de 1810: nace la *Primera Junta Nacional de Gobierno*.');
  await say('mateo', 'María Gracia… ¿qué es ese libro que llevas? ¿Hay una página con mi dibujo? ¡Qué peluca más simpática! Déjame firmarla.');
  await medal('mateo');
  await say('mateo', '¡Ah! Mira hacia allá, junto a los estantes: mi buen amigo *Manuel de Salas*, uno de los hombres más sabios de Chile. Y a sus pies…');
  await say('mg', '¡NEMO!');
  setObjective('Ir donde Manuel de Salas y Nemo (junto a los estantes).');
  despawn('mateo'); G.ents.push(makeEnt({ id: 'salas', sprite: 'salas', speaker: 'salas', x: 20, y: 6, dir: 'down', talk: () => SALAS() })); G.ents.push(makeEnt({ id: 'nemo', sprite: 'nemo', x: 21, y: 6, dir: 'down', glow: true }));
};
const MAPA_ESPANA = async (fromMateo) => {
  if (!fromMateo) { await say(N, 'Un gran mapa de España y América. ¡Hay un océano enorme entre los dos!'); if (G.flags.mapa_visto || G.flags.medalla_mateo) return; if (!G.flags.cabildo_dentro) return; await say('mg', 'Mejor le pregunto a don Mateo.'); return; }
  await say('mateo', 'Mira: nosotros estamos aquí, en Chile. Y muy lejos, al otro lado del océano, está España. Durante muchos años, los reyes de España han decidido todo lo que hacemos aquí.');
  await say('mateo', 'Imagina que tus padres estuvieran tan lejos que tardaran *meses* en responderte. Y que además tuvieran problemas muy graves en casa.');
  await say('mateo', 'El rey ha sido capturado por los franceses y hay mucha confusión. Por eso hoy debemos decidir: ¿seguimos esperando órdenes que no llegan, o aprendemos a tomar nuestras propias decisiones?');
  await say('mg', 'Como cuando aprendí a nadar… Tenía miedo, pero quería hacerlo sola.');
  await say('mateo', '¡Precisamente! Y seguro fallaste algunas veces antes de lograrlo. Quizás nos equivoquemos al principio, pero si trabajamos mucho, aprenderemos a hacerlo bien.');
  await say('mg', '¡Exacto! Por eso somos todos chile…');
  await emote('mg', '!', 600);
  await say('mg', '(Espera… en los papeles de 1810 todavía nos anotan como «españoles»…)');
  await card('¡Ups! Casi me equivoco…', ['En 1810 Chile era parte del Reino de España. En los registros oficiales, a quien nacía aquí se le anotaba como *español, natural de esta tierra*.', 'El 3 de junio de 1818, después de la Batalla de Maipú, un decreto de O\'Higgins ordenó escribir *chileno* en los registros, y llamar chilenos también a los pueblos indígenas. ¡Eso es 8 años en el futuro desde donde estoy!', 'Construir una identidad toma tiempo. Primero hay que conquistar la libertad… ¡y después decidir cómo llamarnos!'], [['1810', 'Primera Junta', true], ['1818', '«Chilenos»']]);
  setFlag('mapa_visto');
  await say('mateo', 'Hmm… ese vecino de allá no está convencido de nada. ¿Por qué no conversas con él?');
  setObjective('Convencer al Vecino Dudoso (Duelo de Ideas).');
};
const DUDOSO = async () => {
  if (!G.flags.mapa_visto) { await say('vecino2', '¿Gobernarnos solos? ¡Qué idea más rara! Habla primero con don Mateo, niña.'); return; }
  await say('vecino2', '¿Y tú quién eres? ¿Vienes a decirme que no necesitamos al rey?');
  await battle(OPPONENTS.dudoso);
  setFlag('duelo_dudoso'); despawn('dudoso');
  setObjective('Volver donde don Mateo.');
};
function LIBROS_SALAS() {
  return [[17, 4], [22, 11], [15, 13]].map(([x, y], i) => ({ x, y, sparkle: true, show: 'b_libro', cond: 'buscar_libros&!libro' + (i + 1), run: async () => { setFlag('libro' + (i + 1)); G.flags.libros = (G.flags.libros || 0) + 1; await giveItem('libro_salas', 1); setObjective(G.flags.libros >= 3 ? 'Devolver los libros a Manuel de Salas.' : `Recoger los libros de Manuel de Salas (${G.flags.libros}/3).`); } }));
}
const SALAS = async () => {
  if (!G.flags.nemo_salas) {
    await say('mg', '(Manuel de Salas… ¡Aquí está en el libro!)');
    await bookPage('salas'); meet('salas');
    await say('mg', '«Este pequeño y educado fundador con mucha pasión trabajó…» ¡Él sueña con escuelas y bibliotecas!');
    await say(N, 'Nemo ve a MG, levanta las orejas y… ¡sale corriendo feliz entre los estantes!');
    AUD.sfx('bark');
    const n = findEnt('nemo'); n.ghost = true; await walk('nemo', 'DDDDLLL', 9); AUD.sfx('hit'); await shake(250); await walk('nemo', 'RRRRUU', 9);
    await say(N, '¡PAF, PAF, PAF! Unos libros caen de los estantes y quedan desparramados.');
    await walk('nemo', 'LLL', 7); face('nemo', 'mg');
    await say('mg', '¡Nemo! ¡Te encontré! Estaba tan preocupada…');
    nemoJoin(); setFlag('nemo_salas'); AUD.sfx('bark');
    await say('salas', '¿Así que este inteligente animalito te pertenece? Ha estado conmigo toda la mañana, como si entendiera cada palabra sobre educación y progreso.');
    await say('salas', '…aunque ahora desordenó mis libros. ¿Me ayudas a recogerlos? Son tres.');
    setFlag('buscar_libros'); setObjective('Recoger los libros de Manuel de Salas (0/3). ¡Nemo te ayuda a olfatearlos!');
    return;
  }
  if ((G.flags.libros || 0) < 3) { await say('salas', `Llevas ${G.flags.libros || 0} de 3 libros. Busca los destellos en el suelo del salón.`); return; }
  takeItem('libro_salas', 3);
  await say('salas', '¡Gracias, María Gracia! Me impresiona tu interés por la educación. ¿Sabes por qué creo que es tan importante?');
  await say('salas', 'Porque la libertad sin educación es como tener las llaves de una casa sin saber leer las direcciones. Puedes salir, pero no sabes a dónde ir.');
  await say('salas', 'Sueño con un Chile donde todos los niños puedan aprender a leer y escribir. Con escuelas en cada rincón y una gran biblioteca para guardar todo el conocimiento.');
  await say('mg', '¡Una biblioteca! Por eso usted fue el primer director de la Biblio…');
  await emote('mg', '!', 600);
  await card('¡Otra vez casi me equivoco!', ['Estamos en 1810, pero la *Biblioteca Nacional de Chile* se creó el 19 de agosto de *1813*.', 'Y aunque Manuel de Salas sueña ahora con esa biblioteca, será nombrado su Director recién en *1818*.', 'Los sueños tardan en hacerse realidad: primero hay que soñarlos, después planificarlos y finalmente trabajar muy duro. ¡Como aprender a andar en bicicleta!'], [['1810', 'Hoy', true], ['1813', 'Biblioteca'], ['1818', 'Director']]);
  await say('salas', '¿Te encuentras bien, pequeña?');
  await say('mg', 'Sí, señor. Solo pensaba en lo maravilloso que será cuando su sueño se haga realidad. Pero… ¿cómo logramos que todos lean? ¿Los obligamos?');
  await say('salas', 'No. Para lograr grandes sueños debemos trabajar juntos y dar libertad a las personas. Es la suma de los esfuerzos de cada uno lo que transformará nuestra tierra.');
  await say('salas', 'Déjame firmar tu libro. ¡Que nunca dejes de leer!');
  await medal('salas');
  await say('salas', 'Hay otras personas valientes que comparten estos sueños. Como doña *Javiera Carrera*: inteligente, valiente… Me recuerda a ti.');
  await say(N, 'En el momento en que dice «Javiera Carrera», el collar de Nemo empieza a brillar intensamente…');
  await say('mg', 'Nemo, ¿qué te pasa? ¡No, Nemo, no otra vez!');
  await nemoVanish(); despawn('salas');
  await say('mg', '¡NEMOOO!');
  setFlag('jinete_pendiente');
  setObjective('Buscar a Nemo.');
  await say('mg', '¡Nemo, espérame!');
  await runTo('mg', 11, 15, 9);
  await warp('stgo1810', 17, 9, 'down');   // al entrar a la plaza sigue la escena (JINETE_ESCENA)
};
// camino más corto (por baldosas) para escenas automáticas
async function runTo(id, x, y, speed = 8) {
  const e = findEnt(id); if (!e) return false; const path = bfsPath(e.x, e.y, x, y); if (!path) return false;
  let s = ''; for (let i = 1; i < path.length; i++) { const [ax, ay] = path[i - 1], [bx, by] = path[i]; s += bx > ax ? 'R' : bx < ax ? 'L' : by > ay ? 'D' : 'U'; }
  if (s) await walk(id, s, speed); return true;
}
// MG sale corriendo, se detiene en el parque y llega el jinete de capa azul (O'Higgins, sin decir su nombre)
const JINETE_ESCENA = async () => {
  if (G.flags.jinete_visto) return;
  G.tint = 'atardecer'; AUD.play('triste');
  await runTo('mg', 25, 23, 9);
  face('mg', 'down');
  await say('mg', '(Se volvió a ir… ¿Por qué sigue desapareciendo? ¿Qué estoy haciendo mal?)');
  await emote('mg', '…', 1200);
  await say(N, 'MG se sienta en una piedra del parque, agotada y triste. Las calles se ven cada vez más vacías…');
  AUD.sfx('gallop'); await sleep(600);
  spawn({ id: 'jinete', horse: 'jinete', speaker: 'jinete', x: G.map.w - 2, y: 23, dir: 'left', ghost: true, talk: () => JINETE() });
  await say(N, 'De repente, se escuchan cascos de caballo…');
  AUD.sfx('gallop'); await walk('jinete', 'L'.repeat(Math.max(1, G.map.w - 2 - 27)), 6);
  face('mg', 'right');
  await JINETE();
};
const JINETE = async () => {
  if (G.flags.jinete_visto) { await say('jinete', 'Que tengas suerte en tu búsqueda, pequeña patriota.'); return; }
  setFlag('jinete_visto');
  await say(N, 'Un jinete en un caballo blanco, con capa azul y unas patillas colorinas, se detiene frente a ella.');
  await say('jinete', '¿Te encuentras bien, pequeña? Pareces muy preocupada.');
  await say('mg', 'Perdí a mi perro otra vez. Se llama Nemo y tiene un collar muy especial. Desapareció justo cuando el señor De Salas nombró a una señora llamada Javiera Carrera.');
  await say('jinete', '¿Doña Javiera? Una mujer extraordinaria. Parece que tu perro tiene muy buen criterio para elegir a las personas importantes de esta tierra.');
  await emote('mg', '!', 700);
  await say('mg', '¡Eso es! ¡Nemo está siguiendo a los *fundadores*! ¡Está visitando a las personas que ayudaron a construir Chile!');
  await say('jinete', 'A veces las respuestas están más cerca de lo que pensamos. Si tu perro busca a doña Javiera, tal vez deberías hacer lo mismo.');
  await bookPage('javiera');
  await say('mg', '«Azul, blanco y amarillo fueron los colores que ella eligió»… ¡Aquí dice que vivía cerca de la Alameda! Y hay una fecha: *1814*.');
  await say('mg', '¿Viajar al futuro? Pero si recién vine al pasado… No quiero… ¿Y si no vuelvo a ver a Nemo?');
  await say('jinete', '¡Debes tener valor! El valor no está en no tener miedo, sino en seguir adelante a pesar del miedo. ¡Tú puedes!');
  await say('mg', '(Ahora entiendo: Nemo va de fundador en fundador… y mi camino es seguirlo y conocerlos a todos. ¡El libro es mi mapa!)');
  await say('jinete', 'Que tengas suerte, pequeña patriota… que nuestra tierra nos vuelva a encontrar.');
  AUD.sfx('gallop'); const j = findEnt('jinete'); if (j) { j.ghost = true; await walk('jinete', 'UUUULLLLLLLL', 8); despawn('jinete'); }
  setFlag('jinete_pendiente', false); setFlag('dest1814'); G.tint = null; AUD.play('colonia');
  setObjective('Volver a la nave (esquina sureste de la plaza) y viajar a 1814.');
};

// =================================================================== CAPÍTULO 2 · LA ALAMEDA 1814
const ALAMEDA_ENTER = async () => {
  if (!G.flags.llego_1814) {
    setFlag('llego_1814'); await chapterOnce(2);
    await say('mg', '1814… se siente diferente. Hay más movimiento, banderas de colores… como si la ciudad estuviera más… ¿despierta?');
    await say('mg', 'El libro dice: «Casa de los Carrera, cerca de la Alameda. Una casa con jardín grande y banderas de colores». ¡Debe ser fácil de encontrar!');
    setObjective('Buscar la casa de los Carrera: jardín grande y telas de colores.');
  }
};
const JARDIN_ENTRAR = async () => {
  if (G.flags.nemo_javiera) return;
  await say('mg', '¡Ahí están los colores! Azul como el cielo, blanco como las nubes y amarillo como el sol… y entre ellos… ¡NEMO!');
  const n = findEnt('nemo'); if (n) { n.ghost = true; const p = G.player; AUD.sfx('bark'); const dx = p.x - n.x, dy = p.y - n.y; let path = ''; for (let i = 0; i < Math.abs(dy) - 1; i++) path += dy > 0 ? 'D' : 'U'; for (let i = 0; i < Math.abs(dx); i++) path += dx > 0 ? 'R' : 'L'; if (path) await walk('nemo', path, 7); }
  await say('mg', '¡Te encontré otra vez! Pero esta vez creo que entiendo qué estás haciendo.');
  nemoJoin(); setFlag('nemo_javiera'); meet('javiera');
  await say('javiera', '¿Así que este valiente compañero es tuyo? Ha estado aquí toda la mañana, observando muy atento cómo trabajo en nuestra bandera.');
  setObjective('Hablar con doña Javiera Carrera.');
};
const JAVIERA = async () => {
  if (!G.flags.javiera_hablo) {
    setFlag('javiera_hablo'); meet('javiera');
    await say('mg', 'Buenos días, señora. Soy María Gracia. He… he escuchado hablar de usted.');
    await say('javiera', '¿En serio? Espero que sean cosas buenas. Te cuento: en estos años han pasado muchas cosas. En 1811 se reunió el *primer Congreso Nacional*, para escribir nuestras propias leyes.');
    await say('javiera', 'Y en 1812 salió la *Aurora de Chile*, ¡el primer periódico del país! Lo escribía fray Camilo Henríquez, y la gente lo leía en voz alta.');
    await say('javiera', 'Y gracias al trabajo de Manuel de Salas, los hijos de los esclavos ahora nacen libres.');
    await say('mg', '¿Manuel de Salas? ¡Lo logró!');
    await say('javiera', 'Pero aún no somos completamente libres. Por eso esta bandera es tan importante… ¡Oh, no! ¡El viento se llevó mis telas!');
    await say('javiera', 'La azul, la blanca y la amarilla. Sin ellas no puedo terminar la bandera. ¿Me ayudas a encontrarlas por la Alameda?');
    setFlag('buscar_telas'); setObjective('Recuperar las 3 telas que se llevó el viento (0/3).');
    return;
  }
  if (!G.flags.telas_listas) {
    const n = ['tela_azul', 'tela_blanca', 'tela_amarilla'].filter(t => hasItem(t)).length;
    if (n < 3) { await say('javiera', `Tienes ${n} de 3 telas. Pregunta por la Alameda: los niños y los vendedores lo ven todo.`); return; }
    await say('javiera', '¡Las encontraste todas! Ahora ayúdame a coserlas. Sigue la secuencia de colores con la aguja.');
    await simon({ title: 'La costura de la bandera', help: 'Mira los colores que se iluminan… ¡y repítelos!', symbols: [{ dir: 'up', label: 'Azul', color: '#2a5ab8', note: 'C5' }, { dir: 'left', label: 'Blanco', color: '#e8e8ee', textCol: '#2a1e2e', note: 'E5' }, { dir: 'right', label: 'Amarillo', color: '#e8b820', note: 'G5' }], rounds: [3, 4, 5], inst: 'guitarra', win: '¡La bandera quedó preciosa!' });
    takeItem('tela_azul'); takeItem('tela_blanca'); takeItem('tela_amarilla'); setFlag('telas_listas');
    const p = G.props.find(q => q.type === 'telas_vacio'); if (p) { G.props = G.props.filter(q => q !== p); addProp('telas', 9, 3); }
    sparkleAt(10, 3, 20);
    await say('javiera', 'Esta bandera es un símbolo de nuestra tierra, de nuestro mar, de nuestras montañas, de nuestro campo y de nuestra gente.');
    await say('mg', '¡Es preciosa! Pero… le falta la estre…');
    await emote('mg', '!', 600);
    await card('¡Casi cometo otro error!', ['Estamos en 1814 y doña Javiera trabaja en la bandera de la *Patria Vieja*: azul, blanca y amarilla. Ella bordó la primera en 1812.', 'La bandera con la *estrella solitaria*, la que conocemos hoy, se creó el 18 de octubre de *1817*: ¡tres años en el futuro!', 'Los símbolos patrios también crecen, como las personas. Como cuando dibujas algo bonito y después le agregas más detalles.'], [['1812', '1.ª bandera'], ['1814', 'Hoy', true], ['1817', 'Estrella']]);
    await say('javiera', 'Pareces algo confundida, ¿te encuentras bien?');
    await say('mg', 'Sí, señora. Solo admiraba su bandera. ¿Puedo preguntarle algo? He escuchado mucho eso de la *patria*… ¿qué es?');
    await say('javiera', 'La patria, María Gracia, es como el hogar más grande que puedas imaginar. No solo la casa donde vives, sino toda la tierra que compartes con tu familia.');
    await say('javiera', 'Son estas montañas que nos cuidan, estos valles que nos alimentan y estos ríos que nos dan vida. Y también la gente: nuestras tradiciones, canciones, comidas y sueños compartidos.');
    await say('mg', 'Como cuando toda mi familia se junta en Navidad. Aunque vengamos de lugares diferentes, todos somos parte de lo mismo.');
    await say('javiera', '¡Exactamente! Déjame firmar tu libro… y toma: dulces de miel, para ti y para tu valiente compañero.');
    await medal('javiera'); await giveItem('miel', 2);
    await say(N, 'Un momento de tranquilidad… hasta que se escucha un galope acelerado. Urgente. Preocupado.');
    AUD.sfx('gallop'); await sleep(600);
    await say('javiera', 'Ese galope… conozco ese sonido. Es uno de mis hermanos… y trae noticias urgentes.');
    await RANCAGUA();
    return;
  }
  await say('javiera', G.flags.medalla_jmcarrera ? 'Gracias por darle ánimo a mi hermano, María Gracia. Nunca olvides lo que es la patria.' : 'Mi hermano necesita descansar. Ayuda a los soldados, por favor.');
};
const TELA_AZUL = async () => { AUD.sfx('bark'); await say(N, 'Nemo ladra mirando hacia arriba… ¡La tela azul está enredada en las ramas del álamo!'); await say(N, 'MG sacude el tronco con fuerza y… ¡la tela cae flotando!'); await giveItem('tela_azul'); setFlag('tela_azul'); telasObj(); };
const TELA_BLANCA = async () => {
  if (!G.flags.buscar_telas) { await say('nino', '¡Me gusta mirar los patos de la acequia!'); return; }
  if (G.flags.tela_blanca) { await say('nino', '¡Ojalá la bandera quede bonita!'); return; }
  await say('nino', '¿Una tela blanca? ¡Estaba flotando en la acequia y la saqué con una rama! Está mojadita, pero toma.');
  await giveItem('tela_blanca'); setFlag('tela_blanca'); telasObj();
};
const TELA_AMARILLA = async () => {
  if (!G.flags.buscar_telas) { await say('vendedora', '¡Frutas y dulces, mijita!'); return; }
  if (G.flags.tela_amarilla) { await say('vendedora', '¡Que le vaya bien a doña Javiera!'); return; }
  await say('vendedora', '¿Esta tela amarilla? Se me enredó en el puesto. Te la cambio por algo rico…');
  if (hasItem('manzana')) { const i = await ask('¿Le das tu manzana?', ['Sí, tome mi manzana', 'Mejor no']); if (i === 0) { takeItem('manzana'); await say('vendedora', '¡Qué manzana más roja! Trato hecho.'); } else { await say('vendedora', '¡Ja, ja! Era broma, mijita. Llévatela igual: es para la bandera de la patria.'); } }
  else await say('vendedora', '¡Ja, ja! Era broma, mijita. Llévatela igual: es para la bandera de la patria.');
  await giveItem('tela_amarilla'); setFlag('tela_amarilla'); telasObj();
};
function telasObj() { const n = ['tela_azul', 'tela_blanca', 'tela_amarilla'].filter(t => hasItem(t)).length; setObjective(n >= 3 ? 'Llevar las telas a doña Javiera.' : `Recuperar las 3 telas que se llevó el viento (${n}/3).`); }
const RANCAGUA = async () => {
  setFlag('rancagua'); AUD.play('triste'); G.tint = 'atardecer';
  spawn({ id: 'jmcarrera', sprite: 'jmcarrera', speaker: 'jmcarrera', x: 14, y: 9, dir: 'up', talk: () => JMC() });
  await walk('jmcarrera', 'UUU', 3); face('javiera', 'jmcarrera');
  await say('jmcarrera', 'Javiera… hermana…');
  await say('javiera', '¡José Miguel! ¿Qué ha pasado? Te ves…');
  await say('jmcarrera', 'Rancagua, hermana. Ha sido… un desastre. O\'Higgins y los suyos resistieron más de un día y medio en la plaza, ¡y les cortaron el agua! Luis llegó con dos cañones solo para cubrir la retirada. Los realistas eran muchos más.');
  meet('jmcarrera');
  await say('jmcarrera', 'Los realistas retomaron el control de Chile. Los patriotas que puedan deben huir al otro lado de la cordillera.');
  await say(N, 'Un silencio pesado llena el jardín. Hasta las telas parecen haberse quedado quietas.');
  [['s1', 8, 7, 'right'], ['s2', 18, 5, 'down'], ['s3', 21, 8, 'left']].forEach(([id, x, y, d], i) => spawn({ id, sprite: 'patriota', speaker: 'patriota', x, y, dir: d, talk: () => SOLDADO(i + 1) }));
  await say('mg', '(Esto no suena bien, Nemo… Conocer a los héroes también significa conocer sus momentos más difíciles.)');
  await say('javiera', 'Los soldados que llegaron con mi hermano están agotados. María Gracia, ¿puedes darles ánimo?');
  setObjective('Dar ánimo a los 3 soldados cansados del jardín (0/3).');
};
const SOLDADO = async (k) => {
  if (G.flags['soldado' + k]) { await say('patriota', ['¡Gracias, niña! Ya me siento mejor.', 'Nos levantaremos otra vez. ¡Ya verás!', 'Gracias por tu bondad, pequeña patriota.'][k - 1]); return; }
  await say('patriota', ['Tengo tanta sed… No he tomado agua desde Rancagua.', 'Todo está perdido… ¿Para qué seguir?', 'Estoy tan cansado que no puedo ni pensar…'][k - 1]);
  const foods = ['agua', 'manzana', 'miel', 'dulce', 'chocolate', 'alfajor'].filter(f => hasItem(f));
  const opts = foods.slice(0, 2).map(f => 'Darle ' + ITEMS[f].name.toLowerCase()).concat(['Decirle unas palabras de ánimo']);
  const i = await ask(null, opts);
  if (i < foods.slice(0, 2).length) { takeItem(foods[i]); AUD.sfx('heal'); await say('patriota', '¡Gracias, pequeña! ¡Esto me devuelve el alma al cuerpo!'); }
  else { await say('mg', ['¡Usted luchó como un león! Ahora descanse un poquito.', 'No todo está perdido. ¡La libertad no se gana en una sola batalla!', '¡Ánimo! Mi mamá dice que después de descansar, todo se ve mejor.'][k - 1]); await say('patriota', 'Tienes razón… Gracias.'); }
  setFlag('soldado' + k); G.flags.soldados = (G.flags.soldados || 0) + 1;
  setObjective(G.flags.soldados >= 3 ? 'Hablar con José Miguel Carrera.' : `Dar ánimo a los 3 soldados cansados del jardín (${G.flags.soldados}/3).`);
};
const JMC = async () => {
  if ((G.flags.soldados || 0) < 3) { await say('jmcarrera', 'Mis hombres están agotados, pequeña. Si puedes ayudarlos, te lo agradeceré.'); return; }
  await say('mg', 'Señor Carrera… ¿esto significa que todo está perdido? ¿Que ya no habrá libertad?');
  await say('jmcarrera', 'Sabes, pequeña… cuando era niño, mi padre me enseñó algo importante.');
  await say('jmcarrera', 'Me dijo: «Hijo, la diferencia entre los cobardes y los valientes no es que los valientes no se caigan. Es que *los valientes se levantan una vez más de las que se caen*».');
  await say('javiera', 'José Miguel tiene razón. La libertad no es algo que se gana en una sola batalla.');
  await say('jmcarrera', 'Organizaremos un nuevo ejército y volveremos. Tú me recordaste eso con lo que hiciste por mis soldados. Déjame firmar tu libro.');
  await medal('jmcarrera');
  await say('jmcarrera', 'Pero no todos podrán cruzar la cordillera. Algunos se quedarán aquí, trabajando en secreto. Como espías.');
  await say('mg', '¿Como espías?');
  await say('jmcarrera', 'Y conozco al mejor de todos: *Manuel Rodríguez*. Astuto como un zorro y valiente como un león.');
  await say(N, 'Al oír ese nombre, el collar de Nemo empieza a brillar…');
  await say('mg', 'Esta vez entiendo, Nemo. Vas a encontrar a Manuel Rodríguez, ¿verdad? ¡No te preocupes! ¡Esta vez no me voy a quedar llorando! *¡Voy a seguirte!*');
  await nemoVanish();
  await bookPage('rodriguez');
  await say('mg', 'La bitácora dice: «Manuel Rodríguez: el espía más astuto de Chile. Buscar durante la *Reconquista española, 1814-1817*».');
  await say('jmcarrera', 'Pequeña, no sé cómo lo haces, pero pareces conocer el futuro.');
  await say('mg', 'No conozco el futuro, señor Carrera. Solo conozco la historia. Y la historia me dice que *Chile será libre*. ¡Se los prometo!');
  await SANBRUNO_1814();
  await PERSECUCION_1814();
  setFlag('dest1816'); setObjective('Volver a la nave (al sureste de la Alameda) y viajar a 1816.');
  AUD.play('alameda');
};
// persecución: dos Talaveras corren tras MG hasta la nave
const PERSECUCION_1814 = async () => {
  if (G.flags.huida_1814) return;
  const p = G.player;
  // aparecen DETRÁS de MG (lejos de la nave, que está al sureste), en casillas libres
  const libre = (x, y) => { for (let r = 0; r < 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X > 0 && Y > 0 && X < G.map.w - 1 && Y < G.map.h - 1 && !isSolidAt(X, Y, p)) return [X, Y]; } return [x, y]; };
  const [ax, ay] = libre(Math.max(1, p.x - 6), p.y), [bx, by] = libre(Math.max(1, p.x - 4), Math.max(1, p.y - 3));
  spawn({ id: 'pt1', sprite: 'realista', speaker: 'sgt_talavera', x: ax, y: ay, dir: 'right' });
  spawn({ id: 'pt2', sprite: 'realista', speaker: 'realista', x: bx, y: by, dir: 'right' });
  await emote('pt1', '!', 600);
  await say('sgt_talavera', '¡Alto! Soy sargento del regimiento Talavera… ¡y esa es la niña que ayuda a los Carrera! ¡Atrápenla!');
  await say('mg', '¡Ay, no! ¡A la nave, rápido! (Mantén B para correr.)');
  setObjective('¡Huye de los soldados hasta la nave (al sureste)!');
  await chase({ ids: ['pt1', 'pt2'], goal: [33, 21, 4, 2], safe: [p.x, p.y, p.dir], speed: 4.6 });
  setFlag('huida_1814'); AUD.sfx('correct');
  await say('mg', '¡Uf! ¡Los dejé atrás!'); despawn('pt1'); despawn('pt2');
};
const SANBRUNO_1814 = async () => {
  if (G.flags.sanbruno_1814) return;
  AUD.play('reconquista');
  await say(N, 'Se escuchan tambores. Por la entrada del jardín llegan soldados de casaca roja…');
  spawn({ id: 'sanbruno', sprite: 'sanbruno', speaker: 'sanbruno', x: 14, y: 11, dir: 'up', ghost: true });
  spawn({ id: 'explorador', sprite: 'realista', speaker: 'realista', x: 15, y: 11, dir: 'up', ghost: true });
  await walk('sanbruno', 'UU', 3); await walk('explorador', 'UU', 3);
  await say('sanbruno', 'Soy el capitán *Vicente San Bruno*, del regimiento Talavera. Desde hoy, Santiago obedece otra vez al Rey.');
  await say('sanbruno', 'Dicen que los Carrera escapan a la cordillera… ¡Explorador! Revisa a esa niña: algo sabe.');
  await battle(OPPONENTS.explorador);
  await say('sanbruno', 'Hmm… Una niña que sabe tanta historia es peligrosa. Te estaré vigilando, pequeña.');
  await walk('sanbruno', 'DD', 4); await walk('explorador', 'DD', 4); despawn('sanbruno'); despawn('explorador');
  await say('mg', '(Ese capitán me da escalofríos… ¡Pero no me voy a rendir!)');
  setFlag('sanbruno_1814');
};

// =================================================================== CAPÍTULO 3 · RECONQUISTA 1816
const STGO1816_ENTER = async () => {
  if (!G.flags.llego_1816) {
    setFlag('llego_1816'); await chapterOnce(3);
    await say('mg', 'El Santiago de 1816 es distinto… Las calles están silenciosas y hay soldados en cada esquina. La gente camina rápido y habla en susurros.');
    await say('mg', 'La bitácora dice: «Si buscas a alguien que no quiere ser encontrado, busca primero a quienes lo ayudan».');
    spawn({ id: 'pregonero', sprite: 'realista', speaker: 'pregonero', x: 30, y: 22, dir: 'down', ghost: true });
    spawn({ id: 'marco', sprite: 'marco', speaker: 'marco', x: 32, y: 22, dir: 'down', ghost: true });
    await say('pregonero', '¡Bando del gobernador! Se prohíbe dar alojamiento a *Manuel Rodríguez*. ¡Habrá recompensa para quien lo entregue!');
    await say('pregonero', 'Y recuerden: para alejarse más de seis leguas de Santiago se necesita *pasaporte*. ¡Y al anochecer hay *toque de queda*: todos a sus casas!');
    await say('marco', 'Ejem. Lo firmo yo, *Francisco Casimiro Marcó del Pont*, gobernador del Reino. ¿Les gustan mis encajes? Son de Europa.');
    await say('mg', '(¡Cuánto encaje! Pero ese bando es contra Manuel Rodríguez… Tengo que encontrarlo antes que ellos.)');
    despawn('pregonero'); despawn('marco');
    await say('mg', '(La bitácora del tío dice que a don Manuel de Salas y a otros patriotas los desterraron a la isla *Juan Fernández*, en medio del mar. ¡Viven en cuevas del cerro!)');
    await say(N, '¡Cuidado con los soldados! Si uno te ve, te interrogará. Observa hacia dónde miran (su franja roja) y muévete cuando no te vean.');
    setObjective('Hablar con la señora que susurra, junto a la nave.');
  }
  if (G.flags.respuesta && !G.flags.duelo_sargento) {
    const p = G.player;
    spawn({ id: 'sargento16', sprite: 'realista', speaker: 'sgt_talavera', x: p.x, y: p.y + 2, dir: 'up', ghost: true });
    await emote('sargento16', '!', 600);
    await say('sgt_talavera', '¡Alto! ¿Saliste de la casa de doña Luisa? En esa casa se canta demasiado… ¡y se conspira!');
    await say('mg', '(¡La respuesta para doña Águeda! Tengo que convencerlo con mis ideas.)');
    await battle(OPPONENTS.sargento);
    setFlag('duelo_sargento'); despawn('sargento16');
  }
};
const SANBRUNO_PORTON = async () => {
  if (G.flags.duelo_sanbruno) return;
  face('sanbruno', 'mg');
  await say('sanbruno', '¡Vaya, vaya! La niña de la Alameda. ¿Ibas al sur, a ver a algún «amigo»? Nadie sale de Santiago sin *pasaporte*.');
  await say('mg', '¡No le tengo miedo, capitán! Sé más historia que usted.');
  await battle(OPPONENTS.sanbruno);
  setFlag('duelo_sanbruno');
  await say('sanbruno', '¡Retirada! Pero ten cuidado en el campo, niña: mis patrullas están por todas partes.');
  despawn('sanbruno'); despawn('talav_porton');
  setObjective('Salir por el camino del sur hacia la hacienda de doña Paula.');
};
// Si un soldado ve a MG: interrogatorio corto (duelo de 2 preguntas). Al ganarlo, sigue donde estaba.
async function interrogatorio(e, opp = 'interrogatorio') {
  if (e) face(e.id, 'mg');
  await battle(OPPONENTS[opp]);
  const until = G.t + 6;
  G.ents.forEach(x => { if (x.guard) x.guard.cooldown = until; });
  toast('Los soldados te dejarán tranquila unos segundos. ¡Aprovecha! (Pasa cuando miren hacia otro lado.)', 5);
}
const GUARDIA_VE = async (e) => {
  await say('realista', '¡Alto ahí! ¿Qué hace una niña sola en la calle, con estos tiempos?');
  await interrogatorio(e);
};
const SUSURRO_1816 = async () => {
  if (!G.flags.carta && !G.flags.carta_entregada) { await say('vecina', 'Shhh… Si buscas amigos de la libertad, ve a la casa de *doña Águeda*, al suroeste de la plaza. Allí hay tertulias… muy secretas.'); setObjective('Llegar a la casa de doña Águeda (suroeste) sin que te vean.'); return; }
  await say('vecina', 'Shhh… ¡cuidado con los soldados!');
};
const AGUEDA = async () => {
  if (!G.flags.agueda_hablo) {
    setFlag('agueda_hablo'); meet('agueda');
    await say('agueda', '¡Pasa, pasa, rápido! ¿Te vieron? … Bien. Soy Águeda Monasterio. En mi casa hacemos *tertulias*: conversamos de libros, de música… y de libertad.');
    await say('agueda', 'Con mi pluma escribo cartas con noticias para los patriotas que están en Mendoza, al otro lado de la cordillera.');
    await say('mg', 'Busco a Manuel Rodríguez y a mi perro Nemo.');
    await say('agueda', 'A Manuel Rodríguez nadie lo encuentra… a menos que él quiera. Pero puedo ayudarte. Primero necesito que lleves esta *carta* a doña Luisa Recabarren, en la casa del noreste.');
    await giveItem('carta'); setFlag('carta');
    setObjective('Llevar la carta a doña Luisa (casa del noreste) sin que te vean.');
    return;
  }
  if (G.flags.respuesta && !G.flags.medalla_agueda) {
    await say('agueda', '¡Volviste! ¿Traes la respuesta de Luisa? … «El ejército se prepara en Mendoza. Pronto volveremos». ¡Qué gran noticia!');
    await say('agueda', 'Las palabras también pueden defender la libertad, pequeña. Déjame firmar tu libro con mi pluma.');
    await medal('agueda');
    await say('agueda', 'Ahora escucha: al sur de Santiago está la hacienda de doña *Paula Jaraquemada*. Manuel Rodríguez la visita seguido. Sal por el *camino del sur*, junto a tu… ¿nave?');
    setFlag('camino_sur'); setObjective('Salir por el camino del sur (abajo, al lado de la nave) hacia la hacienda de doña Paula.');
    return;
  }
  await say('agueda', G.flags.medalla_agueda ? 'Ve al sur, a la hacienda de doña Paula. ¡Suerte, pequeña!' : 'La casa de doña Luisa está al noreste. ¡Que no te vean los soldados!');
};
const LUISA = async () => {
  if (!G.flags.carta) { await say('luisa', '¿Una niña sola? Ve con cuidado, que estos son tiempos difíciles.'); return; }
  meet('luisa');
  await say('luisa', '¿Una carta de Águeda? ¡Pasa, pequeña! Soy Luisa Recabarren. Vine desde *La Serena* y aquí recibo a los patriotas en mi salón.');
  takeItem('carta'); setFlag('carta_entregada');
  await say(N, 'Doña Luisa lee la carta en silencio… y sonríe.');
  await say('luisa', 'Para responder sin que los soldados entiendan, usamos una *melodía secreta*. Te la enseñaré en mi guitarra. Así podrás reconocer a los amigos de la libertad.');
  await simon({ title: 'La melodía secreta', help: 'Escucha las notas de la guitarra y repítelas.', symbols: [{ dir: 'up', label: 'Do', color: '#e86a5a', note: 'C5' }, { dir: 'right', label: 'Mi', color: '#f0b040', note: 'E5' }, { dir: 'down', label: 'Sol', color: '#5ab070', note: 'G5' }, { dir: 'left', label: 'La', color: '#5a8ae0', note: 'A5' }], rounds: [3, 4, 5], inst: 'guitarra', win: '¡Tocas como una verdadera patriota!' });
  await say('luisa', '¡Perfecto! Abrir tu casa y escuchar también es una forma de ayudar, ¿sabes? Déjame firmar tu libro.');
  await medal('luisa');
  await say('luisa', 'Y lleva esta respuesta a Águeda. Va escondida en la melodía… y en este papelito. ¡Cuidado con los soldados!');
  setFlag('respuesta'); setObjective('Volver donde doña Águeda con la respuesta (casa del suroeste).');
};
const HACIENDA_ENTER = async () => {
  if (!G.flags.llego_hacienda) {
    setFlag('llego_hacienda');
    await say('mg', '¡Uf! Caminé y caminé hasta cansarme… y después caminé un poco más. ¡Esta debe ser la hacienda de doña Paula!');
    await say('mg', 'Campos de trigo, un establo, gallinas… y la cordillera blanquita al fondo.');
    setObjective('Hablar con doña Paula Jaraquemada, frente a su casa.');
  }
};
const PAULA = async () => {
  if (!G.flags.paula_hablo) {
    setFlag('paula_hablo');
    await say('paula', '¿Te has perdido, pequeña?');
    await say('mg', '(En voz bajita) Busco a Manuel Rodríguez… y a mi perro Nemo, que tiene un collar brillante.');
    await say(N, 'La señora la mira de pies a cabeza, como en un examen que nunca termina… ¡Es doña Paula Jaraquemada, igual que en el libro!');
    meet('paula');
    await say('paula', 'En esta hacienda de Paine ayudo a los que persiguen los soldados del Rey. Y mis caballos no son para cazar patriotas.');
    await say('paula', '¿Ves ese establo? Los soldados quieren llevarse mis caballos para perseguir a Manuel Rodríguez. ¡No se los voy a entregar!');
    await say('paula', 'Y ahora… ¿escuchas? ¡Vienen otra vez! Ayúdame: *empuja los fardos de paja* hasta las marcas, frente a la puerta del establo. ¡Así no podrán entrar!');
    setObjective('Empujar los 3 fardos de paja hasta las marcas frente al establo.');
    return;
  }
  if (!G.flags.medalla_paula) {
    const i = await ask('¿Necesitas ayuda con los fardos?', ['Sigo intentando', 'Volver a ponerlos como al principio']);
    if (i === 1) { await fadeOut('#000', 200); const pos = { f1: [28, 12], f2: [31, 10], f3: [29, 13] }; G.props.filter(p => p.opts.id && pos[p.opts.id]).forEach(p => { G.map.solid[p.y][p.x] = false; [p.x, p.y] = pos[p.opts.id]; G.map.solid[p.y][p.x] = true; }); await fadeIn(200); }
    return;
  }
  if (!G.flags.rodriguez_encontrado) { await say('paula', 'Manuel Rodríguez viene seguido por aquí. Nunca sé cómo va a aparecer… Pasa al comedor; las gallinas andan raras hoy.'); return; }
  await say('paula', '¡Corre, pequeña! Sigue a Manuel.');
};
const FARDOS_CHECK = async () => {
  if (G.flags.medalla_paula) return;
  const ok = ['f1', 'f2', 'f3'].every(id => { const p = G.props.find(q => q.opts.id === id); return p && p.y === 9 && p.x >= 28 && p.x <= 30; });
  if (!ok) return;
  await sleep(300); AUD.sfx('correct');
  await say('mg', '¡Listo, doña Paula! La puerta del establo está tapada.');
  AUD.sfx('gallop');
  spawn({ id: 'sold1', sprite: 'realista', speaker: 'realista', x: 34, y: 13, dir: 'left' }); spawn({ id: 'sold2', sprite: 'realista', x: 35, y: 14, dir: 'left' });
  await walk('sold1', 'LLL'); await emote('sold1', '?', 700);
  await say('realista', '¿Y los caballos? Aquí solo hay paja y una señora con cara de pocos amigos… ¡Vámonos!');
  await walk('sold1', 'RRRR'); despawn('sold1'); despawn('sold2');
  face('paula', 'mg');
  await say('paula', '¡Ja, ja, ja! ¿Viste sus caras? La libertad no la ganan solo los que pelean con espadas, pequeña. La ganan también los que *cuidan del resto*.');
  await say('paula', 'Los que esconden a los perseguidos y ponen su corazón por el bien de los demás. Déjame firmar ese libro tuyo.');
  await medal('paula');
  await say('paula', 'Por cierto… Manuel Rodríguez viene seguido. Nunca sé cómo va a aparecer: a veces como vendedor de frutas, otras como sacerdote… Pasa al comedor. Las gallinas están raras hoy.');
  setObjective('Revisar el comedor de la casa de doña Paula.');
};
const MANTEL = async () => {
  if (!G.flags.medalla_paula) { await say(N, 'Una mesa con mantel blanco. Las gallinas la miran fijo… muy raro.'); return; }
  await say(N, 'Las gallinas forman un círculo alrededor de la mesa. Y debajo del mantel… ¿eso es una bota?');
  await say('mg', '«Este pequeño y audaz fundador de elegante negro se vistió…»');
  await say('mg', '¡AJÁ! ¡TE ENCONTRÉ!');
  ['hc1', 'hc2', 'hc3'].forEach(despawn); AUD.sfx('hit');
  spawn({ id: 'rodriguez', sprite: 'rodriguez', speaker: 'rodriguez', x: 5, y: 5, dir: 'down', ghost: true, talk: () => RODRIGUEZ_COMEDOR() });
  await walk('rodriguez', 'RRR', 10); face('rodriguez', 'mg');
  meet('rodriguez');
  await say('rodriguez', '¡Manuel Rodríguez, a su servicio! — dice con una reverencia tan exagerada que casi toca el suelo con la nariz.');
  setFlag('rodriguez_encontrado');
  AUD.sfx('gallop'); AUD.play('batalla');
  await say('paula', '(Desde afuera) ¡Soldados españoles! ¡Vienen diez!');
  await say('rodriguez', '¿Solo diez? Entonces será una aventura tranquila. ¿Lista para convertirte en espía, pequeña?');
  await RODRIGUEZ_COMEDOR();
};
const RODRIGUEZ_COMEDOR = async () => {
  if (!G.flags.capa) {
    await say('rodriguez', '*Regla número uno* de un espía: un buen disfraz.');
    await giveItem('capa'); setFlag('capa'); G.outfit = 'mg_espia'; G.player.sprite = 'mg_espia'; sparkleAt(G.player.x, G.player.y, 16);
    await say(N, '¡MG se puso una capa negra igualita a la de Manuel Rodríguez, pero de su tamaño!');
    await say('rodriguez', '*Regla número dos*: conocer pasadizos secretos. Mueve esa olla grande que está junto a la chimenea.');
    setObjective('Mover la olla grande del comedor.');
    return;
  }
  await say('rodriguez', '¡Rápido, la olla grande! ¡Los soldados ya están en la puerta!');
};
const OLLA = async () => {
  await say(N, 'MG empuja la olla con todas sus fuerzas… ¡PUF! Aparece una puerta secreta en el piso.');
  setFlag('trampilla');
  const o = G.props.find(p => p.type === 'olla'); if (o) { G.map.solid[o.y][o.x] = false; o.x = 10; G.map.solid[o.y][o.x] = true; }
  addProp('trapdoor', 9, 5, { deco: 1 }); G.map.warps.push({ x: 9, y: 5, to: 'tunel', tx: 1, ty: 1, dir: 'down' });
  await say('rodriguez', '¡Al túnel! Yo voy adelante. Nos vemos en la salida… ¡y no despiertes a los murciélagos!');
  despawn('rodriguez');
  setObjective('Bajar por la puerta secreta y cruzar el túnel oscuro.');
};
const TUNEL_ENTER = async () => { if (!G.flags.tunel_huida) { await PERSECUCION_TUNEL(); } if (!G.flags.tunel_visto) { setFlag('tunel_visto'); await say('mg', '¡Qué oscuro! Hay antorchas en las paredes, telarañas que brillan… y murciélagos colgando del techo. ¡Brrr!'); await say(N, 'Busca la escalera de salida al otro lado del túnel.'); } };
// persecución en el túnel: dos soldados bajaron por la trampilla
const PERSECUCION_TUNEL = async () => {
  const p = G.player;
  await say('mg', '¡Qué oscuro! Hay antorchas en las paredes, telarañas que brillan… y murciélagos colgando del techo. ¡Brrr!');
  setFlag('tunel_visto');
  await walk('mg', 'DD', 6);
  AUD.sfx('door'); await sleep(300);
  spawn({ id: 'tt1', sprite: 'realista', speaker: 'sgt_talavera', x: 1, y: 1, dir: 'down', ghost: true });
  await say('sgt_talavera', '(Desde arriba) ¡Una trampilla! … ¡¿Otra vez esa niña?! ¡Bajen todos, que no se escape!');
  const t1 = findEnt('tt1'); if (t1) t1.ghost = false;
  await say('mg', '¡Me siguen por el túnel! ¡Tengo que llegar a la salida, abajo a la derecha!');
  setObjective('¡Escapa por el túnel hasta la escalera de salida (abajo a la derecha)!');
  await chase({ ids: ['tt1'], goal: [20, 13, 2, 1], safe: [1, 3, 'right'], speed: 4.3 });
  setFlag('tunel_huida'); despawn('tt1');
  await say('mg', '¡Los perdí en el laberinto! La salida está aquí mismo.');
};
const CAMPO_ENTER = async () => {
  if (!G.flags.campo_visto) {
    setFlag('campo_visto');
    await say('mg', 'Salimos entre unos arbustos… ¡Es de noche! Allá, al fondo, se escucha una cascada.');
    await say(N, 'Hay soldados vigilando los campos. *Escóndete en el maizal*: dentro del maíz no te pueden ver.');
    setObjective('Cruzar los campos sin que te vean y llegar donde Manuel Rodríguez (arriba a la derecha).');
  }
};
const SOLDADO_CAMPO_VE = async (e) => { await say('realista', '¡Hey! ¿Qué hace una mini Rodríguez por aquí? ¡Responde!'); await interrogatorio(e); toast('Pista: dentro del maizal los soldados no te ven.', 5); };
const TEATRO = async () => {
  if (G.flags.teatro_ok) return;
  const r = findEnt('rodriguez'); if (r) face('rodriguez', 'mg');
  await say('rodriguez', '¡Llegaste, mini espía! Pero… ¿escuchas? Vienen más soldados. Tengo una idea: ¿te gustan las *obras de teatro*?');
  await say(N, 'Minutos después, en el sendero hay una «abuelita» (MG con un chal) y su «nieto» (Rodríguez, agachado, haciéndose el niño) recogiendo hierbas…');
  spawn({ id: 'sold_t', sprite: 'sanbruno', speaker: 'sanbruno', x: 24, y: 11, dir: 'up', ghost: true }); await walk('sold_t', 'UUU', 4);
  while (true) {
    const i = await ask('¿Han visto pasar a Manuel Rodríguez?', ['¡Ay, mijito! Se fue por allá, hacia el río', '¡Está aquí mismo, agachado!', 'No sé quién es ese señor'], 'sanbruno');
    if (i === 0) { await say('mg', '¡Ay, mijito! ¿Manuel Rodríguez? ¡Ese pícaro pasó por aquí asustando a mis gallinas! Se fue por allá, hacia el río.'); break; }
    if (i === 1) { await say('rodriguez', '(¡Psst! ¡Así no, mini espía! ¡Inténtalo otra vez!)'); }
    else { await say('sanbruno', 'Mmm… ¿segura, abuelita? ¡Piénselo bien!'); }
  }
  await say('sanbruno', 'Mmm… Esa voz… ¡Yo te conozco! ¡Eres la niña del portón!');
  await battle(OPPONENTS.sanbruno2);
  await say('sanbruno', '¡Bah! ¡Al río, muchachos! ¡Rodríguez no se me escapa!');
  await walk('sold_t', 'DDD', 6); despawn('sold_t');
  AUD.sfx('gallop');
  await say('rodriguez', '¡Escucha! ¡Vuelven a caballo! ¡Súbete detrás de mí, mini espía, y agárrate fuerte!');
  const r1 = await ride({ titulo: 'Huida con Manuel Rodríguez', jinete: 'b_rodriguez_mg_caballo', perseguidor: 'b_talavera_caballo', obst: ['b_roca', 'b_barril', 'b_arbusto', 'b_cerca'], cielo: ['#0e1430', '#2a3a6a'], suelo: 't_pasto_osc', montes: '#1a2444', noche: true, dur: 36 });
  await say('rodriguez', r1.stars >= 8 ? `¡Ja, ja! ¡Los dejamos atrás! Y juntaste ${r1.stars} estrellas en el camino… ¡qué ojo de espía!` : '¡Ja, ja! ¡Los dejamos atrás! Esos Talaveras no conocen estos caminos como yo.');
  { const p = G.player; p.x = 25; p.y = 6; p.px = 25 * 16; p.py = 6 * 16; p.dir = 'up'; const r = findEnt('rodriguez'); if (r) { r.x = 26; r.y = 6; r.px = 26 * 16; r.py = 6 * 16; r.dir = 'left'; } }
  await say('rodriguez', '¡Ja, ja! ¡Eres una espía natural! Ahora vamos a la cascada. Silba como un *chincol* tres veces… y verás.');
  setFlag('teatro_ok'); despawn('rodriguez');
  setObjective('Ir a la cascada (arriba a la derecha) y silbar como un chincol.');
};
const CASCADA = async () => {
  if (!G.flags.teatro_ok) { await say(N, 'Una cascada cae entre las rocas. El agua hace un ruido muy fuerte.'); return; }
  await say('mg', 'Aquí está la cascada. ¡A silbar como un chincol!');
  await simon({ title: 'El silbido del chincol', help: 'Escucha el silbido del pajarito y repítelo.', symbols: [{ dir: 'up', label: 'Fiu', color: '#c8a060', note: 'E5' }, { dir: 'right', label: 'Fii', color: '#a0c070', note: 'G5' }, { dir: 'down', label: 'Fiu', color: '#d88060', note: 'C5' }], fixed: [[1, 0, 2], [1, 0, 2, 1], [1, 1, 0, 2, 0]], rounds: [3, 4, 5], inst: 'silbido', win: '¡Fiu, fiu, fiii! ¡Igualito a un chincol!' });
  AUD.sfx('whistle'); await sleep(400); await shake(400);
  await say(N, '¡Les juro que la cascada se movió! Bueno… no exactamente: había una cueva secreta detrás.');
  setFlag('cascada_abierta');
  await warp('cueva', 7, 9, 'up');
};
const CUEVA_ENTER = async () => {
  if (!G.flags.nemo_cueva) {
    await say(N, 'Una cueva llena de mapas, disfraces colgados (¡hasta uno de vaca!) y frascos con polvos misteriosos… Y moviendo la cola como si la hubiera esperado todo el día…');
    await say('mg', '¡NEMO!');
    const n = findEnt('nemo'); if (n) { AUD.sfx('bark'); await walk('nemo', 'DD', 6); }
    nemoJoin(); setFlag('nemo_cueva');
    spawn({ id: 'rodriguez', sprite: 'rodriguez', speaker: 'rodriguez', x: 5, y: 4, dir: 'down', talk: () => RODRIGUEZ_CUEVA() });
    await say('rodriguez', 'Bienvenida a mi oficina secreta. Aquí se planea la independencia de Chile. ¿Un chocolate caliente? Le decimos «pólvora del destino».');
    await giveItem('chocolate');
    setObjective('Conversar con Manuel Rodríguez.');
  }
};
const RODRIGUEZ_CUEVA = async () => {
  if (G.flags.medalla_rodriguez) { await say('rodriguez', '¡Buena suerte, mini espía! Recuerda las dos reglas: un buen disfraz y pasadizos secretos.'); return; }
  await say('rodriguez', '¿Ves esas montañas blancas? Después de Rancagua, muchos pensaron que todo estaba perdido. Pero un grupo de patriotas decidió que la libertad valía cualquier sacrificio.');
  await say('rodriguez', 'Cruzaron la cordillera… y al otro lado los recibió un general argentino llamado *José de San Martín*. Los entrenó y organizó un gran ejército.');
  await say('rodriguez', 'Y entre esos valientes hay uno con una historia especial. Cuando era niño nadie apostaba por él; se burlaban de su pelo *colorín*… pero convirtió cada obstáculo en una razón para esforzarse más.');
  await say('mg', '¡El jinete del caballo blanco! ¡El de las patillas colorinas!');
  await say('rodriguez', '¿Ya lo conoces? Su nombre es *Bernardo O\'Higgins*. Nació en *Chillán*… y pronto volverá.');
  meet('ohiggins');
  await say('rodriguez', 'Recuerda, mini espía: el valor no está en no tener miedo, sino en *mirar al miedo a los ojos y seguir adelante*. Toma, firmo tu libro… con letra de espía.');
  await medal('rodriguez');
  await say(N, 'En ese momento, Nemo da un salto que parece desafiar la gravedad. Su collar brilla como mil estrellas fugaces…');
  await nemoVanish();
  await say('mg', 'Esta vez sonrío. Sé que mi perro va tras los pasos de ese valiente colorín. ¡Es hora de cruzar mis propias montañas!');
  await say('rodriguez', 'Y tu máquina rara… mis amigos la trajeron escondida en una carreta de paja. ¡Nadie revisa las carretas de paja! Está ahí, al fondo.');
  setFlag('nave_cueva'); addProp('timemachine', 11, 7);
  setFlag('destAndes'); setObjective('Viajar a Mendoza, 1817, donde se prepara el Ejército de los Andes.');
};

// =================================================================== CAPÍTULO 5 · EL CRUCE DE LOS ANDES (1817)
// Fuentes: Memoria Chilena w3-article-96742 y w3-article-3383 (cruce), w3-article-100852 (Chacabuco). Ver fuentes/memoria_chilena.md §13.
const MENDOZA_ENTER = async () => {
  if (!G.flags.llego_mendoza) {
    setFlag('llego_mendoza'); await chapterOnce(4);
    await say('mg', '¡Mendoza, enero de 1817! Al otro lado de la cordillera… Carpas, mulas, caballos ¡y martillazos por todas partes!');
    await say(N, 'Desde fines de 1815, Mendoza se volvió un gran cuartel: arrieros, carros y yunques sonando día y noche.');
    setObjective('Buscar al general San Martín, al centro del campamento.');
  }
};
const SANMARTIN = async () => {
  if (!G.flags.sanmartin_hablo) {
    setFlag('sanmartin_hablo');
    await say('sanmartin', '¿Una niña en el campamento? Soy *José de San Martín*, general del *Ejército de los Andes*.');
    await say('mg', 'Busco a mi perro Nemo… y a Bernardo O\'Higgins.');
    await say('sanmartin', 'Bernardo está aquí, preparando a sus soldados. Muchos patriotas llegaron a Mendoza después de Rancagua.');
    await say('sanmartin', 'Somos más de 5.000 personas: unos *4.000 soldados*, más arrieros, herreros y baqueanos. Cruzaremos la cordillera en *seis columnas*, por distintos pasos entre Copiapó y Talca.');
    await say('mg', '¿Seis columnas? ¡Así los soldados del Rey no saben por dónde van a llegar!');
    await say('sanmartin', 'Exacto, pequeña. Ahora, nuestro arriero necesita ayuda con las mulas. ¿Le das una mano? Está junto a ellas.');
    setObjective('Hablar con el arriero, junto a las mulas.');
    return;
  }
  await say('sanmartin', G.flags.andes_cruzando ? '¡En marcha! La cordillera nos espera, por el camino del oeste.' : 'El arriero está junto a las mulas. Sin mulas no hay cruce.');
};
function nMulas() { return [1, 2, 3].filter(k => G.flags['mula' + k]).length; }
const ARRIERO = async () => {
  if (!G.flags.sanmartin_hablo) { await say('arriero', '¡Buenas, niñita! Si buscas al general, está al centro del campamento.'); return; }
  if (!G.flags.arriero_hablo) {
    setFlag('arriero_hablo');
    await say('arriero', '¡Buenas, niñita! Soy arriero: conozco los caminos de la cordillera como la palma de mi mano.');
    await say('arriero', 'De aquí salen *9.821 mulas* y *1.600 caballos*. ¡Casi diez mil mulas! Llevan comida, armas, frazadas… todo.');
    await say('arriero', 'Ayúdame con estas tres: a una le toca el *charqui*, a otra las *frazadas* y a la última las *herraduras*. Las herraduras las tiene el herrero, junto a los yunques.');
    setObjective('Cargar las mulas: habla con cada una (0/3).');
    return;
  }
  const n = nMulas();
  if (n < 3) { await say('arriero', `Van ${n} de 3. ¡Que no se nos haga de noche!`); return; }
  if (!G.flags.mulas_ok) {
    setFlag('mulas_ok');
    await say('arriero', '¡Bien hecho! La recua está lista. ¡Escuche! Ya parten las primeras columnas…');
    await PARTIDA_MENDOZA();
    return;
  }
  await say('arriero', 'La senda sube por el oeste, a la izquierda. ¡Abríguese, niñita!');
};
const MULA = async (k) => {
  if (!G.flags.arriero_hablo) { await say(N, 'Una mula tranquila mastica pasto. Parece esperar algo.'); return; }
  if (G.flags['mula' + k]) { await say(N, '¡Esta mula ya está cargada!'); return; }
  if (k === 3 && !hasItem('herraduras')) { await say(N, 'A esta mula le tocan las herraduras… pero las tiene el herrero, junto a los yunques.'); return; }
  if (k === 3) takeItem('herraduras');
  AUD.sfx('select'); setFlag('mula' + k);
  await say(N, { 1: 'MG carga sacos de *charqui*: carne seca que no se echa a perder en el viaje.', 2: 'MG amarra *frazadas* gruesas. ¡Allá arriba el frío es terrible!', 3: 'MG guarda las *herraduras*: entre las piedras de la cordillera, los cascos se gastan muy rápido.' }[k]);
  const n = nMulas(); setObjective(n < 3 ? `Cargar las mulas: habla con cada una (${n}/3).` : 'Avisarle al arriero que las mulas están listas.');
};
const HERRERO = async () => {
  if (G.flags.herraduras_dadas) { await say('herrero', '¡Clang, clang! Herraduras, espadas, ruedas de cañón… aquí se hace de todo.'); return; }
  await say('herrero', '¡Clang! ¡Clang! Perdón, niñita, no te escuché. En este campamento los yunques suenan día y noche.');
  if (!G.flags.arriero_hablo) { await say('herrero', 'Si necesitas algo, pregúntale primero al arriero.'); return; }
  await say('herrero', '¿Herraduras para las mulas? ¡Aquí tienes, recién hechas!');
  setFlag('herraduras_dadas'); await giveItem('herraduras');
};
// MG ve pasar a lo lejos al jinete de capa azul, pero no lo alcanza: la reunión queda para Maipú
const PARTIDA_MENDOZA = async () => {
  AUD.sfx('gallop');
  spawn({ id: 'jinete', horse: 'jinete', x: 12, y: 8, dir: 'left', ghost: true });
  await say(N, 'Un jinete en un caballo blanco, con capa azul, encabeza una columna hacia la cordillera… ¡y detrás corre un perrito con un collar brillante!');
  await say('mg', '¡El jinete del caballo blanco! ¡Y NEMO! ¡Espérenme!');
  await walk('jinete', 'LLLLLLLLLLLL', 7); despawn('jinete');
  face('sanmartin', 'mg');
  await say('sanmartin', 'Va adelante con su columna, por el paso de *Los Patos*. Si quieres alcanzarlos, sube con la recua: allá arriba nos vas a hacer falta.');
  setFlag('andes_cruzando'); setObjective('Subir a la cordillera por el camino del oeste (a la izquierda).');
};
const CORDILLERA_ENTER = async () => {
  if (!G.flags.llego_cordillera) {
    setFlag('llego_cordillera');
    await say(N, 'La senda sube y sube entre rocas y nieve. El viento corta la cara y las mulas resoplan.');
    await say('mg', '¡Brrr! La bitácora dice que O\'Higgins escribió que en el paso del *Espinacito* hacía «un frío intensísimo». ¡Tenía toda la razón!');
    await say('arriero', '¡Niñita! Se cayeron bloques de nieve sobre la senda. Empújalos hasta los *huecos de la ladera* para que pase la recua.');
    setObjective('Empujar los 3 bloques de nieve hasta los huecos de la ladera (marcas amarillas).');
  }
};
const NIEVE_CHECK = async () => {
  if (G.flags.senda_ok) return;
  const marks = [[8, 7], [15, 7], [22, 7]];
  const ok = ['n1', 'n2', 'n3'].every(id => { const p = G.props.find(q => q.opts.id === id); return p && marks.some(([x, y]) => p.x === x && p.y === y); });
  if (!ok) return;
  await sleep(300); AUD.sfx('correct'); setFlag('senda_ok');
  await say('arriero', '¡Senda despejada! Ahora sí: ¡adelante la recua!');
  removeProp('tapon1'); removeProp('tapon2');
  await say(N, 'Al otro lado se ve el valle. ¡Chile está ahí abajo!');
  await OLVIDO(2);
  setObjective('Bajar hacia el valle por el oeste (a la izquierda), hasta Chacabuco.');
};
const ARRIERO_PASO = async () => {
  if (G.flags.senda_ok) { await say('arriero', 'Con la senda limpia, la recua avanza tranquila. ¡Gracias, niñita!'); return; }
  const i = await ask('¿Se trabaron los bloques de nieve?', ['Sí, ordénelos de nuevo', 'No, sigo intentando']);
  if (i === 0) { await say('arriero', '¡A la una, a las dos… y a las tres!'); await warp('cordillera', 27, 9, 'left'); }
  else await say('arriero', 'Empuja cada bloque caminando contra él: primero por la senda hasta quedar bajo el hueco, y después hacia arriba.');
};
const CHACABUCO = async () => {
  await say(N, 'Después de muchos días de marcha, el ejército baja de la cordillera. Es el *12 de febrero de 1817*, cerca de la hacienda de *Chacabuco*.');
  AUD.sfx('hit'); await flash('#fff', 200);
  await say('arriero', '¡Niñita, súbase a esta mula! ¡Bajamos al trote, pero cuidado con las piedras que ruedan!');
  const r2 = await ride({ titulo: '¡Bajando la cordillera!', jinete: 'b_mg_mula', perseguidor: null, obst: ['b_roca', 'b_bloque_nieve', 'b_roca'], cielo: ['#8ab8f0', '#e4f0ff'], suelo: 't_nieve', montes: '#6a7a98', nieve: true, dur: 30 });
  if (r2.stars) toast(`¡Juntaste ${r2.stars} estrellas en la bajada!`, 3);
  await say(N, '¡Las tropas del Rey esperan en el camino! ¡Bum! ¡Bum!');
  await say('sgt_talavera', '¡Alto ahí! … ¡¿La niña de la Alameda?! ¡¿Cruzaste la cordillera con ellos?!');
  await battle(OPPONENTS.chacabuco);
  setFlag('chacabuco_ok');
  await say(N, '¡Victoria! Las tropas del Rey se retiran. ¡Los patriotas triunfaron en Chacabuco!');
  await card('Chacabuco, 1817', ['El *12 de febrero de 1817*, el Ejército de los Andes, con San Martín, O\'Higgins y Soler, triunfó en *Chacabuco*. Un día antes, Ramón Freire había recuperado Talca.', 'El *14 de febrero* el ejército entró a Santiago. El *16 de febrero*, un cabildo abierto nombró a *Bernardo O\'Higgins Director Supremo* de Chile.', 'De las 9.821 mulas que salieron de Mendoza, llegaron solo 4.330. ¡Cruzar los Andes fue una hazaña!'], [['12 feb', 'Chacabuco', true], ['16 feb', 'Director Supremo']]);
  spawn({ id: 'sanmartin', sprite: 'sanmartin', speaker: 'sanmartin', x: 4, y: 12, dir: 'up', ghost: true, talk: 'Cruzamos la cordillera y ganamos en Chacabuco. Ahora Chile podrá gobernarse a sí mismo.' });
  await say('sanmartin', '¡Gracias por ayudar a la recua, pequeña! Tu perrito siguió al jinete de capa azul… hacia el sur.');
  await say('mg', 'La bitácora dice: «El jinete de las patillas colorinas nació en *Chillán*». ¡Nemo debe ir para allá!');
  addProp('timemachine', 1, 12);
  await say('mg', '¡Y mi nave apareció entre la nieve! ¡Vamos a Chillán!');
  setFlag('dest1817'); setObjective('Usar la nave (abajo a la izquierda) y viajar a Chillán, 1817.');
};

// =================================================================== CAPÍTULO 4 · CHILLÁN 1817 Y MAIPÚ 1818
const CHILLAN_ENTER = async () => {
  if (!G.flags.llego_chillan) {
    setFlag('llego_chillan'); await chapterOnce(5);
    await say('mg', 'Chillán, 1817. Aquí nació Bernardo O\'Higgins. Hay una señora parada sobre una banca, ¡en el centro de la plaza!');
    setObjective('Hablar con la señora de la plaza.');
  }
};
const CORNELIA = async () => {
  if (!G.flags.cornelia_hablo) {
    setFlag('cornelia_hablo'); meet('cornelia');
    await say('cornelia', '¡Vecinos de Chillán! ¡La libertad vale la pena! … ¿Y tú, pequeña? ¿Viniste a escuchar?');
    await say('mg', '¡Usted es María Cornelia Olivares! La del libro: «¡Allí sobre esa banca!».');
    await say('cornelia', '¿Un libro? ¡Ja! Me quisieron dejar en casa, pero decidí pasar horas en la plaza. Alguien tiene que decir en voz alta que esta tierra puede ser libre.');
    await say('cornelia', 'Pero la gente tiene miedo de los soldados del rey. ¿Me ayudas a convencer a tres vecinos de venir a escuchar?');
    setObjective('Convencer a 3 vecinos de ir a la plaza (0/3).');
    return;
  }
  const n = [1, 2, 3].filter(k => G.flags['conv' + k]).length;
  if (n < 3) { await say('cornelia', `Vinieron ${n} de 3. ¡Sigue, pequeña! Una voz sola es valiente; muchas voces juntas son imparables.`); return; }
  if (G.flags.medalla_cornelia) { await say('cornelia', '¡Viva la patria, pequeña! Ve tras tu perrito.'); return; }
  if (!G.flags.duelo_soldado1817) {
    await say('sgt_talavera', '¡Alto ahí! ¡En esta plaza nadie habla de libertad! … ¡¿Tú?! ¿Hasta Chillán me sigues, niña?');
    await battle(OPPONENTS.soldado1817); setFlag('duelo_soldado1817');
  }
  await say(N, 'Los vecinos se juntan alrededor de la banca. Doña Cornelia alza la voz…');
  await say('cornelia', '¡Vecinos! No tengan miedo. Los patriotas cruzaron la cordillera y vuelven a liberar Chile. ¡Ayudémoslos con nuestro ánimo, con pan, con caballos y con valor!');
  await say(N, '¡Los vecinos aplauden! Hasta el soldado realista se rasca la cabeza, sin saber qué hacer.');
  await say('cornelia', 'Alzar la voz por lo justo da ánimo a todo un pueblo. Gracias, pequeña. ¡Ven, que firmo tu libro!');
  await medal('cornelia');
  await say(N, 'De pronto, entre la gente, aparece un destello… ¡un perro con collar brillante corre por la orilla de la plaza!');
  await say('mg', '¡NEMO! … ¡Desapareció otra vez! Siempre un paso adelante.');
  setTrail([[20, 13], [21, 14], [22, 15], [24, 16]]);
  await say('mg', 'La bitácora del tío dice: «Maipú, 5 de abril de 1818. El ejército patriota acampa en el llano».');
  setFlag('dest1818'); setObjective('Viajar a Maipú, 1818.');
};
const CONVENCER = async (k) => {
  if (!G.flags.cornelia_hablo) { await say(['vecina', 'nino', 'vecino'][k - 1], '¿Esa señora de la banca? Da miedo que la escuchen los soldados…'); return; }
  if (k === 1) {
    await say('vecina', 'Ay, mijita, ¿ir a la plaza? ¿Y si nos retan los soldados?');
    const i = await ask(null, ['Doña Paula se paró frente a los soldados… ¡y ellos se fueron!', 'Mejor quédese en su casa']);
    if (i === 1) { await say('vecina', 'Sí… mejor me quedo.'); await say('mg', '(Mmm, así no la voy a convencer…)'); return; }
    await say('vecina', '¿En serio? ¡Qué valiente! Bueno… si una señora pudo, yo también puedo. ¡Voy!');
  } else if (k === 2) {
    await say('nino', '¿Para qué voy a ir? ¡Yo soy chico! Los niños no podemos cambiar nada.');
    const i = await ask(null, ['¡Yo también soy chica y he ayudado a muchos fundadores!', 'Es verdad, mejor anda a jugar']);
    if (i === 1) { await say('nino', 'Ya…'); return; }
    await say('nino', '¿De verdad? ¡Entonces voy a ir a gritar «¡Viva la patria!» más fuerte que nadie!');
  } else {
    await battle(OPPONENTS.temeroso);
  }
  setFlag('conv' + k); despawn('conv' + k);
  const n = [1, 2, 3].filter(q => G.flags['conv' + q]).length;
  G.ents.push(makeEnt({ id: 'oy' + k, sprite: ['vecina', 'nino', 'vecino'][k - 1], x: [12, 16, 14][k - 1], y: [11, 11, 12][k - 1], dir: 'up' }));
  setObjective(n >= 3 ? 'Volver donde doña Cornelia.' : `Convencer a 3 vecinos de ir a la plaza (${n}/3).`);
};
const MAIPU_ENTER = async () => {
  if (!G.flags.llego_maipu) {
    setFlag('llego_maipu'); await chapterOnce(6);
    await say('mg', '¡Un campamento! Carpas, fogatas, cañones… y la bandera de la estrella solitaria flameando por todas partes.');
    await say('mg', 'Es el 5 de abril de 1818, el día de la Batalla de Maipú. Tengo que encontrar a Nemo… y a Ramón Freire, el del gran bigote.');
    setObjective('Pasar el control del sargento y buscar a Ramón Freire (al norte).');
  }
};
const REPASO = async () => {
  await battle(OPPONENTS.repaso);
  setFlag('duelo_repaso'); despawn('sargento'); removeProp('barrera');
  setObjective('Hablar con Ramón Freire, junto a las carpas del norte.');
};
const FREIRE = async () => {
  if (!G.flags.freire_hablo) {
    setFlag('freire_hablo'); meet('freire');
    await say('freire', '¡Ramón Freire, para servirle! ¿Una niña en el campamento? ¡Qué valiente! Pero llegas en un mal momento…');
    await card('Antes de Maipú (1818)', ['El *Acta de la Independencia* se firmó en *Concepción*, con fecha 1 de enero de 1818: Chile queda «para siempre separado de la monarquía de España».', 'El *12 de febrero* se juró: Bernardo en *Talca*, y en Santiago se lanzaron medallas al pueblo.', 'Pero el *19 de marzo*, en *Cancha Rayada*, los realistas sorprendieron de madrugada al ejército patriota. Doña *Paula Jaraquemada* recibió a los soldados en su hacienda de Paine. Cuando un capitán realista le pidió las llaves de la bodega, ella le mostró el brasero: «Yo sola mando aquí».'], [['1 ene', 'Acta', true], ['19 mar', 'Cancha Rayada'], ['5 abr', 'Maipú']]);
    await say('freire', '¡Perdí mi bandera! Un perrito con un collar brillante se la llevó jugando hacia el sur del campamento.');
    await say('mg', '¡Ese es Nemo! ¡Yo la busco!');
    setFlag('buscar_bandera'); setObjective('Buscar la bandera de Freire (sigue el rastro brillante, al suroeste).');
    setTrail([[19, 10], [19, 12], [18, 14], [15, 16], [12, 17], [9, 17], [7, 18]]);
    return;
  }
  if (!G.flags.bandera_ok) { await say('freire', '¡Sin mi bandera me siento desnudo, pequeña! Siempre la llevo a mi costado.'); return; }
  if (!G.flags.medalla_freire) {
    takeItem('bandera');
    await say('freire', '¡Mi bandera! ¡Gracias, pequeña! Con ella a mi lado, nada nos detiene.');
    if (!G.flags.duelo_osorio) {
      AUD.sfx('hit'); await flash('#fff', 200);
      await say(N, '¡Bum! ¡Bum! Suenan los cañones. Las tropas del general *Mariano Osorio* avanzan por los cerrillos de Maipú.');
      await say('freire', '¡Pequeña, ayúdanos con tus ideas mientras cargamos! ¡Adelante!');
      await battle(OPPONENTS.osorio); setFlag('duelo_osorio');
      await say(N, 'Las tropas realistas retroceden. ¡Los patriotas ganaron la Batalla de Maipú!');
    }
    await card('Un año muy importante: 1818', ['El *Acta de la Independencia* se firmó en *Concepción*, con fecha 1 de enero de 1818. El 12 de febrero se juró: Bernardo en Talca, y en Santiago se lanzaron medallas al pueblo. ¡Chile ya no es parte de la monarquía de España!', 'El *5 de abril de 1818*, en los llanos de Maipú, el ejército patriota triunfó y aseguró la Independencia.', 'Ramón Freire fue uno de los valientes de Maipú. Y al final de la batalla pasó algo muy emocionante…'], [['1817', 'Chacabuco'], ['1818', 'Independencia', true], ['1818', 'Maipú', true]]);
    AUD.play('independencia');
    spawn({ id: 'sanmartin', sprite: 'sanmartin', speaker: 'sanmartin', x: 33, y: 9, dir: 'left', ghost: true }); spawn({ id: 'ohiggins', sprite: 'ohiggins', speaker: 'ohiggins', x: 19, y: 13, dir: 'up', ghost: true, talk: () => OHIGGINS_MAIPU() });
    await say(N, '¡Llegan dos generales!');
    await walk('sanmartin', 'LLLLLLL', 4); await walk('ohiggins', 'UUUURRRRRR', 4);
    face('ohiggins', 'right'); face('sanmartin', 'left');
    await emote('ohiggins', '♥', 900); await emote('sanmartin', '♥', 600);
    await say(N, '¡El *abrazo de Maipú*! Bernardo O\'Higgins y José de San Martín se abrazan felices. ¡Los soldados lanzan sus gorros al aire!');
    setFlag('abrazo_hecho');
    await say('freire', '¿Ves, pequeña? Ninguna victoria es de una sola persona. Trabajando juntos, hasta el final, se logran los grandes sueños. ¡Firmo tu libro con orgullo!');
    await medal('freire');
    await say('freire', 'Anda a saludar al general O\'Higgins. Te estaba mirando con curiosidad.');
    setObjective('Hablar con Bernardo O\'Higgins.');
    return;
  }
  await say('freire', '¡Viva Chile, pequeña! Algún día defenderé esta patria hasta en una lancha, en los mares del sur.');
};
const BANDERA_FREIRE = async () => {
  await say(N, 'Entre el pasto hay huellitas de perro… ¡y la bandera de Freire! Nemo no está, pero dejó un rastro de estrellitas.');
  await giveItem('bandera'); setFlag('bandera_ok'); setTrail([]);
  setObjective('Devolverle la bandera a Ramón Freire.');
};
const OHIGGINS_MAIPU = async () => {
  if (G.flags.medalla_freire2) { await say('ohiggins', 'Te espero en Santiago, pequeña. Sigue el sonido del piano.'); return; }
  face('ohiggins', 'mg');
  await say('ohiggins', '¿Nos conocemos, pequeña? Tienes la misma mirada de una niña que encontré llorando en una calle de Santiago, hace muchos años…');
  await say('mg', '¡El jinete del caballo blanco! ¡Era usted! ¡Bernardo O\'Higgins!');
  await say('ohiggins', '«Que nuestra tierra nos vuelva a encontrar». ¿Lo recuerdas? Y aquí estamos.');
  meet('ohiggins');
  await say('ohiggins', 'Por cierto: un perrito con collar brillante me sigue a todas partes. Hoy se fue corriendo hacia Santiago. Parece que le gusta la música.');
  await say('mg', 'La bitácora dice: «Si buscas a quien gobierna el país, sigue el sonido del piano. Santiago, 1823».');
  setFlag('medalla_freire2'); setFlag('dest1823'); setObjective('Viajar a Santiago, 1823, y seguir el sonido del piano.');
};

// =================================================================== CAPÍTULO 5 · SANTIAGO 1823
const STGO1823_ENTER = async () => {
  if (!G.flags.llego_1823) {
    setFlag('llego_1823'); await chapterOnce(7);
    await say('mg', '¡Este Santiago es completamente diferente! Niños entrando a escuelas con libros bajo el brazo… ¡y la bandera nueva con la estrella solitaria!');
    await say('mg', 'Es como si Chile fuera un niño que creció: en 1810 usaba pañales, en 1814 gateaba… ¡y ahora aprende a caminar solito!');
    setObjective('Seguir el sonido del piano: la casa del noreste de la plaza.');
  }
};
const ALFAJORES = async () => {
  if (!G.flags.alfajores) { await say('vendedora', '¡Alfajores de miel! Los más ricos de todo Santiago. Toma, mijita, dos: ¡uno para ti y uno para tu perrito!'); await giveItem('alfajor', 2); setFlag('alfajores'); await say('mg', '¡ÑAMI! Es como probar un pedacito de cielo. Guardaré uno para Nemo.'); return; }
  await say('vendedora', '¡Alfajores, alfajores de miel!');
};
const CASA_OH_ENTER = async () => {
  if (!G.flags.casa_oh_visto) {
    setFlag('casa_oh_visto');
    face('isabel', 'mg');
    await say('isabel', 'Buenos días… ¿Buscas a un perrito con collar brillante? ¡Ah! ¡El perrito músico! Está con mi hijo Bernardo. Soy Isabel Riquelme, pasa adelante.');
    await say(N, 'Una música llena la sala: un poco triste, un poco alegre… pero, sobre todo, muy, muy valiente. Y a los pies del piano, moviendo la cola al ritmo…');
    await say('mg', '(¡Nemo!)');
    setObjective('Hablar con Bernardo O\'Higgins, junto al piano.');
  }
};
const MUSEO = async (k) => {
  const T = {
    silla: ['Una silla de montar con marcas de batalla.', 'ohiggins', 'Con esta silla crucé la cordillera junto a miles de valientes. Hacía tanto frío que hasta las palabras se congelaban.'],
    pluma: ['Una pluma dorada en una caja de cristal.', 'ohiggins', 'Con esta pluma firmé el Acta de la Independencia, en Concepción. Cada letra estaba llena de los sueños de miles de personas.'],
    tabla: ['Una vieja tabla de madera con marcas de agua.', 'ohiggins', 'Es de un barco de la Escuadra Libertadora. El comandante Cochrane, un marino valiente como un león, nos ayudó a liberar a nuestros vecinos del Perú.'],
    constitucion: ['Un papel con letras grandes: «Constitución».', 'ohiggins', 'De este papel depende cómo nos gobernamos y organizamos. Impide que otros te quiten lo que es tuyo o tu libertad.'],
    cuadro: ['Un cuadro de Bernardo con sus amigos. Reconoces a José de San Martín y a Manuel Rodríguez.', 'ohiggins', 'Este cuadro me recuerda que ninguna victoria es obra de una sola persona.']
  }[k];
  await say(N, T[0]); if (G.flags.medalla_ohiggins) return; await say(T[1], T[2]);
  setFlag('museo_' + k);
};
const OHIGGINS_CASA = async () => {
  if (G.flags.medalla_ohiggins) { await say('ohiggins', 'Chile es como un gran jardín, pequeña. Todos, absolutamente todos, son importantes.'); return; }
  if (!G.flags.piano_ok) {
    face('ohiggins', 'mg');
    await say('ohiggins', '¡Bienvenida, pequeña viajera! ¿Quién pensó que nos volveríamos a encontrar? Tu buen perro ha sido un excelente compañero.');
    await say('mg', '¡Nemo! ¡Ven aquí!'); AUD.sfx('bark'); nemoJoin(); setFlag('nemo_piano');
    await say('ohiggins', 'Cada vez que toco música sobre nuestras batallas, mueve la cola como si entendiera cada nota. ¿Me ayudas a terminar esta melodía?');
    await simon({ title: 'El piano de Bernardo', help: 'Escucha la melodía del piano y repítela.', symbols: [{ dir: 'up', label: 'Do', color: '#f4f4f0', textCol: '#2a1e2e', note: 'C5' }, { dir: 'right', label: 'Re', color: '#e8e0f0', textCol: '#2a1e2e', note: 'D5' }, { dir: 'down', label: 'Mi', color: '#2a2226', note: 'E5' }, { dir: 'left', label: 'Sol', color: '#5a5060', note: 'G5' }], rounds: [3, 4, 5, 6], inst: 'piano', win: '¡Qué melodía más valiente!' });
    setFlag('piano_ok');
    await say('ohiggins', '¡Bravo! Mira tranquila mi salón: está lleno de recuerdos. Cuando quieras, conversamos.');
    setObjective('Mirar los recuerdos del salón y volver a hablar con Bernardo.');
    return;
  }
  const seen = ['silla', 'pluma', 'tabla', 'constitucion', 'cuadro'].filter(k => G.flags['museo_' + k]).length;
  if (seen < 3) { await say('ohiggins', `Mira mis recuerdos: la silla de montar, la pluma, la tabla del barco, el cuadro, la Constitución… (has visto ${seen} de 5; mira al menos 3).`); return; }
  await say('ohiggins', 'Hoy tendré que tomar una decisión muy difícil. ¿Les gustaría a ti y a Nemo acompañarme al *Real Consulado*?');
  await say('mg', '¡CHISPAS! ¡El Real Consulado! Allí conocí a don Mateo. ¡Todo termina en el mismo lugar!');
  setFlag('visita_cabildo23');
  await warp('cabildo1823', 11, 13, 'up');
};
const CABILDO23_ENTER = async () => {
  if (G.flags.medalla_ohiggins) return;
  await say(N, 'El salón del Consulado está repleto: militares con medallas que tintinean, señores con levitas negras… La gente susurra, nerviosa.');
  await say(N, 'Hay mucha tensión: el general Freire viene marchando desde Concepción y muchos vecinos le piden a Bernardo que deje el mando.');
  await say(N, 'Bernardo camina hasta el centro, frente a la misma mesa donde don Mateo comenzó todo, hace trece años. Se quita la banda tricolor y se abre la casaca.');
  await say('ohiggins', 'Me voy con el consuelo de dejar a Chile independiente de toda dominación extranjera. Si alguien quiere acusarme, no me defenderé: ¡aquí está mi pecho!');
  await say('ohiggins', 'Dejo el mando a una Junta, para que otros continúen el camino que tantos ayudamos a construir.');
  await say(N, 'Hay gritos, discusiones, aplausos… y algunos lloran. Es el 28 de enero de 1823.');
  const i = await ask('MG piensa en todo lo que aprendió… ¿Qué está haciendo Bernardo?', ['Está poniendo el bien de todos por sobre su poder', 'Se está rindiendo', 'Se va de vacaciones']);
  if (i !== 0) await say('mg', 'No… no se está rindiendo. Lo presionaron mucho, pero eligió no pelear contra su propia gente: puso el bienestar de todos por encima de su poder.');
  else await say('mg', '¡Eso es! A veces amar significa saber cuándo dar un paso al costado para que otros puedan avanzar.');
  await say('mg', '«Este pequeño y colorín fundador en nuestro gran líder se convirtió… ¡Gran amante de nuestra tierra! Este pequeño fundador “Viva Chile” exclamó».');
  face('ohiggins', 'mg');
  await say('ohiggins', 'Recuerda, pequeña MG: Chile es como un gran jardín que necesita que todos trabajemos juntos. Algunos plantan semillas, otros riegan… y otros dan un paso al costado para que entre el sol.');
  await medal('ohiggins');
  await say(N, 'Nemo le lame la mano a Bernardo, como diciendo «gracias». Su collar empieza a brillar otra vez…');
  await say('mg', '¡Once firmas! Solo queda una página despierta a medias en el libro: *Diego Portales*. Valparaíso, 1832.');
  await nemoVanish();
  await say('mg', '¡Viva Chile! … Nemo, ¡ya sé dónde vas!');
  setFlag('dest1832'); setObjective('Volver a la nave (sureste de la plaza) y viajar a Valparaíso, 1832.');
  await warp('stgo1823', 17, 9, 'down');
};

// =================================================================== CAPÍTULO 6 · VALPARAÍSO 1832
const VALPO_ENTER = async () => {
  if (!G.flags.llego_valpo) {
    setFlag('llego_valpo'); await chapterOnce(8);
    await say('mg', '¡El mar! Barcos enormes, gaviotas, y casas de todos colores subiendo por los cerros. ¡Valparaíso!');
    setObjective('Buscar la oficina de don Diego Portales (puerta café, al centro).');
  }
};
const PORTALES = async () => {
  if (G.flags.medalla_portales) { await say('portales', 'Una casa en orden dura mucho tiempo. Ve a casa, pequeña. Te esperan.'); return; }
  meet('portales');
  await say('portales', '…');
  await say('mg', '¿Don Diego Portales? ¡El del libro! «Hombre de pocas palabras…»');
  await say('portales', 'Mmm. Ese perro tuyo entró como un torbellino y desordenó todos mis papeles de historia. Ahora duerme como si nada.');
  await say('portales', 'Para que una República dure, hay que ordenar la casa: reglas claras, cuentas claras. ¿Me ayudas a ordenar estos papeles, del más antiguo al más nuevo?');
  await timeline([{ t: 'Primera Junta de Gobierno', y: '1810' }, { t: 'Doña Javiera borda la primera bandera', y: '1812' }, { t: 'Se crea la Biblioteca Nacional', y: '1813' }, { t: 'Desastre de Rancagua', y: '1814' }, { t: 'Bandera de la estrella solitaria', y: '1817' }, { t: 'Independencia y triunfo de Maipú', y: '1818' }, { t: 'O\'Higgins deja el mando', y: '1823' }]);
  await say('portales', '…Perfecto. Eres una niña muy ordenada. Una casa ordenada, con reglas claras, dura mucho tiempo. Así quiero que sea Chile.');
  await say('portales', 'Firmo tu libro. Es lo justo.');
  await medal('portales');
  await DOCE();
};
const NEMO_FINAL = async () => { if (!G.flags.medalla_portales) { AUD.sfx('bark'); await say(N, 'Nemo duerme sobre una pila de papeles. Ronca suavecito: «zzz… guau… zzz».'); return; } };
const DOCE = async () => {
  await say(N, 'De pronto, el libro empieza a brillar en la mochila de MG…');
  AUD.jingle('misterio'); await flash('#ffe680', 900);
  await say('mg', '¡Las doce firmas! ¡El libro está completo!');
  await say(N, 'Nemo despierta, se estira y corre hacia MG. Su collar brilla… pero esta vez suave y tranquilo.');
  const n = G.ents.find(e => e.id === 'nemo'); if (n) { AUD.sfx('bark'); face('nemo', 'mg'); }
  nemoJoin(); setFlag('nemo_final');
  await say('mg', 'Esta vez no desapareces, ¿verdad, Nemo? Ya conociste a todos… ¡y yo también!');
  await say('mg', 'En la última página de la bitácora apareció un mapa nuevo: «Cerro Huelén, el *Mirador del Tiempo*. Te espero en la cumbre». ¡Es la letra de mi tío!');
  setObjective('Viajar en la nave (en el muelle) al Cerro Huelén, el Mirador del Tiempo.');
};
// =================================================================== CAPÍTULO 9 · EL MIRADOR DEL TIEMPO
const MONTE_ENTER = async () => {
  if (G.flags.llego_monte) return;
  setFlag('llego_monte'); await chapterOnce(9);
  await say('mg', 'El Cerro Huelén… Desde aquí se ve Santiago entero. Y allá arriba, en la cumbre, ¡hay una luz con forma de sombrero!');
  await say(N, 'Un letrero dice: «Camino de la Victoria. Cuatro pasos, cuatro guardianes». Para pasar tendrás que usar los *poderes* de tus medallas.');
  setObjective('Subir el Camino de la Victoria hasta la cumbre.');
};
const OBSTACULOS = {
  1: { flag: 'obs1', ent: 'centinela', texto: 'Un centinela de Talavera vigila el paso. Si te reconoce, no te dejará subir.', ok: ['disfraz'], exito: 'MG se pone el disfraz de abuelita de Manuel Rodríguez. «Buenas tardes, mijito». ¡El centinela se aparta, muy educado!', pista: 'Manuel Rodríguez engañaba a los soldados disfrazándose.' },
  2: { flag: 'obs2', prop: 'porton', texto: 'Un portón con un candado musical. Tiene cuatro cuerdas, como una guitarra.', ok: ['melodia'], exito: 'MG tararea la melodía secreta de doña Luisa… ¡clic! El portón se abre.', pista: 'Doña Luisa usaba una melodía secreta para reconocer a los amigos.' },
  3: { flag: 'obs3', prop: 'derrumbe', texto: 'Un derrumbe de rocas tapa el camino. ¡Pesan demasiado para una sola persona!', ok: ['junta'], exito: 'MG recuerda el Cabildo abierto: ¡juntos se puede! Los vecinos de 1810 aparecen como un recuerdo de luz y mueven las rocas.', pista: 'Don Mateo reunió a muchos vecinos para decidir juntos.' },
  4: { flag: 'obs4', ent: 'niebla', texto: 'Una niebla gris y fría: la *niebla del olvido*. No se ve nada del camino.', ok: ['saber', 'pluma'], exito: 'Las páginas del libro brillan como una lámpara. ¡La niebla retrocede!', pista: 'Don Manuel de Salas decía que la educación ilumina.' }
};
const OBSTACULO = async (k) => {
  const o = OBSTACULOS[k]; if (G.flags[o.flag]) return;
  if (k > 1 && !G.flags['rey' + (k - 1)]) return;
  await say(N, o.texto);
  const good = POWERS.find(p => p.id === o.ok[0]);
  const others = shuffle(POWERS.filter(p => !o.ok.includes(p.id) && G.medals.includes(p.medal))).slice(0, 2);
  const opts = shuffle([good, ...others]);
  const i = await ask('¿Qué poder usarás?', opts.map(p => `${p.name} (${FOUNDERS.find(f => f.id === p.medal).short})`).concat(['Pensarlo mejor']), null, { cancel: true });
  if (i < 0 || i >= opts.length) return;
  if (!o.ok.includes(opts[i].id)) { AUD.sfx('wrong'); await say('mg', `(Mmm… ${opts[i].name} no sirve aquí. ¡Piensa otra vez!)`); toast('Pista: ' + o.pista, 5); return; }
  AUD.sfx('heal'); await flash(opts[i].col || '#ffe680', 400);
  await say(N, o.exito);
  setFlag(o.flag);
  if (o.ent) despawn(o.ent); if (o.prop) removeProp(o.prop);
  setObjective(`Subir el Camino de la Victoria (${k} de 4 pasos abiertos).`);
};
const REYES = {
  1: { opp: 'rey1', id: 'rey1', who: 'sgt_talavera', a: '¡Alto, niña! Los Cuatro del Rey cuidamos este cerro. Soy el primero: ¡el Sargento de Talavera! ¿Creías que te habías librado de mí?', b: '¡Uf! Pasa… pero arriba te espera alguien más elegante que yo.' },
  2: { opp: 'rey2', id: 'rey2', who: 'marco', a: '¡Oh, la niña de los fundadores! Soy el segundo de los Cuatro del Rey. ¿Te gustan mis encajes nuevos?', b: '¡Mis encajes! Está bien, está bien… pasa. Osorio no será tan amable.' },
  3: { opp: 'rey3', id: 'rey3', who: 'osorio', a: 'Me venciste en Maipú, pero aquí arriba el tiempo es otro. ¡Soy el tercero de los Cuatro del Rey!', b: 'Otra vez derrotado… Sube, si te atreves. El último guardián te conoce bien.' },
  4: { opp: 'rey4', id: 'rey4', who: 'sanbruno', a: '¡Nos volvemos a ver, niña del portón! Soy el último de los Cuatro del Rey… y esta vez mi jefe me está mirando.', b: '¡Imposible! ¡Cuatro de cuatro! Mi jefe… mi jefe no te va a perdonar.' }
};
const REY = async (k) => {
  const r = REYES[k]; if (G.flags[r.id]) return;
  if (!G.flags['obs' + k]) return;
  face(r.id, 'mg');
  await say(r.who, r.a);
  await battle(OPPONENTS[r.opp]);
  await say(r.who, r.b);
  setFlag(r.id); despawn(r.id);
  setObjective(k < 4 ? `Subir el Camino de la Victoria (${k} de 4 guardianes vencidos).` : 'Llegar a la cumbre del cerro.');
};
const REVELACION = async () => {
  if (G.flags.monte_final) return;
  AUD.play('final');
  { const t = findEnt('tio'); if (t) { t.x = 11; t.y = 2; t.px = 176; t.py = 32; t.dir = 'down'; t.jaula = true; } }   // el tío, en su jaula, detrás del villano (más atrás para que se vea sobre él)
  G.camFocus = { x: 11.5, z: 4.6 };   // la cámara encuadra al villano al medio, con el tío detrás
  await say('mg', '¡TÍO! ¿Eres tú? ¡Te encontré!');
  await say(N, 'El tío está atrapado en la jaula de sombras de la visión. Delante de él, la figura encapuchada que MG ya conoce se ríe.');
  spawn({ id: 'sombra', sprite: 'olvido', speaker: 'olvido', x: 11, y: 5, dir: 'down', ghost: true });
  await say('olvido', 'Ji, ji… ¡Nos volvemos a ver, niña! Esta es mi última oportunidad: si nadie recuerda a tus fundadores, se borrarán para siempre.');
  await say('mg', '¡Ya te gané tres veces, Olvido! ¡Suelta a mi tío!');
  await battle(OPPONENTS.olvido);
  AUD.sfx('hit'); await shake(500);
  await say(N, 'El Olvido se retuerce… ¡y crece! Una corona dorada aparece sobre la capucha.');
  despawn('sombra'); spawn({ id: 'espiritu', sprite: 'espiritu', speaker: 'espiritu', x: 11, y: 5, dir: 'down', ghost: true });
  await say('mg', '(¡La corona de mis visiones!)');
  await say('espiritu', 'El Olvido era solo mi sombra. Yo soy el *Espíritu Realista*. Quiero que Chile olvide su independencia, sus virtudes y sus tradiciones… ¡para cambiar su historia!');
  await say('mg', '¡No lo voy a permitir! ¡Yo me acuerdo de todos!');
  await battle(OPPONENTS.espiritu);
  await say('espiritu', '¡Esto no ha terminado, niña! Hay muchos otros momentos de la historia que puedo cambiar… ¡Nos veremos!');
  AUD.sfx('warp'); await flash('#2a0a1a', 500); despawn('espiritu'); setFlag('espiritu_escapo');
  await TIO_DESPEDIDA();
};
const TIO_DESPEDIDA = async () => {
  AUD.play('piano');
  face('tio', 'mg');
  await say(N, 'La jaula se deshace. El tío brilla con una luz suave; su sombrero todavía le tapa los ojos.');
  { const t = findEnt('tio'); if (t) { t.jaula = false; sparkleAt(t.x, t.y, 30); t.ghost = true; await walk('tio', 'DDD', 2.5); face('tio', 'mg'); } }   // baja flotando hasta MG
  G.camFocus = { x: 11.5, z: 5.2 };
  await say('mg', '¡Tío! Ahora podemos volver todos juntos a casa.');
  await say('tio', 'MG, mi niña valiente… Escúchame con calma. Yo ya no puedo volver contigo.');
  await say('tio', 'Hace un tiempo me fui de este mundo. Por eso solo me recuerdas el día de tu cumpleaños, cuando te regalé el libro.');
  await say('tio', 'El libro y la bitácora son mi forma de seguir acompañándote. Vivo en cada página, y en cada historia que tú recuerdes.');
  await say('tio', 'El Espíritu Realista quiere que Chile olvide su pasado. Tú eres la única que puede protegerlo y mantener vivas sus virtudes y tradiciones.');
  await say('tio', 'Ya sabes viajar en el tiempo. Vuelve a casa, abraza a tu familia… y después sigue viajando: hay muchas otras figuras de nuestra historia que conocer.');
  await say('tio', 'Ahora es nuestro turno de trabajar por ese sueño. ¡Viva Chile!');
  await emote('mg', '♥', 900);
  await say(N, 'La luz del tío se vuelve mil estrellitas que entran en el libro. En la última página aparece un dibujo nuevo: un sombrero y una sonrisa.');
  despawn('tio'); setFlag('monte_final'); G.tint = null; G.camFocus = null;
  await say('mg', 'Te lo prometo, tío. ¡Viva Chile! … Nemo, ¡vamos a casa!');
  await timeTravel({ label: 'Hoy · Casa de MG', year: 'HOY', map: 'casa_lab', x: 6, y: 5, dir: 'down', after: () => ENDING() });
};
const ENDING = async () => {
  await sleep(300); await chapterOnce(10);
  await say(N, '¡FLASH! El sol entra por la ventana del laboratorio igual que cuando se fue… como si el tiempo no hubiera pasado.');
  spawn({ id: 'mama', sprite: 'mama', x: 4, y: 7, dir: 'up', speaker: 'mama' }); spawn({ id: 'papa', sprite: 'papa', x: 9, y: 7, dir: 'up', speaker: 'papa' }); spawn({ id: 'max', sprite: 'max', x: 11, y: 8, dir: 'left', speaker: 'max' });
  await say('mama', '¡MG!'); await say('papa', '¡MG! ¡Y Nemo!');
  await walk('mama', 'URU'); face('mama', 'mg'); await walk('papa', 'ULLU'); face('papa', 'mg');
  await walk('max', 'LLLU', 3); face('max', 'mg'); await emote('max', '♥', 900);
  await say(N, 'Max se aferra al vestido café de MG como si quisiera asegurarse de que no se iría de nuevo. Nemo le lame la cara a todos.');
  await say('mg', 'Todo está bien. Tuve una aventura increíble.');
  await say('papa', '¡Y llegaste antes de la cena!');
  await say('mg', 'Y miren: en la última página de la bitácora de mi tío hay un mensaje, con su letra desordenada de siempre…');
  await letter('Querida MG:', 'Espero que esta aventura te haya mostrado lo maravillosa que es nuestra tierra y lo importante que fue el esfuerzo de nuestros fundadores. Ellos soñaron con un Chile donde todos pudieran ser libres y felices. Ahora es nuestro turno de trabajar por ese sueño. ¡Viva Chile!', 'Tu tío');
  await say('mg', 'Tomé un lápiz y, justo después del mensaje de mi tío, escribí mi propio poema para Chile:');
  await letter('Mi querido Chile', 'Mi querido Chile es como un jardín | que entre todos debemos cuidar, | con montañas que tocan el cielo | y un mar que nos invita a soñar. | Los valientes que un día lucharon | nos dejaron un regalo especial: | la tarea de hacer de esta tierra | un lugar donde podamos libres amar.', 'MG');
  await say('mg', 'Al final, eso es lo que aprendí de mis amigos fundadores: que la libertad es como una plantita que hay que regar todos los días… y que cada uno de nosotros, sin importar lo pequeños que seamos, puede ayudar a que crezca fuerte.');
  await say('mg', '(Mi tío ya no está, pero cada vez que abro el libro lo siento cerca. Y el Espíritu Realista escapó… Menos mal que ya sé viajar en el tiempo.)');
  setFlag('fin'); G.follower = null; setFlag('nemo_sigue', false); G.outfit = 'mg_casa'; G.player.sprite = 'mg_casa';
  saveGame();
  await fadeOut('#000', 800);
  AUD.play('creditos'); CRED.t = 0; G.scene = 'credits'; await fadeIn(400);
  await new Promise(r => CRED.done = r);
  await fadeOut('#000', 600);
  G.scene = 'world'; enterMap('casa_living', 9, 6, 'down'); await fadeIn(600);
  await say(N, '¡Gracias por jugar! La nave del laboratorio te lleva a visitar a tus amigos fundadores cuando quieras. *MG volverá*: el Espíritu Realista prepara un plan todavía mayor…');
  setObjective('¡Aventura completa! Visita a los fundadores cuando quieras. MG volverá…', true);
};

// =================================================================== EL OLVIDO ANTES DEL FINAL Y LOS PRESAGIOS
// El Olvido aparece en 1810 (al volver a la nave), en la cordillera (al despejar la senda) y en 1823 (al volver a la nave).
// Tras cada derrota el libro muestra un presagio: MG no entiende todavía, pero sabe que algo pasa con su tío.
async function vision(figs, lines) {
  const t0 = G.t; let t1 = null;
  const L = {
    draw(c) {
      const a = Math.min(1, (G.t - t0) / 0.8) * (t1 === null ? 1 : Math.max(0, 1 - (G.t - t1) / 0.5));
      const cx = W / 2, cy = 92, r = 84 * (0.6 + 0.4 * a);
      c.save(); c.globalAlpha = a * 0.82; c.fillStyle = '#120a1e'; c.fillRect(0, 0, W, H); c.globalAlpha = a;
      // la visión aparece dentro de un círculo que respira, como una página que se abre
      c.save(); c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
      const bg = IMG.bf_espiritu; if (bg) { c.filter = 'saturate(0.55) brightness(0.75)'; c.drawImage(bg, cx - r * 1.6 + Math.sin(G.t * 0.4) * 4, cy - r, r * 3.2, r * 2.1); c.filter = 'none'; }
      c.fillStyle = 'rgba(70,40,110,0.35)'; c.fillRect(cx - r, cy - r, r * 2, r * 2);
      for (const f of figs) {
        const im = IMG[f.img] || (f.alt && IMG[f.alt]); if (!im) continue;
        const h = f.h, w = h * im.width / im.height, x = cx + (f.x || 0) - w / 2, y = cy + r * 0.78 + (f.y || 0) - h + Math.sin(G.t * 1.5 + (f.x || 0)) * 2;
        c.save(); c.globalAlpha = a * (f.alpha ?? 1); if (f.dark) c.filter = 'brightness(0.42) saturate(1.3) contrast(1.15)';
        c.drawImage(im, x, y, w, h); c.restore();
        if (f.cage) { c.save(); c.globalAlpha = a * 0.9; c.strokeStyle = '#2a0e3a'; c.lineWidth = 2.2; for (let i = 0; i <= 5; i++) { const bx = x - 4 + i * (w + 8) / 5; c.beginPath(); c.moveTo(bx, y - 6); c.lineTo(bx, y + h); c.stroke(); }
          c.strokeStyle = 'rgba(190,120,255,0.55)'; c.lineWidth = 1; c.strokeRect(x - 4, y - 6, w + 8, h + 6); c.restore(); }
      }
      // niebla que se arremolina
      for (let i = 0; i < 14; i++) { const k = G.t * 0.3 + i * 1.37, rr = r * (0.7 + 0.3 * ((i * 37) % 10) / 10), fx = cx + Math.cos(k) * rr, fy = cy + Math.sin(k * 1.3) * rr * 0.75, fr = 22 + (i % 4) * 8;
        const g = c.createRadialGradient(fx, fy, 0, fx, fy, fr); g.addColorStop(0, i % 3 ? 'rgba(200,184,232,0.22)' : 'rgba(138,106,200,0.25)'); g.addColorStop(1, 'rgba(138,106,200,0)');
        c.globalAlpha = a; c.fillStyle = g; c.fillRect(fx - fr, fy - fr, fr * 2, fr * 2); }
      c.restore();
      c.globalAlpha = a; c.strokeStyle = 'rgba(200,160,255,0.85)'; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = 'rgba(255,220,140,0.35)'; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, r + 4 + Math.sin(G.t * 3) * 1.5, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
  };
  const done = UI.push(L);
  AUD.sfx('warp'); await sleep(700);
  for (const [who, text] of lines) await say(who, text);
  t1 = G.t; await sleep(500); L.resolve(); await done;
}
const PRESAGIOS = {
  1: () => vision([{ img: 'v_espiritu', h: 128, alpha: 0.75, dark: true }],
    [[N, 'Mientras la niebla se va, el libro se abre solo. En una página en blanco aparece algo por un instante…'],
     [N, 'Un cerro con un mirador… y encima, una sombra enorme con una *corona*.'],
     ['mg', '(¿Qué fue eso? El Olvido dijo «mi amo»… ¿Quién será? … Seguro me lo imaginé.)']]),
  2: () => vision([{ img: 'v_espiritu', h: 124, x: -46, alpha: 0.9, dark: true }, { img: 'c_tio_frente', alt: 'r_tio', h: 92, x: 54, cage: true }],
    [[N, 'La nieve se arremolina y forma una imagen dentro del libro…'],
     ['corona', 'Mi sombra perdió otra vez… No importa, niña. Yo tengo algo que tú quieres.'],
     ['tio', '¡MG! … ¡No… olvides…!'],
     ['mg', '¡¿TÍO?! ¡TÍO!'],
     [N, 'La imagen se apaga. MG no entiende nada… pero ahora sabe que algo le pasa a su tío.'],
     ['mg', '(Mi tío, encerrado en una jaula de sombras… Tengo que seguir. Cada fundador que recuerdo me acerca a él.)']]),
  3: () => vision([{ img: 'v_espiritu', h: 150, y: -6, alpha: 0.55, dark: true }, { img: 'c_tio_frente', alt: 'r_tio', h: 50, y: -58, cage: true },
    { img: 'v_talavera', h: 44, x: -64, y: -22 }, { img: 'v_marco', h: 44, x: -32, y: -14 }, { img: 'v_osorio', h: 44, x: 32, y: -14 }, { img: 'v_sanbruno', h: 44, x: 64, y: -22 }],
    [[N, 'El libro tiembla. En la página en blanco aparece un cerro con un camino en zigzag…'],
     [N, 'Cuatro guardianes en el camino. En la cumbre, una jaula… y sobre ella, la sombra de la corona.'],
     ['corona', 'Cuando tengas todas tus medallitas, sube a mi Mirador del Tiempo. Te estaré esperando… con tu tío.'],
     ['mg', '(Un cerro, cuatro guardianes y mi tío. Ya no tengo miedo: cuando tenga las doce medallas, ¡iré a buscarlo!)']])
};
const OLVIDO_TEXTOS = {
  1: [[N, 'De la nave sale una niebla gris… y de la niebla, una figura encapuchada que se ríe bajito.'],
      ['olvido', 'Ji, ji… ¿Así que tú eres la niña que anda recordando a todo el mundo? Yo soy *El Olvido*. Lo que nadie recuerda… ¡yo lo borro!'],
      ['mg', '¡Las páginas de don Mateo y don Manuel se están poniendo grises! ¡Suéltalas!']],
  2: [[N, 'De pronto, la niebla baja de las cumbres… y se ríe.'],
      ['olvido', '¡Ji, ji! ¿Me extrañaste? Aquí arriba, con tanto frío, todos olvidan para qué caminan.'],
      ['mg', '¡Tú otra vez! ¡No vas a borrar el Cruce de los Andes!']],
  3: [[N, 'Cuando MG se acerca a la nave, la plaza se pone gris, como una foto vieja.'],
      ['olvido', 'Ji, ji… Bernardo dejó el mando. En unos años, ¿quién se acordará de él?'],
      ['mg', '¡Yo me voy a acordar! ¡Y todos los que lean mi libro!']]
};
async function OLVIDO(k) {
  if (G.flags['olvido' + k]) return;
  const p = G.player; AUD.sfx('warp'); await flash('#3a2a5a', 300);
  spawn({ id: 'sombra' + k, sprite: 'olvido', speaker: 'olvido', x: p.x, y: Math.max(1, p.y - 2), dir: 'down', ghost: true });
  face('mg', 'up');
  for (const [who, text] of OLVIDO_TEXTOS[k]) await say(who, text);
  await battle(OPPONENTS['olvido' + k]);
  setFlag('olvido' + k); AUD.sfx('warp'); await flash('#2a0a1a', 300); despawn('sombra' + k);
  await PRESAGIOS[k]();
}
// la nave: en 1810 y 1823 El Olvido sale a cortar el paso antes del viaje (devuelve true si hubo encuentro)
async function olvidoEnLaNave() {
  const k = G.mapId === 'stgo1810' && G.flags.dest1814 && !G.flags.olvido1 ? 1 : G.mapId === 'stgo1823' && G.flags.dest1832 && !G.flags.olvido3 ? 3 : 0;
  if (!k) return false;
  await OLVIDO(k); return true;
}
