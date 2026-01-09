import React, { useState } from 'react';
import { TrainConfig, Resources } from '../types';
import { generateTrainSkin } from '../services/gemini';

interface ControlPanelProps {
  config: TrainConfig;
  resources: Resources;
  onChange: (config: TrainConfig) => void;
  onWallpaperChange: (url: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, resources, onChange }) => {
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
    <div className="w-64 bg-slate-950/80 backdrop-blur-2xl rounded-2xl p-5 text-white shadow-2xl border border-white/10 ring-1 ring-white/5">
      {/* HUD - Resource Section (Arc I) */}
      <div className="grid grid-cols-3 gap-2 mb-6 p-2 bg-black/40 rounded-xl border border-white/5">
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

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
          Command Deck
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
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
          >
            {loading ? 'Fabricating...' : 'Apply Skin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;