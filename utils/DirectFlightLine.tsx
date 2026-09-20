"use client";

import { useMapContext } from "@vnedyalk0v/react19-simple-maps";
import Image from "next/image";

const DirectFlightLine = ({
  start,
  end,
}: {
  start: [number, number];
  end: [number, number];
}) => {
  let projectionFunc: any = null;
  try {
    const ctx = useMapContext();
    if (ctx && typeof ctx.projection === "function") {
      projectionFunc = ctx.projection;
    }
  } catch (e) {
    return null;
  }

  if (!projectionFunc) return null;

  let startPoint: [number, number] | null = null;
  let endPoint: [number, number] | null = null;
  try {
    startPoint = projectionFunc(start);
    endPoint = projectionFunc(end);
  } catch (e) {
    return null;
  }

  if (!startPoint || !endPoint) return null;


  // Calculate distance between points for a dynamic, proportional arch
  const dx = endPoint[0] - startPoint[0];
  const dy = endPoint[1] - startPoint[1];
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Arch amount based on distance (e.g. 20% of distance)
  const archOffset = distance * 0.2;

  // Change the offset instead of static 100
  const curveHeight =
    Math.min(startPoint[1], endPoint[1]) - Math.max(archOffset, 15);

  const pathString = `M ${startPoint[0]} ${startPoint[1]} Q ${(startPoint[0] + endPoint[0]) / 2} ${curveHeight} ${endPoint[0]} ${endPoint[1]}`;

  // Make animation speed proportional to line length, but much faster
  const duration = Math.max((distance * 5) / 500, 1.5);

  return (
    <g>
      <defs>
        <linearGradient id="flight-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="50%" stopColor="var(--accent-secondary)" />
          <stop offset="100%" stopColor="var(--text-main)" />
        </linearGradient>
      </defs>

      <path
        d={pathString}
        stroke="url(#flight-gradient)"
        strokeWidth={1.5}
        strokeDasharray="5"
        fill="none"
      />

      <g>
        <animateMotion
          dur={`${duration}s`}
          repeatCount="indefinite"
          path={pathString}
          rotate="auto"
        />
        <animate
          attributeName="opacity"
          values="0; 1; 1; 0"
          keyTimes="0; 0.1; 0.9; 1"
          dur={`${duration}s`}
          repeatCount="indefinite"
        />
        <foreignObject
          x="-12"
          y="-12"
          width="24"
          height="24"
          className="overflow-visible"
        >
          <div className="relative flex items-center justify-center w-6 h-6">
            <Image
              src="/assets/plane.svg"
              alt="Plane"
              className="w-4 h-4 text-[var(--accent-primary)]"
              width={20}
              height={20}
              priority
            />
            <div className="absolute top-1/2 left-0 -translate-x-[120%] -translate-y-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent to-[var(--accent-primary)]/60 blur-[1px]"></div>
          </div>
        </foreignObject>
      </g>
    </g>
  );
};

export default DirectFlightLine;
