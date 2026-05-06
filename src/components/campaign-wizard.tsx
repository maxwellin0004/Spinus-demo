"use client";

import { useRef, useState } from "react";
import { createCampaignAction } from "@/lib/actions";
import { Button, Card, Field, Textarea } from "@/components/ui";

const steps = [
  "基础信息",
  "推广目标",
  "目标平台",
  "内容要求",
  "禁止事项",
  "预算与奖励",
  "素材上传",
];

function stepClass(active: boolean) {
  return active ? "grid gap-5" : "hidden";
}

export function CampaignWizard({ error }: { error?: string }) {
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState(error ?? "");
  const formRef = useRef<HTMLFormElement>(null);

  function validateCurrentStep() {
    const form = formRef.current;
    if (!form) return true;
    const controls = Array.from(form.querySelectorAll<HTMLElement>(`[data-step="${step}"] input[required], [data-step="${step}"] textarea[required], [data-step="${step}"] select[required]`));
    const missing = controls.find((control) => {
      const value = control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement ? control.value.trim() : "";
      return value.length === 0;
    });
    if (missing) {
      setLocalError("请先完成当前步骤的必填项。");
      missing.focus();
      return false;
    }
    setLocalError("");
    return true;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-7">
        {steps.map((label, index) => (
          <button
            className={`rounded-3xl border px-4 py-3 text-left text-sm font-black transition ${index === step ? "border-amber-400 bg-amber-300 text-stone-950" : "border-stone-200 bg-white/75 text-stone-600"}`}
            key={label}
            onClick={() => {
              if (index <= step || validateCurrentStep()) setStep(index);
            }}
            type="button"
          >
            <span className="block text-xs opacity-70">第 {index + 1} 步</span>
            {label}
          </button>
        ))}
      </div>
      {localError ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{localError}</div> : null}
      <form action={createCampaignAction} className="grid gap-5" noValidate ref={formRef}>
        <div className={stepClass(step === 0)} data-step={0}>
          <Card>
            <h2 className="text-xl font-black">第 1 步：基础信息</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="推广名称" name="title" required defaultValue="新创作者推广" />
              <Field label="产品/项目" name="productName" required defaultValue="小黄雀产品" />
              <Field label="落地页" name="landingUrl" defaultValue="https://example.com" />
              <Field label="行业" name="industry" required defaultValue="AI 工具" />
              <Field label="目标国家/地区（逗号分隔）" name="targetCountries" required defaultValue="新加坡, 美国" />
              <Field label="目标语言（逗号分隔）" name="targetLanguages" required defaultValue="中文, 英文" />
              <Field label="开始时间" name="startDate" type="date" required defaultValue="2026-05-01" />
              <Field label="结束时间" name="endDate" type="date" required defaultValue="2026-06-01" />
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 1)} data-step={1}>
          <Card>
            <h2 className="text-xl font-black">第 2 步：推广目标</h2>
            <div className="mt-4 grid gap-4">
              <Field label="推广目标" name="objective" required defaultValue="注册" placeholder="曝光 / 点击 / 注册 / 下载 / 购买 / 进群 / 留资" />
              <Field label="目标人群" name="targetAudience" defaultValue="创业者和增长团队" />
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 2)} data-step={2}>
          <Card>
            <h2 className="text-xl font-black">第 3 步：目标平台</h2>
            <Field label="目标平台（逗号分隔）" name="targetPlatforms" required defaultValue="TikTok, YouTube Shorts, Instagram Reels" />
          </Card>
        </div>

        <div className={stepClass(step === 3)} data-step={3}>
          <Card>
            <h2 className="text-xl font-black">第 4 步：内容要求</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Textarea label="任务简报" name="brief" required defaultValue="用真实创作者工作流解释产品价值。表达要具体、真实、易验证。" />
              <Textarea label="必须包含（逗号分隔）" name="mustInclude" required defaultValue="产品名称, 核心流程, 人工确认" />
              <Textarea label="画面要求（逗号分隔）" name="visualRequirements" defaultValue="后台画面, 使用前后对比" />
              <Field label="CTA" name="cta" required defaultValue="领取免费模板。" />
              <Field label="推荐 Hashtag" name="hashtags" defaultValue="#AICreator, #FounderTools" />
              <label className="flex items-center gap-3 text-sm font-semibold text-stone-700">
                <input name="disclosureRequired" type="checkbox" defaultChecked /> 必须商业合作披露
              </label>
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 4)} data-step={4}>
          <Card>
            <h2 className="text-xl font-black">第 5 步：禁止事项</h2>
            <Textarea label="禁止表达（逗号分隔）" name="mustNotInclude" required defaultValue="保证收益, 零风险收入, 虚假官方合作" />
          </Card>
        </div>

        <div className={stepClass(step === 5)} data-step={5}>
          <Card>
            <h2 className="text-xl font-black">第 6 步：预算与奖励</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="总预算" name="totalBudget" type="number" required defaultValue={10000} />
              <Field label="创作者奖励预算" name="creatorBudget" type="number" required defaultValue={7000} />
              <Field label="平台服务费" name="platformFee" type="number" required defaultValue={3000} />
              <Field label="基础奖励/条" name="baseReward" type="number" required defaultValue={180} />
              <Field label="总名额" name="slotsTotal" type="number" required defaultValue={10} />
              <Field label="每个创作者最大可接" name="maxPerCreator" type="number" defaultValue={1} />
              <Field label="播放奖励" name="viewsBonus" defaultValue="每额外 1 万次有效播放奖励 20 美元" />
              <Field label="点击奖励" name="clicksBonus" defaultValue="每个有效点击奖励 1 美元" />
              <Field label="转化奖励" name="conversionBonus" defaultValue="由管理端配置 CPA" />
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 6)} data-step={6}>
          <Card>
            <h2 className="text-xl font-black">第 7 步：素材上传</h2>
            <div className="mt-4 grid gap-4">
              <input className="rounded-2xl border border-stone-200 bg-white px-4 py-3" name="assetFiles" type="file" multiple />
              <Field label="外部素材链接" name="assetUrl" placeholder="https://..." />
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button className={step === 0 ? "opacity-40" : ""} type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
            上一步
          </Button>
          <div className="flex flex-wrap gap-3">
            {step < steps.length - 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => validateCurrentStep() && setStep(Math.min(steps.length - 1, step + 1))}
              >
                下一步
              </Button>
            ) : (
              <>
                <Button name="intent" value="draft" variant="ghost">保存草稿</Button>
                <Button name="intent" value="submit" variant="secondary">提交审核</Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
