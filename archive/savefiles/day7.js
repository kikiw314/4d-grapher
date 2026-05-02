import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ===================== function ===================== */

function f(x, y, z) {
  try {
    return eval(document.getElementById("func").value);
  } catch {
    return 0;
  }
}

/* ===================== grid ===================== */

const nx = 30, ny = 30, nz = 30;
const xmin = -1.5, xmax = 1.5;
const ymin = -1.5, ymax = 1.5;
const zmin = -1.5, zmax = 1.5;

const dx = (xmax - xmin) / (nx - 1);
const dy = (ymax - ymin) / (ny - 1);
const dz = (zmax - zmin) / (nz - 1);

/* ===================== sample scalar field ===================== */

function sampleField() {
  const values = new Float32Array(nx * ny * nz);
  let p = 0;

  for (let i = 0; i < nx; i++) {
    const x = xmin + i * dx;
    for (let j = 0; j < ny; j++) {
      const y = ymin + j * dy;
      for (let k = 0; k < nz; k++) {
        const z = zmin + k * dz;
        values[p++] = f(x, y, z);
      }
    }
  }

  return values;
}

function idx(i, j, k) {
  return i * ny * nz + j * nz + k;
}

/* ===================== marching cubes ===================== */
/* minimal implementation: isosurface at value = 0 */

import { edgeTable, triTable } from "./mcTables.js";

function marchingCubes(values) {
  const vertices = [];
  const indices = [];
  let vertCount = 0;

  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let k = 0; k < nz - 1; k++) {

        const cube = new Array(8);
        const pos = new Array(8);

        for (let di = 0; di <= 1; di++) {
          for (let dj = 0; dj <= 1; dj++) {
            for (let dk = 0; dk <= 1; dk++) {
              const id = di*4 + dj*2 + dk;
              const ii = i + di, jj = j + dj, kk = k + dk;
              cube[id] = values[idx(ii,jj,kk)];
              pos[id] = [
                xmin + ii * dx,
                ymin + jj * dy,
                zmin + kk * dz
              ];
            }
          }
        }

        let cubeIndex = 0;
        for (let n = 0; n < 8; n++) {
          if (cube[n] < 0) cubeIndex |= 1 << n;
        }

        const edges = edgeTable[cubeIndex];
        if (edges === 0) continue;

        const vertList = new Array(12);

        function interp(a,b,va,vb) {
          const t = va / (va - vb);
          return [
            a[0] + t*(b[0]-a[0]),
            a[1] + t*(b[1]-a[1]),
            a[2] + t*(b[2]-a[2])
          ];
        }

        const edgePairs = [
          [0,1],[1,3],[3,2],[2,0],
          [4,5],[5,7],[7,6],[6,4],
          [0,4],[1,5],[3,7],[2,6]
        ];

        for (let e = 0; e < 12; e++) {
          if (edges & (1<<e)) {
            const [a,b] = edgePairs[e];
            vertList[e] = interp(pos[a],pos[b],cube[a],cube[b]);
          }
        }

        const table = triTable[cubeIndex];
        for (let t = 0; t < table.length; t += 3) {
          if (table[t] === -1) break;

          for (let n = 0; n < 3; n++) {
            const v = vertList[table[t+n]];
            vertices.push(...v);
          }

          indices.push(vertCount, vertCount+1, vertCount+2);
          vertCount += 3;
        }
      }
    }
  }

  return {
    positions: new Float32Array(vertices),
    indices: new Uint32Array(indices)
  };
}

/* ===================== 4d rotation + projection ===================== */

function rotatePlane(a,b,t) {
  const c = Math.cos(t), s = Math.sin(t);
  return [a*c - b*s, a*s + b*c];
}

/* ===================== three.js ===================== */

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 100);
camera.position.set(3,3,3);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

new OrbitControls(camera, renderer.domElement);

const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshStandardMaterial({
  color: 0x88ccff,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

scene.add(new THREE.DirectionalLight(0xffffff,1));
scene.add(new THREE.AxesHelper(1.5));

const sliders = {
  xy: document.getElementById("xy"),
  xz: document.getElementById("xz"),
  yz: document.getElementById("yz"),
  xw: document.getElementById("xw"),
  yw: document.getElementById("yw"),
  zw: document.getElementById("zw")
};

let basePositions, indices;

function rebuild() {
  const field = sampleField();
  const result = marchingCubes(field);

  basePositions = result.positions;
  indices = result.indices;

  geometry.setAttribute("position", new THREE.BufferAttribute(basePositions,3));
  geometry.setIndex(new THREE.BufferAttribute(indices,1));
  geometry.computeVertexNormals();
}

rebuild();

function animate() {
  requestAnimationFrame(animate);

  const pos = geometry.attributes.position.array;
  const fov = 4;

  for (let i = 0; i < pos.length; i += 3) {
    let x = basePositions[i];
    let y = basePositions[i+1];
    let z = basePositions[i+2];
    let w = f(x,y,z);

    [x,y] = rotatePlane(x,y,+sliders.xy.value);
    [x,z] = rotatePlane(x,z,+sliders.xz.value);
    [y,z] = rotatePlane(y,z,+sliders.yz.value);
    [x,w] = rotatePlane(x,w,+sliders.xw.value);
    [y,w] = rotatePlane(y,w,+sliders.yw.value);
    [z,w] = rotatePlane(z,w,+sliders.zw.value);

    const scale = fov / (fov - w);
    pos[i]   = x * scale;
    pos[i+1] = y * scale;
    pos[i+2] = z * scale;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  renderer.render(scene,camera);
}

animate();

document.getElementById("plot").onclick = rebuild;
