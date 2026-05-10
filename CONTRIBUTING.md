# Contributing to EBCertMap

Thanks for wanting to help — community contributions are what make this project better. Before you open a PR, read this first so your work doesn't get lost to a conflict or naming issue.

---

## Before you start

**Check if the cert already exists.**
Search the relevant JSON file in `public/data/certs/` for the acronym or issuer before adding anything. The same acronym from two different vendors is common in this industry (we have three different certs called CCSE, two called CPIA, etc.), so searching by acronym alone is not enough — check the issuer too.

You can also check the site's changelog at [ebcertmap.com](https://ebcertmap.com) for recent additions.

---

## Cert ID naming

Every cert needs a unique `id` field. Follow this convention:

| Situation | Format | Example |
|---|---|---|
| No conflict | lowercase acronym | `oscp`, `cissp`, `bscp` |
| Same acronym, different vendor | `vendor-acronym` | `pdso-ccse`, `cwl-ccse`, `ccse` (Check Point) |
| Vendor prefix needed | short vendor identifier | `pdso-`, `cwl-`, `sog-`, `wkl-`, `8ksec-` |

If you are unsure whether there is a conflict, search all files in `public/data/certs/` for the acronym string before picking an ID.

---

## Which file does the cert go in?

Each cert lives in **exactly one file** — the file for its primary domain. Cross-domain placement is handled by the `domain` array field, not by duplicating the entry.

For example, a cert that spans offensive security and AI security:

```json
"domain": ["offensive", "ai_security"]
```

This cert goes in `offensive.json` only. The app reads the `domain` array and surfaces it in every listed domain automatically. **Do not copy the entry into multiple files** — this creates duplicates and breaks deduplication.

Domain file names: `offensive.json`, `appsec.json`, `dfir.json`, `defensive_soc.json`, `cloud_security.json`, `network_security.json`, `grc.json`, `iam.json`, `threat_intelligence.json`, `ai_security.json`, `ot_ics_iot.json`, `data_privacy.json`, `security_architecture.json`, `vulnerability_management.json`, `oversight_leadership.json`

---

## JSON schema

The required fields for every cert entry:

```json
{
  "id": "unique-id",
  "acronym": "ACRONYM",
  "full_name": "Full Certification Name",
  "issuing_body": "Vendor / Organization Name",
  "domain": ["primary_domain"],
  "subdomain": ["subdomain_tag"],
  "level": "beginner | intermediate | expert | elite",
  "practical_weight": 0,
  "cost_usd": 0,
  "renewal": "lifetime",
  "dod_8140": false,
  "geographic_recognition": "global | regional",
  "geographic_note": null,
  "skills": [],
  "prerequisites": {
    "knowledge": [],
    "recommended_certs": []
  },
  "summary": "One paragraph summary of the cert.",
  "flags": [],
  "official_url": "https://...",
  "active": true,
  "paths": [],
  "scores": {
    "exam_difficulty": 5,
    "practical_depth": 5,
    "employer_recognition": 5,
    "community_respect": 5,
    "salary_impact": 5,
    "time_to_prepare": 5,
    "overall": 5.0
  }
}
```

### Practical Weight

Use these values only — no other numbers:

| Value | Meaning |
|---|---|
| `100` | Entirely practical — no MCQ, pass/fail on working deliverable only |
| `70` | Majority practical — performance-based with written report |
| `50` | Hybrid — MCQ component plus graded lab or scenario |
| `25` | MCQ with optional lab environment or open-book |
| `0` | MCQ only — no hands-on component |

### Level

| Value | Meaning |
|---|---|
| `beginner` | Entry-point credential, no prior certs required |
| `intermediate` | Assumes foundational knowledge, some experience |
| `expert` | Industry benchmark, significant experience expected |
| `elite` | Research-grade, very few holders worldwide |

### Scores

All six component scores are **integers from 1 to 10**. The `overall` field is a **single decimal** (e.g. `7.2`). Scores should reflect honest community consensus, not vendor marketing. If you are unsure, look at how similar certs in the same domain are scored and calibrate against those.

### Flags

Only the following values are recognized — new values won't render in the app:

`free`, `low_cost`, `new`, `paused`, `retiring`, `low_community_respect`, `tool_vendor`, `portfolio_based`, `hands_on`, `boutique`, `course_tied`

Most certs have an empty `flags` array. Use `low_cost` for certs under ~$200, `hands_on` for practical-only exams, `boutique` for small independent vendors, `course_tied` for certs that can only be earned through a specific course.

### Skills

Skills are freeform strings but should reuse existing tags rather than inventing new ones. Before adding a skill, look at what neighboring certs in the same domain use. If you invent a new tag, the skills view won't surface that cert for users browsing by skill.

### Subdomain

Same as skills — freeform but follow the conventions in neighboring certs. Look at a few existing entries in the same domain file before filling this in.

### Renewal

Free-form string. Look at neighboring certs for the right format. Examples from the dataset: `"lifetime"`, `"3 years"`, `"4 years (36 CPEs + $499)"`, `"2 years"`, `"does not expire"`.

---

## Domain counts

Domain cert counts are computed dynamically at runtime from the JSON files. **You don't need to update any count anywhere** — just add the cert to the right file and the app picks it up automatically.

---

## What makes a good cert entry

- **Real proctored exam or practical assessment** — course completion certificates and vendor product training badges are generally not included
- **Publicly available** — the cert should be something anyone can pursue, not internal-only
- **Accurate data** — double check price, renewal period, and format against the official vendor page before submitting
- **Honest scores** — scores reflect community consensus and real exam format, not vendor marketing

---

## Testing Locally

Run `npm install && npm run dev` to preview your changes before opening a PR. Your cert should appear in the right domain, filter correctly by issuer, and show the right scores in the profile panel.

---

## Opening a PR

- One PR per vendor or topic — don't bundle unrelated certs
- Include a short description of what you added and why
- If you are unsure about scores or data, say so in the PR description — it's better to flag uncertainty than guess

If you are not sure whether something belongs in the catalog, open an issue first and describe the cert. Happy to give feedback before you put in the work.

---

## Role Paths and Skill Tags

This guide covers cert entries. Role paths (`public/data/paths/`) and skill tag conventions have their own structure. If you want to contribute there, open an issue and I will add documentation for it.