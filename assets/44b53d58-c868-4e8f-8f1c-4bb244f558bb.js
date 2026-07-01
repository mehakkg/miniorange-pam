// Audit & Compliance — seed data & primitives

const AUDIT_RECORDED_SESSIONS = [
  { id: "ses-1001", user: "Priya Iyer",       email: "priya@securecorp.com",  role: "DevOps Engineer",
    resource: "prod-db-primary", resourceIP: "10.42.18.7", resourceType: "database",
    sessionType: "SSH", connectMethod: "Web", credential: "prod-db-root",
    started: "May 14, 2026 02:47", ended: "May 14, 2026 02:59", duration: "12m 04s",
    commands: 47, riskScore: 72, recording: "recording", breakGlass: false, mfa: true,
    userIP: "115.160.215.254", ticket: "TKT-2104",
    risks: [
      "Off-hours session (started 2:47 AM)",
      "rm -rf command executed (irreversible action)",
      "Session duration 3.4× above average for this user on this resource"
    ],
    topCommands: [{ cmd: "psql -U postgres -d ledger", count: 8, ts: "02:47:14" }, { cmd: "ls /var/log", count: 6, ts: "02:48:02" }, { cmd: "rm -rf /var/log/old.log", count: 1, ts: "02:51:33" }, { cmd: "tail -f /var/log/postgres.log", count: 12, ts: "02:52:00" }, { cmd: "cat /etc/postgresql/postgresql.conf", count: 4, ts: "02:54:21" }],
    matchPreview: null
  },
  { id: "ses-1002", user: "Marcus Chen", email: "marcus@securecorp.com", role: "SysAdmin",
    resource: "auth-server-01", resourceIP: "10.42.4.21", resourceType: "linux",
    sessionType: "SSH", connectMethod: "Web", credential: "linux-ssh-admin",
    started: "May 14, 2026 14:12", ended: "May 14, 2026 14:20", duration: "8m 14s",
    commands: 12, riskScore: 91, recording: "recording", breakGlass: true, mfa: true,
    userIP: "192.168.4.18", ticket: "TKT-2103",
    risks: [
      "Break-glass session (post-emergency review required)",
      "rm -rf /var/log executed at 14:18 — irreversible",
      "Command not in operator's typical pattern"
    ],
    topCommands: [{ cmd: "sudo -i", count: 1, ts: "14:12:08" }, { cmd: "rm -rf /var/log/audit", count: 1, ts: "14:18:42" }, { cmd: "tail /var/log/messages", count: 4, ts: "14:13:18" }, { cmd: "systemctl restart auth-svc", count: 2, ts: "14:15:00" }],
    matchPreview: null
  },
  { id: "ses-1003", user: "Rohan Mehta", email: "rohan@securecorp.com", role: "Backend Developer",
    resource: "oracle-reporting", resourceIP: "10.42.18.22", resourceType: "database",
    sessionType: "Database", connectMethod: "Web", credential: "oracle-dba-01",
    started: "May 13, 2026 11:08", ended: "May 13, 2026 12:34", duration: "1h 26m",
    commands: 134, riskScore: 22, recording: "recording", breakGlass: false, mfa: true,
    userIP: "10.16.4.220", ticket: "TKT-2087",
    risks: [],
    topCommands: [{ cmd: "SELECT * FROM ledger_summary", count: 18, ts: "11:08:11" }],
    matchPreview: null
  },
  { id: "ses-1004", user: "Aditya Kulkarni", email: "aditya@securecorp.com", role: "QA Lead",
    resource: "dev-jumpbox", resourceIP: "10.42.99.1", resourceType: "linux",
    sessionType: "SSH", connectMethod: "Web", credential: "dev-jumpbox-admin",
    started: "May 13, 2026 09:14", ended: "May 13, 2026 09:42", duration: "28m 04s",
    commands: 47, riskScore: 0, recording: "recording", breakGlass: false, mfa: true,
    userIP: "10.16.4.114", ticket: null,
    risks: [],
    topCommands: [],
    matchPreview: null
  },
  { id: "ses-1005", user: "Priya Iyer", email: "priya@securecorp.com", role: "DevOps Engineer",
    resource: "auth-server-01", resourceIP: "10.42.4.21", resourceType: "linux",
    sessionType: "SSH", connectMethod: "Web", credential: "linux-ssh-admin",
    started: "May 13, 2026 18:42", ended: "May 13, 2026 18:54", duration: "12m 11s",
    commands: 34, riskScore: 67, recording: "recording", breakGlass: false, mfa: true,
    userIP: "115.160.215.254", ticket: null,
    risks: ["High frequency access — 14 sessions on this resource in 2 hours"],
    topCommands: [],
    matchPreview: null
  },
  { id: "ses-1006", user: "Marcus Chen", email: "marcus@securecorp.com", role: "SysAdmin",
    resource: "k8s-control-plane-aws", resourceIP: "eks.us-east-1", resourceType: "cloud",
    sessionType: "Web", connectMethod: "Web", credential: "k8s-cluster-admin",
    started: "May 12, 2026 11:08", ended: "May 12, 2026 12:34", duration: "1h 26m",
    commands: 89, riskScore: 41, recording: "not-recorded", breakGlass: false, mfa: true,
    userIP: "10.16.4.18", ticket: null,
    risks: ["Recording disabled — policy mismatch"],
    topCommands: [],
    matchPreview: null
  },
];

