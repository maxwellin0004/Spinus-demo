"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 p-6">
      <div className="max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">页面加载失败</h1>
        <p className="mt-3 text-stone-500">请检查本地数据库连接后重试。</p>
        <button className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white" onClick={reset}>
          重试
        </button>
      </div>
    </div>
  );
}
