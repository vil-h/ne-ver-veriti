import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {backstageRoom} from './backstage-room.js';
import {guideStart,guideAction,guideEndings} from './backstage-state.js';

const cut=(v)=>Math.min(1,Math.max(0,v));
const goals={landing:'Поднимитесь с матрасов',hangar:'Найдите архив за спальнями',archive:'Восстановите четыре фрагмента записи',cell:'Подойдите к стеклу',puzzle:'Совместите паз и извлеките стопор с другой стороны',choice:'Вернитесь к протоколу или изучите архив',refusal:'Пройдите через служебный коридор'};
export const guideNames={stand:'Подняться',props:'Реквизит испытания',archiveDoor:'Открыть архив',tape:'Воспроизвести следующую запись',copy:'Прочитать архивную копию',cellDoor:'Открыть камеру содержания',meet:'Присмотреться к Верити',protocol:'Терминал освобождения',wheel:'Повернуть обойму',pin:'Извлечь стопор',outsideDoor:'Попробовать выйти'};
const records=[
 ['ЛЕНТА 01 / ИНСТРУКТАЖ','ПОПЫТКА № 46|ПОВЕДЕНИЕ ПРОВОДНИКА: НЕСТАБИЛЬНО'],
 ['ЛЕНТА 02 / ОБРАТНАЯ СВЯЗЬ','КАНАЛ 46 / ЗАПРОС ОТКЛОНЁН'],
 ['ЛЕНТА 03 / ВОЗВРАТ','ПРОТОКОЛ ПРИНУДИТЕЛЬНОГО ВОЗВРАЩЕНИЯ|ПРИМЕНЕНИЕ СТРАХА РАЗРЕШЕНО'],
 ['ЛЕНТА 04 / СПАЛЬНЯ','ИСПЫТУЕМЫЙ № 46|СТАТУС: НАЗНАЧЕН ПРОВОДНИКОМ']];
