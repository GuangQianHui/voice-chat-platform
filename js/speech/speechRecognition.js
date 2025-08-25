/**
 * 语音识别系统 - 优化版
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

            // 优化配置参数
            this.recognition.lang = 'zh-CN';
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            // 绑定事件处理器
            this.bindEvents();

            console.log('语音识别系统初始化成功');
        } catch (error) {
            console.error('语音识别系统初始化失败:', error);
        }
    }

    /**
     * 绑定事件处理器 - 简化版
     */
    bindEvents() {
        if (!this.recognition) return;

        // 开始识别
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateUI('listening');
            
            // 快速停止AI语音
            this.stopAIVoice();
            
            // 隐藏之前的结果显示
            this.hideVoiceResult();
            
            if (this.onStartCallback) {
                this.onStartCallback();
            }
        };

        // 识别结果 - 优化处理逻辑
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

            // 如果有最终结果，立即处理并停止识别
            if (finalTranscript) {
                console.log('获得最终识别结果:', finalTranscript);
                this.showFinalResult(finalTranscript);
                
                // 立即停止语音识别
                this.recognition.stop();
                console.log('已调用recognition.stop()');
                
                if (this.onResultCallback) {
                    this.onResultCallback(finalTranscript);
                }
            }
        };

        // 识别结束
        this.recognition.onend = () => {
            console.log('语音识别结束事件触发');
            this.isListening = false;
            this.updateUI('idle');
            this.hideRecognitionStatus();
            
            // 隐藏语音结果显示
            this.hideVoiceResult();
            
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };

        // 识别错误 - 简化错误处理
        this.recognition.onerror = (event) => {
            this.isListening = false;
            this.updateUI('idle');
            this.hideRecognitionStatus();
            this.hideVoiceResult();
            
            console.error('语音识别错误:', event.error);
            
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };
    }

    /**
     * 快速停止AI语音
     */
    stopAIVoice() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        
        if (window.naturalSpeechSynthesis && window.naturalSpeechSynthesis.stop) {
            window.naturalSpeechSynthesis.stop();
        }
        
        if (window.speechConflictManager && window.speechConflictManager.stopAISpeech) {
            window.speechConflictManager.stopAISpeech();
        }
    }

    /**
     * 开始语音识别 - 优化版
     */
    start() {
        if (!this.recognition) {
            return false;
        }

        if (this.isListening) {
            return false;
        }

        try {
            // 快速停止AI语音
            this.stopAIVoice();
            
            this.recognition.start();
            this.showRecognitionStatus();
            return true;
        } catch (error) {
            console.error('启动语音识别失败:', error);
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
        if (statusElement) {
            statusElement.classList.remove('hidden');
            console.log('显示识别状态');
        }
    }

    /**
     * 隐藏识别状态
     */
    hideRecognitionStatus() {
        const statusElement = document.getElementById('recognition-status');
        if (statusElement) {
            statusElement.classList.add('hidden');
            console.log('隐藏识别状态显示');
        }
    }

    /**
     * 隐藏语音结果显示
     */
    hideVoiceResult() {
        const resultElement = document.getElementById('voice-result');
        if (resultElement) {
            resultElement.classList.add('hidden');
            console.log('隐藏语音结果显示');
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
            transcriptElement.textContent = transcript.trim();
            resultElement.classList.remove('hidden');
        }
    }

    /**
     * 更新UI状态 - 简化版
     */
    updateUI(state) {
        const micBtn = document.getElementById('mic-btn');
        const micIcon = document.getElementById('mic-icon');

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
