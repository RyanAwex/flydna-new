"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
  Check,
  SlidersHorizontal,
  Trash2,
  Minus,
  Plus,
  Sun,
  Moon,
} from "lucide-react";
import { products } from "@/data/products";
import Header from "@/components/shared/Header";
import { useHeaderNav } from "@/hooks/useHeaderNav";

interface Product {
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
  category?: string[];
  absoluteIndex?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const baseProducts: Product[] = products.map((p) => ({
  ...p,
  category: p.category || ["General"],
}));

const CARD_TOTAL = 304;
const ANGLE_PER_CARD = 20;
const RADIUS = 800;
const DESKTOP_VISIBLE_RANGE = 8;
const MOBILE_VISIBLE_RANGE = 3;

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0 } },
};

const topToBottomItem: any = {
  hidden: { opacity: 0, y: -40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

const layoutTransition: any = { type: "spring", stiffness: 350, damping: 35 };

const MENU_LINKS = [
  "Home",
  "Electronics",
  "Clothes",
  "Sneaker",
  "Chat-Scenes",
  "Activities",
  "About",
  "Contact",
];

const CardInnerContent = ({ item }: { item: Product }) => (
  <div className="flex flex-col h-full justify-end pointer-events-none select-none">
    <p className="text-xs font-semibold text-[var(--store-text-muted)]/60 uppercase tracking-widest mb-1">
      {item.brand}
    </p>
    <h2 className="text-lg font-bold text-[var(--store-text-main)] leading-tight mb-3">
      {item.name}
    </h2>
    <div className="flex justify-between items-end mt-auto">
      <p className="font-bold text-xl text-[var(--store-text-main)]">
        ${item.price}
      </p>
      <div className="flex items-center gap-1 text-sm text-[var(--store-text-muted)] font-medium">
        <Star className="w-4 h-4 fill-[#FDB241] text-[#FDB241]" />
        <span>{item.rating}</span>
      </div>
    </div>
  </div>
);

export default function App() {
  const { isDarkMode, toggleDarkMode, activeTab, handleActiveTabChange } =
    useHeaderNav("Store");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Cart States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragData = useRef({ isDown: false, startX: 0, isDragged: false });
  const filterRef = useRef<HTMLDivElement>(null);

  // Initialize Mobile check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync Cart items from local storage
  useEffect(() => {
    const syncCart = () => {
      try {
        const savedCart = localStorage.getItem("flydna_cart");
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCartItems((prevCart) => {
            if (JSON.stringify(parsed) !== JSON.stringify(prevCart)) {
              return parsed;
            }
            return prevCart;
          });
        } else {
          setCartItems((prevCart) => (prevCart.length > 0 ? [] : prevCart));
        }
      } catch (e) {
        console.error("Failed to read from localStorage", e);
      }
    };

    syncCart();
    window.addEventListener("cart-updated", syncCart);

    return () => {
      window.removeEventListener("cart-updated", syncCart);
    };
  }, []);

  // Update Local Storage when cart changes
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("flydna_cart");
      const savedCartStr = savedCart || "[]";
      const cartItemsStr = JSON.stringify(cartItems);
      if (savedCartStr !== cartItemsStr) {
        localStorage.setItem("flydna_cart", cartItemsStr);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
    0,
  );

  // Close filter on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

  const availableBrands = useMemo(
    () => Array.from(new Set(baseProducts.map((p) => p.brand))),
    [],
  );
  const availableCategories = useMemo(
    () => Array.from(new Set(baseProducts.flatMap((p) => p.category!))),
    [],
  );

  const filteredProducts = useMemo(() => {
    return baseProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const price = parseFloat(p.price);
      const matchesMin = minPrice === "" || price >= parseFloat(minPrice);
      const matchesMax = maxPrice === "" || price <= parseFloat(maxPrice);

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(p.brand);
      const matchesCat =
        selectedCategories.length === 0 ||
        p.category!.some((c) => selectedCategories.includes(c));

      return (
        matchesSearch && matchesMin && matchesMax && matchesBrand && matchesCat
      );
    });
  }, [searchQuery, minPrice, maxPrice, selectedBrands, selectedCategories]);

  const isFiltered = filteredProducts.length !== baseProducts.length;

  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, minPrice, maxPrice, selectedBrands, selectedCategories]);

  const visibleItems = useMemo(() => {
    if (filteredProducts.length === 0) return [];
    const items = [];
    const currentRange = isMobile
      ? MOBILE_VISIBLE_RANGE
      : DESKTOP_VISIBLE_RANGE;

    for (
      let i = currentIndex - currentRange;
      i <= currentIndex + currentRange;
      i++
    ) {
      if (isFiltered) {
        if (i >= 0 && i < filteredProducts.length) {
          items.push({ ...filteredProducts[i], uniqueId: i, absoluteIndex: i });
        }
      } else {
        const len = filteredProducts.length;
        const productIndex = ((i % len) + len) % len;
        items.push({
          ...filteredProducts[productIndex],
          uniqueId: i,
          absoluteIndex: i,
        });
      }
    }
    return items;
  }, [currentIndex, isMobile, filteredProducts, isFiltered]);

  const nextSlide = () => {
    if (isFiltered && currentIndex >= filteredProducts.length - 1) return;
    if (trackRef.current)
      trackRef.current.style.transition =
        "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)";
    setCurrentIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (isFiltered && currentIndex <= 0) return;
    if (trackRef.current)
      trackRef.current.style.transition =
        "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)";
    setCurrentIndex((prev) => prev - 1);
  };

  useEffect(() => {
    if (trackRef.current && !dragData.current.isDown) {
      trackRef.current.style.transform = `translateZ(${RADIUS}px) rotateY(${currentIndex * ANGLE_PER_CARD}deg)`;
    }
  }, [currentIndex, filteredProducts.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (filteredProducts.length === 0) return;
    dragData.current.isDown = true;
    dragData.current.isDragged = false;
    dragData.current.startX = e.clientX;
    if (trackRef.current) trackRef.current.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragData.current.isDown) return;
    const walk = e.clientX - dragData.current.startX;
    if (!dragData.current.isDragged) {
      if (Math.abs(walk) > 12) {
        dragData.current.isDragged = true;
        if (trackRef.current) trackRef.current.style.transition = "none";
      } else return;
    }
    const walkDeg = walk * (ANGLE_PER_CARD / CARD_TOTAL);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateZ(${RADIUS}px) rotateY(${currentIndex * ANGLE_PER_CARD - walkDeg}deg)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragData.current.isDown) return;
    dragData.current.isDown = false;
    if (!dragData.current.isDragged) {
      if (trackRef.current) trackRef.current.style.cursor = "grab";
      return;
    }
    if (trackRef.current) {
      trackRef.current.style.transition =
        "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)";
      trackRef.current.style.cursor = "grab";
    }

    const walk = e.clientX - dragData.current.startX;
    let moveCount = Math.round(-walk / CARD_TOTAL);
    if (moveCount === 0 && Math.abs(walk) > 50) moveCount = walk > 0 ? -1 : 1;

    let targetIndex = currentIndex + moveCount;
    if (isFiltered)
      targetIndex = Math.max(
        0,
        Math.min(filteredProducts.length - 1, targetIndex),
      );
    setCurrentIndex(targetIndex);
  };

  const handleCardPointerUp = (item: Product, absoluteIndex: number) => {
    if (dragData.current.isDragged) return;
    if (absoluteIndex !== currentIndex) {
      setCurrentIndex(absoluteIndex);
      return;
    }
    setSelectedItem(item);
    setAddedToCart(false);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === selectedItem.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === selectedItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { product: selectedItem, quantity: 1 }];
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedBrands([]);
    setSelectedCategories([]);
    setIsFilterOpen(false);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  return (
    <div
      className={`h-screen w-full font-sans text-[var(--store-text-main)] bg-[var(--store-bg-main)] flex flex-col overflow-hidden ${isDarkMode ? "dark" : ""}`}
    >
      <Header
        isDarkMode={isDarkMode}
        onThemeToggle={toggleDarkMode}
        activeTab={activeTab}
        setActiveTab={handleActiveTabChange}
      />
      {/* Hidden Image Preloader */}
      <div className="absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0 select-none z-[-1]">
        {baseProducts.map((p) => (
          <img key={`preload-${p.id}`} src={p.image} alt="preload shadow" />
        ))}
      </div>

      <Header
        isDarkMode={isDarkMode}
        onThemeToggle={toggleDarkMode}
        activeTab={activeTab}
        setActiveTab={handleActiveTabChange}
      />

      {/* Search and Filters Bar */}
      <div
        ref={filterRef}
        className="w-full max-w-3xl mx-auto px-6 py-4 mt-20 md:mt-24 flex flex-col md:flex-row gap-4 relative z-[40]"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--store-text-muted)]/80" />
          <input
            type="text"
            placeholder="Search products, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--store-bg-surface)] border border-[rgba(var(--store-accent-rgb),0.4)] rounded-2xl outline-none focus:border-[var(--store-accent)]/80 transition-colors text-sm text-[var(--store-text-main)] placeholder-[var(--store-text-muted)]/75"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border transition-all ${
            isFilterOpen ||
            selectedBrands.length > 0 ||
            selectedCategories.length > 0 ||
            searchQuery ||
            minPrice ||
            maxPrice
              ? "bg-[var(--store-accent)]/20 border-[var(--store-accent)]/55 text-[var(--store-text-main)] font-bold"
              : "bg-[var(--store-bg-surface)] border-[rgba(var(--store-accent-rgb),0.4)] text-[var(--store-text-muted)] hover:text-[var(--store-text-main)]"
          } hover:border-[var(--store-accent)]/70`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-sm font-semibold">Filter</span>
        </button>

        {/* Filter Dropdown Options */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[110%] left-6 right-6 md:left-auto md:right-0 md:w-80 p-6 bg-[var(--store-bg-secondary)] border border-[rgba(var(--store-accent-rgb),0.45)] shadow-[0_10px_40px_rgba(0,0,0,0.6)] rounded-2xl z-[70] flex flex-col gap-6"
            >
              <div>
                <h3 className="text-xs font-black text-[var(--store-text-main)]/80 uppercase tracking-widest mb-3">
                  Price Range
                </h3>
                <div className="flex gap-3">
                  <div className="relative flex items-stretch w-full bg-[var(--store-bg-surface-dark)] border border-[rgba(var(--store-accent-rgb),0.3)] rounded-xl overflow-hidden focus-within:border-[var(--store-accent)]/80 focus-within:shadow-[0_0_15px_var(--accent-rgb,0.2)] transition-all">
                    <button
                      onClick={() =>
                        setMinPrice((prev) =>
                          Math.max(0, parseFloat(prev || "0") - 50).toString(),
                        )
                      }
                      className="flex items-center justify-center px-3 text-[var(--store-text-muted)]/90 hover:text-[var(--store-text-main)] hover:bg-[var(--store-accent)]/20 active:bg-[var(--store-accent)]/40 transition-colors border-r border-[rgba(var(--store-accent-rgb),0.2)] cursor-pointer flex-shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      placeholder="Min $"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full px-1 py-2 text-sm text-center outline-none bg-transparent hide-spinners text-[var(--store-text-main)] placeholder-[var(--store-text-muted)]/75 font-semibold"
                    />
                    <button
                      onClick={() =>
                        setMinPrice((prev) =>
                          (parseFloat(prev || "0") + 50).toString(),
                        )
                      }
                      className="flex items-center justify-center px-3 text-[var(--store-text-muted)]/90 hover:text-[var(--store-text-main)] hover:bg-[var(--store-accent)]/20 active:bg-[var(--store-accent)]/40 transition-colors border-l border-[rgba(var(--store-accent-rgb),0.2)] cursor-pointer flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative flex items-stretch w-full bg-[var(--store-bg-surface-dark)] border border-[rgba(var(--store-accent-rgb),0.3)] rounded-xl overflow-hidden focus-within:border-[var(--store-accent)]/80 focus-within:shadow-[0_0_15px_var(--accent-rgb,0.2)] transition-all">
                    <button
                      onClick={() =>
                        setMaxPrice((prev) =>
                          Math.max(0, parseFloat(prev || "0") - 50).toString(),
                        )
                      }
                      className="flex items-center justify-center px-3 text-[var(--store-text-muted)]/90 hover:text-[var(--store-text-main)] hover:bg-[var(--store-accent)]/20 active:bg-[var(--store-accent)]/40 transition-colors border-r border-[rgba(var(--store-accent-rgb),0.2)] cursor-pointer flex-shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      placeholder="Max $"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full px-1 py-2 text-sm text-center outline-none bg-transparent hide-spinners text-[var(--store-text-main)] placeholder-[var(--store-text-muted)]/75 font-semibold"
                    />
                    <button
                      onClick={() =>
                        setMaxPrice((prev) =>
                          (parseFloat(prev || "0") + 50).toString(),
                        )
                      }
                      className="flex items-center justify-center px-3 text-[var(--store-text-muted)]/90 hover:text-[var(--store-text-main)] hover:bg-[var(--store-accent)]/20 active:bg-[var(--store-accent)]/40 transition-colors border-l border-[rgba(var(--store-accent-rgb),0.2)] cursor-pointer flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-[var(--store-text-main)]/80 uppercase tracking-widest mb-3">
                  Brands
                </h3>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                        selectedBrands.includes(brand)
                          ? "bg-[var(--store-accent)] border-[var(--store-accent)] text-white"
                          : "bg-transparent border-[rgba(var(--store-accent-rgb),0.4)] text-[var(--store-text-muted)] hover:text-[var(--store-text-main)] hover:border-[var(--store-accent)]/50"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-[var(--store-text-main)]/80 uppercase tracking-widest mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                        selectedCategories.includes(cat)
                          ? "bg-[var(--store-accent)] border-[var(--store-accent)] text-white"
                          : "bg-transparent border-[rgba(var(--store-accent-rgb),0.4)] text-[var(--store-text-muted)] hover:text-[var(--store-text-main)] hover:border-[var(--store-accent)]/50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={clearFilters}
                className="mt-2 text-sm font-bold text-red-400 hover:text-red-300 py-2 border border-red-500/20 rounded-xl bg-red-500/5 transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Carousel Main Viewport */}
      <div className="flex-1 relative w-full touch-none overflow-hidden flex items-center justify-center z-10">
        {filteredProducts.length === 0 ? (
          <div className="text-center text-[var(--store-text-muted)]/50 p-8">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No products match your filters.</p>
          </div>
        ) : (
          <>
            <div
              className="w-full h-full relative"
              style={{ perspective: "2000px" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Spinning 3D Track */}
              <div
                ref={trackRef}
                // Updated top position to perfectly balance cards between filter and bottom
                className="absolute left-1/2 top-[45%] w-0 h-0 transition-transform duration-500 ease-out select-none"
                style={{
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                }}
              >
                {visibleItems.map((item) => {
                  const isCentered = item.absoluteIndex === currentIndex;
                  const zTranslate = isCentered ? RADIUS - 60 : RADIUS;
                  const isSelected = selectedItem?.uniqueId === item.uniqueId;

                  return (
                    <div
                      key={item.uniqueId}
                      className="absolute"
                      style={{
                        transform: `translate(-50%, -50%) rotateY(${-item.absoluteIndex! * ANGLE_PER_CARD}deg) translateZ(-${zTranslate}px)`,
                        backfaceVisibility: "hidden",
                        transition:
                          "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {/* Individual 3D Card Container */}
                      <motion.div
                        onPointerUp={() =>
                          handleCardPointerUp(item, item.absoluteIndex!)
                        }
                        animate={{
                          opacity: isCentered ? 1 : isMobile ? 0.3 : 0.5,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{ willChange: "opacity" }}
                        className={`relative group cursor-pointer ${
                          isSelected ? "invisible" : "visible"
                        } ${isCentered ? "z-10" : ""}`}
                      >
                        <motion.div
                          layoutId={`card-bg-${item.uniqueId}`}
                          transition={layoutTransition}
                          style={{ willChange: "transform" }}
                          className={`w-[270px] h-[340px] rounded-2xl p-6 flex flex-col relative transition-colors duration-500 ease-out max-md:!backdrop-blur-none ${
                            isCentered
                              ? "glass-card-strong glow-store max-md:shadow-none max-md:bg-[var(--store-bg-secondary)]"
                              : "glass-card max-md:bg-[var(--store-bg-main)]"
                          }`}
                        >
                          <div className="w-full h-[150px] mb-4 relative flex items-center justify-center pointer-events-none">
                            <motion.img
                              draggable={false}
                              layoutId={`card-img-${item.uniqueId}`}
                              transition={layoutTransition}
                              style={{
                                willChange: "transform",
                                borderRadius: "16px",
                              }}
                              src={item.image}
                              alt={item.name}
                              className="w-[150px] h-[150px] object-cover shadow-xl max-md:shadow-md shadow-black/40"
                            />
                          </div>
                          <div className="flex-1">
                            <CardInnerContent item={item} />
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Swipe Buttons */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 translate-y-[200px] flex items-center justify-center gap-6 z-[40] pointer-events-none">
              <button
                onClick={prevSlide}
                disabled={isFiltered && currentIndex <= 0}
                className="p-3 rounded-full bg-[var(--store-bg-main)]/80 backdrop-blur-md border border-[rgba(var(--store-accent-rgb),0.2)] hover:border-[var(--store-accent)]/80 hover:bg-[var(--store-accent)]/20 hover:shadow-[0_0_15px_var(--accent-rgb,0.4)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                disabled={
                  isFiltered && currentIndex >= filteredProducts.length - 1
                }
                className="p-3 rounded-full bg-[var(--store-bg-main)]/80 backdrop-blur-md border border-[rgba(var(--store-accent-rgb),0.2)] hover:border-[var(--store-accent)]/80 hover:bg-[var(--store-accent)]/20 hover:shadow-[0_0_15px_var(--accent-rgb,0.4)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Product Details Modal Overlay */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              onClick={() => setSelectedItem(null)}
              style={{ willChange: "opacity" }}
              className="fixed inset-0 z-[100] bg-[var(--store-bg-main)]/60 backdrop-blur-md max-md:!backdrop-blur-none max-md:bg-[var(--store-bg-main)] cursor-pointer"
            />

            <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
              <motion.div
                layoutId={`card-bg-${selectedItem.uniqueId}`}
                transition={layoutTransition}
                style={{ willChange: "transform" }}
                className="absolute bottom-0 right-0 md:bottom-0 md:right-0 w-full h-full md:max-w-6xl md:h-[calc(100vh-7.5rem)] md:max-h-[769px] min-[2000px]:max-w-[1700px] min-[2000px]:max-h-[85vh] bg-[var(--store-bg-main)]/95 shadow-2xl max-md:shadow-none rounded-none md:rounded-tl-3xl border border-[rgba(var(--store-accent-rgb),0.2)] flex flex-col md:flex-row overflow-hidden pointer-events-auto max-md:!backdrop-blur-none max-md:bg-[var(--store-bg-main)]"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-50 p-2 text-[var(--store-text-muted)]/60 hover:text-white bg-white/10 rounded-full cursor-pointer hover:bg-white/20 hover:shadow-[0_0_20px_var(--accent-rgb,0.4)] transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="w-full md:w-1/2 h-[40%] md:h-full flex items-center justify-center relative">
                  <motion.img
                    draggable={false}
                    layoutId={`card-img-${selectedItem.uniqueId}`}
                    transition={layoutTransition}
                    style={{ willChange: "transform", borderRadius: "16px" }}
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-[240px] h-[240px] md:w-[320px] md:h-[320px] min-[2000px]:w-[500px] min-[2000px]:h-[500px] object-cover shadow-2xl max-md:shadow-lg shadow-black/50 z-10"
                  />
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="w-full md:w-1/2 h-[60%] md:h-full bg-[var(--store-bg-surface)] max-md:bg-[var(--store-bg-main)] border-t md:border-t-0 md:border-l border-[rgba(var(--store-accent-rgb),0.15)] p-6 md:p-10 min-[2000px]:p-16 flex flex-col overflow-y-auto custom-scrollbar"
                >
                  <motion.h2
                    variants={topToBottomItem}
                    className="text-3xl md:text-4xl min-[2000px]:text-6xl font-extrabold mb-2 min-[2000px]:mb-4"
                  >
                    {selectedItem.name}
                  </motion.h2>
                  <motion.p
                    variants={topToBottomItem}
                    className="text-2xl min-[2000px]:text-4xl font-bold mb-6 min-[2000px]:mb-8"
                  >
                    ${selectedItem.price}
                  </motion.p>

                  <motion.div
                    variants={topToBottomItem}
                    className="flex items-center gap-2 text-sm min-[2000px]:text-lg text-[var(--store-text-muted)] font-semibold mb-4 min-[2000px]:mb-6"
                  >
                    <Star className="w-4 h-4 fill-[#FDB241] text-[#FDB241]" />
                    {selectedItem.rating} ({" "}
                    <span className="text-[var(--store-text-muted)]/50 font-normal">
                      {selectedItem.reviews} reviews
                    </span>
                    )
                  </motion.div>

                  <motion.p
                    variants={topToBottomItem}
                    className="text-[var(--store-text-muted)]/70 text-sm min-[2000px]:text-lg mb-8 min-[2000px]:mb-12"
                  >
                    {selectedItem.desc}
                  </motion.p>

                  <motion.h3
                    variants={topToBottomItem}
                    className="text-xs min-[2000px]:text-sm font-bold text-[var(--store-text-muted)]/40 uppercase tracking-wider mb-3"
                  >
                    Key Features
                  </motion.h3>
                  <motion.ul
                    variants={topToBottomItem}
                    className="space-y-2 min-[2000px]:space-y-4 text-sm min-[2000px]:text-lg text-[var(--store-text-main)]/80 mb-8 min-[2000px]:mb-12"
                  >
                    {selectedItem.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[var(--store-accent)]" />{" "}
                        {feature}
                      </li>
                    ))}
                  </motion.ul>

                  <motion.button
                    variants={topToBottomItem}
                    onClick={handleAddToCart}
                    className="mt-auto h-12 min-[2000px]:h-18 rounded-2xl font-bold flex items-center justify-center gap-2 bg-[var(--store-accent)] hover:bg-[var(--store-accent-hover)] hover:shadow-[0_0_20px_var(--accent-rgb,0.4)] min-[2000px]:text-xl transition-all duration-300 cursor-pointer shrink-0"
                  >
                    {addedToCart ? "Added!" : "Add to Cart"}
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
