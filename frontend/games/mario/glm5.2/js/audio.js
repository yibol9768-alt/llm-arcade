// ============================================================
// Audio System - Web Audio API music + SFX with mute support
// ============================================================

const NOTE_FREQ = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61,
    'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23,
    'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46,
    'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98,
    'R': 0, // rest
};

// Note durations in sixteenth notes (1 = sixteenth, 2 = eighth, 4 = quarter, 8 = half)
const SIXTEENTH = 0.12; // seconds per sixteenth note

// Main theme melody (simplified Mario overworld theme)
// Format: [note, duration_in_sixteenths]
const THEME_MELODY = [
    // Intro pickup
    ['R', 2], ['E5', 2], ['E5', 2], ['R', 2], ['E5', 2], ['R', 2], ['C5', 2], ['E5', 2],
    ['R', 2], ['G5', 4], ['R', 4], ['G4', 8],
    // Phrase 1
    ['R', 4], ['C5', 4], ['G4', 4], ['E4', 4],
    ['R', 4], ['A4', 4], ['B4', 4], ['Bb4', 4],
    ['A4', 4], ['G4', 4], ['E5', 4], ['G5', 4],
    ['A5', 4], ['F5', 4], ['G5', 4],
    // Phrase 2
    ['E5', 4], ['C5', 4], ['D5', 4], ['B4', 8],
    ['R', 8],
    // Phrase 3 (climbing)
    ['G5', 2], ['F#5', 2], ['F5', 2], ['Eb5', 2], ['E5', 2],
    ['R', 2], ['G#3', 2], ['A3', 2], ['C4', 2],
    ['R', 2], ['A3', 2], ['C4', 2], ['D4', 2],
    // Phrase 4
    ['R', 2], ['D4', 4], ['C4', 4],
    ['R', 4], ['R', 8],
];

// Bass line (simplified, follows the melody harmony)
const THEME_BASS = [
    ['R', 8],
    ['C3', 4], ['C3', 4],
    ['C3', 4], ['C3', 4],
    ['C3', 4], ['C3', 4],
    ['G2', 4], ['G2', 4],
    ['C3', 4], ['C3', 4],
    ['F3', 4], ['F3', 4],
    ['F3', 4], ['F3', 4],
    ['C3', 4], ['C3', 4],
    ['C3', 4], ['C3', 4],
    ['G2', 4], ['G2', 4],
    ['G2', 4], ['G2', 4],
    ['C3', 4], ['C3', 4],
    ['F3', 4], ['F3', 4],
    ['G2', 4], ['G2', 4],
    ['C3', 4], ['C3', 4],
];

// Death melody
const DEATH_MELODY = [
    ['C4', 4], ['R', 2], ['C4', 2], ['R', 2],
    ['C4', 2], ['R', 2], ['C4', 2], ['R', 2],
    ['A4', 2], ['R', 2], ['C4', 2], ['R', 2],
    ['F4', 2], ['R', 2], ['E4', 2], ['R', 2],
    ['D4', 2], ['R', 2], ['Bb3', 2], ['R', 2],
    ['A3', 2], ['R', 2], ['G3', 2], ['R', 2],
    ['C4', 4], ['R', 4], ['R', 8],
];

// Level complete melody
const COMPLETE_MELODY = [
    ['C4', 2], ['D4', 2], ['E4', 2], ['F4', 2],
    ['G4', 2], ['A4', 2], ['B4', 2], ['C5', 2],
    ['C5', 2], ['B4', 2], ['A4', 2], ['G4', 2],
    ['F4', 2], ['E4', 2], ['D4', 2], ['C4', 2],
    ['E4', 4], ['G4', 4], ['C5', 4], ['R', 4],
    ['E4', 4], ['G4', 4], ['C5', 4], ['R', 4],
    ['G4', 8], ['R', 8],
];

// Game over melody
const GAMEOVER_MELODY = [
    ['C4', 4], ['R', 2], ['C4', 2], ['R', 4],
    ['C4', 2], ['R', 2], ['C4', 2], ['R', 4],
    ['Eb4', 2], ['R', 2], ['G4', 2], ['R', 2],
    ['F4', 2], ['R', 2], ['Eb4', 2], ['R', 2],
    ['D4', 4], ['C4', 4], ['R', 8],
];

