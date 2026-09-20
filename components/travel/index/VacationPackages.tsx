"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { packages } from "@/utils/mock-data/packages";
import Card from "./Card";

export default function VacationPackages() {
  const [activeCategory, setActiveCategory] = useState("All Place");

  const categories = ["All Place", "Couples", "Family", "Solo"];

  const handleCategoryClick = (name: string) => {
    setActiveCategory(name);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 400;
      const isAtStart = container.scrollLeft === 0;
      const isAtEnd =
        Math.abs(
          container.scrollWidth - container.clientWidth - container.scrollLeft,
        ) < 10;

      if (direction === "left") {
        if (isAtStart) {
          container.scrollTo({
            left: container.scrollWidth,
            behavior: "smooth",
          });
        } else {
          container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        }
      } else {
        if (isAtEnd) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  };

  return (
    <section className="w-full max-w-[1280px] mx-auto py-24 px-4 overflow-hidden text-[var(--text-main)] relative">
      <div className="mb-8 md:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight mb-3">
          Explore Top Vacation Packages
        </h2>
        <p className="text-[var(--text-muted)] text-sm md:text-base">
          Discover amazing deals to your dream destinations
        </p>
      </div>

      <div className="flex items-center justify-between mb-8 md:mb-10 gap-3">
        {/* Filtering Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 border border-white/5 bg-white/5 p-1 sm:p-1.5 rounded-full shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-md overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 cursor-pointer whitespace-nowrap shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] ${
                activeCategory === cat
                  ? "bg-white/10 text-[var(--text-main)] border border-white/5 border-t-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Left/Right controls */}
        <div className="flex gap-2 sm:gap-4 flex-shrink-0">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/5 shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/5 shadow-[var(--shadow-premium),inset_0_1px_0_0_rgba(255,255,255,0.3)] backdrop-blur-md flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Package Cards Grid */}
      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-18 pt-4 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {packages.map((pkg) => (
          <div key={pkg.id} className="snap-start shrink-0">
            <Card
              pkg={{
                ...pkg,
                rating: Number(pkg.rating),
                reviews: Number(pkg.reviews.replace(/[^\d.]/g, "")),
                price: Number(pkg.price.replace(/[^\d.]/g, "")),
              }}
            />
          </div>
        ))}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </section>
  );
}
