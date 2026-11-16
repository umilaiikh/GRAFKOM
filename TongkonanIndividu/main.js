import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

THREE.ColorManagement.enabled = false;

// Renderer, scene, kamera 
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1ece0);

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
const HOME = new THREE.Vector3(15, 10, -19);
const TARGET = new THREE.Vector3(0, 5.2, 0);
camera.position.copy(HOME);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(TARGET);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1;
controls.minDistance = 8;
controls.maxDistance = 45;
controls.maxPolarAngle = Math.PI / 2.05;

// Cahaya
scene.add(new THREE.HemisphereLight(0xffffff, 0x7a6648, 0.55 * Math.PI));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.15 * Math.PI);
sun.position.set(10, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
scene.add(sun);

// Tekstur
function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}

const roofTex = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#3f2b19'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = -8; x < w; x += 16) {
    const ox = (y / 16) % 2 ? 8 : 0;
    g.beginPath(); g.arc(x + ox + 8, y, 8, 0, Math.PI);
    g.fillStyle = '#5e432b'; g.fill();
    g.strokeStyle = '#241509'; g.lineWidth = 2; g.stroke();
  }
});
const roofRed = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#a8321f'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6a1b10'; g.lineWidth = 2;
  for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
});
const woodTex = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#a8742f'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7a4f20'; g.lineWidth = 2;
  for (let x = 0; x < w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
}, 3, 1);
const slatTex = tex(64, 64, (g, w, h) => {
  g.fillStyle = '#e6d29c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#b99a5a'; g.lineWidth = 2;
  for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, .8, .8);

// Ornamen belah ketupat
function carve(rx, ry) {
  return tex(128, 128, (g) => {
    g.fillStyle = '#1b1410'; g.fillRect(0, 0, 128, 128);
    const cols = ['#c0302a', '#f2c230', '#f4efe2'];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = i * 32, y = j * 32;
      g.fillStyle = cols[(i + j) % 3];
      g.beginPath();
      g.moveTo(x + 16, y + 4); g.lineTo(x + 28, y + 16);
      g.lineTo(x + 16, y + 28); g.lineTo(x + 4, y + 16);
      g.closePath(); g.fill();
      g.fillStyle = '#1b1410'; g.fillRect(x + 13, y + 13, 6, 6);
    }
  }, rx, ry);
}

// Material
const M = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .85, side: THREE.DoubleSide }, o));
const wood = M({ map: woodTex });
const darkWood = M({ color: 0x6a4524 });
const stone = M({ color: 0x8d8d86 });
const roofMat = M({ map: roofTex });
const innerMat = M({ color: 0x7a5230 });
const red = M({ color: 0xc0302a });

// Rumah
const house = new THREE.Group();
scene.add(house);
function add(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  house.add(m);
  return m;
}

const ground = new THREE.Mesh(new THREE.CircleGeometry(24, 64), new THREE.MeshStandardMaterial({ color: 0xa3ad7e }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Tiang panggung
const FY = 1.9;
for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) for (const z of [-1.2, 0, 1.2]) {
  add(new THREE.BoxGeometry(.45, .2, .45), stone, x, .1, z);
  add(new THREE.CylinderGeometry(.11, .11, 1.65, 12), darkWood, x, 1.02, z);
}
for (const z of [-1.2, 0, 1.2]) add(new THREE.BoxGeometry(5.2, .07, .07), darkWood, 0, .9, z);
for (const z of [-1.2, 1.2]) add(new THREE.BoxGeometry(5.2, .06, .06), darkWood, 0, 1.4, z);
for (const x of [-2.6, -1.3, 0, 1.3, 2.6]) add(new THREE.BoxGeometry(.07, .07, 2.4), darkWood, x, .9, 0);

// Lantai, dinding samping, pita ukiran
add(new THREE.BoxGeometry(6.4, .15, 3.2), wood, 0, FY, 0);
for (const s of [-1, 1]) {
  add(new THREE.BoxGeometry(6, 1.3, .1), wood, 0, 2.6, 1.4 * s);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(6, .45), M({ map: carve(12, 1) }));
  band.position.set(0, 2.85, 1.46 * s);
  house.add(band);
}
// Ujung belakang (-x) lebih rendah, ujung depan (+x) jauh lebih tinggi
const X0 = -1.0, XB = -4.2, XF = 4.6;
function prof(x) {
  const back = x < X0, span = back ? X0 - XB : XF - X0, d = Math.abs(x - X0), u = Math.min(d / span, 1);
  const e = 3.1 + 0.025 * d * d;                    // tinggi tepi atap
  const r = 5.5 + (back ? 0.127 : 0.15) * d * d;    // tinggi bubungan
  return {
    e, h: r - e,
    w: 2.1 - 0.2 * u,                               // setengah lebar atap
    cw: 1.3 * Math.pow(u, 2),                       // lebar bidang datar puncak
    lean: back ? 0 : 0.9 * Math.pow(Math.max(0, (u - .5) / .5), 2) // ujung depan condong ke depan
  };
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const N = 70;
const oL = [], oC = [], oR = [], iL = [], iC = [], iR = [], oA = [], oB = [], iA = [], iB = [];
for (let i = 0; i <= N; i++) {
  const x = XB + (XF - XB) * i / N, p = prof(x), t = .3, xc = x + p.lean;
  oL.push(V(x, p.e, -p.w)); oC.push(V(xc, p.e + p.h, 0)); oR.push(V(x, p.e, p.w));
  oA.push(V(xc, p.e + p.h, -p.cw)); oB.push(V(xc, p.e + p.h, p.cw));
  iA.push(V(xc, p.e + p.h - t, -p.cw)); iB.push(V(xc, p.e + p.h - t, p.cw));
  iL.push(V(x, p.e - t, -p.w)); iC.push(V(xc, p.e + p.h - t, 0)); iR.push(V(x, p.e - t, p.w));
}

const roofMeshes = [];
// Hubungkan dua deret titik jadi jalur segitiga
function ribbon(A, B, mat, um = 16, vm = 4) {
  const pos = [], uv = [], idx = [], n = A.length;
  for (let i = 0; i < n; i++) {
    pos.push(A[i].x, A[i].y, A[i].z, B[i].x, B[i].y, B[i].z);
    const k = i / (n - 1) * um;
    uv.push(k, 0, k, vm);
  }
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.castShadow = m.receiveShadow = true;
  house.add(m);
  roofMeshes.push(m);
}
ribbon(oL, oA, roofMat); ribbon(oA, oB, roofMat, 16, 1); ribbon(oB, oR, roofMat);
ribbon(iL, iA, innerMat, 1, 1); ribbon(iA, iB, innerMat, 1, 1); ribbon(iB, iR, innerMat, 1, 1);
const edgeMat = M({ color: 0xc9b86a });
ribbon(oL, iL, edgeMat, 1, 1); ribbon(oR, iR, edgeMat, 1, 1);
for (const k of [0, N]) ribbon([oL[k], oA[k], oB[k], oR[k]], [iL[k], iA[k], iB[k], iR[k]], darkWood, 1, 1);

// Garis merah
const ridgePts = oC.map((a) => a.clone().add(V(0, .04, 0)));
add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ridgePts), 140, .06, 8), red, 0, 0, 0);

