export class Sound {
 constructor(){this.ctx=null;this.paused=true;this.settings={master:true,ambience:.35,effects:.5,voice:.8};this.sources=[];}
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
 sync(settings){this.settings=settings;if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(settings.master?1:0,t,.07);for(const name of ['ambience','effects'])this[name].gain.setTargetAtTime(settings[name],t,.07);this.voiceGain.gain.setTargetAtTime(settings.voice,t,.07);}
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
 alarm(){if(!this.ctx||this.paused)return;this.noiseBurst(.7,.17,1200,this.effects);const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.linearRampToValueAtTime(53,t+1.8);g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.0001,t+2);o.connect(g);g.connect(this.effects);o.start();o.stop(t+2);o.onended=()=>{o.disconnect();g.disconnect();};}
 voiceLevel(){if(!this.voiceAnalyser)return 0;this.voiceAnalyser.getByteTimeDomainData(this.voiceSamples);let sum=0;for(const v of this.voiceSamples)sum+=((v-128)/128)**2;return Math.sqrt(sum/this.voiceSamples.length);}
 async loadVoice(url){if(!this.ctx)return null;const response=await fetch(url);if(!response.ok)throw new Error(`Нет аудиофайла: ${url}`);return this.ctx.decodeAudioData(await response.arrayBuffer());}
 playVoice(buffer,emotion,onend){
  if(!this.ctx||!buffer)return null;
  const source=this.ctx.createBufferSource();source.buffer=buffer;
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=emotion==='angry'?2100:emotion==='suspicious'?3500:9000;
  const gain=this.ctx.createGain();gain.gain.value=emotion==='suspicious'?.72:emotion==='angry'?.85:1;
  source.playbackRate.value=emotion==='suspicious'?.94:emotion==='angry'?.9:1;
  source.connect(filter);
  if(emotion==='angry'){
   const distortion=this.ctx.createWaveShaper(),curve=new Float32Array(512);for(let i=0;i<512;i++){const x=i/255.5-1;curve[i]=Math.tanh(x*1.8)/1.8;}distortion.curve=curve;filter.connect(distortion);distortion.connect(gain);
  }else filter.connect(gain);
  gain.connect(this.voiceGain);source.onended=onend;source.start();return source;
 }
}
