// =====================================================================
// TICKETS & APPROVALS — V3
// Full governance experience: Queue (admin) + My Tickets (end user) +
// Ticket Settings + Request Access flow + Ticket Detail side panel
// =====================================================================

// ---------- Realistic seed data ----------
const PEOPLE_T = {
  "priya":   { name: "Priya Sharma",    role: "DevOps Engineer",   avatar: null, jit7d: 4 },
  "rohan":   { name: "Rohan Mehta",     role: "SysAdmin",          avatar: null, jit7d: 2 },
  "aditya":  { name: "Aditya Kulkarni", role: "Backend Developer", avatar: null, jit7d: 8 },
  "sarvesh": { name: "Sarvesh Joshi",   role: "QA Lead",           avatar: null, jit7d: 1 },
  "arjun":   { name: "Arjun Bansal",    role: "Security Admin",    avatar: null },
  "mohak":   { name: "Mohak Sharma",    role: "IT Ops Lead",       avatar: null },
};

const RES_T = {
  "prod-db-01":         { type: "database", subtype: "MySQL",   host: "10.0.1.45",   env: "Production", crit: "critical" },
  "ssh-server-linux":   { type: "server",   subtype: "Linux",   host: "192.168.1.10", env: "Production", crit: "high" },
  "oracle-reporting":   { type: "database", subtype: "Oracle",  host: "10.0.1.89",   env: "Production", crit: "critical" },
  "dev-web-portal":     { type: "web",      subtype: "Internal", host: "dev.internal.co", env: "Dev",   crit: "medium" },
  "auth-service":       { type: "server",   subtype: "Linux",   host: "10.0.2.12",   env: "Production", crit: "high" },
  "stage-jumpbox":      { type: "server",   subtype: "Linux",   host: "10.0.3.5",    env: "Staging",    crit: "medium" },
};

const SEED_TICKETS_V3 = [
  { id: "0048", requesterId: "priya", resource: "prod-db-01", credential: "prod_mysql_admin", windowFrom: "12 May 14:00", windowTo: "12 May 18:00", windowType: "Custom", reason: "Need access to prod-db-01 to debug a query slowdown affecting payments. Required for 4 hours.", requestedAt: "2h ago", requestedAtFull: "12 May 12:08", status: "pending", flags: ["off-hours"], approvers: [{ pid: "arjun", state: "awaiting" }, { pid: "mohak", state: "awaiting" }], slaHours: 4, slaRemaining: "2h 14m" },
  { id: "0047", requesterId: "rohan", resource: "ssh-server-linux", credential: "linux_root", windowFrom: "12 May 22:00", windowTo: "13 May 02:00", windowType: "Custom", reason: "Deploying hotfix to ssh-server-linux tonight. Requires root access for the deployment window.", requestedAt: "30m ago", requestedAtFull: "12 May 13:42", status: "pending", flags: [], approvers: [{ pid: "arjun", state: "approved", at: "12 May 13:51" }, { pid: "mohak", state: "awaiting" }], slaHours: 4, slaRemaining: "3h 22m" },
  { id: "0046", requesterId: "priya", resource: "ssh-server-linux", credential: "linux_admin", windowFrom: "12 May 09:00", windowTo: "12 May 11:00", windowType: "Custom", reason: "Investigating disk pressure alert from monitoring.", requestedAt: "5h ago", requestedAtFull: "12 May 09:12", status: "pending", flags: ["repeat", "off-hours"], approvers: [{ pid: "arjun", state: "awaiting" }], slaHours: 4, slaRemaining: "-1h 08m" },
  { id: "0045", requesterId: "aditya", resource: "prod-db-01", credential: "prod_mysql_admin", windowFrom: "12 May 13:00", windowTo: "13 May 09:00", windowType: "Custom", reason: "Long-running data migration for ledger reconciliation — needs overnight window with replica catch-up.", requestedAt: "6h ago", requestedAtFull: "12 May 08:14", status: "pending", flags: ["critical-long", "repeat"], approvers: [{ pid: "arjun", state: "awaiting" }, { pid: "mohak", state: "awaiting" }], slaHours: 4, slaRemaining: "8m" },
  { id: "0044", requesterId: "sarvesh", resource: "oracle-reporting", credential: "oracle_reporting_ro", windowFrom: "16 May 09:00", windowTo: "16 May 18:00", windowType: "Custom", reason: "Running monthly financial reports from oracle-reporting. Access needed 9am-6pm Friday.", requestedAt: "Yesterday", requestedAtFull: "11 May 17:22", status: "approved", approvedBy: "arjun", approvedAt: "11 May 17:48", approvers: [{ pid: "arjun", state: "approved", at: "11 May 17:48" }, { pid: "mohak", state: "approved", at: "11 May 18:02" }], flags: [], slaHours: 4 },
  { id: "0043", requesterId: "priya", resource: "auth-service", credential: "linux_admin", windowFrom: "11 May 11:00", windowTo: "11 May 13:00", windowType: "Custom", reason: "Investigating 5xx spike on /oauth/token endpoint", requestedAt: "Yesterday", requestedAtFull: "11 May 10:42", status: "approved", approvedBy: "arjun", approvedAt: "11 May 10:51", approvers: [{ pid: "arjun", state: "approved", at: "11 May 10:51" }], flags: [], expired: true },
  { id: "0042", requesterId: "aditya", resource: "prod-db-01", credential: "prod_mysql_admin", windowFrom: "10 May 22:00", windowTo: "11 May 12:00", windowType: "Custom", reason: "Need write access for vendor data sync.", requestedAt: "2 days ago", requestedAtFull: "10 May 21:30", status: "rejected", rejectedBy: "arjun", rejectedAt: "10 May 21:42", rejectReason: "Access duration exceeds 8-hour limit for production databases. Please resubmit with a shorter window.", approvers: [{ pid: "arjun", state: "rejected", at: "10 May 21:42" }], flags: ["critical-long"] },
  { id: "0041", requesterId: "rohan", resource: "stage-jumpbox", credential: "linux_admin", windowFrom: "10 May 14:00", windowTo: "10 May 16:00", windowType: "Custom", reason: "Vendor onboarding session in staging", requestedAt: "2 days ago", requestedAtFull: "10 May 13:42", status: "approved", approvedBy: "arjun", approvedAt: "10 May 13:51", approvers: [{ pid: "arjun", state: "approved", at: "10 May 13:51" }], expired: true },
  { id: "0040", requesterId: "sarvesh", resource: "dev-web-portal", credential: "web_admin", windowFrom: "9 May 10:00", windowTo: "9 May 17:00", windowType: "One Time", reason: "Acceptance testing for v2.4 release", requestedAt: "3 days ago", requestedAtFull: "9 May 09:42", status: "approved", approvedBy: "mohak", approvedAt: "9 May 09:51", approvers: [{ pid: "mohak", state: "approved", at: "9 May 09:51" }], expired: true },
];

