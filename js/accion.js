// =====================================================================
//  ACCIÓN: persecuciones a pie y cabalgatas (v4)
//  - chase(): los perseguidores buscan el camino más corto hacia MG. Si la alcanzan, MG vuelve al punto
//    seguro y lo intenta otra vez (nunca se pierde). Corriendo (B) se les puede escapar.
//  - ride(): cabalgata en tres carriles; arriba/abajo para esquivar, estrellas para juntar.
// =====================================================================
'use strict';
function chase(o) {   // o: { ids, goal:[x,y,w,h], safe:[x,y,dir], speed, aviso }
  const C = Object.assign({ t: 0, lock: 0.8, veces: 0 }, o);
  C.starts = o.ids.map(id => { const e = findEnt(id); return e ? [e.x, e.y, e.dir] : null; });
  // la escena que llama queda en pausa: MG recupera los controles mientras dura la persecución
  C.busySaved = G.busy; G.busy = 0;
  // los vecinos se hacen a un lado (MG pasa entre ellos): nadie puede tapar el único camino
  C.apartados = G.ents.filter(e => !o.ids.includes(e.id) && e.solid !== false).map(e => { e.solid = false; return e; });
  return new Promise(res => { C.res = v => { C.apartados.forEach(e => { e.solid = true; }); G.busy = C.busySaved; res(v); }; G.chase = C; if (o.aviso) toast(o.aviso, 5); });
}
function chaseUpdate(dt) {
  const C = G.chase, p = G.player; if (!C || !p || G.busy || UI.modal()) return;
  C.t += dt; if (C.lock > 0) { C.lock -= dt; return; }
  const [gx, gy, gw, gh] = C.goal;
  if (p.x >= gx && p.x < gx + gw && p.y >= gy && p.y < gy + gh) { G.chase = null; C.ids.forEach(id => { const e = findEnt(id); if (e) e.next = null; }); C.res(true); return; }
  for (const id of C.ids) {
    const e = findEnt(id); if (!e) continue; e.speed = C.speed || 4.6;
    if (!e.moving) { const path = bfsPath(e.x, e.y, p.x, p.y); if (path && path.length > 2) { const [nx, ny] = path[1]; startMove(e, nx > e.x ? 'right' : nx < e.x ? 'left' : ny > e.y ? 'down' : 'up'); } }
    const ex = e.moving ? e.tx : e.x, ey = e.moving ? e.ty : e.y;
    if (Math.abs(ex - p.x) + Math.abs(ey - p.y) <= 1 || (e.x === p.x && e.y === p.y)) { chaseCaught(C); return; }
  }
}
function chaseCaught(C) {
  C.lock = 99;
  runScript(async () => {
    AUD.sfx('alert'); await flash('#fff', 250); C.veces++;
    await say(N, C.veces < 3 ? '¡Te atraparon! … Pero MG se escabulle entre sus piernas. ¡Inténtalo otra vez! (Mantén B para correr.)' : '¡Casi! Esta vez los soldados se tropiezan y te dan más ventaja. ¡Corre!');
    const [sx, sy, sd] = C.safe; const p = G.player; p.moving = false; p.x = sx; p.y = sy; p.px = sx * 16; p.py = sy * 16; p.dir = sd || p.dir;
    C.ids.forEach((id, i) => { const e = findEnt(id), s = C.starts[i]; if (!e || !s) return; e.moving = false; e.x = s[0]; e.y = s[1]; e.px = s[0] * 16; e.py = s[1] * 16; e.dir = s[2]; });
    if (C.veces >= 3) C.speed = Math.max(3.4, (C.speed || 4.6) - 0.5);
    C.lock = 1.2;
  });
}

