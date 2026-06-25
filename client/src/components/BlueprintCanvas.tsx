/**
 * BlueprintCanvas — Main canvas area combining PDF background and Konva annotation layer.
 * Handles all drawing interactions based on the active tool.
 * Studio Light design: canvas-bg gray surround, white PDF page with shadow.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { usePdf } from "@/contexts/PdfContext";
import {
  useAnnotation,
  ToolType,
  Shape,
} from "@/contexts/AnnotationContext";
import { usePdfRenderer } from "@/hooks/usePdfRenderer";
import AnnotationLayer from "./AnnotationLayer";
import EmptyCanvasState from "./EmptyCanvasState";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  points: number[];
  tempShapeId: string | null;
}

const INITIAL_DRAWING: DrawingState = {
  isDrawing: false,
  startX: 0,
  startY: 0,
  points: [],
  tempShapeId: null,
};

function computeRealLength(
  points: number[],
  scaleNumerator: number,
  scaleDenominator: number,
  scaleUnit: string,
  renderScale: number
): string {
  if (points.length < 4) return "";
  let total = 0;
  for (let i = 0; i < points.length - 2; i += 2) {
    const dx = points[i + 2] - points[i];
    const dy = points[i + 3] - points[i + 1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  const pdfPoints = total / renderScale;
  const realValue = (pdfPoints * scaleNumerator) / scaleDenominator;
  return `${realValue.toFixed(2)} ${scaleUnit}`;
}

export default function BlueprintCanvas() {
  const {
    pdfDoc,
    currentPage,
    renderScale,
    scaleNumerator,
    scaleDenominator,
    scaleUnit,
    isLoading: pdfLoading,
    numPages,
    fileName,
  } = usePdf();

  const {
    activeTool,
    selectedShapeId,
    strokeColor,
    fillColor,
    strokeWidth,
    opacity,
    fontSize,
    addShape,
    updateShape,
    deleteShape,
    deleteSelected,
    setSelectedShapeId,
    getShapesForPage,
  } = useAnnotation();

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [pdfImage, setPdfImage] = useState<HTMLImageElement | null>(null);
  const drawingRef = useRef<DrawingState>(INITIAL_DRAWING);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // PDF offset (center the PDF in the stage)
  const pdfOffsetX = pdfImage ? (stageSize.width - pdfDimensions.width) / 2 : 0;
  const pdfOffsetY = pdfImage ? (stageSize.height - pdfDimensions.height) / 2 : 0;

  // Render PDF page using reactive pdfDoc from state
  const { canvasRef, isRendering } = usePdfRenderer({
    pdfDoc,
    pageNumber: currentPage,
    renderScale,
    onDimensionsChange: (w, h) => {
      setPdfDimensions({ width: w, height: h });
    },
  });

  // Clear PDF image when file/page/scale changes
  useEffect(() => {
    setPdfImage(null);
  }, [fileName, currentPage, renderScale]);

  // Convert rendered canvas to HTMLImageElement for Konva
  useEffect(() => {
    if (!canvasRef.current || isRendering) return;
    const canvas = canvasRef.current;
    if (canvas.width === 0 || canvas.height === 0) return;
    const img = new window.Image();
    img.src = canvas.toDataURL("image/png");
    img.onload = () => {
      setPdfImage(img);
    };
  }, [canvasRef, isRendering]);

  // Observe container size
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setStageSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedShapeId) {
          deleteSelected();
          toast.success("已删除选中标注");
        }
      }
      if (e.key === "Escape") {
        if (drawingRef.current.isDrawing && drawingRef.current.tempShapeId) {
          deleteShape(drawingRef.current.tempShapeId);
        }
        drawingRef.current = INITIAL_DRAWING;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedShapeId, deleteSelected, deleteShape]);

  // Convert stage coords to PDF-relative coords
  const toPdfCoords = useCallback(
    (stageX: number, stageY: number) => ({
      x: stageX - pdfOffsetX,
      y: stageY - pdfOffsetY,
    }),
    [pdfOffsetX, pdfOffsetY]
  );

  const getPointerPos = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    return pos ?? { x: 0, y: 0 };
  }, []);

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const stagePos = getPointerPos(stage);
      const pos = toPdfCoords(stagePos.x, stagePos.y);
      setCursorPos(pos);

      const d = drawingRef.current;
      if (!d.isDrawing) return;

      switch (activeTool) {
        case "line":
        case "measure": {
          if (d.tempShapeId) {
            updateShape(d.tempShapeId, {
              points: [d.startX, d.startY, pos.x, pos.y],
            } as Partial<Shape>);
          }
          break;
        }
        case "rectangle": {
          if (d.tempShapeId) {
            const x = Math.min(d.startX, pos.x);
            const y = Math.min(d.startY, pos.y);
            const w = Math.abs(pos.x - d.startX);
            const h = Math.abs(pos.y - d.startY);
            updateShape(d.tempShapeId, { x, y, width: w, height: h } as Partial<Shape>);
          }
          break;
        }
        case "circle": {
          if (d.tempShapeId) {
            const dx = pos.x - d.startX;
            const dy = pos.y - d.startY;
            const radius = Math.sqrt(dx * dx + dy * dy);
            updateShape(d.tempShapeId, { radius } as Partial<Shape>);
          }
          break;
        }
        case "polyline":
        case "polygon": {
          if (d.points.length >= 2 && d.tempShapeId) {
            updateShape(d.tempShapeId, {
              points: [...d.points, pos.x, pos.y],
            } as Partial<Shape>);
          }
          break;
        }
        default:
          break;
      }
    },
    [activeTool, getPointerPos, toPdfCoords, updateShape]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const clickedOnShape =
        e.target !== e.target.getStage() &&
        e.target.getClassName() !== "Image";

      if (clickedOnShape && (activeTool === "select" || activeTool === "eraser")) {
        return;
      }

      const stage = e.target.getStage();
      if (!stage) return;
      const stagePos = getPointerPos(stage);
      const pos = toPdfCoords(stagePos.x, stagePos.y);

      if (activeTool === "select") {
        setSelectedShapeId(null);
        return;
      }
      if (activeTool === "eraser") {
        setSelectedShapeId(null);
        return;
      }

      const d = drawingRef.current;

      switch (activeTool) {
        case "point": {
          addShape({
            type: "point",
            page: currentPage,
            color: strokeColor,
            strokeWidth,
            opacity,
            x: pos.x,
            y: pos.y,
            radius: 5,
          } as Omit<Shape, "id">);
          break;
        }
        case "line": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "line",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              points: [pos.x, pos.y, pos.x, pos.y],
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [pos.x, pos.y],
              tempShapeId: id,
            };
          }
          break;
        }
        case "measure": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "measure",
              page: currentPage,
              color: "#06B6D4",
              strokeWidth: 1.5,
              opacity,
              points: [pos.x, pos.y, pos.x, pos.y],
              lengthLabel: "",
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [pos.x, pos.y],
              tempShapeId: id,
            };
          }
          break;
        }
        case "rectangle": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "rectangle",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              fillColor,
              fillOpacity: 0.2,
              x: pos.x,
              y: pos.y,
              width: 0,
              height: 0,
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [],
              tempShapeId: id,
            };
          }
          break;
        }
        case "circle": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "circle",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              fillColor,
              fillOpacity: 0.2,
              x: pos.x,
              y: pos.y,
              radius: 0,
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [],
              tempShapeId: id,
            };
          }
          break;
        }
        case "polyline": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "polyline",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              points: [pos.x, pos.y],
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [pos.x, pos.y],
              tempShapeId: id,
            };
          } else {
            const newPoints = [...d.points, pos.x, pos.y];
            drawingRef.current.points = newPoints;
            if (d.tempShapeId) {
              updateShape(d.tempShapeId, { points: newPoints } as Partial<Shape>);
            }
          }
          break;
        }
        case "polygon": {
          if (!d.isDrawing) {
            const id = addShape({
              type: "polygon",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              fillColor,
              fillOpacity: 0.2,
              points: [pos.x, pos.y],
            } as Omit<Shape, "id">);
            drawingRef.current = {
              isDrawing: true,
              startX: pos.x,
              startY: pos.y,
              points: [pos.x, pos.y],
              tempShapeId: id,
            };
          } else {
            const newPoints = [...d.points, pos.x, pos.y];
            drawingRef.current.points = newPoints;
            if (d.tempShapeId) {
              updateShape(d.tempShapeId, { points: newPoints } as Partial<Shape>);
            }
          }
          break;
        }
        case "text": {
          const text = window.prompt("输入文字标注:", "");
          if (text && text.trim()) {
            addShape({
              type: "text",
              page: currentPage,
              color: strokeColor,
              strokeWidth,
              opacity,
              x: pos.x,
              y: pos.y,
              text: text.trim(),
              fontSize,
            } as Omit<Shape, "id">);
          }
          break;
        }
        default:
          break;
      }
    },
    [
      activeTool,
      currentPage,
      strokeColor,
      fillColor,
      strokeWidth,
      opacity,
      fontSize,
      addShape,
      updateShape,
      setSelectedShapeId,
      getPointerPos,
      toPdfCoords,
    ]
  );

  const handleMouseUp = useCallback(() => {
    const d = drawingRef.current;
    if (!d.isDrawing) return;

    switch (activeTool) {
      case "line": {
        drawingRef.current = INITIAL_DRAWING;
        break;
      }
      case "measure": {
        if (d.tempShapeId) {
          const pts = d.points.length >= 4 ? d.points : [d.startX, d.startY, d.startX, d.startY];
          const label = computeRealLength(pts, scaleNumerator, scaleDenominator, scaleUnit, renderScale);
          updateShape(d.tempShapeId, { lengthLabel: label } as Partial<Shape>);
        }
        drawingRef.current = INITIAL_DRAWING;
        break;
      }
      case "rectangle":
      case "circle": {
        drawingRef.current = INITIAL_DRAWING;
        break;
      }
      default:
        break;
    }
  }, [activeTool, scaleNumerator, scaleDenominator, scaleUnit, renderScale, updateShape]);

  const handleDblClick = useCallback(() => {
    const d = drawingRef.current;
    if (!d.isDrawing) return;

    if (activeTool === "polyline" || activeTool === "polygon") {
      if (d.tempShapeId && d.points.length >= 4) {
        updateShape(d.tempShapeId, { points: d.points } as Partial<Shape>);
      } else if (d.tempShapeId) {
        deleteShape(d.tempShapeId);
      }
      drawingRef.current = INITIAL_DRAWING;
    }
  }, [activeTool, updateShape, deleteShape]);

  const shapes = getShapesForPage(currentPage);

  const cursorStyle: Record<ToolType, string> = {
    select: "default",
    point: "crosshair",
    line: "crosshair",
    polyline: "crosshair",
    polygon: "crosshair",
    rectangle: "crosshair",
    circle: "crosshair",
    text: "text",
    measure: "crosshair",
    eraser: "cell",
  };

  const isLoading = pdfLoading || isRendering;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ background: "var(--canvas-bg)" }}
    >
      {/* Hidden PDF canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {pdfLoading ? "加载 PDF..." : "渲染页面..."}
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!numPages && !isLoading && <EmptyCanvasState />}

      {/* Konva Stage */}
      {stageSize.width > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          style={{ cursor: cursorStyle[activeTool] }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDblClick={handleDblClick}
        >
          {/* PDF background layer */}
          <Layer>
            {pdfImage && pdfDimensions.width > 0 && (
              <KonvaImage
                image={pdfImage}
                x={pdfOffsetX}
                y={pdfOffsetY}
                width={pdfDimensions.width}
                height={pdfDimensions.height}
                shadowColor="rgba(0,0,0,0.12)"
                shadowBlur={24}
                shadowOffsetY={6}
              />
            )}
          </Layer>

          {/* Annotation layer — offset to match PDF position */}
          <Layer x={pdfOffsetX} y={pdfOffsetY}>
            <AnnotationLayer shapes={shapes} renderScale={renderScale} />
          </Layer>
        </Stage>
      )}

      {/* Coordinate display */}
      {numPages > 0 && (
        <div className="absolute bottom-16 right-4 bg-white/80 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs font-mono text-muted-foreground pointer-events-none">
          x: {Math.round(cursorPos.x / renderScale)} · y: {Math.round(cursorPos.y / renderScale)} pt
        </div>
      )}
    </div>
  );
}
