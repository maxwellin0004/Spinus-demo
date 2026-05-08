# Tanglin KOL 投放平台

Tanglin 是一个面向品牌方、KOL 创作者和平台运营 Admin 的自助投放协作系统。第一版重点支持品牌方发布 Campaign、KOL 自由申请任务、内容草稿审核、发布链接验收、资金托管、钱包结算、争议处理、报表导出，以及小红书/抖音作品数据辅助核验。

## 1. 角色与核心流程

### 品牌方 Brand

- 创建工作台和品牌资料。
- 使用 Campaign 创建向导发布推广任务。
- 按平台分别配置人数、奖励、最低粉丝数、内容形式和截止时间。
- 选择是否需要 KOL 先提交内容草稿。
- 托管 Campaign 总预算后发布任务。
- 审核 KOL 申请。
- 审核内容草稿，最多 2 轮修改。
- 验收 KOL 提交的发布链接。
- 查看 Campaign 报表和财务流水 CSV。

### KOL / Creator

- 注册创作者账号。
- 维护个人资料和社媒账号。
- 绑定小红书、抖音、视频号、B站、微博账号。
- 在任务大厅申请 Campaign 任务。
- 被通过后提交内容草稿或直接进入发布阶段。
- 发布后提交作品链接。
- 查看作品数据核验结果。
- 任务验收后获得钱包收入。
- 提交提现申请。

### Admin

- 管理品牌、创作者、Campaign、内容、发布证明、付款、提现、争议和合规规则。
- 审核社媒账号真实性。
- 查看 crawler 服务状态和抓取队列。
- 在争议处理中查看结构化证据、作品链接和抓取快照。
- 手动执行部分结算。

## 2. 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Tailwind CSS 4
- JWT Cookie Session
- Just One API，用于小红书/抖音数据核验
- 独立 Python crawler worker

## 3. 目录结构

```text
tanglin/
  src/app/                  Next.js 页面、API 路由、CSV 导出
  src/components/           通用 UI、Shell、Campaign Wizard、报表组件
  src/lib/                  Server Actions、认证、权限、crawler、财务、格式化
  prisma/                   Prisma schema、migration、seed
  docs/                     中文产品设计、开发文档、操作文档
  scripts/                  回归检查、测试数据脚本

../tanglin-crawler/
  worker.py                 独立 crawler worker
  providers.py              mock / Just One API / MediaCrawler provider
  config.py                 worker 配置读取
  MEDIACRAWLER_ADAPTER.md   MediaCrawler 接入说明
```

## 4. 环境要求

- Node.js
- npm
- PostgreSQL
- Python 3，用于 `tanglin-crawler`

本地数据库示例：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/tanglin_rd?schema=public
```

## 5. 环境变量

在 `tanglin/.env` 中配置：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/tanglin_rd?schema=public
AUTH_SECRET=local-dev-secret-change-me
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=

CRAWLER_INTERNAL_TOKEN=your-internal-token
CRAWLER_WORKER_HEALTH_URL=http://127.0.0.1:8787/health
```

在 `../tanglin-crawler/.env` 中配置：

```env
TANGLIN_BASE_URL=http://127.0.0.1:3000
CRAWLER_INTERNAL_TOKEN=your-internal-token
CRAWLER_WORKER_ID=tanglin-crawler-local
CRAWLER_WORKER_PORT=8787
CRAWLER_POLL_INTERVAL_SECONDS=2
CRAWLER_MOCK_MODE=false
CRAWLER_PROVIDER=justone

JUSTONE_BASE_URL=https://api.justoneapi.com
JUSTONE_API_KEY=your-api-key
JUSTONE_TIMEOUT_SECONDS=90

MEDIACRAWLER_COMMAND=python D:\program\ai_video\workflow\tanglin-crawler\mediacrawler_adapter.py
MEDIACRAWLER_TIMEOUT_SECONDS=120
MEDIACRAWLER_ROOT=D:\program\ai_video\workflow\MediaCrawler
MEDIACRAWLER_PYTHON=python
MEDIACRAWLER_LOGIN_TYPE=qrcode
MEDIACRAWLER_HEADLESS=false
MEDIACRAWLER_ADAPTER_TIMEOUT_SECONDS=300
```

`CRAWLER_INTERNAL_TOKEN` 必须和主站一致。

