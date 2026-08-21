FROM php:8.3-fpm-alpine

# Extensões mínimas para rodar Laravel 13 em hospedagem compartilhada
# (HostGator/cPanel). Ajuste esta lista para casar com o painel real do
# projeto derivado — usar localmente algo que a produção não tem é como o
# ambiente local deixa de espelhar a produção sem ninguém perceber.
RUN apk add --no-cache \
        git curl bash unzip icu-dev libzip-dev oniguruma-dev \
        freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j$(nproc) pdo_mysql mbstring zip intl gd exif bcmath \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Roda como usuário não-root com o mesmo UID do host, para os arquivos
# criados no contêiner não ficarem como root no seu disco.
ARG UID=1000
ARG GID=1000
RUN addgroup -g ${GID} app 2>/dev/null || true \
    && adduser -u ${UID} -G app -s /bin/bash -D app 2>/dev/null || true \
    && chown -R ${UID}:${GID} /var/www/html

USER app
