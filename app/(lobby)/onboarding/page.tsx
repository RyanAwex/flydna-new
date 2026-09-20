"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { register, login } from "@/lib/api";

const GhostCursor = dynamic(() => import("@/components/GhostCursor"), {
  ssr: false,
});
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Globe,
  Compass,
  Plane,
  Sparkles,
  MapPin,
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Shield,
  Star,
  Award,
  Heart,
  Smile,
  Moon,
  Sun,
  Anchor,
  Landmark,
  Eye,
  EyeOff,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    root.classList.remove("light");
    root.setAttribute("data-theme", "dark");
    const LIGHT_VARS = [
      "--bg-app",
      "--surface-color",
      "--accent-primary",
      "--accent-secondary",
      "--text-main",
      "--text-muted",
      "--glass-bg",
      "--glass-border",
      "--shadow-premium",
      "--glow-primary",
      "--glass-blur",
      "--radius-main",
      "--map-filter",
    ];
    LIGHT_VARS.forEach((k) => root.style.removeProperty(k));
  }, []);

  // Current step state (1 to 4)
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Entire onboarding state structure
  const [formData, setFormData] = useState({
    personalProfile: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      dob: "",
      location: "",
      gender: "",
    },
    travelPreferences: {
      preferredClass: "First Class", // Default choice
      everFlownPrivate: "No",
      everFlownFirstClass: "No",
    },
    travelDreams: {
      dreamTrip1: "",
      dreamTrip2: "",
      dreamTrip3: "",
      excursion1: "",
      excursion2: "",
      excursion3: "",
      bestVacation: "",
      idealPlaceToLive: "",
      ownVacationProperty: "No",
    },
    lifestyleInterests: {
      activities: [] as string[],
      travelVibes: [] as string[],
      favoriteHotelChain: "",
      favoriteMotelChain: "",
    },
  });

  // Pre-defined values for selects/grids
  const travelClassOptions = [
    {
      value: "Economy",
      label: "Economy Class",
      desc: "Essential travel comfort",
      icon: Compass,
    },
    {
      value: "Premium Economy",
      label: "Premium Economy",
      desc: "Additional legroom & service",
      icon: Award,
    },
    {
      value: "Business Class",
      label: "Business Class",
      desc: "Lying flat & gourmet dining",
      icon: Star,
    },
    {
      value: "First Class",
      label: "First Class",
      desc: "Five-star premium hospitality",
      icon: Sparkles,
    },
    {
      value: "Private Jet",
      label: "Private Jet",
      desc: "Complete bespoke autonomy",
      icon: Plane,
    },
  ];

  const activityOptions = [
    { id: "Yachting", label: "Yachting & Sailing", icon: Anchor },
    { id: "Skiing", label: "Skiing & Snowboarding", icon: Activity },
    { id: "Fine Dining", label: "Fine Dining", icon: Sparkles },
    { id: "Art Galleries", label: "Art Galleries", icon: Landmark },
    { id: "Golfing", label: "Golfing", icon: TargetIcon },
    { id: "Spa Wellness", label: "Spa & Wellness", icon: Heart },
    { id: "Safari", label: "Wildlife Safari", icon: Compass },
    { id: "Wine Tasting", label: "Wine Tasting", icon: Smile },
  ];

  const vibeOptions = [
    { id: "Adventure", label: "Adrenaline & Adventure" },
    { id: "Relaxation", label: "Zen & Relaxation" },
    { id: "Luxury", label: "Ultra Luxury" },
    { id: "Cultural", label: "Cultural Heritage" },
    { id: "Solo", label: "Solo Wandering" },
    { id: "Family", label: "Family Memories" },
    { id: "Eco-tourism", label: "Eco & Nature" },
  ];

  // Helper custom icon since Target isn't direct
  function TargetIcon({ size = 16, width, height, ...props }: any) {
    const iconSize = size || width || 16;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }

  // Handle inputs
  const handlePersonalProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      personalProfile: {
        ...prev.personalProfile,
        [name]: value,
      },
    }));
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTravelPrefChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      travelPreferences: {
        ...prev.travelPreferences,
        [field]: value,
      },
    }));
  };

  const handleTravelDreamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      travelDreams: {
        ...prev.travelDreams,
        [name]: value,
      },
    }));
  };

  const handleDreamRadioChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      travelDreams: {
        ...prev.travelDreams,
        ownVacationProperty: value,
      },
    }));
  };

  const handleLifestyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      lifestyleInterests: {
        ...prev.lifestyleInterests,
        [name]: value,
      },
    }));
  };

  const toggleActivity = (activityId: string) => {
    setFormData((prev) => {
      const current = prev.lifestyleInterests.activities;
      const updated = current.includes(activityId)
        ? current.filter((a) => a !== activityId)
        : [...current, activityId];
      return {
        ...prev,
        lifestyleInterests: {
          ...prev.lifestyleInterests,
          activities: updated,
        },
      };
    });
  };

  const toggleVibe = (vibeId: string) => {
    setFormData((prev) => {
      const current = prev.lifestyleInterests.travelVibes;
      const updated = current.includes(vibeId)
        ? current.filter((v) => v !== vibeId)
        : [...current, vibeId];
      return {
        ...prev,
        lifestyleInterests: {
          ...prev.lifestyleInterests,
          travelVibes: updated,
        },
      };
    });
  };

  // Step validation
  const validateStep = () => {
    const currentErrors: Record<string, string> = {};

    if (currentStep === 1) {
      const {
        name,
        username,
        email,
        password,
        confirmPassword,
        phone,
        dob,
        location,
        gender,
      } = formData.personalProfile;
      if (!name.trim()) currentErrors.name = "Full Name is required";
      if (!username.trim()) currentErrors.username = "Username is required";
      if (!email.trim()) {
        currentErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        currentErrors.email = "Invalid email format";
      }
      if (!password) {
        currentErrors.password = "Password is required";
      } else if (password.length < 6) {
        currentErrors.password = "Password must be at least 6 characters";
      }
      if (password !== confirmPassword) {
        currentErrors.confirmPassword = "Passwords do not match";
      }
      if (!phone.trim()) currentErrors.phone = "Phone number is required";
      const ageVal = dob || (formData.personalProfile as any).ageGroup;
      if (!ageVal) currentErrors.dob = "Age Group selection is required";
      if (!location.trim())
        currentErrors.location = "Location is required";
      if (!gender) currentErrors.gender = "Gender selection is required";
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError("");
    if (validateStep()) {
      setIsSubmitting(true);
      try {
        localStorage.setItem("flydna_onboarding", JSON.stringify(formData));
        const regPayload = {
          name: formData.personalProfile.name,
          email: formData.personalProfile.email,
          password: formData.personalProfile.password,
          phone: formData.personalProfile.phone,
          country: formData.personalProfile.location,
        };

        await register(regPayload);
        const loginResult = await login(
          formData.personalProfile.email,
          formData.personalProfile.password,
        );

        if (loginResult && loginResult.token) {
          localStorage.setItem("flydna_token", loginResult.token);
          localStorage.setItem("flydna_user", JSON.stringify(loginResult.user));
          window.dispatchEvent(new Event("auth-changed"));
          router.replace("/");
        } else {
          router.push("/auth?mode=login");
        }
      } catch (err: any) {
        setSubmitError(err.message || "Registration failed.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#020814] text-white flex flex-col items-center justify-center relative overflow-hidden py-12 px-4 md:px-6">
      {/* GhostCursor trails */}
      <Suspense fallback={null}>
        <GhostCursor
          // Visuals
          color="#22D3EE"
          brightness={2}
          edgeIntensity={0}
          // Trail and motion
          trailLength={20}
          inertia={0.01}
          // Post-processing
          grainIntensity={0.0}
          bloomStrength={0.05}
          bloomRadius={0.5}
          bloomThreshold={0.05}
          // Performance / Resolution
          targetPixels={300000}
          // Fade-out behavior
          fadeDelayMs={1000}
          fadeDurationMs={1500}
        />
      </Suspense>

      {/* Animated glowing liquid blobs background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute left-1/4 -top-20 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-1)_0%,transparent_70%)] animate-blob-1" />
        <div className="absolute right-10 top-32 h-[450px] w-[450px] bg-[radial-gradient(circle,var(--blob-color-2)_0%,transparent_70%)] animate-blob-2" />
        <div className="absolute -bottom-20 left-1/3 h-[550px] w-[550px] bg-[radial-gradient(circle,var(--blob-color-3)_0%,transparent_70%)] animate-blob-3" />
      </div>

      <div className="w-full max-w-[760px] z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="text-center mb-2 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
            FlyDnA Onboarding
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Configure your bespoke aeronautical flight profiles
          </p>
        </div>

        {/* Custom Progress Stepper */}
        <div className="glass-panel-light rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">
            <span>Progress Indicator</span>
            <span className="text-cyan-400">Step {currentStep} of 4</span>
          </div>
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden w-full border border-white/5">
            <motion.div
              initial={{ width: "12.5%" }}
              animate={{ width: `${(currentStep - 0.5) * 25}%` }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(0,174,255,0.5)]"
            />
          </div>
          <div className="grid grid-cols-4 text-center text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
            <span
              className={
                currentStep >= 1 ? "text-cyan-300 font-black" : "text-slate-600"
              }
            >
              Journey Plan
            </span>
            <span
              className={
                currentStep >= 2 ? "text-cyan-300 font-black" : "text-slate-600"
              }
            >
              Preferences
            </span>
            <span
              className={
                currentStep >= 3 ? "text-cyan-300 font-black" : "text-slate-600"
              }
            >
              Dreams
            </span>
            <span
              className={
                currentStep >= 4 ? "text-cyan-300 font-black" : "text-slate-600"
              }
            >
              Lifestyle
            </span>
          </div>
        </div>

        {/* Main Onboarding Glass Form */}
        <motion.div
          layout
          className="glass-panel-heavy border border-cyan-400/20 bg-[#06111f]/95 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-md rounded-3xl p-6 md:p-8"
        >
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6 text-left"
          >
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="border-b border-white/5 pb-2 mb-4">
                    <h3 className="text-base font-extrabold text-cyan-300 uppercase tracking-wider">
                      Step 1: Your Journey Plan
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      Please establish your core personal identity credentials.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-200">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Full Name
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <User size={14} />
                        </span>
                        <input
                          type="text"
                          name="name"
                          value={formData.personalProfile.name}
                          onChange={handlePersonalProfileChange}
                          placeholder="Alex Mercer"
                          className={`w-full bg-[#020814]/80 border ${errors.name ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                      </div>
                      {errors.name && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    {/* Username */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black">
                          @
                        </span>
                        <input
                          type="text"
                          name="username"
                          value={formData.personalProfile.username}
                          onChange={handlePersonalProfileChange}
                          placeholder="alexmercer"
                          className={`w-full bg-[#020814]/80 border ${errors.username ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                      </div>
                      {errors.username && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.username}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Email Address
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Mail size={14} />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={formData.personalProfile.email}
                          onChange={handlePersonalProfileChange}
                          placeholder="alex.mercer@flydna.com"
                          className={`w-full bg-[#020814]/80 border ${errors.email ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                      </div>
                      {errors.email && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Phone size={14} />
                        </span>
                        <input
                          type="text"
                          name="phone"
                          value={formData.personalProfile.phone}
                          onChange={handlePersonalProfileChange}
                          placeholder="+1 (514) 555-0199"
                          className={`w-full bg-[#020814]/80 border ${errors.phone ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                      </div>
                      {errors.phone && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.phone}
                        </span>
                      )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Password
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Lock size={14} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.personalProfile.password}
                          onChange={handlePersonalProfileChange}
                          placeholder="••••••••••••"
                          className={`w-full bg-[#020814]/80 border ${errors.password ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        >
                          {showPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.password}
                        </span>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Lock size={14} />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.personalProfile.confirmPassword}
                          onChange={handlePersonalProfileChange}
                          placeholder="••••••••••••"
                          className={`w-full bg-[#020814]/80 border ${errors.confirmPassword ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.confirmPassword}
                        </span>
                      )}
                    </div>

                    {/* Age Group */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide font-bold">
                        Age Group
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                          <Calendar size={14} />
                        </span>
                        <select
                          name="dob"
                          value={formData.personalProfile.dob}
                          onChange={handlePersonalProfileChange}
                          className={`w-full bg-[#020814]/80 border ${errors.dob ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-400/50 transition font-semibold appearance-none cursor-pointer`}
                        >
                          <option value="" disabled className="bg-[#0b1329] text-slate-400">Select Age Group</option>
                          <option value="18 - 24" className="bg-[#0b1329] text-slate-200">18 - 24</option>
                          <option value="25 - 34" className="bg-[#0b1329] text-slate-200">25 - 34</option>
                          <option value="35 - 44" className="bg-[#0b1329] text-slate-200">35 - 44</option>
                          <option value="45 - 54" className="bg-[#0b1329] text-slate-200">45 - 54</option>
                          <option value="55 - 64" className="bg-[#0b1329] text-slate-200">55 - 64</option>
                          <option value="65+" className="bg-[#0b1329] text-slate-200">65+</option>
                        </select>
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <ChevronDown size={14} />
                        </span>
                      </div>
                      {errors.dob && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.dob}
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Location
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Globe size={14} />
                        </span>
                        <input
                          type="text"
                          name="location"
                          value={formData.personalProfile.location}
                          onChange={handlePersonalProfileChange}
                          placeholder="Canada"
                          className={`w-full bg-[#020814]/80 border ${errors.location ? "border-red-500/50" : "border-white/10"} rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold`}
                        />
                      </div>
                      {errors.location && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.location}
                        </span>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Male", "Female", "Prefer Not To Say"].map((g) => {
                          const isSelected =
                            formData.personalProfile.gender === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  personalProfile: {
                                    ...prev.personalProfile,
                                    gender: g,
                                  },
                                }));
                                if (errors.gender) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    gender: "",
                                  }));
                                }
                              }}
                              className={`py-3 text-center text-xs font-bold rounded-xl transition cursor-pointer border ${
                                isSelected
                                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,174,255,0.15)]"
                                  : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                      {errors.gender && (
                        <span className="text-[10px] text-red-400 font-bold">
                          {errors.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-white/5 pb-2 mb-4">
                    <h3 className="text-base font-extrabold text-cyan-300 uppercase tracking-wider">
                      Step 2: Travel Preferences
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      Please indicate your general in-flight services
                      preferences.
                    </p>
                  </div>

                  {/* Preferred Travel Class Custom Selection Cards */}
                  <div className="space-y-3">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Preferred Travel Cabin
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {travelClassOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected =
                          formData.travelPreferences.preferredClass ===
                          opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              handleTravelPrefChange(
                                "preferredClass",
                                opt.value,
                              )
                            }
                            className={`p-4 flex items-center justify-between text-left rounded-2xl border transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-cyan-950/20 to-blue-950/20 border-cyan-400/40 text-white shadow-[0_0_20px_rgba(0,174,255,0.15)]"
                                : "bg-white/[0.01] border-white/5 text-slate-300 hover:border-white/15 hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`p-2.5 rounded-xl border transition-colors ${
                                  isSelected
                                    ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300"
                                    : "bg-white/5 border-white/10 text-slate-400"
                                }`}
                              >
                                <Icon size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black tracking-wide text-slate-100">
                                  {opt.label}
                                </h4>
                                <p className="text-xs text-slate-400 mt-0.5 font-semibold">
                                  {opt.desc}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`size-5 rounded-full border flex items-center justify-center transition ${
                                isSelected
                                  ? "border-cyan-400 bg-cyan-500 text-white"
                                  : "border-slate-600"
                              }`}
                            >
                              {isSelected && (
                                <Check size={11} strokeWidth={3} />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Yes/No Selectors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
                    {/* Private Flight */}
                    <div className="space-y-2.5 text-left">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Ever Flown Private Jet?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Yes", "No"].map((v) => {
                          const isSelected =
                            formData.travelPreferences.everFlownPrivate === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() =>
                                handleTravelPrefChange("everFlownPrivate", v)
                              }
                              className={`py-3 text-center text-xs font-bold rounded-xl transition cursor-pointer border ${
                                isSelected
                                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,174,255,0.15)]"
                                  : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* First Class flight */}
                    <div className="space-y-2.5 text-left">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Ever Flown Commercial First Class?
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {["Yes", "No"].map((v) => {
                          const isSelected =
                            formData.travelPreferences.everFlownFirstClass ===
                            v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() =>
                                handleTravelPrefChange("everFlownFirstClass", v)
                              }
                              className={`py-3 text-center text-xs font-bold rounded-xl transition cursor-pointer border ${
                                isSelected
                                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_15px_rgba(0,174,255,0.15)]"
                                  : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="border-b border-white/5 pb-2 mb-4">
                    <h3 className="text-base font-extrabold text-cyan-300 uppercase tracking-wider">
                      Step 3: Travel Dreams
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      Tell us about your custom locations and wanderlust
                      properties.
                    </p>
                  </div>

                  <div className="space-y-5 font-bold text-slate-200 text-xs">
                    {/* Dream Trips */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        1. Tell Me 3 Places You've Never Been and Would Love to Go?
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            1.
                          </span>
                          <input
                            type="text"
                            name="dreamTrip1"
                            value={formData.travelDreams.dreamTrip1}
                            onChange={handleTravelDreamChange}
                            placeholder="Kyoto Cherry Blossoms"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            2.
                          </span>
                          <input
                            type="text"
                            name="dreamTrip2"
                            value={formData.travelDreams.dreamTrip2}
                            onChange={handleTravelDreamChange}
                            placeholder="Amalfi Coast Cruise"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            3.
                          </span>
                          <input
                            type="text"
                            name="dreamTrip3"
                            value={formData.travelDreams.dreamTrip3}
                            onChange={handleTravelDreamChange}
                            placeholder="Reykjavik Northern Lights"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Excursions */}
                    <div className="space-y-2 pt-2">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        2. 3 Excursion(s) You Would Love to Do This Year
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            1.
                          </span>
                          <input
                            type="text"
                            name="excursion1"
                            value={formData.travelDreams.excursion1}
                            onChange={handleTravelDreamChange}
                            placeholder="Deep Sea Submersible tour"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            2.
                          </span>
                          <input
                            type="text"
                            name="excursion2"
                            value={formData.travelDreams.excursion2}
                            onChange={handleTravelDreamChange}
                            placeholder="Suborbital Zero-G Flight"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-extrabold">
                            3.
                          </span>
                          <input
                            type="text"
                            name="excursion3"
                            value={formData.travelDreams.excursion3}
                            onChange={handleTravelDreamChange}
                            placeholder="Himalayan Heli-skiing"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Best Vacation & Ideal Place */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                          Best Vacation Destination So Far
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                            <Star size={14} />
                          </span>
                          <input
                            type="text"
                            name="bestVacation"
                            value={formData.travelDreams.bestVacation}
                            onChange={handleTravelDreamChange}
                            placeholder="Bora Bora Luxury Bungalow"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                          Ideal Place to Live
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                            <MapPin size={14} />
                          </span>
                          <input
                            type="text"
                            name="idealPlaceToLive"
                            value={formData.travelDreams.idealPlaceToLive}
                            onChange={handleTravelDreamChange}
                            placeholder="Alpine Swiss Chalet"
                            className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Favorite Music Artist Input Box */}
                    <div className="space-y-2 text-left pt-2 md:col-span-2">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        3. Name Your Favorite Music Artist(s)
                      </span>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400">
                          🎵
                        </span>
                        <input
                          type="text"
                          name="favoriteMusicArtist"
                          value={(formData.travelDreams as any).favoriteMusicArtist || ""}
                          onChange={handleTravelDreamChange}
                          placeholder="e.g. Don Toliver, Drake, Travis Scott"
                          className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Used to deliver real-time tour dates, concert alerts, and live event deals directly in your Lobby.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="border-b border-white/5 pb-2 mb-4">
                    <h3 className="text-base font-extrabold text-cyan-300 uppercase tracking-wider">
                      Step 4: Lifestyle & Interests
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">
                      Finalize your aesthetic preferences and accommodation
                      profiles.
                    </p>
                  </div>

                  {/* Activities grid */}
                  <div className="space-y-2.5">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      Select Curated Activities (Select all that apply)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activityOptions.map((act) => {
                        const Icon = act.icon;
                        const isSelected =
                          formData.lifestyleInterests.activities.includes(
                            act.id,
                          );
                        return (
                          <button
                            key={act.id}
                            type="button" // standard React button
                            onClick={() => toggleActivity(act.id)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-cyan-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(0,174,255,0.1)]"
                                : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200"
                            }`}
                          >
                            <Icon size={16} />
                            <span className="text-[10px] font-extrabold tracking-wide">
                              {act.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Travel Vibes grid */}
                  <div className="space-y-2.5 pt-2">
                    <span className="block text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      Travel Vibe Profile
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {vibeOptions.map((vibe) => {
                        const isSelected =
                          formData.lifestyleInterests.travelVibes.includes(
                            vibe.id,
                          );
                        return (
                          <button
                            key={vibe.id}
                            type="button"
                            onClick={() => toggleVibe(vibe.id)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all cursor-pointer ${
                              isSelected
                                ? "bg-gradient-to-r from-cyan-400/10 to-blue-500/15 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(0,174,255,0.1)]"
                                : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300"
                            }`}
                          >
                            {vibe.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Favorite Chains */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-bold text-slate-200 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Favorite Hotel Chain
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Sparkles size={14} />
                        </span>
                        <input
                          type="text"
                          name="favoriteHotelChain"
                          value={formData.lifestyleInterests.favoriteHotelChain}
                          onChange={handleLifestyleChange}
                          placeholder="Aman Resorts / Four Seasons"
                          className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-400 text-[10px] uppercase tracking-wide">
                        Favorite Motel Chain
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                          <Activity size={14} />
                        </span>
                        <input
                          type="text"
                          name="favoriteMotelChain"
                          value={formData.lifestyleInterests.favoriteMotelChain}
                          onChange={handleLifestyleChange}
                          placeholder="Motel 6 / Super 8"
                          className="w-full bg-[#020814]/80 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50 transition font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center mt-6">
                {submitError}
              </div>
            )}

            {/* Stepper Navigation Actions */}
            <div className="flex items-center justify-between border-t border-white/5 pt-5 mt-8">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_15px_rgba(0,174,255,0.3)] cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <span>Continue</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit()}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(0,174,255,0.35)] cursor-pointer flex items-center gap-2 ml-auto disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Journey Setup</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
