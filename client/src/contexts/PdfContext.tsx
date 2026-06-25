/**
 * PdfContext — manages PDF document state, page navigation, and scale settings.
 * Studio Light design: clean, professional tool aesthetic.
 */
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface PageInfo {
  pageNumber: number;
  width: number;   // points (1/72 inch)
  height: number;  // points
  widthMm: number;
  heightMm: number;
  rotation: number;
}

export interface PdfState {
  file: File | null;
  fileName: string;
  numPages: number;
  currentPage: number;
  pages: PageInfo[];
  // Scale: user sets real-world length per pixel, e.g. "1px = 0.05m"
  // scaleRatio: real-world meters per PDF point
  scaleNumerator: number;   // real-world value
  scaleDenominator: number; // PDF points value
  scaleUnit: "m" | "cm" | "mm";
  renderScale: number; // canvas render resolution multiplier (1-3)
  pdfDoc: pdfjs.PDFDocumentProxy | null; // reactive reference
}

interface PdfContextValue extends PdfState {
  pdfDocRef: React.MutableRefObject<pdfjs.PDFDocumentProxy | null>;
  loadPdf: (file: File) => Promise<void>;
  setCurrentPage: (page: number) => void;
  setScale: (numerator: number, denominator: number, unit: "m" | "cm" | "mm") => void;
  setRenderScale: (scale: number) => void;
  isLoading: boolean;
  error: string | null;
}

const PdfContext = createContext<PdfContextValue | null>(null);

const POINTS_TO_MM = 25.4 / 72; // 1 pt = 0.352778 mm

export function PdfProvider({ children }: { children: React.ReactNode }) {
  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const [state, setState] = useState<PdfState>({
    file: null,
    fileName: "",
    numPages: 0,
    currentPage: 1,
    pages: [],
    scaleNumerator: 1,
    scaleDenominator: 100,
    scaleUnit: "m",
    renderScale: 1.5,
    pdfDoc: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;

      const pages: PageInfo[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        pages.push({
          pageNumber: i,
          width: viewport.width,
          height: viewport.height,
          widthMm: viewport.width * POINTS_TO_MM,
          heightMm: viewport.height * POINTS_TO_MM,
          rotation: viewport.rotation,
        });
      }

      pdfDocRef.current = pdfDoc;
      setState((prev) => ({
        ...prev,
        file,
        fileName: file.name,
        numPages: pdfDoc.numPages,
        currentPage: 1,
        pages,
        pdfDoc,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, currentPage: Math.max(1, Math.min(page, prev.numPages)) }));
  }, []);

  const setScale = useCallback(
    (numerator: number, denominator: number, unit: "m" | "cm" | "mm") => {
      setState((prev) => ({ ...prev, scaleNumerator: numerator, scaleDenominator: denominator, scaleUnit: unit }));
    },
    []
  );

  const setRenderScale = useCallback((scale: number) => {
    setState((prev) => ({ ...prev, renderScale: scale }));
  }, []);

  return (
    <PdfContext.Provider
      value={{
        ...state,
        pdfDocRef,
        loadPdf,
        setCurrentPage,
        setScale,
        setRenderScale,
        isLoading,
        error,
      }}
    >
      {children}
    </PdfContext.Provider>
  );
}

export function usePdf() {
  const ctx = useContext(PdfContext);
  if (!ctx) throw new Error("usePdf must be used within PdfProvider");
  return ctx;
}
