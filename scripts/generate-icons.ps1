Add-Type -AssemblyName System.Drawing

function New-Icon {
    param(
        [string]$Path,
        [int]$Size,
        [string]$HexColor,
        [string]$Glyph
    )
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $bg = [System.Drawing.ColorTranslator]::FromHtml($HexColor)
    $g.Clear($bg)
    $fontSize = [Math]::Floor($Size * 0.5)
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $g.DrawString($Glyph, $font, $brush, $rect, $format)
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function New-CategoryIcon {
    param(
        [string]$Path,
        [int]$Size
    )
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    $fontSize = [Math]::Floor($Size * 0.55)
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
    $brush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $g.DrawString("*", $font, $brush, $rect, $format)
    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$root = "com.kailo.edminingbook.sdPlugin"

New-Icon -Path "$root\imgs\plugin-icon.png" -Size 256 -HexColor "#2b3a55" -Glyph "EMB"
New-Icon -Path "$root\imgs\plugin-icon@2x.png" -Size 512 -HexColor "#2b3a55" -Glyph "EMB"

New-CategoryIcon -Path "$root\imgs\category-icon.png" -Size 28
New-CategoryIcon -Path "$root\imgs\category-icon@2x.png" -Size 56

$actions = @(
    @{ Name = "start-session"; Color = "#2f7d3c"; Glyph = ">" },
    @{ Name = "end-session";   Color = "#7d2f2f"; Glyph = "[]" },
    @{ Name = "good-rock";     Color = "#c9962b"; Glyph = "*" },
    @{ Name = "undo";          Color = "#555555"; Glyph = "<-" },
    @{ Name = "open-book";     Color = "#2f4f7d"; Glyph = "B" },
    @{ Name = "open-folder";   Color = "#8a6d3b"; Glyph = "F" }
)

foreach ($a in $actions) {
    New-Icon -Path "$root\imgs\actions\$($a.Name).png" -Size 72 -HexColor $a.Color -Glyph $a.Glyph
    New-Icon -Path "$root\imgs\actions\$($a.Name)@2x.png" -Size 144 -HexColor $a.Color -Glyph $a.Glyph
}

Write-Host "Icons generated."
