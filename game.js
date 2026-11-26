(function () {
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const END_Z = -13, W = 2.5, H = 3.4;

/* ---------- renderer ---------- */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
const scene = new THREE.Scene();
const BG = 0x0f1311;
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 7, 24);
const camera = new THREE.PerspectiveCamera(72, 1, 0.04, 60);
camera.rotation.order = 'YXZ';
scene.add(camera);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? 100 : 72;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ---------- helpers ---------- */
function tex(w, h, draw, rx, ry) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
  t.anisotropy = 4; return t;
}
function speckle(x, w, h, n, a) {
  for (let i = 0; i < n; i++) {
    x.fillStyle = 'rgba(0,0,0,' + Math.random() * a + ')';
    x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
}
const mat = (t, c) => new THREE.MeshLambertMaterial(t ? { map: t } : { color: c });
function box(w, h, d, m, x, y, z, p) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  o.position.set(x, y, z); (p || scene).add(o); return o;
}
function plane(w, h, m, x, y, z, ry, rx) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  o.position.set(x, y, z); o.rotation.y = ry || 0; o.rotation.x = rx || 0; scene.add(o); return o;
}

/* ---------- textures ---------- */
const greenT = tex(256, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a9bfa6'); g.addColorStop(1, '#8fa68d');
  x.fillStyle = g; x.fillRect(0, 0, w, h); speckle(x, w, h, 500, .08);
}, 5, 1);
const woodT = tex(128, 256, (x, w, h) => {
  x.fillStyle = '#8c4b3a'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#9d5a45'; x.fillRect(12, 14, w - 24, h - 28);
  x.strokeStyle = '#5a2c22'; x.lineWidth = 6; x.strokeRect(12, 14, w - 24, h - 28);
  x.strokeStyle = 'rgba(60,25,18,.25)'; x.lineWidth = 1;
  for (let i = 0; i < 20; i++) { x.beginPath(); x.moveTo(20 + i * 5, 20); x.lineTo(20 + i * 5, h - 20); x.stroke(); }
}, 14, 1);
const floorT = tex(256, 256, (x, w, h) => {
  x.fillStyle = '#c9cdc6'; x.fillRect(0, 0, w, h); speckle(x, w, h, 700, .1);
  x.fillStyle = 'rgba(120,110,95,.12)'; for (let i = 0; i < 6; i++) x.fillRect(Math.random() * w, Math.random() * h, 60, 30);
  x.strokeStyle = '#6f736e'; x.lineWidth = 5; x.strokeRect(0, 0, w, h);
}, 2, 6.5);
const lockT = tex(128, 256, (x, w, h) => {
  x.fillStyle = '#2c52b0'; x.fillRect(0, 0, w, h);
  x.strokeStyle = '#17306e'; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6);
  x.fillStyle = '#10244f'; for (let i = 0; i < 4; i++) x.fillRect(30, 22 + i * 12, 68, 5);
  x.fillStyle = '#d8d8d8'; x.fillRect(w - 28, h * .45, 8, 26);
  x.fillStyle = '#17306e'; x.fillRect(10, h * .8, w - 20, 3); speckle(x, w, h, 150, .12);
});
const ceilT = tex(64, 64, (x, w, h) => { x.fillStyle = '#4a2f28'; x.fillRect(0, 0, w, h); speckle(x, w, h, 80, .2); }, 4, 6);

