'use client';

import { useState, useRef, useEffect } from 'react';
import NascNavPill from './NascNavPill';

export interface SearchLocation {
  id: string;
  name: string;
  subtitle: string;
  city: string;
  type: 'city' | 'venue' | 'hotel' | 'airport' | 'sports';
  coords: [number, number];
  layer?: string;
}

export const SEARCH_LOCATIONS: SearchLocation[] = [
  // Cities
  { id: 'nyc_city', name: 'New York City', subtitle: 'Metropolis Port', city: 'New York', type: 'city', coords: [-73.9934, 40.7505] },
  { id: 'atl_city', name: 'Atlanta', subtitle: 'A-Town Core', city: 'Atlanta', type: 'city', coords: [-84.3800, 33.7900] },
  { id: 'mia_city', name: 'Miami', subtitle: 'Florida Coastal', city: 'Florida', type: 'city', coords: [-80.1918, 25.7617] },
  { id: 'aus_city', name: 'Austin', subtitle: 'Texas Capital', city: 'Texas', type: 'city', coords: [-97.7431, 30.2672] },
  // Atlanta Venues
  { id: 'nobu', name: 'Nobu Hotel Atlanta', subtitle: 'Luxury Lodging Buckhead', city: 'Atlanta', type: 'hotel', coords: [-84.3615, 33.8475], layer: 'hotels' },
  { id: 'cnn', name: 'CNN Center', subtitle: 'Global News Hub', city: 'Atlanta', type: 'sports', coords: [-84.3953, 33.7583], layer: 'sports' },
  { id: 'mercedes-benz', name: 'Mercedes-Benz Stadium', subtitle: 'Falcons & United FC', city: 'Atlanta', type: 'sports', coords: [-84.4004, 33.7554], layer: 'sports' },
  { id: 'state-farm', name: 'State Farm Arena', subtitle: 'Atlanta Hawks', city: 'Atlanta', type: 'sports', coords: [-84.3963, 33.7573], layer: 'sports' },
  { id: 'truist-park', name: 'Truist Park', subtitle: 'Atlanta Braves', city: 'Atlanta', type: 'sports', coords: [-84.4677, 33.8903], layer: 'sports' },
  { id: 'cosm', name: 'Cosm Atlanta', subtitle: 'Shared Reality Dome', city: 'Atlanta', type: 'sports', coords: [-84.3950, 33.7600], layer: 'sports' },
  { id: 'ponce-city', name: 'Ponce City Market', subtitle: '9 Mile Station Shop', city: 'Atlanta', type: 'venue', coords: [-84.3664, 33.7730], layer: 'openbar' },
  { id: 'pete-petit', name: 'Center Parc Stadium', subtitle: 'Pete Petit Field', city: 'Atlanta', type: 'sports', coords: [-84.3894, 33.7353], layer: 'sports' },
  { id: 'hartsfield', name: 'Hartsfield-Jackson', subtitle: 'ATL Delta Hub Airport', city: 'Atlanta', type: 'airport', coords: [-84.4277, 33.6407], layer: 'airports' },
  // New York Venues
  { id: 'msg', name: 'Madison Square Garden', subtitle: 'MSG Arena', city: 'New York', type: 'sports', coords: [-73.9936, 40.7508], layer: 'sports' },
  { id: 'citi', name: 'Citi Field', subtitle: 'Mets Baseball', city: 'New York', type: 'sports', coords: [-73.8456, 40.7571], layer: 'sports' },
  { id: 'yankee', name: 'Yankee Stadium', subtitle: 'Bronx Bombers', city: 'New York', type: 'sports', coords: [-73.9262, 40.8296], layer: 'sports' },
  { id: 'metlife', name: 'MetLife Stadium', subtitle: 'Giants & Jets', city: 'New York', type: 'sports', coords: [-74.0745, 40.8128], layer: 'sports' },
  { id: 'jfk', name: 'JFK Airport', subtitle: 'John F. Kennedy Intl', city: 'New York', type: 'airport', coords: [-73.7785, 40.6428], layer: 'airports' },
  { id: 'lga', name: 'LaGuardia Airport', subtitle: 'LGA Airport', city: 'New York', type: 'airport', coords: [-73.8750, 40.7751], layer: 'airports' },
  // Florida Venues
  { id: 'fontainebleau', name: 'Fontainebleau Miami Beach', subtitle: 'Iconic Resort', city: 'Florida', type: 'hotel', coords: [-80.1220, 25.8174], layer: 'hotels' },
  { id: 'hard_rock_stadium', name: 'Hard Rock Stadium', subtitle: 'Dolphins & Rolling Loud', city: 'Florida', type: 'sports', coords: [-80.2376, 25.9580], layer: 'sports' },
  { id: 'mia_airport', name: 'Miami International Airport', subtitle: 'MIA Airport', city: 'Florida', type: 'airport', coords: [-80.2870, 25.7959], layer: 'airports' },
];

export interface NascHeaderProps {
  onSearchSelect?: (location: SearchLocation) => void;
}

