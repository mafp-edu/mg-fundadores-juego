// =====================================================================
//  ANIMALES 3D (Nemo, caballos, el jinete y las mulas) y OBJETOS PARA RECOGER
//  Meshy rigea solo personajes de dos piernas: los animales llegan sin esqueleto. Al cargar se les arma uno en
//  código (m3dAnimalRig): cada vértice recibe pesos de pata (con rodilla), cola y cabeza según su posición, y el
//  sombreador gira esas partes alrededor de sus articulaciones: trote en diagonal, cola que se mueve, cabeza que
//  cabecea y jadeo en reposo. Si algo falla queda el balanceo simple de antes.
// =====================================================================
'use strict';
const ANIMAL3D = {
  // rig: swing = giro de la pata en la cadera (rad), knee = flexión de rodilla, tail = largo de la cola (fracción del
  // largo del cuerpo), tailY = altura mínima de la cola, neck = dónde empieza la cabeza (desde la punta delantera)
  // nemo.glb: modelo de pie (20-nov-2026, desde tres vistas de pie); el sentado quedó en herramientas/originales_3d
  nemo: { url: 'assets/modelos/nemo.glb', h: 0.78, leg: 0.3, amp: 0.16, yaw: Math.PI / 2, rig: { swing: 0.55, knee: 0.9, tail: 0.12, tailY: 0.55, neck: 0.3, wag: 1 } },
  horse: { url: 'assets/modelos/caballo.glb', h: 1.95, leg: 0.48, amp: 0.13, yaw: Math.PI, rig: { swing: 0.42, knee: 0.8, tail: 0.14, tailY: 0.45, neck: 0.3, wag: 0.25 } },
  jinete: { url: 'assets/modelos/jinete.glb', h: 2.3, leg: 0.36, amp: 0.11, yaw: Math.PI, rig: { swing: 0.42, knee: 0.8, tail: 0.14, tailY: 0.3, neck: 0.3, wag: 0.25 } },
  mula: { url: 'assets/modelos/mula.glb', h: 1.6, leg: 0.42, amp: 0.12, yaw: Math.PI / 2, rig: { swing: 0.42, knee: 0.8, tail: 0.12, tailY: 0.45, neck: 0.3, wag: 0.3 } }
};
const ANIMAL_OF = e => e.horse ? (e.horse === 'jinete' ? 'jinete' : 'horse') : (e.sprite === 'nemo' ? 'nemo' : null);
const ANI = { gltf: {}, loading: {}, failed: {} };
function m3dAnimalOk(k) { const c = ANIMAL3D[k]; return c && typeof M3D_MODELOS !== 'undefined' && M3D_MODELOS.includes(c.url.split('/').pop()); }
function m3dAnimalLoad(k) {
  if (ANI.gltf[k] || ANI.loading[k] || ANI.failed[k] || !THREE.GLTFLoader || location.protocol === 'file:') return;
  ANI.loading[k] = true;
  new THREE.GLTFLoader().load(ANIMAL3D[k].url, g => {
    const sc = g.scene; sc.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(sc), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    ANI.gltf[k] = { scene: sc, box, size, c, alongX: size.x >= size.z };
    try { ANI.gltf[k].rig = m3dAnimalRig(k, ANI.gltf[k]); } catch (e) { console.warn('rig', k, e); }
    if (k === 'mula') M3D.propSig = null;   // reconstruye los objetos: las mulas pasan a 3D
  }, undefined, err => { console.warn('animal', k, err); ANI.failed[k] = true; });
}
// esqueleto armado en código: pesos por vértice (atributo aRig = pata, índice de pata, cola, cabeza) y articulaciones
function m3dAnimalRig(k, D) {
  const cfg = ANIMAL3D[k], R = cfg.rig; if (!R) return null;
  const F = new THREE.Vector3(Math.cos(cfg.yaw), 0, Math.sin(cfg.yaw)), L = new THREE.Vector3(-Math.sin(cfg.yaw), 0, Math.cos(cfg.yaw));
  const H = D.size.y, y0 = D.box.min.y, legTop = y0 + H * cfg.leg, kneeY = y0 + H * cfg.leg * 0.5;
  const meshes = []; D.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
  // los pesos se calculan en el espacio de la geometría: solo vale si la malla no trae transformación propia
  if (!meshes.length || meshes.some(o => !o.matrixWorld.equals(new THREE.Matrix4()))) return null;
  let aMin = 1e9, aMax = -1e9; const tmp = new THREE.Vector3();
  meshes.forEach(o => { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { tmp.fromBufferAttribute(P, i).sub(D.c); const a = tmp.dot(F); aMin = Math.min(aMin, a); aMax = Math.max(aMax, a); } });
  const len = aMax - aMin, tailA = aMin + len * R.tail, neckA = aMax - len * R.neck, tailMinY = y0 + H * R.tailY;
  const ss = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  let fs = 0, fn = 0, bs = 0, bn = 0, ty = 0, tn = 0;
  meshes.forEach(o => {
    const P = o.geometry.attributes.position, rig = new Float32Array(P.count * 4);
    for (let i = 0; i < P.count; i++) {
      tmp.fromBufferAttribute(P, i); const y = tmp.y; tmp.sub(D.c); const a = tmp.dot(F), sd = tmp.dot(L);
      const lw = ss(legTop + 0.05 * H, legTop - 0.05 * H, y), front = a > 0, idx = (front ? 0 : 2) + (sd > 0 ? 0 : 1);
      const tw = y > tailMinY ? ss(tailA, tailA - 0.07 * len, a) : 0;
      const hw = ss(neckA, neckA + 0.1 * len, a) * ss(legTop, legTop + 0.15 * H, y);
      rig[i * 4] = lw * (1 - hw); rig[i * 4 + 1] = idx; rig[i * 4 + 2] = tw * (1 - lw); rig[i * 4 + 3] = hw;
      if (y < kneeY) { if (front) { fs += a; fn++; } else { bs += a; bn++; } }
      if (tw > 0.05 && tw < 0.6) { ty += y; tn++; }
    }
    o.geometry.setAttribute('aRig', new THREE.BufferAttribute(rig, 4));
  });
  return { F, L, legTop, kneeY, band: 0.035 * H, hipF: fn ? fs / fn : len * 0.3, hipB: bn ? bs / bn : -len * 0.3,
    tailA, tailY: tn ? ty / tn : legTop + 0.3 * H, neckA, neckY: y0 + H * 0.62, H };
}
function m3dRigShader(mat, U, extra) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
uniform vec3 uF, uL, uC; uniform vec4 uHip, uAng, uKnee, uTail, uNeck; uniform float uBand;
attribute vec4 aRig;
vec2 rot2(vec2 p, vec2 o, float a) { p -= o; float c = cos(a), s = sin(a); return o + vec2(c * p.x - s * p.y, s * p.x + c * p.y); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  { vec3 r = transformed - uC; float al = dot(r, uF), sd = dot(r, uL), yy = transformed.y;
    float li = aRig.y;
    float ang = li < 0.5 ? uAng.x : li < 1.5 ? uAng.y : li < 2.5 ? uAng.z : uAng.w;
    float kn = li < 0.5 ? uKnee.x : li < 1.5 ? uKnee.y : li < 2.5 ? uKnee.z : uKnee.w;
    float hipA = li < 1.5 ? uHip.x : uHip.y;
    if (aRig.x > 0.001) {
      vec2 p = vec2(al, yy);
      float kw = smoothstep(uHip.w + uBand, uHip.w - uBand, yy);
      p = mix(p, rot2(p, vec2(hipA, uHip.w), -kn), kw);
      p = mix(p, rot2(p, vec2(hipA, uHip.z), ang), aRig.x);
      al = p.x; yy = p.y; }
    if (aRig.z > 0.001) { vec2 q = rot2(vec2(al, sd), vec2(uTail.x, 0.0), uTail.z * aRig.z); al = q.x; sd = q.y;
      vec2 q2 = rot2(vec2(al, yy), vec2(uTail.x, uTail.y), uTail.w * aRig.z); al = q2.x; yy = q2.y; }
    if (aRig.w > 0.001) { vec2 q = rot2(vec2(al, yy), vec2(uNeck.x, uNeck.y), uNeck.z * aRig.w); al = q.x; yy = q.y;
      vec2 q2 = rot2(vec2(al, sd), vec2(uNeck.x, 0.0), uNeck.w * aRig.w); al = q2.x; sd = q2.y; }
    transformed = vec3(uC.x, 0.0, uC.z) + uF * al + uL * sd; transformed.y = yy; }` + (extra || ''));
  };
  mat.customProgramCacheKey = () => 'rig' + (extra ? 'o' : '');
}
// patas (respaldo, sin esqueleto): los vértices bajo la rodilla se balancean hacia adelante y atrás según su esquina
function m3dLegShader(mat, U, D, extra) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uPhase, uAmp, uLeg, uY0; uniform vec3 uC; uniform float uAx;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
  { float k = clamp(1.0 - (transformed.y - uY0) / uLeg, 0.0, 1.0); k = k * k;
    float along = mix(transformed.z - uC.z, transformed.x - uC.x, uAx), side = mix(transformed.x - uC.x, transformed.z - uC.z, uAx);
    float ph = uPhase + ((along > 0.0) == (side > 0.0) ? 0.0 : 3.14159);
    float sw = sin(ph) * uAmp * k, up = max(0.0, cos(ph)) * uAmp * 0.45 * k;
    if (uAx > 0.5) transformed.x += sw; else transformed.z += sw; transformed.y += up; }` + (extra || ''));
  };
  mat.customProgramCacheKey = () => 'patas' + (extra ? 'o' : '');
}
function m3dAnimalMake(k, tint) {
  const D = ANI.gltf[k], cfg = ANIMAL3D[k];
  const root = D.scene.clone(true); const s = cfg.h / D.size.y; root.scale.setScalar(s);
  root.position.set(-D.c.x * s, -D.box.min.y * s, -D.c.z * s);
  const RG = D.rig;
  const U = RG ? { uF: { value: RG.F }, uL: { value: RG.L }, uC: { value: D.c.clone() }, uBand: { value: RG.band },
    uHip: { value: new THREE.Vector4(RG.hipF, RG.hipB, RG.legTop + 0.04 * RG.H, RG.kneeY) }, uAng: { value: new THREE.Vector4() }, uKnee: { value: new THREE.Vector4() },
    uTail: { value: new THREE.Vector4(RG.tailA, RG.tailY, 0, 0) }, uNeck: { value: new THREE.Vector4(RG.neckA, RG.neckY, 0, 0) } }
    : { uPhase: { value: 0 }, uAmp: { value: 0 }, uLeg: { value: D.size.y * cfg.leg }, uY0: { value: D.box.min.y }, uC: { value: D.c.clone() }, uAx: { value: D.alongX ? 1 : 0 } };
  const shader = (m, ex) => RG ? m3dRigShader(m, U, ex) : m3dLegShader(m, U, D, ex);
  const extra = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const map = o.material && o.material.map;
    o.material = new THREE.MeshToonMaterial({ map, gradientMap: m3dToonRamp(), color: tint || 0xffffff }); o.material.toneMapped = false; m3dCharStencil(o.material);
    shader(o.material); o.castShadow = true; o.frustumCulled = false;
    const om = new THREE.MeshBasicMaterial({ color: 0x2a1a28, side: THREE.BackSide }); m3dCharStencil(om);
    shader(om, '\n  transformed += normalize(normal) * ' + (0.02 / s).toFixed(4) + ';');
    const ol = new THREE.Mesh(o.geometry, om); ol.position.copy(o.position); ol.quaternion.copy(o.quaternion); ol.scale.copy(o.scale); ol.frustumCulled = false; extra.push([o.parent, ol]);
  });
  extra.forEach(([p, m]) => p.add(m));
  const pivot = new THREE.Group(); pivot.add(root);
  return { pivot, U, D };
}
// ángulo para mirar hacia cada dirección (la cabeza del modelo apunta a +X o +Z según cómo lo armó Meshy)
function m3dAnimalYaw(D, dir, k) {
  const base = { right: 0, up: Math.PI / 2, left: Math.PI, down: -Math.PI / 2 }[dir] ?? -Math.PI / 2;
  return base + (ANIMAL3D[k].yaw ?? (D.alongX ? 0 : -Math.PI / 2));
}
function m3dAnimalSync(e, dt) {
  const k = ANIMAL_OF(e); if (!k || e.hidden || !m3dAnimalOk(k)) return false;
  if (!ANI.gltf[k]) { m3dAnimalLoad(k); return false; }
  let o = M3D.ents.get(e);
  if (!o || o.animalKey !== k) {
    if (o) M3D.scene.remove(o.grp);
    const tint = e.horse === 'horseBlack' ? 0x6a5e66 : e.horse === 'horseCafe' ? 0xc89a70 : null;
    const A = m3dAnimalMake(k, tint), grp = new THREE.Group(); grp.add(A.pivot); grp.add(m3dBlob(k === 'nemo' ? 0.42 : 1.0));
    if (e.glow && M3D.glowTex) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: M3D.glowTex, color: 0xa0f0ff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(1.8, 1.8, 1); sp.position.y = 0.5; grp.add(sp); }
    M3D.scene.add(grp); o = { grp, animalKey: k, A, ang: m3dAnimalYaw(A.D, e.dir, k), ph: 0, amp: 0 }; M3D.ents.set(e, o);
  }
  const moving = e.moving || e.walkAnim, v = moving ? (e.speed || 4) : 0;
  o.grp.position.set(e.px / 16 + 0.5, 0, e.py / 16 + 0.55);
  const want = m3dAnimalYaw(o.A.D, e.dir, k); let da = want - o.ang; da = Math.atan2(Math.sin(da), Math.cos(da)); o.ang += da * (1 - Math.pow(0.0005, dt)); o.A.pivot.rotation.y = o.ang;
  o.amp += ((moving ? 1 : 0) - o.amp) * (1 - Math.pow(0.002, dt));
  o.ph += dt * (moving ? Math.min(14, 4 + v * 1.4) : 2);
  const U = o.A.U, cfg = ANIMAL3D[k];
  if (o.A.D.rig) {
    // trote en diagonal: delantera izquierda con trasera derecha; la rodilla se dobla cuando la pata va hacia adelante
    const R = cfg.rig, A = o.amp * R.swing, K = o.amp * R.knee, ph = o.ph, leg = d => Math.sin(ph + d), kn = d => Math.max(0, Math.cos(ph + d));
    U.uAng.value.set(A * leg(0), A * leg(Math.PI), A * leg(Math.PI), A * leg(0));
    U.uKnee.value.set(K * kn(0), K * kn(Math.PI), K * kn(Math.PI), K * kn(0));
    const feliz = k === 'nemo' ? 1 : 0.4, wagV = moving ? 10 : 13 * feliz + 3;
    U.uTail.value.z = Math.sin(G.t * wagV + e.x) * 0.55 * R.wag * (moving ? 0.6 : 1); U.uTail.value.w = 0.15 * R.wag * (k === 'nemo' ? 1 : 0);
    // cabeza: cabecea al trotar; quieto, jadea (Nemo) o mira alrededor
    U.uNeck.value.z = moving ? Math.sin(ph * 2) * 0.07 : Math.sin(G.t * (k === 'nemo' ? 8 : 1.3) + e.x) * (k === 'nemo' ? 0.025 : 0.05);
    U.uNeck.value.w = moving ? 0 : Math.sin(G.t * 0.7 + e.y) * 0.25 * (1 - o.amp);
    o.A.pivot.position.y = moving ? Math.abs(Math.sin(o.ph)) * 0.035 * cfg.h : 0;
    o.A.pivot.rotation.z = 0;
  } else {
    U.uPhase.value = o.ph; U.uAmp.value = o.amp * cfg.amp * o.A.D.size.y;
    o.A.pivot.position.y = moving ? Math.abs(Math.sin(o.ph)) * 0.05 * cfg.h : Math.sin(G.t * 2 + e.x) * 0.01;
    if (k === 'nemo' && !moving) o.A.pivot.rotation.z = Math.sin(G.t * 9) * 0.03;
  }
  return true;
}

