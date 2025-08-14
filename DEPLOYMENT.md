# 语音交流平台部署指南

## 📋 概述

本指南将帮助您部署语音交流平台到生产环境。项目支持多种部署方式，包括传统部署、Docker 部署和 Docker Compose 部署。

## 🚀 快速部署

### 方式一：使用部署脚本（推荐）

#### Linux/macOS

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 生产环境部署
./deploy.sh production

# 开发环境部署
./deploy.sh development
```

#### Windows

```cmd
# 生产环境部署
deploy.bat production

# 开发环境部署
deploy.bat development
```

### 方式二：手动部署

#### 1. 安装依赖

```bash
npm ci --only=production
```

#### 2. 创建必要目录

```bash
mkdir -p logs uploads
```

#### 3. 启动服务

```bash
# 生产环境
NODE_ENV=production node server-optimized.js

# 开发环境
NODE_ENV=development node server-optimized.js
```

## 🐳 Docker 部署

### 使用 Docker Compose（推荐）

1. **启动服务**

```bash
docker-compose up -d
```

2. **查看日志**

```bash
docker-compose logs -f
```

3. **停止服务**

```bash
docker-compose down
```

### 使用 Docker

1. **构建镜像**

```bash
docker build -t voice-chat-platform .
```

2. **运行容器**

```bash
docker run -d \
  --name voice-chat-platform \
  -p 25812:25812 \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/resources:/app/resources \
  --restart unless-stopped \
  voice-chat-platform
```

## ⚙️ 环境配置

### 环境变量

| 变量名        | 默认值        | 说明          |
| ------------- | ------------- | ------------- |
| `NODE_ENV`    | `development` | 运行环境      |
| `PORT`        | `25812`       | 服务端口      |
| `HOST`        | `0.0.0.0`     | 监听地址      |
| `CORS_ORIGIN` | `*`           | CORS 允许的源 |
| `LOG_LEVEL`   | `info`        | 日志级别      |

### 配置文件

项目使用 `config.js` 进行配置管理，支持以下配置项：

- **服务器配置**：端口、主机、CORS 等
- **安全配置**：速率限制、安全头等
- **日志配置**：日志级别、文件路径等
- **缓存配置**：缓存策略、过期时间等

## 🔒 安全配置

### 生产环境安全建议

1. **修改默认端口**

```javascript
// config.js
server: {
    port: process.env.PORT || 3000, // 修改为其他端口
}
```

2. **配置 CORS**

```javascript
// config.js
server: {
    cors: {
        origin: ['https://yourdomain.com'], // 限制允许的域名
        credentials: true
    }
}
```

3. **启用 HTTPS**

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... 其他配置
}
```

4. **设置防火墙**

```bash
# 只允许必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 📊 监控和日志

### 健康检查

访问健康检查接口：

```
GET http://localhost:25812/api/health
```

响应示例：

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### 日志管理

- **应用日志**：`logs/app.log`
- **访问日志**：`logs/access.log`
- **错误日志**：`logs/error.log`

查看实时日志：

```bash
# 应用日志
tail -f logs/app.log

# Docker日志
docker logs -f voice-chat-platform
```

## 🔧 维护命令

### 服务管理

```bash
# 重启服务
./deploy.sh production

# 停止服务
pkill -f "node.*server"

# 查看进程
ps aux | grep node
```

### Docker 管理

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs voice-chat-platform

# 重启容器
docker restart voice-chat-platform

# 进入容器
docker exec -it voice-chat-platform sh
```

### 数据备份

```bash
# 备份资源文件
tar -czf backup-$(date +%Y%m%d).tar.gz resources/

# 备份日志
tar -czf logs-$(date +%Y%m%d).tar.gz logs/
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**

```bash
# 查看端口占用
lsof -i :25812

# 杀死占用进程
kill -9 <PID>
```

2. **权限问题**

```bash
# 修改文件权限
chmod 755 deploy.sh
chmod -R 755 logs/
chmod -R 755 uploads/
```

3. **内存不足**

```bash
# 增加Node.js内存限制
node --max-old-space-size=2048 server-optimized.js
```

4. **Docker 问题**

```bash
# 清理Docker资源
docker system prune -a

# 重新构建镜像
docker build --no-cache -t voice-chat-platform .
```

### 性能优化

1. **启用 Gzip 压缩**

```javascript
// 已在server-optimized.js中配置
app.use(compression());
```

2. **静态文件缓存**

```javascript
// 已在server-optimized.js中配置
app.use(
  express.static(".", {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    etag: true,
  })
);
```

3. **数据库优化**（如果使用）

```javascript
// 连接池配置
const pool = mysql.createPool({
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
});
```

## 📞 技术支持

如果遇到部署问题，请：

1. 查看日志文件
2. 检查配置文件
3. 确认环境依赖
4. 联系技术支持

## 📝 更新日志

- **v1.0.0** - 初始版本
- **v2.0.0** - 添加 Docker 支持
- **v2.1.0** - 优化性能和安全性
