import {
  Facebook,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import CurrentYear from "@/utils/CurrentYear";
import { Suspense } from "react";

export default function Footer() {
  return (
    <>
      <div className="w-full pt-15 relative flex flex-col items-center">
        <Image
          src="/assets/plane-footer.svg"
          alt="plane"
          className="w-full max-w-6xl mx-auto relative z-10"
          width={1200}
          height={400}
          priority
        />
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[50px] bg-white opacity-30 blur-[50px] rounded-[100%] pointer-events-none z-0"></div>
      </div>
      <footer className="relative w-full pt-32 pb-8 px-4 mt-20 overflow-hidden text-[var(--text-main)]/80">
        <div className=" mb-10 w-full max-w-5xl mx-auto h-[2px] bg-linear-to-r from-transparent via-white/50 to-transparent"></div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col">
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
            {/* Logo Column */}
            <div className="col-span-1">
              <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">
                FlyDnA
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                Making your adventure more enjoyable and seamlessly planned.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[var(--glass-bg)] flex items-center justify-center hover:bg-[var(--accent-primary)] transition-colors text-[var(--text-main)]"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-[var(--glass-bg)] flex items-center justify-center hover:bg-[var(--accent-primary)] transition-colors text-[var(--text-main)]"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className="text-[var(--text-main)] font-semibold mb-6">
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Tours
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Service */}
            <div className="col-span-1">
              <h3 className="text-[var(--text-main)] font-semibold mb-6">
                Service
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Flights
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Hotels
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Cars
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    Activity
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div className="col-span-1">
              <h3 className="text-[var(--text-main)] font-semibold mb-6">
                Contact Us
              </h3>
              <ul className="space-y-4 mb-6">
                <li className="flex gap-3 text-sm text-[var(--text-muted)]">
                  <Mail className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                  <span>hclarkjr@hotmail.com</span>
                </li>
                <li className="flex gap-3 text-sm text-[var(--text-muted)]">
                  <MapPin className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                  <span>621 Washington Avenue, Brooklyn, NY 11238</span>
                </li>
                <li className="flex gap-3 text-sm text-[var(--text-muted)]">
                  <Phone className="w-4 h-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
                  <span>917-698-0940</span>
                </li>
              </ul>

              <div>
                <p className="text-sm text-[var(--text-main)] mb-3 font-medium">
                  Subscribe to our newsletter
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm w-full focus:outline-none focus:border-[var(--accent-primary)] transition-colors text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                  />
                  <button className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] transition-colors text-[var(--text-main)] px-5 py-2.5 rounded-full text-sm font-medium shrink-0">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className=" mb-10 w-full max-w-5xl mx-auto h-[1px] bg-linear-to-r from-transparent via-white/50 to-transparent"></div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-10">
            <p className="text-sm text-[var(--text-muted)] mb-4 md:mb-0">
              Copyright ©{" "}
              <Suspense fallback={2026}>
                <CurrentYear />
              </Suspense>{" "}
              FlyDnA Inc.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                Term & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
