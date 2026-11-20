// A recoverable interlock puzzle, independent of rendering and audio.
export const RESCUE_ENDING='rescue-false-awakening';
export const rescueInitial=()=>({entered:false,isolated:false,reserve:false,ventOff:false,unlocked:false,exitOpen:false,monitor:false});
export function rescueAct(state,action){
 const s={...state};let line=null,effect=null;
 if(action==='rescueEnter'&&!s.entered){s.entered=true;line='rescueAbandon';effect='slam';}
 if(!s.entered)return {state:s,line,effect};
 switch(action){
 case 'terminal':line='rescueManual';break;
 case 'monitor':s.monitor=true;line='rescueMonitor';effect='monitor';break;
 case 'isolate':if(!s.unlocked){s.isolated=!s.isolated;if(!s.isolated)s.reserve=false;effect='switch';}line=s.isolated?'rescueIsolated':'rescueFault';break;
 case 'reserve':if(!s.isolated){line='rescueInterlock';effect='wrong';}else if(!s.reserve){s.reserve=true;line='rescueVentVoice';effect='reserve';}else line='rescueReserve';break;
 case 'vent':if(!s.unlocked){s.ventOff=!s.ventOff;effect='switch';}line=s.ventOff?'rescueVentOff':'rescueVentOn';break;
 case 'release':if(s.unlocked)line='rescueReady';else if(!s.reserve){line='rescueNoPower';effect='wrong';}else if(!s.ventOff){line='rescueLoad';effect='wrong';}else{s.unlocked=true;line='rescueReady';effect='unlockRescue';}break;
 case 'rescueExit':if(s.unlocked&&!s.exitOpen){s.exitOpen=true;effect='openRescueExit';}else if(!s.unlocked)line='rescueNoPower';break;
 case 'rescueEntry':line='rescueSealed';break;
 }
 return {state:s,line,effect};
}
