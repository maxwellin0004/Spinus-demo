import type { ReactNode } from "react";
import { Card, StatusBadge } from "@/components/ui";
import { shortDate } from "@/lib/format";

export function OperatorCard({
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
      <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">你的商务运营</p>
      <h2 className="mt-3 text-2xl font-black">{name ?? "暂未分配"}</h2>
      <div className="mt-4 grid gap-2 text-sm text-white/75">
        <p>邮箱：{email ?? "暂未填写"}</p>
        <p>微信：{wechat ?? "暂未填写"}</p>
      </div>
    </Card>
  );
}

export function ProgressTimeline({
  items,
}: {
  items: Array<{
    label: string;
    done: boolean;
    date?: Date | string | null;
    detail?: ReactNode;
  }>;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-stone-950">项目进度时间线</h2>
        <StatusBadge>{items.filter((item) => item.done).length}/{items.length}</StatusBadge>
      </div>
      <ol className="mt-6 grid gap-4 md:grid-cols-4">
        {items.map((item, index) => (
          <li className="relative rounded-3xl border border-stone-200 bg-white/75 p-4 shadow-sm" key={item.label}>
            <div className="flex items-center gap-3">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${item.done ? "bg-amber-400 text-stone-950" : "bg-stone-200 text-stone-500"}`}>
                {index + 1}
              </span>
              <div>
                <p className="font-black text-stone-950">{item.label}</p>
                <p className="text-xs text-stone-500">{item.done ? shortDate(item.date) : "待完成"}</p>
              </div>
            </div>
            {item.detail ? <div className="mt-3 text-sm text-stone-600">{item.detail}</div> : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function MessageThread({
  messages,
}: {
  messages: Array<{
    id: string;
    body: string;
    authorRole: string;
    author?: { email?: string | null } | null;
    createdAt: Date | string;
  }>;
}) {
  if (!messages.length) {
    return <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-4 text-sm text-stone-500">暂无留言，新的沟通记录会展示在这里。</p>;
  }
  return (
    <div className="grid gap-3">
      {messages.map((message) => (
        <div className="rounded-3xl border border-stone-200 bg-white/75 p-4" key={message.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-stone-950">{message.authorRole === "ADMIN" ? "平台运营" : "品牌方"} · {message.author?.email ?? "系统"}</p>
            <p className="text-xs text-stone-500">{shortDate(message.createdAt)}</p>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{message.body}</p>
        </div>
      ))}
    </div>
  );
}
