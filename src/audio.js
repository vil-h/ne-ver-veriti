export class Sound {
 constructor(){this.ctx=null;this.paused=true;this.settings={master:true,ambience:.35,effects:.5,voice:.8};this.sources=[];}
 async start(){
  try{
   if(!this.ctx){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);
    this.ambience=this.ctx.createGain();this.ambience.connect(this.master);
    this.effects=this.ctx.createGain();this.effects.connect(this.master);
    this.voiceGain=this.ctx.createGain();this.voiceGain.connect(this.master);
    for(const [hz,gain] of [[55,.065],[110,.012],[73.4,.009]]){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=hz;g.gain.value=gain;o.connect(g);g.connect(this.ambience);o.start();}
    const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*3,this.ctx.sampleRate),data=buffer.getChannelData(0);let v=0;
    for(let i=0;i<data.length;i++){v=(v+(Math.random()*2-1)*.025)*.985;data[i]=v;}
    const noise=this.ctx.createBufferSource(),g=this.ctx.createGain();noise.buffer=buffer;noise.loop=true;g.gain.value=.15;noise.connect(g);g.connect(this.ambience);noise.start();
   }
   this.paused=false;this.sync(this.settings);await this.ctx.resume();
  }catch{/* Unsupported audio must not prevent play. */}
 }
 sync(settings){this.settings=settings;if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(settings.master?1:0,t,.07);for(const name of ['ambience','effects'])this[name].gain.setTargetAtTime(settings[name],t,.07);this.voiceGain.gain.setTargetAtTime(settings.voice,t,.07);}
 pause(value){this.paused=value;if(this.ctx){if(value)this.ctx.suspend().catch(()=>{});else this.ctx.resume().catch(()=>{});}}
 effect(kind){
  if(!this.ctx||this.paused)return;const t=this.ctx.currentTime,o=this.ctx.createOscillator(),g=this.ctx.createGain();
  const step=kind==='step';o.type=step?'triangle':kind==='door'?'sawtooth':'sine';
  o.frequency.setValueAtTime(step?75:kind==='door'?93:kind==='power'?250:170,t);o.frequency.exponentialRampToValueAtTime(step?34:45,t+(step?.12:.7));
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(step?.025:.055,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+(step?.16:.8));
  o.connect(g);g.connect(this.effects);o.start();o.stop(t+(step?.18:.85));
 }
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
