/**
 * Simulator adapter — generates realistic fake fNIRS + EEG data.
 * Used for development and demo without physical hardware.
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";

function randWalk(prev: number, min: number, max: number, step = 0.02): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

interface SimulatorParams {
  noiseLevel?: number;    // 0–1, scales random walk step size (default 0.3)
  trendStrength?: number; // 0–1, scales OxyHb upward drift per minute (default 0.5)
}

export class SimulatorAdapter implements DeviceAdapter {
  readonly deviceType = "simulator";
  readonly displayName = "Simulator";

  private _noiseLevel: number;
  private _trendStrength: number;

  private _connected = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _callbacks: Array<(sample: DeviceSample) => void> = [];
  private _startMs = 0;

  constructor(params: SimulatorParams = {}) {
    this._noiseLevel = Math.max(0, Math.min(1, params.noiseLevel ?? 0.3));
    this._trendStrength = Math.max(0, Math.min(1, params.trendStrength ?? 0.5));
  }

  // fNIRS state — realistic μM values (functional range ~±0.5 μM)
  private _oxyL = 0.05;
  private _oxyR = 0.04;
  private _deoxyL = -0.02;
  private _deoxyR = -0.03;

  // EEG band powers — relative normalized (0–1)
  private _delta = 0.35;
  private _theta = 0.40;
  private _alpha = 0.50;
  private _beta = 0.30;
  private _gamma = 0.15;

  async connect(): Promise<void> {
    this._connected = true;
    this._startMs = Date.now();

    this._interval = setInterval(() => {
      const elapsedMin = (Date.now() - this._startMs) / 60000;
      // Trend: noiseLevel 0→0.5 trendStrength, 1→5× trendStrength
      const trendRate = this._trendStrength * 0.02 * (1 + this._noiseLevel);
      const trend = Math.min(elapsedMin * trendRate, this._trendStrength * 0.2);
      // Noise: scales random walk step size. Divided by sqrt(10) for 10 Hz (vs 1 Hz baseline).
      const noise = (0.02 + this._noiseLevel * 0.08) * 0.316;

      // trend * 0.0002 = trend * 0.002 / 10 (10 samples per second now)
      this._oxyL = randWalk(this._oxyL + trend * 0.0002, -0.3, 0.8, noise);
      this._oxyR = randWalk(this._oxyR + trend * 0.0002, -0.3, 0.8, noise);
      // DeoxyHb inversely coupled (neurovascular coupling)
      this._deoxyL = randWalk(this._deoxyL - trend * 0.0001, -0.5, 0.3, noise * 0.8);
      this._deoxyR = randWalk(this._deoxyR - trend * 0.0001, -0.5, 0.3, noise * 0.8);

      this._delta = randWalk(this._delta, 0.1, 0.7, noise);
      this._theta = randWalk(this._theta, 0.1, 0.8, noise);
      this._alpha = randWalk(this._alpha, 0.1, 0.9, noise * 1.2);
      this._beta = randWalk(this._beta, 0.05, 0.7, noise * 0.9);
      this._gamma = randWalk(this._gamma, 0.02, 0.5, noise * 0.7);

      // Reward: prefrontal oxygenation-based (0–100)
      const oxyAvg = (this._oxyL + this._oxyR) / 2;
      const reward = Math.max(0, Math.min(100, 50 + oxyAvg * 80 + trend * 15));

      const sample: DeviceSample = {
        timestampMs: Date.now() - this._startMs,
        oxyHbLeft: Math.round(this._oxyL * 1000) / 1000,
        oxyHbRight: Math.round(this._oxyR * 1000) / 1000,
        deoxyHbLeft: Math.round(this._deoxyL * 1000) / 1000,
        deoxyHbRight: Math.round(this._deoxyR * 1000) / 1000,
        delta: Math.round(this._delta * 100) / 100,
        theta: Math.round(this._theta * 100) / 100,
        alpha: Math.round(this._alpha * 100) / 100,
        beta: Math.round(this._beta * 100) / 100,
        gamma: Math.round(this._gamma * 100) / 100,
        rewardScore: Math.round(reward * 10) / 10,
      };

      this._callbacks.forEach((cb) => cb(sample));
    }, 100); // 10 Hz — matches Mendi sample rate
  }

  async disconnect(): Promise<void> {
    if (this._interval) clearInterval(this._interval);
    this._connected = false;
  }

  isConnected(): boolean {
    return this._connected;
  }

  onSample(callback: (sample: DeviceSample) => void): () => void {
    this._callbacks.push(callback);
    return () => {
      this._callbacks = this._callbacks.filter((cb) => cb !== callback);
    };
  }
}
