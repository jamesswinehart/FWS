// WebSerial API types (not available in all environments)
declare global {
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
  
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
  }
}

import { ScaleTransport, ScaleReading } from './transport';

export class SerialScale implements ScaleTransport {
  private port?: SerialPort;
  private reader?: ReadableStreamDefaultReader<Uint8Array>;
  private connected = false;
  private readingCallback?: (r: ScaleReading) => void;
  private offset = 0;

  async connect(): Promise<void> {
    // TODO: Implement WebSerial connection
    // - Request port with 9600 baud
    // - Parse ASCII lines like "123.4 g" or "ST,GS, 0.500 kg"
    // - Handle port disconnection
    throw new Error('Serial transport not yet implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: Close serial port connection
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
