'use client'

import { useEffect, useState, useRef } from 'react'
import { Marker, Source, Layer, useMap } from 'react-map-gl/mapbox'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
type Pt = [number, number]

// ── Venue data per city ───────────────────────────────────────────────────────
interface Venue {
  name: string
  type: 'bar' | 'restaurant' | 'shop' | 'entertainment'
  rating: number
  price: string
  distance: string
  sponsored?: boolean
  mapsId?: string
}
const VENUES: Record<string, Venue[]> = {
  Atlanta: [
    { name: 'Ponce City Market',     type: 'shop',          rating: 4.7, price: '$$',  distance: '0.4 mi', sponsored: true },
    { name: 'The Optimist',          type: 'restaurant',    rating: 4.6, price: '$$$', distance: '0.9 mi' },
    { name: 'Staplehouse',           type: 'restaurant',    rating: 4.9, price: '$$$', distance: '0.8 mi' },
    { name: 'Octane Coffee Bar',     type: 'bar',           rating: 4.5, price: '$$',  distance: '1.2 mi' },
    { name: 'The Clermont Lounge',   type: 'entertainment', rating: 4.3, price: '$$',  distance: '1.4 mi' },
    { name: 'Bellwood Coffee',       type: 'bar',           rating: 4.4, price: '$$',  distance: '1.5 mi' },
    { name: 'Trader Joe\'s Midtown', type: 'shop',          rating: 4.6, price: '$$',  distance: '1.1 mi', sponsored: true },
    { name: 'Ebrik Coffee Room',     type: 'bar',           rating: 4.8, price: '$',   distance: '0.6 mi' },
  ],
  'New York': [
    { name: 'Employees Only',  type: 'bar',           rating: 4.6, price: '$$$', distance: '0.3 mi' },
    { name: 'Di Fara Pizza',   type: 'restaurant',    rating: 4.7, price: '$$',  distance: '0.8 mi' },
    { name: 'The Dead Rabbit', type: 'bar',           rating: 4.8, price: '$$$', distance: '1.1 mi' },
    { name: 'Eataly NYC',      type: 'restaurant',    rating: 4.5, price: '$$$', distance: '0.5 mi', sponsored: true },
    { name: 'House of Yes',    type: 'entertainment', rating: 4.7, price: '$$',  distance: '1.4 mi' },
    { name: 'Katz\'s Deli',    type: 'restaurant',    rating: 4.8, price: '$$',  distance: '0.9 mi' },
    { name: 'Tiffany & Co.',   type: 'shop',          rating: 4.4, price: '$$$', distance: '0.7 mi', sponsored: true },
    { name: 'Brooklyn Bowl',   type: 'entertainment', rating: 4.6, price: '$$',  distance: '1.6 mi' },
  ],
  Florida: [
    { name: 'Wynwood Walls',  type: 'entertainment', rating: 4.7, price: '$',   distance: '0.4 mi' },
    { name: 'Ball & Chain',   type: 'bar',           rating: 4.5, price: '$$',  distance: '0.6 mi' },
    { name: 'KYU Miami',      type: 'restaurant',    rating: 4.8, price: '$$$', distance: '1.0 mi', sponsored: true },
    { name: 'Sugar Miami',    type: 'bar',           rating: 4.5, price: '$$$', distance: '0.9 mi' },
    { name: 'Zak the Baker',  type: 'restaurant',    rating: 4.7, price: '$$',  distance: '0.8 mi' },
    { name: 'Lokal Wynwood',  type: 'bar',           rating: 4.6, price: '$$',  distance: '1.2 mi' },
  ],
  Texas: [
    { name: 'Franklin Barbecue', type: 'restaurant',    rating: 4.9, price: '$$',  distance: '0.7 mi' },
    { name: 'Rainey St. Bars',   type: 'bar',           rating: 4.6, price: '$$',  distance: '0.3 mi' },
    { name: '6th Street',        type: 'entertainment', rating: 4.5, price: '$$',  distance: '0.5 mi' },
    { name: 'Uchiko',            type: 'restaurant',    rating: 4.9, price: '$$$', distance: '1.1 mi', sponsored: true },
    { name: 'Contigo ATX',       type: 'restaurant',    rating: 4.7, price: '$$',  distance: '0.9 mi' },
    { name: 'Whole Foods Domain',type: 'shop',          rating: 4.4, price: '$$',  distance: '1.2 mi', sponsored: true },
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getHaversineDistance(pt1: Pt, pt2: Pt): number {
  const R = 3958.8
  const lat1 = (pt1[1] * Math.PI) / 180, lat2 = (pt2[1] * Math.PI) / 180
  const dLat = ((pt2[1] - pt1[1]) * Math.PI) / 180, dLon = ((pt2[0] - pt1[0]) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function getMidpoint(coords: Pt[]): Pt {
  return coords.length === 0 ? [0, 0] : coords[Math.floor(coords.length / 2)]
}
function getCityFromLoc(loc: string): string {
  const l = loc.toLowerCase()
  if (l.includes('atlanta') || l.includes('buckhead') || l.includes('midtown')) return 'Atlanta'
  if (l.includes('manhattan') || l.includes('brooklyn') || l.includes('new york')) return 'New York'
  if (l.includes('miami') || l.includes('florida')) return 'Florida'
  if (l.includes('austin') || l.includes('texas')) return 'Texas'
  return 'Atlanta'
}

// ── MapCallerCard — exact v1 design ──────────────────────────────────────────
function MapCallerCard({ name, avatar, location, delay, onHangup }: {
  name: string; avatar?: string; location: string; delay: number; onHangup?: () => void
}) {
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isSpkMuted, setIsSpkMuted] = useState(false)
  const [imgError, setImgError] = useState(false)
  const initial = name ? name.charAt(0).toUpperCase() : '?'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '180px',
      background: 'rgba(6, 12, 32, 0.9)', border: '1.5px solid rgba(0, 229, 255, 0.35)',
      borderRadius: '12px', padding: '8px 12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 10px rgba(0,229,255,0.1)',
      fontFamily: 'monospace', color: '#fff', userSelect: 'none',
      position: 'relative', transform: 'translateY(-10px)',
      pointerEvents: 'auto',
    }}>
      <style>{`@keyframes miniVoiceWave{0%,100%{transform:scaleY(0.25)}50%{transform:scaleY(1)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        {!avatar || imgError ? (
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #00e5ff', background: 'linear-gradient(135deg,#12002b,#3a006f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: '#00e5ff', flexShrink: 0 }}>{initial}</div>
        ) : (
          <img src={avatar} onError={() => setImgError(true)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #00e5ff', objectFit: 'cover', flexShrink: 0 }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span style={{ fontSize: 8, color: 'rgba(0,229,255,0.7)' }}>{location}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
        <div style={{ display: 'flex', gap: '1.5px', height: 8, alignItems: 'center' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 1.5, height: 6, background: '#00e5ff', animation: `miniVoiceWave ${[0.4,0.6,0.5,0.7,0.4,0.5][i]}s infinite ease-in-out alternate`, animationDelay: `${delay + i * 0.05}s` }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={e => { e.stopPropagation(); setIsMicMuted(m => !m) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isMicMuted ? '#ef4444' : '#00e5ff'} strokeWidth="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); setIsSpkMuted(s => !s) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isSpkMuted ? '#ef4444' : '#00e5ff'} strokeWidth="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); e.preventDefault(); onHangup?.() }}
            style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(6,12,32,0.9)' }} />
    </div>
  )
}

// ── Route Menu Card — 3 tabs: Route | Traffic | Venues ────────────────────────
type TabId = 'route' | 'traffic' | 'venues'
type VenueFilter = 'all' | 'bar' | 'restaurant' | 'shop' | 'entertainment'

const VENUE_ICONS: Record<string, string> = { bar: '🍺', restaurant: '🍽️', shop: '🏪', entertainment: '🎵' }
const TRAFFIC_COLORS: Record<string, string> = { light: '#10b981', moderate: '#f59e0b', heavy: '#ef4444' }
const TRAFFIC_LABELS: Record<string, string> = { light: '🟢 Light', moderate: '🟡 Moderate', heavy: '🔴 Heavy' }

// Helper to get deterministic lat/lng coordinates for a venue relative to callerA (the local center)
function getVenueCoords(venueName: string, center: Pt): Pt {
  let hash = 0
  for (let i = 0; i < venueName.length; i++) {
    hash = venueName.charCodeAt(i) + ((hash << 5) - hash)
  }
  // Generate random-like offset between -0.012 and +0.012 degrees (~1.2 km)
  const offsetLng = ((hash % 100) / 100) * 0.02 - 0.01
  const offsetLat = (((hash >> 8) % 100) / 100) * 0.02 - 0.01
  return [center[0] + offsetLng, center[1] + offsetLat]
}

// ── Interactive Venue Marker on Map ──
function RouteVenueMarker({ venue, cityCenter, isBeamed, onToggleBeam, city }: {
  venue: Venue; cityCenter: Pt; isBeamed: boolean; onToggleBeam: () => void; city: string
}) {
  const coords = getVenueCoords(venue.name, cityCenter)
  const color = venue.sponsored ? '#a855f7' : '#00e5ff'
  const emoji = VENUE_ICONS[venue.type] || '📍'

  return (
    <Marker longitude={coords[0]} latitude={coords[1]} anchor="bottom" pitchAlignment="viewport" rotationAlignment="viewport">
      <div style={{ position: 'relative', width: 0, height: 0, pointerEvents: 'auto' }}>
        <svg style={{ position: 'absolute', bottom: 0, left: -40, pointerEvents: 'none', overflow: 'visible' }} width="80" height="180">
          <defs>
            <radialGradient id={`spot-venue-${venue.name.replace(/[^a-zA-Z]/g, '')}`} cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
            <filter id={`glow-venue-${venue.name.replace(/[^a-zA-Z]/g, '')}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Spotlight Cone when clicked */}
          <g style={{
            opacity: isBeamed ? 1 : 0,
            transform: `scaleY(${isBeamed ? 1 : 0})`,
            transformOrigin: '40px 180px',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <path d="M 40,180 L 0,-10 L 80,-10 Z" fill={`url(#spot-venue-${venue.name.replace(/[^a-zA-Z]/g, '')})`} />
            <line x1="40" y1="180" x2="40" y2="40" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" />
            <text x="40" y="-15" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ letterSpacing: '0.08em', filter: `drop-shadow(0 0 4px ${color})` }}>{venue.name}</text>
            <text x="40" y="-5" fill={color} fontSize="7" fontWeight="bold" textAnchor="middle" style={{ letterSpacing: '0.12em' }}>{venue.distance} away · {venue.price}</text>
          </g>

          {/* Floating Marker Circle */}
          <g 
            onClick={(e) => { e.stopPropagation(); onToggleBeam() }}
            style={{
              cursor: 'pointer',
              pointerEvents: 'auto',
              transform: `translateY(${isBeamed ? 0 : 130}px) scale(${isBeamed ? 1.1 : 0.85})`,
              transformOrigin: '40px 40px',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <circle cx="40" cy="40" r="16" fill="rgba(6,12,32,0.9)" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
            <text x="40" y="45" fontSize="13" textAnchor="middle">{emoji}</text>
          </g>

          {/* Base point */}
          <circle cx="40" cy="180" r="3.5" fill={color} opacity={isBeamed ? 1 : 0} style={{ transition: 'opacity 0.3s' }} />
        </svg>

        {/* Dynamic Detail Card — similar to NascLandmarkPin popup */}
        {isBeamed && (
          <div
            className="glass-panel-heavy"
            style={{
              position: 'absolute',
              bottom: 90,
              left: 40,
              width: '200px',
              padding: '12px',
              borderRadius: '12px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'cardSlideIn 0.25s ease forwards',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {venue.type}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleBeam() }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
              >✕</button>
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{venue.name}</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>📍 {venue.distance} away</span>
              <span style={{ color: '#fbbf24' }}>★ {venue.rating}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(`https://www.google.com/maps/search/${encodeURIComponent(venue.name + ' ' + city)}`)
                }}
                className="glass-button text-[9px] py-1 px-2 rounded flex-1 text-center"
              >
                Directions 🗺️
              </button>
              {venue.sponsored && (
                <span style={{ fontSize: 8, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                  PARTNER
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Marker>
  )
}

function RouteMenuCard({ distance, callerA, callerB, callerALoc, callerBLoc, onClose, venueFilter, setVenueFilter, beamedVenueName, onVenueSelect }: {
  distance: number; callerA: Pt; callerB: Pt
  callerALoc: string; callerBLoc: string; onClose: () => void
  venueFilter: VenueFilter; setVenueFilter: (f: VenueFilter) => void
  beamedVenueName: string | null; onVenueSelect: (v: Venue) => void
}) {
  const [tab, setTab] = useState<TabId>('route')
  const [activeOption, setActiveOption] = useState<'list' | 'drive' | 'transit' | 'taxi'>('list')
  const [driveSteps, setDriveSteps] = useState<string[]>([])
  const [uberConnected, setUberConnected] = useState(false)
  const [lyftConnected, setLyftConnected] = useState(false)

  const city = getCityFromLoc(callerALoc)
  const venues = (VENUES[city] ?? VENUES.Atlanta).filter(v => venueFilter === 'all' || v.type === venueFilter)

  // Fetch driving directions steps
  useEffect(() => {
    if (activeOption !== 'drive') return
    let cancelled = false
    ;(async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${callerA[0]},${callerA[1]};${callerB[0]},${callerB[1]}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`
      try {
        const j = await (await fetch(url)).json()
        const steps = j.routes?.[0]?.legs?.[0]?.steps?.map((s: any) => s.maneuver?.instruction) || []
        if (!cancelled) {
          setDriveSteps(steps.length > 0 ? steps : ['Proceed to destination'])
        }
      } catch {
        if (!cancelled) {
          setDriveSteps(['Head toward destination on local roads', 'Arrive at destination'])
        }
      }
    })()
    return () => { cancelled = true }
  }, [callerA, callerB, activeOption])

  // Traffic simulation based on time of day
  const hour = new Date().getHours()
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)
  const isOffPeak = hour < 7 || hour > 20
  const trafficLevel = isRushHour ? 'heavy' : isOffPeak ? 'light' : 'moderate'
  const delay   = { light: 2, moderate: 8, heavy: 22 }[trafficLevel]
  const avgSpeed= { light: 45, moderate: 28, heavy: 13 }[trafficLevel]
  const incidents = { light: 0, moderate: 1, heavy: 3 }[trafficLevel]

  const distanceKm = (distance * 1.60934).toFixed(1)
  const isLong = distance > 250

  const cleanFrom = callerALoc.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()
  const cleanTo   = callerBLoc.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim()

  const driveHrs = isLong ? (distance * 1.15) / 60 : (distance * 1.15) / 35
  const driveH = Math.floor(driveHrs), driveM = Math.round((driveHrs - driveH) * 60)
  const driveText = driveH > 0 ? `${driveH}h ${driveM}m` : `${driveM}m`

  const rideHrs = isLong ? (distance * 1.1) / 55 : (distance * 1.1) / 28
  const rideH = Math.floor(rideHrs), rideM = Math.round((rideHrs - rideH) * 60)
  const rideText = rideH > 0 ? `${rideH}h ${rideM}m` : `${rideM}m`

  const walkHrs = distance / 3.0
  const walkH = Math.floor(walkHrs), walkM = Math.round((walkHrs - walkH) * 60)
  const walkText = isLong ? 'very long time' : (walkH > 0 ? `${walkH}h ${walkM}m` : `${walkM}m`)

  const flightHrs = distance / 500 + 1
  const flightH = Math.floor(flightHrs), flightM = Math.round((flightHrs - flightH) * 60)
  const flightText = `${flightH}h ${flightM}m`

  const mapsBase = `https://www.google.com/maps/dir/?api=1&origin=${callerA[1]},${callerA[0]}&destination=${callerB[1]},${callerB[0]}`
  const trafficUrl = `${mapsBase}&travelmode=driving`

  const transitOptions: Record<string, { line: string; time: string; type: string }[]> = {
    Atlanta: [
      { line: '🚇 MARTA Red Line (Northbound)', time: '18 min', type: 'Subway' },
      { line: '🚌 MARTA Bus 110 (Peachtree St)', time: '34 min', type: 'Bus' }
    ],
    'New York': [
      { line: '🚇 MTA Subway Q / N Line', time: '14 min', type: 'Subway' },
      { line: '🚌 MTA Bus M101 (Lexington Ave)', time: '25 min', type: 'Bus' }
    ],
    Florida: [
      { line: '🚆 Brightline Train (Miami Core)', time: '22 min', type: 'Rail' },
      { line: '🚌 Miami Metrobus Route 120', time: '45 min', type: 'Bus' }
    ],
    Texas: [
      { line: '🚆 CapMetro Rail (Downtown)', time: '16 min', type: 'Rail' },
      { line: '🚌 CapMetro Bus Route 801', time: '32 min', type: 'Bus' }
    ]
  }
  const cityTransit = transitOptions[city] ?? transitOptions.Atlanta

  const TABS: { id: TabId; label: string; icon: string; color: string }[] = [
    { id: 'route',   label: 'Route',   icon: '🗺️',  color: '#0084ff' },
    { id: 'traffic', label: 'Traffic', icon: '🚦',  color: TRAFFIC_COLORS[trafficLevel] },
    { id: 'venues',  label: 'Venues',  icon: '📍',  color: '#a855f7' },
  ]

  return (
    <div className="glass-panel-heavy" style={{
      display: 'flex', flexDirection: 'column', width: '320px',
      borderRadius: '20px', overflow: 'hidden',
      fontFamily: 'inherit', color: 'var(--text-main)',
      userSelect: 'none', position: 'relative', transform: 'translateY(-24px)',
      animation: 'cardSlideIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 1000, pointerEvents: 'auto',
    }}>
      <style>{`
        @keyframes cardSlideIn { from{opacity:0;transform:translateY(-10px) scale(0.95)} to{opacity:1;transform:translateY(-24px) scale(1)} }
        @keyframes sponsorShimmer { 0%,100%{opacity:0.7} 50%{opacity:1} }
        .route-tab-btn:hover { opacity:1!important; }
        .venue-row:hover { background:rgba(168,85,247,0.1)!important; }
        .route-row:hover { background:var(--sidebar-accent)!important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cleanFrom}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cleanTo}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{distanceKm} km</span>
            <button onClick={e => { e.stopPropagation(); onClose() }}
              className="glass-button hover:text-foreground"
              style={{ border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
            >✕</button>
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Live Connection Route</div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} className="route-tab-btn"
            onClick={e => { e.stopPropagation(); setTab(t.id); setActiveOption('list') }}
            style={{
              flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t.id ? 'var(--sidebar-accent)' : 'transparent',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              color: tab === t.id ? t.color : 'var(--text-muted)',
              fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
              transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
            <span>{t.icon}</span><span style={{ letterSpacing: '0.04em' }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '14px 18px', minHeight: 220 }}>

        {/* Route tab */}
        {tab === 'route' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeOption === 'list' && [
              isLong
                ? { icon: '✈️', label: flightText, sub: 'Flight', action: () => window.open(`https://www.google.com/travel/flights?q=Flights+to+${encodeURIComponent(cleanTo)}`), color: '#60a5fa' }
                : { icon: '🚆', label: `${Math.round(driveHrs * 60 + driveH * 60)}m`, sub: 'Transit · Local Lines', action: () => setActiveOption('transit'), color: '#60a5fa' },
              { icon: '🚗', label: driveText, sub: 'Drive · Directions', action: () => setActiveOption('drive'), color: '#34d399' },
              { icon: '🚕', label: rideText, sub: 'Taxi · Uber / Lyft', action: () => setActiveOption('taxi'), color: '#f59e0b' },
              { icon: '🚶', label: walkText, sub: isLong ? 'Really far — get shoes' : 'Walk · Nike Store', action: () => window.open('https://www.nike.com/w/comfortable-shoes-76hjg'), color: '#e879f9' },
            ].map((row, i) => (
              <div key={i} onClick={(e) => { e.stopPropagation(); row.action() }} className="route-row"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 8px', borderRadius: 10, color: '#fff', transition: 'background 0.15s', cursor: 'pointer' }}>
                <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: row.color }}>{row.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{row.sub}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            ))}

            {/* Sub-view: Drive directions */}
            {activeOption === 'drive' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>🚗 Driving Directions</span>
                  <button onClick={(e) => { e.stopPropagation(); setActiveOption('list') }} className="glass-button text-xs px-2 py-1 rounded">Back</button>
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                  {driveSteps.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>Loading directions...</div>
                  ) : driveSteps.map((step, idx) => (
                    <div key={idx} style={{ fontSize: 11, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700, marginRight: 6 }}>{idx + 1}.</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view: Transit options */}
            {activeOption === 'transit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>🚆 Public Transit</span>
                  <button onClick={(e) => { e.stopPropagation(); setActiveOption('list') }} className="glass-button text-xs px-2 py-1 rounded">Back</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cityTransit.map((t, idx) => (
                    <div key={idx} className="route-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--sidebar-accent)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-main)', fontWeight: 600 }}>{t.line}</div>
                      <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700 }}>{t.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view: Taxi Rideshare Connect */}
            {activeOption === 'taxi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>🚕 Rideshare dispatch</span>
                  <button onClick={(e) => { e.stopPropagation(); setActiveOption('list') }} className="glass-button text-xs px-2 py-1 rounded">Back</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--sidebar-accent)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>UberX</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Estimated: {rideText}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>$14.20</span>
                      <button onClick={(e) => { e.stopPropagation(); setUberConnected(c => !c) }} className="glass-button text-[9px] px-2 py-0.5 rounded">
                        {uberConnected ? 'Connected ✅' : 'Connect'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, background: 'var(--sidebar-accent)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Lyft Pink</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Estimated: {rideText}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>$13.80</span>
                      <button onClick={(e) => { e.stopPropagation(); setLyftConnected(c => !c) }} className="glass-button text-[9px] px-2 py-0.5 rounded">
                        {lyftConnected ? 'Connected ✅' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traffic tab */}
        {tab === 'traffic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: `rgba(${trafficLevel === 'light' ? '16,185,129' : trafficLevel === 'moderate' ? '245,158,11' : '239,68,68'},0.1)`, border: `1px solid ${TRAFFIC_COLORS[trafficLevel]}40`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TRAFFIC_COLORS[trafficLevel], marginBottom: 2 }}>{TRAFFIC_LABELS[trafficLevel]}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isRushHour ? 'Rush hour in effect' : isOffPeak ? 'Off-peak hours' : 'Midday traffic'}</div>
              </div>
              <div style={{ fontSize: 28 }}>{trafficLevel === 'light' ? '🛣️' : trafficLevel === 'moderate' ? '🚦' : '🚧'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Avg Speed', value: `${avgSpeed} mph`, color: TRAFFIC_COLORS[trafficLevel] },
                { label: 'Delay',     value: delay === 0 ? 'None' : `+${delay} min`, color: delay === 0 ? '#10b981' : '#f59e0b' },
                { label: 'Incidents', value: String(incidents), color: incidents > 0 ? '#ef4444' : '#10b981' },
                { label: 'Road Type', value: distance > 10 ? 'Highway' : 'City', color: '#60a5fa' },
              ].map((stat, i) => (
                <div key={i} style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <a href={`${trafficUrl}&layer=traffic`} target="_blank" rel="noopener noreferrer"
              className="glass-button text-foreground hover:text-foreground font-semibold py-2.5 rounded-lg w-full tracking-wider cursor-pointer text-center"
            >
              <span>🗺️</span> Open in Maps with Traffic
            </a>
          </div>
        )}

        {/* Venues tab */}
        {tab === 'venues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'bar', 'restaurant', 'shop', 'entertainment'] as const).map(f => (
                <button key={f} onClick={e => { e.stopPropagation(); setVenueFilter(f) }}
                  style={{
                    padding: '4px 10px', border: 'none', borderRadius: 20, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    background: venueFilter === f ? 'linear-gradient(135deg,#a855f7,#7c3aed)' : 'var(--sidebar-accent)',
                    color: venueFilter === f ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>
                  {f === 'all' ? 'All' : `${VENUE_ICONS[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}s`}
                </button>
              ))}
            </div>

            {/* Venue list — clicking toggles map highlight instead of navigating to google maps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
              {venues.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No venues in this category</div>
              ) : venues.map((v, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); onVenueSelect(v) }}
                  className="venue-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                    color: '#fff', transition: 'background 0.15s', cursor: 'pointer',
                    background: beamedVenueName === v.name ? 'rgba(168,85,247,0.12)' : (v.sponsored ? 'rgba(168,85,247,0.06)' : 'transparent'),
                    border: beamedVenueName === v.name ? '1px solid #a855f7' : (v.sponsored ? '1px solid rgba(168,85,247,0.15)' : '1px solid transparent')
                  }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{VENUE_ICONS[v.type]}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                      {v.sponsored && <span style={{ fontSize: 7, fontWeight: 700, color: '#a855f7', background: 'rgba(168,85,247,0.15)', padding: '1px 4px', borderRadius: 4, letterSpacing: '0.1em', flexShrink: 0, animation: 'sponsorShimmer 2s ease-in-out infinite' }}>PARTNER</span>}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{v.distance} away · {v.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: '#fbbf24' }}>★</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#fbbf24' }}>{v.rating}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 8, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.08em' }}>
              ✨ PARTNER venues support FlyDnA Network
            </div>
          </div>
        )}
      </div>

      {/* Caret */}
      <div style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid var(--border)' }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface NascLocalCallRouteProps {
  callerA: Pt; callerB: Pt
  callerAName?: string; callerBName?: string
  callerALoc?: string;  callerBLoc?: string
  callerAAvatar?: string; callerBAvatar?: string
  onHangup?: () => void
}

export default function NascLocalCallRoute({
  callerA, callerB,
  callerAName = 'Ryan Reynolds', callerBName = 'Lisa Sterling',
  callerALoc = 'Local', callerBLoc = 'Remote',
  callerAAvatar, callerBAvatar,
  onHangup,
}: NascLocalCallRouteProps) {
  const { current: mapRef } = useMap()
  const [line, setLine]           = useState<Pt[] | null>(null)
  const [showMenu, setShowMenu]   = useState(false)
  const [callEnded, setCallEnded] = useState(true)
  const rafRef = useRef<number | null>(null)
  const [venueFilter, setVenueFilter] = useState<VenueFilter>('all')
  const [beamedVenueName, setBeamedVenueName] = useState<string | null>(null)

  const city = getCityFromLoc(callerALoc)
  const venues = (VENUES[city] ?? VENUES.Atlanta).filter(v => venueFilter === 'all' || v.type === venueFilter)

  const handleVenueSelect = (v: Venue) => {
    const isCurrentlyBeamed = beamedVenueName === v.name
    const newBeamed = isCurrentlyBeamed ? null : v.name
    setBeamedVenueName(newBeamed)
    
    if (newBeamed && mapRef) {
      const coords = getVenueCoords(v.name, callerA)
      const m = mapRef.getMap?.()
      if (m) {
        m.flyTo({ center: coords, zoom: 16.5, pitch: 65, duration: 1500 })
      }
    }
  }

  // Listen for call state events
  useEffect(() => {
    const handler = (e: Event) => {
      const type = (e as CustomEvent).detail?.type
      if (type && type !== 'none') setCallEnded(false)
      if (type === 'none') { setCallEnded(true); setShowMenu(false) }
    }
    window.addEventListener('flydna-call-state', handler)
    return () => window.removeEventListener('flydna-call-state', handler)
  }, [])

  // Hangup — clears call on both sides
  const handleHangup = () => {
    setCallEnded(true); setShowMenu(false)
    window.dispatchEvent(new CustomEvent('flydna-call-state', { detail: { type: 'none' } }))
    onHangup?.()
  }

  // Fetch driving route from Mapbox Directions
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${callerA[0]},${callerA[1]};${callerB[0]},${callerB[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      try {
        const j = await (await fetch(url)).json()
        const c = j.routes?.[0]?.geometry?.coordinates as Pt[] | undefined
        if (!cancelled) setLine(c && c.length > 0 ? c : [callerA, callerB])
      } catch { if (!cancelled) setLine([callerA, callerB]) }
    })()
    return () => { cancelled = true }
  }, [callerA[0], callerA[1], callerB[0], callerB[1]])

  // Camera fit when call activates
  useEffect(() => {
    if (callEnded || !line || !mapRef) return
    const m = mapRef.getMap?.()
    if (!m) return
    const lngs = line.map(p => p[0]), lats = line.map(p => p[1])
    m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], {
      padding: { top: 160, bottom: 220, left: 220, right: 320 }, duration: 2000, pitch: 55, bearing: -15,
    })
  }, [callEnded, line])

  // 60fps pulse animation on glow layer — no React re-renders
  useEffect(() => {
    if (callEnded || !line) return
    const m = mapRef?.getMap?.()
    if (!m) return
    const animate = () => {
      try {
        const t = Date.now() / 1000
        if (m.getLayer('lcr-glow')) {
          m.setPaintProperty('lcr-glow', 'line-opacity', 0.45 + 0.45 * Math.abs(Math.sin(t * 1.2)))
          m.setPaintProperty('lcr-glow', 'line-width',   16  + 12  * Math.abs(Math.sin(t * 1.2)))
        }
      } catch (e) { /* layer not ready yet */ }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [callEnded, line, mapRef])

  // Route-click events (custom + direct Mapbox)
  useEffect(() => {
    const onRouteClick = () => setShowMenu(true)
    window.addEventListener('flydna-route-click', onRouteClick)
    return () => window.removeEventListener('flydna-route-click', onRouteClick)
  }, [])

  useEffect(() => {
    const m = mapRef?.getMap?.()
    if (!m || !line) return
    const onClick = (e: any) => {
      const hits = m.queryRenderedFeatures(e.point, { layers: ['lcr-base', 'lcr-glow'] })
      if (hits?.length) { e.originalEvent?.stopPropagation(); setShowMenu(p => !p) }
    }
    const onEnter = () => m.getCanvas().style.cursor = 'pointer'
    const onLeave = () => { m.getCanvas().style.cursor = '' }
    m.on('click', onClick)
    m.on('mouseenter', 'lcr-base', onEnter)
    m.on('mouseleave', 'lcr-base', onLeave)
    return () => { m.off('click', onClick); m.off('mouseenter', 'lcr-base', onEnter); m.off('mouseleave', 'lcr-base', onLeave) }
  }, [mapRef, line])

  if (!line || callEnded) return null

  const midpoint    = getMidpoint(line)
  const estDistance = getHaversineDistance(callerA, callerB) * 1.25
  const geojson     = { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: line } }

  return (
    <>
      <Source id="lcr-source" type="geojson" data={geojson}>
        {/* Outer pulse glow — animated via rAF */}
        <Layer id="lcr-glow" type="line"
          paint={{ 'line-color': '#00e5ff', 'line-width': 20, 'line-opacity': 0.6, 'line-blur': 6 }}
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        />
        {/* Solid core line */}
        <Layer id="lcr-base" type="line"
          paint={{ 'line-color': '#00a3ff', 'line-width': 5, 'line-opacity': 0.9 }}
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        />
        {/* White highlight */}
        <Layer id="lcr-flow" type="line"
          paint={{ 'line-color': '#ffffff', 'line-width': 2.5, 'line-opacity': 0.8 }}
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
        />
      </Source>

      {/* Local city venues markers */}
      {venues.map((v, idx) => (
        <RouteVenueMarker
          key={idx}
          venue={v}
          cityCenter={callerA}
          isBeamed={beamedVenueName === v.name}
          onToggleBeam={() => handleVenueSelect(v)}
          city={city}
        />
      ))}

      {/* Route menu card — click line to open */}
      {showMenu && midpoint && (
        <Marker longitude={midpoint[0]} latitude={midpoint[1]} anchor="bottom">
          <RouteMenuCard
            distance={estDistance}
            callerA={callerA} callerB={callerB}
            callerALoc={callerALoc} callerBLoc={callerBLoc}
            onClose={() => setShowMenu(false)}
            venueFilter={venueFilter}
            setVenueFilter={setVenueFilter}
            beamedVenueName={beamedVenueName}
            onVenueSelect={handleVenueSelect}
          />
        </Marker>
      )}

      {/* Caller A card */}
      <Marker longitude={callerA[0]} latitude={callerA[1]} anchor="bottom">
        <MapCallerCard name={callerAName} avatar={callerAAvatar} location={callerALoc} delay={0} onHangup={handleHangup} />
      </Marker>

      {/* Caller B card */}
      <Marker longitude={callerB[0]} latitude={callerB[1]} anchor="bottom">
        <MapCallerCard name={callerBName} avatar={callerBAvatar} location={callerBLoc} delay={0.3} onHangup={handleHangup} />
      </Marker>
    </>
  )
}
