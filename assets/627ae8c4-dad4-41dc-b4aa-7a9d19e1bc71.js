// People — Add User panel (5 sections + success), User detail panel (4 sections), Sync Errors panel

// ===== ADD USER PANEL =====
const PeopleAddUserPanel = ({ onClose, onCreated }) => {
  const [success, setSuccess] = React.useState(false);
  const [data, setData] = React.useState({
    name: "", email: "", phone: "",
    role: "", groups: [],
    loginMethod: "Password", sendWelcome: true,
    enforceMFA: false,
    extra: { Department: "", "Employee ID": "", "On-call rotation": false },
  });
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const e = {};
    if (!data.name.trim()) e.name = "Full name is required.";
    if (!data.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email address.";
    if (!data.role) e.role = "Select a role.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => { if (validate()) { setSuccess(true); onCreated?.(data); } };

  if (success) return <Panel title="User added" onClose={onClose}>
    <div style={{ padding: 28, maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><Icon name="check" size={26}/></div>
      <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.name} added to PAM</div>
      {data.sendWelcome && data.loginMethod !== "SSO" && <div style={{ marginTop: 8, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Welcome email sent to {data.email}</div>}
      <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onClose}>View user profile</button>
        <button className="btn" onClick={() => { setData({ name: "", email: "", phone: "", role: "", groups: [], loginMethod: "Password", sendWelcome: true, enforceMFA: false, extra: { Department: "", "Employee ID": "", "On-call rotation": false } }); setSuccess(false); setErrors({}); }}>Add another user</button>
      </div>
    </div>
  </Panel>;

  const allRoles = [...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])];
  const allGroups = window.PEOPLE_GROUPS || [];

  return <Panel title="Add User" onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 760, margin: "0 auto", width: "100%" }}>

      <SectionLabel>Section 1 · Identity</SectionLabel>
      <Field label="Full name" required error={errors.name}>
        <input className="input" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Priya Sharma"/>
      </Field>
      <Field label="Email address" required error={errors.email}>
        <input className="input" value={data.email} onChange={e => setData({...data, email: e.target.value})} placeholder="priya@securecorp.com"/>
      </Field>
      <Field label="Phone number">
        <input className="input" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} placeholder="+91 90000 00000"/>
      </Field>

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }}/>
      <SectionLabel>Section 2 · Role <span style={{ color: "var(--danger-fg)" }}>*</span></SectionLabel>
      {errors.role && <div style={{ font: "500 11.5px/1.4 var(--font-sans)", color: "var(--danger-fg)", marginBottom: 8 }}>{errors.role}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {allRoles.map(r => {
          const active = data.role === r.display;
          return <button key={r.id} type="button" onClick={() => setData({...data, role: r.display})} style={{
            padding: 12, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
            background: active ? "var(--brand-soft)" : "var(--bg-surface)",
            borderRadius: 6, cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-1)", marginBottom: 4 }}>{r.display}{!r.system && <span style={{ marginLeft: 6, font: "500 10px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Custom</span>}</div>
            <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>{r.desc}</div>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 8 }}>{r.users} user{r.users === 1 ? "" : "s"}</div>
          </button>;
        })}
      </div>

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }}/>
      <SectionLabel>Section 3 · Groups</SectionLabel>
      <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
        {data.groups.map(g => <span key={g} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>
          {g}
          <button onClick={() => setData({...data, groups: data.groups.filter(x => x !== g)})} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button>
        </span>)}
        <Select value="" onChange={v => { if (v && !data.groups.includes(v)) setData({...data, groups: [...data.groups, v]}); }} options={[["", "Search groups…"], ...allGroups.filter(g => !data.groups.includes(g.display)).map(g => [g.display, g.display])]}/>
      </div>

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }}/>
      <SectionLabel>Section 4 · Login method <span style={{ color: "var(--danger-fg)" }}>*</span></SectionLabel>
      <Segmented value={data.loginMethod} onChange={v => setData({...data, loginMethod: v})}
        options={[{value:"Password",label:"Password"},{value:"SSO",label:"SSO"},{value:"Both",label:"Both"}]}/>
      {data.loginMethod !== "SSO" && (
        <div className="card" style={{ marginTop: 12, padding: 12, background: "var(--bg-surface-2)" }}>
          <Toggle value={data.sendWelcome} onChange={v => setData({...data, sendWelcome: v})} label="Send welcome email with setup link" hint="User will be prompted to set their password on first login."/>
        </div>
      )}
      {data.loginMethod !== "Password" && (
        <div style={{ marginTop: 12, padding: 12, background: "var(--brand-soft)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
          User will log in via <strong>Okta SSO</strong> (configured in Identity Config → Authentication).
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }}/>
      <SectionLabel>Section 5 · MFA</SectionLabel>
      <Toggle value={data.enforceMFA} onChange={v => setData({...data, enforceMFA: v})} label="Enforce MFA" hint="User must configure MFA before accessing any resource."/>
      {data.enforceMFA && (
        <div style={{ marginTop: 10, padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
          MFA method inherits org-level setting: <strong style={{ color: "var(--fg-1)" }}>TOTP authenticator app</strong>.
        </div>
      )}

      {(window.PROFILE_FIELDS || []).filter(p => p.onAdd).length > 0 && <>
        <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "16px 0" }}/>
        <SectionLabel>Custom profile fields</SectionLabel>
        {(window.PROFILE_FIELDS || []).filter(p => p.onAdd).map(p => (
          <Field key={p.id} label={p.label} required={p.required}>
            {p.type === "Dropdown" ? <Select value={data.extra[p.label] || ""} onChange={v => setData({...data, extra: {...data.extra, [p.label]: v}})} options={[["", "Select…"], ...(p.options || []).map(o => [o, o])]}/>
            : p.type === "Toggle" ? <Toggle value={!!data.extra[p.label]} onChange={v => setData({...data, extra: {...data.extra, [p.label]: v}})} label={p.label}/>
            : p.type === "Date" ? <input className="input" type="date" value={data.extra[p.label] || ""} onChange={e => setData({...data, extra: {...data.extra, [p.label]: e.target.value}})}/>
            : p.type === "Number" ? <input className="input" type="number" value={data.extra[p.label] || ""} onChange={e => setData({...data, extra: {...data.extra, [p.label]: e.target.value}})}/>
            : <input className="input" value={data.extra[p.label] || ""} onChange={e => setData({...data, extra: {...data.extra, [p.label]: e.target.value}})}/>}
          </Field>
        ))}
      </>}

    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={submit}>Add user</button>
    </div>
  </Panel>;
};

const SectionLabel = ({ children }) => (
  <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>{children}</div>
);

// ─── Person-scope access data ─────────────────────────────────────────────
// One person's full access footprint across every resource. This is what the
// Access tab renders. Structural notes from the spec:
//   • No Allocated / Not-Allocated split at the person level — "not allocated
//     to what?" is not a bounded question here.
//   • Row shape mirrors the resource-scoped Allocated row (same window chip,
//     same policy + credential columns) so admins can pattern-match between
//     the two views without reorienting.
//   • activeSession=true rows drive the offboarding-modal's warning.
const PERSON_ACCESS_ROWS_BY_ID = {
  "u-001": [
    { id: "pa-1", resource: "prod-db-primary",      env: "Production", resourceType: "database", window: { type: "workingHours" }, policy: "Production DB Policy", credential: "root-db-primary", risk: "med",  activeSession: false },
    { id: "pa-2", resource: "auth-server-01",        env: "Production", resourceType: "server",   window: { type: "custom", expiresAt: "May 20, 2026 18:00", remaining: "in 6 days" }, policy: "Production SSH access", credential: "ssh-deploy",   risk: "low",  activeSession: false },
    { id: "pa-3", resource: "data-warehouse-bastion", env: "Production", resourceType: "server",   window: { type: "workingHours" }, policy: "SRE operations",      credential: "ssh-deploy",       risk: "low",  activeSession: false },
    { id: "pa-4", resource: "k8s-control-plane-aws", env: "Production", resourceType: "cloud",    window: { type: "custom", expiresAt: "in 2h 14m", remaining: "JIT 3h" }, policy: "K8s Production Policy", credential: "eks-admin-token", risk: "med",  activeSession: true },
  ],
  "u-002": [
    { id: "pa-1", resource: "prod-db-primary",      env: "Production", resourceType: "database", window: { type: "lifelong" },      policy: "Production DB Policy", credential: "root-db-primary", risk: "high", activeSession: false },
    { id: "pa-2", resource: "k8s-control-plane-aws", env: "Production", resourceType: "cloud",    window: { type: "custom", expiresAt: "in 00:41:12", remaining: "JIT 3h" }, policy: "K8s Production Policy", credential: "eks-admin-token", risk: "med",  activeSession: true },
  ],
  "u-005": [
    { id: "pa-1", resource: "prod-db-primary",      env: "Production", resourceType: "database", window: { type: "lifelong" }, policy: "Production DB Policy", credential: "root-db-primary", risk: "high", activeSession: false },
    { id: "pa-2", resource: "auth-server-01",        env: "Production", resourceType: "server",   window: { type: "lifelong" }, policy: "Production SSH access", credential: "root-primary",    risk: "high", activeSession: false },
    { id: "pa-3", resource: "data-warehouse-bastion", env: "Production", resourceType: "server",  window: { type: "workingHours" }, policy: "SRE operations", credential: "ssh-deploy", risk: "med", activeSession: false },
  ],
};
const personAccessFor = (u) => PERSON_ACCESS_ROWS_BY_ID[u.id] || [
  { id: "pa-1", resource: "dev-jumpbox", env: "Development", resourceType: "server", window: { type: "workingHours" }, policy: "SRE operations", credential: "ssh-deploy", risk: "low", activeSession: false },
];

// Standardized access-window chip for the person view. Same visual grammar as
// AccessWindowCell on the resource side — kept as a small local copy rather
// than reaching across scripts, since these render standalone one-liners here.
const PersonAccessWindowChip = ({ window: w }) => {
  const meta = {
    lifelong:     { label: "Lifelong",       dot: "var(--fg-4)" },
    custom:       { label: "Custom",         dot: "var(--brand)" },
    zeroday:      { label: "Zero Day",       dot: "var(--warning-fg)" },
    oneTime:      { label: "One-time",       dot: "var(--info-fg)" },
    workingHours: { label: "Working hrs",    dot: "var(--success-fg)" },
  }[w.type] || { label: w.type, dot: "var(--fg-4)" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, flexShrink: 0 }}/>
        <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{meta.label}{w.remaining ? ` · ${w.remaining}` : ""}</span>
      </div>
      {w.expiresAt && (
        <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)" }}>Expires {w.expiresAt}</div>
      )}
      {w.type === "workingHours" && (
        <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)" }}>Mon–Fri · 09:00–18:00</div>
      )}
      {w.type === "lifelong" && (
        <span className="badge badge-warning" style={{ alignSelf: "flex-start", gap: 4 }}>
          <Icon name="alert-triangle" size={10}/> No expiry set
        </span>
      )}
    </div>
  );
};

