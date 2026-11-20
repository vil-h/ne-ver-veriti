// Centre-line distance distinguishes the two parallel runs of the corridor.
import {route} from './chase-layout.js';
export function routeDistance(p){
 let length=0,best=Infinity,along=0;
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
  const distance=Math.max(0,Math.min(len,((p.x-a.x)*dx+(p.z-a.z)*dz)/len));
  const error=Math.hypot(p.x-a.x-dx*distance/len,p.z-a.z-dz*distance/len);
  if(error<best){best=error;along=length+distance;}length+=len;
 }
 return along;
}
export function huntStage(progress){return progress<38?1:progress<112?2:progress<160?3:4;}
export function pursuitMode(stage,progress,gap,age){
 if(age<.85)return 'lunge';
 if(age<3.4)return 'recover';
 if(stage===3&&progress<140)return 'search';
 if(stage===3)return 'return';
 if(stage===4)return 'sprint';
 return gap>12?'close':'track';
}
export function pursuitSpeed(mode,gap){
 const speeds={lunge:6.4,recover:1.35,search:3.4,return:6.25,sprint:gap>4.4?5.8:4.7,close:5.12,track:4.4};
 return speeds[mode];
}
export const huntTitles=['','ОН ПРОСНУЛСЯ','НЕ ОГЛЯДЫВАЙСЯ','ТЫ ЕГО ПОТЕРЯЛ?','ПОСЛЕДНИЙ РЫВОК'];
