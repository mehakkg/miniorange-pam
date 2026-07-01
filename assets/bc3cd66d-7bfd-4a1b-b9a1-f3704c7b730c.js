// Settings — complete end-to-end. Groups: Organization · Integrations · API Access · Account.

// ======= SEED ============================================================
const SETTINGS_DATA = {
  org: { name: "Northwind Financial", customerKey: "10016", tokenKey: "dhorvas2wqui3fMi", version: "2.41" },
  session: { timeout: 60, timeoutUnit: "minutes" },
  loginSecurity: { maxFails: 3, lockoutWindow: 1, lockoutDuration: 30 },
  userOnboarding: { jitEnabled: true, jitRole: "End User" },
  resourceBehavior: { expiryAction: "notify", dbAccess: "terminal", liveStreamNotify: true, expiryNotify: true, expiryMinutes: 15 },

  recording: {
    enabled: false, scope: "all", types: ["SSH","RDP","Database","Web App","SFTP"],
    retention: 90, retentionUnit: "days", neverDelete: false,
    liveMonitoring: true, terminatePermission: "Security Admin role only",
    quality: "720p", keystroke: true, ocr: true,
  },

  proxy: {
    ssh: { enabled: true, host: "pam.northwind.com", port: 22, external: false, tunnel: true },
    rdp: { enabled: true, host: "pam.northwind.com", port: 3389 },
    db: { enabled: true, portFrom: 5000, portTo: 6000 },
    web: { webAgent: true, rds: false },
  },

  notifications: {
    adminEvents: { rotationFail: true, drift: true, certExpiry: true, certDays: 30, storageLow: true, storageThreshold: 20, loginSpike: true, breakGlass: true, connFail: false, discoveryScan: false },
    adminDelivery: { inApp: true, email: true, emailList: ["arjun@northwind.com","mohak@northwind.com"], webhook: false, webhookUrl: "" },
    userEvents: { approved: true, rejected: true, expiring: true, expiryHours: 2, revoked: true, monitored: false },
  },

  vault: {
    type: "local", algo: "AES-256", hash: "PBKDF2",
    external: { provider: null, status: null },
  },

  siem: { connections: [] },

  storage: {
    type: "local", used: 2.4, capacity: null,
    breakdown: { recordings: 1.8, logs: 0.4, other: 0.2 },
    retention: 90, retentionUnit: "days", autoDelete: false, autoThreshold: 90,
  },

  apiKeys: [
    { id: "ak-1", name: "Default Scoped API Key", desc: "Default PAM API key", perms: ["Read sessions","Read reports"], validFrom: "Dec 1, 2025", validUntil: "Dec 1, 2026", status: "active", lastUsed: "3 days ago", masked: "sk_live_dK9pN2mQ••••••••" },
    { id: "ak-2", name: "mo-ssh-microservice-communication", desc: "SSH service key", perms: ["Read sessions","Terminate sessions","Read credentials","Trigger rotation","Read reports","Export reports","Read resources","Read users"], validFrom: "Dec 2, 2025", validUntil: "Dec 2, 2125", status: "active", lastUsed: "Today", masked: "sk_live_xK9mN2pQ••••••••", fullAccess: true },
    { id: "ak-3", name: "Default EPM Scoped API Key", desc: "EPM integration", perms: ["Read resources"], validFrom: "Dec 1, 2025", validUntil: "Dec 1, 2025", status: "expired", lastUsed: "Never", masked: "sk_live_eM7kL4qR••••••••" },
  ],

  clientCreds: [
    { id: "cc-1", name: "Default Client Credential", clientId: "2839af14490d465089...", validFrom: "Dec 1, 2025", validUntil: "Dec 1, 2026", status: "active" },
    { id: "cc-2", name: "mo-ssh-microservice-co...", clientId: "b3a6099e35644c4494...", validFrom: "Dec 2, 2025", validUntil: "Dec 2, 2125", status: "active" },
  ],

  license: {
    plan: "PAM Enterprise", validUntil: "Dec 1, 2027", daysLeft: 532,
    users: { used: 142, limit: 500 }, resources: { used: 48, limit: 200 },
    credentials: { used: 156, limit: null }, recordings: { used: 2.4, limit: null },
  },
};

// ======= LAYOUT SHELL ====================================================
const SETTINGS_NAV = [
  { group: "Organization", items: [
    { id: "general",   label: "General",                        icon: "settings" },
    { id: "recording", label: "Session Recording & Monitoring", icon: "sessions", issue: true },
    { id: "proxy",     label: "Proxy Configuration",            icon: "globe" },
    { id: "notifs",    label: "Notifications",                  icon: "bell" },
  ]},
  { group: "Integrations", items: [
    { id: "vault",   label: "Vault Backend",          icon: "lock" },
    { id: "siem",    label: "SIEM & Event Forwarding", icon: "zap" },
    { id: "storage", label: "Storage",                icon: "database" },
  ]},
  { group: "API Access", items: [
    { id: "apikeys", label: "API Keys",           icon: "key" },
    { id: "clients", label: "Client Credentials", icon: "hash" },
  ]},
  { group: "Account", items: [
    { id: "license", label: "License & Plan", icon: "shield-check" },
  ]},
];

