param(
  [Parameter(Mandatory=$true)][string]$Dir,
  [Parameter(Mandatory=$true)][string]$Prompt,
  [string]$ResumeSession = "",
  [string]$Label
)
# Runs one claude -p invocation in the given dir, saves the JSON result,
# prints session_id. Env (PRISM_GEMINI_CHECK etc.) must be set by the caller.
$ErrorActionPreference = "Stop"
$out = "$PSScriptRoot\..\logs\$Label.json"
Set-Location -LiteralPath $Dir
$argsList = @("-p", $Prompt, "--output-format", "json", "--permission-mode", "acceptEdits")
if ($ResumeSession) {
  $argsList += @("--resume", $ResumeSession)
}
$json = & claude.cmd @argsList 2>$null
if (-not $json) {
  Write-Error "claude returned no output for $Label"
}
$json | Set-Content -NoNewline $out -Encoding Ascii
$parsed = $json | ConvertFrom-Json
Write-Output "LABEL=$Label SESSION=$($parsed.session_id) TURNS=$($parsed.num_turns) COST=$($parsed.total_cost_usd) ERROR=$($parsed.is_error)"