"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyButton } from "@/components/form-controls";

export function CreatorSharePoster({
  displayName,
  registerUrl,
  shareCode,
}: {
  displayName: string;
  registerUrl: string;
  shareCode: string;
}) {
  const [qrCodeSrc, setQrCodeSrc] = useState("");

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(registerUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((value) => {
        if (!cancelled) setQrCodeSrc(value);
      })
      .catch(() => {
        if (!cancelled) setQrCodeSrc("");
      });

    return () => {
      cancelled = true;
    };
  }, [registerUrl]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <article className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <div className="bg-[linear-gradient(135deg,#09183f_0%,#12349b_48%,#1e40af_100%)] px-7 pb-8 pt-7 text-white">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#ffd44d]">Campus KOC</p>
              <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight md:text-5xl">把你的内容影响力分享给更多校园创作者</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
                邀请好友注册小黄雀，领取专属成长路径、会员咨询入口和内容合作机会。
              </p>
            </div>
            <div className="hidden min-w-48 rounded-[24px] bg-white/10 p-4 backdrop-blur md:block">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd44d]">分享人</p>
              <p className="mt-3 text-2xl font-black">{displayName}</p>
              <p className="mt-2 text-sm text-white/74">邀请码风格海报，扫码直接进入创作者注册页。</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "注册链接", body: "扫码直达创作者注册页" },
              { title: "个人归因", body: "注册来源可追溯到你的分享" },
              { title: "会员咨询", body: "同步引导查看两档会员方案" },
            ].map((item) => (
              <div className="rounded-[22px] border border-white/12 bg-white/10 p-4" key={item.title}>
                <p className="text-sm font-black text-[#ffd44d]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/78">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 px-7 py-7 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] bg-stone-50 p-6">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-stone-500">专属分享码</p>
            <p className="mt-3 text-5xl font-black tracking-[0.08em] text-stone-950">{shareCode}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-stone-600">
              分享给同学或社团创作者后，对方扫码即可进入注册页。注册完成后，系统会记录来自你的分享。
            </p>
            <div className="mt-6 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
              {["分享个人成长路径", "引导查看会员方案", "沉淀校园创作者人脉", "帮助团队扩展内容合作机会"].map((item) => (
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 font-semibold" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#fee08b] bg-[linear-gradient(180deg,#fff8d6_0%,#fffef6_100%)] p-5">
            <div className="rounded-[22px] bg-white p-4 shadow-sm">
              <div className="grid aspect-square place-items-center rounded-[18px] bg-stone-50 p-4">
                {qrCodeSrc ? (
                  <Image alt="专属注册链接二维码" className="h-full w-full rounded-2xl object-contain" height={320} src={qrCodeSrc} unoptimized width={320} />
                ) : (
                  <span className="text-sm font-semibold text-stone-500">二维码生成中...</span>
                )}
              </div>
              <p className="mt-4 text-center text-lg font-black text-stone-950">扫码加入创作者工作台</p>
              <p className="mt-2 text-center text-sm leading-6 text-stone-600">使用你的专属海报进入注册页，后续可继续查看会员介绍并联系开通。</p>
            </div>
          </div>
        </div>
      </article>

      <aside className="grid gap-4">
        <div className="rounded-2xl border border-[var(--line)] bg-white/86 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">分享操作</p>
          <div className="mt-4 grid gap-3">
            <CopyButton value={registerUrl}>复制分享链接</CopyButton>
            <CopyButton value={shareCode}>复制分享码</CopyButton>
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-white/86 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">推荐话术</p>
          <p className="mt-3 text-sm leading-7 text-stone-700">
            我在小黄雀这边整理了一套校园创作者成长路径，扫码可以直接注册看看，里面还有会员方案和内容合作机会。
          </p>
        </div>
      </aside>
    </div>
  );
}
