var $ = require('jquery')
var THREE = require('three')
var odex = require('odex');

const { data } = require('jquery');
var OrbitControls = require('three-orbit-controls')(THREE)
let renderer = null, 
scene = null, 
camera = null,
root = null,
group = null,
orbitControls = null,
ambientLight = null,
solution = [],
tLastUpdate = null,
iter = 0,
simulate = false,
arrowGroup = new THREE.Group(),
arrowList = []
deltaT = 0.03,
// Define masses
mass = [1, 1, 1],
// Define solution offsets.
off_r = [],
off_v = [],
dims = 3, // x,y,z
eqs = 2; // acceleration and velocity. 
num_bodies = 3;

// Arrow
let sourcePos,
direction,
arrow;

// line "trails"
let trailPos;
let drawCount;
let trails;

// 
let particles = [];
let r = []; // array to store initial positions of particles
let v = []; // ... velocities of particles
let groupParticle1, groupParticle2, groupParticle3;

$(document).ready(
	function() {
		let canvas = document.getElementById("webglcanvas");
		createScene(canvas);

		run();
	}
);

// Returns all body indices except a.
function otherBodies(a) {
  result = [];
  for (let i = 0; i < num_bodies; ++i) {
    if (i != a) {
      result.push(i);
    }
  }
  // console.log(a,result);
  return result;
}

// Returns v' solutions for body with index a, affected by another body b.
// r: position
// v: velocity (r')
// a: acceleration (r'' or v')


function bodyAcc2(a, b, y) {
  // vector from b to a.
  let r_ba = [y[0 + off_r[a]] - y[0 + off_r[b]], 
              y[1 + off_r[a]] - y[1 + off_r[b]], 
              y[2 + off_r[a]] - y[2 + off_r[b]]];

  let denom = Math.pow(Math.sqrt(r_ba[0]**2 + r_ba[1]**2 + r_ba[2]**2), 3);
  let G = 1 // 6.67408e-11; // Gravitation constant.
  let K = 10 // 1000000000 // Empirically tuned constant.
  let scalar_ab = -1 * K * G * mass[b] / denom;

  return [
    // Acceleration (v' or r'')
    scalar_ab * r_ba[0],
    scalar_ab * r_ba[1],
    scalar_ab * r_ba[2],
  ];
}

// Describes derivatives for a body with index 'a' affected by other bodies 'bs'.
// Returns a 6 dimensional vector of velocity and acceleration values.
// Example: [r'x, r'y, r'z, v'x, v'y, v'z]
function bodyEqsN(a, bs, y) {
  let result = Array(eqs * dims).fill(0);

  // Obtain velocity (r')
  for (let i = 0; i < dims; ++i) {
    result[i] = y[i + off_v[a]];
  }

  // Obtain acceleration (v')
  bs.forEach(b => {
    let ai = bodyAcc2(a, b, y);
    for (let j = 0; j < ai.length; ++j) {
      result[j + dims] += ai[j];
    }
  });

  return result;
}

// Describes the system of ODEs.
// Params -
// x: time (unused)
// y: position and velocity of all bodies.
let NBody = (x,y) => {
  let result = [];
  for (let i = 0; i < num_bodies; ++i) { 
    result.push(...bodyEqsN(i, otherBodies(i), y));
  }
  return result;
};

// Solves the system of ODEs and stores the result in the solution global var.
// Params -
//  y0: initial state of the system. It's structured like
//      [r1x, r1y, r1z, v1x, v2y, v3z
//       ...,
//       rNx, rNy, rNz, vNx, vNy, vNz]
//       where r is position, the number is the body index,
//         and (x,y,z) are standard basis vectors

function solve(y0) {
  let s = new odex.Solver(y0.length);
  s.denseOutput = true;
  timeEnd = 120; // seconds.
  sol = s.solve(NBody, 0, y0, timeEnd, 
    s.grid(deltaT, (x,y) => {
      let time = parseFloat(x).toPrecision(2);
      solution.push([time,y]);
  })).y
}

