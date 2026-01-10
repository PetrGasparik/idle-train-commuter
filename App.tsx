
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

  const [hwStats, setHwStats] = useState<HardwareStats>({
    cpu: 10,
    ram: 30,
    temp: 45
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
  
  const isAppFocused = useRef(true);
  const resourcesRef = useRef<Resources>({ energy: 40, scrap: 0, totalDistance: 0 });
  const hwStatsRef = useRef<HardwareStats>({ cpu: 10, ram: 30, temp: 45 });
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
  const lastMouseUpdateRef = useRef<number>(0);

  useEffect(() => {
    anchorPosRef.current = anchorPos;
  }, [anchorPos]);

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

  // Hardware Weather Simulator
  useEffect(() => {
    const hwInterval = setInterval(() => {
      const stats = hwStatsRef.current;
      const newCpu = Math.max(5, Math.min(100, stats.cpu + (Math.random() - 0.45) * 15));
      const newRam = Math.max(20, Math.min(95, stats.ram + (Math.random() - 0.5) * 2));
      const newTemp = Math.max(35, Math.min(90, stats.temp + (newCpu > 70 ? 1 : -0.5)));
      
      hwStatsRef.current = { cpu: newCpu, ram: newRam, temp: newTemp };
      setHwStats({ ...hwStatsRef.current });

      if (newCpu > 90) addLog('logCpuStorm', 'warning');
      if (newTemp > 80) addLog('logHighTemp', 'warning');
    }, 3000);

    return () => clearInterval(hwInterval);
  }, [addLog]);

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
    }, 150);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      clearInterval(syncInterval);
    };
  }, [addLog, config.cars]);

  const getPerimeterSize = (W: number, H: number) => {
    const m = TRACK_MARGIN;
    const R = CORNER_RADIUS;
    return 2 * (W - 2*m - 2*R) + 2 * (H - 2*m - 2*R) + 4 * ((Math.PI * R) / 2);
  };

  const getPositionOnPerimeter = (d: number, W: number, H: number): Position => {
    const m = TRACK_MARGIN;
    const R = CORNER_RADIUS;
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    const perimeter = getPerimeterSize(W, H);
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
      
      const tempThrottling = hwStatsRef.current.temp > 85 ? 0.7 : 1.0;
      const energyFactor = resourcesRef.current.energy > 0 ? (0.2 + (resourcesRef.current.energy / 100) * 0.8) : 0;
      let effectiveSpeed = config.speed * energyFactor * tempThrottling;
      if (inactivitySeconds < 2) effectiveSpeed *= Math.max(1, 3 - inactivitySeconds / 10); 

      const isActuallyMoving = effectiveSpeed > 0.1;

      if (isActuallyMoving) {
        const residentialWagons = config.cars.filter(c => c === 'residential').length;
        resourcesRef.current.scrap += (residentialWagons * 0.0001 * deltaTime); 
      }

      const energyLoss = (isActuallyMoving ? (deltaTime / 2500) : (deltaTime / 15000)) * (1 + hwStatsRef.current.temp / 150);
      resourcesRef.current.energy = Math.max(0, resourcesRef.current.energy - energyLoss);

      const w = workerRef.current;
      const trainPos = getPositionOnPerimeter(distanceRef.current, window.innerWidth, window.innerHeight);
      const basePos = anchorPosRef.current;

      // FIXED WORKER LOGIC
      if (w.status === 'sleeping') {
        w.x = basePos.x; w.y = basePos.y;
        if (resourcesRef.current.energy < 15) { 
          w.status = 'approaching'; 
          addLog('logCritical', 'warning'); 
        }
      } else if (w.status === 'approaching') {
        const dx = trainPos.x - w.x; const dy = trainPos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 8) {
          w.status = 'refueling';
          setTimeout(() => {
            resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 70);
            addLog('logTransfer', 'success');
            // After refueling, immediately start returning to base to recharge drone and check if another trip is needed
            if (workerRef.current.status === 'refueling') {
              workerRef.current.status = 'returning';
              addLog('logReturn');
            }
          }, 1000);
        } else { w.x += (dx / dist) * (deltaTime * 0.22); w.y += (dy / dist) * (deltaTime * 0.22); }
      } else if (w.status === 'riding') {
        // This state is now mostly a fallback, the drone returns faster now
        w.x = trainPos.x; w.y = trainPos.y; w.rotation = trainPos.rotation;
        if (resourcesRef.current.energy > 95 || resourcesRef.current.energy < 25) { 
          w.status = 'returning'; 
          addLog('logReturn'); 
        }
      } else if (w.status === 'returning') {
        const dx = basePos.x - w.x; const dy = basePos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 5) { 
          w.status = 'sleeping'; 
          addLog('logDocked', 'success'); 
        }
        else { w.x += (dx / dist) * (deltaTime * 0.22); w.y += (dy / dist) * (deltaTime * 0.22); }
      }

      const moveAmount = (effectiveSpeed * 12 * deltaTime) / 1000;
      distanceRef.current += moveAmount;
      resourcesRef.current.totalDistance += moveAmount / 2000;

      const jitter = hwStatsRef.current.cpu > 80 ? (Math.random() - 0.5) * (hwStatsRef.current.cpu / 20) : 0;

      carRefs.current.forEach((el, i) => {
        if (el) {
          const pos = getPositionOnPerimeter(distanceRef.current - (i * config.carSpacing), window.innerWidth, window.innerHeight);
          el.style.transform = `translate(${pos.x + jitter}px, ${pos.y + jitter}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });

      if (workerVisualRef.current) {
        workerVisualRef.current.style.transform = `translate(${w.x}px, ${w.y}px) translate(-50%, -50%) rotate(${w.rotation}deg)`;
        workerVisualRef.current.style.opacity = w.status === 'sleeping' ? '0' : '1';
      }

      if (isActuallyMoving && time - lastSmokeTimeRef.current > (150 / (effectiveSpeed/4))) {
        const lp = getPositionOnPerimeter(distanceRef.current, window.innerWidth, window.innerHeight);
        let sColor = 'rgba(255,255,255,0.7)';
        if (hwStatsRef.current.temp > 75) sColor = 'rgba(239,68,68,0.7)';
        else if (hwStatsRef.current.temp > 60) sColor = 'rgba(245,158,11,0.7)';

        const newPuff: SmokeParticle = {
          id: nextParticleId.current++,
          x: lp.x, y: lp.y, rotation: lp.rotation, createdAt: time,
          scale: 0.6 + Math.random() * 0.6, randomRotation: Math.random() * 360,
          driftX: (Math.random() - 0.5) * 30, driftY: (Math.random() - 0.5) * 30, borderRadius: '50%',
          color: sColor
        };
        smokePuffsRef.current = [...smokePuffsRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME), newPuff].slice(-50);
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none">
      {!isElectron && <DesktopSimulator logs={logs} language={language} />}

      <div 
        className="absolute inset-0 pointer-events-none z-[50] transition-opacity duration-1000"
        style={{ 
          opacity: Math.max(0, (hwStats.ram - 60) / 40),
          boxShadow: 'inset 0 0 150px rgba(255,255,255,0.15)',
          background: 'radial-gradient(circle, transparent 70%, rgba(200,220,255,0.1) 100%)'
        }}
      ></div>

      <div ref={workerVisualRef} className="absolute z-[110] pointer-events-none transition-opacity duration-300">
        <div className="relative">
          <div className="absolute top-1/2 right-1/2 -translate-y-1/2 w-4 h-0.5 bg-blue-400/40 blur-[1px] origin-right"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_12px_#facc15] border border-white/50 flex items-center justify-center relative z-10">
             <div className="w-1 h-1 bg-black/40 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-[150] overflow-visible">
        {renderPuffs.map(puff => (
          <div key={puff.id} className="absolute" style={{ left: puff.x, top: puff.y, transform: `translate(-50%, -50%) rotate(${puff.rotation}deg)` }}>
            <div className="w-3.5 h-3.5 blur-[1px] rounded-full" 
                 style={{ 
                   backgroundColor: puff.color,
                   boxShadow: `0 0 8px ${puff.color}`,
                   animation: `puff-world ${SMOKE_LIFETIME/1000}s forwards ease-out`, 
                   ['--drift-x' as any]: `${puff.driftX}px`, 
                   ['--drift-y' as any]: `${puff.driftY}px` 
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
                <ControlPanel config={config} resources={uiResources} language={language} onLanguageChange={setLanguage} onChange={setConfig} onPulse={handleManualPulse} onUpgrade={handleUpgrade} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 right-4 p-3 bg-slate-950/80 backdrop-blur-xl rounded-2xl border border-white/10 z-[200] flex flex-col gap-2 min-w-[100px]">
        <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{t(language, 'hardwareStats')}</span>
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono">
             <span className="text-blue-400">CPU</span>
             <span className={hwStats.cpu > 80 ? 'text-red-500 animate-pulse' : 'text-white'}>{Math.floor(hwStats.cpu)}%</span>
          </div>
          <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${hwStats.cpu}%` }}></div>
          </div>
          <div className="flex justify-between text-[8px] font-mono mt-1">
             <span className="text-emerald-400">TEMP</span>
             <span className={hwStats.temp > 75 ? 'text-red-500 font-bold' : 'text-white'}>{Math.floor(hwStats.temp)}°C</span>
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
