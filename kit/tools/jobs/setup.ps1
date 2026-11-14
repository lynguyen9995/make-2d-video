# 1-setup: install the studio's dependencies (approved by the user), check them, make sure the skill is cloned, self-test the renderer.
$JobDir = $PSScriptRoot; $StudioOnly = $true
. (Join-Path $PSScriptRoot 'common.ps1')
Init-Log 'setup'
Say ("PowerShell {0}" -f $PSVersionTable.PSVersion)
Init-Py
foreach ($t in 'node', 'npm', 'git', 'ffmpeg', 'ffprobe') {
  $c = Get-Command $t -ErrorAction SilentlyContinue
  Say ("{0,-8} {1}" -f $t, $(if ($c) { $c.Source } else { 'NOT FOUND' }))
}
$rc = Py 'doctor --install' @('tools/doctor.py', '--install')
$envps1 = Join-Path $Studio 'env.ps1'
if (Test-Path $envps1) { . $envps1; Say 'loaded env.ps1 (ffmpeg path)' }
$rc = Py 'doctor (re-check)' @('tools/doctor.py')
if (@($script:LastOut | Where-Object { $_ -match 'MISSING' }).Count -gt 0) { Fail 'doctor still reports MISSING items (see the list above). Node/ffmpeg/Python are not installed automatically.' }
$rc = Py 'python -I imports' @('-I', '-c', 'import numpy, scipy, faster_whisper; print(1)')
if ($rc -ne 0) { Fail 'python -I cannot import numpy/scipy/faster_whisper' }
$skill = Join-Path $env:USERPROFILE '.claude\skills\make-2d-video'
if (Test-Path (Join-Path $skill 'SKILL.md')) {
  Say ''; Say "skill already present: $skill"
  Select-String -Path (Join-Path $skill 'SKILL.md') -Pattern 'version:' | Select-Object -First 1 | ForEach-Object { Say ('  ' + $_.Line.Trim()) }
} else {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'git not found, cannot clone the skill' }
  New-Item -ItemType Directory -Force -Path (Split-Path $skill) | Out-Null
  $rc = Run 'clone skill' 'git' @('clone', 'https://github.com/lynguyen9995/make-2d-video', $skill)
  if ($rc -ne 0) { Fail 'git clone of the skill failed' }
}
$rc = Run 'self-test (toon demo sheet)' 'node' @('render.mjs', '--project', 'examples/toon-demo', '--sheet', '--scale', '0.3', '--gl', 'auto')
if ($rc -ne 0) { Fail 'renderer self-test failed' }
Done 'studio ready'
