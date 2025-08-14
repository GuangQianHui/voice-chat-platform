#!/bin/bash

echo "🛑 停止现有服务..."

# 停止PM2进程
if command -v pm2 &> /dev/null; then
    echo "📦 停止PM2进程..."
    pm2 stop voice-chat-platform 2>/dev/null || true
    pm2 delete voice-chat-platform 2>/dev/null || true
    pm2 kill 2>/dev/null || true
fi

# 停止Node.js进程
echo "🔄 停止Node.js进程..."
pkill -f "node server-optimized.js" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# 停止Docker容器（如果使用）
echo "🐳 停止Docker容器..."
docker-compose down 2>/dev/null || true
docker stop voice-chat-platform 2>/dev/null || true
docker stop voice-chat-nginx 2>/dev/null || true

# 检查是否还有进程在运行
echo "🔍 检查剩余进程..."
ps aux | grep -E "(node|pm2)" | grep -v grep

# 强制杀死剩余进程
echo "💀 强制杀死剩余进程..."
pkill -9 -f "node" 2>/dev/null || true
pkill -9 -f "pm2" 2>/dev/null || true

# 检查端口占用
echo "🔍 检查端口占用..."
lsof -i :3000 2>/dev/null || echo "端口3000未被占用"
lsof -i :80 2>/dev/null || echo "端口80未被占用"

echo "✅ 服务停止完成！"
