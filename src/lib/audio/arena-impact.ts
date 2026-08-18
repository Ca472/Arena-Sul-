export const ARENA_SOUND_PREFERENCE_KEY = "arena-sul-loader-sound";
export const ARENA_AUDIO_READY_EVENT = "arena-sul:audio-ready";

type AudioContextConstructor = new (
  contextOptions?: AudioContextOptions,
) => AudioContext;

type ArenaAudioWindow = Window & {
  webkitAudioContext?: AudioContextConstructor;
  __arenaSulAudioContext?: AudioContext;
};

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as ArenaAudioWindow;
  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

export function getExistingArenaAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const context = (window as ArenaAudioWindow).__arenaSulAudioContext;
  return context?.state === "closed" ? null : (context ?? null);
}

export function discardArenaAudioContext() {
  if (typeof window === "undefined") {
    return;
  }

  const audioWindow = window as ArenaAudioWindow;
  const context = audioWindow.__arenaSulAudioContext;
  audioWindow.__arenaSulAudioContext = undefined;

  if (context && context.state !== "closed") {
    void context.close().catch(() => {
      // The replacement context can still be created on the next gesture.
    });
  }
}

export async function unlockArenaAudio() {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as ArenaAudioWindow;
  const AudioContextClass = getAudioContextConstructor();

  if (!AudioContextClass) {
    return null;
  }

  let context = getExistingArenaAudioContext();

  if (!context) {
    try {
      context = new AudioContextClass({ latencyHint: "interactive" });
    } catch {
      context = new AudioContextClass();
    }

    audioWindow.__arenaSulAudioContext = context;
  }

  if (context.state !== "running") {
    await context.resume();
  }

  return context.state === "running" ? context : null;
}

export function isArenaSoundEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return sessionStorage.getItem(ARENA_SOUND_PREFERENCE_KEY) === "on";
  } catch {
    return false;
  }
}

export function setArenaSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (enabled) {
      sessionStorage.setItem(ARENA_SOUND_PREFERENCE_KEY, "on");
    } else {
      sessionStorage.removeItem(ARENA_SOUND_PREFERENCE_KEY);
    }
  } catch {
    // The visual loader remains fully functional when storage is unavailable.
  }
}

export function scheduleArenaImpact(
  context: AudioContext,
  delaySeconds = 0,
): () => void {
  if (
    context.state !== "running" ||
    typeof document === "undefined" ||
    document.visibilityState !== "visible"
  ) {
    return () => undefined;
  }

  const start = context.currentTime + Math.max(0, delaySeconds) + 0.012;
  const compressor = context.createDynamicsCompressor();
  const master = context.createGain();
  let disconnected = false;

  const disconnect = () => {
    if (disconnected) {
      return;
    }

    disconnected = true;
    master.disconnect();
    compressor.disconnect();
  };

  compressor.threshold.setValueAtTime(-20, start);
  compressor.knee.setValueAtTime(18, start);
  compressor.ratio.setValueAtTime(6, start);
  compressor.attack.setValueAtTime(0.002, start);
  compressor.release.setValueAtTime(0.12, start);

  master.gain.setValueAtTime(0.0001, start);
  master.gain.exponentialRampToValueAtTime(0.3, start + 0.008);
  master.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
  master.connect(compressor);
  compressor.connect(context.destination);

  const noiseDuration = 0.14;
  const noiseBuffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * noiseDuration),
    context.sampleRate,
  );
  const noiseData = noiseBuffer.getChannelData(0);

  for (let index = 0; index < noiseData.length; index += 1) {
    const decay = 1 - index / noiseData.length;
    noiseData[index] = (Math.random() * 2 - 1) * decay;
  }

  const noise = context.createBufferSource();
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noise.buffer = noiseBuffer;
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(1450, start);
  noiseFilter.Q.setValueAtTime(0.72, start);
  noiseGain.gain.setValueAtTime(0.5, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + noiseDuration);
  noise.connect(noiseFilter).connect(noiseGain).connect(master);

  const bodyTone = context.createOscillator();
  const bodyGain = context.createGain();

  bodyTone.type = "sine";
  bodyTone.frequency.setValueAtTime(172, start);
  bodyTone.frequency.exponentialRampToValueAtTime(86, start + 0.19);
  bodyGain.gain.setValueAtTime(0.48, start);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  bodyTone.connect(bodyGain).connect(master);

  const stringTone = context.createOscillator();
  const stringFilter = context.createBiquadFilter();
  const stringGain = context.createGain();

  stringTone.type = "triangle";
  stringTone.frequency.setValueAtTime(920, start);
  stringTone.frequency.exponentialRampToValueAtTime(470, start + 0.085);
  stringFilter.type = "highpass";
  stringFilter.frequency.setValueAtTime(320, start);
  stringGain.gain.setValueAtTime(0.18, start);
  stringGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);
  stringTone.connect(stringFilter).connect(stringGain).connect(master);

  noise.start(start);
  bodyTone.start(start);
  stringTone.start(start);
  noise.stop(start + noiseDuration);
  stringTone.stop(start + 0.1);
  bodyTone.stop(start + 0.21);

  bodyTone.addEventListener(
    "ended",
    disconnect,
    { once: true },
  );

  return () => {
    for (const source of [noise, bodyTone, stringTone]) {
      try {
        source.stop();
      } catch {
        // A source that has already ended needs no further cleanup.
      }
    }

    disconnect();
  };
}
