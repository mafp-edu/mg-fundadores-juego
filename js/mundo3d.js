// =====================================================================
//  MUNDO 2.5D: el mismo mapa de baldosas, dibujado en 3D con three.js
//  - Suelo con texturas pintadas y bordes suaves entre tipos de suelo; agua y mar animados.
//  - Edificios con fachada pintada, techo de tejas y sombras; rocas y muros como volúmenes.
//  - Interiores: muro del fondo con su decoración (ventanas, cuadros, relojes).
//  - Personajes, árboles y objetos como recortes ilustrados que miran a la cámara.
//  - La lógica del juego (grilla, choques, escenas) no cambia: solo cambia el dibujo.
//  Con file:// (doble clic) usa el modo 2D, porque el navegador no deja usar
//  imágenes locales en WebGL.
// =====================================================================
'use strict';
const M3D = {
  ok: typeof THREE !== 'undefined' && location.protocol !== 'file:',
  r: null, scene: null, cam: null, mapRef: null, propSig: '', ents: new Map(), tex: {}, glows: [], water: [],
  wants() { return this.ok && !(G.settings && G.settings.no3d) && G.map && IMG.t_pasto && !(this.skip && this.skip[G.mapId]); },
  skip: {}
};
const P3 = { pitch: 0.98, dist: 16, fov: 30, cardTilt: 0.72, charTilt: 0.55, charStretch: 1.06 };
// suelos (de abajo hacia arriba); el agua y el mar van en su propia capa animada
const GROUND3D = [['t_tierra', ['dirt', 'mud']], ['t_nieve', ['snow']], ['t_arena', ['sand']], ['t_cueva', ['cave']], ['t_pasto', ['grass', 'tall', 'maize']], ['t_pasto_osc', ['grassd']], ['t_trigo', ['wheat']], ['t_flores', ['flowers']],
  ['t_adoquin', ['cobble']], ['t_losa', ['pavers']], ['t_muelle', ['pier', 'bridge']], ['t_madera', ['wood']], ['t_baldosa', ['terra']], ['t_alfombra', ['carpet']], ['t_lab', ['lab']]];
const WATER3D = { water: 't_agua', sea: 't_mar' };
// volúmenes por baldosa sólida: nombre → [textura, alto]
const SOLID3D = { rock: ['t_roca', 1.7], wallstone: ['t_piedra', 2.2], waterfall: ['t_agua', 2.2] };
const WALL3D = { wall: 't_muro', wallb: 't_pared_lab', wallp: 't_papel', wallstone: 't_piedra' };
// objetos ilustrados: tipo → [imagen, ancho en baldosas]  (sin ancho: se usa el del dibujo 2D)
const PROP3D = {
  tree: ['b_arbol', 2.4], alamo: ['b_alamo', 1.15], pino: ['b_pino', 1.8], naranjo: ['b_naranjo', 2.0], bush: ['b_arbusto', 1.3], lamp: ['b_farol', 0.75], bench: ['b_banca', 1.95],
  fountain: ['b_pileta', 3.0], stall: ['b_puesto', 2.0], cart: ['b_carreta', 2.0], well: ['b_pozo', 1.9], barrel: ['b_barril', 0.8], crate: ['b_cajon', 0.85], flag_es: ['b_bandera_es', 1.2],
  flag_cl: ['b_bandera_cl', 1.2], flag_pv: ['b_bandera_pv', 1.2], timemachine: ['b_nave', 2.1], fence: ['b_cerca', 1.1], fencev: ['b_cerca', 1.1], hay: ['b_fardo', 1.0], fardo: ['b_fardo', 1.0], haypile: ['b_parva', 2.0],
  tent: ['b_carpa', 2.2], cannon: ['b_canon', 1.9], campfire: ['b_fogata', 1.2], ship: ['b_barco', 4.2], boat: ['b_bote', 3.1], rock: ['b_roca', 1.05], signpost: ['b_letrero', 0.9], statue: ['b_estatua', 1.2], statue_oh: ['b_estatua_oh', 1.2],
  telas_vacio: ['b_tendedero', 3.1], telas: ['b_telas', 3.1], ladder: ['b_escalera'], torch: ['b_antorcha', 0.6],
  bed: ['b_cama'], wardrobe: ['b_ropero'], desk: ['b_escritorio'], plant: ['b_planta', 0.9], toybox: ['b_juguetes'], bookshelf: ['b_estante'], bookshelf2: ['b_estante2'], fireplace: ['b_chimenea', 2.0],
  table: ['b_mesa'], chair: ['b_silla', 0.7], fridge: ['b_refri'], stove: ['b_cocina'], counter: ['b_meson'], labmachine: ['b_maquina'], longtable: ['b_mesalarga', 5.2], candela: ['b_candelabro', 0.6],
  deskold: ['b_escritorio_col'], tablecloth: ['b_mesa_mantel'], olla: ['b_olla', 1.0], piano: ['b_piano'], saddle: ['b_montura'], cofre: ['b_cofre'],
  // decoración del muro
  window: ['b_ventana'], windowold: ['b_ventana_col'], poster: ['b_poster'], flagwall: ['b_bandera_muro'], painting: ['b_cuadro'], paintingw: ['b_cuadro_grande'], clock: ['b_reloj'], mapwall: ['b_mapa_muro'],
  // en el suelo
  rug: ['b_alfombra_piso'],
  // capítulo de los Andes
  nieve: ['b_bloque_nieve', 1.0], mula: ['b_mula', 2.1], yunque: ['b_yunque', 0.95]
};
const WALLDECO = new Set(['window', 'windowold', 'poster', 'flagwall', 'painting', 'paintingw', 'clock', 'mapwall']);
const FLOORDECO = new Set(['rug', 'puzzlemark', 'trapdoor']);
// personajes: sprite → vistas (frente / espalda / perfil hacia la derecha) y alto en baldosas
const C3 = (id, h, o = {}) => Object.assign({ front: 'c_' + id + '_frente', back: 'c_' + id + '_espalda', side: 'c_' + id + '_lado', h }, o);
const CHAR3D = {
  mg: C3('mg', 1.5), mg_casa: C3('mg_casa', 1.5, { back: 'v_mg_casa_espalda' }), mg_espia: C3('mg_espia', 1.5),
  nemo: C3('nemo', 0.8), mateo: C3('mateo', 1.8, { sideLeft: true }),
  salas: C3('salas', 1.8), javiera: C3('javiera', 1.72), jmcarrera: C3('jmcarrera', 1.8), paula: C3('paula', 1.72), rodriguez: C3('rodriguez', 1.8), rodriguez_fraile: C3('rodriguez_fraile', 1.8),
  luisa: C3('luisa', 1.72), luisa_sin: C3('luisa', 1.72), ohiggins: C3('ohiggins', 1.8), cornelia: C3('cornelia', 1.72), freire: C3('freire', 1.8), agueda: C3('agueda', 1.72), portales: C3('portales', 1.8),
  mama: C3('mama', 1.75), papa: C3('papa', 1.85), max: C3('max', 1.0), tio: C3('tio', 1.85),
  sanbruno: C3('sanbruno', 1.85, { front: 'v_sanbruno' }), realista: C3('realista', 1.8, { front: 'v_talavera' }), osorio: { front: 'v_osorio', h: 1.85 }, marco: { front: 'v_marco', h: 1.8 },
  espiritu: { front: 'v_espiritu', h: 2.2 }, olvido: { front: 'v_olvido', h: 1.6 }, vecino2: { front: 'v_dudoso', h: 1.75 },
  vecino: { front: 'c_vecino', h: 1.75 }, vecina: { front: 'c_vecina', h: 1.7 }, vecina2: { front: 'c_vecina2', h: 1.7 }, huaso: { front: 'c_huaso', h: 1.8 }, vendedora: { front: 'c_vendedora', h: 1.7 },
  nino: { front: 'c_nino', h: 1.35 }, nina: { front: 'c_nina', h: 1.35 }, fraile: { front: 'c_fraile', h: 1.8 }, guardia: { front: 'c_guardia', h: 1.85 }, patriota: { front: 'c_patriota', h: 1.85 },
  isabel: { front: 'c_isabel', h: 1.65 }, sanmartin: { front: 'c_sanmartin', h: 1.85 }, marino: { front: 'c_marino', h: 1.8 }
};
const FACADE3D = { cabildo: 'f_consulado', church: 'p_catedral' };
const HOUSE3D = ['f_casa_blanca', 'f_casa_rosada', 'f_casa_rosada', 'f_casa_blanca', 'f_pulperia'];

