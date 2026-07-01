// People — seed data
const PEOPLE_USERS = [
  { id: "u-001", name: "Priya Sharma",    email: "priya@securecorp.com",   phone: "+91 98201 11234", role: "Operator",       roleType: "operator", groups: ["DevOps Team","Production Access"], source: "AD",     mfa: "enabled",  status: "active",   lastLogin: "2 hours ago",  createdOn: "Jan 14, 2026", login: "SSO",      resources: 12, jobTitle: "DevOps Engineer", profile: { Department: "Engineering" } },
  { id: "u-002", name: "Rohan Mehta",     email: "rohan@securecorp.com",   phone: "+91 99209 88445", role: "Admin",          roleType: "admin",    groups: ["SysAdmins"], source: "Manual", mfa: "pending",  status: "active",   lastLogin: "Yesterday",   createdOn: "Nov 02, 2025", login: "Password", resources: 28, jobTitle: "SysAdmin",        profile: { Department: "Platform Ops" } },
  { id: "u-003", name: "Aditya Kulkarni", email: "aditya@securecorp.com",  phone: "—",               role: "End User",       roleType: "enduser",  groups: ["Dev Team"],           source: "SSO",    mfa: "enabled",  status: "active",   lastLogin: "3 days ago",  createdOn: "Mar 22, 2026", login: "SSO",      resources: 5,  jobTitle: "Backend Developer", profile: { Department: "Engineering" } },
  { id: "u-004", name: "Sarvesh Joshi",   email: "sarvesh@securecorp.com", phone: "+91 98765 22119", role: "End User",       roleType: "enduser",  groups: ["Dev Team","QA"], source: "AD",     mfa: "disabled", status: "inactive", lastLogin: "16 days ago", createdOn: "Sep 18, 2025", login: "SSO",      resources: 3,  jobTitle: "QA Lead",         profile: { Department: "Quality" } },
  { id: "u-005", name: "Arjun Bansal",    email: "arjun@securecorp.com",   phone: "+91 98300 55012", role: "Admin",          roleType: "admin",    groups: ["Security","SysAdmins"], source: "Manual", mfa: "enabled",  status: "active",   lastLogin: "5 min ago",   createdOn: "Apr 02, 2025", login: "Both",     resources: 47, jobTitle: "Security Admin",  profile: { Department: "Security" } },
  { id: "u-006", name: "Mohak Sharma",    email: "mohak@securecorp.com",   phone: "+91 99201 77822", role: "Auditor Admin",  roleType: "auditor",  groups: ["Security"], source: "AD",     mfa: "enabled",  status: "active",   lastLogin: "1 hour ago",   createdOn: "Feb 11, 2026", login: "SSO",      resources: 0,  jobTitle: "IT Ops Lead",     profile: { Department: "Security" } },
  { id: "u-007", name: "Maya Iyer",       email: "maya@securecorp.com",    phone: "+91 90876 11234", role: "Password Admin", roleType: "passadmin",groups: ["DBA"],         source: "Manual", mfa: "pending",  status: "active",   lastLogin: "Never",       createdOn: "May 10, 2026", login: "Password", resources: 4,  jobTitle: "DBA",             profile: { Department: "Engineering" } },
  { id: "u-008", name: "Vivek Rao",       email: "vivek@securecorp.com",   phone: "+91 99220 11334", role: "End User",       roleType: "enduser",  groups: ["Third Party Vendors"], source: "CSV",    mfa: "disabled", status: "locked",   lastLogin: "30 days ago", createdOn: "Dec 14, 2025", login: "Password", resources: 1,  jobTitle: "Vendor",          profile: { Department: "External" } },
];

const PEOPLE_GROUPS = [
  { id: "g-001", display: "DevOps Team",        name: "devops-team",      description: "Engineers managing infra and deploy", source: "AD",     members: 8,  resources: 5,  role: "Operator",  created: "Jan 10, 2026", modified: "2 days ago" },
  { id: "g-002", display: "Production Access",  name: "production-access",description: "Users allowed in production",          source: "Manual", members: 3,  resources: 12, role: "Admin",     created: "Feb 02, 2026", modified: "1 day ago" },
  { id: "g-003", display: "Dev Team",           name: "dev-team",         description: "Engineering — non-production resources",source: "AD",    members: 14, resources: 3,  role: "End User",  created: "Aug 12, 2025", modified: "5 days ago" },
  { id: "g-004", display: "Third Party Vendors",name: "third-party",      description: "External contractors",                  source: "Manual", members: 2,  resources: 1,  role: null,        created: "Apr 18, 2026", modified: "1 week ago" },
  { id: "g-005", display: "SysAdmins",          name: "sysadmins",        description: "System administrators",                  source: "Manual", members: 4,  resources: 18, role: "Admin",     created: "Apr 02, 2025", modified: "2 weeks ago" },
  { id: "g-006", display: "Security",           name: "security",         description: "Security operations team",               source: "AD",     members: 5,  resources: 22, role: "Auditor Admin", created: "Apr 02, 2025", modified: "1 month ago" },
  { id: "g-007", display: "QA",                 name: "qa",               description: "Quality assurance — test envs only",    source: "AD",     members: 6,  resources: 4,  role: "End User",  created: "Jul 22, 2025", modified: "1 month ago" },
  { id: "g-008", display: "DBA",                name: "dba",              description: "Database administrators",                source: "Manual", members: 2,  resources: 9,  role: "Password Admin", created: "Mar 14, 2026", modified: "3 days ago" },
];

