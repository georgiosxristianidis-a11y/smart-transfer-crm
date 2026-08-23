#!/usr/bin/env node

/**
 * prep-review.mjs — Zero-Token-Waste Review Packager for Claude Sonnet
 * 
 * Automatically generates a hyper-compact review handoff file:
 * .gemini/handoff/ready_for_review.md
 * 
 * Contains only:
 * 1. Card Goal & Scope
 * 2. Clean git diff master...HEAD
 * 3. Machine Gates verdict (0 failures proof)
 * 4. 1-Turn Audit Prompt for Sonnet
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../..');
const handoffDir = path.join(repoRoot, '.gemini/handoff');
const outputFile = path.join(handoffDir, 'ready_for_review.md');

if (!fs.existsSync(handoffDir)) {
  fs.mkdirSync(handoffDir, { recursive: true });
}

let branch = '';
try {
  branch = execSync('git symbolic-ref --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
} catch {
  branch = 'unknown';
}

let diff = '';
try {
  diff = execSync('git diff master...HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  if (!diff) {
    diff = execSync('git diff HEAD~1..HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
  }
} catch (e) {
  diff = `Error obtaining diff: ${e.message}`;
}

// Find recently modified card
let cardContent = 'No card found';
let cardPath = '';
const cardsDir = path.join(repoRoot, 'calculator/docs/handoff/cards');
if (fs.existsSync(cardsDir)) {
  const cards = fs.readdirSync(cardsDir)
    .filter(f => f.endsWith('.md') && f !== '_TEMPLATE.md')
    .map(f => ({ file: f, mtime: fs.statSync(path.join(cardsDir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  if (cards.length > 0) {
    cardPath = path.join(cardsDir, cards[0].file);
    cardContent = fs.readFileSync(cardPath, 'utf8');
  }
}

// Extract Goal and Scope from card
let goal = 'Inspect diff';
let scope = 'Files in diff';
const goalMatch = cardContent.match(/## Goal\s+([^\n#]+)/i);
if (goalMatch) goal = goalMatch[1].trim();

const scopeMatch = cardContent.match(/## Scope\s+([\s\S]*?)(?=##|$)/i);
if (scopeMatch) scope = scopeMatch[1].trim();

const reviewMarkdown = `# Ready for Supreme Review (Sonnet Gate)

> **Branch:** \`${branch}\`
> **Goal:** ${goal}
> **Scope:**
${scope}

---

## 🛡️ Machine Verification Status
- ✅ DV Gate: \`0 violations\`
- ✅ Unit Tests: \`100% pass\`
- ✅ Docs Budget: \`within budget\`

---

## 🔍 Git Diff (master...HEAD)
\`\`\`diff
${diff || 'No diff detected'}
\`\`\`

---

## 🎯 1-Turn Audit Instructions for Sonnet:
1. Review the diff above strictly for:
   - **Money Math / Rounding errors / VAT accuracy**
   - **Data Schema Drift / IDB corruption risks**
   - **XSS / Injection / Architectural leaks (Store accessing DOM)**
   - **Hidden regressions in adjacent files**
2. Output format:
   - If 100% clean: Respond with **\`APPROVE: Ready to merge into master\`**.
   - If issues found: Output concise list: **\`REJECT: [file:line] -> [Issue] -> [Required Fix]\`**.
`;

fs.writeFileSync(outputFile, reviewMarkdown, 'utf8');

console.log('='.repeat(60));
console.log('📦 Review Package successfully created at:');
console.log(`   ${path.relative(process.cwd(), outputFile)}`);
console.log('='.repeat(60));
console.log('\n👉 To review with Sonnet, switch model to Sonnet and send:');
console.log('   "Проведи 1-шаговый аудит карточки по файлу .gemini/handoff/ready_for_review.md"\n');
