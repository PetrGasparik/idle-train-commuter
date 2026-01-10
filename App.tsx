
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrainConfig, Position, SmokeParticle, Resources, LogEntry, WorkerState, Language, CarType, HardwareStats } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';
import DraggableAnchor from './components/DraggableAnchor';
import DesktopSimulator from './components/DesktopSimulator';
import { t } from './locales';

const TRACK_MARGIN = 14; 
const CORNER_RADIUS = 30; 
const SMOKE_LIFETIME = 1200; 

const App: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && 
                     (window as any).process && 
                     (window as any).process.versions && 
                     !!(window as any).process.versions.electron;

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  const [config, setConfig] = useState<TrainConfig>({
    speed: 6,
    cars: ['standard', 'residential'],
    carSpacing: 50, 
    color: '#3b82f6',
    type: 'modern',
    idleCruise: true 
  });

  const [uiResources, setUiResources] = useState<Resources>({
    energy: 40, 
    scrap: 0,
    totalDistance: 0
  });

  const [hwStats, setHwStats] = useState<HardwareStats & { isReal?: boolean }>({
    cpu: 10,
    ram: 30,
    temp: 45,
    isReal: false
  });

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

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  
  const resourcesRef = useRef<Resources>({ energy: 40, scrap: 0, totalDistance: 0 });
  const hwStatsRef = useRef<HardwareStats & { isReal?: boolean }>({ cpu: 10, ram: 30, temp: 45, isReal: false });
  const workerRef = useRef<WorkerState>({ 
    status: 'sleeping', 
    x: anchorPos.x, 
    y: anchorPos.y, 
    rotation: 0, 
    lastAction: Date.now() 
  });
  const anchorPosRef = useRef(anchorPos);
  const lastActivityRef = useRef(performance.now());
  const distanceRef = useRef(0);
  const smokePuffsRef = useRef<SmokeParticle[]>([]);
  const [renderPuffs, setRenderPuffs] = useState<SmokeParticle[]>([]);
  
  const carRefs = useRef<(HTMLDivElement | null)[]>([]);
  const workerVisualRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastSmokeTimeRef = useRef<number>(0);
  const nextParticleId = useRef(0);

  useEffect(() => {
    anchorPosRef.current = anchorPos;
  }, [anchorPos]);

  // ELECTRON IPC LISTENER
  useEffect(() => {
    if (!isElectron) return;

    try {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.on('hw-stats-update', (event: any, stats: any) => {
        const jitter = (Math.random() - 0.5) * 2;
        hwStatsRef.current = {
          cpu: Math.max(0, Math.min(100, stats.cpu + jitter)),
          ram: Math.max(0, Math.min(100, stats.ram)),
          temp: stats.temp,
          isReal: true
        };
        setHwStats({ ...hwStatsRef.current });
      });
    } catch (e) {
      console.warn("IPC failed, using fallback simulation");
    }
  }, [isElectron]);

  const addLog = useCallback((messageKey: any, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const message = t(language, messageKey);
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-14), newLog]);
  }, [language]);

  const handleManualPulse = useCallback(() => {
    resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 20);
    lastActivityRef.current = performance.now();
    addLog('logManualFuel', 'success');
  }, [addLog]);

  const handleUpgrade = useCallback((type: 'wagon' | 'fuel' | 'mining' | 'residential') => {
    const costs = { wagon: 10, fuel: 25, mining: 15, residential: 20 };
    if (resourcesRef.current.scrap >= costs[type]) {
      resourcesRef.current.scrap -= costs[type];
      if (type === 'fuel') addLog('logEfficiency', 'success');
      else {
        const wagonType: CarType = type === 'mining' ? 'mining' : type === 'residential' ? 'residential' : 'standard';
        setConfig(prev => ({ ...prev, cars: [...prev.cars, wagonType].slice(0, 15) }));
        addLog(type === 'mining' ? 'logMiningWagon' : type === 'residential' ? 'logResidentialWagon' : 'logWagon', 'success');
      }
    }
  }, [addLog]);

  const setIgnoreMouse = useCallback((ignore: boolean) => {
    if (!isElectron) return;
    try { 
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('set-ignore-mouse-events', ignore, true);
    } catch (e) {}
  }, [isElectron]);

  const showHub = useCallback(() => {
    if (hoverTimeoutRef.current) { window.clearTimeout(hoverTimeoutRef.current); hoverTimeoutRef.current = null; }
    setIsPanelVisible(true);
    setIgnoreMouse(false);
  }, [setIgnoreMouse]);

  const hideHub = useCallback(() => {
    if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsPanelVisible(false);
      setIgnoreMouse(true);
    }, 300);
  }, [setIgnoreMouse]);

  useEffect(() => {
    const hwInterval = setInterval(() => {
      if (hwStatsRef.current.isReal) return; 

      const stats = hwStatsRef.current;
      const targetCpu = 10 + (config.cars.length * 5) + (config.speed * 0.5);
      const newCpu = Math.max(5, Math.min(100, stats.cpu + (targetCpu - stats.cpu) * 0.2 + (Math.random() - 0.5) * 15));
      const newRam = Math.max(20, Math.min(98, stats.ram + (Math.random() - 0.45) * 2));
      const targetTemp = 35 + (newCpu * 0.4) + (config.speed * 0.8);
      const newTemp = Math.max(30, Math.min(100, stats.temp + (targetTemp - stats.temp) * 0.15));
      
      hwStatsRef.current = { cpu: newCpu, ram: newRam, temp: newTemp, isReal: false };
      setHwStats({ ...hwStatsRef.current });

      if (newCpu > 90) addLog('logCpuStorm', 'warning');
      if (newTemp > 88) addLog('logHighTemp', 'warning');
    }, 2000);

    return () => clearInterval(hwInterval);
  }, [addLog, config.cars.length, config.speed]);

  useEffect(() => {
    addLog('logInit', 'success');
    const handleKeyDown = () => {
      resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 0.3);
      lastActivityRef.current = performance.now();
    };
    const handleMouseDown = () => {
      const miningWagons = config.cars.filter(c => c === 'mining').length;
      resourcesRef.current.scrap += (0.5 * (1 + (miningWagons * 0.5)));
      lastActivityRef.current = performance.now();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    const syncInterval = setInterval(() => {
      setUiResources({ ...resourcesRef.current });
      setRenderPuffs([...smokePuffsRef.current]);
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      clearInterval(syncInterval);
    };
  }, [addLog, config.cars]);

  const getPositionOnPerimeter = (d: number, W: number, H: number): Position => {
    const m = TRACK_MARGIN;
    const R = CORNER_RADIUS;
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    const perimeter = 2 * w_strip + 2 * h_strip + 4 * arc;
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

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = Math.min(time - lastTimeRef.current, 100); 
      const inactivitySeconds = (time - lastActivityRef.current) / 1000;
      
      const W = window.innerWidth;
      const H = window.innerHeight;
      const m = TRACK_MARGIN;
      const R = CORNER_RADIUS;
      const w_strip = Math.max(0, W - 2 * m - 2 * R);
      const h_strip = Math.max(0, H - 2 * m - 2 * R);
      const arc = (Math.PI * R) / 2;
      const perimeter = 2 * w_strip + 2 * h_strip + 4 * arc;

      const tempThrottling = hwStatsRef.current.temp > 85 ? 0.6 : 1.0;
      const energyFactor = resourcesRef.current.energy > 0 ? (0.2 + (resourcesRef.current.energy / 100) * 0.8) : 0;
      let effectiveSpeed = config.speed * energyFactor * tempThrottling;
      if (inactivitySeconds < 2) effectiveSpeed *= Math.max(1, 3 - inactivitySeconds / 10); 

      const isActuallyMoving = effectiveSpeed > 0.1;
      const moveAmount = (effectiveSpeed * 12 * deltaTime) / 1000;

      if (isActuallyMoving) {
        const residentialWagons = config.cars.filter(c => c === 'residential').length;
        resourcesRef.current.scrap += (residentialWagons * 0.00015 * deltaTime); 
      }

      // DISTANCE-BASED ENERGY CONSUMPTION
      // 1 full lap (perimeter) = 10 energy units (10%)
      const consumptionPerPixel = 10 / perimeter;
      const travelConsumption = moveAmount * consumptionPerPixel;
      
      // Minimal idle background consumption (to avoid infinite energy)
      const idleConsumption = (deltaTime / 20000);
      
      // Thermal penalty: Efficiency drops when core is hot (more resistance)
      const thermalFactor = (1 + Math.max(0, hwStatsRef.current.temp - 40) / 200);
      
      const energyLoss = (isActuallyMoving ? travelConsumption : idleConsumption) * thermalFactor;
      resourcesRef.current.energy = Math.max(0, resourcesRef.current.energy - energyLoss);

      const w = workerRef.current;
      const trainPos = getPositionOnPerimeter(distanceRef.current, W, H);
      const basePos = anchorPosRef.current;

      // WORKER LOGIC
      if (w.status === 'sleeping') {
        w.x = basePos.x; w.y = basePos.y;
        if (resourcesRef.current.energy < 15 && Date.now() - w.lastAction > 5000) { 
          w.status = 'approaching'; 
          addLog('logCritical', 'warning'); 
        }
      } else if (w.status === 'approaching') {
        const dx = trainPos.x - w.x; const dy = trainPos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 10) {
          w.status = 'refueling';
          setTimeout(() => {
            resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 70);
            addLog('logTransfer', 'success');
            workerRef.current.status = 'returning';
            workerRef.current.lastAction = Date.now();
            addLog('logReturn');
          }, 1000);
        } else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      } else if (w.status === 'returning') {
        const dx = basePos.x - w.x; const dy = basePos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 5) { 
          w.status = 'sleeping'; 
          w.lastAction = Date.now();
          addLog('logDocked', 'success'); 
        }
        else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      }

      distanceRef.current += moveAmount;
      resourcesRef.current.totalDistance += moveAmount / 2000;

      const jitter = hwStatsRef.current.cpu > 80 ? (Math.random() - 0.5) * (hwStatsRef.current.cpu / 15) : 0;

      carRefs.current.forEach((el, i) => {
        if (el) {
          const pos = getPositionOnPerimeter(distanceRef.current - (i * config.carSpacing), W, H);
          el.style.transform = `translate(${pos.x + jitter}px, ${pos.y + jitter}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });

      if (workerVisualRef.current) {
        workerVisualRef.current.style.transform = `translate(${w.x}px, ${w.y}px) translate(-50%, -50%) rotate(${w.rotation}deg)`;
        workerVisualRef.current.style.opacity = w.status === 'sleeping' ? '0.4' : '1';
        if (w.status === 'sleeping') {
           workerVisualRef.current.style.filter = `drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))`;
        } else {
           workerVisualRef.current.style.filter = `drop-shadow(0 0 12px #facc15)`;
        }
      }

      if (isActuallyMoving && time - lastSmokeTimeRef.current > (120 / (effectiveSpeed/4))) {
        const lp = getPositionOnPerimeter(distanceRef.current, W, H);
        const isStorm = hwStatsRef.current.cpu > 90;
        
        let sColor = isStorm ? 'rgba(56, 189, 248, 0.9)' : 'rgba(255,255,255,0.7)';
        if (!isStorm) {
           if (hwStatsRef.current.temp > 80) sColor = 'rgba(239,68,68,0.7)';
           else if (hwStatsRef.current.temp > 65) sColor = 'rgba(245,158,11,0.7)';
        }

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
        smokePuffsRef.current = [...smokePuffsRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME), newPuff].slice(-60);
        lastSmokeTimeRef.current = time;
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [config.speed, config.carSpacing, config.cars, addLog]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  const cpuGlitchActive = hwStats.cpu > 92;

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none ${cpuGlitchActive ? 'glitch-active' : ''}`}>
      {!isElectron && <DesktopSimulator logs={logs} language={language} />}

      <div 
        className="absolute inset-0 pointer-events-none z-[50] transition-opacity duration-1000"
        style={{ 
          opacity: Math.max(0, (hwStats.ram - 60) / 40),
          boxShadow: 'inset 0 0 150px rgba(255,255,255,0.2)',
          background: 'radial-gradient(circle, transparent 60%, rgba(200,220,255,0.15) 100%)'
        }}
      ></div>

      <div ref={workerVisualRef} className="absolute z-[110] pointer-events-none transition-opacity duration-300">
        <div className="relative">
          <div className="absolute top-1/2 right-1/2 -translate-y-1/2 w-4 h-0.5 bg-blue-400/40 blur-[1px] origin-right"></div>
          <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] border border-white/50 flex items-center justify-center relative z-10">
             <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-[150] overflow-visible">
        {renderPuffs.map(puff => (
          <div key={puff.id} className="absolute" style={{ 
            left: puff.x, 
            top: puff.y, 
            transform: `translate(-50%, -50%) rotate(${puff.rotation}deg)`,
            ['--drift-x' as any]: `${puff.driftX}px`, 
            ['--drift-y' as any]: `${puff.driftY}px` 
          }}>
            <div className={`blur-[1px] ${hwStats.cpu > 90 ? 'spark' : ''}`} 
                 style={{ 
                   width: puff.scale * 8,
                   height: puff.scale * 8,
                   backgroundColor: puff.color,
                   borderRadius: puff.borderRadius,
                   boxShadow: `0 0 10px ${puff.color}`,
                   animation: hwStats.cpu > 90 ? '' : `puff-world ${SMOKE_LIFETIME/1000}s forwards ease-out`, 
                   ['--dx' as any]: `${puff.driftX}px`,
                   ['--dy' as any]: `${puff.driftY}px`
                 }}></div>
          </div>
        ))}
      </div>

      <div className="train-container">
        {config.cars.map((carType, i) => (
          <div key={i} ref={el => { carRefs.current[i] = el; }} className="absolute pointer-events-none will-change-transform z-[100]">
            <TrainCar config={config} isLocomotive={i === 0} carType={carType} energy={uiResources.energy} />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none z-[200]">
        <div className="absolute" style={{ left: anchorPos.x, top: anchorPos.y }}>
          <div className="relative" onMouseEnter={showHub} onMouseLeave={hideHub}>
            <DraggableAnchor language={language} onHover={setIsPanelVisible} onPositionChange={(x, y) => setAnchorPos({x, y})} initialPos={anchorPos} setIgnoreMouse={setIgnoreMouse} />
            {isPanelVisible && (
              <div className="absolute left-8 -top-24 transition-all duration-300 pointer-events-auto shadow-2xl opacity-100 translate-y-0" onMouseEnter={showHub}>
                <ControlPanel 
                  config={config} 
                  resources={uiResources} 
                  hwStats={hwStats}
                  language={language} 
                  onLanguageChange={setLanguage} 
                  onChange={setConfig} 
                  onPulse={handleManualPulse} 
                  onUpgrade={handleUpgrade} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes puff-world {
          0% { transform: scale(0.2); opacity: 0; }
          15% { opacity: 0.9; }
          100% { transform: translate(var(--drift-x), var(--drift-y)) scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;
