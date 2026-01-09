
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrainConfig, Position } from './types';
import TrainCar from './components/TrainCar';
import Track from './components/Track';
import ControlPanel from './components/ControlPanel';

const TRACK_MARGIN = 20; // Vzdálenost osy kolejí od okraje obrazovky

const App: React.FC = () => {
  const [config, setConfig] = useState<TrainConfig>({
    speed: 5,
    carCount: 6,
    carSpacing: 65,
    color: '#3b82f6',
    type: 'modern'
  });
  
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [distance, setDistance] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animate = useCallback(() => {
    setDistance(prev => prev + config.speed * 0.15);
    requestRef.current = requestAnimationFrame(animate);
  }, [config.speed]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const getPositionOnPerimeter = (d: number): Position => {
    const { width: W, height: H } = viewportSize;
    const m = TRACK_MARGIN;
    const w = W - m * 2;
    const h = H - m * 2;
    const perimeter = 2 * w + 2 * h;
    
    let currentD = d % perimeter;
    if (currentD < 0) currentD += perimeter;

    if (currentD < w) {
      return { x: m + currentD, y: m, rotation: 0 };
    }
    currentD -= w;
    if (currentD < h) {
      return { x: m + w, y: m + currentD, rotation: 90 };
    }
    currentD -= h;
    if (currentD < w) {
      return { x: m + w - currentD, y: m + h, rotation: 180 };
    }
    currentD -= w;
    return { x: m, y: m + h - currentD, rotation: 270 };
  };

  const trainCars = Array.from({ length: config.carCount }).map((_, i) => {
    const carDistance = distance - i * config.carSpacing;
    return getPositionOnPerimeter(carDistance);
  });

  const handleQuit = () => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('quit-app');
    }
  };

  const setIgnoreMouse = (ignore: boolean) => {
    if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('set-ignore-mouse-events', ignore, true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none">
      <Track />
      
      {trainCars.map((pos, i) => (
        <TrainCar 
          key={i} 
          pos={pos} 
          config={config} 
          isLocomotive={i === 0} 
        />
      ))}

      <div className="absolute inset-0 pointer-events-none z-[100]">
        <div 
          className="pointer-events-auto w-fit h-fit absolute top-8 right-8"
          onMouseEnter={() => setIgnoreMouse(false)}
          onMouseLeave={() => setIgnoreMouse(true)}
        >
          <ControlPanel 
            config={config} 
            onChange={setConfig} 
            onWallpaperChange={() => {}} 
          />
        </div>

        <div 
          className="absolute bottom-4 left-4 pointer-events-auto"
          onMouseEnter={() => setIgnoreMouse(false)}
          onMouseLeave={() => setIgnoreMouse(true)}
        >
          <div 
            onClick={handleQuit}
            className="group flex items-center gap-2 bg-black/60 hover:bg-red-600 backdrop-blur-md text-white/50 hover:text-white px-4 py-2 rounded-lg border border-white/10 transition-all cursor-pointer text-[10px] font-bold tracking-widest uppercase"
          >
            ✕ Exit Train
          </div>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/5 px-4 py-1.5 rounded-full text-white/30 text-[9px] backdrop-blur-md pointer-events-none border border-white/10 tracking-[0.4em] uppercase font-semibold">
          Desktop Perimeter Active
        </div>
      </div>
    </div>
  );
};

export default App;
