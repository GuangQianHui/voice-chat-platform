/**
 * 协议自适应修复脚本
 * 自动检测当前协议并修复资源链接
 */
(function() {
    'use strict';

    // 检测当前协议
    const currentProtocol = window.location.protocol;
    const isHttps = currentProtocol === 'https:';
    const isHttp = currentProtocol === 'http:';
    const currentHost = window.location.host;
    
    console.log('当前协议:', currentProtocol);
    console.log('当前主机:', currentHost);
    console.log('是否HTTPS:', isHttps);
    console.log('是否HTTP:', isHttp);

    // 强制使用HTTPS（如果可能）
    if (isHttp && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
        const httpsUrl = window.location.href.replace('http://', 'https://');
        console.log('重定向到HTTPS:', httpsUrl);
        window.location.href = httpsUrl;
        return;
    }

    // 修复资源链接
    function fixResourceLinks() {
        // 修复CSS文件
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        cssLinks.forEach(link => {
            if (link.href && link.href.startsWith('http://')) {
                link.href = link.href.replace('http://', 'https://');
            }
        });

        // 修复图片资源
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && img.src.startsWith('http://')) {
                img.src = img.src.replace('http://', 'https://');
            }
        });

        // 修复favicon
        const favicons = document.querySelectorAll('link[rel*="icon"]');
        favicons.forEach(icon => {
            if (icon.href && icon.href.startsWith('http://')) {
                icon.href = icon.href.replace('http://', 'https://');
            }
        });
    }

    // 修复脚本加载
    function fixScriptLoading() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (script.src && script.src.startsWith('http://')) {
                const newSrc = script.src.replace('http://', 'https://');
                script.src = newSrc;
            }
        });
    }

    // 创建协议自适应函数
    function createProtocolAdaptiveUrl(url) {
        if (!url) return url;
        
        // 如果是相对路径，直接返回
        if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            return url;
        }
        
        // 如果是绝对路径，根据当前协议调整
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }
        
        return url;
    }

    // 重写fetch以处理协议问题
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        const adaptiveUrl = createProtocolAdaptiveUrl(url);
        return originalFetch(adaptiveUrl, options);
    };

    // 重写XMLHttpRequest以处理协议问题
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        const adaptiveUrl = createProtocolAdaptiveUrl(url);
        return originalOpen.call(this, method, adaptiveUrl, async, user, password);
    };

    // 页面加载完成后执行修复
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            fixResourceLinks();
            fixScriptLoading();
        });
    } else {
        fixResourceLinks();
        fixScriptLoading();
    }

    // 监听动态添加的元素
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查新添加的元素中的资源链接
                        const newImages = node.querySelectorAll ? node.querySelectorAll('img') : [];
                        const newLinks = node.querySelectorAll ? node.querySelectorAll('link[rel="stylesheet"]') : [];
                        const newScripts = node.querySelectorAll ? node.querySelectorAll('script[src]') : [];
                        
                        [...newImages, ...newLinks, ...newScripts].forEach(element => {
                            if (element.src && element.src.startsWith('http://')) {
                                element.src = element.src.replace('http://', 'https://');
                            }
                            if (element.href && element.href.startsWith('http://')) {
                                element.href = element.href.replace('http://', 'https://');
                            }
                        });
                    }
                });
            }
        });
    });

    // 开始观察DOM变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 导出工具函数供其他脚本使用
    window.ProtocolFix = {
        createProtocolAdaptiveUrl: createProtocolAdaptiveUrl,
        fixResourceLinks: fixResourceLinks,
        fixScriptLoading: fixScriptLoading
    };

    console.log('协议自适应修复脚本已加载');
})();
