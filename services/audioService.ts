let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return null;
        }
    }
    return audioContext;
};

// This function must be called inside a user gesture handler (e.g., a click event)
// to ensure the AudioContext can be resumed if it was suspended by the browser's autoplay policy.
const ensureAudioContextResumed = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
}

/**
 * Plays a pleasant, rising tone for a correct answer.
 */
export const playCorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01); // Ramp up volume

    // A pleasant C5 to G5 chord-like sound
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5

    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2); // Fade out
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
};

/**
 * Plays a low, "buzzy" tone for an incorrect answer.
 */
export const playIncorrectSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, ctx.currentTime); // Low buzz
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01); // Ramp up
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25); // Fade out

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
};

/**
 * Plays a twinkling sound for a fun fact.
 */
export const playFunFactSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    ensureAudioContextResumed();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    // Create a "twinkle" effect
    const freqs = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
    freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        osc.connect(gain);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
    });
};
