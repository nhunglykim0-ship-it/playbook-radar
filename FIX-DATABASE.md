# 🚨 紧急修复：数据库连接问题

**问题:** 网站显示 "Application error: a client-side exception has occurred"

**原因:** Vercel 环境变量中的 `DATABASE_URL` 指向旧的/不可达的 Supabase 数据库

---

## 🔧 修复步骤（必须手动操作）

### 步骤 1: 登录 Vercel 控制台

访问：https://vercel.com/nhunglykim0-9147s-projects/playbook-radar/settings/environment-variables

### 步骤 2: 更新 DATABASE_URL

找到 `DATABASE_URL` 环境变量，编辑为：

```
postgresql://postgres:NonWet98Oe3giphC@db.zxzqbzurjyjnedpjlqkj.supabase.co:6543/postgres?pgbouncer=true
```

**目标环境:** Production（生产环境）

### 步骤 3: 重新部署

更新环境变量后，Vercel 会自动重新部署。或者手动触发：

1. 访问：https://vercel.com/nhunglykim0-9147s-projects/playbook-radar/deployments
2. 点击 "Redeploy" 按钮

---

## ✅ 验证修复

部署完成后，访问：
- https://playbook-radar.vercel.app/api/health
- https://playbook-radar.vercel.app/

应该不再出现错误。

---

## 📝 当前环境变量状态

| 变量 | 当前值（旧/错误） | 应该改为 |
|------|------------------|----------|
| DATABASE_URL | `postgresql://postgres.vwleqjqdtjaopoqlwqqj:iPd3ueSSi7BZUQFN@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres` | `postgresql://postgres:NonWet98Oe3giphC@db.zxzqbzurjyjnedpjlqkj.supabase.co:6543/postgres?pgbouncer=true` |
| API_KEY | `sk-sp-42f3ed2a9c6e458591f4a4650a57a80c` | ✅ 正确，无需更改 |
| API_BASE_URL | `https://coding.dashscope.aliyuncs.com/v1` | ✅ 正确，无需更改 |

---

## 📊 数据库 Schema 初始化

更新 DATABASE_URL 并重新部署后，需要初始化数据库表：

**方式 A: 通过 GitHub Actions（推荐）**

1. 访问：https://github.com/nhunglykim0-ship-it/playbook-radar/actions
2. 选择 "Playbook Radar - 自动采集"
3. 点击 "Run workflow"
4. 选择任务 "fetch"
5. 点击 "Run workflow"

**方式 B: 本地执行**

```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 复制生产 Schema
cp prisma/schema.supabase.prisma prisma/schema.prisma

# 推送数据库
export DATABASE_URL="postgresql://postgres:NonWet98Oe3giphC@db.zxzqbzurjyjnedpjlqkj.supabase.co:6543/postgres?pgbouncer=true"
npx prisma db push

# 恢复本地 Schema
git checkout prisma/schema.prisma
```

---

## 🎯 完成后验证

1. ✅ 网站首页正常显示
2. ✅ `/api/health` 返回健康状态
3. ✅ `/api/items` 返回内容列表
4. ✅ `/api/tags` 返回标签列表

---

**创建时间:** 2026-03-14 15:10 GMT+8  
**优先级:** 🔴 高（网站当前不可用）
