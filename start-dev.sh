#!/bin/bash

echo "🚀 启动语音交流平台开发环境..."
echo

# 设置环境变量
export NODE_ENV=development
export PORT=3000

# 检查端口是否被占用
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "[警告] 端口3000已被占用，正在尝试关闭..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

# 启动服务器
echo "[信息] 正在启动服务器..."
echo "[信息] 访问地址: http://localhost:3000"
echo "[信息] 健康检查: http://localhost:3000/api/health"
echo

node server-optimized.js
