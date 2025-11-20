FROM php:8.2-apache

# 1. Sisteminės priklausomybės: git, zip, unzip, libzip-dev
# 2. PHP extension'ai: pdo_mysql, zip
# 3. Įjungiam mod_rewrite
RUN apt-get update && apt-get install -y \
    git \
    zip \
    unzip \
    libzip-dev \
 && docker-php-ext-install pdo pdo_mysql zip \
 && a2enmod rewrite \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .

RUN composer install --no-dev --optimize-autoloader \
 && chown -R www-data:www-data storage bootstrap/cache

RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
 && sed -ri -e 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
 && sed -ri -e 's!<VirtualHost \*:80>!<VirtualHost *:8080>!' /etc/apache2/sites-available/000-default.conf

EXPOSE 8080
CMD ["apache2-foreground"]

