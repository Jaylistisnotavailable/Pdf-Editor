/**
 * usePdfRenderer — renders a PDF page to a canvas element using PDF.js
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

interface UsePdfRendererOptions {
  pdfDoc: pdfjs.PDFDocumentProxy | null;
  pageNumber: number;
  renderScale: number;
  onDimensionsChange?: (width: number, height: number) => void;
}

export function usePdfRenderer({
  pdfDoc,
  pageNumber,
  renderScale,
  onDimensionsChange,
}: UsePdfRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;

  const render = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch { /* ignore */ }
      renderTaskRef.current = null;
    }

    setIsRendering(true);
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderScale });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const newDims = { width: viewport.width, height: viewport.height };
      setDimensions(newDims);
      onDimensionsChangeRef.current?.(viewport.width, viewport.height);

      const renderTask = page.render({
        canvas: canvas,
        canvasContext: ctx,
        viewport,
      });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "RenderingCancelledException") {
        console.error("PDF render error:", err);
      }
    } finally {
      setIsRendering(false);
    }
  }, [pdfDoc, pageNumber, renderScale]);

  useEffect(() => {
    render();
  }, [render]);

  return { canvasRef, isRendering, dimensions };
}
