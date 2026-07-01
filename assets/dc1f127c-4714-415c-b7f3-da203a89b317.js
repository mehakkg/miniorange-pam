// Break-Glass — emergency access. Global store + trigger modal + active monitor + post-incident review + config.
// Deep purple (#7B3EA8) marks every break-glass surface. pamToast (global) is used for feedback.

const BG = "#7B3EA8";
const bgSoft = "color-mix(in oklch, #7B3EA8 13%, transparent)";
const bgSoftStrong = "color-mix(in oklch, #7B3EA8 20%, transparent)";

// =========================================================
// STORE
// =========================================================
(function () {
  const listeners = new Set();
  const store = {
    config: {
      initiators: { admin: true, operator: false, custom: false },
      operatorTags: [],
      recipients: "any",            // any | roles | roster
      defaultHrs: 4,
      maxHrs: 24,
      extensionAllowed: true,
      maxExtensions: 1,
      autoRevoke: false,
      requireJustification: true,
      minChars: 50,
      requireTicket: false,
      ticketLabel: "PagerDuty incident #",
      requireManagerNotify: false,
      escalateDays: 3,
      resourceScope: "all",         // all | tags | specific
    },
    active: null,
    open: null,                     // 'trigger' | 'monitor'
    reviewOpen: null,
    reviews: [
      { id: "BG-2042", recipient: "Rohan Mehta", initiator: "Arjun Bansal", resource: "ledger-mongo-cluster", severity: "P1", started: "May 14, 2026 · 00:12", ended: "May 14, 2026 · 02:38", duration: "2h 26m", justification: "P0 incident — replica lag >120s, customer-facing writes failing. Needed emergency DB access to force resync.", ticket: "PD-8841", status: "pending", credential: "ledger-mongo-admin", rotated: false, commands: 47 },
      { id: "BG-2039", recipient: "Priya Iyer", initiator: "Arjun Bansal", resource: "oracle-reporting", severity: "P2", started: "May 11, 2026 · 22:04", ended: "May 11, 2026 · 23:30", duration: "1h 26m", justification: "Reporting pipeline stalled before quarter-close; emergency access to clear locked sessions.", ticket: "PD-8790", status: "reviewed", reviewedBy: "Dana Whitley", reviewedOn: "May 12, 2026", outcome: "appropriate", credential: "oracle-dba-01", rotated: true, commands: 23 },
      { id: "BG-2035", recipient: "Marcus Chen", initiator: "Arjun Bansal", resource: "auth-server-01", severity: "P1", started: "May 03, 2026 · 03:48", ended: "May 03, 2026 · 05:06", duration: "1h 18m", justification: "Auth service down org-wide, SSO failing. Emergency SSH to restart and inspect.", ticket: "PD-8702", status: "escalated", reviewedBy: "Dana Whitley", reviewedOn: "May 04, 2026", outcome: "escalated", escalationNote: "Destructive command observed (rm on log dir). Forwarded to security review board.", credential: "linux-ssh-admin", rotated: true, commands: 61 },
    ],
    get: () => store,
    emit: () => listeners.forEach(fn => fn()),
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    openTrigger: () => { store.open = "trigger"; store.emit(); },
    openMonitor: () => { store.open = "monitor"; store.emit(); },
    close: () => { store.open = null; store.emit(); },
    grant: (session) => { store.active = { ...session, id: "BG-" + Math.floor(2050 + Math.random() * 900), grantedAt: Date.now() }; store.open = "monitor"; store.emit(); },
    extend: (hrs) => { if (store.active) { store.active.expiresHrs = (store.active.expiresHrs || 0) + hrs; store.active.extended = true; store.emit(); } },
    endSession: () => {
      if (!store.active) return;
      const a = store.active;
      const rev = { id: a.id, recipient: a.recipient, initiator: a.initiator || "Arjun Bansal", resource: a.resource, severity: a.severity, started: "just now", ended: "just now", duration: "—", justification: a.justification, ticket: a.ticket, status: "pending", credential: a.credential, rotated: false, commands: a.commands || 0 };
      store.reviews = [rev, ...store.reviews];
      store.active = null; store.open = null; store.reviewOpen = rev;
      store.emit();
    },
    openReview: (rev) => { store.reviewOpen = rev; store.emit(); },
    closeReview: () => { store.reviewOpen = null; store.emit(); },
    submitReview: (id, outcome, note) => {
      store.reviews = store.reviews.map(r => r.id === id ? { ...r, status: outcome === "escalated" ? "escalated" : "reviewed", outcome, reviewedBy: "Arjun Bansal", reviewedOn: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }), escalationNote: outcome === "escalated" ? note : undefined, rotated: true } : r);
      store.reviewOpen = null; store.emit();
    },
  };
  window.bgStore = store;
  window.useBreakGlass = function () {
    const [, force] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => store.subscribe(force), []);
    return store;
  };
})();

