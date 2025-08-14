class ResourceManager {
    constructor() {
        this.resources = {};
        this.categories = {
            traditionalFoods: { name: '传统美食', icon: 'fa-utensils', color: '#DC143C' },
            traditionalCrafts: { name: '传统工艺', icon: 'fa-gem', color: '#FFD700' },
            traditionalOpera: { name: '传统戏曲', icon: 'fa-mask', color: '#8B4513' },
            traditionalFestivals: { name: '传统节日', icon: 'fa-calendar', color: '#FF6B35' },
            traditionalMedicine: { name: '传统医药', icon: 'fa-leaf', color: '#228B22' },
            traditionalArchitecture: { name: '传统建筑', icon: 'fa-building', color: '#696969' }
        };
        
        // 导入配置
        this.importConfig = {
            supportedFormats: ['.json'],
            maxFileSize: 10 * 1024 * 1024, // 10MB
            autoLoad: true,
            validateSchema: true
        };
        
        // 导入历史记录
        this.importHistory = this.loadImportHistory();
        
        this.init();
    }

    async init() {
        await this.loadResources();
        this.renderKnowledgeSidebar();
    }

    async loadResources() {
        try {
            // 首先尝试加载导入的资源库（优先）
            await this.loadImportedResources();
            
            // 如果没有导入的资源，则加载本地资源库
            if (Object.keys(this.resources).length === 0) {
                console.log('没有找到导入的资源，加载本地资源库...');
                const categories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
                
                for (const category of categories) {
                    try {
                        const response = await fetch(`resources/knowledge/${category}/data.json`);
                        if (response.ok) {
                            const data = await response.json();
                            this.resources[category] = data.resources;
                            console.log(`成功加载本地 ${category} 资源库，共 ${Object.keys(data.resources).length} 项`);
                        } else {
                            console.warn(`无法加载本地 ${category} 资源库: ${response.status}`);
                        }
                    } catch (error) {
                        console.error(`加载本地 ${category} 资源库失败:`, error);
                    }
                }
            }
            
            console.log('资源库加载完成:', this.resources);
            
            // 更新资源统计显示
            this.updateResourceStats();
        } catch (error) {
            console.error('加载资源失败:', error);
        }
    }

    /**
     * 加载导入的资源库
     */
    async loadImportedResources() {
        try {
            const importedData = localStorage.getItem('imported_resources');
            if (importedData) {
                const imported = JSON.parse(importedData);
                // 完全替换本地资源
                this.resources = imported;
                console.log('成功加载导入的资源库，完全替换本地资源');
            }
        } catch (error) {
            console.error('加载导入资源失败:', error);
        }
    }

    /**
     * 导入资源文件
     * @param {File} file - 要导入的文件
     */
    async importResourceFile(file) {
        try {
            // 验证文件格式
            if (!this.importConfig.supportedFormats.some(format => file.name.toLowerCase().endsWith(format))) {
                throw new Error(`不支持的文件格式。支持格式: ${this.importConfig.supportedFormats.join(', ')}`);
            }

            // 验证文件大小
            if (file.size > this.importConfig.maxFileSize) {
                throw new Error(`文件过大。最大支持: ${this.importConfig.maxFileSize / 1024 / 1024}MB`);
            }

            // 读取文件内容
            const content = await this.readFileAsText(file);
            const data = JSON.parse(content);

            // 验证数据格式
            let categories = [];
            if (this.importConfig.validateSchema) {
                categories = this.validateResourceData(data);
            }

            // 处理导入的数据
            const result = await this.processImportedData(data, file.name);

            // 保存导入历史
            this.saveImportHistory(file.name, data, result);

            // 重新渲染界面
            this.renderKnowledgeSidebar();
            this.updateResourceStats();

            return {
                success: true,
                message: '资源导入成功',
                importedCount: this.getImportedCount(data)
            };

        } catch (error) {
            console.error('导入资源失败:', error);
            return {
                success: false,
                message: `导入失败: ${error.message}`
            };
        }
    }

    /**
     * 读取文件为文本
     * @param {File} file - 文件对象
     * @returns {Promise<string>} 文件内容
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 验证资源数据格式
     * @param {Object} data - 要验证的数据
     */
    validateResourceData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('无效的数据格式');
        }

        // 支持两种格式：
        // 1. 标准格式：{ category: "xxx", resources: {...} }
        // 2. 直接分类格式：{ traditionalFoods: {...}, traditionalCrafts: {...} }
        
        let hasValidFormat = false;
        let categories = [];

        // 检查是否为标准格式
        if (data.category && this.categories[data.category] && data.resources) {
            hasValidFormat = true;
            categories.push(data.category);
        }

        // 检查是否为直接分类格式
        for (const [category, resources] of Object.entries(data)) {
            if (this.categories[category] && typeof resources === 'object') {
                hasValidFormat = true;
                categories.push(category);
                
                // 验证每个资源项
                for (const [id, resource] of Object.entries(resources)) {
                    // 检查资源是否有基本结构
                    if (!resource || typeof resource !== 'object') {
                        console.warn(`资源 ${id} 格式无效，跳过`);
                        continue;
                    }
                    
                    // title 和 description 现在是可选字段，如果没有则使用默认值
                    if (!resource.title) {
                        resource.title = resource.id || id;
                        console.log(`资源 ${id} 缺少 title，使用 id 作为默认值`);
                    }
                    
                    if (!resource.description) {
                        resource.description = resource.content || resource.title || '暂无描述';
                        console.log(`资源 ${id} 缺少 description，使用 content 或 title 作为默认值`);
                    }
                }
            }
        }

        if (!hasValidFormat) {
            throw new Error('无效的数据格式，请检查分类名称和资源结构');
        }

        return categories;
    }

    /**
     * 处理导入的数据
     * @param {Object} data - 导入的数据
     * @param {string} fileName - 文件名
     */
    async processImportedData(data, fileName) {
        let totalImported = 0;
        const importedCategories = [];
        const processedResources = {};

        // 支持两种格式：
        // 1. 标准格式：{ category: "xxx", resources: {...} }
        // 2. 直接分类格式：{ traditionalFoods: {...}, traditionalCrafts: {...} }
        
        if (data.category && this.categories[data.category] && data.resources) {
            // 标准格式
            const category = data.category;
            processedResources[category] = this.processResources(data.resources);
            totalImported += Object.keys(processedResources[category]).length;
            importedCategories.push(category);
        } else {
            // 直接分类格式
            for (const [category, resources] of Object.entries(data)) {
                if (this.categories[category] && typeof resources === 'object') {
                    processedResources[category] = this.processResources(resources);
                    totalImported += Object.keys(processedResources[category]).length;
                    importedCategories.push(category);
                }
            }
        }

        // 完全替换现有资源
        this.resources = processedResources;

        // 保存到本地存储
        this.saveImportedResources();

        console.log(`成功导入 ${fileName}，分类: ${importedCategories.join(', ')}，资源数量: ${totalImported}`);
        
        return {
            totalImported,
            importedCategories
        };
    }

    /**
     * 处理资源数据，确保所有必要字段都存在
     * @param {Object} resources - 资源对象
     * @returns {Object} 处理后的资源对象
     */
    processResources(resources) {
        const processed = {};
        
        for (const [id, resource] of Object.entries(resources)) {
            if (!resource || typeof resource !== 'object') {
                console.warn(`资源 ${id} 格式无效，跳过`);
                continue;
            }

            // 创建处理后的资源对象
            const processedResource = { ...resource };

            // 确保必要字段存在
            if (!processedResource.id) {
                processedResource.id = id;
            }

            if (!processedResource.title) {
                processedResource.title = processedResource.id || id;
            }

            if (!processedResource.description) {
                processedResource.description = processedResource.content || processedResource.title || '暂无描述';
            }

            if (!processedResource.content) {
                processedResource.content = processedResource.description || processedResource.title || '暂无内容';
            }

            // 确保数组字段存在
            if (!Array.isArray(processedResource.tags)) {
                processedResource.tags = [];
            }

            if (!Array.isArray(processedResource.keywords)) {
                processedResource.keywords = [];
            }

            if (!Array.isArray(processedResource.media)) {
                processedResource.media = [];
            }

            // 确保时间字段存在
            if (!processedResource.createdAt) {
                processedResource.createdAt = new Date().toISOString();
            }

            if (!processedResource.updatedAt) {
                processedResource.updatedAt = new Date().toISOString();
            }

            processed[id] = processedResource;
        }

        return processed;
    }

    /**
     * 保存导入的资源到本地存储
     */
    saveImportedResources() {
        try {
            // 保存完整的资源库
            localStorage.setItem('imported_resources', JSON.stringify(this.resources));
            console.log('资源库已保存到本地存储');
        } catch (error) {
            console.error('保存导入资源失败:', error);
        }
    }

    /**
     * 获取导入的资源数量
     * @param {Object} data - 导入的数据
     * @returns {Object} 各分类的导入数量
     */
    getImportedCount(data) {
        const counts = {};
        
        // 支持两种格式
        if (data.category && data.resources) {
            // 标准格式
            counts[data.category] = Object.keys(data.resources).length;
        } else {
            // 直接分类格式
            for (const [category, resources] of Object.entries(data)) {
                if (this.categories[category] && typeof resources === 'object') {
                    counts[category] = Object.keys(resources).length;
                }
            }
        }
        
        return counts;
    }

    /**
     * 保存导入历史
     * @param {string} fileName - 文件名
     * @param {Object} data - 导入的数据
     * @param {Object} result - 导入结果
     */
    saveImportHistory(fileName, data, result) {
        const history = {
            fileName,
            timestamp: new Date().toISOString(),
            categories: result.importedCategories,
            resourceCount: result.totalImported
        };

        this.importHistory.unshift(history);
        
        // 只保留最近10条记录
        if (this.importHistory.length > 10) {
            this.importHistory = this.importHistory.slice(0, 10);
        }

        localStorage.setItem('import_history', JSON.stringify(this.importHistory));
    }

    /**
     * 加载导入历史
     * @returns {Array} 导入历史记录
     */
    loadImportHistory() {
        try {
            const history = localStorage.getItem('import_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('加载导入历史失败:', error);
            return [];
        }
    }

    /**
     * 清除导入的资源，恢复到本地资源库
     */
    clearImportedResources() {
        try {
            // 清除本地存储中的导入资源
            localStorage.removeItem('imported_resources');
            
            // 清空当前资源
            this.resources = {};
            
            // 重新加载本地资源库
            this.loadResources();
            
            // 重新渲染界面
            this.renderKnowledgeSidebar();
            this.updateResourceStats();

            console.log('已清除导入资源，恢复到本地资源库');

            return {
                success: true,
                message: '已清除导入资源，恢复到本地资源库'
            };

        } catch (error) {
            console.error('清除导入资源失败:', error);
            return {
                success: false,
                message: `清除失败: ${error.message}`
            };
        }
    }

    updateResourceStats() {
        const totalResourcesElement = document.getElementById('total-resources');
        if (totalResourcesElement) {
            let total = 0;
            for (const [category, resources] of Object.entries(this.resources)) {
                if (resources) {
                    total += Object.keys(resources).length;
                }
            }
            totalResourcesElement.textContent = `共 ${total} 项资源`;
        }
    }

    renderKnowledgeSidebar() {
        const sidebar = document.getElementById('knowledge-content');
        if (!sidebar) return;

        sidebar.innerHTML = `
            <div class="knowledge-sidebar-content">
                <!-- 知识库标题 -->
                <div class="knowledge-header">
                    <div class="header-main">
                        <div class="header-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <div class="header-text">
                            <h1 class="header-title">非遗文化知识库</h1>
                            <p class="header-subtitle">Traditional Heritage Knowledge Base</p>
                        </div>
                    </div>
                    <div class="header-stats">
                        <div class="stat-item">
                            <span class="stat-number">${this.getTotalCount()}</span>
                            <span class="stat-label">总条目</span>
                        </div>
                    </div>
                </div>

                <!-- 导入功能区域 -->
                <div class="import-section">
                    <div class="import-controls">
                        <input type="file" id="file-input" accept=".json" style="display: none;">
                        <button class="import-btn" id="import-btn">
                            <i class="fas fa-upload"></i>
                            导入资源
                        </button>
                    </div>
                </div>

                <!-- 主要内容区域 -->
                <div class="main-content-area">
                    <!-- 左侧：分类导航 -->
                    <div class="sidebar-left">
                        <div class="category-nav">
                            <div class="nav-section">
                                <h3 class="nav-title">分类浏览</h3>
                                <div class="nav-list">
                                    <button class="nav-item active" data-category="all">
                                        <div class="nav-icon">📚</div>
                                        <div class="nav-content">
                                            <div class="nav-name">全部知识</div>
                                            <div class="nav-count">${this.getTotalCount()} 条目</div>
                                        </div>
                                    </button>
                                    ${Object.entries(this.categories).map(([key, category]) => `
                                        <button class="nav-item" data-category="${key}">
                                            <div class="nav-icon">${this.getCategoryEmoji(key)}</div>
                                            <div class="nav-content">
                                                <div class="nav-name">${category.name}</div>
                                                <div class="nav-count">${this.resources[key] ? Object.keys(this.resources[key]).length : 0} 条目</div>
                                            </div>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>

                <!-- 知识内容区 -->
                <div class="knowledge-content">
                    <div id="resource-list" class="knowledge-list">
                        <!-- 知识条目将在这里动态显示 -->
                    </div>
                </div>
            </div>
        `;

        // 绑定事件
        this.bindEvents();
        
        // 默认显示所有资源
        this.showAllResources();
    }

    /**
     * 绑定导入相关事件
     */
    bindEvents() {
        // 绑定分类导航事件
        this.bindCategoryEvents();
        
        // 绑定导入功能事件
        this.bindImportEvents();
    }

    /**
     * 绑定分类导航事件
     */
    bindCategoryEvents() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // 移除所有活跃状态
                navItems.forEach(nav => nav.classList.remove('active'));
                // 添加活跃状态
                item.classList.add('active');
                
                const category = item.getAttribute('data-category');
                if (category === 'all') {
                    this.showAllResources();
                } else {
                    this.showCategoryResources(category);
                }
            });
        });
    }

    /**
     * 绑定导入功能事件
     */
    bindImportEvents() {
        const fileInput = document.getElementById('file-input');
        const importBtn = document.getElementById('import-btn');

        if (!fileInput || !importBtn) return;

        // 导入按钮事件
        importBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择事件
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImport(file);
            }
        });
    }



    /**
     * 处理文件导入
     * @param {File} file - 要导入的文件
     */
    async handleImport(file) {
        const importBtn = document.getElementById('import-btn');
        if (!importBtn) return;

        // 验证文件格式
        if (!file.name.toLowerCase().endsWith('.json')) {
            this.showNotification('只支持 .json 格式的文件', 'error');
            return;
        }

        // 验证文件大小
        if (file.size > this.importConfig.maxFileSize) {
            this.showNotification(`文件过大，最大支持 ${this.importConfig.maxFileSize / 1024 / 1024}MB`, 'error');
            return;
        }

        // 显示加载状态
        importBtn.disabled = true;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 导入中...';

        try {
            const result = await this.importResourceFile(file);
            
            if (result.success) {
                this.showNotification(result.message, 'success');
                
                // 重置文件选择
                this.resetFileSelection();
                
                // 更新界面
                this.renderKnowledgeSidebar();
                this.updateResourceStats();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification(`导入失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            importBtn.disabled = false;
            importBtn.innerHTML = '<i class="fas fa-upload"></i> 导入资源';
        }
    }

    /**
     * 重置文件选择
     */
    resetFileSelection() {
        const fileInput = document.getElementById('file-input');
        
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 获取通知图标
     * @param {string} type - 通知类型
     * @returns {string} 图标类名
     */
    getNotificationIcon(type) {
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return iconMap[type] || 'info-circle';
    }

    getTotalCount() {
        let total = 0;
        for (const [category, resources] of Object.entries(this.resources)) {
            if (resources) {
                total += Object.keys(resources).length;
            }
        }
        return total;
    }

    getCategoryEmoji(category) {
        const emojiMap = {
            'traditionalFoods': '🍜',
            'traditionalCrafts': '🏺',
            'traditionalOpera': '🎭',
            'traditionalFestivals': '🏮',
            'traditionalMedicine': '🌿',
            'traditionalArchitecture': '🏛️'
        };
        return emojiMap[category] || '📚';
    }











    /**
     * 显示搜索结果
     * @param {Array} results - 搜索结果
     * @param {string} title - 结果标题
     */
    showSearchResults(results, title) {
        const resourceList = document.getElementById('resource-list');
        if (!resourceList) return;

        resourceList.innerHTML = `
            <div class="knowledge-entries">
                ${results.map(item => {
                    const resource = item.resource;
                    const categoryInfo = this.categories[item.category];
                    
                    return `
                        <article class="knowledge-entry search-result" data-resource-id="${resource.id}">
                            <div class="entry-header">
                                <div class="entry-category">
                                    <span class="category-icon">${this.getCategoryEmoji(item.category)}</span>
                                    <span class="category-name">${categoryInfo.name}</span>
                                </div>
                                <div class="entry-meta">
                                    <span class="entry-id">#${resource.id}</span>
                                    <span class="match-type">${item.matchType === 'tag' ? '标签匹配' : '内容匹配'}</span>
                                    <div class="entry-badges">
                                        ${resource.history ? '<span class="badge history" title="历史渊源">📜</span>' : ''}
                                        ${resource.technique ? '<span class="badge technique" title="工艺技术">⚙️</span>' : ''}
                                        ${resource.features ? '<span class="badge features" title="特色亮点">⭐</span>' : ''}
                                        ${resource.funFact ? '<span class="badge funfact" title="趣闻轶事">💡</span>' : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="entry-content">
                                <h3 class="entry-title">${resource.title}</h3>
                                <div class="entry-description">
                                    <p>${resource.description}</p>
                                </div>
                                ${resource.content && resource.content !== resource.description ? `
                                    <div class="entry-details">
                                        <p>${resource.content.substring(0, 120)}...</p>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="entry-footer">
                                <div class="entry-tags">
                                    ${resource.tags.map(tag => 
                                        `<span class="tag">${tag}</span>`
                                    ).join('')}
                                </div>
                                <div class="entry-actions">
                                    <button class="action-btn view-btn" title="查看详情">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * 显示无搜索结果
     * @param {string} word - 搜索词汇
     */
    showNoResults(word) {
        const resourceList = document.getElementById('resource-list');
        if (!resourceList) return;

        resourceList.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3 class="no-results-title">未找到相关内容</h3>
                <p class="no-results-desc">知识库中没有包含"${word}"的条目，请尝试其他关键词</p>
            </div>
        `;
    }



    showCategoryResources(category) {
        const resources = this.resources[category];
        if (!resources) return;

        const resourceList = Object.values(resources);
        this.renderResourceList(resourceList, this.categories[category].name);
    }

    showAllResources() {
        const allResources = [];
        
        for (const [category, resources] of Object.entries(this.resources)) {
            if (resources) {
                for (const [key, resource] of Object.entries(resources)) {
                    allResources.push({ category, resource });
                }
            }
        }
        
        this.renderResourceList(allResources, '所有资源');
    }

    renderResourceList(resources, title) {
        const resourceList = document.getElementById('resource-list');
        if (!resourceList) return;

        if (Array.isArray(resources) && resources.length > 0) {
            // 如果是显示所有资源，按分类分组
            let groupedResources = resources;
            if (title === '所有资源') {
                const grouped = {};
                resources.forEach(item => {
                    const resource = item.resource || item;
                    const category = item.category || this.getCategoryByResource(resource);
                    if (!grouped[category]) {
                        grouped[category] = [];
                    }
                    grouped[category].push(item);
                });
                groupedResources = grouped;
            }

            if (title === '所有资源') {
                // 显示所有知识条目
                resourceList.innerHTML = `
                    <div class="knowledge-entries">
                        ${resources.map(item => {
                            const resource = item.resource || item;
                            const category = item.category || this.getCategoryByResource(resource);
                            const categoryInfo = this.categories[category];
                            return `
                                <article class="knowledge-entry" data-resource-id="${resource.id}">
                                    <div class="entry-header">
                                        <div class="entry-category">
                                            <span class="category-icon">${this.getCategoryEmoji(category)}</span>
                                            <span class="category-name">${categoryInfo.name}</span>
                                        </div>
                                        <div class="entry-meta">
                                            <span class="entry-id">#${resource.id}</span>
                                            <div class="entry-badges">
                                                ${resource.history ? '<span class="badge history" title="历史渊源">📜</span>' : ''}
                                                ${resource.technique ? '<span class="badge technique" title="工艺技术">⚙️</span>' : ''}
                                                ${resource.features ? '<span class="badge features" title="特色亮点">⭐</span>' : ''}
                                                ${resource.funFact ? '<span class="badge funfact" title="趣闻轶事">💡</span>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="entry-content">
                                        <h3 class="entry-title">${resource.title}</h3>
                                        <div class="entry-description">
                                            <p>${resource.description}</p>
                                        </div>
                                        ${resource.content && resource.content !== resource.description ? `
                                            <div class="entry-details">
                                                <p>${resource.content.substring(0, 120)}...</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="entry-footer">
                                        <div class="entry-tags">
                                            ${resource.tags.map(tag => 
                                                `<span class="tag">${tag}</span>`
                                            ).join('')}
                                        </div>
                                        <div class="entry-actions">
                                            <button class="action-btn view-btn" title="查看详情">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            `;
                        }).join('')}
                    </div>
                `;
            } else {
                // 显示单个分类知识条目
                const categoryInfo = this.categories[Object.keys(this.categories).find(key => 
                    this.categories[key].name === title || title.includes(this.categories[key].name)
                )] || this.categories.traditionalFoods;
                
                resourceList.innerHTML = `
                    <div class="knowledge-entries">
                        ${resources.map(item => {
                            const resource = item.resource || item;
                            const category = item.category || this.getCategoryByResource(resource);
                            const categoryInfo = this.categories[category];
                            
                            return `
                                <article class="knowledge-entry" data-resource-id="${resource.id}">
                                    <div class="entry-header">
                                        <div class="entry-category">
                                            <span class="category-icon">${this.getCategoryEmoji(category)}</span>
                                            <span class="category-name">${categoryInfo.name}</span>
                                        </div>
                                        <div class="entry-meta">
                                            <span class="entry-id">#${resource.id}</span>
                                            <div class="entry-badges">
                                                ${resource.history ? '<span class="badge history" title="历史渊源">📜</span>' : ''}
                                                ${resource.technique ? '<span class="badge technique" title="工艺技术">⚙️</span>' : ''}
                                                ${resource.features ? '<span class="badge features" title="特色亮点">⭐</span>' : ''}
                                                ${resource.funFact ? '<span class="badge funfact" title="趣闻轶事">💡</span>' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="entry-content">
                                        <h3 class="entry-title">${resource.title}</h3>
                                        <div class="entry-description">
                                            <p>${resource.description}</p>
                                        </div>
                                        ${resource.content && resource.content !== resource.description ? `
                                            <div class="entry-details">
                                                <p>${resource.content.substring(0, 120)}...</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="entry-footer">
                                        <div class="entry-tags">
                                            ${resource.tags.map(tag => 
                                                `<span class="tag">${tag}</span>`
                                            ).join('')}
                                        </div>
                                        <div class="entry-actions">
                                            <button class="action-btn view-btn" title="查看详情">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // 绑定资源项点击事件
            const resourceItems = resourceList.querySelectorAll('.resource-item');
            resourceItems.forEach(item => {
                item.addEventListener('click', () => {
                    const resourceId = item.dataset.resourceId;
                    this.showResourceDetail(resourceId);
                });
            });
        } else {
            resourceList.innerHTML = `
                <div class="text-gray-400 text-center py-8">
                    <i class="fas fa-search text-2xl mb-2"></i>
                    <div>暂无相关资源</div>
                </div>
            `;
        }
    }

    getCategoryByResource(resource) {
        for (const [category, resources] of Object.entries(this.resources)) {
            if (resources && resources[resource.id]) {
                return category;
            }
        }
        return 'traditionalFoods';
    }

    showResourceDetail(resourceId) {
        // 查找资源
        let resource = null;
        let category = null;

        for (const [cat, resources] of Object.entries(this.resources)) {
            if (resources && resources[resourceId]) {
                resource = resources[resourceId];
                category = cat;
                break;
            }
        }

        if (!resource) return;

        // 创建详情弹窗
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <i class="${this.categories[category].icon} text-2xl" style="color: ${this.categories[category].color}"></i>
                        <h2 class="text-white text-xl font-semibold">${resource.title}</h2>
                    </div>
                    <button class="text-gray-400 hover:text-white text-xl" onclick="this.closest('.fixed').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div class="text-gray-300">${resource.description}</div>
                    
                    <div class="bg-gray-700 p-4 rounded-lg">
                        <h3 class="text-white font-medium mb-2">详细信息</h3>
                        <div class="space-y-2 text-sm text-gray-300">
                            <div><strong>历史渊源：</strong>${resource.history}</div>
                            <div><strong>制作工艺：</strong>${resource.technique}</div>
                            <div><strong>特色：</strong>${resource.features}</div>
                            <div><strong>趣闻：</strong>${resource.funFact}</div>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        ${resource.tags.map(tag => 
                            `<span class="px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded-full">${tag}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }


}
