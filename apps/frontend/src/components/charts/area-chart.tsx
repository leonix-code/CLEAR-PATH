"use client";

import { useState } from "react";
import {
  AreaChart as RechartsArea,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value?: number;
  [key: string]: any;
}

interface AreaChartProps {
  data: DataPoint[];
  dataKeys: { key: string; color: string; label?: string }[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showAnimation?: boolean;
  gradient?: boolean;
}

export function AreaChart({
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  className,
  showGrid = true,
  showAnimation = true,
  gradient = true,
}: AreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center h-[300px] text-muted-foreground", className)}>
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("w-full", className)}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          onMouseMove={(e) => {
            if (e.activeTooltipIndex !== undefined) {
              setActiveIndex(e.activeTooltipIndex as number);
            }
          }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--glass-border)"
              strokeOpacity={0.5}
              vertical={false}
            />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(31,38,135,0.12)",
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600, fontSize: 13 }}
            itemStyle={{ fontSize: 12 }}
          />
          {dataKeys.map((dk, i) => (
            <defs key={dk.key}>
              {gradient && (
                <linearGradient id={`areaGrad-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dk.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
          ))}
          {dataKeys.map((dk) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              stroke={dk.color}
              fill={gradient ? `url(#areaGrad-${dk.key})` : dk.color}
              fillOpacity={gradient ? 1 : 0.1}
              strokeWidth={2}
              isAnimationActive={showAnimation}
              animationDuration={1000}
              animationEasing="ease-out"
              dot={false}
              activeDot={{
                r: 5,
                stroke: dk.color,
                strokeWidth: 2,
                fill: "var(--card-bg)",
              }}
            />
          ))}
        </RechartsArea>
      </ResponsiveContainer>
    </motion.div>
  );
}
