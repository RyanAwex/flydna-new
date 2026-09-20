'use client'

// ── Patch rAF & unhandledrejection — prevents Mapbox DEM, projection & image_manager errors ──
if (typeof window !== 'undefined') {
    const _raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (cb: FrameRequestCallback) =>
        _raf((t: number) => {
            try { cb(t) } catch (e: any) {
                if (e && e.message && (e.message.includes('out of range source coordinates for DEM data') || e.message.includes('DEM') || e.message.includes('applyProjectionUpdate') || e.message.includes("reading 'get'"))) return
                throw e
            }
        })

    window.addEventListener("unhandledrejection", (event) => {
        if (
            event.reason &&
            (event.reason.message?.includes("reading 'get'") ||
                event.reason.message?.includes("applyProjectionUpdate") ||
                (typeof event.reason.stack === "string" && event.reason.stack.includes("image_manager")))
        ) {
            event.preventDefault();
        }
    });
}



import { useRef, useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxTransformRequest } from "@/lib/mapbox";

if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
  mapboxgl.baseApiUrl = `${window.location.origin}/api/mapbox-proxy`;
}

if (typeof window !== 'undefined' && mapboxgl && mapboxgl.Map) {
  try {
    const proto = mapboxgl.Map.prototype as any;
    if (proto._updateProjection && !proto._flydnaPatchedProj) {
      proto._flydnaPatchedProj = true;
      const orig = proto._updateProjection;
      proto._updateProjection = function (...args: any[]) {
        try {
          if (!this || !this.transform || !this.transform.projection) return;
          return orig.apply(this, args);
        } catch (e) {
          return;
        }
      };
    }
  } catch (e) {}
}

import NascRadialControl from './NascRadialControl'
import NascATLMenu from './NascATLMenu'
import NascCNNMenu from './NascCNNMenu'
import NascSessionLayer from './NascSessionLayer'
import NascLocalCallRoute from './NascLocalCallRoute'
import NascCruiseFleet from './NascCruiseFleet'
import { PTTWidget, AudioCallIsland, FaceTimeHUD } from './NascCallSystemHUD'
import { useCall } from '@/context/CallContext'
import { ChatManager } from '@/lib/api'
import NascMSGMenu from './NascMSGMenu'
import NascBCMenu from './NascBCMenu'
import NascCitiMenu from './NascCitiMenu'
import NascLGAMenu from './NascLGAMenu'
import NascJFKMenu from './NascJFKMenu'
import NascUBSMenu from './NascUBSMenu'
import NascYankeeMenu from './NascYankeeMenu'
import NascMetLifeMenu from './NascMetLifeMenu'
import NascRedBullMenu from './NascRedBullMenu'
import NascTEBMenu from './NascTEBMenu'
import NascEWRMenu from './NascEWRMenu'

interface NascATLMapPanelProps {
    onLandmarkClick: (id: string | null) => void
    visibleLayers: Set<string>
    activeVenue?: string | null
    currentState?: string
}

const VENUE_COORDS: Record<string, { lng: number; lat: number; zoom?: number }> = {
    'mercedes-benz': { lng: -84.4004, lat: 33.7554 },
    'state-farm':    { lng: -84.3963, lat: 33.7573 },
    'truist-park':   { lng: -84.4677, lat: 33.8903 },
    'hartsfield':    { lng: -84.4277, lat: 33.6407 },
    'ponce-city':    { lng: -84.3664, lat: 33.7730 },
    'cnn':           { lng: -84.3953, lat: 33.7583 },
    'nobu':          { lng: -84.3615, lat: 33.8475, zoom: 15.5 },
    'cosm':          { lng: -84.3950, lat: 33.7600 },
    'pete-petit':    { lng: -84.3894, lat: 33.7353 },
    // NYC
    'msg':           { lng: -73.9936, lat: 40.7508 },
    'citi':          { lng: -73.8456, lat: 40.7571 },
    'yankee':        { lng: -73.9262, lat: 40.8296 },
    'metlife':       { lng: -74.0745, lat: 40.8128 },
    'jfk':           { lng: -73.7785, lat: 40.6428 },
    'lga':           { lng: -73.8750, lat: 40.7751 },
    // Florida
    'fontainebleau': { lng: -80.1220, lat: 25.8174 },
    'hard_rock_stadium': { lng: -80.2376, lat: 25.9580 },
    'mia_airport':   { lng: -80.2870, lat: 25.7959 },
}

const CITY_VIEWS: Record<string, { center: [number, number]; zoom: number; pitch: number; bearing: number }> = {
    'Atlanta':  { center: [-84.3990, 33.7490], zoom: 15.5, pitch: 72, bearing: -18 },
    'New York': { center: [-73.9934, 40.7505], zoom: 15.5, pitch: 65, bearing: -20 },
    'Florida':  { center: [-80.1918, 25.7617], zoom: 14,   pitch: 62, bearing:  -5 },
    'Texas':    { center: [-97.7431, 30.2672], zoom: 13.5, pitch: 58, bearing:  10 },
}

