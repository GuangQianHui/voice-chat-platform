/**
 * 历史记录管理器
 * 参考优秀网站的历史记录实现方式
 */
class HistoryManager {
    constructor() {
        this.sessions = [];
        this.currentSessionId = null;
        this.maxSessions = 50;
        this.maxMessagesPerSession = 100;
        this.isLoading = false;
        
        // 使用数据存储管理器
        this.storageManager = new DataStorageManager();
        
        this.init();
    }

    init() {
        this.isLoading = true;
        this.showNotification('正在加载历史记录...', 'info');
        
        this.loadFromStorage();
        
        // 如果没有会话或当前会话不存在，创建新会话
        if (this.sessions.length === 0 || !this.getCurrentSession()) {
            this.createNewSession();
        }
        
        // 延迟设置事件监听器，确保DOM完全加载
        setTimeout(() => {
            this.setupEventListeners();
            this.isLoading = false;
            this.showNotification('历史记录加载完成', 'success');
        }, 100);
    }

    loadFromStorage() {
        try {
            const data = this.storageManager.loadFromLocalStorage();
            if (data) {
                this.sessions = data.sessions || [];
                this.currentSessionId = data.currentSessionId || null;
                
                // 验证和修复数据
                this.validateAndFixData();
                this.migrateData();
                this.cleanupOldData();
                
                console.log('历史记录加载成功，会话数量:', this.sessions.length);
            }
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.sessions = [];
            this.currentSessionId = null;
        }
    }

    validateAndFixData() {
        // 验证会话数据完整性
        this.sessions = this.sessions.filter(session => {
            if (!session || typeof session !== 'object') {
                console.warn('发现无效会话数据，已移除');
                return false;
            }
            
            // 确保必要字段存在
            if (!session.id) {
                session.id = this.generateSessionId();
            }
            if (!session.messages) {
                session.messages = [];
            }
            if (!session.messageCount) {
                session.messageCount = session.messages.length;
            }
            if (!session.title) {
                session.title = '新对话';
            }
            if (!session.createdAt) {
                session.createdAt = new Date().toISOString();
            }
            if (!session.updatedAt) {
                session.updatedAt = new Date().toISOString();
            }

            if (!session.isArchived) {
                session.isArchived = false;
            }
            if (!session.isPinned) {
                session.isPinned = false;
            }
            if (!session.tags) {
                session.tags = [];
            }
            
            // 验证消息数据
            session.messages = session.messages.filter(message => {
                if (!message || typeof message !== 'object') {
                    console.warn('发现无效消息数据，已移除');
                    return false;
                }
                
                if (!message.id) {
                    message.id = this.generateMessageId();
                }
                if (!message.role) {
                    message.role = 'user';
                }
                if (!message.content) {
                    message.content = '';
                }
                if (!message.timestamp) {
                    message.timestamp = new Date().toISOString();
                }
                
                return true;
            });
            
            // 更新消息数量
            session.messageCount = session.messages.length;
            
            return true;
        });
        
        // 验证当前会话ID
        if (this.currentSessionId && !this.sessions.find(s => s.id === this.currentSessionId)) {
            console.warn('当前会话ID无效，重置为第一个会话');
            this.currentSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
        }
    }

