"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const AnimatedPlane = ({
  path,
  viewBox,
}: {
  path: string;
  viewBox: string;
}) => {
  return (
    <svg
      viewBox={viewBox}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
    >
      <motion.g
        animate={{
          offsetDistance: ["0%", "100%", "100%", "0%", "0%"],
          rotate: [0, 0, 180, 180, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.48, 0.52, 0.96, 1],
        }}
        style={{
          offsetPath: `path('${path}')`,
          offsetRotate: "auto",
          offsetAnchor: "center",
        }}
      >
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
              className="w-6 h-6"
              width={24}
              height={24}
              priority
            />
            <div className="absolute top-1/2 left-0 -translate-x-[120%] -translate-y-1/2 w-4 h-[2px] bg-gradient-to-r from-transparent to-[#7c5cff]/60 blur-[1px]"></div>
          </div>
        </foreignObject>
      </motion.g>
    </svg>
  );
};

export default AnimatedPlane;
