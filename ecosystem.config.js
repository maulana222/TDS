export default {
  apps: [{
    name: 'tds',
    script: 'server/server.js',
    instances: 1,
    exec_mode: 'fork',
    env_file: '.env', // PM2 akan membaca .env file
    env: {
      NODE_ENV: 'production',
      PORT: 3737,
      FRONTEND_URL: 'https://tds.pix-ly.app',
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
  }],
};

