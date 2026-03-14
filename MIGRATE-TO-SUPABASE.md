# 迁移到 Supabase Postgres

## 为什么需要迁移

当前使用 SQLite (`prisma/dev.db`)，在 Vercel Serverless 环境中：
- 每次请求可能在不同容器
- 文件写入会丢失
- 数据无法持久化

## 步骤

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com
2. 创建新项目
3. 获取数据库连接串

### 2. 获取 DATABASE_URL

在 Supabase Dashboard:
```
Settings → Database → Connection string → URI
格式：postgresql://postgres.xxx:password@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. 更新 Vercel 环境变量

访问 Vercel Dashboard → Project Settings → Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://...` (你的 Supabase 连接串) |

### 4. 切换 Prisma Schema

```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 备份当前 SQLite 数据（可选）
cp prisma/dev.db prisma/dev.db.backup

# 使用 Supabase Schema
cp prisma/schema.supabase.prisma prisma/schema.prisma
```

### 5. 推送数据库结构

```bash
# 本地测试（需要设置 DATABASE_URL）
export DATABASE_URL="postgresql://..."
npx prisma db push
```

### 6. 重新部署 Vercel

```bash
git add prisma/schema.prisma
git commit -m "migrate to supabase postgres"
git push origin main
```

Vercel 会自动重新部署。

### 7. 迁移现有数据（可选）

如果有现有数据需要迁移：

```bash
# 导出 SQLite 数据
npx prisma db seed

# 或手动导入
# 使用 Supabase SQL Editor 执行 INSERT
```

---

## 验证

部署完成后测试：

```bash
# 测试 API
curl https://playbook-radar.vercel.app/api/items

# 检查数据库连接
# 访问 Vercel Logs 查看是否有 Prisma 错误
```

---

## 费用

Supabase 免费层：
- 500MB 数据库
- 50,000 月活用户
- 足够个人项目使用
