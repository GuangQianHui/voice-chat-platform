#!/bin/bash

# 语音交流平台 - Docker部署脚本
# 适用于阿里云服务器

echo "=========================================="
echo "    语音交流平台 - Docker部署"
echo "=========================================="

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    echo "错误: 此脚本需要root权限"
    echo "请使用: sudo bash docker-deploy.sh"
    exit 1
fi

# 安装Docker
echo "正在安装Docker..."
yum install -y docker
systemctl start docker
systemctl enable docker

# 安装Docker Compose
echo "正在安装Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 配置防火墙
echo "正在配置防火墙..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 克隆项目
echo "正在克隆项目..."
mkdir -p /opt
cd /opt
git clone https://gitee.com/guangqianhui/voice-chat-platform.git
cd voice-chat-platform

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

# 构建并启动容器
echo "正在构建并启动容器..."
docker-compose up -d

# 等待容器启动
echo "等待容器启动..."
sleep 10

# 检查容器状态
echo "检查容器状态..."
docker-compose ps

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "=========================================="
echo "          Docker部署完成！"
echo "=========================================="
echo "项目目录: /opt/voice-chat-platform"
echo "容器名称: voice-chat-platform"
echo ""
echo "访问地址:"
echo "  - 应用地址: http://$SERVER_IP:3000"
echo ""
echo "管理命令:"
echo "  - 查看状态: docker-compose ps"
echo "  - 查看日志: docker-compose logs -f"
echo "  - 重启服务: docker-compose restart"
echo "  - 停止服务: docker-compose down"
echo "  - 更新服务: docker-compose pull && docker-compose up -d"
echo ""
echo "注意事项:"
echo "1. 请确保阿里云安全组已开放端口3000"
echo "2. 建议配置域名和SSL证书"
echo "3. 数据存储在 ./uploads 和 ./conversations 目录"
echo "=========================================="
