'use client'
import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/mapbox'
import { io, Socket } from 'socket.io-client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://staging.flydna.io'
const SESSION_ID = 'demo-room'
const TOKENS: Record<string, string> = {
  beta: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzMzFlMTk0Zi1iMTcyLTQzMmMtYTEwNi1iYjg1YmY5MDdiYzAiLCJpYXQiOjE3ODE1ODgzNzB9.2Xc76jp1aggyxgkSoCXMe9f8v30IFbVxjvnJWsHzbOs',
  jah: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJjYTY3OThlYi1hMDQ4LTQ0ZDEtOGY2MS1hZjk2NWI4OTQzNjUiLCJpYXQiOjE3ODE3NDQ2NDh9.-GH9bV4OLYaJD-xTtxiXykXIYDyTgMKOalXmdhDx9ZE',
}

function pickToken() {
  if (typeof window === 'undefined') return TOKENS.beta
  try { const s = localStorage.getItem('flydna_token'); if (s) return s } catch { }
  const search = typeof window !== 'undefined' ? window.location.search : ''
  const u = new URLSearchParams(search || '').get('user')
  return (u && TOKENS[u]) || TOKENS.beta

}
const PALETTE = ['#22d3ee', '#fbbf24', '#a855f7', '#34d399', '#f472b6', '#60a5fa', '#fb7185', '#4ade80']

function colorFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

function userIdFromToken(token: string) {
  try {
    let b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b.length % 4) b += '='
    return JSON.parse(atob(b))._id || 'unknown'
  } catch { return 'unknown' }
}

type Tap = { id: string; lng: number; lat: number; color: string }

function PulsePin({ color }: { color: string }) {
  return (
    <div style={{ position: 'relative', width: 44, height: 44 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${color}`, boxShadow: `0 0 16px ${color}`, animation: 'sessionRing 1.6s ease-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#1f2937', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z" /></svg>
      </div>
    </div>
  )
}

export default function NascSessionLayer() {
  const { current: mapRef } = useMap()
  const socketRef = useRef<Socket | null>(null)
  const myColorRef = useRef('#22d3ee')
  const [taps, setTaps] = useState<Tap[]>([])

  const addTap = (lng: number, lat: number, color: string) => {
    const tap = { id: Math.random().toString(36).slice(2), lng, lat, color }
    setTaps(prev => [...prev, tap])
    setTimeout(() => setTaps(prev => prev.filter(t => t.id !== tap.id)), 4000)
  }

  useEffect(() => {
    const s = document.createElement('style')
    s.textContent = '@keyframes sessionRing{0%{transform:scale(0.8);opacity:0.95}100%{transform:scale(2);opacity:0}}'
    document.head.appendChild(s)
    return () => { document.head.removeChild(s) }
  }, [])

  useEffect(() => {
    const token = pickToken()
    const myId = userIdFromToken(token)
    myColorRef.current = colorFor(myId)

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] })
    socketRef.current = socket
    socket.on('connect', () => {
      socket.emit('authenticate', { token }, () => {
        socket.emit('joinSession', { sessionId: SESSION_ID }, (res: any) => console.log('[session] joined?', res))
      })
    })
    socket.on('sessionTap', (data: any) => {
      const p = data?.payload
      if (p && typeof p.lng === 'number') addTap(p.lng, p.lat, colorFor(data.fromUserId || 'unknown'))
    })
    socket.on('connect_error', e => console.warn('[session] connect_error:', e.message))
    return () => { socket.emit('leaveSession', { sessionId: SESSION_ID }); socket.disconnect() }
  }, [])

  useEffect(() => {
    const m = mapRef?.getMap?.()
    if (!m) return
    const onClick = (e: any) => {
      const hasLcr = m.getLayer('lcr-glow') || m.getLayer('lcr-base')
      if (hasLcr) {
        const bbox: [[number, number], [number, number]] = [
          [e.point.x - 12, e.point.y - 12],
          [e.point.x + 12, e.point.y + 12]
        ]
        const features = m.queryRenderedFeatures(bbox, { layers: ['lcr-glow', 'lcr-base'] })
        if (features && features.length > 0) return
      }
      const { lng, lat } = e.lngLat
      socketRef.current?.emit('sessionTap', { sessionId: SESSION_ID, payload: { lng, lat } })
      addTap(lng, lat, myColorRef.current)
    }
    m.on('click', onClick)
    return () => { m.off('click', onClick) }
  }, [mapRef])

  return (
    <>
      {taps.map(t => (
        <Marker key={t.id} longitude={t.lng} latitude={t.lat}>
          <PulsePin color={t.color} />
        </Marker>
      ))}
    </>
  )
}
