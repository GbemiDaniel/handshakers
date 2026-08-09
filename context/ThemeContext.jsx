"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const THEME_STORAGE_KEY = "handshakers-theme";

const ThemeContext = createContext({
  theme: "light", // "light" | "dark" | "system"
  resolvedTheme: "light", // "light" | "dark"
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [resolvedTheme, setResolvedTheme] = useState("light");

  // Load stored theme on initial mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && ["light", "dark", "system"].includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(stored);
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage:", e);
    }
  }, []);

  // DOM theme application function
  const applyTheme = useCallback((targetTheme) => {
    const root = document.documentElement;
    const isDarkSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveIsDark = targetTheme === "dark" || (targetTheme === "system" && isDarkSystem);

    if (effectiveIsDark) {
      root.classList.add("dark");
      setResolvedTheme("dark");
    } else {
      root.classList.remove("dark");
      setResolvedTheme("light");
    }
  }, []);

  // Apply theme class and setup system media query listener
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme, applyTheme]);

  // Persist user theme selection
  const setTheme = useCallback((newTheme) => {
    if (!["light", "dark", "system"].includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error("Failed to save theme to localStorage:", e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
