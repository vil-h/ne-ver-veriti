import {FinalGuide,guideNames} from './final-guide.js';
import {guideEndings} from './backstage-state.js';
import {ExitHall} from './exit-hall-controller.js';
import {hallTargets} from './exit-hall.js';
import {hallEndingScreen} from './exit-hall-endings.js';
import {Rescue,rescueTargets,rescueEnding} from './rescue.js';
import './style.css';
import {Chase,chaseEnding} from './chase.js';
import {symbols,cakeProximity} from './cake-state.js';
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
let state=initialState(),mode='menu',paused=true,time=0,last=performance.now(),stepTime=0,target=null,lastInteract=-1,shownZones=new Set(),world,input,dialogue,chase,rescue,hall,guide;
const sound=new Sound();
app.innerHTML=`<canvas id="game-canvas" tabindex="0" aria-label="Трёхмерная игра. WASD — движение, мышь или стрелки — обзор, E — взаимодействие."></canvas><div class="vignette" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div><div id="hud" hidden><header class="hud-top"><div><p class="eyebrow" id="chapter">01 / ПРОБУЖДЕНИЕ</p><p class="objective" id="objective"></p></div><button id="pause-button" class="small-button" aria-label="Пауза">Ⅱ <span>Пауза</span></button></header><div id="reticle" aria-hidden="true"></div><div id="interaction"><span id="target-label"></span><button id="interact-button" aria-label="Взаимодействовать"><kbd>E</kbd><span id="action-label">Осмотреть</span></button></div><section id="subtitle" aria-live="polite" hidden><p id="speaker"></p><p id="speech"></p></section><div id="controls-note">WASD — идти <span>·</span> Мышь — обзор <span>·</span> E — действие</div><div id="touch-controls"><div id="joystick" role="group" aria-label="Джойстик перемещения"><div id="joystick-knob"></div></div><div class="swipe-hint">Обзор — свайп<br>по свободной части экрана</div></div></div><button id="jump-button" hidden>Space · Прыгнуть</button><button id="trust-button" hidden>E · Довериться</button><div id="chase-shade" aria-hidden="true"></div><aside id="hall-phone" hidden><small>СООБЩЕНИЯ</small><h3>Неизвестный отправитель</h3><p>А ты быстро учишься :)</p></aside><div id="guide-title" hidden>НЕ ВЕРЬ ВЕРИТИ!</div><button id="guide-skip" hidden>Пропустить знакомую сцену</button><div id="screen"></div><div id="loading"><span class="loading-ring"></span><p>Комната вспоминает вас…</p></div>`;
const $=s=>document.querySelector(s),canvas=$('#game-canvas'),screen=$('#screen');
const qa=import.meta.env.DEV&&new URLSearchParams(location.search).has('qa');
let renderedFrames=0,diagnosticError='';
if(new URLSearchParams(location.search).has('diagnostics')){
 const diagnostics=document.createElement('pre');document.addEventListener('keydown',e=>{if(e.code==='F3'){e.preventDefault();diagnostics.hidden=!diagnostics.hidden;}});diagnostics.id='diagnostics';diagnostics.style.cssText='position:fixed;z-index:100;top:90px;left:10px;max-width:95vw;white-space:pre-wrap;background:#000d;color:#bfffbf;padding:12px;font:12px monospace;pointer-events:none';document.body.append(diagnostics);
 window.addEventListener('error',e=>{diagnosticError=e.message;});
 window.addEventListener('unhandledrejection',e=>{diagnosticError=String(e.reason);});
 setInterval(()=>{diagnostics.textContent=JSON.stringify({frames:renderedFrames,mode,paused,visible:document.visibilityState,webgl:world?.engine.webGLVersion,fps:renderedFrames>1?Math.round(world?.engine.getFps()||0):null,ready:world?.scene.isReady(),contextLost:world?.engine.isContextLost,canvas:[canvas.width,canvas.height],position:world?[world.camera.position.x,world.camera.position.z].map(n=>+n.toFixed(2)):null,look:world?[world.camera.rotation.x,world.camera.rotation.y].map(n=>+n.toFixed(2)):null,phase:rescue?.awakening.active?rescue.awakening.state.phase:chase?.active?chase.state.phase:null,zone:state.zone,rescue:state.rescue,ending:state.endingId,monster:chase?.active?[chase.monster.position.x,chase.monster.position.z].map(n=>+n.toFixed(2)):null,voicePlaying:!!dialogue?.source,voiceRms:+(sound.voiceLevel()||0).toFixed(3),error:diagnosticError},null,2);},500);
}

