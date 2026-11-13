export class Input {
 constructor(canvas,onInteract,onPause,sensitivity){
  this.canvas=canvas;this.active=false;this.keys=new Set();this.dx=0;this.dy=0;this.stick={x:0,y:0};this.sensitivity=sensitivity;this.drag=null;this.joyId=null;this.lockRequested=false;
  this.handlers=[];const listen=(el,type,fn,opts)=>{el.addEventListener(type,fn,opts);this.handlers.push(()=>el.removeEventListener(type,fn,opts));};
  listen(document,'keydown',e=>{if(!this.active)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyE','Escape','Space'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)onInteract();if(e.code==='Escape')onPause();});
  listen(document,'keyup',e=>this.keys.delete(e.code));
  listen(window,'blur',()=>{this.clear();if(this.active)onPause();});
  listen(document,'pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&this.lockRequested&&this.active){this.lockRequested=false;onPause();}});
  listen(document,'mousemove',e=>{if(this.active&&document.pointerLockElement===canvas){this.dx+=e.movementX;this.dy+=e.movementY;}});
  listen(canvas,'pointerdown',e=>{
   if(!this.active)return;
   if(e.pointerType==='mouse'&&document.pointerLockElement!==canvas&&canvas.requestPointerLock){this.lockRequested=true;try{const result=canvas.requestPointerLock();result?.catch(()=>{this.lockRequested=false;});}catch{this.lockRequested=false;}}
   this.drag={id:e.pointerId,x:e.clientX,y:e.clientY};try{if(document.pointerLockElement!==canvas)canvas.setPointerCapture(e.pointerId);}catch{}
  });
  listen(canvas,'pointermove',e=>{if(this.active&&this.drag?.id===e.pointerId&&document.pointerLockElement!==canvas){this.dx+=(e.clientX-this.drag.x)*(e.pointerType==='touch'?1.7:1);this.dy+=(e.clientY-this.drag.y)*(e.pointerType==='touch'?1.7:1);this.drag.x=e.clientX;this.drag.y=e.clientY;}});
  const release=e=>{if(this.drag?.id===e.pointerId)this.drag=null;};listen(canvas,'pointerup',release);listen(canvas,'pointercancel',release);
 }
 bindJoystick(el,knob){
  this.joystick=el;this.knob=knob;
  const set=e=>{const r=el.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const max=r.width*.32,len=Math.hypot(x,y);if(len>max){x*=max/len;y*=max/len;}this.stick={x:x/max,y:y/max};knob.style.transform=`translate(${x}px,${y}px)`;};
  el.addEventListener('pointerdown',e=>{if(!this.active)return;e.preventDefault();this.joyId=e.pointerId;try{el.setPointerCapture(e.pointerId);}catch{}set(e);});
  el.addEventListener('pointermove',e=>{if(this.active&&e.pointerId===this.joyId)set(e);});
  const release=()=>{this.joyId=null;this.stick={x:0,y:0};knob.style.transform='';};el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
 }
 clear(){this.keys.clear();this.dx=this.dy=0;this.drag=null;this.joyId=null;this.stick={x:0,y:0};if(this.knob)this.knob.style.transform='';}
 setActive(value){this.active=value;if(!value){this.clear();this.lockRequested=false;if(document.pointerLockElement===this.canvas)document.exitPointerLock();}}
 sample(dt){
  if(!this.active)return {forward:0,side:0,yaw:0,pitch:0};
  const k=this.keys;let forward=(k.has('KeyW')?1:0)-(k.has('KeyS')?1:0)-this.stick.y,side=(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0)+this.stick.x;const length=Math.hypot(forward,side);if(length>1){forward/=length;side/=length;}
  const yaw=this.dx*.0021*this.sensitivity()+(Number(k.has('ArrowRight'))-Number(k.has('ArrowLeft')))*dt*1.35;
  const pitch=this.dy*.0021*this.sensitivity()+(Number(k.has('ArrowDown'))-Number(k.has('ArrowUp')))*dt;
  this.dx=this.dy=0;return {forward,side,yaw,pitch};
 }
 dispose(){this.handlers.forEach(fn=>fn());this.clear();}
}
