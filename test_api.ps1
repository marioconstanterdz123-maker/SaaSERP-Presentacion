$body = '{"email":"conrdz123456@gmail.com","password":"Admin123!"}'
$login = Invoke-RestMethod -Uri "http://134.209.214.44/api/Auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $login.token

$negocios = Invoke-RestMethod -Uri "http://134.209.214.44/api/negocios" -Headers @{Authorization="Bearer $token"}
$negocios | Select-Object -First 1 | ConvertTo-Json -Depth 5
