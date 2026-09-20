import SearchSection from "@/components/travel/shared/SearchSection";
import CarSearch from "@/components/travel/car/CarSearch";
import { Suspense } from "react";

const CarPage = () => {
  return (
    <main className="bg-[var(--bg-app)]">
      <div className="pt-40 z-20">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchSection />
        </Suspense>
      </div>
      <CarSearch />
    </main>
  );
};

export default CarPage;
