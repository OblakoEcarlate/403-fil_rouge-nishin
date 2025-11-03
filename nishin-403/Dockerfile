# ==============================
# 🐘 Base image
# ==============================
FROM php:8.3-fpm

# ==============================
# 📦 Préparation de l’environnement
# ==============================

# Installer les extensions nécessaires à Laravel + MongoDB
RUN apt-get update && apt-get install -y \
    git unzip libpng-dev libonig-dev libxml2-dev libzip-dev zip curl \
    pkg-config libssl-dev libsasl2-dev \
 && docker-php-ext-install pdo pdo_mysql zip \
 && pecl install mongodb \
 && docker-php-ext-enable mongodb \
 && rm -rf /var/lib/apt/lists/*

# Installer Composer globalement
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ==============================
# 📁 Dossier de travail
# ==============================
WORKDIR /var/www/html

# Copier d’abord les fichiers de dépendances pour profiter du cache Docker
COPY composer.json composer.lock ./

# Copier le reste du code source
COPY . .

# Installer les dépendances PHP (sans dev pour build)
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

RUN chown -R 1000:1000 storage bootstrap

# ==============================
# 🔒 Lancer sous www-data
# ==============================
USER www-data
