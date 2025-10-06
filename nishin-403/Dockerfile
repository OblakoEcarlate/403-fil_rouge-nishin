FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) zip pdo_mysql mbstring exif pcntl gd

# Install MongoDB extension
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN composer require mongodb/laravel-mongodb

# Create working directory and set permissions
RUN mkdir -p /var/www/html \
    && chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www

# Create storage directory structure with correct permissions
RUN mkdir -p /var/www/html/storage/framework/{cache,sessions,views} \
    && mkdir -p /var/www/html/storage/logs \
    && chown -R www-data:www-data /var/www/html/storage \
    && chmod -R 775 /var/www/html/storage

# Set working directory
WORKDIR /var/www/html

# Switch to www-data user
USER www-data
