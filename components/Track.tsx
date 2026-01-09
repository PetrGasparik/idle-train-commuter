
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
      {/* Hlavní kolejnice s velkým poloměrem zakulacení */}
      <div className="absolute inset-[13px] border border-white/10 rounded-[45px]"></div>
      <div className="absolute inset-[27px] border border-white/10 rounded-[35px]"></div>

      {/* Pražce - nyní omezené pouze na rovinky pomocí marginu */}
      <div className="absolute top-0 left-[60px] right-[60px] h-[40px] opacity-100" style={sleeperStyle}></div>
      <div className="absolute bottom-0 left-[60px] right-[60px] h-[40px] opacity-100" style={sleeperStyle}></div>
      <div className="absolute top-[60px] bottom-[60px] left-0 w-[40px] opacity-100" style={sleeperStyleVert}></div>
      <div className="absolute top-[60px] bottom-[60px] right-0 w-[40px] opacity-100" style={sleeperStyleVert}></div>
      
      {/* Vnitřní stín pro hloubku */}
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]"></div>
    </div>
  );
};

export default Track;
