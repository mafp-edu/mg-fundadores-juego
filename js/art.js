// =====================================================================
//  ART: baldosas, objetos y personajes en pixel art (estilo GBA mejorado)
//  Todo se dibuja en código al iniciar: no hay imágenes generadas por IA.
// =====================================================================
'use strict';
const TS = 16;
const ART = { tiles: {}, props: {}, sprites: {}, ready: false };

function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function RNG(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(h, f) { const [r, g, b] = hexToRgb(h); return f < 1 ? rgbToHex(r * f, g * f, b * f) : rgbToHex(r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)); }
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

// Pintor de píxeles sobre un contexto
function P(ctx) {
  return {
    px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); },
    r(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); },
    hl(x, y, w, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, 1); },
    vl(x, y, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, h); },
    circ(cx, cy, rad, c) { ctx.fillStyle = c; for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (x * x + y * y <= rad * rad + rad * 0.6) ctx.fillRect(cx + x, cy + y, 1, 1); },
    ell(cx, cy, rx, ry, c) { ctx.fillStyle = c; for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01) <= 1.05) ctx.fillRect(cx + x, cy + y, 1, 1); },
    tpl(rows, pal, ox = 0, oy = 0) { rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const k = row[x]; if (k !== '.' && k !== ' ' && pal[k]) { ctx.fillStyle = pal[k]; ctx.fillRect(ox + x, oy + y, 1, 1); } } }); },
    ctx
  };
}

// ------------------------------------------------------------------ Paleta
const C = {
  ol: '#2a1e2e', g1: '#7ec850', g2: '#68b444', g3: '#a6e07a', g4: '#4f9a3c',
  d1: '#dcb67e', d2: '#c89e62', d3: '#ecd09c', d4: '#b48850',
  st1: '#b4aca0', st2: '#948c80', st3: '#cfc8bc', mortar: '#7c7468',
  w1: '#3f86d8', w2: '#62a4ee', w3: '#c4e6ff', w4: '#2f6cb8',
  wood1: '#c08850', wood2: '#a87240', wood3: '#7c5030', wood4: '#d8a066',
  adobe: '#f3ecdc', adobe2: '#ddd2ba', adobe3: '#c9bb9c', zocalo: '#b88a5a',
  roof1: '#c8553a', roof2: '#a63f2a', roof3: '#e47a5a', roof4: '#7e2e20',
  sky: '#9ad0ff'
};

