// Break-Glass Dashboard — lifecycle surface between the header trigger flow
// and Settings → Break-Glass configuration. Three tabs: Active (live grants,
// intervene fast), Pending Review (mandatory post-incident reviews land here
// and cannot be ignored), Compliance Log (calm audit record).
//
// Phase 1: nav + shell + summary strip + tab bar + full Active tab.
// Phase 2: Pending Review tab + Incident Review Detail panel.
// Phase 3: Compliance Log + export panels.
//
// Extends window.bgStore (defined in the break-glass core file, loaded
// earlier) rather than owning its own store — the trigger flow, floating
// indicator, and this dashboard all see the same state.

const BGD = "#7B3EA8";
const bgdSoft = "color-mix(in oklch, #7B3EA8 12%, transparent)";

// =========================================================
// STORE EXTENSIONS — seeded dashboard data + lifecycle methods
// =========================================================
(function () {
  const store = window.bgStore;
  if (!store || store._dashInit) return;
  store._dashInit = true;
  const nowMs = Date.now();

  // Seeded active sessions. The REAL session created via the trigger flow
  // (store.active) is merged in by the Active tab at render time — these
  // exist so the dashboard demonstrates every countdown/risk state without
  // needing three live grants. Three rows cover: nominal purple, amber
  // approaching-expiry, red critical-expiry.
  store.dashActive = [
    { id: "BG-0147", severity: "P2", recipient: "Rohan Mehta",  role: "Backend Engineer", resource: "prod-db-primary", resourceType: "database", env: "Production", credential: "root-primary",   grantedBy: "Arjun Bansal", startedLabel: "02:49 AM", expiresAtMs: nowMs + (3 * 3600 + 42 * 60) * 1000, windowHrs: 6, commands: 34, risk: 91, riskCmd: "rm -rf detected at 02:47 AM", recording: true, rotation: "Queued", extensionsUsed: 0 },
    { id: "BG-0151", severity: "P1", recipient: "Priya Iyer",   role: "SRE",              resource: "auth-server-01",  resourceType: "server",   env: "Production", credential: "linux-ssh-admin", grantedBy: "Arjun Bansal", startedLabel: "09:12 AM", expiresAtMs: nowMs + 28 * 60 * 1000,               windowHrs: 4, commands: 12, risk: 22, riskCmd: null, recording: true, rotation: "Queued", extensionsUsed: 0 },
    { id: "BG-0152", severity: "P3", recipient: "Aditya Kulkarni", role: "Platform Eng",  resource: "dev-web-portal",  resourceType: "web",      env: "Staging",    credential: "deploy-svc",     grantedBy: "Dana Whitley", startedLabel: "10:40 AM", expiresAtMs: nowMs + 8 * 60 * 1000,                windowHrs: 2, commands: 5,  risk: 0,  riskCmd: null, recording: true, rotation: "Queued", extensionsUsed: 1 },
  ];

  // Enrich the reviews list with dashboard-shaped seeds (spec's realistic
  // data). Fields the older seeds lack are tolerated by the tabs.
  store.reviews = [
    { id: "BG-0143", severity: "P3", recipient: "Priya Iyer",  initiator: "Arjun Bansal", resource: "auth-server-01",  endedMs: nowMs - 3 * 3600 * 1000,  started: "Today · 06:10 AM", ended: "Today · 07:02 AM", duration: "52 min", justification: "Auth service latency spike during failover drill; needed emergency access to restart the token signer.", ticket: "PD-9102", status: "pending", credential: "linux-ssh-admin", rotated: true,  rotationStatus: "completed",   commands: 18, assignedTo: "Arjun Bansal", ctxSubmitted: true,  reasonCategory: "Service degradation" },
    { id: "BG-0139", severity: "P2", recipient: "Marcus Chen", initiator: "Arjun Bansal", resource: "oracle-reporting", endedMs: nowMs - 4 * 86400000,   started: "4 days ago · 22:04", ended: "4 days ago · 23:31", duration: "1h 27m", justification: "Reporting pipeline stalled before quarter close; emergency access to clear locked sessions.", ticket: "PD-8790", status: "pending", credential: "oracle-dba-01", rotated: true, rotationStatus: "completed",   commands: 47, assignedTo: "Arjun Bansal", ctxSubmitted: false, reasonCategory: "Production outage" },
    { id: "BG-0138", severity: "P1", recipient: "Rohan Mehta", initiator: "Arjun Bansal", resource: "prod-db-primary", endedMs: nowMs - 67 * 86400000,  started: "May 4, 2026 · 02:50", ended: "May 4, 2026 · 03:12", duration: "22 min", justification: "P0 — replica lag >120s, customer writes failing.", ticket: "PD-8841", status: "reviewed", outcome: "appropriate", reviewedBy: "Arjun Bansal", reviewedOn: "May 4, 2026", credential: "root-primary", rotated: true, rotationStatus: "completed", rotatedAt: "May 4, 03:12 AM", commands: 31, assignedTo: "Arjun Bansal", ctxSubmitted: true, closedStatus: "closed" },
    { id: "BG-0135", severity: "P2", recipient: "Marcus Chen", initiator: "Arjun Bansal", resource: "oracle-reporting", endedMs: nowMs - 73 * 86400000, started: "Apr 28, 2026 · 14:02", ended: "Apr 28, 2026 · 14:49", duration: "47 min", justification: "Normal approval workflow too slow for the reporting freeze window.", ticket: "—", status: "reviewed", outcome: "appropriate", reviewedBy: "Arjun Bansal", reviewedOn: "Apr 29, 2026", credential: "oracle-dba-01", rotated: true, rotationStatus: "completed", commands: 23, assignedTo: "Arjun Bansal", ctxSubmitted: true, closedStatus: "flagged", policyFlag: "Normal approval workflow too slow", },
    { id: "BG-0131", severity: "P3", recipient: "Aditya Kulkarni", initiator: "Dana Whitley", resource: "dev-web-portal", endedMs: nowMs - 86 * 86400000, started: "Apr 15, 2026 · 11:20", ended: "Apr 15, 2026 · 11:32", duration: "12 min", justification: "Staging deploy wedged before customer demo.", ticket: "PD-8611", status: "reviewed", outcome: "appropriate", reviewedBy: "Priya Nair", reviewedOn: "Apr 19, 2026", credential: "deploy-svc", rotated: true, rotationStatus: "completed", commands: 9, assignedTo: "Priya Nair", ctxSubmitted: true, closedStatus: "escalated-closed" },
    ...store.reviews,
  ];

  // ── lifecycle methods ──────────────────────────────────
  store.dashPendingCount = () => store.reviews.filter(r => r.status === "pending").length;
  store.dashEscalatedCount = () => {
    const threshold = (store.config.escalateDays || 3) * 86400000;
    return store.reviews.filter(r => r.status === "pending" && r.endedMs && (Date.now() - r.endedMs) > threshold).length;
  };
  store.dashIsEscalated = (r) => {
    const threshold = (store.config.escalateDays || 3) * 86400000;
    return r.status === "pending" && r.endedMs && (Date.now() - r.endedMs) > threshold;
  };
  store.dashExtend = (id, hrs, reason) => {
    store.dashActive = store.dashActive.map(s => s.id === id ? { ...s, expiresAtMs: s.expiresAtMs + hrs * 3600000, extensionsUsed: (s.extensionsUsed || 0) + 1 } : s);
    store.emit();
  };
  // Terminate → session leaves Active, lands in Pending Review with rotation
  // already in progress (rotation is a mandatory control, never a button).
  store.dashTerminate = (id, reason) => {
    const s = store.dashActive.find(ss => ss.id === id);
    if (!s) return;
    store.dashActive = store.dashActive.filter(ss => ss.id !== id);
    store.reviews = [{
      id: s.id, severity: s.severity, recipient: s.recipient, initiator: s.grantedBy,
      resource: s.resource, endedMs: Date.now(),
      started: s.startedLabel, ended: "just now",
      duration: "—", justification: `Terminated by admin — ${reason}`,
      ticket: "—", status: "pending", credential: s.credential,
      rotated: false, rotationStatus: "in-progress",
      commands: s.commands, assignedTo: s.grantedBy, ctxSubmitted: false,
      terminatedReason: reason,
    }, ...store.reviews];
    store.emit();
  };
})();

