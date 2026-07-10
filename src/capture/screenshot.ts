import { execFile } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ELITE_PROCESS_NAME = "EliteDangerous64";

export type CaptureResult = { ok: true; path: string } | { ok: false; reason: string };

/**
 * Captures the Elite Dangerous window (by process name, not "whatever's focused") to a
 * PNG at `outputPath`, via a small embedded PowerShell/.NET script. No native Node addon
 * is used here deliberately - Stream Deck controls the exact Node ABI it ships, so a
 * native screenshot module could break silently on an app update; PowerShell already
 * exists on every Windows box.
 *
 * NB: this captures the window's own bitmap (PrintWindow), which requires Elite Dangerous
 * to be running in Borderless or Windowed mode - exclusive fullscreen windows generally
 * cannot be captured this way and will surface as a PRINTWINDOW_FAILED error below.
 */
export async function captureGameWindow(
	outputPath: string,
	processName: string = ELITE_PROCESS_NAME
): Promise<CaptureResult> {
	const scriptPath = ensureScriptOnDisk();
	try {
		await execFileAsync("powershell.exe", [
			"-NoProfile",
			"-ExecutionPolicy",
			"Bypass",
			"-File",
			scriptPath,
			"-ProcessName",
			processName,
			"-OutputPath",
			outputPath
		]);
		return { ok: true, path: outputPath };
	} catch (err) {
		const stderr = extractStderr(err);
		if (stderr.includes("PROCESS_NOT_FOUND")) {
			return { ok: false, reason: "Elite Dangerous window not found - is the game running?" };
		}
		if (stderr.includes("WINDOW_MINIMIZED")) {
			return { ok: false, reason: "Elite Dangerous window is minimized." };
		}
		if (stderr.includes("PRINTWINDOW_FAILED")) {
			return {
				ok: false,
				reason: "Screen capture failed - try running Elite Dangerous in Borderless or Windowed mode."
			};
		}
		return { ok: false, reason: `Screenshot capture failed: ${stderr.trim() || "unknown error"}` };
	}
}

function extractStderr(err: unknown): string {
	if (err && typeof err === "object" && "stderr" in err) {
		return String((err as { stderr: unknown }).stderr ?? "");
	}
	return err instanceof Error ? err.message : String(err);
}

let cachedScriptPath: string | null = null;

function ensureScriptOnDisk(): string {
	if (cachedScriptPath && existsSync(cachedScriptPath)) {
		return cachedScriptPath;
	}
	const dir = join(tmpdir(), "ed-mining-book");
	mkdirSync(dir, { recursive: true });
	const scriptPath = join(dir, "capture-window.ps1");
	writeFileSync(scriptPath, CAPTURE_SCRIPT, "utf8");
	cachedScriptPath = scriptPath;
	return scriptPath;
}

const CAPTURE_SCRIPT = `
param(
    [Parameter(Mandatory=$true)][string]$ProcessName,
    [Parameter(Mandatory=$true)][string]$OutputPath
)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class EdMiningBookWinCap {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) {
    Write-Error "PROCESS_NOT_FOUND"
    exit 2
}

$hwnd = $proc.MainWindowHandle
if ([EdMiningBookWinCap]::IsIconic($hwnd)) {
    Write-Error "WINDOW_MINIMIZED"
    exit 3
}

$rect = New-Object EdMiningBookWinCap+RECT
[EdMiningBookWinCap]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$width = $rect.Right - $rect.Left
$height = $rect.Bottom - $rect.Top
if ($width -le 0 -or $height -le 0) {
    Write-Error "INVALID_WINDOW_SIZE"
    exit 4
}

Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
# PW_RENDERFULLCONTENT (2) - needed for DirectX-rendered windows like Elite Dangerous;
# the default flag (0) usually produces a blank/black image for such windows.
$ok = [EdMiningBookWinCap]::PrintWindow($hwnd, $hdc, 2)
$g.ReleaseHdc($hdc)
if (-not $ok) {
    Write-Error "PRINTWINDOW_FAILED"
    exit 5
}

$outDir = Split-Path -Parent $OutputPath
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output "OK"
`;
