"use client";

import React, { useId, useMemo } from "react";

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
  const uid = useId();
  // Stable symbol-scoped gradient ID, useId as fallback for SSR safety
  const gradId =
    symbol
      ? `spark-grad-${symbol.toLowerCase().replace(/[^a-z0-9]/g, "")}`
      : `spark-grad-${uid.replace(/:/g, "")}`;

  const { pathD, areaD } = useMemo(() => {
    if (!data || data.length < 2) {
      // Directional fallback line based on trend
      const startY = isPositive ? height - 6 : 6;
      const endY = isPositive ? 6 : height - 6;
      const midY = height / 2;
      const curve = `M 0 ${startY} Q ${width / 2} ${midY} ${width} ${endY}`;
      const area = `${curve} L ${width} ${height} L 0 ${height} Z`;
      return { pathD: curve, areaD: area };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 4;
    const effectiveHeight = height - padding * 2;

    const points: [number, number][] = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * effectiveHeight;
      return [x, y];
    });

    // Smooth quadratic Bezier spline
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const xMid = (points[i][0] + points[i + 1][0]) / 2;
      const yMid = (points[i][1] + points[i + 1][1]) / 2;
      d += ` Q ${points[i][0]},${points[i][1]} ${xMid},${yMid}`;
    }
    d += ` T ${points[points.length - 1][0]},${points[points.length - 1][1]}`;

    const area = `${d} L ${width},${height} L 0,${height} Z`;
    return { pathD: d, areaD: area };
  }, [data, isPositive, width, height]);

  const strokeColor = isPositive ? "#34d399" : "#f87171";

  if (!pathD) {
    return (
      <div
        style={{ width, height }}
        className="opacity-20 border-b border-zinc-700"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area gradient fill under curve */}
      <path d={areaD} fill={`url(#${gradId})`} />
      {/* Smooth Bezier stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Sparkline;
