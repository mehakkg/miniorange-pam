// Access Allocation V2 — Overview · Allocate · JIT Policies · Access Review
// Fixes all Severity 4/3 audit failures. First-class nav section, not a modal.

// ==================== SEED DATA ====================
const ALLOC_DATA = [
  {
    resource: "prod-db-primary", resourceType: "database", host: "10.42.18.7", env: "production", crit: "critical",
    allocations: [
      { id: "al-1", user: "Priya Iyer",   userType: "user",   role: "Operator", cred: "root-db-primary", policy: "Production DB Policy", windowType: "custom",   from: "May 12, 2026", until: "May 20, 2026", status: "active",   lastAccessed: "12 min ago", risk: null },
      { id: "al-2", user: "DevOps Team",  userType: "group",  members: 8, cred: "root-db-primary", policy: "Production DB Policy", windowType: "working",  status: "active",   lastAccessed: "3 hr ago", risk: null },
      { id: "al-3", user: "oracle-reconcile-01", userType: "user", role: "Admin", cred: "backup-admin", policy: "Production DB Policy", windowType: "lifelong", status: "active",   lastAccessed: "2 days ago", risk: "noexit" },
    ],
  },
  {
    resource: "auth-server-01", resourceType: "linux", host: "10.42.4.21", env: "production", crit: "critical",
    allocations: [
      { id: "al-4", user: "Marcus Chen",  userType: "user",   role: "Admin",    cred: "linux-ssh-admin", policy: "SSH Strict", windowType: "custom",   from: "May 17, 2026", until: "May 19, 2026", status: "expiring", lastAccessed: "1 hr ago", risk: "expiring" },
      { id: "al-5", user: "Rohan Mehta",  userType: "user",   role: "Operator", cred: "linux-ssh-admin", policy: "SSH Strict", windowType: "zeroday",  status: "pending",  lastAccessed: "Never",    risk: null, ticket: "TKT-214" },
    ],
  },
  {
    resource: "dev-web-portal", resourceType: "web", host: "dev.northwind.io", env: "development", crit: "medium",
    allocations: [
      { id: "al-6", user: "Dev Team", userType: "group", members: 14, cred: "dev-portal-cred", policy: "Dev Default Policy", windowType: "lifelong", status: "active",   lastAccessed: "45 days ago", risk: "stale" },
    ],
  },
];

const JIT_POLICIES_DATA = [
  {
    id: "jit-1", name: "Production Database JIT", status: "active",
    scope: "All Database · Production (8 resources)",
    eligible: "Operator, Admin", maxSession: "8 hours",
    approval: "Required — Security Admin (min 1)", sla: "2h → escalate",
    requestsToday: 2,
  },
];

