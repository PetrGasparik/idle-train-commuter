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

export interface AppState {
  config: TrainConfig;
  isGenerating: boolean;
  wallpaperUrl: string;
}