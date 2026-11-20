import {RESCUE_ENDING} from './rescue-state.js';
export const awakeningInitial=()=>({phase:'rise',age:0,seen:0,hinted:false,endingId:null});
export function awakeningTick(state,dt,visible){
 const s={...state};s.age+=dt;let event=null;
 if(s.phase==='rise'&&s.age>=4){s.phase='explore';s.age=0;event='thought';}
 else if(s.phase==='explore'){
  s.seen=visible?s.seen+dt:0;
  if(s.seen>=.3){s.phase='reveal';s.age=0;event='noticed';}
  else if(s.age>25&&!s.hinted){s.hinted=true;event='hint';}
 }else if(s.phase==='reveal'&&s.age>=6){s.phase='ended';s.endingId=RESCUE_ENDING;event='ending';}
 return {state:s,event};
}
export class FalseAwakening {
 constructor(world,sound,dialogue){this.world=world;this.sound=sound;this.dialogue=dialogue;this.reset();}
 reset(){this.active=false;this.state=awakeningInitial();}
 start(){this.reset();this.active=true;this.dialogue.stop();this.sound.setAmbienceLevel(0);this.world.morning();}
 get locked(){return this.state.phase==='rise'||this.state.phase==='reveal';}
 tick(dt){
  const {world:w}=this,p=w.verity.root.position,cam=w.camera;
  const delta=p.subtract(cam.position),distance=delta.length(),dir=delta.normalize();
  const forward=cam.getForwardRay().direction;const dot=dir.x*forward.x+dir.y*forward.y+dir.z*forward.z;
  const hit=w.scene.pickWithRay(cam.getForwardRay(distance),m=>m.isEnabled()&&m.isPickable);
  const visible=distance<5&&dot>.975&&(!hit?.hit||hit.distance>distance-.4);
  const result=awakeningTick(this.state,dt,visible);this.state=result.state;
  if(this.state.phase==='rise')cam.position.y=1.05+.6*Math.min(1,this.state.age/3.6);
  if(result.event==='thought')this.dialogue.say('falseWake');
  if(result.event==='hint')this.sound.quietTone([-2.8,1,-2],.018);
  if(result.event==='noticed'){this.dialogue.stop();this.sound.quietTone([-2.8,1,-2],.025);}
  if(this.state.phase==='reveal'){
   const yaw=Math.atan2(cam.position.x-p.x,cam.position.z-p.z)+Math.PI;
   const deltaYaw=Math.atan2(Math.sin(yaw-w.verity.root.rotation.y),Math.cos(yaw-w.verity.root.rotation.y));
   w.verity.root.rotation.y+=deltaYaw*(1-Math.exp(-dt*.7));
   w.verity.silentSmile(Math.min(1,this.state.age/3));
  }
  this.dialogue.tick(dt);
  return {event:result.event,endingId:this.state.endingId,fade:this.state.phase==='rise'?Math.max(0,1-this.state.age/2):this.state.phase==='reveal'?Math.max(0,(this.state.age-3)/3):0};
 }
}
