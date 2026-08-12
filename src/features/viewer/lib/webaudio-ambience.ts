/**
 * Soft WebAudio pads for night ambience and place sound (footsteps / room tone).
 * Procedural only — see `public/audio/README.md` if adding CC0 files later.
 *
 * Museum goal: barely-there hall hush + soft stone steps. Never a music bed.
 */

type AmbienceKind = "night" | "room";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AC();
  }
  return sharedCtx;
}

async function ensureRunning(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      /* autoplay policy */
    }
  }
}

/** White noise (footstep grit). */
function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Soft 1/f-ish noise for large-room air (less harsh than white). */
function createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink =
      b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11;
  }
  return buffer;
}

/**
 * Step cadence from horizontal speed (metres per frame @ ~60fps).
 * Slow stroll ≈ 520–580ms; brisk walk ≈ 380–420ms. Night walks a touch slower.
 */
export function footstepIntervalMs(
  speedPerFrame: number,
  nightLike = false,
): number {
  const approxMps = Math.min(2.4, Math.max(0, speedPerFrame * 60));
  const base = 560 - approxMps * 70;
  const nightBias = nightLike ? 40 : 0;
  return Math.round(Math.min(620, Math.max(360, base + nightBias)));
}

export class GalleryAmbienceEngine {
  private nightGain: GainNode | null = null;
  private roomGain: GainNode | null = null;
  private nightNodes: AudioNode[] = [];
  private roomNodes: AudioNode[] = [];
  private muted = false;
  private nightOn = false;
  private placeOn = false;
  private lastStepAt = 0;
  private stepSide = 1;
  private noiseCache: AudioBuffer | null = null;
  private pinkCache: AudioBuffer | null = null;

  async setMuted(muted: boolean): Promise<void> {
    this.muted = muted;
    await this.sync();
  }

  async setNightAmbience(on: boolean): Promise<void> {
    this.nightOn = on;
    await this.sync();
  }

  async setPlaceSound(on: boolean): Promise<void> {
    this.placeOn = on;
    await this.sync();
  }

  /**
   * Call from walk loop when horizontal motion is detected.
   * `speedPerFrame` is metres moved this frame (horizontal).
   */
  noteMovement(isMoving: boolean, speedPerFrame = 0): void {
    if (!isMoving || this.muted || !this.placeOn) return;
    const now = performance.now();
    const gap = footstepIntervalMs(speedPerFrame, this.nightOn);
    if (now - this.lastStepAt < gap) return;
    this.lastStepAt = now;
    void this.playFootstep(speedPerFrame);
  }

  dispose(): void {
    this.stopKind("night");
    this.stopKind("room");
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseCache) this.noiseCache = createNoiseBuffer(ctx, 0.12);
    return this.noiseCache;
  }

  private pinkBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.pinkCache) this.pinkCache = createPinkNoiseBuffer(ctx, 4);
    return this.pinkCache;
  }

  private async sync(): Promise<void> {
    const ctx = getCtx();
    if (!ctx) return;
    await ensureRunning(ctx);

    const wantNight = this.nightOn && !this.muted;
    const wantRoom = this.placeOn && !this.muted;

    if (wantNight && !this.nightGain) this.startNight(ctx);
    if (!wantNight) this.stopKind("night");

    if (wantRoom && !this.roomGain) this.startRoom(ctx);
    if (!wantRoom) this.stopKind("room");

    // Night pad: quieter hush, not a musical drone.
    if (this.nightGain) {
      this.nightGain.gain.setTargetAtTime(
        wantNight ? 0.016 : 0,
        ctx.currentTime,
        0.55,
      );
    }
    // Day/always room tone: barely audible stone-hall air.
    if (this.roomGain) {
      const level = wantRoom ? (this.nightOn ? 0.007 : 0.009) : 0;
      this.roomGain.gain.setTargetAtTime(level, ctx.currentTime, 0.45);
    }
  }

  private startNight(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // Soft low rumble — filtered noise, not harmonic fifths.
    const noise = ctx.createBufferSource();
    noise.buffer = this.pinkBuffer(ctx);
    noise.loop = true;

    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 160;
    low.Q.value = 0.55;

    const mid = ctx.createBiquadFilter();
    mid.type = "bandpass";
    mid.frequency.value = 90;
    mid.Q.value = 0.6;

    const mix = ctx.createGain();
    mix.gain.value = 0.55;

    noise.connect(low);
    low.connect(mid);
    mid.connect(mix);
    mix.connect(master);
    noise.start();

    this.nightGain = master;
    this.nightNodes = [noise, low, mid, mix, master];
  }

  private startRoom(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = this.pinkBuffer(ctx);
    noise.loop = true;

    // Wide, dark hall air — cut highs hard so it never hiss-sings.
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 220;
    low.Q.value = 0.45;

    const highcut = ctx.createBiquadFilter();
    highcut.type = "lowshelf";
    highcut.frequency.value = 90;
    highcut.gain.value = 3;

    noise.connect(highcut);
    highcut.connect(low);
    low.connect(master);
    noise.start();

    this.roomGain = master;
    this.roomNodes = [noise, highcut, low, master];
  }

  private stopKind(kind: AmbienceKind): void {
    const nodes = kind === "night" ? this.nightNodes : this.roomNodes;
    for (const node of nodes) {
      try {
        if (
          "stop" in node &&
          typeof (node as OscillatorNode).stop === "function"
        ) {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        /* already stopped */
      }
    }
    if (kind === "night") {
      this.nightNodes = [];
      this.nightGain = null;
    } else {
      this.roomNodes = [];
      this.roomGain = null;
    }
  }

  private async playFootstep(speedPerFrame: number): Promise<void> {
    const ctx = getCtx();
    if (!ctx || this.muted || !this.placeOn) return;
    await ensureRunning(ctx);

    const now = ctx.currentTime;
    const night = this.nightOn;
    const speed = Math.min(2.2, Math.max(0.2, speedPerFrame * 60));
    // Quieter overall; night even softer. Peak stays under museum-whisper.
    const peak = (night ? 0.0075 : 0.01) * (0.75 + speed * 0.12);

    // Soft stone thump (very short, low).
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(68 + Math.random() * 18, now);
    thump.frequency.exponentialRampToValueAtTime(36, now + 0.07);

    // Shoe grit on stone — brief noise burst.
    const grit = ctx.createBufferSource();
    grit.buffer = this.noiseBuffer(ctx);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = night ? 140 : 165;
    band.Q.value = 0.7;

    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 380;

    const pan = ctx.createStereoPanner();
    this.stepSide *= -1;
    pan.pan.setValueAtTime(this.stepSide * (0.18 + Math.random() * 0.12), now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    thump.connect(low);
    grit.connect(band);
    band.connect(low);
    low.connect(pan);
    pan.connect(gain);
    gain.connect(ctx.destination);

    thump.start(now);
    grit.start(now);
    thump.stop(now + 0.12);
    grit.stop(now + 0.12);
  }
}

let singleton: GalleryAmbienceEngine | null = null;

export function getGalleryAmbienceEngine(): GalleryAmbienceEngine {
  if (!singleton) singleton = new GalleryAmbienceEngine();
  return singleton;
}
