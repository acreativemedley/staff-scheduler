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

$buildDir = Join-Path -Path (Get-Location) -ChildPath 'build'
if (-not (Test-Path $buildDir)) { throw "Build output directory 'build' not found" }

$archive = "build.zip"
if (Test-Path $archive) { Remove-Item $archive }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($buildDir, $archive)

Write-Output "Uploading $archive to $RemoteUser@$RemoteHost:$RemotePath"

if (-not (Test-Path $KeyPath)) { Write-Output "Warning: SSH key not found at $KeyPath — will attempt password auth" }

# Copy zip to remote /tmp
$scpCmd = "scp -i `"$KeyPath`" -o StrictHostKeyChecking=no $archive $RemoteUser@$RemoteHost:/tmp/"
Write-Output "Running: $scpCmd"
cmd /c $scpCmd

# Unpack and set permissions on remote
$sshCmd = "ssh -i `"$KeyPath`" -o StrictHostKeyChecking=no $RemoteUser@$RemoteHost `"sudo mkdir -p $RemotePath && sudo rm -rf $RemotePath/* && sudo unzip -o /tmp/$archive -d $RemotePath && sudo chown -R www-data:www-data $RemotePath && rm /tmp/$archive`""
Write-Output "Running: $sshCmd"
cmd /c $sshCmd

Write-Output "Deploy completed."
