
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();

// 对话存储目录
const CONVERSATIONS_DIR = path.join(__dirname, '../conversations');

// 确保存储目录存在
async function ensureConversationsDir() {
    try {
        await fs.access(CONVERSATIONS_DIR);
    } catch (error) {
        await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
    }
}

// 初始化时创建目录
ensureConversationsDir();

// 获取对话列表
router.get('/conversations', async (req, res) => {
    try {
        await ensureConversationsDir();
        
        const files = await fs.readdir(CONVERSATIONS_DIR);
        const conversations = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(CONVERSATIONS_DIR, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const conversation = JSON.parse(content);
                    
                    const summary = {
                        id: conversation.id,
                        title: conversation.title || `对话 ${conversation.id}`,
                        createdAt: conversation.createdAt,
                        updatedAt: conversation.updatedAt,
                        messageCount: conversation.messages ? conversation.messages.length : 0,
                        preview: getConversationPreview(conversation),
                        tags: conversation.tags || [],
                        isStarred: conversation.isStarred || false,
                        category: conversation.category || '',
                        summary: conversation.summary || '',
                        wordCount: conversation.wordCount || 0,
                        duration: conversation.duration || 0
                    };
                    
                    conversations.push(summary);
                } catch (error) {
                    console.error(`读取对话文件 ${file} 失败:`, error);
                }
            }
        }
        
        conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        res.json(conversations);
    } catch (error) {
        console.error('获取对话列表失败:', error);
        res.status(500).json({ error: '获取对话列表失败' });
    }
});

// 获取指定对话
router.get('/conversations/:id', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        res.json(conversation);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`获取对话 ${req.params.id} 失败:`, error);
            res.status(500).json({ error: '获取对话失败' });
        }
    }
});

// 保存对话
router.post('/conversations', async (req, res) => {
    try {
        await ensureConversationsDir();
        
        const conversation = req.body;
        
        if (!conversation.id || !conversation.messages || !Array.isArray(conversation.messages)) {
            return res.status(400).json({ error: '无效的对话数据格式' });
        }
        
        conversation.updatedAt = new Date().toISOString();
        conversation.metadata = {
            totalMessages: conversation.messages.length,
            userMessages: conversation.messages.filter(m => m.role === 'user').length,
            aiMessages: conversation.messages.filter(m => m.role === 'ai').length,
            systemMessages: conversation.messages.filter(m => m.role === 'system').length
        };
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '对话保存成功' });
    } catch (error) {
        console.error('保存对话失败:', error);
        res.status(500).json({ error: '保存对话失败' });
    }
});

// 更新对话
router.put('/conversations/:id', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const conversation = req.body;
        
        if (!conversation.messages || !Array.isArray(conversation.messages)) {
            return res.status(400).json({ error: '无效的对话数据格式' });
        }
        
        conversation.updatedAt = new Date().toISOString();
        conversation.metadata = {
            totalMessages: conversation.messages.length,
            userMessages: conversation.messages.filter(m => m.role === 'user').length,
            aiMessages: conversation.messages.filter(m => m.role === 'ai').length,
            systemMessages: conversation.messages.filter(m => m.role === 'system').length
        };
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '对话更新成功' });
    } catch (error) {
        console.error(`更新对话 ${req.params.id} 失败:`, error);
        res.status(500).json({ error: '更新对话失败' });
    }
});

// 删除对话
router.delete('/conversations/:id', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        
        await fs.unlink(filePath);
        
        res.json({ success: true, message: '对话删除成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`删除对话 ${req.params.id} 失败:`, error);
            res.status(500).json({ error: '删除对话失败' });
        }
    }
});

// 清空所有对话
router.delete('/conversations', async (req, res) => {
    try {
        const files = await fs.readdir(CONVERSATIONS_DIR);
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(CONVERSATIONS_DIR, file);
                await fs.unlink(filePath);
            }
        }
        
        res.json({ success: true, message: '所有对话已清空' });
    } catch (error) {
        console.error('清空所有对话失败:', error);
        res.status(500).json({ error: '清空对话失败' });
    }
});

