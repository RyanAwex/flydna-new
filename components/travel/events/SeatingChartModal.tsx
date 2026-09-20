"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShoppingBag,
  Check,
  Armchair,
  Shield,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Info,
  Sparkles,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import CinematicSightlineView from "./CinematicSightlineView";

export type SectionLevel = "Courtside" | "Lower" | "Club" | "Upper";
export type SectionTier = "VIP" | "Premium" | "Standard" | "Value";

export interface SeatingEventData {
  id?: string | number;
  name: string;
  venue: string;
  city?: string;
  date?: string;
  time?: string;
  priceMin?: number;
  category?: string;
  opponentLogo?: string;
  image?: string;
}

export interface SectionGroup {
  id: string;
  level: SectionLevel;
  tier: SectionTier;
  sectionStart: number;
  sectionEnd: number;
  pricePerSeat: number;
  available: number;
  totalCapacity: number;
  amenities: string[];
  viewImage: string;
}

export interface SelectedSeat {
  section: number;
  row: string;
  seat: number;
  price: number;
  tier: SectionTier;
  level: SectionLevel;
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    id: "courtside",
    level: "Courtside",
    tier: "VIP",
    sectionStart: 1,
    sectionEnd: 8,
    pricePerSeat: 0,
    available: 24,
    totalCapacity: 80,
    amenities: ["Courtside Access", "VIP Lounge", "Complimentary Food & Drink", "Priority Valet"],
    viewImage: "/assets/seats/courtside.jpg",
  },
  {
    id: "lower-center",
    level: "Lower",
    tier: "Premium",
    sectionStart: 101,
    sectionEnd: 108,
    pricePerSeat: 0,
    available: 340,
    totalCapacity: 800,
    amenities: ["Prime Centerline View", "In-Seat Waiter Service", "Club Concourse Access"],
    viewImage: "/assets/seats/lower.jpg",
  },
  {
    id: "lower-sideline",
    level: "Lower",
    tier: "Premium",
    sectionStart: 109,
    sectionEnd: 116,
    pricePerSeat: 0,
    available: 420,
    totalCapacity: 1000,
    amenities: ["Wide Padded Seats", "Dedicated Concourse Gate"],
    viewImage: "/assets/seats/lower.jpg",
  },
  {
    id: "lower-corner",
    level: "Lower",
    tier: "Standard",
    sectionStart: 117,
    sectionEnd: 128,
    pricePerSeat: 0,
    available: 560,
    totalCapacity: 1400,
    amenities: ["Lower Bowl Sightlines", "Concourse Access"],
    viewImage: "/assets/seats/lower.jpg",
  },
  {
    id: "club-level",
    level: "Club",
    tier: "Standard",
    sectionStart: 201,
    sectionEnd: 216,
    pricePerSeat: 0,
    available: 380,
    totalCapacity: 1200,
    amenities: ["Exclusive Club Lounge", "Private Restrooms", "Gourmet Dining Options"],
    viewImage: "/assets/seats/club.jpg",
  },
  {
    id: "upper-center",
    level: "Upper",
    tier: "Value",
    sectionStart: 301,
    sectionEnd: 308,
    pricePerSeat: 0,
    available: 480,
    totalCapacity: 1600,
    amenities: ["Panoramic Elevated Arena View", "Fast Concessions"],
    viewImage: "/assets/seats/upper.jpg",
  },
  {
    id: "upper-sideline",
    level: "Upper",
    tier: "Value",
    sectionStart: 309,
    sectionEnd: 320,
    pricePerSeat: 0,
    available: 620,
    totalCapacity: 2000,
    amenities: ["Elevated Sideline Sightline", "Standard Amenities"],
    viewImage: "/assets/seats/upper.jpg",
  },
  {
    id: "upper-corner",
    level: "Upper",
    tier: "Value",
    sectionStart: 321,
    sectionEnd: 332,
    pricePerSeat: 0,
    available: 720,
    totalCapacity: 2400,
    amenities: ["Value Ticket Category", "Upper Concourse"],
    viewImage: "/assets/seats/upper.jpg",
  },
];

