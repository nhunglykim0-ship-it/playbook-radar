# Playbook Radar 运维手册

**最后更新:** 2026-03-14  
**版本:** 0.2.0 (生产级修复后)

---

## 一、当前架构

```
┌─────────────────────────────────────────────────────────┐
│                    Playbook Radar                        │
├─────────────────────────────────────────────────────────┤
│  前端：Next.js 14 (Vercel 部署)                          │
│  数据库：SQLite (本地) / Supabase (生产)                 │
│  AI: Qwen 3.5 Plus (阿里云百炼)                          │
│  定时任务：OpenClaw Cron (每 6 小时)                      │
└─────────────────────────────────────────────────────────┘
```

### 数据流
```
GitHub/RSS → fetch-content.ts → 数据库 (PENDING)
                ↓
        analyze-playbooks.ts → AI 分析 → 数据库 (PUBLISHED)
                ↓
        generate-daily-digest.ts → 日报
```

---

## 二、环境变量

### 本地开发 (.env.local)
```bash
# 必需
API_KEY="sk-sp-42f3ed2a9c6e458591f4a4650a57a80c"
API_BASE_URL="https://coding.dashscope.aliyuncs.com/v1"

# 可选
# YOUTUBE_API_KEY=""
# NEXT_PUBLIC_PLAUSIBLE_DOMAIN=""
# NEXT_PUBLIC_PLAUSIBLE_URL=""
```

### 生产部署 (Vercel Secrets)
| 变量名 | 说明 | 来源 |
|--------|------|------|
| `DATABASE_URL` | Supabase Postgres 连接串 | Supabase Dashboard |
| `API_KEY` | 阿里云百炼 API Key | 阿里云控制台 |
| `API_BASE_URL` | API 基础地址 | `https://coding.dashscope.aliyuncs.com/v1` |

---

## 三、启动命令

### 本地开发
```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 安装依赖
npm install

# 初始化数据库
npm run db:generate
npm run db:push

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 生产部署
```bash
# 1. 复制生产 Schema
cp prisma/schema.supabase.prisma prisma/schema.prisma

# 2. 配置 DATABASE_URL
export DATABASE_URL="postgresql://..."

# 3. 推送数据库
npx prisma db push

# 4. 构建并启动
npm run build
npm start
```

---

## 四、关键操作

### 4.1 内容采集
```bash
# 手动采集
npm run fetch

# 或
cd /home/openclaw/.openclaw/workspace/playbook-radar
export $(grep -v '^#' .env.local | xargs)
npx tsx scripts/fetch-content.ts
```

### 4.2 AI 分析
```bash
# 手动分析 (限制 10 条，每批 2 条)
npm run analyze

# 或
export $(grep -v '^#' .env.local | xargs)
ANALYZE_LIMIT=10 ANALYZE_BATCH=2 npx tsx scripts/analyze-playbooks.ts
```

### 4.3 批量发布
```bash
# 发布所有待审核内容
npm run publish

# 或
npx tsx scripts/bulk-publish.ts
```

### 4.4 生成日报
```bash
# 手动生成今日日报
npm run digest

# 或
npx tsx scripts/generate-daily-digest.ts
```

---

## 五、定时任务 (OpenClaw Cron)

| 任务 | 频率 | 命令 |
|------|------|------|
| 自动采集 | 每 6 小时 | `scripts/fetch-content.ts` |
| AI 分析 | 每 6 小时 | `scripts/analyze-playbooks.ts` |
| 日报生成 | 每天 20:00 | `scripts/generate-daily-digest.ts` |

### 查看 Cron 状态
```bash
openclaw cron list
```

### 手动触发采集
```bash
openclaw cron run <job-id>
```

---

## 六、故障排查

### 6.1 AI 分析失败
**症状:** `API 请求失败` 或 `curl 执行失败`

**检查:**
```bash
# 1. 测试 API 连通性
curl -s -X POST "https://coding.dashscope.aliyuncs.com/v1/chat/completions" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen3.5-plus","messages":[{"role":"user","content":"hi"}],"max_tokens":10}'

# 2. 检查环境变量
echo $API_KEY | head -c 15
echo $API_BASE_URL

# 3. 测试 curl 脚本
./scripts/curl-ai.sh "/tmp/test.txt" 2>&1
```

**解决:**
- 确认 API_KEY 有效（未过期）
- 确认网络可达（WSL2 可能需要 IPv4 优先）
- 检查 curl 脚本权限：`chmod +x scripts/curl-ai.sh`

### 6.2 数据库错误
**症状:** `PrismaClientInitError` 或 `database disk image is malformed`

**检查:**
```bash
# 检查数据库文件
ls -la prisma/dev.db

# 测试连接
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); (async () => { console.log(await p.item.count()); await p.\$disconnect(); })();"
```

**解决:**
```bash
# 重建数据库
rm prisma/dev.db
npx prisma db push
npx prisma db seed  # 如果有 seed 脚本
```

### 6.3 网站无法访问
**症状:** `localhost:3000` 无法连接

**检查:**
```bash
# 检查端口占用
lsof -i :3000

# 检查进程
ps aux | grep next

# 查看日志
tail -f .next/server.log 2>/dev/null || npm run dev 2>&1 | tail -50
```

**解决:**
```bash
# 重启开发服务器
pkill -f "next dev"
npm run dev
```

### 6.4 Cron 任务不执行
**症状:** 内容未自动采集

**检查:**
```bash
# 查看 Cron 状态
openclaw cron list

# 查看任务历史
openclaw cron runs <job-id>

# 检查 Gateway 状态
openclaw gateway status
```

**解决:**
```bash
# 重启 Gateway
openclaw gateway restart

# 手动触发任务
openclaw cron run <job-id>
```

---

## 七、数据库状态查询

```bash
cd /home/openclaw/.openclaw/workspace/playbook-radar

# 总内容数
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); (async () => { console.log('总数:', await p.item.count()); await p.\$disconnect(); })();"

# 各状态数量
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); (async () => { const s = await p.item.groupBy({by:['status'],_count:true}); console.log(s); await p.\$disconnect(); })();"

# 查看待审核内容
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); (async () => { const items = await p.item.findMany({where:{status:'PENDING'},take:10}); items.forEach(i => console.log(i.titleCn || i.titleRaw)); await p.\$disconnect(); })();"
```

---

## 八、Git 操作

```bash
# 提交更改
cd /home/openclaw/.openclaw/workspace/playbook-radar
git add -A
git commit -m "描述"
git push origin main

# 如果 push 失败（需要认证）
# 请配置 GitHub token 或 SSH key
```

---

## 九、密钥安全

### 当前密钥状态
| 密钥 | 状态 | 操作 |
|------|------|------|
| API_KEY | `sk-sp-42f3ed2a9...` | ✅ 有效 |

### 如需重置
1. 登录阿里云百炼控制台
2. 创建新的 API Key
3. 更新 `.env.local` 和 Vercel Secrets
4. 提交时不要包含密钥（已在 .gitignore）

---

## 十、快速参考

| 任务 | 命令 |
|------|------|
| 启动开发 | `npm run dev` |
| 采集内容 | `npm run fetch` |
| AI 分析 | `npm run analyze` |
| 批量发布 | `npm run publish` |
| 生成日报 | `npm run digest` |
| 查看 Cron | `openclaw cron list` |
| 数据库状态 | 见第七节 |

---

**维护者:** Playbook Radar Team  
**联系方式:** 通过 OpenClaw 会话
