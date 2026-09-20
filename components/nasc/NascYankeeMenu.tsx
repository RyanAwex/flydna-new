'use client'
import { useState } from 'react'

interface YankeeMenuProps {
  onClose: () => void
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

export default function NascYankeeMenu({ onClose, anchorX = 100, anchorY = 200, side = 'right' }: YankeeMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'score',   dot: '#003087', label: 'Live Score',    sub: 'Game in progress' },
    { id: 'tickets', dot: '#c9b25b', label: 'Get Tickets',  sub: 'Seats available' },
    { id: 'map',     dot: '#5577cc', label: 'Stadium Map',  sub: 'Gates & concourse' },
    { id: 'parking', dot: '#8899aa', label: 'Parking',      sub: 'Lots & garages' },
  ]

  const cardWidth = 240
  const cardX = side === 'left' ? anchorX - 260 - cardWidth : anchorX + 260
  const cardY = anchorY - 80
  const connEndX = side === 'left' ? cardX + cardWidth : cardX

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 999,
    }}>
      <style>{`
        @keyframes yankeeCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes yankeeLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes yankeeScoreGlow {
          0%,100% { opacity: 0.8; }
          50%     { opacity: 1; }
        }
        @keyframes yankeeItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes yankeeSpotPulse {
          0%,100% { opacity:0.6; }
          50%     { opacity:1; }
        }
        @keyframes yankeeConnBreath {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
      `}</style>

      {/* Animated connector line */}
      <svg style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        <path
          d={`M ${anchorX} ${anchorY} C ${anchorX + (side === 'left' ? -80 : 80)} ${anchorY}, ${connEndX + (side === 'left' ? 100 : -100)} ${cardY + 100}, ${connEndX} ${cardY + 100}`}
          stroke="#003087" strokeWidth="1.5" fill="none"
          strokeDasharray="1200"
          style={{ animation: 'yankeeLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, yankeeConnBreath 2.5s ease-in-out infinite 1s' }}
        />
      </svg>

      {/* Menu Card */}
      <div style={{
        position: 'absolute',
        top: cardY, left: cardX,
        width: '240px',
        pointerEvents: 'auto',
        animation: 'yankeeCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
        animationDelay: '0.4s',
        opacity: 0,
      }}>
        <div className="glass-panel-heavy" style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>

          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 10, right: 12, zIndex: 10,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: '16px',
            cursor: 'pointer', lineHeight: 1,
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >×</button>

          {/* Title */}
          <div style={{ padding: '18px 18px 10px', textAlign: 'center' }}>
            <div style={{
              color: 'rgba(180, 155, 70, 0.9)',
              fontSize: '13px', fontWeight: '500',
              letterSpacing: '0.06em',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              What&apos;s Happening
            </div>
          </div>

          {/* Score widget */}
          <div style={{
            padding: '4px 18px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {/* Home team — Yankees */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(0,48,135,0.6)',
                backgroundColor: 'rgba(0,10,40,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src="/YankeeLogo.png" alt="NYY" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>NYY</span>
            </div>

            {/* Score */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#c9b25b',
                fontSize: '22px', fontWeight: '300',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.04em',
                animation: 'yankeeScoreGlow 3s ease-in-out infinite',
              }}>
                4 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>:</span> 2
              </div>
              <div style={{
                color: 'rgba(201,178,91,0.7)',
                fontSize: '8px', letterSpacing: '0.18em',
                textTransform: 'uppercase', marginTop: 2,
              }}>7th Inning</div>
            </div>

            {/* Away team */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(0,48,135,0.5)',
                backgroundColor: 'rgba(0,10,40,0.9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>⚾</div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>OPP</span>
            </div>
          </div>

          {/* Navy-to-gold gradient bar */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, #001a4d 0%, #003087 50%, #c9b25b 100%)',
            margin: '0 12px', borderRadius: '2px',
            boxShadow: '0 0 10px rgba(0,48,135,0.5)',
            animation: 'yankeeSpotPulse 2.5s ease-in-out infinite',
          }} />

          {/* Menu items */}
          <div style={{
            padding: '14px 16px 16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 6px',
          }}>
            {menuItems.map((item, i) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  cursor: 'pointer', padding: '4px 6px', borderRadius: '8px',
                  background: hoveredItem === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'background 0.2s',
                  animation: 'yankeeItemIn 0.3s ease forwards',
                  animationDelay: `${0.6 + i * 0.07}s`,
                  opacity: 0,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: item.dot, flexShrink: 0,
                  boxShadow: hoveredItem === item.id ? `0 0 8px ${item.dot}` : 'none',
                  transition: 'box-shadow 0.2s',
                }} />
                <div>
                  <div style={{
                    color: hoveredItem === item.id ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    fontSize: '11px', fontWeight: '400',
                    letterSpacing: '0.02em',
                    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                    transition: 'color 0.2s',
                  }}>{item.label}</div>
                  <div style={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '8px', marginTop: 1,
                  }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

