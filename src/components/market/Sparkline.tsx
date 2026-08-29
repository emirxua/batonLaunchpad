"use client";

import React, { useId, useMemo } from "react";

export interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  isPositive,
  width = 120,
  height = 36,
  className = "",
}: SparklineProps) {
  const gradientId = useId();

  const { pathD, areaD } = useMemo(() => {
    if (!data || data.length < 2) {
      // Fallback: 24h trendine göre minimal eğimli dalga
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

    // SVG Catmull-Rom / Bezier curve path
    let d = `M ${points[0][0]},${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const x_mid = (points[i][0] + points[i + 1][0]) / 2;
      const y_mid = (points[i][1] + points[i + 1][1]) / 2;
      d += ` Q ${points[i][0]},${points[i][1]} ${x_mid},${y_mid}`;
    }
    d += ` T ${points[points.length - 1][0]},${points[points.length - 1][1]}`;

    const area = `${d} L ${width},${height} L 0,${height} Z`;

    return { pathD: d, areaD: area };
  }, [data, isPositive, width, height]);

  const strokeColor = isPositive ? "#34d399" : "#f87171";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area Gradient Under Curve */}
      <path d={areaD} fill={`url(#${gradientId})`} />
      {/* Smooth Bezier Stroke Line */}
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
