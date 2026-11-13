import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Texture} from '@babylonjs/core/Materials/Textures/texture.js';
export function materials(scene){
 let seed=731;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const solid=(name,color,shine=0)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(color);m.specularColor=new Color3(shine,shine,shine);return m;};
 function textured(name,base,type,scale=1){
  const m=solid(name,base,.025),t=new DynamicTexture(name+'-texture',{width:256,height:256},scene,false);const c=t.getContext();
  c.fillStyle=base;c.fillRect(0,0,256,256);
  for(let i=0;i<6000;i++){
   const a=random()*.12;c.fillStyle=random()>.5?`rgba(255,235,192,${a})`:`rgba(8,11,7,${a})`;
   const x=random()*256,y=random()*256;c.fillRect(x,y,type==='wood'?1:random()*3+1,type==='wood'?random()*60+3:random()*3+1);
  }
  if(type==='wall'){
   c.strokeStyle='rgba(51,45,22,.13)';c.lineWidth=1;
   for(let x=16;x<256;x+=32)for(let y=16;y<256;y+=48){c.beginPath();c.moveTo(x,y-10);c.lineTo(x+5,y);c.lineTo(x,y+10);c.lineTo(x-5,y);c.closePath();c.stroke();}
   for(let i=0;i<12;i++){const g=c.createRadialGradient(random()*256,random()*256,1,128,128,190);g.addColorStop(0,'rgba(35,33,18,.035)');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,256,256);}
  }
  if(type==='wood'){c.fillStyle='rgba(0,0,0,.25)';[0,64,128,192].forEach(x=>c.fillRect(x,0,2,256));}
  if(type==='metal'){for(let i=0;i<32;i++){c.fillStyle=`rgba(131,57,22,${random()*.4})`;c.fillRect(random()*256,random()*256,random()*25,random()*40);}}
  if(type==='ceiling'){c.strokeStyle='#56564a';c.strokeRect(0,0,256,256);}
  t.update();t.uScale=scale;t.vScale=scale;t.wrapU=t.wrapV=Texture.WRAP_ADDRESSMODE;m.diffuseTexture=t;return m;
 }
 const result={
  wall:textured('old-sage-wall','#777969','wall',2),hall:textured('yellow-wallpaper','#9d9267','wall',3),
  floor:textured('bedroom-planks','#64513b','wood',5),carpet:textured('dirty-carpet','#60593b','carpet',9),
  wood:textured('walnut','#534034','wood',1),lightWood:textured('boards','#80613c','wood',1),
  metal:textured('rusted-steel','#465351','metal',1),ceiling:textured('acoustic-tiles','#949584','ceiling',8),
  cloth:textured('linen','#52615c','carpet',2),pillow:textured('pillow','#acaa91','carpet',1),
  cardboard:textured('cardboard','#ae804b','carpet',1),trim:solid('trim','#394338'),black:solid('dark','#141c18'),
  brass:solid('brass','#b79959',.35),cream:solid('door-ivory','#d2c29a',.12),paper:solid('paper','#cfc6a8'),
  red:solid('red','#7b2c20'),blue:solid('night-blue','#172c38'),
 };
 result.bulb=solid('lamp','#f7e4ab');result.bulb.emissiveColor=Color3.FromHexString('#d3bf8a');
 result.window=solid('window','#183344',.25);result.window.emissiveColor=Color3.FromHexString('#14232e');
 return result;
}
