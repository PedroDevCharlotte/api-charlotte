$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjUsImlzVHdvRmFjdG9yQXV0aGVudGljYXRlZCI6dHJ1ZSwiaWF0IjoxNzU4ODEwMjU2LCJleHAiOjE3NTg4OTY2NTZ9.Wu7E1ZxJzsMiLv3hRmB367PbpNLpZmurwsbJNqoY0lo'
}

try {
    Write-Host "📋 VERIFICANDO LISTAS CREADAS PARA NO CONFORMIDADES:" -ForegroundColor Green
    $lists = Invoke-RestMethod -Uri 'http://localhost:3006/general-lists' -Headers $headers
    $ncLists = $lists | Where-Object { $_.code -like 'NC_*' }
    
    foreach ($list in $ncLists) {
        Write-Host "  • $($list.code) (ID: $($list.id)) - $($list.name)" -ForegroundColor Yellow
        
        # Obtener opciones de cada lista
        $options = Invoke-RestMethod -Uri "http://localhost:3006/general-lists/$($list.id)/options" -Headers $headers
        foreach ($option in $options) {
            Write-Host "    - $($option.displayText) (ID: $($option.id))" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Error obteniendo listas: $($_.Exception.Message)" -ForegroundColor Red
}