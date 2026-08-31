"use client";

import React from "react";

/**
 * StainedGlassMosaicBackground
 *
 * Performance-hardened ambient background with organic glass shards.
 * - React.memo: Isolates from parent state churn (tab switches, timer polls).
 * - Zero SVG filters: Edge glow via native CSS drop-shadow (hardware-accelerated).
 * - 2 GPU layers total: One master <g> per side instead of 8 individual layers.
 */
function StainedGlassMosaicBackground() {
  // SVG Defs — gradients only, zero filters
  const svgDefs = (
    <defs>
      {/* Rich Translucent Fills */}
      <linearGradient id="glass-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
      </linearGradient>

      <linearGradient id="glass-2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#1e293b" stopOpacity="0.05" />
      </linearGradient>

      <linearGradient id="glass-3" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#020617" stopOpacity="0.03" />
      </linearGradient>

      {/* Edge Glow Gradient — applied as stroke, no filter needed */}
      <linearGradient id="edge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>
    </defs>
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">

      {/* Left Margin — single master GPU layer */}
      <svg
        className="absolute top-0 left-0 w-[450px] h-[120vh] drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]"
        viewBox="0 0 450 1400"
        preserveAspectRatio="xMinYMin slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {svgDefs}
        <g className="shard-drift-left transform-gpu will-change-transform">
          {/* Top Shard */}
          <path
            d="M-50,-50 C 250,-10 350,300 120,480 C 20,550 -50,450 -50,-50 Z"
            fill="url(#glass-1)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M-50,-50 C 250,-10 350,300 120,480 C 20,550 -50,450 -50,-50 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="3"
          />

          {/* Middle Shard */}
          <path
            d="M120,480 C 350,300 450,750 200,950 C 50,1100 -50,900 -50,600 C -50,600 20,550 120,480 Z"
            fill="url(#glass-2)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M120,480 C 350,300 450,750 200,950 C 50,1100 -50,900 -50,600 C -50,600 20,550 120,480 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="2"
          />

          {/* Bottom Shard */}
          <path
            d="M-50,600 C -50,900 50,1100 200,950 C 400,750 350,1200 150,1350 C -50,1400 -50,600 -50,600 Z"
            fill="url(#glass-3)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M-50,600 C -50,900 50,1100 200,950 C 400,750 350,1200 150,1350 C -50,1400 -50,600 -50,600 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="3"
          />

          {/* Floating Highlight Shard */}
          <path
            d="M-50,200 C 180,250 280,550 80,750 C -50,850 -100,500 -50,200 Z"
            fill="url(#glass-1)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <path
            d="M-50,200 C 180,250 280,550 80,750 C -50,850 -100,500 -50,200 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="4"
          />
        </g>
      </svg>

      {/* Right Margin — single master GPU layer, mirrored */}
      <svg
        className="absolute top-0 right-0 w-[450px] h-[120vh] drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]"
        viewBox="0 0 450 1400"
        preserveAspectRatio="xMaxYMin slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: 'scaleX(-1)' }}
      >
        {svgDefs}
        <g className="shard-drift-right transform-gpu will-change-transform">
          {/* Top Shard */}
          <path
            d="M-50,-50 C 250,-10 350,300 120,480 C 20,550 -50,450 -50,-50 Z"
            fill="url(#glass-1)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M-50,-50 C 250,-10 350,300 120,480 C 20,550 -50,450 -50,-50 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="3"
          />

          {/* Middle Shard */}
          <path
            d="M120,480 C 350,300 450,750 200,950 C 50,1100 -50,900 -50,600 C -50,600 20,550 120,480 Z"
            fill="url(#glass-2)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M120,480 C 350,300 450,750 200,950 C 50,1100 -50,900 -50,600 C -50,600 20,550 120,480 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="2"
          />

          {/* Bottom Shard */}
          <path
            d="M-50,600 C -50,900 50,1100 200,950 C 400,750 350,1200 150,1350 C -50,1400 -50,600 -50,600 Z"
            fill="url(#glass-3)"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <path
            d="M-50,600 C -50,900 50,1100 200,950 C 400,750 350,1200 150,1350 C -50,1400 -50,600 -50,600 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="3"
          />

          {/* Floating Highlight Shard */}
          <path
            d="M-50,200 C 180,250 280,550 80,750 C -50,850 -100,500 -50,200 Z"
            fill="url(#glass-1)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <path
            d="M-50,200 C 180,250 280,550 80,750 C -50,850 -100,500 -50,200 Z"
            fill="none"
            stroke="url(#edge-glow)"
            strokeWidth="4"
          />
        </g>
      </svg>

      {/* 
        CSS Animations — two master groups only.
        Asymmetric durations for organic, non-repeating visual cadence.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift-left {
          0%   { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33%  { transform: translate(12px, 18px) rotate(1.5deg) scale(1.01); }
          66%  { transform: translate(-8px, 10px) rotate(-0.5deg) scale(0.99); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes drift-right {
          0%   { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33%  { transform: translate(-15px, 12px) rotate(-1deg) scale(0.98); }
          66%  { transform: translate(10px, -8px) rotate(1deg) scale(1.02); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }

        .shard-drift-left  { animation: drift-left 22s ease-in-out infinite; }
        .shard-drift-right { animation: drift-right 26s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .shard-drift-left, .shard-drift-right {
            animation: none !important;
            transform: none !important;
          }
        }
      `}} />
    </div>
  );
}

export default React.memo(StainedGlassMosaicBackground);
