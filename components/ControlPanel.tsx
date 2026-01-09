
import React, { useState } from 'react';
import { TrainConfig } from '../types';
import { generateTrainSkin } from '../services/gemini';

interface ControlPanelProps {
  config: TrainConfig;
  onChange: (config: TrainConfig) => void;
  onWallpaperChange: (url: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange }) => {
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
    <div className="w-60 bg-black/50 backdrop-blur-xl rounded-2xl p-5 text-white shadow-2xl border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
          Settings
        </h2>
        <span className="text-lg opacity-50">🚂</span>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Speed</span>
            <span>{config.speed}</span>
          </div>
          <input 
            type="range" min="0" max="30" step="1" 
            value={config.speed} 
            onChange={(e) => onChange({...config, speed: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Length</span>
            <span>{config.carCount}</span>
          </div>
          <input 
            type="range" min="1" max="15" step="1" 
            value={config.carCount} 
            onChange={(e) => onChange({...config, carCount: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-wider text-white/40 mb-3 block">Color</label>
          <div className="flex justify-between">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(c => (
              <button 
                key={c}
                onClick={() => onChange({...config, type: 'modern', color: c})}
                className={`w-6 h-6 rounded-full border-2 transition-all ${config.color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <label className="text-[9px] uppercase tracking-wider text-white/40 mb-2 block">AI Design</label>
          <input 
            type="text" 
            placeholder="e.g. Chrome, Wood..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] mb-2 focus:outline-none focus:border-blue-500 transition-all"
          />
          <button 
            onClick={handleAiGenerate}
            disabled={loading}
            className="w-full py-2 bg-white text-black disabled:bg-white/20 disabled:text-white/40 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-blue-500 hover:text-white"
          >
            {loading ? 'Generating...' : 'Apply Skin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
