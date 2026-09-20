"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Coins, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Lock, 
  Tv, 
  UserCheck, 
  TrendingUp, 
  Zap, 
  Award,
  LockKeyhole
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Preset Backdrop Scenes (mp4 or images located in public/scenes/)
const SCENES = [
  { id: "bg_beach", name: "Beach Resort", type: "video", src: "/scenes/beach.mp4", thumb: "/scenes/beach_thumb.png", premium: false },
  { id: "bg_cyberpunk", name: "Cyberpunk Alley", type: "image", src: "/scenes/cyberpunk.png", premium: true },
  { id: "bg_aurora", name: "Aurora Skies", type: "image", src: "/scenes/aurora.png", premium: true },
  { id: "bg_bamboo", name: "Bamboo Forest", type: "image", src: "/scenes/bamboo.png", premium: false },
  { id: "bg_tech", name: "Hangar/Tech Hangar", type: "image", src: "/scenes/tech.png", premium: true },
];

// Available Characters
const CHARACTERS = [
  {
    id: "char_noah",
    name: "Noah Smith",
    level: 7,
    title: "Agile Voyager",
    image: "/avatar_ryan.png",
    premium: false,
    stats: { agility: 80, network: 65, social: 75 },
    skins: { Realism: "/scenes/concierge.png", Cartoon: "/avatar_ryan.png", Anime: "/avatar-1.png" }
  },
  {
    id: "char_emelia",
    name: "Emelia",
    level: 10,
    title: "Ice Blade",
    image: "/avatar_lisa.png",
    premium: false,
    stats: { agility: 95, network: 70, social: 90 },
    skins: { Realism: "/scenes/concierge.png", Cartoon: "/avatar_lisa.png", Anime: "/avatar-2.png" }
  },
  {
    id: "char_kennard",
    name: "Kennard",
    level: 15,
    title: "NASC Overlord",
    image: "/avatar-1.png",
    premium: true,
    stats: { agility: 99, network: 99, social: 95 },
    skins: { Realism: "/scenes/concierge.png", Cartoon: "/avatar-1.png", Anime: "/avatar_ryan.png" }
  },
];

