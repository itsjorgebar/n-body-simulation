// *****************************************************************************
//  Globals 
// *****************************************************************************

// Imports
var $ = require('jquery')

var odex = require('odex');

var THREE = require('three')
const MeshLine = require('three.meshline').MeshLine;
const MeshLineMaterial = require('three.meshline').MeshLineMaterial;
const { Vector3, Raycaster, Vector2 } = require('three');
var OrbitControls = require('three-orbit-controls')(THREE);
var { EffectComposer, EffectPass, RenderPass, OutlineEffect, BlendFunction } = require('postprocessing');

var Dat = require('dat.gui');
var init = require('three-dat.gui');

// Post-processing globals
let raycaster = new Raycaster(), selectedObject = null, effect = null, pass = null, selection = [];

// three-dat gui
init(Dat);
let playpause = null;

// Canvas globals
let renderer = null,
  scene = null,
  camera = null,
  orbitControls = null,
  ambientLight = null,

  // Simulation globals
  solution = [],
  tLastUpdate = null,
  iter = 0,
  simulate = false,
  deltaT = 0.03,
  dims = 3, // x,y,z
  eqs = 2, // acceleration and velocity. 
  bodies = [],
  trailList = [],
  arrowList = [];

// *****************************************************************************
//  Helpers
// *****************************************************************************

function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Returns an array of args for the setLength function of an ArrowHelper.
function arrowLength(v) {
  return [v.length() * 3, v.length() * 4 / 6, v.length() * 4 / 12];
}

// Returns all body indices except a.
function otherBodies(toExclude) {
  result = [];
  bodies.forEach(body => {
    if (body != toExclude) {
      result.push(body);
    }
  });
  return result;
}

// Returns position vector of a body in a solution.
function getPosition(y, body) {
  return new Vector3(y[body.irx], y[body.iry], y[body.irz]);
}

// Returns velocity vector of a body in a solution.
function getVelocity(y, body) {
  return new Vector3(y[body.ivx], y[body.ivy], y[body.ivz]);
}

class Body {
  constructor(mass, rx, ry, rz, vx, vy, vz, showArrow=true) {
    this.color = getRandomColor();
    this.mass = mass;

    // Mesh.
    // TODO: make first arg proportional to mass.
    let geometry = new THREE.SphereGeometry(0.8, 20, 20);
    let material = new THREE.MeshPhongMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(rx, ry, rz);
    this.mesh.name = "Body";

    // Velocity arrow.
    let velocity = new THREE.Vector3(vx,vy,vz);
    this.arrowV = new THREE.ArrowHelper(velocity.clone().normalize(), 
      THREE.Vector3(), 3, 0xff0000);
    this.arrowV.setLength(...arrowLength(velocity));
    this.mesh.add(this.arrowV);
    this.velocity = velocity;
    this.arrowV.visible = showArrow;
    arrowList.push(this.arrowV);

    // Solution offsets.
    //   [r1x, r1y, r1z, v1x, v2y, v3z
    //    ...,
    //    rNx, rNy, rNz, vNx, vNy, vNz]
    this.irx = eqs * dims * bodies.length + 0;
    this.iry = this.irx + 1;
    this.irz = this.irx + 2;
    this.ivx = this.irx + 3;
    this.ivy = this.irx + 4;
    this.ivz = this.irx + 5;
  }

  // Update velocity components of the body. Receives a Vector3 object.
  updateVelocity(v) {
    this.velocity = v;
    this.arrowV.setDirection(v.clone().normalize());
    this.arrowV.setLength(...arrowLength(v));
  }
}


