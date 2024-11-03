"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  BoxGeometry,
  Mesh,
  MeshNormalMaterial,
  AmbientLight,
  Clock,
  SphereGeometry,
  MeshBasicMaterial,
  Curve,
  TubeGeometry,
  Vector3,
  LineCurve3,
  CurvePath,
  DoubleSide,
  Box3,
  Color,
  AudioListener,
  Audio,
  AudioLoader,
  TextureLoader,
  PlaneGeometry
} from 'three';

// If you prefer to import the whole library, with the THREE prefix, use the following line instead:
// import * as THREE from 'three'

// NOTE: three/addons alias is supported by Rollup: you can use it interchangeably with three/examples/jsm/  

// Importing Ammo can be tricky.
// Vite supports webassembly: https://vitejs.dev/guide/features.html#webassembly
// so in theory this should work:
//
// import ammoinit from 'three/addons/libs/ammo.wasm.js?init';
// ammoinit().then((AmmoLib) => {
//  Ammo = AmmoLib.exports.Ammo()
// })
//
// But the Ammo lib bundled with the THREE js examples does not seem to export modules properly.
// A solution is to treat this library as a standalone file and copy it using 'vite-plugin-static-copy'.
// See vite.config.js
// 
// Consider using alternatives like Oimo or cannon-es
import {
  OrbitControls,

} from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import {
  GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import { getRndInteger, updateScore } from './utils';
import { checkCollision } from './utils';
import { winOrNot } from './utils';
import { rotateObject,moveSperm } from './movement';
// Example of hard link to official repo for data, if needed
// const MODEL_PATH = 'https://raw.githubusercontent.com/mrdoob/js/r148/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';


const scene = new Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new PerspectiveCamera(75, aspect, 0.1, 1000);
const cameraOffset = new Vector3(0, 2, 10);
const light = new AmbientLight(0xffffff, 1.0); // soft white light
scene.add(light);

const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const listener = new AudioListener();
camera.add(listener);

var bool_end= false;
const sound = new Audio(listener);
const controls = new OrbitControls(camera, renderer.domElement);
//controls.listenToKeyEvents(window); // optional
//controls.autoRotate = true;

//Infection
const geometryInfection = new BoxGeometry( 1, 1, 1 );
const material = new MeshBasicMaterial();
material.side = DoubleSide;
material.color = new Color(128,0,0);
const material1 = new MeshBasicMaterial();
const material2 = new MeshBasicMaterial();
var infectionArr=[];
var BoxArr=[];

function virusGenerate(viruss){
  var virus = viruss.clone();
  var x = getRndInteger(-5,5);
  
  var y = getRndInteger(-5+Math.abs(x),5-Math.abs(x));
  var z = getRndInteger(200,0);
  virus.scale.set(0.06, 0.1, 0.1);
  virus.position.x = x;
  virus.position.y = y;
  virus.position.z = z;
  infectionArr.push(virus);
  virus.traverse(function(child) {
    if (child.isMesh) {
        child.material = new MeshBasicMaterial({ color: 0x00ff00 });

        }});
  scene.add(virus);
  BoxArr.push((new Box3(new Vector3(), new Vector3())).setFromObject(virus));
  
}
function gltfVirusReader(gltf){
  for (let i = 0; i < 180; i++) {
    virusGenerate(gltf.scene);
  }
  renderer.render(scene,camera);
  
}
function loadInfection() {
  console.log("data loaded");
  new GLTFLoader()
    .setPath('public/assets/models/')
    .load('virus.gltf', gltfVirusReader, undefined, onError);
}
function onError(error) {
  console.error('Error loading GLTF model:', error);
}


loadInfection();

//---------------------------------------------------
//tube
//tube entre z=0 a 230
//et entre x = 15 a 25
// y entre 0 et 10, attention c'est un cercle
//centre = x20 y 5
const end = 0;
const p1 = new Vector3(0,0,end);
//const p2 = new Vector3(-200,0,0);
//const tube1 = new LineCurve3(p2,p1);
const v2 = new Vector3(0, 0, 230);
const tube2 = new LineCurve3( p1, v2);    
var path2 = new CurvePath();
//path2.add(tube1); 
path2.add(tube2); 
const tubularSegments = 20;  

const radius = 5;  

const radialSegments = 8;  

const closed = false;  
//TODO ssperm se desagrege en fct du nombre de visrus qu'ils tpouche
const geometry = new TubeGeometry(path2, tubularSegments, radius, radialSegments, closed );
const alltube = new Mesh( geometry, material );
scene.add( alltube );

//--------------------------------------
//SPERM
var sperm = undefined;
var playerBB;

function loadSperm() {
  console.log("data loaded");
  new GLTFLoader()
    .setPath('public/assets/models/')
    .load('spermatozoide.gltf', gltfSpermReader, undefined, onError);
}


function gltfSpermReader(gltf) {


  sperm = gltf.scene;

  if (sperm != undefined) {
    sperm.scale.set(0.06, 0.1, 0.1);
    scene.add( sperm );
    sperm.position.set(0,-1,210 );//FIXME
    sperm.rotation.y=-2*Math.PI/4;
    sperm.material = new MeshBasicMaterial({ color: 0xffffffff });
    sperm.traverse(function(child) {
    if (child.isMesh) {
        child.material = new MeshBasicMaterial({ color: 0xffffffff });        
        }});
    playerBB = new Box3(new Vector3(), new Vector3());
    playerBB.setFromObject(sperm);
    camera.position.set(sperm.position.x + cameraOffset.x, sperm.position.y + cameraOffset.y, sperm.position.z + cameraOffset.z);
    renderer.render(scene,camera);
  } else {
    console.log("Load FAILED.  ");
  }
}

loadSperm();
//-----------------------------------------------
//ovule

function gltfOvuleReader(gltf) {

  var ovule = gltf.scene;

  if (ovule != undefined) {
    console.log("Model loaded:  " + ovule);
    ovule.scale.set(1, 1, 1);
    scene.add( ovule );
    ovule.position.set(0,0,end-20 );
    ovule.rotation.y = -Math.PI/2;
    renderer.render(scene,camera);
  } else {
    console.log("Load FAILED.  ");
  }
}
function loadOvule() {
  console.log("data loaded");
  new GLTFLoader()
    .setPath('public/assets/models/')
    .load('ovule.glb', gltfOvuleReader, undefined, onError);
}

loadOvule();

//-----------------------------------------------------
// loose text

var textMesh;
function load_end_text(text){
  const textloader = new FontLoader();
textloader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: 1.8,
        height: 0.2,
        curveSegments: 12,
    });
    const textMaterial = new MeshBasicMaterial({ color: 0xffffffff });
    textMesh = new Mesh(textGeometry, textMaterial);
    console.log(textMesh);
    textMesh.position.set(-23.8, -8, end-15);

});
}

