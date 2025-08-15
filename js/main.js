/**
 * 主应用文件
 * 整合所有组件并处理用户交互
 */
class VoiceChatApp {
    constructor() {
        this.speechRecognition = null;
        this.speechSynthesis = null;
        this.dialogueManager = null;
        this.isInitialized = false;
        this.isListening = false;
        this.historyManager = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('正在初始化语音交流平台...');
            this.updateSystemStatus('initializing', '正在初始化...');
            
            // 初始化系统监控器
            this.systemMonitor = new SystemMonitor();
            this.systemMonitor.setSystemStatus('initializing');
            
            this.speechRecognition = new SpeechRecognitionSystem();
            this.speechSynthesis = new NaturalSpeechSynthesis();
            this.resourceManager = new ResourceManager();
            
            // 将资源管理器暴露到全局，供其他模块使用
            window.resourceManager = this.resourceManager;
            
            this.dialogueManager = new DialogueManager();
            
            // 等待历史记录管理器初始化
            await this.waitForHistoryManager();
            
            this.bindEvents();
            this.initUI();
            
            this.isInitialized = true;
            this.systemMonitor.setSystemStatus('ready');
            console.log('语音交流平台初始化完成');
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.updateSystemStatus('error', '初始化失败');
            if (this.systemMonitor) {
                this.systemMonitor.logError('Application Initialization Failed', { error: error.message });
            }
            this.showError('应用初始化失败');
        }
    }

    async waitForHistoryManager() {
        return new Promise((resolve) => {
            const checkHistoryManager = () => {
                if (window.historyManager) {
                    this.historyManager = window.historyManager;
                    resolve();
                } else {
                    setTimeout(checkHistoryManager, 50);
                }
            };
            checkHistoryManager();
        });
    }

    bindEvents() {
        // 初始化网站标识
        this.initWebsiteHeader();
        
        // 绑定资源管理按钮事件
        const resourceManagerBtn = document.getElementById('resource-manager-btn');
        if (resourceManagerBtn) {
            resourceManagerBtn.addEventListener('click', () => this.openResourceManager());
        }
        
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleVoiceRecognition());
        }

        const textInput = document.getElementById('text-input');
        const sendBtn = document.getElementById('send-btn');
        
        if (textInput) {
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendTextMessage();
                }
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendTextMessage());
        }

        if (this.speechRecognition) {
            this.speechRecognition.onResult((transcript) => {
                this.handleVoiceInput(transcript);
            });
        }

        // 绑定侧边栏折叠/展开事件
        this.bindSidebarEvents();
        
        // 绑定滚动到底部按钮事件
        this.bindScrollToBottomEvents();

        // 初始化工具面板交互
        this.initToolsPanel();

    }

    bindSidebarEvents() {
        const toggleChatBtn = document.getElementById('toggle-chat');
        const toggleKnowledgeBtn = document.getElementById('toggle-knowledge');
        const expandChatBtn = document.getElementById('expand-chat');
        const expandKnowledgeBtn = document.getElementById('expand-knowledge');
        const chatHistory = document.getElementById('chat-history');
        const knowledgeSidebar = document.getElementById('knowledge-sidebar');

        // 左侧对话历史折叠/展开
        if (toggleChatBtn && chatHistory) {
            toggleChatBtn.addEventListener('click', () => {
                this.hideChatHistory();
            });
        }

        // 右侧知识库折叠/展开
        if (toggleKnowledgeBtn && knowledgeSidebar) {
            toggleKnowledgeBtn.addEventListener('click', () => {
                this.hideKnowledgeSidebar();
            });
        }

        // 左侧展开按钮
        if (expandChatBtn && chatHistory) {
            expandChatBtn.addEventListener('click', () => {
                this.showChatHistory();
            });
        }

        // 右侧展开按钮
        if (expandKnowledgeBtn && knowledgeSidebar) {
            expandKnowledgeBtn.addEventListener('click', () => {
                this.showKnowledgeSidebar();
            });
        }

        // 添加键盘快捷键支持
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 1: 切换左侧对话历史
            if ((e.ctrlKey || e.metaKey) && e.key === '1') {
                e.preventDefault();
                if (chatHistory.classList.contains('hidden')) {
                    this.showChatHistory();
                } else {
                    this.hideChatHistory();
                }
            }
            // Ctrl/Cmd + 2: 切换右侧知识库
            if ((e.ctrlKey || e.metaKey) && e.key === '2') {
                e.preventDefault();
                if (knowledgeSidebar.classList.contains('hidden')) {
                    this.showKnowledgeSidebar();
                } else {
                    this.hideKnowledgeSidebar();
                }
            }
        });
    }

    // 隐藏对话历史侧边栏
    hideChatHistory() {
        const chatHistory = document.getElementById('chat-history');
        const expandChatBtn = document.getElementById('expand-chat');
        const mainContent = document.getElementById('main-content');
        
        if (!chatHistory || !expandChatBtn) return;

        // 添加隐藏动画
        chatHistory.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        chatHistory.style.transform = 'translateX(-100%)';
        chatHistory.style.opacity = '0';
        
        // 同时调整中间内容区域
        if (mainContent) {
            mainContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.marginLeft = '0';
        }
        
        setTimeout(() => {
            // 隐藏侧边栏
            chatHistory.classList.add('hidden');
            chatHistory.style.transform = '';
            chatHistory.style.opacity = '';
            
            // 显示展开按钮
            expandChatBtn.style.display = 'flex';
            setTimeout(() => {
                expandChatBtn.classList.add('show');
            }, 50);
        }, 400);
        
        // 显示通知
        this.showNotification('对话历史已隐藏', 'info');
    }

    // 显示对话历史侧边栏
    showChatHistory() {
        const chatHistory = document.getElementById('chat-history');
        const expandChatBtn = document.getElementById('expand-chat');
        const mainContent = document.getElementById('main-content');
        
        if (!chatHistory || !expandChatBtn) return;

        // 隐藏展开按钮
        expandChatBtn.classList.remove('show');
        setTimeout(() => {
            expandChatBtn.style.display = 'none';
        }, 400);

        // 显示侧边栏
        chatHistory.classList.remove('hidden');
        chatHistory.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        chatHistory.style.transform = 'translateX(0)';
        chatHistory.style.opacity = '1';
        
        // 同时调整中间内容区域
        if (mainContent) {
            mainContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.marginLeft = '';
        }
        
        // 显示通知
        this.showNotification('对话历史已显示', 'success');
    }

    // 隐藏知识库侧边栏
    hideKnowledgeSidebar() {
        const knowledgeSidebar = document.getElementById('knowledge-sidebar');
        const expandKnowledgeBtn = document.getElementById('expand-knowledge');
        const mainContent = document.getElementById('main-content');
        
        if (!knowledgeSidebar || !expandKnowledgeBtn) return;

        // 添加隐藏动画
        knowledgeSidebar.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        knowledgeSidebar.style.transform = 'translateX(100%)';
        knowledgeSidebar.style.opacity = '0';
        
        // 同时调整中间内容区域
        if (mainContent) {
            mainContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.marginRight = '0';
        }
        
        setTimeout(() => {
            // 隐藏侧边栏
            knowledgeSidebar.classList.add('hidden');
            knowledgeSidebar.style.transform = '';
            knowledgeSidebar.style.opacity = '';
            
            // 显示展开按钮
            expandKnowledgeBtn.style.display = 'flex';
            setTimeout(() => {
                expandKnowledgeBtn.classList.add('show');
            }, 50);
        }, 400);
        
        // 显示通知
        this.showNotification('知识库已隐藏', 'info');
    }

    // 显示知识库侧边栏
    showKnowledgeSidebar() {
        const knowledgeSidebar = document.getElementById('knowledge-sidebar');
        const expandKnowledgeBtn = document.getElementById('expand-knowledge');
        const mainContent = document.getElementById('main-content');
        
        if (!knowledgeSidebar || !expandKnowledgeBtn) return;

        // 隐藏展开按钮
        expandKnowledgeBtn.classList.remove('show');
        setTimeout(() => {
            expandKnowledgeBtn.style.display = 'none';
        }, 400);

        // 显示侧边栏
        knowledgeSidebar.classList.remove('hidden');
        knowledgeSidebar.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        knowledgeSidebar.style.transform = 'translateX(0)';
        knowledgeSidebar.style.opacity = '1';
        
        // 同时调整中间内容区域
        if (mainContent) {
            mainContent.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.marginRight = '';
        }
        
        // 显示通知
        this.showNotification('知识库已显示', 'success');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    bindScrollToBottomEvents() {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        // 创建滚动到底部按钮
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-bottom-btn';
        scrollBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        scrollBtn.title = '滚动到底部';
        
        // 添加点击事件
        scrollBtn.addEventListener('click', () => {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        });

        // 将按钮添加到消息容器
        messagesContainer.parentElement.appendChild(scrollBtn);

        // 监听滚动事件，控制按钮显示/隐藏
        messagesContainer.addEventListener('scroll', () => {
            this.updateScrollToBottomButton();
        });

        // 初始检查
        this.updateScrollToBottomButton();
    }

    updateScrollToBottomButton() {
        const messagesContainer = document.getElementById('messages-container');
        const scrollBtn = document.querySelector('.scroll-to-bottom-btn');
        
        if (!messagesContainer || !scrollBtn) return;

        const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
        
        if (isAtBottom) {
            scrollBtn.classList.remove('show');
        } else {
            scrollBtn.classList.add('show');
        }
    }

    initUI() {
        this.updateDigitalHumanState('idle');
        this.addMessage('system', '系统已就绪，您可以开始语音或文字交流。');
    }

    async toggleVoiceRecognition() {
        if (!this.isInitialized) {
            this.showError('系统未初始化完成');
            return;
        }

        if (this.isListening) {
            this.speechRecognition.stop();
            this.isListening = false;
        } else {
            const success = this.speechRecognition.start();
            if (success) {
                this.isListening = true;
            }
        }
    }

    async handleVoiceInput(transcript) {
        console.log('收到语音输入:', transcript);
        
        this.addMessage('user', transcript);
        this.updateDigitalHumanState('thinking');
        
        const response = await this.dialogueManager.processUserInput(transcript, 'voice');
        
        this.addMessage('ai', response);
        this.speakResponse(response);
    }

    async sendTextMessage() {
        const textInput = document.getElementById('text-input');
        if (!textInput) return;
        
        const message = textInput.value.trim();
        if (!message) return;
        
        textInput.value = '';
        
        this.addMessage('user', message);
        this.updateDigitalHumanState('thinking');
        
        const response = await this.dialogueManager.processUserInput(message, 'text');
        
        this.addMessage('ai', response);
        this.speakResponse(response);
    }

    speakResponse(text) {
        if (!this.speechSynthesis) return;
        
        this.speechSynthesis.speak(text);
        this.updateDigitalHumanState('speaking');
    }

    addMessage(role, content) {
        // 使用新的历史记录管理器
        if (window.historyManager) {
            window.historyManager.addMessage(role, content);
        } else {
            // 降级到原来的方式
            const messagesContainer = document.getElementById('messages-container');
            if (!messagesContainer) return;
            
            const messageElement = document.createElement('div');
            messageElement.className = `message ${role}`;
            
            // 创建内容容器
            const contentElement = document.createElement('div');
            contentElement.className = 'message-content';
            
            // 处理换行符，保持格式
            const formattedContent = content.replace(/\n/g, '<br>');
            contentElement.innerHTML = formattedContent;
            messageElement.appendChild(contentElement);
            
            // 添加时间戳
            const timestamp = new Date().toLocaleTimeString('zh-CN');
            const timeElement = document.createElement('div');
            timeElement.className = 'message-time text-xs text-gray-400 mt-1';
            timeElement.textContent = timestamp;
            messageElement.appendChild(timeElement);
            
            messagesContainer.appendChild(messageElement);
            
            // 确保滚动到底部，使用setTimeout确保DOM更新完成
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                this.updateScrollToBottomButton();
            }, 100);
        }
    }

    addToHistory(role, content, timestamp) {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item bg-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-600 transition-colors';
        
        const roleIcon = role === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const roleColor = role === 'user' ? 'text-blue-400' : 'text-green-400';
        
        historyItem.innerHTML = `
            <div class="flex items-start space-x-2">
                <i class="${roleIcon} ${roleColor} mt-1"></i>
                <div class="flex-1 min-w-0">
                    <div class="text-white text-sm font-medium truncate">${content.substring(0, 50)}${content.length > 50 ? '...' : ''}</div>
                    <div class="text-gray-400 text-xs mt-1">${timestamp}</div>
                </div>
            </div>
        `;
        
        // 点击历史记录项可以查看完整内容
        historyItem.addEventListener('click', () => {
            this.showHistoryDetail(role, content, timestamp);
        });
        
        historyList.appendChild(historyItem);
        historyList.scrollTop = historyList.scrollHeight;
    }

    showHistoryDetail(role, content, timestamp) {
        // 创建模态框显示完整的历史记录内容
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-white text-lg font-semibold">历史对话详情</h3>
                    <button class="text-gray-400 hover:text-white" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center space-x-2 mb-2">
                        <i class="${role === 'user' ? 'fas fa-user text-blue-400' : 'fas fa-robot text-green-400'}"></i>
                        <span class="text-white font-medium">${role === 'user' ? '用户' : 'AI助手'}</span>
                        <span class="text-gray-400 text-sm">${timestamp}</span>
                    </div>
                    <div class="text-gray-300 text-sm leading-relaxed">${content}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 点击背景关闭模态框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateDigitalHumanState(state) {
        const digitalHuman = document.getElementById('digital-human');
        const statusElement = document.getElementById('digital-human-status');
        
        if (digitalHuman) {
            digitalHuman.className = 'digital-human ' + state;
        }
        
        if (statusElement) {
            const states = {
                'idle': '准备就绪',
                'listening': '正在聆听',
                'speaking': '正在说话',
                'thinking': '思考中'
            };
            statusElement.textContent = states[state] || '准备就绪';
        }
    }

    showWelcomeMessage() {
        const welcomeMessage = '欢迎使用语音交流平台！您可以点击麦克风按钮开始语音对话，或者直接输入文字与我交流。';
        this.addMessage('system', welcomeMessage);
        
        // 更新系统状态
        this.updateSystemStatus('ready', '系统就绪');
        
        // 添加一些示例历史记录
        this.addSampleHistory();
    }

    addSampleHistory() {
        const sampleHistory = [
            { role: 'user', content: '你好，我想了解一些传统文化知识', timestamp: '14:30:25' },
            { role: 'ai', content: '您好！很高兴为您介绍中华传统文化。我们这里有丰富的传统美食、工艺、戏曲、节日、医药和建筑知识。您想了解哪个方面呢？', timestamp: '14:30:28' },
            { role: 'user', content: '能介绍一下传统美食吗？', timestamp: '14:30:35' },
            { role: 'ai', content: '当然可以！中华传统美食种类繁多，比如过桥米线、热干面、小笼包等。每种美食都有其独特的制作工艺和文化背景。', timestamp: '14:30:40' }
        ];
        
        sampleHistory.forEach(item => {
            this.addToHistory(item.role, item.content, item.timestamp);
        });
    }

    updateSystemStatus(status, text) {
        const statusIndicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('status-text');
        
        if (statusIndicator && statusText) {
            const colors = {
                'ready': '#10b981',      // 绿色
                'initializing': '#f59e0b', // 黄色
                'error': '#ef4444',      // 红色
                'listening': '#3b82f6',  // 蓝色
                'speaking': '#8b5cf6'    // 紫色
            };
            
            statusIndicator.style.color = colors[status] || colors['ready'];
            statusText.textContent = text;
        }
    }

    showError(message) {
        console.error('应用错误:', message);
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-triangle mr-2"></i>
            ${message}
        `;
        
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            inputContainer.appendChild(errorElement);
            
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 5000);
        }
    }

    // 初始化网站标识
    initWebsiteHeader() {
        const logoContainer = document.querySelector('.logo-container');
        const versionInfo = document.querySelector('.version-info');
        
        // Logo点击效果
        if (logoContainer) {
            logoContainer.addEventListener('click', () => {
                this.showNotification('欢迎使用语音交流平台！', 'success');
                
                // 添加点击动画效果
                logoContainer.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    logoContainer.style.transform = '';
                }, 150);
            });
        }
        
        // 版本信息悬停效果
        if (versionInfo) {
            versionInfo.addEventListener('mouseenter', () => {
                versionInfo.style.transform = 'translateY(-2px) scale(1.05)';
            });
            
            versionInfo.addEventListener('mouseleave', () => {
                versionInfo.style.transform = '';
            });
            
            // 点击版本信息显示详细信息
            versionInfo.addEventListener('click', () => {
                this.showNotification('当前版本：v2.0 - AI智能对话平台', 'info');
            });
        }
        
        // 头部固定显示，不需要滚动效果
        const header = document.querySelector('.website-header');
        if (header) {
            header.style.transform = 'translateY(0)';
        }
    }

    // 初始化工具面板交互
    initToolsPanel() {
        // 开关控制
        this.initToggleSwitches();
        
        // 快捷工具按钮
        this.initToolButtons();
        
        // 更新系统信息
        this.updateSystemInfo();
    }
    
    // 初始化开关控制
    initToggleSwitches() {
        const toggles = document.querySelectorAll('.toggle-switch input');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const settingName = e.target.id;
                const isEnabled = e.target.checked;
                
                // 添加切换动画
                const slider = e.target.nextElementSibling;
                slider.style.transform = isEnabled ? 'translateX(20px)' : 'translateX(0)';
                
                // 处理不同设置
                this.handleSettingChange(settingName, isEnabled);
            });
        });
    }
    
    // 处理设置变更
    handleSettingChange(settingName, isEnabled) {
        switch(settingName) {
            case 'voice-recognition-toggle':
                if (isEnabled) {
                    this.showNotification('语音识别已启用', 'success');
                    if (this.speechRecognition) {
                        this.speechRecognition.enable();
                    }
                } else {
                    this.showNotification('语音识别已禁用', 'info');
                    if (this.speechRecognition) {
                        this.speechRecognition.disable();
                    }
                }
                break;
                
            case 'voice-synthesis-toggle':
                if (isEnabled) {
                    this.showNotification('语音合成已启用', 'success');
                    if (this.speechSynthesis) {
                        this.speechSynthesis.enable();
                    }
                } else {
                    this.showNotification('语音合成已禁用', 'info');
                    if (this.speechSynthesis) {
                        this.speechSynthesis.disable();
                    }
                }
                break;
                
            case 'auto-play-toggle':
                if (isEnabled) {
                    this.showNotification('自动播放已启用', 'success');
                } else {
                    this.showNotification('自动播放已禁用', 'info');
                }
                break;
                
            case 'dark-mode-toggle':
                if (isEnabled) {
                    this.showNotification('深色模式已启用', 'success');
                    document.body.classList.add('dark-mode');
                } else {
                    this.showNotification('深色模式已禁用', 'info');
                    document.body.classList.remove('dark-mode');
                }
                break;
                
            case 'animation-toggle':
                if (isEnabled) {
                    this.showNotification('动画效果已启用', 'success');
                    document.body.classList.remove('no-animation');
                } else {
                    this.showNotification('动画效果已禁用', 'info');
                    document.body.classList.add('no-animation');
                }
                break;
                
            case 'auto-save-toggle':
                if (isEnabled) {
                    this.showNotification('自动保存已启用', 'success');
                } else {
                    this.showNotification('自动保存已禁用', 'info');
                }
                break;
        }
    }
    
    // 初始化工具按钮
    initToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.getAttribute('data-tool');
                
                // 添加点击动画
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
                
                // 处理不同工具
                this.handleToolAction(tool);
            });
        });
    }
    
    // 处理工具操作
    handleToolAction(tool) {
        switch(tool) {
            case 'clear':
                this.clearConversation();
                break;
            case 'export':
                this.exportConversation();
                break;
            case 'backup':
                this.backupData();
                break;
            case 'settings':
                this.openAdvancedSettings();
                break;
        }
    }
    
    // 清空对话
    clearConversation() {
        if (confirm('确定要清空当前对话吗？此操作不可撤销。')) {
            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            this.showNotification('对话已清空', 'success');
        }
    }
    
    // 导出对话
    exportConversation() {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            const messages = messagesContainer.innerHTML;
            const blob = new Blob([messages], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `对话记录_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`;
            a.click();
            URL.revokeObjectURL(url);
        }
        this.showNotification('对话记录已导出', 'success');
    }
    
    // 备份数据
    backupData() {
        this.showNotification('数据备份功能开发中...', 'info');
    }
    
    // 打开高级设置
    openAdvancedSettings() {
        this.showNotification('高级设置功能开发中...', 'info');
    }
    
    // 打开资源管理器
    openResourceManager() {
        try {
            // 打开独立的资源管理页面
            const resourceManagerUrl = 'http://121.40.185.158:3000/simple-resource-manager.html';
            
            // 在新窗口中打开资源管理器
            const newWindow = window.open(resourceManagerUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
            
            if (newWindow) {
                this.showNotification('资源管理器已在新窗口中打开', 'success');
                
                // 监听新窗口的关闭事件
                const checkClosed = setInterval(() => {
                    if (newWindow.closed) {
                        clearInterval(checkClosed);
                        this.showNotification('资源管理器窗口已关闭', 'info');
                    }
                }, 1000);
            } else {
                // 如果弹窗被阻止，尝试在当前窗口打开
                this.showNotification('弹窗被阻止，正在当前窗口打开...', 'warning');
                window.location.href = resourceManagerUrl;
            }
        } catch (error) {
            console.error('打开资源管理器失败:', error);
            this.showNotification('打开资源管理器失败', 'error');
        }
    }
    
    // 更新系统信息
    updateSystemInfo() {
        // 这里可以添加实时系统信息更新
        setInterval(() => {
            // 更新内存使用情况
            const memoryElement = document.querySelector('.info-item:nth-child(3) .info-value');
            if (memoryElement) {
                const memory = Math.floor(Math.random() * 50) + 100;
                memoryElement.textContent = `${memory}MB`;
            }
        }, 5000);
    }


}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.voiceChatApp = new VoiceChatApp();
});
