"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/context/ThemeContext";

// ============================================================================
// 1. 3D ASSET: Segmented Pie Chart (Pro-Rata Allocation)
// ============================================================================
function SegmentedPieChart({ isDark, scrollProgress }) {
  const groupRef = useRef();
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;

  // Materials configuration based on active theme
  const glassMaterialProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#38bdf8",
        roughness: 0.12,
        metalness: 0.15,
        transmission: 0.9,
        thickness: 2.2,
        ior: 1.5,
        attenuationColor: "#1d4ed8",
        attenuationDistance: 1.6,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      };
    }
    return {
      color: "#ffffff",
      roughness: 0.22,
      metalness: 0.05,
      transmission: 0.65,
      thickness: 1.3,
      ior: 1.45,
      attenuationColor: "#e2e8f0",
      attenuationDistance: 2.5,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
    };
  }, [isDark]);

  const accentMaterialProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#818cf8",
        emissive: "#4338ca",
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.3,
        transmission: 0.75,
        thickness: 1.8,
        ior: 1.5,
        clearcoat: 1,
      };
    }
    return {
      color: "#2563eb",
      roughness: 0.25,
      metalness: 0.15,
      transmission: 0.45,
      thickness: 1.0,
      ior: 1.45,
      clearcoat: 0.8,
    };
  }, [isDark]);

  // Responsive asymmetric placement (top-right quadrant)
  const basePosition = useMemo(() => {
    return isMobile ? [1.8, 1.8, -1.2] : [3.3, 1.3, -0.6];
  }, [isMobile]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Smooth scroll-driven Y-rotation and subtle elevation
    const targetRotY = -0.3 + scrollProgress.current * Math.PI * 1.6;
    const targetPosY = basePosition[1] + scrollProgress.current * 0.8;

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      3.5,
      delta
    );
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetPosY,
      3.5,
      delta
    );
  });

  return (
    <Float
      speed={1.8}
      rotationIntensity={0.4}
      floatIntensity={0.6}
      floatingRange={[-0.1, 0.1]}
    >
      <group
        ref={groupRef}
        position={basePosition}
        rotation={[0.55, -0.3, 0.2]}
        scale={isMobile ? 0.75 : 1}
      >
        {/* Slice 1: Primary Pro-Rata Share (60% / 216 deg) */}
        <group position={[0.08, 0, 0.08]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[1.25, 1.25, 0.4, 40, 1, false, 0, Math.PI * 1.2]} />
            <meshPhysicalMaterial {...glassMaterialProps} />
          </mesh>
        </group>

        {/* Slice 2: Secondary Share (25% / 90 deg) */}
        <group position={[-0.1, 0, 0.06]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry
              args={[1.25, 1.25, 0.4, 32, 1, false, Math.PI * 1.25, Math.PI * 0.5]}
            />
            <meshPhysicalMaterial {...accentMaterialProps} />
          </mesh>
        </group>

        {/* Slice 3: Remainder Capped Share (15% / 54 deg) */}
        <group position={[0.02, 0, -0.12]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry
              args={[1.25, 1.25, 0.4, 24, 1, false, Math.PI * 1.8, Math.PI * 0.35]}
            />
            <meshPhysicalMaterial {...glassMaterialProps} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

// ============================================================================
// 2. 3D ASSET: Minimalist Stopwatch / Clock (Precision Time)
// ============================================================================
function MinimalistClockStopwatch({ isDark, scrollProgress }) {
  const groupRef = useRef();
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;

  const glassMaterialProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#60a5fa",
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.92,
        thickness: 2.4,
        ior: 1.5,
        attenuationColor: "#1e3a8a",
        attenuationDistance: 1.8,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      };
    }
    return {
      color: "#ffffff",
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.7,
      thickness: 1.4,
      ior: 1.45,
      attenuationColor: "#cbd5e1",
      attenuationDistance: 2.2,
      clearcoat: 0.95,
      clearcoatRoughness: 0.12,
    };
  }, [isDark]);

  const metalAccentProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#c084fc",
        emissive: "#6b21a8",
        emissiveIntensity: 0.4,
        roughness: 0.15,
        metalness: 0.8,
        clearcoat: 1,
      };
    }
    return {
      color: "#2563eb",
      roughness: 0.25,
      metalness: 0.6,
      clearcoat: 0.8,
    };
  }, [isDark]);

  // Responsive asymmetric placement (mid-left quadrant)
  const basePosition = useMemo(() => {
    return isMobile ? [-1.9, -0.6, -1.5] : [-3.4, -0.7, -1.0];
  }, [isMobile]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetRotY = 0.4 + scrollProgress.current * Math.PI * 1.5;
    const targetPosY = basePosition[1] + scrollProgress.current * 1.1;

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      3.5,
      delta
    );
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetPosY,
      3.5,
      delta
    );
  });

  return (
    <Float
      speed={2.2}
      rotationIntensity={0.5}
      floatIntensity={0.7}
      floatingRange={[-0.12, 0.12]}
    >
      <group
        ref={groupRef}
        position={basePosition}
        rotation={[0.3, 0.4, -0.15]}
        scale={isMobile ? 0.7 : 0.95}
      >
        {/* Outer Torus Casing */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[1.2, 0.11, 24, 64]} />
          <meshPhysicalMaterial {...glassMaterialProps} />
        </mesh>

        {/* Top Crown / Stopwatch Button */}
        <group position={[0, 1.35, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.24, 24]} />
            <meshStandardMaterial {...metalAccentProps} />
          </mesh>
        </group>

        {/* Center Spindle Pivot */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 24]} />
          <meshStandardMaterial {...metalAccentProps} />
        </mesh>

        {/* Hour Hand (Angled at ~10 o'clock) */}
        <group rotation={[0, 0, Math.PI * 0.35]}>
          <mesh position={[0, 0.3, 0.05]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial {...metalAccentProps} />
          </mesh>
        </group>

        {/* Minute Hand (Angled at ~2 o'clock) */}
        <group rotation={[0, 0, -Math.PI * 0.25]}>
          <mesh position={[0, 0.42, 0.08]}>
            <boxGeometry args={[0.04, 0.85, 0.03]} />
            <meshPhysicalMaterial {...glassMaterialProps} />
          </mesh>
        </group>

        {/* Minimalist 12, 3, 6, 9 Cardinal Ticks */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <group key={idx} rotation={[0, 0, angle]}>
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial {...metalAccentProps} />
            </mesh>
          </group>
        ))}
      </group>
    </Float>
  );
}

