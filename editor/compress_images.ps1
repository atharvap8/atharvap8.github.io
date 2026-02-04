
param (
    [string]$TargetFolder
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $TargetFolder)) {
    Write-Error "Folder not found: $TargetFolder"
    exit 1
}

$files = Get-ChildItem -Path $TargetFolder -Include *.jpg, *.jpeg -Recurse

foreach ($file in $files) {
    $originalSize = $file.Length
    Write-Host "Processing $($file.Name) ($([math]::Round($originalSize / 1MB, 2)) MB)..." -NoNewline

    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        
        # Resize Logic (Max 1600px)
        $maxWidth = 1600
        $newWidth = $img.Width
        $newHeight = $img.Height

        if ($img.Width -gt $maxWidth) {
            $ratio = $maxWidth / $img.Width
            $newWidth = $maxWidth
            $newHeight = [int]($img.Height * $ratio)
        }

        # Create Bitmap
        $newImg = new-object System.Drawing.Bitmap $newWidth, $newHeight
        $graph = [System.Drawing.Graphics]::FromImage($newImg)
        $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)

        # JPEG Encoder
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 75) # Quality 75

        # Save Temp
        $tempFile = $file.FullName + ".tmp"
        $newImg.Save($tempFile, $codec, $encParams)

        # Cleanup
        $graph.Dispose()
        $newImg.Dispose()
        $img.Dispose()

        # Compare & Overwrite
        $newSize = (Get-Item $tempFile).Length
        if ($newSize -lt $originalSize) {
            Remove-Item $file.FullName -Force
            Move-Item $tempFile $file.FullName -Force
            $savings = [math]::Round((1 - ($newSize / $originalSize)) * 100, 1)
            Write-Host " Done. New size: $([math]::Round($newSize / 1KB, 0)) KB (-$savings%)" -ForegroundColor Green
        } else {
            Remove-Item $tempFile -Force
            Write-Host " Skipped (New file was larger or same)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " Error: $_" -ForegroundColor Red
        if ($img) { $img.Dispose() }
        if ($newImg) { $newImg.Dispose() }
        if ($graph) { $graph.Dispose() }
    }
}