// --------------------------------------------------------------- texturas
function m3dTex(key, opts = {}) {
  const ck = key + (opts.repeat ? ':r' : '');
  if (M3D.tex[ck]) return M3D.tex[ck];
  const im = IMG[key]; if (!im) return null;
  const t = new THREE.Texture(im); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = M3D.r.capabilities.getMaxAnisotropy();
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.needsUpdate = true; return (M3D.tex[ck] = t);
}
// contorno oscuro alrededor de los personajes (se despegan del fondo)
function m3dOutlined(key) {
  M3D.outl = M3D.outl || {}; if (M3D.outl[key]) return M3D.outl[key];
  const im = IMG[key]; if (!im) return null; const k = Math.max(3, Math.round(im.height / 160)), pad = k + 2;
  const sil = mkCanvas(im.width + pad * 2, im.height + pad * 2), sx = sil.getContext('2d');
  for (let a = 0; a < 16; a++) sx.drawImage(im, pad + Math.round(Math.cos(a / 16 * 6.283) * k), pad + Math.round(Math.sin(a / 16 * 6.283) * k));
  sx.globalCompositeOperation = 'source-in'; sx.fillStyle = 'rgba(42,26,40,0.92)'; sx.fillRect(0, 0, sil.width, sil.height);
  sx.globalCompositeOperation = 'source-over'; sx.drawImage(im, pad, pad);
  const t = m3dCanvasTex(sil); t.anisotropy = M3D.r.capabilities.getMaxAnisotropy();
  return (M3D.outl[key] = { tex: t, im: sil });
}
function m3dCanvasTex(cv, pixel) { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (pixel) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; } return t; }
function m3dInit() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: false, stencil: true });
  r.setPixelRatio(1); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  M3D.r = r; M3D.oc = mkCanvas(W * 3, H * 3); M3D.ox = M3D.oc.getContext('2d');
  M3D.cam = new THREE.PerspectiveCamera(P3.fov, W / H, 0.5, 140);
  const sc = mkCanvas(64, 64), sx = sc.getContext('2d'); let g = sx.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(20,12,30,0.55)'); g.addColorStop(1, 'rgba(20,12,30,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 64, 64);
  M3D.blob = m3dCanvasTex(sc);
  const gc = mkCanvas(64, 64), gx = gc.getContext('2d'); g = gx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,220,150,1)'); g.addColorStop(0.35, 'rgba(255,190,110,0.45)'); g.addColorStop(1, 'rgba(255,180,100,0)'); gx.fillStyle = g; gx.fillRect(0, 0, 64, 64);
  M3D.glowTex = m3dCanvasTex(gc);
  M3D.visMat = new THREE.MeshBasicMaterial({ color: 0xff3a30, transparent: true, opacity: 0.28, depthWrite: false });
}
// --------------------------------------------------------------- construir el mapa
const TS3 = 48;
function m3dMask(m, names, grow = 3) {
  const cw = m.w * TS3, ch = m.h * TS3; const mask = mkCanvas(cw, ch), mx = mask.getContext('2d'); mx.fillStyle = '#fff'; let any = false;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (names.includes(m.tiles[y][x].name)) { mx.fillRect(x * TS3 - grow, y * TS3 - grow, TS3 + grow * 2, TS3 + grow * 2); any = true; }
  return any ? mask : null;
}
function m3dGround(m) {
  const cw = m.w * TS3, ch = m.h * TS3; const cv = mkCanvas(cw, ch), c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const t = m.tiles[y][x]; const v = ART.tiles[t.name]; if (v) c.drawImage(v[t.v % v.length][0], x * TS3, y * TS3, TS3, TS3); }
  c.imageSmoothingEnabled = true;
  const layer = mkCanvas(cw, ch), lx = layer.getContext('2d');
  GROUND3D.forEach(([key, names]) => {
    const im = IMG[key] || (key === 't_pasto_osc' ? IMG.t_pasto : null); if (!im) return;
    const mask = m3dMask(m, names); if (!mask) return;
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, cw, ch); lx.filter = m.indoor3d ? 'blur(1px)' : 'blur(5px)'; lx.drawImage(mask, 0, 0); lx.filter = 'none';
    lx.globalCompositeOperation = 'source-in'; const pat = lx.createPattern(im, 'repeat'); const s = (TS3 * (m.indoor3d ? 3 : 4)) / im.width; pat.setTransform(new DOMMatrix([s, 0, 0, s, 0, 0])); lx.fillStyle = pat; lx.fillRect(0, 0, cw, ch);
    if (key === 't_pasto_osc' && !IMG.t_pasto_osc) { lx.globalCompositeOperation = 'source-atop'; lx.fillStyle = 'rgba(30,50,20,0.35)'; lx.fillRect(0, 0, cw, ch); }
    c.drawImage(layer, 0, 0);
  });
  // oscurecido suave al pie de edificios y muros
  c.filter = 'blur(10px)'; c.fillStyle = 'rgba(30,20,10,0.35)';
  G.props.forEach(pr => { if (pr.type === 'house' || pr.type === 'cabildo' || pr.type === 'church') c.fillRect(pr.x * TS3, (pr.y + pr.opts.h - 1) * TS3 - 6, pr.opts.w * TS3, 16); });
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const n = m.tiles[y][x].name; if ((SOLID3D[n] || WALL3D[n] || n === 'top') && m.tiles[y + 1] && !m.tiles[y + 1][x].solid) c.fillRect(x * TS3, (y + 1) * TS3 - 4, TS3, 14); }
  c.filter = 'none';
  const tex = m3dCanvasTex(cv); tex.anisotropy = M3D.r.capabilities.getMaxAnisotropy();
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshLambertMaterial({ map: tex, color: m.indoor3d ? 0xd8ccc0 : 0xffffff }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(m.w / 2, 0, m.h / 2); mesh.receiveShadow = true; return mesh;
}
// agua y mar: capa animada encima del suelo
function m3dWater(m, grp) {
  M3D.water = [];
  Object.entries(WATER3D).forEach(([name, key]) => {
    if (!IMG[key]) return; const mask = m3dMask(m, [name], 1); if (!mask) return;
    const mc = mkCanvas(mask.width, mask.height), mx = mc.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, mc.width, mc.height); mx.filter = 'blur(3px)'; mx.drawImage(mask, 0, 0); mx.filter = 'none';
    const tex = m3dTex(key, { repeat: true }).clone(); tex.needsUpdate = true; tex.repeat.set(m.w / 4, m.h / 4);
    const mat = new THREE.MeshLambertMaterial({ map: tex, alphaMap: m3dCanvasTex(mc), transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), mat); mesh.rotation.x = -Math.PI / 2; mesh.position.set(m.w / 2, 0.03, m.h / 2); mesh.receiveShadow = true; grp.add(mesh);
    M3D.water.push({ tex, speed: name === 'sea' ? 0.015 : 0.035 });
  });
}
// rocas, muros de piedra, cascadas y paredes de interiores: volúmenes por baldosa (instanciados)
function m3dSolids(m, grp) {
  const by = {};
  const wallH = 2.4;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.tiles[y][x]; let k = null, h = 0, kind = null;
    if (m.indoor3d && (WALL3D[t.name] || t.name === 'top')) {
      if (t.name === 'top') { const south = y >= m.h - 1 || (y > 2 && !m.tiles[y - 1][x].solid && y === m.h - 1); kind = 'top'; k = 'top'; h = (y === m.h - 1) ? 0.18 : wallH + 0.05; }
      else { k = (t.name === 'wall' && m.def.era === 'hoy') ? 't_pared_casa' : WALL3D[t.name]; h = wallH; kind = 'wall'; }
    } else if (SOLID3D[t.name]) { [k, h] = SOLID3D[t.name]; kind = t.name; if (t.name === 'wallstone' && m.def.dark) h = 0.9; if (m.indoor3d && y === m.h - 1) h = 0.25; }
    if (!k) continue;
    const id = kind + ':' + k + ':' + h; (by[id] = by[id] || { k, h, kind, list: [] }).list.push([x, y]);
  }
  M3D.falls = [];
  Object.values(by).forEach(({ k, h, kind, list }) => {
    const geo = new THREE.BoxGeometry(1, h, 1);
    let mat;
    if (kind === 'top') mat = new THREE.MeshLambertMaterial({ color: 0x2a2230 });
    else {
      const t0 = m3dTex(k, { repeat: true }); let side = null;
      if (t0) { side = t0.clone(); side.needsUpdate = true; side.repeat.set(1, h / 1.2); }
      const sideM = new THREE.MeshLambertMaterial({ map: side, color: t0 ? 0xffffff : 0x9a8a7a });
      let topT = t0; if (kind === 'rock' && m.def.snowpeaks && IMG.t_nieve) { topT = m3dTex('t_nieve', { repeat: true }).clone(); topT.needsUpdate = true; topT.repeat.set(0.5, 0.5); }
      else if (kind === 'rock' && IMG.t_pasto) { topT = m3dTex('t_pasto', { repeat: true }).clone(); topT.needsUpdate = true; topT.repeat.set(0.25, 0.25); }
      const topM = kind === 'wall' ? new THREE.MeshLambertMaterial({ color: 0x2a2230 }) : new THREE.MeshLambertMaterial({ map: topT, color: kind === 'rock' ? (m.def.snowpeaks ? 0xffffff : 0xd8e8c0) : 0x6a5e58 });
      mat = [sideM, sideM, topM, topM, sideM, sideM];
      if (kind === 'waterfall') { M3D.falls.push(side); }
    }
    const inst = new THREE.InstancedMesh(geo, mat, list.length); const mt = new THREE.Matrix4();
    // cordillera: cerros altos al fondo (norte) y bajos adelante, para no tapar la senda
    const peak = (x, y) => { if (!(m.def.snowpeaks && kind === 'rock')) return 1; const r = ((x * 73 + y * 37) % 10) / 10; return y < m.h / 2 ? 1.1 + r * 1.2 + (m.h / 2 - y) * 0.12 : 0.35 + r * 0.25; };
    const sc = new THREE.Vector3(), q0 = new THREE.Quaternion(), ps = new THREE.Vector3();
    list.forEach(([x, y], i) => { const f = peak(x, y); mt.compose(ps.set(x + 0.5, h * f / 2, y + 0.5), q0, sc.set(1, f, 1)); inst.setMatrixAt(i, mt); });
    inst.castShadow = kind !== 'top'; inst.receiveShadow = true; grp.add(inst);
  });
}
// pasto alto y maizal: matas ilustradas instanciadas
function m3dClumps(m, grp) {
  [['tall', 'b_pasto_alto', 0.95], ['maize', 'b_maiz', 1.25]].forEach(([name, key, wU]) => {
    const im = IMG[key]; if (!im) return; const list = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.tiles[y][x].name === name) list.push([x, y]);
    if (!list.length) return; const hU = wU * im.height / im.width;
    const geo = new THREE.PlaneGeometry(wU, hU); geo.translate(0, hU / 2, 0);
    const mat = new THREE.MeshBasicMaterial({ map: m3dTex(key), alphaTest: 0.45, side: THREE.DoubleSide }); mat.alphaToCoverage = true; mat.toneMapped = false;
    const inst = new THREE.InstancedMesh(geo, mat, list.length); const o = new THREE.Object3D();
    list.forEach(([x, y], i) => { const j = ((x * 73 + y * 37) % 10) / 10; o.position.set(x + 0.5 + (j - 0.5) * 0.25, 0, y + 0.75); o.rotation.set(-P3.cardTilt, 0, 0); o.scale.set(1 + j * 0.15, 0.9 + j * 0.2, 1); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
    grp.add(inst);
  });
}
function m3dBuilding(pr, i) {
  const o = pr.opts, w = o.w, d = Math.max(1, o.h - 0.38); const fkey = FACADE3D[pr.type] || (o.sign ? 'f_pulperia' : HOUSE3D[i % HOUSE3D.length]);
  const fim = IMG[fkey]; const k = pr.type === 'cabildo' ? 0.66 : pr.type === 'church' ? 0.7 : 0.78;
  const hgt = fim ? Math.min(7, w * fim.height / fim.width * k) : 2.6;
  const tint = (pr.type === 'house' && o.wall && !o.sign) ? new THREE.Color(o.wall).lerp(new THREE.Color(0xffffff), 0.35) : new THREE.Color(0xffffff);
  const wall = m3dTex('t_muro', { repeat: true }); const wallM = new THREE.MeshLambertMaterial({ map: wall, color: pr.type === 'church' ? 0xd8d4cc : tint });
  const front = new THREE.MeshLambertMaterial({ map: m3dTex(fkey) || null, color: fim ? tint : 0xf4ecdc });
  const grp = new THREE.Group();
  const tall = pr.type === 'church'; const bodyH = tall ? hgt * 0.5 : hgt;
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, d), [wallM, wallM, wallM, wallM, tall ? wallM : front, wallM]);
  box.position.set(pr.x + w / 2, bodyH / 2, pr.y + d / 2 + 0.1); box.castShadow = true; box.receiveShadow = true; grp.add(box);
  if (tall) { const fm = new THREE.MeshLambertMaterial({ map: m3dTex(fkey), alphaTest: 0.5, side: THREE.DoubleSide }); const fp = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), fm); fp.position.set(pr.x + w / 2, hgt / 2, pr.y + d + 0.11); fp.castShadow = true; grp.add(fp); }
  const rh = pr.type === 'cabildo' ? 0.8 : tall ? 1.2 : 0.7, over = 0.3;
  const roofCol = ((o.roof && o.roof[0]) ? new THREE.Color(o.roof[0]).lerp(new THREE.Color(0xffffff), 0.75) : new THREE.Color(0xffffff)).multiply(new THREE.Color(0xa8968e));
  const roofM = new THREE.MeshLambertMaterial({ map: m3dTex('t_tejas', { repeat: true }), side: THREE.DoubleSide, color: roofCol });
  const slope = Math.hypot(d / 2 + over, rh); const ang = Math.atan2(rh, d / 2 + over);
  [-1, 1].forEach(sg => {
    const geo = new THREE.PlaneGeometry(w + over * 2, slope); const uv = geo.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setXY(q, uv.getX(q) * (w + over * 2) / 1.3, uv.getY(q) * slope / 1.3);
    const pl = new THREE.Mesh(geo, roofM); pl.rotation.x = -Math.PI / 2 + sg * ang;
    pl.position.set(pr.x + w / 2, bodyH + rh / 2, pr.y + 0.1 + d / 2 + sg * (d / 2 + over) / 2); pl.castShadow = true; pl.receiveShadow = true; grp.add(pl);
  });
  const tri = new THREE.Shape(); tri.moveTo(-(d / 2 + over), 0); tri.lineTo(d / 2 + over, 0); tri.lineTo(0, rh); tri.closePath();
  [pr.x - 0.001, pr.x + w + 0.001].forEach(x => { const mm = new THREE.Mesh(new THREE.ShapeGeometry(tri), wallM); mm.rotation.y = Math.PI / 2; mm.position.set(x, bodyH, pr.y + 0.1 + d / 2); grp.add(mm); });
  grp.userData.building = true; grp.traverse(q => { if (q.isMesh) q.userData.bld = grp; });
  return grp;
}
function m3dCard(tex, wUnits, hUnits, tilt = P3.cardTilt) {
  const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide });
  mat.alphaToCoverage = true; mat.transparent = false; mat.toneMapped = false;
  const geo = new THREE.PlaneGeometry(wUnits, hUnits); geo.translate(0, hUnits / 2, 0);
  const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -tilt; return mesh;
}
function m3dBlob(r) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.2), new THREE.MeshBasicMaterial({ map: M3D.blob, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.04; m.renderOrder = 1; return m; }
// imagen ilustrada de un objeto (o su dibujo pixelado agrandado si aún no tiene)
function m3dPropArt(pr) {
  const def = PROP3D[pr.type]; const a = Array.isArray(pr.art) ? pr.art[0] : pr.art;
  if (def && IMG[def[0]]) { const im = IMG[def[0]]; const wU = (def[1] || (a ? a.w / 16 * (WALLDECO.has(pr.type) || FLOORDECO.has(pr.type) ? 1.2 : 1.04) : 1.5)) * ((pr.opts && pr.opts.s) || 1); return { tex: m3dTex(def[0]), wU, hU: wU * im.height / im.width, hd: true }; }
  if (!a || !a.c) return null;
  return { tex: m3dCanvasTex(dsSprite(a.c, 0, 0, a.w, a.h, 2), false), wU: a.w / 16, hU: a.h / 16, hd: false };
}
function m3dProp(pr, m) {
  const art = m3dPropArt(pr); if (!art) return null; const grp = new THREE.Group();
  const cx = pr.x + pr.fw / 2;
  if (WALLDECO.has(pr.type) && m.indoor3d) {
    // colgado en el muro del fondo
    const fz = m.wallFront[Math.min(m.w - 1, Math.max(0, Math.floor(cx)))] ?? (pr.y + pr.fh);
    const mat = new THREE.MeshLambertMaterial({ map: art.tex, alphaTest: 0.4, transparent: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(art.wU, art.hU), mat); pl.position.set(cx, 1.45, fz + 0.02); grp.add(pl); return grp;
  }
  if (FLOORDECO.has(pr.type) || (pr.opts.deco && !WALLDECO.has(pr.type))) {
    const mat = new THREE.MeshLambertMaterial({ map: art.tex, alphaTest: 0.4 });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(art.wU, art.hU), mat); pl.rotation.x = -Math.PI / 2; pl.position.set(cx, 0.025, pr.y + art.hU / 2); pl.receiveShadow = true; pl.userData.flat = true; grp.add(pl); return grp;
  }
  if (pr.type === 'mula' && typeof m3dAnimalOk === 'function' && m3dAnimalOk('mula')) {
    if (!ANI.gltf.mula) m3dAnimalLoad('mula');
    else { const A = m3dAnimalMake('mula'); A.pivot.rotation.y = m3dAnimalYaw(A.D, 'right', 'mula'); grp.add(A.pivot); grp.add(m3dBlob(1.0)); grp.position.set(cx, 0, pr.y + pr.fh - 0.4); grp.userData.baseZ = pr.fh - 0.4; grp.userData.tall = true; return grp; }
  }
  const card = m3dCard(art.tex, art.wU, art.hU); grp.add(card);
  // objeto alto pegado a un muro o edificio (interiores: el muro del fondo; exteriores: lo que está justo detrás)
  const colF = Math.min(m.w - 1, Math.max(0, Math.floor(cx)));
  const behindSolid = !m.indoor3d && art.hU > 1.2 && pr.y > 0 && m.solid[pr.y - 1] && m.solid[pr.y - 1][colF] && G.props.some(q => (q.type === 'house' || q.type === 'cabildo' || q.type === 'church') && colF >= q.x && colF < q.x + q.fw && pr.y - 1 >= q.y && pr.y - 1 < q.y + q.fh) || (!m.indoor3d && art.hU > 1.2 && pr.y > 0 && m.tiles[pr.y - 1] && SOLID3D[m.tiles[pr.y - 1][colF].name]);
  if ((m.indoor3d && m.wallFront) || behindSolid) {
    const col = colF, d = (pr.y + pr.fh - 0.35) - (m.indoor3d ? (m.wallFront[col] ?? 0) : pr.y);
    if (d < art.hU * Math.sin(P3.cardTilt)) {
      const want = art.hU * Math.cos(P3.pitch - P3.cardTilt); let t = P3.cardTilt, h = art.hU;
      for (; t > 0.04; t -= 0.02) { h = want / Math.cos(P3.pitch - t); if (h * Math.sin(t) <= Math.max(0.15, d - 0.04)) break; }
      card.rotation.x = -t; card.scale.y = h / art.hU;
    }
  }
  const bl = m3dBlob(Math.min(1.6, art.wU * 0.5)); bl.userData.isBlob = true; grp.add(bl); if (art.hU > 1.9) grp.userData.tall = true;
  grp.position.set(cx, 0, pr.y + pr.fh - 0.35); grp.userData.baseZ = pr.fh - 0.35;
  if (pr.type === 'lamp' || pr.type === 'torch' || pr.type === 'campfire' || pr.type === 'candela') {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M3D.glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(pr.type === 'candela' ? 1.4 : 2.2, pr.type === 'candela' ? 1.4 : 2.2, 1); s.position.set(0, art.hU * (pr.type === 'campfire' ? 0.4 : 0.86), 0.1); grp.add(s); M3D.glows.push(s);
    if (m.def.dark || m.indoor3d) { const L = new THREE.PointLight(0xffb060, pr.type === 'candela' ? 4 : 9, pr.type === 'candela' ? 4 : 7, 1.6); L.position.set(0, art.hU * 0.8, 0.3); grp.add(L); }
  }
  if (pr.type === 'timemachine') grp.userData.bob = true;
  return grp;
}
function m3dBuild() {
  const m = G.map; M3D.mapRef = m; M3D.ents.forEach(o => o.grp.parent && o.grp.parent.remove(o.grp)); M3D.ents.clear(); M3D.glows = []; M3D.vis = [];
  m.indoor3d = m.def.rows.some(r => r.includes('T'));
  // borde frontal del muro del fondo (interiores): por columna, la última fila de muro desde arriba
  m.wallFront = []; for (let x = 0; x < m.w; x++) { let y = 0; while (y < m.h && (m.tiles[y][x].name === 'top' || WALL3D[m.tiles[y][x].name])) y++; m.wallFront[x] = y; }
  const s = new THREE.Scene(); M3D.scene = s;
  const sky = new THREE.Color(m.indoor3d ? 0x14101c : 0xbfe3ff); s.background = sky; s.fog = new THREE.Fog(sky, m.indoor3d ? 30 : 22, m.indoor3d ? 60 : 46);
  M3D.hemi = new THREE.HemisphereLight(0xfff4e0, 0x6a7a50, 1.15); s.add(M3D.hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.6); sun.position.set(m.w / 2 + 10, 22, m.h / 2 + 12); sun.target.position.set(m.w / 2, 0, m.h / 2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; const R = Math.max(m.w, m.h) * 0.75; sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 1; sc.far = 90; sun.shadow.bias = -0.0008; sun.shadow.radius = 4;
  s.add(sun); s.add(sun.target); M3D.sun = sun;
  M3D.pl = new THREE.PointLight(0xfff0d0, 0, 10, 1.2); s.add(M3D.pl); // luz alrededor de MG (lugares oscuros)
  // suelo exterior que rodea el mapa (para no ver el vacío en los bordes)
  if (!m.indoor3d) { const big = new THREE.Mesh(new THREE.PlaneGeometry(m.w * 3, m.h * 3), new THREE.MeshLambertMaterial({ color: 0x7a9a58 })); big.rotation.x = -Math.PI / 2; big.position.set(m.w / 2, -0.02, m.h / 2); s.add(big); }
  s.add(m3dGround(m));
  const world = new THREE.Group(); s.add(world); m3dWater(m, world);
  M3D.occGrp = new THREE.Group(); s.add(M3D.occGrp); m3dSolids(m, M3D.occGrp); m3dClumps(m, M3D.occGrp); // lo que puede tapar a MG
  M3D.propGrp = new THREE.Group(); s.add(M3D.propGrp); m3dBuildProps();
  M3D.camPos = null;
}
function m3dBuildProps() {
  const g = M3D.propGrp, m = G.map; while (g.children.length) g.remove(g.children[0]); M3D.glows = [];
  let hi = 0;
  G.props.forEach(pr => {
    if (pr.type === 'house' || pr.type === 'cabildo' || pr.type === 'church') { g.add(m3dBuilding(pr, pr.type === 'house' ? hi++ : 0)); return; }
    const o = m3dProp(pr, m); if (o) { o.userData.pr = pr; g.add(o); }
  });
  M3D.propSig = G.props.map(p => p.type + (p.opts.id || '')).join('|');
  m3dCutAll();
}
// fardos y objetos que se mueven: sigue la posición (con deslizamiento) cada cuadro
function m3dSyncProps() {
  M3D.propGrp.children.forEach(o => {
    const pr = o.userData.pr; if (!pr || o.userData.baseZ === undefined) return;
    let x = pr.x, y = pr.y; if (pr.slide) { const k = Math.min(1, pr.slide.t); x = pr.slide.fx + (pr.x - pr.slide.fx) * k; y = pr.slide.fy + (pr.y - pr.slide.fy) * k; }
    o.position.x = x + pr.fw / 2; o.position.z = y + o.userData.baseZ;
    if (o.userData.bob) o.children[0].position.y = Math.sin(G.t * 2) * 0.08;
  });
}
// --------------------------------------------------------------- personajes
function m3dCharTex(e) {
  const spr = e === G.player ? (CHAR3D[G.outfit] ? G.outfit : 'mg') : e.sprite;
  const C = CHAR3D[spr]; const d = e.dir || 'down';
  if (C) {
    const want = d === 'up' ? C.back : d === 'down' ? C.front : C.side;
    const key = IMG[want] ? want : C.front;
    if (IMG[key]) { const O = m3dOutlined(key); return { tex: O.tex, h: C.h * O.im.height / IMG[key].height, flip: key === C.side && (C.sideLeft ? d === 'right' : d === 'left'), im: O.im }; }
  }
  const sheet = ART.sprites[e.sprite || spr]; if (!sheet) return null;
  const row = DIR_ROW[d] || 0; const fr = spriteFrame(e); const ck = (e.sprite || spr) + ':' + row + ':' + fr;
  M3D.pix = M3D.pix || {}; if (!M3D.pix[ck]) M3D.pix[ck] = m3dCanvasTex(dsSprite(sheet, fr * 16, row * 24, 16, 24, 2), true);
  return { tex: M3D.pix[ck], h: 1.5, flip: false, im: { width: 16, height: 24 } };
}
function m3dEntInfo(e) {
  if (e.horse) {
    const k = e.horse === 'jinete' ? 'b_jinete' : 'b_caballo'; if (!IMG[k]) return null;
    const col = e.horse === 'horseBlack' ? 0x5a5058 : e.horse === 'horseCafe' ? 0xc89a70 : 0xffffff;
    return { tex: m3dTex(k), h: 1.95, flip: e.dir === 'right', im: IMG[k], col };
  }
  if (e.bat) { const k = 'b_murcielago'; if (IMG[k]) return { tex: m3dTex(k), h: 0.6, flip: false, im: IMG[k], fly: 1.4 }; }
  if (e.prop) { const art = m3dPropArt({ type: e.prop, art: ART.props[e.prop], fw: 1, fh: 1, opts: {} }); return art ? { tex: art.tex, h: art.hU, flip: false, im: { width: art.wU, height: art.hU } } : null; }
  return m3dCharTex(e);
}
function m3dSyncEnts() {
  const list = G.ents.filter(e => !e.hidden).concat(G.follower && !G.follower.hidden ? [G.follower] : []).concat(G.player && !G.player.hidden ? [G.player] : []);
  const alive = new Set(); const now = performance.now(), sdt = Math.min(0.1, ((now - (M3D.syncT || now)) / 1000) || 1 / 60); M3D.syncT = now;
  for (const e of list) {
    alive.add(e);
    if (typeof m3dAnimalSync === 'function' && m3dAnimalSync(e, sdt)) continue;
    if (typeof m3dModelSync === 'function' && m3dModelSync(e, sdt)) continue;
    if (M3D.ents.get(e) && (M3D.ents.get(e).modelKey || M3D.ents.get(e).animalKey)) { M3D.scene.remove(M3D.ents.get(e).grp); M3D.ents.delete(e); }
    let o = M3D.ents.get(e); const info = m3dEntInfo(e); if (!info) continue;
    const wU = info.h * info.im.width / info.im.height;
    if (!o || o.tex !== info.tex || Math.abs(o.wU - wU) > 0.01) {
      if (o) M3D.scene.remove(o.grp);
      const grp = new THREE.Group(); const card = m3dCard(info.tex, wU, info.h * P3.charStretch, P3.charTilt); m3dCharStencil(card.material); if (info.col) card.material.color.setHex(info.col); card.userData.keepColor = !!info.col; grp.add(card); grp.add(m3dBlob(e.horse ? 1.2 : 0.55));
      if (e.glow) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M3D.glowTex, color: 0xa0f0ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.set(2, 2, 1); s.position.y = 0.7; grp.add(s); }
      if (e.spirit) { const mm = card.material; mm.transparent = true; mm.opacity = 0.72; mm.color.setHex(0xd8ecff); mm.alphaToCoverage = false; mm.depthWrite = false; card.renderOrder = 6; }
      let sil = null; if (e === G.player || e === G.follower) { sil = new THREE.Mesh(card.geometry, m3dSilMat(info.tex)); sil.rotation.copy(card.rotation); sil.renderOrder = 8; grp.add(sil); }
      M3D.scene.add(grp); o = { grp, card, sil, tex: info.tex, wU }; M3D.ents.set(e, o);
    }
    const m = G.map, ty = Math.round(e.py / 16), tx = Math.round(e.px / 16); const bt = m.tiles[ty - 1] && m.tiles[ty - 1][tx];
    const back = bt && m.solid[ty - 1][tx] && bt.name !== 'tall' && bt.name !== 'maize';
    const X = e.px / 16 + 0.5, Z = e.py / 16 + 0.62 + (back ? 0.22 : 0); // con un sólido detrás se adelanta un poco para no hundirse
    const walk = e.moving || e.walkAnim; const ph = e.moving ? ((e.steps || 0) + e.prog) * Math.PI : G.t * 11 + (e.x * 3 + e.y); // un apoyo por casilla
    o.grp.position.set(X, (info.fly ? info.fly + Math.sin(G.t * 5 + e.x) * 0.15 : 0) + (walk ? Math.abs(Math.sin(ph)) * 0.07 : 0), Z);
    o.card.scale.x = info.flip ? -1 : 1;
    o.card.rotation.z = walk ? Math.sin(ph) * 0.05 : 0;
    o.card.scale.y = walk ? 1 - Math.abs(Math.sin(ph)) * 0.025 : 1 + Math.sin(G.t * 2 + e.x) * 0.008;
    if (o.sil) { o.sil.scale.copy(o.card.scale); o.sil.rotation.z = o.card.rotation.z; }
    if (e.spirit) m3dSpirit(e, o.grp);
  }
  for (const [e, o] of M3D.ents) if (!alive.has(e)) { M3D.scene.remove(o.grp); M3D.ents.delete(e); }
}
// campo de visión de los guardias (ayuda para el sigilo)
function m3dVision() {
  const m = G.map; let n = 0; M3D.vis = M3D.vis || [];
  if (!G.flags.invisible) for (const e of G.ents) {
    if (!e.guard || e.hidden) continue; const [dx, dy] = DIRS[e.dir]; const range = e.guard.range || 4;
    for (let k = 1; k <= range; k++) {
      const x = e.x + dx * k, y = e.y + dy * k; if (!m.solid[y] || m.solid[y][x] === undefined || m.solid[y][x]) break;
      let q = M3D.vis[n]; if (!q) { q = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), M3D.visMat.clone()); q.rotation.x = -Math.PI / 2; q.renderOrder = 2; M3D.scene.add(q); M3D.vis[n] = q; }
      q.visible = true; q.position.set(x + 0.5, 0.05, y + 0.5); q.material.opacity = 0.3 - k * 0.035 + Math.sin(G.t * 6) * 0.04; n++;
    }
  }
  for (let i = n; i < M3D.vis.length; i++) M3D.vis[i].visible = false;
}
// --------------------------------------------------------------- luz según la escena
function m3dMood() {
  const m = G.map; const tint = G.tintOverride || G.tint || m.def.tint;
  const M = { atardecer: [0xffc890, 0x7a5a50, 0xffa060, 0xf4b088, 0.9], noche: [0x7080c0, 0x1a2030, 0x8090ff, 0x1c2440, 0.45], reconquista: [0xd8dce8, 0x5a5a60, 0xe0e4f0, 0xa8b0c0, 0.8], sepia: [0xfff0d0, 0x8a7050, 0xffe0b0, 0xe8d4b0, 1] };
  let k = M[tint] || [0xfff4e0, 0x6a7a50, 0xfff0d8, m.indoor3d ? 0x14101c : 0xbfe3ff, 1];
  const dark = m.def.dark && !G.flags.luz;
  if (dark) k = [0x30304a, 0x101018, 0x404060, 0x06060c, 0.05];
  M3D.hemi.color.setHex(k[0]); M3D.hemi.groundColor.setHex(k[1]); M3D.hemi.intensity = dark ? 0.12 : m.indoor3d ? 1.0 : 1.15;
  M3D.sun.color.setHex(k[2]); M3D.sun.intensity = (m.indoor3d ? 0.8 : 1.6) * k[4];
  if (!m.indoor3d || dark) { M3D.scene.background.setHex(k[3]); M3D.scene.fog.color.setHex(k[3]); }
  const p = G.player; M3D.pl.intensity = dark ? 7 + Math.sin(G.t * 9) * 0.4 : tint === 'noche' ? 2.5 : 0; if (p) M3D.pl.position.set(p.px / 16 + 0.5, 1.4, p.py / 16 + 0.8);
  const night = dark || tint === 'noche' || tint === 'atardecer' || m.indoor3d ? 1 : 0.35; M3D.glows.forEach(s => { s.material.opacity = night * (0.85 + Math.sin(G.t * 3 + s.id) * 0.08); });
  // los recortes siguen el color de la luz (en lugares oscuros, se oscurecen según la distancia a una luz)
  const tc = new THREE.Color(k[0]).lerp(new THREE.Color(0xffffff), dark ? 0 : tint === 'noche' ? 0.12 : tint === 'atardecer' ? 0.35 : 0.45);
  M3D.scene.traverse(o => {
    if (!(o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.map && !o.material.transparent) || o.userData.keepColor) return;
    if (dark) { const wp = o.getWorldPosition(_v3b); const dd = p ? Math.hypot(wp.x - (p.px / 16 + 0.5), wp.z - (p.py / 16 + 0.6)) : 9; const lit = Math.max(0.08, 1 - dd / 6.5); o.material.color.setRGB(lit, lit * 0.95, lit * 0.85); }
    else o.material.color.copy(tc);
  });
}
// --------------------------------------------------------------- cámara y proyección
function m3dCamera() {
  if (G.cine && G.cine.cam) {   // modo cine (tráiler): la toma decide la cámara
    const k = G.cine.cam(G.t), c = M3D.cam; c.fov = k.fov || P3.fov; c.updateProjectionMatrix(); c.position.set(...k.pos); c.lookAt(...k.look); c.updateMatrixWorld(); return;
  } else if (M3D.cam && M3D.cam.fov !== P3.fov) { M3D.cam.fov = P3.fov; M3D.cam.updateProjectionMatrix(); }
  if (G.scene === 'title' || G.scene === 'instr') {   // portada: la cámara gira lento alrededor de la pileta
    const a = Math.sin(G.t * 0.15) * 0.3 + 0.35, cx = 15.6, cz = 18.2, dist = 9.5, el = 0.42, c = M3D.cam;
    c.position.set(cx + Math.sin(a) * Math.cos(el) * dist, 0.6 + Math.sin(el) * dist, cz + Math.cos(a) * Math.cos(el) * dist); c.lookAt(cx, 1.6, cz); c.updateMatrixWorld(); return;
  }
  const p = G.player, m = G.map; const dist = m.indoor3d ? Math.max(14, (m.h + 1.2) / 2 / 0.31) : P3.dist;
  const hw = 6.5 * dist / 16, hh = 3.5 * dist / 16;
  let tx = m.w <= hw * 2 + 1 ? m.w / 2 : clamp(p.px / 16 + 0.5, hw, m.w - hw);
  let tz = m.indoor3d ? (m.h - 0.9) / 2 + 0.55 : m.h <= hh * 2 + 3 ? m.h / 2 + 0.6 : clamp(p.py / 16 + 0.5, hh, m.h - 2.5);
  if (G.camFocus) { tx = G.camFocus.x; tz = G.camFocus.z; }   // escenas que encuadran otro punto (el final en la cumbre)
  const now = performance.now(), cdt = Math.min(0.1, ((now - (M3D.camT || now)) / 1000) || 1 / 60); M3D.camT = now; const ck = 1 - Math.pow(0.88, cdt * 60);
  if (!M3D.camPos) M3D.camPos = { x: tx, z: tz }; else { M3D.camPos.x += (tx - M3D.camPos.x) * ck; M3D.camPos.z += (tz - M3D.camPos.z) * ck; }
  const c = M3D.cam, cp = M3D.camPos; let sx = 0, sz = 0; if (G.shake > 0) { sx = (Math.random() - 0.5) * 0.15; sz = (Math.random() - 0.5) * 0.15; }
  c.position.set(cp.x + sx, Math.sin(P3.pitch) * dist, cp.z + Math.cos(P3.pitch) * dist + sz); c.lookAt(cp.x + sx, 0, cp.z + sz); c.updateMatrixWorld();
}
const _v3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
const _v3b = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
function m3dProject(x, y, z) { _v3.set(x, y, z).project(M3D.cam); return { x: (_v3.x + 1) / 2 * W, y: (1 - _v3.y) / 2 * H, on: _v3.z < 1 }; }
const _ray = typeof THREE !== 'undefined' ? new THREE.Raycaster() : null;
// --------------------------------------------------------------- transparencia moderna (v4)
// Lo que tapa a MG (o a Nemo) se vuelve translúcido COMPLETO con un tramado fino (screen-door): sin ordenar
// transparencias, las sombras siguen enteras y no hay círculos. Se detecta con rayos desde la cámara a la cabeza,
// el pecho y los pies; en los dibujos se ignoran las partes transparentes de la imagen. Rocas y muros (instanciados)
// se transparentan por bloque. Lo que sigue tapado se ve como silueta azul.
const FADE_MAX = 0.68;
function m3dCutPatch(mat) {
  if (!mat || mat.userData.cut) return mat && mat.userData.fadeU; mat.userData.cut = true;
  mat.stencilWrite = true; mat.stencilRef = 1; mat.stencilFunc = THREE.AlwaysStencilFunc; mat.stencilZPass = THREE.ReplaceStencilOp;
  const U = { value: 0 }; mat.userData.fadeU = U;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, rr) => {
    if (prev) prev(sh, rr);
    sh.uniforms.uFade = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vFade;\n#ifdef USE_INSTANCING\nattribute float aFade;\n#endif')
      .replace('#include <project_vertex>', '#include <project_vertex>\n#ifdef USE_INSTANCING\n vFade = aFade;\n#else\n vFade = 0.0;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying float vFade; uniform float uFade;
float cutBayer(vec2 p) { ivec2 q = ivec2(mod(p, 4.0)); int i = q.x + q.y * 4;
  float m[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.); return (m[i] + 0.5) / 16.0; }`)
      .replace('void main() {', `void main() {
  float fd = max(uFade, vFade); if (fd > 0.001 && fd > cutBayer(gl_FragCoord.xy)) discard;`);
  };
  const key = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => key() + '|fade'; mat.needsUpdate = true;
  return U;
}
// unidades que se pueden transparentar: grupos (casas, objetos) e instancias (rocas, muros, pastos)
function m3dCutAll() {
  M3D.occ = []; M3D.occTargets = [];
  const unit = (root) => { const us = []; root.traverse(o => { if (!o.isMesh || o.userData.isBlob || o.userData.flat || o.userData.noCut) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { const U = m3dCutPatch(m); if (U && !us.includes(U)) us.push(U); }); o.userData.occUnit = root; }); return us; };
  if (M3D.propGrp) M3D.propGrp.children.forEach(g => { const us = unit(g); if (!us.length) return; g.userData.fadeUs = us; g.userData.fade = 0; M3D.occ.push(g); M3D.occTargets.push(g); });
  if (M3D.occGrp) M3D.occGrp.traverse(o => {
    if (!o.isInstancedMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m3dCutPatch);
    if (!o.geometry.getAttribute('aFade')) { const a = new THREE.InstancedBufferAttribute(new Float32Array(o.count), 1); a.setUsage(THREE.DynamicDrawUsage); o.geometry.setAttribute('aFade', a); }
    o.userData.inst = true; o.userData.want = new Map(); M3D.occ.push(o); M3D.occTargets.push(o);
  });
}
// ¿el rayo pegó en una parte visible del dibujo? (alfa de la textura en ese punto)
const ALPHA_CACHE = new Map();
function m3dOpaqueAt(hit) {
  const m = hit.object.material; const tex = m && !Array.isArray(m) && m.map; if (!tex || !hit.uv || !m.alphaTest) return true;
  const im = tex.image; if (!im || !im.width) return true;
  let a = ALPHA_CACHE.get(im);
  if (!a) { const cv = mkCanvas(64, 64), cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, 64, 64); try { a = cx.getImageData(0, 0, 64, 64).data; } catch (e) { a = null; } ALPHA_CACHE.set(im, a || false); }
  if (!a) return true;
  const u = Math.min(63, Math.max(0, Math.floor(hit.uv.x * 64))), v = Math.min(63, Math.max(0, Math.floor((1 - hit.uv.y) * 64)));
  return a[(v * 64 + u) * 4 + 3] > 90;
}
const _cv = new THREE.Vector3(), _dir = new THREE.Vector3(), _m4 = new THREE.Matrix4(), _p3 = new THREE.Vector3();
function m3dOcclusion() {
  if (!M3D.occ) return;
  const hitG = new Set(), cam = M3D.cam.position;
  M3D.occ.forEach(o => { if (o.userData.inst) o.userData.want.clear(); });
  const who = [G.player, G.follower].filter(e => e && !e.hidden);
  if (G.scene === 'world' && !G.cine) for (const e of who) for (const hy of [0.35, 0.9, 1.45]) {
    _cv.set(e.px / 16 + 0.5, hy, e.py / 16 + 0.6); _dir.copy(_cv).sub(cam); const dist = _dir.length(); _dir.normalize();
    _ray.set(cam, _dir); _ray.far = dist - 0.25; _ray.camera = M3D.cam;
    for (const h of _ray.intersectObjects(M3D.occTargets, true)) {
      const o = h.object;
      if (o.isInstancedMesh) {   // el bloque golpeado y sus vecinos cercanos
        o.getMatrixAt(h.instanceId, _m4); _p3.setFromMatrixPosition(_m4);
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, _m4); const q = _cv.clone().setFromMatrixPosition(_m4); if (Math.abs(q.x - _p3.x) <= 1.01 && Math.abs(q.z - _p3.z) <= 1.01) o.userData.want.set(i, FADE_MAX); }
        continue;
      }
      if (!m3dOpaqueAt(h)) continue;
      const u = o.userData.occUnit; if (u) hitG.add(u);
    }
  }
  const k = 0.18;
  for (const o of M3D.occ) {
    if (o.userData.inst) {
      const a = o.geometry.getAttribute('aFade'); let ch = false;
      for (let i = 0; i < a.count; i++) { const t = o.userData.want.get(i) || 0, v = a.array[i]; if (Math.abs(t - v) > 0.002) { a.array[i] = v + (t - v) * k; ch = true; } else if (v !== t) { a.array[i] = t; ch = true; } }
      if (ch) a.needsUpdate = true;
    } else {
      const t = hitG.has(o) ? FADE_MAX : 0; const v = o.userData.fade = o.userData.fade + (t - o.userData.fade) * k;
      o.userData.fadeUs.forEach(U => { U.value = v < 0.003 ? 0 : v; });
    }
  }
}
// silueta de un personaje tapado: solo se dibuja donde algo está delante (prueba de profundidad invertida)
function m3dSilMat(tex) {
  const m = new THREE.MeshBasicMaterial({ map: tex || null, color: 0x2c4a8a, transparent: true, opacity: 0.5, depthWrite: false, depthFunc: THREE.GreaterDepth, alphaTest: tex ? 0.45 : 0 });
  m.stencilWrite = true; m.stencilWriteMask = 0; m.stencilRef = 1; m.stencilFunc = THREE.EqualStencilFunc; // no se activa con su propio cuerpo
  m.toneMapped = false; return m;
}
// los personajes borran la marca de escenario donde quedan adelante
function m3dCharStencil(m) { m.stencilWrite = true; m.stencilRef = 0; m.stencilFunc = THREE.AlwaysStencilFunc; m.stencilZPass = THREE.ReplaceStencilOp; return m; }
// espíritus (el tío al final): flotan y sueltan estrellitas
function m3dSpirit(e, grp, oscuro) {
  grp.position.y += 0.3 + Math.sin(G.t * 2) * 0.12;
  if (Math.random() < 0.35) G.particles.push({ x: e.px + 8 + (Math.random() - 0.5) * 16, y: e.py + 2 + Math.random() * 6, vx: (Math.random() - 0.5) * 6, vy: -12, life: 1.3, t: 0, col: oscuro ? (Math.random() < 0.5 ? '#5a2a7a' : '#2a0a3a') : (Math.random() < 0.5 ? '#e8f6ff' : '#fff6c0'), star: true });
}

// --------------------------------------------------------------- dibujo por cuadro
// depuración: casillas que bloquean en rojo (?choques en la dirección, o M3D.debug = true)
function m3dDebugGrid() {
  const on = M3D.debug ?? (M3D.debug = /[?&]choques/.test(location.search));
  if (!on) { if (M3D.dbg) M3D.dbg.visible = false; return; }
  const m = G.map, N = m.w * m.h;
  if (!M3D.dbg || M3D.dbg.parent !== M3D.scene || M3D.dbg.count0 < N) {
    const g = new THREE.PlaneGeometry(0.92, 0.92); g.rotateX(-Math.PI / 2);
    M3D.dbg = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0xff2040, transparent: true, opacity: 0.38, depthTest: false }), N); M3D.dbg.count0 = N; M3D.dbg.renderOrder = 9; M3D.scene.add(M3D.dbg);
  }
  const d = M3D.dbg, mx = new THREE.Matrix4(); let n = 0; d.visible = true;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (isSolidAt(x, y, G.player)) { mx.makeTranslation(x + 0.5, 0.06, y + 0.5); d.setMatrixAt(n++, mx); }
  d.count = n; d.instanceMatrix.needsUpdate = true;
}
function m3dDraw() {
  if (!M3D.r) m3dInit();
  if (M3D.mapRef !== G.map) m3dBuild();
  const sig = G.props.map(p => p.type + (p.opts.id || '')).join('|'); if (sig !== M3D.propSig) m3dBuildProps();
  const cap = G.cine ? (G.cine.cap || 8) : 4, RW = W * Math.min(cap, Math.max(2, SCALE)), RH = H * Math.min(cap, Math.max(2, SCALE));
  if (M3D.oc.width !== RW) { M3D.oc.width = RW; M3D.oc.height = RH; }
  const sz = M3D.r.getSize(new THREE.Vector2()); if (sz.x !== RW || sz.y !== RH) M3D.r.setSize(RW, RH, false);
  m3dSyncEnts(); m3dSyncProps(); m3dVision(); m3dMood(); m3dCamera();
  M3D.water.forEach(w => { w.tex.offset.x = G.t * w.speed; w.tex.offset.y = Math.sin(G.t * 0.6) * 0.02; });
  (M3D.falls || []).forEach(t => { t.offset.y = G.t * 0.8; });
  if (typeof m3dPicks === 'function') m3dPicks();
  m3dOcclusion(); m3dDebugGrid();
  M3D.r.render(M3D.scene, M3D.cam);
  const c = M3D.ox; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(M3D.r.domElement, 0, 0);
  c.setTransform(RW / W, 0, 0, RH / H, 0, 0); c.imageSmoothingEnabled = true;
  for (const o of G.map.objs) if (o.sparkle && cond(o.cond) && Math.floor(G.t * 3 + o.x) % 3 === 0) { const q = m3dProject(o.x + 0.5, 0.3, o.y + 0.5); c.fillStyle = '#fffbd0'; c.fillRect(q.x - 1, q.y - 4, 2, 8); c.fillRect(q.x - 4, q.y - 1, 8, 2); }
  for (const q of G.particles) { const a = 1 - q.t / q.life; const s = m3dProject(q.x / 16, 0.6, q.y / 16 + 0.5); c.globalAlpha = a; c.fillStyle = q.col; c.fillRect(s.x, s.y, 2, 2); c.globalAlpha = 1; }
  const tint = G.tintOverride || G.tint; if (tint === 'sepia' || tint === 'tiempo') applyTint(c, tint);
  if (typeof dsAmbient === 'function' && !(G.map.def.dark && !G.flags.luz)) { const dt = Math.min(0.05, G.t - (DS.lastT || G.t)); DS.lastT = G.t; dsAmbient(c, dt); }
  if (typeof dsVignette === 'function') dsVignette(c);
  for (const em of G.emotes) {
    const e = em.e; const o = M3D.ents.get(e); const hh = o && o.card ? o.card.geometry.parameters.height : o && o.modelKey ? MODEL3D[o.modelKey].h : 1.6;
    const q = m3dProject(e.px / 16 + 0.5, hh + 0.35, e.py / 16 + 0.62); const sy = q.y - Math.round(Math.sin(Math.min(1, em.t / 150) * Math.PI) * 3);
    c.fillStyle = '#2a1e2e'; c.fillRect(q.x - 8, sy - 8, 16, 15); c.fillStyle = '#fff'; c.fillRect(q.x - 7, sy - 7, 14, 13); c.fillRect(q.x - 1, sy + 6, 3, 2);
    c.fillStyle = em.kind === '♥' ? '#e84a6a' : '#2a1e2e'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(em.kind, q.x, sy + 0.5); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }
  m3dHintArrow(c);
  DS.out = M3D.oc;
}
function m3dHintArrow(c) {
  if (G.cine) return;
  if (typeof currentHint !== 'function' || G.busy || UI.modal() || G.scene !== 'world' || G.flags.fin) return;
  const h = currentHint(); G.hintNow = h; if (!h) return;
  const p = G.player; if (Math.abs(p.x - h.x) + Math.abs(p.y - h.y) <= 1) return;
  const q = m3dProject(h.x + 0.5, h.ent ? 2.2 : 0.5, h.y + 0.5); const b = Math.sin(G.t * 5) * 2;
  const tri = (x, y, ang, s = 1) => { c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = '#2a1e2e'; c.beginPath(); c.moveTo(0, 7 * s); c.lineTo(-7 * s, -4 * s); c.lineTo(7 * s, -4 * s); c.fill(); c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(0, 5 * s); c.lineTo(-5 * s, -3 * s); c.lineTo(5 * s, -3 * s); c.fill(); c.restore(); };
  if (q.on && q.x > 8 && q.x < W - 8 && q.y > 10 && q.y < H - 6) tri(q.x, q.y + b, 0);
  else { const pp = m3dProject(p.px / 16 + 0.5, 0.8, p.py / 16 + 0.5); const ang = Math.atan2(q.y - pp.y, q.x - pp.x); const ex = clamp(W / 2 + Math.cos(ang) * (W / 2 - 14), 12, W - 12), ey = clamp(H / 2 + Math.sin(ang) * (H / 2 - 14), 12, H - 12); tri(ex + Math.cos(ang) * b, ey + Math.sin(ang) * b, ang - Math.PI / 2, 1.2); }
}
