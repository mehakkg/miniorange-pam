// Resource Detail V2 — 6 tabs (Overview, Credentials, Policy, Access, Sessions, Audit Trail)

const StatusBadge = ({ s }) => {
  const map = {
    reachable:   { bg: "var(--success-soft)", fg: "var(--success-fg)", dot: "var(--success)", label: "Reachable" },
    unreachable: { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  dot: "var(--danger)",  label: "Unreachable" },
    untested:    { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       dot: "var(--fg-4)",    label: "Untested" },
  };
  const m = map[s] || map.untested;
  return <span className="badge" style={{ background: m.bg, color: m.fg, borderColor: "transparent" }}>
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, marginRight: 6 }}/>{m.label}
  </span>;
};

const TabRow = ({ tab, setTab, items }) => (
  <div style={{ display: "flex", gap: 4, padding: "0 24px", borderBottom: "1px solid var(--border)" }}>
    {items.map(t => (
      <button key={t.id} onClick={() => setTab(t.id)} style={{
        padding: "10px 14px", marginBottom: -1, border: "none", background: "transparent",
        color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
        font: "500 13px/1 var(--font-sans)",
        borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      }}>{t.label}{t.count != null && <span className="badge">{t.count}</span>}</button>
    ))}
  </div>
);

const KV = ({ label, value, mono }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
    <span style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>{label}</span>
    <span className={mono ? "t-mono" : ""} style={{ font: `500 12.5px/1.3 var(--font-sans)`, color: "var(--fg-1)", textAlign: "right" }}>{value}</span>
  </div>
);

const ResourceDetailV2 = ({ resource, onBack }) => {
  const [tab, setTab] = React.useState("overview");
  const [confirmRevoke, setConfirmRevoke] = React.useState(null);
  const [showAllocate, setShowAllocate] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const r = { ...resource, port: resource.port || 22, conn: resource.conn || (resource.status === "rotation-failed" ? "unreachable" : "reachable") };

  const tabs = [
    { id: "overview",    label: "Overview",       weight: 1 },
    { id: "credentials", label: "Credentials",    weight: 2 },
    { id: "policy",      label: "Policy",         weight: 2 },
    { id: "access",      label: "Access",         weight: 2 },
    { id: "sessions",    label: "Sessions",       weight: 2, live: r.sessions || 0 },
    { separator: true },
    { id: "audit",       label: "Audit trail",    weight: 3 },
  ];

  const headerMenu = [
    { label: "Duplicate resource", icon: "copy",   onClick: () => setToast({ kind: "info", text: "Resource duplicated" }) },
    { label: "Export config (JSON)", icon: "download", onClick: () => setToast({ kind: "info", text: "Config exported" }) },
    { divider: true },
    { label: "Delete resource", icon: "trash", danger: true, onClick: () => setConfirmDelete(true) },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, fontSize: 12, color: "var(--fg-4)" }}>
          <a href="#" onClick={e => { e.preventDefault(); onBack(); }} style={{ color: "var(--fg-3)" }}>Resources</a>
          <Icon name="chevron-right" size={11}/><span style={{ color: "var(--fg-2)" }}>{r.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, paddingBottom: 14 }}>
          <ResourceTypeIcon type={r.type} size={44}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="h-title">{r.name}</h1>
            <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="badge" style={{ background: CRIT_STYLE[r.criticality].bg, color: CRIT_STYLE[r.criticality].fg, borderColor: "transparent", textTransform: "capitalize" }}>{r.criticality}</span>
              <span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span>
              <StatusBadge s={r.conn}/>
              <span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{r.host}:{r.port}</span>
            </div>
          </div>
          {!editing && <button className="btn" onClick={() => setToast({ kind: "success", text: `Connection to ${r.host}:${r.port} succeeded` })}><Icon name="check-circle" size={12}/> Test connection</button>}
          {!editing && <button className="btn" onClick={() => { setEditing(true); setTab("overview"); }}><Icon name="edit" size={12}/> Edit</button>}
          {editing && <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>}
          {editing && <button className="btn btn-primary" onClick={() => { setEditing(false); setToast({ kind: "success", text: "Resource updated" }); }}>Save changes</button>}
          {!editing && <button className="btn btn-primary" onClick={() => setShowAllocate(true)}><Icon name="plus" size={12}/> Allocate</button>}
          {!editing && <RowMenu items={headerMenu}/>}
        </div>
        <TabBar tabs={tabs} active={tab} onChange={setTab}/>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {tab === "overview" && <OverviewTab r={r} editing={editing}/>}
        {tab === "credentials" && <CredentialsTab r={r}/>}
        {tab === "policy" && <PolicyTab r={r}/>}
        {tab === "access" && <AccessTab r={r} onRevoke={setConfirmRevoke}/>}
        {tab === "sessions" && <SessionsTab r={r}/>}
        {tab === "audit" && <AuditTab r={r}/>}
      </div>

      {confirmRevoke && <RevokeModal user={confirmRevoke} resource={r.name} onClose={() => setConfirmRevoke(null)}/>}
      {showAllocate && <AllocatePanel resource={r} onClose={() => setShowAllocate(false)} onAllocated={() => setToast({ kind: "success", text: "Access allocated" })}/>}
      {confirmDelete && <ConfirmModal
        title={`Delete ${r.name}?`}
        body={`This will remove the resource and its access allocations. Active sessions will not be terminated immediately.`}
        warning={`${r.credCount || 0} credentials are linked to this resource. They will remain in the vault but will be unlinked.`}
        confirmLabel="Delete resource" danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { setToast({ kind: "success", text: `${r.name} deleted` }); onBack(); }}/>}
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

