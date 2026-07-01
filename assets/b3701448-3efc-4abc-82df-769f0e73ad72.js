// Login screen — miniOrange PAM (split layout: brand panel + sign-in form)

const LoginScreen = ({ onSuccess }) => {
  const [email, setEmail] = React.useState("aria.chen@northwind.com");
  const [password, setPassword] = React.useState("••••••••••••");
  const [stay, setStay] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess && onSuccess(); }, 700);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-app)" }} data-screen-label="01 Login">
      {/* Left: brand / value panel */}
      <div style={{
        flex: "1 1 0", minWidth: 0,
        background: "linear-gradient(135deg, var(--brand) 0%, #3730a3 100%)",
        color: "#fff", padding: "40px 48px",
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="shield" size={16} color="#fff"/>
          </div>
          <span style={{ font: "600 16px/1 var(--font-sans)", letterSpacing: "-0.2px" }}>miniOrange PAM</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480 }}>
          <h2 style={{ font: "600 36px/1.15 var(--font-sans)", letterSpacing: "-0.8px", margin: 0 }}>
            Privileged access, governed.
          </h2>
          <p style={{ font: "400 16px/1.55 var(--font-sans)", margin: "16px 0 32px", color: "rgba(255,255,255,0.85)" }}>
            Vault credentials. Broker every session. Approve access just-in-time. Prove compliance to any auditor — without slowing your team down.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "key", label: "Vault & rotate every privileged credential" },
              { icon: "tickets", label: "Just-in-time access with multi-step approvals" },
              { icon: "sessions", label: "Recorded sessions across SSH, RDP, DB & web" },
              { icon: "shield", label: "SOC 2, PCI, ISO 27001 & HIPAA evidence on demand" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name={f.icon} size={14} color="#fff"/>
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          <span>Trusted by 8,000+ enterprises worldwide</span>
        </div>

        {/* Decorative grid */}
        <svg style={{ position: "absolute", right: -80, bottom: -80, opacity: 0.15 }} width="320" height="320" viewBox="0 0 100 100">
          <defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
          <rect width="100" height="100" fill="url(#grid)"/>
        </svg>
      </div>

      {/* Right: form */}
      <div style={{ flex: "0 0 480px", display: "flex", flexDirection: "column", padding: "32px 48px", background: "var(--bg-app)" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h1 style={{ font: "600 26px/1.2 var(--font-sans)", letterSpacing: "-0.4px", color: "var(--fg-1)", margin: 0 }}>Welcome back</h1>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--fg-3)" }}>Sign in to your Northwind Financial workspace</p>
            </div>

            <div className="field">
              <label className="field-label">Username or email</label>
              <input className="input" value={email} onChange={e => setEmail(e.target.value)}/>
            </div>

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="field-label">Password</label>
                <a href="#" style={{ fontSize: 12, color: "var(--brand-fg)", textDecoration: "none" }}>Forgot?</a>
              </div>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}/>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={stay} onChange={e => setStay(e.target.checked)} style={{ accentColor: "var(--brand)" }}/>
              Stay signed in for 30 days
            </label>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
              {loading ? <><Spinner size={14} color="#fff"/> Signing in…</> : "Sign in"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--fg-4)", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
              or with SSO
              <div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn" style={{ flex: 1 }}><Icon name="shield" size={13}/> Okta</button>
              <button type="button" className="btn" style={{ flex: 1 }}><Icon name="shield" size={13}/> Azure AD</button>
              <button type="button" className="btn" style={{ flex: 1 }}><Icon name="shield" size={13}/> SAML</button>
            </div>

            <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--fg-3)", marginTop: 4 }}>
              Setting up for the first time? <a href="#" style={{ color: "var(--brand-fg)", textDecoration: "none" }}>Start onboarding</a>
            </div>
          </form>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-4)" }}>
          <span>© 2025 miniOrange Inc.</span>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ color: "var(--fg-4)", textDecoration: "none" }}>Help</a>
            <a href="#" style={{ color: "var(--fg-4)", textDecoration: "none" }}>Privacy</a>
            <a href="#" style={{ color: "var(--fg-4)", textDecoration: "none" }}>Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
};

window.LoginScreen = LoginScreen;
