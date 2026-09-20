'use client'
import { useState } from 'react'
import { Bus, TramFront, CarFront, Star } from 'lucide-react'

const garageData = [
    {
        icon: <Bus size={16} color="#10b981" strokeWidth={1.25} />,
        label: "Bus",
        options: ["MTA - Local", "MegaBus - Northeast to Midwest", "Greyhound - Nationwide"]
    },
    {
        icon: <TramFront size={16} color="#8b5cf6" strokeWidth={1.25} />,
        label: "Train",
        options: ["MTA - City Local", "LIRR- Queens - Long Island", "Amtrak - OT "]
    },
    {
        icon: <CarFront size={16} color="#06b6d4" strokeWidth={1.25} />,
        label: "Car",
        options: ["Lyft", "Uber", "Black Car x10"]
    },
    {
        icon: <Star size={16} color="#f59e0b" strokeWidth={1.25} />,
        label: "Private / Luxury",
        options: ["Luxury", "Sporty", "Executive - SUV", "Private Jet", "Yacht"]
    },
]

export default function NascDigitalGarage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="glass-panel-heavy relative rounded-xl p-4">
            <div className="relative z-10">
                <h2 className="text-foreground text-xs font-semibold mb-3 tracking-wider uppercase">Digital Garage</h2>

                {garageData.map((item, index) => (
                    <div key={index} className="mb-2">
                        <div
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="group flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-all duration-200"
                        >
                            <div className="flex items-center gap-2">
                                {item.icon}
                                <span className="text-xs text-foreground/80 tracking-wider group-hover:text-foreground">{item.label}</span>
                            </div>
                            <span className="text-muted-foreground text-xs">{openIndex === index ? '▲' : '▼'}</span>
                        </div>

                        {openIndex === index && (
                            <div className="mt-1 ml-2 border-l border-border pl-3">
                                {item.options.map((opt, i) => (
                                    <div key={i} className="text-xs text-muted-foreground py-1 hover:text-foreground cursor-pointer tracking-wider transition-all duration-150">
                                        → {opt}
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
