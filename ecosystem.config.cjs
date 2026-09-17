module.exports = {
  apps: [ {
    name: 'bookig-auto-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3009',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production', PORT: 3009 },
    error_file: '/var/log/pm2/bookig-auto-frontend-error.log',
    out_file: '/var/log/pm2/bookig-auto-frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
