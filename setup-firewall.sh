#!/bin/bash

echo "🔒 配置防火墙..."

# 更新系统
sudo apt-get update

# 安装ufw防火墙
sudo apt-get install -y ufw

# 设置默认策略
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允许SSH连接
sudo ufw allow ssh

# 允许HTTP端口
sudo ufw allow 80

# 允许应用端口
sudo ufw allow 3000

# 启用防火墙
sudo ufw --force enable

# 显示防火墙状态
echo "📊 防火墙状态:"
sudo ufw status

echo "✅ 防火墙配置完成！"
