"use client";

import { motion } from "framer-motion";
import Logo from "./Logo";

export default function AppBootSequence() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
      className="fixed inset-0 z-[9999] bg-[#030712] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Continuous Breathing Volumetric Glow */}
      <div className="boot-glow-entrance absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="boot-glow-breathe w-72 h-72 bg-blue-600/20 blur-[70px] rounded-full pointer-events-none" />
      </div>

      {/* Actual Brand Logo with Micro-Float */}
      <div className="boot-brand-entrance mb-8 relative z-10 scale-110">
        <div className="boot-brand-float">
          <Logo textClassName="text-white" />
        </div>
      </div>

      {/* Active Processing Scanner Line */}
      <div className="w-full max-w-lg relative flex items-center justify-center h-[2px] overflow-hidden">
        {/* Static Wide Blue Base */}
        <div className="boot-axis-entrance absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-900/60 to-transparent origin-center" />
        </div>
        
        {/* Infinite Sweeping Cyan Core */}
        <div className="boot-scanner-entrance absolute inset-y-0 w-1/3">
          <div className="boot-scanner-sweep absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* --- ENTRANCE WRAPPERS --- */
        .boot-glow-entrance {
          opacity: 0;
          animation: bootGlowEntrance 1s ease-out 0.2s forwards;
        }
        .boot-brand-entrance {
          opacity: 0;
          animation: bootBrandEntrance 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .boot-axis-entrance {
          opacity: 0;
          transform: scaleX(0);
          animation: bootAxisEntrance 1.0s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .boot-scanner-entrance {
          opacity: 0;
          animation: bootScannerEntrance 0.1s linear 1s forwards;
        }

        /* --- INFINITE LOOP WRAPPERS --- */
        .boot-glow-breathe {
          animation: bootGlowBreathe 4s ease-in-out 1.2s infinite;
        }
        .boot-brand-float {
          animation: bootBrandFloat 4s ease-in-out 1s infinite;
        }
        .boot-scanner-sweep {
          animation: bootScannerSweep 1.5s ease-in-out 1s infinite alternate;
        }

        /* --- ENTRANCE KEYFRAMES (Fire immediately on first paint) --- */
        @keyframes bootGlowEntrance {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1.0); }
        }
        @keyframes bootBrandEntrance {
          from { opacity: 0; transform: translateY(15px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes bootAxisEntrance {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        @keyframes bootScannerEntrance {
          to { opacity: 1; }
        }

        /* --- CONTINUOUS IDLE PHYSICS KEYFRAMES --- */
        @keyframes bootGlowBreathe {
          0%   { opacity: 1; transform: scale(1.0); }
          50%  { opacity: 0.4; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.0); }
        }
        @keyframes bootBrandFloat {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
        @keyframes bootScannerSweep {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }

        /* --- ACCESSIBILITY --- */
        @media (prefers-reduced-motion: reduce) {
          .boot-glow-entrance,
          .boot-brand-entrance,
          .boot-axis-entrance,
          .boot-scanner-entrance,
          .boot-glow-breathe,
          .boot-brand-float,
          .boot-scanner-sweep {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
          }
        }
      `}} />
    </motion.div>
  );
}
