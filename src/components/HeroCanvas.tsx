"use client";

import { useEffect, useRef, useState } from "react";
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  Group,
  LOD,
  Box3,
  Vector3,
  BoxGeometry,
  MeshStandardMaterial,
  Mesh,
  ACESFilmicToneMapping,
  SRGBColorSpace
} from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  (/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || window.innerWidth < 768);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoaded, setModelLoaded] = useState<boolean | null>(null);
  const [showDragHint, setShowDragHint] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const mobile = isMobileDevice();
    const noMotion = prefersReducedMotion();

    // ── Dimensions ─────────────────────────────────────────────────────────
    let rect = canvas.getBoundingClientRect();
    let W = rect.width;
    let H = rect.height;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new Scene();

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new PerspectiveCamera(40, W / H, 0.1, 200);
    camera.position.set(0, 0, 7);

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new WebGLRenderer({
      canvas: canvas,
      antialias: !mobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.2 : W < 1440 ? 1.5 : 2));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.outputColorSpace = SRGBColorSpace;

    // ── Lights ─────────────────────────────────────────────────────────────
    scene.add(new AmbientLight("#ffffff", 1.4));
    const key = new DirectionalLight("#fff8ee", 4.2);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new DirectionalLight("#00A6FB", 2.2); // Toned to brand light blue
    fill.position.set(-7, 1, 4);
    scene.add(fill);
    const rim = new DirectionalLight("#0582CA", 3.0); // Toned to brand steel blue
    rim.position.set(0, -5, -3);
    scene.add(rim);
    const topLight = new DirectionalLight("#ffd5a0", 2.2);
    topLight.position.set(0, 10, 0);
    scene.add(topLight);

    // ── Book group ─────────────────────────────────────────────────────────
    const bookGroup = new Group();
    scene.add(bookGroup);

    // ── World-unit helpers ─────────────────────────────────────────────────
    const getWU = () => {
      const vFov = (camera.fov * Math.PI) / 180;
      const halfH = Math.tan(vFov / 2) * camera.position.z;
      return { halfH, halfW: halfH * camera.aspect };
    };

    // ── Lerp state ─────────────────────────────────────────────────────────
    const target  = { posX: 0, posY: 0, rotX: 0.10, rotY: 0, rotZ: 0, scale: 1 };
    const current = { ...target };

    // Drag-to-spin offset
    let dragRotY = 0;
    let dragRotX = 0;
    let velX = 0;
    let velY = 0;

    // Hero idle float bob
    let floatBobElapsed = 0;
    const LERP = mobile ? 0.04 : 0.05;

    // ── Initial pose ───────────────────────────────────────────────────────
    const applyInitialPose = () => {
      const { halfW } = getWU();
      if (mobile) {
        target.posX  = 0;
        target.posY  = 0.6;
        target.scale = 0.72;
      } else {
        target.posX  = halfW * 0.28;
        target.posY  = -0.05;
        target.scale = 1.0;
      }
      target.rotX = 0.10;
      target.rotY = 0;
      target.rotZ = 0;
    };

    applyInitialPose();
    Object.assign(current, target);
    bookGroup.position.set(current.posX, current.posY, 0);
    bookGroup.rotation.set(current.rotX, current.rotY, current.rotZ);
    bookGroup.scale.setScalar(current.scale);

    // ── Procedural fallback (used as loading placeholder & LOD level) ───────
    const makeFallback = () => {
      const g = new Group();
      g.add(new Mesh(
        new BoxGeometry(1.6, 2.2, 0.25),
        new MeshStandardMaterial({ color: "#0582CA", roughness: 0.55, metalness: 0.1 })
      ));
      const pages = new Mesh(
        new BoxGeometry(1.52, 2.12, 0.21),
        new MeshStandardMaterial({ color: "#ede9df", roughness: 0.85 })
      );
      pages.position.x = 0.04;
      g.add(pages);
      const spine = new Mesh(
        new BoxGeometry(0.08, 2.22, 0.27),
        new MeshStandardMaterial({ color: "#f0ece4", roughness: 0.4, metalness: 0.2 })
      );
      spine.position.x = -0.78;
      g.add(spine);
      return g;
    };

    // Add initial placeholder procedural book to prevent layout gap while loading
    const placeholderBook = makeFallback();
    bookGroup.add(placeholderBook);

    // ── Load GLB with Draco Compression ────────────────────────────────────
    let dracoLoaderInstance: any = null;
    const loadModel = async () => {
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
        const loader = new GLTFLoader();
        
        dracoLoaderInstance = new DRACOLoader();
        dracoLoaderInstance.setDecoderPath("/draco/");
        loader.setDRACOLoader(dracoLoaderInstance);

        loader.load(
          "/book.glb",
          (gltf) => {
            const model = gltf.scene;
            const box = new Box3().setFromObject(model);
            const center = new Vector3(), size = new Vector3();
            box.getCenter(center); box.getSize(size);
            model.position.sub(center);
            model.scale.setScalar(3.0 / Math.max(size.x, size.y, size.z));

            model.traverse((child: any) => {
              if (!child.isMesh) return;
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach((m: any) => {
                m.roughness = Math.min(Math.max(m.roughness ?? 0.5, 0.3), 0.85);
                m.needsUpdate = true;
              });
            });

            // Remove loading placeholder
            bookGroup.remove(placeholderBook);

            // Implement Level of Detail (LOD)
            const lod = new LOD();
            const lowPolyBook = makeFallback();
            
            if (mobile) {
              lod.addLevel(model, 0);
              lod.addLevel(lowPolyBook, 1.5);
            } else {
              lod.addLevel(model, 0);
              lod.addLevel(lowPolyBook, 6.0);
            }

            bookGroup.add(lod);
            setModelLoaded(true);

            // Progressive Animation: Scale up from 0 to target scale
            lod.scale.set(0, 0, 0);
            gsap.to(lod.scale, {
              x: 1,
              y: 1,
              z: 1,
              duration: 1.2,
              ease: "power2.out",
            });
          },
          undefined,
          () => {
            setModelLoaded(false);
          }
        );
      } catch {
        setModelLoaded(false);
      }
    };

    loadModel();

    // ── GSAP Scroll Timeline ───────────────────────────────────────────────
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const buildScrollTL = () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      const { halfW, halfH } = getWU();
      const fullTurn = -Math.PI * 2;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scroll-container",
          start: "top top",
          end: "bottom bottom",
          scrub: mobile ? 1.5 : 2.5,
          invalidateOnRefresh: true,
        },
      });

      if (mobile) {
        tl.to(target, {
          posX: halfW * 0.35,
          posY: halfH * 0.10,
          rotX: 0.18,
          rotY: fullTurn * 0.33,
          rotZ: 0.04,
          scale: 0.78,
          ease: "power2.inOut",
          duration: 1,
        }, 0);

        tl.to(target, {
          posX: -halfW * 0.35,
          posY: -halfH * 0.05,
          rotX: -0.10,
          rotY: fullTurn * 0.67,
          rotZ: -0.04,
          scale: 0.78,
          ease: "power2.inOut",
          duration: 1,
        }, 1);

        tl.to(target, {
          posX: halfW * 0.48,
          posY: halfH * 0.35,
          rotX: 0.08,
          rotY: fullTurn,
          rotZ: 0.0,
          scale: 0.55,
          ease: "power3.inOut",
          duration: 1,
        }, 2);
      } else {
        tl.to(target, {
          posX: halfW * 0.92,
          posY: -halfH * 0.06,
          rotX: 0.22,
          rotY: fullTurn * 0.33,
          rotZ: 0.08,
          scale: 1.25,
          ease: "power2.inOut",
          duration: 1,
        }, 0);

        tl.to(target, {
          posX: -halfW * 0.92,
          posY: halfH * 0.06,
          rotX: -0.12,
          rotY: fullTurn * 0.67,
          rotZ: -0.06,
          scale: 1.30,
          ease: "power2.inOut",
          duration: 1,
        }, 1);

        tl.to(target, {
          posX: halfW * 0.65,
          posY: halfH * 0.48,
          rotX: 0.08,
          rotY: fullTurn,
          rotZ: 0.0,
          scale: 0.70,
          ease: "power3.inOut",
          duration: 1,
        }, 2);
      }
    };

    const tlTimer = setTimeout(buildScrollTL, 250);

    // ── Drag-to-spin Bounded Zone (Unified Pointer Events for Desktop + Mobile) ──
    let isDragging = false;
    let prevX = 0, prevY = 0;
    const dragZone = document.getElementById("hero-drag-zone");

    if (dragZone) {
      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        prevX = e.clientX; prevY = e.clientY;
        velX = 0; velY = 0;
        dragZone.style.cursor = "grabbing";
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setShowDragHint(false);
        velX = dx * 0.008;
        velY = dy * 0.006;
        dragRotY += velX;
        dragRotX += velY;
        
        // Clamp X rotation to avoid flipping upside down
        dragRotX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, dragRotX));

        prevX = e.clientX; prevY = e.clientY;
      };

      const onPointerUp = () => {
        isDragging = false;
        dragZone.style.cursor = "grab";
      };

      dragZone.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      (dragZone as any)._cleanup = () => {
        dragZone.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };
    }

    // ── GSAP Ticker (Render + Lerp Loop) ───────────────────────────────────
    const floatAmp = noMotion ? 0 : 0.00040;
    const idleSpinSpeed = noMotion ? 0 : mobile ? 0.006 : 0.0008;

    const tick = (_time: number, deltaTime: number) => {
      floatBobElapsed += deltaTime / 1000;

      // Gentle floating bob applied directly to posY to avoid accumulative drift
      const bob = Math.sin(floatBobElapsed * 1.25) * (noMotion ? 0 : 0.08);

      const atHero = scrollY < window.innerHeight * 0.05;

      if (!isDragging) {
        if (atHero) {
          dragRotY += idleSpinSpeed;
        }
        velX *= 0.94;
        velY *= 0.94;
        dragRotY += velX;
        dragRotX += velY;
        // Damp and clamp X rotation back to center/idle bounds if not dragging
        dragRotX *= 0.95;
      }

      // Lerp current → target
      current.posX  += (target.posX  - current.posX)  * LERP;
      current.posY  += (target.posY  - current.posY)  * LERP;
      current.rotX  += (target.rotX  - current.rotX)  * LERP;
      current.rotY  += (target.rotY  - current.rotY)  * LERP;
      current.rotZ  += (target.rotZ  - current.rotZ)  * LERP;
      current.scale += (target.scale - current.scale) * LERP;

      bookGroup.position.set(current.posX, current.posY + bob, 0);
      bookGroup.rotation.set(
        current.rotX + dragRotX,
        current.rotY + dragRotY,
        current.rotZ
      );
      bookGroup.scale.setScalar(current.scale);

      renderer.render(scene, camera);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(500, 33);

    // ── Resize ─────────────────────────────────────────────────────────────
    let resizeT: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        if (!canvas) return;
        rect = canvas.getBoundingClientRect();
        W = rect.width;
        H = rect.height;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.2 : 2));
        applyInitialPose();
        buildScrollTL();
      }, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ── Cleanup (Disposing geometry, materials, and loaders to prevent memory leaks) ──
    return () => {
      clearTimeout(tlTimer);
      clearTimeout(resizeT);
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      
      if (dragZone && (dragZone as any)._cleanup) {
        (dragZone as any)._cleanup();
      }

      ScrollTrigger.getAll().forEach((t) => t.kill());
      
      scene.traverse((obj: any) => {
        if (!obj.isMesh) return;
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m: any) => {
            if (m && typeof m.dispose === "function") m.dispose();
            Object.values(m ?? {}).forEach((v: any) => {
              if (v && typeof v.dispose === "function") {
                v.dispose();
              }
            });
          });
        }
      });

      if (dracoLoaderInstance) {
        dracoLoaderInstance.dispose();
      }
      
      renderer.dispose();
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="fixed right-0 top-1/4 w-[50vw] h-[50vh] md:inset-0 md:w-full md:h-full z-0 pointer-events-none hero-canvas"
        style={{
          touchAction: "none",
          willChange: "transform",
        }}
      />

      {/* Drag hint — desktop only */}
      {showDragHint && modelLoaded !== null && !isMobileDevice() && (
        <div
          className="fixed pointer-events-none select-none z-30"
          style={{ bottom: "20vh", left: "50%", transform: "translateX(-50%)" }}
        >
          <span
            className="text-[11px] tracking-[0.22em] uppercase font-mono"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            ↔ drag to spin
          </span>
        </div>
      )}

      {/* Fallback procedural badge */}
      {modelLoaded === false && (
        <div className="fixed bottom-4 right-4 bg-black/80 border border-brand/40 text-xs px-3 py-1.5 rounded-full text-brand select-none pointer-events-none font-medium flex items-center gap-1.5 z-50">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
          Procedural Render
        </div>
      )}
    </div>
  );
}
