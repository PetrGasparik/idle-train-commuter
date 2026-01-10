
export type Language = 'en' | 'cs';

export type CarType = 'standard' | 'mining' | 'residential' | 'ai';

export interface HardwareStats {
  cpu: number;
  ram: number;
  temp: number;
}

export interface EnergyHub {
  id: string;
  x: number;
  y: number;
  type: 'micro' | 'fusion' | 'command' | 'terminal';
  active: boolean;
  waitingPassengers?: number; // Kolik lidí čeká na stanici
}

export interface TrainConfig {
  speed: number;
  cars: CarType[];
  carSpacing: number;
  color: string;
  type: 'modern' | 'steam' | 'cargo' | 'ai'; 
  imageUrl?: string;
  idleCruise: boolean;
  trackMargin: number;
  cornerRadius: number;
  cpuUpgradeLevel: number;
  uiScale: number;
  panelWidth: number;
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
  passengers: number;
  population: number; // Stálí obyvatelé v Habitatech
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'input';
}

export type WorkerStatus = 'sleeping' | 'approaching' | 'refueling' | 'riding' | 'returning' | 'rebooting';

export interface WorkerState {
  status: WorkerStatus;
  x: number;
  y: number;
  rotation: number;
  lastAction: number;
  currentHubId?: string;
}

export interface AppState {
  config: TrainConfig;
  resources: Resources;
  isGenerating: boolean;
  lastActivity: number;
}