export class FinalGuide{
 constructor(world,sound,dialogue){Object.assign(this,{world,sound,dialogue});this.reset();}
 reset(){if(this.room){this.world.camera.fov=1.12;this.sound.setAmbienceLevel(1);}this.room?.dispose();this.room=null;this.state=guideStart();this.queue=[];this.age=0;this.clock=0;this.previousZ=1;this.tapeTime=-1;this.tapeIndex=-1;this.turn=0;this.fade=0;this.choice=false;this.title=false;this.seenSkip=false;}
 enter(){this.reset();this.world.enterBackstage();this.room=backstageRoom(this.world);this.world.camera.position.set(0,18,1);this.world.camera.rotation.set(.6,0,0);this.sound.fall();this.sound.setAmbienceLevel(.12);}
 get locked(){return !!this.room&&!['hangar','archive','cell','puzzle','choice','refusal'].includes(this.state.phase);}
 get busy(){return this.queue.length>0||!!this.dialogue.current;}
 available(id){
  const p=this.state.phase;
  if(id==='stand')return p==='landing';
  if(id==='archiveDoor')return p==='hangar';
  if(id==='cellDoor')return p==='archive';
  if(id==='meet')return p==='cell';
  if(id==='outsideDoor')return p==='refusal';
  return !!guideNames[id]&&!this.locked&&!this.queue.length&&!this.dialogue.current?.voice&&this.tapeTime<0;
 }
 get objective(){return goals[this.state.phase]||'';}
 lines(...keys){this.queue=keys;this.next();}
 next(){if(!this.dialogue.current&&this.queue.length)this.dialogue.say(this.queue.shift()+'Guide');}
 note(text){this.dialogue.say({speaker:'Вы',emotion:'neutral',text});}
 phase(name){this.state={...this.state,phase:name};this.age=0;}
 aim(x,y,z){this.world.camera.setTarget(new Vector3(x,y,z));}
 action(id){
  const s=this.state,r=this.room;
  if(id==='stand'&&s.phase==='landing'){this.state=guideAction(s,id);this.world.camera.rotation.set(.02,0,0);return;}
  if(this.locked||this.queue.length||this.dialogue.current?.voice||this.tapeTime>=0)return;
  const next=guideAction(s,id);
  this.dialogue.stop();this.state=next;
  if(id==='props')this.note('Та же подушка, та же коробка. Только номера на торцах разные.');
  if(id==='archiveDoor'&&s!==next){r.open(0);this.sound.effect('door');}
  if(id==='tape'){
   const index=s!==next?s.tapes:(this.tapeIndex+1)%4;this.tapeIndex=index;r.archiveMonster.pose(0,0);r.archiveBall.scaling.setAll(1);
   this.tapeTime=0;r.screen.write(records[index][0]);this.sound.effect('switch');
   r.archiveBall.setEnabled(index<3);r.archivePerson.setEnabled(index===3);r.tapeBed.setEnabled(index===3);r.tapeBox.setEnabled(index===3);
   if(index===0)this.lines('greeting');if(index===1)this.lines('plead','rule');
  }
  if(id==='cellDoor'){if(s!==next){r.open(1);this.sound.effect('door');}else if(s.tapes<4)this.note('Замок связан с архивом. На счётчике '+s.tapes+' из 4.');}
  if(id==='copy'){this.note('Архивная копия. Освобождение текущего проводника требует назначения совместимого субъекта на его место.');}
  if(id==='meet'&&s!==next)this.lines('arrival','jump','know','human','lied');
  if(id==='wheel'&&next.aligned){this.sound.effect('door');r.pin.position.x=2.8;}
  if(id==='pin'){if(next.released){r.pin.position.x=3.1;this.sound.effect('door');r.panel.write('ОГРАНИЧЕНИЯ СНЯТЫ|ПОДТВЕРДИТЬ РЕШЕНИЕ');}else this.note('Штифт держит вес обоймы. Через стекло видно: прорезь на другой стороне стоит поперёк.');}
  if(id==='protocol'){if(s.phase==='choice')this.choice=true;else this.note('Протокол освобождения проводника. Освобождение текущего проводника требует… Строка повреждена.');}
  if(id==='refuse'&&s!==next){this.choice=false;r.open(2);this.lines('wait','waited');}
  if(id==='outsideDoor'&&s!==next){this.age=0;this.sound.effect('door');this.lines('refused','return');}
  if(id==='free'&&s!==next){this.choice=false;this.age=0;this.world.camera.position.set(-.72,1.65,26.25);this.aim(0,1.5,28.5);this.lines('thanks','never');this.chord([261.6,329.6,392],.025);}
 }
 chord(notes,level){
  const a=this.sound,c=a.ctx;if(!c)return;
  for(const [i,f] of notes.entries()){const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+i*.21;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(level,t+.12);g.gain.exponentialRampToValueAtTime(.0001,t+2);o.connect(g);g.connect(a.effects);o.start(t);o.stop(t+2.1);o.onended=()=>{o.disconnect();g.disconnect();};}
 }
 skip(){if(this.canSkip){this.queue=[];this.dialogue.stop();this.phase('final-guide-replacement');this.title=false;}}
 get canSkip(){return this.seenSkip&&['release','alarm','mirror','silence','boxScene','title'].includes(this.state.phase);}
 tick(dt,motion){
  const w=this.world,r=this.room,c=w.camera,p=c.position,v=w.verity;
  if(!this.locked&&((this.previousZ>=22&&p.z<22)||(this.previousZ<22&&p.z>=22))){
   this.dialogue.stop();this.queue=[];this.tapeTime=-1;
  }
  this.previousZ=p.z;
  this.clock+=dt;this.age+=dt;this.fade=0;this.dialogue.tick(dt);this.next();
  const phase=this.state.phase,a=this.age;
  if(this.state.aligned&&this.turn<1){this.turn=cut(this.turn+dt*.9);r.spoke.rotation.z=this.turn*Math.PI/2;r.carriage.rotation.z=(1-this.turn)*.12;r.bearing.position.x=this.turn*1.6;}
  if(phase==='refusal'&&p.z>35&&Math.floor(this.clock/1.8)!==Math.floor((this.clock-dt)/1.8))this.sound.outsideWorld([0,2,40]);
  if(phase==='fall'){
   p.y=18-17.1*cut(a/2.4)**1.6;c.rotation.z=motion?.09*Math.sin(a*7):0;this.fade=cut(1-a);
   if(a>2.4){this.phase('landing');this.sound.effect('box');c.rotation.z=0;c.rotation.set(.12,0,0);}
  }
  if(phase==='landing'){p.y=.8+(motion?.11*Math.sin(a*12)*Math.exp(-a*2):0);}
  if(phase==='hangar'&&Math.floor(this.clock/7)!==Math.floor((this.clock-dt)/7))this.sound.ambientEvent('pipe',[6,4,8]);
  if(this.tapeTime>=0){
   this.tapeTime+=dt;const t=this.tapeTime,i=this.tapeIndex;
   r.spool.rotation.x+=dt*3;
   if(i===2){const u=cut(t/3);r.archiveBall.scaling.setAll(1-u*.98);r.archiveMonster.pose(t,u);}
   if(i===3){r.archivePerson.position.set(-.45+.85*cut(t/3),1.23,18.31);r.archivePerson.rotation.z=.9*(1-cut(t/1.3));r.tapeBox.rotation.x=-1.2*cut(t-2.4);if(t>3.8){r.tapeBed.setEnabled(false);r.tapeBox.setEnabled(false);r.archivePerson.setEnabled(false);r.archiveBall.setEnabled(true);r.archiveBall.scaling.setAll(1);}}
   if(t>4.7&&!this.busy){r.screen.write(records[i][1]);this.tapeTime=-1;}
  }
  if(['cell','puzzle','choice','release','alarm','mirror','refusal'].includes(phase)){
   v.root.setEnabled(true);v.setUneasy(true);
   const offset=phase==='release'?cut(a/3):['alarm','mirror'].includes(phase)?1:0;
   const leave=phase==='mirror'?cut((a-5)/8):0;
   v.update(this.clock,c,phase==='mirror'?new Vector3(-1.32-leave*4,1.36,32+leave*1.5):new Vector3(offset*1.6,1.47,28.5-offset*1.8),10,dt,motion);if(leave>=1)v.root.setEnabled(false);
  }
  if(phase==='release'){
   r.cage.position.y=1.55+3*cut(a/3);for(const wire of r.wires)wire.position.y=cut(a/1.8)*2;
   if(a>7&&!this.busy){this.phase('alarm');c.position.set(-1.72,1.62,24.3);this.aim(.1,1.63,26.7);r.panel.write('ПРОВОДНИК № 46 ОСВОБОЖДЁН|ТРЕБУЕТСЯ ЗАМЕНА');r.lights[2].diffuse.set(1,.09,.045);r.gates[1].position.y=1.45;r.gates[1].block.disabled=false;this.sound.alarm();this.lines('no','wrong','match','assign','subject');}
  }
  if(phase==='alarm'&&a>2&&!this.busy){this.phase('mirror');p.set(0,1.65,29.72);this.aim(0,1.43,32.5);r.reflection.setEnabled(true);this.lines('unknown','end','sorry');this.chord([70,73,105],.035);}
  if(phase==='mirror'){
   const u=cut(a/5);p.y=1.65-.53*u;c.fov=1.12-.15*Math.sin(u*Math.PI);this.aim(0,1.48,32.3);if(motion)c.rotation.z=.025*Math.sin(a*5)*(1-u);
   r.reflection.scaling.setAll(1-u);r.reflectedOrb.setEnabled(true);r.reflectedOrb.scaling.setAll(Math.max(.01,u));r.eyes.forEach(e=>e.scaling.setAll(cut((a-3)/1.6)));r.eyes.forEach(e=>e.setEnabled(a>3));r.smile.setEnabled(a>5);r.smile.scaling.x=cut((a-5)/2);
   if(a>10&&!this.busy){this.phase('silence');this.sound.setAmbienceLevel(0);v.root.setEnabled(false);}
  }
  if(phase==='silence'){this.fade=1;if(a>2.5){this.phase('boxScene');r.root.setEnabled(false);w.loopBedroom();w.boxView(0);r.actor.setEnabled(true);this.sound.wakeAlarm();}}
  if(phase==='boxScene'){
   w.boxView(cut((a-5)/2),cut((a-1)/4));const u=cut((a-1)/4);r.actor.position.set(-2.8+2.8*u,.73*(1-cut(a/1.5)),-2.2+1.44*u);r.actor.rotation.y=Math.PI;r.actor.rotation.x=-.25*cut(a-5);r.actor.rotation.z=(1-cut(a/1.5))*1.3;
   if(a>=7&&a-dt<7)this.lines('guide','begin','greeting');
   if(a>8&&!this.busy){this.phase('title');this.title=true;}
  }
  if(phase==='title'){this.fade=1;if(a>3){this.phase('final-guide-replacement');this.title=false;try{localStorage.setItem('verity-guide-ending-seen','1');}catch{}}}
  if(phase==='denied'&&!this.busy){this.phase('returnBox');r.root.setEnabled(false);w.loopBedroom();w.closedBox();this.sound.setAmbienceLevel(0);}
  if(phase==='returnBox'){this.fade=cut((a-2)/2);if(a>4)this.phase('final-guide-refused');}
  return guideEndings[this.state.phase]?this.state.phase:null;
 }
}
