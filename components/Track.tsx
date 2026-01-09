
import React from 'react';

const Track: React.FC = () => {
  const sleeperStyle = {
    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 17px)`,
  };

  const sleeperStyleVert = {
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 17px)`,
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Hlavní kolejnice */}
      <div className="absolute inset-[14px] border border-white/10 rounded-sm"></div>
      <div className="absolute inset-[26px] border border-white/10 rounded-sm"></div>

      {/* Pražce (Sleepers) */}
      <div className="absolute top-0 left-0 right-0 h-[40px] opacity-100" style={sleeperStyle}></div>
      <div className="absolute bottom-0 left-0 right-0 h-[40px] opacity-100" style={sleeperStyle}></div>
      <div className="absolute top-0 bottom-0 left-0 w-[40px] opacity-100" style={sleeperStyleVert}></div>
      <div className="absolute top-0 bottom-0 right-0 w-[40px] opacity-100" style={sleeperStyleVert}></div>
      
      {/* Vnitřní stín pro hloubku */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"></div>
    </div>
  );
};

export default Track;
