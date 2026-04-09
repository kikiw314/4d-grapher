
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";



// -------------------- user function --------------------
function f(x, y, z) {
  return eval(document.getElementById("func").value);
}

// -------------------- 4D grid --------------------
let nx = 50, ny = 50, nz = 50; // safe number of points
let points4D = storedata();

// store 4D points
function storedata() {
  const xmin = -1.5, xmax = 1.5;
  const ymin = -1.5, ymax = 1.5;
  const zmin = -1.5, zmax = 1.5;

  const dx = (xmax - xmin) / (nx - 1);
  const dy = (ymax - ymin) / (ny - 1);
  const dz = (zmax - zmin) / (nz - 1);

  const points = new Float32Array(nx * ny * nz * 4);
  let p = 0;

  for (let i = 0; i < nx; i++) {
    const x = xmin + i * dx;
    for (let j = 0; j < ny; j++) {
      const y = ymin + j * dy;
      for (let k = 0; k < nz; k++) {
        const z = zmin + k * dz;
        points[p++] = x;
        points[p++] = y;
        points[p++] = z;
        points[p++] = f(x, y, z);
      }
    }
  }

  alert("stored " + points.length/4 + " points");
  return points;
}

// -------------------- rotation helper --------------------
function rotatePlane(a, b, t) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [a * c - b * s, a * s + b * c];
}

// -------------------- three.js setup --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(3, 3, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

const numVertices = points4D.length / 4;
let positions = new Float32Array(numVertices * 3);

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({ color: 0x4, size: 0.02 });
const pointsMesh = new THREE.Points(geometry, material);
scene.add(pointsMesh);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const axes = new THREE.AxesHelper(1.5);
scene.add(axes);

// -------------------- sliders --------------------
const sliders = {
  xy: document.getElementById("xy"),
  xz: document.getElementById("xz"),
  yz: document.getElementById("yz"),
  xw: document.getElementById("xw"),
  yw: document.getElementById("yw"),
  zw: document.getElementById("zw")
};

// -------------------- update mesh --------------------
function updateMesh() {
  let p = 0;

  const aXY = +sliders.xy.value;
  const aXZ = +sliders.xz.value;
  const aYZ = +sliders.yz.value;
  const aXW = +sliders.xw.value;
  const aYW = +sliders.yw.value;
  const aZW = +sliders.zw.value;

  for (let i = 0; i < numVertices; i++) {
    let x = points4D[4*i];
    let y = points4D[4*i + 1];
    let z = points4D[4*i + 2];
    let w = points4D[4*i + 3];

    [x, y] = rotatePlane(x, y, aXY);
    [x, z] = rotatePlane(x, z, aXZ);
    [y, z] = rotatePlane(y, z, aYZ);
    [x, w] = rotatePlane(x, w, aXW);
    [y, w] = rotatePlane(y, w, aYW);
    [z, w] = rotatePlane(z, w, aZW);

    const f = 4;
    const wClamped = Math.max(Math.min(w, f-0.01), -f+0.01);
    const scale = f / (f - wClamped);

    positions[p++] = x * scale;
    positions[p++] = y * scale;
    positions[p++] = z * scale;
  }

  geometry.attributes.position.needsUpdate = true;
}

// -------------------- animate --------------------
function animate() {
  requestAnimationFrame(animate);
  updateMesh();
  renderer.render(scene, camera);
}

animate();

// -------------------- plot button --------------------
document.getElementById("plot").onclick = () => {
  points4D = storedata();
};
