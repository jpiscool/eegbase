/**
 * Simulator adapter — generates realistic fake fNIRS + EEG data.
 * Used for development and demo without physical hardware.
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";

function randWalk(prev: number, min: number, max: number, step = 0.02): number {
  const next = prev + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

export class SimulatorAdapter implements DeviceAdapter {
  readonly deviceType = "simulator";
  readonly displayName = "Simulator";

  private _connected = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _callbacks: Array<(sample: DeviceSample) => void> = [];
  private _startMs = 0;

  // Simulated state
  private _oxyL = 0.5;
  private _oxyR = 0.5;
  private _deoxyL = 0.3;
  private _deoxyR = 0.3;
  private _theta = 0.4;
  private _alpha = 0.5;
  private _beta = 0.3;

  async connect(): Promise<void> {
    this._connected = true;
    this._startMs = Date.now();

    this._interval = setInterval(() => {
      // Random-walk all channels
      this._oxyL = randWalk(this._oxyL, 0, 1, 0.03);
      this._oxyR = randWalk(this._oxyR, 0, 1, 0.03);
      this._deoxyL = randWalk(this._deoxyL, 0, 1, 0.02);
      this._deoxyR = randWalk(this._deoxyR, 0, 1, 0.02);
      this._theta = randWalk(this._theta, 0, 1, 0.04);
      this._alpha = randWalk(this._alpha, 0, 1, 0.04);
      this._beta = randWalk(this._beta, 0, 1, 0.03);

      const reward = ((this._oxyL + this._oxyR) / 2) * 100;

      const sample: DeviceSample = {
        timestampMs: Date.now() - this._startMs,
        oxyHbLeft: this._oxyL,
        oxyHbRight: this._oxyR,
        deoxyHbLeft: this._deoxyL,
        deoxyHbRight: this._deoxyR,
        theta: this._theta,
        alpha: this._alpha,
        beta: this._beta,
        rewardScore: reward,
      };

      this._callbacks.forEach((cb) => cb(sample));
    }, 1000); // 1 Hz — matches Mendi's reported update rate
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
