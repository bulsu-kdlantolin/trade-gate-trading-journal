/**
 * Institutional Audio Telemetry Synthesizer
 * Pure Web Audio API mathematical sound generation with zero external assets, zero latency,
 * and high-fidelity micro-acoustic envelopes tailored for trading terminal actions.
 */

let audioCtx: AudioContext | null = null;
const AUDIO_STORAGE_KEY = 'tradegate_audio_enabled';

/**
 * Check if audio telemetry is enabled by user preference (defaults to true).
 */
export function isAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(AUDIO_STORAGE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

/**
 * Update audio telemetry preference and notify listeners.
 */
export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('tradegate_audio_changed', { detail: { enabled } }));
  } catch {
    // Fail silently
  }
}

/**
 * Toggle audio telemetry preference.
 */
export function toggleAudioEnabled(): boolean {
  const next = !isAudioEnabled();
  setAudioEnabled(next);
  if (next) {
    playMicroTick();
  }
  return next;
}

/**
 * Safe AudioContext singleton initialization.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!isAudioEnabled()) return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => { });
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 1. Micro-Tick: Ultra-subtle tactile click for chips, minor toggles, timeframe/session buttons.
 */
export function playMicroTick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.015);

    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.015);
  } catch {
    // Fail silently
  }
}

/**
 * 2. Rule Checkbox: Subtle tactile click when checking/unchecking rules.
 */
export function playCheckboxTick(checked: boolean = true): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (checked) {
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.024);
      gain.gain.setValueAtTime(0.028, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.024);
    } else {
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.018);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.018);
    }
  } catch {
    // Fail silently
  }
}

/**
 * 3. Pre-Trade Gate Unlocked: Harmonic major triad arpeggio (C5 -> E5 -> G5) resonance.
 */
export function playGateUnlockSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chords = [
      { freq: 523.25, time: 0.0, dur: 0.09, gain: 0.035 },
      { freq: 659.25, time: 0.035, dur: 0.1, gain: 0.038 },
      { freq: 783.99, time: 0.07, dur: 0.14, gain: 0.042 },
    ];

    chords.forEach(({ freq, time, dur, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch {
    // Fail silently
  }
}

/**
 * 4. Pre-Trade Gate Re-Locked: Damped wooden click when mandatory rules are broken.
 */
export function playGateLockSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  } catch {
    // Fail silently
  }
}

/**
 * 5. Trade Direction Toggle: Crisp directional micro-sound.
 */
export function playDirectionToggle(dir: 'Long' | 'Short'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (dir === 'Long') {
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.022);
    } else {
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.022);
    }

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.022);
  } catch {
    // Fail silently
  }
}

/**
 * 6. Trade Logged: Institutional double-harmonic confirmation chime.
 */
export function playTradeLoggedSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Harmonic 1: E5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.04, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Harmonic 2: B5 octave fifth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.05);
    gain2.gain.setValueAtTime(0.045, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.16);
  } catch {
    // Fail silently
  }
}

/**
 * 7. Modal Open: Subtle airy ascending pop.
 */
export function playModalOpen(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.026);

    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.026);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.026);
  } catch {
    // Fail silently
  }
}

/**
 * 8. Modal Close: Soft descending dismissal tick.
 */
export function playModalClose(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.02);

    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  } catch {
    // Fail silently
  }
}

/**
 * 9. Success Action: Warm rising double-chime (Save, Deposit, Update, Export).
 */
export function playSuccessChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.035, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.045); // A5
    gain2.gain.setValueAtTime(0.04, now + 0.045);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.045);
    osc2.stop(now + 0.13);
  } catch {
    // Fail silently
  }
}

/**
 * 10. Danger / Delete Action: Low-frequency metallic damped thud.
 */
export function playDangerAction(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    gain.gain.setValueAtTime(0.028, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Fail silently
  }
}

/**
 * 11. Tab Switch: Minimalist micro-pulse feeling like an institutional hardware switch.
 */
export function playTabSwitch(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.012);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.012);
  } catch {
    // Fail silently
  }
}

/**
 * 12. Calendar Day Selection: Tactile click when picking a date on the PnL calendar.
 */
export function playCalendarDayClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.018);

    gain.gain.setValueAtTime(0.024, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.018);
  } catch {
    // Fail silently
  }
}

/**
 * 13. Command Palette Open: High-tech dual-frequency avionic sweep.
 */
export function playCommandPaletteOpen(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.03);

    gain.gain.setValueAtTime(0.024, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Fail silently
  }
}

