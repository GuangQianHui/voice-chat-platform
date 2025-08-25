/**
 * 数据存储管理器
 * 负责历史对话记录的持久化存储
 */
class DataStorageManager {
    constructor() {
        this.storageKey = 'voice_chat_history';
        this.currentVersion = '1.0.0';
        this.supportedVersions = ['1.0.0'];
    }

    saveToLocalStorage(data) {
        try {
            const storageData = {
                version: this.currentVersion,
                timestamp: new Date().toISOString(),
                data: data
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(storageData));
            return true;
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    }

    loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem(this.storageKey);
            if (!storedData) {
                return null;
            }

            const parsedData = JSON.parse(storedData);
            
            if (!this.isVersionCompatible(parsedData.version)) {
                console.warn(`数据版本不兼容: ${parsedData.version}`);
                return this.migrateData(parsedData);
            }

            return parsedData.data;
        } catch (error) {
            console.error('从本地存储加载数据失败:', error);
            return null;
        }
    }

    isVersionCompatible(version) {
        return this.supportedVersions.includes(version);
    }

    migrateData(oldData) {
        return oldData.data || oldData;
    }

    // 为了保持与现有代码的兼容性，保留这些方法但简化实现
    createBackup() {
        // 简化实现：不再创建备份，直接返回成功
        return true;
    }

    getBackups() {
        // 简化实现：返回空数组
        return [];
    }

    restoreFromBackup(backupIndex) {
        // 简化实现：返回null，表示没有备份可恢复
        return null;
    }

    exportToFile(data, filename = 'voice_chat_history.json') {
        // 简化实现：不再导出文件，直接返回成功
        console.log('导出功能已禁用');
        return true;
    }

    async importFromFile(file) {
        // 简化实现：不再导入文件，返回错误
        throw new Error('导入功能已禁用');
    }
}

window.DataStorageManager = DataStorageManager;