export default function NascATLMapPanel({ onLandmarkClick, visibleLayers, activeVenue: propActiveVenue, currentState }: NascATLMapPanelProps) {
    const mapRef = useRef<MapRef>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const spinRef = useRef<number | null>(null)
    const [spinning, setSpinning] = useState(false)

    const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/standard')
    const [lightPreset, setLightPreset] = useState<'day' | 'dawn' | 'dusk' | 'night'>('night')
    const [activeBeam, setActiveBeam] = useState<string | null>(null)
    const [activeMenu, setActiveMenu] = useState<string | null>(null)
    const [callType, setCallType] = useState<'none' | 'ptt' | 'audio' | 'video'>('none')
    const [simulatedPartnerId, setSimulatedPartnerId] = useState<string | null>(null)

    const {
        isCallActive,
        isVideoCallActive,
        activeCallPartnerId,
        pttActiveWith,
        incomingPttFrom,
        endCall,
        stopPTT,
        isCallMuted,
        setIsCallMuted,
        isCallVideoOff,
        setIsCallVideoOff,
        remoteUsers,
        localVideoTrack
    } = useCall()

    // Merge real WebRTC context and simulated call events
    const getActiveSession = () => {
        if (pttActiveWith || incomingPttFrom) {
            return {
                type: 'ptt' as const,
                partnerId: pttActiveWith || incomingPttFrom,
                isSimulated: false
            }
        }
        if (isCallActive) {
            return {
                type: (isVideoCallActive ? 'video' : 'audio') as 'video' | 'audio',
                partnerId: activeCallPartnerId,
                isSimulated: false
            }
        }
        if (callType !== 'none') {
            return {
                type: callType,
                partnerId: simulatedPartnerId || '101',
                isSimulated: true
            }
        }
        return {
            type: 'none' as const,
            partnerId: null,
            isSimulated: false
        }
    }
    const session = getActiveSession()

    const hashId = (id: string): number => {
        let hash = 0
        for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
        return hash
    }

    const getCallCoordinates = (partnerId: string | null) => {
        let ptA: [number, number] = [-84.3880, 33.7490]
        let ptB: [number, number] = [-84.3614, 33.8475]
        let locA = 'Local 🇺🇸'
        let locB = 'Remote 🇺🇸'

        if (currentState === 'New York') {
            ptA = [-73.9936, 40.7508]
            ptB = [-73.97638, 40.68255]
            locA = 'Manhattan 🇺🇸'
            locB = 'Brooklyn 🇺🇸'
        } else if (currentState === 'Florida') {
            ptA = [-80.2376, 25.9580]
            ptB = [-80.1220, 25.8174]
            locA = 'Miami Gardens 🇺🇸'
            locB = 'Miami Beach 🇺🇸'
        } else if (currentState === 'Texas') {
            ptA = [-97.7431, 30.2672]
            ptB = [-97.7320, 30.2850]
            locA = 'Austin Core 🇺🇸'
            locB = 'UT Austin 🇺🇸'
        } else {
            locA = 'Atlanta 🇺🇸'
            locB = 'Buckhead 🇺🇸'
        }

        if (partnerId && !['101', '102', '103', '104'].includes(partnerId)) {
            const seed = hashId(partnerId)
            const seedLat = Math.sin(seed * 8923) * 0.012
            const seedLng = Math.cos(seed * 4312) * 0.015
            if (currentState === 'New York') {
                ptB = [-74.006 + seedLng, 40.7128 + seedLat]
                locB = 'NYC Region 🇺🇸'
            } else if (currentState === 'Florida') {
                ptB = [-80.1918 + seedLng, 25.7617 + seedLat]
                locB = 'Miami Region 🇺🇸'
            } else if (currentState === 'Texas') {
                ptB = [-97.7431 + seedLng, 30.2672 + seedLat]
                locB = 'Austin Region 🇺🇸'
            } else {
                ptB = [-84.3990 + seedLng, 33.7490 + seedLat]
                locB = 'ATL Region 🇺🇸'
            }
        } else if (partnerId === '101') {
            if (currentState === 'New York') {
                ptB = [-74.016, 40.691]
                locB = 'Governors Island 🇺🇸'
            } else if (currentState === 'Florida') {
                ptB = [-80.1220, 25.8174]
                locB = 'Miami Beach 🇺🇸'
            } else if (currentState === 'Texas') {
                ptB = [-97.7320, 30.2850]
                locB = 'UT Austin 🇺🇸'
            } else {
                ptB = [-84.3614, 33.8475]
                locB = 'Buckhead 🇺🇸'
            }
        }

        return { ptA, ptB, locA, locB }
    }

    const getPartnerDetails = (partnerId: string | null) => {
        if (!partnerId) return { name: 'Lisa Sterling', avatar: '/avatar_lisa.png' }
        if (partnerId === '101') return { name: 'FlyDnA Concierge', avatar: null }
        if (partnerId === '102') return { name: 'FlyDnA Travel Agent', avatar: null }
        if (partnerId === '103') return { name: 'FlyDnA Tech Support', avatar: null }
        if (partnerId === '104') return { name: 'FlyDnA Dispatcher', avatar: null }

        const c = ChatManager.getContacts().find(x => x.id === partnerId)
        return {
            name: c?.name || 'FlyDnA Traveler',
            avatar: c?.avatarUrl || null
        }
    }

    const handleHangup = () => {
        if (session.isSimulated) {
            setCallType('none')
            setSimulatedPartnerId(null)
            window.dispatchEvent(new CustomEvent('flydna-call-state', { detail: { type: 'none' } }))
        } else {
            if (session.type === 'ptt') {
                stopPTT()
            } else {
                endCall()
            }
        }
    }

    // NYC venue menus — tracks which venue menu is open + where the click was
    const [nycMenu, setNycMenu] = useState<{ id: string; x: number; y: number; side: 'left' | 'right' } | null>(null)
    const resetNycMenu = () => setNycMenu(null)

    // ── Call system event listener ────────────────────────────────────────────
    useEffect(() => {
        const handleCallState = (e: Event) => {
            const ev = e as CustomEvent<{ type?: 'none' | 'ptt' | 'audio' | 'video'; partnerId?: string; active?: boolean }>
            if (ev.detail?.type) {
                setCallType(ev.detail.type)
                if (ev.detail.partnerId) setSimulatedPartnerId(ev.detail.partnerId)
            } else if (typeof ev.detail?.active === 'boolean') {
                setCallType(ev.detail.active ? 'audio' : 'none')
                if (!ev.detail.active) setSimulatedPartnerId(null)
            } else {
                setCallType(prev => {
                    const next = prev === 'none' ? 'audio' : 'none'
                    if (next === 'none') setSimulatedPartnerId(null)
                    return next
                })
            }
        }
        window.addEventListener('flydna-call-state', handleCallState)
        return () => window.removeEventListener('flydna-call-state', handleCallState)
    }, [])

    // Reset menu when beam collapses
    useEffect(() => {
        if (!activeBeam) setActiveMenu(null)
    }, [activeBeam])

    // ── Sync venue selection from search/external prop → flyTo + beam activate ──
    useEffect(() => {
        if (propActiveVenue === undefined) return
        const map = mapRef.current?.getMap()

        if (propActiveVenue) {
            const v = VENUE_COORDS[propActiveVenue]
            if (v && map) {
                map.flyTo({
                    center: [v.lng, v.lat],
                    zoom: v.zoom || 15.5,
                    pitch: 75,
                    bearing: -15,
                    duration: 3000,
                    essential: true,
                })
            }
            setActiveBeam(propActiveVenue)
            setTimeout(() => setActiveMenu(propActiveVenue), 600)
        } else {
            setActiveBeam(null)
            setActiveMenu(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [propActiveVenue])

    // ── Fly to city when State Vibe changes ────────────────────────────────────
    useEffect(() => {
        if (!currentState) return
        const c = CITY_VIEWS[currentState]
        if (!c) return
        const map = mapRef.current?.getMap()
        if (!map) return
        map.flyTo({ center: c.center, zoom: c.zoom, pitch: c.pitch, bearing: c.bearing, duration: 2800, essential: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentState])

    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (!map) return

        // Mapbox GL v3: style imports (like 'basemap') load AFTER 'style.load' fires.
        // The 'idle' event fires once ALL imports and tiles are fully ready — this
        // is the only reliable moment to call setConfigProperty('basemap', ...).
        const apply = () => {
            try {
                map.setConfigProperty('basemap', 'lightPreset', lightPreset)
            } catch (e) {
                // import not ready yet — retry once more in 400ms
                setTimeout(() => {
                    try { map.setConfigProperty('basemap', 'lightPreset', lightPreset) } catch (_) {}
                }, 400)
            }
        }

        if (map.loaded()) {
            apply()
        }
        // Primary: wait for fully idle (imports loaded)
        map.once('idle', apply)
        // Belt-and-suspenders retries
        const t1 = setTimeout(apply, 600)
        const t2 = setTimeout(apply, 1800)
        const t3 = setTimeout(apply, 4000)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [lightPreset])

    const startSpin = useCallback(() => {
        const map = mapRef.current?.getMap()
        if (!map) return
        let bearing = map.getBearing()
        const tick = () => {
            bearing = (bearing + 0.15) % 360
            map.setBearing(bearing)
            spinRef.current = requestAnimationFrame(tick)
        }
        spinRef.current = requestAnimationFrame(tick)
        setSpinning(true)
    }, [])

    const stopSpin = useCallback(() => {
        if (spinRef.current !== null) {
            cancelAnimationFrame(spinRef.current)
            spinRef.current = null
        }
        setSpinning(false)
    }, [])

    const toggleSpin = () => spinning ? stopSpin() : startSpin()

    useEffect(() => () => { if (spinRef.current !== null) cancelAnimationFrame(spinRef.current) }, [])

    const dialRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const lastAngle = useRef(0)
    const [bearing, setBearing] = useState(-20)

    const getAngle = (e: MouseEvent | React.MouseEvent, rect: DOMRect) => {
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        return Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    }

    const onDialMouseDown = (e: React.MouseEvent) => {
        if (spinning) stopSpin()
        isDragging.current = true
        const rect = dialRef.current!.getBoundingClientRect()
        lastAngle.current = getAngle(e, rect)
        e.preventDefault()
    }

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDragging.current || !dialRef.current) return
            const rect = dialRef.current.getBoundingClientRect()
            const angle = getAngle(e, rect)
            const delta = angle - lastAngle.current
            lastAngle.current = angle
            const map = mapRef.current?.getMap()
            if (map) {
                const newBearing = (map.getBearing() + delta + 360) % 360
                map.setBearing(newBearing)
                setBearing(newBearing)
            }
        }
        const onUp = () => { isDragging.current = false }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [spinning, stopSpin])

    // --- REUSABLE CYBERPUNK BEAM RENDERERS ---
    const renderSingleBeam = (spotId: string, name: string, title: string, lon: number, lat: number, color: string, logo: string, side: 'left' | 'right' = 'right') => {
        let layerId = 'sports';
        if (spotId === 'hartsfield') layerId = 'airports';
        if (spotId === 'ponce-city') layerId = 'openbar';
        if (spotId === 'nobu') layerId = 'hotels';

        if (!visibleLayers.has(layerId)) return null;

        const isBeamed = activeBeam === spotId;

        const handleLogoClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (activeMenu === spotId) {
                setActiveMenu(null);
                setActiveBeam(null);
            } else if (isBeamed) {
                setActiveMenu(spotId);
            } else {
                setActiveBeam(spotId);
            }
            onLandmarkClick(spotId);
        };

        return (
            <Marker key={spotId} longitude={lon} latitude={lat} pitchAlignment="viewport" rotationAlignment="viewport">
                <div style={{ position: 'relative', width: 0, height: 0, overflow: 'visible' }}>
                    <svg style={{ position: 'absolute', bottom: 0, left: -60, pointerEvents: 'none', overflow: 'visible' }} width="120" height="260">
                        <defs>
                            <radialGradient id={`spot-${spotId}`} cx="50%" cy="100%" r="100%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </radialGradient>
                            <filter id={`glow-${spotId}`}>
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <clipPath id={`clip-${spotId}`}>
                                <circle cx="60" cy="50" r="28" />
                            </clipPath>
                            <filter id={`logoGlow-${spotId}`}>
                                <feGaussianBlur stdDeviation="6" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>

                        {/* Sky Spotlight Cone */}
                        <g style={{
                            opacity: isBeamed ? 1 : 0,
                            transform: `scaleY(${isBeamed ? 1 : 0})`,
                            transformOrigin: '60px 260px',
                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            pointerEvents: 'none'
                        }}>
                            <path d="M 60,260 L 0,-30 L 120,-30 Z" fill={`url(#spot-${spotId})`}>
                                <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                            </path>
                            <line x1="60" y1="260" x2="60" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-${spotId})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.3s' }} />
                            <text x="60" y="5" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" filter={`url(#glow-${spotId})`} style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>{name}</text>
                            <text x="60" y="20" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle" filter={`url(#glow-${spotId})`} style={{ letterSpacing: '0.25em', textTransform: 'uppercase' }}>{title}</text>
                        </g>

                        {/* Floating Node Logo */}
                        <g style={{
                            pointerEvents: 'none',
                            transform: isBeamed ? 'translateY(0)' : 'translateY(190px)',
                            transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }}>
                            <g style={{
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                transformOrigin: '60px 50px',
                                transform: `scale(${isBeamed ? 1.15 : 0.85})`,
                                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                filter: `drop-shadow(0 0 10px ${color})`
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                                onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                                onClick={handleLogoClick}>
                                <circle cx="60" cy="50" r="29" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-${spotId})`} />
                                <image href={logo} x="31" y="21" width="58" height="58" clipPath={`url(#clip-${spotId})`} />
                            </g>
                        </g>

                        {/* Pulsing Base */}
                        <circle cx="60" cy="260" r="5" fill={color} opacity={isBeamed ? 1 : 0} filter={`url(#glow-${spotId})`} style={{ transition: 'opacity 0.3s', animation: 'beamPulse 2s ease-in-out infinite' }} />
                    </svg>
                    {activeMenu === spotId && (
                        <div style={{ position: 'absolute', top: -400, left: -500, width: 1000, height: 600, pointerEvents: 'none' }}>
                            {spotId === 'cnn' ? (
                                <NascCNNMenu onClose={() => setActiveMenu(null)} side={side} anchorX={500} anchorY={190} />
                            ) : (
                                <NascATLMenu onClose={() => setActiveMenu(null)} venueId={spotId} side={side} anchorX={500} anchorY={190} />
                            )}
                        </div>
                    )}
                </div>
            </Marker>
        )
    }

    const renderDoubleBeam = (spotId: string, name: string, title: string, lon: number, lat: number, color: string, logo1: string, logo2: string, spotId2?: string) => {
        let layerId = 'sports';
        if (spotId === 'hartsfield') layerId = 'airports';
        if (spotId === 'ponce-city') layerId = 'openbar';

        if (!visibleLayers.has(layerId)) return null;

        const isBeamed = activeBeam === spotId;

        const handleLeftLogoClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (activeMenu === `${spotId}-l`) {
                setActiveMenu(null);
                setActiveBeam(null);
            } else if (isBeamed) {
                setActiveMenu(`${spotId}-l`);
            } else {
                setActiveBeam(spotId);
            }
            onLandmarkClick(spotId);
        };

        const handleRightLogoClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (activeMenu === `${spotId}-r`) {
                setActiveMenu(null);
                setActiveBeam(null);
            } else if (isBeamed) {
                setActiveMenu(`${spotId}-r`);
            } else {
                setActiveBeam(spotId);
            }
            // Right logo fires its own channel if spotId2 provided (e.g. ATL United / Rangers)
            onLandmarkClick(spotId2 ?? spotId);
        };

        return (
            <Marker key={spotId} longitude={lon} latitude={lat} pitchAlignment="viewport" rotationAlignment="viewport">
                <div style={{ position: 'relative', width: 0, height: 0, overflow: 'visible' }}>
                    <svg style={{ position: 'absolute', bottom: 0, left: -90, pointerEvents: 'none', overflow: 'visible' }} width="180" height="260">
                        <defs>
                            <radialGradient id={`spot-${spotId}`} cx="50%" cy="100%" r="90%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                                <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </radialGradient>
                            <filter id={`glow-${spotId}`}>
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                            <clipPath id={`clip1-${spotId}`}><circle cx="50" cy="50" r="24" /></clipPath>
                            <clipPath id={`clip2-${spotId}`}><circle cx="130" cy="50" r="24" /></clipPath>
                        </defs>

                        {/* Holographic Beam */}
                        <g style={{
                            opacity: isBeamed ? 1 : 0,
                            transform: `scaleY(${isBeamed ? 1 : 0})`,
                            transformOrigin: '90px 260px',
                            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                            pointerEvents: 'none'
                        }}>
                            <path d="M 90,260 L -10,-30 L 190,-30 Z" fill={`url(#spot-${spotId})`}>
                                <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                            </path>
                            <line x1="90" y1="260" x2="50" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-${spotId})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.3s' }} />
                            <line x1="90" y1="260" x2="130" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-${spotId})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.6s' }} />
                            <text x="90" y="-10" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" filter={`url(#glow-${spotId})`} style={{ letterSpacing: '0.15em' }}>{name}</text>
                            <text x="90" y="5" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle" filter={`url(#glow-${spotId})`} style={{ letterSpacing: '0.25em' }}>{title}</text>
                        </g>

                        {/* Left Logo */}
                        <g style={{
                            pointerEvents: 'none',
                            transform: isBeamed ? 'translate(0px, 0px)' : 'translate(20px, 190px)',
                            transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }}>
                            <g style={{
                                cursor: 'pointer', pointerEvents: 'auto',
                                transformOrigin: '50px 50px',
                                transform: `scale(${isBeamed ? 1.15 : 0.85})`,
                                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                filter: `drop-shadow(0 0 10px ${color})`
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                                onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                                onClick={handleLeftLogoClick}>
                                <circle cx="50" cy="50" r="25" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-${spotId})`} />
                                <image href={logo1} x="26" y="26" width="48" height="48" clipPath={`url(#clip1-${spotId})`} />
                            </g>
                        </g>

                        {/* Right Logo */}
                        <g style={{
                            pointerEvents: 'none',
                            transform: isBeamed ? 'translate(0px, 0px)' : 'translate(-20px, 190px)',
                            transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                        }}>
                            <g style={{
                                cursor: 'pointer', pointerEvents: 'auto',
                                transformOrigin: '130px 50px',
                                transform: `scale(${isBeamed ? 1.15 : 0.85})`,
                                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                filter: `drop-shadow(0 0 10px ${color})`
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                                onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                                onClick={handleRightLogoClick}>
                                <circle cx="130" cy="50" r="25" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-${spotId})`} />
                                <image href={logo2} x="106" y="26" width="48" height="48" clipPath={`url(#clip2-${spotId})`} />
                            </g>
                        </g>

                        {/* Pulsing Base */}
                        <circle cx="90" cy="260" r="5" opacity={isBeamed ? 1 : 0} fill={color} filter={`url(#glow-${spotId})`} style={{ transition: 'opacity 0.3s', animation: 'beamPulse 2s ease-in-out infinite' }} />
                    </svg>
                    {(activeMenu === `${spotId}-l` || activeMenu === `${spotId}-r`) && (
                        <div style={{ position: 'absolute', top: -400, left: -500, width: 1000, height: 600, pointerEvents: 'none' }}>
                            <NascATLMenu onClose={() => setActiveMenu(null)} venueId={spotId} side={activeMenu.endsWith('-l') ? 'left' : 'right'} anchorX={activeMenu.endsWith('-l') ? 460 : 540} anchorY={190} />
                        </div>
                    )}
                </div>
            </Marker>
        )
    }

    // ── NYC single-beam renderer — identical SVG to ATL but wires to nycMenu ──
    const renderNycBeam = (
        id: string, name: string, title: string,
        lon: number, lat: number,
        color: string, logo: string | null, logoText?: string,
        side: 'left' | 'right' = 'right',
        layerId: string = 'sports'
    ) => {
        if (!visibleLayers.has(layerId)) return null
        const isBeamed = nycMenu?.id === id

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (nycMenu?.id === id) {
                setNycMenu(null)
                onLandmarkClick(null)
            } else {
                setNycMenu({ id, x: e.clientX, y: e.clientY, side })
                onLandmarkClick(id)
            }
        }

        return (
            <Marker key={id} longitude={lon} latitude={lat} pitchAlignment="viewport" rotationAlignment="viewport">
                <svg style={{ position: 'absolute', bottom: 0, left: -60, pointerEvents: 'none', overflow: 'visible' }} width="120" height="260">
                    <defs>
                        <radialGradient id={`spot-nyc-${id}`} cx="50%" cy="100%" r="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                        <filter id={`glow-nyc-${id}`}>
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <clipPath id={`clip-nyc-${id}`}><circle cx="60" cy="50" r="28" /></clipPath>
                    </defs>

                    {/* Sky Spotlight Cone */}
                    <g style={{
                        opacity: isBeamed ? 1 : 0,
                        transform: `scaleY(${isBeamed ? 1 : 0})`,
                        transformOrigin: '60px 260px',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: 'none'
                    }}>
                        <path d="M 60,260 L 0,-30 L 120,-30 Z" fill={`url(#spot-nyc-${id})`}>
                            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                        </path>
                        <line x1="60" y1="260" x2="60" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-nyc-${id})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.3s' }} />
                        <text x="60" y="5" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" filter={`url(#glow-nyc-${id})`} style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>{name}</text>
                        <text x="60" y="20" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle" filter={`url(#glow-nyc-${id})`} style={{ letterSpacing: '0.25em', textTransform: 'uppercase' }}>{title}</text>
                    </g>

                    {/* Floating Logo */}
                    <g style={{
                        pointerEvents: 'none',
                        transform: isBeamed ? 'translateY(0)' : 'translateY(190px)',
                        transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                    }}>
                        <g style={{
                            cursor: 'pointer', pointerEvents: 'auto',
                            transformOrigin: '60px 50px',
                            transform: `scale(${isBeamed ? 1.15 : 0.85})`,
                            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                            filter: `drop-shadow(0 0 10px ${color})`
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                            onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                            onClick={handleClick}>
                            <circle cx="60" cy="50" r="29" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-nyc-${id})`} />
                            {logo
                                ? <image href={logo} x="31" y="21" width="58" height="58" clipPath={`url(#clip-nyc-${id})`} />
                                : <text x="60" y="55" fill={color} fontSize="11" fontWeight="bold" textAnchor="middle">{logoText ?? id.toUpperCase()}</text>
                            }
                        </g>
                    </g>

                    {/* Pulsing Base */}
                    <circle cx="60" cy="260" r="5" fill={color} opacity={isBeamed ? 1 : 0} filter={`url(#glow-nyc-${id})`} style={{ transition: 'opacity 0.3s', animation: 'beamPulse 2s ease-in-out infinite' }} />
                </svg>
            </Marker>
        )
    }

    // ── NYC double-beam renderer — two-logo venues (MSG, MetLife) ───────────────
    const renderNycDoubleBeam = (
        id: string, name: string, title: string,
        lon: number, lat: number,
        color: string,
        logo1: string | null, logo2: string | null,
        side: 'left' | 'right' = 'left',
        layerId: string = 'sports',
        text1?: string, text2?: string
    ) => {
        if (!visibleLayers.has(layerId)) return null
        const isBeamed = nycMenu?.id === id

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation()
            if (nycMenu?.id === id) {
                setNycMenu(null)
                onLandmarkClick(null)
            } else {
                setNycMenu({ id, x: e.clientX, y: e.clientY, side })
                onLandmarkClick(id)
            }
        }

        return (
            <Marker key={id} longitude={lon} latitude={lat} pitchAlignment="viewport" rotationAlignment="viewport">
                <svg style={{ position: 'absolute', bottom: 0, left: -90, pointerEvents: 'none', overflow: 'visible' }} width="180" height="260">
                    <defs>
                        <radialGradient id={`spot-nyc-${id}`} cx="50%" cy="100%" r="90%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </radialGradient>
                        <filter id={`glow-nyc-${id}`}>
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <clipPath id={`clip-nyc-${id}-l`}><circle cx="50" cy="50" r="24" /></clipPath>
                        <clipPath id={`clip-nyc-${id}-r`}><circle cx="130" cy="50" r="24" /></clipPath>
                    </defs>

                    {/* Double Holographic Beam */}
                    <g style={{
                        opacity: isBeamed ? 1 : 0,
                        transform: `scaleY(${isBeamed ? 1 : 0})`,
                        transformOrigin: '90px 260px',
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: 'none'
                    }}>
                        <path d="M 90,260 L -10,-30 L 190,-30 Z" fill={`url(#spot-nyc-${id})`}>
                            <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
                        </path>
                        <line x1="90" y1="260" x2="50" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-nyc-${id})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.3s' }} />
                        <line x1="90" y1="260" x2="130" y2="50" stroke={color} strokeWidth="2.5" strokeDasharray="8 4" filter={`url(#glow-nyc-${id})`} style={{ animation: 'beamPulse 2s ease-in-out infinite 0.6s' }} />
                        <text x="90" y="-10" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle" filter={`url(#glow-nyc-${id})`} style={{ letterSpacing: '0.15em' }}>{name}</text>
                        <text x="90" y="5" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle" filter={`url(#glow-nyc-${id})`} style={{ letterSpacing: '0.25em' }}>{title}</text>
                    </g>

                    {/* Left Logo */}
                    <g style={{ pointerEvents: 'none', transform: isBeamed ? 'translate(0,0)' : 'translate(20px,190px)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto', transformOrigin: '50px 50px', transform: `scale(${isBeamed ? 1.15 : 0.85})`, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 10px ${color})` }}
                            onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                            onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                            onClick={handleClick}>
                            <circle cx="50" cy="50" r="25" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-nyc-${id})`} />
                            {logo1
                                ? <image href={logo1} x="26" y="26" width="48" height="48" clipPath={`url(#clip-nyc-${id}-l)`} />
                                : <text x="50" y="55" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle">{text1 ?? 'L'}</text>
                            }
                        </g>
                    </g>

                    {/* Right Logo */}
                    <g style={{ pointerEvents: 'none', transform: isBeamed ? 'translate(0,0)' : 'translate(-20px,190px)', transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        <g style={{ cursor: 'pointer', pointerEvents: 'auto', transformOrigin: '130px 50px', transform: `scale(${isBeamed ? 1.15 : 0.85})`, transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 10px ${color})` }}
                            onMouseEnter={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.35 : 1.05})`}
                            onMouseLeave={e => e.currentTarget.style.transform = `scale(${isBeamed ? 1.15 : 0.85})`}
                            onClick={handleClick}>
                            <circle cx="130" cy="50" r="25" fill="rgba(6,0,20,0.85)" stroke={color} strokeWidth="3" filter={`url(#glow-nyc-${id})`} />
                            {logo2
                                ? <image href={logo2} x="106" y="26" width="48" height="48" clipPath={`url(#clip-nyc-${id}-r)`} />
                                : <text x="130" y="55" fill={color} fontSize="9" fontWeight="bold" textAnchor="middle">{text2 ?? 'R'}</text>
                            }
                        </g>
                    </g>

                    {/* Pulsing Base */}
                    <circle cx="90" cy="260" r="5" fill={color} opacity={isBeamed ? 1 : 0} filter={`url(#glow-nyc-${id})`} style={{ transition: 'opacity 0.3s', animation: 'beamPulse 2s ease-in-out infinite' }} />
                </svg>
            </Marker>
        )
    }

    return (
        <>
        <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden relative">
            <style>{`
                @keyframes beamPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
            <NascRadialControl spinning={spinning} onToggleSpin={toggleSpin} onMapStyleChange={setMapStyle} onLightPresetChange={setLightPreset} />
            <div ref={dialRef} onMouseDown={onDialMouseDown} style={{ position: 'absolute', bottom: 24, left: 16, zIndex: 10, width: 56, height: 56, borderRadius: '50%', background: 'rgba(6,0,20,0.85)', border: '1px solid rgba(0,255,255,0.4)', boxShadow: '0 0 12px rgba(0,255,255,0.2)', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
                <div style={{ transform: `rotate(${bearing}deg)`, transition: 'transform 0.05s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: 14, background: '#00ffff', borderRadius: 2, boxShadow: '0 0 6px #00ffff' }} />
                    <div style={{ width: 2, height: 10, background: 'rgba(0,255,255,0.3)', borderRadius: 2, marginTop: 2 }} />
                </div>
                <div style={{ position: 'absolute', top: 4, fontSize: 8, color: '#00ffff', fontWeight: 'bold', letterSpacing: '0.1em' }}>N</div>
            </div>

            <Map
                ref={mapRef}
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                transformRequest={mapboxTransformRequest}
                initialViewState={{ longitude: -84.3990, latitude: 33.7490, zoom: 15.5, pitch: 72, bearing: -18 }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                onLoad={(e: any) => {
                    const map = e.target

                    // Force Mapbox to re-measure container — prevents NaN LngLat on mouse events
                    map.resize()

                    // ── Terrain + 3D: no import timing dependency ──────────────
                    const applyTerrain = () => {
                        if (!map.getSource('mapbox-dem')) {
                            map.addSource('mapbox-dem', {
                                type: 'raster-dem',
                                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                                tileSize: 512,
                                maxzoom: 14,
                            })
                        }
                        try { map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 }) } catch (_) {}
                    }
                    applyTerrain()

                    // ── Light preset + 3D objects: requires 'basemap' import ───
                    // In Mapbox GL v3, the 'basemap' import loads AFTER style.load.
                    // 'idle' is the reliable signal that ALL imports are ready.
                    const applyConfig = () => {
                        try {
                            map.setConfigProperty('basemap', 'lightPreset', 'night')
                            map.setConfigProperty('basemap', 'show3dObjects', true)
                        } catch (_) {}
                    }
                    map.once('idle', applyConfig)
                    setTimeout(applyConfig, 1200)
                    setTimeout(applyConfig, 3000)

                    map.jumpTo({ center: [-84.3990, 33.7490], zoom: 15.5, pitch: 72, bearing: -18 })
                }}
            >
                {/* Benz Stadium Split Beam */}
                {visibleLayers.has('sports') && renderDoubleBeam('mercedes-benz', 'MERCEDES-BENZ', 'Falcons · United FC', -84.4004, 33.7554, '#00ffff', '/ATL_Falcons.png', '/ATL_United-FC.png')}

                {/* Hawks */}
                {visibleLayers.has('sports') && renderSingleBeam('state-farm', 'STATE FARM ARENA', 'Atlanta Hawks', -84.3963, 33.7573, '#00e5ff', '/ATL_Hawks.png', 'left')}

                {/* Braves */}
                {visibleLayers.has('sports') && renderSingleBeam('truist-park', 'TRUIST PARK', 'Atlanta Braves', -84.4677, 33.8903, '#CE1141', '/ATL_Braves.png')}

                {/* Delta / Airport */}
                {visibleLayers.has('airports') && (
                    <>
                        {renderSingleBeam('hartsfield', 'HARTSFIELD-JACKSON', 'Delta Hub', -84.4277, 33.6407, '#4A8FFF', '/Delta.png')}
                        {/* Holographic AR Runway Strobe Overlay */}
                        <Marker longitude={-84.4277} latitude={33.6360} pitchAlignment="map" rotationAlignment="map">
                            <svg width="600" height="240" style={{ position: 'absolute', top: -120, left: -300, pointerEvents: 'none', overflow: 'visible' }}>
                                <style>{`
                                    @keyframes runwayFlash {
                                        from { stroke-dashoffset: 40; }
                                        to { stroke-dashoffset: 0; }
                                    }
                                `}</style>
                                <g style={{ filter: 'drop-shadow(0 0 6px #00ffff)' }}>
                                    {[-80, -40, 0, 40, 80].map((yOffset, i) => (
                                        <g key={i}>
                                            <line x1="0" y1={120 + yOffset} x2="600" y2={120 + yOffset} stroke="#00e5ff" strokeWidth="2" opacity="0.3" />
                                            <line x1="0" y1={120 + yOffset} x2="600" y2={120 + yOffset} stroke="#ffffff" strokeWidth="3" strokeDasharray="8 32" style={{ animation: 'runwayFlash 0.5s linear infinite' }} />
                                            <circle cx="0" cy={120 + yOffset} r="4" fill="#00e5ff" opacity="0.8" />
                                            <circle cx="600" cy={120 + yOffset} r="4" fill="#00e5ff" opacity="0.8" />
                                        </g>
                                    ))}
                                </g>
                                <line x1="300" y1="20" x2="300" y2="220" stroke="#00e5ff" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
                                <circle cx="300" cy="120" r="100" stroke="#00e5ff" strokeWidth="1" strokeDasharray="2 8" fill="none" opacity="0.2" />
                            </svg>
                        </Marker>
                    </>
                )}

                {/* Ponce City */}
                {visibleLayers.has('openbar') && renderSingleBeam('ponce-city', 'PONCE CITY MARKET', '9 Mile Station', -84.3664, 33.7730, '#9b30ff', '/Ponce_City-Market.png')}

                {/* CNN Center */}
                {visibleLayers.has('sports') && renderSingleBeam('cnn', 'CNN CENTER', 'Global News', -84.3953, 33.7583, '#FF0000', '/CNN.png')}

                {/* Cosm Atlanta — Atlantic Station */}
                {visibleLayers.has('sports') && renderSingleBeam('cosm', 'COSM ATLANTA', 'Shared Reality Dome', -84.3950, 33.7600, '#7c3aed', '/cosm_logo.png', 'right')}


                {/* Nobu Hotel */}
                {visibleLayers.has('hotels') && renderSingleBeam('nobu', 'NOBU HOTEL ATLANTA', 'Luxury Lodging', -84.3615, 33.8475, '#e5c158', '/nobu_logo.png')}

                {/* Center Parc Stadium */}
                {visibleLayers.has('sports') && renderSingleBeam('pete-petit', 'CENTER PARC STADIUM', 'Pete Petit Field', -84.3894, 33.7353, '#0055ff', '/GA_Panthers.png')}

                {/* Dynamic Local Call Routes — city-aware, resolves coordinates dynamically */}
                {session.type !== 'none' && (() => {
                    const { ptA, ptB, locA, locB } = getCallCoordinates(session.partnerId)
                    const details = getPartnerDetails(session.partnerId)
                    const userAvatar = (() => {
                        try {
                            const raw = typeof window !== 'undefined' ? localStorage.getItem('flydna_user') : null
                            return raw ? JSON.parse(raw)?.profileImage : null
                        } catch { return null }
                    })()
                    return (
                        <NascLocalCallRoute
                            callerA={ptA}
                            callerB={ptB}
                            callerAName="You"
                            callerBName={details.name}
                            callerALoc={locA}
                            callerBLoc={locB}
                            callerAAvatar={userAvatar || undefined}
                            callerBAvatar={details.avatar || undefined}
                            onHangup={handleHangup}
                        />
                    )
                })()}

                {/* ── NYC Venue Markers — full holographic beam, same as ATL ── */}
                {currentState === 'New York' && (
                  <>
                    {/* MSG — Madison Square Garden — Knicks + Rangers BOTH have logos now */}
                    {renderNycDoubleBeam('msg', 'MADISON SQ GARDEN', 'Knicks · Rangers', -73.9936, 40.7508, '#9060ff', '/knick_Logo.png', '/Ranger_Logo.png', 'right', 'sports', 'NYK', 'NYR')}

                    {/* Barclays Center */}
                    {renderNycBeam('bc', 'BARCLAYS CENTER', 'Brooklyn Nets', -73.9764, 40.6826, '#4FC3F7', '/Brooklyn_Nets_Logo.png', undefined, 'right', 'sports')}

                    {/* Citi Field */}
                    {renderNycBeam('citi', 'CITI FIELD', 'NY Mets', -73.8456, 40.7571, '#FF5910', '/NY_Mets_Logo.png', undefined, 'left', 'sports')}

                    {/* Yankee Stadium */}
                    {renderNycBeam('yankee', 'YANKEE STADIUM', 'NY Yankees', -73.9262, 40.8296, '#003087', '/YankeeLogo.png', undefined, 'left', 'sports')}

                    {/* MetLife Stadium — Jets + Giants both have logos now */}
                    {renderNycDoubleBeam('metlife', 'METLIFE STADIUM', 'Jets · Giants', -74.0745, 40.8128, '#4169e1', '/NY_Jets.png', '/NY_Giants.png', 'left', 'sports', 'NYJ', 'NYG')}

                    {/* Red Bull Arena */}
                    {renderNycBeam('redbull', 'RED BULL ARENA', 'NY Red Bulls', -74.1503, 40.7368, '#cc0000', '/NY_RedBulls.png', undefined, 'right', 'sports')}

                    {/* UBS Arena */}
                    {renderNycBeam('ubs', 'UBS ARENA', 'NY Islanders', -73.7275, 40.7115, '#00aaff', null, 'UBS', 'right', 'sports')}

                    {/* LaGuardia Airport */}
                    {renderNycBeam('lga', 'LAGUARDIA AIRPORT', 'LGA · Delta Hub', -73.8740, 40.7769, '#00ffff', null, 'LGA', 'right', 'airports')}

                    {/* JFK Airport */}
                    {renderNycBeam('jfk', 'JFK AIRPORT', "Int'l Terminal", -73.7785, 40.6428, '#00e5ff', '/JFK.png', undefined, 'left', 'airports')}

                    {/* Teterboro Airport */}
                    {renderNycBeam('teb', 'TETERBORO AIRPORT', 'Private Aviation', -74.0608, 40.8501, '#00ffcc', null, 'TEB', 'right', 'airports')}

                    {/* EWR — Newark Liberty */}
                    {renderNycBeam('ewr', 'NEWARK LIBERTY', 'EWR · United Hub', -74.1687, 40.6895, '#00ffff', '/Newark_AP.png', undefined, 'right', 'airports')}
                  </>
                )}

                {/* Real-time Session Layer */}
                <NascSessionLayer />

                {/* Cruise Fleet — always active: Miami + NY Harbor + USS Intrepid */}
                <NascCruiseFleet />

                {/* ═══════ STEALTH ADMIN BUOY — Gulf of Panama (south of Tonosí) ═══════ */}
                <Marker longitude={-80.2} latitude={7.2} anchor="center">
                    <div
                        style={{ width: 28, height: 28, cursor: 'default', position: 'relative' }}
                        onMouseEnter={(e) => {
                            const inner = e.currentTarget.firstChild as HTMLElement;
                            if (inner) {
                                inner.style.opacity = '1';
                                inner.style.fontSize = '16px';
                                inner.style.background = 'rgba(15,23,42,0.8)';
                                inner.style.border = '1px solid rgba(239,68,68,0.4)';
                                inner.style.boxShadow = '0 0 12px rgba(239,68,68,0.3)';
                                inner.style.cursor = 'pointer';
                            }
                        }}
                        onMouseLeave={(e) => {
                            const inner = e.currentTarget.firstChild as HTMLElement;
                            if (inner) {
                                inner.style.opacity = '0';
                                inner.style.fontSize = '0px';
                                inner.style.background = 'transparent';
                                inner.style.border = 'none';
                                inner.style.boxShadow = 'none';
                                inner.style.cursor = 'default';
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const adminUrl = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
                                ? 'http://localhost:4000'
                                : 'http://3.15.21.117:4000';
                            window.open(adminUrl, '_blank');
                        }}
                    >
                        <div style={{
                            width: '100%', height: '100%', borderRadius: '50%', background: 'transparent',
                            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0px', opacity: 0
                        }}>
                            🔴
                        </div>
                    </div>
                </Marker>
                {/* ═══════ END STEALTH BUOY ═══════ */}

            </Map>
        </div>

        {/* ── NYC Venue Menus — absolute positioned, triggered by logo click ── */}
        {nycMenu?.id === 'msg'     && <NascMSGMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'bc'      && <NascBCMenu       anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'citi'    && <NascCitiMenu     anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'yankee'  && <NascYankeeMenu   anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'metlife' && <NascMetLifeMenu  anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'redbull' && <NascRedBullMenu  anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'ubs'     && <NascUBSMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'lga'     && <NascLGAMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'jfk'     && <NascJFKMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'teb'     && <NascTEBMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}
        {nycMenu?.id === 'ewr'     && <NascEWRMenu      anchorX={nycMenu.x} anchorY={nycMenu.y} side={nycMenu.side} onClose={resetNycMenu} />}

        {/* ── Call System HUD — portalled to document.body so z-index is absolute ── */}
        {typeof document !== 'undefined' && session.type !== 'none' && createPortal(
            <div style={{
                position: 'fixed', top: '300px', right: '20px',
                zIndex: 9999, pointerEvents: 'auto',
            }}>
                {session.type === 'ptt' && (
                    <PTTWidget 
                        onClose={handleHangup} 
                        partnerName={getPartnerDetails(session.partnerId).name}
                        isIncoming={incomingPttFrom !== null}
                    />
                )}
                {session.type === 'audio' && (
                    <AudioCallIsland 
                        onClose={handleHangup}
                        partnerName={getPartnerDetails(session.partnerId).name}
                        partnerAvatar={getPartnerDetails(session.partnerId).avatar || undefined}
                    />
                )}
                {session.type === 'video' && (
                    <FaceTimeHUD 
                        onClose={handleHangup}
                        partnerName={getPartnerDetails(session.partnerId).name}
                        partnerAvatar={getPartnerDetails(session.partnerId).avatar || undefined}
                        isMuted={isCallMuted}
                        setIsMuted={setIsCallMuted}
                        isCamOff={isCallVideoOff}
                        setIsCamOff={setIsCallVideoOff}
                        remoteUsers={remoteUsers}
                        localVideoTrack={localVideoTrack}
                        isMeetingActive={isCallActive}
                    />
                )}
            </div>,
            document.body
        )}
        </>
    )
}
