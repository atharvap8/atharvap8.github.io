
param (
    [string]$TargetFolder
)

# Refresh Env
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Error "FFmpeg not found. Please install it or restart your terminal."
    exit 1
}

if (-not (Test-Path $TargetFolder)) {
    Write-Error "Folder not found: $TargetFolder"
    exit 1
}

$files = Get-ChildItem -Path $TargetFolder -Include *.mp4, *.mov, *.mkv, *.avi -Recurse

if ($files.Count -eq 0) {
    Write-Warning "No video files found in $TargetFolder"
    exit
}

foreach ($file in $files) {
    $originalSize = $file.Length
    Write-Host "Processing $($file.Name) ($([math]::Round($originalSize / 1MB, 2)) MB)..." -NoNewline

    $tempFile = $file.FullName + "_temp.mp4"

    # Compress (H.264, 1280px, CRF 28)
    $args = "-i `"$($file.FullName)`" -c:v libx264 -crf 28 -preset medium -vf `"scale='min(1280,iw)':-2`" -c:a aac -b:a 128k -movflags +faststart -y `"$tempFile`""
    
    $process = Start-Process -FilePath "ffmpeg" -ArgumentList $args -NoNewWindow -PassThru -Wait
    
    if ($process.ExitCode -eq 0 -and (Test-Path $tempFile)) {
        $newSize = (Get-Item $tempFile).Length
        
        if ($newSize -lt $originalSize) {
            Remove-Item $file.FullName -Force
            # Force extension to .mp4
            $finalPath = [System.IO.Path]::ChangeExtension($file.FullName, ".mp4")
            Move-Item $tempFile $finalPath -Force
            
            $savings = [math]::Round((1 - ($newSize / $originalSize)) * 100, 1)
            Write-Host " Done. New size: $([math]::Round($newSize / 1MB, 2)) MB (-$savings%)" -ForegroundColor Green
        } else {
            Remove-Item $tempFile -Force
            Write-Host " Skipped (Compression didn't save space)" -ForegroundColor Yellow
        }
    } else {
        Write-Host " Error during compression." -ForegroundColor Red
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
    }
}
