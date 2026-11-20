// =====================================================================
//  GRÁFICOS «ESTILO DS» (una sola pantalla)
//  - Cada cuadro del mundo se dibuja en pixel art (384×256) y se agranda a 768×512
//    con Scale2x, que redondea diagonales y curvas sin borronear.
//  - Sobre la imagen agrandada se pintan, con más detalle: luces, partículas de ambiente,
//    sombra de viñeta y efectos (todo en el doble de resolución).
//  - Los sprites de combate se agrandan 4× con Scale2x doble.
// =====================================================================
'use strict';
const DS = { out: null, amb: [], ambMap: null };
const buf2 = mkCanvas(W * 2, H * 2), bctx2 = buf2.getContext('2d');
let dsImg = null;
function dsOn() { return !(G.settings && G.settings.clasico); }

// Scale2x sobre un Uint32Array (w×h) → destino (2w×2h)
function scale2x(s, w, h, d) {
  const W2 = w * 2;
  for (let y = 0; y < h; y++) {
    const ym = (y > 0 ? y - 1 : y) * w, yy = y * w, yp = (y < h - 1 ? y + 1 : y) * w; let o = y * 2 * W2;
    for (let x = 0; x < w; x++, o += 2) {
      const xm = x > 0 ? x - 1 : x, xp = x < w - 1 ? x + 1 : x;
      const P = s[yy + x], A = s[ym + x], B = s[yy + xp], C = s[yy + xm], D = s[yp + x];
      if (A !== D && C !== B) { d[o] = C === A ? A : P; d[o + 1] = A === B ? B : P; d[o + W2] = D === C ? C : P; d[o + W2 + 1] = B === D ? D : P; }
      else { d[o] = P; d[o + 1] = P; d[o + W2] = P; d[o + W2 + 1] = P; }
    }
  }
}
// agranda el buffer del mundo y devuelve el contexto 2× (con transformación ×2 para seguir dibujando en coordenadas lógicas)
function dsUpscale() {
  const src = bctx.getImageData(0, 0, W, H);
  if (!dsImg) dsImg = bctx2.createImageData(W * 2, H * 2);
  scale2x(new Uint32Array(src.data.buffer), W, H, new Uint32Array(dsImg.data.buffer));
  bctx2.setTransform(1, 0, 0, 1, 0, 0); bctx2.putImageData(dsImg, 0, 0);
  bctx2.setTransform(2, 0, 0, 2, 0, 0); bctx2.imageSmoothingEnabled = true;
  DS.out = buf2;
  return bctx2;
}
// copia agrandada (Scale2x repetido) de un trozo de una hoja de sprites, con caché
const DS_CACHE = {};
function dsSprite(sheet, sx, sy, sw, sh, times = 2) {
  const key = (sheet.__id || (sheet.__id = Math.random().toString(36).slice(2))) + ':' + sx + ':' + sy + ':' + sw + ':' + sh + ':' + times;
  if (DS_CACHE[key]) return DS_CACHE[key];
  let cur = mkCanvas(sw, sh); cur.getContext('2d').drawImage(sheet, sx, sy, sw, sh, 0, 0, sw, sh);
  for (let k = 0; k < times; k++) {
    const w = cur.width, h = cur.height; const id = cur.getContext('2d').getImageData(0, 0, w, h);
    const out = mkCanvas(w * 2, h * 2), ox = out.getContext('2d'); const od = ox.createImageData(w * 2, h * 2);
    scale2x(new Uint32Array(id.data.buffer), w, h, new Uint32Array(od.data.buffer)); ox.putImageData(od, 0, 0); cur = out;
  }
  return (DS_CACHE[key] = cur);
}

