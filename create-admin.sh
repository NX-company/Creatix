#!/bin/bash
# Create admin user on server

echo "🔧 Creating admin user..."

sudo -u postgres psql -d creatix_db << 'EOF'

-- Create User table if not exists
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT,
  "email" TEXT UNIQUE,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  "username" TEXT,
  "password" TEXT,
  "role" TEXT DEFAULT 'USER',
  "appMode" TEXT DEFAULT 'FREE',
  "trialEndsAt" TIMESTAMP,
  "trialGenerations" INTEGER DEFAULT 0,
  "monthlyGenerations" INTEGER DEFAULT 0,
  "generationLimit" INTEGER DEFAULT 30,
  "bonusGenerations" INTEGER DEFAULT 0,
  "freeMonthlyGenerations" INTEGER DEFAULT 0,
  "advancedMonthlyGenerations" INTEGER DEFAULT 0,
  "lastResetDate" TIMESTAMP,
  "subscriptionEndsAt" TIMESTAMP,
  "projectsCount" INTEGER DEFAULT 0,
  "projectsLimit" INTEGER DEFAULT 5,
  "filesCount" INTEGER DEFAULT 0,
  "filesLimit" INTEGER DEFAULT 70,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check if admin exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "User" WHERE email = 'useneurox@gmail.com') THEN
    INSERT INTO "User" (
      id, 
      email, 
      username, 
      password, 
      role, 
      "appMode", 
      name, 
      "createdAt", 
      "updatedAt", 
      "trialGenerations",
      "monthlyGenerations",
      "generationLimit",
      "bonusGenerations"
    )
    VALUES (
      gen_random_uuid()::text,
      'useneurox@gmail.com',
      'admin',
      '$2a$10$JZVEXzL7zw4p8VUZQN1qXO7qnJGH5VqY8Zx4JQDxN7SvQ8Hx8KQNK',
      'ADMIN',
      'PRO',
      'Administrator',
      NOW(),
      NOW(),
      0,
      9999,
      9999,
      9999
    );
    RAISE NOTICE '✅ Admin user created!';
  ELSE
    RAISE NOTICE '⚠️  Admin user already exists';
  END IF;
END $$;

-- Show admin info
SELECT 
  id, 
  email, 
  username, 
  role, 
  "appMode",
  "createdAt"
FROM "User" 
WHERE email = 'useneurox@gmail.com';

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO creatix_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO creatix_user;

EOF

echo ""
echo "✅ ADMIN CREDENTIALS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URL:      https://aicreatix.ru/admin/login"
echo "👤 Username: admin"
echo "🔑 Password: Lenalove123"
echo "📧 Email:    useneurox@gmail.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Restarting app..."
cd /root/Creatix
pm2 restart creatix
sleep 2
echo ""
echo "✅ Done! Try logging in now!"

