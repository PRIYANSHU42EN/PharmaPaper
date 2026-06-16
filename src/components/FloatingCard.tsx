"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface FloatingCardProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  badge?: "FREE" | "PRO";
}

export default function FloatingCard({ children, className = "", onClick, badge }: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Motion values for normalized mouse positions (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for tilt rotation
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), {
    damping: 25,
    stiffness: 150,
    mass: 0.6,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), {
    damping: 25,
    stiffness: 150,
    mass: 0.6,
  });

  // Scale and Lift effect on hover
  const scale = useSpring(useMotionValue(1), { damping: 20, stiffness: 200 });
  const z = useSpring(useMotionValue(0), { damping: 20, stiffness: 200 });

  // Parallax sheen reflection movement
  const sheenX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const sheenY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize coordinates between -0.5 and 0.5
    x.set((mouseX / width) - 0.5);
    y.set((mouseY / height) - 0.5);
  };

  const handleMouseEnter = () => {
    scale.set(1.02);
    z.set(20);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    scale.set(1);
    z.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
      }}
      className={`relative rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-xl transition-all duration-300 hover:border-white/15 hover:shadow-[0_12px_30px_rgba(255,255,255,0.02)] cursor-pointer select-none overflow-hidden ${className}`}
    >
      {/* Dynamic Sheen overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(circle 180px at ${sheenX} ${sheenY}, rgba(255, 255, 255, 0.05), transparent)`,
        }}
      />

      {/* Floating Card Badge (FREE or PRO) */}
      {badge && (
        <span 
          style={{ transform: "translateZ(15px)" }}
          className={`absolute top-4 right-4 z-30 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase border tracking-wider select-none ${
            badge === "PRO" 
              ? "bg-white/10 text-white border-white/20" 
              : "bg-white/[0.02] text-[#888888] border-white/5"
          }`}
        >
          {badge}
        </span>
      )}

      {/* Floating internal content layer */}
      <div 
        style={{ 
          transform: "translateZ(10px)",
          transformStyle: "preserve-3d" 
        }} 
        className="relative z-20 h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}
