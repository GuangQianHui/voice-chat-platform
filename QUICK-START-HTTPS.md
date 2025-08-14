# 🚀 HTTPS 快速启动指南

## 一键启动（推荐）

### Windows 用户

```bash
# 双击运行此文件
start-https.bat
```

### Linux/Mac 用户

```bash
# 运行此脚本
./start-https.sh
```

## 手动启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 HTTPS 服务器

```bash
npm run https
```

### 3. 访问应用

打开浏览器访问：`https://localhost:25812`

## 测试配置

运行测试脚本验证 HTTPS 配置：

```bash
npm run test-https
```

## 常见问题

### Q: 浏览器显示"不安全连接"警告？

A: 这是正常的，因为我们使用自签名证书。点击"高级" → "继续访问"即可。

### Q: 端口 25812 被占用？

A: 修改 `config.js` 文件中的端口配置，或使用以下命令查看占用：

```bash
# Windows
netstat -ano | findstr :25812

# Linux/Mac
lsof -i :25812
```

### Q: OpenSSL 未安装？

A:

- **Windows**: 下载安装 OpenSSL
- **Linux**: `sudo apt-get install openssl`
- **Mac**: `brew install openssl`

## 访问地址

- **主页面**: https://localhost:25812
- **健康检查**: https://localhost:25812/api/health
- **API 文档**: https://localhost:25812/api/categories

## 安全特性

✅ 自动 SSL 证书生成  
✅ HTTPS 强制重定向  
✅ 安全头部配置  
✅ 混合内容修复  
✅ CORS 安全配置

---

**注意**: 首次访问时浏览器会显示安全警告，这是正常现象。
