# TikHub MVP 数据接入方案

## 目标

第一版先不用百度指数，优先用 TikHub 覆盖自媒体平台数据，把现有两个页面从 mock 数据逐步替换为真实样本数据：

- `/creator/trends`：达人创作版
- `/brand/insights`：品牌洞察版

TikHub 主要提供原始内容、热点、搜索、评论、账号等数据。页面中的评分、推荐、风险、报告需要我们自研计算或用 AI 生成。

## 第一版平台范围

优先级建议：

1. 抖音：热点、指数、创作者热点、搜索、视频详情、评论。
2. 小红书：笔记搜索、笔记详情、评论、用户笔记。
3. 微博：热搜、关键词搜索、评论。
4. B站：视频搜索、热门视频、评论。

第一版不做全平台全量，只做关键词和重点账号的样本级趋势。

## 统一数据模型

### trend_topics

用于热点、话题和趋势图。

| 字段 | 说明 | 来源 |
|---|---|---|
| `topic_id` | 内部话题 ID | 自研生成 |
| `topic` | 话题名/关键词 | TikHub 热点/搜索 |
| `platforms` | 出现平台 | TikHub |
| `date` | 日期 | TikHub/采集时间 |
| `heat_value` | 平台原始热度值 | TikHub |
| `heat_score` | 归一化热度分 | 自研计算 |
| `growth_rate` | 环比增长率 | 自研计算 |
| `stage` | 刚升温/爆发中/长尾可做/已过热 | 自研规则 |
| `source_payload` | 原始返回 | TikHub raw |

### contents

用于爆款案例、声量统计、内容样本。

| 字段 | 说明 | 来源 |
|---|---|---|
| `content_id` | 内部内容 ID | 自研生成 |
| `platform` | 平台 | TikHub |
| `source_content_id` | 平台内容 ID | TikHub |
| `title` | 标题 | TikHub |
| `description` | 正文/文案 | TikHub |
| `author_id` | 作者 ID | TikHub |
| `author_name` | 作者名 | TikHub |
| `publish_time` | 发布时间 | TikHub |
| `content_url` | 内容链接 | TikHub |
| `like_count` | 点赞 | TikHub |
| `comment_count` | 评论 | TikHub |
| `share_count` | 转发/分享 | TikHub |
| `collect_count` | 收藏 | TikHub，部分平台可能无 |
| `view_count` | 播放/阅读 | TikHub，部分平台可能无 |
| `keyword` | 采集关键词 | 自研任务 |
| `topic_id` | 关联话题 | 自研聚类 |

### trend_snapshots

用于把一次次采集结果沉淀成可画折线图的时间序列。每次关键词搜索采集完成后，按 `source + platform + keyword + date` 聚合当天内容样本。

| 字段 | 说明 | 来源 |
|---|---|---|
| `source` | 数据源，如 `tikhub` | 自研任务 |
| `platform` | 平台 | TikHub |
| `keyword` | 关键词/品牌词/竞品词 | 自研任务 |
| `keyword_type` | 品牌词/品类词/竞品词/卖点词 | 词库配置 |
| `date` | 快照日期 | 采集时间 |
| `content_count` | 当天采集到的内容数 | 内容聚合 |
| `interaction_count` | 赞评藏转汇总 | 内容聚合 |
| `heat_score` | 趋势热度分 | 自研归一化 |
| `raw_payload` | 聚合补充信息 | 自研 |

### keyword_configs

用于管理需要持续采集的关键词池，避免把关键词写死在脚本里。服务器定时器只需要调用内部采集接口，系统会自动找出到期关键词并采集。

| 字段 | 说明 |
|---|---|
| `keyword` | 关键词 |
| `keyword_type` | 品牌词/品类词/竞品词/卖点词/痛点词/人群词 |
| `platform` | 采集平台 |
| `endpoint` | TikHub endpoint key |
| `active` | 是否启用 |
| `priority` | 采集优先级 |
| `per_run_limit` | 单次采集条数 |
| `collect_interval_hours` | 采集间隔 |
| `last_collected_at` | 上次采集时间 |

### comments

用于痛点、情绪、风险预警。

| 字段 | 说明 | 来源 |
|---|---|---|
| `comment_id` | 内部评论 ID | 自研生成 |
| `content_id` | 内容 ID | 自研关联 |
| `platform` | 平台 | TikHub |
| `text` | 评论文本 | TikHub |
| `like_count` | 评论点赞 | TikHub |
| `created_at` | 评论时间 | TikHub/采集时间 |
| `sentiment` | 正面/中性/负面 | AI/规则 |
| `pain_point` | 用户痛点标签 | AI/词库 |
| `risk_tag` | 风险标签 | AI/词库 |

### creators

用于达人匹配、账号画像。

