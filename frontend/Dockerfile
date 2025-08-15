FROM node:22-alpine

WORKDIR /frontend

COPY package.json .

RUN npm install

COPY . .

EXPOSE 19000 19001 8081

CMD ["npm", "run", "start:tunnel"]