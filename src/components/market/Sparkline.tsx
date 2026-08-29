"use client";

import React, { useId, useMemo } from "react";

export interface SparklineProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  isPositive,
  width = 120,
  height = 36,
  className = "",
}) => {
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) {
      const midY = height / 2;
      return {
        linePath: `M 0,${midY} L ${width},${midY}`,
        areaPath: `M 0,${midY} L ${width},${midY} L ${width},${height} L 0,${height} Z`,
      };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2; // top/bottom padding inside svg
    const usableHeight = height - padding * 2;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      // Invert Y because SVG origin (0,0) is top-left
      const y = height - padding - ((val - min) / range) * usableHeight;
      return { x, y };
    });

    const pathCommands = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    const areaCommands = `${pathCommands} L ${width},${height} L 0,${height} Z`;

    return {
      linePath: pathCommands,
      areaPath: areaCommands,
    };
  }, [data, width, height]);

  const strokeColor = isPositive ? "#34d399" : "#fb7185"; // emerald-400 vs rose-400
  const stopColor = isPositive ? "#10b981" : "#f43f5e";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`overflow-visible shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stopColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stopColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Area Gradient Fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Stroke Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