function save(){sound.sync(settings);document.body.classList.toggle('touch',settings.mobile);document.body.classList.toggle('no-motion',!settings.motion);try{localStorage.setItem('verity-3d-settings',JSON.stringify(settings));}catch{}}
function showSubtitle(data,hasAudio){
 $('#subtitle').hidden=!data||!settings.subtitles;if(!data)return;
 $('#speaker').textContent=data.speaker;$('#speaker').className=data.speaker==='Верити'?'gold':'';$('#speech').textContent=data.text;
 $('#subtitle').dataset.recorded=String(hasAudio);
}
function setPaused(value){paused=value;input?.setActive(!value&&mode==='game');sound.pause(value);if(value){last=performance.now();$('#jump-button').hidden=true;$('#trust-button').hidden=true;}}
function clearChase(){$('#guide-skip').hidden=true;$('#guide-title').hidden=true;chase?.stop();$('#jump-button').hidden=true;$('#trust-button').hidden=true;$('#chase-shade').style.background='transparent';}
function beginChase(){dialogue.stop();state.zone='chase';mode='game';screen.hidden=true;screen.innerHTML='';$('#hud').hidden=false;setPaused(false);chase.start();input.clear();stepTime=0;target=null;canvas.focus();updateHud();}
function endChase(phase){clearChase();dialogue.stop();mode='ending';setPaused(true);$('#hud').hidden=true;screen.hidden=false;screen.innerHTML=chaseEnding(phase);screen.querySelector('button').focus();}
function menu(){
 clearChase();guide?.reset();rescue?.reset();hall?.reset();
 mode='menu';setPaused(true);dialogue?.stop();$('#hud').hidden=true;
 screen.innerHTML=`<main class="menu"><header><span class="eyebrow">ИСТОРИЯ О ДОВЕРИИ</span><span class="build">0.9 / ПОСЛЕДНИЙ ПРОВОДНИК</span></header><div class="menu-copy"><p class="eyebrow">ОДИН ДРУГ. ДВЕ ДВЕРИ.</p><h1>НЕ ВЕРЬ<br><em>ВЕРИТИ!</em></h1><p class="tagline">Он знает выход.<br>По крайней мере, так он говорит.</p><button class="primary" data-ui="start">Начать игру <span>↗</span></button><button class="secondary" data-ui="settings">Настройки</button><p class="warning">△ Тревожная атмосфера, изменения света и звуки.<br>Выберите комфортную громкость.</p></div><footer><span>ОТ ПЕРВОГО ЛИЦА</span><span>МЫШЬ И КЛАВИАТУРА / КАСАНИЕ</span></footer></main>`;
 if(qa)screen.querySelector('.menu-copy').insertAdjacentHTML('beforeend','<button data-ui="qa-rescue">QA: спасение</button><button data-ui="qa-wake">QA: пробуждение</button><button data-ui="qa-cake">QA: праздник</button><button data-ui="qa-chase">QA: погоня</button><button data-ui="qa-pit">QA: яма</button>');
 screen.hidden=false;document.body.classList.add('in-menu');
}
async function start(){
 clearChase();
 guide.reset();hall.reset();rescue.reset();
 setPaused(true);state=initialState();atmosphere.reset();shownZones.clear();time=0;stepTime=0;lastInteract=-1;world.reset();dialogue.stop();mode='game';screen.hidden=true;screen.innerHTML='';$('#hud').hidden=false;document.body.classList.remove('in-menu');save();await sound.start();sound.preloadCues();setPaused(false);last=performance.now();canvas.focus();updateHud();sound.wakeAlarm();dialogue.say('wake');
}
function pause(){if(mode!=='game'||paused)return;setPaused(true);pauseScreen();}
function pauseScreen(){screen.hidden=false;screen.innerHTML=`<div class="modal-wrap"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title"><p class="eyebrow">НЕ ВЕРЬ ВЕРИТИ!</p><h2 id="pause-title">Можно перевести дух.</h2><p class="muted">Игра и звук приостановлены.</p><button class="primary" data-ui="resume">Продолжить <span>↗</span></button><button class="secondary" data-ui="settings">Настройки</button><button class="text-button" data-ui="restart">Начать заново</button><button class="text-button" data-ui="menu">В главное меню</button></section></div>`;screen.querySelector('button').focus();}
function settingsScreen(){
 setPaused(true);const range=(key,label,min=0,max=100)=>`<label class="range-label" for="${key}">${label}<output id="out-${key}">${key==='sensitivity'?settings[key].toFixed(2):Math.round(settings[key]*100)+'%'}</output></label><input id="${key}" data-setting="${key}" type="range" min="${min}" max="${max}" step="${key==='sensitivity'?'.05':'1'}" value="${key==='sensitivity'?settings[key]:Math.round(settings[key]*100)}">`;
 const check=(key,label)=>`<label class="check-row">${label}<input type="checkbox" data-setting="${key}" ${settings[key]?'checked':''}></label>`;
 screen.hidden=false;screen.innerHTML=`<div class="modal-wrap"><section class="modal settings" role="dialog" aria-modal="true" aria-labelledby="settings-title"><p class="eyebrow">КОМФОРТ И УПРАВЛЕНИЕ</p><h2 id="settings-title">Настройки</h2><div class="settings-grid"><div>${check('master','Звук')}${range('ambience','Окружение')}${range('effects','Эффекты')}${range('voice','Голос Верити')}<p class="recording-note">${Object.keys(dialogue.manifest.files||{}).length?'Подключены локальные записи голоса.':'Записи голоса пока не добавлены. Реплики доступны в субтитрах.'}</p></div><div>${range('sensitivity','Чувствительность мыши',.25,2.5)}${check('subtitles','Субтитры')}${check('motion','Покачивание и мерцание')}${check('mobile','Сенсорное управление')}<label class="quality-label" for="quality">Качество графики</label><select id="quality" data-setting="quality"><option value="low" ${settings.quality==='low'?'selected':''}>Низкое — для телефона</option><option value="medium" ${settings.quality==='medium'?'selected':''}>Среднее</option><option value="high" ${settings.quality==='high'?'selected':''}>Высокое</option></select></div></div><button class="primary" data-ui="settings-close">Готово <span>↗</span></button></section></div>`;screen.querySelector('input').focus();
}
function updateHud(){
 $('#objective').textContent=state.zone==='chase'?(settings.mobile?'Бегите по коридору. Ускорение включено':'Бегите по коридору · Shift — бег'):objective(state);$('#chapter').textContent=state.zone==='falseAwakening'?'05 / УТРО':state.zone==='rescueRoom'?'03 / ТЕХНИЧЕСКИЙ УЗЕЛ':state.zone==='chase'?'04 / ПОГОНЯ':state.zone==='cakeRoom'?'03 / ПРАЗДНИК':state.zone==='bedroom'?'01 / ПРОБУЖДЕНИЕ':state.zone==='doors'?'02 / ДВЕ ДВЕРИ':'02 / КОРИДОР';
}
const targetNames={...hallTargets,...rescueTargets,treat:'Торт',partyNote:'Праздничная карточка',candleClue:'Подставка свечей',giftClue:'Подарок',starClue:'Звезда',cakeEntry:'Входная дверь',codeLock:'Символьный замок',redButton:'Красная кнопка',cakeExit:'Дверь с замком',box:'Необычная коробка',drawer:'Ящик письменного стола',panel:'Электрический щиток',exit:'Дверь спальни',cake:'Красивая дверь',rescue:'Дверь «Спасение»',bed:'Кровать',window:'Окно',wardrobe:'Шкаф'};
function targetText(action){if(action==='trustPanel')return 'Подтвердить доверие';if(action==='seam'&&hall.state.latch)return 'Сдвинуть панель';if(['archive','corridorFeed','hallFeed'].includes(action))return 'Сменить ракурс';if(action==='cakeExit')return state.cake.unlocked?'Открыть дверь':'Осмотреть';if(action==='codeLock')return 'Ввести знаки';if(action==='redButton')return 'Нажать';if(action==='box')return state.opened?'Осмотреть':'Открыть';if(action==='drawer')return 'Открыть ящик';if(action==='panel')return !state.fuse?'Осмотреть':!state.installed?'Вставить предохранитель':!state.power?'Включить свет':'Осмотреть';if(action==='exit'||action==='cake'||action==='rescue')return 'Открыть дверь';return 'Осмотреть';}
function interact(){
 if(state.zone==='falseAwakening')return;
 if(state.branch==='rescue'&&rescue.busy)return;
 if(state.zone==='chase'){if(!paused)chase.requestTrust();return;}
 if(paused||mode!=='game'||!target||time-lastInteract<.4)return;lastInteract=time;
 if(state.zone==='backstage'){guide.action(target);if(guide.choice){setPaused(true);screen.hidden=false;screen.innerHTML='<div class="modal-wrap"><section class="modal"><p class="eyebrow">ПРОТОКОЛ 46</p><h2>Решение оператора</h2><button class="primary" data-ui="free">Освободить проводника</button><button class="secondary" data-ui="refuse">Отказаться</button><button class="text-button" data-ui="review">Продолжить исследование</button></section></div>';screen.querySelector('button').focus();}return;}
 if(target==='codeLock'){if(!state.cake.collapsed){setPaused(true);lockScreen();}return;}
 if(state.zone==='exitHall'){hall.interact(target);return;}
 const result=act(state,target);applyResult(result);
 if(result.line)dialogue.say(result.line);updateHud();

}
function applyResult(result){
 state=result.state;
 if(state.branch==='rescue'){rescue.apply(result,time);return;}
 if(result.effect==='enterCake'){world.enterCake();atmosphere.reset();atmosphere.next=time+15;target=null;input.clear();}
 else if(result.effect==='openHall'){world.prepareHall();world.effect('openHall',time);sound.effect('door');}
 else if(result.effect){world.effect(result.effect,time);sound.effect(result.effect);if(result.effect==='collapse')sound.playCue('transform');}
}
function lockScreen(message=''){
 screen.hidden=false;screen.innerHTML=`<div class="modal-wrap"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="lock-title"><p class="eyebrow">ЗАМОК НА ДВЕРИ</p><h2 id="lock-title">Три знака</h2><p class="muted">Нажимайте на ячейки, чтобы сменить знак.</p><div class="symbol-slots">${state.cake.digits.map((n,i)=>`<button data-dial="${i}" aria-label="Знак ${i+1}: ${symbols[n]}"><span>${['◆','☾','★'][n]}</span>${symbols[n]}</button>`).join('')}</div><p role="status">${message}</p><button class="primary" data-ui="code-submit">Проверить</button><button class="secondary" data-ui="code-close">Вернуться в комнату</button></section></div>`;screen.querySelector('button').focus();
}

