import React, { useState } from 'react';
import { TrainConfig, Resources } from '../types';
import { generateTrainSkin } from '../services/gemini';

interface ControlPanelProps {
  config: TrainConfig;
  resources: Resources;
  onChange: (config: TrainConfig) => void;
  onWallpaperChange: (url: string) => void;
  onPulse: () => void; // Nové: Pro manuální přidání energie
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, resources, onChange, onPulse }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    const imageUrl = await generateTrainSkin(aiPrompt);
    if (imageUrl) {
      onChange({ ...config, type: 'ai', imageUrl });
    }
    setLoading(false);
  };

  return (
    <div className="w-64 bg-slate-950/90 backdrop-blur-3xl rounded-3xl p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 ring-1 ring-white/5">
      {/* HUD - Resource Section */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-black/40 rounded-2xl border border-white/5">
        <div className="text-center">
          <p className="text-[7px] uppercase tracking-widest text-blue-400 mb-1">Energy</p>
          <p className="font-mono text-xs font-bold">{Math.floor(resources.energy)}</p>
        </div>
        <div className="text-center border-x border-white/10">
          <p className="text-[7px] uppercase tracking-widest text-emerald-400 mb-1">Scrap</p>
          <p className="font-mono text-xs font-bold">{Math.floor(resources.scrap)}</p>
        </div>
        <div className="text-center">
          <p className="text-[7px] uppercase tracking-widest text-amber-400 mb-1">Dist</p>
          <p className="font-mono text-xs font-bold">{Math.floor(resources.totalDistance)}</p>
        </div>
      </div>

      {/* Pulse Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPulse(); }}
        className="w-full mb-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95 shadow-lg shadow-blue-900/40"
      >
        ⚡ Manual Pulse
      </button>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
          SYSTEM CORE
        </h2>
        <div className={`w-2 h-2 rounded-full ${config.speed > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="space-y-6">
        {/* Speed Slider */}
        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Core Throttle</span>
            <span className="font-mono text-blue-300">{config.speed}</span>
          </div>
          <input 
            type="range" min="0" max="30" step="1" 
            value={config.speed} 
            onChange={(e) => onChange({...config, speed: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
          />
        </div>

        {/* Toggle Idle Cruise */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
          <span className="text-[9px] uppercase tracking-wider text-white/60">Idle Cruise</span>
          <button 
            onClick={() => onChange({...config, idleCruise: !config.idleCruise})}
            className={`w-8 h-4 rounded-full transition-colors relative ${config.idleCruise ? 'bg-blue-500' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${config.idleCruise ? 'left-5' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Length Slider */}
        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Segments</span>
            <span className="font-mono text-blue-300">{config.carCount}</span>
          </div>
          <input 
            type="range" min="1" max="15" step="1" 
            value={config.carCount} 
            onChange={(e) => onChange({...config, carCount: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
          />
        </div>

        {/* AI Design Section */}
        <div className="pt-5 border-t border-white/10">
          <label className="text-[9px] uppercase tracking-wider text-white/40 block mb-3">Neural Fabricator</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Design theme..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
          <button 
            onClick={handleAiGenerate}
            disabled={loading || !aiPrompt}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-white/5 disabled:text-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            {loading ? 'Fabricating...' : 'Apply Skin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;