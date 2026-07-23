"use client";

import {
  BarChart as RechartsBar,
  Bar,
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

interface BarChartProps {
  data: DataPoint[];
  dataKeys: { key: string; color: string; label?: string }[];
  xAxisKey?: string;
  height?: number;
  className?: string;
  layout?: "vertical" | "horizontal";
  stacked?: boolean;
  showGrid?: boolean;
  barSize?: number;
  rounded?: boolean;
}

export function BarChart({
  data,
  dataKeys,
  xAxisKey = "name",
  height = 300,
  className,
  layout = "horizontal",
  stacked = false,
  showGrid = true,
  barSize = 24,
  rounded = true,
}: BarChartProps) {
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
        <RechartsBar
          data={data}
          layout={layout}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barSize={barSize}
          barCategoryGap="20%"
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
            dataKey={layout === "horizontal" ? xAxisKey : undefined}
            type={layout === "horizontal" ? "category" : "number"}
            tick={{ fontSize: 12, fill: "var(--foreground-muted)" }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            type={layout === "horizontal" ? "number" : "category"}
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
            cursor={{ fill: "var(--glass-bg)" }}
          />
          {dataKeys.map((dk) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              fill={dk.color}
              radius={rounded ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              stackId={stacked ? "stack" : undefined}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    </motion.div>
  );
}