// ---------- Status badges & helpers ----------
const STATUS_STYLE = {
  pending:    { bg: "color-mix(in oklch, #1A5FA8 14%, transparent)", fg: "#1A5FA8", label: "Pending" },
  approved:   { bg: "var(--success-soft)", fg: "var(--success-fg)", label: "Approved" },
  rejected:   { bg: "var(--danger-soft)",  fg: "var(--danger-fg)",  label: "Rejected" },
  expired:    { bg: "var(--bg-surface-2)", fg: "var(--fg-3)",       label: "Expired" },
  revoked:    { bg: "transparent",         fg: "var(--danger-fg)",  label: "Revoked", border: "var(--danger-fg)" },
  expiring:   { bg: "var(--warning-soft)", fg: "var(--warning-fg)", label: "Expiring soon" },
  flagged:    { bg: "color-mix(in oklch, #7B3EA8 14%, transparent)", fg: "#7B3EA8", label: "Flagged" },
};

const TicketStatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "2px 8px", borderRadius: 999, font: "600 10.5px/1.4 var(--font-sans)",
    background: s.bg, color: s.fg, border: s.border ? `1px solid ${s.border}` : "1px solid transparent",
    textTransform: "uppercase", letterSpacing: 0.3,
  }}>{s.label}</span>;
};

const ANOMALY_REASONS = {
  "repeat":         "Same requester has 3+ open requests in the last 2 hours",
  "critical-long":  "Request for a Critical resource with window > 8 hours",
  "off-hours":      "Submitted outside 7am–8pm working hours",
  "break-glass":    "This resource had a break-glass event in the last 7 days",
};

const AnomalyBadge = ({ flags }) => {
  if (!flags || flags.length === 0) return null;
  const [hover, setHover] = React.useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block" }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 7px", borderRadius: 999, font: "600 10.5px/1.4 var(--font-sans)",
        background: "#7B3EA8", color: "#fff", letterSpacing: 0.3,
      }}>⚑ Anomaly</span>
      {hover && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: "var(--fg-1)", color: "var(--bg-app)",
          padding: "8px 10px", borderRadius: 6, font: "500 11.5px/1.4 var(--font-sans)",
          boxShadow: "var(--shadow-lg)", minWidth: 260, maxWidth: 320,
        }}>
          <div style={{ font: "700 10px/1 var(--font-sans)", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.7, marginBottom: 6 }}>Why this is flagged</div>
          {flags.map(f => <div key={f} style={{ marginBottom: 3 }}>• {ANOMALY_REASONS[f] || f}</div>)}
        </div>
      )}
    </span>
  );
};

const SLABadge = ({ remaining, status }) => {
  if (status !== "pending") return <span style={{ color: "var(--fg-4)" }}>—</span>;
  if (!remaining) return <span style={{ color: "var(--fg-4)" }}>—</span>;
  const overdue = remaining.startsWith("-");
  const urgent = remaining.includes("m") && !remaining.includes("h") && !overdue;
  if (overdue) return <span style={{ color: "var(--danger-fg)", font: "600 12px/1 var(--font-sans)" }}>Overdue by {remaining.slice(1)}</span>;
  if (urgent)  return <span style={{ color: "var(--warning-fg)", font: "600 12px/1 var(--font-sans)" }}>{remaining}</span>;
  return <span style={{ color: "var(--fg-2)", font: "500 12px/1 var(--font-sans)" }}>{remaining}</span>;
};

const ApproverStack = ({ approvers, max = 3 }) => {
  const done = approvers.filter(a => a.state === "approved").length;
  const total = approvers.length;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex" }}>
        {approvers.slice(0, max).map((a, i) => {
          const p = PEOPLE_T[a.pid];
          const border = a.state === "approved" ? "var(--success-fg)" : a.state === "rejected" ? "var(--danger-fg)" : "var(--border)";
          return <div key={i} style={{
            width: 22, height: 22, borderRadius: "50%",
            marginLeft: i === 0 ? 0 : -7,
            border: `2px solid ${border}`, background: "var(--bg-surface)",
            position: "relative", zIndex: max - i,
          }}><Avatar name={p?.name} size={18}/></div>;
        })}
      </div>
      <span style={{ font: "500 11.5px/1 var(--font-sans)", color: "var(--fg-3)" }}>{done}/{total}</span>
    </div>
  );
};

const ResIcon = ({ resource, size = 18 }) => {
  const r = RES_T[resource];
  if (!r) return <Icon name="server" size={size}/>;
  return <Icon name={r.type === "database" ? "database" : r.type === "web" ? "web" : "server"} size={size} color="var(--fg-3)"/>;
};