const PersonRiskChip = ({ level }) => {
  if (!level) return <span style={{ color: "var(--fg-4)", fontSize: 12.5 }}>—</span>;
  const map = {
    low:  { cls: "badge badge-success", label: "Low" },
    med:  { cls: "badge badge-warning", label: "⚑ 1 risk" },
    high: { cls: "badge badge-danger",  label: "⚑ High" },
  };
  const m = map[level] || map.low;
  return <span className={m.cls}>{m.label}</span>;
};

// ─── Person Access tab ──────────────────────────────────────────────────────
// Full access footprint for one user + a single primary action (Revoke all)
// that opens the offboarding modal. No filter chips, no allocated vs not-
// allocated split — this view exists precisely so an admin can offboard in
// one place.
const PersonAccessTab = ({ user, onRevokeAll, onRevokeRow }) => {
  const rows = personAccessFor(user);
  const activeCount = rows.filter(r => r.activeSession).length;
  return (
    <div style={{ padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Access footprint · {rows.length} resource{rows.length === 1 ? "" : "s"}</div>
          <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>
            Every resource {user.name.split(" ")[0]} currently holds access to. Revoking here removes {user.name.split(" ")[0]}'s access from each resource's Allocated table too.
          </div>
        </div>
        <button
          className="btn"
          style={{ background: "var(--danger)", color: "#fff", border: "none" }}
          onClick={onRevokeAll}
          disabled={rows.length === 0}
        >
          <Icon name="x" size={12} color="#fff"/> Revoke all access
        </button>
      </div>

      {activeCount > 0 && (
        <div style={{ padding: 10, background: "var(--warning-soft)", borderRadius: 6, display: "flex", gap: 8, alignItems: "flex-start", font: "500 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
          <Icon name="alert-triangle" size={13} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
          <div>
            <strong>{user.name.split(" ")[0]} has {activeCount} active session{activeCount === 1 ? "" : "s"}</strong> — revoking will disconnect immediately.
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--fg-4)", font: "400 13px/1.5 var(--font-sans)" }}>
            {user.name.split(" ")[0]} has no allocated resources.
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Resource</th>
                <th style={{ width: "26%" }}>Access window</th>
                <th style={{ width: "20%" }}>Policy · credential</th>
                <th style={{ width: "14%" }}>Risk</th>
                <th style={{ width: "8%", textAlign: "right" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Icon name={r.resourceType === "database" ? "database" : r.resourceType === "cloud" ? "cloud" : "server"} size={13} color="var(--fg-3)"/>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.resource}</div>
                        <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                          {r.env}
                          {r.activeSession && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--warning-fg)", fontWeight: 500 }}>· <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warning-fg)" }}/> active session</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><PersonAccessWindowChip window={r.window}/></td>
                  <td>
                    <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.policy}</div>
                    <div className="t-mono" style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{r.credential}</div>
                  </td>
                  <td><PersonRiskChip level={r.risk}/></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }} onClick={() => onRevokeRow(r)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Revoke-all offboarding modal ──────────────────────────────────────────
// Compliance-sensitive: shows the full list uncollapsed, flags any active
// session that will be terminated on confirm.
const PersonRevokeAllModal = ({ user, rows, onClose, onConfirm }) => {
  const activeRows = rows.filter(r => r.activeSession);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: 560, maxHeight: "84vh", background: "var(--bg-app)", borderRadius: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ font: "600 15.5px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Revoke all access for {user.name}?</h2>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
            This affects {rows.length} resource{rows.length === 1 ? "" : "s"}. Every row below will disappear from this table and from each resource's Allocated table.
          </div>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {activeRows.length > 0 && (
            <div style={{ padding: 12, background: "var(--warning-soft)", borderRadius: 6, marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="alert-triangle" size={14} color="var(--warning-fg)" style={{ marginTop: 2 }}/>
              <div style={{ font: "500 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
                <strong>{user.name} has {activeRows.length} active session{activeRows.length === 1 ? "" : "s"}</strong> on {activeRows.map(r => r.resource).join(", ")}. Revoking will disconnect {activeRows.length === 1 ? "this session" : "these sessions"} immediately.
              </div>
            </div>
          )}

          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Access to be revoked</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rows.map(r => {
              const winLabel = r.window.type === "lifelong" ? "Lifelong access"
                             : r.window.type === "custom" ? `Custom · ${r.window.remaining || r.window.expiresAt || ""}`
                             : r.window.type === "workingHours" ? "Working hours access"
                             : r.window.type === "zeroday" ? "Zero-day access"
                             : "One-time access";
              return (
                <div key={r.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, background: r.activeSession ? "var(--warning-soft)" : "var(--bg-surface)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={r.resourceType === "database" ? "database" : r.resourceType === "cloud" ? "cloud" : "server"} size={13} color={r.activeSession ? "var(--warning-fg)" : "var(--fg-3)"}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.resource}</div>
                    <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: r.activeSession ? "var(--warning-fg)" : "var(--fg-4)", marginTop: 2 }}>
                      {winLabel}{r.activeSession && " · currently active"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={onConfirm} style={{ background: "var(--danger)", color: "#fff", borderColor: "transparent" }}>
            <Icon name="x" size={12} color="#fff"/> Revoke all ({rows.length})
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== USER DETAIL PANEL =====
const UserDetailPanel = ({ userId, onClose }) => {
  const u = (window.PEOPLE_USERS || []).find(x => x.id === userId);
  const [tab, setTab] = React.useState("overview");
  const [revokeAllOpen, setRevokeAllOpen] = React.useState(false);
  const [rowRevoke, setRowRevoke] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [revoked, setRevoked] = React.useState(new Set()); // per-row optimistic revoke
  if (!u) return null;

  const baseRows = personAccessFor(u);
  const visibleRows = baseRows.filter(r => !revoked.has(r.id));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 640, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px 0", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 14 }}>
            <Avatar name={u.name} size={44}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{u.name}</h2>
              <div style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{u.jobTitle}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <RoleBadge role={u.role}/>
                <PeopleStatusBadge status={u.status}/>
                <SourceBadge source={u.source}/>
              </div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
          </div>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { id: "overview", label: "Overview" },
              { id: "access",   label: "Access", count: visibleRows.length },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "10px 14px", marginBottom: -1, border: "none", background: "transparent",
                color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
                font: "500 13px/1 var(--font-sans)",
                borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                {t.label}
                {t.count != null && <span className={tab === t.id ? "badge badge-brand" : "badge"}>{t.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
          {tab === "overview" && (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>
              <Section title="Profile">
                <DetailRow k="Email">{u.email}</DetailRow>
                <DetailRow k="Phone">{u.phone}</DetailRow>
                <DetailRow k="Source"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><SourceBadge source={u.source}/>{u.source === "AD" && <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>Synced 4 hours ago</span>}</span></DetailRow>
                <DetailRow k="Last login">{u.lastLogin}</DetailRow>
                <DetailRow k="MFA"><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><MFABadge state={u.mfa}/>{u.mfa === "pending" && <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Set up →</a>}</span></DetailRow>
                <DetailRow k="Created">{u.createdOn}</DetailRow>
                <DetailRow k="Login method">{u.login}</DetailRow>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-sm">Edit profile</button>
                  {u.login !== "SSO" && <button className="btn btn-sm">Reset password</button>}
                  <button className="btn btn-sm" style={{ color: u.status === "active" ? "var(--danger-fg)" : "var(--fg-2)" }}>{u.status === "active" ? "Disable user" : "Re-activate"}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)" }}>Delete</button>
                </div>
              </Section>

              <Section title="Role & Groups">
                <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Current role</div>
                    <button className="btn btn-ghost btn-sm" style={{ color: "var(--brand-fg)" }}>Change role</button>
                  </div>
                  <div><RoleBadge role={u.role}/></div>
                  <div style={{ marginTop: 8, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>{(([...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])]).find(r => r.display === u.role) || {}).desc}</div>
                </div>

                <div style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 8 }}>Groups ({u.groups.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {u.groups.map(g => {
                    const grp = (window.PEOPLE_GROUPS || []).find(x => x.display === g) || { members: 0 };
                    return (
                      <div key={g} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-surface)" }}>
                        <Icon name="people" size={13} color="var(--fg-3)"/>
                        <span style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{g}</span>
                        <span style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>{grp.members} members</span>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--danger-fg)" }} title="Remove from group"><Icon name="x" size={11}/></button>
                      </div>
                    );
                  })}
                  <button className="btn btn-sm" style={{ alignSelf: "flex-start" }}><Icon name="plus" size={11}/> Add to group</button>
                </div>
              </Section>

              <Section title="Activity">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { ts: "Today 12:48", txt: "Session started on prod-db-01 using prod-db-root", icon: "play" },
                    { ts: "Today 09:14", txt: "Access ticket approved for k8s-control-plane-aws by Arjun Bansal", icon: "check" },
                    { ts: "Yesterday",    txt: "Added to group DevOps Team", icon: "people" },
                    { ts: "5 days ago",   txt: "Role changed from End User to Operator by Arjun Bansal", icon: "shield" },
                    { ts: u.createdOn,    txt: "User created via " + u.source, icon: "plus" },
                  ].map((ev, i, arr) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", position: "relative" }}>
                      {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 24, bottom: -8, width: 1, background: "var(--border)" }}/>}
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1 }}>
                        <Icon name={ev.icon} size={10} color="var(--fg-3)"/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{ev.txt}</div>
                        <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{ev.ts}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {u.id === "u-001" && <div style={{ marginTop: 10, padding: 10, background: "var(--success-soft)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)", color: "var(--success-fg)" }}>● 1 active session now — <a href="#" style={{ color: "var(--success-fg)", textDecoration: "underline" }}>View live sessions →</a></div>}
                <a href="#" style={{ marginTop: 10, display: "inline-block", font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>View full audit trail →</a>
              </Section>
            </div>
          )}

          {tab === "access" && (
            <PersonAccessTab
              user={u}
              onRevokeAll={() => setRevokeAllOpen(true)}
              onRevokeRow={(row) => setRowRevoke(row)}
            />
          )}
        </div>

        {revokeAllOpen && (
          <PersonRevokeAllModal
            user={u}
            rows={visibleRows}
            onClose={() => setRevokeAllOpen(false)}
            onConfirm={() => {
              setRevoked(new Set(visibleRows.map(r => r.id)));
              setRevokeAllOpen(false);
              setToast({ text: `All access revoked for ${u.name}.` });
            }}
          />
        )}

        {rowRevoke && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setRowRevoke(null)}>
            <div style={{ width: 460, background: "var(--bg-app)", borderRadius: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Revoke access?</h2>
                <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>{u.name} → {rowRevoke.resource}</div>
              </div>
              <div style={{ padding: 20, font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
                This immediately removes {u.name.split(" ")[0]}'s access to <strong>{rowRevoke.resource}</strong>.
                {rowRevoke.activeSession && <div style={{ marginTop: 10, padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12px/1.5 var(--font-sans)" }}>Active session on {rowRevoke.resource} will be disconnected immediately.</div>}
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-surface)" }}>
                <button className="btn" onClick={() => setRowRevoke(null)}>Cancel</button>
                <button className="btn" onClick={() => { setRevoked(prev => { const n = new Set(prev); n.add(rowRevoke.id); return n; }); setToast({ text: `Access to ${rowRevoke.resource} revoked.` }); setRowRevoke(null); }} style={{ background: "var(--danger)", color: "#fff", borderColor: "transparent" }}>Revoke access</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 300, padding: "12px 18px", background: "var(--fg-1)", color: "var(--bg-app)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check-circle" size={13} color="var(--success)"/>
            {toast.text}
            <button style={{ background: "transparent", border: "none", color: "var(--bg-app)", cursor: "pointer", padding: 0, display: "flex" }} onClick={() => setToast(null)}><Icon name="x" size={11}/></button>
          </div>
        )}
      </aside>
    </>
  );
};

const Section = ({ title, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>{title}</div>
    {children}
  </div>
);

const DetailRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

// ===== SYNC ERRORS PANEL =====
const SyncErrorsPanel = ({ onClose }) => {
  const [expanded, setExpanded] = React.useState(null);
  const [resolved, setResolved] = React.useState(new Set());
  const [skipped, setSkipped] = React.useState(new Set());
  const errors = window.SYNC_ERRORS || [];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 540, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "14px 20px", background: "var(--warning-soft)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="alert-circle" size={16} color="var(--warning-fg)"/>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--warning-fg)" }}>Sync Errors — Active Directory</div>
            <div style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--warning-fg)", marginTop: 2 }}>Last synced: Today 09:42 IST · {errors.length} errors</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 12 }}>
          {errors.map(err => {
            const open = expanded === err.id;
            const isResolved = resolved.has(err.id);
            const isSkipped = skipped.has(err.id);
            return (
              <div key={err.id} className="card" style={{ marginBottom: 8, overflow: "hidden", opacity: isResolved || isSkipped ? 0.55 : 1 }}>
                <div onClick={() => !isResolved && !isSkipped && setExpanded(open ? null : err.id)} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10, cursor: isResolved || isSkipped ? "default" : "pointer" }}>
                  <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{err.who} <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>— {err.kind}</span></div>
                    <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{err.ts}</div>
                  </div>
                  {isResolved && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--success-soft)", color: "var(--success-fg)", font: "500 11px/1.5 var(--font-sans)" }}>Resolved</span>}
                  {isSkipped && <span style={{ padding: "2px 8px", borderRadius: 999, background: "var(--bg-surface-2)", color: "var(--fg-3)", font: "500 11px/1.5 var(--font-sans)" }}>Skipped</span>}
                  {!isResolved && !isSkipped && <Icon name={open ? "chevron-down" : "chevron-right"} size={12} color="var(--fg-4)"/>}
                </div>
                {open && !isResolved && !isSkipped && (
                  <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ paddingTop: 10, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>{err.desc}</div>
                    <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4 }}>
                      <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Affected fields</div>
                      {err.affected.map((a, i) => <div key={i} className="t-mono" style={{ font: "500 11.5px/1.5 var(--font-mono)", color: "var(--fg-2)" }}>{a}</div>)}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {err.action === "merge" && <>
                        <button className="btn btn-primary btn-sm" onClick={() => setResolved(s => new Set([...s, err.id]))}>Merge with existing user</button>
                        <button className="btn btn-sm" onClick={() => setSkipped(s => new Set([...s, err.id]))}>Skip this record</button>
                      </>}
                      {err.action === "set-attr" && <>
                        <input className="input" placeholder="Display name" style={{ flex: 1, minWidth: 200 }}/>
                        <button className="btn btn-primary btn-sm" onClick={() => setResolved(s => new Set([...s, err.id]))}>Set & retry</button>
                        <button className="btn btn-sm" onClick={() => setSkipped(s => new Set([...s, err.id]))}>Skip</button>
                      </>}
                      {err.action === "role-pick" && <>
                        <Select value="" onChange={() => setResolved(s => new Set([...s, err.id]))} options={[["", "Select role…"], ...[...(window.SYSTEM_ROLES || []), ...(window.CUSTOM_ROLES || [])].map(r => [r.display, r.display])]}/>
                        <button className="btn btn-sm" onClick={() => setSkipped(s => new Set([...s, err.id]))}>Skip</button>
                      </>}
                      {err.action === "perm" && <>
                        <button className="btn btn-primary btn-sm">Check AD service account permissions →</button>
                      </>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", background: "var(--bg-surface)" }}>
          <div style={{ flex: 1, font: "400 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>{errors.length - resolved.size - skipped.size} errors · {resolved.size} resolved · {skipped.size} skipped</div>
          <a href="#" style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Export error log</a>
          <button className="btn btn-sm btn-primary"><Icon name="refresh" size={11}/> Retry sync</button>
        </div>
      </aside>
    </>
  );
};

Object.assign(window, { PeopleAddUserPanel, UserDetailPanel, SyncErrorsPanel });
