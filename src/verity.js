import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
export function createVerity(scene){
 const root=new TransformNode('Verity',scene);root.setEnabled(false);
 const gold=new StandardMaterial('verity-amber',scene);gold.diffuseColor=Color3.FromHexString('#edb331');gold.specularColor=new Color3(.65,.43,.13);gold.specularPower=44;gold.emissiveColor=new Color3(.14,.075,.008);
 const ball=MeshBuilder.CreateSphere('verity-sphere',{diameter:.72,segments:40},scene);ball.material=gold;ball.parent=root;ball.isPickable=false;
 // Curved face patch sits on the front surface of the sphere, not a flat billboard.
 const paths=[];for(let y=0;y<=16;y++){const row=[];for(let x=0;x<=22;x++){const u=(x/22-.5)*1.5,v=(y/16-.5)*1.35,r=.364;row.push(new Vector3(Math.sin(u)*Math.cos(v)*r,Math.sin(v)*r,-Math.cos(u)*Math.cos(v)*r));}paths.push(row);}
 const face=MeshBuilder.CreateRibbon('verity-face',{pathArray:paths,sideOrientation:2},scene);face.parent=root;face.isPickable=false;
 const tex=new DynamicTexture('verity-expression',{width:512,height:512},scene,false);tex.hasAlpha=true;
 const mat=new StandardMaterial('expression-ink',scene);mat.diffuseTexture=tex;mat.useAlphaFromDiffuseTexture=true;mat.specularColor=Color3.Black();mat.backFaceCulling=false;face.material=mat;
 let emotion='friendly',talking=false,lastMouth=-1,lastBlink=-1,amplitude=0;
 function draw(mouth=0,blink=0){
  const c=tex.getContext();c.clearRect(0,0,512,512);c.fillStyle='#17150f';c.strokeStyle='#17150f';c.lineCap='round';
  for(const x of [158,354]){c.beginPath();c.ellipse(x,219,22,Math.max(3,(emotion==='suspicious'?31:45)*(1-blink)),emotion==='angry'?(x<200?-.3:.3):0,0,Math.PI*2);c.fill();}
  c.lineWidth=17;c.beginPath();c.moveTo(160,328);c.bezierCurveTo(215,emotion==='angry'?360:405+mouth*14,304,emotion==='angry'?360:405+mouth*14,357,322);c.stroke();
  if(mouth>.1){c.beginPath();c.ellipse(260,366,37,5+mouth*30,0,0,Math.PI*2);c.fill();}
  if(emotion!=='friendly'){c.lineWidth=13;for(const x of [158,354]){c.beginPath();c.moveTo(x-29,153+(emotion==='angry'&&x>200?20:0));c.lineTo(x+29,153+(emotion==='angry'&&x<200?20:0));c.stroke();}}
  tex.update();
 }
 draw();
 return {root,ball,
 reset(){emotion='friendly';talking=false;amplitude=0;lastMouth=lastBlink=-1;root.scaling.setAll(1);root.rotation.setAll(0);draw();},
 setEmotion(value){emotion=value==='neutral'?'friendly':value;draw();},
 setTalking(value){talking=value;if(!value){amplitude=0;draw();}},
 setAmplitude(value){amplitude=value;},
 update(t,camera,origin,age,dt,motion=true){
  if(!root.isEnabled())return;
  if(age<2.2){
   const u=Math.max(0,Math.min(1,(age-.25)/1.8));const ease=1-Math.pow(1-u,3);
   root.position.set(0,.3+ease*1.06,.4);const scale=.48+.52*ease;
   root.scaling.set(scale*(1+.06*Math.sin(u*Math.PI)),scale*(1-.08*Math.sin(u*Math.PI)),scale);
  }else{root.scaling.setAll(1);const target=origin.clone();target.y+=motion?Math.sin(t*1.8)*.055:0;root.position=Vector3.Lerp(root.position,target,1-Math.exp(-dt*2.6));}
  const yaw=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z)+Math.PI;
  const delta=Math.atan2(Math.sin(yaw-root.rotation.y),Math.cos(yaw-root.rotation.y));root.rotation.y+=delta*(1-Math.exp(-dt*5));
  root.rotation.z=motion?Math.sin(t*1.1)*.025+(emotion==='suspicious'?.065:0):0;
  const phase=t%4.7,blink=phase<.15?Math.sin(phase/.15*Math.PI):0;
  const mouth=talking?Math.round(Math.min(1,amplitude*5)*8)/8:0;
  const blinkFrame=Math.round(blink*4)/4;
  if(mouth!==lastMouth||blinkFrame!==lastBlink){draw(mouth,blinkFrame);lastMouth=mouth;lastBlink=blinkFrame;}
 }};
}
