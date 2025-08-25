# API 文档

## 概述

语音交流平台提供了一系列 API 接口，用于支持语音交互、对话管理和资源处理功能。

## 基础信息

- **基础 URL**: `http://localhost:3000`
- **内容类型**: `application/json`
- **字符编码**: `UTF-8`

## 认证

目前 API 不需要认证，但建议在生产环境中添加适当的认证机制。

## 错误处理

所有 API 响应都遵循统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## API 端点

### 1. 对话管理

#### 获取对话历史

```http
GET /api/conversations
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "20240116-001",
      "title": "关于传统文化的对话",
      "timestamp": "2024-01-16T10:30:00Z",
      "messageCount": 15
    }
  ]
}
```

#### 获取特定对话

```http
GET /api/conversations/:id
```

**参数**:

- `id` (string): 对话 ID

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "20240116-001",
    "title": "关于传统文化的对话",
    "messages": [
      {
        "id": "msg-001",
        "type": "user",
        "content": "你好",
        "timestamp": "2024-01-16T10:30:00Z"
      },
      {
        "id": "msg-002",
        "type": "assistant",
        "content": "您好！我是您的AI助手，很高兴为您服务。",
        "timestamp": "2024-01-16T10:30:05Z"
      }
    ]
  }
}
```

#### 保存对话

```http
POST /api/conversations
```

**请求体**:

```json
{
  "title": "对话标题",
  "messages": [
    {
      "type": "user",
      "content": "用户消息"
    },
    {
      "type": "assistant",
      "content": "助手回复"
    }
  ]
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "20240116-002",
    "message": "对话保存成功"
  }
}
```

### 2. 语音处理

#### 语音识别

```http
POST /api/speech/recognize
```

**请求体** (multipart/form-data):

- `audio`: 音频文件 (支持格式: wav, mp3, ogg)

**响应示例**:

```json
{
  "success": true,
  "data": {
    "text": "识别出的文字内容",
    "confidence": 0.95
  }
}
```

#### 语音合成

```http
POST /api/speech/synthesize
```

**请求体**:

```json
{
  "text": "要合成的文字",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": 1.0,
  "pitch": 1.0
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "audioUrl": "/audio/synthesized-20240116-001.mp3",
    "duration": 3.5
  }
}
```

### 3. 资源管理

#### 获取资源列表

```http
GET /api/resources
```

**查询参数**:

- `type` (string, 可选): 资源类型 (image, video, audio, document)
- `category` (string, 可选): 资源分类
- `page` (number, 可选): 页码，默认 1
- `limit` (number, 可选): 每页数量，默认 20

**响应示例**:

```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "res-001",
        "name": "传统建筑图片",
        "type": "image",
        "category": "architecture",
        "url": "/resources/images/traditional-building.jpg",
        "size": 1024000,
        "uploadTime": "2024-01-16T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

#### 上传资源

```http
POST /api/resources/upload
```

**请求体** (multipart/form-data):

- `file`: 文件
- `category` (string, 可选): 资源分类
- `description` (string, 可选): 资源描述

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "res-002",
    "name": "上传的文件名.jpg",
    "url": "/resources/images/uploaded-file.jpg",
    "message": "文件上传成功"
  }
}
```

### 4. 知识库

#### 搜索知识

```http
GET /api/knowledge/search
```

**查询参数**:

- `q` (string): 搜索关键词
- `category` (string, 可选): 知识分类
- `limit` (number, 可选): 返回结果数量，默认 10

**响应示例**:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "knowledge-001",
        "title": "传统建筑特色",
        "content": "中国传统建筑具有独特的...",
        "category": "architecture",
        "relevance": 0.95
      }
    ],
    "total": 25
  }
}
```

#### 获取知识分类

```http
GET /api/knowledge/categories
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "architecture",
      "name": "传统建筑",
      "description": "中国传统建筑相关知识",
      "count": 150
    },
    {
      "id": "crafts",
      "name": "传统工艺",
      "description": "中国传统工艺技术",
      "count": 200
    }
  ]
}
```

## 状态码

- `200`: 请求成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 限制

- 文件上传大小限制: 50MB
- 音频文件格式: wav, mp3, ogg
- 图片文件格式: jpg, jpeg, png, gif, webp
- 视频文件格式: mp4, avi, mov

## 示例代码

### JavaScript 示例

```javascript
// 获取对话历史
async function getConversations() {
  const response = await fetch("/api/conversations");
  const data = await response.json();
  return data;
}

// 上传文件
async function uploadFile(file, category) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await fetch("/api/resources/upload", {
    method: "POST",
    body: formData,
  });

  return await response.json();
}

// 语音合成
async function synthesizeSpeech(text) {
  const response = await fetch("/api/speech/synthesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      voice: "zh-CN-XiaoxiaoNeural",
    }),
  });

  return await response.json();
}
```

## 更新日志

- **v2.0.0**: 新增完整的 API 文档
- **v1.0.0**: 基础 API 功能

## 支持

如果您在使用 API 时遇到问题，请：

1. 查看错误响应中的详细信息
2. 检查请求参数是否正确
3. 确认服务器状态
4. 提交 Issue 到 GitHub 项目页面
