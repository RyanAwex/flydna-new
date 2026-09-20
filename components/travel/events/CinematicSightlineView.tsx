"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Eye, ShieldCheck, Rotate3d, Zap } from "lucide-react";

export interface CinematicSightlineProps {
  eventName: string;
  venueName: string;
  category?: string;
  activeSection: number;
  activeRow: string;
  activeSeat: number;
  tier: "VIP" | "Premium" | "Standard" | "Value";
  level: string;
}

// ─── Seat position → real-world camera coordinates ───────────────────────────
//
// Both venue types share the same translation model:
//   rowIdx  0 = Row A (closest to action)  →  7 = Row H (furthest)
//   seat    1–20 mapped to lateral offset
//   level   determines which bowl ring the camera sits in
//
// We then aim the camera at the focal point (center court / center stage).
// The farther away the camera is, the smaller the action appears — this gives
// the user an honest preview of how close or far their seat is.

function computeCameraAndTarget(
  section: number,
  row: string,
  seat: number,
  level: string,
  isSphere: boolean
): { camPos: THREE.Vector3; lookAt: THREE.Vector3 } {
  const rowIdx = Math.max(0, row.charCodeAt(0) - 65); // A=0 … H=7
  const seatLateral = (seat - 10.5) / 9.5; // –1 … +1 (left to right)

  if (isSphere) {
    // ── The Sphere: amphitheater bowl facing the LED dome ──────────────────
    // Real Sphere: screen radius ~49m, seating radius 22m–43m
    // 100 Haptic Floor:  r=22–26m   elev=1–2m   (right at stage, dome overhead)
    // 200 Prime Tier:    r=28–33m   elev=4–9m
    // 300 Club:          r=34–38m   elev=10–16m
    // 400 Upper:         r=39–43m   elev=17–24m

    let baseRadius = 28;
    let baseElev   = 4;
    let rowRadInc  = 0.65;
    let rowElevInc = 0.9;

    if (level === "Courtside") {
      baseRadius = 22; baseElev = 1.2; rowRadInc = 0.55; rowElevInc = 0.35;
    } else if (level === "Lower") {
      baseRadius = 28; baseElev = 4.0; rowRadInc = 0.65; rowElevInc = 0.9;
    } else if (level === "Club") {
      baseRadius = 34; baseElev = 10.5; rowRadInc = 0.75; rowElevInc = 1.2;
    } else {
      // Upper
      baseRadius = 39; baseElev = 17.0; rowRadInc = 0.80; rowElevInc = 1.5;
    }

    const radius = baseRadius + rowIdx * rowRadInc;
    const elev   = baseElev   + rowIdx * rowElevInc;

    // Section determines horizontal fan angle around the amphitheater.
    // Sphere sections 101–108 fan across roughly 120° in front of stage.
    const sectionInTier = section % 100; // 1–16 depending on tier
    const tierSections  = level === "Courtside" ? 8 : level === "Lower" ? 12 : level === "Club" ? 14 : 16;
    const fov           = Math.PI * 1.1; // 198° — amphitheater arc
    const startAngle    = -fov / 2;
    const sectionAngle  = startAngle + (sectionInTier / (tierSections - 1)) * fov;

    const camX = radius * Math.sin(sectionAngle) + seatLateral * 2.2 * Math.cos(sectionAngle);
    const camZ = radius * Math.cos(sectionAngle) - seatLateral * 2.2 * Math.sin(sectionAngle);
    const camY = elev;

    // Look toward center-stage focus point (stage is at Z=0, slightly elevated)
    return {
      camPos: new THREE.Vector3(camX, camY, camZ),
      lookAt: new THREE.Vector3(0, 6, -2),
    };
  }

  // ── NBA Basketball Arena ───────────────────────────────────────────────────
  // Real NBA court: 28.7m × 15.2m.  Section ring radii (from court edge):
  //   Courtside/VIP:  dist  5–10m   elev 1–2m
  //   Lower Bowl:     dist 12–22m   elev 3–10m
  //   Club:           dist 24–32m   elev 11–18m
  //   Upper:          dist 34–45m   elev 19–30m

  let baseRadius = 14;
  let baseElev   = 3.5;
  let rowRadInc  = 1.2;
  let rowElevInc = 0.9;

  if (level === "Courtside") {
    baseRadius = 8;  baseElev = 1.2; rowRadInc = 0.65; rowElevInc = 0.3;
  } else if (level === "Lower") {
    baseRadius = 14; baseElev = 3.5; rowRadInc = 1.2;  rowElevInc = 0.9;
  } else if (level === "Club") {
    baseRadius = 25; baseElev = 12;  rowRadInc = 1.4;  rowElevInc = 1.2;
  } else {
    // Upper
    baseRadius = 36; baseElev = 20;  rowRadInc = 1.5;  rowElevInc = 1.5;
  }

  const radius = baseRadius + rowIdx * rowRadInc;
  const elev   = baseElev   + rowIdx * rowElevInc;

  // Section angle: 84 total sections distributed around 360°
  const sectionAngle = ((section % 84) / 84) * Math.PI * 2 - Math.PI / 2;

  const perpAngle = sectionAngle + Math.PI / 2;
  const camX = radius * Math.cos(sectionAngle) + seatLateral * 1.8 * Math.cos(perpAngle);
  const camZ = radius * Math.sin(sectionAngle) + seatLateral * 1.8 * Math.sin(perpAngle);
  const camY = elev;

  return {
    camPos: new THREE.Vector3(camX, camY, camZ),
    lookAt: new THREE.Vector3(0, 1.0, 0),
  };
}

