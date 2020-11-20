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
dragControls= null;
let bodies = [];

let ambientLight = null;

let solution = [];
let tLastUpdate = null;
let iter = 0;
let simulate = false;
let deltaT = 0.1;
let timeEnd = 200;
 
$(document).ready(
	function() {
		let canvas = document.getElementById("webglcanvas");
		createScene(canvas);

		run();
	}
);

//  Physics
// Define universal gravitation constant
let G=6.67408e-11 // N-m2/kg2

// Define initial position vectors
let r1 = [-2, 0, 0];
let r2 = [2, 0, 0];

// Define initial velocities
v1=[0,0.5,0] // m/s
v2=[0,0.5,0] // m/s

let off_r = [];
let off_v = [];
let mass = [1.2, 8];

// Returns eqs solutions for body with index a, affected by another body b.
function body(a, b, y) {
  // vector from a to b.
  let r_ab = [y[0 + off_r[a]] - y[0 + off_r[b]], 
              y[1 + off_r[a]] - y[1 + off_r[b]], 
              y[2 + off_r[a]] - y[2 + off_r[b]]];

  let denom = Math.pow(Math.sqrt(r_ab[0]**2 + r_ab[1]**2 + r_ab[2]**2), 3);
  let scalar_ab = 1000000000 * -1 * G * mass[b] / denom;

  return [
    y[0 + off_v[a]],
    y[1 + off_v[a]],
    y[2 + off_v[a]],
    scalar_ab * r_ab[0],
    scalar_ab * r_ab[1],
    scalar_ab * r_ab[2],
  ];

}

let TwoBody = (x,y) => {
  return [
    ...body(0,1,y),
    ...body(1,0,y)
  ];
};

function solve() {
  let s = new odex.Solver(12);
  s.denseOutput = true;  // request interpolation closure in solution callback
  sol = s.solve(TwoBody, 0, [...r1,...v1, ...r2, ...v2], timeEnd, 
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
    // simulate = false;
    if (simulate && Date.now() - tLastUpdate > deltaT) {
      // console.log("update bodies");
      console.log("Time: ", solution[iter][0]);
      let y = solution[iter][1];
      // console.log(y);
      for (i = 0; i < bodies.length; ++i) {
        bodies[i].position.set(y[off_r[i]], y[off_r[i]+1], y[off_r[i]+2]);
        console.log(bodies[i].position);
      }
      // simulate = false;
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
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0xff0000}));
    mesh.position.set(...r1);
    bodies.push(mesh);
    group.add( mesh );

    // Create the sphere
    geometry = new THREE.SphereGeometry(0.8, 20, 20);
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x0000ff}));
    mesh.position.set(...r2);
    bodies.push(mesh);
    group.add( mesh );

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
    let dims = 3;
    let num_bodies = 2;
    for (i = 0; i < num_bodies; ++i) {
      off_r.push(eqs * dims * i);
      off_v.push(off_r[i] + dims);
    }
    solve();
    simulate = true;
}