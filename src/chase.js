import {overlaps} from './physics.js';
import {obstacles} from './chase-layout.js';
import {chaseInitial,tickChase,PIT_LINES} from './chase-state.js';
import {createPursuer,advancePursuer} from './chase-monster.js';
import {atPit,RUN_SPEED,WALK_SPEED,resetGates,updateGates} from './chase-layout.js';
export class Chase {
 constructor(world,sound){this.world=world;this.sound=sound;this.active=false;}
 start(){resetGates();this.state=chaseInitial();this.monster=createPursuer();this.jump=this.trust=false;this.active=true;this.world.enterChase();this.sound.startChase();this.sound.hush(false);}
 stop(){this.active=false;this.jump=this.trust=false;this.sound.stopChase();this.sound.hush(false);}
 speed(input,mobile){return ['running','pitReturn','pitTalk','choice'].includes(this.state.phase)?(this.state.phase==='running'?(input.sprint||mobile?RUN_SPEED:WALK_SPEED):WALK_SPEED):0;}
 requestJump(){if(this.active)this.jump=true;}
 requestTrust(){if(this.active&&this.state.phase==='choice')this.trust=true;}
 tick(dt,motion,quality){
  const player=this.world.camera.position,cam=this.world.camera;
  updateGates(player,dt);
  let distance=Math.hypot(player.x-this.monster.position.x,player.z-this.monster.position.z);
  if(this.state.phase==='running'||(this.state.phase==='trusting'&&distance>.78)||(this.state.phase==='pitReturn'&&distance>4))advancePursuer(this.monster,player,dt);
  const dx=this.monster.position.x-player.x,dz=this.monster.position.z-player.z;
  const looking=(Math.sin(cam.rotation.y)*dx+Math.cos(cam.rotation.y)*dz)/Math.max(.1,Math.hypot(dx,dz))>.55;
  const before=this.state;
  const clearSight=distance>1.1||![.25,.5,.75].some(k=>obstacles.some(b=>overlaps(player.x+dx*k,player.z+dz*k,.06,b)));
  const readyToAttack=Math.hypot(dx,dz)<.92&&clearSight;
  this.state=tickChase(before,{dt,player,monster:this.monster.position,clearSight,readyToAttack,jump:this.jump,trust:this.trust,looking,dialogueDone:!this.dialogue?.current});this.jump=this.trust=false;
  if(before.phase!==this.state.phase){
   if(this.state.phase==='pitReturn'){this.sound.fadeHunt();this.sound.hush(true);this.sound.pitTone();}
   if(this.state.phase==='caught'){this.sound.fadeHunt('caught');this.sound.hush(false);this.sound.playCue('attack',[this.monster.position.x,1.7,this.monster.position.z]);}
   if(this.state.phase==='falling'){this.dialogue?.stop();this.sound.fall();}
   if(this.state.phase==='trusting')this.dialogue?.say('pitGood');
  }
  if(this.state.phase==='pitTalk'&&(before.phase!=='pitTalk'||before.lineIndex!==this.state.lineIndex))this.dialogue?.say(PIT_LINES[this.state.lineIndex]);
  this.dialogue?.tick(dt);
  this.world.chaseRoom.update(this.state.elapsed,dt,cam,this.world.verity,this.monster,this.state,motion,quality);
  distance=Math.hypot(player.x-this.monster.position.x,player.z-this.monster.position.z);
  if(this.state.phase==='running')this.sound.updateChase(this.state.elapsed,this.monster,distance);
  const choosing=['pitReturn','pitTalk','choice'].includes(this.state.phase);
  return {phase:this.state.phase,near:this.state.phase==='running'?Math.max(0,1-distance/18):0,pit:choosing&&atPit(player),trust:this.state.phase==='choice',fade:this.state.phase==='falling'?Math.max(0,(this.state.phaseTime-1.3)/1.1):this.state.phase==='caught'?Math.max(0,(this.state.phaseTime-1)/.65):0};
 }
}
export function chaseEnding(){return `<div class="ending-wrap"><main class="ending"><p class="eyebrow">ПОРАЖЕНИЕ</p><h1>Верити догнал вас</h1><p>Улыбка сомкнулась. В следующий раз можно убежать.</p><button class="primary" data-ui="retry-chase">Повторить погоню</button><button class="secondary" data-ui="restart">Начать игру заново</button><button class="text-button" data-ui="menu">В главное меню</button></main></div>`;}
