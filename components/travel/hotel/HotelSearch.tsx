"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "@/utils/icons";
import { properties, FilterItem, Property } from "@/utils/mock-data/properties";
import Image from "next/image";
import { BedDouble, CreditCard, Ruler, User } from "lucide-react";
import { useSearchStore } from "@/utils/states/useSearchStore";

const { ChevronDown, HeartIcon, StarIcon } = Icons;

const realHotelsDatabase: Record<string, string[]> = {
  "Atlanta": [
    "The Ritz-Carlton, Atlanta",
    "Four Seasons Hotel Atlanta",
    "Hilton Atlanta Downtown",
    "The Whitley, Atlanta Buckhead",
    "Waldorf Astoria Atlanta Buckhead",
    "Loews Atlanta Hotel",
    "The St. Regis Atlanta",
    "Grand Hyatt Atlanta in Buckhead"
  ],
  "New York": [
    "The Plaza Hotel New York",
    "The Ritz-Carlton Central Park",
    "The Times Square EDITION",
    "The Carlyle, A Rosewood Hotel",
    "Arlo NoMad New York",
    "Mandarin Oriental New York",
    "The Standard, High Line NYC",
    "Lotte New York Palace"
  ],
  "Norfolk": [
    "The Main, Hilton Norfolk",
    "Sheraton Norfolk Waterside Hotel",
    "SpringHill Suites Norfolk Old Town",
    "Residence Inn Norfolk Downtown",
    "Norfolk Waterside Marriott",
    "Glass Light Hotel & Gallery",
    "DoubleTree by Hilton Norfolk Airport",
    "Wyndham Garden Norfolk Downtown"
  ],
  "London": [
    "The Savoy London",
    "The Ritz London",
    "Claridge's London",
    "The Langham, London",
    "Rosewood London",
    "Sea Containers London",
    "The Ned London",
    "Shangri-La The Shard"
  ],
  "Paris": [
    "Ritz Paris",
    "Le Bristol Paris",
    "Hôtel Plaza Athénée Paris",
    "The Peninsula Paris",
    "Shangri-La Paris",
    "Hôtel Lutetia Paris",
    "Pullman Paris Tour Eiffel",
    "Mandarin Oriental Paris"
  ],
  "Singapore": [
    "Marina Bay Sands Singapore",
    "Raffles Hotel Singapore",
    "The Fullerton Hotel Singapore",
    "Capella Singapore",
    "W Singapore - Sentosa Cove",
    "Pan Pacific Singapore",
    "PARKROYAL COLLECTION Pickering",
    "The Ritz-Carlton Millenia Singapore"
  ],
  "Dubai": [
    "Burj Al Arab Jumeirah",
    "Atlantis, The Palm Dubai",
    "The Armani Hotel Dubai",
    "Jumeirah Al Naseem",
    "One&Only The Palm Dubai",
    "Address Downtown Dubai",
    "Raffles The Palm Dubai",
    "Anantara The Palm Dubai"
  ],
  "Tokyo": [
    "Aman Tokyo",
    "Park Hyatt Tokyo",
    "The Ritz-Carlton, Tokyo",
    "Hoshinoya Tokyo",
    "Andaz Tokyo Toranomon Hills",
    "Palace Hotel Tokyo",
    "Shibuya Stream Excel Hotel Tokyu",
    "The Tokyo Station Hotel"
  ]
};

const getRealHotelsForCity = (city: string): string[] => {
  const normalized = city.trim();
  const key = Object.keys(realHotelsDatabase).find(k => 
    normalized.toLowerCase().includes(k.toLowerCase())
  );
  if (key) {
    return realHotelsDatabase[key];
  }
  return [
    `The Ritz-Carlton, ${city}`,
    `Four Seasons Hotel ${city}`,
    `Hilton ${city} Downtown`,
    `Hyatt Regency ${city}`,
    `InterContinental ${city}`,
    `Marriott ${city} Resort`,
    `Sheraton ${city} Center`,
    `The Westin ${city}`
  ];
};