/* ---------- corridor ---------- */
const len = 16, cz = -5;
const gm = new THREE.MeshLambertMaterial({ map: greenT }), wm = new THREE.MeshLambertMaterial({ map: woodT });
plane(W * 2, len + 1, mat(floorT), 0, 0, cz, 0, -Math.PI / 2);
plane(W * 2, len + 1, mat(ceilT), 0, H, cz, 0, Math.PI / 2);
[-1, 1].forEach(s => {
  plane(len, H - 1.1, gm, s * W, 1.1 + (H - 1.1) / 2, cz, -s * Math.PI / 2);
  plane(len, 1.1, wm, s * (W - .01), .55, cz, -s * Math.PI / 2);
  box(.12, .09, len, mat(null, 0x4b2219), s * (W - .06), 1.14, cz);   // rail
  box(.12, .2, len, mat(null, 0x4b2219), s * (W - .06), H - .1, cz);  // top trim
  plane(.5, len, mat(null, 0x262828), s * 2.0, .01, cz, 0, -Math.PI / 2); // dark floor strip
});
plane(W * 2, H - 1.1, gm, 0, 1.1 + (H - 1.1) / 2, END_Z, 0);
plane(W * 2, 1.1, wm, 0, .55, END_Z + .01, 0);
plane(W * 2, H, gm, 0, H / 2, 3, Math.PI);
// ceiling beams
const beamM = mat(null, 0x3a1f19);
for (let z = 2.5; z > END_Z; z -= 1.6) box(W * 2, .22, .25, beamM, 0, H - .11, z);
[-1.5, 0, 1.5].forEach(x => box(.22, .18, len, beamM, x, H - .09, cz));
// pillar-like wall columns
[-3, -8].forEach(z => [-1, 1].forEach(s => box(.35, H, .5, gm, s * (W - .17), H / 2, z - .5)));

// fluorescent lights
const lampM = new THREE.MeshBasicMaterial({ color: 0xf4fff0 });
const panels = [], dimM = new THREE.MeshBasicMaterial({ color: 0x778877 });
[-1.2, -4.4, -7.6, -10.8].forEach(z => panels.push(box(1.4, .06, .3, lampM, 0, H - .22, z)));
scene.add(new THREE.HemisphereLight(0xdfeee0, 0x2a2420, .45));
const lamps = [-2, -6, -10].map(z => {
  const l = new THREE.PointLight(0xeaffea, .9, 11, 1.6); l.position.set(0, H - .5, z); scene.add(l); return l;
});

// lockers
function locker(s, z) {
  box(.5, 1.9, .42, mat(null, 0x2a4a9a), s * (W - .25), .95 + .02, z);
  const f = plane(.42, 1.9, new THREE.MeshLambertMaterial({ map: lockT }), s * (W - .5 - .003), .97, z, -s * Math.PI / 2);
}
for (let i = 0; i < 5; i++) locker(-1, -4 - i * .42);
for (let i = 0; i < 3; i++) locker(-1, -9.5 - i * .42);
for (let i = 0; i < 4; i++) locker(1, -2 - i * .42);
for (let i = 0; i < 4; i++) locker(1, -7.5 - i * .42);

// classroom door (left wall)
const frameM = mat(null, 0x5a2c22), doorM = mat(null, 0x8a4535);
box(.1, 2.3, 1.15, frameM, -W + .05, 1.15, -1.6);
box(.08, 2.1, .95, doorM, -W + .1, 1.05, -1.6);
box(.02, .4, .4, new THREE.MeshBasicMaterial({ color: 0xffe9a8 }), -W + .16, 1.45, -1.6);
box(.04, .06, .14, mat(null, 0xcccccc), -W + .15, 1.0, -1.25);
// bulletin board
box(.05, .75, 1.0, mat(null, 0x23262a), -W + .03, 1.55, -6.6);
[[-6.85, 1.7, 0xf3f0e8], [-6.5, 1.5, 0xe8d96a], [-6.3, 1.75, 0xeeeeee]].forEach(p =>
  box(.01, .3, .22, new THREE.MeshBasicMaterial({ color: p[2] }), -W + .07, p[1], p[0]));
// banner
const banT = tex(256, 128, (x, w, h) => {
  x.fillStyle = '#7a1d24'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w, h * .55); x.quadraticCurveTo(w / 2, h * 1.1, 0, h * .55); x.fill();
  x.fillStyle = '#f4e9d8'; x.font = 'bold 40px Georgia'; x.textAlign = 'center'; x.fillText('BIGFOOTS', w / 2, h * .5);
});
const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .75), new THREE.MeshLambertMaterial({ map: banT }));
ban.position.set(-W + .04, 2.55, -8.2); ban.rotation.y = Math.PI / 2; scene.add(ban);
// fire alarm box right wall
box(.08, .3, .2, mat(null, 0xaa1a1a), W - .05, 1.4, -6.5);

