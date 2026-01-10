
import React, { useState, memo, useRef, useEffect } from 'react';
import { TrainConfig, Resources, Language, CarType, HardwareStats, LogEntry } from '../types';
import { generateTrainSkin } from '../services/gemini';
import { t } from '../locales';

interface ControlPanelProps {
  config: TrainConfig;
  resources: Resources;
  hwStats: HardwareStats & { isReal?: boolean };
  language: Language;
  logs: LogEntry[];
  efficiencyLevel: number;
  onLanguageChange: (lang: Language) => void;
  onChange: (config: TrainConfig) => void;
  onPulse: () => void;
  onUpgrade: (type: 'wagon' | 'fuel' | 'mining' | 'residential' | 'cpu') => void;
  isGodMode?: boolean;
  onGodAddScrap?: () => void;
  isDerailed?: boolean;
  onReboot?: () => void;
  isDroneBusy?: boolean;
}

type Tab = 'vitals' | 'shop' | 'logs' | 'ai' | 'help';

const MAX_WAGONS = 30;

const ControlPanel: React.FC<ControlPanelProps> = memo(({ 
  config, resources, hwStats, language, logs, efficiencyLevel, onLanguageChange, onChange, onPulse, onUpgrade, isGodMode, onGodAddScrap, isDerailed, onReboot, isDroneBusy
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 288, scale: 1 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'logs' && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = { x: e.clientX, y: e.clientY, width: config.panelWidth, scale: config.uiScale };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStartPos.current.x;
      const deltaY = e.clientY - resizeStartPos.current.y;
      const newWidth = Math.max(250, Math.min(650, resizeStartPos.current.width + deltaX));
      const newScale = Math.max(0.7, Math.min(2.0, resizeStartPos.current.scale + (deltaY / 300)));
      onChange({ ...config, panelWidth: newWidth, uiScale: newScale });
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, config, onChange]);

  const fuelPercentage = Math.min(100, Math.max(0, resources.energy));
  const isOut = fuelPercentage <= 0;
  const glitchThreshold = 92;
  const isOverheating = hwStats.cpu > glitchThreshold;

  const getEnergyUI = (lvl: number) => {
    if (lvl <= 15) return { color: 'text-red-500', bg: 'bg-red-500', glow: 'shadow-red-500/50' };
    if (lvl <= 60) return { color: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-amber-500/50' };
    return { color: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/50' };
  };

  const ui = getEnergyUI(fuelPercentage);
  
  let statusLabel = isOut ? t(language, 'statusHalted') : t(language, 'statusStable');
  if (isDerailed) {
    statusLabel = isDroneBusy ? t(language, 'statusRebooting') : t(language, 'statusDerailed');
  } else if (isOverheating) {
    statusLabel = t(language, 'statusOverheating');
  } else if (resources.energy < 15) {
    statusLabel = t(language, 'statusCritical');
  } else if (config.speed > 30) {
    statusLabel = t(language, 'statusHighSpeed');
  }

  const getTempColor = (temp: number) => {
    if (temp < 60) return 'bg-blue-400';
    if (temp < 85) return 'bg-orange-400';
    return 'bg-red-500 animate-pulse';
  };

  const isWagonLimitReached = config.cars.length >= MAX_WAGONS;

  return (
    <div ref={panelRef} style={{ width: `${config.panelWidth}px` }} className={`bg-slate-950/95 backdrop-blur-3xl rounded-3xl p-5 text-white shadow-2xl border ${isDerailed ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-white/10 ring-1 ring-white/5'} overflow-hidden flex flex-col gap-4 relative transition-all duration-75`}>
      <div onMouseDown={handleResizeStart} className={`absolute bottom-0 right-0 w-10 h-10 cursor-nwse-resize flex items-end justify-end p-2 group z-[100] ${isResizing ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}>
        <div className="flex flex-col gap-1 items-end pointer-events-none">
          <div className="w-5 h-px bg-white/60 rotate-[-45deg] origin-right"></div>
          <div className="w-3 h-px bg-white/60 rotate-[-45deg] origin-right translate-x-[-2px]"></div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Train OS v4.2</h2>
            {isGodMode && <span className="text-[7px] font-black text-red-500 animate-pulse uppercase tracking-tighter">[DEV_ACTIVE]</span>}
          </div>
          <p className={`text-[7px] font-bold uppercase tracking-widest transition-colors duration-500 ${(isOut || isDerailed || isOverheating) ? 'text-red-500 animate-pulse' : ui.color}`}>
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => onLanguageChange(language === 'en' ? 'cs' : 'en')} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold hover:bg-white/10 transition-colors uppercase">{language === 'en' ? 'CZ' : 'EN'}</button>
           <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isOut || isDerailed ? 'bg-red-500 animate-ping' : `${ui.bg} animate-pulse shadow-[0_0_8px] ${ui.glow}`}`}></div>
        </div>
      </div>

      <div className="flex bg-black/40 rounded-xl p-1 gap-0.5">
        {(['vitals', 'shop', 'logs', 'ai', 'help'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-wider transition-all truncate px-1 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
            {tab === 'vitals' ? t(language, 'tabCore') : tab === 'shop' ? t(language, 'tabShop') : tab === 'logs' ? t(language, 'tabLogs') : tab === 'ai' ? t(language, 'tabNeural') : t(language, 'tabHelp')}
          </button>
        ))}
      </div>

      <div className="min-h-[260px] max-h-[420px] flex flex-col overflow-hidden">
        {activeTab === 'vitals' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-1 custom-scrollbar pb-2">
            {isDerailed ? (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl space-y-3 flex flex-col items-center justify-center text-center">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isDroneBusy ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                    <span className={`text-xl ${isDroneBusy ? 'text-blue-400 animate-bounce' : 'text-red-500'}`}>{isDroneBusy ? '🛸' : '⚠'}</span>
                 </div>
                 <h3 className="text-[10px] font-black uppercase text-red-400">{t(language, 'logMeltdown')}</h3>
                 <p className="text-[8px] text-red-400/60 leading-tight uppercase tracking-widest">{isDroneBusy ? t(language, 'statusRebooting') : t(language, 'statusDerailed')}</p>
                 <button 
                   onClick={onReboot} 
                   disabled={isDroneBusy}
                   className={`w-full mt-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 disabled:opacity-50 ${isDroneBusy ? 'bg-blue-600/40' : 'bg-red-600 hover:bg-red-500'}`}
                 >
                   {isDroneBusy ? t(language, 'statusRebooting') : t(language, 'rebootDispatch')}
                 </button>
              </div>
            ) : (
              <>
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
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 relative overflow-hidden">
                    <p className="text-[7px] uppercase tracking-widest text-emerald-400 mb-1">{t(language, 'scrapMetal')}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-sm font-mono font-bold leading-none">{Math.floor(resources.scrap)}</span>
                      <span className="text-[8px] opacity-40">{t(language, 'units')}</span>
                    </div>
                    <button onClick={onPulse} className="mt-2 w-full py-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded text-[7px] uppercase font-black transition-all">
                      {t(language, 'refuel')}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-black/20 rounded-2xl border border-white/5 space-y-3">
                  <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">{t(language, 'hardwareStats')}</span>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-bold text-white/50">
                       <span>CPU LOAD</span>
                       <span className={`font-mono ${isOverheating ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.floor(hwStats.cpu)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${isOverheating ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`} style={{ width: `${hwStats.cpu}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[8px] font-bold text-white/50">
                       <span>{t(language, 'coreTemp')}</span>
                       <span className="font-mono text-white">{Math.floor(hwStats.temp)}°C</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${getTempColor(hwStats.temp)} shadow-[0_0_5px]`} style={{ width: `${Math.min(100, hwStats.temp)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-4">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t(language, 'navGeometry')}</p>
                  <div>
                    <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 mb-1">
                      <span>{t(language, 'coreSpeed')}</span>
                      <span className="font-mono text-blue-400 font-bold uppercase">{config.speed} {t(language, 'unitKmH')}</span>
                    </div>
                    <input type="range" min="1" max="60" step="1" value={config.speed} onChange={(e) => onChange({...config, speed: Number(e.target.value)})} className="w-full accent-blue-500 bg-white/10 rounded-lg appearance-none h-1 cursor-pointer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 mb-1">
                        <span>{t(language, 'trackMargin')}</span>
                        <span className="font-mono text-white font-bold">{config.trackMargin}</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" value={config.trackMargin} onChange={(e) => onChange({...config, trackMargin: Number(e.target.value)})} className="w-full accent-white bg-white/10 rounded-lg appearance-none h-1 cursor-pointer" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/40 mb-1">
                        <span>{t(language, 'cornerRadius')}</span>
                        <span className="font-mono text-white font-bold">{config.cornerRadius}</span>
                      </div>
                      <input type="range" min="0" max="150" step="2" value={config.cornerRadius} onChange={(e) => onChange({...config, cornerRadius: Number(e.target.value)})} className="w-full accent-white bg-white/10 rounded-lg appearance-none h-1 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-1 custom-scrollbar">
             <div className="flex justify-between items-center mb-2">
               <p className="text-[8px] uppercase tracking-widest text-white/30">{t(language, 'upgrades')}</p>
               <div className="flex gap-2">
                 <span className="text-[7px] text-blue-400 font-bold uppercase tracking-tighter">{t(language, 'wagonCapacity')}: {config.cars.length}/{MAX_WAGONS}</span>
                 <span className="text-[7px] text-blue-400 font-bold uppercase tracking-tighter">{t(language, 'lvlEfficiency')}: {efficiencyLevel}</span>
               </div>
             </div>
             
             <button onClick={() => onUpgrade('wagon')} disabled={resources.scrap < 10 || isWagonLimitReached} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'addWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'expansionUnit')}</span>
               </div>
               <div className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold border ${isWagonLimitReached ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>{isWagonLimitReached ? t(language, 'maxReached') : '10 SC'}</div>
             </button>

             <button onClick={() => onUpgrade('mining')} disabled={resources.scrap < 15 || isWagonLimitReached} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-yellow-400 transition-colors">{t(language, 'addMiningWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'miningUnit')}</span>
               </div>
               <div className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold border ${isWagonLimitReached ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>{isWagonLimitReached ? t(language, 'maxReached') : '15 SC'}</div>
             </button>

             <button onClick={() => onUpgrade('residential')} disabled={resources.scrap < 20 || isWagonLimitReached} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-cyan-400 transition-colors">{t(language, 'addResidentialWagon')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'residentialUnit')}</span>
               </div>
               <div className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold border ${isWagonLimitReached ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>{isWagonLimitReached ? t(language, 'maxReached') : '20 SC'}</div>
             </button>

             <div className="h-px bg-white/5 my-2"></div>

             <button onClick={() => onUpgrade('fuel')} disabled={resources.scrap < 25} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-blue-400 transition-colors">{t(language, 'efficiencyCore')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'permanentBoost')}</span>
               </div>
               <div className="px-2 py-1 bg-blue-500/20 rounded-lg text-[8px] font-mono font-bold text-blue-400 border border-blue-500/30">25 SC</div>
             </button>

             <button onClick={() => onUpgrade('cpu')} disabled={resources.scrap < 30} className="w-full flex justify-between items-center p-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 disabled:opacity-30 transition-all group">
               <div className="flex flex-col items-start text-left">
                 <span className="text-[9px] font-bold group-hover:text-red-400 transition-colors">{t(language, 'cpuUpgrade')}</span>
                 <span className="text-[7px] text-white/40">{t(language, 'cpuUpgradeDesc')}</span>
               </div>
               <div className="px-2 py-1 bg-red-500/20 rounded-lg text-[8px] font-mono font-bold text-red-400 border border-red-500/30">30 SC</div>
             </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col bg-black/40 rounded-2xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <span className="text-[7px] font-black uppercase tracking-widest text-white/40">{t(language, 'eventStream')}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono space-y-2 custom-scrollbar text-[8px]">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 border-l border-white/10 pl-2 py-0.5">
                  <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                  <span className={`${log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'input' ? 'text-sky-400' : 'text-white/60'}`}>
                    <span className="mr-2 opacity-50">{log.type === 'input' ? '>' : '#'}</span>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[8px] uppercase tracking-widest text-white/30 mb-2">{t(language, 'neuralFabricator')}</p>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
              <input type="text" placeholder={t(language, 'neuralPrompt')} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[9px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-white placeholder:text-white/20" />
              <button onClick={async () => { setLoading(true); const url = await generateTrainSkin(aiPrompt); if (url) onChange({...config, type: 'ai', imageUrl: url}); setLoading(false); }} disabled={loading || !aiPrompt} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10">
                {loading ? t(language, 'processing') : t(language, 'fabricateSkin')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-2">
            <section><h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{t(language, 'helpEconomyTitle')}</h3><p className="text-[8px] text-white/60 leading-relaxed">{t(language, 'helpEconomyDesc')}</p></section>
            <section><h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">{t(language, 'helpEfficiencyTitle')}</h3><p className="text-[8px] text-white/60 leading-relaxed">{t(language, 'helpEfficiencyDesc')}</p></section>
            <section><h3 className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">{t(language, 'helpCpuTitle')}</h3><p className="text-[8px] text-white/60 leading-relaxed">{t(language, 'helpCpuDesc')}</p></section>
            <section><h3 className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t(language, 'helpNavTitle')}</h3><p className="text-[8px] text-white/60 leading-relaxed">{t(language, 'helpNavDesc')}</p></section>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 flex justify-between items-center opacity-30 group-hover:opacity-100 transition-opacity">
        <span className="text-[6px] font-bold tracking-[0.3em]">PERIMETER_DRIVE</span>
        <span className="text-[6px] font-mono">X-{Math.floor(resources.totalDistance)}LY</span>
      </div>

      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }`}</style>
    </div>
  );
});

export default ControlPanel;
