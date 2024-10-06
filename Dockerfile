# Usa una imagen base de Node.js
FROM node:22-alpine3.19

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código
COPY . .

# Compila el proyecto (si usas TypeScript)
RUN npm run build

# Expone el puerto en el que corre la aplicación
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"]