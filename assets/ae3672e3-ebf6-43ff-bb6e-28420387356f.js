// End User Portal — simplified 4-item nav (Dashboard, My Resources, My Tickets, Settings)

const END_USER_NAV = [
  { id: "eu-dashboard",  icon: "dashboard", label: "Dashboard" },
  { id: "eu-resources",  icon: "resources", label: "My resources" },
  { id: "eu-tickets",    icon: "tickets",   label: "My tickets" },
  { id: "eu-settings",   icon: "settings",  label: "Settings" },
];

const EndUserSidebar = ({ active, onNav, collapsed }) => (
  <aside style={{
    width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
    background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", flex: "none",
    transition: "width 180ms ease", overflow: "hidden",
  }}>
    <div style={{
      height: "var(--topbar-h)", padding: collapsed ? "0" : "0 16px",
      display: "flex", alignItems: "center",
      justifyContent: collapsed ? "center" : "flex-start",
      borderBottom: "1px solid var(--border)",
    }}>{collapsed ? <BrandMark size={24}/> : <Logo size={22}/>}</div>
    <div style={{ flex: 1, padding: "10px 8px" }}>
      {!collapsed && <div style={{ font: "500 10.5px/1 var(--font-sans)", color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: 0.7, padding: "12px 10px 6px" }}>End user</div>}
      {END_USER_NAV.map(it => {
        const isActive = active === it.id;
        return (
          <div key={it.id} onClick={() => onNav(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: collapsed ? "8px" : "8px 10px",
            justifyContent: collapsed ? "center" : "flex-start",
            margin: "1px 0", borderRadius: 6,
            background: isActive ? "var(--brand-soft)" : "transparent",
            color: isActive ? "var(--brand-fg)" : "var(--fg-2)",
            cursor: "pointer", font: "500 13px/1 var(--font-sans)",
          }}>
            <Icon name={it.icon} size={16}/>
            {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{it.label}</span>}
          </div>
        );
      })}
    </div>
  </aside>
);

const MY_RESOURCES = [
  { id: "r1", name: "prod-db-primary",       type: "PostgreSQL", host: "10.42.18.4", port: 5432, window: "Anytime",         expires: null,         policy: "Production Database",     status: "active" },
  { id: "r2", name: "auth-server-01",        type: "Linux SSH",  host: "10.42.4.21", port: 22,   window: "Mon–Fri 09–19",   expires: null,         policy: "Production SSH Access",   status: "active",
    activeSession: { user: "Rohan Mehta", username: "rohan.mehta", email: "rohan.mehta@northwind.com", sysAccount: "auth-admin", sysUser: "root", since: "13:42 IST", duration: "37 minutes ago" } },
  { id: "r3", name: "ledger-mongo-cluster",  type: "MongoDB",    host: "10.42.18.7", port: 27017,window: "Break-glass",     expires: "in 3h 42m",  policy: "Emergency SSH Override",  status: "expiring" },
  { id: "r4", name: "stripe-webhook-key",    type: "API key",    host: "api.stripe.com", port: 443, window: "Anytime",      expires: null,         policy: "Service API Access",      status: "active" },
  { id: "r5", name: "win-rdp-bastion-02",    type: "RDP",        host: "10.42.4.42", port: 3389, window: "JIT only",        expires: "Request needed", policy: "Windows RDP Admin",   status: "request" },
];

const MY_TICKETS = [
  { id: "TKT-2104", res: "prod-db-primary", win: "12:30 — 14:30", submitted: "10 min ago", status: "approved", reason: "Emergency rollback of failed migration." },
  { id: "TKT-2087", res: "win-rdp-bastion-02", win: "Tomorrow 09:00 — 17:00", submitted: "Yesterday", status: "pending", sla: "in 4h" },
  { id: "TKT-2052", res: "k8s-control-plane-aws", win: "Yesterday 15:00 — 19:00", submitted: "2 days ago", status: "approved" },
  { id: "TKT-1998", res: "data-warehouse-bastion", win: "Last Monday 09–17", submitted: "5 days ago", status: "expired" },
  { id: "TKT-1944", res: "prod-redis-primary", win: "Last week", submitted: "8 days ago", status: "rejected", rejection: "Resource is not in your assigned scope. Contact your manager to request a scope change." },
];

