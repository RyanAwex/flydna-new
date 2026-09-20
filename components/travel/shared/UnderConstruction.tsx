import { Car, Wrench } from "lucide-react";

const UnderConstruction = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 relative z-20">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--accent-primary)]/20 blur-[100px] rounded-full -z-10 animate-pulse"></div>

      <div className="bg-[var(--surface-color)]/40 backdrop-blur-xl border border-[var(--glass-border)] p-8 md:p-12 rounded-[40px] flex flex-col items-center text-center max-w-2xl shadow-2xl relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-[var(--accent-primary)] rounded-3xl flex items-center justify-center border border-[var(--accent-primary)]/50 shadow-[var(--glow-primary)] transform -rotate-6">
          <Car className="w-10 h-10 text-[var(--text-main)]" />
        </div>

        <div className="mt-8 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Page Under <br className="hidden md:block" /> Construction
          </h1>

          <p className="text-[var(--text-muted)] text-lg md:text-xl font-light leading-relaxed mb-10 max-w-md">
            Our engineers are currently fine-tuning this vehicle&apos;s digital
            showroom for a premium experience.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--text-muted)] flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              Engine Calibration
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--text-muted)] flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Diagnostics Level: Extreme
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-[var(--text-muted)] flex items-center gap-2">
              <Wrench className="w-3 h-3 text-[var(--accent-primary)]" />
              Crafting Excellence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnderConstruction;
