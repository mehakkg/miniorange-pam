// Main app screens — Dashboard, Resources, Credentials, People, Policies, etc.

// ============ Dashboard ============
const DashboardScreen = () => {
  const [view, setView] = React.useState("ops");
  return (
    <div className="scroll-area" style={{ flex: 1, overflow: "auto" }}>
      <PageHeader
        title="Dashboard"
        description="Operational visibility across access, security, and compliance"
        actions={<>
          <button className="btn"><Icon name="download" size={13}/> Export</button>
          <button className="btn btn-primary"><Icon name="plus" size={13}/> New report</button>
        </>}
      />
      {/* View tabs */}
      <div style={{ padding: "12px 24px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 4 }}>
        {[
          { id: "ops",        label: "Operational", count: 4 },
          { id: "security",   label: "Security posture" },
          { id: "compliance", label: "Compliance" },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: "8px 14px", marginBottom: -1,
            border: "none", background: "transparent",
            color: view === t.id ? "var(--fg-1)" : "var(--fg-3)",
            font: "500 13px/1 var(--font-sans)",
            borderBottom: `2px solid ${view === t.id ? "var(--brand)" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            {t.label}
            {t.count && <span className="badge badge-brand" style={{ fontSize: 10 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {view === "ops" && <OperationalView/>}
        {view === "security" && <SecurityView/>}
        {view === "compliance" && <AuditComplianceView/>}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, change, tone = "default", icon, trend }) => (
  <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-surface-2)", color: "var(--fg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={14}/></div>}
      <div className="t-tiny" style={{ flex: 1 }}>{label}</div>
    </div>
    <div style={{ font: "600 26px/1.1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.4px" }}>{value}</div>
    {change && <div style={{ fontSize: 12, color: tone === "danger" ? "var(--danger-fg)" : tone === "warning" ? "var(--warning-fg)" : "var(--fg-3)" }}>{change}</div>}
  </div>
);

const OperationalView = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <StatCard icon="sessions" label="Active sessions"     value="4"   change="3 SSH · 1 DB"/>
      <StatCard icon="tickets"  label="Pending approvals"   value="3"   change="1 critical · SLA 8 min" tone="danger"/>
      <StatCard icon="refresh"  label="Rotation failures"   value="1"   change="ledger-mongo-cluster" tone="warning"/>
      <StatCard icon="discovery"label="New discovery alerts" value="6"  change="2 high criticality" tone="warning"/>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="h-card">Live sessions</span>
          <div style={{ flex: 1 }}/>
          <span className="badge"><span className="dot dot-success pulse-dot"/> 4 active</span>
          <button className="btn btn-ghost btn-sm">View all</button>
        </div>
        <table className="table">
          <thead><tr><th>User</th><th>Resource</th><th>Protocol</th><th>Duration</th><th></th></tr></thead>
          <tbody>
            {SEED_SESSIONS.filter(s => s.status === "active").map(s => (
              <tr key={s.id}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar name={s.user} size={22}/><span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{s.user}</span></div></td>
                <td><span className="t-mono" style={{ color: "var(--fg-2)" }}>{s.resource}</span>{s.flagged && <span className="badge badge-danger" style={{ marginLeft: 6 }}>Break-glass</span>}</td>
                <td><span className="badge">{s.protocol}</span></td>
                <td className="t-mono" style={{ color: "var(--fg-3)" }}>{s.duration}</td>
                <td style={{ textAlign: "right" }}><button className="btn btn-ghost btn-sm">Monitor</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header"><span className="h-card">Pending approvals</span><div style={{ flex: 1 }}/><span className="badge badge-danger">1 critical</span></div>
        <div>
          {SEED_TICKETS.filter(t => t.status === "pending").slice(0, 3).map((t, i) => (
            <div key={t.id} style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className="t-mono t-tiny" style={{ color: "var(--fg-4)" }}>{t.id}</span>
                <span className="badge" style={{
                  background: t.priority === "critical" ? "var(--danger-soft)" : t.priority === "high" ? "var(--warning-soft)" : "var(--bg-surface-2)",
                  color: t.priority === "critical" ? "var(--danger-fg)" : t.priority === "high" ? "var(--warning-fg)" : "var(--fg-3)",
                  borderColor: "transparent", textTransform: "capitalize",
                }}>{t.priority}</span>
                <span className="badge" style={{ borderColor: "transparent" }}>{t.type}</span>
                <div style={{ flex: 1 }}/>
                <span className="t-tiny" style={{ color: "var(--fg-4)" }}>SLA {t.sla}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Avatar name={t.requester} size={20}/>
                <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{t.requester}</span>
                <Icon name="arrow-right" size={11} color="var(--fg-4)"/>
                <span className="t-mono" style={{ color: "var(--fg-2)", fontSize: 12 }}>{t.resource}</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginBottom: 8 }}>{t.reason}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm btn-primary">Approve</button>
                <button className="btn btn-sm">Modify</button>
                <button className="btn btn-sm btn-ghost">Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <AlertsCard/>
      <RotationCard/>
    </div>
  </>
);

const AlertsCard = () => (
  <div className="card">
    <div className="card-header"><span className="h-card">Recent alerts</span></div>
    <div>
      {[
        { kind: "danger",  icon: "alert-triangle", title: "Rotation failed: ledger-mongo-cluster", time: "2h ago", detail: "Bind credentials rejected on retry. Likely cause: account locked." },
        { kind: "warning", icon: "fire",           title: "Unusual JIT volume from Diego Vasquez", time: "12 min ago", detail: "5 critical-resource requests in 30 min. Pattern flagged for review." },
        { kind: "warning", icon: "clock",          title: "Stale credential: stripe-webhook-key",    time: "Yesterday",   detail: "112 days since rotation. Auto-rotate is disabled." },
        { kind: "info",    icon: "discovery",      title: "Discovery scan completed",                time: "5 min ago",  detail: "6 new accounts on 3 unmanaged hosts. 2 marked critical." },
      ].map((a, i) => (
        <div key={i} style={{ padding: "12px 20px", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)", display: "flex", gap: 10 }}>
          <Icon name={a.icon} size={16} color={`var(--${a.kind}-fg)`}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ font: "500 13px/1.3 var(--font-sans)", color: "var(--fg-1)" }}>{a.title}</span>
              <span className="t-tiny" style={{ color: "var(--fg-4)" }}>· {a.time}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{a.detail}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RotationCard = () => (
  <div className="card">
    <div className="card-header"><span className="h-card">Rotation status</span><div style={{ flex: 1 }}/><span className="t-tiny">Last 30 days</span></div>
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ font: "600 32px/1 var(--font-sans)", color: "var(--fg-1)", letterSpacing: "-0.5px" }}>94.7%</span>
        <span className="t-tiny" style={{ color: "var(--success-fg)" }}>+1.2% vs prior</span>
      </div>
      <div style={{ display: "flex", height: 6, borderRadius: 9999, overflow: "hidden", background: "var(--bg-surface-2)" }}>
        <div style={{ flex: 94.7, background: "var(--success)" }}/>
        <div style={{ flex: 3.1, background: "var(--warning)" }}/>
        <div style={{ flex: 2.2, background: "var(--danger)" }}/>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12 }}>
        <span style={{ color: "var(--fg-2)" }}><span className="dot dot-success" style={{ marginRight: 6 }}/>Success 178</span>
        <span style={{ color: "var(--fg-2)" }}><span className="dot dot-warning" style={{ marginRight: 6 }}/>Skipped 6</span>
        <span style={{ color: "var(--fg-2)" }}><span className="dot dot-danger" style={{ marginRight: 6 }}/>Failed 4</span>
      </div>
    </div>
  </div>
);

const SecurityView = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <StatCard icon="shield" label="Risk score"            value="72" change="Moderate · 4 actions to lower" tone="warning"/>
      <StatCard icon="key"    label="Over-privileged accounts" value="11" change="3 admin · 8 operator"/>
      <StatCard icon="clock"  label="Stale credentials"      value="7"  change="Last rotated > 90 days" tone="warning"/>
      <StatCard icon="fire"   label="Anomalies (24h)"        value="2"  change="Both pending review" tone="danger"/>
    </div>
    <div className="card">
      <div className="card-header"><span className="h-card">Top sessions at risk</span></div>
      <table className="table">
        <thead><tr><th>Resource</th><th>User</th><th>Risk signal</th><th>Started</th><th></th></tr></thead>
        <tbody>
          {[
            { res: "ledger-mongo-cluster", user: "Priya Iyer", sig: "Break-glass + recording disabled (recovered)", time: "11:58", critical: true },
            { res: "prod-db-primary",      user: "Marcus Chen", sig: "Off-hours access · pattern unusual", time: "01:14" },
            { res: "k8s-control-plane-aws",user: "Olivia Brookes", sig: "Long-running session > 3h", time: "09:51" },
          ].map((r, i) => (
            <tr key={i}>
              <td><span className="t-mono" style={{ color: "var(--fg-1)" }}>{r.res}</span></td>
              <td><div className="row"><Avatar name={r.user} size={20}/><span>{r.user}</span></div></td>
              <td>{r.critical ? <span className="badge badge-danger">{r.sig}</span> : <span style={{ color: "var(--fg-2)" }}>{r.sig}</span>}</td>
              <td className="t-mono" style={{ color: "var(--fg-3)" }}>{r.time}</td>
              <td><button className="btn btn-sm">Review</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

const ComplianceView = () => (
  <>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      <StatCard icon="file-text" label="Recordings (7 days)" value="412" change="8.4 GB · 100% retention"/>
      <StatCard icon="certificates" label="Certs expiring < 30d" value="3" change="2 production · 1 staging" tone="warning"/>
      <StatCard icon="refresh" label="Rotation success rate" value="94.7%"/>
      <StatCard icon="check-circle" label="Audit readiness" value="92%" change="SOC 2 + PCI · 4 gaps"/>
    </div>
    <div className="card">
      <div className="card-header"><span className="h-card">Recent session recordings</span><div style={{ flex: 1 }}/><button className="btn btn-sm"><Icon name="download" size={12}/> Export bundle</button></div>
      <table className="table">
        <thead><tr><th>Session</th><th>User</th><th>Resource</th><th>Duration</th><th>Size</th><th></th></tr></thead>
        <tbody>
          {SEED_SESSIONS.filter(s => s.status === "ended").slice(0, 4).map(s => (
            <tr key={s.id}>
              <td><span className="t-mono">{s.id}</span></td>
              <td>{s.user}</td>
              <td><span className="t-mono">{s.resource}</span></td>
              <td className="t-mono">{s.duration}</td>
              <td className="t-mono">{(Math.random()*40+5).toFixed(1)} MB</td>
              <td><button className="btn btn-ghost btn-sm"><Icon name="play" size={11}/> Replay</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

window.DashboardScreen = DashboardScreen;
