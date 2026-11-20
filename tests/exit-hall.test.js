import test from 'node:test';
import assert from 'node:assert/strict';
import {hallInitial,inspectHall,crossThreshold} from '../src/exit-hall-state.js';
import {advanceEnding} from '../src/exit-hall-endings.js';

test('Стеклянный выход доступен с первой минуты, решение принимается на пороге',()=>{
 const s=inspectHall(hallInitial(),'trustPanel').state;
 assert.equal(crossThreshold(s,18,18).phase,'search');
 assert.equal(crossThreshold(s,18,21).phase,'sun');
 assert.equal(crossThreshold(hallInitial(),18,21).phase,'search');
});
test('Ракурс зала раскрывает ручку, найденный проход сохраняет оба варианта',()=>{
 let s=hallInitial();
 for(const action of ['archive','corridorFeed','seam'])s=inspectHall(s,action).state;
 assert.equal(s.latch,false);
 for(const action of ['hallFeed','seam','seam','trustPanel'])s=inspectHall(s,action).state;
 assert.equal(crossThreshold(s,24,21).phase,'service');
 assert.equal(crossThreshold(s,18,21).phase,'sun');
 assert.deepEqual(hallInitial().feeds,[0,0,0]);
});
test('Финалы ждут реплику или выход наружу, возвращают разные ID',()=>{
 assert.equal(advanceEnding('sun',5,false,23),'bedroomLoop');
 assert.equal(advanceEnding('bedroomLoop',7,true,0),'bedroomLoop');
 assert.equal(advanceEnding('bedroomLoop',7,false,0),'exit-hall-loop');
 assert.equal(advanceEnding('service',100,false,24),'service');
 assert.equal(advanceEnding('service',0,false,31),'outside');
 assert.equal(advanceEnding('outside',4,false,31),'phone');
 assert.equal(advanceEnding('phone',6,false,31),'exit-hall-almost-free');
});
