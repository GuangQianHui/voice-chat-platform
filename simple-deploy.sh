#!/bin/bash

# 语音交流平台 - 简化部署脚本（不使用Nginx）
# 适用于阿里云服务器

echo "=========================================="
echo "    语音交流平台 - 简化部署"
echo "=========================================="

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    echo "错误: 此脚本需要root权限"
    echo "请使用: sudo bash simple-deploy.sh"
    exit 1
fi

# 安装基础软件
echo "正在安装基础软件..."
yum update -y
yum install -y curl wget git

# 安装Node.js
echo "正在安装Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs

# 安装PM2
echo "正在安装PM2..."
npm install -g pm2

# 配置防火墙
echo "正在配置防火墙..."
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# 克隆项目
echo "正在克隆项目..."
mkdir -p /opt
cd /opt
git clone https://github.com/GuangQianHui/voice-chat-platform.git
cd voice-chat-platform

# 安装依赖
echo "正在安装项目依赖..."
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

# 启动应用
echo "正在启动应用..."
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "=========================================="
echo "          简化部署完成！"
echo "=========================================="
echo "项目目录: /opt/voice-chat-platform"
echo "应用端口: 3000"
echo ""
echo "访问地址:"
echo "  - 应用地址: http://$SERVER_IP:3000"
echo ""
echo "管理命令:"
echo "  - 查看状态: pm2 status"
echo "  - 查看日志: pm2 logs voice-chat-platform"
echo "  - 重启应用: pm2 restart voice-chat-platform"
echo "  - 停止应用: pm2 stop voice-chat-platform"
echo ""
echo "注意事项:"
echo "1. 请确保阿里云安全组已开放端口3000"
echo "2. 应用直接运行在3000端口，无需Nginx代理"
echo "3. 建议配置域名和SSL证书"
echo "=========================================="
