"use client";

import React from "react";

export default function StainedGlassMosaicBackground() {
  // SVG Defs layer containing our rich gradients and specular glow filters
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

      {/* Edge Glow Gradients */}
      <linearGradient id="edge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
      </linearGradient>

      {/* Soft Illumination Filter */}
      <filter id="glow-blur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // Reusable architectural glass shards (path coordinates)
  // Drawn as amorphous, swept curves that overlap and interlock
  const OrganicShards = () => (
    <>
      {/* Top Shard */}
      <g className="shard-drift-1 transform-gpu will-change-transform" style={{ transformOrigin: '100px 200px' }}>
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
          filter="url(#glow-blur)" 
        />
      </g>

      {/* Middle Shard */}
      <g className="shard-drift-2 transform-gpu will-change-transform" style={{ transformOrigin: '150px 600px' }}>
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
          filter="url(#glow-blur)" 
        />
      </g>

      {/* Bottom Shard */}
      <g className="shard-drift-3 transform-gpu will-change-transform" style={{ transformOrigin: '100px 900px' }}>
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
          filter="url(#glow-blur)" 
        />
      </g>

      {/* Floating Highlight / Overlay Shard */}
      <g className="shard-drift-4 transform-gpu will-change-transform" style={{ transformOrigin: '50px 450px' }}>
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
          filter="url(#glow-blur)" 
        />
      </g>
    </>
  );

  return (
    // Z-Index locked to background.
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      
      {/* Left Margin Organic Glass */}
      <svg 
        className="absolute top-0 left-0 w-[450px] h-[120vh]" 
        viewBox="0 0 450 1400" 
        preserveAspectRatio="xMinYMin slice" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {svgDefs}
        {OrganicShards()}
      </svg>

      {/* Right Margin Organic Glass */}
      <svg 
        className="absolute top-0 right-0 w-[450px] h-[120vh]" 
        viewBox="0 0 450 1400" 
        preserveAspectRatio="xMaxYMin slice" 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ transform: 'scaleX(-1)' }}
      >
        {/* We recreate the defs here so the flipped SVG can reference its own gradients cleanly */}
        {svgDefs}
        {OrganicShards()}
      </svg>

      {/* 
        Hardware Accelerated CSS Animations
        We use varying durations and sine-wave easing for an organic, hypnotic breathing effect.
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drift-1 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(15px, 20px) rotate(2deg) scale(1.02); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes drift-2 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(-10px, 30px) rotate(-1deg) scale(0.98); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes drift-3 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(20px, -15px) rotate(1.5deg) scale(1.03); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes drift-4 {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          50% { transform: translate(-25px, -10px) rotate(-2deg) scale(0.97); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }

        .shard-drift-1 { animation: drift-1 18s ease-in-out infinite; }
        .shard-drift-2 { animation: drift-2 24s ease-in-out infinite; }
        .shard-drift-3 { animation: drift-3 21s ease-in-out infinite; }
        .shard-drift-4 { animation: drift-4 28s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .shard-drift-1, .shard-drift-2, .shard-drift-3, .shard-drift-4 {
            animation: none !important;
            transform: none !important;
          }
        }
      `}} />
    </div>
  );
}