// ─── Texture helpers ─────────────────────────────────────────────────────────

function makeHardwoodTex(): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 1024;
  const c = cv.getContext("2d")!;
  const g = c.createLinearGradient(0,0,2048,1024);
  g.addColorStop(0,"#9a5c18"); g.addColorStop(.5,"#b56a1a"); g.addColorStop(1,"#7a4410");
  c.fillStyle = g; c.fillRect(0,0,2048,1024);
  c.strokeStyle = "rgba(0,0,0,.15)"; c.lineWidth = 2.5;
  for (let i=0;i<2048;i+=32){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,1024); c.stroke(); }
  // Apron
  c.fillStyle="#1a1860"; ["top","bottom","left","right"].forEach((_,i) => {
    if(i===0) c.fillRect(0,0,2048,65);
    else if(i===1) c.fillRect(0,959,2048,65);
    else if(i===2) c.fillRect(0,0,75,1024);
    else c.fillRect(1973,0,75,1024);
  });
  // Court lines
  c.strokeStyle="#fff"; c.lineWidth=13;
  c.strokeRect(75,65,1898,894);
  c.beginPath(); c.moveTo(1024,65); c.lineTo(1024,959); c.stroke();
  c.beginPath(); c.arc(1024,512,160,0,Math.PI*2); c.stroke();
  // Paint
  c.fillStyle="rgba(200,50,50,.6)";
  c.fillRect(75,360,370,304); c.strokeRect(75,360,370,304);
  c.beginPath(); c.arc(445,512,135,-Math.PI/2,Math.PI/2); c.stroke();
  c.beginPath(); c.arc(75,512,535,-Math.PI/3,Math.PI/3); c.stroke();
  c.fillRect(1603,360,370,304); c.strokeRect(1603,360,370,304);
  c.beginPath(); c.arc(1603,512,135,Math.PI/2,-Math.PI/2); c.stroke();
  c.beginPath(); c.arc(1973,512,535,(2*Math.PI)/3,(4*Math.PI)/3); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.needsUpdate=true; return t;
}

function makeTeamLogoTex(eventName: string): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width=1024; cv.height=1024;
  const c = cv.getContext("2d")!;
  const lower = eventName.toLowerCase();
  let p="#e03a3e", s="#fdb927", nm="HAWKS", ic="🦅";
  if(lower.includes("celtic")){p="#008348";s="#bb9753";nm="CELTICS";ic="☘️";}
  else if(lower.includes("laker")){p="#552583";s="#fdb927";nm="LAKERS";ic="🏀";}
  else if(lower.includes("warrior")){p="#1d428a";s="#ffc72c";nm="WARRIORS";ic="🌉";}
  else if(lower.includes("brave")){p="#ce1141";s="#13274f";nm="BRAVES";ic="🪓";}
  else if(lower.includes("knick")){p="#006bb6";s="#f58426";nm="KNICKS";ic="🗽";}
  else if(lower.includes("yankee")){p="#003087";s="#e4002b";nm="YANKEES";ic="⚾";}
  c.clearRect(0,0,1024,1024);
  c.beginPath(); c.arc(512,512,460,0,Math.PI*2); c.fillStyle="rgba(8,12,24,.97)"; c.fill();
  c.lineWidth=24; c.strokeStyle=p; c.stroke();
  c.beginPath(); c.arc(512,512,418,0,Math.PI*2); c.lineWidth=7; c.strokeStyle=s; c.stroke();
  c.font="190px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(ic,512,415);
  c.font="900 80px 'Inter',sans-serif"; c.fillStyle="#fff"; c.fillText(nm,512,655);
  c.font="bold 30px 'Inter',sans-serif"; c.fillStyle=s; c.fillText("OFFICIAL VENUE · FLYDNA",512,745);
  const t=new THREE.CanvasTexture(cv); t.needsUpdate=true; return t;
}

