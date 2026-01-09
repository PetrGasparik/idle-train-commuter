
import React, { useState } from 'react';
import { TrainConfig, Resources, Language, CarType } from '../types';
import { generateTrainSkin } from '../services/gemini';
import { t } from '../locales';

interface ControlPanelProps {
  config: TrainConfig;
  resources: Resources;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onChange: (config: TrainConfig) => void;
  onPulse: () => void;
  onUpgrade: (type: 'wagon' | 'fuel' | 'mining' | 'residential') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  config, resources, language, onLanguageChange, onChange, onPulse, onUpgrade 
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const fuelPercentage = Math.min(100, Math.max(0, resources.energy));
  const isOut = fuelPercentage <= 0;
  
  const getEnergyUI = (lvl: number) => {
    if (lvl <= 20) return { color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/50' };
    if (lvl <= 60) return { color: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-amber-500/50' };
    return { color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' };
  };

  const ui = getEnergyUI(fuelPercentage);
  
  const statusLabel = isOut ? t(language, 'statusHalted') : 
                      resources.energy < 20 ? t(language, 'statusCritical') :
                      config.speed > 15 ? t(language, 'statusHighSpeed') : t(language, 'statusStable');

  return (
    <div className="w-64 bg-slate-950/95 backdrop-blur-3xl rounded-3xl p-5 text-white shadow-2xl border border-white/10 ring-1 ring-white/5 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Train OS</h2>
          <p className={`text-[7px] font-bold uppercase tracking-widest transition-colors duration-500 ${isOut ? 'text-red-500' : ui.color}`}>
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => onLanguageChange(language === 'en' ? 'cs' : 'en')}
             className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold hover:bg-white/10 transition-colors uppercase"
           >
             {language === 'en' ? 'CZ' : 'EN'}
           </button>
           <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isOut ? 'bg-red-500 animate-ping' : `${ui.bg} animate-pulse shadow-[0_0_8px] ${ui.glow}`}`}></div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] uppercase tracking-widest text-blue-300 mb-1">{t(language, 'fuelCell')}</p>
          <div className="flex items-end gap-1">
            <span className={`text-sm font-mono font-bold leading-none transition-colors duration-500 ${ui.color}`}>{Math.floor(fuelPercentage)}</span>
            <span className="text-[8px] opacity-40">%</span>
          </div>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
             <div className={`h-full transition-all duration-500 ${ui.bg}`} style={{ width: `${fuelPercentage}%` }}></div>
          </div>
        </div>
        <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
          <p className="text-[7px] uppercase tracking-widest text-emerald-400 mb-1">{t(language, 'scrapMetal')}</p>
          <div className="flex items-end gap-1">
            <span className="text-sm font-mono font-bold leading-none">{Math.floor(resources.scrap)}</span>
            <span className="text-[8px] opacity-40">{t(language, 'units')}</span>
          </div>
          <button 
            onClick={onPulse}
            className="mt-2 w-full py-0.5 bg-blue-500/20 hover:bg-blue-500/40 rounded text-[6px] uppercase font-bold transition-all"
          >
            {t(language, 'refuel')}
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">{t(language, 'upgrades')}</p>
        
        <button 
          onClick={() => onUpgrade('wagon')}
          disabled={resources.scrap < 10}
          className="w-full flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-30 transition-all group"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'addWagon')}</span>
            <span className="text-[7px] text-white/40">{t(language, 'expansionUnit')}</span>
          </div>
          <div className="px-2 py-1 bg-emerald-500/20 rounded-lg text-[8px] font-mono font-bold text-emerald-400 border border-emerald-500/30">10 SC</div>
        </button>

        <button 
          onClick={() => onUpgrade('mining')}
          disabled={resources.scrap < 15}
          className="w-full flex justify-between items-center p-2 rounded-xl bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 disabled:opacity-30 transition-all group"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] font-bold group-hover:text-yellow-400 transition-colors">{t(language, 'addMiningWagon')}</span>
            <span className="text-[7px] text-white/40">{t(language, 'miningUnit')}</span>
          </div>
          <div className="px-2 py-1 bg-yellow-500/20 rounded-lg text-[8px] font-mono font-bold text-yellow-400 border border-yellow-500/30">15 SC</div>
        </button>

        <button 
          onClick={() => onUpgrade('residential')}
          disabled={resources.scrap < 20}
          className="w-full flex justify-between items-center p-2 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 disabled:opacity-30 transition-all group"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] font-bold group-hover:text-cyan-400 transition-colors">{t(language, 'addResidentialWagon')}</span>
            <span className="text-[7px] text-white/40">{t(language, 'residentialUnit')}</span>
          </div>
          <div className="px-2 py-1 bg-cyan-500/20 rounded-lg text-[8px] font-mono font-bold text-cyan-400 border border-cyan-500/30">20 SC</div>
        </button>

        <button 
          onClick={() => onUpgrade('fuel')}
          disabled={resources.scrap < 25}
          className="w-full flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-30 transition-all group"
        >
          <div className="flex flex-col items-start text-left">
            <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'efficiencyCore')}</span>
            <span className="text-[7px] text-white/40">{t(language, 'permanentBoost')}</span>
          </div>
          <div className="px-2 py-1 bg-emerald-500/20 rounded-lg text-[8px] font-mono font-bold text-emerald-400 border border-emerald-500/30">25 SC</div>
        </button>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/10">
        <div>
          <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 mb-1">
            <span>{t(language, 'coreSpeed')}</span>
            <span className="font-mono">{config.speed}</span>
          </div>
          <input 
            type="range" min="1" max="40" step="1" 
            value={config.speed} 
            onChange={(e) => onChange({...config, speed: Number(e.target.value)})}
            className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1 cursor-pointer"
          />
        </div>

        <div>
          <input 
            type="text" 
            placeholder={t(language, 'neuralPrompt')}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[9px] mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <button 
            onClick={async () => {
              setLoading(true);
              const url = await generateTrainSkin(aiPrompt);
              if (url) onChange({...config, type: 'ai', imageUrl: url});
              setLoading(false);
            }}
            disabled={loading || !aiPrompt}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
          >
            {loading ? t(language, 'processing') : t(language, 'fabricateSkin')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
