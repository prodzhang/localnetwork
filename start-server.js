#!/usr/bin/env node

const readline = require('readline');
const { stdin: input, stdout: output } = require('process');
const rl = readline.createInterface({ input, output });

// 配置
const config = {
    port: parseInt(process.env.PORT || '23999', 10),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '1024', 10),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    cacheEnabled: process.env.CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.CACHE_TTL || '60', 10)
};

// 创建一个消息队列来处理请求
const messageQueue = [];
let isProcessing = false;

// 处理MCP请求
async function handleRequest(request) {
    try {
        const { method, params } = request;

        switch (method) {
            case 'mcp_fetch_mcp_fetch_txt':
            case 'mcp_fetch_mcp_fetch_json':
                const axios = require('axios');
                const response = await axios.get(params.url);
                return {
                    success: true,
                    result: response.data
                };

            case 'mcp_swagger_mcp_server_parse_swagger':
            case 'mcp_swagger_mcp_server_parse_swagger_optimized':
            case 'mcp_swagger_mcp_server_parse_swagger_lite':
                const { url } = params;
                const axios2 = require('axios');
                const response2 = await axios2.get(url);
                return {
                    success: true,
                    result: {
                        content: response2.data,
                        url: url
                    }
                };

            case 'mcp_swagger_mcp_server_file_writer':
                const fs = require('fs');
                const path = require('path');
                const { filePath, content, createDirs = true } = params;

                if (createDirs) {
                    const dir = path.dirname(filePath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                }

                fs.writeFileSync(filePath, content);
                return {
                    success: true,
                    result: {
                        filePath,
                        bytesWritten: Buffer.from(content).length
                    }
                };

            default:
                return {
                    success: false,
                    error: `不支持的方法: ${method}`
                };
        }
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// 处理消息队列
async function processQueue() {
    if (isProcessing || messageQueue.length === 0) return;

    isProcessing = true;
    const { request, resolve } = messageQueue.shift();

    try {
        const response = await handleRequest(request);
        resolve(response);
    } catch (error) {
        resolve({
            success: false,
            error: error.message
        });
    }

    isProcessing = false;
    processQueue();
}

// 读取和处理输入
rl.on('line', async (line) => {
    try {
        const request = JSON.parse(line);
        
        // 将请求添加到队列
        const promise = new Promise(resolve => {
            messageQueue.push({ request, resolve });
        });

        // 处理队列
        processQueue();

        // 等待处理完成并发送响应
        const response = await promise;
        console.log(JSON.stringify(response));
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}); 