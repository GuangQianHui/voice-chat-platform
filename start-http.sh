#!/bin/bash

echo "🚀 启动语音交流平台HTTP服务..."
echo

# 设置环境变量
export NODE_ENV=development
export PORT=25812
export PROTOCOL=http

# 检查端口是否被占用
if lsof -Pi :25812 -sTCP:LISTEN -t >/dev/null ; then
    echo "[警告] 端口25812已被占用，正在尝试关闭..."
    lsof -ti:25812 | xargs kill -9
    sleep 2
fi

# 启动服务器
echo "[信息] 正在启动HTTP服务器..."
echo "[信息] 访问地址: http://localhost:25812"
echo "[信息] 健康检查: http://localhost:25812/api/health"
echo "[信息] 请使用HTTP协议访问，不要使用HTTPS"
echo

node server-optimized.js
