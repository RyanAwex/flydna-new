'use client'

import { useState, useEffect, ReactNode } from 'react'
import NascInfrastructureStatus from './NascInfrastructureStatus'
import NascVaultAssets from './NascVaultAssets'
import NascDigitalGarage from './NascDigitalGarage'
import { ChatManager } from '@/lib/api'
import { useCall } from '@/context/CallContext'


// ── Arc geometry ──────────────────────────────────────────────────────────────
const R = 780        // arc radius — larger = flatter curve
const SPAN = 68      // total arc sweep in degrees
const BTN = 66       // button diameter px
const N = 7

function arcPos(i: number) {
  const t = (i / (N - 1)) * 2 - 1            // −1 → +1
  const rad = (t * (SPAN / 2) * Math.PI) / 180
  return {
    x: R * Math.sin(rad),                     // horizontal offset from center
    y: R * (1 - Math.cos(rad)),               // vertical drop (0 = center/peak)
  }
}

const POS = Array.from({ length: N }, (_, i) => arcPos(i))
const MAX_DROP = Math.max(...POS.map(p => p.y))   // how much edge items drop

// ── Menu items ────────────────────────────────────────────────────────────────
type PID = 'state' | 'infra' | 'vault' | 'telephony' | 'garage' | 'trips' | 'member'

