class SystemMonitor {
    constructor() {
        this.metrics = {
            performance: {},
            errors: [],
            warnings: [],
            systemStatus: 'idle'
        };
        this.startTime = Date.now();
        this.init();
    }

    init() {
        this.startMonitoring();
        this.setupErrorHandling();
    }

    startMonitoring() {
        // 监控系统性能
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);

        // 监控内存使用
        if ('memory' in performance) {
            setInterval(() => {
                this.updateMemoryMetrics();
            }, 10000);
        }

        // 监控网络状态
        this.monitorNetworkStatus();
    }

    updatePerformanceMetrics() {
        const now = Date.now();
        const navigation = performance.getEntriesByType('navigation')[0];
        
        this.metrics.performance = {
            uptime: now - this.startTime,
            loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
        };
    }

    updateMemoryMetrics() {
        if ('memory' in performance) {
            this.metrics.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
    }

    monitorNetworkStatus() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };

            connection.addEventListener('change', () => {
                this.updateNetworkStatus();
            });
        }
    }

    updateNetworkStatus() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.metrics.network = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return firstContentfulPaint ? firstContentfulPaint.startTime : 0;
    }

    setupErrorHandling() {
        // 捕获JavaScript错误
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason
            });
        });

        // 捕获资源加载错误
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError('Resource Load Error', {
                    type: event.target.tagName,
                    src: event.target.src || event.target.href,
                    message: event.message
                });
            }
        }, true);
    }

    logError(type, details) {
        const error = {
            type: type,
            details: details,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.metrics.errors.push(error);
        console.error('System Error:', error);

        // 限制错误日志数量
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-50);
        }
    }

    logWarning(message, details = {}) {
        const warning = {
            message: message,
            details: details,
            timestamp: new Date().toISOString()
        };

        this.metrics.warnings.push(warning);
        console.warn('System Warning:', warning);

        // 限制警告日志数量
        if (this.metrics.warnings.length > 50) {
            this.metrics.warnings = this.metrics.warnings.slice(-25);
        }
    }

    setSystemStatus(status) {
        this.metrics.systemStatus = status;
        console.log('System Status:', status);
    }

    getMetrics() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString()
        };
    }

    getSystemHealth() {
        const health = {
            status: 'healthy',
            issues: []
        };

        // 检查错误数量
        if (this.metrics.errors.length > 10) {
            health.status = 'warning';
            health.issues.push(`Too many errors: ${this.metrics.errors.length}`);
        }

        // 检查内存使用
        if (this.metrics.memory) {
            const memoryUsage = this.metrics.memory.usedJSHeapSize / this.metrics.memory.jsHeapSizeLimit;
            if (memoryUsage > 0.8) {
                health.status = 'warning';
                health.issues.push(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
            }
        }

        // 检查网络状态
        if (this.metrics.network && this.metrics.network.effectiveType === 'slow-2g') {
            health.status = 'warning';
            health.issues.push('Slow network connection');
        }

        return health;
    }

    generateReport() {
        const health = this.getSystemHealth();
        const uptime = Date.now() - this.startTime;
        
        return {
            summary: {
                status: health.status,
                uptime: this.formatUptime(uptime),
                errors: this.metrics.errors.length,
                warnings: this.metrics.warnings.length
            },
            performance: this.metrics.performance,
            memory: this.metrics.memory,
            network: this.metrics.network,
            issues: health.issues,
            recentErrors: this.metrics.errors.slice(-5),
            recentWarnings: this.metrics.warnings.slice(-5)
        };
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes % 60}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    reset() {
        this.metrics.errors = [];
        this.metrics.warnings = [];
        this.startTime = Date.now();
    }
}
