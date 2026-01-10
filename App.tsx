
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrainConfig, Position, SmokeParticle, Resources, LogEntry, WorkerState, Language, CarType, HardwareStats, EnergyHub } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';
import DraggableAnchor from './components/DraggableAnchor';
import DesktopSimulator from './components/DesktopSimulator';
import GodModeOverlay from './components/GodModeOverlay';
import EnergyHubComponent from './components/EnergyHub';
import { t } from './locales';

const SMOKE_LIFETIME = 1200; 
const MAX_PARTICLES = 30; 
const GLITCH_THRESHOLD = 92; 
const MAX_STORM_DURATION = 5; 
const MAX_WAGONS = 30;

const App: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && 
                     (window as any).process && 
                     (window as any).process.versions && 
                     !!(window as any).process.versions.electron;

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const [asmrMode, setAsmrMode] = useState(false);

  const [anchorPos, setAnchorPos] = useState(() => {
    const saved = localStorage.getItem('anchorPos');
    try {
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
      }
    } catch (e) {}
    return { x: 120, y: 120 };
  });

  const [hubs, setHubs] = useState<EnergyHub[]>(() => {
    const saved = localStorage.getItem('energyHubs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [{ id: 'command-post', x: 120, y: 120, type: 'command', active: true }];
  });

  const [terminalWaitCounts, setTerminalWaitCounts] = useState<Record<string, number>>({
    'term-a': 5,
    'term-b': 2
  });

  useEffect(() => {
    setHubs(prev => prev.map(h => h.id === 'command-post' ? { ...h, x: anchorPos.x, y: anchorPos.y } : h));
  }, [anchorPos]);

  useEffect(() => {
    localStorage.setItem('energyHubs', JSON.stringify(hubs));
  }, [hubs]);

  const [config, setConfig] = useState<TrainConfig>({
    speed: 6,
    cars: ['standard', 'residential'],
    carSpacing: 50, 
    color: '#3b82f6',
    type: 'modern',
    idleCruise: true,
    trackMargin: 14,
    cornerRadius: 30,
    cpuUpgradeLevel: 0,
    uiScale: 1.0,
    panelWidth: 288 
  });

  const [uiResources, setUiResources] = useState<Resources>({
    energy: 40, 
    scrap: 0,
    totalDistance: 0,
    passengers: 0,
    population: 5 
  });

  const [isDerailed, setIsDerailed] = useState(false);
  const [efficiencyLevel, setEfficiencyLevel] = useState(0);

  const [hwStats, setHwStats] = useState<HardwareStats & { isReal?: boolean }>({
    cpu: 10,
    ram: 30,
    temp: 45,
    isReal: false
  });

  const [isGodModeVisible, setIsGodModeVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);

  const setIgnoreMouse = useCallback((ignore: boolean) => {
    if (!isElectron) return;
    try { 
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('set-ignore-mouse-events', ignore, { forward: true });
    } catch (e) {}
  }, [isElectron]);

  const showHub = useCallback(() => {
    if (asmrMode) return;
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsPanelVisible(true);
    setIgnoreMouse(false);
  }, [setIgnoreMouse, asmrMode]);

  const toggleHub = useCallback(() => {
    if (asmrMode) return;
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    const next = !isPanelVisible;
    setIsPanelVisible(next);
    setIgnoreMouse(!next);
  }, [isPanelVisible, setIgnoreMouse, asmrMode]);

  const startHideTimer = useCallback(() => {
    if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsPanelVisible(false);
      setIgnoreMouse(true);
      hideTimeoutRef.current = null;
    }, 1000);
  }, [setIgnoreMouse]);
  
  const resourcesRef = useRef<Resources>({ energy: 40, scrap: 0, totalDistance: 0, passengers: 0, population: 5 });
  const efficiencyRef = useRef(0);
  const hwStatsRef = useRef<HardwareStats & { isReal?: boolean }>({ cpu: 10, ram: 30, temp: 45, isReal: false });
  const isDerailedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const stormDurationRef = useRef(0);
  const lastTerminalRef = useRef<string | null>(null); 

  const workerRef = useRef<WorkerState>({ 
    status: 'sleeping', 
    x: anchorPos.x, 
    y: anchorPos.y, 
    rotation: 0, 
    lastAction: Date.now(),
    currentHubId: 'command-post'
  });
  
  const anchorPosRef = useRef(anchorPos);
  const hubsRef = useRef(hubs);
  const lastActivityRef = useRef(performance.now());
  const distanceRef = useRef(0);
  const boostImpulseRef = useRef(0); 
  
  const carRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const workerVisualRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<SmokeParticle[]>([]);
  const metricsRef = useRef({ width: 0, height: 0, perimeter: 0 });

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastSmokeTimeRef = useRef<number>(0);
  const nextParticleId = useRef(0);

  const updateMetrics = useCallback(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const m = config.trackMargin;
    const R = config.cornerRadius;
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    const perimeter = 2 * w_strip + 2 * h_strip + 4 * arc;
    metricsRef.current = { width: W, height: H, perimeter };
  }, [config.trackMargin, config.cornerRadius]);

  useEffect(() => {
    updateMetrics();
    window.addEventListener('resize', updateMetrics);
    
    if (isElectron) {
      addLog('sysInit', 'info');
      if (window.innerWidth > 3000) {
        // Simple heuristic for multi-monitor span
        addLog('logInit', 'success');
      }
    }

    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics, isElectron]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setAsmrMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (asmrMode) {
      setIsPanelVisible(false);
      setIgnoreMouse(true);
    }
  }, [asmrMode, setIgnoreMouse]);

  useEffect(() => {
    anchorPosRef.current = anchorPos;
  }, [anchorPos]);

  useEffect(() => {
    hubsRef.current = hubs;
  }, [hubs]);

  useEffect(() => {
    efficiencyRef.current = efficiencyLevel;
  }, [efficiencyLevel]);

  useEffect(() => {
    isDerailedRef.current = isDerailed;
  }, [isDerailed]);

  useEffect(() => {
    if (!isElectron) return;
    try {
      const { ipcRenderer } = (window as any).require('electron');
      const handler = (event: any, stats: any) => {
        hwStatsRef.current = { cpu: stats.cpu, ram: stats.ram, temp: stats.temp, isReal: true };
        setHwStats({ ...hwStatsRef.current });
      };
      ipcRenderer.on('hw-stats-update', handler);
      return () => { ipcRenderer.removeListener('hw-stats-update', handler); };
    } catch (e) {}
  }, [isElectron]);

  const addLog = useCallback((messageKey: string, type: LogEntry['type'] = 'info', params?: Record<string, any>) => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let message = t(language, messageKey as any);
    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }
    const newLog: LogEntry = { id: Math.random().toString(36).substr(2, 9), timestamp, message, type };
    setLogs(prev => [...prev.slice(-30), newLog]);
  }, [language]);

  const getPositionOnPerimeter = (d: number): Position => {
    const { width: W, height: H, perimeter } = metricsRef.current;
    const m = config.trackMargin;
    const R = config.cornerRadius;
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    let cur = d % perimeter;
    if (cur < 0) cur += perimeter;
    if (cur < w_strip) return { x: m + R + cur, y: m, rotation: 0 };
    cur -= w_strip;
    if (cur < arc) {
      const a = (cur / arc) * (Math.PI / 2);
      return { x: (W - m - R) + Math.sin(a) * R, y: (m + R) - Math.cos(a) * R, rotation: (a * 180) / Math.PI };
    }
    cur -= arc;
    if (cur < h_strip) return { x: W - m, y: m + R + cur, rotation: 90 };
    cur -= h_strip;
    if (cur < arc) {
      const a = (cur / arc) * (Math.PI / 2);
      return { x: (W - m - R) + Math.cos(a) * R, y: (H - m - R) + Math.sin(a) * R, rotation: 90 + (a * 180) / Math.PI };
    }
    cur -= arc;
    if (cur < w_strip) return { x: (W - m - R) - cur, y: H - m, rotation: 180 };
    cur -= w_strip;
    if (cur < arc) {
      const a = (cur / arc) * (Math.PI / 2);
      return { x: (m + R) - Math.sin(a) * R, y: (H - m - R) + Math.cos(a) * R, rotation: 180 + (a * 180) / Math.PI };
    }
    cur -= arc;
    if (cur < h_strip) return { x: m, y: (H - m - R) - cur, rotation: 270 };
    cur -= h_strip;
    const af = (cur / arc) * (Math.PI / 2);
    return { x: (m + R) - Math.cos(af) * R, y: (m + R) - Math.sin(af) * R, rotation: 270 + (af * 180) / Math.PI };
  };

  const findNearestHub = useCallback((x: number, y: number) => {
    let minTarget = hubsRef.current[0];
    let minDist = Infinity;
    hubsRef.current.forEach(h => {
      const d = Math.sqrt(Math.pow(h.x - x, 2) + Math.pow(h.y - y, 2));
      if (d < minDist) {
        minDist = d;
        minTarget = h;
      }
    });
    return minTarget;
  }, []);

  const handleManualPulse = useCallback(() => {
    if (isDerailedRef.current) return;
    resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 5);
    boostImpulseRef.current += 30; 
    const sortingWagons = config.cars.filter(c => c === 'mining').length;
    resourcesRef.current.scrap += (1 + sortingWagons);
    hwStatsRef.current.cpu = Math.min(100, hwStatsRef.current.cpu + 15);
    setHwStats(prev => ({ ...prev, cpu: hwStatsRef.current.cpu }));
    lastActivityRef.current = performance.now();
    addLog('logManualFuel', 'success');
  }, [addLog, config.cars]);

  const handleGodAddScrap = useCallback(() => {
    resourcesRef.current.scrap += 999;
    setUiResources({ ...resourcesRef.current });
  }, []);

  const handleRebootRequest = useCallback(() => {
    if (!isDerailedRef.current || workerRef.current.status !== 'sleeping') return;
    const trainPos = getPositionOnPerimeter(distanceRef.current);
    const nearest = findNearestHub(trainPos.x, trainPos.y);
    workerRef.current.status = 'rebooting';
    workerRef.current.x = nearest.x;
    workerRef.current.y = nearest.y;
    workerRef.current.currentHubId = nearest.id;
    workerRef.current.lastAction = Date.now();
    addLog('logDroneReboot', 'info');
  }, [addLog, findNearestHub]);

  const handleSell = useCallback((index: number) => {
    if (index === 0) return; 
    const wagonType = config.cars[index];
    const prices = { standard: 10, mining: 15, residential: 20, ai: 0 };
    const refund = prices[wagonType as keyof typeof prices] || 0;
    
    resourcesRef.current.scrap += refund;
    
    if (wagonType === 'residential') {
      resourcesRef.current.population = Math.max(0, resourcesRef.current.population - 5);
    }
    
    const newCars = [...config.cars];
    newCars.splice(index, 1);
    
    const newCapacity = newCars.slice(1).filter(c => c === 'standard').length * 10;
    if (resourcesRef.current.passengers > newCapacity) {
      resourcesRef.current.passengers = newCapacity;
      addLog('logWagonSoldFull', 'warning');
    } else {
      addLog('logWagonSold', 'success');
    }
    
    setConfig(prev => ({ ...prev, cars: newCars }));
  }, [config.cars, addLog]);

  const handleUpgrade = useCallback((type: 'wagon' | 'fuel' | 'mining' | 'residential' | 'cpu' | 'micro_hub' | 'fusion_hub') => {
    const costs = { wagon: 10, fuel: 25, mining: 15, residential: 20, cpu: 30, micro_hub: 50, fusion_hub: 150 };
    if (resourcesRef.current.scrap >= costs[type]) {
      if (type === 'micro_hub' || type === 'fusion_hub') {
        const randomDist = Math.random() * metricsRef.current.perimeter;
        const pos = getPositionOnPerimeter(randomDist);
        const newHub: EnergyHub = {
          id: `hub-${Date.now()}`,
          x: pos.x,
          y: pos.y,
          type: type === 'micro_hub' ? 'micro' : 'fusion',
          active: true
        };
        resourcesRef.current.scrap -= costs[type];
        setHubs(prev => [...prev, newHub]);
        addLog(type === 'micro_hub' ? 'logMicroHub' : 'logFusionHub', 'success');
        return;
      }
      if (type === 'wagon' || type === 'mining' || type === 'residential') {
        const currentWagons = config.cars.length - 1;
        if (currentWagons >= MAX_WAGONS) {
          addLog('logMaxWagons', 'warning');
          return;
        }
      }
      resourcesRef.current.scrap -= costs[type];
      if (type === 'fuel') {
        setEfficiencyLevel(prev => prev + 1);
        addLog('logEfficiency', 'success');
      } else if (type === 'cpu') {
        setConfig(prev => ({ ...prev, cpuUpgradeLevel: prev.cpuUpgradeLevel + 1 }));
        addLog('logCpuUpgrade', 'success');
      } else {
        const wagonType: CarType = type === 'mining' ? 'mining' : type === 'residential' ? 'residential' : 'standard';
        
        if (wagonType === 'residential') {
          resourcesRef.current.population += 5;
          addLog('logResidentialWagon', 'success');
        } else {
          addLog(wagonType === 'mining' ? 'logMiningWagon' : 'logWagon', 'success');
        }
        
        setConfig(prev => ({ ...prev, cars: [...prev.cars, wagonType] }));
      }
    }
  }, [addLog, config.cars, metricsRef]);

  const terminals = useMemo(() => {
     const { perimeter } = metricsRef.current;
     if (!perimeter) return [];
     return [
       { id: 'term-a', dist: perimeter * 0.1, label: 'Alpha' },
       { id: 'term-b', dist: perimeter * 0.6, label: 'Omega' }
     ];
  }, [metricsRef.current.perimeter]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTerminalWaitCounts(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id] < 50) next[id] += 1;
        });
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = Math.min(time - lastTimeRef.current, 100); 
      const inactivitySeconds = (time - lastActivityRef.current) / 1000;
      const { perimeter } = metricsRef.current;
      
      const tempThrottling = hwStatsRef.current.temp > 85 ? 0.6 : 1.0;
      const energyFactor = resourcesRef.current.energy > 0 ? (0.2 + (resourcesRef.current.energy / 100) * 0.8) : 0;
      
      let effectiveSpeed = isDerailedRef.current || isStoppedRef.current ? 0 : config.speed * energyFactor * tempThrottling;
      
      if (!isDerailedRef.current && !isStoppedRef.current && inactivitySeconds < 2) effectiveSpeed *= Math.max(1, 3 - inactivitySeconds / 10); 
      
      const isActuallyMoving = effectiveSpeed > 0.1;
      let moveAmount = (effectiveSpeed * 12 * deltaTime) / 1000;
      
      if (!isDerailedRef.current && boostImpulseRef.current > 0.1) {
        const step = boostImpulseRef.current * 0.2; 
        moveAmount += step;
        boostImpulseRef.current -= step;
      } else {
        boostImpulseRef.current = 0;
      }

      if (!isDerailedRef.current && !isStoppedRef.current) {
        const hasPassengerWagon = config.cars.slice(1).includes('standard');
        const normDist = distanceRef.current % perimeter;
        
        if (lastTerminalRef.current) {
          const lastTerm = terminals.find(t => t.id === lastTerminalRef.current);
          if (lastTerm && Math.abs(normDist - lastTerm.dist) > 20) {
            lastTerminalRef.current = null;
          }
        }

        terminals.forEach(term => {
          const detectionWindow = Math.max(15, effectiveSpeed * 0.5);
          if (Math.abs(normDist - term.dist) < detectionWindow && lastTerminalRef.current !== term.id) {
             if (!hasPassengerWagon) return; 

             isStoppedRef.current = true;
             lastTerminalRef.current = term.id;
             
             const diff = normDist - term.dist;
             distanceRef.current -= diff;
             
             setTimeout(() => {
               const passengerCapacity = config.cars.slice(1).filter(c => c === 'standard').length * 10;
               const sortingBonus = 1 + (config.cars.filter(c => c === 'mining').length * 0.5);
               
               let disembarked = 0;
               let boarded = 0;

               if (resourcesRef.current.passengers > 0) {
                 disembarked = resourcesRef.current.passengers;
                 const fare = Math.floor(disembarked * 2 * sortingBonus);
                 resourcesRef.current.scrap += fare;
                 resourcesRef.current.passengers = 0;
               }

               const waiting = terminalWaitCounts[term.id] || 0;
               boarded = Math.min(waiting, passengerCapacity);
               
               resourcesRef.current.passengers = boarded;
               setTerminalWaitCounts(prev => ({ ...prev, [term.id]: (prev[term.id] || 0) - boarded }));

               addLog('logTerminalArrival', 'success', { disembarked, boarded });
               isStoppedRef.current = false;
             }, 3000);
          }
        });
      }

      if (isActuallyMoving) {
        const resCount = config.cars.filter(c => c === 'residential').length;
        const sortingCount = config.cars.filter(c => c === 'mining').length;
        const baseYieldPerMs = 0.00015;
        const yieldMultiplier = 1 + (sortingCount * 0.5);
        resourcesRef.current.scrap += (resCount * baseYieldPerMs * yieldMultiplier * deltaTime); 
      }

      const efficiencyMultiplier = Math.pow(0.85, efficiencyRef.current);
      const consumptionPerPixel = (10 / (perimeter || 5000)) * efficiencyMultiplier;
      const energyLoss = (isActuallyMoving ? (moveAmount * consumptionPerPixel) : (deltaTime / 20000)) * (1 + Math.max(0, hwStatsRef.current.temp - 40) / 200);
      resourcesRef.current.energy = Math.max(0, resourcesRef.current.energy - (isDerailedRef.current ? energyLoss * 2 : energyLoss));
      
      const w = workerRef.current;
      const trainPos = getPositionOnPerimeter(distanceRef.current);

      if (w.status === 'sleeping') {
        const homeHub = hubsRef.current.find(h => h.id === w.currentHubId) || hubsRef.current[0];
        w.x = homeHub.x; w.y = homeHub.y;
        if (!isDerailedRef.current && resourcesRef.current.energy < 15 && Date.now() - w.lastAction > 5000) {
           const nearest = findNearestHub(trainPos.x, trainPos.y);
           w.status = 'approaching'; 
           w.x = nearest.x; w.y = nearest.y;
           w.currentHubId = nearest.id;
        }
      } else if (w.status === 'approaching' || w.status === 'rebooting') {
        const dx = trainPos.x - w.x; const dy = trainPos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 10) {
          const isSwap = w.status === 'rebooting';
          w.status = 'refueling';
          setTimeout(() => {
            if (isSwap) {
              setIsDerailed(false);
              resourcesRef.current.energy = 40;
              hwStatsRef.current.cpu = 10;
              stormDurationRef.current = 0;
              addLog('logReboot', 'success');
            } else {
              resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 70);
            }
            workerRef.current.status = 'returning';
            workerRef.current.lastAction = Date.now();
          }, isSwap ? 2000 : 1000);
        } else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      } else if (w.status === 'refueling') {
        w.x = trainPos.x; w.y = trainPos.y; w.rotation = trainPos.rotation;
      } else if (w.status === 'returning') {
        const homeHub = hubsRef.current.find(h => h.id === w.currentHubId) || hubsRef.current[0];
        const dx = homeHub.x - w.x; const dy = homeHub.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 5) { w.status = 'sleeping'; w.lastAction = Date.now(); }
        else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      }
      
      distanceRef.current += moveAmount;
      resourcesRef.current.totalDistance += moveAmount / 2000;
      
      const isGlitching = hwStatsRef.current.cpu > GLITCH_THRESHOLD || isDerailedRef.current;
      const jitter = isGlitching ? (Math.random() - 0.5) * (hwStatsRef.current.cpu / (isDerailedRef.current ? 5 : 15)) : 0;
      
      carRefs.current.forEach((el, i) => {
        if (el) {
          const pos = getPositionOnPerimeter(distanceRef.current - (i * config.carSpacing));
          el.style.transform = `translate(${pos.x + jitter}px, ${pos.y + jitter}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });
      if (workerVisualRef.current) {
        workerVisualRef.current.style.transform = `translate(${w.x}px, ${w.y}px) translate(-50%, -50%) rotate(${w.rotation}deg)`;
        workerVisualRef.current.style.opacity = w.status === 'sleeping' ? '0.4' : '1';
        if (w.status === 'rebooting') {
           workerVisualRef.current.style.filter = 'drop-shadow(0 0 15px #3b82f6) drop-shadow(0 0 30px #3b82f6)';
        } else {
           workerVisualRef.current.style.filter = w.status === 'sleeping' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 0 120px #facc15)';
        }
      }
      if ((isActuallyMoving || isDerailedRef.current) && time - lastSmokeTimeRef.current > (150 / (effectiveSpeed/4 || 4))) {
        const lp = getPositionOnPerimeter(distanceRef.current);
        const isStorm = isGlitching;
        let sColor = isDerailedRef.current ? 'rgba(239,68,68,0.9)' : (isStorm ? 'rgba(56, 189, 248, 0.9)' : (hwStatsRef.current.temp > 80 ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.7)'));
        const newPuff: SmokeParticle = {
          id: nextParticleId.current++,
          x: lp.x + jitter, y: lp.y + jitter, rotation: lp.rotation, createdAt: time,
          scale: isStorm ? 0.3 : (0.6 + Math.random() * 0.6), 
          randomRotation: Math.random() * 360,
          driftX: (Math.random() - 0.5) * (isStorm ? 60 : 30), 
          driftY: (Math.random() - 0.5) * (isStorm ? 60 : 30), 
          borderRadius: isStorm ? '0%' : '50%',
          color: sColor
        };
        particlesRef.current.push(newPuff);
        if (particlesRef.current.length > MAX_PARTICLES) particlesRef.current.shift();
        lastSmokeTimeRef.current = time;
      }
      particlesRef.current = particlesRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME);
      particleRefs.current.forEach((el, i) => {
        const p = particlesRef.current[i];
        if (el) {
          if (p) {
            const age = (time - p.createdAt) / SMOKE_LIFETIME;
            const currentScale = p.scale * (0.2 + age * (isDerailedRef.current ? 6 : 3));
            const currentOpacity = 0.9 * (1 - age);
            el.style.display = 'block';
            el.style.transform = `translate(${p.x + p.driftX * age}px, ${p.y + p.driftY * age}px) translate(-50%, -50%) rotate(${p.rotation}deg) scale(${currentScale})`;
            el.style.opacity = currentOpacity.toString();
            el.style.backgroundColor = p.color;
            el.style.borderRadius = p.borderRadius;
            el.style.boxShadow = `0 0 10px ${p.color}`;
          } else el.style.display = 'none';
        }
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [config.speed, config.carSpacing, config.cars, config.trackMargin, config.cornerRadius, config.cpuUpgradeLevel, addLog, findNearestHub, terminals, terminalWaitCounts]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => {
    const hwSim = setInterval(() => {
      if (isDerailedRef.current) return;
      const stats = hwStatsRef.current;
      const wagonLoad = config.cars.length * 4.5;
      const speedLoad = config.speed * 1.2;
      const cpuEfficiency = Math.pow(0.85, config.cpuUpgradeLevel);
      const targetCpu = Math.min(100, 5 + (wagonLoad + speedLoad) * cpuEfficiency);
      const jitter = (Math.random() - 0.5) * 4;
      const newCpu = Math.max(2, Math.min(100, stats.cpu + (targetCpu - stats.cpu) * 0.2 + jitter));
      const tempEfficiency = 1.0 - (config.cpuUpgradeLevel * 0.08);
      const targetTemp = 35 + (newCpu * 0.55 * tempEfficiency);
      const newTemp = stats.temp + (targetTemp - stats.temp) * 0.15;
      hwStatsRef.current = { cpu: newCpu, ram: Math.min(95, 25 + (config.cars.length * 2.5)), temp: newTemp, isReal: hwStatsRef.current.isReal };
      setHwStats({ ...hwStatsRef.current });
      if (newCpu > GLITCH_THRESHOLD) {
        stormDurationRef.current += 1;
        if (stormDurationRef.current >= MAX_STORM_DURATION) {
          setIsDerailed(true);
          addLog('logMeltdown', 'warning');
        } else {
          addLog('logCpuStorm', 'warning');
        }
      } else {
        stormDurationRef.current = Math.max(0, stormDurationRef.current - 0.5);
      }
    }, 1000); 
    return () => clearInterval(hwSim);
  }, [config.cars.length, config.speed, config.cpuUpgradeLevel, addLog]);

  useEffect(() => {
    const syncInterval = setInterval(() => { setUiResources({ ...resourcesRef.current }); }, 250); 
    return () => { clearInterval(syncInterval); };
  }, []);

  const glitchActive = hwStats.cpu > GLITCH_THRESHOLD || isDerailed;

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none ${glitchActive ? 'glitch-active' : ''}`}>
      {!isElectron && !asmrMode && <DesktopSimulator logs={logs} language={language} />}
      {!isElectron && !asmrMode && (
        <GodModeOverlay isVisible={isGodModeVisible} onToggle={() => setIsGodModeVisible(!isGodModeVisible)} onAddScrap={handleGodAddScrap} setIgnoreMouse={setIgnoreMouse} />
      )}
      {!asmrMode && (
        <div ref={workerVisualRef} className="absolute z-[110] pointer-events-none transition-opacity duration-300">
          <div className="relative">
            {workerRef.current.status === 'rebooting' && (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-2 w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
              </>
            )}
            <div className="absolute top-1/2 right-1/2 -translate-y-1/2 w-4 h-0.5 bg-blue-400/40 blur-[1px] origin-right"></div>
            <div className={`w-3.5 h-3.5 ${workerRef.current.status === 'rebooting' ? 'bg-blue-400' : 'bg-yellow-400'} rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] border border-white/50 flex items-center justify-center`}>
               <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      {!asmrMode && terminals.map(term => {
         const pos = getPositionOnPerimeter(term.dist);
         return (
           <div key={term.id} className="absolute pointer-events-none" style={{ left: pos.x, top: pos.y }}>
             <EnergyHubComponent hub={{ id: term.id, x: pos.x, y: pos.y, active: true, type: 'terminal', waitingPassengers: terminalWaitCounts[term.id] || 0 }} />
           </div>
         );
      })}
      {!asmrMode && hubs.map(hub => hub.id !== 'command-post' && (
        <div key={hub.id} className="absolute pointer-events-none" style={{ left: hub.x, top: hub.y }}>
          <EnergyHubComponent hub={hub} />
        </div>
      ))}
      <div className="absolute inset-0 pointer-events-none z-[150] overflow-visible">
        {Array.from({ length: MAX_PARTICLES }).map((_, i) => (
          <div key={i} ref={el => { particleRefs.current[i] = el; }} className="absolute blur-[1px] will-change-transform pointer-events-none" style={{ display: 'none', width: '8px', height: '8px' }} />
        ))}
      </div>
      <div className="train-container">
        {config.cars.map((carType, i) => {
          let carPassengers = 0;
          if (carType === 'standard') {
            const standardIndex = config.cars.slice(0, i).filter(c => c === 'standard').length;
            carPassengers = Math.max(0, Math.min(10, uiResources.passengers - (standardIndex * 10)));
          }
          return (
            <div key={i} ref={el => { carRefs.current[i] = el; }} className="absolute pointer-events-none will-change-transform z-[100]">
              <TrainCar config={config} isLocomotive={i === 0} carType={carType} energy={uiResources.energy} passengers={carPassengers} />
            </div>
          );
        })}
      </div>
      <div className={`absolute inset-0 pointer-events-none z-[200] ${asmrMode ? 'opacity-0 scale-0' : 'opacity-100 scale-100'} transition-all duration-500`}>
        <div className="absolute" style={{ left: anchorPos.x, top: anchorPos.y }}>
          <div className="relative" onMouseEnter={() => { setIgnoreMouse(false); showHub(); }} onMouseLeave={startHideTimer}>
            <DraggableAnchor language={language} onHover={(val) => { if (!val && isPanelVisible) startHideTimer(); else if (val) showHub(); }} onClick={toggleHub} onPositionChange={(x, y) => setAnchorPos({x, y})} initialPos={anchorPos} setIgnoreMouse={setIgnoreMouse} />
            {isPanelVisible && !asmrMode && (
              <div className="absolute left-8 -top-24 transition-all duration-300 pointer-events-auto shadow-2xl" onMouseEnter={showHub} onMouseLeave={startHideTimer} style={{ transform: `scale(${config.uiScale})`, transformOrigin: 'top left' }}>
                <ControlPanel 
                  config={config} resources={uiResources} hwStats={hwStats} language={language} logs={logs} efficiencyLevel={efficiencyLevel}
                  onLanguageChange={setLanguage} onChange={setConfig} onPulse={handleManualPulse} onUpgrade={handleUpgrade} onSell={handleSell}
                  isGodMode={isGodModeVisible && !isElectron} onGodAddScrap={handleGodAddScrap} isDerailed={isDerailed} onReboot={handleRebootRequest}
                  isDroneBusy={workerRef.current.status !== 'sleeping'} hubs={hubs} asmrMode={asmrMode} onAsmrToggle={() => setAsmrMode(!asmrMode)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
