// =====================================================================
//  UI: diálogos, elecciones, libro, medallas, duelos, minijuegos, escenas
// =====================================================================
'use strict';
const FONT = (s, b) => `${b ? 'bold ' : ''}${s}px Playtime, "Trebuchet MS", "Segoe UI", sans-serif`;
const COL = { ink: '#2a1e2e', paper: '#fffaf0', blue: '#3a5ab0', blue2: '#6a8ad8', gold: '#e8c050', red: '#c8323a', navy: '#1c2450', parch: '#f4e6c4', parch2: '#e2cc9c', hl: '#c8323a' };
const UI = { layers: [], toasts: [] };
UI.modal = () => UI.layers.length > 0;
UI.update = dt => { const top = UI.layers[UI.layers.length - 1]; if (top && top.update) top.update(dt); UI.toasts = UI.toasts.filter(t => (t.t += dt) < t.dur); };
UI.draw = c => { UI.layers.forEach(l => l.draw && l.draw(c)); drawToasts(c); };
UI.push = layer => new Promise(res => { layer.resolve = v => { UI.layers = UI.layers.filter(l => l !== layer); res(v); }; UI.layers.push(layer); });

function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
function box(c, x, y, w, h, style = 'dialog') {
  const S = { dialog: ['#2a1e2e', '#ffffff', '#6a8ad8', '#e8eeff'], parch: ['#5a3a20', '#f8ecd0', '#c8a060', '#fff6e0'], dark: ['#0e0a18', '#262040', '#8a6ad0', '#322a52'], gold: ['#5a3a10', '#fff4d0', '#e8c050', '#fffae8'], navy: ['#0e1230', '#1c2450', '#e8c050', '#26306a'] }[style];
  c.fillStyle = S[0]; rrect(c, x, y, w, h, 5); c.fill();
  c.fillStyle = S[1]; rrect(c, x + 1.5, y + 1.5, w - 3, h - 3, 4); c.fill();
  c.strokeStyle = S[2]; c.lineWidth = 1.2; rrect(c, x + 3.5, y + 3.5, w - 7, h - 7, 3); c.stroke();
}
// retrato de un hablante
function drawPortrait(c, sp, x, y, s, bg = true) {
  const S = SPEAKERS[sp] || {};
  if (bg) { c.fillStyle = '#2a1e2e'; rrect(c, x - 2, y - 2, s + 4, s + 4, 6); c.fill(); const g = c.createLinearGradient(0, y, 0, y + s); g.addColorStop(0, S.bg || '#bfe0ff'); g.addColorStop(1, shade(S.bg || '#bfe0ff', 0.82)); c.fillStyle = g; rrect(c, x, y, s, s, 5); c.fill(); }
  c.save(); rrect(c, x, y, s, s, 5); c.clip();
  if (S.img && IMG['r_' + S.img]) c.drawImage(IMG['r_' + S.img], x, y, s, s);
  else if (S.sprite && ART.sprites[S.sprite]) { c.imageSmoothingEnabled = false; const sc = s / 15; c.drawImage(ART.sprites[S.sprite], 0, 0, 16, 16, x + (s - 16 * sc) / 2, y + s * 0.06, 16 * sc, 16 * sc); c.imageSmoothingEnabled = true; }
  else if (S.mystery) { c.fillStyle = '#1a1424'; c.beginPath(); c.arc(x + s / 2, y + s * 0.42, s * 0.22, 0, 7); c.fill(); c.fillRect(x + s * 0.2, y + s * 0.66, s * 0.6, s * 0.4); c.fillStyle = '#fff'; c.font = FONT(s * 0.35, 1); c.textAlign = 'center'; c.fillText('?', x + s / 2, y + s * 0.55); c.textAlign = 'left'; }
  c.restore();
}
// texto enriquecido: *palabra* resaltada
function wrapRich(c, text, maxW) {
  const words = []; let hl = false;
  text.split(/(\s+)/).forEach(tok => { if (!tok) return; if (/^\s+$/.test(tok)) { if (tok.includes('\n')) words.push({ br: true }); else words.push({ sp: true }); return; } let w = tok; const s = /^[¡¿«(]*\*/.test(w); if (s) { hl = true; w = w.replace('*', ''); } const em = w.match(/^(.*)\*([.,;:!?»)…]*)$/); if (em) w = em[1] + em[2]; words.push({ w, hl }); if (em) hl = false; });
  const lines = [[]]; let lw = 0; const spW = c.measureText(' ').width;
  for (const t of words) {
    if (t.br) { lines.push([]); lw = 0; continue; }
    if (t.sp) continue;
    const ww = c.measureText(t.w).width;
    if (lw > 0 && lw + spW + ww > maxW) { lines.push([]); lw = 0; }
    const L = lines[lines.length - 1]; if (L.length) lw += spW; L.push({ w: t.w, hl: t.hl, x: lw }); lw += ww;
  }
  return lines;
}
function charCount(lines) { return lines.reduce((a, L) => a + L.reduce((b, t) => b + t.w.length + 1, 0), 0); }
function drawRichLines(c, lines, x, y, lh, shown, col = COL.ink, hl = COL.hl) {
  let n = 0;
  for (let i = 0; i < lines.length; i++) for (const t of lines[i]) {
    if (n >= shown) return; const vis = t.w.slice(0, Math.max(0, shown - n)); n += t.w.length + 1;
    c.fillStyle = t.hl ? hl : col; c.fillText(vis, x + t.x, y + i * lh);
  }
}

// --------------------------------------------------------------- diálogo
const DLG = { x: 6, y: H - 64, w: W - 12, h: 58, lh: 15, fs: 12.5 };
function say(who, text, opts = {}) {
  const S = who ? SPEAKERS[who] || { name: who } : null;
  const hasP = S && (S.img || S.sprite || S.mystery);
  bctx.font = FONT(DLG.fs);
  const mc = ctx; mc.save(); mc.setTransform(1, 0, 0, 1, 0, 0); mc.font = FONT(DLG.fs);
  const maxW = DLG.w - 26;
  const pagesSrc = text.split('|');
  const pages = [];
  pagesSrc.forEach(pt => { const lines = wrapRich(mc, pt.trim(), maxW); for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3)); });
  mc.restore();
  const L = { pages, pi: 0, shown: 0, t: 0, S, who, hasP, keep: opts.keep, icon: opts.icon,
    update(dt) {
      const total = charCount(this.pages[this.pi]); const spd = 72 * (G.settings.textSpeed || 1);
      if (this.shown < total) { const before = Math.floor(this.shown); this.shown = Math.min(total, this.shown + dt * spd * (INP.held.a || INP.held.b ? 3 : 1)); if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) AUD.sfx('blip'); if (pressedAny('a', 'b') && this.shown > 2) this.shown = total; }
      else { if (this.keep && this.pi === this.pages.length - 1) { if (!this.kept) { this.kept = true; this.onKept && this.onKept(); } return; } this.t += dt; if (pressedAny('a', 'b')) { AUD.sfx('blip'); if (this.pi < this.pages.length - 1) { this.pi++; this.shown = 0; } else this.resolve(); } }
    },
    draw(c) {
      box(c, DLG.x, DLG.y, DLG.w, DLG.h, opts.style || 'dialog');
      if (this.hasP) {
        drawPortrait(c, this.who, DLG.x + 6, DLG.y - 60, 54);
      }
      if (this.S && this.S.name) {
        c.font = FONT(11, 1); const nw = c.measureText(this.S.name).width + 16; const nx = this.hasP ? DLG.x + 66 : DLG.x + 8;
        c.fillStyle = COL.ink; rrect(c, nx, DLG.y - 13, nw, 16, 4); c.fill(); c.fillStyle = this.S.color || COL.blue; rrect(c, nx + 1.5, DLG.y - 11.5, nw - 3, 13, 3); c.fill();
        c.fillStyle = '#fff'; c.fillText(this.S.name, nx + 8, DLG.y - 1.5);
      }
      if (this.icon) drawItemIcon(c, this.icon, DLG.x + DLG.w - 30, DLG.y - 22, 22);
      c.font = FONT(DLG.fs); c.textBaseline = 'alphabetic';
      drawRichLines(c, this.pages[this.pi], DLG.x + 13, DLG.y + 19, DLG.lh, Math.floor(this.shown), opts.style === 'dark' ? '#f0eaff' : COL.ink, opts.style === 'dark' ? '#ffd070' : COL.hl);
      const total = charCount(this.pages[this.pi]);
      if (this.shown >= total && !(this.keep && this.pi === this.pages.length - 1)) { const b = Math.floor(G.t * 3) % 2; c.fillStyle = COL.red; c.beginPath(); const ax = DLG.x + DLG.w - 16, ay = DLG.y + DLG.h - 14 + b; c.moveTo(ax, ay); c.lineTo(ax + 7, ay); c.lineTo(ax + 3.5, ay + 5); c.fill(); }
    }
  };
  const p = UI.push(L);
  if (opts.keep) return new Promise(r => { L.onKept = () => r(L); if (L.kept) r(L); }).then(l => l);
  return p;
}
// pregunta con opciones (devuelve índice; -1 si se cancela con B cuando cancel:true)
async function ask(prompt, options, who, o = {}) {
  let L = null;
  if (prompt) L = await say(who, prompt, { keep: true });
  const v = await choose(options, o);
  if (L) L.resolve();
  return v;
}
function choose(options, o = {}) {
  const c = ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = FONT(12);
  const w = Math.min(W - 20, Math.max(80, ...options.map(s => c.measureText(s).width + 34))); c.restore();
  const h = options.length * 16 + 12; const x = o.x ?? (W - w - 8), y = o.y ?? (DLG.y - h - 4);
  return UI.push({ i: o.def || 0,
    update() { if (INP.pressed.up) { this.i = (this.i + options.length - 1) % options.length; AUD.sfx('move'); } if (INP.pressed.down) { this.i = (this.i + 1) % options.length; AUD.sfx('move'); } if (INP.pressed.a) { AUD.sfx('select'); this.resolve(this.i); } else if (INP.pressed.b && o.cancel) { AUD.sfx('back'); this.resolve(-1); } },
    draw(c) { box(c, x, y, w, h); c.font = FONT(12); options.forEach((s, k) => { c.fillStyle = k === this.i ? COL.red : COL.ink; c.fillText(s, x + 20, y + 18 + k * 16); if (k === this.i) { c.beginPath(); const ay = y + 10 + k * 16 + Math.sin(G.t * 8) * 0.8; c.moveTo(x + 9, ay); c.lineTo(x + 15, ay + 4); c.lineTo(x + 9, ay + 8); c.fill(); } }); }
  });
}
function toast(text, dur = 3.2) { AUD.sfx('page'); UI.toasts.push({ text, t: 0, dur }); }
function drawToasts(c) {
  UI.toasts.forEach((t, i) => {
    const k = Math.min(1, t.t / 0.25, (t.dur - t.t) / 0.25); c.font = FONT(10.5, 1); const w = Math.min(W - 20, c.measureText(t.text).width + 26);
    const x = W - (w + 8) * k, y = 6 + i * 22; box(c, x, y, w, 19, 'parch'); c.fillStyle = '#5a3a20'; c.fillText(t.text, x + 13, y + 13);
    c.fillStyle = COL.red; c.fillRect(x + 6, y + 7, 3, 5);
  });
}

