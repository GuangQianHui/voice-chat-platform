@echo off
echo 启动语音交流平台（HTTP模式）...

REM 设置环境变量强制使用HTTP
set NODE_ENV=production
set FORCE_HTTP=true
set HTTPS_REDIRECT=false

REM 启动服务器
node server-optimized.js

pause
