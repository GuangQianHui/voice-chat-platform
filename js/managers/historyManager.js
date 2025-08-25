/**
 * 历史记录管理器（简化版）
 * 只负责当前对话内容显示
 */
class HistoryManager {
    constructor() {
        this.currentMessages = [];
        this.isLoading = false;
        this.isRestoring = false;
        
        this.init();
    }

    init() {
        this.isLoading = true;
        
        // 延迟设置，确保DOM完全加载
        setTimeout(() => {
            this.isLoading = false;
            
            // 等待对话历史记录管理器初始化完成后，尝试恢复对话
            this.waitForConversationManager();
        }, 100);
    }

    /**
     * 等待对话历史记录管理器初始化
     */
    async waitForConversationManager() {
        return new Promise((resolve) => {
            const checkManager = () => {
                if (window.conversationHistoryManager && !window.conversationHistoryManager.isLoading) {
                    // 恢复当前对话的消息
                    this.restoreCurrentConversation();
                    resolve();
                } else {
                    setTimeout(checkManager, 100);
                }
            };
            checkManager();
        });
    }

    /**
     * 恢复当前对话
     */
    restoreCurrentConversation() {
        if (window.conversationHistoryManager) {
            const currentConversation = window.conversationHistoryManager.getCurrentConversation();
            if (currentConversation && currentConversation.messages.length > 0) {
                this.isRestoring = true;
                
                // 清空当前显示
                this.clearCurrentMessages();
                
                // 恢复所有消息
                currentConversation.messages.forEach(message => {
                    this.currentMessages.push(message);
                    this.displayMessage(message);
                });
                
                console.log(`恢复了 ${currentConversation.messages.length} 条消息`);
                
                this.isRestoring = false;
            }
        }
    }

    addMessage(role, content, metadata = {}) {
        const message = {
            id: this.generateMessageId(),
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        this.currentMessages.push(message);
        this.displayMessage(message);
        
        // 同步到对话历史记录管理器（避免在恢复对话时重复保存）
        if (window.conversationHistoryManager && !this.isRestoring) {
            window.conversationHistoryManager.addMessage(role, content, metadata);
        }
        
        return message;
    }

    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messages-container');
        if (!messagesContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        // 创建消息头像
        const avatarElement = document.createElement('div');
        avatarElement.className = 'message-avatar';
        
        // 根据角色设置头像内容
        if (message.role === 'user') {
            avatarElement.innerHTML = '<i class="fas fa-user-circle"></i>';
        } else if (message.role === 'ai') {
            avatarElement.innerHTML = ''; // AI头像使用背景图片，不需要图标
        } else if (message.role === 'system') {
            avatarElement.innerHTML = '<i class="fas fa-microchip"></i>';
        }
        messageElement.appendChild(avatarElement);
        
        // 创建消息内容包装器
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'message-content-wrapper';
        
        // 创建发送者名称
        const senderName = document.createElement('div');
        senderName.className = 'message-sender-name';
        if (message.role === 'user') {
            senderName.textContent = '我';
        } else if (message.role === 'ai') {
            senderName.textContent = 'AI助手';
        } else if (message.role === 'system') {
            senderName.textContent = '系统';
        }
        contentWrapper.appendChild(senderName);
        
        // 创建消息气泡
        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';
        
        // 为AI消息添加停止语音按钮
        if (message.role === 'ai') {
            const stopVoiceBtn = document.createElement('button');
            stopVoiceBtn.className = 'stop-voice-btn';
            
            // 根据当前语音播放状态设置按钮图标和提示信息
            const isSpeaking = this.isVoicePlaying();
            if (isSpeaking) {
                // 正在播放时显示静音图标，表示可以停止
                stopVoiceBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                stopVoiceBtn.title = '点击停止AI语音播放 (Ctrl+Shift+S)';
                stopVoiceBtn.setAttribute('aria-label', '停止AI语音播放');
                stopVoiceBtn.classList.remove('stopped');
            } else {
                // 已停止时显示音量图标，表示可以重新播放
                stopVoiceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                stopVoiceBtn.title = 'AI语音已停止，点击重新播放';
                stopVoiceBtn.setAttribute('aria-label', '重新播放AI语音');
                stopVoiceBtn.classList.add('stopped');
            }
            
            stopVoiceBtn.setAttribute('data-message-id', message.id || Date.now());
            
            // 添加点击事件
            stopVoiceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = message.id || stopVoiceBtn.getAttribute('data-message-id');
                const isCurrentlySpeaking = this.isVoicePlaying();
                
                if (isCurrentlySpeaking) {
                    // 如果正在播放，则停止
                    this.stopVoicePlayback(messageId);
                } else {
                    // 如果已停止，则重新播放
                    this.replayVoiceMessage(messageId, message.content);
                }
            });
            
            // 添加悬停提示增强
            stopVoiceBtn.addEventListener('mouseenter', (e) => {
                this.showVoiceButtonTooltip(e.target, isSpeaking);
            });
            
            stopVoiceBtn.addEventListener('mouseleave', () => {
                this.hideVoiceButtonTooltip();
            });
            
            messageBubble.appendChild(stopVoiceBtn);
        }
        
