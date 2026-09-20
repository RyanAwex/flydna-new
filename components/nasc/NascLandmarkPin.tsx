'use client'
import { useState } from 'react'

const venueLinks: Record<string, string> = {
    msg: 'https://www.msg.com',
    jfk: 'https://www.jfkairport.com',
    lga: 'https://www.laguardiaairport.com',
    ewr: 'https://www.newarkairport.com',
    yankee: 'https://www.mlb.com/yankees/ballpark',
    citi: 'https://www.mlb.com/mets/citi-field',
    barclays: 'https://www.barclayscenter.com',
    metlife: 'https://www.metlifestadium.com',
    redbull: 'https://www.redbullarena.com',
    ubs: 'https://www.ubsarena.com',
}

const venueDetails: Partial<Record<string, { type: string; capacity: string; team: string }>> = {
    msg: { type: 'Arena', capacity: '20,789', team: 'Knicks · Rangers' },
    jfk: { type: 'International Airport', capacity: '6 Terminals', team: '90+ Airlines' },
    lga: { type: 'Domestic Airport', capacity: '4 Terminals', team: '30+ Airlines' },
    ewr: { type: 'International Airport', capacity: '3 Terminals', team: '50+ Airlines' },
    yankee: { type: 'Baseball Stadium', capacity: '46,537', team: 'NY Yankees' },
    citi: { type: 'Baseball Stadium', capacity: '41,922', team: 'NY Mets' },
    barclays: { type: 'Arena', capacity: '19,000', team: 'Nets · Islanders' },
    metlife: { type: 'Football Stadium', capacity: '82,500', team: 'Giants · Jets' },
    redbull: { type: 'Soccer Stadium', capacity: '25,000', team: 'NY Red Bulls' },
    ubs: { type: 'Arena', capacity: '19,000', team: 'NY Islanders' },
}

interface LandmarkPinProps {
    name: string
    subtitle?: string
    onClick: () => void
    id?: string
}

export default function NascLandmarkPin({ name, subtitle, onClick, id = '' }: LandmarkPinProps) {
    const [open, setOpen] = useState(false)
    const details = venueDetails[id]
    const link = venueLinks[id]

    const handleClick = () => {
        setOpen((prev) => !prev)
        onClick()
    }

    return (
        <div style={{ position: 'relative', width: 0, height: 0 }}>
            <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes cardIn {
          from { opacity:0; transform: translateY(-10px) scale(0.95); }
          to   { opacity:1; transform: translateY(0px) scale(1); }
        }
        @keyframes lineGrow {
          from { stroke-dashoffset: 200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes scanline {
          0%   { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>

            {/* Pulsing dot */}
            <div
                onClick={handleClick}
                style={{
                    position: 'absolute', top: -5, left: -5,
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: '#00ffff',
                    boxShadow: open ? '0 0 14px #00ffff' : '0 0 6px rgba(0,255,255,0.5)',
                    animation: 'pulse 1.5s infinite',
                    cursor: 'pointer', pointerEvents: 'auto',
                    transition: 'background-color 0.3s, box-shadow 0.3s',
                    zIndex: 10,
                }}
            />

            {/* Connector line */}
            {open && details && (
                <svg
                    style={{
                        position: 'absolute',
                        top: -220,
                        left: 0,
                        width: '150px',
                        height: '220px',
                        pointerEvents: 'none',
                        zIndex: 9,
                        overflow: 'visible'
                    }}
                >
                    <path
                        d="M 0,225 L 45,110 L 150,110"
                        fill="none"
                        stroke="#00ffff"
                        strokeWidth="1.5"
                        strokeDasharray="200"
                        strokeDashoffset="200"
                        style={{
                            animation: 'lineGrow 0.3s ease forwards',
                            filter: 'drop-shadow(0 0 6px #00ffff)'
                        }}
                    />
                    <circle cx="150" cy="110" r="2" fill="#00ffff" style={{ filter: 'drop-shadow(0 0 4px #00ffff)' }} />
                </svg>
            )}

            {/* CYBERPUNK POPUP CARD */}
            
            {open && details && (
                <div style={{
                    position: 'absolute',
                    top: -220,
                    left: 150,
                    width: '220px',
                    backgroundColor: 'rgba(6,0,20,0.92)',
                    border: '1px solid #00ffff',
                    borderLeft: '3px solid #00ffff',
                    boxShadow: '0 0 24px rgba(0,255,255,0.3), inset 0 0 20px rgba(0,255,255,0.04)',
                    animation: 'cardIn 0.25s ease forwards',
                    pointerEvents: 'auto',
                    zIndex: 999,
                    overflow: 'hidden',
                }}>
                    {/* Scanline effect */}
                    <div style={{
                        position: 'absolute', left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.4), transparent)',
                        animation: 'scanline 2.5s linear infinite',
                        pointerEvents: 'none', zIndex: 1,
                    }} />

                    {/* Cyber corner accents */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderTop: '2px solid #00ffff', borderRight: '2px solid #00ffff' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, borderBottom: '2px solid #00ffff', borderLeft: '2px solid #00ffff' }} />

                    {/* Animated connection line from label to card */}
                    <svg style={{ position: 'absolute', top: 100, left: -90, width: 90, height: 2, overflow: 'visible', pointerEvents: 'none' }}>
                        <line x1="0" y1="1" x2="90" y2="1"
                            stroke="#00ffff" strokeWidth="1.5" strokeDasharray="200"
                            style={{ animation: 'lineGrow 0.4s ease forwards' }}
                        />
                    </svg>

                    {/* Header */}
                    <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid rgba(0,255,255,0.2)' }}>
                        <div style={{ color: '#00ffff', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                            {subtitle}
                        </div>
                        <div style={{ color: 'rgba(0,255,255,0.5)', fontSize: '9px', letterSpacing: '0.2em', marginTop: 2 }}>
                            {details.type}
                        </div>
                    </div>
                    
                        {/* CTA Button */}
                        <div style={{ padding: '6px 12px 10px' }}>
                            <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block', textAlign: 'center',
                                    padding: '7px 0',
                                    border: '1px solid #00ffff',
                                    color: '#00ffff',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    textDecoration: 'none',
                                    backgroundColor: 'rgba(0,255,255,0.08)',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,255,0.2)')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(0,255,255,0.08)')}
                            >
                                Access Venue ↗
                            </a>
                        </div>

                        {/* Close */}
                        <div
                            onClick={() => setOpen(false)}
                            style={{
                                position: 'absolute', top: 6, right: 10,
                                color: 'rgba(0,255,255,0.4)', fontSize: '14px',
                                cursor: 'pointer', lineHeight: 1,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#00ffff')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,255,255,0.4)')}
                        >
                            ×
                        </div>
                </div>
            )}
        </div>
    )
}


