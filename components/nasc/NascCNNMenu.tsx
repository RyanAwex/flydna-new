'use client'
import { useState } from 'react'

interface CNNMenuProps {
  onClose: () => void
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

export default function NascCNNMenu({ onClose, anchorX = 100, anchorY = 200, side = 'right' }: CNNMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'tour',   dot: '#FF0000', label: 'Studio Tour',    sub: 'Book now' },
    { id: 'stream', dot: '#ffffff', label: 'Live Broadcast', sub: 'Watch CNN' },
    { id: 'ride',   dot: '#00e5a0', label: 'Need a Ride',    sub: 'Book transport' },
    { id: 'food',   dot: '#ffcc00', label: 'Food Court',     sub: 'Dining options' },
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
        @keyframes cnnCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes cnnLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes cnnConnBreath {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
        @keyframes cnnItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <marker id="arrow-cnn" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="#FF0000" style={{ filter: 'drop-shadow(0 0 2px #FF0000)' }} />
          </marker>
        </defs>
        <path
          d={`M ${anchorX} ${anchorY} L ${anchorX + (side === 'left' ? -30 : 30)} ${anchorY} L ${connEndX + (side === 'left' ? 30 : -30)} ${cardY + 80} L ${connEndX} ${cardY + 80}`}
          stroke="#FF0000" strokeWidth="2.5" fill="none"
          strokeDasharray="1200"
          markerEnd="url(#arrow-cnn)"
          style={{ animation: 'cnnLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, cnnConnBreath 2.5s ease-in-out infinite 1s', filter: 'drop-shadow(0 0 6px #FF0000)' }}
        />
      </svg>

      <div style={{
        position: 'absolute', top: cardY, left: cardX,
        width: `${cardWidth}px`, pointerEvents: 'auto',
        animation: 'cnnCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards', animationDelay: '0.4s', opacity: 0,
      }}>
        <div className="glass-panel-heavy" style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, zIndex: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>×</button>

          <div style={{ padding: '18px 18px 10px', textAlign: 'center' }}>
            <div style={{ color: '#FF0000', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Global News</div>
          </div>

          <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src="/CNN.png" style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', objectFit: 'contain', backgroundColor: '#000', padding: 2 }} />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', letterSpacing: '0.1em' }}>CNN</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ffffff', fontSize: '20px', fontWeight: 'bold', letterSpacing: '0.05em', textShadow: '0 0 10px #FF0000' }}>
                BREAKING
              </div>
              <div style={{ color: '#FF0000cc', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
                Now
              </div>
            </div>
          </div>

          <div style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #FF0000, transparent)', margin: '0 12px', boxShadow: '0 0 10px #FF0000' }} />

          <div style={{ padding: '14px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 6px' }}>
            {menuItems.map((item, i) => (
              <div key={item.id} onMouseEnter={() => setHoveredItem(item.id)} onMouseLeave={() => setHoveredItem(null)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px', borderRadius: '8px', background: hoveredItem === item.id ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.2s', animation: 'cnnItemIn 0.3s ease forwards', animationDelay: `${0.6 + i * 0.07}s`, opacity: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.dot, flexShrink: 0, boxShadow: hoveredItem === item.id ? `0 0 8px ${item.dot}` : 'none', transition: 'box-shadow 0.2s' }} />
                <div>
                  <div style={{ color: hoveredItem === item.id ? '#ffffff' : 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.02em', transition: 'color 0.2s' }}>{item.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
