/**
 * AnnotationLayer — Konva layer that renders all annotation shapes.
 * Handles shape rendering, selection, and drag interactions.
 */
import React, { useCallback } from "react";
import {
  Circle,
  Group,
  Line,
  Rect,
  Text,
  Transformer,
} from "react-konva";
import Konva from "konva";
import {
  Shape,
  PointShape,
  LineShape,
  PolylineShape,
  PolygonShape,
  RectShape,
  CircleShape,
  TextShape,
  MeasureShape,
  useAnnotation,
} from "@/contexts/AnnotationContext";

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Shape>) => void;
  renderScale: number;
}

function PointRenderer({ shape, isSelected, onSelect, onUpdate, renderScale }: ShapeRendererProps) {
  const s = shape as PointShape;
  return (
    <Circle
      key={s.id}
      x={s.x}
      y={s.y}
      radius={(s.radius || 5) * renderScale}
      fill={s.color}
      stroke={isSelected ? "#fff" : s.color}
      strokeWidth={isSelected ? 2 * renderScale : 0}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 8 : 0}
      opacity={s.opacity}
      draggable={isSelected}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
      onDragEnd={(e) => {
        onUpdate(s.id, { x: e.target.x(), y: e.target.y() } as Partial<Shape>);
      }}
    />
  );
}

function LineRenderer({ shape, isSelected, onSelect, renderScale }: ShapeRendererProps) {
  const s = shape as LineShape;
  return (
    <Line
      key={s.id}
      points={s.points}
      stroke={s.color}
      strokeWidth={(s.strokeWidth || 2) * renderScale}
      lineCap="round"
      lineJoin="round"
      opacity={s.opacity}
      hitStrokeWidth={10 * renderScale}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
    />
  );
}

function PolylineRenderer({ shape, isSelected, onSelect, renderScale }: ShapeRendererProps) {
  const s = shape as PolylineShape;
  return (
    <Line
      key={s.id}
      points={s.points}
      stroke={s.color}
      strokeWidth={(s.strokeWidth || 2) * renderScale}
      lineCap="round"
      lineJoin="round"
      opacity={s.opacity}
      hitStrokeWidth={10 * renderScale}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
    />
  );
}

function PolygonRenderer({ shape, isSelected, onSelect, renderScale }: ShapeRendererProps) {
  const s = shape as PolygonShape;
  return (
    <Line
      key={s.id}
      points={s.points}
      stroke={s.color}
      strokeWidth={(s.strokeWidth || 2) * renderScale}
      fill={s.fillColor}
      opacity={s.opacity}
      closed
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={10 * renderScale}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
    />
  );
}

function RectRenderer({ shape, isSelected, onSelect, onUpdate, renderScale }: ShapeRendererProps) {
  const s = shape as RectShape;
  return (
    <Rect
      key={s.id}
      x={s.x}
      y={s.y}
      width={s.width}
      height={s.height}
      stroke={s.color}
      strokeWidth={(s.strokeWidth || 2) * renderScale}
      fill={s.fillColor}
      opacity={s.opacity}
      draggable={isSelected}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
      onDragEnd={(e) => {
        onUpdate(s.id, { x: e.target.x(), y: e.target.y() } as Partial<Shape>);
      }}
    />
  );
}

function CircleRenderer({ shape, isSelected, onSelect, onUpdate, renderScale }: ShapeRendererProps) {
  const s = shape as CircleShape;
  return (
    <Circle
      key={s.id}
      x={s.x}
      y={s.y}
      radius={s.radius}
      stroke={s.color}
      strokeWidth={(s.strokeWidth || 2) * renderScale}
      fill={s.fillColor}
      opacity={s.opacity}
      draggable={isSelected}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 6 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
      onDragEnd={(e) => {
        onUpdate(s.id, { x: e.target.x(), y: e.target.y() } as Partial<Shape>);
      }}
    />
  );
}

function TextRenderer({ shape, isSelected, onSelect, onUpdate, renderScale }: ShapeRendererProps) {
  const s = shape as TextShape;
  return (
    <Text
      key={s.id}
      x={s.x}
      y={s.y}
      text={s.text}
      fontSize={(s.fontSize || 14) * renderScale}
      fill={s.color}
      opacity={s.opacity}
      draggable={isSelected}
      shadowColor={isSelected ? s.color : undefined}
      shadowBlur={isSelected ? 4 : 0}
      onClick={() => onSelect(s.id)}
      onTap={() => onSelect(s.id)}
      onDragEnd={(e) => {
        onUpdate(s.id, { x: e.target.x(), y: e.target.y() } as Partial<Shape>);
      }}
    />
  );
}

function MeasureRenderer({ shape, isSelected, onSelect, renderScale }: ShapeRendererProps) {
  const s = shape as MeasureShape;
  const pts = s.points;
  const midX = pts.length >= 4 ? (pts[0] + pts[pts.length - 2]) / 2 : pts[0] || 0;
  const midY = pts.length >= 4 ? (pts[1] + pts[pts.length - 1]) / 2 : pts[1] || 0;
  return (
    <Group key={s.id}>
      <Line
        points={s.points}
        stroke={s.color}
        strokeWidth={(s.strokeWidth || 1.5) * renderScale}
        lineCap="round"
        dash={[6 * renderScale, 3 * renderScale]}
        opacity={s.opacity}
        hitStrokeWidth={10 * renderScale}
        onClick={() => onSelect(s.id)}
        onTap={() => onSelect(s.id)}
      />
      {s.lengthLabel && (
        <Text
          x={midX - 30}
          y={midY - 10 * renderScale}
          text={s.lengthLabel}
          fontSize={11 * renderScale}
          fill={s.color}
          fontStyle="bold"
          onClick={() => onSelect(s.id)}
          onTap={() => onSelect(s.id)}
        />
      )}
    </Group>
  );
}

interface AnnotationLayerProps {
  shapes: Shape[];
  renderScale: number;
}

export default function AnnotationLayer({ shapes, renderScale }: AnnotationLayerProps) {
  const { selectedShapeId, setSelectedShapeId, updateShape, activeTool } = useAnnotation();

  const handleSelect = useCallback(
    (id: string) => {
      if (activeTool === "select" || activeTool === "eraser") {
        setSelectedShapeId(id);
      }
    },
    [activeTool, setSelectedShapeId]
  );

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Shape>) => {
      updateShape(id, updates);
    },
    [updateShape]
  );

  return (
    <>
      {shapes.map((shape) => {
        const isSelected = shape.id === selectedShapeId;
        const props: ShapeRendererProps = {
          shape,
          isSelected,
          onSelect: handleSelect,
          onUpdate: handleUpdate,
          renderScale,
        };
        switch (shape.type) {
          case "point":
            return <PointRenderer key={shape.id} {...props} />;
          case "line":
            return <LineRenderer key={shape.id} {...props} />;
          case "polyline":
            return <PolylineRenderer key={shape.id} {...props} />;
          case "polygon":
            return <PolygonRenderer key={shape.id} {...props} />;
          case "rectangle":
            return <RectRenderer key={shape.id} {...props} />;
          case "circle":
            return <CircleRenderer key={shape.id} {...props} />;
          case "text":
            return <TextRenderer key={shape.id} {...props} />;
          case "measure":
            return <MeasureRenderer key={shape.id} {...props} />;
          default:
            return null;
        }
      })}
    </>
  );
}
