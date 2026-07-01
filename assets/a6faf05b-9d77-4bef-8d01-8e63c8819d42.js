// Allocate Access panel — 480px slide-in, used on Resource detail "+ Allocate" button

const AllocatePanel = ({ resource, onClose, onAllocated }) => {
  const [subjects, setSubjects] = React.useState([]);
  const [credential, setCredential] = React.useState("");
  const [window, setWindowType] = React.useState("Custom");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [note, setNote] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState(null);

  const users = (window?.PEOPLE_USERS || []).map(u => ({ id: u.id, name: u.name, role: u.role, type: "user" }));
  // Fallback static if not loaded
  const allSubjects = users.length > 0 ? users : [
    { id: "u-001", name: "Priya Sharma", role: "Operator", type: "user" },
    { id: "u-002", name: "Rohan Mehta",  role: "Admin",    type: "user" },
    { id: "u-003", name: "Aditya Kulkarni", role: "End User", type: "user" },
    { id: "g-001", name: "DevOps Team", role: "Operator", type: "group", members: 8 },
    { id: "g-005", name: "SysAdmins",   role: "Admin",    type: "group", members: 4 },
  ];
  const searchResults = search ? allSubjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && !subjects.find(x => x.id === s.id)) : [];

  const creds = (window?.SEED_CREDENTIALS || []).filter(c => c.resource === resource.name);
  const credOptions = creds.length > 0 ? creds : [
    { id: "c-001", display: "prod-db-root", type: "Password", sensitivity: "Critical" },
    { id: "c-002", display: "linux-ssh-admin", type: "Password", sensitivity: "High" },
  ];

  const addSubject = (s) => { setSubjects(prev => [...prev, s]); setSearch(""); };
  const remove = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

  const validate = () => {
    if (subjects.length === 0) return "Select at least one user or group.";
    if (!credential) return "Pick a credential to use for this access.";
    if (window === "Custom") {
      if (!from || !to) return "Set both from and to datetimes.";
      if (new Date(to) <= new Date(from)) return "To must be after From.";
    }
    return null;
  };

  const allocate = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    onAllocated && onAllocated({ subjects, credential, window, from, to, note });
    onClose();
  };

  return <Panel title={`Allocate Access — ${resource.name}`} onClose={onClose}>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "20px 24px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Section 1 · Assign to</div>
      <Field label="Who gets access?" required>
        <div style={{ padding: 8, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minHeight: 36 }}>
          {subjects.map(s => (
            <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px 2px 4px", borderRadius: 999, background: "var(--brand-soft)", color: "var(--brand-fg)", font: "500 12px/1.5 var(--font-sans)" }}>
              {s.type === "user" ? <Avatar name={s.name} size={18}/> : <span style={{ width: 18, height: 18, borderRadius: 4, background: "var(--bg-app)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="people" size={11} color="var(--brand-fg)"/></span>}
              {s.name}
              <button onClick={() => remove(s.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "var(--brand-fg)", display: "inline-flex" }}><Icon name="x" size={10}/></button>
            </span>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={subjects.length === 0 ? "Search users or groups…" : ""} style={{ flex: 1, minWidth: 140, border: "none", outline: "none", font: "400 12.5px/1 var(--font-sans)", background: "transparent" }}/>
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: 4, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", padding: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
            {searchResults.slice(0, 5).map(s => (
              <button key={s.id} onClick={() => addSubject(s)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 4, textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {s.type === "user" ? <Avatar name={s.name} size={22}/> : <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--bg-surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="people" size={12} color="var(--fg-3)"/></span>}
                <div style={{ flex: 1 }}>
                  <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.name}</div>
                  <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{s.type === "user" ? s.role : `${s.members || 0} members`}</div>
                </div>
                {s.type === "user" ? <RoleBadge role={s.role}/> : <span className="badge">Group</span>}
              </button>
            ))}
          </div>
        )}
      </Field>

      <div style={{ marginTop: 18, font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Section 2 · Credential</div>
      <Field label="Which credential?" required>
        {credOptions.length === 0 ? (
          <div style={{ padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
            No credentials linked to this resource. <a href="#" style={{ color: "var(--warning-fg)", textDecoration: "underline" }}>Go to Credentials tab →</a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {credOptions.map(c => {
              const sel = credential === c.id;
              return (
                <button key={c.id} onClick={() => setCredential(c.id)} style={{
                  padding: 10, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                  background: sel ? "var(--brand-soft)" : "var(--bg-app)",
                  borderRadius: 6, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border-strong)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>}
                  </div>
                  <span style={{ flex: 1, font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.display || c.name}</span>
                  <span className="badge">{c.type || "Password"}</span>
                  {c.sensitivity && <SensitivityBadge level={c.sensitivity}/>}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      <div style={{ marginTop: 18, font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Section 3 · Access window</div>
      <Field label="How long?" required>
        <Segmented value={window} onChange={setWindowType} options={[
          {value:"Custom",label:"Custom"},
          {value:"One Time",label:"One Time"},
          {value:"Working Hours",label:"Working Hours"},
          {value:"Lifelong",label:"Lifelong"},
        ]}/>
        {window === "Custom" && (
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="From"><input className="input" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}/></Field>
            <Field label="To"><input className="input" type="datetime-local" value={to} onChange={e => setTo(e.target.value)}/></Field>
            <div style={{ gridColumn: "1/-1", font: "400 11.5px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>Maximum 48 hours for this resource's policy.</div>
          </div>
        )}
        {window === "One Time" && <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Access expires after the first session ends.</div>}
        {window === "Working Hours" && <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Mon–Fri, 9:00 AM – 6:00 PM · Asia/Kolkata</div>}
        {window === "Lifelong" && <div style={{ marginTop: 10, padding: 10, background: "var(--bg-surface-2)", borderRadius: 4, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>No expiry. User can access at any time.</div>}
      </Field>

      <div style={{ marginTop: 18, font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Section 4 · Note</div>
      <Field label="Note to user (optional)" hint="Shown to the user when they view their allocated resources">
        <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Use for the Q3 ledger reconciliation."/>
      </Field>

      {error && <div style={{ marginTop: 14, padding: 12, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Icon name="alert-circle" size={14}/><span>⚠ {error}</span>
      </div>}
    </div>
    <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn btn-primary" onClick={allocate}>Allocate access</button>
    </div>
  </Panel>;
};

Object.assign(window, { AllocatePanel });