// end double doors
const edM = mat(null, 0xc4862f);
box(2.1, 2.45, .1, mat(null, 0x4b2219), -.5, 1.22, END_Z + .06);
box(.95, 2.2, .06, edM, -.97, 1.1, END_Z + .13);
box(.95, 2.2, .06, edM, -.03, 1.1, END_Z + .13);
box(.35, .5, .02, new THREE.MeshBasicMaterial({ color: 0xffd78a }), -.97, 1.6, END_Z + .17);
box(.35, .5, .02, new THREE.MeshBasicMaterial({ color: 0xffd78a }), -.03, 1.6, END_Z + .17);

/* ---------- button with cover ---------- */
const BTN = new THREE.Vector3(1.5, 1.35, END_Z + .05);
const console_ = new THREE.Group(); console_.position.copy(BTN); scene.add(console_);
box(.36, .48, .06, mat(null, 0x5a5f66), 0, 0, 0, console_);
box(.30, .04, .01, new THREE.MeshBasicMaterial({ color: 0xe8c020 }), 0, .2, .035, console_);
const btnM = new THREE.MeshLambertMaterial({ color: 0xaa1111, emissive: 0xff1111, emissiveIntensity: .5 });
const btnMesh = new THREE.Mesh(new THREE.CylinderGeometry(.075, .085, .05, 20), btnM);
btnMesh.rotation.x = Math.PI / 2; btnMesh.position.set(0, -.02, .05); console_.add(btnMesh);
const lidPivot = new THREE.Group(); lidPivot.position.set(0, .12, .065); console_.add(lidPivot);
const lid = new THREE.Mesh(new THREE.BoxGeometry(.24, .26, .012),
  new THREE.MeshLambertMaterial({ color: 0xb8dcff, transparent: true, opacity: .38 }));
lid.position.set(0, -.14, .04); lidPivot.add(lid);
const btnLight = new THREE.PointLight(0xff2222, .5, 3.5); btnLight.position.set(0, 0, .35); console_.add(btnLight);

/* ---------- dust ---------- */
const dustN = 140, dustG = new THREE.BufferGeometry(), dp = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { dp[i * 3] = (Math.random() - .5) * 4.5; dp[i * 3 + 1] = Math.random() * 3.2; dp[i * 3 + 2] = 3 - Math.random() * 16; }
dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
scene.add(new THREE.Points(dustG, new THREE.PointsMaterial({ color: 0xffffff, size: .03, transparent: true, opacity: .55 })));

/* ---------- player body (lower body + arms) ---------- */
const cloth = mat(null, 0x555b63), jeans = mat(null, 0x2c3a55), shoe = mat(null, 0xe2e2e2), skin = mat(null, 0xd9a47f);
const body = new THREE.Group(); scene.add(body);
box(.44, .62, .24, cloth, 0, 1.19, .14, body);
const legs = [-1, 1].map(s => {
  const p = new THREE.Group(); p.position.set(s * .11, .9, .06); body.add(p);
  box(.15, .85, .17, jeans, 0, -.425, 0, p);
  box(.14, .09, .3, shoe, 0, -.86, -.07, p);
  return p;
});
function mkArm(s) {
  const g = new THREE.Group(); camera.add(g);
  box(.1, .1, .42, cloth, 0, 0, -.21, g);
  box(.085, .065, .12, skin, 0, 0, -.48, g);
  return g;
}
const armL = mkArm(-1), armR = mkArm(1);
const headLight = new THREE.PointLight(0xfff2e0, .4, 4); camera.add(headLight);
function showBody(v) { body.visible = v; armL.visible = armR.visible = v; }
showBody(false);

