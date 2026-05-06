import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小黄雀联盟｜AI 创作者推广平台",
  description: "连接品牌、创作者和平台运营方的三方创作者任务增长平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
