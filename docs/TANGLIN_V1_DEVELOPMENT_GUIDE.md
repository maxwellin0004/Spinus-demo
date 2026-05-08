# Tanglin V1 开发指南

本文档是 Tanglin V1 的工程开发指南，基于 `docs/TANGLIN_V1_PRODUCT_DESIGN.md` 的产品设计编写。

它说明目标架构、数据模型、状态机、页面与 server action 改造、开发阶段、验证命令和当前进度。

## 1. 开发目标

Tanglin V1 的目标是把现有偏托管式的创作者活动原型，改造成面向小商家的自助式 KOL 宣发任务平台。

目标 V1 流程：

```text
商家创建 Campaign
-> 商家托管人民币预算
-> 系统自动生成 Campaign Task
-> KOL 使用已验证社媒账号申请
-> 商家审核申请
-> 如需要审稿，KOL 提交草稿
-> KOL 发布内容并提交发布链接
-> 商家验收或拒绝链接
-> KOL 钱包入账
-> KOL 发起人工提现
```

开发优先级是：**流程状态正确、资金流转正确、审计可追踪**。视觉和交互细节在主流程稳定后再优化。

## 2. 当前技术栈

- 框架：Next.js App Router。
- UI：React components，位于 `src/components`。
- Server Actions：`src/lib/actions.ts`。
- 数据库：PostgreSQL。
- ORM：Prisma 7。
- 鉴权：`src/lib/auth.ts` 使用 JWT cookie。
- 文件上传：`src/lib/storage.ts` 保存到本地 `public/uploads`。
- AI 生成：`src/lib/ai.ts`，没有 `OPENAI_API_KEY` 时使用 mock。

本地数据库：

```text
postgresql://postgres:***@localhost:5432/tanglin_rd?schema=public
```

本地上传文件：

```text
public/uploads/
```

## 3. 核心设计决策

开发时必须遵守以下 V1 决策：

- 只做中文。
- 只做人民币。
- 核心客户是自助型小商家。
- 使用完整 Campaign Wizard，但体验上是引导式问卷。
- 商家默认手动审核 KOL 申请。
- V1 不做 KOL 邀请和搜索。
- KOL 主要从任务大厅自由申请。
- 默认要求 KOL 使用已验证社媒账号申请。
- Campaign Task 由商家平台任务配置自动生成。
- 商家发布任务时选择是否需要审稿。
- 草稿最多允许 2 轮修改。
- V1 的 Proof 只要求发布链接。
- 链接验收前不可访问，默认 KOL 负责。
- 商家验收有 SLA。
- 低金额任务验收超时自动通过。
- 高金额任务验收超时进入 Admin 复核。
- 商家按 Campaign 总额预先托管资金。
- V1 保留平台服务费字段，但服务费为 0。
- Campaign 未用完托管金额退回商家余额。
- 商家余额退款走人工处理。
- KOL 提现走人工处理。
- Admin 争议页面支持部分结算。
- 资金、争议、审核、冻结、退款、提现相关操作必须写审计日志。

## 4. 数据模型开发

Schema 文件：

```text
prisma/schema.prisma
```

### 4.1 已完成的基础改造

V1 基础迁移已创建并应用：

```text
prisma/migrations/20260506100031_v1_self_service_foundation/
```

已新增或扩展的概念：

- `CampaignStatus.AWAITING_PAYMENT`
- `CampaignStatus.CANCELLED`
- `DraftReviewStatus`
- `PublicationStatus`
- `SettlementStatus`
- `BrandLedgerTransaction`
- `BrandRefundRequest`
- `PlatformSettings`
- 扩展后的 `Dispute`
- Campaign 托管和 SLA 字段
- CampaignTask 平台补充字段
- TaskApplication 选择社媒账号字段
- Draft 预览附件和修改轮数字段
- Submission 的 publication 和 settlement 字段
- Proof 的拒绝原因和补交次数字段
- Wallet、Withdrawal、Invoice、WalletTransaction 默认 CNY

### 4.2 兼容规则

暂时不要移除旧字段。

现有页面仍依赖：

- `SubmissionStatus`
- `ProofStatus`
- `Invoice`
- 当前 dashboard 查询
- 当前 campaign 页面

当前策略是兼容式推进：

```text
先增加 V1 状态和字段
-> 保证旧页面继续编译
-> 逐步迁移 actions 和页面行为
-> 主流程稳定后再考虑清理旧状态
```

