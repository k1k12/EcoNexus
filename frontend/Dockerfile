FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install
RUN npm rebuild lightningcss

COPY . .

EXPOSE 8081

CMD ["npm", "start"]
