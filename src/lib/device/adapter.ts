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