const TIER_THEMES: Record<SectionTier, { name: string; fill: string; stroke: string; glow: string; text: string; bg: string }> = {
  VIP: {
    name: "VIP Courtside",
    fill: "rgba(245, 158, 11, 0.4)",
    stroke: "rgba(251, 191, 36, 0.9)",
    glow: "rgba(245, 158, 11, 0.5)",
    text: "text-amber-400",
    bg: "bg-amber-500/20 border-amber-400/40 text-amber-300",
  },
  Premium: {
    name: "Lower Bowl Premium",
    fill: "rgba(6, 182, 212, 0.35)",
    stroke: "rgba(34, 211, 238, 0.85)",
    glow: "rgba(6, 182, 212, 0.5)",
    text: "text-cyan-400",
    bg: "bg-cyan-500/20 border-cyan-400/40 text-cyan-300",
  },
  Standard: {
    name: "Club & Mid-Bowl",
    fill: "rgba(168, 85, 247, 0.35)",
    stroke: "rgba(192, 132, 252, 0.85)",
    glow: "rgba(168, 85, 247, 0.5)",
    text: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-400/40 text-purple-300",
  },
  Value: {
    name: "Upper Bowl",
    fill: "rgba(59, 130, 246, 0.25)",
    stroke: "rgba(96, 165, 250, 0.7)",
    glow: "rgba(59, 130, 246, 0.4)",
    text: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-400/40 text-blue-300",
  },
};

interface SectionPolygon {
  id: string;
  number: number;
  level: SectionLevel;
  tier: SectionTier;
  group: SectionGroup;
  d: string;
  labelX: number;
  labelY: number;
}

function generateStadiumSections(): SectionPolygon[] {
  const result: SectionPolygon[] = [];
  const cx = 500;
  const cy = 350;

  // 1. Courtside (8 sections surrounding the hardwood court)
  const courtsideGroup = SECTION_GROUPS.find((g) => g.id === "courtside")!;
  for (let i = 0; i < 8; i++) {
    const angleStart = (i * 45 - 22.5) * (Math.PI / 180);
    const angleEnd = ((i + 1) * 45 - 22.5) * (Math.PI / 180);
    const r1 = 95;
    const r2 = 125;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + (r1 * 0.72) * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + (r2 * 0.72) * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + (r2 * 0.72) * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + (r1 * 0.72) * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2 * 0.72} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1 * 0.72} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + (labelR * 0.72) * Math.sin(midAngle);

    result.push({
      id: `sec-${i + 1}`,
      number: i + 1,
      level: "Courtside",
      tier: "VIP",
      group: courtsideGroup,
      d,
      labelX,
      labelY,
    });
  }

  // 2. Lower Bowl (101 - 128 = 28 sections)
  for (let i = 0; i < 28; i++) {
    const angleStep = 360 / 28;
    const angleStart = (i * angleStep - 90) * (Math.PI / 180);
    const angleEnd = ((i + 1) * angleStep - 90) * (Math.PI / 180);
    const r1 = 138;
    const r2 = 188;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + (r1 * 0.74) * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + (r2 * 0.74) * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + (r2 * 0.74) * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + (r1 * 0.74) * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2 * 0.74} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1 * 0.74} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + (labelR * 0.74) * Math.sin(midAngle);
    const sectionNum = 101 + i;

    const groupId = sectionNum <= 108 ? "lower-center" : sectionNum <= 116 ? "lower-sideline" : "lower-corner";
    const group = SECTION_GROUPS.find((g) => g.id === groupId) || SECTION_GROUPS[1];

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Lower",
      tier: group.tier,
      group,
      d,
      labelX,
      labelY,
    });
  }

  // 3. Club Level (201 - 216 = 16 sections)
  const clubGroup = SECTION_GROUPS.find((g) => g.id === "club-level")!;
  for (let i = 0; i < 16; i++) {
    const angleStep = 360 / 16;
    const angleStart = (i * angleStep - 90) * (Math.PI / 180);
    const angleEnd = ((i + 1) * angleStep - 90) * (Math.PI / 180);
    const r1 = 200;
    const r2 = 245;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + (r1 * 0.75) * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + (r2 * 0.75) * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + (r2 * 0.75) * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + (r1 * 0.75) * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2 * 0.75} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1 * 0.75} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + (labelR * 0.75) * Math.sin(midAngle);
    const sectionNum = 201 + i;

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Club",
      tier: "Standard",
      group: clubGroup,
      d,
      labelX,
      labelY,
    });
  }

  // 4. Upper Bowl (301 - 332 = 32 sections)
  for (let i = 0; i < 32; i++) {
    const angleStep = 360 / 32;
    const angleStart = (i * angleStep - 90) * (Math.PI / 180);
    const angleEnd = ((i + 1) * angleStep - 90) * (Math.PI / 180);
    const r1 = 258;
    const r2 = 315;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + (r1 * 0.76) * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + (r2 * 0.76) * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + (r2 * 0.76) * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + (r1 * 0.76) * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2 * 0.76} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1 * 0.76} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + (labelR * 0.76) * Math.sin(midAngle);
    const sectionNum = 301 + i;

    const groupId = sectionNum <= 308 ? "upper-center" : sectionNum <= 320 ? "upper-sideline" : "upper-corner";
    const group = SECTION_GROUPS.find((g) => g.id === groupId) || SECTION_GROUPS[5];

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Upper",
      tier: "Value",
      group,
      d,
      labelX,
      labelY,
    });
  }

  return result;
}

