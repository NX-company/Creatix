#!/bin/bash
# Automatic server database setup script
# Run with: bash fix-server-db.sh

SERVER="root@45.129.128.121"
PASSWORD="pzaNtMznbq@hw3"

echo "🚀 FIXING SERVER DATABASE..."
echo ""

# Single SSH command to do everything
ssh -o StrictHostKeyChecking=no $SERVER << 'ENDSSH'

echo "📦 Step 1: Creating PostgreSQL database and user..."
sudo -u postgres psql -c "CREATE DATABASE creatix_db;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER creatix_user WITH PASSWORD 'creatix_secure_2025';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE creatix_db TO creatix_user;"
sudo -u postgres psql -d creatix_db -c "GRANT ALL ON SCHEMA public TO creatix_user;"
echo "✅ Database setup complete!"
echo ""

echo "📋 Step 2: Running Prisma migrations..."
cd /root/Creatix
npx prisma migrate deploy
echo "✅ Migrations complete!"
echo ""

echo "🔄 Step 3: Restarting PM2..."
pm2 restart creatix
echo "✅ PM2 restarted!"
echo ""

echo "📊 Step 4: Checking logs..."
pm2 logs creatix --lines 20 --nostream
echo ""
echo "✅ ALL DONE!"

ENDSSH

echo ""
echo "🌐 Check your site: https://aicreatix.ru"
echo ""

