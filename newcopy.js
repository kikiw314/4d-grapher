import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { edgeTable, triTable } from "./marchingtables.js";

// eval the user's equation from the input field
function f(x, y, z) {
  return eval(document.getElementById("func").value);
}

// grid resolution and bounds
const nx = 40, ny = 40, nz = 40;
const xmin = -1.5, xmax = 1.5;
const ymin = -1.5, ymax = 1.5;
const zmin = -1.5, zmax = 1.5;
const iso = 0.0;

function generateField() {
  const field = new Float32Array(nx * ny * nz);
  const dx = (xmax - xmin) / (nx - 1);
  const dy = (ymax - ymin) / (ny - 1);
  const dz = (zmax - zmin) / (nz - 1);

  let p = 0;
  for (let i = 0; i < nx; i++) {
    const x = xmin + i * dx;
    for (let j = 0; j < ny; j++) {
      const y = ymin + j * dy;
      for (let k = 0; k < nz; k++) {
        const z = zmin + k * dz;
        field[p++] = f(x, y, z);
      }
    }
  }
  return field;
}

// marching cubes — turns the scalar field into triangles
function marchingCubes(field) {
  const verts = [];
  const dx = (xmax - xmin) / (nx - 1);
  const dy = (ymax - ymin) / (ny - 1);
  const dz = (zmax - zmin) / (nz - 1);

  const get = (i, j, k) => field[i * ny * nz + j * nz + k];

  // find where the isosurface crosses an edge
  const interp = (p1, p2, v1, v2) => {
    const t = (iso - v1) / (v2 - v1);
    return [
      p1[0] + t * (p2[0] - p1[0]),
      p1[1] + t * (p2[1] - p1[1]),
      p1[2] + t * (p2[2] - p1[2])
    ];
  };

  for (let i = 0; i < nx - 1; i++)
  for (let j = 0; j < ny - 1; j++)
  for (let k = 0; k < nz - 1; k++) {
    const cube = [];
    const pos = [];

    for (let dx0 = 0; dx0 <= 1; dx0++)
      for (let dy0 = 0; dy0 <= 1; dy0++)
        for (let dz0 = 0; dz0 <= 1; dz0++) {
          cube.push(get(i + dx0, j + dy0, k + dz0));
          pos.push([
            xmin + (i + dx0) * dx,
            ymin + (j + dy0) * dy,
            zmin + (k + dz0) * dz
          ]);
        }

    // cube index — one bit per corner that's inside the surface
    let idx = 0;
    for (let n = 0; n < 8; n++) if (cube[n] < iso) idx |= 1 << n;
    if (edgeTable[idx] === 0) continue;

    const vertList = new Array(12);
    const edges = [
      [0, 1], [1, 3], [3, 2], [2, 0],
      [4, 5], [5, 7], [7, 6], [6, 4],
      [0, 4], [1, 5], [3, 7], [2, 6]
    ];

    for (let e = 0; e < 12; e++) {
      if (edgeTable[idx] & (1 << e)) {
        const [a, b] = edges[e];
        vertList[e] = interp(pos[a], pos[b], cube[a], cube[b]);
      }
    }

    for (let t = 0; triTable[idx][t] !== -1; t += 3) {
      for (let m = 0; m < 3; m++) {
        const v = vertList[triTable[idx][t + m]];
        verts.push(...v);
      }
    }
  }

  return new Float32Array(verts);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
camera.position.set(3, 3, 3);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x44aa88, side: THREE.DoubleSide });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

scene.add(new THREE.DirectionalLight(0xffffff, 1));
scene.add(new THREE.AxesHelper(1.5));

// keep base verts around so we can re-apply the rotation each frame
let baseVertices;
function rebuild() {
  const field = generateField();
  baseVertices = marchingCubes(field);
  geometry.setAttribute("position", new THREE.BufferAttribute(baseVertices.slice(), 3));
  geometry.computeVertexNormals();
}
rebuild();

// simple 2d rotation
function rotate(a, b, t) {
  return [a * Math.cos(t) - b * Math.sin(t), a * Math.sin(t) + b * Math.cos(t)];
}

function animate() {
  requestAnimationFrame(animate);
  const pos = geometry.attributes.position.array;
  const a = +xy.value;

  for (let i = 0; i < pos.length; i += 3) {
    let x = baseVertices[i], y = baseVertices[i + 1], z = baseVertices[i + 2], w = 0;
    [x, y] = rotate(x, y, a);
    pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
  }

  geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
}
animate();

plot.onclick = rebuild;
