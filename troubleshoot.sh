#!/bin/bash

# 语音交流平台 - 故障排除脚本
# 用于诊断和修复常见问题

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

echo "=========================================="
echo "    语音交流平台 - 故障排除工具"
echo "=========================================="

PROJECT_DIR="/opt/voice-chat-platform"

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    log_warning "建议使用root权限运行此脚本以获得完整功能"
fi

# 1. 系统信息检查
echo ""
log_info "=== 系统信息检查 ==="
echo "操作系统: $(cat /etc/redhat-release 2>/dev/null || echo '未知')"
echo "内核版本: $(uname -r)"
echo "内存使用: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "磁盘使用: $(df -h / | tail -1 | awk '{print $5}')"

# 2. Node.js检查
echo ""
log_info "=== Node.js检查 ==="
if command -v node &> /dev/null; then
    echo "Node.js版本: $(node --version)"
    echo "npm版本: $(npm --version)"
else
    log_error "Node.js未安装"
fi

# 3. PM2检查
echo ""
log_info "=== PM2检查 ==="
if command -v pm2 &> /dev/null; then
    echo "PM2版本: $(pm2 --version)"
    echo "PM2状态:"
    pm2 status 2>/dev/null || echo "PM2未运行"
else
    log_error "PM2未安装"
fi

# 4. 项目文件检查
echo ""
log_info "=== 项目文件检查 ==="
if [[ -d "$PROJECT_DIR" ]]; then
    echo "项目目录: $PROJECT_DIR"
    echo "package.json: $([[ -f "$PROJECT_DIR/package.json" ]] && echo "存在" || echo "不存在")"
    echo "server.js: $([[ -f "$PROJECT_DIR/server.js" ]] && echo "存在" || echo "不存在")"
    echo "ecosystem.config.js: $([[ -f "$PROJECT_DIR/ecosystem.config.js" ]] && echo "存在" || echo "不存在")"
    echo ".env: $([[ -f "$PROJECT_DIR/.env" ]] && echo "存在" || echo "不存在")"
else
    log_error "项目目录不存在: $PROJECT_DIR"
fi

# 5. 端口检查
echo ""
log_info "=== 端口检查 ==="
if command -v netstat &> /dev/null; then
    echo "端口3000状态:"
    netstat -tlnp | grep :3000 || echo "端口3000未监听"
else
    echo "netstat命令不可用"
fi

# 6. 防火墙检查
echo ""
log_info "=== 防火墙检查 ==="
if command -v firewall-cmd &> /dev/null; then
    echo "防火墙状态: $(firewall-cmd --state)"
    echo "端口3000规则:"
    firewall-cmd --list-ports | grep 3000 || echo "端口3000未开放"
else
    log_warning "firewalld未安装"
fi

# 7. 应用日志检查
echo ""
log_info "=== 应用日志检查 ==="
if [[ -d "$PROJECT_DIR" ]]; then
    cd "$PROJECT_DIR"
    if [[ -f "logs/combined.log" ]]; then
        echo "最新日志 (最后10行):"
        tail -10 logs/combined.log
    else
        echo "日志文件不存在"
    fi
    
    if command -v pm2 &> /dev/null; then
        echo ""
        echo "PM2日志 (最后10行):"
        pm2 logs voice-chat-platform --lines 10 2>/dev/null || echo "无法获取PM2日志"
    fi
fi

# 8. 网络连接检查
echo ""
log_info "=== 网络连接检查 ==="
echo "外网连接测试:"
if curl -s --max-time 5 https://www.baidu.com &> /dev/null; then
    log_success "外网连接正常"
else
    log_error "外网连接失败"
fi

echo "GitHub连接测试:"
if curl -s --max-time 5 https://github.com &> /dev/null; then
    log_success "GitHub连接正常"
else
    log_error "GitHub连接失败"
fi

# 9. 常见问题修复
echo ""
log_info "=== 常见问题修复 ==="

# 修复权限问题
if [[ -d "$PROJECT_DIR" ]]; then
    log_info "修复项目目录权限..."
    chown -R root:root "$PROJECT_DIR" 2>/dev/null || true
    chmod -R 755 "$PROJECT_DIR" 2>/dev/null || true
fi

# 重启PM2（如果存在）
if command -v pm2 &> /dev/null; then
    log_info "重启PM2..."
    pm2 kill 2>/dev/null || true
    sleep 2
    pm2 resurrect 2>/dev/null || true
fi

# 清理npm缓存
if command -v npm &> /dev/null; then
    log_info "清理npm缓存..."
    npm cache clean --force 2>/dev/null || true
fi

# 10. 修复建议
echo ""
log_info "=== 修复建议 ==="

if ! command -v node &> /dev/null; then
    echo "1. 安装Node.js: curl -fsSL https://rpm.nodesource.com/setup_16.x | bash - && yum install -y nodejs"
fi

if ! command -v pm2 &> /dev/null; then
    echo "2. 安装PM2: npm install -g pm2"
fi

if [[ ! -d "$PROJECT_DIR" ]]; then
    echo "3. 重新部署项目: 下载并解压项目压缩包到 $PROJECT_DIR"
fi

if ! netstat -tlnp | grep :3000 &> /dev/null; then
    echo "4. 启动应用: cd $PROJECT_DIR && pm2 start ecosystem.config.js --env production"
fi

if command -v firewall-cmd &> /dev/null && ! firewall-cmd --list-ports | grep 3000 &> /dev/null; then
    echo "5. 开放防火墙端口: firewall-cmd --permanent --add-port=3000/tcp && firewall-cmd --reload"
fi

echo ""
echo "=========================================="
log_info "故障排除完成！"
echo "=========================================="
echo "如果问题仍然存在，请："
echo "1. 查看详细日志: pm2 logs voice-chat-platform"
echo "2. 检查系统资源: htop, free -h, df -h"
echo "3. 提交Issue到GitHub项目页面"
echo "=========================================="
