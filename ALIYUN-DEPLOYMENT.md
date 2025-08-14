# 阿里云 Linux 服务器部署指南

## 概述

本指南将帮助您在阿里云 Linux 服务器上部署语音交流平台，使用 Node.js 和 HTTP 协议。

## 前置要求

### 1. 阿里云服务器配置

- **操作系统**: Ubuntu 20.04/22.04 或 CentOS 7/8
- **内存**: 至少 1GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 公网 IP 地址

### 2. 安全组配置

在阿里云控制台中配置安全组：

- **入方向规则**:
  - 端口 22 (SSH)
  - 端口 80 (HTTP)
  - 端口 3000 (应用端口)

## 部署步骤

### 步骤 1: 连接到服务器

```bash
# 使用SSH连接到您的阿里云服务器
ssh root@your-server-ip
```

### 步骤 2: 检查现有服务状态

```bash
# 给脚本执行权限
chmod +x check-status.sh

# 检查当前状态
./check-status.sh
```

### 步骤 3: 停止现有服务（如果已启动）

```bash
# 给脚本执行权限
chmod +x stop-service.sh

# 停止现有服务
./stop-service.sh
```

### 步骤 4: 更新系统

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 步骤 5: 安装 Node.js

```bash
# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤 6: 上传项目文件

**方法 1: 使用 SCP 上传**

```bash
# 在本地执行
scp -r ./语音交流平台/* root@your-server-ip:/home/voice-chat/
```

**方法 2: 使用 Git 克隆**

```bash
# 在服务器上执行
cd /home
git clone your-repository-url voice-chat
cd voice-chat
```

### 步骤 7: 配置防火墙

```bash
# 给脚本执行权限
chmod +x setup-firewall.sh

# 运行防火墙配置
./setup-firewall.sh
```

### 步骤 8: 重新部署应用

**方法 1: 使用自动重新部署脚本（推荐）**

```bash
# 给脚本执行权限
chmod +x redeploy-aliyun.sh

# 运行重新部署脚本
./redeploy-aliyun.sh
```

**方法 2: 使用 PM2 重新部署**

```bash
# 给脚本执行权限
chmod +x redeploy-pm2.sh

# 运行PM2重新部署脚本
./redeploy-pm2.sh
```

**方法 3: 手动重新部署**

```bash
# 进入项目目录
cd /home/voice-chat

# 停止现有进程
pkill -f "node server-optimized.js"
pkill -f "pm2"

# 清理旧的依赖
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install --production

# 创建必要目录
mkdir -p logs uploads

# 设置环境变量
export NODE_ENV=production
export FORCE_HTTP=true
export HTTPS_REDIRECT=false
export PORT=3000
export HOST=0.0.0.0

# 启动服务器
nohup node server-optimized.js > logs/startup.log 2>&1 &
```

## 验证部署

### 1. 检查服务状态

```bash
# 使用检查脚本
./check-status.sh

# 手动检查
netstat -tlnp | grep :3000
ps aux | grep node
curl http://localhost:3000/api/health
```

### 2. 访问应用

在浏览器中访问：

```
http://your-server-ip:3000
```

### 3. 检查日志

```bash
# 查看应用日志
tail -f logs/app.log

# 查看启动日志
tail -f logs/startup.log

# 如果使用PM2
pm2 logs voice-chat-platform
```

## 常用管理命令

### 检查服务状态

```bash
./check-status.sh
```

### 停止服务

```bash
./stop-service.sh
```

### 重启应用

```bash
# 如果使用nohup
pkill -f "node server-optimized.js"
nohup node server-optimized.js > logs/startup.log 2>&1 &

# 如果使用PM2
pm2 restart voice-chat-platform
```

### 重新部署

```bash
# 使用自动脚本
./redeploy-aliyun.sh

# 或使用PM2
./redeploy-pm2.sh
```

## 故障排除

### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 设置文件权限
chmod 755 logs uploads
chown -R $USER:$USER /home/voice-chat
```

### 3. 内存不足

```bash
# 查看内存使用
free -h

# 查看进程内存使用
ps aux --sort=-%mem | head -10
```

### 4. 网络连接问题

```bash
# 检查防火墙状态
sudo ufw status

# 检查端口监听
netstat -tlnp | grep :3000

# 测试本地连接
curl http://localhost:3000/api/health
```

### 5. 服务无法启动

```bash
# 检查日志
tail -f logs/startup.log

# 检查依赖
npm list

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install --production
```

## 性能优化

### 1. 启用 Gzip 压缩

已在配置中启用

### 2. 设置缓存

已在配置中启用

### 3. 监控资源使用

```bash
# 安装htop
sudo apt-get install htop

# 监控系统资源
htop
```

## 备份和恢复

### 1. 备份数据

```bash
# 备份项目文件
tar -czf voice-chat-backup-$(date +%Y%m%d).tar.gz /home/voice-chat/

# 备份日志
tar -czf logs-backup-$(date +%Y%m%d).tar.gz /home/voice-chat/logs/
```

### 2. 恢复数据

```bash
# 解压备份
tar -xzf voice-chat-backup-YYYYMMDD.tar.gz

# 重启服务
pm2 restart voice-chat-platform
```

## 安全建议

1. **定期更新系统**
2. **使用强密码**
3. **限制 SSH 访问**
4. **监控日志文件**
5. **定期备份数据**

## 联系支持

如果遇到问题，请：

1. 运行 `./check-status.sh` 检查状态
2. 查看日志文件
3. 查看系统资源使用
4. 确认网络连接
5. 联系技术支持
