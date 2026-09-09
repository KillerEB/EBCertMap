// Per-cert prerendering for the static-content build plugin.
//
// Why: a single-URL SPA cannot be deep-linked or ranked per certification. The
// JSON-LD ItemList and the noscript catalog on the home page were stopgaps for
// the per-cert pages that did not exist. Each cert now gets a real document at
// /cert/<id> with its own title, description, canonical URL and credential
// schema, so it can be shared, indexed and read without JavaScript.
//
// The home page's 148KB ItemList and full catalog noscript are stripped from
// these pages: duplicating them across 426 files would balloon the build and say
// nothing useful about the individual certification.

export const SITE_URL = "https://ebcertmap.com/";

export function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, m => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]
  ));
}

// JSON.stringify does not escape "</script>", so any field containing it would
// break out of a <script type="application/ld+json"> block. Escaping "<" as
// < is still valid JSON and parses back to "<" for consumers. U+2028/U+2029
// are escaped as defence in depth for the case where this lands in a real inline
// script; ld+json itself is data and is not executed.
export function jsonLdSafe(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const SCRIPT_OPEN = '<scr' + 'ipt type="application/ld+json">';
const SCRIPT_CLOSE = '</scr' + 'ipt>';

function domainLabels(cert, domains) {
  return (cert.domain || [])
    .map(id => (domains.find(d => d.id === id) || {}).label)
    .filter(Boolean);
}

export function certTitle(cert) {
  const name = cert.full_name && cert.full_name !== cert.acronym ? ` — ${cert.full_name}` : "";
  return `${cert.acronym || cert.id}${name} | EBCertMap`;
}

export function certDescription(cert) {
  const facts = [
    `by ${cert.issuing_body}`,
    cert.level ? `${cert.level} level` : null,
    typeof cert.practical_weight === "number" ? `${cert.practical_weight}% practical` : null,
    cert.cost_usd === 0 ? "free" : (cert.cost_usd != null ? `$${cert.cost_usd}` : null),
  ].filter(Boolean).join(" · ");
  const summary = (cert.summary || "").replace(/\s+/g, " ").trim();
  return `${facts}. ${summary}`.slice(0, 300).trim();
}

export function certJsonLd(cert, domains) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    name: cert.full_name || cert.acronym,
    url: `${SITE_URL}cert/${cert.id}`,
    description: (cert.summary || "").replace(/\s+/g, " ").trim().slice(0, 500),
    credentialCategory: "certificate",
    recognizedBy: { "@type": "Organization", name: cert.issuing_body },
  };
  if (cert.acronym && cert.acronym !== ld.name) ld.alternateName = cert.acronym;
  const labels = domainLabels(cert, domains);
  if (labels.length) ld.about = labels.map(name => ({ "@type": "Thing", name }));
  if (cert.skills?.length) ld.competencyRequired = cert.skills.slice(0, 25);
  if (cert.cost_usd != null) {
    ld.offers = { "@type": "Offer", price: cert.cost_usd, priceCurrency: "USD" };
  }
  return ld;
}

export function certNoscript(cert, domains, certCount) {
  const row = (k, v) => (v == null || v === "" ? "" :
    `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(String(v))}</td></tr>`);
  const official = cert.official_url
    ? `<p><a href="${escapeHtml(cert.official_url)}" rel="nofollow noopener">Official certification page</a></p>`
    : "";
  return `<noscript>
  <main>
    <h1>${escapeHtml(cert.acronym || cert.id)}${cert.full_name ? ` — ${escapeHtml(cert.full_name)}` : ""}</h1>
    <p>${escapeHtml(cert.summary || "")}</p>
    <table>
      ${row("Issuer", cert.issuing_body)}
      ${row("Level", cert.level)}
      ${row("Domains", domainLabels(cert, domains).join(", "))}
      ${row("Practical weight", typeof cert.practical_weight === "number" ? `${cert.practical_weight}%` : null)}
      ${row("Cost (USD)", cert.cost_usd === 0 ? "Free" : cert.cost_usd)}
      ${row("Renewal", cert.renewal)}
      ${row("DoD 8140", cert.dod_8140 ? "Yes" : null)}
      ${row("Skills", (cert.skills || []).join(", "))}
    </table>
    ${official}
    <p><a href="/">Browse all ${certCount} cybersecurity certifications on EBCertMap</a></p>
  </main>
</noscript>`;
}

