#!/bin/bash

# 语音交流平台 - 阿里云服务器部署脚本
# 作者: GuangQianHui
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 配置变量
PROJECT_NAME="voice-chat-platform"
PROJECT_URL="https://gitee.com/guangqianhui/voice-chat-platform.git"
PROJECT_DIR="/opt/$PROJECT_NAME"
NODE_VERSION="16"
PM2_APP_NAME="voice-chat-platform"
PORT="25812"

# 检查是否为root用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "此脚本需要root权限运行"
        log_info "请使用: sudo bash deploy.sh"
        exit 1
    fi
}

# 检查系统版本
check_system() {
    log_step "检查系统环境..."
    
    if [[ -f /etc/redhat-release ]]; then
        OS_VERSION=$(cat /etc/redhat-release)
        log_info "检测到系统: $OS_VERSION"
    else
        log_error "不支持的操作系统，请使用CentOS/RHEL/Alibaba Cloud Linux"
        exit 1
    fi
    
    # 检查内存
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [[ $MEMORY -lt 1024 ]]; then
        log_warn "系统内存不足1GB，建议至少2GB内存"
    fi
    
    # 检查磁盘空间
    DISK_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $DISK_SPACE -lt 5 ]]; then
        log_warn "磁盘空间不足5GB，建议至少10GB可用空间"
    fi
}

# 检查并安装基础软件
check_and_install_basic_software() {
    log_step "检查并安装基础软件..."
    
    # 检查并安装curl
    if ! command -v curl &> /dev/null; then
        log_info "安装curl..."
        yum install -y curl
    else
        log_info "curl已安装"
    fi
    
    # 检查并安装wget
    if ! command -v wget &> /dev/null; then
        log_info "安装wget..."
        yum install -y wget
    else
        log_info "wget已安装"
    fi
    
    # 检查并安装git
    if ! command -v git &> /dev/null; then
        log_info "安装git..."
        yum install -y git
    else
        log_info "git已安装"
    fi
    
    # 检查并安装vim
    if ! command -v vim &> /dev/null; then
        log_info "安装vim..."
        yum install -y vim
    else
        log_info "vim已安装"
    fi
    
    # 检查并安装htop
    if ! command -v htop &> /dev/null; then
        log_info "安装htop..."
        yum install -y htop
    else
        log_info "htop已安装"
    fi
}

# 更新系统
update_system() {
    log_step "更新系统包..."
    yum update -y
}

# 安装Node.js
install_nodejs() {
    log_step "检查并安装Node.js $NODE_VERSION..."
    
    # 检查Node.js是否已安装
    if command -v node &> /dev/null; then
        NODE_CURRENT_VERSION=$(node --version)
        log_info "Node.js已安装: $NODE_CURRENT_VERSION"
        
        # 检查版本是否满足要求
        if [[ "$NODE_CURRENT_VERSION" == v16* ]] || [[ "$NODE_CURRENT_VERSION" == v18* ]] || [[ "$NODE_CURRENT_VERSION" == v20* ]]; then
            log_info "Node.js版本满足要求，跳过安装"
            return 0
        else
            log_warn "Node.js版本过低 ($NODE_CURRENT_VERSION)，将重新安装"
        fi
    else
        log_info "Node.js未安装，开始安装..."
    fi
    
    # 检查npm是否已安装
    if command -v npm &> /dev/null; then
        NPM_CURRENT_VERSION=$(npm --version)
        log_info "npm已安装: $NPM_CURRENT_VERSION"
    fi
    
    # 安装NodeSource仓库
    log_info "安装NodeSource仓库..."
    curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
    
    # 安装Node.js
    log_info "安装Node.js..."
    yum install -y nodejs
    
    # 验证安装
    NODE_VERSION_INSTALLED=$(node --version)
    NPM_VERSION_INSTALLED=$(npm --version)
    log_info "Node.js安装成功: $NODE_VERSION_INSTALLED"
    log_info "npm安装成功: $NPM_VERSION_INSTALLED"
}

# 安装PM2
install_pm2() {
    log_step "检查并安装PM2..."
    
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log_info "PM2已安装: $PM2_VERSION"
        return 0
    fi
    
    log_info "PM2未安装，开始安装..."
    npm install -g pm2
    
    # 验证安装
    PM2_VERSION=$(pm2 --version)
    log_info "PM2安装成功: $PM2_VERSION"
}

