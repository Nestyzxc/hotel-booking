param(
    [Parameter(Mandatory=$true)][string]$ServiceAccountPath,
    [Parameter(Mandatory=$true)][string]$SpreadsheetId
)

$ErrorActionPreference = "Stop"

# Load service account
$sa = Get-Content $ServiceAccountPath -Raw | ConvertFrom-Json
$clientEmail = $sa.client_email
$privateKeyPem = $sa.private_key
$tokenUri = $sa.token_uri

Write-Host "Service Account: $clientEmail"
Write-Host "Spreadsheet: $SpreadsheetId"

# ===== 1) Build JWT (RS256) =====
$now = [int][double]::Parse(((Get-Date).ToUniversalTime() - [datetime]'1970-01-01').TotalSeconds)
$exp = $now + 3600

$header = [ordered]@{alg = "RS256"; typ = "JWT" } | ConvertTo-Json -Compress
$claimSet = [ordered]@{
    iss = $clientEmail
    scope = "https://www.googleapis.com/auth/spreadsheets"
    aud = $tokenUri
    exp = $exp
    iat = $now
} | ConvertTo-Json -Compress

function Base64UrlEncode([byte[]]$bytes) {
    [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$headerB64 = Base64UrlEncode([Text.Encoding]::UTF8.GetBytes($header))
$claimB64 = Base64UrlEncode([Text.Encoding]::UTF8.GetBytes($claimSet))
$signingInput = "$headerB64.$claimB64"

# Sign with RSA-SHA256 using RSACng (supports PKCS#8 PEM)
$pkcs8 = $privateKeyPem `
    -replace '-----BEGIN PRIVATE KEY-----', '' `
    -replace '-----END PRIVATE KEY-----', '' `
    -replace '\s+', ''

$keyBytes = [Convert]::FromBase64String($pkcs8)

$cng = New-Object System.Security.Cryptography.RSACng
$cng.ImportPkcs8PrivateKey($keyBytes, [ref]0)

# CNG SignData needs a HashAlgorithmName + RSASignaturePadding
$signature = $cng.SignData(
    [Text.Encoding]::UTF8.GetBytes($signingInput),
    [System.Security.Cryptography.HashAlgorithmName]::SHA256,
    [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)
$sigB64 = Base64UrlEncode($signature)
$jwt = "$signingInput.$sigB64"

$cng.Dispose()

Write-Host "JWT created (len=$($jwt.Length))"

# ===== 2) Exchange JWT for access token =====
$body = @{
    grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
    assertion = $jwt
}
$tokenRes = Invoke-RestMethod -Uri $tokenUri -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
$accessToken = $tokenRes.access_token
Write-Host "Got access token (len=$($accessToken.Length))"

# ===== 3) Add Customers sheet via Sheets API =====
$headers = @{
    Authorization = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

$addSheetBody = @{
    requests = @(
        @{
            addSheet = @{
                properties = @{
                    title = "Customers"
                    gridProperties = @{
                        rowCount = 1000
                        columnCount = 12
                    }
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

Write-Host "Creating Customers sheet..."
$addRes = Invoke-RestMethod -Uri "https://sheets.googleapis.com/v4/spreadsheets/$SpreadsheetId`:batchUpdate" `
    -Method Post -Headers $headers -Body $addSheetBody
Write-Host "Sheet added: properties.title = $($addRes.replies[0].addSheet.properties.title), sheetId = $($addRes.replies[0].addSheet.properties.sheetId)"

# ===== 4) Write header row =====
$headersRow = @(
    "line_user_id",         # A
    "first_seen_at",        # B
    "last_seen_at",         # C
    "full_name",            # D
    "phone",                # E
    "email",                # F
    "total_stays",          # G
    "total_nights",         # H
    "lifetime_value",       # I
    "last_preference_tags", # J
    "marketing_opt_out",    # K
    "notes"                 # L
)

$updateBody = @{
    values = @(@($headersRow))
} | ConvertTo-Json -Depth 5 -Compress

Write-Host "Writing header row..."
$range = "Customers!A1:L1"
$updRes = Invoke-RestMethod -Uri "https://sheets.googleapis.com/v4/spreadsheets/$SpreadsheetId/values/$range`?valueInputOption=RAW" `
    -Method Put -Headers $headers -Body $updateBody
Write-Host "Updated $($updRes.updatedRows) row(s), $($updRes.updatedColumns) col(s)"

# ===== 5) Freeze header row + bold formatting =====
$formatBody = @{
    requests = @(
        @{
            updateSheetProperties = @{
                properties = @{
                    sheetId = $addRes.replies[0].addSheet.properties.sheetId
                    gridProperties = @{
                        frozenRowCount = 1
                    }
                }
                fields = "gridProperties.frozenRowCount"
            }
        }
        @{
            repeatCell = @{
                range = @{
                    sheetId = $addRes.replies[0].addSheet.properties.sheetId
                    startRowIndex = 0
                    endRowIndex = 1
                }
                cell = @{
                    userEnteredFormat = @{
                        textFormat = @{ bold = $true }
                        backgroundColor = @{ red = 0.95; green = 0.95; blue = 0.95 }
                    }
                }
                fields = "userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor"
            }
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

Invoke-RestMethod -Uri "https://sheets.googleapis.com/v4/spreadsheets/$SpreadsheetId`:batchUpdate" `
    -Method Post -Headers $headers -Body $formatBody | Out-Null
Write-Host "Header row frozen + bolded"

Write-Host "=== DONE ==="
Write-Host "Sheet: Customers"
Write-Host "gid : $($addRes.replies[0].addSheet.properties.sheetId)"
Write-Host "Range: A1:L1 (12 columns)"
