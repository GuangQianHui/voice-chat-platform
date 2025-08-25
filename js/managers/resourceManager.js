class ResourceManager {
    constructor() {
        this.resources = {};
        this.categories = {
            traditionalFoods: { name: '传统美食', icon: 'fa-utensils', color: '#DC143C' },
            traditionalCrafts: { name: '传统工艺', icon: 'fa-gem', color: '#FFD700' },
            traditionalOpera: { name: '传统戏曲', icon: 'fa-mask', color: '#8B4513' },
            traditionalFestivals: { name: '传统节日', icon: 'fa-calendar', color: '#FF6B35' },
            traditionalMedicine: { name: '传统医药', icon: 'fa-leaf', color: '#228B22' },
            traditionalArchitecture: { name: '传统建筑', icon: 'fa-building', color: '#696969' }
        };
        
        // 数据更新回调
        this.onDataUpdate = null;
        
        this.init();
    }

    async init() {
        await this.loadResources();
    }

    async loadResources() {
        try {
            console.log('从资源服务器加载资源库...');
            
            try {
                // 从资源服务器获取所有资源
                const response = await fetch('http://localhost:3001/api/resources/load-all');
                        if (response.ok) {
                            const data = await response.json();
                    if (data.success && data.resources) {
                        this.resources = data.resources;
                        console.log('成功从资源服务器加载资源库');
                        } else {
                        console.warn('资源服务器返回数据格式错误');
                        console.error('无法加载资源，请确保资源服务器正常运行');
                    }
                } else {
                    console.warn(`无法从资源服务器加载资源: ${response.status}`);
                    console.error('无法加载资源，请确保资源服务器正常运行');
                }
            } catch (error) {
                console.error('从资源服务器加载资源失败:', error);
                console.error('无法加载资源，请确保资源服务器正常运行');
            }
            
            console.log('资源库加载完成:', this.resources);
        } catch (error) {
            console.error('加载资源失败:', error);
        }
    }

    /**
     * 加载本地资源库（已废弃，现在完全依赖资源服务器）
     */
    async loadLocalResources() {
        console.log('本地资源库加载已废弃，现在完全依赖资源服务器');
        // 此方法已不再使用，保留是为了兼容性
    }

    /**
     * 通知数据更新
     */
    notifyDataUpdate() {
        if (this.onDataUpdate && typeof this.onDataUpdate === 'function') {
            this.onDataUpdate();
        }
    }













    getTotalCount() {
        let total = 0;
        for (const [category, resources] of Object.entries(this.resources)) {
            if (resources) {
                total += Object.keys(resources).length;
            }
        }
        return total;
    }

    getCategoryEmoji(category) {
        const emojiMap = {
            'traditionalFoods': '🍜',
            'traditionalCrafts': '🏺',
            'traditionalOpera': '🎭',
            'traditionalFestivals': '🏮',
            'traditionalMedicine': '🌿',
            'traditionalArchitecture': '🏛️'
        };
        return emojiMap[category] || '📚';
    }

    /**
     * 显示相关资源（简化版，语音交流不需要UI显示）
     * @param {string} query - 查询内容
     */
    showRelatedResources(query) {
        // 语音交流不需要UI显示，只记录日志
        console.log('显示相关资源:', query);
    }




















}
