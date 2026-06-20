# Benny Black — batch mastering enhancement (ffmpeg)
# Usage: .\enhance-masters.ps1 -InputDir "path\to\sources" -OutputDir "path\to\enhanced"

param(
    [string]$InputDir = "$PSScriptRoot\..\audio",
    [string]$OutputDir = "$PSScriptRoot\..\audio\enhanced",
    [string[]]$Files = @()
)

$FFmpegRoot = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin"
$FFmpeg = Join-Path $FFmpegRoot "ffmpeg.exe"
$FFprobe = Join-Path $FFmpegRoot "ffprobe.exe"

if (-not (Test-Path $FFmpeg)) {
    throw "ffmpeg not found at $FFmpeg. Install with: winget install Gyan.FFmpeg"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

# Mastering chain: HPF → EQ → glue compression → limiter → loudnorm (-14 LUFS / -1 dBTP)
$PreLoudnorm = "highpass=f=35,equalizer=f=80:t=q:w=1:g=1.5,equalizer=f=3500:t=q:w=1.5:g=2.5,equalizer=f=11000:t=q:w=2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=15:release=150:makeup=2,alimiter=limit=0.891:attack=7:release=100"

if ($Files.Count -eq 0) {
    $Files = Get-ChildItem -Path $InputDir -File -Include *.mp3,*.wav,*.m4a,*.flac |
        Where-Object { $_.DirectoryName -notmatch '\\enhanced$' } |
        Select-Object -ExpandProperty FullName
}

$FilterChain = "${PreLoudnorm},loudnorm=I=-14:TP=-1:LRA=11"
$DesktopOut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Benny Black - Enhanced'
New-Item -ItemType Directory -Force -Path $DesktopOut | Out-Null

foreach ($input in $Files) {
    $name = [IO.Path]::GetFileNameWithoutExtension($input)
    $out = Join-Path $OutputDir "$name-enhanced.mp3"
    $desktop = Join-Path $DesktopOut "$($name -replace '-',' ') - Enhanced.mp3"

    Write-Host "Enhancing: $name"
    & $FFmpeg -hide_banner -y -i $input -af $FilterChain -ar 44100 -b:a 320k $out
    if ($LASTEXITCODE -ne 0) { throw "ffmpeg failed for $name" }

    Copy-Item $out $desktop -Force
    $dur = & $FFprobe -v quiet -show_entries format=duration -of csv=p=0 $out
    Write-Host "  Done: $([math]::Round([double]$dur,1))s @ 320kbps"
    Write-Host "  Desktop: $desktop"
}

Write-Host "Enhanced files in: $OutputDir"