const SettingsScreen = () => {
  const [section, setSection] = React.useState("general");
  const [toast, setToast] = React.useState(null);
  const [data, setData] = React.useState(SETTINGS_DATA);

  const showToast = (t) => { setToast(t); setTimeout(() => setToast(null), 2400); };
  const save = (key) => showToast({ kind: "success", text: "Settings saved" });

  const sections = {
    general:   <GeneralSection   data={data} setData={setData} onSave={() => save("general")}/>,
    recording: <RecordingSection data={data} setData={setData} onSave={() => save("recording")}/>,
    proxy:     <ProxySection     data={data} setData={setData} onSave={() => save("proxy")} onToast={showToast}/>,
    notifs:    <NotificationsSection data={data} setData={setData} onSave={() => save("notifs")}/>,
    vault:     <VaultSection     data={data} setData={setData} onSave={() => save("vault")} onToast={showToast}/>,
    siem:      <SIEMSection      data={data} setData={setData} onSave={() => save("siem")} onToast={showToast}/>,
    storage:   <StorageSection   data={data} setData={setData} onSave={() => save("storage")} onToast={showToast}/>,
    apikeys:   <APIKeysSection   data={data} setData={setData} onToast={showToast}/>,
    clients:   <ClientCredsSection data={data} setData={setData} onToast={showToast}/>,
    license:   <LicenseSection   data={data}/>,
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Left sidebar */}
      <nav style={{ width: 220, borderRight: "1px solid var(--border)", background: "var(--bg-sidebar)", flexShrink: 0, overflow: "auto", padding: "16px 0" }}>
        <div style={{ padding: "0 20px 14px", font: "600 17px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Settings</div>
        {SETTINGS_NAV.map(g => (
          <div key={g.group} style={{ marginBottom: 8 }}>
            <div style={{ padding: "8px 20px 4px", font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7 }}>{g.group}</div>
            {g.items.map(it => {
              const active = section === it.id;
              return (
                <button key={it.id} onClick={() => setSection(it.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "8px 20px", border: "none",
                  borderLeft: `3px solid ${active ? "var(--brand)" : "transparent"}`,
                  background: active ? "var(--brand-soft)" : "transparent",
                  color: active ? "var(--brand-fg)" : "var(--fg-2)",
                  font: `${active ? 600 : 500} 13px/1 var(--font-sans)`,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <Icon name={it.icon} size={14} color={active ? "var(--brand-fg)" : "var(--fg-3)"}/>
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.issue && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--warning-fg)", flex: "none" }} title="Requires attention"/>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Content */}
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {sections[section] || null}
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

// ======= SHARED SETTING PRIMITIVES =======================================
const SettSection = ({ label, helper, children }) => (
  <div>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: helper ? 4 : 12 }}>{label}</div>
    {helper && <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", marginBottom: 14 }}>{helper}</div>}
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
  </div>
);

const SettToggle = ({ label, hint, value, onChange, badge }) => (
  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{label}</span>
        {badge && <span className={`badge badge-${badge}`}>{badge}</span>}
      </div>
      {hint && <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 3 }}>{hint}</div>}
    </div>
    <Toggle value={value} onChange={onChange}/>
  </div>
);

const SettRow = ({ label, hint, children }) => (
  <div>
    <label className="field-label" style={{ marginBottom: 6 }}>{label}</label>
    {children}
    {hint && <div className="field-help" style={{ marginTop: 4 }}>{hint}</div>}
  </div>
);

const SaveBar = ({ onSave, onDiscard, changed }) => {
  if (!changed) return null;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 32px", background: "var(--brand-soft)", borderBottom: "1px solid var(--brand-soft-2)" }}>
      <Icon name="alert-circle" size={13} color="var(--brand-fg)"/>
      <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Unsaved changes</span>
      <div style={{ flex: 1 }}/>
      <button className="btn btn-ghost btn-sm" onClick={onDiscard} style={{ color: "var(--fg-3)" }}>Discard</button>
      <button className="btn btn-primary btn-sm" onClick={onSave}>Save changes</button>
    </div>
  );
};

const SettContent = ({ children }) => (
  <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 840 }}>{children}</div>
);

const IntegStatusBadge = ({ status }) => {
  const m = { connected: { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "Connected ✓" }, error: { bg: "var(--danger-soft)", fg: "var(--danger-fg)", label: "Error ✗" }, unconfigured: { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", label: "Not configured ○" }, testing: { bg: "var(--brand-soft)", fg: "var(--brand-fg)", label: "Testing ◌" } }[status] || { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", label: status };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.label}</span>;
};

const DangerZone = ({ children }) => (
  <div style={{ border: "1px solid var(--danger)", borderRadius: 8, padding: 20, background: "color-mix(in oklch, var(--danger) 4%, transparent)" }}>
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--danger-fg)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 }}>Danger zone</div>
    {children}
  </div>
);

// ======= BREAK-GLASS CONFIG (rendered inside General) ====================
const BreakGlassConfigSection = () => {
  const BGc = window.BG_COLOR || "#7B3EA8";
  const [c, setC] = React.useState({ ...(window.bgStore ? window.bgStore.config : {}) });
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const setInit = (k, v) => setC(p => ({ ...p, initiators: { ...p.initiators, [k]: v } }));
  const save = () => { if (window.bgStore) window.bgStore.config = c; window.pamToast && window.pamToast("Break-glass configuration saved"); };
  const lock = [["Session recording", "All break-glass sessions are always recorded"], ["Keystroke logging", "All commands are captured"], ["MFA re-verification", "User must re-verify MFA before accessing"], ["Post-incident review required", "Grant cannot be closed without a review"], ["Credential rotation after session", "Credentials used are rotated within 24h of session end"]];
  return (
    <div style={{ borderLeft: `3px solid ${BGc}`, paddingLeft: 18, marginTop: 8 }}>
      <div style={{ font: "600 10.5px/1 var(--font-sans)", color: BGc, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>⚡ Break-Glass</div>
      <div style={{ padding: 14, background: "color-mix(in oklch, #7B3EA8 9%, transparent)", borderRadius: 8, font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)", marginBottom: 20 }}>
        Break-glass provides emergency access to critical resources that bypasses normal approval workflows. Every break-glass session is mandatory-recorded, time-limited, and requires post-incident review.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SettSection label="Authorized initiators" helper="Only users with these roles can declare a break-glass emergency.">
          <SettToggle label="Admin" hint="Full access to all resources" value={c.initiators.admin} onChange={v => setInit("admin", v)}/>
          <SettToggle label="Operator" hint="Can be enabled for specific resource groups only" value={c.initiators.operator} onChange={v => setInit("operator", v)}/>
          {c.initiators.operator && (
            <div style={{ padding: 12, background: "var(--warning-soft)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Granting break-glass to Operators significantly expands their access. Restrict by resource tag below.
              <div style={{ marginTop: 8 }}><Select value="" onChange={() => {}} options={[["", "Restrict to resource tags…"], ["critical", "critical"], ["production", "production"]]}/></div>
            </div>
          )}
          <SettToggle label="Custom role" hint="Grant to a specific custom role" value={c.initiators.custom} onChange={v => setInit("custom", v)}/>
        </SettSection>

        <SettSection label="Eligible recipients" helper="Users who can have break-glass access granted to them.">
          <Segmented value={c.recipients} onChange={v => set("recipients", v)} options={[{ value: "any", label: "Any PAM user" }, { value: "roles", label: "Specific roles" }, { value: "roster", label: "On-call roster" }]}/>
          {c.recipients === "roster" && <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>On-call roster integration — coming soon.</div>}
        </SettSection>

        <SettSection label="Access duration limits">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <SettRow label="Default duration" hint="Emergency access expires after this time unless extended."><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input className="input" type="number" value={c.defaultHrs} onChange={e => set("defaultHrs", +e.target.value)} style={{ width: 90 }}/><span style={{ color: "var(--fg-3)", fontSize: 13 }}>hours</span></div></SettRow>
            <SettRow label="Maximum allowed duration" hint="No single grant can exceed this limit."><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input className="input" type="number" value={c.maxHrs} onChange={e => set("maxHrs", +e.target.value)} style={{ width: 90 }}/><span style={{ color: "var(--fg-3)", fontSize: 13 }}>hours</span></div></SettRow>
          </div>
          <SettToggle label="Allow extension" hint="The granting admin can extend an active emergency." value={c.extensionAllowed} onChange={v => set("extensionAllowed", v)}/>
          {c.extensionAllowed && <SettRow label="Max extensions per incident"><input className="input" type="number" value={c.maxExtensions} onChange={e => set("maxExtensions", +e.target.value)} style={{ width: 90 }}/></SettRow>}
          <SettToggle label="Auto-revoke on session end" hint="Access is revoked the moment the session ends — no reconnect without a new grant." value={c.autoRevoke} onChange={v => set("autoRevoke", v)}/>
        </SettSection>

        <SettSection label="Security controls (cannot be disabled)">
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: 14, background: "var(--bg-surface-2)", borderRadius: 8 }}>
            {lock.map(([l, h]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <span style={{ color: "var(--fg-3)" }}>🔒</span>
                <div style={{ flex: 1 }}><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{l}</div><div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>{h}</div></div>
                <span style={{ font: "500 11px/1.5 var(--font-sans)", color: "var(--success-fg)", background: "var(--success-soft)", padding: "2px 8px", borderRadius: 999 }}>Always on</span>
              </div>
            ))}
            <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>These controls ensure break-glass access is always auditable. They cannot be disabled regardless of role or policy.</div>
          </div>
        </SettSection>

        <SettSection label="Emergency justification">
          <SettToggle label="Require written justification" hint="Always required — cannot be disabled." value={true} onChange={() => {}}/>
          <SettRow label="Minimum characters"><input className="input" type="number" value={c.minChars} onChange={e => set("minChars", +e.target.value)} style={{ width: 90 }}/></SettRow>
          <SettToggle label="Require incident ticket reference" value={c.requireTicket} onChange={v => set("requireTicket", v)}/>
          {c.requireTicket && <SettRow label="Ticket field label"><input className="input" value={c.ticketLabel} onChange={e => set("ticketLabel", e.target.value)} placeholder="PagerDuty incident #"/></SettRow>}
          <SettToggle label="Require manager notification" value={c.requireManagerNotify} onChange={v => set("requireManagerNotify", v)}/>
        </SettSection>

        <SettSection label="Alert and escalation">
          <SettRow label="Notify when break-glass is initiated" hint="Delivery: In-app + Email (SMS / Webhook available)."><Select value="admins" onChange={() => {}} options={[["admins", "All Security Admins"], ["specific", "Specific recipients…"]]}/></SettRow>
          <SettRow label="Escalate if post-review is not completed within"><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input className="input" type="number" value={c.escalateDays} onChange={e => set("escalateDays", +e.target.value)} style={{ width: 90 }}/><span style={{ color: "var(--fg-3)", fontSize: 13 }}>days</span></div></SettRow>
        </SettSection>

        <SettSection label="Resources eligible for break-glass" helper="Limit which resources can be accessed via break-glass.">
          <Segmented value={c.resourceScope} onChange={v => set("resourceScope", v)} options={[{ value: "all", label: "All resources" }, { value: "tags", label: "Matching tags" }, { value: "specific", label: "Specific" }]}/>
          <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>{c.resourceScope === "all" ? "All 47 resources are currently eligible for break-glass." : c.resourceScope === "tags" ? "12 resources match the selected tags." : "Select specific resources below."}</div>
        </SettSection>

        <div><button className="btn" style={{ background: BGc, color: "#fff", borderColor: BGc }} onClick={save}>Save break-glass configuration</button></div>
      </div>
    </div>
  );
};

// ======= GROUP 1: GENERAL ================================================
const GeneralSection = ({ data, setData, onSave }) => {
  const [changed, setChanged] = React.useState(false);
  const set = (path, val) => { setData(d => { const n = {...d}; const keys = path.split("."); let o = n; keys.slice(0,-1).forEach(k => o = o[k]); o[keys[keys.length-1]] = val; return n; }); setChanged(true); };

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      <SettContent>
        <div>
          <h1 className="h-title">General</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Core PAM behavior — sessions, login security, and user onboarding.</p>
        </div>

        <SettSection label="Organization">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <SettRow label="Organization name">
              <input className="input" value={data.org.name} onChange={e => set("org.name", e.target.value)}/>
            </SettRow>
            <SettRow label="Version">
              <input className="input" value={data.org.version} disabled style={{ background: "var(--bg-surface-2)", color: "var(--fg-3)" }}/>
            </SettRow>
            <SettRow label="Customer key" hint="Contact miniOrange to update.">
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input t-mono" value={data.org.customerKey} readOnly style={{ background: "var(--bg-surface-2)" }}/>
                <button className="btn btn-ghost btn-icon" title="Copy"><Icon name="copy" size={12}/></button>
              </div>
            </SettRow>
            <SettRow label="Token key">
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input t-mono" value={"••••••••••••••••"} readOnly style={{ background: "var(--bg-surface-2)" }}/>
                <button className="btn btn-ghost btn-icon" title="Reveal"><Icon name="eye" size={12}/></button>
                <button className="btn btn-ghost btn-icon" title="Copy"><Icon name="copy" size={12}/></button>
              </div>
            </SettRow>
          </div>
        </SettSection>

        <SettSection label="Session Behavior" helper="Controls how long users stay logged in to the PAM portal. Does not affect resource session timeouts — those are configured per policy.">
          <SettRow label="Portal session timeout">
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" type="number" value={data.session.timeout} onChange={e => set("session.timeout", +e.target.value)} style={{ width: 100 }}/>
              <Select value={data.session.timeoutUnit} onChange={v => set("session.timeoutUnit", v)} options={[["minutes","minutes"],["hours","hours"]]}/>
            </div>
            <div className="field-help" style={{ marginTop: 4 }}>Users are automatically logged out after this period of inactivity in the PAM portal.</div>
          </SettRow>
        </SettSection>

        <SettSection label="Login Security">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <SettRow label="Max failed login attempts" hint="Account is locked after this many consecutive failures.">
              <input className="input" type="number" value={data.loginSecurity.maxFails} onChange={e => set("loginSecurity.maxFails", +e.target.value)}/>
            </SettRow>
            <SettRow label="Lockout timeframe (min)" hint="Window in which failures are counted.">
              <input className="input" type="number" value={data.loginSecurity.lockoutWindow} onChange={e => set("loginSecurity.lockoutWindow", +e.target.value)}/>
            </SettRow>
            <SettRow label="Account lockout duration (min)" hint="How long a locked account stays locked.">
              <input className="input" type="number" value={data.loginSecurity.lockoutDuration} onChange={e => set("loginSecurity.lockoutDuration", +e.target.value)}/>
            </SettRow>
          </div>
        </SettSection>

        <SettSection label="User Onboarding">
          <SettToggle label="Enable user auto-registration (JIT provisioning)" hint="When ON, users who log in via SSO for the first time are automatically created in PAM as End Users." value={data.userOnboarding.jitEnabled} onChange={v => set("userOnboarding.jitEnabled", v)}/>
          {data.userOnboarding.jitEnabled && (
            <>
              <div style={{ padding: 10, background: "var(--warning-soft)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)", color: "var(--warning-fg)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Icon name="alert-circle" size={13}/>
                <span>Auto-registration creates End User accounts. Set up role mapping in Authentication to automatically assign appropriate roles.</span>
              </div>
              <SettRow label="Default role for JIT-provisioned users">
                <Select value={data.userOnboarding.jitRole} onChange={v => set("userOnboarding.jitRole", v)} options={[["End User","End User"],["Operator","Operator"],["Auditor Admin","Auditor Admin"]]}/>
              </SettRow>
            </>
          )}
        </SettSection>

        <SettSection label="Resource Behavior">
          <SettRow label="Resource access expiry action" hint="What happens when a user's access window expires while they have the resource open.">
            <Select value={data.resourceBehavior.expiryAction} onChange={v => set("resourceBehavior.expiryAction", v)} options={[["notify","Show to end user (display expiry countdown)"],["block","Block access silently"],["notifyblock","Send notification and block"]]}/>
          </SettRow>
          <SettRow label="Database access type" hint="GUI mode enables a visual database management interface.">
            <Segmented value={data.resourceBehavior.dbAccess} onChange={v => set("resourceBehavior.dbAccess", v)} options={[{value:"terminal",label:"Terminal only"},{value:"terminal+gui",label:"Terminal + GUI"}]}/>
          </SettRow>
          <SettToggle label="End user live stream notification" hint="Notify users when an admin is live-monitoring their session." value={data.resourceBehavior.liveStreamNotify} onChange={v => set("resourceBehavior.liveStreamNotify", v)}/>
          <SettToggle label="Resource expiry notification" hint="Notify users before their access window ends." value={data.resourceBehavior.expiryNotify} onChange={v => set("resourceBehavior.expiryNotify", v)}/>
          {data.resourceBehavior.expiryNotify && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 0 }}>
              <span className="t-small">Notify</span>
              <input className="input" type="number" value={data.resourceBehavior.expiryMinutes} onChange={e => set("resourceBehavior.expiryMinutes", +e.target.value)} style={{ width: 80 }}/>
              <span className="t-small">minutes before expiry</span>
            </div>
          )}
        </SettSection>

        <BreakGlassConfigSection/>
      </SettContent>
    </div>
  );
};

// ======= GROUP 1: SESSION RECORDING ======================================
const RecordingSection = ({ data, setData, onSave }) => {
  const [changed, setChanged] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const r = data.recording;
  const set = (k, v) => { setData(d => ({...d, recording: {...d.recording, [k]: v}})); setChanged(true); };

  const daily = 12 * (r.quality === "720p" ? 0.2 : r.quality === "1080p" ? 0.5 : 0.08);

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      {!r.enabled && (
        <div style={{ padding: "14px 32px", background: "var(--danger)", display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="alert-triangle" size={16} color="#fff"/>
          <span style={{ font: "600 13.5px/1.4 var(--font-sans)", color: "#fff", flex: 1 }}>⚑ Session recording is currently <strong>disabled</strong>. PAM cannot provide forensic evidence for compliance audits without recording.</span>
          <button className="btn" style={{ background: "#fff", color: "var(--danger)", borderColor: "transparent", fontWeight: 600 }} onClick={() => setShowConfirm(true)}>Enable recording →</button>
        </div>
      )}
      <SettContent>
        <div>
          <h1 className="h-title">Session Recording & Monitoring</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Global defaults for how privileged sessions are recorded and monitored. Individual policies can override these settings per resource.</p>
        </div>

        <SettSection label="Recording">
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `2px solid ${r.enabled ? "var(--success)" : "var(--danger)"}`, borderRadius: 8, background: r.enabled ? "var(--success-soft)" : "var(--danger-soft)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 14px/1.3 var(--font-sans)", color: r.enabled ? "var(--success-fg)" : "var(--danger-fg)" }}>{r.enabled ? "Recording enabled ✓" : "Recording disabled ✗"}</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{r.enabled ? "All sessions are being recorded per the scope below." : "No sessions are being recorded. Enable to start compliance recording."}</div>
            </div>
            <Toggle value={r.enabled} onChange={v => { if (v) setShowConfirm(true); else { set("enabled", false); } }}/>
          </div>

          {r.enabled && (
            <>
              <SettRow label="Recording scope">
                <Segmented value={r.scope} onChange={v => set("scope", v)} options={[{value:"all",label:"All sessions"},{value:"types",label:"Specific types"},{value:"policy",label:"Per policy only"}]}/>
              </SettRow>

              {r.scope === "types" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["SSH","RDP","Database","Web App","SFTP"].map(t => {
                    const sel = r.types.includes(t);
                    return <button key={t} onClick={() => set("types", sel ? r.types.filter(x => x !== t) : [...r.types, t])} style={{ padding: "5px 12px", borderRadius: 999, border: `1px solid ${sel ? "var(--brand)" : "var(--border)"}`, background: sel ? "var(--brand-soft)" : "var(--bg-surface)", color: sel ? "var(--brand-fg)" : "var(--fg-2)", font: "500 12px/1 var(--font-sans)", cursor: "pointer" }}>{t}</button>;
                  })}
                </div>
              )}

              <SettRow label="Retention policy">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="input" type="number" value={r.retention} onChange={e => set("retention", +e.target.value)} style={{ width: 100 }} disabled={r.neverDelete}/>
                  <Select value={r.retentionUnit} onChange={v => set("retentionUnit", v)} options={[["days","days"],["months","months"],["years","years"]]}/>
                  <span className="t-small">or</span>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)", cursor: "pointer" }}>
                    <input type="checkbox" checked={r.neverDelete} onChange={e => set("neverDelete", e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
                    Never delete
                  </label>
                </div>
                {!r.neverDelete && r.retention < 90 && (
                  <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.5 var(--font-sans)" }}>⚠ Most compliance frameworks (PCI DSS, SOC2) require 90+ days of session evidence retention.</div>
                )}
              </SettRow>
            </>
          )}
        </SettSection>

        <SettSection label="Live Monitoring">
          <SettToggle label="Enable live session monitoring" hint="Allows admins with monitoring capability to view ongoing sessions in real time." value={r.liveMonitoring} onChange={v => set("liveMonitoring", v)}/>
          <SettRow label="Session termination permission">
            <Segmented value={r.terminatePermission} onChange={v => set("terminatePermission", v)} options={[{value:"All admins",label:"All admins"},{value:"Security Admin role only",label:"Security Admin only"},{value:"Custom",label:"Custom"}]}/>
          </SettRow>
        </SettSection>

        <SettSection label="Recording Quality" helper={r.enabled ? undefined : "Enable recording to configure quality settings."}>
          {r.enabled ? <>
            <SettRow label="Video quality">
              <Select value={r.quality} onChange={v => set("quality", v)} options={[["1080p","High (1080p) — ≈500 MB/hour"],["720p","Standard (720p) — ≈200 MB/hour (recommended)"],["480p","Low (480p) — ≈80 MB/hour"]]}/>
            </SettRow>
            <SettToggle label="Keystroke logging" hint="Records every keystroke and command alongside the video. Essential for forensic investigation." value={r.keystroke} onChange={v => set("keystroke", v)}/>
            <SettToggle label="OCR indexing" hint="Makes recordings searchable by text visible on screen. Required for compliance search." value={r.ocr} onChange={v => set("ocr", v)}/>
          </> : <div className="t-small" style={{ color: "var(--fg-4)" }}>Recording is disabled.</div>}
        </SettSection>

        {r.enabled && (
          <SettSection label="Estimated Storage Usage">
            <div className="card" style={{ padding: 16 }}>
              {[["Active sessions/day","12"],["Average session duration","22 min"],["Estimated daily storage",`${daily.toFixed(1)} GB`],["Estimated monthly storage",`${(daily*30).toFixed(0)} GB`]].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)", font: "400 12.5px/1.4 var(--font-sans)" }}>
                  <span style={{ color: "var(--fg-4)" }}>{k}</span>
                  <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 10 }}>
                <a href="#" style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Configure storage destination →</a>
              </div>
            </div>
          </SettSection>
        )}
      </SettContent>

      {showConfirm && <ConfirmModal title="Enable session recording for all users?" body="Sessions will be recorded starting immediately. Recording uses storage — ensure your storage is configured before enabling." confirmLabel="Enable recording" onClose={() => setShowConfirm(false)} onConfirm={() => { set("enabled", true); setShowConfirm(false); }}/>}
    </div>
  );
};

