import {writeFileSync} from 'node:fs';
import {lines} from '../src/story.js';
const rows=Object.entries(lines).map(([id,line])=>({id,speaker:line.speaker,text:line.text,emotion:line.emotion,file:line.voice?.replace('.ogg','.mp3')||null}));
writeFileSync('public/audio/voice/recording-script.json',JSON.stringify({version:'0.8',status:'recorded',lines:rows},null,2)+'\n');
const text=`# Пакет записи первого эпизода, версия 0.8

Готова 31 игровая MP3-запись. Все реплики Верити перечислены ниже; текст совпадает с src/story.js. Мысли героя остаются субтитрами и приведены отдельно для полноты сценария.

Голос: русский, дружелюбный, мультяшный, немного странный; самостоятельная актёрская трактовка без имитации оригинального актёра. Первые пять реплик — искренняя помощь. В коридоре тише, с осторожной паузой после «немного»; у дверей мягкая настойчивость, без злости и рычания.

Технически: локальные MP3 mono 22,05 кГц, 80 кбит/с; обработка эмоций выполнена офлайн. Синтезатор, лицензии и методика — в README.md этого каталога и ASSETS.md.

| Файл в public/ | Эмоция | Точный текст |
| --- | --- | --- |
${rows.filter(r=>r.file).map(r=>`| ${r.file} | ${({friendly:'Дружелюбная',suspicious:'Подозрительная',angry:'Злая'})[r.emotion]} | ${r.text} |`).join('\n')}

## Мысли героя — без обязательной голосовой записи

${rows.filter(r=>!r.file).map(r=>`- **${r.id}**: ${r.text}`).join('\n')}

## Подключение

Все записи подключены через manifest.json. При ошибке файла остаются субтитры. Рот получает амплитуду реальной записи. Реплики 15–18 относятся к сцене у ямы; 19–21 — к ветке «Спасение». В финальной спальне Верити молчит. Актёрский голос не клонировался.

Этот документ и recording-script.json обновляются командой node scripts/voice-script.mjs.
`;
writeFileSync('public/audio/voice/RECORDING_SCRIPT.md',text);
