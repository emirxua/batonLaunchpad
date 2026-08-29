"use client";
import React, { useMemo } from "react";

export interface SparklineProps {
  data: number[];
  isPositive: boolean;
  symbol: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  isPositive,
  symbol,
  width = 130,
  height = 38,
  className = "",
}: SparklineProps) {
  const { pathD, fillD } = useMemo(() => {
    if (!data || data.length < 2) {
      return { pathD: "", fillD: "" };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 3;
    const usableHeight = height - padding * 2;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * usableHeight;
      return [x, y];
    });

    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0[0] + p1[0]) / 2;
      const midY = (p0[1] + p1[1]) / 2;
      d += ` Q ${p0[0]},${p0[1]} ${midX},${midY}`;
    }
    const last = points[points.length - 1];
    d += ` T ${last[0]},${last[1]}`;

    // Gradient dolgu için altı kapalı path
    const fill = `${d} L ${width},${height} L 0,${height} Z`;

    return { pathD: d, fillD: fill };
  }, [data, width, height]);

  const color = isPositive ? "#34d399" : "#f87171"; // Emerald / Red
  const gradId = useMemo(
    () =>
      `spark-grad-${(symbol || "coin").toLowerCase()}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
    [symbol]
  );

  if (!pathD) {
    return (
      <div
        style={{ width, height }}
        className="opacity-10 border-b border-zinc-700"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-visible ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Sparkline;
