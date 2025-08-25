# 阿里云服务器部署指南

本文档将指导您如何在阿里云服务器上部署语音交流平台。

## 🚀 快速部署

### 方法一：一键部署（推荐）

在您的阿里云服务器上执行以下命令：

```bash
# 下载并执行一键部署脚本
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/one-click-deploy.sh | sudo bash
```

### 方法二：手动部署

#### 1. 连接服务器

```bash
ssh root@您的服务器IP
```

#### 2. 下载部署脚本

```bash
# 下载快速部署脚本
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/quick-deploy.sh -o quick-deploy.sh
chmod +x quick-deploy.sh

# 执行部署
sudo bash quick-deploy.sh
```

### 方法三：Docker部署

```bash
# 下载Docker部署脚本
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/docker-deploy.sh -o docker-deploy.sh
chmod +x docker-deploy.sh

# 执行Docker部署
sudo bash docker-deploy.sh
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
| HTTP | 80/80 | 0.0.0.0/0 | Web访问 |
| HTTPS | 443/443 | 0.0.0.0/0 | HTTPS访问 |
| 自定义TCP | 3000/3000 | 0.0.0.0/0 | 应用端口 |

#### 弹性IP（可选）

如果您的服务器没有固定公网IP，建议绑定弹性IP。

## 🔧 详细部署步骤

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
yum install -y curl wget git vim htop
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

### 5. 安装Nginx

```bash
# 安装Nginx
yum install -y nginx

# 启动并设置开机自启
systemctl start nginx
systemctl enable nginx
```

### 6. 配置防火墙

```bash
# 开放必要端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload
```

### 7. 部署应用

```bash
# 克隆项目
mkdir -p /opt
cd /opt
git clone https://gitee.com/guangqianhui/voice-chat-platform.git
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

### 8. 配置Nginx

```bash
# 创建Nginx配置文件
cat > /etc/nginx/conf.d/voice-chat.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
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
EOF

# 测试并重启Nginx
nginx -t
systemctl restart nginx
```

### 9. 启动应用

```bash
# 启动应用
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

## 🌐 域名和SSL配置

### 1. 域名解析

如果您有域名，请在阿里云DNS控制台添加解析记录：

- **记录类型**: A
- **主机记录**: @ 或 www
- **记录值**: 您的服务器IP

### 2. SSL证书配置

#### 使用Let's Encrypt免费证书

```bash
# 安装certbot
yum install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d 您的域名.com

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

#### 使用阿里云免费证书

1. 在阿里云控制台申请免费SSL证书
2. 下载证书文件
3. 配置Nginx使用证书

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

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
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

### 3. 系统更新

```bash
# 更新系统包
yum update -y

# 重启系统（如果需要）
reboot
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

# 检查Nginx状态
systemctl status nginx

# 检查PM2状态
pm2 status
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
2. 查看系统日志：`journalctl -u nginx`
3. 提交Issue到GitHub项目页面
4. 联系技术支持

## 📝 部署检查清单

- [ ] 服务器配置满足要求
- [ ] 阿里云安全组已配置
- [ ] Node.js 16.x 已安装
- [ ] PM2 已安装
- [ ] Nginx 已安装并配置
- [ ] 防火墙已配置
- [ ] 项目代码已克隆
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] 应用已启动
- [ ] 域名解析已配置（如需要）
- [ ] SSL证书已配置（如需要）
- [ ] 监控已设置
- [ ] 备份策略已实施

部署完成后，您就可以通过公网IP或域名访问您的语音交流平台了！🎉
