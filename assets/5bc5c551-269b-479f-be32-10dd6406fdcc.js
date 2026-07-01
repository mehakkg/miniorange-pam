// Identity Config — Authentication (Directories + Login Settings) + Two-Factor

// ===================== SEED DATA =====================
const DIRECTORIES = [
  {
    id: "dir-1", name: "kestrel.local", type: "AD", protocol: "LDAPS",
    server: "ad.kestrel.local:636", domain: "kestrel.local",
    bindDn: "CN=svc-pam,OU=ServiceAccounts,DC=kestrel,DC=local",
    baseDn: "DC=kestrel,DC=local",
    status: "connected", usersSync: 247, groupsSync: 18, lastSync: "2 hours ago",
    isDefault: true,
    attrMap: { username: "sAMAccountName", email: "mail", firstName: "givenName", lastName: "sn", displayName: "displayName" },
    groupMaps: [
      { adGroup: "CN=Domain Admins,CN=Users,DC=kestrel,DC=local",         pamRole: "Security Admin" },
      { adGroup: "CN=PAM-DevOps,OU=Groups,DC=kestrel,DC=local",           pamRole: "Operator" },
      { adGroup: "CN=Compliance-Auditors,OU=Groups,DC=kestrel,DC=local",  pamRole: "Auditor Admin" },
      { adGroup: "CN=Contractors,OU=Groups,DC=kestrel,DC=local",          pamRole: "End User" },
    ],
    syncErrors: [],
    syncSchedule: "Every 15 minutes",
  },
  {
    id: "dir-2", name: "Okta SSO (SAML)", type: "SAML", protocol: "SAML 2.0",
    server: "northwind.okta.com", domain: "northwind.okta.com",
    status: "failed", usersSync: 0, groupsSync: 0, lastSync: "Failed 3 days ago",
    isDefault: false,
    error: "Certificate expired — SAML signing certificate expired Jun 14, 2026. Upload a new certificate from your IdP.",
  },
];

const MFA_METHODS = [
  { id: "totp",     label: "Authenticator app",         desc: "Google Authenticator, Authy, 1Password. Most secure.",   recommended: true,  enabled: true  },
  { id: "webauthn", label: "Hardware security key",      desc: "YubiKey, Touch ID, Windows Hello (WebAuthn / FIDO2).",  recommended: true,  enabled: true  },
  { id: "push",     label: "Push notification",          desc: "miniOrange Authenticator mobile app.",                  recommended: false, enabled: false },
  { id: "sms",      label: "SMS one-time code",          desc: "Less secure — use only as fallback.",                   recommended: false, enabled: false },
  { id: "email",    label: "Email OTP",                  desc: "One-time code to verified email address.",              recommended: false, enabled: false },
];

const MFA_RULES = [
  { id: "mfa-1", trigger: "Account login",         roles: "Everyone",       method: "Any enrolled",    required: true,  canOverride: false },
  { id: "mfa-2", trigger: "Session launch",         roles: "Security Admin, Operator", method: "TOTP or Hardware key", required: true, canOverride: false },
  { id: "mfa-3", trigger: "Session launch",         roles: "Auditor Admin",  method: "Any enrolled",    required: true,  canOverride: true  },
  { id: "mfa-4", trigger: "Ticket approval",        roles: "Security Admin", method: "TOTP or Hardware key", required: true, canOverride: false },
  { id: "mfa-5", trigger: "Break-glass access",     roles: "Everyone",       method: "Hardware key",    required: true,  canOverride: false },
  { id: "mfa-6", trigger: "View credential details",roles: "Everyone",       method: "Any enrolled",    required: true,  canOverride: true  },
];

Object.assign(window, { DIRECTORIES, MFA_METHODS, MFA_RULES });

// ===================== SHARED PRIMITIVES =====================
const ConnStatusBadge = ({ status }) => {
  const m = {
    connected: { bg: "var(--success-soft)", fg: "var(--success-fg)", dot: "var(--success)",   label: "Connected" },
    failed:    { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  dot: "var(--danger)",    label: "Failed" },
    untested:  { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       dot: "var(--fg-4)",      label: "Untested" },
    syncing:   { bg: "var(--brand-soft)",   fg: "var(--brand-fg)",   dot: "var(--brand)",     label: "Syncing" },
  }[status] || { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", dot: "var(--fg-4)", label: status };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 8px", borderRadius: 999, font: "600 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, flex: "none" }}/>
      {m.label}
    </span>
  );
};

const ProtocolBadge = ({ proto }) => {
  const m = {
    "LDAP":      { bg: "var(--info-soft)",    fg: "var(--info-fg)",    label: "LDAP",      lock: false },
    "LDAPS":     { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "LDAPS",     lock: true  },
    "AD":        { bg: "color-mix(in oklch, #7c3aed 12%, transparent)", fg: "#7c3aed", label: "AD", lock: false },
    "SAML 2.0":  { bg: "var(--warning-soft)", fg: "var(--warning-fg)", label: "SAML 2.0", lock: false },
    "OIDC":      { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "OIDC",      lock: false },
  }[proto] || { bg: "var(--bg-surface-2)", fg: "var(--fg-3)", label: proto, lock: false };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 4, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>
      {m.lock && <Icon name="lock" size={9}/>}{m.label}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const m = { AD: "#7c3aed", SAML: "#b45309", OIDC: "#059669", LDAP: "#1d4ed8", "Azure AD": "#3730a3" };
  const bg = m[type] ? `color-mix(in oklch, ${m[type]} 12%, transparent)` : "var(--bg-surface-2)";
  const fg = m[type] || "var(--fg-3)";
  return <span style={{ padding: "2px 8px", borderRadius: 4, font: "500 11px/1.5 var(--font-sans)", background: bg, color: fg }}>{type}</span>;
};

