
export type Language = 'en' | 'cs';

export type CarType = 'standard' | 'mining' | 'residential' | 'ai';

export interface HardwareStats {
  cpu: number;
  ram: number;
  temp: number;
}

export interface TrainConfig {
  speed: number;
  cars: CarType[];
  carSpacing: number;
  color: string;
  type: 'modern' | 'steam' | 'cargo' | 'ai'; // Base locomotive style
  imageUrl?: string;
  idleCruise: boolean;
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
  color: string;
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

export type WorkerStatus = 'sleeping' | 'approaching' | 'refueling' | 'riding' | 'returning';

export interface WorkerState {
  status: WorkerStatus;
  x: number;
  y: number;
  rotation: number;
  lastAction: number;
}

export interface AppState {
  config: TrainConfig;
  resources: Resources;
  isGenerating: boolean;
  lastActivity: number;
}
