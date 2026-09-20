'use client'
import { useState } from 'react'

interface ATLMenuProps {
  onClose: () => void
  venueId: string
  anchorX?: number
  anchorY?: number
  side?: 'left' | 'right'
}

type VenueData = {
  color: string
  title: string
  t1: string
  l1: string
  t2: string
  l2: string
  score: string
  time: string
  lat: number
  lng: number
  city: string
  streamUrl?: string
  items: { id: string, dot: string, label: string, sub: string }[]
}

const VENUE_DB: Record<string, VenueData> = {
  'mercedes-benz': {
    color: '#00ffff', title: "Matchday Live",
    t1: 'ATL', l1: '/ATL_Falcons.png',
    t2: 'ATL', l2: '/ATL_United-FC.png',
    score: '24 : 10', time: 'Live Updates',
    lat: 33.7554, lng: -84.4008, city: 'Atlanta',
    streamUrl: 'https://www.nfl.com/network/watch/nfl-network-live',
    items: [
      { id: 'tickets', dot: '#00ffff', label: 'Tickets', sub: 'Available tonight' },
      { id: 'watch', dot: '#ffffff', label: 'Watch Game', sub: 'NFL & MLS Streams' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
      { id: 'vip', dot: '#b04dff', label: 'VIP Lounge', sub: 'Premium access' },
    ]
  },
  'state-farm': {
    color: '#00e5ff', title: "NBA Action",
    t1: 'ATL', l1: '/ATL_Hawks.png',
    t2: 'BKN', l2: '/Brooklyn_Nets_Logo.png',
    score: '115 : 110', time: 'Final',
    lat: 33.7573, lng: -84.3963, city: 'Atlanta',
    streamUrl: 'https://www.nba.com/watch',
    items: [
      { id: 'tickets', dot: '#00e5ff', label: 'Find Seats', sub: 'Section 120' },
      { id: 'merch', dot: '#ffffff', label: 'Team Store', sub: 'Hawks Gear' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
      { id: 'vip', dot: '#ff0055', label: 'Courtside', sub: 'VIP access' },
    ]
  },
  'pete-petit': {
    color: '#0055ff', title: "NCAA Action",
    t1: 'GSU', l1: '/GA_Panthers.png',
    t2: 'AWAY', l2: '/GA_Panthers.png',
    score: '14 : 7', time: '3rd Qtr',
    lat: 33.7534, lng: -84.3858, city: 'Atlanta',
    streamUrl: 'https://www.espn.com/watch/',
    items: [
      { id: 'tickets', dot: '#0055ff', label: 'Find Seats', sub: 'Student Section' },
      { id: 'tailgate', dot: '#ffaa00', label: 'Tailgate', sub: 'Parking Lots' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
      { id: 'merch', dot: '#ffffff', label: 'Team Store', sub: 'GSU Gear' },
    ]
  },
  'cosm': {
    color: '#ff00e5', title: "Shared Reality Live",
    t1: 'COSM', l1: '/cosm_logo.png',
    t2: '8K', l2: '/cosm_logo.png',
    score: 'UFC 310', time: 'Tonight 8 PM',
    lat: 33.9192, lng: -84.4639, city: 'Atlanta',
    streamUrl: 'https://www.cosm.com/atlanta',
    items: [
      { id: 'tickets', dot: '#ff00e5', label: 'Dome Tickets', sub: 'UFC 310 Immersive' },
      { id: 'details', dot: '#ffffff', label: 'Dome Experience', sub: 'Shared Reality' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
      { id: 'vip', dot: '#a060ff', label: 'VIP Lounge', sub: 'Premium Dining' },
    ]
  },
  'nobu': {
    color: '#e5c158', title: "Nobu Hotel Atlanta",
    t1: 'NOBU', l1: '/nobu_logo.png',
    t2: 'HOTEL', l2: '/nobu_logo.png',
    score: '5-STAR', time: 'Luxury Stay',
    lat: 33.8462, lng: -84.3781, city: 'Atlanta',
    items: [
      { id: 'stay', dot: '#e5c158', label: 'Book Room', sub: 'Luxury suites' },
      { id: 'dining', dot: '#ff5500', label: 'Nobu Restaurant', sub: 'World-class sushi' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Premium transport' },
      { id: 'spa', dot: '#00ccff', label: 'Nirvana Spa', sub: 'Wellness rituals' },
    ]
  },
  'truist-park': {
    color: '#CE1141', title: "Braves Live",
    t1: 'ATL', l1: '/ATL_Braves.png',
    t2: 'NYM', l2: '/NY_Mets_Logo.png',
    score: '6 : 3', time: '8th Inning',
    lat: 33.8903, lng: -84.4677, city: 'Atlanta',
    streamUrl: 'https://www.mlb.com/tv',
    items: [
      { id: 'tickets', dot: '#CE1141', label: 'Tickets', sub: 'Seats available' },
      { id: 'watch', dot: '#ffffff', label: 'Watch Game', sub: 'MLB Streams' },
      { id: 'ride', dot: '#00e5a0', label: 'Need a Ride', sub: 'Book transport' },
      { id: 'vip', dot: '#ffaa00', label: 'VIP Club', sub: 'Delta SKY360°' },
    ]
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging.flydna.io'

export default function NascATLMenu({ onClose, venueId, anchorX = 60, anchorY = 40, side = 'right' }: ATLMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const data = VENUE_DB[venueId] || {
    color: '#ffffff', title: "Venue Event",
    t1: 'Home', l1: '/dot.png', t2: 'Away', l2: '/dot.png',
    score: '0 : 0', time: 'Pending',
    lat: 33.7490, lng: -84.3880, city: 'Atlanta',
    items: [{ id: '1', dot: '#ffffff', label: 'Find Info', sub: 'Available' }]
  }

  const { color, title, t1, l1, t2, l2, score, time, items, lat, lng, city, streamUrl } = data

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handleTickets() {
    setLoadingItem('tickets')
    try {
      const res = await fetch(`${API_BASE}/api/v1/nasc/tickets?city=${encodeURIComponent(city)}`)
      const json = await res.json()
      if (!json.success || !json.data?.length) {
        showToast('No events found right now — check back soon')
        return
      }
      const titleWords = title.toLowerCase().split(/\s+/)
      const match = json.data.find((e: any) =>
        titleWords.some((w: string) => (e.venue || '').toLowerCase().includes(w))
      ) || json.data[0]

      if (match?.url) {
        window.open(match.url, '_blank', 'noopener,noreferrer')
      } else {
        showToast('Tickets unavailable for this event right now')
      }
    } catch (err) {
      console.error('Tickets fetch failed:', err)
      showToast('Could not load tickets — try again shortly')
    } finally {
      setLoadingItem(null)
    }
  }

  function handleWatchGame() {
    if (streamUrl) {
      window.open(streamUrl, '_blank', 'noopener,noreferrer')
    } else {
      showToast('Streaming info coming soon')
    }
  }

  function handleNeedARide() {
    const params = new URLSearchParams({
      action: 'setPickup',
      'dropoff[latitude]': String(lat),
      'dropoff[longitude]': String(lng),
      'dropoff[nickname]': title,
    })
    window.open(`https://m.uber.com/ul/?${params.toString()}`, '_blank', 'noopener,noreferrer')
  }

  async function handleVipLounge() {
    setLoadingItem('vip')
    try {
      const res = await fetch(`${API_BASE}/api/v1/venue-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId,
          venueName: title,
          inquiryType: 'vip_lounge',
          notes: `Requested from NASC map card (${title})`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        showToast('VIP request sent — concierge will follow up shortly')
      } else {
        showToast('Could not submit request — try again')
      }
    } catch (err) {
      console.error('VIP inquiry failed:', err)
      showToast('Could not submit request — try again')
    } finally {
      setLoadingItem(null)
    }
  }

  function handleItemClick(id: string) {
    switch (id) {
      case 'tickets': return handleTickets()
      case 'watch': return handleWatchGame()
      case 'ride': return handleNeedARide()
      case 'vip': return handleVipLounge()
      default: return showToast('Coming soon')
    }
  }

  const cardWidth = 240
  const cardX = side === 'left' ? anchorX - 260 - cardWidth : anchorX + 160
  const cardY = anchorY - 60
  const connEndX = side === 'left' ? cardX + cardWidth : cardX

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 999,
    }}>
      <style>{`
        @keyframes bcCardIn {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes bcLineDraw {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes bcConnBreath {
          0%,100% { opacity:1; }
          50%     { opacity:0.55; }
        }
        @keyframes bcItemIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bcToastIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <marker id={`arrow-${venueId}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 Z" fill={color} style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
          </marker>
        </defs>
        <path
          d={`M ${anchorX} ${anchorY} L ${anchorX + (side === 'left' ? -30 : 30)} ${anchorY} L ${connEndX + (side === 'left' ? 30 : -30)} ${cardY + 80} L ${connEndX} ${cardY + 80}`}
          stroke={color} strokeWidth="2.5" fill="none"
          strokeDasharray="1200"
          markerEnd={`url(#arrow-${venueId})`}
          style={{ animation: 'bcLineDraw 0.9s cubic-bezier(0.16,1,0.3,1) forwards, bcConnBreath 2.5s ease-in-out infinite 1s', filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>

      <div style={{
        position: 'absolute', top: cardY, left: cardX,
        width: `${cardWidth}px`, pointerEvents: 'auto',
        animation: 'bcCardIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards', animationDelay: '0.4s', opacity: 0,
      }}>
        <div className="glass-panel-heavy" style={{
          position: 'relative', borderRadius: '20px', overflow: 'hidden'
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, zIndex: 10, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-main)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>×</button>

          <div style={{ padding: '18px 18px 10px', textAlign: 'center' }}>
            <div style={{ color, fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
          </div>

          <div style={{ padding: '4px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src={l1} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)', objectFit: 'contain', backgroundColor: 'var(--bg-app)', padding: 2 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em' }}>{t1}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.05em', textShadow: `0 0 10px ${color}55` }}>
                {score}
              </div>
              <div style={{ color: `${color}cc`, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
                {time}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <img src={l2} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)', objectFit: 'contain', backgroundColor: 'var(--bg-app)', padding: 2 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em' }}>{t2}</span>
            </div>
          </div>

          <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, margin: '0 12px', boxShadow: `0 0 10px ${color}88` }} />

          <div style={{ padding: '14px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 6px' }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                onClick={() => loadingItem ? null : handleItemClick(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: loadingItem ? 'wait' : 'pointer',
                  position: 'relative',
                  zIndex: 1000,
                  padding: '6px', borderRadius: '8px',
                  background: hoveredItem === item.id ? 'var(--sidebar-accent)' : 'transparent',
                  transition: 'background 0.2s',
                  animation: 'bcItemIn 0.3s ease forwards', animationDelay: `${0.6 + i * 0.07}s`, opacity: 0
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', backgroundColor: item.dot, flexShrink: 0,
                  boxShadow: hoveredItem === item.id ? `0 0 8px ${item.dot}` : 'none',
                  transition: 'box-shadow 0.2s',
                  opacity: loadingItem === item.id ? 0.4 : 1,
                }} />
                <div>
                  <div style={{ color: hoveredItem === item.id ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.02em', transition: 'color 0.2s' }}>
                    {loadingItem === item.id ? 'Loading...' : item.label}
                  </div>
                  <div style={{ color: 'var(--text-muted)', opacity: 0.7, fontSize: '9px', marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {toast && (
          <div className="glass-panel-heavy" style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 10,
            padding: '10px 14px', borderRadius: '10px',
            color: 'var(--text-main)', fontSize: '11px', textAlign: 'center',
            boxShadow: `0 0 15px ${color}33`,
            animation: 'bcToastIn 0.25s ease forwards',
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