interface HotelDetails {
  price: number;
  oldPrice: number;
  image: string;
  rating: string;
  ratingLabel: string;
  roomType: string;
  stars: number;
}

const hotelsDatabase: Record<string, HotelDetails> = {
  // Atlanta
  "The Ritz-Carlton, Atlanta": {
    price: 340,
    oldPrice: 395,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    rating: "4.7/5",
    ratingLabel: "Superb",
    roomType: "Deluxe King Room",
    stars: 5
  },
  "Four Seasons Hotel Atlanta": {
    price: 490,
    oldPrice: 560,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    rating: "4.8/5",
    ratingLabel: "Exceptional",
    roomType: "Midtown Executive Suite",
    stars: 5
  },
  "Hilton Atlanta Downtown": {
    price: 180,
    oldPrice: 215,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
    rating: "4.3/5",
    ratingLabel: "Excellent",
    roomType: "High-Floor Skyline King",
    stars: 4
  },
  "The Whitley, Atlanta Buckhead": {
    price: 320,
    oldPrice: 370,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    rating: "4.6/5",
    ratingLabel: "Superb",
    roomType: "Buckhead Suite",
    stars: 5
  },
  "Waldorf Astoria Atlanta Buckhead": {
    price: 520,
    oldPrice: 610,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80",
    rating: "4.9/5",
    ratingLabel: "Exceptional",
    roomType: "Premier Terrace Suite",
    stars: 5
  },
  "Loews Atlanta Hotel": {
    price: 260,
    oldPrice: 300,
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&q=80",
    rating: "4.5/5",
    ratingLabel: "Excellent",
    roomType: "Midtown Luxury King",
    stars: 4
  },
  "The St. Regis Atlanta": {
    price: 680,
    oldPrice: 790,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    rating: "4.9/5",
    ratingLabel: "Exceptional",
    roomType: "Grand Deluxe Suite with Butler Service",
    stars: 5
  },
  "Grand Hyatt Atlanta in Buckhead": {
    price: 210,
    oldPrice: 245,
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80",
    rating: "4.4/5",
    ratingLabel: "Very Good",
    roomType: "Japanese Garden View King",
    stars: 4
  },

  // New York
  "The Plaza Hotel New York": {
    price: 850,
    oldPrice: 980,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    rating: "4.8/5",
    ratingLabel: "Superb",
    roomType: "Deluxe King Room",
    stars: 5
  },
  "The Ritz-Carlton Central Park": {
    price: 950,
    oldPrice: 1100,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    rating: "4.9/5",
    ratingLabel: "Exceptional",
    roomType: "Park View King Suite",
    stars: 5
  },
  "The Times Square EDITION": {
    price: 480,
    oldPrice: 550,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    rating: "4.6/5",
    ratingLabel: "Excellent",
    roomType: "Premier Double Room",
    stars: 5
  },
  "The Carlyle, A Rosewood Hotel": {
    price: 900,
    oldPrice: 1050,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    rating: "4.8/5",
    ratingLabel: "Superb",
    roomType: "Classic Suite",
    stars: 5
  },
  "Arlo NoMad New York": {
    price: 240,
    oldPrice: 280,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80",
    rating: "4.3/5",
    ratingLabel: "Very Good",
    roomType: "Queen Room with City View",
    stars: 4
  },
  "Mandarin Oriental New York": {
    price: 780,
    oldPrice: 890,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    rating: "4.7/5",
    ratingLabel: "Superb",
    roomType: "Hudson River View King",
    stars: 5
  },
  "The Standard, High Line NYC": {
    price: 320,
    oldPrice: 370,
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&q=80",
    rating: "4.4/5",
    ratingLabel: "Very Good",
    roomType: "Standard Queen Room",
    stars: 4
  },
  "Lotte New York Palace": {
    price: 520,
    oldPrice: 600,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    rating: "4.6/5",
    ratingLabel: "Excellent",
    roomType: "Superior Queen Room",
    stars: 5
  },

  // Norfolk
  "The Main, Hilton Norfolk": {
    price: 220,
    oldPrice: 250,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
    rating: "4.6/5",
    ratingLabel: "Excellent",
    roomType: "Deluxe King Room",
    stars: 4
  },
  "Sheraton Norfolk Waterside Hotel": {
    price: 160,
    oldPrice: 190,
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&q=80",
    rating: "4.2/5",
    ratingLabel: "Very Good",
    roomType: "Harbor View Double Room",
    stars: 4
  },
  "SpringHill Suites Norfolk Old Town": {
    price: 140,
    oldPrice: 165,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    rating: "4.3/5",
    ratingLabel: "Very Good",
    roomType: "Standard Suite",
    stars: 3
  },
  "Residence Inn Norfolk Downtown": {
    price: 180,
    oldPrice: 210,
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80",
    rating: "4.4/5",
    ratingLabel: "Excellent",
    roomType: "Studio King Suite",
    stars: 3
  },
  "Norfolk Waterside Marriott": {
    price: 200,
    oldPrice: 230,
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    rating: "4.5/5",
    ratingLabel: "Excellent",
    roomType: "River View King Room",
    stars: 4
  },
  "Glass Light Hotel & Gallery": {
    price: 240,
    oldPrice: 280,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    rating: "4.8/5",
    ratingLabel: "Superb",
    roomType: "Boutique King Room",
    stars: 4
  },
  "DoubleTree by Hilton Norfolk Airport": {
    price: 130,
    oldPrice: 150,
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80",
    rating: "4.1/5",
    ratingLabel: "Good",
    roomType: "Standard King Room",
    stars: 3
  },
  "Wyndham Garden Norfolk Downtown": {
    price: 110,
    oldPrice: 130,
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    rating: "3.9/5",
    ratingLabel: "Pleasant",
    roomType: "Double Room",
    stars: 3
  }
};

