// Audio synthesizer using Web Audio API for high-precision, zero-latency feedback

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private tickType: 'click' | 'wooden' | 'electronic' = 'click';
  private fanfareType: 'cheer' | 'trumpet' | 'synth' = 'trumpet';
  private speechEnabled: boolean = true;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setTickType(type: 'click' | 'wooden' | 'electronic') {
    this.tickType = type;
  }

  public setFanfareType(type: 'cheer' | 'trumpet' | 'synth') {
    this.fanfareType = type;
  }

  public setSpeechEnabled(enabled: boolean) {
    this.speechEnabled = enabled;
  }

  public playTick(speedFactor: number = 1) {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (this.tickType === 'wooden') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 * (0.8 + speedFactor * 0.4), now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);
      } else if (this.tickType === 'electronic') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 * (0.9 + speedFactor * 0.2), now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);
      } else {
        // Crisp mechanical click
        osc.type = 'square';
        osc.frequency.setValueAtTime(600 * (0.9 + speedFactor * 0.3), now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.02);
      }

      const baseGain = 0.18 * this.volume;
      gain.gain.setValueAtTime(baseGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // AudioContext could be blocked by browser policy until user gesture
    }
  }

  public playFanfare() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.18 }, // G5
        { f: 1046.50, d: 0.55 }, // C6
      ];

      let startTime = this.ctx.currentTime + 0.05;
      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = this.fanfareType === 'synth' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(note.f, startTime);

        const currentVol = 0.25 * this.volume;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(currentVol, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d);
        startTime += note.d * 0.85;
      });
    } catch {
      // AudioContext failure recovery
    }
  }

  public playTimerWarning() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.15 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Safe catch
    }
  }

  public playTimerFinished() {
    if (this.isMuted || this.volume <= 0) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [880, 1100, 1320].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const t = now + idx * 0.12;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22 * this.volume, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.26);
      });
    } catch {
      // Safe catch
    }
  }

  public speak(text: string) {
    if (!this.speechEnabled || this.isMuted || typeof window === 'undefined') return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.05;
        utterance.volume = this.volume;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Ignore speech failures
    }
  }
}

export const audioManager = new AudioManager();
