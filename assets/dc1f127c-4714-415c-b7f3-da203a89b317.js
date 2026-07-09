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
    open: null,                     // 'trigger' | 'monitor' | 'extend' | 'terminate' | 'recipient-launch' | 'recipient-mfa' | 'post-session'
    reviewOpen: null,
    // Live-session data — populated when a grant occurs, drained on endSession.
    activity: [],                   // [{ ts, kind: 'query'|'command'|'access', text, risk, result }]
    audit: [],                      // [{ ts, kind, actor, message }]
    riskScore: 0,                   // 0–100, computed from activity
    pollTimer: null,                // handle for the 5s poll simulator
    // Recipient-side simulation. In production this would be its own user context;
    // here we let the admin flip into the recipient's view for demo purposes.
    recipientView: false,
    recipientMfaState: "idle",      // 'idle' | 'verifying' | 'done' | 'fail'
    // Post-session form (Screen 13c). Filled by the recipient when the session
    // ends and stored on the review record.
    postSession: { desc: "", commands: "", incidentResult: "", lessons: "" },
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
    openExtend: () => { store.open = "extend"; store.emit(); },
    openTerminate: () => { store.open = "terminate"; store.emit(); },
    openRecipientLaunch: () => { store.recipientView = true; store.open = "recipient-launch"; store.emit(); },
    openRecipientMfa: () => { store.open = "recipient-mfa"; store.emit(); },
    openPostSession: () => { store.open = "post-session"; store.emit(); },
    exitRecipientView: () => { store.recipientView = false; store.open = "monitor"; store.emit(); },
    close: () => { store.open = null; store.emit(); },
    // grant() records the active session but does NOT auto-open the monitor.
    // The caller controls what to show next (the trigger flow's "done" screen
    // has its own "Monitor live session →" button that explicitly opens it).
    grant: (session) => {
      const now = session.grantedAt || Date.now();
      store.active = { ...session, id: session.id || "BG-" + Math.floor(2050 + Math.random() * 900), grantedAt: now, commands: 0, extended: false };
      // Seed audit trail — every audit-worthy event since grant lands here.
      store.audit = [
        { ts: now,        kind: "grant",   actor: session.initiator || "Arjun Bansal", message: `Emergency access granted to ${session.recipient} (${(session.durationHrs || 4)}h)` },
        { ts: now + 1200, kind: "mfa",     actor: "system",      message: `MFA verified for ${session.initiator || "admin"}` },
        { ts: now + 2400, kind: "notify",  actor: "system",      message: `Recipient ${session.recipient} notified via email + in-app` },
        { ts: now + 3600, kind: "notify",  actor: "system",      message: `Security team notified · 2 recipients` },
      ];
      store.activity = [];
      store.riskScore = 0;
      store.postSession = { desc: "", commands: "", incidentResult: "", lessons: "" };
      store.recipientView = false;
      store.recipientMfaState = "idle";
      store.startPoll();
      store.emit();
    },
    extend: (hrs, reason) => {
      if (!store.active) return;
      const capped = Math.min(4, Math.max(1, hrs));
      store.active.expiresHrs = (store.active.expiresHrs || 0) + capped;
      store.active.extended = true;
      store.audit = [...store.audit, { ts: Date.now(), kind: "extend", actor: "Arjun Bansal", message: `Session extended by ${capped}h · reason: ${reason || "—"}` }];
      store.open = "monitor";
      store.emit();
    },
    logCommand: (text, risk) => {
      if (!store.active) return;
      const entry = { ts: Date.now(), kind: "command", text, risk: risk || "low", result: "ok" };
      store.activity = [...store.activity, entry];
      store.active.commands = (store.active.commands || 0) + 1;
      // Simple risk model: each medium adds 12, each high adds 22 (capped at 100).
      const bump = risk === "high" ? 22 : risk === "medium" ? 12 : 4;
      store.riskScore = Math.min(100, store.riskScore + bump);
      store.emit();
    },
    startPoll: () => {
      if (store.pollTimer) return;
      // Deterministic pool of commands cycled through, weighted so the
      // longer a session runs the more likely a medium/high-risk operation appears.
      // Simulates a live feed without needing a real backend.
      const script = [
        { text: "SHOW replica status on ledger-mongo-primary",                                risk: "low" },
        { text: "db.adminCommand({ replSetGetStatus: 1 })",                                    risk: "low" },
        { text: "systemctl status mongod",                                                     risk: "low" },
        { text: "tail -100 /var/log/mongodb/mongod.log",                                       risk: "low" },
        { text: "db.oplog.rs.find().sort({$natural:-1}).limit(5)",                             risk: "medium" },
        { text: "rs.stepDown(60)",                                                             risk: "high" },
        { text: "db.currentOp({secs_running: {$gt: 30}})",                                     risk: "medium" },
        { text: "kill -9 <pid> on long-running query",                                         risk: "high" },
        { text: "rs.reconfig(cfg, {force: true})",                                             risk: "high" },
        { text: "db.collection.stats()",                                                       risk: "low" },
      ];
      let i = 0;
      store.pollTimer = setInterval(() => {
        if (!store.active) return;
        const item = script[i % script.length]; i++;
        store.logCommand(item.text, item.risk);
      }, 5000);
    },
    stopPoll: () => {
      if (store.pollTimer) { clearInterval(store.pollTimer); store.pollTimer = null; }
    },
    endSession: (opts) => {
      if (!store.active) return;
      const a = store.active;
      store.stopPoll();
      const terminatedNote = opts?.terminatedReason ? ` · Terminated: ${opts.terminatedReason}` : "";
      const rev = {
        id: a.id, recipient: a.recipient, initiator: a.initiator || "Arjun Bansal",
        resource: a.resource, severity: a.severity,
        started: "just now", ended: "just now", duration: "—",
        justification: a.justification, ticket: a.ticket,
        status: "pending", credential: a.credential, rotated: false,
        commands: a.commands || 0,
        activity: store.activity,
        audit: [...store.audit, { ts: Date.now(), kind: opts?.terminatedReason ? "terminate" : "expire", actor: "Arjun Bansal", message: opts?.terminatedReason ? `Session terminated by admin${terminatedNote}` : "Session ended (window expired or user-ended)" }],
        riskScore: store.riskScore,
        postSession: null,             // filled in by openPostSession → savePostSession
      };
      store.reviews = [rev, ...store.reviews];
      store.active = null;
      store.activity = [];
      // Leave audit intact so the post-session form shows history.
      store.open = "post-session";
      store.reviewOpen = null;         // review comes AFTER post-session form
      store.pendingReview = rev;       // stash for post-session → review handoff
      store.emit();
    },
    savePostSession: (form) => {
      const rev = store.pendingReview;
      if (rev) {
        rev.postSession = form;
        store.reviews = store.reviews.map(r => r.id === rev.id ? rev : r);
      }
      store.postSession = form;
      store.pendingReview = null;
      store.open = null;
      store.reviewOpen = rev;
      store.audit = [];
      store.emit();
    },
    submitRecipientMfa: (success) => {
      store.recipientMfaState = success ? "done" : "fail";
      if (success) {
        store.audit = [...store.audit, { ts: Date.now(), kind: "connect", actor: store.active?.recipient || "recipient", message: "Recipient connected to session (MFA re-verified)" }];
      }
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
// TRIGGER FLOW — full-screen, no left nav, no X close button.
// Five sequential screens: MFA step-up → emergency form → pre-grant
// review (criticality-scaled confirmation) → grant progress checklist →
// grant confirmed with inline audit entry (or grant failed).
//
// Deliberately breaks visual consistency with the rest of PAM. Darker
// chrome, higher contrast, no navigation. The point is "you are not in
// routine operation."
// =========================================================

// Reason categories, confirmed against standard incident management practice.
const BG_REASON_CATEGORIES = [
  "Production outage",
  "Service degradation",
  "Security incident",
  "Data recovery",
  "Compliance requirement",
  "Vendor/third-party requirement",
  "Other",
];

// Severity → max duration cap (hours). Enforced on the form.
const BG_SEVERITY_MAX = { P1: 8, P2: 6, P3: 4 };

// Persistent consequence banner sits under the dark chrome strip on Screens
// 3–7. Red, non-dismissible. Same instance reused across screens so it reads
// as one continuous warning, not a decoration.
const BGConsequenceBanner = ({ children }) => (
  <div style={{ padding: "10px 24px", background: "#FCEBEB", borderLeft: "3px solid #C0392B", color: "#7A1B12", font: "500 12.5px/1.5 var(--font-sans)" }}>
    ⚡ {children}
  </div>
);

// Dark chrome header strip — near-black bar with the current screen's title.
const BGChromeHeader = ({ title }) => (
  <div style={{ padding: "14px 24px", background: "#1A1916", color: "#fff", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${BG}` }}>
    <span style={{ fontSize: 18 }}>⚡</span>
    <span style={{ font: "700 15px/1.2 var(--font-sans)", letterSpacing: 0.2 }}>{title}</span>
  </div>
);

// Screen 5 confirmation mechanism, scaled by resource criticality:
//   critical → typed confirmation (must match resource display name)
//   high     → checkbox
//   medium / low → nothing (button alone is enough)
// Returns { ready, node } — parent uses `ready` to enable the primary CTA.
const useBGConfirmation = (resource) => {
  const crit = (resource?.criticality || "medium").toLowerCase();
  const [typed, setTyped] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  if (crit === "critical") {
    const ready = typed.trim().toLowerCase() === (resource?.name || "").toLowerCase();
    return {
      ready,
      node: (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
            To confirm, type the resource name below:
          </div>
          <input className="input t-mono" autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={resource?.name}/>
          <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "#7A1B12" }}>
            A secondary admin will be notified in real time. They cannot block the grant.
          </div>
        </div>
      ),
    };
  }
  if (crit === "high") {
    return {
      ready: checked,
      node: (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 10, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-app)", cursor: "pointer" }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ marginTop: 2, accentColor: BG }}/>
          <span style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>
            I confirm I am granting emergency access to <strong>{resource?.name}</strong>.
          </span>
        </label>
      ),
    };
  }
  return { ready: true, node: null };
};

const BGTriggerModal = () => {
  const cfg = window.bgStore.config;
  // Screen order matches the spec exactly:
  //   "mfa"      — MFA step-up (must complete before the form appears)
  //   "form"     — Emergency access form
  //   "review"   — Pre-grant review with criticality-scaled confirmation
  //   "progress" — Grant in progress checklist
  //   "done"     — Grant confirmed with inline audit entry
  //   "failed"   — Grant failed state
  const [screen, setScreen] = React.useState("mfa");

  // MFA step-up state
  const [mfaCode, setMfaCode] = React.useState("");
  const [mfaAttempts, setMfaAttempts] = React.useState(3);
  const [mfaError, setMfaError] = React.useState(null);
  const [mfaVerifying, setMfaVerifying] = React.useState(false);

  // Form state
  const [severity, setSeverity] = React.useState(null);
  const [ticket, setTicket] = React.useState("");
  const [recipient, setRecipient] = React.useState(null);
  const [resource, setResource] = React.useState(null);
  const [credential, setCredential] = React.useState(null);
  const [reason, setReason] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [duration, setDuration] = React.useState(cfg.defaultHrs);

  // Grant-in-progress checklist state (each entry: "pending" | "done")
  const [progressSteps, setProgressSteps] = React.useState({});
  const [grantedRecord, setGrantedRecord] = React.useState(null);
  const [failReason, setFailReason] = React.useState(null);

  const cancel = () => window.bgStore.close();

  // People + resource catalogs — richer than the previous minimal seed so the
  // form's UX reads as realistic. Resource criticality drives the pre-grant
  // confirmation tier.
  const people = [
    { id: "u-rohan",  name: "Rohan Mehta",     role: "Operator",       email: "rohan.mehta@northwind.com",  lastLogin: "2 hours ago" },
    { id: "u-priya",  name: "Priya Iyer",      role: "Operator",       email: "priya.iyer@northwind.com",   lastLogin: "42 min ago" },
    { id: "u-marcus", name: "Marcus Chen",     role: "Operator",       email: "marcus.chen@northwind.com",  lastLogin: "yesterday" },
    { id: "u-aditya", name: "Aditya Kulkarni", role: "End User",       email: "aditya.k@northwind.com",     lastLogin: "3 days ago" },
    { id: "u-olivia", name: "Olivia Brookes",  role: "Operator",       email: "olivia.b@northwind.com",     lastLogin: "12 min ago" },
  ];
  const resources = [
    { name: "prod-db-primary",       host: "10.42.18.7:5432",  env: "production",  type: "database", criticality: "critical", activeSessions: 2, lastBG: "14 days ago · P2 · Arjun Bansal · Reviewed" },
    { name: "auth-server-01",         host: "auth01.kestrel.internal:22", env: "production", type: "server", criticality: "critical", activeSessions: 0, lastBG: "May 03 · P1 · Escalated" },
    { name: "ledger-mongo-cluster",   host: "10.42.18.22:27017", env: "production", type: "database", criticality: "high", activeSessions: 1, lastBG: "May 14 · P1 · Reviewed" },
    { name: "k8s-control-plane-aws",  host: "eks.us-east-1:443", env: "production", type: "cloud",   criticality: "critical", activeSessions: 0, lastBG: "Never" },
    { name: "data-warehouse-bastion", host: "10.42.99.4:22", env: "production", type: "server", criticality: "high", activeSessions: 0, lastBG: "Never" },
    { name: "oracle-reporting",       host: "10.0.1.89:1521", env: "production", type: "database", criticality: "high", activeSessions: 0, lastBG: "May 11 · P2 · Reviewed" },
  ];
  const credentialsFor = (r) => {
    if (!r) return [];
    if (r.type === "database" && r.name.includes("mongo")) return ["ledger-mongo-admin", "mongo-read"];
    if (r.type === "database") return ["root-primary", "dba-read", "backup-admin"];
    if (r.type === "server")   return ["root-primary", "linux-ssh-admin", "backup-agent"];
    if (r.type === "cloud")    return ["eks-admin-token", "eks-viewer"];
    return ["root-primary"];
  };

  // Duration cap enforced from severity.
  const durationMax = severity ? BG_SEVERITY_MAX[severity] : cfg.defaultHrs;
  React.useEffect(() => {
    if (severity && duration > BG_SEVERITY_MAX[severity]) setDuration(BG_SEVERITY_MAX[severity]);
  }, [severity]);

  // Compute the expiry timestamp shown live under the duration input.
  const expiryLabel = React.useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() + (parseInt(duration) || 0));
    return now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [duration]);

  // Existing-access check for the recipient (mock — looks fabricated).
  const recipientHasAccess = recipient && resource && recipient.name === "Rohan Mehta" && resource.name === "prod-db-primary";

  const formValid = severity && recipient && resource && credential && reason && description.trim().length >= cfg.minChars;

  // ── MFA step-up ────────────────────────────────────────────────
  // Auto-submit when all 6 digits are entered. Runs from state, not from
  // a click handler, so it always sees the fresh code rather than a stale
  // closure captured at input time.
  const submitMfaCode = (code) => {
    setMfaVerifying(true);
    setTimeout(() => {
      setMfaVerifying(false);
      // Any 6-digit code except literal "000000" verifies — 000000 exercises the failure path.
      if (code === "000000") {
        setMfaAttempts(a => {
          const left = a - 1;
          setMfaError(left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.` : "Locked out. Contact another admin to declare emergency access.");
          return left;
        });
        setMfaCode("");
      } else {
        setScreen("form");
        setMfaCode("");
        setMfaError(null);
      }
    }, 800);
  };
  React.useEffect(() => {
    if (screen === "mfa" && mfaCode.length === 6 && !mfaVerifying) submitMfaCode(mfaCode);
  }, [mfaCode, screen]);

  // ── Pre-grant review confirmation ──────────────────────────────
  const confirmation = useBGConfirmation(resource);

  // ── Grant flow ─────────────────────────────────────────────────
  const runGrant = () => {
    setScreen("progress");
    setProgressSteps({});
    const steps = ["auth", "bundle", "grant", "notify", "record", "audit"];
    steps.forEach((s, i) => setTimeout(() => setProgressSteps(prev => ({ ...prev, [s]: "done" })), 250 + i * 300));
    setTimeout(() => {
      // Deterministic simulated failure path: recipient="Aditya Kulkarni" fails.
      // Everything else succeeds.
      if (recipient?.name === "Aditya Kulkarni") {
        setFailReason("Recipient account is not in the eligible roles list for break-glass on this resource. Configuration review required.");
        setScreen("failed");
        return;
      }
      const record = {
        id: "BG-" + Math.floor(2050 + Math.random() * 900),
        recipient: recipient.name,
        recipientRole: recipient.role,
        resource: resource.name,
        resourceHost: resource.host,
        resourceType: resource.type,
        severity,
        credential,
        justification: description,
        reason,
        ticket: ticket || "—",
        message,
        durationHrs: duration,
        expiresHrs: duration,
        initiator: "Arjun Bansal",
        commands: 0,
        grantedAt: Date.now(),
      };
      window.bgStore.grant(record);
      setGrantedRecord({ ...record, id: window.bgStore.active?.id });
      setScreen("done");
    }, 250 + steps.length * 300 + 200);
  };

  // ── Full-screen shell (same chrome across every screen) ────────
  const Shell = ({ title, children, banner }) => (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", display: "flex", flexDirection: "column" }}>
      <BGChromeHeader title={title}/>
      {banner !== null && <BGConsequenceBanner>{banner || "All actions on this screen are permanently logged. This grant cannot be undone — only revoked."}</BGConsequenceBanner>}
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>{children}</div>
    </div>
  );

  // ── Screen 3 · MFA step-up ─────────────────────────────────────
  if (screen === "mfa") {
    return (
      <Shell title="Emergency Access — Identity Verification Required" banner="This session will be recorded, time-limited, and subject to mandatory post-incident review.">
        <div style={{ maxWidth: 480, margin: "60px auto 0", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ font: "700 22px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Verify your identity to continue</h1>
            <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>Break-glass access is irreversible once granted. We need to confirm it's you.</p>
          </div>

          <div>
            <div style={{ font: "600 12px/1.3 var(--font-sans)", color: "var(--fg-2)", marginBottom: 10 }}>Enter the 6-digit code from your authenticator app</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[0,1,2,3,4,5].map(i => (
                <input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={mfaCode[i] || ""}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                    const parent = e.target.parentElement;
                    setMfaCode(prev => (prev.slice(0, i) + v + prev.slice(i + 1)).slice(0, 6));
                    if (v && i < 5) parent.children[i + 1]?.focus();
                  }}
                  style={{
                    width: 48, height: 56, textAlign: "center",
                    font: "600 22px/1 var(--font-mono)",
                    border: `1px solid ${mfaError ? "var(--danger-fg)" : "var(--border)"}`,
                    borderRadius: 6, background: mfaVerifying ? "var(--bg-surface-2)" : "#fff",
                    color: "var(--fg-1)", outline: "none",
                  }}
                  disabled={mfaVerifying || mfaAttempts === 0}
                />
              ))}
            </div>
            {mfaError && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#FCEBEB", color: "#7A1B12", borderRadius: 4, font: "500 12.5px/1.4 var(--font-sans)" }}>
                ⚠ {mfaError}
              </div>
            )}
            {mfaVerifying && !mfaError && (
              <div style={{ marginTop: 12, textAlign: "center", font: "500 12px/1.4 var(--font-sans)", color: BG }}>
                <Spinner size={12}/> Verifying…
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <a href="#" onClick={e => e.preventDefault()} style={{ font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)", textDecoration: "underline" }}>Having trouble? Use backup code</a>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <a href="#" onClick={e => { e.preventDefault(); cancel(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>
              Cancel emergency access
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Screen 4 · Emergency access form ───────────────────────────
  if (screen === "form") {
    return (
      <Shell title="Emergency Access — Break-Glass Initiation">
        <div style={{ maxWidth: 640, margin: "24px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* SECTION: Emergency context */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Emergency context</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { v: "P1", label: "P1 — CRITICAL", sub: "System down · Revenue impact · Customer-facing failure", color: "#C0392B", icon: "alert-triangle" },
                { v: "P2", label: "P2 — HIGH",     sub: "Degraded performance · Security incident · Potential impact", color: "#B45309", icon: "alert-circle" },
                { v: "P3", label: "P3 — MEDIUM",   sub: "Internal issue · No direct customer impact", color: "var(--info-fg)", icon: "info" },
              ].map(s => {
                const sel = severity === s.v;
                return (
                  <button key={s.v} onClick={() => setSeverity(s.v)} style={{
                    padding: 14, border: `1.5px solid ${sel ? s.color : "var(--border)"}`,
                    background: sel ? `color-mix(in oklch, ${s.color} 8%, transparent)` : "#fff",
                    borderRadius: 8, cursor: "pointer", textAlign: "left",
                    display: "flex", flexDirection: "column", gap: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name={s.icon} size={14} color={sel ? s.color : "var(--fg-4)"}/>
                      <span style={{ font: "700 12px/1 var(--font-sans)", color: sel ? s.color : "var(--fg-1)", letterSpacing: 0.4 }}>{s.label}</span>
                    </div>
                    <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>{s.sub}</div>
                    <div style={{ marginTop: "auto", font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>Max {BG_SEVERITY_MAX[s.v]}h</div>
                  </button>
                );
              })}
            </div>

            <Field label={cfg.ticketLabel || "PagerDuty incident #"} hint="Reference number from your incident management system">
              <input className="input" value={ticket} onChange={e => setTicket(e.target.value)} placeholder="e.g. PD-4821"/>
              {ticket && (
                <div style={{ marginTop: 6, padding: "6px 10px", background: "var(--success-soft)", color: "var(--success-fg)", borderRadius: 4, font: "500 11.5px/1.4 var(--font-sans)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  ✓ Ticket found: DB connectivity issue — P2
                </div>
              )}
            </Field>
          </section>

          {/* SECTION: Recipient */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Recipient</div>
            <Field label="Who needs access?" required hint="One recipient at a time — break-glass is never bulk.">
              <select className="input" value={recipient?.id || ""} onChange={e => setRecipient(people.find(p => p.id === e.target.value))}>
                <option value="">Search users…</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name} · {p.role} · {p.email}</option>)}
              </select>
            </Field>
            {recipient && (
              <div style={{ marginTop: 10, padding: 12, border: "1px solid var(--border)", borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={recipient.name} size={32}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{recipient.name} · {recipient.role}</div>
                  <div className="t-tiny" style={{ color: "var(--fg-3)", marginTop: 2 }}>{recipient.email} · Last login: {recipient.lastLogin}</div>
                </div>
              </div>
            )}
            {recipientHasAccess && (
              <div style={{ marginTop: 10, padding: 12, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)" }}>
                ⚠ {recipient.name} already has active access to {resource?.name} (ends May 18, 8:00 AM). Verify break-glass is genuinely needed.
              </div>
            )}
          </section>

          {/* SECTION: Target resource */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Target resource</div>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="table">
                <thead><tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Criticality</th>
                  <th>Active</th>
                  <th></th>
                </tr></thead>
                <tbody>{resources.map(r => (
                  <tr key={r.name} onClick={() => { setResource(r); setCredential(credentialsFor(r)[0]); }} style={{ cursor: "pointer", background: resource?.name === r.name ? bgSoft : undefined }}>
                    <td><span className="t-mono" style={{ font: "500 12.5px/1.3 var(--font-sans)", color: BG }}>{r.name}</span></td>
                    <td><span className="badge">{r.type}</span></td>
                    <td><span style={{ font: "500 12px/1 var(--font-sans)", color: r.criticality === "critical" ? "var(--danger-fg)" : "var(--warning-fg)", textTransform: "capitalize" }}>{r.criticality}</span></td>
                    <td className="t-tiny" style={{ color: r.activeSessions > 0 ? "var(--success-fg)" : "var(--fg-4)" }}>{r.activeSessions} session{r.activeSessions === 1 ? "" : "s"}</td>
                    <td style={{ textAlign: "right" }}>{resource?.name === r.name && <Icon name="check" size={13} color={BG}/>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {resource && (
              <div style={{ marginTop: 12, padding: 14, borderLeft: `3px solid ${BG}`, background: bgSoft, borderRadius: "0 6px 6px 0" }}>
                <div style={{ font: "700 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>⚡ {resource.name}</div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
                  {resource.type} · {resource.host} · Environment: {resource.env} · Criticality: {resource.criticality}
                </div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>
                  Last break-glass: {resource.lastBG}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Field label="Credential to use" required>
                    <select className="input" value={credential || ""} onChange={e => setCredential(e.target.value)}>
                      {credentialsFor(resource).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  {credential === "root-primary" && (
                    <div style={{ marginTop: 6, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--warning-fg)" }}>
                      ⚠ root-primary is the highest privilege account. Consider a scoped credential if sufficient for this incident.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECTION: Access scope */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Access scope</div>
            <Field label="Access window" required>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input className="input" type="number" min={1} max={durationMax} value={duration} onChange={e => setDuration(Math.min(durationMax, Math.max(1, +e.target.value)))} style={{ width: 90 }}/>
                <span style={{ font: "400 13px/1 var(--font-sans)", color: "var(--fg-3)" }}>hours</span>
                <span style={{ marginLeft: "auto", font: "600 15px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>
                  Expires at {expiryLabel}
                </span>
              </div>
              {severity && (
                <div style={{ marginTop: 6, font: "500 11.5px/1.4 var(--font-sans)", color: duration > BG_SEVERITY_MAX[severity] ? "var(--danger-fg)" : "var(--fg-4)" }}>
                  Max for {severity}: {BG_SEVERITY_MAX[severity]} hours
                </div>
              )}
            </Field>
            {cfg.extensionAllowed && (
              <div style={{ marginTop: 8, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
                {cfg.maxExtensions} extension allowed — up to 4 additional hours
              </div>
            )}
          </section>

          {/* SECTION: Justification */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Justification</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Reason category" required>
                <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select reason…</option>
                  {BG_REASON_CATEGORIES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Emergency description" required>
                <textarea className="input" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what happened, when, the business impact, and why normal access workflows cannot be used right now."/>
                <div style={{ marginTop: 4, font: "400 11.5px/1 var(--font-sans)", color: description.length >= cfg.minChars ? "var(--success-fg)" : "var(--fg-4)" }}>
                  {description.length} / {cfg.minChars} minimum
                </div>
              </Field>
              <Field label="Message to recipient (optional)" hint="This appears in the recipient's notification.">
                <textarea className="input" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="e.g. 4 hours of emergency access. Document all commands in the post-incident review. Call me at +91-XXXXX for extension."/>
              </Field>
            </div>
          </section>

          {/* SECTION: Notifications preview */}
          <section>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Notifications preview</div>
            <div className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
                  <Avatar name="Aria Chen" size={22}/>
                  <span style={{ flex: 1 }}>Aria Chen — Security Admin Lead</span>
                  <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Email + In-app</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon name="people" size={11}/>
                  </div>
                  <span style={{ flex: 1 }}>Security Team</span>
                  <span className="t-tiny" style={{ color: "var(--fg-4)" }}>Email</span>
                </div>
              </div>
              <div style={{ marginTop: 8, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)" }}>
                2 people will be notified immediately when you submit.
              </div>
            </div>
          </section>

          {/* CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
            <button className="btn" disabled={!formValid} onClick={() => setScreen("review")} style={{ background: formValid ? BG : "var(--bg-surface-2)", color: formValid ? "#fff" : "var(--fg-4)", borderColor: "transparent", padding: "12px 20px", font: "700 13.5px/1 var(--font-sans)" }}>
              Review and grant access →
            </button>
            <a href="#" onClick={e => { e.preventDefault(); cancel(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-4)", textAlign: "center" }}>
              Cancel emergency request
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Screen 5 · Pre-grant review ────────────────────────────────
  if (screen === "review") {
    return (
      <Shell title="Emergency Access — Review Before Granting">
        <div style={{ maxWidth: 640, margin: "24px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h1 style={{ font: "700 18px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Review everything before committing.</h1>
            <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "4px 0 0" }}>This cannot be undone — only revoked.</p>
          </div>

          <div className="card" style={{ padding: 20, border: `2px solid ${BG}` }}>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Emergency summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 8, columnGap: 14, font: "400 12.5px/1.5 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-4)" }}>Severity</span><span><SeverityBadge level={severity}/></span>
              <span style={{ color: "var(--fg-4)" }}>Incident</span><span>{ticket || "—"} · {reason}</span>
              <span style={{ color: "var(--fg-4)" }}>Initiated by</span><span>Arjun Bansal (Security Admin)</span>
              <span style={{ color: "var(--fg-4)" }}>Recipient</span><span><strong style={{ color: "var(--fg-1)" }}>{recipient.name}</strong> ({recipient.role})</span>
              <span style={{ color: "var(--fg-4)" }}>Resource</span><span className="t-mono">{resource.name} · {resource.type} · <span style={{ color: resource.criticality === "critical" ? "var(--danger-fg)" : "var(--warning-fg)", textTransform: "capitalize" }}>{resource.criticality}</span></span>
              <span style={{ color: "var(--fg-4)" }}>Credential</span><span className="t-mono">{credential} <span style={{ color: "var(--fg-4)" }}>(non-viewable — injected by proxy)</span></span>
              <span style={{ color: "var(--fg-4)" }}>Access window</span><span>{duration} hours (expires at {expiryLabel})</span>
            </div>

            <div style={{ marginTop: 16, padding: 12, background: "var(--success-soft)", borderRadius: 4 }}>
              <div style={{ font: "600 11.5px/1 var(--font-sans)", color: "var(--success-fg)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Mandatory controls that will apply</div>
              <div style={{ font: "400 12px/1.7 var(--font-sans)", color: "var(--success-fg)" }}>
                ✓ MFA required when {recipient.name.split(" ")[0]} connects<br/>
                ✓ Full session recording (video + keystrokes)<br/>
                ✓ Post-incident review mandatory<br/>
                ✓ {credential} will be rotated within 24h
              </div>
            </div>

            {description && (
              <div style={{ marginTop: 14 }}>
                <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Justification</div>
                <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>"{description.slice(0, 240)}{description.length > 240 ? "…" : ""}"</div>
              </div>
            )}
          </div>

          {/* Confirmation mechanism — scaled by criticality */}
          {confirmation.node && (
            <div style={{ padding: 14, border: `1px solid ${BG}`, borderRadius: 6, background: bgSoft }}>
              {confirmation.node}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            <button
              className="btn"
              disabled={!confirmation.ready}
              onClick={runGrant}
              style={{
                background: confirmation.ready ? BG : "var(--bg-surface-2)",
                color: confirmation.ready ? "#fff" : "var(--fg-4)",
                borderColor: "transparent", padding: "14px 20px",
                font: "700 14px/1 var(--font-sans)",
              }}
            >
              ⚡ Grant emergency access
            </button>
            <a href="#" onClick={e => { e.preventDefault(); setScreen("form"); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-4)", textAlign: "center" }}>
              ← Edit request
            </a>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Screen 6a · Grant in progress ──────────────────────────────
  if (screen === "progress") {
    const steps = [
      { id: "auth",   label: "Verifying authorization" },
      { id: "bundle", label: "Generating emergency credential bundle" },
      { id: "grant",  label: `Granting access to ${resource.name} for ${recipient.name}` },
      { id: "notify", label: "Notifying security team" },
      { id: "record", label: "Starting mandatory session recording" },
      { id: "audit",  label: "Logging to audit trail" },
    ];
    return (
      <Shell title="Emergency Access — Granting…">
        <div style={{ maxWidth: 520, margin: "60px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ font: "700 18px/1.3 var(--font-sans)", color: "var(--fg-1)", margin: "0 0 14px" }}>Granting emergency access…</h1>
          {steps.map(s => {
            const st = progressSteps[s.id];
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--border-subtle)", borderRadius: 6 }}>
                <span style={{ width: 18, display: "flex", justifyContent: "center" }}>
                  {st === "done"
                    ? <Icon name="check-circle" size={15} color="var(--success-fg)"/>
                    : <Spinner size={13}/>}
                </span>
                <span style={{ flex: 1, font: `${st === "done" ? 500 : 400} 12.5px/1.4 var(--font-sans)`, color: st === "done" ? "var(--fg-1)" : "var(--fg-3)" }}>
                  {s.label}
                </span>
                {st === "done" && <span className="t-tiny" style={{ color: "var(--fg-4)" }}>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>}
              </div>
            );
          })}
        </div>
      </Shell>
    );
  }

  // ── Screen 6b · Grant confirmed ────────────────────────────────
  if (screen === "done") {
    const r = grantedRecord || { id: "BG-XXXX", recipient: recipient?.name, resource: resource?.name, credential };
    return (
      <Shell title={`Emergency Access — Granted (${r.id})`}>
        <div style={{ maxWidth: 560, margin: "36px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: bgSoft, color: BG, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 10 }}>
              <Icon name="shield" size={30} color={BG}/>
            </div>
            <div style={{ font: "700 20px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Emergency access granted</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>
              {recipient?.name} has {duration} hour{duration === 1 ? "" : "s"} of emergency access to <span className="t-mono">{resource?.name}</span>.
            </div>
          </div>

          <div className="card" style={{ padding: 16, border: `2px solid ${BG}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 8, columnGap: 14, font: "400 12.5px/1.5 var(--font-sans)" }}>
              <span style={{ color: "var(--fg-4)" }}>Recipient</span><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{recipient?.name}</span>
              <span style={{ color: "var(--fg-4)" }}>Resource</span><span className="t-mono">{resource?.name}</span>
              <span style={{ color: "var(--fg-4)" }}>Credential</span><span className="t-mono">{credential} <span style={{ color: "var(--fg-4)" }}>(non-viewable)</span></span>
              <span style={{ color: "var(--fg-4)" }}>Access active from</span><span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              <span style={{ color: "var(--fg-4)" }}>Access expires</span><span>{expiryLabel} <span style={{ color: "var(--fg-4)" }}>({duration}h)</span></span>
              <span style={{ color: "var(--fg-4)" }}>Recording</span><span style={{ color: "var(--success-fg)", font: "500 12.5px/1.4 var(--font-sans)" }}>● Active</span>
            </div>
          </div>

          {/* Inline audit-log confirmation — spec calls this out explicitly:
              every grant must show its audit entry inline, no silent success. */}
          <div style={{ padding: 12, background: "#F3F0F8", borderLeft: `3px solid ${BG}`, borderRadius: "0 6px 6px 0", font: "500 12px/1.5 var(--font-sans)", color: BG }}>
            {r.id} — Granted at {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} by Arjun Bansal · Logged to audit trail · Notifications sent
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="btn" style={{ background: BG, color: "#fff", borderColor: "transparent", flex: 1 }} onClick={() => window.bgStore.openMonitor()}>
              Monitor live session →
            </button>
            <button className="btn" style={{ flex: 1 }} onClick={cancel}>View break-glass record</button>
          </div>
          <button className="btn btn-ghost" onClick={cancel} style={{ alignSelf: "center", padding: "6px 10px", color: "var(--fg-4)" }}>Close</button>
        </div>
      </Shell>
    );
  }

  // ── Screen 7 · Grant failed ────────────────────────────────────
  if (screen === "failed") {
    return (
      <Shell title="Emergency Access — Grant Failed">
        <div style={{ maxWidth: 520, margin: "48px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16, textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--danger-soft)", color: "var(--danger-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Icon name="alert-circle" size={30} color="var(--danger-fg)"/>
          </div>
          <div>
            <div style={{ font: "700 19px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>Grant failed — no access was granted</div>
            <div style={{ font: "500 13px/1.5 var(--font-sans)", color: "var(--danger-fg)", marginTop: 8 }}>{failReason}</div>
          </div>
          <div style={{ padding: 12, background: "var(--danger-soft)", borderRadius: 6, font: "500 12.5px/1.5 var(--font-sans)", color: "var(--danger-fg)" }}>
            {recipient?.name} has <strong>NOT</strong> received access. No audit record of a successful grant exists.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" style={{ background: BG, color: "#fff", borderColor: "transparent", flex: 1 }} onClick={runGrant}>Retry</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => { setScreen("form"); setFailReason(null); }}>Edit request</button>
          </div>
          <a href="#" onClick={e => { e.preventDefault(); cancel(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>Cancel</a>
        </div>
      </Shell>
    );
  }

  return null;
};

// =========================================================
// FLOATING ACTIVE INDICATOR
// =========================================================
// Persists across every PAM screen while a break-glass session is active.
// Bottom-right, deep purple 2px border, live countdown, Monitor + Revoke
// buttons. Explicitly not dismissible per spec — the admin never loses
// awareness that an emergency session is running.
const BGFloatingIndicator = () => {
  const store = window.useBreakGlass();
  const a = store.active;
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!a || store.open === "monitor" || store.open === "trigger") return null;

  const grantedAt = a.grantedAt || now;
  const totalMs = (a.expiresHrs || a.durationHrs || 4) * 3600 * 1000;
  const elapsed = now - grantedAt;
  const remainingMs = Math.max(0, totalMs - elapsed);
  const hh = Math.floor(remainingMs / 3600000);
  const mm = Math.floor((remainingMs % 3600000) / 60000);
  const remaining = remainingMs <= 0 ? "Expired" : `${hh}h ${mm}m remaining`;
  const warn30 = remainingMs > 0 && remainingMs < 30 * 60 * 1000;
  const warn10 = remainingMs > 0 && remainingMs < 10 * 60 * 1000;
  const accent = remainingMs <= 0 ? "var(--danger-fg)" : warn10 ? "var(--danger-fg)" : warn30 ? "var(--warning-fg)" : BG;

  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 250,
      width: 260, background: "#fff",
      border: `2px solid ${accent}`, borderRadius: 8,
      boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
      animation: warn10 ? "bgPulse 2s infinite" : "none",
    }}>
      <div style={{ padding: "10px 14px 6px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: accent, fontSize: 14 }}>⚡</span>
        <span style={{ font: "700 12px/1 var(--font-sans)", color: accent, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Active break-glass
        </span>
      </div>
      <div style={{ padding: "0 14px 8px", font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>
        {a.recipient} → <span className="t-mono">{a.resource}</span>
      </div>
      <div style={{ padding: "0 14px 10px", font: `${warn10 ? 700 : 600} 12px/1 var(--font-sans)`, color: accent }}>
        ⏱ {remaining}
      </div>
      <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 6 }}>
        <button className="btn btn-sm" style={{ background: BG, color: "#fff", borderColor: "transparent", flex: 1 }} onClick={() => window.bgStore.openMonitor()}>
          Monitor
        </button>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger-fg)", flex: "none" }} onClick={() => window.bgStore.openTerminate()}>
          Revoke
        </button>
      </div>
    </div>
  );
};

// =========================================================
// ACTIVE MONITOR — full-screen 3-column live view.
// Left: session context + mandatory controls
// Center: live activity feed (polling every 5s via bgStore.startPoll)
// Right: system audit log
// Footer: countdown · Extend · Terminate
// =========================================================
const BGRow = ({ k, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: 10, padding: "5px 0", alignItems: "center" }}>
    <span style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</span>
    <span style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</span>
  </div>
);

const BGRiskBar = ({ score }) => {
  const color = score >= 70 ? "var(--danger-fg)" : score >= 40 ? "var(--warning-fg)" : "var(--success-fg)";
  const label = score >= 70 ? "High" : score >= 40 ? "Elevated" : "Low";
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>Live risk score</span>
        <span style={{ font: "700 15px/1 var(--font-sans)", color }}>{Math.round(score)} <span style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", marginLeft: 4 }}>· {label}</span></span>
      </div>
      <div style={{ height: 8, background: "var(--bg-surface-2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, score)}%`, height: "100%", background: color, transition: "width 0.4s ease-out" }}/>
      </div>
    </div>
  );
};

const BGMonitorPanel = () => {
  const store = window.useBreakGlass();
  const a = store.active;
  const cfg = store.config;
  const [now, setNow] = React.useState(Date.now());
  const feedRef = React.useRef(null);
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  React.useEffect(() => {
    // Auto-scroll to bottom on new activity — like a real terminal tail.
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [store.activity.length]);
  if (!a) return null;

  const grantedAt = a.grantedAt || now;
  const totalMs = (a.expiresHrs || a.durationHrs || 4) * 3600 * 1000;
  const remainingMs = Math.max(0, totalMs - (now - grantedAt));
  const hh = Math.floor(remainingMs / 3600000);
  const mm = Math.floor((remainingMs % 3600000) / 60000);
  const ss = Math.floor((remainingMs % 60000) / 1000);
  const countdown = `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
  const warn = remainingMs < 30 * 60 * 1000;
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", display: "flex", flexDirection: "column" }}>
      <BGChromeHeader title={`Active Break-Glass Session · ${a.id} · ${a.recipient} → ${a.resource}`}/>
      <BGConsequenceBanner>Live session · commands are being recorded and streamed to the audit trail. Terminate immediately if activity looks unexpected.</BGConsequenceBanner>

      {/* 3-column body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr 340px", gap: 0, minHeight: 0 }}>
        {/* LEFT — Session + Controls */}
        <aside style={{ padding: 16, borderRight: "1px solid var(--border)", overflow: "auto", display: "flex", flexDirection: "column", gap: 18, background: "var(--bg-app)" }}>
          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Session</div>
            <BGRow k="Recipient">{a.recipient}</BGRow>
            <BGRow k="Resource"><span className="t-mono">{a.resource}</span></BGRow>
            <BGRow k="Severity"><SeverityBadge level={a.severity}/></BGRow>
            <BGRow k="Credential"><span className="t-mono">{a.credential}</span></BGRow>
            <BGRow k="Ticket">{a.ticket || "—"}</BGRow>
            <BGRow k="Reason">{a.reason || "—"}</BGRow>
            <BGRow k="Commands run">{a.commands || 0}</BGRow>
          </div>

          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Justification</div>
            <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
              {a.justification && a.justification.length > 160 ? a.justification.slice(0, 160) + "…" : a.justification}
            </div>
          </div>

          <div>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Mandatory controls (active)</div>
            {[["Session recording", "Recording"], ["Keystroke logging", "Capturing"], ["MFA re-verification", "Verified"], ["Post-incident review", "Required on end"], ["Credential rotation", "Within 24h"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", font: "400 12px/1.4 var(--font-sans)" }}>
                <span style={{ color: "var(--success-fg)" }}>🔒</span>
                <span style={{ flex: 1, color: "var(--fg-1)" }}>{k}</span>
                <span style={{ color: "var(--success-fg)", font: "500 11px/1 var(--font-sans)" }}>{v}</span>
              </div>
            ))}
          </div>

          <button className="btn" onClick={() => window.bgStore.openRecipientLaunch()} style={{ marginTop: "auto", fontSize: 12 }}>
            <Icon name="user" size={12}/> Preview recipient view
          </button>
        </aside>

        {/* CENTER — Live activity feed */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, background: "var(--bg-surface)" }}>
          <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 6, background: "#fff" }}>
            <BGRiskBar score={store.riskScore}/>
            <div style={{ marginTop: 8, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>
              Contributing factors: {store.activity.filter(a => a.risk === "high").length} high-risk command{store.activity.filter(a => a.risk === "high").length === 1 ? "" : "s"} · {store.activity.filter(a => a.risk === "medium").length} medium-risk · {store.activity.filter(a => a.risk === "low").length} low-risk.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>Live activity feed</div>
            <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--success-fg)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)", animation: "bgPulse 1.5s infinite" }}/>
              Polling every 5s
            </div>
          </div>

          <div ref={feedRef} className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 12, background: "#0F1115", borderRadius: 6, font: "500 12px/1.55 var(--font-mono)", color: "#DFE3E8", minHeight: 0 }}>
            {store.activity.length === 0 ? (
              <div style={{ color: "#6B7280", fontStyle: "italic" }}>Waiting for first command from {a.recipient}…</div>
            ) : store.activity.map((ev, i) => {
              const riskColor = ev.risk === "high" ? "#F87171" : ev.risk === "medium" ? "#FBBF24" : "#9CA3AF";
              return (
                <div key={i} style={{ display: "flex", gap: 10, padding: "3px 0" }}>
                  <span style={{ color: "#6B7280", flex: "none" }}>{fmtTime(ev.ts)}</span>
                  <span style={{ color: riskColor, flex: "none", width: 60 }}>{ev.risk.toUpperCase()}</span>
                  <span style={{ color: "#DFE3E8", flex: 1 }}>{ev.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — System audit log */}
        <aside style={{ padding: 16, borderLeft: "1px solid var(--border)", overflow: "auto", background: "var(--bg-app)" }}>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>System audit log</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {store.audit.slice().reverse().map((ev, i) => {
              const icon = ev.kind === "grant" ? "shield" : ev.kind === "mfa" ? "key" : ev.kind === "notify" ? "bell" : ev.kind === "extend" ? "clock" : ev.kind === "connect" ? "check" : ev.kind === "terminate" ? "x" : "info";
              return (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 8, background: "var(--bg-surface)", borderRadius: 4 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: bgSoft, color: BG, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <Icon name={icon} size={11}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: "500 11.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{ev.message}</div>
                    <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{fmtTime(ev.ts)} · {ev.actor}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${BG}`, background: "#1A1916", color: "#fff", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⏱</span>
          <div>
            <div className="t-mono" style={{ font: `700 22px/1 var(--font-mono)`, color: warn ? "#F87171" : "#fff" }}>{countdown}</div>
            <div className="t-tiny" style={{ color: "#9CA3AF", marginTop: 2 }}>remaining · {a.durationHrs}h window{a.extended ? " (extended)" : ""}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <button className="btn" onClick={() => window.bgStore.close()} style={{ background: "transparent", color: "#DFE3E8", borderColor: "#374151" }}>
          Close (session continues)
        </button>
        {cfg.extensionAllowed && !a.extended && (
          <button className="btn" onClick={() => window.bgStore.openExtend()} style={{ background: "#374151", color: "#fff", borderColor: "transparent" }}>
            <Icon name="clock" size={12}/> Extend session
          </button>
        )}
        <button className="btn" onClick={() => window.bgStore.openTerminate()} style={{ background: "#C0392B", color: "#fff", borderColor: "transparent", fontWeight: 700 }}>
          <Icon name="alert-triangle" size={12}/> Terminate now
        </button>
      </div>
    </div>
  );
};

// =========================================================
// EXTEND MODAL
// =========================================================
const BGExtendModal = () => {
  const cfg = window.bgStore.config;
  const a = window.bgStore.active;
  const [hrs, setHrs] = React.useState(2);
  const [reason, setReason] = React.useState("");
  if (!a) return null;
  const capped = Math.min(4, Math.max(1, hrs));
  const canConfirm = reason.trim().length >= 30;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 520, maxWidth: "94vw", background: "#fff", border: `2px solid ${BG}`, borderRadius: 8, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: BG, color: "#fff", font: "700 14px/1.2 var(--font-sans)" }}>
          Extend emergency session — {a.id}
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 12, background: "#FCEBEB", borderLeft: "3px solid #C0392B", color: "#7A1B12", font: "500 12px/1.4 var(--font-sans)", borderRadius: "0 4px 4px 0" }}>
            Extensions are one-time and capped at +{cfg.extensionAllowed ? 4 : 0}h. A secondary admin is notified in real time.
          </div>
          <Field label="Extend by (hours)" required hint="Max 4 additional hours">
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4].map(h => (
                <button key={h} onClick={() => setHrs(h)} style={{ flex: 1, padding: "10px 0", border: `1.5px solid ${capped === h ? BG : "var(--border)"}`, background: capped === h ? bgSoft : "#fff", color: capped === h ? BG : "var(--fg-2)", font: `${capped === h ? 700 : 500} 13.5px/1 var(--font-sans)`, borderRadius: 6, cursor: "pointer" }}>
                  +{h}h
                </button>
              ))}
            </div>
          </Field>
          <Field label="Why is more time needed?" required hint="30 chars minimum — this appears on the audit record.">
            <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Replica sync taking longer than expected; need to verify oplog catch-up before disconnecting."/>
            <div style={{ marginTop: 4, font: "400 11px/1 var(--font-sans)", color: canConfirm ? "var(--success-fg)" : "var(--fg-4)" }}>{reason.length} / 30 min</div>
          </Field>
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end", background: "var(--bg-surface)" }}>
          <button className="btn" onClick={() => window.bgStore.openMonitor()}>Cancel</button>
          <button className="btn" disabled={!canConfirm} onClick={() => { window.bgStore.extend(capped, reason); window.pamToast(`Access extended by ${capped}h`, "info"); }} style={{ background: canConfirm ? BG : "var(--bg-surface-2)", color: canConfirm ? "#fff" : "var(--fg-4)", borderColor: "transparent" }}>
            <Icon name="clock" size={12}/> Extend by {capped}h
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// TERMINATE OVERLAY — full-screen consequence-forward confirmation.
// Requires typed reason. On confirm: bgStore.endSession() with the reason,
// which stops polling, records the terminate audit entry, and hands off
// to the post-session context form.
// =========================================================
const BGTerminateOverlay = () => {
  const a = window.bgStore.active;
  const [reason, setReason] = React.useState("");
  const [typedId, setTypedId] = React.useState("");
  if (!a) return null;
  const canConfirm = reason.trim().length >= 30 && typedId.trim().toLowerCase() === (a.id || "").toLowerCase();
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 330, background: "rgba(122, 27, 18, 0.15)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", background: "#C0392B", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚠</span>
        <span style={{ font: "700 15px/1.2 var(--font-sans)" }}>Terminate emergency session — {a.id}</span>
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", background: "#fff" }}>
        <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h1 style={{ font: "700 19px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>End {a.recipient}'s access immediately?</h1>
            <p style={{ font: "400 13.5px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>
              Their session will be disconnected the moment you confirm. Any command in flight is killed. This action cannot be undone.
            </p>
          </div>

          <div style={{ padding: 14, background: "#FCEBEB", borderLeft: "3px solid #C0392B", color: "#7A1B12", borderRadius: "0 4px 4px 0", font: "500 12.5px/1.5 var(--font-sans)" }}>
            After termination: the recipient is prompted to file their post-session context, the credential <span className="t-mono">{a.credential}</span> is scheduled for rotation, and a mandatory post-incident review starts.
          </div>

          <Field label="Why are you terminating?" required hint="30 chars minimum — permanently recorded.">
            <textarea className="input" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Recipient ran an unexpected destructive command; ending session to prevent further damage."/>
            <div style={{ marginTop: 4, font: "400 11px/1 var(--font-sans)", color: reason.trim().length >= 30 ? "var(--success-fg)" : "var(--fg-4)" }}>{reason.length} / 30 min</div>
          </Field>

          <Field label={`Type the session ID (${a.id}) to confirm`} required>
            <input className="input t-mono" value={typedId} onChange={e => setTypedId(e.target.value)} placeholder={a.id}/>
          </Field>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              className="btn"
              disabled={!canConfirm}
              onClick={() => { window.bgStore.endSession({ terminatedReason: reason }); window.pamToast("Session terminated · credential rotation scheduled · review required", "info"); }}
              style={{ background: canConfirm ? "#C0392B" : "var(--bg-surface-2)", color: canConfirm ? "#fff" : "var(--fg-4)", borderColor: "transparent", padding: "12px 20px", font: "700 13.5px/1 var(--font-sans)" }}
            >
              Terminate session now
            </button>
            <button className="btn btn-ghost" onClick={() => window.bgStore.openMonitor()} style={{ alignSelf: "center", color: "var(--fg-3)" }}>
              ← Back to monitor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// RECIPIENT NOTIFICATION + SESSION LAUNCH
// Screen 13a — recipient's initial notification screen after grant.
// Simulated: admin clicks "Preview recipient view" from the monitor.
// =========================================================
const BGRecipientLaunch = () => {
  const a = window.bgStore.active;
  if (!a) return null;
  const grantedAt = a.grantedAt || Date.now();
  const grantedLabel = new Date(grantedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#0F1115", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", background: BG, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span style={{ font: "700 15px/1.2 var(--font-sans)" }}>Emergency access — you have been granted temporary credentials</span>
        <span style={{ marginLeft: "auto", font: "500 11.5px/1 var(--font-sans)", opacity: 0.9 }}>Recipient view (simulated)</span>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 620, margin: "48px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h1 style={{ font: "700 22px/1.2 var(--font-sans)", color: "#fff", margin: 0 }}>{a.recipient}, you have emergency access.</h1>
            <p style={{ font: "400 13.5px/1.6 var(--font-sans)", color: "#9CA3AF", margin: "8px 0 0" }}>
              Granted by <strong style={{ color: "#DFE3E8" }}>{a.initiator || "Arjun Bansal"}</strong> at {grantedLabel} for <strong style={{ color: "#DFE3E8" }}>{a.durationHrs} hour{a.durationHrs === 1 ? "" : "s"}</strong>. Every command you run will be recorded.
            </p>
          </div>

          <div style={{ padding: 18, background: "#1A1D24", border: `1px solid ${BG}`, borderRadius: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 8, columnGap: 12, font: "400 12.5px/1.5 var(--font-sans)", color: "#9CA3AF" }}>
              <span>Resource</span><span className="t-mono" style={{ color: "#DFE3E8" }}>{a.resource}</span>
              <span>Credential</span><span className="t-mono" style={{ color: "#DFE3E8" }}>{a.credential} <span style={{ color: "#6B7280" }}>(injected — not viewable)</span></span>
              <span>Severity</span><span><SeverityBadge level={a.severity}/></span>
              <span>Expires at</span><span style={{ color: "#DFE3E8" }}>{new Date(grantedAt + a.durationHrs * 3600000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              <span>Incident</span><span style={{ color: "#DFE3E8" }}>{a.ticket || "—"} · {a.reason || "—"}</span>
            </div>
            {a.message && (
              <div style={{ marginTop: 12, padding: 10, background: "#0F1115", borderRadius: 4, font: "400 12px/1.5 var(--font-sans)", color: "#DFE3E8" }}>
                <div className="t-tiny" style={{ color: "#6B7280", marginBottom: 4 }}>Message from {a.initiator || "admin"}</div>
                "{a.message}"
              </div>
            )}
          </div>

          <div style={{ padding: 12, background: "rgba(192, 57, 43, 0.14)", borderLeft: "3px solid #C0392B", color: "#F87171", font: "500 12.5px/1.5 var(--font-sans)" }}>
            ⚡ Your session will be recorded (video + keystrokes). A mandatory post-session form appears when you disconnect. The credential is rotated within 24h.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="btn" onClick={() => window.bgStore.openRecipientMfa()} style={{ background: BG, color: "#fff", borderColor: "transparent", padding: "14px 20px", font: "700 14px/1 var(--font-sans)" }}>
              <Icon name="terminal" size={13}/> Connect to {a.resource}
            </button>
            <button className="btn btn-ghost" onClick={() => window.bgStore.exitRecipientView()} style={{ alignSelf: "center", color: "#9CA3AF" }}>
              ← Back to admin monitor (simulation)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// RECIPIENT MFA-ON-CONNECT — Screen 13b
// Recipient must re-verify their identity before the session actually opens.
// Uses the same 6-digit auto-advance pattern as the admin trigger.
// =========================================================
const BGRecipientMfa = () => {
  const a = window.bgStore.active;
  const [code, setCode] = React.useState("");
  const [attempts, setAttempts] = React.useState(3);
  const [error, setError] = React.useState(null);
  const [verifying, setVerifying] = React.useState(false);
  const state = window.bgStore.recipientMfaState;
  const submit = (c) => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      if (c === "000000") {
        setAttempts(a => {
          const left = a - 1;
          setError(left > 0 ? `Incorrect. ${left} attempt${left === 1 ? "" : "s"} left.` : "Locked out. Contact your admin.");
          return left;
        });
        setCode("");
      } else {
        window.bgStore.submitRecipientMfa(true);
        window.pamToast("Recipient connected · commands are now being recorded", "info");
      }
    }, 700);
  };
  React.useEffect(() => { if (code.length === 6 && !verifying && state !== "done") submit(code); }, [code]);
  if (!a) return null;

  // Once MFA succeeds we show the "session live" splash briefly, then flow
  // back to the admin monitor. In real product the recipient would land in
  // their terminal/CLI here.
  if (state === "done") {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#0F1115", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(123, 62, 168, 0.2)", color: "#B78CD9", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="terminal" size={32} color="#B78CD9"/>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ font: "700 20px/1.2 var(--font-sans)" }}>Connected to {a.resource}</div>
          <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "#9CA3AF", margin: "8px 0 0" }}>Your session is live and recording. Run only what the incident requires.</div>
        </div>
        <div style={{ padding: 14, background: "#1A1D24", borderRadius: 6, font: "500 12.5px/1.4 var(--font-mono)", color: "#DFE3E8", maxWidth: 500 }}>
          $ ssh {a.credential}@{a.resource}<br/>
          <span style={{ color: "#B78CD9" }}>Connected. Type 'exit' to disconnect. Session recording: <b>ON</b>.</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button className="btn" onClick={() => window.bgStore.endSession({})} style={{ background: "#C0392B", color: "#fff", borderColor: "transparent" }}>
            Disconnect (end session)
          </button>
          <button className="btn" onClick={() => window.bgStore.exitRecipientView()} style={{ background: "#374151", color: "#fff", borderColor: "transparent" }}>
            Back to admin monitor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#0F1115", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "14px 24px", background: BG, color: "#fff", font: "700 14px/1.2 var(--font-sans)" }}>
        Confirm identity before connecting
      </div>
      <div style={{ padding: "10px 24px", background: "rgba(192, 57, 43, 0.2)", borderLeft: "3px solid #C0392B", color: "#F87171", font: "500 12.5px/1.5 var(--font-sans)" }}>
        ⚡ MFA is required every time you connect to an emergency session. The proxy does not open the connection until this succeeds.
      </div>
      <div style={{ maxWidth: 440, margin: "48px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ font: "700 20px/1.2 var(--font-sans)", margin: 0 }}>Enter the 6-digit code from your authenticator app</h1>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[0,1,2,3,4,5].map(i => (
            <input
              key={i}
              type="text" inputMode="numeric" maxLength={1}
              value={code[i] || ""}
              disabled={verifying || attempts === 0}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 1);
                const parent = e.target.parentElement;
                setCode(prev => (prev.slice(0, i) + v + prev.slice(i + 1)).slice(0, 6));
                if (v && i < 5) parent.children[i + 1]?.focus();
              }}
              style={{
                width: 48, height: 56, textAlign: "center",
                font: "600 22px/1 var(--font-mono)",
                border: `1px solid ${error ? "#F87171" : "#374151"}`,
                borderRadius: 6, background: verifying ? "#1F2937" : "#111827",
                color: "#fff", outline: "none",
              }}
            />
          ))}
        </div>
        {error && <div style={{ padding: "10px 12px", background: "rgba(192,57,43,0.2)", color: "#F87171", borderRadius: 4, font: "500 12.5px/1.4 var(--font-sans)" }}>⚠ {error}</div>}
        {verifying && !error && <div style={{ textAlign: "center", font: "500 12px/1.4 var(--font-sans)", color: "#B78CD9" }}><Spinner size={12}/> Verifying…</div>}
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <a href="#" onClick={e => { e.preventDefault(); window.bgStore.exitRecipientView(); }} style={{ font: "500 12.5px/1 var(--font-sans)", color: "#9CA3AF" }}>
            Cancel — do not connect
          </a>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// POST-SESSION CONTEXT FORM — Screen 13c
// Mandatory for the recipient after every break-glass session ends. This
// captures what the recipient actually did, in their own words, and is
// attached to the review record so admins reviewing the session have both
// audit-log evidence AND recipient context.
// =========================================================
const BGPostSessionForm = () => {
  const rev = window.bgStore.pendingReview;
  const [f, setF] = React.useState({ desc: "", commands: "", incidentResult: "", lessons: "" });
  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));
  if (!rev) return null;
  const complete = f.desc.trim().length >= 50 && f.commands.trim().length >= 10 && f.incidentResult;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", display: "flex", flexDirection: "column" }}>
      <BGChromeHeader title={`Post-session context — ${rev.id}`}/>
      <BGConsequenceBanner>Your session ended. This form is required — the review cannot close without your input, and access to further break-glass may be blocked until it is filed.</BGConsequenceBanner>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 640, margin: "24px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h1 style={{ font: "700 20px/1.2 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Tell us what you did.</h1>
            <p style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", margin: "6px 0 0" }}>
              Your context sits next to the recorded evidence when {rev.initiator || "the admin"} reviews this session.
            </p>
          </div>

          <div style={{ padding: 12, background: "var(--bg-surface-2)", borderRadius: 6, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>
            Recorded automatically: <strong style={{ color: "var(--fg-1)" }}>{rev.commands} command{rev.commands === 1 ? "" : "s"}</strong> · session duration {rev.duration || "—"} · risk score {rev.riskScore || 0}
          </div>

          <Field label="What did you do during the session?" required hint="50 chars min. Be specific — the review references this.">
            <textarea className="input" rows={4} value={f.desc} onChange={set("desc")} placeholder="e.g. Investigated replica lag, forced a stepDown on the primary, monitored oplog catch-up, then disconnected once writes resumed."/>
            <div style={{ marginTop: 4, font: "400 11px/1 var(--font-sans)", color: f.desc.length >= 50 ? "var(--success-fg)" : "var(--fg-4)" }}>{f.desc.length} / 50 min</div>
          </Field>

          <Field label="Which commands mattered most?" required hint="Paste the key commands — full log is recorded separately.">
            <textarea className="input t-mono" rows={4} value={f.commands} onChange={set("commands")} placeholder="rs.stepDown(60)&#10;db.oplog.rs.find().sort({$natural:-1}).limit(5)"/>
          </Field>

          <Field label="Did the emergency resolve?" required>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { v: "resolved",     label: "✓ Resolved",      color: "var(--success-fg)" },
                { v: "partial",      label: "◐ Partially",     color: "var(--warning-fg)" },
                { v: "unresolved",   label: "✗ Still open",    color: "var(--danger-fg)" },
                { v: "escalated",    label: "↑ Escalated",     color: "#7B3EA8" },
              ].map(o => (
                <button key={o.v} onClick={() => setF(prev => ({ ...prev, incidentResult: o.v }))} style={{ flex: 1, padding: "10px 12px", border: `1.5px solid ${f.incidentResult === o.v ? o.color : "var(--border)"}`, background: f.incidentResult === o.v ? `color-mix(in oklch, ${o.color} 10%, transparent)` : "#fff", color: f.incidentResult === o.v ? o.color : "var(--fg-2)", font: `${f.incidentResult === o.v ? 700 : 500} 12.5px/1 var(--font-sans)`, borderRadius: 6, cursor: "pointer" }}>
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Anything the team should learn from this? (optional)">
            <textarea className="input" rows={3} value={f.lessons} onChange={set("lessons")} placeholder="e.g. Our replica-lag alert fires too late — we should tighten the threshold from 60s to 30s."/>
          </Field>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            <button className="btn" disabled={!complete} onClick={() => { window.bgStore.savePostSession(f); window.pamToast("Post-session context filed · review is now unblocked", "info"); }} style={{ background: complete ? BG : "var(--bg-surface-2)", color: complete ? "#fff" : "var(--fg-4)", borderColor: "transparent", padding: "12px 20px", font: "700 13.5px/1 var(--font-sans)" }}>
              File post-session context
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

          {r.postSession && (
            <div>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Recipient post-session context</div>
              <div style={{ padding: 12, background: bgSoft, borderRadius: 8, borderLeft: `3px solid ${BG}`, font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)", display: "flex", flexDirection: "column", gap: 8 }}>
                <div><span style={{ color: "var(--fg-4)", marginRight: 6 }}>What was done:</span>{r.postSession.desc}</div>
                {r.postSession.commands && <div><span style={{ color: "var(--fg-4)", marginRight: 6 }}>Key commands:</span><span className="t-mono">{r.postSession.commands}</span></div>}
                <div><span style={{ color: "var(--fg-4)", marginRight: 6 }}>Outcome:</span><strong style={{ color: "var(--fg-1)", textTransform: "capitalize" }}>{r.postSession.incidentResult}</strong></div>
                {r.postSession.lessons && <div><span style={{ color: "var(--fg-4)", marginRight: 6 }}>Lessons:</span>{r.postSession.lessons}</div>}
              </div>
            </div>
          )}

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
      {store.open === "monitor"           && store.active && <BGMonitorPanel/>}
      {store.open === "extend"            && store.active && <><BGMonitorPanel/><BGExtendModal/></>}
      {store.open === "terminate"         && store.active && <BGTerminateOverlay/>}
      {store.open === "recipient-launch"  && store.active && <BGRecipientLaunch/>}
      {store.open === "recipient-mfa"     && store.active && <BGRecipientMfa/>}
      {store.open === "post-session"      && store.pendingReview && <BGPostSessionForm/>}
      {store.reviewOpen && <BGReviewModal/>}
      {store.active && store.open !== "monitor" && store.open !== "extend" && store.open !== "terminate" && store.open !== "recipient-launch" && store.open !== "recipient-mfa" && <BGFloatingIndicator/>}
    </>
  );
};

Object.assign(window, { BG_COLOR: BG, BGBadge, SeverityBadge, BGReviewStatus, BGTriggerModal, BGMonitorPanel, BGExtendModal, BGTerminateOverlay, BGRecipientLaunch, BGRecipientMfa, BGPostSessionForm, BGReviewModal, BreakGlassReviewList, BreakGlassController, BGFloatingIndicator });
