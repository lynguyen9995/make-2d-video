# TEMPLATE: copy to projects/<slug>/jobs/ (with 2-full.bat). 2-full: contact sheet (QC) -> full render -> music/SFX mix -> subtitles -> checks.
$JobDir = $PSScriptRoot
. (Join-Path $PSScriptRoot '..\..\..\tools\jobs\common.ps1')
Init-Log 'full'
Init-Py
if (Test-Path (Join-Path $Studio "$P/story/build_shots.py")) {
  $rc = Py 'rebuild storyboard' @('-I', "$P/story/build_shots.py")
  if ($rc -ne 0) { Fail 'build_shots.py failed' }
}
$rc = Run 'contact sheet (QC, 0.5x)' 'node' @('render.mjs', '--project', $P, '--sheet', '--scale', '0.5', '--gl', 'auto')
if ($rc -ne 0) { Fail 'contact sheet render failed (a shot throws an error on Windows)' }
$t0 = Get-Date
$rc = Run 'full render 1080p' 'node' @('render.mjs', '--project', $P, '--gl', 'auto')
if ($rc -ne 0) { Fail 'full render failed' }
Say ("render time: {0:N1} min" -f ((Get-Date) - $t0).TotalMinutes)
$rc = Py 'mix' @('audio/mix.py', '--project', $P)
if ($rc -ne 0) { Fail 'mix.py failed' }
$final = ($script:LastOut | Where-Object { $_ -like 'FINAL VIDEO:*' } | Select-Object -Last 1)
if (-not $final) { Fail 'mix.py did not report a FINAL VIDEO' }
$final = $final.Substring(12).Trim()
$rc = Py 'subtitles' @('-I', 'tools/jobs/make_srt.py', $P)
if ($rc -ne 0) { Fail 'make_srt.py failed' }
$rc = Run 'final probe' 'ffprobe' @('-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'default=nw=1', $final)
Done ("final video: " + $final)
