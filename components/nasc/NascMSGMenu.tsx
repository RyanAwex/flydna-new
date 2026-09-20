'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MSGMenuProps {
  onClose: () => void
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

export default function NascMSGMenu({ onClose, anchorX = 100, anchorY = 200, side = 'right' }: MSGMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const router = useRouter()

  const handleItemClick = (id: string) => {
    if (id === 'seats') router.push('/msg-arena')
  }

  const menuItems = [
    { id: 'seats', dot: '#ff4d4d', label: 'Find Seats',  sub: 'Available tonight' },
    { id: 'watch', dot: '#4d9fff', label: 'Watch Game',  sub: 'Live stream' },
    { id: 'ride',  dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
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
        @keyframes msgCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes msgLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes msgScoreGlow {
          0%,100% { opacity: 0.8; }
          50%     { opacity: 1; }
        }
        @keyframes msgItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes msgSpotPulse {
          0%,100% { opacity:0.6; }
          50%     { opacity:1; }
        }
        @keyframes connBreath {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
        @keyframes orbPulse {
          0%,100% { opacity:0.9; transform:scale(1); }
          50%     { opacity:0.5; transform:scale(1.3); }
        }
      `}</style>

      {/* Clean white pulsing connector */}
      <svg style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        {/* Draw-in, then pulse */}
        <path
          d={`M ${anchorX} ${anchorY} C ${anchorX + (side === 'left' ? -80 : 80)} ${anchorY}, ${connEndX + (side === 'left' ? 100 : -100)} ${cardY + 100}, ${connEndX} ${cardY + 100}`}
          stroke="#05f541ff" strokeWidth="1.5" fill="none"
          strokeDasharray="1200"
          style={{ animation: 'msgLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, connBreath 2.5s ease-in-out infinite 1s' }}
        />
      </svg>

      {/* Menu Card */}
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: cardY, left: cardX,
          width: '240px',
          pointerEvents: 'auto',
          userSelect: 'none',
          animation: 'msgCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
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
              color: 'rgba(0, 240, 248, 0.9)',
              fontSize: '13px', fontWeight: '500',
              letterSpacing: '0.06em',
              fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              What's Happening
            </div>
          </div>

          {/* Score section */}
          <div style={{
            padding: '4px 18px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src="/knick_Logo.png" draggable={false} style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                objectFit: 'cover',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>NYK</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#ffffff',
                fontSize: '26px', fontWeight: '300',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                letterSpacing: '0.04em',
                animation: 'msgScoreGlow 3s ease-in-out infinite',
              }}>
                108 <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>:</span> 104
              </div>
              <div style={{
                color: 'rgba(100,255,160,0.8)',
                fontSize: '8px', letterSpacing: '0.18em',
                textTransform: 'uppercase', marginTop: 2,
              }}>
                Final
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src="/ranger_Logo.png" draggable={false} style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.12)',
                objectFit: 'contain',
                backgroundColor: '#00205B',
                padding: '2px',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '0.1em' }}>NYR</span>
            </div>
          </div>

          {/* Rainbow gradient bar — like the image */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, #ff4d4d 0%, #4d9fff 35%, #00e5a0 65%, #b04dff 100%)',
            margin: '0 12px',
            borderRadius: '2px',
            boxShadow: '0 0 10px rgba(120,100,255,0.4)',
            animation: 'msgSpotPulse 2.5s ease-in-out infinite',
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
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '8px',
                  background: hoveredItem === item.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                  transition: 'background 0.2s',
                  animation: 'msgItemIn 0.3s ease forwards',
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

