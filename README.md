# EBCertMap

> A cybersecurity certification navigator — browse certs by domain, map them to skills, and explore role-based career paths.

**🌐 Live site:** [ebcertmap.com](https://ebcertmap.com) · **📋 426+ certs** across **15 domains** · **🛠 Last updated:** 2026-05-10 · **🤝 Contributions welcome** — see [CONTRIBUTING.md](CONTRIBUTING.md)

Built as a personal tool after years of teaching cybersecurity and finding that existing resources (notably Paul Jerimy's excellent roadmap) hadn't kept pace with newer domains like Cloud Security and AI Security. EBCertMap goes further with interactive filtering, cert profiles, skill matching, role-based learning paths, and a visual domain × level Map view inspired by Paul Jerimy's roadmap but driven by real data.

The structure was designed so the UI is a data-driven template — adding a new domain, cert, or role path is just a matter of dropping in a JSON file.

---

## Features

- **426+ certs** across 15 domains — Offensive, DFIR, Cloud, AppSec, IAM, GRC, AI Security, and more
- **Cert profiles** — level, cost, practical weight, score breakdown, prerequisites, and official links
- **Skills view** — select any combination of skills to find certs that validate all of them
- **Roles view** — 45+ career roles, each with multiple cert path options, costs, pros/cons, and step-by-step sequences
- **Map view** — visual domain × level matrix; switch to single-domain mode for a leaderboard-per-level ranked by score; color pills by domain, recognition, practical weight, or cost
- **All-domains view** — browse the full cert library with an expandable domain sidebar
- **Live filtering** — search, filter by level/issuer/cost/DoD 8140, sort by score or alphabetically
- **Cert scoring** — practical depth, employer recognition, community respect, exam difficulty, salary impact, and time to prepare

---

## Recent Updates

The full news + changelog is on the live site under the **About** modal. Recent highlights:

- **2026-05-10** — DevSecOps cert refresh: 3 new Practical DevSecOps entries (CCSE, CCNSE, CSC), 6 existing PDSO certs rescored and cross-domain expanded. Merged 3 long-standing duplicate entries (AAIA, AIGP, CISSP). Map pills now show issuer-initial tags for vendor-collision acronyms. Added a `?` popover explaining the practical-weight scoring scale.
- **2026-05-10** — First community PR landed (thanks to @Aj7ay7) and [CONTRIBUTING.md](CONTRIBUTING.md) published — fork, follow the guide, send a PR.
- **2026-05-07** — **Map view shipped**: visual domain × level matrix toggle on the Certs page. Single-domain mode switches to a leaderboard-per-level ranked by overall score. Color pills by domain, recognition, practical weight, or cost. Mobile gets a vertical leaderboard layout.
- **2026-05-03** — Cloudflare edge hardening (HTTPS-only, TLS 1.2+, HSTS, X-Content-Type-Options nosniff).
- **2026-04-29** — Added the Mobile Security Researcher role with a dedicated kernel/internals path, plus 4 new role tracks and a roles.json metadata cleanup across 13 roles.
- **2026-04-28** — 15 boutique certs added across 8kSec (11 mobile + AI security certs), Mandiant (MCTIA), arcX (FTIA, PTIA), and Learn Prompting (AIRTP+).

---

## Contributing

Community contributions are open. See **[CONTRIBUTING.md](CONTRIBUTING.md)** for the full guide — covers cert ID conventions, cross-domain placement, the JSON schema with field-by-field guidance (practical weight scale, level definitions, score conventions, recognized flags), local testing, and PR etiquette.

Easy ways to help:

- **Spot a missing cert?** Fork the repo, add the entry following the schema, send a PR.
- **Spot a wrong score or stale data?** Open an issue or send a PR with the fix and a source link.
- **Spot a missing or retired cert flag?** Submit a one-line update.

If you're not sure whether a cert belongs in the catalog, open an issue first and I'll give feedback before you put in the work.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | Inline styles + injected CSS (no external CSS framework) |
| Data | Static JSON files served from `/public/data/` |
| Fonts | Oxanium, IBM Plex Mono, IBM Plex Sans (Google Fonts) |

No backend. No database. Fully static — can be deployed anywhere.

---

## Project Structure

```
EBCertMap/
├── public/
│   └── data/
│       ├── certs/          # One JSON file per domain (15 files, 426 certs)
│       ├── paths/          # One JSON file per role (49 files)
│       ├── roles.json      # Role index (id, label, category, path_ids)
│       ├── domains.json    # Domain metadata (build-time only, see note)
│       ├── skills.json     # Master skills taxonomy
│       └── about.json      # News and changelog entries
├── scripts/
│   ├── audit.js                  # Cert data auditor (schema + link checks)
│   └── static-content-plugin.js  # Build-time JSON-LD and noscript injection
├── src/
│   ├── App.jsx             # All components and logic (single-file architecture)
│   ├── main.jsx
│   └── index.css           # Minimal reset only
├── .github/workflows/      # PR schema gate + weekly link audit
├── index.html
├── wrangler.toml           # Cloudflare Pages config
└── vite.config.js
```

> **Note:** `DOMAINS` and `SKILLS` are currently hardcoded constants in `App.jsx`.
> `domains.json` is read only at build time by the static-content plugin, and
> `skills.json` is not yet wired into the app.

---

## Running Locally

**Requirements:** Node.js 20.19+ or 22.12+ (required by `@vitejs/plugin-react` 5.x)

```bash
git clone https://github.com/KillerEB/EBCertMap.git
cd EBCertMap
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Data Format

### Cert entry (`public/data/certs/<domain>.json`)
```json
{
  "id": "oscp",
  "acronym": "OSCP",
  "full_name": "OffSec Certified Professional",
  "issuing_body": "OffSec",
  "domain": ["offensive"],
  "level": "intermediate",
  "cost_usd": 1749,
  "practical_weight": 100,
  "renewal": "Lifetime (OSCP) / 3 years (OSCP+, via CPE + $299/yr AMP or retake)",
  "active": true,
  "dod_8140": false,
  "flags": [],
  "skills": ["penetration_testing_methodology", "privilege_escalation", "active_directory_attacks"],
  "scores": {
    "practical_depth": 9,
    "employer_recognition": 10,
    "community_respect": 10,
    "exam_difficulty": 8,
    "salary_impact": 8,
    "time_to_prepare": 8
  },
  "summary": "...",
  "prerequisites": { "knowledge": [], "recommended_certs": [] },
  "official_url": "https://..."
}
```

### Cert path (`public/data/paths/<role_id>.json`)
```json
{
  "role_id": "penetration_tester",
  "label": "Penetration Tester",
  "paths": [
    {
      "id": "pentest_standard",
      "name": "Standard Track",
      "rationale": "...",
      "estimated_timeline": "12-18 months",
      "pros": ["..."],
      "cons": ["..."],
      "prerequisites": { "experience": "...", "knowledge": [] },
      "cert_sequence": [
        { "cert_id": "ejpt", "order": 1, "estimated_time": "1-2 months", "notes": "..." }
      ]
    }
  ]
}
```

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| 1 — Foundation | ✅ Done | 15 domains, 426+ cert profiles, UI/UX |
| 2 — Skills & Roles | ✅ Done | Skills mapping, role categories, cert skill labeling |
| 3 — Career Paths | ✅ Done | 49 roles, 128 cert paths, 380+ steps |
| 3.5 — Map View | ✅ Done | Visual domain × level matrix, leaderboard-per-level, color-by dimensions |
| 3.6 — Crawler / AI Discoverability | ✅ Done | Build-time static content injection (JSON-LD ItemList, `<noscript>` catalog, `<time datetime>` freshness signals, auto-regenerated sitemap) |
| 4 — Per-cert URLs | 🔜 Planned | React Router with `/cert/:id`, `/domain/:id`, `/role/:id` for deep linking |
| 5 — Pre-rendering | 🔜 Planned | Static HTML per route at build time for full Google indexability |
| 6 — Courses | 🔜 Planned | Course recommendations per cert and skill |
| 7 — AI Updates | 🔜 Planned | Periodic AI-assisted data refresh |

---

## Acknowledgements

- **[Paul Jerimy](https://pauljerimy.com/security-certification-roadmap/)** — whose Security Certification Roadmap was the original inspiration and set the bar for what a resource like this should feel like
- **[Claude (Anthropic)](https://anthropic.com)** — used to research cert data across domains and assist with development

---

## License

[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) © 2026 Elad Bar — see [LICENSE](LICENSE) for details.

You are free to share and adapt this work, including the curated cert data, as long as you give appropriate credit and distribute any derivatives under the same license.

---

<div align="center">
  <a href="https://www.patreon.com/15883459/join">♥ Support on Patreon</a>
</div>
