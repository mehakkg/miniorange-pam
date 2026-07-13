// Break-Glass Emergency Entry — the /emergency fast-path. A deliberately
// different visual world from standard PAM login: near-black background,
// deep-purple header strip, single column, mobile-first, zero decoration.
// The whole point is to get an admin from URL to granted access with the
// fewest possible steps at 2 AM under pressure.
//
// Phase 1: Screen 1 (login) + Screen 2 (MFA step-up) + Screen 3 (transition).
// Phase 2: Screen 4 (emergency form) + Screen 5 (pre-grant review) +
//          Screen 6 (granting) + Screen 7 (granted) + Path B redirect.
// Phase 3: Screen 8 (mobile monitor) + terminate + Screen 9 (terminated).
//
// Router-less prototype: the flow is reachable via #emergency (App reads the
// hash) or window.__enterEmergency(). No standard PAM chrome renders here.

const EM_BG = "#0F0E0C";       // near-black — unmistakably "not a normal screen"
const EM_PURPLE = "#7B3EA8";
const EM_RED = "#C0392B";
const EM_SOFT = "color-mix(in oklch, #7B3EA8 12%, transparent)";

// =========================================================
// SHARED CHROME
// =========================================================
const EmHeaderStrip = () => (
  <div style={{ height: 56, background: EM_PURPLE, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", flex: "none" }}>
    <span style={{ fontSize: 20, color: "#fff" }}>⚡</span>
    <span style={{ font: "600 14px/1 var(--font-sans)", color: "#fff" }}>Emergency Access — miniOrange PAM</span>
  </div>
);

const EmConsequenceLine = () => (
  <div style={{ font: "500 12px/1.5 var(--font-sans)", color: EM_RED, marginTop: 14 }}>
    This session will be recorded and logged permanently.
  </div>
);

// Six-digit code input — auto-advance, auto-submit at 6. Submit runs from a
// state effect (not the change handler) so it always sees the fresh code
// rather than a stale closure. Reused for authenticator and SMS/OTP.
const EmDigitBoxes = ({ value, onChange, onComplete, disabled, error }) => {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          autoFocus={i === 0}
          onKeyDown={e => {
            if (e.key === "Backspace" && !value[i] && i > 0) e.target.parentElement.children[i - 1]?.focus();
          }}
          onChange={e => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 1);
            const parent = e.target.parentElement;
            onChange(prev => (prev.slice(0, i) + v + prev.slice(i + 1)).slice(0, 6));
            if (v && i < 5) parent.children[i + 1]?.focus();
          }}
          style={{
            width: 48, height: 56, textAlign: "center",
            font: "600 22px/1 var(--font-mono)",
            border: `1.5px solid ${error ? EM_RED : "#3A3733"}`,
            borderRadius: 8, background: disabled ? "#1C1A17" : "#141210",
            color: "#fff", outline: "none",
            transition: "border-color 120ms",
          }}
        />
      ))}
    </div>
  );
};