const getGenericHotelDetails = (name: string, index: number): HotelDetails => {
  const basePrice = 150 + (index * 80) % 300;
  const oldPrice = Math.round(basePrice * 1.15);
  const images = [
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80"
  ];
  return {
    price: basePrice,
    oldPrice,
    image: images[index % images.length],
    rating: (4.0 + (index * 0.15) % 1.0).toFixed(1) + "/5",
    ratingLabel: (index % 3 === 0) ? "Superb" : (index % 3 === 1) ? "Exceptional" : "Excellent",
    roomType: (index % 2 === 0) ? "Deluxe King Room" : "Executive Suite",
    stars: (index % 3 === 0) ? 5 : 4
  };
};

const getHotelDetails = (name: string, index: number): HotelDetails => {
  if (hotelsDatabase[name]) {
    return hotelsDatabase[name];
  }
  return getGenericHotelDetails(name, index);
};

// --- Sub-components ---
const FilterSection = ({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) => (
  <div className="mb-6 border-b border-[var(--glass-border)] pb-4 last:border-0">
    <h3
      onClick={onToggle}
      className="text-sm font-semibold mb-4 flex justify-between items-center text-[var(--text-main)] cursor-pointer select-none hover:text-[var(--text-main)] transition-colors"
    >
      {title}
      <span className="text-[var(--text-muted)]">
        <ChevronDown isOpen={isOpen} />
      </span>
    </h3>
    <div
      className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
    >
      {children}
    </div>
  </div>
);

const CheckboxList = ({ items }: { items: FilterItem[] }) => (
  <>
    {items.map((item, i) => (
      <label
        key={i}
        className="flex items-center justify-between text-sm text-[var(--text-muted)] cursor-pointer group"
      >
        <span className="flex items-center gap-3 group-hover:text-[var(--text-main)] transition-colors">
          <input
            type="checkbox"
            defaultChecked={item.checked}
            className="w-4 h-4 accent-[var(--accent-primary)] rounded-sm bg-[var(--surface-color)] border-[var(--glass-border)] cursor-pointer"
          />
          {item.label}
        </span>
        <span className="text-xs group-hover:text-[var(--text-muted)]">
          {item.count}
        </span>
      </label>
    ))}
  </>
);

const CounterRow = ({ label, value }: { label: string; value: number }) => {
  const [count, setCount] = useState(value);
  return (
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <div className="flex items-center gap-4 border border-[var(--glass-border)] rounded-full px-4 py-1.5">
        <button
          onClick={() => setCount(Math.max(0, count - 1))}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg leading-none"
        >
          −
        </button>
        <span className="w-4 text-center text-sm font-medium text-[var(--text-main)]">
          {count}
        </span>
        <button
          onClick={() => setCount(count + 1)}
          className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
};

const BudgetSlider = () => {
  const steps = 24;
  const minPrice = 500;
  const maxPrice = 20000;
  const [minIdx, setMinIdx] = useState(4);
  const [maxIdx, setMaxIdx] = useState(19);

  const getPrice = (idx: number) =>
    Math.round(minPrice + (maxPrice - minPrice) * (idx / (steps - 1)));
  const barHeights = [
    20, 40, 30, 60, 45, 80, 50, 90, 75, 45, 100, 55, 85, 40, 95, 70, 45, 85, 75,
    55, 70, 45, 60, 80,
  ];
  const minPercent = (minIdx / (steps - 1)) * 100;
  const maxPercent = (maxIdx / (steps - 1)) * 100;

  return (
    <div className="mb-2 flex flex-col pt-2 relative px-1">
      <p className="text-xs text-[var(--text-muted)] mb-4">
        USD 500 - USD 20,000+
      </p>

      {/* Histogram */}
      <div className="flex items-end justify-between w-full h-12 pb-2">
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`w-1 rounded-full transition-all duration-300 ${i >= minIdx && i <= maxIdx ? "bg-[var(--accent-primary)]" : "bg-[var(--surface-color)]/90"}`}
          ></div>
        ))}
      </div>

      {/* Track & Thumbs */}
      <div className="relative h-1 bg-[var(--surface-color)]/90 rounded-full">
        <div
          className="absolute h-full bg-[var(--accent-primary)] rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        ></div>
        <input
          type="range"
          min="0"
          max={steps - 1}
          value={minIdx}
          onChange={(e) =>
            setMinIdx(Math.min(Number(e.target.value), maxIdx - 1))
          }
          className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--accent-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab z-10"
        />
        <input
          type="range"
          min="0"
          max={steps - 1}
          value={maxIdx}
          onChange={(e) =>
            setMaxIdx(Math.max(Number(e.target.value), minIdx + 1))
          }
          className="absolute w-full -top-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--surface-color)]/95 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--accent-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab z-20"
        />
      </div>

      {/* Labels */}
      <div className="relative w-full h-4 mt-3">
        <div
          className="absolute text-[10px] text-[var(--text-muted)] transition-all duration-100"
          style={{
            left: `${minPercent}%`,
            transform: `translateX(-${minPercent}%)`,
          }}
        >
          ${getPrice(minIdx).toLocaleString()}
        </div>
        <div
          className="absolute text-[10px] text-[var(--text-muted)] transition-all duration-100"
          style={{
            left: `${maxPercent}%`,
            transform: `translateX(-${maxPercent}%)`,
          }}
        >
          ${getPrice(maxIdx).toLocaleString()}
          {maxIdx === steps - 1 ? "+" : ""}
        </div>
      </div>
    </div>
  );
};