// --------------------------------------------------------------- íconos de objetos
function drawItemIcon(c, id, x, y, s) {
  const it = ITEMS[id]; if (!it) return; const k = s / 16;
  c.save(); c.translate(x, y); c.scale(k, k); c.lineWidth = 1.2;
  const col = it.col || '#c8a040';
  c.fillStyle = '#2a1e2e';
  switch (it.icon) {
    case 'bottle': c.fillStyle = '#8ad0ff'; c.fillRect(5, 4, 6, 10); c.fillStyle = '#4a90d8'; c.fillRect(5, 9, 6, 5); c.fillStyle = '#6a4428'; c.fillRect(6, 1, 4, 3); break;
    case 'apple': c.fillStyle = '#e84a4a'; c.beginPath(); c.arc(8, 10, 5.5, 0, 7); c.fill(); c.fillStyle = '#5a3a20'; c.fillRect(7.5, 2, 1.5, 4); c.fillStyle = '#5ac050'; c.fillRect(9, 3, 4, 2); break;
    case 'candy': c.fillStyle = col; c.beginPath(); c.arc(8, 8, 4.5, 0, 7); c.fill(); c.fillStyle = shade(col, 1.3); c.beginPath(); c.moveTo(1, 5); c.lineTo(4, 8); c.lineTo(1, 11); c.fill(); c.beginPath(); c.moveTo(15, 5); c.lineTo(12, 8); c.lineTo(15, 11); c.fill(); break;
    case 'letter': c.fillStyle = '#f8f0d8'; c.fillRect(1, 4, 14, 10); c.strokeStyle = '#a08860'; c.strokeRect(1, 4, 14, 10); c.beginPath(); c.moveTo(1, 4); c.lineTo(8, 10); c.lineTo(15, 4); c.stroke(); c.fillStyle = '#c8323a'; c.beginPath(); c.arc(8, 10, 2, 0, 7); c.fill(); break;
    case 'book': c.fillStyle = col; c.fillRect(3, 2, 10, 13); c.fillStyle = '#f4ecd8'; c.fillRect(11, 3, 2, 11); c.fillStyle = '#e8c050'; c.fillRect(5, 5, 5, 2); break;
    case 'cloth': c.fillStyle = col; c.beginPath(); c.moveTo(2, 3); c.lineTo(14, 3); c.lineTo(13, 13); c.quadraticCurveTo(8, 10, 3, 13); c.closePath(); c.fill(); c.strokeStyle = shade(col, 0.7); c.stroke(); break;
    case 'cape': c.fillStyle = '#24222c'; c.beginPath(); c.moveTo(5, 2); c.lineTo(11, 2); c.lineTo(15, 15); c.lineTo(1, 15); c.closePath(); c.fill(); c.fillStyle = '#e8c050'; c.fillRect(7, 2, 2, 2); break;
    case 'choco': c.fillStyle = '#b07a4a'; c.fillRect(3, 5, 10, 9); c.fillStyle = '#5a3420'; c.fillRect(4, 6, 8, 3); c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(6, 4); c.quadraticCurveTo(5, 2, 7, 1); c.stroke(); break;
    case 'flag': c.fillStyle = '#6a4428'; c.fillRect(2, 1, 1.5, 14); c.fillStyle = '#fff'; c.fillRect(3.5, 2, 11, 4); c.fillStyle = '#d52b1e'; c.fillRect(3.5, 6, 11, 4); c.fillStyle = '#0039a6'; c.fillRect(3.5, 2, 4, 4); break;
    case 'key': c.fillStyle = '#e8c050'; c.beginPath(); c.arc(5, 8, 3.5, 0, 7); c.fill(); c.fillRect(7, 7, 8, 2); c.fillRect(12, 9, 2, 3); break;
    case 'collar': c.strokeStyle = '#3ec1c9'; c.lineWidth = 2.5; c.beginPath(); c.arc(8, 8, 5, 0, 7); c.stroke(); c.fillStyle = '#ffe060'; c.fillRect(7, 12, 2.5, 2.5); break;
    case 'shawl': c.fillStyle = '#8a6a9a'; c.beginPath(); c.moveTo(1, 4); c.lineTo(15, 4); c.lineTo(8, 15); c.closePath(); c.fill(); break;
    case 'bigbook': c.fillStyle = '#2a5ab8'; c.fillRect(2, 2, 12, 13); c.fillStyle = '#e8c050'; c.fillRect(4, 5, 8, 2); c.fillStyle = '#d52b1e'; c.fillRect(4, 9, 8, 1.5); c.fillStyle = '#fff'; c.fillRect(13, 3, 1, 11); break;
    case 'logbook': c.fillStyle = '#7a4a28'; c.fillRect(2, 2, 12, 13); c.fillStyle = '#e8d8a8'; c.fillRect(4, 4, 8, 9); c.strokeStyle = '#c8323a'; c.beginPath(); c.moveTo(5, 6); c.lineTo(10, 11); c.moveTo(10, 6); c.lineTo(5, 11); c.stroke(); break;
    default: c.fillStyle = col; c.fillRect(3, 3, 10, 10);
  }
  c.restore();
}

