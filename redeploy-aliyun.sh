#!/bin/bash

echo "🚀 开始重新部署语音交流平台..."

# 设置环境变量
export NODE_ENV=production
export FORCE_HTTP=true
export HTTPS_REDIRECT=false
export PORT=3000
export HOST=0.0.0.0

# 停止现有服务
echo "🛑 停止现有服务..."
chmod +x stop-service.sh
./stop-service.sh

# 等待进程完全停止
echo "⏳ 等待进程停止..."
sleep 3

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

# 清理旧的node_modules（可选）
echo "🧹 清理旧的依赖..."
rm -rf node_modules package-lock.json

# 重新安装依赖
echo "📦 重新安装项目依赖..."
npm install --production

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p logs uploads

# 设置文件权限
echo "🔐 设置文件权限..."
chmod +x start-http.sh
chmod 755 logs uploads

# 清理旧日志
echo "🧹 清理旧日志..."
rm -f logs/*.log

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
    
    # 显示进程信息
    echo "📊 进程信息:"
    ps aux | grep "node server-optimized.js" | grep -v grep
    
    # 显示端口监听
    echo "🔍 端口监听:"
    netstat -tlnp | grep :3000
else
    echo "❌ 服务器启动失败，请检查日志:"
    tail -n 20 logs/startup.log
    exit 1
fi

echo "🎉 重新部署完成！"
