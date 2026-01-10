
import React, { useState, useEffect, useRef, memo } from 'react';
import Station from './Station';
import { Language } from '../types';
import { t } from '../locales';

interface DraggableAnchorProps {
  language: Language;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
  onPositionChange: (x: number, y: number) => void;
  initialPos: { x: number, y: number };
  setIgnoreMouse: (ignore: boolean) => void;
}

const DraggableAnchor: React.FC<DraggableAnchorProps> = memo(({ 
  language, onHover, onClick, onPositionChange, initialPos, setIgnoreMouse 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    hasMoved.current = false;
    setIgnoreMouse(false);
    
    dragStartOffset.current = {
      x: e.clientX - initialPos.x,
      y: e.clientY - initialPos.y
    };
    e.stopPropagation();
    e.preventDefault();
  };

  const handleAnchorClick = (e: React.MouseEvent) => {
    // Menu přepneme jen pokud se s kotvou nehýbalo (nebyl to drag)
    if (!hasMoved.current) {
      onClick();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartOffset.current.x;
      const newY = e.clientY - dragStartOffset.current.y;
      
      // Detekce pohybu pro odlišení kliku od tažení
      if (Math.abs(newX - initialPos.x) > 3 || Math.abs(newY - initialPos.y) > 3) {
        hasMoved.current = true;
      }
      
      const boundedX = Math.max(40, Math.min(window.innerWidth - 40, newX));
      const boundedY = Math.max(40, Math.min(window.innerHeight - 40, newY));
      
      onPositionChange(boundedX, boundedY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('anchorPos', JSON.stringify(initialPos));
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onPositionChange, initialPos]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleAnchorClick}
      onMouseEnter={() => {
        onHover(true);
        setIgnoreMouse(false);
      }}
      onMouseLeave={() => {
        if (!isDragging) {
          onHover(false);
        }
      }}
      className={`relative z-[300] transition-transform duration-200 pointer-events-auto ${isDragging ? 'cursor-grabbing scale-105 opacity-80' : 'cursor-grab hover:scale-105'}`}
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative group">
        <Station language={language} />
        {/* Hint se ukáže při najetí, ale bez modrého hala */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-1 rounded-full border border-white/20 text-[7px] font-black text-white uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0 whitespace-nowrap">
          {t(language, 'dragHint')}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-blue-400/30 rounded-full blur-[3px] animate-pulse"></div>
      </div>
    </div>
  );
});

export default DraggableAnchor;
