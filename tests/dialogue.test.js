import test from 'node:test';
import assert from 'node:assert/strict';
import {Dialogue} from '../src/dialogue.js';
function setup(){
 const events=[];let ended;let stops=0;
 const sound={loadVoice:async()=>({duration:2}),playVoice:(buffer,emotion,done)=>{ended=done;events.push(['audio',emotion]);return {stop(){stops++;},onended:null};}};
 const character={setTalking:v=>events.push(['talk',v]),setEmotion:e=>events.push(['emotion',e])};
 const dialogue=new Dialogue(sound,character,(line,recorded)=>events.push(['subtitle',line?.speaker,recorded]));
 return {dialogue,events,end:()=>ended(),stops:()=>stops};
}
test('Без файла реплика не выдаётся за звучащую речь',async()=>{
 const {dialogue,events}=setup();await dialogue.say('box');assert.ok(events.some(e=>e[0]==='subtitle'&&e[2]===false));assert.equal(events.some(e=>e[0]==='audio'),false);assert.equal(events.some(e=>e[0]==='talk'&&e[1]===true),false);
 dialogue.tick(100);assert.equal(dialogue.current,null);
});
test('Запись синхронизирует субтитры, эмоцию и завершение',async()=>{
 const {dialogue,events,end}=setup();dialogue.manifest={files:{'audio/voice/06-corridor.ogg':'audio/voice/06-corridor.mp3'}};
 await dialogue.say('corridor');assert.ok(events.some(e=>e[0]==='audio'&&e[1]==='suspicious'));assert.ok(events.some(e=>e[0]==='subtitle'&&e[2]===true));
 dialogue.tick(100);assert.notEqual(dialogue.current,null);end();dialogue.tick(1.1);assert.equal(dialogue.current,null);
});
test('Новая реплика прерывает предыдущую запись',async()=>{
 const {dialogue,stops}=setup();dialogue.manifest={files:{'audio/voice/01-hello.ogg':'audio/voice/01-hello.mp3'}};await dialogue.say('box');await dialogue.say('wake');assert.equal(stops(),1);assert.equal(dialogue.current.speaker,'Вы');
});
test('Ошибка файла оставляет текст и не запускает анимацию речи',async()=>{
 const {dialogue,events}=setup();dialogue.manifest={files:{'audio/voice/01-hello.ogg':'missing.mp3'}};dialogue.sound.loadVoice=async()=>{throw new Error('404');};await dialogue.say('box');assert.ok(dialogue.current);assert.equal(events.some(e=>e[0]==='talk'&&e[1]===true),false);
});
