module.exports = {
  apps: [{
    name: 'voice-chat-platform',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      UPLOAD_PATH: './uploads',
      MAX_FILE_SIZE: 52428800
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      UPLOAD_PATH: './uploads',
      MAX_FILE_SIZE: 52428800
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', 'conversations'],
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    cron_restart: '0 2 * * *', // 每天凌晨2点重启
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
