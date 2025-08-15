FROM node:22-alpine

WORKDIR /frontend

# Set environment variables for development
ENV NODE_ENV=development

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 19000 19001 8081

CMD ["npm", "run", "start:offline"]