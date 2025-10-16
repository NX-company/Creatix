#!/bin/bash

# ============================================
# 🚀 CREATIX AUTO-DEPLOYMENT SCRIPT
# ============================================
# Timeweb VPS Setup - Ubuntu 24.04
# Автоматическая установка всего за 5 минут!
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "🚀 CREATIX DEPLOYMENT SCRIPT"
echo "============================================"
echo -e "${NC}"

# ============================================
# 1. UPDATE SYSTEM
# ============================================
echo -e "${YELLOW}📦 Step 1/10: Updating system...${NC}"
apt update -y
apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}\n"

# ============================================
# 2. INSTALL NODE.JS 20.x
# ============================================
echo -e "${YELLOW}📦 Step 2/10: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
echo -e "${GREEN}✅ Node.js installed${NC}\n"

# ============================================
# 3. INSTALL GIT
# ============================================
echo -e "${YELLOW}📦 Step 3/10: Installing Git...${NC}"
apt install -y git
git --version
echo -e "${GREEN}✅ Git installed${NC}\n"

# ============================================
# 4. INSTALL PM2
# ============================================
echo -e "${YELLOW}📦 Step 4/10: Installing PM2...${NC}"
npm install -g pm2
pm2 -v
echo -e "${GREEN}✅ PM2 installed${NC}\n"

# ============================================
# 5. INSTALL NGINX
# ============================================
echo -e "${YELLOW}📦 Step 5/10: Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v
echo -e "${GREEN}✅ Nginx installed${NC}\n"

# ============================================
# 6. INSTALL POSTGRESQL
# ============================================
echo -e "${YELLOW}📦 Step 6/10: Installing PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE creatix;"
sudo -u postgres psql -c "CREATE USER creatix WITH PASSWORD 'creatix_secure_password_2024';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE creatix TO creatix;"
sudo -u postgres psql -d creatix -c "GRANT ALL ON SCHEMA public TO creatix;"
echo -e "${GREEN}✅ PostgreSQL installed and configured${NC}\n"

# ============================================
# 7. CLONE PROJECT
# ============================================
echo -e "${YELLOW}📦 Step 7/10: Cloning project from GitHub...${NC}"
cd /root
if [ -d "Creatix" ]; then
    echo "⚠️  Creatix directory exists, removing..."
    rm -rf Creatix
fi
git clone https://github.com/NX-company/Creatix.git
cd Creatix
echo -e "${GREEN}✅ Project cloned${NC}\n"

# ============================================
# 8. SETUP ENVIRONMENT
# ============================================
echo -e "${YELLOW}📦 Step 8/10: Setting up environment...${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file with your API keys${NC}"
    echo ""
    echo "Required variables:"
    echo "  - NEXTAUTH_SECRET"
    echo "  - NEXTAUTH_URL"
    echo "  - DATABASE_URL"
    echo "  - OPENROUTER_API_KEY"
    echo "  - REPLICATE_API_TOKEN"
    echo "  - OPENAI_API_KEY"
    echo ""
    echo "Copy .env.example to .env and fill in the values"
    exit 1
fi

echo -e "${GREEN}✅ Environment configured${NC}\n"

# ============================================
# 9. INSTALL DEPENDENCIES & BUILD
# ============================================
echo -e "${YELLOW}📦 Step 9/10: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}\n"

echo -e "${YELLOW}🔧 Running database migrations...${NC}"
npx prisma migrate deploy
echo -e "${GREEN}✅ Database migrated${NC}\n"

echo -e "${YELLOW}🏗️  Building Next.js application...${NC}"
npm run build
echo -e "${GREEN}✅ Application built${NC}\n"

# ============================================
# 10. START APPLICATION WITH PM2
# ============================================
echo -e "${YELLOW}📦 Step 10/10: Starting application...${NC}"

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'creatix',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Stop if already running
pm2 delete creatix 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✅ Application started with PM2${NC}\n"

# ============================================
# 11. CONFIGURE NGINX
# ============================================
echo -e "${YELLOW}🔧 Configuring Nginx...${NC}"

cat > /etc/nginx/sites-available/creatix << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/creatix /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}\n"

# ============================================
# 12. CONFIGURE FIREWALL
# ============================================
echo -e "${YELLOW}🔒 Configuring firewall...${NC}"
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 3000/tcp
echo -e "${GREEN}✅ Firewall configured${NC}\n"

# ============================================
# FINAL STATUS
# ============================================
echo -e "${GREEN}"
echo "============================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📊 Application Status:${NC}"
pm2 status
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo "  • HTTP: http://45.129.128.121"
echo "  • Direct: http://45.129.128.121:3000"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo "  • View logs:     pm2 logs creatix"
echo "  • Restart app:   pm2 restart creatix"
echo "  • Stop app:      pm2 stop creatix"
echo "  • PM2 status:    pm2 status"
echo "  • Update app:    cd /root/Creatix && bash update-app.sh"
echo ""
echo -e "${BLUE}📂 Project Location:${NC}"
echo "  /root/Creatix"
echo ""
echo -e "${GREEN}🎉 Creatix is now running!${NC}"
echo ""

