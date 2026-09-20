'use client'

import { useEffect, useState, useRef } from 'react'

// PTT Push-to-Talk Widget
export function PTTWidget({
  onClose,
  partnerName = 'FlyDnA Back-Office',
  isIncoming = false,
}: {
  onClose: () => void
  partnerName?: string
  isIncoming?: boolean
}) {
  return (
    <div className="glass-panel-heavy" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '320px', gap: '10px',
      borderRadius: '16px', padding: '10px 16px',
      color: 'var(--text-main)',
      pointerEvents: 'auto',
      animation: 'hudSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes pttDotPulse {
          0%,100% { background: rgba(139, 115, 87, 0.15); box-shadow: none; }
          50% { background: var(--accent-primary); box-shadow: 0 0 8px var(--accent-primary); }
        }
        @keyframes hudSlideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: '9px', color: 'var(--accent-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 'bold' }}>
          {isIncoming ? 'Incoming PTT' : 'PTT Transmit'}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
          {partnerName}
        </span>
      </div>

      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>

      {/* Animated dot matrix */}
      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
        {Array.from({ length: 6 }).map((_, col) => {
          const delay = (col % 3) * 0.15 + (col > 2 ? 0.1 : 0)
          return (
            <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', animation: `pttDotPulse 0.9s infinite ease-in-out`, animationDelay: `${delay}s` }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', animation: `pttDotPulse 0.9s infinite ease-in-out`, animationDelay: `${delay + 0.15}s` }} />
            </div>
          )
        })}
      </div>

      <button onClick={onClose} style={{
        background: 'var(--sidebar-accent)',
        border: '1px solid var(--border)',
        borderRadius: '50%', width: '22px', height: '22px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-muted)', fontSize: '10px',
        fontWeight: 'bold', transition: 'all 0.15s', flexShrink: 0
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--sidebar-accent)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >✕</button>
    </div>
  )
}

