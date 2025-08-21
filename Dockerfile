FROM node:20-alpine

WORKDIR /r1calculator

COPY . .

RUN npm ci

RUN npm run build

CMD ["npm", "start"]