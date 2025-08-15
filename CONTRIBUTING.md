# 贡献指南

感谢您对语音交流平台项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交代码修复
- 🎨 改进用户界面

## 如何贡献

### 1. Fork 项目

首先，在 GitHub 上 Fork 这个项目到您的账户。

### 2. 克隆到本地

```bash
git clone https://github.com/your-username/voice-chat-platform.git
cd voice-chat-platform
```

### 3. 创建分支

为您的贡献创建一个新的分支：

```bash
git checkout -b feature/your-feature-name
# 或者
git checkout -b fix/your-bug-fix
```

### 4. 安装依赖

```bash
npm install
```

### 5. 开发

- 在相应的文件中进行修改
- 确保代码符合项目规范
- 添加必要的注释和文档

### 6. 测试

在提交之前，请确保：

- 代码没有语法错误
- 功能正常工作
- 没有破坏现有功能

```bash
# 检查语法
node -c js/main.js
node -c js/managers/*.js

# 启动服务器测试
npm start
```

### 7. 提交更改

```bash
git add .
git commit -m "feat: 添加新功能描述"
git push origin feature/your-feature-name
```

### 8. 创建 Pull Request

在 GitHub 上创建 Pull Request，并详细描述您的更改。

## 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用有意义的变量和函数名
- 添加适当的注释
- 遵循一致的缩进（2个空格）

### CSS 规范

- 使用有意义的类名
- 遵循 BEM 命名约定
- 保持样式的一致性
- 添加响应式设计

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
type(scope): description

[optional body]

[optional footer]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 示例

```bash
feat(resource): 添加资源导入功能
fix(voice): 修复语音识别中断问题
docs(readme): 更新安装说明
style(ui): 优化按钮样式
```

## 报告 Bug

如果您发现了 Bug，请：

1. 检查是否已经有相关的 Issue
2. 创建新的 Issue，包含：
   - Bug 的详细描述
   - 重现步骤
   - 期望行为
   - 实际行为
   - 环境信息（浏览器、操作系统等）
   - 截图或录屏（如果适用）

## 功能建议

如果您有新功能建议，请：

1. 检查是否已经有相关的 Issue
2. 创建新的 Issue，包含：
   - 功能的详细描述
   - 使用场景
   - 预期效果
   - 实现建议（如果适用）

## 文档贡献

文档同样重要！如果您发现文档有错误或需要改进，请：

1. 直接提交 Pull Request 修复
2. 或者创建 Issue 描述问题

## 社区行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请：

- 尊重他人
- 使用包容性语言
- 接受建设性批评
- 关注社区利益
- 展示对其他社区成员的同情

## 联系方式

如果您有任何问题或需要帮助，请：

- 创建 GitHub Issue
- 发送邮件到：your-email@example.com
- 加入我们的讨论群

## 致谢

感谢所有为这个项目做出贡献的开发者！您的贡献让这个项目变得更好。

---

再次感谢您的贡献！🎉
