
import React from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface StationProps {
  language: Language;
}

const Station: React.FC<StationProps> = ({ language }) => {
  return (
    <div className="relative w-16 h-16 pointer-events-none drop-shadow-2xl">
      {/* Podkladová záře - ambientní světlo stanice */}
      <div className="absolute inset-0 bg-blue-600/5 blur-3xl rounded-full"></div>
      
      {/* Horní technologická nástavba - Radarová lišta (místo původní antény) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-800 border border-white/10 rounded-full z-20 flex items-center px-1 overflow-hidden shadow-lg">
        <div className="h-full w-1/3 bg-blue-500/40 blur-[2px] animate-[pulse_1.5s_infinite]"></div>
        <div className="ml-auto w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_#ef4444]"></div>
      </div>

      {/* Hlavní tělo stanice - Armor Plate Design */}
      <div className="absolute inset-x-1 inset-y-2 bg-slate-950 border-[1.5px] border-white/20 rounded-lg shadow-2xl overflow-hidden flex flex-col z-10">
        
        {/* Senzorová sekce (Top Deck) */}
        <div className="h-2/5 bg-slate-900 border-b border-white/10 p-1 grid grid-cols-3 gap-0.5">
           <div className="bg-blue-500/20 border border-blue-400/30 rounded-sm flex items-center justify-center">
              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
           </div>
           <div className="bg-slate-800 border border-white/5 rounded-sm flex flex-col gap-0.5 p-0.5">
              <div className="w-full h-px bg-white/20"></div>
              <div className="w-full h-px bg-white/10"></div>
           </div>
           <div className="bg-slate-800 border border-white/5 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-500/40 rounded-full"></div>
           </div>
        </div>
        
        {/* Jádro stanice (Service Bay) */}
        <div className="flex-1 bg-black/60 flex items-center justify-center relative p-1">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent)]"></div>
           
           {/* Grafický prvek "Server Rack" / "Power Core" */}
           <div className="w-full h-full border border-white/5 rounded-md bg-slate-900/50 flex flex-col justify-around py-0.5 px-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                   <div className="w-4 h-0.5 bg-white/10 rounded-full"></div>
                   <div className={`w-0.5 h-0.5 rounded-full ${i === 2 ? 'bg-blue-400 animate-pulse' : 'bg-white/20'}`}></div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Boční chladiče / Vstupy */}
      <div className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-6 bg-slate-800 border border-white/10 rounded-l-sm z-0"></div>
      <div className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1.5 h-6 bg-slate-800 border border-white/10 rounded-r-sm z-0"></div>
      
      {/* Štítek s názvem Command Postu */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-0.5 bg-slate-950 border border-blue-500/30 rounded-full text-[6px] font-black tracking-[0.2em] text-blue-400 uppercase shadow-lg shadow-blue-500/20 backdrop-blur-sm">
        {t(language, 'command')}
      </div>
    </div>
  );
};

export default Station;
