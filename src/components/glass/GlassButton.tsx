"use client";

import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "cta" | "ghost" | "soft" | "outline";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  children: ReactNode;
}

const sizeStyles: Record<Size, string> = {
  sm: "h-9  px-4  text-sm",
  md: "h-12 px-5  text-[15px]",
  lg: "h-14 px-7  text-base",
};

const variantStyles: Record<Variant, string> = {
  cta: "glass-cta text-white font-medium tracking-tight",
  ghost:
    "bg-white/40 backdrop-blur-[20px] border border-black/10 text-[var(--color-ink-primary)] hover:bg-white/60",
  soft:
    "glass-soft text-[var(--color-ink-primary)] hover:bg-white/70",
  outline:
    "bg-transparent border border-[var(--color-brand-600)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]",
};

interface ArrowProps {
  className?: string;
}
function ArrowIcon({ className }: ArrowProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--color-brand-700)] shadow-sm",
        className
      )}
      aria-hidden
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export interface GlassButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> {}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(function GlassButton(
  { variant = "cta", size = "md", icon, iconPosition = "right", className, children, ...rest },
  ref
) {
  const showArrow = icon === undefined && variant === "cta";
  return (
    <button
      ref={ref}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-[16px] transition-transform duration-200 will-change-transform",
        "hover:scale-[1.02] active:scale-[0.98]",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      {iconPosition === "left" && icon ? <span>{icon}</span> : null}
      <span>{children}</span>
      {iconPosition === "right" && icon ? <span>{icon}</span> : null}
      {showArrow ? <ArrowIcon /> : null}
    </button>
  );
});

interface GlassLinkProps extends BaseProps {
  href: string;
  external?: boolean;
}

export function GlassLink({
  href,
  external,
  variant = "cta",
  size = "md",
  icon,
  iconPosition = "right",
  className,
  children,
}: GlassLinkProps) {
  const showArrow = icon === undefined && variant === "cta";
  const inner = (
    <span
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-[16px] transition-transform duration-200 will-change-transform",
        "hover:scale-[1.02] active:scale-[0.98]",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {iconPosition === "left" && icon ? <span>{icon}</span> : null}
      <span>{children}</span>
      {iconPosition === "right" && icon ? <span>{icon}</span> : null}
      {showArrow ? <ArrowIcon /> : null}
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}
