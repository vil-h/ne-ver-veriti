import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {RenderTargetTexture} from '@babylonjs/core/Materials/Textures/renderTargetTexture.js';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';

export function createRescueRoom(scene,m,bedroomMeshes){
 const root=new TransformNode('rescue-room',scene),obstacles=[],switches={};let opened=-1,shut=-1,exitTime=-1,monitors=false,nextNoise=0,captured=false;
 const material=(name,color,glow=0)=>{const a=new StandardMaterial(name,scene);a.diffuseColor=Color3.FromHexString(color);a.specularColor=new Color3(.035,.035,.035);a.emissiveColor=a.diffuseColor.scale(glow);return a;};
 const concrete=material('damp-concrete','#65716b'),dark=material('rescue-black','#111b1b'),amber=material('emergency-amber','#dd6533',.65),green=material('phosphor','#70c9ac',.8);
 // Seeded cracks, aggregate and water streaks: original textures, generated once.
 const tex=new DynamicTexture('concrete-scars',{width:512,height:512},scene,false),c=tex.getContext();let seed=71;const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 c.fillStyle='#64716c';c.fillRect(0,0,512,512);
 for(let i=0;i<12000;i++){c.fillStyle=rand()>.5?'#74807933':'#192e2833';c.fillRect(rand()*512,rand()*512,rand()*3+1,rand()*3+1);}
 for(let i=0;i<24;i++){let x=rand()*512,y=rand()*250;c.strokeStyle='#1c2b2755';c.lineWidth=.5+rand()*2;c.beginPath();c.moveTo(x,y);for(let j=0;j<5;j++){x+=rand()*24-12;y+=rand()*34;c.lineTo(x,y);}c.stroke();c.fillStyle='#142b2422';c.fillRect(x,y-80,rand()*10+2,100+rand()*130);}
 tex.update();tex.uScale=2;tex.vScale=1;concrete.diffuseTexture=tex;
 function box(name,x,y,z,w,h,d,mat,action=null,solid=false){const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.parent=root;a.position.set(x,y,z);a.material=mat;a.metadata=action?{action}:null;a.receiveShadows=true;if(solid)obstacles.push({name,x,z,w,d});return a;}
 function sign(text,x,y,z,w,h,action=null,bg='#152b29',fg='#abc8b2'){
  const height=Math.max(128,Math.round(1024*h/w));const t=new DynamicTexture('rescue-label',{width:1024,height},scene,false),ctx=t.getContext();
  const draw=(value)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,1024,height);ctx.strokeStyle=fg;ctx.lineWidth=4;ctx.strokeRect(12,12,1000,height-24);ctx.fillStyle=fg;const rows=value.split('\n'),size=Math.min(86,1450/Math.max(...rows.map(r=>r.length)),(height-32)/rows.length*.72);ctx.font=`bold ${size}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';rows.forEach((v,i,a)=>ctx.fillText(v,512,height/2+(i-(a.length-1)/2)*size*1.3));t.update();};draw(text);
  const mat=material('rescue-label-ink','#ffffff',.3);mat.diffuseTexture=t;const a=MeshBuilder.CreatePlane('sign-'+text,{width:w,height:h},scene);a.parent=root;a.position.set(x,y,z);a.material=mat;a.metadata=action?{action}:null;a.isPickable=!!action;return {mesh:a,draw};
 }
 box('service-floor',2.1,-.12,37.5,9,.24,11,concrete);
 box('service-ceiling',2.1,3.4,37.5,9,.2,11,concrete);
 for(const x of [-2.4,6.6])box('service-wall',x,1.65,37.5,.2,3.3,11,concrete,null,true);
 // Entry is continuous with the two-door hall. Inner shutter closes only once player clears it.
 for(const x of [-.65,4.85])box('entry-shoulder',x,1.65,33,3.5,3.3,.2,concrete,null,true);
 box('entry-lintel',2.1,2.95,33,2,.7,.2,concrete);
 const shutter=box('inner-steel-shutter',2.1,4.2,33,1.9,2.8,.16,m.metal,'rescueEntry');
 const entryBlock={name:'rescue-shutter',x:2.1,z:33,w:2,d:.2,disabled:true};obstacles.push(entryBlock);
 for(const x of [-.65,4.85])box('exit-shoulder',x,1.65,43,3.5,3.3,.2,concrete,null,true);
 box('exit-lintel',2.1,3,43,2,.6,.2,concrete);
 const hinge=new TransformNode('emergency-hinge',scene);hinge.parent=root;hinge.position.set(1.15,0,42.9);
 const exit=box('emergency-door',0,0,0,1.9,2.65,.14,m.metal,'rescueExit');exit.parent=hinge;exit.position.set(.95,1.325,0);
 const bar=box('panic-bar',0,0,0,1.35,.08,.11,m.brass,'rescueExit');bar.parent=hinge;bar.position.set(.95,1.1,-.13);
 const exitBlock={name:'rescue-exit',x:2.1,z:43,w:2,d:.2,disabled:false};obstacles.push(exitBlock);
 sign('АВАРИЙНЫЙ ВЫХОД',2.1,2.95,42.8,2.4,.4,null,'#223d35','#b0ddbd');
 const status=sign('АВАРИЙНОЕ ОТПИРАНИЕ\nНЕТ ПИТАНИЯ',4.5,1.9,42.8,2.1,.85,'release');
 box('exit-console',4.5,1.3,42.65,1.1,.8,.35,m.metal,'release');
 const release=box('unlock-button',4.5,1.4,42.4,.3,.28,.15,amber,'release');
 // Distribution board is reachable from the centre with labels facing the player.
 box('distribution-cabinet',-.7,1.25,41.4,1.6,2.35,.55,m.metal,null,true);
 sign('РАСПРЕДЕЛИТЕЛЬНЫЙ ЩИТ',-.7,2.25,41.1,1.5,.3);
 sign('А — ПОВРЕЖДЁННАЯ ЦЕПЬ\nОТКЛЮЧИТЬ ДО РЕЗЕРВА',-.7,1.85,41.08,1.45,.52,'isolate','#3f2822','#e9ad79');
 switches.isolate=box('circuit-A',-.7,1.42,40.99,.26,.3,.18,amber,'isolate');
 sign('Б — РЕЗЕРВ',-.7,1.08,41.08,1.35,.27,'reserve');
 switches.reserve=box('circuit-B',-.7,.77,40.99,.26,.3,.18,m.trim,'reserve');
 for(const x of [-1.34,-.05])for(const y of [.3,2.15])box('cabinet-bolt',x,y,41.1,.045,.045,.02,m.brass);
 // Control desk, two security feeds and one failed monitor.
 box('control-desk',4.8,.53,37.4,2.45,1.05,1.05,m.metal,null,true);
 box('control-lip',4.8,1.07,37.4,2.55,.1,1.12,m.trim);
 const switchLabel=sign('ВЕНТИЛЯЦИЯ\nВКЛ',4.75,1.18,36.88,.9,.35,'vent');switchLabel.mesh.rotation.x=.42;
 switches.vent=box('fan-toggle',5.5,1.19,37,.18,.18,.2,amber,'vent');
 box('terminal-base',3.55,.85,35.5,1.45,1.7,.7,m.metal,null,true);
 sign('ИНСТРУКЦИЯ / АВАРИЯ\n1. ОТКЛЮЧИТЬ ЦЕПЬ А\n2. ВКЛЮЧИТЬ РЕЗЕРВ Б\n3. ОТКЛЮЧИТЬ ВЕНТИЛЯЦИЮ\n4. ПИТАНИЕ НА ЗАМОК',3.55,1.7,35.08,1.5,1.1,'terminal');
 sign('ТЕХНИЧЕСКИЙ УЗЕЛ  /  04',2.1,2.95,33.22,3.5,.4).mesh.rotation.y=Math.PI;
 box('vent-grille',6.44,2.65,38,.15,.62,1.25,m.trim);
 for(let i=0;i<9;i++)box('vent-slat',6.34,2.4+i*.055,38,.04,.023,1.1,dark);
 for(const x of [-2.15,6.35])for(const y of [.4,2.9]){const tube=MeshBuilder.CreateCylinder('service-pipe',{diameter:.09,height:9.8,tessellation:10},scene);tube.parent=root;tube.position.set(x,y,37.6);tube.rotation.x=Math.PI/2;tube.material=m.metal;}
 for(let i=0;i<5;i++){const points=[new Vector3(-1.9+i*.12,3.12,34),new Vector3(-1.5+i*.12,2.96,37),new Vector3(-.8+i*.12,2.85,40),new Vector3(-.7+i*.12,2.3,41.5)];const cable=MeshBuilder.CreateTube('old-cable',{path:points,radius:.018,tessellation:6},scene);cable.parent=root;cable.material=dark;cable.isPickable=false;}
 for(let i=0;i<6;i++)box('ceiling-beam',2.1,3.23,33+i*1.8,8.8,.16,.13,m.trim);
 // A shallow sump, perforated grille and loose papers leave the main route clear.
 box('drain',-1.2,.007,37.3,1.2,.014,1.8,dark);
 for(let i=0;i<12;i++)box('drain-bars',-1.2,.025,36.5+i*.14,1.18,.025,.035,m.metal);
 for(let i=0;i<4;i++){const paper=box('service-record',-.8+i*.18,.02,39-i*.24,.32,.008,.42,m.paper);paper.rotation.y=i*.7;}
 const emergency=new PointLight('rescue-emergency',new Vector3(1,2.9,35),scene);emergency.diffuse.set(1,.34,.12);emergency.intensity=2.7;emergency.range=10;
 const worklight=new PointLight('rescue-worklight',new Vector3(3,2.9,40),scene);worklight.diffuse.set(.5,.8,.72);worklight.intensity=3;worklight.range=10;
 box('emergency-fixture',1,3.1,35,.65,.13,.26,amber);box('work-fixture',3,3.1,40,1.3,.1,.25,m.bulb);
 for(const x of [1.1,3.1])box('dark-passage-wall',x,1.6,47,.2,3.2,8,dark,null,true);
 box('dark-passage-floor',2.1,-.1,47,2,.2,8,dark);box('dark-passage-ceiling',2.1,3.25,47,2,.2,8,dark);box('passage-end',2.1,1.6,51,2,3.2,.2,dark,null,true);
 // Security displays render actual 3D sets, once per visit; no external image or per-frame second scene.
 const feedCamera=new FreeCamera('bedroom-security-camera',new Vector3(3.8,2.95,-4.4),scene);feedCamera.setTarget(new Vector3(-1, .6,.2));feedCamera.fov=1.3;
 const bedroomFeed=new RenderTargetTexture('bedroom-feed',{width:512,height:288},scene,false);bedroomFeed.activeCamera=feedCamera;bedroomFeed.renderList=bedroomMeshes;bedroomFeed.clearColor=new Color4(.04,.07,.06,1);bedroomFeed.refreshRate=0;
 const setPieces=[];for(const [x,z,w,d,mat] of [[13,38,6,5,concrete],[13,40.5,6,.14,m.wood],[10,38,.14,5,m.trim]]){const a=box('unseen-set',x,z===40.5?1.5:-.08,z,w,z===40.5?3:.15,d,mat);setPieces.push(a);}
 for(const x of [11.4,14.5]){setPieces.push(box('unseen-door',x,1.2,40.35,1.5,2.4,.12,m.cream));for(const dx of [-.85,.85])setPieces.push(box('exposed-set-brace',x+dx,1.5,40.45,.08,3,.12,m.metal));}
 const setCamera=new FreeCamera('outside-wall-camera',new Vector3(14,2.4,35.8),scene);setCamera.setTarget(new Vector3(12,1.1,40));
 const impossibleFeed=new RenderTargetTexture('behind-wall-feed',{width:256,height:144},scene,false);impossibleFeed.activeCamera=setCamera;impossibleFeed.renderList=setPieces;impossibleFeed.refreshRate=0;
 const screens=[];
 for(const [i,feed] of [bedroomFeed,impossibleFeed,null].entries()){
  const x=3.9+i*.9;box('crt-shell',x,1.7,37.7,.85,.68,.55,dark,'monitor');
  const a=box('crt-glass',x,1.72,37.405,.73,.51,.018,dark,'monitor');const mat=material('crt-phosphor','#6a9d8e');mat.disableLighting=true;mat.emissiveColor=Color3.Black();mat.diffuseColor=Color3.Black();mat.fogEnabled=false;if(feed){feed.coordinatesMode=0;feed.level=3;mat.emissiveTexture=feed;}screens.push({a,mat,feed});
  for(let j=0;j<8;j++)box('crt-vents',x-.29+j*.08,1.43,37.4,.04,.025,.025,m.trim);
 }
 sign('НАБЛЮДЕНИЕ / ВКЛ',4.8,2.25,37.6,2.5,.3,'monitor');
 function enable(value){root.setEnabled(value);emergency.setEnabled(value);worklight.setEnabled(value);}
 function reset(){opened=shut=exitTime=-1;monitors=false;captured=false;nextNoise=0;shutter.position.y=4.2;entryBlock.disabled=true;exitBlock.disabled=false;hinge.rotation.y=0;screens.forEach(s=>s.a.material=dark);status.draw('АВАРИЙНОЕ ОТПИРАНИЕ\nНЕТ ПИТАНИЯ');}
 enable(false);
 return {root,obstacles,enable,reset,
 open(time){reset();enable(true);opened=time;nextNoise=time+8;},
 capture(){bedroomFeed.render(true);impossibleFeed.render(true);captured=true;},
 sync(s){switches.isolate.rotation.x=s.isolated?-.6:.6;switches.reserve.material=s.reserve?green:m.trim;switches.vent.material=s.ventOff?m.trim:amber;switchLabel.draw('ВЕНТИЛЯЦИЯ\n'+(s.ventOff?'ОТКЛ':'ВКЛ'));if(s.unlocked){status.draw('АВАРИЙНЫЙ ВЫХОД\nРАЗБЛОКИРОВАН');release.material=green;}else{status.draw(s.reserve?'РЕЗЕРВ Б / ПИТАНИЕ ЕСТЬ\nОТКЛЮЧИТЕ ВЕНТИЛЯЦИЮ':'АВАРИЙНОЕ ОТПИРАНИЕ\nНЕТ ПИТАНИЯ');release.material=amber;}},
 effect(type,t){if(type==='slam'){shut=t;entryBlock.disabled=false;}if(type==='openRescueExit')exitTime=t;if(type==='monitor'){monitors=true;screens.forEach(s=>{if(s.feed)s.a.material=s.mat;});}},
 update(t,dt,camera,s,sound,motion){
  if(shut>=0)shutter.position.y=4.2-Math.min(1,(t-shut)/.4)*2.8;
  if(exitTime>=0){hinge.rotation.y=-Math.min(1,(t-exitTime)/1.4)*1.65;if(t-exitTime>1.4)exitBlock.disabled=true;}
  emergency.intensity=s.unlocked?1.8:2.7*(motion?1-.035*Math.sin(t*8):1);
  worklight.intensity=s.reserve?4:2.3;
  if(s.entered&&!s.unlocked&&t>nextNoise){nextNoise=t+11;sound.ambientEvent(monitors?'knock':'pipe',[-2,1.2,38]);sound.quietTone([-1.2,.1,37],.035);}
  if(s.exitOpen&&camera.position.z>44&&Math.floor(t)!==Math.floor(t-dt))sound.quietTone([2.1,1,50],.035);
  return s.exitOpen?Math.max(0,Math.min(1,(camera.position.z-45)/4)):0;
 }};
}