const LIVE_SESSIONS = [
  { id: "ses-live-1", user: "Priya Iyer", resource: "prod-db-primary", resourceIP: "10.42.18.7", resourceType: "database", sessionType: "SSH", credential: "prod-db-root", startedAgo: "12 min", duration: "12m 04s", commands: 47, recording: true, riskScore: 72 },
  { id: "ses-live-2", user: "Marcus Chen", resource: "data-warehouse-bastion", resourceIP: "bastion.kestrel", resourceType: "linux", sessionType: "SSH", credential: "bastion-jumpkey", startedAgo: "23 min", duration: "23m 11s", commands: 34, recording: true, riskScore: 18 },
  { id: "ses-live-3", user: "Aditya Kulkarni", resource: "kestrel-admin-portal", resourceIP: "admin.kestrel.io", resourceType: "web", sessionType: "Web", credential: "kestrel-admin-svc", startedAgo: "4 min", duration: "4m 02s", commands: 5, recording: true, riskScore: 0 },
  { id: "ses-live-4", user: "Rohan Mehta", resource: "stripe-webhook-relay", resourceIP: "webhooks.kestrel.io", resourceType: "web", sessionType: "Web", credential: "stripe-webhook-key", startedAgo: "1 min", duration: "1m 12s", commands: 1, recording: false, riskScore: 0 },
];

