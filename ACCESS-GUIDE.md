# 🌐 浏览器访问指南

## 🚨 重要提示

**请务必使用 HTTP 协议访问，不要使用 HTTPS！**

## 📋 正确的访问方式

### 本地开发环境

```bash
# 启动服务器
./start-dev.bat          # Windows
./start-dev.sh           # Linux/macOS

# 访问地址
http://localhost:25812    ✅ 正确
https://localhost:25812   ❌ 错误
```

### 远程服务器

```bash
# 访问地址
http://121.40.185.158:25812    ✅ 正确
https://121.40.185.158:25812   ❌ 错误
```

## 🔧 常见问题解决

### 问题 1：SSL 协议错误

**错误信息**: `net::ERR_SSL_PROTOCOL_ERROR`

**解决方案**:

1. 确保使用 `http://` 而不是 `https://`
2. 清除浏览器缓存
3. 使用无痕模式访问

### 问题 2：浏览器自动跳转到 HTTPS

**解决方案**:

1. 手动输入 `http://` 前缀
2. 在地址栏中删除 `s` 字母
3. 使用不同的浏览器

### 问题 3：资源加载失败

**解决方案**:

1. 检查网络连接
2. 确认服务器正在运行
3. 查看浏览器控制台错误信息

## 🌍 浏览器兼容性

| 浏览器  | 支持状态    | 备注               |
| ------- | ----------- | ------------------ |
| Chrome  | ✅ 支持     | 推荐使用           |
| Firefox | ✅ 支持     | 推荐使用           |
| Safari  | ✅ 支持     | 推荐使用           |
| Edge    | ✅ 支持     | 推荐使用           |
| IE11    | ⚠️ 部分支持 | 可能存在兼容性问题 |

## 🔍 调试技巧

### 1. 检查网络请求

```javascript
// 在浏览器控制台中执行
fetch("http://localhost:25812/api/health")
  .then((response) => response.json())
  .then((data) => console.log("健康检查:", data))
  .catch((error) => console.error("错误:", error));
```

### 2. 检查协议

```javascript
// 在浏览器控制台中执行
console.log("当前协议:", window.location.protocol);
console.log("当前URL:", window.location.href);
```

### 3. 强制 HTTP 访问

```javascript
// 如果当前是HTTPS，强制跳转到HTTP
if (window.location.protocol === "https:") {
  const httpUrl = window.location.href.replace("https://", "http://");
  window.location.href = httpUrl;
}
```

## 📞 技术支持

如果遇到问题，请：

1. 检查服务器是否正常运行
2. 查看浏览器控制台错误信息
3. 确认使用正确的访问地址
4. 联系技术支持团队

## 🎯 快速测试

访问以下地址测试服务是否正常：

- **健康检查**: http://localhost:25812/api/health
- **主页面**: http://localhost:25812
- **静态资源**: http://localhost:25812/css/styles.css

如果健康检查返回 `{"status":"ok"}`，说明服务正常运行。