// ============================================================
// SUMMARY STRIP
// ============================================================
const SummaryStrip = ({ tickets, persona }) => {
  const pending = tickets.filter(t => t.status === "pending").length;
  const approved = tickets.filter(t => t.status === "approved" && !t.expired).length;
  const expiring = tickets.filter(t => t.status === "approved" && !t.expired && t.id === "0044").length; // simulated
  const flagged = tickets.filter(t => t.status === "pending" && t.flags && t.flags.length).length;
  const tiles = persona === "admin" ? [
    { label: "Pending review",    value: pending,  color: "#1A5FA8",        sub: "Awaiting your decision" },
    { label: "Approved & active", value: approved, color: "var(--success-fg)", sub: "Currently in effect" },
    { label: "Expiring in 24h",   value: expiring, color: "var(--warning-fg)", sub: "Access ending soon" },
    { label: "Flagged requests",  value: flagged,  color: "#7B3EA8",        sub: "Anomaly detected" },
  ] : [
    { label: "Pending",        value: pending,  color: "#1A5FA8",         sub: "Awaiting approval" },
    { label: "Approved",       value: approved, color: "var(--success-fg)",sub: "Currently active" },
    { label: "Expiring soon",  value: expiring, color: "var(--warning-fg)",sub: "Access ending <24h" },
  ];
  return (
    <div style={{ padding: "16px 24px 18px", borderBottom: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: `repeat(${tiles.length}, 1fr)`, gap: 12, background: "var(--bg-app)" }}>
      {tiles.map(t => (
        <div key={t.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ font: "500 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>{t.label}</div>
          <div style={{ font: "600 24px/1 var(--font-sans)", color: t.color, marginTop: 8 }}>{t.value}</div>
          <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 4 }}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// TICKET DETAIL PANEL (slide-in 480px)
// ============================================================
const TicketDetailPanel = ({ ticket, onClose, persona, onResolved }) => {
  const r = RES_T[ticket.resource] || {};
  const p = PEOPLE_T[ticket.requesterId] || { name: "Unknown" };
  const [mode, setMode] = React.useState(null);     // null | approve | reject | escalate | revoke
  const [approveFrom, setApproveFrom] = React.useState(ticket.windowFrom);
  const [approveTo,   setApproveTo]   = React.useState(ticket.windowTo);
  const [approveCred, setApproveCred] = React.useState(ticket.credential);
  const [note, setNote]               = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");

  const status = ticket.status;
  const confirm = (decision) => { onResolved?.(ticket.id, decision, { from: approveFrom, to: approveTo, cred: approveCred, note, reason: rejectReason }); setMode(null); };

  const SectionLabel = ({ children }) => (
    <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>{children}</div>
  );

  const Row = ({ k, children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "6px 0", alignItems: "flex-start" }}>
      <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)" }}>{k}</div>
      <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-1)" }}>{children}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40, animation: "fadeIn 120ms ease-out" }}/>
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
        background: "var(--bg-app)", borderLeft: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)", zIndex: 41, display: "flex", flexDirection: "column",
        animation: "slideInRight 160ms ease-out",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>Ticket #{ticket.id}</span>
              <TicketStatusBadge status={ticket.expired ? "expired" : status}/>
              {ticket.flags && ticket.flags.length > 0 && <AnomalyBadge flags={ticket.flags}/>}
            </div>
            <div style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-4)" }}>Submitted {ticket.requestedAtFull}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 18 }}>

          {/* Risk signals — admin only, only if flagged */}
          {persona === "admin" && ticket.flags && ticket.flags.length > 0 && (
            <div style={{ padding: 12, background: "color-mix(in oklch, #7B3EA8 10%, transparent)", border: "1px solid color-mix(in oklch, #7B3EA8 30%, transparent)", borderRadius: 8, marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: "#7B3EA8", fontSize: 13 }}>⚑</span>
                <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "#7B3EA8" }}>This request was flagged for review</span>
              </div>
              {ticket.flags.map(f => (
                <div key={f} style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-2)", paddingLeft: 18 }}>• {ANOMALY_REASONS[f]}</div>
              ))}
            </div>
          )}

          {/* Section 1: request summary */}
          <SectionLabel>{persona === "admin" ? "Request summary" : "Your request"}</SectionLabel>
          <div style={{ marginBottom: 22 }}>
            {persona === "admin" && (
              <Row k="Requester">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={p.name} size={22}/>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span className="badge">{p.role}</span>
                </div>
              </Row>
            )}
            <Row k="Resource">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ResIcon resource={ticket.resource} size={14}/>
                <span style={{ fontWeight: 500 }}>{ticket.resource}</span>
                <span style={{ color: "var(--fg-4)", fontSize: 12 }}>— {r.host}</span>
              </div>
            </Row>
            <Row k="Criticality">
              <span className="badge" style={{
                background: r.crit === "critical" ? "var(--danger-soft)" : r.crit === "high" ? "var(--warning-soft)" : "var(--bg-surface-2)",
                color:      r.crit === "critical" ? "var(--danger-fg)"   : r.crit === "high" ? "var(--warning-fg)"  : "var(--fg-2)",
                borderColor: "transparent", textTransform: "capitalize",
              }}>{r.crit}</span>
            </Row>
            <Row k="Access window">
              {ticket.windowType === "One Time" ? "One Time — expires after first session" : <>{ticket.windowFrom} → {ticket.windowTo}</>}
            </Row>
            <Row k="Credential">
              <span className="t-mono" style={{ fontSize: 12, color: "var(--brand-fg)" }}>{ticket.credential}</span>
            </Row>
            <Row k="Reason">
              <div style={{ lineHeight: 1.55 }}>{ticket.reason}</div>
            </Row>
            <Row k="Requested on">{ticket.requestedAtFull}</Row>
          </div>

          {/* Section 3: approval chain */}
          <SectionLabel>Approval chain</SectionLabel>
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, font: "500 12px/1 var(--font-sans)", color: "var(--fg-3)" }}>
              {ticket.approvers.filter(a => a.state === "approved").length} of {ticket.approvers.length} approvals received
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ticket.approvers.map((a, i) => {
                const ap = PEOPLE_T[a.pid] || {};
                return (
                  <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === ticket.approvers.length - 1 ? 0 : 12, position: "relative" }}>
                    {i < ticket.approvers.length - 1 && <div style={{ position: "absolute", left: 14, top: 26, bottom: 0, width: 1, background: "var(--border)" }}/>}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flex: "none", zIndex: 1,
                      background: a.state === "approved" ? "var(--success-soft)" : a.state === "rejected" ? "var(--danger-soft)" : "var(--bg-surface-2)",
                      color:      a.state === "approved" ? "var(--success-fg)"  : a.state === "rejected" ? "var(--danger-fg)"   : "var(--fg-3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name={a.state === "approved" ? "check" : a.state === "rejected" ? "x" : "clock"} size={13}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{ap.name}</div>
                      <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--fg-3)" }}>
                        {ap.role} · {a.state === "approved" ? `Approved ${a.at}` : a.state === "rejected" ? `Rejected ${a.at}` : "Awaiting"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: admin actions */}
          {persona === "admin" && status === "pending" && (
            <>
              <SectionLabel>Action</SectionLabel>
              {!mode && (
                <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" style={{ background: "var(--success)", borderColor: "transparent" }} onClick={() => setMode("approve")}><Icon name="check" size={13}/> Approve</button>
                  <button className="btn" style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }} onClick={() => setMode("reject")}>Reject</button>
                  <button className="btn btn-ghost" onClick={() => setMode("escalate")}>Escalate</button>
                </div>
              )}

              {mode === "approve" && (
                <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 18, background: "var(--bg-surface)" }}>
                  <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 12 }}>Approve request</div>
                  <div className="field">
                    <label className="field-label">Access window <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <input className="input" value={approveFrom} onChange={e => setApproveFrom(e.target.value)} placeholder="From"/>
                      <input className="input" value={approveTo} onChange={e => setApproveTo(e.target.value)} placeholder="Until"/>
                    </div>
                    <span className="field-help">You can modify the window before approving.</span>
                  </div>
                  <div className="field">
                    <label className="field-label">Credential <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                    <Select value={approveCred} onChange={setApproveCred} options={[
                      [ticket.credential, ticket.credential],
                      ["prod_mysql_ro", "prod_mysql_ro (read-only)"],
                      ["linux_admin", "linux_admin"],
                    ]}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Note to requester <span style={{ color: "var(--fg-4)" }}>(optional)</span></label>
                    <textarea className="input" rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="This will be shown to the requester"/>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
                    <div style={{ flex: 1 }}/>
                    <button className="btn btn-primary" style={{ background: "var(--success)", borderColor: "transparent" }} onClick={() => confirm("approved")}>Confirm approval</button>
                  </div>
                </div>
              )}

              {mode === "reject" && (
                <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 18, background: "var(--bg-surface)" }}>
                  <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 12 }}>Reject request</div>
                  <div className="field">
                    <label className="field-label">Rejection reason <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                    <textarea className="input" rows="3" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="This reason will be shown to the requester"/>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
                    <div style={{ flex: 1 }}/>
                    <button className="btn btn-danger" disabled={!rejectReason.trim()} onClick={() => confirm("rejected")}>Confirm rejection</button>
                  </div>
                </div>
              )}

              {mode === "escalate" && (
                <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 18, background: "var(--bg-surface)" }}>
                  <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--fg-1)", marginBottom: 12 }}>Escalate request</div>
                  <div className="field">
                    <label className="field-label">Assign to <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                    <Select value="mohak" onChange={() => {}} options={[
                      ["mohak", "Mohak Sharma (IT Ops Lead)"],
                      ["security-team", "Security team"],
                    ]}/>
                  </div>
                  <div className="field">
                    <label className="field-label">Note <span style={{ color: "var(--fg-4)" }}>(optional)</span></label>
                    <textarea className="input" rows="2"/>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setMode(null)}>Cancel</button>
                    <div style={{ flex: 1 }}/>
                    <button className="btn btn-primary" onClick={() => confirm("escalated")}>Escalate</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* End-user status content */}
          {persona === "enduser" && (
            <>
              <SectionLabel>Status</SectionLabel>
              <div style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 18, background: "var(--bg-surface)" }}>
                {status === "pending" && (
                  <>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "#1A5FA8", marginBottom: 6 }}>Waiting for approval</div>
                    <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>Expected response: within 4 hours.</div>
                  </>
                )}
                {status === "approved" && !ticket.expired && (
                  <>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--success-fg)", marginBottom: 6 }}>✓ Access granted</div>
                    <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>Active from {ticket.windowFrom} to {ticket.windowTo}.</div>
                    <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>Approved by {PEOPLE_T[ticket.approvedBy]?.name} on {ticket.approvedAt}</div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}><Icon name="arrow-right" size={11}/> Go to my resources</button>
                  </>
                )}
                {status === "rejected" && (
                  <>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--danger-fg)", marginBottom: 6 }}>Access was not approved</div>
                    <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 8 }}>Rejected by {PEOPLE_T[ticket.rejectedBy]?.name} on {ticket.rejectedAt}</div>
                    <div style={{ padding: "10px 12px", background: "var(--danger-soft)", borderRadius: 6, color: "var(--danger-fg)", font: "500 12.5px/1.5 var(--font-sans)" }}>
                      <span style={{ font: "700 10.5px/1 var(--font-sans)", textTransform: "uppercase", letterSpacing: 0.6, opacity: 0.8, display: "block", marginBottom: 4 }}>Reason</span>
                      {ticket.rejectReason}
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}><Icon name="plus" size={11}/> Request again</button>
                  </>
                )}
                {ticket.expired && (
                  <>
                    <div style={{ font: "600 13px/1.3 var(--font-sans)", color: "var(--fg-2)", marginBottom: 6 }}>Access period has ended</div>
                    <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Was active from {ticket.windowFrom} to {ticket.windowTo}.</div>
                    <button className="btn btn-sm" style={{ marginTop: 12 }}><Icon name="plus" size={11}/> Request access again</button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Revoke (admin only, approved) */}
          {persona === "admin" && status === "approved" && !ticket.expired && (
            <div style={{ marginBottom: 18 }}>
              <button className="btn" style={{ color: "var(--danger-fg)", width: "100%" }} onClick={() => setMode("revoke")}>Revoke access</button>
            </div>
          )}

          {/* Section 5: Audit trail */}
          <SectionLabel>Activity</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 22 }}>
            {[
              { t: ticket.requestedAtFull, txt: `Request submitted by ${p.name}`, icon: "plus" },
              ticket.approvers.find(a => a.state === "approved") ? { t: ticket.approvers.find(a => a.state === "approved").at, txt: `Viewed by ${PEOPLE_T[ticket.approvers.find(a => a.state === "approved").pid]?.name}`, icon: "user" } : null,
              status === "approved" ? { t: ticket.approvedAt, txt: `Approved by ${PEOPLE_T[ticket.approvedBy]?.name}`, icon: "check" } : null,
              status === "approved" ? { t: ticket.windowFrom, txt: "Access granted", icon: "key" } : null,
              status === "rejected" ? { t: ticket.rejectedAt, txt: `Rejected by ${PEOPLE_T[ticket.rejectedBy]?.name}`, icon: "x" } : null,
              ticket.expired ? { t: ticket.windowTo, txt: "Access expired", icon: "clock" } : null,
            ].filter(Boolean).map((ev, i, arr) => (
              <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i === arr.length - 1 ? 0 : 10, position: "relative" }}>
                {i < arr.length - 1 && <div style={{ position: "absolute", left: 9, top: 22, bottom: 0, width: 1, background: "var(--border)" }}/>}
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", zIndex: 1 }}>
                  <Icon name={ev.icon} size={10} color="var(--fg-3)"/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "500 12px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{ev.txt}</div>
                  <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>{ev.t}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Related context — admin only */}
          {persona === "admin" && (
            <>
              <SectionLabel>Related context</SectionLabel>
              <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-surface)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                <div>
                  <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>Previous tickets from {p.name}</div>
                  <div style={{ font: "600 16px/1 var(--font-sans)", color: "var(--fg-1)", marginTop: 4 }}>{p.jit7d || 0}</div>
                  <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>last 7 days for this resource</div>
                </div>
                <div>
                  <div style={{ font: "400 11px/1 var(--font-sans)", color: "var(--fg-4)" }}>Active sessions on resource</div>
                  <div style={{ font: "600 16px/1 var(--font-sans)", color: "var(--fg-1)", marginTop: 4 }}>2</div>
                  <div style={{ font: "400 11px/1.3 var(--font-sans)", color: "var(--fg-4)", marginTop: 2 }}>right now</div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 18px", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          {persona === "enduser" && status === "pending" && <button className="btn btn-ghost" style={{ color: "var(--danger-fg)" }}>Cancel request</button>}
          <div style={{ flex: 1 }}/>
          {persona === "admin" && <button className="btn btn-ghost btn-sm"><Icon name="download" size={11}/> Export ticket</button>}
        </div>

        {/* Revoke modal */}
        {mode === "revoke" && (
          <RevokeModal name={p.name} onClose={() => setMode(null)} onConfirm={() => confirm("revoked")}/>
        )}
      </aside>
    </>
  );
};

