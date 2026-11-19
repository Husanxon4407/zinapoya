// The 3D staircase on the main page (Three.js). Loaded on demand, so it never slows the first paint.
//
// Rounded ceramic-glass steps rise into place while the staircase flies in along a curve. Then the
// learner (a small white figure) hops up step by step: it crouches, jumps, stretches in the air and
// squashes on landing; each step lights up as it lands, and reaching the top sends out a ring of light.
// Studio reflections (RoomEnvironment) and soft real shadows make it read as a real object.
// setPalette() recolours everything for an area.
// Labels are normal HTML positioned over the canvas each frame (onFrame), so they stay crisp
// and translatable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export const STEP_COUNT = 6;
const STEP_W = 1.05;
const STEP_D = 2.1;
const STEP_H = 0.55;
const ENTRANCE_S = 4.2;
const HOP_S = 0.6;
const REST_S = 0.45;
const TOP_S = 1.9;
const MOTES = 60;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t) => 1 + 2.5 * Math.pow(t - 1, 3) + 1.5 * Math.pow(t - 1, 2);
const rand = (i) => {
  const n = Math.sin(i * 127.1) * 43758.5453;
  return n - Math.floor(n);
};

function radialTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {HTMLElement} host  the element the canvas fills
 * @param {{ palette: string[], accent: string, onFrame?: Function, onReady?: Function, reduced?: boolean }} opts
 */
