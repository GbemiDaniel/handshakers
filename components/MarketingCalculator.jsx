"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  Layers,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import TelemetrySync from "@/components/TelemetrySync";

/**
 * Universal Time Input Parser
 * Safely converts both HH:MM strings (e.g., "12:45") and decimal strings (e.g., "12.75") into decimal hours.
 */
const parseTimeInput = (input) => {
  if (!input) return 0;
  const str = String(input).trim();

  // Handle HH:MM format
  if (str.includes(":")) {
    const parts = str.split(":");
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hrs + mins / 60;
  }

  // Handle standard decimal format
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Production-grade high-precision rounding helper
 * Prevents floating-point drift across seconds/hours conversions.
 */
const preciseRound = (num) => {
  return (Math.round((num + Number.EPSILON) * 1000) / 1000).toFixed(3);
};

/**
 * Converts decimal hours to HH:MM format
 */
const decimalToHHMM = (decimalHours) => {
  if (!decimalHours || isNaN(decimalHours)) return "00:00";
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  if (mins === 60) return `${(hrs + 1).toString().padStart(2, '0')}:00`;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * MarketingCalculator
 *
 * Reusable Pro-Rata Time Allocation Engine.
 * Embedded inside the Marketing Funnel with high-end glassmorphism.
 */
export default function MarketingCalculator({ onCtaClick }) {
  // -------------------------------------------------------------
  // 1. String-Based Time State (Supports "10:00" and "10.0")
  // -------------------------------------------------------------
  const [yourHoursInput, setYourHoursInput] = useState("");
  const [teamTotalInput, setTeamTotalInput] = useState("");
  const [platformPaidInput, setPlatformPaidInput] = useState("");

  // -------------------------------------------------------------
  // 2. Pro-Rata Time Allocation Formula with Universal Parser
  // -------------------------------------------------------------
  const calculations = useMemo(() => {
    const activeYourTime = yourHoursInput === "" ? "10:00" : yourHoursInput;
    const activeTeamTime = teamTotalInput === "" ? "50:00" : teamTotalInput;
    const activePool = platformPaidInput === "" ? "40:00" : platformPaidInput;

    const yourHoursDecimal = parseTimeInput(activeYourTime);
    const teamTotalDecimal = parseTimeInput(activeTeamTime);
    const platformPaidDecimal = parseTimeInput(activePool);

    // Safe division guard against divide-by-zero
    const shareDecimal = teamTotalDecimal > 0 ? yourHoursDecimal / teamTotalDecimal : 0;
    const sharePercentage = preciseRound(shareDecimal * 100);
    const payoutDecimalHours = preciseRound(shareDecimal * platformPaidDecimal);

    return {
      yourHoursDecimal,
      teamTotalDecimal,
      platformPaidDecimal,
      shareDecimal,
      sharePercentage,
      payoutDecimalHours,
      formattedShare: `${sharePercentage}%`,
      formattedPayout: `${payoutDecimalHours} hrs`,
      formattedPayoutHHMM: decimalToHHMM(payoutDecimalHours),
      formattedFormula: `(${activeYourTime} / ${activeTeamTime}) × ${activePool}`,
    };
  }, [yourHoursInput, teamTotalInput, platformPaidInput]);

  // Reset to default parameters
  const handleReset = () => {
    setYourHoursInput("");
    setTeamTotalInput("");
    setPlatformPaidInput("");
  };

  // Flag to check if the user has provided any input
  const isZeroState = !yourHoursInput && !teamTotalInput && !platformPaidInput;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto rounded-3xl border border-white/[0.1] bg-slate-950/20 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden text-slate-100"
    >
      {/* Top Glassmorphic Glare Accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent pointer-events-none" />

      {/* Top Card Header Window Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-950/30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
          title="Reset values"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Main Grid: Left Column (Inputs) & Right Column (Receipt)    */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Your Numbers (Universal HH:MM & Decimal)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-slate-950/10">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-400" />
                <span>Your Numbers</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.08] font-mono">
                HH:MM or Decimal
              </span>
            </div>

            {/* Input 1: Your Logged Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label htmlFor="yourHoursInput" className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400/70" />
                  Your hours
                </label>
              </div>
              <div className="relative">
                <input
                  id="yourHoursInput"
                  type="text"
                  inputMode="text"
                  value={yourHoursInput}
                  onChange={(e) => setYourHoursInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-600 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  placeholder="e.g., 10:00"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                  hrs
                </span>
              </div>
            </div>

            {/* Input 2: Team Total Logged Time */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label htmlFor="teamTotalInput" className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400/70" />
                  Team's total hours
                </label>
              </div>
              <div className="relative">
                <input
                  id="teamTotalInput"
                  type="text"
                  inputMode="text"
                  value={teamTotalInput}
                  onChange={(e) => setTeamTotalInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-600 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  placeholder="e.g., 50:00"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                  hrs
                </span>
              </div>
            </div>

            {/* Input 3: Client / Platform Paid Pool */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label htmlFor="platformPaidInput" className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400/70" />
                  Client's budget cap
                </label>
              </div>
              <div className="relative">
                <input
                  id="platformPaidInput"
                  type="text"
                  inputMode="text"
                  value={platformPaidInput}
                  onChange={(e) => setPlatformPaidInput(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-600 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                  placeholder="e.g., 40:00"
                />
                <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 text-xs font-mono">
                  hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: The Breakdown (Time Receipt & Trojan CTA)   */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-950/50 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-400" />
                <span>The Breakdown</span>
              </h3>
            </div>

            {/* Transparent Time Allocation Rows */}
            <div className="space-y-3.5">
              {/* Your Share */}
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-slate-400">Your Share</span>
                {isZeroState ? (
                  <span className="font-mono text-slate-600 tabular-nums font-bold text-base">
                    0.000%
                  </span>
                ) : (
                  <span className="font-mono text-slate-100 tabular-nums font-bold text-base">
                    {calculations.formattedShare}
                  </span>
                )}
              </div>

              {/* Calculation Detail */}
              <div className="flex justify-between items-baseline text-xs font-mono">
                <span className="text-slate-400">The math</span>
                {isZeroState ? (
                  <span className="text-slate-600 font-mono text-xs">(--:-- / --:--) × --:--</span>
                ) : (
                  <span className="text-blue-400 font-medium">{calculations.formattedFormula}</span>
                )}
              </div>

              <div className="border-t border-dashed border-white/[0.08] pt-3" />

              {/* YOUR BILLABLE TIME Callout (Main Time Focus) */}
              <div className="rounded-2xl bg-blue-950/40 border border-blue-600/30 p-4 space-y-1 shadow-[inset_0_1px_1px_rgba(59,130,246,0.15)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-blue-400" />
                    YOU GET PAID FOR
                  </span>
                  <span className="text-xs text-blue-400/90 font-mono">Final cut</span>
                </div>
                <div className="flex flex-col pt-1">
                  {/* TODO: Hook up isCalculating state from backend to conditionally render <TelemetrySync /> here */}
                  {isZeroState ? (
                    <div className="text-3xl font-extrabold font-mono text-slate-600 tabular-nums tracking-tight">
                      00:00
                    </div>
                  ) : (
                    <div className="text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                      {calculations.formattedPayoutHHMM}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trojan Horse Marketing CTA */}
          <div className="pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onCtaClick}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_28px_rgba(37,99,235,0.5)] transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 text-center cursor-pointer"
            >
              <span>Automate this for your team →</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