// Dinding segitiga
for (const sx of [-1, 1]) {
  const p = prof(3 * sx);
  const top = p.e + Math.max(0, (p.w - 1.4) / (p.w - p.cw)) * p.h - .3;
  const peak = p.e + p.h - .3;
  const sh = new THREE.Shape();
  sh.moveTo(-1.4, FY); sh.lineTo(1.4, FY); sh.lineTo(1.4, top);
  sh.lineTo(p.cw, peak); sh.lineTo(-p.cw, peak); sh.lineTo(-1.4, top);
  sh.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), M({ map: slatTex, color: 0x7a5a38 }));
  m.position.x = 3 * sx;
  m.rotation.y = Math.PI / 2;
  m.castShadow = true;
  house.add(m);
  for (const [by, bw] of [[2.85, 2.8], [4, 2.5]]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(bw, .5), M({ map: carve(5, 1) }));
    b.position.set(3.02 * sx, by, 0);
    b.rotation.y = Math.PI / 2;
    house.add(b);
  }
}

// Tinggi penyangga atap
house.updateMatrixWorld(true);
for (const [x, z] of [[3.7, -1], [3.7, 1], [-3.5, -1], [-3.5, 1], [3.7, 0]]) {
  let top = 1e9;
  for (const [dx, dz] of [[0, 0], [.07, 0], [-.07, 0], [0, .07], [0, -.07]]) {
    const hit = new THREE.Raycaster(V(x + dx, .5, z + dz), V(0, 1, 0)).intersectObjects(roofMeshes)[0];
    if (hit) top = Math.min(top, hit.point.y);
  }
  top = (top < 1e8 ? top : 5) + .1;
  const h = top - .2;
  add(new THREE.CylinderGeometry(.07, .15, h, 12), darkWood, x, .2 + h / 2, z);
  add(new THREE.BoxGeometry(.5, .2, .5), stone, x, .1, z);
}

// Tangga, pagar kolong
for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(1, .1, .32), wood, .7, .25 + i * .26, -(1.75 + (6 - i) * .3));
for (const x of [.15, 1.25]) add(new THREE.BoxGeometry(.06, .07, 2.5), darkWood, x, 1.2, -2.55).rotation.x = -.7;
for (let x = -2.8; x <= 2.8; x += .37) for (const z of [-1.62, 1.62]) {
  if (!(z < 0 && x > -.1 && x < 1.4)) add(new THREE.BoxGeometry(.1, 1.2, .1), darkWood, x, 1.1, z);
}

// Interaksi
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

document.getElementById('rot').onclick = () => { controls.autoRotate = !controls.autoRotate; };
let isRed = false;
document.getElementById('clr').onclick = () => {
  isRed = !isRed;
  roofMat.map = isRed ? roofRed : roofTex;
  roofMat.needsUpdate = true;
};
document.getElementById('rst').onclick = () => {
  camera.position.copy(HOME);
  controls.target.copy(TARGET);
};

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});