// ======= GROUP 1: PROXY ==================================================
const ProxySection = ({ data, setData, onSave, onToast }) => {
  const [changed, setChanged] = React.useState(false);
  const [testResults, setTestResults] = React.useState({});
  const p = data.proxy;
  const setP = (k, v) => { setData(d => { const n = {...d}; n.proxy = {...n.proxy, [k]: {...n.proxy[k], ...v}}; return n; }); setChanged(true); };

  const test = (type) => {
    setTestResults(t => ({...t, [type]: "testing"}));
    setTimeout(() => setTestResults(t => ({...t, [type]: "success"})), 1200);
  };

  const TestResult = ({ type }) => {
    const r = testResults[type];
    if (!r) return null;
    if (r === "testing") return <div className="row" style={{ marginTop: 8, color: "var(--fg-2)" }}><Spinner size={12}/> Testing…</div>;
    return <div className="row" style={{ marginTop: 8 }}><Icon name="check-circle" size={13} color="var(--success-fg)"/><span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>Reachable — connection succeeded</span></div>;
  };

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      <SettContent>
        <div>
          <h1 className="h-title">Proxy Configuration</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Configure how PAM proxies sessions to resources. Proxy settings are required for credential-injected access (users never see passwords).</p>
        </div>

        {[
          { id: "ssh", label: "SSH Proxy", desc: "Required for SSH, SFTP, and terminal-based connections.", fields: <>
            {p.ssh.enabled && <>
              <SettToggle label="Use external SSH proxy" hint="For enterprises with their own jump host." value={p.ssh.external} onChange={v => setP("ssh", {external: v})}/>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <SettRow label="SSH proxy host"><input className="input t-mono" value={p.ssh.host} onChange={e => setP("ssh", {host: e.target.value})} disabled={!p.ssh.external}/></SettRow>
                <SettRow label="Port"><input className="input t-mono" type="number" value={p.ssh.port} onChange={e => setP("ssh", {port: +e.target.value})}/></SettRow>
              </div>
              <SettToggle label="Enable SSH tunnel configuration" hint="Allows PAM to create SSH tunnels for database and application connections over SSH." value={p.ssh.tunnel} onChange={v => setP("ssh", {tunnel: v})}/>
            </>}
          </> },
          { id: "rdp", label: "RDP Proxy", desc: "Required for Remote Desktop connections to Windows servers.", fields: <>
            {p.rdp.enabled && (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <SettRow label="RDP proxy host"><input className="input t-mono" value={p.rdp.host} onChange={e => setP("rdp", {host: e.target.value})}/></SettRow>
                <SettRow label="Port"><input className="input t-mono" type="number" value={p.rdp.port} onChange={e => setP("rdp", {port: +e.target.value})}/></SettRow>
              </div>
            )}
          </> },
          { id: "db", label: "Database Proxy", desc: "Required for credential-injected database access (MySQL, PostgreSQL, Oracle, MSSQL).", fields: <>
            {p.db.enabled && (
              <SettRow label="Database proxy port range" hint="PAM assigns a port from this range for each database connection. Range must not conflict with other services.">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="input t-mono" type="number" value={p.db.portFrom} onChange={e => setP("db", {portFrom: +e.target.value})} style={{ width: 100 }}/>
                  <span className="t-small">to</span>
                  <input className="input t-mono" type="number" value={p.db.portTo} onChange={e => setP("db", {portTo: +e.target.value})} style={{ width: 100 }}/>
                </div>
              </SettRow>
            )}
          </> },
          { id: "web", label: "Web App Access", desc: "Configure how users access web-based resources through PAM.", fields: <>
            {p.web.webAgent && <SettToggle label="Enable XecureAccess Web Agent" hint="Browser-based agent for accessing web applications without installing software." value={p.web.webAgent} onChange={v => setP("web", {webAgent: v})}/>}
          </> },
        ].map(proxy => {
          const enabled = p[proxy.id]?.enabled !== false;
          return (
            <SettSection key={proxy.id} label={proxy.label} helper={proxy.desc}>
              <SettToggle label={`Enable ${proxy.label}`} value={p[proxy.id]?.enabled !== false} onChange={v => setP(proxy.id, {enabled: v})}/>
              {p[proxy.id]?.enabled !== false && <>
                {proxy.fields}
                <div>
                  <button className="btn btn-sm" onClick={() => test(proxy.id)} disabled={testResults[proxy.id] === "testing"}><Icon name="check-circle" size={11}/> Test {proxy.label.split(" ")[0].toLowerCase()} proxy</button>
                  <TestResult type={proxy.id}/>
                </div>
              </>}
            </SettSection>
          );
        })}
      </SettContent>
    </div>
  );
};