# 安装Nginx
install_nginx() {
    log_step "检查并安装Nginx..."
    
    if command -v nginx &> /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1)
        log_info "Nginx已安装: $NGINX_VERSION"
        
        # 检查Nginx服务状态
        if systemctl is-active --quiet nginx; then
            log_info "Nginx服务正在运行"
        else
            log_warn "Nginx服务未运行，正在启动..."
            systemctl start nginx
            systemctl enable nginx
        fi
        return 0
    fi
    
    log_info "Nginx未安装，开始安装..."
    yum install -y nginx
    
    # 启动并设置开机自启
    systemctl start nginx
    systemctl enable nginx
    
    log_info "Nginx安装并启动成功"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙..."
    
    # 检查firewalld是否运行
    if systemctl is-active --quiet firewalld; then
        log_info "firewalld正在运行，配置防火墙规则..."
        
        # 检查端口是否已开放
        if firewall-cmd --list-ports | grep -q "$PORT/tcp"; then
            log_info "端口 $PORT 已开放"
        else
            log_info "开放端口 $PORT..."
            firewall-cmd --permanent --add-port=$PORT/tcp
        fi
        
        # 检查HTTP服务是否已开放
        if firewall-cmd --list-services | grep -q "http"; then
            log_info "HTTP服务已开放"
        else
            log_info "开放HTTP服务..."
            firewall-cmd --permanent --add-service=http
        fi
        
        # 检查HTTPS服务是否已开放
        if firewall-cmd --list-services | grep -q "https"; then
            log_info "HTTPS服务已开放"
        else
            log_info "开放HTTPS服务..."
            firewall-cmd --permanent --add-service=https
        fi
        
        firewall-cmd --reload
        log_info "防火墙规则配置完成"
    else
        log_warn "firewalld未运行，请手动配置防火墙或安全组"
        log_info "需要开放的端口: $PORT (TCP)"
    fi
}

# 克隆项目
clone_project() {
    log_step "克隆项目代码..."
    
    # 创建项目目录
    mkdir -p /opt
    cd /opt
    
    # 如果目录已存在，备份并重新克隆
    if [[ -d "$PROJECT_DIR" ]]; then
        log_warn "项目目录已存在，备份原目录..."
        mv "$PROJECT_DIR" "${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 克隆项目
    git clone "$PROJECT_URL" "$PROJECT_NAME"
    cd "$PROJECT_DIR"
    
    log_info "项目克隆成功: $PROJECT_DIR"
}

# 安装项目依赖
install_dependencies() {
    log_step "安装项目依赖..."
    
    cd "$PROJECT_DIR"
    
    # 安装依赖
    npm install --production
    
    log_info "项目依赖安装完成"
}

# 创建环境配置
create_env_config() {
    log_step "创建环境配置文件..."
    
    cd "$PROJECT_DIR"
    
    # 创建.env文件
    cat > .env << EOF
# 服务器配置
NODE_ENV=production
PORT=$PORT

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800

# 日志配置
LOG_LEVEL=info
LOG_PATH=./logs

# 数据库配置（如果需要）
# DB_HOST=localhost
# DB_PORT=27017
# DB_NAME=voice_chat_platform
EOF
    
    # 创建必要的目录
    mkdir -p logs uploads conversations
    
    # 设置权限
    chown -R root:root "$PROJECT_DIR"
    chmod -R 755 "$PROJECT_DIR"
    
    log_info "环境配置创建完成"
}

# 配置PM2
configure_pm2() {
    log_step "配置PM2..."
    
    cd "$PROJECT_DIR"
    
    # 停止已存在的应用
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
    
    # 启动应用
    pm2 start ecosystem.config.js --env production
    
    # 保存PM2配置
    pm2 save
    
    # 设置开机自启
    pm2 startup
    
    log_info "PM2配置完成"
}

# 配置Nginx
configure_nginx() {
    log_step "配置Nginx反向代理..."
    
    # 创建Nginx配置文件
    cat > /etc/nginx/conf.d/voice-chat.conf << EOF
server {
    listen 80;
    server_name _;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 静态文件缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:$PORT;
    }
    
    # API路由
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket支持
    location /socket.io/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # 主应用
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # 测试Nginx配置
    nginx -t
    
    # 重启Nginx
    systemctl restart nginx
    
    log_info "Nginx配置完成"
}

