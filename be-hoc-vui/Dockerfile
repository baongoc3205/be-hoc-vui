# Triển khai lên máy chủ: docker build -t be-hoc-vui . && docker run -p 5174:5174 -v bhv-data:/app/data be-hoc-vui
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY client/dist ./client/dist
ENV PORT=5174 DB_FILE=/app/data/behocvui.db NODE_ENV=production
EXPOSE 5174
VOLUME ["/app/data"]
CMD ["node", "server/index.js"]
