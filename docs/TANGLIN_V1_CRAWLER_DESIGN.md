# Tanglin V1 自动抓取设计文档

本文档定义 Tanglin V1 中“小红书/抖音账号与作品数据自动抓取”的产品边界、技术架构、数据模型、内部 API、页面改造和实施顺序。

自动抓取用于辅助核验，不自动决定放款、拒绝、结算或处罚。商家验收、SLA、Admin 争议处理仍然是资金流转的最终依据。

## 1. 背景

Tanglin V1 当前已经支持：

- KOL 绑定社媒账号并手填粉丝数。
- KOL 提交发布链接。
- 系统做平台链接基础校验。
- 商家验收发布链接。
- Admin 处理争议和人工结算。

下一阶段需要补充自动抓取能力，用于核验：

- KOL 自身账号数据：粉丝数、关注数、获赞数、作品数等。
- 发布作品数据：浏览量、点赞、收藏、评论、分享等。
- 作品作者是否与 KOL 申请时选择的账号一致。

## 2. 目标与非目标

### 2.1 目标

- 第一版只支持小红书和抖音自动抓取。
- 抓取数据作为商家验收和 Admin 争议处理的辅助依据。
- 抓取失败不阻塞 KOL 绑定账号、提交发布链接或后续人工验收。
- 保存每次抓取历史快照，不只覆盖最新值。
- 提供 Admin 最小抓取队列和服务状态页面。
- 商家可刷新自己 Campaign 下的作品数据。
- Admin 可刷新全部账号数据和作品数据。
- KOL 可查看自己的抓取状态和公开指标，但看不到内部风控细节。

### 2.2 非目标

- 不把抓取结果作为自动放款依据。
- 不做自动拒绝、自动扣款、自动处罚。
- 不做复杂刷量识别、互动率模型、粉丝画像分析。
- 第一版不支持 B 站、微博、视频号的自动抓取。
- 第一版不做定时循环抓取。
- 第一版不在 Tanglin 主站保存小红书/抖音 Cookie。
- 第一版不在 Tanglin Admin 后台做二维码登录或 Cookie 管理。
- 不保存完整 HTML、完整 Cookie、平台账号密码或完整响应包。

## 3. 已确认产品决策

- 自动抓取第一版只做辅助核验，不自动决定放款。
- 第一版只做小红书和抖音。
- 抓取时机：
  - KOL 绑定小红书/抖音账号时抓一次账号数据。
  - KOL 提交小红书/抖音作品链接时抓一次作品数据。
  - 商家/Admin 验收前可以手动刷新一次。
  - 暂不做定时抓取。
- 自动抓取失败不阻塞流程，只做风险提示和人工审核依据。
- MediaCrawler 作为独立 Python Worker 服务接入，不内嵌到 Tanglin Next.js 项目里。
- Worker 通过 Tanglin 内部 HTTP API 拉任务和回写结果，不直接连接数据库。
- Worker 和主站之间使用固定内部 Token 认证。
- 第一版只保存结构化抓取结果和少量原始摘要。
- 账号抓取快照和作品抓取快照分成两套模型。
- 自动抓取粉丝数不直接覆盖 KOL 手填粉丝数，分开保存。
- 自动抓取失败最多自动重试 2 次，之后只能手动刷新。
- 第一版做 Admin 最小抓取任务队列页面。
- 商家可刷新自己 Campaign 的作品数据，Admin 可刷新全部，KOL 第一版不能手动刷新。
- 第一版做账号与作品作者匹配提示，但不自动拒绝。
- Campaign 报表和 CSV 使用最新成功抓取快照，不展开全部历史。
- 第一版做简单抓取限频。
- Admin 后台只查看 Worker 和平台登录态状态，不保存或管理平台 Cookie。
- 第一版做一个 `/admin/crawler` 页面，同时展示任务队列和服务状态。
- 第一版采用 Worker 主动拉取 Tanglin 任务。
- CrawlerJob 需要 `lockedAt` / `lockedBy`，防止重复领取和卡死任务。
- 抓取失败也保存快照记录。
- 第一版只做 4 个自动风险提示：
  - 链接平台不匹配。
  - 作品作者和申请账号不匹配。
  - 账号粉丝数明显低于任务要求。
  - 抓取失败或链接不可访问。

## 4. 总体架构

```text
Tanglin Next.js 主站
  - 保存业务对象：SocialAccount、Proof、Campaign、TaskApplication
  - 创建 CrawlerJob
  - 提供内部任务领取和结果回写 API
  - 保存 SocialAccountSnapshot / PostMetricSnapshot
  - 展示抓取状态、指标、风险提示

MediaCrawler Worker
  - 基于商业授权后的 MediaCrawler 能力封装
  - 维护小红书/抖音登录态
  - 主动拉取 Tanglin CrawlerJob
  - 执行账号/作品抓取
  - 通过内部 API 回写抓取结果
```

