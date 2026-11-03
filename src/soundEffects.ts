/**
 * Sound and Haptic Vibration Effects for Madrasa Seating
 * Uses Web Audio API and Navigator Vibration API for instant, low-latency, zero-dependency feedback.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Trigger subtle haptic vibration on supporting devices (phones/tablets/touchpads)
 */
export function triggerHaptic(pattern: number | number[] = 25) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported vibration
  }
}

/**
 * Snappy click/pop sound when selecting a seat
 */
export function playSelectSound() {
  triggerHaptic(20);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(560, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Super satisfying quick swoosh/chime when swap succeeds
 */
export function playSwapSuccessSound() {
  triggerHaptic([20, 35, 30]);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: 520Hz quick blip
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.exponentialRampToValueAtTime(740, now + 0.07);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // Tone 2: 880Hz crystal chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.16);
    gain2.gain.setValueAtTime(0.22, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.22);
  } catch {
    // Ignore audio error
  }
}

/**
 * Warning sound when same class students are manually placed on the same bench
 */
export function playSameClassWarningSound() {
  triggerHaptic([40, 50, 40]);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Double warning beep
    for (let i = 0; i < 2; i++) {
      const startTime = now + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, startTime);
      osc.frequency.setValueAtTime(280, startTime + 0.06);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    }
  } catch {
    // Ignore
  }
}

/**
 * Cancel selection sound
 */
export function playCancelSound() {
  triggerHaptic(15);
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(360, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // Ignore
  }
}