const PropertyCard = ({ property }: { property: Property }) => {
  const router = useRouter();

  const imageUrl = property.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
  const amenitiesList = Array.isArray(property.amenities) ? property.amenities : ["Free airport taxi", "Free cancellation"];

  return (
    <div className="bg-[var(--surface-color)] rounded-2xl overflow-hidden flex flex-col md:flex-row border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 hover:shadow-[0_8px_30px_rgba(56,189,248,0.15)] hover:-translate-y-1 transition-all duration-300 group">
      {/* Image Container */}
      <div
        className={`relative w-72 h-72 m-3 rounded-2xl overflow-hidden flex-shrink-0`}
      >
        <Image
          src={imageUrl}
          alt={property.title || "Hotel Image"}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <button className="absolute top-3 right-3 bg-[var(--surface-color)] p-2 rounded-full hover:bg-black/60 transition-colors backdrop-blur-sm">
          <HeartIcon />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-5 justify-center">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">
              {property.title || "Hotel"}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <StarIcon />
              <span className="text-yellow-500">{property.rating || "4.5/5"}</span>
              <span className="text-[var(--text-muted)]">
                {property.ratingLabel || "Excellent"}
              </span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            {property.location || "City Centre"}
          </p>

          <div className="border-l-2 border-[var(--accent-primary)] pl-3 mb-4">
            <h4 className="text-sm font-medium text-[var(--text-main)] mb-1.5">
              {property.roomType || "Standard Room"}
            </h4>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span>
                  <Ruler className="w-4 h-4" />
                </span>
                {property.size || "45 m²"}
              </span>
              <span className="flex items-center gap-1.5">
                <span>
                  <BedDouble className="w-4 h-4" />
                </span>
                {property.beds || "1 King Bed"}
              </span>
              <span className="flex items-center gap-1.5">
                <span>
                  <User className="w-4 h-4" />
                </span>
                {property.guests || "2 Adults"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mt-2">
          <div className="flex flex-col gap-3 items-start w-full md:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-[var(--text-muted)] w-full md:w-auto">
              {amenitiesList.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="text-sm leading-none">✓</span>
                  {item}
                </span>
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <CreditCard className="w-4 h-4" /> No prepayment needed - pay at
              the property
            </span>
          </div>

          <div className="text-right w-full md:w-auto flex flex-col items-end">
            <p className="text-[10px] text-[var(--text-muted)] mb-1">
              Per night (taxes included)
            </p>
            <button
              className="flex items-center gap-2 bg-[var(--accent-primary)]/95 text-[var(--text-main)] rounded-full px-4 py-1.5 cursor-pointer hover:opacity-80 hover:shadow-[var(--glow-primary)] transition-colors"
              onClick={() => router.push(`/travel/search/hotel/${property.id}`)}
            >
              <span className="text-[var(--text-muted)] line-through text-xs">
                ${property.oldPrice || "180"}
              </span>
              <span className="text-[var(--text-main)] font-bold text-lg">
                ${property.newPrice || "150"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HotelSearch() {
  const { hotelLocation, departureDate, returnDate } = useSearchStore();
  const currentCity = hotelLocation?.city || "Kuala Lumpur";
  const rawSearchParams = useSearchParams();
  const searchParams = rawSearchParams && typeof rawSearchParams.get === "function" ? rawSearchParams : null;
  const paramCity = searchParams ? searchParams.get("city") : null;
  const paramHotel = searchParams ? searchParams.get("hotel") : null;
  const effCity = paramCity || currentCity;

  const [liveHotels, setLiveHotels] = useState<any[]>([]);
  
  useEffect(() => {
    if (!paramCity && !hotelLocation) return;
    
    // Fallbacks if dates aren't selected
    const checkIn = departureDate || new Date().toISOString().split("T")[0];
    const checkOut = returnDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];
    
    // Prepare location for Duffel Stays (using lat/lng if available)
    const locPayload = hotelLocation?.coordinates?.[1] && hotelLocation?.coordinates?.[0] ? {
      radius: 20,
      geographic_coordinates: { latitude: hotelLocation.coordinates[1], longitude: hotelLocation.coordinates[0] }
    } : (hotelLocation as any)?.lat ? {
      radius: 20,
      geographic_coordinates: { latitude: (hotelLocation as any).lat, longitude: (hotelLocation as any).lng }
    } : {
      radius: 20,
      geographic_coordinates: { latitude: 40.7128, longitude: -74.0060 } // Fallback NYC
    };

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io"}/api/v1/hotels/city?city=${encodeURIComponent(paramCity || currentCity || "Atlanta")}`)
      .then((r) => r.json())
      .then((d) => {
        const real = Array.isArray(d?.data?.results) ? d.data.results : (Array.isArray(d?.data) ? d.data : []);
        const mapped = real.map((x: any, idx: number) => {
          const base = (properties && properties.length > 0) ? properties[idx % properties.length] : {} as any;
          const property = x.accommodation || x;
          const photoUrl = x.image || property.photos?.[0]?.url || base.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80";
          const rawPrice = x.price || x.cheapest_rate_total_amount || base.newPrice || "150";
          const cleanPrice = String(rawPrice).replace(/[^0-9.]/g, "") || "150";
          const numPrice = Number(cleanPrice) || 150;
          const oldPriceVal = Math.round(numPrice * 1.2);
          
          return {
            ...base,
            id: x.id || property.id || `live-${idx}`,
            title: x.name || property.name || base.title || "Unknown Hotel",
            location: `${property.location?.address?.city_name || paramCity || currentCity} • City centre`,
            oldPrice: String(oldPriceVal),
            newPrice: String(numPrice),
            image: photoUrl,
            rating: (x.stars ? `${x.stars}/5` : null) || property.rating?.toString() || base.rating || "4.5/5",
            ratingLabel: base.ratingLabel || "Excellent",
            roomType: base.roomType || "Standard Room",
            size: base.size || "45 m²",
            beds: base.beds || "1 King Bed",
            guests: base.guests || "2 Adults",
            amenities: base.amenities || ["Free airport taxi", "Free cancellation"],
          };
        });
        if (paramHotel) {
          mapped.sort((a: any, b: any) => (b.title === paramHotel ? 1 : 0) - (a.title === paramHotel ? 1 : 0));
        }
        setLiveHotels(mapped);
      })
      .catch((err) => {
        console.error("Failed to load Duffel Stays:", err);
        setLiveHotels([]);
      });
  }, [paramCity, hotelLocation, departureDate, returnDate]);
  const [sections, setSections] = useState({
    budget: true,
    popular: true,
    rating: true,
    reviews: true,
    beds: true,
    policy: true,
    facilities: true,
    type: true,
    room: true,
    distance: true,
  });

  React.useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 1024;
      setSections({
        budget: !isSmall,
        popular: !isSmall,
        rating: !isSmall,
        reviews: !isSmall,
        beds: !isSmall,
        policy: !isSmall,
        facilities: !isSmall,
        type: !isSmall,
        room: !isSmall,
        distance: !isSmall,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = (sec: keyof typeof sections) =>
    setSections((p) => ({ ...p, [sec]: !p[sec] }));

  return (
    <div className="min-h-screen text-[var(--text-main)] p-4 md:p-6 flex flex-col lg:flex-row gap-6 font-sans selection:bg-[var(--accent-primary)] selection:text-[var(--text-main)] my-20">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 flex-shrink-0 bg-[var(--surface-color)] rounded-2xl p-6 h-fit border border-[var(--glass-border)] shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--glass-border)]">
          <h2 className="text-lg font-bold">Stop</h2>
          <ChevronDown isOpen={false} />
        </div>

        <FilterSection
          title="your budget (per night)"
          isOpen={sections.budget}
          onToggle={() => toggle("budget")}
        >
          <BudgetSlider />
        </FilterSection>

        <FilterSection
          title="Popular filters"
          isOpen={sections.popular}
          onToggle={() => toggle("popular")}
        >
          <CheckboxList
            items={[
              { label: "Free cancellation", count: 14 },
              { label: "Book without prepayment", count: 170 },
              { label: "Breakfast included", count: 732, checked: true },
              { label: "Swimming pool", count: 1594 },
              { label: "5 star", count: 85 },
              { label: "Very Good: 8+", count: 85 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Property rating"
          isOpen={sections.rating}
          onToggle={() => toggle("rating")}
        >
          <CheckboxList
            items={[
              { label: "1 star", count: 14 },
              { label: "2 star", count: 170 },
              { label: "3 star", count: 732, checked: true },
              { label: "4 star", count: 1594 },
              { label: "5 star", count: 85 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Review score"
          isOpen={sections.reviews}
          onToggle={() => toggle("reviews")}
        >
          <CheckboxList
            items={[
              { label: "Wonderful", count: "9+", checked: true },
              { label: "Very Good", count: "8+" },
              { label: "Good", count: "7+" },
              { label: "Pleasant", count: "6+" },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Bedrooms & bathrooms"
          isOpen={sections.beds}
          onToggle={() => toggle("beds")}
        >
          <CounterRow label="Bedrooms" value={0} />
          <CounterRow label="Bathrooms" value={0} />
        </FilterSection>

        <FilterSection
          title="Reservation policy"
          isOpen={sections.policy}
          onToggle={() => toggle("policy")}
        >
          <CheckboxList
            items={[
              { label: "Free cancellation", count: 2767, checked: true },
              { label: "Book without prepayment", count: 425 },
              { label: "No prepayment", count: 931 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Facilities"
          isOpen={sections.facilities}
          onToggle={() => toggle("facilities")}
        >
          <CheckboxList
            items={[
              { label: "Parking", count: 550, checked: true },
              { label: "Restaurant", count: 325 },
              { label: "Room service", count: 200 },
              { label: "24-hour front desk", count: 450 },
              { label: "Fitness centre", count: 350 },
              { label: "Show all 51", count: 400 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Property Type"
          isOpen={sections.type}
          onToggle={() => toggle("type")}
        >
          <CheckboxList
            items={[
              { label: "Parking", count: 550, checked: true },
              { label: "Apartments", count: 325 },
              { label: "Hotels", count: 200 },
              { label: "Hostels", count: 450 },
              { label: "Villas", count: 350 },
              { label: "Guesthouses", count: 400 },
              { label: "Homestays", count: 214 },
              { label: "Resorts", count: 8 },
              { label: "Aparthotels", count: 9 },
              { label: "Campsites", count: 11 },
              { label: "Capsule Hotels", count: 12 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title="Room facilities"
          isOpen={sections.room}
          onToggle={() => toggle("room")}
        >
          <CheckboxList
            items={[
              { label: "Kitchen/kitchenette", count: 550, checked: true },
              { label: "Private bathroom", count: 325 },
              { label: "Air conditioning", count: 200 },
              { label: "Washing machine", count: 450 },
              { label: "Kitchen", count: 350 },
            ]}
          />
        </FilterSection>

        <FilterSection
          title={`Distance from centre of ${currentCity}`}
          isOpen={sections.distance}
          onToggle={() => toggle("distance")}
        >
          <CheckboxList
            items={[
              { label: "Less than 1 km", count: 550, checked: true },
              { label: "Less than 3 km", count: 200 },
              { label: "Less than 5 km", count: 450 },
            ]}
          />
        </FilterSection>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-5">
        <h2 className="text-xl font-medium">
          {effCity}: {liveHotels.length > 0 ? `${liveHotels.length} properties found` : "3,596 properties found"}
        </h2>
        {(() => {
          if (liveHotels.length > 0) {
            return liveHotels.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ));
          }
          const hotelNames = getRealHotelsForCity(currentCity);
          const displayProperties = properties.map((prop, idx) => {
            const realTitle = hotelNames[idx % hotelNames.length];
            const details = getHotelDetails(realTitle, idx);
            return {
              ...prop,
              title: realTitle,
              location: `${currentCity} • ${((idx + 1) * 0.8).toFixed(1)} km from center • Subway access`,
              rating: details.rating,
              ratingLabel: details.ratingLabel,
              roomType: details.roomType,
              oldPrice: String(details.oldPrice),
              newPrice: String(details.price),
              image: details.image
            };
          });
          return displayProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ));
        })()}
      </main>
    </div>
  );
}
