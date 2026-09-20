import Footer from "@/components/shared/Footer";
import UnderConstruction from "@/components/travel/shared/UnderConstruction";

const Page = () => {
  return (
    <main className="min-h-screen text-[var(--text-main)] overflow-x-hidden relative flex flex-col bg-[var(--bg-app)]">
      <UnderConstruction />

      <Footer />
    </main>
  );
};

export default Page;
