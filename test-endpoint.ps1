$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImlzVHdvRmFjdG9yQXV0aGVudGljYXRlZCI6dHJ1ZSwiaWF0IjoxNzU4ODEwMjU2LCJleHAiOjE3NTg4OTY2NTZ9.Wu7E1ZxJzsMiLv3hRmB367PbpNLpZmurwsbJNqoY0lo'
    'Content-Type' = 'application/json'
}

$body = @{
    motivo = 'Producto no conforme detectado en ticket'
} | ConvertTo-Json

try {
    Write-Host "🚀 Probando endpoint POST /tickets/21/non-conformity..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri 'http://localhost:3006/tickets/21/non-conformity' -Method POST -Headers $headers -Body $body
    Write-Host "✅ ÉXITO - No Conformidad Creada:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        Write-Host "Código de estado:" $_.Exception.Response.StatusCode
    }
}