# AI Context: Creatix Project

> **THIS FILE IS THE ENTRY POINT FOR AI ASSISTANT**  
> Reference this file when starting a new development session

## Project Overview

**Name:** Creatix  
**Type:** Next.js 15 web application (App Router)  
**Purpose:** AI-powered document generation (proposals, invoices, acts, etc.)

### Tech Stack:
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Prisma ORM
- Database: PostgreSQL 16 (via SSH tunnel to production)
- AI APIs: OpenRouter (text), Replicate Flux (images)
- Payments: Tochka Bank API
- Deployment: Docker + docker-compose on VPS

## Current Status

### ✅ ПОЛНОСТЬЮ ГОТОВО:
- ✅ Production deployed and WORKING at http://45.129.128.121:3000
- ✅ Docker на сервере исправлен (tailwindcss проблема решена)
- ✅ Database migrated (12 users, 220+ generations)
- ✅ Local environment SETUP and TESTED
- ✅ SSH tunnel протестирован и работает (start-db-tunnel.bat)
- ✅ npm run dev протестирован на порте 3001 (порт 3000 занят)
- ✅ .env.local configured for local development
- ✅ VS Code PostgreSQL extension installed
- ✅ Все зависимости установлены (npm install)

### 🚀 ГОТОВ К РАЗРАБОТКЕ:
Можно начинать исправлять баги и добавлять фичи!

## Credentials

**SSH:** root@45.129.128.121 (password: pzaNtMznbq@hw3)  
**DB via tunnel:** postgres/postgres @ localhost:5432  
**Production:** http://45.129.128.121:3000  
**Domain:** https://aicreatix.ru

## Development Workflow

### 1. Start DB Tunnel (in separate terminal - keep open!)
```
start-db-tunnel.bat
```

### 2. Start Development
```
npm run dev -- -p 3001
```
App at http://localhost:3001 (порт 3000 занят другим процессом)

### 3. Deploy to Production
```bash
# Локально
git add . && git commit -m "description" && git push

# На сервере (через SSH)
ssh root@45.129.128.121
cd /root/Creatix && git pull && docker compose up -d --build
```

## Important Files

- **START_HERE.txt** - Quick start prompt for AI
- **.env.local** - Local development config
- **.env.production** - Production config (on server)
- **start-db-tunnel.bat** - SSH tunnel script
- **docker-compose.yml** - Docker setup on server
- **SETUP.md** - Setup instructions
- **WORKFLOW.md** - Development process

## Quick Start Commands

```bash
# Start database tunnel (terminal 1 - keep open!)
start-db-tunnel.bat

# Start development (terminal 2)
npm run dev -- -p 3001

# Open browser
http://localhost:3001

# Deploy to production
git add . && git commit -m "..." && git push
ssh root@45.129.128.121 "cd /root/Creatix && git pull && docker compose up -d --build"
```

## Known Issues & Solutions

### Issue: Cannot connect to database
**Solution:** Make sure start-db-tunnel.bat is running in separate terminal

### Issue: API keys disabled (401 errors)
**Solution:** Enable keys on OpenRouter.ai and Replicate.com, then restart Docker:
```
ssh root@45.129.128.121 "cd /root/Creatix && docker compose restart app"
```

## Last Updated
October 22, 2025 - Local environment FULLY SETUP and TESTED. Ready for development!