## 6. 安装与数据库初始化

进入主站目录：

```powershell
cd D:\program\ai_video\workflow\tanglin
npm install
```

创建数据库后执行：

```powershell
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed
```

开发期间如果需要重置数据库：

```powershell
npm run db:reset
```

## 7. 启动主站

默认端口：

```powershell
cd D:\program\ai_video\workflow\tanglin
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

如果 3000 被占用，可以换端口：

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3001
```

访问：

```text
http://127.0.0.1:3000
```

## 8. 启动 Crawler Worker

进入 worker 目录：

```powershell
cd D:\program\ai_video\workflow\tanglin-crawler
python .\worker.py
```

健康检查：

```text
http://127.0.0.1:8787/health
```

单次处理一个任务：

```powershell
python .\worker.py --once
```

## 9. Just One API 数据核验

当前 worker 优先使用 Just One API：

```env
CRAWLER_PROVIDER=justone
```

作品链接抓取时机：

- KOL 提交发布链接后自动创建抓取任务。
- 商家在验收页点击“刷新作品数据”后创建刷新任务。
- Admin 可在 crawler 页面查看任务队列和状态。

目前已验证：

- 抖音短链会先解析跳转后的真实 `videoId`，再调用视频详情接口。
- 小红书链接会提取 `noteId`，再调用笔记详情接口。
- 可获取点赞、收藏、评论、分享、作者昵称、作者平台 ID。
- 部分平台或接口可能返回 `viewCount = 0`，不能把浏览量视为稳定数据源。

前端查看位置：

- 品牌方：`/brand/campaigns/[campaignId]/proofs`
- KOL：`/creator/my-tasks/[applicationId]`
- Admin：`/admin/proofs`
- 抓取队列：`/admin/crawler`

## 10. 测试账号

Seed 后可使用：

```text
admin@test.com / password123
brand@test.com / password123
creator@test.com / password123
```

也可以通过注册页创建新账号。

## 11. 主要页面入口

### 品牌方

```text
/brand
/brand/profile
/brand/campaigns
/brand/campaigns/new
/brand/campaigns/[id]
/brand/campaigns/[id]/submissions
/brand/campaigns/[id]/proofs
/brand/campaigns/[id]/reports
/brand/billing
```

### KOL

```text
/creator
/creator/profile
/creator/marketplace
/creator/my-tasks
/creator/my-tasks/[id]
/creator/content-studio/[applicationId]
/creator/wallet
```

### Admin

```text
/admin
/admin/campaigns
/admin/submissions
/admin/proofs
/admin/social-accounts
/admin/crawler
/admin/disputes
/admin/payments
/admin/reports
/admin/settings
```

## 12. 常用验证命令

```powershell
cd D:\program\ai_video\workflow\tanglin
npx prisma validate
npm run build
```

财务相关回归脚本：

```powershell
npm run finance:check
npm run finance:audit
```

Crawler Python 语法检查：

```powershell
cd D:\program\ai_video\workflow\tanglin-crawler
python -m py_compile .\config.py .\providers.py .\worker.py .\mediacrawler_adapter.py
```

## 13. Git 提交建议

查看当前分支：

```powershell
git branch --show-current
```

查看改动：

```powershell
git status
git diff --cached --name-only
```

提交主站和 worker：

```powershell
git add .
git commit -m "feat: add Tanglin campaign and crawler verification"
git push origin 当前分支名
```

如果不希望提交真实环境变量，应确保 `.env` 没有进入暂存区：

```powershell
git restore --staged .env
git restore --staged ../tanglin-crawler/.env
```

`MediaCrawler/` 是第三方项目源码，通常不建议直接提交进本仓库。如果需要保留接入说明，提交 `tanglin-crawler/MEDIACRAWLER_ADAPTER.md` 即可。

## 14. 项目文档

详细中文文档在 `docs/`：

- `docs/TANGLIN_V1_PRODUCT_DESIGN.md`
- `docs/TANGLIN_V1_IMPLEMENTATION_PLAN.md`
- `docs/TANGLIN_V1_DEVELOPMENT_GUIDE.md`
- `docs/TANGLIN_V1_USER_OPERATION_GUIDE.md`
- `docs/TANGLIN_V1_CRAWLER_DESIGN.md`
- `docs/TANGLIN_V1_FINANCE_WALLET_DESIGN.md`
