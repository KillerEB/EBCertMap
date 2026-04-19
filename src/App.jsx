import { useState, useMemo, useCallback, useEffect } from "react";

// ─── INJECT FONTS & GLOBAL STYLES ──────────────────────────────────────────
const _link = document.createElement("link");
_link.rel = "stylesheet";
_link.href = "https://fonts.googleapis.com/css2?family=Oxanium:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(_link);

const _style = document.createElement("style");
_style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #080c14;
    --surface:  #0d1220;
    --surface2: #121828;
    --surface3: #18202e;
    --border:   rgba(80,140,255,0.1);
    --border2:  rgba(80,140,255,0.18);
    --text:     #d4ddf0;
    --muted:    #3d4d6a;
    --mid:      #7a8ea8;
    --accent:   #4ade80;
    --accent2:  #38bdf8;
    --radius:   7px;
    --radius-lg:12px;
  }
  html, body, #root { height: 100%; background: var(--bg); color: var(--text); }
  body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .heading { font-family: 'Oxanium', sans-serif; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1a2438; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #2a3858; }

  @keyframes fadeUp    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes slideRight{ from { opacity:0; transform:translateX(12px);} to { opacity:1; transform:none; } }
  .anim-fadeup    { animation: fadeUp 0.22s ease both; }
  .anim-slideright{ animation: slideRight 0.22s ease both; }

  .scroll { overflow-y: auto; overflow-x: hidden; }

  /* ── Cert Card ── */
  .cert-card {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 13px 15px; cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.15s;
    position: relative; overflow: hidden;
  }
  .cert-card::after {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background: var(--card-accent, transparent); opacity:0; transition:opacity 0.15s;
  }
  .cert-card:hover { border-color:var(--border2); background:var(--surface3); transform:translateY(-1px); }
  .cert-card:hover::after, .cert-card.active::after { opacity:1; }
  .cert-card.active { border-color:var(--border2); background:var(--surface3); }

  /* ── Domain Pill ── */
  .dpill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500;
    border: 1px solid var(--border); background: var(--surface2); color: var(--mid);
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .dpill:hover { border-color: var(--border2); color: var(--text); }
  .dpill.active { color: #000; border-color: transparent; font-weight: 600; }
  .dpill .dot { width: 6px; height: 6px; border-radius: 50%; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: var(--radius); font-size: 11.5px; font-weight: 500;
    cursor: pointer; border: 1px solid var(--border); transition: all 0.15s;
    font-family: inherit; white-space: nowrap;
    background: var(--surface2); color: var(--mid);
  }
  .btn:hover { border-color: var(--border2); color: var(--text); background: var(--surface3); }
  .btn.on { background: var(--surface3); border-color: var(--border2); color: var(--text); }
  .btn-nav {
    background: none; border: none; color: var(--mid); font-size: 13px; font-weight: 500;
    cursor: pointer; padding: 7px 14px; border-radius: var(--radius);
    transition: all 0.15s; font-family: 'Oxanium', sans-serif; letter-spacing: 0.03em;
  }
  .btn-nav:hover { color: var(--text); background: var(--surface3); }
  .btn-nav.active { color: var(--accent); background: rgba(74,222,128,0.08); }

  /* ── Badge ── */
  .badge {
    display: inline-flex; align-items: center; padding: 2px 7px;
    border-radius: 4px; font-size: 10px; font-weight: 600;
    letter-spacing: 0.04em; white-space: nowrap;
  }

  /* ── Level table item ── */
  .lvl-item {
    display: block; width: 100%; padding: 3px 8px; border-radius: 4px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500;
    color: var(--mid); cursor: pointer; text-align: left;
    background: none; border: none; transition: background 0.1s, color 0.1s;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .lvl-item:hover { background: var(--surface3); color: var(--text); }
  .lvl-item.active { background: var(--surface3); color: var(--accent); }

  /* ── Practical weight badge ── */
  .prac-badge {
    display: inline-flex; align-items: center; padding: 2px 6px;
    border-radius: 4px; font-size: 9.5px; font-weight: 600;
    letter-spacing: 0.03em; white-space: nowrap;
  }

  /* ── Skill checkbox ── */
  .skill-row {
    display: flex; align-items: center; gap: 8px; padding: 5px 8px;
    border-radius: 5px; cursor: pointer; font-size: 12.5px; color: var(--mid);
    transition: background 0.1s, color 0.1s; user-select: none;
  }
  .skill-row:hover { background: var(--surface3); color: var(--text); }
  .skill-row.sel { color: var(--text); }
  .cb {
    width: 14px; height: 14px; border: 1.5px solid var(--muted);
    border-radius: 3px; flex-shrink: 0; display: flex; align-items: center;
    justify-content: center; transition: all 0.12s;
  }
  .cb.on { background: var(--accent); border-color: var(--accent); }

  /* ── Input / Select ── */
  input[type=search], input[type=text], select {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius); color: var(--text); font-family: inherit;
    font-size: 12px; padding: 6px 10px; outline: none;
  }
  input[type=search], input[type=text] { width: 100%; }
  input:focus, select:focus { border-color: rgba(74,222,128,0.35); }
  input::placeholder { color: var(--muted); }
  select { cursor: pointer; appearance: none; padding-right: 24px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%233d4d6a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 8px center; }
  select option { background: #0d1220; }

  /* ── Progress bar ── */
  .pbar { height: 3px; background: var(--surface3); border-radius: 2px; overflow: hidden; }
  .pbar-fill { height: 100%; border-radius: 2px; }

  /* ── Divider ── */
  .div { height: 1px; background: var(--border); }

  /* ── Empty state ── */
  .empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px; padding: 48px 24px; color: var(--muted); text-align: center;
  }
  .empty-icon { font-size: 28px; margin-bottom: 4px; }

  /* ── Role card ── */
  .role-card {
    padding: 11px 14px; border: 1px solid var(--border); border-radius: var(--radius);
    cursor: pointer; transition: all 0.13s; background: var(--surface2); margin-bottom: 6px;
  }
  .role-card:hover { border-color: var(--border2); background: var(--surface3); }
  .role-card.active { border-color: rgba(74,222,128,0.3); background: var(--surface3); }

  /* ── Path tab ── */
  .ptab {
    padding: 6px 14px; border-radius: var(--radius); font-size: 12px; font-weight: 500;
    border: 1px solid var(--border); cursor: pointer; background: var(--surface2);
    color: var(--mid); transition: all 0.13s; font-family: inherit;
  }
  .ptab:hover { color: var(--text); border-color: var(--border2); }
  .ptab.active { background: var(--surface3); color: var(--text); border-color: rgba(74,222,128,0.25); }

  /* ── Grid bg ── */
  .gridbg {
    background-image:
      linear-gradient(rgba(80,140,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(80,140,255,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
  }

  /* ── Score bar ── */
  .score-bar { height:4px; background:var(--surface3); border-radius:2px; overflow:hidden; flex:1; }
  .score-bar-fill { height:100%; border-radius:2px; transition: width 0.3s ease; }

  /* ── Overall score badge on card ── */
  .overall-badge {
    display:inline-flex; align-items:center; justify-content:center;
    width:32px; height:32px; border-radius:6px; font-family:'IBM Plex Mono',monospace;
    font-size:12px; font-weight:700; flex-shrink:0;
  }

  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
`;
document.head.appendChild(_style);

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const DOMAINS = [
  { id:"offensive",              label:"Offensive Security",         short:"Offensive",   color:"#f87171", count:70, description:"Penetration testing, exploit development, red teaming, adversary simulation, and offensive security research across networks, applications, and systems." },
  { id:"dfir",                   label:"Digital Forensics & IR",     short:"DFIR",        color:"#fb923c", count:45, description:"Digital forensics, memory and mobile forensics, malware analysis, incident response, threat hunting, and cloud forensics across enterprise and cloud environments." },
  { id:"defensive_soc",          label:"Defensive / SOC",            short:"SOC",         color:"#fbbf24", count:29, description:"Security operations, SOC analysis, SIEM operations, detection engineering, and endpoint detection and response platforms." },
  { id:"cloud_security",         label:"Cloud Security",             short:"Cloud",       color:"#22d3ee", count:18, description:"Cloud security architecture, AWS/Azure/GCP security engineering, container and Kubernetes security, Zero Trust design, and cloud-native security operations." },
  { id:"appsec",                 label:"Application Security",       short:"AppSec",      color:"#a78bfa", count:22, description:"Web application penetration testing, secure software development lifecycle, DevSecOps, API security, source code review, and software supply chain security." },
  { id:"threat_intelligence",    label:"Threat Intelligence",        short:"CTI",         color:"#f59e0b", count:9,  description:"Cyber threat intelligence analysis, threat actor profiling, TTP analysis, IOC management, and intelligence platform operations." },
  { id:"vulnerability_management",label:"Vulnerability Mgmt",        short:"Vuln Mgmt",   color:"#34d399", count:19, description:"Vulnerability scanning, risk-based prioritization, remediation tracking, and enterprise vulnerability management program design across major platforms." },
  { id:"network_security",       label:"Network Security",           short:"Network",     color:"#60a5fa", count:23, description:"Network security engineering, firewall administration, IDS/IPS, VPN, SASE, and network security architecture across Cisco, Juniper, Palo Alto, Fortinet, and Check Point." },
  { id:"security_architecture",  label:"Security Architecture",      short:"Architecture",color:"#94a3b8", count:19, description:"Enterprise security architecture design, SABSA methodology, Zero Trust architecture, cryptography and PKI design, and security program leadership." },
  { id:"iam",                    label:"Identity & Access Mgmt",     short:"IAM",         color:"#2dd4bf", count:26, description:"Identity governance, privileged access management, authentication and MFA, federation and SSO, and identity platform administration across Okta, CyberArk, SailPoint, and Microsoft." },
  { id:"ot_ics_iot",             label:"OT / ICS / IoT",             short:"OT/ICS",      color:"#a3e635", count:16, description:"Operational technology security, industrial control systems, SCADA security, ISA/IEC 62443 compliance, critical infrastructure protection, and IoT security." },
  { id:"grc",                    label:"GRC",                        short:"GRC",         color:"#9ca3af", count:24, description:"IT audit, risk management, ISO 27001, business continuity, third-party risk, and information security governance across ISACA, ISC2, DRI, BCI, and ISO frameworks." },
  { id:"data_privacy",           label:"Data Security & Privacy",    short:"Privacy",     color:"#f472b6", count:17, description:"Privacy law and compliance, GDPR, privacy engineering, data loss prevention, data classification, and privacy program management across IAPP, ISACA, and ISO 27701." },
  { id:"ai_security",            label:"AI Security",                short:"AI Sec",      color:"#c084fc", count:16, description:"AI/ML system security, LLM red teaming, prompt injection, AI governance and risk, adversarial machine learning, and responsible AI frameworks including ISO 42001." },
  { id:"oversight_leadership",   label:"Oversight & Leadership",     short:"Leadership",  color:"#38bdf8", count:13, description:"CISO and executive leadership, security program management, security awareness and human risk management, and board-level security governance." },
];

const domainColor = id => DOMAINS.find(d => d.id === id)?.color ?? "#64748b";
const domainShort = id => DOMAINS.find(d => d.id === id)?.short ?? id;

const LEVEL_ORDER = ["beginner", "intermediate", "expert", "elite"];

const LEVELS = {
  beginner:     { label:"Beginner",     short:"Beginner", fg:"#4ade80", bg:"rgba(74,222,128,0.1)",   order:0 },
  intermediate: { label:"Intermediate", short:"Inter.",   fg:"#fbbf24", bg:"rgba(251,191,36,0.1)",   order:1 },
  expert:       { label:"Expert",       short:"Expert",   fg:"#f87171", bg:"rgba(248,113,113,0.1)",  order:2 },
  elite:        { label:"Elite",        short:"Elite",    fg:"#c084fc", bg:"rgba(192,132,252,0.1)",  order:3 },
};

const FLAGS = {
  free:                  { label:"Free",        fg:"#4ade80", bg:"rgba(74,222,128,0.1)"  },
  low_cost:              { label:"Low Cost",    fg:"#a3e635", bg:"rgba(163,230,53,0.1)"  },
  new:                   { label:"New",         fg:"#38bdf8", bg:"rgba(56,189,248,0.1)"  },
  paused:                { label:"Paused",      fg:"#fb923c", bg:"rgba(251,146,60,0.1)"  },
  retiring:              { label:"Retiring",    fg:"#fb923c", bg:"rgba(251,146,60,0.1)"  },
  low_community_respect: { label:"⚠ Contested", fg:"#f87171", bg:"rgba(248,113,113,0.1)" },
  tool_vendor:           { label:"Vendor",      fg:"#94a3b8", bg:"rgba(148,163,184,0.1)" },
  portfolio_based:       { label:"Portfolio",   fg:"#c084fc", bg:"rgba(192,132,252,0.1)" },
};

// Practical weight — labelled badge
const pracLabel = w => {
  if (w === 0)   return { label:"Theory Only",     fg:"#64748b", bg:"rgba(100,116,139,0.12)" };
  if (w <= 25)   return { label:`${w}% Practical`, fg:"#94a3b8", bg:"rgba(148,163,184,0.1)"  };
  if (w <= 60)   return { label:`${w}% Practical`, fg:"#fbbf24", bg:"rgba(251,191,36,0.1)"   };
  if (w < 100)   return { label:`${w}% Practical`, fg:"#fb923c", bg:"rgba(251,146,60,0.1)"   };
  return               { label:"100% Practical",   fg:"#4ade80", bg:"rgba(74,222,128,0.1)"   };
};

// Cost bucket for filter
const costBucket = cost => {
  if (cost === 0)    return "free";
  if (cost < 500)    return "under500";
  if (cost < 1000)   return "500to1k";
  return                    "over1k";
};

// Score color — 0-10 → red to green
const scoreColor = v => {
  if (v >= 8) return "#4ade80";
  if (v >= 6) return "#a3e635";
  if (v >= 4) return "#fbbf24";
  if (v >= 2) return "#fb923c";
  return "#f87171";
};

const SKILL_CATS = [
  { id:"offensive",    label:"Offensive",       color:"#f87171" },
  { id:"dfir",         label:"DFIR",            color:"#fb923c" },
  { id:"appsec",       label:"AppSec",          color:"#a78bfa" },
  { id:"network",      label:"Network",         color:"#60a5fa" },
  { id:"cloud",        label:"Cloud",           color:"#22d3ee" },
  { id:"threat_intel", label:"Threat Intel",    color:"#fbbf24" },
  { id:"iam",          label:"IAM",             color:"#2dd4bf" },
  { id:"grc",          label:"GRC",             color:"#9ca3af" },
  { id:"privacy",      label:"Privacy",         color:"#f472b6" },
  { id:"ot_ics",       label:"OT/ICS/IoT",      color:"#a3e635" },
  { id:"ai_security",  label:"AI Security",     color:"#c084fc" },
  { id:"leadership",   label:"Leadership",      color:"#38bdf8" },
];

const SKILLS = [
  { id:"penetration_testing",  label:"Penetration Testing",       cat:"offensive",    m:["penetration_testing_methodology","network_penetration_testing","exploitation_awareness","basic_exploitation"] },
  { id:"exploit_development",  label:"Exploit Development",       cat:"offensive",    m:["exploit_development","exploit_development_basics","custom_exploit_development","shellcode_development","heap_exploitation","buffer_overflow"] },
  { id:"reconnaissance",       label:"Reconnaissance & OSINT",    cat:"offensive",    m:["reconnaissance_techniques","web_application_recon","web_recon","open_source_intelligence","osint_basics"] },
  { id:"ad_attacks",           label:"Active Directory Attacks",  cat:"offensive",    m:["active_directory_attacks"] },
  { id:"privilege_escalation", label:"Privilege Escalation",      cat:"offensive",    m:["privilege_escalation","access_control_exploitation"] },
  { id:"red_team",             label:"Red Team Operations",       cat:"offensive",    m:["red_team_methodology","cobalt_strike_operation","command_and_control","evasion_techniques","lateral_movement"] },
  { id:"reverse_engineering",  label:"Reverse Engineering",       cat:"offensive",    m:["reverse_engineering","reverse_engineering_basics","disassembly_tools","assembly_analysis","assembly_language_reading","debugger_usage"] },
  { id:"malware_analysis",     label:"Malware Analysis",          cat:"dfir",         m:["malware_analysis","static_malware_analysis","dynamic_malware_analysis","malware_behavior_analysis","malware_triage","sandbox_analysis","ioc_extraction","unpacking_techniques"] },
  { id:"digital_forensics",    label:"Digital Forensics",         cat:"dfir",         m:["digital_forensics","digital_forensics_methodology","disk_forensics","file_system_forensics","file_system_analysis","evidence_handling","chain_of_custody"] },
  { id:"windows_forensics",    label:"Windows Forensics",         cat:"dfir",         m:["windows_artifact_analysis","registry_analysis","lnk_file_analysis","browser_forensics","email_forensics"] },
  { id:"memory_forensics",     label:"Memory Forensics",          cat:"dfir",         m:["memory_forensics","windows_memory_forensics","advanced_forensic_analysis"] },
  { id:"network_forensics",    label:"Network Forensics",         cat:"dfir",         m:["network_forensics","pcap_analysis","network_artifact_reconstruction","full_packet_capture_analysis","dns_forensics","network_traffic_analysis"] },
  { id:"cloud_forensics",      label:"Cloud Forensics",           cat:"dfir",         m:["cloud_forensics","aws_forensics","azure_forensics","gcp_forensics","cloud_log_analysis","cloud_ir_procedures","cloud_evidence_acquisition","container_forensics"] },
  { id:"incident_response",    label:"Incident Response",         cat:"dfir",         m:["incident_response_process","incident_response_basics","incident_response_advanced","incident_handling_procedures","containment_procedures","incident_triage"] },
  { id:"threat_hunting",       label:"Threat Hunting",            cat:"dfir",         m:["threat_hunting","threat_hunting_methodology","threat_hunting_advanced","hypothesis_driven_hunting","behavioral_hunting","ttp_based_hunting","edr_hunting"] },
  { id:"sql_injection",        label:"SQL Injection",             cat:"appsec",       m:["sql_injection","sql_injection_advanced","advanced_sql_injection","nosql_injection"] },
  { id:"xss",                  label:"Cross-Site Scripting",      cat:"appsec",       m:["xss","xss_advanced","dom_based_attacks"] },
  { id:"web_exploitation",     label:"Web App Exploitation",      cat:"appsec",       m:["web_vulnerability_exploitation","advanced_web_exploitation","owasp_top_10_exploitation","authentication_attacks","authentication_bypass","web_cache_poisoning","prototype_pollution","ssrf","xxe","deserialization_attacks"] },
  { id:"api_security",         label:"API Security",              cat:"appsec",       m:["api_security_testing","api_vulnerability_testing","owasp_api_top_10","graphql_attacks","jwt_attacks","oauth_attacks"] },
  { id:"source_code_review",   label:"Source Code Review",        cat:"appsec",       m:["source_code_review","white_box_web_testing","javascript_analysis"] },
  { id:"secure_coding",        label:"Secure Coding",             cat:"appsec",       m:["secure_coding_practices","secure_design_principles","secure_java_development","secure_dotnet_development","owasp_top_10_mitigation","input_validation"] },
  { id:"devsecops",            label:"DevSecOps",                 cat:"appsec",       m:["devsecops_practices","ci_cd_security","sast_implementation","dast_implementation","sca_tools","iac_security","compliance_as_code","devsecops_pipeline_design"] },
  { id:"threat_modeling",      label:"Threat Modeling",           cat:"appsec",       m:["threat_modeling","stride_methodology","pasta_methodology","code_based_threat_modeling"] },
  { id:"networking",           label:"Networking Fundamentals",   cat:"network",      m:["networking_fundamentals","tcp_ip_protocols","routing_and_switching","network_access_control","cisco_ios_fundamentals"] },
  { id:"firewall_mgmt",        label:"Firewall Administration",   cat:"network",      m:["firewall_management","cisco_firewall_administration","fortigate_firewall_administration","check_point_firewall_administration","palo_alto_ngfw_administration","juniper_srx_basics","fortios_configuration","pan_os_configuration"] },
  { id:"ids_ips",              label:"IDS / IPS",                 cat:"network",      m:["intrusion_detection","intrusion_prevention","ids_ips_management","ids_ips_tuning","signature_development"] },
  { id:"network_monitoring",   label:"Network Monitoring",        cat:"network",      m:["network_monitoring","security_monitoring","intrusion_analysis","network_intrusion_analysis"] },
  { id:"cloud_arch",           label:"Cloud Security Architecture",cat:"cloud",       m:["cloud_security_architecture","cloud_network_design","cloud_security_design","cloud_security_fundamentals","shared_responsibility_model"] },
  { id:"aws_security",         label:"AWS Security",              cat:"cloud",        m:["aws_iam","aws_network_security","aws_data_protection","aws_logging_monitoring","aws_incident_response","aws_security_services"] },
  { id:"azure_security",       label:"Azure Security",            cat:"cloud",        m:["azure_iam","azure_network_security","azure_security_center","azure_defender","azure_key_vault","azure_monitor_security","azure_policy_governance"] },
  { id:"container_security",   label:"Container & K8s Security",  cat:"cloud",        m:["container_security","container_security_basics","kubernetes_security","pod_security","rbac_kubernetes","image_scanning"] },
  { id:"zero_trust",           label:"Zero Trust Architecture",   cat:"cloud",        m:["zero_trust_principles","zero_trust_architecture_design","zero_trust_implementation","zero_trust_fundamentals","identity_centric_security"] },
  { id:"cti_analysis",         label:"CTI Analysis",              cat:"threat_intel", m:["threat_intelligence_analysis","intelligence_cycle","threat_report_writing","intelligence_reporting","threat_actor_profiling","attribution_methodology"] },
  { id:"ttp_analysis",         label:"TTP Analysis / MITRE",      cat:"threat_intel", m:["ttp_analysis","ttp_mapping","mitre_attack_framework","mitre_attack_application","mitre_attack_detection"] },
  { id:"ioc_analysis",         label:"IOC Analysis",              cat:"threat_intel", m:["ioc_analysis","ioc_collection","ioc_management","ioc_sharing"] },
  { id:"identity_governance",  label:"Identity Governance",       cat:"iam",          m:["identity_governance_fundamentals","identity_lifecycle_management","provisioning_basics","role_management_basics","access_certification_design"] },
  { id:"pam",                  label:"Privileged Access Mgmt",    cat:"iam",          m:["pam_fundamentals","privileged_account_concepts","privileged_session_management","vault_administration","cyberark_pam_administration","endpoint_privilege_management"] },
  { id:"federation_sso",       label:"Federation & SSO",          cat:"iam",          m:["federation_and_sso","federated_identity","saml_federation","sso_configuration_basics","oauth_oidc_am"] },
  { id:"risk_management",      label:"Risk Management",           cat:"grc",          m:["risk_management","risk_management_framework","it_risk_assessment","risk_response","enterprise_risk_management","iso_31000_risk_framework","fair_risk_model"] },
  { id:"compliance_audit",     label:"Compliance & Audit",        cat:"grc",          m:["compliance_management","information_systems_audit","it_governance_audit","audit_evidence_collection","audit_reporting"] },
  { id:"isms",                 label:"ISMS / ISO 27001",          cat:"grc",          m:["information_security_governance","iso_27001_isms_implementation","isms_documentation","isms_program_management","security_governance"] },
  { id:"business_continuity",  label:"Business Continuity",       cat:"grc",          m:["business_continuity_program_management","business_impact_analysis","recovery_strategy_development","bcms_implementation"] },
  { id:"gdpr",                 label:"GDPR Compliance",           cat:"privacy",      m:["gdpr_compliance","eu_data_protection_law","data_subject_rights","lawful_basis_processing","dpia_methodology"] },
  { id:"privacy_engineering",  label:"Privacy Engineering",       cat:"privacy",      m:["privacy_engineering","privacy_by_design","anonymization_and_pseudonymization","privacy_enhancing_technologies","technical_privacy_controls"] },
  { id:"us_privacy",           label:"US Privacy Law",            cat:"privacy",      m:["us_privacy_law","hipaa_compliance","ccpa_compliance","federal_privacy_regulations","phi_handling"] },
  { id:"ics_security",         label:"ICS / SCADA Security",      cat:"ot_ics",       m:["ics_security_fundamentals","scada_security","industrial_protocols","isa_62443_framework","scada_vulnerability_assessment"] },
  { id:"iot_security",         label:"IoT Security",              cat:"ot_ics",       m:["iot_security_architecture","embedded_device_security","iot_network_security","iot_device_pentesting","firmware_analysis_basics","hardware_interaction"] },
  { id:"ot_ir",                label:"OT Incident Response",      cat:"ot_ics",       m:["ot_incident_response","ics_forensics","scada_investigation","ot_network_analysis","industrial_protocol_analysis"] },
  { id:"ai_red_teaming",       label:"AI Red Teaming",            cat:"ai_security",  m:["ai_red_teaming_methodology","llm_red_teaming","llm_jailbreaking","prompt_injection","ai_attack_techniques","ai_system_exploitation","model_extraction"] },
  { id:"ai_ml_security",       label:"AI/ML System Security",     cat:"ai_security",  m:["secure_ml_pipeline_design","model_security","mlops_security","llm_security_architecture","genai_pipeline_security","rag_security","ai_supply_chain_security"] },
  { id:"ai_governance",        label:"AI Governance & Risk",      cat:"ai_security",  m:["ai_governance_frameworks","eu_ai_act","ai_risk_management","algorithmic_accountability","nist_ai_rmf","ai_ethics"] },
  { id:"siem",                 label:"SIEM Operations",           cat:"leadership",   m:["siem_investigation","siem_management","siem_rule_development","log_analysis","alert_triage","microsoft_sentinel","splunk_es_usage"] },
  { id:"detection_engineering",label:"Detection Engineering",     cat:"leadership",   m:["detection_engineering","detection_rule_development","behavioral_detection","behavioral_analytics"] },
  { id:"sec_program_mgmt",     label:"Security Program Mgmt",     cat:"leadership",   m:["security_program_management","security_program_development","cybersecurity_program_management","iso_27032_framework"] },
  { id:"sec_leadership",       label:"Security Leadership",       cat:"leadership",   m:["security_leadership","security_strategy_development","board_level_communication","security_investment_justification","executive_communication"] },
];

// ── ROLE CATEGORIES ──────────────────────────────────────────────────────────
const ROLE_CATEGORIES = [
  { id:"all",        label:"All Roles",             short:"All",       color:"#94a3b8" },
  { id:"offensive",  label:"Offensive & Red Team",  short:"Offensive", color:"#f87171" },
  { id:"defensive",  label:"Defensive & Blue Team", short:"Defensive", color:"#fb923c" },
  { id:"network",    label:"Network & Cloud",        short:"Network",   color:"#60a5fa" },
  { id:"grc",        label:"GRC & Compliance",       short:"GRC",       color:"#9ca3af" },
  { id:"leadership", label:"Leadership",             short:"Lead",      color:"#38bdf8" },
];
const catFor = id => ROLE_CATEGORIES.find(c => c.id === id) ?? ROLE_CATEGORIES[0];

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const allCerts    = (cm={}) => { const seen=new Set(); return Object.values(cm).flat().filter(c=>seen.has(c.id)?false:seen.add(c.id)); };
const getCertById = (id, cm={}) => allCerts(cm).find(c => c.id === id);
const fmt = cost => cost === 0 ? "Free" : `$${cost.toLocaleString()}`;
const getIssuers  = (domain, cm) => [...new Set((cm[domain]||[]).map(c=>c.issuing_body))].sort();

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Badge({ children, style }) {
  return <span className="badge" style={style}>{children}</span>;
}

function CertCard({ cert, active, onClick, showDomain }) {
  const pDomain = cert.domain[0];
  const col     = domainColor(pDomain);
  const lvl     = LEVELS[cert.level] || LEVELS.beginner;
  const prac    = pracLabel(cert.practical_weight);
  const overall = cert.scores?.overall ?? null;
  return (
    <div className={`cert-card${active?" active":""}`} style={{ "--card-accent": col }} onClick={onClick}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:6, marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
          <span className="mono" style={{ fontWeight:600, fontSize:13.5, color:"#e2eaf8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cert.acronym}</span>
          {cert.dod_8140 && <Badge style={{ background:"rgba(56,189,248,0.12)", color:"#38bdf8", fontSize:9 }}>DoD</Badge>}
          {!cert.active && <Badge style={{ background:"rgba(248,113,113,0.1)", color:"#f87171", fontSize:9 }}>Inactive</Badge>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          {overall !== null && (
            <div className="overall-badge" style={{ background:`${scoreColor(overall)}18`, color:scoreColor(overall) }} title="Overall Score">
              {overall.toFixed(1)}
            </div>
          )}
          <Badge style={{ background:lvl.bg, color:lvl.fg, fontSize:9 }}>{lvl.short}</Badge>
        </div>
      </div>
      <div style={{ fontSize:11.5, color:"var(--mid)", lineHeight:1.4, marginBottom:6 }}>{cert.full_name}</div>
      <div style={{ fontSize:10.5, color:"var(--muted)", marginBottom:8, display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
        {showDomain && <Badge style={{ background:`${col}18`, color:col, fontSize:9 }}>{domainShort(pDomain)}</Badge>}
        {cert.issuing_body}
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
          <span style={{ fontSize:9.5, color:"var(--muted)" }}>Practical Weight</span>
          <span className="prac-badge" style={{ background:prac.bg, color:prac.fg }}>{prac.label}</span>
        </div>
        <div className="pbar"><div className="pbar-fill" style={{ width:`${cert.practical_weight}%`, background:col }} /></div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span className="mono" style={{ fontSize:11, color:"var(--mid)" }}>{fmt(cert.cost_usd)}</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap:3, justifyContent:"flex-end" }}>
          {cert.flags?.slice(0,2).map(f => {
            const fc = FLAGS[f]; if(!fc) return null;
            return <Badge key={f} style={{ background:fc.bg, color:fc.fg, fontSize:9 }}>{fc.label}</Badge>;
          })}
        </div>
      </div>
    </div>
  );
}

function CertProfile({ cert, onClose }) {
  if (!cert) return (
    <div className="empty" style={{ height:"100%" }}>
      <div className="empty-icon">📋</div>
      <div style={{ fontSize:13, fontWeight:500, color:"var(--mid)" }}>Select a cert to view its profile</div>
      <div style={{ fontSize:11.5, color:"var(--muted)" }}>Click any card or acronym to see full details</div>
    </div>
  );
  const pDomain = cert.domain[0];
  const col = domainColor(pDomain);
  const lvl = LEVELS[cert.level] || LEVELS.beginner;
  const prac = pracLabel(cert.practical_weight);
  return (
    <div className="scroll anim-slideright" style={{ height:"100%", padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span className="heading" style={{ fontSize:22, fontWeight:700, color:"#e8f0ff", letterSpacing:"-0.01em" }}>{cert.acronym}</span>
            {cert.dod_8140 && <Badge style={{ background:"rgba(56,189,248,0.14)", color:"#38bdf8" }}>✓ DoD 8140</Badge>}
            {!cert.active && <Badge style={{ background:"rgba(248,113,113,0.1)", color:"#f87171" }}>Inactive</Badge>}
          </div>
          <div style={{ fontSize:12.5, color:"var(--mid)", lineHeight:1.4, maxWidth:280 }}>{cert.full_name}</div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:17, padding:"2px 4px" }}>✕</button>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
        {cert.domain.map(d => <span key={d} className="badge" style={{ background:`${domainColor(d)}18`, color:domainColor(d), padding:"3px 8px", fontSize:10.5 }}>{domainShort(d)}</span>)}
        <span className="badge" style={{ background:lvl.bg, color:lvl.fg, padding:"3px 8px", fontSize:10.5 }}>{lvl.label}</span>
        <span className="prac-badge" style={{ background:prac.bg, color:prac.fg, padding:"3px 8px" }}>{prac.label}</span>
        {cert.flags?.map(f => { const fc=FLAGS[f]; if(!fc) return null; return <Badge key={f} style={{ background:fc.bg, color:fc.fg, padding:"3px 8px", fontSize:10.5 }}>{fc.label}</Badge>; })}
      </div>
      <div className="div" />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[["Issuing Body",cert.issuing_body,false],["Cost",fmt(cert.cost_usd),true],["Renewal",cert.renewal,false],["Practical",`${cert.practical_weight}%`,true]].map(([k,v,mono]) => (
          <div key={k} style={{ background:"var(--surface3)", borderRadius:6, padding:"9px 11px" }}>
            <div style={{ fontSize:9.5, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{k}</div>
            <div style={{ fontSize:12.5, fontWeight:500, color:"var(--text)", ...(mono?{fontFamily:"'IBM Plex Mono',monospace"}:{}) }}>{v}</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:10 }}>
          <span style={{ color:"var(--muted)" }}>Theory / MCQ</span>
          <span className="mono" style={{ color:prac.fg, fontWeight:600 }}>{cert.practical_weight}% Hands-On</span>
          <span style={{ color:"var(--muted)" }}>100% Practical</span>
        </div>
        <div className="pbar" style={{ height:5 }}>
          <div className="pbar-fill" style={{ width:`${cert.practical_weight}%`, background:`linear-gradient(90deg,${col}60,${col})` }} />
        </div>
      </div>
      {cert.scores && (
        <div style={{ background:"var(--surface2)", borderRadius:8, padding:"12px 14px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Score Breakdown</div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10, color:"var(--muted)" }}>Overall</span>
              <div className="overall-badge" style={{ background:`${scoreColor(cert.scores.overall)}18`, color:scoreColor(cert.scores.overall), width:38, height:28, fontSize:14 }}>
                {cert.scores.overall?.toFixed(1)}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {[["Practical Depth",cert.scores.practical_depth,"How much does passing prove you can DO the work?"],["Employer Recognition",cert.scores.employer_recognition,"Recruiter & hiring manager value"],["Community Respect",cert.scores.community_respect,"Practitioner community sentiment"],["Exam Difficulty",cert.scores.exam_difficulty,"How hard is the exam itself?"],["Salary Impact",cert.scores.salary_impact,"How much does it move compensation?"],["Time to Prepare",cert.scores.time_to_prepare,"Study / lab hours investment needed"]].map(([label,val,tip]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:130, fontSize:10.5, color:"var(--mid)", flexShrink:0 }} title={tip}>{label}</div>
                <div className="score-bar"><div className="score-bar-fill" style={{ width:`${val*10}%`, background:scoreColor(val) }} /></div>
                <div className="mono" style={{ fontSize:11, fontWeight:600, color:scoreColor(val), width:18, textAlign:"right", flexShrink:0 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {cert.summary && (
        <div style={{ background:"var(--surface2)", borderRadius:8, padding:"11px 13px", fontSize:12.5, color:"var(--mid)", lineHeight:1.72, borderLeft:`2.5px solid ${col}` }}>
          {cert.summary}
        </div>
      )}
      {cert.skills?.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:7 }}>Skills Validated</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {cert.skills.map(s => <span key={s} className="mono" style={{ fontSize:10.5, background:"var(--surface3)", color:"var(--mid)", padding:"2px 7px", borderRadius:4 }}>{s.replace(/_/g," ")}</span>)}
          </div>
        </div>
      )}
      {(cert.prerequisites?.knowledge?.length > 0 || cert.prerequisites?.recommended_certs?.length > 0) && (
        <div>
          <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:7 }}>Prerequisites</div>
          {cert.prerequisites.knowledge?.length > 0 && (
            <div style={{ marginBottom:6 }}>
              <div style={{ fontSize:10.5, color:"var(--muted)", marginBottom:4 }}>Knowledge needed</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {cert.prerequisites.knowledge.map(k => <span key={k} style={{ fontSize:10.5, background:"var(--surface2)", color:"var(--mid)", padding:"2px 7px", borderRadius:4 }}>{k.replace(/_/g," ")}</span>)}
              </div>
            </div>
          )}
          {cert.prerequisites.recommended_certs?.length > 0 && (
            <div>
              <div style={{ fontSize:10.5, color:"var(--muted)", marginBottom:4 }}>Recommended before</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {cert.prerequisites.recommended_certs.map(c => <span key={c} className="mono" style={{ fontSize:10.5, background:`${col}14`, color:col, padding:"2px 7px", borderRadius:4, fontWeight:500 }}>{c.toUpperCase()}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
      {cert.official_url && (
        <div style={{ marginTop:"auto", paddingTop:6 }}>
          <a href={cert.official_url} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:col, fontWeight:500, display:"inline-flex", alignItems:"center", gap:4 }}>
            Official Certification Page ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CERT VIEW
// ═══════════════════════════════════════════════════════════════════════════

function CertView({ CERTS, setCERTS }) {
  const [domain,      setDomain     ] = useState("offensive");
  const [cert,        setCert       ] = useState(null);
  const [search,      setSearch     ] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterIssuer,setFilterIssuer]= useState("all");
  const [filterCost,  setFilterCost ] = useState("all");
  const [filterDod,   setFilterDod  ] = useState(false);
  const [filterPrac,  setFilterPrac ] = useState(false);
  const [sortBy,      setSortBy     ] = useState("default");
  const [expanded,    setExpanded   ] = useState(new Set());

  useEffect(() => {
    if (domain === "all" || CERTS[domain]) return;
    fetch(`/data/certs/${domain}.json`).then(r=>r.json()).then(data=>setCERTS(prev=>({...prev,[domain]:data}))).catch(()=>{});
  }, [domain]);

  const hasCerts = domain === "all" ? Object.keys(CERTS).length > 0 : Boolean(CERTS[domain]);
  const issuers  = useMemo(() =>
    domain === "all"
      ? [...new Set(allCerts(CERTS).map(c => c.issuing_body))].sort()
      : getIssuers(domain, CERTS),
    [domain, CERTS]);

  const visible = useMemo(() => {
    const list = domain === "all" ? allCerts(CERTS) : (CERTS[domain] || []);
    const filtered = list.filter(c => {
      const q = search.toLowerCase();
      if (q && !(c.acronym.toLowerCase().includes(q)||c.full_name.toLowerCase().includes(q)||c.issuing_body.toLowerCase().includes(q))) return false;
      if (filterLevel !=="all" && c.level!==filterLevel) return false;
      if (filterIssuer!=="all" && c.issuing_body!==filterIssuer) return false;
      if (filterCost  !=="all" && costBucket(c.cost_usd)!==filterCost) return false;
      if (filterDod  && !c.dod_8140) return false;
      if (filterPrac && c.practical_weight < 50) return false;
      return true;
    });
    const sorted = [...filtered];
    if (sortBy==="overall") sorted.sort((a,b)=>(b.scores?.overall??0)-(a.scores?.overall??0));
    if (sortBy==="alpha")   sorted.sort((a,b)=>a.acronym.localeCompare(b.acronym));
    if (sortBy==="level")   sorted.sort((a,b)=>(LEVELS[a.level]?.order??0)-(LEVELS[b.level]?.order??0));
    if (sortBy==="cost")    sorted.sort((a,b)=>a.cost_usd-b.cost_usd);
    if (sortBy==="issuer")  sorted.sort((a,b)=>a.issuing_body.localeCompare(b.issuing_body));
    return sorted;
  }, [domain,search,filterLevel,filterIssuer,filterCost,filterDod,filterPrac,sortBy,CERTS]);

  const levelGroups = useMemo(() => {
    const list = CERTS[domain] || [];
    return LEVEL_ORDER.map(lvl=>({level:lvl,certs:list.filter(c=>c.level===lvl)})).filter(g=>g.certs.length>0);
  }, [domain, CERTS]);

  const selectCert = c => setCert(prev=>prev?.id===c?.id?null:c);
  const resetFilters = () => { setSearch(""); setFilterLevel("all"); setFilterIssuer("all"); setFilterCost("all"); setFilterDod(false); setFilterPrac(false); setSortBy("default"); };
  const hasActiveFilters = search||filterLevel!=="all"||filterIssuer!=="all"||filterCost!=="all"||filterDod||filterPrac||sortBy!=="default";

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <div style={{ width:158, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--surface)" }}>
        <div style={{ padding:"8px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          <div style={{ fontSize:9.5, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{domain === "all" ? "By Domain" : "By Level"}</div>
        </div>
        <div className="scroll" style={{ flex:1, padding:"6px 8px" }}>
          {!hasCerts ? <div style={{ padding:"20px 8px", fontSize:11, color:"var(--muted)", textAlign:"center" }}>Loading…</div>
          : domain === "all"
          ? DOMAINS.filter(d => CERTS[d.id]?.length).map(dom => {
              const isOpen = expanded.has(dom.id);
              const domLvlGroups = LEVEL_ORDER.map(lvl => ({ level:lvl, certs:(CERTS[dom.id]||[]).filter(c=>c.level===lvl) })).filter(g=>g.certs.length>0);
              return (
                <div key={dom.id} style={{ marginBottom:4 }}>
                  <button onClick={()=>setExpanded(p=>{const n=new Set(p);n.has(dom.id)?n.delete(dom.id):n.add(dom.id);return n;})} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:"3px 8px 3px 6px", borderLeft:`2px solid ${dom.color}`, marginBottom: isOpen ? 4 : 0 }}>
                    <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:dom.color }}>{dom.short}</span>
                    <span style={{ fontSize:8, color:dom.color, opacity:0.7 }}>{isOpen ? "▾" : "▸"}</span>
                  </button>
                  {isOpen && domLvlGroups.map(g => {
                    const lvl = LEVELS[g.level];
                    return (
                      <div key={g.level} style={{ marginBottom:6, marginLeft:6 }}>
                        <div style={{ fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:lvl.fg, padding:"2px 4px", marginBottom:1 }}>{lvl.label}</div>
                        {g.certs.map(c => {
                          const ov = c.scores?.overall ?? null;
                          return (
                            <button key={c.id} className={`lvl-item${cert?.id===c.id?" active":""}`} title={c.full_name} onClick={()=>selectCert(c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {!c.active && <span style={{ color:"#fb923c", marginRight:2, fontSize:9 }}>⏸</span>}
                                {c.acronym}
                              </span>
                              {ov !== null && <span className="mono" style={{ fontSize:9.5, fontWeight:600, color:scoreColor(ov), flexShrink:0 }}>{ov.toFixed(1)}</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })
          : levelGroups.map(g => {
            const lvl = LEVELS[g.level];
            return (
              <div key={g.level} style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:lvl.fg, padding:"3px 8px 3px 6px", marginBottom:2, borderLeft:`2px solid ${lvl.fg}` }}>{lvl.label}</div>
                {g.certs.map(c => {
                  const ov = c.scores?.overall ?? null;
                  return (
                    <button key={c.id} className={`lvl-item${cert?.id===c.id?" active":""}`} title={c.full_name} onClick={()=>selectCert(c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:4 }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {!c.active && <span style={{ color:"#fb923c", marginRight:2, fontSize:9 }}>⏸</span>}
                        {c.acronym}
                      </span>
                      {ov !== null && <span className="mono" style={{ fontSize:9.5, fontWeight:600, color:scoreColor(ov), flexShrink:0 }}>{ov.toFixed(1)}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid var(--border)" }}>
        <div style={{ padding:"9px 16px", borderBottom:"1px solid var(--border)", display:"flex", flexWrap:"wrap", gap:5, flexShrink:0, background:"var(--surface)" }}>
          <button key="all" className={`dpill${domain==="all"?" active":""}`} style={domain==="all"?{background:"#94a3b8",color:"#000"}:{}} onClick={()=>{setDomain("all");setCert(null);resetFilters();}}>
            <span className="dot" style={{ background:domain==="all"?"rgba(0,0,0,0.4)":"#94a3b8" }} />
            All
            <span className="mono" style={{ fontSize:9.5, opacity:0.6 }}>{allCerts(CERTS).length}</span>
          </button>
          {DOMAINS.map(d => (
            <button key={d.id} className={`dpill${domain===d.id?" active":""}`} style={domain===d.id?{background:d.color}:{}} onClick={()=>{setDomain(d.id);setCert(null);resetFilters();}}>
              <span className="dot" style={{ background:domain===d.id?"rgba(0,0,0,0.4)":d.color }} />
              {d.short}
              <span className="mono" style={{ fontSize:9.5, opacity:0.6 }}>{CERTS[d.id]?.length ?? d.count}</span>
            </button>
          ))}
        </div>
        {(() => {
          const dom = DOMAINS.find(d=>d.id===domain);
          if (!dom?.description) return null;
          return (
            <div style={{ padding:"7px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8, flexShrink:0, background:"var(--surface)" }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:dom.color, flexShrink:0 }} />
              <span style={{ fontSize:11.5, color:"var(--mid)", lineHeight:1.4 }}>{dom.description}</span>
            </div>
          );
        })()}
        <div style={{ padding:"8px 16px", borderBottom:"1px solid var(--border)", flexShrink:0, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <input type="search" placeholder="Search certs…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:160 }} />
          <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} style={{ width:130 }}>
            <option value="all">All Levels</option>
            {LEVEL_ORDER.map(l=><option key={l} value={l}>{LEVELS[l].label}</option>)}
          </select>
          <select value={filterIssuer} onChange={e=>setFilterIssuer(e.target.value)} style={{ width:170 }}>
            <option value="all">All Issuers</option>
            {issuers.map(i=><option key={i} value={i}>{i}</option>)}
          </select>
          <select value={filterCost} onChange={e=>setFilterCost(e.target.value)} style={{ width:126 }}>
            <option value="all">Any Cost</option>
            <option value="free">Free</option>
            <option value="under500">Under $500</option>
            <option value="500to1k">$500 – $1,000</option>
            <option value="over1k">Over $1,000</option>
          </select>
          <button className={`btn${filterDod?" on":""}`} onClick={()=>setFilterDod(p=>!p)}>DoD 8140</button>
          <button className={`btn${filterPrac?" on":""}`} onClick={()=>setFilterPrac(p=>!p)}>≥50% Practical</button>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginLeft:4 }}>
            <span style={{ fontSize:10.5, color:"var(--muted)", whiteSpace:"nowrap" }}>Sort:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ width:150 }}>
              <option value="default">Default</option>
              <option value="overall">Overall Score ↓</option>
              <option value="alpha">Alphabetical (A–Z)</option>
              <option value="level">Level (Beginner → Elite)</option>
              <option value="cost">Cost (Low → High)</option>
              <option value="issuer">Issuer</option>
            </select>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            {hasActiveFilters && <button className="btn" onClick={resetFilters} style={{ color:"#f87171", borderColor:"rgba(248,113,113,0.2)" }}>✕ Clear</button>}
            <span className="mono" style={{ fontSize:10.5, color:"var(--muted)", whiteSpace:"nowrap" }}>{hasCerts?`${visible.length} cert${visible.length!==1?"s":""}`: "…"}</span>
          </div>
        </div>
        <div className="scroll" style={{ flex:1, padding:14 }}>
          {!hasCerts ? <div className="empty"><div className="empty-icon">⏳</div><div style={{ fontSize:13, color:"var(--mid)" }}>Loading {domain}.json…</div></div>
          : visible.length===0 ? <div className="empty"><div className="empty-icon">🔍</div><div style={{ fontSize:13, color:"var(--mid)" }}>No certs match your filters</div><button className="btn" onClick={resetFilters} style={{ marginTop:4 }}>Clear filters</button></div>
          : <div className="anim-fadeup" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:9 }}>
              {visible.map(c=><CertCard key={c.id} cert={c} active={cert?.id===c.id} onClick={()=>selectCert(c)} showDomain={domain==="all"} />)}
            </div>}
        </div>
      </div>
      <div style={{ width:390, flexShrink:0, background:"var(--surface)", overflow:"hidden" }}>
        <CertProfile cert={cert} onClose={()=>setCert(null)} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS VIEW
// ═══════════════════════════════════════════════════════════════════════════

function SkillsView({ CERTS }) {
  const [selected, setSelected] = useState(new Set());
  const [open,     setOpen    ] = useState(new Set());
  const [cert,     setCert    ] = useState(null);
  const [search,   setSearch  ] = useState("");

  const toggle    = useCallback(id=>{setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});},[]);
  const toggleCat = useCallback(id=>{setOpen(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});},[]);

  const filteredSkills = useMemo(()=>{
    if (!search) return SKILLS;
    const q=search.toLowerCase();
    return SKILLS.filter(s=>s.label.toLowerCase().includes(q));
  },[search]);

  const cats = useMemo(()=>SKILL_CATS.map(c=>({...c,skills:filteredSkills.filter(s=>s.cat===c.id)})).filter(c=>c.skills.length>0),[filteredSkills]);

  const matchingCerts = useMemo(()=>{
    if (!selected.size) return [];
    const matchSets=SKILLS.filter(s=>selected.has(s.id)).map(s=>new Set(s.m));
    return allCerts(CERTS).filter(cert=>matchSets.every(ms=>cert.skills?.some(sk=>ms.has(sk))));
  },[selected,CERTS]);

  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      <div style={{ width:268, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--surface)" }}>
        <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:"var(--mid)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Skills</span>
            {selected.size>0 && <button className="btn" style={{ padding:"2px 7px", fontSize:11 }} onClick={()=>{setSelected(new Set());setCert(null);}}>Clear {selected.size}</button>}
          </div>
          <input type="search" placeholder="Filter skills…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="scroll" style={{ flex:1, padding:6 }}>
          {cats.map(cat=>(
            <div key={cat.id}>
              <button onClick={()=>toggleCat(cat.id)} style={{ width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 8px",background:"none",border:"none",cursor:"pointer",borderRadius:5,color:"var(--mid)",fontSize:10.5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4 }}>
                <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ width:7,height:7,borderRadius:"50%",background:cat.color }} />
                  {cat.label}
                </span>
                <span style={{ opacity:0.5 }}>{open.has(cat.id)?"▾":"▸"}</span>
              </button>
              {open.has(cat.id)&&cat.skills.map(s=>(
                <div key={s.id} className={`skill-row${selected.has(s.id)?" sel":""}`} onClick={()=>toggle(s.id)}>
                  <div className={`cb${selected.has(s.id)?" on":""}`}>{selected.has(s.id)&&<span style={{ color:"#000",fontSize:8,fontWeight:700 }}>✓</span>}</div>
                  {s.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid var(--border)" }}>
        <div style={{ padding:"10px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
          {selected.size===0 ? <span style={{ fontSize:12.5,color:"var(--muted)" }}>Select skills from the left to find matching certs</span>
          : <span style={{ fontSize:12.5 }}><span className="mono" style={{ fontWeight:600,color:"var(--accent)",fontSize:15 }}>{matchingCerts.length}</span><span style={{ color:"var(--mid)" }}> cert{matchingCerts.length!==1?"s":""} cover all {selected.size} selected skill{selected.size!==1?"s":""}</span></span>}
          {selected.size>0&&(
            <div style={{ display:"flex",flexWrap:"wrap",gap:4,maxWidth:280,justifyContent:"flex-end" }}>
              {[...selected].slice(0,5).map(id=>{const s=SKILLS.find(x=>x.id===id);const c=SKILL_CATS.find(c=>c.id===s?.cat);return <span key={id} className="badge" style={{ background:`${c?.color||"#64748b"}18`,color:c?.color||"#64748b",padding:"2px 7px",fontSize:10 }}>{s?.label}</span>;})}
              {selected.size>5&&<span className="badge" style={{ background:"var(--surface3)",color:"var(--mid)",padding:"2px 7px",fontSize:10 }}>+{selected.size-5}</span>}
            </div>
          )}
        </div>
        <div className="scroll" style={{ flex:1,padding:14 }}>
          {selected.size===0?<div className="empty"><div className="empty-icon">🧠</div><div style={{ fontSize:13,fontWeight:500,color:"var(--mid)" }}>Multi-select any skills from the left</div><div style={{ fontSize:11.5,color:"var(--muted)" }}>Results show certs that validate ALL selected skills simultaneously</div></div>
          :matchingCerts.length===0?<div className="empty"><div className="empty-icon">🔍</div><div style={{ fontSize:13,fontWeight:500,color:"var(--mid)" }}>No single cert covers all selected skills</div></div>
          :<div className="anim-fadeup" style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9 }}>{matchingCerts.map(c=><CertCard key={c.id} cert={c} active={cert?.id===c.id} onClick={()=>setCert(cert?.id===c.id?null:c)} />)}</div>}
        </div>
      </div>
      <div style={{ width:390,flexShrink:0,background:"var(--surface)",overflow:"hidden" }}>
        <CertProfile cert={cert} onClose={()=>setCert(null)} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE VIEW
// ═══════════════════════════════════════════════════════════════════════════

function RoleView({ CERTS, setCERTS }) {
  const [roles,     setRoles   ] = useState([]);
  const [PATHS,     setPATHS   ] = useState({});
  const [role,      setRole    ] = useState(null);
  const [path,      setPath    ] = useState(null);
  const [cert,      setCert    ] = useState(null);

  useEffect(() => {
    fetch("/data/roles.json").then(r=>r.json()).then(setRoles).catch(()=>{});
  }, []);

  useEffect(() => {
    DOMAINS.forEach(({ id }) => {
      if (CERTS[id]) return;
      fetch(`/data/certs/${id}.json`).then(r=>r.json()).then(data=>setCERTS(prev=>({...prev,[id]:data}))).catch(()=>{});
    });
  }, []);

  useEffect(() => {
    if (!role || PATHS[role.id]) return;
    fetch(`/data/paths/${role.id}.json`).then(r=>r.json()).then(data=>setPATHS(prev=>({...prev,[role.id]:data}))).catch(()=>{});
  }, [role]);

  const pathData  = role ? PATHS[role.id] : null;
  const rolePaths = pathData?.paths ?? [];

  const pickRole = r => { if (role?.id === r.id) return; setRole(r); setPath(null); setCert(null); };
  const pickPath = p => { setPath(p); setCert(null); };

  useEffect(() => {
    if (rolePaths.length && !path) setPath(rolePaths[0]);
  }, [rolePaths]);

  const seq = path?.cert_sequence ?? [];

  const grouped = useMemo(() => {
    const g = {};
    ROLE_CATEGORIES.filter(c=>c.id!=="all").forEach(c=>{ g[c.id]=[]; });
    roles.forEach(r => {
      const key = r.category && g[r.category] ? r.category : "defensive";
      g[key].push(r);
    });
    return g;
  }, [roles]);


  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
      {/* Sidebar: grouped role list */}
      <div style={{ width:248, flexShrink:0, borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", background:"var(--surface)" }}>
        <div className="scroll" style={{ flex:1, padding:"4px 0" }}>
          {ROLE_CATEGORIES.filter(c=>c.id!=="all").map(cat => {
            const catRoles = grouped[cat.id] || [];
            if (!catRoles.length) return null;
            return (
              <div key={cat.id} style={{ marginBottom:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 12px",
                  borderLeft:`3px solid ${cat.color}`, background:"var(--surface2)" }}>
                  <span style={{ fontSize:9.5, color:cat.color, fontWeight:700,
                    textTransform:"uppercase", letterSpacing:"0.07em", flex:1 }}>{cat.label}</span>
                  <span style={{ fontSize:9, color:"var(--muted)" }}>{catRoles.length}</span>
                </div>
                {catRoles.map(r => (
                  <div key={r.id} onClick={()=>pickRole(r)}
                    style={{ padding:"5px 12px 5px 22px", cursor:"pointer",
                      background:role?.id===r.id?"var(--surface3)":"transparent",
                      borderLeft:role?.id===r.id?`3px solid ${cat.color}`:"3px solid transparent",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      transition:"background 0.1s" }}
                    onMouseEnter={e=>{ if(role?.id!==r.id) e.currentTarget.style.background="var(--surface2)"; }}
                    onMouseLeave={e=>{ if(role?.id!==r.id) e.currentTarget.style.background="transparent"; }}>
                    <span style={{ fontSize:12, color:role?.id===r.id?"var(--text)":"var(--mid)",
                      fontWeight:role?.id===r.id?600:400 }}>{r.label}</span>
                    <span style={{ fontSize:9.5, color:"var(--muted)", flexShrink:0 }}>{PATHS[r.id]?.paths?.length ?? r.path_count}p</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid var(--border)" }}>
        {!role ? (
          <div className="empty" style={{ flex:1 }}>
            <div className="empty-icon">🎯</div>
            <div style={{ fontSize:13, fontWeight:500, color:"var(--mid)" }}>Select a role to see cert paths</div>
            <div style={{ fontSize:11.5, color:"var(--muted)" }}>Browse by category or pick from the overview table</div>
          </div>
        ) : !pathData ? (
          <div className="empty" style={{ flex:1 }}>
            <div style={{ fontSize:12, color:"var(--muted)" }}>Loading paths...</div>
          </div>
        ) : (
          <>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
              {(() => {
                const cat = catFor(role.category);
                return <span style={{ fontSize:10, fontWeight:600, color:cat.color,
                  background:`${cat.color}14`, padding:"2px 8px", borderRadius:10,
                  display:"inline-block", marginBottom:6 }}>{cat.label}</span>;
              })()}
              <div className="heading" style={{ fontSize:19, fontWeight:700, letterSpacing:"-0.01em", marginBottom:3 }}>{pathData.label}</div>
              <div style={{ fontSize:12.5, color:"var(--mid)", marginBottom:6 }}>{pathData.description}</div>
              {pathData.job_titles?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                  {pathData.job_titles.map(t => (
                    <span key={t} style={{ fontSize:10.5, background:"var(--surface3)",
                      border:"1px solid var(--border)", borderRadius:4, padding:"2px 7px", color:"var(--mid)" }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding:"10px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:6, flexWrap:"wrap", flexShrink:0 }}>
              {rolePaths.map(p => (
                <button key={p.id} className={`ptab${path?.id===p.id?" active":""}`}
                  onClick={()=>pickPath(p)}>{p.name}</button>
              ))}
            </div>
            {path && (
              <div className="scroll anim-fadeup" style={{ flex:1, padding:"14px 20px" }}>
                <div style={{ background:"var(--surface2)", borderRadius:10, padding:15, marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14.5, fontWeight:600, marginBottom:4 }}>{path.name}</div>
                      <div style={{ fontSize:12.5, color:"var(--mid)", lineHeight:1.65 }}>{path.rationale}</div>
                    </div>
                    <div style={{ flexShrink:0, textAlign:"right" }}>
                      <div style={{ fontSize:9.5, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:2 }}>Total Cost</div>
                      <div className="mono heading" style={{ fontSize:20, fontWeight:700, color:"var(--accent)" }}>${path.total_cost_usd?.toLocaleString()??"—"}</div>
                      {path.estimated_timeline && <div style={{ fontSize:10.5, color:"var(--muted)", marginTop:4 }}>⏱ {path.estimated_timeline}</div>}
                    </div>
                  </div>
                  {path.prerequisites && (
                    <div style={{ background:"var(--surface3)", borderRadius:7, padding:10, marginBottom:10 }}>
                      <div style={{ fontSize:9.5, color:"var(--accent2)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Prerequisites</div>
                      <div style={{ fontSize:12, color:"var(--mid)", lineHeight:1.6 }}>{path.prerequisites.experience}</div>
                      {path.prerequisites.knowledge?.length > 0 && (
                        <div style={{ marginTop:6, display:"flex", flexWrap:"wrap", gap:4 }}>
                          {path.prerequisites.knowledge.map((k,i) => (
                            <span key={i} style={{ fontSize:10.5, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:4, padding:"2px 7px", color:"var(--mid)" }}>{k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.14)", borderRadius:7, padding:10 }}>
                      <div style={{ fontSize:9.5, color:"#4ade80", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Pros</div>
                      {path.pros.map((p,i) => <div key={i} style={{ fontSize:12, color:"var(--mid)", display:"flex", gap:5, marginBottom:3 }}><span style={{ color:"#4ade80", flexShrink:0 }}>+</span>{p}</div>)}
                    </div>
                    <div style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.14)", borderRadius:7, padding:10 }}>
                      <div style={{ fontSize:9.5, color:"#f87171", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Cons</div>
                      {path.cons.map((c,i) => <div key={i} style={{ fontSize:12, color:"var(--mid)", display:"flex", gap:5, marginBottom:3 }}><span style={{ color:"#f87171", flexShrink:0 }}>−</span>{c}</div>)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>Cert Sequence</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {seq.map((step, idx) => {
                    const c   = getCertById(step.cert_id, CERTS);
                    const col = c ? domainColor(c.domain[0]) : "#334155";
                    return (
                      <div key={step.cert_id} style={{ display:"flex", alignItems:"stretch", gap:10 }}>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, paddingTop:14 }}>
                          <div className="heading" style={{ width:26, height:26, borderRadius:"50%", background:c?col:"var(--surface3)", color:c?"#000":"var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{idx+1}</div>
                          {step.estimated_time && <div style={{ fontSize:9.5, color:"var(--muted)", marginTop:4, textAlign:"center", lineHeight:1.3 }}>⏱ {step.estimated_time}</div>}
                          {idx < seq.length-1 && <div style={{ width:1, flex:1, minHeight:12, background:"var(--border)", marginTop:4 }} />}
                        </div>
                        <div style={{ flex:1, paddingBottom:idx<seq.length-1?12:0 }}>
                          {c ? <CertCard cert={c} active={cert?.id===c.id} onClick={()=>setCert(cert?.id===c.id?null:c)} />
                          : <div style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:7, padding:"11px 14px", borderLeft:`3px solid ${col}`, opacity:0.75 }}>
                              <span className="mono" style={{ fontSize:12.5, color:"var(--mid)" }}>{step.cert_id}</span>
                              <span style={{ marginLeft:8, fontSize:10, color:"var(--muted)" }}>loading…</span>
                            </div>}
                          {step.notes && (
                            <div style={{ marginTop:6, fontSize:11.5, color:"var(--mid)", lineHeight:1.6, background:"var(--surface3)", borderLeft:"2px solid var(--border2)", borderRadius:"0 5px 5px 0", padding:"7px 10px" }}>{step.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ width:390, flexShrink:0, background:"var(--surface)", overflow:"hidden" }}>
        <CertProfile cert={cert} onClose={()=>setCert(null)} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT MODAL
// ═══════════════════════════════════════════════════════════════════════════

function AboutModal({ onClose, CERTS }) {
  const [tab,  setTab ] = useState("about");
  const [data, setData] = useState(null);
  const total = allCerts(CERTS).length;

  useEffect(() => {
    fetch("/data/about.json").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  const TABS = [["about","About"],["news","News"],["changelog","Changelog"],["support","Support"]];

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} className="anim-fadeup" style={{ background:"var(--surface)", border:"1px solid var(--border2)", borderRadius:"var(--radius-lg)", width:520, maxWidth:"92vw", maxHeight:"80vh", display:"flex", flexDirection:"column", position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:14, background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:17, padding:"2px 4px", zIndex:1 }}>✕</button>

        {/* Header */}
        <div style={{ padding:"22px 28px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
          <div style={{ width:38, height:38, background:"linear-gradient(135deg,#4ade80,#22d3ee)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span className="heading" style={{ fontSize:16, fontWeight:800, color:"#080c14" }}>EB</span>
          </div>
          <div>
            <div className="heading" style={{ fontSize:18, fontWeight:700, color:"#e8f0ff", letterSpacing:"0.02em" }}>EBCertMap</div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>Cybersecurity Certification Navigator</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, padding:"0 28px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 12px", fontSize:12, fontWeight:500, fontFamily:"inherit", color: tab===id ? "var(--accent)" : "var(--muted)", borderBottom: tab===id ? "2px solid var(--accent)" : "2px solid transparent", marginBottom:-1, transition:"color 0.15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="scroll" style={{ flex:1, padding:"20px 28px" }}>

          {tab === "about" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:10, fontSize:12.5, color:"var(--mid)", lineHeight:1.82 }}>
                <p>
                  Early in my cybersecurity career, one of the things that really helped me see the full scope of the industry and plan ahead was <a href="https://pauljerimy.com/security-certification-roadmap/" target="_blank" rel="noopener noreferrer">Paul Jerimy's Security Certification Roadmap</a>. As I grew in the field — beyond client engagements and technical offensive work — I also started teaching cybersecurity, and at the end of every course I'd pull up that roadmap to show students what lay ahead.
                </p>
                <p>
                  But time passed. Since its last update in 2024 (which I was genuinely excited about), the landscape kept moving. Newer domains like Cloud Security and AI Security grew into major career tracks, and the roadmap hadn't caught up. I looked for alternatives — something with the same clarity and impact — and couldn't find one.
                </p>
                <p>
                  So I built EBCertMap. Using my industry knowledge, and with the help of AI (Claude Opus, specifically) to research certs and gather data across domains where I have less direct experience, I put together a living reference that goes beyond a static image — with cert profiles, skill mapping, career paths, scoring, and more.
                </p>
                <p style={{ color:"var(--text)", fontStyle:"italic" }}>
                  My hope is that it does for someone starting out today what Paul Jerimy's roadmap did for me — help them see that cybersecurity is a vast field, full of directions worth exploring, and that there's far more to it than just hacking.
                </p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {[[total,"Certificates"],[DOMAINS.length,"Domains"],[SKILLS.length,"Skills"]].map(([n,label]) => (
                  <div key={label} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"12px 14px", textAlign:"center" }}>
                    <div className="mono heading" style={{ fontSize:22, fontWeight:700, color:"var(--accent)", marginBottom:3 }}>{n}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div className="div" />
              <div style={{ fontSize:11.5, color:"var(--muted)", textAlign:"center" }}>
                Built by <span style={{ color:"var(--accent)", fontWeight:600 }}>EB</span> · Data curated manually
              </div>
            </div>
          )}

          {tab === "news" && (() => {
            const PHASES = [
              { n:1, done:true,  title:"Foundation",       desc:"Domains, cert profiles, UI/UX, and data for all 15 domains" },
              { n:2, done:true,  title:"Skills & Roles",   desc:"Skills mapping tab, role categories, and cert labeling" },
              { n:3, done:true,  title:"Career Paths",     desc:"Role-based cert path explorer with 40+ roles and 100+ paths" },
              { n:4, done:false, title:"Courses",          desc:"Course recommendations and study resources per cert and skill" },
              { n:5, done:false, title:"AI Updates",       desc:"AI agent to research and refresh cert data periodically" },
            ];
            const doneCount = PHASES.filter(p=>p.done).length;
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                {/* Roadmap */}
                <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"var(--text)", textTransform:"uppercase", letterSpacing:"0.07em" }}>Project Roadmap</span>
                    <span className="mono" style={{ fontSize:10, color:"var(--accent)" }}>{doneCount}/{PHASES.length} phases complete</span>
                  </div>
                  {/* Progress bar */}
                  <div className="pbar" style={{ marginBottom:16, height:4 }}>
                    <div className="pbar-fill" style={{ width:`${(doneCount/PHASES.length)*100}%`, background:"var(--accent)" }} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                    {PHASES.map((p, i) => (
                      <div key={p.n} style={{ display:"flex", alignItems:"stretch", gap:12 }}>
                        {/* Spine */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:22, flexShrink:0 }}>
                          <div style={{ width:22, height:22, borderRadius:"50%", background: p.done ? "var(--accent)" : "var(--surface3)", border:`2px solid ${p.done ? "var(--accent)" : "var(--border2)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            {p.done
                              ? <span style={{ fontSize:10, fontWeight:800, color:"#080c14" }}>✓</span>
                              : <span className="mono" style={{ fontSize:9, color:"var(--muted)", fontWeight:700 }}>{p.n}</span>}
                          </div>
                          {i < PHASES.length-1 && <div style={{ width:1, flex:1, minHeight:10, background: p.done ? "rgba(74,222,128,0.25)" : "var(--border)", margin:"3px 0" }} />}
                        </div>
                        {/* Content */}
                        <div style={{ paddingBottom: i < PHASES.length-1 ? 12 : 0, flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                            <span style={{ fontSize:12, fontWeight:600, color: p.done ? "var(--text)" : "var(--mid)" }}>Phase {p.n} — {p.title}</span>
                            {p.done && <span style={{ fontSize:9, fontWeight:600, color:"var(--accent)", background:"rgba(74,222,128,0.1)", padding:"1px 6px", borderRadius:4 }}>Done</span>}
                          </div>
                          <div style={{ fontSize:11.5, color:"var(--muted)", lineHeight:1.55 }}>{p.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* News items */}
                {!data ? <div style={{ color:"var(--muted)", fontSize:12 }}>Loading…</div>
                : (data.news || []).map((n, i) => (
                  <div key={i} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{n.date}</span>
                      <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{n.title}</span>
                    </div>
                    <div style={{ fontSize:12.5, color:"var(--mid)", lineHeight:1.75 }}>{n.body}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {tab === "changelog" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {!data ? <div style={{ color:"var(--muted)", fontSize:12 }}>Loading…</div>
              : (data.changelog || []).map((entry, i) => (
                <div key={i}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", flexShrink:0 }} />
                    <span className="mono" style={{ fontSize:10, color:"var(--muted)" }}>{entry.date}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{entry.title}</span>
                  </div>
                  <div style={{ marginLeft:18, display:"flex", flexDirection:"column", gap:5 }}>
                    {(entry.items || []).map((item, j) => (
                      <div key={j} style={{ display:"flex", gap:8, fontSize:12.5, color:"var(--mid)", lineHeight:1.6 }}>
                        <span style={{ color:"var(--accent)", flexShrink:0 }}>+</span>
                        {item}
                      </div>
                    ))}
                  </div>
                  {i < (data.changelog||[]).length - 1 && <div className="div" style={{ marginTop:14 }} />}
                </div>
              ))}
            </div>
          )}

          {tab === "support" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14, alignItems:"center", paddingTop:8 }}>
              <div style={{ fontSize:13, color:"var(--mid)", lineHeight:1.75, textAlign:"center", maxWidth:340 }}>
                EBCertMap is a free, passion-built project. If it saved you time or helped you pick a cert, consider buying me a coffee ☕
              </div>
              <a href="https://buymeacoffee.com/eladbar" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#ffdd00", color:"#000", fontWeight:700, fontSize:13.5, padding:"10px 22px", borderRadius:8, textDecoration:"none", transition:"opacity 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                ☕ Buy me a coffee
              </a>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>No account needed · one-time or recurring</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════════════════════

function Nav({ view, setView, CERTS, onAbout }) {
  return (
    <header style={{
      background:"var(--surface)", borderBottom:"1px solid var(--border)",
      height:50, padding:"0 20px", display:"flex", alignItems:"center",
      gap:24, flexShrink:0, position:"sticky", top:0, zIndex:50,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:28, height:28, background:"linear-gradient(135deg,#4ade80,#22d3ee)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span className="heading" style={{ fontSize:13, fontWeight:800, color:"#080c14" }}>EB</span>
        </div>
        <span className="heading" style={{ fontSize:15, fontWeight:700, letterSpacing:"0.04em", color:"#c8daf8" }}>EBCERTMAP</span>
      </div>
      <nav style={{ display:"flex", gap:2 }}>
        {[["cert","📋 Certs"],["skill","🧠 Skills"],["role","🎯 Roles"]].map(([v,label]) => (
          <button key={v} className={`btn-nav${view===v?" active":""}`} onClick={() => setView(v)}>{label}</button>
        ))}
      </nav>
      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:16 }}>
        <span className="mono" style={{ fontSize:10.5, color:"var(--muted)" }}>{allCerts(CERTS).length} certs · {DOMAINS.length} domains · {SKILLS.length} skills</span>
        <button className="btn" onClick={onAbout} style={{ fontSize:11.5 }}>About</button>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [view,    setView  ] = useState("cert");
  const [CERTS,   setCERTS ] = useState({});
  const [about,   setAbout ] = useState(false);

  useEffect(() => {
    DOMAINS.forEach(({ id }) => {
      fetch(`/data/certs/${id}.json`)
        .then(r => r.json())
        .then(data => setCERTS(prev => ({ ...prev, [id]: data })))
        .catch(() => {});
    });
  }, []);

  return (
    <div className="gridbg" style={{ height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <Nav view={view} setView={setView} CERTS={CERTS} onAbout={()=>setAbout(true)} />
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        {view==="cert"  && <CertView  CERTS={CERTS} setCERTS={setCERTS} />}
        {view==="skill" && <SkillsView CERTS={CERTS} />}
        {view==="role"  && <RoleView  CERTS={CERTS} setCERTS={setCERTS} />}
      </div>
      {about && <AboutModal CERTS={CERTS} onClose={()=>setAbout(false)} />}
    </div>
  );
}