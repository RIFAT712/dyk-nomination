# Simple build script to concatenate the scripts for Wikipedia
if (-not (Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" }

$header = "// <nowiki>`n"
$footer = "`n// </nowiki>"

# Specifically use UTF8 encoding for reading to avoid corruption
$core = Get-Content "src/dyk-core.js" -Raw -Encoding UTF8
$ui = Get-Content "src/dyk-ui.js" -Raw -Encoding UTF8
$css = Get-Content "src/dyk-ui.css" -Raw -Encoding UTF8
$main = Get-Content "src/dyk.js" -Raw -Encoding UTF8

# Create a style injection script
$styleLoader = @"

(function() {
    const style = document.createElement('style');
    style.textContent = ``$css``;
    document.head.appendChild(style);
})();
"@

# UI at the top, followed by Core and Main
$combined = $header + $ui + "`n`n" + $core + "`n`n" + $styleLoader + "`n`n" + $main + $footer

# Using utf8NoBOM (UTF-8 without BOM) which is often safer for MediaWiki
$combined | Out-File -FilePath "dist/dyk.js" -Encoding utf8

Write-Host "Build complete! Check dist/dyk.js"