        // 创建内容容器
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        
        // 渲染Markdown格式
        const formattedContent = this.renderMarkdown(message.content);
        contentElement.innerHTML = formattedContent;
        messageBubble.appendChild(contentElement);
        
        // 使用时间管理器处理时间显示（时间显示在消息上方）
        if (window.timeManager) {
            window.timeManager.handleMessageTime(messageElement, new Date(message.timestamp), messagesContainer);
        } else {
            // 降级处理 - 显示时间在消息上方
            const timeElement = document.createElement('div');
            timeElement.className = 'message-time';
            timeElement.textContent = this.formatTime(message.timestamp);
            messagesContainer.appendChild(timeElement);
        }

        // 添加消息状态指示器（可选）
        if (message.status) {
            const statusElement = document.createElement('div');
            statusElement.className = 'message-status';
            messageBubble.appendChild(statusElement);
        }

        contentWrapper.appendChild(messageBubble);
        messageElement.appendChild(contentWrapper);
        messagesContainer.appendChild(messageElement);
        
        // 自动滚动到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        
        // 恢复图片URL并转换为HTML（确保URL不被转义）
        imageUrls.forEach((image, index) => {
            // 确保URL是原始格式，不被转义
            const imgHtml = `<img src="${image.url}" alt="${image.alt}" style="max-width: 100%; height: auto;">`;
            html = html.replace(`__IMAGE_${index}__`, imgHtml);
        });
        
        // 处理代码块 ```
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 处理行内代码 `code`
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
                    // 处理粗体 **text** 和 __text__（但排除图片URL中的内容）
            html = html.replace(/\*\*(.*?)\*\*/g, (match, content) => {
                // 检查是否在图片URL中
                if (match.includes('![') || match.includes('](')) {
                    return match; // 保持原样
                }
                return `<strong>${content}</strong>`;
            });
            // 只处理单词边界内的双下划线，避免影响URL中的下划线
            html = html.replace(/\b__([^_]+)__\b/g, '<strong>$1</strong>');
            
            // 处理斜体 *text* 和 _text_（但排除图片URL中的内容）
            html = html.replace(/\*(.*?)\*/g, (match, content) => {
                // 检查是否在图片URL中
                if (match.includes('![') || match.includes('](')) {
                    return match; // 保持原样
                }
                return `<em>${content}</em>`;
            });
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
        
        // 处理列表 - 先处理多行列表
        const lines = html.split('\n');
        const processedLines = [];
        let inList = false;
        let listType = '';
        let listItems = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检查是否是无序列表项
            const ulMatch = line.match(/^[\s]*[\*\-\+•] (.+)$/);
            // 检查是否是有序列表项
            const olMatch = line.match(/^[\s]*\d+\. (.+)$/);
            
