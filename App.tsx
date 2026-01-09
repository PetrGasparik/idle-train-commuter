
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrainConfig, Position } from './types';
import TrainCar from './components/TrainCar';
import ControlPanel from './components/ControlPanel';

const TRACK_MARGIN = 40; 
const CORNER_RADIUS = 50; 

const App: React.FC = () => {
  const [config, setConfig] = useState<TrainConfig>({
    speed: 8,
    carCount: 6,
    carSpacing: 65,
    color: '#3b82f6',
    type: 'modern'
  });
  
  const distanceRef = useRef(0);
  const carRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const getPositionOnPerimeter = (d: number, W: number, H: number): Position => {
    const m = TRACK_MARGIN;
    const R = CORNER_RADIUS;
    
    const w_strip = Math.max(0, W - 2 * m - 2 * R);
    const h_strip = Math.max(0, H - 2 * m - 2 * R);
    const arc = (Math.PI * R) / 2;
    
    const perimeter = 2 * w_strip + 2 * h_strip + 4 * arc;
    let currentD = d % perimeter;
    if (currentD < 0) currentD += perimeter;

    // Horní hrana
    if (currentD < w_strip) {
      return { x: m + R + currentD, y: m, rotation: 0 };
    }
    currentD -= w_strip;

    // Horní pravý roh
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { 
        x: (W - m - R) + Math.sin(angle) * R, 
        y: (m + R) - Math.cos(angle) * R, 
        rotation: (angle * 180) / Math.PI 
      };
    }
    currentD -= arc;

    // Pravá hrana
    if (currentD < h_strip) {
      return { x: W - m, y: m + R + currentD, rotation: 90 };
    }
    currentD -= h_strip;

    // Dolní pravý roh
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { 
        x: (W - m - R) + Math.cos(angle) * R, 
        y: (H - m - R) + Math.sin(angle) * R, 
        rotation: 90 + (angle * 180) / Math.PI 
      };
    }
    currentD -= arc;

    // Dolní hrana
    if (currentD < w_strip) {
      return { x: (W - m - R) - currentD, y: H - m, rotation: 180 };
    }
    currentD -= w_strip;

    // Dolní levý roh
    if (currentD < arc) {
      const angle = (currentD / arc) * (Math.PI / 2);
      return { 
        x: (m + R) - Math.sin(angle) * R, 
        y: (H - m - R) + Math.cos(angle) * R, 
        rotation: 180 + (angle * 180) / Math.PI 
      };
    }
    currentD -= arc;

    // Levá hrana
    if (currentD < h_strip) {
      return { x: m, y: (H - m - R) - currentD, rotation: 270 };
    }
    currentD -= h_strip;

    // Horní levý roh
    const angle = (currentD / arc) * (Math.PI / 2);
    return { 
      x: (m + R) - Math.cos(angle) * R, 
      y: (m + R) - Math.sin(angle) * R, 
      rotation: 270 + (angle * 180) / Math.PI 
    };
  };

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      const moveAmount = (config.speed * 20 * deltaTime) / 1000;
      distanceRef.current += moveAmount;

      carRefs.current.forEach((el, i) => {
        if (el) {
          const carDistance = distanceRef.current - i * config.carSpacing;
          const pos = getPositionOnPerimeter(carDistance, window.innerWidth, window.innerHeight);
          el.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        }
      });
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
    } catch (e) {
      // Browser fallback
    }
  };

  useEffect(() => {
    carRefs.current = carRefs.current.slice(0, config.carCount);
  }, [config.carCount]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none">
      <div className="train-container">
        {Array.from({ length: config.carCount }).map((_, i) => (
          <div 
            key={i} 
            ref={el => { carRefs.current[i] = el; }}
            className="absolute pointer-events-none z-50 will-change-transform"
            style={{ left: 0, top: 0, overflow: 'visible' }}
          >
            <TrainCar 
              config={config} 
              isLocomotive={i === 0} 
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none z-[100]">
        <div 
          className="pointer-events-auto w-fit h-fit absolute top-12 right-12 shadow-2xl"
          onMouseEnter={() => setIgnoreMouse(false)}
          onMouseLeave={() => setIgnoreMouse(true)}
        >
          <ControlPanel 
            config={config} 
            onChange={setConfig} 
            onWallpaperChange={() => {}} 
          />
        </div>
      </div>
    </div>
  );
};

export default App;
