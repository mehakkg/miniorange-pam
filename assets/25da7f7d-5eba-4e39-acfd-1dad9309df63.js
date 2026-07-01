// Resources, Credentials, People screens

// ============ Shared list-view chrome ============
const ListToolbar = ({ search, onSearch, filterLabels = [], rightExtras }) => (
  <div style={{
    padding: "12px 20px", borderBottom: "1px solid var(--border)",
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
  }}>
    <div style={{ position: "relative", width: 280 }}>
      <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
      <input className="input" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
    </div>
    {filterLabels.map((f, i) => (
      <button key={i} className="btn btn-sm" style={{ height: 32, padding: "0 10px" }}>
        <Icon name="plus" size={11}/> {f}
      </button>
    ))}
    <div style={{ flex: 1 }}/>
    {rightExtras}
    <button className="btn btn-sm"><Icon name="filter" size={11}/> Filter</button>
    <button className="btn btn-sm"><Icon name="columns" size={11}/> Columns</button>
  </div>
);

const useFiltered = (rows, q, fields) => React.useMemo(() => {
  if (!q) return rows;
  const lower = q.toLowerCase();
  return rows.filter(r => fields.some(f => String(r[f]||"").toLowerCase().includes(lower)));
}, [rows, q, fields]);

// ============ Resources ============
const ResourcesScreen = ({ empty, onOpen }) => {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState(new Set());
  const rows = empty ? [] : useFiltered(SEED_RESOURCES, q, ["name","host","type","env"]);
  const allChecked = rows.length > 0 && rows.every(r => selected.has(r.id));
  const toggleAll = () => setSelected(s => new Set(allChecked ? [] : rows.map(r => r.id)));
  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        title="Resources"
        description="Servers, databases, web apps, and cloud workloads protected by PAM. The anchor entity — credentials, policies, and access all attach here."
        actions={<>
          <button className="btn"><Icon name="upload" size={13}/> Import CSV</button>
          <button className="btn btn-primary"><Icon name="plus" size={13}/> Add resource</button>
        </>}
      />
      <ListToolbar search={q} onSearch={setQ} filterLabels={["Type","Environment","Criticality","Tag"]}
        rightExtras={selected.size > 0 && <>
          <span className="t-tiny">{selected.size} selected</span>
          <button className="btn btn-sm">Bulk allocate</button>
          <button className="btn btn-sm">Apply policy</button>
        </>}
      />
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState icon="resources" title="No resources yet"
            description="Resources are the servers, databases, and apps PAM protects. Add one manually or run a discovery scan."
            action={<div style={{ display: "flex", gap: 8 }}>
              <button className="btn"><Icon name="discovery" size={13}/> Run discovery</button>
              <button className="btn btn-primary"><Icon name="plus" size={13}/> Add resource</button>
            </div>}
          />
        ) : (
          <table className="table">
            <thead><tr>
              <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
              <th>Resource</th><th>Type</th><th>Environment</th><th>Criticality</th><th>Credentials</th><th>Active</th><th>Status</th><th>Rotation</th><th></th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} onClick={() => onOpen(r)} style={{ cursor: "pointer" }}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} style={{ accentColor: "var(--brand)" }}/></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <ResourceTypeIcon type={r.type} size={28}/>
                      <div>
                        <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div>
                        <div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{r.host}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
                  <td style={{ textTransform: "capitalize", color: "var(--fg-2)" }}>{r.env}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.criticality === "critical" ? "var(--danger-soft)" : r.criticality === "high" ? "var(--warning-soft)" : "var(--bg-surface-2)",
                      color: r.criticality === "critical" ? "var(--danger-fg)" : r.criticality === "high" ? "var(--warning-fg)" : "var(--fg-3)",
                      borderColor: "transparent", textTransform: "capitalize",
                    }}>{r.criticality}</span>
                  </td>
                  <td style={{ color: "var(--fg-2)" }}>{r.credCount}</td>
                  <td>{r.sessions > 0 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span className="dot dot-success pulse-dot"/>{r.sessions}</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                  <td>
                    {r.status === "healthy" && <span className="badge badge-success">Healthy</span>}
                    {r.status === "rotation-failed" && <span className="badge badge-danger">Rotation failed</span>}
                    {r.status === "stale-cred" && <span className="badge badge-warning">Stale credential</span>}
                  </td>
                  <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{r.rotation}</td>
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                    <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 0 && (
          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", color: "var(--fg-4)", fontSize: 12 }}>
            <span>Showing {rows.length} of {SEED_RESOURCES.length} resources</span>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-sm btn-ghost">Previous</button>
            <button className="btn btn-sm btn-ghost">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ Resource Detail ============
const ResourceDetail = ({ resource, onBack }) => {
  const [tab, setTab] = React.useState("overview");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 12, color: "var(--fg-4)" }}>
          <a href="#" onClick={e => { e.preventDefault(); onBack(); }} style={{ color: "var(--fg-3)" }}>Resources</a>
          <Icon name="chevron-right" size={11}/><span style={{ color: "var(--fg-2)" }}>{resource.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: 16 }}>
          <ResourceTypeIcon type={resource.type} size={40}/>
          <div style={{ flex: 1 }}>
            <h1 className="h-title">{resource.name}</h1>
            <div style={{ marginTop: 4, display: "flex", gap: 12, fontSize: 12.5, color: "var(--fg-3)" }}>
              <span className="t-mono">{resource.host}</span>·<span style={{ textTransform: "capitalize" }}>{resource.env}</span>·<span>{resource.os}</span>
            </div>
          </div>
          <button className="btn"><Icon name="play" size={12}/> Launch session</button>
          <button className="btn btn-primary"><Icon name="plus" size={12}/> Allocate access</button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["overview","credentials","policies","access","sessions","audit"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
              color: tab === t ? "var(--fg-1)" : "var(--fg-3)",
              font: "500 13px/1 var(--font-sans)", textTransform: "capitalize",
              borderBottom: `2px solid ${tab === t ? "var(--brand)" : "transparent"}`,
              cursor: "pointer",
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="h-card">Attached credentials</span><div style={{ flex: 1 }}/><button className="btn btn-sm"><Icon name="plus" size={11}/> Attach</button></div>
            <div>
              {SEED_CREDENTIALS.filter(c => c.resource === resource.name).map((c, i) => (
                <div key={c.id} style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={c.type === "SSH key" ? "key" : c.type === "API key" ? "hash" : "lock"} size={14}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display}</div>
                    <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{c.type} · {c.username} · rotates every {c.rotation}</div>
                  </div>
                  {c.error ? <span className="badge badge-danger">Failed</span> : <span className="badge badge-success">OK</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="h-card">Policies & rotation</span></div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <DetailRow label="Access policy"  value="Production SSH Access" link/>
              <DetailRow label="Rotation policy" value={`Every ${resource.rotation} · automatic`}/>
              <DetailRow label="Session recording" value="On (mandatory)"/>
              <DetailRow label="JIT required" value="Yes · 2-step approval"/>
              <DetailRow label="Break-glass" value="Enabled · 4h auto-expire"/>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="h-card">Allocated users & groups</span><div style={{ flex: 1 }}/><span className="t-tiny">5 direct · 14 inherited via groups</span></div>
          <table className="table">
            <thead><tr><th>Subject</th><th>Type</th><th>Access window</th><th>Expires</th><th>Source</th><th></th></tr></thead>
            <tbody>
              {[
                { name: "Priya Iyer", type: "User", win: "Anytime", exp: "—", src: "Direct" },
                { name: "devops", type: "Group", win: "Mon–Fri 09:00–19:00", exp: "—", src: "Direct" },
                { name: "Marcus Chen", type: "User", win: "Anytime", exp: "in 2h", src: "JIT TKT-2104" },
                { name: "on-call", type: "Group", win: "Anytime", exp: "—", src: "Inherited" },
              ].map((r, i) => (
                <tr key={i}>
                  <td><div className="row">{r.type === "User" ? <Avatar name={r.name} size={20}/> : <Icon name="people" size={14} color="var(--fg-3)"/>}<span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.name}</span></div></td>
                  <td><span className="badge">{r.type}</span></td>
                  <td style={{ color: "var(--fg-2)" }}>{r.win}</td>
                  <td><span className="t-tiny" style={{ color: r.exp.includes("h") ? "var(--warning-fg)" : "var(--fg-4)" }}>{r.exp}</span></td>
                  <td style={{ color: "var(--fg-3)" }}>{r.src}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, link }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
    <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{label}</span>
    <span style={{ font: "500 13px/1.3 var(--font-sans)", color: link ? "var(--brand-fg)" : "var(--fg-1)", textAlign: "right" }}>{value}</span>
  </div>
);

// ============ Credentials ============
const CredentialsScreen = ({ empty }) => {
  const [q, setQ] = React.useState("");
  const rows = empty ? [] : useFiltered(SEED_CREDENTIALS, q, ["display","resource","username","type"]);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Credentials" description="Vaulted secrets — passwords, SSH keys, API tokens. Users never see raw values." actions={<>
        <button className="btn"><Icon name="refresh" size={13}/> Rotate all due</button>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Add credential</button>
      </>}/>
      <ListToolbar search={q} onSearch={setQ} filterLabels={["Type","Resource","Strength"]}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState icon="credentials" title="The vault is empty" description="Add a credential and attach it to a resource. PAM will store it encrypted and rotate it on schedule."
            action={<button className="btn btn-primary"><Icon name="plus" size={13}/> Add credential</button>}/>
        ) : (
          <table className="table">
            <thead><tr><th>Display name</th><th>Type</th><th>Resource</th><th>Username</th><th>Last rotated</th><th>Strength</th><th>Used (30d)</th><th></th></tr></thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="row"><Icon name={c.type === "SSH key" ? "key" : c.type === "API key" ? "hash" : "lock"} size={14} color="var(--brand-fg)"/>
                      <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{c.display}</span>
                      {c.error && <Icon name="alert-circle" size={13} color="var(--danger-fg)"/>}
                    </div>
                  </td>
                  <td><span className="badge">{c.type}</span></td>
                  <td><span className="t-mono" style={{ color: "var(--fg-2)" }}>{c.resource}</span></td>
                  <td className="t-mono" style={{ color: "var(--fg-3)" }}>{c.username}</td>
                  <td style={{ color: c.error ? "var(--danger-fg)" : "var(--fg-2)", fontWeight: c.error ? 500 : 400 }}>{c.lastRotated}</td>
                  <td>
                    {c.strength === "strong" && <span className="badge badge-success">Strong</span>}
                    {c.strength === "moderate" && <span className="badge badge-warning">Moderate</span>}
                    {c.strength === "stale" && <span className="badge badge-danger">Stale</span>}
                    {c.strength === "—" && <span style={{ color: "var(--fg-4)" }}>—</span>}
                  </td>
                  <td style={{ color: "var(--fg-2)" }}>{c.used}</td>
                  <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============ People (Users + Groups merged) ============
const PeopleScreen = ({ empty }) => {
  const [tab, setTab] = React.useState("users");
  const [q, setQ] = React.useState("");
  const userRows = empty ? [] : useFiltered(SEED_PEOPLE, q, ["name","email","role"]);
  const groupRows = empty ? [] : useFiltered(SEED_GROUPS, q, ["name","role"]);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="People" description="All users and groups with access to PAM — synced from your directory and merged with local accounts."
        actions={<><button className="btn"><Icon name="refresh" size={13}/> Re-sync directory</button><button className="btn btn-primary"><Icon name="plus" size={13}/> Add {tab === "users" ? "user" : "group"}</button></>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {["users","groups"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)", textTransform: "capitalize",
            borderBottom: `2px solid ${tab === t ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>{t} <span className="badge">{t === "users" ? SEED_PEOPLE.length : SEED_GROUPS.length}</span></button>
        ))}
      </div>
      <ListToolbar search={q} onSearch={setQ} filterLabels={tab === "users" ? ["Role","Group","Status","MFA"] : ["Source","Role"]}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {(tab === "users" ? userRows : groupRows).length === 0 ? (
          <EmptyState icon="people" title={`No ${tab} yet`} description="Connect a directory in Identity config or add accounts manually."
            action={<button className="btn btn-primary"><Icon name="plus" size={13}/> Add {tab === "users" ? "user" : "group"}</button>}/>
        ) : tab === "users" ? (
          <table className="table">
            <thead><tr><th>User</th><th>Role</th><th>Groups</th><th>MFA</th><th>Status</th><th>Last login</th><th></th></tr></thead>
            <tbody>{userRows.map(u => (
              <tr key={u.id}>
                <td><div className="row"><Avatar name={u.name} size={26}/><div><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{u.name}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{u.email}</div></div></div></td>
                <td><span className="badge" style={{ background: u.role === "Security Admin" ? "var(--danger-soft)" : u.role === "Auditor" ? "var(--success-soft)" : "var(--brand-soft)", color: u.role === "Security Admin" ? "var(--danger-fg)" : u.role === "Auditor" ? "var(--success-fg)" : "var(--brand-fg)", borderColor: "transparent" }}>{u.role}</span></td>
                <td style={{ color: "var(--fg-3)" }}>{u.groups.join(", ")}</td>
                <td>{u.mfa ? <span className="badge badge-success"><Icon name="check" size={10}/> Enrolled</span> : <span className="badge badge-warning">Not enrolled</span>}</td>
                <td>{u.status === "active" ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Suspended</span>}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{u.lastLogin}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table className="table">
            <thead><tr><th>Group</th><th>Members</th><th>Default role</th><th>Source</th><th></th></tr></thead>
            <tbody>{groupRows.map(g => (
              <tr key={g.id}>
                <td><div className="row"><Icon name="people" size={14} color="var(--fg-3)"/><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{g.name}</span></div></td>
                <td style={{ color: "var(--fg-2)" }}>{g.members}</td>
                <td><span className="badge">{g.role}</span></td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{g.source}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={14}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

window.ListToolbar = ListToolbar;
window.useFiltered = useFiltered;
window.ResourcesScreen = ResourcesScreen;
window.ResourceDetail = ResourceDetail;
window.CredentialsScreen = CredentialsScreen;
window.PeopleScreen = PeopleScreen;
