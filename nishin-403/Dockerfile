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
    sudo \
    && rm -rf /var/lib/apt/lists/*

# TODO: à vérif cette ligne expérimentale
sudo apt update && sudo apt install php-mongodb

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) zip pdo_mysql mbstring exif pcntl gd

# Install MongoDB extension
RUN pecl install mongodb \
    && docker-php-ext-enable mongodb

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Create working directory
RUN mkdir -p /var/www/html

# Change ownership to allow both www-data and current user
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/html

# Install Laravel Pint in local environment
RUN if [ "$APP_ENV" = "local" ]; then \
    composer global require laravel/pint --dev && \
    ln -s /tmp/vendor/bin/pint /usr/local/bin/pint; \
fi

# Set working directory
WORKDIR /var/www/html

# Switch to www-data user
USER www-data
