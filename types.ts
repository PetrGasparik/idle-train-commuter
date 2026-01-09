export interface TrainConfig {
  speed: number;
  carCount: number;
  carSpacing: number;
  color: string;
  type: 'modern' | 'steam' | 'cargo' | 'ai';
  imageUrl?: string;
}

export interface Position {
  x: number;
  y: number;
  rotation: number;
}

export interface SmokeParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  createdAt: number;
  scale: number;
  randomRotation: number;
  driftX: number;
  driftY: number;
  borderRadius: string;
}

export interface Resources {
  energy: number; // Získáváno z klávesnice
  scrap: number;  // Získáváno z kliků myší
  totalDistance: number;
}

export interface AppState {
  config: TrainConfig;
  resources: Resources;
  isGenerating: boolean;
  lastActivity: number;
}