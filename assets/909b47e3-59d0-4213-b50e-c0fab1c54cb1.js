// Policies V2 — seed data & shared primitives

const POL_TYPES = {
  SSH:      { label: "SSH/SFTP",         icon: "server",    desc: "Shell access policies for Linux/Unix servers" },
  RDP:      { label: "RDP/VNC",          icon: "desktop",   desc: "Desktop access policies for Windows / remote desktop" },
  Web:      { label: "Web Application",  icon: "globe",     desc: "Browser-based access policies for SaaS and internal web tools" },
  Database: { label: "Database",         icon: "database",  desc: "Direct database access policies — query restrictions, recording" },
  Password: { label: "Password Rotation",icon: "key",       desc: "Automated credential rotation rules" },
};

const POLICIES_V2 = [
  { id: "pol-1", name: "Production SSH — Strict", type: "SSH", description: "Strict policy for all production Linux servers — recording always on, MFA required, 15-min timeout.", status: "Active",
    settings: { recording: "on", mfa: true, sessionTimeout: 15, idleTimeout: 10, clipboard: false, fileTransfer: false, concurrent: 1, sources: ["10.0.0.0/8","192.168.0.0/16"], timeWindow: "always" },
    commands: ["rm -rf /","shutdown -h now","dd if=/dev/zero","mkfs.*","userdel root"],
    resources: ["prod-db-primary","auth-server-01","data-warehouse-bastion","stripe-webhook-relay","k8s-control-plane-aws","audit-readonly-replica","ledger-mongo-cluster","redis-session-cache"],
    versions: [
      { v: 5, ts: "Apr 28, 2026", by: "Arjun Bansal", note: "Changed idle timeout from 15 to 10 minutes", current: true },
      { v: 4, ts: "Mar 14, 2026", by: "Arjun Bansal", note: "Added 'userdel root' to blocked commands" },
      { v: 3, ts: "Feb 02, 2026", by: "Priya Sharma", note: "Tightened source IP restrictions" },
      { v: 2, ts: "Jan 18, 2026", by: "Arjun Bansal", note: "Enabled recording" },
      { v: 1, ts: "Jan 03, 2026", by: "Arjun Bansal", note: "Created from template 'Production Linux — Strict'" },
    ],
    createdOn: "Jan 03, 2026", createdBy: "Arjun Bansal", modifiedOn: "Apr 28, 2026", modifiedBy: "Arjun Bansal", activeSessions: 4 },

  { id: "pol-2", name: "Linux Server Admin", type: "SSH", description: "Standard SSH access for engineering team.", status: "Active",
    settings: { recording: "on", mfa: true, sessionTimeout: 30, idleTimeout: 15, clipboard: true, fileTransfer: true, concurrent: 2, sources: [], timeWindow: "business" },
    commands: ["rm -rf /","shutdown -h now"], resources: ["dev-jumpbox","build-runner-win01"],
    versions: [{ v: 2, ts: "Apr 22, 2026", by: "Priya Sharma", note: "Updated timeout", current: true }, { v: 1, ts: "Mar 14, 2026", by: "Priya Sharma", note: "Created" }],
    createdOn: "Mar 14, 2026", createdBy: "Priya Sharma", modifiedOn: "Apr 22, 2026", modifiedBy: "Priya Sharma", activeSessions: 0 },

  { id: "pol-3", name: "Windows RDP Operators", type: "RDP", description: "RDP for ops team — recording mandatory, clipboard disabled.", status: "Active",
    settings: { recording: "on", mfa: true, sessionTimeout: 60, idleTimeout: 20, clipboard: false, fileTransfer: false, concurrent: 1, sources: [], timeWindow: "always", recordingQuality: "Medium", audio: false, printer: false, usb: false },
    commands: [], resources: ["build-runner-win01"],
    versions: [{ v: 1, ts: "Apr 18, 2026", by: "Rohan Mehta", note: "Created", current: true }],
    createdOn: "Apr 18, 2026", createdBy: "Rohan Mehta", modifiedOn: "Apr 18, 2026", modifiedBy: "Rohan Mehta", activeSessions: 0 },

  { id: "pol-4", name: "Admin Portal Web Apps", type: "Web", description: "Admin web tools — recording on, no downloads.", status: "Active",
    settings: { recording: "on", mfa: true, urlAllow: ["admin.kestrel.io"], urlBlock: [], formAutofill: true, downloads: false, uploads: false },
    commands: [], resources: ["kestrel-admin-portal","stripe-webhook-relay","grafana-internal","vendor-portal-grafana"],
    versions: [{ v: 1, ts: "Apr 09, 2026", by: "Arjun Bansal", note: "Created", current: true }],
    createdOn: "Apr 09, 2026", createdBy: "Arjun Bansal", modifiedOn: "Apr 09, 2026", modifiedBy: "Arjun Bansal", activeSessions: 0 },

  { id: "pol-5", name: "Production Database — Strict", type: "Database", description: "Query restrictions and approval for destructive operations.", status: "Active",
    settings: { recording: "on", mfa: true, queryApproval: { SELECT: false, INSERT: false, UPDATE: true, DELETE: true, DROP: true }, rowLimit: 10000, dataExport: false, schemas: ["public","app","ledger"] },
    commands: [], resources: ["prod-db-primary","ledger-mongo-cluster","audit-readonly-replica","redis-session-cache","oracle-reporting"],
    versions: [{ v: 3, ts: "Apr 19, 2026", by: "Arjun Bansal", note: "Added 'DROP' to approval-required", current: true }, { v: 2, ts: "Feb 22, 2026", by: "Arjun Bansal", note: "Lowered row limit to 10000" }, { v: 1, ts: "Jan 12, 2026", by: "Arjun Bansal", note: "Created" }],
    createdOn: "Jan 12, 2026", createdBy: "Arjun Bansal", modifiedOn: "Apr 19, 2026", modifiedBy: "Arjun Bansal", activeSessions: 0 },

  { id: "pol-6", name: "Prod-Daily-Rotation", type: "Password", description: "Daily rotation for production credentials.", status: "Active",
    settings: { interval: 1, intervalUnit: "days", windowFrom: "02:00", windowTo: "04:00", weekdays: ["Mon","Tue","Wed","Thu","Fri"], skipActive: true, validate: true, retries: 3, notifyOnFail: true },
    commands: [], resources: ["prod-db-primary","auth-server-01","k8s-control-plane-aws","ledger-mongo-cluster","oracle-reporting","data-warehouse-bastion","redis-session-cache","auth01-root"],
    versions: [{ v: 1, ts: "Jan 03, 2026", by: "Arjun Bansal", note: "Created", current: true }],
    createdOn: "Jan 03, 2026", createdBy: "Arjun Bansal", modifiedOn: "Jan 03, 2026", modifiedBy: "Arjun Bansal", activeSessions: 0 },

  { id: "pol-7", name: "Emergency SSH Override", type: "SSH", description: "Break-glass policy — used only with approval.", status: "Draft",
    settings: { recording: "on", mfa: true, sessionTimeout: 240, idleTimeout: 30, clipboard: false, fileTransfer: false, concurrent: 1, sources: [], timeWindow: "always" },
    commands: [], resources: [],
    versions: [{ v: 1, ts: "Apr 12, 2026", by: "Arjun Bansal", note: "Created", current: true }],
    createdOn: "Apr 12, 2026", createdBy: "Arjun Bansal", modifiedOn: "Apr 12, 2026", modifiedBy: "Arjun Bansal", activeSessions: 0 },

  { id: "pol-8", name: "Developer SFTP Access", type: "SSH", description: "Read-only SFTP for engineering.", status: "Active",
    settings: { recording: "on", mfa: false, sessionTimeout: 30, idleTimeout: 15, clipboard: false, fileTransfer: true, concurrent: 1, sources: [], timeWindow: "business" },
    commands: ["rm","mv","chmod"], resources: ["dev-jumpbox","build-runner-win01","stage-jumpbox","audit-readonly-replica"],
    versions: [{ v: 1, ts: "Apr 26, 2026", by: "Priya Sharma", note: "Created", current: true }],
    createdOn: "Apr 26, 2026", createdBy: "Priya Sharma", modifiedOn: "Apr 26, 2026", modifiedBy: "Priya Sharma", activeSessions: 0 },
];