const BGBadge = ({ children = "Break-glass" }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, background: BG, color: "#fff", font: "600 11px/1.5 var(--font-sans)" }}>⚡ {children}</span>
);
const SeverityBadge = ({ level }) => {
  const m = { P1: { fg: "var(--danger-fg)", bg: "var(--danger-soft)", l: "P1 Critical" }, P2: { fg: "var(--warning-fg)", bg: "var(--warning-soft)", l: "P2 High" }, P3: { fg: "var(--brand-fg)", bg: "var(--brand-soft)", l: "P3 Medium" } }[level] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)", l: level };
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "600 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.l}</span>;
};
const BGReviewStatus = ({ status }) => {
  const m = { pending: { fg: "var(--warning-fg)", bg: "var(--warning-soft)", l: "Pending Review" }, reviewed: { fg: "var(--success-fg)", bg: "var(--success-soft)", l: "Reviewed" }, escalated: { fg: "var(--danger-fg)", bg: "var(--danger-soft)", l: "Escalated" } }[status] || {};
  return <span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.5 var(--font-sans)", background: m.bg, color: m.fg }}>{m.l}</span>;
};

// =========================================================
// TRIGGER MODAL — full-screen, multi-step emergency flow
// =========================================================
const BGTriggerModal = () => {
  const cfg = window.bgStore.config;
  const [step, setStep] = React.useState(1); // 1 resource+severity, 2 recipient, 3 justify, 4 mfa, 5 granted
  const [resource, setResource] = React.useState(null);
  const [severity, setSeverity] = React.useState("P1");
  const [recipient, setRecipient] = React.useState(null);
  const [just, setJust] = React.useState("");
  const [ticket, setTicket] = React.useState("");
  const [duration, setDuration] = React.useState(cfg.defaultHrs);
  const [resQ, setResQ] = React.useState("");
  const [recQ, setRecQ] = React.useState("");
  const [mfaState, setMfaState] = React.useState("idle"); // idle | verifying | done

  const resources = (window.SEED_RESOURCES || [{ name: "ledger-mongo-cluster", host: "10.0.4.12", env: "production", type: "database" }, { name: "auth-server-01", host: "10.0.1.4", env: "production", type: "server" }, { name: "oracle-reporting", host: "10.0.1.89", env: "production", type: "database" }, { name: "k8s-control-plane-aws", host: "10.42.51.4", env: "production", type: "server" }]);
  const people = ["Rohan Mehta", "Priya Iyer", "Marcus Chen", "Aditya Kulkarni", "Olivia Brookes"];
  const cred = resource ? (resource.name.includes("mongo") ? "ledger-mongo-admin" : resource.name.includes("oracle") ? "oracle-dba-01" : resource.name.includes("auth") ? "linux-ssh-admin" : "k8s-cluster-admin") : "";

  const close = () => window.bgStore.close();
  const justOk = !cfg.requireJustification || just.trim().length >= cfg.minChars;
  const ticketOk = !cfg.requireTicket || ticket.trim().length > 0;

  const startMfa = () => { setMfaState("verifying"); setTimeout(() => setMfaState("done"), 1700); };
  const grant = () => {
    window.bgStore.grant({ recipient, resource: resource.name, resourceHost: resource.host, severity, justification: just, ticket: ticket || "—", durationHrs: duration, expiresHrs: duration, credential: cred, initiator: "Arjun Bansal", commands: 0 });
    window.pamToast(`Break-glass granted — ${recipient} → ${resource.name}`, "info");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,10,25,0.78)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 720, maxWidth: "96vw", maxHeight: "92vh", display: "flex", flexDirection: "column", background: "var(--bg-app)", borderRadius: 14, border: `1px solid ${BG}`, boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${bgSoft}`, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", background: BG, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 20 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 17px/1.2 var(--font-sans)" }}>Declare Break-Glass Emergency</div>
            <div style={{ font: "400 12px/1.4 var(--font-sans)", opacity: 0.85, marginTop: 2 }}>Emergency access bypasses normal approval. Every session is recorded, time-limited, and post-reviewed.</div>
          </div>
          {step < 5 && <button onClick={close} style={{ background: "rgba(255,255,255,0.16)", border: "none", color: "#fff", width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 15 }}>✕</button>}
        </div>

        {/* Step indicator */}
        {step < 5 && (
          <div style={{ display: "flex", alignItems: "center", padding: "12px 24px", gap: 8, borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}>
            {["Resource", "Recipient", "Justification", "Verify"].map((s, i) => {
              const done = step > i + 1, active = step === i + 1;
              return <React.Fragment key={s}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? BG : active ? bgSoftStrong : "var(--bg-surface-2)", color: done ? "#fff" : active ? BG : "var(--fg-4)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 10.5px/1 var(--font-sans)", border: active ? `1px solid ${BG}` : "none" }}>{done ? "✓" : i + 1}</div>
                  <span style={{ font: `${active ? 600 : 500} 12px/1 var(--font-sans)`, color: active ? "var(--fg-1)" : "var(--fg-4)" }}>{s}</span>
                </div>
                {i < 3 && <div style={{ flex: 1, height: 1, background: done ? BG : "var(--border)", maxWidth: 40 }}/>}
              </React.Fragment>;
            })}
          </div>
        )}

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {/* STEP 1 — Resource + severity */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Which resource needs emergency access?" required>
                <input className="input" autoFocus value={resQ} onChange={e => setResQ(e.target.value)} placeholder="Search critical resources…"/>
                <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                  {resources.filter(r => r.name.toLowerCase().includes(resQ.toLowerCase())).map(r => (
                    <button key={r.name} onClick={() => setResource(r)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: resource?.name === r.name ? bgSoft : "transparent", cursor: "pointer", textAlign: "left" }}>
                      <Icon name={r.type === "database" ? "database" : "server"} size={14} color="var(--fg-3)"/>
                      <div style={{ flex: 1 }}>
                        <div className="t-mono" style={{ fontSize: 12.5, fontWeight: 500, color: "var(--fg-1)" }}>{r.name}</div>
                        <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.host} · {r.env}</div>
                      </div>
                      {resource?.name === r.name && <Icon name="check" size={14} color={BG}/>}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Emergency severity" required>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["P1", "P1 Critical", "var(--danger-fg)"], ["P2", "P2 High", "var(--warning-fg)"], ["P3", "P3 Medium", "var(--brand-fg)"]].map(([v, l, c]) => (
                    <button key={v} onClick={() => setSeverity(v)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${severity === v ? c : "var(--border)"}`, background: severity === v ? `color-mix(in oklch, ${c} 12%, transparent)` : "var(--bg-surface)", color: severity === v ? c : "var(--fg-2)", font: `${severity === v ? 600 : 500} 13px/1.3 var(--font-sans)`, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* STEP 2 — Recipient */}
          {step === 2 && (
            <Field label="Who needs the access?" required hint="Select the engineer who will use this emergency access.">
              <input className="input" autoFocus value={recQ} onChange={e => setRecQ(e.target.value)} placeholder="Search users…"/>
              <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
                {people.filter(p => p.toLowerCase().includes(recQ.toLowerCase())).map(p => (
                  <button key={p} onClick={() => setRecipient(p)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", border: "none", borderBottom: "1px solid var(--border-subtle)", background: recipient === p ? bgSoft : "transparent", cursor: "pointer", textAlign: "left" }}>
                    <Avatar name={p} size={28}/>
                    <span style={{ flex: 1, font: "500 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>{p}</span>
                    {recipient === p && <Icon name="check" size={14} color={BG}/>}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {/* STEP 3 — Justification */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Field label="Emergency justification" required hint={`Minimum ${cfg.minChars} characters. This is permanently recorded and reviewed.`}>
                <textarea className="input" autoFocus rows={4} value={just} onChange={e => setJust(e.target.value)} placeholder="Describe the emergency and why normal approval cannot be used…"/>
                <div style={{ marginTop: 4, font: "400 11.5px/1 var(--font-sans)", color: just.length >= cfg.minChars ? "var(--success-fg)" : "var(--fg-4)" }}>{just.length} / {cfg.minChars} characters</div>
              </Field>
              {cfg.requireTicket && (
                <Field label={cfg.ticketLabel} required>
                  <input className="input" value={ticket} onChange={e => setTicket(e.target.value)} placeholder="e.g. PD-8841"/>
                </Field>
              )}
              <Field label="Access duration" hint={`Default ${cfg.defaultHrs}h · maximum ${cfg.maxHrs}h.`}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="input" type="number" min={1} max={cfg.maxHrs} value={duration} onChange={e => setDuration(Math.min(cfg.maxHrs, +e.target.value))} style={{ width: 100 }}/>
                  <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--fg-3)" }}>hours</span>
                </div>
              </Field>
            </div>
          )}

          {/* STEP 4 — MFA re-verify */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: 14, background: bgSoft, borderRadius: 8, borderLeft: `3px solid ${BG}` }}>
                <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 8 }}>Confirm the emergency grant</div>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 7, font: "400 12.5px/1.5 var(--font-sans)" }}>
                  <span style={{ color: "var(--fg-4)" }}>Recipient</span><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{recipient}</span>
                  <span style={{ color: "var(--fg-4)" }}>Resource</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>{resource?.name}</span>
                  <span style={{ color: "var(--fg-4)" }}>Severity</span><span><SeverityBadge level={severity}/></span>
                  <span style={{ color: "var(--fg-4)" }}>Credential</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>{cred}</span>
                  <span style={{ color: "var(--fg-4)" }}>Duration</span><span style={{ color: "var(--fg-1)" }}>{duration} hours</span>
                </div>
              </div>
              <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>🔒 MFA re-verification required</div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 14 }}>Break-glass requires hardware-key verification before access is granted. This cannot be skipped.</div>
                {mfaState === "idle" && <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} onClick={startMfa}><Icon name="key" size={13}/> Tap hardware key to verify</button>}
                {mfaState === "verifying" && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "500 13px/1 var(--font-sans)", color: BG }}><Spinner size={14}/> Verifying hardware key…</div>}
                {mfaState === "done" && <div style={{ display: "inline-flex", alignItems: "center", gap: 8, font: "600 13px/1 var(--font-sans)", color: "var(--success-fg)" }}>✓ MFA verified</div>}
              </div>
              <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 8, font: "400 11.5px/1.6 var(--font-sans)", color: "var(--fg-3)" }}>
                On grant, the following are <strong style={{ color: "var(--fg-2)" }}>mandatory and automatic</strong>: session recording · keystroke logging · post-incident review · credential rotation within 24h of session end.
              </div>
            </div>
          )}

          {/* STEP 5 — Granted */}
          {step === 5 && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: bgSoft, color: BG, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 12 }}>⚡</div>
              <div style={{ font: "700 18px/1.2 var(--font-sans)", color: "var(--fg-1)", marginBottom: 6 }}>Break-glass access granted</div>
              <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", maxWidth: 440, margin: "0 auto 18px" }}><strong style={{ color: "var(--fg-1)" }}>{recipient}</strong> now has emergency access to <span className="t-mono">{resource?.name}</span> for {duration} hours. The session is being recorded.</div>
              <div className="card" style={{ padding: 14, textAlign: "left", maxWidth: 480, margin: "0 auto", background: "var(--bg-surface-2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 7, font: "400 12.5px/1.5 var(--font-sans)" }}>
                  <span style={{ color: "var(--fg-4)" }}>Recording</span><span style={{ color: "var(--success-fg)" }}>● Active (mandatory)</span>
                  <span style={{ color: "var(--fg-4)" }}>Post-review</span><span style={{ color: "var(--warning-fg)" }}>Required on session end</span>
                  <span style={{ color: "var(--fg-4)" }}>Credential rotation</span><span style={{ color: "var(--fg-2)" }}>Scheduled within 24h of end</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, alignItems: "center", background: "var(--bg-surface)" }}>
          {step < 5 && <button className="btn btn-ghost" onClick={close}>Cancel</button>}
          <div style={{ flex: 1 }}/>
          {step > 1 && step < 5 && <button className="btn" onClick={() => setStep(step - 1)}>← Back</button>}
          {step === 1 && <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} disabled={!resource} onClick={() => setStep(2)}>Next →</button>}
          {step === 2 && <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} disabled={!recipient} onClick={() => setStep(3)}>Next →</button>}
          {step === 3 && <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} disabled={!justOk || !ticketOk} onClick={() => setStep(4)}>Next →</button>}
          {step === 4 && <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} disabled={mfaState !== "done"} onClick={() => { grant(); setStep(5); }}>⚡ Grant emergency access</button>}
          {step === 5 && <>
            <button className="btn btn-ghost" onClick={close}>Close</button>
            <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} onClick={() => window.bgStore.openMonitor()}>Monitor session →</button>
          </>}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ACTIVE MONITOR PANEL
