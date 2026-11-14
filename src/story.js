const voice=(id,text,emotion='friendly')=>({speaker:'Верити',text,emotion,voice:`audio/voice/${id}.ogg`});
const thought=text=>({speaker:'Вы',text,emotion:'neutral'});
export const lines={
 cakeWelcome:voice('08-cake-welcome','Ура! Я знал, что ты мне доверяешь! Смотри, я даже приготовил для тебя тортик! А потом откроем следующую дверь.'),
 treat:thought('Идеальный крем. Ни одного следа ножа. Даже запаха нет.'),
 partyNote:thought('На карточке порядок: свеча, подарок, звезда. Нужно найти их знаки.'),
 candleClue:thought('На подставке свечей выгравирована луна.'),
 giftClue:thought('На подарке знак ромба.'),
 starClue:thought('На основании украшения — звезда.'),
 cakeEntry:thought('Ручка с этой стороны неподвижна.'),
 cakeLocked:voice('09-cake-hint','На замке три знака. Посмотри на праздничные вещи — они подскажут порядок.'),
 cakeWrong:thought('Красный индикатор. Последовательность не подходит. Можно попробовать ещё раз.'),
 cakeSolved:voice('10-cake-solved','Вот и всё! Я же говорил, вместе мы справимся. Проходи!'),
 cakeConcern:voice('11-cake-concern','Эй, зачем ты туда смотришь? Там ничего интересного.','suspicious'),
 cakeInsist:voice('12-cake-insist','Не нажимай на эту кнопку! Мы же друзья!','angry'),
 cakeCalm:voice('13-cake-calm','Вот так. Давай лучше вернёмся к празднику.'),
 cakeRage:voice('14-cake-rage','Я ЖЕ ПРОСИЛ ТЕБЯ НЕ НАЖИМАТЬ!','angry'),
 wake:thought('Моя комната… Только тишина какая-то чужая.'),
 box:voice('01-hello','Привет! Я Верити. Не бойся, я помогу тебе выбраться. В ящике стола должен быть предохранитель.'),
 boxAgain:voice('02-box','Спасибо, что выпустил меня. Теперь давай включим свет.'),
 drawerLocked:thought('Ящик заедает. На столе осталась записка: «Запасной предохранитель».'),
 fuse:voice('03-fuse','Вот он! Поставь его в щиток рядом с дверью. Потом подними выключатель.'),
 fuseAgain:thought('Предохранитель уже у меня.'),
 panelEmpty:thought('Пустое гнездо. Не хватает предохранителя.'),
 installed:voice('04-switch','Отлично. Теперь подними выключатель — и будет свет!'),
 light:voice('05-light','Видишь? Уже лучше. Дверь теперь должна открыться. Я с тобой.'),
 panelOn:thought('Электричество работает. Пора выходить.'),
 locked:thought('Не открывается. Электрический замок обесточен.'),
 exit:thought('Замок щёлкнул. Можно идти.'),
 bed:thought('Одеяло ещё тёплое. Значит, я только что проснулся.'),
 window:thought('За стеклом темно. Даже соседних окон не видно.'),
 wardrobe:thought('Моя одежда. Всё на своих местах. Почти всё.'),
 corridor:voice('06-corridor','Просто иди вперёд. Здесь немного… непривычно.','suspicious'),
 middle:thought('Гул не становится тише. Этот коридор длиннее, чем должен быть.'),
 doors:voice('07-doors','Вот! Красивая дверь слева. Там тепло. Выбери её, хорошо?','suspicious'),
};
// Available for recording and testing; not inserted into the unapproved story.
export const voiceDemo={speaker:'Верити',text:'Я сказал: не трогай!',emotion:'angry',voice:'audio/voice/demo-angry.ogg'};
export const endings={cake:{title:'Ветка с тортом',text:'Вы послушались Верити и выбрали красивую дверь.'},rescue:{title:'Ветка «Спасение»',text:'Вы выбрали железную дверь с надписью «СПАСЕНИЕ».'}};
