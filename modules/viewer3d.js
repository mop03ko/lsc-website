import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  HemisphereLight,
  DirectionalLight,
  GridHelper,
  Box3,
  Vector3,
  SRGBColorSpace,
  DoubleSide,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createViewer(stage) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', stage.getAttribute('aria-label'));
  renderer.domElement.addEventListener('keydown', (e) => {
    const views = { ArrowLeft: 'side', ArrowRight: 'front', ArrowUp: 'top', Home: 'iso' };
    if (views[e.key]) {
      e.preventDefault();
      view(views[e.key]);
    }
    if (e.key === '+' || e.key === '-') {
      e.preventDefault();
      camera.position
        .sub(controls.target)
        .multiplyScalar(e.key === '+' ? 0.85 : 1.15)
        .add(controls.target);
    }
  });
  stage.prepend(renderer.domElement);
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
  const loader = new GLTFLoader();
  let request = 0,
    controller;
  function dispose(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m) continue;
        for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
        m.dispose();
      }
    });
  }
  let current = null,
    center = new Vector3(),
    radius = 10,
    visible = true,
    mode = 'iso';
  const resize = () => {
    const w = Math.max(1, stage.clientWidth),
      h = Math.max(1, stage.clientHeight);
    renderer.setSize(w, h, false);
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
  })();
  function view(v = mode) {
    mode = v;
    const d = {
      iso: [1, 0.65, 1],
      front: [0, 0.25, 1],
      side: [1, 0.25, 0],
      top: [0.001, 1, 0.001],
    }[v] || [1, 0.65, 1];
    camera.position
      .copy(center)
      .addScaledVector(
        new Vector3(...d).normalize(),
        radius * 3.5 * Math.max(1, 1.2 / camera.aspect),
      );
    controls.target.copy(center);
    controls.update();
    renderer.render(scene, camera);
  }
  function clear() {
    if (current) {
      scene.remove(current);
      dispose(current);
    }
    current = null;
  }
  function place(obj) {
    clear();
    current = obj;
    scene.add(obj);
    obj.position.set(0, 0, 0);
    const box = new Box3().setFromObject(obj);
    box.getCenter(center);
    radius = box.getSize(new Vector3()).length() / 2;
    obj.position.set(-center.x, -box.min.y, -center.z);
    center.set(0, center.y - box.min.y, 0);
    view();
  }
  async function load(url) {
    const id = ++request;
    controller?.abort();
    controller = new AbortController();
    clear();
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Model HTTP ' + response.status);
    const data = await response.arrayBuffer();
    if (id !== request) return false;
    const gltf = await loader.parseAsync(data, '');
    if (id !== request) {
      dispose(gltf.scene);
      return false;
    }
    gltf.scene.traverse((o) => {
      if (o.isMesh)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.side = DoubleSide;
    });
    place(gltf.scene);
    renderer.render(scene, camera);
    stage.dataset.loaded = url;
    return true;
  }
  return { load, view, clear };
}
