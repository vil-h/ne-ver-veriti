import {ChaseScore} from './chase-music.js';
export class ChaseAudio {
 constructor(sound){
  this.sound=sound;this.score=new ChaseScore(sound);this.panner=sound.spatial([80,1.5,0],sound.effects);
  this.step=0;this.nextStep=0;this.nextBreath=1.4;this.lastMode=null;
 }
 update(time,monster,distance){
  const p=monster.position,b=this.panner,c=this.sound.ctx,t=c.currentTime,mode=monster.mode;
  if(b.positionX){b.positionX.value=p.x;b.positionZ.value=-p.z;}else b.setPosition(p.x,1.5,-p.z);
  this.score.update(monster.stage||1,mode,distance);
  if(mode==='search'){this.lastMode=mode;return;}
  if(mode!==this.lastMode&&['return','sprint','lunge'].includes(mode)){
   this.score.note(b,135,38,.47,.36,'sawtooth');this.nextBreath=time+1;
  }
  if(time>=this.nextStep){
   const left=this.step++%2===0;this.score.note(b,left?104:81,32,left?.17:.22,.58,'sine');
   if(this.step%4===2)this.score.note(b,820,190,.13,.27,'triangle',t+.055);
   this.nextStep=time+(monster.burst?.31:.42)+(left?.04:-.025);
  }else if(time>=this.nextBreath){
   this.score.note(b,1150,260,.68,.72,'noise');this.nextBreath=time+(distance<9?1.13:1.8);
  }
  this.lastMode=mode;
 }
 fade(event='pit'){
  if(this.score.closed||this.tail)return;
  const endPitch=event==='caught'?29:49;
  this.score.note(this.score.layers[0],event==='caught'?123:73.4,endPitch,.27,.19,'triangle');
  const c=this.sound.ctx,t=c.currentTime;
  for(const g of this.score.layers)g.gain.setTargetAtTime(.0001,t,.07);
  // An audio-clock tail also pauses with the game and releases itself on retry.
  const tail=c.createBufferSource();tail.buffer=this.sound.noiseBuffer;
  const mute=c.createGain();mute.gain.value=0;tail.connect(mute);mute.connect(this.sound.ambience);
  this.tail=tail;tail.onended=()=>{tail.disconnect();mute.disconnect();this.tail=null;this.stop();};tail.start();tail.stop(t+.36);
 }
 stop(){if(this.tail){const n=this.tail;try{n.stop();}catch{}}
 this.score.stop();this.panner.disconnect();}
}