## 5. 状态机

V1 状态流转必须在代码中显式限制，避免任意更新状态。

### 5.1 Campaign

目标状态：

```text
DRAFT
-> AWAITING_PAYMENT
-> ACTIVE
-> PAUSED
-> COMPLETED
-> CANCELLED
```

旧的 `PENDING_REVIEW` 和 `REJECTED` 为兼容保留，但自助 V1 主流程应使用 `AWAITING_PAYMENT` 表示待付款。

规则：

- `DRAFT`：商家可自由编辑。
- `AWAITING_PAYMENT`：需要付款或冻结余额。
- `ACTIVE`：对符合条件的 KOL 可见。
- `PAUSED`：停止新增申请，不影响已通过 KOL。
- `COMPLETED`：只允许查看报表和财务。
- `CANCELLED`：按退款规则关闭。

### 5.2 Application

```text
APPLIED
-> APPROVED
-> REJECTED
-> CANCELLED
```

规则：

- KOL 对同一 task 只能申请一次。
- V1 默认同一 campaign 下一个 KOL 只能接一个 task。
- 通过申请占用一个名额。
- 取消已通过申请时，如果没有下游履约，应释放名额。

### 5.3 Draft Review

```text
NOT_REQUIRED
NOT_SUBMITTED
-> SUBMITTED
-> REVISION_REQUESTED
-> APPROVED
-> REJECTED
```

规则：

- 不需要审稿时，跳过草稿审核，直接进入发布阶段。
- 修改最多 2 轮。
- 要求修改必须有结构化原因和文字说明。
- 草稿通过后的重大修改必须重新提交。

### 5.4 Publication

```text
PENDING_PUBLICATION
-> LINK_SUBMITTED
-> ACCEPTED
-> REJECTED
-> RESUBMITTED
-> DISPUTED
-> EXPIRED
```

规则：

- Proof 只提交发布链接。
- 校验平台域名/格式。
- 禁止重复链接。
- 拒绝必须填写结构化原因和说明。
- KOL 可在最终截止时间前补交。

### 5.5 Settlement

```text
NOT_ESCROWED
-> ESCROWED
-> PAYABLE
-> PAID_TO_WALLET
-> REFUNDED
-> PARTIALLY_SETTLED
-> CANCELLED
```

规则：

- 没有托管资金的 Campaign 不能 ACTIVE。
- 发布链接验收通过后直接进入 KOL 可提现余额。
- 低金额超时自动通过或 Admin 处理后，将金额打入 KOL 钱包。
- 争议可能产生退款或部分结算。

## 6. 财务模型

V1 只做人民币。

### 6.1 商家余额

使用：

- `BrandProfile.budgetBalance` 作为可用余额。
- `BrandProfile.frozenEscrowBalance` 作为冻结托管余额。
- `BrandLedgerTransaction` 记录商家侧资金流水。
- `BrandRefundRequest` 记录商家退款申请。

商家余额行为：

```text
确认付款 -> 可用余额增加
发布 Campaign -> 可用余额减少，冻结托管余额增加
KOL 结算 -> 冻结托管余额减少
Campaign 关闭未用完 -> 冻结托管余额减少，可用余额增加
商家退款支付完成 -> 可用余额减少
```

### 6.2 KOL 钱包

使用现有：

- `Wallet`
- `WalletTransaction`
- `WithdrawalRequest`

V1 默认：

- 币种：CNY。
- 最低提现：￥20。
- 只做人工打款。

### 6.3 平台服务费

V1 平台服务费为 0。

保留字段：

- `Campaign.platformFee`
- `Campaign.platformFeeRate`
- `BrandLedgerTxType.PLATFORM_FEE`

不要删除这些字段，V2 可能启用平台服务费。

## 7. Campaign Wizard 开发

主要文件：

```text
src/components/campaign-wizard.tsx
src/lib/actions.ts
src/app/brand/campaigns/new/page.tsx
```

### 7.1 目标步骤

1. 推广目标。
2. 目标 KOL。
3. 平台任务。
4. 内容要求。
5. 素材与验收。
6. 预算与发布。

### 7.2 平台任务输入

每个平台配置行需要填写：

- 平台。
- 内容形式。
- KOL 名额。
- 每个 KOL 奖励。
- 最低粉丝数。
- 交稿截止时间。
- 发布截止时间。
- 平台补充要求。

