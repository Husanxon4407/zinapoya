// The 3D staircase on the main page (Three.js). Loaded on demand, so it never slows the first paint.
//
// Glassy rounded steps rise into place while the staircase flies in along a curve. Then the learner
// (a warm glowing orb with a light trail) hops up step by step; each step lights up as it lands,
// and reaching the top sends out a ring of light. setPalette() recolours everything for an area.
// Labels are normal HTML positioned over the canvas each frame (onFrame), so they stay crisp
// and translatable.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export const STEP_COUNT = 6;
const STEP_W = 1.05;
const STEP_D = 2.1;
const STEP_H = 0.55;
const ENTRANCE_S = 4.2;
const HOP_S = 0.6;
const REST_S = 0.45;
const TOP_S = 1.9;
const TRAIL = 22;
const MOTES = 90;

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
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = 'stairs3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.4, 13);

  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x1a1030, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(-4, 7, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6aa8ff, 1.4);
  rim.position.set(5, 2, -4);
  scene.add(rim);

  const disposables = [];
  const track = (...items) => {
    disposables.push(...items);
    return items[0];
  };

  // Everything that flies in together.
  const flight = new THREE.Group();
  const stairs = new THREE.Group();
  stairs.rotation.set(0.3, -0.6, 0);
  flight.add(stairs);
  scene.add(flight);

  const totalW = STEP_COUNT * STEP_W;
  const totalH = STEP_COUNT * STEP_H;
  const floorY = -totalH / 2;

  // A glowing stage under the staircase.
  const stageTex = track(radialTexture([
    [0, 'rgba(255,255,255,0.55)'],
    [0.35, 'rgba(255,255,255,0.18)'],
    [1, 'rgba(255,255,255,0)'],
  ]));
  const stageMat = track(new THREE.MeshBasicMaterial({ map: stageTex, color: new THREE.Color(accent), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const stage = new THREE.Mesh(track(new THREE.PlaneGeometry(totalW * 1.9, totalW * 1.9)), stageMat);
  stage.rotation.x = -Math.PI / 2;
  stage.position.y = floorY - 0.02;
  stairs.add(stage);
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
      emissiveIntensity: 0.18,
      roughness: 0.22,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      transparent: true,
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.home = new THREE.Vector3(-totalW / 2 + STEP_W / 2 + i * STEP_W, h / 2 + floorY, 0);
    mesh.position.copy(mesh.userData.home);

    // Bright front edge of each tread (like the lines in the logo).
    const edgeMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    const edge = new THREE.Mesh(track(new THREE.BoxGeometry(STEP_W * 0.86, 0.04, 0.05)), edgeMat);
    edge.position.set(0, h / 2 - 0.035, STEP_D / 2 + 0.005);
    mesh.add(edge);

    const anchor = new THREE.Object3D();
    anchor.position.set(0, h / 2 + 0.36, STEP_D / 2 - 0.2);
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
  const moteMat = track(new THREE.PointsMaterial({ size: 0.12, map: dotTex, color: new THREE.Color(accent), transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
  const motes = new THREE.Points(moteGeo, moteMat);
  stairs.add(motes);

  // Faint far stars.
  const starPos = [];
  for (let i = 0; i < 220; i++) starPos.push((rand(i + 1) - 0.5) * 40, (rand(i + 500) - 0.5) * 26, -12 - rand(i + 900) * 10);
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, track(new THREE.PointsMaterial({ color: 0x9fb6d6, size: 0.035, transparent: true, opacity: 0.55 })));
  scene.add(stars);

  // The learner: orb + glow + its own warm light + a fading trail.
  const glowTex = track(radialTexture([
    [0, 'rgba(255,236,170,1)'],
    [0.22, 'rgba(255,200,80,0.6)'],
    [1, 'rgba(255,190,60,0)'],
  ]));
  const orb = new THREE.Group();
  orb.add(new THREE.Mesh(track(new THREE.SphereGeometry(0.16, 32, 24)), track(new THREE.MeshStandardMaterial({ color: 0xfff1c2, emissive: 0xffc23d, emissiveIntensity: 2.2 }))));
  const glow = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })));
  glow.scale.setScalar(1.3);
  orb.add(glow);
  const orbLight = new THREE.PointLight(0xffc857, 3.5, 4.5, 1.6);
  orb.add(orbLight);
  stairs.add(orb);
  const trailMat = [];
  const trail = [];
  for (let i = 0; i < TRAIL; i++) {
    const m = track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    const s = new THREE.Sprite(m);
    s.scale.setScalar(0.5 * (1 - i / TRAIL) + 0.08);
    stairs.add(s);
    trailMat.push(m);
    trail.push(s);
  }
  const history = [];

  // Ring of light when the learner reaches the top.
  const burstMat = track(new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const burst = new THREE.Mesh(track(new THREE.RingGeometry(0.3, 0.38, 64)), burstMat);
  burst.rotation.x = -Math.PI / 2;
  stairs.add(burst);

  const treadTop = (i) => {
    const s = steps[Math.max(0, Math.min(STEP_COUNT - 1, i))].userData.home;
    return new THREE.Vector3(s.x, s.y + ((i + 1) * STEP_H) / 2 + 0.2, 0.35);
  };
  const groundStart = () => {
    const p = treadTop(0);
    return new THREE.Vector3(p.x - STEP_W * 1.1, floorY + 0.2, p.z);
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
    flight.scale.setScalar(size * (0.08 + 0.92 * Math.pow(p, 1.4)));
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
      return { p, fade: k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1, landed: STEP_COUNT - 1, top: true };
    }
    const from = n === 0 ? groundStart() : treadTop(n - 1);
    const to = treadTop(n);
    const k = clamp01((lt - n * per) / HOP_S);
    const e = easeInOut(k);
    const p = from.clone().lerp(to, e);
    p.y += Math.sin(e * Math.PI) * 0.5;
    return { p, fade: n === 0 ? clamp01(k * 2.5) : 1, landed: k >= 1 ? n : n - 1, top: false };
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
      m.material.emissiveIntensity = 0.18 + pulses[i] * 0.9;
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
      const st = reduced ? { p: treadTop(STEP_COUNT - 1), fade: 1, landed: STEP_COUNT - 1, top: false } : climb(climbT);
      orb.position.copy(st.p);
      orb.visible = true;
      orb.scale.setScalar(Math.max(0.001, st.fade));
      orbLight.intensity = 3.5 * st.fade;
      if (st.landed !== lastHop && st.landed >= 0) {
        pulses[st.landed] = 1;
        active = st.landed;
        if (st.landed === STEP_COUNT - 1 && st.top) {
          burstT = 0;
          burst.position.copy(treadTop(STEP_COUNT - 1));
          burst.position.y -= 0.18;
        }
      }
      if (st.landed < 0) active = -1;
      lastHop = st.landed;
      history.unshift(orb.position.clone());
      if (history.length > TRAIL) history.pop();
      trail.forEach((s, i) => {
        const h = history[i];
        if (!h || reduced) {
          trailMat[i].opacity = 0;
          return;
        }
        s.position.copy(h);
        trailMat[i].opacity = 0.45 * (1 - i / TRAIL) * st.fade;
      });
    } else {
      orb.visible = false;
      trailMat.forEach((m) => (m.opacity = 0));
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
      history.length = 0;
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