/* ---------- state ---------- */
let state = 'menu', t = 0, px = 0, pz = 0, yaw = 0, pitch = 0, camY = 1.62;
let stage = 0, busy = false, reach = 0, lidA = 0, mv = 0, walkP = 0, bobT = 0, nearBtn = false;
const k = { f: 0, b: 0, l: 0, r: 0 };

function reset() {
  px = 0; pz = 0; yaw = 0; pitch = 0; camY = 1.62; stage = 0; busy = false; reach = 0; lidA = 0;
  lidPivot.rotation.x = 0; btnMesh.position.z = .05;
}

/* ---------- update loop ---------- */
function update(dt) {
  t += dt;
  const fl = Math.sin(t * 41) > .985 ? .2 : 1;
  lamps[2].intensity = .9 * fl; panels[3].material = fl < 1 ? dimM : lampM;
  btnM.emissiveIntensity = .4 + .3 * Math.sin(t * 4);
  const dpos = dustG.attributes.position;
  for (let i = 0; i < dustN; i++) { dp[i * 3 + 1] -= dt * .03; if (dp[i * 3 + 1] < 0) dp[i * 3 + 1] = 3.2; }
  dpos.needsUpdate = true;

  if (state === 'menu') {
    camera.position.set(Math.sin(t * .3) * .4, 1.62, 1.6);
    camera.rotation.set(-.03, Math.sin(t * .2) * .22, 0);
    return;
  }

  let moving = 0;
  if (state === 'play' && !busy) {
    let f = k.f - k.b, s = k.r - k.l; const n = Math.hypot(f, s);
    if (n) {
      f /= n; s /= n; const sp = 2.0 * dt, sn = Math.sin(yaw), cs = Math.cos(yaw);
      px += (-sn * f + cs * s) * sp; pz += (-cs * f - sn * s) * sp; moving = 1;
      px = clamp(px, -1.65, 1.65); pz = clamp(pz, END_Z + 1.8, 2.2);
      walkP += dt * 7.5; bobT += dt * 7.5;
    }
  }
  mv += (moving - mv) * Math.min(1, dt * 10);
  legs[0].rotation.x = Math.sin(walkP) * .55 * mv; legs[1].rotation.x = -Math.sin(walkP) * .55 * mv;
  armL.position.set(-.27, -.3 + Math.sin(walkP) * .015 * mv, -.18);
  armL.rotation.set(-.32 + Math.sin(walkP) * .05 * mv, .12, 0);
  armR.position.set(.27 - reach * .12, -.3 + reach * .12, -.18 - reach * .22);
  armR.rotation.set(-.32 + reach * .55 + Math.sin(walkP + 3) * .05 * mv, -.12 - reach * .1, 0);

  body.position.set(px, 0, pz); body.rotation.y = yaw;
  const bob = Math.sin(bobT * 2) * .025 * mv;
  camera.position.set(px, camY + bob, pz); camera.rotation.set(pitch, yaw, 0);

  // proximity prompt
  const d = Math.hypot(px - BTN.x, pz - BTN.z);
  nearBtn = state === 'play' && !busy && stage < 2 && d < 3.4;
  $('ibtn').classList.toggle('glow', nearBtn);
  const pr = $('prompt');
  pr.style.opacity = nearBtn ? 1 : 0;
  pr.textContent = stage === 0 ? 'Press  I  to open the cover' : 'Press  I  to push the button';
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  update(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- tween / story ---------- */
function tween(ms, fn) {
  return new Promise(res => {
    const s = performance.now();
    (function step(n) {
      const p = clamp((n - s) / ms, 0, 1); fn(p * p * (3 - 2 * p));
      p < 1 ? requestAnimationFrame(step) : res();
    })(s);
  });
}
const sub = $('sub'), fade = $('fade');
function say(txt) {
  sub.textContent = txt; sub.style.opacity = 1;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.pitch = .5; u.rate = .75; speechSynthesis.speak(u); } catch (e) {}
}
const hideSub = () => { sub.style.opacity = 0; };

async function startGame() {
  try { const el = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el); } catch (e) {}
  try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  $('menu').classList.add('hidden');
  state = 'intro'; reset(); showBody(false);
  fade.style.transition = 'none'; fade.style.opacity = 1;
  canvas.style.transition = 'none'; canvas.style.filter = 'blur(16px)';
  await sleep(900); say('I wish I was awake...'); await sleep(4200); hideSub(); await sleep(1200);
  void canvas.offsetWidth;
  canvas.style.transition = 'filter 5s ease-out'; canvas.style.filter = 'blur(0px)';
  fade.style.transition = 'opacity 2.5s'; fade.style.opacity = 0;
  await tween(5200, e => {
    camY = .3 + (1.62 - .3) * e; pitch = 1.1 * (1 - e); yaw = Math.sin(e * 6) * .15 * (1 - e);
    showBody(camY > 1.1);
  });
  yaw = 0; pitch = 0; state = 'play'; $('hud').classList.remove('hidden');
}

