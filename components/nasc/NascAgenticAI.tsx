'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxTransformRequest } from '@/lib/mapbox'

import { useSearchStore } from '@/utils/states/useSearchStore'
import { airports } from '@/utils/mock-data/airports'
import type { Location } from '@/utils/mock-data/airports'

function dateToYYYYMMDD(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0]
    return d.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}


// ── Types ──────────────────────────────────────────────────────────────────────
type AgentKey = 'corporate' | 'family' | 'solo' | 'eventscout' | 'concert'
type TierKey = 'executive' | 'standard' | 'budget'

interface Agent { name: string; title: string; avatar: string; color: string }
interface HotelData { name: string; price: number; coords: [number, number]; tier: TierKey }
interface AirportData { name: string; coords: [number, number] }
interface EventData {
  id: string; title: string; date: string; location: string
  coords: [number, number]; tags: string[]; category: string
  description: string; hotels: HotelData[]; airport: AirportData
  url?: string
}
interface PackageItem { hotel: HotelData; event: EventData; valueScore: number; total: number; isLocal?: boolean; fromAirport?: string }
interface ChatMessage {
  id: string; isUser: boolean; agentKey: AgentKey; timestamp: Date
  text?: string; events?: EventData[]; packages?: PackageItem[]
}
interface QuickReply { text: string; eventId?: string }

// ── Static Data ────────────────────────────────────────────────────────────────
const AGENTS: Record<AgentKey, Agent> = {
  corporate: { name: 'Alex',  title: 'Corporate Travel Director',       avatar: 'AC', color: '#6366f1' },
  family:    { name: 'Maya',  title: 'Family Vacation Specialist',       avatar: 'MF', color: '#a855f7' },
  solo:      { name: 'Jax',   title: 'Solo Luxury Curator',             avatar: 'SJ', color: '#06b6d4' },
  eventscout:{ name: 'Scout', title: 'Event Intelligence',              avatar: 'ES', color: '#f59e0b' },
  concert:   { name: 'Lyric', title: 'Concert & Live Music Specialist', avatar: 'LC', color: '#ec4899' },
}

const DEMO_EVENTS: Record<AgentKey, EventData[]> = {
  corporate: [
    {
      id: 'grammy-2027', title: '67th Grammy Awards', date: 'Feb 8, 2027',
      location: 'Crypto.com Arena, Los Angeles', coords: [-118.2673, 34.0430],
      tags: ['Celebrity', 'Music', 'Red Carpet'], category: 'celebrity',
      description: 'The biggest night in music. Perfect for client entertainment and team recognition events.',
      hotels: [
        { name: 'The Ritz-Carlton',       price: 899,  coords: [-118.2565, 34.0536], tier: 'executive' },
        { name: 'JW Marriott LA Live',    price: 549,  coords: [-118.2656, 34.0444], tier: 'standard'  },
        { name: 'Freehand Los Angeles',   price: 289,  coords: [-118.2519, 34.0505], tier: 'budget'    },
      ],
      airport: { name: 'LAX', coords: [-118.4085, 33.9416] },
    },
    {
      id: 'superbowl-2027', title: 'Super Bowl LXI', date: 'Feb 14, 2027',
      location: 'SoFi Stadium, Inglewood', coords: [-118.3390, 33.9534],
      tags: ['Sports', 'NFL', 'Corporate Box'], category: 'sports',
      description: 'Super Bowl in LA. Premium corporate suites available with full catering and hospitality.',
      hotels: [
        { name: 'Fairmont Century Plaza',     price: 1299, coords: [-118.4137, 34.0586], tier: 'executive' },
        { name: 'Hilton Los Angeles Airport', price: 429,  coords: [-118.3857, 33.9462], tier: 'standard'  },
        { name: 'Holiday Inn LAX',            price: 219,  coords: [-118.3915, 33.9468], tier: 'budget'    },
      ],
      airport: { name: 'LAX', coords: [-118.4085, 33.9416] },
    },
  ],
  family: [
    {
      id: 'march-madness-2027', title: 'NCAA Final Four 2027', date: 'Apr 3-5, 2027',
      location: 'Alamodome, San Antonio', coords: [-98.4788, 29.4169],
      tags: ['Sports', 'Basketball', 'Family'], category: 'sports',
      description: 'College basketball madness in family-friendly San Antonio. River Walk and the Alamo nearby.',
      hotels: [
        { name: 'Hotel Emma',          price: 699, coords: [-98.4912, 29.4402], tier: 'executive' },
        { name: 'Marriott Rivercenter',price: 389, coords: [-98.4875, 29.4239], tier: 'standard'  },
        { name: 'Drury Inn Riverwalk', price: 199, coords: [-98.4847, 29.4253], tier: 'budget'    },
      ],
      airport: { name: 'SAT', coords: [-98.4698, 29.5337] },
    },
    {
      id: 'nba-finals-2027', title: 'NBA Finals 2027', date: 'Jun 4-18, 2027',
      location: 'United Center, Chicago', coords: [-87.6742, 41.8807],
      tags: ['Sports', 'Basketball', 'Championship'], category: 'sports',
      description: 'The pinnacle of basketball. Family packages include pre-game experiences and merchandise.',
      hotels: [
        { name: 'Four Seasons Chicago',         price: 849, coords: [-87.6261, 41.8992], tier: 'executive' },
        { name: 'Swissotel Chicago',            price: 459, coords: [-87.6195, 41.8887], tier: 'standard'  },
        { name: 'Hampton Inn Magnificent Mile', price: 259, coords: [-87.6244, 41.8988], tier: 'budget'    },
      ],
      airport: { name: 'ORD', coords: [-87.9073, 41.9742] },
    },
  ],
  solo: [
    {
      id: 'grammy-solo', title: 'Grammy Week Experience', date: 'Feb 5-10, 2027',
      location: 'Los Angeles, CA', coords: [-118.2437, 34.0522],
      tags: ['Celebrity', 'Music', 'VIP'], category: 'celebrity',
      description: 'Full Grammy week access. After-parties, gifting suites, and red carpet viewing.',
      hotels: [
        { name: 'Bel-Air Hotel',          price: 1899, coords: [-118.4475, 34.0837], tier: 'executive' },
        { name: 'The Standard Hollywood', price: 649,  coords: [-118.3445, 34.0995], tier: 'standard'  },
        { name: 'Freehand DTLA',          price: 329,  coords: [-118.2519, 34.0505], tier: 'budget'    },
      ],
      airport: { name: 'LAX', coords: [-118.4085, 33.9416] },
    },
  ],
  eventscout: [
    {
      id: 'political-convention', title: 'National Political Convention', date: 'Aug 2028',
      location: 'Milwaukee, WI', coords: [-87.9065, 43.0389],
      tags: ['Political', 'Convention', 'Networking'], category: 'political',
      description: 'Major political convention. High demand for corporate lodging and hospitality suites.',
      hotels: [
        { name: 'Pfister Hotel',    price: 799, coords: [-87.9060, 43.0393], tier: 'executive' },
        { name: 'Hilton Milwaukee', price: 449, coords: [-87.9055, 43.0385], tier: 'standard'  },
        { name: 'Aloft Milwaukee',  price: 249, coords: [-87.9165, 43.0342], tier: 'budget'    },
      ],
      airport: { name: 'MKE', coords: [-87.8969, 42.9476] },
    },
    {
      id: 'church-conference', title: 'Global Faith Leadership Summit', date: 'Jul 15-19, 2027',
      location: 'Atlanta, GA', coords: [-84.3880, 33.7490],
      tags: ['Church', 'Faith', 'Leadership'], category: 'church',
      description: 'Largest faith-based leadership conference. Group rates for church delegations available.',
      hotels: [
        { name: 'Omni CNN Center',       price: 599, coords: [-84.3959, 33.7568], tier: 'executive' },
        { name: 'Sheraton Atlanta',      price: 349, coords: [-84.3892, 33.7591], tier: 'standard'  },
        { name: 'Country Inn & Suites',  price: 189, coords: [-84.3935, 33.7712], tier: 'budget'    },
      ],
      airport: { name: 'ATL', coords: [-84.4277, 33.6407] },
    },
  ],
  concert: [
    {
      id: 'coachella-2027', title: 'Coachella Valley Music & Arts Festival', date: 'Apr 10-12 & 17-19, 2027',
      location: 'Empire Polo Club, Indio, CA', coords: [-116.2372, 33.7206],
      tags: ['Music Festival', 'Multi-Day', 'VIP'], category: 'concert',
      description: "The world's premier music festival. Two weekends of A-list headliners, art installations, and desert luxury camping.",
      hotels: [
        { name: 'La Quinta Resort & Club',   price: 1299, coords: [-116.2965, 33.7123], tier: 'executive' },
        { name: 'Renaissance Esmeralda',     price: 749,  coords: [-116.3841, 33.7227], tier: 'standard'  },
        { name: 'Motel 6 Indio',             price: 289,  coords: [-116.2157, 33.7204], tier: 'budget'    },
      ],
      airport: { name: 'PSP', coords: [-116.5070, 33.8303] },
    },
    {
      id: 'rolling-loud-2027', title: 'Rolling Loud Miami 2027', date: 'Jul 23-25, 2027',
      location: 'Hard Rock Stadium, Miami Gardens', coords: [-80.2376, 25.9580],
      tags: ['Hip-Hop', 'Festival', 'High Energy'], category: 'concert',
      description: 'The biggest hip-hop festival on the planet. 3 days of headliners, after-parties, and Miami beach access.',
      hotels: [
        { name: 'Fontainebleau Miami Beach', price: 1899, coords: [-80.1220, 25.8174], tier: 'executive' },
        { name: 'Aloft Miami Doral',         price: 549,  coords: [-80.3556, 25.7906], tier: 'standard'  },
        { name: 'Hampton Inn Hallandale',    price: 329,  coords: [-80.1489, 25.9817], tier: 'budget'    },
      ],
      airport: { name: 'MIA', coords: [-80.2870, 25.7959] },
    },
    {
      id: 'beyonce-2027', title: 'Beyoncé RENAISSANCE World Tour — LA Finale', date: 'Sep 12, 2027',
      location: 'SoFi Stadium, Inglewood, CA', coords: [-118.3390, 33.9534],
      tags: ['Pop', 'Stadium Tour', 'VIP Experience'], category: 'concert',
      description: 'The final show of the RENAISSANCE World Tour. Stadium-scale production with exclusive VIP soundcheck packages.',
      hotels: [
        { name: 'Fairmont Century Plaza',     price: 1599, coords: [-118.4137, 34.0586], tier: 'executive' },
        { name: 'Hilton Los Angeles Airport', price: 429,  coords: [-118.3857, 33.9462], tier: 'standard'  },
        { name: 'Holiday Inn LAX',            price: 219,  coords: [-118.3915, 33.9468], tier: 'budget'    },
      ],
      airport: { name: 'LAX', coords: [-118.4085, 33.9416] },
    },
  ],
}

