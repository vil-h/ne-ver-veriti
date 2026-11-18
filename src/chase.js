import {chaseInitial,tickChase} from './chase-state.js';
import {createPursuer,advancePursuer} from './chase-monster.js';
import {atPit,RUN_SPEED,WALK_SPEED} from './chase-layout.js';
export class Chase {
 constructor(world,sound){this.world=world;this.sound=sound;this.active=false;this.jump=false;}
 start(){this.state=chaseInitial();this.monster=createPursuer();this.jump=false;this.active=true;this.world.enterChase();this.sound.startChase();}
 stop(){this.active=false;this.jump=false;this.sound.stopChase();}
 speed(input,mobile){return this.state.phase==='running'?(input.sprint||mobile?RUN_SPEED:WALK_SPEED):0;}
 requestJump(){if(this.active&&this.state.phase==='running')this.jump=true;}
 tick(dt,motion){
  const player=this.world.camera.position;
  if(this.state.phase==='running')advancePursuer(this.monster,player,dt);
  const before=this.state.phase;this.state=tickChase(this.state,{dt,player,monster:this.monster.position,jump:this.jump});this.jump=false;
  if(before!==this.state.phase){if(this.state.phase==='caught')this.sound.alarm();if(this.state.phase==='falling')this.sound.fall();}
  this.world.chaseRoom.update(this.state.elapsed,dt,this.world.camera,this.world.verity,this.monster,this.state,motion);
  const distance=Math.hypot(player.x-this.monster.position.x,player.z-this.monster.position.z);
  this.sound.updateChase(this.state.elapsed,this.monster.position,distance);
  return {phase:this.state.phase,near:Math.max(0,1-distance/18),pit:this.state.phase==='running'&&atPit(player),fade:this.state.phase==='falling'?Math.max(0,(this.state.phaseTime-1.3)/1.1):this.state.phase==='caught'?Math.max(0,(this.state.phaseTime-.55)/.7):0};
 }
}
export function chaseEnding(phase){const lost=phase==='lost';return `<div class="ending-wrap"><main class="ending"><p class="eyebrow">${lost?'ПОРАЖЕНИЕ':'ТОЧКА ПРОДОЛЖЕНИЯ'}</p><h1>${lost?'Верити догнал вас':'Продолжение следует'}</h1><p>${lost?'Улыбка сомкнулась. В следующий раз можно убежать.':'Вы прыгнули в темноту. Следующий эпизод ещё не утверждён — это не финал истории.'}</p><button class="primary" data-ui="retry-chase">Повторить погоню</button><button class="secondary" data-ui="restart">Начать игру заново</button><button class="text-button" data-ui="menu">В главное меню</button></main></div>`;}
