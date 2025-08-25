/**
 * 对话历史记录管理器（服务器端存储版本 - 优化版）
 * 支持将对话保存到服务器文件系统，并在页面加载时恢复对话
 * 新增功能：对话标签、收藏、搜索优化、批量操作、数据统计
 */
class ConversationHistoryManager {
    constructor() {
        this.currentConversation = {
            id: this.generateConversationId(),
            title: '',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                totalMessages: 0,
                userMessages: 0,
                aiMessages: 0,
                systemMessages: 0
            },
            tags: [],           // 新增：对话标签
            isStarred: false,   // 新增：收藏状态
            category: '',       // 新增：对话分类
            summary: '',        // 新增：对话摘要
            wordCount: 0,       // 新增：字数统计
            duration: 0         // 新增：对话时长（分钟）
        };
        
        this.conversations = [];
        this.isLoading = false;
        this.apiBaseUrl = '/api'; // 服务器API基础URL
        this.searchIndex = new Map(); // 新增：搜索索引
        this.categories = [     // 新增：预定义分类
            'general', 'work', 'study', 'entertainment', 'shopping', 'travel', 'health', 'other'
        ];
        
        this.init();
    }

    /**
     * 生成对话ID
     */
    generateConversationId() {
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
                       (now.getMonth() + 1).toString().padStart(2, '0') +
                       now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') +
                       now.getMinutes().toString().padStart(2, '0') +
                       now.getSeconds().toString().padStart(2, '0');
        return `${dateStr}-${timeStr}`;
    }

    /**
     * 初始化管理器
     */
    async init() {
        this.isLoading = true;
        
        try {
            // 检查服务器连接
            const serverAvailable = await this.checkServerConnection();
            if (!serverAvailable) {
                console.warn('服务器不可用，对话历史记录功能将不可用');
                return;
            }
            
            // 加载现有对话列表
            await this.loadConversationsList();
            
            // 构建搜索索引
            this.buildSearchIndex();
            
            // 尝试恢复最近的对话
            await this.loadMostRecentConversation();
            
            console.log('对话历史记录管理器初始化完成');
        } catch (error) {
            console.error('对话历史记录管理器初始化失败:', error);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 检查服务器连接
     */
    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations`);
            return response.ok;
        } catch (error) {
            console.warn('服务器连接检查失败:', error);
            return false;
        }
    }

    /**
     * 加载对话列表
     */
    async loadConversationsList() {
        try {
            console.log('开始加载对话列表...');
            const response = await fetch(`${this.apiBaseUrl}/conversations`);
            if (response.ok) {
                this.conversations = await response.json();
                console.log('对话列表加载成功，数量:', this.conversations.length);
                console.log('对话列表:', this.conversations);
            } else {
                console.error('加载对话列表失败:', response.statusText);
                this.conversations = [];
            }
        } catch (error) {
            console.error('加载对话列表失败:', error);
            this.conversations = [];
        }
    }

    /**
     * 构建搜索索引
     */
    buildSearchIndex() {
        this.searchIndex.clear();
        this.conversations.forEach(conversation => {
            const searchText = [
                conversation.title,
                conversation.summary || '',
                conversation.tags?.join(' ') || '',
                conversation.category || ''
            ].join(' ').toLowerCase();
            
            // 分词并建立索引
            const words = searchText.split(/\s+/);
            words.forEach(word => {
                if (word.length > 1) {
                    if (!this.searchIndex.has(word)) {
                        this.searchIndex.set(word, []);
                    }
                    this.searchIndex.get(word).push(conversation.id);
                }
            });
        });
    }

    /**
     * 高级搜索
     */
    searchConversations(query, options = {}) {
        const {
            category = '',
            tags = [],
            isStarred = null,
            dateRange = null,
            sortBy = 'updatedAt',
            sortOrder = 'desc'
        } = options;

        console.log('搜索参数:', { query, options });
        console.log('当前对话列表数量:', this.conversations.length);

        let results = [...this.conversations];

        // 文本搜索
        if (query) {
            const searchWords = query.toLowerCase().split(/\s+/);
            results = results.filter(conversation => {
                const searchText = [
                    conversation.title,
                    conversation.summary || '',
                    conversation.tags?.join(' ') || '',
                    conversation.category || ''
                ].join(' ').toLowerCase();
                
                return searchWords.every(word => searchText.includes(word));
            });
        }

        // 分类筛选
        if (category) {
            results = results.filter(conv => conv.category === category);
        }

        // 标签筛选
        if (tags.length > 0) {
            results = results.filter(conv => 
                tags.every(tag => conv.tags?.includes(tag))
            );
        }

        // 收藏筛选
        if (isStarred !== null) {
            results = results.filter(conv => conv.isStarred === isStarred);
        }

        // 日期范围筛选
        if (dateRange) {
            const { start, end } = dateRange;
            results = results.filter(conv => {
                const date = new Date(conv.updatedAt);
                return (!start || date >= new Date(start)) && 
                       (!end || date <= new Date(end));
            });
        }

        // 排序
        results.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }
            
            if (sortOrder === 'desc') {
                return bVal - aVal;
            } else {
                return aVal - bVal;
            }
        });

        console.log('搜索结果数量:', results.length);
        console.log('搜索结果:', results);

        return results;
    }

    /**
     * 获取对话统计信息
     */
    getConversationStats() {
        const stats = {
            total: this.conversations.length,
            starred: this.conversations.filter(c => c.isStarred).length,
            categories: {},
            tags: {},
            totalMessages: 0,
            totalWords: 0,
            averageDuration: 0
        };

        this.conversations.forEach(conv => {
            // 分类统计
            const category = conv.category || 'uncategorized';
            stats.categories[category] = (stats.categories[category] || 0) + 1;

            // 标签统计
            conv.tags?.forEach(tag => {
                stats.tags[tag] = (stats.tags[tag] || 0) + 1;
            });

            // 消息和字数统计
            stats.totalMessages += conv.messageCount || 0;
            stats.totalWords += conv.wordCount || 0;
        });

        // 平均时长
        const conversationsWithDuration = this.conversations.filter(c => c.duration > 0);
        if (conversationsWithDuration.length > 0) {
            stats.averageDuration = conversationsWithDuration.reduce((sum, c) => sum + c.duration, 0) / conversationsWithDuration.length;
        }

        return stats;
    }

    /**
     * 批量操作
     */
    async batchOperation(conversationIds, operation) {
        const results = [];
        
        for (const id of conversationIds) {
            try {
                let result;
                switch (operation) {
                    case 'star':
                        result = await this.setStar(id, true);
                        break;
                    case 'unstar':
                        result = await this.setStar(id, false);
                        break;
                    case 'delete':
                        result = await this.deleteConversation(id);
                        break;
                    case 'export':
                        result = await this.exportConversation(id);
                        break;
                    default:
                        throw new Error(`未知操作: ${operation}`);
                }
                results.push({ id, success: true, result });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }
        
        // 重新加载列表
        await this.loadConversationsList();
        this.buildSearchIndex();
        
        return results;
    }

    /**
     * 切换收藏状态
     */
    async toggleStar(conversationId) {
        try {
            const conversation = this.conversations.find(c => c.id === conversationId);
            if (!conversation) {
                throw new Error('对话不存在');
            }

            return await this.setStar(conversationId, !conversation.isStarred);
        } catch (error) {
            console.error(`切换收藏状态失败:`, error);
            return false;
        }
    }

    /**
     * 设置收藏状态
     */
    async setStar(conversationId, isStarred) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}/star`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isStarred })
            });

            if (response.ok) {
                await this.loadConversationsList();
                this.buildSearchIndex();
                return true;
            } else {
                throw new Error('操作失败');
            }
        } catch (error) {
            console.error(`设置收藏状态失败:`, error);
            return false;
        }
    }



    /**
     * 生成对话摘要
     */
    generateConversationSummary(messages) {
        if (!messages || messages.length === 0) {
            return '';
        }

        const userMessages = messages.filter(m => m.role === 'user');
        const aiMessages = messages.filter(m => m.role === 'ai');

        if (userMessages.length === 0) {
            return '新对话';
        }

        // 提取关键词和主题
        const firstUserMessage = userMessages[0].content;
        const lastUserMessage = userMessages[userMessages.length - 1].content;

        // 简单的摘要生成逻辑
        let summary = firstUserMessage;
        if (userMessages.length > 1 && lastUserMessage !== firstUserMessage) {
            summary += `...${lastUserMessage}`;
        }

        // 限制长度
        if (summary.length > 100) {
            summary = summary.substring(0, 97) + '...';
        }

        return summary;
    }

    /**
     * 计算字数统计
     */
    calculateWordCount(messages) {
        if (!messages || messages.length === 0) {
            return 0;
        }

        return messages.reduce((total, message) => {
            return total + (message.content?.length || 0);
        }, 0);
    }

    /**
     * 计算对话时长
     */
    calculateDuration(messages) {
        if (!messages || messages.length < 2) {
            return 0;
        }

        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        
        const startTime = new Date(firstMessage.timestamp);
        const endTime = new Date(lastMessage.timestamp);
        
        return Math.round((endTime - startTime) / (1000 * 60)); // 分钟
    }

    /**
     * 自动生成标签
     */
    generateTags(messages) {
        const tags = [];
        
        if (!messages || messages.length === 0) {
            return tags;
        }

        // 简单的标签生成逻辑
        const content = messages.map(m => m.content).join(' ').toLowerCase();
        
        // 预定义标签关键词
        const tagKeywords = {
            '工作': ['工作', '项目', '会议', '报告', '任务'],
            '学习': ['学习', '课程', '考试', '作业', '研究'],
            '购物': ['购买', '商品', '价格', '优惠', '购物'],
            '旅行': ['旅行', '旅游', '景点', '酒店', '机票'],
            '健康': ['健康', '医疗', '医生', '症状', '治疗'],
            '娱乐': ['电影', '音乐', '游戏', '娱乐', '休闲']
        };

        Object.entries(tagKeywords).forEach(([tag, keywords]) => {
            if (keywords.some(keyword => content.includes(keyword))) {
                tags.push(tag);
            }
        });

        return tags;
    }

    /**
     * 保存对话列表（服务器端不需要单独保存列表）
     */
    async saveConversationsList() {
        // 服务器端会自动维护对话列表，这里不需要额外操作
        return true;
    }

    /**
     * 加载最近的对话
     */
    async loadMostRecentConversation() {
        if (this.conversations.length === 0) {
            return;
        }

        const mostRecent = this.conversations[0]; // 假设按时间倒序排列
        await this.loadConversation(mostRecent.id);
        
        // 通知历史记录管理器恢复对话
        if (window.historyManager) {
            window.historyManager.restoreCurrentConversation();
        }
    }

    /**
     * 加载指定对话
     */
    async loadConversation(conversationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}`);
            if (response.ok) {
                this.currentConversation = await response.json();
                
                // 更新对话管理器中的消息
                if (window.historyManager) {
                    window.historyManager.isRestoring = true;
                    window.historyManager.clearCurrentMessages();
                    this.currentConversation.messages.forEach(message => {
                        // 直接添加到历史记录管理器的消息数组，避免重复保存
                        window.historyManager.currentMessages.push(message);
                        window.historyManager.displayMessage(message);
                    });
                    window.historyManager.isRestoring = false;
                }
                
                console.log(`对话 ${conversationId} 加载成功`);
                return true;
            } else {
                console.error(`加载对话 ${conversationId} 失败:`, response.statusText);
                return false;
            }
        } catch (error) {
            console.error(`加载对话 ${conversationId} 失败:`, error);
            return false;
        }
    }

    /**
     * 保存当前对话
     */
    async saveCurrentConversation() {
        try {
            // 更新元数据
            this.currentConversation.updatedAt = new Date().toISOString();
            this.currentConversation.metadata.totalMessages = this.currentConversation.messages.length;
            this.currentConversation.metadata.userMessages = this.currentConversation.messages.filter(m => m.role === 'user').length;
            this.currentConversation.metadata.aiMessages = this.currentConversation.messages.filter(m => m.role === 'ai').length;
            this.currentConversation.metadata.systemMessages = this.currentConversation.messages.filter(m => m.role === 'system').length;

            // 生成摘要和统计信息
            this.currentConversation.summary = this.generateConversationSummary(this.currentConversation.messages);
            this.currentConversation.wordCount = this.calculateWordCount(this.currentConversation.messages);
            this.currentConversation.duration = this.calculateDuration(this.currentConversation.messages);

            // 自动生成标签（如果还没有标签）
            if (!this.currentConversation.tags || this.currentConversation.tags.length === 0) {
                this.currentConversation.tags = this.generateTags(this.currentConversation.messages);
            }

            // 保存到服务器
            const response = await fetch(`${this.apiBaseUrl}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentConversation)
            });

            if (response.ok) {
                // 更新对话列表
                await this.loadConversationsList();
                this.buildSearchIndex();
                console.log(`对话 ${this.currentConversation.id} 保存成功`);
                return true;
            } else {
                console.error('保存对话失败:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('保存对话失败:', error);
            return false;
        }
    }

    /**
     * 更新对话列表（服务器端自动维护，这里不需要手动更新）
     */
    async updateConversationsList() {
        // 服务器端会自动维护对话列表，这里只需要重新加载
        await this.loadConversationsList();
        this.buildSearchIndex();
    }

    /**
     * 获取对话预览
     */
    getConversationPreview() {
        const firstUserMessage = this.currentConversation.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            const content = firstUserMessage.content;
            return content.length > 50 ? content.substring(0, 50) + '...' : content;
        }
        return '新对话';
    }

    /**
     * 添加消息到当前对话
     */
    addMessage(role, content, metadata = {}) {
        const message = {
            id: this.generateMessageId(),
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            metadata: metadata
        };

        this.currentConversation.messages.push(message);

        // 如果是第一条用户消息，尝试生成标题
        if (role === 'user' && this.currentConversation.messages.filter(m => m.role === 'user').length === 1) {
            this.generateConversationTitle(content);
        }

        // 自动保存
        this.saveCurrentConversation();

        return message;
    }

    /**
     * 生成对话标题
     */
    generateConversationTitle(firstUserMessage) {
        if (firstUserMessage.length > 20) {
            this.currentConversation.title = firstUserMessage.substring(0, 20) + '...';
        } else {
            this.currentConversation.title = firstUserMessage;
        }
    }

    /**
     * 生成消息ID
     */
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 创建新对话
     */
    async createNewConversation() {
        // 保存当前对话
        if (this.currentConversation.messages.length > 0) {
            await this.saveCurrentConversation();
        }

        // 创建新对话
        this.currentConversation = {
            id: this.generateConversationId(),
            title: '',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                totalMessages: 0,
                userMessages: 0,
                aiMessages: 0,
                systemMessages: 0
            },
            tags: [],
            isStarred: false,
            category: '',
            summary: '',
            wordCount: 0,
            duration: 0
        };

        // 清空显示
        if (window.historyManager) {
            window.historyManager.clearCurrentMessages();
        }

        console.log('新对话已创建');
    }

    /**
     * 删除对话
     */
    async deleteConversation(conversationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // 重新加载对话列表
                await this.loadConversationsList();
                this.buildSearchIndex();

                // 如果删除的是当前对话，创建新对话
                if (this.currentConversation.id === conversationId) {
                    await this.createNewConversation();
                }

                console.log(`对话 ${conversationId} 删除成功`);
                return true;
            } else {
                console.error(`删除对话 ${conversationId} 失败:`, response.statusText);
                return false;
            }
        } catch (error) {
            console.error(`删除对话 ${conversationId} 失败:`, error);
            return false;
        }
    }

    /**
     * 导出对话为JSON文件
     */
    async exportConversation(conversationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}`);
            if (!response.ok) {
                throw new Error('对话不存在');
            }

            const conversation = await response.json();
            const blob = new Blob([JSON.stringify(conversation, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${conversationId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`对话 ${conversationId} 导出成功`);
            return true;
        } catch (error) {
            console.error(`导出对话 ${conversationId} 失败:`, error);
            return false;
        }
    }

    /**
     * 导入对话
     */
    async importConversation(file) {
        try {
            const text = await file.text();
            const conversation = JSON.parse(text);
            
            // 验证对话格式
            if (!conversation.id || !conversation.messages || !Array.isArray(conversation.messages)) {
                throw new Error('无效的对话文件格式');
            }

            // 保存到服务器
            const response = await fetch(`${this.apiBaseUrl}/conversations/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(conversation)
            });

            if (response.ok) {
                // 重新加载对话列表
                await this.loadConversationsList();
                this.buildSearchIndex();
                console.log(`对话 ${conversation.id} 导入成功`);
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || '导入失败');
            }
        } catch (error) {
            console.error('导入对话失败:', error);
            return false;
        }
    }

    /**
     * 从对话数据获取预览
     */
    getConversationPreviewFromData(conversation) {
        const firstUserMessage = conversation.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            const content = firstUserMessage.content;
            return content.length > 50 ? content.substring(0, 50) + '...' : content;
        }
        return '导入的对话';
    }

    /**
     * 获取对话列表
     */
    getConversationsList() {
        return this.conversations;
    }

    /**
     * 获取当前对话
     */
    getCurrentConversation() {
        return this.currentConversation;
    }

    /**
     * 清空所有对话
     */
    async clearAllConversations() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // 清空列表
                this.conversations = [];
                this.searchIndex.clear();
                
                // 创建新对话
                await this.createNewConversation();
                
                console.log('所有对话已清空');
                return true;
            } else {
                console.error('清空对话失败:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('清空对话失败:', error);
            return false;
        }
    }

    /**
     * 更新对话标题
     */
    async updateConversationTitle(conversationId, newTitle) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/conversations/${conversationId}/title`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });

            if (response.ok) {
                // 更新本地数据
                const conversation = this.conversations.find(c => c.id === conversationId);
                if (conversation) {
                    conversation.title = newTitle;
                    conversation.updatedAt = new Date().toISOString();
                    
                    // 更新搜索索引
                    this.updateSearchIndex(conversation);
                }
                
                console.log(`对话 ${conversationId} 标题已更新为: ${newTitle}`);
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新标题失败');
            }
        } catch (error) {
            console.error('更新对话标题失败:', error);
            return false;
        }
    }

    /**
     * 更新搜索索引
     */
    updateSearchIndex(conversation) {
        // 移除旧的索引
        this.searchIndex.delete(conversation.id);
        
        // 添加新的索引
        const searchText = `${conversation.title} ${conversation.summary} ${conversation.tags.join(' ')}`.toLowerCase();
        this.searchIndex.set(conversation.id, searchText);
    }


}

// 等待DOM完全加载后再初始化对话历史记录管理器
document.addEventListener('DOMContentLoaded', () => {
    window.conversationHistoryManager = new ConversationHistoryManager();
});
