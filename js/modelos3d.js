// =============================================================== personajes 3D animados (Meshy)
// Modelo con esqueleto, caminata y trote; sombreado de dibujo animado y contorno oscuro para que calce
// con el estilo de Rafael. Si el modelo no carga (o con file://), el personaje sigue como dibujo.
// Ritmo de los pies: cada animación avanza a su ritmo natural, acelerado según la velocidad del personaje
// pero con tope (maxRate), para que las piernas nunca se vean frenéticas. A más velocidad, trote.
const MODEL3D = {
  // clave = vestimenta de MG o sprite del personaje; h = alto en casillas; gaits = animaciones (la primera trae la malla)
  mg: { h: 1.55, outline: 0.02, lean: 0.5, maxRate: { walk: 1.7, run: 1.5 }, runFrom: 6.5,
    gaits: { walk: 'assets/modelos/mg_caminar.glb', run: 'assets/modelos/mg_trotar.glb' } }
};
// todos los personajes con modelo en assets/modelos (<sprite>_caminar.glb); el alto sale de su dibujo (CHAR3D)
const MODEL_ALIAS = { luisa_sin: 'luisa' };
(typeof M3D_MODELOS !== 'undefined' ? M3D_MODELOS : []).forEach(f => {
  const m = f.match(/^(.+)_caminar\.glb$/); if (!m) return; const k = m[1]; if (MODEL3D[k]) return;
  const C = typeof CHAR3D !== 'undefined' && CHAR3D[k]; const h = k.startsWith('mg') ? 1.55 : C ? C.h * 1.02 : 1.75;
  MODEL3D[k] = { h, outline: 0.02, lean: 0.5, maxRate: { walk: 1.7, run: 1.5 }, runFrom: 6.5, gaits: { walk: 'assets/modelos/' + f } };
  if (M3D_MODELOS.includes(k + '_trotar.glb')) MODEL3D[k].gaits.run = 'assets/modelos/' + k + '_trotar.glb';
});
Object.entries(MODEL_ALIAS).forEach(([a, b]) => { if (MODEL3D[b]) MODEL3D[a] = MODEL3D[b]; });
// solo se usan los que existen en assets/modelos (lista generada por herramientas/modelos_lista.py)
const MODEL3D_OK = typeof M3D_MODELOS !== 'undefined' ? new Set(M3D_MODELOS) : null;
const MOD = { gltf: {}, loading: {}, failed: {} };

