# Stage 1: Compilar la aplicación React con Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código de la aplicación
COPY . .

# Compilar para producción
RUN npm run build

# Stage 2: Servir los assets compilados con Nginx
FROM nginx:stable-alpine

# Copiar los archivos compilados a la carpeta pública de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la configuración personalizada de Nginx para SPAs
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
