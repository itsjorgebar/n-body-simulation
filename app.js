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
 
var s = new odex.Solver(1);
var f = function(x, y) {
    return y;
}
console.log(s.solve(f,
    0,    // initial x value
    [1],  // initial y values (just one in this example)
    1))

$(document).ready(
	function() {
		let canvas = document.getElementById("webglcanvas");
		createScene(canvas);

		run();
	}
);

function run() {
    requestAnimationFrame(function() { run(); });
    
    // Render the scene
    renderer.render( scene, camera );

    // Update the camera controller
    orbitControls.update();
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
    bodies.push(mesh);
    group.add( mesh );

    // Create the sphere
    geometry = new THREE.SphereGeometry(0.8, 20, 20);
    mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:0x0000ff}));
    mesh.position.set(3,3,3);
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
}