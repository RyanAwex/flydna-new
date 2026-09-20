import SearchSection from "../shared/SearchSection";
import AnimatedPlane from "./AnimatedPlane";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full flex flex-col items-center pb-32 px-4 max-w-7xl mx-auto z-20 select-none">
      <div className="relative w-full mx-auto z-0 -mt-2 mb-5 flex justify-center">
        {/* Mobile (Default) */}
        <div className="relative w-full block sm:hidden">
          <Image
            src="/assets/main/Mobile.svg"
            alt="World Map (Mobile)"
            className="w-full h-auto object-contain opacity-100 pointer-events-none hero-map-svg"
            width={675}
            height={675}
            priority
          />
          <div className="absolute top-[54%] left-1/2 -translate-x-[58%] w-[96%] h-[13%] pointer-events-none z-10">
            <Image
              src="/assets/main/PlanePath.svg"
              alt="Plane Path"
              className="absolute inset-0 w-full h-full object-contain opacity-60 hero-map-svg"
              width={581}
              height={90}
              priority
            />
            <AnimatedPlane
              path="M140 43.958C245 -27.2226 808.2 -0.147802 814 83"
              viewBox="0 0 823 94"
            />
          </div>
        </div>

        {/* Small Screens (sm) */}
        <div className="relative w-full hidden sm:block md:hidden">
          <Image
            src="/assets/main/SM.svg"
            alt="World Map (SM)"
            className="w-full h-auto object-contain opacity-100 pointer-events-none hero-map-svg"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute top-[51.5%] left-1/2 -translate-x-[57.5%] w-[91%] h-[15%] pointer-events-none z-10">
            <Image
              src="/assets/main/PlanePath.svg"
              alt="Plane Path"
              className="absolute inset-0 w-full h-full object-contain opacity-60 hero-map-svg"
              width={823}
              height={94}
              priority
            />
            <AnimatedPlane
              path="M140 43.958C245 -27.2226 808.2 -0.147802 814 83"
              viewBox="0 0 823 94"
            />
          </div>
        </div>

        {/* Medium Screens (md) */}
        <div className="relative w-full hidden md:block lg:hidden">
          <Image
            src="/assets/main/MD.svg"
            alt="World Map (MD)"
            className="w-full h-auto object-contain opacity-100 pointer-events-none hero-map-svg"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute top-[51.5%] left-1/2 -translate-x-1/2 w-[73%] h-[15%] pointer-events-none z-10">
            <Image
              src="/assets/main/PlanePath.svg"
              alt="Plane Path"
              className="absolute inset-0 w-full h-full object-contain opacity-60 hero-map-svg"
              width={823}
              height={94}
              priority
            />
            <AnimatedPlane
              path="M140 43.958C245 -27.2226 808.2 -0.147802 814 83"
              viewBox="0 0 823 94"
            />
          </div>
        </div>

        {/* Large Screens (lg) */}
        <div className="relative w-full hidden lg:block xl:hidden">
          <Image
            src="/assets/main/LG.svg"
            alt="World Map (LG)"
            className="w-full h-auto object-contain opacity-100 pointer-events-none hero-map-svg"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute top-[52%] left-1/2 -translate-x-[44.5%] w-[62.5%] h-[15%] pointer-events-none z-10">
            <Image
              src="/assets/main/PlanePath.svg"
              alt="Plane Path"
              className="absolute inset-0 w-full h-full object-contain opacity-60 hero-map-svg"
              width={823}
              height={94}
              priority
            />
            <AnimatedPlane
              path="M140 43.958C245 -27.2226 808.2 -0.147802 814 83"
              viewBox="0 0 823 94"
            />
          </div>
        </div>

        {/* XL Screens */}
        <div className="relative hidden xl:block w-full">
          <Image
            src="/assets/main/XL.svg"
            alt="World Map (XL)"
            className="w-full h-auto object-contain opacity-100 mt-10 pointer-events-none hero-map-svg"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-[823px] h-[94px] pointer-events-none z-10">
            <Image
              src="/assets/main/PlanePath.svg"
              alt="Plane Path"
              className="absolute inset-0 w-full h-full object-contain opacity-60 hero-map-svg"
              width={823}
              height={94}
              priority
            />
            <AnimatedPlane
              path="M140 43.958C245 -27.2226 808.2 -0.147802 814 83"
              viewBox="0 0 823 94"
            />
          </div>
        </div>
      </div>

      {/* Search Widget */}
      <SearchSection />
    </section>
  );
}
