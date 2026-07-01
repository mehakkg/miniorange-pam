// Seed data for miniOrange PAM — realistic enterprise sample data

const SEED_RESOURCES = [
  { id: "RES-2841", name: "prod-db-primary",       host: "10.42.18.7",     type: "database", os: "PostgreSQL 15", env: "production",  criticality: "critical", credCount: 3, sessions: 2, status: "healthy",    rotation: "30d",  tags: ["fintech","pci-dss"] },
  { id: "RES-2840", name: "auth-server-01",        host: "auth01.kestrel.internal",  type: "linux",    os: "Ubuntu 22.04",  env: "production",  criticality: "critical", credCount: 2, sessions: 1, status: "healthy",    rotation: "14d",  tags: ["sso","critical-path"] },
  { id: "RES-2839", name: "ledger-mongo-cluster",  host: "10.42.18.22",    type: "database", os: "MongoDB 7.0",   env: "production",  criticality: "high",     credCount: 4, sessions: 0, status: "rotation-failed", rotation: "30d",  tags: ["ledger"] },
  { id: "RES-2838", name: "kestrel-admin-portal",  host: "admin.kestrel.io",        type: "web",      os: "—",             env: "production",  criticality: "high",     credCount: 1, sessions: 0, status: "healthy",    rotation: "60d",  tags: ["admin"] },
  { id: "RES-2837", name: "data-warehouse-bastion",host: "bastion.kestrel.internal",type: "linux",    os: "Amazon Linux 2",env: "production",  criticality: "high",     credCount: 2, sessions: 4, status: "healthy",    rotation: "14d",  tags: ["bastion"] },
  { id: "RES-2836", name: "build-runner-win01",    host: "10.42.51.4",     type: "windows",  os: "Server 2022",   env: "staging",     criticality: "medium",   credCount: 1, sessions: 0, status: "healthy",    rotation: "60d",  tags: ["ci"] },
  { id: "RES-2835", name: "stripe-webhook-relay",  host: "webhooks.kestrel.io",     type: "web",      os: "—",             env: "production",  criticality: "high",     credCount: 1, sessions: 0, status: "stale-cred", rotation: "—",    tags: ["payments"] },
  { id: "RES-2834", name: "audit-readonly-replica",host: "10.42.18.9",     type: "database", os: "PostgreSQL 15", env: "production",  criticality: "medium",   credCount: 2, sessions: 0, status: "healthy",    rotation: "90d",  tags: ["audit"] },
  { id: "RES-2833", name: "redis-session-cache",   host: "10.42.18.31",    type: "database", os: "Redis 7",       env: "production",  criticality: "medium",   credCount: 1, sessions: 0, status: "healthy",    rotation: "60d",  tags: ["cache"] },
  { id: "RES-2832", name: "k8s-control-plane-aws", host: "eks.us-east-1",  type: "cloud",    os: "EKS 1.29",      env: "production",  criticality: "critical", credCount: 5, sessions: 1, status: "healthy",    rotation: "14d",  tags: ["k8s","aws"] },
  { id: "RES-2831", name: "dev-jumpbox",           host: "10.42.99.1",     type: "linux",    os: "Ubuntu 22.04",  env: "development", criticality: "low",      credCount: 1, sessions: 0, status: "healthy",    rotation: "—",    tags: [] },
  { id: "RES-2830", name: "vendor-portal-grafana", host: "grafana.kestrel.io",      type: "web",      os: "—",             env: "production",  criticality: "low",      credCount: 1, sessions: 0, status: "healthy",    rotation: "—",    tags: [] },
];

const SEED_CREDENTIALS = [
  { id: "CRED-018", display: "postgres-prod-su",    type: "Password",  resource: "prod-db-primary",        username: "postgres",   lastRotated: "12 days ago",  rotation: "30d", strength: "strong",    used: 47 },
  { id: "CRED-017", display: "auth01-root",         type: "SSH key",   resource: "auth-server-01",         username: "root",       lastRotated: "5 days ago",   rotation: "14d", strength: "strong",    used: 22 },
  { id: "CRED-016", display: "ledger-mongo-admin",  type: "Password",  resource: "ledger-mongo-cluster",   username: "mongoadmin",  lastRotated: "Failed 2h ago",rotation: "30d", strength: "—",         used: 12, error: true },
  { id: "CRED-015", display: "k8s-cluster-admin",   type: "Token",     resource: "k8s-control-plane-aws",  username: "cluster-admin",lastRotated: "3 days ago",  rotation: "14d", strength: "strong",    used: 89 },
  { id: "CRED-014", display: "bastion-jumpkey",     type: "SSH key",   resource: "data-warehouse-bastion", username: "ec2-user",   lastRotated: "8 days ago",   rotation: "14d", strength: "strong",    used: 134 },
  { id: "CRED-013", display: "kestrel-admin-svc",   type: "Password",  resource: "kestrel-admin-portal",   username: "svc-admin",  lastRotated: "47 days ago",  rotation: "60d", strength: "moderate",  used: 6 },
  { id: "CRED-012", display: "stripe-webhook-key",  type: "API key",   resource: "stripe-webhook-relay",   username: "—",          lastRotated: "112 days ago", rotation: "—",   strength: "stale",     used: 0, error: true },
  { id: "CRED-011", display: "win01-administrator", type: "Password",  resource: "build-runner-win01",     username: "Administrator",lastRotated: "21 days ago", rotation: "60d", strength: "strong",    used: 3 },
];

