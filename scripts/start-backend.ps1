Param(
  [string]$Profile = "dev"
)

$ErrorActionPreference = "Stop"
# Ensure running from repository root regardless of current working directory
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot
Write-Host "[start-backend] Working directory: $repoRoot" -ForegroundColor DarkCyan


Write-Host "[start-backend] Step 1/2: Build and install upstream modules (reactor, -am) to avoid stale SNAPSHOT..." -ForegroundColor Cyan
& mvn -q -pl exam-adapter-rest -am clean install -DskipTests
if ($LASTEXITCODE -ne 0) {
  Write-Error "Maven install failed. Please check the build output above."
  exit 1
}

Write-Host "[start-backend] Step 2/2: Run exam-bootstrap with profile '$Profile'..." -ForegroundColor Cyan
& mvn -q -f exam-bootstrap/pom.xml spring-boot:run "-Dspring-boot.run.profiles=$Profile"
if ($LASTEXITCODE -ne 0) {
  Write-Error "Spring Boot application failed to start."
  exit 1
}

