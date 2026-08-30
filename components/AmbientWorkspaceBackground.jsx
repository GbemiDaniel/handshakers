"use client";

import React from "react";

export default function AmbientWorkspaceBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      
      {/* --- Volumetric Orbs (Static/Atmospheric) --- */}
      {/* Left Orb: Deep Ocean Blue */}
      <div 
        className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[120px] transform-gpu"
        aria-hidden="true"
      />
      {/* Right Orb: Electric Cyan */}
      <div 
        className="absolute top-1/4 -right-32 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-500/15 rounded-full blur-[100px] transform-gpu"
        aria-hidden="true"
      />

      {/* --- Floating Geometry (Left Margin) --- */}
      {/* Abstract Isometric Cube */}
      <div className="absolute top-[20%] left-[5%] transform-gpu will-change-transform ambient-float-slow">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 10 L90 30 L50 50 L10 30 Z" 
            className="fill-slate-300/20 stroke-slate-400/40 dark:fill-white/10 dark:stroke-white/20"
            strokeWidth="1" 
          />
          <path 
            d="M10 30 L10 70 L50 90 L50 50 Z" 
            className="fill-slate-300/15 stroke-slate-400/30 dark:fill-white/5 dark:stroke-white/10"
            strokeWidth="1" 
          />
          <path 
            d="M90 30 L90 70 L50 90 L50 50 Z" 
            className="fill-slate-300/10 stroke-slate-400/35 dark:fill-white/8 dark:stroke-white/15"
            strokeWidth="1" 
          />
        </svg>
      </div>

      {/* Floating Translucent Ring */}
      <div className="absolute bottom-[25%] left-[8%] transform-gpu will-change-transform ambient-float-medium">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle 
            cx="50" 
            cy="50" 
            r="35" 
            className="fill-slate-300/20 stroke-slate-400/40 dark:fill-white/10 dark:stroke-white/20"
            strokeWidth="2" 
            strokeDasharray="4 4"
          />
          <circle 
            cx="50" 
            cy="50" 
            r="25" 
            fill="none" 
            className="stroke-blue-400/30 dark:stroke-cyan-400/15"
            strokeWidth="1" 
          />
        </svg>
      </div>

      {/* --- Floating Geometry (Right Margin) --- */}
      {/* Floating Hexagon */}
      <div className="absolute top-[35%] right-[6%] transform-gpu will-change-transform ambient-float-fast">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon 
            points="50,10 85,30 85,70 50,90 15,70 15,30" 
            className="fill-slate-300/20 stroke-slate-400/40 dark:fill-white/10 dark:stroke-white/20"
            strokeWidth="1" 
          />
          <line x1="50" y1="10" x2="50" y2="50" className="stroke-slate-400/20 dark:stroke-white/5" strokeWidth="1" />
          <line x1="85" y1="30" x2="50" y2="50" className="stroke-slate-400/20 dark:stroke-white/5" strokeWidth="1" />
          <line x1="15" y1="30" x2="50" y2="50" className="stroke-slate-400/20 dark:stroke-white/5" strokeWidth="1" />
        </svg>
      </div>

      {/* Scattered Tech Nodes */}
      <div className="absolute bottom-[30%] right-[12%] transform-gpu will-change-transform ambient-float-slow">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="20" width="10" height="10" className="fill-blue-400/15 stroke-slate-400/40 dark:fill-cyan-400/10 dark:stroke-white/15" strokeWidth="1" />
          <rect x="70" y="40" width="8" height="8" className="fill-blue-400/15 stroke-slate-400/40 dark:fill-cyan-400/10 dark:stroke-white/15" strokeWidth="1" />
          <rect x="40" y="80" width="12" height="12" className="fill-blue-400/15 stroke-slate-400/40 dark:fill-cyan-400/10 dark:stroke-white/15" strokeWidth="1" />
          <path d="M30 25 L70 44 L46 80 Z" fill="none" className="stroke-slate-400/15 dark:stroke-white/5" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      </div>

      {/* --- Hardware Accelerated CSS Animations --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ambient-float-slow {
          animation: ambientFloat 14s ease-in-out infinite alternate;
        }
        .ambient-float-medium {
          animation: ambientFloat 11s ease-in-out 2s infinite alternate-reverse;
        }
        .ambient-float-fast {
          animation: ambientFloat 9s ease-in-out 1s infinite alternate;
        }

        @keyframes ambientFloat {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          100% {
            transform: translateY(-20px) rotate(3deg);
          }
        }

        /* Accessibility: Disable motion for users with vestibular sensitivities */
        @media (prefers-reduced-motion: reduce) {
          .ambient-float-slow,
          .ambient-float-medium,
          .ambient-float-fast {
            animation: none !important;
            transform: none !important;
          }
        }
      `}} />
    </div>
  );
}
