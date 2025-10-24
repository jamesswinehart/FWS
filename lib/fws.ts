import { ScaleReading } from '../transport/transport';

export type DishType = 'plate' | 'salad' | 'cereal';

// Fixed tare weights for different dish types (in grams)
export const DISH_TARE_WEIGHTS: Record<DishType, number> = {
  plate: 200,
  salad: 150,
  cereal: 100,
};

// Baseline weights for different dish types (in grams)
// These represent typical food waste weight without the FWS interface
export const DISH_BASELINE_WEIGHTS: Record<DishType, number> = {
  plate: 60,    // Typical plate waste baseline
  salad: 40,    // Typical salad waste baseline  
  cereal: 30,  // Typical cereal waste baseline
};

// Decay constants for different dish types (in grams)
// These control how fast the score falls for waste above baseline
// Using τ = h / ln(2) where h is half-life in grams
export const DISH_DECAY_CONSTANTS: Record<DishType, number> = {
  plate: 43.3,  // ~30g half-life (30 / ln(2) ≈ 43.3)
  salad: 28.9,  // ~20g half-life (20 / ln(2) ≈ 28.9)
  cereal: 21.6, // ~15g half-life (15 / ln(2) ≈ 21.6)
};

/**
 * Calculate Food Waste Score using exponential decay function (bounded 0-100)
 * Formula: FWS = 100 * e^(-Δ/τ) where Δ = max(0, w - B)
 * @param weightGrams - Discarded weight in grams (w)
 * @param baselineG - Baseline/goal weight in grams (B)
 * @param decayConstant - Decay constant in grams (τ)
 * @returns Score from 0-100
 */
export function fws(weightGrams: number, baselineG = 60, decayConstant = 43.3): number {
  // If no waste, return perfect score
  if (weightGrams <= 0) {
    return 100;
  }
  
  // Calculate excess waste above baseline: Δ = max(0, w - B)
  const delta = Math.max(0, weightGrams - baselineG);
  
  // Calculate score using exponential decay: FWS = 100 * e^(-Δ/τ)
  const score = 100 * Math.exp(-delta / decayConstant);
  
  // Clamp to range [0, 100] and round
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate score for a dish with tare adjustment and dish-specific parameters
 * @param weightGrams - Raw weight from scale
 * @param dishType - Type of dish
 * @param debugWeightOverride - Optional debug override for net weight (bypasses tare calculation)
 * @returns Adjusted score using dish-specific baseline and decay constants
 */
export function calculateDishScore(weightGrams: number, dishType: DishType, debugWeightOverride?: number): number {
  // Use debug override if provided, otherwise calculate normally
  const adjustedWeight = debugWeightOverride !== undefined 
    ? debugWeightOverride 
    : Math.max(0, weightGrams - DISH_TARE_WEIGHTS[dishType]);
  
  // If no food waste (empty dish), return perfect score
  if (adjustedWeight <= 0) {
    return 100;
  }
  
  const baselineWeight = DISH_BASELINE_WEIGHTS[dishType];
  const decayConstant = DISH_DECAY_CONSTANTS[dishType];
  
  // Calculate score using dish-specific parameters
  return fws(adjustedWeight, baselineWeight, decayConstant);
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