async function interact() {
  if (!nearBtn || busy) return;
  busy = true;
  if (stage === 0) {
    await tween(450, e => { reach = e; });
    await tween(700, e => { lidA = e; lidPivot.rotation.x = -2.1 * e; });
    await tween(350, e => { reach = 1 - e; });
    stage = 1; busy = false;
  } else if (stage === 1) {
    stage = 2;
    await tween(450, e => { reach = e; });
    await tween(150, e => { btnMesh.position.z = .05 - .025 * e; });
    await sleep(400); $('hud').classList.add('hidden'); $('prompt').style.opacity = 0;
    fade.style.transition = 'opacity 2s'; fade.style.opacity = 1;
    await sleep(2400); say('Now I am awake...'); await sleep(5000); hideSub();
    state = 'end'; $('end').classList.remove('hidden');
  }
}

function toMenu() {
  $('end').classList.add('hidden'); $('hud').classList.add('hidden');
  fade.style.transition = 'none'; fade.style.opacity = 0;
  canvas.style.transition = 'none'; canvas.style.filter = 'none';
  reset(); showBody(false); state = 'menu'; $('menu').classList.remove('hidden');
}

/* ---------- UI ---------- */
function panel(title, text) {
  $('pT').textContent = title; $('pB').innerHTML = text;
  $('menu').classList.add('hidden'); $('panel').classList.remove('hidden');
}
$('bPlay').onclick = startGame;
$('bSet').onclick = () => panel('SETTINGS ⚙', 'Under development 🚧');
$('bDet').onclick = () => panel('GAME DETAILS', 'Made by<br><b>Shan &amp; Rajeen</b>');
$('bBack').onclick = () => { $('panel').classList.add('hidden'); $('menu').classList.remove('hidden'); };
$('bMenu').onclick = toMenu;

/* ---------- controls ---------- */
function hold(id, key) {
  const el = $(id);
  const on = e => { e.preventDefault(); k[key] = 1; el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = e => { e.preventDefault(); k[key] = 0; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, off));
}
hold('up', 'f'); hold('dn', 'b'); hold('lf', 'l'); hold('rt', 'r');
$('ibtn').addEventListener('pointerdown', e => { e.preventDefault(); interact(); });

const map = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', e => { if (map[e.code]) k[map[e.code]] = 1; if (['KeyE', 'KeyI', 'Enter', 'Space'].includes(e.code)) interact(); });
addEventListener('keyup', e => { if (map[e.code]) k[map[e.code]] = 0; });

// drag anywhere on the canvas to look around
let lookId = null, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { if (state !== 'play' || busy || lookId !== null) return; lookId = e.pointerId; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (e.pointerId !== lookId) return;
  yaw -= (e.clientX - lx) * .007; pitch = clamp(pitch - (e.clientY - ly) * .007, -1.5, 1.5); lx = e.clientX; ly = e.clientY;
});
['pointerup', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, e => { if (e.pointerId === lookId) lookId = null; }));
document.addEventListener('contextmenu', e => e.preventDefault());
})();