class Trail { 
  constructor(rX, rY, rZ, colour){
      // Set the size of the trail
      this.trail_lenght = 400;

      // Create the line geometry used for storing verticies
      this.trail_geometry = new THREE.Geometry();

      // Must initialize it to the number of positions it will keep or it will throw an error
      for (var i = 0; i < this.trail_lenght; i++) { 
          this.trail_geometry.vertices.push(new THREE.Vector3(rX,rY,rZ));
      }
  
      // Create the line mesh
      this.trail_line = new MeshLine();
      this.trail_line.setGeometry( this.trail_geometry,  function( p ) { return p; }  ); // makes width taper
  
      // Specify the canvas size (REQUIRED by library)
      var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
  
      // Create the line material
      this.trail_material = new MeshLineMaterial( {
          color: colour,
          opacity: 0.5,
          resolution: resolution,
          sizeAttenuation: 1,
          lineWidth: 0.2,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          transparent: false,
          side: THREE.DoubleSide
      });
      this.trail_mesh = new THREE.Mesh( this.trail_line.geometry, this.trail_material ); 
      this.trail_mesh.name = "Trail";
      this.trail_mesh.frustumCulled = false;
  }
}

// *****************************************************************************
// Math
// *****************************************************************************

// Returns v' solutions for a body affected by the gravitation of another.
function bodyAcc2(receiver, applier, y) {
  // Vector from receiver to applier.
  let rRecToApp = new Vector3().subVectors(getPosition(y, receiver),
    getPosition(y, applier));

  // Acceleration scalar.
  let G = 1  // 6.67408e-11 
  let K = 10  // Empirically tuned constant.
  let scalar = -1 * K * G * applier.mass / Math.pow(rRecToApp.length(), 3);

  return rRecToApp.multiplyScalar(scalar);
}

// Describes derivatives for a body the other bodies.
// Returns a 6 dimensional vector of velocity and acceleration values.
// Example: [r'x, r'y, r'z, v'x, v'y, v'z]
function bodyEqsN(receiver, appliers, y) {
  // Obtain acceleration (v')
  let netAcc = new THREE.Vector3();
  appliers.forEach(applier => {
    let acc = bodyAcc2(receiver, applier, y);
    netAcc.add(acc);
  });

  return [...getVelocity(y, receiver).toArray(), ...netAcc.toArray()];
}

// Describes the system of ODEs.
// Params -
// t: time (unused)
// y: position and velocity of all bodies.
let NBody = (t,y) => {
  let result = [];
  bodies.forEach(body => {
    result.push(...bodyEqsN(body, otherBodies(body), y));
  });
  return result;
};

// *****************************************************************************
// Simulation
// *****************************************************************************

$(document).ready(
  function () {
    let canvas = document.getElementById("webglcanvas");
    createScene(canvas);

    run();
  }
);

// Solves the system of ODEs and stores the result in the solution global var.
// Params -
//  y0: initial state of the system. It's structured like
//      [r1x, r1y, r1z, v1x, v2y, v3z
//       ...,
//       rNx, rNy, rNz, vNx, vNy, vNz]
//       where r is position, the number is the body index,
//         and (x,y,z) are standard basis vectors
function solve(y0) {
  iter = 0;
  solution = [];
  let s = new odex.Solver(y0.length);
  // Enable dense output to extract new positions and 
  // velocities for each time step
  s.denseOutput = true;

  // Time end and start define duration
  let timeEnd = 10; // seconds.
  s.solve(NBody, 0, y0, timeEnd, 
    s.grid(deltaT, (t,y) => {
      let time = parseFloat(t).toPrecision(2);
      solution.push([time,y]);
  }));
}

function run() {
  requestAnimationFrame(function () { run(); });

  composer.render(scene, camera);
  orbitControls.update();

  // Update bodies.
  if (simulate && Date.now() - tLastUpdate > deltaT) {
    let y = solution[iter][1]; // index 0 is time, 1 is y values.
    bodies.forEach(function(body,i) {
      // Update position
      body.mesh.position.set(y[body.irx], y[body.iry], y[body.irz]);

      // Update velocity arrow.
      let v = getVelocity(y,body);
      body.updateVelocity(v);

      // Update trail line, push new body position
      trailList[i].trail_line.advance(body.mesh.position);

    });
    ++iter;
    if (iter == solution.length) {
      simulate = false;
      const y0 = serializeBodies();
      solve(y0);
      simulate = true;
    }
    tLastUpdate = Date.now();
  }
}

