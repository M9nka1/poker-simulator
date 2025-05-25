# Test for USD dollar format parsing
$preflopText = @"
PokerStars Hand #123456789: Hold'em No Limit (`$5.00/`$10.00) - 2024/12/14 2:21:47 GMT+03:00
Table 'PioSolver Table' 6-max Seat #6 is the button
Seat 1: Pio_OOP_3bet_SB (`$1000.00 in chips)
Seat 2: Pio_BB (`$1000.00 in chips)
Seat 3: Pio_EP (`$1000.00 in chips)
Seat 4: Pio_MP (`$1000.00 in chips)
Seat 5: Pio_CO (`$1000.00 in chips)
Seat 6: Pio_IP_c3bBU (`$1000.00 in chips)
Pio_OOP_3bet_SB: posts small blind `$5.00
Pio_BB: posts big blind `$10.00
*** HOLE CARDS ***
Pio_EP: folds
Pio_MP: folds
Pio_CO: folds
Pio_IP_c3bBU: raises `$15.00 to `$25.00
Pio_OOP_3bet_SB: raises `$85.00 to `$110.00
Pio_BB: folds
Pio_IP_c3bBU: calls `$85.00
"@

$body = @{
    preflopText = $preflopText
} | ConvertTo-Json

try {
    Write-Host "Testing DOLLAR format preflop parser..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/analyze-preflop" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS! Dollar format results:" -ForegroundColor Green
    Write-Host "Expected: Pot=`$230, Actions=6, Blinds=`$5/`$10" -ForegroundColor White
    Write-Host "Actual:" -ForegroundColor Yellow
    Write-Host "  Pot Size: `$$($response.summary.potSize)" -ForegroundColor Yellow
    Write-Host "  Actions: $($response.summary.actionCount)" -ForegroundColor Yellow  
    Write-Host "  Blinds: `$$($response.summary.blinds.small)/`$$($response.summary.blinds.big)" -ForegroundColor Yellow
    Write-Host "  Valid: $($response.validation.isValid)" -ForegroundColor Green
    
    if ($response.summary.potSize -eq 230) {
        Write-Host "CORRECT POT SIZE!" -ForegroundColor Green
    } else {
        Write-Host "INCORRECT POT SIZE (expected 230)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response details: $($_.Exception.Response)" -ForegroundColor Red
} 