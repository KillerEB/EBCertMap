// Structural validation for roles and certification paths.
//
// The cert schema pass has always validated certs in isolation, so nothing
// checked that a path pointed at a cert that exists, is still purchasable, or is
// sequenced coherently. Eleven path steps referenced cert ids that resolved to
// nothing, and one steered users at a credential in abeyance — both invisible
// until someone read the files by hand.
//
// Severities match the cert pass: critical fails the build by default, schema
// fails under --strict, review is reported only.

const LEVEL_ORDER = { beginner: 0, intermediate: 1, expert: 2, elite: 3 };
// `executive` sits at the top for leadership roles (CISO), where the axis is
// seniority rather than technical depth.
const EXPERIENCE_TOKENS = ["entry", "intermediate", "senior", "expert", "elite", "executive"];

const issue = (severity, scope, message) => ({ severity, scope, message });

function parseExperience(value) {
  if (typeof value !== "string") return null;
  const parts = value.split("_to_");
  if (parts.length === 1) {
    return EXPERIENCE_TOKENS.includes(parts[0]) ? [parts[0]] : null;
  }
  if (parts.length !== 2) return null;
  const [a, b] = parts;
  if (!EXPERIENCE_TOKENS.includes(a) || !EXPERIENCE_TOKENS.includes(b)) return null;
  if (EXPERIENCE_TOKENS.indexOf(a) >= EXPERIENCE_TOKENS.indexOf(b)) return null;
  return [a, b];
}

/**
 * @param certsById Map of cert id -> cert
 * @param roles     roles.json contents
 * @param pathDocs  Map of role id (filename stem) -> parsed paths/<id>.json
 */