export default function CharacterBuilder() {
  const [activeChar, setActiveChar] = useState(CHARACTERS[0]);
  const [activeBackdrop, setActiveBackdrop] = useState(SCENES[0]);
  const [activeStyle, setActiveStyle] = useState<"Realism" | "Cartoon" | "Anime">("Cartoon");
  const [coins, setCoins] = useState(1560);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchasedScenes, setPurchasedScenes] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flydna_purchased_scenes");
      if (stored) {
        setPurchasedScenes(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const isSceneUnlocked = (scene: typeof SCENES[0]) => {
    if (!scene.premium) return true;
    
    // Map of ChatPanel scene ids to path URLs
    const pathMap: Record<number, string> = {
      1: "/scenes/cyberpunk.png",
      2: "/scenes/bamboo.png",
      10: "/scenes/aurora.png",
      100: "/scenes/beach.mp4",
      104: "/scenes/cyberpunk_alley.mp4",
    };
    
    return purchasedScenes.some((id) => pathMap[id] === scene.src);
  };

  const handleSelectChar = (char: typeof CHARACTERS[0]) => {
    if (char.premium) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveChar(char);
  };

  const handleSelectBackdrop = (scene: typeof SCENES[0]) => {
    if (!isSceneUnlocked(scene)) {
      setShowUpgradeModal(true);
      return;
    }
    setActiveBackdrop(scene);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-start text-white">
      {/* Navigation & Token bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
        <Link
          href="/travel"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={14} /> Back to Travel
        </Link>

        {/* Currency Display */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl shadow-inner">
          <Coins className="text-amber-400" size={18} />
          <span className="text-sm font-black tracking-wider text-amber-300">{coins} TOKENS</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Character Selector (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-[#06111f]/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
            👤 Select Traveler
          </h2>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {CHARACTERS.map((char) => {
              const isActive = activeChar.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectChar(char)}
                  className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-4 transition-all duration-300 relative border ${
                    isActive
                      ? "border-amber-400/40 bg-amber-400/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0b172a] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-wide truncate">{char.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{char.title}</p>
                  </div>
                  {char.premium && (
                    <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 shrink-0">
                      <Lock size={12} />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Custom Add Slot */}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-4 border border-dashed border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition duration-200"
            >
              <Lock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">+ Scan Face</span>
            </button>
          </div>
        </div>

        {/* MIDDLE COLUMN: Backdrop / Character Render Viewport (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4 bg-[#06111f]/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          
          {/* Main Visualizer */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
            
            {/* Backdrop MP4 Loop or Static Image */}
            {activeBackdrop.type === "video" ? (
              <video
                src={activeBackdrop.src}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={activeBackdrop.src}
                alt={activeBackdrop.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
            {/* Dark glass cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

            {/* Floating Character Frame */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400 bg-slate-950/80 backdrop-blur-md shadow-2xl p-1.5 flex items-center justify-center select-none animate-pulse">
                <img
                  src={activeChar.skins[activeStyle] || activeChar.image}
                  alt={activeChar.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="mt-2.5 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-400/30 backdrop-blur-md text-[10px] font-black uppercase tracking-widest shadow-lg text-amber-300">
                LVL {activeChar.level}
              </span>
            </div>

            {/* Active Style Watermark */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
              <Tv size={10} className="text-amber-400" /> Rendering: {activeStyle}
            </div>
          </div>

          {/* Backdrop Selector List */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              🌴 Select Backdrop
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {SCENES.map((scene) => {
                const isActive = activeBackdrop.id === scene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSelectBackdrop(scene)}
                    className={`flex-shrink-0 w-28 text-left transition-all duration-300 border rounded-2xl overflow-hidden bg-[#0a172a] ${
                      isActive
                        ? "border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="h-14 bg-slate-900 overflow-hidden relative">
                      {!isSceneUnlocked(scene) && (
                        <div className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-amber-400/20 text-amber-400 z-10">
                          <Lock size={8} />
                        </div>
                      )}
                      <img 
                        src={scene.type === "video" ? (scene.thumb || scene.src) : scene.src} 
                        alt={scene.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="p-2">
                      <span className="text-[9px] font-black uppercase tracking-wide truncate block text-slate-300">
                        {scene.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Style, Stats & Gear Customization (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-5 bg-[#06111f]/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
          
          {/* Style Selector */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              🎭 Character Style
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(["Realism", "Cartoon", "Anime"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    if (style === "Realism") {
                      setShowUpgradeModal(true);
                      return;
                    }
                    setActiveStyle(style);
                  }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-center transition duration-200 border ${
                    activeStyle === style
                      ? "bg-amber-400 text-slate-950 border-amber-500 shadow-md"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {style === "Realism" ? "🔒 Realism" : style}
                </button>
              ))}
            </div>
          </div>

          {/* Core Stats Progress Bars */}
          <div className="border-t border-white/5 pt-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              📊 Core Stats
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mb-1">
                  <span>Agile Flying</span>
                  <span>{activeChar.stats.agility}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${activeChar.stats.agility}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mb-1">
                  <span>NASC Network</span>
                  <span>{activeChar.stats.network}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${activeChar.stats.network}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase mb-1">
                  <span>Social loyalty</span>
                  <span>{activeChar.stats.social}%</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${activeChar.stats.social}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Action upgrade */}
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 active:scale-95 transition rounded-2xl text-xs font-black text-slate-950 uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.2)] mt-auto cursor-pointer"
          >
            Upgrade Attributes
          </button>
        </div>

      </div>

      {/* Upgrade/NASC Subscription Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowUpgradeModal(false)} />
          
          <div className="relative glass-panel-heavy border border-amber-400/40 w-full max-w-md bg-[#06111f]/95 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="p-4 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full mb-4">
              <LockKeyhole size={32} className="animate-pulse" />
            </div>
            
            <h3 className="text-xl font-black text-white uppercase tracking-wide">
              NASC Gold Feature
            </h3>
            
            <p className="text-xs text-slate-300 font-semibold mt-2.5 max-w-xs">
              Skins, Cinematic Realism avatars, advanced face scanning, and premium 3D flight maps are exclusive to NASC Gold members.
            </p>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 w-full my-6 text-left">
              <h4 className="text-[10px] font-black uppercase text-amber-300 tracking-wider mb-2">Unlocked with Gold:</h4>
              <ul className="space-y-1.5 text-[10px] font-bold text-slate-300">
                <li>🚀 3D Tactical Radar Map view</li>
                <li>📸 Realism style avatar customizer</li>
                <li>🛰️ E2E Encrypted lobby chat status</li>
                <li>🎟️ Unlimited Immersive video backdrops</li>
              </ul>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-xs font-bold text-slate-300 uppercase cursor-pointer hover:bg-white/5"
              >
                Close
              </button>
              <Link
                href="/travel/subscription"
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-600 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase text-center block cursor-pointer"
              >
                Upgrade ($100/mo)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
