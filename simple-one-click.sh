#!/bin/bash

# 语音交流平台 - 一键部署脚本（不使用Nginx）
# 从GitHub下载并自动部署

echo "=========================================="
echo "    语音交流平台 - 一键部署（简化版）"
echo "=========================================="

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    echo "错误: 此脚本需要root权限"
    echo "请使用: sudo bash simple-one-click.sh"
    exit 1
fi

# 下载部署脚本
echo "正在下载部署脚本..."
curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/simple-deploy.sh -o /tmp/simple-deploy.sh

# 检查下载是否成功
if [[ ! -f /tmp/simple-deploy.sh ]]; then
    echo "错误: 无法下载部署脚本"
    echo "请检查网络连接或手动下载"
    exit 1
fi

# 设置执行权限
chmod +x /tmp/simple-deploy.sh

# 执行部署
echo "开始执行部署..."
bash /tmp/simple-deploy.sh

# 清理临时文件
rm -f /tmp/simple-deploy.sh

echo ""
echo "=========================================="
echo "          一键部署完成！"
echo "=========================================="
echo "如果部署成功，您应该看到访问地址"
echo "如果遇到问题，请查看上面的错误信息"
echo "=========================================="
