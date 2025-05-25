# Simple API test without Unicode
$preflopText = "PokerStars Hand #245123456789: Hold'em No Limit (5/10 EUR) - 2024/01/15 20:30:00 CET
Table 'Andromeda V' 2-max Seat #1 is the button
Seat 1: Hero (1000 in chips)
Seat 2: Villain (1000 in chips)
Hero: posts small blind 5
Villain: posts big blind 10
*** HOLE CARDS ***
Dealt to Hero [Ad Ks]
Hero: raises 20 to 30
Villain: calls 20
*** FLOP *** [8h 5c 2d]"

$body = @{
    preflopText = $preflopText
} | ConvertTo-Json

try {
    Write-Host "Testing preflop parser..." -ForegroundColor Green
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/analyze-preflop" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS! Results:" -ForegroundColor Green
    Write-Host "Pot Size: $($response.summary.potSize)" -ForegroundColor Yellow
    Write-Host "Actions: $($response.summary.actionCount)" -ForegroundColor Yellow  
    Write-Host "Blinds: $($response.summary.blinds.small)/$($response.summary.blinds.big)" -ForegroundColor Yellow
    Write-Host "Valid: $($response.validation.isValid)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
} 