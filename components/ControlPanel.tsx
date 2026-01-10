
import React, { useState, memo } from 'react';
import { TrainConfig, Resources, Language, CarType, HardwareStats } from '../types';
import { generateTrainSkin } from '../services/gemini';
import { t } from '../locales';

interface ControlPanelProps {
  config: TrainConfig;
  resources: Resources;
  hwStats: HardwareStats & { isReal?: boolean };
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onChange: (config: TrainConfig) => void;
  onPulse: () => void;
  onUpgrade: (type: 'wagon' | 'fuel' | 'mining' | 'residential') => void;
}

type Tab = 'vitals' | 'shop' | 'ai';

const ControlPanel: React.FC<ControlPanelProps> = memo(({ 
  config, resources, hwStats, language, onLanguageChange, onChange, onPulse, onUpgrade 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
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
                      config.speed > 30 ? t(language, 'statusHighSpeed') : t(language, 'statusStable');

  return (
    <div className="w-72 bg-slate-950/95 backdrop-blur-3xl rounded-3xl p-5 text-white shadow-2xl border border-white/10 ring-1 ring-white/5 overflow-hidden flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Train OS v4.2</h2>
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

      {/* Tabs Navigation */}
      <div className="flex bg-black/40 rounded-xl p-1 gap-1">
        {(['vitals', 'shop', 'ai'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {tab === 'vitals' ? 'Vitals' : tab === 'shop' ? 'Shop' : 'Neural'}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[200px] flex flex-col">
        {activeTab === 'vitals' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Primary Resources */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[7px] uppercase tracking-widest text-blue-300 mb-1">{t(language, 'fuelCell')}</p>
                <div className="flex items-end gap-1">
                  <span className={`text-sm font-mono font-bold leading-none transition-colors duration-500 ${ui.color}`}>{Math.floor(fuelPercentage)}</span>
                  <span className="text-[8px] opacity-40">%</span>
                </div>
                <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className={`h-full transition-all duration-500 ${ui.bg}`} style={{ width: `${fuelPercentage}%` }}></div>
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[7px] uppercase tracking-widest text-emerald-400 mb-1">{t(language, 'scrapMetal')}</p>
                <div className="flex items-end gap-1">
                  <span className="text-sm font-mono font-bold leading-none">{Math.floor(resources.scrap)}</span>
                  <span className="text-[8px] opacity-40">{t(language, 'units')}</span>
                </div>
                <button onClick={onPulse} className="mt-2 w-full py-0.5 bg-blue-500/20 hover:bg-blue-500/40 rounded text-[6px] uppercase font-bold transition-all">
                  {t(language, 'refuel')}
                </button>
              </div>
            </div>

            {/* Hardware Vitals */}
            <div className="p-3 bg-black/20 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Hardware Link</span>
                <span className={`text-[6px] px-1.5 py-0.5 rounded-full font-bold ${hwStats.isReal ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {hwStats.isReal ? 'OS REALTIME' : 'SIMULATION'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <span className="text-[8px] font-bold text-white/50">CPU Load</span>
                   <span className={`text-[9px] font-mono ${hwStats.cpu > 80 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.floor(hwStats.cpu)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${hwStats.cpu > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${hwStats.cpu}%` }}></div>
                </div>

                <div className="flex justify-between items-center">
                   <span className="text-[8px] font-bold text-white/50">Core Temp</span>
                   <span className={`text-[9px] font-mono ${hwStats.temp > 80 ? 'text-orange-500' : 'text-white'}`}>{Math.floor(hwStats.temp)}°C</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${hwStats.temp > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${hwStats.temp}%` }}></div>
                </div>
              </div>
            </div>

            {/* Core Speed (Always in Vitals) */}
            <div>
              <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 mb-1">
                <span>{t(language, 'coreSpeed')}</span>
                <span className="font-mono text-blue-400 font-bold">{config.speed} km/h</span>
              </div>
              <input 
                type="range" min="1" max="60" step="1" 
                value={config.speed} 
                onChange={(e) => onChange({...config, speed: Number(e.target.value)})}
                className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
              <p className="text-[6px] text-white/20 mt-1 uppercase tracking-tight italic">Warning: High speed consumes proportional energy.</p>
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">{t(language, 'upgrades')}</p>
             
             <button onClick={() => onUpgrade('wagon')} disabled={resources.scrap < 10}
               className="w-full flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'addWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'expansionUnit')}</span>
               </div>
               <div className="px-2 py-1 bg-emerald-500/20 rounded-lg text-[8px] font-mono font-bold text-emerald-400 border border-emerald-500/30">10 SC</div>
             </button>

             <button onClick={() => onUpgrade('mining')} disabled={resources.scrap < 15}
               className="w-full flex justify-between items-center p-2.5 rounded-xl bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-yellow-400 transition-colors">{t(language, 'addMiningWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'miningUnit')}</span>
               </div>
               <div className="px-2 py-1 bg-yellow-500/20 rounded-lg text-[8px] font-mono font-bold text-yellow-400 border border-yellow-500/30">15 SC</div>
             </button>

             <button onClick={() => onUpgrade('residential')} disabled={resources.scrap < 20}
               className="w-full flex justify-between items-center p-2.5 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-cyan-400 transition-colors">{t(language, 'addResidentialWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'residentialUnit')}</span>
               </div>
               <div className="px-2 py-1 bg-cyan-500/20 rounded-lg text-[8px] font-mono font-bold text-cyan-400 border border-cyan-500/30">20 SC</div>
             </button>

             <button onClick={() => onUpgrade('fuel')} disabled={resources.scrap < 25}
               className="w-full flex justify-between items-center p-2.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'efficiencyCore')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'permanentBoost')}</span>
               </div>
               <div className="px-2 py-1 bg-blue-500/20 rounded-lg text-[8px] font-mono font-bold text-blue-400 border border-blue-500/30">25 SC</div>
             </button>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">Neural Fabricator</p>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
              <input 
                type="text" 
                placeholder={t(language, 'neuralPrompt')}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[9px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button 
                onClick={async () => {
                  setLoading(true);
                  const url = await generateTrainSkin(aiPrompt);
                  if (url) onChange({...config, type: 'ai', imageUrl: url});
                  setLoading(false);
                }}
                disabled={loading || !aiPrompt}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10"
              >
                {loading ? t(language, 'processing') : t(language, 'fabricateSkin')}
              </button>
              {config.type === 'ai' && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden border border-white/10">
                    <img src={config.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[7px] text-blue-400 font-bold uppercase">AI Texture Active</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-2 border-t border-white/5 flex justify-between items-center opacity-30 group-hover:opacity-100 transition-opacity">
        <span className="text-[6px] font-bold tracking-[0.3em]">PERIMETER_DRIVE</span>
        <span className="text-[6px] font-mono">X-{Math.floor(resources.totalDistance)}LY</span>
      </div>
    </div>
  );
});

export default ControlPanel;
