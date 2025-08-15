# 语音交流平台

一个基于 Web 的 AI 智能语音对话平台，支持语音识别、语音合成和知识库管理。

## 🌟 功能特性

### 🎤 语音交互

- **语音识别**：实时语音转文字，支持中文识别
- **语音合成**：自然语音播放，多种语音选择
- **智能对话**：AI 驱动的对话系统，支持上下文理解

### 📚 知识库管理

- **分类浏览**：传统美食、工艺、戏曲、节日、医药、建筑等分类
- **资源导入**：支持 JSON 格式资源文件导入
- **搜索功能**：快速搜索和筛选知识条目
- **媒体支持**：图片、视频、音频文件管理

### 🎨 用户界面

- **现代化设计**：美观的渐变背景和动画效果
- **响应式布局**：适配各种屏幕尺寸
- **深色模式**：支持系统主题切换
- **实时状态**：系统状态监控和反馈

## 🚀 快速开始

### 环境要求

- Node.js 20.0+
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/your-username/voice-chat-platform.git
cd voice-chat-platform
```

2. **安装依赖**

```bash
npm install
```

3. **启动服务器**

```bash
npm start
```

4. **访问应用**
   打开浏览器访问 `http://localhost:25812`

## 📁 项目结构

```
语音交流平台/
├── css/                    # 样式文件
│   └── styles.css         # 主样式文件
├── js/                    # JavaScript文件
│   ├── main.js           # 主应用文件
│   ├── speech/           # 语音相关模块
│   │   ├── speechRecognition.js
│   │   └── naturalSpeechSynthesis.js
│   ├── managers/         # 管理器模块
│   │   ├── dialogueManager.js
│   │   ├── resourceManager.js
│   │   ├── systemMonitor.js
│   │   ├── dataStorageManager.js
│   │   └── historyManager.js
│   └── audio/            # 音频处理
│       └── audioManager.js
├── resources/            # 资源文件
│   └── knowledge/       # 知识库数据
├── images/              # 图片资源
├── server.js            # 服务器文件
├── index.html           # 主页面
└── package.json         # 项目配置
```

## 🔧 配置说明

### 语音设置

- 语音识别开关
- 语音合成开关
- 自动播放设置

### 界面设置

- 深色模式切换
- 动画效果控制
- 自动保存设置

### 资源管理

- 支持导入 JSON 格式资源文件
- 支持拖拽上传
- 资源分类管理

## 📖 使用指南

### 语音对话

1. 点击麦克风按钮开始语音识别
2. 说话完成后自动识别并发送
3. 系统会以语音形式回复

### 文字对话

1. 在输入框中输入文字
2. 按 Enter 键或点击发送按钮
3. 系统会以语音形式回复

### 知识库管理

1. 点击导航栏的"资源管理"按钮
2. 在资源管理页面进行资源操作
3. 支持添加、编辑、删除资源

## 🛠️ 开发指南

### 添加新功能

1. 在相应的模块文件中添加功能
2. 更新 CSS 样式文件
3. 在 main.js 中绑定事件
4. 测试功能完整性

### 自定义样式

- 修改 `css/styles.css` 文件
- 支持 CSS 变量自定义主题
- 响应式设计适配

### 扩展知识库

- 在 `resources/knowledge/` 目录下添加分类
- 创建对应的 JSON 数据文件
- 更新资源管理器配置

## 📝 API 文档

### 语音识别 API

```javascript
// 初始化语音识别
const speechRecognition = new SpeechRecognitionSystem();

// 开始识别
speechRecognition.start();

// 监听识别结果
speechRecognition.onResult((transcript) => {
  console.log("识别结果:", transcript);
});
```

### 资源管理 API

```javascript
// 初始化资源管理器
const resourceManager = new ResourceManager();

// 导入资源文件
resourceManager.importResourceFile(file);

// 获取资源列表
const resources = resourceManager.getResources();
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢所有贡献者的支持
- 感谢开源社区提供的技术栈
- 感谢用户的使用和反馈

## 📞 联系方式

- 项目主页：[GitHub Repository](https://github.com/your-username/voice-chat-platform)
- 问题反馈：[Issues](https://github.com/your-username/voice-chat-platform/issues)
- 邮箱：your-email@example.com

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
