"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ThemeToggle Component
 * Ultra-minimal toggle between light and dark modes.
 */
export default function ThemeToggle({ className = "" }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`w-9 h-9 p-2 ${className}`} />; // Return a fixed-size empty placeholder to prevent layout shift
  }

  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className={`p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
      title={currentTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </motion.button>
  );
}
