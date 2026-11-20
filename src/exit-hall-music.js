// Original eight-bar music box. The shared ambience bus follows pause and volume settings.
export class HallMusic {
  constructor(sound) {
    this.sound = sound;
    this.step = 0;
    this.next = 0;
    this.notes = new Set();
    this.gain = sound.ctx?.createGain();
    this.gain?.connect(sound.ambience);
  }
  tick(time, phase, revealed) {
    const ctx = this.sound.ctx;
    if (!ctx || !this.gain || time < this.next) return;
    const service = phase === 'service';
    const score = [64,71,76,0,67,71,74,0,62,69,74,0,66,69,73,0];
    const note = service ? 31 : score[this.step % score.length];
    this.next = time + (service ? 1.9 : .64);
    this.step++;
    if (!note) return;
    const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
    oscillator.type = service ? 'triangle' : 'sine';
    oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
    const t = ctx.currentTime;
    if (revealed) oscillator.detune.linearRampToValueAtTime(-Math.min(48, this.step * 2), t + 1);
    envelope.gain.setValueAtTime(.0001, t);
    envelope.gain.exponentialRampToValueAtTime(service ? .045 : .09, t + .07);
    envelope.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
    oscillator.connect(envelope); envelope.connect(this.gain);
    this.notes.add(oscillator);
    oscillator.onended = () => {oscillator.disconnect(); envelope.disconnect(); this.notes.delete(oscillator);};
    oscillator.start(); oscillator.stop(t + 1.65);
  }
  stop() {
    this.gain?.disconnect(); this.gain = null;
    for (const oscillator of this.notes) oscillator.stop();
  }
}
