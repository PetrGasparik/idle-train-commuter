import React, { useState, useEffect, useRef } from 'react';

interface DraggableAnchorProps {
  onHover: (hovering: boolean) => void;
  onPositionChange: (x: number, y: number) => void;
  initialPos: { x: number, y: number };
}

const DraggableAnchor: React.FC<DraggableAnchorProps> = ({ onHover, onPositionChange, initialPos }) => {
  // Ensure we have valid initial coordinates even if window.innerWidth was 0
  const safeInitialPos = {
    x: initialPos.x <= 0 ? window.innerWidth - 80 : initialPos.x,
    y: initialPos.y <= 0 ? 60 : initialPos.y
  };

  const [pos, setPos] = useState(safeInitialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      const boundedX = Math.max(10, Math.min(window.innerWidth - 50, newX));
      const boundedY = Math.max(10, Math.min(window.innerHeight - 50, newY));
      
      setPos({ x: boundedX, y: boundedY });
      onPositionChange(boundedX, boundedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange]);

  return (
    <div
      ref={anchorRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => !isDragging && onHover(false)}
      className={`fixed z-[300] cursor-move transition-transform duration-200 pointer-events-auto ${isDragging ? 'scale-125' : 'hover:scale-110'}`}
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Outer Glow (High Contrast) */}
        <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full animate-pulse"></div>
        
        {/* Hexagon Shape - High Opacity */}
        <div className="absolute inset-1 bg-blue-600 border-2 border-white/40 rotate-45 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
        
        {/* Inner Core */}
        <div className="relative w-4 h-4 bg-white rounded-full shadow-[0_0_10px_#fff] flex items-center justify-center">
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        
        {/* Directional Indicator (Small Cog/Train icon feeling) */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border border-white/50 flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
          !
        </div>
      </div>
    </div>
  );
};

export default DraggableAnchor;