// ── Real event data (Ticketmaster via your backend) ────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging.flydna.io'

const CITY_AIRPORTS: Record<string, AirportData> = {
  Atlanta:       { name: 'ATL', coords: [-84.4277, 33.6407] },
  'New York':    { name: 'JFK', coords: [-73.7789, 40.6413] },
  Miami:         { name: 'MIA', coords: [-80.2870, 25.7959] },
  'Los Angeles': { name: 'LAX', coords: [-118.4085, 33.9416] },
  Chicago:       { name: 'ORD', coords: [-87.9073, 41.9742] },
  'Las Vegas':   { name: 'LAS', coords: [-115.1523, 36.0840] },
}

function fmtDate(d?: string): string {
  if (!d) return 'TBA'
  const dt = new Date(d + 'T00:00:00')
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapCategory(seg?: string): string {
  switch ((seg || '').toLowerCase()) {
    case 'sports':         return 'sports'
    case 'music':          return 'concert'
    case 'arts & theatre': return 'celebrity'
    default:               return 'celebrity'
  }
}

function getEventLogo(title: string, location: string): string | null {
  const t = title.toLowerCase()
  const l = location.toLowerCase()
  if (t.includes('braves') || l.includes('truist')) return '/ATL_Braves.png'
  if (t.includes('falcon') || l.includes('mercedes')) return '/ATL_Falcons.png'
  if (t.includes('hawk') || l.includes('state farm')) return '/ATL_Hawks.png'
  if (t.includes('united') || t.includes('fc')) return '/ATL_United-FC.png'
  if (t.includes('gsu') || t.includes('panther') || l.includes('center parc') || l.includes('pete-petit')) return '/GA_Panthers.png'
  if (t.includes('knick')) return '/knick_Logo.png'
  if (t.includes('nets')) return '/Brooklyn_Nets_Logo.png'
  if (t.includes('mets')) return '/NY_Mets_Logo.png'
  if (t.includes('yankee')) return '/YankeeLogo.png'
  if (t.includes('nobu') || l.includes('nobu')) return '/nobu_logo.png'
  if (t.includes('ponce') || l.includes('ponce')) return '/Ponce_City-Market.png'
  return null
}

function getHotelLogo(name: string): React.ReactNode {
  const n = name.toLowerCase()

  // 1. Fairmont (charcoal/gold luxurious serif F)
  if (n.includes('fairmont')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#111827', borderRadius: '50%', border: '1px solid #fbbf24' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 'bold', color: '#fbbf24', transform: 'translateY(-1px)' }}>F</span>
      </div>
    )
  }

  // 2. Ritz-Carlton (gold/navy serif R)
  if (n.includes('ritz')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0a0e1a', borderRadius: '50%', border: '1px solid #f59e0b' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 'bold', color: '#f59e0b', transform: 'translateY(-1px)' }}>R</span>
      </div>
    )
  }

  // 3. Hilton (classic dark blue background with white serif H and a light gold ring)
  if (n.includes('hilton')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#00255c', borderRadius: '50%', border: '1px solid #c5a880' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 'bold', color: '#fff', transform: 'translateY(-1px)' }}>H</span>
      </div>
    )
  }

  // 4. Marriott (signature deep red background with white bold sans-serif M)
  if (n.includes('marriott')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#b3002d', borderRadius: '50%', border: '1px solid #ff4d4d' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 900, color: '#fff', transform: 'translateY(-0.5px)' }}>M</span>
      </div>
    )
  }

  // 5. Holiday Inn (signature dark green background with white serif H)
  if (n.includes('holiday')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#007a48', borderRadius: '50%', border: '1px solid #39e600' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 15, fontWeight: 'bold', color: '#fff', transform: 'translateY(-1px)' }}>H</span>
      </div>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#10b981">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
  )
}

