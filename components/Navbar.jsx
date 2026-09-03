"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Logo from "@/components/Logo";

const navbarVariants = {
  top: {
    paddingTop: "14px",
    paddingBottom: "14px",
  },
  scrolled: {
    paddingTop: "10px",
    paddingBottom: "10px",
  },
};

const navLinks = [
  { href: "#features", label: "Features", id: "features" },
  { href: "#engine", label: "Engine", id: "engine" },
  { href: "#releases", label: "Releases", id: "releases" },
  { href: "#demo", label: "Demo", id: "demo" },
  { href: "#company", label: "Company", id: "company" },
];

export default function Navbar({ onAuthModalOpen }) {
  const [hoveredNav, setHoveredNav] = useState(null);
  const [activeNav, setActiveNav] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 40);
  });

  // Active section scroll-spy via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" } // Triggers when section is near top of viewport
    );

    navLinks.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (e, link) => {
    e.preventDefault();
    setActiveNav(link.href);
    const target = document.getElementById(link.id);
    if (target) {
      const navOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash without abrupt jumping
      window.history.pushState(null, "", link.href);
    }
  };

  return (
    <motion.header
      variants={navbarVariants}
      initial="top"
      animate={isScrolled ? "scrolled" : "top"}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 will-change-transform transition-all duration-300 ${
        isScrolled
          ? "bg-[#090d16]/85 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.5)] md:bg-transparent md:backdrop-blur-none md:border-transparent md:shadow-none"
          : "bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-11 w-full">
        {/* Left: Brand Anchor */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg shrink-0"
        >
          <Logo className="w-7 h-7 group-hover:scale-105 transition-transform duration-200" showText={true} textClassName="text-white" />
        </Link>

        {/* Center: Precision Navigation Dock with Fluid Magnetic Pill & Active State */}
        <motion.nav
          onMouseLeave={() => setHoveredNav(null)}
          aria-label="Main Navigation"
          initial={false}
          animate={{
            backgroundColor: isScrolled ? "rgba(9, 13, 22, 0.82)" : "rgba(9, 13, 22, 0.25)",
            borderColor: isScrolled ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
            boxShadow: isScrolled
              ? "0 10px 36px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.18)"
              : "0 4px 20px rgba(0, 0, 0, 0.2)",
            backdropFilter: isScrolled ? "blur(24px) saturate(1.5)" : "blur(12px)",
            WebkitBackdropFilter: isScrolled ? "blur(24px) saturate(1.5)" : "blur(12px)",
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex items-center p-1 rounded-full border will-change-[background-color,border-color,box-shadow,backdrop-filter]"
        >
          {navLinks.map((link) => {
            const isHovered = hoveredNav === link.href;
            const isActive = activeNav === link.href;

            return (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                onMouseEnter={() => setHoveredNav(link.href)}
                whileTap={{ scale: 0.96 }}
                className={`relative px-4 sm:px-5 py-2 text-sm transition-colors duration-200 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 flex flex-col items-center justify-center select-none cursor-pointer ${
                  isActive
                    ? "text-white font-medium"
                    : isHovered
                    ? "text-slate-100 font-medium"
                    : "text-slate-400 font-normal hover:text-slate-200"
                }`}
              >
                {/* Fluid Magnetic Hover Capsule */}
                {isHovered && (
                  <motion.div
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 bg-linear-to-b from-white/12 to-white/4 rounded-full border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_10px_rgba(0,0,0,0.3)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.8 }}
                  />
                )}

                {/* Resting Active Section Capsule (Subtle) */}
                {isActive && !isHovered && (
                  <motion.div
                    layoutId="nav-active-pill"
                    className="absolute inset-0 bg-white/6 rounded-full border border-white/8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.8 }}
                  />
                )}

                <span className="relative z-10">{link.label}</span>

                {/* Active Luminescent Micro Pip */}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] z-20"
                    transition={{ type: "spring", stiffness: 450, damping: 32, mass: 0.8 }}
                  />
                )}
              </motion.a>
            );
          })}
        </motion.nav>

        {/* Right: Action Items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onAuthModalOpen}
            className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 sm:px-3.5 py-1.5 rounded-full hover:bg-white/6 transition-all duration-200 cursor-pointer"
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onAuthModalOpen}
            className="text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-950 px-4 sm:px-5 py-2 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.15)] transition-all duration-200 cursor-pointer flex items-center gap-1.5 overflow-hidden shrink-0"
          >
            <span>Try for free</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
