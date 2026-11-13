// Gameplay-clock scheduler: paused games and restarts cannot accumulate ambient events.
export class Atmosphere {
 constructor(){this.reset();}
 reset(){this.next=14;this.index=0;}
 update(time,zone){
  if(time<this.next)return null;
  this.next=time+23+(this.index%3)*9;
  const kind=['knock','pipe','rustle'][this.index++%3];
  return {kind,position:zone==='bedroom'?[-4,1.4,2.9]:[this.index%2?4:-4,1.5,14]};
 }
}
