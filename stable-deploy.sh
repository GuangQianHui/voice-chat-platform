#!/bin/bash

# 语音交流平台 - 稳定部署脚本（不使用Nginx）
# 适用于阿里云服务器
# 版本: 2.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 错误处理函数
handle_error() {
    log_error "部署过程中发生错误，请检查上面的错误信息"
    log_error "如果问题持续存在，请查看日志文件或联系技术支持"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

echo "=========================================="
echo "    语音交流平台 - 稳定部署脚本"
echo "=========================================="

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    log_error "此脚本需要root权限"
    log_error "请使用: sudo bash stable-deploy.sh"
    exit 1
fi

# 检查系统类型
if [[ ! -f /etc/redhat-release ]]; then
    log_error "此脚本仅支持CentOS/RHEL/Alibaba Cloud Linux系统"
    exit 1
fi

log_info "开始部署语音交流平台..."

# 1. 系统更新
log_info "正在更新系统..."
yum update -y || {
    log_warning "系统更新失败，继续执行..."
}

# 2. 安装基础软件
log_info "正在安装基础软件..."
yum install -y curl wget unzip epel-release || {
    log_error "基础软件安装失败"
    exit 1
}

# 3. 检查并安装Node.js
log_info "正在检查Node.js..."
if ! command -v node &> /dev/null; then
    log_info "Node.js未安装，正在安装..."
    
    # 安装NodeSource仓库
    curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - || {
        log_error "NodeSource仓库安装失败"
        exit 1
    }
    
    # 安装Node.js
    yum install -y nodejs || {
        log_error "Node.js安装失败"
        exit 1
    }
else
    NODE_VERSION=$(node --version)
    log_success "Node.js已安装，版本: $NODE_VERSION"
fi

# 验证Node.js安装
node --version || {
    log_error "Node.js验证失败"
    exit 1
}

npm --version || {
    log_error "npm验证失败"
    exit 1
}

# 4. 安装PM2
log_info "正在安装PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 || {
        log_error "PM2安装失败"
        exit 1
    }
else
    PM2_VERSION=$(pm2 --version)
    log_success "PM2已安装，版本: $PM2_VERSION"
fi

# 5. 配置防火墙
log_info "正在配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=25812/tcp || {
    log_warning "防火墙配置失败，请手动开放端口25812"
}
    firewall-cmd --reload || {
        log_warning "防火墙重载失败"
    }
else
    log_warning "firewalld未安装，请手动配置防火墙"
fi

# 6. 创建项目目录
log_info "正在创建项目目录..."
PROJECT_DIR="/opt/voice-chat-platform"
mkdir -p $PROJECT_DIR || {
    log_error "无法创建项目目录"
    exit 1
}

# 7. 下载项目压缩包
cd $PROJECT_DIR
log_info "正在下载项目压缩包..."
curl -fsSL -o voice-chat-platform.zip https://gitee.com/guangqianhui/voice-chat-platform/repository/archive/main.zip || {
    log_error "项目压缩包下载失败"
    exit 1
}

log_info "正在解压项目文件..."
unzip -o voice-chat-platform.zip || {
    log_error "项目解压失败"
    exit 1
}

