import Link from "next/link";
import type { ReactNode } from "react";
import { Card, LinkButton, StatusBadge } from "@/components/ui";

export function CreatorOnboardingCard({
  items,
  level,
}: {
  level: string;
  items: Array<{
    label: string;
    done: boolean;
    detail: ReactNode;
    href?: string;
  }>;
}) {
  const completed = items.filter((item) => item.done).length;
  const percent = Math.round((completed / items.length) * 100);
  return (
    <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,248,225,0.82),rgba(163,230,53,0.22))]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-700">Creator Onboarding</p>
          <h2 className="mt-2 text-2xl font-black text-stone-950">资料完成度 {percent}%</h2>
          <p className="mt-2 text-sm text-stone-600">当前可接任务等级：{level}</p>
        </div>
        <StatusBadge>{completed}/{items.length}</StatusBadge>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div className="rounded-2xl border border-stone-200 bg-white/75 p-4" key={item.label}>
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${item.done ? "bg-emerald-500" : "bg-amber-400"}`} />
              <p className="font-black text-stone-950">{item.label}</p>
            </div>
            <p className="mt-2 text-sm text-stone-600">{item.detail}</p>
            {item.href ? <Link className="mt-3 inline-block text-sm font-black text-stone-950" href={item.href}>去处理</Link> : null}
          </div>
        ))}
      </div>
      {completed < items.length ? (
        <div className="mt-5">
          <LinkButton href="/creator/profile" variant="secondary">完善资料</LinkButton>
        </div>
      ) : null}
    </Card>
  );
}

export function CreatorOperatorCard({
  name,
  email,
  wechat,
}: {
  name?: string | null;
  email?: string | null;
  wechat?: string | null;
}) {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(23,33,28,0.96),rgba(52,64,53,0.94))] text-white">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">你的平台运营联系人</p>
      <h2 className="mt-3 text-2xl font-black">{name ?? "暂未分配"}</h2>
      <div className="mt-4 grid gap-2 text-sm text-white/75">
        <p>邮箱：{email ?? "暂未填写"}</p>
        <p>微信：{wechat ?? "暂未填写"}</p>
      </div>
    </Card>
  );
}

export function CreatorTaskTimeline({
  items,
}: {
  items: Array<{
    label: string;
    done: boolean;
    active?: boolean;
    detail?: ReactNode;
  }>;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-stone-950">任务进度时间线</h2>
        <StatusBadge>{items.filter((item) => item.done).length}/{items.length}</StatusBadge>
      </div>
      <ol className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item, index) => (
          <li className={`rounded-2xl border p-4 ${item.active ? "border-amber-300 bg-amber-50" : item.done ? "border-emerald-200 bg-emerald-50/60" : "border-stone-200 bg-white/70"}`} key={item.label}>
            <div className="flex items-center gap-3">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-black ${item.done ? "bg-amber-400 text-stone-950" : "bg-stone-200 text-stone-500"}`}>
                {index + 1}
              </span>
              <p className="font-black text-stone-950">{item.label}</p>
            </div>
            {item.detail ? <p className="mt-3 text-sm text-stone-600">{item.detail}</p> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}
