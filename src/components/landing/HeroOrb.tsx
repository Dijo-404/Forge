"use client";

/**
 * HeroOrb — design.md spec, Forge electric-blue grade.
 * Source: https://future.co/images/homepage/glassy-orb/orb-purple.webm
 * mix-blend-screen filters out the black background so the orb floats on white.
 * The CSS filter rotates hue from purple → Forge electric blue.
 */

import { useEffect, useRef } from "react";

export function HeroOrb() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Try to nudge autoplay on browsers that gate it
    const play = () => v.play().catch(() => {});
    play();
    v.addEventListener("canplay", play, { once: true });
    return () => v.removeEventListener("canplay", play);
  }, []);

  return (
    <div className="relative w-full aspect-square pointer-events-none select-none">
      {/* Soft glow underlay so the orb reads on pure white */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div
          className="h-[88%] w-[88%] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(0,132,255,0.25) 0%, rgba(0,132,255,0) 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Concentric rotating rings — pure CSS, GPU-accelerated */}
      <div
        className="absolute inset-0 animate-slow-spin"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(0,132,255,0) 0%, rgba(0,132,255,0.06) 22%, rgba(0,132,255,0) 44%, rgba(49,154,255,0.10) 70%, rgba(0,132,255,0) 100%)",
          maskImage:
            "radial-gradient(circle, transparent 38%, black 40%, black 47%, transparent 49%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 38%, black 40%, black 47%, transparent 49%)",
        }}
        aria-hidden
      />

      <video
        ref={ref}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="relative h-full w-full scale-125 object-cover"
        style={{
          mixBlendMode: "screen",
          filter:
            "hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)",
        }}
        // Local fallback path is /orb.webm — Next.js will 404 cleanly if absent
        // and the remote is allowlisted in next.config.ts via remotePatterns.
      >
        <source src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" type="video/webm" />
      </video>

      {/* Floating sparks around the orb */}
      <div className="absolute inset-0">
        {[
          { top: "12%", left: "78%", size: 4, delay: "0s" },
          { top: "60%", left: "92%", size: 3, delay: "1.2s" },
          { top: "82%", left: "18%", size: 5, delay: "2.1s" },
          { top: "30%", left: "8%",  size: 3, delay: "0.6s" },
          { top: "70%", left: "55%", size: 2, delay: "1.8s" },
        ].map((s, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-[var(--color-brand-500)] animate-float"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              boxShadow: `0 0 ${s.size * 4}px rgba(0,132,255,0.65)`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
    </div>
  );
}