// --------------------------------------------------------------- luces
// tipo de prop: [dx, dy, radio, color rgb, parpadeo]
const DS_LIGHTS = {
  lamp: [8, 5, 34, '255,214,140', 3], torch: [8, 4, 38, '255,170,80', 9], campfire: [8, 9, 46, '255,150,60', 7],
  candela: [8, 4, 24, '255,210,140', 6], fireplace: [16, 18, 40, '255,150,70', 5], timemachine: [16, 22, 42, '120,230,255', 2],
  labmachine: [16, 14, 26, '140,255,200', 3]
};
function dsLights(c, cx, cy) {
  const tint = G.tintOverride || G.tint; const dim = G.map.def.dark || tint === 'noche' ? 1 : tint === 'atardecer' || tint === 'reconquista' ? 0.7 : 0.38;
  c.globalCompositeOperation = 'lighter';
  for (const pr of G.props) {
    const L = DS_LIGHTS[pr.type]; if (!L) continue;
    const x = pr.x * 16 + L[0] - cx, y = pr.y * 16 + L[1] - cy; const r = L[2] * (1 + Math.sin(G.t * L[4] + pr.x * 1.7) * 0.05);
    if (x < -r || y < -r || x > W + r || y > H + r) continue;
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${L[3]},${0.42 * dim})`); g.addColorStop(0.45, `rgba(${L[3]},${0.16 * dim})`); g.addColorStop(1, `rgba(${L[3]},0)`);
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const glow = G.ents.filter(e => e.glow && !e.hidden).concat(G.follower && G.follower.glow ? [G.follower] : []);
  for (const e of glow) { const x = e.px + 8 - cx, y = e.py + 6 - cy, r = 26; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(160,240,255,${0.35 * Math.max(dim, 0.6)})`); g.addColorStop(1, 'rgba(160,240,255,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  c.globalCompositeOperation = 'source-over';
}

// --------------------------------------------------------------- partículas de ambiente
function dsAmbKind() {
  const m = G.map; const tint = G.tintOverride || G.tint;
  if (m.def.dark) return 'polvo';
  if (m.def.era === 'monte') return 'paginas';
  if (tint === 'noche') return 'luciernagas';
  if (m.indoor) return 'polvo';
  if (tint === 'reconquista') return 'ceniza';
  if (m.def.era === '1832') return 'brisa';
  return 'polen';
}
function dsAmbient(c, dt) {
  const m = G.map; if (m.indoor === undefined) m.indoor = m.def.rows.join('').includes('T');
  const kind = dsAmbKind();
  if (DS.ambMap !== G.mapId + kind) { DS.ambMap = G.mapId + kind; DS.amb = []; const n = kind === 'polvo' ? 18 : kind === 'paginas' ? 14 : 26; for (let i = 0; i < n; i++) DS.amb.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random(), p: Math.random() * 6.28 }); }
  const t = G.t;
  for (const q of DS.amb) {
    let col, r = 0.7, a = 0.7;
    if (kind === 'polen') { q.x += (8 + q.s * 6) * dt; q.y += Math.sin(t * 1.5 + q.p) * 6 * dt + 2 * dt; col = q.s > 0.6 ? '255,255,230' : '255,240,160'; r = 0.6 + q.s * 0.5; a = 0.55; }
    else if (kind === 'luciernagas') { q.x += Math.sin(t * 0.7 + q.p) * 10 * dt; q.y += Math.cos(t * 0.9 + q.p * 2) * 8 * dt; col = '210,255,120'; r = 0.9; a = Math.max(0, Math.sin(t * 2.3 + q.p * 3)) * 0.9; }
    else if (kind === 'ceniza') { q.x += 4 * dt; q.y += (6 + q.s * 5) * dt; col = '220,220,230'; r = 0.6; a = 0.45; }
    else if (kind === 'brisa') { q.x += (20 + q.s * 14) * dt; q.y += Math.sin(t * 2 + q.p) * 4 * dt; col = '255,255,255'; r = 0.5; a = 0.45; }
    else if (kind === 'paginas') { q.x += Math.sin(t * 0.8 + q.p) * 8 * dt + 4 * dt; q.y -= (5 + q.s * 6) * dt; col = q.s > 0.5 ? '255,230,150' : '250,244,224'; r = 1.1; a = 0.75; }
    else { q.x += Math.sin(t * 0.5 + q.p) * 3 * dt; q.y += Math.cos(t * 0.4 + q.p) * 3 * dt; col = '255,240,200'; r = 0.5; a = 0.35 + Math.sin(t + q.p) * 0.15; }
    if (q.x > W + 4) q.x = -4; if (q.x < -4) q.x = W + 4; if (q.y > H + 4) q.y = -4; if (q.y < -4) q.y = H + 4;
    if (a <= 0.02) continue;
    c.fillStyle = `rgba(${col},${a})`;
    if (kind === 'paginas') { c.save(); c.translate(q.x, q.y); c.rotate(Math.sin(t + q.p)); c.fillRect(-1.6, -1.1, 3.2, 2.2); c.restore(); }
    else { c.beginPath(); c.arc(q.x, q.y, r, 0, 7); c.fill(); }
  }
}

