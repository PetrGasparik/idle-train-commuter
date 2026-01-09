import React, { useEffect, useRef } from 'react';
import { LogEntry, Language } from '../types';
import { t } from '../locales';

interface DesktopSimulatorProps {
  logs: LogEntry[];
  language: Language;
}

const DesktopSimulator: React.FC<DesktopSimulatorProps> = ({ logs, language }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-[-1]">
      {/* Windows 11 Wallpaper (Bloom) */}
      <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop")' }}>
        <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[2px]"></div>
      </div>

      {/* Desktop Icons */}
      <div className="absolute top-10 left-10 flex flex-col gap-8">
        {[
          { name: 'This PC', color: 'bg-blue-500' },
          { name: 'Recycle Bin', color: 'bg-slate-400' },
          { name: 'Train Files', color: 'bg-amber-500' },
          { name: 'VS Code', color: 'bg-sky-600' },
        ].map((icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1 w-20 group">
            <div className={`w-12 h-12 rounded-lg ${icon.color} shadow-lg border border-white/20 flex items-center justify-center`}>
               <div className="w-6 h-6 bg-white/20 rounded-sm"></div>
            </div>
            <span className="text-[10px] text-white text-shadow-sm font-semibold">{icon.name}</span>
          </div>
        ))}
      </div>

      {/* Fake Application Window */}
      <div className="absolute top-[15%] left-[20%] w-[50%] h-[50%] bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="h-10 bg-black/40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
            <span className="text-[11px] text-white/60 font-medium">{t(language, 'simConsole')} - train_os.sys</span>
          </div>
          <div className="flex gap-4">
            <div className="w-3 h-0.5 bg-white/40"></div>
            <div className="w-3 h-3 border border-white/40"></div>
            <div className="w-3 h-3 text-white/40 text-[10px] flex items-center justify-center">✕</div>
          </div>
        </div>
        
        {/* Terminal Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 font-mono text-[11px] space-y-1 overflow-y-auto scroll-smooth custom-scrollbar"
          style={{ 
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.2))',
            textShadow: '0 0 5px rgba(52, 211, 153, 0.3)'
          }}
        >
          <div className="opacity-40 mb-4 pb-2 border-b border-white/5 uppercase tracking-widest text-[9px]">
            {t(language, 'sysInit')}
          </div>
          
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
              <span className="text-white/20 shrink-0">[{log.timestamp}]</span>
              <span className={`
                ${log.type === 'success' ? 'text-emerald-400' : ''}
                ${log.type === 'warning' ? 'text-amber-400' : ''}
                ${log.type === 'input' ? 'text-sky-400' : ''}
                ${log.type === 'info' ? 'text-white/60' : ''}
              `}>
                <span className="mr-2 opacity-50">{log.type === 'input' ? '>' : '#'}</span>
                {log.message}
              </span>
            </div>
          ))}
          
          {/* Cursor */}
          <div className="flex gap-3 pt-2">
             <span className="text-white/20">[--:--:--]</span>
             <span className="text-emerald-400 animate-pulse">_</span>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/20 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center px-4">
        <div className="flex items-center gap-1.5 h-full">
            <div className="w-10 h-8 bg-blue-500/20 rounded-md flex items-center justify-center hover:bg-blue-500/30 transition-colors">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-blue-400 rounded-[1px]"></div>
                <div className="bg-blue-400 rounded-[1px]"></div>
                <div className="bg-blue-400 rounded-[1px]"></div>
                <div className="bg-blue-400 rounded-[1px]"></div>
              </div>
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-10 h-8 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors ${i === 2 ? 'border-b-2 border-blue-400' : ''}`}>
                <div className={`w-5 h-5 rounded-md ${i % 2 === 0 ? 'bg-amber-400/50' : 'bg-emerald-400/50'}`}></div>
              </div>
            ))}
        </div>
        
        <div className="absolute right-4 flex items-center gap-4 text-white/80 text-[11px]">
          <div className="flex flex-col items-end">
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default DesktopSimulator;