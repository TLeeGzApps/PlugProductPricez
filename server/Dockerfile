FROM node:20-alpine

WORKDIR /usr/src/app

# Copy server files
COPY package.json package-lock.json* ./ 
RUN npm ci --production

# Copy code
COPY . .

# Ensure data directory exists (SQLite file will be created automatically)
RUN mkdir -p /usr/src/app/../data

EXPOSE 3000
CMD ["node", "server.js"]
