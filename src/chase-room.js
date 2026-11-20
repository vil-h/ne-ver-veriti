import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';
import {cells,walls,crates,route,spawn,monsterSpawn,pit,obstacles,gates} from './chase-layout.js';
export function createChaseRoom(scene,m){
 const root=new TransformNode('technical-chase',scene),pieces=[];
 function mat(name,color,glow=0){const a=new StandardMaterial(name,scene);a.diffuseColor=Color3.FromHexString(color);a.emissiveColor=a.diffuseColor.scale(glow);a.specularColor.set(.04,.04,.04);return a;}
 const concrete=mat('chase-concrete','#5a6257',.06),rust=mat('chase-rust','#714834',.08),dark=mat('chase-void','#020605'),red=mat('emergency-strip','#e35137',.7),mark=mat('route-paint','#b7bd94',.3);
 // Reproducible grime, panel joints and chipped cracks, generated once.
 const wear=new DynamicTexture('technical-concrete-wear',{width:256,height:256},scene,false),wc=wear.getContext();let seed=705;
 const random=()=>((seed=1664525*seed+1013904223>>>0)/4294967296);
 wc.fillStyle='#b7b5a6';wc.fillRect(0,0,256,256);
 for(let i=0;i<6500;i++){wc.fillStyle=`rgba(22,28,22,${random()*.2})`;wc.fillRect(random()*256,random()*256,1+random()*4,1+random()*4);}
 wc.strokeStyle='#646a5c';wc.lineWidth=3;wc.strokeRect(2,2,252,252);
 for(let i=0;i<8;i++){let x=random()*256,y=random()*256;wc.strokeStyle='rgba(27,33,25,.4)';wc.lineWidth=1;wc.beginPath();wc.moveTo(x,y);for(let j=0;j<6;j++){x+=(random()-.5)*24;y+=random()*15;wc.lineTo(x,y);}wc.stroke();}
 for(let i=0;i<25;i++){const x=random()*256,y=random()*140;const g=wc.createLinearGradient(x,y,x,256);g.addColorStop(0,'rgba(43,39,25,.28)');g.addColorStop(1,'rgba(43,39,25,0)');wc.fillStyle=g;wc.fillRect(x,y,3+random()*15,140);}
 wear.update();concrete.diffuseTexture=wear;concrete.bumpTexture=m.metal.bumpTexture;rust.diffuseTexture=m.metal.diffuseTexture;
 function box(name,x,y,z,w,h,d,material){const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.position.set(x,y,z);a.material=material;a.parent=root;a.isPickable=false;pieces.push(a);return a;}
 for(const p of cells.values()){
  box('floor-panel',p.x,-.1,p.z,4,.2,4,m.metal);box('low-ceiling',p.x,3.25,p.z,4,.15,4,concrete);
  const pipe=MeshBuilder.CreateCylinder('rusty-conduit',{diameter:.16,height:4,tessellation:12},scene);pipe.position.set(p.x+.85,2.92,p.z);pipe.rotation.x=Math.PI/2;pipe.material=rust;pipe.parent=root;pipe.isPickable=false;pieces.push(pipe);
  if((p.x+p.z)%12===0){box('emergency-lamp',p.x,3.03,p.z,.8,.06,.18,red);box('drain',p.x,.012,p.z,1,.018,.35,dark);}
 }
 walls.forEach((w,i)=>{box('concrete-wall',w.x,1.6,w.z,w.w,3.2,w.d,concrete);
  if(i%4===0){const vertical=w.w<1;box('exposed-pipe',w.x+(vertical?Math.sign(96-w.x)*.13:0),1.9,w.z+(vertical?0:.13),vertical?.1:3,.1,vertical?3:.1,rust);
   box('missing-plaster',w.x+(vertical?Math.sign(96-w.x)*.11:0),.7,w.z+(vertical?0:.11),vertical?.025:1.1,.65,vertical?1.1:.025,dark);}
 });
 crates.forEach(c=>{box(c.name,c.x,.6,c.z,c.w,1.2,c.d,rust);box('hazard-stripe',c.x,1.21,c.z,c.w,.025,c.d,mark);});
 // Floor arrows give direction at every bend, with no branching maze.
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z),length=Math.hypot(b.x-a.x,b.z-a.z);
  for(let d=8;d<length;d+=12){const x=a.x+dx*d,z=a.z+dz*d,yaw=Math.atan2(dx,dz);const stem=box('paint-arrow',x,.016,z,.12,.015,.8,mark);stem.rotation.y=yaw;
   for(const side of [-1,1]){const wing=box('paint-chevron',x+dx*.28+dz*side*.16,.017,z+dz*.28-dx*side*.16,.08,.015,.45,mark);wing.rotation.y=yaw-side*.7;}}
 }
 // The ledge ends at z=154. The shaft has no floor at player height.
 box('shaft-bottom',pit.x,-13,pit.z+5,4,.2,10,dark);
 for(const x of [77.9,82.1])box('shaft-side',x,-4,pit.z+5,.2,14,10,concrete);
 box('shaft-back',80,-4,164,4,14,.2,concrete);
 const label=MeshBuilder.CreatePlane('НЕ СМЕЙ ПРЫГАТЬ',{width:3.6,height:.75},scene);label.parent=root;label.position.set(80,1.9,158);label.isPickable=false;
 const tex=new DynamicTexture('pit-warning',{width:1024,height:256},scene,false),c=tex.getContext();c.fillStyle='#181e1a';c.fillRect(0,0,1024,256);c.fillStyle='#ecb581';c.font='bold 76px sans-serif';c.textAlign='center';c.fillText('НЕ СМЕЙ ПРЫГАТЬ',512,155);tex.update();const lm=mat('warning','#ffffff',.6);lm.diffuseTexture=tex;label.material=lm;
 box('ledge-stripe',80,.02,153.8,4,.04,.18,red);
 // The striped jamb and the continuous painted rail mark the open lane before the panel drops.
 for(const g of gates){
  const x=g.x<80?81.18:78.82;
  for(let j=0;j<5;j++)box('lane-reflector',x,.023,g.z-9+j*2,.18,.025,.9,mark);
  box('shutter-rail',g.x,3.02,g.z,g.w,.17,.34,rust);
  box('safe-jamb',x,2.75,g.z,1.18,.08,.24,mark);
 }
 for(const z of [82,88,94]){
  box('service-grille',113.84,1.5,z,.1,2.4,2.5,dark);
  for(let j=0;j<6;j++)box('grille-bar',113.7,1.5,z-1+j*.4,.12,2.4,.075,rust);
 }
 // Eye-level chevrons on the wall facing the runner signal the bend before it comes into view.
 for(let i=1;i<route.length-1;i++){
  const a=route[i-1],b=route[i],next=route[i+1],forward=new Vector3(Math.sign(b.x-a.x),0,Math.sign(b.z-a.z)),out=new Vector3(Math.sign(next.x-b.x),0,Math.sign(next.z-b.z));
  for(const offset of [-.52,.22])for(const arm of [-1,1]){
   const sign=box('turn-chevron',b.x+forward.x*1.85+out.x*offset,1.48+arm*.13,b.z+forward.z*1.85+out.z*offset,.4,.07,.4,mark);
   if(out.x){sign.scaling.z=.11;sign.rotation.z=-arm*out.x*.65;}else{sign.scaling.x=.11;sign.rotation.x=arm*out.z*.65;}
  }
 }
 // Batch static props by material; only two dynamic lights throughout the chase.
 const groups=new Map();for(const a of pieces){const g=groups.get(a.material)||[];g.push(a);groups.set(a.material,g);}for(const [material,list] of groups){const merged=Mesh.MergeMeshes(list,true,true,undefined,false,false);merged.parent=root;merged.material=material;merged.isPickable=false;}
 const shutters=gates.map((g,i)=>{const panel=box('shutter-'+i,g.x,4.7,g.z,g.w,3.1,.22,rust);const stripe=box("shutter-band",0,0,0,g.w,.18,.24,mark);stripe.parent=panel;stripe.position.set(0,-.91,0);return {g,panel};});
 // Distinct service sections: repeated ribs, cool pump bay, dangling cable racks.
 for(const z of [60,68,84,92]){box('service-rib',110.18,1.6,z,.13,3.2,.14,rust);box('service-rib',113.82,1.6,z,.13,3.2,.14,rust);}
 const cool=mat('cold-service-light','#66adb2',.8);
 for(const z of [60,80,92])box('pump-bay-light',112,3.04,z,1.5,.04,.12,cool);
 for(const z of [108,124,140]){const cable=MeshBuilder.CreateTube('hanging-cable',{path:[new Vector3(78.3,3.1,z),new Vector3(79,2.9,z+.15),new Vector3(80,2.7,z+.2),new Vector3(81.7,3.1,z)],radius:.025,tessellation:6},scene);cable.parent=root;cable.material=dark;cable.isPickable=false;}
 const failingBank=mat('pump-fluorescent','#accac0',.85);
 for(const z of [64,72,80])box('fluorescent-bank',112,3.11,z,2.7,.07,.22,failingBank);
 // Two wall projections in the pump run, articulated with the gait rather than a second actor.
 const armShadow=[0,1].map(i=>box('passing-arm-shadow',113.87,1.8,66,.018,.12-i*.04,1.5-i*.22,dark));
 const light=new PointLight('chase-local',new Vector3(80,2.6,8),scene);light.diffuse=new Color3(.75,.84,.7);light.range=22;
 const threat=new PointLight('chase-threat',new Vector3(80,2,0),scene);threat.diffuse=new Color3(1,.14,.035);threat.range=15;
 function enable(v){root.setEnabled(v);light.setEnabled(v);threat.setEnabled(v);}
 enable(false);
 return {obstacles,enable,
 enter(camera,verity){enable(true);camera.fov=1.12;camera.rotation.z=0;for(const {panel} of shutters)panel.position.y=4.7;camera.position.set(spawn.x,1.65,spawn.z);camera.rotation.set(.05,0,0);verity.reset();verity.setTransformation(2);verity.root.setEnabled(true);verity.root.position.set(monsterSpawn.x,1.65,monsterSpawn.z);},
 update(t,dt,camera,verity,pursuer,state,motion,quality){
  for(const {g,panel} of shutters)panel.position.y+=((g.disabled?4.7:1.55)-panel.position.y)*Math.min(1,dt*13);
  const phase=state.phase,p=pursuer.position;
  const returning=phase==='pitReturn';const friendly=['pitTalk','choice','trusting'].includes(phase);
  verity.setTransformation(friendly?0:returning?Math.max(0,2-state.phaseTime*.85):2);
  verity.setGait(phase==='running'?(pursuer.burst?1:.72):0);verity.setAttack(phase==='caught'?Math.min(1,state.phaseTime*5):0);
  const origin=new Vector3(p.x,1.65,p.z);verity.update(t,camera,origin,10,dt,motion);verity.root.position.x=p.x;verity.root.position.z=p.z;
  const searching=phase==='running'&&pursuer.mode==='search',final=phase==='running'&&pursuer.stage===4;
  const quiet=friendly||returning||phase==='falling';
  scene.fogDensity=quiet?.018:searching?.041:final?.031:.024;
  light.diffuse.set(quiet?.68:final?1:.73,quiet?.78:final?.43:.84,quiet?.73:final?.22:.77);
  light.position.set(camera.position.x,2.65,camera.position.z);
  const shadow=motion&&!quiet?Math.max(0,Math.cos(t*2.2))**8:0;
  light.intensity=(searching?1.1:1.65)-shadow*.28;
  // Light a section behind the pursuer; the nearer body crosses the lit wall in silhouette.
  threat.setEnabled(quality!=='low'&&!quiet);
  threat.position.set(p.x,2.75,Math.floor(p.z/8)*8-3);
  threat.intensity=searching?.15:motion?2.1+shadow*2.4:2.1;
  red.emissiveColor.set(quiet?.23:final?.99:.68,quiet?.22:.13,quiet?.16:.06);
  const inPump=p.z>52&&p.z<89&&p.x>110;
  const lampDip=motion&&inPump?Math.max(0,Math.cos((p.z-60)*.45))**3:0;
  failingBank.emissiveColor.set(.52*(1-lampDip),.69*(1-lampDip),.61*(1-lampDip));
  for(let i=0;i<armShadow.length;i++){
   const arm=armShadow[i];arm.setEnabled(inPump&&motion&&quality!=='low'&&phase==='running');
   if(arm.isEnabled()){arm.position.set(113.87,1.75-i*.48+.17*Math.sin(t*6),p.z+5.2+i);arm.rotation.x=.32+.29*Math.sin(t*6+i);}
  }
  if(state.phase==='falling'){const u=state.phaseTime;camera.position.z=153.5+Math.min(4,u*2);camera.position.x=80;camera.position.y=1.65-2.8*u*u;camera.rotation.x=motion?Math.min(.95,.1+u*.35):.35;}
  if(state.phase==='caught'){
   const u=Math.min(1,state.phaseTime/.38);
   camera.rotation.y=Math.atan2(p.x-camera.position.x,p.z-camera.position.z);
   camera.rotation.x=-.35+.17*u;camera.rotation.z=motion?.035*Math.sin(u*Math.PI*2)*(1-u):0;
   camera.fov=motion?1.12-.12*Math.sin(u*Math.PI):1.12;
   verity.root.position.y=1.48-.51*u;verity.root.rotation.y=camera.rotation.y;

  }
 }
 };
}
