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
        this.timeManager = null;
        
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
            
            // 将对话管理器暴露到全局，供调试使用
            window.dialogueManager = this.dialogueManager;
            
            // 等待历史记录管理器初始化
            await this.waitForHistoryManager();
            
            // 初始化时间管理器
            this.timeManager = new TimeManager();
            window.timeManager = this.timeManager;
            
            this.bindEvents();
            this.initUI();
            
            this.isInitialized = true;
            this.systemMonitor.setSystemStatus('ready');
            console.log('语音交流平台初始化完成');
            
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
        
        // 绑定对话历史按钮事件
        const conversationHistoryBtn = document.getElementById('conversation-history-btn');
        if (conversationHistoryBtn) {
            conversationHistoryBtn.addEventListener('click', () => this.openConversationHistory());
        }
        
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
            
            // 监听输入框内容变化，动态调整发送按钮状态
            textInput.addEventListener('input', () => {
                this.updateSendButtonState();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendTextMessage());
            
            // 添加发送按钮的增强交互效果
            this.enhanceSendButtonInteraction(sendBtn);
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
        
        // 初始化发送按钮状态
        this.updateSendButtonState();
        
        // 绑定键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S: 停止语音播放
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.stopAllVoicePlayback();
            }
        });
    }

    // 增强发送按钮交互效果
    enhanceSendButtonInteraction(sendBtn) {
        // 添加鼠标悬停效果
        sendBtn.addEventListener('mouseenter', () => {
            sendBtn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        
        sendBtn.addEventListener('mouseleave', () => {
            sendBtn.style.transform = 'translateY(-50%) scale(1)';
        });
        
        // 添加点击波纹效果
        sendBtn.addEventListener('click', (e) => {
            this.createRippleEffect(e, sendBtn);
        });
        
        // 添加键盘焦点效果
        sendBtn.addEventListener('focus', () => {
            sendBtn.classList.add('focused');
        });
        
        sendBtn.addEventListener('blur', () => {
            sendBtn.classList.remove('focused');
        });
    }

    // 创建点击波纹效果
    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // 更新发送按钮状态
    updateSendButtonState() {
        const textInput = document.getElementById('text-input');
        const sendBtn = document.getElementById('send-btn');
        
        if (!textInput || !sendBtn) return;
        
        const hasText = textInput.value.trim().length > 0;
        
        if (hasText) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.classList.remove('disabled');
        } else {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
            sendBtn.classList.add('disabled');
        }
    }

    // 发送按钮状态管理
    setSendButtonState(state) {
        const sendBtn = document.getElementById('send-btn');
        if (!sendBtn) return;
        
        // 移除所有状态类
        sendBtn.classList.remove('sending', 'success', 'error', 'loading');
        
        switch (state) {
            case 'sending':
                sendBtn.classList.add('sending');
                sendBtn.disabled = true;
                break;
            case 'success':
                sendBtn.classList.add('success');
                setTimeout(() => {
                    sendBtn.classList.remove('success');
                    sendBtn.disabled = false;
                }, 800);
                break;
            case 'error':
                sendBtn.classList.add('error');
                setTimeout(() => {
                    sendBtn.classList.remove('error');
                    sendBtn.disabled = false;
                }, 400);
                break;
            case 'loading':
                sendBtn.classList.add('loading');
                sendBtn.disabled = true;
                break;
            default:
                sendBtn.disabled = false;
                break;
        }
    }

    bindSidebarEvents() {
        // 保留其他侧边栏事件绑定
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
    }

    async toggleVoiceRecognition() {
        if (!this.isInitialized) {
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
        
        // 隐藏语音识别状态
        const statusElement = document.getElementById('recognition-status');
        const resultElement = document.getElementById('voice-result');
        if (statusElement) {
            statusElement.classList.add('hidden');
            console.log('主应用中隐藏识别状态');
        }
        if (resultElement) {
            resultElement.classList.add('hidden');
            console.log('主应用中隐藏语音结果');
        }
        
        this.addMessage('user', transcript);
        this.updateDigitalHumanState('thinking');
        
        const response = await this.dialogueManager.processUserInput(transcript, 'voice');
        
        // 检查是否是媒体响应类型
        if (response && response.type === 'media_response' && response.messages) {
            // 逐个显示媒体消息
            for (const mediaMessage of response.messages) {
                // 确保mediaMessage是字符串类型
                if (typeof mediaMessage === 'string') {
                    this.addMessage('ai', mediaMessage);
                    // 为每个消息生成语音（除了媒体文件消息）
                    if (!mediaMessage.includes('![') && !mediaMessage.includes('<video') && !mediaMessage.includes('<audio')) {
                        this.speakResponse(mediaMessage);
                    }
                } else {
                    console.warn('媒体消息不是字符串类型:', typeof mediaMessage, mediaMessage);
                    this.addMessage('ai', String(mediaMessage));
                }
            }
        } else {
            // 普通文本响应
            this.addMessage('ai', response);
            this.speakResponse(response);
        }
    }

    async sendTextMessage() {
        const textInput = document.getElementById('text-input');
        if (!textInput) return;
        
        const message = textInput.value.trim();
        if (!message) return;
        
        // 设置发送按钮为发送状态
        this.setSendButtonState('sending');
        
        // 清空输入框
        textInput.value = '';
        
        // 更新发送按钮状态
        this.updateSendButtonState();
        
        try {
            this.addMessage('user', message);
            this.updateDigitalHumanState('thinking');
            
            // 确保对话管理器已初始化
            if (!this.dialogueManager || !this.dialogueManager.knowledgeBase || Object.keys(this.dialogueManager.knowledgeBase).length === 0) {
                console.log('对话管理器未初始化完成，等待...');
                this.addMessage('ai', '系统正在加载知识库，请稍候...');
                this.updateDigitalHumanState('ready');
                
                // 设置发送按钮为成功状态
                this.setSendButtonState('success');
                
                // 等待一段时间后重试
                setTimeout(async () => {
                    if (this.dialogueManager && this.dialogueManager.knowledgeBase && Object.keys(this.dialogueManager.knowledgeBase).length > 0) {
                        console.log('知识库已加载，重新处理用户输入...');
                        const response = await this.dialogueManager.processUserInput(message, 'text');
                        
                        // 添加调试日志
                        console.log('重试逻辑收到响应:', response);
                        console.log('重试逻辑响应类型:', response?.type);
                        console.log('重试逻辑是否有messages:', response?.messages);
                        
                        // 检查是否是媒体响应类型
                        console.log('重试逻辑检查媒体响应条件:', {
                            hasResponse: !!response,
                            responseType: response?.type,
                            typeMatch: response?.type === 'media_response',
                            hasMessages: !!response?.messages,
                            messagesLength: response?.messages?.length
                        });
                        
                        if (response && response.type === 'media_response' && response.messages) {
                            // 逐个显示媒体消息
                            for (const mediaMessage of response.messages) {
                                // 确保mediaMessage是字符串类型
                                if (typeof mediaMessage === 'string') {
                                    this.addMessage('ai', mediaMessage);
                                    // 为每个消息生成语音（除了媒体文件消息）
                                    if (!mediaMessage.includes('![') && !mediaMessage.includes('<video') && !mediaMessage.includes('<audio')) {
                                        this.speakResponse(mediaMessage);
                                    }
                                } else {
                                    console.warn('媒体消息不是字符串类型:', typeof mediaMessage, mediaMessage);
                                    this.addMessage('ai', String(mediaMessage));
                                }
                            }
                        } else {
                            // 普通文本响应
                            this.addMessage('ai', response);
                            this.speakResponse(response);
                        }
                        
                        this.updateDigitalHumanState('ready');
                    } else {
                        this.addMessage('ai', '抱歉，系统暂时无法响应，请稍后再试。');
                        this.updateDigitalHumanState('ready');
                    }
                }, 3000);
                return;
            }
            
            // 处理用户输入
            const response = await this.dialogueManager.processUserInput(message, 'text');
            
            // 添加调试日志
            console.log('主网页收到响应:', response);
            console.log('响应类型:', response?.type);
            console.log('是否有messages:', response?.messages);
            
            // 检查是否是媒体响应类型
            console.log('检查媒体响应条件:', {
                hasResponse: !!response,
                responseType: response?.type,
                typeMatch: response?.type === 'media_response',
                hasMessages: !!response?.messages,
                messagesLength: response?.messages?.length
            });
            
            if (response && response.type === 'media_response' && response.messages) {
                // 逐个显示媒体消息
                for (const mediaMessage of response.messages) {
                    // 确保mediaMessage是字符串类型
                    if (typeof mediaMessage === 'string') {
                        this.addMessage('ai', mediaMessage);
                        // 为每个消息生成语音（除了媒体文件消息）
                        if (!mediaMessage.includes('![') && !mediaMessage.includes('<video') && !mediaMessage.includes('<audio')) {
                            this.speakResponse(mediaMessage);
                        }
                    } else {
                        console.warn('媒体消息不是字符串类型:', typeof mediaMessage, mediaMessage);
                        this.addMessage('ai', String(mediaMessage));
                    }
                }
            } else {
                // 普通文本响应
                this.addMessage('ai', response);
                this.speakResponse(response);
            }
            
            // 设置发送按钮为成功状态
            this.setSendButtonState('success');
            
        } catch (error) {
            console.error('发送消息时出错:', error);
            this.addMessage('system', '发送消息时出现错误，请重试。');
            this.updateDigitalHumanState('ready');
            
            // 设置发送按钮为错误状态
            this.setSendButtonState('error');
        }
    }

    speakResponse(text) {
        if (!this.speechSynthesis) return;
        
        this.speechSynthesis.speak(text);
        this.updateDigitalHumanState('speaking');
        
        // 更新停止语音按钮状态
        if (window.historyManager && window.historyManager.updateStopVoiceButtons) {
            window.historyManager.updateStopVoiceButtons();
        }
        
        // 监听语音播放结束事件
        if (this.speechSynthesis.utterance) {
            this.speechSynthesis.utterance.onend = () => {
                this.updateDigitalHumanState('ready');
                // 语音播放结束后更新按钮状态
                if (window.historyManager && window.historyManager.updateStopVoiceButtons) {
                    window.historyManager.updateStopVoiceButtons();
                }
            };
        }
    }

    /**
     * 停止所有语音播放
     */
    stopAllVoicePlayback() {
        // 快速停止所有语音
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        if (window.speechConflictManager && window.speechConflictManager.stopAISpeech) {
            window.speechConflictManager.stopAISpeech();
        }
        
        if (window.naturalSpeechSynthesis && window.naturalSpeechSynthesis.stop) {
            window.naturalSpeechSynthesis.stop();
        }
        
        // 更新数字人状态
        this.updateDigitalHumanState('idle');
        
        // 更新停止语音按钮状态
        if (window.historyManager && window.historyManager.updateStopVoiceButtons) {
            window.historyManager.updateStopVoiceButtons();
        }
        
        // 显示操作反馈
        this.showVoiceStopFeedback();
    }

    /**
     * 显示语音停止操作反馈
     */
    showVoiceStopFeedback() {
        // 创建反馈提示
        const feedback = document.createElement('div');
        feedback.className = 'voice-stop-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <i class="fas fa-volume-mute"></i>
                <span>语音播放已停止</span>
            </div>
        `;
        
        document.body.appendChild(feedback);
        
        // 显示动画
        setTimeout(() => {
            feedback.classList.add('show');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }

    /**
     * 简单的Markdown渲染器
     * 支持常用的Markdown语法
     */
    renderMarkdown(text) {
        // 确保text是字符串类型
        if (!text) return '';
        if (typeof text !== 'string') {
            console.warn('renderMarkdown: 输入不是字符串类型:', typeof text, text);
            text = String(text);
        }
        
        let html = text;
        
        // 保护图片URL（在HTML转义之前）
        const imageUrls = [];
        html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, url) => {
            imageUrls.push({ match, alt, url });
            return `__IMAGE_${imageUrls.length - 1}__`;
        });
        
        // 保护HTML标签（video, audio等）
        const htmlTags = [];
        html = html.replace(/(<(video|audio)[^>]*>[\s\S]*?<\/(video|audio)>)/g, (match) => {
            htmlTags.push(match);
            return `__HTML_TAG_${htmlTags.length - 1}__`;
        });
        
        // 转义HTML字符（防止XSS），但排除图片URL中的内容
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        
        // 恢复HTML标签
        htmlTags.forEach((tag, index) => {
            html = html.replace(`__HTML_TAG_${index}__`, tag);
        });
        
        // 处理代码块 ```
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 处理行内代码 `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 处理粗体 **text** 和 __text__
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // 只处理单词边界内的双下划线，避免影响URL中的下划线
        html = html.replace(/\b__([^_]+)__\b/g, '<strong>$1</strong>');
        
        // 处理斜体 *text* 和 _text_
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        // 只处理单词边界内的单下划线，避免影响URL中的下划线
        html = html.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');
        
        // 处理删除线 ~~text~~
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        // 处理标题
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // 处理链接 [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 处理分隔线
        html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
        
        // 处理换行
        html = html.replace(/\n/g, '<br>');
        
        // 恢复图片URL并转换为HTML（确保URL不被转义）
        imageUrls.forEach((image, index) => {
            // 确保URL是原始格式，不被转义
            const imgHtml = `<img src="${image.url}" alt="${image.alt}" style="max-width: 100%; height: auto;">`;
            html = html.replace(`__IMAGE_${index}__`, imgHtml);
        });
        
        return html;
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
            
            // 创建消息头像
            const avatarElement = document.createElement('div');
            avatarElement.className = 'message-avatar';
            
            // 根据角色设置头像内容
            if (role === 'user') {
                avatarElement.innerHTML = '<i class="fas fa-user-circle"></i>';
            } else if (role === 'ai') {
                avatarElement.innerHTML = ''; // AI头像使用背景图片，不需要图标
            } else if (role === 'system') {
                avatarElement.innerHTML = '<i class="fas fa-microchip"></i>';
            }
            messageElement.appendChild(avatarElement);
            
            // 创建消息内容包装器
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'message-content-wrapper';
            
            // 创建发送者名称
            const senderName = document.createElement('div');
            senderName.className = 'message-sender-name';
            if (role === 'user') {
                senderName.textContent = '我';
            } else if (role === 'ai') {
                senderName.textContent = 'AI助手';
            } else if (role === 'system') {
                senderName.textContent = '系统';
            }
            contentWrapper.appendChild(senderName);
            
            // 创建消息气泡
            const messageBubble = document.createElement('div');
            messageBubble.className = 'message-bubble';
            
            // 创建内容容器
            const contentElement = document.createElement('div');
            contentElement.className = 'message-content';
            
            // 使用renderMarkdown处理内容，如果没有renderMarkdown则使用简单的换行处理
            let formattedContent;
            if (this.renderMarkdown) {
                formattedContent = this.renderMarkdown(content);
            } else {
                // 简单的换行处理
                formattedContent = content;
                if (content.includes('\n')) {
                    // 移除开头和结尾的空白字符
                    formattedContent = content.trim();
                    
                    // 将连续的换行符（包括空白字符）替换为单个换行符
                    formattedContent = formattedContent.replace(/\n\s*\n+/g, '\n');
                    
                    // 移除行首和行尾的空白字符
                    formattedContent = formattedContent.replace(/^\s+|\s+$/gm, '');
                    
                    // 将单个换行符替换为<br>，但保持段落结构
                    formattedContent = formattedContent.replace(/\n/g, '<br>');
                    
                    // 清理可能产生的连续<br>标签
                    formattedContent = formattedContent.replace(/<br>\s*<br>/g, '<br>');
                    formattedContent = formattedContent.replace(/<br>\s*<br>\s*<br>/g, '<br>');
                }
            }
            contentElement.innerHTML = formattedContent;
            messageBubble.appendChild(contentElement);
            
            // 创建时间戳（放在消息上方）
            const timestamp = new Date();
            
            // 使用时间管理器处理时间显示
            if (window.timeManager) {
                window.timeManager.handleMessageTime(messageElement, timestamp, messagesContainer);
            } else {
                // 降级处理 - 显示时间在消息上方
                const timeElement = document.createElement('div');
                timeElement.className = 'message-time';
                timeElement.textContent = timestamp.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                messagesContainer.appendChild(timeElement);
            }
            
            contentWrapper.appendChild(messageBubble);
            messageElement.appendChild(contentWrapper);
            
            messagesContainer.appendChild(messageElement);
            
            // 确保滚动到底部，使用setTimeout确保DOM更新完成
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                this.updateScrollToBottomButton();
            }, 100);
        }
    }

    addToHistory(role, content, timestamp) {

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
    async clearConversation() {
        try {
            const confirmed = await this.showClearCurrentConversationConfirmation();
            if (!confirmed) return;

            const messagesContainer = document.getElementById('messages-container');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
            }
            this.showNotification('✅ 当前对话已清空', 'success');
        } catch (error) {
            console.error('清空对话失败:', error);
            this.showNotification('❌ 清空对话失败', 'error');
        }
    }

    /**
     * 显示清空当前对话确认对话框
     */
    async showClearCurrentConversationConfirmation() {
        return new Promise((resolve) => {
            const messagesContainer = document.getElementById('messages-container');
            const messageCount = messagesContainer ? messagesContainer.children.length : 0;
            
            // 计算总字数
            let totalWords = 0;
            if (messagesContainer) {
                const messageElements = messagesContainer.querySelectorAll('.message-content');
                messageElements.forEach(element => {
                    const text = element.textContent || element.innerText || '';
                    totalWords += text.length;
                });
            }
            
            // 获取当前时间
            const now = new Date();
            const currentTime = now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const modalContent = `
                <div class="clear-current-confirmation">
                    <div class="clear-current-warning">
                        <div class="delete-warning-header">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>清空当前对话</h3>
                        </div>
                        <p>您确定要清空当前对话吗？此操作不可撤销。</p>
                    </div>
                    
                    <div class="clear-current-info">
                        <div class="info-card">
                            <div class="info-header">
                                <i class="fas fa-comments"></i>
                                <span>当前对话信息</span>
                            </div>
                            <div class="info-content">
                                <div class="info-item">
                                    <i class="fas fa-comment-dots"></i>
                                    <span>${messageCount} 条消息</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-file-text"></i>
                                    <span>${totalWords} 字</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-clock"></i>
                                    <span>${currentTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="clear-current-actions">
                        <button class="clear-current-btn cancel-btn" data-action="cancel">
                            <i class="fas fa-times"></i>
                            取消
                        </button>
                        <button class="clear-current-btn confirm-btn" data-action="confirm">
                            <i class="fas fa-trash"></i>
                            确认清空
                        </button>
                    </div>
                </div>
            `;

            const modal = this.createModal('清空当前对话', modalContent);
            
            // 绑定按钮事件
            modal.querySelectorAll('.clear-current-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.closeModal(modal);
                    resolve(action === 'confirm');
                });
            });
        });
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
    
    // 打开对话历史
    openConversationHistory() {
        try {
            if (window.conversationUIManager) {
                window.conversationUIManager.openPanel();
            } else {
                this.showNotification('对话历史管理器未初始化', 'error');
            }
        } catch (error) {
            console.error('打开对话历史失败:', error);
            this.showNotification('打开对话历史失败', 'error');
        }
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
