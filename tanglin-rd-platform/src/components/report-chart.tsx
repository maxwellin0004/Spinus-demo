"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  name: string;
  views: number;
  clicks: number;
  conversions: number;
};

export function ReportChart({ data }: { data: Point[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="views" fill="#292524" radius={[8, 8, 0, 0]} />
          <Bar dataKey="clicks" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="conversions" fill="#16a34a" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
