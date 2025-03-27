FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 创建uploads目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=23999

# 暴露端口
EXPOSE 23999

# 启动服务器
CMD ["node", "index.js"]