//----------------------------
//audio

const audioLoader = new AudioLoader();
audioLoader.load('public/assets/musique/musique-epique-de-skyrim_SCyFcdcI.mp3', function(buffer) {
    console.log("musique");
    sound.setBuffer(buffer);
    sound.setLoop(true); 
    sound.setVolume(0.5);
    document.getElementById('startButton').style.display = 'block'; // Cacher le bouton

});

function change_musique(path)
{
  if (sound.isPlaying)
  {
    sound.stop();
  }
  console.log(path);
  audioLoader.load(path, function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});
}
//Load image bébé
const textureLoader = new TextureLoader();
const texture = textureLoader.load('public/assets/image/imagebébé.jpg');
const geometrybébé = new PlaneGeometry(8,8 );
const materialbébé = new MeshBasicMaterial({ map: texture });
const planebébé = new Mesh(geometrybébé, materialbébé);
planebébé.position.set(0,0,end-10);


const keysPressed = {};

window.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});
const clock = new Clock();

//camera.lookAt(sperm.position);
// Main loop
camera.position.set(0 + cameraOffset.x, -1 + cameraOffset.y, 210 + cameraOffset.z);
camera.lookAt(0,-1,210);
function updateCamera()
{
  
  camera.lookAt(sperm.position);
}
const moveSpeed = 0.08;


function update_virus(){
  for (let i = 0; i < infectionArr.length;i++)
  {
    if (camera.position.z-infectionArr[i].position.z>40 /*|| camera .position.z-infectionArr[i].position.z<0*/)
    {
      infectionArr[i].visible = false;
    }
    else{
      infectionArr[i].visible=true;
    }
  }
}
const animation = () => {

renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // can be used in shaders: uniforms.u_time.value = elapsed;
  if(!bool_end){
    if (keysPressed['ArrowUp'])
      {
      sperm.position.y += moveSpeed;
      sperm.rotation.x = Math.PI/4;
      
      }
    if (keysPressed['ArrowDown'])
      {
      sperm.position.y -= moveSpeed;
      sperm.rotation.x = -Math.PI/4;
      }
    if (keysPressed['ArrowLeft'])
      {
     
      sperm.rotation.y = -Math.PI/3;
      sperm.position.x -= moveSpeed;
      }
    if (keysPressed['ArrowRight'])
      {
      sperm.position.x += moveSpeed;
      sperm.rotation.y = -2*Math.PI/3;
      }
    if ( keysPressed['w'])
    {
      sperm.position.z = end+10;
      updateScore(100);
    }
    if (keysPressed['l'])
    {
      sperm.position.z = end+10;
      updateScore(0);
    }
  
      
  }
  updateCamera();
  controls.update();
  renderer.render(scene, camera);
  }



const basic_speed = 0.4;


async function  finish(){
  const win = winOrNot();
  //const win = true;
  if(win)
  {
    load_end_text("Ton spermatozoide est rentre dans l'ovule !");

  }
  else{
    load_end_text("Ton spermatozoide n'est pas assez fort...");

  }
  await moveSperm(sperm,6,true);
  await rotateObject(sperm,3);
  //const win = winOrNot();
  scene.add(textMesh);
  change_musique(win?"public/assets/musique/bebe qui pleure.mp3":"public/assets/musique/musique-triste-piano-et-violon-song-from-a-secret-garden_mt9UIyhj.mp3");
  if (win)
  {
    console.log("win");
    
    await moveSperm(sperm,-1.6,true,true);
    scene.add(planebébé);
  }
  else{
    console.log("lost");
    sperm.rotation.z = Math.PI;
    moveSperm(sperm,100,false,true);
  }
  
  
    
}

document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('startButton').style.display = 'none'; // Cacher le bouton
    if(!sound.isPlaying){
      sound.play();
    }
    
    render();
});






const render = () => {
  if (bool_end)
  {
    finish()
    return;
  }
  animation();
  update_virus();
  requestAnimationFrame( render );
  
  if(sperm && playerBB)
  {
    if (sperm.position.z < end && !bool_end)
      {
        bool_end=true;
        camera.position.set(0,0,end);
        sperm.position.set(20,0,end -24.9);
        sperm.rotation.y = 0;
        sperm.rotation.x = Math.PI/4;
        sperm.material.color = 'white';
        //finish();

      }
      
      else{
        console.log()
        checkCollision(sperm,playerBB,BoxArr);
        sperm.position.z -=basic_speed;
        //sperm.rotation.z+=0.8;
        camera.lookAt(sperm.position);
        camera.position.z -= basic_speed;
      }
      
  }
  renderer.render( scene, camera );
};
//requestAnimationFrame(  renderer.render( scene, camera ) );

//render();

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}


