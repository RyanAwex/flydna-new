'use client'
import { useState } from 'react'

interface TEBMenuProps {
  onClose: () => void
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

export default function NascTEBMenu({ onClose, anchorX = 100, anchorY = 200, side = 'right' }: TEBMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'flights',  dot: '#00ffcc', label: 'Live Flights',   sub: 'Private & charter'  },
    { id: 'terminal', dot: '#ffffff', label: 'Terminal Map',   sub: 'FBO & hangars'       },
    { id: 'charter',  dot: '#00b4d8', label: 'Charter Book',  sub: 'Book a flight'       },
    { id: 'delays',   dot: '#b04dff', label: 'Delay Status',  sub: 'Current conditions'  },
  ]

  const cardWidth = 240
  const cardX = side === 'left' ? anchorX - 260 - cardWidth : anchorX + 260
  const cardY = anchorY - 80
  const connEndX = side === 'left' ? cardX + cardWidth : cardX

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
      <style>{`
        @keyframes tebCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes tebLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes tebGlow {
          0%,100% { opacity:0.8; } 50% { opacity:1; }
        }
        @keyframes tebItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tebPulse {
          0%,100% { opacity:0.6; } 50% { opacity:1; }
        }
        @keyframes tebConnBreath {
          0%,100% { opacity:1; } 50% { opacity:0.55; }
        }
      `}</style>

      {/* Connector line */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        <path
          d={`M ${anchorX} ${anchorY} C ${anchorX + (side === 'left' ? -80 : 80)} ${anchorY}, ${connEndX + (side === 'left' ? 100 : -100)} ${cardY + 100}, ${connEndX} ${cardY + 100}`}
          stroke="#00ffcc" strokeWidth="1.5" fill="none" strokeDasharray="1200"
          style={{ animation: 'tebLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, tebConnBreath 2.5s ease-in-out infinite 1s' }}
        />
      </svg>

      <div style={{
        position: 'absolute', top: cardY, left: cardX, width: '240px',
        pointerEvents: 'auto',
        animation: 'tebCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        animationDelay: '0.4s', opacity: 0,
      }}>
        <div className="glass-panel-heavy" style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}>

          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, zIndex: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '16px', cursor: 'pointer', lineHeight: 1, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >×</button>

          <div style={{ padding: '18px 18px 10px', textAlign: 'center' }}>
            <div style={{ color: 'rgba(0,255,204,0.9)', fontSize: '13px', fontWeight: '500', letterSpacing: '0.06em', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              What&apos;s Happening
            </div>
          </div>

          <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,255,204,0.3)', backgroundColor: '#1a5fb4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <polygon points="6,8 6,24 20,16" fill="#ffffff"/>
                  <text x="22" y="14" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="Arial">TEB</text>
                  <text x="22" y="22" fill="rgba(255,255,255,0.8)" fontSize="5" fontFamily="Arial">AIRPORT</text>
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>DEP</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#00ffcc', fontSize: '22px', fontWeight: '300', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '0.04em', animation: 'tebGlow 3s ease-in-out infinite' }}>
                48 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>/</span> 52
              </div>
              <div style={{ color: 'rgba(0,255,204,0.8)', fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 2 }}>On Time</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(0,255,204,0.3)', backgroundColor: 'rgba(0,20,40,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✈️</div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>ARR</span>
            </div>
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, #001a15 0%, #00ffcc 50%, #00b4d8 100%)', margin: '0 12px', borderRadius: '2px', boxShadow: '0 0 10px rgba(0,255,204,0.4)', animation: 'tebPulse 2.5s ease-in-out infinite' }} />

          <div style={{ padding: '14px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 6px' }}>
            {menuItems.map((item, i) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 6px', borderRadius: '8px', background: hoveredItem === item.id ? 'rgba(255,255,255,0.06)' : 'transparent', transition: 'background 0.2s', animation: 'tebItemIn 0.3s ease forwards', animationDelay: `${0.6 + i * 0.07}s`, opacity: 0 }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.dot, flexShrink: 0, boxShadow: hoveredItem === item.id ? `0 0 8px ${item.dot}` : 'none', transition: 'box-shadow 0.2s' }} />
                <div>
                  <div style={{ color: hoveredItem === item.id ? '#ffffff' : 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '400', letterSpacing: '0.02em', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', transition: 'color 0.2s' }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

