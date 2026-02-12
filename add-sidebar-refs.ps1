# Remove btnHome and btnLogout buttons from header-actions in all pages
# Since HTML varies per page, we use regex to handle the 3 patterns

$dir = "c:\Users\matuc\OneDrive\Escritorio\gestion\src\main\resources\static"
$exclude = @("login.html", "index.html")

Get-ChildItem -Path $dir -Filter "*.html" | Where-Object { $_.Name -notin $exclude } | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw -Encoding UTF8
    $changed = $false

    # Pattern 1: Remove multi-line btnHome button (3 lines: open tag, text, close tag)
    $p1 = '(?m)\s*<button id="btnHome"[^>]*>\s*\r?\n\s*[^<]+\r?\n\s*</button>\s*\r?\n?'
    if ($content -match $p1) {
        $content = [regex]::Replace($content, $p1, "`n")
        $changed = $true
    }

    # Pattern 2: Remove single-line btnHome button  
    $p2 = '(?m)\s*<button id="btnHome"[^>]*>[^<]*</button>\s*\r?\n?'
    if ($content -match $p2) {
        $content = [regex]::Replace($content, $p2, "`n")
        $changed = $true
    }

    # Pattern 3: Remove multi-line btnLogout button (3 lines)
    $p3 = '(?m)\s*<button id="btnLogout"[^>]*>\s*\r?\n\s*[^<]+\r?\n\s*</button>\s*\r?\n?'
    if ($content -match $p3) {
        $content = [regex]::Replace($content, $p3, "`n")
        $changed = $true
    }

    # Pattern 4: Remove single-line btnLogout button
    $p4 = '(?m)\s*<button id="btnLogout"[^>]*>[^<]*</button>\s*\r?\n?'
    if ($content -match $p4) {
        $content = [regex]::Replace($content, $p4, "`n")
        $changed = $true
    }

    # Pattern 5: Remove empty header-actions divs (only whitespace inside)
    $p5 = '(?ms)\s*<div class="header-actions">\s*</div>\s*'
    if ($content -match $p5) {
        $content = [regex]::Replace($content, $p5, "`n")
        $changed = $true
    }

    if ($changed) {
        Set-Content $file $content -NoNewline -Encoding UTF8
        Write-Host "Cleaned: $($_.Name)"
    } else {
        Write-Host "No changes: $($_.Name)"
    }
}
