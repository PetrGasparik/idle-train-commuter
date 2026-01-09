
import React from 'react';
import { Position, TrainConfig } from '../types';

interface TrainCarProps {
  pos: Position;
  config: TrainConfig;
  isLocomotive?: boolean;
}

const TrainCar: React.FC<TrainCarProps> = ({ pos, config, isLocomotive }) => {
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
        className="relative w-full h-full rounded-md shadow-lg transition-colors duration-500 overflow-hidden"
        style={{ 
          backgroundColor: baseColor, 
          border: '1.5px solid rgba(0,0,0,0.4)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Detaily střechy */}
        <div className="absolute inset-x-3 top-1.5 bottom-1.5 bg-black/10 rounded-sm"></div>
        
        {isLocomotive ? (
          <>
            {/* Přední světlo/kabina */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-5 bg-gray-900/80 rounded-sm border border-yellow-400/50 flex items-center justify-center">
               <div className="w-1 h-2 bg-yellow-400 blur-[1px]"></div>
            </div>
            {/* Výfuk/Ventilace */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-black/40 rounded-full border border-white/5"></div>
          </>
        ) : (
          /* Okna vagonu */
          <div className="flex justify-around items-center h-full px-2 gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-3 bg-black/30 rounded-sm border border-white/5"></div>
            ))}
          </div>
        )}
        
        {/* Odlesk na střeše */}
        <div className="absolute top-0 left-0 right-0 h-[20%] bg-white/10"></div>
      </div>
    );
  };

  return (
    <div
      className="absolute pointer-events-none z-50 transition-transform duration-[40ms] ease-linear"
      style={{
        left: 0,
        top: 0,
        width: width,
        height: height,
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ transform: `translate(-50%, -50%)` }}
      >
        {/* Spojka mezi vagony */}
        {!isLocomotive && (
          <div className="absolute -left-3 w-4 h-1 bg-gray-800 rounded-full z-[-1]"></div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default TrainCar;
