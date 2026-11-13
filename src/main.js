import './style.css';
import {Atmosphere} from './atmosphere.js';
const atmosphere=new Atmosphere();
import {createWorld} from './world.js';
import {Input} from './input.js';
import {movePlayer} from './physics.js';
import {initialState,act,objective} from './state.js';
import {endings,voiceDemo,lines} from './story.js';
import {Sound} from './audio.js';
import {Dialogue} from './dialogue.js';
const app=document.querySelector('#app');
const defaults={master:true,ambience:.35,effects:.5,voice:.8,sensitivity:1,subtitles:true,quality:matchMedia('(pointer:coarse)').matches?'low':'medium',motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,mobile:matchMedia('(pointer:coarse)').matches};
let settings={...defaults};try{settings={...defaults,...JSON.parse(localStorage.getItem('verity-3d-settings')||'{}')};}catch{}
for(const k of ['ambience','effects','voice'])settings[k]=Math.max(0,Math.min(1,Number(settings[k])||0));
settings.sensitivity=Math.max(.25,Math.min(2.5,Number(settings.sensitivity)||1));
let state=initialState(),mode='menu',paused=true,time=0,last=performance.now(),stepTime=0,target=null,lastInteract=-1,shownZones=new Set(),world,input,dialogue;
const sound=new Sound();
app.innerHTML=`<canvas id="game-canvas" tabindex="0" aria-label="Трёхмерная спальня. WASD — движение, мышь или стрелки — обзор, E — взаимодействие."></canvas><div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div id="hud" hidden><header class="hud-top"><div><p class="eyebrow" id="chapter">01 / ПРОБУЖДЕНИЕ</p><p class="objective" id="objective"></p></div><button id="pause-button" class="small-button" aria-label="Пауза">Ⅱ <span>Пауза</span></button></header><div id="reticle" aria-hidden="true"></div><div id="interaction"><span id="target-label"></span><button id="interact-button" aria-label="Взаимодействовать"><kbd>E</kbd><span id="action-label">Осмотреть</span></button></div><section id="subtitle" aria-live="polite" hidden><p id="speaker"></p><p id="speech"></p></section><div id="controls-note">WASD — идти <span>·</span> Мышь — обзор <span>·</span> E — действие</div><div id="touch-controls"><div id="joystick" role="group" aria-label="Джойстик перемещения"><div id="joystick-knob"></div></div><div class="swipe-hint">Обзор — свайп<br>по свободной части экрана</div></div></div><div id="screen"></div><div id="loading"><span class="loading-ring"></span><p>Комната вспоминает вас…</p></div>`;
const $=s=>document.querySelector(s),canvas=$('#game-canvas'),screen=$('#screen');
let renderedFrames=0,diagnosticError='';
if(new URLSearchParams(location.search).has('diagnostics')){
 const diagnostics=document.createElement('pre');diagnostics.id='diagnostics';diagnostics.style.cssText='position:fixed;z-index:100;top:90px;left:10px;max-width:95vw;white-space:pre-wrap;background:#000d;color:#bfffbf;padding:12px;font:12px monospace;pointer-events:none';document.body.append(diagnostics);
 window.addEventListener('error',e=>{diagnosticError=e.message;});
 window.addEventListener('unhandledrejection',e=>{diagnosticError=String(e.reason);});
 setInterval(()=>{diagnostics.textContent=JSON.stringify({frames:renderedFrames,mode,paused,visible:document.visibilityState,webgl:world?.engine.webGLVersion,fps:renderedFrames>1?Math.round(world?.engine.getFps()||0):null,ready:world?.scene.isReady(),contextLost:world?.engine.isContextLost,canvas:[canvas.width,canvas.height],position:world?[world.camera.position.x,world.camera.position.z].map(n=>+n.toFixed(2)):null,look:world?[world.camera.rotation.x,world.camera.rotation.y].map(n=>+n.toFixed(2)):null,error:diagnosticError},null,2);},500);
}

