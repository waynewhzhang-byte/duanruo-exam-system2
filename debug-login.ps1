$ErrorActionPreference = "Stop"

Write-Host "DEBUG: Script started"

$body = @{
    username = "tenant_admin_1762476737466"
    password = "TenantAdmin@123"
} | ConvertTo-Json

try {
    Write-Host "DEBUG: Calling login..."
    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Login successful!"
    $token = $response.token
    Write-Host "🎟️ Token 1 (Global): $token"

    # Try to select tenant
    Write-Host "`n🔄 Selecting Tenant..."
    $tenantBody = @{
        tenantId = "421eee4a-1a2a-4f9d-95a4-37073d4b15c5"
    } | ConvertTo-Json

    try {
        $tenantResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/v1/auth/select-tenant" -Method Post -Body $tenantBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
        Write-Host "✅ Select Tenant successful!"
        $newToken = $tenantResponse.token
        Write-Host "🎟️ Token 2 (Tenant): $newToken"
        $token = $newToken # Use new token for decoding
    } catch {
        Write-Host "❌ Select Tenant failed: $_"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "Error Body: $errorBody"
        }
        # Continue to decode the first token if second failed
    }

    Write-Host "DEBUG: Decoding token..."
    $parts = $token.Split('.')
    if ($parts.Count -eq 3) {
        $payload = $parts[1]
        # Add padding if needed
        switch ($payload.Length % 4) {
            2 { $payload += "==" }
            3 { $payload += "=" }
        }
        $decodedBytes = [System.Convert]::FromBase64String($payload)
        $decodedString = [System.Text.Encoding]::UTF8.GetString($decodedBytes)
        
        Write-Host "📦 Token Payload:"
        $decodedString | ConvertFrom-Json | ConvertTo-Json -Depth 5
    } else {
        Write-Host "❌ Invalid JWT format"
    }
} catch {
    Write-Host "❌ Login failed: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errorBody"
    }
}

Write-Host "DEBUG: Script finished"