const REPORTS = [
  // ACCESS & SESSIONS
  { id: "r-server-access", name: "Server Access Report",       category: "access",     desc: "All privileged access events with user, resource, timestamp, and session outcome", lastRun: "Today 09:00", lastRunBy: "Arjun Bansal", scheduled: "Daily 09:00" },
  { id: "r-approval",      name: "Access Approval Report",     category: "access",     desc: "All ticket approvals and rejections with approver, requester, access window, and reason", lastRun: "Yesterday", lastRunBy: "Arjun Bansal", scheduled: null },
  { id: "r-active-alloc",  name: "Active Allocations Report",  category: "access",     desc: "Current standing access by user, resource, and expiry status", lastRun: "3 days ago", lastRunBy: "Priya Sharma", scheduled: null },
  { id: "r-over-priv",     name: "Over-Privileged Accounts Report", category: "access", desc: "Users with access beyond their role scope or with no expiry set", lastRun: "Never", lastRunBy: null, scheduled: null },
  { id: "r-bg",            name: "Break-Glass Events Report",  category: "access",     desc: "All emergency access events with justification, duration, and post-incident review status", lastRun: "Yesterday", lastRunBy: "Arjun Bansal", scheduled: "Weekly Mon 09:00" },
  // CREDENTIALS
  { id: "r-rotation",      name: "Password Rotation Report",   category: "credentials",desc: "Rotation activity with success/failure, timestamps, and credential status", lastRun: "Today 06:00", lastRunBy: "Scheduled", scheduled: "Daily 06:00" },
  { id: "r-cred-inv",      name: "Credential Inventory Report",category: "credentials",desc: "All vaulted credentials with sensitivity, owner, rotation policy, and last rotation", lastRun: "1 week ago", lastRunBy: "Arjun Bansal", scheduled: null },
  { id: "r-rotation-fail", name: "Rotation Failure Report",    category: "credentials",desc: "Failed rotations with reason, retry count, and affected resources", lastRun: "Today 06:00", lastRunBy: "Scheduled", scheduled: "Daily 06:00" },
  { id: "r-drift",         name: "Drifted Credentials Report", category: "credentials",desc: "Credentials where vault and target system are out of sync", lastRun: "Yesterday", lastRunBy: "Maya Iyer", scheduled: null },
  { id: "r-ssh",           name: "SSH Key Report",             category: "credentials",desc: "All SSH keys with owner, age, last used, and orphan status", lastRun: "Never", lastRunBy: null, scheduled: null },
  // DISCOVERY
  { id: "r-discovery",     name: "Discovery Report",           category: "discovery",  desc: "All discovered assets across network scans, AD, and cloud with onboarding status", lastRun: "5 days ago", lastRunBy: "Priya Sharma", scheduled: null },
  { id: "r-onboard",       name: "Onboarding Audit Report",    category: "discovery",  desc: "Newly onboarded accounts, SSH keys, and secrets with validation status", lastRun: "Yesterday", lastRunBy: "Arjun Bansal", scheduled: null },
  { id: "r-cert-expiry",   name: "Certificate Expiry Report",  category: "discovery",  desc: "All certificates with expiry dates, days remaining, and renewal status", lastRun: "Today", lastRunBy: "Scheduled", scheduled: "Weekly Mon 09:00" },
  { id: "r-cloud",         name: "Cloud Asset Report",         category: "discovery",  desc: "Cloud assets (AWS/GCP/Azure) with coverage and credential status", lastRun: "Never", lastRunBy: null, scheduled: null },
  // COMPLIANCE
  { id: "r-pci",           name: "PCI DSS Summary",            category: "compliance", desc: "Controls evidence: privileged access, rotation, monitoring, audit trail completeness", lastRun: "1 month ago", lastRunBy: "Mohak Sharma", scheduled: "Quarterly" },
  { id: "r-soc2",          name: "SOC2 Type II Evidence",      category: "compliance", desc: "Trust service criteria: security, availability, confidentiality controls summary", lastRun: "Never", lastRunBy: null, scheduled: null },
  { id: "r-iso",           name: "ISO 27001 Controls",         category: "compliance", desc: "Access management, audit logging, and incident response evidence", lastRun: "2 months ago", lastRunBy: "Mohak Sharma", scheduled: null },
  // SYSTEM
  { id: "r-cred-audit",    name: "Credentials Audit Report",   category: "system",     desc: "All credential operations with actor and timestamp", lastRun: "Yesterday", lastRunBy: "Arjun Bansal", scheduled: null },
  { id: "r-api",           name: "Client Credentials Usage",   category: "system",     desc: "API and OAuth credential usage patterns", lastRun: "Never", lastRunBy: null, scheduled: null },
  { id: "r-policy",        name: "Policy Configuration Audit", category: "system",     desc: "All policy changes with before/after values and actor", lastRun: "Yesterday", lastRunBy: "Arjun Bansal", scheduled: null },
];

const REPORT_CATEGORIES = [
  { id: "all",         label: "All reports" },
  { id: "access",      label: "Access & Sessions" },
  { id: "credentials", label: "Credentials & Rotation" },
  { id: "discovery",   label: "Discovery & Assets" },
  { id: "compliance",  label: "Compliance (PCI / SOC2 / ISO)" },
  { id: "system",      label: "System & Configuration" },
  { id: "custom",      label: "Custom" },
];

const SCHEDULED_REPORTS = [
  { id: "sch-1", report: "Server Access Report",     frequency: "Daily",    next: "Tomorrow 09:00",      recipients: ["compliance@securecorp.com","arjun@securecorp.com"], format: "PDF + CSV", lastRun: "Today 09:00",   lastOk: true,  status: "Active" },
  { id: "sch-2", report: "Break-Glass Events Report",frequency: "Weekly",   next: "Mon 09:00",            recipients: ["soc@securecorp.com"], format: "PDF",       lastRun: "Mon May 11",     lastOk: true,  status: "Active" },
  { id: "sch-3", report: "Password Rotation Report", frequency: "Daily",    next: "Tomorrow 06:00",       recipients: ["ops@securecorp.com","arjun@securecorp.com"], format: "CSV",        lastRun: "Today 06:00",    lastOk: false, status: "Active", error: "SMTP timeout — recipient compliance@securecorp.com" },
  { id: "sch-4", report: "PCI DSS Summary",          frequency: "Quarterly",next: "Jul 01, 2026 06:00",   recipients: ["audit@securecorp.com","compliance@securecorp.com","mohak@securecorp.com"], format: "PDF", lastRun: "Apr 01, 2026", lastOk: true,  status: "Active" },
  { id: "sch-5", report: "Certificate Expiry Report",frequency: "Weekly",   next: "Mon 09:00",            recipients: ["security@securecorp.com"], format: "PDF + CSV", lastRun: "Mon May 11", lastOk: true,  status: "Paused" },
];