const ITEMS: { id: PID; label: string; color: string; icon: ReactNode }[] = [
  {
    id: 'state', label: 'State Vibe', color: '#06b6d4',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: 'infra', label: 'Infrastructure', color: '#8b5cf6',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'vault', label: 'Vault Assets', color: '#f59e0b',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 'telephony', label: 'Telephony', color: '#10b981',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: 'garage', label: 'Digital Garage', color: '#0ea5e9',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'trips', label: 'Upcoming Trips', color: '#6366f1',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
  },
  {
    id: 'member', label: 'Member Info', color: '#d946ef',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

// ── Panel content per item ─────────────────────────────────────────────────────
function PanelContent({
  id, visibleLayers, onToggleLayer, onStateSelect,
}: {
  id: PID
  visibleLayers: Set<string>
  onToggleLayer: (l: string) => void
  onStateSelect: (s: string) => void
}) {
  if (id === 'state') {
    const CITIES = [
      { name: 'New York',  emoji: '🗽', color: '#00e5ff', sub: 'NYC Metro' },
      { name: 'Atlanta',   emoji: '🍑', color: '#00ff88', sub: 'ATL Metro' },
      { name: 'Florida',   emoji: '🌴', color: '#ff6655', sub: 'FL Coasts' },
      { name: 'Texas',     emoji: '⭐', color: '#ffaa00', sub: 'TX Grid'   },
    ]
    return (
      <div style={{ padding: '14px 16px', width: '240px' }}>
        <p style={{ color: '#00e5ff', fontSize: 10, fontWeight: 'bold', marginBottom: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'monospace' }}>State Vibe Selector</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CITIES.map(city => (
            <button
              key={city.name}
              onClick={() => onStateSelect(city.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${city.color}40`,
                color: '#fff', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                textAlign: 'left', width: '100%',
                transition: 'all 0.18s',
                fontFamily: 'sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${city.color}18`; e.currentTarget.style.borderColor = `${city.color}99`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${city.color}40`; }}
            >
              <span style={{ fontSize: 22 }}>{city.emoji}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ color: city.color, fontSize: 13 }}>{city.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.1em' }}>{city.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (id === 'infra') return (
    <div className="p-1 w-72">
      <NascInfrastructureStatus visibleLayers={visibleLayers} onToggleLayer={onToggleLayer} />
    </div>
  )

  if (id === 'vault') return (
    <div className="p-1 w-64">
      <NascVaultAssets />
    </div>
  )

  if (id === 'telephony') {
    const handleAction = (type: 'none' | 'ptt' | 'audio' | 'video', partnerId: string) => {
      window.dispatchEvent(new CustomEvent('flydna-call-state', { detail: { type, partnerId } }))
    }

    const { startPTT } = useCall()

    // 1. Back-office support contacts (the production mock contacts)
    const backOfficeContacts = [
      {
        id: '101',
        name: 'FlyDnA Concierge',
        role: 'Lobby Agent · Concierge',
        avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23g1)"/><path d="M50 25c-8.8 0-16 7.2-16 16v19h32v-19c0-8.8-7.2-16-16-16zm-20 40h40v4H30z" fill="%23fff"/></svg>`,
        status: 'active',
        actions: ['ptt', 'audio', 'video'],
        isBackOffice: true
      },
      {
        id: '102',
        name: 'FlyDnA Travel Agent',
        role: 'Lobby Agent · Travel Desk',
        avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23059669"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23g2)"/><path d="M35 50a15 15 0 1 0 30 0 15 15 0 1 0-30 0zm20-25l-8 15h16l-8-15zm-20 20l15-8v16l-15-8z" fill="%23fff"/></svg>`,
        status: 'active',
        actions: ['ptt', 'audio', 'video'],
        isBackOffice: true
      },
      {
        id: '103',
        name: 'FlyDnA Tech Support',
        role: 'Security · Operations',
        avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23g3)"/><path d="M50 20c-16.5 0-30 13.5-30 30s13.5 30 30 30 30-13.5 30-30-13.5-30-30-30zm0 18c6.6 0 12 5.4 12 12s-5.4 12-12 12-12-5.4-12-12 5.4-12 12-12z" fill="%23fff"/></svg>`,
        status: 'active',
        actions: ['ptt', 'audio', 'video'],
        isBackOffice: true
      },
      {
        id: '104',
        name: 'FlyDnA Dispatcher',
        role: 'Tactical · Network Hub',
        avatar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%237c3aed"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(%23g4)"/><circle cx="50" cy="50" r="16" stroke="%23fff" stroke-width="2" fill="none"/><line x1="50" y1="10" x2="50" y2="90" stroke="%23fff" stroke-width="2"/><line x1="10" y1="50" x2="90" y2="50" stroke="%23fff" stroke-width="2"/></svg>`,
        status: 'standby',
        actions: ['ptt', 'audio'],
        isBackOffice: true
      }
    ]

    // 2. Fetch other real database contacts dynamically
    const [realContacts, setRealContacts] = useState<any[]>([])
    useEffect(() => {
      const sync = () => {
        const list = ChatManager.getContacts()
          .filter(c => !['101', '102', '103'].includes(c.id))
          .map(c => ({
            id: c.id,
            name: c.name,
            role: c.position || 'Traveler',
            avatar: c.avatarUrl || '',
            status: c.status === 'Online' ? 'active' : 'offline',
            actions: ['ptt', 'audio', 'video'],
            isBackOffice: false
          }))
        setRealContacts(list)
      }
      sync()
      return ChatManager.subscribe(sync)
    }, [])

    const contacts = [...backOfficeContacts, ...realContacts]

    return (
      <div className="p-4 w-[300px]">
        <p className="text-foreground text-xs font-semibold mb-2.5 tracking-wider uppercase">System Telephony</p>
        <p className="text-muted-foreground text-[10px] mb-3 tracking-wide">Select Contact &amp; Start Call / PTT</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
          {contacts.map((c, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--sidebar-accent)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '8px 10px',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', marginRight: '6px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {c.avatar ? (
                    <img src={c.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg,#0a1931,#15305b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: c.status === 'active' ? '#10b981' : c.status === 'standby' ? '#f59e0b' : '#ef4444',
                    border: '1.5px solid var(--bg-app)'
                  }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.role}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {c.status !== 'offline' ? (
                  <>
                    {c.actions.includes('ptt') && (
                      <button onClick={() => {
                        if (c.isBackOffice) {
                          handleAction('ptt', c.id)
                        } else {
                          startPTT(c.id)
                        }
                      }} title="PTT Call" style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f59e0b' }}>🎙️</button>
                    )}
                    {c.actions.includes('audio') && (
                      <button onClick={() => {
                        if (c.isBackOffice) {
                          handleAction('audio', c.id)
                        } else {
                          const socket = ChatManager.getSocket()
                          socket?.emit('initiateCall', { toUser: c.id, isVideoEnabled: false })
                        }
                      }} title="Audio Call" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#10b981' }}>📞</button>
                    )}
                    {c.actions.includes('video') && (
                      <button onClick={() => {
                        if (c.isBackOffice) {
                          handleAction('video', c.id)
                        } else {
                          const socket = ChatManager.getSocket()
                          socket?.emit('initiateCall', { toUser: c.id, isVideoEnabled: true })
                        }
                      }} title="FaceTime Call" style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '6px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#06b6d4' }}>📹</button>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Offline</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (id === 'garage') return (
    <div className="p-1 w-64">
      <NascDigitalGarage />
    </div>
  )

  if (id === 'trips') return (
    <div className="p-4 w-64">
      <p className="text-foreground text-xs font-semibold mb-2.5 tracking-wider uppercase">Upcoming Trips</p>
      <p className="text-muted-foreground text-[10px] mb-2.5 tracking-wide uppercase">Booked</p>
      <div className="bg-white/5 border border-l-2 border-l-amber-500 border-white/10 rounded-lg p-2 mb-2 hover:bg-white/10 hover:-translate-y-0.5 transition-all cursor-pointer">
        <p className="text-xs text-foreground tracking-wider font-semibold">ATC Itinerary</p>
        <p className="text-xs text-muted-foreground">Jun 114 - Op ATL</p>
      </div>
      <div className="bg-white/5 border border-l-2 border-l-indigo-500 border-white/10 rounded-lg p-2 mb-2 hover:bg-white/10 hover:-translate-y-0.5 transition-all cursor-pointer">
        <p className="text-xs text-foreground tracking-wider font-semibold">Global Itinerary</p>
        <p className="text-xs text-muted-foreground">Jun 873 - Sol103</p>
      </div>
      <p className="text-muted-foreground text-[10px] mb-2.5 tracking-wide uppercase">Proposed</p>
      <div className="bg-white/5 border border-l-2 border-l-emerald-500 border-white/10 rounded-lg p-2 hover:bg-white/10 hover:-translate-y-0.5 transition-all cursor-pointer">
        <p className="text-xs text-foreground tracking-wider font-semibold">Proposed Itinerary</p>
        <p className="text-xs text-muted-foreground">TBD</p>
      </div>
    </div>
  )

  if (id === 'member') return (
    <div className="p-4 w-64">
      <p className="text-foreground text-xs font-semibold mb-2.5 tracking-wider uppercase">Member Info</p>
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-xs tracking-wider">Tier</span>
        <span className="text-amber-500 text-xs font-semibold tracking-widest uppercase">Platinum</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-xs tracking-wider">DNA Points</span>
        <span className="text-foreground text-xs font-semibold">142,500</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-muted-foreground text-xs tracking-wider">Trips (2026)</span>
        <span className="text-foreground text-xs font-semibold">7</span>
      </div>
      <p className="text-muted-foreground text-xs tracking-wider mb-1">Next Tier</p>
      <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
        <div className="bg-gradient-to-r from-amber-500 to-indigo-500 h-1.5 rounded-full" style={{ width: '71%' }} />
      </div>
      <p className="text-muted-foreground/60 text-[10px]">71% · 57,500 pts to Diamond</p>
    </div>
  )

  return null
}

// ── Main component ─────────────────────────────────────────────────────────────
interface NascArcMenuProps {
  visibleLayers: Set<string>
  onToggleLayer: (layer: string) => void
  onStateSelect: (state: string) => void
}

export default function NascArcMenu({ visibleLayers, onToggleLayer, onStateSelect }: NascArcMenuProps) {
  const [active, setActive] = useState<PID | null>(null)
  const [open, setOpen] = useState(true)

  const CONTAINER_W = 900   // wide enough to hold the full arc spread
  const BASE = 20           // px from screen bottom to the lowest arc point

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${CONTAINER_W}px`,
        height: '420px',
        zIndex: 30,
      }}
    >
      {/* ── Arc track SVG ── */}
      {open && (
        <svg
          style={{ position: 'absolute', bottom: BASE, left: 0, width: '100%', height: `${MAX_DROP + BTN + 4}px`, overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="arcTrack" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {(() => {
            const cx = CONTAINER_W / 2
            const l = POS[0], r = POS[N - 1]
            const x1 = cx + l.x, y1 = l.y
            const x2 = cx + r.x, y2 = r.y
            return (
              <path
                d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke="url(#arcTrack)"
                strokeWidth="1.5"
                filter="url(#arcGlow)"
              />
            )
          })()}
          {ITEMS.map((item, i) => {
            const cx = CONTAINER_W / 2
            const dotX = cx + POS[i].x
            const dotY = MAX_DROP + BTN / 2 + 18
            return (
              <circle
                key={item.id}
                cx={dotX} cy={dotY} r={active === item.id ? 4 : 2.5}
                fill={active === item.id ? item.color : 'rgba(255,255,255,0.2)'}
                style={{ transition: 'all 0.3s' }}
              />
            )
          })}
        </svg>
      )}

      {/* ── Icon Buttons ── */}
      {open && ITEMS.map((item, i) => {
        const isActive = active === item.id
        const pos = POS[i]
        const btnLeft = CONTAINER_W / 2 + pos.x - BTN / 2
        const btnBottom = BASE + (MAX_DROP - pos.y)

        return (
          <div 
            key={item.id} 
            onMouseLeave={() => { if (isActive) setActive(null) }}
            style={{ position: 'absolute', left: btnLeft, bottom: btnBottom, pointerEvents: 'auto' }}
          >

            {/* ── Popup panel — appears above button ── */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: BTN,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  paddingBottom: '16px', // Invisible bridge to prevent accidental hover close
                  zIndex: 40,
                  pointerEvents: 'auto',
                }}
              >
                <div
                  className="glass-panel-heavy"
                  style={{
                    borderRadius: '16px',
                    minWidth: '220px',
                    animation: 'arcPanelIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <PanelContent
                    id={item.id}
                    visibleLayers={visibleLayers}
                    onToggleLayer={onToggleLayer}
                    onStateSelect={onStateSelect}
                  />
                </div>
              </div>
            )}

            {/* ── The button itself ── */}
            <button
              onClick={() => setActive(isActive ? null : item.id)}
              style={{
                width: BTN, height: BTN,
                borderRadius: '50%',
                border: `1.5px solid ${isActive ? item.color : 'rgba(255,255,255,0.15)'}`,
                background: isActive
                  ? `radial-gradient(circle at 40% 35%, ${item.color}28, var(--glass-panel-bg))`
                  : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.35))',
                boxShadow: isActive
                  ? `0 0 20px ${item.color}44, 0 0 40px ${item.color}20, inset 0 0 12px ${item.color}15`
                  : '0 4px 12px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                color: isActive ? item.color : 'var(--text-muted)',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                transform: isActive ? 'scale(1.18) translateY(-4px)' : 'scale(1)',
                outline: 'none',
                position: 'relative',
              }}
              title={item.label}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', inset: -6,
                  borderRadius: '50%',
                  border: `1px solid ${item.color}50`,
                  animation: 'arcRing 2s ease-in-out infinite',
                }} />
              )}
              {item.icon}
            </button>

            {/* Label below */}
            <div style={{
              position: 'absolute',
              top: BTN + 6,
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              fontSize: 9,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isActive ? item.color : 'var(--text-muted)',
              transition: 'color 0.2s',
              pointerEvents: 'none',
              fontWeight: isActive ? 700 : 500,
            }}>
              {item.label}
            </div>
          </div>
        )
      })}

      {/* ── Collapse / Expand toggle ── */}
      <button
        onClick={() => { setOpen(o => !o); setActive(null) }}
        className="glass-button text-muted-foreground hover:text-foreground font-semibold"
        style={{
          position: 'absolute',
          bottom: open ? BASE + MAX_DROP / 2 - 14 : 8,
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          borderRadius: 20,
          padding: '6px 16px',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.3s', fontSize: 10 }}>
          ▲
        </span>
        {open ? 'Collapse' : 'Perspective Selection'}
      </button>

      <style>{`
        @keyframes arcPanelIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.94); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }
        @keyframes arcRing {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.15; transform: scale(1.25); }
        }
      `}</style>
    </div>
  )
}
