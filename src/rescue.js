import {act} from './state.js';
import {FalseAwakening} from './false-awakening.js';
export const rescueTargets={terminal:'Повреждённая инструкция',monitor:'Мониторы наблюдения',isolate:'Цепь А · повреждение',reserve:'Резерв Б · питание',vent:'Вентиляция · переключатель',release:'Аварийное отпирание',rescueExit:'Аварийный выход',rescueEntry:'Запертая дверь'};
export class Rescue {
 constructor(world,sound,dialogue){this.world=world;this.sound=sound;this.dialogue=dialogue;this.awakening=new FalseAwakening(world,sound,dialogue);this.reset();}
 reset(){this.awakening.reset();this.enteredAt=-1;this.vanished=false;this.sound.setAmbienceLevel(1);}
 get busy(){return this.dialogue.current?.speaker==='Верити';}
 apply(result,t){
  const {effect,state}=result;if(effect==='openRescue'){this.world.openRescue(t);this.sound.effect('door');return;}
  this.world.rescueRoom.sync(state.rescue);
  this.world.rescueRoom.effect(effect,t);
  if(effect==='wrong')this.sound.quietTone([4.5,1.4,42.4],.08);
  else if(effect==='unlockRescue'){this.sound.setAmbienceLevel(0);this.sound.effect('install');}
  else if(effect==='slam'){this.sound.effect('door');this.sound.ambientEvent('knock',[2.1,1,33]);}
  else if(effect==='openRescueExit')this.sound.effect('door');
  else if(effect)this.sound.effect('click');
 }
 tick(state,t,dt,motion){
  let changed=false,fade=0,ending=null;
  if(state.zone==='falseAwakening'){
   const v=this.awakening.tick(dt);return {state,changed:false,fade:v.fade,ending:v.endingId};
  }
  const w=this.world;
  if(!state.rescue.entered&&w.camera.position.z>34.1){
   state={...state,zone:'rescueRoom'};w.enterRescue();this.enteredAt=t;
   const result=act(state,'rescueEnter');state=result.state;this.apply(result,t);this.dialogue.say(result.line);changed=true;
  }
  if(state.rescue.entered){
   if(!this.vanished){
    if(!this.busy){w.verity.root.scaling.scaleInPlace(Math.exp(-dt*4));if(w.verity.root.scaling.x<.03){w.verity.root.setEnabled(false);this.vanished=true;}}
    else w.verity.update(t,w.camera,w.verity.root.position.clone(),10,dt,false);
   }
   fade=w.rescueRoom.update(t,dt,w.camera,state.rescue,this.sound,motion);
   if(state.rescue.exitOpen&&w.camera.position.z>49){
    state={...state,zone:'falseAwakening'};this.awakening.start();changed=true;fade=1;
   }
  }
  return {state,changed,fade,ending};
 }
}
export function rescueEnding(){return `<div class="ending-wrap"><main class="ending"><p class="eyebrow">КОНЕЦ ВЕТКИ «СПАСЕНИЕ»</p><h1>ТЫ НЕ ПРОСНУЛСЯ</h1><button class="primary" data-ui="restart">Начать заново</button><button class="secondary" data-ui="menu">В главное меню</button></main></div>`;}