# 创建管理脚本
create_management_scripts() {
    log_step "创建管理脚本..."
    
    cd "$PROJECT_DIR"
    
    # 创建启动脚本
    cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/voice-chat-platform
pm2 start ecosystem.config.js --env production
echo "应用已启动"
EOF
    
    # 创建停止脚本
    cat > stop.sh << 'EOF'
#!/bin/bash
pm2 stop voice-chat-platform
echo "应用已停止"
EOF
    
    # 创建重启脚本
    cat > restart.sh << 'EOF'
#!/bin/bash
cd /opt/voice-chat-platform
pm2 restart voice-chat-platform
echo "应用已重启"
EOF
    
    # 创建状态查看脚本
    cat > status.sh << 'EOF'
#!/bin/bash
echo "=== PM2 状态 ==="
pm2 status
echo ""
echo "=== 系统资源 ==="
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h
echo ""
echo "=== 应用日志 ==="
tail -n 20 logs/combined.log 2>/dev/null || echo "日志文件不存在"
EOF
    
    # 创建更新脚本
    cat > update.sh << 'EOF'
#!/bin/bash
cd /opt/voice-chat-platform
echo "开始更新应用..."
git pull origin main
npm install --production
pm2 restart voice-chat-platform
echo "更新完成: $(date)"
EOF
    
    # 创建备份脚本
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/voice-chat-platform"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "开始备份..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    conversations/ \
    uploads/ \
    config.json \
    .env \
    logs/

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF
    
    # 设置脚本权限
    chmod +x *.sh
    
    log_info "管理脚本创建完成"
}

# 创建系统服务
create_systemd_service() {
    log_step "创建系统服务..."
    
    cat > /etc/systemd/system/voice-chat-platform.service << EOF
[Unit]
Description=Voice Chat Platform
After=network.target

[Service]
Type=forking
User=root
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload voice-chat-platform
ExecStop=/usr/bin/pm2 stop voice-chat-platform
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # 重新加载systemd
    systemctl daemon-reload
    
    # 启用服务
    systemctl enable voice-chat-platform.service
    
    log_info "系统服务创建完成"
}

# 显示部署信息
show_deployment_info() {
    log_step "部署完成！"
    
    echo ""
    echo "=========================================="
    echo "          部署信息"
    echo "=========================================="
    echo "项目名称: $PROJECT_NAME"
    echo "项目目录: $PROJECT_DIR"
    echo "应用端口: $PORT"
    echo "PM2应用名: $PM2_APP_NAME"
    echo ""
    echo "访问地址:"
    echo "  - 直接访问: http://$(curl -s ifconfig.me):$PORT"
    echo "  - Nginx代理: http://$(curl -s ifconfig.me)"
    echo ""
    echo "管理命令:"
    echo "  - 查看状态: pm2 status"
    echo "  - 查看日志: pm2 logs $PM2_APP_NAME"
    echo "  - 重启应用: pm2 restart $PM2_APP_NAME"
    echo "  - 停止应用: pm2 stop $PM2_APP_NAME"
    echo ""
    echo "项目脚本:"
    echo "  - 启动: $PROJECT_DIR/start.sh"
    echo "  - 停止: $PROJECT_DIR/stop.sh"
    echo "  - 重启: $PROJECT_DIR/restart.sh"
    echo "  - 状态: $PROJECT_DIR/status.sh"
    echo "  - 更新: $PROJECT_DIR/update.sh"
    echo "  - 备份: $PROJECT_DIR/backup.sh"
    echo ""
    echo "系统服务:"
    echo "  - 启动: systemctl start voice-chat-platform"
    echo "  - 停止: systemctl stop voice-chat-platform"
    echo "  - 状态: systemctl status voice-chat-platform"
    echo ""
    echo "注意事项:"
    echo "1. 请确保阿里云安全组已开放端口80和$PORT"
    echo "2. 建议配置域名和SSL证书"
    echo "3. 定期运行备份脚本"
    echo "4. 监控系统资源使用情况"
    echo "=========================================="
}

# 主函数
main() {
    echo "=========================================="
    echo "    语音交流平台 - 阿里云服务器部署"
    echo "=========================================="
    echo ""
    
    # 检查root权限
    check_root
    
    # 检查系统环境
    check_system
    
    # 更新系统
    update_system
    
    # 检查并安装基础软件
    check_and_install_basic_software
    
    # 安装Node.js
    install_nodejs
    
    # 安装PM2
    install_pm2
    
    # 安装Nginx
    install_nginx
    
    # 配置防火墙
    configure_firewall
    
    # 克隆项目
    clone_project
    
    # 安装依赖
    install_dependencies
    
    # 创建环境配置
    create_env_config
    
    # 配置PM2
    configure_pm2
    
    # 配置Nginx
    configure_nginx
    
    # 创建管理脚本
    create_management_scripts
    
    # 创建系统服务
    create_systemd_service
    
    # 显示部署信息
    show_deployment_info
    
    log_info "部署脚本执行完成！"
}

# 执行主函数
main "$@"