// =========================================================
// SHARED BITS
// =========================================================
const BGDSeverity = ({ level, size = "md" }) => {
  const m = { P1: { fg: "var(--danger-fg)", bg: "var(--danger-soft)", l: "P1" }, P2: { fg: "var(--warning-fg)", bg: "var(--warning-soft)", l: "P2" }, P3: { fg: "var(--brand-fg)", bg: "var(--brand-soft)", l: "P3" } }[level] || { fg: "var(--fg-3)", bg: "var(--bg-surface-2)", l: level };
  const pad = size === "lg" ? "4px 10px" : "2px 8px";
  return <span style={{ padding: pad, borderRadius: 999, font: `700 ${size === "lg" ? 12 : 11}px/1.4 var(--font-sans)`, background: m.bg, color: m.fg }}>{m.l}</span>;
};

const BGDAvatarName = ({ name, sub }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <Avatar name={name} size={24}/>
    <div style={{ minWidth: 0 }}>
      <div style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)", whiteSpace: "nowrap" }}>{name}</div>
      {sub && <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{sub}</div>}
    </div>
  </div>
);

const bgdFmtCountdown = (msLeft) => {
  if (msLeft <= 0) return "Expired";
  const h = Math.floor(msLeft / 3600000), m = Math.floor((msLeft % 3600000) / 60000), s = Math.floor((msLeft % 60000) / 1000);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s` : `${m}m ${String(s).padStart(2, "0")}s`;
};
const bgdFmtRel = (ms) => {
  const d = Date.now() - ms;
  if (d < 3600000) return `${Math.max(1, Math.floor(d / 60000))} min ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} hours ago`;
  return `${Math.floor(d / 86400000)} days ago`;
};

// Countdown cell with the three-threshold escalation. Pulse on ≤10 min.
const BGDCountdownCell = ({ expiresAtMs }) => {
  const msLeft = expiresAtMs - Date.now();
  const expired = msLeft <= 0;
  const critical = !expired && msLeft <= 10 * 60000;
  const warning = !expired && !critical && msLeft <= 30 * 60000;
  return (
    <span className="t-mono" style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 4,
      font: `${critical || warning ? 700 : 500} 12px/1.3 var(--font-mono)`,
      color: expired ? "var(--fg-4)" : critical ? "var(--danger-fg)" : warning ? "var(--warning-fg)" : "var(--fg-1)",
      background: critical ? "var(--danger-soft)" : warning ? "var(--warning-soft)" : "transparent",
      animation: critical ? "bgPulse 1.6s infinite" : "none",
    }}>{bgdFmtCountdown(msLeft)}</span>
  );
};

// =========================================================
// SUMMARY STRIP — 4 cards, persistent across tabs
// =========================================================
const BGDSummaryStrip = ({ store, activeRows, onTab }) => {
  const pending = store.dashPendingCount();
  const escalated = store.dashEscalatedCount();
  const reviewed = store.reviews.filter(r => r.status !== "pending").length;
  const flagged = store.reviews.filter(r => r.closedStatus === "flagged").length;
  const rotFailed = store.reviews.filter(r => r.rotationStatus === "failed").length;
  const rotDone = store.reviews.filter(r => r.rotationStatus === "completed").length;
  const rotPct = (rotDone + rotFailed) === 0 ? 100 : Math.round((rotDone / (rotDone + rotFailed)) * 100);
  const recording = activeRows.filter(s => s.recording !== false).length;

  const Card = ({ label, value, sub, accent, onClick }) => (
    <button onClick={onClick} className="card" style={{ padding: 14, textAlign: "left", cursor: "pointer", borderTop: `3px solid ${accent || "var(--border)"}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      <span style={{ font: "700 26px/1.1 var(--font-sans)", color: "var(--fg-1)" }}>{value}</span>
      <span style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>{sub}</span>
    </button>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "14px 24px 0" }}>
      <Card label="Active right now" value={activeRows.length}
        sub={<span><span style={{ color: "var(--success-fg)" }}>{recording} recording ●</span>{activeRows.length - recording > 0 && <span style={{ color: "var(--danger-fg)" }}> / {activeRows.length - recording} not recording ○</span>}</span>}
        accent={activeRows.length > 0 ? BGD : undefined} onClick={() => onTab("active")}/>
      <Card label="Pending review" value={pending}
        sub={escalated > 0 ? <span style={{ color: "var(--danger-fg)", fontWeight: 600 }}>{escalated} escalated</span> : "None escalated"}
        accent={escalated > 0 ? "var(--danger-fg)" : pending > 0 ? "var(--warning-fg)" : undefined} onClick={() => onTab("pending")}/>
      <Card label="Reviewed (this period)" value={reviewed}
        sub={`${flagged} flagged for policy review`}
        accent="var(--success-fg)" onClick={() => onTab("log")}/>
      <Card label="Rotation status" value={rotPct + "%"}
        sub="Credentials rotated successfully this period"
        accent={rotFailed > 0 ? "var(--danger-fg)" : rotPct === 100 ? "var(--success-fg)" : "var(--warning-fg)"} onClick={() => onTab("log")}/>
    </div>
  );
};