export default function NascHeader({ onSearchSelect }: NascHeaderProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = query.trim()
    ? SEARCH_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        loc.city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = (loc: SearchLocation) => {
    setQuery('');
    setIsOpen(false);
    onSearchSelect?.(loc);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % Math.max(matches.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + matches.length) % Math.max(matches.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[highlightedIndex]) handleSelect(matches[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="w-full px-6 flex items-center justify-between pointer-events-none"
      style={{ height: '136px' }}
    >
      <style>{`
        @keyframes border-pulse {
          0%, 100% {
            box-shadow:
              0 -4px 14px rgba(168,85,247,0.4),
              4px 0 14px rgba(45,212,191,0.4),
              0 4px 14px rgba(236,72,153,0.4),
              -4px 0 14px rgba(34,197,94,0.4);
          }
          50% {
            box-shadow:
              0 -8px 26px rgba(168,85,247,0.75),
              8px 0 26px rgba(45,212,191,0.75),
              0 8px 26px rgba(236,72,153,0.75),
              -8px 0 26px rgba(34,197,94,0.75);
          }
        }
        @keyframes hud-live-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* LEFT — Nav Pill */}
      <div style={{ flexShrink: 0, width: '148px', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}>
        <NascNavPill />
      </div>

      {/* CENTER — Title + Search + Nav */}
      <div className="flex flex-col gap-2 items-center flex-1 max-w-lg pointer-events-auto">
        <h1 className="text-center font-serif flex flex-col items-center leading-none">
          <span
            className="text-xl md:text-2xl font-light tracking-wide md:tracking-wider"
            style={{
              background: 'linear-gradient(90deg,#a060ff,#e080ff,#60a0ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            FlyDnA NASC
          </span>
          <span
            className="text-xs md:text-sm font-light tracking-widest opacity-85 mt-1"
            style={{
              background: 'linear-gradient(90deg,#a060ff,#e080ff,#60a0ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            &ldquo;Network Activity Service Center&rdquo;
          </span>
        </h1>

        {/* SEARCH BAR */}
        <div className="w-full relative group" ref={dropdownRef}>
          <input
            type="text"
            placeholder="Search assets, locations, or DNA..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full glass-input text-foreground text-xs px-4 py-2.5 rounded-full focus:outline-none placeholder-muted-foreground/50 transition-all duration-300"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground transition-colors text-xs font-sans pr-1 cursor-pointer"
              >
                ✕
              </button>
            )}
            <svg className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Autocomplete dropdown */}
          {isOpen && matches.length > 0 && (
            <div
              className="glass-panel-heavy"
              style={{
                position: 'absolute',
                top: '115%',
                left: 0,
                right: 0,
                zIndex: 9999,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {matches.map((loc, idx) => {
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={loc.id}
                    onClick={() => handleSelect(loc)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      background: isHighlighted ? 'var(--sidebar-accent)' : 'transparent',
                      borderLeft: isHighlighted ? '3px solid var(--accent-primary)' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {loc.name}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                        {loc.subtitle}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '8px', padding: '1.5px 5px', borderRadius: '4px',
                        background: 'rgba(139,115,87,0.15)', border: '1px solid rgba(139,115,87,0.3)',
                        color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600,
                      }}>
                        {loc.type}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {loc.city}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NAV LINKS — original design */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <span className="text-foreground border-b border-foreground cursor-pointer text-[10px] tracking-widest uppercase font-semibold">Global Map</span>
          <span className="text-muted-foreground cursor-pointer hover:text-foreground text-[10px] tracking-widest uppercase font-semibold transition-colors">DNA Vault</span>
          <span className="text-muted-foreground cursor-pointer hover:text-foreground text-[10px] tracking-widest uppercase font-semibold transition-colors">Live Social</span>
          <span className="text-muted-foreground cursor-pointer hover:text-foreground text-[10px] tracking-widest uppercase font-semibold transition-colors">Chat</span>
          <span className="text-muted-foreground cursor-pointer hover:text-foreground text-[10px] tracking-widest uppercase font-semibold transition-colors">Reservations</span>
        </div>
      </div>

      {/* RIGHT — Avatars + Live indicator */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto" style={{ flexShrink: 0 }}>
        <div className="flex -space-x-3 cursor-pointer hover:space-x-1 transition-all duration-500 ease-out">
          <img src="/JetBlue.png" alt="User 1" className="w-11 h-11 rounded-full border-2 border-[#08001a] shadow-[0_0_8px_rgba(0,229,255,0.4)] bg-[#12002b] object-contain p-1 transition-all duration-300 hover:scale-150 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(0,229,255,0.8)] hover:z-50 relative z-10" />
          <img src="/NY_Giants.png" alt="User 2" className="w-11 h-11 rounded-full border-2 border-[#08001a] shadow-[0_0_8px_rgba(168,85,247,0.4)] bg-[#12002b] object-contain p-1 transition-all duration-300 hover:scale-150 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(168,85,247,0.8)] hover:z-50 relative z-20" />
          <img src="/Ranger_Logo.png" alt="User 3" className="w-11 h-11 rounded-full border-2 border-[#08001a] shadow-[0_0_8px_rgba(236,72,153,0.4)] bg-[#12002b] object-contain p-1 transition-all duration-300 hover:scale-150 hover:-translate-y-2 hover:shadow-[0_8px_16px_rgba(236,72,153,0.8)] hover:z-50 relative z-30" />
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            style={{ animation: 'hud-live-blink 2s ease-in-out infinite', boxShadow: '0 0 6px #22d3ee' }}
          />
          <span className="text-cyan-400 text-xs tracking-widest uppercase">Live</span>
        </div>
      </div>
    </div>
  );
}
