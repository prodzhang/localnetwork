const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 23999;
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 中间件配置
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 1024 * 1024 * 1024 // 限制文件大小为1GB
    }
}));

// 静态文件服务
app.use('/files', express.static(UPLOAD_DIR));

// 从URL下载文件
app.post('/api/download-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: '请提供URL' });
        }

        // 生成文件名（使用URL的最后部分，如果没有则使用时间戳）
        let filename = path.basename(url);
        if (!filename || filename.length < 3) {
            const timestamp = Date.now();
            const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
            filename = `file_${timestamp}_${hash}.json`;
        }

        const filePath = path.join(UPLOAD_DIR, filename);

        // 下载文件
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'text',
            timeout: 30000, // 30秒超时
        });

        // 保存文件
        fs.writeFileSync(filePath, response.data);

        // 获取文件信息
        const stats = fs.statSync(filePath);

        res.json({
            message: '文件下载成功',
            filename: filename,
            size: stats.size,
            url: `/files/${filename}`,
            content: response.data // 同时返回文件内容
        });
    } catch (error) {
        res.status(500).json({ 
            error: '下载文件失败',
            details: error.message 
        });
    }
});

// 获取所有文件列表
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(UPLOAD_DIR)
            .map(filename => {
                const filePath = path.join(UPLOAD_DIR, filename);
                const stats = fs.statSync(filePath);
                return {
                    name: filename,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    url: `/files/${filename}`
                };
            });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 上传文件
app.post('/api/upload', (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ error: '没有文件被上传' });
        }

        const file = req.files.file;
        const filePath = path.join(UPLOAD_DIR, file.name);

        file.mv(filePath, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                message: '文件上传成功',
                filename: file.name,
                size: file.size,
                url: `/files/${file.name}`
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除文件
app.delete('/api/files/:filename', (req, res) => {
    try {
        const filePath = path.join(UPLOAD_DIR, req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }

        fs.unlinkSync(filePath);
        res.json({ message: '文件删除成功' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 获取文件内容
app.get('/api/files/:filename/content', (req, res) => {
    try {
        const filePath = path.join(UPLOAD_DIR, req.params.filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '文件不存在' });
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    console.log(`文件上传目录: ${UPLOAD_DIR}`);
}); 