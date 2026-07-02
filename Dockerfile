ARG PROJECT=console-ui

# Stage 1: Build
FROM node:26-alpine AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --force
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:1.30-alpine
ARG PROJECT
COPY ./config/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/dist/$PROJECT/browser /usr/share/nginx/html
