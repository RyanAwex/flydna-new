export interface Product {
  id: number;
  uniqueId: number;
  name: string;
  brand: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  desc: string;
  features: string[];
  sizes: string[];
  category: string[];
}

export const products: Product[] = [
  {
    id: 1,
    uniqueId: 1,
    name: "Nike Air Max 270",
    brand: "Nike",
    price: "160.00",
    rating: 4.8,
    reviews: 1245,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    desc: "Experience premium comfort with the Nike Air Max 270. It features a large, visible Max Air unit for plush cushioning and a lightweight, woven synthetic upper for optimal breathability and everyday wear.",
    features: [
      "Max Air Unit",
      "Breathable Mesh Upper",
      "Foam Midsole",
      "Rubber Outsole Traction",
    ],
    sizes: ["8", "9", "10", "11", "12"],
    category: ["Footwear", "Men's Fashion", "Sneakers", "Athletic"],
  },
  {
    id: 2,
    uniqueId: 2,
    name: "Sony WH-1000XM4",
    brand: "Sony",
    price: "298.00",
    rating: 4.9,
    reviews: 8920,
    image:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80",
    desc: "Discover acoustic brilliance with industry-leading active noise cancellation. These premium wireless headphones offer up to 30 hours of battery life, multipoint connection, and intuitive touch controls for a seamless listening experience.",
    features: [
      "Active Noise Cancelling",
      "30-Hour Battery",
      "Hi-Res Audio",
      "Multipoint Bluetooth",
    ],
    sizes: ["Standard"],
    category: [
      "Electronics",
      "Audio",
      "Wireless Headphones",
      "Tech Accessories",
    ],
  },
  {
    id: 3,
    uniqueId: 3,
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    price: "799.00",
    rating: 4.8,
    reviews: 4500,
    image:
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80",
    desc: "The ultimate sports watch for extreme conditions. Crafted from aerospace-grade titanium, it boasts a remarkably bright display, precision dual-frequency GPS, and up to 36 hours of battery life for intensive training.",
    features: [
      "Precision GPS",
      "ECG App",
      "100m Water Resistant",
      "Titanium Case",
    ],
    sizes: ["49mm"],
    category: ["Wearables", "Electronics", "Smartwatches", "Fitness"],
  },
  {
    id: 4,
    uniqueId: 4,
    name: "Hydro Flask 32 oz Wide Mouth",
    brand: "Hydro Flask",
    price: "44.95",
    rating: 4.7,
    reviews: 3100,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    desc: "Keep your beverages ice-cold for 24 hours or piping hot for up to 12 hours. Constructed with pro-grade stainless steel and TempShield double-wall vacuum insulation, it is your perfect daily hydration companion.",
    features: [
      "TempShield Insulation",
      "BPA-Free",
      "Pro-Grade Stainless Steel",
      "Dishwasher Safe",
    ],
    sizes: ["32oz", "40oz"],
    category: ["Outdoors", "Accessories", "Drinkware", "Camping"],
  },
  {
    id: 5,
    uniqueId: 5,
    name: "Fujifilm X100V Camera",
    brand: "Fujifilm",
    price: "1399.00",
    rating: 4.9,
    reviews: 1250,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    desc: "A premium compact camera blending classic design with modern technology. It features a high-resolution 26.1MP X-Trans CMOS 4 sensor, an advanced hybrid viewfinder, and weather resistance for professional street photography.",
    features: [
      "26.1MP APS-C Sensor",
      "Hybrid Viewfinder",
      "4K Video Recording",
      "Weather Resistant",
    ],
    sizes: ["Standard"],
    category: [
      "Electronics",
      "Photography",
      "Digital Cameras",
      "Creative Tools",
    ],
  },
  {
    id: 6,
    uniqueId: 6,
    name: "Ray-Ban Original Wayfarer",
    brand: "Ray-Ban",
    price: "163.00",
    rating: 4.6,
    reviews: 2100,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    desc: "The most recognizable style in the history of sunglasses. The Original Wayfarer features a durable acetate frame and polarized green classic G-15 lenses, delivering superior visual clarity and 100% UV protection.",
    features: [
      "100% UV Protection",
      "Polarized G-15 Lenses",
      "Acetate Frame",
      "Classic Square Shape",
    ],
    sizes: ["Standard", "Large"],
    category: ["Accessories", "Fashion", "Sunglasses", "Eyewear"],
  },
  {
    id: 7,
    uniqueId: 7,
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    price: "99.99",
    rating: 4.8,
    reviews: 5400,
    image:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    desc: "An advanced wireless productivity mouse engineered for precision and comfort. It features an 8K DPI track-anywhere sensor, highly tactile quiet clicks, and an ergonomic silhouette designed to support your hand for hours.",
    features: [
      "8K DPI Sensor",
      "MagSpeed Scrolling",
      "Quiet Clicks",
      "Multi-Device Pairing",
    ],
    sizes: ["Standard"],
    category: ["Electronics", "Computer Accessories", "Peripherals", "Office"],
  },
  {
    id: 8,
    uniqueId: 8,
    name: "YETI Rambler 14 oz Mug",
    brand: "YETI",
    price: "30.00",
    rating: 4.8,
    reviews: 4200,
    image:
      "https://media.istockphoto.com/id/1370390381/photo/steel-thermo-tumbler-mockup-isolated-on-white-background-with-clipping-path.webp?a=1&b=1&s=612x612&w=0&k=20&c=0b8OqmzQ4c8MKxGeLaBiIRpd0GIqcp0MniUICw5a8N8=",
    desc: "The toughest, most over-engineered camp mug available. It is double-wall vacuum insulated to keep your coffee hot or chili warm, featuring a standard MagSlider lid to protect your beverages from splashing.",
    features: [
      "Double-Wall Vacuum Insulation",
      "MagSlider Lid",
      "18/8 Stainless Steel",
      "No Sweat Design",
    ],
    sizes: ["14oz", "24oz"],
    category: ["Home & Kitchen", "Outdoors", "Drinkware", "Camping"],
  },
  {
    id: 9,
    uniqueId: 9,
    name: "Marshall Emberton II",
    brand: "Marshall",
    price: "169.99",
    rating: 4.7,
    reviews: 1850,
    image:
      "https://images.unsplash.com/photo-1585298723682-7115561c51b7?auto=format&fit=crop&w=800&q=80",
    desc: "A compact portable Bluetooth speaker delivering loud, vibrant sound. Enjoy over 30 hours of portable playtime and true stereophonic 360-degree audio in a highly rugged, IP67 water-resistant design.",
    features: [
      "30+ Hours Playtime",
      "True Stereophonic Sound",
      "IP67 Dust & Water Resistant",
      "Bluetooth 5.1",
    ],
    sizes: ["Standard"],
    category: ["Electronics", "Audio", "Portable Speakers", "Wireless"],
  },
  {
    id: 10,
    uniqueId: 10,
    name: "Vans Old Skool Classic",
    brand: "Vans",
    price: "70.00",
    rating: 4.7,
    reviews: 6300,
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
    desc: "The iconic low-top skate shoe that started it all. Crafted with durable suede and canvas uppers, it features reinforced toe caps for durability and signature rubber waffle outsoles for exceptional board grip.",
    features: [
      "Suede/Canvas Upper",
      "Reinforced Toe Caps",
      "Padded Collars",
      "Rubber Waffle Outsole",
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: ["Footwear", "Unisex Fashion", "Sneakers", "Skateboarding"],
  },
];
