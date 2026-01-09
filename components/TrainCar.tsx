
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
            {/* Přední světlomet */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-5 bg-gray-900/90 rounded-sm border border-yellow-400/50 flex items-center justify-center">
               <div className="w-1.5 h-2.5 bg-yellow-300 blur-[2px] animate-pulse"></div>
            </div>
            {/* Kabina */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-5 bg-black/30 rounded-sm border border-white/10 shadow-inner"></div>
            {/* Komín */}
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
        overflow: 'visible' // Důležité: umožní kouři "vyletět" z divu vagonku
      }}
    >
      <div className="w-full h-full relative flex items-center justify-center" style={{ overflow: 'visible' }}>
        {/* Bafání kouře */}
        {isLocomotive && config.speed > 0 && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none z-[60]" style={{ overflow: 'visible' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute bg-white/60 blur-md rounded-full"
                style={{
                  width: '18px',
                  height: '18px',
                  animation: `puff ${Math.max(0.4, 2.5 / (config.speed * 0.2 + 1))}s infinite linear`,
                  animationDelay: `${i * 0.25}s`,
                  left: '-9px',
                  top: '-9px',
                }}
              />
            ))}
          </div>
        )}
        
        {renderContent()}
        
        <style>{`
          @keyframes puff {
            0% {
              transform: translate(0, 0) scale(0.3);
              opacity: 0;
            }
            10% {
              opacity: 0.9;
            }
            100% {
              /* Směr +25px zajistí, že kouř fouká do plochy (inward), ne ven z monitoru */
              transform: translate(-80px, 25px) scale(4);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TrainCar;
