FROM node:20-alpine

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm ci

# Copiamos el resto del proyecto
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
