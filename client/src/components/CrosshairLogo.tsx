/**
 * CrosshairLogo — Geometric compass-rose/crosshair brand mark.
 * Cobalt blue on transparent background. Used in header and empty state.
 */
import React from "react";

interface CrosshairLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function CrosshairLogo({
  size = 28,
  color = "oklch(0.52 0.22 260)",
  className,
}: CrosshairLogoProps) {
  const s = size;
  const c = s / 2;
  const r = s * 0.38;
  const tickLen = s * 0.14;
  const innerR = s * 0.12;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx={c} cy={c} r={r} stroke={color} strokeWidth={s * 0.055} />
      {/* Inner circle */}
      <circle cx={c} cy={c} r={innerR} fill={color} />
      {/* Crosshair ticks — top */}
      <line
        x1={c}
        y1={c - r - tickLen}
        x2={c}
        y2={c - r + tickLen * 0.4}
        stroke={color}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
      />
      {/* Crosshair ticks — bottom */}
      <line
        x1={c}
        y1={c + r - tickLen * 0.4}
        x2={c}
        y2={c + r + tickLen}
        stroke={color}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
      />
      {/* Crosshair ticks — left */}
      <line
        x1={c - r - tickLen}
        y1={c}
        x2={c - r + tickLen * 0.4}
        y2={c}
        stroke={color}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
      />
      {/* Crosshair ticks — right */}
      <line
        x1={c + r - tickLen * 0.4}
        y1={c}
        x2={c + r + tickLen}
        y2={c}
        stroke={color}
        strokeWidth={s * 0.055}
        strokeLinecap="round"
      />
    </svg>
  );
}
