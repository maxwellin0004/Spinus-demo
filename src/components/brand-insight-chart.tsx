"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type BrandInsightPoint = {
  date: string;
  brand: number;
  category: number;
  competitor: number;
  sellingPoint: number;
};

export function BrandInsightChart({ data }: { data: BrandInsightPoint[] }) {
  return (
    <div className="h-[18.5rem] min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f1" vertical={false} />
          <XAxis axisLine={false} dataKey="date" tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis axisLine={false} tickFormatter={(value) => `${value}K`} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              border: "1px solid rgba(64,59,53,0.14)",
              borderRadius: 12,
              boxShadow: "0 18px 44px rgba(15,23,42,0.12)",
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                brand: "本品牌相关内容",
                category: "防晒/底妆品类讨论",
                competitor: "竞品对比内容",
                sellingPoint: "卖点与痛点内容",
              };
              return [value, labels[String(name)] ?? name];
            }}
          />
          <Line dataKey="brand" dot={false} stroke="#0f9488" strokeWidth={3} type="monotone" />
          <Line dataKey="category" dot={false} stroke="#2563eb" strokeWidth={3} type="monotone" />
          <Line dataKey="competitor" dot={false} stroke="#f59e0b" strokeWidth={3} type="monotone" />
          <Line dataKey="sellingPoint" dot={false} stroke="#ef4444" strokeWidth={3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