// --------------------------------------------------------------- viñeta
let dsVig = null;
function dsVignette(c) {
  if (!dsVig) { dsVig = mkCanvas(W, H); const x = dsVig.getContext('2d'); const g = x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.72); g.addColorStop(0, 'rgba(10,8,30,0)'); g.addColorStop(1, 'rgba(10,8,30,0.32)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  c.drawImage(dsVig, 0, 0, W, H);
}

// --------------------------------------------------------------- fondos de combate por época
function drawBattleBackdrop(c, o, t) {
  const era = (G.map && G.map.def.era) || '';
  // nubes lentas
  c.fillStyle = o.villain ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 5; i++) { const x = ((i * 97 + t * (6 + i * 2)) % (W + 80)) - 40, y = 14 + i * 11; c.beginPath(); c.ellipse(x, y, 22 + i * 3, 5, 0, 0, 7); c.ellipse(x + 12, y - 3, 12, 4, 0, 0, 7); c.fill(); }
  // cordillera con nieve (exteriores) o sala con columnas (interiores)
  const indoor = G.map && G.map.indoor;
  if (indoor) {
    c.fillStyle = shade(o.sky2 || '#e8f4ff', 0.82);
    for (let x = 10; x < W; x += 54) { c.fillRect(x, 40, 12, 101); c.fillStyle = shade(o.sky2 || '#e8f4ff', 0.9); c.fillRect(x + 2, 40, 3, 101); c.fillStyle = shade(o.sky2 || '#e8f4ff', 0.82); }
    c.fillStyle = shade(o.sky2 || '#e8f4ff', 0.75); c.fillRect(0, 34, W, 8);
  } else {
    const base = 141; c.fillStyle = shade(o.sky2 || '#e8f4ff', 0.72);
    c.beginPath(); c.moveTo(0, base); for (let x = 0; x <= W; x += 16) c.lineTo(x, base - 34 - Math.abs(Math.sin(x * 0.031)) * 30 - Math.sin(x * 0.11) * 6); c.lineTo(W, base); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.75)';
    for (let x = 0; x <= W; x += 16) { const y = base - 34 - Math.abs(Math.sin(x * 0.031)) * 30 - Math.sin(x * 0.11) * 6; if (y < base - 52) { c.beginPath(); c.moveTo(x - 6, y + 7); c.lineTo(x, y); c.lineTo(x + 6, y + 7); c.fill(); } }
    c.fillStyle = shade(o.ground || '#a8d878', 0.86);
    c.beginPath(); c.moveTo(0, base + 2); for (let x = 0; x <= W; x += 24) c.lineTo(x, base - 6 - Math.sin(x * 0.05 + 1) * 5); c.lineTo(W, base + 2); c.fill();
    if (era === '1832') { c.fillStyle = 'rgba(70,130,200,0.55)'; c.fillRect(0, base - 10, W, 12); }
  }
  // pasto que se mueve en el suelo
  c.fillStyle = shade(o.ground || '#a8d878', 0.9);
  for (let i = 0; i < 40; i++) { const x = (i * 37) % W, y = 150 + (i * 23) % 100; c.fillRect(x + Math.round(Math.sin(t * 2 + i) * 1), y, 1, 3); }
  // anillos de luz del jefe
  if (o.villain) { c.strokeStyle = 'rgba(255,120,160,' + (0.25 + Math.sin(t * 3) * 0.1) + ')'; c.lineWidth = 1; c.beginPath(); c.ellipse(286, 112, 66 + Math.sin(t * 2) * 3, 15, 0, 0, 7); c.stroke(); }
}
