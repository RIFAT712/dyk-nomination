# Simple build script to concatenate the scripts for Wikipedia
if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" }

$header = "// <nowiki>`n"
$footer = "`n// </nowiki>"

# Specifically use UTF8 encoding for reading to avoid corruption
$core = Get-Content "dyk-core.js" -Raw -Encoding UTF8
$ui = Get-Content "dyk-ui.js" -Raw -Encoding UTF8
$main = Get-Content "dyk.js" -Raw -Encoding UTF8

$combined = $header + $core + "`n`n" + $ui + "`n`n" + $main + $footer

# Using utf8NoBOM (UTF-8 without BOM) which is often safer for MediaWiki
$combined | Out-File -FilePath "dist/dyk.js" -Encoding utf8

Write-Host "Build complete! Check dist/dyk.js"