// ============================================================================
// 3. 3D ASSET: Layered Task Cards (Stacked Allocation)
// ============================================================================
function LayeredTaskCards({ isDark, scrollProgress }) {
  const groupRef = useRef();
  const { viewport } = useThree();
  const isMobile = viewport.width < 7;

  const cardGlassProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#38bdf8",
        roughness: 0.15,
        metalness: 0.1,
        transmission: 0.88,
        thickness: 2.0,
        ior: 1.5,
        attenuationColor: "#1e3a8a",
        attenuationDistance: 1.7,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      };
    }
    return {
      color: "#ffffff",
      roughness: 0.2,
      metalness: 0.05,
      transmission: 0.68,
      thickness: 1.2,
      ior: 1.45,
      attenuationColor: "#cbd5e1",
      attenuationDistance: 2.3,
      clearcoat: 0.9,
      clearcoatRoughness: 0.12,
    };
  }, [isDark]);

  const topCardAccentProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#818cf8",
        roughness: 0.12,
        metalness: 0.2,
        transmission: 0.82,
        thickness: 2.2,
        ior: 1.5,
        attenuationColor: "#312e81",
        attenuationDistance: 1.5,
        clearcoat: 1,
      };
    }
    return {
      color: "#f8fafc",
      roughness: 0.18,
      metalness: 0.08,
      transmission: 0.6,
      thickness: 1.3,
      ior: 1.45,
      clearcoat: 0.95,
    };
  }, [isDark]);

  const headerBarProps = useMemo(() => {
    if (isDark) {
      return {
        color: "#38bdf8",
        emissive: "#0284c7",
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.5,
      };
    }
    return {
      color: "#2563eb",
      roughness: 0.3,
      metalness: 0.2,
    };
  }, [isDark]);

  // Responsive asymmetric placement (bottom-right quadrant)
  const basePosition = useMemo(() => {
    return isMobile ? [1.6, -2.4, -1.2] : [3.0, -2.6, -0.8];
  }, [isMobile]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetRotY = -0.4 + scrollProgress.current * Math.PI * 1.4;
    const targetPosY = basePosition[1] + scrollProgress.current * 1.3;

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotY,
      3.5,
      delta
    );
    groupRef.current.position.y = THREE.MathUtils.damp(
      groupRef.current.position.y,
      targetPosY,
      3.5,
      delta
    );
  });

  return (
    <Float
      speed={1.9}
      rotationIntensity={0.45}
      floatIntensity={0.65}
      floatingRange={[-0.1, 0.1]}
    >
      <group
        ref={groupRef}
        position={basePosition}
        rotation={[0.35, -0.4, 0.12]}
        scale={isMobile ? 0.7 : 0.9}
      >
        {/* Bottom Card */}
        <group position={[0, 0, -0.22]} rotation={[0.12, 0.18, -0.1]}>
          <RoundedBox args={[1.7, 2.3, 0.08]} radius={0.06} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial {...cardGlassProps} />
          </RoundedBox>
        </group>

        {/* Middle Card */}
        <group position={[0.18, 0.14, 0.06]} rotation={[-0.08, -0.12, 0.06]}>
          <RoundedBox args={[1.7, 2.3, 0.08]} radius={0.06} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial {...cardGlassProps} />
          </RoundedBox>
        </group>

        {/* Top Active Card with Header Bar */}
        <group position={[-0.12, -0.16, 0.35]} rotation={[0.06, -0.05, -0.02]}>
          <RoundedBox args={[1.7, 2.3, 0.08]} radius={0.06} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial {...topCardAccentProps} />
          </RoundedBox>

          {/* Accent Header Bar */}
          <mesh position={[0, 0.78, 0.05]}>
            <boxGeometry args={[1.2, 0.12, 0.02]} />
            <meshStandardMaterial {...headerBarProps} />
          </mesh>

          {/* Mini Task Progress Line */}
          <mesh position={[-0.2, 0.45, 0.05]}>
            <boxGeometry args={[0.8, 0.05, 0.02]} />
            <meshStandardMaterial {...headerBarProps} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

// ============================================================================
// 4. DUAL-THEME LIGHTING RIG
// ============================================================================
function ThemeLightingRig({ isDark }) {
  if (isDark) {
    return (
      <>
        {/* Deep Slate / Blue Ambient Base */}
        <ambientLight intensity={1.1} color="#0f172a" />

        {/* Main Neon Blue Key Light */}
        <directionalLight position={[8, 10, 6]} intensity={3.2} color="#38bdf8" />

        {/* Deep Purple / Violet Fill Light */}
        <pointLight position={[-8, -5, -2]} intensity={4.8} color="#8b5cf6" />

        {/* Cyan Rim Accent */}
        <pointLight position={[6, -6, 4]} intensity={2.8} color="#06b6d4" />
      </>
    );
  }

  // Light Mode Daylight Rig
  return (
    <>
      {/* Bright Daylight Ambient */}
      <ambientLight intensity={2.4} color="#ffffff" />

      {/* Crisp Sunlight Directional Light */}
      <directionalLight position={[8, 12, 6]} intensity={3.6} color="#f8fafc" />

      {/* Sky Blue Soft Fill Light */}
      <pointLight position={[-6, 4, 3]} intensity={2.0} color="#93c5fd" />

      {/* Soft Slate Rim Light */}
      <pointLight position={[5, -4, 2]} intensity={1.4} color="#cbd5e1" />
    </>
  );
}

// ============================================================================
// 5. MAIN TIME SCENE WRAPPER & CANVAS
// ============================================================================
function SceneContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const scrollProgress = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <ThemeLightingRig isDark={isDark} />
      <SegmentedPieChart isDark={isDark} scrollProgress={scrollProgress} />
      <MinimalistClockStopwatch isDark={isDark} scrollProgress={scrollProgress} />
      <LayeredTaskCards isDark={isDark} scrollProgress={scrollProgress} />
    </>
  );
}

/**
 * TimeScene Component
 * Fullscreen background WebGL Canvas rendering the Living World time assets.
 */
export default function TimeScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
