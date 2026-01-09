
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

  const handleReset = () => {
    onChange({ ...config, type: 'modern', imageUrl: undefined });
    setAiPrompt('');
  };

  return (
    <div className="w-60 bg-black/60 backdrop-blur-2xl rounded-2xl p-5 text-white shadow-2xl border border-white/10 ring-1 ring-white/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">
          Train Engine
        </h2>
        <div className={`w-2 h-2 rounded-full ${config.speed > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="space-y-6">
        {/* Speed Slider */}
        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Velocity</span>
            <span className="font-mono text-blue-300">{config.speed} km/h</span>
          </div>
          <input 
            type="range" min="0" max="30" step="1" 
            value={config.speed} 
            onChange={(e) => onChange({...config, speed: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer hover:bg-white/20 transition-all"
          />
        </div>

        {/* Length Slider */}
        <div>
          <div className="flex justify-between text-[9px] uppercase tracking-wider text-white/40 mb-2">
            <span>Coupled Cars</span>
            <span className="font-mono text-blue-300">{config.carCount}</span>
          </div>
          <input 
            type="range" min="1" max="15" step="1" 
            value={config.carCount} 
            onChange={(e) => onChange({...config, carCount: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer hover:bg-white/20 transition-all"
          />
        </div>

        {/* Color Palette */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-white/40 mb-3 block text-center">Standard Livery</label>
          <div className="flex justify-between gap-1">
            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(c => (
              <button 
                key={c}
                onClick={() => onChange({...config, type: 'modern', color: c, imageUrl: undefined})}
                className={`flex-1 h-7 rounded-md border-2 transition-all duration-300 ${config.color === c && config.type !== 'ai' ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-40 hover:opacity-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* AI Design Section */}
        <div className="pt-5 border-t border-white/10">
          <div className="flex justify-between items-center mb-3">
            <label className="text-[9px] uppercase tracking-wider text-white/40">AI Generative Skin</label>
            {config.type === 'ai' && (
              <button onClick={handleReset} className="text-[8px] text-blue-400 hover:text-white uppercase font-bold transition-colors">Reset</button>
            )}
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. Victorian, Lego, Cyberpunk..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
            />
            {loading && (
              <div className="absolute right-3 top-2.5">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <button 
            onClick={handleAiGenerate}
            disabled={loading || !aiPrompt}
            className="w-full py-2.5 bg-blue-600 text-white disabled:bg-white/5 disabled:text-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            {loading ? 'Synthesizing...' : 'Apply AI Skin'}
          </button>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 text-center">
        <p className="text-[7px] text-white/20 uppercase tracking-[0.3em]">Powered by Gemini AI</p>
      </div>
    </div>
  );
};

export default ControlPanel;
