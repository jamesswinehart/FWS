import { fws, calculateDishScore, gateStable, parseLineToGrams } from '../lib/fws';
import { ScaleReading } from '../transport/transport';

describe('FWS Scoring Functions', () => {
  describe('fws', () => {
    it('should return 50 for baseline weight', () => {
      expect(fws(60)).toBe(50);
    });

    it('should return higher scores for lower weights', () => {
      expect(fws(30)).toBeGreaterThan(fws(60));
      expect(fws(60)).toBeGreaterThan(fws(90));
    });

    it('should be bounded between 0 and 100', () => {
      expect(fws(0)).toBeGreaterThanOrEqual(0);
      expect(fws(1000)).toBeLessThanOrEqual(100);
    });

    it('should handle custom baseline and sensitivity', () => {
      const score1 = fws(100, 100, 50);
      const score2 = fws(100, 50, 50);
      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe('calculateDishScore', () => {
    it('should subtract plate tare weight', () => {
      const score = calculateDishScore(300, 'plate'); // 300g - 200g tare = 100g
      expect(score).toBe(fws(100));
    });

    it('should subtract salad bowl tare weight', () => {
      const score = calculateDishScore(250, 'salad'); // 250g - 150g tare = 100g
      expect(score).toBe(fws(100));
    });

    it('should subtract cereal bowl tare weight', () => {
      const score = calculateDishScore(200, 'cereal'); // 200g - 100g tare = 100g
      expect(score).toBe(fws(100));
    });

    it('should handle negative weights gracefully', () => {
      const score = calculateDishScore(50, 'plate'); // 50g - 200g tare = -150g
      expect(score).toBe(fws(0)); // Should be clamped to 0
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