const SEED_PEOPLE = [
  { id: "USR-009", name: "Priya Iyer",      email: "priya.iyer@kestrel.io",     role: "Security Admin", groups: ["sec-admins","on-call"], status: "active",  mfa: true, lastLogin: "2 min ago" },
  { id: "USR-008", name: "Marcus Chen",     email: "marcus.chen@kestrel.io",    role: "Operator",       groups: ["devops","on-call"],     status: "active",  mfa: true, lastLogin: "14 min ago" },
  { id: "USR-007", name: "Aisha Rahman",    email: "aisha.rahman@kestrel.io",   role: "Auditor",        groups: ["compliance"],            status: "active",  mfa: true, lastLogin: "1 h ago" },
  { id: "USR-006", name: "Diego Vasquez",   email: "diego.vasquez@kestrel.io",  role: "Operator",       groups: ["devops"],                status: "active",  mfa: true, lastLogin: "Yesterday" },
  { id: "USR-005", name: "Sara Lindgren",   email: "sara.lindgren@kestrel.io",  role: "Limited Access", groups: ["contractors"],           status: "active",  mfa: false,lastLogin: "3 days ago" },
  { id: "USR-004", name: "Hiroshi Tanaka",  email: "hiroshi.tanaka@kestrel.io", role: "Security Admin", groups: ["sec-admins"],            status: "active",  mfa: true, lastLogin: "Yesterday" },
  { id: "USR-003", name: "Olivia Brookes",  email: "olivia.brookes@kestrel.io", role: "Operator",       groups: ["devops"],                status: "active",  mfa: true, lastLogin: "12 min ago" },
  { id: "USR-002", name: "Noah Eriksen",    email: "noah.eriksen@kestrel.io",   role: "Limited Access", groups: ["contractors"],           status: "suspended",mfa: false,lastLogin: "16 days ago" },
];

const SEED_GROUPS = [
  { id: "GRP-006", name: "sec-admins",   members: 4, role: "Security Admin", source: "AD: kestrel.local" },
  { id: "GRP-005", name: "devops",       members: 12, role: "Operator",      source: "AD: kestrel.local" },
  { id: "GRP-004", name: "compliance",   members: 3, role: "Auditor",        source: "AD: kestrel.local" },
  { id: "GRP-003", name: "on-call",      members: 6, role: "Operator",       source: "Local" },
  { id: "GRP-002", name: "contractors",  members: 8, role: "Limited Access", source: "AD: kestrel.local" },
  { id: "GRP-001", name: "fintech-pci",  members: 5, role: "Operator",       source: "Local" },
];

const SEED_POLICIES = [
  { id: "POL-SSH-001", name: "Production SSH Access",     type: "SSH",      scope: "12 resources", recording: true,  command: "Allowed",  jit: true,  approval: "2-step",   updated: "Apr 28" },
  { id: "POL-SFT-002", name: "Developer SFTP Access",     type: "SFTP",     scope: "4 resources",  recording: true,  command: "—",        jit: false, approval: "—",        updated: "Apr 26" },
  { id: "POL-SSH-003", name: "Linux Server Admin",        type: "SSH",      scope: "8 resources",  recording: true,  command: "Allowed",  jit: true,  approval: "1-step",   updated: "Apr 22" },
  { id: "POL-SMB-001", name: "File Share Access",         type: "SMB",      scope: "3 resources",  recording: false, command: "—",        jit: false, approval: "—",        updated: "Apr 20" },
  { id: "POL-DB-002",  name: "Production Database",       type: "Database", scope: "5 resources",  recording: true,  command: "Allowed",  jit: true,  approval: "2-step",   updated: "Apr 19" },
  { id: "POL-RDP-001", name: "Windows RDP Operators",     type: "RDP",      scope: "6 resources",  recording: true,  command: "—",        jit: false, approval: "—",        updated: "Apr 18" },
  { id: "POL-SSH-004", name: "Emergency SSH Override",    type: "SSH",      scope: "2 resources",  recording: true,  command: "Blocked",  jit: false, approval: "Break-glass", updated: "Apr 12" },
  { id: "POL-WEB-001", name: "Admin Portal Web Apps",     type: "Web",      scope: "4 resources",  recording: true,  command: "—",        jit: true,  approval: "1-step",   updated: "Apr 09" },
];

