// The 3D staircase on the main page (Three.js). Loaded on demand, so it never slows the first paint.
//
// Steps rise into place one by one while the whole staircase flies in along a curve (like the
// PyroVision Earth), then a glowing orb, the learner, keeps climbing to the top. Text labels on
// the steps are normal HTML positioned over the canvas each frame, so they stay crisp and can be
// translated; this module only reports where each step is on screen (onFrame).
import * as THREE from 'three';

export const STEP_COUNT = 6;
const STEP_W = 1.05; // along the staircase
const STEP_D = 2.1; // depth (how wide a step is to walk on)
const STEP_H = 0.55; // height of each step
const ENTRANCE_S = 4.6;
const CLIMB_HOP_S = 0.62; // one hop up
const CLIMB_REST_S = 0.38; // pause on each step
const COLORS = ['#6366f1', '#5b7cf3', '#4f94f4', '#40aaf2', '#2fbff0', '#22d3ee'];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
// Same deterministic "random" as the PyroVision star field.
const rand = (i) => {
  const n = Math.sin(i * 127.1) * 43758.5453;
  return n - Math.floor(n);
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,220,120,1)');
  grad.addColorStop(0.25, 'rgba(252,196,64,.55)');
  grad.addColorStop(1, 'rgba(252,196,64,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {HTMLElement} host   element the canvas fills (the hero)
 * @param {{ onFrame?: (labels: {x:number,y:number,o:number}[]) => void, onReady?: () => void, reduced?: boolean }} opts
 */
export function createStairsScene(host, { onFrame, onReady, reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = 'hero3d__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.z = 14;

  // Lights: cool space light + a warm light that travels with the orb.
  scene.add(new THREE.AmbientLight(0x7799bd, 1.25));
  const key = new THREE.DirectionalLight(0xe6f3ff, 2.4);
  key.position.set(-3, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x3579c9, 0.9);
  rim.position.set(4, -1, -3);
  scene.add(rim);

  // Faint stars far behind.
  const starPos = [];
  for (let i = 0; i < 260; i++) starPos.push((rand(i + 1) - 0.5) * 40, (rand(i + 500) - 0.5) * 26, -10 - rand(i + 900) * 10);
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0x8cabc9, size: 0.03, transparent: true, opacity: 0.5 }));
  scene.add(stars);

  // `flight` is moved/scaled by the entrance; `stairs` holds the tilt and the gentle sway.
  const flight = new THREE.Group();
  const stairs = new THREE.Group();
  stairs.rotation.set(0.32, -0.62, 0);
  flight.add(stairs);
  scene.add(flight);

  const totalW = STEP_COUNT * STEP_W;
  const totalH = STEP_COUNT * STEP_H;
  const steps = [];
  const anchors = [];
  const disposables = [starGeo, stars.material];
  for (let i = 0; i < STEP_COUNT; i++) {
    const h = (i + 1) * STEP_H;
    const geo = new THREE.BoxGeometry(STEP_W, h, STEP_D);
    const color = new THREE.Color(COLORS[i]);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      roughness: 0.42,
      metalness: 0.08,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const x = -totalW / 2 + STEP_W / 2 + i * STEP_W;
    const y = h / 2 - totalH / 2;
    mesh.userData.home = new THREE.Vector3(x, y, 0);
    mesh.position.copy(mesh.userData.home);

    // The bright tread edge (like the white lines in the logo).
    const edgeGeo = new THREE.BoxGeometry(STEP_W * 0.98, 0.045, 0.06);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.85 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, h / 2 + 0.01, STEP_D / 2);
    mesh.add(edge);

    // Soft outline so the blocks read clearly against the dark.
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.18 }));
    mesh.add(lines);

    // Where the step's label sits: just above the front of the tread.
    const anchor = new THREE.Object3D();
    anchor.position.set(0, h / 2 + 0.34, STEP_D / 2 - 0.15);
    mesh.add(anchor);

    stairs.add(mesh);
    steps.push(mesh);
    anchors.push(anchor);
    disposables.push(geo, mat, edgeGeo, edgeMat, lines.geometry, lines.material);
  }

  // The learner: a small warm orb with a glow sprite and its own light.
  const orb = new THREE.Group();
  const orbGeo = new THREE.SphereGeometry(0.17, 32, 24);
  const orbMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, emissive: 0xfbbf24, emissiveIntensity: 1.4, roughness: 0.3 });
  orb.add(new THREE.Mesh(orbGeo, orbMat));
  const glowTex = glowTexture();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(1.25);
  orb.add(glow);
  const orbLight = new THREE.PointLight(0xffc857, 3.2, 4.5, 1.6);
  orb.add(orbLight);
  stairs.add(orb);
  disposables.push(orbGeo, orbMat, glowTex, glowMat);

  const treadTop = (i) => {
    const s = steps[Math.max(0, Math.min(STEP_COUNT - 1, i))].userData.home;
    return new THREE.Vector3(s.x, s.y + ((i + 1) * STEP_H) / 2 + 0.2, 0.35);
  };
  const groundStart = () => {
    const p = treadTop(0);
    return new THREE.Vector3(p.x - STEP_W, -totalH / 2 + 0.2, p.z);
  };

  // Entrance path: from small in the upper right, swinging left and down, into place.
  const curve = new THREE.CatmullRomCurve3(
    [[0.86, 0.72], [0.6, 0.78], [0.28, 0.55], [0.24, 0.12], [0.48, -0.34], [0.72, -0.18], [0.36, -0.04]].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    'catmullrom',
    0.5,
  );

  let width = 1;
  let height = 1;
  let hw = 1;
  let hh = 1;
  let mobile = false;
  let entrance = reduced ? 1 : 0; // 0..1
  let climbT = 0; // seconds into the climb loop
  let paused = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let swayT = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const tmp = new THREE.Vector3();

  function layout() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    mobile = width <= 700;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    hh = Math.tan(THREE.MathUtils.degToRad(19)) * camera.position.z;
    hw = (hh * width) / height;
  }

  function place(p) {
    const pt = curve.getPoint(p);
    // Final spot: right of the headline on wide screens, under the text on phones.
    const fx = mobile ? 0 : 0.36;
    const fy = mobile ? -0.5 : -0.04;
    const end = curve.getPoint(1);
    flight.position.set((pt.x + (fx - end.x) * p) * hw, (pt.y + (fy - end.y) * p) * hh, 0);
    const size = mobile ? Math.min((hw * 1.5) / totalW, (hh * 0.62) / totalH) : Math.min((hw * 0.72) / totalW, (hh * 1.05) / totalH);
    flight.scale.setScalar(size * (0.06 + 0.94 * Math.pow(p, 1.5)));
  }

  function climbPosition(t) {
    // Ground → step 1 → … → top, rest, then fade and start again.
    const hops = STEP_COUNT;
    const per = CLIMB_HOP_S + CLIMB_REST_S;
    const loop = hops * per + 1.6;
    const lt = t % loop;
    const n = Math.floor(lt / per);
    if (n >= hops) {
      // At the top: a little bounce and fade before restarting.
      const k = (lt - hops * per) / 1.6;
      const p = treadTop(hops - 1);
      p.y += Math.sin(k * Math.PI * 2) * 0.06;
      return { p, fade: k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1 };
    }
    const from = n === 0 ? groundStart() : treadTop(n - 1);
    const to = treadTop(n);
    const k = clamp01((lt - n * per) / CLIMB_HOP_S);
    const e = easeInOut(k);
    const p = from.clone().lerp(to, e);
    p.y += Math.sin(e * Math.PI) * 0.45; // hop arc
    const fade = n === 0 ? clamp01(k * 2.5) : 1;
    return { p, fade };
  }

  function update(dt) {
    if (!paused && !reduced) {
      if (entrance < 1) entrance = Math.min(1, entrance + dt / ENTRANCE_S);
      if (entrance > 0.75) climbT += dt;
      swayT += dt;
    }
    const e = easeInOut(entrance);
    place(e);

    // Steps rise one after another during the entrance.
    steps.forEach((m, i) => {
      const k = clamp01((entrance - 0.12 - i * 0.07) / 0.32);
      const s = reduced ? 1 : easeOutBack(k);
      m.position.y = m.userData.home.y - (1 - s) * 2.2;
      m.material.opacity = clamp01(k * 1.6);
      m.children.forEach((c) => {
        if (c.material) c.material.opacity = (c.isLineSegments ? 0.18 : 0.85) * clamp01(k * 1.6);
      });
    });

    // Gentle sway + a touch of pointer parallax.
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    stairs.rotation.y = -0.62 + Math.sin(swayT * 0.35) * 0.1 + pointer.x * 0.12;
    stairs.rotation.x = 0.32 + pointer.y * 0.06;
    stars.rotation.y = swayT * 0.004;

    // The learner climbing.
    if (entrance > 0.75 || reduced) {
      const { p, fade } = reduced ? { p: treadTop(STEP_COUNT - 1), fade: 1 } : climbPosition(climbT);
      orb.position.copy(p);
      orb.visible = true;
      orb.scale.setScalar(Math.max(0.001, fade));
      orbLight.intensity = 3.2 * fade;
    } else {
      orb.visible = false;
    }
  }

  function report() {
    if (!onFrame) return;
    const out = anchors.map((a, i) => {
      a.getWorldPosition(tmp);
      tmp.project(camera);
      return {
        x: ((tmp.x + 1) / 2) * width,
        y: ((1 - tmp.y) / 2) * height,
        o: steps[i].material.opacity * (entrance > 0.55 ? 1 : 0),
      };
    });
    onFrame(out);
  }

  function frame(now) {
    raf = 0;
    // Follow the real clock (so slow phones don't play it in slow motion), but never jump
    // more than a quarter second at once (e.g. after the tab was in the background).
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
  // Stop drawing while the hero is scrolled away (saves battery).
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
    replay() {
      entrance = 0;
      climbT = 0;
      paused = false;
      kick();
    },
    finish() {
      entrance = 1;
      climbT = Math.max(climbT, 0.01);
      kick();
    },
    setPaused(p) {
      paused = p;
      if (!p) kick();
      else {
        // Draw once more so the labels match the frozen picture.
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
