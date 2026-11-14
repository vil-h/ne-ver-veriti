import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';

export function createCakeRoom(scene,m){
 const root=new TransformNode('cake-room',scene),obstacles=[],panels=[],decor=[];let broken=-1,opened=-1;
 function mat(name,color,glow=0){const a=new StandardMaterial(name,scene);a.diffuseColor=Color3.FromHexString(color);a.specularColor=new Color3(.12,.12,.12);a.emissiveColor=a.diffuseColor.scale(glow);return a;}
 const rose=mat('party-rose','#a66164'),ivory=mat('party-ivory','#e4d7b9'),icing=mat('vanilla-icing','#fff0ce'),berry=mat('cherry','#a92c37'),mint=mat('party-mint','#739c8d'),gold=mat('foil','#bda16c'),red=mat('button-red','#df281e',.35),dark=mat('technical-dark','#242b2b');
 function box(name,x,y,z,w,h,d,material,action=null,solid=false){const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.position.set(x,y,z);a.material=material;a.parent=root;a.receiveShadows=true;a.metadata=action?{action}:null;if(solid)obstacles.push({name,x,z,w,d});return a;}
 function cylinder(name,x,y,z,r,h,material,action=null){const a=MeshBuilder.CreateCylinder(name,{diameter:r,height:h,tessellation:32},scene);a.position.set(x,y,z);a.material=material;a.parent=root;a.metadata=action?{action}:null;return a;}
 function sign(text,x,y,z,w,h,action=null,bg='#eadcba',fg='#493c32'){
  const t=new DynamicTexture('cake-sign-'+text,{width:1024,height:256},scene,false),c=t.getContext();c.fillStyle=bg;c.fillRect(0,0,1024,256);c.strokeStyle=fg;c.lineWidth=6;c.strokeRect(15,15,994,226);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font='bold 60px sans-serif';text.split('\n').forEach((line,i,arr)=>c.fillText(line,512,128+(i-(arr.length-1)/2)*76));t.update();const a=MeshBuilder.CreatePlane(text,{width:w,height:h},scene);a.position.set(x,y,z);a.parent=root;const material=mat('label','#ffffff',.15);material.diffuseTexture=t;a.material=material;a.metadata=action?{action}:null;return a;
 }
 box('party-floor',20,-.1,0,8,.2,9,m.floor);
 box('technical-ceiling',20,3.5,0,9,.2,10,dark);
 // Structural shell stays collidable while false panels fall outward into the service gap.
 box('shell-back',20,1.7,-4.6,8.8,3.4,.2,dark,null,true);
 for(const x of [15.6,24.4])box('shell-side',x,1.7,0,.2,3.4,9.4,dark,null,true);
 box('shell-front',20,1.7,4.8,8.8,3.4,.2,dark,null,true);
 for(const x of [16,24])for(const z of [-3,-1,1,3]){const a=box('false-wall',x,1.6,z,.12,3.2,1.96,ivory);panels.push({mesh:a,x,y:1.6,z,side:x<20?-1:1});}
 for(const x of [17,19,21,23]){const a=box('backdrop',x,1.6,-4.45,1.96,3.2,.1,rose);panels.push({mesh:a,x,y:1.6,z:-4.45,side:0});}
 for(const x of [17,23])box('front-panelling',x,1.6,4.5,2,3.2,.12,ivory);
 box('door-lintel',20,2.95,4.5,4,.5,.12,ivory);
 for(const x of [16.07,23.93])box('party-dado',x,.9,0,.05,.07,8.9,gold);
 for(const x of [15.8,24.2])for(const z of [-3,0,3])box('service-stud',x,1.7,z,.08,3.4,.08,m.metal);
 for(const y of [.4,2.8])box('service-pipe',15.85,y,0,.065,.065,9,m.metal);
 const doorPivot=new TransformNode('cake-door-hinge',scene);doorPivot.parent=root;doorPivot.position.set(19.15,0,4.4);
 const door=box('cake-exit-door',0,0,0,1.7,2.5,.12,m.cream,'cakeExit');door.parent=doorPivot;door.position.set(.85,1.25,0);
 box('exit-threshold',20,1.25,4.65,1.7,2.5,.02,dark,'cakeExit');
 const blocker={name:'cake-exit',x:20,z:4.4,w:1.8,d:.2};obstacles.push(blocker);
 box('party-entry',20,1.25,-4.4,1.6,2.5,.12,m.cream,'cakeEntry');
 // Furniture footprint deliberately leaves a generous route along either side.
 cylinder('party-table',20,.91,0,2.35,.14,m.wood,'treat');obstacles.push({name:'party-table',x:20,z:0,w:2.35,d:2.35});
 cylinder('tablecloth',20,1,0,2.4,.08,ivory,'treat');cylinder('table-pedestal',20,.43,0,.3,.86,gold);
 cylinder('cake-plate',20,1.07,0,1.08,.055,gold,'treat');cylinder('cake-sponge',20,1.27,0,.92,.36,rose,'treat');cylinder('cake-icing',20,1.46,0,.96,.055,icing,'treat');
 for(let i=0;i<16;i++){const a=MeshBuilder.CreateSphere('icing-scallop',{diameter:.1,segments:8},scene);a.parent=root;a.position.set(20+Math.cos(i*Math.PI/8)*.44,1.44,Math.sin(i*Math.PI/8)*.44);a.material=icing;a.metadata={action:'treat'};}
 for(const x of [19.8,20,20.2]){cylinder('candle',x,1.6,0,.035,.25,gold,'candleClue');const flame=MeshBuilder.CreateSphere('flame',{diameter:.065,segments:8},scene);flame.parent=root;flame.position.set(x,1.75,0);flame.scaling.y=1.6;flame.material=m.bulb;flame.isPickable=false;}
 sign('СВЕЧА → ПОДАРОК → ЗВЕЗДА',20,1.16,-.94,1.65,.3,'partyNote').rotation.x=Math.PI/3;
 sign('СВЕЧА: ЛУНА',20,1.23,-.5,.85,.2,'candleClue');
 box('gift-table',23, .6,1.4,1.3,1.2,1.4,m.wood,null,true);
 box('gift',23,1.5,1.4,.65,.65,.65,mint,'giftClue');box('gift-ribbon',23,1.51,1.06,.1,.65,.015,gold,'giftClue');
 sign('ПОДАРОК: РОМБ',23,1.95,1.35,1.35,.3,'giftClue');
 box('star-plinth',17,.65,-1.7,.85,1.3,.85,rose,null,true);
 const star=sign('★',17,1.85,-1.7,.8,.8,'starClue','#b49b61','#fff1be');
 sign('ЗВЕЗДА: ЗВЕЗДА',17,1.3,-2.15,1.3,.3,'starClue');
 box('lock-body',21.5,1.4,4.3,.65,.7,.15,m.brass,'codeLock');sign('ТРИ СИМВОЛА',21.5,1.48,4.2,.58,.19,'codeLock');
 sign('ВРЕМЯ ПРАЗДНИКА',20,2.95,4.35,2.8,.4,null);
 box('red-button-back',17,1.25,4.3,.55,.65,.18,m.metal,'redButton');const button=cylinder('red-button',17,1.3,4.12,.3,.12,red,'redButton');button.rotation.x=Math.PI/2;
 sign('НЕ ВЕРЬ ЕМУ',17,1.95,4.2,1.55,.4,'redButton','#282a27','#ee6c57');
 sign('С ПРАЗДНИКОМ!',20,2.8,-4.3,3.1,.5,null,'#a66164','#fff0ce').rotation.y=Math.PI;
 // Suspended paper diamonds and balloons fall on their own staggered timelines.
 for(let i=0;i<15;i++){const x=16.5+i*.5,z=i%2?-2.8:2.6;const a=box('paper-garland',x,2.8-Math.sin(i/14*Math.PI)*.28,z,.23,.3,.02,i%2?mint:rose);a.rotation.z=.65;decor.push({mesh:a,y:a.position.y,rot:a.rotation.z});}
 for(const [x,z] of [[16.6,-3.4],[23.4,-3.4],[23.5,3.5]])for(let i=0;i<3;i++){const a=MeshBuilder.CreateSphere('party-balloon',{diameter:.38,segments:12},scene);a.parent=root;a.position.set(x+(i-1)*.22,2.1+i*.2,z);a.scaling.y=1.25;a.material=i%2?rose:mint;a.isPickable=false;decor.push({mesh:a,y:a.position.y,rot:0});}
 const light=new PointLight('cake-softbox',new Vector3(20,3,0),scene);light.diffuse=new Color3(1,.84,.65);light.intensity=1.4;light.range=12;
 const fill=new PointLight('cake-fill',new Vector3(20,2.5,3.5),scene);fill.diffuse=new Color3(1,.69,.51);fill.intensity=.7;fill.range=9;
 box('softbox',20,3.25,0,2,.05,1.2,m.bulb);
 function enable(value){root.setEnabled(value);light.setEnabled(value);fill.setEnabled(value);}
 function reset(){broken=opened=-1;blocker.disabled=false;doorPivot.rotation.y=0;for(const a of panels){a.mesh.position.set(a.x,a.y,a.z);a.mesh.rotation.setAll(0);}for(const d of decor){d.mesh.position.y=d.y;d.mesh.rotation.z=d.rot;}light.diffuse.set(1,.84,.65);light.intensity=1.4;fill.diffuse.set(1,.69,.51);fill.intensity=.7;}
 enable(false);
 return {obstacles,buttonPosition:new Vector3(17,1.3,4.12),enable,reset,
 enter(camera,verity){reset();enable(true);camera.position.set(20,1.65,-3.3);camera.rotation.set(.1,0,0);verity.reset();verity.root.setEnabled(true);verity.root.position.set(21.1,1.6,-1.8);},
 effect(type,t){if(type==='collapse'&&broken<0)broken=t;if(type==='unlock'&&opened<0)opened=t;},
 update(t,dt,camera,verity,motion){
  if(opened>=0){const u=Math.min(1,(t-opened)/1.2);doorPivot.rotation.y=-u*1.5;if(u===1)blocker.disabled=true;}
  if(broken>=0){const age=t-broken;light.diffuse.set(1,.035,.015);fill.diffuse.set(.5,.025,.02);light.intensity=2.2;fill.intensity=.55;
   panels.forEach((a,i)=>{const u=Math.max(0,Math.min(1,(age-.5-i*.07)/2.6));a.mesh.position.y=a.y-u*1.25;if(a.side){a.mesh.position.x=a.x+a.side*u*.24;a.mesh.rotation.z=a.side*u*1.3;}else{a.mesh.position.z=a.z-u*.22;a.mesh.rotation.x=-u*1.2;}});
   decor.forEach((a,i)=>{const u=Math.max(0,age-.3-i*.055);a.mesh.position.y=Math.max(.08,a.y-u*u*1.7);a.mesh.rotation.z=a.rot+Math.min(u,2)*1.5;});
   verity.setTransformation(Math.min(1,age/5));
  }
  const p=camera.position;let target=new Vector3(Math.max(16.6,Math.min(23.4,p.x+.95)),1.6,Math.max(-3.5,Math.min(3.5,p.z+1.7)));
  if(Math.abs(target.x-20)<1.5&&Math.abs(target.z)<1.5)target.x=p.x<20?18.4:21.6;
  if(broken>=0)target=new Vector3(p.x+Math.sin(camera.rotation.y)*1.6,1.75,p.z+Math.cos(camera.rotation.y)*1.6);
  verity.update(t,camera,target,10,dt,motion);
  return broken>=0&&t-broken>8;
 }};
}
