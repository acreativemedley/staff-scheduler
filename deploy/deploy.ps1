<#
Deploy helper for staff-scheduler to an Apache VPS using scp/rsync over SSH.

Options: this script is a convenience for local dev. For CI/CD use a GH Action or other runner.

Usage:
  .\deploy.ps1 -RemoteUser ubuntu -RemoteHost example.com -RemotePath /var/www/matp -KeyPath C:\Users\you\.ssh\id_rsa

#>

param(
    [Parameter(Mandatory=$true)] [string] $RemoteUser,
    [Parameter(Mandatory=$true)] [string] $RemoteHost,
    [Parameter(Mandatory=$true)] [string] $RemotePath,
    [string] $KeyPath = "$env:USERPROFILE\.ssh\id_rsa",
    [string] $BuildCommand = "npm run build"
)

Write-Output "Running build: $BuildCommand"
if ($BuildCommand -match '^npm') {
    npm install
}
cmd /c $BuildCommand
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

# Vite builds to 'dist', not 'build'
$buildDir = Join-Path -Path (Get-Location) -ChildPath 'dist'
if (-not (Test-Path $buildDir)) { throw "Build output directory 'dist' not found. Make sure 'npm run build' completed successfully." }

$archive = Join-Path -Path (Get-Location) -ChildPath "dist.zip"
if (Test-Path $archive) { Remove-Item $archive }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $archive)
Write-Output "Created archive: $archive"

Write-Output "Uploading $archive to ${RemoteUser}@${RemoteHost}:${RemotePath}"

if (-not (Test-Path $KeyPath)) { Write-Output "Warning: SSH key not found at $KeyPath - will attempt password auth" }

# Copy zip to remote /tmp
$archiveFileName = Split-Path -Path $archive -Leaf
$remoteDest = "${RemoteUser}@${RemoteHost}:/tmp/"
$scpCmd = "scp -i `"$KeyPath`" -o StrictHostKeyChecking=no `"$archive`" $remoteDest"
Write-Output "Running: $scpCmd"
cmd /c $scpCmd

# Unpack on remote (without sudo for DreamHost compatibility)
# Note: Removed sudo commands as DreamHost VPS users typically don't need/have sudo
# Files uploaded by the SSH user will have correct ownership automatically
# Using semicolons instead of && for command chaining in the remote shell
$remoteCommands = "mkdir -p $RemotePath; rm -rf $RemotePath/*; unzip -o /tmp/$archiveFileName -d $RemotePath; rm /tmp/$archiveFileName"
$sshTarget = "${RemoteUser}@${RemoteHost}"
$sshCmd = "ssh -i `"$KeyPath`" -o StrictHostKeyChecking=no $sshTarget `"$remoteCommands`""
Write-Output "Running: $sshCmd"
cmd /c $sshCmd

Write-Output "Deploy completed."
