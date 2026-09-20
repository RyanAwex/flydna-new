'use client'

import { useRef } from 'react'
import Lottie, { LottieRefCurrentProps } from 'lottie-react'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const planeAnimation   = require('../../public/plane.json')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ticketAnimation  = require('../../public/sports_ticket.json')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hotelAnimation   = require('../../public/Hotel.json')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const openbarAnimation = require('../../public/openbar.json')

interface NascInfrastructureStatusProps {
    visibleLayers: Set<string>
    onToggleLayer: (layer: string) => void
}

export default function NascInfrastructureStatus({ visibleLayers, onToggleLayer }: NascInfrastructureStatusProps) {
    const planeRef   = useRef<LottieRefCurrentProps>(null)
    const hotelRef   = useRef<LottieRefCurrentProps>(null)
    const sportsRef  = useRef<LottieRefCurrentProps>(null)
    const openbarRef = useRef<LottieRefCurrentProps>(null)

    const isOn = (layer: string) => visibleLayers.has(layer)

    const tileStyle = (layer: string): React.CSSProperties => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        padding: '10px 8px 8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: isOn(layer)
            ? 'var(--sidebar-accent)'
            : 'rgba(255,255,255,0.025)',
        border: isOn(layer)
            ? '1px solid var(--accent-primary)'
            : '1px solid var(--border)',
    })

    const labelStyle = (layer: string): React.CSSProperties => ({
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: isOn(layer) ? 'var(--accent-primary)' : 'var(--text-muted)',
        marginTop: 4,
        transition: 'color 0.2s',
        textAlign: 'center',
        lineHeight: 1.3,
    })

    return (
        <div className="glass-panel-heavy" style={{
            borderRadius: 14,
            padding: '14px 12px 12px',
            position: 'relative',
            overflow: 'hidden',
        }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                    Infrastructure
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    {visibleLayers.size} active
                </span>
            </div>

            {/* 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>

                {/* Airports */}
                <div
                    style={tileStyle('airports')}
                    onMouseEnter={() => planeRef.current?.play()}
                    onMouseLeave={() => planeRef.current?.stop()}
                    onClick={() => onToggleLayer('airports')}
                >
                    <Lottie lottieRef={planeRef} animationData={planeAnimation}
                        autoplay={false} loop={true}
                        style={{ width: 52, height: 52, marginTop: -6 }} />
                    <span style={labelStyle('airports')}>Airports</span>
                    {isOn('airports') && (
                        <div style={{ width: 18, height: 2, borderRadius: 1, background: 'var(--accent-primary)', marginTop: 4 }} />
                    )}
                </div>

                {/* Hotels */}
                <div
                    style={tileStyle('hotels')}
                    onMouseEnter={() => hotelRef.current?.play()}
                    onMouseLeave={() => hotelRef.current?.stop()}
                    onClick={() => onToggleLayer('hotels')}
                >
                    <Lottie lottieRef={hotelRef} animationData={hotelAnimation}
                        autoplay={false} loop={true}
                        style={{ width: 52, height: 52, marginTop: -6 }} />
                    <span style={labelStyle('hotels')}>Hotels</span>
                    {isOn('hotels') && (
                        <div style={{ width: 18, height: 2, borderRadius: 1, background: 'var(--accent-primary)', marginTop: 4 }} />
                    )}
                </div>

                {/* Sports & Events */}
                <div
                    style={tileStyle('sports')}
                    onMouseEnter={() => sportsRef.current?.play()}
                    onMouseLeave={() => sportsRef.current?.stop()}
                    onClick={() => onToggleLayer('sports')}
                >
                    <Lottie lottieRef={sportsRef} animationData={ticketAnimation}
                        autoplay={false} loop={true}
                        style={{ width: 56, height: 56 }} />
                    <span style={labelStyle('sports')}>Sports &amp; Events</span>
                    {isOn('sports') && (
                        <div style={{ width: 18, height: 2, borderRadius: 1, background: 'var(--accent-primary)', marginTop: 4 }} />
                    )}
                </div>

                {/* OpenBar */}
                <div
                    style={tileStyle('openbar')}
                    onMouseEnter={() => openbarRef.current?.play()}
                    onMouseLeave={() => openbarRef.current?.stop()}
                    onClick={() => onToggleLayer('openbar')}
                >
                    <Lottie lottieRef={openbarRef} animationData={openbarAnimation}
                        autoplay={false} loop={true}
                        style={{ width: 56, height: 56 }} />
                    <span style={labelStyle('openbar')}>OpenBar</span>
                    {isOn('openbar') && (
                        <div style={{ width: 18, height: 2, borderRadius: 1, background: 'var(--accent-primary)', marginTop: 4 }} />
                    )}
                </div>
            </div>

            {/* Cruise Fleet — full width row */}
            <div
                onClick={() => onToggleLayer('cruise')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: isOn('cruise') ? 'var(--sidebar-accent)' : 'rgba(255,255,255,0.025)',
                    border: isOn('cruise') ? '1px solid var(--accent-primary)' : '1px solid var(--border)',
                }}
            >
                {/* Ship icon */}
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M15 3 C18 9 20 13 20 18 L20 26 C20 28 18 29 15 29 C12 29 10 28 10 26 L10 18 C10 13 12 9 15 3Z"
                        fill={isOn('cruise') ? 'url(#cg)' : 'rgba(255,255,255,0.15)'}
                        stroke={isOn('cruise') ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}
                        strokeWidth="1"
                        style={{ transition: 'all 0.3s' }}
                    />
                    <defs>
                        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#bdf6ff" />
                            <stop offset="100%" stopColor="#0094bb" />
                        </linearGradient>
                    </defs>
                </svg>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: isOn('cruise') ? 'var(--accent-primary)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                        Cruise Fleet
                    </div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', opacity: 0.65, letterSpacing: '0.08em', marginTop: 2 }}>
                        Miami · New York Harbor · USS Intrepid
                    </div>
                </div>

                {/* Active dot */}
                <div style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: isOn('cruise') ? 'var(--accent-primary)' : 'var(--border)',
                    transition: 'all 0.3s',
                }} />
            </div>

            {/* Empty hint */}
            {visibleLayers.size === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', opacity: 0.4, fontSize: 9,
                    letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 10 }}>
                    Tap a category to reveal
                </p>
            )}
        </div>
    )
}
