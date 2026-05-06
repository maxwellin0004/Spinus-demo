import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { zh, zhNode, zhText } from "@/lib/i18n";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "stitch-stage rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_80px_rgba(64,59,53,0.10)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_90px_rgba(64,59,53,0.14)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <Card className="relative min-h-36 overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,250,240,0.82)_45%,rgba(244,176,0,0.18))]">
      <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[var(--lime)]/40 blur-2xl" />
      <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[var(--cyan)]/30 blur-2xl" />
      <div className="relative flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_5px_rgba(244,176,0,0.16)]" />
        <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">{zhText(label)}</p>
      </div>
      <div className="relative mt-5 text-3xl font-black tracking-tight text-[var(--ink)]">{value}</div>
      {sub ? <div className="relative mt-2 text-sm text-stone-500">{sub}</div> : null}
    </Card>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white/55 p-8 text-center shadow-inner">
      <p className="text-base font-black text-stone-900">{zhText(title)}</p>
      {body ? <p className="mt-2 text-sm text-stone-500">{zhText(body)}</p> : null}
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-stone-700 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
      {zh(children)}
    </span>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <input
        className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder ? zhText(placeholder) : undefined}
      />
    </label>
  );
}

export function Textarea({
  label,
  name,
  defaultValue,
  required,
  rows = 4,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <textarea
        className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        defaultValue={defaultValue}
        required={required}
        rows={rows}
        placeholder={placeholder ? zhText(placeholder) : undefined}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {zhText(label)}
      <select
        className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
        name={name}
        defaultValue={defaultValue}
      >
        {zhNode(children)}
      </select>
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "submit",
  name,
  value,
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  type?: "submit" | "button";
  name?: string;
  value?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const styles = {
    primary: "bg-[var(--ink)] text-white shadow-[0_14px_35px_rgba(23,33,28,0.24)] hover:bg-stone-800",
    secondary: "bg-[var(--accent)] text-stone-950 shadow-[0_14px_35px_rgba(244,176,0,0.26)] hover:bg-amber-300",
    danger: "bg-red-600 text-white shadow-[0_14px_35px_rgba(220,38,38,0.18)] hover:bg-red-500",
    ghost: "border border-stone-200 bg-white/80 text-stone-800 hover:bg-white",
  };
  return (
    <button
      className={cn("rounded-full px-5 py-3 text-sm font-black transition active:translate-y-px", styles[variant], className)}
      type={type}
      name={name}
      value={value}
      onClick={onClick}
    >
      {zh(children)}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "bg-[var(--ink)] text-white shadow-[0_14px_35px_rgba(23,33,28,0.24)] hover:bg-stone-800",
    secondary: "bg-[var(--accent)] text-stone-950 shadow-[0_14px_35px_rgba(244,176,0,0.26)] hover:bg-amber-300",
    ghost: "border border-stone-200 bg-white/80 text-stone-800 hover:bg-white",
  };
  return (
    <Link className={cn("rounded-full px-5 py-3 text-sm font-black transition active:translate-y-px", styles[variant])} href={href}>
      {zh(children)}
    </Link>
  );
}

export function PageHeader({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.25em] text-amber-700">{zhText(eyebrow)}</p> : null}
        <h1 className="mt-2 max-w-5xl text-4xl font-black tracking-[-0.045em] text-[var(--ink)] md:text-6xl">{zhText(title)}</h1>
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  if (rows.length === 0) {
    return <EmptyState title="No records yet" body="Records will appear here when the workflow starts." />;
  }
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white/82 shadow-[0_20px_60px_rgba(64,59,53,0.08)] backdrop-blur-xl">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-[linear-gradient(90deg,rgba(244,176,0,0.18),rgba(163,230,53,0.12))] text-xs uppercase tracking-[0.16em] text-stone-500">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 font-semibold" key={header}>
                {zhText(header)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((row, rowIndex) => (
            <tr className="align-top" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-4 text-stone-700" key={cellIndex}>
                  {zhNode(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