function frame(){
 renderedFrames++;
 const now=performance.now(),dt=Math.min(.045,(now-last)/1000);last=now;
 if(!paused&&mode==='game'){
  time+=dt;const v=input.sample(dt),camera=world.camera;
  const locked=guide.locked||(hall.started&&hall.locked)||rescue.awakening.active&&rescue.awakening.locked||chase.active&&['caught','trusting','falling'].includes(chase.state.phase);
  camera.rotation.y+=locked?0:v.yaw;camera.rotation.x=Math.max(-1.25,Math.min(1.25,camera.rotation.x+(locked?0:v.pitch)));
  const yaw=camera.rotation.y,speed=locked?0:chase.active?chase.speed(v,settings.mobile):2.3;
  const dx=(Math.sin(yaw)*v.forward+Math.cos(yaw)*v.side)*speed*dt,dz=(Math.cos(yaw)*v.forward-Math.sin(yaw)*v.side)*speed*dt;
  const p=movePlayer(camera.position,dx,dz,state.zone==='backstage'?guide.room.obstacles:world.obstacles);const moved=Math.hypot(p.x-camera.position.x,p.z-camera.position.z);camera.position.x=p.x;camera.position.z=p.z;
  const bob=settings.motion&&moved>.001?Math.sin(time*11)*.012:0;if(!rescue.awakening.active||!rescue.awakening.locked)camera.position.y=1.65+bob;
  if(moved>.001){stepTime+=dt;if(stepTime>(chase.active&&speed>3?.28:.48)){sound.effect('step',camera.position.z>5?'carpet':'wood');stepTime=0;}}
  if(chase.active){
   sound.setListener(camera.position,camera.rotation.y);const view=chase.tick(dt,settings.motion);$('#interaction').hidden=true;$('#jump-button').hidden=!view.pit;$('#trust-button').hidden=!view.trust;$('#jump-button').textContent=settings.mobile?'Прыгнуть':'Space · Прыгнуть';
   $('#objective').textContent=view.phase==='falling'?'':view.phase==='caught'?'':['pitReturn','pitTalk','choice','trusting'].includes(view.phase)?'НЕ СМЕЙ ПРЫГАТЬ':settings.mobile?'Бегите по коридору. Ускорение включено':'Бегите по коридору · Shift — бег';
   $('#chase-shade').style.background=view.fade>0?`rgba(0,0,0,${Math.min(1,view.fade)})`:`radial-gradient(ellipse,transparent 48%,rgba(100,12,0,${view.near*.35}))`;
   if(view.phase==='lost')endChase(view.phase);if(view.phase==='continued'){clearChase();dialogue.stop();input.clear();target=null;state.zone='backstage';guide.enter();try{guide.seenSkip=localStorage.getItem('verity-guide-ending-seen')==='1';}catch{}}world.scene.render();return;
  }
  if(state.zone==='backstage'){
   const ending=guide.tick(dt,settings.motion);sound.setListener(camera.position,camera.rotation.y);
   const hit=world.scene.pickWithRay(camera.getForwardRay(2.65),mesh=>mesh.isPickable&&mesh.isEnabled());
   target=guide.state.phase==='landing'?'stand':guide.locked?null:hit?.pickedMesh?.metadata?.action;
   if(!guide.available(target))target=null;
   $('#chapter').textContent='06 / ПОСЛЕДНИЙ ПРОВОДНИК';$('#objective').textContent=guide.objective;
   $('#interaction').hidden=!target;$('#reticle').classList.toggle('active',!!target);
   if(target){$('#target-label').textContent=guideNames[target];$('#action-label').textContent=target==='stand'?'Встать':'Действие';}
   $('#chase-shade').style.background='rgba(0,0,0,'+guide.fade+')';
   $('#guide-title').hidden=!guide.title;$('#guide-skip').hidden=!guide.canSkip;
   if(ending){state.endingId=ending;mode='ending';setPaused(true);$('#hud').hidden=true;screen.hidden=false;screen.innerHTML='<div class="ending-wrap"><main class="ending"><p class="eyebrow">КОНЦОВКА</p><h1>'+guideEndings[ending]+'</h1><button class="primary" data-ui="restart">Начать заново</button><button class="secondary" data-ui="menu">В главное меню</button></main></div>';screen.querySelector('button').focus();}
   world.scene.render();return;
  }
  if(state.zone==='cakeRoom'&&state.cake.finished&&camera.position.z>5.55){state.zone='exitHall';hall.enter();target=null;}
  if(state.zone==='exitHall'){
   const view=hall.tick(dt,settings.motion);sound.setListener(camera.position,camera.rotation.y);
   $('#chapter').textContent='04 / ЗАЛ ВЫХОДА';$('#objective').textContent=hall.objective;
   $('#chase-shade').style.background='rgba(0,0,0,'+view.fade+')';
   const hit=world.scene.pickWithRay(camera.getForwardRay(2.55),mesh=>mesh.isPickable&&mesh.isEnabled());
   target=hall.state.phase==='search'?hit?.pickedMesh?.metadata?.action:null;
   $('#interaction').hidden=!target;$('#reticle').classList.toggle('active',!!target);
   if(target){$('#target-label').textContent=targetNames[target];$('#action-label').textContent=targetText(target);}
   if(view.ending){state.endingId=view.ending;mode='ending';dialogue.stop();setPaused(true);$('#hud').hidden=true;screen.hidden=false;screen.innerHTML=hallEndingScreen(view.ending);screen.querySelector('button').focus();}
   world.scene.render();return;
  }
  if(state.branch==='rescue'){
   const view=rescue.tick(state,time,dt,settings.motion);state=view.state;if(view.changed){input.clear();target=null;updateHud();}
   $('#chase-shade').style.background=`rgba(0,0,0,${view.fade})`;
   if(view.ending){state.endingId=view.ending;mode='ending';dialogue.stop();setPaused(true);$('#hud').hidden=true;screen.hidden=false;screen.innerHTML=rescueEnding();screen.querySelector('button').focus();world.scene.render();return;}
   if(rescue.awakening.active){sound.setListener(camera.position,camera.rotation.y);$('#interaction').hidden=true;world.scene.render();return;}
  }
  const zone=state.zone==='rescueRoom'?'rescueRoom':state.zone==='cakeRoom'?'cakeRoom':camera.position.z>26?'doors':camera.position.z>5?'corridor':'bedroom';
  if(zone!==state.zone){state.zone=zone;updateHud();if(zone!=='bedroom'&&!shownZones.has(zone)){shownZones.add(zone);dialogue.say(zone==='doors'?'doors':'corridor');}}
  if(!state.branch&&zone!=='cakeRoom'&&camera.position.z>17&&!shownZones.has('middle')){shownZones.add('middle');dialogue.say('middle');}
  sound.setListener(camera.position,camera.rotation.y);
  const ambientEvent=state.branch==='rescue'?null:atmosphere.update(time,zone);if(ambientEvent){sound.ambientEvent(ambientEvent.kind,zone==='cakeRoom'?[15.7,1.5,1]:ambientEvent.position);if(zone!=='bedroom'&&zone!=='cakeRoom')world.disturb(time);}
  if(zone==='cakeRoom'){
   const distance=Math.hypot(camera.position.x-17,camera.position.z-4.12);const reaction=cakeProximity(state.cake,distance,dt);state.cake=reaction.state;
   if(reaction.line)dialogue.say(reaction.line);
  }
  const transformed=world.update(time,dt,settings.motion);dialogue.tick(dt);
  if(transformed){beginChase();world.scene.render();return;}
  const hit=world.scene.pickWithRay(camera.getForwardRay(2.55),mesh=>mesh.isPickable&&mesh.isEnabled());
  target=hit?.hit?hit.pickedMesh.metadata?.action:null;if(state.branch==='rescue'&&rescue.busy)target=null;
  $('#interaction').hidden=!target;$('#reticle').classList.toggle('active',!!target);
  if(target){$('#target-label').textContent=targetNames[target];$('#action-label').textContent=targetText(target);}
 }
 world.scene.render();
}
app.addEventListener('click',e=>{
 const dial=e.target.closest('[data-dial]')?.dataset.dial;
 if(dial!==undefined){state=act(state,'dial'+dial).state;sound.effect('click');lockScreen();return;}
 const action=e.target.closest('[data-ui]')?.dataset.ui;if(!action)return;
 if(action==='code-close'){screen.hidden=true;setPaused(false);canvas.focus();}
 if(action==='code-submit'){
  const result=act(state,'submit');applyResult(result);updateHud();
  if(state.cake.unlocked){screen.hidden=true;setPaused(false);canvas.focus();dialogue.say(result.line);}
  else lockScreen('Неверная последовательность. Попробуйте ещё раз.');
 }

 if(qa&&action?.startsWith('qa-')){start().then(()=>{dialogue.stop();if(action==='qa-rescue'){state.opened=state.fuse=state.installed=state.power=state.doorOpen=true;state.zone='doors';world.camera.position.set(2.1,1.65,29.8);world.camera.rotation.set(0,0,0);updateHud();}else if(action==='qa-wake'){state.branch='rescue';state.zone='falseAwakening';rescue.awakening.start();updateHud();}else if(action==='qa-cake'){state.opened=state.fuse=state.installed=state.power=true;state.zone='cakeRoom';world.enterCake();updateHud();}else{beginChase();if(action==='qa-pit'){world.camera.position.set(80,1.65,152);chase.monster.position={x:80,z:145};}}});}
 if(['free','refuse','review'].includes(action)&&guide.choice){guide.choice=false;screen.hidden=true;screen.innerHTML='';setPaused(false);canvas.focus();if(action!=='review')guide.action(action);}
 if(action==='retry-chase')beginChase();
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
$('#guide-skip').addEventListener('click',()=>{if(!paused)guide.skip();});
$('#trust-button').addEventListener('click',()=>{if(!paused)chase?.requestTrust();});
$('#jump-button').addEventListener('click',()=>{if(!paused)chase?.requestJump();});
$('#pause-button').addEventListener('click',pause);$('#interact-button').addEventListener('click',interact);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
document.addEventListener('keydown',e=>{
 if(e.code==='Escape'&&screen.querySelector('[data-ui="code-close"]')){screen.hidden=true;setPaused(false);canvas.focus();return;}
 if(e.code==='Escape'&&paused&&mode==='game'&&screen.querySelector('[data-ui="resume"]'))return;
 if(e.key==='Tab'&&!screen.hidden){const focus=[...screen.querySelectorAll('button,input,select')],first=focus[0],last=focus.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
window.addEventListener('resize',()=>world?.engine.resize());
try{
 world=createWorld(canvas,settings.quality);world.reset();chase=new Chase(world,sound);input=new Input(canvas,interact,pause,()=>settings.sensitivity,()=>chase.requestJump());input.bindJoystick($('#joystick'),$('#joystick-knob'));
 dialogue=new Dialogue(sound,world.verity,showSubtitle);await dialogue.init();chase.dialogue=dialogue;guide=new FinalGuide(world,sound,dialogue);rescue=new Rescue(world,sound,dialogue);hall=new ExitHall(world,sound,dialogue,$('#hall-phone'));
 // Safari suspends animation frames for occluded windows. Draw a ready first frame explicitly.
 await world.scene.whenReadyAsync();world.engine.resize();world.scene.render();
 if(qa)window.__qaScene=()=>world.scene;
 if(qa)window.__qa07=()=>({position:world.camera.position.asArray(),rotation:world.camera.rotation.asArray(),target,state,guide:guide.state,guideBusy:guide.busy||guide.tapeTime>=0,hall:hall.state,phase:rescue.awakening.state.phase,paused,mode,voice:!!dialogue.source,voiceRms:sound.voiceLevel(),meshes:world.scene.meshes.length,lights:world.scene.lights.filter(l=>l.isEnabled()).length});
 save();$('#loading').remove();menu();world.engine.runRenderLoop(frame);
}catch(error){$('#loading')?.remove();screen.innerHTML='<main class="error-screen"><h1>Не удалось запустить 3D</h1><p>Нужен браузер с поддержкой WebGL. Попробуйте включить аппаратное ускорение и обновить страницу.</p><pre></pre></main>';screen.querySelector('pre').textContent=error.message;console.error(error);}
