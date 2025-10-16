#!/bin/bash

# Upload .env to Timeweb Server
# Usage: bash upload-env.sh

SERVER="root@45.129.128.121"
APP_PATH="/var/www/creatix"

echo ""
echo "🚀 UPLOADING .ENV TO SERVER..."
echo ""

# Step 1: Upload .env
echo "📤 Step 1: Uploading server.env as .env..."
scp -o StrictHostKeyChecking=no server.env $SERVER:$APP_PATH/.env

if [ $? -eq 0 ]; then
    echo "✅ .env uploaded successfully!"
else
    echo "❌ Failed to upload .env"
    exit 1
fi

# Step 2: Restart PM2
echo ""
echo "🔄 Step 2: Restarting PM2..."
ssh -o StrictHostKeyChecking=no $SERVER "cd $APP_PATH && pm2 restart creatix && pm2 save"

if [ $? -eq 0 ]; then
    echo "✅ PM2 restarted successfully!"
else
    echo "❌ Failed to restart PM2"
    exit 1
fi

# Step 3: Show logs
echo ""
echo "📋 Step 3: Showing logs..."
ssh -o StrictHostKeyChecking=no $SERVER "pm2 logs creatix --lines 30 --nostream"

echo ""
echo "✅ UPLOAD COMPLETE!"
echo "🌐 Check your site: https://aicreatix.ru"
echo ""

