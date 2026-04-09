import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

/* ---------- scene ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(5, 5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

/* ---------- lighting ---------- */
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(6, 8, 4);
scene.add(dirLight);

/* ---------- helpers ---------- */
scene.add(new THREE.AxesHelper(3));

/* ---------- UI: sliders + function select ---------- */
const uiHTML = `
<div style="position:absolute; top:10px; left:10px; color:white; font-family:monospace;">
  <label>Function: 
    <select id="funcSelect">
      <option value="sphere">Sphere: 0.6-(x^2+y^2+z^2)</option>
      <option value="sinCos">SinCos: sin(x)+cos(y)+z^2</option>
      <option value="saddle">Saddle: x^2-y^2+z^2</option>
    </select>
  </label><br>
  xy <input id="xy" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
  xz <input id="xz" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
  yz <input id="yz" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
  xw <input id="xw" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
  yw <input id="yw" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
  zw <input id="zw" type="range" min="0" max="${Math.PI*2}" step="0.01" value="0"><br>
</div>
`;
document.body.insertAdjacentHTML("beforeend", uiHTML);

const sliders = {
  xy: document.getElementById("xy"),
  xz: document.getElementById("xz"),
  yz: document.getElementById("yz"),
  xw: document.getElementById("xw"),
  yw: document.getElementById("yw"),
  zw: document.getElementById("zw")
};

const funcSelect = document.getElementById("funcSelect");

/* ---------- marching cubes ---------- */
const RESOLUTION = 28;

const material = new THREE.MeshStandardMaterial({
  color: 0x7fd7ff,
  roughness: 0.3,
  metalness: 0.05,
  side: THREE.DoubleSide
});

const mc = new MarchingCubes(RESOLUTION, material, true, true);
mc.scale.set(4, 4, 4);
scene.add(mc);

/* ---------- rotation + projection helpers ---------- */
function rotatePlane(a, b, t) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [a * c - b * s, a * s + b * c];
}

const d = 4; // projection distance along w

function scalarFunction(x, y, z, selectedFunc) {
  switch (selectedFunc) {
    case "sphere":
      return 0.6 - (x*x + y*y + z*z);
    case "sinCos":
      return Math.sin(x) + Math.cos(y) + z*z;
    case "saddle":
      return x*x - y*y + z*z;
    default:
      return 0.6 - (x*x + y*y + z*z);
  }
}

/* ---------- build 4D → 3D field ---------- */
function rebuildField() {
  mc.reset();
  mc.isolation = 0;

  const field = mc.field;
  const step = 2 / RESOLUTION; // map 0..RES → -1..1

  const angleXY = +sliders.xy.value;
  const angleXZ = +sliders.xz.value;
  const angleYZ = +sliders.yz.value;
  const angleXW = +sliders.xw.value;
  const angleYW = +sliders.yw.value;
  const angleZW = +sliders.zw.value;

  const selectedFunc = funcSelect.value;

  const wSlice = 0; // optional: animate this for morphing

  for (let i = 0; i < RESOLUTION; i++) {
    for (let j = 0; j < RESOLUTION; j++) {
      for (let k = 0; k < RESOLUTION; k++) {
        const idx = i + RESOLUTION * (j + RESOLUTION * k);

        let x = i * step - 1;
        let y = j * step - 1;
        let z = k * step - 1;
        let w = wSlice;

        // 4D rotations
        [x, y] = rotatePlane(x, y, angleXY);
        [x, z] = rotatePlane(x, z, angleXZ);
        [y, z] = rotatePlane(y, z, angleYZ);
        [x, w] = rotatePlane(x, w, angleXW);
        [y, w] = rotatePlane(y, w, angleYW);
        [z, w] = rotatePlane(z, w, angleZW);

        // project 4D → 3D
        const wClamped = Math.max(Math.min(w, d - 0.01), -d + 0.01);
        const scale = d / (d - wClamped);
        const xp = x * scale;
        const yp = y * scale;
        const zp = z * scale;

        field[idx] = scalarFunction(xp, yp, zp, selectedFunc);
      }
    }
  }

  mc.update();
}

/* ---------- animation ---------- */
function animate() {
  requestAnimationFrame(animate);
  rebuildField();
  controls.update();
  renderer.render(scene, camera);
}

animate();

/* ---------- resize ---------- */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
