#!/bin/bash

echo "========================================"
echo "语音交流平台 - HTTPS启动脚本"
echo "========================================"
echo

# 检查Node.js环境
echo "正在检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "✅ Node.js环境检查通过"
echo

# 检查OpenSSL
echo "正在检查OpenSSL..."
if ! command -v openssl &> /dev/null; then
    echo "⚠️  警告: 未找到OpenSSL，将使用HTTP模式"
    echo "建议安装OpenSSL以获得更好的安全性"
    echo
else
    echo "✅ OpenSSL检查通过"
    echo
fi

# 安装依赖
echo "正在安装依赖包..."
if ! npm install; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo

# 启动服务器
echo "正在启动HTTPS服务器..."
echo "请稍候..."
echo

node server-optimized.js
