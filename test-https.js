/**
 * HTTPS配置测试脚本
 */
const https = require('https');
const http = require('http');

const testUrls = [
    'https://localhost:25812/api/health',
    'http://localhost:25812/api/health'
];

console.log('🔍 开始测试HTTPS配置...\n');

async function testUrl(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        const timeout = setTimeout(() => {
            console.log(`❌ ${url} - 超时`);
            resolve(false);
        }, 5000);

        protocol.get(url, (res) => {
            clearTimeout(timeout);
            console.log(`✅ ${url} - 状态码: ${res.statusCode}`);
            console.log(`   协议: ${res.socket.encrypted ? 'HTTPS' : 'HTTP'}`);
            console.log(`   安全连接: ${res.socket.encrypted ? '是' : '否'}`);
            console.log('');
            resolve(true);
        }).on('error', (err) => {
            clearTimeout(timeout);
            console.log(`❌ ${url} - 错误: ${err.message}`);
            console.log('');
            resolve(false);
        });
    });
}

async function runTests() {
    console.log('测试HTTPS连接...');
    const httpsResult = await testUrl(testUrls[0]);
    
    console.log('测试HTTP连接...');
    const httpResult = await testUrl(testUrls[1]);
    
    console.log('📊 测试结果汇总:');
    console.log(`HTTPS: ${httpsResult ? '✅ 成功' : '❌ 失败'}`);
    console.log(`HTTP:  ${httpResult ? '✅ 成功' : '❌ 失败'}`);
    
    if (httpsResult) {
        console.log('\n🎉 HTTPS配置成功！');
        console.log('建议使用: https://localhost:25812');
    } else if (httpResult) {
        console.log('\n⚠️  HTTPS配置失败，但HTTP可用');
        console.log('建议使用: http://localhost:25812');
    } else {
        console.log('\n❌ 所有连接都失败');
        console.log('请检查服务器是否正在运行');
    }
}

runTests();