// ======= GROUP 1: NOTIFICATIONS ==========================================
const NotificationsSection = ({ data, setData, onSave }) => {
  const [changed, setChanged] = React.useState(false);
  const n = data.notifications;
  const setN = (path, v) => { setData(d => { const u = {...d}; const keys = ("notifications." + path).split("."); let o = u; keys.slice(0,-1).forEach(k => o = o[k]); o[keys[keys.length-1]] = v; return u; }); setChanged(true); };

  const EvtRow = ({ label, desc, checked, onChange, children }) => (
    <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{label}</div>
          <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{desc}</div>
          {checked && children && <div style={{ marginTop: 8 }}>{children}</div>}
        </div>
      </label>
    </div>
  );

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      <SettContent>
        <div>
          <h1 className="h-title">Notifications</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Configure what events trigger notifications and how they're delivered.</p>
        </div>

        <SettSection label="Admin Alerts" helper="Alerts sent to admins about system health and security events.">
          <EvtRow label="Credential rotation failure" desc="Alert when an automated rotation fails" checked={n.adminEvents.rotationFail} onChange={v => setN("adminEvents.rotationFail", v)}/>
          <EvtRow label="Credential drift detected" desc="Alert when a vaulted credential drifts out of sync" checked={n.adminEvents.drift} onChange={v => setN("adminEvents.drift", v)}/>
          <EvtRow label="Certificate expiring soon" desc="Alert before a certificate's expiry date" checked={n.adminEvents.certExpiry} onChange={v => setN("adminEvents.certExpiry", v)}>
            <div className="row">
              <span className="t-small">Alert</span>
              <input className="input" type="number" value={n.adminEvents.certDays} onChange={e => setN("adminEvents.certDays", +e.target.value)} style={{ width: 70 }}/>
              <span className="t-small">days before expiry</span>
            </div>
          </EvtRow>
          <EvtRow label="Session recording storage low" desc="Alert when recording storage is running low" checked={n.adminEvents.storageLow} onChange={v => setN("adminEvents.storageLow", v)}>
            <div className="row">
              <span className="t-small">Alert when storage below</span>
              <input className="input" type="number" value={n.adminEvents.storageThreshold} onChange={e => setN("adminEvents.storageThreshold", +e.target.value)} style={{ width: 70 }}/>
              <span className="t-small">%</span>
            </div>
          </EvtRow>
          <EvtRow label="Failed login attempt spike" desc="Alert on unusual login failure volume" checked={n.adminEvents.loginSpike} onChange={v => setN("adminEvents.loginSpike", v)}/>
          <EvtRow label="Break-glass access granted" desc="Alert immediately whenever emergency access is used" checked={n.adminEvents.breakGlass} onChange={v => setN("adminEvents.breakGlass", v)}/>
          <EvtRow label="Resource connection failure" desc="Alert when a resource becomes unreachable" checked={n.adminEvents.connFail} onChange={v => setN("adminEvents.connFail", v)}/>
          <EvtRow label="Discovery scan completed" desc="Alert when a network or cloud scan finishes" checked={n.adminEvents.discoveryScan} onChange={v => setN("adminEvents.discoveryScan", v)}/>
        </SettSection>

        <SettSection label="Admin Alert Delivery">
          <SettToggle label="In-app notifications" hint="Show alerts in the PAM notification bell" value={n.adminDelivery.inApp} onChange={v => setN("adminDelivery.inApp", v)}/>
          <SettToggle label="Email" value={n.adminDelivery.email} onChange={v => setN("adminDelivery.email", v)}/>
          {n.adminDelivery.email && (
            <div style={{ paddingLeft: 0 }}>
              <label className="field-label">Email recipients</label>
              <div className="input" style={{ height: "auto", display: "flex", flexWrap: "wrap", gap: 4, padding: 8, alignItems: "center" }}>
                {n.adminDelivery.emailList.map(e => <span key={e} className="badge badge-brand">{e}<Icon name="x" size={9} style={{ marginLeft: 4, cursor: "pointer" }}/></span>)}
                <input style={{ border: "none", outline: "none", flex: 1, minWidth: 120, font: "400 13px/1 var(--font-sans)", background: "transparent" }} placeholder="Add email…"/>
              </div>
            </div>
          )}
          <SettToggle label="Webhook" hint="POST to a custom endpoint for each alert" value={n.adminDelivery.webhook} onChange={v => setN("adminDelivery.webhook", v)}/>
          {n.adminDelivery.webhook && (
            <SettRow label="Webhook URL">
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input t-mono" value={n.adminDelivery.webhookUrl} onChange={e => setN("adminDelivery.webhookUrl", e.target.value)} placeholder="https://hooks.example.com/pam"/>
                <button className="btn btn-sm">Test webhook</button>
              </div>
            </SettRow>
          )}
        </SettSection>

        <SettSection label="User Notifications" helper="Notifications sent to end users about their access.">
          <EvtRow label="Access approved" desc="Notify user when their ticket is approved" checked={n.userEvents.approved} onChange={v => setN("userEvents.approved", v)}/>
          <EvtRow label="Access rejected" desc="Notify user when their ticket is rejected. Includes rejection reason." checked={n.userEvents.rejected} onChange={v => setN("userEvents.rejected", v)}/>
          <EvtRow label="Access expiring" desc="Notify user before their access window ends" checked={n.userEvents.expiring} onChange={v => setN("userEvents.expiring", v)}>
            <div className="row">
              <input className="input" type="number" value={n.userEvents.expiryHours} onChange={e => setN("userEvents.expiryHours", +e.target.value)} style={{ width: 70 }}/>
              <span className="t-small">hours before expiry</span>
            </div>
          </EvtRow>
          <EvtRow label="Access revoked" desc="Notify user immediately if their access is revoked by an admin" checked={n.userEvents.revoked} onChange={v => setN("userEvents.revoked", v)}/>
          <EvtRow label="Session being monitored" desc="Notify user when an admin is watching their live session" checked={n.userEvents.monitored} onChange={v => setN("userEvents.monitored", v)}/>
        </SettSection>
      </SettContent>
    </div>
  );
};

