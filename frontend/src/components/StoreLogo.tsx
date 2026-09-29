"use client";

import Image from "next/image";
import { Flame, LucideIcon } from "lucide-react";
import { isLocalPublicAsset, resolveMediaUrl } from "@/lib/media-url";

type StoreLogoProps = {
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackClassName?: string;
  iconClassName?: string;
  rounded?: "full" | "xl" | "2xl";
};

const SIZE = {
  sm: { box: "h-9 w-9", icon: 17, sizes: "36px" },
  md: { box: "h-10 w-10", icon: 18, sizes: "40px" },
  lg: { box: "h-10 w-10 sm:h-11 sm:w-11", icon: 20, sizes: "44px" },
} as const;

const ROUNDED = {
  full: "rounded-full",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
} as const;

export function StoreLogo({
  logoUrl,
  size = "md",
  className = "",
  fallbackClassName = "bg-brand-600 text-white",
  iconClassName = "",
  rounded = "xl",
}: StoreLogoProps) {
  const spec = SIZE[size];
  const round = ROUNDED[rounded];
  const trimmed = logoUrl?.trim();

  if (!trimmed) {
    return (
      <span
        className={`grid ${spec.box} shrink-0 place-items-center ${round} ${fallbackClassName} ${className}`}
      >
        <Flame size={spec.icon} strokeWidth={2.2} className={iconClassName} />
      </span>
    );
  }

  const src = resolveMediaUrl(trimmed);
  const shell = `relative ${spec.box} shrink-0 overflow-hidden ${round} border border-stone-200/80 bg-white ${className}`;

  if (isLocalPublicAsset(src)) {
    return (
      <span className={shell}>
        <Image src={src} alt="" fill className="object-contain p-1" sizes={spec.sizes} />
      </span>
    );
  }

  return (
    <span className={shell}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-contain p-1" />
    </span>
  );
}

export function StoreLogoOrIcon({
  logoUrl,
  icon: Icon,
  size = "md",
  className = "",
  iconClassName = "",
}: {
  logoUrl?: string | null;
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}) {
  if (logoUrl?.trim()) {
    return <StoreLogo logoUrl={logoUrl} size={size} className={className} rounded="xl" />;
  }

  const spec = SIZE[size];
  return (
    <span className={`grid ${spec.box} shrink-0 place-items-center rounded-xl bg-brand-600 text-white ${className}`}>
      <Icon size={spec.icon} className={iconClassName} />
    </span>
  );
}
