import { ScaleTransport, ScaleReading } from './transport';

export const MOCK_BASELINE_GRAMS = 120;

export class MockScale implements ScaleTransport {
  private connected = false;
  private readingCallback?: (r: ScaleReading) => void;
  private intervalId?: NodeJS.Timeout;
  private offset = 0;
  private currentWeight = MOCK_BASELINE_GRAMS;
  private stableCount = 0;

  async connect(): Promise<void> {
    if (this.connected) return;
    
    this.connected = true;
    this.startSimulation();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  onReading(cb: (r: ScaleReading) => void): void {
    this.readingCallback = cb;
  }

  isConnected(): boolean {
    return this.connected;
  }

  tare(): void {
    this.offset = this.currentWeight;
  }

  getOffset(): number {
    return this.offset;
  }

  private startSimulation(): void {
    this.intervalId = setInterval(() => {
      if (!this.connected || !this.readingCallback) return;

      // Simulate minor jitter
      const jitter = (Math.random() - 0.5) * 2; // ±1g jitter
      this.currentWeight += jitter;

      // Occasionally set stable=true
      this.stableCount++;
      const isStable = this.stableCount % 10 === 0; // Every 1.5s (10 * 150ms)

      const reading: ScaleReading = {
        grams: Math.max(0, this.currentWeight - this.offset),
        stable: isStable,
        ts: Date.now(),
      };

      this.readingCallback(reading);
    }, 150);
  }
}