# 移动文件到正确位置
log_info "正在整理项目文件..."
cp -r voice-chat-platform-main/* . 2>/dev/null || true
cp -r voice-chat-platform-main/.* . 2>/dev/null || true

# 清理临时文件
rm -rf voice-chat-platform-main voice-chat-platform.zip

# 8. 检查必要文件
log_info "正在检查项目文件..."
if [[ ! -f "package.json" ]]; then
    log_error "package.json文件不存在"
    exit 1
fi

if [[ ! -f "server.js" ]]; then
    log_error "server.js文件不存在"
    exit 1
fi

# 9. 安装依赖
log_info "正在安装项目依赖..."
npm install --production || {
    log_error "依赖安装失败"
    exit 1
}

# 10. 创建必要目录
log_info "正在创建必要目录..."
mkdir -p logs uploads conversations || {
    log_error "无法创建必要目录"
    exit 1
}

# 11. 创建环境配置
log_info "正在创建环境配置..."
cat > .env << EOF
NODE_ENV=production
PORT=25812
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=info
LOG_PATH=./logs
EOF

# 12. 检查PM2配置文件
if [[ ! -f "ecosystem.config.js" ]]; then
    log_warning "ecosystem.config.js不存在，创建基本配置..."
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'voice-chat-platform',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
EOF
fi

# 13. 停止现有应用（如果存在）
log_info "正在检查现有应用..."
pm2 stop voice-chat-platform 2>/dev/null || true
pm2 delete voice-chat-platform 2>/dev/null || true

# 14. 启动应用
log_info "正在启动应用..."
pm2 start ecosystem.config.js --env production || {
    log_error "应用启动失败"
    log_info "正在查看PM2日志..."
    pm2 logs voice-chat-platform --lines 20
    exit 1
}

# 15. 保存PM2配置
log_info "正在保存PM2配置..."
pm2 save || {
    log_warning "PM2配置保存失败"
}

# 16. 设置开机自启
log_info "正在设置开机自启..."
pm2 startup || {
    log_warning "开机自启设置失败，请手动运行: pm2 startup"
}

# 17. 等待应用启动
log_info "等待应用启动..."
sleep 5

# 18. 检查应用状态
log_info "检查应用状态..."
if pm2 list | grep -q "voice-chat-platform.*online"; then
    log_success "应用启动成功！"
else
    log_error "应用启动失败"
    log_info "正在查看应用日志..."
    pm2 logs voice-chat-platform --lines 20
    exit 1
fi

# 19. 获取服务器IP
log_info "获取服务器IP..."
SERVER_IP=$(curl -s --max-time 10 ifconfig.me 2>/dev/null || echo "无法获取IP")

# 20. 创建管理脚本
log_info "创建管理脚本..."
cat > /opt/voice-chat-platform/manage.sh << 'EOF'
#!/bin/bash

PROJECT_DIR="/opt/voice-chat-platform"
cd $PROJECT_DIR

case "$1" in
    start)
        echo "启动应用..."
        pm2 start ecosystem.config.js --env production
        ;;
    stop)
        echo "停止应用..."
        pm2 stop voice-chat-platform
        ;;
    restart)
        echo "重启应用..."
        pm2 restart voice-chat-platform
        ;;
    status)
        echo "应用状态:"
        pm2 status
        ;;
    logs)
        echo "应用日志:"
        pm2 logs voice-chat-platform
        ;;
    update)
        echo "更新应用..."
        echo "正在下载更新脚本..."
        curl -fsSL https://raw.githubusercontent.com/GuangQianHui/voice-chat-platform/main/update-project.sh -o /tmp/update-project.sh
        chmod +x /tmp/update-project.sh
        bash /tmp/update-project.sh
        rm -f /tmp/update-project.sh
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs|update}"
        exit 1
        ;;
esac
EOF

chmod +x /opt/voice-chat-platform/manage.sh

# 21. 显示部署结果
echo ""
echo "=========================================="
log_success "部署完成！"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "应用端口: 25812"
echo ""
echo "访问地址:"
if [[ "$SERVER_IP" != "无法获取IP" ]]; then
    echo "  - 应用地址: http://$SERVER_IP:25812"
else
    echo "  - 应用地址: http://您的服务器IP:25812"
fi
echo ""
echo "管理命令:"
echo "  - 查看状态: pm2 status"
echo "  - 查看日志: pm2 logs voice-chat-platform"
echo "  - 重启应用: pm2 restart voice-chat-platform"
echo "  - 停止应用: pm2 stop voice-chat-platform"
echo "  - 使用管理脚本: $PROJECT_DIR/manage.sh {start|stop|restart|status|logs|update}"
echo ""
echo "注意事项:"
echo "1. 请确保阿里云安全组已开放端口25812"
echo "2. 应用直接运行在25812端口，无需Nginx代理"
echo "3. 建议配置域名和SSL证书"
echo "4. 如果遇到问题，请查看日志: pm2 logs voice-chat-platform"
echo "=========================================="

log_success "部署脚本执行完成！"
