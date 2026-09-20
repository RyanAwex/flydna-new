import HotelDetailsPage from "@/components/travel/hotel/HotelDetailsPage";
import SearchSection from "@/components/travel/shared/SearchSection";
import { Suspense } from "react";

const page = () => {
  return (
    <main className="bg-[var(--bg-app)]">
      <div className="mt-32 md:mt-40 mb-10 container mx-auto px-4 md:px-6">
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
      <HotelDetailsPage />
    </main>
  );
};

export default page;
