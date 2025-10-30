// WebHID API types (not available in all environments)
declare global {
  interface Navigator {
    hid?: {
      requestDevice(options: { filters: Array<{ usagePage: number }> }): Promise<HIDDevice[]>;
      getDevices(): Promise<HIDDevice[]>;
    };
  }
  
  interface HIDDevice {
    open(): Promise<void>;
    close(): Promise<void>;
    addEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
    removeEventListener(type: 'inputreport', listener: (event: HIDInputReportEvent) => void): void;
  }
  
  interface HIDInputReportEvent {
    device: HIDDevice;
    reportId: number;
    data: DataView;
  }
}

import { ScaleTransport, ScaleReading } from './transport';

export class HIDScale implements ScaleTransport {
  private device?: HIDDevice;
  private connected = false;
  private readingCallback?: (r: ScaleReading) => void;
  private offset = 0;
  private lastRawUnits = 0;
  private lastReportHex: string | undefined;
  private unitsPerGram = 1; // kept for compatibility; unused in default mode
  private unitFormat: 'grams' | 'oz_x16' | 'lb_x256' | 'oz_tenths_b3' = 'oz_tenths_b3';

  async connect(): Promise<void> {
    if (this.connected) return;
    if (!navigator.hid) {
      throw new Error('WebHID not supported in this browser');
    }

    // Request a device on the HID Scale usage page (0x008D)
    const devices = await navigator.hid.requestDevice({
      filters: [{ usagePage: 0x008d }],
    });

    const device = devices?.[0];
    if (!device) {
      throw new Error('No HID scale selected');
    }

    this.device = device;
    await this.device.open();

    const handleReport = (event: HIDInputReportEvent) => {
      // Parse bytes from the report. Formats vary by vendor; attempt a few common layouts.
      const data = event.data;
      const byteLength = data.byteLength || (data as any).buffer?.byteLength || 0;
      const rawBytes = new Uint8Array(data.buffer.slice(0, byteLength));
      const hex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
      this.lastReportHex = hex;
      let rawUnits = 0;
      let stable: boolean | undefined = undefined;

      // Source raw units depends on selected unit format
      if (this.unitFormat === 'oz_tenths_b3') {
        // Many scales report 0.1 oz as a 16-bit little-endian at bytes 3-4.
        // Example: ... FF 1D 00 → 0x001D = 29 tenths = 2.9 oz
        try {
          rawUnits = data.getUint16(3, true);
        } catch {}
        if (!rawUnits) {
          // Fallback to single byte if 16-bit read fails
          try { rawUnits = data.getUint8(3); } catch {}
        }
      } else {
        // Default: 16-bit little-endian at offset 2
        try {
          rawUnits = data.getUint16(2, true);
        } catch {}
        if (!rawUnits) {
          // Fallback to first 2 bytes if needed
          try { rawUnits = data.getUint16(0, true); } catch {}
        }
      }

      // Optional: some devices put status at byte 1 or last byte; treat nonzero as stable if bit 0x01 set
      try {
        // Heuristic: use last byte as status; non-zero => stable
        const status = data.getUint8(Math.max(0, (byteLength || 1) - 1));
        stable = status ? true : undefined;
      } catch {}

      // Extra diagnostics: try alternate interpretations and log to console
      try {
        const alt = {
          reportId: event.reportId,
          length: byteLength,
          hex,
          int16LE: data.byteLength >= 2 ? data.getInt16(0, true) : undefined,
          int16BE: data.byteLength >= 2 ? data.getInt16(0, false) : undefined,
          uint16LE: data.byteLength >= 2 ? data.getUint16(0, true) : undefined,
          uint16BE: data.byteLength >= 2 ? data.getUint16(0, false) : undefined,
          int32LE: data.byteLength >= 4 ? data.getInt32(0, true) : undefined,
          int32BE: data.byteLength >= 4 ? data.getInt32(0, false) : undefined,
          uint32LE: data.byteLength >= 4 ? data.getUint32(0, true) : undefined,
          uint32BE: data.byteLength >= 4 ? data.getUint32(0, false) : undefined,
          float32LE: data.byteLength >= 4 ? data.getFloat32(0, true) : undefined,
          float32BE: data.byteLength >= 4 ? data.getFloat32(0, false) : undefined,
          ascii: (() => {
            const txt = new TextDecoder('ascii', { fatal: false }).decode(rawBytes);
            const printable = /[\x20-\x7E]/.test(txt);
            return printable ? txt : undefined;
          })(),
        };
        // eslint-disable-next-line no-console
        console.log('[HID] inputreport', alt);
      } catch {}

      // Store raw and apply tare offset and guard
      if (Number.isFinite(rawUnits)) {
        this.lastRawUnits = rawUnits;
        const netUnits = rawUnits - this.offset;
        let grams = 0;
        if (this.unitFormat === 'grams') {
          grams = netUnits / this.unitsPerGram;
        } else if (this.unitFormat === 'oz_x16') {
          const ounces = netUnits / 16; // device units are 1/16 oz
          grams = ounces * 28.349523125;
        } else if (this.unitFormat === 'lb_x256') {
          const pounds = netUnits / 256; // device units are 1/256 lb
          grams = pounds * 453.59237;
        } else if (this.unitFormat === 'oz_tenths_b3') {
          const ounces = netUnits / 10; // one unit = 0.1 oz
          grams = ounces * 28.349523125;
        }
        const reading: ScaleReading = {
          grams: Math.max(0, grams),
          stable,
          ts: Date.now(),
        };
        // eslint-disable-next-line no-console
        console.log('[HID] parsed', { rawUnits, offset: this.offset, netUnits, unitFormat: this.unitFormat, unitsPerGram: this.unitsPerGram, grams: reading.grams });
        if (this.readingCallback) this.readingCallback(reading);
      }
    };

    this.device.addEventListener('inputreport', handleReport);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    try {
      if (this.device) {
        // No explicit removeEventListener reference here as we used inline; safe to just close
        await this.device.close();
      }
    } finally {
      this.device = undefined;
    }
  }

  onReading(cb: (r: ScaleReading) => void): void {
    this.readingCallback = cb;
  }

  isConnected(): boolean {
    return this.connected;
  }

  tare(): void {
    // Set offset to current raw units to zero the display
    this.offset = this.lastRawUnits;
  }

  // Non-interface helper: calibrate using a known mass in grams
  calibrateWithKnownMass(grams: number): void {
    if (!grams || grams <= 0) return;
    const netUnits = Math.max(0, this.lastRawUnits - this.offset);
    if (netUnits > 0) {
      this.unitsPerGram = netUnits / grams;
      // eslint-disable-next-line no-console
      console.log('[HID] calibrated', { grams, netUnits, unitsPerGram: this.unitsPerGram });
    }
  }

  getUnitsPerGram(): number {
    return this.unitsPerGram;
  }

  setUnitFormat(fmt: 'grams' | 'oz_x16' | 'lb_x256' | 'oz_tenths_b3'): void {
    this.unitFormat = fmt;
    // eslint-disable-next-line no-console
    console.log('[HID] unit format set', fmt);
  }

  getUnitFormat(): 'grams' | 'oz_x16' | 'lb_x256' | 'oz_tenths_b3' {
    return this.unitFormat;
  }

  getOffset(): number {
    return this.offset;
  }
}
