import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import { nanoid } from "nanoid";

export type ToolType =
  | "select"
  | "point"
  | "line"
  | "polyline"
  | "polygon"
  | "rectangle"
  | "circle"
  | "text"
  | "measure"
  | "eraser";

export interface BaseShape {
  id: string;
  type: ToolType;
  page: number;
  color: string;
  strokeWidth: number;
  opacity: number;
  label?: string;
}

export interface PointShape extends BaseShape {
  type: "point";
  x: number;
  y: number;
  radius: number;
}

export interface LineShape extends BaseShape {
  type: "line";
  points: number[];
}

export interface PolylineShape extends BaseShape {
  type: "polyline";
  points: number[];
}

export interface PolygonShape extends BaseShape {
  type: "polygon";
  points: number[];
  fillColor: string;
  fillOpacity: number;
}

export interface RectShape extends BaseShape {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  fillOpacity: number;
}

export interface CircleShape extends BaseShape {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  fillColor: string;
  fillOpacity: number;
}

export interface TextShape extends BaseShape {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export interface MeasureShape extends BaseShape {
  type: "measure";
  points: number[];
  lengthLabel: string;
}

export type Shape =
  | PointShape
  | LineShape
  | PolylineShape
  | PolygonShape
  | RectShape
  | CircleShape
  | TextShape
  | MeasureShape;

export const TOOL_COLORS: Record<
  string,
  string
> = {
  select: "#3B82F6",
  point: "#EF4444",
  line: "#3B82F6",
  polyline: "#3B82F6",
  polygon: "#10B981",
  rectangle: "#8B5CF6",
  circle: "#F59E0B",
  text: "#1F2937",
  measure: "#06B6D4",
  eraser: "#6B7280",
};

interface AnnotationState {
  activeTool: ToolType;
  selectedShapeId: string | null;
  shapes: Shape[];
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
}

interface AnnotationContextValue
  extends AnnotationState {

  setActiveTool: (
    tool: ToolType
  ) => void;

  setSelectedShapeId: (
    id: string | null
  ) => void;

  setShapes: (
    shapes: Shape[]
  ) => void;

  addShape: (
    shape: Omit<Shape, "id">
  ) => string;

  updateShape: (
    id: string,
    updates: Partial<Shape>
  ) => void;

  deleteShape: (
    id: string
  ) => void;

  deleteSelected: () => void;

  clearAll: (
    page?: number
  ) => void;

  setStrokeColor: (
    color: string
  ) => void;

  setFillColor: (
    color: string
  ) => void;

  setStrokeWidth: (
    width: number
  ) => void;

  setOpacity: (
    opacity: number
  ) => void;

  setFontSize: (
    size: number
  ) => void;

  getShapesForPage: (
    page: number
  ) => Shape[];
}

const AnnotationContext =
  createContext<AnnotationContextValue | null>(
    null
  );

export function AnnotationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] =
    useState<AnnotationState>({
      activeTool: "select",
      selectedShapeId: null,
      shapes: [],
      strokeColor: "#3B82F6",
      fillColor: "#3B82F680",
      strokeWidth: 2,
      opacity: 1,
      fontSize: 14,
    });

  const setActiveTool = useCallback(
    (tool: ToolType) => {
      setState((prev) => ({
        ...prev,
        activeTool: tool,
        selectedShapeId: null,
      }));
    },
    []
  );

  const setSelectedShapeId =
    useCallback(
      (id: string | null) => {
        setState((prev) => ({
          ...prev,
          selectedShapeId: id,
        }));
      },
      []
    );

  const setShapes = useCallback(
    (shapes: Shape[]) => {
      setState((prev) => ({
        ...prev,
        shapes: Array.isArray(shapes)
          ? shapes
          : [],
        selectedShapeId: null,
      }));
    },
    []
  );

  const addShape = useCallback(
    (
      shape: Omit<Shape, "id">
    ): string => {
      const id = nanoid();

      setState((prev) => ({
        ...prev,
        shapes: [
          ...prev.shapes,
          {
            ...shape,
            id,
          } as Shape,
        ],
        selectedShapeId: id,
      }));

      return id;
    },
    []
  );

  const updateShape = useCallback(
    (
      id: string,
      updates: Partial<Shape>
    ) => {
      setState((prev) => ({
        ...prev,
        shapes: prev.shapes.map((shape) =>
          shape.id === id
            ? {
                ...shape,
                ...updates,
              } as Shape
            : shape
        ),
      }));
    },
    []
  );

  const deleteShape = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,

        shapes: prev.shapes.filter(
          (shape) => shape.id !== id
        ),

        selectedShapeId:
          prev.selectedShapeId === id
            ? null
            : prev.selectedShapeId,
      }));
    },
    []
  );

  const deleteSelected =
    useCallback(() => {
      setState((prev) => {
        if (!prev.selectedShapeId) {
          return prev;
        }

        return {
          ...prev,

          shapes: prev.shapes.filter(
            (shape) =>
              shape.id !==
              prev.selectedShapeId
          ),

          selectedShapeId: null,
        };
      });
    }, []);

  const clearAll = useCallback(
    (page?: number) => {
      setState((prev) => ({
        ...prev,

        shapes:
          page !== undefined
            ? prev.shapes.filter(
                (shape) =>
                  shape.page !== page
              )
            : [],

        selectedShapeId: null,
      }));
    },
    []
  );

  const setStrokeColor =
    useCallback(
      (color: string) => {
        setState((prev) => ({
          ...prev,
          strokeColor: color,
        }));
      },
      []
    );

  const setFillColor =
    useCallback(
      (color: string) => {
        setState((prev) => ({
          ...prev,
          fillColor: color,
        }));
      },
      []
    );

  const setStrokeWidth =
    useCallback(
      (width: number) => {
        setState((prev) => ({
          ...prev,
          strokeWidth: width,
        }));
      },
      []
    );

  const setOpacity =
    useCallback(
      (opacity: number) => {
        setState((prev) => ({
          ...prev,
          opacity,
        }));
      },
      []
    );

  const setFontSize =
    useCallback(
      (size: number) => {
        setState((prev) => ({
          ...prev,
          fontSize: size,
        }));
      },
      []
    );

  const getShapesForPage =
    useCallback(
      (page: number) =>
        state.shapes.filter(
          (shape) => shape.page === page
        ),
      [state.shapes]
    );

  return (
    <AnnotationContext.Provider
      value={{
        ...state,

        setActiveTool,
        setSelectedShapeId,
        setShapes,

        addShape,
        updateShape,

        deleteShape,
        deleteSelected,

        clearAll,

        setStrokeColor,
        setFillColor,
        setStrokeWidth,
        setOpacity,
        setFontSize,

        getShapesForPage,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
}

export function useAnnotation() {
  const context =
    useContext(AnnotationContext);

  if (!context) {
    throw new Error(
      "useAnnotation must be used within AnnotationProvider"
    );
  }

  return context;
}
