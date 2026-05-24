#!/usr/bin/env node

/**
 * EBCertMap Cert Auditor
 * ----------------------
 * Reads all cert JSON files, validates schema, then hits every official_url
 * and checks for dead links, redirects, price drift, and discontinued certs.
 *
 * Usage:
 *   node scripts/audit.js
 *   node scripts/audit.js --schema-only       (skip network checks)
 *   node scripts/audit.js --domain offensive  (single domain)
 *   node scripts/audit.js --include-inactive  (also check active:false certs;
 *                                              by default they're skipped since
 *                                              they're definitionally not live)
 *
 * Output:
 *   scripts/audit-report.md
 *   scripts/audit-results.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CERTS_DIR = path.join(ROOT, 'public', 'data', 'certs');
const OUT_DIR = __dirname;

// ── Config ────────────────────────────────────────────────────────────────────

const CONCURRENCY = 10;          // parallel fetches
const FETCH_TIMEOUT_MS = 10000;  // 10s per URL
const PRICE_DRIFT_THRESHOLD = 0.20; // flag if page price differs by >20%

const VALID_DOMAINS = [
  'offensive', 'appsec', 'dfir', 'defensive_soc', 'cloud_security',
  'network_security', 'grc', 'iam', 'threat_intelligence', 'ai_security',
  'ot_ics_iot', 'data_privacy', 'security_architecture',
  'vulnerability_management', 'oversight_leadership'
];

const VALID_PRACTICAL_WEIGHTS = new Set([0, 25, 50, 70, 100]);

const VALID_FLAGS = new Set([
  'free', 'low_cost', 'new', 'paused', 'retiring',
  'low_community_respect', 'tool_vendor', 'portfolio_based',
  'hands_on', 'boutique', 'course_tied',
  'law_enforcement', 'no_exam',
]);

const DISCONTINUED_KEYWORDS = [
  'retired', 'discontinued', 'no longer available', 'no longer offered',
  'end of life', 'sunset', 'deprecated', 'coming soon', 'not available'
];

const REQUIRED_FIELDS = [
  'id', 'acronym', 'full_name', 'issuing_body', 'domain', 'level',
  'cost_usd', 'renewal', 'summary', 'official_url', 'active'
];

const VALID_LEVELS = new Set(['beginner', 'intermediate', 'expert', 'elite']);

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const schemaOnly = args.includes('--schema-only');
const includeInactive = args.includes('--include-inactive');
const domainFilter = (() => {
  const i = args.indexOf('--domain');
  return i !== -1 ? args[i + 1] : null;
})();

// ── Load all certs ────────────────────────────────────────────────────────────

function loadAllCerts() {
  const files = fs.readdirSync(CERTS_DIR).filter(f => f.endsWith('.json'));
  const allCerts = [];
  const seenIds = new Map(); // id -> filename

  for (const file of files) {
    const domain = file.replace('.json', '');
    if (domainFilter && domain !== domainFilter) continue;

    const raw = fs.readFileSync(path.join(CERTS_DIR, file), 'utf8');
    let certs;
    try {
      certs = JSON.parse(raw);
    } catch (e) {
      console.error(`❌ JSON parse error in ${file}: ${e.message}`);
      process.exit(1);
    }

    if (!Array.isArray(certs)) {
      console.error(`❌ ${file} is not an array`);
      process.exit(1);
    }

    for (const cert of certs) {
      // duplicate ID check
      cert.__file = file;
      if (seenIds.has(cert.id)) {
        cert.__duplicate_of = seenIds.get(cert.id);
      } else {
        seenIds.set(cert.id, file);
      }
      allCerts.push(cert);
    }
  }

  return allCerts;
}

// ── Schema validation ─────────────────────────────────────────────────────────

function validateSchema(cert) {
  const issues = [];

  // duplicate
  if (cert.__duplicate_of) {
    issues.push({
      severity: 'critical',
      field: 'id',
      message: `Duplicate ID "${cert.id}" — also in ${cert.__duplicate_of}`
    });
  }

  // required fields
  for (const field of REQUIRED_FIELDS) {
    if (cert[field] === undefined || cert[field] === null || cert[field] === '') {
      issues.push({ severity: 'schema', field, message: `Missing or empty required field: ${field}` });
    }
  }

  // practical_weight
  if (!VALID_PRACTICAL_WEIGHTS.has(cert.practical_weight)) {
    issues.push({
      severity: 'schema',
      field: 'practical_weight',
      message: `Invalid practical_weight: ${cert.practical_weight} (must be 0, 25, 50, 70, or 100)`
    });
  }

  // level
  if (cert.level && !VALID_LEVELS.has(cert.level)) {
    issues.push({
      severity: 'schema',
      field: 'level',
      message: `Invalid level: "${cert.level}" (must be beginner, intermediate, expert, or elite)`
    });
  }

  // domain array
  if (Array.isArray(cert.domain)) {
    for (const d of cert.domain) {
      if (!VALID_DOMAINS.includes(d)) {
        issues.push({
          severity: 'schema',
          field: 'domain',
          message: `Unknown domain: "${d}"`
        });
      }
    }
  } else {
    issues.push({ severity: 'schema', field: 'domain', message: 'domain must be an array' });
  }

  // flags
  if (Array.isArray(cert.flags)) {
    for (const f of cert.flags) {
      if (!VALID_FLAGS.has(f)) {
        issues.push({
          severity: 'schema',
          field: 'flags',
          message: `Unknown flag: "${f}"`
        });
      }
    }
  }

  // scores
  if (cert.scores) {
    const intFields = [
      'exam_difficulty', 'practical_depth', 'employer_recognition',
      'community_respect', 'salary_impact', 'time_to_prepare'
    ];
    for (const f of intFields) {
      const v = cert.scores[f];
      if (v === undefined) {
        issues.push({ severity: 'schema', field: `scores.${f}`, message: `Missing score field: ${f}` });
      } else if (!Number.isInteger(v) || v < 0 || v > 10) {
        issues.push({
          severity: 'schema',
          field: `scores.${f}`,
          message: `scores.${f} must be an integer 0-10, got: ${v}`
        });
      }
    }
    if (cert.scores.overall !== undefined) {
      const o = cert.scores.overall;
      if (typeof o !== 'number' || o < 0 || o > 10) {
        issues.push({
          severity: 'schema',
          field: 'scores.overall',
          message: `scores.overall must be a number 0-10, got: ${o}`
        });
      }
    }
  } else {
    issues.push({ severity: 'schema', field: 'scores', message: 'Missing scores object' });
  }

  // URL format
  if (cert.official_url) {
    try {
      new URL(cert.official_url);
    } catch {
      issues.push({
        severity: 'schema',
        field: 'official_url',
        message: `Invalid URL format: "${cert.official_url}"`
      });
    }
  }

  // cost sanity
  if (cert.cost_usd !== undefined && cert.cost_usd !== null) {
    if (typeof cert.cost_usd !== 'number' || cert.cost_usd < 0) {
      issues.push({
        severity: 'schema',
        field: 'cost_usd',
        message: `cost_usd must be a non-negative number, got: ${cert.cost_usd}`
      });
    }
  }

  // summary length
  if (cert.summary && cert.summary.length < 30) {
    issues.push({
      severity: 'schema',
      field: 'summary',
      message: `Summary suspiciously short (${cert.summary.length} chars)`
    });
  }

  return issues;
}

// ── Network checks ────────────────────────────────────────────────────────────

async function checkUrl(cert) {
  const result = {
    status: null,
    finalUrl: null,
    redirected: false,
    reachable: false,
    discontinued: false,
    discontinuedKeyword: null,
    nameFound: false,
    priceMismatch: false,
    priceMismatchSuspect: false,
    pagePrice: null,
    responseMs: null,
    error: null,
  };

  if (!cert.official_url) return result;

  let url;
  try { url = new URL(cert.official_url); } catch { return result; }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(cert.official_url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'EBCertMap-Auditor/1.0 (https://ebcertmap.com; cert data accuracy checker)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    clearTimeout(timer);
    result.responseMs = Date.now() - start;
    result.status = res.status;
    result.finalUrl = res.url;
    result.redirected = res.url !== cert.official_url &&
      res.url.replace(/\/$/, '') !== cert.official_url.replace(/\/$/, '');
    result.blocked = res.status === 403 || res.status === 429;
    result.reachable = res.ok;

    if (res.ok) {
      const text = await res.text();
      const lower = text.toLowerCase();

      // discontinued keywords — only flag if keyword appears near the cert name/acronym
      // to avoid false positives from "CEH v11 was retired" style sidebars
      const acronymLower = (cert.acronym || '').toLowerCase();
      const nameLower = (cert.full_name || '').toLowerCase();
      const PROXIMITY = 200; // chars either side of the keyword

      for (const kw of DISCONTINUED_KEYWORDS) {
        const kwIdx = lower.indexOf(kw);
        if (kwIdx === -1) continue;
        // check if cert name or acronym appears within PROXIMITY chars
        const nearby = lower.slice(
          Math.max(0, kwIdx - PROXIMITY),
          Math.min(lower.length, kwIdx + kw.length + PROXIMITY)
        );
        if (
          (acronymLower.length > 1 && nearby.includes(acronymLower)) ||
          (nameLower.length > 4 && nearby.includes(nameLower.slice(0, 20)))
        ) {
          result.discontinued = true;
          result.discontinuedKeyword = kw;
          break;
        }
      }

      // name/acronym present on page
      const acronym = cert.acronym?.toLowerCase() || '';
      const shortName = cert.full_name?.split(' ').slice(0, 3).join(' ').toLowerCase() || '';
      result.nameFound = acronym.length > 1
        ? (lower.includes(acronym) || lower.includes(shortName))
        : lower.includes(shortName);

      // price check — look for currency amounts (USD, GBP, EUR)
      if (cert.cost_usd && cert.cost_usd > 0) {
        const priceMatches = text.match(/[$£€]\s?[\d,]+|\b(?:USD|GBP|EUR)\s+[\d,]+/gi) || [];
        const prices = priceMatches
          .map(p => parseInt(p.replace(/[^0-9]/g, ''), 10))
          .filter(p => p > 0 && p < 50000);

        if (prices.length > 0) {
          // find the closest price to our cost_usd
          const closest = prices.reduce((a, b) =>
            Math.abs(b - cert.cost_usd) < Math.abs(a - cert.cost_usd) ? b : a
          );
          const drift = Math.abs(closest - cert.cost_usd) / cert.cost_usd;
          if (drift > PRICE_DRIFT_THRESHOLD) {
            result.priceMismatch = true;
            result.pagePrice = closest;
            // Heuristic: extreme drift (>70%) or sub-$50 detected on a >$100 cert
            // is much more likely to be a shipping fee, subscription footer, or
            // unrelated price tag than a genuine price cut. Still flag — but mark
            // as suspect so the user knows to verify manually before acting.
            const SUSPECT_DRIFT = 0.70;
            const SUSPECT_MIN_ABSOLUTE = 50;
            if (drift > SUSPECT_DRIFT || (closest < SUSPECT_MIN_ABSOLUTE && cert.cost_usd > 100)) {
              result.priceMismatchSuspect = true;
            }
          }
        }
      }
    }
  } catch (err) {
    result.responseMs = Date.now() - start;
    result.error = err.name === 'AbortError' ? 'timeout' : err.message;
    result.reachable = false;
  }

  return result;
}

// ── Concurrency helper ────────────────────────────────────────────────────────

async function runInBatches(items, fn, concurrency) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    process.stdout.write(`  Checked ${Math.min(i + concurrency, items.length)}/${items.length}\r`);
  }
  console.log();
  return results;
}

// ── Report generation ─────────────────────────────────────────────────────────

function buildReport(auditResults, startTime) {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const now = new Date().toISOString().split('T')[0];

  const critical = auditResults.filter(r =>
    r.schemaIssues.some(i => i.severity === 'critical') ||
    (r.network && !r.network.blocked && (!r.network.reachable || r.network.status === 404)) ||
    (r.network?.error)
  );

  const warnings = auditResults.filter(r =>
    !critical.includes(r) && (
      r.network?.blocked ||
      r.network?.redirected ||
      r.network?.discontinued ||
      r.network?.priceMismatch ||
      (!r.network?.nameFound && r.network?.reachable && !r.network?.blocked)
    )
  );

  const schemaIssues = auditResults.filter(r =>
    !critical.includes(r) &&
    !warnings.includes(r) &&
    r.schemaIssues.some(i => i.severity === 'schema')
  );

  const clean = auditResults.filter(r =>
    !critical.includes(r) && !warnings.includes(r) && !schemaIssues.includes(r)
  );

  let md = `# EBCertMap Audit Report\n\n`;
  md += `**Date:** ${now}  \n`;
  md += `**Certs checked:** ${auditResults.length}  \n`;
  md += `**Runtime:** ${elapsed}s  \n`;
  md += `**Mode:** ${schemaOnly ? 'Schema only' : 'Full (schema + network)'}  \n\n`;
  md += `---\n\n`;
  md += `## Summary\n\n`;
  md += `| Severity | Count |\n|---|---|\n`;
  md += `| 🔴 Critical | ${critical.length} |\n`;
  md += `| 🟡 Warning | ${warnings.length} |\n`;
  md += `| 🟠 Schema | ${schemaIssues.length} |\n`;
  md += `| ✅ Clean | ${clean.length} |\n\n`;
  md += `---\n\n`;

  // ── Critical ──
  if (critical.length > 0) {
    md += `## 🔴 Critical\n\n`;
    for (const r of critical) {
      md += `### ${r.cert.acronym} — \`${r.cert.id}\` (${r.cert.__file})\n\n`;
      md += `**${r.cert.full_name}** | ${r.cert.issuing_body}\n\n`;

      for (const issue of r.schemaIssues) {
        const icon = issue.severity === 'critical' ? '🔴' : '🟠';
        md += `- ${icon} **Schema — ${issue.field}:** ${issue.message}\n`;
      }

      if (r.network) {
        if (r.network.error) {
          md += `- 🔴 **Network error:** ${r.network.error}\n`;
        }
        if (r.network.status === 404) {
          md += `- 🔴 **404 Not Found:** ${r.cert.official_url}\n`;
        }
        if (r.network.status >= 500) {
          md += `- 🔴 **Server error (${r.network.status}):** ${r.cert.official_url}\n`;
        }
        if (!r.network.reachable && !r.network.error && !r.network.blocked && r.network.status) {
          md += `- 🔴 **Unreachable (HTTP ${r.network.status}):** ${r.cert.official_url}\n`;
        }
      }

      md += `\n**Official URL:** ${r.cert.official_url}\n\n---\n\n`;
    }
  }

  // ── Warnings ──
  if (warnings.length > 0) {
    md += `## 🟡 Warnings\n\n`;
    for (const r of warnings) {
      md += `### ${r.cert.acronym} — \`${r.cert.id}\`\n\n`;
      md += `**${r.cert.full_name}** | ${r.cert.issuing_body}\n\n`;

      if (r.network?.blocked) {
        md += `- 🟡 **Blocked (HTTP ${r.network.status}):** Bot detection or access restriction — cert may be fine, URL needs manual check\n`;
      }
      if (r.network?.redirected) {
        md += `- 🟡 **Redirect:** ${r.cert.official_url} → ${r.network.finalUrl}\n`;
      }
      if (r.network?.discontinued) {
        md += `- 🟡 **Possible discontinuation:** Page contains keyword "${r.network.discontinuedKeyword}"\n`;
      }
      if (r.network?.priceMismatch) {
        const suspect = r.network.priceMismatchSuspect
          ? ' _(likely false positive — page price probably matched a shipping fee, subscription tier, or unrelated amount; verify manually)_'
          : '';
        md += `- 🟡 **Price mismatch:** We have $${r.cert.cost_usd}, page shows ~$${r.network.pagePrice}${suspect}\n`;
      }
      if (!r.network?.nameFound && r.network?.reachable) {
        md += `- 🟡 **Name not found on page:** "${r.cert.acronym}" not detected in page content\n`;
      }

      md += `\n**Official URL:** ${r.cert.official_url}  \n`;
      if (r.network?.responseMs) md += `**Response time:** ${r.network.responseMs}ms\n`;
      md += `\n---\n\n`;
    }
  }

  // ── Schema ──
  if (schemaIssues.length > 0) {
    md += `## 🟠 Schema Issues\n\n`;
    for (const r of schemaIssues) {
      md += `### ${r.cert.acronym} — \`${r.cert.id}\` (${r.cert.__file})\n\n`;
      for (const issue of r.schemaIssues) {
        const icon = issue.severity === 'critical' ? '🔴' : '🟠';
        md += `- ${icon} **${issue.field}:** ${issue.message}\n`;
      }
      md += `\n---\n\n`;
    }
  }

  // ── Clean ──
  md += `## ✅ Clean (${clean.length} certs)\n\n`;
  md += clean.map(r => `- \`${r.cert.id}\` — ${r.cert.acronym} (${r.cert.issuing_body})`).join('\n');
  md += '\n';

  return { md, summary: { critical: critical.length, warnings: warnings.length, schema: schemaIssues.length, clean: clean.length } };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  console.log('\n🔍 EBCertMap Cert Auditor\n');

  // Load
  console.log('📂 Loading cert files...');
  const certs = loadAllCerts();
  console.log(`   Loaded ${certs.length} certs from ${CERTS_DIR}\n`);

  // Schema
  console.log('📋 Running schema validation...');
  const auditResults = certs.map(cert => ({
    cert,
    schemaIssues: validateSchema(cert),
    network: null,
  }));
  const schemaErrorCount = auditResults.reduce((n, r) => n + r.schemaIssues.length, 0);
  console.log(`   ${schemaErrorCount} schema issues found\n`);

  // Network — by default skip active:false certs (their URLs being dead is expected)
  if (!schemaOnly) {
    const networkTargets = includeInactive
      ? auditResults
      : auditResults.filter(r => r.cert.active !== false);
    const skipped = auditResults.length - networkTargets.length;
    console.log(`🌐 Running network checks on ${networkTargets.length} certs${skipped ? ` (skipped ${skipped} inactive — pass --include-inactive to check them)` : ''}...`);
    await runInBatches(
      networkTargets,
      async (r) => {
        r.network = await checkUrl(r.cert);
        return r;
      },
      CONCURRENCY
    );
    console.log(`   Network checks complete\n`);
  }

  // Report
  console.log('📝 Generating report...');
  const { md, summary } = buildReport(auditResults, startTime);

  const reportPath = path.join(OUT_DIR, 'audit-report.md');
  const jsonPath = path.join(OUT_DIR, 'audit-results.json');

  fs.writeFileSync(reportPath, md, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(
    auditResults.map(r => ({
      id: r.cert.id,
      acronym: r.cert.acronym,
      file: r.cert.__file,
      schemaIssues: r.schemaIssues,
      network: r.network,
    })),
    null, 2
  ), 'utf8');

  console.log(`✅ Report written to ${reportPath}`);
  console.log(`✅ JSON written to ${jsonPath}\n`);

  console.log('── Summary ──────────────────────────');
  console.log(`🔴 Critical: ${summary.critical}`);
  console.log(`🟡 Warnings: ${summary.warnings}`);
  console.log(`🟠 Schema:   ${summary.schema}`);
  console.log(`✅ Clean:    ${summary.clean}`);
  console.log(`─────────────────────────────────────\n`);

  if (summary.critical > 0) process.exit(1); // non-zero exit for CI
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});