// Audio Call Dynamic Island
export function AudioCallIsland({
  onClose,
  partnerName = 'FlyDnA Back-Office',
  partnerAvatar,
}: {
  onClose: () => void
  partnerName?: string
  partnerAvatar?: string
}) {
  const [time, setTime] = useState('')
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const update = () => {
      const d = new Date()
      const h = String(d.getHours() % 12 || 12).padStart(2, '0')
      const m = String(d.getMinutes()).padStart(2, '0')
      setTime(`${h}:${m}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const initial = partnerName ? partnerName.charAt(0).toUpperCase() : '?'

  return (
    <div className="glass-panel-heavy" style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      width: '320px', borderRadius: '16px', padding: '10px 14px',
      color: 'var(--text-main)', pointerEvents: 'auto',
      animation: 'hudSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <style>{`
        @keyframes miniWave {
          0%,100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      {partnerAvatar ? (
        <img src={partnerAvatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #10b981', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid #10b981', background: 'linear-gradient(135deg,#0a1931,#15305b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', color: '#10b981', flexShrink: 0 }}>
          {initial}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {partnerName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span style={{ fontSize: '8px', color: '#10b981', background: 'var(--sidebar-accent)', border: '1px solid var(--border)', padding: '1.5px 5px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            SECURE
          </span>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{fmt(seconds)}</span>
        </div>
      </div>

      {/* Connection visualizer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px', width: '35px', justifyContent: 'center', flexShrink: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const h = i < 3 ? (i + 1) * 3 + 2 : (5 - i) * 3 + 2
          const dur = [0.4, 0.6, 0.5, 0.7, 0.4][i]
          return (
            <div key={i} style={{
              width: '2px', height: `${h}px`, background: '#10b981', borderRadius: '1px',
              animation: `miniWave ${dur}s infinite ease-in-out alternate`, animationDelay: `${i * 0.05}s`
            }} />
          )
        })}
      </div>

      <button onClick={onClose} style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        border: 'none', borderRadius: '50%', width: '24px', height: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 4px 10px rgba(239,68,68,0.3)', flexShrink: 0
      }} title="Hangup">
        <span style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>✕</span>
      </button>
    </div>
  )
}

// Holographic FaceTime HUD
export function FaceTimeHUD({
  onClose,
  partnerName = 'FlyDnA Back-Office',
  partnerAvatar,
  isMuted = false,
  setIsMuted,
  isCamOff = false,
  setIsCamOff,
  remoteUsers = [],
  localVideoTrack,
  isMeetingActive = true,
}: {
  onClose: () => void
  partnerName?: string
  partnerAvatar?: string
  isMuted?: boolean
  setIsMuted?: (m: boolean) => void
  isCamOff?: boolean
  setIsCamOff?: (v: boolean) => void
  remoteUsers?: any[]
  localVideoTrack?: any
  isMeetingActive?: boolean
}) {
  const remoteUid = remoteUsers && remoteUsers.length > 0 ? remoteUsers[0].uid : null
  const remoteTrack = remoteUsers && remoteUsers.length > 0 ? remoteUsers[0].videoTrack : null

  // Bind video tracks dynamically
  useEffect(() => {
    if (!isMeetingActive) return

    if (localVideoTrack && !isCamOff) {
      try {
        localVideoTrack.play('nasc_agora_local')
      } catch (e) {
        console.warn('[FaceTimeHUD] Local play failed:', e)
      }
    }
  }, [localVideoTrack, isCamOff, isMeetingActive])

  useEffect(() => {
    if (!isMeetingActive) return

    if (remoteTrack && remoteUid) {
      try {
        remoteTrack.play(`nasc_agora_remote_${remoteUid}`)
      } catch (e) {
        console.warn('[FaceTimeHUD] Remote play failed:', e)
      }
    }
  }, [remoteTrack, remoteUid, isMeetingActive])

  const initial = partnerName ? partnerName.charAt(0).toUpperCase() : '?'

  return (
    <div className="glass-panel-heavy" style={{
      display: 'flex', flexDirection: 'column', width: '320px',
      borderRadius: '16px', overflow: 'hidden',
      color: 'var(--text-main)', pointerEvents: 'auto',
      animation: 'hudSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {/* HUD Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--sidebar-accent)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '9px', color: 'var(--accent-primary)', letterSpacing: '0.15em', fontWeight: 'bold' }}>
            NASC HD LINK
          </span>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-main)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partnerName}
          </span>
        </div>
        <span style={{ fontSize: '8px', color: 'var(--text-muted)', background: 'var(--sidebar-accent)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px' }}>
          AES-256
        </span>
      </div>

      {/* Video feeds stage */}
      <div style={{ position: 'relative', width: '100%', height: '180px', background: '#020006' }}>
        <div style={{ position: 'absolute', inset: '8px', border: '1px dashed var(--border)', pointerEvents: 'none', zIndex: 1 }} />

        {/* Remote Video Stream Target */}
        {remoteUid ? (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            <div id={`nasc_agora_remote_${remoteUid}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            {partnerAvatar ? (
              <img src={partnerAvatar} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--accent-primary)', objectFit: 'cover', background: '#12002b' }} />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--accent-primary)', background: 'linear-gradient(135deg,#0a1931,#15305b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {initial}
              </div>
            )}
            <span style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>WAITING ON REMOTE VIDEO FEED...</span>
          </div>
        )}

        {/* Picture-in-Picture Local Feed Window */}
        <div style={{
          position: 'absolute', bottom: '12px', right: '12px',
          width: '84px', height: '60px',
          border: '1.5px solid var(--border)', borderRadius: '8px',
          overflow: 'hidden', background: 'rgba(4,8,24,0.95)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.8)', zIndex: 2
        }}>
          {isCamOff ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#0c021f' }}>
              <span style={{ fontSize: '6px', color: 'rgba(255,68,68,0.7)', fontWeight: 'bold' }}>CAM OFF</span>
            </div>
          ) : (
            <div id="nasc_agora_local" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      </div>

      {/* Control panel buttons */}
      <div style={{
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        background: 'var(--sidebar-accent)',
        borderTop: '1px solid var(--border)'
      }}>
        {/* Toggle Video Button */}
        <button onClick={() => setIsCamOff?.(!isCamOff)} style={{
          background: isCamOff ? 'rgba(255,255,255,0.06)' : 'rgba(0,229,255,0.1)',
          border: `1.5px solid ${isCamOff ? 'var(--border)' : 'var(--accent-primary)'}`,
          borderRadius: '50%', width: '32px', height: '32px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s'
        }} title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}>
          <span style={{ color: isCamOff ? 'var(--text-muted)' : 'var(--accent-primary)', fontSize: '13px' }}>📷</span>
        </button>

        {/* Toggle Mute Button */}
        <button onClick={() => setIsMuted?.(!isMuted)} style={{
          background: isMuted ? 'rgba(255,255,255,0.06)' : 'rgba(0,229,255,0.1)',
          border: `1.5px solid ${isMuted ? 'var(--border)' : 'var(--accent-primary)'}`,
          borderRadius: '50%', width: '32px', height: '32px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s'
        }} title={isMuted ? 'Unmute Mic' : 'Mute Mic'}>
          <span style={{ color: isMuted ? '#ef4444' : 'var(--accent-primary)', fontSize: '13px' }}>{isMuted ? '🔇' : '🎤'}</span>
        </button>

        {/* End Call Button */}
        <button onClick={onClose} style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          border: 'none', borderRadius: '50%', width: '36px', height: '36px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(239,68,68,0.45)', transition: 'transform 0.1s'
        }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          title="End Call"
        >
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>📞</span>
        </button>
      </div>
    </div>
  )
}
