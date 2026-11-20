import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {hallInitial, inspectHall, crossThreshold} from './exit-hall-state.js';
import {advanceEnding, endingTitles} from './exit-hall-endings.js';
import {HallMusic} from './exit-hall-music.js';

export class ExitHall {
  constructor(world,sound,dialogue,phone) {
    Object.assign(this,{world,sound,dialogue,phone});this.reset();
  }
  reset() {
    this.music?.stop();this.music=null;this.phone.hidden=true;
    this.state=hallInitial();this.age=0;this.time=0;this.queue=[];
    this.hints=0;this.started=false;this.captureAt=0;
  }
  enter() {
    this.reset();this.started=true;this.world.enterHall();this.music=new HallMusic(this.sound);
  }
  interact(action) {
    if(!action)return;
    const result=inspectHall(this.state,action);
    this.state=result.state;
    if(result.effect==='camera'){
      const i=['archive','corridorFeed','hallFeed'].indexOf(action);
      this.world.hall.capture(i,this.state.feeds[i]%2===1);
      if(this.state.feeds[i]===1){
        this.queue=[i===0?'hallBedFeed':i===1?'hallEquipment':'hallPlease'];
      }else this.queue=[];
    }else if(result.effect){this.queue=[];this.sound.effect('door');}
    if(result.line)this.dialogue.say(action==='archive'&&this.state.feeds[0]===1?'hallArchive':result.line);
  }
  get locked(){return ['bedroomLoop','phone'].includes(this.state.phase);}
  get objective(){
    if(this.state.phase==='service')return 'Поднимитесь к дневному свету';
    if(this.state.phase!=='search')return '';
    return this.state.latch?'Под часами есть проход':'Осмотритесь в зале';
  }
  tick(dt,motion) {
    this.time+=dt;this.age+=dt;
    const w=this.world,cam=w.camera,p=cam.position;
    const crossed=crossThreshold(this.state,p.x,p.z);
    if(crossed!==this.state){
      this.state=crossed;this.age=0;this.queue=[];this.dialogue.stop();
      w.verity.root.setEnabled(false);
      if(this.state.phase==='sun')this.sound.setAmbienceLevel(0);
    }
    let phase=this.state.phase;
    if(phase!=='bedroomLoop'){
      w.hall.tick(this.time,dt,this.state,motion,this.age);
      if(this.time>=this.captureAt && this.captureAt<1){
        for(let i=0;i<3;i++)w.hall.capture(i,!!(this.state.feeds[i]%2));
        this.captureAt=this.captureAt===0?.65:Infinity;
      }
    }
    if(phase==='search'){
      const origin=new Vector3(Math.max(14,Math.min(26,p.x+.9)),1.55,Math.max(6.4,Math.min(18,p.z+1.4)));
      w.verity.update(this.time,cam,origin,10,dt,motion);
      if(this.state.panel)w.verity.setUneasy(true);
      if(!this.dialogue.current){
        if(this.queue.length)this.dialogue.say(this.queue.shift());
        else if(this.hints<3&&this.time>[8,28,55][this.hints]&&!this.state.latch){
          this.dialogue.say(['hallBeauty','hallHome','hallExit'][this.hints++]);
        }
      }
    }
    if(phase==='service'||phase==='outside'||phase==='phone'){
      p.y=1.65+Math.max(0,Math.min(1.12,(p.z-23.86)*.25));
    }
    if(phase==='service'||phase==='search')this.music.tick(this.time,phase,this.state.latch);
    const next=advanceEnding(phase,this.age,!!this.dialogue.current,p.z);
    if(next!==phase){
      this.age=0;this.state={...this.state,phase:next};phase=next;
      if(next==='bedroomLoop'){this.music.stop();w.loopBedroom();this.dialogue.say('hallAgain');}
      if(next==='outside'){this.music.stop();this.sound.setAmbienceLevel(.015);this.dialogue.say('hallEntered');}
      if(next==='phone'){this.dialogue.stop();this.sound.quietTone([p.x,p.y,p.z],.045);this.phone.hidden=false;}
      if(endingTitles[next]){this.state.endingId=next;this.phone.hidden=true;return {ending:next,fade:1};}
    }
    this.dialogue.tick(dt);
    let fade=0;
    if(phase==='sun')fade=Math.max(0,(this.age-3)/2);
    if(phase==='bedroomLoop')fade=Math.max(0,1-this.age,Math.min(1,(this.age-3.5)/1.5));
    if(phase==='phone')fade=Math.max(0,(this.age-4)/2);
    return {fade};
  }
}
