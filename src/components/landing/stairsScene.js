// The 3D staircase on the main page (Three.js). Loaded on demand, so it never slows the first paint.
//
// Stone-like steps (fine grain, a lighter top slab with a small overhanging nose, like real stairs)
// rise into place on a glossy black stand while the staircase flies in along a curve. Then the learner,
// a small person in everyday clothes (T-shirt, jeans, shoes), climbs like a person: lifts one knee high, puts the
// foot on the next step, pushes up while the other leg follows and the arms swing; legs alternate.
// At the top it raises both arms. Each step lights up as it is reached.
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
const STEP_S = 1.15; // one step up, from lifting the knee to standing on the next step
const REST_S = 0.15;
const TOP_S = 2.6;
const CAP_H = 0.07; // the lighter top slab of each step
const FIG = 1.7; // the climber's size (its local units: about 1 = its height)
const FIG_H = FIG * 1.05; // the climber's height in scene units
const MOTES = 60;

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeOutBack = (t) => 1 + 2.5 * Math.pow(t - 1, 3) + 1.5 * Math.pow(t - 1, 2);
const smooth = (t) => t * t * (3 - 2 * t);
// Value of a keyframed track at time k (0..1): times[] ascending, vals[] same length, smooth in between.
function track1(times, vals, k) {
  if (k <= times[0]) return vals[0];
  for (let i = 1; i < times.length; i++) {
    if (k <= times[i]) {
      const u = (k - times[i - 1]) / (times[i] - times[i - 1]);
      return vals[i - 1] + (vals[i] - vals[i - 1]) * smooth(u);
    }
  }
  return vals[vals.length - 1];
}

// Fine stone grain (used as colour variation and as bump): small speckles + soft blotches.
function grainTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#808080';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    const x = rand(i + 1) * 256;
    const y = rand(i + 300) * 256;
    const r = 10 + rand(i + 600) * 40;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const v = rand(i + 900) > 0.5 ? 255 : 0;
    grad.addColorStop(0, `rgba(${v},${v},${v},0.08)`);
    grad.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
  }
  const img = g.getImageData(0, 0, 256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand(i * 0.37 + 11) - 0.5) * 46;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1.5);
  return tex;
}
const rand = (i) => {
  const n = Math.sin(i * 127.1) * 43758.5453;
  return n - Math.floor(n);
};

