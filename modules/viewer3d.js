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
  const loader = new GLTFLoader(),
    cache = new Map();
  let current = null,
    center = new Vector3(),
    radius = 10,
    visible = true,
    mode = 'iso';
  const resize = () => {
    const w = stage.clientWidth,
      h = stage.clientHeight;
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
        radius * 2.1 * Math.max(1, 1.2 / camera.aspect),
      );
    controls.target.copy(center);
    controls.update();
  }
  function clear() {
    if (current) scene.remove(current);
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
  function load(url) {
    if (cache.has(url)) {
      place(cache.get(url));
      return Promise.resolve();
    }
    return new Promise((resolve, reject) =>
      loader.load(
        url,
        (gltf) => {
          gltf.scene.traverse((o) => {
            if (o.isMesh) o.material.side = DoubleSide;
          });
          cache.set(url, gltf.scene);
          place(gltf.scene);
          resolve();
        },
        undefined,
        reject,
      ),
    );
  }
  return { load, view, clear };
}
