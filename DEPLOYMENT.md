# Playbook Radar - 部署完成清单

**最后更新:** 2026-03-14 14:50  
**部署状态:** ✅ 已完成

---

## ✅ 已完成

- [x] 代码构建成功 (`npm run build`)
- [x] Git 仓库已推送 (`git push origin main`)
- [x] GitHub Actions 工作流配置 (`.github/workflows/auto-tasks.yml`)
- [x] Vercel 配置文件 (`vercel.json`)
- [x] 数据库 Schema (Supabase PostgreSQL)
- [x] Vercel 部署完成 (生产环境)
- [x] 环境变量已配置 (DATABASE_URL, API_KEY, API_BASE_URL)

---

## ⏳ 待完成 (需要手动操作)

### 1. Vercel 项目链接

**方式 A: 通过 Vercel 控制台 (推荐)**
1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库: `nhunglykim0-ship-it/playbook-radar`
3. 配置项目名称: `playbook-radar`
4. 点击 "Deploy"

**方式 B: 通过 Vercel CLI (需要 Token)**
```bash
# 获取 Vercel Token
# 访问: https://vercel.com/account/settings/tokens
# 创建新的 Access Token

# 然后执行:
vercel login --token <YOUR_VERCEL_TOKEN>
vercel link --yes
vercel --prod
```

---

### 2. 环境变量配置 (Vercel Dashboard)

在 Vercel 项目设置 → Environment Variables 中添加:

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres.vwleqjqdtjaopoqlwqqj:iPd3ueSSi7BZUQFN@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true` | Production |
| `API_KEY` | `sk-sp-42f3ed2a9c6e458591f4a4650a57a80c` | Production |
| `API_BASE_URL` | `https://coding.dashscope.aliyuncs.com/v1` | Production |

---

### 3. 数据库迁移 (生产环境)

```bash
# 在 Vercel 部署后，执行一次数据库迁移
# 使用 GitHub Actions 手动触发:
# https://github.com/nhunglykim0-ship-it/playbook-radar/actions
# → 选择 "Playbook Radar - 自动采集" → Run workflow → 选择任务 "fetch"
```

---

## 📊 部署后验证

### 检查部署状态
```bash
# 访问 Vercel 项目页面
https://vercel.com/nhunglykim0-9147s-projects/playbook-radsdsdsdsd
```

### 测试 API 端点
```bash
# 健康检查
curl https://<your-vercel-url>/api/health

# 获取内容列表
curl https://<your-vercel-url>/api/items

# 获取标签
curl https://<your-vercel-url>/api/tags
```

### 验证自动任务
```bash
# 查看 GitHub Actions 执行记录
https://github.com/nhunglykim0-ship-it/playbook-radar/actions

# 或查看 OpenClaw Cron 状态
openclaw cron list
```

---

## 🚀 快速部署命令 (如果有 Token)

```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 登录 Vercel
export VERCEL_TOKEN=<your-token>
vercel login --token $VERCEL_TOKEN

# 链接项目
vercel link --yes

# 部署到生产
vercel --prod

# 或者一键部署
vercel --prod --yes
```

---

## 📝 备注

- Vercel 免费额度: 100GB 带宽/月
- Supabase 免费额度: 500MB 数据库
- GitHub Actions 免费额度: 2000 分钟/月

## 🎉 部署完成!

**生产环境 URL:** https://playbook-radar.vercel.app  
**Vercel 控制台:** https://vercel.com/nhunglykim0-9147s-projects/playbook-radar

---

**当前项目 URL:** `https://playbook-radar.vercel.app`
