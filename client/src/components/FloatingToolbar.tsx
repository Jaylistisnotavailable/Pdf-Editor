/**
 * FloatingToolbar — Bottom-center floating toolbar with drawing tools.
 * Studio Light design: glass-morphism white/80, cobalt active indicator, IBM Plex Sans.
 * Tools: select, point, line, polyline, polygon, rectangle, circle, text, measure, eraser
 */
import React, { useState } from "react";
import { useAnnotation, ToolType, TOOL_COLORS } from "@/contexts/AnnotationContext";
import { usePdf } from "@/contexts/PdfContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  MousePointer2,
  Dot,
  Minus,
  Waypoints,
  Pentagon,
  Square,
  Circle,
  Type,
  Ruler,
  Eraser,
  Trash2,
  ChevronDown,
  ChevronUp,
  Palette,
} from "lucide-react";

interface ToolDef {
  id: ToolType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  hint: string;
}

const TOOLS: ToolDef[] = [
  {
    id: "select",
    label: "选择",
    shortLabel: "选",
    icon: <MousePointer2 className="w-4 h-4" />,
    hint: "点击选择标注，拖动移动",
  },
  {
    id: "point",
    label: "点",
    shortLabel: "点",
    icon: <Dot className="w-4 h-4" />,
    hint: "单击放置标记点",
  },
  {
    id: "line",
    label: "直线",
    shortLabel: "线",
    icon: <Minus className="w-4 h-4" />,
    hint: "点击起点，拖动画直线",
  },
  {
    id: "polyline",
    label: "折线",
    shortLabel: "折",
    icon: <Waypoints className="w-4 h-4" />,
    hint: "单击添加节点，双击结束",
  },
  {
    id: "polygon",
    label: "多边形",
    shortLabel: "面",
    icon: <Pentagon className="w-4 h-4" />,
    hint: "单击添加顶点，双击闭合",
  },
  {
    id: "rectangle",
    label: "矩形",
    shortLabel: "矩",
    icon: <Square className="w-4 h-4" />,
    hint: "拖动画矩形区域",
  },
  {
    id: "circle",
    label: "圆形",
    shortLabel: "圆",
    icon: <Circle className="w-4 h-4" />,
    hint: "从圆心拖动画圆",
  },
  {
    id: "text",
    label: "文字",
    shortLabel: "文",
    icon: <Type className="w-4 h-4" />,
    hint: "单击放置文字标注",
  },
  {
    id: "measure",
    label: "测量",
    shortLabel: "量",
    icon: <Ruler className="w-4 h-4" />,
    hint: "拖动测量距离（按比例换算）",
  },
  {
    id: "eraser",
    label: "删除",
    shortLabel: "删",
    icon: <Eraser className="w-4 h-4" />,
    hint: "选中后按 Delete 删除",
  },
];

const PRESET_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#F97316", // orange
  "#EC4899", // pink
  "#1F2937", // dark
  "#6B7280", // gray
];

export default function FloatingToolbar() {
  const {
    activeTool,
    setActiveTool,
    selectedShapeId,
    deleteSelected,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
  } = useAnnotation();
  const { numPages } = usePdf();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!numPages) return null;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{ pointerEvents: "none" }}
    >
      {/* Hint text */}
      {expanded && (
        <div
          className="px-3 py-1 rounded-full text-xs text-muted-foreground bg-white/70 backdrop-blur-sm border border-border/50"
          style={{ pointerEvents: "none" }}
        >
          {TOOLS.find((t) => t.id === activeTool)?.hint}
          {activeTool !== "select" && (
            <span className="ml-2 text-muted-foreground/60">· ESC 取消</span>
          )}
        </div>
      )}

      {/* Main toolbar */}
      <div
        className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-border/60"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
          pointerEvents: "auto",
        }}
      >
        {/* Tool buttons */}
        {expanded && (
          <>
            {TOOLS.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={activeTool === tool.id}
                onClick={() => setActiveTool(tool.id)}
              />
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* Color picker toggle */}
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className={cn(
                "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "hover:bg-muted border",
                showColorPicker ? "border-primary bg-primary/5" : "border-transparent"
              )}
              title="颜色"
            >
              <div
                className="w-4 h-4 rounded-full border border-white shadow-sm"
                style={{ background: strokeColor }}
              />
            </button>

            {/* Stroke width */}
            <div className="flex items-center gap-1 ml-1">
              {[1, 2, 3, 5].map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center transition-all text-xs font-mono",
                    strokeWidth === w
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  title={`线宽 ${w}px`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* Delete selected */}
            <button
              onClick={() => {
                if (selectedShapeId) {
                  deleteSelected();
                  toast.success("已删除选中标注");
                } else {
                  toast.info("请先选中一个标注");
                }
              }}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                "text-destructive hover:bg-destructive/10",
                !selectedShapeId && "opacity-40 cursor-not-allowed"
              )}
              title="删除选中 (Delete)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-all ml-1"
          title={expanded ? "收起工具栏" : "展开工具栏"}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Collapsed: show active tool icon */}
        {!expanded && (
          <div className="flex items-center gap-1 px-1">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ color: "oklch(0.52 0.22 260)" }}
            >
              {TOOLS.find((t) => t.id === activeTool)?.icon}
            </div>
            <span className="text-xs font-medium text-foreground">
              {TOOLS.find((t) => t.id === activeTool)?.label}
            </span>
          </div>
        )}
      </div>

      {/* Color picker panel */}
      {showColorPicker && expanded && (
        <div
          className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border/60 w-48"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            pointerEvents: "auto",
          }}
        >
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                setStrokeColor(color);
                setShowColorPicker(false);
              }}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                strokeColor === color ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ background: color }}
              title={color}
            />
          ))}
          {/* Custom color input */}
          <label className="w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors" title="自定义颜色">
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="opacity-0 absolute w-0 h-0"
            />
            <Palette className="w-3 h-3 text-muted-foreground" />
          </label>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  tool,
  isActive,
  onClick,
}: {
  tool: ToolDef;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={`${tool.label} — ${tool.hint}`}
      className={cn(
        "relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
        "active:scale-95",
        isActive
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {/* Active indicator: left border */}
      {isActive && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full"
          style={{ background: "oklch(0.52 0.22 260)" }}
        />
      )}
      {tool.icon}
    </button>
  );
}