// ------------------------------------------------------------ objetos para recoger: se ven en el suelo
function m3dPicks() {
  const m = G.map; M3D.picks = M3D.picks || new Map();
  if (M3D.picksMap !== m) { M3D.picks.forEach(g => g.parent && g.parent.remove(g)); M3D.picks.clear(); M3D.picksMap = m; }
  const alive = new Set();
  for (const ob of m.objs) {
    if (!ob.show || !IMG[ob.show] || (ob.cond && !cond(ob.cond))) continue;
    alive.add(ob); let g = M3D.picks.get(ob);
    if (!g) {
      g = new THREE.Group(); const im = IMG[ob.show], h = ob.size || 0.95, w = h * im.width / im.height;
      const card = m3dCard(m3dTex(ob.show), w, h, 0.55); card.material.toneMapped = false; g.add(card);
      if (M3D.glowTex) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: M3D.glowTex, color: 0xfff0a0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); sp.scale.set(1.5, 1.5, 1); sp.position.y = h * 0.5; g.add(sp); }
      g.add(m3dBlob(0.35)); M3D.scene.add(g); M3D.picks.set(ob, g);
    }
    const bob = Math.sin(G.t * 3 + ob.x) * 0.08;
    g.position.set(ob.x + (ob.w || 1) / 2, 0.12 + bob, ob.y + 0.6); g.children[0].rotation.z = Math.sin(G.t * 2 + ob.y) * 0.08;
  }
  for (const [ob, g] of M3D.picks) if (!alive.has(ob)) { M3D.scene.remove(g); M3D.picks.delete(ob); }
}
