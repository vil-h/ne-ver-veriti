import test from 'node:test';
import assert from 'node:assert/strict';
import {guideAction as act,guideStart,guideEndings} from '../src/backstage-state.js';
const run=(state,...ids)=>ids.reduce(act,state);
const archive=run({...guideStart(),phase:'landing'},'stand','archiveDoor');
test('Архив раскрывается последовательно и дверь требует все четыре записи',()=>{
 assert.equal(act(archive,'cellDoor'),archive);
 assert.equal(run(archive,'tape','tape','tape','tape','cellDoor').phase,'cell');
});
const puzzle=run(archive,'tape','tape','tape','tape','cellDoor','meet');
test('Стопор удерживается без совмещения паза, инструкция необязательна',()=>{
 assert.equal(act(puzzle,'pin'),puzzle);
 assert.equal(run(puzzle,'copy','wheel','pin').warning,true);
 assert.equal(run(puzzle,'wheel','pin','free').phase,'release');
});
test('Отказ ведёт к двери, выбор необратим, перезапуск сбрасывает механизмы',()=>{
 const s=run(puzzle,'wheel','pin','refuse','free','outsideDoor');
 assert.equal(s.phase,'denied');assert.equal(guideStart().aligned,false);assert.equal(Object.keys(guideEndings).length,2);
});
