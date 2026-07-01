// Resource Add Panel — full-page slide-in panel with 4-step wizard
// Step 0: choose entry method | Step 1: basic info | Step 2: creds | Step 3: policy | Step 4: access | Step 5: success

const PANEL_BACKDROP = {
  position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)",
  zIndex: 100, display: "flex", justifyContent: "flex-end",
  animation: "fadeIn 180ms ease",
};
const PANEL_BODY = {
  width: "min(960px, 92vw)", height: "100%", background: "var(--bg-app)",
  display: "flex", flexDirection: "column",
  boxShadow: "-8px 0 32px rgba(0,0,0,0.18)",
  animation: "slideInR 240ms cubic-bezier(.2,.7,.2,1)",
};

const Panel = ({ title, onClose, children, footer, back }) => (
  <div style={PANEL_BACKDROP} onClick={onClose}>
    <div style={PANEL_BODY} onClick={e => e.stopPropagation()}>
      <header style={{
        height: 56, padding: "0 24px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10, flex: "none",
      }}>
        {back && <button className="btn btn-ghost btn-sm btn-icon" onClick={back} title="Back"><Icon name="chevron-left" size={14}/></button>}
        <h2 style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{title}</h2>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} title="Close"><Icon name="close" size={14}/></button>
      </header>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>{children}</div>
      {footer && <footer style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10, flex: "none", background: "var(--bg-surface)" }}>{footer}</footer>}
    </div>
  </div>
);

const StepIndicator = ({ step }) => {
  const steps = [
    { n: 1, label: "Basic info" },
    { n: 2, label: "Credentials" },
    { n: 3, label: "Policy" },
    { n: 4, label: "Access" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 24px", gap: 8, borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)",
                color: done || active ? "#fff" : "var(--fg-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                font: "600 11px/1 var(--font-sans)", flex: "none",
                border: !done && !active ? "1px solid var(--border)" : "none",
              }}>{done ? <Icon name="check" size={11} color="#fff"/> : s.n}</div>
              <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 48 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Field = ({ label, required, hint, error, children }) => (
  <label style={{ display: "block" }}>
    <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "var(--danger-fg)", marginLeft: 2 }}>*</span>}
    </div>
    {children}
    {error && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--danger-fg)", marginTop: 5, display: "flex", gap: 4, alignItems: "flex-start" }}>
      <Icon name="alert-circle" size={11} color="var(--danger-fg)" style={{ marginTop: 2 }}/><span>{error}</span>
    </div>}
    {hint && !error && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>{hint}</div>}
  </label>
);

const Pill = ({ active, onClick, icon, children }) => (
  <button type="button" onClick={onClick} style={{
    padding: "10px 16px", borderRadius: 8, gap: 8, display: "inline-flex", alignItems: "center",
    border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
    background: active ? "var(--brand-soft)" : "var(--bg-surface)",
    color: active ? "var(--brand-fg)" : "var(--fg-2)",
    font: "500 13px/1 var(--font-sans)", cursor: "pointer",
  }}>
    {icon && <Icon name={icon} size={14}/>}{children}
  </button>
);

const Segmented = ({ value, options, onChange }) => (
  <div style={{ display: "inline-flex", padding: 3, background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 7, gap: 2 }}>
    {options.map(o => (
      <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
        padding: "6px 14px", border: "none", borderRadius: 5, cursor: "pointer",
        background: value === o.value ? "var(--bg-surface)" : "transparent",
        color: value === o.value ? "var(--fg-1)" : "var(--fg-3)",
        font: "500 12.5px/1 var(--font-sans)",
        boxShadow: value === o.value ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)" : "none",
      }}>{o.label}</button>
    ))}
  </div>
);

