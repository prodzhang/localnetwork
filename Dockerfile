FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 设置执行权限
RUN chmod +x src/server.js

# 设置环境变量
ENV NODE_ENV=production

# 启动服务器
CMD ["./src/server.js"] 