// A horizontal capsule footprint against authored furniture and walls.
export function overlaps(x,z,r,b) {
 if(b.disabled)return false;
 const dx=x-Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2));
 const dz=z-Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2));
 return dx*dx+dz*dz<r*r;
}
export function movePlayer(position,dx,dz,obstacles,radius=.24) {
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.075));
 let {x,z}=position;
 for(let i=0;i<n;i++){
  const nx=x+dx/n;if(!obstacles.some(b=>overlaps(nx,z,radius,b)))x=nx;
  const nz=z+dz/n;if(!obstacles.some(b=>overlaps(x,nz,radius,b)))z=nz;
 }
 return {x,z};
}
