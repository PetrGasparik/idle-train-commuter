
import React from 'react';
import { TrainConfig } from '../types';

interface TrainCarProps {
  config: TrainConfig;
  isLocomotive?: boolean;
}

const TrainCar: React.FC<TrainCarProps> = ({ config, isLocomotive }) => {
  const width = isLocomotive ? 64 : 54;
  const height = 28;

  const renderContent = () => {
    if (config.type === 'ai' && config.imageUrl) {
      return (
        <div className="w-full h-full relative drop-shadow-lg">
          <img 
            src={config.imageUrl} 
            alt="train-car" 
            className="w-full h-full object-contain"
            style={{ transform: 'rotate(90deg)' }}
          />
        </div>
      );
    }

    const baseColor = config.color;
    
    return (
      <div 
        className="relative w-full h-full rounded-md shadow-lg overflow-hidden"
        style={{ 
          backgroundColor: baseColor, 
          border: '1.5px solid rgba(0,0,0,0.4)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="absolute inset-x-3 top-1.5 bottom-1.5 bg-black/10 rounded-sm"></div>
        
        {isLocomotive ? (
          <>
            {/* Přední světlomet s jasnější září */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-5 bg-gray-900/90 rounded-sm border border-yellow-400/50 flex items-center justify-center">
               <div className="w-1.5 h-2.5 bg-yellow-300 blur-[2px] animate-pulse"></div>
            </div>
            {/* Kabina strojvedoucího */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-5 bg-black/30 rounded-sm border border-white/10 shadow-inner"></div>
            {/* Komín - zvýrazněný okraj */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-800 rounded-full border-2 border-black/60 shadow-lg z-10"></div>
          </>
        ) : (
          <div className="flex justify-around items-center h-full px-2 gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-3 bg-black/30 rounded-sm border border-white/5"></div>
            ))}
          </div>
        )}
        
        <div className="absolute top-0 left-0 right-0 h-[20%] bg-white/10"></div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
    >
      <div className="w-full h-full relative flex items-center justify-center">
        {/* Bafání kouře - generuje se pouze pro lokomotivu v pohybu */}
        {isLocomotive && config.speed > 0 && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none z-0">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute bg-white/30 blur-md rounded-full"
                style={{
                  width: '14px',
                  height: '14px',
                  // Rychlost animace závisí na rychlosti vlaku
                  animation: `puff ${Math.max(0.5, 3 / (config.speed * 0.15 + 1))}s infinite linear`,
                  animationDelay: `${i * 0.3}s`,
                  left: '-7px',
                  top: '-7px',
                }}
              />
            ))}
          </div>
        )}
        
        {renderContent()}
        
        <style>{`
          @keyframes puff {
            0% {
              transform: translate(0, 0) scale(0.4);
              opacity: 0;
            }
            15% {
              opacity: 0.7;
              transform: translate(-10px, -2px) scale(0.8);
            }
            100% {
              /* Kouř se táhne za lokomotivou a mírně stoupá/klesá */
              transform: translate(-60px, -20px) scale(3.5);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TrainCar;