const RevokeModal = ({ name, onClose, onConfirm }) => {
  const [reason, setReason] = React.useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "90vw", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 61, padding: 20 }}>
        <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Revoke access for {name}?</div>
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 8, marginBottom: 14 }}>This will immediately end any active sessions on this resource and remove their access.</div>
        <div className="field">
          <label className="field-label">Reason for revocation <span style={{ color: "var(--danger-fg)" }}>*</span></label>
          <textarea className="input" rows="3" value={reason} onChange={e => setReason(e.target.value)}/>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={!reason.trim()} onClick={onConfirm}>Revoke access</button>
        </div>
      </div>
    </>
  );
};

// ============================================================
// REQUEST ACCESS panel (end user)
// ============================================================
const RequestAccessPanel = ({ onClose, onSubmit, adminMode = false }) => {
  const [requester, setRequester] = React.useState(adminMode ? "" : "priya");
  const [type, setType] = React.useState("database");
  const [resource, setResource] = React.useState("");
  const [windowType, setWindowType] = React.useState("Custom");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const resourceOptions = Object.entries(RES_T).filter(([_,r]) => r.type === type);
  const r = RES_T[resource];
  const valid = resource && (windowType === "One Time" || (from && to)) && reason.trim().length >= 20;

  if (submitted) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
        <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", animation: "slideInRight 160ms ease-out" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, font: "600 14px/1 var(--font-sans)", color: "var(--fg-1)" }}>{adminMode ? "Ticket created" : "Request submitted"}</div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
          </div>
          <div style={{ padding: 32, textAlign: "center", flex: 1 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--success-fg)", marginBottom: 16 }}><Icon name="check" size={26}/></div>
            <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 6 }}>Request submitted</div>
            <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)" }}>Ticket #0049 is pending approval.<br/>You'll be notified when Arjun Bansal responds.</div>
            <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-4)", marginTop: 10 }}>Expected response within 4 hours.</div>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onClose}>View my tickets</button>
          </div>
        </aside>
      </>
    );
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.18)", zIndex: 40 }}/>
      <aside style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "var(--bg-app)", borderLeft: "1px solid var(--border)", zIndex: 41, display: "flex", flexDirection: "column", animation: "slideInRight 160ms ease-out" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, font: "600 14px/1 var(--font-sans)", color: "var(--fg-1)" }}>{adminMode ? "Create ticket" : "Request access"}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>

        <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 18 }}>

          {adminMode && (
            <>
              <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step 1 · Requester</div>
              <div className="field">
                <label className="field-label">Submit on behalf of <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                <Select value={requester} onChange={setRequester} options={[["", "Select a user…"], ...Object.entries(PEOPLE_T).filter(([k]) => ["priya","rohan","aditya","sarvesh"].includes(k)).map(([k,v]) => [k, `${v.name} — ${v.role}`])]}/>
                <span className="field-help">The ticket will appear in this user's My Tickets and be attributed to them in audit.</span>
              </div>
              <div style={{ height: 4 }}/>
            </>
          )}

          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step {adminMode ? 2 : 1} · Select resource</div>

          <div className="field">
            <label className="field-label">Resource type <span style={{ color: "var(--danger-fg)" }}>*</span></label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["server","Server"],["database","Database"],["web","Web app"],["desktop","Desktop"]].map(([v,l]) => (
                <button key={v} onClick={() => { setType(v); setResource(""); }} className="btn btn-sm" style={{
                  background: type === v ? "var(--brand-soft)" : "var(--bg-surface)",
                  color: type === v ? "var(--brand-fg)" : "var(--fg-2)",
                  borderColor: type === v ? "transparent" : "var(--border)",
                }}>{l}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Resource <span style={{ color: "var(--danger-fg)" }}>*</span></label>
            <Select value={resource} onChange={setResource} options={[["", "Search resources…"], ...resourceOptions.map(([k,_]) => [k, k])]}/>
            {r && r.crit === "critical" && (
              <div style={{ marginTop: 8, padding: "8px 10px", background: "color-mix(in oklch, #7B3EA8 10%, transparent)", color: "#7B3EA8", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>⚑ This is a critical resource. Your request will require additional approval.</div>
            )}
          </div>

          <div style={{ height: 14 }}/>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step {adminMode ? 3 : 2} · Access window</div>

          <div className="field">
            <label className="field-label">Window type <span style={{ color: "var(--danger-fg)" }}>*</span></label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                { v: "Custom", e: true },
                { v: "One Time", e: true },
                { v: "Zero Day", e: false },
                { v: "Lifelong", e: false },
                { v: "Working Hours", e: false },
              ].map(o => (
                <button key={o.v} onClick={() => o.e && setWindowType(o.v)}
                  className="btn btn-sm tooltip" data-tip={!o.e ? "Not available for this resource" : undefined}
                  disabled={!o.e}
                  style={{
                    background: windowType === o.v ? "var(--brand-soft)" : "var(--bg-surface)",
                    color: !o.e ? "var(--fg-4)" : windowType === o.v ? "var(--brand-fg)" : "var(--fg-2)",
                    borderColor: windowType === o.v ? "transparent" : "var(--border)",
                    opacity: o.e ? 1 : 0.55, cursor: o.e ? "pointer" : "not-allowed",
                  }}>{o.v}</button>
              ))}
            </div>
          </div>

          {windowType === "Custom" && (
            <>
              <div className="field"><label className="field-label">Access from <span style={{ color: "var(--danger-fg)" }}>*</span></label><input className="input" type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}/></div>
              <div className="field"><label className="field-label">Access until <span style={{ color: "var(--danger-fg)" }}>*</span></label><input className="input" type="datetime-local" value={to} onChange={e => setTo(e.target.value)}/><span className="field-help">Maximum allowed: 48 hours for this resource</span></div>
            </>
          )}
          {windowType === "One Time" && <div style={{ padding: 10, background: "var(--bg-surface-2)", borderRadius: 6, fontSize: 12.5, color: "var(--fg-3)", marginBottom: 14 }}>Access will expire after your first session ends.</div>}

          <div style={{ height: 4 }}/>
          <div style={{ font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>Step {adminMode ? 4 : 3} · Justification</div>

          <div className="field">
            <label className="field-label">Reason <span style={{ color: "var(--danger-fg)" }}>*</span></label>
            <textarea className="input" rows="4" value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe why you need access, what you'll be doing, and for how long."/>
            <span className="field-help" style={{ color: reason.length < 20 ? "var(--fg-4)" : "var(--success-fg)" }}>{reason.length}/20 characters minimum</span>
          </div>

          {resource && reason.length >= 20 && (
            <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-surface)", marginTop: 8 }}>
              <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>What you're requesting</div>
              <div style={{ font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{resource}</div>
              <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginTop: 2 }}>{windowType === "Custom" ? `${from || "—"} → ${to || "—"}` : windowType}</div>
              <div style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--fg-4)", marginTop: 6 }}>
                Reviewed by: Arjun Bansal (Security Admin){r && r.crit === "critical" ? ", Mohak Sharma (IT Ops Lead)" : ""}
                <br/>Expected response: 4 hours
              </div>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: "12px 18px", display: "flex", gap: 8, background: "var(--bg-surface)" }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-primary" disabled={!valid || (adminMode && !requester)} onClick={() => { setSubmitted(true); onSubmit?.(); }}>{adminMode ? "Create ticket" : "Submit request"}</button>
        </div>
      </aside>
    </>
  );
};

