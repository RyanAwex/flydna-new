import PrivateSearch from "@/components/travel/private/PrivateSearch";
import SearchSection from "@/components/travel/shared/SearchSection";
import { Suspense } from "react";
import HeroMap from "@/utils/simple-maps";

const page = () => {
  return (
    <main className="z-0 bg-[var(--bg-app)]">
      <div className="relative w-full mx-auto z-20 md:-mb-40 flex justify-center">
        <HeroMap />
      </div>
      <Suspense
        fallback={
          <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
            Loading search...
          </div>
        }
      >
        <SearchSection />
      </Suspense>
      <PrivateSearch />
    </main>
  );
};

export default page;
