import DestinationsArc from "@/components/travel/index/DestinationsArc";
import Hero from "@/components/travel/index/Hero";
import VacationPackages from "@/components/travel/index/VacationPackages";

export default function Home() {
  return (
    <main className="z-0 bg-[var(--bg-app)]">
      <Hero />
      <DestinationsArc />
      <VacationPackages />
    </main>
  );
}