function makeScoreboardTex(eventName: string): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width=1024; cv.height=512;
  const c = cv.getContext("2d")!;
  const g=c.createLinearGradient(0,0,1024,512);
  g.addColorStop(0,"#080f20"); g.addColorStop(1,"#020408");
  c.fillStyle=g; c.fillRect(0,0,1024,512);
  c.fillStyle="#c0272d"; c.fillRect(0,0,1024,72);
  c.fillStyle="#fff"; c.font="700 30px 'Inter',sans-serif"; c.textAlign="center";
  c.fillText("LIVE · OFFICIAL FlyDnA EVENT TICKER",512,48);
  c.font="900 110px 'Inter',sans-serif"; c.fillStyle="#fff"; c.fillText("108 : 104",512,240);
  c.font="700 34px 'Inter',sans-serif"; c.fillStyle="#fdb927";
  c.fillText("HAWKS                        CELTICS",512,320);
  c.font="600 28px 'Inter',sans-serif"; c.fillStyle="#38bdf8";
  c.fillText("4TH QTR  ·  1:24",512,400);
  const t=new THREE.CanvasTexture(cv); t.needsUpdate=true; return t;
}

function makeRibbonTex(): THREE.CanvasTexture {
  const cv=document.createElement("canvas"); cv.width=2048; cv.height=96;
  const c=cv.getContext("2d")!;
  c.fillStyle="#020a18"; c.fillRect(0,0,2048,96);
  c.strokeStyle="#06b6d4"; c.lineWidth=3; c.strokeRect(3,3,2042,90);
  c.fillStyle="#22d3ee"; c.font="bold 38px 'Inter',sans-serif";
  c.fillText("FlyDnA OFFICIAL TICKETS  ·  VIP EXPERIENCE  ·  LIVE NOW  ·  STATE FARM ARENA  ·  ATL HAWKS",30,62);
  const t=new THREE.CanvasTexture(cv); t.needsUpdate=true; return t;
}

