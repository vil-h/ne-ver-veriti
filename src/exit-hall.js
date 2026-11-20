import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {RenderTargetTexture} from '@babylonjs/core/Materials/Textures/renderTargetTexture.js';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';

export const hallTargets = {
  archive:'Камера 01 · спальня', corridorFeed:'Камера 02 · коридор',
  hallFeed:'Камера 03 · зал', seam:'Двойной шов', hallClock:'Настенные часы',
  trustPanel:'Подтвердить доверие', glassDoor:'Стеклянная дверь'
};

export function buildExitHall(scene, shared, intro, verity, lid) {
  const room = new TransformNode('exit-hall', scene);
  const obstacles = [], leaves = [], clouds = [], screens = [], feeds = [];
  const set = new TransformNode('painted-street',scene); set.parent = room;
  function material(name, color, glow = 0) {
    const mat = new StandardMaterial(name, scene);
    mat.diffuseColor = Color3.FromHexString(color);
    mat.specularColor = new Color3(.1,.1,.1);
    mat.emissiveColor = mat.diffuseColor.scale(glow);
    return mat;
  }
  const ivory = material('chalk-porcelain','#edf1e6',.25);
  const floor = material('polished-limestone','#c8d7cc',.22);
  floor.specularPower = 80; floor.specularColor.set(.85,.92,.91);
  const brass = material('champagne-aluminium','#a98a57',.12);
  const teal = material('enamel-petrol','#294e49',.15);
  const pale = material('frosted-glass','#a5ded3',.38); pale.alpha=.23;
  const lamp = material('light-diffuser','#ffefd3',.95);
  const rubber = material('cable-sheath','#272c28');
  const sky = material('painted-sky','#8db8c7',.18);
  const grass = material('cultivated-lawn','#7f9c56',.16);
  const leaf = material('leaves','#607e48',.15), sage=material('sage-leaves','#85975d',.2);
  const soil = material('outdoor-earth','#8e8060',.22);
  function box(name,x,y,z,w,h,d,mat,action,solid=false,parent=room) {
    const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);
    mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=mat;
    if(action)mesh.metadata={action};
    if(solid)obstacles.push({name,x,z,w,d});
    return mesh;
  }
  function oval(name,x,y,z,w,h,d,mat,parent=room) {
    const mesh=MeshBuilder.CreateSphere(name,{diameter:1,segments:12},scene);
    mesh.position.set(x,y,z);mesh.scaling.set(w,h,d);mesh.material=mat;
    mesh.parent=parent;mesh.isPickable=false;return mesh;
  }
  function label(words,x,y,z,w,h,action,bg='#294740',fg='#edf3d9') {
    const mesh=MeshBuilder.CreatePlane(words,{width:w,height:h},scene);
    const height=Math.max(100,Math.round(768*h/w));
    const t=new DynamicTexture(words,{width:768,height},scene,false),ctx=t.getContext();
    const rows=words.split('\n');ctx.fillStyle=bg;ctx.fillRect(0,0,768,height);
    ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';
    const font=Math.min(72,(height*.82)/rows.length,1150/Math.max(...rows.map(r=>r.length)));
    ctx.font='bold '+font+'px sans-serif';
    rows.forEach((row,i)=>ctx.fillText(row,384,height/2+(i-(rows.length-1)/2)*font*1.1));t.update();
    const mat=material('printed-sign','#ffffff',.22);mat.diffuseTexture=t;
    mesh.material=mat;mesh.parent=room;mesh.position.set(x,y,z);mesh.isPickable=!!action;
    if(action)mesh.metadata={action};return mesh;
  }
  function light(name,x,y,z,color,intensity,range) {
    const l=new PointLight(name,new Vector3(x,y,z),scene);
    l.parent=room;l.diffuse=Color3.FromHexString(color);l.intensity=intensity;l.range=range;return l;
  }
  box('lobby-floor',20,-.12,12,14,.24,14,floor);
  box('lobby-roof',20,4.3,12,14,.2,14,ivory);
  for(const x of [13,27])box('lobby-side',x,2.1,12,.18,4.2,14,ivory,null,true);
  for(const x of [16,24])box('entrance-return',x,2.1,5,6,4.2,.18,ivory,null,true);
  box('entrance-head',20,3.55,5,2,1.3,.18,ivory);
  const backStop={name:'lobby-entry',x:20,z:5,w:2,d:.14};obstacles.push(backStop);
  for(const [x,w] of [[14.95,3.9],[21,4],[26.05,1.9]])box('north-wall',x,2.1,19,w,4.2,.18,ivory,null,true);
  for(const x of [18,24])box('opening-head',x,3.65,19,2.2,1.1,.2,ivory);
  for(let x=14;x<28;x+=2)box('tile-joint',x,.003,12,.015,.006,14,shared.trim).isPickable=false;
  for(let z=6;z<20;z+=2)box('tile-joint',20,.003,z,14,.006,.015,shared.trim).isPickable=false;
  for(const x of [16,20,24])for(const z of [7.5,12,16.5]){
    box('coffer',x,4.17,z,2.8,.08,1.45,brass);
    box('luminous-ceiling',x,4.1,z,2.67,.07,1.32,lamp);
    box('ceiling-joint',x-1.8,4.18,z,.012,.02,4.45,shared.trim);
  }
  const lobbyLight=light('atrium-fill',20,3.8,13,'#fff4d8',1.6,15);
  light('daylight',22,7,30,'#fff0c8',1.4,21);
  label('ПОЗДРАВЛЯЕМ!\nВЫ НАШЛИ ВЫХОД!',18,3.58,18.83,5,.94);
  const glass=box('glass-leaf',18,1.5,18.9,2.1,3,.09,pale,'glassDoor');
  const glassBar=box('push-bar',18,1.05,18.82,1.85,.065,.065,brass,'glassDoor');
  const glassStop={x:18,z:19,w:2.2,d:.15};obstacles.push(glassStop);
  for(const x of [16.93,19.07])box('glass-jamb',x,1.5,18.9,.09,3,.12,brass);
  box('trust-pedestal',20.15,.64,17.9,.8,1.28,.52,teal,'trustPanel',true);
  label('ПОДТВЕРДИТЕ, ЧТО ДОВЕРЯЕТЕ\nСВОЕМУ ПРОВОДНИКУ',20.15,1.45,17.62,1.45,.48,'trustPanel');
  const panel=box('concealed-leaf',24,1.5,18.93,2.1,3,.14,ivory,'seam');
  const panelStop={x:24,z:19,w:2.2,d:.15};obstacles.push(panelStop);
  for(const x of [22.92,23])box('double-seam',x,1.5,18.82,.018,3,.025,brass,'seam');
  const clock=MeshBuilder.CreateCylinder('frozen-clock',{diameter:.92,height:.1,tessellation:40},scene);
  clock.parent=room;clock.position.set(24,3.65,18.8);clock.rotation.x=Math.PI/2;clock.material=brass;clock.metadata={action:'hallClock'};
  label('03 : 15',24,3.65,18.72,.77,.28,'hallClock','#ebe9d5','#214e44');
  function tree(x,y,z,scale,live,parent=room) {
    box('trunk',x,y+.8*scale,z,.16*scale,1.6*scale,.15*scale,shared.wood,null,false,parent);
    for(let j=0;j<3;j++){
      const crown=oval('canopy',x+Math.sin(j*2)*scale*.35,y+(1.65+j*.19)*scale,z+Math.cos(j*2)*scale*.27,scale*1.2,scale*(live?1.25:1.5),scale*1.2,j%2?sage:leaf,parent);
      if(live)leaves.push(crown);
    }
  }
  for(const x of [14.25,25.75])for(const z of [7.6,16.7]){
    box('planter',x,.32,z,.88,.64,.88,teal,null,true);tree(x,.64,z,.78,false);
  }
  for(const z of [9,13]){box('bench-seat',25.8,.57,z,.9,.15,2,ivory,null,true);
    for(const dz of [-.72,.72])box('bench-leg',25.8,.27,z+dz,.56,.54,.09,brass);}
  label('АРХИВ НАБЛЮДЕНИЯ',15.3,2.52,13.15,3.8,.45);
  box('archive-desk',15.3,.65,13,3.95,1.3,.7,teal,null,true);
  for(const [i,action] of ['archive','corridorFeed','hallFeed'].entries()){
    const x=14+i*1.3;
    box('archive-body',x,1.72,13.05,1.26,.91,.3,rubber,action);
    const screen=MeshBuilder.CreatePlane('screen-'+action,{width:1.15,height:.72},scene);
    screen.position.set(x,1.75,12.88);screen.parent=room;screen.metadata={action};
    screens.push(screen);
    label(['01 · СПАЛЬНЯ','02 · ДВЕ ДВЕРИ','03 · ЗАЛ'][i],x,1.28,12.62,1.2,.18,action);
  }
  // Two contrasting exteriors. The painted street repeats a single tree and paving module.
  box('painted-ground',18,-.1,26,10,.2,14,grass,null,false,set);
  box('painted-walk',18,.015,26,2.2,.025,14,floor,null,false,set);
  box('painted-sky',18,5,33,12,10,.1,sky,null,false,set);
  for(const x of [15.6,20.4])for(const z of [21,24,27,30])tree(x,0,z,1.3,false,set);
  for(const x of [16.7,19.3])obstacles.push({x,z:25,w:.15,d:12});obstacles.push({x:18,z:31,w:3,d:.2});
  box('service-floor',24,-.1,24,2.4,.2,10,shared.metal);
  for(const x of [22.8,25.2]){
    box('plywood-reverse',x,1.6,24,.15,3.2,10,shared.wood,null,true);
    for(let z=19.5;z<29;z+=1.5){
      box('frame-upright',x,1.6,z,.18,3.2,.1,shared.metal);
      box('diagonal-brace',x,1.65,z+.65,.13,2.55,.09,shared.metal).rotation.x=.49;
    }
    for(let j=0;j<3;j++){
      const pts=Array.from({length:15},(_,i)=>new Vector3(x+(x<24?.14:-.14),2.6+j*.07-.19*Math.abs(Math.sin(i*.8)),19+i*.68));
      const cable=MeshBuilder.CreateTube('wiring',{path:pts,radius:.018,tessellation:5},scene);cable.parent=room;cable.material=rubber;
    }
  }
  for(let i=0;i<16;i++)box('stair',24,(i+1)*.035,24+i*.28,2.25,(i+1)*.07,.28,shared.metal);
  box('landing',24,1.04,29.05,2.4,.16,1.6,shared.metal);
  box('service-cover',24,3.46,22.4,2.6,.14,6.8,shared.metal);
  for(const z of [20.5,23.5,26.5])box('service-lamp',24,3.18,z,.46,.1,.2,lamp);
  light('maintenance-bulb',24,2.9,23,'#e5ab70',3,6);
  box('field',24,.95,38,23,.34,18,soil);
  const fir=material('spruce-needles','#365c50',.09);
  for(let i=0;i<12;i++){
    const x=15+(i*5.9)%19,z=33+(i*3.7)%10,h=2.3+i%4*.5;
    for(let j=0;j<3;j++){
      const bough=MeshBuilder.CreateCylinder('spruce-tier',{height:h*.53,diameterTop:0,diameterBottom:h*(.44-j*.09),tessellation:9},scene);
      bough.parent=room;bough.material=fir;bough.position.set(x,1.2+h*(.28+j*.21),z);bough.rotation.y=i;leaves.push(bough);
    }
  }
  for(let i=0;i<33;i++){
    const x=14+(i*7.37)%20,z=30+(i*3.17)%15;
    oval('turf',x,1.09,z,2.5+i%3,.08+(i%3)*.05,2.2,grass);
    if(Math.abs(x-24)>2 && i%2===0)tree(x,1.12,z,.75+(i%5)*.22,true);
  }
  const dome=MeshBuilder.CreateSphere('open-sky',{diameter:85,segments:24,sideOrientation:1},scene);
  dome.parent=room;dome.position.set(24,0,37);dome.material=sky;dome.isPickable=false;
  oval('winter-sun',28,9,45,1.5,1.5,1.5,lamp);
  // Soft sky gradient and distant overlapping ridges give the real clearing depth.
  const atmosphere=material('clearing-sky','#000000');
  const gradient=new DynamicTexture('day-sky',{width:64,height:256},scene,false);
  const skyCtx=gradient.getContext(),wash=skyCtx.createLinearGradient(0,0,0,256);
  wash.addColorStop(0,'#578bab');wash.addColorStop(.48,'#c2d9cf');wash.addColorStop(1,'#719bbb');
  skyCtx.fillStyle=wash;skyCtx.fillRect(0,0,64,256);gradient.update();
  atmosphere.disableLighting=true;atmosphere.emissiveTexture=gradient;dome.material=atmosphere;
  const ridge=material('misty-ridge','#667e71',.16);
  for(let i=0;i<8;i++)oval('rolling-hill',6+i*5,1.1,46+i%2,10,4+(i*7%4),4,ridge);

  for(let i=0;i<8;i++){const cloud=oval('cloud',10+i*4,6+i%3,44,4+i%3,.7,1.1,ivory);clouds.push(cloud);}
  for(const [x,z,w,d] of [[13,38,.2,18],[35,38,.2,18],[24,46,22,.2],[18,29,9,.2],[30,29,9,.2]])obstacles.push({x,z,w,d});
  // Snapshot cameras share the real meshes. The archive temporarily restores their visibility.
  const observer=new FreeCamera('archive-camera',new Vector3(0,2,0),scene);
  for(let i=0;i<3;i++){
    const texture=new RenderTargetTexture('hall-feed-'+i,{width:384,height:240},scene,false);
    texture.activeCamera=observer;texture.coordinatesMode=0;texture.level=2.8;
    const mat=material('archive-phosphor','#000000');mat.disableLighting=true;mat.emissiveTexture=texture;
    screens[i].material=mat;feeds.push(texture);
  }
  const archiveOrb=verity.ball.clone('archive-orb',room,true);archiveOrb.setEnabled(false);
  function capture(i,angle){
    const meshList=i===2?room.getChildMeshes().filter(mesh=>!screens.includes(mesh)&&mesh!==panel&&mesh.name!=='plywood-reverse'):intro.filter(mesh=>i===0?mesh.position.z<5:mesh.position.z>4 && !mesh.name.includes('ceiling') && !mesh.name.includes('choice-side'));
    const restore=meshList.map(mesh=>mesh.isEnabled(false));
    const lidX=lid.rotation.x;
    try{
      meshList.forEach(mesh=>mesh.setEnabled(true));lid.rotation.x=i===0&&angle?1.85:0;
      archiveOrb.setEnabled(i===2||i===0&&angle);archiveOrb.position.set(...(i===2?[18.8,1.45,18]:[0,1.03,.4]));
      const poses=[[[3.8,2.8,-4.2],[-1,.7,0]],[[4,4.4,26],[0,1,31]],[[25,3,22.8],[22.8,1.3,18.7]]];
      const [from,to]=poses[i];observer.position.set(from[0]+(angle?.55:0),from[1],from[2]);observer.setTarget(new Vector3(...to));
      feeds[i].renderList=[...meshList,archiveOrb];feeds[i].render();
    }finally{meshList.forEach((mesh,j)=>mesh.setEnabled(restore[j]));lid.rotation.x=lidX;archiveOrb.setEnabled(false);}
  }
  function reset(){set.setEnabled(true);glassStop.disabled=false;panelStop.disabled=false;glass.position.x=glassBar.position.x=18;panel.position.x=24;set.scaling.setAll(1);set.rotation.z=0;room.setEnabled(false);}
  reset();
  return {obstacles,capture,reset,show(){room.setEnabled(true);},hide(){room.setEnabled(false);},
    tick(t,dt,state,motion,age){
      const step=dt*1.8;
      if(state.trusted){glass.position.x=Math.min(20,glass.position.x+step);glassBar.position.x=glass.position.x;glassStop.disabled=glass.position.x>19.7;}
      if(state.panel){panel.position.x=Math.min(26.2,panel.position.x+step);panelStop.disabled=panel.position.x>25.7;}
      lobbyLight.intensity=state.latch&&motion?1.4+.12*Math.sin(t*11):1.6;
      set.setEnabled(!['service','outside','phone'].includes(state.phase));
      if(state.phase==='sun'){set.scaling.y=1-Math.min(.88,Math.max(0,age-2)*.32);if(motion)set.rotation.z=.012*Math.sin(age*5);}
      if(motion){leaves.forEach((mesh,i)=>mesh.rotation.z=.045*Math.sin(t*.85+i));clouds.forEach((mesh,i)=>mesh.position.x=10+i*4+Math.sin(t*.06+i)*.65);}
    }};
}
