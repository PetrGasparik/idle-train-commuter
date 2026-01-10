
import React from 'react';

interface GodModeOverlayProps {
  isVisible: boolean;
  onToggle: () => void;
  onAddScrap: () => void;
  setIgnoreMouse: (ignore: boolean) => void;
}

const GodModeOverlay: React.FC<GodModeOverlayProps> = ({ isVisible, onToggle, onAddScrap, setIgnoreMouse }) => {
  if (!isVisible) return (
    <div 
      className="absolute bottom-16 right-4 z-[999] pointer-events-auto"
      onMouseEnter={() => setIgnoreMouse(false)}
      onMouseLeave={() => setIgnoreMouse(true)}
    >
      <button 
        onClick={onToggle}
        className="w-8 h-8 bg-red-950/80 border border-red-500/50 rounded-full flex items-center justify-center text-[10px] text-red-500 font-black shadow-lg hover:scale-110 transition-transform active:scale-90"
        title="Open God Mode"
      >
        Ω
      </button>
    </div>
  );

  return (
    <div 
      className="absolute bottom-16 right-4 w-56 bg-red-950/90 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 text-white shadow-2xl z-[999] pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300"
      onMouseEnter={() => setIgnoreMouse(false)}
      onMouseLeave={() => setIgnoreMouse(true)}
    >
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-red-500/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">God Mode</span>
        </div>
        <button onClick={onToggle} className="text-red-500/50 hover:text-red-500 text-[10px]">✕</button>
      </div>

      <div className="space-y-3">
        <div className="bg-black/40 p-3 rounded-xl border border-red-500/10">
          <p className="text-[7px] uppercase tracking-tighter text-red-300/60 mb-2">Resource Manipulation</p>
          <button 
            onClick={onAddScrap}
            className="w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95"
          >
            +999 Scraps
          </button>
        </div>

        <div className="bg-black/40 p-3 rounded-xl border border-red-500/10">
          <p className="text-[7px] uppercase tracking-tighter text-red-300/60 mb-2">Debug Info</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-[8px] opacity-40 uppercase">State:</div>
            <div className="text-[8px] font-mono text-red-400 text-right">UNLOCKED</div>
            <div className="text-[8px] opacity-40 uppercase">Sim:</div>
            <div className="text-[8px] font-mono text-red-400 text-right">DEV_BUILD</div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[6px] text-center text-red-500/40 uppercase font-bold tracking-[0.2em]">
        Authorized Personnel Only
      </p>
    </div>
  );
};

export default GodModeOverlay;
