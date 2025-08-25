#!/bin/bash

# 语音交流平台 - 项目更新脚本
# 使用压缩包下载方式更新项目

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
echo "    语音交流平台 - 项目更新工具"
echo "=========================================="

PROJECT_DIR="/opt/voice-chat-platform"

# 检查root权限
if [[ $EUID -ne 0 ]]; then
    log_warning "建议使用root权限运行此脚本"
fi

# 检查项目目录是否存在
if [[ ! -d "$PROJECT_DIR" ]]; then
    log_error "项目目录不存在: $PROJECT_DIR"
    log_info "请先运行部署脚本"
    exit 1
fi

# 备份当前项目
log_info "正在备份当前项目..."
BACKUP_DIR="/backup/voice-chat-platform"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    -C $PROJECT_DIR \
    conversations/ \
    uploads/ \
    config.json \
    .env \
    logs/ \
    2>/dev/null || log_warning "备份部分文件失败"

log_success "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"

# 停止应用
log_info "正在停止应用..."
cd $PROJECT_DIR
pm2 stop voice-chat-platform 2>/dev/null || log_warning "应用未运行"

# 下载新版本
log_info "正在下载最新版本..."
cd /tmp
curl -fsSL -o voice-chat-platform.zip https://gitee.com/guangqianhui/voice-chat-platform/repository/archive/main.zip || {
    log_error "下载失败"
    exit 1
}

# 解压新版本
log_info "正在解压新版本..."
unzip -o voice-chat-platform.zip || {
    log_error "解压失败"
    exit 1
}

# 备份旧版本并安装新版本
log_info "正在安装新版本..."
cd $PROJECT_DIR
mkdir -p ../voice-chat-platform-old
mv * ../voice-chat-platform-old/ 2>/dev/null || true
mv .* ../voice-chat-platform-old/ 2>/dev/null || true

# 复制新文件
cp -r /tmp/voice-chat-platform-main/* . 2>/dev/null || true
cp -r /tmp/voice-chat-platform-main/.* . 2>/dev/null || true

# 恢复备份的数据
log_info "正在恢复数据..."
if [[ -d "../voice-chat-platform-old/conversations" ]]; then
    cp -r ../voice-chat-platform-old/conversations . 2>/dev/null || true
fi

if [[ -d "../voice-chat-platform-old/uploads" ]]; then
    cp -r ../voice-chat-platform-old/uploads . 2>/dev/null || true
fi

if [[ -f "../voice-chat-platform-old/.env" ]]; then
    cp ../voice-chat-platform-old/.env . 2>/dev/null || true
fi

if [[ -f "../voice-chat-platform-old/config.json" ]]; then
    cp ../voice-chat-platform-old/config.json . 2>/dev/null || true
fi

# 安装依赖
log_info "正在安装依赖..."
npm install --production || {
    log_error "依赖安装失败"
    log_info "正在回滚..."
    rm -rf *
    cp -r ../voice-chat-platform-old/* . 2>/dev/null || true
    cp -r ../voice-chat-platform-old/.* . 2>/dev/null || true
    exit 1
}

# 创建必要目录
mkdir -p logs uploads conversations

# 启动应用
log_info "正在启动应用..."
pm2 start ecosystem.config.js --env production || {
    log_error "应用启动失败"
    log_info "正在回滚..."
    rm -rf *
    cp -r ../voice-chat-platform-old/* . 2>/dev/null || true
    cp -r ../voice-chat-platform-old/.* . 2>/dev/null || true
    pm2 start ecosystem.config.js --env production
    exit 1
}

# 清理临时文件
log_info "正在清理临时文件..."
rm -rf /tmp/voice-chat-platform-main /tmp/voice-chat-platform.zip
rm -rf ../voice-chat-platform-old

# 检查应用状态
log_info "检查应用状态..."
sleep 3
if pm2 list | grep -q "voice-chat-platform.*online"; then
    log_success "更新成功！应用已启动"
else
    log_error "应用启动失败"
    pm2 logs voice-chat-platform --lines 10
    exit 1
fi

echo ""
echo "=========================================="
log_success "项目更新完成！"
echo "=========================================="
echo "项目目录: $PROJECT_DIR"
echo "备份位置: $BACKUP_DIR"
echo ""
echo "管理命令:"
echo "  - 查看状态: pm2 status"
echo "  - 查看日志: pm2 logs voice-chat-platform"
echo "  - 重启应用: pm2 restart voice-chat-platform"
echo "=========================================="
