import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export function monsterPose(t,amount,gait=0,attack=0){
 const grow=clamp(amount),stride=Math.sin(t*8.2)*gait;
 return {grow,spine:-.12-.1*gait,head:(1-grow)*1.2+Math.sin(t*1.7)*.035-attack*.4,
  leftLeg:stride*.48,rightLeg:-stride*.48,leftArm:-stride*.65-.15+attack*1.6,rightArm:stride*.55+.12+attack*1.6};
}
// An articulated hierarchy: pelvis → spine → shoulders/head, hips → knees,
// shoulders → elbows → wrists → two phalanges per finger. No imported models.
export function createMonster(scene,parent){
 const root=new TransformNode('verity-humanoid',scene);root.parent=parent;
 const joints={};
 function joint(name,p,x,y,z){const n=new TransformNode(name,scene);n.parent=p;n.position.set(x,y,z);joints[name]=n;return n;}
 function mat(name,color,glow=0){const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.emissiveColor=m.diffuseColor.scale(glow);m.specularColor.set(.035,.025,.012);m.specularPower=16;return m;}
 const skin=mat('withered-amber','#98672d',.03),bone=mat('raised-golden-tendons','#b7853c'),black=mat('deep-eye-and-mouth','#080706'),ivory=mat('crooked-enamel','#c9b68b'),pupil=mat('pinpoint-eyes','#ffe0a0',.8);
 function oval(name,p,x,y,z,sx,sy,sz,m=skin){const a=MeshBuilder.CreateSphere(name,{diameter:1,segments:16},scene);a.parent=p;a.position.set(x,y,z);a.scaling.set(sx,sy,sz);a.material=m;a.isPickable=false;return a;}
 function limb(name,p,length,top,bottom){
  const path=Array.from({length:9},(_,i)=>new Vector3(Math.sin(i/8*Math.PI)*top*.13,-length*i/8,Math.sin(i/8*Math.PI)*top*.2));
  const a=MeshBuilder.CreateTube(name,{path,radiusFunction:i=>(top+(bottom-top)*i/8)*.5*(1+.12*Math.sin(i*1.7)),tessellation:10,cap:3},scene);a.parent=p;a.material=skin;a.isPickable=false;oval(name+'-knuckle',p,0,0,0,top*1.04,top*1.22,top*.94,skin);return a;
 }

 const pelvis=joint('pelvis',root,0,-.03,0),spine=joint('spine',pelvis,0,.05,0);
 oval('gaunt-torso',spine,0,.34,0,.39,.95,.24);oval('pelvis-bone',pelvis,0,-.08,0,.32,.29,.22);
 for(let i=0;i<5;i++)for(const side of [-1,1]){const rib=oval('rib',spine,side*.11,.23+i*.105,-.11,.2,.023,.025,bone);rib.rotation.z=side*-.18;}
 const neck=joint('neck',spine,0,.84,-.03);limb('neck-tendon',neck,.23,.13,.1);
 const head=joint('head',neck,0,.13,-.035);oval('elongated-skull',head,0,0,0,.55,.64,.38);
 oval('unnatural-grin',head,0,-.115,-.176,.48,.24,.09,black);
 for(const side of [-1,1]){const eye=oval('empty-eye',head,side*.135,.12,-.176,.16,.10,.065,black);eye.rotation.z=side*-.38;oval('eye-pin',head,side*.135,.12,-.212,.018,.021,.02,pupil);}
 for(const side of [-1,1]){
  const brow=oval('brow-ridge',head,side*.13,.16,-.17,.18,.035,.05,bone);brow.rotation.z=side*.32;
  for(let i=0;i<3;i++){const crease=oval('cheek-fold',head,side*(.2+i*.012),-.035-i*.035,-.15,.027,.11,.023,bone);crease.rotation.z=side*.3;}
 }
 // Vertex pigmentation avoids downloads and gives matte, mottled skin.
 for(const mesh of root.getChildMeshes()){if(mesh.material!==skin&&mesh.material!==bone)continue;const positions=mesh.getVerticesData('position'),colors=[];for(let i=0;i<positions.length;i+=3){const x=positions[i],y=positions[i+1],z=positions[i+2];const n=Math.sin(x*63+y*37+z*51)*Math.sin(y*19-z*43);const v=.75+.2*n;colors.push(v,v*.95,v*.83,1);}mesh.setVerticesData('color',colors);}
 const jaw=joint('jaw' ,head,0,-.15,-.16);
 for(let i=0;i<11;i++)for(const side of [-1,1]){const x=(i-5)*.037,y=side*(.065-.025*Math.abs(x)/.185);const tooth=MeshBuilder.CreateCylinder('needle-tooth',{height:.07+(i%3)*.008,diameterTop:0,diameterBottom:.027,tessellation:5},scene);tooth.parent=side<0?jaw:head;tooth.position.set(x,side<0?-.012:y-.115,side<0?-.044:-.218);tooth.rotation.z=side>0?Math.PI:0;tooth.material=ivory;tooth.isPickable=false;}
 for(const side of [-1,1]){
  const prefix=side<0?'left':'right',hip=joint(prefix+'Hip',pelvis,side*.12,-.12,0);limb(prefix+'Thigh',hip,.72,.13,.075);
  const knee=joint(prefix+'Knee',hip,0,-.72,0);limb(prefix+'Shin',knee,.74,.095,.045);oval('long-foot',knee,0,-.74,-.07,.12,.08,.32);
  const shoulder=joint(prefix+'Shoulder',spine,side*.255,.66,0);limb(prefix+'UpperArm',shoulder,.71,.115,.06);
  const elbow=joint(prefix+'Elbow',shoulder,0,-.71,0);limb(prefix+'Forearm',elbow,.78,.08,.035);
  const wrist=joint(prefix+'Wrist',elbow,0,-.78,0);oval('palm',wrist,0,-.07,0,.13,.2,.07);
  for(let i=0;i<5;i++){const finger=joint(prefix+'Finger'+i,wrist,(i-2)*.034,-.13,0);finger.rotation.z=(i-2)*.13;const len=.19+(2-Math.abs(i-2))*.03;limb('finger-bone',finger,len,.027,.017);const tip=joint(prefix+'Tip'+i,finger,0,-len,0);limb('finger-tip',tip,.15,.02,.006);tip.rotation.x=-.35;}
 }
 for(const mesh of root.getChildMeshes()){if(mesh.material!==skin||mesh.isVerticesDataPresent('color'))continue;const positions=mesh.getVerticesData('position'),colors=[];for(let i=0;i<positions.length;i+=3){const n=Math.sin(positions[i]*71+positions[i+1]*43+positions[i+2]*37);const v=.78+.16*n;colors.push(v,v*.96,v*.85,1);}mesh.setVerticesData('color',colors);}
 function pose(t,amount,gait=0,attack=0){const p=monsterPose(t,amount,gait,attack);root.setEnabled(p.grow>.001);root.scaling.set(.18+.82*p.grow,.025+.975*p.grow,.18+.82*p.grow);root.position.y=(1-p.grow)*.06;spine.rotation.x=p.spine;head.rotation.x=p.head;head.rotation.z=Math.sin(t*2.1)*.07;pelvis.position.y=-.03+Math.abs(Math.sin(t*8.2))*.055*gait;
  for(const side of ['left','right']){const phase=side==='left'?0:Math.PI;joints[side+'Hip'].rotation.x=p[side+'Leg'];joints[side+'Knee'].rotation.x=-.08-Math.max(0,Math.sin(t*8.2+phase))*.65*gait;joints[side+'Shoulder'].rotation.x=p[side+'Arm'];joints[side+'Shoulder'].rotation.z=(side==='left'?1:-1)*(.25+.14*attack);joints[side+'Elbow'].rotation.x=-.1-.35*gait+attack*.3;joints[side+'Wrist'].rotation.x=-.2-attack*.7;}
  jaw.rotation.x=attack*.65;
 }
 pose(0,0);return {root,joints,head,pose};
}
