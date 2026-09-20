import Image from "next/image";

export default function Features() {
  const features = [
    {
      icon: "/assets/icon-1.png",
      title: "Quick & Easy Search",
      description: "Find travel options quickly with our simple search system.",
    },
    {
      icon: "/assets/icon-2.png",
      title: "No Extra Booking Fees",
      description:
        "Transparent pricing ensures no hidden charges during booking process.",
    },
    {
      icon: "/assets/icon-3.png",
      title: "Many Trusted Providers",
      description:
        "Access services from numerous reliable global travel partners easily.",
    },
  ];
  return (
    <section className="w-full max-w-5xl mx-auto py-16 md:py-24 px-4 text-[var(--text-main)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className={`flex flex-col items-center text-center px-4 py-8 md:py-0 
              ${idx !== 0 ? "border-t border-white/10 md:border-t-0 md:border-l" : ""}
            `}
          >
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 shadow-lg relative shrink-0">
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]" />
              <Image
                src={feature.icon}
                alt="icon"
                className="w-[76px] h-[76px] object-contain relative z-10 feature-icon-svg"
                width={76}
                height={76}
                priority
              />
            </div>
            <h3 className="text-xl font-semibold mb-3 tracking-wide">
              {feature.title}
            </h3>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-[300px]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
