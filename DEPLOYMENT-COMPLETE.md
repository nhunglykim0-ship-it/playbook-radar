# ✅ Playbook Radar 生产部署准备完成

## 📦 部署文件清单

| 文件 | 大小 | 用途 | 状态 |
|------|------|------|------|
| `deploy.sh` | 4.3KB | 一键部署脚本 | ✅ 已优化 |
| `nginx.conf` | 3.2KB | Nginx 反向代理 | ✅ 已优化 |
| `ecosystem.config.js` | 878B | PM2 应用配置 | ✅ 已优化 |
| `cron-tasks.sh` | 2.2KB | Cron 自动任务 | ✅ 已优化 |
| `.env.example` | 1.5KB | 环境变量模板 | ✅ 已优化 |
| `DEPLOY-STEPS.md` | 5.9KB | 完整部署指南 | ✅ 新建 |

---

## 🚀 快速部署步骤

### 1) 服务器准备

**要求：**
- Ubuntu 22.04 LTS
- 2GB+ RAM
- 20GB+ 存储
- 公网 IP

**上传项目：**
```bash
scp -r playbook-radar user@your-server:/tmp/
ssh user@your-server
sudo -i
cd /tmp/playbook-radar
chmod +x deploy.sh cron-tasks.sh
```

---

### 2) 运行 deploy.sh

```bash
./deploy.sh
```

**自动完成：**
- ✅ 安装 Node.js 20
- ✅ 安装 pnpm
- ✅ 安装 PM2
- ✅ 安装 PostgreSQL
- ✅ 安装 Nginx
- ✅ 配置防火墙
- ✅ 创建数据库 `playbooks`
- ✅ 创建数据库用户

**记录输出的数据库密码！**

---

### 3) 配置项目

```bash
mv /tmp/playbook-radar /var/www/playbook-radar
cd /var/www/playbook-radar
pnpm install
npx prisma generate
npx prisma db push
```

---

### 4) 配置环境变量

```bash
cp .env.example .env.production
nano .env.production
```

**必须配置：**
```env
DATABASE_URL="postgresql://playbook_user:YOUR_PASSWORD@localhost:5432/playbooks"
API_KEY="your_api_key"
API_BASE_URL="http://1.95.142.151:3000/v1"
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="your-domain.com"
```

---

### 5) 构建项目

```bash
pnpm build
```

---

### 6) 启动 PM2

```bash
mkdir -p /var/log/pm2
pm2 start ecosystem.config.js --name playbook-radar
pm2 status
pm2 logs playbook-radar
```

---

### 7) 配置 Nginx

```bash
cp nginx.conf /etc/nginx/sites-available/playbook-radar
ln -s /etc/nginx/sites-available/playbook-radar /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

---

### 8) 设置开机自启

```bash
pm2 startup
# 复制输出的命令执行
pm2 save
```

---

### 9) 配置 Cron 任务

```bash
crontab cron-tasks.sh
crontab -l  # 验证
```

**自动任务：**
- ⏰ 每 6 小时：采集新内容 + AI 分析
- ⏰ 每天 20:00：生成日报
- ⏰ 每天 3:00：清理旧日志
- ⏰ 每小时：检查 PM2 状态

---

### 10) 配置 SSL（可选）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## ✅ 验证部署

```bash
# 检查服务
pm2 status
systemctl status nginx
systemctl status postgresql

# 测试访问
curl http://localhost:3000
curl http://localhost

# 访问页面
# http://your-domain.com/
# http://your-domain.com/featured
# http://your-domain.com/trending
# http://your-domain.com/topics
```

---

## 📊 监控命令

```bash
# PM2 日志
pm2 logs playbook-radar

# PM2 监控
pm2 monit

# 查看应用日志
tail -f /var/log/pm2/playbook-radar-out.log

# 查看采集日志
tail -f /var/log/playbook-radar/fetch.log

# 查看日报日志
tail -f /var/log/playbook-radar/digest.log
```

---

## 🔄 系统重启后

PM2 会自动启动（如果配置了 `pm2 startup`）：

```bash
pm2 status
# 如果未运行
pm2 restart playbook-radar
```

---

## 📋 部署检查清单

- [ ] 上传项目到服务器
- [ ] 运行 `deploy.sh`
- [ ] 记录数据库密码
- [ ] 配置 `.env.production`
- [ ] 运行 `pnpm install`
- [ ] 运行 `pnpm build`
- [ ] 启动 PM2
- [ ] 配置 Nginx
- [ ] 设置开机自启
- [ ] 配置 Cron 任务
- [ ] 验证所有页面
- [ ] 配置 SSL（可选）

---

## 🆘 故障排查

**应用无法启动：**
```bash
pm2 logs playbook-radar --lines 100
```

**数据库连接失败：**
```bash
psql -h localhost -U playbook_user -d playbooks
```

**Nginx 502 错误：**
```bash
pm2 status
tail -f /var/log/nginx/playbook-radar-error.log
```

---

## 📞 访问地址

部署完成后访问：

- **首页：** http://your-domain.com/
- **精选：** http://your-domain.com/featured
- **趋势：** http://your-domain.com/trending
- **专题：** http://your-domain.com/topics
- **后台：** http://your-domain.com/admin

---

## 📖 文档参考

1. **完整部署指南** → `DEPLOY-STEPS.md`
2. **部署脚本** → `deploy.sh`
3. **Nginx 配置** → `nginx.conf`
4. **PM2 配置** → `ecosystem.config.js`
5. **Cron 任务** → `cron-tasks.sh`
6. **环境变量** → `.env.example`

---

## 🎯 下一步

1. **上传项目** 到 Ubuntu 服务器
2. **执行 deploy.sh**
3. **配置环境变量**
4. **启动服务**
5. **验证访问**
6. **收集反馈**

---

**所有部署文件已准备就绪！可以开始生产部署了 🎉**
