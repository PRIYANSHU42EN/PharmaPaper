# Agent Guidelines — PharmaPaper

This repository defines strict coding and animation standards for all AI coding agents working on PharmaPaper.

## Core Animation & Interactive Experience Skills (Main Skills)

When building, enhancing, or refining animations, interactive elements, scroll effects, or hero presentations in this repository:

1. **GSAP (GreenSock Animation Platform) — Primary Animation Engine**:
   - Always prioritize **GSAP** (`gsap`, `gsap-react`, `gsap-scrolltrigger`, `gsap-core`) for timelines, micro-interactions, entrance sequences, and ScrollTrigger-linked visuals.
   - For React/Next.js components, integrate cleanly with `@gsap/react` / `useGSAP` or `gsap.context()` for robust unmounting/cleanup without memory leaks.
   - Available Skills: `gsap`, `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-performance`, `gsap-utils`.

2. **Scroll-World — Primary 3D & Diorama Fly-Through Engine**:
   - Always prioritize **Scroll-World** (`scroll-world`) for continuous camera-dive landing sections, isometric diorama navigation, and seamless frame-locked scroll scrubbing.
   - Available Skill: `scroll-world` (with bundled `scrub-engine.js` and multi-scene connector pipeline).

Both **GSAP** and **Scroll-World** are configured as the main animation skills in agent environments (`~/.gemini/config/skills/`, `~/.claude/skills/`, and `~/.codex/skills/`).