支持平台：

- 小红书。
- 抖音。
- 视频号。
- B站。
- 微博。

### 7.3 Campaign 创建 Action

修改 `createCampaignAction`：

- 解析 V1 wizard 表单。
- 计算 `creatorBudget`。
- 设置 `platformFee = 0`。
- 设置 `escrowAmount`。
- 设置 `currency = "CNY"`。
- 创建 campaign。
- 自动创建多个 `CampaignTask`。
- 保存轻量 Campaign 素材。
- 如果商家余额足够：
  - 冻结余额。
  - 创建账务流水。
  - Campaign 进入 `ACTIVE`。
- 如果余额不足：
  - Campaign 进入 `AWAITING_PAYMENT`。
  - 创建待付款记录。

### 7.4 兼容策略

在 billing 正式重构前，可以临时继续用 `Invoice` 表示商家付款单。

长期更建议使用独立付款单或基于商家流水的付款流程。

## 8. KOL 任务大厅开发

主要文件：

```text
src/app/creator/marketplace/page.tsx
src/app/creator/tasks/[id]/page.tsx
src/lib/actions.ts
```

改造点：

- 使用中文平台筛选。
- 展示执行所需 brief。
- 隐藏商家总预算和内部财务字段。
- 申请时必须选择社媒账号。
- 默认只有已验证账号可申请。
- 默认限制同一 campaign 下一个 KOL 只能接一个任务。
- 后续保留商家允许未验证账号申请的配置。

## 9. 商家审核 KOL 申请

主要文件：

```text
src/app/brand/campaigns/[id]/page.tsx
src/app/admin/campaigns/[id]/page.tsx
src/lib/actions.ts
```

V1 行为：

- 商家默认手动审核申请。
- 支持逐个通过/拒绝。
- 支持批量拒绝。
- 支持勾选后批量通过。
- 批量通过时必须显示名额和奖励确认。

实现建议：

- 新增商家专用审核 server action，不要继续混用 Admin-only 审核路径。

## 10. 审稿流程开发

主要文件：

```text
src/app/creator/content-studio/[applicationId]/page.tsx
src/app/brand/campaigns/[id]/submissions/page.tsx
src/lib/actions.ts
src/lib/storage.ts
```

改造点：

- 增加 `disclosurePosition`。
- 增加可选预览附件上传。
- 限制 50 MB。
- 保存 `previewAttachmentUrl`。
- 更新 draft review 状态。
- 记录 revision round。
- 修改要求必须填写结构化原因和说明。

## 11. 发布链接验收开发

主要文件：

```text
src/app/creator/my-tasks/[id]/page.tsx
src/app/brand/campaigns/[id]/submissions/page.tsx
src/lib/actions.ts
```

改造点：

- Proof 表单简化为发布链接。
- V1 UI 不再强制截图和数据指标。
- 按平台校验链接格式。
- 保存拒绝原因和说明。
- 支持截止时间前补交。
- 实现商家验收 SLA。

## 12. Admin 工作流

### 12.1 社媒账号审核队列

新增页面：

```text
src/app/admin/social-accounts/page.tsx
```

或先集成到：

```text
src/app/admin/creators/page.tsx
```

字段：

- KOL。
- 平台。
- 账号链接。
- 手填粉丝数。
- 手填平均播放。
- 国家/地区。
- 内容形式或分类。
- 提交时间。

操作：

- 通过。
- 拒绝。
- 添加说明。

### 12.2 争议页面

新增页面：

```text
src/app/admin/disputes/page.tsx
src/app/admin/disputes/[id]/page.tsx
```

操作：

- 全额结算。
- 全额退款。
- 部分结算。
- 允许继续补交。

所有操作都要更新 settlement 状态、需要时更新账务/钱包，并写入审计日志。

### 12.3 设置页面

修改：

```text
src/app/admin/settings/page.tsx
```

使用 `PlatformSettings` 固定字段：

- 商家验收 SLA 天数。
- 高金额复核阈值。
- KOL 补交宽限期。
- 最低提现金额。
- KOL 预览附件大小。
- 平台服务费比例。
- 平台联系邮箱。

## 13. 报表

### 13.1 Campaign 报表

现有 endpoint：

```text
src/app/api/brand/campaigns/[id]/report.csv/route.ts
```