主站和 Worker 的边界：

- Tanglin 管业务流程、权限、数据展示、审计。
- Worker 管平台登录态、抓取执行、解析适配、抓取失败原因归类。
- Worker 不直接连接 Tanglin 数据库。
- Tanglin 不保存平台 Cookie。

## 5. 平台范围

第一版自动抓取平台：

- 小红书
- 抖音

其他平台：

- B 站、微博、视频号继续保留链接校验和人工字段。
- 数据模型可以预留平台枚举，但页面不展示自动抓取能力。

## 6. 数据模型设计

### 6.1 CrawlerJob

用于记录一次抓取任务。

建议字段：

```text
id
type
platform
status
targetType
targetId
targetUrl
attempts
maxAttempts
lockedAt
lockedBy
lastAttemptAt
lastErrorCode
lastErrorMessage
createdByUserId
createdAt
updatedAt
completedAt
```

任务类型：

```text
FETCH_SOCIAL_ACCOUNT
FETCH_POST_METRICS
REFRESH_SOCIAL_ACCOUNT
REFRESH_POST_METRICS
```

任务状态：

```text
PENDING
PROCESSING
SUCCESS
FAILED
CANCELLED
```

锁定规则：

- Worker 拉任务时写入 `status=PROCESSING`、`lockedAt=now`、`lockedBy=workerId`。
- `PROCESSING` 超过 10 分钟未回写，可以被重新领取。
- 回写结果时校验 `lockedBy`。

### 6.2 SocialAccountSnapshot

绑定某个 KOL 社媒账号，记录主页级数据。

第一版字段：

```text
id
socialAccountId
crawlerJobId
platform
status
failureReason
displayName
profileUrl
platformUserId
followerCount
followingCount
likeCount
postCount
fetchedAt
rawProvider
rawUserId
rawCanonicalUrl
rawMetricText
parserVersion
createdAt
```

规则：

- 无法获取的字段存 `null`。
- 确认是 0 的字段才存 `0`。
- 不直接覆盖 `SocialAccount.followerCount`。
- Admin 后续可以人工采用抓取粉丝数，但第一版不自动覆盖。

### 6.3 PostMetricSnapshot

绑定某个发布证明 `Proof`，记录单个作品数据。

第一版字段：

```text
id
proofId
crawlerJobId
platform
status
failureReason
viewCount
likeCount
favoriteCount
commentCount
shareCount
title
authorName
authorPlatformUserId
publishedAt
canonicalUrl
platformPostId
authorMatchStatus
fetchedAt
rawProvider
rawItemId
rawUserId
rawCanonicalUrl
rawMetricText
parserVersion
createdAt
```

作者匹配状态：

```text
MATCHED
MISMATCHED
UNKNOWN
```

规则：

- 无法获取的指标存 `null`，不要硬填 0。
- 抓取失败也保存快照，指标字段为 `null`，写入失败原因。
- 页面默认展示最新成功快照，同时提示最近一次失败。

## 7. 抓取任务协议

### 7.1 Worker 健康检查

Worker 暴露：

```text
GET /health
```

返回结构：

```json
{
  "status": "ok",
  "workerVersion": "0.1.0",
  "checkedAt": "2026-05-07T12:00:00+08:00",
  "providers": {
    "xhs": {
      "enabled": true,
      "loginStatus": "VALID",
      "lastLoginCheckedAt": "2026-05-07T12:00:00+08:00",
      "lastError": null
    },
    "douyin": {
      "enabled": true,
      "loginStatus": "EXPIRED",
      "lastLoginCheckedAt": "2026-05-07T12:00:00+08:00",
      "lastError": "登录态失效"
    }
  },
  "queue": {
    "pending": 3,
    "processing": 1,
    "failed": 2
  }
}
```

登录态状态：

```text
VALID
EXPIRED
UNKNOWN
UNCONFIGURED
ERROR
```

### 7.2 Tanglin 内部 API

所有内部 API 使用：

```http
X-Internal-Token: <CRAWLER_INTERNAL_TOKEN>
```

环境变量：

```env
CRAWLER_INTERNAL_TOKEN=your-long-random-token
CRAWLER_WORKER_HEALTH_URL=http://127.0.0.1:8787/health
```

建议 API：

```text
GET /api/internal/crawler/jobs/next
POST /api/internal/crawler/jobs/:id/result
```

领取任务返回：

```json
{
  "jobId": "xxx",
  "type": "FETCH_POST_METRICS",
  "platform": "XIAOHONGSHU",
  "targetUrl": "https://...",
  "targetId": "proof_or_social_account_id",
  "createdAt": "2026-05-07T12:00:00+08:00"
}
```

