# 🆓 免费部署指南：Vercel + Supabase + GitHub Actions

## 📋 方案说明

| 服务 | 用途 | 免费额度 | 注册链接 |
|------|------|----------|----------|
| **Vercel** | 托管 Next.js 应用 | 100GB 流量/月 | [vercel.com](https://vercel.com) |
| **Supabase** | PostgreSQL 数据库 | 500MB 存储 | [supabase.com](https://supabase.com) |
| **GitHub Actions** | 定时任务 | 2000 分钟/月 | [github.com](https://github.com) |

**总成本：¥0/月** ✅

---

## 步骤 1: 注册 Supabase 并创建数据库

### 1.1 注册 Supabase

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录

### 1.2 创建项目

1. 点击 "New project"
2. 填写项目信息：
   - **Name**: `playbook-radar`
   - **Database password**: 生成强密码（**保存好！**）
   - **Region**: 选择最近的（推荐 `Tokyo` 或 `Singapore`）
3. 点击 "Create new project"

等待 2-3 分钟，项目创建完成。

### 1.3 获取数据库连接字符串

1. 进入项目 Dashboard
2. 点击左侧 "Settings" (齿轮图标)
3. 点击 "Database"
4. 复制 **Connection string** (Pooler 模式)

格式类似：
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 1.4 执行数据库 Schema

1. 点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase-schema.sql` 的全部内容
4. 粘贴到编辑器
5. 点击 "Run" 执行

**验证：** 看到 "Success. No rows returned" 说明成功。

### 1.5 获取 API Key

1. 点击左侧 "Settings"
2. 点击 "API"
3. 复制 **project URL** 和 **anon public** key

保存以下信息：
```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_KEY=eyJhbGc...（anon public key）
DATABASE_URL=postgresql://...（连接字符串）
```

---

## 步骤 2: 部署到 Vercel

### 2.1 推送代码到 GitHub

```bash
# 在本地项目目录执行
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit for Vercel deployment"

# 创建 GitHub 仓库（在 github.com 新建）
# 然后关联远程仓库
git remote add origin https://github.com/your-username/playbook-radar.git
git push -u origin main
```

### 2.2 连接 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "Add New..." -> "Project"
4. 选择 `playbook-radar` 仓库
5. 点击 "Import"

### 2.3 配置环境变量

在 Vercel 部署页面，添加以下环境变量：

| Name | Value |
|------|-------|
| `DATABASE_URL` | Supabase 连接字符串 |
| `API_KEY` | 你的 AI API Key |
| `API_BASE_URL` | `http://1.95.142.151:3000/v1` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | 你的域名（可选） |
| `NEXT_PUBLIC_PLAUSIBLE_URL` | `https://plausible.io/js/script.js` |

### 2.4 开始部署

1. 点击 "Deploy"
2. 等待 3-5 分钟
3. 看到 "Congratulations!" 说明部署成功

**访问地址：** `https://playbook-radar-[random].vercel.app`

---

## 步骤 3: 配置 GitHub Actions 定时任务

### 3.1 添加 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 "Settings"
3. 点击左侧 "Secrets and variables" -> "Actions"
4. 点击 "New repository secret"

添加以下 Secrets：

| Name | Value |
|------|-------|
| `DATABASE_URL` | Supabase 连接字符串 |
| `API_KEY` | 你的 AI API Key |
| `API_BASE_URL` | `http://1.95.142.151:3000/v1` |
| `SUPABASE_URL` | `https://[project-ref].supabase.co` |
| `SUPABASE_KEY` | Supabase anon key |

### 3.2 启用 Workflow

1. 点击左侧 "Actions"
2. 看到 "I understand my workflows, go ahead and enable them"
3. 点击确认

### 3.3 手动触发测试

1. 在 Actions 页面选择 "Playbook Radar - 自动采集"
2. 点击 "Run workflow"
3. 选择任务类型（fetch / analyze / digest）
4. 点击 "Run workflow"

**等待 2-5 分钟，查看运行日志。**

---

## 步骤 4: 配置自定义域名（可选）

### 4.1 在 Vercel 添加域名

1. 进入 Vercel Dashboard
2. 选择 `playbook-radar` 项目
3. 点击 "Settings" -> "Domains"
4. 添加你的域名（如 `playbook-radar.com`）

### 4.2 配置 DNS

在域名管理后台添加：

```
类型：A
主机记录：@
记录值：76.76.21.21
TTL：600

类型：CNAME
主机记录：www
记录值：cname.vercel-dns.com
TTL：600
```

### 4.3 启用 HTTPS

Vercel 自动配置 SSL 证书，等待 5-10 分钟即可通过 HTTPS 访问。

---

## 步骤 5: 验证部署

### 5.1 访问网站

```bash
# Vercel 分配的域名
https://playbook-radar-[random].vercel.app

# 或自定义域名
https://your-domain.com
```

### 5.2 测试页面

- [ ] 首页 `/` - 加载正常
- [ ] 精选 `/featured` - 数据正常
- [ ] 趋势 `/trending` - 数据正常
- [ ] 专题 `/topics` - 标签正常
- [ ] 后台 `/admin` - 可以访问

### 5.3 测试 API

```bash
curl https://your-vercel-app.vercel.app/api/items?limit=1
```

应该返回 JSON 数据。

### 5.4 检查数据库

在 Supabase Dashboard：
1. 点击 "Table Editor"
2. 查看 `Item` 表
3. 确认有数据

---

## 📊 监控和维护

### Vercel 监控

1. 进入 Vercel Dashboard
2. 选择项目
3. 查看 "Analytics" 标签

### GitHub Actions 日志

1. 进入 GitHub 仓库
2. 点击 "Actions"
3. 选择工作流查看运行日志

### 查看采集日志

```bash
# 在 GitHub Actions 中查看
# Actions -> 选择运行 -> 查看日志
```

### 手动触发任务

```bash
# GitHub Actions -> Run workflow
# 选择任务类型：
# - fetch: 采集内容
# - analyze: AI 分析
# - digest: 生成日报
```

---

## 🔧 更新部署

```bash
# 本地修改代码后
git add .
git commit -m "Update: 修改内容"
git push

# Vercel 会自动重新部署
# 等待 2-3 分钟即可
```

---

## ⚠️ 注意事项

### 免费额度限制

| 服务 | 限制 | 超出后 |
|------|------|--------|
| Vercel | 100GB/月 | 升级或暂停 |
| Supabase | 500MB | 升级 $25/月 |
| GitHub Actions | 2000 分钟/月 | 下月恢复 |

### 优化建议

1. **减少采集频率**：改为每天 2 次而非每 6 小时
2. **限制 AI 分析数量**：每次分析 10 条而非 50 条
3. **清理旧数据**：定期删除 30 天前的内容

### 数据库优化

```sql
-- 在 Supabase SQL Editor 执行
-- 清理 30 天前的内容
DELETE FROM "Item" 
WHERE "publishedAt" < NOW() - INTERVAL '30 days'
AND status != 'PUBLISHED';
```

---

## 🆘 故障排查

### 部署失败

```bash
# 查看 Vercel 部署日志
# Vercel Dashboard -> Deployments -> 选择部署 -> 查看日志

# 常见错误：
# 1. 数据库连接失败 -> 检查 DATABASE_URL
# 2. 构建失败 -> 查看构建日志
# 3. 环境变量缺失 -> 检查 Vercel 环境变量配置
```

### GitHub Actions 失败

```bash
# 查看 Actions 日志
# GitHub -> Actions -> 选择运行 -> 查看日志

# 常见错误：
# 1. Secrets 未配置 -> 检查 Secrets
# 2. 超时 -> 减少 ANALYZE_LIMIT
# 3. API 错误 -> 检查 API_KEY
```

### 数据库连接失败

```bash
# 检查 Supabase 状态
# Supabase Dashboard -> Settings -> Database

# 验证连接字符串格式
# postgresql://postgres.[ref]:[password]@[host]:6543/postgres?pgbouncer=true
```

---

## 📋 部署检查清单

- [ ] Supabase 账号注册
- [ ] Supabase 项目创建
- [ ] 数据库 Schema 执行
- [ ] 获取 DATABASE_URL
- [ ] GitHub 仓库创建
- [ ] 代码推送到 GitHub
- [ ] Vercel 账号注册
- [ ] Vercel 项目导入
- [ ] Vercel 环境变量配置
- [ ] 部署成功
- [ ] GitHub Secrets 配置
- [ ] GitHub Actions 启用
- [ ] 手动触发测试
- [ ] 网站访问正常
- [ ] API 测试正常
- [ ] （可选）自定义域名配置

---

## 📞 完成！

**访问地址：**
- Vercel: `https://playbook-radar.vercel.app`
- 自定义域名：`https://your-domain.com`

**管理面板：**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub Actions: https://github.com/your-username/playbook-radar/actions

**文档位置：**
- `vercel.json` - Vercel 配置
- `.github/workflows/auto-tasks.yml` - GitHub Actions
- `supabase-schema.sql` - 数据库 Schema

---

**部署完成！开始使用免费方案运行 Playbook Radar 吧！🎉**
