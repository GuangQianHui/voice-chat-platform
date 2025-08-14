#!/bin/bash

# 语音交流平台部署脚本
# 使用方法: ./deploy.sh [production|development]

set -e

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

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装，将使用传统部署方式"
        USE_DOCKER=false
    else
        USE_DOCKER=true
    fi
    
    log_success "依赖检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    npm ci --only=production
    log_success "依赖安装完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    mkdir -p logs uploads
    log_success "目录创建完成"
}

# 环境检查
check_environment() {
    log_info "检查环境配置..."
    
    if [ ! -f "config.js" ]; then
        log_error "配置文件 config.js 不存在"
        exit 1
    fi
    
    if [ ! -f "server-optimized.js" ]; then
        log_error "优化服务器文件 server-optimized.js 不存在"
        exit 1
    fi
    
    log_success "环境检查完成"
}

# 传统部署
deploy_traditional() {
    log_info "开始传统部署..."
    
    # 停止现有进程
    if pgrep -f "node.*server" > /dev/null; then
        log_info "停止现有服务..."
        pkill -f "node.*server"
        sleep 2
    fi
    
    # 启动服务
    log_info "启动服务..."
    nohup node server-optimized.js > logs/app.log 2>&1 &
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if curl -f http://localhost:25812/api/health > /dev/null 2>&1; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败，请检查日志"
        exit 1
    fi
}

# Docker部署
deploy_docker() {
    log_info "开始Docker部署..."
    
    # 构建镜像
    log_info "构建Docker镜像..."
    docker build -t voice-chat-platform .
    
    # 停止现有容器
    if docker ps -q -f name=voice-chat-platform > /dev/null; then
        log_info "停止现有容器..."
        docker stop voice-chat-platform
        docker rm voice-chat-platform
    fi
    
    # 启动容器
    log_info "启动Docker容器..."
    docker run -d \
        --name voice-chat-platform \
        -p 25812:25812 \
        -v $(pwd)/logs:/app/logs \
        -v $(pwd)/uploads:/app/uploads \
        -v $(pwd)/resources:/app/resources \
        --restart unless-stopped \
        voice-chat-platform
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    if curl -f http://localhost:25812/api/health > /dev/null 2>&1; then
        log_success "Docker服务启动成功"
    else
        log_error "Docker服务启动失败，请检查日志"
        docker logs voice-chat-platform
        exit 1
    fi
}

# Docker Compose部署
deploy_compose() {
    log_info "开始Docker Compose部署..."
    
    # 停止现有服务
    if docker-compose ps | grep -q "voice-chat-platform"; then
        log_info "停止现有服务..."
        docker-compose down
    fi
    
    # 启动服务
    log_info "启动Docker Compose服务..."
    docker-compose up -d
    
    # 等待服务启动
    sleep 15
    
    # 检查服务状态
    if curl -f http://localhost:80/health > /dev/null 2>&1; then
        log_success "Docker Compose服务启动成功"
        log_info "访问地址: http://localhost"
    else
        log_error "Docker Compose服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    log_success "部署完成！"
    echo ""
    echo "📊 服务信息:"
    echo "   - 健康检查: http://localhost:3000/api/health"
    echo "   - 主应用: http://localhost:3000"
    
    if [ "$USE_DOCKER" = true ] && [ -f "docker-compose.yml" ]; then
        echo "   - Nginx代理: http://localhost"
    fi
    
    echo ""
    echo "📁 日志文件:"
    echo "   - 应用日志: ./logs/app.log"
    echo "   - 访问日志: ./logs/access.log"
    echo ""
    echo "🔧 管理命令:"
    echo "   - 查看日志: tail -f logs/app.log"
    echo "   - 重启服务: ./deploy.sh"
    echo "   - 停止服务: pkill -f 'node.*server' (传统部署)"
    echo "   - 停止服务: docker-compose down (Docker部署)"
    echo ""
}

# 主函数
main() {
    local environment=${1:-production}
    
    echo "🚀 语音交流平台部署脚本"
    echo "环境: $environment"
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 检查环境
    check_environment
    
    # 安装依赖
    install_dependencies
    
    # 创建目录
    create_directories
    
    # 设置环境变量
    export NODE_ENV=$environment
    
    # 选择部署方式
    if [ "$USE_DOCKER" = true ]; then
        if [ -f "docker-compose.yml" ]; then
            deploy_compose
        else
            deploy_docker
        fi
    else
        deploy_traditional
    fi
    
    # 显示部署信息
    show_deployment_info
}

# 执行主函数
main "$@"