// ======= GROUP 2: VAULT ==================================================
const VaultSection = ({ data, setData, onSave, onToast }) => {
  const [changed, setChanged] = React.useState(false);
  const [configuring, setConfiguring] = React.useState(null);
  const [testState, setTestState] = React.useState("idle");
  const v = data.vault;
  const set = (k, val) => { setData(d => ({...d, vault: {...d.vault, [k]: val}})); setChanged(true); };

  const providers = [
    { id: "aws",        label: "AWS Secrets Manager", icon: "cloud",    fields: [["Region","us-east-1","select"],["Access Key ID","","text"],["Secret Access Key","","masked"],["Secret prefix (optional)","pam/",""]] },
    { id: "azure",      label: "Azure Key Vault",      icon: "cloud",    fields: [["Vault URL","https://kestrel.vault.azure.net","text"],["Tenant ID","","text"],["Client ID","","text"],["Client Secret","","masked"]] },
    { id: "hashicorp",  label: "HashiCorp Vault",      icon: "shield",   fields: [["Vault URL","https://vault.northwind.com:8200","text"],["Token","","masked"],["Mount path","secret/","text"]] },
    { id: "keepass",    label: "KeePass",              icon: "key",      fields: [["Database path","","text"],["Master password","","masked"]] },
  ];

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      <SettContent>
        <div>
          <h1 className="h-title">Vault Backend</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Where PAM stores encrypted credentials. PAM's local vault is active by default.</p>
        </div>

        <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--success-soft)", color: "var(--success-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="lock" size={20}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>PAM Local Vault</div>
            <div style={{ display: "flex", gap: 14, marginTop: 6, font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>
              <span>Encryption: <strong style={{ color: "var(--fg-1)" }}>AES-256</strong></span>
              <span>Hashing: <strong style={{ color: "var(--fg-1)" }}>PBKDF2</strong></span>
            </div>
          </div>
          <IntegStatusBadge status="connected"/>
        </div>

        <SettSection label="Local Vault Settings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <SettRow label="Encryption algorithm">
              <Select value="AES-256" onChange={() => setChanged(true)} options={[["AES-256","AES-256 (recommended)"],["AES-128","AES-128"]]}/>
            </SettRow>
            <SettRow label="Hashing algorithm">
              <Select value="PBKDF2" onChange={() => setChanged(true)} options={[["PBKDF2","PBKDF2 (recommended)"],["Argon2id","Argon2id"],["bcrypt","bcrypt"]]}/>
            </SettRow>
          </div>
          <SettRow label="Secret key">
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input t-mono" value="••••••••••••••••••••••••••••••••" readOnly style={{ background: "var(--bg-surface-2)" }}/>
              <button className="btn btn-ghost btn-icon" title="Reveal"><Icon name="eye" size={12}/></button>
              <button className="btn btn-ghost btn-icon" title="Copy"><Icon name="copy" size={12}/></button>
              <button className="btn btn-sm" style={{ color: "var(--warning-fg)", borderColor: "var(--warning-fg)" }}>Generate new key</button>
            </div>
          </SettRow>
        </SettSection>

        <SettSection label="External Vault Integration" helper="Connect PAM to an external secrets manager for enterprise key management.">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {providers.map(p => (
              <div key={p.id} className="card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 7, background: "var(--bg-surface-2)", color: "var(--fg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={p.icon} size={16}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{p.label}</div>
                  <IntegStatusBadge status="unconfigured"/>
                </div>
                <button className="btn btn-sm" onClick={() => setConfiguring(p)}>Configure →</button>
              </div>
            ))}
          </div>
        </SettSection>

        <DangerZone>
          <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Migrate vault</div>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Migrate all credentials from local vault to an external vault. Your local vault remains as a backup until you confirm the migration succeeded.</div>
          <button className="btn btn-sm" style={{ marginTop: 10, color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }} disabled>Start migration</button>
          <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 4 }}>Configure an external vault provider first to enable migration.</div>
        </DangerZone>
      </SettContent>

      {configuring && (
        <>
          <div onClick={() => setConfiguring(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 90 }}/>
          <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 91, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
            <div className="card-header"><span className="h-card">Configure {configuring.label}</span><div style={{ flex: 1 }}/><button className="btn btn-ghost btn-icon" onClick={() => setConfiguring(null)}><Icon name="x" size={14}/></button></div>
            <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {configuring.fields.map(([l, ph, t]) => (
                <SettRow key={l} label={l}>
                  {t === "masked" ? <input className="input t-mono" type="password" placeholder={ph || "••••••••"}/> : t === "select" ? <Select value={ph} onChange={() => {}} options={[["us-east-1","us-east-1"],["eu-west-1","eu-west-1"],["ap-south-1","ap-south-1"]]}/> : <input className="input t-mono" placeholder={ph}/>}
                </SettRow>
              ))}
              <div>
                <button className="btn btn-sm" onClick={() => { setTestState("testing"); setTimeout(() => { setTestState("success"); onToast({ kind: "success", text: `${configuring.label} connection verified` }); }, 1200); }} disabled={testState === "testing"}>
                  {testState === "testing" ? <><Spinner size={12}/> Testing…</> : <><Icon name="zap" size={11}/> Test connection</>}
                </button>
                {testState === "success" && <div className="row" style={{ marginTop: 8 }}><Icon name="check-circle" size={13} color="var(--success-fg)"/><span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>Connection verified</span></div>}
              </div>
            </div>
            <div className="card-footer"><button className="btn" onClick={() => setConfiguring(null)}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" onClick={() => { setConfiguring(null); onToast({ kind: "success", text: `${configuring.label} configured` }); }}>Save integration</button></div>
          </aside>
        </>
      )}
    </div>
  );
};

