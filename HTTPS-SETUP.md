# HTTPS 配置指南

## 概述

本指南将帮助您配置语音交流平台以使用 HTTPS 协议，解决 SSL 协议错误和混合内容问题。

## 问题描述

您遇到的错误包括：

- `ERR_SSL_PROTOCOL_ERROR` - SSL 协议错误
- `ERR_CONNECTION_RESET` - 连接重置
- Cross-Origin-Opener-Policy 头部被忽略
- 混合内容问题（HTTPS 页面加载 HTTP 资源）

## 解决方案

### 1. 自动 HTTPS 配置

我们已为您配置了自动 HTTPS 支持：

#### Windows 用户

```bash
# 双击运行
start-https.bat
```

#### Linux/Mac 用户

```bash
# 运行脚本
./start-https.sh
```

### 2. 手动配置

如果您想手动配置：

#### 安装依赖

```bash
npm install
```

#### 启动服务器

```bash
node server-optimized.js
```

### 3. 访问应用

启动后，使用以下地址访问：

- **HTTPS (推荐)**: `https://localhost:25812`
- **HTTP (备用)**: `http://localhost:25812`

## 安全特性

### 自动 SSL 证书生成

- 使用 OpenSSL 自动生成自签名证书
- 证书有效期：365 天
- 自动续期支持

### 安全头部配置

- HSTS (HTTP Strict Transport Security)
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### CORS 配置

- 支持 HTTPS 和 HTTP 跨域请求
- 安全的凭证处理

## 故障排除

### 1. 浏览器安全警告

如果看到"不安全连接"警告：

1. 点击"高级"
2. 选择"继续访问"
3. 这是正常的，因为我们使用自签名证书

### 2. OpenSSL 未安装

如果系统提示 OpenSSL 未安装：

- **Windows**: 下载并安装 OpenSSL
- **Linux**: `sudo apt-get install openssl` (Ubuntu/Debian)
- **Mac**: `brew install openssl` (使用 Homebrew)

### 3. 端口被占用

如果端口 25812 被占用：

```bash
# 查看端口占用
netstat -ano | findstr :25812  # Windows
lsof -i :25812                 # Linux/Mac

# 修改配置文件中的端口
# 编辑 config.js 文件
```

## 生产环境部署

### 使用真实 SSL 证书

1. 获取 SSL 证书（Let's Encrypt、DigiCert 等）
2. 将证书文件放在 `ssl/` 目录：
   - `ssl/server.crt` - 证书文件
   - `ssl/server.key` - 私钥文件

### 环境变量配置

```bash
# 设置环境变量
export NODE_ENV=production
export PORT=443
export HOST=0.0.0.0
```

## 协议修复脚本

我们已添加了 `js/protocol-fix.js` 脚本，它会：

1. 自动检测当前协议
2. 修复混合内容问题
3. 重定向 HTTP 到 HTTPS（生产环境）
4. 修复资源链接

## 验证 HTTPS 配置

访问以下地址验证配置：

- 健康检查: `https://localhost:25812/api/health`
- 主页面: `https://localhost:25812`
- 资源 API: `https://localhost:25812/api/categories`

## 注意事项

1. **开发环境**: 使用自签名证书，浏览器会显示警告
2. **生产环境**: 建议使用真实的 SSL 证书
3. **防火墙**: 确保端口 25812（或您配置的端口）已开放
4. **反向代理**: 如果使用 Nginx 等反向代理，请配置 SSL 终止

## 技术支持

如果遇到问题，请检查：

1. Node.js 版本 >= 14.0.0
2. 网络连接正常
3. 防火墙设置
4. 系统日志文件 (`logs/app.log`)

---

**重要**: 首次访问 HTTPS 地址时，浏览器可能会显示安全警告，这是正常的。点击"继续访问"即可正常使用应用。
