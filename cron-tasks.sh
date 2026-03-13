#!/bin/bash
# Playbook Radar 自动任务配置
# 使用方法：crontab cron-tasks.sh

# 环境变量
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
NODE_ENV=production

# 项目目录
PROJECT_DIR="/var/www/playbook-radar"

# 日志目录
LOG_DIR="/var/log/playbook-radar"

# 创建日志目录（如果不存在）
mkdir -p $LOG_DIR

# ============================================
# 自动采集任务
# ============================================

# 每 6 小时采集新内容 (0:00, 6:00, 12:00, 18:00)
0 */6 * * * cd $PROJECT_DIR && npx tsx scripts/fetch-content.ts >> $LOG_DIR/fetch.log 2>&1

# 每 6 小时执行 AI 分析 (1:00, 7:00, 13:00, 19:00)
1 */6 * * * cd $PROJECT_DIR && ANALYZE_LIMIT=10 npx tsx scripts/analyze-playbooks.ts >> $LOG_DIR/analyze.log 2>&1

# ============================================
# 日报生成任务
# ============================================

# 每天 20:00 生成日报
0 20 * * * cd $PROJECT_DIR && npx tsx scripts/generate-daily-digest.ts >> $LOG_DIR/digest.log 2>&1

# ============================================
# 周报生成任务（每周日 23:00）
# ============================================

# 0 23 * * 0 cd $PROJECT_DIR && npx tsx scripts/generate-weekly-digest.ts >> $LOG_DIR/weekly.log 2>&1

# ============================================
# 系统维护任务
# ============================================

# 每天 3:00 清理旧日志（保留 30 天）
0 3 * * * find $LOG_DIR -name "*.log" -mtime +30 -delete

# 每天 4:00 清理 PM2 旧日志
0 4 * * * pm2 flush

# 每小时检查 PM2 状态
0 * * * * pm2 list > /var/log/pm2/status.log 2>&1

# 每周一 9:00 发送周报（如果实现了邮件通知）
# 0 9 * * 1 cd $PROJECT_DIR && npx tsx scripts/send-weekly-report.ts >> $LOG_DIR/report.log 2>&1

# ============================================
# 数据库备份任务（可选）
# ============================================

# 每天 2:00 备份数据库
# 0 2 * * * pg_dump -U playbook_user playbooks > /var/backups/playbooks-$(date +\%Y\%m\%d).sql

# ============================================
# 监控任务
# ============================================

# 每 5 分钟检查服务状态
*/5 * * * * pgrep -f "playbook-radar" > /dev/null || (cd $PROJECT_DIR && pm2 restart playbook-radar)