// --------------------------------------------------------------- ceremonia de medalla
async function giveMedal(id) {
  if (G.medals.includes(id)) return;
  G.medals.push(id); G.met[id] = true; saveGame();
  const F = FOUNDERS.find(f => f.id === id);
  AUD.jingle('medalla');
  await UI.push({ t: 0,
    update(dt) { this.t += dt; if (this.t > 1.4 && pressedAny('a', 'b')) { AUD.sfx('select'); this.resolve(); } },
    draw(c) {
      const k = Math.min(1, this.t / 0.6);
      c.fillStyle = `rgba(14,10,30,${0.82 * k})`; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, 96); c.rotate(this.t * 0.4);
      for (let i = 0; i < 14; i++) { c.rotate(Math.PI * 2 / 14); c.fillStyle = `rgba(255,220,120,${0.16 * k})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(-14, -200); c.lineTo(14, -200); c.fill(); }
      c.restore();
      const im = IMG['m_' + id]; const sz = 112 * (0.4 + 0.6 * easeOutBack(k)); const sx = Math.cos(Math.max(0, 1.2 - this.t) * 9);
      if (im) { c.save(); c.translate(W / 2, 96); c.scale(sx, 1); c.drawImage(im, -sz / 2, -sz / 2, sz, sz); c.restore(); }
      for (let i = 0; i < 8; i++) { const a = this.t * 1.5 + i; const r = 62 + Math.sin(this.t * 3 + i) * 6; c.fillStyle = '#fff6c0'; c.globalAlpha = 0.5 + 0.5 * Math.sin(this.t * 6 + i); const x = W / 2 + Math.cos(a) * r, y = 96 + Math.sin(a) * r * 0.8; c.fillRect(x - 0.5, y - 3, 1.5, 7); c.fillRect(x - 3, y - 0.5, 7, 1.5); c.globalAlpha = 1; }
      if (this.t > 0.6) {
        c.textAlign = 'center'; c.fillStyle = COL.gold; c.font = FONT(10, 1); c.fillText(`MEDALLA ${G.medals.length} DE 12`, W / 2, 166);
        c.fillStyle = '#fff'; c.font = FONT(17, 1); c.fillText(F.medal, W / 2, 186);
        c.font = FONT(11.5); c.fillStyle = '#e8e0ff'; c.fillText('«' + F.lesson + '»', W / 2, 206);
        c.font = FONT(10); c.fillStyle = '#b8a8e0'; c.fillText(`${F.name} firmó su página del libro.`, W / 2, 226);
        c.textAlign = 'left';
      }
    }
  });
}
function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

// --------------------------------------------------------------- cuadro educativo (sepia)
async function card(title, pages, years) {
  AUD.sfx('page');
  const prevTint = G.tintOverride; G.tintOverride = 'sepia';
  await UI.push({ pi: 0, t: 0,
    update(dt) { this.t += dt; if (this.t > 0.4 && pressedAny('a', 'b')) { AUD.sfx('page'); if (this.pi < pages.length - 1) { this.pi++; this.t = 0.3; } else this.resolve(); } },
    draw(c) {
      const x = 24, y = 16, w = W - 48, h = H - 32;
      c.fillStyle = 'rgba(40,24,10,0.35)'; c.fillRect(0, 0, W, H);
      box(c, x, y, w, h, 'parch');
      c.fillStyle = '#7a4a28'; c.font = FONT(9, 1); c.fillText('CUADRO EDUCATIVO', x + 72, y + 18);
      c.fillStyle = COL.red; c.font = FONT(15, 1); c.fillText(title, x + 72, y + 35);
      drawPortrait(c, 'mg', x + 10, y + 10, 54);
      c.font = FONT(12); const lines = wrapRich(c, pages[this.pi], w - 30);
      drawRichLines(c, lines, x + 15, y + 84, 15, 9999, '#3a2414', COL.red);
      if (years) {
        const ty = y + h - 30; c.strokeStyle = '#7a4a28'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 20, ty); c.lineTo(x + w - 20, ty); c.stroke();
        years.forEach(([yr, lbl, now], i) => { const px = x + 30 + i * ((w - 60) / Math.max(1, years.length - 1)); c.fillStyle = now ? COL.red : '#7a4a28'; c.beginPath(); c.arc(px, ty, now ? 4.5 : 3.5, 0, 7); c.fill(); c.textAlign = 'center'; c.font = FONT(10, 1); c.fillText(yr, px, ty - 8); c.font = FONT(8.5); c.fillStyle = '#5a3a20'; c.fillText(lbl, px, ty + 14); c.textAlign = 'left'; });
      }
      c.fillStyle = '#7a4a28'; c.font = FONT(9); c.fillText(`${this.pi + 1}/${pages.length}  ▸ A`, x + w - 50, y + 18);
    }
  });
  G.tintOverride = prevTint;
}

// --------------------------------------------------------------- LIBRO (menú)
const BOOK = { tab: 0, focus: 'tabs', sel: 0, page: null, msel: 0, osel: 0, isel: 0 };
const TABS = ['Fundadores', 'Medallas', 'Bitácora', 'Mochila', 'Opciones'];
function openBook() { if (!hasFlag('tiene_libro')) { runScript(async () => say('mg', 'Todavía no tengo el libro de mi tío... ¡Está en el living!')); return; } AUD.sfx('page'); BOOK.focus = 'tabs'; BOOK.page = null; BOOK.prev = G.scene; G.scene = 'book'; }
function closeBook() { AUD.sfx('back'); G.scene = 'world'; saveGame(); }
SCENES.book = {
  update(dt) {
    const B = BOOK;
    if (INP.pressed.start) { closeBook(); return; }
    if (B.page != null) { // página de un fundador
      if (BOOK.cutscene) { if (pressedAny('a', 'b')) { B.page = null; closeBook(); } return; }
      if (INP.pressed.left || INP.pressed.right) { const d = INP.pressed.left ? -1 : 1; B.page = (B.page + 12 + d) % 12; AUD.sfx('page'); }
      if (pressedAny('a', 'b')) { B.page = null; AUD.sfx('back'); }
      return;
    }
    if (B.focus === 'tabs') {
      if (INP.pressed.left) { B.tab = (B.tab + TABS.length - 1) % TABS.length; AUD.sfx('page'); }
      if (INP.pressed.right) { B.tab = (B.tab + 1) % TABS.length; AUD.sfx('page'); }
      if (INP.pressed.down || INP.pressed.a) { B.focus = 'content'; AUD.sfx('move'); }
      if (INP.pressed.b) closeBook();
      return;
    }
    // contenido
    if (INP.pressed.b) { B.focus = 'tabs'; AUD.sfx('back'); return; }
    if (B.tab === 0) {
      const n = 12; if (INP.pressed.right) B.sel = (B.sel + 1) % n; if (INP.pressed.left) B.sel = (B.sel + n - 1) % n;
      if (INP.pressed.down) B.sel = Math.min(n - 1, B.sel + 6); if (INP.pressed.up) { if (B.sel < 6) B.focus = 'tabs'; else B.sel -= 6; }
      if (pressedAny('left', 'right', 'up', 'down')) AUD.sfx('move');
      if (INP.pressed.a) { if (G.met[FOUNDERS[B.sel].id]) { B.page = B.sel; AUD.sfx('page'); } else AUD.sfx('bump'); }
    } else if (B.tab === 1) {
      if (INP.pressed.right) B.msel = (B.msel + 1) % 12; if (INP.pressed.left) B.msel = (B.msel + 11) % 12;
      if (INP.pressed.down) B.msel = Math.min(11, B.msel + 6); if (INP.pressed.up) { if (B.msel < 6) B.focus = 'tabs'; else B.msel -= 6; }
      if (pressedAny('left', 'right', 'up', 'down')) AUD.sfx('move');
    } else if (B.tab === 2) { if (INP.pressed.up) B.focus = 'tabs'; }
    else if (B.tab === 3) { const ids = Object.keys(G.items); if (INP.pressed.down && ids.length) B.isel = (B.isel + 1) % ids.length; if (INP.pressed.up) { if (B.isel === 0) B.focus = 'tabs'; else B.isel--; } }
    else if (B.tab === 4) {
      const opts = 5;
      if (INP.pressed.down) { B.osel = (B.osel + 1) % opts; AUD.sfx('move'); } if (INP.pressed.up) { if (B.osel === 0) B.focus = 'tabs'; else B.osel--; AUD.sfx('move'); }
      if (B.osel === 1 && (INP.pressed.left || INP.pressed.right)) { G.settings.music = clamp(Math.round((G.settings.music + (INP.pressed.left ? -0.1 : 0.1)) * 10) / 10, 0, 1); AUD.setVol(G.settings.music); AUD.sfx('move'); }
      if (B.osel === 2 && (INP.pressed.left || INP.pressed.right)) { const sp = [0.6, 1, 1.8]; let i = sp.indexOf(G.settings.textSpeed); i = clamp(i + (INP.pressed.left ? -1 : 1), 0, 2); G.settings.textSpeed = sp[i]; AUD.sfx('move'); }
      if (INP.pressed.a) {
        if (B.osel === 0) { saveGame(); toast('¡Partida guardada!'); AUD.sfx('select'); }
        if (B.osel === 3) { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => { }); }
        if (B.osel === 4) { saveGame(); G.scene = 'title'; TITLE.sel = 0; AUD.play('titulo'); }
      }
    }
  },
  drawLow(c) { if (G.map) drawWorld(); },
  drawHi(c) {
    const B = BOOK;
    c.fillStyle = 'rgba(10,8,20,0.55)'; c.fillRect(0, 0, W, H);
    // libro abierto
    const x = 10, y = 8, w = W - 20, h = H - 16;
    c.fillStyle = '#1c2450'; rrect(c, x - 3, y - 3, w + 6, h + 6, 8); c.fill();
    c.fillStyle = '#e8c050'; rrect(c, x - 1, y - 1, w + 2, h + 2, 7); c.fill();
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#f2e2bc'); g.addColorStop(0.48, '#fbf1da'); g.addColorStop(0.5, '#d8c49a'); g.addColorStop(0.52, '#fbf1da'); g.addColorStop(1, '#f2e2bc');
    c.fillStyle = g; rrect(c, x + 1, y + 1, w - 2, h - 2, 6); c.fill();
    // pestañas
    c.font = FONT(10, 1);
    let tx = x + 10;
    TABS.forEach((t, i) => { const tw = c.measureText(t).width + 16; const on = i === B.tab; c.fillStyle = on ? (B.focus === 'tabs' ? COL.red : '#1c2450') : '#c8b48c'; rrect(c, tx, y + 6, tw, 16, 4); c.fill(); c.fillStyle = on ? '#fff' : '#5a3a20'; c.fillText(t, tx + 8, y + 17.5); tx += tw + 4; });
    const cy = y + 28;
    if (B.page != null) return drawFounderPage(c, FOUNDERS[B.page], x, y, w, h);
    if (B.tab === 0) {
      const cw = (w - 30) / 6;
      FOUNDERS.forEach((F, i) => {
        const col = i % 6, row = Math.floor(i / 6); const fx = x + 15 + col * cw, fy = cy + 10 + row * 92; const met = G.met[F.id];
        const sel = B.focus === 'content' && B.sel === i;
        if (sel) { c.fillStyle = 'rgba(200,50,58,0.15)'; rrect(c, fx + 2, fy - 4, cw - 4, 88, 6); c.fill(); c.strokeStyle = COL.red; c.lineWidth = 1.5; rrect(c, fx + 2, fy - 4, cw - 4, 88, 6); c.stroke(); }
        const s = 50; const mx = fx + cw / 2 - s / 2;
        if (met && G.medals.includes(F.id) && IMG['m_' + F.id]) c.drawImage(IMG['m_' + F.id], mx - 4, fy, s + 8, s + 8);
        else if (met) { drawPortrait(c, F.id, mx, fy + 4, s); }
        else { c.fillStyle = '#d8c49a'; c.beginPath(); c.arc(mx + s / 2, fy + s / 2 + 4, s / 2, 0, 7); c.fill(); c.fillStyle = '#b8a07a'; c.font = FONT(26, 1); c.textAlign = 'center'; c.fillText('?', mx + s / 2, fy + s / 2 + 13); c.textAlign = 'left'; }
        c.textAlign = 'center'; c.fillStyle = met ? '#3a2414' : '#a08a6a'; c.font = FONT(8.5, 1);
        const nm = met ? F.short : '¿ ? ? ?'; c.fillText(nm, fx + cw / 2, fy + 68); c.font = FONT(7.5); c.fillStyle = '#7a5a3a'; c.fillText(`${i + 1}`, fx + cw / 2, fy + 78); c.textAlign = 'left';
      });
      c.fillStyle = '#7a5a3a'; c.font = FONT(9); c.fillText(B.focus === 'content' ? 'A: abrir página · B: volver' : '◂ ▸ cambiar pestaña · ▾ entrar · B: cerrar', x + 14, y + h - 8);
    } else if (B.tab === 1) {
      const cw = (w - 30) / 6;
      for (let i = 0; i < 12; i++) {
        const F = FOUNDERS[i]; const col = i % 6, row = Math.floor(i / 6); const fx = x + 15 + col * cw, fy = cy + 6 + row * 70; const has = G.medals.includes(F.id);
        c.fillStyle = '#e2cc9c'; c.beginPath(); c.arc(fx + cw / 2, fy + 28, 25, 0, 7); c.fill(); c.strokeStyle = '#b8a07a'; c.lineWidth = 1.5; c.stroke();
        if (has && IMG['m_' + F.id]) { const wob = Math.sin(G.t * 2 + i) * 1; c.drawImage(IMG['m_' + F.id], fx + cw / 2 - 28, fy + 0 + wob, 56, 56); }
        else { c.fillStyle = '#b8a07a'; c.font = FONT(14, 1); c.textAlign = 'center'; c.fillText(String(i + 1), fx + cw / 2, fy + 33); c.textAlign = 'left'; }
        if (B.focus === 'content' && B.msel === i) { c.strokeStyle = COL.red; c.lineWidth = 2; c.beginPath(); c.arc(fx + cw / 2, fy + 28, 29, 0, 7); c.stroke(); }
      }
      const F = FOUNDERS[B.msel]; const has = G.medals.includes(F.id);
      box(c, x + 14, y + h - 58, w - 28, 46, 'parch');
      c.fillStyle = '#3a2414'; c.font = FONT(11.5, 1); c.fillText(has ? F.medal : `Medalla ${B.msel + 1}: aún no la tienes`, x + 26, y + h - 38);
      c.font = FONT(10); c.fillStyle = '#5a3a20'; c.fillText(has ? '«' + F.lesson + '»' : 'Conoce a todos los fundadores para llenar el libro.', x + 26, y + h - 22);
      c.textAlign = 'right'; c.fillStyle = COL.red; c.font = FONT(12, 1); c.fillText(`${G.medals.length} / 12`, x + w - 26, y + h - 38); c.textAlign = 'left';
    } else if (B.tab === 2) {
      c.fillStyle = COL.red; c.font = FONT(10, 1); c.fillText('OBJETIVO', x + 20, cy + 14);
      c.fillStyle = '#3a2414'; c.font = FONT(12.5); const L = wrapRich(c, G.objective || '—', w / 2 - 40); drawRichLines(c, L, x + 20, cy + 32, 15, 9999, '#3a2414');
      const hh = typeof currentHint === 'function' && G.map ? currentHint() : null; if (hh) { c.fillStyle = COL.red; c.font = FONT(10, 1); c.fillText('PISTA DE NEMO', x + 20, y + h - 92); c.font = FONT(10.5); const LH = wrapRich(c, hh.text, w / 2 - 40); drawRichLines(c, LH.slice(0, 3), x + 20, y + h - 78, 12, 9999, '#4a3020'); }
      c.fillStyle = '#7a5a3a'; c.font = FONT(10); c.fillText(`Medallas: ${G.medals.length}/12`, x + 20, y + h - 40); c.fillText(`Tiempo de juego: ${Math.floor(G.playTime / 60)} min`, x + 20, y + h - 26);
      c.fillText(`Época: ${ERA_NAMES[G.era] || G.era}`, x + 20, y + h - 12);
      // notas del tío
      const nx = x + w / 2 + 14; c.fillStyle = COL.red; c.font = FONT(10, 1); c.fillText('NOTAS DE LA BITÁCORA DEL TÍO', nx, cy + 14);
      const notes = TIO_NOTES.filter(n => cond(n.cond)); const last = notes.slice(-3);
      let ny = cy + 30; c.font = FONT(10.5);
      last.forEach(n => { const L = wrapRich(c, '“' + n.text + '”', w / 2 - 34); drawRichLines(c, L, nx, ny, 13, 9999, '#4a3020', COL.red); ny += L.length * 13 + 8; });
      if (!last.length) { c.fillStyle = '#a08a6a'; c.fillText('(La bitácora está en blanco.)', nx, ny); }
    } else if (B.tab === 3) {
      const ids = Object.keys(G.items);
      if (!ids.length) { c.fillStyle = '#a08a6a'; c.font = FONT(12); c.fillText('La mochila está vacía.', x + 20, cy + 24); }
      ids.forEach((id, i) => { const yy = cy + 8 + i * 22; if (yy > y + h - 50) return; const sel = B.focus === 'content' && B.isel === i; if (sel) { c.fillStyle = 'rgba(200,50,58,0.14)'; c.fillRect(x + 14, yy - 2, w / 2 - 20, 20); } drawItemIcon(c, id, x + 20, yy, 16); c.fillStyle = '#3a2414'; c.font = FONT(11.5, sel); c.fillText(`${ITEMS[id]?.name || id}${G.items[id] > 1 ? ' × ' + G.items[id] : ''}`, x + 42, yy + 12); });
      const id = ids[B.isel]; if (id) { const L = wrapRich(c, ITEMS[id]?.desc || '', w / 2 - 40); c.font = FONT(11); drawRichLines(c, L, x + w / 2 + 16, cy + 22, 14, 9999, '#4a3020'); drawItemIcon(c, id, x + w * 0.75 - 20, cy + 90, 40); }
    } else if (B.tab === 4) {
      const ops = ['Guardar partida', `Música: ${'■'.repeat(Math.round(G.settings.music * 10))}${'□'.repeat(10 - Math.round(G.settings.music * 10))}`, `Velocidad del texto: ${{ 0.6: 'lenta', 1: 'normal', 1.8: 'rápida' }[G.settings.textSpeed]}`, 'Pantalla completa', 'Volver a la portada'];
      ops.forEach((o, i) => { const sel = B.focus === 'content' && B.osel === i; c.fillStyle = sel ? COL.red : '#3a2414'; c.font = FONT(13, sel); c.fillText((sel ? '▸ ' : '  ') + o, x + 30, cy + 26 + i * 24); });
      c.fillStyle = '#7a5a3a'; c.font = FONT(9.5); const help = ['Controles: flechas para caminar · Z/Espacio/Enter = A · X/Esc = B', 'Mantén Shift (o B) para correr · M o Tab = libro · H = pista', 'La flecha dorada siempre muestra adónde ir.'];
      help.forEach((t, i) => c.fillText(t, x + 30, y + h - 44 + i * 13));
    }
  }
};
function drawFounderPage(c, F, x, y, w, h) {
  const met = G.met[F.id]; const has = G.medals.includes(F.id);
  const L0 = x + 14, mid = x + w / 2;
  // izquierda: ilustración
  const im = IMG['c_' + F.id];
  c.fillStyle = '#1c2450'; rrect(c, L0, y + 28, w / 2 - 26, 70, 6); c.fill();
  if (IMG['m_' + F.id]) c.drawImage(IMG['m_' + F.id], L0 + 6, y + 30, 66, 66);
  c.fillStyle = '#fff4d8'; let fs = 14; c.font = FONT(fs, 1); while (c.measureText(F.name).width > w / 2 - 26 - 84 && fs > 8) { fs -= 0.5; c.font = FONT(fs, 1); } c.fillText(F.name, L0 + 78, y + 56); c.font = FONT(10); c.fillStyle = '#e8c050'; c.fillText(F.years, L0 + 78, y + 72); c.fillStyle = '#c8d0f0'; c.font = FONT(9); c.fillText(has ? '★ Firmó su página' : 'Aún no firma su página', L0 + 78, y + 88);
  if (im) { const ih = h - 122, iw = ih * im.width / im.height; c.drawImage(im, L0 + (w / 2 - 26) / 2 - iw / 2, y + 102, iw, ih); }
  // derecha: poema y datos
  const R0 = mid + 12, RW = w / 2 - 26;
  c.fillStyle = COL.red; c.font = FONT(9, 1); c.fillText('POEMA DEL LIBRO', R0, y + 40);
  c.font = FONT(9.4); let yy = y + 48;
  F.poem.forEach(line => { const L = wrapRich(c, line, RW); drawRichLines(c, L, R0, yy, 10.5, 9999, '#3a2414'); yy += L.length * 10.5 + 1.5; });
  yy += 5; c.fillStyle = COL.red; c.font = FONT(9, 1); c.fillText('¿SABÍAS QUE…?', R0, yy); yy += 12;
  c.font = FONT(9.4); const L2 = wrapRich(c, F.fact, RW); drawRichLines(c, L2, R0, yy, 10.5, 9999, '#3a2414'); yy += L2.length * 10.5 + 6;
  if (has) { c.fillStyle = COL.red; c.font = FONT(9, 1); c.fillText('LO QUE APRENDÍ', R0, yy); yy += 12; c.font = FONT(9.4, 1); const L3 = wrapRich(c, F.lesson, RW); drawRichLines(c, L3, R0, yy, 10.5, 9999, '#1c2450'); }
  c.fillStyle = '#7a5a3a'; c.font = FONT(9); c.fillText(BOOK.cutscene ? 'A: seguir' : '◂ ▸ pasar página · B: volver', L0, y + h - 8);
  c.textAlign = 'right'; c.fillText(`${FOUNDERS.indexOf(F) + 1}`, x + w - 12, y + h - 8); c.textAlign = 'left';
}

// --------------------------------------------------------------- viaje en el tiempo
async function travelMenu() {
  const list = DESTS.filter(d => cond(d.cond));
  if (!list.length) { await say('mg', 'La nave está apagada. Primero tengo que prepararme.'); return; }
  const opts = list.map(d => (d.map === G.mapId ? '• ' : '') + d.label).concat(['No viajar']);
  const i = await ask('La nave brilla. ¿A qué época viajamos?', opts, null, { cancel: true });
  if (i < 0 || i >= list.length) return;
  const d = list[i];
  if (d.map === G.mapId) { await say('mg', '¡Ya estoy aquí!'); return; }
  if (d.before) { const ok = await d.before(); if (ok === false) return; }
  await timeTravel(d);
}
async function timeTravel(d) {
  G.busy++;
  AUD.sfx('warp'); await flash('#fff', 500);
  const prev = G.scene; G.scene = 'travel'; TRAVEL.t = 0; TRAVEL.label = d.year || ''; TRAVEL.dest = d.label;
  AUD.play('tiempo');
  await sleep(3600);
  await fadeOut('#fff', 300);
  G.scene = 'world';
  enterMap(d.map, d.x, d.y, d.dir || 'down');
  G.busy--;
  await fadeIn(500);
  if (d.after) await runScript(d.after);
  else if (G.map.def.onEnter) await runScript(G.map.def.onEnter);
}
const TRAVEL = { t: 0 };
SCENES.travel = {
  update(dt) { TRAVEL.t += dt; },
  drawLow(c) {
    const t = TRAVEL.t; c.fillStyle = '#0a0620'; c.fillRect(0, 0, W, H);
    for (let r = 220; r > 4; r -= 7) { const k = (Math.floor(r / 7) + Math.floor(t * 12)) % 6; c.strokeStyle = ['#ff5a7a', '#ffd04a', '#5ad0ff', '#a070ff', '#5ae08a', '#ff9a3c'][k]; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < Math.PI * 2 + 0.2; a += 0.2) { const rr = r + Math.sin(a * 5 + t * 6) * 4; const x = W / 2 + Math.cos(a + t * (1 + r / 200)) * rr * 1.3, y = H / 2 + Math.sin(a + t * (1 + r / 200)) * rr * 0.8; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    for (let i = 0; i < 60; i++) { const a = i * 2.4 + t * 0.6, d = ((i * 37 + t * 140) % 260); c.fillStyle = '#fff'; c.fillRect(W / 2 + Math.cos(a) * d * 1.3, H / 2 + Math.sin(a) * d * 0.8, 2, 2); }
    const m = ART.props.timemachine[Math.floor(t * 8) % 4]; c.save(); c.translate(W / 2, H / 2 + Math.sin(t * 4) * 4); c.rotate(Math.sin(t * 3) * 0.15); c.drawImage(m.c, -m.w, -m.h, m.w * 2, m.h * 2); c.restore();
  },
  drawHi(c) {
    const t = TRAVEL.t; const ids = FOUNDERS.map(f => f.id);
    for (let i = 0; i < 8; i++) { const id = ids[(i + Math.floor(t)) % ids.length]; const k = ((t * 0.5 + i / 8) % 1); const a = i * 0.9 + t * 0.4; const d = k * 220; const s = 14 + k * 46; c.globalAlpha = Math.min(1, k * 3) * (1 - k); if (IMG['m_' + id]) c.drawImage(IMG['m_' + id], W / 2 + Math.cos(a) * d * 1.3 - s / 2, H / 2 + Math.sin(a) * d * 0.8 - s / 2, s, s); c.globalAlpha = 1; }
    if (!TRAVEL.label && TRAVEL.dest) { c.textAlign = 'center'; c.font = FONT(20, 1); c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillText(TRAVEL.dest, W / 2 + 2, H - 30); c.fillStyle = '#ffe680'; c.fillText(TRAVEL.dest, W / 2, H - 32); c.textAlign = 'left'; }
    if (TRAVEL.label) { c.textAlign = 'center'; c.font = FONT(30, 1); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(TRAVEL.label, W / 2 + 2, 52); c.fillStyle = '#ffe680'; c.fillText(TRAVEL.label, W / 2, 50); c.font = FONT(12); c.fillStyle = '#fff'; c.fillText(TRAVEL.dest, W / 2, H - 22); c.textAlign = 'left'; }
  }
};

// --------------------------------------------------------------- DUELO DE IDEAS (estilo Pokémon)
const BAT = {};
function battle(opp) {
  return new Promise(res => {
    Object.assign(BAT, { wrongs: 0, hintSaid: false, opp, res, t: 0, state: 'intro', hp: opp.hp || 3, maxHp: opp.hp || 3, mg: 3, maxMg: 3, qi: 0, qs: shuffle(opp.questions.slice()), sel: 0, msg: null, anim: null, prevScene: G.scene });
    G.busy++; G.scene = 'battle'; AUD.play(opp.music || 'batalla');
    battleFlow();
  });
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function batSay(text, who) { return new Promise(r => { BAT.msg = { text, who, shown: 0, r }; }); }
async function battleFlow() {
  const o = BAT.opp;
  await sleep(700);
  await batSay(o.intro || `¡${o.name} quiere un Duelo de Ideas!`);
  if (o.taunt) await batSay(o.taunt, o.name);
  await batSay('Responde bien para convencer. ¡Cada respuesta correcta baja su DUDA!');
  while (BAT.hp > 0) {
    if (BAT.qi >= BAT.qs.length) { BAT.qs = shuffle(o.questions.slice()); BAT.qi = 0; }
    const q = BAT.qs[BAT.qi++];
    let ans = shuffle(q.a.map((t, i) => ({ t, ok: i === 0 })));
    if ((BAT.wrongs || 0) >= 2) { const bad = ans.filter(a => !a.ok); ans = ans.filter(a => a !== bad[0]); if (!BAT.hintSaid) { BAT.hintSaid = true; await batSay('Nemo olfatea la pregunta… ¡y descarta una respuesta incorrecta! Ahora quedan tres.'); } }
    BAT.state = 'ask'; BAT.q = q; BAT.ans = ans; BAT.sel = 0;
    const pick = await new Promise(r => BAT.pick = r);
    BAT.state = 'anim';
    if (pick === 'item') { await useBattleItem(); continue; }
    if (ans[pick].ok) {
      AUD.sfx('correct'); BAT.anim = { kind: 'hitOpp', t: 0 }; await sleep(500); AUD.sfx('hit'); BAT.hp--; await sleep(400);
      await batSay(['¡Argumento convincente!', '¡Muy bien pensado!', '¡Exacto!', '¡Eso es!'][Math.floor(Math.random() * 4)] + (q.ok ? ' ' + q.ok : ''));
      if (o.onHit) { const s = o.onHit(BAT.hp); if (s) await batSay(s.text, s.who); }
    } else {
      AUD.sfx('wrong'); BAT.wrongs = (BAT.wrongs || 0) + 1; BAT.anim = { kind: 'hitMg', t: 0 }; await sleep(600); BAT.mg--;
      await batSay('Mmm… no era así. ' + (q.ok || ''));
      if (BAT.mg <= 0) { await batSay('MG se desanimó un poquito…'); await batSay('Pero recordó algo: «los valientes se levantan una vez más de las que se caen». ¡Ánimo recuperado!'); AUD.sfx('heal'); BAT.mg = BAT.maxMg; }
    }
    BAT.anim = null;
  }
  BAT.state = 'win'; AUD.stop();
  await batSay(o.lose || `¡${o.name} quedó convencido!`, o.name);
  AUD.jingle('victoria'); await batSay('¡MG ganó el Duelo de Ideas!');
  await fadeOut('#000', 250); G.scene = 'world'; G.busy--; if (G.map && G.map.def.music) AUD.play(typeof G.map.def.music === 'function' ? G.map.def.music() : G.map.def.music); await fadeIn(250);
  BAT.res(true);
}
async function useBattleItem() {
  const foods = Object.keys(G.items).filter(id => ITEMS[id]?.food);
  if (!foods.length) { await batSay('No tienes nada para comer en la mochila.'); return; }
  if (BAT.mg >= BAT.maxMg) { await batSay('¡MG tiene todo el ánimo del mundo! Mejor guardar la comida.'); return; }
  const id = foods[0]; takeItem(id); BAT.mg = Math.min(BAT.maxMg, BAT.mg + 1); AUD.sfx('heal');
  await batSay(`MG comió ${ITEMS[id].name.toLowerCase()}. ¡Ñami! Recuperó ánimo.`);
}
SCENES.battle = {
  update(dt) {
    BAT.t += dt; if (BAT.anim) BAT.anim.t += dt;
    if (BAT.msg) { const m = BAT.msg; const L = m.text.length; if (m.shown < L) { m.shown = Math.min(L, m.shown + dt * 60 * (G.settings.textSpeed || 1)); if (Math.floor(m.shown) % 3 === 0) AUD.sfx('blip'); if (pressedAny('a', 'b') && m.shown > 2) m.shown = L; } else if (pressedAny('a', 'b')) { AUD.sfx('blip'); const r = m.r; BAT.msg = null; r(); } return; }
    if (BAT.state === 'ask') {
      const n = BAT.ans.length;
      if (INP.pressed.right && BAT.sel % 2 === 0 && BAT.sel + 1 < n) { BAT.sel++; AUD.sfx('move'); }
      if (INP.pressed.left && BAT.sel % 2 === 1) { BAT.sel--; AUD.sfx('move'); }
      if (INP.pressed.down && BAT.sel + 2 < n) { BAT.sel += 2; AUD.sfx('move'); }
      if (INP.pressed.up && BAT.sel - 2 >= 0) { BAT.sel -= 2; AUD.sfx('move'); }
      if (INP.pressed.a) { AUD.sfx('select'); const p = BAT.pick; BAT.pick = null; p && p(BAT.sel); }
      else if (INP.pressed.b || INP.pressed.start) { const p = BAT.pick; BAT.pick = null; p && p('item'); }
    }
  },
  drawLow(c) {
    const t = BAT.t; const o = BAT.opp;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.sky || '#a8d8ff'); g.addColorStop(0.55, o.sky2 || '#e8f4ff'); g.addColorStop(0.56, o.ground || '#a8d878'); g.addColorStop(1, shade(o.ground || '#a8d878', 0.8)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (o.boss) { for (let i = 0; i < 30; i++) { const x = (i * 53 + t * 30 * (i % 3 + 1)) % (W + 40) - 20, y = (i * 29) % 140; c.fillStyle = 'rgba(255,240,200,0.7)'; c.save(); c.translate(x, y); c.rotate(t + i); c.fillRect(-4, -5, 8, 10); c.restore(); } }
    c.fillStyle = shade(o.ground || '#a8d878', 0.7); c.beginPath(); c.ellipse(286, 112, 62, 13, 0, 0, 7); c.fill();
    c.fillStyle = shade(o.ground || '#a8d878', 0.75); c.beginPath(); c.ellipse(96, 196, 74, 15, 0, 0, 7); c.fill();
    const intro = Math.min(1, t / 0.6);
    // oponente (de frente)
    let ox = 286 - 24 + (1 - intro) * 200, oy = 112 - 66;
    if (BAT.anim && BAT.anim.kind === 'hitOpp') { ox += Math.sin(BAT.anim.t * 50) * 3; }
    if (BAT.state === 'win') oy += Math.min(30, (t % 100) * 0);
    const os = ART.sprites[o.sprite]; if (os) { c.imageSmoothingEnabled = false; if (!(BAT.anim && BAT.anim.kind === 'hitOpp' && Math.floor(BAT.anim.t * 16) % 2)) c.drawImage(os, 0, 0, 16, 24, ox, oy, 48, 72); }
    // MG de espaldas
    let mx = 96 - 30 - (1 - intro) * 200, my = 196 - 84;
    if (BAT.anim && BAT.anim.kind === 'hitOpp' && BAT.anim.t < 0.3) mx += Math.sin(BAT.anim.t / 0.3 * Math.PI) * 18;
    if (BAT.anim && BAT.anim.kind === 'hitMg') mx += Math.sin(BAT.anim.t * 50) * 3;
    const ms = ART.sprites[G.outfit]; if (ms) c.drawImage(ms, 0, 24, 16, 24, mx, my, 60, 90);
    if (BAT.anim && BAT.anim.kind === 'hitOpp' && BAT.anim.t > 0.3 && BAT.anim.t < 0.9) { for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const r = (BAT.anim.t - 0.3) * 80; c.fillStyle = ['#ffe060', '#fff', '#a0f0ff'][i % 3]; c.fillRect(286 + Math.cos(a) * r, 80 + Math.sin(a) * r * 0.7, 3, 3); } }
  },
  drawHi(c) {
    const o = BAT.opp;
    // tarjetas de estado
    box(c, 14, 14, 150, 40); c.fillStyle = COL.ink; c.font = FONT(12, 1); c.fillText(o.name, 24, 31);
    c.font = FONT(9, 1); c.fillStyle = '#7a4a28'; c.fillText('DUDA', 24, 45); bar(c, 52, 39, 100, 7, BAT.hp / BAT.maxHp, '#c84a6a');
    box(c, W - 168, 140, 156, 42); c.fillStyle = COL.ink; c.font = FONT(12, 1); c.fillText('MG', W - 158, 157); c.font = FONT(9, 1); c.fillStyle = '#7a4a28'; c.fillText('ÁNIMO', W - 158, 172);
    for (let i = 0; i < BAT.maxMg; i++) heart(c, W - 118 + i * 16, 165, i < BAT.mg);
    // panel inferior
    const py = H - 62; box(c, 6, py, W - 12, 56);
    if (BAT.msg) { c.font = FONT(12.5); c.fillStyle = COL.ink; const L = wrapRich(c, BAT.msg.text, W - 40); drawRichLines(c, L, 18, py + 19, 15, Math.floor(BAT.msg.shown)); if (BAT.msg.who) { c.font = FONT(9, 1); c.fillStyle = COL.red; c.fillText(BAT.msg.who.toUpperCase(), 18, py - 3); } }
    else if (BAT.state === 'ask') {
      // pregunta arriba
      box(c, 6, py - 46, W - 12, 42, 'parch'); c.font = FONT(11.5, 1); c.fillStyle = '#3a2414'; const L = wrapRich(c, BAT.q.q, W - 40); drawRichLines(c, L.slice(0, 2), 18, py - 28, 14, 9999, '#3a2414');
      c.font = FONT(11); BAT.ans.forEach((a, i) => { const ax = 20 + (i % 2) * ((W - 24) / 2), ay = py + 20 + Math.floor(i / 2) * 20; const sel = BAT.sel === i; if (sel) { c.fillStyle = 'rgba(200,50,58,0.12)'; rrect(c, ax - 6, ay - 13, (W - 24) / 2 - 8, 18, 4); c.fill(); } c.fillStyle = sel ? COL.red : COL.ink; const txt = a.t; c.fillText((sel ? '▸ ' : '  ') + txt, ax, ay); });
      c.font = FONT(8.5); c.fillStyle = '#8a7a8a'; c.textAlign = 'right'; c.fillText('B: comer algo de la mochila', W - 18, py + 51); c.textAlign = 'left';
    }
  }
};
function bar(c, x, y, w, h, k, col) { c.fillStyle = '#2a1e2e'; rrect(c, x - 1, y - 1, w + 2, h + 2, 3); c.fill(); c.fillStyle = '#e8e0e8'; c.fillRect(x, y, w, h); c.fillStyle = k > 0.5 ? col : k > 0.2 ? '#e8a040' : '#5ab070'; c.fillRect(x, y, w * Math.max(0, k), h); }
function heart(c, x, y, full) { c.fillStyle = full ? '#e84a6a' : '#d8c8d0'; c.beginPath(); c.moveTo(x, y + 3); c.bezierCurveTo(x, y - 2, x - 7, y - 2, x - 7, y + 2); c.bezierCurveTo(x - 7, y + 6, x, y + 9, x, y + 11); c.bezierCurveTo(x, y + 9, x + 7, y + 6, x + 7, y + 2); c.bezierCurveTo(x + 7, y - 2, x, y - 2, x, y + 3); c.fill(); }

// --------------------------------------------------------------- MINIJUEGO: secuencias (costura / melodías / silbidos)
// opts: {title, help, symbols:[{dir,label,color,note}], rounds:[3,4,5], inst, seq?:fixed arrays}
function simon(opts) {
  return UI.push({ t: 0, round: 0, phase: 'show', seq: [], idx: 0, lit: -1, litT: 0, msg: opts.help, ok: 0, opts,
    init() { this.newRound(); },
    newRound() { const n = opts.rounds[this.round]; this.seq = opts.fixed ? opts.fixed[this.round].slice() : Array.from({ length: n }, () => Math.floor(Math.random() * opts.symbols.length)); this.phase = 'show'; this.idx = 0; this.t = -0.6; },
    light(i) { this.lit = i; this.litT = 0.32; const s = opts.symbols[i]; if (s.note) AUD.note(s.note, opts.inst); else AUD.sfx('select'); },
    update(dt) {
      if (!this.started) { this.started = true; this.newRound(); }
      this.litT -= dt; if (this.litT <= 0) this.lit = -1;
      if (this.phase === 'show') { this.t += dt; const k = Math.floor(this.t / 0.55); if (this.t >= 0 && k < this.seq.length && k !== this.lastK) { this.lastK = k; this.light(this.seq[k]); } if (k >= this.seq.length + 0.5) { this.phase = 'input'; this.idx = 0; this.lastK = -1; this.msg = '¡Tu turno! Repite la secuencia.'; } return; }
      if (this.phase === 'input') {
        const d = ['up', 'right', 'down', 'left'].find(k => INP.pressed[k]); if (!d) return;
        const i = opts.symbols.findIndex(s => s.dir === d); if (i < 0) return; this.light(i);
        if (i === this.seq[this.idx]) { this.idx++; if (this.idx >= this.seq.length) { this.round++; AUD.sfx('correct'); if (this.round >= opts.rounds.length) { this.phase = 'done'; this.msg = opts.win || '¡Perfecto!'; this.t = 0; } else { this.msg = '¡Muy bien! Ahora una más larga…'; this.phase = 'wait'; this.t = 0; } } }
        else { AUD.sfx('wrong'); this.misses = (this.misses || 0) + 1; this.msg = this.misses > 1 ? '¡Ups! Sigue el botón que brilla.' : '¡Ups! Mira de nuevo con atención.'; this.phase = 'wait'; this.t = 0; this.retry = true; }
        return;
      }
      if (this.phase === 'wait') { this.t += dt; if (this.t > 1.1) { if (this.retry) { this.retry = false; this.phase = 'show'; this.idx = 0; this.t = -0.4; this.lastK = -1; } else this.newRound(); this.msg = 'Mira y escucha…'; } return; }
      if (this.phase === 'done') { this.t += dt; if (this.t > 1.2) this.resolve(true); }
    },
    draw(c) {
      c.fillStyle = 'rgba(10,8,24,0.7)'; c.fillRect(0, 0, W, H);
      box(c, 40, 14, W - 80, H - 28, 'parch');
      c.textAlign = 'center'; c.fillStyle = COL.red; c.font = FONT(15, 1); c.fillText(opts.title, W / 2, 38);
      c.fillStyle = '#5a3a20'; c.font = FONT(11); c.fillText(this.msg || '', W / 2, 54);
      const cx = W / 2, cy = 140, R = 46;
      const pos = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
      opts.symbols.forEach((s, i) => {
        const [dx, dy] = pos[s.dir]; const x = cx + dx * R * 1.25, y = cy + dy * R * 0.95; const on = this.lit === i;
        c.fillStyle = '#2a1e2e'; c.beginPath(); c.arc(x, y, 23, 0, 7); c.fill();
        c.fillStyle = on ? shade(s.color, 1.35) : shade(s.color, 0.85); c.beginPath(); c.arc(x, y, 21, 0, 7); c.fill();
        if (on) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 26, 0, 7); c.stroke(); }
        if (this.phase === 'input' && this.misses > 0 && this.seq[this.idx] === i) { c.strokeStyle = `rgba(255,216,74,${0.5 + Math.sin(G.t * 8) * 0.4})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 29, 0, 7); c.stroke(); }
        c.fillStyle = s.textCol || '#fff'; c.font = FONT(10, 1); c.fillText(s.label, x, y + 4);
        c.fillStyle = '#5a3a20'; c.font = FONT(9); c.fillText({ up: '▲', right: '▶', down: '▼', left: '◀' }[s.dir], x + dx * 34, y + dy * 32 + 3);
      });
      c.font = FONT(10, 1); c.fillStyle = '#7a4a28'; c.fillText(`Ronda ${Math.min(this.round + 1, opts.rounds.length)} de ${opts.rounds.length}`, W / 2, H - 24);
      if (this.phase === 'input') { for (let k = 0; k < this.seq.length; k++) { c.fillStyle = k < this.idx ? '#5ab070' : '#d8c49a'; c.beginPath(); c.arc(W / 2 - (this.seq.length - 1) * 7 + k * 14, H - 40, 4, 0, 7); c.fill(); } }
      c.textAlign = 'left';
    }
  });
}

