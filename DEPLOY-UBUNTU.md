# 🚀 Playbook Radar 生产部署完成

## ✅ 部署方案：Ubuntu 22 + PM2 + PostgreSQL + Nginx

---

## 📦 一键部署命令

```bash
# 1. 上传项目到服务器
scp -r playbook-radar user@your-server:/tmp/

# 2. SSH 登录并执行部署脚本
ssh user@your-server
cd /tmp/playbook-radar
chmod +x deploy.sh
sudo ./deploy.sh

# 3. 配置项目
sudo mv /tmp/playbook-radar /var/www/playbook-radar
cd /var/www/playbook-radar
pnpm install
npx prisma generate

# 4. 配置环境变量
cp .env.example .env.production
nano .env.production

# 5. 构建并启动
pnpm build
mkdir -p /var/log/pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 6. 配置 Nginx
sudo cp nginx.conf /etc/nginx/sites-available/playbook-radar
sudo nano /etc/nginx/sites-available/playbook-radar  # 修改域名
sudo ln -s /etc/nginx/sites-available/playbook-radar /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 7. 配置 SSL（可选）
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

# 8. 配置 Cron 任务
sudo mkdir -p /var/log/playbook-radar
sudo crontab -e
# 添加 cron-tasks.sh 中的内容
```

---

## 🔧 环境变量配置

编辑 `.env.production`：

```env
# 数据库（使用部署脚本生成的密码）
DATABASE_URL="postgresql://playbook_user:YOUR_PASSWORD@localhost:5432/playbooks"

# AI API
API_KEY="your_api_key"
API_BASE_URL="http://1.95.142.151:3000/v1"

# 分析工具
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="your-domain.com"
NEXT_PUBLIC_PLAUSIBLE_URL="https://plausible.io/js/script.js"
```

---

## 📊 服务状态检查

```bash
# 查看 PM2 状态
pm2 status

# 查看应用日志
pm2 logs playbook-radar

# 查看 Nginx 状态
systemctl status nginx

# 查看 PostgreSQL 状态
systemctl status postgresql

# 测试访问
curl http://localhost:3000
curl http://localhost
```

---

## 🔄 自动任务配置

编辑 crontab：
```bash
crontab -e
```

添加以下内容：
```
# 每 6 小时采集新内容
0 */6 * * * cd /var/www/playbook-radar && npx tsx scripts/fetch-content.ts >> /var/log/playbook-radar/fetch.log 2>&1

# 每天 20:00 生成日报
0 20 * * * cd /var/www/playbook-radar && npx tsx scripts/generate-daily-digest.ts >> /var/log/playbook-radar/digest.log 2>&1
```

---

## 📋 部署验证清单

| 检查项 | 命令 | 预期结果 |
|--------|------|----------|
| PM2 运行 | `pm2 status` | playbook-radar online |
| Nginx 运行 | `systemctl status nginx` | active (running) |
| PostgreSQL 运行 | `systemctl status postgresql` | active (running) |
| 端口监听 | `netstat -tlnp \| grep :3000` | LISTEN |
| 首页访问 | `curl http://localhost` | HTML 内容 |
| API 访问 | `curl http://localhost/api/items` | JSON 数据 |
| 域名访问 | `curl http://your-domain.com` | HTML 内容 |

---

## 🔍 日志监控

```bash
# 应用日志
tail -f /var/log/pm2/playbook-radar-out.log

# 错误日志
tail -f /var/log/pm2/playbook-radar-error.log

# Nginx 访问日志
tail -f /var/log/nginx/playbook-radar-access.log

# 采集日志
tail -f /var/log/playbook-radar/fetch.log

# 日报日志
tail -f /var/log/playbook-radar/digest.log
```

---

## 🛠️ 常用维护命令

```bash
# 重启应用
pm2 restart playbook-radar

# 重启 Nginx
systemctl reload nginx

# 查看监控
pm2 monit

# 数据库备份
pg_dump -U playbook_user playbooks > backup.sql

# 数据库恢复
psql -U playbook_user playbooks < backup.sql

# 清理旧日志
find /var/log/playbook-radar -name "*.log" -mtime +30 -delete
```

---

## 📁 文件结构

```
/var/www/playbook-radar/
├── .env.production      # 生产环境配置
├── .next/
│   └── standalone/
│       └── server.js    # PM2 启动入口
├── prisma/
│   └── dev.db           # 数据库（开发）
├── scripts/
│   ├── fetch-content.ts      # 采集脚本
│   └── generate-daily-digest.ts  # 日报生成
├── logs/
│   ├── fetch.log          # 采集日志
│   └── digest.log         # 日报日志
└── ecosystem.config.js    # PM2 配置

/var/log/
├── pm2/
│   ├── playbook-radar-out.log
│   └── playbook-radar-error.log
├── nginx/
│   ├── playbook-radar-access.log
│   └── playbook-radar-error.log
└── playbook-radar/
    ├── fetch.log
    └── digest.log
```

---

## 🎯 下一步

1. **配置域名 DNS** 指向服务器 IP
2. **配置 SSL 证书** (Let's Encrypt)
3. **测试所有页面** 确保正常访问
4. **配置分析工具** (Plausible/GA)
5. **设置监控告警** (可选)
6. **收集用户反馈**

---

## 🆘 故障排查

**应用无法启动：**
```bash
pm2 logs playbook-radar --lines 100
```

**数据库连接失败：**
```bash
sudo -u postgres psql playbooks -c "\dt"
```

**Nginx 502 错误：**
```bash
pm2 status
tail -f /var/log/nginx/playbook-radar-error.log
```

**内存不足：**
```bash
free -h
# 编辑 ecosystem.config.js 添加 max_memory_restart: '512M'
pm2 restart playbook-radar
```

---

## 📞 部署完成！

访问：http://your-domain.com

**文档参考：**
- 完整部署指南：`UBUNTU-DEPLOY.md`
- 部署脚本：`deploy.sh`
- Nginx 配置：`nginx.conf`
- PM2 配置：`ecosystem.config.js`
- Cron 任务：`cron-tasks.sh`

---

**祝部署顺利！🎉**