// ======= GROUP 2: SIEM ===================================================
const SIEMSection = ({ data, setData, onSave, onToast }) => {
  const [showPanel, setShowPanel] = React.useState(false);
  const [siemType, setSiemType] = React.useState(null);
  const [testState, setTestState] = React.useState("idle");
  const connections = data.siem.connections;

  const siemTypes = [
    { id: "splunk",    label: "Splunk",               fields: [["HEC URL","https://splunk.northwind.com:8088","text"],["HEC Token","","masked"],["Index","pam-events","text"],["Source type","miniOrangePAM",""]] },
    { id: "qradar",   label: "IBM QRadar",            fields: [["QRadar host","qradar.northwind.com","text"],["Port","514","text"],["Protocol","TCP","select"]] },
    { id: "elastic",  label: "Elastic / Elasticsearch",fields: [["Elasticsearch URL","https://es.northwind.com:9200","text"],["API Key","","masked"],["Index pattern","pam-events-*",""]] },
    { id: "sentinel", label: "Microsoft Sentinel",    fields: [["Workspace ID","","text"],["Primary Key","","masked"],["Log type name","PAMEvents",""]] },
    { id: "syslog",   label: "Generic Syslog",        fields: [["Syslog host","","text"],["Port","514","text"],["Protocol","TCP","select"],["Format","CEF","select"]] },
    { id: "webhook",  label: "Custom Webhook",        fields: [["Endpoint URL","","text"],["Auth header name","Authorization",""],["Auth header value","","masked"]] },
  ];

  const EVENT_SCHEMA = `{
  "event_id": "uuid",
  "timestamp": "ISO 8601",
  "event_type": "SESSION_START",
  "user": { "id": "...", "email": "...", "role": "..." },
  "resource": { "id": "...", "name": "...", "type": "..." },
  "session": { "id": "...", "duration": 0, "recording": true },
  "risk_score": 0,
  "ip_address": "...",
  "organization": "..."
}`;

  return (
    <div>
      <SettContent>
        <div>
          <h1 className="h-title">SIEM & Event Forwarding</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Stream PAM audit events to your SIEM platform in real time.</p>
        </div>

        {connections.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <Icon name="zap" size={32} color="var(--fg-5)"/>
            <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-2)", marginTop: 10 }}>No SIEM configured</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4, maxWidth: 380, margin: "8px auto 0" }}>All PAM events are logged locally only. Connect a SIEM to stream events to your SOC platform in real time.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowPanel(true)}><Icon name="plus" size={11}/> Add SIEM connection</button>
          </div>
        ) : (
          <div className="card">
            <div className="card-header"><span className="h-card">SIEM connections</span><div style={{ flex: 1 }}/><button className="btn btn-primary btn-sm" onClick={() => setShowPanel(true)}><Icon name="plus" size={11}/> Add</button></div>
            <div style={{ padding: 24, color: "var(--fg-3)", textAlign: "center" }}>No connections yet.</div>
          </div>
        )}

        <SettSection label="Event Schema" helper="Reference for configuring your SIEM's parser rules.">
          <details>
            <summary style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)", cursor: "pointer" }}>View event schema ↓</summary>
            <pre style={{ marginTop: 10, padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, font: "12px/1.6 var(--font-mono)", color: "var(--fg-2)", overflow: "auto", border: "1px solid var(--border)" }}>{EVENT_SCHEMA}</pre>
            <a href="#" style={{ display: "inline-block", marginTop: 6, font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Download full schema documentation</a>
          </details>
        </SettSection>
      </SettContent>

      {showPanel && (
        <>
          <div onClick={() => setShowPanel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 90 }}/>
          <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 500, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 91, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
            <div className="card-header"><span className="h-card">Configure SIEM Integration</span><div style={{ flex: 1 }}/><button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(false)}><Icon name="x" size={14}/></button></div>
            <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {!siemType ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {siemTypes.map(s => (
                    <button key={s.id} onClick={() => setSiemType(s)} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-surface)", cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}>
                      <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{s.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", color: "var(--fg-3)" }} onClick={() => setSiemType(null)}>← Change type</button>
                  <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{siemType.label}</div>
                  {siemType.fields.map(([l, ph, t]) => (
                    <SettRow key={l} label={l}>
                      {t === "masked" ? <input className="input t-mono" type="password" placeholder="••••••••"/> : t === "select" ? <Select value={ph} onChange={() => {}} options={[["TCP","TCP"],["UDP","UDP"],["CEF","CEF"],["JSON","JSON"]]}/>: <input className="input t-mono" defaultValue={ph}/>}
                    </SettRow>
                  ))}
                  <div>
                    <button className="btn btn-sm" onClick={() => { setTestState("testing"); setTimeout(() => { setTestState("success"); }, 1400); }} disabled={testState === "testing"}>
                      {testState === "testing" ? <><Spinner size={12}/> Testing…</> : <><Icon name="zap" size={11}/> Test connection</>}
                    </button>
                    {testState === "success" && <div className="row" style={{ marginTop: 8 }}><Icon name="check-circle" size={13} color="var(--success-fg)"/><span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>Test event sent — check your SIEM</span></div>}
                  </div>
                </>
              )}
            </div>
            <div className="card-footer"><button className="btn" onClick={() => { setShowPanel(false); setSiemType(null); }}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" disabled={!siemType} onClick={() => { setShowPanel(false); onToast({ kind: "success", text: "SIEM integration saved" }); }}>Save integration</button></div>
          </aside>
        </>
      )}
    </div>
  );
};