改为以履约为核心：

- KOL 名称。
- 社媒账号。
- 平台。
- 申请状态。
- 草稿状态。
- 发布链接。
- 验收状态。
- 结算金额。
- 拒绝或争议原因。

### 13.2 财务流水 CSV

新增 Admin 导出接口：

```text
src/app/api/admin/finance-ledger.csv/route.ts
```

导出：

- 商家付款。
- 余额变动。
- 托管冻结/释放。
- KOL 入账。
- 提现。
- 商家退款。
- 关联对象。
- 操作人。
- 时间。

## 14. 通知

V1 只做站内通知。

需要补充通知事件：

- 商家提交付款凭证。
- Admin 确认付款。
- KOL 提交申请。
- 申请通过/拒绝。
- KOL 提交草稿。
- 商家要求修改。
- 草稿通过。
- KOL 提交发布链接。
- 发布链接验收通过/拒绝。
- 验收超时。
- 争议创建/裁定。
- 钱包入账。
- 提现状态变化。
- 商家退款状态变化。

## 15. 验证命令

每个阶段后运行：

```powershell
npx prisma validate
npm run prisma:generate
npm run build
```

Schema 变化后运行：

```powershell
npm run prisma:migrate -- --name <migration_name>
npm run prisma:seed
```

当前本地测试账号：

```text
admin@test.com / password123
brand@test.com / password123
creator@test.com / password123
```

## 16. 手工验收清单

主流程：

```text
商家登录
-> 创建 V1 Campaign
-> 自动生成平台任务
-> 余额或付款凭证使 Campaign ACTIVE
-> 已验证社媒账号的 KOL 申请
-> 商家通过申请
-> KOL 提交草稿
-> 商家通过草稿
-> KOL 提交发布链接
-> 商家验收链接
-> KOL 钱包入账
-> KOL 申请提现
-> Admin 标记提现已支付
```

关键边界流程：

- 商家余额不足。
- 商家暂停 Campaign。
- KOL 社媒账号未验证。
- KOL 在同一 Campaign 下重复申请。
- 商家要求两轮草稿修改。
- KOL 尝试第三次修改。
- 发布链接被拒绝。
- KOL 在截止时间前补交。
- 商家验收超时。
- 高金额超时进入 Admin 复核。
- Admin 部分结算。
- 商家退款申请。

## 17. 开发阶段

### Phase 1：基础模型

状态：已完成。

已完成：

- 增加 V1 schema 基础。
- 应用迁移。
- 生成 Prisma Client。
- 更新 seed，加入平台设置和 CNY 默认值。
- build 通过。

### Phase 2：Campaign Wizard 与自动生成任务

下一阶段。

范围：

- 重做 6 步 Wizard。
- 添加中文平台和分类。
- 自动生成 `CampaignTask`。
- 计算托管金额。
- 设置 Campaign 为 `ACTIVE` 或 `AWAITING_PAYMENT`。

### Phase 3：商家财务基础

范围：

- 余额冻结/释放。
- 付款凭证确认。
- 商家流水页面。
- 退款申请 actions。

### Phase 4：KOL 申请与社媒验证

范围：

- 社媒账号审核队列。
- 申请时选择社媒账号。
- 默认已验证账号准入。
- 同一 Campaign 一个 KOL 只接一个任务。

### Phase 5：审稿与发布流程

范围：

- 可选审稿。
- 修改轮次限制。
- 预览附件。
- 仅发布链接 Proof。
- 商家验收/拒绝。

### Phase 6：SLA、争议与结算

范围：

- 验收 SLA。
- 低金额自动通过。
- 高金额 Admin 复核。
- 争议页面。
- 部分结算。

### Phase 7：报表、规则与打磨

范围：

- Campaign 履约报表。
- 财务流水 CSV。
- 固定字段设置页。
- 规则中心/静态规则页面。
- 待办优先仪表盘。

## 18. 本次重构编码规则

- 每次只改当前阶段需要的范围。
- 替代页面完成前，不删除旧字段。
- 不提交 `.env`。
- 状态流转使用明确 server action。
- 所有资金变动必须放在事务里。
- 所有资金变动必须写审计日志。
- 所有争议裁定必须写审计日志。
- V1 尽量不加后台任务；SLA 初期可以在页面读取或 Admin 队列查询时计算。
- V1 开发阶段继续使用本地文件上传。