// =========================================================
const BGMonitorPanel = () => {
  const a = window.bgStore.active;
  const cfg = window.bgStore.config;
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  if (!a) return null;
  const remaining = (a.expiresHrs || a.durationHrs) + "h 00m";
  return (
    <>
      <div onClick={() => window.bgStore.close()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "var(--bg-app)", borderLeft: `1px solid ${BG}`, zIndex: 41, display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ padding: "16px 20px", background: bgSoft, borderBottom: `1px solid ${BG}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div style={{ flex: 1 }}>
            <div style={{ font: "700 15px/1.2 var(--font-sans)", color: BG }}>Active Break-Glass Session</div>
            <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{a.id} · {a.recipient}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => window.bgStore.close()}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Countdown */}
          <div style={{ padding: 16, border: `1px solid ${BG}`, borderRadius: 10, background: bgSoft, textAlign: "center" }}>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>Time remaining</div>
            <div style={{ font: "700 32px/1.1 var(--font-mono)", color: BG, marginTop: 6 }}>{remaining}</div>
            <div style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Expires automatically · {a.durationHrs}h window{a.extended ? " (extended)" : ""}</div>
          </div>

          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Session</div>
            <BGRow k="Recipient">{a.recipient}</BGRow>
            <BGRow k="Resource"><span className="t-mono">{a.resource}</span></BGRow>
            <BGRow k="Severity"><SeverityBadge level={a.severity}/></BGRow>
            <BGRow k="Credential"><span className="t-mono">{a.credential}</span></BGRow>
            <BGRow k="Ticket">{a.ticket}</BGRow>
            <BGRow k="Commands run">{a.commands || 0}</BGRow>
          </div>

          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Justification</div>
            <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 8, font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{a.justification}</div>
          </div>

          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Mandatory controls (active)</div>
            {[["Session recording", "Recording now"], ["Keystroke logging", "Capturing"], ["MFA re-verification", "Verified at grant"], ["Post-incident review", "Required on end"], ["Credential rotation", "Within 24h of end"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", font: "400 12.5px/1.4 var(--font-sans)" }}>
                <span style={{ color: "var(--success-fg)" }}>🔒</span>
                <span style={{ flex: 1, color: "var(--fg-1)" }}>{k}</span>
                <span style={{ color: "var(--success-fg)", font: "500 11.5px/1 var(--font-sans)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn" onClick={() => window.pamToast("Opening live session view…", "info")}><Icon name="eye" size={12}/> Watch live</button>
          {cfg.extensionAllowed && !a.extended && <button className="btn" onClick={() => { window.bgStore.extend(2); window.pamToast("Access extended by 2 hours"); }}>Extend +2h</button>}
          <div style={{ flex: 1 }}/>
          <button className="btn" style={{ background: BG, color: "#fff", borderColor: BG }} onClick={() => setConfirmEnd(true)}>End session</button>
        </div>
      </aside>

      {confirmEnd && (
        <ConfirmModal title={`End break-glass session for ${a.recipient}?`}
          body="The session will end immediately and the mandatory post-incident review will open. The credential used will be scheduled for rotation within 24 hours."
          confirmLabel="End & start review"
          onConfirm={() => { window.bgStore.endSession(); window.pamToast("Session ended — review required · credential rotation scheduled", "info"); }}
          onClose={() => setConfirmEnd(false)}/>
      )}
    </>
  );
};
const BGRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 12, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

// =========================================================
// POST-INCIDENT REVIEW MODAL
// =========================================================
const BGReviewModal = () => {
  const r = window.bgStore.reviewOpen;
  const [outcome, setOutcome] = React.useState(r && r.outcome ? r.outcome : "");
  const [note, setNote] = React.useState(r && r.escalationNote ? r.escalationNote : "");
  const [rotated, setRotated] = React.useState(r ? !!r.rotated : false);
  React.useEffect(() => { if (r) { setOutcome(r.outcome || ""); setNote(r.escalationNote || ""); setRotated(!!r.rotated); } }, [r && r.id]);
  if (!r) return null;
  const done = r.status !== "pending";
  const canSubmit = outcome && (outcome !== "escalated" || note.trim()) && rotated;
  return (
    <>
      <div onClick={() => window.bgStore.closeReview()} style={{ position: "fixed", inset: 0, background: "rgba(15,10,25,0.5)", zIndex: 120 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, maxWidth: "94vw", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 121, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <BGBadge/>
          <div style={{ flex: 1, font: "700 16px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Post-incident review — {r.id}</div>
          <button className="btn btn-ghost btn-icon" onClick={() => window.bgStore.closeReview()}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 14, background: "var(--bg-surface-2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, font: "400 12.5px/1.6 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-4)" }}>Recipient</span><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{r.recipient}</span>
              <span style={{ color: "var(--fg-4)" }}>Initiated by</span><span style={{ color: "var(--fg-1)" }}>{r.initiator}</span>
              <span style={{ color: "var(--fg-4)" }}>Resource</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>{r.resource}</span>
              <span style={{ color: "var(--fg-4)" }}>Severity</span><span><SeverityBadge level={r.severity}/></span>
              <span style={{ color: "var(--fg-4)" }}>Window</span><span style={{ color: "var(--fg-1)" }}>{r.started} → {r.ended} ({r.duration})</span>
              <span style={{ color: "var(--fg-4)" }}>Ticket</span><span style={{ color: "var(--fg-1)" }}>{r.ticket}</span>
              <span style={{ color: "var(--fg-4)" }}>Commands run</span><span style={{ color: "var(--fg-1)" }}>{r.commands}</span>
            </div>
          </div>
          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Stated justification</div>
            <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 8, font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>{r.justification}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={() => window.pamToast("Opening session recording…", "info")}><Icon name="video" size={11}/> View recording</button>
            <button className="btn btn-sm" onClick={() => window.pamToast("Opening keystroke log…", "info")}><Icon name="terminal" size={11}/> Keystroke log</button>
          </div>

          {!done ? (
            <>
              <div>
                <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Review decision</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["appropriate", "✓ Access was appropriate", "The emergency justified break-glass; no concerns.", "var(--success-fg)"], ["escalated", "⚑ Escalate for further review", "Something needs deeper investigation (unexpected commands, scope, timing).", "var(--danger-fg)"]].map(([v, l, d, c]) => (
                    <button key={v} onClick={() => setOutcome(v)} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "11px 14px", borderRadius: 8, border: `1px solid ${outcome === v ? c : "var(--border)"}`, background: outcome === v ? `color-mix(in oklch, ${c} 10%, transparent)` : "var(--bg-surface)", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ font: "600 13px/1.3 var(--font-sans)", color: outcome === v ? c : "var(--fg-1)" }}>{l}</span>
                      <span style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{d}</span>
                    </button>
                  ))}
                </div>
              </div>
              {outcome === "escalated" && (
                <Field label="Escalation note" required><textarea className="input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Describe what needs further review and to whom this is escalated…"/></Field>
              )}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer", font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)", padding: 12, background: rotated ? "var(--success-soft)" : "var(--warning-soft)", borderRadius: 8 }}>
                <input type="checkbox" checked={rotated} onChange={() => setRotated(v => !v)} style={{ accentColor: BG, marginTop: 1 }}/>
                <span>I confirm the credential <strong className="t-mono">{r.credential}</strong> has been rotated (mandatory after break-glass). {!rotated && <span style={{ color: "var(--warning-fg)" }}>The review cannot be completed until rotation is confirmed.</span>}</span>
              </label>
            </>
          ) : (
            <div style={{ padding: 14, background: r.outcome === "escalated" ? "var(--danger-soft)" : "var(--success-soft)", borderRadius: 8, font: "400 12.5px/1.6 var(--font-sans)", color: r.outcome === "escalated" ? "var(--danger-fg)" : "var(--success-fg)" }}>
              <strong>{r.outcome === "escalated" ? "Escalated" : "Reviewed — appropriate"}</strong> by {r.reviewedBy} on {r.reviewedOn}. Credential rotated: {r.rotated ? "✓ Yes" : "No"}.
              {r.escalationNote && <div style={{ marginTop: 6 }}>{r.escalationNote}</div>}
            </div>
          )}
        </div>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={() => window.bgStore.closeReview()}>{done ? "Close" : "Cancel"}</button>
          {!done && <button className="btn" style={canSubmit ? { background: BG, color: "#fff", borderColor: BG } : { opacity: 0.5, cursor: "not-allowed" }} disabled={!canSubmit} onClick={() => { window.bgStore.submitReview(r.id, outcome, note); window.pamToast(outcome === "escalated" ? "Break-glass event escalated" : "Review completed — record closed"); }}>Complete review</button>}
        </div>
      </div>
    </>
  );
};

// =========================================================
// REVIEW LIST (Audit Portal surface)
// =========================================================
const BreakGlassReviewList = () => {
  const store = window.useBreakGlass();
  const reviews = store.reviews;
  const [filter, setFilter] = React.useState("all");
  const pending = reviews.filter(r => r.status === "pending").length;
  const shown = filter === "all" ? reviews : reviews.filter(r => r.status === filter);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="Break-Glass Review" description="Every emergency access event is recorded and requires post-incident review. Records cannot be closed without review and confirmed credential rotation."/>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Total events" value={reviews.length}/>
        <KPICard label="Pending review" value={pending} accent="var(--warning-fg)" active={filter === "pending"} onClick={() => setFilter(filter === "pending" ? "all" : "pending")}/>
        <KPICard label="Reviewed" value={reviews.filter(r => r.status === "reviewed").length} accent="var(--success-fg)" active={filter === "reviewed"} onClick={() => setFilter(filter === "reviewed" ? "all" : "reviewed")}/>
        <KPICard label="Escalated" value={reviews.filter(r => r.status === "escalated").length} accent="var(--danger-fg)" active={filter === "escalated"} onClick={() => setFilter(filter === "escalated" ? "all" : "escalated")}/>
      </div>
      {pending > 0 && (
        <div style={{ margin: "12px 24px 0", padding: 12, background: "var(--warning-soft)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, font: "400 12.5px/1.5 var(--font-sans)", color: "var(--warning-fg)" }}>
          <Icon name="alert-circle" size={14} color="var(--warning-fg)"/>
          <span style={{ flex: 1 }}><strong>{pending} break-glass event{pending > 1 ? "s" : ""}</strong> awaiting mandatory review. Records stay open until reviewed and credentials confirmed rotated.</span>
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto", marginTop: 12 }}>
        <table className="table">
          <thead><tr><th>Event</th><th>Recipient</th><th>Resource</th><th>Severity</th><th>Window</th><th>Credential rotated</th><th>Status</th><th></th></tr></thead>
          <tbody>{shown.map(r => (
            <tr key={r.id} onClick={() => window.bgStore.openReview(r)} style={{ cursor: "pointer", boxShadow: `inset 3px 0 0 ${BG}` }}>
              <td><span className="t-mono" style={{ fontSize: 12, color: BG, fontWeight: 600 }}>⚡ {r.id}</span></td>
              <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar name={r.recipient} size={22}/><span style={{ fontSize: 12.5 }}>{r.recipient}</span></div></td>
              <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{r.resource}</td>
              <td><SeverityBadge level={r.severity}/></td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{r.started}<div>{r.duration}</div></td>
              <td>{r.rotated ? <span style={{ color: "var(--success-fg)", fontSize: 12 }}>✓ Rotated</span> : <span style={{ color: "var(--warning-fg)", fontSize: 12 }}>Pending</span>}</td>
              <td><BGReviewStatus status={r.status}/></td>
              <td style={{ textAlign: "right" }}><button className="btn btn-sm" onClick={e => { e.stopPropagation(); window.bgStore.openReview(r); }}>{r.status === "pending" ? "Review" : "View"}</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================
// CONTROLLER — mounted once in app root; renders global modals
// =========================================================
const BreakGlassController = () => {
  const store = window.useBreakGlass();
  return (
    <>
      {store.open === "trigger" && <BGTriggerModal/>}
      {store.open === "monitor" && store.active && <BGMonitorPanel/>}
      {store.reviewOpen && <BGReviewModal/>}
    </>
  );
};

Object.assign(window, { BG_COLOR: BG, BGBadge, SeverityBadge, BGReviewStatus, BGTriggerModal, BGMonitorPanel, BGReviewModal, BreakGlassReviewList, BreakGlassController });
