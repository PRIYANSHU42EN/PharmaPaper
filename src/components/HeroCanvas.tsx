"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const isMobileDevice = () =>
  typeof window !== "undefined" &&
  (/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) || window.innerWidth < 768);

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoaded, setModelLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const isMobile = isMobileDevice();
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── Dimensions ─────────────────────────────────────────────────────────
    let W = typeof window !== "undefined" ? window.innerWidth : 1200;
    let H = typeof window !== "undefined" ? window.innerHeight : 800;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 6);

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(isMobile ? 1.2 : Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // ── Lighting ───────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#aaaaaa", 1.2);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight1 = new THREE.PointLight("#888888", 0.8, 20);
    pointLight1.position.set(-3, -3, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight("#cccccc", 0.3, 20); // subtle warm backlight
    pointLight2.position.set(0, 5, -3);
    scene.add(pointLight2);

    const coverGlow = new THREE.PointLight("#aaaaaa", 0.8, 10);
    coverGlow.position.set(0, 0, 1.2);
    scene.add(coverGlow);

    // ── Book Group ─────────────────────────────────────────────────────────
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    // ── Procedural Fallback Book ───────────────────────────────────────────
    const makeProceduralBook = () => {
      const g = new THREE.Group();

      // Cover
      const coverGeo = new THREE.BoxGeometry(1.4, 2.0, 0.18);
      const coverMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.3,
        metalness: 0.1,
      });
      const coverMesh = new THREE.Mesh(coverGeo, coverMat);
      g.add(coverMesh);

      // Spine
      const spineGeo = new THREE.BoxGeometry(0.12, 2.0, 0.18);
      const spineMat = new THREE.MeshStandardMaterial({
        color: 0x171717,
        roughness: 0.35,
        metalness: 0.1,
      });
      const spineMesh = new THREE.Mesh(spineGeo, spineMat);
      spineMesh.position.x = -0.64;
      g.add(spineMesh);

      // Pages
      const pagesGeo = new THREE.BoxGeometry(1.28, 1.9, 0.14);
      const pagesMat = new THREE.MeshStandardMaterial({
        color: 0xF8F9FA,
        roughness: 0.8,
        metalness: 0.0,
      });
      const pagesMesh = new THREE.Mesh(pagesGeo, pagesMat);
      pagesMesh.position.x = 0.08;
      g.add(pagesMesh);

      // Dynamic Canvas Texture for Title
      const textCanvas = document.createElement("canvas");
      textCanvas.width = 256;
      textCanvas.height = 512;
      const ctx = textCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#222222";
        ctx.fillRect(0, 0, 256, 512);

        // Draw accent lines
        ctx.strokeStyle = "#888888";
        ctx.lineWidth = 4;
        ctx.strokeRect(12, 12, 232, 488);

        ctx.fillStyle = "#F1F5F9";
        ctx.font = "bold 32px Syne, system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PHARMA", 128, 220);
        ctx.fillText("PAPER", 128, 270);

        ctx.fillStyle = "#aaaaaa";
        ctx.font = "italic 18px Inter, system-ui";
        ctx.fillText("Study Vault", 128, 330);
      }

      const textTex = new THREE.CanvasTexture(textCanvas);
      const titleGeo = new THREE.PlaneGeometry(1.3, 1.9);
      const titleMat = new THREE.MeshStandardMaterial({
        map: textTex,
        roughness: 0.4,
      });
      const titleMesh = new THREE.Mesh(titleGeo, titleMat);
      titleMesh.position.set(0.01, 0, 0.092); // place right on top of cover
      g.add(titleMesh);

      return g;
    };

    const proceduralBook = makeProceduralBook();
    bookGroup.add(proceduralBook);

    // Initial scale and position
    bookGroup.position.set(1.4, 0, 0);
    if (isMobile) {
      bookGroup.position.set(0, 0.5, 0);
      bookGroup.scale.setScalar(0.8);
    }

    // ── GLTF & Draco Loader ────────────────────────────────────────────────
    let dracoLoaderInstance: any = null;
    const loadGLBModel = async () => {
      try {
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
        const loader = new GLTFLoader();

        dracoLoaderInstance = new DRACOLoader();
        dracoLoaderInstance.setDecoderPath(window.location.origin + "/draco/");
        loader.setDRACOLoader(dracoLoaderInstance);

        // Try /book.glb first, then fallback to /models/book.glb
        const modelPath = "/book.glb";
        loader.load(
          modelPath,
          (gltf) => {
            const highPolyGLBModel = gltf.scene;

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(highPolyGLBModel);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            highPolyGLBModel.position.sub(center);
            highPolyGLBModel.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z));

            highPolyGLBModel.traverse((child: any) => {
              if (child.isMesh) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m: any) => {
                  if (m) {
                    m.roughness = Math.min(Math.max(m.roughness ?? 0.5, 0.35), 0.8);
                    m.metalness = Math.max(m.metalness ?? 0.1, 0.2);
                  }
                });
              }
            });

            // Remove procedural fallback and add GLB model
            bookGroup.remove(proceduralBook);
            bookGroup.add(highPolyGLBModel);
            setModelLoaded(true);
          },
          undefined,
          (err) => {
            console.warn("Failed to load /book.glb, trying fallback /models/book.glb:", err);
            loader.load(
              "/models/book.glb",
              (gltfFallback) => {
                const highPolyGLBModel = gltfFallback.scene;
                const box = new THREE.Box3().setFromObject(highPolyGLBModel);
                const center = new THREE.Vector3();
                const size = new THREE.Vector3();
                box.getCenter(center);
                box.getSize(size);
                highPolyGLBModel.position.sub(center);
                highPolyGLBModel.scale.setScalar(2.6 / Math.max(size.x, size.y, size.z));

                // Remove procedural fallback and add GLB model
                bookGroup.remove(proceduralBook);
                bookGroup.add(highPolyGLBModel);
                setModelLoaded(true);
              },
              undefined,
              () => setModelLoaded(false)
            );
          }
        );
      } catch (e) {
        console.error("Loader initialization error:", e);
        setModelLoaded(false);
      }
    };

    loadGLBModel();

    // ── GSAP Scroll Timeline (500vh scroll) ──────────────────────────────
    const scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    });

    if (isMobile) {
      // Zone 1 -> Zone 2 (0 to 0.25)
      scrollTimeline
        .to(bookGroup.position, { x: 0, y: -0.2, z: -0.8 }, 0)
        .to(bookGroup.scale, { x: 0.7, y: 0.7, z: 0.7 }, 0)
        .to(bookGroup.rotation, { x: 0.1, y: 0.6, z: -0.05 }, 0);

      // Zone 2 -> Zone 3 (0.25 to 0.5)
      scrollTimeline
        .to(bookGroup.position, { x: 0, y: 0.3, z: 0 }, 0.25)
        .to(bookGroup.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.25)
        .to(bookGroup.rotation, { x: 0, y: -0.4, z: 0 }, 0.25);

      // Zone 3 -> Zone 4 (0.5 to 0.75)
      scrollTimeline
        .to(bookGroup.position, { x: 0, y: -0.4, z: -0.5 }, 0.5)
        .to(bookGroup.scale, { x: 0.75, y: 0.75, z: 0.75 }, 0.5)
        .to(bookGroup.rotation, { x: -0.1, y: 0.4, z: 0.05 }, 0.5);

      // Zone 4 -> Zone 5 (0.75 to 1.0)
      scrollTimeline
        .to(bookGroup.position, { x: 0.8, y: 1.2, z: -1 }, 0.75)
        .to(bookGroup.scale, { x: 0.5, y: 0.5, z: 0.5 }, 0.75)
        .to(bookGroup.rotation, { x: 0.15, y: -0.6, z: -0.1 }, 0.75);
    } else {
      // Zone 1 -> Zone 2 (0 to 0.25)
      scrollTimeline
        .to(bookGroup.position, { x: -2, y: -0.5, z: -1.5 }, 0)
        .to(bookGroup.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0)
        .to(bookGroup.rotation, { x: 0.1, y: 0.8, z: -0.1 }, 0);

      // Zone 2 -> Zone 3 (0.25 to 0.5)
      scrollTimeline
        .to(bookGroup.position, { x: -1.8, y: 0, z: 0 }, 0.25)
        .to(bookGroup.scale, { x: 1.0, y: 1.0, z: 1.0 }, 0.25)
        .to(bookGroup.rotation, { x: 0, y: -0.5, z: 0 }, 0.25);

      // Zone 3 -> Zone 4 (0.5 to 0.75)
      scrollTimeline
        .to(bookGroup.position, { x: 1.8, y: -0.2, z: -0.5 }, 0.5)
        .to(bookGroup.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0.5)
        .to(bookGroup.rotation, { x: -0.1, y: 0.5, z: 0.1 }, 0.5);

      // Zone 4 -> Zone 5 (0.75 to 1.0)
      scrollTimeline
        .to(bookGroup.position, { x: 1.8, y: 1.5, z: -1 }, 0.75)
        .to(bookGroup.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0.75)
        .to(bookGroup.rotation, { x: 0.2, y: -0.8, z: -0.2 }, 0.75);
    }

    // ── Drag-to-spin system (Unified Pointer Events on Drag Zone) ──────────
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const dragZone = document.getElementById("hero-drag-zone");

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      velocityX = 0;
      velocityY = 0;
      if (dragZone) dragZone.style.cursor = "grabbing";
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      velocityX = deltaX * 0.008;
      velocityY = deltaY * 0.008;

      bookGroup.rotation.y += velocityX;
      bookGroup.rotation.x += velocityY;

      // Clamp X rotation
      bookGroup.rotation.x = Math.max(
        -Math.PI / 4,
        Math.min(Math.PI / 4, bookGroup.rotation.x)
      );

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
      if (dragZone) dragZone.style.cursor = "grab";
    };

    if (dragZone && !isMobile) {
      dragZone.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    }

    // ── Render / Animation Loop ───────────────────────────────────────────
    const clock = new THREE.Clock();
    let animFrameId: number;

    const renderLoop = () => {
      animFrameId = requestAnimationFrame(renderLoop);

      const time = clock.getElapsedTime();

      // Idle float (Respect prefersReducedMotion)
      if (!prefersReduced) {
        bookGroup.position.y += Math.sin(time * 0.8) * 0.001; // subtle float offset

        if (!isDragging) {
          bookGroup.rotation.y += 0.003; // slow auto-spin
        }
      }

      // Momentum: decay velocity in render loop
      if (!isDragging) {
        velocityX *= 0.92;
        velocityY *= 0.92;
        bookGroup.rotation.y += velocityX;
        bookGroup.rotation.x += velocityY;
        // Damp X rotation back to center/idle bounds
        bookGroup.rotation.x *= 0.95;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // ── Window Resize ──────────────────────────────────────────────────────
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
      renderer.setPixelRatio(isMobile ? 1.2 : Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // ── Memory Cleanup ─────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      if (dragZone) {
        dragZone.removeEventListener("pointerdown", handlePointerDown);
      }
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      ScrollTrigger.getAll().forEach((t) => t.kill());

      scene.traverse((child: any) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (Array.isArray(child.material)) {
            (child.material as any[]).forEach((m: any) => m?.dispose());
          } else {
            child.material?.dispose();
          }
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
        className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        style={{
          touchAction: "none",
          willChange: "transform",
        }}
      />
    </div>
  );
}
