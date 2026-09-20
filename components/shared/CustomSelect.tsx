import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  labels?: Record<string, string>;
  className?: string;
  onToggle?: (isOpen: boolean) => void;
  align?: "left" | "right";
}

export default function CustomSelect({
  value,
  onChange,
  options,
  labels,
  className = "",
  onToggle,
  align = "left",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (onToggle) onToggle(nextState);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onToggle) onToggle(false);
  };

  const hasRounded = className.includes("rounded-");
  const hasPadding = className.includes("px-") || className.includes("py-");

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between bg-[var(--bg-app)]/80 border border-[var(--glass-border)] hover:border-[var(--accent-primary)]/30 text-sm text-[var(--text-main)] font-bold outline-none transition-all text-left ${
          hasRounded ? "" : "rounded-full"
        } ${hasPadding ? "" : "px-5 py-3"} ${className}`}
      >
        <span className="truncate">{labels?.[value] || value}</span>
        <ChevronDown
          size={14}
          className={`text-[var(--accent-primary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 cursor-default"
              onClick={handleClose}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute ${align === "right" ? "right-0" : "left-0"} w-[240px] md:w-[300px] mt-2 z-50 max-h-64 overflow-y-auto rounded-[20px] border border-[var(--glass-border)] bg-[var(--surface-color)]/95 backdrop-blur-xl p-1.5 shadow-2xl scrollbar-none text-left`}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    handleClose();
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-[14px] text-xs font-black tracking-wide uppercase transition-all ${
                    value === opt
                      ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20"
                      : "text-[var(--text-muted)] hover:bg-white/[0.04] hover:text-[var(--text-main)]"
                  }`}
                >
                  {labels?.[opt] || opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
