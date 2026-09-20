'use client';

import React, { useState } from 'react';
import { ChevronDown, Atom, Triangle, Hexagon, Layers } from 'lucide-react';

export default function NascStateVibeDropdown({ onStateSelect }: { onStateSelect?: (state: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('');

  const options = [
    { name: 'New York', icon: <Atom size={18} className="text-cyan-400" /> },
    { name: 'Atlanta', icon: <Hexagon size={18} className="text-emerald-400" /> },
    { name: 'Florida', icon: <Triangle size={18} className="text-red-500" /> },
    { name: 'Texas', icon: <Layers size={18} className="text-orange-500" /> },
  ];

  return (
    <div className="relative w-full font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-full transition-all duration-300
          ${isOpen 
            ? 'bg-[#2a2a2a] shadow-[0_-8px_25px_rgba(168,85,247,0.6),8px_0_25px_rgba(45,212,191,0.6),0_8px_25px_rgba(236,72,153,0.6),-8px_0_25px_rgba(34,197,94,0.6)]' 
            : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'
          }`}
      >
        <span className="text-white/70 text-sm whitespace-nowrap overflow-hidden text-ellipsis mr-2 tracking-wide">State Vibe Selector</span>
        <ChevronDown className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="p-4 text-white/40 text-sm">Pick one option from the list</div>
          
          <div className="px-2 pb-2 space-y-1">
            {options.map((lib) => (
              <button
                key={lib.name}
                onClick={() => { 
                  setSelected(lib.name); 
                  setIsOpen(false);
                  onStateSelect?.(lib.name);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${selected === lib.name 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/70 hover:bg-white/5'
                  }`}
              >
                <span className="p-1 rounded-md bg-white/5">
                  {lib.icon}
                </span>
                <span className="font-medium">{lib.name}</span>
              </button>
            ))}
          </div>
          
          <div className="h-[1px] bg-white/5 w-full"></div>
        </div>
      )}
    </div>
  );
}
