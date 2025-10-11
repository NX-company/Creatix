$envVars = @{
    "OPENAI_API_KEY" = "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"
    "REPLICATE_API_TOKEN" = "r8_60fbHrFNfAJ0Udh9gVQs0Yo3dQuxSDg3Hy63d"
    "PROXY_HOST" = "63.125.89.9"
    "PROXY_PORT" = "50100"
    "PROXY_LOGIN" = "useneurox"
    "PROXY_PASSWORD" = "sEEkkt2bMu"
    "NEXTAUTH_SECRET" = "yX39jVjxhx/cA24bctYwhuD4H7GeH47AcX6zMhSeiQg="
    "NEXTAUTH_URL" = "https://nx-studio-qg6kw8p0e-alexanders-projects-73e83f2d.vercel.app"
}

$environments = @("production", "preview")

foreach ($env in $environments) {
    foreach ($key in $envVars.Keys) {
        Write-Host "Adding $key to $env..." -ForegroundColor Cyan
        $value = $envVars[$key]
        echo $value | vercel env add $key $env
        Start-Sleep -Milliseconds 500
    }
}

Write-Host "Done!" -ForegroundColor Green

