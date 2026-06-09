"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface InlinePDFViewerProps {
  pdfUrl: string;
  onClose?: () => void;
  title?: string;
}

export default function InlinePDFViewer({ pdfUrl, onClose, title = "Document Viewer" }: InlinePDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isEngineLoading, setIsEngineLoading] = useState(true);
  const [isRenderLoading, setIsRenderLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const proxiedUrl = `/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`;

  // 1. Load PDF.js + fetch PDF with download progress
  useEffect(() => {
    let active = true;
    const scriptId = "pdfjs-lib-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initPdfJs = async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          throw new Error("PDF.js not loaded");
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        // Fetch PDF through proxy with progress tracking
        const response = await fetch(proxiedUrl);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const contentLength = response.headers.get("content-length");
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

        // If we have Content-Length, read with progress; otherwise read at once
        let pdfData: ArrayBuffer;

        if (totalBytes > 0 && response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let receivedBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedBytes += value.length;
            if (active) {
              setDownloadProgress(Math.round((receivedBytes / totalBytes) * 100));
            }
          }

          // Combine chunks into single ArrayBuffer
          const combined = new Uint8Array(receivedBytes);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          pdfData = combined.buffer;
        } else {
          pdfData = await response.arrayBuffer();
          if (active) setDownloadProgress(100);
        }

        // Load the PDF from the downloaded data (no second network request)
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;

        if (active) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setIsEngineLoading(false);
        }
      } catch (err: any) {
        console.error("PDF.js loading error:", err);
        if (active) {
          setErrorMsg("Failed to load the PDF. The file may be unavailable.");
          setIsEngineLoading(false);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      script.onload = () => { initPdfJs(); };
      script.onerror = () => {
        if (active) {
          setErrorMsg("Failed to load PDF engine library from CDN.");
          setIsEngineLoading(false);
        }
      };
      document.body.appendChild(script);
    } else {
      if ((window as any).pdfjsLib) {
        initPdfJs();
      } else {
        script.addEventListener("load", initPdfJs);
      }
    }

    return () => {
      active = false;
      if (script) {
        script.removeEventListener("load", initPdfJs);
      }
    };
  }, [pdfUrl]);

  // 2. Render page — optimized with device pixel ratio capping
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      setIsRenderLoading(true);
      const page = await pdfDoc.getPage(pageNumber);

      if (!canvasRef.current || !containerRef.current) return;

      // Cancel previous render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const containerWidth = containerRef.current.clientWidth || 800;
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      // Fit to container width
      const widthScale = (containerWidth - 32) / unscaledViewport.width;
      const cssScale = widthScale * zoom;
      const viewport = page.getViewport({ scale: cssScale });

      // Cap device pixel ratio at 1.5 for speed (2x is overkill for PDFs)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
      });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err.name !== "RenderingCancelledException") {
        console.error("Render Page Error:", err);
      }
    } finally {
      setIsRenderLoading(false);
    }
  }, [pdfDoc, pageNumber, zoom]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // 3. Debounced resize handler — avoids re-rendering dozens of times during resize
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        renderPage();
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [renderPage]);

  const goToPrevPage = () => {
    if (pageNumber > 1) setPageNumber(pageNumber - 1);
  };

  const goToNextPage = () => {
    if (numPages && pageNumber < numPages) setPageNumber(pageNumber + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-5xl mx-auto h-[85vh] flex flex-col glass-panel border border-brand-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl bg-brand-charcoal/90"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-brand-border/50 bg-brand-charcoal/40 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_8px_rgba(142,146,144,0.8)] animate-pulse" />
          <h3 className="font-bebas text-2xl text-brand-cream tracking-wide uppercase mt-1">
            {title}
          </h3>
        </div>

        {/* Toolbar controls */}
        {!errorMsg && !isEngineLoading && (
          <div className="flex items-center justify-center gap-3 bg-brand-charcoal/60 border border-brand-border px-3 py-1.5 rounded-full">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="text-xs font-bold text-brand-cream hover:text-brand disabled:text-brand-cream/20 transition-colors uppercase font-mono px-2"
            >
              Prev
            </button>
            <span className="text-[10px] text-brand-cream/60 font-mono select-none">
              Page {pageNumber} of {numPages || "..."}
            </span>
            <button
              onClick={goToNextPage}
              disabled={numPages ? pageNumber >= numPages : true}
              className="text-xs font-bold text-brand-cream hover:text-brand disabled:text-brand-cream/20 transition-colors uppercase font-mono px-2"
            >
              Next
            </button>
            
            <span className="w-px h-3 bg-brand-border" />
            
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.2))}
              className="text-xs font-bold text-brand-cream hover:text-brand transition-colors font-mono px-2"
            >
              Zoom -
            </button>
            <span className="text-[10px] text-brand-cream/60 font-mono select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(2.0, prev + 0.2))}
              className="text-xs font-bold text-brand-cream hover:text-brand transition-colors font-mono px-2"
            >
              Zoom +
            </button>
          </div>
        )}
        
        <div className="flex items-center justify-end gap-3">
          {/* Full PDF Button */}
          <a
            href={proxiedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 rounded-full border border-brand-border text-brand-cream/70 hover:text-brand hover:border-brand/50 text-xs font-semibold tracking-wider uppercase transition-all duration-300"
          >
            Full PDF
          </a>

          {/* Download Button */}
          <a
            href={proxiedUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand hover:bg-brand-dark text-brand-charcoal font-semibold text-xs tracking-wider uppercase transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(142,146,144,0.3)]"
          >
            Download
          </a>
          
          {/* Close/Back Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center px-4 py-2 rounded-full border border-brand-border text-brand-cream/70 hover:text-brand hover:border-brand/50 text-xs font-semibold tracking-wider uppercase transition-all duration-300"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* PDF Canvas Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full bg-[#121212]/80 overflow-auto p-4 flex justify-center items-start"
      >
        {/* Download / Engine Loading State */}
        {isEngineLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-brand-charcoal/50 backdrop-blur-sm">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-brand-cream/10 border-t-brand rounded-full animate-spin shadow-[0_0_15px_rgba(142,146,144,0.5)]" />
              <div className="w-2.5 h-2.5 bg-brand rounded-full animate-pulse shadow-[0_0_10px_rgba(142,146,144,0.8)]" />
            </div>

            {/* Download progress bar */}
            {downloadProgress > 0 && downloadProgress < 100 ? (
              <div className="flex flex-col items-center gap-2 w-64">
                <div className="w-full h-1.5 bg-brand-charcoal/80 rounded-full overflow-hidden border border-brand-border/30">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="font-mono text-[10px] text-brand uppercase tracking-widest">
                  Downloading PDF... {downloadProgress}%
                </p>
              </div>
            ) : downloadProgress >= 100 ? (
              <p className="font-mono text-[10px] text-brand uppercase tracking-widest animate-pulse">
                Parsing Document...
              </p>
            ) : (
              <p className="font-mono text-[10px] text-brand uppercase tracking-widest animate-pulse">
                Initializing Renderer...
              </p>
            )}
          </div>
        )}

        {/* Page render loading pill */}
        {isRenderLoading && !isEngineLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-charcoal/90 border border-brand-border px-3 py-1.5 rounded-full z-10 text-[9px] font-mono uppercase tracking-widest text-brand animate-pulse">
            Rendering Page...
          </div>
        )}

        {errorMsg ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-8 max-w-md my-auto">
            <span className="text-3xl">⚠️</span>
            <h4 className="font-bebas text-2xl uppercase tracking-wider text-rose-400">Renderer Warning</h4>
            <p className="text-xs text-brand-cream/60 leading-relaxed font-mono">
              {errorMsg}
            </p>
            <a 
              href={proxiedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 text-xs font-semibold text-brand underline hover:text-brand-dark"
            >
              Open File Directly in Browser →
            </a>
          </div>
        ) : (
          <div className="relative border border-brand-border/40 rounded-xl overflow-hidden shadow-2xl bg-white/5">
            <canvas ref={canvasRef} className="block mx-auto max-w-full" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
