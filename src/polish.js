import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';

// Original procedural set dressing. All small static pieces are batched by material.
export function polishWorld(scene,m,shadows){
 const pieces=[];
 const box=(name,x,y,z,w,h,d,mat)=>{const a=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);a.position.set(x,y,z);a.material=mat;a.isPickable=false;pieces.push(a);return a;};
 const sphere=(name,x,y,z,w,h,d,mat)=>{const a=MeshBuilder.CreateSphere(name,{diameter:1,segments:16},scene);a.position.set(x,y,z);a.scaling.set(w,h,d);a.material=mat;a.isPickable=false;pieces.push(a);return a;};
 function fabric(name,paths,mat){const a=MeshBuilder.CreateRibbon(name,{pathArray:paths,sideOrientation:2},scene);a.material=mat;a.isPickable=false;pieces.push(a);return a;}
 // Replace rigid bedding with a tucked mattress, sagging duvet and soft pillows.
 for(const mesh of [...scene.meshes])if(['blanket','blanket-seam','pillow','mattress'].includes(mesh.name))mesh.dispose();
 sphere('rounded-mattress',-2.8,.57,-2.2,2.02,.35,3.05,m.pillow);
 for(const x of [-3.83,-1.77])box('bed-side-rail',x,.34,-2.2,.1,.22,3.15,m.wood);
 for(let i=0;i<9;i++)box('headboard-inset',-3.72+i*.23,.82,-3.7,.17,.72,.025,m.lightWood);
 box('headboard-cap',-2.8,1.32,-3.78,2.26,.09,.22,m.wood);
 for(const x of [-3.3,-2.35]){const p=sphere('soft-pillow',x,.81,-3.2,.92,.23,.62,m.pillow);p.rotation.y=x===-3.3?.09:-.12;}
 const quilt=[];
 for(let j=0;j<=30;j++){const row=[];const z=-2.85+j*2.22/30;for(let i=0;i<=32;i++){const u=i/32;const x=-3.88+u*2.16;const edge=Math.pow(Math.abs(u-.5)*2,10);const y=.82-.32*edge+.025*Math.sin(u*38+j*.17)+.012*Math.sin(j*.8+u*11);row.push(new Vector3(x,y,z));}quilt.push(row);}fabric('folded-duvet',quilt,m.cloth);
 const fold=[];for(let j=0;j<=5;j++){const row=[];for(let i=0;i<=32;i++){const u=i/32;row.push(new Vector3(-3.87+u*2.14,.87-.3*Math.pow(Math.abs(u-.5)*2,10)+Math.sin(j/5*Math.PI)*.045,-2.86+j*.055));}fold.push(row);}fabric('duvet-turned-edge',fold,m.pillow);
 // Wardrobe shaker panels, hinge hardware, desk edging and a recessed drawer front.
 for(const x of [-3.94,-3.16]){
  for(const dx of [-.29,.29])box('cabinet-stile',x+dx,1.22,2.265,.055,2.12,.035,m.lightWood);
  for(const y of [.21,1.16,2.23])box('cabinet-rail',x,y,2.26,.58,.055,.035,m.lightWood);
  for(const y of [.62,1.73])box('cabinet-inset',x,y,2.278,.51,.78,.012,m.wood);
 }
 box('wardrobe-crown',-3.55,2.43,2.9,1.67,.11,1.24,m.lightWood);
 box('wardrobe-plinth',-3.55,.08,2.9,1.64,.15,1.2,m.trim);
 for(const y of [.4,2.03])for(const x of [-4.28,-2.82])box('hinge',x,y,2.25,.025,.1,.035,m.brass);
 box('desk-edge',2.61,.92,1.5,.025,.08,2.05,m.lightWood);
 for(const z of [.55,2.45])box('desk-edge',3.45,.92,z,1.7,.08,.025,m.lightWood);
 box('drawer-recess',2.57,.68,1.5,.012,.24,1.42,m.trim);
 for(const z of [.73,2.27])box('drawer-trim',2.54,.68,z,.018,.29,.035,m.lightWood);
 box('pencil',3.14,1.035,1.02,.018,.018,.35,m.brass).rotation.y=.3;
 const cup=scene.getMeshByName('cup');if(cup)cup.dispose();
 const mug=MeshBuilder.CreateCylinder('ceramic-mug',{diameterTop:.18,diameterBottom:.15,height:.22,tessellation:24},scene);mug.position.set(3.7,1.09,.85);mug.material=m.cream;pieces.push(mug);
 const tea=MeshBuilder.CreateDisc('tea',{radius:.076,tessellation:24},scene);tea.rotation.x=Math.PI/2;tea.position.set(3.7,1.202,.85);tea.material=m.black;pieces.push(tea);
 const mugHandle=MeshBuilder.CreateTorus('mug-handle',{diameter:.14,thickness:.028,tessellation:16},scene);mugHandle.rotation.x=Math.PI/2;mugHandle.position.set(3.81,1.1,.85);mugHandle.material=m.cream;pieces.push(mugHandle);
 // Curtains are folded surfaces, not opaque blocks; window remains visible.
 for(const edge of [-1.42,.92]){const paths=[];for(let j=0;j<=12;j++){const row=[];for(let i=0;i<=18;i++){const u=i/18;row.push(new Vector3(-4.17+Math.sin(u*Math.PI*8)*.065,2.85-j*.16,edge+(edge<0?1:-1)*u*.52));}paths.push(row);}fabric('pleated-curtain',paths,m.curtain);}
 box('curtain-pole',-4.11,2.92,-.25,.04,.04,2.85,m.brass);
 // Box construction: reinforced corners, wrinkles and a worn shipping label.
 for(const x of [-.45,.45])box('cardboard-edge',x,.32,.025,.025,.5,.016,m.lightWood);
 for(let i=0;i<6;i++){const crease=box('box-crease',-.4+i*.15,.12+(i%3)*.12,.026,.12,.005,.004,m.trim);crease.rotation.z=.13*Math.sin(i);}
 box('shipping-label',.15,.36,.022,.3,.17,.008,m.paper);
 for(let i=0;i<16;i++)box('barcode',.026+i*.014,.36,.016,.005+(i%2)*.003,.09,.003,m.black);
 // Ceiling grid, outlets and broken trim communicate scale in the corridor.
 for(let z=5;z<32;z+=1.25)box('ceiling-grid',0,3.185,z,4.8,.018,.025,m.trim);
 for(const x of [-1.2,1.2])box('ceiling-grid-long',x,3.184,18,.025,.018,26,m.trim);
 for(const z of [8,18,23]){
  box('wall-socket',-2.382,.36,z,.025,.16,.12,m.cream);
  for(const dz of [-.025,.025])box('socket-hole',-2.362,.36,z+dz,.008,.035,.009,m.black);
 }
 // Alpha decals generated once: irregular damp blooms and long water streaks.
 const dirt=new StandardMaterial('water-damage',scene);const tex=new DynamicTexture('damp-mask',{width:256,height:512},scene,false);tex.hasAlpha=true;const c=tex.getContext();c.clearRect(0,0,256,512);
 let seed=47;const rand=()=>((seed=1664525*seed+1013904223>>>0)/4294967296);
 for(let i=0;i<130;i++){const x=rand()*256,y=rand()*130,r=8+rand()*45;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(30,25,12,.11)');g.addColorStop(1,'rgba(30,25,12,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 for(let i=0;i<55;i++){const x=rand()*256,y=rand()*90;const g=c.createLinearGradient(x,y,x,480);g.addColorStop(0,'rgba(43,34,13,.22)');g.addColorStop(1,'rgba(43,34,13,0)');c.fillStyle=g;c.fillRect(x,y,1+rand()*5,100+rand()*380);}tex.update();dirt.diffuseTexture=tex;dirt.useAlphaFromDiffuseTexture=true;dirt.specularColor=Color3.Black();dirt.backFaceCulling=false;
 for(const [x,z,w,h] of [[-2.385,9,2.8,2.5],[2.385,18.3,3.5,2.9],[-2.385,22.2,2.3,2.2],[4.385,29,2.8,2.8]]){const a=MeshBuilder.CreatePlane('damp-wall',{width:w,height:h},scene);a.position.set(x,3.15-h/2,z);a.rotation.y=Math.PI/2;a.material=dirt;a.isPickable=false;}
 // A softly feathered pool of moonlight; no extra real-time lamp.
 const moonMat=new StandardMaterial('moon-pool',scene);moonMat.diffuseColor=new Color3(.18,.27,.32);moonMat.emissiveColor=new Color3(.07,.12,.17);moonMat.alpha=.16;moonMat.specularColor=Color3.Black();
 for(let i=0;i<3;i++){const pool=box('window-light-pool',-2.15,.023,-.65+i*.72,3.4,.003,.57,moonMat);pool.rotation.y=-.25;}
 // Batch decorations only; interactable and collidable world meshes remain untouched.
 const groups=new Map();for(const p of pieces){p.isPickable=false;p.receiveShadows=true;const list=groups.get(p.material)||[];list.push(p);groups.set(p.material,list);}
 for(const [mat,list] of groups){const merged=Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.name='detail-batch-'+mat.name;merged.material=mat;merged.isPickable=false;merged.receiveShadows=true;if(mat!==moonMat)shadows.addShadowCaster(merged);}}
}
