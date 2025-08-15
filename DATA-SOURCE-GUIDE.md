# 数据源切换功能使用指南

## 概述

语音交流平台支持两种数据源：

1. **本地知识库** - 存储在 `resources/knowledge/` 目录下的本地文件
2. **导入知识库** - 用户通过资源管理功能导入的 JSON 文件

## 数据源优先级

### 加载顺序

1. 首先检查是否有导入的数据（`localStorage` 中的 `imported_resources`）
2. 如果有导入数据，使用导入数据作为对话内容来源
3. 如果没有导入数据，使用本地知识库作为对话内容来源

### 切换机制

- **导入数据时**：完全替换本地数据，对话内容来自导入文件
- **清除导入时**：恢复到本地数据，对话内容来自本地知识库
- **实时切换**：无需重启应用，立即生效

## 功能特性

### ✅ 已实现功能

1. **自动数据源检测**

   - 应用启动时自动检测当前数据源
   - 优先使用导入数据，回退到本地数据

2. **实时数据同步**

   - 资源管理器数据更新时，对话管理器自动刷新
   - 确保对话内容始终使用最新数据

3. **数据完整性保证**

   - 导入数据验证和字段补全
   - 支持多种 JSON 格式
   - 错误处理和回退机制

4. **用户友好的界面**
   - 资源管理按钮在导航条
   - 导入状态显示
   - 操作反馈和通知

### 🔧 技术实现

#### 资源管理器 (`ResourceManager`)

```javascript
// 数据加载优先级
async loadResources() {
    // 1. 尝试加载导入资源
    await this.loadImportedResources();

    // 2. 如果没有导入资源，加载本地资源
    if (Object.keys(this.resources).length === 0) {
        await this.loadLocalResources();
    }
}

// 数据更新通知
notifyDataUpdate() {
    if (this.onDataUpdate && typeof this.onDataUpdate === 'function') {
        this.onDataUpdate();
    }
}
```

#### 对话管理器 (`DialogueManager`)

```javascript
// 从资源管理器获取数据
async loadKnowledgeBase() {
    if (window.resourceManager && window.resourceManager.resources) {
        this.knowledgeBase = { ...window.resourceManager.resources };
    } else {
        await this.loadLocalKnowledgeBase();
    }
}

// 监听数据更新
setupResourceManagerListener() {
    if (window.resourceManager) {
        window.resourceManager.onDataUpdate = () => {
            this.refreshKnowledgeBase();
        };
    }
}
```

## 使用方法

### 1. 导入自定义数据

1. 点击导航条的"资源管理"按钮
2. 在资源管理页面点击"导入资源"
3. 选择 JSON 格式的资源文件
4. 系统会自动验证和导入数据
5. 对话内容立即切换到导入的数据

### 2. 清除导入数据

1. 在资源管理页面点击"清除导入"
2. 确认清除操作
3. 系统自动恢复到本地知识库
4. 对话内容立即切换回本地数据

### 3. 查看当前数据源

- **本地数据源**：使用 `resources/knowledge/` 目录下的文件
- **导入数据源**：使用 `localStorage` 中存储的导入数据

## 数据格式

### 支持的 JSON 格式

#### 格式 1：直接分类映射

```json
{
  "traditionalFoods": {
    "resource1": {
      "id": "resource1",
      "category": "traditionalFoods",
      "title": "资源标题",
      "description": "资源描述",
      "content": "详细内容",
      "tags": ["标签1", "标签2"],
      "keywords": ["关键词1", "关键词2"],
      "media": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "traditionalCrafts": {
    // 工艺类资源...
  }
}
```

#### 格式 2：标准格式

```json
{
  "category": "traditionalFoods",
  "resources": {
    "resource1": {
      // 资源数据...
    }
  }
}
```

### 字段说明

| 字段          | 类型   | 必需 | 说明                             |
| ------------- | ------ | ---- | -------------------------------- |
| `id`          | string | 是   | 资源唯一标识                     |
| `category`    | string | 是   | 资源分类                         |
| `title`       | string | 否   | 资源标题（默认使用 id）          |
| `description` | string | 否   | 资源描述（默认使用 content）     |
| `content`     | string | 否   | 详细内容（默认使用 description） |
| `tags`        | array  | 否   | 标签数组（默认空数组）           |
| `keywords`    | array  | 否   | 关键词数组（默认空数组）         |
| `media`       | array  | 否   | 媒体文件数组（默认空数组）       |
| `createdAt`   | string | 否   | 创建时间（默认当前时间）         |
| `updatedAt`   | string | 否   | 更新时间（默认当前时间）         |

## 测试功能

### 测试页面

访问 `test-data-source.html` 可以测试数据源切换功能：

1. **测试本地数据**：清除导入数据，使用本地知识库
2. **测试导入数据**：创建测试数据并导入
3. **清除导入数据**：恢复到本地数据
4. **刷新状态**：查看当前数据源状态

### 测试步骤

1. 打开测试页面
2. 观察当前数据源状态
3. 点击测试按钮验证功能
4. 查看测试日志了解详细过程

## 故障排除

### 常见问题

#### 1. 导入数据后对话内容没有更新

**解决方案**：

- 检查导入的 JSON 格式是否正确
- 查看浏览器控制台是否有错误信息
- 尝试刷新页面重新加载

#### 2. 清除导入后无法恢复本地数据

**解决方案**：

- 检查本地知识库文件是否存在
- 确认文件路径和格式正确
- 查看控制台错误信息

#### 3. 数据源切换不生效

**解决方案**：

- 检查资源管理器和对话管理器是否正确初始化
- 确认数据更新通知机制正常工作
- 查看测试页面的状态显示

### 调试方法

1. **查看控制台日志**

   ```javascript
   // 检查资源管理器状态
   console.log(window.resourceManager.resources);

   // 检查对话管理器状态
   console.log(window.dialogueManager.knowledgeBase);

   // 检查本地存储
   console.log(localStorage.getItem("imported_resources"));
   ```

2. **使用测试页面**

   - 打开 `test-data-source.html`
   - 查看详细的状态信息和测试日志

3. **检查网络请求**
   - 确认本地知识库文件能够正常加载
   - 检查文件路径是否正确

## 注意事项

1. **数据备份**：导入数据会完全替换本地数据，建议备份重要数据
2. **文件大小**：导入文件最大支持 10MB
3. **格式验证**：系统会自动验证 JSON 格式和数据结构
4. **持久化存储**：导入数据会保存在浏览器本地存储中
5. **浏览器兼容性**：需要支持现代浏览器的本地存储功能

## 更新日志

### v2.0.1 (2024-08-14)

- ✅ 实现数据源自动切换功能
- ✅ 添加资源管理器数据更新通知
- ✅ 优化对话管理器数据加载逻辑
- ✅ 创建测试页面和文档
- ✅ 完善错误处理和回退机制

---

**如有问题，请查看测试页面或联系技术支持。**
