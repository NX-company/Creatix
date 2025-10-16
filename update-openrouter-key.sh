#!/bin/bash
# Update OpenRouter key on server

cd /root/Creatix

# Backup old .env
cp .env .env.backup

# Replace OpenRouter key
sed -i 's/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=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/' .env

echo "✅ OpenRouter key updated!"
echo ""
echo "Testing new key..."

KEY=$(grep OPENROUTER_API_KEY .env | cut -d'=' -f2)
curl -s -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemini-2.0-flash-exp:free","messages":[{"role":"user","content":"test"}]}' | head -30

echo ""
echo ""
echo "Restarting PM2..."
pm2 restart creatix --update-env

echo ""
sleep 3

echo "Checking logs..."
pm2 logs creatix --lines 30 --nostream

