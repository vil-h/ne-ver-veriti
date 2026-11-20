import {routeDistance,huntStage,pursuitMode,pursuitSpeed} from './hunt.js';
import {inCorridor,obstacles,monsterSpawn} from './chase-layout.js';
import {overlaps,movePlayer} from './physics.js';
const radius=.82,key=(x,z)=>`${x},${z}`;
// A clearance-tested navigation grid. Replanning never teleports the monster.
const nodes=new Map();
for(let x=78;x<=114;x++)for(let z=-1;z<=153;z++)if(inCorridor({x,z})&&!obstacles.some(b=>overlaps(x,z,radius+.04,b)))nodes.set(key(x,z),{x,z});
function nearest(p){let best=null,d=Infinity;for(const n of nodes.values()){const v=(p.x-n.x)**2+(p.z-n.z)**2;if(v<d){best=n;d=v;}}return best;}
export function findPath(from,to){
 const a=nearest(from),b=nearest(to),start=key(a.x,a.z),goal=key(b.x,b.z),open=[start],came=new Map(),cost=new Map([[start,0]]);
 while(open.length){open.sort((u,v)=>score(u)-score(v));const id=open.shift();if(id===goal){const path=[];let k=id;while(k!==start){path.unshift(nodes.get(k));k=came.get(k);}return path;}
  const p=nodes.get(id);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(p.x+dx,p.z+dz);if(!nodes.has(k)||obstacles.some(o=>overlaps(p.x+dx,p.z+dz,radius+.04,o)))continue;const g=cost.get(id)+1;if(g<(cost.get(k)??Infinity)){came.set(k,id);cost.set(k,g);if(!open.includes(k))open.push(k);}}
 }
 return [];
 function score(id){const p=nodes.get(id);return cost.get(id)+Math.abs(p.x-b.x)+Math.abs(p.z-b.z);}
}
export function createPursuer(){return {position:{...monsterSpawn},path:[],replan:0,age:0};}
export function advancePursuer(monster,player,dt){
 monster.age+=dt;monster.replan-=dt;
 const progress=Math.max(monster.progress||0,routeDistance(player));
 monster.progress=progress;monster.stage=huntStage(progress);
 const gap=Math.max(0,routeDistance(player)-routeDistance(monster.position));
 monster.mode=pursuitMode(monster.stage,progress,gap,monster.age);
 monster.burst=['lunge','return','sprint','close'].includes(monster.mode);
 if(monster.replan<=0){monster.path=findPath(monster.position,player);monster.replan=.36;}
 let budget=pursuitSpeed(monster.mode,gap)*dt;
 if(monster.age<3)budget=Math.min(budget,Math.max(0,Math.hypot(player.x-monster.position.x,player.z-monster.position.z)-.88));
 while(budget>0){
  const target=monster.path[0]||player,dx=target.x-monster.position.x,dz=target.z-monster.position.z,d=Math.hypot(dx,dz);
  if(d<.035){if(monster.path.length){monster.path.shift();continue;}break;}
  const step=Math.min(budget,d),p=movePlayer(monster.position,dx/d*step,dz/d*step,obstacles,radius);
  const moved=Math.hypot(p.x-monster.position.x,p.z-monster.position.z);monster.position=p;budget-=step;
  if(moved<step*.2){monster.replan=0;break;}
 }
 return monster.position;
}
