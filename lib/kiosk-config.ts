import { get } from '@vercel/edge-config';

// Kiosk configuration from Edge Config
export interface KioskConfig {
  mealTimes: {
    breakfast: { start: string; end: string };
    lunch: { start: string; end: string };
    dinner: { start: string; end: string };
  };
  scoring: {
    baselineGrams: number;
    sensitivity: number;
    minScoreForLeaderboard: number;
  };
  dishTypes: {
    plate: { tareGrams: number };
    salad: { tareGrams: number };
    cereal: { tareGrams: number };
  };
  idleTimer: {
    warningSeconds: number;
    countdownSeconds: number;
  };
}

// Get kiosk configuration from Edge Config
export async function getKioskConfig(): Promise<Partial<KioskConfig>> {
  try {
    const config = await get('kiosk_config');
    return config as Partial<KioskConfig>;
  } catch (error) {
    console.log('Edge Config not available, using defaults');
    return {};
  }
}

// Default configuration fallback
export const defaultKioskConfig: KioskConfig = {
  mealTimes: {
    breakfast: { start: "08:00", end: "10:00" },
    lunch: { start: "11:30", end: "13:30" },
    dinner: { start: "18:30", end: "20:30" }
  },
  scoring: {
    baselineGrams: 60,
    sensitivity: 60,
    minScoreForLeaderboard: 50
  },
  dishTypes: {
    plate: { tareGrams: 0 },
    salad: { tareGrams: 0 },
    cereal: { tareGrams: 0 }
  },
  idleTimer: {
    warningSeconds: 25,
    countdownSeconds: 5
  }
};
