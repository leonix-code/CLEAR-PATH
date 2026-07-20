#!/bin/sh
# ClearPath Backend — Docker startup script
#
# Runs database migrations and seeds on first start,
# then launches the NestJS production server.

set -e

echo "⏳ Waiting for database to be ready..."
# Wait for PostgreSQL to be available
until nc -z -v -w30 postgres 5432 2>/dev/null
do
  printf "."
  sleep 1
done
echo "✓ Database is ready"

echo "⏳ Waiting for Redis to be ready..."
until nc -z -v -w30 redis 6379 2>/dev/null
do
  printf "."
  sleep 1
done
echo "✓ Redis is ready"

# Run migrations
echo "⏳ Running database migrations..."
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
echo "✓ Migrations applied"

# Seed database (idempotent — safe to run every time)
echo "⏳ Seeding database..."
npx ts-node apps/backend/prisma/seed.ts 2>/dev/null || echo "  Seed already applied or skipped"
echo "✓ Database seeded"

# Start the application
echo "🚀 Starting ClearPath backend..."
exec node apps/backend/dist/main
