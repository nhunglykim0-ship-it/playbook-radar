# Playbook Radar 部署指南

## ✅ 构建状态

生产构建已通过：
```bash
npm run build
```

输出：
- 静态页面：16 个
- 动态 API：7 个
- 总 JS 体积：~102KB (最大页面)

---

## 🚀 部署方案

### 方案 A: Vercel (推荐 - 最简单)

**优点：**
- 一键部署
- 自动 HTTPS
- 全球 CDN
- 免费额度充足

**步骤：**

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署
```bash
vercel --prod
```

4. 配置环境变量（在 Vercel Dashboard）：
```
DATABASE_URL=postgresql://...
API_KEY=your_api_key
API_BASE_URL=http://1.95.142.151:3000/v1
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
NEXT_PUBLIC_PLAUSIBLE_URL=https://plausible.io/js/script.js
```

**vercel.json 已配置好，无需修改。**

---

### 方案 B: Railway

**优点：**
- 支持 Docker
- 自带 PostgreSQL
- 自动部署

**步骤：**

1. 在 Railway 创建新项目
2. 连接 GitHub 仓库
3. 添加环境变量
4. 自动部署

**Dockerfile 已配置好。**

---

### 方案 C: VPS (完全控制)

**要求：**
- Ubuntu 20.04+
- 2GB+ RAM
- Node.js 20+
- Docker (可选)

**手动部署：**

```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 克隆项目
git clone <your-repo>
cd playbook-radar

# 3. 安装依赖
npm ci

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 填入配置

# 5. 构建
npm run build

# 6. 启动生产服务
npm run start

# 或使用 PM2
npm i -g pm2
pm2 start npm --name "playbook-radar" -- start
pm2 save
pm2 startup
```

**Docker 部署：**

```bash
# 1. 构建镜像
docker build -t playbook-radar .

# 2. 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e API_KEY=your_api_key \
  -e API_BASE_URL=http://1.95.142.151:3000/v1 \
  --name playbook-radar \
  playbook-radar
```

---

## 📊 数据库配置

### 开发环境 (SQLite)
```env
DATABASE_URL="file:./prisma/dev.db"
```

### 生产环境 (PostgreSQL - 推荐)
```env
DATABASE_URL="postgresql://user:password@host:5432/playbook_radar?schema=public"
```

**迁移数据库：**
```bash
# 生成 Prisma Client
npx prisma generate

# 推送 Schema 到生产数据库
npx prisma db push

# 或运行迁移
npx prisma migrate deploy
```

---

## 🔍 分析工具配置

### Plausible Analytics (推荐)

1. 注册 https://plausible.io
2. 添加网站域名
3. 获取配置：
```env
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
NEXT_PUBLIC_PLAUSIBLE_URL=https://plausible.io/js/script.js
```

### Google Analytics (可选)

在 `app/layout.tsx` 添加：
```tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="gtag-init" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
  `}
</Script>
```

---

## ✅ 验证清单

部署后验证以下页面：

- [ ] `/` 首页 - 搜索/筛选正常
- [ ] `/featured` 精选页 - 数据加载正常
- [ ] `/topics` 专题列表 - 标签显示正常
- [ ] `/topics/自动化` 专题详情 - 筛选排序正常
- [ ] `/trending` 趋势页 - 时间切换正常
- [ ] `/item/[id]` 详情页 - 结构化数据正常
- [ ] `/admin` 后台 - 登录/审核正常
- [ ] `/api/items` API - 返回 JSON 正常
- [ ] 分析工具 - 数据上报正常

---

## 🔧 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 生产启动
npm run start

# 数据库
npx prisma generate
npx prisma db push
npx prisma studio

# 分析脚本
ANALYZE_LIMIT=50 npx tsx scripts/analyze-playbooks.ts
npx tsx scripts/generate-stats.ts
```

---

## 📝 环境变量完整列表

```env
# 必需
DATABASE_URL=postgresql://...
API_KEY=your_api_key
API_BASE_URL=http://1.95.142.151:3000/v1

# 可选（分析工具）
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
NEXT_PUBLIC_PLAUSIBLE_URL=https://plausible.io/js/script.js
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🆘 故障排查

### 构建失败
```bash
# 清理缓存
rm -rf .next node_modules
npm install
npm run build
```

### API 错误
```bash
# 检查环境变量
echo $DATABASE_URL
echo $API_KEY

# 测试数据库连接
npx prisma db pull
```

### 数据库迁移
```bash
# 重置数据库（开发环境）
npx prisma migrate reset

# 生产环境谨慎使用！
```

---

## 📞 支持

遇到问题：
1. 检查日志：`pm2 logs playbook-radar` 或 Docker logs
2. 查看文档：/docs 目录
3. 提交 Issue：GitHub

---

**部署完成后，记得更新 MEMORY.md 记录部署信息！**