const SPHERE_GROUPS: SectionGroup[] = [
  {
    id: "sphere-floor-vip",
    level: "Courtside",
    tier: "VIP",
    sectionStart: 101,
    sectionEnd: 108,
    pricePerSeat: 0,
    available: 36,
    totalCapacity: 120,
    amenities: ["100 Haptic Floor Deck", "VIP Private Lounge", "Holoplot Immersive Audio", "Complimentary Hospitality"],
    viewImage: "/assets/events/sphere_sightline_real.png",
  },
  {
    id: "sphere-prime-200",
    level: "Lower",
    tier: "Premium",
    sectionStart: 201,
    sectionEnd: 212,
    pricePerSeat: 0,
    available: 380,
    totalCapacity: 950,
    amenities: ["Prime 200 Sweet Spot", "Optimal 16K Wraparound Arc", "In-Seat Waiter Service"],
    viewImage: "/assets/events/sphere_sightline_real.png",
  },
  {
    id: "sphere-club-300",
    level: "Club",
    tier: "Standard",
    sectionStart: 301,
    sectionEnd: 314,
    pricePerSeat: 0,
    available: 460,
    totalCapacity: 1400,
    amenities: ["300 Club Executive Level", "VIP Concourse Access", "Panoramic Sightlines"],
    viewImage: "/assets/events/sphere_sightline_real.png",
  },
  {
    id: "sphere-upper-400",
    level: "Upper",
    tier: "Value",
    sectionStart: 401,
    sectionEnd: 416,
    pricePerSeat: 0,
    available: 640,
    totalCapacity: 2200,
    amenities: ["400 Panoramic High Dome View", "Full Amphitheater Canvas", "Fast Concessions"],
    viewImage: "/assets/events/sphere_sightline_real.png",
  },
];

function generateSphereSections(): SectionPolygon[] {
  const result: SectionPolygon[] = [];
  const cx = 500;
  const cy = 245;

  // 1. VIP Haptic Floor / Director's Suites (101 - 108 = 8 sections in front arc)
  const floorGroup = SPHERE_GROUPS[0];
  for (let i = 0; i < 8; i++) {
    const angleStart = (30 + i * 15) * (Math.PI / 180);
    const angleEnd = (30 + (i + 1) * 15) * (Math.PI / 180);
    const r1 = 110;
    const r2 = 160;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + r1 * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + r2 * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + r2 * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + r1 * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    const sectionNum = 101 + i;

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Courtside",
      tier: "VIP",
      group: floorGroup,
      d,
      labelX,
      labelY,
    });
  }

  // 2. Prime 200 Center (The Sweet Spot - Sections 201 - 212 = 12 sections)
  const primeGroup = SPHERE_GROUPS[1];
  for (let i = 0; i < 12; i++) {
    const angleStart = (20 + i * 11.66) * (Math.PI / 180);
    const angleEnd = (20 + (i + 1) * 11.66) * (Math.PI / 180);
    const r1 = 175;
    const r2 = 238;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + r1 * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + r2 * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + r2 * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + r1 * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    const sectionNum = 201 + i;

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Lower",
      tier: "Premium",
      group: primeGroup,
      d,
      labelX,
      labelY,
    });
  }

  // 3. 300 Club Level (Sections 301 - 314 = 14 sections)
  const clubGroup = SPHERE_GROUPS[2];
  for (let i = 0; i < 14; i++) {
    const angleStart = (15 + i * 10.7) * (Math.PI / 180);
    const angleEnd = (15 + (i + 1) * 10.7) * (Math.PI / 180);
    const r1 = 252;
    const r2 = 318;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + r1 * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + r2 * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + r2 * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + r1 * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    const sectionNum = 301 + i;

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Club",
      tier: "Standard",
      group: clubGroup,
      d,
      labelX,
      labelY,
    });
  }

  // 4. 400 Panoramic High Tier (Sections 401 - 416 = 16 sections)
  const upperGroup = SPHERE_GROUPS[3];
  for (let i = 0; i < 16; i++) {
    const angleStart = (10 + i * 10) * (Math.PI / 180);
    const angleEnd = (10 + (i + 1) * 10) * (Math.PI / 180);
    const r1 = 332;
    const r2 = 398;

    const x1 = cx + r1 * Math.cos(angleStart);
    const y1 = cy + r1 * Math.sin(angleStart);
    const x2 = cx + r2 * Math.cos(angleStart);
    const y2 = cy + r2 * Math.sin(angleStart);
    const x3 = cx + r2 * Math.cos(angleEnd);
    const y3 = cy + r2 * Math.sin(angleEnd);
    const x4 = cx + r1 * Math.cos(angleEnd);
    const y4 = cy + r1 * Math.sin(angleEnd);

    const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;
    const midAngle = (angleStart + angleEnd) / 2;
    const labelR = (r1 + r2) / 2;
    const labelX = cx + labelR * Math.cos(midAngle);
    const labelY = cy + labelR * Math.sin(midAngle);
    const sectionNum = 401 + i;

    result.push({
      id: `sec-${sectionNum}`,
      number: sectionNum,
      level: "Upper",
      tier: "Value",
      group: upperGroup,
      d,
      labelX,
      labelY,
    });
  }

  return result;
}