// ---- Step 0: entry method selector ----
const EntryMethodCards = ({ onPick }) => {
  const groups = [
    {
      label: "Single resource",
      cards: [
        { id: "manual", icon: "edit", title: "Add manually", sub: "Configure one server, database, or app by entering its details", cta: "Continue" },
      ],
    },
    {
      label: "Discover at scale",
      cards: [
        { id: "scan",   icon: "discovery", title: "Network scan",        sub: "Sweep an IP range or subnet to find unmanaged assets", cta: "Set up scan",  badge: "Recommended" },
        { id: "cloud",  icon: "cloud",     title: "Cloud discovery",     sub: "Pull resources from AWS, Azure, GCP via connected accounts", cta: "Choose provider" },
        { id: "ad",     icon: "people",    title: "Import from AD",      sub: "Pull machines from your connected Active Directory", cta: "Import" },
        { id: "k8s",    icon: "cloud",     title: "Kubernetes clusters", sub: "Discover workloads and nodes from a kubeconfig",     cta: "Connect cluster" },
      ],
    },
    {
      label: "Bulk import",
      cards: [
        { id: "csv",    icon: "file-text", title: "CSV upload",          sub: "Upload a spreadsheet using our template", cta: "Upload file" },
        { id: "api",    icon: "key",       title: "API / Terraform",     sub: "Programmatic onboarding via REST or Terraform provider", cta: "View docs" },
      ],
    },
  ];

  const Card = ({ c }) => (
    <button onClick={() => onPick(c.id)} style={{
      position: "relative",
      background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8,
      padding: 16, cursor: "pointer", textAlign: "left",
      display: "flex", flexDirection: "column", gap: 10, minHeight: 152,
      transition: "all 120ms ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
    >
      {c.badge && <span className="badge badge-brand" style={{ position: "absolute", top: 12, right: 12 }}>{c.badge}</span>}
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={c.icon} size={16}/>
      </div>
      <div>
        <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.title}</div>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{c.sub}</div>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)", display: "flex", alignItems: "center", gap: 4 }}>
        {c.cta} <Icon name="chevron-right" size={11}/>
      </div>
    </button>
  );

  return (
    <div style={{ padding: 28, maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>How do you want to add resources?</h3>
        <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>Pick a method based on where your assets live and how many you need to onboard.</p>
      </div>
      {groups.map(g => (
        <div key={g.label} style={{ marginBottom: 22 }}>
          <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>{g.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: g.cards.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {g.cards.map(c => <Card key={c.id} c={c}/>)}
          </div>
        </div>
      ))}
    </div>
  );
};

// ---- Step 1: basic info ----
const PORT_DEFAULTS = { mysql: 3306, postgres: 5432, mssql: 1433, oracle: 1521, mongodb: 27017, redis: 6379 };

const Step1Basic = ({ data, setData }) => {
  const t = data.type;
  const showServer = t === "server";
  const showDb     = t === "database";
  const showWeb    = t === "web";
  const showDesktop= t === "desktop";

  return (
    <div style={{ padding: "20px 24px 8px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Resource type" required>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <Pill active={t==="server"}  icon="server"   onClick={() => setData(d => ({...d, type: "server", port: 22}))}>Server</Pill>
          <Pill active={t==="database"}icon="database" onClick={() => setData(d => ({...d, type: "database", port: 3306, dbApp: "mysql"}))}>Database</Pill>
          <Pill active={t==="web"}     icon="web"      onClick={() => setData(d => ({...d, type: "web", port: 443}))}>Web app</Pill>
          <Pill active={t==="desktop"} icon="desktop"  onClick={() => setData(d => ({...d, type: "desktop"}))}>Desktop app</Pill>
        </div>
      </Field>

      {showServer && <>
        <Field label="Display name" required hint="Give this server a recognizable name">
          <input className="input" value={data.name} onChange={e => setData(d => ({...d, name: e.target.value}))} placeholder="e.g. prod-web-01"/>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <Field label="IP address / hostname" required>
            <input className="input" value={data.host} onChange={e => setData(d => ({...d, host: e.target.value}))} placeholder="10.42.18.7 or web01.kestrel.internal"/>
          </Field>
          <Field label="Port" required>
            <input className="input t-mono" type="number" value={data.port} onChange={e => setData(d => ({...d, port: +e.target.value}))}/>
          </Field>
        </div>
        <Field label="OS type">
          <Select value={data.os || "linux"} onChange={v => setData(d => ({...d, os: v}))} options={[["linux","Linux"],["windows","Windows"],["macos","macOS"],["other","Other"]]}/>
        </Field>
      </>}

      {showDb && <>
        <Field label="Display name" required>
          <input className="input" value={data.name} onChange={e => setData(d => ({...d, name: e.target.value}))} placeholder="e.g. prod-db-primary"/>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14 }}>
          <Field label="Database app" required>
            <Select value={data.dbApp || "mysql"} onChange={v => setData(d => ({...d, dbApp: v, port: PORT_DEFAULTS[v]}))} options={[["mysql","MySQL"],["postgres","PostgreSQL"],["mssql","MSSQL"],["oracle","Oracle"],["mongodb","MongoDB"],["redis","Redis"]]}/>
          </Field>
          <Field label="IP / hostname" required>
            <input className="input" value={data.host} onChange={e => setData(d => ({...d, host: e.target.value}))} placeholder="10.42.18.7"/>
          </Field>
          <Field label="Port" required>
            <input className="input t-mono" type="number" value={data.port} onChange={e => setData(d => ({...d, port: +e.target.value}))}/>
          </Field>
        </div>
        <Field label="Database name" required>
          <input className="input" value={data.dbName || ""} onChange={e => setData(d => ({...d, dbName: e.target.value}))} placeholder="ledger_prod"/>
        </Field>
        <Field label="SSL / TLS">
          <Toggle value={!!data.ssl} onChange={v => setData(d => ({...d, ssl: v}))} label="Require encrypted connections"/>
        </Field>
      </>}

      {showWeb && <>
        <Field label="Display name" required>
          <input className="input" value={data.name} onChange={e => setData(d => ({...d, name: e.target.value}))} placeholder="e.g. kestrel-admin-portal"/>
        </Field>
        <Field label="URL" required hint="Must include protocol — https://...">
          <input className="input" value={data.host} onChange={e => setData(d => ({...d, host: e.target.value}))} placeholder="https://admin.kestrel.io"/>
        </Field>
        <Field label="Auth method">
          <Select value={data.authMethod || "form"} onChange={v => setData(d => ({...d, authMethod: v}))} options={[["form","Form-based"],["sso","SSO"],["basic","Basic auth"]]}/>
        </Field>
      </>}

      {showDesktop && <>
        <Field label="Display name" required>
          <input className="input" value={data.name} onChange={e => setData(d => ({...d, name: e.target.value}))} placeholder="e.g. salesforce-desktop"/>
        </Field>
        <Field label="Executable path or app name" required>
          <input className="input t-mono" value={data.host} onChange={e => setData(d => ({...d, host: e.target.value}))} placeholder="C:\\Program Files\\App\\app.exe"/>
        </Field>
        <Field label="Platform">
          <Select value={data.platform || "windows"} onChange={v => setData(d => ({...d, platform: v}))} options={[["windows","Windows"],["macos","macOS"],["linux","Linux"]]}/>
        </Field>
      </>}

      <Field label="Description">
        <textarea className="input" rows={2} value={data.description || ""} onChange={e => setData(d => ({...d, description: e.target.value}))} placeholder="Optional"/>
      </Field>

      {/* Classification */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>Classification</div>
        <Field label="Criticality" required>
          <Segmented value={data.criticality || "medium"} onChange={v => setData(d => ({...d, criticality: v}))}
            options={[{value:"critical",label:"Critical"},{value:"high",label:"High"},{value:"medium",label:"Medium"},{value:"low",label:"Low"}]}/>
        </Field>
        <Field label="Environment" required>
          <Segmented value={data.env || "production"} onChange={v => setData(d => ({...d, env: v}))}
            options={[{value:"production",label:"Production"},{value:"dev",label:"Dev"},{value:"test",label:"Test"},{value:"staging",label:"Staging"}]}/>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Owner / team">
            <input className="input" value={data.owner || ""} onChange={e => setData(d => ({...d, owner: e.target.value}))} placeholder="Optional — DevOps, Platform team…"/>
          </Field>
          <Field label="Tags">
            <input className="input" value={data.tags || ""} onChange={e => setData(d => ({...d, tags: e.target.value}))} placeholder="pci, fintech, prod"/>
          </Field>
        </div>
      </div>

      {/* Advanced settings */}
      <Disclosure label="Advanced settings">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Toggle
            value={!!data.credLess}
            onChange={v => setData(d => ({...d, credLess: v}))}
            label="Credential-less access"
            hint="Users connect via proxy injection. Passwords are never shown. Recommended for high-privilege systems."
          />
          <Field label="Notes">
            <textarea className="input" rows={2} value={data.notes || ""} onChange={e => setData(d => ({...d, notes: e.target.value}))} placeholder="Internal context — owners, runbook links, etc."/>
          </Field>
        </div>
      </Disclosure>
    </div>
  );
};

const Select = window.Select || (({ value, options, onChange }) => (
  <select className="input" value={value} onChange={e => onChange(e.target.value)} style={{ height: 36 }}>
    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
  </select>
));
window.Select = Select;

const Toggle = ({ value, onChange, label, hint }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
    <button type="button" onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 10, padding: 2,
      background: value ? "var(--brand)" : "var(--bg-surface-2)",
      border: `1px solid ${value ? "var(--brand)" : "var(--border)"}`,
      cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: value ? "flex-end" : "flex-start", flex: "none",
      transition: "all 120ms",
    }}>
      <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}/>
    </button>
    <div>
      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{label}</div>
      {hint && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 3, maxWidth: 480 }}>{hint}</div>}
    </div>
  </div>
);

