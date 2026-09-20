"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProgressBar from "../components/ProgressBar";
import {
  ChevronRight,
  Lock,
  Plane,
  Coffee,
  Droplets,
  RockingChair,
} from "lucide-react";
import { useSearchStore, getApiUrl } from "@/utils/states/useSearchStore";

type SeatType = "firstclass" | "econ-plus" | "economy";

const SEAT_PRICES: Record<SeatType, number> = {
  firstclass: 420,
  "econ-plus": 125,
  economy: 89,
};

const DEFAULT_OCCUPIED_SEATS = new Set([
  "B2", "A3", "C7", "D8", "C10", "F12", "D15", "C16", "C19", "D20", "C22", "C25", "D25", "C28", "C31", "D30"
]);
const DEFAULT_SEAT = "12C";

export default function SeatSelection() {
  const { 
    selectedOffer, 
    selectedSeat, 
    setSelectedSeat,
    setSelectedSeatPrice,
    setSelectedSeatType
  } = useSearchStore();

  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(DEFAULT_OCCUPIED_SEATS);
  const [seatPrices, setSeatPrices] = useState<Record<string, number>>({});
  const [seatServices, setSeatServices] = useState<Record<string, any>>({});
  const [selectedType, setSelectedType] = useState<SeatType>("econ-plus");
  const [loadingMap, setLoadingMap] = useState(false);

  useEffect(() => {
    if (!selectedOffer || selectedOffer.id.startsWith("mock_")) {
      setOccupiedSeats(DEFAULT_OCCUPIED_SEATS);
      setSelectedSeatType("econ-plus");
      setSelectedSeatPrice(125);
      return;
    }

    const fetchSeatMaps = async () => {
      setLoadingMap(true);
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/v1/flights/offers/${selectedOffer.id}/seat-maps`);
        const data = await res.json();
        if (data.success && data.data) {
          const segmentMap = data.data?.[0]?.maps?.[0]?.map;
          if (segmentMap) {
            const occupied = new Set<string>();
            const prices: Record<string, number> = {};
            const servicesMap: Record<string, any> = {};

            segmentMap.forEach((deck: any) => {
              deck.cabins?.forEach((cabin: any) => {
                cabin.rows?.forEach((row: any) => {
                  row.sections?.forEach((section: any) => {
                    section.elements?.forEach((element: any) => {
                      if (element.type === "seat") {
                        const seatName = element.name;
                        const isAvailable = element.available_services && element.available_services.length > 0;
                        if (!isAvailable) {
                          occupied.add(seatName);
                        } else {
                          const service = element.available_services[0];
                          if (service) {
                            prices[seatName] = Math.round(parseFloat(service.total_amount || "0"));
                            servicesMap[seatName] = service;
                          }
                        }
                      }
                    });
                  });
                });
              });
            });
            setOccupiedSeats(occupied);
            setSeatPrices(prices);
            setSeatServices(servicesMap);
          }
        }
      } catch (err) {
        console.error("Duffel seat map load failed:", err);
      } finally {
        setLoadingMap(false);
      }
    };

    fetchSeatMaps();
  }, [selectedOffer, setSelectedSeatPrice, setSelectedSeatType]);

  const handleSeatClick = (id: string, type: SeatType) => {
    if (occupiedSeats.has(id)) return;
    setSelectedSeat(id);
    setSelectedType(type);
    setSelectedSeatType(type);

    const priceVal = seatPrices[id] !== undefined ? seatPrices[id] : SEAT_PRICES[type];
    setSelectedSeatPrice(priceVal);

    if (typeof window !== "undefined") {
      const service = seatServices[id];
      if (service && selectedOffer?.passengers?.[0]?.id) {
        sessionStorage.setItem("selectedSeatService", JSON.stringify({
          serviceId: service.id,
          passengerId: selectedOffer.passengers[0].id,
          quantity: 1
        }));
      } else {
        sessionStorage.removeItem("selectedSeatService");
      }
    }
  };

  const renderSeat = (id: string, type: SeatType) => {
    const isOccupied = occupiedSeats.has(id);
    const isSelected = selectedSeat === id;

    const baseClass =
      type === "firstclass"
        ? "bg-[var(--surface-color)] hover:bg-[var(--surface-color)] border-[var(--accent-primary)]"
        : type === "econ-plus"
          ? "bg-[var(--surface-color)] hover:bg-[var(--surface-color)] border-yellow-500/50"
          : "bg-[var(--bg-app)] hover:bg-[var(--surface-color)] border-[var(--glass-border)]";

    const selectedClass =
      "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-main)] shadow-[var(--glow-primary)]";
    const occupiedClass =
      "bg-[var(--bg-app)] border-transparent text-transparent cursor-not-allowed relative " +
      "after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-4 after:h-[1.5px] after:bg-[var(--surface-color)] after:rotate-45 " +
      "before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-4 before:h-[1.5px] before:bg-[var(--surface-color)] before:-rotate-45";

    let stateClass = baseClass;
    if (isOccupied) stateClass = occupiedClass;
    else if (isSelected) stateClass = selectedClass;

    return (
      <button
        key={id}
        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl border transition-all duration-300 flex items-center justify-center text-[10px] sm:text-xs font-semibold hover:scale-105 active:scale-95 group relative ${stateClass}`}
        disabled={isOccupied}
        title={isOccupied ? "Occupied" : undefined}
        onClick={() => handleSeatClick(id, type)}
      >
        {isSelected ? id : ""}
        {!isOccupied && !isSelected && (
          <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity">
            {id.replace(/\d+/g, "")}
          </span>
        )}
      </button>
    );
  };

  const renderRow = (
    rowNum: number,
    leftSeats: string[],
    rightSeats: string[],
    seatType: SeatType,
    aisleContent: React.ReactNode,
  ) => {
    const numStr = String(rowNum).padStart(2, "0").replace(/^0/, "");

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 my-2 sm:my-3 group w-full px-2" key={rowNum}>
        <div className="w-4 sm:w-6 text-right font-medium text-[10px] sm:text-sm transition-colors text-[var(--text-muted)] group-hover:text-[var(--text-muted)]">
          {numStr}
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          {leftSeats.map((s) => renderSeat(s, seatType))}
        </div>
        <div className="w-6 sm:w-8 md:w-12 flex items-center justify-center shrink-0">
          {aisleContent ? aisleContent : (
            <div className="w-px sm:w-0.5 h-full min-h-[32px] sm:min-h-[44px] bg-[var(--glass-bg)] rounded-full"></div>
          )}
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          {rightSeats.map((s) => renderSeat(s, seatType))}
        </div>
        <div className="w-4 sm:w-6 text-left font-medium text-[10px] sm:text-sm transition-colors text-[var(--text-muted)] group-hover:text-[var(--text-muted)]">
          {numStr}
        </div>
      </div>
    );
  };

  const firstClassRows = [];
  for (let r = 1; r <= 4; r++) {
    const left = [`A${r}`, `B${r}`];
    const right = [`E${r}`, `F${r}`];
    const aisleHtml = <div className="w-full h-px sm:h-0.5 bg-[var(--glass-bg)] rounded-full mx-1 sm:mx-2"></div>;
    firstClassRows.push(renderRow(r, left, right, "firstclass", aisleHtml));
  }

  const econPlusRows = [];
  for (let r = 7; r <= 16; r++) {
    if (r === 9 || r === 13) continue;
    const left = [`A${r}`, `B${r}`, `C${r}`];
    const right = [`D${r}`, `E${r}`, `F${r}`];
    const isSelected12 = r === 12;
    const aisleHtml = (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        {isSelected12 && (
          <div className="text-[8px] sm:text-[10px] text-[var(--text-main)] absolute -top-3 sm:-top-4">EXIT</div>
        )}
        <div className="w-px sm:w-0.5 h-full min-h-[32px] sm:min-h-[44px] bg-[var(--glass-bg)] rounded-full"></div>
      </div>
    );
    econPlusRows.push(renderRow(r, left, right, "econ-plus", aisleHtml));
  }

  const economyRows = [];
  for (let r = 17; r <= 34; r++) {
    const left = [`A${r}`, `B${r}`, `C${r}`];
    const right = [`D${r}`, `E${r}`, `F${r}`];
    economyRows.push(renderRow(r, left, right, "economy", null));
  }

  const activeSeatPrice = selectedSeat ? (seatPrices[selectedSeat] !== undefined ? seatPrices[selectedSeat] : SEAT_PRICES[selectedType]) : 0;
  const classLabel = selectedType === "firstclass" ? "First Class" : selectedType === "econ-plus" ? "Economy+" : "Economy";

  const basePrice = selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.85) : 850;
  const taxes = selectedOffer ? Math.round(parseFloat(selectedOffer.total_amount) * 0.15) : 120;
  const total = basePrice + taxes + activeSeatPrice;

  const outboundSlice = selectedOffer?.slices?.[0];
  const originCode = outboundSlice?.segments?.[0]?.origin?.iata_code || "JFK";
  const destCode = outboundSlice?.segments?.[outboundSlice.segments.length - 1]?.destination?.iata_code || "HND";

  return (
    <div className="relative w-full max-w-[1728px] mx-auto min-h-screen overflow-hidden text-[var(--text-main)] flex flex-col bg-[var(--bg-app)]">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,var(--accent-primary)_0%,transparent_70%)] pointer-events-none -z-10"></div>
      <ProgressBar currentStep={3} />
      <div className="text-center mb-6 sm:mb-10 relative z-10 px-4 sm:px-6 mt-4">
        <h1 className="text-3xl sm:text-4xl font-medium mb-3">Select your seats</h1>
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-[var(--text-muted)] text-xs sm:text-sm font-medium bg-[var(--glass-bg)] w-max mx-auto px-4 sm:px-6 py-2 rounded-full border border-[var(--glass-border)]">
          <span className="text-[var(--accent-primary)] flex items-center gap-1 sm:gap-2">
            <Plane className="w-3 h-3 sm:w-4 sm:h-4" /> Boeing 777-300ER
          </span>
          <div className="w-1 h-1 bg-[var(--glass-bg)] rounded-full"></div>
          <span className="text-[var(--text-main)]">{originCode}</span>
          <span className="text-[var(--accent-primary)]">&rarr;</span>
          <span className="text-[var(--text-main)]">{destCode}</span>
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 px-2 sm:px-6 lg:px-[180px] pb-24 relative z-10 w-full">
        <div className="flex-[2] flex justify-center bg-transparent rounded-[32px] sm:rounded-[48px] p-2 sm:p-6 lg:p-0 relative overflow-hidden">
          <div className="w-full max-w-[500px] relative z-10 flex flex-col items-center bg-[var(--bg-app)] rounded-[100px] sm:rounded-[200px] border border-[var(--glass-border)] shadow-[inset_0_0_80px_rgba(0,0,0,0.3)] pb-12 overflow-hidden">
            <div className="flex flex-col items-center justify-center w-full h-32 sm:h-48 bg-gradient-to-b from-white/10 to-transparent mb-8 relative border-t-2 border-[var(--glass-border)]">
              <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--text-main)] mb-2" />
              <div className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">Cockpit</div>
            </div>
            <div className="flex w-full justify-between px-6 sm:px-10 mb-8 sm:mb-12">
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)]">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase">Galley</span>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)]">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase">Lavatory</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 p-3 sm:p-4 bg-[var(--glass-bg)] rounded-2xl border border-[var(--glass-border)] mb-8 sm:mb-12 w-[90%] max-w-[400px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[var(--surface-color)] border border-[var(--glass-border)]"></div>
                <span className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)]">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[var(--surface-color)] relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-2 after:h-[1px] after:bg-[var(--glass-bg)] after:rotate-45 before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-2 before:h-[1px] before:bg-[var(--glass-bg)] before:-rotate-45"></div>
                <span className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)]">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[var(--accent-primary)] shadow-[var(--glow-primary)]"></div>
                <span className="text-[10px] sm:text-sm font-medium text-[var(--text-muted)]">Your Seat</span>
              </div>
            </div>
            {loadingMap ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-3"></div>
                <span className="text-xs text-[var(--text-muted)]">Loading cabin layout...</span>
              </div>
            ) : (
              <>
                <div className="w-full flex flex-col items-center mb-10 sm:mb-16 relative px-1 sm:px-2">
                  <div className="bg-[var(--surface-color)] border border-[var(--glass-border)] text-[var(--accent-primary)] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8">First Class</div>
                  <div className="flex justify-center w-full mb-2 sm:mb-4 px-4 sm:px-12 md:px-16 text-[var(--text-muted)] text-xs sm:text-sm font-bold">
                    <div className="flex gap-[36px] sm:gap-[48px] md:gap-[52px] mr-auto ml-[22px] sm:ml-10"><span>A</span><span>B</span></div>
                    <div className="flex gap-[36px] sm:gap-[48px] md:gap-[52px] ml-auto mr-[22px] sm:mr-10"><span>E</span><span>F</span></div>
                  </div>
                  <div className="w-full flex flex-col items-center gap-1 sm:gap-2">{firstClassRows}</div>
                </div>
                <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-[var(--text-muted)]/10 to-transparent my-6 sm:my-8"></div>
                <div className="w-full flex flex-col items-center mb-10 sm:mb-16 relative px-1 sm:px-2">
                  <div className="bg-[var(--surface-color)] border border-[var(--glass-border)] text-yellow-500/80 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8">Economy Plus</div>
                  <div className="flex justify-center w-full mb-2 sm:mb-4 px-4 sm:px-12 text-[var(--text-muted)] text-xs sm:text-sm font-bold">
                    <div className="flex gap-[28px] sm:gap-[36px] md:gap-[40px] mr-auto ml-[16px] sm:ml-[34px]"><span>A</span><span>B</span><span>C</span></div>
                    <div className="flex gap-[28px] sm:gap-[36px] md:gap-[40px] ml-auto mr-[16px] sm:mr-[34px]"><span>D</span><span>E</span><span>F</span></div>
                  </div>
                  <div className="w-full flex flex-col items-center gap-0.5 sm:gap-1">{econPlusRows}</div>
                </div>
                <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-[var(--text-muted)]/10 to-transparent my-6 sm:my-8"></div>
                <div className="w-full flex flex-col items-center mb-10 sm:mb-16 relative px-1 sm:px-2">
                  <div className="bg-[var(--surface-color)] border border-[var(--glass-border)] text-[var(--text-muted)] px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-6 sm:mb-8">Economy</div>
                  <div className="flex justify-center w-full mb-2 sm:mb-4 px-4 sm:px-12 text-[var(--text-muted)] text-xs sm:text-sm font-bold">
                    <div className="flex gap-[28px] sm:gap-[36px] md:gap-[40px] mr-auto ml-[16px] sm:ml-[34px]"><span>A</span><span>B</span><span>C</span></div>
                    <div className="flex gap-[28px] sm:gap-[36px] md:gap-[40px] ml-auto mr-[16px] sm:mr-[34px]"><span>D</span><span>E</span><span>F</span></div>
                  </div>
                  <div className="w-full flex flex-col items-center gap-0.5 sm:gap-1">{economyRows}</div>
                </div>
              </>
            )}
            <div className="w-[80%] h-px bg-gradient-to-r from-transparent via-[var(--text-muted)]/10 to-transparent my-6 sm:my-8"></div>
            <div className="flex w-full justify-between px-6 sm:px-10 mb-10 sm:mb-20">
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)]">
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase">Galley</span>
              </div>
              <div className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-[var(--glass-bg)] rounded-xl border border-[var(--glass-border)] text-[var(--text-muted)]">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase">Lavatory</span>
              </div>
            </div>
            <div className="absolute bottom-0 w-full h-32 sm:h-48 bg-gradient-to-t from-white/10 to-transparent flex justify-center pointer-events-none border-b-2 border-[var(--glass-border)]">
              <div className="absolute bottom-8 w-px h-12 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"></div>
            </div>
          </div>
        </div>
        <aside className="w-full xl:w-[450px] shrink-0 h-fit flex flex-col gap-4 sm:gap-6 sticky top-4 sm:top-8">
          <div className="bg-[var(--surface-color)] p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[var(--glass-border)] shadow-2xl relative overflow-hidden group">
            <h3 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 text-[var(--text-main)]">Reservation Summary</h3>
            <div className="flex items-center justify-between bg-[var(--glass-bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--glass-border)] mb-4 sm:mb-6">
              <div className="flex flex-col">
                <span className="font-bold text-xl sm:text-2xl tracking-wider text-[var(--text-main)]">{originCode}</span>
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase mt-1">Origin</span>
              </div>
              <div className="flex flex-col items-center flex-1 mx-2 sm:mx-4">
                <div className="text-sm sm:text-lg mb-1">✈</div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--accent-primary)]/50 to-transparent"></div>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-xl sm:text-2xl tracking-wider text-[var(--text-main)]">{destCode}</span>
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase mt-1">Destination</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-[var(--glass-bg)] p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--glass-border)] mb-4 sm:mb-6 shadow-inner">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--glass-bg)] rounded-xl flex items-center justify-center border border-[var(--glass-border)]">
                  <RockingChair className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--text-main)]/80" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider mb-0.5 sm:mb-1">Selected Seat</span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-lg sm:text-xl text-[var(--text-main)]">{selectedSeat || "None"}</span>
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-md border ${selectedType === "firstclass" ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/30" : selectedType === "econ-plus" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-[var(--glass-bg)] text-[var(--text-main)] border-[var(--glass-border)]"}`}>{classLabel}</span>
                  </div>
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-[var(--text-main)]">${activeSeatPrice.toFixed(2)}</div>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4 mb-6">
              <div className="flex justify-between text-[var(--text-muted)] text-sm sm:text-[15px]"><span>Flight Fare</span><span className="text-[var(--text-main)] font-medium">${basePrice.toFixed(2)}</span></div>
              <div className="flex justify-between font-medium text-sm sm:text-[15px]"><span className="text-[var(--text-muted)]">Seat Selection ({selectedSeat || "None"})</span><span className="text-[var(--accent-primary)]">+ ${activeSeatPrice.toFixed(2)}</span></div>
              <div className="flex justify-between text-[var(--text-muted)] text-sm sm:text-[15px]"><span>Taxes &amp; Fees</span><span className="text-[var(--text-main)] font-medium">${taxes.toFixed(2)}</span></div>
            </div>
            <div className="h-px bg-[var(--glass-bg)] my-4 sm:my-6"></div>
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <span className="text-lg sm:text-xl text-[var(--text-muted)]">Total</span>
              <span className="text-3xl sm:text-4xl font-bold text-[var(--accent-primary)]">${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
            <Link href="/travel/payment" className="w-full py-3 sm:py-4 bg-[var(--accent-primary)] text-[var(--text-main)] rounded-full font-medium text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 hover:bg-[var(--accent-secondary)] hover:shadow-[var(--glow-primary)] transition-transform">
              <span>Continue to Payment</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-[var(--surface-color)]/50 border border-[var(--glass-border)] rounded-xl sm:rounded-2xl text-[var(--text-muted)]">
            <div className="mt-0.5 sm:mt-0"><Lock className="w-5 h-5 sm:w-6 sm:h-6" /></div>
            <p className="text-xs sm:text-sm leading-relaxed">Secure Selection. Your seat will be reserved for 15 minutes while you complete your booking.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
