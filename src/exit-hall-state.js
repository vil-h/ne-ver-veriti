export const hallInitial = () => ({
  phase: 'search', feeds: [0, 0, 0], latch: false, panel: false,
  trusted: false, endingId: null
});

export function inspectHall(previous, action) {
  const state = {...previous, feeds: [...previous.feeds]};
  let line, effect;
  if (state.phase !== 'search') return {state};
  const feed = ['archive', 'corridorFeed', 'hallFeed'].indexOf(action);
  if (feed >= 0) {
    state.feeds[feed]++;
    effect = 'camera';
    line = ['hallBedFeed', 'hallCorridor', 'hallClue'][feed];
  } else if (action === 'seam') {
    if (!state.feeds[2]) line = 'hallSeam';
    else if (!state.latch) {
      state.latch = true;
      line = 'hallLatch';
    } else if (!state.panel) {
      state.panel = true;
      effect = 'slide';
      line = 'hallFound';
    }
  } else if (action === 'trustPanel' && !state.trusted) {
    state.trusted = true;
    effect = 'glass';
    line = 'hallFriends';
  } else if (action === 'glassDoor') line = 'hallTrust';
  else if (action === 'hallClock') line = 'hallClock';
  return {state, line, effect};
}

// Crossing either physical threshold commits the choice.
export function crossThreshold(state, x, z) {
  if (state.phase !== 'search' || z <= 19.8) return state;
  if (state.panel && Math.abs(x - 24) < 1.15) return {...state, phase: 'service'};
  if (state.trusted && Math.abs(x - 18) < 1.15) return {...state, phase: 'sun'};
  return state;
}
