// =====================================================================
//  ENGINE: bucle, entrada, mundo, entidades, cámara, scripts
// =====================================================================
'use strict';
const W = 384, H = 256;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIR_ROW = { down: 0, up: 1, left: 2, right: 3 };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

const G = {
  scene: 'title', t: 0, busy: 0, flags: {}, medals: [], items: {}, met: {}, objective: '', outfit: 'mg_casa',
  map: null, mapId: null, era: 'hoy', player: null, ents: [], props: [], cam: { x: 0, y: 0 },
  fade: 0, fadeTarget: 0, fadeColor: '#000', flash: 0, shake: 0, tint: null, particles: [], emotes: [], trail: [], follower: null,
  settings: { music: 0.7, textSpeed: 1 }, playTime: 0, nemoFound: 0
};
const IMG = {};

// --------------------------------------------------------------- canvas
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const buf = mkCanvas(W, H), bctx = buf.getContext('2d');
let SCALE = 3;
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
  SCALE = Math.max(1, Math.ceil(s * dpr));
  cv.width = W * SCALE; cv.height = H * SCALE;
}
addEventListener('resize', resize);

// --------------------------------------------------------------- entrada
const INP = { held: {}, pressed: {}, order: [] };
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyZ: 'a', Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyX: 'b', Backspace: 'b', Escape: 'b', ShiftLeft: 'run', ShiftRight: 'run', KeyM: 'start', Tab: 'start', KeyL: 'start', KeyH: 'hint' };
function press(btn) { AUD.init(); if (!INP.held[btn]) { INP.pressed[btn] = true; if (DIRS[btn]) { INP.order = INP.order.filter(d => d !== btn); INP.order.push(btn); } } INP.held[btn] = true; }
function release(btn) { INP.held[btn] = false; INP.order = INP.order.filter(d => d !== btn); }
addEventListener('keydown', e => { const b = KEYMAP[e.code]; if (b) { e.preventDefault(); if (!e.repeat) press(b); } });
addEventListener('keyup', e => { const b = KEYMAP[e.code]; if (b) { e.preventDefault(); release(b); } });
addEventListener('blur', () => { for (const k in INP.held) release(k); });
function dirHeld() { for (let i = INP.order.length - 1; i >= 0; i--) if (INP.held[INP.order[i]]) return INP.order[i]; return null; }
function pressedAny(...b) { return b.some(x => INP.pressed[x]); }
// mandos
let padPrev = {};
function pollGamepad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : []; const gp = gps && gps[0]; if (!gp) return;
  const st = { up: gp.buttons[12]?.pressed || gp.axes[1] < -0.5, down: gp.buttons[13]?.pressed || gp.axes[1] > 0.5, left: gp.buttons[14]?.pressed || gp.axes[0] < -0.5, right: gp.buttons[15]?.pressed || gp.axes[0] > 0.5, a: gp.buttons[0]?.pressed, b: gp.buttons[1]?.pressed, start: gp.buttons[9]?.pressed, run: gp.buttons[2]?.pressed };
  for (const k in st) { if (st[k] && !padPrev[k]) press(k); if (!st[k] && padPrev[k]) release(k); }
  padPrev = st;
}
// táctil
function setupTouch() {
  const tc = document.getElementById('touch'); if (!IS_TOUCH) { tc.style.display = 'none'; return; }
  tc.querySelectorAll('[data-b]').forEach(el => {
    const b = el.dataset.b;
    const on = e => { e.preventDefault(); press(b); el.classList.add('on'); };
    const off = e => { e.preventDefault(); release(b); el.classList.remove('on'); };
    el.addEventListener('touchstart', on, { passive: false }); el.addEventListener('touchend', off, { passive: false }); el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on); el.addEventListener('mouseup', off); el.addEventListener('mouseleave', off);
  });
  // cruceta deslizable
  const pad = document.getElementById('dpad');
  const padTouch = e => { e.preventDefault(); const t = e.touches[0]; ['up', 'down', 'left', 'right'].forEach(release); if (!t) return; const r = pad.getBoundingClientRect(); const dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2); if (Math.hypot(dx, dy) < 10) return; press(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); };
  pad.addEventListener('touchstart', padTouch, { passive: false }); pad.addEventListener('touchmove', padTouch, { passive: false });
  pad.addEventListener('touchend', e => { e.preventDefault(); ['up', 'down', 'left', 'right'].forEach(release); }, { passive: false });
}

