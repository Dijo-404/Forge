"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "strong" | "soft";
  rounded?: "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

const roundedMap: Record<NonNullable<GlassPanelProps["rounded"]>, string> = {
  md: "rounded-[12px]",
  lg: "rounded-[16px]",
  xl: "rounded-[20px]",
  "2xl": "rounded-[24px]",
  "3xl": "rounded-[32px]",
  full: "rounded-full",
};

export function GlassPanel({
  children,
  variant = "soft",
  rounded = "lg",
  className,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "glass-strong" : "glass-soft",
        roundedMap[rounded],
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