// Define and dipslay basic scene in the canvas.
function setupScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  var onProgress = function ( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round(percentComplete, 2) + '% downloaded' );
    }
  };
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    'assets/skybox/right.png',
    'assets/skybox/left.png',
    'assets/skybox/top.png',
    'assets/skybox/bottom.png',
    'assets/skybox/front.png',
    'assets/skybox/back.png',
  ], undefined, onProgress);
  scene.background = texture;

  camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
  camera.position.set(0, 5, 18);
  scene.add(camera);

  ambientLight = new THREE.AmbientLight(0x444444, 0.8);
  scene.add(ambientLight);

  let light = new THREE.DirectionalLight(new THREE.Color("rgb(200, 200, 200)"), 1);
  light.position.set(-2, -2, 2);
  light.target.position.set(0, 0, 0);
  scene.add(light);

  orbitControls = new OrbitControls(camera, renderer.domElement);

  // post-processing composer
  const outlineEffect = new OutlineEffect(scene, camera, {
    blendFunction: BlendFunction.SCREEN,
    edgeStrength: 2.5,
    pulseSpeed: 0.0,
    visibleEdgeColor: 0xffffff,
    hiddenEdgeColor: 0x22090a,
    height: 480,
    blur: false,
    xRay: true
  });

  outlineEffect.selection.set(selection);
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const outlinePass = new EffectPass(camera, outlineEffect);

  effect = outlineEffect;
  pass = outlinePass;
  composer.addPass(outlinePass);
}

// Returns an array that encodes the bodies' movement.
function serializeBodies() {
  let y0 = [];
  bodies.forEach(body => {
    y0.push(...body.mesh.position.toArray());
    y0.push(...body.velocity.toArray());
  });
  return y0;
}

// Display initial bodies configuration.
function createBodies() {
  // Remove all old bodies.
  bodies.forEach(body => {
    scene.remove(body.mesh);
  });
  bodies = [];

  // Remove all old trails
  trailList.forEach(trail => {
    scene.remove(trail.trail_mesh);
  });
  trailList = [];

  // Define initial values.  arXiv:math/0011268
  let r = [];
  r.push([-0.97000436, 0.24308753, 0]);
  r.push([0, 0, 0]);
  r.push([0.97000436, -0.24308753, 0]);
  r = r.map((e) => e.map(i => i *= 10));

  let v = [];
  v.push([0.4662036850, 0.4323657300, 0]);
  v.push([-0.93240737, -0.86473146, 0]);
  v.push([0.4662036850, 0.4323657300, 0]);

  // Create initial bodies.
  let b1 = new Body(1, ...r[0], ...v[0]);
  bodies.push(b1);
  scene.add(b1.mesh);

  let b2 = new Body(1, ...r[1], ...v[1]);
  bodies.push(b2);
  scene.add(b2.mesh);

  let b3 = new Body(1, ...r[2], ...v[2]);
  bodies.push(b3);
  scene.add(b3.mesh);


  // Add default trails to scene
  let t1 = new Trail(...r[0], b1.color);
  trailList.push(t1);
  scene.add(t1.trail_mesh);

  let t2 = new Trail(...r[1], b2.color);
  trailList.push(t2);
  scene.add(t2.trail_mesh);

  let t3 = new Trail(...r[2], b3.color);
  trailList.push(t3);
  scene.add(t3.trail_mesh);

  return serializeBodies();
}

