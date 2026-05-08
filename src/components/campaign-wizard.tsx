"use client";

import { useMemo, useRef, useState } from "react";
import { createCampaignAction } from "@/lib/actions";
import { V1_CAMPAIGN_TEMPLATES, V1_CATEGORIES, V1_CONTENT_TYPES, V1_COUNTRIES, V1_LANGUAGES, V1_PLATFORMS } from "@/lib/v1Options";
import { Button, Card, Field, Select, Textarea } from "@/components/ui";

const steps = ["推广目标", "目标 KOL", "平台任务", "内容要求", "素材验收", "预算发布"];

type WizardSettings = {
  acceptanceSlaDays: number;
  highValueReviewThreshold: number;
  resubmissionGraceDays: number;
  kolPreviewMaxMb: number;
  platformFeeRate: number;
  platformContactEmail: string;
  riskIndustryKeywords: string[];
  riskIndustryPrompt: string;
};

type TaskRow = {
  id: number;
  platform: string;
  contentType: string;
  slotsTotal: number;
  rewardAmount: number;
  minimumFollowers: number;
  draftDeadline: string;
  publishDeadline: string;
  platformRequirement: string;
};

const defaultTaskRows: TaskRow[] = [
  {
    id: 1,
    platform: "小红书",
    contentType: "图文",
    slotsTotal: 5,
    rewardAmount: 30,
    minimumFollowers: 1000,
    draftDeadline: todayPlus(7),
    publishDeadline: todayPlus(12),
    platformRequirement: "标题自然种草，正文包含使用体验和广告披露。",
  },
  {
    id: 2,
    platform: "抖音",
    contentType: "短视频",
    slotsTotal: 3,
    rewardAmount: 50,
    minimumFollowers: 3000,
    draftDeadline: todayPlus(7),
    publishDeadline: todayPlus(12),
    platformRequirement: "视频前 3 秒说明痛点，结尾引导点击主页链接。",
  },
];

function stepClass(active: boolean) {
  return active ? "grid gap-5" : "hidden";
}

