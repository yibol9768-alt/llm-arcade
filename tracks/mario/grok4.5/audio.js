/**
 * 8-bit style audio engine (Web Audio API)
 * Supports mute / unmute and short SFX + looping overworld motif.
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "mario-mute-v1";

  class MarioAudio {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.muted = localStorage.getItem(STORAGE_KEY) === "1";
      this.bgmTimer = null;
      this.bgmStep = 0;
      this.unlocked = false;
    }

    async unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
      this.unlocked = true;
    }

    setMuted(muted) {
      this.muted = !!muted;
      localStorage.setItem(STORAGE_KEY, this.muted ? "1" : "0");
      if (this.master) {
        this.master.gain.setTargetAtTime(
          this.muted ? 0 : 0.22,
          this.ctx.currentTime,
          0.02
        );
      }
      if (this.muted) this.stopBgm();
      else if (this.unlocked) this.startBgm();
      return this.muted;
    }

    toggleMute() {
      return this.setMuted(!this.muted);
    }

    tone(freq, dur, type, vol, slideTo) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo != null) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, slideTo),
          t0 + dur
        );
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    noise(dur, vol) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 900;
      g.gain.setValueAtTime(vol || 0.08, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur);
    }

    jump() {
      this.tone(330, 0.12, "square", 0.1, 660);
    }

    coin() {
      this.tone(988, 0.08, "square", 0.1);
      setTimeout(() => this.tone(1319, 0.18, "square", 0.1), 70);
    }

    stomp() {
      this.tone(180, 0.1, "triangle", 0.12, 80);
      this.noise(0.06, 0.05);
    }

    bump() {
      this.tone(120, 0.08, "square", 0.08, 90);
    }

    breakBrick() {
      this.noise(0.12, 0.1);
      this.tone(200, 0.08, "sawtooth", 0.05, 60);
    }

    powerup() {
      const notes = [262, 330, 392, 523, 392, 523, 659];
      notes.forEach((n, i) => {
        setTimeout(() => this.tone(n, 0.09, "square", 0.08), i * 70);
      });
    }

    pipe() {
      this.tone(400, 0.35, "triangle", 0.08, 120);
    }

    death() {
      this.stopBgm();
      const notes = [523, 494, 466, 440, 415, 392, 370, 200];
      notes.forEach((n, i) => {
        setTimeout(() => this.tone(n, 0.12, "square", 0.1), i * 90);
      });
    }

    flag() {
      const notes = [392, 523, 659, 784, 1047];
      notes.forEach((n, i) => {
        setTimeout(() => this.tone(n, 0.14, "square", 0.09), i * 100);
      });
    }

    win() {
      this.stopBgm();
      const melody = [
        392, 523, 659, 784, 659, 784, 1047, 784, 1047, 1319,
      ];
      melody.forEach((n, i) => {
        setTimeout(() => this.tone(n, 0.16, "square", 0.09), i * 120);
      });
    }

    pauseBeep() {
      this.tone(440, 0.08, "square", 0.06);
      setTimeout(() => this.tone(330, 0.08, "square", 0.06), 100);
    }

    // Simplified overworld motif (looping arpeggio)
    startBgm() {
      if (!this.ctx || this.muted || this.bgmTimer) return;
      const motif = [
        659, 659, 0, 659, 0, 523, 659, 0, 784, 0, 0, 0, 392, 0, 0, 0,
        523, 0, 0, 392, 0, 0, 330, 0, 0, 440, 0, 494, 0, 466, 440, 0,
        392, 659, 784, 880, 0, 698, 784, 0, 659, 0, 523, 587, 494, 0, 0, 0,
      ];
      const stepMs = 140;
      this.bgmStep = 0;
      this.bgmTimer = setInterval(() => {
        if (!this.unlocked || this.muted) return;
        const n = motif[this.bgmStep % motif.length];
        if (n) this.tone(n, 0.11, "square", 0.035);
        this.bgmStep++;
      }, stepMs);
    }

    stopBgm() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  global.MarioAudio = MarioAudio;
})(window);