function createUI() {
  let rx = "0", ry = "0", rz = "0", vx = "1", vy = "1", vz = "0", mass = 1;
  
  function addbody() {
    if (mass && rx && ry && rz && vx && vy && vz) {
      // Create body.
      const args = [mass, rx, ry, rz, vx, vy, vz].map(k => parseFloat(k));
      let b = new Body(...args, !simulate);
      bodies.push(b);
      scene.add(b.mesh)

      // Add Trail 
      let t = new Trail(rx,ry,rz, b.color);
      trailList.push(t);
      scene.add(t.trail_mesh);

      // Compute simulation.
      let y0 = serializeBodies();
      solve(y0);
    } else {
      alert("Body attributes haven't been specified.")
    }
  }

  function toggleArrows() {
    arrowList.forEach(e => e.visible = !e.visible);
    scene.updateMatrixWorld();
  }

  var options = {
    // control simulation
    'Play / Pause': function () {
      simulate = !simulate;
      toggleArrows();
    },
    // control reset simulation
    Reset: function () {
      resetSimulation();
    },
    'Add body': function () {
      addbody();
    },
    // control to remove last particle
    'Remove body': function () {
      if (bodies.length == 0) return;

      // Remove last body from scene
      scene.remove(bodies[bodies.length - 1].mesh);

      // Remove last trail from scene
      scene.remove(trailList[trailList.length - 1].trail_mesh);

      // Remove body and trail from their respective lists
      bodies.pop();
      trailList.pop();

      // Set up initial variable array for simulation
      let y0 = serializeBodies();
      solve(y0);
    },
    // control to listen to Display vectors
    checkboxVectors: true
  }

  // object for the textfields
  var input = {
    rx: rx,
    ry: ry,
    rz: rz,
    vx: vx,
    vy: vy,
    vz: vz,
    Mass: mass 
  }

  // instnatiate new dat GUI
  var gui = new Dat.GUI();

  // gui folder animation controls
  var anim = gui.addFolder('Animation');
  anim.add(options, 'Play / Pause');
  anim.add(options, 'Reset');

  // folder edit bodies controls
  var edit = gui.addFolder('Bodies');

  var position = edit.addFolder('Position');
  position.add(input, "rx").name('x').onFinishChange((val) =>
    rx = val
  );
  position.add(input, "ry").name('y').onFinishChange((val) =>
    ry = val
  );
  position.add(input, "rz").name('z').onFinishChange((val) =>
    rz = val
  );

  var velocity = edit.addFolder('Velocity');
  velocity.add(input, "vx").name('x').onFinishChange((val) =>
    vx = val
  );
  velocity.add(input, "vy").name('y').onFinishChange((val) =>
    vy = val
  );
  velocity.add(input, "vz").name('z').onFinishChange((val) =>
    vz = val
  );

  edit.add(input, "Mass").min(0.2).max(10).step(0.2).onFinishChange(val => mass = val);
  // edit.add(input, "Mass").onFinishChange((val) =>
  //   mass = val
  // );

  edit.add(options, 'Add body');
  edit.add(options, 'Remove body');

  function rayCast(event) {

    //if(event.isPrimary===false) return;
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2.0 - 1.0;
    mouse.y = -(event.clientY / window.innerHeight) * 2.0 + 1.0;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true); //!
    if (intersects.length > 0) {
      const object = intersects[0].object;

      if (object !== undefined) {
        selectedObject = object;
        handleSelection();
      }
    }
  }

  function handleSelection() {
    const selection = effect.selection;

    // avoid highlight arrows
    selection.clear();
    if (selectedObject !== null && selectedObject.children.length > 0) {
      selection.size > 0 ?
        selection.clear() : selection.add(selectedObject)

    } else {
      selection.clear();
    }
  }

  // handle 
  renderer.domElement.addEventListener("pointermove", () => {
    if (simulate) {
      rayCast(event);
    }
  });

  renderer.domElement.addEventListener("mousedown", (event) => {
    event.preventDefault();
    const mouse = new Vector2();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;

      if (object != undefined) {
        let target = object.position;
        camera.lookAt(target);
        orbitControls.target = target;
      }
    }
  });
}

function createScene(canvas) {
  setupScene(canvas);
  let y0 = createBodies();
  solve(y0);
  createUI();
}

function resetSimulation() {
  simulate = false;
  camera.position.set(0, 5, 18);
  let v = new Vector3();
  camera.lookAt(v);
  console.log(camera);

  let y0 = createBodies();
  solve(y0);
}