export function createStairsScene(host, { palette, accent = '#a5b4fc', onFrame, onReady, reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'stairs3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.4, 13);

  const disposables = [];
  const track = (...items) => {
    disposables.push(...items);
    return items[0];
  };

  // Soft studio reflections on every surface (what makes plastic look like a real object).
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = track(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
  pmrem.dispose();
  scene.environment = envMap;

  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1030, 0.45));
  const rim = new THREE.DirectionalLight(0x6aa8ff, 1.2);
  rim.position.set(5, 2, -4);
  scene.add(rim);

  // Everything that flies in together.
  const flight = new THREE.Group();
  const stairs = new THREE.Group();
  stairs.rotation.set(0.3, -0.6, 0);
  flight.add(stairs);
  scene.add(flight);

  const totalW = STEP_COUNT * STEP_W;
  const totalH = STEP_COUNT * STEP_H;
  const floorY = -totalH / 2;

  // Warm key light that casts soft shadows (it moves with the staircase).
  const key = new THREE.DirectionalLight(0xfff3e4, 2.4);
  key.position.set(-3.2, 6.5, 4.5);
  key.target.position.set(0, floorY, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  stairs.add(key, key.target);
  let shadowScale = 0;
  const fitShadow = (scale) => {
    if (Math.abs(scale - shadowScale) < 0.01) return;
    shadowScale = scale;
    const r = totalW * 0.95 * scale;
    Object.assign(key.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 0.1, far: 30 * scale + 5 });
    key.shadow.camera.updateProjectionMatrix();
  };

  // A glossy black display stand: its top really reflects the staircase (a second, small render),
  // its side catches the studio light, and a thin rim glows in the area colour.
  const podR = totalW * 0.98;
  const mirror = new Reflector(track(new THREE.CircleGeometry(podR, 96)), {
    clipBias: 0.003,
    textureWidth: 512,
    textureHeight: 512,
    color: 0x3c4552,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = floorY - 0.03;
  stairs.add(mirror);
  disposables.push(mirror.getRenderTarget(), mirror.material);
  const podSide = new THREE.Mesh(
    track(new THREE.CylinderGeometry(podR, podR * 1.015, 0.16, 96, 1, true)),
    track(new THREE.MeshPhysicalMaterial({ color: 0x0a101c, metalness: 0.7, roughness: 0.32, clearcoat: 1, side: THREE.DoubleSide })),
  );
  podSide.position.y = floorY - 0.03 - 0.08;
  stairs.add(podSide);
  const rimMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.85 }));
  const podRim = new THREE.Mesh(track(new THREE.TorusGeometry(podR, 0.012, 8, 128)), rimMat);
  podRim.rotation.x = -Math.PI / 2;
  podRim.position.y = floorY - 0.03;
  stairs.add(podRim);
  // Soft contact shadow right where the steps touch the stand (keeps them from "floating").
  const aoTex = track(radialTexture([
    [0, 'rgba(0,0,0,0.75)'],
    [0.45, 'rgba(0,0,0,0.35)'],
    [1, 'rgba(0,0,0,0)'],
  ]));
  const contact = new THREE.Mesh(
    track(new THREE.PlaneGeometry(totalW * 1.35, STEP_D * 1.9)),
    track(new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false })),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = floorY - 0.022;
  stairs.add(contact);

  // A glowing stage under the staircase.
  const stageTex = track(radialTexture([
    [0, 'rgba(255,255,255,0.55)'],
    [0.35, 'rgba(255,255,255,0.18)'],
    [1, 'rgba(255,255,255,0)'],
  ]));
  const stageMat = track(new THREE.MeshBasicMaterial({ map: stageTex, color: new THREE.Color(accent), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  const stage = new THREE.Mesh(track(new THREE.PlaneGeometry(totalW * 1.9, totalW * 1.9)), stageMat);
  stage.rotation.x = -Math.PI / 2;
  stage.position.y = floorY - 0.02;
  stairs.add(stage);
  const groundMat = track(new THREE.ShadowMaterial({ color: 0x000814, opacity: 0.5, transparent: true, depthWrite: false }));
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(totalW * 2.2, totalW * 2.2)), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = floorY - 0.005;
  ground.receiveShadow = true;
  stairs.add(ground);
  const ringMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
  [1.0, 1.5, 2.0].forEach((r) => {
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(r * totalW * 0.42, r * totalW * 0.42 + 0.025, 96)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = floorY - 0.01;
    stairs.add(ring);
  });

  // The steps.
  const steps = [];
  const anchors = [];
  const pulses = new Array(STEP_COUNT).fill(0);
  const colorNow = [];
  const colorFrom = [];
  const colorTo = [];
  for (let i = 0; i < STEP_COUNT; i++) {
    const h = (i + 1) * STEP_H;
    const geo = track(new RoundedBoxGeometry(STEP_W * 0.96, h, STEP_D, 4, 0.08));
    const c = new THREE.Color(palette[i]);
    colorNow.push(c.clone());
    colorFrom.push(c.clone());
    colorTo.push(c.clone());
    const mat = track(new THREE.MeshPhysicalMaterial({
      color: c,
      emissive: c,
      emissiveIntensity: 0.07,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.38,
      transparent: true,
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.home = new THREE.Vector3(-totalW / 2 + STEP_W / 2 + i * STEP_W, h / 2 + floorY, 0);
    mesh.position.copy(mesh.userData.home);

    // Bright front edge of each tread (like the lines in the logo).
    const edgeMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
    const edge = new THREE.Mesh(track(new THREE.BoxGeometry(STEP_W * 0.86, 0.04, 0.05)), edgeMat);
    edge.position.set(0, h / 2 - 0.035, STEP_D / 2 + 0.005);
    mesh.add(edge);

    const anchor = new THREE.Object3D();
    anchor.position.set(0, h / 2 - 0.27, STEP_D / 2 + 0.02); // on the front of the step, under the tread
    mesh.add(anchor);

    stairs.add(mesh);
    steps.push(mesh);
    anchors.push(anchor);
  }

  // Rising light motes around the staircase.
  const motePos = new Float32Array(MOTES * 3);
  const moteSeed = [];
  for (let i = 0; i < MOTES; i++) {
    moteSeed.push([(rand(i + 3) - 0.5) * totalW * 1.7, rand(i + 70) * 6, (rand(i + 140) - 0.5) * STEP_D * 2.4, 0.15 + rand(i + 210) * 0.35]);
  }
  const moteGeo = track(new THREE.BufferGeometry());
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const dotTex = track(radialTexture([
    [0, 'rgba(255,255,255,1)'],
    [0.3, 'rgba(255,255,255,0.6)'],
    [1, 'rgba(255,255,255,0)'],
  ]));
  const moteMat = track(new THREE.PointsMaterial({ size: 0.07, map: dotTex, color: new THREE.Color(accent), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  const motes = new THREE.Points(moteGeo, moteMat);
  stairs.add(motes);

  // Faint far stars.
  const starPos = [];
  for (let i = 0; i < 220; i++) starPos.push((rand(i + 1) - 0.5) * 40, (rand(i + 500) - 0.5) * 26, -12 - rand(i + 900) * 10);
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, track(new THREE.PointsMaterial({ color: 0x9fb6d6, size: 0.035, transparent: true, opacity: 0.55 })));
  scene.add(stars);

  // The learner: a small white person (head, body, two arms, two legs). Arms swing up and legs tuck
  // during a jump; the body squashes on landing. Faces the way it climbs (+x).
  const figMat = track(new THREE.MeshPhysicalMaterial({ color: 0xf6f7fb, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, transparent: true }));
  const climber = new THREE.Group();
  const bodyPivot = new THREE.Group(); // squash & stretch around the feet
  const limb = (r, len) => track(new THREE.CapsuleGeometry(r, len, 4, 12));
  const part = (geo, x, y, z, parent) => {
    const m = new THREE.Mesh(geo, figMat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const legs = [-0.048, 0.048].map((z) => {
    const hip = new THREE.Group();
    hip.position.set(0, 0.2, z);
    part(limb(0.036, 0.12), 0, -0.1, 0, hip);
    bodyPivot.add(hip);
    return hip;
  });
  part(limb(0.078, 0.13), 0, 0.31, 0, bodyPivot); // body
  part(track(new THREE.SphereGeometry(0.086, 28, 20)), 0.01, 0.52, 0, bodyPivot); // head
  const arms = [-0.105, 0.105].map((z) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.41, z);
    part(limb(0.028, 0.13), 0, -0.085, 0, shoulder);
    bodyPivot.add(shoulder);
    return shoulder;
  });
  climber.add(bodyPivot);
  const orbLight = new THREE.PointLight(0xffd27a, 1.6, 2.6, 1.8);
  orbLight.position.y = 0.35;
  climber.add(orbLight);
  climber.scale.setScalar(1.45);
  stairs.add(climber);
  let landedAt = 0;

  // Ring of light when the learner reaches the top.
  const burstMat = track(new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const burst = new THREE.Mesh(track(new THREE.RingGeometry(0.3, 0.38, 64)), burstMat);
  burst.rotation.x = -Math.PI / 2;
  stairs.add(burst);

  // Where the figure's feet stand on step i.
  const treadTop = (i) => {
    const s = steps[Math.max(0, Math.min(STEP_COUNT - 1, i))].userData.home;
    return new THREE.Vector3(s.x, s.y + ((i + 1) * STEP_H) / 2, 0.35);
  };
  const groundStart = () => {
    const p = treadTop(0);
    return new THREE.Vector3(p.x - STEP_W * 1.1, floorY, p.z);
  };

  // Entrance path in "box units" (-1..1): from small in the upper right, swinging into the middle.
  const curve = new THREE.CatmullRomCurve3(
    [[0.75, 0.8], [0.2, 0.9], [-0.45, 0.45], [-0.35, -0.3], [0.25, -0.45], [0.35, 0.05], [0, 0]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'catmullrom',
    0.5,
  );

  let width = 1;
  let height = 1;
  let hw = 1;
  let hh = 1;
  let entrance = reduced ? 1 : 0;
  let climbT = 0;
  let paused = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let swayT = 0;
  let paletteT = 1;
  let lastHop = -1;
  let burstT = 1;
  let active = reduced ? STEP_COUNT - 1 : -1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const tmp = new THREE.Vector3();

  function layout() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    hh = Math.tan(THREE.MathUtils.degToRad(18)) * camera.position.z;
    hw = (hh * width) / height;
  }

  function place(p) {
    const pt = curve.getPoint(p);
    flight.position.set(pt.x * hw * 0.8, pt.y * hh * 0.8 + hh * 0.06 * p, 0);
    const size = Math.min((hw * 1.3) / totalW, (hh * 0.86) / totalH);
    const scale = size * (0.08 + 0.92 * Math.pow(p, 1.4));
    flight.scale.setScalar(scale);
    fitShadow(scale);
  }

  function climb(t) {
    const per = HOP_S + REST_S;
    const loop = STEP_COUNT * per + TOP_S;
    const lt = t % loop;
    const n = Math.floor(lt / per);
    if (n >= STEP_COUNT) {
      const k = (lt - STEP_COUNT * per) / TOP_S;
      const p = treadTop(STEP_COUNT - 1);
      p.y += Math.abs(Math.sin(k * Math.PI * 3)) * 0.12 * (1 - k);
      return { p, fade: k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1, landed: STEP_COUNT - 1, top: true, air: Math.abs(Math.sin(k * Math.PI * 3)) * (1 - k), crouch: 0 };
    }
    const from = n === 0 ? groundStart() : treadTop(n - 1);
    const to = treadTop(n);
    const k = clamp01((lt - n * per) / HOP_S);
    const e = easeInOut(k);
    const p = from.clone().lerp(to, e);
    p.y += Math.sin(e * Math.PI) * 0.55;
    // crouch at the end of the rest, just before the next jump
    const rest = lt - n * per - HOP_S;
    const crouch = k >= 1 ? clamp01((rest - (REST_S - 0.18)) / 0.18) : 0;
    return { p, fade: n === 0 ? clamp01(k * 2.5) : 1, landed: k >= 1 ? n : n - 1, top: false, air: k < 1 ? Math.sin(e * Math.PI) : 0, crouch };
  }

  function update(dt) {
    if (!paused && !reduced) {
      if (entrance < 1) entrance = Math.min(1, entrance + dt / ENTRANCE_S);
      if (entrance > 0.72) climbT += dt;
      swayT += dt;
    }
    place(easeInOut(entrance));

    // Colour change (area switch).
    if (paletteT < 1) {
      paletteT = Math.min(1, paletteT + dt / 0.8);
      const e = easeInOut(paletteT);
      for (let i = 0; i < STEP_COUNT; i++) colorNow[i].copy(colorFrom[i]).lerp(colorTo[i], e);
    }

    // Steps rise one after another, and glow when the learner lands.
    steps.forEach((m, i) => {
      const k = clamp01((entrance - 0.1 - i * 0.07) / 0.3);
      const s = reduced ? 1 : easeOutBack(k);
      m.position.y = m.userData.home.y - (1 - s) * 2.4;
      const o = clamp01(k * 1.6);
      m.material.opacity = o;
      m.children[0].material.opacity = 0.9 * o;
      pulses[i] = Math.max(0, pulses[i] - dt * 1.6);
      m.material.color.copy(colorNow[i]);
      m.material.emissive.copy(colorNow[i]);
      m.material.emissiveIntensity = 0.07 + pulses[i] * 0.8;
    });

    // Motes drift up and loop.
    for (let i = 0; i < MOTES; i++) {
      const [x, y0, z, speed] = moteSeed[i];
      const y = ((y0 + swayT * speed) % 6) + floorY;
      motePos[i * 3] = x + Math.sin(swayT * 0.6 + i) * 0.12;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = z;
    }
    moteGeo.attributes.position.needsUpdate = true;
    moteMat.opacity = 0.75 * clamp01((entrance - 0.4) * 3);
    stageMat.opacity = clamp01(entrance * 2);

    // Sway + pointer parallax.
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    stairs.rotation.y = -0.6 + Math.sin(swayT * 0.32) * 0.12 + pointer.x * 0.14;
    stairs.rotation.x = 0.3 + pointer.y * 0.06;
    stars.rotation.y = swayT * 0.004;

    // The learner.
    if (entrance > 0.72 || reduced) {
      const st = reduced ? { p: treadTop(STEP_COUNT - 1), fade: 1, landed: STEP_COUNT - 1, top: false, air: 0, crouch: 0 } : climb(climbT);
      climber.position.copy(st.p);
      climber.scale.setScalar(1.45);
      climber.visible = st.fade > 0.01;
      figMat.opacity = st.fade;
      orbLight.intensity = 1.6 * st.fade;
      if (st.landed !== lastHop && st.landed >= 0) {
        pulses[st.landed] = 1;
        active = st.landed;
        landedAt = climbT;
        if (st.landed === STEP_COUNT - 1 && st.top) {
          burstT = 0;
          burst.position.copy(treadTop(STEP_COUNT - 1));
          burst.position.y += 0.02;
        }
      }
      if (st.landed < 0) active = -1;
      lastHop = st.landed;
      // Squash on landing, crouch before take-off, stretch in the air; lean into the jump.
      const impact = reduced || st.air > 0.05 ? 0 : Math.exp(-(climbT - landedAt) * 14);
      const sy = 1 + 0.16 * st.air - 0.24 * impact - 0.18 * st.crouch;
      bodyPivot.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
      bodyPivot.rotation.z = -0.22 * st.air + 0.1 * st.crouch;
      // arms: swing back while crouching, up and forward in the air; legs tuck forward mid-jump
      arms.forEach((a, i) => {
        a.rotation.z = 1.5 * st.air - 0.7 * st.crouch + (i ? 0.05 : -0.05);
        a.rotation.x = (i ? -1 : 1) * (0.12 + 0.25 * st.air);
      });
      legs.forEach((l, i) => {
        l.rotation.z = 0.75 * st.air * (i ? 1 : 0.8) - 0.15 * st.crouch;
      });
    } else {
      climber.visible = false;
    }

    if (burstT < 1) {
      burstT = Math.min(1, burstT + dt / 1.1);
      burst.scale.setScalar(1 + burstT * 7);
      burstMat.opacity = 0.9 * (1 - burstT);
    } else burstMat.opacity = 0;
  }

  function report() {
    if (!onFrame) return;
    const out = anchors.map((a, i) => {
      a.getWorldPosition(tmp);
      tmp.project(camera);
      return { x: ((tmp.x + 1) / 2) * width, y: ((1 - tmp.y) / 2) * height, o: steps[i].material.opacity * (entrance > 0.5 ? 1 : 0), on: i === active };
    });
    onFrame(out);
  }

  function frame(now) {
    raf = 0;
    // Real clock (slow phones don't get slow motion), never more than a quarter second per jump.
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    renderer.render(scene, camera);
    report();
    if (visible && !(reduced || paused)) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && visible) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  const ro = new ResizeObserver(() => {
    layout();
    kick();
  });
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });
  io.observe(host);
  const onPointer = (ev) => {
    pointer.tx = (ev.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (ev.clientY / window.innerHeight - 0.5) * 2;
  };
  if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

  layout();
  kick();
  onReady?.();

  return {
    setPalette(colors, accentColor) {
      for (let i = 0; i < STEP_COUNT; i++) {
        colorFrom[i].copy(colorNow[i]);
        colorTo[i].set(colors[i]);
      }
      paletteT = reduced ? 1 : 0;
      if (reduced) for (let i = 0; i < STEP_COUNT; i++) colorNow[i].copy(colorTo[i]);
      if (accentColor) {
        stageMat.color.set(accentColor);
        rimMat.color.set(accentColor);
        ringMat.color.set(accentColor);
        moteMat.color.set(accentColor);
      }
      kick();
      if (reduced || paused) {
        last = performance.now();
        frame(last);
      }
    },
    replay() {
      entrance = 0;
      climbT = 0;
      lastHop = -1;
      paused = false;
      kick();
    },
    finish() {
      entrance = 1;
      kick();
    },
    setPaused(p) {
      paused = p;
      if (!p) kick();
      else {
        last = performance.now();
        frame(last);
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      disposables.forEach((d) => d.dispose?.());
      renderer.dispose();
      canvas.remove();
    },
  };
}
