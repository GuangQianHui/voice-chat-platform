# 语音交流平台 (Voice Chat Platform)

一个基于 Web 的智能语音交流平台，专注于传统文化资源的语音交互体验。

## 🌟 项目特色

- **智能语音交互**: 支持语音识别和语音合成
- **传统文化资源库**: 集成丰富的传统文化知识资源
- **数字人形象**: 提供沉浸式的对话体验
- **实时对话记录**: 完整的对话历史管理
- **资源管理系统**: 支持多媒体资源的上传和管理

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- 现代浏览器（支持 Web Speech API）

### 安装步骤

1. 克隆项目

```bash
git clone https://gitee.com/guangqianhui/voice-chat-platform.git
cd voice-chat-platform
```

2. 安装依赖

```bash
npm install
```

3. 启动服务器

```bash
npm start
```

4. 打开浏览器访问

```
http://localhost:3000
```

### 开发模式

```bash
npm run dev
```

## 📁 项目结构

```
voice-chat-platform/
├── css/                    # 样式文件
│   ├── styles.css         # 主样式
│   ├── markdown.css       # Markdown样式
│   └── conversation-panel.css # 对话面板样式
├── js/                    # JavaScript文件
│   ├── main.js           # 主入口文件
│   ├── audio/            # 音频处理模块
│   ├── speech/           # 语音识别和合成
│   └── managers/         # 各种管理器
├── images/               # 图片资源
├── conversations/        # 对话历史文件
├── server/              # 服务器端代码
├── index.html           # 主页面
├── server.js            # 服务器入口
└── package.json         # 项目配置
```

## 🎯 主要功能

### 语音交互

- 实时语音识别
- 自然语音合成
- 语音状态指示

### 对话管理

- 实时对话显示
- 对话历史记录
- 对话导出功能

### 资源管理

- 多媒体资源上传
- 资源分类管理
- 知识库集成

### 用户界面

- 响应式设计
- 数字人形象展示
- 现代化 UI 设计

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **语音**: Web Speech API
- **样式**: Tailwind CSS
- **图标**: Font Awesome

## 📝 使用说明

1. **语音对话**: 点击麦克风按钮开始语音输入
2. **文字对话**: 在输入框中输入文字进行对话
3. **历史记录**: 点击"对话历史"查看历史对话
4. **资源管理**: 点击"资源管理"管理平台资源

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

### 贡献步骤

1. Fork 这个项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- Web Speech API 提供语音功能支持
- Tailwind CSS 提供样式框架
- Font Awesome 提供图标资源

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [码云 Issues](https://gitee.com/guangqianhui/voice-chat-platform/issues)
- 邮箱: xuqiguang9@gmail.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
