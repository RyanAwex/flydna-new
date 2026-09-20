'use client'
import { useState } from 'react'

interface NascRadialControlProps {
  spinning: boolean
  onToggleSpin: () => void
  onMapStyleChange: (style: string) => void
  onLightPresetChange?: (preset: 'day' | 'dawn' | 'dusk' | 'night') => void
}

export default function NascRadialControl({ spinning, onToggleSpin, onMapStyleChange, onLightPresetChange }: NascRadialControlProps) {
  const [open, setOpen] = useState(false)
  const [activeMode, setActiveMode] = useState('night')

  const handleMode = (mode: string) => {
    setActiveMode(mode)
    onLightPresetChange?.(mode as 'day' | 'dawn' | 'dusk' | 'night')
    setOpen(false)
  }

  const options = [
    { id: 'day',   icon: 'emoji', emoji: '☀️',           label: 'DAY',   top: '4px',    left: '50%', transform: 'translateX(-50%)', delay: '0.05s' },
    { id: 'dusk',  icon: 'img',   src: '/Dusk.svg',       label: 'DUSK',  top: '52px',   right: '4px',                         delay: '0.1s'  },
    { id: 'dawn',  icon: 'img',   src: '/dawn.png',       label: 'DAWN',  top: '52px',   left: '4px',                          delay: '0.1s'  },
    { id: 'night', icon: 'emoji', emoji: '🌙',             label: 'NIGHT', bottom: '4px', left: '4px',                          delay: '0.15s' },
  ]

  const controls = [
    { id: 'auto', emoji: '⟳', label: spinning ? 'STOP' : 'AUTO', bottom: '4px', right: '4px', delay: '0.2s', isControl: true },
  ]

  return (
    <div style={{
      position: 'absolute', top: 144, left: 12, zIndex: 20,
      width: '180px', height: '180px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes rcPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes rcOptionIn { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
        @keyframes rcSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .rc-option { transition: all 0.2s; }
        .rc-option:hover { transform: scale(1.15) !important; }
        .rc-center { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .rc-center:hover { transform: scale(1.18); box-shadow: 0 0 36px rgba(0,255,255,0.8), inset 0 0 18px rgba(0,255,255,0.2) !important; border-color: #00ffff !important; }
        .rc-center:hover img { filter: drop-shadow(0 0 10px #00ffff) brightness(1.3) !important; }
      `}</style>

      {open && <>
        <div style={{
          position: 'absolute', width: '170px', height: '170px',
          borderRadius: '50%', border: '1px solid rgba(0,255,255,0.1)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', width: '148px', height: '148px',
          borderRadius: '50%', border: '1px dashed rgba(0,255,255,0.07)',
          pointerEvents: 'none',
        }}/>
      </>}

      {open && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 180 180">
          <line x1="90" y1="90" x2="90" y2="28" stroke="rgba(0,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1="90" y1="90" x2="148" y2="58" stroke="rgba(0,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1="90" y1="90" x2="32" y2="58" stroke="rgba(0,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1="90" y1="90" x2="90" y2="152" stroke="rgba(0,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3"/>
          <line x1="90" y1="90" x2="30" y2="138" stroke="rgba(0,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3"/>
        </svg>
      )}

      {open && [...options, ...controls].map((opt) => (
        <div
          key={opt.id}
          className="rc-option"
          onClick={() => {
            if (opt.id === 'auto') { onToggleSpin(); setOpen(false) }
            else if (opt.id === 'spin') { setOpen(false) }
            else handleMode(opt.id)
          }}
          style={{
            position: 'absolute',
            top: (opt as any).top,
            bottom: (opt as any).bottom,
            left: (opt as any).left,
            right: (opt as any).right,
            transform: (opt as any).transform,
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: activeMode === opt.id
              ? 'rgba(0,255,255,0.2)'
              : 'rgba(8,0,24,0.92)',
            border: `1.5px solid ${activeMode === opt.id ? '#00ffff' : 'rgba(0,255,255,0.4)'}`,
            boxShadow: activeMode === opt.id
              ? '0 0 16px rgba(0,255,255,0.6)'
              : '0 0 8px rgba(0,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            cursor: 'pointer',
            animation: `rcOptionIn 0.3s cubic-bezier(0.34,1.56,0.64,1) ${opt.delay} both`,
            zIndex: 15,
          }}
        >
          <span style={{ fontSize: '14px', lineHeight: 1 }}>
            {(opt as any).icon === 'img' && <img src={(opt as any).src} style={{ width: 26, height: 26, objectFit: 'contain' }} />}
            {(opt as any).icon === 'emoji' && (opt as any).emoji}
          </span>
          <span style={{
            color: activeMode === opt.id ? '#00ffff' : 'rgba(0,255,255,0.7)',
            fontSize: '7px', fontWeight: 'bold',
            letterSpacing: '0.1em', marginTop: '2px',
            fontFamily: 'monospace',
          }}>{opt.label}</span>
        </div>
      ))}

      {/* Center knob ring */}
      <div style={{
        position: 'absolute',
        width: '96px', height: '96px',
        borderRadius: '50%',
        background: 'linear-gradient(145deg, #1a1a2e, #06000e)',
        border: '3px solid rgba(0,255,255,0.2)',
        boxShadow: '0 0 20px rgba(0,255,255,0.15), inset 0 2px 4px rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }}/>

      <div style={{
        position: 'absolute',
        width: '80px', height: '80px',
        borderRadius: '50%',
        border: '1.5px solid rgba(150,160,170,0.2)',
        background: 'linear-gradient(145deg, rgba(180,190,200,0.08), rgba(80,90,100,0.04))',
        pointerEvents: 'none',
      }}/>

      {/* Center FlyDnA logo button */}
      <div
        className="rc-center"
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'relative', zIndex: 20,
          width: '68px', height: '68px',
          borderRadius: '50%',
          background: open
            ? 'radial-gradient(circle at 40% 35%, rgba(0,255,255,0.15), #06000e)'
            : 'radial-gradient(circle at 40% 35%, #1a1a3a, #06000e)',
          border: `2px solid ${open ? 'rgba(0,255,255,0.8)' : 'rgba(0,255,255,0.5)'}`,
          boxShadow: open
            ? '0 0 24px rgba(0,255,255,0.5), inset 0 0 12px rgba(0,255,255,0.1)'
            : '0 0 14px rgba(0,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <img
          src="/flydna-logo.svg"
          style={{
            width: '60px', height: '60px',
            objectFit: 'cover',
            borderRadius: '50%',
            filter: 'drop-shadow(0 0 4px rgba(0,255,255,0.6))',
            animation: spinning ? 'rcSpin 8s linear infinite' : 'none',
          }}
        />
        <div style={{
          position: 'absolute', inset: '-5px',
          borderRadius: '50%',
          border: '1px solid rgba(0,255,255,0.3)',
          animation: 'rcPulse 2s ease-in-out infinite',
          pointerEvents: 'none',
        }}/>
      </div>

      {!open && (
        <div style={{
          position: 'absolute', bottom: '-20px', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '4px',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#00ffff',
            boxShadow: '0 0 6px #00ffff',
            animation: 'rcPulse 1.5s infinite',
          }}/>
          <span style={{
            color: 'rgba(0,255,255,0.4)',
            fontSize: '8px', fontFamily: 'monospace',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>{activeMode}</span>
        </div>
      )}
    </div>
  )
}
