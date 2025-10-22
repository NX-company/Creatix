#!/bin/sh
set -e

echo "🚀 Starting Creatix application..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until nc -z postgres 5432; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma Client (in case it's not generated)
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Database setup complete!"
echo "🌟 Starting Next.js application..."

# Execute the command passed to the entrypoint
exec "$@"
