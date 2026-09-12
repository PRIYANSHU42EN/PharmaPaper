# Agent Guidelines — PharmaPaper

This repository defines strict coding, design, and animation standards for all AI coding agents working on PharmaPaper.

## Core Design, Animation & Interactive Experience Skills (Main Skills)

When building, enhancing, or refining UI components, aesthetics, 3D scenes, animations, interactive elements, scroll effects, or hero presentations in this repository:

1. **Claude Design Skillstack (`modern-web-design`) — Primary Design & Aesthetic Standard**:
   - Always prioritize **Claude Design Skills** for UI/UX engineering, visual hierarchy, harmonious color palettes (avoiding plain generic defaults), fluid typography, subtle glassmorphism, and modern web design excellence.
   - For 3D WebGL / Canvas integrations, prioritize **Three.js** (`threejs-webgl`) and **React Three Fiber** (`react-three-fiber`).
   - For React declarative animations, leverage **Framer Motion** (`motion-framer`).
   - Available Skills: `modern-web-design`, `threejs-webgl`, `react-three-fiber`, `motion-framer`, `web3d-integration-patterns`, `animated-component-libraries`, `scroll-reveal-libraries`, `animejs`, `lottie-animations`, `react-spring-physics`, `spline-interactive`, `rive-interactive`.

2. **GSAP (GreenSock Animation Platform) — Primary Animation Engine**:
   - Always prioritize **GSAP** (`gsap`, `gsap-react`, `gsap-scrolltrigger`, `gsap-core`) for timelines, micro-interactions, entrance sequences, and ScrollTrigger-linked visuals.
   - For React/Next.js components, integrate cleanly with `@gsap/react` / `useGSAP` or `gsap.context()` for robust unmounting/cleanup without memory leaks.
   - Available Skills: `gsap`, `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-react`, `gsap-performance`, `gsap-utils`.

3. **Scroll-World — Primary 3D & Diorama Fly-Through Engine**:
   - Always prioritize **Scroll-World** (`scroll-world`) for continuous camera-dive landing sections, isometric diorama navigation, and seamless frame-locked scroll scrubbing.
   - Available Skill: `scroll-world` (with bundled `scrub-engine.js` and multi-scene connector pipeline).

All three main skill suites (**Claude Design Skillstack**, **GSAP**, and **Scroll-World**) are configured as the main skills in agent environments (`~/.gemini/config/skills/`, `~/.claude/skills/`, and `~/.codex/skills/`).
