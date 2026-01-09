
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
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-5 bg-gray-900/80 rounded-sm border border-yellow-400/50 flex items-center justify-center">
               <div className="w-1 h-2 bg-yellow-400 blur-[1px]"></div>
            </div>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 bg-black/40 rounded-full border border-white/5"></div>
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
        {renderContent()}
      </div>
    </div>
  );
};

export default TrainCar;
