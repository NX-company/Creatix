# Автоматический деплой на сервер (требуются настроенные SSH ключи)

Write-Host "🚀 Starting automatic deployment to aicreatix.ru..." -ForegroundColor Cyan

# Проверка SSH ключей
if (-not (Test-Path "$env:USERPROFILE\.ssh\id_rsa")) {
    Write-Host "❌ SSH ключ не найден! Сначала настройте SSH ключи." -ForegroundColor Red
    Write-Host "📖 См. инструкцию в SSH_SETUP_MANUAL.md" -ForegroundColor Yellow
    exit 1
}

# Тест подключения
Write-Host "`n🔌 Checking SSH connection..." -ForegroundColor Blue
$testConnection = ssh -o ConnectTimeout=5 root@45.129.128.121 "echo 'OK'" 2>&1

if ($testConnection -notmatch "OK") {
    Write-Host "❌ SSH подключение не работает!" -ForegroundColor Red
    Write-Host "📖 Настройте SSH ключи по инструкции в SSH_SETUP_MANUAL.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH connection OK!" -ForegroundColor Green

# Деплой
Write-Host "`n📦 Deploying to server..." -ForegroundColor Blue

$commands = @(
    "cd /root/Creatix",
    "echo '📥 Pulling latest code...'",
    "git pull origin main",
    "echo '📦 Installing dependencies...'",
    "npm install",
    "echo '🔧 Copying environment...'",
    "cp server.env .env 2>/dev/null || echo '.env exists'",
    "echo '🔧 Generating Prisma...'",
    "npx prisma generate",
    "echo '🗄️ Running migrations...'",
    "npx prisma migrate deploy",
    "echo '🏗️ Building project...'",
    "ESLINT_NO_DEV_ERRORS=true npm run build",
    "echo '✅ Build complete, restarting PM2...'",
    "pm2 restart creatix || pm2 start npm --name 'creatix' -- start",
    "pm2 save",
    "echo '✅ Deployment complete!'",
    "pm2 logs creatix --lines 20 --nostream"
)

$fullCommand = $commands -join " && "

Write-Host "`n🔄 Executing deployment commands..." -ForegroundColor Cyan
ssh root@45.129.128.121 $fullCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Application: https://aicreatix.ru" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check logs above for details." -ForegroundColor Yellow
}

