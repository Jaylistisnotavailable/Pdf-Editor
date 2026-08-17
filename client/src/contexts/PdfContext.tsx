import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
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

  scaleNumerator: number;
  scaleDenominator: number;
  scaleUnit: "m" | "cm" | "mm";

  renderScale: number;

  pdfDoc:
    | pdfjs.PDFDocumentProxy
    | null;
}

interface PdfContextValue
  extends PdfState {

  pdfDocRef: React.MutableRefObject<
    pdfjs.PDFDocumentProxy | null
  >;

  loadPdf: (
    file: File
  ) => Promise<void>;

  clearPdf: () => void;

  setCurrentPage: (
    page: number
  ) => void;

  setScale: (
    numerator: number,
    denominator: number,
    unit: "m" | "cm" | "mm"
  ) => void;

  setRenderScale: (
    scale: number
  ) => void;

  isLoading: boolean;
  error: string | null;
}

const PdfContext =
  createContext<PdfContextValue | null>(
    null
  );

const POINTS_TO_MM =
  25.4 / 72;

export function PdfProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pdfDocRef =
    useRef<pdfjs.PDFDocumentProxy | null>(
      null
    );

  const [state, setState] =
    useState<PdfState>({
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

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadPdf = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        if (pdfDocRef.current) {
          try {
            await pdfDocRef.current.destroy();
          } catch {
            // ignore
          }
        }

        const arrayBuffer =
          await file.arrayBuffer();

        const loadingTask =
          pdfjs.getDocument({
            data: arrayBuffer,
          });

        const pdfDoc =
          await loadingTask.promise;

        const pages: PageInfo[] = [];

        for (
          let i = 1;
          i <= pdfDoc.numPages;
          i++
        ) {
          const page =
            await pdfDoc.getPage(i);

          const viewport =
            page.getViewport({
              scale: 1,
            });

          pages.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,

            widthMm:
              viewport.width *
              POINTS_TO_MM,

            heightMm:
              viewport.height *
              POINTS_TO_MM,

            rotation:
              viewport.rotation,
          });
        }

        pdfDocRef.current = pdfDoc;

        setState((prev) => ({
          ...prev,

          file,
          fileName: file.name,

          numPages:
            pdfDoc.numPages,

          currentPage: 1,

          pages,

          pdfDoc,
        }));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load PDF";

        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearPdf = useCallback(() => {
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.destroy();
      } catch {
        // ignore
      }
    }

    pdfDocRef.current = null;

    setState((prev) => ({
      ...prev,

      file: null,
      fileName: "",
      numPages: 0,
      currentPage: 1,
      pages: [],
      pdfDoc: null,
    }));
  }, []);

  const setCurrentPage =
    useCallback((page: number) => {
      setState((prev) => ({
        ...prev,

        currentPage: Math.max(
          1,
          Math.min(
            page,
            prev.numPages
          )
        ),
      }));
    }, []);

  const setScale =
    useCallback(
      (
        numerator: number,
        denominator: number,
        unit: "m" | "cm" | "mm"
      ) => {
        setState((prev) => ({
          ...prev,

          scaleNumerator:
            numerator,

          scaleDenominator:
            denominator,

          scaleUnit: unit,
        }));
      },
      []
    );

  const setRenderScale =
    useCallback(
      (scale: number) => {
        setState((prev) => ({
          ...prev,
          renderScale: scale,
        }));
      },
      []
    );

  return (
    <PdfContext.Provider
      value={{
        ...state,

        pdfDocRef,

        loadPdf,
        clearPdf,

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
  const context =
    useContext(PdfContext);

  if (!context) {
    throw new Error(
      "usePdf must be used within PdfProvider"
    );
  }

  return context;
}
