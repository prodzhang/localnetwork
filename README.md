# 局域网文件托管服务 MCP

这是一个简单的局域网文件托管服务，允许在局域网内轻松共享和下载文件。特别适合用于下载和托管 Swagger/OpenAPI 文档等文本文件。

## 安装

### 作为全局 MCP 安装

```bash
npm install -g @prodzhang/localnetwork-mcp
```

### 作为项目依赖安装

```bash
npm install @prodzhang/localnetwork-mcp
```

## 功能特点

- 文件上传和下载
- 从URL下载文件（特别适合Swagger/OpenAPI文档）
- 文件列表查看
- 文件删除
- 支持大文件（最大1GB）
- 跨域支持
- 简单的API接口

## 使用方法

### 作为独立服务运行

```bash
npx @prodzhang/localnetwork-mcp
```

或者如果全局安装了：

```bash
localnetwork-mcp
```

### 在代码中使用

```javascript
const server = require('@prodzhang/localnetwork-mcp');
// 服务器会自动在 23999 端口启动
```

服务器默认运行在 http://0.0.0.0:23999

## API 接口

### 获取文件列表
```
GET /api/files
```

### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data
```

### 从URL下载文件
```
POST /api/download-url
Content-Type: application/json

{
    "url": "http://example.com/file.json"
}
```

### 获取文件内容
```
GET /api/files/:filename/content
```

### 下载文件
```
GET /files/:filename
```

### 删除文件
```
DELETE /api/files/:filename
```

## 使用示例

### 使用 curl 从URL下载 Swagger 文档
```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"url":"http://swagger.in.codoon.com/doc/online_race.json"}' \
     http://localhost:23999/api/download-url
```

### 使用 curl 上传文件
```bash
curl -F "file=@/path/to/your/file.txt" http://localhost:23999/api/upload
```

### 使用 curl 获取文件内容
```bash
curl http://localhost:23999/api/files/file.json/content
```

### 使用 curl 下载文件
```bash
curl -O http://localhost:23999/files/file.txt
```

### 使用浏览器
直接访问 http://localhost:23999/files/filename 即可下载文件

## 注意事项

1. 默认端口为23999，可通过环境变量 PORT 修改
2. 文件存储在项目根目录的 uploads 文件夹中
3. 支持的最大文件大小为1GB
4. URL下载功能支持任意文本文件，特别适合下载JSON、Swagger等文档

## 许可证

MIT 