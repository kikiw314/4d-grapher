const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const w = canvas.width;
const h = canvas.height;

let cubeVertices = [
    [-1,-1,-1,1],
    [-1,-1,1,1],
    [-1,1,-1,1],
    [-1,1,1,1],
    [1,1,-1,1],
    [1,1,1,1],
    [1,-1,1,1],
    [1,-1,-1,1],

    [-1,-1,-1,-1],
    [-1,-1,1,-1],
    [-1,1,-1,-1],
    [-1,1,1,-1],
    [1,1,-1,-1],
    [1,1,1,-1],
    [1,-1,1,-1],
    [1,-1,-1,-1]

];

let cubeFaces = [
    [0,1,3,2], 
    [7,6,5,4],
    [2,3,5,4], 
    [0,7,6,1],
    [1,6,5,3], 
    [0,2,4,7]  
  ];

function yrot(cubeVertices, rot) {
    const newcube = []

    for (let i = 0; i < cubeVertices.length; i++) {
        const coords = cubeVertices[i]
        const x = coords[0]*Math.cos(rot) + coords[2] * Math.sin(rot)
        const y = coords[1] * 1 
        const z = -coords[0]*Math.sin(rot)+ coords[2] * Math.cos(rot)


        newcube.push([x,y,z])
        
    }
    return newcube

}

function xrot(cubeVertices, rot) {
    const newcube = []

    for (let i = 0; i < cubeVertices.length; i++) {
        const coords = cubeVertices[i]
        const x = coords[0]
        const y = coords[0]* 0 + coords[1] * Math.cos(rot) + coords[2] * -Math.sin(rot)
        const z = coords[0]*0+ coords[1] * Math.sin(rot) + coords[2] * Math.cos(rot)


        newcube.push([x,y,z])
        
    }
    return newcube

}
function rotation(cubeVertices, xangle, yangle) {
    return yrot(xrot(cubeVertices,xangle), yangle)

}


function project([x,y,z], view=5, scale = 300) {
    return[
        ((x * scale)/(-z + view)) + w/2,
        ((y*scale)/(-z + view)) + h/2
    ];

}

function drawfaces(face, cubevertices) {
    c.beginPath();
    let [x0, y0] = project(cubevertices[face[0]]);
    c.moveTo(x0, y0);

    for (let i = 1; i < face.length; i++) {
        let [x, y] = project(cubevertices[face[i]]);
        c.lineTo(x, y);
    }

    c.closePath()
    c.strokeStyle = "black";
    c.stroke();

}


function drawcube(cubefaces, cubevertices) {
    for (let i = 0; i < cubefaces.length; i++){
        drawfaces(cubefaces[i], cubevertices)
    }
}


window.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX; 
    const mouseY = event.clientY; 



    const angleX = (mouseY / (h)) * Math.PI * 2; 
    const angleY = (mouseX / (w)) * Math.PI * 2; 
    c.clearRect(0, 0, w, h);
    drawcube(cubeFaces, rotation(cubeVertices, -angleX, angleY))
    

});

