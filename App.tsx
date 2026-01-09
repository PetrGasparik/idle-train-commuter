import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrainConfig, Position, SmokeParticle, Resources, LogEntry } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';
import DraggableAnchor from './components/DraggableAnchor';
import DesktopSimulator from './components/DesktopSimulator';

const TRACK_MARGIN = 19; 
const CORNER_RADIUS = 40; 
const SMOKE_LIFETIME = 1000; 

const App: React.FC = () => {
  const isElectron = typeof window !== 'undefined' && 
                     (window as any).process && 
                     (window as any).process.versions && 
                     !!(window as any).process.versions.electron;

  const [config, setConfig] = useState<TrainConfig>({
    speed: 4,
    carCount: 3,
    carSpacing: 65,
    color: '#3b82f6',
    type: 'modern',
    idleCruise: true
  });

  const [uiResources, setUiResources] = useState<Resources>({
    energy: 0,
    scrap: 0,
    totalDistance: 0
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const isMovingRef = useRef(true);
  const isAppFocused = useRef(true);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-14), newLog]);
  }, []);

  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [anchorPos, setAnchorPos] = useState(() => {
    const saved = localStorage.getItem('anchorPos');
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed || { x: window.innerWidth > 0 ? window.innerWidth - 100 : 800, y: 100 };
  });

  const resourcesRef = useRef<Resources>({ energy: 0, scrap: 0, totalDistance: 0 });
  const lastActivityRef = useRef(performance.now());
  const distanceRef = useRef(0);
  const smokePuffsRef = useRef<SmokeParticle[]>([]);
  const [renderPuffs, setRenderPuffs] = useState<SmokeParticle[]>([]);
  
  const carRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastSmokeTimeRef = useRef<number>(0);
  const nextParticleId = useRef(0);

  const handleManualPulse = useCallback(() => {
    resourcesRef.current.energy += 25;
    lastActivityRef.current = performance.now();
    addLog('MANUAL OVERRIDE: 25 Energy injected', 'success');
  }, [addLog]);

  useEffect(() => {
    addLog('Perimeter OS initialised', 'success');
    addLog('Environment: ' + (isElectron ? 'ELECTRON_SHELL' : 'WEB_BROWSER'), 'info');

    // Electron specific listeners
    if (isElectron) {
      try {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.on('app-focus-change', (_: any, focused: boolean) => {
          isAppFocused.current = focused;
          if (focused) {
            addLog('INTERFACES_ENGAGED: Input focus restored', 'success');
            lastActivityRef.current = performance.now();
          } else {
            addLog('BACKGROUND_MODE: Monitoring system pulse...', 'warning');
          }
        });
      } catch (e) {}
    }
    
    const handleKeyDown = () => {
      resourcesRef.current.energy += 1;
      lastActivityRef.current = performance.now();
      if (Math.random() > 0.95) addLog('Direct Input Detected', 'input');
    };
    const handleMouseDown = () => {
      resourcesRef.current.scrap += 1;
      lastActivityRef.current = performance.now();
      if (Math.random() > 0.8) addLog('Activity Signal Captured', 'input');
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
  }, [addLog, isElectron]);

  const getPositionOnPerimeter = (d: number, W: number, H: number): Position => {
    const m = TRACK_MARGIN;
    const R = CORNER_RADIUS;
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    const perimeter = 2 * w_strip + 2 * h_strip + 4 * arc;
    let currentD = d % perimeter;
    if (currentD < 0) currentD += perimeter;

    if (currentD < w_strip) return { x: m + R + currentD, y: m, rotation: 0 };
    currentD -= w_strip;
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { x: (W - m - R) + Math.sin(angle) * R, y: (m + R) - Math.cos(angle) * R, rotation: (angle * 180) / Math.PI };
    }
    currentD -= arc;
    if (currentD < h_strip) return { x: W - m, y: m + R + currentD, rotation: 90 };
    currentD -= h_strip;
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { x: (W - m - R) + Math.cos(angle) * R, y: (H - m - R) + Math.sin(angle) * R, rotation: 90 + (angle * 180) / Math.PI };
    }
    currentD -= arc;
    if (currentD < w_strip) return { x: (W - m - R) - currentD, y: H - m, rotation: 180 };
    currentD -= w_strip;
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { x: (m + R) - Math.sin(angle) * R, y: (H - m - R) + Math.cos(angle) * R, rotation: 180 + (angle * 180) / Math.PI };
    }
    currentD -= arc;
    if (currentD < h_strip) return { x: m, y: (H - m - R) - currentD, rotation: 270 };
    currentD -= h_strip;
    const angle = (currentD / arc) * (Math.PI / 2);
    return { x: (m + R) - Math.cos(angle) * R, y: (m + R) - Math.sin(angle) * R, rotation: 270 + (angle * 180) / Math.PI };
  };

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = Math.min(time - lastTimeRef.current, 100); 
      const inactivityMs = time - lastActivityRef.current;
      const inactivitySeconds = inactivityMs / 1000;
      
      const minMultiplier = config.idleCruise ? 0.35 : 0;
      // Pokud je okno focused, aktivita klesá pomaleji
      const decayFactor = isAppFocused.current ? 30 : 15;
      const activityMultiplier = Math.max(minMultiplier, 1 - inactivitySeconds / decayFactor);
      const effectiveSpeed = config.speed * activityMultiplier;

      if (effectiveSpeed <= (config.speed * 0.4) && isMovingRef.current && !config.idleCruise) {
        isMovingRef.current = false;
        addLog('ENGINE_STANDBY: Low kinetic energy', 'warning');
      } else if (effectiveSpeed > (config.speed * 0.4) && !isMovingRef.current) {
        isMovingRef.current = true;
        addLog('ENGINE_BOOST: Kinetic recovery', 'success');
      }

      const moveAmount = (effectiveSpeed * 12 * deltaTime) / 1000;
      distanceRef.current += moveAmount;
      resourcesRef.current.totalDistance += moveAmount / 100;

      carRefs.current.forEach((el, i) => {
        if (el) {
          const offsetCorrection = i > 0 ? 5 : 0;
          const carDistance = distanceRef.current - (i * config.carSpacing + offsetCorrection);
          const pos = getPositionOnPerimeter(carDistance, window.innerWidth, window.innerHeight);
          el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });

      if (effectiveSpeed > 0.1) {
        const baseInterval = 150; 
        const smokeInterval = baseInterval / Math.max(0.2, activityMultiplier);

        if (time - lastSmokeTimeRef.current > smokeInterval) {
          const lp = getPositionOnPerimeter(distanceRef.current, window.innerWidth, window.innerHeight);
          const angleRad = (lp.rotation * Math.PI) / 180;
          
          const newPuff: SmokeParticle = {
            id: nextParticleId.current++,
            x: lp.x - Math.cos(angleRad) * 12,
            y: lp.y - Math.sin(angleRad) * 12,
            rotation: lp.rotation,
            createdAt: time,
            scale: 0.4 + Math.random() * 0.4,
            randomRotation: Math.random() * 360,
            driftX: (Math.random() - 0.5) * 20,
            driftY: (Math.random() - 0.5) * 20,
            borderRadius: `40% 60% 50% 50% / 50% 50% 50% 50%`
          };
          
          smokePuffsRef.current = [...smokePuffsRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME), newPuff];
          lastSmokeTimeRef.current = time;
        }
      } else {
        smokePuffsRef.current = smokePuffsRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [config.speed, config.carSpacing, config.idleCruise, addLog]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const setIgnoreMouse = (ignore: boolean) => {
    try {
      if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.send('set-ignore-mouse-events', ignore, true);
      }
    } catch (e) {}
  };

  const handleAnchorPosition = (x: number, y: number) => {
    setAnchorPos({ x, y });
    localStorage.setItem('anchorPos', JSON.stringify({ x, y }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none">
      {!isElectron && <DesktopSimulator logs={logs} />}

      <div className="absolute inset-0 pointer-events-none z-[150] overflow-visible">
        {renderPuffs.map(puff => (
          <div key={puff.id} className="absolute flex items-center justify-center will-change-transform" style={{ left: puff.x, top: puff.y, transform: `translate(-50%, -50%) rotate(${puff.rotation}deg)` }}>
            <div className="relative w-4 h-4" style={{ animation: `puff-world ${SMOKE_LIFETIME / 1000}s forwards ease-out`, ['--drift-x' as any]: `${puff.driftX}px`, ['--drift-y' as any]: `${puff.driftY}px`, ['--init-scale' as any]: puff.scale, ['--rand-rot' as any]: `${puff.randomRotation}deg` }}>
              <div className="absolute inset-0 shadow-sm border border-black/5" style={{ transform: `rotate(var(--rand-rot))`, background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #eeeeee 100%)', borderRadius: '40%', filter: 'blur(0.2px)' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="train-container">
        {Array.from({ length: config.carCount }).map((_, i) => (
          <div key={i} ref={el => { carRefs.current[i] = el; }} className="absolute pointer-events-none will-change-transform" style={{ left: 0, top: 0, zIndex: 100 - i }}>
            <TrainCar config={config} isLocomotive={i === 0} />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none z-[200]">
        <div 
          className="pointer-events-auto"
          onMouseEnter={() => setIgnoreMouse(false)} 
          onMouseLeave={() => !isPanelVisible && setIgnoreMouse(true)}
        >
          <DraggableAnchor 
            onHover={setIsPanelVisible} 
            onPositionChange={handleAnchorPosition}
            initialPos={anchorPos}
          />
        </div>

        <div 
          className={`fixed transition-all duration-300 pointer-events-auto shadow-2xl ${isPanelVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          style={{ 
            left: Math.max(20, anchorPos.x - 260), 
            top: anchorPos.y,
            zIndex: 250
          }}
          onMouseEnter={() => { setIsPanelVisible(true); setIgnoreMouse(false); }}
          onMouseLeave={() => { setIsPanelVisible(false); setIgnoreMouse(true); }}
        >
          <ControlPanel 
            config={config} 
            resources={uiResources} 
            onChange={setConfig} 
            onWallpaperChange={() => {}} 
            onPulse={handleManualPulse}
          />
        </div>
      </div>

      <style>{`
        @keyframes puff-world {
          0% { transform: translate(0, 0) scale(calc(var(--init-scale) * 0.1)) rotate(0deg); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(calc(-50px + var(--drift-x)), calc(5px + var(--drift-y))) scale(3.5) rotate(90deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default App;