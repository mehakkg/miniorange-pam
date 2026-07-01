// First-run setup wizard — A1: Identity & Directory Setup
// 5 steps with real validation, error states, and progressive disclosure

const WIZARD_STEPS = [
  { id: 1, label: "Connect directory",  description: "Link your AD or LDAP" },
  { id: 2, label: "Sync users & groups", description: "Import identities" },
  { id: 3, label: "Map groups to roles", description: "Assign permissions" },
  { id: 4, label: "Configure MFA",       description: "Enforce a second factor" },
  { id: 5, label: "Validate",            description: "Test and finish" },
];

const StepIndicator = ({ step, completed }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 16,
    padding: "20px 32px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-app)",
  }}>
    {WIZARD_STEPS.map((s, i) => {
      const isDone = completed.includes(s.id);
      const isActive = step === s.id;
      return (
        <React.Fragment key={s.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: isActive || isDone ? 1 : 0.55 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: isDone ? "var(--success)" : isActive ? "var(--brand)" : "var(--bg-surface-2)",
              color: isDone || isActive ? "#fff" : "var(--fg-3)",
              border: !isDone && !isActive ? "1px solid var(--border-strong)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              font: "600 11px/1 var(--font-sans)",
              flex: "none",
            }}>
              {isDone ? <Icon name="check" size={12}/> : s.id}
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ font: "600 12px/1.2 var(--font-sans)", color: isActive ? "var(--fg-1)" : "var(--fg-2)" }}>{s.label}</span>
              <span style={{ font: "400 11px/1.2 var(--font-sans)", color: "var(--fg-4)" }}>{s.description}</span>
            </div>
          </div>
          {i < WIZARD_STEPS.length-1 && (
            <div style={{ flex: 1, height: 1, background: isDone ? "var(--success)" : "var(--border)", maxWidth: 48 }}/>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const WizardFooter = ({ onBack, onSkip, onContinue, continueLabel = "Continue", continueDisabled, loading, danger }) => (
  <div style={{
    padding: "16px 32px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-app)",
    display: "flex", alignItems: "center", gap: 8,
    flex: "none",
  }}>
    {onBack && <button className="btn" onClick={onBack}><Icon name="arrow-left" size={13}/> Back</button>}
    <div style={{ flex: 1 }}/>
    {onSkip && <button className="btn btn-ghost" onClick={onSkip}>Skip for now</button>}
    <button className={danger ? "btn btn-danger" : "btn btn-primary"}
      onClick={onContinue} disabled={continueDisabled || loading}>
      {loading ? <><Spinner size={13} color="#fff"/> {continueLabel}</> : <>{continueLabel} <Icon name="arrow-right" size={13}/></>}
    </button>
  </div>
);

// ============ Step 1: Connect Directory ============
const Step1Connect = ({ onTested, tested }) => {
  const [type, setType] = React.useState("ad");
  const [host, setHost] = React.useState("ad.kestrel.local");
  const [port, setPort] = React.useState("636");
  const [baseDn, setBaseDn] = React.useState("DC=kestrel,DC=local");
  const [bindDn, setBindDn] = React.useState("CN=svc-pam,OU=ServiceAccounts,DC=kestrel,DC=local");
  const [password, setPassword] = React.useState("••••••••••••");
  const [useTLS, setUseTLS] = React.useState(true);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [testState, setTestState] = React.useState("idle"); // idle | testing | success | error
  const [error, setError] = React.useState(null);

  const test = () => {
    setTestState("testing");
    setError(null);
    setTimeout(() => {
      // Realistic validation logic — port-based errors
      if (port === "389" && useTLS) {
        setTestState("error");
        setError({
          code: "TLS_HANDSHAKE_FAILED",
          title: "TLS handshake failed on port 389",
          why: "Port 389 is the default LDAP port (cleartext). LDAPS (encrypted) requires port 636 or you must disable TLS for plain LDAP.",
          fix: [
            { label: "Switch to port 636 (recommended)", action: () => { setPort("636"); setError(null); setTestState("idle"); } },
            { label: "Disable TLS and continue on 389", action: () => { setUseTLS(false); setError(null); setTestState("idle"); }, dangerous: true },
          ],
        });
      } else if (host.includes("invalid") || !host.includes(".")) {
        setTestState("error");
        setError({
          code: "DNS_RESOLUTION_FAILED",
          title: "Could not resolve hostname",
          why: `The hostname "${host}" could not be resolved by DNS. Check that the domain controller is reachable from this PAM instance.`,
          fix: [
            { label: "Use a fully-qualified hostname (e.g. ad.example.local)", action: null },
            { label: "Use the controller's IP address instead", action: null },
          ],
        });
      } else if (password.length < 8 || password === "wrong") {
        setTestState("error");
        setError({
          code: "BIND_FAILED",
          title: "Bind credentials rejected",
          why: "The directory accepted the connection but rejected the bind DN or password. The service account may be locked, expired, or have incorrect privileges.",
          fix: [
            { label: "Verify the bind DN exists in your directory", action: null },
            { label: "Reset the service account password", action: null },
          ],
        });
      } else {
        setTestState("success");
        onTested({ type, host, port, baseDn, bindDn, useTLS });
      }
    }, 1100);
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "32px 32px 40px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 className="h-display" style={{ fontSize: 26 }}>Connect your directory</h2>
        <p style={{ marginTop: 6, color: "var(--fg-3)", fontSize: 14 }}>
          PAM uses your existing identity provider as the source of truth for users and groups. We never store passwords from your directory.
        </p>

        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Provider type */}
            <div className="field">
              <label className="field-label">Directory type <span className="req">*</span></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { id: "ad",    label: "Active Directory", desc: "Windows AD via LDAP" },
                  { id: "ldap",  label: "LDAP",              desc: "OpenLDAP, 389DS, etc." },
                  { id: "okta",  label: "Okta / SCIM",       desc: "Cloud IdP" },
                ].map(t => (
                  <div key={t.id} onClick={() => setType(t.id)} style={{
                    border: `1px solid ${type === t.id ? "var(--brand)" : "var(--border)"}`,
                    background: type === t.id ? "var(--brand-soft)" : "var(--bg-surface)",
                    borderRadius: 6, padding: "10px 12px", cursor: "pointer",
                  }}>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.label}</div>
                    <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div className="field">
                <label className="field-label">Host or IP <span className="req">*</span></label>
                <input className="input" value={host} onChange={e => setHost(e.target.value)} placeholder="ad.example.com"/>
                <span className="field-help">Domain controller hostname or IP. Use FQDN when possible.</span>
              </div>
              <div className="field">
                <label className="field-label">Port <span className="req">*</span></label>
                <input className="input" value={port} onChange={e => setPort(e.target.value)}/>
                <span className="field-help">636 for LDAPS, 389 for LDAP</span>
              </div>
            </div>

            <div className="field">
              <label className="field-label">Base DN <span className="req">*</span></label>
              <input className="input t-mono" value={baseDn} onChange={e => setBaseDn(e.target.value)}/>
              <span className="field-help">The starting point for user and group searches.</span>
            </div>

            <div className="field">
              <label className="field-label">Bind DN <span className="req">*</span></label>
              <input className="input t-mono" value={bindDn} onChange={e => setBindDn(e.target.value)}/>
              <span className="field-help">A read-only service account PAM will use to query your directory.</span>
            </div>

            <div className="field">
              <label className="field-label">Bind password <span className="req">*</span></label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}/>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={useTLS} onChange={e => setUseTLS(e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
              Use TLS (LDAPS) — recommended
            </label>

            <button onClick={() => setShowAdvanced(s => !s)} className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", padding: 0 }}>
              <Icon name={showAdvanced ? "chevron-down" : "chevron-right"} size={12}/>
              Advanced settings
            </button>

            {showAdvanced && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingLeft: 16, borderLeft: "2px solid var(--border)" }}>
                <div className="field">
                  <label className="field-label">User search filter</label>
                  <input className="input t-mono" defaultValue="(&(objectClass=user)(sAMAccountName={0}))"/>
                </div>
                <div className="field">
                  <label className="field-label">Group search filter</label>
                  <input className="input t-mono" defaultValue="(objectClass=group)"/>
                </div>
                <div className="field">
                  <label className="field-label">Connection timeout (s)</label>
                  <input className="input" defaultValue="10"/>
                </div>
                <div className="field">
                  <label className="field-label">Referral handling</label>
                  <select className="select"><option>Follow</option><option>Ignore</option></select>
                </div>
              </div>
            )}

            {/* Test connection result */}
            {testState === "success" && (
              <div className="fade-in" style={{
                padding: 14, background: "var(--success-soft)", borderRadius: 6,
                border: "1px solid transparent", color: "var(--success-fg)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <Icon name="check-circle" size={18}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13px/1.4 var(--font-sans)" }}>Connection successful</div>
                  <div style={{ font: "400 12.5px/1.5 var(--font-sans)", marginTop: 2 }}>
                    Bound as <span className="t-mono">{bindDn.split(",")[0]}</span> · TLS verified · 247 users and 18 groups visible.
                  </div>
                </div>
              </div>
            )}

            {testState === "error" && error && (
              <div className="fade-in" style={{
                padding: 14, background: "var(--danger-soft)", borderRadius: 6,
                color: "var(--danger-fg)",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <Icon name="alert-triangle" size={18}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13px/1.4 var(--font-sans)" }}>{error.title}</div>
                  <div style={{ font: "500 11px/1 var(--font-mono)", marginTop: 2, opacity: 0.7 }}>{error.code}</div>
                  <div style={{ font: "400 12.5px/1.5 var(--font-sans)", marginTop: 6, color: "var(--fg-2)" }}>{error.why}</div>
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {error.fix.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-2)" }}>
                        <Icon name="arrow-right" size={12} color="var(--fg-4)"/>
                        {f.action ? (
                          <button onClick={f.action} style={{
                            background: "transparent", border: "none", padding: 0,
                            color: f.dangerous ? "var(--danger-fg)" : "var(--brand-fg)",
                            font: "500 12.5px/1.4 var(--font-sans)", textDecoration: "underline", cursor: "pointer",
                          }}>{f.label}</button>
                        ) : (
                          <span>{f.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Test button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" onClick={test} disabled={testState === "testing"}>
                {testState === "testing"
                  ? <><Spinner size={13}/> Testing connection…</>
                  : testState === "success"
                  ? <><Icon name="refresh" size={13}/> Retest connection</>
                  : <><Icon name="zap" size={13}/> Test connection</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.WizardSteps = { WIZARD_STEPS, StepIndicator, WizardFooter, Step1Connect };
