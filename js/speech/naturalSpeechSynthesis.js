/**
 * 自然语音合成系统
 * 使用Web Speech API的SpeechSynthesisUtterance
 */
class NaturalSpeechSynthesis {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.utterance = null;
        this.isSpeaking = false;
        this.onStartCallback = null;
        this.onEndCallback = null;
        this.onErrorCallback = null;
        
        this.naturalSettings = {
            pitch: 1.0,
            rate: 0.85,
            volume: 0.9,
            lang: 'zh-CN'
        };
        
        this.init();
    }

    init() {
        if (!this.synthesis) {
            console.error('浏览器不支持语音合成功能');
            return;
        }

        this.synthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
        this.loadVoices();
        console.log('自然语音合成系统初始化成功');
    }

    loadVoices() {
        const voices = this.synthesis.getVoices();
        const chineseVoices = voices.filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('cmn')
        );
        if (chineseVoices.length > 0) {
            console.log('找到中文语音:', chineseVoices);
        }
    }

    speak(text, options = {}) {
        if (!this.synthesis || this.isSpeaking) {
            return false;
        }

        try {
            this.stop();
            this.utterance = new SpeechSynthesisUtterance(text);
            this.applySettings(this.utterance, options);
            this.bindEvents(this.utterance);
            this.synthesis.speak(this.utterance);
            this.isSpeaking = true;
            this.updateUI('speaking');
            return true;
        } catch (error) {
            console.error('语音合成失败:', error);
            return false;
        }
    }

    applySettings(utterance, customOptions = {}) {
        const settings = { ...this.naturalSettings, ...customOptions };
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;
        utterance.volume = settings.volume;
        utterance.lang = settings.lang;
        
        const voices = this.synthesis.getVoices();
        const chineseVoices = voices.filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('cmn')
        );
        if (chineseVoices.length > 0) {
            utterance.voice = chineseVoices[0];
        }
    }

    bindEvents(utterance) {
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateUI('speaking');
            if (this.onStartCallback) this.onStartCallback();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.updateUI('idle');
            if (this.onEndCallback) this.onEndCallback();
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.updateUI('idle');
            console.error('语音合成错误:', event.error);
            if (this.onErrorCallback) this.onErrorCallback(event.error);
        };
    }

    stop() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateUI('idle');
        }
    }

    updateUI(state) {
        const digitalHuman = document.getElementById('digital-human');
        const statusElement = document.getElementById('digital-human-status');

        if (digitalHuman) {
            digitalHuman.className = 'digital-human ' + state;
        }

        if (statusElement) {
            const states = {
                'idle': '准备就绪',
                'speaking': '正在说话',
                'thinking': '思考中'
            };
            statusElement.textContent = states[state] || '准备就绪';
        }
    }

    onStart(callback) { this.onStartCallback = callback; }
    onEnd(callback) { this.onEndCallback = callback; }
    onError(callback) { this.onErrorCallback = callback; }
    isActive() { return this.isSpeaking; }
}

window.NaturalSpeechSynthesis = NaturalSpeechSynthesis;

