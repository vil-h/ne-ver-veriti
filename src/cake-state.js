export const symbols=['РОМБ','ЛУНА','ЗВЕЗДА'];
export const cakeInitial=()=>({digits:[0,0,0],unlocked:false,collapsed:false,finished:false,warning:0,calm:0});
export function cakeAct(state,action){
 const s={...state,digits:[...state.digits]};let line=null,effect=null;
 if(s.finished||s.collapsed)return {state:s,line,effect};
 if(action.startsWith('dial')){const i=Number(action.slice(4));if(Number.isInteger(i)&&i>=0&&i<3&&!s.unlocked)s.digits[i]=(s.digits[i]+1)%3;}
 else if(action==='submit'&&!s.unlocked){if(s.digits.join('')==='102'){s.unlocked=true;line='cakeSolved';effect='unlock';}else{line='cakeWrong';effect='wrong';}}
 else if(action==='redButton'){s.collapsed=true;line='cakeRage';effect='collapse';}
 else if(action==='cakeExit'){if(s.unlocked){s.finished=true;effect='next';}else line='cakeLocked';}
 else if(['treat','partyNote','candleClue','giftClue','starClue','cakeEntry'].includes(action))line=action;
 return {state:s,line,effect};
}
export function cakeProximity(state,distance,dt){
 const s={...state};let line=null,emotion=null;
 if(s.collapsed||s.finished)return {state:s,line,emotion};
 if(distance<2.1&&s.warning===0){s.warning=1;s.calm=0;line='cakeConcern';emotion='suspicious';}
 else if(distance<1.25&&s.warning===1){s.warning=2;s.calm=0;line='cakeInsist';emotion='angry';}
 else if(distance>2.7&&s.warning){s.calm+=dt;if(s.calm>5){s.warning=0;s.calm=0;line='cakeCalm';emotion='friendly';}}
 else if(distance<=2.7)s.calm=0;
 return {state:s,line,emotion};
}
