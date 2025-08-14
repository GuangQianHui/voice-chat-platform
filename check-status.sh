#!/bin/bash

echo "🔍 检查当前服务状态..."

echo "📊 系统信息:"
echo "  操作系统: $(uname -a)"
echo "  内存使用: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "  磁盘使用: $(df -h / | tail -1 | awk '{print $5}')"

echo ""
echo "🔄 Node.js进程:"
ps aux | grep -E "(node|pm2)" | grep -v grep || echo "  没有Node.js进程运行"

echo ""
echo "🔍 端口监听:"
netstat -tlnp | grep -E ":(3000|80|443)" || echo "  没有相关端口监听"

echo ""
echo "📦 PM2状态:"
if command -v pm2 &> /dev/null; then
    pm2 status 2>/dev/null || echo "  PM2未运行"
else
    echo "  PM2未安装"
fi

echo ""
echo "🐳 Docker状态:"
if command -v docker &> /dev/null; then
    docker ps | grep -E "(voice-chat|nginx)" || echo "  没有相关Docker容器运行"
else
    echo "  Docker未安装"
fi

echo ""
echo "🔒 防火墙状态:"
if command -v ufw &> /dev/null; then
    sudo ufw status | head -10
else
    echo "  UFW未安装"
fi

echo ""
echo "📋 最近日志:"
if [ -f "logs/app.log" ]; then
    echo "  应用日志 (最后10行):"
    tail -n 10 logs/app.log
else
    echo "  应用日志文件不存在"
fi

if [ -f "logs/startup.log" ]; then
    echo "  启动日志 (最后10行):"
    tail -n 10 logs/startup.log
else
    echo "  启动日志文件不存在"
fi

echo ""
echo "🌐 网络连接测试:"
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "  ✅ 本地健康检查: 成功"
else
    echo "  ❌ 本地健康检查: 失败"
fi

echo ""
echo "📁 项目文件检查:"
if [ -f "server-optimized.js" ]; then
    echo "  ✅ server-optimized.js: 存在"
else
    echo "  ❌ server-optimized.js: 不存在"
fi

if [ -f "package.json" ]; then
    echo "  ✅ package.json: 存在"
else
    echo "  ❌ package.json: 不存在"
fi

if [ -d "node_modules" ]; then
    echo "  ✅ node_modules: 存在"
else
    echo "  ❌ node_modules: 不存在"
fi

echo ""
echo "🔍 检查完成！"
