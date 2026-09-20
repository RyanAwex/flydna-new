import { Icons } from "@/utils/icons";

export interface Facility {
  id: string;
  label: string;
  icon: keyof typeof Icons;
}
export interface RoomFeature {
  label: string;
  icon?: keyof typeof Icons;
}

export interface HotelData {
  id: string;
  name: string;
  address: string;
  ratingLabel: string;
  ratingScore: string;
  images: { main: string; thumbs: string[]; extraCount: number };
  facilities: Facility[];
  quickReserve: {
    title: string;
    roomType: string;
    guests: string;
    propertyType: string;
    bedType: string;
    perks: string[];
    policies: string[];
    priceInfo: {
      duration: string;
      oldPrice: string;
      newPrice: string;
      note: string;
    };
  };
  rooms: {
    id: string;
    type: string;
    recommended: string;
    leftCount: number;
    bed: string;
    features: RoomFeature[];
    amenities: string[];
    guests: number;
    pricing: {
      oldPrice: string;
      newPrice: string;
      discountBadge: string;
      note: string;
    };
    benefits: string[];
  }[];
}

export const hotelData: HotelData[] = [
  {
    id: "h1",
    name: "Reverb by Hard Rock Atlanta Downtown",
    address: "89 Centennial Olympic Park Dr NW, Atlanta, GA 30313",
    ratingLabel: "Excellent",
    ratingScore: "4.3/5",
    images: {
      main: "bg-[url('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center",
      thumbs: [
        "bg-[url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center",
        "bg-[url('https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center",
        "bg-[url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600')] bg-cover bg-center",
      ],
      extraCount: 12,
    },
    facilities: [
      { id: "f1", label: "Apartments", icon: "Building" },
      { id: "f2", label: "3 swimming pools", icon: "Pool" },
      { id: "f3", label: "Restaurant", icon: "Restaurant" },
      { id: "f4", label: "Free Wifi", icon: "Wifi" },
      { id: "f5", label: "Kitchen", icon: "Utensils" },
      { id: "f6", label: "Air conditioning", icon: "Wind" },
      { id: "f7", label: "Private bathroom", icon: "Bath" },
      { id: "f8", label: "Free on-site parking", icon: "Parking" },
      { id: "f9", label: "View", icon: "Eye" },
      { id: "f10", label: "Hot tub", icon: "Bath" },
    ],
    quickReserve: {
      title: "The privacy of your own apartment for 2 adults, 1 child",
      roomType: "1 x King Room",
      guests: "Price for: 2 adults, 1 child",
      propertyType: "Entire apartment",
      bedType: "1 king bed",
      perks: ["Free stay for your child"],
      policies: [
        "Free cancellation before February 28, 2026",
        "No prepayment needed pay at the property",
      ],
      priceInfo: {
        duration: "2 nights (2026-09-09 → 2026-09-11)",
        oldPrice: "USD 335",
        newPrice: "USD 291",
        note: "USD 145/night • taxes & fees included",
      },
    },
    rooms: [
      {
        id: "r1",
        type: "King Room",
        recommended: "Recommended for 2 adults",
        leftCount: 3,
        bed: "Bedroom 1: 1 king bed",
        features: [
          { label: "City view" },
          { label: "Air conditioning" },
          { label: "Free Wifi" },
          { label: "Flat-screen TV" },
          { label: "Attached bathroom" },
        ],
        amenities: [
          "Free toiletries",
          "Washing machine",
          "Kitchenette",
          "Wardrobe or closet",
          "Shower",
          "Hardwood floors",
          "Slippers",
          "Desk",
          "Sitting area",
          "TV",
          "Iron",
          "Coffee maker",
          "Hairdryer",
          "Towels",
        ],
        guests: 2,
        pricing: {
          oldPrice: "USD 335",
          newPrice: "USD 291",
          discountBadge: "Free cancellation",
          note: "Taxes & fees included",
        },
        benefits: [
          "Includes high-speed internet",
          "Free cancellation before February 28, 2026",
          "No prepayment needed – pay at the property",
          "No credit card needed",
          "Free stay for your child",
        ],
      },
      {
        id: "r2",
        type: "Two Queens Accessible Room",
        recommended: "Recommended for 4 guests",
        leftCount: 2,
        bed: "Bedroom 1: 2 queen beds",
        features: [
          { label: "City view" },
          { label: "Wheelchair accessible" },
          { label: "Air conditioning" },
          { label: "Free Wifi" },
        ],
        amenities: [
          "Free toiletries",
          "Washing machine",
          "Wardrobe",
          "Shower",
          "Desk",
          "TV",
          "Iron",
        ],
        guests: 4,
        pricing: {
          oldPrice: "USD 335",
          newPrice: "USD 291",
          discountBadge: "Free cancellation",
          note: "Taxes & fees included",
        },
        benefits: [
          "Includes high-speed internet",
          "Free cancellation before February 28, 2026",
          "No prepayment needed – pay at the property",
        ],
      },
    ],
  },
];
