export const initialState=()=>({opened:false,fuse:false,installed:false,power:false,doorOpen:false,zone:'bedroom',branch:null});
export function act(state,action){
 const s={...state};let line=null,effect=null;
 if(s.branch)return {state:s,line,effect};
 switch(action){
 case 'box':line=s.opened?'boxAgain':'box';if(!s.opened)effect='box';s.opened=true;break;
 case 'drawer':line=!s.opened?'drawerLocked':s.fuse?'fuseAgain':'fuse';if(s.opened){if(!s.fuse)effect='drawer';s.fuse=true;}break;
 case 'panel':
  line=!s.fuse?'panelEmpty':!s.installed?'installed':!s.power?'light':'panelOn';
  if(s.installed&&!s.power){s.power=true;effect='power';}else if(s.fuse&&!s.installed){s.installed=true;effect='install';}break;
 case 'exit':line=s.power?'exit':'locked';if(s.power&&!s.doorOpen){s.doorOpen=true;effect='door';}break;
 case 'cake':case 'rescue':if(s.zone==='doors'&&s.doorOpen){s.branch=action;effect='branch';}break;
 case 'bed':case 'window':case 'wardrobe':line=action;break;
 }
 return {state:s,line,effect};
}
export function objective(s){
 if(s.zone==='doors')return 'Выберите одну из двух дверей';
 if(s.doorOpen)return 'Исследуйте коридор. Найдите выход';
 if(!s.opened)return 'Осмотрите коробку на полу';
 if(!s.fuse)return 'Найдите предохранитель в ящике стола';
 if(!s.installed)return 'Вставьте предохранитель в щиток у двери';
 if(!s.power)return 'Поднимите выключатель в щитке';
 return 'Откройте дверь спальни';
}
