[CmdletBinding()]
param(
    [switch]$SmokeTest
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory)] [string]$Command,
        [Parameter(ValueFromRemainingArguments)] [string[]]$Arguments
    )

    Write-Host "`n> $Command $($Arguments -join ' ')" -ForegroundColor Cyan
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Polecenie zakończyło się błędem ($LASTEXITCODE): $Command"
    }
}

Push-Location $projectRoot
try {
    Invoke-CheckedCommand npm --prefix FE run build
    Invoke-CheckedCommand py -m compileall -q BE
    Invoke-CheckedCommand docker compose --env-file .env.docker.example config --quiet

    if ($SmokeTest) {
        $projectName = 'karta-drogowa-ci-local'
        $port = '18080'
        $env:APP_PORT = $port

        try {
            Invoke-CheckedCommand docker compose --project-name $projectName --env-file .env.docker.example up --detach --build

            $healthy = $false
            for ($attempt = 1; $attempt -le 30; $attempt++) {
                try {
                    $health = Invoke-WebRequest -UseBasicParsing "http://localhost:$port/api/health"
                    if ($health.StatusCode -eq 200) {
                        $healthy = $true
                        break
                    }
                } catch {
                    Start-Sleep -Seconds 2
                }
            }

            if (-not $healthy) {
                throw 'Smoke test API nie osiągnął statusu 200.'
            }

            Write-Host "Smoke test OK: http://localhost:$port/api/health" -ForegroundColor Green
        } finally {
            docker compose --project-name $projectName --env-file .env.docker.example down -v
        }
    }

    Write-Host "`nLokalny CI zakończył się poprawnie." -ForegroundColor Green
} finally {
    Remove-Item Env:APP_PORT -ErrorAction SilentlyContinue
    Pop-Location
}
