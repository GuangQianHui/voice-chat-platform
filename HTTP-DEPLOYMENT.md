# HTTP协议部署指南

## 概述
本指南将帮助您确保语音交流平台使用HTTP协议而不是HTTPS协议。

## 问题原因
如果您遇到自动跳转到HTTPS的问题，可能由以下原因造成：
1. 云服务提供商自动HTTPS重定向
2. CDN服务强制HTTPS
3. 浏览器安全策略
4. 反向代理配置

## 解决方案

### 1. 使用HTTP专用启动脚本

**Windows用户：**
```bash
start-http.bat
```

**Linux/Mac用户：**
```bash
chmod +x start-http.sh
./start-http.sh
```

### 2. Docker部署（推荐）

```bash
# 停止现有容器
docker-compose down

# 重新构建并启动（仅HTTP）
docker-compose up --build -d
```

### 3. 直接Node.js部署

```bash
# 设置环境变量
export NODE_ENV=production
export FORCE_HTTP=true
export HTTPS_REDIRECT=false

# 启动服务器
node server-optimized.js
```

## 配置检查清单

### ✅ 已完成的配置修改

1. **nginx.conf** - 移除了HTTPS配置，强制使用HTTP
2. **docker-compose.yml** - 移除了443端口映射
3. **config.js** - 禁用了HSTS和安全cookie
4. **server-optimized.js** - 添加了HTTP协议强制中间件
5. **启动脚本** - 创建了HTTP专用启动脚本

### 🔧 服务器环境检查

如果仍然遇到HTTPS重定向，请检查：

1. **云服务提供商设置**
   - 阿里云：检查负载均衡器设置
   - 腾讯云：检查CLB配置
   - AWS：检查ALB设置

2. **CDN设置**
   - 如果使用Cloudflare，在SSL/TLS设置中选择"Flexible"
   - 如果使用其他CDN，检查SSL设置

3. **域名解析**
   - 确保域名直接解析到服务器IP
   - 避免使用CDN代理

### 🚀 部署步骤

1. **上传文件**
   ```bash
   # 上传所有修改后的文件到服务器
   scp -r ./* user@your-server:/path/to/project/
   ```

2. **重启服务**
   ```bash
   # 如果使用Docker
   docker-compose down
   docker-compose up --build -d
   
   # 如果直接使用Node.js
   pm2 restart server-optimized.js
   ```

3. **验证部署**
   ```bash
   # 检查服务状态
   curl http://your-domain/api/health
   
   # 检查协议
   curl -I http://your-domain
   ```

### 🔍 故障排除

1. **检查日志**
   ```bash
   # Docker日志
   docker-compose logs -f
   
   # 应用日志
   tail -f logs/app.log
   ```

2. **检查端口**
   ```bash
   # 检查端口监听
   netstat -tlnp | grep :80
   netstat -tlnp | grep :3000
   ```

3. **清除浏览器缓存**
   - 清除浏览器缓存和Cookie
   - 使用无痕模式测试

### 📝 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `FORCE_HTTP` | 强制HTTP协议 | `true` |
| `HTTPS_REDIRECT` | 禁用HTTPS重定向 | `false` |
| `PORT` | 服务器端口 | `3000` |

### 🔒 安全注意事项

虽然使用HTTP协议，但仍需注意：

1. **内网部署**：建议在内网环境使用
2. **防火墙**：配置适当的防火墙规则
3. **访问控制**：限制访问IP范围
4. **监控**：设置访问日志监控

## 联系支持

如果按照以上步骤仍然无法解决HTTPS重定向问题，请：

1. 检查服务器环境配置
2. 查看应用日志
3. 联系云服务提供商技术支持
