"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyScriptButton({ text, className, label = "复制脚本" }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={cn("rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100", className)}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      <Copy className="mr-1 inline" size={14} />
      {copied ? "已复制" : label}
    </button>
  );
}
