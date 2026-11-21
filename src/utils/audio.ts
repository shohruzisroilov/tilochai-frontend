/**
 * Audio feedback utilities for Tiloch.
 *
 * Uses the Web Audio API to synthesize clean, crisp chimes with zero network
 * dependencies and zero latency.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Pre-warms the AudioContext on first user interaction so subsequent sound effects
 * (like the match "ting!" chime) play immediately without browser autoplay delay.
 */
export function warmAudio() {
  getAudioContext();
}

/**
 * Plays a bright, pleasant "ting!" bell chime when a speaking partner is matched.
 */
export function playMatchChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell chime: Primary frequency (E6: 1318.5Hz) + sparkling overtone (E7: 2637Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(2637.02, now);

    // Fast attack (15ms) and smooth exponential decay
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.015);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn('playMatchChime failed:', err);
  }
}
