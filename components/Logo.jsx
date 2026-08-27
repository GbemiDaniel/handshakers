"use client";

import React from "react";

export default function Logo({ 
  className = "w-[clamp(1.25rem,2.5vw,1.75rem)] h-[clamp(1.25rem,2.5vw,1.75rem)]", 
  showText = true,
  textClassName = "text-slate-900 dark:text-white"
}) {
  return (
    <div className="flex items-center gap-0">
      <svg
        viewBox="0 0 100 100"
        className={`shrink-0 text-blue-600 dark:text-blue-400 ${className}`}
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left Pillar & Reaching Hand */}
        <path d="M16 22c0-3.3 2.7-6 6-6h10c3.3 0 6 2.7 6 6v22h14c3.3 0 6.3 1.8 7.8 4.7l1.5 2.8-5.3 4.5 4 4-7 6 3 3-9 7.5-15-12.5v16c0 3.3-2.7 6-6 6H22c-3.3 0-6-2.7-6-6V22z" />
        
        {/* Right Pillar Top */}
        <path d="M62 22c0-3.3 2.7-6 6-6h10c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6h-9l-7-5v-21z" />
        
        {/* Right Pillar Bottom */}
        <path d="M67 62l11-9.5c3.5-3 8-1.5 8 3.5v22c0 3.3-2.7 6-6 6H70c-3.3 0-6-2.7-6-6V62z" />
      </svg>
      {showText && (
        <span className={`font-bold tracking-tight text-[clamp(1.125rem,2vw,1.5rem)] -ml-0.5 ${textClassName}`}>
          andshakers
        </span>
      )}
    </div>
  );
}