// ==================== BADGES ====================
const WindowBadge = ({ type }) => {
  const M = {
    custom:   { bg: "var(--info-soft)",    fg: "var(--info-fg)",    label: "Custom" },
    zeroday:  { bg: "color-mix(in oklch, #7c3aed 12%, transparent)", fg: "#7c3aed", label: "Zero Day (JIT)" },
    lifelong: { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       label: "Lifelong" },
    onetime:  { bg: "var(--warning-soft)", fg: "var(--warning-fg)", label: "One Time" },
    working:  { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "Working Hours" },
  }[type] || { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", label: type };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: M.bg, color: M.fg, whiteSpace: "nowrap" }}>{M.label}</span>;
};

const AllocStatusBadge = ({ status }) => {
  const M = {
    active:   { bg: "var(--success-soft)", fg: "var(--success-fg)", dot: "var(--success-fg)", label: "Active" },
    expiring: { bg: "var(--warning-soft)", fg: "var(--warning-fg)", dot: "var(--warning-fg)", label: "Expiring Soon" },
    expired:  { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       dot: "var(--fg-4)",       label: "Expired" },
    pending:  { bg: "var(--info-soft)",    fg: "var(--info-fg)",    dot: "var(--info-fg)",    label: "Pending" },
    revoked:  { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  dot: "var(--danger-fg)",  label: "Revoked" },
  }[status] || { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", dot: "var(--fg-4)", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: M.bg, color: M.fg }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: M.dot }}/>
      {M.label}
    </span>
  );
};

const RiskBadge = ({ risk }) => {
  if (!risk) return null;
  const M = {
    noexit:   { icon: "⚑", label: "No expiry set",    color: "var(--danger-fg)",  bg: "var(--danger-soft)" },
    stale:    { icon: "⚠", label: "Stale 45 days",    color: "var(--warning-fg)", bg: "var(--warning-soft)" },
    overpriv: { icon: "⚑", label: "Over-privileged",  color: "var(--danger-fg)",  bg: "var(--danger-soft)" },
    expiring: { icon: "⚠", label: "Expires today",    color: "var(--warning-fg)", bg: "var(--warning-soft)" },
  }[risk] || {};
  return <span style={{ padding: "1px 7px", borderRadius: 4, font: "500 11px/1.5 var(--font-sans)", background: M.bg, color: M.color }}>{M.icon} {M.label}</span>;
};

// ==================== MAIN SCREEN ====================
const AllocationScreenV2 = ({ empty }) => {
  const [tab, setTab] = React.useState("overview");
  const [showAllocate, setShowAllocate] = React.useState(false);
  const [showBulk, setShowBulk] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const doToast = (t) => { setToast(t); setTimeout(() => setToast(null), 2500); };

  if (showBulk) return <BulkAllocationFlow onClose={() => setShowBulk(false)} onDone={(n) => { setShowBulk(false); doToast({ kind: "success", text: `${n} allocations applied` }); }}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Access Allocation"
        description="Who has access to what, right now. Review, allocate, and revoke privileged access across your entire estate."
        actions={<>
          <div style={{ position: "relative" }}>
            <button className="btn btn-primary" onClick={() => setShowAllocate(true)}><Icon name="plus" size={13}/> Allocate access</button>
          </div>
          <button className="btn" onClick={() => setShowBulk(true)}><Icon name="columns" size={12}/> Bulk allocate</button>
          <button className="btn"><Icon name="download" size={12}/> Export</button>
        </>}
      />

      <TabBar active={tab} onChange={setTab} tabs={[
        { id: "overview",  label: "Overview",       weight: 1 },
        { id: "allocate",  label: "Allocate",       weight: 2 },
        { id: "jit",       label: "JIT Policies",   weight: 2 },
        { separator: true },
        { id: "review",    label: "Access Review",  weight: 3 },
      ]}/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {tab === "overview"  && <OverviewTab empty={empty} onAllocate={() => setShowAllocate(true)} onToast={doToast}/>}
        {tab === "allocate"  && <AllocateTabContent onAllocate={() => setShowAllocate(true)} onToast={doToast}/>}
        {tab === "jit"       && <JITPoliciesTab empty={empty} onToast={doToast}/>}
        {tab === "review"    && <AccessReviewTab empty={empty} onToast={doToast}/>}
      </div>

      {showAllocate && <AllocatePanel onClose={() => setShowAllocate(false)} onDone={(msg) => { setShowAllocate(false); doToast({ kind: "success", text: msg }); }}/>}
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

// ==================== OVERVIEW TAB ====================
const OverviewTab = ({ empty, onAllocate, onToast }) => {
  const [viewBy, setViewBy] = React.useState("resource");
  const [expanded, setExpanded] = React.useState(new Set(["prod-db-primary"]));
  const [selected, setSelected] = React.useState(new Set());
  const [revokeTarget, setRevokeTarget] = React.useState(null);
  const allocs = empty ? [] : ALLOC_DATA;

  const totalAllocs = allocs.reduce((s, r) => s + r.allocations.length, 0);
  const expiringCount = allocs.flatMap(r => r.allocations).filter(a => a.status === "expiring").length;
  const overPrivCount = allocs.flatMap(r => r.allocations).filter(a => a.risk === "noexit" || a.risk === "stale").length;
  const pendingCount = allocs.flatMap(r => r.allocations).filter(a => a.status === "pending").length;

  const toggleExpand = (key) => setExpanded(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  return (
    <>
      {/* KPI strip */}
      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="key" label="Total active allocations" value={empty ? 0 : totalAllocs} change={`Across ${allocs.length} resources and 4 users`}/>
        <StatCard icon="clock" label="Expiring in 24 hours" value={empty ? 0 : expiringCount} change={`${expiringCount} allocations expire today`} tone={expiringCount > 0 ? "warning" : "default"}/>
        <StatCard icon="alert-triangle" label="Over-privileged" value={empty ? 0 : overPrivCount} change="No expiry set or unused 30+ days" tone={overPrivCount > 0 ? "danger" : "default"}/>
        <StatCard icon="tickets" label="Pending approvals" value={empty ? 0 : pendingCount} change="Access requests awaiting review" tone={pendingCount > 0 ? "default" : "default"}/>
      </div>

      {/* Toolbar */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 280 }}>
          <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
          <input className="input" placeholder="Search by user, resource, or group…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
        </div>
        <Segmented value={viewBy} onChange={setViewBy} options={[{value:"resource",label:"By resource"},{value:"user",label:"By user"},{value:"group",label:"By group"}]}/>
        <FilterDropdown label="Status"  value="any" onChange={() => {}} options={[["any","Any"],["active","Active"],["expiring","Expiring"],["pending","Pending"]]}/>
        <FilterDropdown label="Window"  value="any" onChange={() => {}} options={[["any","Any"],["custom","Custom"],["lifelong","Lifelong"],["zeroday","Zero Day"]]}/>
        <FilterDropdown label="Type"    value="any" onChange={() => {}} options={[["any","Any"],["database","Database"],["linux","Server"],["web","Web App"]]}/>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-primary btn-sm" onClick={onAllocate}><Icon name="plus" size={11}/> Allocate</button>
      </div>

      {selected.size > 0 && (
        <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selected.size} selected</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm">Extend access</button>
          <button className="btn btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setRevokeTarget("bulk")}>Revoke selected</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {allocs.length === 0 ? (
          <EmptyState icon="key" title="No access allocations yet"
            description="Allocate resources to users or groups to give them access to privileged systems."
            action={<button className="btn btn-primary" onClick={onAllocate}><Icon name="plus" size={13}/> Allocate access</button>}/>
        ) : viewBy === "resource" ? (
          <ResourceView allocs={allocs} expanded={expanded} toggleExpand={toggleExpand} selected={selected} setSelected={setSelected} onToast={onToast} setRevokeTarget={setRevokeTarget}/>
        ) : viewBy === "user" ? (
          <UserView allocs={allocs} selected={selected} setSelected={setSelected} onToast={onToast} setRevokeTarget={setRevokeTarget}/>
        ) : (
          <GroupView allocs={allocs} selected={selected} setSelected={setSelected} onToast={onToast} setRevokeTarget={setRevokeTarget}/>
        )}
      </div>

      {revokeTarget && <RevokeModal target={revokeTarget} onClose={() => setRevokeTarget(null)} onConfirm={(reason) => { setRevokeTarget(null); setSelected(new Set()); onToast({ kind: "success", text: "Access revoked" }); }}/>}
    </>
  );
};

// Resource view
const ResourceView = ({ allocs, expanded, toggleExpand, selected, setSelected, onToast, setRevokeTarget }) => (
  <table className="table">
    <thead><tr>
      <th style={{ width: 32 }}></th>
      <th>Resource</th><th>Env</th><th>Criticality</th><th>Allocations</th><th>Risk signals</th><th></th>
    </tr></thead>
    <tbody>
      {allocs.map(r => {
        const open = expanded.has(r.resource);
        const risks = r.allocations.filter(a => a.risk).length;
        return (
          <React.Fragment key={r.resource}>
            <tr style={{ background: "var(--bg-surface-2)", cursor: "pointer" }} onClick={() => toggleExpand(r.resource)}>
              <td><Icon name={open ? "chevron-down" : "chevron-right"} size={12} color="var(--fg-4)"/></td>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ResourceTypeIcon type={r.resourceType} size={24}/>
                  <span style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.resource}</span>
                </div>
              </td>
              <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
              <td><span className="badge" style={{ background: r.crit === "critical" ? "var(--danger-soft)" : r.crit === "high" ? "var(--warning-soft)" : "var(--bg-surface-2)", color: r.crit === "critical" ? "var(--danger-fg)" : r.crit === "high" ? "var(--warning-fg)" : "var(--fg-3)", borderColor: "transparent", textTransform: "capitalize" }}>{r.crit}</span></td>
              <td style={{ color: "var(--fg-2)" }}>{r.allocations.length} allocations</td>
              <td>{risks > 0 ? <span style={{ color: "var(--danger-fg)", font: "500 12px/1 var(--font-sans)" }}>⚑ {risks} risk signal{risks > 1 ? "s" : ""}</span> : <span style={{ color: "var(--success-fg)", fontSize: 12 }}>✓ Healthy</span>}</td>
              <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                <button className="btn btn-sm btn-primary" onClick={() => onToast({ kind: "info", text: `Allocating to ${r.resource}` })}>Allocate</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)", marginLeft: 4 }} onClick={() => setRevokeTarget(r.resource)}>Revoke all</button>
              </td>
            </tr>
            {open && r.allocations.map(a => (
              <tr key={a.id} style={{ background: a.risk ? "color-mix(in oklch, var(--warning-fg) 4%, transparent)" : "transparent", boxShadow: a.risk === "noexit" ? "inset 3px 0 var(--danger-fg)" : a.risk ? "inset 3px 0 var(--warning-fg)" : "none" }}>
                <td style={{ paddingLeft: 40 }}>
                  <input type="checkbox" checked={selected.has(a.id)} onChange={() => setSelected(s => { const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })} style={{ accentColor: "var(--brand)" }}/>
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {a.userType === "user" ? <Avatar name={a.user} size={22}/> : <Icon name="people" size={14} color="var(--fg-3)"/>}
                    <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.user}</span>
                    {a.userType === "group" && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{a.members} members</span>}
                  </div>
                </td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.cred}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.policy}</td>
                <td><WindowBadge type={a.windowType}/></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.from && `${a.from} → ${a.until}`}</td>
                <td><AllocStatusBadge status={a.status}/>{a.ticket && <span className="t-mono t-tiny" style={{ color: "var(--brand-fg)", marginLeft: 6 }}>{a.ticket}</span>}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.lastAccessed}</td>
                <td><RiskBadge risk={a.risk}/></td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="btn btn-ghost btn-sm">Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setRevokeTarget(a.id)}>Revoke</button>
                </td>
              </tr>
            ))}
          </React.Fragment>
        );
      })}
    </tbody>
  </table>
);

