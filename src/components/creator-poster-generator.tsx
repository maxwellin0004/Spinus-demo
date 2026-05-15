"use client";

import Image from "next/image";
import { useState } from "react";

export function CreatorPosterGenerator() {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);

  const currentPosterUrl = version == null ? null : `/api/creator/share/poster?v=${version}`;

  return (
    <section className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-white/88 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Poster Generator</p>
          <h2 className="mt-2 text-2xl font-black text-stone-950">一键生成分享海报</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-600">
            点击后会生成一张真实的宣传海报图片，保持当前模板样式，只替换成你的专属注册链接二维码。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-stone-950 shadow-sm transition hover:brightness-105"
            type="button"
            onClick={() => {
              const nextVersion = Date.now();
              setVersion(nextVersion);
              setPosterUrl(`/api/creator/share/poster?v=${nextVersion}`);
            }}
          >
            {posterUrl ? "重新生成海报" : "生成分享海报"}
          </button>
          {currentPosterUrl ? (
            <a
              className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-black text-stone-800 shadow-sm"
              href={`${currentPosterUrl}&download=1`}
            >
              下载海报
            </a>
          ) : null}
        </div>
      </div>

      {posterUrl ? (
        <div className="overflow-hidden rounded-[26px] border border-stone-200 bg-stone-50 p-4">
          <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <Image
              alt="创作者分享海报预览"
              className="h-auto w-full"
              height={1672}
              src={posterUrl}
              unoptimized
              width={941}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-stone-300 bg-stone-50/70 px-5 py-10 text-center text-sm font-semibold text-stone-500">
          生成后会在这里显示海报预览。
        </div>
      )}
    </section>
  );
}
