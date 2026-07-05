# ==========================================
# Etapa 1: Compilar Frontend (Node.js + Vite)
# ==========================================
FROM node:20-alpine as frontend

WORKDIR /app

# Copiar archivos de dependencias de Node
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci || npm install

# Copiar el resto del código y compilar assets
COPY . .
RUN npm run build

# ==========================================
# Etapa 2: Instalar Dependencias PHP (Composer)
# ==========================================
FROM composer:2 as vendor

WORKDIR /app

# Copiar archivos de dependencias de PHP
COPY composer.json composer.lock* ./

# Instalar dependencias sin scripts ni autoloader todavía (para cachear)
RUN composer install \
    --ignore-platform-reqs \
    --no-interaction \
    --no-plugins \
    --no-scripts \
    --no-dev \
    --prefer-dist

# Copiar el resto del código
COPY . .

# Generar el autoloader optimizado sin ejecutar scripts de Laravel (que fallan sin el .env)
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative --no-scripts

# ==========================================
# Etapa 3: Imagen de Producción (Apache + PHP 8.2)
# ==========================================
FROM php:8.2-apache

# Habilitar mod_rewrite de Apache para Laravel
RUN a2enmod rewrite

# Instalar dependencias del sistema y extensiones de PHP necesarias para Supabase (PostgreSQL)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configurar el DocumentRoot de Apache para que apunte a la carpeta /public de Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Establecer el directorio de trabajo
WORKDIR /var/www/html

# Copiar código fuente base
COPY . /var/www/html

# Sobrescribir vendor desde la etapa de Composer
COPY --from=vendor /app/vendor/ /var/www/html/vendor/

# Sobrescribir archivos compilados desde la etapa de Node
COPY --from=frontend /app/public/build/ /var/www/html/public/build/

# Asegurar los permisos correctos para que Apache pueda escribir en las carpetas necesarias
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Exponer el puerto 80
EXPOSE 80
