#!/usr/bin/env node

const readline = require('readline');
const { stdin: input, stdout: output } = require('process');
const axios = require('axios');
const NodeCache = require('node-cache');
const url = require('url');

// 创建缓存实例
const cache = new NodeCache({
    stdTTL: parseInt(process.env.CACHE_TTL || '300', 10), // 默认缓存5分钟
    checkperiod: 120
});

// 配置
const config = {
    timeout: parseInt(process.env.REQUEST_TIMEOUT || '5000', 10),
    maxRedirects: parseInt(process.env.MAX_REDIRECTS || '5', 10),
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    defaultHeaders: {
        'User-Agent': 'LocalNet-MCP/1.0.0'
    }
};

// 创建请求客户端
const client = axios.create({
    timeout: config.timeout,
    maxRedirects: config.maxRedirects,
    headers: config.defaultHeaders,
    validateStatus: null // 允许所有状态码
});

// 处理请求
async function handleRequest(method, params) {
    switch (method) {
        case 'localnet_request':
            const { url: targetUrl, method: httpMethod = 'GET', headers = {}, data, cacheKey } = params;

            // 如果启用缓存且是GET请求，先检查缓存
            if (config.cacheEnabled && httpMethod === 'GET' && cacheKey) {
                const cachedResponse = cache.get(cacheKey);
                if (cachedResponse) {
                    return {
                        success: true,
                        result: {
                            ...cachedResponse,
                            fromCache: true
                        }
                    };
                }
            }

            // 发送请求
            try {
                const response = await client({
                    url: targetUrl,
                    method: httpMethod,
                    headers: { ...config.defaultHeaders, ...headers },
                    data: data,
                    responseType: 'text'
                });

                const result = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    data: response.data,
                    fromCache: false
                };

                // 如果是成功的GET请求且启用了缓存，保存到缓存
                if (config.cacheEnabled && httpMethod === 'GET' && response.status >= 200 && response.status < 300 && cacheKey) {
                    cache.set(cacheKey, result);
                }

                return {
                    success: true,
                    result
                };
            } catch (error) {
                return {
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code,
                        response: error.response ? {
                            status: error.response.status,
                            statusText: error.response.statusText,
                            data: error.response.data
                        } : null
                    }
                };
            }

        case 'localnet_health_check':
            const { url: healthUrl } = params;

            try {
                const startTime = Date.now();
                const response = await client.get(healthUrl);
                const endTime = Date.now();

                return {
                    success: true,
                    result: {
                        status: response.status,
                        responseTime: endTime - startTime,
                        healthy: response.status >= 200 && response.status < 300,
                        timestamp: new Date().toISOString()
                    }
                };
            } catch (error) {
                return {
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code
                    }
                };
            }

        default:
            throw new Error(`不支持的方法: ${method}`);
    }
}

// 创建readline接口
const rl = readline.createInterface({ input, output });

// 处理输入
rl.on('line', async (line) => {
    try {
        const request = JSON.parse(line);
        const { method, params } = request;

        try {
            const response = await handleRequest(method, params);
            console.log(JSON.stringify(response));
        } catch (error) {
            console.log(JSON.stringify({
                success: false,
                error: {
                    message: error.message
                }
            }));
        }
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: {
                message: '无效的JSON请求'
            }
        }));
    }
}); 