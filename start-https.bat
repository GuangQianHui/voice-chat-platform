@echo off
chcp 65001 >nul
echo ========================================
echo 语音交流平台 - HTTPS启动脚本
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo ✅ Node.js环境检查通过
echo.

echo 正在检查OpenSSL...
openssl version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  警告: 未找到OpenSSL，将使用HTTP模式
    echo 建议安装OpenSSL以获得更好的安全性
    echo.
) else (
    echo ✅ OpenSSL检查通过
    echo.
)

echo 正在安装依赖包...
npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.

echo 正在启动HTTPS服务器...
echo 请稍候...
echo.

node server-optimized.js

echo.
echo 服务器已停止
pause
