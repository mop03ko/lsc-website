import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  HemisphereLight,
  DirectionalLight,
  GridHelper,
  Box3,
  Vector3,
  Plane,
  Group,
  Shape,
  ShapeGeometry,
  BoxGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  LineLoop,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
  DoubleSide,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const ACTION = 0xa83d20;
const STEEL = 0x7f898e;
const STUD_STEP = 0.6; // illustrative spacing for the schematic frame, not an engineering value
const FLANGE = 0.04;

export function createViewer(stage, { onRoom } = {}) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.localClippingEnabled = true;
  stage.prepend(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'model-labels';
  stage.append(labels.domElement);

  const scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x8a8a80, 2.0));
  const sun = new DirectionalLight(0xffffff, 2.4);
  sun.position.set(12, 24, 10);
  scene.add(sun);
  const fill = new DirectionalLight(0xffffff, 0.6);
  fill.position.set(-12, 8, -10);
  scene.add(fill);
  const grid = new GridHelper(60, 60, 0xb9b6ad, 0xd8d4ca);
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);
  const camera = new PerspectiveCamera(35, 4 / 3, 0.1, 1000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.maxPolarAngle = Math.PI * 0.495;
  const loader = new GLTFLoader(),
    cache = new Map(),
    clip = new Plane(new Vector3(0, -1, 0), 1e6),
    steel = new MeshStandardMaterial({ color: STEEL, metalness: 0.55, roughness: 0.45 }),
    unit = new BoxGeometry(1, 1, 1);
  let current = null,
    center = new Vector3(),
    radius = 10,
    visible = true,
    angle = 'iso',
    mode = 'exterior',
    depth = 0.089,
    selected = null;

  const resize = () => {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  new IntersectionObserver((e) => {
    visible = e[0].isIntersecting;
  }).observe(stage);
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  })();

  function view(v = angle) {
    angle = v;
    const d = {
      iso: [1, 0.65, 1],
      front: [0, 0.25, 1],
      side: [1, 0.25, 0],
      top: [0.001, 1, 0.001],
    }[v] || [1, 0.65, 1];
    const focus = center.clone();
    const lv = levelOf(mode);
    if (lv && current) focus.y = Math.max(0.5, lv.floorY + current.position.y + 1);
    camera.position
      .copy(focus)
      .addScaledVector(
        new Vector3(...d).normalize(),
        radius * (lv ? 1.7 : 2.1) * Math.max(1, 1.2 / camera.aspect),
      );
    controls.target.copy(focus);
    controls.update();
  }

  /* ---------- plan overlay: room floors + labels ---------- */
  function roomMesh(room, y) {
    const s = new Shape(room.poly.map(([x, z]) => ({ x, y: -z })));
    const geo = new ShapeGeometry(s);
    geo.rotateX(-Math.PI / 2);
    const mat = new MeshBasicMaterial({
      color: ACTION,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    const m = new Mesh(geo, mat);
    m.position.y = y;
    m.renderOrder = 2;
    const pts = room.poly.flatMap(([x, z]) => [x, y + 0.01, z]);
    const line = new LineLoop(
      new BufferGeometry().setAttribute('position', new Float32BufferAttribute(pts, 3)),
      new LineBasicMaterial({ color: ACTION, transparent: true, opacity: 0.55 }),
    );
    return [m, line];
  }

  function buildFrame(lv, d, withJoists) {
    const g = new Group();
    const parts = [];
    const y0 = lv.floorY,
      h = lv.height;
    for (const [x1, z1, x2, z2] of lv.walls) {
      const horiz = Math.abs(z1 - z2) < 1e-6;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const n = Math.max(2, Math.floor(len / STUD_STEP) + 1);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1);
        const x = x1 + (x2 - x1) * t,
          z = z1 + (z2 - z1) * t;
        parts.push([x, y0 + h / 2, z, horiz ? FLANGE : d, h, horiz ? d : FLANGE]);
      }
      const cx = (x1 + x2) / 2,
        cz = (z1 + z2) / 2;
      for (const y of [y0 + FLANGE / 2, y0 + h - FLANGE / 2])
        parts.push([cx, y, cz, horiz ? len : d, FLANGE, horiz ? d : len]);
    }
    if (withJoists && lv.bounds) {
      // floor joists across the shorter side of the level
      const [ax, az, bx, bz] = lv.bounds;
      const alongX = bx - ax < bz - az;
      const span = alongX ? bx - ax : bz - az,
        run = alongX ? bz - az : bx - ax;
      const n = Math.floor(run / STUD_STEP) + 1;
      for (let i = 0; i < n; i++) {
        const p = (alongX ? az : ax) + i * STUD_STEP;
        parts.push(
          alongX
            ? [(ax + bx) / 2, lv.floorY - d / 2, p, span, d, FLANGE]
            : [p, lv.floorY - d / 2, (az + bz) / 2, FLANGE, d, span],
        );
      }
    }
    const mesh = new InstancedMesh(unit, steel, parts.length);
    const o = new Object3D();
    parts.forEach(([x, y, z, sx, sy, sz], i) => {
      o.position.set(x, y, z);
      o.scale.set(sx, sy, sz);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.userData.count = parts.filter((p) => p[4] > FLANGE * 1.5).length;
    g.add(mesh);
    return g;
  }

  function attachPlan(obj, plan) {
    const ov = { levels: {}, plan };
    const root = new Group();
    root.name = 'plan-overlay';
    plan.levels.forEach((lv, li) => {
      const rooms = new Group();
      const tags = [];
      lv.rooms.forEach((room, ri) => {
        const [m, line] = roomMesh(room, lv.floorY + 0.06);
        rooms.add(m, line);
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'room-tag';
        el.innerHTML = `<b>${ri + 1}</b><span>${room.area.toFixed(1)} ${document.documentElement.lang === 'en' ? 'm²' : 'м²'}</span>`;
        el.addEventListener('pointerdown', (e) => e.stopPropagation());
        el.addEventListener('click', () => {
          selectRoom(lv.id, ri);
          onRoom?.(lv.id, ri);
        });
        const tag = new CSS2DObject(el);
        tag.position.set(room.x, lv.floorY + 0.4, room.z);
        rooms.add(tag);
        tags.push({ mesh: m, line, el });
      });
      rooms.visible = false;
      const frame = new Group();
      frame.visible = false;
      root.add(rooms, frame);
      ov.levels[lv.id] = { lv, rooms, tags, frame, index: li };
    });
    obj.add(root);
    obj.userData.overlay = ov;
    rebuildFrames(obj);
  }

  function rebuildFrames(obj) {
    const ov = obj?.userData.overlay;
    if (!ov) return;
    for (const L of Object.values(ov.levels)) {
      L.frame.clear();
      L.frame.add(buildFrame(L.lv, depth, L.index > 0));
    }
  }

  function levelOf(m) {
    return current?.userData.overlay?.levels[m]?.lv || null;
  }

  function ghost(on) {
    current?.traverse((o) => {
      if (!o.isMesh || o.parent?.parent?.name === 'plan-overlay' || o.isInstancedMesh) return;
      for (const m of [].concat(o.material)) {
        const u = (m.userData.orig ||= {
          transparent: m.transparent,
          opacity: m.opacity,
          depthWrite: m.depthWrite,
        });
        m.transparent = on ? true : u.transparent;
        m.opacity = on ? 0.1 : u.opacity;
        m.depthWrite = on ? false : u.depthWrite;
        m.needsUpdate = true;
      }
    });
  }

  function setMode(m) {
    mode = m;
    const ov = current?.userData.overlay;
    const lv = levelOf(m);
    clip.constant = lv ? lv.cutY + current.position.y : 1e6;
    ghost(m === 'frame');
    if (ov)
      for (const [id, L] of Object.entries(ov.levels)) {
        L.rooms.visible = id === m;
        L.frame.visible = m === 'frame';
      }
    if (m !== 'frame' && !lv) selectRoom(null);
    view();
    return stats();
  }

  function stats() {
    const ov = current?.userData.overlay;
    if (!ov) return null;
    let studs = 0;
    for (const L of Object.values(ov.levels))
      L.frame.traverse((o) => {
        if (o.isInstancedMesh) studs += o.userData.count;
      });
    return { studs, levels: ov.plan.levels };
  }

  function selectRoom(levelId, idx) {
    const ov = current?.userData.overlay;
    if (!ov) return;
    selected = levelId == null ? null : [levelId, idx];
    for (const [id, L] of Object.entries(ov.levels))
      L.tags.forEach((tg, i) => {
        const on = id === levelId && i === idx;
        tg.mesh.material.opacity = on ? 0.42 : 0.14;
        tg.line.material.opacity = on ? 1 : 0.55;
        tg.el.classList.toggle('active', on);
        tg.el.setAttribute('aria-pressed', String(on));
      });
  }

  function profile(mm) {
    depth = mm / 1000;
    rebuildFrames(current);
    return stats();
  }

  function clear() {
    if (current) {
      scene.remove(current);
      current.traverse((o) => {
        if (o.isCSS2DObject) o.element.style.display = 'none';
      });
    }
    current = null;
  }
  function place(obj) {
    clear();
    current = obj;
    scene.add(obj);
    obj.position.set(0, 0, 0);
    const box = obj.userData.box;
    box.getCenter(center);
    radius = box.getSize(new Vector3()).length() / 2;
    obj.position.set(-center.x, -box.min.y, -center.z);
    center.set(0, center.y - box.min.y, 0);
    obj.updateMatrixWorld(true);
    rebuildFrames(obj);
    return setMode(obj.userData.overlay ? mode : 'exterior');
  }
  function load(url, plan) {
    if (cache.has(url)) return Promise.resolve(place(cache.get(url)));
    return new Promise((resolve, reject) =>
      loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((o) => {
            if (o.isMesh)
              for (const m of [].concat(o.material)) {
                m.side = DoubleSide;
                m.clippingPlanes = [clip];
              }
          });
          gltf.scene.userData.box = new Box3().setFromObject(gltf.scene);
          if (plan) attachPlan(gltf.scene, plan);
          cache.set(url, gltf.scene);
          resolve(place(gltf.scene));
        },
        undefined,
        reject,
      ),
    );
  }
  return { load, view, clear, mode: setMode, profile, selectRoom };
}
