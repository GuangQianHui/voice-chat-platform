# 贡献指南

感谢您对智能语音助手项目的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请通过以下方式联系我们：

1. 在 [GitHub Issues](https://github.com/yourusername/voice-assistant/issues) 中搜索是否已有相关问题
2. 如果没有找到相关问题，请创建新的 Issue
3. 请使用清晰的标题和详细的描述

### 提交代码

如果您想贡献代码，请遵循以下步骤：

1. **Fork 项目**

   ```bash
   git clone https://github.com/yourusername/voice-assistant.git
   cd voice-assistant
   ```

2. **创建特性分支**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行修改**

   - 编写清晰的代码
   - 添加必要的注释
   - 确保代码符合项目规范

4. **提交更改**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **推送到分支**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写详细的描述
   - 等待代码审查

## 📋 开发规范

### 代码风格

- 使用 2 个空格缩进
- 使用分号结束语句
- 使用单引号
- 使用驼峰命名法
- 添加适当的空行分隔

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型说明：**

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例：**

```bash
git commit -m "feat: add voice recognition feature"
git commit -m "fix: resolve audio playback issue"
git commit -m "docs: update README with new features"
```

### 文件命名规范

- 文件名使用小写字母和连字符
- 组件文件使用 PascalCase
- 工具函数使用 camelCase

## 🧪 测试

### 运行测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

### 构建检查

```bash
npm run build
```

## 📝 文档

### 更新文档

如果您添加了新功能，请同时更新相关文档：

- `README.md` - 项目说明
- `API.md` - API 文档
- `CHANGELOG.md` - 更新日志

### 文档规范

- 使用清晰的标题结构
- 添加代码示例
- 包含截图或演示
- 保持文档的时效性

## 🎯 贡献领域

我们特别欢迎以下领域的贡献：

### 功能开发

- 语音识别优化
- AI 对话增强
- 用户界面改进
- 性能优化

### 文档完善

- 使用教程
- API 文档
- 部署指南
- 故障排除

### 测试覆盖

- 单元测试
- 集成测试
- 端到端测试
- 性能测试

### 国际化

- 多语言支持
- 本地化适配
- 文化差异考虑

## 🔍 代码审查

### 审查标准

- 代码质量和可读性
- 功能完整性和正确性
- 测试覆盖率
- 文档完整性
- 性能影响

### 审查流程

1. 自动检查（CI/CD）
2. 代码审查者审查
3. 必要的修改和讨论
4. 合并到主分支

## 🏆 贡献者

感谢所有为项目做出贡献的开发者！

### 如何成为贡献者

- 提交有效的 Pull Request
- 积极参与项目讨论
- 帮助其他贡献者
- 维护项目文档

### 贡献者权益

- 在项目 README 中列出姓名
- 获得贡献者徽章
- 参与项目决策
- 获得技术支持

## 📞 联系我们

如果您在贡献过程中遇到问题，可以通过以下方式联系我们：

- **GitHub Issues**: [问题反馈](https://github.com/yourusername/voice-assistant/issues)
- **邮箱**: your-email@example.com
- **微信**: your-wechat-id
- **QQ 群**: your-qq-group

## 🙏 致谢

感谢您对智能语音助手项目的支持！每一个贡献都让项目变得更好。

---

**让我们一起打造更好的 AI 语音助手！** 🚀
