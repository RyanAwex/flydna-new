'use client';

import React, { useEffect, useState } from 'react';

export default function NascTransitionOverlay({ 
  targetState, 
  onComplete 
}: { 
  targetState: string, 
  onComplete: () => void 
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return p + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050012] flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
      
      {/* Moving Tech Grid Background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundSize: '50px 50px',
          backgroundImage: 'linear-gradient(to right, #00e5ff 1px, transparent 1px), linear-gradient(to bottom, #a060ff 1px, transparent 1px)',
          animation: 'grid-move 2s linear infinite'
        }}
      />
      <style>{`
        @keyframes grid-move {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Core Holographic Ring */}
        <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-b-2 border-l-2 border-[#00e5ff] animate-spin" style={{ animationDuration: '1s' }} />
          <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-[#e080ff] animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(0,229,255,0.2)_inset]" />
          <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.2)]" />
          
          <span className="text-cyan-400 font-mono text-2xl tracking-widest font-bold drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
            {progress}%
          </span>
        </div>

        <h2 className="text-2xl font-light tracking-widest text-transparent uppercase mb-3 text-center"
            style={{background:'linear-gradient(90deg, #00e5ff, #c257fe)', WebkitBackgroundClip:'text'}}>
          Establishing Uplink
        </h2>
        <p className="text-purple-300/60 font-mono text-xs tracking-widest uppercase mb-10 text-center flex flex-col gap-1">
          <span>Disconnecting Local Node...</span>
          <span>Rerouting Data to <span className="text-cyan-400 font-bold">{targetState}</span> Server</span>
        </p>

        {/* Cyber Progress Bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(0,229,255,0.1)]">
          <div 
            className="h-full bg-cyan-400 transition-all duration-75 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 h-full w-24 bg-white/80 blur-[2px] shadow-[0_0_10px_#00e5ff]" />
          </div>
        </div>
        
      </div>
    </div>
  );
}
