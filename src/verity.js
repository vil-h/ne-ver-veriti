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
 const teeth=[];const enamel=new StandardMaterial('verity-teeth',scene);enamel.diffuseColor=Color3.FromHexString('#e1c88a');enamel.emissiveColor=new Color3(.12,.09,.03);
 for(const side of [-1,1])for(let i=0;i<7;i++){const tooth=MeshBuilder.CreateCylinder('sharp-tooth',{diameterTop:0,diameterBottom:.038,height:.055,tessellation:3},scene);tooth.parent=root;const tx=(i-3)*.047,ty=-.085+side*.035;tooth.position.set(tx,ty,-Math.sqrt(.364**2-tx**2-ty**2)-.02);tooth.rotation.z=side>0?Math.PI:0;tooth.material=enamel;tooth.isPickable=false;tooth.setEnabled(false);teeth.push(tooth);}
 let emotion='friendly',talking=false,lastMouth=-1,lastBlink=-1,amplitude=0,transformation=0;
 function draw(mouth=0,blink=0){
  const c=tex.getContext();c.clearRect(0,0,512,512);c.fillStyle='#17150f';c.strokeStyle='#17150f';c.lineCap='round';
  for(const x of [158,354]){c.beginPath();c.ellipse(x,219,22,Math.max(3,(emotion==='suspicious'?31:45)*(1-blink)),emotion==='angry'?(x<200?-.3:.3):0,0,Math.PI*2);c.fill();}
  c.lineWidth=17;c.beginPath();c.moveTo(160,328);c.bezierCurveTo(215,emotion==='angry'?280:405+mouth*14,304,emotion==='angry'?280:405+mouth*14,357,322);c.stroke();
  if(mouth>.1){c.beginPath();c.ellipse(260,366,37,5+mouth*30,0,0,Math.PI*2);c.fill();}
  if(emotion!=='friendly'){c.lineWidth=13;for(const x of [158,354]){c.beginPath();c.moveTo(x-29,153+(emotion==='angry'&&x>200?20:0));c.lineTo(x+29,153+(emotion==='angry'&&x<200?20:0));c.stroke();}}
  if(transformation>1){c.clearRect(0,0,512,512);c.fillStyle='#080906';for(const x of [145,365]){c.beginPath();c.ellipse(x,196,48,65,x<200?-.2:.2,0,Math.PI*2);c.fill();}c.beginPath();c.moveTo(48,278);c.bezierCurveTo(155,326,367,326,464,272);c.bezierCurveTo(435,492,88,493,48,278);c.fill();}
  tex.update();
 }
 draw();
 return {root,ball,
 reset(){transformation=0;teeth.forEach(t=>t.setEnabled(false));gold.diffuseColor=Color3.FromHexString('#edb331');emotion='friendly';talking=false;amplitude=0;lastMouth=lastBlink=-1;root.scaling.setAll(1);root.rotation.setAll(0);draw();},
 setEmotion(value){emotion=value==='neutral'?'friendly':value;draw();},
 setTalking(value){talking=value;if(!value){amplitude=0;draw();}},
 setAmplitude(value){amplitude=value;},
 setTransformation(value){transformation=value;teeth.forEach(t=>t.setEnabled(value>1));emotion='angry';gold.diffuseColor=Color3.Lerp(Color3.FromHexString('#edb331'),Color3.FromHexString('#c77915'),Math.min(1,value));draw();},
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
  if(transformation>1){root.scaling.set(2.15+(motion?.045*Math.sin(t*8):0),2.5,2.05);root.rotation.z=motion?Math.sin(t*5)*.07:0;}
  else if(transformation>0){root.scaling.set(1+transformation*.28,1+transformation*.5,1+transformation*.2);root.rotation.z+=motion?Math.sin(t*13)*.015*transformation:0;}
  const phase=t%4.7,blink=phase<.15?Math.sin(phase/.15*Math.PI):0;
  const mouth=talking?Math.round(Math.min(1,amplitude*5)*8)/8:0;
  const blinkFrame=Math.round(blink*4)/4;
  if(mouth!==lastMouth||blinkFrame!==lastBlink){draw(mouth,blinkFrame);lastMouth=mouth;lastBlink=blinkFrame;}
 }};
}