// --------------------------------------------------------------- utilidades
const sleep = ms => new Promise(r => setTimeout(r, ms));
function waitFrames(n = 1) { return new Promise(r => { let k = n; const f = () => { if (--k <= 0) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function hasFlag(f) { return !!G.flags[f]; }
function setFlag(f, v = true) { G.flags[f] = v; }
function cond(c) { if (!c) return true; if (typeof c === 'function') return !!c(); if (typeof c === 'string') return c.split('|').some(alt => alt.split('&').every(p => p.startsWith('!') ? !G.flags[p.slice(1)] : !!G.flags[p])); return true; }

// --------------------------------------------------------------- mapa
const PROP_CACHE = {};
function getPropArt(type, opts) {
  if (type === 'house' || type === 'cabildo' || type === 'church') {
    const key = type + JSON.stringify(opts);
    if (!PROP_CACHE[key]) PROP_CACHE[key] = type === 'house' ? buildingProp(opts.w, opts.h, opts) : type === 'cabildo' ? cabildoProp(opts.w, opts.h) : churchProp(opts.w, opts.h);
    return PROP_CACHE[key];
  }
  return ART.props[type];
}
function loadMap(id) {
  const def = typeof MAPS[id] === 'function' ? MAPS[id]() : MAPS[id];
  if (!def) throw new Error('Mapa no existe: ' + id);
  const rows = def.rows; const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const legend = Object.assign({}, LEGEND, def.legend || {});
  const tiles = [];
  for (let y = 0; y < h; y++) { tiles.push([]); for (let x = 0; x < w; x++) { const ch = rows[y][x] ?? ' '; const L = legend[ch] || legend['.']; tiles[y].push({ ch, name: L[0], solid: !!L[1], v: ((x * 7 + y * 13 + x * y) % 97) }); } }
  const map = { id, def, w, h, tiles, solid: tiles.map(r => r.map(t => t.solid)), warps: [], objs: [], anim: [] };
  // props
  G.props = [];
  (def.props || []).forEach(pd => {
    const [type, x, y, opts = {}] = pd;
    if (opts.cond && !cond(opts.cond)) return;
    const art = getPropArt(type, opts); if (!art) { console.warn('prop?', type); return; }
    const a = Array.isArray(art) ? art : null; const base = a ? a[0] : art;
    const pr = { type, x, y, fw: opts.deco ? base.fw : base.fw, fh: base.fh, art, opts, id: opts.id };
    G.props.push(pr);
    if (!opts.deco && !opts.walk) for (let yy = y; yy < y + pr.fh; yy++) for (let xx = x; xx < x + pr.fw; xx++) if (map.solid[yy]) map.solid[yy][xx] = true;
    if (type === 'house' || type === 'cabildo' || type === 'church') {
      const doors = opts.door || [Math.floor(opts.w / 2)];
      doors.forEach(dx => { const tx = x + dx, ty = y + opts.h - 1; map.solid[ty][tx] = false; if (opts.to) map.warps.push({ x: tx, y: ty, to: opts.to, tx: opts.tx, ty: opts.ty, dir: 'up', door: true, cond: opts.toCond, locked: opts.locked }); else map.warps.push({ x: tx, y: ty, locked: opts.locked || 'La puerta está cerrada.', door: true }); });
    }
  });
  (def.warps || []).forEach(wp => map.warps.push(wp));
  (def.objs || []).forEach(o => map.objs.push(o));
  // pre-render del suelo
  const g = mkCanvas(w * 16, h * 16), gc = g.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = tiles[y][x]; const variants = ART.tiles[t.name]; if (!variants) continue;
    const frames = variants[t.v % variants.length];
    if (frames.length > 1) map.anim.push([x, y, frames]);
    gc.drawImage(frames[0], x * 16, y * 16);
    const nb = (dx, dy) => (tiles[y + dy] || [])[x + dx];
    if (!GRASSY.has(t.name) && !WATERY.has(t.name) && !t.solid && t.name !== 'void') {
      [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]].forEach(([s, dx, dy]) => { const n = nb(dx, dy); if (n && GRASSY.has(n.name) && ['dirt', 'cobble', 'pavers', 'sand', 'mud'].includes(t.name)) gc.drawImage(ART.fringe[s], x * 16, y * 16); });
    }
    if (t.name === 'water' || t.name === 'sea') {
      [['n', 0, -1], ['s', 0, 1], ['w', -1, 0], ['e', 1, 0]].forEach(([s, dx, dy]) => { const n = nb(dx, dy); if (n && !WATERY.has(n.name)) map.anim.push([x, y, null, s]); });
    }
  }
  map.ground = g;
  return map;
}
function isSolidAt(x, y, ignore) {
  const m = G.map; if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  if (m.solid[y][x]) return true;
  for (const e of G.ents) if (e !== ignore && !e.ghost && !e.hidden && e.solid !== false && ((e.x === x && e.y === y) || (e.moving && e.tx === x && e.ty === y))) return true;
  if (G.player && G.player !== ignore && G.player.x === x && G.player.y === y) return true;
  return false;
}
function entAt(x, y) { return G.ents.find(e => !e.hidden && ((e.x === x && e.y === y) || (e.big && e.x <= x && x < e.x + 2 && e.y === y))); }
function propAt(x, y) { return G.props.find(p => !p.opts.deco && x >= p.x && x < p.x + p.fw && y >= p.y && y < p.y + p.fh); }

// --------------------------------------------------------------- entidades
function makeEnt(o) {
  const e = Object.assign({ x: 0, y: 0, dir: 'down', moving: false, prog: 0, speed: 4, alt: false, frame: 0, sprite: 'vecino', px: 0, py: 0, wanderT: 1 + Math.random() * 3 }, o);
  e.px = e.x * 16; e.py = e.y * 16; e.home = [e.x, e.y];
  return e;
}
function startMove(e, dir, force) {
  e.dir = dir; const [dx, dy] = DIRS[dir];
  const tx = e.x + dx, ty = e.y + dy;
  if (!force && isSolidAt(tx, ty, e)) return false;
  e.moving = true; e.prog = 0; e.fx = e.x; e.fy = e.y; e.tx = tx; e.ty = ty; e.alt = !e.alt; return true;
}
function updateEnt(e, dt) {
  if (!e.moving) return false;
  e.prog += dt * e.speed;
  if (e.prog >= 1) { e.prog = 0; e.moving = false; e.x = e.tx; e.y = e.ty; e.px = e.x * 16; e.py = e.y * 16; return true; }
  e.px = (e.fx + (e.tx - e.fx) * e.prog) * 16; e.py = (e.fy + (e.ty - e.fy) * e.prog) * 16; return false;
}
function spriteFrame(e) { if (e.moving) return e.prog < 0.5 ? (e.alt ? 1 : 2) : 0; return e.walkAnim ? (Math.floor(G.t * 4) % 2 ? 1 : 2) : 0; }
function findEnt(id) { if (id === 'mg' || id === 'player') return G.player; if (id === 'nemo' && G.follower) return G.follower; return G.ents.find(e => e.id === id); }

// --------------------------------------------------------------- warp
async function warp(to, tx, ty, dir = 'down', opts = {}) {
  G.busy++;
  if (!opts.noFade) await fadeOut(opts.white ? '#fff' : '#000', opts.fadeMs || 220);
  enterMap(to, tx, ty, dir);
  if (!opts.noFade) await fadeIn(opts.fadeMs || 220);
  G.busy--;
  const def = G.map.def;
  if (def.onEnter && !opts.skipEnter) await runScript(def.onEnter);
}
function enterMap(to, tx, ty, dir) {
  G.mapId = to; G.map = loadMap(to);
  const def = G.map.def;
  if (def.era) G.era = def.era;
  G.player = makeEnt({ id: 'mg', x: tx, y: ty, dir, sprite: G.outfit, speed: 4.2 });
  G.ents = [];
  (def.npcs || []).forEach(n => { if (n.cond && !cond(n.cond)) return; G.ents.push(makeEnt(Object.assign({}, n))); });
  if (hasFlag('nemo_sigue')) { G.follower = makeEnt({ id: 'nemo', x: tx, y: ty, dir, sprite: 'nemo', speed: 4.2, ghost: true, solid: false }); G.player.trail = []; } else G.follower = null;
  G.tint = def.tint || null; G.trail = []; G.particles = []; G.emotes = [];
  if (def.music) AUD.play(typeof def.music === 'function' ? def.music() : def.music);
  updateCamera(true);
  if (!def.noSave) saveGame();
}
function fadeOut(color = '#000', ms = 220) { G.fadeColor = color; return tween(v => G.fade = v, G.fade, 1, ms); }
function fadeIn(ms = 220) { return tween(v => G.fade = v, G.fade, 0, ms); }
function tween(set, a, b, ms) { return new Promise(r => { const t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0) / ms); set(a + (b - a) * k); if (k < 1) requestAnimationFrame(f); else r(); }; f(); }); }