const EndUserDashboard = ({ onNav }) => (
  <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
    <PageHeader title="My access" description="Resources you can launch, tickets you've requested, and sessions you've run."/>
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Expiring alert */}
      <div style={{ padding: 14, background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="clock" size={16}/>
        <div style={{ flex: 1 }}>
          <div style={{ font: "600 13px/1.3 var(--font-sans)" }}>Break-glass on ledger-mongo-cluster expires in 3h 42m</div>
          <div style={{ fontSize: 12.5, marginTop: 2 }}>You'll need to file a post-incident review when the session ends.</div>
        </div>
        <button className="btn btn-sm">Open session</button>
      </div>

      {/* My active resources */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 12 }}>
          <h2 style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", margin: 0 }}>Active access</h2>
          <div style={{ flex: 1 }}/>
          <button className="btn btn-sm btn-ghost" onClick={() => onNav("eu-resources")}>View all <Icon name="chevron-right" size={11}/></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {MY_RESOURCES.filter(r => r.status !== "request").slice(0, 4).map(r => (
            <div key={r.id} className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ResourceTypeIcon type={r.type.toLowerCase().includes("ssh") ? "linux" : r.type.toLowerCase().includes("postgres") || r.type.toLowerCase().includes("mongo") ? "database" : r.type.toLowerCase().includes("rdp") ? "windows" : "api"} size={28}/>
                <div style={{ flex: 1 }}>
                  <div style={{ font: "600 13.5px/1.2 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div>
                  <div className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{r.host}:{r.port}</div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--fg-4)" }}>Window</span>
                <span style={{ color: "var(--fg-2)" }}>{r.window}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--fg-4)" }}>Policy</span>
                <span style={{ color: "var(--fg-2)" }}>{r.policy}</span>
              </div>
              {r.expires && (
                <div style={{ padding: "6px 10px", background: "var(--warning-soft)", color: "var(--warning-fg)", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                  Expires {r.expires}
                </div>
              )}
              <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}><Icon name="play" size={11}/> Launch session</button>
            </div>
          ))}
        </div>
      </div>

      {/* Pending tickets + recent sessions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="h-card">My pending tickets</span><div style={{ flex: 1 }}/><button className="btn btn-sm btn-ghost" onClick={() => onNav("eu-tickets")}>All</button></div>
          <table className="table">
            <thead><tr><th>Ticket</th><th>Resource</th><th>Window</th><th>Status</th></tr></thead>
            <tbody>
              {MY_TICKETS.filter(t => t.status === "pending" || t.status === "approved").slice(0, 3).map(t => (
                <tr key={t.id}>
                  <td><span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{t.id}</span></td>
                  <td><span className="t-mono" style={{ color: "var(--fg-2)" }}>{t.res}</span></td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{t.win}</td>
                  <td>
                    {t.status === "approved" && <span className="badge badge-success">Approved</span>}
                    {t.status === "pending" && <span className="badge badge-warning">Pending · {t.sla}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-header"><span className="h-card">Recent sessions</span></div>
          <table className="table">
            <thead><tr><th>Resource</th><th>Started</th><th>Duration</th></tr></thead>
            <tbody>
              {[
                { res: "prod-db-primary", started: "Today 11:42", dur: "23m" },
                { res: "auth-server-01",  started: "Yesterday",  dur: "1h 04m" },
                { res: "k8s-control-plane-aws", started: "2 days ago", dur: "47m" },
              ].map((s, i) => (
                <tr key={i}>
                  <td><span className="t-mono">{s.res}</span></td>
                  <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{s.started}</td>
                  <td className="t-mono">{s.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

const MyResourcesScreen = () => {
  const [launch, setLaunch] = React.useState(null);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="My resources" description="Launch sessions, request extensions, and download the XecureAccess client when needed." actions={<>
        <button className="btn"><Icon name="download" size={13}/> Download XecureAccess</button>
        <button className="btn btn-primary"><Icon name="plus" size={13}/> Request access</button>
      </>}/>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        <table className="table">
          <thead><tr><th>Resource</th><th>Type</th><th>Host</th><th>Port</th><th>Access window</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {MY_RESOURCES.map(r => (
              <tr key={r.id}>
                <td><div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{r.name}</div><div className="t-tiny" style={{ color: "var(--fg-4)" }}>{r.policy}</div></td>
                <td><span className="badge">{r.type}</span></td>
                <td className="t-mono t-tiny" style={{ color: "var(--fg-2)" }}>{r.host}</td>
                <td className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{r.port}</td>
                <td><span className="t-tiny" style={{ color: r.expires ? "var(--warning-fg)" : "var(--fg-2)", fontWeight: r.expires ? 500 : 400 }}>{r.window}{r.expires ? ` · ${r.expires}` : ""}</span></td>
                <td>
                  {r.status === "active"   && <span className="badge badge-success">Active</span>}
                  {r.status === "expiring" && <span className="badge badge-warning">Expiring</span>}
                  {r.status === "request"  && <span className="badge">Needs request</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  {r.status === "request"
                    ? <button className="btn btn-sm">Request access</button>
                    : <button className="btn btn-sm btn-primary" onClick={() => setLaunch(r)}><Icon name="play" size={11}/> Launch</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {launch && (launch.id === "r2" || launch.id === "r3" ? <FileBrowserSession onClose={() => setLaunch(null)}/> : <LaunchSessionModal resource={launch} onClose={() => setLaunch(null)}/>)}
    </div>
  );
};

const LaunchSessionModal = ({ resource, onClose }) => {
  // Phases: conflict | waiting | denied | approved | connecting
  const initial = resource.activeSession ? "conflict" : "approved";
  const [phase, setPhase]   = React.useState(initial);
  const [showOther, setShowOther] = React.useState(false);
  const [denyReason, setDenyReason] = React.useState("");
  const [cred, setCred] = React.useState("postgres-prod-su");
  const [method, setMethod] = React.useState("Web");
  const session = resource.activeSession;

  // After Request access, show the "other user" notification ~600ms later
  React.useEffect(() => {
    if (phase === "waiting") {
      const t = setTimeout(() => setShowOther(true), 600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={phase === "waiting" ? null : onClose}>
        <div onClick={e => e.stopPropagation()} className="card" style={{ width: phase === "conflict" ? 540 : phase === "denied" ? 460 : phase === "waiting" ? 460 : 520, background: "var(--bg-surface)", borderRadius: 10, boxShadow: "var(--shadow-lg)" }}>
          {phase === "conflict" && <ConflictView resource={resource} session={session} onRequest={() => setPhase("waiting")} onCancel={onClose}/>}
          {phase === "waiting"  && <WaitingView session={session} onCancel={onClose}/>}
          {phase === "denied"   && <DeniedView session={session} reason={denyReason} onClose={onClose}/>}
          {phase === "approved" && <ApprovedView session={session} onConnect={() => setPhase("connecting")} onCancel={onClose}/>}
          {phase === "connecting" && <ConnectingView resource={resource} onClose={onClose}/>}
        </div>
      </div>
      {/* Simulated "other user" perspective — appears as floating notification top-right while requester waits */}
      {showOther && phase === "waiting" && session && (
        <OtherUserNotification
          session={session}
          requestor={{ name: "Aria Chen", email: "aria.chen@northwind.com" }}
          resource={resource}
          onApprove={() => { setShowOther(false); setPhase("approved"); }}
          onDeny={(reason) => { setShowOther(false); setDenyReason(reason); setPhase("denied"); }}
        />
      )}
    </>
  );
};

