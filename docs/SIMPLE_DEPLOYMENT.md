# 简化部署指南（不使用Nginx）

本文档将指导您如何在阿里云服务器上简化部署语音交流平台，不使用Nginx反向代理。

## 🚀 快速部署

### 方法一：一键部署（推荐）

在您的阿里云服务器上执行以下命令：

```bash
# 下载并执行一键部署脚本
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/simple-one-click.sh | sudo bash
```

### 方法二：手动部署

#### 1. 连接服务器

```bash
ssh root@您的服务器IP
```

#### 2. 下载部署脚本

```bash
# 下载简化部署脚本
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/simple-deploy.sh -o simple-deploy.sh
chmod +x simple-deploy.sh

# 执行部署
sudo bash simple-deploy.sh
```

## 📋 部署前准备

### 1. 服务器要求

- **操作系统**: Alibaba Cloud Linux 3.x / CentOS 7+ / RHEL 7+
- **内存**: 至少 2GB (推荐 4GB+)
- **存储**: 至少 10GB 可用空间
- **网络**: 稳定的互联网连接

### 2. 阿里云配置

#### 安全组配置

在阿里云控制台中配置安全组：

1. 登录阿里云控制台
2. 进入ECS实例详情
3. 点击"安全组"
4. 添加入方向规则：

| 协议类型 | 端口范围 | 授权对象 | 描述 |
|---------|---------|---------|------|
| 自定义TCP | 3000/3000 | 0.0.0.0/0 | 应用端口 |

## 🔧 部署步骤

### 1. 系统环境检查

```bash
# 检查系统版本
cat /etc/redhat-release

# 检查内存
free -h

# 检查磁盘空间
df -h
```

### 2. 安装基础软件

```bash
# 更新系统
yum update -y

# 安装基础工具
yum install -y curl wget git
```

### 3. 安装Node.js

```bash
# 安装NodeSource仓库
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -

# 安装Node.js
yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 4. 安装PM2

```bash
# 安装PM2
npm install -g pm2

# 验证安装
pm2 --version
```

### 5. 配置防火墙

```bash
# 开放应用端口
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 6. 部署应用

```bash
# 克隆项目
mkdir -p /opt
cd /opt
git clone https://github.com/GuangQianHui/voice-chat-platform.git
cd voice-chat-platform

# 安装依赖
npm install --production

# 创建必要目录
mkdir -p logs uploads conversations

# 创建环境配置
cat > .env << EOF
NODE_ENV=production
PORT=3000
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
LOG_PATH=./logs
EOF
```

### 7. 启动应用

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

## 🌐 访问配置

### 1. 直接访问

部署完成后，您可以通过以下地址访问：

```
http://您的服务器IP:3000
```

### 2. 域名配置（可选）

如果您有域名，可以：

1. 在阿里云DNS控制台添加A记录
2. 记录值指向您的服务器IP
3. 通过域名访问：`http://您的域名:3000`

## 📊 监控和维护

### 1. 应用状态监控

```bash
# 查看PM2状态
pm2 status

# 查看应用日志
pm2 logs voice-chat-platform

# 监控系统资源
pm2 monit
```

### 2. 系统资源监控

```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看进程
htop
```

### 3. 日志管理

```bash
# 查看应用日志
tail -f /opt/voice-chat-platform/logs/combined.log
```

## 🔄 更新和维护

### 1. 应用更新

```bash
cd /opt/voice-chat-platform

# 拉取最新代码
git pull origin main

# 安装依赖
npm install --production

# 重启应用
pm2 restart voice-chat-platform
```

### 2. 备份数据

```bash
# 创建备份脚本
cat > /opt/voice-chat-platform/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/voice-chat-platform"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    conversations/ \
    uploads/ \
    config.json \
    .env \
    logs/

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF

chmod +x /opt/voice-chat-platform/backup.sh

# 执行备份
/opt/voice-chat-platform/backup.sh
```

## 🛠️ 故障排除

### 1. 应用无法启动

```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查日志
pm2 logs voice-chat-platform

# 检查配置文件
cat /opt/voice-chat-platform/.env
```

### 2. 无法访问网站

```bash
# 检查防火墙
firewall-cmd --list-all

# 检查PM2状态
pm2 status

# 检查应用是否在运行
ps aux | grep node
```

### 3. 性能问题

```bash
# 检查内存使用
free -h

# 检查CPU使用
top

# 检查磁盘IO
iostat -x 1
```

## 📞 技术支持

如果遇到问题，请：

1. 查看应用日志：`pm2 logs voice-chat-platform`
2. 提交Issue到GitHub项目页面
3. 联系技术支持

## 📝 部署检查清单

- [ ] 服务器配置满足要求
- [ ] 阿里云安全组已配置端口3000
- [ ] Node.js 16.x 已安装
- [ ] PM2 已安装
- [ ] 防火墙已配置
- [ ] 项目代码已克隆
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] 应用已启动
- [ ] 监控已设置
- [ ] 备份策略已实施

## 🎯 简化部署的优势

1. **部署简单**: 无需配置Nginx，减少复杂性
2. **资源占用少**: 不安装Nginx，节省系统资源
3. **维护简单**: 只需要管理Node.js应用
4. **快速启动**: 部署时间更短

## ⚠️ 注意事项

1. **端口暴露**: 应用直接暴露在3000端口
2. **无反向代理**: 缺少负载均衡和缓存功能
3. **SSL配置**: 如需HTTPS，需要额外配置
4. **适合场景**: 适合小型应用和测试环境

部署完成后，您就可以通过 `http://您的服务器IP:3000` 访问您的语音交流平台了！🎉
