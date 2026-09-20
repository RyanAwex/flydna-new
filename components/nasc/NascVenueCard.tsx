'use client'
import { useState } from 'react'

interface VenueCardProps {
  venueId: string | null
  onClose: () => void
}

type CardData = {
  heroImg: string
  name: string
  badges: string[]
  location: string
  description: string
  ctaLabel: string
  ctaUrl: string
  color: string
  logo: string
}

const CARD_DB: Record<string, CardData> = {
  // ── ATL ───────────────────────────────────────────────────────────────────
  'cosm': {
    heroImg: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=480&auto=format&fit=crop',
    name: 'Cosm Atlanta',
    badges: ['CONCERT', 'VENUE'],
    location: 'Atlanta, GA',
    description: '67-foot LED dome immersive entertainment venue at Centennial Yards. Home of Shared Reality sports and world-class entertainment experiences.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.cosm.com/atlanta',
    color: '#c084fc',
    logo: '/cosm_logo.png',
  },
  'mercedes-benz': {
    heroImg: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=480&auto=format&fit=crop',
    name: 'Mercedes-Benz Stadium',
    badges: ['FIFA WC 2026', 'NFL', 'MLS'],
    location: 'Atlanta, GA',
    description: 'State-of-the-art retractable-roof stadium hosting the Atlanta Falcons, Atlanta United FC, and the 2026 FIFA World Cup.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://mercedesbenzstadium.com',
    color: '#00ffff',
    logo: '/ATL_Falcons.png',
  },
  'atl-united': {
    heroImg: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=480&auto=format&fit=crop',
    name: 'Atlanta United FC',
    badges: ['FIFA WC 2026', 'MLS'],
    location: 'Atlanta, GA',
    description: 'Atlanta United FC at Mercedes-Benz Stadium — FIFA World Cup 2026 host venue. Feel the energy of the beautiful game.',
    ctaLabel: 'Match Tickets',
    ctaUrl: 'https://www.atlutd.com/tickets',
    color: '#00e5ff',
    logo: '/ATL_United-FC.png',
  },
  'state-farm': {
    heroImg: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=480&auto=format&fit=crop',
    name: 'State Farm Arena',
    badges: ['NBA', 'ATLANTA HAWKS'],
    location: 'Atlanta, GA',
    description: 'Premier NBA arena and home of the Atlanta Hawks. State-of-the-art entertainment district in the heart of downtown Atlanta.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.statefarmarena.com',
    color: '#00e5ff',
    logo: '/ATL_Hawks.png',
  },
  'truist-park': {
    heroImg: 'https://images.unsplash.com/photo-1562077772-3bd90403f7f0?w=480&auto=format&fit=crop',
    name: 'Truist Park',
    badges: ['MLB', 'ATLANTA BRAVES'],
    location: 'Cumberland, GA',
    description: 'Home of the Atlanta Braves, surrounded by The Battery Atlanta entertainment district. World-class baseball in suburban Atlanta.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.mlb.com/braves/tickets',
    color: '#CE1141',
    logo: '/ATL_Braves.png',
  },
  'cnn': {
    heroImg: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=480&auto=format&fit=crop',
    name: 'CNN Center',
    badges: ['NEWS', 'MEDIA', 'TOURS'],
    location: 'Atlanta, GA',
    description: 'Global headquarters of CNN, located in the heart of downtown Atlanta. Studio tours, live broadcasts, and history of journalism.',
    ctaLabel: 'Book a Tour',
    ctaUrl: 'https://www.cnn.com/studio-tours',
    color: '#FF0000',
    logo: '/CNN.png',
  },
  'nobu': {
    heroImg: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=480&auto=format&fit=crop',
    name: 'Nobu Hotel Atlanta',
    badges: ['LUXURY HOTEL', 'DINING'],
    location: 'Buckhead, Atlanta GA',
    description: 'World-renowned Nobu restaurant and luxury hotel in Buckhead. Michelin-starred Japanese cuisine and premium wellness experiences.',
    ctaLabel: 'Book a Stay',
    ctaUrl: 'https://www.nobuhotels.com/atlanta',
    color: '#e5c158',
    logo: '/nobu_logo.png',
  },
  'ponce-city': {
    heroImg: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=480&auto=format&fit=crop',
    name: 'Ponce City Market',
    badges: ['DINING', 'ROOFTOP', 'MARKET'],
    location: 'Old Fourth Ward, Atlanta GA',
    description: 'Vibrant food hall, retail, and rooftop entertainment in a beautifully restored Sears building. 9 Mile Station rooftop bar and games.',
    ctaLabel: 'Explore',
    ctaUrl: 'https://poncecitymarket.com',
    color: '#9b30ff',
    logo: '/Ponce_City-Market.png',
  },
  'pete-petit': {
    heroImg: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=480&auto=format&fit=crop',
    name: 'Center Parc Stadium',
    badges: ['NCAA', 'GA PANTHERS'],
    location: 'Downtown Atlanta, GA',
    description: 'Home of the Georgia State Panthers football team, built on the site of the historic Atlanta-Fulton County Stadium.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.gsuathletics.com/tickets',
    color: '#0055ff',
    logo: '/GA_Panthers.png',
  },
  'hartsfield': {
    heroImg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=480&auto=format&fit=crop',
    name: 'Hartsfield-Jackson ATL',
    badges: ["WORLD'S BUSIEST AIRPORT", 'DELTA HUB'],
    location: 'Atlanta, GA',
    description: "The world's busiest airport and Delta Air Lines' main hub. Gateway to the American South and over 150 international destinations.",
    ctaLabel: 'Book a Flight',
    ctaUrl: 'https://www.delta.com',
    color: '#4A8FFF',
    logo: '/Delta.png',
  },

  // ── NYC ───────────────────────────────────────────────────────────────────
  'msg': {
    heroImg: 'https://images.unsplash.com/photo-1504203700686-f21e703e5f1c?w=480&auto=format&fit=crop',
    name: 'Madison Square Garden',
    badges: ['NBA', 'NHL', 'CONCERTS'],
    location: 'Midtown Manhattan, NY',
    description: 'The most famous arena in the world. Home of the 2026 NBA Champion New York Knicks and the New York Rangers.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.msg.com',
    color: '#f97316',
    logo: '/knick_Logo.png',
  },
  'yankee': {
    heroImg: 'https://images.unsplash.com/photo-1540553016722-983e8ba13b02?w=480&auto=format&fit=crop',
    name: 'Yankee Stadium',
    badges: ['MLB', 'NEW YORK YANKEES'],
    location: 'The Bronx, NY',
    description: 'Cathedral of baseball. Home of the most successful franchise in MLB history with 27 World Series championships.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.mlb.com/yankees/tickets',
    color: '#1a3a6b',
    logo: '/YankeeLogo.png',
  },
  'citi': {
    heroImg: 'https://images.unsplash.com/photo-1540553016722-983e8ba13b02?w=480&auto=format&fit=crop',
    name: 'Citi Field',
    badges: ['MLB', 'NEW YORK METS'],
    location: 'Flushing, Queens NY',
    description: 'Home of the New York Mets. A modern ballpark in the heart of Queens with stunning views and world-class amenities.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.mlb.com/mets/tickets',
    color: '#003087',
    logo: '/NY_Mets_Logo.png',
  },
  'metlife': {
    heroImg: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=480&auto=format&fit=crop',
    name: 'MetLife Stadium',
    badges: ['NFL', 'GIANTS', 'JETS'],
    location: 'East Rutherford, NJ',
    description: 'Home of both the New York Giants and New York Jets. One of the largest NFL stadiums in the country with 82,500 seats.',
    ctaLabel: 'Get Tickets',
    ctaUrl: 'https://www.metlifestadium.com',
    color: '#0033a0',
    logo: '/NY_Giants.png',
  },
  'lga': {
    heroImg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=480&auto=format&fit=crop',
    name: 'LaGuardia Airport',
    badges: ['AIRPORT', 'NEW TERMINAL'],
    location: 'Queens, NY',
    description: 'Completely rebuilt LaGuardia — now one of America\'s most modern airport terminals with premium dining and retail.',
    ctaLabel: 'Book a Flight',
    ctaUrl: 'https://www.laguardiaairport.com',
    color: '#00aaff',
    logo: '/JFK.png',
  },
  'jfk': {
    heroImg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=480&auto=format&fit=crop',
    name: 'JFK International Airport',
    badges: ['INT\'L AIRPORT', 'NYC'],
    location: 'Jamaica, Queens NY',
    description: 'New York\'s primary international gateway. Over 90 airlines connecting NYC to 180+ destinations worldwide.',
    ctaLabel: 'Book a Flight',
    ctaUrl: 'https://www.jfkairport.com',
    color: '#00aaff',
    logo: '/JFK.png',
  },
}

