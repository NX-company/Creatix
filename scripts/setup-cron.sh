#!/bin/bash

# Setup CRON for payment activation
# This script sets up a cron job to activate pending payments every 5 minutes

echo "🔧 Setting up CRON for automatic payment activation..."

# Check if CRON_SECRET_TOKEN exists
if ! grep -q "CRON_SECRET_TOKEN" .env.production; then
  # Generate random token
  CRON_TOKEN=$(openssl rand -hex 32)
  echo "" >> .env.production
  echo "# CRON Secret Token for activate-pending-payments" >> .env.production
  echo "CRON_SECRET_TOKEN=$CRON_TOKEN" >> .env.production
  echo "✅ Generated CRON_SECRET_TOKEN: $CRON_TOKEN"
else
  CRON_TOKEN=$(grep CRON_SECRET_TOKEN .env.production | cut -d '=' -f2)
  echo "✅ Using existing CRON_SECRET_TOKEN"
fi

# Create cron script
cat > /root/activate-payments-cron.sh << 'EOF'
#!/bin/bash
# Auto-activate pending payments
cd /root/Creatix
source .env.production
curl -X POST \
  http://localhost:3000/api/cron/activate-pending-payments \
  -H "Authorization: Bearer ${CRON_SECRET_TOKEN}" \
  -H "Content-Type: application/json" \
  >> /var/log/creatix-cron.log 2>&1
echo "$(date): Cron executed" >> /var/log/creatix-cron.log
EOF

chmod +x /root/activate-payments-cron.sh

echo "✅ Created cron script: /root/activate-payments-cron.sh"

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null | grep -v "activate-payments-cron"; echo "*/5 * * * * /root/activate-payments-cron.sh") | crontab -

echo "✅ Added cron job (runs every 5 minutes)"

# Show current crontab
echo ""
echo "📋 Current crontab:"
crontab -l

echo ""
echo "✅ CRON setup complete!"
echo "📊 Check logs: tail -f /var/log/creatix-cron.log"
echo "🔄 Manually run: /root/activate-payments-cron.sh"
