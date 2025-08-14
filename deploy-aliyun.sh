#!/bin/bash

echo "🚀 开始部署语音交流平台到阿里云服务器..."

# 设置环境变量
export NODE_ENV=production
export FORCE_HTTP=true
export HTTPS_REDIRECT=false
export PORT=3000
export HOST=0.0.0.0

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，正在安装..."
    sudo apt-get install -y npm
fi

# 显示版本信息
echo "📦 Node.js版本: $(node --version)"
echo "📦 npm版本: $(npm --version)"

# 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p logs
mkdir -p uploads

# 设置文件权限
echo "🔐 设置文件权限..."
chmod +x start-http.sh
chmod 755 logs
chmod 755 uploads

# 停止现有进程
echo "🛑 停止现有进程..."
pkill -f "node server-optimized.js" || true
pkill -f "pm2" || true

# 启动服务器
echo "🚀 启动服务器..."
nohup node server-optimized.js > logs/startup.log 2>&1 &

# 等待服务器启动
echo "⏳ 等待服务器启动..."
sleep 5

# 检查服务器状态
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 服务器启动成功！"
    echo "📍 访问地址: http://$(curl -s ifconfig.me):3000"
    echo "📊 健康检查: http://$(curl -s ifconfig.me):3000/api/health"
else
    echo "❌ 服务器启动失败，请检查日志:"
    tail -n 20 logs/startup.log
    exit 1
fi

echo "🎉 部署完成！"