const ALL_SECTIONS = generateStadiumSections();
const SPHERE_SECTIONS = generateSphereSections();

interface SeatingChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: SeatingEventData | null;
}

export default function SeatingChartModal({
  isOpen,
  onClose,
  event: propEvent,
}: SeatingChartModalProps) {
  const router = useRouter();

  const activeEvent: SeatingEventData = useMemo(() => {
    return (
      propEvent || {
        name: "Atlanta Hawks vs. Boston Celtics",
        venue: "State Farm Arena",
        city: "Atlanta, GA",
        date: "Fri, Jan 23, 2026",
        time: "7:30 PM EST",
        priceMin: undefined,
        category: "NBA Basketball",
      }
    );
  }, [propEvent]);

  const isSphere = useMemo(() => {
    const text = `${activeEvent.venue} ${activeEvent.name}`.toLowerCase();
    return text.includes("sphere") || text.includes("venetian");
  }, [activeEvent]);

  const currentSections = useMemo(() => {
    return isSphere ? SPHERE_SECTIONS : ALL_SECTIONS;
  }, [isSphere]);

  // Section and seat selection states
  const [hoveredSection, setHoveredSection] = useState<SectionPolygon | null>(null);
  const [activeSection, setActiveSection] = useState<SectionPolygon | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [isSeatPickerOpen, setIsSeatPickerOpen] = useState(false);
  const [focusedSeat, setFocusedSeat] = useState<{ row: string; seat: number }>({ row: "A", seat: 10 });

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((z) => Math.min(2.4, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, z - 0.25));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: panStartRef.current.x + (e.clientX - dragStartRef.current.x) / zoom,
      y: panStartRef.current.y + (e.clientY - dragStartRef.current.y) / zoom,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Open seat picker for selected section
  const handleSectionClick = (sec: SectionPolygon) => {
    setActiveSection(sec);
    setFocusedSeat({ row: "A", seat: 10 });
    setIsSeatPickerOpen(true);
  };

  // Seat toggle logic
  // Honest pricing: only the event's real TM price range is shown ("from $X"); VIP routes to the partner desk
  const fromPrice: number | null = typeof activeEvent?.priceMin === "number" && activeEvent.priceMin > 0 ? activeEvent.priceMin : null;
  const isPartnerTier = (tier: SectionTier) => tier === "VIP";
  const priceFor = (tier: SectionTier) => (isPartnerTier(tier) || fromPrice === null ? 0 : fromPrice);
  const fmtPrice = (tier: SectionTier) => isPartnerTier(tier) ? "Partner desk quote" : fromPrice !== null ? `from $${fromPrice}` : "Quote at checkout";
  const handleToggleSeat = (row: string, seatNum: number, price: number, tier: SectionTier, level: SectionLevel) => {
    if (!activeSection) return;
    setFocusedSeat({ row, seat: seatNum });
    const secNum = activeSection.number;
    const exists = selectedSeats.some(
      (s) => s.section === secNum && s.row === row && s.seat === seatNum
    );

    if (exists) {
      setSelectedSeats((prev) =>
        prev.filter((s) => !(s.section === secNum && s.row === row && s.seat === seatNum))
      );
    } else {
      setSelectedSeats((prev) => [
        ...prev,
        {
          section: secNum,
          row,
          seat: seatNum,
          price: priceFor(tier),
          tier,
          level,
        },
      ]);
    }
  };

  const isSeatSelected = (row: string, seatNum: number) => {
    if (!activeSection) return false;
    return selectedSeats.some(
      (s) => s.section === activeSection.number && s.row === row && s.seat === seatNum
    );
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return selectedSeats.reduce((acc, s) => acc + s.price, 0);
  }, [selectedSeats]);

  const serviceFee = 0; // computed at checkout by the payment rail
  const taxes = 0;      // computed at checkout by the payment rail
  const orderTotal = subtotal + serviceFee + taxes;

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) return;

    // Package ticket details into session storage for payment pipeline
    const bookingPayload = {
      event: activeEvent,
      seats: selectedSeats,
      section: selectedSeats[0]?.section,
      quantity: selectedSeats.length,
      subtotal,
      serviceFee,
      taxes,
      total: orderTotal,
      timestamp: Date.now(),
    };

    sessionStorage.removeItem("selectedOffer");
    sessionStorage.removeItem("selectedSeat");
    sessionStorage.removeItem("passengerDetails");
    sessionStorage.setItem("checkout_event", JSON.stringify(activeEvent));
    sessionStorage.setItem("checkout_event_booking", JSON.stringify(bookingPayload));
    sessionStorage.setItem("checkout_qty", String(selectedSeats.length));
    sessionStorage.setItem("checkout_total", String(orderTotal));

    onClose();
    router.push("/travel/event-checkout");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 md:p-6 overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-7xl h-[94vh] rounded-3xl bg-[#06111f]/95 border border-cyan-400/30 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-white z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 grid place-items-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Armchair size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    Interactive Seating Map
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Live Arena Telemetry
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-wide truncate max-w-lg mt-0.5">
                  {activeEvent.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-cyan-400" />
                    {activeEvent.venue} {activeEvent.city ? `• ${activeEvent.city}` : ""}
                  </span>
                  {activeEvent.date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-cyan-400" />
                      {activeEvent.date}
                    </span>
                  )}
                  {activeEvent.time && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-cyan-400" />
                      {activeEvent.time}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="size-9 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-slate-400 transition cursor-pointer flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Workspace: 2-Column (Left: Interactive Map, Right: Cart & Details) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden relative">
            {/* Left 8 Cols: Interactive Stadium SVG */}
            <div
              className="lg:col-span-8 relative flex flex-col bg-[#030914] overflow-hidden cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Top Controls Toolbar */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 border border-white/10 backdrop-blur-md p-1.5 rounded-2xl shadow-lg">
                <button
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-2 rounded-xl hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-2 rounded-xl hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleResetZoom}
                  title="Reset View"
                  className="p-2 rounded-xl hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Legend Badges */}
              <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 bg-slate-950/85 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  <span className="text-amber-300">{isSphere ? "100 Haptic Floor" : "VIP ┬╖ partner desk"}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="size-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                  <span className="text-cyan-300">{isSphere ? "200 Sweet Spot" : "Lower"}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="size-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]" />
                  <span className="text-purple-300">{isSphere ? "300 Club" : "Club"}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="size-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
                  <span className="text-blue-300">{isSphere ? "400 Panoramic" : "Upper"}</span>
                </div>
              </div>

              {/* Hover Tooltip Overlay */}
              <AnimatePresence>
                {hoveredSection && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-6 left-6 z-30 p-4 rounded-2xl bg-slate-950/95 border border-cyan-400/40 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.6)] w-72 pointer-events-none"
                  >
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${TIER_THEMES[hoveredSection.tier].bg}`}>
                          Section {hoveredSection.number}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {hoveredSection.level} Level
                        </span>
                      </div>
                      <span className="text-sm font-black text-cyan-300">
                        {fmtPrice(hoveredSection.group.tier)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tier:</span>
                        <span className="font-bold text-white">{hoveredSection.tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Availability:</span>
                        <span className="font-bold text-emerald-400">Availability confirmed at fulfillment</span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                      {hoveredSection.group.amenities.slice(0, 2).map((a, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">
                          Γ£¿ {a}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-cyan-400 text-center animate-pulse">
                      Click to Select Seats ΓåÆ
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stadium SVG Viewport */}
              <div className="flex-1 flex items-center justify-center p-4">
                <svg
                  viewBox="0 0 1000 700"
                  className="w-full h-full max-h-[600px] transition-transform duration-100 ease-out select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  }}
                >
                  <defs>
                    {/* Court Wood Texture Gradient */}
                    <radialGradient id="courtWood" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#d97706" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#92400e" stopOpacity="0.95" />
                    </radialGradient>
                    <radialGradient id="arenaGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.12)" />
                      <stop offset="80%" stopColor="transparent" />
                    </radialGradient>
                    {/* Sphere Ambient Glow Background Gradient */}
                    <radialGradient id="sphereAmbientGlow" cx="50%" cy="28%" r="60%">
                      <stop offset="0%" stopColor="rgba(6,182,212,0.22)" />
                      <stop offset="45%" stopColor="rgba(168,85,247,0.12)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    {/* Sphere 16K Dome Surface Gradient */}
                    <radialGradient id="sphereDomeFill" cx="50%" cy="40%" r="55%">
                      <stop offset="0%" stopColor="#082f49" />
                      <stop offset="35%" stopColor="#0f172a" />
                      <stop offset="75%" stopColor="#020617" />
                    </radialGradient>
                    <linearGradient id="sphereScreenGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="30%" stopColor="#38bdf8" />
                      <stop offset="70%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>

                  {/* Arena or Sphere Ambient Glow Background */}
                  <rect x="0" y="0" width="1000" height="700" fill={isSphere ? "url(#sphereAmbientGlow)" : "url(#arenaGlow)"} />

                  {/* Outer Arena Perimeter Wall (Circular for Arena only) */}
                  {!isSphere && (
                    <ellipse cx="500" cy="350" rx="360" ry="275" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeDasharray="6 6" />
                  )}

                  {/* Section Polygons */}
                  {currentSections.map((sec) => {
                    const isHovered = hoveredSection?.id === sec.id;
                    const isSecSelected = selectedSeats.some((s) => s.section === sec.number);
                    const theme = TIER_THEMES[sec.tier];

                    return (
                      <g
                        key={sec.id}
                        className="cursor-pointer transition-all duration-200"
                        onMouseEnter={() => setHoveredSection(sec)}
                        onMouseLeave={() => setHoveredSection(null)}
                        onClick={() => handleSectionClick(sec)}
                      >
                        <path
                          d={sec.d}
                          fill={isSecSelected ? "rgba(34,211,238,0.7)" : isHovered ? theme.fill.replace(/0\.\d+\)/, "0.75)") : theme.fill}
                          stroke={isSecSelected ? "#22d3ee" : isHovered ? "#ffffff" : theme.stroke}
                          strokeWidth={isSecSelected || isHovered ? 2.5 : 1}
                          className="transition-all duration-200"
                        />
                        {/* Section Number Label */}
                        <text
                          x={sec.labelX}
                          y={sec.labelY}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isSecSelected ? "#020814" : isHovered ? "#ffffff" : "rgba(255,255,255,0.75)"}
                          fontSize={sec.level === "Upper" ? "8.5" : sec.level === "Club" ? "9" : "10"}
                          fontWeight="900"
                          pointerEvents="none"
                        >
                          {sec.number}
                        </text>
                      </g>
                    );
                  })}

                  {/* Center Visual: 16K Curved Canvas for The Sphere, or Hardwood Court for Arena */}
                  {isSphere ? (
                    <g id="sphere-screen-arc">
                      {/* Illuminated Dome Surface Backing */}
                      <path
                        d="M 160 225 A 380 380 0 0 1 840 225 L 620 225 L 380 225 Z"
                        fill="url(#sphereDomeFill)"
                        stroke="rgba(6,182,212,0.4)"
                        strokeWidth="1.5"
                      />

                      {/* Concentric Media Canvas Grid Lines */}
                      <path d="M 230 225 A 310 310 0 0 1 770 225" fill="none" stroke="rgba(56,189,248,0.25)" strokeWidth="1" strokeDasharray="4 4" />
                      <path d="M 300 225 A 240 240 0 0 1 700 225" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="1" strokeDasharray="3 3" />

                      {/* Outer Glow Halo Layer */}
                      <path
                        d="M 160 225 A 380 380 0 0 1 840 225"
                        fill="none"
                        stroke="rgba(6,182,212,0.3)"
                        strokeWidth="28"
                        strokeLinecap="round"
                      />
                      {/* Main 16K Curved LED Screen Arc */}
                      <path
                        d="M 160 225 A 380 380 0 0 1 840 225"
                        fill="none"
                        stroke="url(#sphereScreenGlow)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      {/* Inner High-Precision White Core Line */}
                      <path
                        d="M 164 225 A 376 376 0 0 1 836 225"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Screen Title & Telemetry Glassmorphic Badge */}
                      <g transform="translate(0, 5)">
                        <rect
                          x="235"
                          y="88"
                          width="530"
                          height="46"
                          rx="14"
                          fill="rgba(6, 17, 35, 0.88)"
                          stroke="rgba(56, 189, 248, 0.35)"
                          strokeWidth="1.2"
                        />
                        <text
                          x="500"
                          y="106"
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="12.5"
                          fontWeight="900"
                          letterSpacing="1.5"
                        >
                          16K IMMERSIVE MEDIA CANVAS (160,000 SQ FT)
                        </text>
                        <text
                          x="500"
                          y="124"
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.75)"
                          fontSize="9"
                          fontWeight="700"
                          letterSpacing="0.5"
                        >
                          HOLOPLOT BEAMFORMING AUDIO • 167,000 SPEAKER DRIVERS
                        </text>
                      </g>

                      {/* Audio Directional Rays */}
                      <line x1="420" y1="145" x2="350" y2="175" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="500" y1="145" x2="500" y2="178" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="580" y1="145" x2="650" y2="175" stroke="rgba(56,189,248,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Main Stage Floor */}
                      <path
                        d="M 380 185 L 620 185 L 580 215 L 420 215 Z"
                        fill="#0b1329"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                      <text
                        x="500"
                        y="202"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="900"
                        letterSpacing="1"
                      >
                        MAIN STAGE & DIRECTOR DECK
                      </text>
                    </g>
                  ) : (
                    /* Center Court Floor */
                    <g transform="translate(425, 290)">
                      {/* Hardwood Court */}
                      <rect x="0" y="0" width="150" height="120" rx="10" fill="url(#courtWood)" stroke="#f59e0b" strokeWidth="2" />
                      {/* Court Boundary Lines */}
                      <rect x="6" y="6" width="138" height="108" rx="6" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
                      {/* Half-court Line */}
                      <line x1="75" y1="6" x2="75" y2="114" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
                      {/* Center Circle */}
                      <circle cx="75" cy="60" r="18" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
                      {/* Center Logo */}
                      <text x="75" y="62" textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="12" fontWeight="900">
                        </text>
                      {/* Key Area Left */}
                      <rect x="6" y="42" width="28" height="36" fill="rgba(220,38,38,0.4)" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
                      {/* Key Area Right */}
                      <rect x="116" y="42" width="28" height="36" fill="rgba(220,38,38,0.4)" stroke="rgba(255,255,255,0.85)" strokeWidth="1" />
                    </g>
                  )}
                </svg>
              </div>

              {/* Instructions Bar at Bottom */}
              <div className="px-6 py-2.5 bg-slate-950/80 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Info size={14} className="text-cyan-400" />
                  Click any arena section to view rows & select individual seats.
                </span>
                <span className="text-[11px] font-mono text-cyan-300">
                  {selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"} selected
                </span>
              </div>
            </div>

            {/* Right 4 Cols: Selection Summary & Cart */}
            <div className="lg:col-span-4 bg-slate-950/90 border-l border-cyan-400/20 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-cyan-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Ticket Cart Summary
                  </h3>
                </div>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/30 px-2.5 py-0.5 rounded-full">
                  {selectedSeats.length} {selectedSeats.length === 1 ? "Ticket" : "Tickets"}
                </span>
              </div>

              {/* Seat Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
                {selectedSeats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="size-16 rounded-3xl bg-white/5 border border-white/10 grid place-items-center text-slate-500 mb-3">
                      <Armchair size={30} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200">No Seats Selected</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Click any colored bowl section on the stadium map to open the seat picker and lock in your seats.
                    </p>
                  </div>
                ) : (
                  selectedSeats.map((seat, idx) => (
                    <motion.div
                      key={`${seat.section}-${seat.row}-${seat.seat}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-400/25 flex items-center justify-between shadow-md group hover:border-cyan-400 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 grid place-items-center text-cyan-300 font-mono font-bold text-xs">
                          #{seat.seat}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-white">
                              Section {seat.section}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              • Row {seat.row}
                            </span>
                          </div>
                          <span className="text-[10px] text-cyan-300/80 font-bold uppercase">
                            {seat.tier} Tier ({seat.level})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-cyan-300">
                          {fmtPrice(seat.tier)}
                        </span>
                        <button
                          onClick={() => handleToggleSeat(seat.row, seat.seat, seat.price, seat.tier, seat.level)}
                          className="size-6 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition grid place-items-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Pricing Breakdown & Checkout Trigger */}
              <div className="p-5 border-t border-white/10 bg-slate-900/90 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-300 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal ({selectedSeats.length} seats):</span>
                    <span className="font-bold text-white">${subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Fee:</span>
                    <span className="font-bold text-white">${serviceFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Tax (8%):</span>
                    <span className="font-bold text-white">${taxes}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-white">
                    <span>Total Due:</span>
                    <span className="text-cyan-300 text-base font-black">${orderTotal}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Sparkles size={15} />
                  <span>Proceed to Payment (${orderTotal})</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nested Detailed Row & Seat Picker Modal */}
        <AnimatePresence>
          {isSeatPickerOpen && activeSection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setIsSeatPickerOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="glass-panel-heavy border border-cyan-400/40 bg-[#06111f]/98 shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-3xl w-full max-w-4xl p-6 flex flex-col max-h-[88vh] overflow-hidden text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Seat Picker Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 grid place-items-center text-cyan-300 font-bold">
                      {activeSection.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Section {activeSection.number} • {activeSection.level} Level
                      </h3>
                      <p className="text-xs text-cyan-300 font-semibold">
                        {activeSection.tier} Tier • {fmtPrice(activeSection.group.tier)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSeatPickerOpen(false)}
                    className="size-8 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition grid place-items-center"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 py-2 bg-slate-950/60 rounded-xl border border-white/5 mb-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-emerald-400/40 border border-emerald-400" />
                    <span className="text-slate-300">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-cyan-400 border border-white shadow-[0_0_8px_#22d3ee]" />
                    <span className="text-cyan-300 font-bold">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-blue-500/60 border border-blue-400" />
                    <span className="text-blue-300">Accessible (ADA)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-slate-800 border border-slate-700 opacity-50" />
                  </div>
                </div>

                {/* 3D Cinematic Sightline Viewport (Replacing flat schematic) */}
                <CinematicSightlineView
                  eventName={activeEvent.name}
                  venueName={activeEvent.venue}
                  category={activeEvent.category}
                  activeSection={activeSection.number}
                  activeRow={focusedSeat.row}
                  activeSeat={focusedSeat.seat}
                  tier={activeSection.tier}
                  level={activeSection.level}
                />

                {/* Seat Matrix Grid with Front/Back Row indicators */}
                <div className="flex-1 overflow-y-auto overflow-x-auto p-2 space-y-2.5 scrollbar-none flex flex-col items-center">
                  {/* Front Row Marker */}
                  <div className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/20 mb-1 flex items-center gap-1.5">
                    <span>Γ¡É FRONT ROW (CLOSEST TO ACTION)</span>
                  </div>

                  {["A", "B", "C", "D", "E", "F", "G", "H"].map((row, rIdx) => (
                    <div key={row} className="flex items-center justify-center gap-2">
                      <span className="w-6 text-center font-bold text-xs text-amber-300">
                        {row}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 20 }, (_, sIdx) => {
                          const seatNum = sIdx + 1;
                          // Deterministic pseudo-sold generator (~25% occupied)
                          const isSold = ((activeSection.number * 17 + rIdx * 31 + sIdx * 7) % 100) < 25;
                          const isAda = (row === "A" && (seatNum === 1 || seatNum === 20));
                          const selected = isSeatSelected(row, seatNum);

                          return (
                            <button
                              key={seatNum}
                              disabled={isSold}
                              onMouseEnter={() => setFocusedSeat({ row, seat: seatNum })}
                              onClick={() =>
                                handleToggleSeat(
                                  row,
                                  seatNum,
                                  activeSection.group.pricePerSeat,
                                  activeSection.tier,
                                  activeSection.level
                                )
                              }
                              title={`Row ${row}, Seat ${seatNum} - ${fmtPrice(activeSection.group.tier)}`}
                              className={`size-6 rounded-md text-[9px] font-black transition-all duration-150 flex items-center justify-center cursor-pointer ${
                                selected
                                  ? "bg-cyan-400 text-slate-950 border border-white scale-110 shadow-[0_0_10px_#22d3ee]"
                                  : isSold
                                  ? "bg-slate-800/60 border border-slate-700 text-slate-600 cursor-not-allowed opacity-40"
                                  : isAda
                                  ? "bg-blue-500/40 border border-blue-400 text-blue-200 hover:bg-blue-500 hover:scale-110"
                                  : "bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-400 hover:text-slate-950 hover:scale-110 shadow-sm"
                              }`}
                            >
                              {seatNum}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-6 text-center font-bold text-xs text-amber-300">
                        {row}
                      </span>
                    </div>
                  ))}

                  {/* Back Row Marker */}
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10 mt-2 flex items-center gap-1.5">
                    <span>ELEVATED UPPER ROW (ROW H)</span>
                  </div>
                </div>

                {/* Seat Picker Footer */}
                <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-300 font-semibold">
                    <span>Selected for Section {activeSection.number}: </span>
                    <span className="text-cyan-300 font-bold">
                      {selectedSeats.filter((s) => s.section === activeSection.number).length} seats
                    </span>
                  </div>

                  <button
                    onClick={() => setIsSeatPickerOpen(false)}
                    className="py-2.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  >
                    Done Selecting
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
