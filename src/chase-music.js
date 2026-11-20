// Schmitt thresholds keep the danger motif from chattering at the edge of range.
export function mixFor(stage,mode,distance,critical=false){
 const danger=distance<(critical?7.4:5.6);
 const hidden=mode==='search';
 return {critical:danger,tension:hidden?.24:.88,pursuit:hidden?.035:Math.min(1,.29+Math.max(0,19-distance)/20+(stage===4?.24:0)),danger:hidden?0:danger?.93:.025};
}
export class ChaseScore {
 constructor(sound){
  this.sound=sound;this.ctx=sound.ctx;this.live=new Set();this.beat=0;this.next=this.ctx.currentTime;this.mode=null;this.critical=false;this.closed=false;
  this.layers=Array.from({length:3},()=>{const g=this.ctx.createGain();g.gain.value=0;g.connect(sound.ambience);return g;});
 }
 // A shared owner also accounts for short sounds on the monster's spatial bus.
 note(bus,hz,endHz,length,level,type='triangle',when=this.ctx.currentTime){
  if(this.closed)return;
  const c=this.ctx,noise=type==='noise',source=noise?c.createBufferSource():c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
  filter.type='lowpass';filter.frequency.value=noise?hz:1800;
  if(noise){source.buffer=this.sound.noiseBuffer;source.loop=true;filter.frequency.setValueAtTime(hz,when);filter.frequency.exponentialRampToValueAtTime(endHz,when+length);}
  else{source.type=type;source.frequency.setValueAtTime(hz,when);source.frequency.exponentialRampToValueAtTime(endHz,when+length);}
  gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(level,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+length);
  source.connect(filter);filter.connect(gain);gain.connect(bus);
  const release=()=>{source.disconnect();filter.disconnect();gain.disconnect();this.live.delete(source);};
  source.onended=release;this.live.add(source);source.start(when);source.stop(when+length+.01);
 }
 update(stage,mode,distance){
  const c=this.ctx,t=c.currentTime,m=mixFor(stage,mode,distance,this.critical);
  [m.tension,m.pursuit,m.danger].forEach((v,i)=>this.layers[i].gain.setTargetAtTime(v,t,.28));
  if(!this.mode||mode==='return'&&this.mode!=='return'||mode==='sprint'&&this.mode!=='sprint'){
   const pitch=!this.mode?98:mode==='return'?146:117;
   this.note(this.layers[0],pitch,35,.65,.17,'sawtooth');
  }
  if(m.critical&&!this.critical)this.note(this.layers[2],270,90,.24,.16);
  this.mode=mode;this.critical=m.critical;this.mix=m;
  if(this.next<t-.12)this.next=t;
  while(this.next<t+.075){
   const b=this.beat++%32,n=this.next;
   if(b%4===0)this.note(this.layers[0],[49,49,46.25,55][Math.floor(b/8)],36,.52,.14,'sine',n);
   if([0,3,6].includes(b%8))this.note(this.layers[1],b%8===3?98:73.4,41,.21,.12,'triangle',n);
   if(b%4===2)this.note(this.layers[1],1900,320,.13,.32,'noise',n);
   if([1,4,7].includes(b%8))this.note(this.layers[2],b%8===4?2200:600,115,.105,.46,'noise',n);
   if(b%8===0)this.note(this.layers[2],131,65,.18,.11,'sawtooth',n);
   this.next+=stage===4?.145:.168;
  }
 }
 stop(){if(this.closed)return;this.closed=true;for(const n of [...this.live]){try{n.stop();}catch{}n.onended?.();n.onended=null;}for(const g of this.layers)g.disconnect();}
}
