FROM node:10.8.0-alpine AS builder

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .
RUN npm run-script build

EXPOSE 9998

ENTRYPOINT ["node", "./build/bin/start_server.js"]
