
import React from 'react';
import { EnergyHub } from '../types';

interface EnergyHubProps {
  hub: EnergyHub;
}

const EnergyHubComponent: React.FC<EnergyHubProps> = ({ hub }) => {
  const isMicro = hub.type === 'micro';
  const isTerminal = hub.type === 'terminal';
  const waiting = hub.waitingPassengers || 0;
  
  return (
    <div className="relative w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none drop-shadow-xl z-20">
      {/* Base Light */}
      <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${isMicro ? 'bg-blue-400' : isTerminal ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
      
      {isMicro ? (
        <div className="w-full h-full flex flex-col items-center justify-end">
          <div className="w-0.5 h-6 bg-slate-700 border-x border-white/5 relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_#60a5fa]"></div>
          </div>
          <div className="w-4 h-1 bg-slate-800 rounded-full border border-white/10"></div>
        </div>
      ) : isTerminal ? (
        // Terminal Station Design
        <div className="w-full h-full flex flex-col items-center justify-center">
           <div className="w-12 h-1.5 bg-slate-800 border border-white/20 rounded-t-sm shadow-lg mb-0.5"></div>
           <div className="w-14 h-4 bg-slate-900 border border-white/10 rounded-sm relative overflow-hidden">
              <div className="absolute inset-x-1 top-0.5 bottom-0.5 flex gap-0.5">
                 {/* Zobrazení čekajících lidí jako oranžových segmentů (vizuální indikátor bez textu) */}
                 {[1, 2, 3, 4, 5, 6].map(i => {
                   const isActive = waiting > (i * 8);
                   return (
                     <div 
                       key={i} 
                       className={`flex-1 rounded-[1px] transition-colors duration-500 ${isActive ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'bg-white/5'}`}
                     ></div>
                   );
                 })}
              </div>
           </div>
           <div className="w-16 h-1 bg-slate-700 rounded-full mt-0.5"></div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
           <div className="absolute inset-1 border-[1.5px] border-purple-500/30 rounded-full animate-[spin_4s_linear_infinite]"></div>
           <div className="w-4 h-4 bg-purple-950 border border-purple-400/40 rounded-sm flex items-center justify-center overflow-hidden">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_12px_#a855f7]"></div>
           </div>
        </div>
      )}
    </div>
  );
};

export default EnergyHubComponent;
