FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV AWS_ACCESS_KEY_ID=<ACCESS_KEY_PLACEHOLDER>

ENV AWS_SECRET_ACCESS_KEY=<SECRET_KEY_PLACEHOLDER>

CMD [ "npm", "run", "start-worker" ]