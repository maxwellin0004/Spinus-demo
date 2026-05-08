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
- Python 3，仅用于 `tanglin-crawler`

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

`DATABASE_URL` 说明：

- `postgres`：数据库用户名。
- `你的密码`：PostgreSQL 安装时设置的密码。
- `localhost:5432`：本机 PostgreSQL 地址和端口。
- `tanglin_rd`：本项目使用的数据库名。
- `schema=public`：PostgreSQL 默认 schema。

## 6. 数据库配置与初始化

### 6.1 确认 PostgreSQL 可用

确认 PostgreSQL 服务已启动。Windows 上可以在“服务”里查看 `postgresql` 服务，也可以使用 pgAdmin 连接本机数据库。

如果 `psql` 已加入 PATH，可以执行：

```powershell
psql --version
```

如果没有 `psql`，也可以继续使用 pgAdmin 创建数据库，不影响项目运行。

### 6.2 创建数据库

数据库名建议固定为：

```text
tanglin_rd
```

使用 pgAdmin 创建：

1. 打开 pgAdmin。
2. 连接本机 PostgreSQL。
3. 右键 `Databases`。
4. 选择 `Create` -> `Database`。
5. Database 填写 `tanglin_rd`。
6. Owner 选择 `postgres`。
7. 保存。

如果可以使用命令行，也可以执行：

```powershell
createdb -U postgres tanglin_rd
```

### 6.3 配置 `.env`

在 `tanglin/.env` 写入真实数据库连接：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/tanglin_rd?schema=public
```

如果密码里包含特殊字符，例如 `@`、`#`、`%`、空格，需要 URL encode。常见例子：

```text
@  -> %40
#  -> %23
%  -> %25
空格 -> %20
```

### 6.4 安装依赖

```powershell
cd D:\program\ai_video\workflow\tanglin
npm install
```

### 6.5 执行数据库迁移

第一次部署或拉取已有 migration 后，推荐执行：

```powershell
npx prisma migrate deploy
```

本地开发新增 schema 变更时，使用：

```powershell
npx prisma migrate dev
```

生成 Prisma Client：

```powershell
npx prisma generate
```

### 6.6 写入测试数据

```powershell
npm run prisma:seed
```

Seed 会创建测试账号、品牌、KOL、Campaign、任务、钱包、报表等演示数据。

测试账号：

```text
admin@test.com / password123
brand@test.com / password123
creator@test.com / password123
```

### 6.7 检查数据库结构

验证 Prisma schema：

```powershell
npx prisma validate
```

打开 Prisma Studio 查看数据：

```powershell
npx prisma studio
```

### 6.8 重置本地数据库

如果本地数据乱了，可以重置数据库并重新执行 seed：

```powershell
npm run db:reset
```

注意：这个命令会清空本地数据库数据，只适合开发环境。

### 6.9 常见数据库问题

**连接失败**

检查：

- PostgreSQL 服务是否启动。
- `.env` 中 `DATABASE_URL` 密码是否正确。
- 数据库 `tanglin_rd` 是否已经创建。
- 端口是否为 `5432`。

**Prisma 提示找不到表**

执行：

```powershell
npx prisma migrate deploy
npx prisma generate
```

**Seed 失败**

先确认 migration 已执行，再运行：

```powershell
npm run prisma:seed
```

如果仍失败，通常是旧数据和唯一字段冲突。开发环境可以使用：

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

## 8. Just One API 数据核验

当前 crawler worker 优先使用 Just One API：

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

## 9. 主要页面入口

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

## 10. 常用验证命令

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

## 11. Git 提交建议

查看当前分支：

```powershell
git branch --show-current
```

查看改动：

```powershell
git status
git diff --cached --name-only
```

提交：

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

## 12. 项目文档

详细中文文档在 `docs/`：

- `docs/TANGLIN_V1_PRODUCT_DESIGN.md`
- `docs/TANGLIN_V1_IMPLEMENTATION_PLAN.md`
- `docs/TANGLIN_V1_DEVELOPMENT_GUIDE.md`
- `docs/TANGLIN_V1_USER_OPERATION_GUIDE.md`
- `docs/TANGLIN_V1_CRAWLER_DESIGN.md`
- `docs/TANGLIN_V1_FINANCE_WALLET_DESIGN.md`
