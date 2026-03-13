# Playbook Radar 📡

OpenClaw 玩法情报站 - 发现全球最新玩法、教程和案例

## 快速开始

```bash
npm install
npx prisma db push
npm run dev
# http://localhost:3000 (或 3001)
```

## 数据初始化

```bash
# 生成模拟数据（开发环境）
npx tsx lib/seed-mock.ts

# 真实数据采集（GitHub + RSS）
curl -X POST http://localhost:3000/api/fetch

# 手动测试 GitHub 采集
npx tsx lib/test-github.ts
```

## 采集源配置

### GitHub 仓库
编辑 `lib/github-trending.ts` 中的 `GITHUB_REPOS` 数组。

### RSS 博客
编辑 `lib/rss.ts` 中的 RSS 源列表。

### 采集频率
推荐每 6 小时采集一次（通过 OpenClaw Cron）。

## 功能

- 📺 YouTube 自动采集
- 🐦 X/Twitter 集成
- 📝 官方博客 RSS
- 🤖 自动摘要 + 中文翻译
- 🔥 热度排序
- ✅ 后台审核
- 📊 日报/周报生成

## 配置

编辑 `.env.local`:

```env
DATABASE_URL="file:./prisma/dev.db"
API_KEY=your_api_key
YOUTUBE_API_KEY=your_youtube_key
```

## API

- `GET /api/items` - 获取已发布内容
- `POST /api/fetch` - 触发采集
- `GET /api/admin/items` - 后台列表
- `PATCH /api/admin/items/:id` - 审核操作

## 技术栈

- Next.js 14
- Prisma + SQLite
- Claude API (摘要/翻译)
- Tailwind CSS
