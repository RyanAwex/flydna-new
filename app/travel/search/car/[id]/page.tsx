import SearchSection from "@/components/travel/shared/SearchSection";
import { Suspense } from "react";
import UnderConstruction from "@/components/travel/shared/UnderConstruction";

const Page = () => {
  return (
    <main className="min-h-screen text-[var(--text-main)] overflow-x-hidden relative flex flex-col bg-[var(--bg-app)]">
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

      <UnderConstruction />
    </main>
  );
};

export default Page;
