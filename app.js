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
mass = [1.2, 8];
// Define solution offsets.
off_r = [],
off_v = [],

$(document).ready(
	function() {
		let canvas = document.getElementById("webglcanvas");
		createScene(canvas);

		run();
	}
);

// Returns eqs solutions for body with index a, affected by another body b.
function body(a, b, y) {
  // vector from b to a.
  let r_ba = [y[0 + off_r[a]] - y[0 + off_r[b]], 
              y[1 + off_r[a]] - y[1 + off_r[b]], 
              y[2 + off_r[a]] - y[2 + off_r[b]]];

  let denom = Math.pow(Math.sqrt(r_ba[0]**2 + r_ba[1]**2 + r_ba[2]**2), 3);
  // Define universal gravitation constant
  let G = 6.67408e-11;
  let K = 1000000000 
  let scalar_ab = -1 * K * G * mass[b] / denom;

  return [
    // position derivatives (r')
    y[0 + off_v[a]],
    y[1 + off_v[a]],
    y[2 + off_v[a]],
    // velocity derivatives (v' or r'' or acceleration)
    scalar_ab * r_ba[0],
    scalar_ab * r_ba[1],
    scalar_ab * r_ba[2],
  ];
}

let TwoBody = (x,y) => {
  return [
    ...body(0,1,y),
    ...body(1,0,y)
  ];
};

// Solves the system of ODEs and stores the result in the solution global var.
function solve(y0) {
  let s = new odex.Solver(y0.length);
  s.denseOutput = true;
  timeEnd = 200; // seconds.
  sol = s.solve(TwoBody, 0, y0, timeEnd, 
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
      // console.log("update bodies");
      //console.log("Time: ", solution[iter][0]);
      let y = solution[iter][1];
      for (i = 0; i < bodies.length; ++i) {
        bodies[i].position.set(y[off_r[i]], y[off_r[i]+1], y[off_r[i]+2]);
        //console.log(bodies[i].position);
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

    // Create the sphere
    geometry = new THREE.SphereGeometry(0.8, 20, 20);
    mesh1 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xff0000}));
    bodies.push(mesh1);
    group.add(mesh1);

    // Create the sphere
    geometry = new THREE.SphereGeometry(0.8, 20, 20);
    mesh2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x0000ff}));
    bodies.push(mesh2);
    group.add(mesh2);

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
    let eqs = 2; // acceleration and velocity. 
    let dims = 3; // x,y,z
    let num_bodies = 2;
    for (i = 0; i < num_bodies; ++i) {
      off_r.push(eqs * dims * i);
      off_v.push(off_r[i] + dims);
    }
    // Initial values of the system.
    // Define initial position vectors
    let r1 = [-2, 0, 0];
    mesh1.position.set(...r1);
    let r2 = [2, 0, 0];
    mesh2.position.set(...r2);
     // Define initial velocities
    let v1 = [0,0.5,0];
    let v2 = [0,0.5,0];
    let y0 = [...r1,...v1, ...r2, ...v2];
    solve(y0);
    simulate = true;
}