"use client";
import React from "react";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep?: number;
  mode?: "flight" | "event";
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep = 1, mode = "flight" }) => {
  const steps = mode === "event" ? [
    { id: 1, title: "Seats", href: "#" },
    { id: 2, title: "Add-Ons", href: "/travel/event-checkout" },
    { id: 3, title: "Guest Details", href: "/travel/event-checkout?step=2" },
    { id: 4, title: "Payment", href: "/travel/payment" },
    { id: 5, title: "Confirmation", href: "/travel/booking-confirmed" },
  ] : [
    { id: 1, title: "Passenger Details", href: "/travel/passenger-info" },
    { id: 2, title: "Add-Ons", href: "/travel/flight-add-on" },
    { id: 3, title: "Seats", href: "/travel/pick-a-seat" },
    { id: 4, title: "Payment", href: "/travel/payment" },
    { id: 5, title: "Confirmation", href: "/travel/booking-confirmed" },
  ];

  return (
    <div className="flex items-start justify-center px-2 py-8 md:py-12 relative z-10 w-full max-w-4xl mx-auto">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isUpcoming = step.id > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="group outline-none shrink-0 flex flex-col items-center">
              <div
                className={`flex flex-col items-center gap-1.5 md:gap-2 font-medium transition-all duration-300 group-hover:scale-105 ${
                  isUpcoming
                    ? "text-[var(--text-muted)]"
                    : "text-[var(--text-main)]"
                }`}
              >
                {isCompleted ? (
                  <span className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg bg-[var(--accent-primary)] text-[var(--text-main)] shrink-0">
                    <Check className="w-5 h-5" />
                  </span>
                ) : isCurrent ? (
                  <span className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center text-sm md:text-lg bg-[var(--glass-bg)] text-[var(--text-main)] shrink-0">
                    {step.id}
                  </span>
                ) : (
                  <span className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center text-sm md:text-lg shrink-0">
                    {step.id}
                  </span>
                )}
                <span className="text-[10px] md:text-sm px-1 text-center w-[60px] sm:w-auto leading-tight md:whitespace-nowrap break-words">
                  {step.title}
                </span>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 sm:flex-none sm:w-8 md:w-16 h-0.5 mt-4 md:mt-5 mx-1 sm:mx-2 md:mx-4 shrink transition-colors ${
                  isCompleted
                    ? "bg-[var(--accent-primary)]"
                    : "bg-[var(--glass-bg)]"
                }`}
              ></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ProgressBar;
