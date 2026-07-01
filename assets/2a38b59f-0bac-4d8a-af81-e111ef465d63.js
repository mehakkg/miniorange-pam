// Endpoint Security sub-portal — Dashboard, App Management, Policy Management, Endpoint Manager, Audits, Tickets

const ENDPOINT_NAV = [
  { id: "ep-dashboard", icon: "dashboard", label: "Dashboard" },
  { id: "ep-apps",      icon: "package",   label: "App management" },
  { id: "ep-policies",  icon: "policies",  label: "Policy management" },
  { id: "ep-devices",   icon: "endpoint",  label: "Endpoint manager" },
  { id: "ep-audits",    icon: "file-text", label: "Audits" },
  { id: "ep-tickets",   icon: "tickets",   label: "Tickets" },
];

const EndpointSidebar = ({ active, onNav, collapsed }) => (
  <aside style={{
    width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
    background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", flex: "none",
    transition: "width 180ms ease", overflow: "hidden",
  }}>
    <div style={{
      height: "var(--topbar-h)", padding: collapsed ? "0" : "0 16px",
      display: "flex", alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: "1px solid var(--border)", gap: 8,
    }}>
      {collapsed ? <BrandMark size={24}/> : <>
        <Logo size={22}/>
        <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-3)", padding: "3px 7px", border: "1px solid var(--border)", borderRadius: 4, marginLeft: 4 }}>Endpoint</span>
      </>}
    </div>
    <div style={{ flex: 1, padding: "10px 8px" }}>
      {!collapsed && <div style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "12px 10px 6px" }}>Endpoint security</div>}
      {ENDPOINT_NAV.map(it => {
        const isActive = active === it.id;
        return (
          <div key={it.id} onClick={() => onNav(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            margin: "1px 0", borderRadius: 6,
            background: isActive ? "var(--brand-soft)" : "transparent",
            color: isActive ? "var(--brand-fg)" : "var(--fg-2)",
            cursor: "pointer", font: "500 13px/1 var(--font-sans)",
          }}>
            <Icon name={it.icon} size={16}/>
            {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{it.label}</span>}
          </div>
        );
      })}
    </div>
  </aside>
);

const EP_DEVICES = [
  { id: "ep1", name: "DESKTOP-ARIA-01",   user: "Aria Chen",      os: "Windows 11 Pro", agent: "v2.4.1", status: "healthy",  lastSeen: "2 min ago" },
  { id: "ep2", name: "MBP-MARCUS-002",    user: "Marcus Chen",    os: "macOS 14.4",     agent: "v2.4.1", status: "healthy",  lastSeen: "12 min ago" },
  { id: "ep3", name: "WS-DEVOPS-PRIYA",   user: "Priya Iyer",     os: "Ubuntu 22.04",   agent: "v2.3.8", status: "outdated", lastSeen: "1h ago" },
  { id: "ep4", name: "DESKTOP-OLIVIA",    user: "Olivia Brookes", os: "Windows 11 Pro", agent: "v2.4.1", status: "healthy",  lastSeen: "5 min ago" },
  { id: "ep5", name: "MBP-DIEGO-014",     user: "Diego Vasquez",  os: "macOS 14.3",     agent: "—",      status: "offline",  lastSeen: "3 days ago" },
  { id: "ep6", name: "WS-FINANCE-HIRO",   user: "Hiroshi Tanaka", os: "Windows 10 Pro", agent: "v2.4.1", status: "healthy",  lastSeen: "8 min ago" },
];

const EP_APPS = [
  { id: "a1",  name: "PowerShell 7",     publisher: "Microsoft",         signed: true,  group: "Admin tools",    risk: "high"   },
  { id: "a2",  name: "cmd.exe",          publisher: "Microsoft",         signed: true,  group: "System shell",   risk: "high"   },
  { id: "a3",  name: "Chrome",           publisher: "Google LLC",        signed: true,  group: "Browsers",       risk: "low"    },
  { id: "a4",  name: "VS Code",          publisher: "Microsoft",         signed: true,  group: "Dev tools",      risk: "low"    },
  { id: "a5",  name: "pgAdmin 4",        publisher: "pgAdmin Dev Team",  signed: true,  group: "DB clients",     risk: "medium" },
  { id: "a6",  name: "OpenVPN Connect",  publisher: "OpenVPN Inc.",      signed: true,  group: "Network",        risk: "medium" },
  { id: "a7",  name: "WinRAR",           publisher: "RARLAB",            signed: true,  group: "Utilities",      risk: "low"    },
  { id: "a8",  name: "TeamViewer",       publisher: "TeamViewer Germany", signed: true, group: "Remote access",  risk: "high"   },
  { id: "a9",  name: "remote_desk_v2.exe", publisher: "(unknown)",       signed: false, group: "Unclassified",   risk: "high"   },
];

