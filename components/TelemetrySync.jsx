"use client";

import { motion } from "framer-motion";

const dotVariants = {
  start: { y: 0, opacity: 0.3 },
  end: { y: -4, opacity: 1 }
};

const containerVariants = {
  start: { transition: { staggerChildren: 0.15 } },
  end: { transition: { staggerChildren: 0.15 } }
};

export default function TelemetrySync({ className = "" }) {
  return (
    <motion.div 
      variants={containerVariants} 
      initial="start" 
      animate="end" 
      className={`flex items-center justify-center gap-2.5 ${className}`}
    >
      <motion.div 
        variants={dotVariants} 
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} 
        className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" 
      />
      <motion.div 
        variants={dotVariants} 
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} 
        className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
      />
      <motion.div 
        variants={dotVariants} 
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} 
        className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" 
      />
    </motion.div>
  );
}
