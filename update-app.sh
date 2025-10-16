#!/bin/bash

# ============================================
# 🔄 CREATIX QUICK UPDATE SCRIPT
# ============================================
# Fast update from GitHub (30 seconds)
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "🔄 CREATIX QUICK UPDATE"
echo "============================================"
echo -e "${NC}"

cd /root/Creatix

echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}\n"

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies updated${NC}\n"

echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}\n"

echo -e "${YELLOW}🔧 Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Database migrated${NC}\n"

echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build
echo -e "${GREEN}✅ Build complete${NC}\n"

echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart creatix
echo -e "${GREEN}✅ Application restarted${NC}\n"

echo -e "${GREEN}"
echo "============================================"
echo "✅ UPDATE COMPLETE!"
echo "============================================"
echo -e "${NC}"
echo ""
pm2 status
echo ""
echo -e "${BLUE}View logs: pm2 logs creatix${NC}"
echo ""

