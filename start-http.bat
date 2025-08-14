@echo off
chcp 65001 >nul
echo 🚀 启动语音交流平台HTTP服务...
echo.

:: 设置环境变量
set NODE_ENV=development
set PORT=25812
set PROTOCOL=http

:: 检查端口是否被占用
netstat -an | findstr :25812 >nul
if not errorlevel 1 (
    echo [警告] 端口25812已被占用，正在尝试关闭...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :25812') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: 启动服务器
echo [信息] 正在启动HTTP服务器...
echo [信息] 访问地址: http://localhost:25812
echo [信息] 健康检查: http://localhost:25812/api/health
echo [信息] 请使用HTTP协议访问，不要使用HTTPS
echo.

node server-optimized.js

pause
