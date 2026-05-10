// Vite plugin — at build time, inject static cert/news content into index.html
// and regenerate sitemap.xml with the current date.
//
// Why: EBCertMap is a Vite + React SPA, so the runtime DOM is empty until JS
// hydrates. AI crawlers (Anthropic, OpenAI, Perplexity), Googlebot's first-pass
// crawl, and JS-disabled clients all see <div id="root"></div> with no content.
// This plugin bakes the catalog into the served HTML so crawlers can read it
// without executing JavaScript.
//
// Outputs (build only):
//   1. <script type="application/ld+json"> — schema.org ItemList of every cert
//      (slim — name, acronym, url, level, provider). Acts as a directory listing
//      that AI crawlers parse natively. ~40KB for 425+ certs.
//   2. <noscript> block — full cert catalog grouped by domain, plus the latest
//      news and changelog with <time datetime> tags for crawler freshness.
//   3. <meta property="og:updated_time"> and article:modified_time set to the
//      latest changelog date.
//   4. Regenerated sitemap.xml with lastmod = latest changelog date.

import fs from "node:fs";
import path from "node:path";

const NEWS_LIMIT = 5;
const CHANGELOG_LIMIT = 5;
const NOSCRIPT_SUMMARY_CHARS = 220;
const SITE_URL = "https://ebcertmap.com/";

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, m => (
    { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]
  ));
}

function loadCerts(certsDir) {
  const all = [];
  for (const file of fs.readdirSync(certsDir)) {
    if (!file.endsWith(".json")) continue;
    const certs = JSON.parse(fs.readFileSync(path.join(certsDir, file), "utf8"));
    for (const c of certs) all.push(c);
  }
  const seen = new Set();
  return all.filter(c => seen.has(c.id) ? false : seen.add(c.id));
}

// Slim JSON-LD — directory listing, no descriptions. Keeps the payload small;
// rich content lives in the <noscript> block where crawlers read it as HTML.
function buildJsonLd(certs) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "EBCertMap Certifications",
    "numberOfItems": certs.length,
    "itemListElement": certs.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "EducationalOccupationalCredential",
        "name": c.full_name,
        "alternateName": c.acronym,
        "credentialCategory": "Certification",
        "educationalLevel": c.level,
        "provider": { "@type": "Organization", "name": c.issuing_body },
        "url": c.official_url || SITE_URL,
      },
    })),
  };
}

