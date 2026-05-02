// projection

// 4d -> 3d
function proj4to3(p, d = 5) {
    const scale = d / (d - p.w);
    return {
      x: p.x * scale,
      y: p.y * scale,
      z: p.z * scale
    };
  }
  
  // 3d -> 2d
  function proj4to2(p, d = 5) {
    const scale = d / (d - p.z);
    return {
      x: p.x * scale,
      y: p.y * scale
    };
  }
  
  // rotation in any coordinate plane
  function rotate(p, a, b, theta) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
  
    const pa = p[a];
    const pb = p[b];
  
    return {
      ...p,
      [a]: pa * cos - pb * sin,
      [b]: pa * sin + pb * cos
    };
  }
  
  // full pipeline: rotate in 4d, project to 3d, then 2d
  function transform(p4, rotations) {
    let p = { ...p4 };
  
    for (const r of rotations) {
      p = rotate(p, r.a, r.b, r.theta);
    }
  
    const p3 = proj4to3(p);
    const p2 = proj4to2(p3);
    return p2;
  }
  
  // hypercube vertices
  const vertices4d = [];
  for (let x of [-1, 1])
  for (let y of [-1, 1])
  for (let z of [-1, 1])
  for (let w of [-1, 1])
    vertices4d.push({ x, y, z, w });
  
  // hypercube edges
  const edges = [];
  for (let i = 0; i < vertices4d.length; i++) {
    for (let j = i + 1; j < vertices4d.length; j++) {
      let diff = 0;
      for (let k of ["x", "y", "z", "w"]) {
        if (vertices4d[i][k] !== vertices4d[j][k]) diff++;
      }
      if (diff === 1) edges.push([i, j]);
    }
  }
  
  // canvas
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  
  // animation loop
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(120, -120);
  
    const rotations = [
      { a: "x", b: "y", theta: +xy.value },
      { a: "x", b: "z", theta: +xz.value },
      { a: "y", b: "z", theta: +yz.value },
      { a: "x", b: "w", theta: +xw.value },
      { a: "y", b: "w", theta: +yw.value },
      { a: "z", b: "w", theta: +zw.value }
    ];
  
    const projected = vertices4d.map(p =>
      transform(p, rotations)
    );
  
    ctx.beginPath();
    for (const [i, j] of edges) {
      ctx.moveTo(projected[i].x, projected[i].y);
      ctx.lineTo(projected[j].x, projected[j].y);
    }
  
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.015;
    ctx.stroke();
  
    ctx.restore();
    requestAnimationFrame(draw);
  }
  
  draw();
  