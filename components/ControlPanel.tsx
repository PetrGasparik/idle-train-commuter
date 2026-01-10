import React, { useState, memo, useRef, useEffect, useCallback } from 'react';
import { TrainConfig, Resources, Language, CarType, HardwareStats, LogEntry, EnergyHub } from '../types';
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
  onUpgrade: (type: 'wagon' | 'fuel' | 'mining' | 'residential' | 'cpu' | 'micro_hub' | 'fusion_hub') => void;
  onSell: (index: number) => void;
  isGodMode?: boolean;
  onGodAddScrap?: () => void;
  isDerailed?: boolean;
  onReboot?: () => void;
  isDroneBusy?: boolean;
  hubs: EnergyHub[];
  asmrMode: boolean;
  onAsmrToggle: () => void;
}

type Tab = 'vitals' | 'shop' | 'grid' | 'logs' | 'ai' | 'help';

const MAX_WAGONS = 30;

const ControlPanel: React.FC<ControlPanelProps> = memo(({ 
  config, resources, hwStats, language, logs, efficiencyLevel, onLanguageChange, onChange, onPulse, onUpgrade, onSell, isGodMode, onGodAddScrap, isDerailed, onReboot, isDroneBusy, hubs, asmrMode, onAsmrToggle
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('vitals');
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
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

  const getMaxEnergy = useCallback(() => {
    const standardWagons = config.cars.slice(1).filter(c => c === 'standard').length;
    return 100 + (standardWagons * 10);
  }, [config.cars]);

  const maxEnergyLimit = getMaxEnergy();
  const fuelPercentage = Math.min(100, Math.max(0, (resources.energy / maxEnergyLimit) * 100));
  const isOut = resources.energy <= 0;
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
  } else if (resources.energy < (maxEnergyLimit * 0.15)) {
    statusLabel = t(language, 'statusCritical');
  } else if (config.speed > 30) {
    statusLabel = t(language, 'statusHighSpeed');
  }

  const currentWagons = config.cars.length - 1;
  const isWagonLimitReached = currentWagons >= MAX_WAGONS;

  const handleGenerateSkin = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    const skinUrl = await generateTrainSkin(aiPrompt);
    if (skinUrl) {
      onChange({ ...config, imageUrl: skinUrl, type: 'ai' });
    }
    setLoading(false);
  };

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
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Steam Train OS v5.0</h2>
            {isGodMode && <span className="text-[7px] font-black text-red-500 animate-pulse uppercase tracking-tighter">[DEV_ACTIVE]</span>}
          </div>
          <p className={`text-[7px] font-bold uppercase tracking-widest transition-colors duration-500 ${(isOut || isDerailed || isOverheating) ? 'text-red-500 animate-pulse' : ui.color}`}>
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={onAsmrToggle} className={`px-2 py-0.5 rounded-full border border-white/10 text-[8px] font-bold transition-colors uppercase ${asmrMode ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`} title={t(language, 'asmrToggle')}>ASMR (H)</button>
           <button onClick={() => onLanguageChange(language === 'en' ? 'cs' : 'en')} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-bold hover:bg-white/10 transition-colors uppercase">{language === 'en' ? 'CZ' : 'EN'}</button>
           <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isOut || isDerailed ? 'bg-red-500 animate-ping' : `${ui.bg} animate-pulse shadow-[0_0_8px] ${ui.glow}`}`}></div>
        </div>
      </div>

      <div className="flex bg-black/40 rounded-xl p-1 gap-0.5">
        {(['vitals', 'shop', 'grid', 'logs', 'ai', 'help'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-wider transition-all truncate px-1 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}>
            {tab === 'vitals' ? t(language, 'tabCore') : tab === 'shop' ? t(language, 'tabShop') : tab === 'grid' ? t(language, 'tabGrid') : tab === 'logs' ? t(language, 'tabLogs') : tab === 'ai' ? t(language, 'tabNeural') : t(language, 'tabHelp')}
          </button>
        ))}
      </div>

      <div className="min-h-[260px] max-h-[420px] flex flex-col overflow-hidden">
        {activeTab === 'vitals' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t(language, 'fuelCell')}</span>
                <span className={`text-[10px] font-mono ${ui.color}`}>{resources.energy.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${ui.bg}`} style={{ width: `${fuelPercentage}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/40 block mb-1">{t(language, 'scrapMetal')}</span>
                <span className="text-xl font-mono text-amber-400">{Math.floor(resources.scrap)}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/40 block mb-1">{t(language, 'coreTemp')}</span>
                <span className={`text-xl font-mono ${hwStats.temp > 85 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>{hwStats.temp.toFixed(1)}°</span>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t(language, 'coreSpeed')}</span>
                <span className="text-[8px] font-mono text-blue-400">{config.speed} {t(language, 'unitKmH')}</span>
              </div>
              <input 
                type="range" min="0" max="100" step="1" 
                value={config.speed} 
                onChange={(e) => onChange({ ...config, speed: parseInt(e.target.value) })}
                className="w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {isDerailed ? (
              <button onClick={onReboot} disabled={isDroneBusy} className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isDroneBusy ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'}`}>
                {isDroneBusy ? t(language, 'statusRebooting') : t(language, 'reboot')}
              </button>
            ) : (
              <button onClick={onPulse} disabled={isOut} className={`w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${isOut ? 'bg-white/5 text-white/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'}`}>
                {t(language, 'refuel')}
              </button>
            )}
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{t(language, 'scrapMetal')}</span>
                <span className="text-sm font-mono text-amber-400">{Math.floor(resources.scrap)}</span>
              </div>
            </div>

            {[
              { id: 'wagon', label: t(language, 'addWagon'), desc: t(language, 'expansionUnit'), cost: 10, theme: 'slate' },
              { id: 'mining', label: t(language, 'addMiningWagon'), desc: t(language, 'miningUnit'), cost: 15, theme: 'yellow' },
              { id: 'residential', label: t(language, 'addResidentialWagon'), desc: t(language, 'residentialUnit'), cost: 20, theme: 'cyan' },
              { id: 'fuel', label: t(language, 'efficiencyCore'), desc: `${t(language, 'permanentBoost')} (Lv.${efficiencyLevel})`, cost: 25, theme: 'emerald' },
              { id: 'cpu', label: t(language, 'cpuUpgrade'), desc: `${t(language, 'cpuUpgradeDesc')} (Lv.${config.cpuUpgradeLevel})`, cost: 30, theme: 'blue' },
              { id: 'micro_hub', label: t(language, 'addMicroHub'), desc: t(language, 'microHubDesc'), cost: 50, theme: 'blue' },
              { id: 'fusion_hub', label: t(language, 'addFusionHub'), desc: t(language, 'fusionHubDesc'), cost: 150, theme: 'purple' },
            ].map((item) => {
              const canAfford = resources.scrap >= item.cost;
              const isWagon = ['wagon', 'mining', 'residential'].includes(item.id);
              const disabled = !canAfford || (isWagon && isWagonLimitReached);
              
              const themeColors: Record<string, string> = {
                slate: 'border-slate-500/30 hover:bg-slate-500/10',
                yellow: 'border-yellow-500/30 hover:bg-yellow-500/10',
                cyan: 'border-cyan-500/30 hover:bg-cyan-500/10',
                emerald: 'border-emerald-500/30 hover:bg-emerald-500/10',
                blue: 'border-blue-500/30 hover:bg-blue-500/10',
                purple: 'border-purple-500/30 hover:bg-purple-500/10',
              };

              return (
                <button 
                  key={item.id} 
                  onClick={() => onUpgrade(item.id as any)}
                  disabled={disabled}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex justify-between items-center group ${disabled ? 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed' : `bg-white/5 ${themeColors[item.theme]} cursor-pointer active:scale-[0.98]`}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                    <span className="text-[7px] text-white/40 group-hover:text-white/60 transition-colors uppercase">{item.desc}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-mono border ${canAfford ? 'text-amber-400 border-amber-400/30' : 'text-red-400 border-red-400/30'}`}>
                    {item.cost}
                  </div>
                </button>
              );
            })}

            <div className="mt-4 pt-4 border-t border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-2 block">{t(language, 'tabInventory')}</span>
              <div className="grid grid-cols-5 gap-1">
                {config.cars.map((car, i) => (
                  <button key={i} onClick={() => onSell(i)} disabled={i === 0} className={`h-8 rounded-lg border flex items-center justify-center text-[7px] font-black uppercase transition-all ${i === 0 ? 'bg-blue-600/40 border-blue-400/20 text-white/60' : 'bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/30 text-white/40 hover:text-red-400'}`}>
                    {i === 0 ? 'L' : i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-3">{t(language, 'hubCount')}</span>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-mono text-purple-400">{hubs.length}</span>
                <div className="flex-1 flex gap-1 h-2">
                  {hubs.map((h, i) => (
                    <div key={i} className={`flex-1 rounded-full ${h.type === 'command' ? 'bg-blue-400' : h.type === 'fusion' ? 'bg-purple-500' : 'bg-blue-400/40'}`}></div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 block">{t(language, 'helpGridTitle')}</span>
              <p className="text-[8px] text-white/40 leading-relaxed uppercase">{t(language, 'helpGridDesc')}</p>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="flex-1 font-mono text-[9px] bg-black/40 rounded-2xl border border-white/5 p-3 overflow-y-auto custom-scrollbar space-y-1.5 scroll-smooth">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-20 uppercase tracking-[0.2em]">{t(language, 'noActiveData')}</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'warning' ? 'text-amber-400' : ''}
                    ${log.type === 'input' ? 'text-sky-400' : ''}
                    ${log.type === 'info' ? 'text-white/60' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 block">{t(language, 'neuralFabricator')}</span>
              <div className="space-y-2">
                <textarea 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={t(language, 'neuralPrompt')}
                  className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-colors resize-none uppercase"
                />
                <button 
                  onClick={handleGenerateSkin}
                  disabled={loading || !aiPrompt.trim()}
                  className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${loading || !aiPrompt.trim() ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'}`}
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      {t(language, 'processing')}
                    </>
                  ) : t(language, 'fabricateSkin')}
                </button>
              </div>
            </div>
            <p className="text-[7px] text-white/20 uppercase text-center">{t(language, 'sysInit')}</p>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pr-2 custom-scrollbar pb-4">
            {[
              { title: t(language, 'helpEconomyTitle'), desc: t(language, 'helpEconomyDesc') },
              { title: t(language, 'helpGridTitle'), desc: t(language, 'helpGridDesc') },
              { title: t(language, 'helpEfficiencyTitle'), desc: t(language, 'helpEfficiencyDesc') },
              { title: t(language, 'helpNavTitle'), desc: t(language, 'helpNavDesc') },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 block">{item.title}</span>
                <p className="text-[8px] text-white/60 leading-relaxed uppercase">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
});

export default ControlPanel;
