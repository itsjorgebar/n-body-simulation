var $ = require('jquery')
var THREE = require('three')
var odex = require('odex')
var OrbitControls = require('three-orbit-controls')(THREE)
let renderer = null, 
scene = null, 
camera = null,
root = null,
group = null,
orbitControls = null,
dragControls= null,
ambientLight = null,
bodies = [],
solution = [],
tLastUpdate = null,
iter = 0,
simulate = false,
deltaT = 0.03,
// Define masses
mass = [1, 1, 1],
// Define solution offsets.
off_r = [],
off_v = [],
dims = 3, // x,y,z
eqs = 2; // acceleration and velocity. 
count = 3;
num_bodies = 3;

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
  let G = 6.67408e-11; // Gravitation constant.
  let K = 1000000000 // Empirically tuned constant.
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
  timeEnd = 30; // seconds.
  sol = s.solve(NBody, 0, y0, timeEnd, 
    s.grid(deltaT, (x,y) => {
      let time = parseFloat(x).toPrecision(2);
      solution.push([time,y]);
  })).y
}

function run() {
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update the camera controller
    orbitControls.update();

    // Update bodies.
    if (simulate && Date.now() - tLastUpdate > deltaT) {
      //console.log("Time: ", solution[iter][0]);
      let y = solution[iter][1];
      for (let i = 0; i < num_bodies; ++i) {
        bodies[i].position.set(y[off_r[i]], y[off_r[i]+1], y[off_r[i]+2]);
      }
      ++iter;
      if (iter == solution.length) {
        simulate = false;
      }
      tLastUpdate = Date.now();
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
    bodies.push(mesh1);
    group.add(mesh1);

    mesh2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x00ff00}));
    bodies.push(mesh2);
    group.add(mesh2);

    mesh3 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xf0f0f0}));
    bodies.push(mesh3);
    group.add(mesh3);

    // Add a directional light to show off the object
    let light = new THREE.DirectionalLight( new THREE.Color("rgb(200, 200, 200)"), 1);

    // Position the light out from the scene, pointing at the origin
    light.position.set(-2, -2, 2);
    light.target.position.set(0,0,0);
    
    scene.add( root );
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
    let r1 = [-2, 0, 0];
    mesh1.position.set(...r1);
    let r2 = [2, 0, 0];
    mesh2.position.set(...r2);
    let r3 = [0, 0, -2];
    mesh3.position.set(...r3);
    let r = [r1, r2, r3];
     // Define initial velocities
    let v1 = [0,0.5,0];
    let v2 = [0,0.5,0];
    let v3 = [0,0.5,0];
    let v = [v1, v2, v3];

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
    solve(y0);
    simulate = true;
    // console.log(y0);
    // console.log(solution);
}