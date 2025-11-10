import { fws, calculateDishScore, gateStable, parseLineToGrams, DISH_BASELINE_WEIGHTS, DISH_DECAY_CONSTANTS, DISH_TARE_WEIGHTS } from '../lib/fws';
import { ScaleReading } from '../transport/transport';

describe('FWS Scoring Functions', () => {
  describe('fws', () => {
    it('should return 100 at or below baseline weight', () => {
      expect(fws(60)).toBe(100);
      expect(fws(30)).toBe(100);
    });

    it('should decrease as weight increases above baseline', () => {
      expect(fws(60)).toBeGreaterThan(fws(90));
      expect(fws(90)).toBeGreaterThan(fws(120));
    });

    it('should be bounded between 0 and 100', () => {
      expect(fws(0)).toBeGreaterThanOrEqual(0);
      expect(fws(1000)).toBeLessThanOrEqual(100);
    });

    it('should handle custom baseline and sensitivity', () => {
      const scoreAtBaseline = fws(100, 100, 50); // Δ = 0 → 100
      const scoreAboveBaseline = fws(120, 100, 50); // Δ = 20 < 50
      expect(scoreAtBaseline).toBe(100);
      expect(scoreAboveBaseline).toBeLessThan(100);
    });
  });

  describe('calculateDishScore', () => {
    it('should subtract plate tare weight when clearly gross (not net)', () => {
      const tare = DISH_TARE_WEIGHTS.plate;
      // Ensure we are above the 0.6 * tare heuristic so subtraction path is used
      const gross = 800; // > 0.6 * tare
      const score = calculateDishScore(gross, 'plate');
      // Verify that tare was subtracted by checking the score matches expected calculation
      const adjusted = Math.max(0, gross - tare);
      const expected = fws(adjusted, DISH_BASELINE_WEIGHTS.plate, DISH_DECAY_CONSTANTS.plate);
      // The score should match the calculation with adjusted weight
      expect(score).toBe(expected);
    });

    it('should subtract salad bowl tare weight when gross', () => {
      const tare = 192.8;
      const gross = 250; // > 0.6 * tare ≈ 115.68
      const adjusted = Math.max(0, gross - tare);
      const score = calculateDishScore(gross, 'salad');
      expect(score).toBe(fws(adjusted, DISH_BASELINE_WEIGHTS.salad, DISH_DECAY_CONSTANTS.salad));
    });

    it('should subtract cereal bowl tare weight when gross', () => {
      const tare = 53.9;
      const gross = 200; // > 0.6 * tare ≈ 32.34
      const adjusted = Math.max(0, gross - tare);
      const score = calculateDishScore(gross, 'cereal');
      expect(score).toBe(fws(adjusted, DISH_BASELINE_WEIGHTS.cereal, DISH_DECAY_CONSTANTS.cereal));
    });

    it('should handle zero/negative net weights as perfect score', () => {
      // Choose gross below tare but still above 0.6*tare to trigger subtraction path
      const tare = 192.8;
      const gross = 150; // < tare but > 0.6*tare → adjusted = 0
      const score = calculateDishScore(gross, 'salad');
      expect(score).toBe(100);
    });
  });

  describe('gateStable', () => {
    it('should return true if any reading has stable flag', () => {
      const now = Date.now();
      const readings: ScaleReading[] = [
        { grams: 100, ts: now - 700 },
        { grams: 101, stable: true, ts: now - 400 },
        { grams: 102, ts: now },
      ];
      expect(gateStable(readings)).toBe(true);
    });

    it('should return false for insufficient readings', () => {
      const readings: ScaleReading[] = [
        { grams: 100, ts: Date.now() },
      ];
      expect(gateStable(readings)).toBe(false);
    });

    it('should return true for low standard deviation', () => {
      const now = Date.now();
      const readings: ScaleReading[] = [
        { grams: 100.0, ts: now - 800 },
        { grams: 100.1, ts: now - 600 },
        { grams: 100.2, ts: now - 400 },
        { grams: 100.1, ts: now - 200 },
        { grams: 100.0, ts: now },
      ];
      expect(gateStable(readings, 0.2)).toBe(true);
    });

    it('should return false for high standard deviation', () => {
      const now = Date.now();
      const readings: ScaleReading[] = [
        { grams: 100.0, ts: now - 800 },
        { grams: 105.0, ts: now - 600 },
        { grams: 95.0, ts: now - 400 },
        { grams: 110.0, ts: now - 200 },
        { grams: 90.0, ts: now },
      ];
      expect(gateStable(readings, 0.2)).toBe(false);
    });
  });

  describe('parseLineToGrams', () => {
    it('should parse gram format', () => {
      expect(parseLineToGrams('123.4 g')).toBe(123.4);
      expect(parseLineToGrams('50g')).toBe(50);
      expect(parseLineToGrams('100 G')).toBe(100);
    });

    it('should parse kilogram format', () => {
      expect(parseLineToGrams('0.5 kg')).toBe(500);
      expect(parseLineToGrams('1.25KG')).toBe(1250);
    });

    it('should parse CSV format', () => {
      expect(parseLineToGrams('ST,GS, 0.500')).toBe(500);
      expect(parseLineToGrams('DATA,123.4')).toBe(123.4);
    });

    it('should return null for invalid input', () => {
      expect(parseLineToGrams('invalid')).toBeNull();
      expect(parseLineToGrams('')).toBeNull();
      expect(parseLineToGrams('abc def')).toBeNull();
    });
  });
});
