import { ScaleTransport, ScaleReading } from './transport';

export class HIDScale implements ScaleTransport {
  private device?: HIDDevice;
  private connected = false;
  private readingCallback?: (r: ScaleReading) => void;
  private offset = 0;

  async connect(): Promise<void> {
    // TODO: Implement WebHID connection
    // - Request device with usagePage: 0x008d
    // - Parse incoming bytes to extract grams and stable flag
    // - Handle device disconnection
    throw new Error('HID transport not yet implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: Close HID device connection
    this.connected = false;
  }

  onReading(cb: (r: ScaleReading) => void): void {
    this.readingCallback = cb;
  }

  isConnected(): boolean {
    return this.connected;
  }

  tare(): void {
    // TODO: Implement tare functionality
    this.offset = 0;
  }

  getOffset(): number {
    return this.offset;
  }
}
