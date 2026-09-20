'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Home, User, Wallet, Plane, ShoppingBag } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Lobby',   href: '/',         Icon: Home,        color: '#00e5ff' },
  { label: 'Profile', href: '/profile',  Icon: User,        color: '#a78bfa' },
  { label: 'Finance', href: '/finance',  Icon: Wallet,      color: '#34d399' },
  { label: 'Travel',  href: '/travel',   Icon: Plane,       color: '#60a5fa' },
  { label: 'Store',   href: '/store',    Icon: ShoppingBag, color: '#f472b6' },
]

export default function NascNavPill() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 8px',
      borderRadius: 999,
      background: 'rgba(6, 0, 28, 0.75)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(0, 229, 255, 0.15)',
      boxShadow: '0 0 16px rgba(0,229,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      <style>{`
        @keyframes nascTipIn {
          from { opacity:0; transform:translateX(-50%) translateY(4px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      {NAV_LINKS.map(({ label, href, Icon, color }) => (
        <div key={label} style={{ position: 'relative' }}>
          <Link
            href={href}
            title={label}
            onMouseEnter={() => setHovered(label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: '50%',
              textDecoration: 'none',
              color: hovered === label ? color : 'rgba(255,255,255,0.45)',
              background: hovered === label ? `${color}1a` : 'transparent',
              border: `1px solid ${hovered === label ? `${color}55` : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.18s ease',
              flexShrink: 0,
            }}
          >
            <Icon size={14} />
          </Link>

          {/* Tooltip */}
          {hovered === label && (
            <div style={{
              position: 'absolute',
              bottom: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(6,0,28,0.92)',
              border: `1px solid ${color}44`,
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 600,
              color: color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
              pointerEvents: 'none',
              zIndex: 9999,
              animation: 'nascTipIn 0.15s ease forwards',
              boxShadow: `0 0 10px ${color}22`,
            }}>
              {label}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
