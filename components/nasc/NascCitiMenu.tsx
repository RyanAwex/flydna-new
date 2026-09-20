'use client'
import { useState } from 'react'

interface CitiMenuProps {
  onClose: () => void
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

export default function NascCitiMenu({ onClose, anchorX = 100, anchorY = 200, side = 'right' }: CitiMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'seats', dot: '#FF5910', label: 'Find Seats',  sub: 'Available tonight' },
    { id: 'watch', dot: '#ffffff', label: 'Watch Game',  sub: 'Live stream' },
    { id: 'ride',  dot: '#0050B5', label: 'Need a Ride', sub: 'Book transport' },
    { id: 'vip',   dot: '#b04dff', label: 'VIP Package', sub: 'Premium access' },
  ]

  const cardWidth = 240
  const cardX = side === 'left' ? anchorX - 260 - cardWidth : anchorX + 260
  const cardY = anchorY - 80
  // connector endpoint on the card edge facing the anchor
  const connEndX = side === 'left' ? cardX + cardWidth : cardX

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 999,
    }}>
      <style>{`
        @keyframes citiCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes citiLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes citiScoreGlow {
          0%,100% { opacity: 0.8; }
          50%     { opacity: 1; }
        }
        @keyframes citiItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes citiSpotPulse {
          0%,100% { opacity:0.6; }
          50%     { opacity:1; }
        }
        @keyframes citiConnBreath {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
      `}</style>

      {/* Clean orange pulsing connector */}
      <svg style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        {/* Draw-in, then pulse */}
        <path
          d={`M ${anchorX} ${anchorY} C ${anchorX + (side === 'left' ? -80 : 80)} ${anchorY}, ${connEndX + (side === 'left' ? 100 : -100)} ${cardY + 100}, ${connEndX} ${cardY + 100}`}
          stroke="#FF5910" strokeWidth="1.5" fill="none"
          strokeDasharray="1200"
          style={{ animation: 'citiLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, citiConnBreath 2.5s ease-in-out infinite 1s' }}
        />
      </svg>

      {/* Menu Card */}
      <div style={{
        position: 'absolute',
        top: cardY, left: cardX,
        width: '240px',
        pointerEvents: 'auto',
        animation: 'citiCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
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
          <div style={{
            padding: '18px 18px 10px',
            textAlign: 'center',
          }}>
            <div style={{
              color: 'rgba(255, 129, 66, 0.9)',
              fontSize: '13px', fontWeight: '500',
              letterSpacing: '0.06em',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              What's Happening
            </div>
          </div>

          {/* Score section (Mets vs Yankees placeholder) */}
          <div style={{
            padding: '4px 18px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src="/NY_Mets_Logo.png" style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                objectFit: 'contain',
                backgroundColor: '#ffffff',
                padding: '2px',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>NYM</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#ffffff',
                fontSize: '26px', fontWeight: '300',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.04em',
                animation: 'citiScoreGlow 3s ease-in-out infinite',
              }}>
                7 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>:</span> 4
              </div>
              <div style={{
                color: 'rgba(255,129,66,0.8)',
                fontSize: '8px', letterSpacing: '0.18em',
                textTransform: 'uppercase', marginTop: 2,
              }}>
                Top 8th
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                backgroundColor: '#002D72',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '12px', fontWeight: 'bold'
              }}>NYY</div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>NYY</span>
            </div>
          </div>

          {/* Orange/Blue gradient bar */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, #002D72 0%, #FF5910 50%, #ffffff 100%)',
            margin: '0 12px',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(255,89,16,0.4)',
            animation: 'citiSpotPulse 2.5s ease-in-out infinite',
          }} />

          {/* Menu items — 2 column grid */}
          <div style={{
            padding: '14px 16px 16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 6px',
          }}>
            {menuItems.map((item, i) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '8px',
                  background: hoveredItem === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'background 0.2s',
                  animation: 'citiItemIn 0.3s ease forwards',
                  animationDelay: `${0.6 + i * 0.07}s`,
                  opacity: 0,
                }}
              >
                {/* Colored dot */}
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  backgroundColor: item.dot,
                  flexShrink: 0,
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