// =================================================================== TILES
function tileCanvas(fn, frames = 1, seed = 1) {
  const arr = [];
  for (let f = 0; f < frames; f++) { const c = mkCanvas(TS, TS); const p = P(c.getContext('2d')); fn(p, f, RNG(seed + f * 7)); arr.push(c); }
  return arr;
}
function grassBase(p, rnd, base = C.g1, dark = C.g2, light = C.g3) {
  p.r(0, 0, 16, 16, base);
  for (let i = 0; i < 4; i++) { const x = 1 + Math.floor(rnd() * 12), y = 2 + Math.floor(rnd() * 12); p.px(x, y, dark); p.px(x + 2, y, dark); p.px(x + 1, y + 1, dark); p.px(x + 1, y - 1, light); }
  for (let i = 0; i < 3; i++) p.px(Math.floor(rnd() * 16), Math.floor(rnd() * 16), light);
}
const TILE_DEFS = {
  grass: { f: 1, v: 4, fn: (p, f, r) => grassBase(p, r) },
  grassd: { f: 1, v: 3, fn: (p, f, r) => grassBase(p, r, '#6aae46', '#56963a', '#8cc864') },
  tall: { f: 2, v: 1, fn: (p, f, r) => { grassBase(p, r, C.g2, C.g4, C.g1); } },
  flowers: { f: 2, v: 3, fn: (p, f, r) => { grassBase(p, r); const cols = ['#f05a6a', '#f8e060', '#ffffff', '#c878f0', '#ff9a3c']; for (let i = 0; i < 2; i++) { const x = 3 + Math.floor(r() * 9) + (i * 2), y = 3 + Math.floor(r() * 9); const c = cols[Math.floor(r() * cols.length)]; const o = f ? 1 : 0; p.px(x + o, y - 1, c); p.px(x - 1 + o, y, c); p.px(x + 1 + o, y, c); p.px(x + o, y + 1, c); p.px(x + o, y, '#ffe680'); p.px(x, y + 2, C.g4); } } },
  dirt: { f: 1, v: 4, fn: (p, f, r) => { p.r(0, 0, 16, 16, C.d1); for (let i = 0; i < 14; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? C.d2 : C.d3); if (r() < .6) { const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11); p.r(x, y, 2, 1, C.d4); p.px(x, y - 1, C.d3); } } },
  cobble: { f: 1, v: 2, fn: (p, f, r) => { p.r(0, 0, 16, 16, C.mortar); for (let row = 0; row < 4; row++) { const off = row % 2 ? 2 : -2; for (let col = -1; col < 4; col++) { const x = col * 5 + off + (row % 2), y = row * 4; const cc = r() < .5 ? C.st1 : '#aaa294'; p.r(x + 1, y + 1, 4, 3, cc); p.hl(x + 1, y + 1, 3, C.st3); p.hl(x + 2, y + 3, 3, C.st2); } } } },
  pavers: { f: 1, v: 2, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#e2d6bc'); p.hl(0, 7, 16, '#c8b898'); p.hl(0, 15, 16, '#c8b898'); p.vl(r() < .5 ? 7 : 5, 0, 7, '#c8b898'); p.vl(r() < .5 ? 12 : 2, 8, 7, '#c8b898'); for (let i = 0; i < 5; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), '#ece2cc'); } },
  water: { f: 4, v: 1, fn: (p, f, r) => { p.r(0, 0, 16, 16, C.w1); for (let y = 0; y < 16; y += 4) { for (let x = 0; x < 16; x++) { const v = Math.sin((x + f * 4 + y * 1.7) * 0.4); if (v > 0.75) p.px(x, y + 1, C.w2); if (v > 0.93) p.px(x, y, C.w3); } } p.px((f * 5 + 3) % 16, 11, C.w3); } },
  sea: { f: 4, v: 1, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#2f78c8'); for (let y = 0; y < 16; y += 5) for (let x = 0; x < 16; x++) { const v = Math.sin((x + f * 4 + y * 2.3) * 0.38); if (v > 0.8) p.px(x, y + 2, '#5c9ce4'); if (v > 0.95) p.px(x, y + 1, '#d8f0ff'); } } },
  sand: { f: 1, v: 3, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#eedc9c'); for (let i = 0; i < 14; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? '#dcc684' : '#f8ecbc'); } },
  wood: { f: 1, v: 2, fn: (p, f, r) => { for (let y = 0; y < 16; y += 4) { p.r(0, y, 16, 4, (y / 4) % 2 ? C.wood1 : '#b87e48'); p.hl(0, y + 3, 16, C.wood3); p.hl(0, y, 16, C.wood4); const cut = Math.floor(r() * 14) + 1; p.vl(cut, y, 3, C.wood3); } } },
  terra: { f: 1, v: 1, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#a86440'); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { const c = (x + y) % 2 ? '#d08a5a' : '#c47c4c'; p.r(x * 8 + 1, y * 8 + 1, 7, 7, c); p.hl(x * 8 + 1, y * 8 + 1, 6, '#dc9a6a'); } } },
  checker: { f: 1, v: 1, fn: (p) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) p.r(x * 8, y * 8, 8, 8, (x + y) % 2 ? '#e8e0d0' : '#6a5a6a'); p.hl(0, 0, 16, '#f4ece0'); } },
  carpet: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#a82a36'); for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x += 8) { p.px(x + 4, y + 2, '#c8404a'); p.px(x + 3, y + 3, '#c8404a'); p.px(x + 5, y + 3, '#c8404a'); p.px(x + 4, y + 4, '#d8b050'); } } },
  wall: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 11, '#efe3c6'); for (let x = 1; x < 16; x += 4) p.vl(x, 0, 11, '#e2d2ae'); p.hl(0, 10, 16, '#c8b48c'); p.r(0, 11, 16, 5, '#9a6438'); p.hl(0, 11, 16, '#c08850'); p.hl(0, 15, 16, '#5a3820'); } },
  wallb: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 11, '#d4e4f0'); for (let x = 1; x < 16; x += 4) p.vl(x, 0, 11, '#c0d4e4'); p.r(0, 11, 16, 5, '#7a8ca8'); p.hl(0, 11, 16, '#a0b4cc'); p.hl(0, 15, 16, '#4a5a74'); } },
  wallp: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 11, '#f8d8e4'); for (let x = 2; x < 16; x += 5) for (let y = 2; y < 10; y += 4) p.px(x, y, '#f0a8c0'); p.r(0, 11, 16, 5, '#f4f0f8'); p.hl(0, 11, 16, '#ffffff'); p.hl(0, 15, 16, '#b0a8c0'); } },
  wallstone: { f: 1, v: 2, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#5a5060'); for (let y = 0; y < 16; y += 5) { const off = (y / 5) % 2 ? 4 : 0; for (let x = -4; x < 16; x += 8) { p.r(x + off + 1, y + 1, 6, 3, r() < .5 ? '#6e6474' : '#665c6c'); p.hl(x + off + 1, y + 1, 5, '#82788a'); } } } },
  top: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#2c2430'); } },
  void: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#000000'); } },
  cave: { f: 1, v: 3, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#a08a6e'); for (let i = 0; i < 12; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? '#8c765c' : '#b29c80'); if (r() < .5) { const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11); p.r(x, y, 2, 1, '#7a6650'); } } },
  rock: { f: 1, v: 3, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#8a7c6c'); for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 12), y = Math.floor(r() * 12); p.r(x, y, 4, 3, '#a09080'); p.hl(x, y, 3, '#b8a898'); p.hl(x + 1, y + 3, 3, '#6a5e52'); } } },
  snow: { f: 1, v: 3, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#eef4fc'); for (let i = 0; i < 8; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? '#d4e0f0' : '#ffffff'); } },
  wheat: { f: 2, v: 2, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#d8b84e'); for (let x = 1; x < 16; x += 3) { const o = f ? 1 : 0; p.vl(x, 3, 12, '#c09a38'); p.r(x - 1 + o, 1 + (x % 2), 2, 3, '#f0d870'); p.px(x + o, 0 + (x % 2), '#fff0a0'); } } },
  maize: { f: 2, v: 1, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#5a8a34'); for (let x = 1; x < 16; x += 4) { p.vl(x, 0, 16, '#3c6a24'); p.px(x + 1 + f, 4, '#7cb04a'); p.px(x - 1 - f, 9, '#7cb04a'); } } },
  mud: { f: 1, v: 2, fn: (p, f, r) => { p.r(0, 0, 16, 16, '#9a7450'); for (let i = 0; i < 10; i++) p.px(Math.floor(r() * 16), Math.floor(r() * 16), r() < .5 ? '#86623e' : '#ac8660'); } },
  bridge: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, C.w1); for (let x = 0; x < 16; x += 4) { p.r(x, 0, 4, 16, x % 8 ? C.wood1 : '#b07a46'); p.vl(x + 3, 0, 16, C.wood3); } p.hl(0, 0, 16, C.wood3); p.hl(0, 15, 16, C.wood3); } },
  pier: { f: 1, v: 1, fn: (p) => { for (let y = 0; y < 16; y += 4) { p.r(0, y, 16, 4, y % 8 ? '#a8784a' : '#9a6c40'); p.hl(0, y + 3, 16, '#6a4628'); } p.px(2, 1, '#4a3020'); p.px(13, 9, '#4a3020'); } },
  waterfall: { f: 4, v: 1, fn: (p, f) => { p.r(0, 0, 16, 16, '#5aa0ee'); for (let x = 0; x < 16; x += 3) for (let y = 0; y < 16; y++) if ((y + f * 4 + x * 3) % 8 < 3) p.px(x, y, '#d8f0ff'); } },
  space: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#101030'); } },
  lab: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#9aa4b4'); p.hl(0, 0, 16, '#b4bccc'); p.vl(0, 0, 16, '#b4bccc'); p.hl(0, 15, 16, '#7a8494'); p.vl(15, 0, 16, '#7a8494'); } },
  stairs: { f: 1, v: 1, fn: (p) => { for (let y = 0; y < 16; y += 4) { p.r(0, y, 16, 4, '#b07a46'); p.hl(0, y, 16, '#d8a066'); p.hl(0, y + 3, 16, '#6a4628'); } } },
  doorin: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#efe3c6'); p.r(2, 1, 12, 15, '#2a1e2e'); p.r(3, 2, 10, 14, '#9a6438'); p.r(3, 2, 10, 2, '#c08850'); p.vl(8, 3, 13, '#7a4a28'); p.px(11, 9, '#e8c050'); } },
  mat: { f: 1, v: 1, fn: (p) => { p.r(0, 0, 16, 16, '#c47c4c'); p.r(2, 3, 12, 10, '#7a3a8a'); p.r(3, 4, 10, 8, '#9a4aa8'); p.hl(3, 4, 10, '#b46ac0'); } },
};
// Leyenda ASCII → baldosa y si es sólida
const LEGEND = {
  '.': ['grass', 0], ',': ['grassd', 0], '"': ['tall', 0], '*': ['flowers', 0], ':': ['dirt', 0], '=': ['cobble', 0], '_': ['pavers', 0],
  '~': ['water', 1], '%': ['sea', 1], 's': ['sand', 0], 'w': ['wood', 0], 't': ['terra', 0], 'k': ['checker', 0], 'r': ['carpet', 0],
  '#': ['wall', 1], 'B': ['wallb', 1], 'Q': ['wallp', 1], 'S': ['wallstone', 1], 'T': ['top', 1], ' ': ['void', 1], 'c': ['cave', 0], 'R': ['rock', 1],
  'n': ['snow', 0], 'f': ['wheat', 0], 'z': ['maize', 0], 'M': ['mud', 0], 'b': ['bridge', 0], 'p': ['pier', 0], 'x': ['waterfall', 1],
  'o': ['space', 1], 'l': ['lab', 0], 'H': ['stairs', 0], 'm': ['mat', 0]
};
const GRASSY = new Set(['grass', 'grassd', 'tall', 'flowers', 'wheat', 'maize']);
const WATERY = new Set(['water', 'sea', 'waterfall', 'bridge']);
const OVERLAY_TILES = new Set(['tall', 'maize']);

function buildTiles() {
  for (const [name, d] of Object.entries(TILE_DEFS)) {
    ART.tiles[name] = [];
    for (let v = 0; v < d.v; v++) ART.tiles[name].push(tileCanvas(d.fn, d.f, 17 + v * 101 + name.length * 13));
  }
  // flecos de pasto sobre tierra/adoquín (bordes suaves)
  const fr = {};
  ['n', 's', 'e', 'w'].forEach(side => {
    const c = mkCanvas(16, 16), p = P(c.getContext('2d')), r = RNG(side.charCodeAt(0));
    for (let i = 0; i < 16; i++) {
      const d = 1 + Math.floor(r() * 2.4);
      for (let k = 0; k < d; k++) {
        const col = k === d - 1 ? C.g2 : C.g1;
        if (side === 'n') p.px(i, k, col); if (side === 's') p.px(i, 15 - k, col); if (side === 'w') p.px(k, i, col); if (side === 'e') p.px(15 - k, i, col);
      }
    }
    fr[side] = c;
  });
  ART.fringe = fr;
  // borde de agua (orilla clara)
  const sh = {};
  ['n', 's', 'e', 'w'].forEach(side => {
    const c = mkCanvas(16, 16), p = P(c.getContext('2d'));
    for (let i = 0; i < 16; i++) { if (side === 'n') { p.px(i, 0, '#e8e0c8'); p.px(i, 1, '#a8d4f8'); } if (side === 's') p.px(i, 15, '#2a5ea0'); if (side === 'w') { p.px(0, i, '#e8e0c8'); p.px(1, i, '#a8d4f8'); } if (side === 'e') { p.px(15, i, '#e8e0c8'); p.px(14, i, '#a8d4f8'); } }
    sh[side] = c;
  });
  ART.shore = sh;
  // capa superior de pasto alto / maizal (tapa los pies)
  ART.overlay = {
    tall: [0, 1].map(f => { const c = mkCanvas(16, 16), p = P(c.getContext('2d')); for (let x = 0; x < 16; x += 2) { const h = 4 + ((x * 7) % 4); const o = (f && x % 4 === 0) ? 1 : 0; for (let y = 0; y < h; y++) p.px(x + (y < 2 ? o : 0), 15 - y, y === h - 1 ? C.g3 : (x % 4 ? C.g4 : C.g2)); } return c; }),
    maize: [0, 1].map(f => { const c = mkCanvas(16, 16), p = P(c.getContext('2d')); for (let x = 1; x < 16; x += 4) { p.vl(x, 2, 14, '#3c6a24'); p.r(x - 2 + f, 4, 2, 1, '#6aa040'); p.r(x + 1 - f, 8, 2, 1, '#6aa040'); p.r(x - 1, 1, 3, 2, '#e8d060'); } return c; })
  };
}

// =================================================================== PROPS
// Cada prop: {c: canvas, ax, ay} → ancla (píxel del lienzo) que se ubica en la esquina sup-izq del pie (footprint)
function prop(w, h, fn, foot = [1, 1], anchorY = null) {
  const c = mkCanvas(w, h); const p = P(c.getContext('2d')); fn(p, c.getContext('2d'));
  return { c, w, h, fw: foot[0], fh: foot[1], oy: anchorY == null ? h - foot[1] * 16 : anchorY, ox: Math.round((w - foot[0] * 16) / 2) };
}
function animProp(frames, w, h, fn, foot, anchorY) { const arr = []; for (let f = 0; f < frames; f++) arr.push(prop(w, h, (p, ctx) => fn(p, f, ctx), foot, anchorY)); return arr; }

function drawTree(p, kind = 'tree') {
  const leaf = kind === 'naranjo' ? ['#2f7a36', '#3f9a44', '#5cb858'] : kind === 'pino' ? ['#2a5a3a', '#346e46', '#4a8a5a'] : ['#2f7a36', '#47a043', '#72c060'];
  p.r(14, 28, 4, 12, '#7a5030'); p.vl(14, 28, 12, '#94643c'); p.r(12, 38, 8, 2, 'rgba(0,0,0,0.18)');
  p.ell(16, 18, 14, 12, C.ol); p.ell(16, 18, 13, 11, leaf[0]); p.ell(14, 15, 11, 9, leaf[1]); p.ell(11, 11, 6, 5, leaf[2]);
  for (let i = 0; i < 6; i++) { p.px(6 + i * 4, 22 + (i % 2) * 3, leaf[0]); }
  if (kind === 'naranjo') [[9, 16], [20, 12], [23, 21], [13, 23], [17, 18], [6, 20]].forEach(([x, y]) => { p.r(x, y, 2, 2, '#f08a20'); p.px(x, y, '#ffc060'); });
}
function drawAlamo(p) {
  p.r(7, 38, 3, 10, '#7a5030');
  p.ell(8, 22, 7, 18, C.ol); p.ell(8, 22, 6, 17, '#3a8a3c'); p.ell(7, 19, 4, 14, '#54a648'); p.ell(6, 14, 2, 8, '#7cc464');
}
function drawRoof(p, x, y, w, h, cols = [C.roof1, C.roof2, C.roof3, C.roof4]) {
  p.r(x, y, w, h, cols[0]);
  for (let yy = y; yy < y + h; yy += 5) { p.hl(x, yy + 4, w, cols[1]); for (let xx = x; xx < x + w; xx += 4) { p.vl(xx, yy, 4, cols[1]); p.px(xx + 1, yy, cols[2]); p.px(xx + 2, yy, cols[2]); } }
  p.hl(x, y, w, cols[3]); p.hl(x, y + 1, w, cols[2]);
  p.hl(x - 1, y + h, w + 2, cols[3]); p.hl(x - 1, y + h + 1, w + 2, 'rgba(0,0,0,0.25)');
  p.vl(x - 1, y, h + 1, cols[3]); p.vl(x + w, y, h + 1, cols[3]);
}
function drawWindow(p, x, y, kind = 'rejas') {
  p.r(x, y, 10, 11, C.ol); p.r(x + 1, y + 1, 8, 9, '#3a4a6e'); p.r(x + 1, y + 1, 8, 2, '#5a6e94');
  if (kind === 'rejas') { for (let i = 0; i < 4; i++) p.vl(x + 2 + i * 2, y + 1, 9, '#2a2226'); p.hl(x + 1, y + 5, 8, '#2a2226'); }
  p.r(x - 1, y + 10, 12, 2, '#d8ccb0'); p.hl(x - 1, y + 11, 12, C.adobe3);
}
function drawDoor(p, x, y, col = '#7a4a28', w = 12, h = 19) {
  p.r(x - 1, y - 1, w + 2, h + 1, C.ol); p.r(x, y, w, h, col); p.r(x, y, w, 3, shade(col, 1.25));
  p.vl(x + w / 2, y + 2, h - 2, shade(col, 0.7)); p.px(x + w / 2 - 2, y + h / 2 + 1, '#e8c050'); p.px(x + w / 2 + 2, y + h / 2 + 1, '#e8c050');
  for (let yy = y + 5; yy < y + h - 1; yy += 5) { p.hl(x + 1, yy, w / 2 - 2, shade(col, 0.8)); p.hl(x + w / 2 + 1, yy, w / 2 - 2, shade(col, 0.8)); }
}
// Casa colonial (adobe blanco + tejas). opts: {roofRows, door:[cols], wall, roof, windows:false, sign}
function buildingProp(w, h, opts = {}) {
  const W = w * 16, roofRows = opts.roofRows ?? Math.max(1, Math.floor(h / 2)), extraTop = 8;
  const Hpx = h * 16 + extraTop;
  return prop(W, Hpx, (p) => {
    const wallTop = extraTop + roofRows * 16 - 4, wallH = Hpx - wallTop;
    const wcol = opts.wall || C.adobe;
    p.r(0, wallTop, W, wallH, wcol); p.r(0, wallTop, W, 3, shade(wcol, 0.85));
    p.r(0, Hpx - 5, W, 5, opts.zocalo || C.zocalo); p.hl(0, Hpx - 5, W, shade(opts.zocalo || C.zocalo, 1.2));
    p.vl(0, wallTop, wallH, shade(wcol, 0.8)); p.vl(W - 1, wallTop, wallH, shade(wcol, 0.75));
    for (let i = 0; i < 18; i++) p.px(Math.floor(Math.random() * W), wallTop + 4 + Math.floor(Math.random() * (wallH - 10)), shade(wcol, 0.93));
    const doors = opts.door || [Math.floor(w / 2)];
    for (let tx = 0; tx < w; tx++) {
      const isDoor = doors.includes(tx);
      for (let row = roofRows; row < h; row++) {
        const y = extraTop + row * 16; const bottom = row === h - 1;
        if (isDoor && bottom) drawDoor(p, tx * 16 + 2, Hpx - 20, opts.doorCol || '#7a4a28');
        else if (opts.windows !== false && (!isDoor) && (tx % 2 === (opts.winOdd ? 1 : 0)) && w > 1) drawWindow(p, tx * 16 + 3, y + (bottom ? 0 : 2), opts.win || 'rejas');
      }
    }
    if (opts.sign) { p.r(opts.sign.x * 16 + 1, wallTop + 3, 14, 7, '#7a4a28'); p.r(opts.sign.x * 16 + 2, wallTop + 4, 12, 5, '#e8d090'); p.hl(opts.sign.x * 16 + 4, wallTop + 6, 8, '#7a4a28'); }
    drawRoof(p, 1, 0, W - 2, wallTop - 1, opts.roof);
    if (opts.chimney) { p.r(W - 14, 0, 6, 8, '#9a8a7a'); p.hl(W - 14, 0, 6, '#6a5a4a'); }
  }, [w, h], extraTop);
}
function cabildoProp(w, h) {
  // Cabildo/Real Audiencia: dos pisos con arcos (portales) y torre central
  const W = w * 16, extraTop = 40, Hpx = h * 16 + extraTop;
  return prop(W, Hpx, (p) => {
    const roofH = 14, top = extraTop + 4;
    p.r(0, top + roofH, W, Hpx - top - roofH, '#f4eedf');
    // segundo piso: balcones
    for (let x = 6; x < W - 10; x += 16) { drawWindow(p, x + 2, top + roofH + 6, 'vidrio'); }
    p.r(0, top + roofH + 20, W, 3, '#cfc2a4'); p.hl(0, top + roofH + 23, W, '#a89878');
    // balaustrada
    for (let x = 0; x < W; x += 3) p.vl(x, top + roofH + 18, 2, '#8a6a4a'); p.hl(0, top + roofH + 17, W, '#6a4a2a');
    // arcos del primer piso
    const ay = top + roofH + 26, ah = Hpx - ay - 4;
    for (let x = 0; x < W; x += 16) { p.r(x + 3, ay + 4, 10, ah - 4, '#5a4a40'); p.ell(x + 8, ay + 5, 5, 4, '#5a4a40'); p.r(x + 4, ay + 6, 8, ah - 6, '#3a3036'); p.r(x, ay, 3, ah, '#fbf6ea'); p.vl(x + 2, ay, ah, '#d8ccb0'); }
    p.r(W - 3, ay, 3, ah, '#fbf6ea');
    p.r(0, Hpx - 4, W, 4, '#b8aa90');
    drawRoof(p, 1, top, W - 2, roofH);
    // torre
    const tx = Math.floor(W / 2) - 12; p.r(tx, 6, 24, top + 8, '#f4eedf'); p.vl(tx, 6, top + 8, '#d8ccb0'); p.vl(tx + 23, 6, top + 8, '#cfc2a4');
    p.r(tx + 7, 14, 10, 12, C.ol); p.circ(tx + 12, 20, 4, '#ffffff'); p.vl(tx + 12, 17, 3, '#2a2226'); p.hl(tx + 12, 20, 3, '#2a2226');
    p.r(tx - 2, 0, 28, 7, C.roof2); p.r(tx + 2, -2, 20, 4, C.roof1); p.r(tx + 10, -6, 4, 5, '#e8c050');
    p.r(tx + 8, top - 2, 8, 10, '#5a4a40');
  }, [w, h], extraTop);
}
function churchProp(w, h) {
  const W = w * 16, extraTop = 30, Hpx = h * 16 + extraTop;
  return prop(W, Hpx, (p) => {
    p.r(0, 18, W, Hpx - 18, '#d8d0c0'); for (let y = 22; y < Hpx; y += 6) p.hl(0, y, W, '#c4bba8');
    p.r(0, 14, W, 6, '#bdb39e');
    const cx = W / 2; p.r(cx - 18, 0, 36, 20, '#d8d0c0'); p.r(cx - 20, 0, 40, 3, '#bdb39e'); p.r(cx - 2, -8, 4, 10, '#8a7a5a'); p.r(cx - 5, -5, 10, 3, '#8a7a5a');
    p.circ(cx, 10, 5, '#7a5a8a'); p.circ(cx, 10, 3, '#c8a0e0');
    p.r(cx - 9, Hpx - 30, 18, 30, C.ol); p.ell(cx, Hpx - 29, 9, 7, C.ol); p.r(cx - 8, Hpx - 29, 16, 29, '#6a4428'); p.ell(cx, Hpx - 28, 8, 6, '#6a4428'); p.vl(cx, Hpx - 32, 32, '#4a2e18');
    for (let x = 8; x < W - 8; x += 22) if (Math.abs(x + 4 - cx) > 16) { p.r(x, 40, 8, 16, C.ol); p.ell(x + 4, 41, 4, 3, C.ol); p.r(x + 1, 41, 6, 15, '#4a5a8a'); }
    for (let x = 2; x < W; x += 14) p.r(x, 20, 3, Hpx - 24, '#e8e2d4');
  }, [w, h], extraTop);
}

function buildProps() {
  const A = ART.props;
  A.tree = prop(32, 40, p => drawTree(p));
  A.naranjo = prop(32, 40, p => drawTree(p, 'naranjo'));
  A.pino = prop(32, 40, p => drawTree(p, 'pino'));
  A.alamo = prop(16, 48, p => drawAlamo(p));
  A.bush = prop(16, 16, p => { p.ell(8, 9, 7, 6, C.ol); p.ell(8, 9, 6, 5, '#3f8f3a'); p.ell(7, 7, 4, 3, '#5cb058'); p.px(5, 6, '#8ad078'); });
  A.rock = prop(16, 16, p => { p.ell(8, 10, 7, 5, C.ol); p.ell(8, 10, 6, 4, '#9a9088'); p.ell(7, 8, 4, 2, '#bab0a8'); });
  A.stone = A.rock;
  A.fence = prop(16, 16, p => { p.r(0, 6, 16, 2, '#7a5030'); p.r(0, 11, 16, 2, '#7a5030'); p.hl(0, 6, 16, '#a87040'); p.r(2, 3, 3, 12, '#7a5030'); p.r(11, 3, 3, 12, '#7a5030'); p.vl(2, 3, 12, '#a87040'); p.vl(11, 3, 12, '#a87040'); });
  A.fencev = prop(16, 16, p => { p.r(6, 0, 4, 16, '#7a5030'); p.vl(6, 0, 16, '#a87040'); });
  A.lamp = prop(16, 32, p => { p.r(7, 10, 2, 22, '#3a3036'); p.r(4, 2, 8, 9, C.ol); p.r(5, 3, 6, 7, '#ffe8a0'); p.r(3, 1, 10, 2, '#3a3036'); p.r(5, 30, 6, 2, '#3a3036'); }, [1, 1]);
  A.bench = prop(32, 16, p => { p.r(1, 6, 30, 4, '#8a5a30'); p.hl(1, 6, 30, '#b07a46'); p.r(1, 2, 30, 3, '#7a4a28'); p.r(3, 10, 3, 5, '#4a3020'); p.r(26, 10, 3, 5, '#4a3020'); }, [2, 1]);
  A.fountain = animProp(4, 48, 40, (p, f) => {
    p.ell(24, 28, 22, 10, C.ol); p.ell(24, 28, 21, 9, '#cfc6b4'); p.ell(24, 27, 18, 7, C.w1);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + f * 0.4; p.px(24 + Math.round(Math.cos(a) * 12), 27 + Math.round(Math.sin(a) * 4), C.w3); }
    p.r(21, 8, 6, 20, '#cfc6b4'); p.vl(21, 8, 20, '#e8e0d0'); p.ell(24, 9, 7, 3, '#bdb39e');
    for (let k = 0; k < 4; k++) { const y = 2 + ((k * 4 + f * 2) % 8); p.px(22 - k % 2, y, C.w3); p.px(26 + k % 2, y + 1, C.w3); }
    p.r(23, 0, 2, 6, C.w2);
  }, [3, 2]);
  A.well = prop(32, 32, p => { p.ell(16, 24, 12, 6, C.ol); p.ell(16, 24, 11, 5, '#a8a094'); p.ell(16, 23, 8, 3, '#2a3a5a'); p.r(5, 6, 3, 18, '#7a5030'); p.r(24, 6, 3, 18, '#7a5030'); p.r(3, 3, 26, 4, C.roof2); p.hl(3, 3, 26, C.roof3); }, [2, 1]);
  A.cart = prop(40, 28, p => { p.r(4, 6, 30, 12, '#9a6a3a'); p.hl(4, 6, 30, '#c08850'); for (let x = 6; x < 34; x += 6) p.vl(x, 7, 10, '#7a4a28'); p.circ(10, 21, 6, C.ol); p.circ(10, 21, 5, '#7a4a28'); p.circ(10, 21, 1, '#c08850'); p.circ(28, 21, 6, C.ol); p.circ(28, 21, 5, '#7a4a28'); p.circ(28, 21, 1, '#c08850'); p.r(34, 12, 6, 2, '#7a4a28'); }, [2, 1]);
  A.hay = prop(16, 16, p => { p.r(1, 3, 14, 12, C.ol); p.r(2, 4, 12, 10, '#e0c058'); for (let x = 3; x < 14; x += 2) p.vl(x, 4, 10, '#c8a440'); p.hl(2, 4, 12, '#f4dc80'); p.hl(2, 9, 12, '#a88a30'); });
  A.haypile = prop(32, 24, p => { p.ell(16, 15, 15, 9, C.ol); p.ell(16, 15, 14, 8, '#e0c058'); p.ell(13, 12, 9, 5, '#f0d878'); for (let i = 0; i < 12; i++) p.px(4 + i * 2, 10 + (i % 3) * 3, '#c8a440'); }, [2, 1]);
  A.barrel = prop(16, 20, p => { p.r(3, 3, 10, 16, C.ol); p.r(4, 4, 8, 14, '#9a6a3a'); p.hl(4, 7, 8, '#5a5a5a'); p.hl(4, 14, 8, '#5a5a5a'); p.vl(5, 4, 14, '#b88a52'); p.ell(8, 4, 4, 1, '#c09a6a'); });
  A.crate = prop(16, 16, p => { p.r(1, 2, 14, 13, C.ol); p.r(2, 3, 12, 11, '#b07a46'); p.hl(2, 3, 12, '#d09a62'); for (let i = 0; i < 11; i++) { p.px(2 + i, 3 + i, '#7a4a28'); } p.r(2, 8, 12, 1, '#7a4a28'); });
  A.stall = prop(40, 36, p => {
    p.r(2, 18, 36, 16, C.ol); p.r(3, 19, 34, 14, '#a87040'); p.hl(3, 19, 34, '#c89060');
    [['#f05a6a', 6], ['#f8d040', 14], ['#a0e070', 22], ['#f0a050', 30]].forEach(([c, x]) => { p.circ(x, 17, 3, c); p.px(x - 1, 16, '#ffffff'); });
    p.r(4, 4, 2, 16, '#6a4428'); p.r(34, 4, 2, 16, '#6a4428');
    for (let x = 0; x < 40; x += 8) { p.r(x, 0, 4, 7, '#e84a4a'); p.r(x + 4, 0, 4, 7, '#ffffff'); } p.hl(0, 7, 40, '#a83a3a');
    for (let x = 0; x < 40; x += 4) p.px(x + 2, 8, x % 8 ? '#ffffff' : '#e84a4a');
  }, [2, 1]);
  A.table = prop(32, 24, p => { p.r(1, 4, 30, 12, C.ol); p.r(2, 5, 28, 10, '#9a6a3a'); p.hl(2, 5, 28, '#c08850'); p.r(3, 15, 3, 8, '#6a4428'); p.r(26, 15, 3, 8, '#6a4428'); }, [2, 1]);
  A.tablecloth = prop(32, 24, p => { p.r(1, 4, 30, 16, C.ol); p.r(2, 5, 28, 14, '#f4f0e8'); p.hl(2, 5, 28, '#ffffff'); for (let x = 3; x < 30; x += 4) p.px(x, 18, '#c84040'); p.r(9, 7, 6, 4, '#e8e0d0'); p.r(18, 7, 4, 5, '#a86440'); }, [2, 1]);
  A.longtable = prop(80, 28, p => { p.r(1, 4, 78, 16, C.ol); p.r(2, 5, 76, 14, '#7a4a28'); p.hl(2, 5, 76, '#a06a3a'); for (let x = 8; x < 76; x += 14) { p.r(x, 8, 7, 5, '#f4ecd8'); p.hl(x + 1, 10, 5, '#a89878'); } p.r(36, 6, 3, 6, '#e8c050'); p.r(4, 19, 4, 8, '#4a2e18'); p.r(72, 19, 4, 8, '#4a2e18'); }, [5, 1]);
  A.chair = prop(16, 20, p => { p.r(3, 2, 10, 9, C.ol); p.r(4, 3, 8, 7, '#8a2a30'); p.r(3, 10, 10, 4, '#6a4428'); p.r(4, 14, 2, 5, '#4a2e18'); p.r(10, 14, 2, 5, '#4a2e18'); });
  A.bookshelf = prop(16, 32, p => { p.r(0, 0, 16, 32, C.ol); p.r(1, 1, 14, 30, '#7a4a28'); for (let y = 2; y < 30; y += 7) { p.hl(1, y + 6, 14, '#4a2e18'); let x = 2; const cols = ['#c84040', '#4a7ac8', '#e8c050', '#5aa050', '#8a5ab0', '#e88040']; let i = y; while (x < 14) { const w = 1 + ((i * 7) % 2); p.r(x, y, w, 6, cols[(i++) % cols.length]); x += w + 0; } } }, [1, 1], 16);
  A.bookshelf2 = prop(32, 32, p => { for (let k = 0; k < 2; k++) { const o = k * 16; p.r(o, 0, 16, 32, C.ol); p.r(o + 1, 1, 14, 30, '#7a4a28'); for (let y = 2; y < 30; y += 7) { p.hl(o + 1, y + 6, 14, '#4a2e18'); let x = o + 2; const cols = ['#c84040', '#4a7ac8', '#e8c050', '#5aa050', '#8a5ab0', '#e88040']; let i = y + k * 3; while (x < o + 14) { p.r(x, y, 2, 6, cols[(i++) % cols.length]); x += 2; } } } }, [2, 1], 16);
  A.bed = prop(16, 32, p => { p.r(0, 0, 16, 32, C.ol); p.r(1, 1, 14, 30, '#a06a3a'); p.r(2, 2, 12, 8, '#ffffff'); p.r(2, 10, 12, 20, '#f2a7b5'); for (let y = 12; y < 30; y += 4) for (let x = 3; x < 14; x += 4) p.px(x + (y % 8 ? 2 : 0), y, '#fff3e0'); p.hl(2, 10, 12, '#f8c8d0'); }, [1, 2]);
  A.bedold = prop(16, 32, p => { p.r(0, 0, 16, 32, C.ol); p.r(1, 1, 14, 30, '#7a4a28'); p.r(2, 2, 12, 8, '#f4f0e8'); p.r(2, 10, 12, 20, '#6a8ab0'); p.hl(2, 10, 12, '#8aaad0'); }, [1, 2]);
  A.desk = prop(32, 24, p => { p.r(1, 6, 30, 10, C.ol); p.r(2, 7, 28, 8, '#c8a070'); p.hl(2, 7, 28, '#e0bc8c'); p.r(3, 15, 4, 8, '#8a6a4a'); p.r(25, 15, 4, 8, '#8a6a4a'); p.r(20, 1, 6, 7, '#5a6a8a'); p.r(21, 2, 4, 4, '#a0d8ff'); p.r(5, 4, 8, 4, '#ffffff'); p.hl(6, 5, 6, '#4a7ac8'); }, [2, 1]);
  A.deskold = prop(32, 24, p => { p.r(1, 6, 30, 10, C.ol); p.r(2, 7, 28, 8, '#7a4a28'); p.hl(2, 7, 28, '#9a6a3a'); p.r(3, 15, 4, 8, '#4a2e18'); p.r(25, 15, 4, 8, '#4a2e18'); p.r(6, 4, 9, 5, '#f4ecd8'); p.hl(7, 6, 7, '#a89878'); p.r(20, 3, 2, 5, '#2a2a3a'); p.px(22, 2, '#f8f8f8'); p.px(23, 1, '#f8f8f8'); }, [2, 1]);
  A.toybox = prop(16, 16, p => { p.r(1, 3, 14, 12, C.ol); p.r(2, 4, 12, 10, '#4aa0e0'); p.hl(2, 4, 12, '#7ac0f8'); p.r(2, 7, 12, 2, '#f8d040'); p.circ(5, 2, 2, '#f05a6a'); p.r(9, 0, 3, 4, '#7ad070'); });
  A.plant = prop(16, 20, p => { p.r(4, 12, 8, 7, C.ol); p.r(5, 13, 6, 5, '#c86a3a'); p.ell(8, 8, 6, 5, C.ol); p.ell(8, 8, 5, 4, '#3f9a44'); p.ell(7, 6, 3, 2, '#6ac060'); });
  A.wardrobe = prop(16, 32, p => { p.r(0, 0, 16, 32, C.ol); p.r(1, 1, 14, 30, '#9a6a3a'); p.vl(8, 2, 28, '#6a4428'); p.px(6, 16, '#e8c050'); p.px(10, 16, '#e8c050'); p.hl(1, 1, 14, '#c08850'); }, [1, 1], 16);
  A.rug = prop(48, 32, p => { p.r(0, 0, 48, 32, '#7a3a8a'); p.r(2, 2, 44, 28, '#a85ab8'); p.r(5, 5, 38, 22, '#7a3a8a'); p.r(7, 7, 34, 18, '#c88ad0'); }, [3, 2]);
  A.candela = prop(16, 32, p => { p.r(7, 10, 2, 20, '#c8a040'); p.r(4, 28, 8, 3, '#a88030'); p.r(3, 8, 10, 2, '#c8a040'); [4, 8, 12].forEach(x => { p.r(x - 1, 4, 2, 4, '#f4f0e0'); p.px(x - 1, 2, '#ffd040'); p.px(x - 1, 3, '#ff8a20'); }); });
  A.painting = prop(16, 16, p => { p.r(1, 2, 14, 11, '#c8a040'); p.r(2, 3, 12, 9, '#3a4a3a'); p.circ(8, 7, 3, '#e8c8a0'); p.r(5, 9, 6, 3, '#8a2a30'); });
  A.paintingw = prop(32, 16, p => { p.r(1, 1, 30, 13, '#c8a040'); p.r(2, 2, 28, 11, '#6a8aa8'); p.r(2, 9, 28, 4, '#5a7a4a'); p.ell(10, 9, 6, 3, '#e8e8f0'); p.ell(22, 8, 6, 4, '#f4f4f8'); }, [2, 1]);
  A.mapwall = prop(48, 24, p => { p.r(0, 0, 48, 22, '#6a4428'); p.r(2, 2, 44, 18, '#e8dcb0'); p.r(3, 3, 42, 16, '#a8c8e0'); p.ell(12, 10, 6, 6, '#c8b070'); p.r(10, 6, 3, 12, '#c8b070'); p.r(9, 15, 2, 4, '#c8b070'); p.ell(36, 8, 5, 3, '#c8b070'); p.r(33, 7, 6, 4, '#c8b070'); for (let x = 13; x < 33; x += 3) p.px(x, 13 - Math.round((x - 13) * 0.25), '#c84040'); p.r(9, 16, 2, 2, '#c84040'); }, [3, 1]);
  A.piano = prop(32, 28, p => { p.r(1, 2, 30, 22, C.ol); p.r(2, 3, 28, 12, '#2a2226'); p.hl(2, 3, 28, '#5a5056'); p.r(2, 15, 28, 5, '#f4f4f0'); for (let x = 3; x < 30; x += 2) p.vl(x, 15, 5, '#bdbdb8'); for (let x = 4; x < 30; x += 4) p.r(x, 15, 1, 3, '#1a1418'); p.r(3, 20, 3, 7, '#2a2226'); p.r(26, 20, 3, 7, '#2a2226'); p.r(10, 5, 8, 6, '#f4ecd8'); }, [2, 1]);
  A.fireplace = prop(32, 32, p => { p.r(0, 4, 32, 28, '#9a8a7a'); p.r(2, 2, 28, 4, '#7a6a5a'); p.r(7, 14, 18, 16, '#2a1e1e'); p.ell(16, 26, 6, 3, '#ff8a20'); p.ell(16, 24, 3, 3, '#ffd040'); }, [2, 1], 16);
  A.window = prop(16, 16, p => { p.r(2, 1, 12, 12, C.ol); p.r(3, 2, 10, 10, '#a0d8ff'); p.vl(8, 2, 10, '#ffffff'); p.hl(3, 7, 10, '#ffffff'); p.r(2, 12, 12, 2, '#c8b48c'); });
  A.windowold = prop(16, 16, p => { p.r(2, 1, 12, 12, C.ol); p.r(3, 2, 10, 10, '#4a5a7e'); for (let i = 0; i < 4; i++) p.vl(4 + i * 2, 2, 10, '#2a2226'); p.r(2, 12, 12, 2, '#c8b48c'); });
  A.poster = prop(16, 16, p => { p.r(3, 1, 10, 13, '#ffffff'); p.r(4, 2, 8, 6, '#4a90d8'); p.circ(8, 5, 2, '#f8d040'); p.r(4, 9, 8, 1, '#e84a4a'); p.r(4, 11, 6, 1, '#7a7a7a'); });
  A.flagwall = prop(16, 16, p => { p.r(2, 2, 12, 10, '#ffffff'); p.r(2, 7, 12, 5, '#d52b1e'); p.r(2, 2, 5, 5, '#0039a6'); p.px(4, 4, '#ffffff'); });
  A.cofre = prop(16, 16, p => { p.r(1, 5, 14, 10, C.ol); p.r(2, 6, 12, 8, '#8a5a30'); p.r(2, 6, 12, 3, '#a87040'); p.r(7, 8, 2, 3, '#e8c050'); p.hl(2, 9, 12, '#5a3820'); });
  A.saddle = prop(16, 16, p => { p.r(5, 10, 6, 6, '#6a4428'); p.ell(8, 8, 6, 3, C.ol); p.ell(8, 8, 5, 2, '#8a4a28'); p.r(4, 5, 3, 3, '#8a4a28'); p.px(12, 9, '#e8c050'); });
  A.stairsup = prop(16, 16, p => { for (let y = 0; y < 16; y += 4) { p.r(0, y, 16, 4, '#9a8a7a'); p.hl(0, y, 16, '#c8b8a8'); } });
  A.olla = prop(16, 16, p => { p.ell(8, 10, 6, 5, C.ol); p.ell(8, 10, 5, 4, '#5a5050'); p.ell(8, 7, 5, 2, '#7a7070'); p.r(1, 8, 2, 2, '#3a3030'); p.r(13, 8, 2, 2, '#3a3030'); });
  A.trapdoor = prop(16, 16, p => { p.r(1, 1, 14, 14, C.ol); p.r(2, 2, 12, 12, '#6a4428'); for (let y = 4; y < 14; y += 3) p.hl(2, y, 12, '#4a2e18'); p.r(6, 7, 4, 2, '#c8a040'); });
  A.ladder = prop(16, 16, p => { p.r(3, 0, 2, 16, '#8a5a30'); p.r(11, 0, 2, 16, '#8a5a30'); for (let y = 2; y < 16; y += 4) p.r(3, y, 10, 2, '#a87040'); });
  A.torch = animProp(2, 16, 16, (p, f) => { p.r(7, 7, 2, 8, '#6a4428'); p.ell(8, 5, 2, 3 + f, '#ff8a20'); p.ell(8, 6, 1, 2, '#ffe060'); });
  A.campfire = animProp(3, 16, 16, (p, f) => { p.r(3, 12, 10, 3, '#6a4428'); p.ell(8, 9 - f % 2, 4, 4 + f % 2, '#ff6a20'); p.ell(8, 10, 2, 3, '#ffd040'); });
  A.tent = prop(32, 32, p => { for (let y = 0; y < 26; y++) { const w = Math.round(y * 0.6) + 2; p.hl(16 - w, y + 4, w * 2, y % 6 < 3 ? '#e8e0cc' : '#d8ceb8'); } p.r(13, 18, 6, 12, '#4a3a30'); p.vl(16, 0, 6, '#6a4428'); p.r(17, 0, 7, 4, '#0039a6'); }, [2, 1]);
  A.cannon = prop(32, 20, p => { p.r(4, 4, 22, 7, C.ol); p.r(5, 5, 20, 5, '#4a4a52'); p.hl(5, 5, 20, '#7a7a82'); p.circ(10, 14, 5, C.ol); p.circ(10, 14, 4, '#7a4a28'); p.circ(22, 14, 5, C.ol); p.circ(22, 14, 4, '#7a4a28'); }, [2, 1]);
  A.boat = prop(48, 32, p => { p.r(22, 0, 2, 20, '#6a4428'); for (let y = 2; y < 18; y++) p.hl(24, y, Math.round((18 - y) * 0.9), '#f4f0e4'); p.r(4, 20, 40, 8, C.ol); p.r(5, 21, 38, 6, '#8a4a28'); p.hl(5, 21, 38, '#b06a3a'); p.r(8, 27, 32, 3, '#6a3a20'); }, [3, 1]);
  A.ship = prop(64, 56, p => { [16, 34].forEach(x => p.r(x, 2, 2, 36, '#6a4428')); [[17, 4, 14], [35, 6, 14]].forEach(([x, y, h]) => { for (let k = 0; k < h; k++) p.hl(x - 10 + Math.round(k * 0.2), y + k, 20 - Math.round(k * 0.4), '#f8f4e8'); }); p.r(34, 0, 8, 4, '#d52b1e'); p.r(34, 0, 3, 2, '#0039a6'); p.r(2, 38, 60, 12, C.ol); p.r(3, 39, 58, 10, '#5a3420'); p.hl(3, 41, 58, '#e8c050'); for (let x = 8; x < 58; x += 8) p.r(x, 43, 3, 3, '#2a1e1e'); }, [4, 1]);
  A.signpost = prop(16, 24, p => { p.r(7, 10, 2, 13, '#6a4428'); p.r(1, 3, 14, 9, C.ol); p.r(2, 4, 12, 7, '#c08850'); p.hl(4, 6, 8, '#6a4428'); p.hl(4, 8, 6, '#6a4428'); });
  A.hen = animProp(2, 16, 16, (p, f) => { p.ell(8, 11, 4, 3, C.ol); p.ell(8, 11, 3, 2, '#f4f0e8'); p.circ(5 + f, 7, 2, '#f4f0e8'); p.px(3 + f, 7, '#e8a030'); p.px(5 + f, 5, '#e84a4a'); p.px(5 + f, 7, '#2a1e1e'); p.r(7, 14, 1, 2, '#e8a030'); p.r(9, 14, 1, 2, '#e8a030'); });
  A.cactus = prop(16, 24, p => { p.r(6, 4, 4, 18, '#3a8a4a'); p.r(2, 9, 3, 6, '#3a8a4a'); p.r(11, 7, 3, 7, '#3a8a4a'); p.vl(7, 4, 18, '#5aaa6a'); });
  A.statue = prop(16, 32, p => { p.r(2, 22, 12, 10, '#a8a094'); p.hl(2, 22, 12, '#c8c0b4'); p.circ(8, 6, 3, '#b8b0a4'); p.r(5, 9, 6, 13, '#b8b0a4'); p.vl(5, 9, 13, '#d8d0c4'); });
  A.statue_oh = A.statue;   // en 2D comparte el dibujo; en 2.5D usa b_estatua_oh (O'Higgins)
  A.timemachine = animProp(4, 32, 40, (p, f) => {
    p.r(3, 34, 4, 6, '#6a7484'); p.r(25, 34, 4, 6, '#6a7484');
    p.ell(16, 22, 15, 15, C.ol); p.ell(16, 22, 14, 14, '#c8d0dc'); p.ell(13, 18, 9, 8, '#e4eaf2');
    p.circ(16, 20, 7, C.ol); p.circ(16, 20, 6, '#5ab4e8'); p.circ(14, 18, 2, '#c8ecff');
    const cols = ['#e84a4a', '#4a8ae8', '#f8d040', '#5ad070'];
    for (let i = 0; i < 4; i++) { const on = (i + f) % 4 !== 0; p.r(6 + i * 6, 30, 4, 3, on ? cols[i] : shade(cols[i], 0.45)); }
    p.r(14, 3, 4, 5, '#8a94a4'); p.circ(16, 2, 2, (f % 2) ? '#ff5050' : '#ffd0d0');
  }, [2, 1]);
  A.fardo = A.hay;
  A.nieve = prop(16, 16, p => { p.ell(8, 10, 7, 5, C.ol); p.ell(8, 10, 6, 4, '#eef4fc'); p.ell(6, 8, 3, 2, '#ffffff'); p.px(10, 12, '#a8b8d0'); p.px(4, 11, '#c8d4e8'); });
  A.yunque = prop(16, 16, p => { p.r(5, 9, 6, 6, '#7a4a28'); p.hl(5, 9, 6, '#a06a3a'); p.r(2, 5, 12, 4, C.ol); p.r(3, 6, 10, 2, '#5a5a66'); p.hl(3, 6, 10, '#8a8a98'); p.r(1, 6, 2, 1, '#5a5a66'); });
  A.mula = prop(32, 24, p => { p.ell(15, 13, 10, 6, C.ol); p.ell(15, 13, 9, 5, '#8a6448'); p.r(6, 16, 2, 7, '#6a4a34'); p.r(11, 17, 2, 6, '#6a4a34'); p.r(19, 17, 2, 6, '#6a4a34'); p.r(23, 16, 2, 7, '#6a4a34');
    p.r(23, 5, 5, 9, '#8a6448'); p.r(26, 3, 2, 3, '#6a4a34'); p.px(26, 7, '#1a1a1a'); p.r(11, 7, 9, 6, '#a8703a'); p.hl(11, 7, 9, '#c89058'); p.r(13, 5, 5, 2, '#d8c8a8'); }, [2, 1]);
  A.fridge = prop(16, 32, p => { p.r(1, 0, 14, 32, C.ol); p.r(2, 1, 12, 30, '#e8eef4'); p.hl(2, 11, 12, '#a8b4c0'); p.r(11, 4, 1, 5, '#8a94a4'); p.r(11, 14, 1, 7, '#8a94a4'); p.r(4, 3, 4, 3, '#f8d040'); p.r(5, 16, 3, 4, '#e84a4a'); }, [1, 1], 16);
  A.stove = prop(16, 24, p => { p.r(1, 6, 14, 18, C.ol); p.r(2, 7, 12, 16, '#d8dce4'); p.r(3, 8, 4, 3, '#3a3a44'); p.r(9, 8, 4, 3, '#3a3a44'); p.r(4, 14, 8, 7, '#5a5e68'); p.hl(4, 15, 8, '#8a8e98'); });
  A.counter = prop(32, 20, p => { p.r(1, 2, 30, 17, C.ol); p.r(2, 3, 28, 15, '#c8a070'); p.r(2, 3, 28, 4, '#f4f0e8'); p.r(20, 0, 7, 5, '#e8c060'); p.ell(23, 1, 3, 1, '#f0d890'); p.vl(16, 8, 9, '#8a6a4a'); }, [2, 1]);
  A.puzzlemark = prop(16, 16, p => { p.r(2, 2, 12, 12, 'rgba(255,255,255,0.0)'); for (let i = 2; i < 14; i += 2) { p.px(i, 2, '#c8a440'); p.px(i, 13, '#c8a440'); p.px(2, i, '#c8a440'); p.px(13, i, '#c8a440'); } });
  // Banderas (animadas) — tipo en el nombre
  const flag = (kind) => animProp(4, 32, 48, (p, f) => {
    p.r(3, 2, 2, 46, '#6a4428'); p.r(2, 0, 4, 3, '#e8c050');
    const fw = 24, fh = 14;
    for (let x = 0; x < fw; x++) {
      const wy = Math.round(Math.sin((x + f * 3) * 0.35) * 1.5 * (x / fw));
      for (let y = 0; y < fh; y++) {
        let c;
        if (kind === 'pv') c = y < 5 ? '#2a5ab8' : y < 10 ? '#ffffff' : '#f4c430';
        else if (kind === 'es') c = (y < 4 || y >= 10) ? '#c8202a' : '#f4c430';
        else c = y < 7 ? ((x < 9) ? '#0039a6' : '#ffffff') : '#d52b1e';
        if (kind === 'cl' && x >= 3 && x <= 5 && y >= 2 && y <= 4 && !((x === 3 || x === 5) && (y === 2 || y === 4))) c = '#ffffff';
        p.px(5 + x, 3 + y + wy, c);
      }
    }
  }, [1, 1]);
  A.flag_pv = flag('pv'); A.flag_es = flag('es'); A.flag_cl = flag('cl');
  // Tendedero con telas (jardín de Javiera)
  A.telas = animProp(4, 48, 32, (p, f) => {
    p.r(2, 4, 2, 28, '#6a4428'); p.r(44, 4, 2, 28, '#6a4428'); p.hl(3, 6, 42, '#8a8070');
    [['#2a5ab8', 6], ['#ffffff', 19], ['#f4c430', 32]].forEach(([c, x], i) => { for (let y = 0; y < 14; y++) { const o = Math.round(Math.sin((y + f * 2 + i) * 0.5) * (y / 10)); p.hl(x + o, 7 + y, 10, c); } p.hl(x, 7, 10, shade(c, 0.85)); });
  }, [3, 1]);
  A.telas_vacio = prop(48, 32, p => { p.r(2, 4, 2, 28, '#6a4428'); p.r(44, 4, 2, 28, '#6a4428'); p.hl(3, 6, 42, '#8a8070'); }, [3, 1]);
  // decoraciones de pared que no bloquean
  A.clock = prop(16, 16, p => { p.circ(8, 7, 6, C.ol); p.circ(8, 7, 5, '#f4f0e0'); p.vl(8, 3, 4, '#2a2226'); p.hl(8, 7, 3, '#2a2226'); });
  A.labmachine = animProp(2, 32, 32, (p, f) => { p.r(1, 4, 30, 26, C.ol); p.r(2, 5, 28, 24, '#8a94a8'); p.r(5, 8, 12, 8, '#1a2a3a'); for (let i = 0; i < 4; i++) p.hl(6, 9 + i * 2, 3 + ((i + f) * 5) % 9, '#5af08a'); [['#e84a4a', 22], ['#f8d040', 26]].forEach(([c, x], i) => p.circ(x, 10, 2, (i + f) % 2 ? c : shade(c, .5))); p.r(5, 20, 22, 3, '#5a647a'); }, [2, 1], 16);
}

// =================================================================== PERSONAJES
// Plantillas de 16x24: cabeza (filas 0-13) + pelo + cuerpo (filas 12-23)
const HEAD = {
  down: ['', '', '', '....ssssssss....', '...ssssssssss...', '..ssssssssssss..', '..ssssssssssss..', '..ssssssssssss..', '..ssewssssewss..', '..ssiessssiess..', '..skssssssssks..', '...ssssmmssss...', '....ssssssss....'],
  up: ['', '', '', '....ssssssss....', '...ssssssssss...', '..ssssssssssss..', '..ssssssssssss..', '..ssssssssssss..', '..ssssssssssss..', '..ssssssssssss..', '..ssssssssssss..', '...ssssssssss...', '....ssssssss....'],
  side: ['', '', '', '.....sssssss....', '....sssssssss...', '...sssssssssss..', '...sssssssssss..', '..ssssssssssss..', '..sewsssssssss..', '..siesssssssss..', '.sskssssssssss..', '..ssmsssssssss..', '...ssssssssss...']
};
const HAIR = {
  long: {
    down: ['', '', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '.hhhLhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhh.hh.hh.hhhh.', '.hh..........hh.', '.hh..........hh.', '.hh..........hh.', '.hH..........Hh.', '.hH..........Hh.', '.hH..........Hh.', '..H..........H..'],
    up: ['', '', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhhLLhhhhhh..', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hHhhhhhhhhhhHh.', '..hHhhhhhhhhHh..', '...HHhhhhhhHH...', '.....HHHHHH.....'],
    side: ['', '', '......hhhhhh....', '....hhhhhhhhh...', '...hhLLhhhhhhh..', '..hhhhhhhhhhhhh.', '..hhhhhhhhhhhhh.', '..h.hh.hhhhhhhh.', '......hhhhhhhhh.', '.......hhhhhhhh.', '.......hhhhhhhh.', '........hhhhhhh.', '........hhhhhhh.', '.........hhhhhh.', '..........hHhh..', '...........HH...']
  },
  bob: {
    down: ['', '', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhh.hhhhhh.hhh.', '.hh..........hh.', '.hh..........hh.', '.hH..........Hh.', '..H..........H..'],
    up: ['', '', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhhLLhhhhhh..', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hhhhhhhhhhhhhh.', '.hHhhhhhhhhhhHh.', '..HHhhhhhhhhHH..'],
    side: ['', '', '......hhhhhh....', '....hhhhhhhhh...', '...hhLLhhhhhhh..', '..hhhhhhhhhhhhh.', '..hhhhhhhhhhhhh.', '..h.hhhhhhhhhhh.', '......hhhhhhhhh.', '.......hhhhhhhh.', '........hhhhhhh.', '.........hHHhh..']
  },
  short: {
    down: ['', '', '....hhhhhhhh....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hh.hh..hh.hh..', '..h..........h..'],
    up: ['', '', '....hhhhhhhh....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hHhhhhhhhhHh..', '...HhhhhhhhhH...'],
    side: ['', '', '.....hhhhhhh....', '....hhhhhhhhh...', '...hhLLhhhhhhh..', '...hhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..h.hhhhhhhhhh..', '.......hhhhhhh..', '........hhhhhh..', '.........hhhhh..', '..........hhh...']
  },
  messy: {
    down: ['', '...h..h..h..h...', '...hhhhhhhhhhh..', '..hhhhhhhhhhhhh.', '.hhhLLhhhhhhhhh.', '..hhhhhhhhhhhh..', '.hhhhhhhhhhhhhh.', '..hh.h.hh.h.hh..', '..h..........h..', '..h..........h..', '..h..........h..'],
    up: ['', '...h..h..h..h...', '...hhhhhhhhhhh..', '..hhhhhhhhhhhhh.', '.hhhhLLhhhhhhhh.', '..hhhhhhhhhhhh..', '.hhhhhhhhhhhhhh.', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hHhhhhhhhhHh..', '...HhhhhhhhhH...'],
    side: ['', '....h..h..h.....', '.....hhhhhhhh...', '....hhhhhhhhhh..', '...hhLLhhhhhhhh.', '...hhhhhhhhhhh..', '..hhhhhhhhhhhhh.', '..h.h.hhhhhhhh..', '.......hhhhhhh..', '.......h.hhhhh..', '.......h..hhhh..', '..........hhh...']
  },
  wig: {
    down: ['', '......hhhh......', '....hhhhhhhh....', '...hhhhhhhhhh...', '..hhhLLLhhhhhh..', '..hhhhhhhhhhhh..', '..hh........hh..', '.hhhh......hhhh.', '.hLhh......hhLh.', '.hhhH......Hhhh.', '.hHh........hHh.', '..h..........h..'],
    up: ['', '......hhhh......', '....hhhhhhhh....', '...hhhhhhhhhh...', '..hhhhLLLhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '.hhhhhhhhhhhhhh.', '.hLhhhhhhhhhhLh.', '.hhhhhhhhhhhhhh.', '.hHhhhhhhhhhhHh.', '..h...hhhh...h..', '......aaaa......', '.......aa.......', '.......hh.......', '.......hh.......'],
    side: ['', '.......hhhh.....', '.....hhhhhhhh...', '....hhhhhhhhhh..', '...hhLLLhhhhhh..', '...hhhhhhhhhhh..', '...h....hhhhhh..', '.......hhhhhhhh.', '.......hLhhhhhh.', '.......hhhHhhaa.', '........hHh..hh.', '.............hh.', '.............hh.']
  },
  bun: {
    down: ['......hhhh......', '.....hhLhhh.....', '......hhhh......', '....hhhhhhhh....', '...hhhLLhhhhh...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhh......hhh..', '..hh........hh..', '..h..........h..'],
    up: ['......hhhh......', '.....hhLhhh.....', '......hhhh......', '....hhhhhhhh....', '...hhhLLhhhhh...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '...hHhhhhhhHh...', '....HHHHHHHH....'],
    side: ['.........hhhh...', '........hhLhhh..', '.........hhhh...', '.....hhhhhhhh...', '....hhLLhhhhhh..', '...hhhhhhhhhhh..', '...hhhhhhhhhhh..', '..h.hhhhhhhhhh..', '.......hhhhhhh..', '........hhhhh...', '.........hhhh...']
  },
  bigbun: {
    down: ['..hhhh....hhhh..', '.hhLhhhhhhhhhhh.', '..hhhhhhhhhhhh..', '...hhhhhhhhhh...', '...hhhLLhhhhh...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhh......hhh..', '..hh........hh..', '..h..........h..'],
    up: ['..hhhh....hhhh..', '.hhLhhhhhhhhhhh.', '..hhhhhhhhhhhh..', '...hhhhhhhhhh...', '...hhhLLhhhhh...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '...hHhhhhhhHh...'],
    side: ['......hhhhhhh...', '.....hhLhhhhhh..', '......hhhhhhh...', '.....hhhhhhhh...', '....hhLLhhhhhh..', '...hhhhhhhhhhh..', '...hhhhhhhhhhh..', '..h.hhhhhhhhhh..', '.......hhhhhhh..', '........hhhhh...']
  },
  curly: {
    down: ['', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhh......hhh..', '.hhh........hhh.', '.hH..........Hh.', '.hh..........hh.', '.Hh..........hH.', '.hH..........Hh.', '..h..........h..'],
    up: ['', '.....hhhhhh.....', '...hhhhhhhhhh...', '..hhhLLhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '.hhhhhhhhhhhhhh.', '.hHhhhhhhhhhhHh.', '.hhhhhhhhhhhhhh.', '.HhhhhhhhhhhhhH.', '.hHhhhhhhhhhhHh.', '..hh.hh..hh.hh..'],
    side: ['', '......hhhhhh....', '....hhhhhhhhh...', '...hhLLhhhhhhh..', '...hhhhhhhhhhh..', '...hhhhhhhhhhh..', '..h.hhhhhhhhhh..', '.......hhhhhhhh.', '.......hHhhhhHh.', '........hhhhhhh.', '........HhhhhhH.', '.........hHhhh..']
  },
  veil: {
    down: ['', '.....vvvvvv.....', '...vvvvvvvvvv...', '..vvvvvvvvvvvv..', '.vvvhhhhhhhhvvv.', '.vvhhhhhhhhhhvv.', '.vvhhhh..hhhhvv.', '.vvhh......hhvv.', '.vvh........hvv.', '.vv..........vv.', '.vv..........vv.', '.vv..........vv.', '.vV..........Vv.', '.vV..........Vv.', '..V..........V..'],
    up: ['', '.....vvvvvv.....', '...vvvvvvvvvv...', '..vvvvvvvvvvvv..', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vvvvvvvvvvvvvv.', '.vVvvvvvvvvvvVv.', '..VVvvvvvvvvVV..', '...VVVVVVVVVV...'],
    side: ['', '......vvvvvv....', '....vvvvvvvvv...', '...vvvvvvvvvvv..', '..vhhhhvvvvvvvv.', '..vhhhhhvvvvvvv.', '..vh.hhhvvvvvvv.', '..v....hvvvvvvv.', '.......vvvvvvvv.', '.......vvvvvvvv.', '.......vvvvvvvv.', '.......vvvvvvvv.', '.......vVvvvvvv.', '........VVvvvVV.', '..........VVVV..']
  },
  hat: { // sombrero de ala ancha (chupalla) — color 'a'
    down: ['', '', '.....aaaaaa.....', '....aaaaaaaa....', '....aaaaaaaa....', '....AAAAAAAA....', '.aaaaaaaaaaaaaa.', '..aaaaaaaaaaaa..', '..h..........h..'],
    up: ['', '', '.....aaaaaa.....', '....aaaaaaaa....', '....aaaaaaaa....', '....AAAAAAAA....', '.aaaaaaaaaaaaaa.', '..aaaaaaaaaaaa..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hHhhhhhhhhHh..', '...HhhhhhhhhH...'],
    side: ['', '', '......aaaaaa....', '.....aaaaaaaa...', '.....aaaaaaaa...', '.....AAAAAAAA...', '.aaaaaaaaaaaaaa.', '..aaaaaaaaaaaa..', '.......hhhhhhh..', '........hhhhhh..', '.........hhhhh..']
  },
  shako: { // gorro militar alto
    down: ['....aaaaaaaa....', '....aaaaaaaa....', '....aaaxxaaa....', '....aaaxxaaa....', '....aaaaaaaa....', '...AAAAAAAAAA...', '...AAAAAAAAAA...', '..hhh......hhh..', '..h..........h..'],
    up: ['....aaaaaaaa....', '....aaaaaaaa....', '....aaaaaaaa....', '....aaaaaaaa....', '....aaaaaaaa....', '...aaaaaaaaaa...', '...aaaaaaaaaa...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hHhhhhhhhhHh..', '...HhhhhhhhhH...'],
    side: ['.....aaaaaaaa...', '.....aaaaaaaa...', '.....aaxxaaaa...', '.....aaxxaaaa...', '.....aaaaaaaa...', '..AAAAAAAAAAA...', '....AAAAAAAAA...', '..h.hhhhhhhhhh..', '.......hhhhhhh..', '........hhhhhh..', '.........hhhhh..']
  },
  tio: { // sombrero que tapa la cara: nunca se le ven los ojos
    down: ['', '.....aaaaaa.....', '....aaaaaaaa....', '....aaaaaaaa....', '....aaaaaaaa....', '....AAAAAAAA....', '....AAAAAAAA....', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '..AAAAAAAAAAAA..', '..h..........h..'],
    up: ['', '.....aaaaaa.....', '....aaaaaaaa....', '....aaaaaaaa....', '....aaaaaaaa....', '....AAAAAAAA....', '....AAAAAAAA....', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '...hhhhhhhhhh...'],
    side: ['', '......aaaaaa....', '.....aaaaaaaa...', '.....aaaaaaaa...', '.....aaaaaaaa...', '.....AAAAAAAA...', '.....AAAAAAAA...', 'aaaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '...AAAAhhhhhhh..', '........hhhhhh..']
  },
  hood: { // capucha de fraile
    down: ['', '....aaaaaaaa....', '...aaaaaaaaaa...', '..aaaaaaaaaaaa..', '..aaaaaaaaaaaa..', '.aaaa......aaaa.', '.aaa........aaa.', '.aa..........aa.', '.aa..........aa.', '.aa..........aa.', '.aA..........Aa.', '..A..........A..'],
    up: ['', '....aaaaaaaa....', '...aaaaaaaaaa...', '..aaaaaaaaaaaa..', '..aaaaaaaaaaaa..', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaa.', '.aAaaaaaaaaaaAa.', '..AAAAAAAAAAAA..'],
    side: ['', '.....aaaaaaaa...', '....aaaaaaaaaa..', '...aaaaaaaaaaa..', '...aaaaaaaaaaaa.', '..aa....aaaaaaa.', '..a......aaaaaa.', '.........aaaaaa.', '.........aaaaaa.', '.........aaaaaa.', '.........aAaaaa.', '..........AAAA..']
  },
  bald: {
    down: ['', '', '', '....hhhhhhhh....', '...h........h...', '..h..........h..', '..h..........h..', '..h..........h..'],
    up: ['', '', '', '....ssssssss....', '...ssssssssss...', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '..hhhhhhhhhhhh..', '...hhhhhhhhhh...'],
    side: ['', '', '', '.....sssssss....', '....sssssssss...', '...ssssshhhhh...', '..sssssshhhhhh..', '..ssssssshhhhh..', '........hhhhhh..', '........hhhhh...']
  }
};
const BODY = {
  coat: {
    down: ['....cccwwccc....', '...cccxwwxccc...', '..cCccxwwxccCc..', '..cCcccxxcccCc..', '..sCcccxxcccCs..', '...ccccxxcccc...', '...cccccccccc...', '...pppppppppp...', '...pppp..pppp...', '...pPpp..ppPp...', '...ffff..ffff...'],
    up: ['....cccccccc....', '...cccccccccc...', '..cCccccccccCc..', '..cCccccccccCc..', '..sCccccccccCs..', '...ccccCCcccc...', '...cccc..cccc...', '...pppppppppp...', '...pppp..pppp...', '...pPpp..ppPp...', '...ffff..ffff...'],
    side: ['.....cccwcc.....', '....cccwcccc....', '....ccwccccc....', '....cCcccccc....', '....sCcccccc....', '.....ccccccc....', '.....cccccccc...', '.....pppppp.....', '.....pppppp.....', '.....pPppPp.....', '....ffff.ff.....'],
    sideStride: ['.....pppppp.....', '....ppp..ppp....', '...ppp....ppp...', '..fff......fff..']
  },
  dress: {
    down: ['....cccwwccc....', '...cccccccccc...', '..cCccccccccCc..', '..sCcxxxxxxcCs..', '...pppppppppp...', '..pppppppppppp..', '..pppppppppppp..', '.pppppppppppppp.', '.ppPppppppppPpp.', '.pppppppppppppp.', '..PPPPPPPPPPPP..', '....ff....ff....'],
    up: ['....cccccccc....', '...cccccccccc...', '..cCccccccccCc..', '..sCcxxxxxxcCs..', '...pppppppppp...', '..pppppppppppp..', '..pppppppppppp..', '.pppppppppppppp.', '.ppPppppppppPpp.', '.pppppppppppppp.', '..PPPPPPPPPPPP..', '....ff....ff....'],
    side: ['.....ccccccc....', '....cccccccc....', '....cCcccccc....', '....sxxxxxxx....', '....ppppppppp...', '...pppppppppp...', '...ppppppppppp..', '..pppppppppppp..', '..ppPppppppPpp..', '..pppppppppppp..', '...PPPPPPPPPP...', '...ff.....ff....']
  },
  kid: {
    down: ['....cccccccc....', '...cccyccyccc...', '..cCccccccccCc..', '..sCcycccyccCs..', '...cccccccccc...', '..ccyccccccycc..', '..cCcccyccccCc..', '...CCCCCCCCCC...', '....ss....ss....', '....ss....ss....', '...fff....fff...'],
    up: ['....cccccccc....', '...cccccccccc...', '..cCccyccyccCc..', '..sCccccccccCs..', '...cccycccccc...', '..cccccccyccc...', '..cCcyccccccCc..', '...CCCCCCCCCC...', '....ss....ss....', '....ss....ss....', '...fff....fff...'],
    side: ['.....cccccc.....', '....ccycccyc....', '....cCcccccc....', '....sCccyccc....', '.....ccccccc....', '....ccccyccc....', '....cccccccyc...', '....CCCCCCCCC...', '.....ss..ss.....', '.....ss..ss.....', '....fff.fff.....'],
    sideStride: ['....CCCCCCCCC...', '....ss....ss....', '...ss......ss...', '..fff......fff..']
  },
  robe: { // hábito largo (fraile) / capa larga
    down: ['....cccccccc....', '...cccccccccc...', '..cCccccccccCc..', '..sCccxxxxccCs..', '...cccccccccc...', '..cccccccccccc..', '..cccccccccccc..', '..cCccccccccCc..', '..cCccccccccCc..', '..CCCCCCCCCCCC..', '...ff......ff...'],
    up: ['....cccccccc....', '...cccccccccc...', '..cCccccccccCc..', '..sCccccccccCs..', '...cccccccccc...', '..cccccccccccc..', '..cccccccccccc..', '..cCccccccccCc..', '..cCccccccccCc..', '..CCCCCCCCCCCC..', '...ff......ff...'],
    side: ['.....ccccccc....', '....cccccccc....', '....cCcccccc....', '....sxxxxccc....', '....cccccccc....', '....ccccccccc...', '...cccccccccc...', '...cCccccccCc...', '...cCccccccCc...', '...CCCCCCCCCC...', '...ff.....ff....']
  },
  toddler: {
    down: ['....cccccccc....', '...sccccccccs...', '....cccccccc....', '....pppppppp....', '....ppp..ppp....', '....fff..fff....'],
    up: ['....cccccccc....', '...sccccccccs...', '....cccccccc....', '....pppppppp....', '....ppp..ppp....', '....fff..fff....'],
    side: ['.....cccccc.....', '....scccccc.....', '.....cccccc.....', '.....pppppp.....', '.....pp..pp.....', '....fff.fff.....']
  }
};
const DOG = {
  down: ['', '', '', '', '', '', '', '', '', '.....bbbbbb.....', '....bbbwwbbb....', '..BBbebwwbebBB..', '..BBbbwwwwbbBB..', '..BB.wwnnww.BB..', '..B..wwwwww..B..', '.....aaaaaa.....', '....wwwwwwww....', '...wbbwwwwkkw...', '...wbbwwwwkkw...', '...wwwwwwwwww...', '....ww....ww....', '....ww....ww....', '....WW....WW....'],
  up: ['', '', '', '', '', '', '', '', '', '.....bbbbbb.....', '....bbbbbbbb....', '..BBbbbbbbbbBB..', '..BBbbbbbbbbBB..', '..BB.bbbbbb.BB..', '..B..aaaaaa..B..', '....kkkkkkkk....', '...wkkkkkkkkw...', '...wkkkkkkkkw...', '...wwbbbbbbww...', '...wwwwwwwwww...', '....ww.ww.ww....', '....ww....ww....', '....WW....WW....'],
  side: ['', '', '', '', '', '', '', '', '', '', '', '..bbbb..........', '.bbebbB.........', 'nwwbbbBB......w.', '.wwwbbBB.....ww.', '..aaaakkkkkkkw..', '...wwkkkkkkkww..', '...wwwbbbbwwww..', '...wwwwwwwwwww..', '...ww.ww..ww.ww.', '...ww.ww..ww.ww.', '...WW.WW..WW.WW.'],
  sideStride: ['...ww..ww.ww..ww', '..ww...ww.ww...w', '..WW...WW.WW...W']
};

function legShift(rows, half, start) {
  const out = rows.slice();
  const n = out.length;
  for (let r = start; r < n; r++) {
    const next = r + 1 < n ? out[r + 1] : '................';
    const cur = out[r];
    let s = '';
    for (let x = 0; x < 16; x++) {
      const inHalf = half === 'L' ? x < 8 : x >= 8;
      s += inHalf ? (next[x] || '.') : (cur[x] || '.');
    }
    out[r] = s;
  }
  return out;
}
function makeCharacter(cfg) {
  // cfg: {hair:[h,H,L], style, skin, iris, top:[c,C,x], low:[p,P], shoes, acc:[a,A], veil:[v,V], body, extras:{}, y:'y' accent}
  const skin = cfg.skin || '#f6d3b5';
  const pal = {
    s: skin, S: shade(skin, 0.85), k: '#f4a0a0', e: '#2b2340', w: '#ffffff', i: cfg.iris || '#7a4a2a', m: '#b0404a',
    h: cfg.hair[0], H: cfg.hair[1] || shade(cfg.hair[0], 0.75), L: cfg.hair[2] || shade(cfg.hair[0], 1.25),
    c: cfg.top[0], C: cfg.top[1] || shade(cfg.top[0], 0.78), x: cfg.top[2] || '#e8c050', y: cfg.ycol || '#fff3e0',
    p: (cfg.low || cfg.top)[0], P: (cfg.low || cfg.top)[1] || shade((cfg.low || cfg.top)[0], 0.78), f: cfg.shoes || '#3a2a2a',
    a: (cfg.acc || ['#e0c070'])[0], A: (cfg.acc || ['#e0c070', '#a88a40'])[1] || shade((cfg.acc || ['#e0c070'])[0], 0.7),
    v: (cfg.veil || ['#a8a2a0'])[0], V: (cfg.veil || ['#a8a2a0', '#88827f'])[1] || '#88827f'
  };
  const body = BODY[cfg.body || 'coat'];
  const hair = HAIR[cfg.style || 'short'];
  const dirs = ['down', 'up', 'left', 'right'];
  const sheet = mkCanvas(16 * 3, 24 * 4);
  const sctx = sheet.getContext('2d');
  const yoff = cfg.body === 'toddler' ? 5 : 0;
  dirs.forEach((dir, di) => {
    const d = dir === 'left' || dir === 'right' ? 'side' : dir;
    for (let fr = 0; fr < 3; fr++) {
      const grid = Array.from({ length: 24 }, () => Array(16).fill(null));
      const paint = (rows, oy = 0) => rows.forEach((row, ry) => { const yy = ry + oy; if (yy < 0 || yy > 23) return; for (let x = 0; x < 16; x++) { const k = row[x]; if (k && k !== '.' && pal[k]) grid[yy][x] = pal[k]; } });
      // cuerpo + piernas animadas
      let brows = body[d].slice();
      const legStart = cfg.body === 'dress' ? 11 : cfg.body === 'toddler' ? 4 : cfg.body === 'robe' ? 10 : 8;
      if (fr > 0) {
        if (d === 'side' && body.sideStride && fr === 1) { const s = body.sideStride; brows = brows.slice(0, brows.length - s.length).concat(s); }
        else if (d !== 'side') {
          if (cfg.body === 'dress' || cfg.body === 'robe') { const last = brows.length - 1; brows[last] = fr === 1 ? (cfg.body === 'robe' ? '...ff...........' : '....ff..........') : (cfg.body === 'robe' ? '...........ff...' : '..........ff....'); }
          else brows = legShift(brows, fr === 1 ? 'R' : 'L', legStart);
        }
      }
      const bob = (fr > 0 && d !== 'side') ? 0 : 0;
      // pelo detrás (largo, vista frontal) se pinta antes del cuerpo
      paint(brows, 12 + yoff);
      paint(HEAD[d], yoff + bob);
      // pelo / sombreros
      paint(hair[d] || [], yoff + bob);
      // extras
      const ex = cfg.extras || {};
      const put = (x, y, c) => { if (y + yoff >= 0 && y + yoff < 24 && x >= 0 && x < 16) grid[y + yoff][x] = c; };
      if (ex.mustache && d === 'down') { [6, 7, 8, 9].forEach(x => put(x, 11, ex.mustache)); put(5, 11, ex.mustache); put(10, 11, ex.mustache); }
      if (ex.mustache && d === 'side') { [2, 3, 4, 5].forEach(x => put(x, 11, ex.mustache)); }
      if (ex.sideburns && d === 'down') { [8, 9, 10].forEach(y => { put(2, y, pal.h); put(13, y, pal.h); }); }
      if (ex.sideburns && d === 'side') { [8, 9, 10].forEach(y => { put(7, y, pal.h); put(8, y, pal.h); }); }
      if (ex.sash && d === 'down') { for (let k = 0; k < 6; k++) { const c = ex.sash === 'tricolor' ? ['#2a5ab8', '#ffffff', '#d52b1e'][k % 3] : ex.sash; put(4 + k, 13 + k, c); put(5 + k, 13 + k, c); } }
      if (ex.sash && d === 'up') { for (let k = 0; k < 6; k++) { const c = ex.sash === 'tricolor' ? ['#2a5ab8', '#ffffff', '#d52b1e'][k % 3] : ex.sash; put(11 - k, 13 + k, c); } }
      if (ex.epaulettes && d !== 'side') { put(2, 13, '#e8c050'); put(3, 13, '#e8c050'); put(12, 13, '#e8c050'); put(13, 13, '#e8c050'); }
      if (ex.epaulettes && d === 'side') { put(6, 13, '#e8c050'); put(7, 13, '#e8c050'); }
      if (ex.cape) { const cc = ex.cape; if (d === 'up') { for (let y = 13; y < 21; y++) for (let x = 2; x < 14; x++) if (grid[y + yoff][x] || y < 20) put(x, y, y === 20 ? shade(cc, .7) : cc); } if (d === 'side') { for (let y = 13; y < 21; y++) for (let x = 9; x < 13 + (y > 16 ? 1 : 0); x++) put(x, y, cc); } if (d === 'down') { for (let y = 13; y < 20; y++) { put(2, y, cc); put(13, y, cc); } } }
      if (ex.collar && d === 'down') { put(6, 12, ex.collar); put(7, 12, ex.collar); put(8, 12, ex.collar); put(9, 12, ex.collar); }
      if (ex.bracelet && d === 'down') { put(13, 16, ex.bracelet); }
      if (ex.briefcase && (d === 'down' || d === 'side')) { const bx = d === 'down' ? 12 : 5; for (let y = 17; y < 21; y++) for (let x = bx; x < bx + 4; x++) put(x, y, y === 17 ? '#3a2418' : '#6a4428'); put(bx + 1, 16, '#3a2418'); put(bx + 2, 16, '#3a2418'); }
      if (ex.book && d === 'down') { for (let y = 16; y < 19; y++) for (let x = 11; x < 15; x++) put(x, y, y === 16 ? '#f4ecd8' : '#8a2a30'); }
      if (ex.apron && d === 'down') { for (let y = 15; y < 21; y++) for (let x = 5; x < 11; x++) put(x, y, '#f4f0e8'); }
      if (ex.labcoat) { const lc = '#f4f6f8'; if (d === 'down') { for (let y = 12; y < 22; y++) { put(3, y, lc); put(4, y, lc); put(11, y, lc); put(12, y, lc); } } if (d === 'up') { for (let y = 12; y < 22; y++) for (let x = 3; x < 13; x++) put(x, y, y > 20 ? '#d8dce4' : lc); } if (d === 'side') { for (let y = 12; y < 22; y++) for (let x = 6; x < 12; x++) put(x, y, lc); } }
      if (ex.guitar && d === 'down') { for (let y = 15; y < 21; y++) for (let x = 2; x < 8; x++) if ((x - 4.5) ** 2 / 9 + (y - 18) ** 2 / 9 < 1) put(x, y, '#c88a40'); put(4, 18, '#3a2418'); for (let k = 0; k < 6; k++) put(7 + k, 16 - Math.floor(k / 2), '#7a4a28'); }
      // contorno automático (selout)
      const out = grid.map(r => r.slice());
      for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
        if (grid[y][x]) continue;
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (grid[y + dy] || [])[x + dx]).filter(Boolean);
        if (nb.length) out[y][x] = mix(nb[0], '#1e1424', 0.72);
      }
      // dibujar (espejo para la derecha)
      for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) {
        const c = out[y][x]; if (!c) continue;
        const xx = dir === 'right' ? 15 - x : x;
        sctx.fillStyle = c; sctx.fillRect(fr * 16 + xx, di * 24 + y, 1, 1);
      }
    }
  });
  return sheet;
}
function makeDog(cfg = {}) {
  const pal = { b: cfg.b || '#d98c3e', B: cfg.B || '#8a5226', w: '#f6f2ea', W: '#cfc8bc', k: '#3a3030', e: '#1e1424', n: '#1e1424', a: cfg.collar || '#3ec1c9' };
  const sheet = mkCanvas(48, 96), sctx = sheet.getContext('2d');
  ['down', 'up', 'left', 'right'].forEach((dir, di) => {
    const d = dir === 'left' || dir === 'right' ? 'side' : dir;
    for (let fr = 0; fr < 3; fr++) {
      const grid = Array.from({ length: 24 }, () => Array(16).fill(null));
      let rows = DOG[d].slice();
      while (rows.length < 23) rows.push('');
      if (fr > 0) { if (d === 'side' && fr === 1) { rows = rows.slice(0, rows.length - 3).concat(DOG.sideStride); } else if (d !== 'side') rows = legShift(rows, fr === 1 ? 'R' : 'L', 20); }
      rows.forEach((row, y) => { for (let x = 0; x < 16; x++) { const k = row[x]; if (k && k !== '.' && pal[k]) grid[y + 1] && (grid[y + 1][x] = pal[k]); } });
      const out = grid.map(r => r.slice());
      for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) { if (grid[y][x]) continue; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (grid[y + dy] || [])[x + dx]).filter(Boolean); if (nb.length) out[y][x] = mix(nb[0], '#1e1424', 0.72); }
      for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) { const c = out[y][x]; if (!c) continue; const xx = dir === 'right' ? 15 - x : x; sctx.fillStyle = c; sctx.fillRect(fr * 16 + xx, di * 24 + y, 1, 1); }
    }
  });
  return sheet;
}
function makeHorse(col = '#f4f2ee', mane = '#c8c4bc', rider = null) {
  // caballo de perfil 32x32 (mirando a la izquierda) — una hoja de 2 cuadros
  const sheet = mkCanvas(64, 32), ctx = sheet.getContext('2d');
  for (let f = 0; f < 2; f++) {
    const c = mkCanvas(32, 32), p = P(c.getContext('2d'));
    const dk = shade(col, 0.8);
    p.r(8, 12, 18, 9, col); p.r(8, 12, 18, 2, shade(col, 1.08)); p.r(4, 6, 6, 10, col); p.r(1, 5, 6, 5, col); p.px(3, 7, '#1e1424'); p.r(4, 3, 2, 3, col);
    for (let y = 4; y < 14; y++) p.px(9 - Math.floor(y / 4), y, mane);
    p.r(25, 13, 3, 9, mane); p.r(27, 18, 2, 6, mane);
    const legs = f ? [[9, 21, 1], [12, 21, 0], [21, 21, 0], [24, 21, 1]] : [[9, 21, 0], [12, 21, 1], [21, 21, 1], [24, 21, 0]];
    legs.forEach(([x, y, o]) => { p.r(x + o, y, 2, 7, dk); p.r(x + o, y + 6, 2, 2, '#4a3a30'); });
    if (rider) { p.r(12, 4, 8, 9, rider.coat); p.r(13, 0, 6, 5, rider.skin || '#f6d3b5'); p.r(12, -1, 8, 3, rider.hair); p.r(12, 1, 2, 4, rider.hair); p.r(19, 5, 6, 10, rider.cape); p.r(14, 12, 3, 6, rider.boot || '#2a2226'); }
    // contorno
    const id = c.getContext('2d').getImageData(0, 0, 32, 32); const d = id.data; const o = c.getContext('2d').createImageData(32, 32); o.data.set(d);
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const i = (y * 32 + x) * 4; if (d[i + 3]) continue; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < 32 && yy < 32 && d[((yy * 32 + xx) * 4) + 3]; }); if (nb) { o.data[i] = 30; o.data[i + 1] = 20; o.data[i + 2] = 36; o.data[i + 3] = 255; } }
    c.getContext('2d').putImageData(o, 0, 0);
    ctx.drawImage(c, f * 32, 0);
  }
  return sheet;
}
function makeBat() { const sheet = mkCanvas(32, 16), p = P(sheet.getContext('2d')); [0, 1].forEach(f => { const o = f * 16; p.ell(o + 8, 8, 2, 2, '#3a2a4a'); if (f) { p.r(o + 2, 5, 5, 2, '#4a3a5a'); p.r(o + 10, 5, 5, 2, '#4a3a5a'); } else { p.r(o + 2, 8, 5, 2, '#4a3a5a'); p.r(o + 10, 8, 5, 2, '#4a3a5a'); } p.px(o + 7, 7, '#ff6060'); p.px(o + 9, 7, '#ff6060'); }); return sheet; }

// Reparto (colores tomados de los dibujos de Rafael Fernández)
const CAST = {
  mg_casa: { style: 'long', hair: ['#c9a77a', '#9c7a52', '#e6cc9e'], iris: '#6d8db4', body: 'kid', top: ['#f2a7b5', '#d98898'], ycol: '#fff3e0', shoes: '#f2cf3a', extras: { bracelet: '#3ec1c9' } },
  mg: { style: 'long', hair: ['#c9a77a', '#9c7a52', '#e6cc9e'], iris: '#6d8db4', body: 'kid', top: ['#9a6a44', '#7a5034'], ycol: '#a87a52', shoes: '#f2cf3a', extras: { bracelet: '#3ec1c9' } },
  mg_espia: { style: 'long', hair: ['#c9a77a', '#9c7a52', '#e6cc9e'], iris: '#6d8db4', body: 'kid', top: ['#9a6a44', '#7a5034'], ycol: '#a87a52', shoes: '#f2cf3a', extras: { cape: '#24222c', bracelet: '#3ec1c9' } },
  max: { style: 'short', hair: ['#1e1a20', '#121014', '#3a3440'], iris: '#6d8db4', body: 'toddler', top: ['#5a9ae0'], low: ['#3a5a9a'], shoes: '#e84a4a' },
  mama: { style: 'bob', hair: ['#7a5236', '#5a3a24'], body: 'coat', top: ['#7ab0d8'], low: ['#4a5a7a'], shoes: '#3a3a4a', extras: { labcoat: true } },
  papa: { style: 'short', hair: ['#5a4030', '#3a2a20'], body: 'coat', top: ['#5a8a5a', '#466e46', '#ffffff'], low: ['#4a4a5a'], shoes: '#2a2a2a' },
  tio: { style: 'tio', hair: ['#6a6a70'], body: 'coat', top: ['#5a5e6a', '#464a56', '#ffffff'], low: ['#3a3e4a'], acc: ['#3a3438', '#262024'], shoes: '#1e1a1a', extras: { briefcase: true } },
  mateo: { style: 'wig', hair: ['#f4f4f0', '#c8c8c4', '#ffffff'], body: 'coat', top: ['#2a3566', '#1e2850', '#ffffff'], low: ['#2a3566'], acc: ['#2a2226'], shoes: '#1e1a1a', extras: { collar: '#c8412f' } },
  salas: { style: 'short', hair: ['#2b2b33', '#1a1a20'], body: 'coat', top: ['#8c6a48', '#6e5236', '#f4f0e8'], low: ['#b08a62'], shoes: '#2a1e1a', extras: { book: true } },
  javiera: { style: 'veil', hair: ['#5a3a28', '#3e281c'], veil: ['#a8a2a0', '#88827f'], body: 'dress', top: ['#e8704f', '#c85a3c'], low: ['#e8704f', '#c85a3c'], shoes: '#7a3a2a' },
  jmcarrera: { style: 'short', hair: ['#6b4430', '#4e3020'], body: 'coat', top: ['#2f6a3d', '#245230', '#e9c14a'], low: ['#2a4a30'], shoes: '#1e1a1a', extras: { epaulettes: true } },
  paula: { style: 'bigbun', hair: ['#4a3326', '#33231a'], body: 'dress', top: ['#3fa04f', '#2f803d', '#4a6fb5'], low: ['#3fa04f', '#2f803d'], shoes: '#3a2a2a' },
  rodriguez: { style: 'short', hair: ['#1e1e24', '#121216'], body: 'coat', top: ['#26242c', '#18161e', '#e8c050'], low: ['#26242c'], shoes: '#141218', extras: { sideburns: true, epaulettes: true } },
  rodriguez_fraile: { style: 'hood', hair: ['#1e1e24'], acc: ['#7a5a3a', '#5a4028'], body: 'robe', top: ['#7a5a3a', '#5a4028', '#c8b070'], shoes: '#3a2a1a' },
  luisa: { style: 'bun', hair: ['#1e1e24', '#121216', '#3a3a44'], body: 'dress', top: ['#f07a95', '#d06078', '#ffffff'], low: ['#f07a95', '#d06078'], shoes: '#7a2a3a', extras: { guitar: true } },
  luisa_sin: { style: 'bun', hair: ['#1e1e24', '#121216', '#3a3a44'], body: 'dress', top: ['#f07a95', '#d06078', '#ffffff'], low: ['#f07a95', '#d06078'], shoes: '#7a2a3a' },
  ohiggins: { style: 'messy', hair: ['#c8553a', '#9a3a26', '#e87a5a'], iris: '#6d9ad6', body: 'coat', top: ['#22306a', '#18224e', '#c8323a'], low: ['#f2f2ee', '#d4d4cc'], shoes: '#1e1a1a', extras: { sash: 'tricolor', epaulettes: true, sideburns: true } },
  jinete: { style: 'hat', hair: ['#c8553a', '#9a3a26'], acc: ['#2a2a3a', '#1a1a24'], body: 'coat', top: ['#2a4a9a', '#1e3a7a', '#e8c050'], low: ['#f2f2ee'], shoes: '#1e1a1a', extras: { sideburns: true, cape: '#2a4a9a' } },
  cornelia: { style: 'bun', hair: ['#1e1e24', '#121216', '#3a3a44'], body: 'dress', top: ['#f3f1ea', '#d8d4c8', '#c03a3a'], low: ['#f3f1ea', '#d8d4c8'], shoes: '#5a4a4a' },
  freire: { style: 'short', hair: ['#8b8f99', '#6a6e78', '#b4b8c0'], body: 'coat', top: ['#1e2a52', '#141e40', '#e8c050'], low: ['#1e2a52'], shoes: '#141218', extras: { mustache: '#5a5e68', sash: '#7ab0e0', epaulettes: true } },
  agueda: { style: 'curly', hair: ['#4a2e22', '#331e16', '#6a4434'], iris: '#3a8a5a', body: 'dress', top: ['#7a4aa0', '#5e3880', '#8a8a8a'], low: ['#7a4aa0', '#5e3880'], shoes: '#3a2a3a' },
  portales: { style: 'short', hair: ['#1e1e24', '#121216'], body: 'coat', top: ['#22222a', '#16161c', '#f4f4f0'], low: ['#22222a'], shoes: '#141218', extras: { book: true } },
  isabel: { style: 'bun', hair: ['#b8b8c0', '#94949c', '#d8d8e0'], body: 'dress', top: ['#5a4a6a', '#463a54', '#d8d0c0'], low: ['#5a4a6a'], shoes: '#3a2a3a' },
  sanmartin: { style: 'short', hair: ['#2a1e1a', '#1a1210'], skin: '#e8c09a', body: 'coat', top: ['#22306a', '#18224e', '#c8323a'], low: ['#f2f2ee'], shoes: '#1e1a1a', extras: { epaulettes: true } },
  // genéricos
  vecino: { style: 'short', hair: ['#4a3a2a'], body: 'coat', top: ['#7a6a5a', '#5e5044', '#f4f0e8'], low: ['#5a4a3a'], shoes: '#2a1e1a' },
  vecino2: { style: 'bald', hair: ['#8a8a8a'], body: 'coat', top: ['#4a5a7a', '#3a4a64', '#f4f0e8'], low: ['#3a3a4a'], shoes: '#2a1e1a' },
  vecina: { style: 'bun', hair: ['#3a2a20'], body: 'dress', top: ['#6a8ab0', '#54709a', '#f4f0e8'], low: ['#6a8ab0'], shoes: '#3a2a2a' },
  vecina2: { style: 'veil', hair: ['#2a2020'], veil: ['#2a2428', '#1a1418'], body: 'dress', top: ['#3a3438', '#2a2428'], low: ['#3a3438'], shoes: '#2a2020' },
  huaso: { style: 'hat', hair: ['#3a2a1a'], acc: ['#2a2226', '#1a1418'], body: 'coat', top: ['#c8402a', '#a03020', '#f4c430'], low: ['#3a3030'], shoes: '#4a2a1a' },
  vendedora: { style: 'bun', hair: ['#4a3020'], body: 'dress', top: ['#c87a4a', '#a8603a', '#f4f0e8'], low: ['#8a5a3a'], shoes: '#3a2a2a', extras: { apron: true } },
  nino: { style: 'short', hair: ['#3a2a1a'], body: 'coat', top: ['#c8a060', '#a8844a', '#f4f0e8'], low: ['#6a5a4a'], shoes: '#3a2a1a' },
  nina: { style: 'bob', hair: ['#2a1e14'], body: 'kid', top: ['#a8d070', '#88b050'], ycol: '#ffffff', shoes: '#7a3a2a' },
  fraile: { style: 'hood', hair: ['#3a2a1a'], acc: ['#7a5a3a', '#5a4028'], body: 'robe', top: ['#7a5a3a', '#5a4028', '#c8b070'], shoes: '#3a2a1a' },
  guardia: { style: 'shako', hair: ['#3a2a1a'], acc: ['#2a2a3a', '#1a1a24'], body: 'coat', top: ['#2a4a9a', '#1e3a7a', '#e8c050'], low: ['#f2f2ee'], shoes: '#1e1a1a', extras: { epaulettes: true } },
  realista: { style: 'shako', hair: ['#3a2a1a'], acc: ['#c8202a', '#9a1820'], body: 'coat', top: ['#f2f0e8', '#d4d0c4', '#c8202a'], low: ['#2a3a6a'], shoes: '#1e1a1a', extras: { epaulettes: true } },
  patriota: { style: 'shako', hair: ['#3a2a1a'], acc: ['#2a2a3a', '#1a1a24'], body: 'coat', top: ['#2a4a9a', '#1e3a7a', '#e8c050'], low: ['#f2f2ee', '#d0d0c8'], shoes: '#1e1a1a' },
  marino: { style: 'short', hair: ['#5a4030'], body: 'coat', top: ['#f4f4f0', '#d4d4cc', '#2a4a9a'], low: ['#2a4a9a'], shoes: '#1e1a1a' },
  sanbruno: { style: 'hat', hair: ['#1a1414', '#0e0a0a'], acc: ['#1a1418', '#0e0a0e'], body: 'coat', top: ['#7a1a22', '#5a1018', '#e8c050'], low: ['#f2f2ee'], shoes: '#141218', extras: { mustache: '#1a1414', epaulettes: true, cape: '#3a0a12' } },
  osorio: { style: 'short', hair: ['#d8d8d8', '#b0b0b0', '#f0f0f0'], body: 'coat', top: ['#f2f0e8', '#d4d0c4', '#c8202a'], low: ['#2a3a6a'], shoes: '#1e1a1a', extras: { epaulettes: true, sash: '#c8202a', sideburns: true } },
  marco: { style: 'wig', hair: ['#f4f4f0', '#c8c8c4', '#ffffff'], body: 'coat', top: ['#d890c8', '#b070a8', '#ffffff'], low: ['#f2f2ee'], acc: ['#2a2226'], shoes: '#1e1a1a', extras: { collar: '#ffffff', sash: '#e8c050' } },
  espiritu: { style: 'hood', hair: ['#140a10'], acc: ['#4a0a1a', '#2a0610'], body: 'robe', top: ['#4a0a1a', '#2a0610', '#e8c050'], shoes: '#140a10', skin: '#c8b0b8' },
  olvido: { style: 'hood', hair: ['#1a1424'], acc: ['#3a2a5a', '#241a3a'], body: 'robe', top: ['#3a2a5a', '#241a3a', '#8a6ad0'], shoes: '#1a1424', skin: '#b8b0d0' }
};
function buildSprites() {
  for (const [k, cfg] of Object.entries(CAST)) ART.sprites[k] = makeCharacter(cfg);
  ART.sprites.nemo = makeDog();
  ART.sprites.perro2 = makeDog({ b: '#7a5a3a', B: '#4a3020', collar: '#c84040' });
  ART.horse = makeHorse();
  ART.horseBlack = makeHorse('#2a2428', '#141014');
  ART.horseCafe = makeHorse('#9a6a3a', '#5a3a1a');
  ART.jinete = makeHorse('#f4f2ee', '#c8c4bc', { coat: '#2a4a9a', cape: '#2a4a9a', hair: '#c8553a', skin: '#f6d3b5' });
  ART.bat = makeBat();
}

ART.init = function () { buildTiles(); buildProps(); buildSprites(); ART.ready = true; };
