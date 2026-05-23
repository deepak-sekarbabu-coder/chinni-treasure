param([int]$Size192 = 192, [int]$Size512 = 512)

Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path (Get-Location) "icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

function GenerateIcon {
    param([int]$Size)
    
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "HighQuality"
    $g.InterpolationMode = "HighQualityBicubic"
    $g.TextRenderingHint = "AntiAliasGridFit"
    
    # Dark background
    $darkColor = [System.Drawing.Color]::FromArgb(255, 13, 13, 13)
    $g.Clear($darkColor)
    
    # Gold circle
    $goldColor = [System.Drawing.Color]::FromArgb(255, 212, 175, 55)
    $circleBrush = New-Object System.Drawing.SolidBrush($goldColor)
    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $r = $Size * 0.38
    $g.FillEllipse($circleBrush, $cx - $r, $cy - $r, $r * 2.0, $r * 2.0)
    $circleBrush.Dispose()
    
    # Letter L in dark
    $fontSize = $Size * 0.42
    $font = New-Object System.Drawing.Font("Georgia", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush($darkColor)
    
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = "Center"
    $format.LineAlignment = "Center"
    
    $g.DrawString("L", $font, $textBrush, $cx, $cy + 2.0, $format)
    
    $textBrush.Dispose()
    $font.Dispose()
    $format.Dispose()
    $g.Dispose()
    
    $path = Join-Path $iconsDir ("icon-" + $Size + ".png")
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Output ("Created: " + $path)
}

GenerateIcon -Size $Size192
GenerateIcon -Size $Size512
Write-Output "Done"