没有任务时返回：

```json
{
  "job": null
}
```

回写成功结果：

```json
{
  "workerId": "worker-01",
  "status": "SUCCESS",
  "snapshot": {
    "viewCount": 1200,
    "likeCount": 88,
    "favoriteCount": 31,
    "commentCount": 12,
    "shareCount": 4,
    "title": "作品标题",
    "authorName": "作者昵称",
    "authorPlatformUserId": "user_123",
    "publishedAt": "2026-05-07T10:00:00+08:00",
    "canonicalUrl": "https://...",
    "platformPostId": "post_123",
    "rawProvider": "mediacrawler",
    "rawMetricText": "点赞 88 收藏 31 评论 12",
    "parserVersion": "0.1.0"
  }
}
```

回写失败结果：

```json
{
  "workerId": "worker-01",
  "status": "FAILED",
  "errorCode": "LOGIN_EXPIRED",
  "errorMessage": "小红书登录态失效",
  "snapshot": {
    "status": "FAILED",
    "failureReason": "小红书登录态失效",
    "rawProvider": "mediacrawler",
    "parserVersion": "0.1.0"
  }
}
```

## 8. 抓取时机

### 8.1 KOL 绑定账号

触发条件：

- KOL 新增小红书/抖音账号。

行为：

- 创建 `FETCH_SOCIAL_ACCOUNT` 任务。
- 社媒账号进入自动核验中状态。
- 失败不阻塞账号创建。
- Admin 审核页显示最新账号快照和失败原因。

### 8.2 KOL 提交发布链接

触发条件：

- KOL 对小红书/抖音任务提交发布链接。

行为：

- 主站先保存 Proof。
- 主站继续做已有平台域名校验。
- 创建 `FETCH_POST_METRICS` 任务。
- Proof 页面显示自动核验中。
- 抓取失败不阻塞商家验收。

### 8.3 商家/Admin 手动刷新

商家：

- 只能刷新自己 Campaign 下 KOL 提交的作品数据。
- 同一作品链接 10 分钟内不能重复刷新。

Admin：

- 可以刷新全部账号数据和作品数据。
- 操作写审计日志。

KOL：

- 第一版不能手动刷新。

## 9. 限频与重试

### 9.1 重试

- 每个抓取任务 `maxAttempts=2`。
- 第一次失败后自动重试一次。
- 第二次仍失败则任务进入 `FAILED`。
- 手动刷新会创建新任务，不复用旧任务。

### 9.2 限频

默认规则：

- 同一作品链接：10 分钟内不能重复刷新。
- 同一商家：每小时最多刷新 100 次作品数据。
- 同一账号：账号数据 24 小时内最多自动刷新 1 次。
- Worker 全局处理速率通过配置控制。

## 10. 风险提示

第一版只做 4 个风险提示：

### 10.1 链接平台不匹配

例：任务要求小红书，KOL 提交抖音链接。

行为：

- 提交时直接阻止或提示修正。
- 如果历史数据中出现不匹配，商家/Admin 页面显示风险。

### 10.2 作品作者和申请账号不匹配

对比：

- KOL 申请时选择的社媒账号主页、平台用户 ID、昵称。
- 作品抓取到的作者 ID、昵称。

行为：

- 匹配成功：显示“作者匹配”。
- 明显不一致：显示“疑似非本人账号发布”。
- 无法判断：显示“作者无法自动核验”。
- 不自动拒绝。

### 10.3 账号粉丝数明显低于任务要求

行为：

- 比较最新成功账号快照粉丝数和 CampaignTask 最低粉丝要求。
- 低于要求时显示风险。
- 不自动拒绝。

### 10.4 抓取失败或链接不可访问

行为：

- 商家/Admin 页面显示失败原因摘要。
- KOL 页面只显示简单失败提示。
- 争议页显示失败历史。

## 11. 页面改造

### 11.1 Admin `/admin/crawler`

一个页面同时展示任务队列和服务状态。

服务状态区：

- Worker 是否在线。
- Worker 版本。
- 最近健康检查时间。
- 小红书登录态状态。
- 抖音登录态状态。
- 队列统计。
- 最近错误摘要。

任务队列区：

- 任务类型。
- 平台。
- 状态。
- 尝试次数。
- 关联对象。
- 创建时间。
- 最后尝试时间。
- 失败原因。
- 手动重试按钮。

### 11.2 Admin 社媒账号审核页

新增：

- KOL 手填粉丝数。
- 最新成功账号快照。
- 最近失败提示。
- 粉丝数差异提示。
- 账号数据刷新按钮。

### 11.3 商家验收页

新增：

