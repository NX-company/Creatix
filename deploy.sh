#!/bin/bash
set -e

echo "🚀 Starting full deployment for Creatix..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd /root/Creatix

echo -e "${BLUE}📦 Step 1/9: Stopping PM2...${NC}"
pm2 stop creatix || echo "App not running"

echo -e "${BLUE}📦 Step 2/9: Pulling latest code from GitHub...${NC}"
git pull origin main

echo -e "${BLUE}📦 Step 3/9: Installing dependencies...${NC}"
npm install

echo -e "${BLUE}📦 Step 4/9: Copying .env file...${NC}"
if [ -f server.env ]; then
  cp server.env .env
  echo -e "${GREEN}✅ .env file copied${NC}"
else
  echo -e "${RED}⚠️  server.env not found, using existing .env${NC}"
fi

echo -e "${BLUE}📦 Step 5/9: Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${BLUE}📦 Step 6/9: Running database migrations...${NC}"
npx prisma db push --accept-data-loss

echo -e "${BLUE}📦 Step 7/9: Building production bundle (this may take 2-3 minutes)...${NC}"
ESLINT_NO_DEV_ERRORS=true npm run build

echo -e "${BLUE}📦 Step 8/9: Verifying build...${NC}"
if [ ! -f ".next/BUILD_ID" ]; then
  echo -e "${RED}❌ Build failed - BUILD_ID not found!${NC}"
  exit 1
fi

BUILD_ID=$(cat .next/BUILD_ID)
echo -e "${GREEN}✅ Build successful! BUILD_ID: $BUILD_ID${NC}"

echo -e "${BLUE}📦 Step 9/9: Restarting PM2...${NC}"
pm2 restart creatix || pm2 start npm --name "creatix" -- start
pm2 save

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Application: https://aicreatix.ru${NC}"
echo ""
echo -e "${BLUE}📊 Checking application status...${NC}"
pm2 status
echo ""
echo -e "${BLUE}📝 Last 20 lines of logs:${NC}"
pm2 logs creatix --lines 20 --nostream