function save(){sound.sync(settings);document.body.classList.toggle('touch',settings.mobile);document.body.classList.toggle('no-motion',!settings.motion);try{localStorage.setItem('verity-3d-settings',JSON.stringify(settings));}catch{}}
function showSubtitle(data,hasAudio){
 $('#subtitle').hidden=!data||!settings.subtitles;if(!data)return;
 $('#speaker').textContent=data.speaker;$('#speaker').className=data.speaker==='Верити'?'gold':'';$('#speech').textContent=data.text;
 $('#subtitle').dataset.recorded=String(hasAudio);
}
function setPaused(value){paused=value;input?.setActive(!value&&mode==='game');sound.pause(value);if(value)last=performance.now();}
function menu(){
 mode='menu';setPaused(true);dialogue?.stop();$('#hud').hidden=true;
 screen.innerHTML=`<main class="menu"><header><span class="eyebrow">ИСТОРИЯ О ДОВЕРИИ</span><span class="build">0.3 / ПЕРВЫЙ ЭПИЗОД</span></header><div class="menu-copy"><p class="eyebrow">ОДИН ДРУГ. ДВЕ ДВЕРИ.</p><h1>НЕ ВЕРЬ<br><em>ВЕРИТИ!</em></h1><p class="tagline">Он знает выход.<br>По крайней мере, так он говорит.</p><button class="primary" data-ui="start">Начать игру <span>↗</span></button><button class="secondary" data-ui="settings">Настройки</button><p class="warning">△ Тревожная атмосфера, изменения света и звуки.<br>Выберите комфортную громкость.</p></div><footer><span>ОТ ПЕРВОГО ЛИЦА</span><span>МЫШЬ И КЛАВИАТУРА / КАСАНИЕ</span></footer></main>`;
 screen.hidden=false;document.body.classList.add('in-menu');
}
async function start(){
 setPaused(true);state=initialState();atmosphere.reset();shownZones.clear();time=0;stepTime=0;lastInteract=-1;world.reset();dialogue.stop();mode='game';screen.hidden=true;screen.innerHTML='';$('#hud').hidden=false;document.body.classList.remove('in-menu');save();await sound.start();setPaused(false);last=performance.now();canvas.focus();updateHud();dialogue.say('wake');
}
function pause(){if(mode!=='game'||paused)return;setPaused(true);pauseScreen();}
function pauseScreen(){screen.hidden=false;screen.innerHTML=`<div class="modal-wrap"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title"><p class="eyebrow">НЕ ВЕРЬ ВЕРИТИ!</p><h2 id="pause-title">Можно перевести дух.</h2><p class="muted">Игра и звук приостановлены.</p><button class="primary" data-ui="resume">Продолжить <span>↗</span></button><button class="secondary" data-ui="settings">Настройки</button><button class="text-button" data-ui="restart">Начать заново</button><button class="text-button" data-ui="menu">В главное меню</button></section></div>`;screen.querySelector('button').focus();}
function settingsScreen(){
 setPaused(true);const range=(key,label,min=0,max=100)=>`<label class="range-label" for="${key}">${label}<output id="out-${key}">${key==='sensitivity'?settings[key].toFixed(2):Math.round(settings[key]*100)+'%'}</output></label><input id="${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${key==='sensitivity'?'.05':'1'}" value="${key==='sensitivity'?settings[key]:Math.round(settings[key]*100)}">`;
 const check=(key,label)=>`<label class="check-row">${label}<input type="checkbox" data-setting="${key}" ${settings[key]?'checked':''}></label>`;
 screen.hidden=false;screen.innerHTML=`<div class="modal-wrap"><section class="modal settings" role="dialog" aria-modal="true" aria-labelledby="settings-title"><p class="eyebrow">КОМФОРТ И УПРАВЛЕНИЕ</p><h2 id="settings-title">Настройки</h2><div class="settings-grid"><div>${check('master','Звук')}${range('ambience','Окружение')}${range('effects','Эффекты')}${range('voice','Голос Верити')}<p class="recording-note">${Object.keys(dialogue.manifest.files||{}).length?'Подключены локальные записи голоса.':'Записи голоса пока не добавлены. Реплики доступны в субтитрах.'}</p></div><div>${range('sensitivity','Чувствительность мыши',.25,2.5)}${check('subtitles','Субтитры')}${check('motion','Покачивание и мерцание')}${check('mobile','Сенсорное управление')}<label class="quality-label" for="quality">Качество графики</label><select id="quality" data-setting="quality"><option value="low" ${settings.quality==='low'?'selected':''}>Низкое — для телефона</option><option value="medium" ${settings.quality==='medium'?'selected':''}>Среднее</option><option value="high" ${settings.quality==='high'?'selected':''}>Высокое</option></select></div></div><button class="primary" data-ui="settings-close">Готово <span>↗</span></button></section></div>`;screen.querySelector('input').focus();
}
function updateHud(){
 $('#objective').textContent=objective(state);$('#chapter').textContent=state.zone==='bedroom'?'01 / ПРОБУЖДЕНИЕ':state.zone==='doors'?'02 / ДВЕ ДВЕРИ':'02 / КОРИДОР';
}
const targetNames={box:'Необычная коробка',drawer:'Ящик письменного стола',panel:'Электрический щиток',exit:'Дверь спальни',cake:'Красивая дверь',rescue:'Дверь «Спасение»',bed:'Кровать',window:'Окно',wardrobe:'Шкаф'};
function targetText(action){if(action==='box')return state.opened?'Осмотреть':'Открыть';if(action==='drawer')return 'Открыть ящик';if(action==='panel')return !state.fuse?'Осмотреть':!state.installed?'Вставить предохранитель':!state.power?'Включить свет':'Осмотреть';if(action==='exit'||action==='cake'||action==='rescue')return 'Открыть дверь';return 'Осмотреть';}
function interact(){
 if(paused||mode!=='game'||!target||time-lastInteract<.4)return;lastInteract=time;
 const result=act(state,target);state=result.state;if(result.effect){world.effect(result.effect,time);sound.effect(result.effect);}else sound.effect('click');
 if(result.line)dialogue.say(result.line);updateHud();
 if(state.branch){const end=endings[state.branch];dialogue.stop();setPaused(true);mode='ending';$('#hud').hidden=true;screen.hidden=false;screen.innerHTML=`<div class="ending-wrap"><main class="ending"><p class="eyebrow">ВЫБОР СДЕЛАН / ${state.branch==='cake'?'А':'Б'}</p><div class="ending-symbol">${state.branch==='cake'?'✧':'⌁'}</div><h1>${end.title}</h1><p class="development">В разработке</p><p>${end.text}</p><p class="muted">Это точка продолжения первого эпизода,<br>а не сюжетная концовка.</p><button class="primary" data-ui="menu">Вернуться в меню <span>↗</span></button></main></div>`;}
}
function frame(){
 renderedFrames++;
 const now=performance.now(),dt=Math.min(.045,(now-last)/1000);last=now;
 if(!paused&&mode==='game'){
  time+=dt;const v=input.sample(dt),camera=world.camera;
  camera.rotation.y+=v.yaw;camera.rotation.x=Math.max(-1.25,Math.min(1.25,camera.rotation.x+v.pitch));
  const yaw=camera.rotation.y,speed=2.3;
  const dx=(Math.sin(yaw)*v.forward+Math.cos(yaw)*v.side)*speed*dt,dz=(Math.cos(yaw)*v.forward-Math.sin(yaw)*v.side)*speed*dt;
  const p=movePlayer(camera.position,dx,dz,world.obstacles);const moved=Math.hypot(p.x-camera.position.x,p.z-camera.position.z);camera.position.x=p.x;camera.position.z=p.z;
  const bob=settings.motion&&moved>.001?Math.sin(time*11)*.012:0;camera.position.y=1.65+bob;
  if(moved>.001){stepTime+=dt;if(stepTime>.48){sound.effect('step',camera.position.z>5?'carpet':'wood');stepTime=0;}}
  const zone=camera.position.z>26?'doors':camera.position.z>5?'corridor':'bedroom';
  if(zone!==state.zone){state.zone=zone;updateHud();if(zone!=='bedroom'&&!shownZones.has(zone)){shownZones.add(zone);dialogue.say(zone==='doors'?'doors':'corridor');}}
  if(camera.position.z>17&&!shownZones.has('middle')){shownZones.add('middle');dialogue.say('middle');}
  sound.setListener(camera.position,camera.rotation.y);
  const ambientEvent=atmosphere.update(time,zone);if(ambientEvent){sound.ambientEvent(ambientEvent.kind,ambientEvent.position);if(zone!=='bedroom')world.disturb(time);}
  world.update(time,dt,settings.motion);dialogue.tick(dt);
  const hit=world.scene.pickWithRay(camera.getForwardRay(2.55),mesh=>mesh.isPickable&&mesh.isEnabled());
  target=hit?.hit?hit.pickedMesh.metadata?.action:null;
  $('#interaction').hidden=!target;$('#reticle').classList.toggle('active',!!target);
  if(target){$('#target-label').textContent=targetNames[target];$('#action-label').textContent=targetText(target);}
 }
 world.scene.render();
}
app.addEventListener('click',e=>{
 const action=e.target.closest('[data-ui]')?.dataset.ui;if(!action)return;
 if(action==='start'||action==='restart')start();if(action==='menu')menu();if(action==='settings')settingsScreen();
 if(action==='resume'){screen.hidden=true;setPaused(false);canvas.focus();}
 if(action==='settings-close'){if(mode==='menu')menu();else pauseScreen();}
});
app.addEventListener('input',e=>{
 const key=e.target.dataset.setting;if(!key)return;
 settings[key]=e.target.type==='checkbox'?e.target.checked:e.target.tagName==='SELECT'?e.target.value:key==='sensitivity'?Number(e.target.value):Number(e.target.value)/100;
 const out=$(`#out-${key}`);if(out)out.textContent=key==='sensitivity'?settings[key].toFixed(2):Math.round(settings[key]*100)+'%';
 if(key==='quality')world.qualitySetting(settings.quality);if(key==='subtitles')showSubtitle(dialogue.current,!!dialogue.source);save();
});
$('#pause-button').addEventListener('click',pause);$('#interact-button').addEventListener('click',interact);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&paused&&mode==='game'&&screen.querySelector('[data-ui="resume"]'))return;
 if(e.key==='Tab'&&!screen.hidden){const focus=[...screen.querySelectorAll('button,input,select')],first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
window.addEventListener('resize',()=>world?.engine.resize());
try{
 world=createWorld(canvas,settings.quality);world.reset();input=new Input(canvas,interact,pause,()=>settings.sensitivity);input.bindJoystick($('#joystick'),$('#joystick-knob'));
 dialogue=new Dialogue(sound,world.verity,showSubtitle);await dialogue.init();
 // Safari suspends animation frames for occluded windows. Draw a ready first frame explicitly.
 await world.scene.whenReadyAsync();world.engine.resize();world.scene.render();
 save();$('#loading').remove();menu();world.engine.runRenderLoop(frame);
}catch(error){$('#loading')?.remove();screen.innerHTML='<main class="error-screen"><h1>Не удалось запустить 3D</h1><p>Нужен браузер с поддержкой WebGL. Попробуйте включить аппаратное ускорение и обновить страницу.</p><pre></pre></main>';screen.querySelector('pre').textContent=error.message;console.error(error);}
