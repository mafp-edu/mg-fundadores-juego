// =====================================================================
//  ANIMALES 3D (Nemo, caballos, el jinete y las mulas) y OBJETOS PARA RECOGER
//  Meshy rigea solo personajes de dos piernas: los animales son modelos sin esqueleto y las patas se mueven
//  con un sombreador (trote en diagonal: delantera izquierda con trasera derecha), más el cuerpo que sube y baja.
// =====================================================================
'use strict';
const ANIMAL3D = {
  nemo: { url: 'assets/modelos/nemo.glb', h: 0.85, leg: 0.42, amp: 0.16, yaw: Math.PI / 2 },
  horse: { url: 'assets/modelos/caballo.glb', h: 1.95, leg: 0.48, amp: 0.13, yaw: Math.PI },
  jinete: { url: 'assets/modelos/jinete.glb', h: 2.3, leg: 0.36, amp: 0.11, yaw: Math.PI },
  mula: { url: 'assets/modelos/mula.glb', h: 1.6, leg: 0.42, amp: 0.12, yaw: Math.PI / 2 }
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
    if (k === 'mula') M3D.propSig = null;   // reconstruye los objetos: las mulas pasan a 3D
  }, undefined, err => { console.warn('animal', k, err); ANI.failed[k] = true; });
}
// patas: los vértices bajo la rodilla se balancean hacia adelante y atrás según su esquina
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
  const U = { uPhase: { value: 0 }, uAmp: { value: 0 }, uLeg: { value: D.size.y * cfg.leg }, uY0: { value: D.box.min.y }, uC: { value: D.c.clone() }, uAx: { value: D.alongX ? 1 : 0 } };
  const extra = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    const map = o.material && o.material.map;
    o.material = new THREE.MeshToonMaterial({ map, gradientMap: m3dToonRamp(), color: tint || 0xffffff }); o.material.toneMapped = false; m3dCharStencil(o.material);
    m3dLegShader(o.material, U); o.castShadow = true; o.frustumCulled = false;
    const om = new THREE.MeshBasicMaterial({ color: 0x2a1a28, side: THREE.BackSide }); m3dCharStencil(om);
    m3dLegShader(om, U, '\n  transformed += normalize(objectNormal) * ' + (0.02 / s).toFixed(4) + ';');
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
  o.A.U.uPhase.value = o.ph; o.A.U.uAmp.value = o.amp * ANIMAL3D[k].amp * o.A.D.size.y;
  o.A.pivot.position.y = moving ? Math.abs(Math.sin(o.ph)) * 0.05 * ANIMAL3D[k].h : Math.sin(G.t * 2 + e.x) * 0.01;
  if (k === 'nemo' && !moving) o.A.pivot.rotation.z = Math.sin(G.t * 9) * 0.03;   // mueve la cola… más o menos
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
