import { Heart, Star } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface GlassTourCardProps {
  pkg: {
    title: string;
    rating: number;
    reviews: number;
    description: string;
    price: number;
    image: string;
  };
}

export default function GlassTourCard({
  pkg,
}: {
  pkg: GlassTourCardProps["pkg"];
}) {
  // --- TEMP: localStorage heart state
  const storageKey = `liked_${pkg.title}`;
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    setIsLiked(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);

  function toggleLike() {
    const next = !isLiked;
    setIsLiked(next);
    localStorage.setItem(storageKey, String(next)); // ← swap this line with your API call
  }
  // --- END TEMP ---

  return (
    <div className="group relative w-[85vw] sm:w-[340px] md:w-[380px] overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-4 text-[var(--text-main)] backdrop-blur-3xl transition-all duration-300 hover:-translate-y-2 hover:border-white/30 shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] cursor-pointer">
      {/* Top-Right Purple Accent */}
      <div className="absolute -right-12 -top-12 z-0 h-28 w-28 rounded-full bg-[var(--accent-secondary)] opacity-100 blur-[60px]"></div>

      {/* Bottom-Left Blue Accent */}
      <div className="absolute -bottom-12 -left-12 z-0 h-28 w-28 rounded-full bg-[var(--accent-primary)] opacity-100 blur-[60px]"></div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Image Container */}
        <div className="relative h-[280px] w-full overflow-hidden rounded-[24px]">
          <Image
            src={pkg.image}
            alt="Amalfi Coast"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            width={1920}
            height={1080}
            priority
          />

          <div className="absolute left-4 right-4 top-4 flex justify-between">
            <div className="rounded-full border border-white/20 bg-white/20 px-5 py-1 text-sm font-medium shadow-sm backdrop-blur-md flex items-center justify-center hover:bg-white/30">
              Popular
            </div>
            <button
              onClick={toggleLike}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/20 shadow-sm backdrop-blur-md transition-colors hover:bg-white/30 cursor-pointer"
            >
              <Heart
                size={18}
                className={
                  isLiked
                    ? "fill-pink-500 text-pink-500"
                    : "text-[var(--text-main)]"
                }
              />
            </button>
          </div>
        </div>

        {/* Text Content */}
        <div className="mt-5 px-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">{pkg.title}</h2>
            <div className="flex items-center gap-1 text-sm font-light">
              <Star size={16} className="fill-[#FDB241] text-[#FDB241]" />
              <span>
                {pkg.rating} ({pkg.reviews})
              </span>
            </div>
          </div>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {pkg.description}
          </p>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between pb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">$ {pkg.price}</span>
              <span className="text-xs text-[var(--text-muted)]">/ person</span>
            </div>
            <button className="rounded-full bg-[var(--accent-primary)] px-6 py-2 text-sm font-light text-[var(--text-main)] transition-colors  hover:opacity-80 hover:shadow-[var(--glow-primary)] cursor-pointer">
              Explore Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