function money(value: number) {
  return `¥${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

function todayPlus(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function firstInvalidControl(form: HTMLFormElement, step: number) {
  const controls = Array.from(
    form.querySelectorAll<HTMLElement>(
      `[data-step="${step}"] input[required], [data-step="${step}"] textarea[required], [data-step="${step}"] select[required]`,
    ),
  );
  return controls.find((control) => {
    const value =
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement
        ? control.value.trim()
        : "";
    return value.length === 0;
  });
}

export function CampaignWizard({ error, settings, brandBalance = 0 }: { error?: string; settings: WizardSettings; brandBalance?: number }) {
  const [step, setStep] = useState(0);
  const [localError, setLocalError] = useState(error ?? "");
  const [industry, setIndustry] = useState("AI/工具软件");
  const [tasks, setTasks] = useState<TaskRow[]>(defaultTaskRows);
  const formRef = useRef<HTMLFormElement>(null);

  const escrowAmount = useMemo(
    () => tasks.reduce((sum, task) => sum + Number(task.slotsTotal || 0) * Number(task.rewardAmount || 0), 0),
    [tasks],
  );
  const totalSlots = useMemo(() => tasks.reduce((sum, task) => sum + Number(task.slotsTotal || 0), 0), [tasks]);
  const platformFee = Math.round(escrowAmount * Number(settings.platformFeeRate || 0) * 100) / 100;
  const totalBudget = escrowAmount + platformFee;
  const needsPaymentProof = totalBudget > Number(brandBalance || 0);
  const riskMatched = settings.riskIndustryKeywords.some((keyword) => industry.includes(keyword));

  function updateTask(id: number, patch: Partial<TaskRow>) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  }

  function addTask() {
    const nextId = Math.max(...tasks.map((task) => task.id)) + 1;
    setTasks((current) => [
      ...current,
      {
        id: nextId,
        platform: "视频号",
        contentType: "短视频",
        slotsTotal: 2,
        rewardAmount: 40,
        minimumFollowers: 1000,
        draftDeadline: todayPlus(7),
        publishDeadline: todayPlus(12),
        platformRequirement: "",
      },
    ]);
  }

  function removeTask(id: number) {
    if (tasks.length === 1) return;
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function setFormValue(name: string, value: string) {
    const form = formRef.current;
    const field = form?.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
      field.value = value;
    }
  }

  function applyTemplate(template: (typeof V1_CAMPAIGN_TEMPLATES)[number]) {
    const draftDeadline = todayPlus(7);
    const publishDeadline = todayPlus(12);
    setIndustry(template.industry);
    setTasks(
      template.tasks.map((task, index) => ({
        id: index + 1,
        platform: task.platform,
        contentType: task.contentType,
        slotsTotal: task.slotsTotal,
        rewardAmount: task.rewardAmount,
        minimumFollowers: task.minimumFollowers,
        draftDeadline,
        publishDeadline,
        platformRequirement: task.platformRequirement,
      })),
    );
    setFormValue("title", template.title);
    setFormValue("objective", template.objective);
    setFormValue("cta", template.cta);
    setFormValue("brief", template.brief);
  }

  function validateStep(targetStep = step) {
    const form = formRef.current;
    if (!form) return true;
    const missing = firstInvalidControl(form, targetStep);
    if (missing) {
      setStep(targetStep);
      setLocalError(`请先完成第 ${targetStep + 1} 步的必填项。`);
      setTimeout(() => missing.focus(), 0);
      return false;
    }
    if (targetStep === 2) {
      if (tasks.some((task) => task.slotsTotal <= 0 || task.rewardAmount <= 0)) {
        setStep(2);
        setLocalError("平台任务的人数和奖励必须大于 0。");
        return false;
      }
      if (tasks.some((task) => !task.publishDeadline)) {
        setStep(2);
        setLocalError("每个平台任务都必须填写发布截止时间。");
        return false;
      }
    }
    return true;
  }

  function goToStep(nextStep: number) {
    if (nextStep === step) return;
    if (nextStep > step && !validateStep(step)) return;
    setLocalError("");
    setStep(Math.max(0, Math.min(steps.length - 1, nextStep)));
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function goNext() {
    if (!validateStep(step)) return;
    setLocalError("");
    setStep((current) => Math.min(steps.length - 1, current + 1));
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function validateAllSteps() {
    for (let index = 0; index < steps.length - 1; index += 1) {
      if (!validateStep(index)) return false;
    }
    if (escrowAmount <= 0 || totalSlots <= 0) {
      setStep(2);
      setLocalError("请至少配置一个有效的平台任务。");
      return false;
    }
    if (!validateStep(steps.length - 1)) return false;
    setLocalError("");
    return true;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-6">
        {steps.map((label, index) => (
          <button
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
              index === step ? "border-amber-400 bg-amber-300 text-stone-950" : "border-stone-200 bg-white/75 text-stone-600"
            }`}
            key={label}
            onClick={() => {
              goToStep(index);
            }}
            type="button"
          >
            <span className="block text-xs opacity-70">第 {index + 1} 步</span>
            {label}
          </button>
        ))}
      </div>

      {localError ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{localError}</div> : null}

      <form action={createCampaignAction} className="grid gap-5" noValidate ref={formRef} onSubmit={(event) => {
        if (!validateAllSteps()) event.preventDefault();
      }}>
        <div className={stepClass(step === 0)} data-step={0}>
          <Card>
            <h2 className="text-xl font-black">第 1 步：推广目标</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {V1_CAMPAIGN_TEMPLATES.map((template) => (
                <button
                  className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-left text-sm font-black text-stone-700 transition hover:border-amber-300 hover:bg-amber-50"
                  key={template.key}
                  onClick={() => applyTemplate(template)}
                  type="button"
                >
                  {template.name}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Campaign 名称" name="title" required defaultValue="新品种草推广" />
              <Field label="产品/项目名称" name="productName" required defaultValue="小黄雀产品" />
              <Field label="产品或活动链接" name="landingUrl" defaultValue="https://example.com" />
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                行业分类
                <select
                  className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                  name="industry"
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  required
                >
                  {V1_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <Field label="推广目标" name="objective" required defaultValue="下载/注册" />
              <Field label="目标动作 CTA" name="cta" required defaultValue="点击链接领取试用名额" />
              <Field label="开始时间" name="startDate" type="date" required defaultValue={todayPlus(3)} />
              <Field label="结束时间" name="endDate" type="date" required defaultValue={todayPlus(30)} />
            </div>
            {riskMatched ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                风险提示：{settings.riskIndustryPrompt}
              </div>
            ) : null}
            <div className="mt-4">
              <Textarea
                label="产品介绍"
                name="brief"
                required
                rows={5}
                defaultValue="请用真实体验介绍产品解决了什么问题，适合什么人使用，以及为什么值得尝试。表达要具体、真实、可验证。"
              />
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 1)} data-step={1}>
          <Card>
            <h2 className="text-xl font-black">第 2 步：目标 KOL</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Select label="主要国家/地区" name="targetCountries" defaultValue="中国大陆">
                {V1_COUNTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select label="内容语言" name="targetLanguages" defaultValue="中文">
                {V1_LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Field label="目标人群" name="targetAudience" defaultValue="18-35 岁，对新工具和实用产品感兴趣的用户" />
              <Field label="默认最低粉丝数" name="defaultMinimumFollowers" type="number" defaultValue={1000} />
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              V1 默认只有已验证社媒账号的 KOL 可以申请。商家审核申请时可以看到账号验证状态和手填粉丝数据。
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm font-semibold text-stone-700">
              <input name="allowUnverifiedSocialAccounts" type="checkbox" /> 允许未验证社媒账号申请，商家审核时自行承担筛选成本
            </label>
          </Card>
        </div>

        <div className={stepClass(step === 2)} data-step={2}>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">第 3 步：平台任务</h2>
                <p className="mt-1 text-sm text-stone-500">每个平台单独配置人数、奖励、截止时间和补充要求，系统会自动生成任务。</p>
              </div>
              <Button type="button" variant="ghost" onClick={addTask}>
                添加平台任务
              </Button>
            </div>

            <div className="mt-5 grid gap-4">
              {tasks.map((task, index) => (
                <div className="rounded-2xl border border-stone-200 bg-white/80 p-4" key={task.id}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black text-stone-950">平台任务 {index + 1}</p>
                    <button className="text-sm font-black text-red-600 disabled:opacity-30" disabled={tasks.length === 1} onClick={() => removeTask(task.id)} type="button">
                      删除
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <TaskSelect label="平台" name="taskPlatform" value={task.platform} options={V1_PLATFORMS} onChange={(value) => updateTask(task.id, { platform: value })} />
                    <TaskSelect label="内容形式" name="taskContentType" value={task.contentType} options={V1_CONTENT_TYPES} onChange={(value) => updateTask(task.id, { contentType: value })} />
                    <NumberInput label="招募人数" name="taskSlotsTotal" min={1} value={task.slotsTotal} onChange={(value) => updateTask(task.id, { slotsTotal: value })} />
                    <NumberInput label="每人奖励（元）" name="taskRewardAmount" min={1} value={task.rewardAmount} onChange={(value) => updateTask(task.id, { rewardAmount: value })} />
                    <NumberInput label="最低粉丝数" name="taskMinimumFollowers" min={0} value={task.minimumFollowers} onChange={(value) => updateTask(task.id, { minimumFollowers: value })} />
                    <DateInput label="交稿截止" name="taskDraftDeadline" value={task.draftDeadline} onChange={(value) => updateTask(task.id, { draftDeadline: value })} />
                    <DateInput label="发布截止" name="taskPublishDeadline" value={task.publishDeadline} onChange={(value) => updateTask(task.id, { publishDeadline: value })} required />
                    <label className="grid gap-2 text-sm font-medium text-stone-700 md:col-span-2">
                      平台补充要求
                      <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950" name="taskPlatformRequirement" value={task.platformRequirement} onChange={(event) => updateTask(task.id, { platformRequirement: event.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 3)} data-step={3}>
          <Card>
            <h2 className="text-xl font-black">第 4 步：内容要求</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Textarea label="必须包含内容（逗号分隔）" name="mustInclude" required defaultValue="产品名称, 真实使用场景, 广告披露" />
              <Textarea label="禁止表达（逗号分隔）" name="mustNotInclude" required defaultValue="保证效果, 夸大收益, 虚假官方合作" />
              <Textarea label="画面/素材要求（逗号分隔）" name="visualRequirements" defaultValue="展示产品界面, 展示真实使用过程" />
              <Field label="推荐 Hashtag（逗号分隔）" name="hashtags" defaultValue="#好物分享, #实用工具" />
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm font-semibold text-stone-700">
                <input name="requiresDraftReview" type="checkbox" defaultChecked /> 需要 KOL 先提交草稿，商家审核通过后再发布
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm font-semibold text-stone-700">
                <input name="disclosureRequiredDisabled" type="checkbox" defaultChecked disabled /> 所有付费任务强制广告披露
                <input name="disclosureRequired" type="hidden" value="on" />
              </label>
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 4)} data-step={4}>
          <Card>
            <h2 className="text-xl font-black">第 5 步：素材与验收</h2>
            <div className="mt-4 grid gap-4">
              <div className="grid gap-2 text-sm font-medium text-stone-700">
                Campaign 素材上传
                <input className="rounded-2xl border border-stone-200 bg-white px-4 py-3" name="assetFiles" type="file" multiple />
                <p className="text-xs text-stone-500">V1 建议只上传图片、PDF 等轻量素材；大视频请填写外部链接。KOL 草稿预览附件上限 {settings.kolPreviewMaxMb}MB。</p>
              </div>
              <Field label="外部素材链接" name="assetUrl" placeholder="https://..." />
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="商家验收 SLA（天）" name="acceptanceSlaDays" type="number" defaultValue={settings.acceptanceSlaDays} />
                <Field label="高金额复核阈值（元）" name="highValueReviewThreshold" type="number" defaultValue={settings.highValueReviewThreshold} />
                <Field label="补交宽限期（天）" name="resubmissionGraceDays" type="number" defaultValue={settings.resubmissionGraceDays} />
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
                V1 的发布证明只要求 KOL 提交发布链接。若链接在验收前无法访问、删除或设为私密，默认由 KOL 负责。
              </div>
            </div>
          </Card>
        </div>

        <div className={stepClass(step === 5)} data-step={5}>
          <Card>
            <h2 className="text-xl font-black">第 6 步：预算与发布</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Summary label="总名额" value={totalSlots} />
              <Summary label="KOL 奖励托管" value={money(escrowAmount)} />
              <Summary label="平台服务费" value={money(platformFee)} />
            </div>
            <input name="escrowAmount" type="hidden" value={escrowAmount} />
            <input name="creatorBudget" type="hidden" value={escrowAmount} />
            <input name="totalBudget" type="hidden" value={totalBudget} />
            <input name="platformFee" type="hidden" value={platformFee} />
            <input name="baseReward" type="hidden" value={tasks[0]?.rewardAmount ?? 0} />
            <input name="slotsTotal" type="hidden" value={totalSlots} />
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              提交发布后，如果商家余额足够，系统会冻结对应金额并直接发布；余额不足时 Campaign 进入待付款，需要上传付款凭证后由 Admin 确认。
            </div>
            <div className="mt-4 grid gap-4 rounded-2xl border border-stone-200 bg-white/80 p-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm font-black text-stone-950">按单付款凭证</p>
                <p className="mt-1 text-xs text-stone-500">
                  当前可用余额为 {money(Number(brandBalance || 0))}。余额不足时，提交 Campaign 需要上传付款截图并填写交易订单号，Admin 确认后自动上线。
                </p>
              </div>
              <Field label="交易订单号" name="paymentReference" required={needsPaymentProof} placeholder="银行流水号 / 支付平台订单号" />
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                付款截图
                <input className="rounded-2xl border border-stone-200 bg-white px-4 py-3" name="paymentProof" type="file" accept="image/*" required={needsPaymentProof} />
              </label>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button className={step === 0 ? "opacity-40" : ""} type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))}>
            上一步
          </Button>
          <div className="flex flex-wrap gap-3">
            {step < steps.length - 1 ? (
              <Button type="button" variant="secondary" onClick={goNext}>
                下一步
              </Button>
            ) : (
              <>
                <Button name="intent" value="draft" variant="ghost">
                  保存草稿
                </Button>
                <Button name="intent" value="submit" variant="secondary">
                  提交发布
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function TaskSelect({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {label}
      <select className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950" name={name} value={value} onChange={(event) => onChange(event.target.value)} required>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({
  label,
  name,
  value,
  min,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {label}
      <input
        className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950"
        min={min}
        name={name}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </label>
  );
}

function DateInput({
  label,
  name,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-700">
      {label}
      <input
        className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950"
        name={name}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/80 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
    </div>
  );
}
