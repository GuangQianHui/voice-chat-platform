// ===== 新版本 DialogueManager (修复路径问题) =====
console.log('加载新版本 DialogueManager，版本：2024-01-15-fixed');

class DialogueManager {
    constructor() {
        this.version = '2024-01-15-fixed'; // 版本标识
        this.knowledgeBase = {};
        this.resourceServerUrl = 'http://localhost:3001';
        this.questionPatterns = {
            // 地理位置类问题
            location: {
                patterns: ['在哪里', '位于哪里', '地理位置', '位置', '地址', '在什么地方'],
                field: 'location',
                extractor: (location, originalQuestion) => {
                    if (location && location.trim()) {
                        return location.trim();
                    }
                    return null;
                }
            },
            // 美称/称号类问题
            title: {
                patterns: ['美称', '称号', '被称为', '被誉为', '有什么称号', '有什么美称'],
                field: 'description',
                extractor: (description, originalQuestion) => {
                    const patterns = [
                        /被誉为"([^"]+)"/,
                        /被称为"([^"]+)"/,
                        /被誉为(.+?)[，。]/,
                        /被称为(.+?)[，。]/
                    ];
                    
                    for (const pattern of patterns) {
                        const match = description.match(pattern);
                        if (match) {
                            return match[1].trim();
                        }
                    }
                    return null;
                }
            },
            // 历史时期类问题
            history: {
                patterns: ['建于什么时期', '什么时期', '历史', '年代', '时期', '什么时候建的'],
                field: 'history',
                extractor: (history, originalQuestion) => {
                    if (history && history.trim()) {
                        return history.trim();
                    }
                    return null;
                }
            },
            // 技术工艺类问题
            technique: {
                patterns: ['技术', '工艺', '制作', '采用什么', '建筑技术', '制作工艺'],
                field: 'technique',
                extractor: (technique, originalQuestion) => {
                    if (technique && technique.trim()) {
                        return technique.trim();
                    }
                    return null;
                }
            },
            // 特色特点类问题
            features: {
                patterns: ['特色', '特点', '建筑特色', '有什么特色', '有什么特点'],
                field: 'features',
                extractor: (features, originalQuestion) => {
                    if (features && features.trim()) {
                        return features.trim();
                    }
                    return null;
                }
            },
            // 文化意义类问题
            culture: {
                patterns: ['文化意义', '文化价值', '意义', '价值', '文化'],
                field: 'funFact',
                extractor: (funFact, originalQuestion) => {
                    if (funFact && funFact.trim()) {
                        return funFact.trim();
                    }
                    return null;
                }
            },
            // 类型分类类问题
            type: {
                patterns: ['什么类型', '属于什么', '分类', '类型', '什么建筑'],
                field: 'tags',
                extractor: (tags, originalQuestion) => tags ? tags.join('、') : null
            },
            // 媒体文件生成类问题
            mediaGeneration: {
                patterns: ['生成', '我要生成', '我想要生成', '请生成', '显示', '我要显示', '我想要显示', '请显示'],
                field: 'media',
                extractor: (media, input) => {
                    // 检测用户请求的媒体类型
                    const mediaTypes = {
                        '图片': 'image',
                        'image': 'image',
                        '照片': 'image',
                        'photo': 'image',
                        '视频': 'video',
                        'video': 'video',
                        '音频': 'audio',
                        'audio': 'audio',
                        '声音': 'audio',
                        'sound': 'audio',
                        '文档': 'document',
                        'document': 'document',
                        '文件': 'document',
                        'file': 'document'
                    };
                    
                    const requestedTypes = [];
                    for (const [chineseType, englishType] of Object.entries(mediaTypes)) {
                        if (input.includes(chineseType) || input.includes(englishType)) {
                            requestedTypes.push(englishType);
                        }
                    }
                    
                    return {
                        requestedTypes: requestedTypes,
                        availableMedia: media || []
                    };
                }
            }
        };
        this.init();
    }

    async init() {
        console.log('对话管理器初始化开始... 版本:', this.version);
        await this.loadKnowledgeBase();
        console.log('对话管理器初始化完成，知识库状态:', {
            hasData: Object.keys(this.knowledgeBase).length > 0,
            categories: Object.keys(this.knowledgeBase),
            totalItems: Object.values(this.knowledgeBase).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
        });
        
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
        } catch (error) {
            console.error('刷新知识库失败:', error);
        }
    }

    async loadKnowledgeBase() {
        try {
            // 优先从资源服务器获取数据
            await this.loadFromResourceServer();
            
            // 如果资源管理器有数据，也加载进来
            if (window.resourceManager && window.resourceManager.resources) {
                this.mergeResourceManagerData();
            }
        } catch (error) {
            console.error('加载知识库失败:', error);
            // 出错时尝试从资源管理器获取
            if (window.resourceManager && window.resourceManager.resources) {
                this.knowledgeBase = { ...window.resourceManager.resources };
                console.log('从资源管理器加载知识库数据');
            }
        }
    }

    async loadFromResourceServer() {
        try {
            console.log('从资源服务器加载知识库数据...');
            
            // 使用search-all接口获取所有资源
            const response = await fetch(`${this.resourceServerUrl}/api/resources/search-all`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.resources) {
                    this.knowledgeBase = data.resources;
                    console.log('成功从资源服务器加载知识库，总资源数:', data.totalCount);
                    
                    // 统计各分类的资源数量
                    for (const [category, resources] of Object.entries(this.knowledgeBase)) {
                        console.log(`知识库 ${category}，共 ${Object.keys(resources).length} 项`);
                    }
                    
                    // 调试：打印一些示例数据
                    for (const [category, resources] of Object.entries(this.knowledgeBase)) {
                        const firstItem = Object.values(resources)[0];
                        if (firstItem) {
                            console.log(`示例数据 (${category}):`, {
                                title: firstItem.title,
                                description: firstItem.description,
                                tags: firstItem.tags,
                                keywords: firstItem.keywords
                            });
                        }
                    }
                    
                    // 验证朱家角是否存在
                    if (this.knowledgeBase.traditionalArchitecture && this.knowledgeBase.traditionalArchitecture['朱家角']) {
                        console.log('✅ 验证成功：朱家角数据存在');
                    } else {
                        console.log('❌ 验证失败：朱家角数据不存在');
                    }
                    
                    return;
                }
            }
            
            // 如果search-all失败，尝试load-all接口
            const fallbackResponse = await fetch(`${this.resourceServerUrl}/api/resources/load-all`);
            if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                if (fallbackData.success && fallbackData.resources) {
                    this.knowledgeBase = fallbackData.resources;
                    console.log('通过load-all接口成功从资源服务器加载知识库');
                    return;
                }
            }
            
            throw new Error('资源服务器接口返回失败');
        } catch (error) {
            console.warn('从资源服务器加载知识库失败:', error);
            throw error;
        }
    }

    mergeResourceManagerData() {
        if (window.resourceManager && window.resourceManager.resources) {
            // 合并资源管理器数据，避免覆盖资源服务器的数据
            for (const [category, resources] of Object.entries(window.resourceManager.resources)) {
                if (!this.knowledgeBase[category]) {
                    this.knowledgeBase[category] = {};
                }
                // 只添加资源服务器中没有的资源
                for (const [key, resource] of Object.entries(resources)) {
                    if (!this.knowledgeBase[category][key]) {
                        this.knowledgeBase[category][key] = resource;
                    }
                }
            }
            console.log('合并资源管理器数据完成');
        }
    }

    processUserInput(input, type = 'text') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
            console.warn('processUserInput: 输入参数无效:', input);
            return '抱歉，我没有理解您的问题。请重新输入。';
        }

        const response = this.generatePreciseResponse(input);
        this.showRelatedResources(input);
        
        return response;
    }

    showRelatedResources(query) {
        // 简化版：只记录日志
        console.log('用户提问:', query, '，尝试显示相关内容');
    }

    generatePreciseResponse(input) {
        console.log('开始生成精确回答，输入:', input);
        
        // 首先识别问题中的实体（项目名称）
        const entity = this.extractEntity(input);
        if (!entity) {
            console.log('没有找到实体，生成通用回答');
            return this.generateGeneralResponse(input);
        }
        console.log('找到实体:', entity);

        // 查找对应的知识库项目
        const item = this.findItemByEntity(entity);
        if (!item) {
            console.log('没有找到对应的知识库项目');
            return `抱歉，我没有找到关于"${entity}"的信息。您可以尝试搜索其他相关内容。`;
        }
        console.log('找到知识库项目:', item);

        // 识别问题类型
        const questionType = this.identifyQuestionType(input);
        if (!questionType) {
            console.log('没有找到问题类型，生成综合介绍');
            return this.generateComprehensiveResponse(item, input);
        }
        console.log('找到问题类型:', questionType);

        // 根据问题类型生成精确回答
        const response = this.generateTypeSpecificResponse(item, questionType, input);
        console.log('生成的回答:', response);
        return response;
    }

    extractEntity(input) {
        console.log('🔍 开始实体识别，输入:', input);
        console.log('📚 当前知识库状态:', {
            hasData: Object.keys(this.knowledgeBase).length > 0,
            categories: Object.keys(this.knowledgeBase),
            totalItems: Object.values(this.knowledgeBase).reduce((sum, cat) => sum + Object.keys(cat).length, 0)
        });
        
        // 在所有分类中查找项目名称
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        // 存储所有匹配的实体，按匹配优先级排序
        const matchedEntities = [];
        
        for (const category of allCategories) {
            if (this.knowledgeBase[category]) {
                console.log(`🔎 检查分类: ${category} (${Object.keys(this.knowledgeBase[category]).length} 项)`);
                
                for (const [key, item] of Object.entries(this.knowledgeBase[category])) {
                    let matchScore = 0;
                    let matchType = '';
                    let matchedText = '';
                    
                    // 1. 精确匹配标题（最高优先级）
                    if (input.includes(item.title)) {
                        matchScore = 100;
                        matchType = 'title';
                        matchedText = item.title;
                        console.log(`✅ 找到标题匹配: ${item.title}`);
                    }
                    // 2. 检查关键词（高优先级）
                    else if (item.keywords && item.keywords.some(keyword => input.includes(keyword))) {
                        const matchedKeyword = item.keywords.find(k => input.includes(k));
                        matchScore = 80;
                        matchType = 'keyword';
                        matchedText = matchedKeyword;
                        console.log(`✅ 找到关键词匹配: ${item.title} (关键词: ${matchedKeyword})`);
                    }
                    // 3. 检查标签（中等优先级）
                    else if (item.tags && item.tags.some(tag => input.includes(tag))) {
                        const matchedTag = item.tags.find(t => input.includes(t));
                        matchScore = 60;
                        matchType = 'tag';
                        matchedText = matchedTag;
                        console.log(`✅ 找到标签匹配: ${item.title} (标签: ${matchedTag})`);
                    }
                    // 4. 检查描述内容（低优先级）
                    else if (item.description && input.includes(item.description.substring(0, 10))) {
                        matchScore = 40;
                        matchType = 'description';
                        matchedText = item.description.substring(0, 10);
                        console.log(`✅ 找到描述匹配: ${item.title}`);
                    }
                    
                    if (matchScore > 0) {
                        matchedEntities.push({
                            title: item.title,
                            category: category,
                            score: matchScore,
                            type: matchType,
                            matchedText: matchedText,
                            item: item
                        });
                    }
                }
            } else {
                console.log(`❌ 分类 ${category} 没有数据`);
            }
        }
        
        // 按匹配分数排序，返回最高分的匹配
        if (matchedEntities.length > 0) {
            matchedEntities.sort((a, b) => b.score - a.score);
            const bestMatch = matchedEntities[0];
            console.log(`🎯 最佳匹配: ${bestMatch.title} (分数: ${bestMatch.score}, 类型: ${bestMatch.type})`);
            return bestMatch.title;
        }
        
        console.log('❌ 没有找到匹配的实体');
        return null;
    }

    identifyQuestionType(input) {
        console.log('开始问题类型识别，输入:', input);
        
        for (const [type, config] of Object.entries(this.questionPatterns)) {
            const matchedPattern = config.patterns.find(pattern => input.includes(pattern));
            if (matchedPattern) {
                console.log(`找到问题类型: ${type} (匹配模式: ${matchedPattern})`);
                return type;
            }
        }
        console.log('没有找到匹配的问题类型');
        return null;
    }

    findItemByEntity(entity) {
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        for (const category of allCategories) {
            if (this.knowledgeBase[category]) {
                for (const [key, item] of Object.entries(this.knowledgeBase[category])) {
                    if (item.title === entity) {
                        return { ...item, category };
                    }
                }
            }
        }
        return null;
    }

    generateTypeSpecificResponse(item, questionType, originalQuestion) {
        console.log('开始生成类型特定回答:', { item: item.title, questionType, originalQuestion });
        
        const config = this.questionPatterns[questionType];
        if (!config) {
            console.log('没有找到问题类型配置');
            return this.generateGeneralResponse(originalQuestion);
        }
        console.log('问题类型配置:', config);

        const fieldValue = item[config.field];
        console.log('字段值:', { field: config.field, value: fieldValue });
        if (!fieldValue) {
            console.log('字段值为空，生成无数据回答');
            return this.generateNoDataResponse(questionType, item.title);
        }

        const extractedInfo = config.extractor(fieldValue, originalQuestion);
        console.log('提取的信息:', extractedInfo);
        if (!extractedInfo) {
            console.log('提取信息为空，生成无数据回答');
            return this.generateNoDataResponse(questionType, item.title);
        }

        const response = this.formatResponse(questionType, item.title, extractedInfo, originalQuestion, item);
        console.log('格式化的回答:', response);
        return response;
    }

    generateNoDataResponse(questionType, itemTitle) {
        const noDataResponses = {
            location: `抱歉，我没有找到关于"${itemTitle}"具体位置的信息。您可以尝试询问其他方面的问题。`,
            title: `抱歉，我没有找到关于"${itemTitle}"称号的信息。您可以尝试询问其他方面的问题。`,
            history: `抱歉，我没有找到关于"${itemTitle}"历史时期的信息。您可以尝试询问其他方面的问题。`,
            technique: `抱歉，我没有找到关于"${itemTitle}"技术工艺的信息。您可以尝试询问其他方面的问题。`,
            features: `抱歉，我没有找到关于"${itemTitle}"特色的信息。您可以尝试询问其他方面的问题。`,
            culture: `抱歉，我没有找到关于"${itemTitle}"文化意义的信息。您可以尝试询问其他方面的问题。`,
            type: `抱歉，我没有找到关于"${itemTitle}"类型分类的信息。您可以尝试询问其他方面的问题。`,
            mediaGeneration: `抱歉，我没有找到关于"${itemTitle}"的媒体文件。您可以尝试询问其他方面的问题。`
        };
        return noDataResponses[questionType] || `抱歉，我没有找到关于"${itemTitle}"的相关信息。您可以尝试询问其他方面的问题。`;
    }

    generateComprehensiveResponse(item, originalQuestion) {
        console.log('生成综合介绍回答:', item.title);
        
        let response = ` **${item.title}**\n\n`;
        
        // 添加描述（综合介绍时总是显示）
        if (item.description) {
            response += ` **简介：** ${item.description}\n\n`;
        }
        

        
        // 添加历史信息
        if (item.history) {
            response += ` **历史：** ${item.history}\n\n`;
        }
        
        // 添加特色
        if (item.features) {
            response += ` **特色：** ${item.features}\n\n`;
        }
        
        // 添加技术工艺
        if (item.technique) {
            response += ` **技术工艺：** ${item.technique}\n\n`;
        }
        
        // 添加文化意义
        if (item.funFact) {
            response += ` **文化意义：** ${item.funFact}\n\n`;
        }
        

        
        // 添加相关推荐提示（简化版）
        const relatedItems = this.findRelatedItems(item);
        if (relatedItems.length > 0) {
            const categoryNames = {
                'traditionalFoods': '传统美食',
                'traditionalCrafts': '传统工艺',
                'traditionalOpera': '传统戏曲',
                'traditionalFestivals': '传统节日',
                'traditionalMedicine': '传统医药',
                'traditionalArchitecture': '传统建筑'
            };
            const categoryName = categoryNames[item.category] || '传统文化';
            response += `\n\n 如果您对${categoryName}感兴趣，我还可以为您介绍更多相关内容。`;
        }
        
        // 移除问题建议，让对话更自然
        return response;
    }

    formatResponse(questionType, itemTitle, extractedInfo, originalQuestion, item) {
        // 特殊处理媒体文件生成请求
        if (questionType === 'mediaGeneration') {
            return this.generateMediaResponse(itemTitle, extractedInfo, originalQuestion, item);
        }
        
        const responseTemplates = {
            location: ` **${itemTitle}的位置信息：**\n\n${itemTitle}位于${extractedInfo}。`,
            title: ` **${itemTitle}的称号：**\n\n${itemTitle}被誉为"${extractedInfo}"。`,
            history: ` **${itemTitle}的历史：**\n\n${itemTitle}${extractedInfo}。`,
            technique: ` **${itemTitle}的技术工艺：**\n\n${itemTitle}${extractedInfo}。`,
            features: ` **${itemTitle}的特色：**\n\n${itemTitle}${extractedInfo}`,
            culture: ` **${itemTitle}的文化意义：**\n\n${itemTitle}${extractedInfo}。`,
            type: ` **${itemTitle}的类型：**\n\n${itemTitle}属于${extractedInfo}类型。`
        };

        let response = responseTemplates[questionType] || `📋 **${itemTitle}的信息：**\n\n${itemTitle}：${extractedInfo}`;
        
        // 智能添加简介：只在特定情况下显示
        if (item.description && this.shouldShowDescription(questionType, originalQuestion)) {
            response += `\n\n **简介：** ${item.description}`;
        }
        
        // 添加相关推荐提示（简化版）
        const relatedItems = this.findRelatedItems(item);
        if (relatedItems.length > 0) {
            const categoryNames = {
                'traditionalFoods': '传统美食',
                'traditionalCrafts': '传统工艺',
                'traditionalOpera': '传统戏曲',
                'traditionalFestivals': '传统节日',
                'traditionalMedicine': '传统医药',
                'traditionalArchitecture': '传统建筑'
            };
            const categoryName = categoryNames[item.category] || '传统文化';
            response += `\n\n 如果您对${categoryName}感兴趣，我还可以为您介绍更多相关内容。`;
        }
        
        // 移除问题建议，让对话更自然
        return response;
    }

    findRelatedItems(item) {
        const relatedItems = [];
        const allCategories = ['traditionalFoods', 'traditionalCrafts', 'traditionalOpera', 'traditionalFestivals', 'traditionalMedicine', 'traditionalArchitecture'];
        
        // 查找同类别中的其他项目
        if (item.category && this.knowledgeBase[item.category]) {
            for (const [key, relatedItem] of Object.entries(this.knowledgeBase[item.category])) {
                if (relatedItem.title !== item.title) {
                    relatedItems.push({...relatedItem, category: item.category});
                }
            }
        }
        
        // 查找有相似标签的项目
        if (item.tags) {
            for (const category of allCategories) {
                if (this.knowledgeBase[category]) {
                    for (const [key, relatedItem] of Object.entries(this.knowledgeBase[category])) {
                        if (relatedItem.title !== item.title && 
                            relatedItem.tags && 
                            relatedItem.tags.some(tag => item.tags.includes(tag))) {
                            relatedItems.push({...relatedItem, category: category});
                        }
                    }
                }
            }
        }
        
        return this.shuffleArray(relatedItems).slice(0, 5);
    }

    /**
     * 生成媒体文件响应
     * 根据用户请求的媒体类型，生成相应的媒体文件展示
     */
    generateMediaResponse(itemTitle, extractedInfo, originalQuestion, item) {
        console.log('生成媒体文件响应:', { itemTitle, extractedInfo, originalQuestion });
        
        const { requestedTypes, availableMedia } = extractedInfo;
        
        if (!requestedTypes || requestedTypes.length === 0) {
            return `抱歉，我没有理解您想要生成什么类型的媒体文件。请明确说明您想要生成图片、视频、音频还是文档。`;
        }
        
        if (!availableMedia || availableMedia.length === 0) {
            return `抱歉，我没有找到关于"${itemTitle}"的媒体文件。`;
        }
        
        // 按请求类型过滤媒体文件
        const filteredMedia = availableMedia.filter(media => 
            requestedTypes.includes(media.type)
        );
        
        if (filteredMedia.length === 0) {
            const typeNames = requestedTypes.map(type => {
                const typeMap = { 'image': '图片', 'video': '视频', 'audio': '音频', 'document': '文档' };
                return typeMap[type] || type;
            }).join('、');
            return `抱歉，我没有找到关于"${itemTitle}"的${typeNames}文件。`;
        }
        
        // 返回特殊格式，包含多个消息
        return {
            type: 'media_response',
            messages: this.generateMediaMessages(itemTitle, filteredMedia, item)
        };
    }
    
    /**
     * 生成媒体文件消息列表
     * 每个媒体文件生成两条消息：文字说明 + 媒体文件
     */
    generateMediaMessages(itemTitle, mediaFiles, item) {
        const messages = [];
        
        // 按类型分组媒体文件
        const mediaByType = {};
        mediaFiles.forEach(media => {
            if (!mediaByType[media.type]) {
                mediaByType[media.type] = [];
            }
            mediaByType[media.type].push(media);
        });
        
        // 为每种类型生成消息
        for (const [mediaType, files] of Object.entries(mediaByType)) {
            const typeName = { 'image': '图片', 'video': '视频', 'audio': '音频', 'document': '文档' }[mediaType];
            
            // 随机选择一个文件（如果有多张）
            const selectedMedia = files[Math.floor(Math.random() * files.length)];
            
            // 生成文字说明消息
            const descriptionMessage = this.generateMediaDescriptionMessage(itemTitle, selectedMedia, typeName, item);
            messages.push(descriptionMessage);
            
            // 生成媒体文件消息
            const mediaMessage = this.generateMediaFileMessage(selectedMedia, typeName, item);
            messages.push(mediaMessage);
        }
        
        return messages;
    }
    
    /**
     * 生成媒体文件描述消息
     */
    generateMediaDescriptionMessage(itemTitle, media, typeName, item) {
        let description = ` ${itemTitle}的${typeName}说明\n\n`;
        
        if (item.description) {
            description += `${item.description}\n\n`;
        }
        
        return description;
    }
    
    /**
     * 生成媒体文件显示消息
     */
    generateMediaFileMessage(media, typeName, item) {
        // 确保媒体URL是完整的绝对路径
        let mediaUrl = media.url;
        if (mediaUrl && !mediaUrl.startsWith('http')) {
            // 如果是相对路径，添加资源服务器URL
            if (mediaUrl.startsWith('/')) {
                mediaUrl = this.resourceServerUrl + mediaUrl;
            } else {
                mediaUrl = this.resourceServerUrl + '/' + mediaUrl;
            }
        }
        
        const mediaName = media.name || '未命名文件';
        
        let display = ` ${item.title}的${typeName}\n\n`;
        
        // 根据媒体类型生成不同的显示格式
        switch (media.type) {
            case 'image':
                display += `![${item.title}的${typeName}](${mediaUrl})\n\n`;
                break;
            case 'video':
                display += `<video controls width="100%">\n`;
                display += `  <source src="${mediaUrl}" type="video/mp4">\n`;
                display += `  您的浏览器不支持视频播放。\n`;
                display += `</video>\n\n`;
                break;
            case 'audio':
                display += `<audio controls>\n`;
                display += `  <source src="${mediaUrl}" type="audio/mpeg">\n`;
                display += `  您的浏览器不支持音频播放。\n`;
                display += `</audio>\n\n`;
                break;
            case 'document':
                display += ` [${mediaName}](${mediaUrl})\n\n`;
                break;
            default:
                display += ` [${mediaName}](${mediaUrl})\n\n`;
        }
        
        return display;
    }
    
    /**
     * 格式化媒体文件显示
     * 根据媒体类型生成相应的Markdown格式
     */
    formatMediaDisplay(media, typeName, item) {
        // 确保媒体URL是完整的绝对路径
        let mediaUrl = media.url;
        if (mediaUrl && !mediaUrl.startsWith('http')) {
            // 如果是相对路径，添加资源服务器URL
            if (mediaUrl.startsWith('/')) {
                mediaUrl = this.resourceServerUrl + mediaUrl;
            } else {
                mediaUrl = this.resourceServerUrl + '/' + mediaUrl;
            }
        }
        
        const mediaName = media.name || '未命名文件';
        
        let display = `${typeName}：${mediaName}\n\n`;
        
        // 根据媒体类型生成不同的显示格式
        switch (media.type) {
            case 'image':
                display += `![${item.title}的${typeName}](${mediaUrl})\n\n`;
                break;
            case 'video':
                display += `<video controls width="100%">\n`;
                display += `  <source src="${mediaUrl}" type="video/mp4">\n`;
                display += `  您的浏览器不支持视频播放。\n`;
                display += `</video>\n\n`;
                break;
            case 'audio':
                display += `<audio controls>\n`;
                display += `  <source src="${mediaUrl}" type="audio/mpeg">\n`;
                display += `  您的浏览器不支持音频播放。\n`;
                display += `</audio>\n\n`;
                break;
            case 'document':
                display += ` [${mediaName}](${mediaUrl})\n\n`;
                break;
            default:
                display += ` [${mediaName}](${mediaUrl})\n\n`;
        }
        
        // 添加描述信息
        if (item.description) {
            display += ` 说明：${item.description}\n\n`;
        }
        
        return display;
    }



    generateGeneralResponse(input) {
        // 检查是否是问候语
        if (input.includes('你好') || input.includes('问候') || input.includes('早上好') ||
            input.includes('晚上好') || input.includes('下午好')) {
            return this.generateGreetingResponse();
        } 
        
        // 检查是否是感谢语
        if (input.includes('谢谢') || input.includes('感谢') || input.includes('多谢')) {
            return this.generateThanksResponse();
        }

        // 检查是否是类别查询
        const categoryResponse = this.handleCategoryQuery(input);
        if (categoryResponse) {
            return categoryResponse;
        }

        // 提供推荐
        return this.generateMixedRecommendation();
    }

    handleCategoryQuery(input) {
        const categoryKeywords = {
            'traditionalFoods': ['美食', '食物', '菜', '吃', '烹饪', '料理', '菜系', '小吃', '传统美食'],
            'traditionalCrafts': ['工艺', '手工艺', '制作', '技艺', '传统工艺', '手工', '艺术'],
            'traditionalOpera': ['戏曲', '戏剧', '京剧', '昆曲', '越剧', '黄梅戏', '传统戏曲'],
            'traditionalFestivals': ['节日', '节庆', '传统节日', '民俗', '习俗', '庆典'],
            'traditionalMedicine': ['医药', '中医', '中药', '传统医药', '养生', '治疗', '药材'],
            'traditionalArchitecture': ['建筑', '古建筑', '传统建筑', '房屋', '建筑风格', '建筑艺术']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return this.generateCategoryOverview(category);
            }
        }

        return null;
    }

    generateCategoryOverview(category) {
        const categoryInfo = {
            'traditionalFoods': {
                name: '传统美食',
                description: '中华传统美食源远流长，融合了各地的烹饪技艺和文化特色。',
                examples: ['过桥米线', '小笼包', '麻婆豆腐', '北京烤鸭', '宫保鸡丁']
            },
            'traditionalCrafts': {
                name: '传统工艺',
                description: '中国传统工艺凝聚了古代匠人的智慧和技艺，体现了深厚的文化底蕴。',
                examples: ['景泰蓝', '刺绣', '陶瓷', '木雕', '剪纸']
            },
            'traditionalOpera': {
                name: '传统戏曲',
                description: '中国传统戏曲是中华文化的瑰宝，融合了音乐、舞蹈、文学等多种艺术形式。',
                examples: ['京剧', '昆曲', '越剧', '黄梅戏', '豫剧']
            },
            'traditionalFestivals': {
                name: '传统节日',
                description: '中国传统节日承载着深厚的文化内涵，体现了中华民族的精神追求。',
                examples: ['春节', '端午节', '中秋节', '清明节', '重阳节']
            },
            'traditionalMedicine': {
                name: '传统医药',
                description: '中医中药是中华文明的重要组成部分，具有独特的理论体系和治疗方法。',
                examples: ['中医', '针灸', '中药', '推拿', '艾灸']
            },
            'traditionalArchitecture': {
                name: '传统建筑',
                description: '中国传统建筑体现了天人合一的哲学思想，具有独特的建筑风格和美学价值。',
                examples: ['故宫', '苏州园林', '四合院', '徽派建筑', '客家土楼']
            }
        };

        const info = categoryInfo[category];
        if (!info) return null;

        let response = ` **${info.name}**\n\n${info.description}\n\n📋 **代表项目：**\n`;
        
        info.examples.forEach((example, index) => {
            response += `${index + 1}. ${example}\n`;
        });

        response += `\n\n **请告诉我您想了解哪个具体项目，我很乐意为您详细介绍！**`;

        return response;
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
                'traditionalFoods': '传统美食',
                'traditionalCrafts': '传统工艺',
                'traditionalOpera': '传统戏曲',
                'traditionalFestivals': '传统节日',
                'traditionalMedicine': '传统医药',
                'traditionalArchitecture': '传统建筑'
            };
            const categoryName = categoryNames[item.category] || '传统文化';
            itemsList += `${index + 1}. **${item.title}**（${categoryName}）\n`;
            
            // 添加简短描述
            if (item.description) {
                const shortDesc = item.description.length > 50 ? 
                    item.description.substring(0, 50) + '...' : 
                    item.description;
                itemsList += `   ${shortDesc}\n`;
            }
            itemsList += '\n';
        });
        
        return ` **为您推荐以下精彩内容：**\n\n${itemsList}\n\n **请告诉我您感兴趣的类别或具体项目，我很乐意为您详细介绍！**`;
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

    /**
     * 智能判断是否应该显示简介
     * @param {string} questionType - 问题类型
     * @param {string} originalQuestion - 原始问题
     * @returns {boolean} - 是否应该显示简介
     */
    shouldShowDescription(questionType, originalQuestion) {
        // 如果是综合介绍或首次询问，显示简介
        if (originalQuestion.includes('介绍') || originalQuestion.includes('详细')) {
            return true;
        }
        
        // 如果是具体问题（位置、历史、特色等），不显示简介，避免重复
        const specificQuestions = ['location', 'history', 'features', 'technique', 'culture', 'title', 'type'];
        if (specificQuestions.includes(questionType)) {
            return false;
        }
        
        // 如果是媒体生成请求，不显示简介
        if (questionType === 'mediaGeneration') {
            return false;
        }
        
        // 默认不显示简介
        return false;
    }
}
