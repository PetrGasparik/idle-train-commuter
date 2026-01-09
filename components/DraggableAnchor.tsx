import React, { useState, useEffect, useRef } from 'react';
import Station from './Station';
import { Language } from '../types';
import { t } from '../locales';

interface DraggableAnchorProps {
  language: Language;
  onHover: (hovering: boolean) => void;
  onPositionChange: (x: number, y: number) => void;
  initialPos: { x: number, y: number };
}

const DraggableAnchor: React.FC<DraggableAnchorProps> = ({ 
  language, onHover, onPositionChange, initialPos 
}) => {
  const [pos, setPos] = useState(initialPos);
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
      
      const boundedX = Math.max(50, Math.min(window.innerWidth - 100, newX));
      const boundedY = Math.max(50, Math.min(window.innerHeight - 100, newY));
      
      setPos({ x: boundedX, y: boundedY });
      onPositionChange(boundedX, boundedY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('anchorPos', JSON.stringify(pos));
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange, pos]);

  return (
    <div
      ref={anchorRef}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => !isDragging && onHover(false)}
      className={`fixed z-[300] transition-transform duration-200 pointer-events-auto ${isDragging ? 'cursor-grabbing scale-105 opacity-80' : 'cursor-grab hover:scale-105'}`}
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative group">
        {/* Interaction Radius Hint */}
        <div className="absolute -inset-12 bg-blue-500/5 rounded-full border border-blue-500/10 scale-0 group-hover:scale-100 transition-transform duration-500"></div>
        
        {/* Visual Depot */}
        <Station language={language} />

        {/* Drag Handle Overlay */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded border border-white/20 text-[6px] font-bold text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {t(language, 'dragHint')}
        </div>

        {/* Landing Pad for Drone */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-400/20 rounded-full blur-[2px] animate-pulse"></div>
      </div>
    </div>
  );
};

export default DraggableAnchor;