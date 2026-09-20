import HotelSearch from "@/components/travel/hotel/HotelSearch";
import SearchSection from "@/components/travel/shared/SearchSection";
import { Suspense } from "react";

const HotelPage = () => {
  return (
    <main className="bg-[var(--bg-app)]">
      <div className="mt-40 mb-10">
        <Suspense
          fallback={
            <div className="h-64 flex items-center justify-center text-[var(--text-muted)]">
              Loading search...
            </div>
          }
        >
          <SearchSection />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <HotelSearch />
      </Suspense>
    </main>
  );
};

export default HotelPage;
