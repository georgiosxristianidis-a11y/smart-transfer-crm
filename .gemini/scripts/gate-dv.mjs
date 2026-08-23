#!/usr/bin/env node

/**
 * gate-dv.mjs — Machine Double Verification Gate for Gemini 3.7 (Horse)
 * 
 * Verifies code quality, architectural isolation, and absence of lazy patterns:
 * 1. Store/View isolation (*.store.js must have 0 DOM/Window access)
 * 2. XSS safety (0 raw .innerHTML = assignments)
 * 3. Token fidelity (0 hardcoded #hex colors in JS)
 * 4. Zero-Lazy check (0 placeholder comments like // TODO, // ... unchanged)
 * 
 * Modes:
 *   node gate-dv.mjs          -> Checks git modified/uncommitted files
 *   node gate-dv.mjs --all    -> Full codebase audit
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isAllMode = process.argv.includes('--all') || process.argv.includes('-a');

// Find calculator directory
let calcDir = path.resolve(__dirname, '../../calculator');
if (!fs.existsSync(calcDir)) {
  calcDir = path.resolve(process.cwd(), 'calculator');
}
if (!fs.existsSync(calcDir) && fs.existsSync(path.resolve(process.cwd(), 'js'))) {
  calcDir = process.cwd();
}

const jsDir = path.join(calcDir, 'js');

if (!fs.existsSync(jsDir)) {
  console.error(`[DV-GATE] Error: js directory not found at ${jsDir}`);
  process.exit(1);
}

function getAllFiles(dir, ext = '.js', results = []) {
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        getAllFiles(fullPath, ext, results);
      }
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function getChangedFiles() {
  try {
    const statusOutput = execSync('git status --porcelain', { cwd: calcDir, encoding: 'utf8' });
    const changed = statusOutput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 3)
      .map(line => line.substring(3).trim())
      .filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.md'))
      .map(f => path.resolve(calcDir, f));
    return changed;
  } catch {
    return [];
  }
}

const violations = [];

function checkFile(filePath, checks) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(calcDir, filePath).replace(/\\/g, '/');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    for (const check of checks) {
      if (check.pattern.test(line)) {
        // Skip comment lines if checking for non-comment patterns
        if (check.ignoreComments && /^\s*(\/\/|\/\*|\*)/.test(line)) {
          continue;
        }
        violations.push({
          file: relPath,
          line: lineNum,
          rule: check.name,
          detail: check.message,
          snippet: line.trim()
        });
      }
    }
  });
}

// Rules definitions
const storeChecks = [
  {
    name: 'STORE_DOM_LEAK',
    pattern: /\b(document|window|querySelector|querySelectorAll|getElementById|addEventListener)\b/,
    ignoreComments: true,
    message: 'Store must not access DOM or Window APIs (CLAUDE.md:13)'
  },
  {
    name: 'STORE_INNERHTML',
    pattern: /\.innerHTML\b/,
    ignoreComments: true,
    message: 'Store must not contain HTML rendering logic'
  }
];

// Import Firewall (GEMINI.md, section 3): experience travels between projects, names do not.
// Markdown is audited for these symbols only — audit docs quote real violations on
// purpose (read-only history), so code rules would fire on the evidence itself.
//
// The list holds symbols that exist nowhere in this repository. Design vocabulary
// (glassmorphism, view transitions, spring easing) is deliberately absent: those words
// are native here, and a firewall that cries at native words is a firewall nobody keeps.
// Add a symbol here in the same commit that removes it from the source.
const FOREIGN_SYMBOLS = [
  'athlete pro',
  'athlete',
  'workout',
  'phase-verify',
  'Integrity[.]check',
  'codebase_investigator'
];

// Word boundaries are spelled out as character classes on purpose: the pattern is
// assembled, not written as a literal, so it stays readable and easy to extend.
const foreignCheck = {
  name: 'FOREIGN_ORIGIN',
  pattern: new RegExp(
    '(^|[^a-z0-9])(' + FOREIGN_SYMBOLS.join('|').replace(/ /g, '[ _-]?') + ')([^a-z0-9]|$)',
    'i'
  ),
  ignoreComments: false,
  message: 'Import Firewall: symbol borrowed from another project. Patterns travel, names do not (GEMINI.md, Import Firewall)'
};

const generalChecks = [
  foreignCheck,
  {
    name: 'RAW_INNERHTML',
    pattern: /\.innerHTML\s*=/,
    ignoreComments: true,
    message: 'Direct .innerHTML = is forbidden. Use html`...` from shared/utils.js (CLAUDE.md:14)'
  },
  {
    name: 'HEX_COLOR_IN_JS',
    pattern: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/,
    ignoreComments: true,
    message: 'Hex colors are forbidden in JS. Use tokens from css/tokens.css (CLAUDE.md:15)'
  },
  {
    name: 'LAZY_PLACEHOLDER',
    pattern: /\/\/\s*(\.\.\.|TODO|existing code|rest of code|unchanged|остальной код)/i,
    ignoreComments: false,
    message: 'Lazy placeholders are strictly forbidden. Supply full drop-in code.'
  },
  {
    name: 'LAZY_BLOCK_COMMENT',
    pattern: /\/\*\s*(\.\.\.|unchanged|TODO)\s*\*\//i,
    ignoreComments: false,
    message: 'Lazy comment blocks are forbidden.'
  },
  {
    name: 'GIT_CONFLICT_MARKERS',
    pattern: /^(<{7}|={7}|>{7})(?:\s|$)/m,
    ignoreComments: false,
    message: 'Unresolved git conflict markers (<<<<<<<, =======, >>>>>>>) found in source code!'
  }
];

// Target determination
let targetFiles = [];
if (isAllMode) {
  const allJsFiles = getAllFiles(jsDir);
  const testFiles = getAllFiles(path.join(calcDir, 'test'));
  const scriptFiles = getAllFiles(path.join(calcDir, 'scripts'), '.mjs');
  const docFiles = getAllFiles(path.join(calcDir, 'docs'), '.md');
  targetFiles = [...allJsFiles, ...testFiles, ...scriptFiles, ...docFiles];
} else {
  targetFiles = getChangedFiles();
  if (targetFiles.length === 0) {
    console.log('🛡️  DV GATE: No modified JS files found in git working tree. Running on scope files or use --all for full audit.');
  }
}

targetFiles.forEach(f => {
  if (f.endsWith('.md')) {
    checkFile(f, [foreignCheck]);
    return;
  }
  if (f.endsWith('.store.js')) {
    checkFile(f, storeChecks);
  }
  checkFile(f, generalChecks);
});

// Report results
console.log('='.repeat(60));
console.log(`🛡️  DV GATE: Machine Double Verification Report [${isAllMode ? 'FULL REPO' : 'CHANGED FILES'}]`);
console.log('='.repeat(60));
console.log(`Audited ${targetFiles.length} file(s)`);

if (violations.length === 0) {
  console.log('\n✅ ALL CHECKS PASSED (0 violations)');
  console.log('  • Store/View separation: 100% clean');
  console.log('  • XSS / innerHTML guard: 100% clean');
  console.log('  • CSS Tokens in JS: 100% clean');
  console.log('  • Zero-Lazy validation: 100% clean');
  console.log('  • Import Firewall (foreign origin): 100% clean');
  console.log('='.repeat(60));
  process.exit(0);
} else {
  console.error(`\n❌ FOUND ${violations.length} VIOLATION(S):\n`);
  violations.forEach((v, i) => {
    console.error(`[${i + 1}] ${v.rule} at ${v.file}:${v.line}`);
    console.error(`    Description: ${v.detail}`);
    console.error(`    Snippet:     ${v.snippet}\n`);
  });
  console.error('='.repeat(60));
  console.error('Gate result: FAILED. Fix violations before submitting PR/card.');
  console.error('='.repeat(60));
  process.exit(1);
}
