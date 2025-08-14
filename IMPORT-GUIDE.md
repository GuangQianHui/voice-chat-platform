# 资源导入功能使用指南

## 功能概述

资源导入功能允许您导入网上下载的 JSON 格式资源文件，扩展知识库内容。

## 支持的文件格式

- **文件格式**: JSON (.json)
- **最大文件大小**: 10MB
- **编码**: UTF-8

## 文件格式要求

导入功能支持两种 JSON 格式：

### 格式一：标准格式（单分类）

```json
{
  "category": "traditionalArchitecture",
  "name": "传统建筑示例",
  "resources": {
    "资源ID": {
      "id": "资源ID",
      "title": "资源标题",
      "description": "资源描述",
      "content": "详细内容",
      "category": "traditionalArchitecture",
      "tags": ["标签1", "标签2"],
      "keywords": ["关键词1", "关键词2"],
      "history": "历史信息",
      "technique": "工艺技术",
      "features": "特色亮点",
      "funFact": "趣闻轶事",
      "media": [],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "type": "traditionalArchitecture",
      "icon": "fa-building"
    }
  }
}
```

### 格式二：直接分类格式（多分类）

```json
{
  "traditionalFoods": {
    "资源ID1": {
      "id": "资源ID1",
      "category": "traditionalFoods",
      "title": "绿豆糕的制作",
      "description": "香甜可口，老少皆宜",
      "content": "香甜可口，老少皆宜",
      "tags": ["糕点"],
      "keywords": ["香甜可口，老少皆宜"],
      "media": [],
      "createdAt": "2025-08-11T01:45:12.800Z",
      "updatedAt": "2025-08-11T01:45:50.201Z"
    }
  },
  "traditionalCrafts": {
    "资源ID2": {
      "id": "资源ID2",
      "category": "traditionalCrafts",
      "title": "产品包装",
      "description": "独特，新颖",
      "content": "独特，新颖",
      "tags": ["工艺"],
      "keywords": ["售卖，产品"],
      "media": [],
      "createdAt": "2025-08-14T15:12:49.651Z",
      "updatedAt": "2025-08-14T15:12:49.651Z"
    }
  }
}
```

## 支持的分类

- `traditionalFoods` - 传统美食
- `traditionalCrafts` - 传统工艺
- `traditionalOpera` - 传统戏曲
- `traditionalFestivals` - 传统节日
- `traditionalMedicine` - 传统医药
- `traditionalArchitecture` - 传统建筑

## 使用方法

1. **准备文件**: 确保您的 JSON 文件符合上述格式要求
2. **导入文件**: 点击"导入资源"按钮选择文件
3. **自动导入**: 选择文件后会自动开始导入
4. **查看结果**: 导入成功后，新资源将显示在对应的分类中

## 示例文件

参考以下文件作为导入格式的示例：

- `resources/import-example.json` - 标准格式示例
- `resources/test-import.json` - 直接分类格式示例

## 注意事项

- **完全替换**: 导入的资源会完全替换现有的本地资源库
- **优先级**: 导入的资源库优先于本地资源库加载
- **持久化**: 导入的资源会保存在本地存储中，重启应用后仍然有效
- **恢复**: 可以随时清除导入的资源，系统会自动回退到本地资源库

## 字段处理说明

导入功能会自动处理缺失的字段：

### 必需字段（自动补充）

- **id**: 如果没有，使用资源键名
- **title**: 如果没有，使用 id 或资源键名
- **description**: 如果没有，使用 content 或 title
- **content**: 如果没有，使用 description 或 title

### 可选字段（自动初始化）

- **tags**: 如果没有，初始化为空数组
- **keywords**: 如果没有，初始化为空数组
- **media**: 如果没有，初始化为空数组
- **createdAt**: 如果没有，使用当前时间
- **updatedAt**: 如果没有，使用当前时间

## 故障排除

如果导入失败，请检查：

1. 文件格式是否为 JSON
2. 文件大小是否超过 10MB
3. JSON 格式是否正确
4. 分类名称是否正确
5. 资源对象是否为有效的对象格式
