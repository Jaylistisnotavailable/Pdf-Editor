/**
 * EmptyCanvasState — Professional drafting workspace empty state.
 * Shows crosshair geometry, page outline, ruler ticks, and annotation handles.
 * Studio Light: cobalt accents on cool gray canvas.
 */
import React from "react";
import CrosshairLogo from "./CrosshairLogo";

export default function EmptyCanvasState() {
  const cobalt = "oklch(0.52 0.22 260)";
  const cobaltFaint = "oklch(0.52 0.22 260 / 0.12)";
  const cobaltMid = "oklch(0.52 0.22 260 / 0.35)";
  const gridColor = "oklch(0.82 0.005 240)";
  const pageOutline = "oklch(0.88 0.005 240)";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
      {/* Background grid — subtle drafting paper feel */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.6 }}
      >
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridColor} strokeWidth="0.5" />
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)" />
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke={gridColor} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Page outline — ghost of a drawing sheet */}
      <div className="relative flex flex-col items-center justify-center">
        <svg
          width="340"
          height="260"
          viewBox="0 0 340 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-6"
        >
          {/* Page shadow */}
          <rect x="14" y="14" width="312" height="232" rx="3" fill="rgba(0,0,0,0.04)" />
          {/* Page */}
          <rect x="10" y="10" width="312" height="232" rx="3" fill="white" stroke={pageOutline} strokeWidth="1.5" />

          {/* Title block bottom */}
          <line x1="10" y1="210" x2="322" y2="210" stroke={pageOutline} strokeWidth="1" />
          <line x1="180" y1="210" x2="180" y2="242" stroke={pageOutline} strokeWidth="0.75" />
          <rect x="10" y="210" width="312" height="32" rx="0" fill="oklch(0.97 0.002 240)" />

          {/* Ruler ticks — top */}
          {Array.from({ length: 16 }, (_, i) => (
            <line
              key={`t${i}`}
              x1={10 + i * 20}
              y1={10}
              x2={10 + i * 20}
              y2={i % 5 === 0 ? 18 : 14}
              stroke={cobaltMid}
              strokeWidth="0.75"
            />
          ))}
          {/* Ruler ticks — left */}
          {Array.from({ length: 12 }, (_, i) => (
            <line
              key={`l${i}`}
              x1={10}
              y1={10 + i * 20}
              x2={i % 5 === 0 ? 18 : 14}
              y2={10 + i * 20}
              stroke={cobaltMid}
              strokeWidth="0.75"
            />
          ))}

          {/* Crosshair center */}
          <line x1="166" y1="80" x2="166" y2="180" stroke={cobaltFaint} strokeWidth="1" strokeDasharray="4 3" />
          <line x1="80" y1="130" x2="252" y2="130" stroke={cobaltFaint} strokeWidth="1" strokeDasharray="4 3" />

          {/* Sample annotation handles */}
          {/* Rectangle annotation */}
          <rect x="90" y="90" width="80" height="55" stroke={cobalt} strokeWidth="1.5" fill={cobaltFaint} strokeDasharray="5 3" rx="1" />
          {/* Handle dots */}
          <circle cx="90" cy="90" r="3" fill={cobalt} />
          <circle cx="170" cy="90" r="3" fill={cobalt} />
          <circle cx="90" cy="145" r="3" fill={cobalt} />
          <circle cx="170" cy="145" r="3" fill={cobalt} />

          {/* Polyline annotation */}
          <polyline
            points="195,100 220,85 248,105 240,145"
            stroke={cobalt}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="195" cy="100" r="2.5" fill={cobalt} />
          <circle cx="220" cy="85" r="2.5" fill={cobalt} />
          <circle cx="248" cy="105" r="2.5" fill={cobalt} />
          <circle cx="240" cy="145" r="2.5" fill={cobalt} />

          {/* Measurement line */}
          <line x1="90" y1="165" x2="248" y2="165" stroke="oklch(0.52 0.22 200)" strokeWidth="1.5" strokeDasharray="6 3" />
          <line x1="90" y1="161" x2="90" y2="169" stroke="oklch(0.52 0.22 200)" strokeWidth="1.5" />
          <line x1="248" y1="161" x2="248" y2="169" stroke="oklch(0.52 0.22 200)" strokeWidth="1.5" />
          <text x="169" y="160" textAnchor="middle" fontSize="8" fill="oklch(0.52 0.22 200)" fontFamily="IBM Plex Mono, monospace">
            12.50 m
          </text>

          {/* Point marker */}
          <circle cx="130" cy="130" r="4" fill="oklch(0.58 0.22 27)" />
          <circle cx="130" cy="130" r="7" stroke="oklch(0.58 0.22 27)" strokeWidth="1" fill="none" opacity="0.4" />

          {/* Title block text */}
          <text x="95" y="230" textAnchor="middle" fontSize="7" fill="oklch(0.65 0.01 260)" fontFamily="IBM Plex Mono, monospace">
            PROJECT / DRAWING NO.
          </text>
          <text x="255" y="230" textAnchor="middle" fontSize="7" fill="oklch(0.65 0.01 260)" fontFamily="IBM Plex Mono, monospace">
            SCALE / DATE
          </text>
        </svg>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            打开 PDF 图纸开始标注
          </p>
          <p className="text-xs text-muted-foreground">
            点击左侧「打开 PDF 图纸」· 设置比例 · 绘制几何标注
          </p>
        </div>
      </div>
    </div>
  );
}
