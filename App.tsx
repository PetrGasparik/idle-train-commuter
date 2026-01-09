import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrainConfig, Position, SmokeParticle, Resources } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';

const TRACK_MARGIN = 19; 
const CORNER_RADIUS = 40; 
const SMOKE_LIFETIME = 1000; 

const App: React.FC = () => {
  const [config, setConfig] = useState<TrainConfig>({
    speed: 4, // Mírně nižší základní rychlost
    carCount: 3,
    carSpacing: 65,
    color: '#3b82f6',
    type: 'modern'
  });

  const [uiResources, setUiResources] = useState<Resources>({
    energy: 0,
    scrap: 0,
    totalDistance: 0
  });

  const resourcesRef = useRef<Resources>({ energy: 0, scrap: 0, totalDistance: 0 });
  // DŮLEŽITÉ: Používáme performance.now() pro konzistenci s requestAnimationFrame
  const lastActivityRef = useRef(performance.now());
  const distanceRef = useRef(0);
  const smokePuffsRef = useRef<SmokeParticle[]>([]);
  const [renderPuffs, setRenderPuffs] = useState<SmokeParticle[]>([]);
  
  const carRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);
  const lastSmokeTimeRef = useRef<number>(0);
  const nextParticleId = useRef(0);

  useEffect(() => {
    const handleKeyDown = () => {
      resourcesRef.current.energy += 1;
      lastActivityRef.current = performance.now();
    };
    const handleMouseDown = () => {
      resourcesRef.current.scrap += 1;
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
  }, []);

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
      
      // Výpočet nečinnosti - teď už ve stejných jednotkách (ms)
      const inactivityMs = time - lastActivityRef.current;
      const inactivitySeconds = inactivityMs / 1000;
      
      // Multiplikátor klesne na 0 po 15 sekundách nečinnosti
      const activityMultiplier = Math.max(0, 1 - inactivitySeconds / 15);
      const effectiveSpeed = config.speed * activityMultiplier;

      // Snížený koeficient z 20 na 12 pro plynulejší jízdu
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

      // Kouř se tvoří jen když se vlak hýbe
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
        // Postupné mizení starého kouře i když vlak stojí
        smokePuffsRef.current = smokePuffsRef.current.filter(p => time - p.createdAt < SMOKE_LIFETIME);
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [config.speed, config.carSpacing]);

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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none">
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
        <div className="pointer-events-auto w-fit h-fit absolute top-12 right-12 shadow-2xl" onMouseEnter={() => setIgnoreMouse(false)} onMouseLeave={() => setIgnoreMouse(true)}>
          <ControlPanel config={config} resources={uiResources} onChange={setConfig} onWallpaperChange={() => {}} />
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