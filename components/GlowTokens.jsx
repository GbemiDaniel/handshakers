"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * BiometricHandshakeToken
 * Inline glowing biometric fingerprint token inspired by Reference Image 2.
 */
export function BiometricHandshakeToken({ className = "w-10 h-10 sm:w-12 sm:h-12 inline-block align-middle mx-1 sm:mx-2" }) {
  return (
    <span className={`inline-flex items-center justify-center relative ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(37,99,235,0.7)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="22" className="stroke-blue-500/30" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Concentric Biometric Arcs */}
        <path
          d="M16 28C16 23.5817 19.5817 20 24 20C28.4183 20 32 23.5817 32 28"
          stroke="url(#blueBrandGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 28C12 21.3726 17.3726 16 24 16C30.6274 16 36 21.3726 36 28"
          stroke="url(#blueBrandGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M20 28C20 25.7909 21.7909 24 24 24C26.2091 24 28 25.7909 28 28V32"
          stroke="#60a5fa"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 34V36"
          stroke="#93c5fd"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M8 28C8 19.1634 15.1634 12 24 12C32.8366 12 40 19.1634 40 28"
          stroke="url(#blueBrandGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <defs>
          <linearGradient id="blueBrandGradient" x1="8" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="0.5" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      {/* Subtle background ambient pulse glow */}
      <span className="absolute inset-0 rounded-full bg-blue-600/25 blur-md pointer-events-none -z-10" />
    </span>
  );
}

/**
 * LuminousSparkToken
 * Inline glowing multi-point starburst crystal token inspired by Reference Image 2.
 */
export function LuminousSparkToken({ className = "w-10 h-10 sm:w-12 sm:h-12 inline-block align-middle mx-1 sm:mx-2" }) {
  return (
    <span className={`inline-flex items-center justify-center relative ${className}`}>
      <motion.svg
        animate={{ rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        viewBox="0 0 48 48"
        className="w-full h-full drop-shadow-[0_0_16px_rgba(34,211,238,0.9)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 4-Point Star Core */}
        <path
          d="M24 2L27.5 17.5L43 21L27.5 24.5L24 40L20.5 24.5L5 21L20.5 17.5L24 2Z"
          fill="url(#sparkGradient)"
        />
        {/* Diagonal Secondary Points */}
        <path
          d="M24 8L26 19L37 21L26 23L24 34L22 23L11 21L22 19L24 8Z"
          fill="#ffffff"
          fillOpacity="0.9"
        />
        <circle cx="24" cy="21" r="3.5" fill="#ffffff" className="drop-shadow-[0_0_8px_#ffffff]" />
        <defs>
          <linearGradient id="sparkGradient" x1="5" y1="2" x2="43" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </motion.svg>
      {/* Radiant ambient aura */}
      <span className="absolute inset-0 rounded-full bg-cyan-400/25 blur-lg pointer-events-none -z-10" />
    </span>
  );
}

/**
 * CyberGridIcon
 * Distinctive geometric circuit-grid icon container inspired by Reference Image 1.
 */
export function CyberGridIcon({ type = "chip", accent = "purple", className = "" }) {
  const isPurple = accent === "purple";
  const isCyan = accent === "cyan";
  const isEmerald = accent === "emerald";

  const glowColor = isPurple
    ? "rgba(168,85,247,0.3)"
    : isCyan
    ? "rgba(56,189,248,0.3)"
    : "rgba(16,185,129,0.3)";

  return (
    <div className={`relative w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/8 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300 ${className}`}>
      {/* Background Matrix Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[8px_8px]" />
      
      {/* Ambient Inner Glow */}
      <div
        className="absolute inset-0 blur-md pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity duration-300"
        style={{ backgroundColor: glowColor }}
      />

      {/* SVG Icon Graphic */}
      <svg viewBox="0 0 32 32" className="w-8 h-8 relative z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        {type === "chip" && (
          <>
            <rect x="8" y="8" width="16" height="16" rx="4" className="stroke-indigo-400" strokeWidth="1.5" />
            <rect x="12" y="12" width="8" height="8" rx="2" className="fill-indigo-500/30 stroke-indigo-300" strokeWidth="1.2" />
            <path d="M4 12H8M4 16H8M4 20H8M24 12H28M24 16H28M24 20H28M12 4V8M16 4V8M20 4V8M12 24V28M16 24V28M20 24V28" className="stroke-indigo-400/60" strokeWidth="1.2" strokeLinecap="round" />
          </>
        )}

        {type === "scale" && (
          <>
            <path d="M6 10H26M16 6V26M8 26H24" className="stroke-purple-400" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 10L6 18H14L10 10Z" className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.2" />
            <path d="M22 10L18 18H26L22 10Z" className="fill-purple-500/20 stroke-purple-400" strokeWidth="1.2" />
          </>
        )}

        {type === "interface" && (
          <>
            <rect x="6" y="6" width="20" height="20" rx="3" className="stroke-cyan-400" strokeWidth="1.5" />
            <path d="M6 12H26M12 12V26" className="stroke-cyan-400/60" strokeWidth="1.2" />
            <circle cx="9" cy="9" r="1" className="fill-cyan-400" />
            <circle cx="13" cy="9" r="1" className="fill-cyan-400/60" />
            <rect x="15" y="15" width="8" height="3" rx="1" className="fill-cyan-500/40" />
            <rect x="15" y="20" width="6" height="3" rx="1" className="fill-cyan-500/20" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * PlayDemoBadge
 * High-end circular frosted play button with pulsating ripples inspired by Reference Image 1.
 */
export function PlayDemoBadge({ onPlay, className = "" }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className={`group relative flex flex-col items-center justify-center cursor-pointer focus:outline-none ${className}`}
    >
      {/* Outer Pulsing Ripple Rings */}
      <span className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping opacity-40 pointer-events-none" />
      <span className="absolute -inset-1 rounded-full bg-blue-500/30 blur-sm group-hover:bg-blue-500/50 transition-colors pointer-events-none" />
      
      {/* Main Glass Circle */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/90 border border-white/20 backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden">
        <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 text-white translate-x-0.5 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 5.14v14.72a1 1 0 001.5.86l12-7.36a1 1 0 000-1.72l-12-7.36A1 1 0 008 5.14z" />
        </svg>
      </div>

      {/* Label under button */}
      <div className="mt-3 text-center">
        <span className="text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-blue-300 transition-colors block">
          watch demo
        </span>
        <span className="text-[11px] text-slate-400 font-mono block">
          2 mins
        </span>
      </div>
    </button>
  );
}

/**
 * TeamNodeToken (Represents "human")
 * High-tech biometric user network with orbital rings.
 */
export function TeamNodeToken({ className = "w-10 h-10 sm:w-12 sm:h-12 inline-block align-middle mx-1 sm:mx-2" }) {
  return (
    <motion.span
      whileHover={{ scale: 1.15, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 18 }}
      className={`inline-flex items-center justify-center relative cursor-pointer select-none will-change-transform ${className}`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_0_12px_rgba(37,99,235,0.7)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" className="stroke-blue-500/30" strokeWidth="1.5" strokeDasharray="3 4" />
        {/* Glowing Head */}
        <circle cx="24" cy="18" r="6" fill="#93c5fd" className="drop-shadow-[0_0_6px_#93c5fd]" />
        {/* Tech Shoulders */}
        <path d="M11 34C11 27.3726 16.3726 22 23 22H25C31.6274 22 37 27.3726 37 34" stroke="url(#teamBlueGradient)" strokeWidth="3" strokeLinecap="round" />
        <path d="M15 34V36" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        <path d="M33 34V36" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        <defs>
          <linearGradient id="teamBlueGradient" x1="11" y1="22" x2="37" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="0.5" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 rounded-full bg-blue-600/25 blur-md pointer-events-none -z-10" />
    </motion.span>
  );
}

/**
 * PrecisionChronometerToken (Represents "exact")
 * High-tech glowing chronometer with spinning sweep hand.
 */
export function PrecisionChronometerToken({ className = "w-10 h-10 sm:w-12 sm:h-12 inline-block align-middle mx-1 sm:mx-2" }) {
  return (
    <motion.span
      whileHover={{ scale: 1.15, rotate: -5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 350, damping: 18 }}
      className={`inline-flex items-center justify-center relative cursor-pointer select-none will-change-transform ${className}`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-[0_0_16px_rgba(34,211,238,0.9)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Crown & Pushers */}
        <path d="M22 4H26V8H22V4Z" fill="#38bdf8" />
        <path d="M16 7L13 10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 7L35 10" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Main Casing */}
        <circle cx="24" cy="26" r="18" stroke="url(#chronoGradient)" strokeWidth="3" />
        {/* Inner Track */}
        <circle cx="24" cy="26" r="13" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
        {/* Center Pin */}
        <circle cx="24" cy="26" r="2.5" fill="#ffffff" className="drop-shadow-[0_0_6px_#ffffff]" />
        {/* Static Hand */}
        <path d="M24 26L32 30" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        {/* Sweeping Hand - using an invisible bounding circle to guarantee exact 24x26 origin across browsers */}
        <motion.g animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ originX: 0.5, originY: 0.5 }}>
          <circle cx="24" cy="26" r="16" fill="transparent" stroke="transparent" className="pointer-events-none" />
          <path d="M24 26V13" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="13" r="1.5" fill="#ffffff" />
        </motion.g>
        <defs>
          <linearGradient id="chronoGradient" x1="6" y1="8" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22d3ee" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 rounded-full bg-cyan-400/25 blur-lg pointer-events-none -z-10" />
    </motion.span>
  );
}
