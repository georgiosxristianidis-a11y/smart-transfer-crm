import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtmlPath = path.resolve(__dirname, '../index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

test('CSP: index.html has a strict Content-Security-Policy meta tag', () => {
  const match = indexHtml.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/i)
    || indexHtml.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content='([^']+)'/i)
    || indexHtml.match(/<meta[^>]*content="([^"]+)"[^>]*http-equiv=["']Content-Security-Policy["']/i)
    || indexHtml.match(/<meta[^>]*content='([^']+)'[^>]*http-equiv=["']Content-Security-Policy["']/i);
  assert.ok(match, 'index.html must have a Content-Security-Policy meta tag');

  const csp = match[1];
  const directives = {};
  for (const d of csp.split(';')) {
    const trimmed = d.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const val = parts.slice(1).join(' ');
    directives[name] = val;
  }


  // default-src must not allow unsafe-inline or unsafe-eval
  assert.ok(directives['default-src'], 'CSP must define default-src');
  assert.ok(!directives['default-src'].includes("'unsafe-inline'"), "default-src must not contain 'unsafe-inline'");
  assert.ok(!directives['default-src'].includes("'unsafe-eval'"), "default-src must not contain 'unsafe-eval'");

  // script-src must be defined without unsafe-*
  assert.ok(directives['script-src'], 'CSP must explicitly define script-src');
  assert.ok(!directives['script-src'].includes("'unsafe-inline'"), "script-src must not contain 'unsafe-inline'");
  assert.ok(!directives['script-src'].includes("'unsafe-eval'"), "script-src must not contain 'unsafe-eval'");
  assert.ok(directives['script-src'].includes("'self'"), "script-src must include 'self'");
  assert.ok(directives['script-src'].includes('https://cdn.jsdelivr.net'), 'script-src must include Chart.js CDN');

  // script-src-attr must not allow unsafe-inline
  if (directives['script-src-attr']) {
    assert.ok(!directives['script-src-attr'].includes("'unsafe-inline'"), "script-src-attr must not contain 'unsafe-inline'");
  }

  // Mandatory hardening directives
  assert.strictEqual(directives['object-src'], "'none'", "object-src must be 'none'");
  assert.strictEqual(directives['base-uri'], "'self'", "base-uri must be 'self'");
  assert.strictEqual(directives['connect-src'], "'self'", "connect-src must be 'self'");
});

test('CSP: index.html contains no inline script tags', () => {
  // Matches <script> tags that do NOT have a src="..." attribute
  const inlineScriptRegex = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  const inlineScripts = [];
  let match;
  while ((match = inlineScriptRegex.exec(indexHtml)) !== null) {
    const content = match[1].trim();
    if (content.length > 0) {
      inlineScripts.push(content);
    }
  }

  assert.strictEqual(
    inlineScripts.length,
    0,
    `Found ${inlineScripts.length} inline script(s) in index.html. All scripts must be external modules.`
  );
});

test('CSP: index.html contains no inline event handler attributes', () => {
  // Matches inline on* event handler attributes like onclick=, onsubmit=, etc.
  const inlineHandlerRegex = /\s(on[a-z]+)\s*=\s*["'][^"']*["']/gi;
  const inlineHandlers = [];
  let match;
  while ((match = inlineHandlerRegex.exec(indexHtml)) !== null) {
    inlineHandlers.push(match[0].trim());
  }

  assert.strictEqual(
    inlineHandlers.length,
    0,
    `Found inline event handler(s) in index.html: ${inlineHandlers.join(', ')}. Use addEventListener instead.`
  );
});
