@echo off
chcp 65001 >nul
echo 🚀 启动语音交流平台开发环境...
echo.

:: 设置环境变量
set NODE_ENV=development
set PORT=3000

:: 检查端口是否被占用
netstat -an | findstr :3000 >nul
if not errorlevel 1 (
    echo [警告] 端口3000已被占用，正在尝试关闭...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: 启动服务器
echo [信息] 正在启动服务器...
echo [信息] 访问地址: http://localhost:3000
echo [信息] 健康检查: http://localhost:3000/api/health
echo.

node server-optimized.js

pause