// ============================================================
// TICKET SETTINGS (3 tabs)
// ============================================================
const TicketSettingsPage = ({ onClose }) => {
  const [tab, setTab] = React.useState("resource");

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader
        breadcrumb={["Tickets & approvals", "Settings"]}
        title="Ticket settings"
        description="Control which resources users can request, what info they provide, and who approves."
        actions={<>
          <button className="btn btn-ghost" onClick={onClose}>Back to queue</button>
          <button className="btn btn-primary">Save changes</button>
        </>}
      />
      <div style={{ padding: "10px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 2 }}>
        {[
          { id: "resource", label: "Resource settings" },
          { id: "columns", label: "Column settings" },
          { id: "approval", label: "Approval settings" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: `${tab === t.id ? 600 : 500} 13px/1 var(--font-sans)`,
            borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {tab === "resource" && <ResourceSettingsTab/>}
        {tab === "columns"  && <ColumnSettingsTab/>}
        {tab === "approval" && <ApprovalSettingsTab/>}
      </div>
    </div>
  );
};

const ResourceSettingsTab = () => {
  const [vals, setVals] = React.useState({ database: "allocated", server: "all", web: "allocated", desktop: "hidden" });
  const labels = { database: "Databases", server: "Servers", web: "Web applications", desktop: "Desktop applications" };
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 18 }}>Choose which resources end users can raise tickets for, per resource type.</div>
      {Object.entries(labels).map(([k, l]) => (
        <div key={k} className="card" style={{ marginBottom: 12, padding: 16 }}>
          <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)", marginBottom: 4 }}>{l} list</div>
          <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)", marginBottom: 10 }}>Which {l.toLowerCase()} can users request access to via ticket?</div>
          <Select value={vals[k]} onChange={v => setVals({...vals, [k]: v})} options={[
            ["allocated", "Show allocated only — user sees only " + l.toLowerCase() + " they're already mapped to"],
            ["all",       "Show all — user sees all " + l.toLowerCase() + " in PAM"],
            ["hidden",    "Hidden — users cannot raise tickets for " + l.toLowerCase()],
          ]}/>
        </div>
      ))}
    </div>
  );
};

