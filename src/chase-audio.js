// Synthesized breathing and a pulsing drone; no voice recording is implied.
export class ChaseAudio {
 constructor(sound){
  this.sound=sound;this.nodes=[];const c=sound.ctx;if(!c)return;
  this.panner=sound.spatial([80,1.6,0],sound.effects);this.nodes.push(this.panner);
  this.breath=c.createBufferSource();this.breath.buffer=sound.noiseBuffer;this.breath.loop=true;this.breath.playbackRate.value=.65;
  this.filter=c.createBiquadFilter();this.filter.type='bandpass';this.filter.frequency.value=430;this.filter.Q.value=2;
  this.gain=c.createGain();this.gain.gain.value=0;this.breath.connect(this.filter);this.filter.connect(this.gain);this.gain.connect(this.panner);this.breath.start();this.nodes.push(this.breath,this.filter,this.gain);
  this.drone=c.createOscillator();this.drone.type='triangle';this.drone.frequency.value=43;this.pulse=c.createGain();this.pulse.gain.value=0;this.drone.connect(this.pulse);this.pulse.connect(sound.ambience);this.drone.start();this.nodes.push(this.drone,this.pulse);
 }
 update(time,monster,distance){
  if(!this.panner)return;const c=this.sound.ctx,t=c.currentTime,near=Math.max(0,1-distance/24);
  this.panner.positionX.value=monster.x;this.panner.positionZ.value=monster.z;
  this.gain.gain.setTargetAtTime(.16+(.5+.5*Math.sin(time*3.5))*.6,t,.05);
  this.pulse.gain.setTargetAtTime((.015+near*.09)*(.45+.55*Math.max(0,Math.sin(time*(5+near*5)))),t,.04);
  this.filter.frequency.setTargetAtTime(380+near*500,t,.1);
 }
 stop(){for(const n of [this.breath,this.drone]){try{n?.stop();}catch{}}for(const n of this.nodes)n.disconnect();this.nodes=[];}
}
