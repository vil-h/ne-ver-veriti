import '@babylonjs/core/Culling/ray.js';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js';
import {Engine} from '@babylonjs/core/Engines/engine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {UniversalCamera} from '@babylonjs/core/Cameras/universalCamera.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';
import {SpotLight} from '@babylonjs/core/Lights/spotLight.js';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight.js';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {materials} from './materials.js';
import {createVerity} from './verity.js';
export function createWorld(canvas,quality='medium'){
 const engine=new Engine(canvas,true,{stencil:false,preserveDrawingBuffer:true,powerPreference:'high-performance'},true);
 const scene=new Scene(engine);scene.clearColor=new Color4(.018,.025,.025,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.022;scene.fogColor=new Color3(.055,.065,.052);
 scene.imageProcessingConfiguration.exposure=1.18;scene.imageProcessingConfiguration.contrast=1.18;scene.imageProcessingConfiguration.toneMappingEnabled=true;
 const camera=new UniversalCamera('eyes',new Vector3(0,1.65,-3.3),scene);camera.inputs.clear();camera.minZ=.06;camera.maxZ=70;camera.fov=1.12;camera.rotation.x=.13;
 const m=materials(scene),obstacles=[],targets=[],hallLights=[];
 const ambient=new HemisphericLight('ambient',new Vector3(0,1,0),scene);ambient.intensity=.32;ambient.diffuse=new Color3(.72,.76,.65);ambient.groundColor=new Color3(.14,.17,.16);
 const lamp=new SpotLight('bedroom-lamp',new Vector3(0,3.04,0),new Vector3(0,-1,0),2.5,1.5,scene);lamp.diffuse=new Color3(1,.8,.48);lamp.intensity=12;lamp.range=10;
 const moon=new PointLight('window-spill',new Vector3(-3.8,1.8,-.3),scene);moon.diffuse=new Color3(.34,.51,.68);moon.intensity=2.6;moon.range=8;
 const shadows=new ShadowGenerator(512,lamp);shadows.usePercentageCloserFiltering=true;shadows.bias=.003;shadows.normalBias=.025;
 function box(name,x,y,z,w,h,d,mat,collide=false,action=null){
  const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.material=mat;mesh.receiveShadows=true;
  if(collide)obstacles.push({name,x,z,w,d});
  if(action){mesh.metadata={action};targets.push(mesh);}
  if(h>.15&&w<4&&d<4)shadows.addShadowCaster(mesh);
  return mesh;
 }
 function cylinder(name,x,y,z,diameter,height,mat){const mesh=MeshBuilder.CreateCylinder(name,{diameter,height,tessellation:16},scene);mesh.position.set(x,y,z);mesh.material=mat;mesh.isPickable=false;return mesh;}
 function label(text,x,y,z,w,h,bg='#28372e',fg='#ded5a8',size=55){
  const t=new DynamicTexture('sign-'+text,{width:512,height:256},scene,false);const c=t.getContext();c.fillStyle=bg;c.fillRect(0,0,512,256);c.strokeStyle=fg;c.lineWidth=3;c.strokeRect(13,13,486,230);c.fillStyle=fg;c.font=`bold ${size}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,130);t.update();
  const mat=new StandardMaterial('sign-material',scene);mat.diffuseTexture=t;mat.specularColor=Color3.Black();mat.emissiveColor=new Color3(.1,.1,.07);
  const plane=MeshBuilder.CreatePlane(text,{width:w,height:h},scene);plane.position.set(x,y,z);plane.material=mat;plane.isPickable=false;return plane;
 }
 // Bedroom, 9 x 9.5 m. The exit is a real opening shared with the corridor.
 box('room-floor',0,-.12,-.25,9,.24,9.5,m.floor);
 box('room-ceiling',0,3.3,-.25,9,.2,9.5,m.ceiling);
 box('back-wall',0,1.6,-5,9,3.2,.2,m.wall,true);
 box('left-wall',-4.5,1.6,-.25,.2,3.2,9.5,m.wall,true);
 box('right-wall',4.5,1.6,-.25,.2,3.2,9.5,m.wall,true);
 box('exit-wall-left',-2.7,1.6,4.5,3.6,3.2,.2,m.wall,true);
 box('exit-wall-right',2.7,1.6,4.5,3.6,3.2,.2,m.wall,true);
 box('exit-lintel',0,2.85,4.5,1.8,.7,.2,m.wall);
 for(const x of [-4.38,4.38])box('skirting',x,.12,-.25,.06,.24,9.3,m.trim);
 box('back-skirting',0,.12,-4.87,8.8,.24,.06,m.trim);
 for(const x of [-2.7,2.7])box('front-skirting',x,.12,4.37,3.6,.24,.06,m.trim);
 // Bed with pillow, layered mattress and blanket.
 box('bed-frame',-2.8,.28,-2.2,2.1,.42,3.1,m.wood,true,'bed');
 box('mattress',-2.8,.57,-2.2,2,.22,3,m.pillow,false,'bed');
 box('blanket',-2.8,.73,-1.7,2.02,.16,2,m.cloth,false,'bed');
 box('headboard',-2.8,.7,-3.78,2.16,1.2,.13,m.wood);
 const pillow=box('pillow',-2.8,.77,-3.24,1.25,.22,.56,m.pillow,false,'bed');pillow.rotation.y=.07;
 for(let i=0;i<7;i++)box('blanket-seam',-3.68+i*.29,.817,-1.7,.012,.005,1.98,m.trim);
 // Writing desk and its interactable drawer.
 box('desk-top',3.45,.92,1.5,1.65,.12,2,m.wood,true);
 for(const x of [2.78,4.1])for(const z of [.7,2.3])box('desk-leg',x,.43,z,.09,.86,.1,m.wood);
 const drawer=box('desk-drawer',2.65,.67,1.5,.15,.35,1.62,m.wood,false,'drawer');
 const handle=box('drawer-handle',2.55,.67,1.5,.08,.045,.3,m.brass,false,'drawer');
 // Keep an easy visible interaction on the desktop as well.
 const notebook=box('notebook',3.15,1.01,1.35,.45,.025,.62,m.paper,false,'drawer');notebook.rotation.y=.15;
 label('ПРЕДОХРАНИТЕЛЬ',3.15,1.04,1.35,.41,.21,'#cec5a4','#292c20',35).rotation.x=Math.PI/2;
 for(let i=0;i<4;i++)box('book',3.9,.99+i*.05,2.05,.5,.045,.38,i%2?m.red:m.cloth);
 cylinder('cup',3.7,1.09,.85,.17,.23,m.cream);
 box('chair-seat',2,.48,1.5,.56,.1,.62,m.wood,true);
 box('chair-back',1.73,.85,1.5,.08,.8,.62,m.wood);
 for(const x of [1.78,2.23])for(const z of [1.25,1.75])box('chair-leg',x,.24,z,.05,.48,.05,m.trim);
 // Wardrobe and atmospheric objects.
 box('wardrobe',-3.55,1.2,2.9,1.55,2.4,1.15,m.wood,true,'wardrobe');
 for(const x of [-3.94,-3.16])box('wardrobe-panel',x,1.2,2.31,.7,2.24,.05,m.wood,false,'wardrobe');
 for(const x of [-3.65,-3.45])box('wardrobe-handle',x,1.2,2.26,.035,.23,.04,m.brass);
 box('nightstand',-4,.36,-2.4,.6,.7,.7,m.wood,true);
 cylinder('small-lamp-foot',-4,.75,-2.4,.28,.07,m.brass);cylinder('small-lamp-stem',-4,1,-2.4,.035,.5,m.brass);
 const shade=MeshBuilder.CreateCylinder('bedside-shade',{diameterTop:.32,diameterBottom:.5,height:.36,tessellation:20},scene);shade.position.set(-4,1.24,-2.4);shade.material=m.pillow;
 const rug=box('bedroom-rug',.1,.012,-.9,2.9,.016,4.1,m.cloth);rug.isPickable=false;
 // Cold window inset on the left wall, with frame and sill.
 box('window-glass',-4.37,1.85,-.25,.025,1.6,2.4,m.window,false,'window');
 for(const z of [-1.5,1])box('window-frame',-4.33,1.85,z,.09,1.85,.08,m.trim);
 for(const y of [1,2.7])box('window-frame',-4.33,y,-.25,.09,.08,2.55,m.trim);
 box('window-mullion',-4.3,1.85,-.25,.09,1.7,.06,m.trim);
 box('window-sill',-4.2,.97,-.25,.5,.09,2.7,m.wood);
 // A closed four-sided box with animated hinged lid.
 const bx=0,bz=.4;
 box('box-bottom',bx,.06,bz,.94,.12,.74,m.cardboard,true,'box');
 box('box-front',bx,.32,bz-.34,.94,.52,.06,m.cardboard,false,'box');
 box('box-back',bx,.32,bz+.34,.94,.52,.06,m.cardboard,false,'box');
 for(const x of [-.44,.44])box('box-side',x,.32,bz,.06,.52,.68,m.cardboard,false,'box');
 const lidPivot=new TransformNode('box-hinge',scene);lidPivot.position.set(0,.6,.77);
 const lid=box('box-lid',0,0,0,.97,.06,.77,m.cardboard,false,'box');lid.parent=lidPivot;lid.position.set(0,0,-.385);
 const tape=box('box-tape',0,0,0,.15,.006,.77,m.paper,false,'box');tape.parent=lidPivot;tape.position.set(0,.034,-.385);
 // Electrical panel and fuse; inserted fuse becomes visible after the interaction.
 box('fuse-panel',1.55,1.4,4.3,.58,.84,.16,m.metal,false,'panel');
 box('fuse-slot',1.55,1.57,4.2,.27,.22,.04,m.black,false,'panel');
 const fuse=box('fuse',1.55,1.57,4.165,.08,.18,.06,m.paper,false,'panel');fuse.setEnabled(false);
 const switchMesh=box('switch',1.55,1.23,4.17,.13,.16,.09,m.red,false,'panel');
 label('220 В',1.55,1.86,4.19,.36,.14,'#303e34','#ddd1a7');
 const doorPivot=new TransformNode('bedroom-door-hinge',scene);doorPivot.position.set(-.86,0,4.5);
 const roomDoor=box('bedroom-door',0,0,0,1.72,2.46,.12,m.wood,false,'exit');roomDoor.parent=doorPivot;roomDoor.position.set(.86,1.23,0);
 const doorknob=box('door-handle',0,0,0,.22,.05,.08,m.brass,false,'exit');doorknob.parent=doorPivot;doorknob.position.set(1.5,1.05,-.11);
 const doorCollider={name:'bedroom-door',x:0,z:4.5,w:1.8,d:.2};obstacles.push(doorCollider);
 for(const x of [-.93,.93])box('door-frame',x,1.28,4.35,.12,2.56,.15,m.trim);
 box('door-top-frame',0,2.56,4.35,1.98,.12,.15,m.trim);
 cylinder('ceiling-light',0,3.09,0,.65,.1,m.bulb);
 // Hallway: long corridor with genuinely walkable dark side branches.
 box('hall-floor',0,-.1,14.75,4.8,.2,20.5,m.carpet);
 box('hall-ceiling',0,3.3,14.75,4.8,.2,20.5,m.ceiling);
 for(const x of [-2.5,2.5]){
  box('hall-wall-near',x,1.6,8.5,.2,3.2,8,m.hall,true);
  box('hall-wall-far',x,1.6,20.25,.2,3.2,9.5,m.hall,true);
  for(const [z,d] of [[8.5,8],[20.25,9.5]])box('hall-skirting',x-Math.sign(x)*.12,.12,z,.05,.24,d,m.trim);
  box('side-branch-floor',x+Math.sign(x)*1.5,-.1,14,3,.2,3,m.carpet);
  box('side-branch-ceiling',x+Math.sign(x)*1.5,3.3,14,3,.2,3,m.ceiling);
  for(const z of [12.5,15.5])box('side-branch-wall',x+Math.sign(x)*1.5,1.6,z,3,3.2,.2,m.hall,true);
  box('branch-end',x+Math.sign(x)*3,1.6,14,.2,3.2,3,m.hall,true);
 }
 // The back faces beside the room exit prevent slipping behind the corridor walls.
 for(const x of [-1.7,1.7])box('hall-start-wall',x,1.6,4.6,1.6,3.2,.2,m.hall,true);
 for(let z=7;z<29;z+=4.5){
  box('fluorescent-housing',0,3.1,z,1.25,.12,.32,m.trim);
  box('fluorescent-tube',0,3.02,z,1.05,.035,.16,m.bulb);
  const l=new PointLight('hall-light-'+z,new Vector3(0,2.8,z),scene);l.diffuse=new Color3(.94,.88,.61);l.intensity=5.5;l.range=7;hallLights.push(l);
  for(const x of [-2.35,2.35])box('wall-seam',x,1.5,z,.03,3,.04,m.trim);
 }
 label('01',0,2.9,4.38,.42,.22);
 const exitSign=label('ВЫХОД',0,2.62,24.8,.8,.27,'#394a32','#bfc79b',48);
 exitSign.metadata=null;
 // Two-door antechamber.
 box('choice-floor',0,-.1,28.5,9,.2,7,m.carpet);
 box('choice-ceiling',0,3.3,28.5,9,.2,7,m.ceiling);
 for(const x of [-4.5,4.5])box('choice-side',x,1.6,28.5,.2,3.2,7,m.hall,true);
 for(const x of [-3.5,3.5])box('choice-shoulder',x,1.6,25,2,3.2,.2,m.hall,true);
 box('choice-end',0,1.6,32,9,3.2,.2,m.hall,true);
 const beautiful=box('beautiful-door',-2.1,1.25,31.82,1.55,2.5,.12,m.cream,false,'cake');
 const steel=box('rescue-door',2.1,1.25,31.8,1.55,2.5,.15,m.metal,false,'rescue');
 for(const [x,mat] of [[-2.1,m.brass],[2.1,m.trim]]){
  for(const dx of [-.86,.86])box('choice-frame',x+dx,1.3,31.75,.13,2.6,.2,mat);
  box('choice-frame-top',x,2.62,31.75,1.85,.14,.2,mat);
  cylinder('choice-knob',x+.55,1.08,31.69,.1,.08,m.brass).rotation.x=Math.PI/2;
 }
 for(const y of [.6,1.7]){box('pretty-panel',-2.1,y,31.735,1.18,.85,.035,m.brass,false,'cake');box('pretty-panel-inset',-2.1,y,31.706,1.08,.75,.035,m.cream,false,'cake');}
 label('СПАСЕНИЕ',2.1,2.07,31.68,1.35,.37,'#394944','#e4dcc2',57);
 for(const [y,a] of [[1.3,.32],[.95,-.38]]){const plank=box('barricade',2.1,y,31.58,1.85,.19,.08,m.lightWood,false,'rescue');plank.rotation.z=a;for(const dx of [-.7,.7]){const nail=cylinder('nail',2.1+dx*Math.cos(a),y+dx*Math.sin(a),31.53,.033,.015,m.black);nail.rotation.x=Math.PI/2;}}
 box('warm-threshold',-2.1,.035,31.7,1.5,.025,.09,m.bulb);
 const warm=new PointLight('inviting-light',new Vector3(-2.1,2.9,30.7),scene);warm.diffuse=new Color3(1,.7,.32);warm.intensity=8;warm.range=6;
 const cold=new PointLight('cold-light',new Vector3(2.1,2.8,30.7),scene);cold.diffuse=new Color3(.39,.58,.57);cold.intensity=3;cold.range=5;
 // Subtle debris, vents and stains break up the long surfaces.
 for(const z of [9,19,23]){
  box('vent',2.37,.65,z,.07,.38,.7,m.trim);
  for(let i=0;i<6;i++)box('vent-slat',2.325,.51+i*.055,z,.025,.018,.62,m.black);
  const paper=box('discarded-paper',-.9,.015,z+1.1,.34,.01,.48,m.paper);paper.rotation.y=z;
 }
 const verity=createVerity(scene);shadows.addShadowCaster(verity.ball);
 let boxTime=-1,doorTime=-1,powered=false;
 function qualitySetting(value){
  const mobile=innerWidth<800;
  engine.setHardwareScalingLevel(value==='low'?Math.max(1.5,devicePixelRatio):value==='high'?1/Math.min(devicePixelRatio,1.5):mobile?1.25:1);
  shadows.getShadowMap().resize(value==='high'?1024:512);lamp.shadowEnabled=value!=='low';
  scene.shadowsEnabled=value!=='low';
 }
 qualitySetting(quality);
 return {engine,scene,camera,obstacles,verity,targets,m,qualitySetting,
 reset(){camera.position.set(0,1.65,-3.3);camera.rotation.set(.13,0,0);boxTime=doorTime=-1;lidPivot.rotation.x=doorPivot.rotation.y=0;doorCollider.disabled=false;Object.assign(doorCollider,{x:0,z:4.5,w:1.8,d:.2});fuse.setEnabled(false);switchMesh.rotation.x=0;switchMesh.material=m.red;drawer.position.x=2.65;handle.position.x=2.55;powered=false;lamp.intensity=1.8;verity.root.setEnabled(false);},
 effect(type,time){if(type==='box'){boxTime=time;verity.root.setEnabled(true);verity.root.position.set(0,.5,.4);}if(type==='install')fuse.setEnabled(true);if(type==='power'){powered=true;switchMesh.rotation.x=-.6;switchMesh.material=m.brass;}if(type==='door')doorTime=time;if(type==='drawer'){drawer.position.x-=.15;handle.position.x-=.15;}},
 update(time,dt,flicker=true){
  if(boxTime>=0){lidPivot.rotation.x=Math.min(1,(time-boxTime)/1.1)*1.85;const emerge=Math.min(1,(time-boxTime)/1.2);verity.root.scaling.setAll(.25+.75*emerge);}
  if(doorTime>=0){doorPivot.rotation.y=Math.min(1,(time-doorTime)/1.2)*-1.65;if(time-doorTime>1.2){doorCollider.x=-.93;doorCollider.z=5.35;doorCollider.w=.18;doorCollider.d=1.72;}}
  lamp.intensity+=( (powered?12:1.8)-lamp.intensity)*Math.min(1,dt*3);
  hallLights.forEach((l,i)=>{l.intensity=5.5*(flicker?1-.08*Math.sin(time*7+i)*Math.sin(time*3.7+i):1);});
  const p=camera.position;
  const lamps=[lamp,moon,...hallLights,warm,cold];
  const nearby=[...lamps].sort((a,b)=>Vector3.DistanceSquared(a.position,p)-Vector3.DistanceSquared(b.position,p)).slice(0,3);
  lamps.forEach(light=>light.setEnabled(nearby.includes(light)));
  // Follow along the traversable centre of the corridor, never through its side walls.
  const target=p.z<4.5?new Vector3(.95,1.42,Math.max(.7,Math.min(3.1,p.z+1.7))):new Vector3(Math.max(-1.2,Math.min(1.2,p.x+.8)),1.6,Math.min(30.5,p.z+2.6));
  verity.update(time,camera,target,time-boxTime<1.8,dt);
 },
 dispose(){scene.dispose();engine.dispose();},
 };
}
