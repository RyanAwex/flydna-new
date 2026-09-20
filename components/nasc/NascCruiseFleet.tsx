'use client'

/**
 * CruiseFleet — FlyDnA NASC maritime layer (v3)
 *
 * Cruise ships render as a NATIVE Mapbox symbol layer (sit on water, scale with
 * zoom, rotate to heading). Routes are hand-placed in real water:
 *   • Miami — Government Cut + Atlantic
 *   • NYC   — Upper Bay, circling the Statue of Liberty toward the Narrows
 *
 * The USS Intrepid is NOT drawn — Mapbox's map style already renders the real
 * 3D carrier at Pier 86. We just lay an (almost) invisible click zone over it
 * that opens a Book Tickets card.
 *
 * Three fly-to buttons frame the water / the Intrepid.
 *
 * Drop-in replacement for app/components/CruiseFleet.tsx — no other file changes.
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from 'react-map-gl/mapbox'

type LngLat = [number, number]

/* ── CRUISE SHIP ICON (sleek top-down vessel, cyan, points north) ───────────── */
const CRUISE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="96" viewBox="0 0 48 96">
  <defs><linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#bdf6ff"/><stop offset="0.5" stop-color="#00e5ff"/><stop offset="1" stop-color="#0094bb"/>
  </linearGradient></defs>
  <path d="M24 4 C30 16 34 24 34 40 L34 80 C34 88 30 92 24 92 C18 92 14 88 14 80 L14 40 C14 24 18 16 24 4 Z" fill="url(#h)" stroke="#fff" stroke-width="2"/>
  <path d="M24 22 L29 40 L29 74 L19 74 L19 40 Z" fill="#fff" opacity="0.22"/>
  <circle cx="24" cy="13" r="2.4" fill="#fff"/>