// Remove the ld+json block whose payload contains `marker`, leaving others alone.
function stripLdBlock(html, marker) {
  let i = 0;
  while ((i = html.indexOf(SCRIPT_OPEN, i)) !== -1) {
    const start = i + SCRIPT_OPEN.length;
    const end = html.indexOf(SCRIPT_CLOSE, start);
    if (end === -1) break;
    if (html.slice(start, start + 200).includes(marker)) {
      return html.slice(0, i) + html.slice(end + SCRIPT_CLOSE.length);
    }
    i = end;
  }
  return html;
}

function stripNoscript(html) {
  const s = html.indexOf("<noscript>");
  const e = html.indexOf("</noscript>");
  if (s === -1 || e === -1) return html;
  return html.slice(0, s) + html.slice(e + "</noscript>".length);
}

export function buildCertPage(baseHtml, cert, domains, certCount) {
  const url = `${SITE_URL}cert/${cert.id}`;
  const title = certTitle(cert);
  const desc = certDescription(cert);

  let html = stripNoscript(stripLdBlock(baseHtml, '"@type":"ItemList"'));

  const set = (re, value) => { html = html.replace(re, value); };
  set(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  set(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escapeHtml(desc)}"`);
  set(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${url}"`);
  set(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escapeHtml(title)}"`);
  set(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escapeHtml(desc)}"`);
  set(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${url}"`);
  set(/<meta property="og:type" content="[^"]*"/i, `<meta property="og:type" content="article"`);
  set(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${escapeHtml(title)}"`);
  set(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${escapeHtml(desc)}"`);

  const ld = SCRIPT_OPEN + jsonLdSafe(certJsonLd(cert, domains)) + SCRIPT_CLOSE;
  html = html.replace(/<\/head>/i, `    ${ld}\n  </head>`);
  html = html.replace(/<div id="root"><\/div>/, `<div id="root"></div>${certNoscript(cert, domains, certCount)}`);
  return html;
}

export function buildSitemap(lastmod, certs) {
  const entry = (loc, priority, changefreq) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const urls = [
    entry(SITE_URL, "1.0", "weekly"),
    entry(`${SITE_URL}skills`, "0.8", "weekly"),
    entry(`${SITE_URL}roles`, "0.8", "weekly"),
    ...certs.map(c => entry(`${SITE_URL}cert/${c.id}`, "0.7", "monthly")),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

// The two secondary views are real URLs too, so they get their own document
// rather than relying on the SPA fallback — a crawler landing on /skills should
// see what the page is, not the home page's title.
const VIEW_META = {
  skills: {
    path: "skills",
    title: "Skills — Map Cybersecurity Certifications to Skills | EBCertMap",
    description: "Filter cybersecurity certifications by the skills they actually teach. Select one or more skills to find every certification that covers all of them, across 15 security domains.",
  },
  roles: {
    path: "roles",
    title: "Career Paths — Role-Based Certification Roadmaps | EBCertMap",
    description: "Certification roadmaps for cybersecurity roles: penetration tester, SOC analyst, cloud security engineer, DFIR, GRC and more. Each path sequences certs with timelines and costs.",
  },
};

export function buildViewPage(baseHtml, viewKey) {
  const meta = VIEW_META[viewKey];
  if (!meta) throw new Error(`unknown view: ${viewKey}`);
  const url = `${SITE_URL}${meta.path}`;

  let html = stripLdBlock(baseHtml, '"@type":"ItemList"');
  const set = (re, value) => { html = html.replace(re, value); };
  set(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  set(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escapeHtml(meta.description)}"`);
  set(/<link rel="canonical" href="[^"]*"/i, `<link rel="canonical" href="${url}"`);
  set(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escapeHtml(meta.title)}"`);
  set(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escapeHtml(meta.description)}"`);
  set(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${url}"`);
  set(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${escapeHtml(meta.title)}"`);
  set(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${escapeHtml(meta.description)}"`);
  return html;
}

export const VIEW_KEYS = Object.keys(VIEW_META);