// ======= GROUP 2: STORAGE ================================================
const StorageSection = ({ data, setData, onSave, onToast }) => {
  const [changed, setChanged] = React.useState(false);
  const [testState, setTestState] = React.useState("idle");
  const s = data.storage;
  const setS = (k, v) => { setData(d => ({...d, storage: {...d.storage, [k]: v}})); setChanged(true); };
  const total = s.breakdown.recordings + s.breakdown.logs + s.breakdown.other;

  return (
    <div>
      <SaveBar changed={changed} onSave={() => { onSave(); setChanged(false); }} onDiscard={() => setChanged(false)}/>
      <SettContent>
        <div>
          <h1 className="h-title">Storage</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Where session recordings and other large files are stored.</p>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Icon name="database" size={18} color="var(--success-fg)"/>
            <span style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Local storage</span>
            <IntegStatusBadge status="connected"/>
            <span style={{ font: "500 13px/1 var(--font-sans)", color: "var(--fg-2)" }}>{s.used} GB used</span>
          </div>
          <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", background: "var(--bg-surface-2)" }}>
            {[["recordings","var(--brand)",s.breakdown.recordings],["logs","var(--info)",s.breakdown.logs],["other","var(--fg-4)",s.breakdown.other]].map(([k,c,v]) => (
              <div key={k} title={`${k}: ${v} GB`} style={{ width: `${(v/total)*100}%`, background: c }}/>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: "var(--brand)", borderRadius: 2 }}/>Recordings {s.breakdown.recordings} GB</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: "var(--info)", borderRadius: 2 }}/>Audit logs {s.breakdown.logs} GB</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: "var(--fg-4)", borderRadius: 2 }}/>Other {s.breakdown.other} GB</span>
          </div>
        </div>

        <SettSection label="Storage Destination">
          {[["local","Local storage","Store on this PAM server. Simple setup, limited by server disk space."],["s3","Amazon S3","Store in AWS S3 bucket. Scalable, with lifecycle policies."],["azure","Azure Blob Storage","Store in Azure Blob. Integrates with your Azure environment."],["gcs","Google Cloud Storage","Store in GCS bucket."]].map(([k,l,d]) => (
            <label key={k} style={{ display: "flex", gap: 10, padding: "10px 12px", border: `1px solid ${s.type === k ? "var(--brand)" : "var(--border)"}`, background: s.type === k ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 6, cursor: "pointer", marginBottom: 6 }}>
              <input type="radio" name="storage" checked={s.type === k} onChange={() => setS("type", k)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
              <div><div style={{ font: "600 13px/1.3 var(--font-sans)", color: s.type === k ? "var(--brand-fg)" : "var(--fg-1)" }}>{l}</div><div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{d}</div></div>
            </label>
          ))}

          {s.type === "s3" && (
            <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <SettRow label="Bucket name"><input className="input" defaultValue="northwind-pam-recordings"/></SettRow>
                <SettRow label="AWS Region"><Select value="us-east-1" onChange={() => {}} options={[["us-east-1","us-east-1"],["eu-west-1","eu-west-1"],["ap-south-1","ap-south-1"]]}/></SettRow>
                <SettRow label="Access Key ID"><input className="input t-mono" defaultValue="AKIAIOSFODNN7EXAMPLE"/></SettRow>
                <SettRow label="Secret Access Key"><input className="input t-mono" type="password" value="••••••••••••••••••••"/></SettRow>
              </div>
              <SettRow label="Path prefix"><input className="input t-mono" defaultValue="pam-recordings/"/></SettRow>
              <div>
                <button className="btn btn-sm" onClick={() => { setTestState("testing"); setTimeout(() => setTestState("success"), 1200); }} disabled={testState === "testing"}>
                  {testState === "testing" ? <><Spinner size={12}/> Verifying…</> : <><Icon name="check-circle" size={11}/> Test connection</>}
                </button>
                {testState === "success" && <div className="row" style={{ marginTop: 8 }}><Icon name="check-circle" size={13} color="var(--success-fg)"/><span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}>Bucket verified — PAM has write permission</span></div>}
              </div>
            </div>
          )}
        </SettSection>

        <SettSection label="Retention Policy">
          <SettRow label="Session recording retention" hint="PCI DSS requires 90 days. SOC2 typically requires 1 year.">
            <div style={{ display: "flex", gap: 8 }}>
              <input className="input" type="number" value={s.retention} onChange={e => setS("retention", +e.target.value)} style={{ width: 100 }}/>
              <Select value={s.retentionUnit} onChange={v => setS("retentionUnit", v)} options={[["days","days"],["months","months"],["years","years"]]}/>
            </div>
          </SettRow>
          <SettToggle label="Auto-delete when storage full" hint={`When ON, oldest recordings are deleted when storage reaches ${s.autoThreshold}% capacity.`} value={s.autoDelete} onChange={v => setS("autoDelete", v)}/>
          {s.autoDelete && (
            <SettRow label="Storage threshold">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="input" type="number" value={s.autoThreshold} onChange={e => setS("autoThreshold", +e.target.value)} style={{ width: 80 }}/>
                <span className="t-small">% capacity</span>
              </div>
            </SettRow>
          )}
        </SettSection>
      </SettContent>
    </div>
  );
};

