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

  // HRV / HR state — realistic resting range
  private _hr = 68.0;     // BPM
  private _rmssd = 45.0;  // ms

  // Mendi-auxiliary state (temperature, motion, pulse PPG, signal quality,
  // ambient). All gently random-walked so the new dashboard widgets render
  // plausible motion on the demo.
  private _temperatureC = 33.4;        // typical scalp temp ~33–35 °C
  private _accelMag = 1.001;           // ~1.0 g at rest
  private _stillness = 92.0;
  private _accelXSim = 0.05;           // axis components in g (Y carries gravity)
  private _accelYSim = 0.998;
  private _accelZSim = -0.03;
  private _ppgPhase = 0;               // radians, for sinusoidal pulse
  private _pulseBpm = 66.0;
  private _pulseRmssd = 42.0;          // ms — typical resting RMSSD
  private _sigQL = 87.0;
  private _sigQR = 84.0;
  private _sigQP = 91.0;
  private _ambient = 18.0;             // % ambient interference

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

      // HRV / HR — realistic walk; RMSSD inversely correlated with HR
      this._hr = randWalk(this._hr, 52, 95, 0.5);
      this._rmssd = randWalk(this._rmssd, 18, 90, 1.2);

      // ── Mendi-auxiliary fields ─────────────────────────────────────────
      this._temperatureC = randWalk(this._temperatureC, 32.5, 34.8, 0.04);
      // Resting accel hovers around 1g with small jitter
      this._accelMag = randWalk(this._accelMag, 0.96, 1.06, 0.012);
      const accelDev = Math.abs(this._accelMag - 1.0);
      this._stillness = Math.max(0, Math.min(100, 100 - accelDev * 800));
      // Synthetic accel components: gravity primarily on Y (headband upright),
      // small drift on X (pitch) and Z (roll) to make head-pose widget move.
      this._accelXSim = randWalk(this._accelXSim, -0.18, 0.18, 0.01);
      this._accelZSim = randWalk(this._accelZSim, -0.18, 0.18, 0.01);
      // Y axis carries gravity, the remainder accounted for by jitter
      const ySign = Math.sign(this._accelYSim || 1);
      const yMag = Math.sqrt(Math.max(0, this._accelMag * this._accelMag - this._accelXSim * this._accelXSim - this._accelZSim * this._accelZSim));
      this._accelYSim = ySign * yMag;
      // Synthetic PPG: ~1 Hz sine plus tiny noise, modulated by pulseBpm
      this._pulseBpm = randWalk(this._pulseBpm, 55, 78, 0.2);
      this._pulseRmssd = randWalk(this._pulseRmssd, 22, 75, 0.8);
      this._ppgPhase += (this._pulseBpm / 60) * 2 * Math.PI * 0.1; // 10 Hz tick
      const ppg = Math.sin(this._ppgPhase) * 0.85 + (Math.random() - 0.5) * 0.1;
      // Signal quality drifts with optode coupling
      this._sigQL = randWalk(this._sigQL, 70, 96, 0.6);
      this._sigQR = randWalk(this._sigQR, 70, 96, 0.6);
      this._sigQP = randWalk(this._sigQP, 75, 98, 0.5);
      this._ambient = randWalk(this._ambient, 8, 45, 0.4);

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
        heartRate: Math.round(this._hr * 10) / 10,
        hrvRmssd: Math.round(this._rmssd * 10) / 10,
        temperatureC: Math.round(this._temperatureC * 100) / 100,
        accelMag: Math.round(this._accelMag * 1000) / 1000,
        accelX: Math.round(this._accelXSim * 1000) / 1000,
        accelY: Math.round(this._accelYSim * 1000) / 1000,
        accelZ: Math.round(this._accelZSim * 1000) / 1000,
        stillness: Math.round(this._stillness),
        pulsePpg: Math.round(ppg * 1000) / 1000,
        pulseHrBpm: Math.round(this._pulseBpm),
        pulseHrvRmssd: Math.round(this._pulseRmssd),
        signalQualityL: Math.round(this._sigQL),
        signalQualityR: Math.round(this._sigQR),
        signalQualityP: Math.round(this._sigQP),
        ambientLevel: Math.round(this._ambient),
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