            if (ulMatch || olMatch) {
                const itemText = ulMatch ? ulMatch[1] : olMatch[1];
                const currentType = ulMatch ? 'ul' : 'ol';
                
                if (!inList || listType !== currentType) {
                    // 结束之前的列表
                    if (inList && listItems.length > 0) {
                        const listHtml = `<${listType}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listType}>`;
                        processedLines.push(listHtml);
                        listItems = [];
                    }
                    // 开始新列表
                    inList = true;
                    listType = currentType;
                }
                listItems.push(itemText);
            } else {
                // 结束列表
                if (inList && listItems.length > 0) {
                    const listHtml = `<${listType}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listType}>`;
                    processedLines.push(listHtml);
                    listItems = [];
                    inList = false;
                }
                processedLines.push(line);
            }
        }
        
        // 处理最后的列表
        if (inList && listItems.length > 0) {
            const listHtml = `<${listType}>${listItems.map(item => `<li>${item}</li>`).join('')}</${listType}>`;
            processedLines.push(listHtml);
        }
        
        html = processedLines.join('\n');
        
        // 彻底优化换行处理，完全消除空白行
        // 先处理段落分隔（双换行）
        html = html.replace(/\n\s*\n+/g, '</p><p>');
        
        // 移除行首和行尾的空白字符
        html = html.replace(/^\s+|\s+$/gm, '');
        
        // 再处理单换行，但避免在段落标签内产生过多空白
        html = html.replace(/\n/g, '<br>');
        
        // 清理可能产生的多余空白
        html = html.replace(/<br>\s*<br>/g, '<br>');
        html = html.replace(/<br>\s*<br>\s*<br>/g, '<br>');
        html = html.replace(/<p>\s*<br>\s*<\/p>/g, '<p></p>');
        html = html.replace(/<p>\s*<\/p>/g, '');
        
        // 包装段落
        if (html && !html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        
        // 清理多余的p标签
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ol>)/g, '$1');
        html = html.replace(/(<\/ol>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
        
        return html;
    }

    /**
     * 停止语音播放
     */
    stopVoicePlayback(messageId) {
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
        if (window.app && window.app.updateDigitalHumanState) {
            window.app.updateDigitalHumanState('idle');
        }
        
        // 更新按钮状态
        const stopBtn = document.querySelector(`[data-message-id="${messageId}"]`);
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            stopBtn.title = 'AI语音已停止，点击重新播放';
            stopBtn.setAttribute('aria-label', '重新播放AI语音');
            stopBtn.classList.add('stopped');
        }
        
        // 更新所有按钮状态
        this.updateStopVoiceButtons();
    }

    /**
     * 重新播放语音消息
     */
    replayVoiceMessage(messageId, content) {
        // 停止当前播放
        this.stopVoicePlayback(messageId);
        
        // 短暂延迟后重新播放
        setTimeout(() => {
            // 使用主应用的语音播放功能
            if (window.app && window.app.speakResponse) {
                window.app.speakResponse(content);
            } else if (window.speechSynthesis) {
                // 降级到直接使用语音合成
                const utterance = new SpeechSynthesisUtterance(content);
                utterance.lang = 'zh-CN';
                window.speechSynthesis.speak(utterance);
            }
            
            // 更新数字人状态
            if (window.app && window.app.updateDigitalHumanState) {
                window.app.updateDigitalHumanState('speaking');
            }
            
            // 更新按钮状态
            const stopBtn = document.querySelector(`[data-message-id="${messageId}"]`);
            if (stopBtn) {
                stopBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                stopBtn.title = '点击停止AI语音播放 (Ctrl+Shift+S)';
                stopBtn.setAttribute('aria-label', '停止AI语音播放');
                stopBtn.classList.remove('stopped');
            }
            
            // 更新所有按钮状态
            this.updateStopVoiceButtons();
            
            console.log('语音重新播放开始');
        }, 100);
    }

    /**
     * 更新所有停止语音按钮的状态
     */
    updateStopVoiceButtons() {
        const stopButtons = document.querySelectorAll('.stop-voice-btn');
        const isSpeaking = this.isVoicePlaying();
        
        stopButtons.forEach(btn => {
            if (isSpeaking) {
                btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
                btn.title = '点击停止AI语音播放 (Ctrl+Shift+S)';
                btn.setAttribute('aria-label', '停止AI语音播放');
                btn.classList.remove('stopped');
            } else {
                btn.innerHTML = '<i class="fas fa-volume-up"></i>';
                btn.title = 'AI语音已停止，点击重新播放';
                btn.setAttribute('aria-label', '重新播放AI语音');
                btn.classList.add('stopped');
            }
        });
    }

    /**
     * 检查是否有语音正在播放
     */
    isVoicePlaying() {
        // 检查语音合成是否正在播放
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            return true;
        }
        
        // 检查自然语音合成是否正在播放
        if (window.naturalSpeechSynthesis && window.naturalSpeechSynthesis.isActive && window.naturalSpeechSynthesis.isActive()) {
            return true;
        }
        
        // 检查语音冲突管理器状态
        if (window.speechConflictManager && window.speechConflictManager.isAISpeaking && window.speechConflictManager.isAISpeaking()) {
            return true;
        }
        
        return false;
    }

    /**
     * 显示语音按钮工具提示
     */
    showVoiceButtonTooltip(button, isSpeaking) {
        // 移除现有的工具提示
        this.hideVoiceButtonTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'voice-button-tooltip';
        tooltip.id = 'voice-button-tooltip';
        
        if (isSpeaking) {
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <i class="fas fa-volume-mute"></i>
                    <span>停止AI语音播放</span>
                    <div class="tooltip-shortcut">快捷键: Ctrl+Shift+S</div>
                </div>
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <i class="fas fa-volume-up"></i>
                    <span>重新播放AI语音</span>
                    <div class="tooltip-status">点击重新播放此消息</div>
                </div>
            `;
        }
        
        document.body.appendChild(tooltip);
        
        // 计算位置
        const buttonRect = button.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // 将工具提示定位到按钮上方
        tooltip.style.left = `${buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2}px`;
        tooltip.style.top = `${buttonRect.top - tooltipRect.height - 10}px`;
        
        // 添加显示动画
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
    }

    /**
     * 隐藏语音按钮工具提示
     */
    hideVoiceButtonTooltip() {
        const existingTooltip = document.getElementById('voice-button-tooltip');
        if (existingTooltip) {
            existingTooltip.classList.remove('show');
            setTimeout(() => {
                if (existingTooltip.parentNode) {
                    existingTooltip.parentNode.removeChild(existingTooltip);
                }
            }, 200);
        }
    }

    // 清空当前对话内容
    clearCurrentMessages() {
        this.currentMessages = [];
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
    }

    // 获取当前消息数量
    getCurrentMessageCount() {
        return this.currentMessages.length;
    }
}

// 等待DOM完全加载后再初始化历史记录管理器
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
});