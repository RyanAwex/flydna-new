'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Marker } from 'react-map-gl/mapbox'

interface CruiseShipProps {
  longitude: number
  latitude: number
  color?: string
  name?: string
  visible?: boolean
  status?: string
  guests?: string
}

export default function NascCruiseShip({ 
  longitude, 
  latitude, 
  color = '#00f0ff', 
  name = 'UTOPIA OF THE SEAS',
  visible = true,
  status = 'UNDERWAY',
  guests = '4,200'
}: CruiseShipProps) {
  const [showAd, setShowAd] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!visible) return null

  return (
    <>
      <Marker longitude={longitude} latitude={latitude} pitchAlignment="viewport" rotationAlignment="viewport">
        <div 
          className="cruise-ship-marker"
          style={{ 
            position: 'relative', 
            width: 240, 
            height: 120, 
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src="/ship-utopia-cutaway.png"
              alt={name}
              className="w-full h-full object-contain"
              style={{
                filter: `drop-shadow(0 0 15px ${color}80) drop-shadow(0 0 5px ${color})`,
                animation: 'float 4s ease-in-out infinite',
              }}
            />
            {/* Hologram grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{ 
                backgroundImage: 'url(/hologram-grid.svg)', 
                backgroundSize: '40px',
                maskImage: 'url(/ship-utopia-cutaway.png)',
                WebkitMaskImage: 'url(/ship-utopia-cutaway.png)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                animation: 'float 4s ease-in-out infinite',
              }}
            />
            
            {/* Callout Label */}
            <div className="callout callout-right" style={{ '--color': color } as any}>
                <div className="callout-dot"></div>
                <div className="callout-line"></div>
                <div 
                  className="callout-label"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAd(true);
                  }}
                >
                    <h3>{name}</h3>
                    <p>STATUS: {status}<br/>GUESTS: {guests}</p>
                </div>
            </div>
            
            <style>{`
              @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
              }
              .callout {
                position: absolute;
                top: 15px;
                left: 65%;
                display: flex;
                align-items: flex-start;
                pointer-events: none;
                animation: float 4s ease-in-out infinite;
                z-index: 10;
              }
              .callout-dot {
                width: 14px;
                height: 14px;
                background: rgba(6,0,20, 0.8);
                border: 2px solid var(--color);
                border-radius: 50%;
                flex-shrink: 0;
                position: relative;
                margin-top: 6px;
                box-shadow: 0 0 10px var(--color);
              }
              .callout-dot::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 4px;
                height: 4px;
                background: var(--color);
                border-radius: 50%;
              }
              .callout-line {
                width: 30px;
                height: 2px;
                background: var(--color);
                margin-top: 12px;
                flex-shrink: 0;
                position: relative;
                box-shadow: 0 0 5px var(--color);
              }
              .callout-line::after {
                content: '';
                position: absolute;
                width: 12px;
                height: 12px;
                border-right: 2px solid var(--color);
                border-top: 2px solid var(--color);
                right: 0;
                bottom: -12px;
              }
              .callout-label {
                background: rgba(6, 0, 20, 0.85);
                padding: 6px 10px;
                min-width: 120px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(0, 240, 255, 0.1);
                border-left: 3px solid var(--color);
                border-radius: 4px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                margin-left: 2px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
              }
              .callout-label:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(0,0,0,0.8);
              }
              .callout-label h3 {
                font-family: 'Orbitron', sans-serif;
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--color);
                margin-bottom: 4px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 4px;
                display: inline-block;
              }
              .callout-label p {
                font-family: monospace;
                font-size: 8px;
                line-height: 1.4;
                color: rgba(255,255,255,0.7);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
            `}</style>
          </div>
        </div>
      </Marker>

      {/* Full Screen Ad Popup Portal */}
      {mounted && showAd && typeof document !== 'undefined' && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
          }}
          onClick={(e) => { e.stopPropagation(); setShowAd(false); }}
        >
          <div 
            style={{
              position: 'relative',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(6,0,20,0.9) 0%, rgba(10,5,30,0.9) 100%)',
              border: `1px solid ${color}`,
              borderRadius: '16px',
              boxShadow: `0 0 40px ${color}80, inset 0 0 20px rgba(255,255,255,0.1)`,
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the ad container
          >
            {/* Close Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowAd(false); }}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: color,
                color: '#000',
                border: 'none',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            
            {/* Ad Content */}
            <div 
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                window.open('https://www.royalcaribbean.com/', '_blank');
              }}
            >
              <img 
                src="/icon-ad.jpg" 
                alt="Royal Caribbean Advertisement" 
                style={{ 
                  width: '100%',
                  maxWidth: '550px', 
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  display: 'block'
                }} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/ship-utopia-cutaway.png';
                }}
              />
              
              {/* BOOK NOW Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: `linear-gradient(135deg, ${color}dd, rgba(0,20,50,0.9))`,
                padding: '12px 24px',
                borderRadius: '8px',
                border: `2px solid ${color}`,
                boxShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 15px ${color}80`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ 
                  fontFamily: "'Orbitron', sans-serif", 
                  color: '#fff', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  letterSpacing: '2px', 
                  marginBottom: '2px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  BOOK NOW
                </span>
                <span style={{ 
                  fontFamily: 'monospace', 
                  color: color, 
                  fontSize: '28px', 
                  fontWeight: 900, 
                  letterSpacing: '1px',
                  textShadow: `0 0 10px ${color}80, 0 2px 4px rgba(0,0,0,0.8)`
                }}>
                  $799
                </span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

