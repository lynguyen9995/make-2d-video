# Shared helpers for every video's job scripts (projects/<video>/jobs/*.ps1).
# A job script sets $JobDir = $PSScriptRoot, then dot-sources this file. Every command's output goes to the window AND to logs\<name>.log.
$ErrorActionPreference = 'Continue'
$Studio = (Resolve-Path (Join-Path $JobDir $(if ($StudioOnly) { '..\..' } else { '..\..\..' }))).Path
Set-Location $Studio
$LogDir = Join-Path $JobDir 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$P = if ($StudioOnly) { '' } else { 'projects/' + (Split-Path (Split-Path $JobDir -Parent) -Leaf) }

function Init-Log([string]$name) {
  $script:Log = Join-Path $LogDir "$name.log"
  $script:StatusFile = Join-Path $LogDir "$name.status"
  Set-Content -Path $script:Log -Value ("=== {0}  {1}  studio={2}" -f $name, (Get-Date -Format s), $Studio) -Encoding UTF8
  Set-Content -Path $script:StatusFile -Value 'RUNNING' -Encoding UTF8
  $envps1 = Join-Path $Studio 'env.ps1'
  if (Test-Path $envps1) { . $envps1; Say 'loaded env.ps1 (ffmpeg path)' }
}
function Say([string]$m) { Write-Host $m; Add-Content -Path $script:Log -Value $m -Encoding UTF8 }
function Line($o) { if ($o -is [System.Management.Automation.ErrorRecord]) { return $o.Exception.Message } else { return "$o" } }
function Run([string]$label, [string]$exe, [string[]]$Arguments) {
  Say ''
  Say (">>> [{0}] {1} {2}" -f $label, $exe, ($Arguments -join ' '))
  $script:LastOut = New-Object System.Collections.Generic.List[string]
  & $exe @Arguments 2>&1 | ForEach-Object { $s = Line $_; Say $s; $script:LastOut.Add($s) }
  $code = $LASTEXITCODE
  Say ("<<< [{0}] exit code {1}" -f $label, $code)
  return $code
}
function Fail([string]$m) { Say ''; Say "FAILED: $m"; Set-Content -Path $script:StatusFile -Value "FAILED: $m" -Encoding UTF8; exit 1 }
function Done([string]$m) { Say ''; Say "DONE: $m"; Set-Content -Path $script:StatusFile -Value "OK: $m" -Encoding UTF8; exit 0 }
function Find-Py {
  foreach ($cand in @('python', 'py -3', 'python3')) {
    $parts = $cand.Split(' ')
    $exe = $parts[0]; $pre = @($parts | Select-Object -Skip 1)
    if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
    $v = & $exe @pre -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null
    if ($LASTEXITCODE -eq 0 -and ("$v".Trim() -match '^3\.(\d+)$') -and ([int]$Matches[1] -ge 9)) { $r = @($exe) + $pre; return ,$r }
  }
  return $null
}
function Py([string]$label, [string[]]$Arguments) { return (Run $label $script:PYX ($script:PYA + $Arguments)) }
function Init-Py {
  $py = Find-Py
  if (-not $py) { Fail 'Python 3.9+ not found (tried python, py -3, python3). Not installing Python automatically.' }
  $script:PYX = $py[0]; $script:PYA = @($py | Select-Object -Skip 1)
  Say ("python: {0}" -f ($py -join ' '))
}