function buildNoscript(certs, domains, about) {
  const byDomain = Object.fromEntries(domains.map(d => [d.id, []]));
  for (const c of certs) {
    const primary = Array.isArray(c.domain) ? c.domain[0] : c.domain;
    if (byDomain[primary]) byDomain[primary].push(c);
  }

  const certListItem = c => {
    const summary = (c.summary || "").slice(0, NOSCRIPT_SUMMARY_CHARS);
    const officialLink = c.official_url
      ? ` — <a href="${escapeHtml(c.official_url)}" rel="nofollow noopener">official</a>`
      : "";
    return `<li>
            <strong>${escapeHtml(c.acronym)}</strong> — ${escapeHtml(c.full_name)}<br>
            <small>${escapeHtml(c.issuing_body)} · ${escapeHtml(c.level)} · ${c.practical_weight}% practical${c.cost_usd != null ? ` · $${c.cost_usd}` : ""}${officialLink}</small>
            ${summary ? `<p>${escapeHtml(summary)}${c.summary && c.summary.length > NOSCRIPT_SUMMARY_CHARS ? "…" : ""}</p>` : ""}
          </li>`;
  };

  const domainsHtml = domains.map(d => {
    const list = byDomain[d.id] || [];
    if (!list.length) return "";
    return `
      <section>
        <h2>${escapeHtml(d.label)} (${list.length} certs)</h2>
        <p>${escapeHtml(d.description || "")}</p>
        <ul>
          ${list.map(certListItem).join("\n          ")}
        </ul>
      </section>`;
  }).filter(Boolean).join("\n");

  const newsHtml = (about.news || []).slice(0, NEWS_LIMIT).map(n => `
      <article>
        <h3><time datetime="${escapeHtml(n.date)}">${escapeHtml(n.date)}</time> — ${escapeHtml(n.title)}</h3>
        <p>${escapeHtml(n.body)}</p>
      </article>`).join("");

  const changelogHtml = (about.changelog || []).slice(0, CHANGELOG_LIMIT).map(c => `
      <article>
        <h3><time datetime="${escapeHtml(c.date)}">${escapeHtml(c.date)}</time> — ${escapeHtml(c.title)}</h3>
        <ul>${(c.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
      </article>`).join("");

  return `
<noscript>
  <header>
    <h1>EBCertMap — Cybersecurity Certification Navigator</h1>
    <p>Browse ${certs.length}+ cybersecurity certifications across ${domains.length} domains. Map certs to skills, explore role-based career paths, and find your next cert.</p>
    <p><strong>This site requires JavaScript for full interactive features.</strong> The catalog below is a static fallback for accessibility and search indexing.</p>
  </header>
  <main>
${domainsHtml}
    <section>
      <h2>Recent Updates</h2>
      ${newsHtml}
    </section>
    <section>
      <h2>Changelog</h2>
      ${changelogHtml}
    </section>
    <section>
      <h2>Community &amp; Contribution</h2>
      <p>EBCertMap is open-source and accepts community contributions. See <a href="https://github.com/KillerEB/EBCertMap/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a> for the cert submission guide. Discussion thread on r/cybersecurity.</p>
    </section>
  </main>
</noscript>`;
}

function buildSitemap(lastmod) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

export function staticContentPlugin() {
  // Read everything once at plugin instantiation so all hooks have it available
  // regardless of which fires first.
  const root = process.cwd();
  let cached;
  const init = () => {
    if (cached) return cached;
    const certs   = loadCerts(path.join(root, "public/data/certs"));
    const domains = JSON.parse(fs.readFileSync(path.join(root, "public/data/domains.json"), "utf8"));
    const about   = JSON.parse(fs.readFileSync(path.join(root, "public/data/about.json"), "utf8"));
    const allDates = [
      ...(about.news      || []).map(n => n.date),
      ...(about.changelog || []).map(c => c.date),
    ].filter(Boolean).sort();
    const lastmod = allDates.length ? allDates[allDates.length - 1] : new Date().toISOString().slice(0, 10);
    cached = { certs, domains, about, lastmod };
    return cached;
  };

  return {
    name: "ebcertmap-static-content",
    apply: "build",

    transformIndexHtml: {
      order: "post",
      handler(html) {
        const { certs, domains, about, lastmod } = init();
        const ldScript = `<script type="application/ld+json">${JSON.stringify(buildJsonLd(certs))}</script>`;
        const noscript = buildNoscript(certs, domains, about);
        const ogUpdated = `<meta property="og:updated_time" content="${lastmod}T00:00:00Z" />\n    <meta property="article:modified_time" content="${lastmod}T00:00:00Z" />`;

        html = html.replace(/<\/head>/i, `    ${ogUpdated}\n    ${ldScript}\n  </head>`);
        html = html.replace(
          /<div id="root"><\/div>/,
          `<div id="root"></div>${noscript}`
        );

        console.log(`[static-content] injected JSON-LD ItemList (${certs.length} certs), noscript fallback, OG updated=${lastmod}`);
        return html;
      },
    },

    generateBundle(_options, bundle) {
      const { lastmod } = init();
      const xml = buildSitemap(lastmod);
      const sitemapKey = Object.keys(bundle).find(k => k.endsWith("sitemap.xml"));
      if (sitemapKey) {
        bundle[sitemapKey].source = xml;
        console.log(`[static-content] regenerated sitemap.xml lastmod=${lastmod}`);
      } else {
        this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
        console.log(`[static-content] emitted sitemap.xml lastmod=${lastmod}`);
      }
    },
  };
}