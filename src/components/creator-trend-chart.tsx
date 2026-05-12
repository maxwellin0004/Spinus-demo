"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CreatorTrendPoint = {
  date: string;
  skincare: number;
  makeup: number;
  ingredients: number;
  tools: number;
};

export function CreatorTrendChart({ data }: { data: CreatorTrendPoint[] }) {
  return (
    <div className="h-[18.5rem] min-w-0 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f1" vertical={false} />
          <ReferenceArea fill="#ecfdf5" fillOpacity={0.7} x1="05-17" x2="05-19" />
          <ReferenceArea fill="#eff6ff" fillOpacity={0.65} x1="05-19" x2="05-21" />
          <ReferenceArea fill="#fff7ed" fillOpacity={0.65} x1="05-21" x2="05-23" />
          <ReferenceArea fill="#fef2f2" fillOpacity={0.65} x1="05-23" x2="05-24" />
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
                skincare: "美妆护肤",
                makeup: "彩妆",
                ingredients: "成分党",
                tools: "工具好物",
              };
              return [value, labels[String(name)] ?? name];
            }}
          />
          <Line dataKey="skincare" dot={false} stroke="#0f9488" strokeWidth={3} type="monotone" />
          <Line dataKey="makeup" dot={false} stroke="#2563eb" strokeWidth={3} type="monotone" />
          <Line dataKey="ingredients" dot={false} stroke="#f59e0b" strokeWidth={3} type="monotone" />
          <Line dataKey="tools" dot={false} stroke="#8b5cf6" strokeWidth={3} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