const SYSTEM_ROLES = [
  { id: "r-admin",     name: "admin",      display: "Admin",          users: 2, desc: "Full admin access — manages everything", system: true,
    caps: { resources: ["view-all","add-edit","delete","allocate","test"], credentials: ["view","add-edit","delete","rotate","details","configure"], policies: ["view","create","delete"], tickets: ["view","approve","create","revoke","configure"], sessions: ["view","terminate","recordings","download"], people: ["view","add-edit","delete","groups","roles"], discovery: ["view","run","onboard"], certificates: ["view","manage","delete"], reports: ["view","export","schedule"], settings: ["view","edit","vault","siem","api"], endpoint: ["view","apps","devices"] } },
  { id: "r-operator", name: "operator",   display: "Operator",       users: 8, desc: "Manage resources and credentials, no system settings", system: true,
    caps: { resources: ["view-all","add-edit","allocate","test"], credentials: ["view","add-edit","rotate","details","configure"], policies: ["view","create"], tickets: ["view","create"], sessions: ["view","recordings"], people: ["view"], discovery: ["view","run","onboard"], certificates: ["view"], reports: ["view","export"], settings: [], endpoint: ["view"] } },
  { id: "r-auditor",  name: "auditor",    display: "Auditor Admin",  users: 3, desc: "Read-only access to sessions, reports, audit trails", system: true,
    caps: { resources: ["view-all"], credentials: ["view","details"], policies: ["view"], tickets: ["view"], sessions: ["view","recordings","download"], people: ["view"], discovery: ["view"], certificates: ["view"], reports: ["view","export","schedule"], settings: ["view"], endpoint: ["view"] } },
  { id: "r-passadmin",name: "password-admin", display: "Password Admin", users: 2, desc: "Manage credential rotation policies only", system: true,
    caps: { credentials: ["view","add-edit","rotate","details","configure"], policies: ["view","create"], reports: ["view"] } },
  { id: "r-enduser",  name: "end-user",   display: "End User",       users: 36, desc: "View allocated resources and raise access tickets", system: true,
    caps: { resources: ["view-my"], credentials: ["details"], tickets: ["view","create"], sessions: ["view"] } },
];

const CUSTOM_ROLES = [
  { id: "r-dbro",    name: "dba-readonly",      display: "DB Read-Only Admin", users: 3, desc: "Database access without write permissions", system: false,
    caps: { resources: ["view-all"], credentials: ["view","details"], sessions: ["view"], reports: ["view"] } },
  { id: "r-l1",      name: "l1-support",        display: "L1 Support",         users: 7, desc: "View sessions and raise tickets only",     system: false,
    caps: { resources: ["view-my"], tickets: ["view","create"], sessions: ["view"] } },
];

const SYNC_ERRORS = [
  { id: "se-1", who: "Priya Sharma",        kind: "Role mapping failed", ts: "Today 09:42 IST", desc: "AD group 'db-admins' is not mapped to any PAM role.", affected: ["AD attribute: memberOf=CN=db-admins,OU=Security"], action: "role-pick" },
  { id: "se-2", who: "admin@securecorp.com", kind: "Duplicate email",    ts: "Today 09:42 IST", desc: "An account with this email already exists in PAM (Arjun Bansal).", affected: ["email = admin@securecorp.com", "Existing user: u-005"], action: "merge" },
  { id: "se-3", who: "User CN=svc.test-04", kind: "Missing attribute",   ts: "Today 09:41 IST", desc: "User has no displayName in AD — required to create a PAM record.", affected: ["givenName: (empty)", "sn: (empty)", "displayName: (empty)"], action: "set-attr" },
  { id: "se-4", who: "AD sync service",     kind: "Permission issue",    ts: "Today 09:40 IST", desc: "The PAM service account does not have read access to OU=Contractors.", affected: ["Service account: svc-pam@securecorp.local"], action: "perm" },
];

const PROFILE_FIELDS = [
  { id: "pf-1", label: "Country",         type: "Text",     defaultVal: "—",          onAdd: false, onProfile: true,  required: false },
  { id: "pf-2", label: "Department",      type: "Dropdown", defaultVal: "Engineering", onAdd: true,  onProfile: true,  required: true,  options: ["Engineering","Platform Ops","Security","Quality","External"] },
  { id: "pf-3", label: "Employee ID",     type: "Text",     defaultVal: "—",          onAdd: true,  onProfile: true,  required: true },
  { id: "pf-4", label: "Hire date",       type: "Date",     defaultVal: "—",          onAdd: false, onProfile: true,  required: false },
  { id: "pf-5", label: "Cost centre",     type: "Number",   defaultVal: "—",          onAdd: false, onProfile: true,  required: false },
  { id: "pf-6", label: "On-call rotation",type: "Toggle",   defaultVal: "Off",        onAdd: true,  onProfile: true,  required: false },
];

Object.assign(window, { PEOPLE_USERS, PEOPLE_GROUPS, SYSTEM_ROLES, CUSTOM_ROLES, SYNC_ERRORS, PROFILE_FIELDS });
