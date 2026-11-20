import {atPit} from './chase-layout.js';
export const PIT_LINES=['pitStop','pitDanger','pitPlease'];
export const chaseInitial=()=>({phase:'running',elapsed:0,phaseTime:0,lineIndex:0,checkpoint:true});
export function tickChase(state,{dt,player,monster,jump=false,trust=false,dialogueDone=false,looking=false,clearSight=true,readyToAttack=true}){
 const s={...state,elapsed:state.elapsed+dt,phaseTime:state.phaseTime+dt};
 const change=phase=>{s.phase=phase;s.phaseTime=0;};
 const distance=Math.hypot(player.x-monster.x,player.z-monster.z);
 if(['running','pitReturn','pitTalk','choice'].includes(s.phase)&&jump&&atPit(player)){change('falling');return s;}
 if(s.phase==='running'){
  if(atPit(player))change('pitReturn');
  else if(distance<.92&&clearSight&&(s.elapsed>3||distance<.5))change('caught');
 }else if(s.phase==='pitReturn'){
  if(distance>6)s.phaseTime=0;
  if(s.phaseTime>2.5&&looking)change('pitTalk');
 }else if(s.phase==='pitTalk'&&dialogueDone){
  if(s.lineIndex<PIT_LINES.length-1){s.lineIndex++;s.phaseTime=0;}else change('choice');
 }else if(s.phase==='choice'&&trust)change('trusting');
 else if(s.phase==='trusting'&&dialogueDone&&readyToAttack)change('caught');
 else if(s.phase==='falling'&&s.phaseTime>2.4)change('continued');
 else if(s.phase==='caught'&&s.phaseTime>1.8)change('lost');
 return s;
}
