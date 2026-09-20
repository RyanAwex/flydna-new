/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export default function BroadcastNetworkCard() {
  const playerRef = useRef<any>(null);
  const containerId = "youtube-tv-player";
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const videoIds = [
    "VJF9Xov_2ss", // First video
    "8mAvmPMdMFs", // Second video
  ];

  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoIds[currentVideoIndex],
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          loop: 0,
        },
        events: {
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              setCurrentVideoIndex((prevIndex) => {
                const nextIndex = prevIndex + 1;
                if (nextIndex < videoIds.length) {
                  return nextIndex;
                }
                return 0; // Loop back to the first video
              });
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      if (
        playerRef.current &&
        typeof playerRef.current.loadVideoById === "function"
      ) {
        playerRef.current.loadVideoById(videoIds[currentVideoIndex]);
      } else {
        initPlayer();
      }
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }
  }, [currentVideoIndex]);

  return (
    <div className="glass-panel-heavy relative overflow-hidden rounded-[26px] p-5 bg-[radial-gradient(circle_at_100%_100%,rgba(239,68,68,0.05),transparent_50%)] text-left flex flex-col gap-4 h-full justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h4 className="font-extrabold text-xs tracking-wider text-slate-200 uppercase">
              BROADCAST NETWORK
            </h4>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              FlyDnA Premium Channel
            </p>
          </div>
        </div>
      </div>

      {/* Video Screen Container */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/5 shadow-inner flex flex-col justify-center items-center group w-full">
        {/* YouTube Iframe container */}
        <div id={containerId} className="w-full h-full object-cover" />

        {/* Animated border glow on hover */}
        <div className="absolute inset-0 border border-red-500/0 group-hover:border-red-500/20 transition-colors duration-500 rounded-xl pointer-events-none" />
      </div>

      {/* Ad Description */}
      <div className="flex justify-between items-center text-xs font-extrabold text-slate-400 border-t border-white/5 pt-3">
        <span>Powered by: AvA Digital Coin</span>
        <span className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1">
          Learn More <ChevronRight size={14} />
        </span>
      </div>
    </div>
  );
}
