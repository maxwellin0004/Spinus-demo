import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#fef3c7,#fafaf9)] p-6">
      <div className="max-w-lg rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">403</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-950">无权访问该工作台</h1>
        <p className="mt-3 text-stone-500">该页面受角色权限保护。请使用正确的管理端、品牌方或创作者账号登录。</p>
        <Link className="mt-8 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white" href="/auth/login">
          返回登录
        </Link>
      </div>
    </div>
  );
}
