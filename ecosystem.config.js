module.exports = {
  apps: [
    {
      name: 'playbook-radar',
      script: '.next/standalone/server.js',
      cwd: '/var/www/playbook-radar',
      instances: 1,
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      
      // 日志配置
      error_file: '/var/log/pm2/playbook-radar-error.log',
      out_file: '/var/log/pm2/playbook-radar-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      log_type: 'json',
      
      // 重启策略
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // 资源限制
      max_memory_restart: '512M',
      
      // 错误处理
      kill_timeout: 3000,
      listen_timeout: 3000,
    },
  ],
};
