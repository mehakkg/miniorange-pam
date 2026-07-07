// Credentials seed — realistic vault data
const CREDS = [
  { id: "c-001", display: "prod-db-root",        type: "Password", username: "root", resources: ["prod-db-01"],          owner: "Arjun Bansal",  sensitivity: "Critical", nonViewable: true,  adminAcct: "backup-reconciliation-01", policy: "Prod-Daily-Rotation",        lastRotated: "3 hours ago",  rotation: "healthy",  source: "Manual",     created: "Mar 02, 2026", complete: true, tags: ["production","database","root","rotation-enabled"] },
  { id: "c-002", display: "linux-ssh-admin",     type: "Password", username: "admin", resources: ["ssh-server-linux"],   owner: "Priya Nair",   sensitivity: "High",     nonViewable: true,  adminAcct: "ad-reconciliation",        policy: "SSH-Weekly-Maintenance-Window", lastRotated: "5 days ago",  rotation: "healthy",  source: "Discovery",  created: "Jan 14, 2026", complete: true, tags: ["production","linux"] },
  { id: "c-003", display: "oracle-dba-01",       type: "Password", username: "dba01", resources: ["oracle-reporting"],   owner: "Rohan Mehta",  sensitivity: "Critical", nonViewable: true,  adminAcct: "oracle-recon",             policy: "Prod-Daily-Rotation",        lastRotated: "Failed 2h ago", rotation: "failed",   source: "Manual",     created: "Dec 22, 2025", complete: true, tags: ["production","database","oracle"], failReason: "Authentication rejected — account 'backup-admin' is locked on 10.0.1.89. Unlock the account and retry." },
  { id: "c-004", display: "windows-svc-account", type: "Password", username: "svc.runner", resources: ["build-runner-win01"], owner: "Priya Nair", sensitivity: "High",  nonViewable: false, adminAcct: "ad-reconciliation",        policy: "DB-Post-Use",                 lastRotated: "12 days ago", rotation: "overdue",  source: "AD Scan",    created: "Nov 04, 2025", complete: true, tags: ["staging","windows","service"] },
  { id: "c-005", display: "ssh-key-deploy",      type: "SSH Key",  username: "deploy", resources: ["ssh-server-linux","auth-server-01"], owner: "Arjun Bansal", sensitivity: "High",  nonViewable: true,  adminAcct: null,                       policy: null,                          lastRotated: "Never",        rotation: "no-policy",source: "Manual",     created: "Feb 18, 2026", complete: true, tags: ["ssh","deploy"], fingerprint: "SHA256:Gc3BRK8MaLKNMKRuC8XaGvK3pYzT2+eH4kTfwXv9HWo", keyType: "Private Key", passphrase: true },
  { id: "c-006", display: "ssh-key-jumpbox",     type: "SSH Key",  username: "ec2-user", resources: ["data-warehouse-bastion"], owner: "Rohan Mehta", sensitivity: "Medium", nonViewable: true,  adminAcct: null,                       policy: null,                          lastRotated: "Never",        rotation: "no-policy",source: "Discovery",  created: "Aug 11, 2025", complete: true, tags: ["bastion","ssh"], fingerprint: "SHA256:7vYpQa1FuJxRy4tHKx8gN6ZdK0jM3xWqR4lTrZkP1Vk", keyType: "Private Key", passphrase: false, stale: true },
  { id: "c-007", display: "ssh-key-legacy",      type: "SSH Key",  username: "ubuntu", resources: [], owner: null, sensitivity: "Low", nonViewable: false, adminAcct: null, policy: null, lastRotated: "Never", rotation: "no-policy", source: "Discovery", created: "May 03, 2024", complete: false, tags: [], fingerprint: "SHA256:Hp8VbJ4MoKKrTk2yLs7zPxNdM6jR4mTwHrZkLpQpVk", keyType: "Private Key", passphrase: false, stale: true, orphaned: true },
  { id: "c-008", display: "dev-api-key-stripe",  type: "App Secret", username: "—", resources: ["stripe-webhook-relay"], owner: "Arjun Bansal", sensitivity: "Critical", nonViewable: true, adminAcct: null, policy: "DB-Post-Use", lastRotated: "21 days ago", rotation: "healthy",  source: "Manual", created: "Apr 02, 2026", complete: true, tags: ["payments","api"], secretType: "API Key", application: "Stripe Payments", expiry: "2026-08-15", injection: "Environment Variable" },
  { id: "c-009", display: "oauth-token-zoom",    type: "App Secret", username: "—", resources: [], owner: "Priya Nair", sensitivity: "Medium", nonViewable: true, adminAcct: null, policy: null, lastRotated: "112 days ago", rotation: "overdue", source: "Manual", created: "Nov 19, 2025", complete: true, tags: ["oauth"], secretType: "OAuth Token", application: "Zoom Webhook", expiry: "2026-05-26", injection: "Config File" },
  { id: "c-010", display: "db-conn-warehouse",   type: "App Secret", username: "—", resources: ["audit-readonly-replica"], owner: "Rohan Mehta", sensitivity: "High", nonViewable: false, adminAcct: null, policy: null, lastRotated: "Never", rotation: "no-policy", source: "CSV Import", created: "Apr 28, 2026", complete: false, tags: [], secretType: "DB Connection String", application: "Warehouse ETL", expiry: null, injection: "API Call" },
  { id: "c-011", display: "k8s-cluster-admin",   type: "Password", username: "cluster-admin", resources: ["k8s-control-plane-aws"], owner: "Arjun Bansal", sensitivity: "Critical", nonViewable: true, adminAcct: "k8s-recon", policy: "Prod-Daily-Rotation", lastRotated: "Drifted", rotation: "drifted",  source: "Manual", created: "Feb 02, 2026", complete: true, tags: ["k8s","aws","kubernetes"], driftReason: "Password on k8s-control-plane-aws does not match vault — likely changed by an admin directly on the cluster. Last vault sync: 4 days ago." },
  // Certificate reference — links out to /certificates; PAM stores only the
  // reference. Added so the Certificate link-out is visible in the demo.
  { id: "c-012", display: "web-tls-kestrel-io",  type: "Certificate", username: "—", resources: ["kestrel-admin-portal","stripe-webhook-relay"], owner: "Arjun Bansal", sensitivity: "High", nonViewable: false, adminAcct: null, policy: null, lastRotated: "—", rotation: "no-policy", source: "Manual", created: "Feb 12, 2026", complete: true, tags: ["cert","tls"], certRef: "cert-kestrel-io-2026", certExpiry: "Feb 11, 2027" },
  // Cloud-IAM sub-account — SOURCE=Cloud-IAM for the "Type + Source coincide"
  // case called out in the spec.
  { id: "c-013", display: "aws-iam-devops",      type: "Password", username: "iam-devops", resources: ["k8s-control-plane-aws"], owner: "Priya Nair", sensitivity: "High", nonViewable: true, adminAcct: null, policy: "SSH-Weekly-Maintenance-Window", lastRotated: "12 days ago", rotation: "healthy", source: "Manual", created: "Mar 04, 2026", complete: true, tags: ["cloud","aws","iam"] },
  // AD-linked account — SOURCE=Active Directory so the SOURCE column shows
  // Local OS + AD + Cloud-IAM side by side in the demo.
  { id: "c-014", display: "ad-reconciliation-linked-account", type: "Password", username: "svc.pam.rotate", resources: ["ssh-server-linux"], owner: "Arjun Bansal", sensitivity: "High", nonViewable: true, adminAcct: null, policy: "Prod-Daily-Rotation", lastRotated: "4 days ago", rotation: "healthy", source: "AD Scan", created: "Jan 08, 2026", complete: true, tags: ["ad","reconciliation"] },
];

