import {atPit} from './chase-layout.js';
export const chaseInitial=()=>({phase:'running',elapsed:0,phaseTime:0,checkpoint:true});
export function tickChase(state,{dt,player,monster,jump=false}){
 const s={...state,elapsed:state.elapsed+dt};
 if(s.phase==='running'){
  // Jump wins on the frame the player commits at the ledge, never from anywhere else.
  if(jump&&atPit(player)){s.phase='falling';s.phaseTime=0;}
  else if(s.elapsed>3&&Math.hypot(player.x-monster.x,player.z-monster.z)<.92){s.phase='caught';s.phaseTime=0;}
 }else if(s.phase==='falling'||s.phase==='caught'){
  s.phaseTime+=dt;if(s.phaseTime> (s.phase==='falling'?2.4:1.5))s.phase=s.phase==='falling'?'continued':'lost';
 }
 return s;
}
