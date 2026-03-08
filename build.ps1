# Simple build script to concatenate the scripts for Wikipedia
if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" }

$header = "// <nowiki>`n"
$footer = "`n// </nowiki>"

$core = Get-Content "dyk-core.js" -Raw
$ui = Get-Content "dyk-ui.js" -Raw
$main = Get-Content "dyk.js" -Raw

$combined = $header + $core + "`n`n" + $ui + "`n`n" + $main + $footer
$combined | Out-File -FilePath "dist/dyk.js" -Encoding utf8

Write-Host "Build complete! Check dist/dyk.js"