// --------------------------------------------------------------- scripts
async function runScript(fn, ...args) {
  if (!fn) return; G.busy++;
  try { if (typeof fn === 'string') await say(null, fn); else if (Array.isArray(fn)) { for (const l of fn) await say(l[0], l[1]); } else await fn(...args); }
  catch (err) { console.error(err); }
  finally { G.busy--; }
}
// mover entidad por pasos: 'UUDDLR' o array
async function walk(id, path, speed) {
  const e = typeof id === 'string' ? findEnt(id) : id; if (!e) return;
  const M = { U: 'up', D: 'down', L: 'left', R: 'right' };
  const old = e.speed; if (speed) e.speed = speed;
  for (const ch of path) {
    if (ch === ' ') { await sleep(150); continue; }
    const d = M[ch] || ch; let tries = 0;
    while (!startMove(e, d, e.ghost)) { if (++tries > 40) { startMove(e, d, true); break; } await sleep(50); }
    if (e === G.player) onPlayerStepStart();
    while (e.moving) await waitFrames(1);
    if (e === G.player) onPlayerArrive(true);
  }
  e.speed = old;
}
function face(id, dir) { const e = findEnt(id); if (!e) return; if (DIRS[dir]) e.dir = dir; else { const o = findEnt(dir); if (o) e.dir = dirTo(e, o); } }
function dirTo(a, b) { const dx = b.x - a.x, dy = b.y - a.y; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
function spawn(o) { const e = makeEnt(o); G.ents = G.ents.filter(x => x.id !== o.id); G.ents.push(e); return e; }
function despawn(id) { G.ents = G.ents.filter(e => e.id !== id); }
function emote(id, kind = '!', ms = 900) { const e = findEnt(id); if (!e) return sleep(ms); G.emotes.push({ e, kind, t: 0, ms }); if (kind === '!') AUD.sfx('alert'); return sleep(ms); }
function shake(ms = 400) { G.shake = ms / 1000; return sleep(ms); }
async function flash(color = '#fff', ms = 600) { AUD.sfx('flash'); G.flashColor = color; await tween(v => G.flash = v, 0, 1, ms * 0.4); await tween(v => G.flash = v, 1, 0, ms * 0.6); }
function sparkleAt(x, y, n = 10, col) { for (let i = 0; i < n; i++) G.particles.push({ x: x * 16 + 8, y: y * 16 + 4, vx: (Math.random() - .5) * 40, vy: -20 - Math.random() * 40, life: 0.8 + Math.random() * 0.5, t: 0, col: col || ['#fff8a0', '#a0f0ff', '#ffffff'][i % 3], g: 30 }); }
function setTrail(points) { G.trail = points || []; }

// --------------------------------------------------------------- objetos e inventario
function hasItem(id, n = 1) { return (G.items[id] || 0) >= n; }
async function giveItem(id, n = 1, silent) { G.items[id] = (G.items[id] || 0) + n; if (!silent) { AUD.jingle('item'); await say(null, `¡MG obtuvo ${n > 1 ? n + ' × ' : ''}${ITEMS[id]?.name || id}!`, { icon: id }); } }
function takeItem(id, n = 1) { G.items[id] = Math.max(0, (G.items[id] || 0) - n); if (!G.items[id]) delete G.items[id]; }
function setObjective(t, quiet) { G.objective = t; if (!quiet) toast('Bitácora: ' + t); }

// --------------------------------------------------------------- guardar
const SAVE_KEY = 'mg_fundadores_v1';
function saveGame() {
  if (!G.player || G.scene !== 'world' && G.scene !== 'book') return;
  const data = { v: 1, flags: G.flags, medals: G.medals, items: G.items, met: G.met, objective: G.objective, outfit: G.outfit, map: G.mapId, x: G.player.x, y: G.player.y, dir: G.player.dir, era: G.era, settings: G.settings, playTime: G.playTime, savedAt: Date.now() };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { }
}
function loadSave() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

// --------------------------------------------------------------- actualización del mundo
let turnT = 0, bumpT = 0;
function worldUpdate(dt) {
  const p = G.player; if (!p) return;
  // entidades
  for (const e of G.ents) {
    const arrived = updateEnt(e, dt);
    if (e.wander && !G.busy && !e.moving && !UI.modal()) { e.wanderT -= dt; if (e.wanderT <= 0) { e.wanderT = 1.5 + Math.random() * 3; const ds = Object.keys(DIRS); const d = ds[Math.floor(Math.random() * 4)]; const [dx, dy] = DIRS[d]; if (Math.abs(e.x + dx - e.home[0]) <= (e.wander === true ? 2 : e.wander) && Math.abs(e.y + dy - e.home[1]) <= (e.wander === true ? 2 : e.wander)) startMove(e, d); else e.dir = d; } }
    if (e.guard && !G.busy && !UI.modal()) guardUpdate(e, dt);
  }
  if (G.follower) updateEnt(G.follower, dt);
  // jugador
  const wasMoving = p.moving;
  if (p.moving) { p.speed = (INP.held.run || INP.held.b) && !G.busy ? 8.5 : 5.2; if (updateEnt(p, dt)) onPlayerArrive(); }
  if (!p.moving && !G.busy && !UI.modal()) {
    const d = dirHeld();
    if (d) {
      if (p.dir !== d && !wasMoving && turnT <= 0) { p.dir = d; turnT = 0.09; }
      else if (turnT <= 0 || p.dir === d) {
        turnT -= dt;
        if (turnT <= 0) tryStep(d);
      }
      turnT -= dt;
    } else turnT = 0;
    if (INP.pressed.a) interact();
    else if (INP.pressed.start) openBook();
    else if (INP.pressed.hint && typeof showHintNow === 'function') showHintNow();
  }
  bumpT -= dt;
  // partículas y emotes
  G.particles = G.particles.filter(q => { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; return q.t < q.life; });
  G.emotes = G.emotes.filter(m => (m.t += dt * 1000) < m.ms);
  if (G.trail.length && Math.random() < dt * 8) { const [tx, ty] = G.trail[Math.floor(Math.random() * G.trail.length)]; G.particles.push({ x: tx * 16 + 3 + Math.random() * 10, y: ty * 16 + 6 + Math.random() * 8, vx: 0, vy: -8, life: 0.9, t: 0, col: Math.random() < .5 ? '#fff6a0' : '#9ef0ff', star: true }); }
  if (G.shake > 0) G.shake -= dt;
  if (typeof hintTick === 'function') hintTick(dt);
  updateCamera();
}
function tryStep(d) {
  const p = G.player; const [dx, dy] = DIRS[d]; const tx = p.x + dx, ty = p.y + dy;
  // empujar fardos
  const pr = propAt(tx, ty);
  if (pr && pr.opts.push) { const nx = tx + dx, ny = ty + dy; if (!isSolidAt(nx, ny) && !propAt(nx, ny) && !(G.map.tiles[ny] && G.map.tiles[ny][nx].solid)) { G.map.solid[ty][tx] = false; pr.x = nx; pr.y = ny; G.map.solid[ny][nx] = true; AUD.sfx('push'); pr.slide = { fx: tx, fy: ty, t: 0 }; if (startMove(p, d)) onPlayerStepStart(); if (G.map.def.onPush) runScript(G.map.def.onPush, pr); } else { if (bumpT <= 0) { AUD.sfx('bump'); bumpT = 0.3; } } p.dir = d; return; }
  // puertas bloqueadas
  const wp = G.map.warps.find(w => w.x === tx && w.y === ty);
  if (wp && (wp.locked && !wp.to || (wp.cond && !cond(wp.cond)))) { p.dir = d; if (bumpT <= 0) { bumpT = 0.6; runScript(async () => { await say(null, typeof wp.locked === 'string' ? wp.locked : (wp.lockedText || 'No puedes pasar por aquí todavía.')); }); } return; }
  if (startMove(p, d)) onPlayerStepStart();
  else if (bumpT <= 0) { AUD.sfx('bump'); bumpT = 0.35; }
}
function onPlayerStepStart() {
  const p = G.player;
  if (G.follower) { const f = G.follower; const target = [p.fx, p.fy]; if (!(f.x === target[0] && f.y === target[1])) { const d = dirTo(f, { x: target[0], y: target[1] }); if (Math.abs(f.x - target[0]) + Math.abs(f.y - target[1]) === 1) startMove(f, d, true); else { f.x = target[0]; f.y = target[1]; f.px = f.x * 16; f.py = f.y * 16; } } f.speed = p.speed; }
}
function onPlayerArrive(scripted) {
  const p = G.player;
  if (scripted || G.busy) return;
  const wp = G.map.warps.find(w => w.x === p.x && w.y === p.y && w.to && cond(w.cond));
  if (wp) { if (wp.door) AUD.sfx('door'); warp(wp.to, wp.tx, wp.ty, wp.dir || p.dir); return; }
  const tr = (G.map.def.triggers || []).find(t => p.x >= t.x && p.x < t.x + (t.w || 1) && p.y >= t.y && p.y < t.y + (t.h || 1) && cond(t.cond) && !(t.once && G.flags['trg_' + G.mapId + '_' + t.id]));
  if (tr) { if (tr.once) setFlag('trg_' + G.mapId + '_' + tr.id); if (G.runningTrigger === tr.id) return; G.runningTrigger = tr.id; runScript(tr.run).finally(() => { G.runningTrigger = null; }); }
}
function interact() {
  const p = G.player; const [dx, dy] = DIRS[p.dir]; const tx = p.x + dx, ty = p.y + dy;
  const e = entAt(tx, ty);
  if (e && e.talk) { if (!e.noTurn) e.dir = OPP[p.dir]; runScript(async () => { if (typeof e.talk === 'function') await e.talk(e); else if (Array.isArray(e.talk)) { for (const l of e.talk) await say(e.speaker || e.id, l); } else await say(e.speaker || e.id, e.talk); }); return; }
  // objetos invisibles o con texto
  const o = G.map.objs.find(o => tx >= o.x && tx < o.x + (o.w || 1) && ty >= o.y && ty < o.y + (o.h || 1) && cond(o.cond));
  if (o) { runScript(async () => { if (typeof o.run === 'function') await o.run(o); else if (Array.isArray(o.text)) { for (const l of o.text) await say(null, l); } else await say(null, o.text); }); return; }
  if (G.follower && G.follower.x === tx && G.follower.y === ty && !G.follower.moving) { runScript(NEMO_TALK); return; }
  const pr = propAt(tx, ty);
  if (pr && pr.type === 'timemachine') { runScript(travelMenu); return; }
  if (pr && pr.opts.text) { runScript(async () => say(null, pr.opts.text)); return; }
  if (pr && PROP_TEXT[pr.type]) { runScript(async () => say(null, PROP_TEXT[pr.type])); return; }
}
const PROP_TEXT = {
  bookshelf: 'Libros y más libros. ¡Algún día los leeré todos!', bookshelf2: 'Estantes llenos de libros viejos que huelen a historia.', fountain: 'El agua de la pileta brilla con el sol.', well: 'Un pozo de agua. Se escucha el eco: «¡MG… MG…!»', hay: 'Un fardo de paja. Huele a campo.', barrel: 'Un barril de madera. Mejor no abrirlo.', crate: 'Una caja de madera llena de… ¿papas?', cart: 'Una carreta de madera. ¡Aquí no hay autos, solo caballos!', tree: 'Un árbol frondoso. Da una sombrita rica.', naranjo: '¡Un naranjo! Huele a azahar.', alamo: 'Un álamo altísimo. Por eso le dicen «Alameda» a esta avenida.', candela: 'Un candelabro con velas. ¡Aquí no hay luz eléctrica!', piano: 'Un piano negro y brillante.', lamp: 'Un farol que se enciende con aceite cuando oscurece.', bench: 'Una banca para descansar los pies.', tent: 'Una carpa del campamento patriota.', cannon: 'Un cañón viejo. Mejor mirarlo de lejos.', campfire: 'Una fogata calentita.', statue: 'Una estatua de piedra.', ship: 'Un gran velero con la bandera de Chile.', boat: 'Un bote de pescadores.', bed: 'Mi cama. Todavía no tengo sueño.', bedold: 'Una cama antigua con colchón de lana.', desk: 'Mi escritorio. Ahí hago las tareas (a veces).', toybox: 'Mi caja de juguetes. ¡Está llena!', plant: 'Una planta muy verde.', wardrobe: 'Un ropero de madera.', tablecloth: 'Una mesa con mantel blanco.', stall: '¡Dulces de colores! Primero Nemo, después dulces.', chair: 'Una silla.', fireplace: 'Una chimenea tibia.', painting: 'Un retrato muy serio.', mapwall: 'Un gran mapa de España y América.'
};

// --------------------------------------------------------------- guardias (sigilo)
function guardUpdate(e, dt) {
  const gd = e.guard;
  if (!e.moving) {
    gd.wait = (gd.wait || 0) - dt;
    if (gd.wait <= 0 && gd.route) { gd.i = gd.i || 0; const ch = gd.route[gd.i % gd.route.length]; gd.i++; const M = { U: 'up', D: 'down', L: 'left', R: 'right' }; if (ch === '.') gd.wait = 0.6; else if (ch.toLowerCase() !== ch) { if (!startMove(e, M[ch])) e.dir = M[ch]; e.speed = 2.6; } else { e.dir = M[ch.toUpperCase()]; gd.wait = 0.9; } }
  }
  // visión
  const p = G.player; if (G.flags.invisible) return;
  const [dx, dy] = DIRS[e.dir]; const range = gd.range || 4;
  for (let k = 1; k <= range; k++) {
    const x = e.x + dx * k, y = e.y + dy * k;
    if (G.map.solid[y] === undefined || G.map.solid[y][x]) break;
    const t = G.map.tiles[y][x];
    if (p.x === x && p.y === y) {
      if (t.name === 'maize' || t.name === 'tall' && gd.tallHides) return; // escondida
      if (gd.cooldown && G.t < gd.cooldown) return;
      gd.cooldown = G.t + 2;
      runScript(async () => { await emote(e, '!', 700); await (gd.onSee ? gd.onSee(e) : say(e.speaker || 'guardia', '¡Alto ahí!')); });
      return;
    }
  }
}

// --------------------------------------------------------------- cámara y dibujo del mundo
function updateCamera(snap) {
  const p = G.player; const m = G.map; if (!p || !m) return;
  const mw = m.w * 16, mh = m.h * 16;
  let cx = p.px + 8 - W / 2, cy = p.py + 8 - H / 2;
  cx = mw <= W ? (mw - W) / 2 : clamp(cx, 0, mw - W);
  cy = mh <= H ? (mh - H) / 2 : clamp(cy, 0, mh - H);
  if (G.camOverride) { cx = G.camOverride.x; cy = G.camOverride.y; }
  G.cam.x = Math.round(cx); G.cam.y = Math.round(cy);
}
function drawWorld() {
  const m = G.map, c = bctx; if (!m) return;
  let cx = G.cam.x, cy = G.cam.y;
  if (G.shake > 0) { cx += Math.round((Math.random() - .5) * 4); cy += Math.round((Math.random() - .5) * 4); }
  c.fillStyle = m.def.bg || '#000'; c.fillRect(0, 0, W, H);
  c.drawImage(m.ground, -cx, -cy);
  // baldosas animadas
  const fi = Math.floor(G.t * 4);
  for (const [x, y, frames, shore] of m.anim) {
    const sx = x * 16 - cx, sy = y * 16 - cy; if (sx < -16 || sy < -16 || sx > W || sy > H) continue;
    if (frames) c.drawImage(frames[fi % frames.length], sx, sy); else c.drawImage(ART.shore[shore], sx, sy);
  }
  // rastro de Nemo y objetos brillantes
  for (const o of m.objs) if (o.sparkle && cond(o.cond) && Math.floor(G.t * 3 + o.x) % 3 === 0) { const sx = o.x * 16 - cx + 8, sy = o.y * 16 - cy + 6; c.fillStyle = '#fffbd0'; c.fillRect(sx - 1, sy - 3, 2, 6); c.fillRect(sx - 3, sy - 1, 6, 2); c.fillStyle = '#ffffff'; c.fillRect(sx, sy, 1, 1); }
  // campo de visión de los guardias (ayuda para el sigilo)
  for (const e of G.ents) {
    if (!e.guard || e.hidden) continue; const [dx, dy] = DIRS[e.dir]; const range = e.guard.range || 4;
    for (let k = 1; k <= range; k++) {
      const x = e.x + dx * k, y = e.y + dy * k; if (!m.solid[y] || m.solid[y][x] === undefined || m.solid[y][x]) break;
      c.fillStyle = `rgba(255,70,60,${0.28 - k * 0.035 + Math.sin(G.t * 6) * 0.04})`; c.fillRect(x * 16 - cx + 1, y * 16 - cy + 1, 14, 14);
    }
  }
  // lista ordenada por profundidad
  const list = [];
  for (const pr of G.props) {
    const a = Array.isArray(pr.art) ? pr.art[Math.floor(G.t * (pr.opts.fps || 4)) % pr.art.length] : pr.art;
    let x = pr.x, y = pr.y; if (pr.slide) { pr.slide.t += 1 / 60 * 6; if (pr.slide.t >= 1) pr.slide = null; else { x = pr.slide.fx + (pr.x - pr.slide.fx) * pr.slide.t; y = pr.slide.fy + (pr.y - pr.slide.fy) * pr.slide.t; } }
    const dx = Math.round(x * 16 + (pr.fw * 16 - a.w) / 2) - cx, dy = Math.round((y + pr.fh) * 16 - a.h) - cy;
    if (dx > W || dy > H || dx + a.w < 0 || dy + a.h < 0) continue;
    list.push({ z: pr.opts.deco ? -1e5 + (y + pr.fh) * 16 : (y + pr.fh) * 16 - 0.5 + (pr.opts.z || 0), draw: () => { if (pr.opts.flip) { c.save(); c.translate(dx + a.w, dy); c.scale(-1, 1); c.drawImage(a.c, 0, 0); c.restore(); } else c.drawImage(a.c, dx, dy); } });
  }
  const ents = G.ents.filter(e => !e.hidden).concat(G.follower ? [G.follower] : []).concat(G.player && !G.player.hidden ? [G.player] : []);
  for (const e of ents) {
    const sx = Math.round(e.px) - cx, sy = Math.round(e.py) - cy;
    list.push({ z: e.py + 16 + (e.z || 0), draw: () => drawEnt(c, e, sx, sy) });
  }
  list.sort((a, b) => a.z - b.z).forEach(o => o.draw());
  // capa superior: pasto alto / maizal
  const x0 = Math.max(0, Math.floor(cx / 16)), y0 = Math.max(0, Math.floor(cy / 16)), x1 = Math.min(m.w - 1, Math.floor((cx + W) / 16)), y1 = Math.min(m.h - 1, Math.floor((cy + H) / 16));
  for (const e of ents) {
    const tx = Math.round(e.px / 16), ty = Math.round(e.py / 16);
    const t = m.tiles[ty] && m.tiles[ty][tx]; if (t && OVERLAY_TILES.has(t.name)) c.drawImage(ART.overlay[t.name][fi % 2], tx * 16 - cx, ty * 16 - cy);
  }
  // partículas
  for (const q of G.particles) { const a = 1 - q.t / q.life; c.globalAlpha = a; c.fillStyle = q.col; const x = Math.round(q.x - cx), y = Math.round(q.y - cy); if (q.star) { c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1); } else c.fillRect(x, y, 2, 2); c.globalAlpha = 1; }
  // emotes
  for (const em of G.emotes) {
    const e = em.e; const sx = Math.round(e.px) - cx + 8, sy = Math.round(e.py) - cy - 18 - Math.round(Math.sin(Math.min(1, em.t / 150) * Math.PI) * 3);
    c.fillStyle = '#2a1e2e'; c.fillRect(sx - 7, sy - 7, 14, 13); c.fillStyle = '#fff'; c.fillRect(sx - 6, sy - 6, 12, 11); c.fillRect(sx - 1, sy + 5, 3, 2);
    c.fillStyle = em.kind === '♥' ? '#e84a6a' : '#2a1e2e'; c.font = 'bold 10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(em.kind, sx, sy + 0.5); c.textAlign = 'left';
  }
  // oscuridad (cuevas/noche)
  if (m.def.dark && !G.flags.luz) drawDarkness(c, cx, cy);
  // tinte
  const tint = G.tintOverride || G.tint;
  if (tint) applyTint(c, tint);
  if (typeof drawHintArrow === 'function') drawHintArrow(c, cx, cy);
}
function drawEnt(c, e, sx, sy) {
  if (e.horse) { const sh = ART[e.horse] || ART.horse; const f = e.moving || e.walkAnim ? Math.floor(G.t * 6) % 2 : 0; c.save(); if (e.dir === 'right') { c.translate(sx + 24, sy - 16); c.scale(-1, 1); c.drawImage(sh, f * 32, 0, 32, 32, 0, 0, 32, 32); } else c.drawImage(sh, f * 32, 0, 32, 32, sx - 8, sy - 16, 32, 32); c.restore(); return; }
  if (e.bat) { const f = Math.floor(G.t * 8) % 2; c.drawImage(ART.bat, f * 16, 0, 16, 16, sx, sy - 6 + Math.round(Math.sin(G.t * 5 + e.x) * 2), 16, 16); return; }
  if (e.prop) { const a = ART.props[e.prop]; const art = Array.isArray(a) ? a[Math.floor(G.t * 4) % a.length] : a; c.drawImage(art.c, sx + (16 - art.w) / 2, sy + 16 - art.h); return; }
  const sheet = ART.sprites[e.sprite]; if (!sheet) return;
  const fr = spriteFrame(e); const row = DIR_ROW[e.dir] || 0;
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(sx + 3, sy + 13, 10, 3);
  if (e.glow) { c.globalAlpha = 0.5 + Math.sin(G.t * 10) * 0.3; c.fillStyle = '#a0f8ff'; c.beginPath(); c.arc(sx + 8, sy + 6, 10, 0, 7); c.fill(); c.globalAlpha = 1; }
  const bob = (e.moving && e.prog < 0.5) ? 0 : 0;
  c.drawImage(sheet, fr * 16, row * 24, 16, 24, sx, sy - 8 + bob, 16, 24);
}
const darkC = mkCanvas(W, H), darkX = darkC.getContext('2d');
function drawDarkness(c, cx, cy) {
  darkX.globalCompositeOperation = 'source-over'; darkX.fillStyle = 'rgba(8,6,20,0.88)'; darkX.fillRect(0, 0, W, H);
  darkX.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r) => { const g = darkX.createRadialGradient(x, y, r * 0.25, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); darkX.fillStyle = g; darkX.beginPath(); darkX.arc(x, y, r, 0, 7); darkX.fill(); };
  const p = G.player; hole(p.px + 8 - cx, p.py + 4 - cy, 62 + Math.sin(G.t * 9) * 1.5);
  G.props.forEach(pr => { if (pr.type === 'torch' || pr.type === 'campfire') hole(pr.x * 16 + 8 - cx, pr.y * 16 + 6 - cy, 34 + Math.sin(G.t * 7 + pr.x) * 2); });
  if (G.follower && G.follower.glow) hole(G.follower.px + 8 - cx, G.follower.py + 6 - cy, 26);
  c.drawImage(darkC, 0, 0);
}
function applyTint(c, tint) {
  const T = { sepia: [['saturation', '#808080', 0.85], ['multiply', '#e8c890', 0.9]], atardecer: [['multiply', '#ffb880', 0.55], ['overlay', '#ff9050', 0.2]], noche: [['multiply', '#5868b0', 0.75]], reconquista: [['saturation', '#808080', 0.45], ['multiply', '#c0c8d8', 0.6]], tiempo: [['overlay', '#a080ff', 0.3]], amanecer: [['multiply', '#ffe0c0', 0.35]] }[tint];
  if (!T) return;
  T.forEach(([op, col, a]) => { c.globalCompositeOperation = op; c.globalAlpha = a; c.fillStyle = col; c.fillRect(0, 0, W, H); });
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}

