/**
 * 对话UI管理器（优化版）
 * 负责对话列表的显示和用户交互，支持标签、收藏、分类、统计等高级功能
 */
class ConversationUIManager {
    constructor() {
        this.isOpen = false;
        this.currentFilter = 'all'; // all, recent, starred, category
        this.searchTerm = '';
        this.selectedCategory = '';
        this.selectedTags = [];

        
        this.init();
    }

    init() {
        this.createConversationPanel();
        this.bindEvents();
    }

    /**
     * 创建对话面板
     */
    createConversationPanel() {
        // 检查是否已存在
        if (document.getElementById('conversation-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'conversation-panel';
        panel.className = 'conversation-panel';
        panel.innerHTML = `
            <div class="conversation-header">
                <h3>对话历史</h3>
                <div class="header-actions">
                    <button class="close-btn" id="close-conversation-panel">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            

            
            <div class="conversation-controls">
                <div class="search-box">
                    <input type="text" id="conversation-search" placeholder="搜索对话...">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="filter-controls">
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all">全部</button>
                        <button class="filter-btn" data-filter="recent">最近一天</button>
                        <button class="filter-btn" data-filter="starred">收藏</button>

                    </div>
                    
                                    <div class="action-buttons">
                    <button class="action-btn" id="new-conversation-btn" title="新建对话">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="action-btn" id="batch-actions-btn" title="批量操作">
                        <i class="fas fa-tasks"></i>
                    </button>
                </div>
                    

                </div>
            </div>
            
            <div class="conversation-list" id="conversation-list">
                <div class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    加载中...
                </div>
            </div>
            
            <div class="conversation-footer">
                <button class="clear-all-btn" id="clear-all-conversations">
                    <i class="fas fa-trash"></i>
                    清空所有对话
                </button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 关闭面板
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-conversation-panel') {
                this.closePanel();
            }
        });



        // 初始化事件监听器
        this.initEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 面板开关事件
        document.addEventListener('click', (e) => {
            if (e.target.id === 'conversation-panel-toggle') {
                this.togglePanel();
            }
        });

        // 搜索功能
        const searchInput = document.getElementById('conversation-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderConversationsList();
            });
        }

        // 筛选按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            }
        });

        // 对话列表项点击
        document.addEventListener('click', (e) => {
            const item = e.target.closest('.conversation-item');
            if (!item) return;
            
            const conversationId = item.dataset.conversationId;
            
            // 检查是否点击了操作按钮
            if (this.handleActionButtonClick(e, conversationId, item)) {
                return;
            }
            
            // 检查是否点击了复选框
            if (e.target.classList.contains('conversation-checkbox-input') || 
                e.target.closest('.conversation-checkbox')) {
                return; // 不加载对话
            }
            
            // 其他情况加载对话
            this.loadConversation(conversationId);
        });

        // 绑定操作按钮事件
        this.bindOperationButtons();
    }

    /**
     * 绑定操作按钮事件
     */
    bindOperationButtons() {
        // 新建对话按钮
        document.addEventListener('click', (e) => {
            const button = e.target.closest('#new-conversation-btn');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                this.createNewConversation();
            }
        });

        // 批量操作按钮
        document.addEventListener('click', (e) => {
            const button = e.target.closest('#batch-actions-btn');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                this.showBatchActions();
            }
        });

        // 清空所有对话
        document.addEventListener('click', (e) => {
            const button = e.target.closest('#clear-all-conversations');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                this.clearAllConversations();
            }
        });
    }

    /**
     * 处理操作按钮点击
     */
    handleActionButtonClick(e, conversationId, item) {
        // 确保点击的是按钮本身或其子元素
        const button = e.target.closest('.action-btn');
        if (!button) return false;

        const actionButtons = {
            'edit-btn': () => this.editConversationTitle(conversationId, item),
            'delete-btn': () => this.deleteConversation(conversationId),
            'export-btn': () => this.exportConversation(conversationId),
            'star-btn': () => this.toggleStar(conversationId)
        };

        for (const [className, handler] of Object.entries(actionButtons)) {
            if (button.classList.contains(className)) {
                e.preventDefault();
                e.stopPropagation();
                handler();
                return true;
            }
        }

        return false;
    }

    /**
     * 设置筛选器
     */
    setFilter(filter) {
        console.log('切换筛选器:', filter);
        
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        this.currentFilter = filter;
        
        // 如果是"全部"筛选，先刷新数据
        if (filter === 'all') {
            this.refreshConversationsList();
        } else {
            this.renderConversationsList();
        }
    }



    /**
     * 显示批量操作面板 - 重新设计版本
     */
    showBatchActions() {
        const selectedConversations = this.getSelectedConversations();
        
        if (selectedConversations.length === 0) {
            this.showNotification('⚠️ 请先选择对话', 'warning');
            return;
        }

        // 定义批量操作选项
        const batchActions = [
            { 
                id: 'star', 
                label: '收藏选中', 
                icon: 'fas fa-star',
                color: '#f59e0b',
                description: '将选中的对话标记为收藏'
            },
            { 
                id: 'unstar', 
                label: '取消收藏', 
                icon: 'fas fa-star',
                color: '#64748b',
                description: '取消选中对话的收藏状态'
            },
            { 
                id: 'delete', 
                label: '删除选中', 
                icon: 'fas fa-trash',
                color: '#ef4444',
                description: '永久删除选中的对话（不可恢复）'
            },
            { 
                id: 'export', 
                label: '导出选中', 
                icon: 'fas fa-download',
                color: '#10b981',
                description: '将选中的对话导出为文件'
            }
        ];

        // 创建模态框内容
        const modalContent = `
            <div class="batch-actions-container">
                <div class="batch-actions-header">
                    <div class="batch-actions-title">
                        <i class="fas fa-tasks"></i>
                        <h3>批量操作</h3>
                    </div>
                    <div class="batch-actions-count">
                        已选择 <strong>${selectedConversations.length}</strong> 个对话
                    </div>
                </div>
                
                <div class="batch-actions-grid">
                    ${batchActions.map(action => `
                        <div class="batch-action-item" data-action="${action.id}">
                            <div class="batch-action-icon" style="color: ${action.color}">
                            <i class="${action.icon}"></i>
                            </div>
                            <div class="batch-action-content">
                                <div class="batch-action-label">${action.label}</div>
                                <div class="batch-action-description">${action.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="batch-actions-footer">
                    <button class="batch-action-cancel">取消</button>
            </div>
            </div>
        `;

        // 创建并显示模态框
        const modal = this.createModal('批量操作', modalContent);

        // 绑定批量操作事件
        modal.querySelectorAll('.batch-action-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                this.executeBatchAction(action, selectedConversations);
                this.closeModal(modal);
            });
        });

        // 绑定取消按钮
        modal.querySelector('.batch-action-cancel').addEventListener('click', () => {
            this.closeModal(modal);
        });
    }

    /**
     * 执行批量操作 - 重新设计版本
     */
    async executeBatchAction(action, conversationIds) {
        try {
            // 显示加载状态
            this.showButtonLoading('batch-actions-btn', true);
            
        if (!window.conversationHistoryManager) {
                throw new Error('对话管理器未初始化');
            }

            // 确认危险操作
            if (action === 'delete') {
                const confirmed = await this.showBatchDeleteConfirmation(conversationIds);
                if (!confirmed) return;
            }

            // 执行批量操作
            const results = await window.conversationHistoryManager.batchOperation(conversationIds, action);
            const successCount = results.filter(r => r.success).length;
            const failedCount = conversationIds.length - successCount;
            
            // 显示结果
            if (failedCount === 0) {
                this.showNotification(`✅ 批量操作完成: ${successCount} 个对话处理成功`, 'success');
            } else {
                this.showNotification(`⚠️ 批量操作部分完成: ${successCount} 成功, ${failedCount} 失败`, 'warning');
            }
            
            // 刷新列表
            this.renderConversationsList();
            
        } catch (error) {
            console.error('批量操作失败:', error);
            this.showNotification(`❌ 批量操作失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            this.showButtonLoading('batch-actions-btn', false);
        }
    }

    /**
     * 获取选中的对话
     */
    getSelectedConversations() {
        const checkboxes = document.querySelectorAll('.conversation-checkbox-input:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    /**
     * 显示批量删除确认对话框
     */
    async showBatchDeleteConfirmation(conversationIds) {
        return new Promise((resolve) => {
            const conversations = conversationIds.map(id => 
                window.conversationHistoryManager.conversations.find(c => c.id === id)
            ).filter(Boolean);

            const modalContent = `
                <div class="batch-delete-confirmation">
                    <div class="batch-delete-warning">
                        <div class="delete-warning-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>批量删除确认</h3>
                        </div>
                        <p>您确定要删除选中的 ${conversationIds.length} 个对话吗？此操作不可撤销。</p>
                    </div>
                    
                    <div class="batch-delete-preview">
                        <h4>将要删除的对话：</h4>
                        <div class="conversation-list-preview">
                            ${conversations.slice(0, 5).map(conv => `
                                <div class="preview-item">
                                    <i class="fas fa-comments"></i>
                                    <span>${this.escapeHtml(conv.title || '无标题对话')}</span>
                                    <small>${this.formatTime(conv.updatedAt)}</small>
                                </div>
                            `).join('')}
                            ${conversations.length > 5 ? `<div class="preview-more">... 还有 ${conversations.length - 5} 个对话</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="batch-delete-stats">
                        <div class="stat-item">
                            <i class="fas fa-comments"></i>
                            <span>${conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)} 条消息</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-star"></i>
                            <span>${conversations.filter(c => c.isStarred).length} 个收藏</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-file-text"></i>
                            <span>${conversations.reduce((sum, c) => sum + (c.wordCount || 0), 0)} 字</span>
                        </div>
                    </div>
                    
                    <div class="batch-delete-actions">
                        <button class="batch-delete-btn cancel-btn" data-action="cancel">
                            <i class="fas fa-times"></i>
                            取消
                        </button>
                        <button class="batch-delete-btn confirm-btn" data-action="confirm">
                            <i class="fas fa-trash"></i>
                            确认删除
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('批量删除对话', modalContent);
            
            // 绑定按钮事件
            modal.querySelectorAll('.batch-delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.closeModal(modal);
                    resolve(action === 'confirm');
                });
            });
        });
    }

    /**
     * 切换收藏状态
     */
    async toggleStar(conversationId) {
        if (!window.conversationHistoryManager) {
            this.showNotification('❌ 对话管理器未初始化', 'error');
            return;
        }

        try {
            const success = await window.conversationHistoryManager.toggleStar(conversationId);
            if (success) {
                this.renderConversationsList();
                this.showNotification('✅ 收藏状态已更新', 'success');
            } else {
                this.showNotification('❌ 操作失败', 'error');
            }
        } catch (error) {
            this.showNotification(`❌ 收藏操作失败: ${error.message}`, 'error');
        }
    }



    /**
     * 创建模态框
     */
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal-overlay';
        modal.innerHTML = `
            <div class="custom-modal">
                <div class="custom-modal-header">
                    <div class="custom-modal-title">
                        <i class="fas fa-info-circle"></i>
                        <h3>${title}</h3>
                    </div>
                    <button class="custom-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="custom-modal-content">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // 绑定关闭事件
        modal.querySelector('.custom-modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 点击遮罩层关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });

        // ESC键关闭
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return modal;
    }

    /**
     * 关闭模态框
     */
    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            modal.classList.add('hide');
            
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    /**
     * 打开对话面板
     */
    openPanel() {
        const panel = document.getElementById('conversation-panel');
        if (panel) {
            panel.classList.add('open');
            this.isOpen = true;
            this.renderConversationsList();
        }
    }

    /**
     * 关闭对话面板
     */
    closePanel() {
        const panel = document.getElementById('conversation-panel');
        if (panel) {
            panel.classList.remove('open');
            this.isOpen = false;
        }
    }

    /**
     * 渲染对话列表
     */
    renderConversationsList() {
        const listContainer = document.getElementById('conversation-list');
        if (!listContainer) return;

        if (!window.conversationHistoryManager) {
            listContainer.innerHTML = '<div class="error-message">对话管理器未初始化</div>';
            return;
        }

        // 使用高级搜索
        const searchOptions = {
            category: this.currentFilter === 'category' ? this.selectedCategory : '',
            isStarred: this.currentFilter === 'starred' ? true : null
        };

        // 确保搜索条件正确
        console.log('当前筛选器:', this.currentFilter);
        console.log('搜索选项:', searchOptions);

        let conversations = window.conversationHistoryManager.searchConversations(this.searchTerm, searchOptions);

        // 应用时间筛选
        if (this.currentFilter === 'recent') {
            const dayAgo = new Date();
            dayAgo.setDate(dayAgo.getDate() - 1);
            conversations = conversations.filter(conv => new Date(conv.updatedAt) > dayAgo);
            console.log('应用最近一天筛选后数量:', conversations.length);
        }

        // 调试信息
        console.log('筛选器:', this.currentFilter);
        console.log('搜索结果数量:', conversations.length);
        console.log('搜索条件:', { searchTerm: this.searchTerm, searchOptions });

        if (conversations.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">暂无对话</div>';
            return;
        }

        const currentConversationId = window.conversationHistoryManager.getCurrentConversation().id;
        
        listContainer.innerHTML = conversations.map(conversation => `
            <div class="conversation-item ${conversation.id === currentConversationId ? 'active current-conversation' : ''}" 
                 data-conversation-id="${conversation.id}">
                <div class="conversation-checkbox">
                    <input type="checkbox" class="conversation-checkbox-input" value="${conversation.id}" id="checkbox-${conversation.id}">
                    <label for="checkbox-${conversation.id}" class="conversation-checkbox-label"></label>
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <div class="conversation-title">
                                ${conversation.isStarred ? '<i class="fas fa-star star-icon active"></i>' : ''}
                                <span>${this.escapeHtml(conversation.title)}</span>
                                ${conversation.id === currentConversationId ? '<span class="current-indicator">当前对话</span>' : ''}
                        </div>
                        <div class="conversation-meta">
                            <div class="meta-item">
                                <i class="fas fa-comments"></i>
                                <span>${conversation.messageCount} 条</span>
                        </div>
                            <div class="meta-item">
                                <i class="fas fa-file-text"></i>
                                <span>${conversation.wordCount} 字</span>
                    </div>
                            <div class="meta-item">
                                <i class="fas fa-clock"></i>
                                <span>${this.formatTime(conversation.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="conversation-footer">
                        <div class="conversation-preview">${this.escapeHtml(conversation.preview)}</div>
                        <div class="conversation-actions">
                            <button class="action-btn edit-btn" title="编辑标题">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn star-btn${conversation.isStarred ? ' starred' : ''}" title="${conversation.isStarred ? '取消收藏' : '收藏'}">
                                <i class="fas fa-star"></i>
                            </button>
                            <button class="action-btn export-btn" title="导出对话">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="action-btn delete-btn" title="删除对话">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 绑定复选框事件
        this.bindCheckboxEvents();
        
        // 更新批量操作按钮状态
        this.updateBatchActionsState();
        
        // 更新当前对话标识
        this.updateCurrentConversationIndicator();
    }

    /**
     * 强制刷新对话列表
     */
    async refreshConversationsList() {
        console.log('强制刷新对话列表...');
        
        if (window.conversationHistoryManager) {
            try {
                await window.conversationHistoryManager.loadConversationsList();
                window.conversationHistoryManager.buildSearchIndex();
                this.renderConversationsList();
                console.log('对话列表刷新完成');
            } catch (error) {
                console.error('刷新对话列表失败:', error);
            }
        }
    }

    /**
     * 更新当前对话标识
     */
    updateCurrentConversationIndicator() {
        const currentConversationId = window.conversationHistoryManager.getCurrentConversation().id;
        
        // 移除所有当前对话标识
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('current-conversation');
        });
        
        // 添加当前对话标识
        const currentItem = document.querySelector(`[data-conversation-id="${currentConversationId}"]`);
        if (currentItem) {
            currentItem.classList.add('current-conversation');
        }
        
        console.log('当前对话标识已更新:', currentConversationId);
    }

    /**
     * 绑定复选框事件
     */
    bindCheckboxEvents() {
        const checkboxes = document.querySelectorAll('.conversation-checkbox-input');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation(); // 防止触发对话项点击事件
                this.updateBatchActionsState();
            });
        });

        // 全选/取消全选功能
        this.addSelectAllCheckbox();
    }



    /**
     * 添加全选复选框
     */
    addSelectAllCheckbox() {
        const listContainer = document.getElementById('conversation-list');
        if (!listContainer || listContainer.children.length === 0) return;

        // 检查是否已经有全选复选框
        if (document.getElementById('select-all-checkbox')) return;

        const selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'select-all-container';
        selectAllContainer.innerHTML = `
            <div class="select-all-checkbox">
                <input type="checkbox" id="select-all-checkbox">
                <label for="select-all-checkbox">全选</label>
            </div>
        `;

        listContainer.insertBefore(selectAllContainer, listContainer.firstChild);

        // 绑定全选事件
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.conversation-checkbox-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
            this.updateBatchActionsState();
        });
    }

    /**
     * 更新批量操作按钮状态
     */
    updateBatchActionsState() {
        const selectedCount = this.getSelectedConversations().length;
        const batchBtn = document.getElementById('batch-actions-btn');
        
        if (batchBtn) {
            if (selectedCount > 0) {
                batchBtn.disabled = false;
                batchBtn.title = `批量操作 (${selectedCount} 个选中)`;
                batchBtn.classList.add('has-selection');
            } else {
                batchBtn.disabled = true;
                batchBtn.title = '批量操作 (请先选择对话)';
                batchBtn.classList.remove('has-selection');
            }
        }
    }

    /**
     * 创建新对话 - 重新设计版本
     */
    async createNewConversation() {
        try {
            // 显示加载状态
            this.showButtonLoading('new-conversation-btn', true);
            
            if (!window.conversationHistoryManager) {
                throw new Error('对话管理器未初始化');
            }

            // 创建新对话
                await window.conversationHistoryManager.createNewConversation();
            
            // 更新当前对话标识
            this.updateCurrentConversationIndicator();
            
            // 关闭面板并显示成功消息
                this.closePanel();
                this.showNotification('✅ 新对话已创建', 'success');
            
        } catch (error) {
            console.error('创建新对话失败:', error);
            this.showNotification(`❌ 创建新对话失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            this.showButtonLoading('new-conversation-btn', false);
        }
    }

    /**
     * 加载对话
     */
    async loadConversation(conversationId) {
        if (window.conversationHistoryManager) {
            const success = await window.conversationHistoryManager.loadConversation(conversationId);
            if (success) {
                // 更新当前对话标识
                this.updateCurrentConversationIndicator();
                this.closePanel();
                this.showNotification('对话已加载');
            } else {
                this.showNotification('加载对话失败', 'error');
            }
        }
    }

    /**
     * 删除对话 - 重新设计版本
     */
    async deleteConversation(conversationId) {
        try {
            // 显示确认对话框
            const confirmed = await this.showDeleteConfirmation(conversationId);
            if (!confirmed) return;

            // 显示加载状态
            this.showButtonLoading(`delete-btn-${conversationId}`, true);
            
            if (!window.conversationHistoryManager) {
                throw new Error('对话管理器未初始化');
            }

            // 执行删除操作
                const success = await window.conversationHistoryManager.deleteConversation(conversationId);
            
                if (success) {
                    this.renderConversationsList();
                this.showNotification('✅ 对话已删除', 'success');
                } else {
                throw new Error('删除操作失败');
            }
            
        } catch (error) {
            console.error('删除对话失败:', error);
            this.showNotification(`❌ 删除失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            this.showButtonLoading(`delete-btn-${conversationId}`, false);
        }
    }

    /**
     * 显示删除确认对话框
     */
    async showDeleteConfirmation(conversationId) {
        return new Promise((resolve) => {
            const conversation = window.conversationHistoryManager.conversations.find(c => c.id === conversationId);
            if (!conversation) {
                resolve(false);
                return;
            }

            const modalContent = `
                <div class="delete-confirmation">
                    <div class="delete-warning">
                        <div class="delete-warning-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>确认删除</h3>
                        </div>
                        <p>您确定要删除这个对话吗？此操作不可撤销。</p>
                    </div>
                    
                    <div class="conversation-preview-card">
                        <div class="preview-header">
                            <strong>${conversation.title || '无标题对话'}</strong>
                            <span class="conversation-id">${conversation.id}</span>
                        </div>
                        <div class="preview-content">
                            <p><i class="fas fa-comments"></i> ${conversation.messageCount || 0} 条消息</p>
                            <p><i class="fas fa-file-text"></i> ${conversation.wordCount || 0} 字</p>
                            <p><i class="fas fa-clock"></i> ${this.formatTime(conversation.updatedAt)}</p>
                        </div>
                    </div>
                    
                    <div class="delete-actions">
                        <button class="delete-btn cancel-btn" data-action="cancel">
                            <i class="fas fa-times"></i>
                            取消
                        </button>
                        <button class="delete-btn confirm-btn" data-action="confirm">
                            <i class="fas fa-trash"></i>
                            确认删除
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('删除对话', modalContent);
            
            // 绑定按钮事件
            modal.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.closeModal(modal);
                    resolve(action === 'confirm');
                });
            });
        });
    }

    /**
     * 导出对话
     */
    async exportConversation(conversationId) {
        if (window.conversationHistoryManager) {
            const success = await window.conversationHistoryManager.exportConversation(conversationId);
            if (success) {
                this.showNotification('对话已导出');
            } else {
                this.showNotification('导出对话失败', 'error');
            }
        }
    }

    /**
     * 编辑对话标题 - 重新设计版本
     */
    async editConversationTitle(conversationId, item) {
        try {
            // 显示编辑对话框
            const newTitle = await this.showEditTitleDialog(conversationId);
            if (!newTitle) return;

            // 显示加载状态
            this.showButtonLoading(`edit-btn-${conversationId}`, true);
            
            if (!window.conversationHistoryManager) {
                throw new Error('对话管理器未初始化');
            }

            // 更新后端数据
            const success = await window.conversationHistoryManager.updateConversationTitle(conversationId, newTitle);
            
            if (success) {
                // 更新UI
                const titleSpan = item.querySelector('.conversation-title span');
                if (titleSpan) {
                    titleSpan.textContent = newTitle;
                }
                this.renderConversationsList();
                this.showNotification(`✅ 标题已更新为: ${newTitle}`, 'success');
            } else {
                throw new Error('标题更新失败');
            }
            
        } catch (error) {
            console.error('编辑标题失败:', error);
            this.showNotification(`❌ 编辑失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            this.showButtonLoading(`edit-btn-${conversationId}`, false);
        }
    }

    /**
     * 显示编辑标题对话框
     */
    async showEditTitleDialog(conversationId) {
        return new Promise((resolve) => {
            const conversation = window.conversationHistoryManager.conversations.find(c => c.id === conversationId);
            if (!conversation) {
                resolve(null);
                return;
            }

            const currentTitle = conversation.title || '无标题对话';
            
            const modalContent = `
                <div class="edit-title-dialog">
                    <div class="edit-title-header">
                        <div class="edit-title-icon">
                            <i class="fas fa-edit"></i>
                        </div>
                        <h3>编辑对话标题</h3>
                    </div>
                    
                    <div class="edit-title-form">
                        <div class="form-group">
                            <label for="title-input">新标题</label>
                            <input type="text" id="title-input" class="title-input" 
                                   value="${this.escapeHtml(currentTitle)}" 
                                   placeholder="请输入新的标题..."
                                   maxlength="50">
                            <div class="input-counter">
                                <span class="current-length">${currentTitle.length}</span>/50
                            </div>
                        </div>
                        
                        <div class="conversation-info">
                            <div class="info-item">
                                <i class="fas fa-comments"></i>
                                <span>${conversation.messageCount || 0} 条消息</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>${this.formatTime(conversation.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="edit-title-actions">
                        <button class="edit-btn cancel-btn" data-action="cancel">
                            <i class="fas fa-times"></i>
                            取消
                        </button>
                        <button class="edit-btn confirm-btn" data-action="confirm">
                            <i class="fas fa-check"></i>
                            保存
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('编辑标题', modalContent);
            
            // 获取输入框和计数器
            const titleInput = modal.querySelector('#title-input');
            const currentLengthSpan = modal.querySelector('.current-length');
            
            // 绑定输入事件
            titleInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                currentLengthSpan.textContent = length;
                
                // 更新确认按钮状态
                const confirmBtn = modal.querySelector('.edit-btn.confirm-btn');
                if (length === 0 || length > 50) {
                    confirmBtn.disabled = true;
                    confirmBtn.classList.add('disabled');
                } else {
                    confirmBtn.disabled = false;
                    confirmBtn.classList.remove('disabled');
                }
            });
            
            // 绑定按钮事件
            modal.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.closeModal(modal);
                    
                    if (action === 'confirm') {
                        const newTitle = titleInput.value.trim();
                        if (newTitle && newTitle.length <= 50) {
                            resolve(newTitle);
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                });
            });
            
            // 绑定回车键
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const confirmBtn = modal.querySelector('.edit-btn.confirm-btn');
                    if (!confirmBtn.disabled) {
                        confirmBtn.click();
                    }
                }
            });
            
            // 自动聚焦输入框
            setTimeout(() => {
                titleInput.focus();
                titleInput.select();
            }, 100);
        });
    }



    /**
     * 清空所有对话 - 重新设计版本
     */
    async clearAllConversations() {
        try {
            // 显示确认对话框
            const confirmed = await this.showClearAllConfirmation();
            if (!confirmed) return;

            // 显示加载状态
            this.showButtonLoading('clear-all-conversations', true);
            
            if (!window.conversationHistoryManager) {
                throw new Error('对话管理器未初始化');
            }

            // 执行清空操作
                const success = await window.conversationHistoryManager.clearAllConversations();
            
                if (success) {
                    this.renderConversationsList();
                this.showNotification('✅ 所有对话已清空', 'success');
                } else {
                throw new Error('清空操作失败');
            }
            
        } catch (error) {
            console.error('清空对话失败:', error);
            this.showNotification(`❌ 清空失败: ${error.message}`, 'error');
        } finally {
            // 恢复按钮状态
            this.showButtonLoading('clear-all-conversations', false);
        }
    }

    /**
     * 显示清空所有对话确认对话框
     */
    async showClearAllConfirmation() {
        return new Promise((resolve) => {
            const stats = window.conversationHistoryManager.getConversationStats();
            
            const modalContent = `
                <div class="clear-all-confirmation">
                    <div class="clear-all-warning">
                        <div class="delete-warning-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>清空所有对话</h3>
                        </div>
                        <p>此操作将永久删除所有对话记录，无法恢复！</p>
                    </div>
                    
                    <div class="clear-all-stats">
                        <div class="stat-item">
                            <i class="fas fa-comments"></i>
                            <span>${stats.total} 个对话</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-star"></i>
                            <span>${stats.starred} 个收藏</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-file-text"></i>
                            <span>${stats.totalMessages} 条消息</span>
                        </div>
                    </div>
                    
                    <div class="clear-all-actions">
                        <button class="clear-btn cancel-btn" data-action="cancel">
                            <i class="fas fa-times"></i>
                            取消
                        </button>
                        <button class="clear-btn confirm-btn" data-action="confirm">
                            <i class="fas fa-trash-alt"></i>
                            确认清空
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('清空所有对话', modalContent);
            
            // 绑定按钮事件
            modal.querySelectorAll('.clear-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.closeModal(modal);
                    resolve(action === 'confirm');
                });
            });
        });
    }

    /**
     * 格式化时间
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return '刚刚';
        } else if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        } else if (diff < 86400000) {
            return Math.floor(diff / 3600000) + '小时前';
        } else if (diff < 604800000) {
            return Math.floor(diff / 86400000) + '天前';
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

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
     * 刷新对话列表
     */
    refresh() {
        this.renderConversationsList();
    }

    /**
     * 显示按钮加载状态
     */
    showButtonLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            
            // 恢复原始内容
            if (buttonId === 'new-conversation-btn') {
                button.innerHTML = '<i class="fas fa-plus"></i>';
            } else if (buttonId === 'batch-actions-btn') {
                button.innerHTML = '<i class="fas fa-tasks"></i>';
            }
        }
    }
}

// 等待DOM完全加载后再初始化对话UI管理器
document.addEventListener('DOMContentLoaded', () => {
    window.conversationUIManager = new ConversationUIManager();
});
