FROM node:19-alpine as first_stage
WORKDIR /ROOMBOOKINGAPP
COPY package*.json .
RUN npm install
COPY . .

FROM first_stage
RUN npm install --production
COPY . .
CMD ['node', 'server.js']