function run() {
  const maxVertices = 500;
  
    requestAnimationFrame(function() { run(); });

    drawCount = ( drawCount + 1 ) % maxVertices;

    for(let i=0; i<3; i++){
      trails[i].geometry.setDrawRange( 0, drawCount );
    }
  

    // Render the scene
    renderer.render( scene, camera );

    // Update the camera controller
    orbitControls.update();

    // Update bodies.
    let lineIndex = 0;
    let lineIndex2 = 0;
    let lineIndex3 = 0;
    let lineIndices=[lineIndex, lineIndex2, lineIndex3];
    if (simulate && Date.now() - tLastUpdate > deltaT) {
      //console.log("Time: ", solution[iter][0]);
      let y = solution[iter][1];
      for (let i = 0; i < num_bodies; ++i) {
        //group.children[i].position.set(y[off_r[i]], y[off_r[i]+1], y[off_r[i]+2]);
        particles[i].position.set(y[off_r[i]], y[off_r[i]+1], y[off_r[i]+2]);
        // Update line trail
        //console.log(lineIndices[i]);
        trailPos[i][lineIndices[i]++] = y[off_r[i]]; //x
        trailPos[i][lineIndices[i]++] = y[off_r[i]+1]; //y
        trailPos[i][lineIndices[i]++] = y[off_r[i]+2]; //z
        //console.log(lineIndices[i]);
        // Update Arrows
        /*
        arrowGroup.children[i].position.x = y[off_r[i]];
        arrowGroup.children[i].position.y = y[off_r[i]+1];
        arrowGroup.children[i].position.z = y[off_r[i]+2];
        particles[i].children[1].position.x = y[off_r[i]];
        particles[i].children[1].position.y = y[off_r[i]+1];
        particles[i].children[1].position.z = y[off_r[i]+2];*/

        direction = new THREE.Vector3(y[off_v[i]], y[off_v[i]+1],y[off_v[i]+2]);
        //arrowGroup.children[i].setLength(direction.length()*4, (direction.length()*4)/6,(direction.length()*4)/12);
        //arrowGroup.children[i].setDirection(direction.normalize());
        
        //console.log(particles[i].children[1]);
        particles[i].children[1].setLength(direction.length()*4, (direction.length()*4)/6,(direction.length()*4)/12);
        particles[i].children[1].setDirection(direction.normalize());
      }
      ++iter;
      if (iter == solution.length) {
        simulate = false;
      }
      tLastUpdate = Date.now();
    } 
    
    for(let i=0; i<3; i++){
      trails[i].geometry.attributes.position.needsUpdate = true;   
    }
}