const SEED_TICKETS = [
  { id: "TKT-2104", type: "JIT request",      requester: "Marcus Chen",   resource: "prod-db-primary",        duration: "2h",  reason: "Hotfix: customer ledger sync stuck on 2 accounts",          status: "pending",   priority: "high",   sla: "23 min",  flagged: false, ts: "12:48" },
  { id: "TKT-2103", type: "JIT request",      requester: "Diego Vasquez", resource: "auth-server-01",         duration: "1h",  reason: "Investigating 5xx spike on /oauth/token",                   status: "pending",   priority: "critical", sla: "8 min", flagged: true,  ts: "12:41" },
  { id: "TKT-2102", type: "Break-glass",      requester: "Priya Iyer",    resource: "ledger-mongo-cluster",   duration: "4h",  reason: "P0 incident — replica lag >120s, customer impact ongoing",  status: "approved",  priority: "critical", sla: "—",     flagged: false, ts: "11:58" },
  { id: "TKT-2101", type: "Access request",   requester: "Sara Lindgren", resource: "dev-jumpbox",            duration: "8h",  reason: "Vendor onboarding — staging env review",                    status: "pending",   priority: "low",    sla: "1 d",     flagged: false, ts: "10:22" },
  { id: "TKT-2100", type: "JIT request",      requester: "Olivia Brookes",resource: "k8s-control-plane-aws",  duration: "3h",  reason: "Drain node ip-10-42-51-4 for kernel patch",                 status: "approved",  priority: "medium", sla: "—",       flagged: false, ts: "09:51" },
  { id: "TKT-2099", type: "Access request",   requester: "Noah Eriksen",  resource: "audit-readonly-replica", duration: "1d",  reason: "Quarterly audit data export",                                status: "denied",    priority: "low",    sla: "—",       flagged: false, ts: "Yesterday" },
  { id: "TKT-2098", type: "JIT request",      requester: "Hiroshi Tanaka",resource: "kestrel-admin-portal",   duration: "30m", reason: "Disable feature flag for compliance freeze",                status: "approved",  priority: "high",   sla: "—",       flagged: false, ts: "Yesterday" },
];

const SEED_DISCOVERY = [
  { id: "DSC-091", host: "10.42.18.45",     hostname: "ledger-replica-2", type: "linux",    accounts: 4, criticality: 92, flags: ["root-key","privileged"], scanned: "2 min ago" },
  { id: "DSC-090", host: "10.42.18.46",     hostname: "ledger-replica-3", type: "linux",    accounts: 3, criticality: 88, flags: ["root-key","privileged"], scanned: "2 min ago" },
  { id: "DSC-089", host: "10.42.51.12",     hostname: "build-runner-3",   type: "windows",  accounts: 2, criticality: 64, flags: ["local-admin"],            scanned: "2 min ago" },
  { id: "DSC-088", host: "10.42.18.31",     hostname: "redis-replica-1",  type: "database", accounts: 1, criticality: 71, flags: ["unauth-bind"],            scanned: "2 min ago" },
  { id: "DSC-087", host: "10.42.99.8",      hostname: "dev-utility-01",   type: "linux",    accounts: 6, criticality: 41, flags: ["orphan"],                 scanned: "5 min ago" },
  { id: "DSC-086", host: "10.42.51.18",     hostname: "win-test-02",      type: "windows",  accounts: 3, criticality: 38, flags: [],                          scanned: "5 min ago" },
];

const SEED_SESSIONS = [
  { id: "SES-44218", user: "Marcus Chen",  resource: "auth-server-01",         protocol: "SSH",  duration: "00:14:22", status: "active",   recording: true, started: "12:46" },
  { id: "SES-44217", user: "Diego Vasquez",resource: "data-warehouse-bastion", protocol: "SSH",  duration: "00:08:51", status: "active",   recording: true, started: "12:52" },
  { id: "SES-44216", user: "Priya Iyer",   resource: "ledger-mongo-cluster",   protocol: "DB",   duration: "01:02:18", status: "active",   recording: true, started: "11:58", flagged: "break-glass" },
  { id: "SES-44215", user: "Olivia Brookes",resource:"k8s-control-plane-aws",  protocol: "API",  duration: "00:21:09", status: "active",   recording: true, started: "12:39" },
  { id: "SES-44214", user: "Hiroshi Tanaka",resource:"kestrel-admin-portal",   protocol: "Web",  duration: "00:18:32", status: "ended",    recording: true, started: "12:25" },
  { id: "SES-44213", user: "Marcus Chen",  resource: "prod-db-primary",        protocol: "DB",   duration: "00:42:11", status: "ended",    recording: true, started: "11:12" },
  { id: "SES-44212", user: "Aisha Rahman", resource: "audit-readonly-replica", protocol: "DB",   duration: "00:08:00", status: "ended",    recording: true, started: "10:48" },
];

Object.assign(window, {
  SEED_RESOURCES, SEED_CREDENTIALS, SEED_PEOPLE, SEED_GROUPS,
  SEED_POLICIES, SEED_TICKETS, SEED_DISCOVERY, SEED_SESSIONS,
});
