"use client";

import React, { useState } from "react";
import { Icons } from "@/utils/icons";
import { MapPin } from "lucide-react";
import { carData } from "@/utils/mock-data/cars";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSearchStore } from "@/utils/states/useSearchStore";

// --- Types ---
interface FilterItem {
  label: string;
  count: number;
  checked?: boolean;
}

interface CarData {
  id: string;
  name: string;
  tags: string[];
  features: {
    seats: number;
    transmission: string;
    largeBags: number;
    smallBags: number;
  };
  location: string;
  price: number;
  freeCancellation: boolean;
  image: string;
}

// --- Sub-components ---
const FilterSection = ({
  title,
  isOpen,
  onToggle,
  items,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: FilterItem[];
}) => (
  <div className="mb-6 border-b border-[var(--glass-border)] pb-4 last:border-0">
    <h3
      onClick={onToggle}
      className="text-md font-semibold mb-4 flex justify-between items-center text-[var(--text-main)] cursor-pointer select-none hover:text-[var(--text-main)] transition-colors"
    >
      {title}
      <span className="text-[var(--text-muted)]">
        <Icons.ChevronDown isOpen={isOpen} />
      </span>
    </h3>
    <div
      className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
    >
      {items.map((item, i) => (
        <label
          key={i}
          className="flex items-center justify-between text-md text-[var(--text-muted)] cursor-pointer group"
        >
          <span className="flex items-center gap-3 group-hover:text-[var(--text-main)] transition-colors">
            <input
              type="checkbox"
              defaultChecked={item.checked}
              className="w-4 h-4 accent-[var(--accent-primary)] rounded-sm bg-[var(--surface-color)] border-[var(--glass-border)] cursor-pointer"
            />
            {item.label}
          </span>
          <span className="text-sm group-hover:text-[var(--text-muted)]">
            {item.count}
          </span>
        </label>
      ))}
    </div>
  </div>
);

