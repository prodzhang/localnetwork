#!/usr/bin/env node

// 如果直接运行这个文件，启动服务器
if (require.main === module) {
    require('./src/server');
} else {
    // 如果作为模块导入，导出服务器
    module.exports = require('./src/server');
} 