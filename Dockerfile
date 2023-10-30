FROM node:14

RUN mkdir /app
WORKDIR /app
COPY . /app
RUN rm -rf /app/test
RUN npm install --only=prod

EXPOSE 2708/tcp
CMD ["npm","run","start"]