// --------------------------------------------------------------- MINIJUEGO: ordenar la línea de tiempo
function timeline(cards) {
  const order = shuffle(cards.map((_, i) => i));
  return UI.push({ order, sel: 0, held: -1, msg: 'Ordena los papeles del más antiguo al más nuevo. A: tomar / soltar.', done: false, t: 0,
    update(dt) {
      if (this.done) { this.t += dt; if (this.t > 1.6) this.resolve(true); return; }
      const n = this.order.length + 1;
      if (INP.pressed.up) { const ns = Math.max(0, this.sel - 1); if (this.held >= 0 && ns !== this.sel && this.sel < this.order.length) { [this.order[ns], this.order[this.sel]] = [this.order[this.sel], this.order[ns]]; } this.sel = ns; AUD.sfx('move'); }
      if (INP.pressed.down) { const ns = Math.min(n - 1, this.sel + 1); if (this.held >= 0 && ns < this.order.length) { [this.order[ns], this.order[this.sel]] = [this.order[this.sel], this.order[ns]]; this.sel = ns; } else if (this.held < 0) this.sel = ns; AUD.sfx('move'); }
      if (INP.pressed.a) {
        if (this.sel === this.order.length) { const wrong = this.order.filter((v, i) => v !== i).length; if (!wrong) { this.done = true; AUD.sfx('correct'); this.msg = '¡Perfecto! Toda la historia en orden.'; } else { AUD.sfx('wrong'); this.tries = (this.tries || 0) + 1; this.marks = true; this.msg = this.tries >= 2 ? `Hay ${wrong} fuera de lugar (en rojo). Nemo encontró los años: ¡míralos!` : `Hay ${wrong} papeles fuera de lugar (en rojo). ¡Muévelos!`; } }
        else { this.held = this.held >= 0 ? -1 : this.sel; AUD.sfx('select'); }
      }
    },
    draw(c) {
      c.fillStyle = 'rgba(10,8,24,0.7)'; c.fillRect(0, 0, W, H); box(c, 24, 8, W - 48, H - 16, 'parch');
      c.fillStyle = COL.red; c.font = FONT(14, 1); c.textAlign = 'center'; c.fillText('Los papeles de don Diego', W / 2, 28); c.font = FONT(10); c.fillStyle = '#5a3a20'; c.fillText(this.msg, W / 2, 42); c.textAlign = 'left';
      this.order.forEach((ci, i) => { const y = 50 + i * 21; const sel = this.sel === i; const held = this.held >= 0 && sel; c.fillStyle = held ? '#ffe8a0' : sel ? '#fff4d8' : '#f8ecd0'; rrect(c, 44 + (held ? 6 : 0), y, W - 88, 18, 4); c.fill(); c.strokeStyle = this.marks && ci !== i ? '#e83a3a' : sel ? COL.red : '#c8a060'; c.lineWidth = this.marks && ci !== i ? 2 : 1.2; rrect(c, 44 + (held ? 6 : 0), y, W - 88, 18, 4); c.stroke(); c.fillStyle = '#3a2414'; c.font = FONT(11, sel); c.fillText(cards[ci].t, 54 + (held ? 6 : 0), y + 13); if (this.done || this.tries >= 2) { c.fillStyle = COL.red; c.font = FONT(11, 1); c.textAlign = 'right'; c.fillText(cards[ci].y, W - 54, y + 13); c.textAlign = 'left'; } });
      const by = 50 + this.order.length * 21 + 4; const sel = this.sel === this.order.length; c.fillStyle = sel ? COL.red : '#7a4a28'; rrect(c, W / 2 - 50, by, 100, 18, 5); c.fill(); c.fillStyle = '#fff'; c.font = FONT(11, 1); c.textAlign = 'center'; c.fillText('¡Listo!', W / 2, by + 13); c.textAlign = 'left';
    }
  });
}