// =========================================================
// SCREEN 1 — EMERGENCY LOGIN
// =========================================================
const EmLoginScreen = ({ onAuthed, onReturn }) => {
  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [reveal, setReveal] = React.useState(false);
  const [status, setStatus] = React.useState("idle");   // idle | submitting | locked | network
  const [error, setError] = React.useState(null);
  const [attemptsLeft, setAttemptsLeft] = React.useState(3);
  const ready = email.trim() && pw.trim();

  const submit = () => {
    if (!ready || status === "submitting") return;
    setStatus("submitting");
    setError(null);
    setTimeout(() => {
      // Demo auth: "network" password → network error; "wrong" → bad creds;
      // anything else → success. Lockout after attempts exhausted.
      if (pw === "network") { setStatus("network"); return; }
      if (pw === "wrong") {
        const left = attemptsLeft - 1;
        setAttemptsLeft(left);
        if (left <= 0) { setStatus("locked"); return; }
        setStatus("idle");
        setError(`Incorrect email or password. ${left} attempt${left === 1 ? "" : "s"} remaining before account is locked.`);
        setPw(""); setEmail("");
        return;
      }
      setStatus("idle");
      onAuthed();
    }, 900);
  };

  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {status === "locked" && (
            <div style={{ background: "color-mix(in oklch, " + EM_RED + " 20%, #141210)", border: `1px solid ${EM_RED}`, borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ font: "700 14px/1.3 var(--font-sans)", color: "#fff" }}>Your account has been locked after 3 failed attempts.</div>
              <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "#E5B8B2", marginTop: 6 }}>Contact another admin immediately: <strong style={{ color: "#fff" }}>Aria Chen · +1 (415) 555-0142</strong></div>
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
            <div style={{ font: "600 18px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Sign in to continue</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>You'll be taken directly to emergency access.</div>

            <div style={{ marginTop: 18 }}>
              <label style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Email or username</label>
              <input className="input" autoFocus value={email} disabled={status === "submitting" || status === "locked"}
                onChange={e => setEmail(e.target.value)} placeholder="arjun@northwind.com"
                onKeyDown={e => e.key === "Enter" && ready && submit()}
                style={{ marginTop: 6, height: 44, fontSize: 15 }}/>
            </div>

            <div style={{ marginTop: 14 }}>
              <label style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Password</label>
              <div style={{ position: "relative", marginTop: 6 }}>
                <input className="input" type={reveal ? "text" : "password"} value={pw} disabled={status === "submitting" || status === "locked"}
                  onChange={e => setPw(e.target.value)} placeholder="••••••••••"
                  onKeyDown={e => e.key === "Enter" && ready && submit()}
                  style={{ height: 44, fontSize: 15, paddingRight: 60 }}/>
                <button onClick={() => setReveal(r => !r)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "var(--fg-3)", font: "500 12px/1 var(--font-sans)", cursor: "pointer" }}>{reveal ? "Hide" : "Show"}</button>
              </div>
            </div>

            {error && <div style={{ marginTop: 10, font: "500 12px/1.5 var(--font-sans)", color: EM_RED }}>{error}</div>}

            {status === "network" ? (
              <div style={{ marginTop: 18 }}>
                <div style={{ font: "500 12.5px/1.5 var(--font-sans)", color: EM_RED, marginBottom: 8 }}>Connection lost. Check your network and try again.</div>
                <button onClick={() => { setStatus("idle"); submit(); }} style={emBtnPrimary}>Retry</button>
              </div>
            ) : (
              <button onClick={submit} disabled={!ready || status === "submitting" || status === "locked"}
                style={{ ...emBtnPrimary, ...((!ready || status === "locked") ? emBtnDisabled : {}) }}>
                {status === "submitting" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Spinner size={14}/> Verifying…</span> : "Continue →"}
              </button>
            )}

            <EmConsequenceLine/>
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <a href="#" onClick={e => { e.preventDefault(); onReturn(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "#9C97A8" }}>Return to standard login →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// SCREEN 2 — MFA STEP-UP
// =========================================================
const EmMfaScreen = ({ onVerified, method: initialMethod = "app" }) => {
  const [method, setMethod] = React.useState(initialMethod);   // app | key | sms
  const [code, setCode] = React.useState("");
  const [backup, setBackup] = React.useState(false);
  const [backupCode, setBackupCode] = React.useState("");
  const [status, setStatus] = React.useState("idle");          // idle | verifying | success | blocked
  const [error, setError] = React.useState(null);
  const [attemptsLeft, setAttemptsLeft] = React.useState(3);
  const [resendIn, setResendIn] = React.useState(24);

  // SMS resend countdown
  React.useEffect(() => {
    if (method !== "sms" || resendIn <= 0) return;
    const t = setInterval(() => setResendIn(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [method, resendIn]);

  const doVerify = (entered) => {
    setStatus("verifying");
    setError(null);
    setTimeout(() => {
      if (entered === "000000") {
        const left = attemptsLeft - 1;
        setAttemptsLeft(left);
        if (left <= 0) { setStatus("blocked"); return; }
        setStatus("idle");
        setError(`Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`);
        setCode("");
        return;
      }
      // success: teal flash then advance
      setStatus("success");
      setTimeout(onVerified, 700);
    }, 800);
  };

  // Auto-submit authenticator/SMS when 6 digits entered (300ms so the admin
  // sees it complete before it fires).
  React.useEffect(() => {
    if (!backup && code.length === 6 && status === "idle") {
      const t = setTimeout(() => doVerify(code), 300);
      return () => clearTimeout(t);
    }
  }, [code, backup]);

  // Hardware key: auto-trigger on mount (simulated WebAuthn)
  React.useEffect(() => {
    if (method === "key" && status === "idle") {
      const t = setTimeout(() => { setStatus("success"); setTimeout(onVerified, 700); }, 2600);
      return () => clearTimeout(t);
    }
  }, [method]);

  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
            <div style={{ font: "600 18px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Verify your identity</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>One more step before emergency access.</div>

            {status === "blocked" ? (
              <div style={{ marginTop: 18, padding: 14, background: "var(--danger-soft)", borderRadius: 8 }}>
                <div style={{ font: "700 13.5px/1.4 var(--font-sans)", color: EM_RED }}>Too many failed attempts.</div>
                <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)", marginTop: 4 }}>For security, emergency access from this device is temporarily blocked.</div>
                <div style={{ font: "500 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)", marginTop: 8 }}>Contact: <strong>Aria Chen · +1 (415) 555-0142</strong></div>
              </div>
            ) : method === "key" ? (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, background: bgdKeyBg(status), display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, animation: status === "idle" ? "bgPulse 1.8s infinite" : "none" }}>
                  <Icon name="key" size={28} color={status === "success" ? "var(--success-fg)" : EM_PURPLE}/>
                </div>
                <div style={{ font: "500 13.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>
                  {status === "success" ? "✓ Verified" : "Insert your security key and tap it when prompted."}
                </div>
                <a href="#" onClick={e => { e.preventDefault(); setMethod("app"); setStatus("idle"); }} style={{ display: "inline-block", marginTop: 12, font: "500 12.5px/1 var(--font-sans)", color: EM_PURPLE }}>Having trouble? →</a>
              </div>
            ) : backup ? (
              <div style={{ marginTop: 18 }}>
                <label style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Enter a backup code</label>
                <input className="input t-mono" autoFocus value={backupCode} onChange={e => setBackupCode(e.target.value)} placeholder="xxxx-xxxx" style={{ marginTop: 6, height: 44 }}/>
                <button onClick={() => doVerify(backupCode || "backup")} style={{ ...emBtnPrimary, marginTop: 14 }}>Verify →</button>
                <a href="#" onClick={e => { e.preventDefault(); setBackup(false); setBackupCode(""); }} style={{ display: "inline-block", marginTop: 12, font: "500 12.5px/1 var(--font-sans)", color: EM_PURPLE }}>Use authenticator app instead</a>
              </div>
            ) : (
              <div style={{ marginTop: 18 }}>
                <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)", marginBottom: 12, textAlign: "center" }}>
                  {method === "sms" ? "A 6-digit code was sent to ••• ••• 0142" : "Enter the 6-digit code from your authenticator app"}
                </div>
                <EmDigitBoxes value={code} onChange={setCode} disabled={status === "verifying" || status === "success"} error={!!error}/>
                {status === "success" && (
                  <div style={{ marginTop: 12, textAlign: "center", font: "600 13px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ Verified — entering emergency mode…</div>
                )}
                {status === "verifying" && (
                  <div style={{ marginTop: 12, textAlign: "center", font: "500 12.5px/1 var(--font-sans)", color: EM_PURPLE }}><Spinner size={12}/> Verifying…</div>
                )}
                {error && <div style={{ marginTop: 12, textAlign: "center", font: "500 12.5px/1.5 var(--font-sans)", color: EM_RED }}>{error}</div>}

                {method === "sms" && (
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    {resendIn > 0
                      ? <span style={{ font: "400 12px/1 var(--font-sans)", color: "var(--fg-4)" }}>Resend in {resendIn}s</span>
                      : <a href="#" onClick={e => { e.preventDefault(); setResendIn(24); window.pamToast && window.pamToast("New code sent", "info"); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: EM_PURPLE }}>Resend code</a>}
                  </div>
                )}
                {method === "app" && (
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <a href="#" onClick={e => { e.preventDefault(); setBackup(true); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: EM_PURPLE }}>Use a backup code instead</a>
                  </div>
                )}
              </div>
            )}

            <EmConsequenceLine/>

            {/* Demo-only method switcher */}
            {status !== "success" && status !== "blocked" && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                <span className="t-tiny" style={{ color: "var(--fg-4)" }}>[Demo] Method:</span>
                {[["app", "Authenticator"], ["key", "Hardware key"], ["sms", "SMS OTP"]].map(([m, l]) => (
                  <button key={m} onClick={() => { setMethod(m); setStatus("idle"); setCode(""); setBackup(false); setError(null); }} style={{ font: "500 11px/1 var(--font-sans)", padding: "3px 8px", borderRadius: 4, border: `1px solid ${method === m ? EM_PURPLE : "var(--border)"}`, background: method === m ? EM_SOFT : "#fff", color: method === m ? EM_PURPLE : "var(--fg-3)", cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
const bgdKeyBg = (status) => status === "success" ? "var(--success-soft)" : "color-mix(in oklch, #7B3EA8 18%, #141210)";

// =========================================================
// SCREEN 3 — TRANSITION
// =========================================================
const EmTransitionScreen = ({ onDone }) => {
  const [pct, setPct] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now ? null : 0;
    let raf;
    const t0 = Date.now();
    const step = () => {
      const p = Math.min(100, ((Date.now() - t0) / 2000) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(step);
      else setTimeout(onDone, 150);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 48, color: EM_PURPLE, marginBottom: 16, animation: "bgPulse 1.5s" }}>⚡</div>
        <div style={{ font: "600 24px/1.2 var(--font-sans)", color: "#fff" }}>Preparing emergency access</div>
        <div style={{ font: "400 15px/1.5 var(--font-sans)", color: "#B8B4C0", marginTop: 8 }}>Taking you directly to the emergency access form.</div>
        <div style={{ width: "100%", maxWidth: 320, height: 3, background: "#2A2724", borderRadius: 2, marginTop: 28, overflow: "hidden" }}>
          <div style={{ width: pct + "%", height: "100%", background: EM_PURPLE, transition: "width 60ms linear" }}/>
        </div>
      </div>
      <EmConsequenceBar/>
    </div>
  );
};

// Consequence bar — fixed bottom, persists Screens 3–6 (Phase 2 reuses it).
const EmConsequenceBar = () => (
  <div style={{ background: EM_RED, color: "#fff", padding: "12px 18px", font: "500 12px/1.4 var(--font-sans)", flex: "none", textAlign: "center" }}>
    ⚡ This session is being logged. All emergency access is mandatory-recorded and subject to post-incident review.
  </div>
);

// Status bar — replaces the consequence bar once access is active (Screen 7+).
// The emergency is now known; live status is what matters.
const EmStatusBar = ({ session, onTerminate }) => {
  const [, tick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, []);
  const msLeft = (session.expiresAtMs || Date.now()) - Date.now();
  return (
    <div style={{ background: EM_PURPLE, color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, font: "500 12.5px/1.3 var(--font-sans)", flex: "none" }}>
      <span>⚡ Break-glass active · <span className="t-mono">{session.id}</span> · <span className="t-mono">{bgdFmtCountdown(msLeft)}</span> remaining</span>
      <div style={{ flex: 1 }}/>
      {onTerminate && <button onClick={onTerminate} style={{ border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", font: "600 11.5px/1 var(--font-sans)", padding: "5px 10px", borderRadius: 5, cursor: "pointer" }}>Terminate</button>}
    </div>
  );
};

// =========================================================
// EMERGENCY-FLOW SEED DATA (recipients + resources for live search)
// =========================================================
const EM_RECIPIENTS = [
  { id: "u-rohan",  name: "Rohan Mehta",     email: "rohan.mehta@northwind.com",   role: "Backend Engineer · Operator" },
  { id: "u-priya",  name: "Priya Iyer",      email: "priya.iyer@northwind.com",    role: "SRE" },
  { id: "u-marcus", name: "Marcus Chen",     email: "marcus.chen@northwind.com",   role: "Data Engineer" },
  { id: "u-aditya", name: "Aditya Kulkarni", email: "aditya.k@northwind.com",      role: "Platform Engineer" },
];
const EM_RESOURCES = [
  { id: "r-proddb",  name: "prod-db-primary", type: "database", typeLabel: "Database · PostgreSQL", ip: "10.42.18.7:5432", env: "Production", criticality: "Critical", sessions: 2, creds: ["root-primary", "ro-analytics"] },
  { id: "r-auth",    name: "auth-server-01",  type: "server",   typeLabel: "Server · Linux",        ip: "10.42.18.20:22",  env: "Production", criticality: "High",     sessions: 0, creds: ["linux-ssh-admin"] },
  { id: "r-oracle",  name: "oracle-reporting", type: "database", typeLabel: "Database · Oracle",     ip: "10.42.19.4:1521", env: "Production", criticality: "High",     sessions: 1, creds: ["oracle-dba-01"] },
  { id: "r-billing", name: "legacy-billing",  type: "server",   typeLabel: "Server · Windows",      ip: "10.42.20.9:3389", env: "Production", criticality: "Critical", sessions: 0, creds: [] },  // no creds → blocked
];

// =========================================================
// SCREEN 4 — EMERGENCY FORM
// =========================================================
const EmSeverityCard = ({ level, title, desc, selected, onSelect }) => {
  const c = { P1: EM_RED, P2: "var(--warning-fg)", P3: "var(--brand-fg)" }[level];
  return (
    <button onClick={onSelect} style={{
      width: "100%", minHeight: 64, textAlign: "left", padding: "12px 14px", cursor: "pointer",
      border: `1.5px solid ${selected ? EM_PURPLE : c}`,
      background: selected ? EM_SOFT : "#fff", borderRadius: 8,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ padding: "3px 9px", borderRadius: 999, font: "700 12px/1.4 var(--font-sans)", background: selected ? EM_SOFT : "var(--bg-surface-2)", color: c, border: `1px solid ${c}` }}>{level}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", font: "700 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</span>
        <span style={{ display: "block", font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{desc}</span>
      </span>
      {selected && <span style={{ color: EM_PURPLE, fontSize: 16 }}>✓</span>}
    </button>
  );
};

const EmLiveSearch = ({ placeholder, items, renderItem, onPick }) => {
  const [q, setQ] = React.useState("");
  const matches = q ? items.filter(renderItem.match(q)) : [];
  return (
    <div>
      <input className="input" placeholder={placeholder} value={q} onChange={e => setQ(e.target.value)} style={{ height: 48, fontSize: 15 }}/>
      {q && (
        <div style={{ marginTop: 6, border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
          {matches.length === 0
            ? <div style={{ padding: 14, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-4)", textAlign: "center" }}>No matches.</div>
            : matches.map(it => renderItem.row(it, () => { onPick(it); setQ(""); }))}
        </div>
      )}
    </div>
  );
};

const EmFormSection = ({ label, children }) => (
  <div>
    <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>{label}</div>
    {children}
  </div>
);

const EmFormScreen = ({ form, setForm, onReview, onCancel, prefillNote }) => {
  const [showErrors, setShowErrors] = React.useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const minChars = (window.bgStore?.config?.minChars) || 50;
  const maxHrs = (window.bgStore?.config?.maxHrs) || 24;

  const errs = [];
  if (!form.severity) errs.push("Severity");
  if (!form.recipient) errs.push("Recipient");
  if (!form.resource) errs.push("Resource");
  if ((form.justification || "").trim().length < minChars) errs.push(`Justification (${minChars} chars minimum)`);
  const valid = errs.length === 0;

  const recRow = {
    match: (q) => (r) => `${r.name} ${r.email} ${r.role}`.toLowerCase().includes(q.toLowerCase()),
    row: (r, pick) => (
      <button key={r.id} onClick={pick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
        <Avatar name={r.name} size={26}/>
        <div><div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.role}</div></div>
      </button>
    ),
  };
  const resRow = {
    match: (q) => (r) => `${r.name} ${r.env}`.toLowerCase().includes(q.toLowerCase()),
    row: (r, pick) => {
      const blocked = r.creds.length === 0;
      return (
        <button key={r.id} onClick={() => !blocked && pick()} disabled={blocked} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: "transparent", cursor: blocked ? "not-allowed" : "pointer", textAlign: "left", opacity: blocked ? 0.6 : 1 }}>
          <Icon name={r.type === "database" ? "database" : "server"} size={14} color="var(--fg-3)"/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{blocked ? "⚠ " : ""}{r.name}</div>
            <div className="t-tiny" style={{ color: blocked ? "var(--danger-fg)" : "var(--fg-4)" }}>{blocked ? "no credentials attached — cannot grant access" : `${r.env} · ${r.criticality}`}</div>
          </div>
          {!blocked && <span style={{ padding: "1px 7px", borderRadius: 999, font: "600 10px/1.4 var(--font-sans)", background: r.criticality === "Critical" ? "var(--danger-soft)" : "var(--warning-soft)", color: r.criticality === "Critical" ? "var(--danger-fg)" : "var(--warning-fg)" }}>{r.criticality}</span>}
        </button>
      );
    },
  };

  const inputBig = { height: 48, fontSize: 16 };

  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 640, padding: "18px 18px 32px" }}>
          <div style={{ font: "500 12px/1 var(--font-sans)", color: "#B8B4C0", marginBottom: 14 }}>Step 1 of 2 — Emergency details</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", gap: 22 }}>

            {prefillNote && (
              <div style={{ padding: 10, background: EM_SOFT, color: EM_PURPLE, borderLeft: `3px solid ${EM_PURPLE}`, borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
                {prefillNote}
              </div>
            )}

            <EmFormSection label="Severity">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <EmSeverityCard level="P1" title="Critical" desc="System down · Revenue impact · Customer-facing" selected={form.severity === "P1"} onSelect={() => set("severity", "P1")}/>
                <EmSeverityCard level="P2" title="High"     desc="Degraded service · Security incident" selected={form.severity === "P2"} onSelect={() => set("severity", "P2")}/>
                <EmSeverityCard level="P3" title="Medium"   desc="Internal issue · No direct customer impact" selected={form.severity === "P3"} onSelect={() => set("severity", "P3")}/>
              </div>
            </EmFormSection>

            <EmFormSection label={(window.bgStore?.config?.ticketLabel) || "PagerDuty incident #"}>
              <input className="input" value={form.incident} onChange={e => set("incident", e.target.value)} placeholder="e.g. PD-4821" style={inputBig}/>
              <div style={{ marginTop: 6, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>Enter your incident ticket number</div>
              {window.__emItsmDown && <div style={{ marginTop: 6, padding: 8, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)" }}>⚠ ITSM unreachable — enter reference manually. Does not block submission.</div>}
            </EmFormSection>

            <EmFormSection label="Who needs access?">
              {form.recipient ? (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", background: EM_SOFT, borderRadius: 999 }}>
                  <Avatar name={form.recipient.name} size={22}/>
                  <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{form.recipient.name}</span>
                  <button onClick={() => set("recipient", null)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 14 }}>×</button>
                </div>
              ) : (
                <EmLiveSearch placeholder="Search by name or email…" items={EM_RECIPIENTS} renderItem={recRow} onPick={r => set("recipient", r)}/>
              )}
            </EmFormSection>

            <EmFormSection label="Which resource?">
              {form.resource ? (
                <>
                  <div style={{ padding: 12, border: `1px solid ${EM_PURPLE}`, borderRadius: 6, background: EM_SOFT }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name={form.resource.type === "database" ? "database" : "server"} size={14} color="var(--fg-2)"/>
                      <span className="t-mono" style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{form.resource.name}</span>
                      <button onClick={() => { set("resource", null); set("credential", null); }} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: "var(--fg-3)", fontSize: 14 }}>×</button>
                    </div>
                    <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>{form.resource.typeLabel} · {form.resource.ip} · {form.resource.criticality} · {form.resource.sessions} active session{form.resource.sessions === 1 ? "" : "s"}</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <label style={{ font: "500 12px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>Which credential?</label>
                    <select className="input" value={form.credential || form.resource.creds[0]} onChange={e => set("credential", e.target.value)} style={{ marginTop: 6, height: 44 }}>
                      {form.resource.creds.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <EmLiveSearch placeholder="Search resources…" items={EM_RESOURCES} renderItem={resRow} onPick={r => { set("resource", r); set("credential", r.creds[0]); }}/>
              )}
            </EmFormSection>

            <EmFormSection label="How long?">
              <div style={{ display: "flex", gap: 8 }}>
                {[{ v: 1, l: "1 hour" }, { v: 4, l: "4 hours" }, { v: "custom", l: "Custom" }].map(o => {
                  const sel = form.duration === o.v;
                  return <button key={o.v} onClick={() => set("duration", o.v)} style={{ flex: 1, height: 48, border: `1.5px solid ${sel ? EM_PURPLE : "var(--border)"}`, background: sel ? EM_SOFT : "#fff", color: sel ? EM_PURPLE : "var(--fg-2)", font: `${sel ? 700 : 500} 13px/1 var(--font-sans)`, borderRadius: 6, cursor: "pointer" }}>{o.l}</button>;
                })}
              </div>
              {form.duration === "custom" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input className="input" type="number" min={1} max={maxHrs} value={form.customHrs} onChange={e => set("customHrs", Math.min(maxHrs, Math.max(1, +e.target.value || 1)))} style={{ width: 100, height: 44 }}/>
                  <span style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>hours · Max: {maxHrs}h per policy</span>
                </div>
              )}
              <div style={{ marginTop: 8, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>Access expires automatically. Post-incident review is required after.</div>
            </EmFormSection>

            <EmFormSection label="What's happening?">
              <textarea className="input" rows={4} value={form.justification} onChange={e => set("justification", e.target.value)} placeholder="Describe what happened and why normal access isn't possible right now."/>
              <div style={{ marginTop: 4, font: "500 11.5px/1 var(--font-sans)", color: (form.justification || "").trim().length >= minChars ? "var(--success-fg)" : (showErrors ? EM_RED : "var(--fg-4)") }}>{(form.justification || "").trim().length} / {minChars} minimum</div>
            </EmFormSection>

            {showErrors && !valid && (
              <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", color: EM_RED }}>
                Complete these fields: {errs.join(", ")}
              </div>
            )}

            <button onClick={() => valid ? onReview() : setShowErrors(true)}
              style={{ ...emBtnPrimary, height: 56, marginTop: 0, ...(valid ? {} : { background: "#C9C5CE" }) }}>
              Review and grant →
            </button>
            <div style={{ textAlign: "center" }}>
              <a href="#" onClick={e => { e.preventDefault(); onCancel(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>Cancel and go to dashboard →</a>
            </div>
          </div>
        </div>
      </div>
      <EmConsequenceBar/>
    </div>
  );
};

// =========================================================
// SCREEN 5 — PRE-GRANT REVIEW
// =========================================================
const EmReviewScreen = ({ form, onGrant, onEdit }) => {
  const [typed, setTyped] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const crit = form.resource.criticality;
  const hrs = form.duration === "custom" ? form.customHrs : form.duration;
  const expires = new Date(Date.now() + hrs * 3600000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const [showMore, setShowMore] = React.useState(false);

  // Confirmation friction scales with resource criticality.
  const canGrant = crit === "Critical" ? typed.trim().toLowerCase() === form.resource.name.toLowerCase()
                 : crit === "High" ? checked
                 : true;

  const Row = ({ k, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "5px 0", font: "400 12.5px/1.5 var(--font-sans)" }}>
      <span style={{ color: "var(--fg-4)" }}>{k}</span><span style={{ color: "var(--fg-1)" }}>{children}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 640, padding: "18px 18px 32px" }}>
          <div style={{ font: "500 12px/1 var(--font-sans)", color: "#B8B4C0", marginBottom: 14 }}>Step 2 of 2 — Review before granting</div>
          <div style={{ background: "#fff", borderRadius: 8, padding: 20 }}>
            <div style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Review before you grant</div>
            <div style={{ font: "500 13px/1.5 var(--font-sans)", color: EM_RED, marginTop: 4 }}>This cannot be undone — only revoked.</div>

            <div style={{ marginTop: 16, padding: 14, border: `2px solid ${EM_PURPLE}`, borderRadius: 8 }}>
              <Row k="Severity"><BGDSeverity level={form.severity} size="lg"/></Row>
              <Row k="Incident">{form.incident || "—"}</Row>
              <Row k="Recipient"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Avatar name={form.recipient.name} size={20}/> {form.recipient.name} · {form.recipient.role}</span></Row>
              <Row k="Resource"><span className="t-mono">{form.resource.name}</span> · {form.resource.typeLabel} · {form.resource.criticality}</Row>
              <Row k="Credential"><span className="t-mono">{form.credential || form.resource.creds[0]}</span> <span style={{ color: "var(--fg-4)" }}>(non-viewable)</span></Row>
              <Row k="Duration">{hrs} hour{hrs === 1 ? "" : "s"} · Expires {expires}</Row>
              <Row k="Recording"><span style={{ color: "var(--success-fg)" }}>● Mandatory</span></Row>
              <Row k="Rotation"><span style={{ color: "var(--fg-2)" }}>✓ Queued after session ends</span></Row>
              <Row k="Justification">
                <span>{showMore ? form.justification : (form.justification.slice(0, 100) + (form.justification.length > 100 ? "…" : ""))}
                  {form.justification.length > 100 && <a href="#" onClick={e => { e.preventDefault(); setShowMore(m => !m); }} style={{ marginLeft: 6, color: EM_PURPLE }}>{showMore ? "Show less" : "Show more"}</a>}</span>
              </Row>
            </div>

            <div style={{ marginTop: 14, padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.8 var(--font-sans)", color: "var(--fg-3)" }}>
              🔒 Session recording — always on<br/>
              🔒 MFA required when recipient connects<br/>
              🔒 Credential rotation after session ends<br/>
              🔒 Post-incident review mandatory
            </div>

            {/* Confirmation mechanism scales with criticality */}
            <div style={{ marginTop: 16 }}>
              {crit === "Critical" && (
                <div>
                  <label style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>Type the resource name to confirm:</label>
                  <input className="input t-mono" autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={form.resource.name} style={{ marginTop: 6, height: 44 }}/>
                </div>
              )}
              {crit === "High" && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>
                  <input type="checkbox" checked={checked} onChange={() => setChecked(c => !c)} style={{ accentColor: EM_PURPLE, marginTop: 2 }}/>
                  I confirm I am granting emergency access to <strong className="t-mono">{form.resource.name}</strong>
                </label>
              )}
            </div>

            <button onClick={() => canGrant && onGrant(hrs, expires)} disabled={!canGrant}
              style={{ ...emBtnPrimary, height: 56, ...(canGrant ? {} : { background: "#C9C5CE", cursor: "not-allowed" }) }}>
              Grant emergency access
            </button>
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <a href="#" onClick={e => { e.preventDefault(); onEdit(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>← Edit</a>
            </div>
          </div>
        </div>
      </div>
      <EmConsequenceBar/>
    </div>
  );
};

// =========================================================
// SCREEN 6 — GRANTING IN PROGRESS
// =========================================================
const EM_GRANT_STEPS = [
  "Identity verified",
  "Emergency details recorded",
  "Granting access",
  "Notifying security team",
  "Starting mandatory recording",
  "Logging to audit trail",
];
const EmGrantingScreen = ({ form, onDone }) => {
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    if (done >= EM_GRANT_STEPS.length) { const t = setTimeout(onDone, 400); return () => clearTimeout(t); }
    const t = setTimeout(() => setDone(d => d + 1), done === 0 ? 300 : 450);
    return () => clearTimeout(t);
  }, [done]);
  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ font: "600 18px/1.3 var(--font-sans)", color: "#fff", marginBottom: 20, textAlign: "center" }}>Granting emergency access…</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {EM_GRANT_STEPS.map((s, i) => {
              const complete = i < done;
              const active = i === done;
              const label = s === "Granting access" ? `Granting access to ${form.resource.name} for ${form.recipient.name}…`
                          : s === "Notifying security team" ? "Notifying security team"
                          : s;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: complete || active ? "#1A1815" : "transparent", borderRadius: 6, opacity: complete || active ? 1 : 0.4 }}>
                  <span style={{ width: 20, textAlign: "center", color: complete ? "var(--success-fg)" : active ? EM_PURPLE : "#5A564F" }}>
                    {complete ? "✓" : active ? <Spinner size={13}/> : "○"}
                  </span>
                  <span style={{ flex: 1, font: "500 13px/1.4 var(--font-sans)", color: complete ? "#DFE3E8" : active ? "#fff" : "#8A857C" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <EmConsequenceBar/>
    </div>
  );
};

// =========================================================
// SCREEN 7 — ACCESS GRANTED
// =========================================================
const EmGrantedScreen = ({ session, form, onMonitor, onExit }) => {
  const [notified, setNotified] = React.useState(true);
  const expires = new Date(session.expiresAtMs).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, padding: "24px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 40, color: EM_PURPLE }}>⚡</div>
          <div style={{ font: "600 24px/1.2 var(--font-sans)", color: "#fff", marginTop: 8 }}>Emergency access granted</div>

          <div style={{ marginTop: 20, background: "#fff", border: `2px solid ${EM_PURPLE}`, borderRadius: 8, padding: 16, textAlign: "left" }}>
            <div className="t-mono" style={{ font: "700 14px/1.3 var(--font-mono)", color: EM_PURPLE, marginBottom: 10 }}>{session.id}</div>
            {[["Recipient", form.recipient.name], ["Resource", form.resource.name], ["Credential", (form.credential || form.resource.creds[0]) + " (non-viewable — injected automatically)"], ["Access expires", expires], ["Recording", "● Active now"], ["Notification sent to", "Aria Chen, Security Team"]].map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "4px 0", font: "400 12.5px/1.5 var(--font-sans)" }}>
                <span style={{ color: "var(--fg-4)" }}>{k}</span><span style={{ color: k === "Recording" ? "var(--success-fg)" : "var(--fg-1)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, padding: 10, background: "#1A1815", borderRadius: 6, font: "500 11px/1.5 var(--font-mono)", color: "#9CA3AF", textAlign: "left" }}>
            Logged: {session.id} granted at {new Date(session.grantedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} by Arjun Bansal · {form.incident || "—"} · Northwind Financial
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            <button onClick={onMonitor} style={{ ...emBtnPrimary, height: 56, marginTop: 0 }}>Monitor live session</button>
            <button onClick={() => { setNotified(true); window.pamToast && window.pamToast(`Grant details sent to ${form.recipient.name}`, "info"); }}
              style={{ height: 48, border: `1px solid ${EM_PURPLE}`, background: "#fff", color: EM_PURPLE, font: "600 14px/1 var(--font-sans)", borderRadius: 8, cursor: "pointer" }}>
              {notified ? `Resend grant details to ${form.recipient.name.split(" ")[0]}` : `Send grant details to ${form.recipient.name.split(" ")[0]}`}
            </button>
            <button onClick={onExit} style={{ height: 44, border: "none", background: "transparent", color: "#9C97A8", font: "500 13px/1 var(--font-sans)", cursor: "pointer" }}>Go to PAM dashboard</button>
          </div>
        </div>
      </div>
      <EmStatusBar session={session}/>
    </div>
  );
};

// =========================================================
// PATH B — EMERGENCY REDIRECT MODAL (within standard PAM shell)
// =========================================================
const EmRedirectModal = ({ onGo, onDismiss }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 480, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div style={{ width: 420, maxWidth: "94vw", background: EM_PURPLE, borderRadius: 12, padding: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", textAlign: "center" }}>
      <div style={{ fontSize: 34, color: "#fff" }}>⚡</div>
      <div style={{ font: "600 22px/1.2 var(--font-sans)", color: "#fff", marginTop: 8 }}>You have an emergency waiting</div>
      <div style={{ font: "400 14px/1.5 var(--font-sans)", color: "rgba(255,255,255,0.85)", marginTop: 8 }}>A break-glass notification requires your attention.</div>
      <div style={{ font: "400 13px/1.6 var(--font-sans)", color: "rgba(255,255,255,0.95)", marginTop: 14, padding: 12, background: "rgba(0,0,0,0.18)", borderRadius: 8 }}>
        Incident: PD-4821 · Reported by: Rohan Mehta
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <button onClick={onGo} style={{ height: 48, border: "none", borderRadius: 8, background: "#fff", color: EM_PURPLE, font: "700 14px/1 var(--font-sans)", cursor: "pointer" }}>Go to emergency access →</button>
        <button onClick={onDismiss} style={{ height: 44, border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, background: "transparent", color: "#fff", font: "500 13px/1 var(--font-sans)", cursor: "pointer" }}>Dismiss and go to dashboard</button>
      </div>
    </div>
  </div>
);

// =========================================================
// SCREEN 8 — MOBILE MONITOR (native single-column, not a shrunk desktop panel)
// =========================================================
const EM_FEED_SEED = [
  { ts: "02:47:31", cmd: "rm -rf /var/log", risk: "high" },
  { ts: "02:47:28", cmd: "cd /var/log", risk: "low" },
  { ts: "02:47:22", cmd: "sudo su", risk: "med" },
  { ts: "02:47:15", cmd: "Session connected as root", risk: "low" },
];
const EmMonitorScreen = ({ session, form, onTerminate, onExtend }) => {
  const [, tick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, []);
  // Local expiry so demo controls can exercise the amber/red countdown states.
  const [expiresAtMs, setExpiresAtMs] = React.useState(session.expiresAtMs);
  const [paused, setPaused] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const msLeft = expiresAtMs - Date.now();
  const critical = msLeft <= 10 * 60000, warning = !critical && msLeft <= 30 * 60000;
  const cdColor = critical ? "#F87171" : warning ? "#FBBF24" : "#fff";
  const riskColor = c => c === "high" ? "#F87171" : c === "med" ? "#FBBF24" : "#9CA3AF";

  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, padding: "18px 16px 28px" }}>
          {/* TOP — grant status, terminate always first/visible */}
          <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "#fff" }}>⚡ <span className="t-mono">{session.id}</span> — Active</div>
          <div style={{ font: "400 13px/1.4 var(--font-sans)", color: "#B8B4C0", marginTop: 4 }}>{form.recipient.name} → <span className="t-mono">{form.resource.name}</span></div>

          <div style={{ marginTop: 14, padding: "16px", background: "#1A1815", borderRadius: 10, textAlign: "center" }}>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "#8A857C", textTransform: "uppercase", letterSpacing: 0.6 }}>Time remaining</div>
            <div className="t-mono" style={{ font: "700 34px/1.1 var(--font-mono)", color: cdColor, marginTop: 6, animation: critical ? "bgPulse 1.6s infinite" : "none" }}>{bgdFmtCountdown(msLeft)}</div>
          </div>

          <button onClick={onTerminate} style={{ ...emBtnPrimary, height: 56, marginTop: 12, background: EM_RED }}>Terminate</button>
          <button onClick={onExtend} style={{ width: "100%", height: 48, marginTop: 8, border: `1px solid ${EM_PURPLE}`, background: "transparent", color: "#C9A6E0", font: "600 14px/1 var(--font-sans)", borderRadius: 8, cursor: "pointer" }}>Extend</button>

          {/* Risk score */}
          <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ font: "600 11px/1 var(--font-sans)", color: "#8A857C", textTransform: "uppercase", letterSpacing: 0.6 }}>Live commands</span>
            <span style={{ padding: "3px 10px", borderRadius: 999, font: "700 12px/1.3 var(--font-sans)", background: "rgba(248,113,113,0.18)", color: "#F87171" }}>Risk: 91 — Critical</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <span style={{ font: "400 11.5px/1 var(--font-sans)", color: paused ? "#8A857C" : "var(--success-fg)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className={paused ? "" : "pulse-dot"} style={{ width: 6, height: 6, borderRadius: "50%", background: paused ? "#8A857C" : "var(--success-fg)", display: "inline-block" }}/>
              {paused ? "Paused" : "Refreshing every 5 seconds"}
            </span>
            <button onClick={() => setPaused(p => !p)} style={{ border: "none", background: "none", color: "#C9A6E0", font: "500 11.5px/1 var(--font-sans)", cursor: "pointer" }}>{paused ? "Resume" : "Pause"}</button>
          </div>

          {/* Feed */}
          <div style={{ marginTop: 8, background: "#0A0908", borderRadius: 8, border: "1px solid #2A2724", overflow: "hidden" }}>
            {EM_FEED_SEED.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", borderTop: i ? "1px solid #1C1A17" : "none", font: "500 12px/1.4 var(--font-mono)" }}>
                <span style={{ color: "#6B7280", flex: "none" }}>{f.ts}</span>
                <span style={{ color: f.risk === "high" ? "#F87171" : "#DFE3E8", flex: 1 }}>{f.cmd}</span>
                {f.risk === "high" && <span style={{ color: "#F87171", flex: "none" }}>⚑</span>}
                {f.risk === "med" && <span style={{ color: "#FBBF24", flex: "none", font: "500 10px/1.4 var(--font-sans)" }}>elevated</span>}
              </div>
            ))}
          </div>

          {/* Collapsible session details */}
          <button onClick={() => setDetailsOpen(o => !o)} style={{ marginTop: 14, width: "100%", textAlign: "left", border: "none", background: "none", color: "#C9A6E0", font: "500 13px/1 var(--font-sans)", cursor: "pointer" }}>
            Session details {detailsOpen ? "↑" : "↓"}
          </button>
          {detailsOpen && (
            <div style={{ marginTop: 8, padding: 12, background: "#1A1815", borderRadius: 8, font: "400 12px/1.7 var(--font-mono)", color: "#B8B4C0" }}>
              Resource: {form.resource.name} · {form.resource.ip}<br/>
              Credential: {session.credential} (non-viewable)<br/>
              Policy: 4h window · recording on · rotation queued<br/>
              MFA: verified at connect
            </div>
          )}

          {/* Demo-only countdown state controls */}
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed #2A2724", display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <span className="t-tiny" style={{ color: "#5A564F" }}>[Demo] Countdown:</span>
            <button onClick={() => setExpiresAtMs(session.expiresAtMs)} style={emDemoBtn}>Normal</button>
            <button onClick={() => setExpiresAtMs(Date.now() + 25 * 60000)} style={emDemoBtn}>&lt;30m (amber)</button>
            <button onClick={() => setExpiresAtMs(Date.now() + 8 * 60000)} style={emDemoBtn}>&lt;10m (red)</button>
          </div>
        </div>
      </div>
      <EmStatusBar session={{ ...session, expiresAtMs }} onTerminate={onTerminate}/>
    </div>
  );
};
const emDemoBtn = { font: "500 11px/1 var(--font-sans)", padding: "3px 8px", borderRadius: 4, border: "1px solid #3A3733", background: "#1A1815", color: "#B8B4C0", cursor: "pointer" };

// =========================================================
// TERMINATE OVERLAY (mobile — full-screen, large tap targets)
// =========================================================
const EmTerminateOverlay = ({ form, onConfirm, onCancel }) => {
  const [reason, setReason] = React.useState("");
  const [other, setOther] = React.useState("");
  const reasons = ["Incident resolved", "Security concern", "Scope exceeded", "Admin error", "Other"];
  const valid = reason && (reason !== "Other" || other.trim());
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 520, background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 440, padding: "24px 18px" }}>
          <div style={{ font: "600 20px/1.3 var(--font-sans)", color: "#fff" }}>Terminate emergency access?</div>
          <div style={{ font: "400 14px/1.6 var(--font-sans)", color: "#B8B4C0", marginTop: 10 }}>{form.recipient.name} will be disconnected from <span className="t-mono" style={{ color: "#DFE3E8" }}>{form.resource.name}</span> immediately.</div>
          <div style={{ marginTop: 10, padding: 12, background: "rgba(192,57,43,0.16)", borderLeft: `3px solid ${EM_RED}`, borderRadius: "0 6px 6px 0", font: "500 13px/1.5 var(--font-sans)", color: "#F0A9A0" }}>
            Credential rotation will begin automatically.
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "#B8B4C0" }}>Reason</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="input" style={{ marginTop: 6, height: 48, fontSize: 15, background: "#141210", color: "#fff", borderColor: "#3A3733" }}>
              <option value="">Select a reason…</option>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {reason === "Other" && (
              <input className="input" value={other} onChange={e => setOther(e.target.value)} placeholder="Describe…" style={{ marginTop: 8, height: 44, background: "#141210", color: "#fff", borderColor: "#3A3733" }}/>
            )}
          </div>

          <button onClick={onCancel} style={{ width: "100%", height: 48, marginTop: 20, border: "1px solid #3A3733", background: "transparent", color: "#DFE3E8", font: "600 14px/1 var(--font-sans)", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => valid && onConfirm(reason === "Other" ? other : reason)} disabled={!valid}
            style={{ width: "100%", height: 56, marginTop: 10, border: "none", background: valid ? EM_RED : "#5A2420", color: "#fff", font: "700 15px/1 var(--font-sans)", borderRadius: 8, cursor: valid ? "pointer" : "not-allowed" }}>
            Terminate and revoke
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// SCREEN 9 — TERMINATE CONFIRMED
// =========================================================
const EmTerminatedScreen = ({ session, form, review, onStartReview, onExit }) => {
  // Rotation state: in-progress → completed after a beat. Demo toggle exposes
  // the failure + retry variant.
  const [rotation, setRotation] = React.useState("in-progress");
  React.useEffect(() => {
    if (rotation !== "in-progress") return;
    const t = setTimeout(() => setRotation("completed"), 3500);
    return () => clearTimeout(t);
  }, [rotation]);
  const days = (window.bgStore?.config?.escalateDays) || 3;
  const dueDate = new Date(Date.now() + days * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const rot = {
    "in-progress": { c: "var(--warning-fg)", t: "● In progress · est. 45 seconds" },
    "completed":   { c: "var(--success-fg)", t: "✓ Completed" },
    "failed":      { c: "#F87171", t: "✗ Failed" },
  }[rotation];
  return (
    <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
      <EmHeaderStrip/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 440, padding: "28px 18px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>✓</div>
          <div style={{ font: "600 22px/1.2 var(--font-sans)", color: "#fff", marginTop: 12 }}>Emergency access ended</div>
          <div style={{ font: "400 13.5px/1.6 var(--font-sans)", color: "#B8B4C0", marginTop: 8 }}>{form.recipient.name} has been disconnected from <span className="t-mono">{form.resource.name}</span>.</div>

          <div style={{ marginTop: 16, padding: 14, background: "#1A1815", borderRadius: 8, textAlign: "left" }}>
            <div style={{ font: "500 13px/1.5 var(--font-sans)", color: "#DFE3E8" }}><span className="t-mono">{session.credential}</span> rotation: <span style={{ color: rot.c }}>{rot.t}</span></div>
            {rotation === "failed" && (
              <button onClick={() => setRotation("in-progress")} style={{ marginTop: 8, ...emDemoBtn, color: "#F0A9A0", borderColor: "#5A2420" }}>Retry rotation</button>
            )}
            {rotation !== "failed" && (
              <button onClick={() => setRotation("failed")} style={{ marginTop: 8, ...emDemoBtn }}>[Demo] Show rotation failed</button>
            )}
          </div>

          <div style={{ marginTop: 14, padding: 14, background: "color-mix(in oklch, " + EM_PURPLE + " 16%, #141210)", borderRadius: 8, textAlign: "left" }}>
            <div style={{ font: "600 13.5px/1.4 var(--font-sans)", color: "#fff" }}>Post-incident review required</div>
            <div style={{ font: "400 12.5px/1.6 var(--font-sans)", color: "#C9C5CE", marginTop: 4 }}>Review must be completed within {days} days (by {dueDate}). You'll receive a reminder notification.</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            <button onClick={onStartReview} style={{ ...emBtnPrimary, height: 56, marginTop: 0 }}>Start review now →</button>
            <button onClick={onExit} style={{ height: 44, border: "none", background: "transparent", color: "#9C97A8", font: "500 13px/1 var(--font-sans)", cursor: "pointer" }}>Review later — go to dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// FLOW CONTROLLER
// =========================================================
const EmergencyEntryFlow = ({ onExit, startScreen = "login" }) => {
  const [screen, setScreen] = React.useState(startScreen);   // login|mfa|transition|form|review|granting|granted|monitor|terminate|terminated|review-panel
  const [form, setForm] = React.useState({ severity: "", incident: "", recipient: null, resource: null, credential: null, duration: 4, customHrs: 2, justification: "" });
  const [session, setSession] = React.useState(null);
  const [endedReview, setEndedReview] = React.useState(null);

  const doGrant = (hrs, expiresLabel) => {
    const grantedAt = Date.now();
    const s = {
      id: "BG-0147", severity: form.severity, recipient: form.recipient.name,
      resource: form.resource.name, credential: form.credential || form.resource.creds[0],
      initiator: "Arjun Bansal", durationHrs: hrs, expiresAtMs: grantedAt + hrs * 3600000,
      grantedAt, justification: form.justification, ticket: form.incident, commands: 0,
    };
    setSession(s);
    // Register as the real active break-glass session so the dashboard,
    // floating indicator, and header button all reflect it.
    if (window.bgStore) window.bgStore.grant(s);
    setScreen("granting");
  };

  // Terminate → clear the active session and drop a pending review into the
  // dashboard (rotation in-progress). Doesn't set bgStore.open, so no global
  // panel pops behind the emergency overlay.
  const doTerminate = (reason) => {
    const rev = {
      id: session.id, severity: session.severity, recipient: session.recipient, initiator: "Arjun Bansal",
      resource: session.resource, endedMs: Date.now(), started: new Date(session.grantedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      ended: "just now", duration: "—", justification: session.justification, ticket: session.ticket || "—",
      status: "pending", credential: session.credential, rotated: false, rotationStatus: "in-progress",
      commands: session.commands || 0, assignedTo: "Arjun Bansal", ctxSubmitted: false, terminatedReason: reason,
    };
    if (window.bgStore) {
      window.bgStore.stopPoll && window.bgStore.stopPoll();
      window.bgStore.reviews = [rev, ...window.bgStore.reviews];
      window.bgStore.active = null;
      window.bgStore.emit();
    }
    setEndedReview(rev);
    setScreen("terminated");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: EM_BG, overflow: "auto" }}>
      {screen === "login" && <EmLoginScreen onAuthed={() => setScreen("mfa")} onReturn={onExit}/>}
      {screen === "mfa" && <EmMfaScreen onVerified={() => setScreen("transition")}/>}
      {screen === "transition" && <EmTransitionScreen onDone={() => setScreen("form")}/>}
      {screen === "form" && <EmFormScreen form={form} setForm={setForm} onReview={() => setScreen("review")} onCancel={onExit} prefillNote={startScreen === "form" ? "Pre-filled from your emergency notification — confirm the details below." : null}/>}
      {screen === "review" && <EmReviewScreen form={form} onGrant={doGrant} onEdit={() => setScreen("form")}/>}
      {screen === "granting" && <EmGrantingScreen form={form} onDone={() => setScreen("granted")}/>}
      {screen === "granted" && <EmGrantedScreen session={session} form={form} onMonitor={() => setScreen("monitor")} onExit={onExit}/>}
      {screen === "monitor" && <EmMonitorScreen session={session} form={form} onTerminate={() => setScreen("terminate")} onExtend={() => window.pamToast && window.pamToast("Extension modal — use the dashboard Extend action for the full flow", "info")}/>}
      {screen === "terminate" && <EmTerminateOverlay form={form} onConfirm={doTerminate} onCancel={() => setScreen("monitor")}/>}
      {screen === "terminated" && <EmTerminatedScreen session={session} form={form} review={endedReview} onStartReview={() => setScreen("review-panel")} onExit={onExit}/>}
      {screen === "review-panel" && window.BGDReviewPanel && React.createElement(window.BGDReviewPanel, { review: endedReview, onClose: onExit })}
    </div>
  );
};

// Shared button styles (dark-flow variants)
const emBtnPrimary = {
  width: "100%", height: 48, marginTop: 18, border: "none", borderRadius: 8,
  background: EM_PURPLE, color: "#fff", font: "600 15px/1 var(--font-sans)", cursor: "pointer",
};
const emBtnDisabled = { background: "#C9C5CE", color: "#fff", cursor: "not-allowed" };

Object.assign(window, {
  EmergencyEntryFlow, EmLoginScreen, EmMfaScreen, EmTransitionScreen,
  EmHeaderStrip, EmConsequenceBar, EmConsequenceLine, EmDigitBoxes,
  EmFormScreen, EmReviewScreen, EmGrantingScreen, EmGrantedScreen,
  EmRedirectModal, EmStatusBar, EmMonitorScreen, EmTerminateOverlay, EmTerminatedScreen,
});
