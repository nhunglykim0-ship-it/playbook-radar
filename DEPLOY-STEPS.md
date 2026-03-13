# 🚀 Playbook Radar 生产部署指南

## 📋 部署清单

### 1) 服务器准备步骤

**要求：**
- Ubuntu 22.04 LTS
- 2GB+ RAM
- 20GB+ 存储
- 公网 IP
- root 或 sudo 权限

**上传部署脚本：**
```bash
# 从本地上传项目
scp -r playbook-radar user@your-server:/tmp/

# SSH 登录服务器
ssh user@your-server

# 切换到 root
sudo -i

# 进入项目目录
cd /tmp/playbook-radar

# 赋予执行权限
chmod +x deploy.sh cron-tasks.sh
```

---

### 2) 运行 deploy.sh

```bash
# 执行部署脚本
./deploy.sh
```

部署脚本会自动：
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
# 移动项目到正式目录
mv /tmp/playbook-radar /var/www/playbook-radar
cd /var/www/playbook-radar

# 安装项目依赖
pnpm install

# 生成 Prisma Client
npx prisma generate

# 推送数据库 Schema
npx prisma db push
```

---

### 4) 配置环境变量

```bash
# 复制环境配置
cp .env.example .env.production

# 编辑环境变量
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
# 生产构建
pnpm build

# 验证构建
ls -la .next/standalone/
```

---

### 6) 启动 PM2

```bash
# 创建日志目录
mkdir -p /var/log/pm2
mkdir -p /var/log/playbook-radar

# 启动应用
pm2 start ecosystem.config.js --name playbook-radar

# 查看状态
pm2 status

# 查看日志
pm2 logs playbook-radar
```

---

### 7) 配置 Nginx

```bash
# 复制 Nginx 配置
cp nginx.conf /etc/nginx/sites-available/playbook-radar

# 编辑域名（如果有）
nano /etc/nginx/sites-available/playbook-radar
# 修改 server_name 为你的域名

# 启用站点
ln -s /etc/nginx/sites-available/playbook-radar /etc/nginx/sites-enabled/

# 删除默认站点
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

---

### 8) 设置开机自启

```bash
# PM2 开机自启
pm2 startup

# 复制输出的命令并执行
# 例如：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 保存当前应用列表
pm2 save
```

---

### 9) 配置 Cron 任务

```bash
# 安装 Cron 任务
crontab cron-tasks.sh

# 验证
crontab -l
```

**自动任务：**
- 每 6 小时：采集新内容
- 每 6 小时：AI 分析
- 每天 20:00：生成日报
- 每天 3:00：清理旧日志
- 每小时：检查 PM2 状态

---

### 10) 配置 SSL（可选但推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
certbot renew --dry-run
```

---

## ✅ 验证部署

### 检查服务状态

```bash
# PM2 状态
pm2 status

# Nginx 状态
systemctl status nginx

# PostgreSQL 状态
systemctl status postgresql

# 端口监听
netstat -tlnp | grep :3000
netstat -tlnp | grep :80
```

### 测试访问

```bash
# 本地测试
curl http://localhost:3000

# 通过 Nginx 测试
curl http://localhost

# 域名测试（如果配置了）
curl http://your-domain.com
```

### 访问页面

| 页面 | 地址 |
|------|------|
| 首页 | http://your-domain.com/ |
| 精选 | http://your-domain.com/featured |
| 趋势 | http://your-domain.com/trending |
| 专题 | http://your-domain.com/topics |
| 后台 | http://your-domain.com/admin |

---

## 📊 监控和维护

### PM2 监控

```bash
# 查看实时日志
pm2 logs playbook-radar

# 查看监控面板
pm2 monit

# 查看状态
pm2 status

# 重启应用
pm2 restart playbook-radar

# 停止应用
pm2 stop playbook-radar

# 删除应用
pm2 delete playbook-radar
```

### 日志查看

```bash
# 应用日志
tail -f /var/log/pm2/playbook-radar-out.log

# 错误日志
tail -f /var/log/pm2/playbook-radar-error.log

# Nginx 访问日志
tail -f /var/log/nginx/playbook-radar-access.log

# Nginx 错误日志
tail -f /var/log/nginx/playbook-radar-error.log

# 采集日志
tail -f /var/log/playbook-radar/fetch.log

# 日报日志
tail -f /var/log/playbook-radar/digest.log
```

### 数据库管理

```bash
# 连接数据库
sudo -u postgres psql playbooks

# 查看表
\dt

# 查看数据量
SELECT COUNT(*) FROM "Item";

# 退出
\q

# 备份数据库
pg_dump -U playbook_user playbooks > backup.sql

# 恢复数据库
psql -U playbook_user playbooks < backup.sql
```

---

## 🔄 系统重启后

```bash
# PM2 会自动启动（如果配置了 pm2 startup）
pm2 status

# 如果服务未运行，手动启动
pm2 restart playbook-radar

# 重启 Nginx
systemctl restart nginx

# 重启 PostgreSQL
systemctl restart postgresql
```

---

## 🛠️ 常用维护命令

### 应用维护

```bash
# 查看应用状态
pm2 status

# 重启应用
pm2 restart playbook-radar

# 查看日志
pm2 logs playbook-radar --lines 100

# 监控资源使用
pm2 monit

# 查看详细信息
pm2 show playbook-radar
```

### 更新部署

```bash
# 进入项目目录
cd /var/www/playbook-radar

# 拉取最新代码
git pull

# 安装新依赖
pnpm install

# 重新构建
pnpm build

# 重启应用
pm2 restart playbook-radar
```

### 数据库维护

```bash
# 查看连接数
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# 清理空闲连接
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# 数据库优化
sudo -u postgres psql playbooks -c "VACUUM ANALYZE;"
```

---

## 🆘 故障排查

### 应用无法启动

```bash
# 查看 PM2 日志
pm2 logs playbook-radar --lines 100

# 检查端口占用
lsof -i :3000

# 查看错误详情
cat /var/log/pm2/playbook-radar-error.log

# 重启应用
pm2 restart playbook-radar
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 测试连接
psql -h localhost -U playbook_user -d playbooks

# 查看连接数
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# 重启 PostgreSQL
systemctl restart postgresql
```

### Nginx 502 错误

```bash
# 检查后端是否运行
pm2 status

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/playbook-radar-error.log

# 重启 Nginx
systemctl reload nginx
```

### 内存不足

```bash
# 查看内存使用
free -h

# 限制 PM2 内存（编辑 ecosystem.config.js）
# max_memory_restart: '512M'

# 重启应用
pm2 restart playbook-radar

# 添加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 📋 部署检查清单

- [ ] Node.js 20 已安装
- [ ] PostgreSQL 已安装并运行
- [ ] 数据库 `playbooks` 已创建
- [ ] 环境变量已配置
- [ ] 项目构建成功
- [ ] PM2 应用运行中
- [ ] Nginx 反向代理配置
- [ ] SSL 证书配置（可选）
- [ ] Cron 任务已设置
- [ ] 开机自启已配置
- [ ] 所有页面可访问
- [ ] 日志监控正常

---

## 📞 部署完成！

**访问地址：** http://your-domain.com

**管理命令：**
```bash
pm2 status              # 查看状态
pm2 logs playbook-radar # 查看日志
pm2 monit              # 监控面板
pm2 restart playbook-radar  # 重启应用
```

**文档参考：**
- 部署脚本：`deploy.sh`
- Nginx 配置：`nginx.conf`
- PM2 配置：`ecosystem.config.js`
- Cron 任务：`cron-tasks.sh`
- 环境变量：`.env.example`

---

**祝部署顺利！🎉**
