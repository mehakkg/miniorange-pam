// Wizard Steps 2-5

// ============ Step 2: Sync Users & Groups ============
const Step2Sync = ({ onSynced, synced }) => {
  const [phase, setPhase] = React.useState(synced ? "done" : "ready");
  const [progress, setProgress] = React.useState(0);

  const startSync = () => {
    setPhase("syncing");
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 7 + Math.random() * 8;
      if (p >= 100) { p = 100; clearInterval(iv); setPhase("done"); onSynced(); }
      setProgress(Math.min(p, 100));
    }, 220);
  };

  const SYNC_RESULTS = [
    { label: "Users imported",     value: 247, tone: "success" },
    { label: "Groups imported",    value: 18,  tone: "success" },
    { label: "Disabled accounts skipped", value: 12, tone: "default" },
    { label: "Duplicate emails",   value: 2,  tone: "warning" },
    { label: "Missing required fields", value: 1, tone: "warning" },
  ];

  const SYNC_ISSUES = [
    { kind: "duplicate", title: "Duplicate email: noah.eriksen@kestrel.io", detail: "Found in two OUs (OU=Contractors, OU=Disabled). Imported once from active OU." },
    { kind: "duplicate", title: "Duplicate email: legacy.svc@kestrel.io",   detail: "Two service accounts share this email. Both imported as separate users." },
    { kind: "missing",   title: "Missing displayName: CN=svc-test-04",     detail: "User imported with username only. Edit after sync to add a display name." },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h-display" style={{ fontSize: 26 }}>Sync users & groups</h2>
        <p style={{ marginTop: 6, color: "var(--fg-3)", fontSize: 14 }}>
          PAM will read all users and groups from <span className="t-mono" style={{ color: "var(--fg-2)" }}>DC=kestrel,DC=local</span>. This is read-only — your directory is not modified.
        </p>

        {phase === "ready" && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-body">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="users" size={20}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="h-card">Ready to sync</div>
                  <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>
                    Estimated 247 users · 18 groups · ~8 seconds
                  </div>
                </div>
                <button className="btn btn-primary" onClick={startSync}>
                  <Icon name="refresh" size={13}/> Start sync
                </button>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5, color: "var(--fg-3)" }}>
                  <Icon name="info" size={14}/>
                  <span>By default, disabled directory accounts are skipped. You can change this in Identity config later.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "syncing" && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Spinner size={16} color="var(--brand)"/>
                <div style={{ flex: 1 }}>
                  <div className="h-card">Syncing from kestrel.local</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>
                    {progress < 30 ? "Connecting to directory…" :
                     progress < 60 ? "Reading user objects…" :
                     progress < 90 ? "Reading group memberships…" :
                                     "Resolving conflicts…"}
                  </div>
                </div>
                <div style={{ font: "500 13px/1 var(--font-mono)", color: "var(--fg-2)" }}>{Math.round(progress)}%</div>
              </div>
              <div style={{ height: 4, background: "var(--bg-surface-2)", borderRadius: 9999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "var(--brand)", transition: "width 200ms" }}/>
              </div>
            </div>
          </div>
        )}

        {phase === "done" && (
          <>
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header" style={{ justifyContent: "space-between" }}>
                <div className="row">
                  <Icon name="check-circle" size={16} color="var(--success)"/>
                  <span className="h-card">Sync complete</span>
                </div>
                <button className="btn btn-sm" onClick={startSync}>
                  <Icon name="refresh" size={12}/> Re-sync
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", borderTop: "1px solid var(--border)" }}>
                {SYNC_RESULTS.map((r, i) => (
                  <div key={i} style={{
                    padding: 16, textAlign: "center",
                    borderRight: i < SYNC_RESULTS.length-1 ? "1px solid var(--border)" : "none",
                  }}>
                    <div style={{
                      font: "600 22px/1.1 var(--font-sans)",
                      color: r.tone === "warning" ? "var(--warning-fg)" : r.tone === "success" ? "var(--success-fg)" : "var(--fg-1)",
                    }}>{r.value}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-3)", marginTop: 4 }}>{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <Icon name="alert-triangle" size={14} color="var(--warning)"/>
                <span className="h-card">3 issues detected — sync still successful</span>
              </div>
              <div>
                {SYNC_ISSUES.map((iss, i) => (
                  <div key={i} style={{
                    padding: "12px 20px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span className="badge" style={{
                      background: iss.kind === "duplicate" ? "var(--warning-soft)" : "var(--info-soft)",
                      color:      iss.kind === "duplicate" ? "var(--warning-fg)"  : "var(--info-fg)",
                      borderColor: "transparent", textTransform: "capitalize",
                    }}>{iss.kind}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 13px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{iss.title}</div>
                      <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{iss.detail}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm">Resolve</button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============ Step 3: Map Groups to Roles ============
const ROLES = [
  { id: "admin",    label: "Security Admin",  desc: "Full configuration & approval rights",   color: "var(--danger-fg)",   bg: "var(--danger-soft)" },
  { id: "operator", label: "Operator",        desc: "Launch sessions, request access",        color: "var(--brand-fg)",    bg: "var(--brand-soft)" },
  { id: "auditor",  label: "Auditor",         desc: "Read-only sessions, reports, audit log", color: "var(--success-fg)",  bg: "var(--success-soft)" },
  { id: "limited",  label: "Limited Access",  desc: "Self-service requests only — no admin",  color: "var(--fg-3)",        bg: "var(--bg-surface-2)" },
];

const SYNCED_GROUPS = [
  { name: "Domain Admins",     members: 4,  defaultRole: "admin" },
  { name: "PAM-SecOps",        members: 6,  defaultRole: "admin" },
  { name: "DevOps-Engineers",  members: 12, defaultRole: "operator" },
  { name: "DevOps-OnCall",     members: 6,  defaultRole: "operator" },
  { name: "Compliance-Audit",  members: 3,  defaultRole: "auditor" },
  { name: "Contractors-Q2",    members: 8,  defaultRole: "limited" },
  { name: "All-Employees",     members: 247,defaultRole: null },
  { name: "Disabled-Users",    members: 41, defaultRole: null },
];

const Step3Map = ({ onMapped }) => {
  const [mapping, setMapping] = React.useState(() => {
    const m = {};
    SYNCED_GROUPS.forEach(g => { if (g.defaultRole) m[g.name] = g.defaultRole; });
    return m;
  });

  React.useEffect(() => { onMapped(mapping); }, []);

  const setRole = (group, role) => {
    setMapping(m => {
      const n = { ...m };
      if (role) n[group] = role; else delete n[group];
      onMapped(n);
      return n;
    });
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <h2 className="h-display" style={{ fontSize: 26 }}>Map groups to roles</h2>
        <p style={{ marginTop: 6, color: "var(--fg-3)", fontSize: 14 }}>
          Assign each directory group to a PAM role. Groups without a role can't sign in to PAM. Users inherit the highest role across all their groups.
        </p>

        {/* Role legend */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 20 }}>
          {ROLES.map(r => (
            <div key={r.id} style={{
              padding: 12, borderRadius: 6,
              background: r.bg, border: "1px solid transparent",
            }}>
              <div style={{ font: "600 12.5px/1.3 var(--font-sans)", color: r.color }}>{r.label}</div>
              <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 20, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Directory group</th>
                <th>Members</th>
                <th>Assign role</th>
              </tr>
            </thead>
            <tbody>
              {SYNCED_GROUPS.map(g => (
                <tr key={g.name}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="people" size={14} color="var(--fg-3)"/>
                      <span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{g.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--fg-3)" }}>{g.members}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {ROLES.map(r => {
                        const active = mapping[g.name] === r.id;
                        return (
                          <button key={r.id} onClick={() => setRole(g.name, active ? null : r.id)} style={{
                            padding: "4px 9px", borderRadius: 4,
                            border: `1px solid ${active ? "transparent" : "var(--border)"}`,
                            background: active ? r.bg : "var(--bg-surface)",
                            color: active ? r.color : "var(--fg-3)",
                            font: "500 11.5px/1 var(--font-sans)",
                            cursor: "pointer",
                          }}>{r.label}</button>
                        );
                      })}
                      {!mapping[g.name] && (
                        <span className="badge" style={{ marginLeft: 8 }}>No access</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============ Step 4: Configure MFA ============
const Step4MFA = ({ onConfigured }) => {
  const [methods, setMethods] = React.useState({ totp: true, webauthn: true, push: false, sms: false });
  const [enforcement, setEnforcement] = React.useState("required-admin");

  React.useEffect(() => { onConfigured({ methods, enforcement }); }, [methods, enforcement]);

  const METHODS = [
    { id: "totp",     icon: "key",     label: "Authenticator app",  desc: "Google Authenticator, 1Password, Authy", recommend: true },
    { id: "webauthn", icon: "shield",  label: "Hardware security key", desc: "YubiKey, Touch ID, Windows Hello", recommend: true },
    { id: "push",     icon: "bell",    label: "Push notification",     desc: "miniOrange Authenticator app", recommend: false },
    { id: "sms",      icon: "mail",    label: "SMS / Email OTP",        desc: "Less secure — fallback only", recommend: false },
  ];

  const RULES = [
    { id: "required-all",   label: "Required for everyone",     desc: "All users must enroll a second factor. Recommended." },
    { id: "required-admin", label: "Required for admins only",  desc: "Operators and auditors can sign in with password alone." },
    { id: "optional",       label: "Optional",                  desc: "Users may enroll but it isn't enforced. Not recommended." },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h-display" style={{ fontSize: 26 }}>Configure two-factor</h2>
        <p style={{ marginTop: 6, color: "var(--fg-3)", fontSize: 14 }}>
          Choose which second factors users may enroll, and when MFA is required.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><span className="h-card">Allowed methods</span></div>
          <div>
            {METHODS.map((m, i) => (
              <label key={m.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                cursor: "pointer",
              }}>
                <input type="checkbox" checked={methods[m.id]} onChange={e => setMethods(s => ({ ...s, [m.id]: e.target.checked }))} style={{ accentColor: "var(--brand)" }}/>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: "var(--bg-surface-2)", color: "var(--fg-2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={m.icon} size={16}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>
                    {m.label}
                    {m.recommend && <span className="badge badge-brand" style={{ marginLeft: 8, fontSize: 10 }}>Recommended</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><span className="h-card">Enforcement</span></div>
          <div>
            {RULES.map((r, i) => (
              <label key={r.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                cursor: "pointer",
              }}>
                <input type="radio" name="enf" checked={enforcement === r.id} onChange={() => setEnforcement(r.id)} style={{ accentColor: "var(--brand)", marginTop: 2 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.label}</div>
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{r.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Step 5: Validate ============
const Step5Validate = ({ wizardData, onFinish }) => {
  const [simState, setSimState] = React.useState("idle");

  const runSim = () => {
    setSimState("running");
    setTimeout(() => setSimState("done"), 1400);
  };

  const summary = [
    { label: "Directory",    value: `Active Directory · ad.kestrel.local`, icon: "auth" },
    { label: "Users imported", value: "247 users",                          icon: "users" },
    { label: "Groups mapped",  value: `${Object.keys(wizardData.mapping || {}).length} of 18 groups assigned roles`, icon: "people" },
    { label: "MFA",            value: "TOTP + WebAuthn · Required for admins", icon: "shield" },
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h-display" style={{ fontSize: 26 }}>Review and validate</h2>
        <p style={{ marginTop: 6, color: "var(--fg-3)", fontSize: 14 }}>
          Confirm your setup, run a test login, and finish identity configuration.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><span className="h-card">Configuration summary</span></div>
          <div>
            {summary.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 20px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={s.icon} size={16}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{s.value}</div>
                </div>
                <Icon name="check-circle" size={16} color="var(--success)"/>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header" style={{ justifyContent: "space-between" }}>
            <span className="h-card">Test login simulation</span>
            <button className="btn btn-sm" onClick={runSim} disabled={simState === "running"}>
              {simState === "running" ? <><Spinner size={12}/> Running…</> : "Run simulation"}
            </button>
          </div>
          <div style={{ padding: 20 }}>
            {simState === "idle" && (
              <div style={{ fontSize: 13, color: "var(--fg-3)" }}>
                Simulates a user signing in with the synced directory and an MFA challenge — without affecting any real account.
              </div>
            )}
            {simState === "running" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Resolving directory…","Authenticating bind…","Looking up test user…","Issuing MFA challenge…"].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)" }}>
                    <Spinner size={12}/> {s}
                  </div>
                ))}
              </div>
            )}
            {simState === "done" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Directory bound · 84ms","Test user resolved · priya.iyer@kestrel.io","MFA challenge issued (TOTP) · accepted","Role resolved: Security Admin","Session token issued · valid 8h"].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)" }}>
                    <Icon name="check" size={13} color="var(--success)"/> {s}
                  </div>
                ))}
                <div className="badge badge-success" style={{ alignSelf: "flex-start", marginTop: 6 }}>
                  <Icon name="check" size={11}/> Test passed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.WizardScreens = { Step2Sync, Step3Map, Step4MFA, Step5Validate };