const Disclosure = ({ label, children, defaultOpen }) => {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        background: "transparent", border: "none", padding: 0,
        font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
      }}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={11}/>{label}
      </button>
      {open && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
};

// ---- Step 2: credentials ----
const Step2Creds = ({ data, setData }) => {
  const [createOpen, setCreateOpen] = React.useState(data.creds.length === 0);
  const [reconOpen, setReconOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: "", username: "", credType: "password", password: "", complete: true });
  const [testIdx, setTestIdx] = React.useState(null);

  const testResult = (i) => {
    const c = data.creds[i];
    if (c.username && c.username.includes("svc")) return { ok: false, msg: "Authentication failed — service account is locked. Reset password in AD or use a different admin account." };
    return { ok: true, msg: "Authentication successful — PAM can access this resource with this credential." };
  };

  const addCred = () => {
    if (!draft.name || !draft.username) return;
    setData(d => ({...d, creds: [...d.creds, { ...draft, id: `tmp-${Date.now()}` }]}));
    setDraft({ name: "", username: "", credType: "password", password: "", complete: true });
    setCreateOpen(false);
  };

  return (
    <div style={{ padding: "20px 24px 8px", maxWidth: 720 }}>
      <h3 style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Attach credentials to {data.name || "this resource"}</h3>
      <p style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 18px" }}>Credentials are stored in the vault. Users never see raw passwords.</p>

      {/* Attached creds list */}
      {data.creds.length === 0 ? (
        <div style={{ padding: 24, border: "1px dashed var(--border)", borderRadius: 8, textAlign: "center", color: "var(--fg-3)", fontSize: 12.5, marginBottom: 14 }}>
          No credentials attached yet. Add one below.
        </div>
      ) : (
        <table className="table" style={{ marginBottom: 14, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <thead><tr><th>Display name</th><th>Type</th><th>Username</th><th>Rotation</th><th></th></tr></thead>
          <tbody>
            {data.creds.map((c, i) => {
              const tr = testIdx === i ? testResult(i) : null;
              return (
                <React.Fragment key={c.id}>
                  <tr>
                    <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.name}</td>
                    <td><span className="badge" style={{ textTransform: "capitalize" }}>{c.credType === "password" ? "Password" : c.credType === "ssh" ? "SSH key" : "Extra params"}</span></td>
                    <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{c.username}</td>
                    <td style={{ fontSize: 12, color: "var(--fg-3)" }}>{c.adminAccount ? `Auto, via ${c.adminAccount}` : "Manual"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setTestIdx(testIdx === i ? null : i)}>Test</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setData(d => ({...d, creds: d.creds.filter((_,j) => j !== i)}))}>Detach</button>
                    </td>
                  </tr>
                  {tr && (
                    <tr><td colSpan="5" style={{ background: tr.ok ? "var(--success-soft)" : "var(--danger-soft)", borderTop: "none" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 4px", fontSize: 12.5, color: tr.ok ? "var(--success-fg)" : "var(--danger-fg)" }}>
                        <Icon name={tr.ok ? "check-circle" : "alert-circle"} size={14}/>
                        <span>{tr.msg}</span>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Add buttons */}
      {!createOpen && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button className="btn btn-sm">Attach existing credential</button>
          <button className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Icon name="plus" size={11}/> Create new credential</button>
        </div>
      )}

      {createOpen && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 14, marginBottom: 14 }}>
          <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>New credential</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Display name" required>
              <input className="input" value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))} placeholder="e.g. root-server-01"/>
            </Field>
            <Field label="Username" required>
              <input className="input t-mono" value={draft.username} onChange={e => setDraft(d => ({...d, username: e.target.value}))} placeholder="root"/>
            </Field>
          </div>
          <div>
            <div style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 8 }}>Credential type</div>
            <div style={{ display: "flex", gap: 4, padding: 3, background: "var(--bg-surface-2)", borderRadius: 6, width: "fit-content" }}>
              {[["password","Password"],["ssh","SSH key"],["params","Extra parameters"]].map(([v,l]) => (
                <button key={v} type="button" onClick={() => setDraft(d => ({...d, credType: v}))} style={{
                  padding: "6px 12px", border: "none", borderRadius: 4, cursor: "pointer",
                  background: draft.credType === v ? "var(--bg-surface)" : "transparent",
                  color: draft.credType === v ? "var(--fg-1)" : "var(--fg-3)",
                  font: "500 12px/1 var(--font-sans)",
                  boxShadow: draft.credType === v ? "0 1px 2px rgba(0,0,0,0.06), 0 0 0 1px var(--border)" : "none",
                }}>{l}</button>
              ))}
            </div>
          </div>
          {draft.credType === "password" && <>
            <Field label="Password" required>
              <input className="input t-mono" type="password" value={draft.password} onChange={e => setDraft(d => ({...d, password: e.target.value}))} placeholder="••••••••"/>
            </Field>
            <Toggle value={draft.complete} onChange={v => setDraft(d => ({...d, complete: v}))} label="Mark as complete" hint="Disable to indicate this is a partial / placeholder credential"/>
          </>}
          {draft.credType === "ssh" && <>
            <Field label="Certificate / key" required>
              <textarea className="input t-mono" rows={3} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."/>
            </Field>
            <Field label="Passphrase">
              <input className="input t-mono" type="password" placeholder="Optional"/>
            </Field>
          </>}
          {draft.credType === "params" && <>
            <Field label="Extra parameters">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input className="input" placeholder="Field name"/>
                  <input className="input t-mono" placeholder="Value"/>
                </div>
                <button type="button" className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start", padding: "4px 0", color: "var(--brand-fg)" }}><Icon name="plus" size={11}/> Add another</button>
              </div>
            </Field>
          </>}
          <Field label="Admin account" hint="PAM uses this account to rotate the password automatically">
            <Select value={draft.adminAccount || ""} onChange={v => setDraft(d => ({...d, adminAccount: v}))} options={[["","None"],["root-rotator","root-rotator"],["pam-svc","pam-svc"]]}/>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={addCred}>Add credential</button>
          </div>
        </div>
      )}

      {/* Reconciliation credential */}
      <div style={{ background: "var(--bg-surface-2)", border: "1px dashed var(--border)", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--warning-soft)", color: "var(--warning-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name="shield" size={15}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Reconciliation credential</div>
            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>A backup admin account PAM uses if the primary credential becomes invalid.</div>
          </div>
          {!data.reconCred && <button className="btn btn-sm" onClick={() => setReconOpen(true)}><Icon name="plus" size={11}/> Attach</button>}
        </div>
        {data.reconCred && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}>
            <Icon name="check-circle" size={13} color="var(--success-fg)"/>
            <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{data.reconCred.name}</span>
            <span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{data.reconCred.username}</span>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-ghost btn-sm" onClick={() => setData(d => ({...d, reconCred: null}))}>Detach</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---- Step 3: policy ----
const Step3Policy = ({ data, setData }) => {
  const [mode, setMode] = React.useState(data.policyId ? "existing" : "create");
  const policyType = data.type === "server" ? "SSH/SFTP" : data.type === "database" ? "Database" : data.type === "web" ? "Web app" : "RDP/VNC";

  const existing = (window.SEED_POLICIES || []).slice(0, 4);

  return (
    <div style={{ padding: "20px 24px 8px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h3 style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Set access policy for {data.name || "this resource"}</h3>
        <p style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Policies control recording, MFA, session timeout, and what users can do during a session.</p>
        <div className="badge" style={{ marginTop: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", borderColor: "transparent" }}>{policyType} policy</div>
      </div>

      <Segmented value={mode} onChange={setMode}
        options={[{value:"existing",label:"Use existing policy"},{value:"create",label:"Create policy for this resource"}]}/>

      {mode === "existing" && (
        <Field label="Select policy">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {existing.map(p => {
              const sel = data.policyId === p.id;
              return (
                <button key={p.id} type="button" onClick={() => setData(d => ({...d, policyId: p.id, policyName: p.name}))} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 12,
                  border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`,
                  background: sel ? "var(--brand-soft)" : "var(--bg-surface)",
                  borderRadius: 7, cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sel ? "var(--brand)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.name}</div>
                    <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 3, display: "flex", gap: 12 }}>
                      <span>Recording <span style={{ color: p.recording ? "var(--success-fg)" : "var(--fg-4)" }}>● {p.recording ? "On" : "Off"}</span></span>
                      <span>MFA <span style={{ color: p.jit ? "var(--success-fg)" : "var(--fg-4)" }}>● {p.jit ? "On" : "Off"}</span></span>
                      <span>Updated {p.updated}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {mode === "create" && <>
        <Field label="Policy name" required>
          <input className="input" value={data.newPolicyName || ""} onChange={e => setData(d => ({...d, newPolicyName: e.target.value}))} placeholder={`${data.name || "resource"} policy`}/>
        </Field>
        <Field label="Idle timeout" required>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input t-mono" type="number" defaultValue={15} style={{ width: 100 }}/>
            <Select value="minutes" onChange={() => {}} options={[["minutes","Minutes"],["hours","Hours"]]}/>
          </div>
        </Field>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
          <Toggle value={data.recording !== false} onChange={v => setData(d => ({...d, recording: v}))} label="Session recording" hint="Record all sessions on this resource"/>
          <Toggle value={!!data.mfaEnforce} onChange={v => setData(d => ({...d, mfaEnforce: v}))} label="Enforce MFA before session" hint="Require MFA verification before connecting"/>
          <Toggle value={data.audit !== false} onChange={v => setData(d => ({...d, audit: v}))} label="Audit events" hint="Log all commands and actions"/>
        </div>
        <Disclosure label="Advanced settings">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Toggle value={!!data.livestream} onChange={v => setData(d => ({...d, livestream: v}))} label="Livestream" hint="Allow security ops to watch sessions in real time"/>
            <Toggle value={!!data.sessionShare} onChange={v => setData(d => ({...d, sessionShare: v}))} label="Session share" hint="Let users invite others into the same session"/>
            <Field label="Command restrictions" hint="One blocked command per line. Useful for SSH/SFTP policies.">
              <textarea className="input t-mono" rows={3} placeholder={"rm -rf /\nshutdown\ndd if=…"}/></Field>
          </div>
        </Disclosure>
      </>}
    </div>
  );
};

// ---- Step 4: access ----
const Step4Access = ({ data, setData }) => {
  const [open, setOpen] = React.useState(data.allocations.length === 0);
  const [draft, setDraft] = React.useState({ subject: "", credId: "", window: "lifelong", from: "", to: "" });

  const credOptions = data.creds.map(c => [c.id, c.name]);
  const subjectOptions = [
    ["devops",     "DevOps team (group)"],
    ["sre",        "Site reliability engineers (group)"],
    ["priya",      "Priya Iyer (user)"],
    ["marcus",     "Marcus Chen (user)"],
    ["dba-lead",   "Database lead (role)"],
  ];

  const add = () => {
    if (!draft.subject) return;
    const subjLabel = subjectOptions.find(s => s[0] === draft.subject)?.[1] || draft.subject;
    const credLabel = credOptions.find(c => c[0] === draft.credId)?.[1] || "—";
    setData(d => ({...d, allocations: [...d.allocations, { ...draft, id: `alloc-${Date.now()}`, subjLabel, credLabel }]}));
    setDraft({ subject: "", credId: "", window: "lifelong", from: "", to: "" });
    setOpen(false);
  };

  return (
    <div style={{ padding: "20px 24px 8px", maxWidth: 720 }}>
      <h3 style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Allocate access to {data.name || "this resource"}</h3>
      <p style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 18px" }}>Define who can access this resource and for how long.</p>

      {data.allocations.length === 0 ? (
        <div style={{ padding: 24, border: "1px dashed var(--border)", borderRadius: 8, textAlign: "center", color: "var(--fg-3)", fontSize: 12.5, marginBottom: 14 }}>
          No one has access yet. Add an allocation below.
        </div>
      ) : (
        <table className="table" style={{ marginBottom: 14, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
          <thead><tr><th>Subject</th><th>Credential</th><th>Access window</th><th>Status</th><th></th></tr></thead>
          <tbody>{data.allocations.map((a, i) => (
            <tr key={a.id}>
              <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.subjLabel}</td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{a.credLabel}</td>
              <td style={{ fontSize: 12.5, color: "var(--fg-2)", textTransform: "capitalize" }}>{a.window === "custom" ? `${a.from} → ${a.to}` : a.window}</td>
              <td><span className="badge badge-success">Pending save</span></td>
              <td style={{ textAlign: "right" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setData(d => ({...d, allocations: d.allocations.filter((_,j) => j !== i)}))}>Remove</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {!open && <button className="btn btn-sm btn-primary" onClick={() => setOpen(true)}><Icon name="plus" size={11}/> Add allocation</button>}

      {open && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>New allocation</div>
          <Field label="Assign to" required>
            <Select value={draft.subject} onChange={v => setDraft(d => ({...d, subject: v}))} options={[["","Search users, groups, or roles…"], ...subjectOptions]}/>
          </Field>
          <Field label="Credential" hint="Pick which vaulted credential this subject will use">
            <Select value={draft.credId} onChange={v => setDraft(d => ({...d, credId: v}))} options={[["","Use any attached credential"], ...credOptions]}/>
          </Field>
          <Field label="Access window">
            <Segmented value={draft.window} onChange={v => setDraft(d => ({...d, window: v}))}
              options={[
                {value:"custom",label:"Custom"},
                {value:"zeroday",label:"Zero day"},
                {value:"lifelong",label:"Lifelong"},
                {value:"onetime",label:"One time"},
                {value:"hours",label:"Working hours"},
              ]}/>
          </Field>
          {draft.window === "custom" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="From"><input className="input" type="datetime-local" value={draft.from} onChange={e => setDraft(d => ({...d, from: e.target.value}))}/></Field>
              <Field label="To"><input className="input" type="datetime-local" value={draft.to} onChange={e => setDraft(d => ({...d, to: e.target.value}))}/></Field>
            </div>
          )}
          {draft.window === "zeroday" && <div style={{ padding: 10, background: "var(--warning-soft)", color: "var(--warning-fg)", fontSize: 12, borderRadius: 6 }}>User must raise a ticket for each access event. No standing access.</div>}
          {draft.window === "hours" && <div style={{ padding: 10, background: "var(--bg-surface-2)", color: "var(--fg-3)", fontSize: 12, borderRadius: 6 }}>Default: Mon–Fri, 09:00–18:00 (configurable in policy). Timezone: org default.</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={add}>Add</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Step 5: success ----
const Step5Success = ({ data, onView, onAnother, onClose }) => {
  const summary = [
    { ok: !!data.name, label: data.name ? `Basic info saved` : "Basic info incomplete",
      sub: `${data.type[0].toUpperCase()+data.type.slice(1)} · ${data.host || "—"} · ${data.env || "production"} · ${data.criticality || "medium"}` },
    { ok: data.creds.length > 0, label: data.creds.length > 0 ? `${data.creds.length} credential${data.creds.length>1?"s":""} attached` : "No credentials attached",
      sub: data.creds.length > 0 ? data.creds.map(c => c.name).join(", ") : "Add credentials" },
    { ok: !!data.policyId || !!data.newPolicyName, label: data.policyId || data.newPolicyName ? `Policy applied` : "No policy assigned",
      sub: data.policyId ? `${data.policyName} · Recording ${data.recording !== false ? "ON" : "OFF"}` : data.newPolicyName ? `${data.newPolicyName} (new) · Recording ${data.recording !== false ? "ON" : "OFF"}` : "Set policy" },
    { ok: data.allocations.length > 0, label: data.allocations.length > 0 ? `${data.allocations.length} allocation${data.allocations.length>1?"s":""} created` : "No allocations created",
      sub: data.allocations.length > 0 ? data.allocations.map(a => a.subjLabel).join(", ") : "Add an allocation" },
  ];
  return (
    <div style={{ padding: "32px 24px", maxWidth: 580, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name="check-circle" size={32}/>
      </div>
      <h2 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 6px" }}>{data.name || "Resource"} is ready</h2>
      <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "0 0 20px" }}>You can edit any of these later from the resource detail page.</p>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, width: "100%", display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
        {summary.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left" }}>
            <Icon name={s.ok ? "check-circle" : "alert-circle"} size={15} color={s.ok ? "var(--success-fg)" : "var(--warning-fg)"} style={{ flex: "none", marginTop: 1 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.label}</div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button className="btn btn-primary" onClick={onView}>View resource</button>
        <button className="btn" onClick={onAnother}>Add another resource</button>
        <button className="btn btn-ghost" onClick={onClose}>Go to Resources list</button>
      </div>
    </div>
  );
};

// ---- Main host ----
const ResourceAddPanel = ({ onClose, onCreated }) => {
  const [method, setMethod] = React.useState(null); // null | "manual" | "scan" | "ad" | "csv"
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    type: "server", name: "", host: "", port: 22, os: "linux",
    criticality: "medium", env: "production",
    creds: [], reconCred: null, allocations: [],
    recording: true, audit: true,
  });

  const valid = step === 1 ? !!(data.name && data.host) : true;

  if (!method) {
    return <Panel title="Add resource" onClose={onClose}>
      <EntryMethodCards onPick={(id) => {
        if (id === "manual") setMethod("manual");
        else if (id === "scan") onClose("scan");
        else setMethod(id);
      }}/>
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", textAlign: "right", background: "var(--bg-surface)" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Panel>;
  }

  if (method === "cloud") {
    return <Panel title="Cloud discovery" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 680, margin: "0 auto" }}>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 18 }}>
          Choose a cloud provider to scan. We'll pull EC2/VM, RDS/database, IAM users with privileged roles, and Kubernetes resources from the accounts you've connected.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { id: "aws",   label: "AWS",   sub: "2 accounts connected", connected: true },
            { id: "azure", label: "Azure", sub: "1 tenant connected",   connected: true },
            { id: "gcp",   label: "GCP",   sub: "Not connected",        connected: false },
          ].map(p => (
            <div key={p.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--bg-surface)" }}>
              <div style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{p.label}</div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: p.connected ? "var(--success-fg)" : "var(--fg-4)", marginTop: 4 }}>{p.sub}</div>
              <button className="btn btn-sm" style={{ marginTop: 10, width: "100%" }} disabled={!p.connected}>{p.connected ? "Scan" : "Connect first"}</button>
            </div>
          ))}
        </div>
        <Field label="Resource types to discover">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Compute (EC2/VM)","Databases (RDS/SQL)","IAM users","Kubernetes"].map(l => <Pill key={l} active>{l}</Pill>)}
          </div>
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setMethod(null)}>Back</button>
          <button className="btn btn-primary"><Icon name="cloud" size={13}/> Start discovery</button>
        </div>
      </div>
    </Panel>;
  }

  if (method === "k8s") {
    return <Panel title="Connect Kubernetes cluster" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 560, margin: "0 auto" }}>
        <Field label="Cluster name" required><input className="input" placeholder="prod-eks-us-east"/></Field>
        <Field label="Kubeconfig" hint="Upload kubeconfig or paste the cluster details below">
          <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: 24, textAlign: "center" }}>
            <Icon name="upload" size={20} color="var(--fg-4)"/>
            <div style={{ marginTop: 6, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)" }}>Drop kubeconfig here</div>
            <button className="btn btn-sm" style={{ marginTop: 10 }}>Choose file</button>
          </div>
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setMethod(null)}>Back</button>
          <button className="btn btn-primary">Connect cluster</button>
        </div>
      </div>
    </Panel>;
  }

  if (method === "api") {
    return <Panel title="API / Terraform onboarding" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 28, maxWidth: 640, margin: "0 auto" }}>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 16 }}>Manage resources as code with the Terraform provider, or push them via REST.</div>
        <pre style={{ background: "var(--bg-surface-2)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, font: "12px/1.5 var(--font-mono)", color: "var(--fg-2)", overflow: "auto" }}>{`resource "miniorange_pam_resource" "web_prod_01" {
  name        = "web-prod-01"
  type        = "linux"
  host        = "10.42.0.18"
  criticality = "high"
  environment = "production"
  policy      = "linux-server-admin"
}`}</pre>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="btn">View full docs</button>
          <button className="btn btn-primary">Generate API token</button>
        </div>
      </div>
    </Panel>;
  }

  if (method === "csv") {
    return <Panel title="Bulk import via CSV" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 32, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 40, textAlign: "center", background: "var(--bg-surface)" }}>
          <Icon name="upload" size={32} color="var(--fg-4)"/>
          <div style={{ marginTop: 12, font: "500 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Drop CSV file here</div>
          <div style={{ marginTop: 4, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>or</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }}>Choose file</button>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-3)" }}>
          Need the format? <a href="#" style={{ color: "var(--brand-fg)" }}>Download template (CSV)</a>
        </div>
      </div>
    </Panel>;
  }

  if (method === "ad") {
    return <Panel title="Import from Active Directory" onClose={onClose} back={() => setMethod(null)}>
      <div style={{ padding: 32, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: "var(--success-soft)", border: "1px solid transparent", borderRadius: 8, padding: 14, marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name="check-circle" size={15} color="var(--success-fg)" style={{ marginTop: 1 }}/>
          <div>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>Connected to kestrel.internal</div>
            <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--success-fg)", opacity: 0.85, marginTop: 2 }}>Last synced 3 minutes ago · 2,847 machine accounts available</div>
          </div>
        </div>
        <Field label="Organizational unit (OU)">
          <Select value="all" onChange={() => {}} options={[["all","All machines (2,847)"],["servers","CN=Servers (412)"],["workstations","CN=Workstations (2,401)"],["dmz","OU=DMZ (34)"]]}/>
        </Field>
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={() => setMethod(null)}>Back</button>
          <button className="btn btn-primary">Import 412 machines</button>
        </div>
      </div>
    </Panel>;
  }

  // Manual flow
  return <Panel
    title={step === 5 ? "Resource ready" : `Add resource — ${data.name || "untitled"}`}
    onClose={onClose}
    back={step > 1 && step < 5 ? () => setStep(step - 1) : (step === 1 ? () => setMethod(null) : null)}
  >
    {step <= 4 && <StepIndicator step={step}/>}
    {step === 1 && <Step1Basic data={data} setData={setData}/>}
    {step === 2 && <Step2Creds data={data} setData={setData}/>}
    {step === 3 && <Step3Policy data={data} setData={setData}/>}
    {step === 4 && <Step4Access data={data} setData={setData}/>}
    {step === 5 && <Step5Success data={data}
      onView={() => onCreated(data)}
      onAnother={() => { setData({ type: "server", name: "", host: "", port: 22, os: "linux", criticality: "medium", env: "production", creds: [], reconCred: null, allocations: [], recording: true, audit: true }); setStep(1); }}
      onClose={onClose}
    />}

    {step <= 4 && <div style={{ borderTop: "1px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10, background: "var(--bg-surface)" }}>
      <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      <div style={{ flex: 1 }}/>
      {step > 1 && step < 4 && <button className="btn btn-ghost" onClick={() => setStep(step + 1)}>Skip for now</button>}
      {step > 1 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
      <button className="btn btn-primary" disabled={!valid} onClick={() => setStep(step + 1)} style={{ opacity: valid ? 1 : 0.5 }}>
        {step === 1 ? "Save & continue to credentials"
        : step === 2 ? "Save & continue to policy"
        : step === 3 ? "Save & continue to access"
        : "Save & finish"}
      </button>
    </div>}
  </Panel>;
};

Object.assign(window, {
  ResourceAddPanel, Panel, Field, Pill, Segmented, Toggle, Select, Disclosure, StepIndicator,
});
