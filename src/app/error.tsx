"use client";

export default function ErrorPage({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  const retry = unstable_retry ?? reset;
  const digest = error.digest ? `错误编号：${error.digest}` : null;

  return (
    <div className="grid min-h-screen place-items-center bg-stone-50 p-6">
      <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-950">页面加载失败</h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          这通常是提交数据、文件上传或服务端处理失败导致的。请重试；如果仍失败，把错误编号或刚才的操作发给管理员排查。
        </p>
        {digest ? <p className="mt-3 text-xs font-semibold text-stone-400">{digest}</p> : null}
        {retry ? (
          <button className="mt-6 rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white" onClick={retry}>
            重试
          </button>
        ) : null}
      </div>
    </div>
  );
}
