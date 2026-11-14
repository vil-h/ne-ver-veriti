import test from 'node:test';
import assert from 'node:assert/strict';
import {cakeInitial,cakeAct,cakeProximity} from '../src/cake-state.js';
import {initialState,act} from '../src/state.js';
test('Красивая дверь переводит в комнату; ранний выбор не пропускает вступление',()=>{
 assert.equal(act(initialState(),'cake').state.zone,'bedroom');
 const s=act({...initialState(),zone:'doors',doorOpen:true},'cake');assert.equal(s.effect,'enterCake');assert.equal(s.state.zone,'cakeRoom');assert.equal(s.line,'cakeWelcome');
});
test('Ошибка не блокирует замок, правильная последовательность открывает дверь',()=>{
 let s=cakeInitial();const wrong=cakeAct(s,'submit');assert.equal(wrong.effect,'wrong');assert.equal(wrong.state.unlocked,false);
 for(const action of ['dial0','dial2','dial2'])s=cakeAct(s,action).state;
 const solved=cakeAct(s,'submit');assert.equal(solved.effect,'unlock');assert.equal(solved.state.unlocked,true);
 assert.equal(cakeAct(solved.state,'cakeExit').effect,'next');assert.equal(cakeAct(cakeInitial(),'cakeExit').effect,null);
});
test('Красная кнопка доступна до и после решения; повторное нажатие не запускает сцену заново',()=>{
 for(const unlocked of [false,true]){const s=cakeAct({...cakeInitial(),unlocked},'redButton');assert.equal(s.effect,'collapse');assert.equal(cakeAct(s.state,'redButton').effect,null);assert.equal(cakeAct(s.state,'cakeExit').effect,null);}
});
test('Предупреждения усиливаются по расстоянию и успокаиваются после отхода',()=>{
 let s=cakeInitial();let r=cakeProximity(s,1.9,.1);assert.equal(r.line,'cakeConcern');s=r.state;
 assert.equal(cakeProximity(s,1.9,3).line,null);r=cakeProximity(s,1,1);assert.equal(r.line,'cakeInsist');s=r.state;
 assert.equal(cakeProximity(s,3,4).line,null);r=cakeProximity(s,3,6);assert.equal(r.line,'cakeCalm');assert.equal(r.state.warning,0);
 assert.equal(cakeProximity({...s,collapsed:true},.5,10).line,null);
});
test('Новый запуск очищает замок, разрушение и предупреждения; входные состояния не мутируют',()=>{
 const original=cakeInitial();cakeAct(original,'dial0');assert.deepEqual(original.digits,[0,0,0]);assert.equal(initialState().cake.collapsed,false);assert.equal(initialState().cake.warning,0);
});