// ===================== AUTHENTICATION SCREEN =====================
const AuthenticationScreen = ({ empty }) => {
  const [tab, setTab] = React.useState("directories");
  const [showWizard, setShowWizard] = React.useState(false);
  const [wizardType, setWizardType] = React.useState(null);
  const [openDir, setOpenDir] = React.useState(null);
  const [showSetupProgress, setShowSetupProgress] = React.useState(true);
  const [setupStep, setSetupStep] = React.useState(empty ? 1 : 4); // 4 = all done
  const [toast, setToast] = React.useState(null);

  const dirs = empty ? [] : DIRECTORIES;

  if (showWizard) return <DirectoryWizard type={wizardType} onClose={(d) => { setShowWizard(false); if (d) { setToast({ kind: "success", text: `${d.name} connected and validated` }); setSetupStep(4); setShowSetupProgress(false); }}} />;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Authentication"
        description="Connect your organization's directory to PAM. Users and groups sync from here."
        actions={<button className="btn btn-primary" onClick={() => { setWizardType(null); setShowWizard(true); }}><Icon name="plus" size={13}/> Connect directory</button>}
      />

      {/* Setup progress guide */}
      {showSetupProgress && (
        <div style={{ margin: "16px 24px 0", padding: "14px 20px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: 20 }}>
          {[
            { n: 1, l: "Connect" },
            { n: 2, l: "Sync" },
            { n: 3, l: "Map roles" },
            { n: 4, l: "Validate" },
          ].map((s, i) => {
            const done = setupStep > s.n;
            const active = setupStep === s.n;
            return (
              <React.Fragment key={s.n}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", border: !done && !active ? "1px solid var(--border)" : "none" }}>
                    {done ? <Icon name="check" size={12} color="#fff"/> : s.n}
                  </div>
                  <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)" }}>{s.l}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)" }}/>}
              </React.Fragment>
            );
          })}
          <div style={{ flex: 1 }}/>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSetupProgress(false)} style={{ color: "var(--fg-4)", flex: "none" }}>Dismiss guide</button>
        </div>
      )}

      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "directories", label: "Directory connections", weight: 1 },
          { separator: true },
          { id: "login",       label: "Login settings",       weight: 3 },
        ]}
      />

      {tab === "directories" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {dirs.length === 0 ? (
            <DirectoryEmptyState onConnect={(type) => { setWizardType(type); setShowWizard(true); }}/>
          ) : (
            <DirectoryTable dirs={dirs} onOpen={setOpenDir} onEdit={(d) => { setWizardType(d.type); setShowWizard(true); }} onToast={setToast}/>
          )}
        </div>
      )}

      {tab === "login" && <LoginSettingsTab/>}

      {openDir && <DirectoryDetailPanel dir={openDir} onClose={() => setOpenDir(null)} onEdit={() => { setOpenDir(null); setWizardType(openDir.type); setShowWizard(true); }} onToast={setToast}/>}
      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

