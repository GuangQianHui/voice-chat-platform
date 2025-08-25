/**
 * 音频管理系统
 * 音频上下文管理、实时音频监测和可视化
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.gainNode = null;
        this.compressorNode = null;
        this.noiseFilterNode = null;
        this.biquadFilterNodes = [];
        this.convolverNode = null;
        this.isInitialized = false;
        this.isMonitoring = false;
        
        this.init();
    }

    /**
     * 初始化音频上下文
     */
    async init() {
        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建音频分析器
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // 创建音频处理节点
            this.createAudioNodes();
            
            // 连接音频节点
            this.connectAudioNodes();
            
            this.isInitialized = true;
            console.log('音频管理系统初始化成功');
        } catch (error) {
            console.error('音频管理系统初始化失败:', error);
        }
    }

    /**
     * 创建音频处理节点
     */
    createAudioNodes() {
        // 增益节点
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;
        
        // 压缩器节点
        this.compressorNode = this.audioContext.createDynamicsCompressor();
        this.compressorNode.threshold.value = -24;
        this.compressorNode.knee.value = 30;
        this.compressorNode.ratio.value = 12;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;
        
        // 噪音过滤器（高通滤波器）
        this.noiseFilterNode = this.audioContext.createBiquadFilter();
        this.noiseFilterNode.type = 'highpass';
        this.noiseFilterNode.frequency.value = 80;
        this.noiseFilterNode.Q.value = 1;
        
        // 均衡器节点
        this.createEqualizer();
        
        // 混响节点
        this.convolverNode = this.audioContext.createConvolver();
        this.createReverb();
    }

    /**
     * 创建均衡器
     */
    createEqualizer() {
        const frequencies = [60, 170, 350, 1000, 3500, 10000];
        const gains = [0, 0, 0, 0, 0, 0];
        const Qs = [1, 1, 1, 1, 1, 1];
        
        frequencies.forEach((freq, index) => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.gain.value = gains[index];
            filter.Q.value = Qs[index];
            this.biquadFilterNodes.push(filter);
        });
    }

    /**
     * 创建混响效果
     */
    createReverb() {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 2; // 2秒混响
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        this.convolverNode.buffer = impulse;
    }

    /**
     * 连接音频节点
     */
    connectAudioNodes() {
        if (!this.analyser) return;
        
        // 连接音频处理链
        let currentNode = this.analyser;
        
        // 增益节点
        currentNode.connect(this.gainNode);
        currentNode = this.gainNode;
        
        // 压缩器
        currentNode.connect(this.compressorNode);
        currentNode = this.compressorNode;
        
        // 噪音过滤器
        currentNode.connect(this.noiseFilterNode);
        currentNode = this.noiseFilterNode;
        
        // 均衡器
        this.biquadFilterNodes.forEach(filter => {
            currentNode.connect(filter);
            currentNode = filter;
        });
        
        // 混响
        currentNode.connect(this.convolverNode);
        currentNode = this.convolverNode;
        
        // 输出到音频上下文
        currentNode.connect(this.audioContext.destination);
    }

    /**
     * 获取麦克风权限并开始监测
     */
    async startMonitoring() {
        if (!this.isInitialized) {
            console.error('音频管理系统未初始化');
            return false;
        }

        try {
            // 获取麦克风权限
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // 创建麦克风源
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.isMonitoring = true;
            console.log('音频监测开始');
            return true;
        } catch (error) {
            console.error('启动音频监测失败:', error);
            return false;
        }
    }

    /**
     * 停止音频监测
     */
    stopMonitoring() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        this.isMonitoring = false;
        console.log('音频监测停止');
    }

    /**
     * 获取音频数据
     */
    getAudioData() {
        if (!this.analyser || !this.isMonitoring) {
            return null;
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        return dataArray;
    }

    /**
     * 获取音量级别
     */
    getVolumeLevel() {
        if (!this.analyser || !this.isMonitoring) {
            return 0;
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        // 计算平均音量
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        return average / 255; // 归一化到0-1
    }

    /**
     * 设置增益
     */
    setGain(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = Math.max(0, Math.min(2, value));
        }
    }

    /**
     * 设置压缩器参数
     */
    setCompressorSettings(settings) {
        if (!this.compressorNode) return;
        
        if (settings.threshold !== undefined) {
            this.compressorNode.threshold.value = settings.threshold;
        }
        if (settings.ratio !== undefined) {
            this.compressorNode.ratio.value = settings.ratio;
        }
        if (settings.attack !== undefined) {
            this.compressorNode.attack.value = settings.attack;
        }
        if (settings.release !== undefined) {
            this.compressorNode.release.value = settings.release;
        }
    }

    /**
     * 设置均衡器
     */
    setEqualizer(band, gain) {
        if (this.biquadFilterNodes[band]) {
            this.biquadFilterNodes[band].gain.value = gain;
        }
    }

    /**
     * 创建音频可视化
     */
    createVisualization(canvas) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const draw = () => {
            if (!this.isMonitoring) return;
            
            const audioData = this.getAudioData();
            if (!audioData) return;
            
            // 清除画布
            ctx.clearRect(0, 0, width, height);
            
            // 绘制频谱
            const barWidth = width / audioData.length;
            const barHeight = height / 255;
            
            ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
            
            for (let i = 0; i < audioData.length; i++) {
                const barHeightValue = audioData[i] * barHeight;
                ctx.fillRect(
                    i * barWidth,
                    height - barHeightValue,
                    barWidth - 1,
                    barHeightValue
                );
            }
            
            requestAnimationFrame(draw);
        };
        
        draw();
    }

    /**
     * 检测语音活动
     */
    detectVoiceActivity(threshold = 0.1) {
        const volume = this.getVolumeLevel();
        return volume > threshold;
    }

    /**
     * 获取音频设备列表
     */
    async getAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('获取音频设备失败:', error);
            return [];
        }
    }

    /**
     * 切换音频设备
     */
    async switchAudioDevice(deviceId) {
        if (this.isMonitoring) {
            this.stopMonitoring();
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.isMonitoring = true;
            
            return true;
        } catch (error) {
            console.error('切换音频设备失败:', error);
            return false;
        }
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopMonitoring();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isInitialized = false;
        this.isMonitoring = false;
    }

    /**
     * 检查是否支持音频API
     */
    isSupported() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    /**
     * 获取音频上下文状态
     */
    getContextState() {
        return this.audioContext ? this.audioContext.state : 'closed';
    }
}

// 导出类
window.AudioManager = AudioManager;
