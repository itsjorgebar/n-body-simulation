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
let currTime = null;
let iter = 0;
let simulate = false;
let deltaT = 0.1;
 
// var s = new odex.Solver(1);
// var f = function(x, y) {
//     return y;
// }
// console.log(s.solve(f,
//     0,    // initial x value
//     [1],  // initial y values (just one in this example)
//     1));
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
// Define masses
let m1=1.2
let m2=8 

// Define initial position vectors
let r1 = [-2, -2, -2];
let r2 = [2, 2, 2];

// Define initial velocities
v1=[0.01,0.01,0] // m/s
v2=[-0.05,0,-0.1] // m/s

let TwoBody = (m1,m2) => {

  // Returns eqs solutions for body with index a, given another body b.
  function body(a, b, y) {
    let eqs = 2; // acceleration and velocity. 
    let dims = 3;

    // r offsets.
    let a_r_off = a*dims*eqs;
    let b_r_off = b*dims*eqs;
    // let c_r_off = c*dims*eqs;

    // vector from a to b.
    let r_ab = [y[0 + a_r_off] - y[0 + b_r_off], 
                y[1 + a_r_off] - y[1 + b_r_off], 
                y[2 + a_r_off] - y[2 + b_r_off]];

    let denom = Math.pow(Math.sqrt(r_ab[0]**2 + r_ab[1]**2 + r_ab[2]**2), 3);
    let scalar_ab = G * m2 / denom;

    // v offsets.
    let a_v_off = a_r_off + dims;
    let b_v_off = b_r_off + dims;
    // let c_v_off = c_r_off + dims;

    return [
      scalar_ab * r_ab[0],
      scalar_ab * r_ab[1],
      scalar_ab * r_ab[2],
      y[0 + a_v_off],
      y[1 + a_v_off],
      y[2 + a_v_off],
    ];

  }
  return (x,y) => {
    // let r12 = [y[0] - y[0 + 2*3], y[1] - y[1 + 2*3], y[2] - y[2 + 2*3]];
    // let denom1 = Math.pow(Math.sqrt(r12[0]**2 + r12[1]**2 + r12[2]**2), 3);
    // let scalar1 = G * m2 / denom1;
    // return [
    //   scalar1 * r12[0],
    //   scalar1 * r12[1],
    //   scalar1 * r12[2],
    //   y[0 + 1*3],
    //   y[1 + 1*3],
    //   y[2 + 1*3],
    // ];
    return [
      ...body(0,1,y),
      ...body(1,0,y)
    ];
  };

};

let f = (x, y) => {
     return y;
}
function solve() {
  // let odex = require('odex');
  let s = new odex.Solver(12);
  // let s = new odex.Solver(1);
  // console.log(s.solve(f,
  //    0,    // initial x value
  //    [1],  // initial y values (just one in this example)
  //    1));
  s.denseOutput = true;  // request interpolation closure in solution callback
  sol = s.solve(TwoBody(m1,m2), 0, [...r1,...v1, ...r2, ...v2], 5, s.grid(deltaT, function(x,y) {
    let time = parseFloat(x).toPrecision(2);
    solution.push([time,y]);
    // console.log("Time: "+ time);
    // console.log("State: ",y);
  })).y
}

function run() {
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update the camera controller
    orbitControls.update();

    // Update bodies.
    if (simulate && Date.now() - currTime > deltaT) {
      // console.log("update bodies");
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
    solve();
    simulate = true;
}