function synthHotels(lng: number, lat: number): HotelData[] {
  return [
    { name: 'Ritz-Carlton Luxury Suites', price: 579, coords: [lng + 0.008, lat + 0.006], tier: 'executive' },
    { name: 'Marriott Marquis Atlanta',  price: 329, coords: [lng - 0.007, lat + 0.005], tier: 'standard'  },
    { name: 'Holiday Inn Express', price: 169, coords: [lng + 0.006, lat - 0.007], tier: 'budget'    },
  ]
}

const VENUE_COORDS: Record<string, [number, number]> = {
  'masquerade': [-84.3607, 33.7712],
  'buckhead': [-84.3794, 33.8427],
  'loft': [-84.3855, 33.7905],
  'center stage': [-84.3855, 33.7905],
  'vinyl': [-84.3855, 33.7905],
  'truist': [-84.4678, 33.8907],
  'mercedes-benz': [-84.4010, 33.7553],
  'state farm': [-84.3973, 33.7573],
  'ponce city': [-84.3659, 33.7728],
  'aquarium': [-84.3949, 33.7634],
  'nobu': [-84.3644, 33.8491],
  'sofi': [-118.3390, 33.9534],
  'crypto': [-118.2673, 34.0430]
}

const VENUE_IMAGES: Record<string, string> = {
  'truist': 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=600&auto=format&fit=crop&q=80', // Stadium/Atlanta
  'mercedes-benz': 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?w=600&auto=format&fit=crop&q=80',
  'state farm': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80', // Basketball
  'masquerade': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80', // Concert
  'buckhead': 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80', // Live music
  'aquarium': 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=600&auto=format&fit=crop&q=80', // Aquarium
  'nobu': 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600&auto=format&fit=crop&q=80', // Restaurant
  'sofi': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80', // Football stadium
  'crypto': 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=600&auto=format&fit=crop&q=80',
  'coachella': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80', // Festival
  'rolling loud': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
  'grammy': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'final four': 'https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=600&auto=format&fit=crop&q=80'
}

