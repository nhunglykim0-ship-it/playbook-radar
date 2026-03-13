# 🆓 免费部署 - 快速开始

## 30 分钟完成部署

### 第 1 步：注册 Supabase (5 分钟)

```
1. 访问 https://supabase.com
2. GitHub 登录
3. New Project
   - Name: playbook-radar
   - 密码：保存好！
   - Region: Tokyo
4. 等待创建完成
```

### 第 2 步：配置数据库 (5 分钟)

```
1. Settings -> Database
2. 复制 Connection string (Pooler 模式)
3. SQL Editor -> New query
4. 粘贴 supabase-schema.sql 内容
5. Run 执行
```

### 第 3 步：推送代码到 GitHub (5 分钟)

```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

git init
git add .
git commit -m "Deploy to Vercel"

# 在 github.com 新建仓库
git remote add origin https://github.com/your-username/playbook-radar.git
git push -u origin main
```

### 第 4 步：部署到 Vercel (10 分钟)

```
1. 访问 https://vercel.com
2. GitHub 登录
3. Add New -> Project
4. 选择 playbook-radar 仓库
5. Import

6. 添加环境变量：
   DATABASE_URL=postgresql://...（从 Supabase 复制）
   API_KEY=your-api-key
   API_BASE_URL=http://1.95.142.151:3000/v1

7. Deploy
8. 等待部署完成
```

### 第 5 步：配置 GitHub Actions (5 分钟)

```
1. GitHub 仓库 -> Settings
2. Secrets and variables -> Actions
3. New repository secret

添加：
- DATABASE_URL
- API_KEY
- API_BASE_URL

4. Actions -> 启用 Workflow
5. Run workflow 测试
```

---

## ✅ 验证

```bash
# 访问 Vercel 分配的域名
https://playbook-radar-[random].vercel.app

# 测试页面
/
/featured
/trending
/topics

# 测试 API
curl https://your-app.vercel.app/api/items?limit=1
```

---

## 📊 环境变量清单

**Vercel:**
```
DATABASE_URL=postgresql://...
API_KEY=your-api-key
API_BASE_URL=http://1.95.142.151:3000/v1
```

**GitHub Secrets:**
```
DATABASE_URL=postgresql://...
API_KEY=your-api-key
API_BASE_URL=http://1.95.142.151:3000/v1
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_KEY=eyJhbGc...
```

---

## 🔧 常用操作

### 查看部署状态
```
Vercel Dashboard -> Deployments
```

### 查看定时任务
```
GitHub -> Actions -> 选择工作流
```

### 手动触发采集
```
GitHub Actions -> Run workflow -> 选择 fetch
```

### 更新代码
```bash
git add .
git commit -m "Update"
git push
# Vercel 自动重新部署
```

---

## 📋 检查清单

- [ ] Supabase 注册完成
- [ ] 数据库创建完成
- [ ] Schema 执行成功
- [ ] GitHub 仓库创建
- [ ] 代码推送成功
- [ ] Vercel 部署成功
- [ ] 环境变量配置
- [ ] GitHub Secrets 配置
- [ ] Actions 启用
- [ ] 网站访问正常

---

**完成！开始使用吧！🎉**