// ------------------------------------------------------------ CABALGATA
const RIDE = {};
const RIDE_LANES = [150, 182, 214];
function ride(o) {   // o: { titulo, jinete:'b_rodriguez_mg_caballo', perseguidor:'b_talavera_caballo'|null, obst:[img...], cielo:[c1,c2], suelo:'t_pasto', montes:'#..', dur, noche }
  return new Promise(res => {
    Object.assign(RIDE, { o, res, t: 0, lane: 1, y: RIDE_LANES[1], items: [], next: 1.2, stars: 0, hits: 0, dist: 0.55, inv: 0, done: false, prev: G.scene, scroll: 0 });
    G.busy++; G.scene = 'ride'; AUD.play(o.music || 'batalla');
  });
}
SCENES.ride = {
  update(dt) {
    const R = RIDE, o = R.o; R.t += dt; R.inv = Math.max(0, R.inv - dt);
    const sp = 150; R.scroll += sp * dt;
    if (!R.done) {
      if (INP.pressed.up && R.lane > 0) { R.lane--; AUD.sfx('move'); } if (INP.pressed.down && R.lane < 2) { R.lane++; AUD.sfx('move'); }
      if (window.AUTO_DODGE) { const danger = R.items.find(q => !q.star && q.x > 60 && q.x < 170 && q.lane === R.lane); if (danger) { const alt = [0, 1, 2].filter(l => l !== R.lane && !R.items.some(q => !q.star && q.x > 60 && q.x < 190 && q.lane === l)); if (alt.length) R.lane = alt.sort((a, b) => Math.abs(a - R.lane) - Math.abs(b - R.lane))[0]; } }
    }
    R.y += (RIDE_LANES[R.lane] - R.y) * Math.min(1, dt * 14);
    R.next -= dt; if (!R.done && R.t < o.dur - 1.5 && R.next <= 0) {
      R.next = 0.55 + Math.random() * 0.5; const lane = Math.floor(Math.random() * 3);
      if (Math.random() < 0.35) R.items.push({ x: W + 20, lane, star: true }); else R.items.push({ x: W + 20, lane, img: o.obst[Math.floor(Math.random() * o.obst.length)] });
      if (Math.random() < 0.25) R.items.push({ x: W + 60, lane: (lane + 1 + Math.floor(Math.random() * 2)) % 3, star: true });
    }
    for (const q of R.items) {
      q.x -= sp * dt;
      if (!q.got && q.lane === R.lane && q.x > 70 && q.x < 120) {
        if (q.star) { q.got = true; R.stars++; AUD.sfx('blip'); }
        else if (R.inv <= 0) { q.got = true; R.hits++; R.inv = 0.9; AUD.sfx('hit'); R.dist = Math.max(0, R.dist - 0.2); }
      }
    }
    R.items = R.items.filter(q => q.x > -40 && !(q.star && q.got));
    if (o.perseguidor) { R.dist = Math.min(1, R.dist + dt * 0.035); if (R.dist <= 0 && !R.done) { R.dist = 0.45; toast('¡Casi te alcanzan! ¡Esquiva las piedras!', 3); } }
    if (!R.done && R.t >= o.dur) { R.done = true; R.endT = R.t; }
    if (R.done && R.t - R.endT > 1.4) { G.scene = R.prev; G.busy--; const r = R.res; R.res = null; AUD.play(G.map && G.map.def.music ? (typeof G.map.def.music === 'function' ? G.map.def.music() : G.map.def.music) : 'colonia'); r && r({ stars: R.stars, hits: R.hits }); }
  },
  drawLow(c) {
    const R = RIDE, o = R.o;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.cielo[0]); g.addColorStop(0.5, o.cielo[1]); g.addColorStop(0.5, '#000'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (o.noche) { c.fillStyle = '#fff8d0'; c.beginPath(); c.arc(214, 62, 11, 0, 7); c.fill(); for (let i = 0; i < 30; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.4 * Math.sin(R.t * 2 + i)) + ')'; c.fillRect((i * 67) % W, (i * 23) % 90, 1.5, 1.5); } }
    // montañas lejanas (paralaje)
    c.fillStyle = o.montes || '#7a8aa8';
    for (let k = 0; k < 2; k++) { const off = (R.scroll * (k ? 0.25 : 0.12)) % 160; c.globalAlpha = k ? 1 : 0.6; c.beginPath(); c.moveTo(-10, 128); for (let x = -160; x < W + 160; x += 80) { c.lineTo(x - off + 40, k ? 96 : 76); c.lineTo(x - off + 80, 128); } c.lineTo(W + 10, 128); c.fill(); if (o.nieve) { c.fillStyle = '#ffffff'; c.globalAlpha = 0.9; for (let x = -160; x < W + 160; x += 80) { const px = x - off + 40, py = k ? 96 : 76; c.beginPath(); c.moveTo(px, py); c.lineTo(px - 10, py + 9); c.lineTo(px + 10, py + 9); c.fill(); } c.fillStyle = o.montes; } }
    c.globalAlpha = 1;
    // suelo con textura que corre
    const tex = IMG[o.suelo]; const gy = 128;
    if (tex) { const s = 64, off = R.scroll % s; for (let y = gy; y < H; y += s) for (let x = -off; x < W; x += s) c.drawImage(tex, x, y, s, s); } else { c.fillStyle = '#9a8a5a'; c.fillRect(0, gy, W, H - gy); }
    c.fillStyle = 'rgba(0,0,0,0.12)'; RIDE_LANES.forEach(y => c.fillRect(0, y + 14, W, 2));
    if (o.noche) { c.fillStyle = 'rgba(10,14,40,0.45)'; c.fillRect(0, 0, W, H); }
  },
  drawHi(c) {
    const R = RIDE, o = R.o;
    const draw = (key, x, yFeet, h, flip) => { const im = IMG[key]; if (!im) return; const w = h * im.width / im.height; c.save(); if (flip) { c.translate(x + w / 2, 0); c.scale(-1, 1); c.translate(-(x + w / 2), 0); } c.drawImage(im, x - w / 2, yFeet - h, w, h); c.restore(); };
    const sorted = R.items.slice().sort((a, b) => a.lane - b.lane);
    for (const q of sorted) { const y = RIDE_LANES[q.lane] + 14; if (q.star) { const k = 1 + Math.sin(R.t * 8 + q.x) * 0.15; c.fillStyle = '#ffe060'; star(c, q.x, y - 14, 7 * k); } else draw(q.img, q.x, y, 30); }
    const bob = Math.abs(Math.sin(R.t * 10)) * 4;
    if (o.perseguidor) { const px = 10 + (1 - R.dist) * 60; draw(o.perseguidor, px - 40, RIDE_LANES[(R.lane + 1) % 3] + 14 - Math.abs(Math.sin(R.t * 10 + 1)) * 4, 56); }
    if (!(R.inv > 0 && Math.floor(R.t * 14) % 2)) draw(o.jinete, 100, R.y + 14 - bob, 64);
    // marcador
    box(c, 8, 8, 132, 30); c.fillStyle = COL.ink; c.font = FONT(10, 1); c.fillText(o.titulo, 16, 21);
    c.fillStyle = '#c89a20'; star(c, 20, 31, 4); c.fillStyle = COL.ink; c.font = FONT(9, 1); c.fillText('× ' + R.stars, 28, 34);
    const k = Math.min(1, R.t / o.dur); c.fillStyle = 'rgba(255,255,255,0.85)'; rrect(c, 150, 12, W - 162, 8, 4); c.fill(); c.fillStyle = '#4aa84a'; rrect(c, 150, 12, (W - 162) * k, 8, 4); c.fill();
    c.font = FONT(8, 1); c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText(R.done ? '¡LLEGASTE!' : '▲ ▼ para esquivar · junta estrellas', W - 12, 34); c.textAlign = 'left';
    if (R.done) { c.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, (R.t - R.endT)) + ')'; c.fillRect(0, 0, W, H); }
  }
};
function star(c, x, y, r) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); }
