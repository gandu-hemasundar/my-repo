FROM node:19-alpine as first_stage
WORKDIR /ROOMBOOKINGAPP
COPY Package*.json .
RUN npm install
COPY . .

FROM first_stage
RUN npm install --production
COPY . .
CMD ['node', 'Server.js']
