/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Settings, BadgeCheck, Star, Camera, X, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

type UserProfile = {
  name: string;
  handle: string;
  email: string;
  phone: string;
  flydnaId?: string;
  rating?: number;
  verifiedTraveler?: boolean;
  avatarUrl?: string;
  trips?: number;
  calls?: number;
};

type UserIdentityCardProps = {
  userProfile: UserProfile;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  onProfileUpdate?: (profile: Partial<UserProfile>) => void;
  isStealth?: boolean;
};

export default function UserIdentityCard({
  userProfile,
  isSettingsOpen,
  setIsSettingsOpen,
  onProfileUpdate,
  isStealth = false,
}: UserIdentityCardProps) {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSignOut = () => {
    localStorage.removeItem("flydna_token");
    localStorage.removeItem("flydna_user");
    window.dispatchEvent(new Event("auth-changed"));
    router.replace("/auth?mode=login");
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account?")) {
      try {
        const token = localStorage.getItem("flydna_token");
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";

        let res = await fetch(`${apiBaseUrl}/api/user/account`, {
          method: "DELETE",
          headers: { "auth-token": token || "" },
        });

        if (res.status === 404) {
          res = await fetch(`${apiBaseUrl}/api/user`, {
            method: "DELETE",
            headers: { "auth-token": token || "" },
          });
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const isUserNotFound =
            res.status === 404 &&
            ((errorData.error && errorData.error.includes("User not found")) ||
              (errorData.message &&
                errorData.message.includes("User not found")));

          if (!isUserNotFound) {
            throw new Error(
              errorData.message ||
                errorData.error ||
                `HTTP error ${res.status}`,
            );
          }
        }

        alert("Account deleted successfully!");
        localStorage.removeItem("flydna_token");
        localStorage.removeItem("flydna_user");
        localStorage.removeItem("flydna_onboarding");
        window.dispatchEvent(new Event("auth-changed"));
        router.replace("/auth?mode=login");
      } catch (err: any) {
        alert(`Failed to delete account: ${err.message || err}`);
      }
    }
  };

  // Avatar edit controls
  const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = React.useState("");
  const [socialStats, setSocialStats] = React.useState({
    trips: 0,
    connections: 0,
    socialScore: 0,
    tier: "Standard",
    discount: 0,
  });
  React.useEffect(() => {
    const token = localStorage.getItem("flydna_token");
    if (!token) return;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://staging.flydna.io";
    fetch(`${apiBase}/api/social-score`, {
      headers: { Authorization: `Bearer ${token}`, "auth-token": token },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setSocialStats(data.data);
      })
      .catch(() => {});
  }, []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const presets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", // Cyberpunk female vibe
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", // Tech traveler male vibe
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", // Premium traveler female vibe
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", // Executive traveler male vibe
  ];

  const getInitials = (name: string) => {
    if (!name) return "BU";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (onProfileUpdate) {
          onProfileUpdate({ avatarUrl: base64String });
        }
        setIsAvatarModalOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUrl = () => {
    if (avatarUrlInput.trim()) {
      if (onProfileUpdate) {
        onProfileUpdate({ avatarUrl: avatarUrlInput.trim() });
      }
      setIsAvatarModalOpen(false);
      setAvatarUrlInput("");
    }
  };

  const handleSelectPreset = (url: string) => {
    if (onProfileUpdate) {
      onProfileUpdate({ avatarUrl: url });
    }
    setIsAvatarModalOpen(false);
  };

  const handleRemoveAvatar = () => {
    if (onProfileUpdate) {
      onProfileUpdate({ avatarUrl: "" });
    }
    setIsAvatarModalOpen(false);
  };

  return (
    <div className="glass-panel-heavy relative overflow-hidden rounded-[26px] p-4 pb-3 bg-[radial-gradient(circle_at_50%_0%,rgba(0,200,255,0.12),transparent_50%)] h-full flex flex-col justify-between">
      {/* Settings Button */}
      <div className="absolute top-3 right-3 z-50">
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={`p-2 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/10 hover:border-cyan-400/35 hover:scale-105 active:scale-95 transition cursor-pointer text-slate-300 hover:text-white ${
            isSettingsOpen
              ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-300 animate-pulse"
              : ""
          }`}
          title="Smart Preferences"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Identity Details */}
      <div className="flex flex-col items-center text-center mt-1">
        <div className="relative size-20 mb-3">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 blur-md opacity-75 animate-pulse" />
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative size-full rounded-full bg-[#06111f] p-[3px] border border-cyan-400/35 shadow-[0_0_20px_rgba(0,200,255,0.3)] cursor-pointer group/avatar overflow-hidden z-20"
            title="Edit Profile Picture"
          >
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name || "User Avatar"}
                className="w-full h-full rounded-full object-cover relative z-0"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-300 to-blue-600 flex items-center justify-center font-bold text-2xl text-white select-none relative z-0">
                {getInitials(userProfile.name)}
              </div>
            )}

            {/* Edit overlay */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition duration-200 z-10">
              <Camera size={16} className="text-white mb-0.5" />
              <span className="text-[8px] font-black text-white uppercase tracking-wider">
                Edit
              </span>
            </div>
          </div>
          <span
            className={`absolute bottom-0.5 right-0.5 size-3.5 rounded-full border-2 border-[#06111f] ${isStealth ? "bg-slate-500" : "bg-emerald-400 shadow-[0_0_8px_#34d399]"} z-30`}
          />
        </div>

        <div className="flex items-center gap-1.5 justify-center mb-0.5">
          <h2 className="text-lg font-bold tracking-tight text-white">
            {userProfile.name || "Alex Mercer"}
          </h2>
          <BadgeCheck
            size={16}
            className="text-cyan-400 drop-shadow-[0_0_5px_rgba(0,200,255,0.5)]"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400 tracking-wider">
          @{userProfile.handle || "alexmercer"}
        </span>

        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {[
            { label: "Trips", val: String(socialStats.trips ?? 0) },
            { label: "Network", val: String(socialStats.connections ?? 0) },
            {
              label: "Score",
              val: String(socialStats.socialScore ?? 0) + "/100",
              isStar: false,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/[0.02] border border-white/5 p-2 rounded-2xl flex flex-col items-center"
            >
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide mb-0.5">
                {stat.label}
              </span>
              <span className="text-sm font-bold text-slate-100 flex items-center gap-0.5">
                {stat.val}
                {stat.isStar && (
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="w-full grid mt-4">
          <button
            onClick={handleDeleteAccount}
            className="py-2 px-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 active:scale-95 text-red-400 hover:text-red-300 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-center"
          >
            Delete Account
          </button>
        </div>

        <div className="w-full border-t border-white/5 mt-4 pt-3 text-left flex justify-between text-[10px] font-semibold text-slate-500">
          <span>ID: {userProfile.flydnaId || "FDNA-2048"}</span>
          <span>MEMBER SINCE: 2026</span>
        </div>
      </div>

      {/* Avatar Edit Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div
            className="w-full max-w-sm glass-panel-heavy rounded-3xl p-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-5 relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(0,229,255,0.08),transparent_50%)] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14} /> Update Profile Avatar
              </h3>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Upload Section */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Upload Local File
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/50 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
              >
                <Upload size={14} className="text-cyan-400" /> Select Image File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Preset Avatars */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Choose From Presets
              </span>
              <div className="grid grid-cols-4 gap-3">
                {presets.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(url)}
                    className="relative aspect-square rounded-full overflow-hidden border border-white/10 hover:border-cyan-400 hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    <img
                      src={url}
                      alt={`Preset ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* URL Input Section */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Image Address (URL)
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="w-full bg-[#06111f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition font-medium"
                />
                <button
                  onClick={handleSaveUrl}
                  disabled={!avatarUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-extrabold hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Remove option */}
            {userProfile.avatarUrl && (
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={handleRemoveAvatar}
                  className="w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition cursor-pointer"
                >
                  REMOVE CURRENT PHOTO
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
