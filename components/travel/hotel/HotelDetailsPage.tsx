"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MapPin, X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Icons } from "@/utils/icons";
import { hotelData, Facility, HotelData } from "@/utils/mock-data/hotel-data";

// --- Sub Components ---

const HotelHeader = ({ hotel }: { hotel: HotelData & { rawImages?: string[]; lat?: number; lng?: number } }) => {
  const allImages: string[] = hotel.rawImages && hotel.rawImages.length > 0 
    ? hotel.rawImages 
    : (hotel.images as any).thumbUrls && (hotel.images as any).thumbUrls.length > 0
      ? [(hotel.images as any).mainUrl, ...(hotel.images as any).thumbUrls].filter(Boolean)
      : ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"];

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const currentHeroUrl = allImages[activeImgIndex] || allImages[0];
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
  const lat = hotel.lat || 33.7490;
  const lng = hotel.lng || -84.3880;

  const staticMapUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+38bdf8(${lng},${lat})/${lng},${lat},14,0/600x400@2x?access_token=${mapboxToken}`
    : null;

  return (
    <>
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center z-10">
            <span className="text-white font-medium text-sm">
              Photo {activeImgIndex + 1} of {allImages.length} — {hotel.name}
            </span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={allImages[activeImgIndex]}
              alt={hotel.name}
              className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
            />
            {allImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                  className="absolute left-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImgIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-4 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto py-2 justify-center max-w-4xl mx-auto scrollbar-none">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImgIndex === idx ? "border-[var(--accent-primary)] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-[var(--glass-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-main)]">{hotel.name}</h3>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {hotel.address}
                </p>
              </div>
              <button
                onClick={() => setIsMapModalOpen(false)}
                className="p-2 rounded-full hover:bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 min-h-[500px]">
              <iframe
                title="Full Interactive Hotel Location Map"
                width="100%"
                height="100%"
                className="w-full h-full min-h-[500px] border-0"
                style={{ filter: "invert(90%) hue-rotate(180deg) contrast(120%) brightness(85%)" }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 z-20">
        {/* Left Gallery */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden group">
            <img
              src={currentHeroUrl}
              alt={hotel.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white text-xs px-3.5 py-2 rounded-full backdrop-blur-md flex items-center gap-1.5 transition-all cursor-pointer border border-white/20"
            >
              <Maximize2 className="w-3.5 h-3.5" /> Expand Gallery
            </button>
          </div>

          {/* Interactive Scrollable Thumbnail Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {allImages.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`relative w-28 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activeImgIndex === idx
                    ? "border-[var(--accent-primary)] shadow-[var(--glow-primary)] scale-105"
                    : "border-transparent opacity-75 hover:opacity-100 hover:scale-102"
                }`}
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                {idx === 3 && allImages.length > 4 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute inset-0 bg-black/60 hover:bg-black/75 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <span className="text-[var(--text-main)] font-bold text-xs">
                      +{allImages.length - 4} photos
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Interactive Dark-Mode Map Card */}
        <div className="bg-[var(--surface-color)] rounded-2xl p-3 flex flex-col relative overflow-hidden group border border-[var(--glass-border)] shadow-xl min-h-[380px]">
          <iframe
            title="Interactive Hotel Map"
            width="100%"
            height="100%"
            className="absolute inset-0 w-full h-full border-0 rounded-2xl opacity-85 group-hover:opacity-100 transition-all duration-300"
            style={{ filter: "invert(90%) hue-rotate(180deg) contrast(120%) brightness(85%)" }}
            loading="lazy"
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-color)] via-[var(--surface-color)]/40 to-transparent pointer-events-none" />

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto">
            <button
              onClick={() => setIsMapModalOpen(true)}
              className="bg-[var(--accent-primary)]/90 text-[var(--text-main)] px-5 py-2 rounded-full hover:bg-[var(--accent-primary)] hover:shadow-[var(--glow-primary)] transition-all shadow-xl font-medium cursor-pointer flex items-center gap-1.5 text-xs backdrop-blur-md border border-white/10 hover:scale-105"
            >
              <MapPin className="w-3.5 h-3.5" /> Expand Map
            </button>
          </div>

          {/* Compact Sleek Info Card */}
          <div className="relative z-10 mt-auto bg-[var(--surface-color)]/95 backdrop-blur-xl p-3 rounded-xl border border-[var(--glass-border)] shadow-xl">
            <h1 className="text-sm font-bold text-[var(--text-main)] truncate mb-0.5">
              {hotel.name}
            </h1>
            <p className="text-[var(--text-muted)] text-[11px] flex items-center gap-1 truncate mb-2">
              <MapPin className="w-3 h-3 shrink-0 text-[var(--accent-primary)]" />
              <span className="truncate">{hotel.address}</span>
            </p>
            <div className="flex items-center justify-between pt-1.5 border-t border-[var(--glass-border)] text-[11px]">
              <span className="font-medium text-[var(--text-main)]">
                Very Good
              </span>
              <div className="flex items-center gap-1 font-semibold">
                <Icons.Star />
                <span className="text-orange-400">{hotel.ratingScore || "4.3"}</span>
                <span className="text-[var(--text-muted)] text-[10px]">
                  {hotel.ratingLabel || "Excellent"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const HotelFacilities = ({ facilities }: { facilities: Facility[] }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
    {facilities.map((fac) => {
      const IconComp = Icons[fac.icon];
      return (
        <div
          key={fac.id}
          className="bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-2xl p-4 flex items-center gap-4 hover:bg-[var(--surface-color)]/95 transition-colors cursor-default"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--surface-color)]/90 flex items-center justify-center text-[var(--text-muted)] shrink-0">
            {IconComp && <IconComp isOpen={false} />}
          </div>
          <span className="text-sm text-[var(--text-main)] font-medium">
            {fac.label}
          </span>
        </div>
      );
    })}
  </div>
);

const HotelQuickReserve = ({
  data,
  onReserve,
  isPrebooking,
}: {
  data: HotelData["quickReserve"];
  onReserve?: () => void;
  isPrebooking?: boolean;
}) => (
  <div className="mb-8">
    <h3 className="text-xl font-medium text-[var(--text-main)] mb-4 border-b border-[var(--glass-border)] pb-5">
      {data.title}
    </h3>

    <div className="rounded-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-700">
      {/* Left Details */}
      <div className="p-6 md:w-2/3 flex flex-col gap-4 rounded-l-2xl border border-[var(--glass-border)] w-auto bg-[var(--surface-color)]/50">
        <p className="text-[var(--text-main)] font-semibold text-lg hover:text-[var(--accent-primary)] cursor-pointer transition-colors">
          {data.roomType}
        </p>
        <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
          {data.guests}
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <Icons.Home /> {data.propertyType}
          </p>
          <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
            <Icons.Bed /> {data.bedType}
          </p>
        </div>

        {data.perks.length > 0 && (
          <div className="mt-2">
            <p className="font-bold text-[var(--text-main)] mb-2">
              {data.perks[0]}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {data.policies.map((policy, idx) => (
            <p
              key={idx}
              className="text-sm text-[var(--text-muted)] flex items-start gap-2"
            >
              <span className="mt-0.5 text-emerald-400">
                <Icons.Check />
              </span>{" "}
              {policy}
            </p>
          ))}
        </div>
      </div>

      {/* Right Pricing */}
      <div className="p-6 md:w-1/3 flex flex-col justify-between rounded-r-2xl border border-[var(--glass-border)] w-auto bg-[var(--surface-color)]/70">
        <div>
          <p className="text-[var(--text-muted)] text-md mb-4 font-medium">
            {data.priceInfo.duration}
          </p>
          <div className="flex gap-4 items-center justify-baseline">
            {data.priceInfo.oldPrice && (
              <p className="text-[var(--text-muted)] line-through text-sm mb-1">
                {data.priceInfo.oldPrice}
              </p>
            )}
            <p className="text-3xl font-extrabold text-[var(--text-main)] mb-2">
              {data.priceInfo.newPrice}
            </p>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {data.priceInfo.note}
          </p>
        </div>
        <button
          onClick={() => onReserve?.()}
          disabled={isPrebooking}
          className="w-full bg-[var(--accent-primary)] text-[var(--text-main)] py-3.5 rounded-full hover:opacity-90 hover:shadow-[var(--glow-primary)] transition-all font-semibold cursor-pointer disabled:opacity-50"
        >
          {isPrebooking ? "Initializing Prebook..." : "Reserve"}
        </button>
      </div>
    </div>
  </div>
);

const HotelRoomTable = ({
  rooms,
  onReserve,
  isPrebooking,
}: {
  rooms: HotelData["rooms"];
  onReserve?: (type: string, price: string) => void;
  isPrebooking?: boolean;
}) => {
  return (
    <div className="bg-[var(--surface-color)] rounded-2xl overflow-x-auto border border-[var(--glass-border)] shadow-xl">
      <table className="w-full text-left min-w-[900px]">
        <thead className="border-b border-[var(--glass-border)] bg-[var(--surface-color)]/95">
          <tr>
            <th className="p-4 font-semibold text-[var(--text-main)] w-[40%]">
              Room type
            </th>
            <th className="p-4 font-semibold text-[var(--text-main)] text-center w-[10%]">
              Number of
              <br />
              guests
            </th>
            <th className="p-4 font-semibold text-[var(--text-main)] w-[15%]">
              Rate per Stay
            </th>
            <th className="p-4 font-semibold text-[var(--text-main)] w-[20%]">
              Rate Details & Policies
            </th>
            <th className="p-4 font-semibold text-[var(--text-main)] w-[10%] text-center">
              Select
            </th>
            <th className="p-4 font-semibold text-[var(--text-main)] w-[10%] text-center">
              Your choices
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rooms.map((room) => (
            <tr key={room.id} className="align-top hover:bg-[var(--glass-bg)]/50 transition-colors">
              {/* Room Type Column */}
              <td className="p-6 border-r border-[var(--glass-border)]">
                <h4 className="text-lg font-bold text-[var(--text-main)] mb-2">
                  {room.type}
                </h4>
                <span className="inline-block bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 text-[11px] px-2.5 py-1 rounded-md font-medium mb-4">
                  {room.recommended}
                </span>

                <p className="text-red-400 text-xs font-semibold mb-4">
                  We have {room.leftCount} left
                </p>

                {/* Features Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {room.features.map((feat, i) => (
                    <span
                      key={i}
                      className="bg-[var(--surface-color)] border border-[var(--glass-border)] rounded-md px-3 py-1.5 text-xs text-[var(--text-muted)] flex items-center gap-1.5"
                    >
                      {feat.label}
                    </span>
                  ))}
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {room.amenities.map((amenity, i) => (
                    <p
                      key={i}
                      className="text-xs text-[var(--text-muted)] flex items-start gap-2"
                    >
                      <span className="mt-0.5 text-emerald-400">
                        <Icons.Check />
                      </span>{" "}
                      {amenity}
                    </p>
                  ))}
                </div>
              </td>

              {/* Guests Column */}
              <td className="p-6 border-r border-[var(--glass-border)] text-center">
                <div className="flex items-center justify-center gap-1 text-[var(--text-muted)] font-medium text-sm">
                  <Icons.Users /> + <Icons.Users />
                </div>
              </td>

              {/* Price Column */}
              <td className="p-6 border-r border-[var(--glass-border)]">
                {room.pricing.oldPrice && (
                  <p className="text-[var(--text-muted)] line-through text-xs mb-1">
                    {room.pricing.oldPrice}
                  </p>
                )}
                <p className="text-2xl font-extrabold text-[var(--text-main)] mb-3">
                  {room.pricing.newPrice}
                </p>
                <p className="text-xs text-[var(--text-muted)] mb-4 pr-4">
                  {room.pricing.note}
                </p>
                <span className="inline-block bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1.5 rounded-md border border-emerald-500/20 font-medium">
                  {room.pricing.discountBadge}
                </span>
              </td>

              {/* Rate Details / Benefits Column */}
              <td className="p-6 border-r border-[var(--glass-border)]">
                <div className="flex flex-col gap-3">
                  {room.benefits.map((benefit, i) => (
                    <p
                      key={i}
                      className={`text-xs flex items-start gap-2 ${benefit.includes("left") ? "text-red-400 font-semibold" : "text-[var(--text-muted)]"}`}
                    >
                      {!benefit.includes("left") && (
                        <span className="mt-0.5 text-emerald-400">
                          <Icons.Check />
                        </span>
                      )}
                      {benefit}
                    </p>
                  ))}
                </div>
              </td>

              {/* Select Column */}
              <td className="p-6 border-r border-[var(--glass-border)] text-center">
                <select className="bg-[var(--surface-color)] text-[var(--text-main)] text-sm rounded-md px-3 py-2 border border-[var(--glass-border)] outline-none w-16 cursor-pointer">
                  <option value="1" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">1</option>
                  <option value="2" className="bg-[var(--surface-color)] text-[var(--text-main)] font-semibold">2</option>
                </select>
              </td>

              {/* Choices Column */}
              <td className="py-6 px-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-2 text-left">
                  It only takes 2 minutes
                </p>
                <p className="text-xs text-[var(--text-muted)] mb-6 text-left">
                  You won&apos;t be charged yet
                </p>
                <button
                  onClick={() => onReserve?.(room.type, room.pricing.newPrice)}
                  disabled={isPrebooking}
                  className="w-full bg-[var(--accent-primary)] text-[var(--text-main)] py-2.5 rounded-full hover:bg-[var(--accent-secondary)] transition-all text-sm font-medium cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isPrebooking ? "Prebooking..." : "I'll reserve"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Main Container ---

export default function HotelDetailsPage() {
  const router = useRouter();
  const [isPrebooking, setIsPrebooking] = useState(false);
  const params = useParams();
  const urlId = String((params as any)?.id || "");
  const [liveHotel, setLiveHotel] = useState<any>(null);

  useEffect(() => {
    if (!urlId || urlId.startsWith("live-")) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
    fetch(`${apiBase}/api/v1/hotels/lite/${encodeURIComponent(urlId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.data?.name) {
          setLiveHotel(d.data);
        }
      })
      .catch(() => {});
  }, [urlId]);

  const base = hotelData[0];

  // Map live LiteAPI room offers cleanly into room table format
  const mappedRooms = (liveHotel?.rooms && Array.isArray(liveHotel.rooms) && liveHotel.rooms.length > 0)
    ? liveHotel.rooms.map((r: any, idx: number) => ({
        id: `lite-room-${idx}`,
        type: r.roomName || "Standard Room",
        recommended: r.boardName || "Room Only",
        leftCount: 3,
        bed: "1 King Bed",
        features: [{ label: r.boardName || "Room Only" }],
        amenities: [r.cancellation || "Free cancellation", "Free high-speed Wi-Fi", "Pay at property"],
        pricing: {
          oldPrice: r.price ? `${r.currency || "USD"} ${Math.round(Number(r.price) * 1.15)}` : "",
          newPrice: `${r.currency || "USD"} ${r.price}`,
          note: "Taxes & fees included",
          discountBadge: r.cancellation || "Free cancellation",
        },
        benefits: [r.cancellation || "Free cancellation", "Includes high-speed internet", "No prepayment needed"],
      }))
    : base.rooms;

  const hotel = liveHotel
    ? {
        ...base,
        name: liveHotel.name,
        location: [liveHotel.address, liveHotel.city, liveHotel.country].filter(Boolean).join(", ") || base.location,
        description: liveHotel.description || base.description,
        ratingScore: liveHotel.stars ? `${liveHotel.stars}/5` : "4.3/5",
        lat: liveHotel.lat,
        lng: liveHotel.lng,
        address: [liveHotel.address, liveHotel.city, liveHotel.country].filter(Boolean).join(", ") || (base as any).address,
        rawImages: liveHotel.images || [],
        quickReserve: liveHotel.nightlyPrice
          ? {
              ...(base as any).quickReserve,
              roomType: mappedRooms[0]?.type || (base as any).quickReserve?.roomType,
              priceInfo: {
                ...(base as any).quickReserve?.priceInfo,
                duration: `2 nights (${liveHotel.rateCheckin || "Check-in"} → ${liveHotel.rateCheckout || "Check-out"})`,
                oldPrice: liveHotel.totalPrice ? `USD ${Math.round(Number(liveHotel.totalPrice) * 1.15)}` : "",
                newPrice: `USD ${liveHotel.totalPrice || liveHotel.nightlyPrice}`,
                note: `USD ${liveHotel.nightlyPrice}/night • taxes & fees included`,
              },
            }
          : (base as any).quickReserve,
        images:
          liveHotel.images && liveHotel.images.length > 0
            ? {
                main: "",
                mainUrl: liveHotel.images[0],
                thumbs: liveHotel.images.slice(1, 5).map(() => ""),
                thumbUrls: liveHotel.images.slice(1, 5),
                extraCount: Math.max(0, liveHotel.images.length - 5),
              }
            : base.images,
        rooms: mappedRooms,
      }
    : base;

  const handleReserve = async (roomType?: string, price?: string) => {
    try {
      setIsPrebooking(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
      const response = await fetch(`${apiBase}/api/liteapi/prebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: `offer_lite_${Date.now()}`,
          hotelId: hotel.name || "hotel_101",
          roomType: roomType || hotel.quickReserve.roomType,
          price: price || hotel.quickReserve.priceInfo.newPrice,
        }),
      }).catch(() => null);

      const data = response?.ok ? await response.json() : null;
      const prebookId = data?.prebookId || data?.data?.prebookId || `prebook_${Date.now()}`;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "flydna_prebook_session",
          JSON.stringify({
            prebookId,
            hotelName: hotel.name,
            roomType: roomType || hotel.quickReserve.roomType,
            price: price || hotel.quickReserve.priceInfo.newPrice,
            timestamp: new Date().toISOString(),
          })
        );
      }

      router.push("/travel/payment");
    } catch {
      router.push("/travel/payment");
    } finally {
      setIsPrebooking(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 font-sans z-20">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 my-10 z-20">
        <HotelHeader hotel={hotel} />
        <HotelFacilities facilities={hotel.facilities} />
        <HotelQuickReserve data={hotel.quickReserve} onReserve={() => handleReserve()} isPrebooking={isPrebooking} />
        <HotelRoomTable rooms={hotel.rooms} onReserve={(type, price) => handleReserve(type, price)} isPrebooking={isPrebooking} />
      </div>
    </div>
  );
}
