/**
 * 数据存储管理器
 * 负责历史对话记录的持久化存储
 */
class DataStorageManager {
    constructor() {
        this.storageKey = 'voice_chat_history';
        this.backupKey = 'voice_chat_backup';
        this.maxBackups = 10;
        this.autoBackupInterval = 5 * 60 * 1000; // 5分钟
        this.lastBackupTime = null;
        this.backupTimer = null;
        this.currentVersion = '1.0.0';
        this.supportedVersions = ['1.0.0'];
        
        this.initAutoBackup();
    }

    initAutoBackup() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
        }
        
        this.backupTimer = setInterval(() => {
            this.createBackup();
        }, this.autoBackupInterval);
    }

    saveToLocalStorage(data) {
        try {
            const storageData = {
                version: this.currentVersion,
                timestamp: new Date().toISOString(),
                data: data
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(storageData));
            console.log('数据已保存到本地存储');
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
                console.log('本地存储中没有找到数据');
                return null;
            }

            const parsedData = JSON.parse(storedData);
            
            if (!this.isVersionCompatible(parsedData.version)) {
                console.warn(`数据版本不兼容: ${parsedData.version}`);
                return this.migrateData(parsedData);
            }

            console.log('从本地存储加载数据成功');
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
        console.log('开始数据迁移...');
        return oldData.data || oldData;
    }

    createBackup() {
        try {
            const currentData = localStorage.getItem(this.storageKey);
            if (!currentData) {
                return false;
            }

            const backupData = {
                version: this.currentVersion,
                timestamp: new Date().toISOString(),
                data: JSON.parse(currentData)
            };

            const backups = this.getBackups();
            backups.unshift(backupData);
            
            if (backups.length > this.maxBackups) {
                backups.splice(this.maxBackups);
            }

            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            this.lastBackupTime = new Date().toISOString();
            
            console.log('自动备份创建成功');
            return true;
        } catch (error) {
            console.error('创建备份失败:', error);
            return false;
        }
    }

    getBackups() {
        try {
            const backups = localStorage.getItem(this.backupKey);
            return backups ? JSON.parse(backups) : [];
        } catch (error) {
            console.error('获取备份失败:', error);
            return [];
        }
    }

    restoreFromBackup(backupIndex) {
        try {
            const backups = this.getBackups();
            if (backupIndex < 0 || backupIndex >= backups.length) {
                console.error('备份索引无效');
                return null;
            }

            const backup = backups[backupIndex];
            console.log(`从备份恢复数据: ${backup.timestamp}`);
            return backup.data;
        } catch (error) {
            console.error('从备份恢复数据失败:', error);
            return null;
        }
    }

    exportToFile(data, filename = 'voice_chat_history.json') {
        try {
            const exportData = {
                version: this.currentVersion,
                exportTime: new Date().toISOString(),
                data: data
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`数据已导出到文件: ${filename}`);
            return true;
        } catch (error) {
            console.error('导出文件失败:', error);
            return false;
        }
    }

    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const importedData = JSON.parse(event.target.result);
                        
                        if (!importedData.version || !importedData.data) {
                            reject(new Error('文件格式无效'));
                            return;
                        }

                        if (!this.isVersionCompatible(importedData.version)) {
                            console.warn(`导入文件版本不兼容: ${importedData.version}`);
                        }

                        console.log('从文件导入数据成功');
                        resolve(importedData.data);
                    } catch (error) {
                        reject(new Error('解析文件内容失败'));
                    }
                };

                reader.onerror = () => {
                    reject(new Error('读取文件失败'));
                };

                reader.readAsText(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    cleanupOldBackups(daysToKeep = 7) {
        try {
            const backups = this.getBackups();
            const cutoffTime = new Date();
            cutoffTime.setDate(cutoffTime.getDate() - daysToKeep);

            const filteredBackups = backups.filter(backup => {
                const backupTime = new Date(backup.timestamp);
                return backupTime > cutoffTime;
            });

            if (filteredBackups.length !== backups.length) {
                localStorage.setItem(this.backupKey, JSON.stringify(filteredBackups));
                console.log(`清理了 ${backups.length - filteredBackups.length} 个旧备份`);
            }
        } catch (error) {
            console.error('清理旧备份失败:', error);
        }
    }

    getStorageStats() {
        try {
            const currentData = localStorage.getItem(this.storageKey);
            const backups = this.getBackups();
            
            return {
                hasCurrentData: !!currentData,
                currentDataSize: currentData ? currentData.length : 0,
                backupCount: backups.length,
                lastBackupTime: this.lastBackupTime,
                totalStorageSize: this.getTotalStorageSize()
            };
        } catch (error) {
            console.error('获取存储统计信息失败:', error);
            return {};
        }
    }

    getTotalStorageSize() {
        try {
            let totalSize = 0;
            
            const currentData = localStorage.getItem(this.storageKey);
            if (currentData) {
                totalSize += currentData.length;
            }

            const backups = localStorage.getItem(this.backupKey);
            if (backups) {
                totalSize += backups.length;
            }

            return totalSize;
        } catch (error) {
            console.error('计算存储大小失败:', error);
            return 0;
        }
    }

    destroy() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
        }
    }
}

window.DataStorageManager = DataStorageManager;
