import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,act} from '../src/state.js';
import {movePlayer,overlaps} from '../src/physics.js';
const run=(s,...actions)=>actions.reduce((state,a)=>act(state,a).state,s);
test('Дверь закрыта до полного восстановления электричества',()=>{
 let s=run(initialState(),'exit','panel','drawer','exit');assert.equal(s.opened,false);assert.equal(s.fuse,false);assert.equal(s.doorOpen,false);
 s=run(s,'box','drawer','panel','exit');assert.equal(s.installed,true);assert.equal(s.power,false);assert.equal(s.doorOpen,false);
 s=run(s,'panel','exit');assert.equal(s.power,true);assert.equal(s.doorOpen,true);
});
test('Обе ветки доступны только в конце коридора',()=>{
 let s=run(initialState(),'cake','rescue');assert.equal(s.branch,null);
 s=run(s,'box','drawer','panel','panel','exit');assert.equal(run(s,'cake').branch,null);
 for(const branch of ['cake','rescue'])assert.equal(act({...s,zone:'doors'},branch).state.branch,branch);
});
test('Повторное действие не повторяет появление и не сбрасывает прогресс',()=>{
 let s=run(initialState(),'box','drawer','panel','panel','exit');
 assert.equal(act(s,'box').effect,null);assert.equal(act(s,'drawer').effect,null);assert.equal(act(s,'exit').effect,null);
 assert.equal(run(s,'box','drawer','panel').power,true);assert.equal(initialState().opened,false);
});
test('Стены останавливают движение даже при большом шаге времени',()=>{
 const wall={x:0,z:2,w:10,d:.2};const p=movePlayer({x:0,z:0},0,30,[wall]);assert.ok(p.z<1.67);assert.equal(overlaps(p.x,p.z,.24,wall),false);
});
test('Можно скользить вдоль стены, но нельзя срезать угол',()=>{
 const wall={x:2,z:0,w:.2,d:10};const p=movePlayer({x:1,z:0},5,3,[wall]);assert.ok(p.x<1.67);assert.ok(p.z>2.9);assert.equal(overlaps(p.x,p.z,.24,wall),false);
});
test('Игрок проходит в проём 1,8 м и обходит мебель',()=>{
 const walls=[{x:-2.7,z:4.5,w:3.6,d:.2},{x:2.7,z:4.5,w:3.6,d:.2}],chair={x:2,z:1.5,w:.56,d:.62};
 assert.ok(movePlayer({x:0,z:3},0,3,walls).z>5.9);
 const stopped=movePlayer({x:2,z:0},0,3,[chair]);assert.ok(stopped.z<1);
 let p=movePlayer(stopped,-1,0,[chair]);p=movePlayer(p,0,3,[chair]);assert.ok(p.z>3);
});
