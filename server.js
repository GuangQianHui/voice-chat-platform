const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const fetch = require('node-fetch');

// 导入对话API路由
const conversationApi = require('./server/conversation-api');

const app = express();

// 读取配置文件
let config = {
    server: {
        protocol: 'http',
        port: 25812,
        host: 'localhost',
        forceHttp: true,
        httpsRedirect: false
    }
};

try {
    const configData = require('fs').readFileSync('config.json', 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.log('使用默认配置');
}

const PORT = process.env.PORT || config.server.port;

// 强制使用HTTP协议
const FORCE_HTTP = process.env.FORCE_HTTP === 'true' || config.server.forceHttp;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 服务静态文件

// 资源服务器配置
const RESOURCES_SERVER_URL = 'http://localhost:3001';

// 注册对话API路由（必须在其他API路由之前）
app.use('/api', conversationApi);

// 其他API路由

// 获取所有资源分类
app.get('/api/categories', async (req, res) => {
    try {
        const categories = {
            traditionalFoods: { name: '传统美食', icon: 'fa-utensils', color: '#DC143C' },
            traditionalCrafts: { name: '传统工艺', icon: 'fa-gem', color: '#FFD700' },
            traditionalOpera: { name: '传统戏曲', icon: 'fa-mask', color: '#8B4513' },
            traditionalFestivals: { name: '传统节日', icon: 'fa-calendar', color: '#FF6B35' },
            traditionalMedicine: { name: '传统医药', icon: 'fa-leaf', color: '#228B22' },
            traditionalArchitecture: { name: '传统建筑', icon: 'fa-building', color: '#696969' }
        };
        
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: '获取分类失败' });
    }
});

// 获取指定分类的资源
app.get('/api/resources/:category', async (req, res) => {
    try {
        const { category } = req.params;
        
        // 代理到资源服务器
        const response = await fetch(`${RESOURCES_SERVER_URL}/api/resources/${category}`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('代理资源请求失败:', error);
        res.status(500).json({ error: '资源服务器不可用' });
    }
});

// 搜索资源
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json({ results: [] });
        }

        // 代理到资源服务器
        const response = await fetch(`${RESOURCES_SERVER_URL}/api/resources/search-all?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('代理搜索请求失败:', error);
        res.status(500).json({ error: '搜索失败' });
    }
});

// 获取资源详情
app.get('/api/resource/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;
        
        // 代理到资源服务器
        const response = await fetch(`${RESOURCES_SERVER_URL}/api/resources/${category}/${id}`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('代理资源详情请求失败:', error);
        res.status(500).json({ error: '资源服务器不可用' });
    }
});

// 获取资源统计信息
app.get('/api/stats', async (req, res) => {
    try {
        // 代理到资源服务器
        const response = await fetch(`${RESOURCES_SERVER_URL}/api/resources/stats`);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('代理统计信息请求失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

// 获取相关资源
app.get('/api/related/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;
        const filePath = path.join(RESOURCES_PATH, 'knowledge', category, 'data.json');
        
        const data = await fs.readFile(filePath, 'utf8');
        const resources = JSON.parse(data);
        
        if (!resources.resources[id]) {
            return res.status(404).json({ error: '资源不存在' });
        }
        
        const currentResource = resources.resources[id];
        const related = [];
        
        // 基于标签和关键词查找相关资源
        for (const [key, resource] of Object.entries(resources.resources)) {
            if (key !== id) {
                const commonTags = currentResource.tags.filter(tag => 
                    resource.tags.includes(tag)
                );
                const commonKeywords = currentResource.keywords.filter(keyword => 
                    resource.keywords.includes(keyword)
                );
                
                if (commonTags.length > 0 || commonKeywords.length > 0) {
                    related.push({
                        ...resource,
                        id: key,
                        relevance: commonTags.length + commonKeywords.length
                    });
                }
            }
        }
        
        // 按相关性排序
        related.sort((a, b) => b.relevance - a.relevance);
        
        res.json({ related: related.slice(0, 5) }); // 返回前5个相关资源
    } catch (error) {
        res.status(500).json({ error: '获取相关资源失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`API文档: http://localhost:${PORT}/api/health`);
    console.log(`协议: HTTP (强制模式: ${FORCE_HTTP})`);
});

module.exports = app;
