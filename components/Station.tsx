import React from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface StationProps {
  language: Language;
}

const Station: React.FC<StationProps> = ({ language }) => {
  return (
    <div className="relative w-14 h-14 pointer-events-none drop-shadow-xl">
      {/* Dynamic Floor Glow */}
      <div className="absolute inset-0 bg-blue-600/15 blur-xl rounded-full animate-pulse"></div>
      
      {/* Main Structure */}
      <div className="absolute inset-1.5 bg-slate-900 border-[1.5px] border-white/30 rounded-xl shadow-inner overflow-hidden flex flex-col">
        {/* Upper tech section */}
        <div className="h-1/3 bg-slate-800 border-b border-white/10 p-0.5 flex justify-around items-center">
           <div className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_3px_#3b82f6]"></div>
           <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_3px_#10b981]"></div>
           <div className="w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_3px_#f59e0b]"></div>
        </div>
        
        {/* Depot Bay */}
        <div className="flex-1 bg-black/40 flex items-center justify-center">
           <div className="w-6 h-4 border-t border-x border-white/10 rounded-t-md bg-gradient-to-b from-blue-900/20 to-transparent flex flex-col items-center justify-end pb-0.5">
              <div className="w-3 h-0.5 bg-blue-400 shadow-[0_0_3px_#3b82f6] animate-pulse"></div>
           </div>
        </div>
      </div>

      {/* Satellite Dish / Antenna */}
      <div className="absolute -top-1 right-2 w-4 h-4">
        <div className="w-0.5 h-3 bg-slate-700 mx-auto"></div>
        <div className="w-3 h-1.5 bg-slate-600 rounded-t-full border border-white/10"></div>
      </div>
      
      {/* Station Name Plate */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-slate-950 border border-blue-500/50 rounded-full text-[6px] font-black tracking-[0.15em] text-blue-400 uppercase shadow-lg shadow-blue-500/20">
        {t(language, 'command')}
      </div>
    </div>
  );
};

export default Station;