| 字段 | 说明 | 来源 |
|---|---|---|
| `creator_id` | 内部达人 ID | 自研生成 |
| `platform` | 平台 | TikHub |
| `source_author_id` | 平台作者 ID | TikHub |
| `author_name` | 作者名 | TikHub |
| `follower_count` | 粉丝数 | TikHub，按平台能力 |
| `category` | 账号领域 | AI/规则/人工 |
| `content_tags` | 内容标签 | AI/规则 |
| `avg_engagement` | 平均互动 | 自研计算 |
| `best_topics` | 历史高表现话题 | 自研计算 |

## 达人创作版映射

### 顶部指标

| 页面字段 | 数据来源 | 处理方式 |
|---|---|---|
| 今日可追热点 | 抖音热点、抖音创作者热点、小红书搜索、微博热搜、B站热门 | 多源去重后计数 |
| 账号匹配机会 | 热点池 + 当前达人账号标签 | 自研 `match_score` |
| 高潜选题 | 热点池 + 低竞争/高增长内容 | 自研筛选 |
| 已过热提醒 | 多日趋势 | 自研 `stage` 判断 |

### 适合我的热点趋势

| 页面字段 | TikHub 数据 | 自研处理 |
|---|---|---|
| 分类曲线 | 抖音指数/热点、小红书搜索样本、微博热搜、B站热门 | 按品类聚合，归一化到 0-100 |
| 刚升温/爆发中/长尾可做/已过热 | 多日热度变化 | 规则计算 |

### 热点匹配度排行

| 页面字段 | 来源 | 处理方式 |
|---|---|---|
| 话题 | TikHub 热点/搜索 |
| 热度 | TikHub 原始热度 + 内容互动 |
| 匹配度 | 达人标签 + 历史内容表现 + 话题标签 |
| 竞争度 | 同话题内容数、达人数量、头部账号占比 |
| 创作难度 | 内容形式、素材要求、制作复杂度 |
| 主要平台 | 话题出现平台 |
| 建议 | 根据 stage/match/competition 生成 |

### AI 选题推荐

TikHub 提供：

- 热点话题
- 相关内容
- 爆款视频/笔记
- 评论需求

自研/AI 生成：

- 推荐标题
- 推荐理由
- 适合账号标签
- 脚本结构
- 预计热度

### 爆款案例拆解

TikHub 提供：

- 内容详情
- 互动数据
- 评论

自研/AI 生成：

- Hook 形式
- 开场结构
- 视频节奏
- 评论需求
- 可复用模板

## 品牌洞察版映射

### 顶部指标

| 页面字段 | 数据来源 | 处理方式 |
|---|---|---|
| 品牌声量 | 品牌词搜索结果内容数 + 互动量 | 多平台聚合 |
| 互动总量 | 内容详情互动字段 | 多平台求和 |
| 正面情绪 | 评论/正文 | AI 情绪分析 |
| 负面预警 | 评论负面词、风险词、增长异常 | 规则 + AI |
| 竞品超越词 | 品牌词 vs 竞品词趋势对比 | 自研计算 |

### 品牌关键词趋势

| 曲线 | 关键词来源 | 数据来源 |
|---|---|---|
| 品牌词 | 品牌词库 | 抖音指数、搜索样本、评论/内容声量 |
| 品类词 | 品类词库 | 抖音指数、小红书/微博/B站搜索 |
| 竞品词 | 竞品词库 | 同上 |
| 卖点词 | 卖点词库 | 同上 |

### 竞品声量排行

TikHub 获取：

- 竞品关键词内容列表
- 内容互动
- 平台分布

自研计算：

- 声量占比
- 增长率
- 正面情绪
- 主导话题

### 用户痛点与购买顾虑

TikHub 获取：

- 内容评论
- 内容正文

AI/词库生成：

- 痛点词
- 讨论量
- 情绪倾向
- 典型原声示例

### 投放机会建议

需要自研/AI 生成：

- 内容形式建议
- 达人类型建议
- 优先平台
- 核心切入角度

输入数据：

- 热点趋势
- 竞品声量
- 用户痛点
- 达人内容表现

### 风险预警

规则建议：

- 负面词 24 小时增长超过阈值。
- 竞品声量连续 N 天超过本品牌。
- 某个风险词进入高热内容评论。
- 品牌词正面情绪连续下降。

## TikHub 接口试调用清单

第一轮不要全量接入，只验证这些能力。

### 抖音

- 热点榜/热搜榜
- 创作者热点
- 抖音指数/关键词趋势
- 关键词搜索视频
- 视频详情
- 视频评论
- 达人/创作者信息

### 小红书

- 搜索笔记
- 笔记详情
- 笔记评论
- 用户信息
- 用户笔记列表
- 热门关键词/趋势词，如果接口可用