const CarCard = ({ car }: { car: CarData }) => {
  const router = useRouter();
  const { carPickupLocation } = useSearchStore();
  const currentCity = carPickupLocation?.city || "Dubai";
  const displayLocation = car.location.replace(/Dubai International Airport|Dubai/g, `${currentCity} Airport`);

  return (
    <div className="bg-[var(--surface-color)] rounded-2xl p-4 flex flex-col md:flex-row gap-6 border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-premium)] hover:-translate-y-1 transition-all duration-300 group">
      {/* Image Placeholder */}
      <div
        className={`w-full md:w-[250px] h-[250px] rounded-xl flex-shrink-0 relative overflow-hidden bg-[var(--surface-color)] flex items-center justify-center p-5`}
      >
        <Image
          className={`w-full h-full object-contain object-center`}
          src={car.image}
          alt={car.name}
          width={250}
          height={250}
          priority
        />
      </div>

      {/* Info Area */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors mb-3">
            {car.name}
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            {car.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-[var(--surface-color)] text-[var(--text-muted)] text-sm px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-md text-[var(--text-muted)] mb-4 max-w-sm">
            <div className="flex items-center gap-2">
              <Icons.User /> {car.features.seats} seats
            </div>
            <div className="flex items-center gap-2">
              <Icons.Gear /> {car.features.transmission}
            </div>
            <div className="flex items-center gap-2">
              <Icons.Bag /> {car.features.largeBags} large bag
            </div>
            {car.features.smallBags > 0 && (
              <div className="flex items-center gap-2">
                <Icons.Bag /> {car.features.smallBags} small bag
              </div>
            )}
          </div>
        </div>

        <div className="text-md text-[var(--text-muted)] flex items-center gap-2">
          <MapPin className="w-4 h-4" /> {displayLocation}
        </div>
      </div>

      {/* Pricing Area */}
      <div className="w-full md:w-[180px] flex flex-col justify-between items-end py-1 border-t md:border-t-0 md:border-l border-[var(--glass-border)] pt-4 md:pt-0 pl-0 md:pl-6">
        <div className="text-right w-full">
          <p className="text-sm text-[var(--text-muted)] mb-1">
            Price for 1 day
          </p>
          <p className="text-2xl font-bold text-[var(--text-main)] mb-2">
            US ${car.price}
          </p>
          {car.freeCancellation && (
            <p className="text-sm text-green-400 mb-4">Free cancellation</p>
          )}
        </div>
        <button
          className="w-full bg-[var(--accent-primary)] text-[var(--text-main)] py-2.5 rounded-full  hover:opacity-80 hover:shadow-[var(--glow-primary)] transition-colors text-sm font-medium cursor-pointer"
          onClick={() => router.push(`/travel/search/car/${car.id}`)}
        >
          View Deal
        </button>
      </div>
    </div>
  );
};

// --- Main Container ---
export default function CarSearch() {
  const { carPickupLocation, departureDate, returnDate, carPickupTime, carReturnTime } = useSearchStore();
  const currentCity = carPickupLocation?.city || "Dubai";
  const [liveCars, setLiveCars] = useState<CarData[]>([]);

  React.useEffect(() => {
    const pickupLoc = carPickupLocation?.code || "DXB";
    const dropoffLoc = carPickupLocation?.code || "DXB";
    const pDate = departureDate || new Date().toISOString().split("T")[0];
    const dDate = returnDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io"}/api/v1/cars/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupLocation: pickupLoc,
        dropoffLocation: dropoffLoc,
        pickupDate: pDate,
        dropoffDate: dDate,
        pickupTime: carPickupTime || "10:00:00",
        dropoffTime: carReturnTime || "10:00:00"
      })
    })
      .then(r => r.json())
      .then(d => {
        const results = Array.isArray(d?.data?.results) ? d.data.results : (Array.isArray(d?.data) ? d.data : []);
        const mapped = results.map((x: any, idx: number) => {
          const base = carData[idx % carData.length];
          return {
            ...base,
            id: x.id || `live-car-${idx}`,
            name: x.vehicle?.name || x.name || base.name,
            price: x.total_amount || base.price,
            image: x.vehicle?.image_url || x.image_url || base.image,
            features: {
              ...base.features,
              seats: x.vehicle?.seats || base.features.seats,
              transmission: x.vehicle?.transmission || base.features.transmission,
            }
          };
        });
        setLiveCars(mapped);
      })
      .catch(err => {
        console.error("Failed to load Duffel Cars:", err);
        setLiveCars([]);
      });
  }, [carPickupLocation, departureDate, returnDate, carPickupTime, carReturnTime]);

  const [sections, setSections] = useState({
    location: true,
    price: true,
    category: true,
    transmission: true,
    seats: true,
    fuel: true,
  });

  React.useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1024;
      setSections({
        location: !isSmall,
        price: !isSmall,
        category: !isSmall,
        transmission: !isSmall,
        seats: !isSmall,
        fuel: !isSmall,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = (sec: keyof typeof sections) =>
    setSections((p) => ({ ...p, [sec]: !p[sec] }));

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col lg:flex-row gap-6 font-sans text-[var(--text-main)] selection:bg-[var(--accent-primary)] selection:text-[var(--text-main)] my-20">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Map Widget */}
        <div className="bg-[var(--surface-color)] rounded-2xl h-64 relative overflow-hidden flex items-center justify-center border border-[var(--glass-border)]">
          <div className="absolute inset-0 opacity-30 bg-[url('/assets/cars/map.svg')] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
              <Icons.MapPin />
            </div>
            <button className="bg-[var(--accent-primary)] text-[var(--text-main)] px-6 py-1.5 rounded-full text-sm hover:bg-[var(--accent-secondary)] transition-colors font-medium shadow-md">
              Map
            </button>
          </div>
        </div>

        {/* Filter List */}
        <div className="bg-[var(--surface-color)] rounded-2xl p-6 h-auto border border-[var(--glass-border)] shadow-xl">
          <FilterSection
            title="Location"
            isOpen={sections.location}
            onToggle={() => toggle("location")}
            items={[
              { label: "Airport (in terminal)", count: 511, checked: true },
              { label: "Airport (meet & greet)", count: 59 },
            ]}
          />

          <FilterSection
            title="Price per day"
            isOpen={sections.price}
            onToggle={() => toggle("price")}
            items={[
              { label: "US$50–US$50", count: 160, checked: true },
              { label: "US$50 – US$100", count: 139 },
              { label: "US$100 – US$150", count: 131 },
              { label: "US$150 – US$200", count: 38 },
              { label: "US$200+", count: 102 },
            ]}
          />

          <FilterSection
            title="Car Category"
            isOpen={sections.category}
            onToggle={() => toggle("category")}
            items={[
              { label: "Compact car", count: 68 },
              { label: "Mid-size car", count: 164, checked: true },
              { label: "Large car", count: 378 },
              { label: "Station wagon", count: 1 },
              { label: "Luxury car", count: 150 },
              { label: "Minivans", count: 21 },
              { label: "SUVs", count: 263 },
            ]}
          />

          <FilterSection
            title="Transmission"
            isOpen={sections.transmission}
            onToggle={() => toggle("transmission")}
            items={[
              { label: "Automatic", count: 570, checked: true },
              { label: "Manual", count: 50 },
            ]}
          />

          <FilterSection
            title="Number of seats"
            isOpen={sections.seats}
            onToggle={() => toggle("seats")}
            items={[
              { label: "4 seats", count: 56, checked: true },
              { label: "5 seats", count: 417 },
              { label: "6+ seats", count: 94 },
            ]}
          />

          <FilterSection
            title="Fuel type"
            isOpen={sections.fuel}
            onToggle={() => toggle("fuel")}
            items={[
              { label: "Fully electric", count: 10, checked: true },
              { label: "Hybrid", count: 14 },
              { label: "Plug-in hybrid", count: 4 },
              { label: "Gas or diesel", count: 542 },
            ]}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-4">
        <div className="w-full flex items-center justify-between">
          <h2 className="text-xl font-medium">Popular Vehicles in {currentCity}</h2>
          <h2 className="text-md font-medium">Showing {liveCars.length || carData.length} cars available</h2>
        </div>
        {(liveCars.length > 0 ? liveCars : carData).map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </main>
    </div>
  );
}