// --------------------------------------------------------------- bucle principal
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; G.t += dt;
  pollGamepad();
  if (G.scene === 'world') G.playTime += dt;
  UI.update(dt);
  const scn = SCENES[G.scene];
  if (scn && scn.update) scn.update(dt);
  // dibujar
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (scn && scn.drawLow) scn.drawLow(bctx);
  ctx.drawImage(buf, 0, 0, W * SCALE, H * SCALE);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0); ctx.imageSmoothingEnabled = true;
  if (scn && scn.drawHi) scn.drawHi(ctx);
  if (G.flash > 0) { ctx.globalAlpha = G.flash; ctx.fillStyle = G.flashColor || '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (G.fade > 0) { ctx.globalAlpha = G.fade; ctx.fillStyle = G.fadeColor; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  UI.draw(ctx);
  for (const k in INP.pressed) INP.pressed[k] = false;
  requestAnimationFrame(frame);
}
const SCENES = {
  world: { update: worldUpdate, drawLow: drawWorld }
};

// --------------------------------------------------------------- carga de recursos
function loadImg(key, src) { return new Promise(r => { const i = new Image(); i.onload = () => { IMG[key] = i; r(); }; i.onerror = () => { console.warn('No se pudo cargar', src); r(); }; i.src = src; }); }
async function boot() {
  resize(); setupTouch();
  ART.init();
  const ids = ['mateo', 'salas', 'javiera', 'jmcarrera', 'paula', 'rodriguez', 'luisa', 'ohiggins', 'cornelia', 'freire', 'agueda', 'portales', 'mg', 'nemo', 'ohiggins_bandera'];
  const jobs = [];
  ids.forEach(id => { jobs.push(loadImg('r_' + id, `assets/retratos/${id}.png`)); jobs.push(loadImg('c_' + id, `assets/cuerpos/${id}.png`)); jobs.push(loadImg('m_' + id, `assets/medallas/${id}.png`)); });
  jobs.push(loadImg('logo', 'assets/img/logo.png'), loadImg('portada', 'assets/img/portada.png'), loadImg('pagina_mateo', 'assets/img/pagina_mateo.png'));
  try { const f = new FontFace('Playtime', typeof FUENTE_PLAYTIME !== 'undefined' ? `url(${FUENTE_PLAYTIME})` : 'url(assets/fuentes/playtime.ttf)'); jobs.push(f.load().then(ff => document.fonts.add(ff)).catch(() => { })); } catch (e) { }
  let done = 0; jobs.forEach(j => j.then(() => { done++; const el = document.getElementById('loadbar'); if (el) el.style.width = (100 * done / jobs.length) + '%'; }));
  await Promise.all(jobs);
  const ld = document.getElementById('loading'); if (ld) ld.remove();
  G.scene = 'title'; AUD.play('titulo');
  requestAnimationFrame(frame);
}
