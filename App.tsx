
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TrainConfig, Position, SmokeParticle, Resources, LogEntry, WorkerState, Language, CarType, HardwareStats } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';
import DraggableAnchor from './components/DraggableAnchor';
import DesktopSimulator from './components/DesktopSimulator';
import GodModeOverlay from './components/GodModeOverlay';
import { t } from './locales';

const SMOKE_LIFETIME = 1200; 
const MAX_PARTICLES = 30; 

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
    idleCruise: true,
    trackMargin: 14,
    cornerRadius: 30,
    cpuUpgradeLevel: 0
  });

  const [uiResources, setUiResources] = useState<Resources>({
    energy: 40, 
    scrap: 0,
    totalDistance: 0
  });

  const [efficiencyLevel, setEfficiencyLevel] = useState(0);

  const [hwStats, setHwStats] = useState<HardwareStats & { isReal?: boolean }>({
    cpu: 10,
    ram: 30,
    temp: 45,
    isReal: false
  });

  const [isGodModeVisible, setIsGodModeVisible] = useState(true);

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
  const hideTimeoutRef = useRef<number | null>(null);

  const showHub = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsPanelVisible(true);
  }, []);

  const toggleHub = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsPanelVisible(prev => !prev);
  }, []);

  const startHideTimer = useCallback(() => {
    if (hideTimeoutRef.current !== null) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsPanelVisible(false);
      hideTimeoutRef.current = null;
    }, 1000);
  }, []);
  
  const resourcesRef = useRef<Resources>({ energy: 40, scrap: 0, totalDistance: 0 });
  const efficiencyRef = useRef(0);
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
    return () => window.removeEventListener('resize', updateMetrics);
  }, [updateMetrics]);

  useEffect(() => {
    anchorPosRef.current = anchorPos;
  }, [anchorPos]);

  useEffect(() => {
    efficiencyRef.current = efficiencyLevel;
  }, [efficiencyLevel]);

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

  const addLog = useCallback((messageKey: any, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const message = t(language, messageKey);
    const newLog: LogEntry = { id: Math.random().toString(36).substr(2, 9), timestamp, message, type };
    setLogs(prev => [...prev.slice(-30), newLog]);
  }, [language]);

  const handleManualPulse = useCallback(() => {
    resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 5);
    boostImpulseRef.current += 30; 
    
    const miningWagons = config.cars.filter(c => c === 'mining').length;
    if (miningWagons > 0) {
      resourcesRef.current.scrap += (1 * miningWagons);
    }

    hwStatsRef.current.cpu = Math.min(100, hwStatsRef.current.cpu + 15);
    setHwStats(prev => ({ ...prev, cpu: hwStatsRef.current.cpu }));
    lastActivityRef.current = performance.now();
    addLog('logManualFuel', 'success');
  }, [addLog, config.cars]);

  const handleGodAddScrap = useCallback(() => {
    resourcesRef.current.scrap += 999;
    setUiResources(prev => ({ ...prev, scrap: resourcesRef.current.scrap }));
  }, []);

  const handleUpgrade = useCallback((type: 'wagon' | 'fuel' | 'mining' | 'residential' | 'cpu') => {
    const costs = { wagon: 10, fuel: 25, mining: 15, residential: 20, cpu: 30 };
    if (resourcesRef.current.scrap >= costs[type]) {
      resourcesRef.current.scrap -= costs[type];
      if (type === 'fuel') {
        setEfficiencyLevel(prev => prev + 1);
        addLog('logEfficiency', 'success');
      } else if (type === 'cpu') {
        setConfig(prev => ({ ...prev, cpuUpgradeLevel: prev.cpuUpgradeLevel + 1 }));
        addLog('logCpuUpgrade', 'success');
      } else {
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

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = Math.min(time - lastTimeRef.current, 100); 
      const inactivitySeconds = (time - lastActivityRef.current) / 1000;
      const { perimeter } = metricsRef.current;
      const tempThrottling = hwStatsRef.current.temp > 85 ? 0.6 : 1.0;
      const energyFactor = resourcesRef.current.energy > 0 ? (0.2 + (resourcesRef.current.energy / 100) * 0.8) : 0;
      let effectiveSpeed = config.speed * energyFactor * tempThrottling;
      
      if (inactivitySeconds < 2) effectiveSpeed *= Math.max(1, 3 - inactivitySeconds / 10); 
      
      const isActuallyMoving = effectiveSpeed > 0.1;
      let moveAmount = (effectiveSpeed * 12 * deltaTime) / 1000;
      
      if (boostImpulseRef.current > 0.1) {
        const step = boostImpulseRef.current * 0.2; 
        moveAmount += step;
        boostImpulseRef.current -= step;
      } else {
        boostImpulseRef.current = 0;
      }

      if (isActuallyMoving) {
        const resWagons = config.cars.filter(c => c === 'residential').length;
        resourcesRef.current.scrap += (resWagons * 0.00015 * deltaTime); 
      }

      const efficiencyMultiplier = Math.pow(0.85, efficiencyRef.current);
      const consumptionPerPixel = (10 / (perimeter || 5000)) * efficiencyMultiplier;
      
      const energyLoss = (isActuallyMoving ? (moveAmount * consumptionPerPixel) : (deltaTime / 20000)) * (1 + Math.max(0, hwStatsRef.current.temp - 40) / 200);
      resourcesRef.current.energy = Math.max(0, resourcesRef.current.energy - energyLoss);
      
      const w = workerRef.current;
      const trainPos = getPositionOnPerimeter(distanceRef.current);
      const basePos = anchorPosRef.current;

      if (w.status === 'sleeping') {
        w.x = basePos.x; w.y = basePos.y;
        if (resourcesRef.current.energy < 15 && Date.now() - w.lastAction > 5000) w.status = 'approaching'; 
      } else if (w.status === 'approaching') {
        const dx = trainPos.x - w.x; const dy = trainPos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 10) {
          w.status = 'refueling';
          setTimeout(() => {
            resourcesRef.current.energy = Math.min(100, resourcesRef.current.energy + 70);
            workerRef.current.status = 'returning';
            workerRef.current.lastAction = Date.now();
          }, 1000);
        } else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      } else if (w.status === 'refueling') {
        w.x = trainPos.x;
        w.y = trainPos.y;
        w.rotation = trainPos.rotation;
      } else if (w.status === 'returning') {
        const dx = basePos.x - w.x; const dy = basePos.y - w.y; const dist = Math.sqrt(dx*dx + dy*dy);
        w.rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (dist < 5) { w.status = 'sleeping'; w.lastAction = Date.now(); }
        else { w.x += (dx / dist) * (deltaTime * 0.25); w.y += (dy / dist) * (deltaTime * 0.25); }
      }
      
      distanceRef.current += moveAmount;
      resourcesRef.current.totalDistance += moveAmount / 2000;
      
      // CPU Glitch threshold influenced by upgrade
      const glitchThreshold = 92 + (config.cpuUpgradeLevel * 4);
      const isGlitching = hwStatsRef.current.cpu > glitchThreshold;
      const jitter = isGlitching ? (Math.random() - 0.5) * (hwStatsRef.current.cpu / 15) : 0;
      
      carRefs.current.forEach((el, i) => {
        if (el) {
          const pos = getPositionOnPerimeter(distanceRef.current - (i * config.carSpacing));
          el.style.transform = `translate(${pos.x + jitter}px, ${pos.y + jitter}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });
      if (workerVisualRef.current) {
        workerVisualRef.current.style.transform = `translate(${w.x}px, ${w.y}px) translate(-50%, -50%) rotate(${w.rotation}deg)`;
        workerVisualRef.current.style.opacity = w.status === 'sleeping' ? '0.4' : '1';
        workerVisualRef.current.style.filter = w.status === 'sleeping' ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 0 120px #facc15)';
      }
      if (isActuallyMoving && time - lastSmokeTimeRef.current > (150 / (effectiveSpeed/4))) {
        const lp = getPositionOnPerimeter(distanceRef.current);
        const isStorm = isGlitching;
        let sColor = isStorm ? 'rgba(56, 189, 248, 0.9)' : (hwStatsRef.current.temp > 80 ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.7)');
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
            const currentScale = p.scale * (0.2 + age * 3);
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
  }, [config.speed, config.carSpacing, config.cars, config.trackMargin, config.cornerRadius, config.cpuUpgradeLevel]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => {
    const hwSim = setInterval(() => {
      const stats = hwStatsRef.current;
      const wagonLoad = config.cars.length * 3.5;
      const speedLoad = config.speed * 0.75;
      const targetCpu = Math.min(100, 5 + wagonLoad + speedLoad);
      const jitter = (Math.random() - 0.5) * 4;
      const newCpu = Math.max(2, Math.min(100, stats.cpu + (targetCpu - stats.cpu) * 0.2 + jitter));
      const targetTemp = 35 + (newCpu * 0.55);
      const newTemp = stats.temp + (targetTemp - stats.temp) * 0.15;

      hwStatsRef.current = { 
        cpu: newCpu, 
        ram: Math.min(95, 25 + (config.cars.length * 2.5)), 
        temp: newTemp, 
        isReal: false 
      };
      setHwStats({ ...hwStatsRef.current });

      const glitchThreshold = 92 + (config.cpuUpgradeLevel * 4);
      if (newCpu > glitchThreshold) addLog('logCpuStorm', 'warning');
    }, 1000); 
    return () => clearInterval(hwSim);
  }, [config.cars.length, config.speed, config.cpuUpgradeLevel, addLog]);

  useEffect(() => {
    const syncInterval = setInterval(() => { setUiResources({ ...resourcesRef.current }); }, 250); 
    return () => { clearInterval(syncInterval); };
  }, []);

  const glitchActive = hwStats.cpu > (92 + config.cpuUpgradeLevel * 4);

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none ${glitchActive ? 'glitch-active' : ''}`}>
      {!isElectron && <DesktopSimulator logs={logs} language={language} />}
      
      <GodModeOverlay 
        isVisible={isGodModeVisible} 
        onToggle={() => setIsGodModeVisible(!isGodModeVisible)}
        onAddScrap={handleGodAddScrap}
        setIgnoreMouse={setIgnoreMouse}
      />

      <div ref={workerVisualRef} className="absolute z-[110] pointer-events-none transition-opacity duration-300">
        <div className="relative">
          <div className="absolute top-1/2 right-1/2 -translate-y-1/2 w-4 h-0.5 bg-blue-400/40 blur-[1px] origin-right"></div>
          <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] border border-white/50 flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-black/60 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none z-[150] overflow-visible">
        {Array.from({ length: MAX_PARTICLES }).map((_, i) => (
          <div key={i} ref={el => { particleRefs.current[i] = el; }} className="absolute blur-[1px] will-change-transform" style={{ display: 'none', width: '8px', height: '8px' }} />
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
          <div 
            className="relative" 
            onMouseEnter={isPanelVisible ? showHub : undefined} 
            onMouseLeave={isPanelVisible ? startHideTimer : undefined}
          >
            <DraggableAnchor 
              language={language} 
              onHover={(val) => {
                if (!val && isPanelVisible) startHideTimer();
                else if (val && isPanelVisible) showHub();
              }} 
              onClick={toggleHub}
              onPositionChange={(x, y) => setAnchorPos({x, y})} 
              initialPos={anchorPos} 
              setIgnoreMouse={setIgnoreMouse} 
            />
            {isPanelVisible && (
              <div 
                className="absolute left-8 -top-24 transition-all duration-300 pointer-events-auto shadow-2xl"
                onMouseEnter={showHub}
                onMouseLeave={startHideTimer}
              >
                <ControlPanel 
                  config={config} 
                  resources={uiResources} 
                  hwStats={hwStats} 
                  language={language} 
                  logs={logs}
                  efficiencyLevel={efficiencyLevel}
                  onLanguageChange={setLanguage} 
                  onChange={setConfig} 
                  onPulse={handleManualPulse} 
                  onUpgrade={handleUpgrade}
                  isGodMode={isGodModeVisible}
                  onGodAddScrap={handleGodAddScrap}
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
