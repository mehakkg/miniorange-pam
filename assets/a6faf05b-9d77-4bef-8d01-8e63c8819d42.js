// Allocate Access panel — slide-in wizard for a specific resource.
// Two steps: Configure → Review. Captures who (user/group/role), access window
// type, governing policy, and mapped credential. Accepts a `prefill` prop
// so it can be opened blank (from header) or preseeded from a "Not Allocated"
// row on the Access tab.

const ALLOC_WINDOW_OPTIONS = [
  { id: "custom",       label: "Custom date range",     hint: "Pick exact from/to datetimes." },
  { id: "zeroday",      label: "Zero Day",              hint: "Access valid until end of today only." },
  { id: "lifelong",     label: "Lifelong",              hint: "No expiry. Flagged for compliance review." },
  { id: "oneTime",      label: "One-time access",       hint: "Ends when the first session closes." },
  { id: "workingHours", label: "Working days & hours",  hint: "Mon–Fri, 09:00–18:00 · Asia/Kolkata." },
];

const ALLOC_POLICIES_BY_TYPE = {
  database: [
    { id: "prod-ssh",     name: "Production SSH access", note: "Recording on · MFA required · idle 15m" },
    { id: "read-only",    name: "Read-only DB access",   note: "SELECT statements only · session log" },
    { id: "break-glass",  name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
  linux: [
    { id: "prod-ssh",     name: "Production SSH access", note: "Recording on · MFA required · idle 15m" },
    { id: "sre-ops",      name: "SRE operations",        note: "Restricted commands · session log" },
    { id: "break-glass",  name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
  default: [
    { id: "prod-ssh",     name: "Production SSH access", note: "Standard production policy" },
    { id: "break-glass",  name: "Break-glass window",    note: "Emergency use · full recording · 4h max" },
  ],
};

const ALLOC_ROLE_CATALOG = [
  { id: "r-admin",    name: "Admin",         members: 12,  description: "Full-privilege operators (system-wide)" },
  { id: "r-operator", name: "Operator",      members: 24,  description: "Day-to-day operations (system-wide)" },
  { id: "r-auditor",  name: "Auditor",       members: 4,   description: "Read-only compliance reviewers" },
  { id: "r-rodba",    name: "Read-only DBA", members: 0,   description: "Proposed role · not yet assigned" },
  { id: "r-enduser",  name: "End User",      members: 146, description: "Business users · restricted access" },
];

const ALLOC_GROUP_CATALOG = [
  { id: "g-devops",   name: "DevOps team",       members: 8,  description: "Deploy & infra operations" },
  { id: "g-oncall",   name: "On-call rotation",  members: 5,  description: "Rotational incident response" },
  { id: "g-dba",      name: "DBA leads",         members: 3,  description: "Database administration leads" },
  { id: "g-platform", name: "Platform team",     members: 6,  description: "Platform engineering" },
  { id: "g-dataeng",  name: "Data-Platform",     members: 4,  description: "Data engineering" },
  { id: "g-sre",      name: "SRE-oncall",        members: 7,  description: "SRE incident rotation" },
];

const ALLOC_USER_CATALOG = [
  { id: "u-priya",   name: "Priya Iyer",     role: "Admin" },
  { id: "u-marcus",  name: "Marcus Chen",    role: "Operator" },
  { id: "u-aria",    name: "Aria Chen",      role: "Security Admin" },
  { id: "u-dana",    name: "Dana Whitley",   role: "Contractor" },
  { id: "u-kai",     name: "Kai Watanabe",   role: "DBA candidate" },
  { id: "u-diego",   name: "Diego Vasquez",  role: "Operator" },
  { id: "u-lea",     name: "Léa Martin",     role: "SRE" },
  { id: "u-jamal",   name: "Jamal Green",    role: "Auditor" },
];

const AllocSectionLabel = ({ n, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <span style={{
      width: 22, height: 22, borderRadius: "50%",
      background: "#E85D26", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      font: "700 11px/1 Arial, sans-serif", flexShrink: 0,
    }}>{n}</span>
    <span style={{ font: "700 10.5px/1 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.6, textTransform: "uppercase" }}>{label}</span>
    <svg width="52" height="6" viewBox="0 0 52 6" style={{ marginLeft: 4 }} aria-hidden="true">
      <path d="M0 3 Q 6.5 0, 13 3 T 26 3 T 39 3 T 52 3" fill="none" stroke="#E85D26" strokeWidth="1" opacity="0.6"/>
    </svg>
  </div>
);

const AllocSubjectChip = ({ subject, onRemove }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 8px 4px 5px", borderRadius: 3,
    background: "#FFF1EB", color: "#B4471C",
    font: "700 12px/1 Arial, sans-serif",
  }}>
    {subject.kind === "user"
      ? <Avatar name={subject.name} size={18}/>
      : <span style={{ width: 18, height: 18, borderRadius: 3, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={subject.kind === "role" ? "shield" : "people"} size={10} color="#B4471C"/>
        </span>}
    <span>{subject.name}</span>
    <span style={{ font: "400 10.5px/1 Arial, sans-serif", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.4 }}>{subject.kind}</span>
    {onRemove && (
      <button onClick={onRemove} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "#B4471C", display: "inline-flex" }} aria-label="Remove">
        <Icon name="x" size={10}/>
      </button>
    )}
  </span>
);

const AllocWindowConfig = ({ windowType, custom, setCustom }) => {
  if (windowType === "custom") {
    return (
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>
          <div style={{ font: "700 11px/1 Arial, sans-serif", color: "#4A4A4A", marginBottom: 4, letterSpacing: 0.4, textTransform: "uppercase" }}>From</div>
          <input type="datetime-local" value={custom.from} onChange={e => setCustom({ ...custom, from: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 3, font: "400 13px/1 Arial, sans-serif" }}/>
        </label>
        <label>
          <div style={{ font: "700 11px/1 Arial, sans-serif", color: "#4A4A4A", marginBottom: 4, letterSpacing: 0.4, textTransform: "uppercase" }}>To</div>
          <input type="datetime-local" value={custom.to} onChange={e => setCustom({ ...custom, to: e.target.value })}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E7E5E4", borderRadius: 3, font: "400 13px/1 Arial, sans-serif" }}/>
        </label>
        <div style={{ gridColumn: "1/-1", font: "400 11.5px/1.4 Arial, sans-serif", color: "#C7541B" }}>
          Maximum 48 hours per this resource's Production SSH access policy.
        </div>
      </div>
    );
  }
  const summary = {
    zeroday:      { text: "Ends today · 23:59",                       tone: "#B45309" },
    lifelong:     { text: "No expiry · flagged for compliance review", tone: "#C7541B" },
    oneTime:      { text: "Ends when the first session closes",       tone: "#4A4A4A" },
    workingHours: { text: "Mon–Fri · 09:00–18:00 · Asia/Kolkata",     tone: "#4A4A4A" },
  }[windowType];
  return summary ? (
    <div style={{ marginTop: 10, padding: 10, background: "#FDFBFA", border: "1px solid #E7E5E4", borderRadius: 3, font: "400 12.5px/1.4 Arial, sans-serif", color: summary.tone }}>
      {summary.text}
    </div>
  ) : null;
};

const ResourceAllocatePanelV3 = ({ resource, prefill, onClose, onAllocated }) => {
  const initialSubject = prefill && prefill.subject ? [{
    id: prefill.subject.id,
    name: prefill.subject.name,
    kind: prefill.kind || "user",
    meta: prefill.subject.secondary,
  }] : [];
  const initialWindow = (prefill && prefill.suggestedWindow) || "custom";

  const [step, setStep] = React.useState("configure"); // "configure" | "review"
  const [subjects, setSubjects] = React.useState(initialSubject);
  const [kindFilter, setKindFilter] = React.useState(prefill?.kind || "user");
  const [search, setSearch] = React.useState("");
  const [windowType, setWindowType] = React.useState(initialWindow);
  const [custom, setCustom] = React.useState({ from: "", to: "" });
  const [policyId, setPolicyId] = React.useState("prod-ssh");
  const [credentialId, setCredentialId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState(null);

  // Credential catalog for this resource
  const credOptions = React.useMemo(() => {
    const seeded = (globalThis.SEED_CREDENTIALS || []).filter(c => c.resource === resource.name);
    return seeded.length > 0 ? seeded : [
      { id: "c-root",   display: "root-primary", type: "Password", sensitivity: "Critical" },
      { id: "c-deploy", display: "ssh-deploy",   type: "SSH key",  sensitivity: "High" },
    ];
  }, [resource]);
  React.useEffect(() => { if (!credentialId && credOptions.length) setCredentialId(credOptions[0].id); }, [credOptions, credentialId]);

  const policies = ALLOC_POLICIES_BY_TYPE[resource.type] || ALLOC_POLICIES_BY_TYPE.default;
  React.useEffect(() => { if (!policies.find(p => p.id === policyId)) setPolicyId(policies[0].id); }, [policies, policyId]);

  const catalog = kindFilter === "user" ? ALLOC_USER_CATALOG.map(u => ({ id: u.id, name: u.name, kind: "user", meta: u.role }))
                : kindFilter === "group" ? ALLOC_GROUP_CATALOG.map(g => ({ id: g.id, name: g.name, kind: "group", meta: `${g.members} members · ${g.description}` }))
                : ALLOC_ROLE_CATALOG.map(r => ({ id: r.id, name: r.name, kind: "role", meta: `${r.members} members · ${r.description}` }));
  const searchResults = search
    ? catalog.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) && !subjects.find(x => x.id === s.id))
    : catalog.filter(s => !subjects.find(x => x.id === s.id)).slice(0, 6);

  const addSubject = (s) => { setSubjects(prev => [...prev, s]); setSearch(""); };
  const removeSubject = (id) => setSubjects(prev => prev.filter(s => s.id !== id));

  const windowMeta = ALLOC_WINDOW_OPTIONS.find(o => o.id === windowType);
  const policyMeta = policies.find(p => p.id === policyId);
  const credMeta = credOptions.find(c => c.id === credentialId);

  const validate = () => {
    if (subjects.length === 0) return "Select at least one user, group, or role.";
    if (!windowType) return "Choose an access window.";
    if (windowType === "custom") {
      if (!custom.from || !custom.to) return "Set both From and To datetimes.";
      if (new Date(custom.to) <= new Date(custom.from)) return "To must be after From.";
    }
    if (!policyId) return "Select a governing policy.";
    if (!credentialId) return "Pick the credential to allocate.";
    return null;
  };

  const goReview = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setStep("review");
  };

  const submit = () => {
    onAllocated && onAllocated({
      subjectSummary: subjects.map(s => s.name).join(", "),
      subjects, windowType, custom, policyId, credentialId, note,
    });
    onClose();
  };

  const windowDescriptor = windowType === "custom"
    ? (custom.from && custom.to ? `${custom.from.replace("T"," ")} → ${custom.to.replace("T"," ")}` : "Custom range · not set")
    : windowMeta?.hint;

  return (
    <Panel title={step === "review" ? `Review · Allocate on ${resource.name}` : `Allocate access · ${resource.name}`}
      onClose={onClose}
      back={step === "review" ? () => setStep("configure") : undefined}>
      <div style={{ background: "#FDFBFA", borderBottom: "1px solid #E7E5E4", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: step === "review" ? "#15803D" : "#E85D26", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "700 11px/1 Arial, sans-serif", flexShrink: 0,
        }}>{step === "review" ? <Icon name="check" size={10} color="#fff"/> : "1"}</div>
        <span style={{ font: `700 12px/1 Arial, sans-serif`, color: step === "review" ? "#4A4A4A" : "#0F0F0F", letterSpacing: 0.4 }}>Configure</span>
        <div style={{ flex: 0, width: 40, height: 1, background: step === "review" ? "#15803D" : "#E7E5E4" }}/>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: step === "review" ? "#E85D26" : "#F7F5F4", color: step === "review" ? "#fff" : "#7A7A7A",
          border: step === "review" ? "none" : "1px solid #E7E5E4",
          display: "flex", alignItems: "center", justifyContent: "center",
          font: "700 11px/1 Arial, sans-serif", flexShrink: 0,
        }}>2</div>
        <span style={{ font: `700 12px/1 Arial, sans-serif`, color: step === "review" ? "#0F0F0F" : "#7A7A7A", letterSpacing: 0.4 }}>Review</span>
        <div style={{ flex: 1 }}/>
        <span style={{ font: "400 11.5px/1.4 Arial, sans-serif", color: "#7A7A7A" }}>
          Resource: <strong style={{ color: "#0F0F0F" }}>{resource.name}</strong>{resource.criticality === "critical" ? " · Critical" : ""}
        </span>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: "22px 24px 28px", fontFamily: "Arial, sans-serif" }}>
        {step === "configure" ? (
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {/* Section 1 · Who */}
            <AllocSectionLabel n="1" label="Who gets access"/>
            <div style={{ display: "flex", gap: 4, padding: 3, background: "#F7F5F4", border: "1px solid #E7E5E4", borderRadius: 3, width: "fit-content", marginBottom: 10 }}>
              {[["user","User"],["group","Group"],["role","Role"]].map(([id, label]) => (
                <button key={id} onClick={() => setKindFilter(id)} style={{
                  padding: "6px 12px", border: "none", borderRadius: 3, cursor: "pointer",
                  background: kindFilter === id ? "#fff" : "transparent",
                  color: kindFilter === id ? "#0F0F0F" : "#7A7A7A",
                  font: "700 12px/1 Arial, sans-serif", letterSpacing: 0.4,
                  boxShadow: kindFilter === id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}>{label}</button>
              ))}
            </div>
            <div style={{ padding: 8, border: "1px solid #E7E5E4", borderRadius: 3, background: "#fff", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 40 }}>
              {subjects.map(s => <AllocSubjectChip key={s.id} subject={s} onRemove={() => removeSubject(s.id)}/>)}
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={subjects.length === 0 ? `Search ${kindFilter}s…` : ""}
                style={{ flex: 1, minWidth: 160, border: "none", outline: "none", font: "400 13px/1 Arial, sans-serif", background: "transparent" }}/>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 4, border: "1px solid #E7E5E4", borderRadius: 3, background: "#fff", padding: 4 }}>
                {searchResults.slice(0, 6).map(s => (
                  <button key={s.id} onClick={() => addSubject(s)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "8px 10px", border: "none", background: "transparent",
                    cursor: "pointer", borderRadius: 2, textAlign: "left",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "#F7F5F4"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {s.kind === "user"
                      ? <Avatar name={s.name} size={22}/>
                      : <span style={{ width: 22, height: 22, borderRadius: 3, background: "#FFF1EB", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name={s.kind === "role" ? "shield" : "people"} size={11} color="#B4471C"/>
                        </span>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{s.name}</div>
                      <div style={{ font: "400 11.5px/1.3 Arial, sans-serif", color: "#7A7A7A", marginTop: 2 }}>{s.meta}</div>
                    </div>
                    <span style={{ padding: "3px 7px", borderRadius: 3, background: "#F7F5F4", color: "#4A4A4A", font: "700 10px/1 Arial, sans-serif", letterSpacing: 0.4, textTransform: "uppercase" }}>{s.kind}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Section 2 · Access window */}
            <div style={{ marginTop: 22 }}><AllocSectionLabel n="2" label="Access window"/></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {ALLOC_WINDOW_OPTIONS.map(o => {
                const sel = windowType === o.id;
                return (
                  <button key={o.id} onClick={() => setWindowType(o.id)} style={{
                    padding: 12, border: `1px solid ${sel ? "#E85D26" : "#E7E5E4"}`,
                    background: sel ? "#FFF1EB" : "#fff",
                    borderRadius: 3, cursor: "pointer", textAlign: "left",
                    display: "flex", flexDirection: "column", gap: 4,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? "#E85D26" : "#C7C4C1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E85D26" }}/>}
                      </span>
                      <span style={{ font: "700 13px/1.2 Arial, sans-serif", color: "#0F0F0F" }}>{o.label}</span>
                    </div>
                    <div style={{ font: "400 11.5px/1.4 Arial, sans-serif", color: "#7A7A7A", paddingLeft: 20 }}>{o.hint}</div>
                  </button>
                );
              })}
            </div>
            <AllocWindowConfig windowType={windowType} custom={custom} setCustom={setCustom}/>

            {/* Section 3 · Governing policy */}
            <div style={{ marginTop: 22 }}><AllocSectionLabel n="3" label="Governing policy"/></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {policies.map(p => {
                const sel = policyId === p.id;
                return (
                  <button key={p.id} onClick={() => setPolicyId(p.id)} style={{
                    padding: 12, border: `1px solid ${sel ? "#E85D26" : "#E7E5E4"}`,
                    background: sel ? "#FFF1EB" : "#fff",
                    borderRadius: 3, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? "#E85D26" : "#C7C4C1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E85D26" }}/>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{p.name}</div>
                      <div style={{ font: "400 11.5px/1.3 Arial, sans-serif", color: "#7A7A7A", marginTop: 2 }}>{p.note}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Section 4 · Credential */}
            <div style={{ marginTop: 22 }}><AllocSectionLabel n="4" label="Mapped credential"/></div>
            {credOptions.length === 0 ? (
              <div style={{ padding: 12, background: "#FFEEDF", color: "#C7541B", borderRadius: 3, font: "700 12.5px/1.5 Arial, sans-serif" }}>
                No credentials linked to this resource. <a href="#" style={{ color: "#C7541B", textDecoration: "underline" }}>Attach one in the Credentials tab →</a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {credOptions.map(c => {
                  const sel = credentialId === c.id;
                  return (
                    <button key={c.id} onClick={() => setCredentialId(c.id)} style={{
                      padding: 12, border: `1px solid ${sel ? "#E85D26" : "#E7E5E4"}`,
                      background: sel ? "#FFF1EB" : "#fff",
                      borderRadius: 3, cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? "#E85D26" : "#C7C4C1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E85D26" }}/>}
                      </span>
                      <Icon name={c.type === "SSH key" ? "key" : "lock"} size={14} color="#B4471C"/>
                      <span style={{ flex: 1, font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{c.display || c.name}</span>
                      <span style={{ padding: "3px 7px", borderRadius: 3, background: "#F7F5F4", color: "#4A4A4A", font: "700 10.5px/1 Arial, sans-serif", letterSpacing: 0.4, textTransform: "uppercase" }}>{c.type || "Password"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Optional note */}
            <div style={{ marginTop: 22 }}><AllocSectionLabel n="5" label="Note (optional)"/></div>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Q3 ledger reconciliation, escalated by TKT-2104."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #E7E5E4", borderRadius: 3, font: "400 13px/1.4 Arial, sans-serif" }}/>

            {error && (
              <div style={{ marginTop: 16, padding: 12, background: "#FEE2E2", color: "#B91C1C", borderRadius: 3, font: "700 12.5px/1.5 Arial, sans-serif", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Icon name="alert-circle" size={14} color="#B91C1C"/><span>{error}</span>
              </div>
            )}
          </div>
        ) : (
          // ─── Review step ────────────────────────────────────────────────────
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ padding: "12px 16px", background: "#FFF1EB", border: "1px solid #FFD5C0", borderRadius: 3, font: "400 12.5px/1.5 Arial, sans-serif", color: "#B4471C", marginBottom: 20 }}>
              You are about to grant <strong>{subjects.length}</strong> {subjects.length === 1 ? "subject" : "subjects"} access to <strong>{resource.name}</strong>. This action is audited and reversible via <em>Revoke</em> on the Access tab.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "18px 20px", padding: "6px 4px 22px", borderBottom: "1px solid #E7E5E4" }}>
              <span style={{ font: "700 10.5px/1.2 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.4, textTransform: "uppercase" }}>Recipients</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {subjects.map(s => <AllocSubjectChip key={s.id} subject={s}/>)}
              </div>

              <span style={{ font: "700 10.5px/1.2 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.4, textTransform: "uppercase" }}>Access window</span>
              <div>
                <div style={{ font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{windowMeta?.label}</div>
                <div style={{ font: "400 12px/1.4 Arial, sans-serif", color: "#4A4A4A", marginTop: 2 }}>{windowDescriptor}</div>
                {windowType === "lifelong" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, padding: "3px 8px", background: "#FFEEDF", color: "#C7541B", font: "700 10.5px/1.3 Arial, sans-serif", letterSpacing: 0.5, borderRadius: 3, textTransform: "uppercase" }}>
                    <Icon name="alert-triangle" size={10} color="#C7541B"/> No expiry set
                  </span>
                )}
              </div>

              <span style={{ font: "700 10.5px/1.2 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.4, textTransform: "uppercase" }}>Policy</span>
              <div>
                <div style={{ font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{policyMeta?.name}</div>
                <div style={{ font: "400 12px/1.4 Arial, sans-serif", color: "#4A4A4A", marginTop: 2 }}>{policyMeta?.note}</div>
              </div>

              <span style={{ font: "700 10.5px/1.2 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.4, textTransform: "uppercase" }}>Credential</span>
              <div>
                <div style={{ font: "700 13px/1.3 Arial, sans-serif", color: "#0F0F0F" }}>{credMeta?.display || credMeta?.name}</div>
                <div style={{ font: "400 12px/1.4 Arial, sans-serif", color: "#4A4A4A", marginTop: 2 }}>{credMeta?.type || "Password"}</div>
              </div>

              {note && (<>
                <span style={{ font: "700 10.5px/1.2 Arial, sans-serif", color: "#4A4A4A", letterSpacing: 1.4, textTransform: "uppercase" }}>Note</span>
                <div style={{ font: "400 12.5px/1.5 Arial, sans-serif", color: "#0F0F0F" }}>{note}</div>
              </>)}
            </div>

            <div style={{ marginTop: 16, padding: 14, background: "#FDFBFA", borderRadius: 3, font: "400 12px/1.5 Arial, sans-serif", color: "#4A4A4A", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="info" size={14} color="#7A7A7A"/>
              <div>
                Recipients will receive a notification with the mapped credential display name — the actual credential material is never exposed. Session recording, idle timeout, and MFA are inherited from the selected policy.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #E7E5E4", padding: "12px 24px", display: "flex", gap: 8, justifyContent: "flex-end", background: "#fff", fontFamily: "Arial, sans-serif" }}>
        <button className="btn" onClick={onClose} style={{ background: "#fff", color: "#0F0F0F", border: "1px solid #E7E5E4", borderRadius: 3, padding: "9px 14px", font: "700 12.5px/1 Arial, sans-serif", cursor: "pointer" }}>Cancel</button>
        {step === "configure"
          ? <button onClick={goReview} style={{ background: "#E85D26", color: "#fff", border: "none", borderRadius: 3, padding: "9px 18px", font: "700 12.5px/1 Arial, sans-serif", cursor: "pointer", letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Continue to review <Icon name="chevron-right" size={12} color="#fff"/>
            </button>
          : <button onClick={submit} style={{ background: "#E85D26", color: "#fff", border: "none", borderRadius: 3, padding: "9px 18px", font: "700 12.5px/1 Arial, sans-serif", cursor: "pointer", letterSpacing: 0.3, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={12} color="#fff"/> Confirm & allocate
            </button>}
      </div>
    </Panel>
  );
};

Object.assign(window, { ResourceAllocatePanelV3 });
