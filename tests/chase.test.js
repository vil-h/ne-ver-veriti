import test from 'node:test';
import assert from 'node:assert/strict';
import {route,obstacles,spawn,atPit,RUN_SPEED,resetGates,updateGates,gates} from '../src/chase-layout.js';
import {createPursuer,advancePursuer,findPath} from '../src/chase-monster.js';
import {chaseInitial,tickChase} from '../src/chase-state.js';
import {movePlayer,overlaps} from '../src/physics.js';
test('Погоня: начальная фора, поимка стоящего игрока и независимый checkpoint',()=>{
 const m=createPursuer();let s=chaseInitial();for(let t=0;t<20&&s.phase==='running';t+=.05){advancePursuer(m,spawn,.05);s=tickChase(s,{dt:.05,player:spawn,monster:m.position});}
 assert.equal(s.phase,'caught');assert.ok(s.elapsed>3);assert.equal(chaseInitial().phase,'running');assert.deepEqual(createPursuer().position,{x:80,z:0});
});
test('Полный маршрут: монстр обходит повороты, стены и шкафы, успешный бег занимает 45–75 секунд',()=>{
 resetGates();let player={...spawn},m=createPursuer(),s=chaseInitial(),elapsed=0,index=1,turnPause=0;
 while(!atPit(player)&&elapsed<100){const dt=.05;elapsed+=dt;turnPause-=dt;updateGates(player,dt);
  const goal=route[index],dx=goal.x-player.x,dz=goal.z-player.z,d=Math.hypot(dx,dz);
  if(d<.08&&index<route.length-1){index++;turnPause=.5;}
  else if(turnPause<=0&&d>.01){const step=Math.min(RUN_SPEED*dt,d);player=movePlayer(player,dx/d*step,dz/d*step,obstacles);}
  advancePursuer(m,player,dt);assert.equal(obstacles.some(b=>overlaps(m.position.x,m.position.z,.8,b)),false);
  s=tickChase(s,{dt,player,monster:m.position});assert.ok(['running','pitReturn'].includes(s.phase),s.phase+' at '+elapsed);
 }
 assert.ok(atPit(player));assert.ok(elapsed>=45&&elapsed<=75,elapsed);assert.ok(m.age>40);assert.ok(m.position.z>100,'Монстр действительно прошёл повороты');
 const distance=Math.hypot(player.x-m.position.x,player.z-m.position.z);assert.ok(distance>1&&distance<25,'Преследователь остаётся поблизости: '+distance);
 assert.equal(s.phase,'pitReturn');assert.ok(gates.every(g=>g.triggered&&g.disabled));resetGates();
});
test('У ямы ходьба остановлена краем; Space работает только рядом, затем падение и продолжение',()=>{
 const p=movePlayer({x:80,z:152},0,20,obstacles);assert.ok(p.z<154);
 let s=tickChase(chaseInitial(),{dt:.1,player:spawn,monster:{x:80,z:0},jump:true});assert.equal(s.phase,'running');
 s=tickChase(s,{dt:.1,player:p,monster:{x:80,z:152},jump:true});assert.equal(s.phase,'falling');
 s=tickChase(s,{dt:3,player:p,monster:p});assert.equal(s.phase,'continued');
});
test('Преследование не режет стены между соседними плечами коридора',()=>{
 const path=findPath({x:80,z:44},{x:112,z:55});assert.ok(path.length>35);for(const p of path)assert.equal(obstacles.some(b=>overlaps(p.x,p.z,.82,b)),false);
});
test('Физический возврат к монстру приводит к поражению, а финальные состояния неизменны',()=>{
 let s=tickChase({...chaseInitial(),elapsed:10},{dt:.1,player:{x:80,z:10},monster:{x:80,z:10}});assert.equal(s.phase,'caught');
 s=tickChase(s,{dt:2,player:spawn,monster:spawn});assert.equal(s.phase,'lost');assert.equal(tickChase(s,{dt:100,player:spawn,monster:spawn,jump:true}).phase,'lost');
});

test('Бег с ошибками на поворотах позволяет монстру догнать игрока',()=>{
 resetGates();let player={...spawn},m=createPursuer(),s=chaseInitial(),index=1,wait=0;
 for(let t=0;t<90&&s.phase==='running';t+=.05){const goal=route[index],dx=goal.x-player.x,dz=goal.z-player.z,d=Math.hypot(dx,dz);wait-=.05;
 if(d<.08&&index<route.length-1){index++;wait=1.6;}else if(wait<=0&&d>.01){const step=Math.min(RUN_SPEED*.05,d);player=movePlayer(player,dx/d*step,dz/d*step,obstacles);}
 advancePursuer(m,player,.05);s=tickChase(s,{dt:.05,player,monster:m.position});}
 assert.equal(s.phase,'caught');
});
test('Яма: защищённый диалог, осознанное доверие, Молодец и только затем атака',()=>{
 const player={x:80,z:152},monster={x:80,z:148};let s=tickChase(chaseInitial(),{dt:.1,player,monster});assert.equal(s.phase,'pitReturn');
 s=tickChase(s,{dt:4,player,monster,looking:true});assert.equal(s.phase,'pitTalk');
 s=tickChase(s,{dt:40,player,monster:player,trust:true});assert.equal(s.phase,'pitTalk');assert.equal(s.lineIndex,0);
 for(let i=0;i<3;i++)s=tickChase(s,{dt:1,player,monster,dialogueDone:true});assert.equal(s.phase,'choice');
 s=tickChase(s,{dt:100,player,monster});assert.equal(s.phase,'choice');
 s=tickChase(s,{dt:.1,player,monster,trust:true});assert.equal(s.phase,'trusting');
 s=tickChase(s,{dt:10,player,monster});assert.equal(s.phase,'trusting');
 s=tickChase(s,{dt:.1,player,monster,dialogueDone:true});assert.equal(s.phase,'caught');
 s=tickChase(s,{dt:2,player,monster});assert.equal(s.phase,'lost');
});
test('Из сцены выбора можно прыгнуть без доверия',()=>{
 const p={x:80,z:152};const s=tickChase({...chaseInitial(),phase:'choice'},{dt:.1,player:p,monster:p,jump:true,trust:true});assert.equal(s.phase,'falling');
});
