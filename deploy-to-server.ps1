# Auto-deploy Creatix to Timeweb VPS
# Run: .\deploy-to-server.ps1

$ServerIP = "45.129.128.121"
$ServerUser = "root"
$ServerPassword = "pzaNtMznbq@hw3"
$ProjectPath = "/root/Creatix"

Write-Host "Starting auto-deployment..." -ForegroundColor Cyan
Write-Host ""

# Check for plink
$plinkPath = "plink.exe"

# Function to execute SSH command
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "=> $Description" -ForegroundColor Yellow
    
    $fullCommand = "cd $ProjectPath; $Command"
    
    try {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $plinkPath
        $psi.Arguments = "-batch -pw `"$ServerPassword`" $ServerUser@$ServerIP `"$fullCommand`""
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        
        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $psi
        $process.Start() | Out-Null
        
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        $process.WaitForExit()
        
        if ($process.ExitCode -eq 0) {
            Write-Host "OK" -ForegroundColor Green
            if ($stdout) { Write-Host $stdout }
            return $true
        } else {
            Write-Host "ERROR" -ForegroundColor Red
            if ($stderr) { Write-Host $stderr }
            if ($stdout) { Write-Host $stdout }
            return $false
        }
    } catch {
        Write-Host "Failed: $_" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
}

Write-Host "STEP 1: Remove old build" -ForegroundColor Cyan
Invoke-SSHCommand -Command "rm -rf .next" -Description "Deleting .next directory"

Write-Host ""
Write-Host "STEP 2: Update code from GitHub" -ForegroundColor Cyan
Invoke-SSHCommand -Command "git pull origin main" -Description "Pulling latest changes"

Write-Host ""
Write-Host "STEP 3: Build application (3-4 minutes)" -ForegroundColor Cyan
$buildResult = Invoke-SSHCommand -Command "ESLINT_NO_DEV_ERRORS=true npm run build" -Description "Building Next.js"

if (-not $buildResult) {
    Write-Host ""
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 4: Check BUILD_ID" -ForegroundColor Cyan
$checkBuild = Invoke-SSHCommand -Command "ls -la .next/BUILD_ID; cat .next/BUILD_ID" -Description "Checking BUILD_ID"

if (-not $checkBuild) {
    Write-Host ""
    Write-Host "BUILD_ID NOT FOUND!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 5: Stop old PM2 process" -ForegroundColor Cyan
Invoke-SSHCommand -Command "pm2 delete creatix || true" -Description "Stopping old process"

Write-Host ""
Write-Host "STEP 6: Start new PM2 process" -ForegroundColor Cyan
Invoke-SSHCommand -Command "pm2 start npm --name creatix -- start" -Description "Starting app via PM2"

Write-Host ""
Write-Host "STEP 7: Save PM2 config" -ForegroundColor Cyan
Invoke-SSHCommand -Command "pm2 save" -Description "Saving PM2 config"

Write-Host ""
Write-Host "STEP 8: Check status" -ForegroundColor Cyan
Invoke-SSHCommand -Command "pm2 status" -Description "Checking app status"

Write-Host ""
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Your site: https://aicreatix.ru" -ForegroundColor Cyan
Write-Host ""
