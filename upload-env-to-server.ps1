# Upload .env to Timeweb Server and Restart App

$ErrorActionPreference = "Continue"

$SERVER_IP = "45.129.128.121"
$SERVER_USER = "root"
$SERVER_PASSWORD = "pzaNtMznbq@hw3"
$APP_PATH = "/var/www/creatix"

Write-Host "`n🚀 UPLOADING .ENV TO SERVER..." -ForegroundColor Cyan

# Step 1: Upload .env file
Write-Host "`n📤 Step 1: Uploading server.env as .env..." -ForegroundColor Yellow

# Use scp with password (requires sshpass or plink)
# For Windows, we'll use pscp from PuTTY or create a temporary batch script
$uploadScript = @"
@echo off
echo | set /p="pzaNtMznbq@hw3" | pscp -pw pzaNtMznbq@hw3 -batch server.env root@45.129.128.121:/var/www/creatix/.env
"@

# Try using OpenSSH (built into Windows 10+)
Write-Host "Uploading with SCP..." -ForegroundColor Gray

# Create temporary expect-like script for password
$tempScript = @"
`$password = "pzaNtMznbq@hw3"
`$securePassword = ConvertTo-SecureString `$password -AsPlainText -Force
`$cred = New-Object System.Management.Automation.PSCredential ("root", `$securePassword)

# Use scp command
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null server.env root@45.129.128.121:/var/www/creatix/.env
"@

# Alternative: Direct command with sshpass-like approach
try {
    # Try direct SCP (will prompt for password)
    Write-Host "Run this command in another terminal if needed:" -ForegroundColor Yellow
    Write-Host "scp server.env root@45.129.128.121:/var/www/creatix/.env" -ForegroundColor White
    Write-Host "Password: pzaNtMznbq@hw3`n" -ForegroundColor White
    
    # Attempt automated upload
    $proc = Start-Process -FilePath "scp" -ArgumentList "-o", "StrictHostKeyChecking=no", "-o", "UserKnownHostsFile=nul", "server.env", "root@45.129.128.121:/var/www/creatix/.env" -NoNewWindow -PassThru
    
    # Wait a bit for password prompt
    Start-Sleep -Seconds 2
    
    # Check if process is still running (waiting for password)
    if (!$proc.HasExited) {
        Write-Host "⚠️  SCP is waiting for password. Please enter manually in the prompt." -ForegroundColor Yellow
        $proc.WaitForExit()
    }
    
    if ($proc.ExitCode -eq 0) {
        Write-Host "✅ .env file uploaded successfully!" -ForegroundColor Green
    } else {
        throw "SCP failed with exit code: $($proc.ExitCode)"
    }
} catch {
    Write-Host "❌ Automated upload failed: $_" -ForegroundColor Red
    Write-Host "`n📋 MANUAL UPLOAD INSTRUCTIONS:" -ForegroundColor Yellow
    Write-Host "1. Open another PowerShell/Terminal" -ForegroundColor White
    Write-Host "2. Run: scp server.env root@45.129.128.121:/var/www/creatix/.env" -ForegroundColor Cyan
    Write-Host "3. Enter password: pzaNtMznbq@hw3" -ForegroundColor Cyan
    Write-Host "4. Press Enter here to continue...`n" -ForegroundColor White
    Read-Host
}

# Step 2: Restart PM2
Write-Host "`n🔄 Step 2: Restarting PM2..." -ForegroundColor Yellow

$sshCommand = "cd /var/www/creatix && pm2 restart creatix && pm2 save"

try {
    Write-Host "Run this command in SSH if needed:" -ForegroundColor Yellow
    Write-Host "ssh root@45.129.128.121" -ForegroundColor White
    Write-Host "Password: pzaNtMznbq@hw3" -ForegroundColor White
    Write-Host "Then: $sshCommand`n" -ForegroundColor Cyan
    
    $proc = Start-Process -FilePath "ssh" -ArgumentList "-o", "StrictHostKeyChecking=no", "root@45.129.128.121", $sshCommand -NoNewWindow -PassThru -Wait
    
    if ($proc.ExitCode -eq 0) {
        Write-Host "✅ PM2 restarted successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ SSH command failed: $_" -ForegroundColor Red
}

# Step 3: Check logs
Write-Host "`n📋 Step 3: Checking logs..." -ForegroundColor Yellow
Write-Host "To view logs, run:" -ForegroundColor Gray
Write-Host "ssh root@45.129.128.121 'pm2 logs creatix --lines 30'" -ForegroundColor Cyan

Write-Host "`n✅ UPLOAD COMPLETE!" -ForegroundColor Green
Write-Host "🌐 Check your site: https://aicreatix.ru`n" -ForegroundColor Cyan