// ── Sphere 16K LED dome canvas texture ───────────────────────────────────────
function makeSphereScreenTex(eventName: string): THREE.CanvasTexture {
  const cv=document.createElement("canvas"); cv.width=4096; cv.height=2048;
  const c=cv.getContext("2d")!;

  // Background — deep black
  c.fillStyle="#030108"; c.fillRect(0,0,4096,2048);

  // Detect event to style the screen content
  const lower=eventName.toLowerCase();
  let col1="#e03a3e", col2="#f5a623", textLabel="LIVE EVENT";
  if(lower.includes("eagles")||lower.includes("cheney")||lower.includes("chesney")){
    col1="#8b4513"; col2="#d4a017"; textLabel="SUMMER OF SPHERE";
  } else if(lower.includes("u2")||lower.includes("concert")){
    col1="#1a0a3d"; col2="#8b5cf6"; textLabel="LIVE CONCERT";
  } else if(lower.includes("sphere")||lower.includes("postcard")){
    col1="#0a2060"; col2="#06b6d4"; textLabel="POSTCARD FROM EARTH";
  }

  // Giant circular screen graphic — simulates the wraparound LED dome content
  // Outer ring
  const cx=2048, cy=1024, bigR=900;
  const radGrad = c.createRadialGradient(cx,cy,200,cx,cy,bigR);
  radGrad.addColorStop(0, col2+"44");
  radGrad.addColorStop(.5, col1+"88");
  radGrad.addColorStop(1, "#00000000");
  c.fillStyle=radGrad; c.fillRect(0,0,4096,2048);

  // Concentric decorative rings
  for(let r=200;r<=bigR;r+=120){
    c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2);
    c.strokeStyle=`${col2}${Math.floor(80-r/14).toString(16).padStart(2,"0")}`;
    c.lineWidth=r>700?6:10; c.stroke();
  }

  // Central focal glow
  const glow=c.createRadialGradient(cx,cy,0,cx,cy,400);
  glow.addColorStop(0, col2+"cc");
  glow.addColorStop(.4, col1+"88");
  glow.addColorStop(1, "#00000000");
  c.fillStyle=glow; c.beginPath(); c.arc(cx,cy,400,0,Math.PI*2); c.fill();

  // Center label
  c.fillStyle="#ffffff"; c.textAlign="center"; c.textBaseline="middle";
  c.font="900 80px 'Inter',sans-serif";
  c.shadowColor=col2; c.shadowBlur=40;
  c.fillText(textLabel,cx,cy-40);
  c.font="600 44px 'Inter',sans-serif"; c.fillStyle=col2+"ee";
  c.fillText("THE SPHERE · LAS VEGAS",cx,cy+60);
  c.shadowBlur=0;

  // Horizontal scan lines for screen realism
  c.strokeStyle="rgba(0,0,0,.08)"; c.lineWidth=1;
  for(let y=0;y<2048;y+=4){ c.beginPath(); c.moveTo(0,y); c.lineTo(4096,y); c.stroke(); }

  const t=new THREE.CanvasTexture(cv); t.needsUpdate=true; return t;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CinematicSightlineView({
  eventName,
  venueName,
  category="Live Event",
  activeSection,
  activeRow,
  activeSeat,
  tier,
  level,
}: CinematicSightlineProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const rendererRef     = useRef<THREE.WebGLRenderer|null>(null);
  const cameraRef       = useRef<THREE.PerspectiveCamera|null>(null);
  const animFrameRef    = useRef<number|null>(null);
  const targetPosRef    = useRef<THREE.Vector3>(new THREE.Vector3(0,3,20));
  const targetLookRef   = useRef<THREE.Vector3>(new THREE.Vector3(0,1,0));
  const currentLookRef  = useRef<THREE.Vector3>(new THREE.Vector3(0,1,0));
  const isDraggingRef   = useRef(false);
  const dragStartRef    = useRef({x:0,y:0});
  const userOffsetRef   = useRef({x:0,y:0});

  const isSphere = useMemo(()=>{
    const t=`${venueName} ${eventName}`.toLowerCase();
    return t.includes("sphere")||t.includes("venetian")||t.includes("las vegas");
  },[venueName,eventName]);
  // Photo-real mode: venues with real interior photography (the honest cinema)
  const photoVenue = useMemo(()=>{
    const t=`${venueName} ${eventName}`.toLowerCase();
    if (t.includes("sphere")||t.includes("venetian")) return "/assets/events/sphere_pov_real.jpg";
    return null;
  },[venueName,eventName]);
  // Seat-keyed crop: row -> zoom+vertical, seat -> horizontal pan, level -> wideness
  const photoCrop = useMemo(()=>{
    const rowIdx = Math.max(0, Math.min(7, (activeRow||"A").charCodeAt(0)-65));
    const seatT = Math.max(0, Math.min(1, ((activeSeat||10)-1)/19));
    const lvl = (level||"").toLowerCase();
    const base = lvl.includes("court")||lvl.includes("floor") ? 1.55 : lvl.includes("lower") ? 1.35 : lvl.includes("club") ? 1.2 : 1.05;
    const scale = base + (7-rowIdx)*0.04;
    const posX = 20 + seatT*60;
    const posY = lvl.includes("upper")||lvl.includes("halo") ? 28 : lvl.includes("club") ? 38 : 48 + rowIdx*1.5;
    return { scale, posX, posY };
  },[activeRow, activeSeat, level]);

  // Recompute camera target whenever seat changes
  useEffect(()=>{
    const { camPos, lookAt } = computeCameraAndTarget(
      activeSection, activeRow, activeSeat, level, isSphere
    );
    targetPosRef.current.copy(camPos);
    targetLookRef.current.copy(lookAt);
    userOffsetRef.current = {x:0,y:0}; // reset look-around on seat change
  },[activeSection, activeRow, activeSeat, level, isSphere]);

  // Build / rebuild Three.js scene when venue type changes
  useEffect(()=>{
    if (photoVenue) return; // photo-real mode: no WebGL
    const container = containerRef.current;
    if(!container) return;

    const W = container.clientWidth||860;
    const H = container.clientHeight||290;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060f);
    scene.fog = new THREE.FogExp2(0x04060f, 0.0055);

    // Camera — starts at a neutral position, lerps to seat position
    const camera = new THREE.PerspectiveCamera(62, W/H, 0.1, 600);
    camera.position.copy(targetPosRef.current);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(W,H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;
    container.innerHTML="";
    container.appendChild(renderer.domElement);

    // ── Global Lights ──────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    // ══════════════════════════════════════════════════════════════════════
    //  THE SPHERE — Immersive Dome Scene
    // ══════════════════════════════════════════════════════════════════════
    let ribbonTexNBA: THREE.CanvasTexture|null=null;

    if(isSphere){
      // Key light from the stage/screen direction
      const screenLight = new THREE.PointLight(0xffd0a0, 4.5, 200);
      screenLight.position.set(0, 12, -30); scene.add(screenLight);
      const fill = new THREE.DirectionalLight(0x6090ff, 1.2);
      fill.position.set(0, 40, 60); scene.add(fill);

      // ── 1. GIANT 16K WRAPAROUND LED DOME SCREEN ─────────────────────────
      // Inner sphere surface (the screen the audience sees)
      const sphereScreenTex = makeSphereScreenTex(eventName);
      const domeGeo = new THREE.SphereGeometry(50, 64, 40, 0, Math.PI*2, 0, Math.PI*0.65);
      const domeMat = new THREE.MeshBasicMaterial({
        map: sphereScreenTex, side: THREE.BackSide,
      });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.set(0,0,0);
      scene.add(domeMesh);

      // Edge glow ring at dome perimeter
      const ringGeo = new THREE.TorusGeometry(50, 0.5, 16, 120);
      const ringMat = new THREE.MeshBasicMaterial({ color:0x00aaff, transparent:true, opacity:0.4 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI/2; ring.position.y=-4; scene.add(ring);

      // ── 2. FLOOR / HAPTIC DECK ──────────────────────────────────────────
      const floorGeo = new THREE.CylinderGeometry(48,48,0.6,80);
      const floorMat = new THREE.MeshStandardMaterial({
        color:0x0a0c14, metalness:0.6, roughness:0.3,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(0,-2.5,0); scene.add(floorMesh);

      // Neon floor edge strips
      for(let a=0;a<Math.PI*2;a+=Math.PI/6){
        const stripGeo=new THREE.BoxGeometry(0.12,0.05,8);
        const stripMat=new THREE.MeshBasicMaterial({color:0x06b6d4,transparent:true,opacity:0.7});
        const strip=new THREE.Mesh(stripGeo,stripMat);
        strip.position.set(47*Math.cos(a),-2.1,47*Math.sin(a));
        strip.rotation.y=-a; scene.add(strip);
      }

      // ── 3. PERFORMANCE STAGE ────────────────────────────────────────────
      const stageGeo=new THREE.BoxGeometry(28,1.2,14);
      const stageMat=new THREE.MeshStandardMaterial({
        color:0x0d1525, metalness:0.85, roughness:0.12,
      });
      const stageMesh=new THREE.Mesh(stageGeo,stageMat);
      stageMesh.position.set(0,-1.5,-12); scene.add(stageMesh);

      // Stage LED lip
      const lipGeo=new THREE.BoxGeometry(28.4,0.1,0.3);
      const lipMat=new THREE.MeshBasicMaterial({color:0xffa020,transparent:true,opacity:0.9});
      new THREE.Mesh(lipGeo,lipMat); // front edge
      const lip=new THREE.Mesh(lipGeo,lipMat);
      lip.position.set(0,-0.9,-5); scene.add(lip);

      // Speaker stacks flanking stage
      [-13,13].forEach(x=>{
        const spkGeo=new THREE.BoxGeometry(1.8,9,1.4);
        const spkMat=new THREE.MeshStandardMaterial({color:0x0a0a14,metalness:0.9});
        const spk=new THREE.Mesh(spkGeo,spkMat);
        spk.position.set(x,3,-6); scene.add(spk);
        // Speaker grille lines
        for(let gy=-4;gy<4;gy+=0.6){
          const lineGeo=new THREE.BoxGeometry(1.6,0.06,0.1);
          const lineMat=new THREE.MeshBasicMaterial({color:0x222240});
          const line=new THREE.Mesh(lineGeo,lineMat);
          line.position.set(x,3+gy,-5.4); scene.add(line);
        }
      });

      // Volumetric laser beams from stage
      const beamColors=[0x06b6d4,0xa855f7,0xf59e0b,0xef4444];
      [-9,-4,4,9].forEach((bx,i)=>{
        const beamGeo=new THREE.CylinderGeometry(0.08,1.4,30,16);
        const beamMat=new THREE.MeshBasicMaterial({
          color:beamColors[i], transparent:true, opacity:0.12,
          blending:THREE.AdditiveBlending,
        });
        const beam=new THREE.Mesh(beamGeo,beamMat);
        beam.position.set(bx,14,-8);
        beam.rotation.z = i%2===0 ? 0.22 : -0.22;
        beam.rotation.x = 0.15;
        scene.add(beam);
      });

      // ── 4. AMPHITHEATER SEATING BOWL (4 rings of seats) ─────────────────
      const tierDefs = [
        { innerR:22, outerR:26, topY:-1.0, segs:64, color:0x1a1050 },
        { innerR:27, outerR:33, topY: 3.5, segs:64, color:0x14103c },
        { innerR:34, outerR:39, topY: 9.5, segs:56, color:0x0e0c2c },
        { innerR:40, outerR:45, topY:16.0, segs:48, color:0x0a0820 },
      ];
      tierDefs.forEach(td=>{
        // Seat deck surface (angled)
        const deckGeo=new THREE.RingGeometry(td.innerR, td.outerR, td.segs);
        const deckMat=new THREE.MeshStandardMaterial({
          color:td.color, roughness:0.8, metalness:0.1,
        });
        const deck=new THREE.Mesh(deckGeo,deckMat);
        deck.rotation.x = -Math.PI/2 + 0.22;
        deck.position.set(0, td.topY, 0);
        scene.add(deck);

        // Row lines (subtle)
        for(let r=td.innerR+1;r<td.outerR;r+=1.4){
          const rowGeo=new THREE.RingGeometry(r,r+0.08,td.segs);
          const rowMat=new THREE.MeshBasicMaterial({color:0x2a2060,transparent:true,opacity:0.5});
          const rowMesh=new THREE.Mesh(rowGeo,rowMat);
          rowMesh.rotation.x = -Math.PI/2+0.22;
          rowMesh.position.set(0, td.topY+0.01, 0);
          scene.add(rowMesh);
        }
      });

      // ── 5. CROWD SILHOUETTES ─────────────────────────────────────────────
      // Two rows of silhouettes in the foreground so user gets scale reference
      const headMat=new THREE.MeshBasicMaterial({color:0x050812});
      for(let ring=0;ring<2;ring++){
        const ringR = 19+ring*2.2;
        const count = ring===0 ? 28 : 36;
        for(let i=0;i<count;i++){
          const a=(i/count)*Math.PI*2;
          const hx=ringR*Math.cos(a), hz=ringR*Math.sin(a);
          const hy=-1.5+ring*0.6+Math.random()*0.15;
          const head=new THREE.Mesh(new THREE.SphereGeometry(0.26,12,10),headMat);
          head.position.set(hx,hy+1.0,hz); scene.add(head);
          const body=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.42,0.65,10),headMat);
          body.position.set(hx,hy+0.35,hz); scene.add(body);
        }
      }

    } else {
      // ══════════════════════════════════════════════════════════════════
      //  NBA BASKETBALL ARENA
      // ══════════════════════════════════════════════════════════════════

      // Arena spotlights (warm from above)
      const mainSpot=new THREE.SpotLight(0xfff8e8,6.0);
      mainSpot.position.set(0,38,0); mainSpot.angle=Math.PI/2.8;
      mainSpot.penumbra=0.4; mainSpot.decay=0.8; scene.add(mainSpot);
      const rim1=new THREE.DirectionalLight(0x06b6d4,1.8);
      rim1.position.set(-30,18,-20); scene.add(rim1);
      const rim2=new THREE.DirectionalLight(0xe03a3e,1.5);
      rim2.position.set(30,18,-20); scene.add(rim2);

      // ── 1. HARDWOOD COURT (1:1 scale — 28.7m × 15.2m) ──────────────────
      const courtTex=makeHardwoodTex();
      const court=new THREE.Mesh(
        new THREE.PlaneGeometry(28.7,15.2),
        new THREE.MeshStandardMaterial({map:courtTex,roughness:0.08,metalness:0.12})
      );
      court.rotation.x=-Math.PI/2; court.position.set(0,0,0); scene.add(court);

      // ── 2. CENTER COURT LOGO ─────────────────────────────────────────────
      const logoTex=makeTeamLogoTex(eventName);
      const logo=new THREE.Mesh(
        new THREE.PlaneGeometry(7,7),
        new THREE.MeshStandardMaterial({map:logoTex,transparent:true,roughness:0.05,metalness:0.2})
      );
      logo.rotation.x=-Math.PI/2; logo.position.set(0,0.02,0); scene.add(logo);

      // ── 3. BASKETBALL HOOPS (real scale — rim at 3.05m) ─────────────────
      [-14.35,14.35].forEach(xPos=>{
        // Stanchion base
        const base=new THREE.Mesh(
          new THREE.BoxGeometry(1.4,1.6,1.0),
          new THREE.MeshStandardMaterial({color:0x0c1220,metalness:0.75})
        );
        base.position.set(xPos>0?xPos+2.0:xPos-2.0, 0.8, 0); scene.add(base);
        // Arm
        const arm=new THREE.Mesh(
          new THREE.CylinderGeometry(0.10,0.14,4.5,14),
          new THREE.MeshStandardMaterial({color:0x283650,metalness:0.8})
        );
        arm.position.set(xPos>0?xPos+1.0:xPos-1.0,2.4,0);
        arm.rotation.z=xPos>0?-0.28:0.28; scene.add(arm);
        // Glass backboard
        const board=new THREE.Mesh(
          new THREE.BoxGeometry(0.05,1.8,2.65),
          new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.55,roughness:0.04})
        );
        board.position.set(xPos,3.05,0); scene.add(board);
        // Orange rim
        const rim=new THREE.Mesh(
          new THREE.TorusGeometry(0.45,0.045,12,28),
          new THREE.MeshBasicMaterial({color:0xf97316})
        );
        rim.rotation.x=Math.PI/2;
        rim.position.set(xPos>0?xPos-0.6:xPos+0.6,3.05,0); scene.add(rim);
      });

      // ── 4. SCORER TABLE & BENCHES ────────────────────────────────────────
      const tableGeo=new THREE.BoxGeometry(15,0.8,0.75);
      const tableMat=new THREE.MeshStandardMaterial({color:0x06b6d4,emissive:0x02303c,metalness:0.5,roughness:0.3});
      const table=new THREE.Mesh(tableGeo,tableMat);
      table.position.set(0,0.4,-8.6); scene.add(table);
      // Bench chairs both sides
      [-1,1].forEach(side=>{
        for(let c=-6.5;c<=6.5;c+=1.3){
          if(Math.abs(c)<2) continue;
          const ch=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.75,0.6),
            new THREE.MeshStandardMaterial({color:0x182030}));
          ch.position.set(c,0.37,side*9.6); scene.add(ch);
        }
      });

      // ── 5. CENTER-HUNG JUMBOTRON SCOREBOARD ─────────────────────────────
      const jGroup=new THREE.Group();
      const jTex=makeScoreboardTex(eventName);
      for(let s=0;s<4;s++){
        const a=(s*Math.PI)/2;
        const sm=new THREE.Mesh(new THREE.PlaneGeometry(7.5,4.0),
          new THREE.MeshBasicMaterial({map:jTex}));
        sm.position.set(3.8*Math.sin(a),0,3.8*Math.cos(a));
        sm.rotation.y=a; jGroup.add(sm);
      }
      const ringTop=new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,0.55,32),
        new THREE.MeshStandardMaterial({color:0x0266a0,emissive:0x012844,metalness:0.85}));
      ringTop.position.y=2.2; jGroup.add(ringTop);
      const ringBot=new THREE.Mesh(new THREE.CylinderGeometry(5.5,5.5,0.55,32),
        new THREE.MeshStandardMaterial({color:0x0266a0,emissive:0x012844,metalness:0.85}));
      ringBot.position.y=-2.2; jGroup.add(ringBot);
      jGroup.position.set(0,18,0); scene.add(jGroup);

      // ── 6. ARENA BOWL (multi-tier seating shell) ─────────────────────────
      // Lower bowl — close ring
      const lower=new THREE.Mesh(new THREE.CylinderGeometry(22,15,10,56,4,true),
        new THREE.MeshStandardMaterial({color:0x070e1c,roughness:0.9,side:THREE.BackSide}));
      lower.position.set(0,5,0); scene.add(lower);
      // Upper bowl
      const upper=new THREE.Mesh(new THREE.CylinderGeometry(38,28,14,56,4,true),
        new THREE.MeshStandardMaterial({color:0x050b16,roughness:0.9,side:THREE.BackSide}));
      upper.position.set(0,16,0); scene.add(upper);
      // Ceiling cap
      const ceil=new THREE.Mesh(new THREE.CircleGeometry(40,48),
        new THREE.MeshBasicMaterial({color:0x030710,side:THREE.DoubleSide}));
      ceil.rotation.x=Math.PI/2; ceil.position.set(0,30,0); scene.add(ceil);

      // ── 7. LED RIBBON BOARDS (360°) ──────────────────────────────────────
      ribbonTexNBA=makeRibbonTex();
      const ribbon=new THREE.Mesh(new THREE.CylinderGeometry(28,28,1.0,56,1,true),
        new THREE.MeshBasicMaterial({map:ribbonTexNBA,side:THREE.BackSide}));
      ribbon.position.set(0,9,0); scene.add(ribbon);

      // ── 8. SEAT ROWS (visible strips in the bowl) ─────────────────────────
      // Lower bowl seat rows
      const seatColors=[0x1a2840,0x1e3060,0x182038];
      for(let r=0;r<8;r++){
        const rowR=15+r*0.9;
        const rowMesh=new THREE.Mesh(new THREE.RingGeometry(rowR,rowR+0.65,56),
          new THREE.MeshStandardMaterial({color:seatColors[r%3],roughness:0.8}));
        rowMesh.rotation.x=-Math.PI/2;
        rowMesh.position.set(0,0.8+r*1.1,0); scene.add(rowMesh);
      }
      // Upper bowl seat rows
      for(let r=0;r<6;r++){
        const rowR=28+r*1.2;
        const rowMesh=new THREE.Mesh(new THREE.RingGeometry(rowR,rowR+0.85,48),
          new THREE.MeshStandardMaterial({color:0x121c30,roughness:0.8}));
        rowMesh.rotation.x=-Math.PI/2;
        rowMesh.position.set(0,12+r*1.3,0); scene.add(rowMesh);
      }

      // ── 9. CROWD SILHOUETTES ─────────────────────────────────────────────
      const headMat=new THREE.MeshBasicMaterial({color:0x04080f});
      for(let ring=0;ring<3;ring++){
        const ringR=16+ring*3;
        const count=28+ring*14;
        for(let i=0;i<count;i++){
          const a=(i/count)*Math.PI*2;
          const hy=0.85+ring*1.05;
          const hx=ringR*Math.cos(a), hz=ringR*Math.sin(a);
          const head=new THREE.Mesh(new THREE.SphereGeometry(0.24,10,10),headMat);
          head.position.set(hx,hy+0.9,hz); scene.add(head);
          const body=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.38,0.6,10),headMat);
          body.position.set(hx,hy+0.3,hz); scene.add(body);
        }
      }

      // ── 10. ARENA SPOTLIGHTS (visible cone hints) ────────────────────────
      [-12,-4,4,12].forEach(x=>{
        const spotGeo=new THREE.CylinderGeometry(0.05,2.5,18,12);
        const spotMat=new THREE.MeshBasicMaterial({
          color:0xfffaed,transparent:true,opacity:0.06,blending:THREE.AdditiveBlending,
        });
        const sp=new THREE.Mesh(spotGeo,spotMat);
        sp.position.set(x,20,0); scene.add(sp);
      });
    }

    // ── Mouse drag look-around ────────────────────────────────────────────
    const el = container;
    const onDown=(e: MouseEvent)=>{
      isDraggingRef.current=true;
      dragStartRef.current={x:e.clientX,y:e.clientY};
      el.style.cursor="grabbing";
    };
    const onMove=(e: MouseEvent)=>{
      if(!isDraggingRef.current) return;
      const dx=(e.clientX-dragStartRef.current.x)*0.006;
      const dy=(e.clientY-dragStartRef.current.y)*0.005;
      userOffsetRef.current.x=Math.max(-2.0,Math.min(2.0,userOffsetRef.current.x+dx));
      userOffsetRef.current.y=Math.max(-0.9,Math.min(0.9,userOffsetRef.current.y-dy));
      dragStartRef.current={x:e.clientX,y:e.clientY};
    };
    const onUp=()=>{ isDraggingRef.current=false; el.style.cursor="grab"; };
    el.addEventListener("mousedown",onDown);
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);

    // ── Render loop ───────────────────────────────────────────────────────
    const animate=()=>{
      animFrameRef.current=requestAnimationFrame(animate);

      // Lerp camera to seat position
      camera.position.lerp(targetPosRef.current, 0.07);

      // Compute look-at with user pan offset added
      const base=targetLookRef.current;
      const forward=new THREE.Vector3().subVectors(base, camera.position).normalize();
      const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
      const up=new THREE.Vector3().crossVectors(right,forward).normalize();
      const desiredLook=base.clone()
        .addScaledVector(right, userOffsetRef.current.x*8)
        .addScaledVector(up, userOffsetRef.current.y*5);
      currentLookRef.current.lerp(desiredLook, 0.09);
      camera.lookAt(currentLookRef.current);

      // Animate ribbon scroll
      if(ribbonTexNBA) ribbonTexNBA.offset.x+=0.00065;

      renderer.render(scene,camera);
    };
    animate();

    const onResize=()=>{
      if(!container) return;
      const nw=container.clientWidth||860;
      const nh=container.clientHeight||290;
      if(nh>0){ camera.aspect=nw/nh; camera.updateProjectionMatrix(); renderer.setSize(nw,nh); }
    };
    window.addEventListener("resize",onResize);

    return ()=>{
      window.removeEventListener("resize",onResize);
      el.removeEventListener("mousedown",onDown);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("mouseup",onUp);
      if(animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      scene.clear();
    };
  },[eventName, isSphere]);

  // ── Telemetry labels ──────────────────────────────────────────────────────
  const rowIdx = Math.max(0, activeRow.charCodeAt(0) - 65);
  const { camPos } = computeCameraAndTarget(activeSection, activeRow, activeSeat, level, isSphere);
  const distToFocus = isSphere
    ? Math.round(camPos.length())          // distance from center
    : Math.round(Math.sqrt(camPos.x**2+camPos.z**2)); // dist from court center
  const elevFt = Math.round(camPos.y * 3.281);

  return (
    <>
    <div className="relative w-full h-64 md:h-[17rem] rounded-3xl overflow-hidden border border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] bg-[#04060f] mb-5 select-none">

      {/* View layer: real photo when we have it, 3D otherwise */}
      {photoVenue ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src={photoVenue}
            alt={`View from Sec ${activeSection} Row ${activeRow}`}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-[1400ms] ease-out will-change-transform"
            style={{ transform: `scale(${photoCrop.scale})`, objectPosition: `${photoCrop.posX}% ${photoCrop.posY}%` }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25 pointer-events-none" />
        </div>
      ) : (
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full cursor-grab"
        title="Click and drag to look around from your seat"
      />
      )}

      {/* Top HUD */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xl">
            <Eye size={12} className="text-cyan-400 animate-pulse" />
            1st-Person · Row {activeRow} Eye Level
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-200 bg-slate-900/85 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
            Sec {activeSection} · Row {activeRow} · Seat {activeSeat}
          </span>
        </div>
        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/60 text-amber-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg">
          <Zap size={10} />
          {distToFocus}m · {elevFt}ft elevation
        </span>
      </div>

      {/* Drag hint */}
      <div className="absolute top-12 left-3 pointer-events-none z-20">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/70 border border-white/10 text-[9px] font-semibold text-slate-400 backdrop-blur-sm">
          <Rotate3d size={9} className="text-cyan-400" />
          Drag to look around
        </span>
      </div>

    </div>
      {/* Bottom HUD */}
      <div className="mt-2 p-3 rounded-2xl bg-slate-950/90 border border-cyan-400/25 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 grid place-items-center text-cyan-200 font-black text-sm">
            {activeRow}
          </div>
          <div>
            <div className="text-[11px] font-black text-white">
              {isSphere
                ? `${level} · ${distToFocus}m from center stage`
                : `${level} Level · ${distToFocus}m from court center`}
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-bold">
                {elevFt}ft elevation
              </span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {isSphere
                ? "🌐 16K Wraparound LED Canvas · Holoplot 3D Audio"
                : tier==="VIP" ? "👑 Courtside VIP · In-Seat Service"
                : tier==="Premium" ? "⭐ Lower Bowl · Prime Sightline"
                : tier==="Standard" ? "🎟️ Club Level · Elevated View"
                : "🔭 Upper Bowl · Full Arena Panoramic"}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/35 px-3 py-1.5 rounded-xl">
          <ShieldCheck size={13} className="text-emerald-400" />
          Unobstructed
        </div>
      </div>
    </>
  );
}
