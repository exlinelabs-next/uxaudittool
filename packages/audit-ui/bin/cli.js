#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const rl   = require('readline').createInterface({ input: process.stdin, output: process.stdout });

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const YELLOW = '\x1b[33m';
const DIM    = '\x1b[2m';

const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
  console.log(`\n${BOLD}${GREEN}  Webbeet Audit UI${RESET}  ${DIM}— drop a live audit page into your Next.js project${RESET}\n`);

  // ── Config prompts ────────────────────────────────────────────────────────
  const apiUrl = (await ask(`  ${CYAN}Audit API URL${RESET} ${DIM}(default: /api/audit)${RESET}  `)).trim() || '/api/audit';
  const ctaHref = (await ask(`  ${CYAN}CTA link${RESET} ${DIM}(default: https://webbeet.studio/contact)${RESET}  `)).trim() || 'https://webbeet.studio/contact';
  const ctaLabel = (await ask(`  ${CYAN}CTA button label${RESET} ${DIM}(default: Book a free discovery call)${RESET}  `)).trim() || 'Book a free discovery call';
  const accent = (await ask(`  ${CYAN}Accent colour${RESET} ${DIM}(default: #C8F135)${RESET}  `)).trim() || '#C8F135';
  const outDir = (await ask(`  ${CYAN}Output directory${RESET} ${DIM}(default: ./src)${RESET}  `)).trim() || './src';

  rl.close();

  const templatesDir = path.join(__dirname, '..', 'templates');
  const targetRoot   = path.resolve(process.cwd(), outDir);

  // Replacements applied to every template file
  const REPLACEMENTS = {
    '__API_URL__':   apiUrl,
    '__CTA_HREF__':  ctaHref,
    '__CTA_LABEL__': ctaLabel,
    '__ACCENT__':    accent,
  };

  function applyReplacements(content) {
    return Object.entries(REPLACEMENTS).reduce(
      (str, [token, value]) => str.replaceAll(token, value),
      content
    );
  }

  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath  = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        const content = fs.readFileSync(srcPath, 'utf8');
        fs.writeFileSync(destPath, applyReplacements(content), 'utf8');
        console.log(`  ${GREEN}+${RESET} ${path.relative(process.cwd(), destPath)}`);
      }
    }
  }

  console.log(`\n  ${BOLD}Installing files into ${outDir}${RESET}\n`);
  copyDir(templatesDir, targetRoot);

  console.log(`
  ${GREEN}${BOLD}Done!${RESET}

  ${BOLD}Next steps:${RESET}
  1. Add the route to your Next.js app:
     ${CYAN}app/audit/page.tsx${RESET}  →  import from ${outDir}/audit/page.tsx

  2. Customise the brand tokens in:
     ${CYAN}${outDir}/globals.css${RESET}

  3. Point the API URL in your env:
     ${CYAN}NEXT_PUBLIC_AUDIT_API_URL=${apiUrl}${RESET}

  ${DIM}All source files are now yours to edit freely.${RESET}
`);
}

main().catch(err => { console.error(err); process.exit(1); });
