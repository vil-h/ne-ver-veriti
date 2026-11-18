// One readable route, with no forks. Cells also define the physical corridor shell.
export const CELL=4;
export const route=[{x:80,z:0},{x:80,z:48},{x:112,z:48},{x:112,z:100},{x:80,z:100},{x:80,z:152}];
export const spawn={x:80,z:8},monsterSpawn={x:80,z:0};
export const pit={x:80,z:154,width:4,depth:10};
export const RUN_SPEED=4.8,WALK_SPEED=2.3;
export const cells=new Map();
for(let i=1;i<route.length;i++){
 const a=route[i-1],b=route[i],n=(Math.abs(b.x-a.x)+Math.abs(b.z-a.z))/CELL;
 for(let j=0;j<=n;j++){const p={x:a.x+(b.x-a.x)*j/n,z:a.z+(b.z-a.z)*j/n};cells.set(`${p.x},${p.z}`,p);}
}
export const walls=[];
for(const p of cells.values())for(const [dx,dz] of [[4,0],[-4,0],[0,4],[0,-4]]){
 if(cells.has(`${p.x+dx},${p.z+dz}`))continue;
 if(p.x===80&&p.z===152&&dz===4)continue;
 walls.push({name:'chase-wall',x:p.x+dx/2,z:p.z+dz/2,w:dx?.18:4.18,d:dz?.18:4.18});
}
export const crates=[{name:'service-cabinet',x:81.35,z:24,w:.9,d:2.5},{name:'fallen-duct',x:94,z:46.65,w:2.4,d:.9},{name:'service-cabinet',x:110.65,z:76,w:.9,d:2.5},{name:'fallen-duct',x:96,z:101.35,w:2.4,d:.9},{name:'service-cabinet',x:81.35,z:128,w:.9,d:2.5}];
export const edge={name:'pit-edge',x:80,z:154,w:4.2,d:.1};
export const obstacles=[...walls,...crates,edge];
export function atPit(p){return Math.abs(p.x-pit.x)<1.65&&p.z>=151.2&&p.z<154.2;}
export function inCorridor(p){return [...cells.values()].some(c=>Math.abs(c.x-p.x)<=2&&Math.abs(c.z-p.z)<=2);}
