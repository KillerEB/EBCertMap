# EBCertMap

> A cybersecurity certification navigator — browse certs by domain, map them to skills, and explore role-based career paths.

Built as a personal tool after years of teaching cybersecurity and finding that existing resources (notably Paul Jerimy's excellent roadmap) hadn't kept pace with newer domains like Cloud Security and AI Security. EBCertMap goes further with interactive filtering, cert profiles, skill matching, and role-based learning paths.

The structure was designed so the UI is a data-driven template — adding a new domain, cert, or role path is just a matter of dropping in a JSON file.

public live host server - https://ebcertmap.com
---

## Features

- **400+ certs** across 15 domains — Offensive, DFIR, Cloud, AppSec, IAM, GRC, AI Security, and more
- **Cert profiles** — level, cost, practical weight, score breakdown, prerequisites, and official links
- **Skills view** — select any combination of skills to find certs that validate all of them
- **Roles view** — 40+ career roles, each with multiple cert path options, costs, pros/cons, and step-by-step sequences
- **All-domains view** — browse the full cert library with an expandable domain sidebar
- **Live filtering** — search, filter by level/issuer/cost/DoD 8140, sort by score or alphabetically
- **Cert scoring** — practical depth, employer recognition, community respect, exam difficulty, salary impact, and time to prepare

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | [React 18](https://react.dev/) |
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
│       ├── certs/          # One JSON file per domain (15 files)
│       ├── paths/          # One JSON file per role (40+ files)
│       ├── roles.json      # Role index (id, label, category, path_ids)
│       └── about.json      # News and changelog entries
├── src/
│   ├── App.jsx             # All components and logic (single-file architecture)
│   ├── main.jsx
│   └── index.css           # Minimal reset only
├── index.html
└── vite.config.js
```

---

## Running Locally

**Requirements:** Node.js 18+

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
  "full_name": "Offensive Security Certified Professional",
  "issuing_body": "Offensive Security",
  "domain": ["offensive"],
  "level": "intermediate",
  "cost_usd": 1499,
  "practical_weight": 100,
  "renewal": "3 years",
  "active": true,
  "dod_8140": true,
  "flags": [],
  "skills": ["penetration_testing_methodology", "exploitation_awareness"],
  "scores": {
    "overall": 9.2,
    "practical_depth": 10,
    "employer_recognition": 9,
    "community_respect": 10,
    "exam_difficulty": 9,
    "salary_impact": 9,
    "time_to_prepare": 7
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
      "total_cost_usd": 2500,
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
| 1 — Foundation | ✅ Done | 15 domains, 400+ cert profiles, UI/UX |
| 2 — Skills & Roles | ✅ Done | Skills mapping, role categories, cert skill labeling |
| 3 — Career Paths | ✅ Done | 40+ roles, 100+ cert path steps |
| 4 — Courses | 🔜 Planned | Course recommendations per cert and skill |
| 5 — AI Updates | 🔜 Planned | Periodic AI-assisted data refresh |

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