// --------------------------------------------------------------- PORTADA
const TITLE = { sel: 0, t: 0 };
SCENES.title = {
  update(dt) {
    TITLE.t += dt; const save = loadSave(); const opts = save ? ['Continuar', 'Nueva aventura'] : ['Nueva aventura'];
    if (INP.pressed.up || INP.pressed.down) { TITLE.sel = (TITLE.sel + 1) % opts.length; AUD.sfx('move'); }
    if (INP.pressed.a) {
      AUD.init(); AUD.sfx('select'); const o = opts[TITLE.sel];
      if (o === 'Continuar') continueGame(save);
      else if (save) { runConfirmNew(); }
      else newGame();
    }
  },
  drawLow(c) {
    const t = TITLE.t; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e3a8a'); g.addColorStop(0.7, '#2f7ac8'); g.addColorStop(1, '#5aa8e8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) { const x = (i * 97) % W, y = (i * 53) % 150; c.fillStyle = (Math.floor(t * 2 + i) % 5) ? '#fff' : '#ffe680'; c.fillRect(x, y, 1 + (i % 3 === 0), 1 + (i % 3 === 0)); }
    // colinas y cordillera
    c.fillStyle = '#7a8ab8'; c.beginPath(); c.moveTo(0, 196); for (let x = 0; x <= W; x += 24) c.lineTo(x, 170 - ((x * 37) % 40)); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    c.fillStyle = '#eef4fc'; for (let x = 0; x <= W; x += 24) { const y = 170 - ((x * 37) % 40); c.beginPath(); c.moveTo(x - 7, y + 8); c.lineTo(x, y); c.lineTo(x + 7, y + 8); c.fill(); }
    c.fillStyle = '#5aa848'; c.fillRect(0, 214, W, 42); c.fillStyle = '#4a9a3c'; for (let x = 0; x < W; x += 6) c.fillRect((x + Math.floor(t * 30)) % W, 214, 2, 2);
    // MG y Nemo caminando
    const fr = Math.floor(t * 6) % 2 ? 1 : 2;
    const wx = ((t * 22) % (W + 60)) - 30; c.drawImage(ART.sprites.mg_casa, fr * 16, 72, 16, 24, wx, 214 - 22, 16, 24); c.drawImage(ART.sprites.nemo, fr * 16, 72, 16, 24, wx + 18, 214 - 21, 16, 24);
    const m = ART.props.timemachine[Math.floor(t * 4) % 4]; c.drawImage(m.c, 40 + Math.sin(t) * 4, 40 + Math.sin(t * 1.3) * 6);
  },
  drawHi(c) {
    const t = TITLE.t;
    const gl = c.createRadialGradient(W / 2, 66, 10, W / 2, 66, 120); gl.addColorStop(0, 'rgba(255,250,235,0.95)'); gl.addColorStop(0.55, 'rgba(255,250,235,0.75)'); gl.addColorStop(1, 'rgba(255,250,235,0)'); c.fillStyle = gl; c.beginPath(); c.ellipse(W / 2, 66, 130, 64, 0, 0, 7); c.fill();
    if (IMG.logo) { const s = 150 + Math.sin(t * 2) * 3; c.drawImage(IMG.logo, W / 2 - s / 2, -6, s, s); }
    c.fillStyle = 'rgba(14,18,48,0.55)'; rrect(c, W / 2 - 120, 116, 240, loadSave() ? 104 : 70, 10); c.fill();
    c.textAlign = 'center'; c.font = FONT(20, 1); c.fillStyle = '#1c2450'; c.fillText('MG y los Fundadores', W / 2 + 1.5, 132 + 1.5); c.fillStyle = '#fff4d8'; c.fillText('MG y los Fundadores', W / 2, 132);
    c.font = FONT(10); c.fillStyle = '#ffe680'; c.fillText('Una aventura por la historia de Chile', W / 2, 146);
    const save = loadSave(); const opts = save ? ['Continuar', 'Nueva aventura'] : ['Nueva aventura'];
    opts.forEach((o, i) => { const sel = TITLE.sel === i; c.font = FONT(13, 1); c.fillStyle = sel ? '#ffe680' : '#cfe0ff'; c.fillText((sel ? '▸ ' : '') + o + (sel ? ' ◂' : ''), W / 2, 168 + i * 17); });
    if (save) { c.font = FONT(8.5); c.fillStyle = '#cfe0ff'; c.fillText(`Partida guardada: ${save.medals.length}/12 medallas`, W / 2, 168 + opts.length * 17); }
    c.font = FONT(8); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillText('Historia: Miguel Ángel Fernández · Ilustraciones: Rafael Fernández', W / 2, H - 6);
    c.textAlign = 'left';
  }
};
async function runConfirmNew() {
  G.scene = 'title';
  const i = await choose(['Sí, empezar de nuevo', 'No, volver'], { x: W / 2 - 70, y: 190 });
  if (i === 0) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } newGame(); }
}
function continueGame(s) {
  Object.assign(G, { flags: s.flags || {}, medals: s.medals || [], items: s.items || {}, met: s.met || {}, objective: s.objective || '', outfit: s.outfit || 'mg', era: s.era, playTime: s.playTime || 0 });
  if (s.settings) { G.settings = s.settings; AUD.setVol(G.settings.music); }
  G.scene = 'world'; G.fade = 1; enterMap(s.map, s.x, s.y, s.dir);
  toast('¡Bienvenida de vuelta, MG!');
  fadeIn(400).then(() => { if (G.map.def.onEnter) runScript(G.map.def.onEnter); });
}
function newGame() {
  Object.assign(G, { flags: {}, medals: [], items: {}, met: {}, objective: '', outfit: 'mg_casa', era: 'hoy', playTime: 0 });
  G.scene = 'world'; G.fade = 1;
  runScript(async () => { await introCinematic(); await PROLOGO(); });
}

