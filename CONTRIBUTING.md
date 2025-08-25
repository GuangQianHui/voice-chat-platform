# 贡献指南

感谢您对语音交流平台项目的关注！我们欢迎所有形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献
- 🎨 UI/UX 改进

## 如何贡献

### 1. 报告 Bug

如果您发现了 Bug，请：

1. 检查是否已经有相关的 Issue
2. 创建新的 Issue，包含以下信息：
   - Bug 的详细描述
   - 重现步骤
   - 期望行为
   - 实际行为
   - 浏览器和操作系统信息
   - 错误截图（如果适用）

### 2. 功能建议

如果您有新功能的想法，请：

1. 检查是否已经有相关的 Issue
2. 创建新的 Issue，描述：
   - 功能的具体用途
   - 实现思路
   - 对用户的价值

### 3. 代码贡献

#### 环境准备

1. Fork 项目到您的 GitHub 账户
2. 克隆您的 Fork 到本地：
   ```bash
   git clone https://github.com/GuangQianHui/voice-chat-platform.git
   cd voice-chat-platform
   ```
3. 添加原项目作为上游：
   ```bash
   git remote add upstream https://github.com/original-username/voice-chat-platform.git
   ```

#### 开发流程

1. 创建新分支：

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

4. 进行开发和测试

5. 提交更改：

   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

6. 推送到您的 Fork：

   ```bash
   git push origin feature/your-feature-name
   ```

7. 创建 Pull Request

#### 代码规范

- 使用有意义的变量和函数名
- 添加适当的注释
- 遵循现有的代码风格
- 确保代码通过测试
- 更新相关文档

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

### 4. 文档贡献

- 改进 README.md
- 添加使用示例
- 完善 API 文档
- 翻译文档

## 开发指南

### 项目结构

```
voice-chat-platform/
├── css/                    # 样式文件
├── js/                    # JavaScript 文件
│   ├── audio/            # 音频处理
│   ├── speech/           # 语音识别和合成
│   └── managers/         # 各种管理器
├── images/               # 图片资源
├── conversations/        # 对话历史
├── server/              # 服务器端代码
└── index.html           # 主页面
```

### 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **语音**: Web Speech API
- **样式**: Tailwind CSS

### 开发注意事项

1. **浏览器兼容性**: 确保代码在现代浏览器中正常工作
2. **响应式设计**: 支持不同屏幕尺寸
3. **性能优化**: 注意代码性能，避免内存泄漏
4. **安全性**: 注意输入验证和 XSS 防护
5. **可访问性**: 考虑残障用户的使用体验

## 行为准则

我们致力于为每个人提供友好、安全和欢迎的环境。请：

- 尊重所有贡献者
- 使用包容性语言
- 接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表现出同理心

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下发布。

## 联系方式

如果您有任何问题，请：

- 在 GitHub Issues 中提问
- 联系项目维护者

感谢您的贡献！ 🙏
