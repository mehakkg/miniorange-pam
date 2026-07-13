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

// =========================================================
// FLOW CONTROLLER
// =========================================================
const EmergencyEntryFlow = ({ onExit }) => {
  const [screen, setScreen] = React.useState("login");   // login | mfa | transition | form(P2)
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: EM_BG, overflow: "auto" }}>
      {screen === "login" && <EmLoginScreen onAuthed={() => setScreen("mfa")} onReturn={onExit}/>}
      {screen === "mfa" && <EmMfaScreen onVerified={() => setScreen("transition")}/>}
      {screen === "transition" && <EmTransitionScreen onDone={() => setScreen("form")}/>}
      {screen === "form" && (
        <div style={{ minHeight: "100%", background: EM_BG, display: "flex", flexDirection: "column" }}>
          <EmHeaderStrip/>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 40, color: EM_PURPLE, marginBottom: 12 }}>⚡</div>
            <div style={{ font: "600 18px/1.3 var(--font-sans)", color: "#fff" }}>Authentication complete</div>
            <div style={{ font: "400 13.5px/1.6 var(--font-sans)", color: "#B8B4C0", marginTop: 8, maxWidth: 360 }}>
              The emergency access form (Screen 4), pre-grant review, grant progress, and mobile monitor arrive in Phase 2 of this build. You reached this point via the full auth + MFA + transition path.
            </div>
            <button onClick={onExit} style={{ ...emBtnPrimary, maxWidth: 240, marginTop: 20 }}>Exit emergency mode</button>
          </div>
          <EmConsequenceBar/>
        </div>
      )}
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
});