const POL_TEMPLATES = [
  { id: "tpl-ssh-strict",  name: "Production — Strict",        type: "SSH",      desc: "Recording on, MFA required, 15-min timeout, root commands blocked",
    preview: { recording: "on", mfa: true, sessionTimeout: 15, blocked: 12 } },
  { id: "tpl-ssh-std",     name: "Production — Standard",      type: "SSH",      desc: "Recording on, MFA required, 30-min timeout",
    preview: { recording: "on", mfa: true, sessionTimeout: 30, blocked: 4 } },
  { id: "tpl-ssh-dev",     name: "Development — Open",         type: "SSH",      desc: "Recording optional, no command restrictions",
    preview: { recording: "off", mfa: false, sessionTimeout: 60, blocked: 0 } },
  { id: "tpl-rdp-strict",  name: "Production Windows — Strict",type: "RDP",      desc: "Recording on, clipboard / printer / USB disabled",
    preview: { recording: "on", mfa: true, sessionTimeout: 30, blocked: 0 } },
  { id: "tpl-rdp-std",     name: "Internal — Standard",        type: "RDP",      desc: "Recording on, MFA required, clipboard allowed",
    preview: { recording: "on", mfa: true, sessionTimeout: 60, blocked: 0 } },
  { id: "tpl-web-strict",  name: "Admin Panel — Strict",       type: "Web",      desc: "Recording on, no downloads/uploads, URL allow-list enforced",
    preview: { recording: "on", mfa: true, downloads: false } },
  { id: "tpl-web-saas",    name: "SaaS Read-Only",             type: "Web",      desc: "Recording on, MFA required, downloads disabled",
    preview: { recording: "on", mfa: true, downloads: false } },
  { id: "tpl-db-ro",       name: "Production DB — Read Only",  type: "Database", desc: "SELECT only, query log on, no exports",
    preview: { recording: "on", mfa: true, queries: "SELECT only" } },
  { id: "tpl-db-dba",      name: "Production DB — DBA Full",   type: "Database", desc: "All operations, approval required for DROP",
    preview: { recording: "on", mfa: true, queries: "All + approval" } },
  { id: "tpl-pwd-30",      name: "30-day rotation",            type: "Password", desc: "Rotates every 30 days, validates after rotation",
    preview: { interval: "30 days" } },
  { id: "tpl-pwd-q",       name: "Quarterly + maintenance window",type: "Password", desc: "Quarterly rotation within maintenance window",
    preview: { interval: "90 days" } },
];