const DEFAULT_CARD: CardData = {
  heroImg: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=480&auto=format&fit=crop',
  name: 'FlyDnA NASC',
  badges: ['LIVE NOW', 'NETWORK'],
  location: 'Network Activity Sensing Center',
  description: 'Click any venue marker on the map to load its live channel, tickets, and AI concierge options.',
  ctaLabel: 'Explore Map',
  ctaUrl: '#',
  color: '#00e5ff',
  logo: '/logo.png',
}

export default function NascVenueCard({ venueId, onClose }: VenueCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const data = (venueId && CARD_DB[venueId]) || DEFAULT_CARD

  return (
    <div className="glass-panel-heavy" style={{
      position: 'relative',
      width: 320,
      borderRadius: 16,
      overflow: 'hidden',
      animation: 'vcardIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
    }}>
      <style>{`
        @keyframes vcardIn {
          from { opacity:0; transform:translateY(-12px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes vcardShimmer {
          from { transform:translateX(-100%); }
          to   { transform:translateX(100%); }
        }
      `}</style>

      {/* Hero image */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden', background: '#0a0518' }}>
        {!imgLoaded && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, #0a0518 0%, #1a0a40 50%, #0a0518 100%)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
              animation: 'vcardShimmer 1.4s infinite',
            }} />
          </div>
        )}
        <img
          src={data.heroImg}
          alt={data.name}
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.4s',
            filter: 'brightness(0.82) saturate(1.15)',
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.8) 100%)',
        }} />
        {/* Logo badge */}
        <div style={{
          position: 'absolute', bottom: 10, left: 12,
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--glass-panel-bg)', border: `1.5px solid ${data.color}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px ${data.color}22`,
        }}>
          <img src={data.logo} style={{ width: 26, height: 26, objectFit: 'contain' }} />
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 12,
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)', borderRadius: '50%',
            width: 26, height: 26, cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
        >×</button>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {data.badges.map(b => (
            <span key={b} style={{
              padding: '2px 8px', borderRadius: 20,
              background: 'var(--sidebar-accent)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
            }}>{b}</span>
          ))}
        </div>

        {/* Venue name */}
        <div style={{ color: 'var(--text-main)', fontSize: 16, fontWeight: 700, letterSpacing: '0.02em', marginBottom: 5 }}>
          {data.name}
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <span style={{ color: data.color, fontSize: 11 }}>📍</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{data.location}</span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 10 }} />

        {/* Description */}
        <p style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.6, margin: '0 0 14px' }}>
          {data.description}
        </p>

        {/* CTA */}
        <button
          onClick={() => data.ctaUrl !== '#' && window.open(data.ctaUrl, '_blank', 'noopener,noreferrer')}
          className="glass-button text-foreground hover:text-foreground font-semibold text-xs py-2.5 rounded-lg w-full tracking-wider cursor-pointer"
        >
          {data.ctaLabel}
        </button>
      </div>
    </div>
  )
}
