/**
 * Mendi adapter — placeholder until SDK/API access is granted.
 * Will be implemented after the May 11th call with Mustafa.
 */

import type { DeviceAdapter, DeviceSample } from "./adapter";

export class MendiAdapter implements DeviceAdapter {
  readonly deviceType = "mendi";
  readonly displayName = "Mendi";

  async connect(): Promise<void> {
    throw new Error(
      "Mendi adapter not yet implemented — pending SDK access from Mendi team."
    );
  }

  async disconnect(): Promise<void> {}

  isConnected(): boolean {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSample(_callback: (sample: DeviceSample) => void): () => void {
    return () => {};
  }
}
