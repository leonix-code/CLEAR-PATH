"use client";

import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabel?: boolean;
  donut?: boolean;
}

export function PieChart({
  data,
  height = 300,
  className,
  innerRadius = 0,
  outerRadius = 100,
  showLegend = true,
  showLabel = false,
  donut = false,
}: PieChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center h-[300px] text-muted-foreground", className)}>
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const ir = donut ? (innerRadius || outerRadius * 0.6) : innerRadius;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("w-full", className)}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={ir}
            outerRadius={outerRadius}
            dataKey="value"
            label={showLabel ? ({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%` : undefined}
            labelLine={showLabel}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
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
            formatter={(value: any) => {
              const v = Number(value) || 0;
              return [`${v} (${((v / total) * 100).toFixed(1)}%)`, ""];
            }}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: "var(--foreground-secondary)", fontSize: 12 }}>{value}</span>
              )}
            />
          )}
        </RechartsPie>
      </ResponsiveContainer>
    </motion.div>
  );
}
