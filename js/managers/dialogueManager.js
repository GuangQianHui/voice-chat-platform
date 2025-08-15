class DialogueManager {
    constructor() {
        this.conversationHistory = [];
        this.context = {};
        this.knowledgeBase = {};
        this.questionPatterns = {
            // 地理位置类问题
            location: {
                patterns: ['在哪里', '位于哪里', '地理位置', '位置', '地址', '在什么地方'],
                field: 'content',
                extractor: (content) => {
                    const locationMatch = content.match(/位于(.+?)[，。]/);
                    return locationMatch ? locationMatch[1] : null;
                }
            },
            // 美称/称号类问题
            title: {
                patterns: ['美称', '称号', '被称为', '被誉为', '有什么称号', '有什么美称'],
                field: 'description',
                extractor: (description) => {
                    const titleMatch = description.match(/被誉为"([^"]+)"/);
                    return titleMatch ? titleMatch[1] : null;
                }
            },
            // 历史时期类问题
            history: {
                patterns: ['建于什么时期', '什么时期', '历史', '年代', '时期', '什么时候建的'],
                field: 'history',
                extractor: (history) => history
            },
            // 技术工艺类问题
            technique: {
                patterns: ['技术', '工艺', '制作', '采用什么', '建筑技术', '制作工艺'],
                field: 'technique',
                extractor: (technique) => technique
            },
            // 特色特点类问题
            features: {
                patterns: ['特色', '特点', '建筑特色', '有什么特色', '有什么特点'],
                field: 'features',
                extractor: (features) => features
            },
            // 文化意义类问题
            culture: {
                patterns: ['文化意义', '文化价值', '意义', '价值', '文化'],
                field: 'funFact',
                extractor: (funFact) => funFact
            },
            // 类型分类类问题
            type: {
                patterns: ['什么类型', '属于什么', '分类', '类型', '什么建筑'],
                field: 'tags',
                extractor: (tags) => tags ? tags.join('、') : null
            },
            // 图片类问题
            image: {
                patterns: ['图片', '照片', '图像', '有图片吗', '可以看图片吗'],
                field: 'media',
                extractor: (media) => {
                    if (media && media.length > 0) {
                        const imageMedia = media.find(m => m.type === 'image');
                        return imageMedia ? imageMedia.url : null;
                    }
                    return null;
                }
            },
            // 视频类问题
            video: {
                patterns: ['视频', '录像', '有视频吗', '可以看视频吗'],
                field: 'media',
                extractor: (media) => {
                    if (media && media.length > 0) {
                        const videoMedia = media.find(m => m.type === 'video');
                        return videoMedia ? videoMedia.url : null;
                    }
                    return null;
                }
            }
        };
        this.init();
    }

    async init() {
        await this.loadKnowledgeBase();
        this.addSystemMessage('系统已就绪，可以开始对话');
        
        // 监听资源管理器数据更新
        this.setupResourceManagerListener();
    }

    setupResourceManagerListener() {
        // 监听资源管理器的数据更新事件
        if (window.resourceManager) {
            window.resourceManager.onDataUpdate = () => {
                this.refreshKnowledgeBase();
            };
        } else {
            // 如果资源管理器还没有初始化，等待一下再设置
            setTimeout(() => {
                this.setupResourceManagerListener();
            }, 100);
        }
    }

    async refreshKnowledgeBase() {
        try {
            console.log('刷新知识库数据...');
            await this.loadKnowledgeBase();
            this.addSystemMessage('知识库已更新，可以开始新的对话');
        } catch (error) {
            console.error('刷新知识库失败:', error);
        }
    }

    async loadKnowledgeBase() {
        try {
            // 从资源管理器获取当前资源数据
            if (window.resourceManager && window.resourceManager.resources) {
                this.knowledgeBase = { ...window.resourceManager.resources };
                console.log('从资源管理器加载知识库数据');
                
                // 统计各分类的资源数量
                for (const [category, resources] of Object.entries(this.knowledgeBase)) {
                    console.log(`知识库 ${category}，共 ${Object.keys(resources).length} 项`);
                }
            } else {
                // 如果资源管理器不可用，回退到本地加载
                console.log('资源管理器不可用，回退到本地知识库加载');
                await this.loadLocalKnowledgeBase();
            }
        } catch (error) {
            console.error('加载知识库失败:', error);
            // 出错时也回退到本地加载
            await this.loadLocalKnowledgeBase();
        }
    }

    async loadLocalKnowledgeBase() {
        try {
            const categories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
            
            for (const category of categories) {
                try {
                    const response = await fetch(`resources/knowledge/${category}/data.json`);
                    if (response.ok) {
                        const data = await response.json();
                        this.knowledgeBase[category] = data.resources;
                        console.log(`成功加载本地 ${category} 知识库，共 ${Object.keys(data.resources).length} 项`);
                    } else {
                        console.warn(`无法加载本地 ${category} 知识库: ${response.status}`);
                    }
                } catch (error) {
                    console.error(`加载本地 ${category} 知识库失败:`, error);
                }
            }
        } catch (error) {
            console.error('加载本地知识库失败:', error);
        }
    }

    processUserInput(input, type = 'text') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
            console.warn('processUserInput: 输入参数无效:', input);
            return '抱歉，我没有理解您的问题。请重新输入。';
        }

        this.addUserMessage(input, type);
        const response = this.generatePreciseResponse(input);
        this.updateContext(input, 'precise_query', response);
        this.addAIMessage(response);
        
        this.showRelatedResources(input);
        
        return response;
    }

    showRelatedResources(query) {
        // 不再根据用户提问动态显示相关内容
        // 右侧知识库将始终显示所有知识库内容
        console.log('用户提问:', query, '，但右侧知识库保持显示所有内容');
    }

    generatePreciseResponse(input) {
        // 首先识别问题中的实体（项目名称）
        const entity = this.extractEntity(input);
        if (!entity) {
            return this.generateGeneralResponse(input);
        }

        // 识别问题类型
        const questionType = this.identifyQuestionType(input);
        if (!questionType) {
            return this.generateGeneralResponse(input);
        }

        // 查找对应的知识库项目
        const item = this.findItemByEntity(entity);
        if (!item) {
            return `抱歉，我没有找到关于"${entity}"的信息。`;
        }

        // 根据问题类型生成精确回答
        return this.generateTypeSpecificResponse(item, questionType, input);
    }

    extractEntity(input) {
        // 在所有分类中查找项目名称
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        for (const category of allCategories) {
            if (this.knowledgeBase[category]) {
                for (const [key, item] of Object.entries(this.knowledgeBase[category])) {
                    if (input.includes(item.title)) {
                        return item.title;
                    }
                    // 检查关键词
                    if (item.keywords && item.keywords.some(keyword => input.includes(keyword))) {
                        return item.title;
                    }
                }
            }
        }
        return null;
    }

    identifyQuestionType(input) {
        for (const [type, config] of Object.entries(this.questionPatterns)) {
            if (config.patterns.some(pattern => input.includes(pattern))) {
                return type;
            }
        }
        return null;
    }

    findItemByEntity(entity) {
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        for (const category of allCategories) {
            if (this.knowledgeBase[category]) {
                for (const [key, item] of Object.entries(this.knowledgeBase[category])) {
                    if (item.title === entity) {
                        return item;
                    }
                }
            }
        }
        return null;
    }

    generateTypeSpecificResponse(item, questionType, originalQuestion) {
        const config = this.questionPatterns[questionType];
        if (!config) {
            return this.generateGeneralResponse(originalQuestion);
        }

        const fieldValue = item[config.field];
        if (!fieldValue) {
            return this.generateNoDataResponse(questionType, item.title);
        }

        const extractedInfo = config.extractor(fieldValue);
        if (!extractedInfo) {
            return this.generateNoDataResponse(questionType, item.title);
        }

        return this.formatResponse(questionType, item.title, extractedInfo, originalQuestion);
    }

    generateNoDataResponse(questionType, itemTitle) {
        const noDataResponses = {
            location: `抱歉，我没有找到关于"${itemTitle}"具体位置的信息。`,
            title: `抱歉，我没有找到关于"${itemTitle}"称号的信息。`,
            history: `抱歉，我没有找到关于"${itemTitle}"历史时期的信息。`,
            technique: `抱歉，我没有找到关于"${itemTitle}"技术工艺的信息。`,
            features: `抱歉，我没有找到关于"${itemTitle}"特色的信息。`,
            culture: `抱歉，我没有找到关于"${itemTitle}"文化意义的信息。`,
            type: `抱歉，我没有找到关于"${itemTitle}"类型分类的信息。`,
            image: `抱歉，我目前无法生成"${itemTitle}"的图片。`,
            video: `抱歉，我目前无法生成"${itemTitle}"的视频。`
        };
        return noDataResponses[questionType] || `抱歉，我没有找到关于"${itemTitle}"的相关信息。`;
    }

    formatResponse(questionType, itemTitle, extractedInfo, originalQuestion) {
        const responseTemplates = {
            location: `${itemTitle}位于${extractedInfo}。`,
            title: `${itemTitle}被誉为"${extractedInfo}"。`,
            history: `${itemTitle}${extractedInfo}。`,
            technique: `${itemTitle}${extractedInfo}。`,
            features: `${itemTitle}${extractedInfo}。`,
            culture: `${itemTitle}${extractedInfo}。`,
            type: `${itemTitle}属于${extractedInfo}类型。`,
            image: `对应生成的图片如下：\n${extractedInfo}`,
            video: `对应生成的视频如下：\n${extractedInfo}`
        };

        const response = responseTemplates[questionType] || `${itemTitle}：${extractedInfo}`;
        
        // 如果是媒体类型，需要特殊处理
        if (questionType === 'video' && extractedInfo) {
            return this.generateVideoResponse(itemTitle, extractedInfo);
        } else if (questionType === 'image' && extractedInfo) {
            return this.generateImageResponse(itemTitle, extractedInfo);
        }
        
        return response;
    }

    generateVideoResponse(itemTitle, videoUrl) {
        const videoId = `video-${Date.now()}`;
        const videoHtml = `
            <div class="video-container">
                <video id="${videoId}" controls preload="metadata">
                    <source src="${videoUrl}" type="video/mp4">
                    <source src="${videoUrl}" type="video/webm">
                    您的浏览器不支持视频播放。
                </video>
                <div class="media-caption">
                    ${itemTitle} 相关视频
                </div>
            </div>
        `;
        
        // 延迟插入视频元素
        setTimeout(() => {
            this.insertVideoElement(videoId, videoHtml);
        }, 100);
        
        return `对应生成的视频如下：\n[视频加载中...]`;
    }

    generateImageResponse(itemTitle, imageUrl) {
        const imageId = `image-${Date.now()}`;
        const imageHtml = `
            <div class="image-container">
                <img src="${imageUrl}" alt="${itemTitle}" loading="lazy">
                <div class="media-caption">
                    ${itemTitle} 相关图片
                </div>
            </div>
        `;
        
        // 延迟插入图片元素
        setTimeout(() => {
            this.insertImageElement(imageId, imageHtml);
        }, 100);
        
        return `对应生成的图片如下：\n[图片加载中...]`;
    }

    insertVideoElement(videoId, videoHtml) {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            const videoElement = document.createElement('div');
            videoElement.innerHTML = videoHtml;
            videoElement.className = 'ai-message-media';
            messagesContainer.appendChild(videoElement);
            
            // 添加视频事件监听
            const video = videoElement.querySelector('video');
            if (video) {
                video.addEventListener('loadstart', () => {
                    videoElement.classList.add('media-loading');
                });
                
                video.addEventListener('canplay', () => {
                    videoElement.classList.remove('media-loading');
                });
                
                video.addEventListener('error', () => {
                    videoElement.innerHTML = `
                        <div class="media-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>视频加载失败，请检查文件路径是否正确。</p>
                        </div>
                    `;
                });
            }
            
            // 滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    insertImageElement(imageId, imageHtml) {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
            const imageElement = document.createElement('div');
            imageElement.innerHTML = imageHtml;
            imageElement.className = 'ai-message-media';
            messagesContainer.appendChild(imageElement);
            
            // 添加图片事件监听
            const img = imageElement.querySelector('img');
            if (img) {
                img.addEventListener('load', () => {
                    imageElement.classList.remove('media-loading');
                });
                
                img.addEventListener('error', () => {
                    imageElement.innerHTML = `
                        <div class="media-error">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>图片加载失败，请检查文件路径是否正确。</p>
                        </div>
                    `;
                });
            }
            
            // 滚动到底部
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    generateGeneralResponse(input) {
        // 如果没有找到具体项目，提供通用回答
        if (input.includes('你好') || input.includes('问候') || input.includes('早上好') ||
            input.includes('晚上好') || input.includes('下午好')) {
            return this.generateGreetingResponse();
        } else if (input.includes('谢谢') || input.includes('感谢') || input.includes('多谢')) {
            return this.generateThanksResponse();
        }

        // 提供推荐
        return this.generateMixedRecommendation();
    }

    generateGreetingResponse() {
        const greetings = [
            "您好！我是传统文化助手，很高兴为您服务！",
            "欢迎来到传统文化世界！我可以为您介绍美食、工艺、戏曲、节日、医药、建筑等各个方面。",
            "您好！让我们一起探索中华传统文化的魅力吧！",
            "欢迎！我是您的传统文化向导，请告诉我您想了解什么？"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    generateThanksResponse() {
        const thanks = [
            "不客气！很高兴能帮助您了解传统文化！",
            "您太客气了！还有其他问题随时问我！",
            "应该的！传统文化需要传承，我很乐意分享！",
            "不用谢！希望您对传统文化有更深的了解！"
        ];
        return thanks[Math.floor(Math.random() * thanks.length)];
    }

    generateMixedRecommendation() {
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        const mixedItems = [];
        
        allCategories.forEach(category => {
            if (this.knowledgeBase[category]) {
                const randomItem = this.getRandomItems(this.knowledgeBase[category], 1)[0];
                if (randomItem) {
                    mixedItems.push(randomItem);
                }
            }
        });
        
        const selectedItems = this.shuffleArray(mixedItems).slice(0, 3);
        let itemsList = '';
        
        selectedItems.forEach((item, index) => {
            const categoryNames = {
                'traditionalFoods': '美食',
                'traditionalCrafts': '工艺',
                'traditionalOpera': '戏曲',
                'traditionalFestivals': '节日',
                'traditionalMedicine': '医药',
                'traditionalArchitecture': '建筑'
            };
            itemsList += `${index + 1}. ${item.title}（${categoryNames[item.category]}）\n`;
        });
        
        return `我为您推荐几个相关内容：\n${itemsList}\n\n您对哪个感兴趣？可以问我具体问题，比如"朱家角在哪里？"、"过桥米线有什么特色？"等。`;
    }

    getRandomItems(category, count) {
        if (!category) return [];
        const items = Object.values(category);
        return this.shuffleArray(items).slice(0, count);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    updateContext(input, intent, response) {
        this.context.lastInput = input;
        this.context.lastIntent = intent;
        this.context.lastResponse = response;
        this.context.timestamp = new Date().toISOString();
    }

    addUserMessage(content, type = 'text') {
        this.conversationHistory.push({
            role: 'user',
            content: content,
            type: type,
            timestamp: new Date().toISOString()
        });
    }

    addAIMessage(content) {
        this.conversationHistory.push({
            role: 'assistant',
            content: content,
            type: 'text',
            timestamp: new Date().toISOString()
        });
    }

    addSystemMessage(content) {
        this.conversationHistory.push({
            role: 'system',
            content: content,
            type: 'text',
            timestamp: new Date().toISOString()
        });
    }

    getConversationHistory() {
        return this.conversationHistory;
    }

    clearHistory() {
        this.conversationHistory = [];
        this.context = {};
    }
}