class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicGain = null;
        this.sfxGain = null;
        this.masterGain = null;
        this.currentTrack = null;
        this.musicTimerId = null;
        this.musicPlaying = false;
        this.tempMuted = false; // For flagpole/level complete
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.5;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.8;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 0.3;
        }
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    // Play a single note with given waveform
    playNote(freq, duration, type, gainNode, startTime, volume) {
        if (!this.ctx || freq === 0) return;

        const osc = this.ctx.createOscillator();
        const envGain = this.ctx.createGain();

        osc.type = type || 'square';
        osc.frequency.value = freq;

        const vol = volume !== undefined ? volume : 0.3;
        const attackTime = 0.01;
        const releaseTime = Math.min(0.05, duration * 0.3);

        envGain.gain.setValueAtTime(0, startTime);
        envGain.gain.linearRampToValueAtTime(vol, startTime + attackTime);
        envGain.gain.setValueAtTime(vol, startTime + duration - releaseTime);
        envGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(envGain);
        envGain.connect(gainNode);

        osc.start(startTime);
        osc.stop(startTime + duration);
    }

    // Play melody sequence
    playMelody(notes, type, gainNode, loop, onEnd) {
        if (!this.ctx) return;
        this.stopMusic();

        let time = this.ctx.currentTime;
        const tempo = SIXTEENTH;

        const playSequence = () => {
            let t = this.ctx.currentTime + 0.05;
            for (const [note, duration] of notes) {
                const freq = NOTE_FREQ[note] || 0;
                const dur = duration * tempo;
                if (freq > 0) {
                    this.playNote(freq, dur * 0.9, type, gainNode, t, 0.3);
                }
                t += dur;
            }
            return t;
        };

        const endTime = playSequence();

        if (loop && !this.muted) {
            const totalDur = notes.reduce((sum, [, d]) => sum + d, 0) * tempo;
            this.musicPlaying = true;
            const scheduleNext = () => {
                if (!this.musicPlaying || this.muted) return;
                playSequence();
                this.musicTimerId = setTimeout(scheduleNext, totalDur * 1000);
            };
            this.musicTimerId = setTimeout(scheduleNext, totalDur * 1000);
        }

        if (onEnd) {
            const totalDur = notes.reduce((sum, [, d]) => sum + d, 0) * tempo;
            setTimeout(onEnd, totalDur * 1000);
        }
    }

    playTheme() {
        if (this.muted) return;
        this.stopMusic();
        // Play melody and bass together
        if (!this.ctx) return;

        const tempo = SIXTEENTH;
        let t = this.ctx.currentTime + 0.05;

        const melodyTotal = THEME_MELODY.reduce((sum, [, d]) => sum + d, 0);
        const bassTotal = THEME_BASS.reduce((sum, [, d]) => sum + d, 0);
        const maxTotal = Math.max(melodyTotal, bassTotal) * tempo;

        const scheduleAll = () => {
            let mt = this.ctx.currentTime + 0.05;
            for (const [note, duration] of THEME_MELODY) {
                const freq = NOTE_FREQ[note] || 0;
                const dur = duration * tempo;
                if (freq > 0) {
                    this.playNote(freq, dur * 0.9, 'square', this.musicGain, mt, 0.25);
                }
                mt += dur;
            }
            let bt = this.ctx.currentTime + 0.05;
            for (const [note, duration] of THEME_BASS) {
                const freq = NOTE_FREQ[note] || 0;
                const dur = duration * tempo;
                if (freq > 0) {
                    this.playNote(freq, dur * 0.9, 'triangle', this.musicGain, bt, 0.35);
                }
                bt += dur;
            }
        };

        scheduleAll();
        this.musicPlaying = true;
        this.musicTimerId = setTimeout(function loop() {
            if (!this.musicPlaying || this.muted) return;
            scheduleAll();
            this.musicTimerId = setTimeout(loop.bind(this), maxTotal * 1000);
        }.bind(this), maxTotal * 1000);
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicTimerId) {
            clearTimeout(this.musicTimerId);
            this.musicTimerId = null;
        }
    }

    // ---- Sound Effects ----
    playSfx(notes, type, volume) {
        if (!this.ctx || this.muted) return;
        let t = this.ctx.currentTime + 0.02;
        for (const [note, duration] of notes) {
            const freq = NOTE_FREQ[note] || (typeof note === 'number' ? note : 0);
            const dur = duration * SIXTEENTH;
            if (freq > 0) {
                this.playNote(freq, dur, type || 'square', this.sfxGain, t, volume || 0.3);
            }
            t += dur;
        }
    }

    sfxJump() {
        if (!this.ctx || this.muted) return;
        // Rising pitch
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(NOTE_FREQ['C5'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['G5'], t + 0.15);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.3, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    sfxJumpSuper() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(NOTE_FREQ['C4'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['A5'], t + 0.2);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.25, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    sfxCoin() {
        this.playSfx([
            ['B5', 2], ['E6', 4],
        ], 'square', 0.3);
    }

    sfxStomp() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(NOTE_FREQ['G4'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['C4'], t + 0.1);
        env.gain.setValueAtTime(0.3, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    sfxKick() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(NOTE_FREQ['A4'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['A2'], t + 0.15);
        env.gain.setValueAtTime(0.2, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    sfxPowerUp() {
        this.playSfx([
            ['G4', 1], ['G#4', 1], ['A4', 1], ['Bb4', 1],
            ['B4', 1], ['C5', 1], ['C#5', 1], ['D5', 1],
            ['Eb5', 1], ['E5', 1], ['F5', 1], ['F#5', 1],
            ['G5', 4],
        ], 'square', 0.3);
    }

    sfxPowerDown() {
        this.playSfx([
            ['G5', 1], ['F#5', 1], ['F5', 1], ['E5', 1],
            ['Eb5', 1], ['D5', 1], ['C#5', 1], ['C5', 1],
            ['B4', 1], ['Bb4', 1], ['A4', 1], ['G#4', 1],
            ['G4', 4],
        ], 'square', 0.3);
    }

    sfxPowerUpAppears() {
        this.playSfx([
            ['C4', 2], ['E4', 2], ['G4', 2], ['C5', 2],
            ['E5', 2], ['G5', 4],
        ], 'square', 0.25);
    }

    sfxBrickBreak() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        // Noise burst for brick breaking
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.2, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        noise.connect(env);
        env.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.2);
    }

    sfxBump() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(NOTE_FREQ['C4'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['G3'], t + 0.05);
        env.gain.setValueAtTime(0.2, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    sfxPipe() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(NOTE_FREQ['C5'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['C3'], t + 0.3);
        env.gain.setValueAtTime(0.2, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    sfxFlagpole() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        // Descending glissando
        const notes = ['G5', 'F#5', 'F5', 'E5', 'Eb5', 'D5', 'C#5', 'C5', 'B4', 'C5'];
        for (let i = 0; i < notes.length; i++) {
            const freq = NOTE_FREQ[notes[i]];
            const noteT = t + i * 0.03;
            const osc = this.ctx.createOscillator();
            const env = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            env.gain.setValueAtTime(0.2, noteT);
            env.gain.exponentialRampToValueAtTime(0.001, noteT + 0.04);
            osc.connect(env);
            env.connect(this.sfxGain);
            osc.start(noteT);
            osc.stop(noteT + 0.04);
        }
    }

    sfxDeath() {
        if (!this.ctx) return;
        this.stopMusic();
        if (this.muted) return;
        const tempo = SIXTEENTH * 1.5;
        let t = this.ctx.currentTime + 0.05;
        for (const [note, duration] of DEATH_MELODY) {
            const freq = NOTE_FREQ[note] || 0;
            const dur = duration * tempo;
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const env = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0, t);
                env.gain.linearRampToValueAtTime(0.3, t + 0.01);
                env.gain.exponentialRampToValueAtTime(0.001, t + dur);
                osc.connect(env);
                env.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + dur);
            }
            t += dur;
        }
    }

    sfxGameComplete() {
        if (!this.ctx) return;
        this.stopMusic();
        if (this.muted) return;
        const tempo = SIXTEENTH;
        let t = this.ctx.currentTime + 0.05;
        for (const [note, duration] of COMPLETE_MELODY) {
            const freq = NOTE_FREQ[note] || 0;
            const dur = duration * tempo;
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const env = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0, t);
                env.gain.linearRampToValueAtTime(0.25, t + 0.01);
                env.gain.exponentialRampToValueAtTime(0.001, t + dur);
                osc.connect(env);
                env.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + dur);
            }
            t += dur;
        }
    }

    sfxGameOver() {
        if (!this.ctx) return;
        this.stopMusic();
        if (this.muted) return;
        const tempo = SIXTEENTH * 1.5;
        let t = this.ctx.currentTime + 0.05;
        for (const [note, duration] of GAMEOVER_MELODY) {
            const freq = NOTE_FREQ[note] || 0;
            const dur = duration * tempo;
            if (freq > 0) {
                const osc = this.ctx.createOscillator();
                const env = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = freq;
                env.gain.setValueAtTime(0.25, t);
                env.gain.exponentialRampToValueAtTime(0.001, t + dur);
                osc.connect(env);
                env.connect(this.sfxGain);
                osc.start(t);
                osc.stop(t + dur);
            }
            t += dur;
        }
    }

    sfxFireball() {
        if (!this.ctx || this.muted) return;
        const t = this.ctx.currentTime + 0.02;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(NOTE_FREQ['C5'], t);
        osc.frequency.exponentialRampToValueAtTime(NOTE_FREQ['C3'], t + 0.1);
        env.gain.setValueAtTime(0.15, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(env);
        env.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    sfxOneUp() {
        this.playSfx([
            ['E5', 1], ['G5', 1], ['E6', 1], ['C6', 1],
            ['D6', 1], ['G6', 2],
        ], 'square', 0.3);
    }
}

const audio = new AudioManager();
