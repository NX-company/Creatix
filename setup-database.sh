#!/bin/bash
# Setup Database on Timeweb Server

echo "🚀 Setting up database on server..."
echo ""

cd /root/Creatix

echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "🗄️ Step 2: Running database migrations..."
npx prisma migrate deploy

echo ""
echo "🔄 Step 3: Restarting application..."
pm2 restart creatix

echo ""
echo "📋 Step 4: Checking logs..."
pm2 logs creatix --lines 20 --nostream

echo ""
echo "✅ Setup complete!"
echo "🌐 Check your site: https://aicreatix.ru"

