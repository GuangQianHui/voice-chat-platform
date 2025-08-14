# 智能语音助手 - AI 对话平台

<div align="center">

![智能语音助手](favicon.svg)

**AI 驱动的智能语音交互平台，让交流更自然、更智能**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/voice-assistant?style=social)](https://github.com/yourusername/voice-assistant)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/voice-assistant?style=social)](https://github.com/yourusername/voice-assistant)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/voice-assistant)](https://github.com/yourusername/voice-assistant/issues)
[![GitHub license](https://img.shields.io/github/license/yourusername/voice-assistant)](https://github.com/yourusername/voice-assistant/blob/main/LICENSE)

[在线演示](https://your-demo-url.com) | [文档](https://your-docs-url.com) | [问题反馈](https://github.com/yourusername/voice-assistant/issues)

</div>

## ✨ 功能特性

- 🎤 **智能语音识别** - 高精度语音转文字，支持多种语言
- 🤖 **AI 智能对话** - 基于先进 NLP 技术的自然语言处理
- 💬 **实时语音交互** - 低延迟的语音对话体验
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🎨 **数字人形象** - 生动的 AI 助手视觉呈现
- 📚 **知识库管理** - 丰富的传统文化知识资源
- 🔄 **对话历史** - 完整的对话记录和回顾功能
- ⚡ **高性能** - 优化的前端架构，流畅的用户体验

## 🚀 快速开始

### 环境要求

- Node.js 14.0+
- 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+）
- 麦克风权限（用于语音输入）

### 安装运行

1. **克隆项目**

```bash
git clone https://github.com/yourusername/voice-assistant.git
cd voice-assistant
```

2. **安装依赖**

```bash
npm install
```

3. **启动开发服务器**

```bash
npm start
```

4. **访问应用**
   打开浏览器访问 `http://localhost:3000`

### Docker 部署

```bash
# 构建镜像
docker build -t voice-assistant .

# 运行容器
docker run -p 3000:3000 voice-assistant

# 使用 Docker Compose
docker-compose up -d
```

## 📁 项目结构

```
语音交流平台/
├── css/                    # 样式文件
│   ├── styles.css         # 主样式文件
│   └── tailwind-fallback.css
├── js/                    # JavaScript 文件
│   ├── main.js           # 主逻辑文件
│   ├── audio/            # 音频处理模块
│   ├── managers/         # 管理器模块
│   └── speech/           # 语音处理模块
├── images/               # 图片资源
├── resources/            # 资源文件
│   ├── audio/           # 音频文件
│   ├── images/          # 图片文件
│   ├── videos/          # 视频文件
│   └── knowledge/       # 知识库数据
├── index.html           # 主页面
├── server.js            # 服务器文件
├── package.json         # 项目配置
├── docker-compose.yml   # Docker 配置
└── README.md           # 项目说明
```

## 🛠️ 技术栈

### 前端技术

- **HTML5** - 语义化标记
- **CSS3** - 现代样式设计
- **JavaScript ES6+** - 核心逻辑
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Font Awesome** - 图标库

### 后端技术

- **Node.js** - 服务器运行环境
- **Express.js** - Web 应用框架
- **WebSocket** - 实时通信

### 语音技术

- **Web Speech API** - 语音识别和合成
- **MediaRecorder API** - 音频录制
- **AudioContext** - 音频处理

### 部署技术

- **Docker** - 容器化部署
- **Nginx** - 反向代理
- **PM2** - 进程管理

## 🎯 核心功能

### 语音交互

- 实时语音识别
- 智能语音合成
- 多语言支持
- 噪音抑制

### AI 对话

- 自然语言理解
- 上下文记忆
- 智能回复生成
- 情感分析

### 知识库

- 传统文化知识
- 多媒体资源管理
- 分类导航
- 搜索功能

### 用户体验

- 响应式界面
- 暗色主题
- 动画效果
- 无障碍支持

## 📖 使用指南

### 语音对话

1. 点击麦克风按钮开始录音
2. 说出您的问题或需求
3. 系统自动识别并生成回复
4. 可选择文字或语音输出

### 文字对话

1. 在输入框中输入文字
2. 按回车键或点击发送按钮
3. AI 助手会智能回复
4. 支持多轮对话

### 知识库浏览

1. 点击"资源管理"按钮
2. 选择感兴趣的知识分类
3. 浏览相关内容和媒体资源
4. 与 AI 助手讨论相关内容

## 🔧 配置说明

### 环境变量

```bash
# 服务器配置
PORT=3000
NODE_ENV=production

# 语音API配置
SPEECH_API_KEY=your_api_key
SPEECH_API_REGION=your_region

# 数据库配置
DB_HOST=localhost
DB_PORT=27017
DB_NAME=voice_assistant
```

### 自定义配置

编辑 `config.js` 文件来自定义应用配置：

```javascript
const config = {
  // 语音设置
  speech: {
    language: "zh-CN",
    voice: "zh-CN-XiaoxiaoNeural",
    rate: 1.0,
    pitch: 1.0,
  },

  // AI设置
  ai: {
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
  },

  // 界面设置
  ui: {
    theme: "dark",
    language: "zh-CN",
    animations: true,
  },
};
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循 ESLint 代码规范
- 编写清晰的提交信息
- 添加必要的测试用例
- 更新相关文档

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - 语音识别和合成
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Font Awesome](https://fontawesome.com/) - 图标库
- [OpenAI](https://openai.com/) - AI 模型支持

## 📞 联系我们

- **项目主页**: [https://github.com/yourusername/voice-assistant](https://github.com/yourusername/voice-assistant)
- **问题反馈**: [Issues](https://github.com/yourusername/voice-assistant/issues)
- **邮箱**: your-email@example.com
- **微信**: your-wechat-id

## ⭐ 支持我们

如果这个项目对您有帮助，请给我们一个 ⭐ Star！

---

<div align="center">

**让 AI 语音助手成为您的智能伙伴**

Made with ❤️ by [Your Name](https://github.com/yourusername)

</div>
