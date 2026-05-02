// hi people!! if youre looking at my code please dont judge, this is like my first js project so im not sure how commonly used a lot of the functions 
//i used are, theyre just kind of like random things i found. i also have no idea how to create a multi-line comment and im too lazy to search it up
//this was a lot of work but um im getting rid of half of it which sucks
//its whahtehhverr

//4d -> 3d
function proj4to3(p, d=5) {
    const scale = d/(d - p.w);
    return {
      x: p.x * scale,
      y: p.y * scale,
      z: p.z * scale
    };
  }

//3d -> 2d
function proj4to2(p, d=5) {
    const scale = d/(d - p.z);
    return {
      x: p.x * scale,
      y: p.y * scale
    };
  }

function rotate(p,a,b,theta) {
    sin = Math.sin(theta)
    cos = Math.cos(theta)
    //new thing learned: overriding properties with spread syntax
    return {...p,[a]:p[a] * cos - p[b] * sin, [b]: p[a] * sin + p[b]* cos};

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

//canvas
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

//basically just creates a function with just the return thing
function compile(expr) {
    return new Function("x", "y", "z", `return ${expr};`);
  }
  
function graphfunc(f,range=1.2, step=0.1){
    //points of the graph 
    const pts =[];
    const nx = Math.floor(range*2/step)+1;
    const ny = Math.floor(range*2/step)+1;
    const nz = Math.floor(range*2/step)+1;
    for (let xi=0, x=-range; xi<nx; xi++, x+=step) {
        for (let yi=0, y=-range; yi<ny; yi++, y+=step) {
            for (let zi=0, z=-range; zi<nz; zi++, z+=step) {
                const w = f(x,y,z);
                if (isFinite(w)) {
                    pts.push({x,y,z,w})
                }
            }
        }
    }
    pts.nx = nx;
    pts.ny = ny;
    pts.nz = nz;
    return pts;

}
  

let funcpoints = [];

const plot = document.getElementById("plot");


const funcInput = document.getElementById("func");

plot.onclick=()=> {
    const expr = funcInput.value;           
    const f = compile(expr);    
    //points of the function (self explanatory)            
    funcpoints=graphfunc(f)

};
//i never usef dskjgdkjgkjare tls
function klein(u, v) {
    const r = 1;
    const x = (r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.cos(u);
    const y = (r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.sin(u);
    const z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);
    const w = Math.cos(u / 2) * Math.sin(v);
  
    return { x, y, z, w };
  }

//sliders
const xy = document.getElementById("xy");
const xz = document.getElementById("xz");
const yz = document.getElementById("yz");
const xw = document.getElementById("xw");
const yw = document.getElementById("yw");
const zw = document.getElementById("zw");

function draw() {
    console.log("6767676767676767667767676u6u")
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(120, -120);
  
    const rotations = [ //keep track of what the rotation state is rn
      { a: "x", b: "y", theta: +xy.value },
      { a: "x", b: "z", theta: +xz.value },
      { a: "y", b: "z", theta: +yz.value },
      { a: "x", b: "w", theta: +xw.value },
      { a: "y", b: "w", theta: +yw.value },
      { a: "z", b: "w", theta: +zw.value }
    ];

    if (funcpoints && funcpoints.length >0){
        const funcProjected = funcpoints.map(p=> transform(p,rotations)) //p=> syntax is like a mini function, basically does the transform thing

        ctx.strokeStyle = "#ff66cc"; //  PINK
        ctx.lineWidth = 0.01;

        const nx = funcpoints.nx;
        const ny = funcpoints.ny;
        const nz = funcpoints.nz;

        //draw mesh along z-axis layers, basically just connects neighboridnigningin poibts
        for(let xi=0; xi<nx-1; xi++){
            for(let yi=0; yi<ny-1; yi++){
                for(let zi=0; zi<nz-1; zi++){
                    const idx = xi*ny*nz + yi*nz + zi;
                    const p000 = funcProjected[idx];
                    const p001 = funcProjected[idx+1];
                    const p010 = funcProjected[idx+nz];
                    const p011 = funcProjected[idx+nz+1];
                    ctx.beginPath();
                    ctx.moveTo(p000.x, p000.y);
                    ctx.lineTo(p001.x, p001.y);
                    ctx.lineTo(p011.x, p011.y);
                    ctx.lineTo(p010.x, p010.y);
                    ctx.lineTo(p000.x, p000.y);
                    ctx.stroke();
                }
            }
        }
    }

    ctx.restore();
    requestAnimationFrame(draw);
}
  

draw();