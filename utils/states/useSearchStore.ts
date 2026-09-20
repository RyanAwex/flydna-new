import { create } from "zustand";
import { Location, airports } from "../mock-data/airports";

export const getApiUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'https://staging.flydna.io';
  return `${base}/api`;
};


const safeGetSession = (key: string, fallback: any) => {
  if (typeof window !== "undefined") {
    const val = sessionStorage.getItem(key);
    if (val) {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
  }
  return fallback;
};

const getStoredSeatingClass = (): string => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("flydna_preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.travelClass) {
          const cls = parsed.travelClass.toLowerCase();
          if (cls.includes("first")) return "first";
          if (cls.includes("business")) return "business";
          if (cls.includes("premium")) return "premium_economy";
        }
      }
    } catch {}
  }
  return "economy";
};

interface SearchState {
  departure: Location | null;
  arrival: Location | null;
  departureDate: string;
  returnDate: string | null;
  tripType: "One Way" | "Round Trip" | "Multi Way";

  hotelLocation: Location;

  carPickupLocation: Location;
  carPickupTime: string;
  carReturnTime: string;
  activeCategory: string | null;

  // Real Search & Booking States
  isSearching: boolean;
  searchError: string | null;
  offers: any[];
  offerRequestId: string | null;
  selectedOffer: any | null;
  passengerDetails: any | null;
  selectedSeat: string | null;
  selectedSeatPrice: number;
  selectedSeatType: string;

  setDeparture: (loc: Location | null) => void;
  setArrival: (loc: Location | null) => void;
  setDepartureDate: (date: string) => void;
  setReturnDate: (date: string | null) => void;
  setTripType: (type: "One Way" | "Round Trip" | "Multi Way") => void;

  setHotelLocation: (loc: Location) => void;

  setCarPickupLocation: (loc: Location) => void;
  setCarPickupTime: (time: string) => void;
  setCarReturnTime: (time: string) => void;
  setActiveCategory: (category: string | null) => void;

  // Booking Actions
  setSelectedOffer: (offer: any) => void;
  setPassengerDetails: (details: any) => void;
  setSelectedSeat: (seat: string | null) => void;
  setSelectedSeatPrice: (price: number) => void;
  setSelectedSeatType: (type: string) => void;

  submitSearch: () => Promise<void>;
}

export const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

export const useSearchStore = create<SearchState>((set, get) => ({
  departure: null,
  arrival: null,
  departureDate: "",
  returnDate: null,
  tripType: "One Way",

  hotelLocation: airports[5], // Singapore
  carPickupLocation: airports[0], // Dubai
  carPickupTime: "10:00 AM",
  carReturnTime: "10:00 AM",
  activeCategory: null,

  // Real states initialized with safe session checks
  isSearching: false,
  searchError: null,
  offers: [],
  offerRequestId: null,
  selectedOffer: safeGetSession("selectedOffer", null),
  passengerDetails: safeGetSession("passengerDetails", null),
  selectedSeat: safeGetSession("selectedSeat", null),
  selectedSeatPrice: Number(safeGetSession("selectedSeatPrice", 0)),
  selectedSeatType: safeGetSession("selectedSeatType", "economy"),

  setDeparture: (departure) => set({ departure }),
  setArrival: (arrival) => set({ arrival }),
  setDepartureDate: (departureDate) => set({ departureDate }),
  setReturnDate: (returnDate) => set({ returnDate }),
  setTripType: (tripType) => set({ tripType }),

  setHotelLocation: (hotelLocation) => set({ hotelLocation }),
  setCarPickupLocation: (carPickupLocation) => set({ carPickupLocation }),
  setCarPickupTime: (carPickupTime) => set({ carPickupTime }),
  setCarReturnTime: (carReturnTime) => set({ carReturnTime }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  setSelectedOffer: (offer) => {
    set({ selectedOffer: offer });
    if (typeof window !== "undefined") {
      if (offer) {
        sessionStorage.setItem("selectedOffer", JSON.stringify(offer));
      } else {
        sessionStorage.removeItem("selectedOffer");
      }
    }
  },
  setPassengerDetails: (details) => {
    set({ passengerDetails: details });
    if (typeof window !== "undefined") {
      if (details) {
        sessionStorage.setItem("passengerDetails", JSON.stringify(details));
      } else {
        sessionStorage.removeItem("passengerDetails");
      }
    }
  },
  setSelectedSeat: (seat) => {
    set({ selectedSeat: seat });
    if (typeof window !== "undefined") {
      if (seat) {
        sessionStorage.setItem("selectedSeat", seat);
      } else {
        sessionStorage.removeItem("selectedSeat");
      }
    }
  },
  setSelectedSeatPrice: (price) => {
    set({ selectedSeatPrice: price });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedSeatPrice", String(price));
    }
  },
  setSelectedSeatType: (type) => {
    set({ selectedSeatType: type });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedSeatType", type);
    }
  },

  submitSearch: async () => {
    const state = get();
    if (state.activeCategory === "Flights") {
      set({ isSearching: true, searchError: null, offers: [], offerRequestId: null });
      try {
        const payload = {
          origin: state.departure?.code || "",
          destination: state.arrival?.code || "",
          departureDate: state.departureDate,
          ...(state.returnDate ? { returnDate: state.returnDate } : {}),
          passengers: [{ type: "adult" }],
          cabinClass: getStoredSeatingClass(),
        };
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/v1/flights/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.data) {
          set({
            offers: data.data.offers || [],
            offerRequestId: data.data.offerRequestId || null,
            isSearching: false,
          });
        } else {
          set({
            offers: [],
            offerRequestId: null,
            isSearching: false,
            searchError: data.error || "Flight search failed",
          });
        }
      } catch (err: any) {
        console.error("Flight Search API error:", err);
        set({
          offers: [],
          offerRequestId: null,
          isSearching: false,
          searchError: err.message || "Failed to contact search service",
        });
      }
    } else {
      // Dummy API call for non-flight categories
      try {
        await fetch("https://www.fake-url.com/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        });
      } catch (err) {
        console.error("Dummy API error:", err);
      }
    }
  },
}));