    saveToStorage() {
        try {
            const data = {
                sessions: this.sessions,
                currentSessionId: this.currentSessionId,
                lastUpdated: new Date().toISOString()
            };
            this.storageManager.saveToLocalStorage(data);
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }

    createNewSession(title = '新对话') {
        const session = {
            id: this.generateSessionId(),
            title: title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
            tags: [],
            isArchived: false,
            isPinned: false
        };

        this.sessions.unshift(session);
        this.currentSessionId = session.id;
        this.saveToStorage();
        this.updateUI();
        
        this.showNotification(`新对话"${title}"已创建`, 'success');
        return session;
    }



    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addMessage(role, content, metadata = {}) {
        if (!this.currentSessionId) {
            this.createNewSession();
        }

        const session = this.getCurrentSession();
        if (!session) {
            // 如果当前会话不存在，创建新会话
            this.createNewSession();
            return this.addMessage(role, content, metadata);
        }

        const message = {
            id: this.generateMessageId(),
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        session.messages.push(message);
        session.messageCount = session.messages.length;
        session.updatedAt = new Date().toISOString();

        // 如果是用户的第二条消息，更新会话标题
        if (session.messageCount === 2 && role === 'user') {
            session.title = this.generateSessionTitle(content);
        }

        this.saveToStorage();
        this.updateUI();
        
        return message;
    }

    generateSessionTitle(content) {
        const title = content.substring(0, 20).trim();
        return title.length > 0 ? title : '新对话';
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getCurrentSession() {
        return this.sessions.find(s => s.id === this.currentSessionId);
    }

    switchSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error('会话不存在:', sessionId);
            return;
        }
        
        this.currentSessionId = sessionId;
        this.saveToStorage();
        this.updateUI();
        this.loadSessionMessages(sessionId);
    }

    updateUI() {
        this.updateSessionList();
        this.updateCurrentSession();
    }

    updateSessionList() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.innerHTML = '';

        // 分离置顶和非置顶会话
        const pinnedSessions = this.sessions.filter(s => s.isPinned);
        const unpinnedSessions = this.sessions.filter(s => !s.isPinned);

        // 先显示置顶会话
        if (pinnedSessions.length > 0) {
            const pinnedHeader = document.createElement('div');
            pinnedHeader.className = 'text-xs text-gray-400 font-medium mb-2 mt-4 first:mt-0 flex items-center';
            pinnedHeader.innerHTML = '<i class="fas fa-thumbtack mr-2 text-yellow-400"></i>置顶会话';
            historyList.appendChild(pinnedHeader);

            pinnedSessions.forEach(session => {
                const sessionElement = this.createSessionElement(session);
                historyList.appendChild(sessionElement);
            });
        }

        // 再显示普通会话
        if (unpinnedSessions.length > 0) {
            if (pinnedSessions.length > 0) {
                const divider = document.createElement('div');
                divider.className = 'border-t border-gray-600 my-3';
                historyList.appendChild(divider);
            }

            unpinnedSessions.forEach(session => {
                const sessionElement = this.createSessionElement(session);
                historyList.appendChild(sessionElement);
            });
        }

        // 如果没有会话，显示空状态
        if (this.sessions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'text-center text-gray-400 py-8 empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-comments text-4xl mb-4 text-gray-500"></i>
                <div class="text-sm font-medium">暂无对话记录</div>
                <div class="text-xs mt-2 text-gray-500">开始新的对话吧</div>
            `;
            historyList.appendChild(emptyState);
        }
    }

    createSessionElement(session) {
        const element = document.createElement('div');
        const isCurrent = session.id === this.currentSessionId;
        
        element.className = `session-item bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 hover:border-gray-600 transition-all duration-200 group relative ${isCurrent ? 'border-l-4 border-blue-500 bg-blue-900 bg-opacity-20' : ''}`;
        
        const lastMessage = session.messages[session.messages.length - 1];
        const lastMessageContent = lastMessage ? lastMessage.content.substring(0, 40) + (lastMessage.content.length > 40 ? '...' : '') : '暂无消息';
        
        // 计算会话统计信息
        const userMessages = session.messages.filter(m => m.role === 'user').length;
        const aiMessages = session.messages.filter(m => m.role === 'ai').length;
        
        element.innerHTML = `
            <div class="flex items-start space-x-2">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            ${session.isPinned ? '<i class="fas fa-thumbtack text-yellow-400 text-xs" title="已置顶"></i>' : ''}
                            <div class="text-white text-sm font-semibold truncate leading-tight">${session.title}</div>
                        </div>
                        <div class="flex items-center space-x-1">
                            ${session.isArchived ? '<i class="fas fa-archive text-gray-300 text-xs" title="已归档"></i>' : ''}
                            <span class="text-white text-xs bg-blue-600 px-2 py-0.5 rounded-full font-medium" title="消息数量">${session.messageCount}</span>
                        </div>
                    </div>
                    <div class="text-gray-200 text-xs mt-2 truncate leading-relaxed">${lastMessageContent}</div>
                    <div class="flex items-center justify-between mt-2">
                        <div class="text-gray-300 text-xs font-medium">${this.formatTime(session.updatedAt)}</div>
                        <div class="flex items-center space-x-2 text-xs">
                            <span class="text-blue-300 bg-blue-900 bg-opacity-30 px-2 py-0.5 rounded-full" title="用户消息"><i class="fas fa-user mr-1"></i>${userMessages}</span>
                            <span class="text-green-300 bg-green-900 bg-opacity-30 px-2 py-0.5 rounded-full" title="AI回复"><i class="fas fa-robot mr-1"></i>${aiMessages}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 操作按钮组 -->
            <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1">
                <button class="action-btn edit-btn" title="重命名" data-session-id="${session.id}">
                    <i class="fas fa-edit text-xs"></i>
                </button>

                <button class="action-btn pin-btn" title="${session.isPinned ? '取消置顶' : '置顶会话'}" data-session-id="${session.id}">
                    <i class="fas fa-thumbtack text-xs ${session.isPinned ? 'text-yellow-400' : ''}"></i>
                </button>
                <button class="action-btn archive-btn" title="${session.isArchived ? '取消归档' : '归档'}" data-session-id="${session.id}">
                    <i class="fas fa-archive text-xs ${session.isArchived ? 'text-gray-300' : ''}"></i>
                </button>
                <button class="action-btn copy-btn" title="复制会话" data-session-id="${session.id}">
                    <i class="fas fa-copy text-xs"></i>
                </button>
                <button class="action-btn export-btn" title="导出会话 (TXT/JSON)" data-session-id="${session.id}">
                    <i class="fas fa-download text-xs"></i>
                </button>
                <button class="action-btn delete-btn" title="删除会话 (${session.messageCount} 条消息)" data-session-id="${session.id}">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
            

        `;

        // 为操作按钮添加事件监听器
        const actionButtons = element.querySelectorAll('.action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡，避免触发会话切换
                const sessionId = button.getAttribute('data-session-id');
                const action = button.className.split(' ')[1]; // 获取按钮类型
                this.handleActionButton(action, sessionId);
            });
        });

        // 会话项点击事件
        element.addEventListener('click', () => {
            this.switchSession(session.id);
        });

        // 右键菜单（保留作为备用）
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showSessionContextMenu(e, session);
        });

        return element;
    }



    showSessionContextMenu(event, session) {
        const menu = document.createElement('div');
        menu.className = 'fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 min-w-48';
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        const userMessages = session.messages.filter(m => m.role === 'user').length;
        const aiMessages = session.messages.filter(m => m.role === 'ai').length;
        const duration = this.calculateSessionDuration(session);

        menu.innerHTML = `
            <div class="p-2">
                <div class="px-3 py-2 text-xs text-gray-400 border-b border-gray-600 mb-2">
                    <div class="flex items-center mb-1"><i class="fas fa-comments mr-2"></i>消息: ${userMessages} 用户 + ${aiMessages} AI</div>
                    <div class="flex items-center mb-1"><i class="fas fa-clock mr-2"></i>时长: ${duration}</div>

                </div>
                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.renameSession('${session.id}')">
                    <i class="fas fa-edit mr-3 w-4 text-center"></i>重命名
                </button>
                

                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.togglePinSession('${session.id}')">
                    <i class="fas fa-thumbtack mr-3 w-4 text-center"></i>${session.isPinned ? '取消置顶' : '置顶会话'}
                </button>
                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.archiveSession('${session.id}')">
                    <i class="fas fa-archive mr-3 w-4 text-center"></i>${session.isArchived ? '取消归档' : '归档'}
                </button>
                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.duplicateSession('${session.id}')">
                    <i class="fas fa-copy mr-3 w-4 text-center"></i>复制会话
                </button>
                
                <hr class="border-gray-600 my-1">
                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.exportSession('${session.id}', 'txt')">
                    <i class="fas fa-file-alt mr-3 w-4 text-center"></i>导出为文本
                </button>
                
                <button class="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.exportSession('${session.id}', 'json')">
                    <i class="fas fa-file-code mr-3 w-4 text-center"></i>导出为JSON
                </button>
                
                <hr class="border-gray-600 my-1">
                
                <button class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded flex items-center transition-colors" onclick="this.parentElement.parentElement.remove(); historyManager.deleteSession('${session.id}')">
                    <i class="fas fa-trash-alt mr-3 w-4 text-center"></i>删除会话
                </button>
            </div>
        `;

        document.body.appendChild(menu);

        const closeMenu = () => {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 100);
    }

    calculateSessionDuration(session) {
        if (session.messages.length < 2) {
            return '0分钟';
        }
        
        const firstMessage = session.messages[0];
        const lastMessage = session.messages[session.messages.length - 1];
        
        const startTime = new Date(firstMessage.timestamp);
        const endTime = new Date(lastMessage.timestamp);
        const duration = endTime - startTime;
        
        const minutes = Math.floor(duration / 60000);
        if (minutes < 1) {
            return '不到1分钟';
        } else if (minutes < 60) {
            return `${minutes}分钟`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}小时${remainingMinutes}分钟`;
        }
    }





