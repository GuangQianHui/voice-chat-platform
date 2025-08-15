#!/bin/bash

echo "启动语音交流平台（HTTP模式）..."

# 设置环境变量强制使用HTTP
export NODE_ENV=production
export FORCE_HTTP=true
export HTTPS_REDIRECT=false

# 启动服务器
node server-optimized.js