- 最新成功作品快照。
- 最近失败提示。
- 作者匹配状态。
- 浏览、点赞、收藏、评论、分享。
- 最近抓取时间。
- 商家刷新按钮。

### 11.4 KOL 任务详情页

新增：

- 自动核验中 / 核验成功 / 核验失败。
- 自己作品的公开指标。
- 最近抓取时间。
- 简单失败提示。

不展示：

- 内部错误码。
- 反爬细节。
- Worker 日志。
- 风险规则细节。

### 11.5 Campaign 报表和 CSV

新增最新成功抓取快照字段：

- 发布链接。
- 作者匹配状态。
- 粉丝数快照。
- 浏览量。
- 点赞。
- 收藏。
- 评论。
- 分享。
- 最近抓取时间。
- 抓取状态。

第一版不展开全部历史快照。

## 12. 安全与合规边界

- 已获得 MediaCrawler 作者商业授权后，才允许把它作为 Worker 实现基础。
- 保留授权证明和原项目版权声明。
- Tanglin 主站不保存平台 Cookie、账号密码、二维码图片或浏览器会话。
- 不把 Cookie 写入数据库。
- 请求日志不打印 `X-Internal-Token`。
- 不保存完整 HTML、完整响应包。
- 只保存业务所需结构化字段和少量原始摘要。
- 抓取结果只作为辅助核验，不作为自动结算唯一依据。

## 13. 实施顺序

### 第 1 步：主站数据模型

- 新增 `CrawlerJob`。
- 新增 `SocialAccountSnapshot`。
- 新增 `PostMetricSnapshot`。
- 新增相关枚举。
- 生成 Prisma migration。

### 第 2 步：主站内部 API

- `GET /api/internal/crawler/jobs/next`。
- `POST /api/internal/crawler/jobs/:id/result`。
- 固定 Token 校验。
- 任务锁定和超时重领。

### 第 3 步：主站任务创建

- KOL 绑定账号时创建账号抓取任务。
- KOL 提交作品链接时创建作品抓取任务。
- 商家/Admin 手动刷新时创建刷新任务。
- 加入限频和重试规则。

### 第 4 步：Admin 抓取页面

- `/admin/crawler`。
- 展示 Worker 健康状态。
- 展示任务队列。
- 支持手动重试。

### 第 5 步：业务页面展示

- Admin 社媒账号审核页展示账号快照。
- 商家验收页展示作品快照和风险提示。
- KOL 任务详情页展示公开抓取结果。
- Admin 争议页展示抓取历史。

### 第 6 步：报表和 CSV

- Campaign 报表加入最新成功抓取快照。
- Campaign CSV 加入指标字段。

### 第 7 步：Worker 最小服务

- 独立 `tanglin-crawler` Python 服务。
- 暴露 `/health`。
- 主动拉取 Tanglin 任务。
- 使用 MediaCrawler 实现小红书/抖音账号和作品抓取。
- 回写结构化快照。

当前开发阶段先实现 mock Worker：

```powershell
cd D:\program\ai_video\workflow\tanglin-crawler
copy .env.example .env
python .\worker.py
```

Tanglin 主站 `.env` 需要配置同一个内部 token：

```env
CRAWLER_INTERNAL_TOKEN=your-long-random-token
CRAWLER_WORKER_HEALTH_URL=http://127.0.0.1:8787/health
```

Mock Worker 可以先跑通：

- `/health` 服务状态。
- 主动领取任务。
- 账号抓取任务回写 `SocialAccountSnapshot`。
- 作品抓取任务回写 `PostMetricSnapshot`。
- 失败场景回写失败快照。

后续接入 MediaCrawler 时，只替换 `tanglin-crawler/providers.py` 中的 provider 实现。

### 第 8 步：联调和验收

- 小红书账号抓取。
- 抖音账号抓取。
- 小红书作品抓取。
- 抖音作品抓取。
- 登录态失效场景。
- 链接不可访问场景。
- 作者不匹配场景。
- 抓取失败重试。
- 商家刷新限频。
- Campaign CSV 导出。

## 14. 验收标准

- KOL 绑定小红书/抖音账号后，系统创建账号抓取任务。
- KOL 提交小红书/抖音作品链接后，系统创建作品抓取任务。
- Worker 可以领取任务并回写成功或失败快照。
- 抓取失败不阻塞 KOL 提交或商家验收。
- Admin 可以在 `/admin/crawler` 看到 Worker 状态、登录态状态和任务队列。
- 商家验收页可以看到作品指标和作者匹配提示。
- Admin 社媒账号审核页可以看到账号指标和手填粉丝数差异。
- KOL 可以看到自己的公开抓取结果和简单状态。
- Campaign 报表和 CSV 使用最新成功快照。
- 不保存平台 Cookie、完整 HTML 或完整响应包。