    exportSession(sessionId, format = 'txt') {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;

        let content = '';
        let filename = this.generateExportFilename(session, format);

        switch (format) {
            case 'txt':
                content = this.exportAsText(session);
                break;
            case 'json':
                content = JSON.stringify(session, null, 2);
                break;
            default:
                content = this.exportAsText(session);
        }

        // 创建下载链接
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`会话"${session.title}"已导出为${format.toUpperCase()}文件`, 'success');
    }

    generateExportFilename(session, format) {
        const timestamp = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        const cleanTitle = session.title.replace(/[<>:"/\\|?*]/g, '_');
        
        return `对话记录_${cleanTitle}_${timestamp}_${time}.${format}`;
    }

    exportAsText(session) {
        let text = `对话标题: ${session.title}\n`;
        text += `创建时间: ${new Date(session.createdAt).toLocaleString()}\n`;
        text += `消息数量: ${session.messageCount}\n\n`;

        session.messages.forEach(message => {
            const role = message.role === 'user' ? '用户' : 'AI助手';
            const time = new Date(message.timestamp).toLocaleString();
            text += `[${time}] ${role}:\n${message.content}\n\n`;
        });

        return text;
    }

    updateCurrentSession() {
        const session = this.getCurrentSession();
        if (!session) {
            console.warn('当前会话不存在，无法更新UI');
            return;
        }

        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            if (session.messages && session.messages.length > 0) {
                session.messages.forEach(message => {
                    this.displayMessage(message);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    loadSessionMessages(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            console.error('会话不存在，无法加载消息:', sessionId);
            return;
        }

        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            if (session.messages && session.messages.length > 0) {
                session.messages.forEach(message => {
                    this.displayMessage(message);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        // 创建内容容器
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        // 处理换行符，保持格式
        const formattedContent = message.content.replace(/\n/g, '<br>');
        contentElement.innerHTML = formattedContent;
        messageElement.appendChild(contentElement);
        
        // 添加时间戳
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time text-xs text-gray-400 mt-1';
        timeElement.textContent = this.formatTime(message.timestamp);
        messageElement.appendChild(timeElement);

        messagesContainer.appendChild(messageElement);
    }

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

    migrateData() {
        this.sessions = this.sessions.map(session => {
            if (!session.id) session.id = this.generateSessionId();
            if (!session.createdAt) session.createdAt = new Date().toISOString();
            if (!session.updatedAt) session.updatedAt = new Date().toISOString();
            if (!session.messages) session.messages = [];
            if (!session.messageCount) session.messageCount = session.messages.length;
            if (!session.isArchived) session.isArchived = false;
            if (!session.isPinned) session.isPinned = false;

            if (!session.tags) session.tags = [];
            return session;
        });
    }

    cleanupOldData() {
        if (this.sessions.length > this.maxSessions) {
            this.sessions = this.sessions
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, this.maxSessions);
        }

        this.sessions.forEach(session => {
            if (session.messages.length > this.maxMessagesPerSession) {
                session.messages = session.messages.slice(-this.maxMessagesPerSession);
            }
        });
    }

    setupEventListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadFromStorage();
                this.updateUI();
            }
        });

        // 添加新会话按钮
        this.setupNewSessionButton();
        
        // 添加清空历史按钮
        this.setupClearHistoryButton();
    }

    setupNewSessionButton() {
        const historyHeader = document.querySelector('#chat-history .p-4');
        if (historyHeader) {
            // 检查是否已经存在新会话按钮
            if (document.getElementById('new-session-btn')) {
                return;
            }
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'mt-3 space-y-2';
            buttonContainer.innerHTML = `
                <div class="flex space-x-2">
                    <button id="new-session-btn" class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center">
                        <i class="fas fa-plus mr-2 text-sm"></i>新对话
                    </button>
                </div>
            `;
            historyHeader.appendChild(buttonContainer);

            // 绑定新会话按钮事件
            const newSessionBtn = document.getElementById('new-session-btn');
            if (newSessionBtn) {
                newSessionBtn.addEventListener('click', () => {
                    this.createNewSession();
                });
            }
        }
    }

    setupClearHistoryButton() {
        // 清空历史按钮已在setupNewSessionButton中设置
    }

    clearAllHistory() {
        if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
            this.sessions = [];
            this.currentSessionId = null;
            this.saveToStorage();
            this.updateUI();
            
            // 显示清空成功提示
            this.showNotification('历史记录已清空', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white text-sm transition-all duration-300 transform translate-x-full`;
        
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        notification.className += ` ${bgColor}`;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 使用数据存储管理器的备份功能
    createBackup() {
        return this.storageManager.createBackup();
    }

    restoreFromBackup() {
        const backups = this.storageManager.getBackups();
        
        if (backups.length === 0) {
            this.showNotification('没有找到可用的备份', 'error');
            return;
        }
        
        // 简化版本：直接恢复最新的备份
        const backupData = this.storageManager.restoreFromBackup(0);
        if (backupData) {
            this.sessions = backupData.sessions || [];
            this.currentSessionId = backupData.currentSessionId || null;
            this.saveToStorage();
            this.updateUI();
            
            const backup = this.storageManager.getBackups()[0];
            const date = new Date(backup.timestamp);
            this.showNotification(`已恢复到 ${date.toLocaleString()} 的备份`, 'success');
        } else {
            this.showNotification('恢复备份失败', 'error');
        }
    }

    // 文件导入导出功能
    exportAllSessions() {
        const data = {
            sessions: this.sessions,
            currentSessionId: this.currentSessionId,
            exportTime: new Date().toISOString()
        };
        
        const filename = `voice_chat_history_${new Date().toISOString().split('T')[0]}.json`;
        this.storageManager.exportToFile(data, filename);
        this.showNotification('所有会话已导出到文件', 'success');
    }

    importFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                this.showNotification('正在导入文件...', 'info');
                const importedData = await this.storageManager.importFromFile(file);
                
                if (importedData && importedData.sessions) {
                    // 合并导入的会话
                    const existingIds = new Set(this.sessions.map(s => s.id));
                    const newSessions = importedData.sessions.filter(s => !existingIds.has(s.id));
                    
                    this.sessions.push(...newSessions);
                    this.saveToStorage();
                    this.updateUI();
                    
                    this.showNotification(`成功导入 ${newSessions.length} 个新会话`, 'success');
                } else {
                    this.showNotification('导入的文件格式无效', 'error');
                }
            } catch (error) {
                console.error('导入文件失败:', error);
                this.showNotification('导入文件失败: ' + error.message, 'error');
            }
            
            document.body.removeChild(input);
        });
        
        document.body.appendChild(input);
        input.click();
    }

    exportAllSessions() {
        if (this.sessions.length === 0) {
            this.showNotification('没有可导出的会话', 'error');
            return;
        }

        const format = confirm('选择导出格式：\n确定 = JSON格式（推荐）\n取消 = TXT格式') ? 'json' : 'txt';
        
        let content = '';
        let filename = `所有对话记录_${new Date().toISOString().split('T')[0]}_${new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')}`;

        if (format === 'json') {
            const exportData = {
                exportTime: new Date().toISOString(),
                totalSessions: this.sessions.length,
                totalMessages: this.sessions.reduce((sum, session) => sum + session.messageCount, 0),
                sessions: this.sessions
            };
            content = JSON.stringify(exportData, null, 2);
            filename += '.json';
        } else {
            content = this.exportAllAsText();
            filename += '.txt';
        }

        // 创建下载链接
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`已导出所有 ${this.sessions.length} 个会话为${format.toUpperCase()}文件`, 'success');
    }

    exportAllAsText() {
        let text = `=== 所有对话记录导出 ===\n`;
        text += `导出时间: ${new Date().toLocaleString()}\n`;
        text += `会话总数: ${this.sessions.length}\n`;
        text += `消息总数: ${this.sessions.reduce((sum, session) => sum + session.messageCount, 0)}\n`;
        text += `\n${'='.repeat(50)}\n\n`;

        this.sessions.forEach((session, index) => {
            text += `会话 ${index + 1}: ${session.title}\n`;
            text += `创建时间: ${new Date(session.createdAt).toLocaleString()}\n`;
            text += `消息数量: ${session.messageCount}\n`;
            text += `状态: ${session.isArchived ? '已归档' : '正常'}${session.isPinned ? ' | 已置顶' : ''}\n`;
            text += `\n`;

            session.messages.forEach(message => {
                const role = message.role === 'user' ? '用户' : 'AI助手';
                const time = new Date(message.timestamp).toLocaleString();
                text += `[${time}] ${role}:\n${message.content}\n\n`;
            });

            text += `${'='.repeat(50)}\n\n`;
        });

        return text;
    }

    handleActionButton(action, sessionId) {
        switch (action) {
            case 'edit-btn':
                this.renameSession(sessionId);
                break;

            case 'pin-btn':
                this.togglePinSession(sessionId);
                break;
            case 'archive-btn':
                this.archiveSession(sessionId);
                break;
            case 'copy-btn':
                this.duplicateSession(sessionId);
                break;
            case 'export-btn':
                this.showExportOptions(sessionId);
                break;
            case 'delete-btn':
                this.deleteSession(sessionId);
                break;
            default:
                console.warn('未知的操作类型:', action);
        }
    }

    showExportOptions(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;

        const format = confirm('选择导出格式：\n确定 = TXT格式\n取消 = JSON格式') ? 'txt' : 'json';
        this.exportSession(sessionId, format);
    }

    // 增强的操作按钮功能
    renameSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            this.showNotification('会话不存在', 'error');
            return;
        }

        this.showRenameModal(session);
    }

    showRenameModal(session) {
        // 创建模态框容器
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'rename-modal';

        // 模态框内容
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
                <div class="flex items-center justify-between p-6 border-b border-gray-700">
                    <h3 class="text-lg font-semibold text-white flex items-center">
                        <i class="fas fa-edit mr-2 text-blue-400"></i>
                        重命名会话
                    </h3>
                    <button class="text-gray-400 hover:text-white transition-colors" onclick="this.closest('#rename-modal').remove()">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-300 mb-2">
                            当前标题
                        </label>
                        <div class="text-gray-400 text-sm bg-gray-700 px-3 py-2 rounded border border-gray-600">
                            ${session.title}
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label for="new-title" class="block text-sm font-medium text-gray-300 mb-2">
                            新标题 <span class="text-red-400">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="new-title" 
                            class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            placeholder="请输入新的会话标题..."
                            value="${session.title}"
                            maxlength="50"
                        >
                        <div class="text-xs text-gray-400 mt-1">
                            最多50个字符
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button 
                            id="cancel-rename" 
                            class="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            id="confirm-rename" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled
                        >
                            <i class="fas fa-check mr-1"></i>
                            确认
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 获取元素
        const input = modal.querySelector('#new-title');
        const confirmBtn = modal.querySelector('#confirm-rename');
        const cancelBtn = modal.querySelector('#cancel-rename');

        // 输入验证
        const validateInput = () => {
            const value = input.value.trim();
            const isValid = value.length > 0 && value.length <= 50;
            confirmBtn.disabled = !isValid;
            
            if (value.length > 50) {
                input.classList.add('border-red-500');
                input.classList.remove('border-gray-600', 'focus:border-blue-500');
            } else {
                input.classList.remove('border-red-500');
                input.classList.add('border-gray-600');
            }
        };

        // 事件监听器
        input.addEventListener('input', validateInput);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                confirmBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });

        // 确认重命名
        confirmBtn.addEventListener('click', () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle.length <= 50) {
                const oldTitle = session.title;
                session.title = newTitle;
                session.updatedAt = new Date().toISOString();
                this.saveToStorage();
                this.updateUI();
                
                modal.remove();
                this.showNotification(`会话标题已从"${oldTitle}"更改为"${session.title}"`, 'success');
            }
        });

        // 取消操作
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // 聚焦输入框
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);
    }



    togglePinSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            this.showNotification('会话不存在', 'error');
            return;
        }

        session.isPinned = !session.isPinned;
        session.updatedAt = new Date().toISOString();
        this.saveToStorage();
        this.updateUI();
        
        const action = session.isPinned ? '已置顶' : '已取消置顶';
        this.showNotification(`会话"${session.title}"${action}`, 'success');
    }

    archiveSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            this.showNotification('会话不存在', 'error');
            return;
        }

        session.isArchived = !session.isArchived;
        session.updatedAt = new Date().toISOString();
        this.saveToStorage();
        this.updateUI();
        
        const action = session.isArchived ? '已归档' : '已取消归档';
        this.showNotification(`会话"${session.title}"${action}`, 'success');
    }

    duplicateSession(sessionId) {
        const originalSession = this.sessions.find(s => s.id === sessionId);
        if (!originalSession) {
            this.showNotification('会话不存在', 'error');
            return;
        }

        if (originalSession.messages.length === 0) {
            this.showNotification('空会话无法复制', 'error');
            return;
        }

        const duplicatedSession = {
            ...originalSession,
            id: this.generateSessionId(),
            title: `${originalSession.title} (副本)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isArchived: false,
            isPinned: false
        };

        // 复制消息但重新生成ID
        duplicatedSession.messages = originalSession.messages.map(msg => ({
            ...msg,
            id: this.generateMessageId(),
            timestamp: new Date().toISOString()
        }));

        this.sessions.unshift(duplicatedSession);
        this.currentSessionId = duplicatedSession.id;
        this.saveToStorage();
        this.updateUI();
        
        this.showNotification(`会话"${originalSession.title}"已复制 (${duplicatedSession.messageCount} 条消息)`, 'success');
    }

    deleteSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) {
            this.showNotification('会话不存在', 'error');
            return;
        }

        if (confirm(`确定要删除会话"${session.title}"吗？\n\n此操作不可恢复，将删除 ${session.messageCount} 条消息。`)) {
            const index = this.sessions.findIndex(s => s.id === sessionId);
            if (index > -1) {
                const deletedTitle = session.title;
                this.sessions.splice(index, 1);
                
                if (sessionId === this.currentSessionId) {
                    this.currentSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
                }
                
                this.saveToStorage();
                this.updateUI();
                
                this.showNotification(`会话"${deletedTitle}"已删除`, 'success');
            }
        }
    }

    showDebugInfo() {
        const debugInfo = {
            总会话数: this.sessions.length,
            当前会话ID: this.currentSessionId,
            当前会话存在: !!this.getCurrentSession(),
            存储键: this.storageKey,
            最大会话数: this.maxSessions,
            最大消息数: this.maxMessagesPerSession,
            最后备份时间: this.lastBackupTime,
            会话详情: this.sessions.map(session => ({
                id: session.id,
                title: session.title,
                messageCount: session.messageCount,
                actualMessages: session.messages ? session.messages.length : 0,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                isArchived: session.isArchived,
                isPinned: session.isPinned
            }))
        };

        console.log('=== 历史记录调试信息 ===');
        console.log(debugInfo);
        
        // 显示在页面上
        const debugText = JSON.stringify(debugInfo, null, 2);
        const debugWindow = window.open('', '_blank');
        debugWindow.document.write(`
            <html>
            <head>
                <title>历史记录调试信息</title>
                <style>
                    body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
                    pre { background: #2a2a2a; padding: 15px; border-radius: 5px; overflow-x: auto; }
                </style>
            </head>
            <body>
                <h2>历史记录调试信息</h2>
                <pre>${debugText}</pre>
            </body>
            </html>
        `);
        
        this.showNotification('调试信息已显示在控制台和新窗口中', 'info');
    }

    repairData() {
        if (confirm('确定要修复历史记录数据吗？这将验证并修复所有数据问题。')) {
            console.log('开始修复历史记录数据...');
            
            // 重新验证和修复数据
            this.validateAndFixData();
            this.migrateData();
            this.cleanupOldData();
            
            // 保存修复后的数据
            this.saveToStorage();
            this.updateUI();
            
            console.log('数据修复完成');
            this.showNotification('历史记录数据修复完成', 'success');
        }
    }
}

// 等待DOM完全加载后再初始化历史记录管理器
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
});
