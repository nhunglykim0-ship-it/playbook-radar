#!/bin/bash
# Playbook Radar 生产部署脚本
# 适用于 Ubuntu 22.04

set -e

echo "=========================================="
echo "🚀 Playbook Radar 生产部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

log_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

PROJECT_DIR="/var/www/playbook-radar"
DB_NAME="playbooks"
DB_USER="playbook_user"

# 生成随机密码
DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c16)

echo ""
log_step "1. 系统更新..."
apt update -qq
apt upgrade -y -qq
log_info "系统更新完成"

# 安装 Node.js 20
echo ""
log_step "2. 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt install -y -qq nodejs > /dev/null 2>&1
log_info "Node.js $(node -v) 已安装"

# 安装 pnpm
echo ""
log_step "3. 安装 pnpm..."
npm install -g pnpm > /dev/null 2>&1
log_info "pnpm $(pnpm -v) 已安装"

# 安装 PM2
echo ""
log_step "4. 安装 PM2..."
npm install -g pm2 > /dev/null 2>&1
log_info "PM2 $(pm2 -v) 已安装"

# 安装 PostgreSQL
echo ""
log_step "5. 安装 PostgreSQL..."
apt install -y -qq postgresql postgresql-contrib > /dev/null 2>&1
systemctl enable postgresql > /dev/null 2>&1
systemctl start postgresql > /dev/null 2>&1
log_info "PostgreSQL 已安装并启动"

# 安装 Nginx
echo ""
log_step "6. 安装 Nginx..."
apt install -y -qq nginx > /dev/null 2>&1
systemctl enable nginx > /dev/null 2>&1
systemctl start nginx > /dev/null 2>&1
log_info "Nginx 已安装并启动"

# 配置防火墙
echo ""
log_step "7. 配置防火墙..."
ufw allow 'Nginx Full' > /dev/null 2>&1 || true
ufw allow 'OpenSSH' > /dev/null 2>&1 || true
ufw --force enable > /dev/null 2>&1 || true
log_info "防火墙已配置 (80/443 端口开放)"

# 创建数据库和用户
echo ""
log_step "8. 配置 PostgreSQL 数据库..."
sudo -u postgres psql <<EOF > /dev/null 2>&1
DROP DATABASE IF EXISTS ${DB_NAME};
DROP USER IF EXISTS ${DB_USER};
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF
log_info "数据库 '${DB_NAME}' 已创建"

# 创建应用目录
echo ""
log_step "9. 创建应用目录..."
mkdir -p $PROJECT_DIR
chown -R $SUDO_USER:$SUDO_USER $PROJECT_DIR
log_info "应用目录已创建：$PROJECT_DIR"

# 创建日志目录
mkdir -p /var/log/pm2
mkdir -p /var/log/playbook-radar
chown -R $SUDO_USER:$SUDO_USER /var/log/pm2
chown -R $SUDO_USER:$SUDO_USER /var/log/playbook-radar

# 输出部署信息
echo ""
echo "=========================================="
echo "✅ 系统依赖安装完成！"
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 进入项目目录"
echo "   cd $PROJECT_DIR"
echo ""
echo "2. 安装项目依赖"
echo "   pnpm install"
echo ""
echo "3. 配置环境变量"
echo "   cp .env.example .env.production"
echo "   nano .env.production"
echo ""
echo "4. 数据库连接配置"
echo "   DATABASE_URL=\"postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}\""
echo ""
echo "5. 构建项目"
echo "   pnpm build"
echo ""
echo "6. 启动 PM2"
echo "   pm2 start ecosystem.config.js --name playbook-radar"
echo ""
echo "7. 配置 Nginx"
echo "   cp nginx.conf /etc/nginx/sites-available/playbook-radar"
echo "   ln -s /etc/nginx/sites-available/playbook-radar /etc/nginx/sites-enabled/"
echo "   rm /etc/nginx/sites-enabled/default"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "8. 设置开机自启"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "9. 配置 Cron 任务"
echo "   crontab cron-tasks.sh"
echo ""
echo "=========================================="
echo "📊 数据库连接信息："
echo "  主机：localhost"
echo "  端口：5432"
echo "  数据库：${DB_NAME}"
echo "  用户：${DB_USER}"
echo "  密码：${DB_PASSWORD}"
echo "=========================================="
echo ""
log_info "部署脚本执行完成！"
echo ""