const EP_POLICIES = [
  { id: "p1", name: "Block unsigned binaries",      apps: 1,  groups: 1, devices: 247, mode: "Block",   updated: "2 days ago" },
  { id: "p2", name: "Elevate developer tools",      apps: 12, groups: 2, devices: 38,  mode: "Elevate", updated: "1 week ago" },
  { id: "p3", name: "Audit remote access tools",    apps: 5,  groups: 1, devices: 247, mode: "Audit",   updated: "Yesterday" },
  { id: "p4", name: "Default — Standard user",      apps: 0,  groups: 0, devices: 209, mode: "Default", updated: "3 weeks ago" },
];

const EP_AUDITS = [
  { id: "EA-9821", time: "Today 14:22", user: "Diego Vasquez",  device: "MBP-DIEGO-014",     app: "remote_desk_v2.exe", path: "/Users/diego/Downloads/remote_desk_v2.exe", publisher: "(unknown)", signed: false, response: "blocked",  reason: "Unsigned binary, no policy match" },
  { id: "EA-9820", time: "Today 13:18", user: "Priya Iyer",     device: "WS-DEVOPS-PRIYA",   app: "kubectl",            path: "/usr/local/bin/kubectl",                     publisher: "Linux Foundation", signed: true, response: "elevated", reason: "Approved via Dev tools policy" },
  { id: "EA-9819", time: "Today 11:42", user: "Marcus Chen",    device: "MBP-MARCUS-002",    app: "psql",               path: "/usr/local/bin/psql",                        publisher: "PostgreSQL",       signed: true, response: "allowed",  reason: "DB clients group" },
  { id: "EA-9818", time: "Today 10:11", user: "Aria Chen",      device: "DESKTOP-ARIA-01",   app: "powershell.exe",     path: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe", publisher: "Microsoft", signed: true, response: "elevated", reason: "Admin tools policy + business reason: cred rotation" },
  { id: "EA-9817", time: "Yesterday",   user: "Olivia Brookes", device: "DESKTOP-OLIVIA",    app: "TeamViewer.exe",     path: "C:\\Program Files\\TeamViewer\\TeamViewer.exe", publisher: "TeamViewer Germany", signed: true, response: "audited", reason: "Remote access tools policy" },
  { id: "EA-9816", time: "Yesterday",   user: "Hiroshi Tanaka", device: "WS-FINANCE-HIRO",   app: "winrar.exe",         path: "C:\\Program Files\\WinRAR\\WinRAR.exe",         publisher: "RARLAB",          signed: true, response: "allowed",  reason: "Utilities group" },
];

const EP_TICKETS = [
  { id: "ET-431", user: "Diego Vasquez", device: "MBP-DIEGO-014",   app: "remote_desk_v2.exe", reason: "Vendor support session for failed deployment", status: "pending",  time: "12 min ago" },
  { id: "ET-430", user: "Marcus Chen",   device: "MBP-MARCUS-002",  app: "Wireshark",          reason: "Network debug for prod-db slow queries",        status: "approved", time: "1h ago" },
  { id: "ET-429", user: "Olivia Brookes", device: "DESKTOP-OLIVIA", app: "Process Hacker",     reason: "Investigate suspicious svchost CPU usage",      status: "rejected", time: "Yesterday" },
];

const EndpointDashboard = () => (
  <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
    <PageHeader title="Endpoint security" description="Application control, privilege elevation, and audit across managed devices."
      actions={<><button className="btn"><Icon name="download" size={13}/> Download agent</button><button className="btn btn-primary"><Icon name="plus" size={13}/> New policy</button></>}/>
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="endpoint" label="Managed devices"        value="247" change="6 outdated · 1 offline"/>
        <StatCard icon="package"  label="Apps in catalog"        value="184" change="12 awaiting classification"/>
        <StatCard icon="policies" label="Active policies"        value="4"   change="3 enforce · 1 audit-only"/>
        <StatCard icon="alert-triangle" label="Blocked apps (24h)" value="14" change="3 unsigned · 11 unclassified" tone="warning"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="h-card">Recent endpoint events</span><div style={{ flex: 1 }}/><button className="btn btn-sm btn-ghost">View all</button></div>
          <table className="table">
            <thead><tr><th>Time</th><th>User</th><th>App</th><th>Response</th></tr></thead>
            <tbody>{EP_AUDITS.slice(0, 5).map(a => (
              <tr key={a.id}>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.time}</td>
                <td><div className="row"><Avatar name={a.user} size={20}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.user}</span></div></td>
                <td><span className="t-mono" style={{ color: "var(--fg-2)" }}>{a.app}</span></td>
                <td>
                  {a.response === "blocked"  && <span className="badge badge-danger">Blocked</span>}
                  {a.response === "elevated" && <span className="badge badge-brand">Elevated</span>}
                  {a.response === "allowed"  && <span className="badge badge-success">Allowed</span>}
                  {a.response === "audited"  && <span className="badge">Audited</span>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-header"><span className="h-card">Pending elevation requests</span></div>
          <div>
            {EP_TICKETS.filter(t => t.status === "pending").map(t => (
              <div key={t.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="row" style={{ marginBottom: 6 }}><Avatar name={t.user} size={20}/><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.user}</span><span className="t-tiny" style={{ color: "var(--fg-4)", marginLeft: "auto" }}>{t.time}</span></div>
                <div style={{ fontSize: 12.5, color: "var(--fg-2)" }}>Wants to run <span className="t-mono" style={{ color: "var(--fg-1)" }}>{t.app}</span></div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{t.reason}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button className="btn btn-sm btn-primary">Approve</button>
                  <button className="btn btn-sm">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EndpointAppsScreen = () => {
  const [tab, setTab] = React.useState("apps");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="App management" description="Application catalog and groups used by elevation policies."
        actions={<><button className="btn"><Icon name="upload" size={13}/> Import</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Add app</button></>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        <button onClick={() => setTab("apps")} style={{ padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent", color: tab === "apps" ? "var(--fg-1)" : "var(--fg-3)", font: "500 13px/1 var(--font-sans)", borderBottom: `2px solid ${tab === "apps" ? "var(--brand)" : "transparent"}`, cursor: "pointer" }}>App definitions <span className="badge">{EP_APPS.length}</span></button>
        <button onClick={() => setTab("groups")} style={{ padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent", color: tab === "groups" ? "var(--fg-1)" : "var(--fg-3)", font: "500 13px/1 var(--font-sans)", borderBottom: `2px solid ${tab === "groups" ? "var(--brand)" : "transparent"}`, cursor: "pointer" }}>App groups <span className="badge">8</span></button>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {tab === "apps" ? (
          <table className="table">
            <thead><tr><th>Application</th><th>Publisher</th><th>Signed</th><th>Group</th><th>Risk</th><th></th></tr></thead>
            <tbody>{EP_APPS.map(a => (
              <tr key={a.id}>
                <td><div className="row"><div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-3)" }}><Icon name="package" size={14}/></div><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.name}</span></div></td>
                <td style={{ color: a.publisher === "(unknown)" ? "var(--danger-fg)" : "var(--fg-2)" }}>{a.publisher}</td>
                <td>{a.signed ? <span className="badge badge-success"><Icon name="check" size={10}/> Signed</span> : <span className="badge badge-danger">Unsigned</span>}</td>
                <td><span className="badge">{a.group}</span></td>
                <td>
                  {a.risk === "high"   && <span className="badge badge-danger">High</span>}
                  {a.risk === "medium" && <span className="badge badge-warning">Medium</span>}
                  {a.risk === "low"    && <span className="badge badge-success">Low</span>}
                </td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table className="table">
            <thead><tr><th>Group</th><th>Apps</th><th>Used by policies</th><th></th></tr></thead>
            <tbody>{["Admin tools","System shell","Browsers","Dev tools","DB clients","Network","Utilities","Remote access","Unclassified"].map((g, i) => (
              <tr key={i}>
                <td><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{g}</span></td>
                <td style={{ color: "var(--fg-2)" }}>{EP_APPS.filter(a => a.group === g).length || Math.floor(Math.random()*30+1)}</td>
                <td style={{ color: "var(--fg-3)" }}>{i % 3 === 0 ? "2" : "1"}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const EndpointPoliciesScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Policy management" description="Elevation, blocking, and audit policies applied to managed endpoints."
      actions={<><button className="btn">Default policies</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Create custom policy</button></>}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <table className="table">
        <thead><tr><th>Policy</th><th>Mode</th><th>App groups</th><th>Apps</th><th>Devices</th><th>Updated</th><th></th></tr></thead>
        <tbody>{EP_POLICIES.map(p => (
          <tr key={p.id}>
            <td><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.name}</div><div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{p.id}</div></div></td>
            <td>
              {p.mode === "Block"   && <span className="badge badge-danger">Block</span>}
              {p.mode === "Elevate" && <span className="badge badge-brand">Elevate</span>}
              {p.mode === "Audit"   && <span className="badge badge-warning">Audit</span>}
              {p.mode === "Default" && <span className="badge">Default</span>}
            </td>
            <td style={{ color: "var(--fg-2)" }}>{p.groups}</td>
            <td style={{ color: "var(--fg-2)" }}>{p.apps}</td>
            <td style={{ color: "var(--fg-2)" }}>{p.devices}</td>
            <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{p.updated}</td>
            <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

const EndpointDevicesScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Endpoint manager" description="Managed devices with the PAM endpoint agent installed."
      actions={<><button className="btn"><Icon name="download" size={13}/> Download agent</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Enroll device</button></>}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <table className="table">
        <thead><tr><th>Device</th><th>Owner</th><th>OS</th><th>Agent</th><th>Status</th><th>Last seen</th><th></th></tr></thead>
        <tbody>{EP_DEVICES.map(d => (
          <tr key={d.id}>
            <td><div className="row"><Icon name="endpoint" size={14} color="var(--fg-3)"/><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{d.name}</span></div></td>
            <td><div className="row"><Avatar name={d.user} size={20}/><span>{d.user}</span></div></td>
            <td style={{ color: "var(--fg-2)" }}>{d.os}</td>
            <td className="t-mono t-tiny" style={{ color: d.agent === "—" ? "var(--fg-4)" : "var(--fg-2)" }}>{d.agent}</td>
            <td>
              {d.status === "healthy"  && <span className="badge badge-success">Healthy</span>}
              {d.status === "outdated" && <span className="badge badge-warning">Outdated</span>}
              {d.status === "offline"  && <span className="badge badge-danger">Offline</span>}
            </td>
            <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{d.lastSeen}</td>
            <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

const EndpointAuditsScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Audits" description="Endpoint application events: blocks, elevations, and allowed runs across all devices."
      actions={<><button className="btn"><Icon name="download" size={13}/> Export</button><button className="btn"><Icon name="filter" size={13}/> Saved filters</button></>}/>
    <ListToolbar search="" onSearch={() => {}} filterLabels={["Date range","Response","Publisher","Signed"]}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <table className="table">
        <thead><tr><th>Time</th><th>User</th><th>Device</th><th>Application</th><th>Publisher</th><th>Signed</th><th>Response</th><th>Reason</th></tr></thead>
        <tbody>{EP_AUDITS.map(a => (
          <tr key={a.id}>
            <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.time}</td>
            <td><div className="row"><Avatar name={a.user} size={20}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{a.user}</span></div></td>
            <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{a.device}</td>
            <td><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.app}</div><div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{a.path}</div></div></td>
            <td style={{ color: a.publisher === "(unknown)" ? "var(--danger-fg)" : "var(--fg-2)" }}>{a.publisher}</td>
            <td>{a.signed ? <Icon name="check-circle" size={14} color="var(--success)"/> : <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>}</td>
            <td>
              {a.response === "blocked"  && <span className="badge badge-danger">Blocked</span>}
              {a.response === "elevated" && <span className="badge badge-brand">Elevated</span>}
              {a.response === "allowed"  && <span className="badge badge-success">Allowed</span>}
              {a.response === "audited"  && <span className="badge">Audited</span>}
            </td>
            <td style={{ fontSize: 12, color: "var(--fg-3)", maxWidth: 280 }}>{a.reason}</td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

const EndpointTicketsScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Tickets" description="Endpoint-specific elevation requests, separate from main PAM tickets."/>
    <ListToolbar search="" onSearch={() => {}} filterLabels={["Status","User","Device"]}/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <table className="table">
        <thead><tr><th>Ticket</th><th>User</th><th>Device</th><th>Application</th><th>Reason</th><th>Status</th><th></th></tr></thead>
        <tbody>{EP_TICKETS.map(t => (
          <tr key={t.id}>
            <td><span className="t-mono t-tiny">{t.id}</span></td>
            <td><div className="row"><Avatar name={t.user} size={20}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{t.user}</span></div></td>
            <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{t.device}</td>
            <td><span className="t-mono">{t.app}</span></td>
            <td style={{ fontSize: 12, color: "var(--fg-3)" }}>{t.reason}</td>
            <td>
              {t.status === "pending"  && <span className="badge badge-warning">Pending</span>}
              {t.status === "approved" && <span className="badge badge-success">Approved</span>}
              {t.status === "rejected" && <span className="badge badge-danger">Rejected</span>}
            </td>
            <td style={{ textAlign: "right" }}>
              {t.status === "pending" && <><button className="btn btn-sm btn-primary">Approve</button><button className="btn btn-sm">Deny</button></>}
            </td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  </div>
);

window.EndpointSidebar = EndpointSidebar;
window.EndpointDashboard = EndpointDashboard;
window.EndpointAppsScreen = EndpointAppsScreen;
window.EndpointPoliciesScreen = EndpointPoliciesScreen;
window.EndpointDevicesScreen = EndpointDevicesScreen;
window.EndpointAuditsScreen = EndpointAuditsScreen;
window.EndpointTicketsScreen = EndpointTicketsScreen;
window.ENDPOINT_NAV = ENDPOINT_NAV;
