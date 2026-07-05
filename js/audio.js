let audioCtx = null;
let isMutedState = false;

/**
 * Initializes the AudioContext lazily on user interaction to satisfy browser security policies.
 */
export function initAudio() {
    if (audioCtx) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        
        // Load initial mute state from local storage
        const stored = window.localStorage.getItem('boggleMuted');
        isMutedState = stored === 'true';
    }
}

/**
 * Toggles the mute state and stores the preference.
 * @returns {boolean} The new mute state (true if muted, false otherwise).
 */
export function toggleMute() {
    initAudio();
    isMutedState = !isMutedState;
    window.localStorage.setItem('boggleMuted', isMutedState.toString());
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    return isMutedState;
}

/**
 * Checks if the game sounds are muted.
 * @returns {boolean}
 */
export function isMuted() {
    const stored = window.localStorage.getItem('boggleMuted');
    if (stored !== null) {
        isMutedState = stored === 'true';
    }
    return isMutedState;
}

/**
 * Helper to play a single oscillator tone with parameters.
 */
function playOscillator(type, startFreq, endFreq, duration, volume = 0.1, delay = 0) {
    if (!audioCtx) initAudio();
    if (!audioCtx || isMuted()) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq && endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    // Soft ramp down to avoid clicks
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + duration);
}

/**
 * Clean click/pop sound when drawing/highlighting tiles.
 */
export function playClick() {
    playOscillator('triangle', 800, 150, 0.05, 0.15);
}

/**
 * A satisfying chime arpeggio (C5 -> E5 -> G5 -> C6) for a correct word.
 */
export function playChime() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const duration = 0.22;
    const spacing = 0.06;
    
    notes.forEach((freq, idx) => {
        playOscillator('sine', freq, freq, duration, 0.06, idx * spacing);
    });
}

/**
 * A low frequency buzz for an incorrect/wrong word.
 */
export function playBuzz() {
    playOscillator('sawtooth', 130, 70, 0.22, 0.08);
}

/**
 * A clean tick sound for the final 10 seconds of the timer.
 */
export function playTick() {
    playOscillator('triangle', 1500, 1200, 0.02, 0.08);
}

/**
 * A rich, detuned buzzer sound for the game-over event.
 */
export function playBuzzer() {
    if (!audioCtx) initAudio();
    if (!audioCtx || isMuted()) return;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const duration = 0.55;

    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now);

    const osc2 = audioCtx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(112.5, now);

    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    const masterGain = audioCtx.createGain();

    gain1.gain.setValueAtTime(0.06, now);
    gain2.gain.setValueAtTime(0.06, now);

    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
}
