export type ScaleReading = {
  grams: number;
  stable?: boolean;
  ts: number;
};

export interface ScaleTransport {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  onReading(cb: (r: ScaleReading) => void): void;
  isConnected(): boolean;
  tare(): void; // software tare offset (store internally)
  getOffset(): number; // current tare offset in grams
}
