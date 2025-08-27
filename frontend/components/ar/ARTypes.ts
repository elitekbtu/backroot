export interface ARGameTarget {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  type?: 'diamond' | 'star' | 'coin' | 'gem';
  value?: number;
}

export interface ARGameConfig {
  type: 'collect' | 'tap' | 'scan' | 'puzzle';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // seconds
  targetCount: number;
  minScore: number;
  rewards: {
    points: number;
    bonusItems?: string[];
  };
}

export interface ARGameState {
  phase: 'loading' | 'ready' | 'playing' | 'paused' | 'success' | 'failed';
  score: number;
  timeLeft: number;
  targetsCollected: number;
  totalTargets: number;
}

export interface ARGameAchievement {
  id: number;
  name: string;
  icon: string;
  points: number;
  distance_meters?: number;
  gameConfig?: ARGameConfig;
}

export interface ARGameProps {
  achievement: ARGameAchievement;
  onCollect: () => void;
  onClose: () => void;
  onScoreUpdate?: (score: number) => void;
}

// Предустановленные конфигурации игр для разных типов ачивок
export const AR_GAME_CONFIGS: Record<string, ARGameConfig> = {
  'easy_collect': {
    type: 'collect',
    difficulty: 'easy',
    duration: 45,
    targetCount: 3,
    minScore: 20,
    rewards: { points: 50 }
  },
  'medium_collect': {
    type: 'collect',
    difficulty: 'medium',
    duration: 30,
    targetCount: 5,
    minScore: 30,
    rewards: { points: 75 }
  },
  'hard_collect': {
    type: 'collect',
    difficulty: 'hard',
    duration: 20,
    targetCount: 7,
    minScore: 50,
    rewards: { points: 100, bonusItems: ['special_badge'] }
  },
  'expo_special': {
    type: 'scan',
    difficulty: 'medium',
    duration: 60,
    targetCount: 1,
    minScore: 100,
    rewards: { points: 150, bonusItems: ['expo_badge', 'rare_item'] }
  }
};