</svg>`.trim()

/* ── WATER ROUTES (every point verified open water) ─────────────────────────── */
const RAW_ROUTES: Record<string, LngLat[]> = {
  // PortMiami / Government Cut → Atlantic loop
  miamiCut: [
    [-80.130, 25.766], [-80.105, 25.762], [-80.080, 25.755], [-80.070, 25.730],
    [-80.085, 25.715], [-80.110, 25.720], [-80.120, 25.745], [-80.130, 25.766],
  ],
  // NY Upper Bay — circle the Statue of Liberty, head toward the Narrows
  nyHarbor: [
    [-74.014, 40.697], [-74.026, 40.694], [-74.036, 40.691], [-74.041, 40.686],
    [-74.040, 40.680], [-74.036, 40.672], [-74.039, 40.660], [-74.043, 40.650],
    [-74.037, 40.663], [-74.030, 40.678], [-74.020, 40.690], [-74.014, 40.697],
  ],
}

/* ── FLY-TO VIEWS ───────────────────────────────────────────────────────────── */
const VIEWS: Record<string, { label: string; center: LngLat; zoom: number; pitch: number; bearing: number }> = {
  MIA: { label: '⚓ MIA HARBOR', center: [-80.135, 25.760], zoom: 13.2, pitch: 56, bearing: 40 },
  NY: { label: '⚓ NY HARBOR', center: [-74.035, 40.683], zoom: 12.7, pitch: 55, bearing: 25 },
  INTREPID: { label: '🎟️ INTREPID', center: [-73.999, 40.763], zoom: 14.6, pitch: 62, bearing: -35 },
}

/* ── INTREPID (real 3D model — we only add a click zone) ─────────────────────── */
const INTREPID = {
  id: 'INTREPID',
  name: 'USS INTREPID',
  line: 'Sea, Air & Space Museum',
  coord: [-74.001, 40.7648] as LngLat,
  price: '$36',
  ports: ['PIER 86 · HUDSON RIVER'],
  blurb: 'WWII aircraft carrier turned museum — home of the Space Shuttle Enterprise, a British Airways Concorde, and the submarine USS Growler.',
}

/* ── FLEET (cruise ships only) ──────────────────────────────────────────────── */
interface Ship {
  id: string; name: string; line: string; guests: string; price: string
  route?: string; dock?: LngLat; start?: number
  status: 'UNDERWAY' | 'ANCHORED'; ports: string[]
}
const FLEET: Ship[] = [
  {
    id: 'FDN-001', name: 'UTOPIA OF THE SEAS', line: 'Royal Caribbean', guests: '5,668', price: '$799',
    route: 'miamiCut', start: 0.0, status: 'UNDERWAY', ports: ['MIAMI', 'NASSAU', 'CAYMAN', 'MIAMI']
  },
  {
    id: 'FDN-002', name: 'ICON OF THE SEAS', line: 'Royal Caribbean', guests: '7,600', price: '$949',
    route: 'miamiCut', start: 1.2, status: 'UNDERWAY', ports: ['MIAMI', 'COZUMEL', 'MIAMI']
  },
  {
    id: 'FDN-003', name: 'WONDER OF THE SEAS', line: 'Royal Caribbean', guests: '6,988', price: '$729',
    dock: [-80.178, 25.773], status: 'ANCHORED', ports: ['MIAMI', 'ST. THOMAS', 'MIAMI']
  },
  {
    id: 'FDN-010', name: 'NORWEGIAN JOY', line: 'Norwegian Cruise Line', guests: '3,883', price: '$649',
    route: 'nyHarbor', start: 0.0, status: 'UNDERWAY', ports: ['NEW YORK', 'STATUE OF LIBERTY', 'BERMUDA']
  },
  {
    id: 'FDN-011', name: 'NORWEGIAN PRIMA', line: 'Norwegian Cruise Line', guests: '3,100', price: '$699',
    route: 'nyHarbor', start: 2.6, status: 'UNDERWAY', ports: ['NEW YORK', 'BAHAMAS', 'NEW YORK']
  },
]

/* ── PATH MATH (constant real-world speed, smooth at any zoom) ───────────────── */
interface Path { coords: LngLat[]; segs: { a: LngLat; b: LngLat; len: number; start: number }[]; total: number }
function makePath(coords: LngLat[]): Path {
  const segs: Path['segs'] = []; let total = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i], b = coords[i + 1]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    segs.push({ a, b, len, start: total }); total += len
  }
  return { coords, segs, total }
}
function pathPos(p: Path, dist: number): LngLat {
  let d = ((dist % p.total) + p.total) % p.total
  for (const s of p.segs) {
    if (d <= s.start + s.len) {
      const f = s.len === 0 ? 0 : (d - s.start) / s.len
      return [s.a[0] + (s.b[0] - s.a[0]) * f, s.a[1] + (s.b[1] - s.a[1]) * f]
    }
  }
  return p.coords[0]
}
function heading(from: LngLat, to: LngLat): number {
  return (Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI
}
const PATHS: Record<string, Path> = Object.fromEntries(
  Object.entries(RAW_ROUTES).map(([k, v]) => [k, makePath(v)])
)
const BASE_SPEED = 0.00035

/* ── COMPONENT ──────────────────────────────────────────────────────────────── */
export default function NascCruiseFleet() {
  const { current: mapRef } = useMap()
  const cruiseImg = useRef<HTMLImageElement | null>(null)
  const [selected, setSelected] = useState<number | null>(null)   // FLEET index
  const [showIntrepid, setShowIntrepid] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // preload cruise icon
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      cruiseImg.current = img
      const m = mapRef?.getMap()
      if (m && !m.hasImage('fly-cruise')) { try { m.addImage('fly-cruise', img) } catch { } }
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(CRUISE_SVG)
  }, [mapRef])

  useEffect(() => {
    if (!mapRef) return
    const map = mapRef.getMap()

    const dist = FLEET.map(s => s.start ?? 0)
    const wakes: LngLat[][] = FLEET.map(() => [])
    let frame = 0, rafId = 0

    const addImg = () => {
      if (cruiseImg.current && !map.hasImage('fly-cruise')) { try { map.addImage('fly-cruise', cruiseImg.current) } catch { } }
    }

    const buildShips = (now: number) => ({
      type: 'FeatureCollection' as const,
      features: FLEET.map((s, i) => {
        let pos: LngLat, bearing = 0
        if (s.status === 'UNDERWAY' && s.route) {
          const path = PATHS[s.route]
          pos = pathPos(path, dist[i])
          bearing = heading(pos, pathPos(path, dist[i] + 0.01))
          const w = wakes[i]; const last = w[w.length - 1]
          if (last && Math.hypot(pos[0] - last[0], pos[1] - last[1]) > 0.3) w.length = 0
          if (frame % 2 === 0) { w.push(pos); if (w.length > 60) w.shift() }
        } else {
          const d = s.dock as LngLat
          pos = [d[0], d[1] + Math.sin(now / 900 + i) * 0.00012]
          bearing = 35
        }
        return {
          type: 'Feature' as const,
          properties: { idx: i, bearing },
          geometry: { type: 'Point' as const, coordinates: pos },
        }
      }),
    })

    const buildWakes = () => ({
      type: 'FeatureCollection' as const,
      features: wakes.map((w, i) => ({ w, i })).filter(({ w }) => w.length > 1)
        .map(({ w, i }) => ({
          type: 'Feature' as const, properties: { idx: i },
          geometry: { type: 'LineString' as const, coordinates: w }
        })),
    })

    const setup = () => {
      addImg()
      if (!map.getSource('fly-wakes')) map.addSource('fly-wakes', { type: 'geojson', lineMetrics: true, data: buildWakes() })
      if (!map.getSource('fly-ships')) map.addSource('fly-ships', { type: 'geojson', data: buildShips(performance.now()) })
      if (!map.getSource('fly-intrepid')) map.addSource('fly-intrepid', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: INTREPID.coord } } as any,
      })

      // wake trail
      if (!map.getLayer('fly-wakes-line')) map.addLayer({
        id: 'fly-wakes-line', type: 'line', source: 'fly-wakes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 4],
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, 'rgba(0,229,255,0)', 1, 'rgba(0,229,255,0.8)'],
        },
      })

      // Intrepid click zone — nearly invisible (1% cyan) but fully clickable
      if (!map.getLayer('fly-intrepid-hit')) map.addLayer({
        id: 'fly-intrepid-hit', type: 'circle', source: 'fly-intrepid',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 14, 15, 48, 17, 95],
          'circle-color': '#00e5ff', 'circle-opacity': 0.01,
        },
      })

      // soft glow under cruise ships
      if (!map.getLayer('fly-ships-glow')) map.addLayer({
        id: 'fly-ships-glow', type: 'circle', source: 'fly-ships',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 12, 12, 22, 15, 34],
          'circle-color': '#00e5ff', 'circle-opacity': 0.14, 'circle-blur': 1,
        },
      })

      // cruise ship icon
      if (!map.getLayer('fly-cruise-symbol')) map.addLayer({
        id: 'fly-cruise-symbol', type: 'symbol', source: 'fly-ships',
        layout: {
          'icon-image': 'fly-cruise',
          'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 11, 0.85, 13, 1.15, 15, 1.45, 17, 1.7],
          'icon-rotate': ['get', 'bearing'],
          'icon-rotation-alignment': 'map', 'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true, 'icon-ignore-placement': true,
        },
      })
    }

    const onMissing = (e: any) => { if (e.id === 'fly-cruise') addImg() }
    const onCruiseClick = (e: any) => {
      const idx = e?.features?.[0]?.properties?.idx
      if (idx !== undefined) { setShowIntrepid(false); setSelected(Number(idx)) }
    }
    const onIntrepidClick = () => { setSelected(null); setShowIntrepid(true) }
    const onEnter = () => { 
      if (map && map.isStyleLoaded()) {
        try { map.getCanvas().style.cursor = 'pointer' } catch {}
      }
    }
    const onLeave = () => { 
      if (map && map.isStyleLoaded()) {
        try { map.getCanvas().style.cursor = '' } catch {}
      }
    }

    const animate = () => {
      if (!map) return
      if (!map.isStyleLoaded()) {
        rafId = requestAnimationFrame(animate)
        return
      }
      try {
        const zoom = map.getZoom()
        const speed = BASE_SPEED / Math.max(1, Math.pow(1.45, zoom - 7))
        for (let i = 0; i < FLEET.length; i++) if (FLEET[i].status === 'UNDERWAY') dist[i] += speed
        
        const shipsSource = map.getSource('fly-ships')
        if (shipsSource) (shipsSource as any).setData(buildShips(performance.now()))
        
        if (frame % 3 === 0) {
          const wakesSource = map.getSource('fly-wakes')
          if (wakesSource) (wakesSource as any).setData(buildWakes())
        }
        frame++
        rafId = requestAnimationFrame(animate)
      } catch (e) {
        console.warn('CruiseFleet animation frame error:', e)
      }
    }

    if (map) {
      if (map.isStyleLoaded()) setup()
      map.on('style.load', setup)
      map.on('styleimagemissing', onMissing)
      map.on('click', 'fly-cruise-symbol', onCruiseClick)
      map.on('mouseenter', 'fly-cruise-symbol', onEnter)
      map.on('mouseleave', 'fly-cruise-symbol', onLeave)
      map.on('click', 'fly-intrepid-hit', onIntrepidClick)
      map.on('mouseenter', 'fly-intrepid-hit', onEnter)
      map.on('mouseleave', 'fly-intrepid-hit', onLeave)
      rafId = requestAnimationFrame(animate)
    }

    return () => {
      cancelAnimationFrame(rafId)
      if (map) {
        try {
          map.off('style.load', setup)
          map.off('styleimagemissing', onMissing)
          map.off('click', 'fly-cruise-symbol', onCruiseClick)
          map.off('mouseenter', 'fly-cruise-symbol', onEnter)
          map.off('mouseleave', 'fly-cruise-symbol', onLeave)
          map.off('click', 'fly-intrepid-hit', onIntrepidClick)
          map.off('mouseenter', 'fly-intrepid-hit', onEnter)
          map.off('mouseleave', 'fly-intrepid-hit', onLeave)
          
          try {
            if (map.isStyleLoaded()) {
              for (const id of ['fly-cruise-symbol', 'fly-ships-glow', 'fly-intrepid-hit', 'fly-wakes-line']) {
                if (map.getLayer(id)) map.removeLayer(id)
              }
              for (const id of ['fly-ships', 'fly-wakes', 'fly-intrepid']) {
                if (map.getSource(id)) map.removeSource(id)
              }
            }
          } catch (e) {
            // style not loaded or map already destroyed
          }
        } catch (e) {
          console.warn('CruiseFleet cleanup error:', e)
        }
      }
    }
  }, [mapRef])

  const flyView = (key: string) => {
    const m = mapRef?.getMap(); if (!m) return
    const v = VIEWS[key]
    m.flyTo({ center: v.center, zoom: v.zoom, pitch: v.pitch, bearing: v.bearing, duration: 2600, essential: true })
  }

  const ship = selected !== null ? FLEET[selected] : null
  const cruiseAccent = '#00e5ff'
  const museumAccent = '#f5a623'

  return (
    <>
      {/* fly-to buttons */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: 144, left: '50%', transform: 'translateX(-50%)',
          zIndex: 40, display: 'flex', gap: 8
        }}>
          {Object.entries(VIEWS).map(([key, v]) => (
            <button key={key} onClick={() => flyView(key)} style={{
              background: 'rgba(6,0,20,0.82)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,229,255,0.35)', borderRadius: 20,
              padding: '6px 14px', color: '#00e5ff', fontSize: 11, fontFamily: 'monospace',
              letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 0 16px rgba(0,229,255,0.15)',
            }}>{v.label}</button>
          ))}
        </div>,
        document.body
      )}

      {/* cruise booking popup */}
      {mounted && ship && typeof document !== 'undefined' && createPortal(
        <Modal accent={cruiseAccent} onClose={() => setSelected(null)}>
          <div style={{ position: 'relative', background: 'rgba(0,0,0,0.4)' }}>
            <img src="/ship-utopia-cutaway.png" alt={ship.name}
              style={{
                width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block',
                filter: `drop-shadow(0 0 18px ${cruiseAccent}66)`
              }} />
            <div style={{
              position: 'absolute', bottom: 12, right: 16, display: 'flex',
              flexDirection: 'column', alignItems: 'flex-end'
            }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.6)' }}>FROM</span>
              <span style={{
                fontFamily: 'monospace', fontSize: 30, fontWeight: 900, color: cruiseAccent,
                textShadow: `0 0 12px ${cruiseAccent}88`
              }}>{ship.price}</span>
            </div>
          </div>
          <div style={{ padding: '18px 22px 22px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: `${cruiseAccent}aa`, textTransform: 'uppercase' }}>
              {ship.id} · {ship.line}
            </div>
            <h2 style={{
              margin: '4px 0 14px', fontSize: 24, fontWeight: 800, color: '#fff',
              fontFamily: "'Orbitron', sans-serif", letterSpacing: 1
            }}>{ship.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <Stat label="Status" value={ship.status} color={cruiseAccent} />
              <Stat label="Capacity" value={`${ship.guests} guests`} color={cruiseAccent} />
            </div>
            <Route ports={ship.ports} accent={cruiseAccent} label="ITINERARY" />
            <Actions accent={cruiseAccent} primary="🚢 BOOK NOW"
              onPrimary={() => window.open('https://www.royalcaribbean.com/', '_blank')}
              onClose={() => setSelected(null)} />
          </div>
        </Modal>,
        document.body
      )}

      {/* Intrepid tickets popup */}
      {mounted && showIntrepid && typeof document !== 'undefined' && createPortal(
        <Modal accent={museumAccent} onClose={() => setShowIntrepid(false)}>
          <div style={{
            padding: '26px 22px 18px', background: `linear-gradient(135deg, ${museumAccent}22, transparent)`,
            borderBottom: `1px solid ${museumAccent}33`
          }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: `${museumAccent}cc` }}>
              ⚓ NEW YORK CITY · ATTRACTION
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 6,
              fontFamily: "'Orbitron', sans-serif", letterSpacing: 1
            }}>{INTREPID.name}</div>
          </div>
          <div style={{ padding: '18px 22px 22px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: `${museumAccent}aa`, textTransform: 'uppercase' }}>
              {INTREPID.id} · {INTREPID.line}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.5, margin: '10px 0 16px' }}>{INTREPID.blurb}</p>
            <Route ports={INTREPID.ports} accent={museumAccent} label="LOCATION" />
            <Actions accent={museumAccent} primary="🎟️ BOOK TICKETS"
              onPrimary={() => window.open('https://www.intrepidmuseum.org/', '_blank')}
              onClose={() => setShowIntrepid(false)} />
          </div>
        </Modal>,
        document.body
      )}
    </>
  )
}

/* ── small presentational helpers ───────────────────────────────────────────── */
function Modal({ accent, onClose, children }: { accent: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: 560, maxWidth: 'calc(100vw - 40px)',
        background: 'linear-gradient(135deg, rgba(6,0,20,0.95), rgba(10,5,30,0.95))',
        border: `1px solid ${accent}`, borderRadius: 16,
        boxShadow: `0 0 40px ${accent}66, inset 0 0 20px rgba(255,255,255,0.05)`, overflow: 'hidden',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2, width: 32, height: 32, borderRadius: '50%',
          background: accent, color: '#000', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}>✕</button>
        {children}
      </div>
    </div>
  )
}
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: `1px solid ${color}26`, borderRadius: 8, padding: '8px 10px', background: `${color}08` }}>
      <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color }}>{value}</div>
      <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
    </div>
  )
}
function Route({ ports, accent, label }: { ports: string[]; accent: string; label: string }) {
  return (
    <div style={{ border: `1px solid ${accent}30`, borderRadius: 10, padding: '10px 12px', marginBottom: 16, background: `${accent}08` }}>
      <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {ports.map((p, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, color: accent,
              background: `${accent}14`, border: `1px solid ${accent}33`, borderRadius: 4, padding: '3px 8px'
            }}>{p}</span>
            {i < ports.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>›</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
function Actions({ accent, primary, onPrimary, onClose }: { accent: string; primary: string; onPrimary: () => void; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={onPrimary} style={{
        flex: 1, padding: 13, borderRadius: 9, border: 'none', cursor: 'pointer',
        background: `linear-gradient(135deg, ${accent}, ${accent === '#f5a623' ? '#b9740d' : '#0094bb'})`,
        color: '#001018', fontWeight: 700, fontSize: 14, letterSpacing: 1, fontFamily: "'Orbitron', sans-serif",
      }}>{primary}</button>
      <button onClick={onClose} style={{
        padding: '13px 20px', borderRadius: 9, cursor: 'pointer', background: 'transparent',
        border: `1px solid ${accent}`, color: accent, fontSize: 14, fontWeight: 600,
      }}>Close</button>
    </div>
  )
}
