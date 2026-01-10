
import React, { memo } from 'react';
import { TrainConfig, CarType } from '../types';

interface TrainCarProps {
  config: TrainConfig;
  isLocomotive?: boolean;
  carType?: CarType;
  energy?: number;
}

const TrainCar: React.FC<TrainCarProps> = memo(({ config, isLocomotive, carType = 'standard', energy = 100 }) => {
  const width = isLocomotive ? 48 : 40;
  const height = 18;

  const getEnergyColor = (lvl: number) => {
    if (lvl <= 15) return '#ef4444'; // Red
    if (lvl <= 60) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const energyColor = getEnergyColor(energy);
  const isLowEnergy = energy <= 15;

  const renderContent = () => {
    if (config.type === 'ai' && config.imageUrl) {
      return (
        <div className="w-full h-full relative drop-shadow-lg z-10">
          <img 
            src={config.imageUrl} 
            alt="train-car" 
            className="w-full h-full object-contain"
            style={{ transform: 'rotate(90deg)' }}
          />
        </div>
      );
    }

    let baseColor = config.color;
    if (carType === 'mining') baseColor = '#eab308'; // Industrial Yellow
    if (carType === 'residential') baseColor = '#06b6d4'; // Cyan

    return (
      <div 
        className="relative w-full h-full rounded-sm shadow-md overflow-hidden z-10 transition-colors duration-500"
        style={{ 
          backgroundColor: baseColor, 
          border: '1px solid rgba(0,0,0,0.4)',
          boxShadow: isLocomotive ? `0 0 12px ${energyColor}44` : '0 2px 6px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="absolute inset-x-2 top-1 bottom-1 bg-black/10 rounded-sm"></div>
        
        {isLocomotive ? (
          <>
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900/90 rounded-sm border border-white/20 flex items-center justify-center">
               <div 
                 className={`w-1.5 h-1.5 blur-[1px] transition-colors duration-500 ${isLowEnergy ? 'animate-pulse' : ''}`}
                 style={{ backgroundColor: energyColor, boxShadow: `0 0 8px ${energyColor}` }}
               ></div>
            </div>
            <div className="absolute right-4 top-0 bottom-0 w-0.5 opacity-60" style={{ backgroundColor: energyColor }}></div>
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-3.5 bg-black/30 rounded-sm border border-white/10 shadow-inner"></div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-black/60 shadow-lg z-10"></div>
          </>
        ) : (
          <div className="flex justify-around items-center h-full px-1.5 gap-0.5">
            {carType === 'mining' ? (
              <div className="flex gap-1 items-center justify-center w-full">
                <div className="w-4 h-4 rounded-full border-2 border-black/20 animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-full h-0.5 bg-black/40 absolute top-1/2 -translate-y-1/2"></div>
                </div>
                <div className="w-2 h-full bg-black/20"></div>
                <div className="w-4 h-4 rounded-full border-2 border-black/20 animate-spin" style={{ animationDuration: '3s' }}>
                  <div className="w-full h-0.5 bg-black/40 absolute top-1/2 -translate-y-1/2"></div>
                </div>
              </div>
            ) : carType === 'residential' ? (
              <div className="flex gap-1 items-center justify-center w-full h-full p-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-full bg-blue-200/40 rounded-sm border border-white/10"></div>
                ))}
              </div>
            ) : (
              [1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-2 bg-black/30 rounded-sm border border-white/5"></div>
              ))
            )}
          </div>
        )}
        
        <div className="absolute top-0 left-0 right-0 h-[15%] bg-white/10"></div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: width,
        height: height,
        overflow: 'visible'
      }}
    >
      <div className="w-full h-full relative flex items-center justify-center" style={{ overflow: 'visible' }}>
        {renderContent()}
      </div>
    </div>
  );
});

export default TrainCar;