const EVIDENCE_BUNDLES = [
  { id: "eb-1", name: "Q2 2026 PCI DSS Audit Evidence", purpose: "PCI Audit",     period: "Apr 1 – Jun 30, 2026",  contents: { reports: 8, sessions: 12, credentials: 5, accessEvents: 34 }, createdBy: "Mohak Sharma",  createdAgo: "2 days ago", status: "Ready",    size: "2.4 GB", hash: "7B:8E:5F:CC:21:9A:3D:8E:1F:2A:4B:5C:6D:7E:8F:91:AC:BD:CE:DF:E0:F1:02:13:24:35:46:57:68:79:8A:9B" },
  { id: "eb-2", name: "Incident #2847 Investigation",    purpose: "Incident Investigation", period: "May 13 – May 14, 2026", contents: { reports: 2, sessions: 4, credentials: 1, accessEvents: 6 }, createdBy: "Arjun Bansal",  createdAgo: "Today",      status: "Draft",    size: "—",      hash: null },
  { id: "eb-3", name: "SOC2 Annual Audit — 2026",        purpose: "SOC2",          period: "Jan 1 – Apr 30, 2026", contents: { reports: 12, sessions: 0, credentials: 18, accessEvents: 178 }, createdBy: "Mohak Sharma", createdAgo: "1 week ago", status: "Exported", size: "1.1 GB", hash: "1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09:1A:2B:3C:4D:5E:6F:70:81:92:A3:B4:C5:D6:E7:F8:09" },
  { id: "eb-4", name: "Break-Glass Review — May 2026",   purpose: "Break-glass Review", period: "May 1 – May 14, 2026", contents: { reports: 1, sessions: 3, credentials: 0, accessEvents: 8 }, createdBy: "Arjun Bansal",  createdAgo: "Yesterday",  status: "Shared",   size: "412 MB", hash: "4F:5E:6D:7C:8B:9A:0F:1E:2D:3C:4B:5A:69:78:87:96:A5:B4:C3:D2:E1:F0:0F:1E:2D:3C:4B:5A:69:78:87:96" },
];

const RISK = (score) => {
  if (score <= 0) return { level: "None",     fg: "var(--fg-4)",       bg: "var(--bg-surface-2)" };
  if (score <= 30) return { level: "Low",      fg: "var(--success-fg)", bg: "var(--success-soft)" };
  if (score <= 60) return { level: "Medium",   fg: "var(--warning-fg)", bg: "var(--warning-soft)" };
  if (score <= 85) return { level: "High",     fg: "var(--danger-fg)",  bg: "var(--danger-soft)"  };
  return                  { level: "Critical", fg: "#fff",              bg: "var(--danger)", bold: true };
};

const RiskScore = ({ score }) => {
  if (score == null || score === 0) return <span style={{ color: "var(--fg-4)" }}>—</span>;
  const r = RISK(score);
  return <span style={{
    display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999,
    font: `${r.bold ? 700 : 600} 11px/1.5 var(--font-sans)`,
    background: r.bg, color: r.fg, whiteSpace: "nowrap",
  }}>{score} · {r.level}</span>;
};

const RecordingBadge = ({ status }) => {
  if (status === "recording") return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: "var(--success-soft)", color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>Recording</span>;
  if (status === "not-recorded") return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: "var(--bg-surface-2)", color: "var(--fg-3)" }}>— Not recorded</span>;
  if (status === "failed") return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: "var(--danger-soft)", color: "var(--danger-fg)" }}>✗ Recording failed</span>;
  return null;
};

const SessionTypeBadge = ({ type }) => <span style={{ padding: "2px 8px", borderRadius: 4, background: "var(--bg-surface-2)", color: "var(--fg-2)", font: "500 11px/1.5 var(--font-sans)" }}>{type}</span>;

Object.assign(window, {
  AUDIT_RECORDED_SESSIONS, LIVE_SESSIONS, REPORTS, REPORT_CATEGORIES, SCHEDULED_REPORTS, EVIDENCE_BUNDLES,
  RISK, RiskScore, RecordingBadge, SessionTypeBadge,
});