const RECON_CREDS = [
  { id: "rc-1", display: "backup-reconciliation-01", type: "Non-AD",  username: "backup-admin",  resources: 24, lastUsed: "1 hour ago",   status: "Active" },
  { id: "rc-2", display: "ad-reconciliation",        type: "AD",      username: "svc.pam.rotate", resources: 112, lastUsed: "12 min ago",  status: "Active" },
  { id: "rc-3", display: "oracle-recon",             type: "Database", username: "oracle.rotator", resources: 6,  lastUsed: "Failed 2h ago", status: "Failed" },
  { id: "rc-4", display: "k8s-recon",                type: "Non-AD",  username: "k8s.rotator",   resources: 4,  lastUsed: "Untested",   status: "Untested" },
];

const ROTATION_EVENTS = [
  { ts: "Today 14:08 IST", cred: "prod-db-root",     resource: "prod-db-01",    result: "success", duration: "4.2s", by: "PAM (scheduled)" },
  { ts: "Today 12:34 IST", cred: "linux-ssh-admin",  resource: "ssh-server-linux", result: "success", duration: "3.8s", by: "Arjun Bansal" },
  { ts: "Today 10:20 IST", cred: "oracle-dba-01",    resource: "oracle-reporting", result: "failed", duration: "12.0s", by: "PAM (scheduled)", reason: "Authentication rejected — account 'backup-admin' is locked on 10.0.1.89.", retries: 3, nextRetry: "in 1h" },
  { ts: "Yesterday 22:00",  cred: "prod-db-root",     resource: "prod-db-01",    result: "success", duration: "3.9s", by: "PAM (scheduled)" },
  { ts: "Yesterday 18:42",  cred: "windows-svc-account", resource: "build-runner-win01", result: "skipped", duration: "—", by: "Time window" },
  { ts: "Yesterday 11:14",  cred: "k8s-cluster-admin", resource: "k8s-control-plane-aws", result: "failed",  duration: "8.1s", by: "PAM (scheduled)", reason: "Vault password no longer matches target — drift detected.", retries: 1, nextRetry: "Awaiting reconciliation" },
];

const ROTATION_POLICIES = [
  { id: "rp-1", name: "Prod-Daily-Rotation",        pwdPolicy: "Strict-32-Symbol", type: "Schedule",      interval: "24 hours", window: "02:00 – 04:00 IST", count: 18 },
  { id: "rp-2", name: "DB-Post-Use",                pwdPolicy: "Strong-24",        type: "After Every Use", interval: "—",        window: "—",                count: 6 },
  { id: "rp-3", name: "SSH-Weekly-Maintenance-Window", pwdPolicy: "Strong-24",     type: "Schedule",      interval: "7 days",   window: "Sat 02:00 – 05:00 IST", count: 9 },
  { id: "rp-4", name: "Checkout-Triggered",         pwdPolicy: "Strong-24",        type: "On Checkout",   interval: "—",        window: "—",                count: 3 },
];

Object.assign(window, { CREDS, RECON_CREDS, ROTATION_EVENTS, ROTATION_POLICIES });
