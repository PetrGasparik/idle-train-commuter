export interface TrainConfig {
  speed: number;
  carCount: number;
  carSpacing: number;
  color: string;
  type: 'modern' | 'steam' | 'cargo' | 'ai';
  imageUrl?: string;
  idleCruise: boolean; // Nové: Vlak nezastaví úplně při nečinnosti
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
  energy: number;
  scrap: number;
  totalDistance: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'input';
}

export interface AppState {
  config: TrainConfig;
  resources: Resources;
  isGenerating: boolean;
  lastActivity: number;
}