export function validatePaths(certsById, roles, pathDocs) {
  const issues = [];
  const add = (sev, scope, msg) => issues.push(issue(sev, scope, msg));

  const roleById = new Map(roles.map(r => [r.id, r]));
  const labelToRole = new Map(roles.map(r => [String(r.label).toLowerCase(), r.id]));

  // 5 — roles and files line up
  for (const r of roles) {
    if (!pathDocs.has(r.id)) add("schema", r.id, `no path file for role "${r.id}"`);
  }
  for (const [stem, doc] of pathDocs) {
    if (!roleById.has(stem)) add("schema", stem, `orphan path file: no role "${stem}" in roles.json`);
    if (doc.role_id !== stem) add("schema", stem, `role_id is "${doc.role_id}" but the file is ${stem}.json`);
  }

  for (const role of roles) {
    const doc = pathDocs.get(role.id);
    if (!doc) continue;
    const paths = doc.paths || [];
    const ids = paths.map(p => p.id);

    // 4 / 6 — the role index must agree with the path file
    const declared = role.path_ids || [];
    if (JSON.stringify(declared) !== JSON.stringify(ids)) {
      add("schema", role.id, `path_ids ${JSON.stringify(declared)} does not match the file's ${JSON.stringify(ids)}`);
    }
    if (role.path_count !== undefined && role.path_count !== declared.length) {
      add("schema", role.id, `path_count ${role.path_count} but path_ids has ${declared.length}`);
    }

    // 7 — experience_level shape
    for (const [scope, value] of [[role.id, role.experience_level], [role.id + " (file)", doc.experience_level]]) {
      if (value === undefined) continue;
      if (!parseExperience(value)) {
        add("schema", scope, `experience_level "${value}" is not a token or ordered X_to_Y over ${EXPERIENCE_TOKENS.join(" < ")}`);
      }
    }

    // experience_level is stored in both roles.json and the path file, and the two
    // have drifted apart. Review rather than schema until one is made canonical.
    if (role.experience_level !== undefined && doc.experience_level !== undefined &&
        role.experience_level !== doc.experience_level) {
      add("review", role.id, `experience_level is "${role.experience_level}" in roles.json but "${doc.experience_level}" in the path file`);
    }

    // 11 — job titles that are another role's canonical label
    for (const title of (doc.job_titles || [])) {
      const owner = labelToRole.get(String(title).toLowerCase());
      if (owner && owner !== role.id) {
        add("review", role.id, `job_title "${title}" is the label of role "${owner}"`);
      }
    }

    for (const p of paths) {
      const scope = `${role.id}/${p.id}`;
      const steps = p.cert_sequence || [];

      // 1 / 2 — references resolve, and point at something still purchasable
      const referenced = [];
      for (const s of steps) {
        if (!s.cert_id) continue;
        const cert = certsById.get(s.cert_id);
        if (!cert) {
          add("critical", scope, `cert_sequence step ${s.order} references unknown cert "${s.cert_id}"`);
          continue;
        }
        referenced.push({ step: s, cert });
        if (cert.active === false) {
          add("warning", scope, `step ${s.order} recommends ${cert.acronym} (${cert.id}), which is not active`);
        }
      }
      for (const rec of (p.prerequisites?.recommended_certs || [])) {
        if (!certsById.has(rec)) {
          add("critical", scope, `prerequisites.recommended_certs references unknown cert "${rec}"`);
        }
      }

      // 3 — the stored total drifts from the sequence; it is computed at load now
      if (p.total_cost_usd !== undefined) {
        add("schema", scope, `total_cost_usd is computed from the sequence — remove it (found ${p.total_cost_usd})`);
      }

      // 8 / 13 — order is 1..n, each cert appears once
      const orders = steps.map(s => s.order);
      const expected = steps.map((_, i) => i + 1);
      if (JSON.stringify([...orders].sort((a, b) => a - b)) !== JSON.stringify(expected)) {
        add("schema", scope, `order values [${orders.join(", ")}] are not 1..${steps.length} without gaps or repeats`);
      }
      const certIds = steps.map(s => s.cert_id).filter(Boolean);
      const dupes = certIds.filter((id, i) => certIds.indexOf(id) !== i);
      for (const d of new Set(dupes)) add("schema", scope, `cert "${d}" appears more than once in the sequence`);

      // 9 — a path should not step down in level
      const ordered = [...referenced].sort((a, b) => a.step.order - b.step.order);
      for (let i = 1; i < ordered.length; i++) {
        const prev = LEVEL_ORDER[ordered[i - 1].cert.level];
        const cur = LEVEL_ORDER[ordered[i].cert.level];
        if (prev !== undefined && cur !== undefined && cur < prev) {
          add("review", scope, `level steps down: ${ordered[i - 1].cert.acronym} (${ordered[i - 1].cert.level}) then ${ordered[i].cert.acronym} (${ordered[i].cert.level})`);
        }
      }

      // 10 — a step's recommended prerequisite appears later in the same path
      const orderOf = new Map(ordered.map(o => [o.cert.id, o.step.order]));
      for (const { step, cert } of ordered) {
        for (const pre of (cert.prerequisites?.recommended_certs || [])) {
          const at = orderOf.get(pre);
          if (at !== undefined && at > step.order) {
            add("review", scope, `${cert.acronym} at ${step.order} recommends ${pre}, which is sequenced later at ${at}`);
          }
        }
      }
    }
  }

  return issues;
}

/** Report-only: where the path catalogue is thin. */
export function pathCoverage(certsById, pathDocs, domains) {
  const referenced = new Set();
  for (const [, doc] of pathDocs)
    for (const p of (doc.paths || []))
      for (const s of (p.cert_sequence || [])) if (s.cert_id) referenced.add(s.cert_id);

  const certs = [...certsById.values()];
  const byDomain = domains.map(d => {
    const inDomain = certs.filter(c => (c.domain || []).includes(d.id));
    const covered = inDomain.filter(c => referenced.has(c.id)).length;
    return {
      id: d.id,
      label: d.label || d.id,
      total: inDomain.length,
      covered,
      pct: inDomain.length ? (100 * covered / inDomain.length) : 0,
    };
  }).sort((a, b) => a.pct - b.pct);

  return {
    referenced: referenced.size,
    total: certs.length,
    pct: certs.length ? (100 * referenced.size / certs.length) : 0,
    byDomain,
  };
}
