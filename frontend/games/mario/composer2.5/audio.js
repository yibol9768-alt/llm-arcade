/**
 * Chiptune audio synthesizer — original Web Audio implementation.
 */
class GameAudio {
  constructor() {
    this.ctx = null;
    this.bus = null;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.muted = false;
    this.ready = false;
    this.bgmPattern = [
      { f: 659, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 }, { f: 659, d: 0.12 },
      { f: 0, d: 0.12 }, { f: 523, d: 0.12 }, { f: 659, d: 0.12 }, { f: 0, d: 0.12 },
      { f: 784, d: 0.18 }, { f: 0, d: 0.18 }, { f: 392, d: 0.18 }, { f: 0, d: 0.18 },
      { f: 523, d: 0.12 }, { f: 0, d: 0.12 }, { f: 392, d: 0.12 }, { f: 0, d: 0.12 },
      { f: 330, d: 0.12 }, { f: 0, d: 0.12 }, { f: 440, d: 0.12 }, { f: 494, d: 0.12 },
      { f: 466, d: 0.12 }, { f: 440, d: 0.12 }, { f: 392, d: 0.12 }, { f: 659, d: 0.12 },
      { f: 784, d: 0.12 }, { f: 880, d: 0.12 }, { f: 698, d: 0.12 }, { f: 784, d: 0.12 },
      { f: 659, d: 0.12 }, { f: 523, d: 0.12 }, { f: 587, d: 0.12 }, { f: 494, d: 0.18 },
    ];
  }

  async init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      this.ready = true;
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.bus = this.ctx.createGain();
    this.bus.gain.value = 0.18;
    this.bus.connect(this.ctx.destination);
    this.ready = true;
  }

  setMuted(on) {
    this.muted = !!on;
    if (this.bus) {
      this.bus.gain.setTargetAtTime(this.muted ? 0 : 0.18, this.ctx.currentTime, 0.03);
    }
    if (this.muted) this.stopMusic();
    else if (this.ready) this.startMusic();
    return this.muted;
  }

  flipMute() {
    return this.setMuted(!this.muted);
  }

  beep(freq, len, wave = "square", gain = 0.1, bend = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.value = freq;
    if (bend != null) {
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, bend), t + len);
    }
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    o.connect(g);
    g.connect(this.bus);
    o.start(t);
    o.stop(t + len + 0.03);
  }

  burst(len = 0.08, gain = 0.07) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * len);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 700;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f);
    f.connect(g);
    g.connect(this.bus);
    src.start(t);
  }

  sfxJump() { this.beep(300, 0.1, "square", 0.09, 520); }
  sfxCoin() {
    this.beep(920, 0.07, "square", 0.09);
    setTimeout(() => this.beep(1230, 0.16, "square", 0.09), 60);
  }
  sfxStomp() { this.beep(150, 0.09, "triangle", 0.11, 70); this.burst(0.05, 0.05); }
  sfxKick() { this.beep(110, 0.07, "square", 0.07, 70); }
  sfxCrush() { this.burst(0.14, 0.1); this.beep(220, 0.06, "sawtooth", 0.05, 50); }
  sfxGrow() {
    [262, 330, 392, 523, 659].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.08, "square", 0.07), i * 65);
    });
  }
  sfxDie() {
    this.stopMusic();
    [440, 415, 392, 370, 349, 330, 311, 165].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.11, "square", 0.09), i * 85);
    });
  }
  sfxFlag() {
    [330, 440, 554, 659, 880].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.13, "square", 0.08), i * 95);
    });
  }
  sfxClear() {
    this.stopMusic();
    [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.14, "square", 0.08), i * 110);
    });
  }
  sfxPause() {
    this.beep(523, 0.06, "square", 0.05);
    setTimeout(() => this.beep(392, 0.06, "square", 0.05), 80);
  }

  startMusic() {
    if (!this.ctx || this.muted || this.bgmTimer != null) return;
    const tick = () => {
      if (this.muted) return;
      const note = this.bgmPattern[this.bgmStep % this.bgmPattern.length];
      if (note.f > 0) this.beep(note.f, note.d * 0.85, "square", 0.04);
      this.bgmStep++;
    };
    tick();
    this.bgmTimer = setInterval(tick, 150);
  }

  stopMusic() {
    if (this.bgmTimer != null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}
