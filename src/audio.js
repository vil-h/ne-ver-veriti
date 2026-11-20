import {ChaseAudio} from './chase-audio.js';
export class Sound {
 constructor(){this.ctx=null;this.paused=true;this.settings={master:true,ambience:.35,effects:.5,voice:.8};this.sources=[];this.cues=new Map();this.cueToken=0;}
 async start(){
  try{
   if(!this.ctx){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
    this.ambience=this.ctx.createGain();this.ambience.connect(this.master);
    this.effects=this.ctx.createGain();this.effects.connect(this.master);
    this.voiceGain=this.ctx.createGain();this.voiceAnalyser=this.ctx.createAnalyser();this.voiceAnalyser.fftSize=256;this.voiceSamples=new Uint8Array(256);this.voiceGain.connect(this.voiceAnalyser);this.voiceAnalyser.connect(this.master);
    for(const [hz,gain] of [[55,.065],[110,.012],[73.4,.009]]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=hz;g.gain.value=gain;o.connect(g);g.connect(this.ambience);o.start();}
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),data=buffer.getChannelData(0);let v=0;
    for(let i=0;i<data.length;i++){v=(v+(Math.random()*2-1)*.025)*.985;data[i]=v;}
    this.noiseBuffer=buffer;
    const noise=this.ctx.createBufferSource(),g=this.ctx.createGain();noise.buffer=buffer;noise.loop=true;g.gain.value=.15;noise.connect(g);g.connect(this.spatial([0,2.7,14],this.ambience));noise.start();
   }
   this.paused=false;this.sync(this.settings);await this.ctx.resume();
  }catch{/* Unsupported audio must not prevent play. */}
 }
 sync(settings){this.settings=settings;if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(settings.master?1:0,t,.07);for(const name of ['ambience','effects'])this[name].gain.setTargetAtTime(settings[name]*(this.hushed?.08:1)*(name==='ambience'?(this.ambienceLevel??1):1),t,.07);this.voiceGain.gain.setTargetAtTime(settings.voice,t,.07);}
 setAmbienceLevel(value){this.ambienceLevel=value;this.sync(this.settings);}
 quietTone(position,level=.025){if(!this.ctx||this.paused)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),bus=this.spatial(position,this.effects),t=this.ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(1100,t);o.frequency.exponentialRampToValueAtTime(540,t+.12);g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(g);g.connect(bus);o.start();o.stop(t+.22);o.onended=()=>{o.disconnect();g.disconnect();bus.disconnect();};}
 hush(value){this.hushed=value;this.sync(this.settings);}
 async preloadCues(){for(const name of ['transform','attack']){try{this.cues.set(name,await this.loadVoice((import.meta.env?.BASE_URL||'./')+'audio/effects/'+name+'.mp3'));}catch{}}}
 playCue(name){if(!this.ctx||this.paused)return;const buffer=this.cues.get(name);if(!buffer){this.alarm();return;}const source=this.ctx.createBufferSource();source.buffer=buffer;const gain=this.ctx.createGain();gain.gain.value=.65;source.connect(gain);gain.connect(this.effects);this.sources.push(source);source.onended=()=>{source.disconnect();gain.disconnect();this.sources=this.sources.filter(s=>s!==source);};source.start();}
 stopCues(){for(const s of this.sources){try{s.stop();}catch{}}this.sources=[];}
 pause(value){this.paused=value;if(this.ctx){if(value)this.ctx.suspend().catch(()=>{});else this.ctx.resume().catch(()=>{});}}
 setListener(position,yaw){
  if(!this.ctx)return;const l=this.ctx.listener;
  if(l.positionX){for(const [key,value] of Object.entries({positionX:position.x,positionY:position.y,positionZ:position.z,forwardX:Math.sin(yaw),forwardY:0,forwardZ:Math.cos(yaw),upX:0,upY:1,upZ:0}))l[key].value=value;}
  else{l.setPosition(position.x,position.y,position.z);l.setOrientation(Math.sin(yaw),0,Math.cos(yaw),0,1,0);}
 }
 spatial(position,bus){
  const p=this.ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=2;p.maxDistance=35;p.rolloffFactor=1.3;
  p.positionX.value=position[0];p.positionY.value=position[1];p.positionZ.value=position[2];p.connect(bus);return p;
 }
 noiseBurst(duration,level,cutoff,bus,delay=0){
  const ctx=this.ctx,t=ctx.currentTime+delay,source=ctx.createBufferSource(),g=ctx.createGain(),filter=ctx.createBiquadFilter();
  source.buffer=this.noiseBuffer;source.playbackRate.value=.8+Math.random()*.4;filter.type='lowpass';filter.frequency.value=cutoff;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(level,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter);filter.connect(g);g.connect(bus);source.start(t,Math.random());source.stop(t+duration+.02);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};
 }
 effect(kind,surface='wood'){
  if(!this.ctx||this.paused)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
  const step=kind==='step',duration=step?.16:kind==='door'?.65:.28;
  o.type=kind==='door'?'triangle':'sine';const pitch=step?(surface==='carpet'?65:105):kind==='power'?180:kind==='box'?85:150;
  o.frequency.setValueAtTime(pitch*(.94+Math.random()*.12),t);o.frequency.exponentialRampToValueAtTime(34,t+duration);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(step?.033:.045,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(this.effects);o.start();o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  this.noiseBurst(step?.16:kind==='box'?.7:.25,step?(surface==='carpet'?.018:.037):.055,step?(surface==='carpet'?700:1800):2500,this.effects);
 }
 ambientEvent(kind,position){
  if(!this.ctx||this.paused)return;const bus=this.spatial(position,this.ambience);
  if(kind==='knock'){for(let i=0;i<3;i++)this.noiseBurst(.13,.42,320,bus,i*.24);}
  else this.noiseBurst(kind==='pipe'?1.8:1.1,.14,kind==='pipe'?620:2100,bus);
  const cleanup=this.ctx.createBufferSource();cleanup.buffer=this.noiseBuffer;const silent=this.ctx.createGain();silent.gain.value=0;cleanup.connect(silent);silent.connect(this.master);cleanup.start();cleanup.stop(this.ctx.currentTime+2.2);cleanup.onended=()=>{bus.disconnect();cleanup.disconnect();silent.disconnect();};
 }
 outsideWorld(position){
  const c=this.ctx;if(!c||this.paused)return;
  const bus=this.spatial(position,this.effects);
  this.noiseBurst(1.15,.1,750,bus);
  for(const [delay,hz] of [[0,1430],[.21,1780]]){
   const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();
   o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*1.4,t+.11);
   g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.09,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
   o.connect(g);g.connect(bus);o.start(t);o.stop(t+.16);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  const timer=c.createOscillator(),mute=c.createGain();mute.gain.value=0;timer.connect(mute);mute.connect(bus);timer.start();timer.stop(c.currentTime+1.25);
  timer.onended=()=>{timer.disconnect();mute.disconnect();bus.disconnect();};
 }
 wakeAlarm(){
  if(!this.ctx||this.paused)return;
  const c=this.ctx,base=c.currentTime;
  for(let i=0;i<3;i++){
   const o=c.createOscillator(),g=c.createGain(),t=base+i*.24;
   o.type='triangle';o.frequency.value=i===1?880:740;
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.052,t+.012);
   g.gain.exponentialRampToValueAtTime(.0001,t+.16);
   o.connect(g);g.connect(this.effects);o.start(t);o.stop(t+.18);
   o.onended=()=>{o.disconnect();g.disconnect();};
  }
 }
 alarm(){if(!this.ctx||this.paused)return;this.noiseBurst(.7,.17,1200,this.effects);const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.linearRampToValueAtTime(53,t+1.8);g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.0001,t+2);o.connect(g);g.connect(this.effects);o.start();o.stop(t+2);o.onended=()=>{o.disconnect();g.disconnect();};}
 startChase(){this.stopChase();if(this.ctx){this.chaseAudio=new ChaseAudio(this);this.alarm();}}
 stopChase(){this.stopCues();this.chaseAudio?.stop();this.chaseAudio=null;}
 updateChase(time,p,d){this.chaseAudio?.update(time,p,d);}
 fall(){if(this.ctx&&!this.paused)this.noiseBurst(2.3,.25,1600,this.effects);}
 voiceLevel(){if(!this.voiceAnalyser)return 0;this.voiceAnalyser.getByteTimeDomainData(this.voiceSamples);let sum=0;for(const v of this.voiceSamples)sum+=((v-128)/128)**2;return Math.sqrt(sum/this.voiceSamples.length);}
 async loadVoice(url){if(!this.ctx)return null;const response=await fetch(url);if(!response.ok)throw new Error(`Нет аудиофайла: ${url}`);return this.ctx.decodeAudioData(await response.arrayBuffer());}
 playVoice(buffer,emotion,onend,position=null){
  if(!this.ctx||!buffer)return null;
  const source=this.ctx.createBufferSource();source.buffer=buffer;
  const bus=position?this.spatial(position,this.voiceGain):this.voiceGain;source.connect(bus);source.onended=()=>{source.disconnect();if(position)bus.disconnect();onend?.();};source.start();return source;
 }
}
