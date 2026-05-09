"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { zh } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-[var(--ink)] text-white shadow-sm hover:bg-stone-800",
  secondary: "bg-[var(--accent)] text-stone-950 shadow-sm hover:bg-amber-300",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-500",
  ghost: "border border-stone-200 bg-white/80 text-stone-800 hover:bg-white",
};

export function SubmitButton({
  children,
  pendingLabel = "处理中...",
  variant = "primary",
  className,
  disabled,
  formAction,
  name,
  type = "submit",
  value,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
  formAction?: ComponentProps<"button">["formAction"];
  name?: string;
  type?: "submit" | "button";
  value?: string;
}) {
  const { action, data, pending } = useFormStatus();
  const isCurrentSubmit =
    pending &&
    (formAction
      ? action === formAction
      : name && value
        ? data?.get(name) === value
        : true);

  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-black transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        buttonStyles[variant],
        className,
      )}
      disabled={pending || disabled}
      formAction={formAction}
      name={name}
      type={type}
      value={value}
    >
      {isCurrentSubmit ? zh(pendingLabel) : zh(children)}
    </button>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

export function FileInput({
  name,
  label,
  accept,
  multiple,
  required,
  helper,
}: {
  name: string;
  label: ReactNode;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  helper?: ReactNode;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const summary =
    files.length === 0
      ? null
      : files.length === 1
        ? `${files[0].name} · ${formatFileSize(files[0].size)}`
        : `${files.length} 个文件 · ${formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}`;

  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zh(label)}
      <input
        accept={accept}
        className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-950 shadow-inner outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-black file:text-stone-700 focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        multiple={multiple}
        name={name}
        required={required}
        type="file"
        onChange={(event) => setFiles(Array.from(event.currentTarget.files ?? []))}
      />
      {summary ? <span className="text-xs font-semibold text-stone-700">{summary}</span> : null}
      {helper ? <span className="text-xs text-stone-500">{zh(helper)}</span> : null}
    </label>
  );
}

export function CopyButton({
  value,
  children = "复制",
}: {
  value: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={cn(
        "rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-black text-stone-700 transition hover:bg-stone-50",
        copied ? "border-emerald-200 bg-emerald-50 text-emerald-700" : null,
      )}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "已复制" : zh(children)}
    </button>
  );
}