### 微博

- 热搜榜
- 关键词搜索
- 微博详情
- 评论

### B站

- 搜索视频
- 热门视频
- 视频详情
- 评论/弹幕，如果接口可用

## 第一版采集策略

范围：

- 行业：美妆个护
- 平台：抖音、小红书、微博、B站
- 品牌词：3-5 个
- 竞品词：5 个
- 品类词：20 个
- 卖点词：30 个
- 达人账号：50-100 个

频率：

- 热点榜：每天 2-4 次
- 关键词搜索：每天 1 次
- 内容详情快照：每天 1 次
- 评论：只采高热内容，每条 20-100 条
- 账号主页：每天/每周 1 次

样本量：

- 内容：1000-3000 条/天
- 评论：5000-20000 条/天

## 第一版接口输出

页面不要直接调用 TikHub，先调用我们自己的 API。

达人端：

```text
GET /api/creator/trends/overview
GET /api/creator/trends/series
GET /api/creator/trends/topics
GET /api/creator/trends/recommendations
GET /api/creator/trends/cases
```

品牌端：

```text
GET /api/brand/insights/overview
GET /api/brand/insights/trends
GET /api/brand/insights/competitors
GET /api/brand/insights/pain-points
GET /api/brand/insights/opportunities
GET /api/brand/insights/alerts
```

## 已落地的第一版代码结构

环境变量：

```text
TIKHUB_API_KEY=""
TIKHUB_BASE_URL="https://api.tikhub.io"
INSIGHTS_INTERNAL_TOKEN="replace-with-a-long-random-token"
```

核心代码：

```text
src/lib/tikhub/client.ts
src/lib/tikhub/endpoints.ts
src/lib/tikhub/mappers.ts
src/lib/insights/scoring.ts
src/lib/insights/collector.ts
src/lib/insights/snapshots.ts
src/lib/insights/queries.ts
```

采集与快照：

```text
POST /api/internal/insights/collect

{ "type": "search_contents", "endpoint": "xiaohongshuSearchNotes", "platform": "xiaohongshu", "keyword": "防晒", "limit": 10 }
```

关键词内容采集成功后会自动更新当天趋势快照。已有内容可用以下任务回填：

```text
{ "type": "rebuild_snapshots" }
```

批量采集关键词：

```text
{ "type": "keyword_batch", "endpoint": "xiaohongshuSearchNotes", "platform": "xiaohongshu", "keywords": ["防晒", "底妆", "敏感肌", "油皮", "持妆"], "limit": 5 }
```

初始化默认关键词池：

```text
{ "type": "seed_keywords" }
```

采集到期关键词，适合交给服务器 cron 每天调用：

```text
{ "type": "configured_keywords", "limit": 20 }
```

本地脚本：

```text
npx tsx scripts/insights-smoke-test.ts seed-keywords
npx tsx scripts/insights-smoke-test.ts configured 5
npx tsx scripts/insights-smoke-test.ts snapshots
npx tsx scripts/insights-smoke-test.ts batch 防晒,底妆,敏感肌,油皮,持妆
```

内部采集入口：

```text
POST /api/internal/insights/collect
Authorization: Bearer <INSIGHTS_INTERNAL_TOKEN>
```

采集热点示例：

```json
{
  "type": "hot_topics",
  "endpoint": "douyinHotTopics",
  "platform": "douyin"
}
```

采集关键词内容示例：

```json
{
  "type": "search_contents",
  "endpoint": "xiaohongshuSearchNotes",
  "platform": "xiaohongshu",
  "keyword": "防晒",
  "limit": 20
}
```

已落地页面 API：

```text
GET /api/creator/trends/overview
GET /api/creator/trends/topics
GET /api/brand/insights/overview
GET /api/brand/insights/competitors
```

注意：

- 当前页面仍保留 mock 展示，避免没有 TikHub key 或没有采集数据时页面空白。
- 采集入口会在缺少 `TIKHUB_API_KEY` 时返回失败，并记录 `InsightCollectionRun`。
- TikHub 具体接口参数可能需要根据真实试调用微调，统一改 `src/lib/tikhub/endpoints.ts` 和 collector query 参数即可。

## 判断是否够用

TikHub 第一版可支撑：

- 热点榜
- 关键词搜索
- 内容详情
- 评论采样
- 多平台内容声量
- 达人内容样本
- 爆款案例数据

需要自研/AI 的能力：

- 情绪分析
- 痛点归类
- 热度分
- 增长率
- 匹配度
- 竞争度
- 创作难度
- 选题推荐
- 投放建议
- 品牌报告

结论：

TikHub 可以作为 MVP 的主数据源。第一版先验证数据字段和稳定性，再决定是否补充 DataStory、脉讯、集瓜等企业级数据源。
