/**
 * 语音冲突管理系统
 * 防止用户说话时AI同时说话，智能语音优先级管理
 */
class SpeechConflictManager {
    constructor() {
        this.isUserSpeaking = false;
        this.isAISpeaking = false;
        this.pendingAISpeech = null;
        this.userSpeechTimeout = null;
        this.aiSpeechDelay = 2000; // 2秒延迟
        this.userSpeechThreshold = 1000; // 1秒阈值
        
        this.init();
    }

    /**
     * 初始化冲突管理器
     */
    init() {
        console.log('语音冲突管理系统初始化成功');
    }

    /**
     * 检测用户开始说话 - 优化版
     */
    onUserSpeechStart() {
        this.isUserSpeaking = true;
        
        // 清除之前的超时
        if (this.userSpeechTimeout) {
            clearTimeout(this.userSpeechTimeout);
        }
        
        // 如果AI正在说话，立即停止AI语音
        if (this.isAISpeaking) {
            this.stopAISpeech();
        }
    }

    /**
     * 检测用户停止说话 - 优化版
     */
    onUserSpeechEnd() {
        // 延迟检测，避免误判
        this.userSpeechTimeout = setTimeout(() => {
            this.isUserSpeaking = false;
            
            // 如果有待播放的AI语音，延迟播放
            if (this.pendingAISpeech) {
                this.delayAISpeech(this.pendingAISpeech, this.aiSpeechDelay);
                this.pendingAISpeech = null;
            }
        }, this.userSpeechThreshold);
    }

    /**
     * AI开始说话 - 优化版
     */
    onAISpeechStart() {
        this.isAISpeaking = true;
    }

    /**
     * AI停止说话 - 优化版
     */
    onAISpeechEnd() {
        this.isAISpeaking = false;
    }

    /**
     * 请求AI语音播放
     */
    requestAISpeech(utterance, callback) {
        if (this.isUserSpeaking) {
            // 用户正在说话，延迟AI语音
            this.delayAISpeech(utterance, this.aiSpeechDelay);
            this.pendingAISpeech = { utterance, callback };
            return false;
        } else {
            // 直接播放AI语音
            this.playAISpeech(utterance, callback);
            return true;
        }
    }

    /**
     * 延迟播放AI语音
     */
    delayAISpeech(utterance, delay) {
        console.log(`延迟${delay}ms播放AI语音`);
        
        setTimeout(() => {
            if (!this.isUserSpeaking) {
                this.playAISpeech(utterance.utterance, utterance.callback);
            } else {
                // 用户仍在说话，继续延迟
                this.delayAISpeech(utterance, this.aiSpeechDelay);
            }
        }, delay);
    }

    /**
     * 播放AI语音
     */
    playAISpeech(utterance, callback) {
        if (this.isUserSpeaking) {
            console.log('用户正在说话，取消AI语音播放');
            return;
        }
        
        this.onAISpeechStart();
        
        if (callback) {
            callback();
        }
        
        // 监听语音结束事件
        if (utterance && utterance.onend) {
            const originalOnEnd = utterance.onend;
            utterance.onend = (event) => {
                this.onAISpeechEnd();
                if (originalOnEnd) {
                    originalOnEnd(event);
                }
            };
        }
    }

    /**
     * 停止AI语音 - 优化版
     */
    stopAISpeech() {
        if (this.isAISpeaking) {
            // 快速停止所有语音
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            
            if (window.naturalSpeechSynthesis && window.naturalSpeechSynthesis.stop) {
                window.naturalSpeechSynthesis.stop();
            }
            
            // 清除待播放的语音
            this.pendingAISpeech = null;
            
            // 更新状态
            this.onAISpeechEnd();
        }
    }

    /**
     * 设置用户说话阈值
     */
    setUserSpeechThreshold(threshold) {
        this.userSpeechThreshold = threshold;
    }

    /**
     * 设置AI语音延迟
     */
    setAISpeechDelay(delay) {
        this.aiSpeechDelay = delay;
    }

    /**
     * 获取当前状态
     */
    getStatus() {
        return {
            isUserSpeaking: this.isUserSpeaking,
            isAISpeaking: this.isAISpeaking,
            hasPendingAISpeech: !!this.pendingAISpeech
        };
    }

    /**
     * 重置状态
     */
    reset() {
        this.isUserSpeaking = false;
        this.isAISpeaking = false;
        this.pendingAISpeech = null;
        
        if (this.userSpeechTimeout) {
            clearTimeout(this.userSpeechTimeout);
            this.userSpeechTimeout = null;
        }
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.reset();
        console.log('语音冲突管理系统已销毁');
    }
}

// 导出类
window.SpeechConflictManager = SpeechConflictManager;