// =========================================================
// TAB BAR — weight system: Active + Pending primary, Compliance utility
// =========================================================
const BGDTabBar = ({ tab, onTab, activeCount, pendingCount }) => {
  const TabBtn = ({ id, label, count, weight }) => {
    const active = tab === id;
    return (
      <button onClick={() => onTab(id)} style={{
        padding: "12px 16px", border: "none", background: "transparent",
        borderBottom: `2px solid ${active ? BGD : "transparent"}`,
        color: active ? BGD : weight === 3 ? "var(--fg-4)" : "var(--fg-2)",
        font: `${active ? 700 : weight === 3 ? 400 : 600} 13px/1 var(--font-sans)`,
        cursor: "pointer", marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 7,
      }}>
        {label}
        {count > 0 && (
          <span style={{ background: id === "pending" ? "var(--warning-fg)" : BGD, color: "#fff", font: "700 10px/1 var(--font-sans)", padding: "2px 6px", borderRadius: 999, minWidth: 16, textAlign: "center" }}>{count}</span>
        )}
      </button>
    );
  };
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 24px", borderBottom: "1px solid var(--border-subtle)", marginTop: 10 }}>
      <TabBtn id="active"  label="Active"          count={activeCount}  weight={1}/>
      <TabBtn id="pending" label="Pending Review"  count={pendingCount} weight={1}/>
      <span style={{ margin: "0 10px", color: "var(--border)", fontSize: 14 }}>|</span>
      <TabBtn id="log"     label="Compliance Log"  count={0}            weight={3}/>
    </div>
  );
};