function parseConversationalEvents(text: string): { cleanedText: string; events: EventData[] } {
  const events: EventData[] = []
  const lines = text.split('\n')
  const cleanedLines: string[] = []

  for (const line of lines) {
    if (line.includes('Event |') || line.includes('---|') || (line.includes('|') && line.includes('---'))) {
      continue
    }

    const parts = line.split('|').map(p => p.trim()).filter(Boolean)
    if (parts.length >= 3) {
      const titleRaw = parts[0]
      const venue = parts[1]
      const date = parts[2]

      const title = titleRaw.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '')
                            .replace(/\*\*/g, '')
                            .trim()

      if (title && venue && date && date.length < 25) {
        let coords: [number, number] = [-84.3880, 33.7490] // default Atlanta
        const venueLower = venue.toLowerCase()
        for (const [k, v] of Object.entries(VENUE_COORDS)) {
          if (venueLower.includes(k)) {
            coords = v
            break
          }
        }

        events.push({
          id: 'parsed-' + Math.random().toString(36).slice(2),
          title,
          date,
          location: venue,
          coords,
          tags: ['Live', 'Interactive'],
          category: 'concert',
          description: `${title} performing live at ${venue}.`,
          hotels: synthHotels(coords[0], coords[1]),
          airport: { name: 'ATL', coords: [-84.4277, 33.6407] }
        })
        continue
      }
    }

    const eventEmojis = /🏟️|🎵|🎤|🎶|🎨|🎸|⚽|🏀|🏈|🎭/
    if ((eventEmojis.test(line) || line.startsWith('-') || line.startsWith('•')) && line.includes('**')) {
      const titleMatch = line.match(/\*\*(.*?)\*\*/)
      const title = titleMatch ? titleMatch[1].trim() : ''

      if (title) {
        let venue = ''
        const venueMatch = line.match(/(?:📍|at|Venue:)\s*(.*?)(?:📅|on|Date:|\(|\[|$)/i)
        if (venueMatch) {
          venue = venueMatch[1].replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()
        } else {
          const rest = line.replace(/\*\*(.*?)\*\*/, '')
          const words = rest.split(/\s+/)
          for (const word of words) {
            const wordClean = word.toLowerCase().replace(/[^a-z]/g, '')
            if (['park', 'stadium', 'arena', 'theatre', 'loft', 'stage', 'vinyl', 'masquerade', 'nobu', 'aquarium', 'sofi', 'crypto'].includes(wordClean)) {
              venue = rest.trim().split('—').pop()?.split('at').pop()?.trim() || rest.trim()
              break
            }
          }
        }

        if (!venue) {
          const tLower = title.toLowerCase()
          if (tLower.includes('truist park')) venue = 'Truist Park'
          else if (tLower.includes('sofi')) venue = 'SoFi Stadium'
          else if (tLower.includes('mercedes-benz')) venue = 'Mercedes-Benz Stadium'
          else if (tLower.includes('state farm')) venue = 'State Farm Arena'
        }

        let date = 'Jun 27, 2026'
        const dateMatch = line.match(/(?:📅|on|Date:)\s*(.*?)(?:📍|at|Venue:|\(|\[|$)/i)
        if (dateMatch) {
          date = dateMatch[1].replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()
        }

        if (venue) {
          let coords: [number, number] = [-84.3880, 33.7490] // default Atlanta
          const venueLower = venue.toLowerCase()
          for (const [k, v] of Object.entries(VENUE_COORDS)) {
            if (venueLower.includes(k)) {
              coords = v
              break
            }
          }

          events.push({
            id: 'parsed-' + Math.random().toString(36).slice(2),
            title,
            date: date || 'Jun 27, 2026',
            location: venue,
            coords,
            tags: ['Live', 'Interactive'],
            category: 'concert',
            description: `${title} performing live at ${venue}.`,
            hotels: synthHotels(coords[0], coords[1]),
            airport: { name: 'ATL', coords: [-84.4277, 33.6407] }
          })
          continue
        }
      }
    }

    cleanedLines.push(line)
  }

  let cleanedText = cleanedLines.join('\n').trim()
  cleanedText = cleanedText.replace(/\|[-|\s]+\|/g, '')
  return { cleanedText, events }
}

// Map one backend Ticketmaster event → the EventData shape this UI expects
function mapBackendEvent(e: any): EventData | null {
  if (typeof e.lat !== 'number' || typeof e.lng !== 'number') return null  // need coords for the map
  const seg = e.category && e.category !== 'Undefined' ? e.category : 'Event'
  return {
    id: e.id,
    title: e.name,
    date: fmtDate(e.date),
    location: e.venue ? `${e.venue}, ${e.city || ''}`.replace(/,\s*$/, '') : (e.city || 'TBA'),
    coords: [e.lng, e.lat],
    tags: [seg, 'Live'],
    category: mapCategory(e.category),
    description: `${seg} at ${e.venue || e.city || 'venue'}.` + (e.time ? ` Doors ${String(e.time).slice(0, 5)}.` : ''),
    hotels: synthHotels(e.lng, e.lat),
    airport: CITY_AIRPORTS[e.city] || { name: `${e.city || 'Local'} Airport`, coords: [e.lng - 0.18, e.lat - 0.12] },
    url: e.url,
  }
}

async function fetchRealEvents(city = 'Atlanta'): Promise<EventData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/calendar/events?city=${encodeURIComponent(city)}`)
    const json = await res.json()
    if (!json?.success || !Array.isArray(json.data)) return []
    return json.data.map(mapBackendEvent).filter(Boolean) as EventData[]
  } catch {
    return []
  }
}

// ── Origin / geolocation helpers ────────────────────────────────────────────────
type Airport = AirportData & { city: string }
const MAJOR_AIRPORTS: Airport[] = [
  { name: 'ATL', city: 'Atlanta',       coords: [-84.4277, 33.6407] },
  { name: 'JFK', city: 'New York',      coords: [-73.7789, 40.6413] },
  { name: 'LGA', city: 'New York',      coords: [-73.8740, 40.7769] },
  { name: 'EWR', city: 'Newark',        coords: [-74.1687, 40.6895] },
  { name: 'LAX', city: 'Los Angeles',   coords: [-118.4085, 33.9416] },
  { name: 'ORD', city: 'Chicago',       coords: [-87.9073, 41.9742] },
  { name: 'MIA', city: 'Miami',         coords: [-80.2870, 25.7959] },
  { name: 'DFW', city: 'Dallas',        coords: [-97.0380, 32.8998] },
  { name: 'DEN', city: 'Denver',        coords: [-104.6737, 39.8561] },
  { name: 'SFO', city: 'San Francisco', coords: [-122.3790, 37.6213] },
  { name: 'SEA', city: 'Seattle',       coords: [-122.3088, 47.4502] },
  { name: 'LAS', city: 'Las Vegas',     coords: [-115.1523, 36.0840] },
  { name: 'PHX', city: 'Phoenix',       coords: [-112.0116, 33.4342] },
  { name: 'IAH', city: 'Houston',       coords: [-95.3414, 29.9902] },
  { name: 'BOS', city: 'Boston',        coords: [-71.0096, 42.3656] },
  { name: 'MCO', city: 'Orlando',       coords: [-81.3081, 28.4312] },
  { name: 'DCA', city: 'Washington',    coords: [-77.0377, 38.8512] },
]

function haversineMiles(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(b[1] - a[1]), dLng = toRad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function nearestAirport(lng: number, lat: number): Airport {
  let best = MAJOR_AIRPORTS[0], bestD = Infinity
  for (const ap of MAJOR_AIRPORTS) {
    const d = haversineMiles([lng, lat], ap.coords)
    if (d < bestD) { bestD = d; best = ap }
  }
  return best
}

async function resolveOrigin(query: string): Promise<{ city: string; coords: [number, number]; airport: Airport } | null> {
  const q = query.trim().toLowerCase()
  if (!q) return null
  // 1) quick match against known airport cities (no API call)
  const direct = MAJOR_AIRPORTS.find(ap => ap.city.toLowerCase().includes(q) || q.includes(ap.city.toLowerCase()))
  if (direct) return { city: direct.city, coords: direct.coords, airport: direct }
  // 2) fall back to Mapbox geocoding for any other city
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?types=place&limit=1&access_token=${token}`)
    const json = await res.json()
    const f = json?.features?.[0]
    if (!f) return null
    const coords = f.center as [number, number]
    return { city: f.text, coords, airport: nearestAirport(coords[0], coords[1]) }
  } catch { return null }
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function EventCard({ event, onSelect }: { event: EventData; onSelect: (id: string) => void }) {
  const tagColor: Record<string, { bg: string; color: string; border: string }> = {
    sports:    { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)'  },
    political: { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', border: 'rgba(16,185,129,0.2)'  },
    church:    { bg: 'rgba(244,63,94,0.1)',   color: '#f43f5e', border: 'rgba(244,63,94,0.2)'   },
    concert:   { bg: 'rgba(236,72,153,0.1)',  color: '#ec4899', border: 'rgba(236,72,153,0.2)'  },
    celebrity: { bg: 'rgba(168,85,247,0.1)',  color: '#a855f7', border: 'rgba(168,85,247,0.2)'  },
  }
  const tc = tagColor[event.category] ?? tagColor.celebrity

  return (
    <div className="ai-event-card" onClick={() => onSelect(event.id)} style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(6,182,212,0.05) 100%)',
      border: '1px solid #2a3350', borderRadius: 14, padding: 16, marginTop: 10, cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{event.title}</span>
        <span style={{ fontSize: 11, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>
          {event.date}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>📍 {event.location}</div>
      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 10 }}>{event.description}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {event.tags.map(tag => (
          <span key={tag} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

function PackagePreview({ pkg, onBook, onCustomize }: { pkg: PackageItem; onBook: (t: TierKey) => void; onCustomize: (t: TierKey) => void }) {
  const tierStyles: Record<TierKey, { bg: string; label: string }> = {
    executive: { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', label: 'Executive Experience' },
    standard:  { bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', label: 'Standard Experience'  },
    budget:    { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', label: 'Smart Value'           },
  }
  const ts = tierStyles[pkg.hotel.tier]

  return (
    <div style={{ background: '#1a1f35', border: '1px solid #2a3350', borderRadius: 16, padding: 20, marginTop: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, background: ts.bg, color: '#fff' }}>
        {ts.label}
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>
        ${pkg.total}<span style={{ fontSize: 14, color: '#64748b', fontWeight: 400 }}> / person</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Value Index</span>
        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pkg.valueScore}%`, background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{pkg.valueScore}/100</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {(pkg.isLocal
          ? [['🎫', `${pkg.event.title} tickets`], ['🚗', 'Ground transport included'], ['📍', "You're local — no flight needed"]]
          : [['✈️', `Round-trip flight ${pkg.fromAirport ? `${pkg.fromAirport} → ` : 'via '}${pkg.event.airport.name}`], ['🏨', `3 nights at ${pkg.hotel.name}`], ['🎫', `${pkg.event.title} event access`], ['🚗', 'Ground transport included']]
        ).map(([icon, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#94a3b8' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{icon}</div>
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="ai-btn-primary" onClick={() => onBook(pkg.hotel.tier)} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
          Select Package
        </button>
        <button onClick={() => onCustomize(pkg.hotel.tier)} style={{ flex: 1, padding: 12, borderRadius: 12, border: '1px solid #2a3350', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#232942', color: '#94a3b8' }}>
          Customize
        </button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface AgenticAIProps { onClose: () => void }

export default function NascAgenticAI({ onClose }: AgenticAIProps) {
  const mapRef = useRef<MapRef>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const eventPool = useRef<Record<string, EventData>>({})

  // Search Store for Duffel flight search integration
  const setDeparture = useSearchStore(state => state.setDeparture)
  const setArrival = useSearchStore(state => state.setArrival)
  const setDepartureDate = useSearchStore(state => state.setDepartureDate)
  const setTripType = useSearchStore(state => state.setTripType)
  const setActiveCategory = useSearchStore(state => state.setActiveCategory)
  const submitSearch = useSearchStore(state => state.submitSearch)

  const [currentAgent, setCurrentAgent] = useState<AgentKey>('corporate')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [activeEventMarkers, setActiveEventMarkers] = useState<EventData[]>([])
  const [showPackagePanel, setShowPackagePanel] = useState(false)
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null)
  const [toast, setToast] = useState({ visible: false, title: '', message: '' })
  const [origin, setOrigin] = useState<{ city: string; coords: [number, number]; airport: Airport } | null>(null)
  const [locating, setLocating] = useState(false)
  const [originInput, setOriginInput] = useState('')

  // Cleanup all pending timeouts on unmount
  useEffect(() => () => { timeoutsRef.current.forEach(clearTimeout) }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Scroll chat to bottom on new messages
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping, quickReplies])

  const schedule = useCallback((delay: number, fn: () => void) => {
    const id = setTimeout(fn, delay)
    timeoutsRef.current.push(id)
  }, [])

  const addMsg = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).slice(2), timestamp: new Date() }])
  }, [])

  const registerEvents = useCallback((evts: EventData[]) => {
    evts.forEach(e => { eventPool.current[e.id] = e })
  }, [])

  const showToast = useCallback((title: string, message: string) => {
    setToast({ visible: true, title, message })
    const id = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
    timeoutsRef.current.push(id)
  }, [])

  const isFirstRender = useRef(true)

  // Triggered when currentAgent changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    let text = ''
    let events: EventData[] = []

    switch (currentAgent) {
      case 'corporate':
        text = "Welcome back! Let's arrange your high-impact corporate group packages, premium sports box suites, or client hospitality. I've populated SoFi Stadium and the Grammys on your map. Let me know what you need to organize."
        events = DEMO_EVENTS.corporate
        break
      case 'family':
        text = "Hi there! Maya here, your family travel advisor. I specialize in crafting worry-free group itineraries that kids and parents both love. I've popped up March Madness Final Four and the NBA Finals in Chicago. Ready to plan a memorable family sports trip?"
        events = DEMO_EVENTS.family
        break
      case 'solo':
        text = "Greetings. I'm Jax, focused on solo luxury travel, fine dining, and exclusive nightclub bookings. I've highlighted the Grammy VIP Experience, Michelin-starred Nobu, and private lounges on your map. Let me secure your exclusive tables or sections."
        events = DEMO_EVENTS.solo
        break
      case 'eventscout':
        text = "Scout here! I track game schedules, live team matchups, and ticket markets to follow your favorite teams. I've loaded live MLB, NFL, and NBA games in Atlanta on the map. Ready to check seats, compare tailgate zones, or lock in game tickets?"
        events = DEMO_EVENTS.eventscout
        break
      case 'concert':
        text = "Hey! Lyric here, your live music and festival curator. I specialize in concerts, theater plays, and DJ nights. I've popped the Coachella festival, Rolling Loud Miami, and the Beyoncé World Tour on your map. Ready to track concert tickets and flight packages?"
        events = DEMO_EVENTS.concert
        break
    }

    registerEvents(events)
    setActiveEventMarkers(events)

    setMessages(prev => [
      ...prev,
      {
        id: 'welcome-' + currentAgent + '-' + Date.now(),
        isUser: false,
        agentKey: currentAgent,
        timestamp: new Date(),
        text,
        events
      }
    ])

    let replies: QuickReply[] = []
    if (currentAgent === 'corporate') {
      replies = [
        { text: 'Reserve Premium Suite' },
        { text: 'Client dinner at Nobu' },
        { text: 'Super Bowl corporate box' }
      ]
    } else if (currentAgent === 'family') {
      replies = [
        { text: 'Tickets to Zoo Atlanta' },
        { text: 'Final Four family package' },
        { text: 'Georgia Aquarium tickets' }
      ]
    } else if (currentAgent === 'solo') {
      replies = [
        { text: 'Reserve a VIP section' },
        { text: 'Book Nobu Atlanta table' },
        { text: 'Grammy luxury VIP suite' }
      ]
    } else if (currentAgent === 'eventscout') {
      replies = [
        { text: 'Atlanta Braves game tickets' },
        { text: 'Compare tailgate parking' },
        { text: 'Hawks vs Knicks ticket pricing' }
      ]
    } else {
      replies = [
        { text: 'Coachella VIP passes' },
        { text: 'Earlybirds Club DJ tickets' },
        { text: 'Beyoncé concert flight package' }
      ]
    }
    setQuickReplies(replies)

    if (events.length > 0 && mapRef.current) {
      const centerCoords = events[0].coords
      mapRef.current.getMap().flyTo({ center: centerCoords, zoom: 10, pitch: 45, duration: 1500 })
    }

    showToast('Agent Switched', `${AGENTS[currentAgent].name} is now your active advisor`)
  }, [currentAgent, registerEvents, showToast])

  const typeThenMsg = useCallback((delay: number, duration: number, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    schedule(delay, () => setIsTyping(true))
    schedule(delay + duration, () => { setIsTyping(false); setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).slice(2), timestamp: new Date() }]) })
  }, [schedule])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      typeThenMsg(0, 600, { isUser: false, agentKey: currentAgent, text: "Your browser can't share location — just tell me what city you're starting from." })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        const ap = nearestAirport(coords[0], coords[1])
        setOrigin({ city: ap.city, coords, airport: ap })
        setLocating(false)
        typeThenMsg(0, 700, { isUser: false, agentKey: currentAgent, text: `Got it — you're near ${ap.city} (home airport ${ap.name}). I'll flag what's local to you and only add a flight when you're actually traveling.` })
      },
      () => {
        setLocating(false)
        typeThenMsg(0, 700, { isUser: false, agentKey: currentAgent, text: "No worries — I won't use your location. Just type the city you'd start from and I'll take it from there." })
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    )
  }, [currentAgent, typeThenMsg])

  const setTypedOrigin = useCallback(async (q: string) => {
    if (!q.trim()) return
    const resolved = await resolveOrigin(q)
    if (!resolved) {
      typeThenMsg(0, 600, { isUser: false, agentKey: currentAgent, text: `I couldn't place "${q.trim()}" — try a city like "Los Angeles" or "Miami".` })
      return
    }
    setOrigin(resolved)
    setOriginInput('')
    typeThenMsg(0, 700, { isUser: false, agentKey: currentAgent, text: `Set — starting from ${resolved.city} (home airport ${resolved.airport.name}). Flights priced from there.` })

    // Wire up Duffel flight search
    if (selectedEvent) {
      const isLocal = haversineMiles(resolved.coords, selectedEvent.coords) < 75
      if (!isLocal) {
        const depLoc = airports.find(a => a.code.toLowerCase() === resolved.airport.name.toLowerCase()) || {
          id: 'dep-' + resolved.airport.name,
          city: resolved.city,
          airport: `${resolved.airport.name} Airport`,
          code: resolved.airport.name,
          coordinates: resolved.airport.coords
        }
        const arrLoc = airports.find(a => a.code.toLowerCase() === selectedEvent.airport.name.toLowerCase()) || {
          id: 'arr-' + selectedEvent.airport.name,
          city: selectedEvent.location.split(',')[0],
          airport: `${selectedEvent.airport.name} Airport`,
          code: selectedEvent.airport.name,
          coordinates: selectedEvent.airport.coords
        }
        setDeparture(depLoc)
        setArrival(arrLoc)
        setDepartureDate(dateToYYYYMMDD(selectedEvent.date))
        setTripType('One Way')
        setActiveCategory('Flights')
        submitSearch()
        showToast('Duffel Integration', `Querying real-time flights from ${resolved.airport.name} to ${selectedEvent.airport.name}...`)
      }
    }
  }, [currentAgent, typeThenMsg, selectedEvent, setDeparture, setArrival, setDepartureDate, setTripType, setActiveCategory, submitSearch, showToast])

  // ── Demo startup flow ────────────────────────────────────────────────────────
  useEffect(() => {
    typeThenMsg(600, 1500, { isUser: false, agentKey: 'corporate', text: "Welcome to FlyDnA. I'm Alex, your Corporate Travel Director. I specialize in building high-impact group experiences around the world's biggest events." })
    typeThenMsg(2500, 1500, { isUser: false, agentKey: 'corporate', text: "I see you're planning something for Q1 2027. Let me pull the hottest events with the best group value right now..." })
    schedule(4300, async () => {
      const real = await fetchRealEvents('Atlanta')
      const events = real.length ? real.slice(0, 6) : DEMO_EVENTS.corporate
      registerEvents(events)
      setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), isUser: false, agentKey: 'corporate' as AgentKey, timestamp: new Date(), events }])
      setActiveEventMarkers(events)
      setQuickReplies(events.slice(0, 4).map(e => ({ text: `Tell me about ${e.title}`, eventId: e.id })))
      showToast('Event Intelligence', real.length ? `${events.length} live events found near Atlanta` : '5 major events found with group availability')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Select event ─────────────────────────────────────────────────────────────
  const handleSelectEvent = useCallback((eventId: string, agentOverride?: AgentKey) => {
    let event: EventData | null = eventPool.current[eventId] ?? null
    if (!event) {
      for (const evts of Object.values(DEMO_EVENTS)) {
        const found = evts.find(e => e.id === eventId)
        if (found) { event = found; break }
      }
    }
    if (!event) return
    const evt = event
    const agent = agentOverride ?? currentAgent

    setSelectedEvent(evt)
    setActiveEventMarkers([evt])
    setShowPackagePanel(false)
    setSelectedTier(null)
    setQuickReplies([])

    schedule(0, () => {
      mapRef.current?.getMap().flyTo({ center: evt.coords, zoom: 12, pitch: 60, bearing: 30, duration: 2000 })
    })

    typeThenMsg(0, 1200, {
      isUser: false, agentKey: agent,
      text: `Excellent choice — ${evt.title}. I've mapped the venue, ${evt.hotels.length} hotel tiers, and the nearest airport. Let me build your package options...`,
    })

    schedule(2200, () => {
      const isLocal = !!origin && haversineMiles(origin.coords, evt.coords) < 75
      const fromAirport = origin?.airport.name
      let pkgs: PackageItem[]
      if (isLocal) {
        pkgs = [{
          hotel: { name: 'No stay needed', price: 0, coords: evt.coords, tier: 'budget' },
          event: evt, isLocal: true, fromAirport,
          valueScore: 96,
          total: 140,
        }]
      } else {
        pkgs = evt.hotels.map(hotel => ({
          hotel, event: evt, isLocal: false, fromAirport,
          valueScore: Math.round(65 + Math.random() * 30),
          total: Math.round(450 + hotel.price * 3 + 180),
        }))

        // Wire up Duffel flight search
        if (origin) {
          const depLoc = airports.find(a => a.code.toLowerCase() === origin.airport.name.toLowerCase()) || {
            id: 'dep-' + origin.airport.name,
            city: origin.city,
            airport: `${origin.airport.name} Airport`,
            code: origin.airport.name,
            coordinates: origin.airport.coords
          }
          const arrLoc = airports.find(a => a.code.toLowerCase() === evt.airport.name.toLowerCase()) || {
            id: 'arr-' + evt.airport.name,
            city: evt.location.split(',')[0],
            airport: `${evt.airport.name} Airport`,
            code: evt.airport.name,
            coordinates: evt.airport.coords
          }
          setDeparture(depLoc)
          setArrival(arrLoc)
          setDepartureDate(dateToYYYYMMDD(evt.date))
          setTripType('One Way')
          setActiveCategory('Flights')
          submitSearch()
          showToast('Duffel Integration', `Querying real-time flights from ${origin.airport.name} to ${evt.airport.name}...`)
        }
      }
      setPackages(pkgs)
      setMessages(prev => [...prev, { id: Math.random().toString(36).slice(2), isUser: false, agentKey: agent, timestamp: new Date(), packages: pkgs }])
      setShowPackagePanel(true)
      showToast(isLocal ? 'Local Plan Ready' : 'Packages Ready', isLocal ? "No flight needed — you're local" : `${evt.hotels.length} tiers calculated`)
    })
  }, [currentAgent, schedule, typeThenMsg, showToast, origin, setDeparture, setArrival, setDepartureDate, setTripType, setActiveCategory, submitSearch])

  // ── Book package ─────────────────────────────────────────────────────────────
  const handleBook = useCallback((tier: TierKey) => {
    setSelectedTier(tier)
    showToast('Booking Initiated', `${tier.charAt(0).toUpperCase() + tier.slice(1)} package selected`)
    typeThenMsg(0, 1000, {
      isUser: false, agentKey: currentAgent,
      text: `Perfect. I've locked in your ${tier} tier. Your Value Index on this package is exceptional — ${tier === 'executive' ? 'VIP suite access and red-carpet proximity' : tier === 'standard' ? 'premium seating and group rates' : 'maximum value with shoulder-date savings'}. Ready to finalize?`,
    })
    schedule(1400, () => setQuickReplies([
      { text: 'Yes, book it now' }, { text: 'Add travel insurance' }, { text: 'Share with my group' }, { text: 'Save for later' },
    ]))
  }, [currentAgent, showToast, typeThenMsg, schedule])

  // ── Customize package ────────────────────────────────────────────────────────
  const handleCustomize = useCallback((tier: TierKey) => {
    showToast('Customizer', `Opening ${tier} package customizer...`)
    typeThenMsg(0, 800, {
      isUser: false, agentKey: currentAgent,
      text: `Let's customize your ${tier} package. What would you like to adjust — flights, hotel nights, add-on experiences, or alternate dates?`,
    })
    schedule(1000, () => setQuickReplies([
      { text: 'Add extra night' }, { text: 'Upgrade to first class' }, { text: 'Add after-party access' }, { text: 'Show alternate dates' },
    ]))
  }, [currentAgent, showToast, typeThenMsg, schedule])

  // ── Send message ─────────────────────────────────────────────────────────────
  const askConcierge = useCallback(async (userText: string) => {
    const text = userText.trim()
    if (!text) return

    setMessages(prev => [...prev, {
      id: Math.random().toString(36).slice(2),
      isUser: true, agentKey: currentAgent, timestamp: new Date(), text
    }])

    // Check if the query asks for Ticketmaster events in a city
    const match = text.match(/(?:events|concerts|shows|games|tickets|hottest events|search|find)\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i)
    const cityFromMatch = match ? match[1].trim() : null
    const CITIES = ['atlanta', 'new york', 'nyc', 'miami', 'los angeles', 'la', 'chicago', 'las vegas']
    const cityFound = CITIES.find(c => text.toLowerCase().includes(c))
    const searchCity = cityFromMatch || (cityFound ? (cityFound === 'nyc' ? 'New York' : cityFound === 'la' ? 'Los Angeles' : cityFound) : null)

    if (searchCity) {
      setIsTyping(true)
      try {
        const real = await fetchRealEvents(searchCity)
        if (real.length > 0) {
          const events = real.slice(0, 6)
          registerEvents(events)
          setMessages(prev => [...prev, {
            id: Math.random().toString(36).slice(2),
            isUser: false,
            agentKey: currentAgent,
            timestamp: new Date(),
            text: `I've queried Ticketmaster for real-time events in ${searchCity.charAt(0).toUpperCase() + searchCity.slice(1)}. Here are the top events with group value:`,
            events
          }])
          setActiveEventMarkers(events)
          setQuickReplies(events.slice(0, 4).map(e => ({ text: `Tell me about ${e.title}`, eventId: e.id })))
          setSelectedEvent(events[0])
          showToast('Ticketmaster Intelligence', `Found ${real.length} live events in ${searchCity}`)
          
          if (mapRef.current) {
            mapRef.current.getMap().flyTo({ center: events[0].coords, zoom: 13, pitch: 55, bearing: 15, duration: 2000 })
          }
          
          setIsTyping(false)
          return
        }
      } catch (err) {
        console.error("Ticketmaster concierge search failed:", err)
      }
    }

    const history = [
      ...messages.filter(m => m.text).map(m => ({
        role: m.isUser ? 'user' : 'assistant', content: m.text as string
      })),
      { role: 'user', content: text }
    ]

    setIsTyping(true)
    try {
      const res = await fetch(`${API_BASE}/api/concierge/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem("flydna_token") ? { Authorization: `Bearer ${localStorage.getItem("flydna_token")}` } : {}) },
        body: JSON.stringify({ messages: history })
      })
      const data = await res.json()
      const rawReply = data?.reply || "Hmm, I glitched — say that again?"

      const { cleanedText, events } = parseConversationalEvents(rawReply)

      if (events.length > 0) {
        registerEvents(events)
        setActiveEventMarkers(events)
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).slice(2),
          isUser: false, agentKey: currentAgent, timestamp: new Date(),
          text: cleanedText,
          events
        }])

        setSelectedEvent(events[0])
        showToast('Map Intelligence', `Focused on ${events[0].title} at ${events[0].location}`)

        if (mapRef.current) {
          mapRef.current.getMap().flyTo({ center: events[0].coords, zoom: 13, pitch: 55, bearing: 15, duration: 2000 })
        }
      } else {
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).slice(2),
          isUser: false, agentKey: currentAgent, timestamp: new Date(), text: rawReply
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        isUser: false, agentKey: currentAgent, timestamp: new Date(), text: "Connection hiccup — try me again."
      }])
    } finally {
      setIsTyping(false)
    }
  }, [messages, currentAgent, registerEvents, setActiveEventMarkers, setQuickReplies, showToast, setSelectedEvent])

  const handleSend = useCallback((overrideText?: string) => {
    const msg = overrideText ?? inputValue.trim()
    if (!msg) return
    setInputValue('')
    setQuickReplies([])
    askConcierge(msg)
  }, [inputValue, askConcierge])

  // ── Route GeoJSON ─────────────────────────────────────────────────────────────
  const routeGeoJSON = useMemo(() => {
    if (!selectedEvent) return null
    return {
      type: 'Feature' as const, properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: [selectedEvent.airport.coords, selectedEvent.coords, ...selectedEvent.hotels.map(h => h.coords)],
      },
    }
  }, [selectedEvent])

  const agent = AGENTS[currentAgent]

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', fontFamily: "'Inter', sans-serif", background: '#0a0e1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        .ai-scroll::-webkit-scrollbar{width:4px}.ai-scroll::-webkit-scrollbar-track{background:transparent}.ai-scroll::-webkit-scrollbar-thumb{background:#2a3350;border-radius:4px}
        @keyframes ai-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ai-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
        .ai-msg{animation:ai-in 0.3s ease-out}
        .ai-dot{animation:ai-bounce 1.4s infinite ease-in-out}
        .ai-event-card:hover{border-color:#6366f1!important;transform:translateY(-2px);box-shadow:0 8px 30px rgba(99,102,241,0.15)!important}
        .ai-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 30px rgba(99,102,241,0.4)!important}
        .ai-qr:hover{border-color:#6366f1!important;color:#f1f5f9!important;background:rgba(99,102,241,0.1)!important}
        .ai-tab:hover{background:#232942!important;border-color:#6366f1!important}
        .ai-pkg-row:hover{border-color:#6366f1!important}
        .ai-close:hover{background:rgba(244,63,94,0.2)!important;border-color:#f43f5e!important;color:#f43f5e!important}
        .mapboxgl-popup-content{background:#1a1f35!important;border:1px solid #2a3350!important;border-radius:12px!important;padding:16px!important;color:#f1f5f9!important;font-family:'Inter',sans-serif!important}
      `}</style>

      {/* ── CHAT PANEL ──────────────────────────────────────────────────────── */}
      <div style={{ width: 420, minWidth: 420, background: '#111827', borderRight: '1px solid #2a3350', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '4px 0 24px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a3350', background: 'linear-gradient(135deg,rgba(99,102,241,0.1) 0%,rgba(168,85,247,0.05) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button
              onClick={onClose}
              title="Back to Dashboard (Esc)"
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #2a3350', background: '#1a1f35', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3350'; e.currentTarget.style.color = '#94a3b8' }}
            >←</button>
            <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#6366f1,#a855f7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>FD</div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: -0.5, background: 'linear-gradient(90deg,#fff,#a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FlyDnA</h1>
              <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.5 }}>Agentic AI Concierge</p>
            </div>
          </div>
          {/* Agent tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {(Object.entries(AGENTS) as [AgentKey, Agent][]).map(([key, a]) => (
              <button key={key} className="ai-tab" onClick={() => setCurrentAgent(key)} style={{
                padding: '7px 12px', borderRadius: 10, border: `1px solid ${currentAgent === key ? '#6366f1' : '#2a3350'}`,
                background: currentAgent === key ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.15))' : '#1a1f35',
                color: currentAgent === key ? '#f1f5f9' : '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: currentAgent === key ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: currentAgent === key ? a.color : '#64748b', boxShadow: currentAgent === key ? `0 0 6px ${a.color}` : 'none', flexShrink: 0 }} />
                {a.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map(msg => (
            <div key={msg.id} className="ai-msg" style={{ maxWidth: '95%', alignSelf: msg.isUser ? 'flex-end' : 'flex-start' }}>
              {!msg.isUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${AGENTS[msg.agentKey].color},${AGENTS[msg.agentKey].color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white' }}>{AGENTS[msg.agentKey].avatar}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{AGENTS[msg.agentKey].name}</span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.3)' }}>{AGENTS[msg.agentKey].title}</span>
                </div>
              )}
              {msg.text && (
                <div style={{ padding: '13px 17px', borderRadius: 16, fontSize: 13.5, lineHeight: 1.6, background: msg.isUser ? 'linear-gradient(135deg,#6366f1,#a855f7)' : '#1a1f35', border: msg.isUser ? 'none' : '1px solid #2a3350', color: 'white', borderBottomLeftRadius: msg.isUser ? 16 : 4, borderBottomRightRadius: msg.isUser ? 4 : 16, boxShadow: msg.isUser ? '0 4px 20px rgba(99,102,241,0.3)' : 'none' }}>
                  {msg.text}
                </div>
              )}
              {msg.events?.map(evt => <EventCard key={evt.id} event={evt} onSelect={handleSelectEvent} />)}
              {msg.packages?.map((pkg, i) => <PackagePreview key={i} pkg={pkg} onBook={handleBook} onCustomize={handleCustomize} />)}
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 5, textAlign: msg.isUser ? 'right' : 'left' }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="ai-msg" style={{ alignSelf: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${agent.color},${agent.color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'white' }}>{agent.avatar}</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{agent.name}</span>
              </div>
              <div style={{ padding: 18, borderRadius: 16, background: '#1a1f35', border: '1px solid #2a3350', display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} className="ai-dot" style={{ display: 'block', width: 6, height: 6, background: '#6366f1', borderRadius: '50%', animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* Quick replies */}
          {quickReplies.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 36 }}>
              {quickReplies.map((r, i) => (
                <button key={i} className="ai-qr" onClick={() => { setQuickReplies([]); r.eventId ? handleSelectEvent(r.eventId) : handleSend(r.text) }} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid #2a3350', background: '#0a0e1a', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                  {r.text}
                </button>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Origin bar */}
        <div style={{ padding: '0 24px 12px' }}>
          {origin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
              <span style={{ color: '#10b981' }}>📍 Starting from {origin.city} · {origin.airport.name}</span>
              <button onClick={() => setOrigin(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>change</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={requestLocation} disabled={locating} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 12, border: '1px solid #2a3350', background: '#1a1f35', color: '#94a3b8', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                📍 {locating ? 'Locating…' : 'Use my location'}
              </button>
              <input
                value={originInput}
                onChange={e => setOriginInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setTypedOrigin(originInput) } }}
                placeholder="or type a city…"
                style={{ flex: 1, background: '#1a1f35', border: '1px solid #2a3350', borderRadius: 12, padding: '9px 12px', color: '#f1f5f9', fontSize: 12, outline: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '14px 24px 24px', borderTop: '1px solid #2a3350' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: '#1a1f35', border: '1px solid #2a3350', borderRadius: 16, padding: '12px 16px' }}>
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Tell me about your trip..."
              rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 14, fontFamily: "'Inter',sans-serif", resize: 'none', maxHeight: 100 }}
            />
            <button onClick={() => handleSend()} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} width={18} height={18}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAP PANEL ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          transformRequest={mapboxTransformRequest}
          initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 3.5, pitch: 45, bearing: -15 }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          {/* Event markers */}
          {activeEventMarkers.map(evt => {
            const logo = getEventLogo(evt.title, evt.location)
            return (
              <Marker key={evt.id} longitude={evt.coords[0]} latitude={evt.coords[1]}>
                <div 
                  onClick={() => handleSelectEvent(evt.id)} 
                  title={evt.title} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    background: '#0a0e1a', 
                    border: '2px solid #f43f5e', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 4px 20px rgba(244,63,94,0.5)', 
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  {logo ? (
                    <img src={logo} alt={evt.title} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: 16 }}>🎯</span>
                  )}
                </div>
              </Marker>
            )
          })}

          {/* Hotel markers */}
          {selectedEvent?.hotels.map(h => (
            <Marker key={h.name} longitude={h.coords[0]} latitude={h.coords[1]}>
              <div 
                title={`${h.name} — $${h.price}/night`} 
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)', 
                  cursor: 'pointer' 
                }}
              >
                {getHotelLogo(h.name)}
              </div>
            </Marker>
          ))}

          {/* Airport marker */}
          {selectedEvent && (
            <Marker longitude={selectedEvent.airport.coords[0]} latitude={selectedEvent.airport.coords[1]}>
              <div title={selectedEvent.airport.name} style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(6,182,212,0.4)', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14 }}>✈️</div>
            </Marker>
          )}

          {/* Route line */}
          {routeGeoJSON && (
            <Source key={selectedEvent?.id} id="aiagent-route" type="geojson" data={routeGeoJSON}>
              <Layer id="aiagent-route-line" type="line" layout={{ 'line-join': 'round', 'line-cap': 'round' }} paint={{ 'line-color': '#f59e0b', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [2, 2] }} />
            </Source>
          )}
        </Map>

        {/* Map top overlay: search + legend */}
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', zIndex: 5 }}>
          <div className="glass-panel-heavy" style={{ borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, pointerEvents: 'auto' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Search events, venues, cities..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: 13, width: '100%' }} />
          </div>
          <div className="glass-panel-heavy" style={{ display: 'flex', gap: 10, borderRadius: 12, padding: '10px 14px' }}>
            {[{ label: 'Event', color: '#f43f5e' }, { label: 'Hotel', color: '#6366f1' }, { label: 'Airport', color: '#06b6d4' }, { label: 'Route', color: '#f59e0b' }].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* Floating selected event detail overlay (visible when selectedEvent is set and packages panel is not open yet) */}
        {selectedEvent && !showPackagePanel && (
          <div className="glass-panel-heavy" style={{ position: 'absolute', bottom: 30, right: 30, width: 340, borderRadius: 20, padding: 18, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: 12, overflow: 'hidden' }}>
              <img 
                src={(() => {
                  const locLower = selectedEvent.location.toLowerCase()
                  const titleLower = selectedEvent.title.toLowerCase()
                  for (const [k, v] of Object.entries(VENUE_IMAGES)) {
                    if (locLower.includes(k) || titleLower.includes(k)) return v
                  }
                  return 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&auto=format&fit=crop&q=80'
                })()} 
                alt={selectedEvent.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#f1f5f9', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '3px 8px', borderRadius: 12 }}>{selectedEvent.category}</span>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginTop: 8, marginBottom: 4 }}>{selectedEvent.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>📍 {selectedEvent.location}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>📅 {selectedEvent.date}</p>
            </div>
            <button 
              onClick={() => {
                handleSelectEvent(selectedEvent.id)
              }} 
              className="glass-button text-foreground hover:text-foreground font-semibold py-2.5 rounded-lg w-full tracking-wider cursor-pointer"
            >
              🎟️ Book Now
            </button>
          </div>
        )}

        {/* Floating package panel */}
        {showPackagePanel && packages.length > 0 && (
          <div className="ai-scroll glass-panel-heavy" style={{ position: 'absolute', bottom: 30, right: 30, width: 360, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', borderRadius: 20, padding: 24, zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Smart Packages</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--sidebar-accent)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 20 }}>{packages.length} option{packages.length === 1 ? '' : 's'}</span>
            </div>
            {packages.map((pkg, i) => {
              const colors: Record<TierKey, string> = { executive: '#f59e0b', standard: '#6366f1', budget: '#10b981' }
              const isSelected = selectedTier === pkg.hotel.tier
              return (
                <div key={i} className="ai-pkg-row" onClick={() => handleBook(pkg.hotel.tier)} style={{ background: isSelected ? 'linear-gradient(135deg,rgba(99,102,241,0.06),transparent)' : 'var(--sidebar-accent)', border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 14, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)', textTransform: 'capitalize' }}>{pkg.isLocal ? 'Local Plan' : pkg.hotel.tier}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#06b6d4' }}>${pkg.total}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{pkg.isLocal ? 'Tickets + ground · local, no flight' : `${pkg.hotel.name} · 3 nights · ${pkg.event.airport.name}`}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pkg.valueScore}%`, background: colors[pkg.hotel.tier], borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pkg.valueScore} VI</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── CLOSE BUTTON ─────────────────────────────────────────────────────── */}
      <button className="ai-close glass-button hover:text-foreground" onClick={onClose} title="Close AI Concierge" style={{ position: 'absolute', top: 18, right: 18, zIndex: 10000, width: 38, height: 38, borderRadius: '50%', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ×
      </button>

      {/* ── TOAST ────────────────────────────────────────────────────────────── */}
      <div className="glass-panel-heavy" style={{ position: 'fixed', top: 24, right: 64, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10001, transform: toast.visible ? 'translateX(0)' : 'translateX(140%)', transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'none' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🎯</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>{toast.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{toast.message}</div>
        </div>
      </div>
    </div>
  )
}

