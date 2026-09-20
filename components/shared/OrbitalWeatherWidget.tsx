import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cloud, Sun, MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

export default function OrbitalWeatherWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldHide, setShouldHide] = useState(false);
  const pathname = usePathname();
  const [weather, setWeather] = useState<{
    temp: number;
    desc: string;
    city: string;
    wind: number;
    humidity: number;
  } | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Reverse geocode city name
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        );
        const geoData = await geoRes.json();
        const city =
          geoData?.address?.city ||
          geoData?.address?.town ||
          geoData?.address?.state ||
          "Your Location";

        // Fetch weather from Open-Meteo (no API key needed)
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,windspeed_10m,weathercode,relative_humidity_2m&temperature_unit=fahrenheit`,
        );
        const data = await res.json();
        const code = data?.current?.weathercode;
        const desc =
          code <= 1
            ? "Clear"
            : code <= 3
              ? "Cloudy"
              : code <= 67
                ? "Rain"
                : code <= 77
                  ? "Snow"
                  : "Storm";
        setWeather({
          temp:
            data?.current?.temperature_2m !== undefined &&
            data?.current?.temperature_2m !== null
              ? Math.round(data.current.temperature_2m)
              : NaN,
          desc,
          city,
          wind: Math.round(data?.current?.windspeed_10m || 0),
          humidity: data?.current?.relative_humidity_2m || 0,
        });
      } catch {}
    };

    // First try profile city/country
    let city = null;
    try {
      const profileRaw = localStorage.getItem("flydna_profile");
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        city = profile?.city || null;
      }
    } catch {}

    if (!city) {
      try {
        const userRaw = localStorage.getItem("flydna_user");
        if (userRaw) {
          const user = JSON.parse(userRaw);
          city = user?.city || null;
        }
      } catch {}
    }

    // Priority: real device location > profile city > Atlanta
    const fallbackToProfileCity = () => {
      if (city) {
        fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        )
          .then((r) => r.json())
          .then((data) => {
            if (data?.[0]) {
              fetchWeather(parseFloat(data[0].lat), parseFloat(data[0].lon));
            } else {
              fetchWeather(33.749, -84.388); // Atlanta fallback
            }
          })
          .catch(() => fetchWeather(33.749, -84.388));
      } else {
        fetchWeather(33.749, -84.388);
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        fallbackToProfileCity,
        { timeout: 8000 },
      );
    } else {
      fallbackToProfileCity();
    }
  }, []);

  useEffect(() => {
    // Hide on the store page
    const isStorePage = pathname && pathname.includes("/store");
    if (isStorePage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldHide(true);
      return;
    }

    // Function to check for any active overlay popup backdrops with blur
    const checkPopups = () => {
      const hasOverlay = document.querySelector(
        ".fixed.inset-0.backdrop-blur-sm, " +
          ".fixed.inset-0.backdrop-blur-md, " +
          ".fixed.inset-0.backdrop-blur-lg, " +
          ".fixed.inset-0.backdrop-blur-xl, " +
          ".fixed.inset-0.backdrop-blur, " +
          ".fixed.inset-0 .backdrop-blur-sm, " +
          ".fixed.inset-0 .backdrop-blur-md, " +
          ".fixed.inset-0 .backdrop-blur-lg, " +
          ".fixed.inset-0 .backdrop-blur-xl, " +
          ".fixed.inset-0 .backdrop-blur",
      );
      setShouldHide(!!hasOverlay);
    };

    checkPopups();

    // Monitor additions/removals of popup backdrops in the DOM
    const observer = new MutationObserver(checkPopups);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  if (shouldHide) return null;

  return (
    <div
      className="fixed right-0 bottom-7 z-[9999]"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="relative">
        {/* Pulsing orbital ring */}
        <div className="absolute -inset-1.5 rounded-l-[26px] bg-cyan-500/10 blur-[6px] pointer-events-none" />

        <motion.div
          layout
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ borderRadius: "24px 0px 0px 24px" }}
          className="glass-panel-heavy cursor-pointer select-none relative overflow-hidden flex flex-col justify-center border border-r-0 border-cyan-400/30 shadow-[-5px_0_20px_rgba(0,229,255,0.2)] hover:shadow-[-5px_0_30px_rgba(0,229,255,0.4)] hover:border-cyan-400/50 transition-shadow duration-300 backdrop-blur-[16px]"
          animate={{
            width: isExpanded ? 340 : 58,
            height: isExpanded ? 240 : 58,
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 28,
          }}
        >
          {/* Internal orbital network lines bg decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.15),transparent_70%)]" />

          {/* Collapsed view / Orb */}
          {!isExpanded ? (
            <div className="flex flex-col items-center justify-center h-full w-full gap-0.5">
              <div className="relative size-6 flex items-center justify-center">
                <Cloud size={16} className="text-cyan-300 relative z-10" />
                <Sun
                  size={10}
                  className="absolute -top-0.5 -right-0.5 text-amber-400 animate-spin-slow z-20"
                />
              </div>
              <span className="text-[10px] font-black text-white font-mono tracking-tighter">
                {weather ? `${weather.temp}°F` : "--°F"}
              </span>
            </div>
          ) : (
            /* Expanded view / Telemetry Panel */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-5 flex flex-col justify-between h-full text-left"
            >
              {/* Header node status */}
              <div className="flex justify-between items-center border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest truncate max-w-[200px]">
                    {weather
                      ? `${weather.city} Climate`
                      : "Montreal Climate Feed"}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase shrink-0">
                  Live Forecast
                </span>
              </div>

              {/* Central Telemetry content split in two sides */}
              <div className="grid grid-cols-[1.1fr_1.4fr] gap-4 py-3 items-center">
                {/* Left Side: Glowing Sensor Orb & Temperature */}
                <div className="flex flex-col items-center justify-center border-r border-white/10 pr-2">
                  {/* Rotating orbital scanning sensor graphic */}
                  <div className="relative size-16 flex items-center justify-center mb-2">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/20 animate-spin-slow" />
                    <div className="absolute inset-2 rounded-full border border-dotted border-cyan-400/40 animate-spin-reverse" />
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-sm animate-pulse" />

                    {/* The weather icon in center */}
                    <div className="relative z-10 flex items-center justify-center">
                      <Cloud
                        size={24}
                        className="text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                      />
                      <Sun
                        size={14}
                        className="absolute -top-1 -right-1 text-amber-400 animate-spin-slow"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-black text-white font-mono tracking-tighter block leading-none">
                      {weather ? `${weather.temp}°F` : "--°F"}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-black uppercase tracking-wider block mt-1">
                      {weather?.desc || "Loading..."}
                    </span>
                  </div>
                </div>

                {/* Right Side: High-tech Monospace Stats bars */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
                    <MapPin size={12} className="text-cyan-400 flex-shrink-0" />
                    <span className="truncate">
                      {weather ? weather.city : "Montreal, QC"}
                    </span>
                  </div>

                  {/* Wind telemetry */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                      <span>Wind Speed</span>
                      <span className="text-white font-mono">
                        {weather ? `${weather.wind} mph` : "13 mph"}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                        style={{
                          width: weather
                            ? `${Math.min(weather.wind * 5, 100)}%`
                            : "35%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Humidity telemetry */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                      <span>Humidity</span>
                      <span className="text-white font-mono">
                        {weather ? `${weather.humidity}%` : "62%"}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 shadow-[0_0_8px_#3b82f6]"
                        style={{
                          width: weather ? `${weather.humidity}%` : "62%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Feels like telemetry */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                      <span>Feels Like</span>
                      <span className="text-white font-mono">
                        {weather ? `${weather.temp}°F` : "--°F"}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 shadow-[0_0_8px_#10b981]"
                        style={{ width: "85%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono font-bold tracking-widest pt-2.5 border-t border-white/10">
                <span>FlyDnA Weather Network</span>
                <span className="text-cyan-400 animate-pulse">
                  Updated Just Now
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
