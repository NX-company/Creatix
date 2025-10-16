#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Переход в директорию проекта
cd /root/Creatix

# Обновление кода
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Установка зависимостей
echo "📦 Installing dependencies..."
npm install

# Генерация Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Запуск миграций
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Сборка проекта
echo "🏗️ Building project..."
npm run build

# Проверка наличия BUILD_ID
if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ Build failed - BUILD_ID not found!"
  exit 1
fi

# Перезапуск PM2
echo "🔄 Restarting PM2..."
pm2 restart creatix || pm2 start npm --name "creatix" -- start

# Сохранение конфигурации PM2
pm2 save

echo "✅ Deployment completed successfully!"
echo "🌐 Application is running at https://aicreatix.ru"

# Проверка статуса
pm2 status

