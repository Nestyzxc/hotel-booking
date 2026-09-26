$ErrorActionPreference = "Continue"
Set-Location "D:\hotel-n8n"

# Use backtick to escape $
$xlsxTemp = '~$sai-lan-sheets-v2.xlsx'

# Remove from git index
git rm --cached $xlsxTemp 2>&1 | Out-String
if (Test-Path $xlsxTemp) {
    Remove-Item $xlsxTemp -Force
    Write-Host "Deleted xlsx temp file"
}

# Reset staging
git reset | Out-Null

# Re-add files explicitly
git add .gitignore
git add admin.html
git add index.html
git add docker-compose.yml
git add assets/
git add logos/
git add scripts/
git add test-booking-v2.json
git add test-line-issue.json
git add test-line-rate-low.json
Get-ChildItem -Filter "workflow-*.json" | ForEach-Object { git add $_.FullName }

Write-Host ""
Write-Host "=== Staged files ==="
git diff --staged --name-only

# Check any leftover
Write-Host ""
Write-Host "=== Untracked ==="
git ls-files --others --exclude-standard
