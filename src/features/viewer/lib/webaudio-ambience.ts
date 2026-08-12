/**
 * Soft WebAudio pads for night ambience and place sound (footsteps / room tone).
 * No external assets required — see `public/audio/README.md` if adding CC0 files.
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

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  return buffer;
}

export class GalleryAmbienceEngine {
  private nightGain: GainNode | null = null;
  private roomGain: GainNode | null = null;
  private nightNodes: AudioNode[] = [];
  private roomNodes: AudioNode[] = [];
  private footstepTimer: number | null = null;
  private muted = false;
  private nightOn = false;
  private placeOn = false;
  private lastStepAt = 0;

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

  /** Call from walk loop when horizontal motion is detected. */
  noteMovement(isMoving: boolean): void {
    if (!isMoving || this.muted || !this.placeOn) return;
    const now = performance.now();
    if (now - this.lastStepAt < 420) return;
    this.lastStepAt = now;
    void this.playFootstep();
  }

  dispose(): void {
    this.stopKind("night");
    this.stopKind("room");
    if (this.footstepTimer != null) {
      window.clearTimeout(this.footstepTimer);
      this.footstepTimer = null;
    }
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

    if (this.nightGain) {
      this.nightGain.gain.setTargetAtTime(
        wantNight ? 0.028 : 0,
        ctx.currentTime,
        0.4,
      );
    }
    if (this.roomGain) {
      this.roomGain.gain.setTargetAtTime(
        wantRoom ? 0.012 : 0,
        ctx.currentTime,
        0.35,
      );
    }
  }

  private startNight(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const oscA = ctx.createOscillator();
    oscA.type = "sine";
    oscA.frequency.value = 110;
    const oscB = ctx.createOscillator();
    oscB.type = "sine";
    oscB.frequency.value = 164.81;
    const oscC = ctx.createOscillator();
    oscC.type = "triangle";
    oscC.frequency.value = 55;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;

    const mix = ctx.createGain();
    mix.gain.value = 0.45;
    oscA.connect(mix);
    oscB.connect(mix);
    oscC.connect(mix);
    mix.connect(filter);
    filter.connect(master);

    oscA.start();
    oscB.start();
    oscC.start();

    this.nightGain = master;
    this.nightNodes = [oscA, oscB, oscC, mix, filter, master];
  }

  private startRoom(ctx: AudioContext): void {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 3);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 280;
    filter.Q.value = 0.5;

    noise.connect(filter);
    filter.connect(master);
    noise.start();

    this.roomGain = master;
    this.roomNodes = [noise, filter, master];
  }

  private stopKind(kind: AmbienceKind): void {
    const nodes = kind === "night" ? this.nightNodes : this.roomNodes;
    for (const node of nodes) {
      try {
        if ("stop" in node && typeof (node as OscillatorNode).stop === "function") {
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

  private async playFootstep(): Promise<void> {
    const ctx = getCtx();
    if (!ctx || this.muted || !this.placeOn) return;
    await ensureRunning(ctx);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx, 0.08);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 180;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.14);
    noise.stop(now + 0.14);
  }
}

let singleton: GalleryAmbienceEngine | null = null;

export function getGalleryAmbienceEngine(): GalleryAmbienceEngine {
  if (!singleton) singleton = new GalleryAmbienceEngine();
  return singleton;
}
