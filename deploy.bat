@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 语音交流平台Windows部署脚本
:: 使用方法: deploy.bat [production|development]

echo 🚀 语音交流平台部署脚本
echo.

:: 设置环境变量
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production
echo 环境: %ENVIRONMENT%

:: 检查Node.js
echo [INFO] 检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查npm
echo [INFO] 检查npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm 未安装，请先安装 npm
    pause
    exit /b 1
)

:: 检查Docker
echo [INFO] 检查Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Docker 未安装，将使用传统部署方式
    set USE_DOCKER=false
) else (
    set USE_DOCKER=true
)

:: 检查配置文件
echo [INFO] 检查环境配置...
if not exist "config.js" (
    echo [ERROR] 配置文件 config.js 不存在
    pause
    exit /b 1
)

if not exist "server-optimized.js" (
    echo [ERROR] 优化服务器文件 server-optimized.js 不存在
    pause
    exit /b 1
)

:: 安装依赖
echo [INFO] 安装项目依赖...
call npm ci --only=production
if errorlevel 1 (
    echo [ERROR] 依赖安装失败
    pause
    exit /b 1
)

:: 创建必要目录
echo [INFO] 创建必要目录...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads

:: 停止现有服务
echo [INFO] 停止现有服务...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: 设置环境变量
set NODE_ENV=%ENVIRONMENT%

:: 选择部署方式
if "%USE_DOCKER%"=="true" (
    if exist "docker-compose.yml" (
        call :deploy_compose
    ) else (
        call :deploy_docker
    )
) else (
    call :deploy_traditional
)

:: 显示部署信息
call :show_deployment_info
pause
exit /b 0

:deploy_traditional
echo [INFO] 开始传统部署...
echo [INFO] 启动服务...
start /b node server-optimized.js > logs\app.log 2>&1

:: 等待服务启动
timeout /t 5 /nobreak >nul

:: 检查服务状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:25812/api/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo [ERROR] 服务启动失败，请检查日志
    pause
    exit /b 1
) else (
    echo [SUCCESS] 服务启动成功
)
goto :eof

:deploy_docker
echo [INFO] 开始Docker部署...
echo [INFO] 构建Docker镜像...
docker build -t voice-chat-platform .
if errorlevel 1 (
    echo [ERROR] Docker镜像构建失败
    pause
    exit /b 1
)

:: 停止现有容器
docker ps -q -f name=voice-chat-platform >nul 2>&1
if not errorlevel 1 (
    echo [INFO] 停止现有容器...
    docker stop voice-chat-platform
    docker rm voice-chat-platform
)

:: 启动容器
echo [INFO] 启动Docker容器...
docker run -d --name voice-chat-platform -p 25812:25812 -v %cd%\logs:/app/logs -v %cd%\uploads:/app/uploads -v %cd%\resources:/app/resources --restart unless-stopped voice-chat-platform
if errorlevel 1 (
    echo [ERROR] Docker容器启动失败
    pause
    exit /b 1
)

:: 等待服务启动
timeout /t 10 /nobreak >nul

:: 检查服务状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:25812/api/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo [ERROR] Docker服务启动失败，请检查日志
    docker logs voice-chat-platform
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker服务启动成功
)
goto :eof

:deploy_compose
echo [INFO] 开始Docker Compose部署...

:: 停止现有服务
docker-compose ps | findstr "voice-chat-platform" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] 停止现有服务...
    docker-compose down
)

:: 启动服务
echo [INFO] 启动Docker Compose服务...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Docker Compose服务启动失败
    pause
    exit /b 1
)

:: 等待服务启动
timeout /t 15 /nobreak >nul

:: 检查服务状态
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    echo [ERROR] Docker Compose服务启动失败，请检查日志
    docker-compose logs
    pause
    exit /b 1
) else (
    echo [SUCCESS] Docker Compose服务启动成功
    echo [INFO] 访问地址: http://localhost
)
goto :eof

:show_deployment_info
echo.
echo [SUCCESS] 部署完成！
echo.
    echo 📊 服务信息:
    echo    - 健康检查: http://localhost:25812/api/health
    echo    - 主应用: http://localhost:25812

if "%USE_DOCKER%"=="true" (
    if exist "docker-compose.yml" (
        echo    - Nginx代理: http://localhost
    )
)

echo.
echo 📁 日志文件:
echo    - 应用日志: logs\app.log
echo    - 访问日志: logs\access.log
echo.
echo 🔧 管理命令:
echo    - 查看日志: type logs\app.log
echo    - 重启服务: deploy.bat
echo    - 停止服务: taskkill /f /im node.exe (传统部署)
echo    - 停止服务: docker-compose down (Docker部署)
echo.
goto :eof