// --------------------------------------------------------------- CRÉDITOS
const CRED = { t: 0 };
SCENES.credits = {
  update(dt) { CRED.t += dt; if (CRED.t > 6 && pressedAny('a', 'start')) { CRED.done && CRED.done(); } },
  drawLow(c) { c.fillStyle = '#0e1230'; c.fillRect(0, 0, W, H); for (let i = 0; i < 60; i++) { c.fillStyle = (Math.floor(CRED.t * 2 + i) % 6) ? '#fff' : '#ffe680'; c.fillRect((i * 97) % W, (i * 61 + CRED.t * 6) % H, 1, 1); } },
  drawHi(c) {
    const y0 = H - CRED.t * 22; c.textAlign = 'center';
    CREDITS.forEach((l, i) => { const y = y0 + i * 18; if (y < -20 || y > H + 20) return; if (l.img) { if (IMG[l.img]) c.drawImage(IMG[l.img], W / 2 - 50, y - 10, 100, 100); return; } c.font = FONT(l.s || 12, l.b); c.fillStyle = l.c || '#fff4d8'; c.fillText(l.t || '', W / 2, y); });
    if (y0 + CREDITS.length * 18 < H / 2) { c.font = FONT(10); c.fillStyle = '#ffe680'; c.fillText('Presiona A', W / 2, H - 14); }
    c.textAlign = 'left';
  }
};
