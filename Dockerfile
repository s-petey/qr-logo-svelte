FROM node:18-alpine
WORKDIR /app
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]