"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  animateImmediately?: boolean;
}

export default function BlurText({ 
  text, 
  className = "", 
  delay = 0.2, 
  stagger = 0.05,
  animateImmediately = false
}: BlurTextProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: stagger, 
        delayChildren: delay 
      },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100,
        duration: 0.8,
      },
    },
    hidden: {
      opacity: 0,
      y: 40,
      filter: "blur(10px)",
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100,
      },
    },
  };

  const animationProps = animateImmediately 
    ? { animate: "visible" } 
    : { whileInView: "visible", viewport: { once: true, margin: "-20px" } };

  return (
    <motion.div
      key={mounted ? "mounted" : "unmounted"}
      className={`flex flex-wrap ${className}`}
      variants={container}
      initial={mounted ? "hidden" : "visible"}
      {...animationProps}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          key={index}
          className="mr-[0.25em] inline-block last:mr-0"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