const RECORDING_GLOBAL = {
  defaultRecording: true,
  defaultRetention: 90,
  storageLocation: "PAM Cloud",
  storageUsed: 847, storageMax: 2048,
  allowDownload: false,
  watermark: true,
  requireJustification: true,
  allowLive: true,
  requireApproval: true,
  notifyUser: true,
};

const POL_TYPE_BADGE = ({ type }) => {
  const m = {
    SSH:      { fg: "var(--brand-fg)",   bg: "var(--brand-soft)" },
    RDP:      { fg: "var(--success-fg)", bg: "var(--success-soft)" },
    Web:      { fg: "var(--fg-2)",       bg: "var(--bg-surface-2)" },
    Database: { fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
    Password: { fg: "var(--fg-2)",       bg: "var(--bg-surface-2)" },
  }[type] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}><Icon name={POL_TYPES[type]?.icon} size={11}/>{POL_TYPES[type]?.label || type}</span>;
};

const POL_STATUS_BADGE = ({ status }) => {
  const m = {
    Active:   { fg: "var(--success-fg)", bg: "var(--success-soft)" },
    Draft:    { fg: "var(--warning-fg)", bg: "var(--warning-soft)" },
    Archived: { fg: "var(--fg-3)",       bg: "var(--bg-surface-2)" },
  }[status] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{status}</span>;
};

Object.assign(window, { POL_TYPES, POLICIES_V2, POL_TEMPLATES, RECORDING_GLOBAL, POL_TYPE_BADGE, POL_STATUS_BADGE });