// 导入对话
router.post('/conversations/import', async (req, res) => {
    try {
        await ensureConversationsDir();
        
        const conversation = req.body;
        
        if (!conversation.id || !conversation.messages || !Array.isArray(conversation.messages)) {
            return res.status(400).json({ error: '无效的对话文件格式' });
        }
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`);
        try {
            await fs.access(filePath);
            return res.status(409).json({ error: '对话已存在' });
        } catch (error) {
            // 文件不存在，可以继续导入
        }
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '对话导入成功' });
    } catch (error) {
        console.error('导入对话失败:', error);
        res.status(500).json({ error: '导入对话失败' });
    }
});

// 切换收藏状态
router.put('/conversations/:id/star', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { isStarred } = req.body;
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        conversation.isStarred = isStarred;
        conversation.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '收藏状态更新成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`更新收藏状态失败:`, error);
            res.status(500).json({ error: '更新收藏状态失败' });
        }
    }
});

// 添加标签
router.post('/conversations/:id/tags', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { tags } = req.body;
        
        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: '标签必须是数组' });
        }
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        conversation.tags = conversation.tags || [];
        tags.forEach(tag => {
            if (!conversation.tags.includes(tag)) {
                conversation.tags.push(tag);
            }
        });
        
        conversation.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '标签添加成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`添加标签失败:`, error);
            res.status(500).json({ error: '添加标签失败' });
        }
    }
});

// 移除标签
router.delete('/conversations/:id/tags', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { tags } = req.body;
        
        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: '标签必须是数组' });
        }
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        conversation.tags = conversation.tags || [];
        conversation.tags = conversation.tags.filter(tag => !tags.includes(tag));
        
        conversation.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '标签移除成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`移除标签失败:`, error);
            res.status(500).json({ error: '移除标签失败' });
        }
    }
});

// 更新对话标题
router.patch('/conversations/:id/title', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { title } = req.body;
        
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({ error: '标题不能为空' });
        }
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        conversation.title = title.trim();
        conversation.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '标题更新成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`更新对话标题失败:`, error);
            res.status(500).json({ error: '更新标题失败' });
        }
    }
});

// 设置分类
router.put('/conversations/:id/category', async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { category } = req.body;
        
        const filePath = path.join(CONVERSATIONS_DIR, `${conversationId}.json`);
        const content = await fs.readFile(filePath, 'utf8');
        const conversation = JSON.parse(content);
        
        conversation.category = category;
        conversation.updatedAt = new Date().toISOString();
        
        await fs.writeFile(filePath, JSON.stringify(conversation, null, 2), 'utf8');
        
        res.json({ success: true, message: '分类设置成功' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: '对话不存在' });
        } else {
            console.error(`设置分类失败:`, error);
            res.status(500).json({ error: '设置分类失败' });
        }
    }
});

// 获取对话统计信息
router.get('/conversations/stats/summary', async (req, res) => {
    try {
        await ensureConversationsDir();
        
        const files = await fs.readdir(CONVERSATIONS_DIR);
        const stats = {
            total: 0,
            starred: 0,
            categories: {},
            tags: {},
            totalMessages: 0,
            totalWords: 0,
            averageDuration: 0
        };
        
        let totalDuration = 0;
        let conversationsWithDuration = 0;
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const filePath = path.join(CONVERSATIONS_DIR, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const conversation = JSON.parse(content);
                    
                    stats.total++;
                    
                    if (conversation.isStarred) {
                        stats.starred++;
                    }
                    
                    // 分类统计
                    const category = conversation.category || 'uncategorized';
                    stats.categories[category] = (stats.categories[category] || 0) + 1;
                    
                    // 标签统计
                    if (conversation.tags) {
                        conversation.tags.forEach(tag => {
                            stats.tags[tag] = (stats.tags[tag] || 0) + 1;
                        });
                    }
                    
                    // 消息和字数统计
                    stats.totalMessages += conversation.messageCount || 0;
                    stats.totalWords += conversation.wordCount || 0;
                    
                    // 时长统计
                    if (conversation.duration > 0) {
                        totalDuration += conversation.duration;
                        conversationsWithDuration++;
                    }
                } catch (error) {
                    console.error(`读取对话文件 ${file} 失败:`, error);
                }
            }
        }
        
        // 计算平均时长
        if (conversationsWithDuration > 0) {
            stats.averageDuration = Math.round(totalDuration / conversationsWithDuration);
        }
        
        res.json(stats);
    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({ error: '获取统计信息失败' });
    }
});

// 获取对话预览
function getConversationPreview(conversation) {
    if (!conversation.messages || conversation.messages.length === 0) {
        return '新对话';
    }
    
    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        const content = firstUserMessage.content;
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    
    return '对话';
}

module.exports = router;