// =========================================================
// EXTEND MODAL
// =========================================================
const BGDExtendModal = ({ session, onClose }) => {
  const cfg = window.bgStore.config;
  const [hrs, setHrs] = React.useState(1);
  const [reason, setReason] = React.useState("");
  const remaining = Math.max(0, (cfg.maxExtensions || 1) - (session.extensionsUsed || 0));
  const canExtend = remaining > 0 && reason.trim().length > 0;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 340, background: "rgba(15,23,42,0.5)", display: "flex", justifyContent: "flex-end" }}>
      <aside onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: "100vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, font: "700 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Extend emergency access</div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12.5px/1.6 var(--font-sans)", color: "var(--fg-2)" }}>
            <strong className="t-mono">{session.id}</strong> · {session.recipient} → <span className="t-mono">{session.resource}</span><br/>
            Current expiry: <strong><BGDCountdownCell expiresAtMs={session.expiresAtMs}/></strong>
          </div>
          {remaining === 0 ? (
            <div style={{ padding: 12, background: "var(--danger-soft)", color: "var(--danger-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
              ⚑ No extensions remaining — this session has used {session.extensionsUsed} of {cfg.maxExtensions || 1}. Policy caps extensions in Settings → Break-Glass. If more time is genuinely needed, terminate and issue a new grant.
            </div>
          ) : <>
            <Field label="Extend by (hours)" required>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4].map(h => (
                  <button key={h} onClick={() => setHrs(h)} style={{ flex: 1, padding: "10px 0", border: `1.5px solid ${hrs === h ? BGD : "var(--border)"}`, background: hrs === h ? bgdSoft : "#fff", color: hrs === h ? BGD : "var(--fg-2)", font: `${hrs === h ? 700 : 500} 13px/1 var(--font-sans)`, borderRadius: 6, cursor: "pointer" }}>+{h}h</button>
                ))}
              </div>
            </Field>
            <div className="t-tiny" style={{ color: "var(--fg-4)" }}>Extensions remaining: <strong style={{ color: "var(--fg-2)" }}>{remaining} of {cfg.maxExtensions || 1}</strong></div>
            <Field label="Extension reason" required>
              <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Replica resync still catching up; need to verify oplog before disconnecting."/>
            </Field>
          </>}
        </div>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          {remaining > 0 && (
            <button className="btn" disabled={!canExtend} onClick={() => { window.bgStore.dashExtend(session.id, hrs, reason); window.pamToast(`Access extended by ${hrs}h — ${session.id}`, "info"); onClose(); }}
              style={{ background: canExtend ? BGD : "var(--bg-surface-2)", color: canExtend ? "#fff" : "var(--fg-4)", borderColor: "transparent", fontWeight: 600 }}>
              Extend access
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

// =========================================================
// TERMINATE CONFIRMATION
// =========================================================
const BGD_TERMINATE_REASONS = ["Incident resolved", "Security concern", "Scope exceeded", "Admin error", "Other"];
const BGDTerminateModal = ({ session, onClose }) => {
  const [reason, setReason] = React.useState("");
  const [note, setNote] = React.useState("");
  const canTerminate = !!reason;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 340, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 500, maxWidth: "94vw", background: "#fff", borderRadius: 8, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ font: "700 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Terminate emergency access for {session.recipient} on <span className="t-mono">{session.resource}</span>?</div>
          <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>
            This immediately disconnects {session.recipient}. They cannot reconnect without a new grant.
          </div>
          <div style={{ marginTop: 10, padding: 10, background: bgdSoft, color: BGD, borderLeft: `3px solid ${BGD}`, borderRadius: "0 4px 4px 0", font: "500 12px/1.5 var(--font-sans)" }}>
            ⚡ Recording will end. Credential rotation will begin immediately.
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Reason" required>
              <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                <option value="">Select a reason…</option>
                {BGD_TERMINATE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Additional detail (optional)">
              <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Anything the reviewer should know…"/>
            </Field>
          </div>
        </div>
        <div style={{ padding: "14px 20px", marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
          <button className="btn" onClick={onClose}>Cancel — keep session active</button>
          <button className="btn" disabled={!canTerminate} onClick={() => {
            window.bgStore.dashTerminate(session.id, reason + (note ? ` — ${note}` : ""));
            window.pamToast(`${session.id} terminated — moved to Pending Review · rotation in progress`, "info");
            onClose();
          }} style={{ background: canTerminate ? "#C0392B" : "var(--bg-surface-2)", color: canTerminate ? "#fff" : "var(--fg-4)", borderColor: "transparent", fontWeight: 700 }}>
            Terminate and revoke
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// ACTIVE TAB
// =========================================================
const BGDActiveTab = ({ store, highlightId }) => {
  const [, tick] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => { const t = setInterval(tick, 1000); return () => clearInterval(t); }, []);
  const [q, setQ] = React.useState("");
  const [sev, setSev] = React.useState("all");
  const [extendFor, setExtendFor] = React.useState(null);
  const [terminateFor, setTerminateFor] = React.useState(null);
  const [paused, setPaused] = React.useState(false);

  // Merge the REAL trigger-flow session (if any) with the seeded rows.
  const liveRow = store.active ? {
    id: store.active.id, severity: store.active.severity || "P2",
    recipient: store.active.recipient, role: "—",
    resource: store.active.resource, resourceType: "database", env: "Production",
    credential: store.active.credential, grantedBy: store.active.initiator || "Arjun Bansal",
    startedLabel: new Date(store.active.grantedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    expiresAtMs: (store.active.grantedAt || Date.now()) + (store.active.expiresHrs || store.active.durationHrs || 4) * 3600000,
    windowHrs: store.active.durationHrs, commands: store.active.commands || 0,
    risk: Math.round(store.riskScore || 0), riskCmd: null, recording: true,
    rotation: "Queued", extensionsUsed: store.active.extended ? 1 : 0, isLive: true,
  } : null;
  let rows = [...(liveRow ? [liveRow] : []), ...store.dashActive];
  if (q) rows = rows.filter(r => `${r.recipient} ${r.resource} ${r.id}`.toLowerCase().includes(q.toLowerCase()));
  if (sev !== "all") rows = rows.filter(r => r.severity === sev);

  if (rows.length === 0 && !q && sev === "all") {
    // Healthy state — calm by design, not an error.
    return (
      <div style={{ padding: "70px 24px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: bgdSoft, color: BGD, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 14 }}>⚡</div>
        <div style={{ font: "700 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>No active break-glass sessions</div>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 6 }}>When emergency access is granted, it appears here in real time.</div>
      </div>
    );
  }

  const watchLive = (r) => {
    if (r.isLive) { window.bgStore.openMonitor(); return; }
    window.pamToast(`Opening live session stream — ${r.id}`, "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Toolbar + live indicator */}
      <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)" }}>
        <input className="input" placeholder="Search by user or resource…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 260 }}/>
        <select className="input" value={sev} onChange={e => setSev(e.target.value)} style={{ width: 110 }}>
          <option value="all">All severity</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
        </select>
        <div style={{ flex: 1 }}/>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "500 11.5px/1 var(--font-sans)", color: paused ? "var(--fg-4)" : "var(--success-fg)" }}>
          <span className={paused ? "" : "pulse-dot"} style={{ width: 7, height: 7, borderRadius: "50%", background: paused ? "var(--fg-4)" : "var(--success-fg)", display: "inline-block" }}/>
          {paused ? "Paused" : "Live"} · Last updated {new Date().toLocaleTimeString("en-US")}
          <button className="btn btn-ghost btn-sm" onClick={() => setPaused(p => !p)} style={{ fontSize: 11, padding: "2px 8px" }}>{paused ? "Resume ▶" : "Pause ∥"}</button>
        </span>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        <table className="table">
          <thead><tr>
            <th style={{ width: 46 }}>Sev</th><th>ID</th><th>Recipient</th><th>Resource</th><th>Credential</th><th>Granted by</th><th>Time remaining</th><th>Cmds</th><th>Risk</th><th>Recording</th><th>Rotation</th><th style={{ minWidth: 230 }}>Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(r => {
              const msLeft = r.expiresAtMs - Date.now();
              const flagged = (r.risk || 0) > 60;
              const highlighted = highlightId === r.id;
              return (
                <tr key={r.id} style={{
                  boxShadow: flagged ? `inset 3px 0 0 ${BGD}` : "none",
                  background: highlighted ? bgdSoft : msLeft <= 0 ? "var(--bg-surface-2)" : "transparent",
                }}>
                  <td><BGDSeverity level={r.severity} size="lg"/></td>
                  <td><span className="t-mono" style={{ font: "600 12px/1.3 var(--font-mono)", color: BGD }}>{r.id}</span>{r.isLive && <div className="t-tiny" style={{ color: "var(--success-fg)" }}>this session</div>}</td>
                  <td>
                    <BGDAvatarName name={r.recipient} sub={r.role}/>
                    {flagged && r.riskCmd && (
                      <button onClick={() => watchLive(r)} style={{ marginTop: 4, border: "none", background: "var(--danger-soft)", color: "var(--danger-fg)", font: "600 10.5px/1.4 var(--font-sans)", padding: "2px 7px", borderRadius: 4, cursor: "pointer" }}>
                        ⚑ {r.riskCmd}
                      </button>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name={r.resourceType === "database" ? "database" : r.resourceType === "web" ? "globe" : "server"} size={13} color="var(--fg-3)"/>
                      <div>
                        <div className="t-mono" style={{ font: "500 12px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.resource}</div>
                        <div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.env}</div>
                      </div>
                    </div>
                  </td>
                  <td className="t-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{r.credential}</td>
                  <td><BGDAvatarName name={r.grantedBy}/></td>
                  <td><BGDCountdownCell expiresAtMs={r.expiresAtMs}/></td>
                  <td style={{ font: "600 12.5px/1 var(--font-mono)", color: "var(--fg-2)" }}>{r.commands}</td>
                  <td>{(r.risk || 0) > 0
                    ? <span style={{ padding: "2px 8px", borderRadius: 999, font: "700 11px/1.4 var(--font-sans)", background: r.risk > 60 ? "var(--danger-soft)" : r.risk > 30 ? "var(--warning-soft)" : "var(--bg-surface-2)", color: r.risk > 60 ? "var(--danger-fg)" : r.risk > 30 ? "var(--warning-fg)" : "var(--fg-3)" }}>{r.risk}{r.risk > 60 ? " Critical" : ""}</span>
                    : <span style={{ color: "var(--fg-4)" }}>—</span>}
                  </td>
                  <td>{r.recording !== false
                    ? <span style={{ color: "var(--success-fg)", font: "500 11.5px/1.4 var(--font-sans)" }}>● Recording</span>
                    : <span style={{ color: "var(--danger-fg)", font: "600 11.5px/1.4 var(--font-sans)" }}>✗ ⚑ Fix</span>}
                  </td>
                  <td><span style={{ padding: "2px 8px", borderRadius: 999, font: "500 11px/1.4 var(--font-sans)", background: "var(--bg-surface-2)", color: "var(--fg-3)" }}>{r.rotation || "Queued"}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => watchLive(r)}><Icon name="eye" size={11}/> Watch live</button>
                      <button className="btn btn-sm" onClick={() => r.isLive ? window.bgStore.openExtend() : setExtendFor(r)}>Extend</button>
                      <button className="btn btn-sm" onClick={() => r.isLive ? window.bgStore.openTerminate() : setTerminateFor(r)} style={{ color: "#fff", background: "#C0392B", borderColor: "transparent", fontWeight: 600 }}>Terminate</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={12} style={{ textAlign: "center", padding: 30, color: "var(--fg-4)" }}>No sessions match the current filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {extendFor && <BGDExtendModal session={extendFor} onClose={() => setExtendFor(null)}/>}
      {terminateFor && <BGDTerminateModal session={terminateFor} onClose={() => setTerminateFor(null)}/>}
    </div>
  );
};

// =========================================================
// PLACEHOLDER TABS (Phases 2–3)
// =========================================================
const BGDPhasePlaceholder = ({ title, phase }) => (
  <div style={{ padding: "60px 24px", textAlign: "center" }}>
    <div style={{ font: "600 14px/1.3 var(--font-sans)", color: "var(--fg-2)" }}>{title}</div>
    <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>Arrives in Phase {phase} of this build.</div>
  </div>
);

// =========================================================
// DASHBOARD SHELL
// =========================================================
const BGDashboard = () => {
  const store = window.useBreakGlass();
  const [tab, setTab] = React.useState(window.__bgdLandTab || "active");
  const [range, setRange] = React.useState("30d");
  React.useEffect(() => { window.__bgdLandTab = null; }, []);

  const liveCount = (store.active ? 1 : 0) + store.dashActive.length;
  const activeRows = [...(store.active ? [{ recording: true }] : []), ...store.dashActive];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ font: "600 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Break-Glass</h1>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
            All emergency access is recorded, time-limited, and subject to mandatory post-incident review.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["7d", "30d", "90d", "custom"].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "6px 10px", border: `1px solid ${range === r ? BGD : "var(--border)"}`,
              background: range === r ? bgdSoft : "#fff", color: range === r ? BGD : "var(--fg-3)",
              font: `${range === r ? 600 : 400} 11.5px/1 var(--font-sans)`, borderRadius: 6, cursor: "pointer",
            }}>{r === "custom" ? "Custom" : `Last ${r.replace("d", " days")}`}</button>
          ))}
          <button className="btn" onClick={() => window.pamToast("Export compliance report arrives in Phase 3", "info")}>Export compliance report</button>
          <button className="btn" onClick={() => window.bgStore.openTrigger()} style={{ background: BGD, color: "#fff", borderColor: "transparent", fontWeight: 600 }}>
            ⚡ New break-glass
          </button>
        </div>
      </div>

      <BGDSummaryStrip store={store} activeRows={activeRows} onTab={setTab}/>
      <BGDTabBar tab={tab} onTab={setTab} activeCount={liveCount} pendingCount={store.dashPendingCount()}/>

      {tab === "active"  && <BGDActiveTab store={store} highlightId={window.__bgdHighlight}/>}
      {tab === "pending" && <BGDPhasePlaceholder title="Pending Review — post-incident reviews land here" phase={2}/>}
      {tab === "log"     && <BGDPhasePlaceholder title="Compliance Log — the complete audit record" phase={3}/>}
    </div>
  );
};

Object.assign(window, { BGDashboard, BGDActiveTab, BGDSummaryStrip, BGDTabBar, BGDExtendModal, BGDTerminateModal, BGDCountdownCell, BGDSeverity });
