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

// ===== USER DETAIL PANEL =====
const UserDetailPanel = ({ userId, onClose }) => {
  const u = (window.PEOPLE_USERS || []).find(x => x.id === userId);
  const [accessFilter, setAccessFilter] = React.useState("All");
  if (!u) return null;

  const accessRows = [
    { res: "prod-db-01",       type: "database", env: "Production", via: "Via Group: Production Access", window: "Anytime",          status: "Active" },
    { res: "ssh-server-linux", type: "server",   env: "Production", via: "Via Group: DevOps Team",       window: "Mon–Fri 09–19",    status: "Active" },
    { res: "k8s-control-plane-aws", type: "cloud", env: "Production", via: "Direct",                     window: "JIT — expires in 2h 14m", status: "Expiring" },
    { res: "data-warehouse-bastion", type: "server", env: "Production", via: "Via Group: DevOps Team",   window: "Anytime",          status: "Active" },
    { res: "dev-jumpbox",      type: "server",   env: "Dev",        via: "Via Role: Operator",           window: "Anytime",          status: "Active" },
    { res: "audit-readonly-replica", type: "database", env: "Production", via: "Direct",                  window: "Last access expired", status: "Expired" },
  ];
  const filtered = accessFilter === "All" ? accessRows : accessFilter === "Active" ? accessRows.filter(r => r.status === "Active") : accessFilter === "Expiring" ? accessRows.filter(r => r.status === "Expiring") : accessFilter === "Direct" ? accessRows.filter(r => r.via === "Direct") : accessRows.filter(r => r.via.startsWith("Via Group"));

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
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

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>

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

          <Section title={`Resource access (${accessRows.length})`}>
            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 10 }}>
              {accessRows.length} resources — <strong style={{ color: "var(--fg-2)" }}>{accessRows.filter(r => r.via === "Direct").length} direct</strong>, <strong style={{ color: "var(--fg-2)" }}>{accessRows.filter(r => r.via.startsWith("Via Group")).length} via groups</strong>, <strong style={{ color: "var(--fg-2)" }}>{accessRows.filter(r => r.via.startsWith("Via Role")).length} via role</strong>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {["All","Direct","Via Group","Active","Expiring"].map(f => (
                <button key={f} onClick={() => setAccessFilter(f)} style={{
                  padding: "4px 10px", border: "none", borderRadius: 4, cursor: "pointer",
                  background: accessFilter === f ? "var(--brand-soft)" : "var(--bg-surface-2)",
                  color: accessFilter === f ? "var(--brand-fg)" : "var(--fg-3)",
                  font: "500 11.5px/1 var(--font-sans)",
                }}>{f}</button>
              ))}
            </div>
            <table className="table" style={{ border: "1px solid var(--border)", borderRadius: 6 }}>
              <thead><tr><th>Resource</th><th>Env</th><th>Access</th><th>Window</th><th>Status</th></tr></thead>
              <tbody>{filtered.map((r, i) => (
                <tr key={i}>
                  <td><div className="row"><Icon name={r.type === "database" ? "database" : r.type === "cloud" ? "cloud" : "server"} size={12} color="var(--fg-3)"/><span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)", fontWeight: 500 }}>{r.res}</span></div></td>
                  <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.env}</span></td>
                  <td className="t-tiny" style={{ color: r.via.startsWith("Via Group") ? "var(--brand-fg)" : r.via.startsWith("Via Role") ? "var(--warning-fg)" : "var(--fg-2)" }}>{r.via}</td>
                  <td className="t-tiny" style={{ color: r.status === "Expiring" ? "var(--warning-fg)" : "var(--fg-3)" }}>{r.window}</td>
                  <td>
                    {r.status === "Active"   && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 11.5px/1 var(--font-sans)", color: "var(--success-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/>Active</span>}
                    {r.status === "Expiring" && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 11.5px/1 var(--font-sans)", color: "var(--warning-fg)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning-fg)" }}/>Expiring</span>}
                    {r.status === "Expired"  && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-4)" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--fg-4)" }}/>Expired</span>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
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