// "Light only" blending for glows on the see-through canvas: adds colour, never touches the canvas
// alpha (plain additive blending also raises the alpha, which shows faded sparks as dark dots).
const GLOW_BLEND = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
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
// autoStart: false = load and warm up now, but wait for start() before anything moves (the page
// starts it together with the typing headline).
export function createStairsScene(host, { palette, accent = '#a5b4fc', onFrame, onReady, reduced = false, autoStart = true } = {}) {
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
  // Lower the staircase a little inside the frame, so the climber's head stays in view at the top.
  stairs.position.y = -FIG_H * 0.4;
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
  key.shadow.mapSize.set(2048, 2048);
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
  const grain = track(grainTexture());
  const capColor = new THREE.Color();
  const white = new THREE.Color(0xffffff);
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
      emissiveIntensity: 0.05,
      roughness: 0.62,
      roughnessMap: grain,
      bumpMap: grain,
      bumpScale: 0.35,
      metalness: 0,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.45,
      transparent: true,
    }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.home = new THREE.Vector3(-totalW / 2 + STEP_W / 2 + i * STEP_W, h / 2 + floorY, 0);
    mesh.position.copy(mesh.userData.home);

    // The top slab (tread): a little lighter and smoother, slightly wider, with a nose that sticks
    // out over the front like real stairs (it throws a thin shadow line on the front face).
    const capMat = track(new THREE.MeshPhysicalMaterial({
      color: c.clone().lerp(white, 0.3),
      roughness: 0.38,
      bumpMap: grain,
      bumpScale: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
      envMapIntensity: 0.6,
      transparent: true,
    }));
    const cap = new THREE.Mesh(track(new RoundedBoxGeometry(STEP_W * 0.99, CAP_H, STEP_D + 0.08, 3, 0.03)), capMat);
    cap.position.set(0, h / 2 + CAP_H / 2 - 0.01, 0.04);
    cap.castShadow = true;
    cap.receiveShadow = true;
    mesh.add(cap);

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
  const moteMat = track(new THREE.PointsMaterial({ size: 0.07, map: dotTex, color: new THREE.Color(accent), transparent: true, opacity: 0.8, depthWrite: false, ...GLOW_BLEND }));
  const motes = new THREE.Points(moteGeo, moteMat);
  stairs.add(motes);

  // Fireworks for the top of the climb: a few rockets rise from the stand and burst into sparks
  // that spread, fall, twinkle and fade. All inside this 3D picture.
  const FW = 4; // fireworks per celebration
  const SPARKS = 90; // sparks per firework
  const fwCount = FW * (SPARKS + 1); // +1 = the rocket
  const fwPos = new Float32Array(fwCount * 3);
  const fwCol = new Float32Array(fwCount * 3);
  const fwVel = new Float32Array(fwCount * 3);
  const fwBase = new Float32Array(fwCount * 3);
  const fwLife = new Float32Array(fwCount);
  const fwAge = new Float32Array(fwCount).fill(99);
  const fwGeo = track(new THREE.BufferGeometry());
  fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
  fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
  // toneMapped: false keeps the sparks bright (the film-look colour curve would dull them)
  const fwMat = track(new THREE.PointsMaterial({ size: 0.3, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, ...GLOW_BLEND }));
  const fireworks = new THREE.Points(fwGeo, fwMat);
  fireworks.frustumCulled = false;
  stairs.add(fireworks);
  const fwPlan = []; // { at, from, to, colors, done, rocketDone }
  const fwColors = () => [new THREE.Color(accent), new THREE.Color(0xffd36b), new THREE.Color(0xffffff), new THREE.Color(0xff5a5f), new THREE.Color(0x6f9bff)];
  let fwPalette = fwColors();
  const tmpC = new THREE.Color();
  function launchFireworks(now) {
    const top = floorY + totalH;
    // burst points: over the lower and middle steps (the empty sky), at different heights
    const spots = [
      [-1.6, top + 0.2, -0.3],
      [0.2, top + 1.1, 0.4],
      [-2.6, top - 0.5, 0.2],
      [1.4, top + 0.5, -0.5],
    ];
    fwPlan.length = 0;
    spots.forEach(([x, y, z], i) => {
      const c1 = fwPalette[(i * 2) % fwPalette.length];
      const c2 = fwPalette[(i * 2 + 1) % fwPalette.length];
      fwPlan.push({ at: now + 0.15 + i * 0.38, from: new THREE.Vector3(x + 0.2, floorY, z), to: new THREE.Vector3(x, y, z), c1, c2, launched: false, burst: false, slot: i });
    });
  }
  function updateFireworks(now, dt) {
    for (const f of fwPlan) {
      const r = f.slot * (SPARKS + 1); // rocket index
      if (!f.launched && now >= f.at) {
        f.launched = true;
        fwAge[r] = 0;
        fwLife[r] = 0.55;
        fwBase[r * 3] = 1;
        fwBase[r * 3 + 1] = 0.85;
        fwBase[r * 3 + 2] = 0.55;
      }
      if (f.launched && !f.burst) {
        const k = Math.min(1, (now - f.at) / 0.55);
        const e = 1 - Math.pow(1 - k, 2);
        fwPos[r * 3] = f.from.x + (f.to.x - f.from.x) * e;
        fwPos[r * 3 + 1] = f.from.y + (f.to.y - f.from.y) * e;
        fwPos[r * 3 + 2] = f.from.z + (f.to.z - f.from.z) * e;
        if (k >= 1) {
          f.burst = true;
          fwAge[r] = 99;
          for (let j = 1; j <= SPARKS; j++) {
            const i = r + j;
            // even spread on a sphere, a little random speed
            const u = rand(i * 3.1 + now) * 2 - 1;
            const a = rand(i * 7.7 + now) * Math.PI * 2;
            const sp = 2.8 + rand(i * 1.9 + now) * 1.4;
            const q = Math.sqrt(1 - u * u);
            fwVel[i * 3] = q * Math.cos(a) * sp;
            fwVel[i * 3 + 1] = u * sp + 0.4;
            fwVel[i * 3 + 2] = q * Math.sin(a) * sp;
            fwPos[i * 3] = f.to.x;
            fwPos[i * 3 + 1] = f.to.y;
            fwPos[i * 3 + 2] = f.to.z;
            tmpC.copy(j % 3 === 0 ? f.c2 : f.c1);
            fwBase[i * 3] = tmpC.r;
            fwBase[i * 3 + 1] = tmpC.g;
            fwBase[i * 3 + 2] = tmpC.b;
            fwAge[i] = 0;
            fwLife[i] = 1.1 + rand(i * 5.3 + now) * 0.7;
          }
        }
      }
    }
    for (let i = 0; i < fwCount; i++) {
      if (fwAge[i] >= fwLife[i]) {
        fwCol[i * 3] = fwCol[i * 3 + 1] = fwCol[i * 3 + 2] = 0;
        continue;
      }
      fwAge[i] += dt;
      const isRocket = i % (SPARKS + 1) === 0;
      if (!isRocket) {
        const drag = Math.max(0, 1 - 1.8 * dt);
        fwVel[i * 3] *= drag;
        fwVel[i * 3 + 1] = fwVel[i * 3 + 1] * drag - 1.6 * dt; // gravity
        fwVel[i * 3 + 2] *= drag;
        fwPos[i * 3] += fwVel[i * 3] * dt;
        fwPos[i * 3 + 1] += fwVel[i * 3 + 1] * dt;
        fwPos[i * 3 + 2] += fwVel[i * 3 + 2] * dt;
      }
      const life = 1 - fwAge[i] / fwLife[i];
      // bright at first, then fading with a little twinkle
      const glow = isRocket ? 1.4 : 1.6 * Math.pow(life, 1.2) * (0.7 + 0.3 * Math.sin(fwAge[i] * 40 + i));
      fwCol[i * 3] = fwBase[i * 3] * glow;
      fwCol[i * 3 + 1] = fwBase[i * 3 + 1] * glow;
      fwCol[i * 3 + 2] = fwBase[i * 3 + 2] * glow;
    }
    fwGeo.attributes.position.needsUpdate = true;
    fwGeo.attributes.color.needsUpdate = true;
  }

  // Faint far stars.
  const starPos = [];
  for (let i = 0; i < 220; i++) starPos.push((rand(i + 1) - 0.5) * 40, (rand(i + 500) - 0.5) * 26, -12 - rand(i + 900) * 10);
  const starGeo = track(new THREE.BufferGeometry());
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, track(new THREE.PointsMaterial({ color: 0x9fb6d6, size: 0.035, transparent: true, opacity: 0.55 })));
  scene.add(stars);

  // The learner: a small person in everyday clothes, so it never blends into the light steps:
  // warm skin, short dark hair, a blue T-shirt (the logo's blue), dark jeans, dark shoes with light soles.
  // climber = feet on the ground; pelvis holds the legs (hip -> knee -> shoe); torso (leans) holds the
  // chest, neck, head and arms (shoulder -> elbow -> hand). It faces +x, the way it climbs.
  // Forward swing = +z rotation, a bent knee = -z.
  const cloth = (color, extra = {}) => track(new THREE.MeshPhysicalMaterial({ color, roughness: 0.75, sheen: 0.5, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.4), transparent: true, ...extra }));
  const SKIN = cloth(0xd9a07c, { roughness: 0.55, sheen: 0.2 });
  const HAIR = cloth(0x3b2a20, { roughness: 0.6 });
  const SHIRT = cloth(0x2f6bff);
  const JEANS = cloth(0x23324f);
  const SHOE = cloth(0x1c1f27, { roughness: 0.45, sheen: 0, clearcoat: 0.4 });
  const SOLE = cloth(0xe9ebf0, { roughness: 0.6, sheen: 0 });
  const figMats = [SKIN, HAIR, SHIRT, JEANS, SHOE, SOLE];
  const climber = new THREE.Group();
  const capsule = (r, len) => track(new THREE.CapsuleGeometry(r, len, 6, 14));
  const ball = (r) => track(new THREE.SphereGeometry(r, 20, 14));
  const add = (parent, geo, x, y, z, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const HIP_Y = 0.53;
  const pelvis = new THREE.Group();
  pelvis.position.y = HIP_Y;
  climber.add(pelvis);
  add(pelvis, ball(0.075), 0, 0.01, 0, JEANS).scale.set(0.9, 0.7, 1.35);
  const legs = [-0.062, 0.062].map((z) => {
    const hip = new THREE.Group();
    hip.position.set(0, 0, z);
    add(hip, capsule(0.048, 0.17), 0, -0.125, 0, JEANS);
    const knee = new THREE.Group();
    knee.position.y = -0.25;
    add(knee, ball(0.045), 0, 0, 0, JEANS);
    add(knee, capsule(0.041, 0.17), 0, -0.12, 0, JEANS);
    // shoe: dark upper on a light sole
    add(knee, track(new RoundedBoxGeometry(0.135, 0.04, 0.078, 2, 0.018)), 0.037, -0.248, 0, SHOE);
    add(knee, track(new RoundedBoxGeometry(0.14, 0.016, 0.08, 2, 0.007)), 0.038, -0.272, 0, SOLE);
    hip.add(knee);
    pelvis.add(hip);
    return { hip, knee };
  });
  const torso = new THREE.Group();
  pelvis.add(torso);
  add(torso, capsule(0.087, 0.17), 0, 0.16, 0, SHIRT).scale.set(0.8, 1, 1.3);
  add(torso, capsule(0.03, 0.04), 0, 0.33, 0, SKIN);
  const head = add(torso, ball(0.078), 0.012, 0.43, 0, SKIN);
  head.scale.set(1, 1.15, 0.95);
  // short hair: a cap over the top and back of the head
  const hair = add(torso, track(new THREE.SphereGeometry(0.083, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)), 0.0, 0.445, 0, HAIR);
  hair.scale.set(1.02, 1.12, 0.98);
  hair.rotation.z = 0.35; // more hair at the back than over the face
  const arms = [-0.13, 0.13].map((z) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(0, 0.285, z);
    add(shoulder, ball(0.038), 0, 0, 0, SHIRT);
    // short sleeve, then bare arm
    add(shoulder, capsule(0.036, 0.05), 0, -0.05, 0, SHIRT);
    add(shoulder, capsule(0.029, 0.1), 0, -0.12, 0, SKIN);
    const elbow = new THREE.Group();
    elbow.position.y = -0.2;
    add(elbow, ball(0.028), 0, 0, 0, SKIN);
    add(elbow, capsule(0.026, 0.12), 0, -0.085, 0, SKIN);
    add(elbow, ball(0.033), 0.004, -0.18, 0, SKIN);
    shoulder.add(elbow);
    torso.add(shoulder);
    return { shoulder, elbow, side: z > 0 ? 1 : -1 };
  });
  const orbLight = new THREE.PointLight(0xffd27a, 1.2, 2.6, 1.8);
  orbLight.position.set(0.15, 0.6, 0.2);
  climber.add(orbLight);
  climber.scale.setScalar(FIG);
  stairs.add(climber);

  // Ring of light when the learner reaches the top.
  const burstMat = track(new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const burst = new THREE.Mesh(track(new THREE.RingGeometry(0.3, 0.38, 64)), burstMat);
  burst.rotation.x = -Math.PI / 2;
  stairs.add(burst);

  // Where the climber stands on step i: on top of the slab, a little toward the next step.
  const treadTop = (i) => {
    const s = steps[Math.max(0, Math.min(STEP_COUNT - 1, i))].userData.home;
    return new THREE.Vector3(s.x + STEP_W * 0.2, s.y + ((i + 1) * STEP_H) / 2 + CAP_H - 0.01, 0.3);
  };
  const groundStart = () => {
    const p = treadTop(0);
    return new THREE.Vector3(p.x - STEP_W, floorY, p.z);
  };

  // One step up, k = 0..1. "lead" = the leg that goes first (they take turns).
  const T = [0, 0.18, 0.36, 0.62, 0.86, 1];
  const POSE = {
    root: [0, 0, 0.04, 0.62, 1, 1],
    leadHip: [0, 0.8, 1.75, 0.85, 0.08, 0],
    leadKnee: [-0.05, -1.8, -1.95, -0.85, -0.12, -0.05],
    trailHip: [0, 0.02, -0.12, -0.45, 0.55, 0],
    trailKnee: [-0.05, -0.08, -0.12, -0.45, -1.35, -0.05],
    lean: [0.04, 0.12, 0.22, 0.3, 0.12, 0.04],
    armF: [0.05, 0.3, 0.55, 0.7, 0.3, 0.05],
    armB: [-0.05, -0.2, -0.35, -0.5, -0.2, -0.05],
    elbow: [0.18, 0.35, 0.55, 0.75, 0.45, 0.18],
  };
  const pose = (k) => {
    const o = {};
    for (const key of Object.keys(POSE)) o[key] = track1(T, POSE[key], k);
    return o;
  };
  const NEUTRAL = pose(1);
  function applyPose(q, lead, top = 0) {
    const L = legs[lead];
    const R = legs[1 - lead];
    L.hip.rotation.z = q.leadHip;
    L.knee.rotation.z = q.leadKnee;
    R.hip.rotation.z = q.trailHip;
    R.knee.rotation.z = q.trailKnee;
    torso.rotation.z = -q.lean * (1 - top);
    arms.forEach((a, i) => {
      // the arm on the other side from the leading leg swings forward
      const swing = i === 1 - lead ? q.armF : q.armB;
      a.shoulder.rotation.z = swing * (1 - top) + 2.9 * top;
      a.shoulder.rotation.x = -a.side * (0.12 + 0.25 * top);
      a.elbow.rotation.z = q.elbow * (1 - top) + 0.15 * top;
    });
  }

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
  let started = autoStart || reduced;
  let warmed = false;
  let climbT = 0;
  let paused = false;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  let swayT = 0;
  let paletteT = 1;
  let lastHop = -1;
  let burstT = 1;
  let wasTop = false;
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
    flight.position.set(pt.x * hw * 0.8, pt.y * hh * 0.8 + hh * 0.07 * p, 0);
    // Fit the staircase plus the person standing on the top step (and room for the fireworks).
    const size = Math.min((hw * 1.5) / totalW, (hh * 1.05) / (totalH + FIG_H * 0.5));
    const scale = size * (0.08 + 0.92 * Math.pow(p, 1.4));
    flight.scale.setScalar(scale);
    fitShadow(scale);
  }

  function climb(t) {
    const per = STEP_S + REST_S;
    const loop = STEP_COUNT * per + TOP_S;
    const lt = t % loop;
    const n = Math.floor(lt / per);
    if (n >= STEP_COUNT) {
      // At the top: both arms up, a couple of happy bounces, then fade out and start again.
      const k = (lt - STEP_COUNT * per) / TOP_S;
      const p = treadTop(STEP_COUNT - 1);
      p.y += Math.abs(Math.sin(k * Math.PI * 4)) * 0.07 * clamp01(1 - k * 1.4);
      return { p, q: NEUTRAL, lead: 0, top: smooth(clamp01(k * 4)) * clamp01((1 - k) * 4), fade: k > 0.82 ? 1 - (k - 0.82) / 0.18 : 1, landed: STEP_COUNT - 1, atTop: true };
    }
    const from = n === 0 ? groundStart() : treadTop(n - 1);
    const to = treadTop(n);
    const k = clamp01((lt - n * per) / STEP_S);
    const q = pose(k);
    const p = from.clone().lerp(to, q.root);
    // the body dips a touch while the knee is high, then rises with the push
    p.y -= Math.sin(clamp01(k / 0.4) * Math.PI) * 0.03;
    return { p, q, lead: n % 2, top: 0, fade: n === 0 ? clamp01(k * 4) : 1, landed: k >= 0.8 ? n : n - 1, atTop: false };
  }

  function update(dt) {
    if (!paused && !reduced && started) {
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
      m.children[0].material.opacity = o;
      pulses[i] = Math.max(0, pulses[i] - dt * 1.6);
      m.material.color.copy(colorNow[i]);
      m.material.emissive.copy(colorNow[i]);
      m.material.emissiveIntensity = 0.05 + pulses[i] * 0.8;
      capColor.copy(colorNow[i]).lerp(white, 0.3);
      m.children[0].material.color.copy(capColor);
      m.children[0].material.emissive = m.children[0].material.emissive || new THREE.Color();
      m.children[0].material.emissive.copy(colorNow[i]);
      m.children[0].material.emissiveIntensity = pulses[i] * 0.9;
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
      const st = reduced ? { p: treadTop(STEP_COUNT - 1), q: NEUTRAL, lead: 0, top: 0, fade: 1, landed: STEP_COUNT - 1, atTop: false } : climb(climbT);
      climber.position.copy(st.p);
      climber.visible = st.fade > 0.01;
      figMats.forEach((m) => (m.opacity = st.fade));
      orbLight.intensity = 1.2 * st.fade;
      applyPose(st.q, st.lead, st.top);
      if (st.landed !== lastHop && st.landed >= 0) {
        pulses[st.landed] = 1;
        active = st.landed;
      }
      // Arrived at the top: ring of light + fireworks (once per climb).
      if (st.atTop && !wasTop && !reduced) {
        burstT = 0;
        burst.position.copy(treadTop(STEP_COUNT - 1));
        burst.position.y += 0.02;
        launchFireworks(climbT);
      }
      wasTop = st.atTop;
      if (st.landed < 0) active = -1;
      lastHop = st.landed;
    } else {
      climber.visible = false;
    }

    if (!reduced && !paused) updateFireworks(climbT, dt);

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
    if (!warmed) return; // nothing is drawn before the background warm-up is done
    // Real clock (slow phones don't get slow motion), never more than a quarter second per jump.
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    update(dt);
    renderer.render(scene, camera);
    report();
    if (visible && started && !(reduced || paused)) raf = requestAnimationFrame(frame);
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
  // Warm-up: prepare every shader (in the background where the browser can, so the page never
  // freezes) and draw one frame, so nothing stutters once the staircase starts moving.
  let disposed = false;
  (async () => {
    await new Promise((r) => setTimeout(r, 0));
    try {
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
      else renderer.compile(scene, camera);
    } catch {
      /* the first frame will compile what is left */
    }
    if (disposed) return;
    warmed = true;
    update(0);
    renderer.render(scene, camera);
    kick();
    onReady?.();
  })();

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
        accent = accentColor;
        fwPalette = fwColors();
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
    start() {
      if (started) return;
      started = true;
      last = performance.now();
      kick();
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
      disposed = true;
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