const OverviewTab = ({ r, editing }) => {
  const [draft, setDraft] = React.useState({
    host: r.host, port: r.port, owner: "Platform team",
    description: "Primary read/write database for the ledger service. PCI-scoped. Owned by Platform.",
    criticality: r.criticality, env: r.env, tags: "prod, fintech, pci", credLess: true, notes: "",
  });
  const edit = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  if (editing) return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="h-card">Edit resource details</span></div>
        <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="IP / host" required><input className="input t-mono" value={draft.host} onChange={e => edit("host", e.target.value)}/></Field>
          <Field label="Port" required><input className="input t-mono" type="number" value={draft.port} onChange={e => edit("port", +e.target.value)}/></Field>
          <Field label="Type" hint="Cannot be changed after creation"><div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface-2)", color: "var(--fg-3)" }}><Icon name="lock" size={11}/> {(TYPE_META[r.type] || {label: r.type}).label}</div></Field>
          <Field label="Source" hint="Cannot be changed after creation"><div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface-2)", color: "var(--fg-3)" }}><Icon name="lock" size={11}/> Manual</div></Field>
          <div style={{ gridColumn: "1/-1" }}><Field label="Description"><textarea className="input" rows={2} value={draft.description} onChange={e => edit("description", e.target.value)}/></Field></div>
          <Field label="Owner / team"><input className="input" value={draft.owner} onChange={e => edit("owner", e.target.value)}/></Field>
          <Field label="Tags"><input className="input" value={draft.tags} onChange={e => edit("tags", e.target.value)}/></Field>
          <div style={{ gridColumn: "1/-1" }}><Field label="Criticality"><Segmented value={draft.criticality} onChange={v => edit("criticality", v)} options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]}/></Field></div>
          <div style={{ gridColumn: "1/-1" }}><Field label="Environment"><Segmented value={draft.env} onChange={v => edit("env", v)} options={[{value:"production",label:"Production"},{value:"dev",label:"Dev"},{value:"test",label:"Test"},{value:"staging",label:"Staging"}]}/></Field></div>
          <div style={{ gridColumn: "1/-1", padding: 12, background: "var(--bg-surface-2)", borderRadius: 6 }}><Toggle value={draft.credLess} onChange={v => edit("credLess", v)} label="Credential-less access" hint="Users connect via proxy injection. Passwords are never shown."/></div>
          <div style={{ gridColumn: "1/-1" }}><Field label="Notes"><textarea className="input" rows={2} value={draft.notes} onChange={e => edit("notes", e.target.value)}/></Field></div>
        </div>
      </div>
      <div className="card" style={{ padding: 16, background: "var(--bg-surface-2)" }}>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Edit mode</div>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Editable fields are highlighted. Locked fields (Type, Source, Created date) cannot be changed after creation.</div>
      </div>
    </div>
  );

  return (
  <div style={{ padding: 24, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 16 }}>
    <div className="card">
      <div className="card-header"><span className="h-card">Resource details</span></div>
      <div style={{ padding: "8px 20px 20px" }}>
        <KV label="IP / host" value={r.host} mono/>
        <KV label="Port" value={r.port} mono/>
        <KV label="Type" value={(TYPE_META[r.type] || {label: r.type}).label}/>
        <KV label={r.type === "database" ? "Database app" : "OS"} value={r.os}/>
        <KV label="Owner" value="Platform team"/>
        <KV label="Tags" value="prod, fintech, pci"/>
        <KV label="Description" value="Primary read/write database for the ledger service. PCI-scoped. Owned by Platform."/>
        <KV label="Created" value="Mar 14, 2025 by Aria Chen"/>
        <KV label="Last modified" value="Apr 28, 2025 by Marcus Chen"/>
      </div>
    </div>    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="card-header"><span className="h-card">Connection</span></div>
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <StatusBadge s={r.conn}/>
            <button className="btn btn-sm">Test now</button>
          </div>
          <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>Last tested 4 minutes ago</div>
          {r.conn === "unreachable" && (
            <div style={{ background: "var(--danger-soft)", border: "1px solid transparent", borderRadius: 6, padding: 12, fontSize: 12.5, color: "var(--danger-fg)" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Connection refused on port {r.port}</div>
              <div>Verify the host is online and that PAM's outbound rules allow {r.port}/tcp from the proxy network.</div>
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Security posture</span></div>
        <div style={{ padding: "8px 18px 16px" }}>
          <KV label="Credential-less" value={<span style={{ color: "var(--success-fg)" }}>Enabled</span>}/>
          <KV label="Recording" value={<span style={{ color: "var(--success-fg)" }}>Enabled</span>}/>
          <KV label="MFA enforcement" value={<span style={{ color: "var(--success-fg)" }}>Required</span>}/>
          <KV label="Criticality" value={<span style={{ textTransform: "capitalize", color: CRIT_STYLE[r.criticality].fg }}>{r.criticality}</span>}/>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Activity</span></div>
        <div style={{ padding: "8px 18px 16px" }}>
          <KV label="Active sessions" value={r.sessions > 0 ? <span style={{ color: "var(--success-fg)" }}>{r.sessions} active</span> : "0"}/>
          <KV label="Sessions today" value="14"/>
          <KV label="Last accessed" value={`${r.lastAccessed || "2h ago"} by Priya Iyer`}/>
          <KV label="Next rotation" value={r.status === "rotation-failed" ? <span style={{ color: "var(--danger-fg)" }}>Overdue</span> : "in 12 days"}/>
        </div>
      </div>
    </div>
  </div>
  );
};

const CredentialsTab = ({ r }) => {
  const creds = (window.SEED_CREDENTIALS || []).filter(c => c.resource === r.name);
  const display = creds.length > 0 ? creds : [
    { id: "c1", display: "root-primary", type: "Password", username: "root", lastRotated: "12 days ago", strength: "strong", rotation: "30d" },
    { id: "c2", display: "ssh-deploy",   type: "SSH key",  username: "deploy", lastRotated: "3 days ago", strength: "strong", rotation: "90d" },
  ];
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="h-card">Attached credentials</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm">Attach existing</button>
          <button className="btn btn-sm btn-primary"><Icon name="plus" size={11}/> Create new</button>
        </div>
        <table className="table">
          <thead><tr><th>Display name</th><th>Type</th><th>Username</th><th>Admin account</th><th>Rotation</th><th>Last rotated</th><th>Status</th><th></th></tr></thead>
          <tbody>{display.map(c => (
            <tr key={c.id}>
              <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name={c.type === "SSH key" ? "key" : c.type === "API key" ? "hash" : "lock"} size={13} color="var(--brand-fg)"/>
                <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display}</span>
              </div></td>
              <td><span className="badge">{c.type}</span></td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
                {"•".repeat(Math.min(c.username.length, 8))}<button className="btn btn-ghost btn-sm" style={{ padding: "0 4px", marginLeft: 4 }}><Icon name="eye" size={12}/></button>
              </td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>root-rotator</td>
              <td>Every {c.rotation || "30d"}</td>
              <td>{c.lastRotated}</td>
              <td>{c.strength === "stale" ? <span className="badge badge-warning">Rotation overdue</span> : <span className="badge badge-success">Active</span>}</td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-ghost btn-sm">Test</button>
                <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="card" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)" }}>
        <div className="card-header" style={{ background: "transparent" }}>
          <Icon name="shield" size={14} color="var(--warning-fg)"/>
          <span className="h-card">Reconciliation credential</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm">Attach</button>
        </div>
        <div style={{ padding: "0 20px 16px", font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          PAM uses this account to rotate credentials if the primary becomes invalid. <span style={{ color: "var(--fg-4)" }}>None attached.</span>
        </div>
      </div>
    </div>
  );
};

const PolicyTab = ({ r }) => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon name="policies" size={18}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ font: "600 14.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Production SSH access</span>
            <span className="badge">SSH</span>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <PolKV label="Recording" value="On" ok/>
            <PolKV label="MFA" value="Required" ok/>
            <PolKV label="Idle timeout" value="15 min"/>
            <PolKV label="Livestream" value="Off" off/>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn btn-sm">Edit policy</button>
          <button className="btn btn-sm btn-ghost">Detach</button>
        </div>
      </div>
    </div>
    <div className="card">
      <div className="card-header"><span className="h-card">Command restrictions</span></div>
      <div style={{ padding: "12px 20px 18px" }}>
        <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 8 }}>The following commands are blocked from execution during sessions on this resource.</div>
        <div className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)", background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 6, padding: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          <div>rm -rf /</div><div>shutdown</div><div>dd if=/dev/zero</div><div>mkfs.*</div>
        </div>
      </div>
    </div>
  </div>
);

const PolKV = ({ label, value, ok, off }) => (
  <div>
    <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>{label}</div>
    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: ok ? "var(--success-fg)" : off ? "var(--fg-4)" : "var(--fg-1)", display: "flex", alignItems: "center", gap: 5 }}>
      {ok && <span className="dot dot-success"/>}{off && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg-4)" }}/>}
      {value}
    </div>
  </div>
);