// ======= GROUP 3: API KEYS ===============================================
const APIKeysSection = ({ data, setData, onToast }) => {
  const [showCreate, setShowCreate] = React.useState(false);
  const [createdKey, setCreatedKey] = React.useState(null);
  const [revokeTarget, setRevokeTarget] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const keys = data.apiKeys;

  const expiring = keys.filter(k => k.status === "active" && k.validUntil !== "Dec 2, 2125" && new Date().getTime() > new Date("2025-12-01").getTime()).length;

  return (
    <div>
      <SettContent>
        <div>
          <h1 className="h-title">API Keys</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Scoped API keys for integrating external systems with PAM. Each key has defined permissions and an expiry date.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <KPICard label="Active keys" value={keys.filter(k => k.status === "active").length} accent="var(--success-fg)"/>
          <KPICard label="Expiring in 30 days" value={keys.filter(k => k.status === "active" && k.id === "ak-1").length} accent="var(--warning-fg)"/>
          <KPICard label="Expired" value={keys.filter(k => k.status === "expired").length} accent="var(--danger-fg)"/>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="h-card">API Keys</span>
            <div style={{ flex: 1 }}/>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Icon name="plus" size={11}/> Create API key</button>
          </div>
          <table className="table">
            <thead><tr><th>Key name</th><th>Permissions</th><th>API key</th><th>Valid until</th><th>Status</th><th>Last used</th><th></th></tr></thead>
            <tbody>
              {keys.map(k => {
                const expired = k.status === "expired";
                const expiring = k.id === "ak-1";
                const borderColor = expired ? "var(--danger-fg)" : expiring ? "var(--warning-fg)" : "transparent";
                return (
                  <tr key={k.id} style={{ boxShadow: `inset 3px 0 ${borderColor}`, opacity: expired ? 0.7 : 1 }}>
                    <td>
                      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{k.name}</div>
                      {k.fullAccess && <span className="badge badge-warning" style={{ marginTop: 4, fontSize: 10 }}>⚠ Full access</span>}
                    </td>
                    <td>
                      <div className="row" style={{ flexWrap: "wrap", gap: 4 }}>
                        {k.perms.slice(0, 2).map(p => <span key={p} className="badge badge-brand" style={{ fontSize: 10 }}>{p}</span>)}
                        {k.perms.length > 2 && <span className="badge" style={{ fontSize: 10 }}>+{k.perms.length - 2} more</span>}
                      </div>
                    </td>
                    <td>
                      <div className="row">
                        <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{k.masked}</span>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Copy" onClick={() => { navigator.clipboard?.writeText(k.masked); onToast({ kind: "success", text: "Copied to clipboard" }); }}><Icon name="copy" size={11}/></button>
                      </div>
                    </td>
                    <td className="t-tiny" style={{ color: expired ? "var(--danger-fg)" : expiring ? "var(--warning-fg)" : "var(--fg-3)", fontWeight: (expired || expiring) ? 500 : 400 }}>{k.validUntil}</td>
                    <td>{k.status === "active" ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Expired</span>}</td>
                    <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{k.lastUsed}</td>
                    <td style={{ textAlign: "right" }}>
                      <RowMenu items={[
                        { label: "Edit",       icon: "edit",    onClick: () => {} },
                        { label: "Regenerate", icon: "refresh", onClick: () => onToast({ kind: "info", text: "New key generated" }) },
                        { divider: true },
                        { label: "Revoke",     icon: "trash",   danger: true, onClick: () => setRevokeTarget(k) },
                      ]}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SettContent>

      {/* Create panel */}
      {showCreate && <APIKeyPanel onClose={() => setShowCreate(false)} onCreated={(key) => { setShowCreate(false); setCreatedKey(key); }}/>}

      {/* Created — one-time display */}
      {createdKey && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }}/>
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 540, background: "var(--bg-app)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 101, border: "1px solid var(--border)" }}>
            <div className="card-header" style={{ border: "none" }}>
              <Icon name="check-circle" size={16} color="var(--success-fg)"/>
              <span className="h-card">Your API key was created</span>
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: 14, background: "var(--warning-soft)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>⚠ Copy this key now — it will not be shown again.</div>
              <div style={{ padding: 14, background: "var(--bg-surface-2)", borderRadius: 6, font: "13px/1.5 var(--font-mono)", color: "var(--fg-1)", wordBreak: "break-all", border: "1px solid var(--border)" }}>
                sk_live_xK9mN2pQ4rTs8uVwYz3aB6cD1eF7gH2iJ5kL0mN
              </div>
              <button className="btn btn-primary" onClick={() => { setCopied(true); navigator.clipboard?.writeText("sk_live_xK9mN2pQ4rTs8uVwYz3aB6cD1eF7gH2iJ5kL0mN"); }}>{copied ? "✓ Copied" : <><Icon name="copy" size={12}/> Copy API key</>}</button>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
                <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>I have copied the API key</span>
              </label>
              <button className="btn" disabled={!checked} onClick={() => { setCreatedKey(null); setChecked(false); setCopied(false); }}>Close</button>
            </div>
          </div>
        </>
      )}

      {/* Revoke confirm */}
      {revokeTarget && <ConfirmModal title={`Revoke "${revokeTarget.name}"?`} body="This will immediately invalidate this key. Any integrations using it will stop working." confirmLabel="Revoke key" danger onClose={() => setRevokeTarget(null)} onConfirm={() => { setRevokeTarget(null); onToast({ kind: "success", text: "API key revoked" }); }}/>}
    </div>
  );
};

const APIKeyPanel = ({ onClose, onCreated }) => {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [perms, setPerms] = React.useState(new Set());
  const [expiry, setExpiry] = React.useState("");
  const [ipRestrict, setIpRestrict] = React.useState(false);

  const PERM_GROUPS = [
    { group: "Sessions",     items: [["read-sessions","Read sessions — view session metadata"],["terminate-sessions","Terminate sessions — end active sessions"]] },
    { group: "Credentials",  items: [["read-creds","Read credentials (display names only)"],["rotate-creds","Trigger rotation — initiate credential rotation"]] },
    { group: "Reports",      items: [["read-reports","Read reports — access audit report data"],["export-reports","Export reports — generate and download"]] },
    { group: "Resources",    items: [["read-resources","Read resources — view resource list and metadata"]] },
    { group: "Users",        items: [["read-users","Read users — view user list and roles"]] },
  ];

  const toggle = (k) => setPerms(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 90 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 91, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div className="card-header"><span className="h-card">Create API Key</span><div style={{ flex: 1 }}/><button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button></div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <SettRow label="Key name" hint="e.g. 'Splunk Integration' or 'CI/CD Pipeline'"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Splunk Integration"/></SettRow>
          <SettRow label="Description (optional)"><textarea className="input" rows={2} value={desc} onChange={e => setDesc(e.target.value)}/></SettRow>

          <div>
            <label className="field-label" style={{ marginBottom: 8 }}>Permissions</label>
            {perms.size === Object.values(PERM_GROUPS).flat().length && <div style={{ marginBottom: 8, padding: "6px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 12px/1.4 var(--font-sans)" }}>⚠ Full access — principle of least privilege: only grant what this integration needs</div>}
            {PERM_GROUPS.map(g => (
              <div key={g.group} style={{ marginBottom: 12 }}>
                <div className="t-micro" style={{ marginBottom: 6 }}>{g.group}</div>
                {g.items.map(([k, l]) => (
                  <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0", cursor: "pointer" }}>
                    <input type="checkbox" checked={perms.has(k)} onChange={() => toggle(k)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
                    <span style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>{l}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <SettRow label="Start date"><input className="input" type="date" defaultValue="2026-06-17"/></SettRow>
            <SettRow label="Expiry date" hint="Required · max 2 years"><input className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)}/></SettRow>
          </div>

          <SettToggle label="Restrict to IP addresses" hint="Only requests from these IPs will be accepted with this key." value={ipRestrict} onChange={setIpRestrict}/>
          {ipRestrict && <textarea className="input t-mono" rows={3} placeholder={"10.0.0.0/8\n192.168.1.100"}/>}
        </div>
        <div className="card-footer"><button className="btn" onClick={onClose}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" disabled={!name || !expiry || perms.size === 0} onClick={() => onCreated({ name, perms: [...perms] })}>Create key</button></div>
      </aside>
    </>
  );
};

// ======= GROUP 3: CLIENT CREDENTIALS ====================================
const ClientCredsSection = ({ data, setData, onToast }) => {
  const creds = data.clientCreds;
  return (
    <SettContent>
      <div>
        <h1 className="h-title">Client Credentials</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--fg-3)" }}>OAuth 2.0 client credentials for machine-to-machine integrations with PAM.</p>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Client credentials</span><div style={{ flex: 1 }}/><button className="btn btn-primary btn-sm"><Icon name="plus" size={11}/> Create client credential</button></div>
        <table className="table">
          <thead><tr><th>Client name</th><th>Client ID</th><th>Valid from</th><th>Valid until</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {creds.map(c => (
              <tr key={c.id}>
                <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.name}</td>
                <td>
                  <div className="row">
                    <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{c.clientId}</span>
                    <button className="btn btn-ghost btn-icon btn-sm"><Icon name="copy" size={11}/></button>
                  </div>
                </td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.validFrom}</td>
                <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{c.validUntil}</td>
                <td><span className="badge badge-success">Active</span></td>
                <td style={{ textAlign: "right" }}><RowMenu items={[{ label: "Edit", icon: "edit", onClick: () => {} }, { divider: true }, { label: "Revoke", icon: "trash", danger: true, onClick: () => onToast({ kind: "success", text: "Credential revoked" }) }]}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettContent>
  );
};

// ======= GROUP 4: LICENSE ================================================
const LicenseSection = ({ data }) => {
  const lic = data.license;
  const daysLeft = lic.daysLeft;
  const licColor = daysLeft > 90 ? "var(--success-fg)" : daysLeft > 30 ? "var(--warning-fg)" : "var(--danger-fg)";

  const UsageRow = ({ label, used, limit }) => {
    const pct = limit ? (used / limit) * 100 : 50;
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-2)" }}>{label}</span>
          <span className="t-tiny" style={{ color: "var(--fg-3)" }}>{used.toLocaleString()}{limit ? ` / ${limit.toLocaleString()} licensed` : " / Unlimited"}</span>
        </div>
        {limit && <div style={{ height: 4, borderRadius: 999, overflow: "hidden", background: "var(--bg-surface-2)" }}><div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? "var(--danger)" : pct > 75 ? "var(--warning)" : "var(--success)" }}/></div>}
      </div>
    );
  };

  return (
    <SettContent>
      <div>
        <h1 className="h-title">License & Plan</h1>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="shield-check" size={22}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 18px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{lic.plan}</div>
            <div style={{ font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Licensed to Northwind Financial · Version {data.org.version}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ font: "600 13px/1.3 var(--font-sans)", color: licColor }}>Valid until Dec 1, 2027</div>
            <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{daysLeft} days remaining</div>
          </div>
        </div>

        <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="t-tiny" style={{ marginBottom: 4 }}>Customer Key</div>
            <div className="row">
              <span className="t-mono" style={{ color: "var(--fg-1)" }}>{data.org.customerKey}</span>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="copy" size={11}/></button>
            </div>
          </div>
          <div>
            <div className="t-tiny" style={{ marginBottom: 4 }}>Token Key</div>
            <div className="row">
              <span className="t-mono" style={{ color: "var(--fg-2)" }}>••••••••••••••••</span>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="eye" size={11}/></button>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="copy" size={11}/></button>
            </div>
          </div>
        </div>
      </div>

      <SettSection label="Usage">
        <UsageRow label="Active users"    used={lic.users.used}       limit={lic.users.limit}/>
        <UsageRow label="Resources"       used={lic.resources.used}   limit={lic.resources.limit}/>
        <UsageRow label="Credentials"     used={lic.credentials.used} limit={null}/>
        <UsageRow label="Session recordings stored" used={`${lic.recordings.used} GB`} limit={null}/>
      </SettSection>

      <SettSection label="Update License" helper="To renew or upgrade your license, contact your miniOrange account manager.">
        <SettRow label="New token key">
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input t-mono" placeholder="Enter new token key…" type="password"/>
            <button className="btn">Validate and apply</button>
          </div>
        </SettRow>
        <a href="mailto:enterprise@miniorange.com" style={{ font: "500 13px/1 var(--font-sans)", color: "var(--brand-fg)", display: "inline-flex", alignItems: "center", gap: 4 }}>Contact support <Icon name="external" size={12}/></a>
      </SettSection>
    </SettContent>
  );
};

// ======= KPI CARD (local version) =======================================
const KPICard = ({ label, value, accent }) => (
  <div className="card" style={{ padding: 14 }}>
    <div className="t-tiny">{label}</div>
    <div style={{ font: "600 24px/1.1 var(--font-sans)", color: accent || "var(--fg-1)", marginTop: 6 }}>{value}</div>
  </div>
);

window.SettingsScreen = SettingsScreen;
