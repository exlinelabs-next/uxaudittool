export const SANDBOX_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
];

export interface BrowserConfig {
  executablePath: string;
  args: string[];
}

export async function getBrowserConfig(): Promise<BrowserConfig> {
  // 1. Explicit env var - local dev (Brave, Chrome, etc.)
  if (process.env.CHROMIUM_EXECUTABLE_PATH) {
    return { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH, args: SANDBOX_ARGS };
  }

  // 2. System Chromium on PATH - Railway (installed via nixpacks.toml)
  try {
    const { execSync } = await import('child_process');
    const found = execSync(
      'which chromium 2>/dev/null || which chromium-browser 2>/dev/null || which google-chrome-stable 2>/dev/null',
      { encoding: 'utf-8', timeout: 3000 }
    ).trim();
    if (found) return { executablePath: found, args: SANDBOX_ARGS };
  } catch {
    // not on PATH - fall through
  }

  // 3. Locally installed Chrome on macOS - @sparticuz/chromium is a Linux-only binary
  if (process.platform === 'darwin') {
    const { existsSync } = await import('fs');
    const macChrome = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ].find(p => existsSync(p));
    if (macChrome) return { executablePath: macChrome, args: SANDBOX_ARGS };
  }

  // 4. @sparticuz/chromium - last resort fallback (Linux)
  const { default: chromium } = await import('@sparticuz/chromium');
  return { executablePath: await chromium.executablePath(), args: chromium.args };
}
