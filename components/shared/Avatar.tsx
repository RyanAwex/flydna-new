import React from "react";

type AvatarProps = {
  name: string;
  gradient: string;
  size: "sm" | "md";
  avatarUrl?: string;
};

export default function Avatar({
  name,
  gradient,
  size,
  avatarUrl,
}: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className={`grid place-items-center rounded-full bg-gradient-to-br ${gradient} font-bold text-white shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.5),_0_6px_15px_rgba(0,0,0,0.25)] border border-white/10 ${
        size === "sm" ? "size-12 text-sm" : "size-full text-base"
      } overflow-hidden`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="size-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
