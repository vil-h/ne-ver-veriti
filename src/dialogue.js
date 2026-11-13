import {lines} from './story.js';
export class Dialogue {
 constructor(sound,verity,show){this.sound=sound;this.verity=verity;this.show=show;this.manifest={};this.bufferCache=new Map();this.token=0;this.remaining=0;this.source=null;this.current=null;}
 async init(){try{const r=await fetch(`${(import.meta.env?.BASE_URL||'./')}audio/voice/manifest.json`);if(r.ok)this.manifest=await r.json();}catch{}}
 async say(id){
  const data=typeof id==='string'?lines[id]:id;if(!data)return;
  const token=++this.token;if(this.source){this.source.onended=null;this.source.stop();this.source=null;}
  this.verity.setTalking(false);this.verity.setEmotion(data.emotion);this.current=data;
  this.remaining=Math.max(5,data.text.length/12);this.show(data,false);
  // Only files explicitly installed in the manifest are requested. Missing recordings are disclosed.
  const file=data.voice&&this.manifest.files?.[data.voice];if(!file)return;
  try{
   const url=(import.meta.env?.BASE_URL||'./')+file;
   let buffer=this.bufferCache.get(url);if(!buffer){buffer=await this.sound.loadVoice(url);if(buffer)this.bufferCache.set(url,buffer);}
   if(token!==this.token||!buffer)return;
   this.remaining=Infinity;this.show(data,true);this.verity.setTalking(true);
   this.source=this.sound.playVoice(buffer,data.emotion,()=>{if(token===this.token){this.verity.setTalking(false);this.remaining=1;this.source=null;}});
  }catch{if(token===this.token)this.show(data,false);}
 }
 tick(dt){if(!this.current)return;this.remaining-=dt;if(this.remaining<=0){this.current=null;this.show(null,false);this.verity.setTalking(false);}}
 stop(){++this.token;if(this.source){this.source.onended=null;this.source.stop();this.source=null;}this.current=null;this.verity.setTalking(false);this.show(null,false);}
}
