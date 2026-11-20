export const endingTitles = {'exit-hall-loop':'ПО КРУГУ', 'exit-hall-almost-free':'ПОЧТИ СВОБОДЕН'};
export function hallEndingScreen(id) {
  return `<div class="ending-wrap"><main class="ending"><p class="eyebrow">КОНЦОВКА</p><h1>${endingTitles[id]}</h1><button class="primary" data-ui="restart">Начать заново</button><button class="secondary" data-ui="menu">В главное меню</button></main></div>`;
}
export function advanceEnding(phase, age, speaking, z) {
  if (phase === 'sun' && age >= 5) return 'bedroomLoop';
  if (phase === 'bedroomLoop' && age >= 5 && !speaking) return 'exit-hall-loop';
  if (phase === 'service' && z >= 30.5) return 'outside';
  if (phase === 'outside' && age >= 4) return 'phone';
  if (phase === 'phone' && age >= 6) return 'exit-hall-almost-free';
  return phase;
}