const ColumnSettingsTab = () => {
  const SYSTEM = [
    { type: "system", label: "Resource type",  required: true },
    { type: "system", label: "Resource name",  required: true },
    { type: "system", label: "Access from",    required: true },
    { type: "system", label: "Access until",   required: true },
    { type: "system", label: "Reason",         required: true },
  ];
  const [custom, setCustom] = React.useState([
    { id: 1, type: "dropdown", label: "Change ticket #",       required: true,  options: ["INC-12345","CHG-9012","RFC-5567"] },
    { id: 2, type: "paragraph", label: "Rollback plan",        required: false },
  ]);
  const FIELD_TYPES = [
    { type: "text",      label: "Single line text", icon: "T" },
    { type: "paragraph", label: "Paragraph text",   icon: "¶" },
    { type: "dropdown",  label: "Dropdown",         icon: "▾" },
    { type: "number",    label: "Number",           icon: "123" },
    { type: "checkbox",  label: "Checkbox",         icon: "☑" },
    { type: "radio",     label: "Radio button",     icon: "◎" },
  ];
  const addField = (type) => setCustom(c => [...c, { id: Date.now(), type, label: "Field label", required: false, options: type === "dropdown" || type === "radio" ? ["Option 1"] : undefined }]);
  const remove = (id) => setCustom(c => c.filter(f => f.id !== id));
  const toggleReq = (id) => setCustom(c => c.map(f => f.id === id ? {...f, required: !f.required} : f));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18, maxWidth: 1040 }}>
      <div>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Ticket creation form preview</div>
        <div className="card" style={{ padding: 16 }}>
          {SYSTEM.map((f, i) => (
            <div key={i} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, marginBottom: 6, background: "var(--bg-surface-2)", display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
              <Icon name="lock" size={11} color="var(--fg-4)"/>
              <span style={{ flex: 1, font: "500 12.5px/1.4 var(--font-sans)", color: "var(--fg-2)" }}>{f.label} <span style={{ color: "var(--danger-fg)" }}>*</span></span>
              <span style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6 }}>System</span>
            </div>
          ))}
          <div style={{ borderTop: "1px dashed var(--border)", margin: "10px 0", paddingTop: 6 }}/>
          {custom.length === 0 && <div style={{ padding: 14, textAlign: "center", color: "var(--fg-4)", fontSize: 12 }}>Drag field types here to add custom fields</div>}
          {custom.map(f => (
            <div key={f.id} style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, marginBottom: 6, background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="grip" size={11} color="var(--fg-4)"/>
              <span style={{ font: "500 10px/1 var(--font-sans)", color: "var(--brand-fg)", textTransform: "uppercase", letterSpacing: 0.5, padding: "2px 6px", background: "var(--brand-soft)", borderRadius: 4 }}>{f.type}</span>
              <input className="input" value={f.label} onChange={e => setCustom(c => c.map(x => x.id === f.id ? {...x, label: e.target.value} : x))} style={{ flex: 1, height: 26, fontSize: 12.5 }}/>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--fg-3)", cursor: "pointer" }}>
                <input type="checkbox" checked={f.required} onChange={() => toggleReq(f.id)} style={{ accentColor: "var(--brand)" }}/>
                Required
              </label>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => remove(f.id)}><Icon name="x" size={11}/></button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn btn-primary">Save column settings</button>
          <button className="btn btn-ghost" onClick={() => setCustom([])}>Reset to default</button>
        </div>
      </div>

      <div>
        <div style={{ font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Ticket attributes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {FIELD_TYPES.map(ft => (
            <button key={ft.type} onClick={() => addField(ft.type)} style={{
              padding: "12px 10px", borderRadius: 6, border: "1px solid var(--border)",
              background: "var(--bg-surface)", cursor: "pointer", textAlign: "left",
              display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-soft)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
            >
              <span style={{ font: "600 14px/1 var(--font-mono)", color: "var(--brand-fg)" }}>{ft.icon}</span>
              <span style={{ font: "500 12px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{ft.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ApprovalSettingsTab = () => {
  const [rows, setRows] = React.useState([
    { id: 1, role: "Security Admin", users: ["arjun"],          min: 1 },
    { id: 2, role: "IT Ops Lead",    users: ["mohak"],          min: 1 },
  ]);
  const [sla, setSla] = React.useState({ value: 4, unit: "hours", action: "Notify requester", allowModify: true });

  return (
    <div style={{ maxWidth: 760 }}>
      {rows.length === 0 ? (
        <div style={{ padding: 18, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 8, marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="alert" size={16} style={{ marginTop: 2 }}/>
          <div>
            <div style={{ font: "600 13px/1.3 var(--font-sans)" }}>No approval chain configured</div>
            <div style={{ font: "400 12.5px/1.5 var(--font-sans)", marginTop: 3 }}>Any request will be granted without review.</div>
          </div>
        </div>
      ) : (
        <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-3)", marginBottom: 16 }}>Define the chain of roles that must approve before access is granted. Approvals are sequential — top to bottom.</div>
      )}

      {rows.map((row, i) => (
        <React.Fragment key={row.id}>
          <div className="card" style={{ padding: 16, marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--brand-soft)", color: "var(--brand-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "600 11px/1 var(--font-sans)" }}>{i + 1}</span>
              <div style={{ flex: 1, font: "600 13px/1 var(--font-sans)", color: "var(--fg-1)" }}>Approval level {i + 1}</div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRows(r => r.filter(x => x.id !== row.id))} style={{ color: "var(--danger-fg)" }}><Icon name="trash" size={12}/></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: 12 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Role <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                <Select value={row.role} onChange={v => setRows(rr => rr.map(x => x.id === row.id ? {...x, role: v} : x))} options={[["Security Admin","Security Admin"],["IT Ops Lead","IT Ops Lead"],["Operator","Operator"]]}/>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Approvers <span style={{ color: "var(--danger-fg)" }}>*</span></label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: 5, border: "1px solid var(--border)", borderRadius: 6, minHeight: 32, background: "var(--bg-surface)" }}>
                  {row.users.map(u => <span key={u} className="badge badge-brand" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{PEOPLE_T[u]?.name}<Icon name="x" size={9}/></span>)}
                  <span style={{ font: "400 11.5px/1 var(--font-sans)", color: "var(--fg-4)", padding: "4px 6px", cursor: "pointer" }}>+ add user</span>
                </div>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Min. approvals</label>
                <input className="input" type="number" value={row.min} min="1" max={row.users.length} onChange={e => setRows(rr => rr.map(x => x.id === row.id ? {...x, min: +e.target.value} : x))}/>
              </div>
            </div>
          </div>
          {i < rows.length - 1 && <div style={{ height: 18, width: 2, background: "var(--border)", margin: "0 0 0 27px" }}/>}
        </React.Fragment>
      ))}

      <button className="btn" style={{ marginTop: 14 }} onClick={() => setRows(r => [...r, { id: Date.now(), role: "Operator", users: [], min: 1 }])}><Icon name="plus" size={12}/> Add role</button>

      <div style={{ marginTop: 28, font: "600 11px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Global approval settings</div>
      <div className="card" style={{ padding: 16 }}>
        <div className="field">
          <label className="field-label">Approval SLA</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" type="number" value={sla.value} onChange={e => setSla(s => ({...s, value: +e.target.value}))} style={{ width: 100 }}/>
            <Select value={sla.unit} onChange={v => setSla(s => ({...s, unit: v}))} options={[["hours","hours"],["days","days"]]}/>
          </div>
          <span className="field-help">Send escalation alert if no response within this window.</span>
        </div>
        <div className="field">
          <label className="field-label">SLA breach action</label>
          <Select value={sla.action} onChange={v => setSla(s => ({...s, action: v}))} options={[
            ["Notify requester","Notify requester"],
            ["Auto-escalate to next approver","Auto-escalate to next approver"],
            ["Auto-reject","Auto-reject"],
          ]}/>
        </div>
        <div className="field" style={{ marginBottom: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <Toggle checked={sla.allowModify} onChange={v => setSla(s => ({...s, allowModify: v}))}/>
          <div>
            <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Allow admin to modify access window when approving</div>
            <div style={{ font: "400 12px/1.4 var(--font-sans)", color: "var(--fg-3)" }}>Approvers can shorten or shift the requested window before granting.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN SCREEN — Queue + My Tickets + Settings switcher
// ============================================================
const TicketsScreenV3 = ({ empty, defaultView = "queue", personaLock }) => {
  const [view, setView]               = React.useState(defaultView);      // "queue" | "mine" | "settings"
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [q, setQ]                     = React.useState("");
  const [selectedId, setSelectedId]   = React.useState(null);
  const [resolved, setResolved]       = React.useState({});
  const [showRequest, setShowRequest] = React.useState(false);
  const [showCreate, setShowCreate]   = React.useState(false);
  const [columnsOpen, setColumnsOpen] = React.useState(false);
  const ALL_COLS = [
    { id: "ticket",    label: "Ticket",        required: true },
    { id: "requester", label: "Requester",     required: false },
    { id: "resource",  label: "Resource",      required: true },
    { id: "type",      label: "Type",          required: false },
    { id: "window",    label: "Access window", required: false },
    { id: "reason",    label: "Reason",        required: false },
    { id: "status",    label: "Status",        required: true },
    { id: "flag",      label: "Flag",          required: false },
    { id: "approvers", label: "Approvers",     required: false },
    { id: "sla",       label: "SLA",           required: false },
  ];
  const [visibleCols, setVisibleCols] = React.useState(new Set(ALL_COLS.map(c => c.id)));
  const toggleCol = (id) => setVisibleCols(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const all = (empty ? [] : SEED_TICKETS_V3).map(t => resolved[t.id] ? { ...t, status: resolved[t.id].decision, _resolution: resolved[t.id] } : t);
  const mineUserId = "priya"; // simulate current end user
  const visible = view === "mine" ? all.filter(t => t.requesterId === mineUserId) : all;

  let rows = visible;
  if (statusFilter !== "all") rows = rows.filter(t => t.status === statusFilter);
  if (q) { const lq = q.toLowerCase(); rows = rows.filter(t => [t.id, t.requesterId, t.resource, t.reason].some(v => v.toLowerCase().includes(lq))); }

  const selected = all.find(t => t.id === selectedId);

  if (view === "settings") {
    return <TicketSettingsPage onClose={() => setView("queue")}/>;
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <PageHeader
        title="Tickets & approvals"
        description="JIT access requests, multi-level approvals, and break-glass — with anomaly flagging."
        actions={<>
          <button className="btn btn-icon" title="Ticket settings" onClick={() => setView("settings")}><Icon name="settings" size={14}/></button>
          {view === "mine" ? (
            <button className="btn btn-primary" onClick={() => setShowRequest(true)}><Icon name="plus" size={13}/> Request access</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={13}/> Create ticket</button>
          )}
        </>}
      />

      {/* Sub-tabs */}
      <div style={{ padding: "0 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[{ id: "queue", label: "Queue", count: all.length }, { id: "mine", label: "My tickets", count: all.filter(t => t.requesterId === mineUserId).length }].map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setStatusFilter("all"); }} style={{
            padding: "10px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: view === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: `${view === t.id ? 600 : 500} 13px/1 var(--font-sans)`,
            borderBottom: `2px solid ${view === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            <span style={{ padding: "1px 7px", borderRadius: 999, background: view === t.id ? "var(--brand-soft)" : "var(--bg-surface-2)", color: view === t.id ? "var(--brand-fg)" : "var(--fg-3)", font: "600 10.5px/1.4 var(--font-sans)" }}>{t.count}</span>
          </button>
        ))}
      </div>

      {!empty && <SummaryStrip tickets={visible} persona={view === "mine" ? "enduser" : "admin"}/>}

      {/* Toolbar */}
      <div style={{ padding: "10px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 260 }}>
          <Icon name="search" size={13} color="var(--fg-4)" style={{ position: "absolute", left: 10, top: 11 }}/>
          <input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search tickets…" style={{ paddingLeft: 30, height: 32, fontSize: 12.5 }}/>
        </div>
        <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={[["all","All"],["pending","Pending"],["approved","Approved"],["rejected","Rejected"],["expired","Expired"]]}/>
        <FilterDropdown label="Resource" value="any" onChange={() => {}} options={[["any","Any"],...Object.keys(RES_T).map(k => [k,k])]}/>
        {view === "queue" && <FilterDropdown label="Requester" value="any" onChange={() => {}} options={[["any","Any"],...Object.entries(PEOPLE_T).filter(([k]) => ["priya","rohan","aditya","sarvesh"].includes(k)).map(([k,v]) => [k,v.name])]}/>}
        <FilterDropdown label="Date" value="any" onChange={() => {}} options={[["any","Any time"],["today","Today"],["7d","Last 7 days"],["30d","Last 30 days"]]}/>
        <div style={{ flex: 1 }}/>
        <button className="btn btn-sm"><Icon name="download" size={11}/> Export</button>
        <div style={{ position: "relative" }}>
          <button className="btn btn-sm btn-icon" onClick={() => setColumnsOpen(o => !o)} title="Customize columns"><Icon name="columns" size={12}/></button>
          {columnsOpen && (
            <>
              <div onClick={() => setColumnsOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}/>
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 31, width: 240, background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-lg)", padding: 6 }}>
                <div style={{ padding: "6px 10px 8px", font: "600 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.6, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>Shown columns</div>
                {ALL_COLS.map(c => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", cursor: c.required ? "not-allowed" : "pointer", borderRadius: 5, opacity: c.required ? 0.55 : 1 }}
                    onMouseEnter={e => !c.required && (e.currentTarget.style.background = "var(--bg-surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <input type="checkbox" checked={visibleCols.has(c.id)} disabled={c.required} onChange={() => !c.required && toggleCol(c.id)} style={{ accentColor: "var(--brand)" }}/>
                    <span style={{ flex: 1, font: "500 12.5px/1 var(--font-sans)", color: "var(--fg-1)" }}>{c.label}</span>
                    {c.required && <span style={{ font: "500 10px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.5 }}>Required</span>}
                  </label>
                ))}
                <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 4, padding: "6px 10px 4px", display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setVisibleCols(new Set(ALL_COLS.map(c => c.id)))}>Show all</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setVisibleCols(new Set(ALL_COLS.filter(c => c.required).map(c => c.id)))}>Reset</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        {rows.length === 0 ? (
          <EmptyState
            icon={view === "mine" ? "key" : "tickets"}
            title={view === "mine" ? "You haven't requested any access yet" : "No tickets to review"}
            description={view === "mine" ? "Request access to servers, databases, or applications you need to work with." : "When users request access to resources, their requests will appear here."}
            action={view === "mine" ? <button className="btn btn-primary" onClick={() => setShowRequest(true)}><Icon name="plus" size={13}/> Request access</button> : null}
          />
        ) : view === "queue" ? (
          <QueueTable rows={rows} onOpen={setSelectedId} visibleCols={visibleCols}/>
        ) : (
          <MyTicketsTable rows={rows} onOpen={setSelectedId}/>
        )}
      </div>

      {selected && <TicketDetailPanel
        ticket={selected}
        onClose={() => setSelectedId(null)}
        persona={view === "mine" ? "enduser" : "admin"}
        onResolved={(id, decision, payload) => { setResolved(r => ({...r, [id]: { decision, ...payload, by: "arjun", at: "just now" }})); setSelectedId(null); }}
      />}
      {showRequest && <RequestAccessPanel onClose={() => setShowRequest(false)}/>}
      {showCreate  && <RequestAccessPanel onClose={() => setShowCreate(false)} adminMode={true}/>}
    </div>
  );
};

const QueueTable = ({ rows, onOpen, visibleCols = new Set(["ticket","requester","resource","type","window","reason","status","flag","approvers","sla"]) }) => {
  const show = (id) => visibleCols.has(id);
  const [sel, setSel] = React.useState(new Set());
  const toggle = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = rows.length > 0 && rows.every(r => sel.has(r.id));
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(rows.map(r => r.id)));

  return (
    <>
      {sel.size > 0 && (
        <div style={{ padding: "10px 24px", background: "var(--brand-soft)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>{sel.size} selected</span>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm btn-primary" style={{ background: "var(--success)", borderColor: "transparent" }}>Approve selected</button>
          <button className="btn btn-sm" style={{ color: "var(--danger-fg)", borderColor: "var(--danger-fg)" }}>Reject selected</button>
          <button className="btn btn-sm">Export selected</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
      <table className="table">
        <thead><tr>
          <th style={{ width: 32 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: "var(--brand)" }}/></th>
          {show("ticket")    && <th>Ticket</th>}
          {show("requester") && <th>Requester</th>}
          {show("resource")  && <th>Resource</th>}
          {show("type")      && <th>Type</th>}
          {show("window")    && <th>Access window</th>}
          {show("reason")    && <th>Reason</th>}
          {show("status")    && <th>Status</th>}
          {show("flag")      && <th>Flag</th>}
          {show("approvers") && <th>Approvers</th>}
          {show("sla")       && <th>SLA</th>}
          <th></th>
        </tr></thead>
        <tbody>
          {rows.map(t => {
            const r = RES_T[t.resource] || {};
            const p = PEOPLE_T[t.requesterId] || {};
            return (
              <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer" }}>
                <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={sel.has(t.id)} onChange={() => toggle(t.id)} style={{ accentColor: "var(--brand)" }}/></td>
                {show("ticket") && <td>
                  <div style={{ font: "600 12.5px/1 var(--font-sans)", color: "var(--brand-fg)" }}>#{t.id}</div>
                  <div className="t-tiny" style={{ color: "var(--fg-4)", marginTop: 2 }}>{t.requestedAt}</div>
                </td>}
                {show("requester") && <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={p.name} size={22}/>
                    <span style={{ fontWeight: 500, fontSize: 12.5 }}>{p.name}</span>
                  </div>
                </td>}
                {show("resource") && <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ResIcon resource={t.resource} size={14}/>
                    <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{t.resource}</span>
                  </div>
                </td>}
                {show("type") && <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>}
                {show("window") && <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{t.windowType === "One Time" ? "One Time" : `${t.windowFrom.split(" ")[0]} ${t.windowFrom.split(" ")[1]} → ${t.windowTo.split(" ")[0]} ${t.windowTo.split(" ")[1]}`}</td>}
                {show("reason") && <td style={{ color: "var(--fg-2)", fontSize: 12.5, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.reason}</td>}
                {show("status") && <td><TicketStatusBadge status={t.expired ? "expired" : t.status}/></td>}
                {show("flag") && <td><AnomalyBadge flags={t.flags}/></td>}
                {show("approvers") && <td><ApproverStack approvers={t.approvers}/></td>}
                {show("sla") && <td><SLABadge remaining={t.slaRemaining} status={t.status}/></td>}
                <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
                  <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const MyTicketsTable = ({ rows, onOpen }) => (
  <table className="table">
    <thead><tr>
      <th>Resource</th>
      <th>Type</th>
      <th>Access window</th>
      <th>Reason</th>
      <th>Requested</th>
      <th>Status</th>
      <th>Approved by</th>
      <th></th>
    </tr></thead>
    <tbody>
      {rows.map(t => {
        const r = RES_T[t.resource] || {};
        const expiringSoon = t.id === "0044";
        return (
          <tr key={t.id} onClick={() => onOpen(t.id)} style={{ cursor: "pointer", borderLeft: expiringSoon ? "3px solid var(--warning-fg)" : "3px solid transparent" }}>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ResIcon resource={t.resource} size={14}/>
                <span className="t-mono" style={{ fontSize: 12, color: "var(--fg-1)", fontWeight: 500 }}>{t.resource}</span>
              </div>
            </td>
            <td><span className="badge" style={{ textTransform: "capitalize" }}>{r.type}</span></td>
            <td className="t-tiny" style={{ color: "var(--fg-2)" }}>{t.windowType === "One Time" ? "One Time" : `${t.windowFrom} → ${t.windowTo}`}</td>
            <td style={{ color: "var(--fg-2)", fontSize: 12.5, maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.reason}</td>
            <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{t.requestedAt}</td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TicketStatusBadge status={t.expired ? "expired" : t.status}/>
                {expiringSoon && <TicketStatusBadge status="expiring"/>}
              </div>
            </td>
            <td>
              {t.approvedBy ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar name={PEOPLE_T[t.approvedBy]?.name} size={18}/>
                  <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{PEOPLE_T[t.approvedBy]?.name}</span>
                </div>
              ) : <span style={{ color: "var(--fg-4)" }}>—</span>}
            </td>
            <td onClick={e => e.stopPropagation()} style={{ textAlign: "right" }}>
              <button className="btn btn-ghost btn-sm btn-icon"><Icon name="more-h" size={13}/></button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// ============================================================
// Helpers (Toggle/Select reuse — minimal versions if not already on window)
// ============================================================
if (!window.Toggle) {
  window.Toggle = ({ checked, onChange }) => (
    <button onClick={() => onChange(!checked)} style={{
      width: 32, height: 18, borderRadius: 999, padding: 2,
      background: checked ? "var(--brand)" : "var(--border)", border: "none", cursor: "pointer",
      display: "inline-flex", alignItems: "center",
      flex: "none",
    }}>
      <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", transform: `translateX(${checked ? 14 : 0}px)`, transition: "transform 120ms" }}/>
    </button>
  );
}

window.TicketsScreenV2 = TicketsScreenV3; // override the old registration
window.TicketsScreenV3 = TicketsScreenV3;
