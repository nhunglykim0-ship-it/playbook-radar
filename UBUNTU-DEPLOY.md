# Ubuntu 22 生产部署指南

## 📋 系统要求

- Ubuntu 22.04 LTS
- 2GB+ RAM
- 20GB+ 存储
- 公网 IP
- 域名（可选）

---

## 🚀 快速部署（15 分钟）

### 1. 上传并执行部署脚本

```bash
# 上传项目到服务器
scp -r playbook-radar user@your-server:/tmp/

# SSH 登录服务器
ssh user@your-server

# 切换到 root
sudo -i

# 进入项目目录
cd /tmp/playbook-radar

# 赋予执行权限
chmod +x deploy.sh

# 执行部署脚本
./deploy.sh
```

部署脚本会自动安装：
- ✅ Node.js 20
- ✅ pnpm
- ✅ pm2
- ✅ PostgreSQL
- ✅ Nginx
- ✅ 防火墙配置

---

### 2. 配置项目

```bash
# 移动项目到正式目录
mv /tmp/playbook-radar /var/www/playbook-radar
cd /var/www/playbook-radar

# 安装依赖
pnpm install

# 生成 Prisma Client
npx prisma generate

# 配置环境变量
cp .env.example .env.production
nano .env.production
```

**编辑 `.env.production`：**
```env
# 数据库（使用部署脚本创建的密码）
DATABASE_URL="postgresql://playbook_user:YOUR_PASSWORD@localhost:5432/playbooks"

# AI API
API_KEY="your_api_key"
API_BASE_URL="http://1.95.142.151:3000/v1"

# 分析工具（可选）
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="your-domain.com"
NEXT_PUBLIC_PLAUSIBLE_URL="https://plausible.io/js/script.js"
```

---

### 3. 构建项目

```bash
# 生产构建
pnpm build

# 验证构建
ls -la .next/standalone/
```

---

### 4. 使用 PM2 启动

```bash
# 创建 PM2 日志目录
mkdir -p /var/log/pm2
chown $USER:$USER /var/log/pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs playbook-radar
```

---

### 5. 配置 Nginx 反向代理

```bash
# 复制 Nginx 配置
cp nginx.conf /etc/nginx/sites-available/playbook-radar

# 编辑域名
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

### 6. 配置 SSL（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d example.com -d www.example.com

# 自动续期测试
certbot renew --dry-run
```

---

### 7. 配置开机自启

```bash
# PM2 开机自启
pm2 startup

# 保存当前应用列表
pm2 save

# 验证
reboot
# 重启后检查
pm2 status
```

---

### 8. 配置 Cron 自动任务

```bash
# 创建日志目录
mkdir -p /var/log/playbook-radar

# 编辑 crontab
crontab -e

# 添加任务（内容来自 cron-tasks.sh）
0 */6 * * * cd /var/www/playbook-radar && npx tsx scripts/fetch-content.ts >> /var/log/playbook-radar/fetch.log 2>&1
0 20 * * * cd /var/www/playbook-radar && npx tsx scripts/generate-daily-digest.ts >> /var/log/playbook-radar/digest.log 2>&1
```

---

## 🔍 验证部署

### 1. 检查服务状态

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

### 2. 测试访问

```bash
# 本地测试
curl http://localhost:3000

# 通过 Nginx 测试
curl http://localhost

# 域名测试（如果配置了）
curl http://example.com
```

### 3. 检查页面

访问以下页面验证：
- http://your-domain.com/ (首页)
- http://your-domain.com/featured (精选)
- http://your-domain.com/trending (趋势)
- http://your-domain.com/topics (专题)
- http://your-domain.com/admin (后台)

---

## 📊 监控和维护

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs playbook-radar

# 重启应用
pm2 restart playbook-radar

# 停止应用
pm2 stop playbook-radar

# 删除应用
pm2 delete playbook-radar

# 查看监控
pm2 monit
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

# Cron 日志
tail -f /var/log/playbook-radar/fetch.log
```

### 数据库管理

```bash
# 连接数据库
sudo -u postgres psql playbooks

# 查看表
\dt

# 查看数据
SELECT COUNT(*) FROM "Item";

# 退出
\q
```

---

## 🔧 故障排查

### 应用无法启动

```bash
# 检查 PM2 日志
pm2 logs playbook-radar --lines 100

# 检查端口占用
lsof -i :3000

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
```

### Nginx 502 错误

```bash
# 检查后端是否运行
pm2 status

# 检查 Nginx 配置
nginx -t

# 查看 Nginx 错误日志
tail -f /var/log/nginx/playbook-radar-error.log
```

### 内存不足

```bash
# 查看内存使用
free -h

# 限制 PM2 内存（在 ecosystem.config.js）
max_memory_restart: '512M'

# 添加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 📈 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss;
```

### 2. 配置缓存

```bash
# 编辑 Nginx 配置
nano /etc/nginx/sites-available/playbook-radar

# 添加静态资源缓存（已配置）
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 数据库优化

```bash
# 创建索引（Prisma 已自动创建）
npx prisma db push

# 定期清理旧数据
psql -U playbook_user -d playbooks -c "VACUUM ANALYZE;"
```

---

## 🔒 安全加固

### 1. 防火墙配置

```bash
# 只开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 2. 禁用 root SSH 登录

```bash
nano /etc/ssh/sshd_config
# 修改：PermitRootLogin no
systemctl restart sshd
```

### 3. 自动安全更新

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
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

## 🆘 需要帮助？

- 查看日志：`pm2 logs playbook-radar`
- 查看文档：`DEPLOY.md`
- 重启服务：`pm2 restart playbook-radar && systemctl reload nginx`

---

**部署完成！🎉**
