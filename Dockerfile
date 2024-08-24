FROM node:21-alpine
WORKDIR /server
COPY ./package.json ./
RUN npm install
COPY ./ ./
CMD [ "npm","start" ]