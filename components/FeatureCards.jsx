"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/**
 * CardWidget1: Pro-Rata Balancing / Soundwave & Equalizer Nodes
 * Recreates the top visual from Card 1 with primary electric blue / cyan styling
 * and supporting emerald accents. Includes smooth micro-animations.
 */
function CardWidget1({ isHovered }) {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-slate-950/50 border border-white/[0.04] flex items-center justify-center overflow-hidden">
      {/* Concentric Radar / Wave Rings (Electric Blue / Cyan) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full border border-blue-500/10" />
        <div className="absolute w-24 h-24 rounded-full border border-cyan-500/15" />
        <div className="absolute w-14 h-14 rounded-full border border-blue-500/20 bg-blue-500/5 blur-[2px]" />
        <div className="absolute w-48 h-48 rounded-full bg-blue-600/10 blur-2xl" />
      </div>

      {/* Stack of Floating Glass Elements */}
      <div className="relative z-10 flex flex-col items-center gap-2.5">
        {/* Top Equalizer Capsule */}
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center gap-1">
          {[6, 12, 18, 10, 16, 22, 14, 8, 20, 12].map((h, i) => (
            <motion.span
              key={i}
              animate={isHovered ? { height: [h, Math.max(4, (h * 1.4) % 24), h] } : {}}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
              className={`w-0.5 rounded-full ${
                i % 3 === 0
                  ? "bg-blue-400 shadow-[0_0_8px_#60a5fa]"
                  : i % 2 === 0
                  ? "bg-cyan-400 shadow-[0_0_6px_#38bdf8]"
                  : "bg-emerald-400/80 shadow-[0_0_6px_#34d399]"
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        {/* Middle Dual Nodes */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-900/90 border border-blue-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
            <span className="w-2.5 h-2.5 rounded bg-blue-400 shadow-[0_0_6px_#3b82f6]" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-900/90 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
          </div>
        </div>

        {/* Bottom Pill Switch */}
        <div className="px-5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-md flex items-center justify-center">
          <span className="w-4 h-1 rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}

/**
 * CardWidget2: Enterprise Security / Shield & Biometric Capsule
 * Recreates Card 2 with primary blue/indigo base and emerald verified accents.
 */
function CardWidget2({ isHovered }) {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-slate-950/50 border border-white/[0.04] flex items-center justify-center overflow-hidden">
      {/* Concentric Ambient Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-40 h-40 rounded-full border border-blue-500/10" />
        <div className="absolute w-28 h-28 rounded-full border border-indigo-500/15" />
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/20 blur-xl" />
      </div>

      {/* Floating Card with Biometric Node */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glowing Capsule Button */}
        <div className="relative p-3.5 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center gap-2">
          {/* Glowing Center Badge */}
          <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Lower interactive section with supporting emerald verified indicator */}
          <div className="w-20 h-6 rounded-lg bg-slate-950/70 border border-white/5 flex items-center justify-between px-2">
            <span className="text-[9px] font-mono text-emerald-400 font-bold">AUDITED</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
        </div>

        {/* Floating Mouse Cursor Accent */}
        <motion.div
          animate={isHovered ? { x: [8, 12, 8], y: [4, 2, 4] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1 -right-2 transform translate-x-2 translate-y-1 pointer-events-none"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] fill-white">
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * CardWidget3: Sub-Second Speed / Device with Cascading Depth Cards
 * Recreates Card 3 with cyan/blue quantum core and 3D layered cards.
 */
function CardWidget3({ isHovered }) {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-slate-950/50 border border-white/[0.04] flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-36 h-36 rounded-full bg-blue-500/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center">
        {/* Layered Background Card Left */}
        <motion.div
          animate={isHovered ? { x: -6, rotate: -10 } : { x: 0, rotate: -6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute -left-7 w-16 h-28 rounded-2xl bg-slate-900/40 border border-white/5 scale-90 blur-[0.5px]"
        />
        
        {/* Layered Background Card Right */}
        <motion.div
          animate={isHovered ? { x: 6, rotate: 10 } : { x: 0, rotate: 6 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="absolute -right-7 w-16 h-28 rounded-2xl bg-slate-900/40 border border-white/5 scale-90 blur-[0.5px]"
        />

        {/* Center Device Frame */}
        <div className="relative w-20 h-32 rounded-2xl bg-slate-900/95 border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center justify-between p-2.5">
          {/* Top Speaker Slot */}
          <div className="w-4 h-0.5 rounded-full bg-slate-700" />

          {/* Glowing Center Quantum Icon (Electric Blue & Cyan with Emerald Node) */}
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(59,130,246,0.4)]">
            <div className="grid grid-cols-2 gap-1">
              <span className="w-1.5 h-1.5 rounded-xs bg-blue-300" />
              <span className="w-1.5 h-1.5 rounded-xs bg-cyan-300" />
              <span className="w-1.5 h-1.5 rounded-xs bg-cyan-300" />
              <span className="w-1.5 h-1.5 rounded-xs bg-emerald-400" />
            </div>
          </div>

          {/* Bottom Home Indicator */}
          <div className="w-6 h-1 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/**
 * CardWidget4: Auto-Optimization / Arc of Stars & Live Terminal Card
 * Recreates Card 4 with cyan/blue terminal accents and soft emerald rating highlights.
 */
function CardWidget4({ isHovered }) {
  return (
    <div className="relative w-full h-44 rounded-2xl bg-slate-950/50 border border-white/[0.04] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-36 h-36 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />

      {/* Top Arc of Glowing Stars */}
      <div className="flex items-center gap-2 mb-3">
        {[0.4, 0.7, 1, 0.7, 0.4].map((opacity, idx) => (
          <motion.div
            key={idx}
            animate={isHovered ? { scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 0.6, delay: idx * 0.1, repeat: isHovered ? Infinity : 0 }}
            className="w-4 h-4 flex items-center justify-center"
            style={{ opacity }}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Floating Horizontal Terminal Card */}
      <div className="w-36 p-3 rounded-xl bg-slate-900/90 border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] space-y-1.5">
        <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
        <div className="w-3/4 h-1 rounded-full bg-slate-700" />
      </div>

      {/* Bottom Indicator Dots */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
      </div>
    </div>
  );
}

/**
 * InteractiveTiltCard
 * Performance-engineered card wrapper supporting lightweight 3D parallax on fine-pointer
 * desktop devices, with an instantaneous CSS/touch fallback on mobile devices.
 */
function InteractiveTiltCard({ card, idx, hasFinePointer }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  // Localized spring-damped pointer coordinates (used only on fine pointer desktop)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 25 });

  const handlePointerMove = (e) => {
    if (!hasFinePointer || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    x.set(clientX / rect.width - 0.5);
    y.set(clientY / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
      onPointerMove={hasFinePointer ? handlePointerMove : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handlePointerLeave}
      style={
        hasFinePointer
          ? {
              perspective: 800,
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      className="group relative rounded-[28px] bg-linear-to-b from-[#0a1220]/80 via-[#060a12]/90 to-[#03060a]/95 border border-white/8 hover:border-blue-500/30 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-200 flex flex-col justify-between overflow-hidden will-change-transform cursor-pointer"
    >
      {/* Top Inner Luminous Blue / Cyan Glow */}
      <div className="absolute -top-16 inset-x-0 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-30 group-hover:opacity-70 transition-opacity pointer-events-none" />

      {/* Top Visual Graphic Widget */}
      <div className="mb-6">
        <card.Widget isHovered={isHovered} />
      </div>

      {/* Bottom Text Content */}
      <div className="space-y-2.5 text-left">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
          {card.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {card.description}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * FourFeatureCardsGrid
 * The 4-column feature grid with toned-down supporting green, primary blue palette,
 * and adaptive motion for desktop and mobile.
 */
export default function FourFeatureCardsGrid() {
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasFinePointer(mediaQuery.matches);

    const updateCapability = (e) => setHasFinePointer(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateCapability);
    } else {
      mediaQuery.addListener(updateCapability);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", updateCapability);
      } else {
        mediaQuery.removeListener(updateCapability);
      }
    };
  }, []);

  const cards = [
    {
      title: "Pro-Rata Balancing",
      description: "Distribute across multiple taskers simultaneously with automated pool capping for maximum transparency.",
      Widget: CardWidget1,
    },
    {
      title: "Enterprise Audit Trail",
      description: "Dispute-proof mathematical formulas and multi-tier permission protocols protect your compensation operations 24/7.",
      Widget: CardWidget2,
    },
    {
      title: "Sub-Second Sync",
      description: "High-precision calculations deliver instant distribution with zero latency across all supported workspaces.",
      Widget: CardWidget3,
    },
    {
      title: "Auto-Reconciliation",
      description: "Smart algorithms automatically adjust between hours logged to maximize your team payouts in real-time.",
      Widget: CardWidget4,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full py-24 sm:py-32 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-16">
        {/* Section Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="w-12 h-1 rounded-full bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400 mx-auto" />
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
            Why Handshakers?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            Built for teams who demand the best. Our platform combines cutting-edge pro-rata technology with frictionless tools to maximize your payout fairness.
          </p>
        </div>

        {/* 4-Column Cards Layout with Adaptive Motion */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <InteractiveTiltCard
              key={idx}
              card={card}
              idx={idx}
              hasFinePointer={hasFinePointer}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
