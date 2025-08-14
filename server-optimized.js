const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('winston-daily-rotate-file');

const config = require('./config');

// 创建日志目录
const logDir = './logs';
if (!require('fs').existsSync(logDir)) {
    require('fs').mkdirSync(logDir, { recursive: true });
}

// 配置日志
const logger = winston.createLogger({
    level: config.logging.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'voice-chat-platform' },
    transports: [
        new winston.transports.DailyRotateFile({
            filename: config.logging.file,
            datePattern: 'YYYY-MM-DD',
            maxSize: config.logging.maxSize,
            maxFiles: config.logging.maxFiles,
            zippedArchive: true
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

const app = express();

// 安全中间件
app.use(helmet(config.security.helmet));

// 压缩中间件
app.use(compression(config.compression));

// 速率限制
const limiter = rateLimit(config.security.rateLimit);
app.use('/api/', limiter);

// CORS配置
app.use(cors(config.server.cors));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（带缓存）
app.use(express.static('.', {
    maxAge: config.cache.maxAge,
    etag: config.cache.etag,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.css') || path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
        }
    }
}));

// 资源库路径
const RESOURCES_PATH = path.join(__dirname, config.paths.resources);

// 请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
    });
    next();
});

// 错误处理中间件
app.use((err, req, res, next) => {
    logger.error('Unhandled Error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    
    if (config.isProduction) {
        res.status(500).json({ error: '服务器内部错误' });
    } else {
        res.status(500).json({ 
            error: err.message,
            stack: err.stack
        });
    }
});

// API路由

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
        logger.error('获取分类失败', { error: error.message });
        res.status(500).json({ error: '获取分类失败' });
    }
});

// 获取指定分类的资源
app.get('/api/resources/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const filePath = path.join(RESOURCES_PATH, 'knowledge', category, 'data.json');
        
        const data = await fs.readFile(filePath, 'utf8');
        const resources = JSON.parse(data);
        
        res.json(resources);
    } catch (error) {
        logger.error('获取资源失败', { category, error: error.message });
        res.status(404).json({ error: '资源不存在' });
    }
});

// 搜索资源
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.json({ results: [] });
        }

        const results = [];
        const categories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        for (const category of categories) {
            try {
                const filePath = path.join(RESOURCES_PATH, 'knowledge', category, 'data.json');
                const data = await fs.readFile(filePath, 'utf8');
                const resources = JSON.parse(data);
                
                for (const [key, resource] of Object.entries(resources.resources)) {
                    if (resource.title.toLowerCase().includes(query.toLowerCase()) ||
                        resource.description.toLowerCase().includes(query.toLowerCase()) ||
                        resource.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))) {
                        results.push({
                            category,
                            resource: { ...resource, id: key }
                        });
                    }
                }
            } catch (error) {
                logger.error(`搜索 ${category} 时出错`, { error: error.message });
            }
        }
        
        res.json({ results });
    } catch (error) {
        logger.error('搜索失败', { error: error.message });
        res.status(500).json({ error: '搜索失败' });
    }
});

// 获取资源详情
app.get('/api/resource/:category/:id', async (req, res) => {
    try {
        const { category, id } = req.params;
        const filePath = path.join(RESOURCES_PATH, 'knowledge', category, 'data.json');
        
        const data = await fs.readFile(filePath, 'utf8');
        const resources = JSON.parse(data);
        
        if (resources.resources[id]) {
            res.json({ ...resources.resources[id], id });
        } else {
            res.status(404).json({ error: '资源不存在' });
        }
    } catch (error) {
        logger.error('获取资源详情失败', { category, id, error: error.message });
        res.status(404).json({ error: '资源不存在' });
    }
});

// 获取资源统计信息
app.get('/api/stats', async (req, res) => {
    try {
        const stats = {};
        const categories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        for (const category of categories) {
            try {
                const filePath = path.join(RESOURCES_PATH, 'knowledge', category, 'data.json');
                const data = await fs.readFile(filePath, 'utf8');
                const resources = JSON.parse(data);
                stats[category] = Object.keys(resources.resources).length;
            } catch (error) {
                stats[category] = 0;
            }
        }
        
        res.json(stats);
    } catch (error) {
        logger.error('获取统计信息失败', { error: error.message });
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
        logger.error('获取相关资源失败', { category, id, error: error.message });
        res.status(500).json({ error: '获取相关资源失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: require('./package.json').version
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// 启动服务器
const server = app.listen(config.server.port, config.server.host, () => {
    logger.info(`服务器启动成功`, {
        port: config.server.port,
        host: config.server.host,
        environment: config.env,
        version: require('./package.json').version
    });
    
    console.log(`🚀 语音交流平台已启动`);
    console.log(`📍 地址: http://localhost:${config.server.port}`);
    console.log(`🌍 环境: ${config.env}`);
    console.log(`📊 健康检查: http://localhost:${config.server.port}/api/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });
});

module.exports = app;