const AccessTab = ({ r, onRevoke }) => {
  const [filter, setFilter] = React.useState("all");
  const allocations = [
    { name: "Priya Iyer",     type: "User",  via: "Direct",       cred: "root-primary", win: "Anytime", winType: "lifelong", status: "active" },
    { name: "DevOps team",    type: "Group", via: "Via group",    cred: "ssh-deploy",   win: "Mon–Fri 09:00–19:00", winType: "hours", status: "active" },
    { name: "Marcus Chen",    type: "User",  via: "Direct",       cred: "root-primary", win: "Expires in 2h", winType: "custom", status: "expiring" },
    { name: "DBA leads",      type: "Role",  via: "Via role",     cred: "root-primary", win: "Anytime", winType: "lifelong", status: "active" },
    { name: "On-call rotation", type: "Group", via: "Inherited", cred: "ssh-deploy",   win: "Anytime", winType: "lifelong", status: "active" },
    { name: "Dana Whitley",   type: "User",  via: "Direct",       cred: "—", win: "Pending TKT-2104", winType: "zeroday", status: "pending" },
  ];
  const filtered = filter === "all" ? allocations : allocations.filter(a => a.status === filter || (filter === "groups" && a.type === "Group") || (filter === "direct" && a.via === "Direct"));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[["all","All"],["active","Active"],["expiring","Expiring"],["pending","Pending"],["groups","Groups only"],["direct","Direct only"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 12px", border: "none", borderRadius: 6, cursor: "pointer",
            background: filter === v ? "var(--brand-soft)" : "transparent",
            color: filter === v ? "var(--brand-fg)" : "var(--fg-3)",
            font: "500 12.5px/1 var(--font-sans)",
          }}>{l}</button>
        ))}
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm btn-primary"><Icon name="plus" size={11}/> Add allocation</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Subject</th><th>Type</th><th>Source</th><th>Credential</th><th>Access window</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map((a, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {a.type === "User" ? <Avatar name={a.name} size={22}/> : <Icon name={a.type === "Role" ? "shield" : "people"} size={14} color="var(--fg-3)"/>}
                  <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.name}</span>
                </div>
              </td>
              <td><span className="badge">{a.type}</span></td>
              <td style={{ fontSize: 12, color: "var(--fg-3)" }}>{a.via}</td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.cred}</td>
              <td style={{ fontSize: 12.5, color: a.status === "expiring" ? "var(--warning-fg)" : "var(--fg-2)" }}>{a.win}</td>
              <td>
                {a.status === "active" && <span className="badge badge-success">Active</span>}
                {a.status === "expiring" && <span className="badge badge-warning">Expiring soon</span>}
                {a.status === "pending" && <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-fg)", borderColor: "transparent" }}>Pending ticket</span>}
              </td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-ghost btn-sm">Edit</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => onRevoke(a.name)}>Revoke</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const SessionsTab = ({ r }) => {
  const [sub, setSub] = React.useState("live");
  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ display: "flex", gap: 4, padding: "16px 0 0" }}>
        {[["live","Live"],["history","History"]].map(([v, l]) => (
          <button key={v} onClick={() => setSub(v)} style={{
            padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: sub === v ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${sub === v ? "var(--brand)" : "transparent"}`,
            cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>
      <div style={{ paddingTop: 16, paddingBottom: 24 }}>
        {sub === "live" && (r.sessions > 0 ? (
          <div className="card">
            <table className="table">
              <thead><tr><th>User</th><th>Credential</th><th>Connect method</th><th>Started</th><th>Duration</th><th>Recording</th><th></th></tr></thead>
              <tbody>
                {Array.from({length: r.sessions}).map((_, i) => (
                  <tr key={i}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={["Priya Iyer","Marcus Chen"][i%2]} size={22}/><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{["Priya Iyer","Marcus Chen"][i%2]}</span></div></td>
                    <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>root-primary</td>
                    <td><span className="badge">Web SSH</span></td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{12 + i*8} min ago</td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{12 + i*8}m {i*7}s</td>
                    <td><span className="badge badge-success"><span className="dot dot-success pulse-dot"/> Recording</span></td>
                    <td style={{ textAlign: "right" }}><button className="btn btn-sm" style={{ color: "var(--danger-fg)" }}>Terminate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", border: "1px dashed var(--border)", borderRadius: 8, background: "var(--bg-surface)" }}>
            <Icon name="sessions" size={28} color="var(--fg-4)"/>
            <div style={{ marginTop: 10, font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>No active sessions right now</div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--fg-4)" }}>Last accessed {r.lastAccessed || "2 hours ago"} by Priya Iyer</div>
          </div>
        ))}
        {sub === "history" && (
          <div className="card">
            <table className="table">
              <thead><tr><th>User</th><th>Credential</th><th>Method</th><th>Start</th><th>Duration</th><th>Commands</th><th>Recording</th><th></th></tr></thead>
              <tbody>
                {[
                  ["Priya Iyer","root-primary","Web SSH","Apr 28 14:22","18m 04s","42","Saved","completed"],
                  ["Marcus Chen","root-primary","Web SSH","Apr 28 11:08","6m 41s","12","Saved","completed"],
                  ["Dana Whitley","ssh-deploy","Native SSH","Apr 27 16:51","2m 02s","3","—","terminated"],
                  ["Aria Chen","root-primary","Web SSH","Apr 27 09:14","42m 18s","118","Saved","completed"],
                ].map((row, i) => (
                  <tr key={i}>
                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={row[0]} size={22}/><span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{row[0]}</span></div></td>
                    <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{row[1]}</td>
                    <td><span className="badge">{row[2]}</span></td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{row[3]}</td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{row[4]}</td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{row[5]}</td>
                    <td>{row[6] === "Saved" ? <span className="badge badge-success">Saved</span> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                    <td style={{ textAlign: "right" }}>
                      {row[6] === "Saved" && <button className="btn btn-ghost btn-sm"><Icon name="play" size={11}/> Playback</button>}
                      <button className="btn btn-ghost btn-sm">Export</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AuditTab = ({ r }) => {
  const events = [
    { ts: "Apr 28 14:22:11", type: "Session started",     actor: "Priya Iyer",   detail: "Connected via Web SSH using root-primary", ip: "192.168.42.18" },
    { ts: "Apr 28 11:14:08", type: "Credential rotated",  actor: "PAM system",   detail: "root-primary auto-rotated (30d schedule)", ip: "—" },
    { ts: "Apr 28 09:02:55", type: "Policy updated",      actor: "Aria Chen",    detail: "Idle timeout changed from 30 → 15 minutes", ip: "10.0.4.12" },
    { ts: "Apr 27 16:51:03", type: "Session terminated",  actor: "Aria Chen",    detail: "Force-terminated session for Dana Whitley — reason: 'unauthorized command attempt'", ip: "10.0.4.12" },
    { ts: "Apr 27 14:38:24", type: "Access granted",      actor: "Aria Chen",    detail: "Allocated lifelong access to DBA leads (role)", ip: "10.0.4.12" },
    { ts: "Apr 26 10:11:09", type: "Connection tested",   actor: "Marcus Chen",  detail: "Test successful — 4ms latency", ip: "10.0.4.41" },
    { ts: "Apr 25 18:44:52", type: "Access revoked",      actor: "Aria Chen",    detail: "Removed contractor-lin from access list — reason: 'engagement ended'", ip: "10.0.4.12" },
  ];
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <FilterDropdown label="Event type" value="any" onChange={() => {}} options={[["any","Any"],["session","Session events"],["policy","Policy changes"],["access","Access changes"]]}/>
        <FilterDropdown label="Actor" value="any" onChange={() => {}} options={[["any","Any"]]}/>
        <FilterDropdown label="Date" value="7d" onChange={() => {}} options={[["7d","Last 7 days"],["30d","Last 30 days"],["custom","Custom"]]}/>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm"><Icon name="download" size={11}/> Export trail</button>
      </div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Timestamp</th><th>Event</th><th>Actor</th><th>Details</th><th>IP</th></tr></thead>
          <tbody>{events.map((e, i) => (
            <tr key={i}>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{e.ts}</td>
              <td><span className="badge" style={{
                background: e.type.startsWith("Session terminated") || e.type.startsWith("Access revoked") ? "var(--danger-soft)" : e.type.startsWith("Credential") ? "var(--brand-soft)" : "var(--bg-surface-2)",
                color: e.type.startsWith("Session terminated") || e.type.startsWith("Access revoked") ? "var(--danger-fg)" : e.type.startsWith("Credential") ? "var(--brand-fg)" : "var(--fg-2)",
                borderColor: "transparent",
              }}>{e.type}</span></td>
              <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{e.actor}</td>
              <td style={{ fontSize: 12.5, color: "var(--fg-2)", maxWidth: 420 }}>{e.detail}</td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{e.ip}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const RevokeModal = ({ user, resource, onClose }) => {
  const [reason, setReason] = React.useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: 460, background: "var(--bg-app)", borderRadius: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Revoke access for {user}?</h2>
        </div>
        <div style={{ padding: 20 }}>
          <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)", margin: "0 0 14px" }}>
            This will immediately end any active sessions and remove their access to <strong>{resource}</strong>.
          </p>
          <Field label="Reason for revocation" required>
            <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. employment ended, scope creep, finished project"/>
          </Field>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={!reason.trim()} style={{ background: "var(--danger)", color: "#fff", borderColor: "transparent", opacity: reason.trim() ? 1 : 0.5 }}>Revoke access</button>
        </div>
      </div>
    </div>
  );
};

window.ResourceDetailV2 = ResourceDetailV2;
