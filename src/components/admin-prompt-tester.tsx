"use client";

import { CheckCircle2, Copy, FlaskConical, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import type { ScriptTable, ScriptTableValidation } from "@/lib/insights/script-tables";
import { cn } from "@/lib/utils";

type PromptTestType = "topicRewrite" | "topicGraphic" | "topicVideo" | "caseAnalysis" | "caseGraphic" | "caseVideo";

type PromptTestResult = {
  ok: boolean;
  status: number | null;
  errorMessage: string | null;
  rawContent: string;
  parsed: unknown;
  validation: ScriptTableValidation | { ok: boolean; issues: string[]; tableCount: number; rowCount: number };
  tables: ScriptTable[];
};

export function AdminPromptTester({
  label,
  promptField,
  promptType,
}: {
  label: string;
  promptField: string;
  promptType: PromptTestType;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    const form = buttonRef.current?.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const systemPrompt = String(formData.get(promptField) ?? "").trim();
    if (!systemPrompt) {
      setError("请先填写提示词。");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/insights/prompt-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType,
          systemPrompt,
          baseUrl: String(formData.get("insightAiBaseUrl") ?? ""),
          model: String(formData.get("insightAiModel") ?? ""),
          apiKey: String(formData.get("insightAiApiKey") ?? ""),
          enabled: formData.get("insightAiEnabled") === "on",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as PromptTestResult & { error?: string };
      if (!response.ok) {
        setError(data.error || "测试失败，请检查接口配置。");
        return;
      }
      setResult(data);
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "测试请求失败。");
    } finally {
      setLoading(false);
    }
  }

  async function copyRaw() {
    if (!result?.rawContent) return;
    await navigator.clipboard.writeText(result.rawContent);
  }

  const firstTable = result?.tables?.[0];

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-stone-900">{label}测试</p>
          <p className="mt-1 text-xs text-stone-500">使用一条内置热点样例调用当前表单里的 Base URL、模型、API Key 和提示词。</p>
        </div>
        <button
          ref={buttonRef}
          className="inline-flex items-center gap-1 rounded-lg bg-stone-950 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          disabled={loading}
          onClick={runTest}
        >
          <FlaskConical size={14} className={loading ? "animate-pulse" : ""} />
          {loading ? "测试中..." : "测试生成"}
        </button>
      </div>

      {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</div> : null}

      {result ? (
        <div className="mt-3 grid gap-3">
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black",
              result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
            )}
          >
            {result.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span>{result.ok ? "校验通过" : "校验未通过"}</span>
            <span>HTTP：{result.status ?? "-"}</span>
            <span>表格：{result.validation.tableCount}</span>
            <span>行数：{result.validation.rowCount}</span>
          </div>
          {result.validation.issues?.length ? (
            <div className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-amber-800">
              {result.validation.issues.map((issue) => (
                <p key={issue}>{issue}</p>
              ))}
            </div>
          ) : null}
          {result.errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{result.errorMessage}</div> : null}
          {firstTable ? (
            <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
              <div className="border-b border-stone-100 px-3 py-2 text-xs font-black text-stone-900">预览：{firstTable.title}</div>
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    {firstTable.columns.map((column) => (
                      <th className="px-3 py-2" key={column}>
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {firstTable.rows.slice(0, 4).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td className="max-w-[18rem] whitespace-pre-wrap px-3 py-2 text-stone-700" key={`${rowIndex}-${cellIndex}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <details className="rounded-lg border border-stone-200 bg-white">
            <summary className="flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-black text-stone-700">
              <span>查看原始 JSON</span>
              <button className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[0.68rem]" type="button" onClick={copyRaw}>
                <Copy size={12} />复制
              </button>
            </summary>
            <pre className="max-h-72 overflow-auto border-t border-stone-100 p-3 text-xs leading-5 text-stone-700">{result.rawContent || JSON.stringify(result.parsed, null, 2)}</pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
