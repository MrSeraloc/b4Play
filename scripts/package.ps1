$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$downloadDirectory = Join-Path $projectRoot 'downloads'
New-Item -ItemType Directory -Path $downloadDirectory -Force | Out-Null
foreach ($browserName in @('opera', 'chrome')) {
    $sourceDirectory = Join-Path $projectRoot ('dist\' + $browserName)
    $fileNames = Get-Content -LiteralPath (Join-Path $projectRoot ('dist\' + $browserName + '-files.json')) -Raw | ConvertFrom-Json
    $archivePath = Join-Path $downloadDirectory ('b4play-' + $browserName + '-0.4.0.zip')
    $temporaryPath = $archivePath + '.tmp'
    $archiveStream = [IO.File]::Open($temporaryPath, [IO.FileMode]::Create)
    $archive = [IO.Compression.ZipArchive]::new($archiveStream, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($fileName in ($fileNames | Sort-Object)) {
            if ($fileName -match '(^|/)(\.\.|\.env|data|node_modules)(/|$)' -or $fileName -match '\.(zip|exe|cmd|bat|ps1)$') { throw 'Unexpected release file.' }
            $sourcePath = [IO.Path]::GetFullPath((Join-Path $sourceDirectory $fileName))
            if (-not $sourcePath.StartsWith($sourceDirectory + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid source path.' }
            if ((Get-Item -LiteralPath $sourcePath).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Links are not allowed.' }
            $entry = $archive.CreateEntry($fileName, [IO.Compression.CompressionLevel]::Optimal)
            $entry.LastWriteTime = [DateTimeOffset]::new(2026, 1, 1, 0, 0, 0, [TimeSpan]::Zero)
            $inputStream = [IO.File]::OpenRead($sourcePath)
            $entryStream = $entry.Open()
            try { $inputStream.CopyTo($entryStream) } finally { $entryStream.Dispose(); $inputStream.Dispose() }
        }
    } finally { $archive.Dispose(); $archiveStream.Dispose() }
    Move-Item -LiteralPath $temporaryPath -Destination $archivePath -Force
    Write-Output ([IO.Path]::GetFileName($archivePath))
}
