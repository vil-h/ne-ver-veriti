import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
export function createVerity(scene){
 const root=new TransformNode('Verity',scene);root.setEnabled(false);
 const gold=new StandardMaterial('verity-amber',scene);gold.diffuseColor=Color3.FromHexString('#edb331');gold.specularColor=new Color3(.65,.43,.13);gold.specularPower=44;gold.emissiveColor=new Color3(.14,.075,.008);
 const ball=MeshBuilder.CreateSphere('verity-sphere',{diameter:.72,segments:28},scene);ball.material=gold;ball.parent=root;ball.isPickable=false;
 // Curved face patch sits on the front surface of the sphere, not a flat billboard.
 const paths=[];for(let y=0;y<=16;y++){const row=[];for(let x=0;x<=22;x++){const u=(x/22-.5)*1.5,v=(y/16-.5)*1.35,r=.364;row.push(new Vector3(Math.sin(u)*Math.cos(v)*r,Math.sin(v)*r,-Math.cos(u)*Math.cos(v)*r));}paths.push(row);}
 const face=MeshBuilder.CreateRibbon('verity-face',{pathArray:paths,sideOrientation:2},scene);face.parent=root;face.isPickable=false;
 const tex=new DynamicTexture('verity-expression',{width:512,height:512},scene,false);tex.hasAlpha=true;
 const mat=new StandardMaterial('expression-ink',scene);mat.diffuseTexture=tex;mat.useAlphaFromDiffuseTexture=true;mat.specularColor=Color3.Black();mat.backFaceCulling=false;face.material=mat;
 let emotion='friendly',talking=false,lastMouth=-1;
 function draw(mouth=0){
  const c=tex.getContext();c.clearRect(0,0,512,512);c.fillStyle='#17150f';c.strokeStyle='#17150f';c.lineCap='round';
  for(const x of [158,354]){c.beginPath();c.ellipse(x,219,22,emotion==='suspicious'?31:45,emotion==='angry'?(x<200?-.3:.3):0,0,Math.PI*2);c.fill();}
  c.lineWidth=17;c.beginPath();c.moveTo(160,328);c.bezierCurveTo(215,emotion==='angry'?360:405+mouth*14,304,emotion==='angry'?360:405+mouth*14,357,322);c.stroke();
  if(mouth>.5){c.beginPath();c.ellipse(260,366,37,11+mouth*10,0,0,Math.PI*2);c.fill();}
  if(emotion!=='friendly'){c.lineWidth=13;for(const x of [158,354]){c.beginPath();c.moveTo(x-29,153+(emotion==='angry'&&x>200?20:0));c.lineTo(x+29,153+(emotion==='angry'&&x<200?20:0));c.stroke();}}
  tex.update();
 }
 draw();
 return {root,ball,setEmotion(value){emotion=value==='neutral'?'friendly':value;draw();},setTalking(value){talking=value;if(!value)draw();},update(t,camera,origin,appear,dt){
  if(!root.isEnabled())return;
  const target=appear?new Vector3(0,1.15,.4):origin;
  root.position=Vector3.Lerp(root.position,target,1-Math.exp(-dt*7));
  root.position.y=target.y+Math.sin(t*1.8)*.075;
  root.rotation.y=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z)+Math.PI;
  root.rotation.z=Math.sin(t*1.1)*.035;
  const mouth=talking?Math.floor((Math.sin(t*19)+1)*1.5):0;if(mouth!==lastMouth){draw(mouth/3);lastMouth=mouth;}
 }};
}
