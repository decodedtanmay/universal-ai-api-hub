#!/usr/bin/env sh
set -eu

if [ -n "${APP_KEY:-}" ] && [ "${APP_KEY#base64:}" = "${APP_KEY}" ]; then
    export APP_KEY="base64:${APP_KEY}"
fi

php artisan migrate --force --seed
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

port="${PORT:-10000}"
sed -i "s/Listen 80/Listen ${port}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