// ===================== EMPTY STATE =====================
const DirectoryEmptyState = ({ onConnect }) => (
  <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 32 }}>
    <div style={{ maxWidth: 760, margin: "24px auto 0", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Icon name="people" size={28}/>
      </div>
      <h2 style={{ font: "600 20px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Connect your first directory</h2>
      <p style={{ font: "400 13.5px/1.6 var(--font-sans)", color: "var(--fg-3)", margin: "8px auto 32px", maxWidth: 500 }}>
        PAM syncs users and groups from your organization's Active Directory, LDAP server, or SSO provider. Once connected, users can log in with their existing credentials.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 640, margin: "0 auto" }}>
        {[
          { type: "AD",      icon: "server",   title: "Active Directory / LDAP",    desc: "On-premise Windows AD, OpenLDAP, or any LDAP v3 directory" },
          { type: "AzureAD", icon: "cloud",    title: "Azure Active Directory",      desc: "Microsoft Entra ID (formerly Azure AD) via OIDC or SAML" },
          { type: "SAML",    icon: "shield",   title: "SSO Provider",               desc: "Any SAML 2.0 or OIDC provider — Okta, OneLogin, Google Workspace, PingFederate" },
        ].map(c => (
          <button key={c.type} onClick={() => onConnect(c.type)} style={{
            padding: 20, border: "1px solid var(--border)", borderRadius: 10,
            background: "var(--bg-surface)", cursor: "pointer", textAlign: "left",
            display: "flex", flexDirection: "column", gap: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={c.icon} size={18}/></div>
            <div>
              <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{c.title}</div>
              <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>{c.desc}</div>
            </div>
            <div style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--brand-fg)", display: "flex", alignItems: "center", gap: 4 }}>Connect <Icon name="arrow-right" size={11}/></div>
          </button>
        ))}
        <button onClick={() => onConnect(null)} style={{ padding: 20, border: "1px dashed var(--border)", borderRadius: 10, background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-surface-2)", color: "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="user" size={18}/></div>
          <div>
            <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>Manual setup only</div>
            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>No directory integration — manage users manually in PAM</div>
          </div>
          <div style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-4)", display: "flex", alignItems: "center", gap: 4 }}>Continue without directory <Icon name="arrow-right" size={11}/></div>
        </button>
      </div>
    </div>
  </div>
);

// ===================== DIRECTORY TABLE =====================
const DirectoryTable = ({ dirs, onOpen, onEdit, onToast }) => (
  <div style={{ flex: 1, overflow: "auto" }}>
    {dirs.filter(d => d.status === "failed").map(d => (
      <div key={d.id} style={{ margin: "12px 24px 0", padding: 12, background: "var(--danger-soft)", borderRadius: 6, borderLeft: "3px solid var(--danger-fg)", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <Icon name="alert-circle" size={14} color="var(--danger-fg)"/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--danger-fg)" }}>{d.name} — connection failed</div>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)", opacity: 0.9, marginTop: 2 }}>{d.error}</div>
        </div>
        <button className="btn btn-sm" onClick={() => onEdit(d)}>Fix →</button>
      </div>
    ))}
    <table className="table" style={{ marginTop: 8 }}>
      <thead><tr>
        <th>Directory name</th><th>Type</th><th>Protocol</th><th>Domain / server</th>
        <th>Connection</th><th>Users</th><th>Groups</th><th>Last synced</th><th style={{ width: 28 }}></th><th></th>
      </tr></thead>
      <tbody>
        {dirs.map(d => (
          <tr key={d.id} onClick={() => onOpen(d)} style={{ cursor: "pointer" }}>
            <td>
              <div className="row">
                <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>{d.name}</span>
                {d.isDefault && <Icon name="star" size={12} color="var(--warning-fg)" style={{ marginLeft: 4 }} title="Default directory"/>}
              </div>
            </td>
            <td><TypeBadge type={d.type}/></td>
            <td><ProtocolBadge proto={d.protocol}/></td>
            <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{d.server}</td>
            <td><ConnStatusBadge status={d.status}/></td>
            <td style={{ color: "var(--fg-2)" }}>{d.status === "connected" ? d.usersSync : "—"}</td>
            <td style={{ color: "var(--fg-2)" }}>{d.status === "connected" ? d.groupsSync : "—"}</td>
            <td className="t-tiny" style={{ color: d.lastSync?.startsWith("Failed") ? "var(--danger-fg)" : "var(--fg-3)" }}>{d.lastSync || "Never"}</td>
            <td><span title={d.isDefault ? "Default directory" : ""}>{d.isDefault ? "⭐" : ""}</span></td>
            <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
              <RowMenu items={[
                { label: "Edit configuration", icon: "edit",        onClick: () => onEdit(d) },
                { label: "Test connection",    icon: "check-circle",onClick: () => { onToast({ kind: "success", text: `Connection to ${d.name} succeeded` }); } },
                { label: "Sync now",           icon: "refresh",     onClick: () => { onToast({ kind: "info", text: `Sync started for ${d.name}…` }); } },
                { label: "Map groups to roles",icon: "people",      onClick: () => {} },
                { label: "Set as default",     icon: "star",        onClick: () => {}, disabled: d.isDefault },
                { divider: true },
                { label: "Disconnect", icon: "trash", danger: true, onClick: () => {} },
              ]}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ===================== DIRECTORY DETAIL PANEL =====================
const DirectoryDetailPanel = ({ dir, onClose, onEdit, onToast }) => {
  const [tab, setTab] = React.useState("overview");
  const [syncing, setSyncing] = React.useState(false);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <h2 style={{ font: "600 17px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>{dir.name}</h2>
              {dir.isDefault && <span className="t-tiny" style={{ color: "var(--warning-fg)" }}>⭐ Default</span>}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <TypeBadge type={dir.type}/>
              <ProtocolBadge proto={dir.protocol}/>
              <ConnStatusBadge status={dir.status}/>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        {dir.status === "failed" && (
          <div style={{ padding: "12px 20px", background: "var(--danger-soft)", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icon name="alert-circle" size={14} color="var(--danger-fg)" style={{ marginTop: 2 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--danger-fg)" }}>Connection failed</div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)", opacity: 0.9, marginTop: 2 }}>{dir.error}</div>
            </div>
            <button className="btn btn-sm" onClick={onEdit}>Fix →</button>
          </div>
        )}

        <div style={{ borderBottom: "1px solid var(--border)", padding: "0 12px", display: "flex", gap: 2 }}>
          {["overview","attributes","group mapping","sync log"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 12px", border: "none", background: "transparent", marginBottom: -1,
              color: tab === t ? "var(--fg-1)" : "var(--fg-3)",
              font: `${tab === t ? 600 : 500} 12.5px/1 var(--font-sans)", textTransform: "capitalize`,
              borderBottom: `2px solid ${tab === t ? "var(--brand)" : "transparent"}`,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {tab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <section>
                <div className="t-micro" style={{ marginBottom: 10 }}>Connection details</div>
                {[
                  ["Server / host", dir.server, true],
                  ["Domain", dir.domain, false],
                  ["Bind DN", dir.bindDn, true],
                  ["Base DN", dir.baseDn, true],
                  ["Last synced", dir.lastSync, false],
                  ["Sync schedule", dir.syncSchedule, false],
                ].map(([k, v, mono]) => (
                  <div key={k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, padding: "5px 0", alignItems: "center" }}>
                    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
                    <span className={mono ? "t-mono" : ""} style={{ font: mono ? "500 12px/1.3 var(--font-mono)" : "400 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{v || "—"}</span>
                  </div>
                ))}
              </section>
              {dir.status === "connected" && (
                <section>
                  <div className="t-micro" style={{ marginBottom: 10 }}>Sync summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Users synced",  value: dir.usersSync,  accent: "var(--success-fg)" },
                      { label: "Groups synced", value: dir.groupsSync, accent: "var(--success-fg)" },
                      { label: "Sync errors",   value: dir.syncErrors?.length || 0, accent: dir.syncErrors?.length ? "var(--danger-fg)" : "var(--fg-1)" },
                      { label: "Last sync",     value: dir.lastSync, accent: "var(--fg-1)", isText: true },
                    ].map(s => (
                      <div key={s.label} className="card" style={{ padding: 12 }}>
                        <div className="t-tiny">{s.label}</div>
                        <div style={{ font: `600 ${s.isText ? 14 : 22}px/1.1 var(--font-sans)`, color: s.accent, marginTop: 6 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === "attributes" && (
            <div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 16 }}>
                Map directory attributes to PAM profile fields. Drag to rearrange.
              </div>
              <table className="table">
                <thead><tr><th>PAM field</th><th>Directory attribute</th><th>Sample value</th><th></th></tr></thead>
                <tbody>
                  {Object.entries(dir.attrMap || {}).map(([pam, attr]) => (
                    <tr key={pam}>
                      <td style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)", textTransform: "capitalize" }}>{pam.replace(/([A-Z])/g, " $1").trim()}</td>
                      <td className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{attr}</td>
                      <td className="t-tiny" style={{ color: "var(--fg-4)" }}>{attr === "sAMAccountName" ? "priya.iyer" : attr === "mail" ? "priya@kestrel.local" : attr === "givenName" ? "Priya" : attr === "sn" ? "Iyer" : "Priya Iyer"}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><Icon name="edit" size={11}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: "var(--brand-fg)" }}><Icon name="plus" size={11}/> Add custom attribute</button>
            </div>
          )}

          {tab === "group mapping" && (
            <div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 16 }}>
                Map directory groups to PAM roles. Members of these groups will be assigned the corresponding PAM role automatically at login.
              </div>
              <table className="table">
                <thead><tr><th>Directory group</th><th>PAM role</th><th>Members (est.)</th><th></th></tr></thead>
                <tbody>
                  {(dir.groupMaps || []).map((m, i) => (
                    <tr key={i}>
                      <td className="t-mono" style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{m.adGroup}</td>
                      <td><RoleBadge role={m.pamRole}/></td>
                      <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{[4,12,3,8][i]}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm"><Icon name="trash" size={11}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-sm" style={{ marginTop: 10 }}><Icon name="plus" size={11}/> Add group mapping</button>

              <div className="card" style={{ marginTop: 20, padding: 12, background: "var(--brand-soft)", borderColor: "transparent" }}>
                <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--brand-fg)", marginBottom: 4 }}>Unmapped groups</div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>Users in AD groups not listed here will be created in PAM with the <strong>End User</strong> role by default.</div>
                <a href="#" style={{ display: "inline-block", marginTop: 6, font: "500 12px/1 var(--font-sans)", color: "var(--brand-fg)" }}>Change default role →</a>
              </div>
            </div>
          )}

          {tab === "sync log" && (
            <div>
              {[
                { ts: "Jun 17, 2026 14:00", status: "success", msg: "Sync completed · 247 users · 18 groups · 0 errors" },
                { ts: "Jun 17, 2026 13:45", status: "success", msg: "Sync completed · 246 users · 18 groups · 0 errors" },
                { ts: "Jun 17, 2026 13:30", status: "warning", msg: "Sync completed with 1 warning · Duplicate email: noah.eriksen@kestrel.io" },
                { ts: "Jun 17, 2026 13:15", status: "success", msg: "Sync completed · 245 users · 18 groups · 0 errors" },
                { ts: "Jun 16, 2026 22:00", status: "error",   msg: "Sync failed · Connection timeout after 30s · Retried 3×" },
              ].map((l, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--border-subtle)", display: "flex", gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: l.status === "success" ? "var(--success-soft)" : l.status === "warning" ? "var(--warning-soft)" : "var(--danger-soft)", color: l.status === "success" ? "var(--success-fg)" : l.status === "warning" ? "var(--warning-fg)" : "var(--danger-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon name={l.status === "success" ? "check" : l.status === "warning" ? "alert-circle" : "x"} size={10}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{l.msg}</div>
                    <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{l.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={() => { onToast({ kind: "info", text: "Sync started…" }); }}><Icon name="refresh" size={11}/> Sync now</button>
          <button className="btn" onClick={() => { onToast({ kind: "success", text: `Connection to ${dir.name} succeeded` }); }}><Icon name="check-circle" size={11}/> Test connection</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-primary" onClick={onEdit}>Edit configuration</button>
        </div>
      </aside>
    </>
  );
};

// ===================== DIRECTORY WIZARD (5 steps) =====================
const DirectoryWizard = ({ type: initialType, onClose }) => {
  const [step, setStep] = React.useState(initialType ? 2 : 1);
  const [type, setType] = React.useState(initialType || "AD");
  const [host, setHost] = React.useState("ad.kestrel.local");
  const [port, setPort] = React.useState("636");
  const [useTLS, setUseTLS] = React.useState(true);
  const [baseDn, setBaseDn] = React.useState("DC=kestrel,DC=local");
  const [bindDn, setBindDn] = React.useState("CN=svc-pam,OU=ServiceAccounts,DC=kestrel,DC=local");
  const [password, setPassword] = React.useState("••••••••••");
  const [testState, setTestState] = React.useState("idle"); // idle | testing | success | error
  const [testError, setTestError] = React.useState(null);
  const [syncResult, setSyncResult] = React.useState(null);
  const [syncRunning, setSyncRunning] = React.useState(false);
  const [syncProgress, setSyncProgress] = React.useState(0);
  const [groupMaps, setGroupMaps] = React.useState([
    { group: "Domain Admins", role: "Security Admin" },
    { group: "PAM-DevOps", role: "Operator" },
  ]);
  const [validateState, setValidateState] = React.useState("idle");

  const runTest = () => {
    setTestState("testing");
    setTestError(null);
    setTimeout(() => {
      if (port === "389" && useTLS) {
        setTestState("error");
        setTestError({ code: "TLS_HANDSHAKE_FAILED", msg: "LDAPS requires port 636. Port 389 is plaintext LDAP — either switch to 636 or disable TLS.", fix: [{ label: "Switch to port 636 (recommended)", action: () => { setPort("636"); setTestError(null); setTestState("idle"); }}, { label: "Disable TLS for port 389", action: () => { setUseTLS(false); setTestError(null); setTestState("idle"); }, danger: true }] });
      } else if (!host.includes(".")) {
        setTestState("error");
        setTestError({ code: "DNS_RESOLUTION_FAILED", msg: `Could not resolve hostname "${host}". Use a fully-qualified domain name.`, fix: [] });
      } else {
        setTestState("success");
      }
    }, 1200);
  };

  const runSync = () => {
    setSyncRunning(true); setSyncProgress(0);
    const iv = setInterval(() => setSyncProgress(p => { const n = Math.min(100, p + 9 + Math.random() * 8); if (n >= 100) { clearInterval(iv); setSyncRunning(false); setSyncResult({ users: 247, groups: 18, errors: 2, warnings: 1 }); return 100; } return n; }), 220);
  };

  const runValidate = () => {
    setValidateState("running");
    setTimeout(() => setValidateState("success"), 1800);
  };

  const steps = ["Connect", "Test", "Sync users", "Map roles", "Validate"];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Wizard header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)", marginBottom: 6, display: "flex", gap: 6 }}>
            <span>Authentication</span><Icon name="chevron-right" size={10}/><span>Connect directory</span>
          </div>
          <h1 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Connect {type === "AD" ? "Active Directory / LDAP" : type === "AzureAD" ? "Azure Active Directory" : "SSO Provider"}</h1>
        </div>
        <button className="btn btn-ghost" onClick={() => onClose(null)}>Cancel</button>
      </div>

      {/* Step indicator */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
        {steps.map((s, i) => {
          const done = step > i + 1, active = step === i + 1;
          return (
            <React.Fragment key={s}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "var(--success)" : active ? "var(--brand)" : "var(--bg-surface-2)", color: done || active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)", border: !done && !active ? "1px solid var(--border)" : "none" }}>{done ? <Icon name="check" size={11}/> : i + 1}</div>
                <span style={{ font: `${active ? 600 : 500} 12.5px/1 var(--font-sans)", color: active ? "var(--fg-1)" : done ? "var(--fg-2)" : "var(--fg-4)` }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: done ? "var(--success)" : "var(--border)", maxWidth: 40 }}/>}
            </React.Fragment>
          );
        })}
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* STEP 1: Choose type */}
          {step === 1 && (
            <div>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 16px" }}>Choose directory type</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[{ id: "AD", icon: "server", label: "Active Directory / LDAP", desc: "On-premise Windows AD or any LDAP v3 directory" }, { id: "AzureAD", icon: "cloud", label: "Azure Active Directory", desc: "Microsoft Entra ID via OIDC or SAML" }, { id: "SAML", icon: "shield", label: "SSO Provider (SAML/OIDC)", desc: "Okta, OneLogin, Google Workspace, PingFederate" }].map(t => {
                  const active = type === t.id;
                  return <button key={t.id} onClick={() => setType(t.id)} style={{ padding: 16, border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`, background: active ? "var(--brand-soft)" : "var(--bg-surface)", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: active ? "var(--brand)" : "var(--bg-surface-2)", color: active ? "#fff" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon name={t.icon} size={16}/></div>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: active ? "var(--brand-fg)" : "var(--fg-1)" }}>{t.label}</div>
                    <div style={{ font: "400 11.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>{t.desc}</div>
                  </button>;
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Connect */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Server settings</h2>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Field label="Host or IP address" required hint="Use FQDN where possible — e.g. ad.kestrel.local"><input className="input" value={host} onChange={e => setHost(e.target.value)}/></Field>
                <Field label="Port" required hint="636 for LDAPS · 389 for LDAP"><input className="input t-mono" value={port} onChange={e => setPort(e.target.value)}/></Field>
              </div>
              <Field label="Base DN" required hint="Starting point for all user and group searches"><input className="input t-mono" value={baseDn} onChange={e => setBaseDn(e.target.value)}/></Field>
              <Field label="Bind DN" required hint="Read-only service account PAM uses to query the directory"><input className="input t-mono" value={bindDn} onChange={e => setBindDn(e.target.value)}/></Field>
              <Field label="Bind password" required><input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}/></Field>
              <Toggle value={useTLS} onChange={setUseTLS} label="Use TLS / LDAPS (recommended)" hint="Encrypts all directory communication. Requires port 636."/>

              {/* Inline test */}
              <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn" onClick={runTest} disabled={testState === "testing"}>
                    {testState === "testing" ? <><Spinner size={13}/> Testing…</> : testState === "success" ? <><Icon name="refresh" size={12}/> Retest</> : <><Icon name="zap" size={12}/> Test connection</>}
                  </button>
                  {testState === "success" && <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--success-fg)", font: "500 13px/1 var(--font-sans)" }}><Icon name="check-circle" size={14}/> Connected · TLS verified · 247 users visible</div>}
                </div>
                {testState === "error" && testError && (
                  <div style={{ marginTop: 10, padding: 12, background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)" }}>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)" }}>{testError.msg}</div>
                    <div style={{ font: "500 10.5px/1 var(--font-mono)", color: "var(--danger-fg)", opacity: 0.7, marginTop: 2 }}>{testError.code}</div>
                    {testError.fix.length > 0 && <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {testError.fix.map((f, i) => <button key={i} onClick={f.action} style={{ background: "transparent", border: "none", padding: 0, font: "500 12.5px/1 var(--font-sans)", color: f.danger ? "var(--danger-fg)" : "var(--brand-fg)", textDecoration: "underline", cursor: "pointer", textAlign: "left" }}>→ {f.label}</button>)}
                    </div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Sync */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Sync users and groups</h2>
              <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>PAM will read all users and groups from <span className="t-mono" style={{ color: "var(--fg-1)" }}>{baseDn}</span>. This is read-only — your directory is never modified.</p>

              {!syncRunning && !syncResult && (
                <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="users" size={20}/></div>
                  <div style={{ flex: 1 }}>
                    <div className="h-card">Ready to sync</div>
                    <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>Estimated 247 users · 18 groups · ~8 seconds</div>
                  </div>
                  <button className="btn btn-primary" onClick={runSync}><Icon name="refresh" size={13}/> Start sync</button>
                </div>
              )}

              {syncRunning && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <Spinner size={16} color="var(--brand)"/>
                    <div style={{ flex: 1 }}>
                      <div className="h-card">Syncing from {host}…</div>
                      <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{syncProgress < 40 ? "Reading user objects…" : syncProgress < 80 ? "Reading group memberships…" : "Resolving conflicts…"}</div>
                    </div>
                    <div className="t-mono" style={{ color: "var(--fg-2)" }}>{Math.round(syncProgress)}%</div>
                  </div>
                  <div style={{ height: 4, background: "var(--bg-surface-2)", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${syncProgress}%`, height: "100%", background: "var(--brand)", transition: "width 200ms" }}/></div>
                </div>
              )}

              {syncResult && (
                <div className="card">
                  <div className="card-header"><Icon name="check-circle" size={14} color="var(--success-fg)"/><span className="h-card">Sync complete</span><div style={{ flex: 1 }}/><button className="btn btn-sm" onClick={runSync}><Icon name="refresh" size={12}/> Re-sync</button></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid var(--border)" }}>
                    {[["Users imported", syncResult.users, "var(--success-fg)"], ["Groups imported", syncResult.groups, "var(--success-fg)"], ["Warnings", syncResult.warnings, "var(--warning-fg)"], ["Errors", syncResult.errors, syncResult.errors ? "var(--danger-fg)" : "var(--fg-3)"]].map(([l, v, c], i) => (
                      <div key={l} style={{ padding: 16, textAlign: "center", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ font: "600 22px/1.1 var(--font-sans)", color: c }}>{v}</div>
                        <div className="t-tiny" style={{ marginTop: 4 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Map roles */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 4px" }}>Map groups to roles</h2>
                <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Assign each directory group to a PAM role. Users in unmapped groups default to End User. Users inherit the highest role across all their groups.</p>
              </div>
              <div className="card">
                <div className="card-header"><span className="h-card">Group → Role mapping</span><div style={{ flex: 1 }}/><button className="btn btn-sm"><Icon name="plus" size={11}/> Add mapping</button></div>
                <table className="table">
                  <thead><tr><th>Directory group (DN or CN)</th><th>PAM role</th><th>Members (est.)</th><th></th></tr></thead>
                  <tbody>
                    {groupMaps.map((m, i) => (
                      <tr key={i}>
                        <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{m.group}</td>
                        <td><RoleBadge role={m.role}/></td>
                        <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{[4, 12][i] || 6}</td>
                        <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setGroupMaps(g => g.filter((_, j) => j !== i))}><Icon name="x" size={11}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ padding: 12, background: "var(--brand-soft)", borderColor: "transparent" }}>
                <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--brand-fg)" }}>Unmapped groups → End User</div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)", marginTop: 4 }}>All synced users not in a mapped group will be created with the End User role. You can change this default.</div>
              </div>
            </div>
          )}

          {/* STEP 5: Validate */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Validate and finish</h2>
              <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: 0 }}>Run an end-to-end login simulation to confirm everything is working before going live.</p>

              <div className="card" style={{ padding: 16 }}>
                <div className="h-card" style={{ marginBottom: 12 }}>Configuration summary</div>
                {[
                  ["Directory", `${type} · ${host}:${port}`],
                  ["TLS", useTLS ? "Enabled (LDAPS)" : "Disabled"],
                  ["Users synced", "247 users"],
                  ["Groups mapped", `${groupMaps.length} of 18 groups`],
                  ["Default role", "End User (unmapped groups)"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-subtle)", font: "400 12.5px/1.4 var(--font-sans)" }}>
                    <span style={{ color: "var(--fg-4)" }}>{k}</span>
                    <span style={{ color: "var(--fg-1)" }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn" onClick={runValidate} disabled={validateState === "running"}>
                    {validateState === "running" ? <><Spinner size={13}/> Simulating…</> : <><Icon name="zap" size={12}/> Run login simulation</>}
                  </button>
                  {validateState === "success" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {["Directory bound · 84ms", "Test user resolved · priya.iyer@kestrel.local", "Role resolved: Operator (via PAM-DevOps)", "Session token issued"].map((l, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, font: "400 12.5px/1 var(--font-sans)", color: "var(--success-fg)" }}><Icon name="check" size={11}/>{l}</div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
        {step > 1 && <button className="btn" onClick={() => setStep(s => s - 1)}>← Back</button>}
        <div style={{ flex: 1 }}/>
        {step < 5 && <button className="btn btn-ghost" onClick={() => setStep(s => s + 1)}>Skip for now</button>}
        {step < 5
          ? <button className="btn btn-primary" disabled={step === 2 && testState !== "success"} onClick={() => setStep(s => s + 1)}>{step === 2 ? "Save & continue" : "Continue"} →</button>
          : <button className="btn btn-primary" onClick={() => onClose({ name: host, type, server: `${host}:${port}` })}>Finish setup</button>}
      </div>
    </div>
  );
};

// ===================== LOGIN SETTINGS TAB =====================
const LoginSettingsTab = () => {
  const [jitCreate, setJitCreate] = React.useState(true);
  const [jitRole, setJitRole] = React.useState("End User");
  const [sessionTimeout, setSessionTimeout] = React.useState("8");
  const [idleTimeout, setIdleTimeout] = React.useState("30");
  const [ssoOnly, setSsoOnly] = React.useState(false);
  const [pwPolicy, setPwPolicy] = React.useState("strong");
  const [saved, setSaved] = React.useState(false);

  return (
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="h-card">User creation</span></div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <Toggle value={jitCreate} onChange={setJitCreate} label="Just-in-time provisioning" hint="Create a PAM user record automatically at first login via SSO, if no record exists yet."/>
            {jitCreate && (
              <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
                <Field label="Default role for JIT-provisioned users" hint="JIT users will be created with this role. Overridden by group→role mappings if configured.">
                  <Select value={jitRole} onChange={setJitRole} options={[["End User","End User"],["Operator","Operator"],["Auditor Admin","Auditor Admin"]]}/>
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="h-card">Session security</span></div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Session timeout (hours)" hint="How long users stay logged in without re-authenticating"><input className="input" type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}/></Field>
              <Field label="Idle timeout (minutes)" hint="Automatically log out inactive sessions"><input className="input" type="number" value={idleTimeout} onChange={e => setIdleTimeout(e.target.value)}/></Field>
            </div>
            <Toggle value={ssoOnly} onChange={setSsoOnly} label="Enforce SSO login only" hint="Disable username/password login — users must authenticate through the configured SSO provider."/>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="h-card">Password policy</span><span className="t-tiny" style={{ color: "var(--fg-4)" }}>Applies to local accounts only</span></div>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {[["strong","Strong (recommended)","Min 12 chars · upper + lower + number + symbol · no dictionary words"],["custom","Custom","Set your own complexity rules"],["passphrase","Passphrase","Min 4 random words · easier to remember · equally secure"]].map(([k, l, d]) => (
              <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "8px 10px", border: `1px solid ${pwPolicy === k ? "var(--brand)" : "var(--border)"}`, background: pwPolicy === k ? "var(--brand-soft)" : "transparent", borderRadius: 6 }}>
                <input type="radio" name="pwpolicy" checked={pwPolicy === k} onChange={() => setPwPolicy(k)} style={{ marginTop: 2, accentColor: "var(--brand)" }}/>
                <div><div style={{ font: "600 13px/1.3 var(--font-sans)", color: pwPolicy === k ? "var(--brand-fg)" : "var(--fg-1)" }}>{l}</div><div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{d}</div></div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {saved && <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--success-fg)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={13}/> Saved</span>}
          <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>Save changes</button>
        </div>
      </div>
    </div>
  );
};

// ===================== TWO-FACTOR SCREEN =====================
const TwoFactorScreen = () => {
  const [methods, setMethods] = React.useState(MFA_METHODS.map(m => ({...m})));
  const [rules, setRules] = React.useState(MFA_RULES.map(r => ({...r})));
  const [addRuleOpen, setAddRuleOpen] = React.useState(false);
  const [gracePeriod, setGracePeriod] = React.useState("7");
  const [rememberDevice, setRememberDevice] = React.useState(true);
  const [rememberDays, setRememberDays] = React.useState("30");
  const [toast, setToast] = React.useState(null);

  const toggleMethod = (id) => setMethods(ms => ms.map(m => m.id === id ? {...m, enabled: !m.enabled} : m));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Two-factor authentication"
        description="Control which MFA methods users can enroll, and when MFA is required — per role and per action."
        actions={<button className="btn btn-primary" onClick={() => setAddRuleOpen(true)}><Icon name="plus" size={13}/> Add enforcement rule</button>}
      />

      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Methods */}
          <div className="card">
            <div className="card-header">
              <span className="h-card">Allowed methods</span>
              <div style={{ flex: 1 }}/>
              <span className="t-tiny">{methods.filter(m => m.enabled).length} of {methods.length} enabled</span>
            </div>
            <div>
              {methods.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: m.enabled ? "var(--brand-soft)" : "var(--bg-surface-2)", color: m.enabled ? "var(--brand-fg)" : "var(--fg-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={m.id === "totp" ? "key" : m.id === "webauthn" ? "shield" : m.id === "push" ? "bell" : "mail"} size={17}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{m.label}</span>
                      {m.recommended && <span className="badge badge-success" style={{ fontSize: 10 }}>Recommended</span>}
                      {!m.enabled && <span className="badge" style={{ fontSize: 10 }}>Disabled</span>}
                    </div>
                    <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{m.desc}</div>
                  </div>
                  <Toggle value={m.enabled} onChange={() => toggleMethod(m.id)}/>
                </div>
              ))}
            </div>
          </div>

          {/* Enforcement rules */}
          <div className="card">
            <div className="card-header">
              <span className="h-card">Enforcement rules</span>
              <span className="badge badge-info">{rules.length} rules</span>
              <div style={{ flex: 1 }}/>
              <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Rules run in order. First match wins.</span>
              <button className="btn btn-sm" onClick={() => setAddRuleOpen(true)}><Icon name="plus" size={11}/> Add rule</button>
            </div>
            <table className="table">
              <thead><tr><th>Trigger</th><th>Applies to</th><th>Required method</th><th>Required</th><th>Admin override</th><th></th></tr></thead>
              <tbody>
                {rules.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", flex: "none" }}/>
                        <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.trigger}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: "var(--fg-2)" }}>{r.roles}</td>
                    <td><span className="badge badge-brand" style={{ fontSize: 11 }}>{r.method}</span></td>
                    <td>{r.required ? <span className="badge badge-danger" style={{ fontSize: 11 }}>Required</span> : <span className="badge" style={{ fontSize: 11 }}>Optional</span>}</td>
                    <td>{r.canOverride ? <Icon name="check" size={13} color="var(--success-fg)"/> : <span style={{ color: "var(--fg-4)" }}>—</span>}</td>
                    <td style={{ textAlign: "right" }}>
                      <RowMenu items={[
                        { label: "Edit",   icon: "edit",  onClick: () => {} },
                        { label: "Duplicate", icon: "copy", onClick: () => {} },
                        { divider: true },
                        { label: "Delete", icon: "trash", danger: true, onClick: () => setRules(rs => rs.filter(x => x.id !== r.id)) },
                      ]}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recovery */}
          <div className="card">
            <div className="card-header"><span className="h-card">Recovery and bypass</span></div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Enrollment grace period (days)" hint="How long new users have to set up MFA before it is enforced at login.">
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input" type="number" value={gracePeriod} onChange={e => setGracePeriod(e.target.value)} style={{ width: 100 }}/>
                  <span style={{ display: "flex", alignItems: "center", font: "400 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>days after account creation</span>
                </div>
              </Field>
              <Toggle value={rememberDevice} onChange={setRememberDevice} label="Remember trusted device" hint="Skip MFA on trusted devices after first verification."/>
              {rememberDevice && (
                <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
                  <Field label="Trust period">
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="input" type="number" value={rememberDays} onChange={e => setRememberDays(e.target.value)} style={{ width: 100 }}/>
                      <span style={{ display: "flex", alignItems: "center", font: "400 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>days</span>
                    </div>
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => setToast({ kind: "success", text: "MFA configuration saved" })}>Save changes</button>
          </div>
        </div>
      </div>

      {/* Add Rule panel */}
      {addRuleOpen && (
        <AddMFARulePanel
          onClose={() => setAddRuleOpen(false)}
          onSave={(r) => { setRules(rs => [...rs, { ...r, id: `mfa-${Date.now()}` }]); setAddRuleOpen(false); setToast({ kind: "success", text: "Enforcement rule added" }); }}
        />
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)}/>}
    </div>
  );
};

// ===================== ADD MFA RULE PANEL =====================
const AddMFARulePanel = ({ onClose, onSave }) => {
  const [trigger, setTrigger] = React.useState("Account login");
  const [roles, setRoles] = React.useState("Everyone");
  const [method, setMethod] = React.useState("Any enrolled");
  const [required, setRequired] = React.useState(true);
  const [canOverride, setCanOverride] = React.useState(false);

  return <Panel title="Add enforcement rule" onClose={onClose}
    footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><div style={{ flex: 1 }}/><button className="btn btn-primary" onClick={() => onSave({ trigger, roles, method, required, canOverride })}>Add rule</button></>}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
      <Field label="Trigger — when is MFA checked?" required>
        <Select value={trigger} onChange={setTrigger} options={[
          ["Account login","Account login"],
          ["Session launch","Session launch — when a user launches a privileged session"],
          ["Ticket approval","Ticket approval — when an approver approves a JIT request"],
          ["Break-glass access","Break-glass access"],
          ["View credential details","View credential details (display name reveal)"],
          ["Password view","View a vaulted credential's raw value"],
        ]}/>
      </Field>
      <Field label="Applies to (roles)" required hint="Which PAM roles this rule covers.">
        <Select value={roles} onChange={setRoles} options={[["Everyone","Everyone"],["Security Admin","Security Admin only"],["Security Admin, Operator","Security Admin and Operator"],["Auditor Admin","Auditor Admin only"]]}/>
      </Field>
      <Field label="Required method" hint="The MFA method that must be used. Leave 'Any enrolled' for flexibility.">
        <Select value={method} onChange={setMethod} options={[["Any enrolled","Any enrolled method"],["TOTP or Hardware key","TOTP or Hardware security key"],["Hardware key","Hardware security key only (strongest)"],["TOTP","Authenticator app (TOTP) only"]]}/>
      </Field>
      <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
        <Toggle value={required} onChange={setRequired} label="Required" hint="If required, users cannot proceed without completing MFA. If optional, MFA is prompted but can be dismissed."/>
        <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }}/>
        <Toggle value={canOverride} onChange={setCanOverride} label="Allow admin override" hint="Security Admins can bypass this rule temporarily for specific users. All overrides are logged."/>
      </div>

      <div className="card" style={{ padding: 12, background: "var(--brand-soft)", borderColor: "transparent" }}>
        <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: "var(--brand-fg)", marginBottom: 4 }}>Preview</div>
        <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
          "{roles}" must verify with <strong>{method}</strong> at <strong>{trigger.toLowerCase()}</strong>.{required ? " This is mandatory and cannot be skipped." : " Users may dismiss this prompt."}{canOverride ? " Admins can override." : ""}
        </div>
      </div>
    </div>
  </Panel>;
};

// Reuse existing Panel wrapper from credentials/certificates
const Panel = ({ title, onClose, children, footer }) => (
  <>
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 90 }}/>
    <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", zIndex: 91, boxShadow: "var(--shadow-lg)" }}>
      <div className="card-header" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="h-card">{title}</span>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><Icon name="x" size={14}/></button>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>{children}</div>
      {footer && <div className="card-footer" style={{ borderTop: "1px solid var(--border)" }}>{footer}</div>}
    </aside>
  </>
);

// RoleBadge re-export for this module
const RoleBadge = ({ role }) => {
  const m = { "Security Admin": { fg: "var(--danger-fg)", bg: "var(--danger-soft)" }, "Operator": { fg: "var(--brand-fg)", bg: "var(--brand-soft)" }, "Auditor Admin": { fg: "var(--success-fg)", bg: "var(--success-soft)" }, "End User": { fg: "var(--fg-3)", bg: "var(--bg-surface-2)" }, "Password Admin": { fg: "var(--warning-fg)", bg: "var(--warning-soft)" } }[role] || { fg: "var(--fg-2)", bg: "var(--bg-surface-2)" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{role}</span>;
};

window.AuthenticationScreen = AuthenticationScreen;
window.TwoFactorScreen = TwoFactorScreen;
window.ConnStatusBadge = ConnStatusBadge;
window.ProtocolBadge = ProtocolBadge;
window.TypeBadge = TypeBadge;
