export default function NascVaultAssets() {
    return (
        <div className="glass-panel-heavy relative rounded-xl p-4">
            <div className="relative z-10">
                <h2 className="text-foreground text-xs font-semibold mb-3 tracking-wider uppercase">Vault Assets</h2>

                <div className="group mb-3 cursor-pointer">
                    <p className="text-xs text-foreground/80 mb-1.5 tracking-wider group-hover:text-foreground transition-all duration-200">Passport Expiry Status</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 group-hover:-translate-y-0.5 transition-all duration-200">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full w-3/4"></div>
                    </div>
                </div>

                <div className="group mb-3 cursor-pointer">
                    <p className="text-xs text-foreground/80 mb-1.5 tracking-wider group-hover:text-foreground transition-all duration-200">Global Entry Status</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 group-hover:-translate-y-0.5 transition-all duration-200">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-400 h-1.5 rounded-full w-3/4"></div>
                    </div>
                </div>

                <div className="group mb-3 cursor-pointer">
                    <p className="text-xs text-foreground/80 mb-1.5 tracking-wider group-hover:text-foreground transition-all duration-200">Currency Balance</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 group-hover:-translate-y-0.5 transition-all duration-200">
                        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full w-3/4"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
