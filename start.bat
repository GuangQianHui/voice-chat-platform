@echo off
echo ========================================
echo 语音交流平台启动脚本
echo ========================================
echo.

echo 检查Node.js安装...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js已安装，版本:
node --version

echo.
echo 检查依赖包...
if not exist "node_modules" (
    echo 首次运行，正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖包安装失败
        pause
        exit /b 1
    )
)

echo.
echo 启动服务器...
echo 服务器将在 http://localhost:25812 启动
echo 按 Ctrl+C 停止服务器
echo.

npm start

pause
