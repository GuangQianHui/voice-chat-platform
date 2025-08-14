/**
 * 语音识别系统
 * 使用Web Speech API的SpeechRecognition接口
 * 支持实时语音识别和转录
 */
class SpeechRecognitionSystem {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;
        
        this.init();
    }

    /**
     * 初始化语音识别
     */
    init() {
        try {
            // 检查浏览器支持
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                throw new Error('浏览器不支持语音识别功能');
            }

            // 创建语音识别实例
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            // 配置语音识别参数
            this.recognition.lang = 'zh-CN';  // 中文识别
            this.recognition.continuous = false;  // 非连续模式
            this.recognition.interimResults = true;  // 实时结果
            this.recognition.maxAlternatives = 1;  // 最大候选结果数

            // 绑定事件处理器
            this.bindEvents();

            console.log('语音识别系统初始化成功');
        } catch (error) {
            console.error('语音识别系统初始化失败:', error);
            this.showError('语音识别功能不可用，请检查浏览器支持');
        }
    }

    /**
     * 绑定事件处理器
     */
    bindEvents() {
        if (!this.recognition) return;

        // 开始识别
        this.recognition.onstart = (event) => {
            console.log('语音识别开始');
            this.isListening = true;
            this.updateUI('listening');
            
            if (this.onStartCallback) {
                this.onStartCallback();
            }
        };

        // 识别结果
        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // 显示实时结果
            this.showInterimResult(interimTranscript);

            // 如果有最终结果
            if (finalTranscript) {
                this.showFinalResult(finalTranscript);
                
                if (this.onResultCallback) {
                    this.onResultCallback(finalTranscript);
                }
            }
        };

        // 识别结束
        this.recognition.onend = (event) => {
            console.log('语音识别结束');
            this.isListening = false;
            this.updateUI('idle');
            this.hideRecognitionStatus();
            
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };

        // 识别错误
        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.isListening = false;
            this.updateUI('idle');
            this.hideRecognitionStatus();
            
            let errorMessage = '语音识别出现错误';
            switch (event.error) {
                case 'no-speech':
                    errorMessage = '没有检测到语音，请重试';
                    break;
                case 'audio-capture':
                    errorMessage = '无法访问麦克风，请检查权限';
                    break;
                case 'not-allowed':
                    errorMessage = '麦克风权限被拒绝';
                    break;
                case 'network':
                    errorMessage = '网络连接错误';
                    break;
                case 'service-not-allowed':
                    errorMessage = '语音识别服务不可用';
                    break;
            }
            
            this.showError(errorMessage);
            
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };

        // 识别不可用
        this.recognition.onnomatch = (event) => {
            console.log('没有匹配的识别结果');
            this.showError('无法识别您的语音，请重试');
        };
    }

    /**
     * 开始语音识别
     */
    start() {
        if (!this.recognition) {
            this.showError('语音识别系统未初始化');
            return false;
        }

        if (this.isListening) {
            console.log('语音识别已在运行中');
            return false;
        }

        try {
            this.recognition.start();
            this.showRecognitionStatus();
            return true;
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.showError('启动语音识别失败');
            return false;
        }
    }

    /**
     * 停止语音识别
     */
    stop() {
        if (!this.recognition || !this.isListening) {
            return;
        }

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('停止语音识别失败:', error);
        }
    }

    /**
     * 显示识别状态
     */
    showRecognitionStatus() {
        const statusElement = document.getElementById('recognition-status');
        const resultElement = document.getElementById('voice-result');
        
        if (statusElement) {
            statusElement.classList.remove('hidden');
        }
        
        if (resultElement) {
            resultElement.classList.add('hidden');
        }
    }

    /**
     * 隐藏识别状态
     */
    hideRecognitionStatus() {
        const statusElement = document.getElementById('recognition-status');
        if (statusElement) {
            statusElement.classList.add('hidden');
        }
    }

    /**
     * 显示实时识别结果
     */
    showInterimResult(transcript) {
        const transcriptElement = document.getElementById('voice-transcript');
        if (transcriptElement) {
            transcriptElement.textContent = transcript;
        }
    }

    /**
     * 显示最终识别结果
     */
    showFinalResult(transcript) {
        const resultElement = document.getElementById('voice-result');
        const transcriptElement = document.getElementById('voice-transcript');
        
        if (resultElement && transcriptElement) {
            // 添加标点符号
            const processedTranscript = this.addPunctuation(transcript);
            transcriptElement.textContent = processedTranscript;
            resultElement.classList.remove('hidden');
        }
    }

    /**
     * 添加标点符号
     */
    addPunctuation(text) {
        // 简单的标点符号添加逻辑
        let processedText = text.trim();
        
        // 如果文本不以标点符号结尾，添加句号
        if (!/[。！？，；：""''（）【】]/.test(processedText.slice(-1))) {
            processedText += '。';
        }
        
        return processedText;
    }

    /**
     * 更新UI状态
     */
    updateUI(state) {
        const digitalHuman = document.getElementById('digital-human');
        const statusElement = document.getElementById('digital-human-status');
        const micBtn = document.getElementById('mic-btn');
        const micIcon = document.getElementById('mic-icon');

        if (digitalHuman) {
            digitalHuman.className = 'digital-human ' + state;
        }

        if (statusElement) {
            const states = {
                'idle': '准备就绪',
                'listening': '正在聆听',
                'speaking': '正在说话',
                'thinking': '思考中',
                'processing': '处理中'
            };
            statusElement.textContent = states[state] || '准备就绪';
        }

        if (micBtn && micIcon) {
            if (state === 'listening') {
                micBtn.classList.add('recording');
                micIcon.className = 'fas fa-stop text-xl';
            } else {
                micBtn.classList.remove('recording');
                micIcon.className = 'fas fa-microphone text-xl';
            }
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        console.error('语音识别错误:', message);
        
        // 创建错误提示元素
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-triangle mr-2"></i>
            ${message}
        `;
        
        // 插入到输入容器中
        const inputContainer = document.querySelector('.input-container');
        if (inputContainer) {
            inputContainer.appendChild(errorElement);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (errorElement.parentNode) {
                    errorElement.parentNode.removeChild(errorElement);
                }
            }, 3000);
        }
    }

    /**
     * 设置结果回调
     */
    onResult(callback) {
        this.onResultCallback = callback;
    }

    /**
     * 设置错误回调
     */
    onError(callback) {
        this.onErrorCallback = callback;
    }

    /**
     * 设置开始回调
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * 设置结束回调
     */
    onEnd(callback) {
        this.onEndCallback = callback;
    }

    /**
     * 检查是否正在监听
     */
    isActive() {
        return this.isListening;
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.recognition) {
            this.recognition.abort();
            this.recognition = null;
        }
        this.isListening = false;
    }
}

// 导出类
window.SpeechRecognitionSystem = SpeechRecognitionSystem;
