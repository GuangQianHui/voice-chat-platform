/**
 * 时间管理工具类
 * 实现微信风格的时间显示逻辑
 */
class TimeManager {
    constructor() {
        this.lastMessageTime = null;
        this.lastDisplayedTime = null;
    }

    /**
     * 格式化时间显示
     * @param {Date} currentTime - 当前消息时间
     * @param {Date} lastTime - 上一条消息时间
     * @returns {string|null} 格式化后的时间字符串，如果不需要显示则返回null
     */
    formatTimeDisplay(currentTime, lastTime = null) {
        const now = new Date();
        const current = new Date(currentTime);
        
        // 如果没有上一条消息时间，显示当前时间
        if (!lastTime) {
            return this.formatTime(current);
        }
        
        const last = new Date(lastTime);
        const timeDiff = current - last;
        const twoMinutes = 2 * 60 * 1000; // 2分钟的毫秒数
        
        // 如果时间间隔超过2分钟，显示时间
        if (timeDiff > twoMinutes) {
            return this.formatTime(current);
        }
        
        // 检查是否需要显示日期分隔符
        if (this.shouldShowDateDivider(current, last)) {
            return this.formatDateDivider(current);
        }
        
        return null; // 不显示时间
    }

    /**
     * 格式化时间
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 检查是否需要显示日期分隔符
     * @param {Date} current - 当前时间
     * @param {Date} last - 上一条消息时间
     * @returns {boolean} 是否需要显示日期分隔符
     */
    shouldShowDateDivider(current, last) {
        const currentDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        const lastDate = new Date(last.getFullYear(), last.getMonth(), last.getDate());
        
        return currentDate.getTime() !== lastDate.getTime();
    }

    /**
     * 格式化日期分隔符
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期分隔符
     */
    formatDateDivider(date) {
        const now = new Date();
        const current = new Date(date);
        
        const currentYear = current.getFullYear();
        const currentMonth = current.getMonth() + 1;
        const currentDay = current.getDate();
        const currentHours = current.getHours().toString().padStart(2, '0');
        const currentMinutes = current.getMinutes().toString().padStart(2, '0');
        
        const nowYear = now.getFullYear();
        const nowMonth = now.getMonth() + 1;
        const nowDay = now.getDate();
        
        // 如果是今天
        if (currentYear === nowYear && currentMonth === nowMonth && currentDay === nowDay) {
            return `今天 ${currentHours}:${currentMinutes}`;
        }
        
        // 如果是昨天
        const yesterday = new Date(now);
        yesterday.setDate(nowDay - 1);
        if (currentYear === yesterday.getFullYear() && 
            currentMonth === (yesterday.getMonth() + 1) && 
            currentDay === yesterday.getDate()) {
            return `昨天 ${currentHours}:${currentMinutes}`;
        }
        
        // 如果是今年但跨月份
        if (currentYear === nowYear) {
            return `${currentMonth.toString().padStart(2, '0')}/${currentDay.toString().padStart(2, '0')} ${currentHours}:${currentMinutes}`;
        }
        
        // 跨年份
        return `${currentYear}/${currentMonth.toString().padStart(2, '0')}/${currentDay.toString().padStart(2, '0')} ${currentHours}:${currentMinutes}`;
    }

    /**
     * 创建时间分隔符元素
     * @param {string} timeText - 时间文本
     * @returns {HTMLElement} 时间分隔符元素
     */
    createTimeDivider(timeText) {
        const divider = document.createElement('div');
        divider.className = 'time-divider';
        divider.innerHTML = `<span class="time-text">${timeText}</span>`;
        return divider;
    }

    /**
     * 处理消息时间显示
     * @param {HTMLElement} messageElement - 消息元素
     * @param {Date} messageTime - 消息时间
     * @param {HTMLElement} container - 消息容器
     */
    handleMessageTime(messageElement, messageTime, container) {
        const timeDisplay = this.formatTimeDisplay(messageTime, this.lastMessageTime);
        
        if (timeDisplay) {
            // 创建时间元素，显示在消息上方
            const timeElement = document.createElement('div');
            timeElement.className = 'message-time';
            timeElement.textContent = timeDisplay;
            
            // 将时间元素插入到消息之前
            container.appendChild(timeElement);
        }
        
        this.lastMessageTime = messageTime;
    }

    /**
     * 重置时间管理器状态
     */
    reset() {
        this.lastMessageTime = null;
        this.lastDisplayedTime = null;
    }
}

// 导出时间管理器
window.TimeManager = TimeManager;
