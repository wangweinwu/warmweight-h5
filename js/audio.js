/* ============================================================
 * 宠物精灵 · 8-bit 音效 (WebAudio 合成,无需素材)
 * ============================================================ */
const Sfx = (() => {
  let ac = null;
  function ctx() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'square', vol = 0.12, when = 0, slide = 0) {
    const a = ctx();
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), a.currentTime + when + dur);
    g.gain.value = vol;
    g.gain.setValueAtTime(vol, a.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + when + dur);
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + when); o.stop(a.currentTime + when + dur + 0.02);
  }
  return {
    play(name) {
      try {
        switch (name) {
          case 'step': break;
          case 'encounter': tone(660, .09); tone(880, .09, 'square', .12, .1); tone(660, .09, 'square', .12, .2); tone(523, .14, 'square', .12, .3); break;
          case 'hit': tone(220, .1, 'sawtooth', .14, 0, -120); break;
          case 'crit': tone(180, .16, 'sawtooth', .16, 0, -100); tone(140, .2, 'sawtooth', .12, .05, -80); break;
          case 'heal': tone(523, .1); tone(659, .1, 'square', .12, .1); tone(784, .16, 'square', .12, .2); break;
          case 'ball': tone(392, .08); tone(330, .08, 'square', .12, .09); tone(392, .08, 'square', .12, .18); tone(262, .18, 'square', .12, .27, -60); break;
          case 'caught': [523, 659, 784, 1046].forEach((f, i) => tone(f, .12, 'square', .12, i * .11)); break;
          case 'faint': tone(392, .12, 'triangle', .14, 0, -200); tone(262, .3, 'triangle', .12, .12, -140); break;
          case 'levelup': [523, 587, 659, 784, 1046].forEach((f, i) => tone(f, .1, 'square', .1, i * .08)); break;
          case 'victory': [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, .12, 'square', .12, i * .12)); break;
          case 'select': tone(880, .05, 'square', .07); break;
          case 'buy': tone(784, .07); tone(1046, .1, 'square', .12, .08); break;
        }
      } catch (e) { /* 静音 */ }
    }
  };
})();
