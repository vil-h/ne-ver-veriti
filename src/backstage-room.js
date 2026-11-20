import {createMonster} from './verity-monster.js';
import {MeshBuilder as B} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {PointLight} from '@babylonjs/core/Lights/pointLight.js';
export function backstageRoom(world){
 const {scene,m}=world,root=new TransformNode('Закулисье',scene),obstacles=[],resources=[];
 const node=n=>{const p=new TransformNode(n,scene);p.parent=root;return p;};
 function place(mesh,x,y,z,mat,parent=root){mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=mat;return mesh;}
 function box(n,x,y,z,w,h,d,mat,solid=false,action){
  const mesh=place(B.CreateBox(n,{width:w,height:h,depth:d},scene),x,y,z,mat);
  if(solid){mesh.block={x,z,w,d};obstacles.push(mesh.block);}
  if(action)mesh.metadata={action};
  return mesh;
 }
 function orb(n,x,y,z,size,mat){return place(B.CreateSphere(n,{diameter:size,segments:16},scene),x,y,z,mat);}
 function cable(n,points,r,mat){return place(B.CreateTube(n,{path:points.map(p=>new Vector3(...p)),radius:r,tessellation:8},scene),0,0,0,mat);}
 function plate(n,x,y,z,w,h,words,action){
  const p=box(n,x,y,z,w,h,.05,m.black,false,action);
  const tx=new DynamicTexture(n,{width:768,height:Math.max(96,Math.round(768*h/w))},scene,false);
  const mat=new StandardMaterial(n+' ink',scene);resources.push(tx,mat);mat.diffuseTexture=tx;mat.emissiveColor=new Color3(.72,.75,.65);const face=place(B.CreatePlane(n+' лицевая сторона',{width:w,height:h},scene),0,0,-.027,mat,p);face.isPickable=false;
  p.write=text=>{const c=tx.getContext(),{width,height}=tx.getSize(),rows=text.split('|');c.fillStyle='#132529';c.fillRect(0,0,width,height);c.fillStyle='#d5d8b2';c.textAlign='center';c.textBaseline='middle';const size=Math.min(height/(rows.length+.6),width/(Math.max(...rows.map(v=>v.length))*.64));c.font='bold '+Math.floor(size)+'px monospace';rows.forEach((s,i)=>c.fillText(s,width/2,(i+.5)*height/rows.length,width*.93));tx.update();};p.write(words);return p;
 }
 function lamp(x,y,z,color,range){const l=new PointLight('рабочий свет',new Vector3(x,y,z),scene);l.parent=root;l.diffuse=Color3.FromHexString(color);l.range=range;l.intensity=6;return l;}
 const wall=(x,z,w,d,h=5)=>box('обшивка',x,h/2,z,w,h,d,m.metal,true);
 box('бетон',0,-.13,20,17,.25,43,m.floor);
 wall(-8.4,19,.25,43,9);wall(8.4,19,.25,43,9);wall(0,-1.4,17,.3,9);wall(0,40,17,.35);
 for(const z of [13,22,34]){wall(-4.7,z,7.4,.28);wall(4.7,z,7.4,.28);box('перемычка',0,4,z,2,2,.3,m.metal);}
 function gate(z,id,label){const g=box(label,0,1.45,z,2.04,2.9,.22,m.metal,true,id);plate(label,0,3.35,z-.2,2.6,.5,label);return g;}
 const gates=[gate(13,'archiveDoor','01 / АРХИВ'),gate(22,'cellDoor','02 / КАМЕРА'),gate(34,'service','03 / СЛУЖЕБНЫЙ')];
 for(let z=0;z<35;z+=4){
  for(const x of [-8,8])box('стойка',x,4,z,.22,8,.26,m.black);
  box('двутавр',0,7.6,z,16.3,.32,.34,m.metal);
  box('подвесной свет',0,4.55,z,1.5,.13,.28,m.bulb);
 }
 for(let x=-5;x<7;x+=3)cable('силовой кабель',[[x,7.5,0],[x+.15,5.7,6],[x,7.5,13],[x,6,20],[x,7.4,30]],.043,m.black);
 for(let i=0;i<6;i++){
  const x=i%2?-5.9:5.9,z=1.3+Math.floor(i/2)*4;
  const side=Math.sign(x);
  box('задник на раме',x,1.6,z+1.68,2.95,2.85,.09,m.wall);
  for(const dx of [-1.32,1.32])box('рейка',x+dx,1.55,z+1.77,.09,2.95,.12,m.lightWood);
  box('складка покрывала',x,.85,z-.35,1.36,.065,1.18,m.curtain);
  box('изголовье',x,.93,z+.99,1.45,.7,.12,m.wood);
  box('прикроватная тумба',x-side*.95,.62,z-.65,.6,.53,.53,m.wood);
  box('радиобудильник',x-side*.95,.94,z-.65,.34,.19,.18,m.black);
  box('лента на коробке',x-side*.95,.842,z+.7,.08,.014,.46,m.paper);
  box('подиум',x,.18,z,3,.36,3.5,m.wood,true);
  box('стена спальни',x+Math.sign(x)*1.4,1.6,z,.13,2.9,3.5,m.wall);
  box('ложное окно',x+Math.sign(x)*1.31,1.9,z,.1,1.3,1,m.window);
  box('кровать',x,.63,z,1.35,.4,2.1,m.cloth,true,'props');
  box('подушка',x,.91,z+.67,1,.2,.48,m.pillow,false,'props');
  box('повтор коробки',x-Math.sign(x)*.95,.58,z+.7,.48,.5,.45,m.cardboard,false,'props');
  plate('маркировка',x,1.8,z+1.6,1.25,.33,'СПАЛЬНЯ / '+(42+i),'props');
 }
 for(let i=0;i<5;i++){const a=box('посадочный матрас',-.55+i*.24,.11+i*.09,1,2.6,.19,1.8,i%2?m.cloth:m.pillow,false,'stand');a.rotation.y=i*.14;}
 for(let i=0;i<8;i++)cable('шахта',[[ -2,4+i*2,0],[-2,4+i*2,2],[2,4+i*2,2]],.1,m.metal);
 plate('бирка',0,1,2.3,1.3,.36,'БРИГАДА  /  46','stand');
 const desk=box('видеомагнитофон',0,.61,18.3,3.1,1.2,1,m.black,true,'tape');
 const screen=plate('архив',0,2.3,18.68,2.85,.7,'ЛЕНТА 01 / ПУСК','tape');
 const stage=box('экран кинескопа',0,1.58,18.56,2.6,.88,.1,m.blue,false,'tape');
 const gold=world.verity.ball.material;
 const archiveRig=node('архивная проекция');archiveRig.position.set(0,1.62,18.32);archiveRig.scaling.setAll(.24);
 const archiveMonster=createMonster(scene,archiveRig);
 for(const mesh of archiveMonster.root.getChildMeshes())if(mesh.material&&!resources.includes(mesh.material))resources.push(mesh.material);
 for(let i=0;i<5;i++){box('полоса кинескопа',-1.23,1.26+i*.14,18.49,.09,.012,.05,m.bulb);box('клавиша',-.96+i*.27,1.26,17.96,.21,.12,.16,m.metal,false,'tape');}
 for(const z of [4,10,19,26]){const x=z%2?6.5:-6.5;
  box('стойка камеры',x,3.65,z,.12,.75,.12,m.metal);
  const cam=box('камера наблюдения',x,3.25,z,.4,.35,.7,m.cream);cam.rotation.y=x>0?.65:-.65;
  const lens=orb('объектив',x,3.22,z-.31,.24,m.black);lens.scaling.z=.55;
  box('громкоговоритель',-x,3.1,z,.76,1.16,.46,m.black);for(let j=0;j<6;j++)box('решётка',-x,2.8+j*.12,z-.25,.65,.036,.035,m.metal);
 }
 for(const z of [2,6,10]){box('разметка пути',-2.35,.017,z,.075,.016,2.8,m.brass);box('разметка пути',2.35,.017,z,.075,.016,2.8,m.brass);}

 const archiveBall=orb('запись 46',0,1.62,18.36,.47,gold);
 for(const x of [-.085,.085]){const eye=orb('глаз записи',x,1.66,18.15,.046,m.black);eye.setParent(archiveBall);}
 function human(name,x,y,z,scale=1){
  const p=node(name);p.position.set(x,y,z);p.scaling.setAll(scale);
  const parts=[[0,1.53,0,.32,.38,.32,m.cream],[0,1.02,0,.49,.65,.29,m.cloth],[-.15,.38,0,.19,.7,.21,m.black],[.15,.38,0,.19,.7,.21,m.black],[-.32,1.02,0,.13,.57,.16,m.cloth],[.32,1.02,0,.13,.57,.16,m.cloth]];
  for(const [x,y,z,w,h,d,mat] of parts){const a=orb('фигура',x,y,z,1,mat);a.scaling.set(w,h,d);a.parent=p;}
  const hair=orb('волосы',0,1.65,.025,1,m.wood);hair.scaling.set(.33,.2,.31);hair.parent=p;
  for(const x of [-.061,.061]){const eye=orb('взгляд',x,1.55,-.15,.028,m.black);eye.parent=p;}
  return p;
 }
 const archivePerson=human('первый испытуемый',0,1.18,18.34,.44);
 const tapeBed=box('архивная кровать',-.36,1.31,18.31,.92,.18,.38,m.cloth);
 const tapeBox=box('архивная крышка',.38,1.37,18.27,.24,.04,.18,m.cardboard);
 const spool=orb('катушка',.87,1.24,18,.19,m.metal);
 for(const x of [-3.8,3.8]){box('стойка архива',x,1.55,19,1.6,3.1,.7,m.black,true);for(let i=0;i<7;i++)box('кассеты',x,.35+i*.38,18.62,1.38,.27,.1,m.metal);}
 plate('архивная копия',-3.8,1.55,18.49,1.4,.8,'КОПИЯ 04|ПРОТОКОЛ ЗАМЕНЫ','copy');
 const glass=m.window.clone('армированное стекло');resources.push(glass);glass.alpha=.22;
 const cage=box('камера содержания',0,1.55,28.5,3.4,3.1,2.7,glass,true,'meet');
 for(const x of [-1.72,1.72])for(const z of [27.1,29.9])box('стойка стекла',x,1.6,z,.11,3.2,.11,m.brass);
 box('основание камеры',0,.13,28.5,3.75,.26,3,m.metal);
 const wires=[];for(let i=-1;i<=1;i++)wires.push(cable('к Верити',[[i*.8,3.8,29.3],[i*.55,2.2,29.2],[i*.23,1.5,28.5]],.044,m.black));
 const panel=plate('протокол',0,1.4,25.9,2.4,.9,'ПРОТОКОЛ ОСВОБОЖДЕНИЯ|ТРЕБУЕТ… [ОШИБКА]','protocol');
 const wheel=place(B.CreateTorus('маховик',{diameter:.82,thickness:.09,tessellation:24},scene),-2.55,1.45,28.2,m.brass);wheel.rotation.x=Math.PI/2;wheel.metadata={action:'wheel'};
 const spoke=box('спица',-2.55,1.45,28.2,.08,.8,.09,m.cream,false,'wheel');
 plate('шкала',-2.55,2.16,28.38,1.65,.37,'ПАЗ → СОВМЕСТИТЬ','wheel');
 const pin=box('стопор',2.5,1.4,28.2,.68,.19,.23,m.brass,false,'pin');
 plate('индикатор',2.5,1.95,28.38,1.5,.45,'← ИЗВЛЕЧЬ ШТИФТ','pin');
 for(const x of [-2.55,2.5])box('опора',x,.64,28.44,.44,1.25,.4,m.metal,true);
 const mirror=box('зеркальная ниша',0,1.58,32.78,3.1,2.95,.17,m.window);
 box('рама',0,3.1,32.75,3.3,.12,.28,m.brass);
 const reflection=human('отражение',0,.38,32.43);
 const reflectedOrb=orb('новый проводник',0,1.45,32.22,.83,gold);
 const eyes=[-.14,.14].map(x=>orb('глаз отражения',x,1.52,31.85,.1,m.black));
 const smile=cable('улыбка отражения',[[-.16,1.38,31.86],[-.08,1.33,31.84],[0,1.31,31.83],[.08,1.33,31.84],[.16,1.38,31.86]],.019,m.black);
 for(const x of [-1.05,1.05]){box('стойка отражения',x,1.62,32.65,.055,2.72,.05,m.metal);}
 const carriage=box('подвижная обойма',0,2.62,28.5,3.8,.17,.34,m.brass);
 const bearing=box('паз обоймы',0,2.63,28.31,.22,.19,.04,m.black);
 const outside=gate(39.4,'outsideDoor','НАРУЖУ');
 for(const x of [-1.5,1.5])wall(x,36.9,.2,5.6,3.2);
 const lights=[lamp(0,3.6,6,'#ddad73',14),lamp(0,3.6,18,'#85bfc1',10),lamp(0,3.6,28,'#9ab8c0',12)];
 reflection.setEnabled(false);reflectedOrb.setEnabled(false);eyes.forEach(e=>e.setEnabled(false));smile.setEnabled(false);archivePerson.setEnabled(false);tapeBed.setEnabled(false);tapeBox.setEnabled(false);
 const actor=human('новый испытуемый',-2.8,.76,-2.2);actor.parent=null;actor.setEnabled(false);
 return {root,actor,carriage,bearing,archiveMonster,obstacles,gates,screen,panel,wheel,spoke,pin,cage,wires,archiveBall,archivePerson,tapeBed,tapeBox,spool,mirror,reflection,reflectedOrb,eyes,smile,lights,
 open(index){const g=gates[index];g.position.y=4.3;g.block.disabled=true;},
 dispose(){actor.dispose();root.dispose();resources.forEach(r=>r.dispose());}};
}
