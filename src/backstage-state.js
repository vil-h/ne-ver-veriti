export const guideStart=()=>({phase:'fall',tapes:0,warning:false,aligned:false,released:false});
export const guideEndings={'final-guide-replacement':'ТЫ СЛЕДУЮЩИЙ','final-guide-refused':'ОТКАЗ НЕ ПРИНЯТ'};
export function guideAction(s,id){
 if(s.phase==='landing'&&id==='stand')return {...s,phase:'hangar'};
 if(s.phase==='hangar'&&id==='archiveDoor')return {...s,phase:'archive'};
 if(s.phase==='archive'&&id==='tape'&&s.tapes<4)return {...s,tapes:s.tapes+1};
 if(s.phase==='archive'&&s.tapes===4&&id==='cellDoor')return {...s,phase:'cell'};
 if(['archive','cell','puzzle','choice'].includes(s.phase)&&id==='copy')return {...s,warning:true};
 if(s.phase==='cell'&&id==='meet')return {...s,phase:'puzzle'};
 if(s.phase==='puzzle'&&id==='wheel')return {...s,aligned:true};
 if(s.phase==='puzzle'&&s.aligned&&id==='pin')return {...s,released:true,phase:'choice'};
 if(s.phase==='choice'&&id==='free')return {...s,phase:'release'};
 if(s.phase==='choice'&&id==='refuse')return {...s,phase:'refusal'};
 if(s.phase==='refusal'&&id==='outsideDoor')return {...s,phase:'denied'};
 return s;
}