function createScene(canvas) {
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set size
    renderer.setPixelRatio( window.devicePixelRatio );

    renderer.setSize( window.innerWidth, window.innerHeight );
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    scene.background = new THREE.Color("rgb(0, 0, 0)");

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    //camera.position.set(-2, 6, 12);
    camera.position.set(0, 5, 18);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    ambientLight = new THREE.AmbientLight ( 0x444444, 0.8);
    root.add(ambientLight);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create spheres
    geometry = new THREE.SphereGeometry(0.8, 20, 20);

    mesh1 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xff0000}));
    groupParticle1 = new THREE.Object3D;
    groupParticle1.add(mesh1);
    group.add(groupParticle1);
    particles.push(groupParticle1);

    mesh2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x00ff00}));
    groupParticle2 = new THREE.Object3D;
    groupParticle2.add(mesh2);
    group.add(groupParticle2);
    particles.push(groupParticle2);

    mesh3 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xf0f0f0}));
    groupParticle3 = new THREE.Object3D;
    groupParticle3.add(mesh3);
    group.add(groupParticle3);
    particles.push(groupParticle3);
    //console.log(groupParticle3);

    // Add a directional light to show off the object
    let light = new THREE.DirectionalLight( new THREE.Color("rgb(200, 200, 200)"), 1);

    // Position the light out from the scene, pointing at the origin
    light.position.set(-2, -2, 2);
    light.target.position.set(0,0,0);
    
    scene.add(root);
    scene.add(light);

    // Controls
    orbitControls = new OrbitControls(camera, renderer.domElement);

    //dragControls = new THREE.DragControls(bodies, camera, renderer.domElement);
    for (let i = 0; i < num_bodies; ++i) {
      off_r.push(eqs * dims * i);
      off_v.push(off_r[i] + dims);
    }
    // Initial values of the system.
    // Define initial position vectors
    r.push([-0.97000436, 0.24308753, 0]);
    r.push([0,0,0]);
    r.push([0.97000436, -0.24308753, 0]);
    r = r.map((e)=>e.map(i=>i*=10));

    groupParticle1.position.set(...r[0]); 
    groupParticle2.position.set(...r[1]);
    groupParticle3.position.set(...r[2]);
     
    // Define initial velocities
    v.push([0.4662036850, 0.4323657300, 0]);      
    v.push([-0.93240737, -0.86473146, 0]);    
    v.push([0.4662036850, 0.4323657300, 0]);      
    
    // Serialize values.
    // Structure is:
    //   [r1x, r1y, r1z, v1x, v2y, v3z
    //    ...,
    //    rNx, rNy, rNz, vNx, vNy, vNz]
    let y0 = [];
    for (let i = 0; i < num_bodies; ++i) {
      y0.push(...r[i]);
      y0.push(...v[i]);
    }

    // Create a group to hold all the arrows
    const MAX_POINTS = 500;
    var lineGeometry = new THREE.BufferGeometry(), lineGeometry2 = new THREE.BufferGeometry(), lineGeometry3 = new THREE.BufferGeometry();
    var positions1 = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
    var positions2 = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
    var positions3 = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point

    lineGeometry.setAttribute( 'position', new THREE.BufferAttribute( positions1, 3 ) );
    lineGeometry2.setAttribute( 'position', new THREE.BufferAttribute( positions2, 3 ) );
    lineGeometry3.setAttribute( 'position', new THREE.BufferAttribute( positions3, 3 ) );
    drawCount = 6; // draw the first 2 points, only
    lineGeometry.setDrawRange( 0, drawCount );
    lineGeometry2.setDrawRange( 0, drawCount );
    lineGeometry3.setDrawRange( 0, drawCount );
    
    // material
	  var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );
    let trail1 = new THREE.Line( lineGeometry,  material );
    let trail2 = new THREE.Line( lineGeometry2,  material );
    let trail3 = new THREE.Line( lineGeometry3,  material );
    trails = [trail1, trail2, trail3];
    let dynamicPos1 = trail1.geometry.attributes.position.array;
    let dynamicPos2 = trail2.geometry.attributes.position.array;
    let dynamicPos3 = trail3.geometry.attributes.position.array;
    trailPos = [dynamicPos1, dynamicPos2, dynamicPos3];
    // Loop for arrows
    let pX,pY,pZ,vX,vY,vZ;
    for (let i = 0; i < num_bodies; ++i) {
      
      pX = y0[eqs*dims*i];
      pY = y0[eqs*dims*i+1];
      pZ = y0[eqs*dims*i+2];
      vX = y0[eqs*dims*i+3];
      vY = y0[eqs*dims*i+4];
      vZ = y0[eqs*dims*i+5];

      trailPos[i][0] = pX;
      trailPos[i][1] = pY;
      trailPos[i][2] = pZ;
      console.log(pX, vX);
      console.log(pY, vY);
      console.log(pZ, vZ);
      //sourcePos = new THREE.Vector3(pX, pY, pZ);
      sourcePos = new THREE.Vector3(0, 0, 0); // Do not need to set, parent obj handles pos
      direction = new THREE.Vector3(vX,vY,vZ);
      arrow = new THREE.ArrowHelper(direction.clone().normalize(), sourcePos, 3, 0xff0000);
      arrow.setLength(direction.length()*4, (direction.length()*4)/6,(direction.length()*4)/12);
      //arrowGroup.add(arrow);
      arrowList.push(arrow);
      particles[i].add(arrow);
      console.log(particles[i]);
    }
    //scene.add( trail1 );
    //scene.add( trail2 );
    //scene.add( trail3 );
    //scene.add(arrowGroup);


    solve(y0);
      
    // buttons
    let simButton = document.getElementById("simulate");
    simButton.addEventListener("click", startSimulation);
    simButton.disabled = false;
   
    var getx = document.getElementById("x_input"), 
    gety = document.getElementById("y_input"), 
    getz = document.getElementById("z_input");

    let addBody = document.getElementById("addBody");
    addBody.addEventListener("click", ()=>{
      // get x, y, z values
      if(getx.value && gety.value && getz.value){
        console.log(getx.value, gety.value, getz.value);
        num_bodies++;  
        mesh1 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xff0000}));
        
        // set position of new particle  
        let newGroupParticle = new THREE.Object3D;
        newGroupParticle.add(mesh1);
        group.add(newGroupParticle);
        particles.push(newGroupParticle);
        newGroupParticle.position.set(getx.value, gety.value, getz.value); // warning!
        r.push([getx.value,gety.value,getz.value]);
        
        // set init velocity of new particle
        v.push([0.4662036850, 0.4323657300, 0]); //static

        // add to & update scene
        group.updateMatrixWorld();
      } else {
        alert("missing value!");
      } 
    });

    let removeBody = document.getElementById("removeBody");
    removeBody.addEventListener("click", ()=>{
      num_bodies--;
      
      // remove pos and velocities
      r.pop();
      v.pop();

      // delete from & update scene
      group.remove(group.children[group.children.length -1]);
      particles.pop();
      group.updateMatrixWorld();
    });

    let checkVectors = document.querySelector("input[name=checkbox]");
    checkVectors.addEventListener("change", ()=>{
      var checked = $(checkVectors).prop('checked');
      if(checked===true){
        arrowList.forEach(e=>e.visible=true);
        scene.updateMatrixWorld();
      } else {
        arrowList.forEach(e=>e.visible=false);
        scene.updateMatrixWorld();
      }
    });
}

function startSimulation() {
  simulate = true;
}


// Here the gravitational constant G has been set to 1, and the initial conditions are 
// r1(0) = −r3(0) = (−0.97000436, 0.24308753); r2(0) = (0,0); v1(0) = v3(0) = (0.4662036850, 0.4323657300); v2(0) = (−0.93240737, −0.86473146). The values are obtained from Chenciner & Montgomery (2000).