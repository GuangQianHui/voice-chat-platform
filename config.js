/**
 * 生产环境配置文件
 */
const config = {
    // 环境配置
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    
    // 服务器配置
    server: {
        port: process.env.PORT || 25812,
        host: process.env.HOST || '0.0.0.0',
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }
    },
    
    // 资源路径配置
    paths: {
        resources: './resources',
        uploads: './uploads',
        logs: './logs'
    },
    
    // 安全配置
    security: {
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15分钟
            max: 100 // 限制每个IP 15分钟内最多100个请求
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https:"],
                    fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"]
                }
            }
        }
    },
    
    // 日志配置
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: './logs/app.log',
        maxSize: '10m',
        maxFiles: '5'
    },
    
    // 缓存配置
    cache: {
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        etag: true
    },
    
    // 压缩配置
    compression: {
        level: 6,
        threshold: 1024
    }
};

module.exports = config;
