export interface FilterItem {
  label: string;
  count: string | number;
  checked?: boolean;
}

export interface Property {
  id: number;
  title: string;
  location: string;
  rating: string;
  ratingLabel: string;
  roomType: string;
  size: string;
  beds: string;
  guests: string;
  amenities: string[];
  oldPrice: string;
  newPrice: string;
  image: string;
}

// --- Mock Data ---
export const properties: Property[] = [
  {
    id: 1,
    title: "Times Square Malaysia",
    location: "Kuala Lumpur • 4.4 km from center • Subway access",
    rating: "4.3/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "1 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "142",
    image: "/assets/hotel/1.png",
  },
  {
    id: 2,
    title: "Crown Suites Tropicana KLCC",
    location: "Kuala Lumpur • 1.3 km from center • Subway access",
    rating: "4.9/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "2 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "4,925",
    image: "/assets/hotel/2.png",
  },
  {
    id: 3,
    title: "Times Square Malaysia",
    location: "Kuala Lumpur • 4.4 km from center • Subway access",
    rating: "4.3/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "1 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "142",
    image: "/assets/hotel/1.png",
  },
  {
    id: 4,
    title: "Crown Suites Tropicana KLCC",
    location: "Kuala Lumpur • 1.3 km from center • Subway access",
    rating: "4.9/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "2 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "4,925",
    image: "/assets/hotel/2.png",
  },
  {
    id: 5,
    title: "Star Sky Park KLCC",
    location: "Kuala Lumpur • 3.2 km from center • Subway access",
    rating: "4.5/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "4 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "8,398",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 6,
    title: "Chambers Serviced Suites Kuala Lumpur",
    location: "Kuala Lumpur • 3.5 km from center • Subway access",
    rating: "4.4/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "2 beds",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "9,249",
    image: "/assets/hotel/4.png",
  },
  {
    id: 7,
    title: "Times Square Malaysia",
    location: "Kuala Lumpur • 4.4 km from center • Subway access",
    rating: "4.3/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "1 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "142",
    image: "/assets/hotel/3.png",
  },
  {
    id: 8,
    title: "Crown Suites Tropicana KLCC",
    location: "Kuala Lumpur • 1.3 km from center • Subway access",
    rating: "4.9/5",
    ratingLabel: "Excellent",
    roomType: "One-Bedroom Apartment",
    size: "57 m²",
    beds: "2 queen bed",
    guests: "2 adults, 1 child",
    amenities: [
      "Free airport taxi",
      "Free stay for child",
      "Free cancellation",
    ],
    oldPrice: "167",
    newPrice: "4,925",
    image: "/assets/hotel/4.png",
  },
];
