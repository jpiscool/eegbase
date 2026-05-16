/**
 * Abstract device adapter interface.
 * Every supported device (Mendi, Muse, Simulator) implements this.
 */

export interface DeviceSample {
  timestampMs: number;
  oxyHbLeft?: number;
  oxyHbRight?: number;
  deoxyHbLeft?: number;
  deoxyHbRight?: number;
  delta?: number;
  theta?: number;
  alpha?: number;
  beta?: number;
  gamma?: number;
  rewardScore?: number;
  heartRate?: number;   // BPM
  hrvRmssd?: number;    // RMSSD in ms

  // Mendi-derived auxiliaries (also populated by the simulator so dashboard
  // widgets keyed to these fields render in demo mode without hardware).
  temperatureC?: number;        // Scalp temperature from Mendi temp sensor
  accelMag?: number;            // Acceleration magnitude in g (1.0 = at rest)
  accelX?: number;              // Accelerometer X axis in g (Mendi IMU)
  accelY?: number;              // Accelerometer Y axis in g
  accelZ?: number;              // Accelerometer Z axis in g
  stillness?: number;           // 0-100 derived stillness score (100 = motionless)
  pulsePpg?: number;            // AC-component of forehead PPG (unitless, centred at 0)
  pulseHrBpm?: number;          // BPM derived from the pulse optode
  pulseHrvRmssd?: number;       // HRV (RMSSD ms) from the pulse-optode IBIs
  signalQualityL?: number;      // 0-100 left optode coupling quality
  signalQualityR?: number;      // 0-100 right optode coupling quality
  signalQualityP?: number;      // 0-100 pulse optode coupling quality
  ambientLevel?: number;        // 0-100 ambient-light interference (lower = better)

  raw?: Record<string, unknown>;
}

export interface DeviceAdapter {
  readonly deviceType: string;
  readonly displayName: string;

  /** Connect to the device (BLE, WebSocket, HTTP, etc.) */
  connect(): Promise<void>;

  /** Disconnect and clean up */
  disconnect(): Promise<void>;

  /** Returns true when a live connection is active */
  isConnected(): boolean;

  /**
   * Subscribe to incoming samples.
   * Returns an unsubscribe function.
   */
  onSample(callback: (sample: DeviceSample) => void): () => void;
}
