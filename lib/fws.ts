import { ScaleReading } from '../transport/transport';

export type DishType = 'plate' | 'salad' | 'cereal';

// Fixed tare weights for different dish types (in grams)
export const DISH_TARE_WEIGHTS: Record<DishType, number> = {
  plate: 200,
  salad: 150,
  cereal: 100,
};

/**
 * Calculate Food Waste Score using logistic function (bounded 0-100)
 * @param weightGrams - Weight in grams
 * @param baselineG - Baseline weight for 50% score (default 60g)
 * @param sensitivity - Sensitivity parameter (default 60g)
 * @returns Score from 0-100
 */
export function fws(weightGrams: number, baselineG = 60, sensitivity = 60): number {
  return Math.round(100 / (1 + Math.exp((weightGrams - baselineG) / sensitivity)));
}

/**
 * Calculate score for a dish with tare adjustment
 * @param weightGrams - Raw weight from scale
 * @param dishType - Type of dish
 * @returns Adjusted score
 */
export function calculateDishScore(weightGrams: number, dishType: DishType): number {
  const tareWeight = DISH_TARE_WEIGHTS[dishType];
  const adjustedWeight = Math.max(0, weightGrams - tareWeight);
  return fws(adjustedWeight);
}

/**
 * Check if readings are stable based on rolling standard deviation
 * @param readings - Array of recent readings
 * @param threshold - Standard deviation threshold (default 0.2g)
 * @param windowMs - Time window in milliseconds (default 800ms)
 * @returns true if readings are stable
 */
export function gateStable(
  readings: ScaleReading[],
  threshold = 0.2,
  windowMs = 800
): boolean {
  const now = Date.now();
  const recentReadings = readings.filter(r => now - r.ts < windowMs);
  
  if (recentReadings.length < 3) return false;
  
  // Check if any reading has stable flag
  if (recentReadings.some(r => r.stable)) return true;
  
  // Calculate rolling standard deviation
  const weights = recentReadings.map(r => r.grams);
  const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
  const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev < threshold;
}

/**
 * Parse a line of text to extract weight in grams
 * Handles formats like "123.4 g", "ST,GS, 0.500 kg", etc.
 * @param line - Text line to parse
 * @returns Weight in grams, or null if parsing fails
 */
export function parseLineToGrams(line: string): number | null {
  // Remove extra whitespace and convert to lowercase
  const cleanLine = line.trim().toLowerCase();
  
  // Pattern for "123.4 g" format
  const gramMatch = cleanLine.match(/(\d+\.?\d*)\s*g/);
  if (gramMatch) {
    return parseFloat(gramMatch[1]);
  }
  
  // Pattern for "0.500 kg" format
  const kgMatch = cleanLine.match(/(\d+\.?\d*)\s*kg/);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }
  
  // Pattern for comma-separated values like "ST,GS, 0.500"
  const csvMatch = cleanLine.match(/(\d+\.?\d*)$/);
  if (csvMatch) {
    const value = parseFloat(csvMatch[1]);
    // Assume kg if value is less than 10, otherwise grams
    return value < 10 ? value * 1000 : value;
  }
  
  return null;
}
