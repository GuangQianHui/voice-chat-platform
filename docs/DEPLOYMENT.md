# 部署指南

本文档将指导您如何部署语音交流平台到不同的环境中。

## 环境要求

### 系统要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- 现代浏览器（支持 Web Speech API）

### 推荐配置

- CPU: 2 核心以上
- 内存: 4GB 以上
- 存储: 10GB 以上可用空间
- 网络: 稳定的互联网连接

## 本地开发环境

### 1. 克隆项目

```bash
git clone https://github.com/GuangQianHui/voice-chat-platform.git
cd voice-chat-platform
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置（如果使用）
DB_HOST=localhost
DB_PORT=27017
DB_NAME=voice_chat_platform

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800

# 日志配置
LOG_LEVEL=debug
LOG_PATH=./logs
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 生产环境部署

### 使用 PM2 部署

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 创建 PM2 配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: "voice-chat-platform",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],
    },
  ],
};
```

#### 3. 启动应用

```bash
# 开发环境
pm2 start ecosystem.config.js

# 生产环境
pm2 start ecosystem.config.js --env production
```

#### 4. PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs voice-chat-platform

# 重启应用
pm2 restart voice-chat-platform

# 停止应用
pm2 stop voice-chat-platform

# 删除应用
pm2 delete voice-chat-platform

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

### 使用 Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p logs uploads conversations

# 设置权限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

#### 2. 创建 docker-compose.yml

```yaml
version: "3.8"

services:
  voice-chat-platform:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./uploads:/app/uploads
      - ./conversations:/app/conversations
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - voice-chat-network

networks:
  voice-chat-network:
    driver: bridge
```

#### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 使用 Nginx 反向代理

#### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. 配置 Nginx

创建配置文件 `/etc/nginx/sites-available/voice-chat-platform`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }

    # API路由
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket支持
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 主应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/voice-chat-platform /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

## 云平台部署

### 部署到 Vercel

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 创建 vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 3. 部署

```bash
vercel
```

### 部署到 Heroku

#### 1. 创建 Procfile

```
web: node server.js
```

#### 2. 设置环境变量

```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=3000
```

#### 3. 部署

```bash
git push heroku main
```

## 监控和日志

### 日志配置

创建 `logs` 目录并配置日志轮转：

```bash
mkdir logs
```

使用 logrotate 配置日志轮转：

```bash
# /etc/logrotate.d/voice-chat-platform
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 性能监控

使用 PM2 监控：

```bash
# 安装PM2监控
pm2 install pm2-server-monit

# 查看监控面板
pm2 monit
```

## 安全配置

### 1. 防火墙设置

```bash
# 只允许必要端口
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL 证书

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. 定期更新

```bash
# 创建更新脚本
#!/bin/bash
cd /path/to/your/app
git pull origin main
npm install
pm2 restart voice-chat-platform
```

## 故障排除

### 常见问题

1. **端口被占用**

   ```bash
   # 查看端口占用
   lsof -i :3000

   # 杀死进程
   kill -9 <PID>
   ```

2. **内存不足**

   ```bash
   # 增加Node.js内存限制
   node --max-old-space-size=4096 server.js
   ```

3. **文件权限问题**
   ```bash
   # 修复权限
   sudo chown -R node:node /path/to/your/app
   chmod -R 755 /path/to/your/app
   ```

### 日志分析

```bash
# 查看错误日志
tail -f logs/err.log

# 搜索特定错误
grep "ERROR" logs/combined.log

# 查看访问日志
tail -f logs/out.log
```

## 备份策略

### 数据备份

```bash
#!/bin/bash
# 备份脚本
BACKUP_DIR="/backup/voice-chat-platform"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份对话数据
tar -czf $BACKUP_DIR/conversations_$DATE.tar.gz conversations/

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# 备份配置文件
cp config.json $BACKUP_DIR/config_$DATE.json

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "config_*.json" -mtime +7 -delete
```

## 扩展部署

### 负载均衡

使用 Nginx 进行负载均衡：

```nginx
upstream voice_chat_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://voice_chat_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 数据库集成

如果需要持久化存储，建议集成数据库：

- **MongoDB**: 适合文档型数据
- **PostgreSQL**: 适合关系型数据
- **Redis**: 适合缓存和会话存储

## 联系支持

如果在部署过程中遇到问题，请：

1. 查看日志文件
2. 检查配置文件
3. 提交 Issue 到 GitHub
4. 联系技术支持
