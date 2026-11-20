import test from 'node:test';
import assert from 'node:assert/strict';
import {routeDistance,huntStage,pursuitMode} from '../src/hunt.js';
import {mixFor,ChaseScore} from '../src/chase-music.js';
import {tickChase,chaseInitial} from '../src/chase-state.js';
import {ChaseAudio} from '../src/chase-audio.js';
test('Четыре этапа привязаны к геометрии трассы, поиск и возврат различаются',()=>{
 assert.deepEqual([{x:80,z:8},{x:112,z:50},{x:112,z:85},{x:80,z:125}].map(p=>huntStage(routeDistance(p))),[1,2,3,4]);
 assert.equal(pursuitMode(3,118,13,25),'search');assert.equal(pursuitMode(3,142,6,32),'return');assert.equal(pursuitMode(4,170,6,40),'sprint');
});
test('Слои удерживают критическую зону с гистерезисом и отступают при поиске',()=>{
 assert.equal(mixFor(2,'track',5.5).critical,true);assert.equal(mixFor(2,'track',7,true).critical,true);
 assert.equal(mixFor(2,'track',7.5,true).critical,false);assert.equal(mixFor(3,'search',3,true).danger,0);
 assert.ok(mixFor(4,'sprint',5).pursuit>mixFor(1,'track',24).pursuit);
});
test('Преграда исключает поимку в метре от игрока',()=>{
 const s={...chaseInitial(),elapsed:5},input={dt:.1,player:{x:80,z:40.4},monster:{x:80,z:39.6}};
 assert.equal(tickChase(s,{...input,clearSight:false}).phase,'running');
 assert.equal(tickChase(s,{...input,clearSight:true}).phase,'caught');
});
function audioFixture(){
 const param=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),Q:param(),positionX:param(),positionZ:param(),connect(){},disconnect(){this.disconnected=true;},start(){},stop(){this.stopped=true;}});
 return {ctx:{currentTime:0,createGain:node,createOscillator:node,createBiquadFilter:node,createBufferSource:node},spatial:node,noiseBuffer:{},effects:node(),ambience:node()};
}
test('Поимка и повтор останавливают источники, отключают все шины, обнуляют такт',()=>{
 const sound=audioFixture(),score=new ChaseScore(sound);score.update(2,'close',4);const sources=[...score.live];assert.ok(sources.length);
 score.stop();score.stop();assert.ok(sources.every(n=>n.stopped&&n.disconnected));assert.ok(score.layers.every(n=>n.disconnected));
 const retry=new ChaseScore(sound);assert.equal(retry.beat,0);assert.equal(retry.critical,false);retry.stop();
});
test('У ямы окончание звукового хвоста отключает шаги и все музыкальные источники',()=>{
 const a=new ChaseAudio(audioFixture());a.update(1,{stage:4,mode:'sprint',burst:true,position:{x:80,z:147}},4);
 a.fade();a.tail.onended();assert.equal(a.score.live.size,0);assert.ok(a.panner.disconnected);assert.equal(a.tail,null);
});