function m3dModelLoad(key) {
  if (MOD.gltf[key] || MOD.loading[key] || MOD.failed[key] || !THREE.GLTFLoader || location.protocol === 'file:') return;
  MOD.loading[key] = true;
  const cfg = MODEL3D[key], names = Object.keys(cfg.gaits), L = new THREE.GLTFLoader();
  Promise.all(names.map(n => new Promise((ok, ko) => L.load(cfg.gaits[n], ok, undefined, ko))))
    .then(gs => {
      const D = m3dModelPrep(gs[0]); D.gaits = {};
      const hipsOf = sc => { let h = null; sc.traverse(o => { if (!h && /hips/i.test(o.name)) h = o; }); return h; }, h0 = hipsOf(gs[0].scene);
      names.forEach((n, i) => {
        const clip = gs[i].animations[0], hi = hipsOf(gs[i].scene);
        // otro rigeo puede dejar la cadera a otra altura: se corrige para que no se hunda ni flote
        if (i > 0 && h0 && hi) { const dy = h0.position.y - hi.position.y; clip.tracks.forEach(tr => { if (/hips/i.test(tr.name) && /position$/.test(tr.name)) for (let k = 1; k < tr.values.length; k += 3) tr.values[k] += dy; }); }
        D.gaits[n] = m3dClipInfo(gs[i].scene, clip, D);
      });
      MOD.gltf[key] = D;
    })
    .catch(err => { console.warn('modelo', key, err); MOD.failed[key] = true; });
}
function m3dToonRamp() {
  if (MOD.ramp) return MOD.ramp;
  const t = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return (MOD.ramp = t);
}
function m3dOutlineMat(th) {
  const m = new THREE.MeshBasicMaterial({ color: 0x2a1a28, side: THREE.BackSide });
  m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed += normalize(objectNormal) * ' + th.toFixed(4) + ';'); };
  return m;
}
function m3dModelPrep(g) {
  const sc = g.scene; sc.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(sc, true); // preciso: mide la malla con su esqueleto
  return { scene: sc, hgt: Math.max(0.1, box.max.y - box.min.y) };
}
// mide la animación: duración de cada paso (cruces de los pies), largo del paso y la pose más quieta
function m3dClipInfo(sc, clip, D) {
  // en el lugar: se quita el avance horizontal de la cadera (el juego mueve al personaje)
  clip.tracks.forEach(tr => { if (/position$/.test(tr.name) && /hips/i.test(tr.name)) { const v = tr.values; for (let i = 3; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; } } });
  const mixer = new THREE.AnimationMixer(sc); const act = mixer.clipAction(clip); act.play();
  let Lf, Rf; sc.traverse(o => { if (/^left.*foot$/i.test(o.name)) Lf = o; if (/^right.*foot$/i.test(o.name)) Rf = o; }); // (el archivo de trote trae solo el esqueleto)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), N = Math.max(60, Math.round(clip.duration * 40));
  let idleT = 0, bd = 1e9, amp = 0, prev = null; const cross = [];
  if (Lf && Rf) for (let i = 0; i <= N; i++) {
    const t = clip.duration * i / N; mixer.setTime(t); sc.updateMatrixWorld(true); Lf.getWorldPosition(a); Rf.getWorldPosition(b);
    const dz = a.z - b.z, d = Math.hypot(a.x - b.x, dz); amp = Math.max(amp, Math.abs(dz));
    if (d < bd) { bd = d; idleT = t; } if (prev !== null && Math.sign(dz) !== Math.sign(prev)) cross.push(t); prev = dz;
  }
  act.stop(); mixer.uncacheRoot(sc);
  const gaps = cross.slice(1).map((t, i) => t - cross[i]).sort((x, y) => x - y);
  const stepDur = gaps.length ? gaps[gaps.length >> 1] : clip.duration / 2;
  // largo del paso ≈ separación máxima de los pies; velocidad natural en metros del modelo por segundo
  return { clip, idleT, stepDur, stepLen: Math.max(0.05, amp), nat: Math.max(0.05, amp) / stepDur };
}
function m3dModelMake(key, opts = {}) {
  const D = MOD.gltf[key], cfg = MODEL3D[key];
  const root = THREE.SkeletonUtils.clone(D.scene); const k = cfg.h / D.hgt; root.scale.setScalar(k);
  const extra = []; root.updateMatrixWorld(true); const ws = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh) return;
    const m0 = o.material, map = m0 && m0.map;
    o.material = new THREE.MeshToonMaterial({ map, gradientMap: m3dToonRamp() });
    o.material.toneMapped = false; m3dCharStencil(o.material); o.castShadow = !opts.spirit; o.frustumCulled = false;
    if (opts.spirit) { const mm = o.material; mm.color.setHex(0xdce9ff); mm.emissive = new THREE.Color(0x24406a); }   // espíritu: opaco (con transparencia el cuerpo no se dibujaba), pálido y con brillo azul
    if (opts.ghost) { const mm = o.material; mm.transparent = true; mm.opacity = 0.84; mm.color.setHex(0xb49ad8); mm.emissive = new THREE.Color(0x3a1052); }
    if (o.isSkinnedMesh && !opts.spirit) {
      const ol = new THREE.SkinnedMesh(o.geometry, m3dCharStencil(m3dOutlineMat(cfg.outline / o.getWorldScale(ws).x))); ol.bind(o.skeleton, o.bindMatrix); ol.frustumCulled = false; ol.position.copy(o.position); ol.quaternion.copy(o.quaternion); ol.scale.copy(o.scale); extra.push([o.parent, ol]);
      if (!opts.sil) return; const sl = new THREE.SkinnedMesh(o.geometry, m3dSilMat(null)); sl.bind(o.skeleton, o.bindMatrix); sl.frustumCulled = false; sl.renderOrder = 8; sl.position.copy(o.position); sl.quaternion.copy(o.quaternion); sl.scale.copy(o.scale); extra.push([o.parent, sl]);
    }
  });
  extra.forEach(([p, ol]) => p.add(ol));
  const mixer = new THREE.AnimationMixer(root), acts = {};
  for (const n in D.gaits) { const gi = D.gaits[n], a = mixer.clipAction(gi.clip); a.play(); a.timeScale = 0; a.setEffectiveWeight(0); a.time = gi.idleT; acts[n] = { a, gi, w: 0 }; }
  const g0 = D.gaits.walk || D.gaits[Object.keys(D.gaits)[0]], fps = 30, f = Math.round(g0.idleT * fps);
  const idle = mixer.clipAction(THREE.AnimationUtils.subclip(g0.clip, 'quieta', f, f + 1, fps)); idle.play(); idle.timeScale = 0;
  return { root, mixer, acts, idle, k, iw: 1 };
}
const DIR_ANG = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 };
// devuelve true si el personaje se dibuja como modelo (y no como tarjeta)
function m3dModelSync(e, dt) {
  if (e.hidden || e.horse || e.bat || e.prop) return false;
  const key0 = e === G.player ? G.outfit : e.sprite, key = MODEL3D[key0] && MODEL_ALIAS[key0] ? MODEL_ALIAS[key0] : key0; const cfg0 = MODEL3D[key];
  if (!cfg0 || (MODEL3D_OK && !MODEL3D_OK.has(cfg0.gaits.walk.split('/').pop()))) return false;
  if (!MOD.gltf[key]) { m3dModelLoad(key); return false; }
  const cfg = MODEL3D[key];
  let o = M3D.ents.get(e);
  if (!o || o.modelKey !== key) {
    if (o) M3D.scene.remove(o.grp);
    const grp = new THREE.Group(), lean = new THREE.Group(), inst = m3dModelMake(key, { sil: e === G.player || e === G.follower, spirit: !!e.spirit, ghost: key === 'espiritu' || key === 'olvido' }); lean.add(inst.root); grp.add(lean); grp.add(m3dBlob(0.5)); lean.rotation.x = -(cfg.lean || 0); // se inclina hacia la cámara, como las tarjetas
    if (e.glow && M3D.glowTex) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: M3D.glowTex, color: e.spirit ? 0x6a9ad8 : 0xa0f0ff, opacity: e.spirit ? 0.55 : 1, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(e.spirit ? 3.2 : 2.4, e.spirit ? 3.2 : 2.4, 1); sp.position.set(0, e.spirit ? 1.0 : 0.9, e.spirit ? -0.25 : 0); grp.add(sp); }
    M3D.scene.add(grp); o = { grp, modelKey: key, inst, ang: DIR_ANG[e.dir] || 0 }; M3D.ents.set(e, o);
  }
  const I = o.inst;
  o.grp.position.set(e.px / 16 + 0.5, 0, e.py / 16 + 0.55); if (e.spirit) { m3dSpirit(e, o.grp); if (e.jaula) m3dSpirit(e, o.grp, true); } else if (key === 'espiritu' || key === 'olvido') m3dSpirit(e, o.grp, true);
  // giro suave por el camino corto
  const want = DIR_ANG[e.dir] ?? 0; let da = want - o.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
  o.ang += da * (1 - Math.pow(0.0005, dt)); I.root.rotation.y = o.ang;
  // paso: velocidad en casillas/s -> se elige caminata o trote y su ritmo (con tope)
  const moving = e.moving || e.walkAnim; const v = moving ? (e.speed || 4) * (e.accel ?? 1) : 0;
  const gait = moving ? (I.acts.run && v >= cfg.runFrom ? 'run' : (I.acts.walk ? 'walk' : Object.keys(I.acts)[0])) : null;
  const blend = 1 - Math.pow(0.0004, dt); let sum = 0;
  for (const n in I.acts) {
    const A = I.acts[n], tgt = n === gait ? 1 : 0;
    if (A.w < 0.02 && tgt) A.a.time = A.gi.idleT; // arranca desde la pose quieta
    A.w += (tgt - A.w) * blend; sum += A.w;
    if (A.w > 0.01) { const natTiles = A.gi.nat * I.k; const rate = Math.min(cfg.maxRate[n] || 1.5, Math.max(0.8, v / natTiles)); A.a.time = (A.a.time + dt * (tgt ? rate : 1)) % A.gi.clip.duration; }
    A.a.setEffectiveWeight(A.w);
  }
  I.iw = Math.max(0, 1 - sum); I.idle.setEffectiveWeight(I.iw);
  I.mixer.update(0);
  // respiración en reposo
  const br = I.iw * Math.sin(G.t * 2.2) * 0.008; I.root.scale.y = I.root.scale.x * (1 + br);
  return true;
}
