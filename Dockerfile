FROM node:19-alpine as First_stage
WORKDIR /ROOMBOOKINGAPP
COPY Package*.json .
RUN npm install
COPY . .

FROM First_stage
RUN npm install --production
COPY . .
CMD ['node', 'Server.js']