// User view
const UserView = ({ allocs, selected, setSelected, onToast, setRevokeTarget }) => {
  const [expanded, setExpanded] = React.useState(new Set());
  const users = [
    { name: "Priya Iyer",  email: "priya@northwind.com",  role: "Operator", groups: ["DevOps Team"], allocs: allocs.flatMap(r => r.allocations.filter(a => a.user === "Priya Iyer").map(a => ({...a, resource: r.resource, resourceType: r.resourceType}))) },
    { name: "Marcus Chen", email: "marcus@northwind.com", role: "Admin",    groups: ["SysAdmins"],  allocs: allocs.flatMap(r => r.allocations.filter(a => a.user === "Marcus Chen").map(a => ({...a, resource: r.resource, resourceType: r.resourceType}))) },
    { name: "Rohan Mehta", email: "rohan@northwind.com",  role: "Operator", groups: [],             allocs: allocs.flatMap(r => r.allocations.filter(a => a.user === "Rohan Mehta").map(a => ({...a, resource: r.resource, resourceType: r.resourceType}))) },
  ];
  return (
    <table className="table">
      <thead><tr><th></th><th>User</th><th>Role</th><th>Resources allocated</th><th>Risk signals</th><th></th></tr></thead>
      <tbody>
        {users.filter(u => u.allocs.length > 0).map(u => {
          const open = expanded.has(u.name);
          return (
            <React.Fragment key={u.name}>
              <tr style={{ background: "var(--bg-surface-2)", cursor: "pointer" }} onClick={() => setExpanded(s => { const n = new Set(s); n.has(u.name) ? n.delete(u.name) : n.add(u.name); return n; })}>
                <td><Icon name={open ? "chevron-down" : "chevron-right"} size={12} color="var(--fg-4)"/></td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={u.name} size={26}/><div><div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{u.name}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{u.email}</div></div></div></td>
                <td><RoleBadge role={u.role}/></td>
                <td style={{ color: "var(--fg-2)" }}>{u.allocs.length} resources</td>
                <td>{u.allocs.filter(a => a.risk).length > 0 ? <span style={{ color: "var(--danger-fg)", font: "500 12px/1 var(--font-sans)" }}>⚑ {u.allocs.filter(a => a.risk).length} risk</span> : <span style={{ color: "var(--success-fg)", fontSize: 12 }}>✓ Healthy</span>}</td>
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm">View profile</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)", marginLeft: 4 }} onClick={() => setRevokeTarget(u.name)}>Revoke all</button>
                </td>
              </tr>
              {open && u.allocs.map(a => (
                <tr key={a.id} style={{ boxShadow: a.risk ? "inset 3px 0 var(--warning-fg)" : "none" }}>
                  <td style={{ paddingLeft: 40 }}><input type="checkbox" style={{ accentColor: "var(--brand)" }}/></td>
                  <td><div className="row"><ResourceTypeIcon type={a.resourceType} size={20}/><span className="t-mono" style={{ color: "var(--brand-fg)", fontWeight: 500 }}>{a.resource}</span></div></td>
                  <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.cred}</td>
                  <td><WindowBadge type={a.windowType}/></td>
                  <td className="t-tiny" style={{ color: a.status === "expiring" ? "var(--warning-fg)" : "var(--fg-3)" }}>{a.until || "—"}</td>
                  <td><AllocStatusBadge status={a.status}/></td>
                  <td><RiskBadge risk={a.risk}/></td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Edit</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setRevokeTarget(a.id)}>Revoke</button></td>
                </tr>
              ))}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
};

// Group view
const GroupView = ({ allocs, selected, setSelected, onToast, setRevokeTarget }) => {
  const groups = [
    { name: "DevOps Team", members: 8, allocs: allocs.flatMap(r => r.allocations.filter(a => a.user === "DevOps Team").map(a => ({...a, resource: r.resource, resourceType: r.resourceType}))) },
    { name: "Dev Team",    members: 14, allocs: allocs.flatMap(r => r.allocations.filter(a => a.user === "Dev Team").map(a => ({...a, resource: r.resource, resourceType: r.resourceType}))) },
  ];
  return (
    <table className="table">
      <thead><tr><th>Group</th><th>Members</th><th>Resources</th><th>Risk</th><th></th></tr></thead>
      <tbody>
        {groups.filter(g => g.allocs.length > 0).map(g => (
          <tr key={g.name}>
            <td><div className="row"><Icon name="people" size={16} color="var(--fg-3)"/><span style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{g.name}</span></div></td>
            <td style={{ color: "var(--fg-2)" }}>{g.members}</td>
            <td style={{ color: "var(--fg-2)" }}>{g.allocs.map(a => a.resource).join(", ")}</td>
            <td>{g.allocs.some(a => a.risk) ? <RiskBadge risk={g.allocs.find(a => a.risk).risk}/> : <span style={{ color: "var(--success-fg)", fontSize: 12 }}>✓ Healthy</span>}</td>
            <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Edit group</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Revoke all</button></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Stub tab for "Allocate" as quick access
const AllocateTabContent = ({ onAllocate, onToast }) => (
  <div style={{ padding: 32, textAlign: "center" }}>
    <Icon name="plus" size={36} color="var(--fg-5)"/>
    <div style={{ font: "500 16px/1.4 var(--font-sans)", color: "var(--fg-1)", marginTop: 12 }}>Allocate access</div>
    <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6, maxWidth: 420, margin: "8px auto 0" }}>Grant a user, group, or role access to a resource — with a specific credential, policy, and time window.</div>
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
      <button className="btn btn-primary" onClick={onAllocate}><Icon name="plus" size={13}/> Allocate single resource</button>
    </div>
  </div>
);

// ==================== ALLOCATE PANEL ====================
const AllocatePanel = ({ onClose, onDone, resourcePrefill }) => {
  const [resource, setResource] = React.useState(resourcePrefill || "");
  const [assignees, setAssignees] = React.useState([]);
  const [assigneeSearch, setAssigneeSearch] = React.useState("");
  const [cred, setCred] = React.useState("");
  const [policy, setPolicy] = React.useState("");
  const [windowType, setWindowType] = React.useState("custom");
  const [from, setFrom] = React.useState("");
  const [until, setUntil] = React.useState("");
  const [tz, setTz] = React.useState("Asia/Kolkata");
  const [advOpen, setAdvOpen] = React.useState(false);
  const [ipRestrict, setIpRestrict] = React.useState(false);
  const [mfaOverride, setMfaOverride] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [phase, setPhase] = React.useState("form"); // form | success
  const [addSearch, setAddSearch] = React.useState(false);

  const removeAssignee = (n) => setAssignees(a => a.filter(x => x !== n));

  const USERS = ["Priya Iyer","Marcus Chen","Rohan Mehta","Aditya Kulkarni","Sarvesh Joshi"];
  const GROUPS = ["DevOps Team (8)","Dev Team (14)","SysAdmins (4)"];
  const searchResults = assigneeSearch ? [...USERS, ...GROUPS].filter(x => x.toLowerCase().includes(assigneeSearch.toLowerCase()) && !assignees.includes(x)) : [];

  const creds = resource === "prod-db-primary" ? ["root-db-primary","backup-admin","readonly-db"] : resource === "auth-server-01" ? ["linux-ssh-admin","deploy-key"] : [];
  const policies = resource ? ["Production DB Policy","SSH Strict","Dev Default Policy"] : [];

  const canAllocate = resource && assignees.length > 0 && cred && policy && (windowType !== "custom" || (from && until));

  const windowCards = [
    { id: "custom", title: "Custom", sub: "Specific date and time range", info: null },
    { id: "zeroday", title: "Zero Day (JIT)", sub: "User must raise a ticket for each access event", info: "Users can see the resource and raise tickets — each goes through your approval workflow.", badge: "JIT" },
    { id: "lifelong", title: "Lifelong", sub: "No expiry — access until manually revoked", warn: "⚠ Standing privilege. Recommended only for service accounts." },
    { id: "onetime", title: "One Time", sub: "Access expires after the user's first session ends", info: "Useful for vendor or contractor one-off access." },
    { id: "working", title: "Working Hours", sub: "Active Monday–Friday, 9am–6pm in user's timezone" },
  ];

  if (phase === "success") return (
    <SlideinPanel title="Access allocated" onClose={onClose}>
      <div style={{ padding: 28, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={26}/></div>
        <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Access allocated</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "8px auto 0", maxWidth: 320 }}>{assignees.join(", ")} can now access <span className="t-mono" style={{ color: "var(--fg-1)" }}>{resource}</span> using <span className="t-mono" style={{ color: "var(--fg-1)" }}>{cred}</span>.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => onDone("Access allocated successfully")}>View in Overview →</button>
          <button className="btn btn-ghost" onClick={() => { setPhase("form"); setResource(""); setAssignees([]); setCred(""); setPolicy(""); setWindowType("custom"); setNote(""); }}>Allocate another</button>
        </div>
      </div>
    </SlideinPanel>
  );

  return (
    <SlideinPanel title="Allocate Access" sub={resource ? `Allocating access to ${resource}` : "Select a resource to begin"} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" disabled={!canAllocate} onClick={() => setPhase("success")}>Allocate access</button></>}>

      {/* Summary card at top */}
      {resource && assignees.length > 0 && cred && (
        <div style={{ padding: "10px 18px", background: "var(--bg-surface-2)", borderBottom: "1px solid var(--border)", font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
          <Icon name="key" size={11} color="var(--brand-fg)"/> {assignees.join(", ")} → <span className="t-mono" style={{ color: "var(--fg-1)" }}>{resource}</span> via <span className="t-mono" style={{ color: "var(--fg-1)" }}>{cred}</span> · <WindowBadge type={windowType}/>
        </div>
      )}

      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Section 1: Resource */}
        {!resourcePrefill && (
          <div>
            <div className="t-micro" style={{ marginBottom: 8 }}>Resource</div>
            <Select value={resource} onChange={setResource} options={[["","Search resources…"],["prod-db-primary","prod-db-primary — Database — Production"],["auth-server-01","auth-server-01 — Server — Production"],["dev-web-portal","dev-web-portal — Web App — Dev"]]}/>
            {resource && (
              <div style={{ marginTop: 8, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, display: "flex", gap: 10, alignItems: "center" }}>
                <ResourceTypeIcon type={ALLOC_DATA.find(r => r.resource === resource)?.resourceType || "server"} size={22}/>
                <div><div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{resource}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{ALLOC_DATA.find(r => r.resource === resource)?.host} · {ALLOC_DATA.find(r => r.resource === resource)?.env} · {ALLOC_DATA.find(r => r.resource === resource)?.crit}</div></div>
              </div>
            )}
          </div>
        )}

        {/* Section 2: Assign to */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Who gets access?</div>
          <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
            {assignees.map(a => <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>{a}<button onClick={() => removeAssignee(a)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button></span>)}
            <input value={assigneeSearch} onChange={e => { setAssigneeSearch(e.target.value); setAddSearch(true); }} onFocus={() => setAddSearch(true)} placeholder="Search users, groups, or roles…" style={{ flex: 1, minWidth: 140, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent" }}/>
          </div>
          {addSearch && searchResults.length > 0 && (
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", marginTop: 4, boxShadow: "var(--shadow-md)", padding: 4 }}>
              {searchResults.map(r => (
                <button key={r} onMouseDown={e => { e.preventDefault(); setAssignees(a => [...a, r]); setAssigneeSearch(""); setAddSearch(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 4, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {r.includes("Team") || r.includes("Group") ? <Icon name="people" size={14} color="var(--fg-3)"/> : <Avatar name={r} size={20}/>}
                  <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{r}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Credential */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Which credential?</div>
          <div className="field-help" style={{ marginBottom: 8 }}>Users never see the password. PAM injects it at session time.</div>
          {creds.length === 0 ? (
            <div style={{ padding: "10px 12px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12px/1.4 var(--font-sans)" }}>⚠ No credentials linked to {resource || "this resource"}. Add credentials first. <a href="#" style={{ color: "var(--warning-fg)", textDecoration: "underline" }}>Go to Credentials tab →</a></div>
          ) : (
            <Select value={cred} onChange={v => setCred(v)} options={[["","Select credential…"], ...creds.map(c => [c, c])]}/>
          )}
          {cred && <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "var(--brand-soft)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)", color: "var(--brand-fg)" }}><Icon name="lock" size={10}/> Non-viewable — credential will be proxy-injected, never shown to user</div>}
        </div>

        {/* Section 4: Policy */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Access policy</div>
          <div className="field-help" style={{ marginBottom: 8 }}>Governs recording, MFA, session timeout, and session capabilities.</div>
          <Select value={policy} onChange={setPolicy} options={[["","Select policy…"], ...policies.map(p => [p, p])]}/>
        </div>

        {/* Section 5: Window */}
        <div>
          <div className="t-micro" style={{ marginBottom: 10 }}>How long?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {windowCards.map(w => {
              const sel = windowType === w.id;
              return (
                <button key={w.id} onClick={() => setWindowType(w.id)} style={{ padding: 12, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`, background: sel ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>}</div>
                    <span style={{ font: `${sel ? 600 : 500} 13px/1.3 var(--font-sans)`, color: sel ? "var(--brand-fg)" : "var(--fg-1)" }}>{w.title}</span>
                    {w.badge && <span style={{ padding: "1px 6px", borderRadius: 4, background: "color-mix(in oklch, #7c3aed 14%, transparent)", color: "#7c3aed", font: "500 10.5px/1.4 var(--font-sans)" }}>{w.badge}</span>}
                  </div>
                  <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4, paddingLeft: 22 }}>{w.sub}</div>
                  {sel && w.warn && <div style={{ marginTop: 8, padding: "6px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)", marginLeft: 22 }}>{w.warn}</div>}
                  {sel && w.info && <div style={{ marginTop: 6, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginLeft: 22 }}>{w.info}</div>}
                  {sel && w.id === "custom" && (
                    <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingLeft: 22 }}>
                      <div><div className="field-label" style={{ marginBottom: 4 }}>From</div><input className="input" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}/></div>
                      <div><div className="field-label" style={{ marginBottom: 4 }}>Until</div><input className="input" type="datetime-local" value={until} onChange={e => setUntil(e.target.value)}/></div>
                    </div>
                  )}
                  {sel && w.id === "working" && (
                    <div style={{ marginTop: 10, paddingLeft: 22 }}>
                      <div className="field-label" style={{ marginBottom: 4 }}>Timezone</div>
                      <Select value={tz} onChange={setTz} options={[["Asia/Kolkata","Asia/Kolkata"],["UTC","UTC"],["America/New_York","America/New_York"]]}/>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 6: Advanced conditions */}
        <div>
          <button className="btn btn-ghost btn-sm" style={{ padding: 0, color: "var(--fg-2)" }} onClick={() => setAdvOpen(o => !o)}>
            <Icon name={advOpen ? "chevron-down" : "chevron-right"} size={11}/> Advanced access conditions
          </button>
          <div className="field-help" style={{ marginTop: 2 }}>IP restriction, device trust, MFA override</div>
          {advOpen && (
            <div style={{ marginTop: 12, padding: 14, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface-2)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>IP restriction</div><div className="field-help">Access only from these IP addresses or ranges.</div></div>
                <Toggle value={ipRestrict} onChange={setIpRestrict}/>
              </div>
              {ipRestrict && <textarea className="input t-mono" rows={3} placeholder={"10.0.0.0/8\n192.168.1.0/24"}/>}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Require MFA before session</div><div className="field-help">Override policy-level MFA for this allocation.</div></div>
                <Toggle value={mfaOverride} onChange={setMfaOverride}/>
              </div>
            </div>
          )}
        </div>

        {/* Section 7: Note */}
        <div>
          <div className="t-micro" style={{ marginBottom: 8 }}>Note (optional)</div>
          <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Temporary access for Q2 migration project. Review by June 30."/>
          <div className="field-help" style={{ marginTop: 4 }}>Visible to the user and in the audit trail.</div>
        </div>
      </div>
    </SlideinPanel>
  );
};

// ==================== BULK ALLOCATION ====================
const BulkAllocationFlow = ({ onClose, onDone }) => {
  const [step, setStep] = React.useState(1);
  const [selRes, setSelRes] = React.useState(new Set(["prod-db-primary","auth-server-01"]));
  const resources = ALLOC_DATA;

  const toggleRes = (id) => setSelRes(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const steps = ["Select resources","Configure access","Review & confirm"];

  if (step === 4) return (
    <div style={{ flex: 1, padding: 48, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon name="check" size={26}/></div>
      <h1 style={{ font: "600 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>All allocations applied</h1>
      <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "8px auto 0", maxWidth: 420 }}>Created {selRes.size * 2} allocations across {selRes.size} resources for 2 users and 1 group.</div>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => onDone(selRes.size * 2)}>View in Overview →</button>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 6 }}>
            <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>Access Allocation</a><Icon name="chevron-right" size={10}/><span>Bulk Allocate</span>
          </div>
          <h1 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Bulk Allocate Access</h1>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            {steps.map((s, i) => {
              const done = step > i + 1, active = step === i + 1;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)" }}>{done ? <Icon name="check" size={11}/> : i + 1}</div>
                    <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : "var(--fg-4)" }}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 40 }}/>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {step === 1 && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>Which resources are you allocating access to?</h2>
            <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 16px" }}>Select all resources that should receive the same access configuration.</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <FilterDropdown label="Type"    value="any" onChange={() => {}} options={[["any","Any Type"],["database","Database"],["linux","Server"],["web","Web App"]]}/>
              <FilterDropdown label="Env"     value="any" onChange={() => {}} options={[["any","Any"],["production","Production"],["staging","Staging"],["development","Dev"]]}/>
              <FilterDropdown label="Crit"    value="any" onChange={() => {}} options={[["any","Any"],["critical","Critical"],["high","High"],["medium","Medium"]]}/>
            </div>
            {selRes.size > 0 && <div style={{ marginBottom: 10, font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{selRes.size} resources selected</div>}
            <div className="card">
              <table className="table">
                <thead><tr><th style={{ width: 32 }}><input type="checkbox" checked={selRes.size === resources.length} onChange={e => setSelRes(e.target.checked ? new Set(resources.map(r => r.resource)) : new Set())} style={{ accentColor: "var(--brand)" }}/></th><th>Resource</th><th>Type</th><th>Environment</th><th>Criticality</th><th>Current allocations</th><th>Policy?</th></tr></thead>
                <tbody>{resources.map(r => (
                  <tr key={r.resource}>
                    <td><input type="checkbox" checked={selRes.has(r.resource)} onChange={() => toggleRes(r.resource)} style={{ accentColor: "var(--brand)" }}/></td>
                    <td><div className="row"><ResourceTypeIcon type={r.resourceType} size={22}/><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.resource}</span></div></td>
                    <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.resourceType}</span></td>
                    <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
                    <td><span className="badge" style={{ background: r.crit === "critical" ? "var(--danger-soft)" : "var(--bg-surface-2)", color: r.crit === "critical" ? "var(--danger-fg)" : "var(--fg-3)", borderColor: "transparent", textTransform: "capitalize" }}>{r.crit}</span></td>
                    <td style={{ color: "var(--fg-2)" }}>{r.allocations.length}</td>
                    <td><span className="badge badge-success" style={{ fontSize: 10 }}>✓ Assigned</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Configure access for {selRes.size} resources</h2>
            <div className="card" style={{ padding: 14, background: "var(--warning-soft)", borderColor: "transparent" }}>
              <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--warning-fg)" }}>Your selection includes Database and Server resources</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)", marginTop: 4 }}>Configure a policy for each type below. Credential and access window apply to all.</div>
            </div>
            {[["Assign to","Search users, groups, or roles…"],["Credential","Select credential…"],["Database policy","Production DB Policy"],["Server policy","SSH Strict"]].map(([l,ph]) => (
              <div key={l}><label className="field-label" style={{ marginBottom: 6 }}>{l}</label><input className="input" placeholder={ph} defaultValue={l.includes("policy") ? ph : ""}/></div>
            ))}
            <div>
              <div className="t-micro" style={{ marginBottom: 10 }}>Access window</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["custom","zeroday","lifelong","onetime","working"].map(w => (
                  <button key={w} style={{ padding: 12, border: `1px solid ${w === "custom" ? "var(--brand)" : "var(--border)"}`, background: w === "custom" ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 8, cursor: "pointer", textAlign: "left", font: "500 12px/1.3 var(--font-sans)", color: w === "custom" ? "var(--brand-fg)" : "var(--fg-2)" }}>
                    <WindowBadge type={w}/>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>Review before applying</h2>
            <div style={{ marginBottom: 12, padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.4 var(--font-sans)", display: "flex", gap: 8 }}>
              <Icon name="alert-circle" size={14}/>
              <span>1 conflict detected — DevOps Team already has access to prod-db-primary. Review below.</span>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead><tr><th>Resource</th><th>Assigned to</th><th>Credential</th><th>Policy</th><th>Window</th></tr></thead>
                <tbody>{[...selRes].map((r, i) => (
                  <tr key={r} style={{ background: i === 0 ? "var(--warning-soft)" : "transparent" }}>
                    <td className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r}{i === 0 && <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--warning-fg)", marginLeft: 8 }}>⚠ Duplicate access</span>}</td>
                    <td>Priya Iyer, DevOps Team</td>
                    <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>root-db-primary</td>
                    <td className="t-tiny" style={{ color: "var(--fg-2)" }}>Production DB Policy</td>
                    <td><WindowBadge type="custom"/></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="card" style={{ padding: 14, marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[["Total allocations", selRes.size * 2],["Resources affected", selRes.size],["Users affected","2"],["Groups affected","1"]].map(([l,v]) => (
                <div key={l} style={{ textAlign: "center" }}><div className="t-tiny">{l}</div><div style={{ font: "600 20px/1.1 var(--font-sans)", color: "var(--fg-1)", marginTop: 6 }}>{v}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        {step > 1 && <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>}
        <div style={{ flex: 1 }}/>
        {step < 3 && <button className="btn btn-primary" disabled={step === 1 && selRes.size === 0} onClick={() => setStep(s => s + 1)}>{step === 1 ? "Next: Configure →" : "Next: Review →"}</button>}
        {step === 3 && <button className="btn btn-primary" onClick={() => setStep(4)}>Apply {selRes.size * 2} allocations</button>}
      </div>
    </div>
  );
};

// ==================== JIT POLICIES ====================
const JITPoliciesTab = ({ empty, onToast }) => {
  const [showCreate, setShowCreate] = React.useState(false);
  const policies = empty ? [] : JIT_POLICIES_DATA;

  if (showCreate) return <JITPolicyCreateFlow onClose={() => setShowCreate(false)} onSave={() => { setShowCreate(false); onToast({ kind: "success", text: "JIT policy saved and activated" }); }}/>;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>JIT Policies</div>
          <div style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>Define who can request access to resource groups and how requests are approved.</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={12}/> Create JIT policy</button>
      </div>

      <div style={{ padding: "14px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <StatCard icon="shield" label="Active policies" value={policies.length} tone="success"/>
        <StatCard icon="resources" label="Resources under JIT" value={policies.length * 8} change={policies.length === 0 ? "No JIT coverage" : "of 14 total"} tone={policies.length === 0 ? "warning" : "default"}/>
        <StatCard icon="tickets" label="Pending requests today" value={policies.reduce((s, p) => s + p.requestsToday, 0)} tone="default"/>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {policies.length === 0 ? (
          <EmptyState icon="shield" title="No JIT policies configured"
            description="JIT policies let you enable Zero Day access across resource groups — users can see the resource exists and request time-bound access, which goes through your approval workflow."
            action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={11}/> Create JIT Policy</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Policy name</th><th>Scope</th><th>Eligible requesters</th><th>Approval</th><th>Max session</th><th>Requests today</th><th>Status</th><th></th></tr></thead>
            <tbody>{policies.map(p => (
              <tr key={p.id}>
                <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{p.name}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{p.scope}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{p.eligible}</td>
                <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{p.approval}</td>
                <td><span className="badge">{p.maxSession}</span></td>
                <td style={{ color: "var(--fg-2)" }}>{p.requestsToday}</td>
                <td><span className="badge badge-success">Active</span></td>
                <td style={{ textAlign: "right" }}><RowMenu items={[{ label: "Edit", icon: "edit", onClick: () => {} }, { label: "Duplicate", icon: "copy", onClick: () => {} }, { label: "Disable", icon: "lock", onClick: () => {} }, { divider: true }, { label: "Delete", icon: "trash", danger: true, onClick: () => {} }]}/></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// JIT Policy Create Flow
const JITPolicyCreateFlow = ({ onClose, onSave }) => {
  const [step, setStep] = React.useState(1);
  const [policyName, setPolicyName] = React.useState("Production Database JIT");
  const [scopeType, setScopeType] = React.useState("filter");
  const [eligible, setEligible] = React.useState("roles");
  const [abacAttr, setAbacAttr] = React.useState("department");
  const [abacOp, setAbacOp] = React.useState("is");
  const [abacVal, setAbacVal] = React.useState("Engineering");
  const [approvalReq, setApprovalReq] = React.useState(true);

  const steps = ["Scope","Eligibility","Workflow"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", display: "flex", gap: 6, marginBottom: 6 }}>
            <a href="#" onClick={e => { e.preventDefault(); onClose(); }} style={{ color: "var(--brand-fg)" }}>JIT Policies</a><Icon name="chevron-right" size={10}/><span>Create policy</span>
          </div>
          <h1 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Create JIT Policy</h1>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            {steps.map((s, i) => {
              const done = step > i + 1, active = step === i + 1;
              return (
                <React.Fragment key={s}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)" }}>{done ? <Icon name="check" size={11}/> : i + 1}</div>
                    <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : "var(--fg-4)" }}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 40 }}/>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Define the policy scope</h2>
              <div><label className="field-label" style={{ marginBottom: 6 }}>Policy name *</label><input className="input" value={policyName} onChange={e => setPolicyName(e.target.value)}/></div>
              <div><label className="field-label" style={{ marginBottom: 6 }}>Description</label><textarea className="input" rows={2}/></div>
              <div>
                <label className="field-label" style={{ marginBottom: 8 }}>Resource scope *</label>
                {[["filter","All resources matching filters (dynamic — new resources that match are auto-included)"],["static","Specific resources (static list)"]].map(([k,l]) => (
                  <label key={k} style={{ display: "flex", gap: 10, padding: "10px 12px", border: `1px solid ${scopeType === k ? "var(--brand)" : "var(--border)"}`, background: scopeType === k ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 6, cursor: "pointer", marginBottom: 6 }}>
                    <input type="radio" checked={scopeType === k} onChange={() => setScopeType(k)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
                    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: scopeType === k ? "var(--brand-fg)" : "var(--fg-1)" }}>{l}</div>
                  </label>
                ))}
                {scopeType === "filter" && (
                  <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, marginTop: 8 }}>
                    <div className="row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                      <FilterDropdown label="Type" value="database" onChange={() => {}} options={[["any","Any"],["database","Database"],["linux","Server"]]}/>
                      <FilterDropdown label="Environment" value="production" onChange={() => {}} options={[["any","Any"],["production","Production"],["staging","Staging"]]}/>
                      <FilterDropdown label="Criticality" value="any" onChange={() => {}} options={[["any","Any"],["critical","Critical"],["high","High"]]}/>
                    </div>
                    <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>→ <strong style={{ color: "var(--success-fg)" }}>8 resources</strong> currently match: <span className="t-mono" style={{ fontSize: 11.5 }}>prod-db-primary, oracle-reporting, audit-readonly-replica…</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Who can request access under this policy?</h2>
              <div>
                <label className="field-label" style={{ marginBottom: 8 }}>Eligible requesters</label>
                {[["all","All PAM users (any user who can see these resources)"],["roles","Specific roles"],["groups","Specific groups"],["abac","Attribute-based rule"]].map(([k,l]) => (
                  <label key={k} style={{ display: "flex", gap: 10, padding: "10px 12px", border: `1px solid ${eligible === k ? "var(--brand)" : "var(--border)"}`, background: eligible === k ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 6, cursor: "pointer", marginBottom: 6 }}>
                    <input type="radio" checked={eligible === k} onChange={() => setEligible(k)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
                    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: eligible === k ? "var(--brand-fg)" : "var(--fg-1)" }}>{l}</div>
                  </label>
                ))}
                {eligible === "roles" && <Select value="operator" onChange={() => {}} options={[["operator","Operator"],["admin","Admin"],["auditor","Auditor Admin"]]}/>}
                {eligible === "abac" && (
                  <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)" }}>
                    <div className="t-micro" style={{ marginBottom: 10 }}>Attribute-based rule</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Select value={abacAttr} onChange={setAbacAttr} options={[["department","department"],["role","role"],["manager","manager"],["location","location"]]}/>
                      <Select value={abacOp} onChange={setAbacOp} options={[["is","is"],["is not","is not"],["contains","contains"],["starts with","starts with"]]}/>
                      <input className="input" value={abacVal} onChange={e => setAbacVal(e.target.value)} style={{ flex: 1 }}/>
                    </div>
                    <div style={{ marginTop: 8, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>Resolves to: users where {abacAttr} {abacOp} "{abacVal}"</div>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label className="field-label" style={{ marginBottom: 6 }}>Maximum access duration</label><div style={{ display: "flex", gap: 8 }}><input className="input" type="number" defaultValue={8} style={{ width: 80 }}/><Select value="hours" onChange={() => {}} options={[["hours","hours"],["days","days"]]}/></div><div className="field-help" style={{ marginTop: 4 }}>Users cannot request access for longer than this.</div></div>
              </div>
              <div>
                <label className="field-label" style={{ marginBottom: 8 }}>Access window types requesters can choose</label>
                {[["custom","Custom (date/time range)"],["onetime","One Time"],["working","Working Hours"]].map(([k,l]) => (
                  <label key={k} style={{ display: "flex", gap: 8, padding: "6px 0", cursor: "pointer" }}>
                    <input type="checkbox" defaultChecked={k !== "working"} style={{ accentColor: "var(--brand)" }}/><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{l}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Require justification</div><div className="field-help">Users must explain why they need access (min 20 characters).</div></div>
                <Toggle value={true} onChange={() => {}}/>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>How are requests approved?</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Approval required</div><div className="field-help">When OFF, access is granted immediately when requested.</div></div>
                <Toggle value={approvalReq} onChange={setApprovalReq}/>
              </div>
              {!approvalReq && <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12px/1.4 var(--font-sans)" }}>⚠ No approval means no human oversight. Only use for low-risk resources.</div>}
              {approvalReq && (
                <>
                  <div>
                    <label className="field-label" style={{ marginBottom: 8 }}>Approval chain</label>
                    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", flex: "none" }}>1</div>
                        <Select value="admin" onChange={() => {}} options={[["admin","Security Admin"],["operator","Operator"],["auditor","Auditor Admin"]]}/>
                        <span className="t-small" style={{ color: "var(--fg-3)" }}>min</span>
                        <input className="input" type="number" defaultValue={1} style={{ width: 60 }}/>
                        <span className="t-small" style={{ color: "var(--fg-3)" }}>approval</span>
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: "var(--brand-fg)" }}><Icon name="plus" size={11}/> Add approver level</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><label className="field-label" style={{ marginBottom: 6 }}>Approve within</label><div style={{ display: "flex", gap: 8 }}><input className="input" type="number" defaultValue={2} style={{ width: 80 }}/><Select value="hours" onChange={() => {}} options={[["hours","hours"],["days","days"]]}/></div></div>
                    <div><label className="field-label" style={{ marginBottom: 6 }}>On SLA breach</label><Select value="escalate" onChange={() => {}} options={[["notify","Notify only"],["escalate","Escalate to next approver"],["reject","Auto-reject"],["approve","Auto-approve"]]}/></div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[["Require MFA when submitting a request","For the requester"],["Require MFA when approving","For the approver"]].map(([l,sub]) => (
                      <div key={l} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{l}</div><div className="field-help">{sub}</div></div>
                        <Toggle value={true} onChange={() => {}}/>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        {step > 1 && <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>}
        <div style={{ flex: 1 }}/>
        {step < 3 ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button> : <button className="btn btn-primary" onClick={onSave}>Save JIT policy</button>}
      </div>
    </div>
  );
};

// ==================== ACCESS REVIEW ====================
const AccessReviewTab = ({ empty, onToast }) => {
  const [showReview, setShowReview] = React.useState(false);
  const allocs = empty ? [] : ALLOC_DATA.flatMap(r => r.allocations.map(a => ({...a, resource: r.resource, resourceType: r.resourceType})));
  const risks = { noexit: allocs.filter(a => a.risk === "noexit").length, stale: allocs.filter(a => a.risk === "stale").length, expiring: allocs.filter(a => a.status === "expiring").length };
  const [revokeTarget, setRevokeTarget] = React.useState(null);
  const [decisions, setDecisions] = React.useState({});

  if (showReview) {
    const decide = (id, dec) => setDecisions(d => ({...d, [id]: dec}));
    const all = [...Object.values(decisions)];
    const approved = all.filter(d => d === "approve").length;
    const revoked = all.filter(d => d === "revoke").length;

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0, flex: 1 }}>Access Review — in progress</h2>
          <div style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>{approved} approved · {revoked} revoked · {allocs.length - all.length} not reviewed</div>
          <button className="btn btn-primary" style={{ marginLeft: 12 }} onClick={() => { setShowReview(false); onToast({ kind: "success", text: `Review complete — ${approved} kept, ${revoked} revoked` }); }}>Complete review</button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
          <table className="table">
            <thead><tr><th>User</th><th>Resource</th><th>Window</th><th>Status</th><th>Last accessed</th><th>Risk</th><th>Decision</th></tr></thead>
            <tbody>
              {allocs.map(a => (
                <tr key={a.id} style={{ background: decisions[a.id] === "approve" ? "var(--success-soft)" : decisions[a.id] === "revoke" ? "var(--danger-soft)" : "transparent" }}>
                  <td><div className="row">{a.userType === "user" ? <Avatar name={a.user} size={22}/> : <Icon name="people" size={14} color="var(--fg-3)"/>}<span style={{ fontWeight: 500, fontSize: 12.5 }}>{a.user}</span></div></td>
                  <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{a.resource}</td>
                  <td><WindowBadge type={a.windowType}/></td>
                  <td><AllocStatusBadge status={a.status}/></td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.lastAccessed}</td>
                  <td><RiskBadge risk={a.risk}/></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-sm" style={{ background: decisions[a.id] === "approve" ? "var(--success)" : "var(--bg-surface)", color: decisions[a.id] === "approve" ? "#fff" : "var(--fg-2)", borderColor: decisions[a.id] === "approve" ? "var(--success)" : "var(--border)" }} onClick={() => decide(a.id, "approve")}>✓ Keep</button>
                    <button className="btn btn-sm" style={{ background: decisions[a.id] === "revoke" ? "var(--danger)" : "var(--bg-surface)", color: decisions[a.id] === "revoke" ? "#fff" : "var(--fg-2)", borderColor: decisions[a.id] === "revoke" ? "var(--danger)" : "var(--border)", marginLeft: 6 }} onClick={() => decide(a.id, "revoke")}>✗ Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Access Review</div>
          <div style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>Identify and clean up over-privileged, stale, or permanent access.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!empty && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Last review: May 1, 2026 by Arjun Bansal</span>}
          <button className="btn btn-primary" onClick={() => setShowReview(true)}><Icon name="shield-check" size={12}/> Start new access review</button>
        </div>
      </div>

      {/* Risk signal cards */}
      <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="alert-triangle" label="Standing privileges (no expiry)" value={empty ? 0 : risks.noexit} tone={risks.noexit > 0 ? "danger" : "default"}/>
        <StatCard icon="clock" label="Stale access (30+ days unused)" value={empty ? 0 : risks.stale} tone={risks.stale > 0 ? "warning" : "default"}/>
        <StatCard icon="fire" label="Over-privileged" value={0} tone="default"/>
        <StatCard icon="bell" label="Expiring today" value={empty ? 0 : risks.expiring} tone={risks.expiring > 0 ? "warning" : "default"}/>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {allocs.length === 0 ? (
          <EmptyState icon="shield-check" title="No allocations to review" description="Once you create access allocations, they'll appear here for periodic review." action={<button className="btn btn-primary" onClick={() => setShowReview(true)}>Start access review</button>}/>
        ) : (
          <table className="table">
            <thead><tr>
              <th>User</th><th>Resource</th><th>Credential</th><th>Window type</th><th>Status</th><th>Last accessed</th><th>Risk signal</th><th>Age</th><th></th>
            </tr></thead>
            <tbody>{allocs.map(a => (
              <tr key={a.id} style={{ boxShadow: a.risk === "noexit" ? "inset 3px 0 var(--danger-fg)" : a.risk === "stale" ? "inset 3px 0 var(--warning-fg)" : "none", background: a.risk ? "color-mix(in oklch, var(--warning-fg) 3%, transparent)" : "transparent" }}>
                <td><div className="row">{a.userType === "user" ? <Avatar name={a.user} size={22}/> : <Icon name="people" size={14} color="var(--fg-3)"/>}<span style={{ fontWeight: 500, fontSize: 12.5 }}>{a.user}</span></div></td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{a.resource}</td>
                <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.cred}</td>
                <td><WindowBadge type={a.windowType}/></td>
                <td><AllocStatusBadge status={a.status}/></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{a.lastAccessed}</td>
                <td><RiskBadge risk={a.risk}/></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>Set May 1</td>
                <td style={{ textAlign: "right" }}>
                  {a.risk && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => setRevokeTarget(a.id)}>Revoke</button>}
                  {(a.status === "expiring") && <button className="btn btn-ghost btn-sm">Extend</button>}
                  <button className="btn btn-ghost btn-sm">Edit</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {revokeTarget && <RevokeModal target={revokeTarget} onClose={() => setRevokeTarget(null)} onConfirm={() => { setRevokeTarget(null); onToast({ kind: "success", text: "Access revoked" }); }}/>}
    </div>
  );
};

// ==================== REVOKE MODAL ====================
const RevokeModal = ({ target, onClose, onConfirm }) => {
  const [reason, setReason] = React.useState("");
  const [notify, setNotify] = React.useState(true);
  const hasActiveSession = target === "al-1";
  const isBulk = target === "bulk";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "92vw", background: "var(--bg-app)", borderRadius: 10, border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", zIndex: 101 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>
            {isBulk ? `Revoke ${target} allocations?` : "Revoke access?"}
          </h2>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: 0 }}>
            {isBulk ? "These allocations will be removed immediately." : "This user's access will be removed immediately."}
          </p>
          {hasActiveSession && (
            <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.4 var(--font-sans)" }}>
              ⚠ Priya Iyer has an active session right now. Revoking will terminate it immediately.
            </div>
          )}
          <div>
            <label className="field-label" style={{ marginBottom: 6 }}>Reason for revocation <span style={{ color: "var(--danger-fg)" }}>*</span></label>
            <textarea className="input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Project completed, access no longer needed"/>
            <div className="field-help" style={{ marginTop: 4 }}>Logged in audit trail and shown to the user in their notification.</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Notify user</div><div className="field-help">Send email notifying them of revocation.</div></div>
            <Toggle value={notify} onChange={setNotify}/>
          </div>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!reason.trim()} style={{ background: "var(--danger)", color: "#fff", borderColor: "var(--danger)", opacity: reason.trim() ? 1 : 0.5 }} onClick={() => { onConfirm(reason); }}>Revoke access</button>
        </div>
      </div>
    </>
  );
};

// ==================== SHARED PANEL WRAPPER ====================
const SlideinPanel = ({ title, sub, onClose, children, footer }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 90 }}/>
    <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 91, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <span className="h-card">{title}</span>
          {sub && <div className="t-small" style={{ color: "var(--fg-3)", marginTop: 4 }}>{sub}</div>}
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>{children}</div>
      {footer && <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>{footer}</div>}
    </aside>
  </>
);

// Expose RoleBadge if not already on window
const RoleBadge = window.RoleBadge || (({ role }) => {
  const m = { "Security Admin": { fg: "var(--danger-fg)", bg: "var(--danger-soft)" }, "Operator": { fg: "var(--brand-fg)", bg: "var(--brand-soft)" }, "Auditor Admin": { fg: "var(--success-fg)", bg: "var(--success-soft)" }, "End User": { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" } }[role] || { fg: "var(--fg-2)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{role}</span>;
});

window.AllocationScreenV2 = AllocationScreenV2;
window.WindowBadge = WindowBadge;
window.AllocStatusBadge = AllocStatusBadge;
window.RiskBadge = RiskBadge;