// -- Conflict state: active session detected --
const ConflictView = ({ resource, session, onRequest, onCancel }) => (
  <>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--warning-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="alert-circle" size={15} color="var(--warning-fg)"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Active session detected</div>
        <div className="t-tiny" style={{ color: "var(--fg-3)", marginTop: 2 }}>{resource.name}</div>
      </div>
      <button className="btn btn-ghost btn-icon" onClick={onCancel}><Icon name="x" size={14}/></button>
    </div>
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        An active session is already in progress on this server using the same credentials. You can request access from the connected user or cancel this attempt.
      </div>
      <div className="card" style={{ padding: 0, background: "var(--bg-surface-2)", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={session.user} size={32}/>
          <div style={{ flex: 1 }}>
            <div style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{session.user}</div>
            <div className="t-tiny" style={{ color: "var(--fg-3)" }}>{session.email}</div>
          </div>
          <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success-fg)" }}/> Connected
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
          {[
            ["Username",        session.username,    true],
            ["System account",  session.sysAccount,  true],
            ["System user",     session.sysUser,     true],
            ["Connected since", `${session.since} · ${session.duration}`, false],
          ].map(([k, v, mono], i) => (
            <div key={k} style={{ padding: "10px 14px", borderTop: i > 1 ? "1px solid var(--border)" : "none", borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none" }}>
              <div className="t-tiny" style={{ color: "var(--fg-4)", marginBottom: 3 }}>{k}</div>
              <div className={mono ? "t-mono" : ""} style={{ font: mono ? "12px/1.3 var(--font-mono)" : "400 12.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onCancel}>Cancel request</button>
      <button className="btn btn-primary" onClick={onRequest}><Icon name="send" size={12}/> Request access</button>
    </div>
  </>
);

// -- Waiting state: request sent --
const WaitingView = ({ session, onCancel }) => (
  <>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
      <Spinner size={16}/>
      <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Waiting for response</div>
      <button className="btn btn-ghost btn-icon" onClick={onCancel}><Icon name="x" size={14}/></button>
    </div>
    <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--brand-soft)", animation: "pulseRing 1.6s ease-out infinite" }}/>
        <div style={{ position: "absolute", inset: 12, borderRadius: "50%", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="send" size={20} color="var(--brand-fg)"/>
        </div>
      </div>
      <div style={{ font: "500 14px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>Request sent to {session.user}</div>
      <div className="t-tiny" style={{ color: "var(--fg-3)", maxWidth: 320 }}>We've pinged them on email and in-app. You'll be notified the moment they accept or deny.</div>
    </div>
    <style>{`@keyframes pulseRing { 0% { transform: scale(0.85); opacity: 1 } 100% { transform: scale(1.4); opacity: 0 } }`}</style>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onCancel}>Cancel request</button>
    </div>
  </>
);

// -- Denied state --
const DeniedView = ({ session, reason, onClose }) => (
  <>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="x" size={15} color="var(--danger-fg)"/>
      </div>
      <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Request denied</div>
      <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={14}/></button>
    </div>
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ font: "400 13px/1.5 var(--font-sans)", color: "var(--fg-2)" }}>
        <strong style={{ color: "var(--fg-1)" }}>{session.user}</strong> has denied your access request.
      </div>
      {reason && (
        <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
          <div className="t-tiny" style={{ color: "var(--fg-4)", marginBottom: 4 }}>Reason</div>
          <div style={{ font: "400 13px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>{reason}</div>
        </div>
      )}
      <div className="t-tiny" style={{ color: "var(--fg-3)" }}>You can submit a fresh ticket for approval through your manager, or try again after the active session ends.</div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onClose}>Close</button>
      <button className="btn btn-primary"><Icon name="plus" size={12}/> Submit ticket</button>
    </div>
  </>
);

// -- Approved by other user — simple accept screen with Connect / Cancel --
const ApprovedView = ({ session, onConnect, onCancel }) => (
  <>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--success-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={15} color="var(--success-fg)"/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ font: "600 15px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Access approved</div>
      </div>
      <button className="btn btn-ghost btn-icon" onClick={onCancel}><Icon name="x" size={14}/></button>
    </div>
    <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", color: "var(--success-fg)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={26}/>
      </div>
      <div style={{ font: "500 14.5px/1.5 var(--font-sans)", color: "var(--fg-1)", maxWidth: 360 }}>
        Your request has been accepted by <strong style={{ color: "var(--fg-1)" }}>{session.user}</strong>
      </div>
      <div style={{ font: "400 12.5px/1.5 var(--font-sans)", color: "var(--fg-3)", maxWidth: 320 }}>
        Their session will be deactivated when you connect.
      </div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn btn-primary" onClick={onConnect}><Icon name="play" size={12}/> Connect</button>
    </div>
  </>
);

// -- Approved / normal launch form --
const LaunchForm = ({ resource, cred, setCred, method, setMethod, onConnect, onCancel, approvedBy }) => (
  <>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name="play" size={16} color="var(--brand-fg)"/>
      <span style={{ font: "600 15px/1 var(--font-sans)", color: "var(--fg-1)", flex: 1 }}>Launch session — {resource.name}</span>
      <button className="btn btn-ghost btn-icon" onClick={onCancel}><Icon name="x" size={14}/></button>
    </div>
    {approvedBy && (
      <div style={{ padding: "10px 20px", background: "var(--success-soft)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="check-circle" size={13} color="var(--success-fg)"/>
        <span style={{ font: "500 12.5px/1.3 var(--font-sans)", color: "var(--success-fg)" }}>{approvedBy} approved your request</span>
      </div>
    )}
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="field"><label className="field-label">Credential</label>
        <select className="input" value={cred} onChange={e => setCred(e.target.value)}>
          <option>postgres-prod-su</option><option>postgres-prod-readonly</option>
        </select>
        <span className="field-help">PAM injects credentials at the proxy. The actual password is never shown to you.</span>
      </div>
      <div className="field"><label className="field-label">Connect method</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["Web","RDP","SSH","Database client"].map(m => (
            <button key={m} type="button" onClick={() => setMethod(m)} className="btn btn-sm" style={{
              background: method === m ? "var(--brand-soft)" : "var(--bg-surface)",
              color: method === m ? "var(--brand-fg)" : "var(--fg-2)",
              borderColor: method === m ? "transparent" : "var(--border)",
            }}>{m}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 12, background: "var(--bg-surface-2)" }}>
        <div className="t-tiny" style={{ color: "var(--fg-4)", marginBottom: 6 }}>Connection details</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: "var(--fg-3)" }}>Proxy host</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>pam-proxy.northwind.com</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}><span style={{ color: "var(--fg-3)" }}>Target</span><span className="t-mono" style={{ color: "var(--fg-1)" }}>{resource.host}:{resource.port}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "var(--fg-3)" }}>Recording</span><span style={{ color: "var(--success-fg)" }}><Icon name="check" size={11}/> mandatory</span></div>
      </div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn" onClick={onCancel}>Cancel</button>
      <button className="btn btn-primary" onClick={onConnect}><Icon name="play" size={12}/> Connect</button>
    </div>
  </>
);

// -- Connecting/connected confirmation --
const ConnectingView = ({ resource, onClose }) => (
  <>
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={26} color="var(--success-fg)"/>
      </div>
      <div style={{ font: "600 16px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Session launched</div>
      <div className="t-tiny" style={{ color: "var(--fg-3)" }}>Opening connection to {resource.name} in a new tab…</div>
    </div>
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
      <button className="btn btn-primary" onClick={onClose}>Done</button>
    </div>
  </>
);

// -- Floating "other user" perspective panel (simulates Rohan Mehta receiving the request) --
const OtherUserNotification = ({ session, requestor, resource, onApprove, onDeny }) => {
  const [showDeny, setShowDeny] = React.useState(false);
  const [reason, setReason] = React.useState("Mid-migration. Please wait until 15:30 IST.");
  return (
    <div style={{
      position: "fixed", top: 16, right: 16, width: 380, zIndex: 60,
      background: "var(--bg-surface)", borderRadius: 10,
      border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      animation: "slideInRight 220ms ease-out",
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }`}</style>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg-surface-2)" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }}/>
        <span style={{ font: "600 12px/1 var(--font-sans)", color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: 0.4 }}>Demo · {session.user}'s view</span>
        <div style={{ flex: 1 }}/>
        <span className="t-tiny" style={{ color: "var(--fg-4)" }}>now</span>
      </div>
      {!showDeny ? (
        <>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Avatar name={requestor.name} size={32}/>
              <div style={{ flex: 1 }}>
                <div style={{ font: "500 13.5px/1.4 var(--font-sans)", color: "var(--fg-1)" }}>
                  <strong>{requestor.name}</strong> wants access to the session
                </div>
                <div style={{ font: "400 12px/1.5 var(--font-sans)", color: "var(--fg-3)", marginTop: 4 }}>
                  Your session will be deactivated on approval.
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8 }}>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setShowDeny(true)}>Deny</button>
            <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={onApprove}>Approve</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field"><label className="field-label">Reason for denying</label>
              <textarea className="input" rows={3} value={reason} onChange={e => setReason(e.target.value)} style={{ resize: "vertical", font: "400 13px/1.4 var(--font-sans)" }}/>
            </div>
          </div>
          <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8 }}>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setShowDeny(false)}>Back</button>
            <button className="btn btn-sm" style={{ flex: 1, background: "var(--danger)", color: "#fff", borderColor: "var(--danger)" }} onClick={() => onDeny(reason)}>Deny request</button>
          </div>
        </>
      )}
    </div>
  );
};

const MyTicketsScreen = () => {
  const [tab, setTab] = React.useState("all");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <PageHeader title="My tickets" description="Access requests you've submitted, approved windows, and rejection reasons."
        actions={<button className="btn btn-primary"><Icon name="plus" size={13}/> Request access</button>}/>
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[{id:"all",label:"All"},{id:"pending",label:"Pending"},{id:"approved",label:"Approved"},{id:"rejected",label:"Rejected"},{id:"expired",label:"Expired"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 14px", marginBottom: -1, border: "none", background: "transparent",
            color: tab === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${tab === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>
      <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
        <table className="table">
          <thead><tr><th>Ticket</th><th>Resource</th><th>Window</th><th>Submitted</th><th>Status</th><th>Detail</th><th></th></tr></thead>
          <tbody>{MY_TICKETS.filter(t => tab === "all" || t.status === tab).map(t => (
            <tr key={t.id}>
              <td><span className="t-mono t-tiny" style={{ color: "var(--fg-3)" }}>{t.id}</span></td>
              <td><span className="t-mono" style={{ color: "var(--fg-1)", fontWeight: 500 }}>{t.res}</span></td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{t.win}</td>
              <td className="t-tiny" style={{ color: "var(--fg-3)" }}>{t.submitted}</td>
              <td>
                {t.status === "approved" && <span className="badge badge-success">Approved</span>}
                {t.status === "pending" && <span className="badge badge-warning">Pending</span>}
                {t.status === "rejected" && <span className="badge badge-danger">Rejected</span>}
                {t.status === "expired" && <span className="badge">Expired</span>}
              </td>
              <td style={{ fontSize: 12, color: t.status === "rejected" ? "var(--danger-fg)" : "var(--fg-3)", maxWidth: 320 }}>
                {t.rejection || t.reason || "—"}
              </td>
              <td style={{ textAlign: "right" }}>
                {t.status === "approved" && <button className="btn btn-sm">Extend</button>}
                {t.status === "expired" && <button className="btn btn-sm">Re-request</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const EndUserSettingsScreen = () => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
    <PageHeader title="Settings" description="Profile, password, two-factor, and notification preferences."/>
    <div className="scroll-area" style={{ flex: 1, overflow: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <div className="card-header"><span className="h-card">Profile</span></div>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field"><label className="field-label">Display name</label><input className="input" defaultValue="Aria Chen"/></div>
          <div className="field"><label className="field-label">Email</label><input className="input" defaultValue="aria.chen@northwind.com" disabled/></div>
          <div className="field"><label className="field-label">Time zone</label><select className="input"><option>America/New_York</option></select></div>
          <div className="field"><label className="field-label">Default connect method</label><select className="input"><option>Web</option><option>SSH</option></select></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Security</span></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <SettingRow title="Change password" desc="Last changed 47 days ago." action={<button className="btn btn-sm">Change</button>}/>
          <SettingRow title="Two-factor authentication" desc="TOTP authenticator app · enrolled" action={<><span className="badge badge-success">Enabled</span><button className="btn btn-sm">Manage</button></>}/>
          <SettingRow title="Backup codes" desc="3 of 10 codes remaining." action={<button className="btn btn-sm">Regenerate</button>}/>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">Notifications</span></div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { l: "Email me when my access is approved", on: true },
            { l: "Email me when my access is about to expire", on: true },
            { l: "Slack DM when access is rejected", on: false },
            { l: "Weekly summary of my sessions", on: false },
          ].map((n, i) => (
            <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--fg-2)", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked={n.on} style={{ accentColor: "var(--brand)" }}/>
              {n.l}
            </label>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="h-card">XecureAccess client</span></div>
        <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--brand-soft)", color: "var(--brand-fg)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="download" size={20}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ font: "600 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>Download desktop client</div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>Required for native RDP and SSH thick-client sessions.</div>
          </div>
          <button className="btn btn-sm">Windows</button>
          <button className="btn btn-sm">macOS</button>
          <button className="btn btn-sm">Linux</button>
        </div>
      </div>
    </div>
  </div>
);

const SettingRow = ({ title, desc, action }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ flex: 1 }}>
      <div style={{ font: "500 13.5px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{title}</div>
      <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{desc}</div>
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{action}</div>
  </div>
);

window.EndUserSidebar = EndUserSidebar;
window.EndUserDashboard = EndUserDashboard;
window.MyResourcesScreen = MyResourcesScreen;
window.MyTicketsScreen = MyTicketsScreen;
window.EndUserSettingsScreen = EndUserSettingsScreen;
window.END_USER_NAV = END_USER_NAV;
